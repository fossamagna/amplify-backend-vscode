import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
} from "@aws-sdk/client-cloudformation";
import { fromIni } from "@aws-sdk/credential-providers";
import { AmplifyBackendResourceTreeNode } from "./amplify-backend-resource-tree-node";
import Auth from "../auth/credentials";
import { AuthNode } from "./auth-node";
import { AmplifyBackendBaseNode } from "./amplify-backend-base-node";
import { isStackNode } from "./utils";

export class AmplifyBackendTreeDataProvider
  implements vscode.TreeDataProvider<AmplifyBackendBaseNode>
{
  private readonly relativeCloudAssemblyLocation = ".amplify/artifacts/cdk.out";

  private _onDidChangeTreeData: vscode.EventEmitter<
    AmplifyBackendBaseNode | undefined | void
  > = new vscode.EventEmitter<AmplifyBackendBaseNode | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AmplifyBackendBaseNode | undefined | void
  > = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(
    element: AmplifyBackendBaseNode
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  private async getStackResources(
    stackName: string
  ): Promise<AmplifyBackendBaseNode[]> {
    const credentials = fromIni({
      profile: Auth.instance.getProfile(),
    });
    const client = new CloudFormationClient({
      credentials,
    });
    const input = {
      StackName: stackName,
    };
    const command = new DescribeStackResourcesCommand(input);
    const response = await client.send(command);
    if (!response.StackResources) {
      return [];
    }
    return response.StackResources.map((resource) => {
      return new AmplifyBackendResourceTreeNode(
        resource.LogicalResourceId!,
        resource.ResourceType!,
        resource
      );
    });
  }

  getChildren(
    element?: AmplifyBackendBaseNode
  ): vscode.ProviderResult<AmplifyBackendBaseNode[]> {
    if (element) {
      if (isStackNode(element)) {
        return this.getStackResources(
          element.resource?.PhysicalResourceId ?? element.label
        );
      } else {
        return [];
      }
    } else {
      const manifestJsonPath = path.join(
        this.workspaceRoot,
        this.relativeCloudAssemblyLocation,
        "manifest.json"
      );
      if (this.pathExists(manifestJsonPath)) {
        const profile = Auth.instance.getProfile();
        return Promise.resolve([
          new AuthNode(`Connected with profile: ${profile}`, profile),
          ...this.getResourcesInManifest(manifestJsonPath),
        ]);
      } else {
        vscode.window.showInformationMessage(
          "Workspace has no amplify artifacts in .amplify/artifacts/cdk.out"
        );
        return Promise.resolve([]);
      }
    }
  }

  private getResourcesInManifest(
    manifestJsonPath: string
  ): AmplifyBackendBaseNode[] {
    if (this.pathExists(manifestJsonPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestJsonPath, "utf-8"));
      return Object.entries(manifest.artifacts)
        .filter(
          ([key, value]: [string, any]) =>
            value.type === "aws:cloudformation:stack"
        )
        .map(
          ([key, value]: [string, any]) =>
            new AmplifyBackendResourceTreeNode(
              key,
              "AWS::CloudFormation::Stack"
            )
        );
    } else {
      return [];
    }
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }
}
