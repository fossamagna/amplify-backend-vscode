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
import { detectAmplifyProjects } from "./amplify-project-detector";

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

  private async getManifestJsonPaths(): Promise<string[]> {
    const projects = await detectAmplifyProjects(this.workspaceRoot);
    return projects.map((project) => this.getManifestJsonPath(project));
  }

  private getManifestJsonPath(amplifyProjectPath: string): string {
    return path.join(
      amplifyProjectPath,
      this.relativeCloudAssemblyLocation,
      "manifest.json"
    );
  }

  private async getRootChildren() {
    const manifestJsonPaths = await this.getManifestJsonPaths();
    const existManifestPaths = manifestJsonPaths.filter((manifestJsonPath) =>
      this.pathExists(manifestJsonPath)
    );
    if (existManifestPaths.length) {
      const profile = Auth.instance.getProfile();
      return Promise.resolve([
        new AuthNode(`Connected with profile: ${profile}`, profile),
        ...existManifestPaths
          .map((manifestJsonPath) =>
            this.getResourcesInManifest(manifestJsonPath)
          )
          .flat(),
      ]);
    } else {
      vscode.window.showInformationMessage(
        "Workspace has no amplify artifacts in .amplify/artifacts/cdk.out"
      );
      return Promise.resolve([]);
    }
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
      return this.getRootChildren();
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
