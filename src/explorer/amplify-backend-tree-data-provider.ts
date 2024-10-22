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
import { AmplifyProject, getAmplifyProject } from "../project";
import {
  DefaultResourceFilterProvider,
  ResourceFilterProvider,
} from "./resource-filter";
import { IdentifierTreeItem } from "./identifier-tree-item";
import { SecretNameTreeItem } from "./secret-name-tree-item";
import { AmplifyBackendSecret } from "../secrets/amplify-secrets";
import { SecretListTreeItem } from "./secret-list-tree-item";

export class AmplifyBackendTreeDataProvider
  implements vscode.TreeDataProvider<AmplifyBackendBaseNode>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    AmplifyBackendBaseNode | undefined | void
  > = new vscode.EventEmitter<AmplifyBackendBaseNode | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AmplifyBackendBaseNode | undefined | void
  > = this._onDidChangeTreeData.event;

  constructor(
    private workspaceRoot: string,
    private resourceFilterProvider: ResourceFilterProvider
  ) {}

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(
    element: AmplifyBackendBaseNode
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  private async getStackResources(
    amplifyProject: AmplifyProject,
    stackName: string
  ): Promise<AmplifyBackendBaseNode[]> {
    const profile = Auth.instance.getProfile();
    const credentials = fromIni({
      profile,
    });
    const region = await Auth.instance.getRegion(profile);
    const client = new CloudFormationClient({
      credentials,
      region,
    });
    const input = {
      StackName: stackName,
    };
    const command = new DescribeStackResourcesCommand(input);
    const response = await client.send(command);
    if (!response.StackResources) {
      return [];
    }
    const predicate = this.resourceFilterProvider.getResourceFilterPredicate();
    return response.StackResources.filter(predicate).map((resource) => {
      return new AmplifyBackendResourceTreeNode(
        resource.LogicalResourceId!,
        resource.ResourceType!,
        amplifyProject,
        resource
      );
    });
  }

  private async getRootChildren() {
    const projects = await detectAmplifyProjects(this.workspaceRoot);
    const nodes = projects
      .map((project) => getAmplifyProject(project))
      .map((project) => this.getAmplifyProjectNode(project))
      .filter((node) => !!node);

    const children: AmplifyBackendBaseNode[] = [];
    const profile = Auth.instance.getProfile();
    const filterName = this.resourceFilterProvider.getResourceFilterName();
    const label =
      filterName === DefaultResourceFilterProvider.NONE_FILTER_NAME
        ? `Connected with profile: ${profile}`
        : `Connected with profile ${profile} and resources filtered with ${filterName}`;
    children.push(new AuthNode(label, profile));
    if (nodes.length) {
      children.push(...nodes);
    } else {
      vscode.window.showInformationMessage(
        "Workspace has no amplify artifacts in .amplify/artifacts/cdk.out"
      );
    }
    return Promise.resolve(children);
  }

  getChildren(
    element?: AmplifyBackendBaseNode
  ): vscode.ProviderResult<AmplifyBackendBaseNode[]> {
    if (element) {
      if (element instanceof IdentifierTreeItem) {
        return this.getChildrenOfAmplifyProject(element);
      } else if (isStackNode(element)) {
        return this.getStackResources(
          element.amplifyProject,
          element.resource?.PhysicalResourceId ??
            element.amplifyProject.getStackName()!
        );
      } else if (element instanceof SecretListTreeItem) {
        return this.getSecretList(element.amplifyProject);
      } else {
        return [];
      }
    } else {
      return this.getRootChildren();
    }
  }

  private getAmplifyProjectNode(amplifyProject: AmplifyProject) {
    return new IdentifierTreeItem(
      amplifyProject,
      vscode.TreeItemCollapsibleState.Collapsed
    );
  }

  private getChildrenOfAmplifyProject(element: IdentifierTreeItem) {
    const node = this.getResourcesInAmplifyProject(element.amplifyProject);
    const secretList = new SecretListTreeItem(element.amplifyProject);
    const nodes = [];
    if (node) {
      nodes.push(node);
    }
    nodes.push(secretList);
    return nodes;
  }

  private getResourcesInAmplifyProject(
    amplifyProject: AmplifyProject
  ): AmplifyBackendBaseNode | undefined {
    const stackName = amplifyProject.getStackName();
    const backendIdentifier = amplifyProject.getBackendIdentifier();
    if (stackName && backendIdentifier) {
      return new AmplifyBackendResourceTreeNode(
        "Resources",
        "AWS::CloudFormation::Stack",
        amplifyProject
      );
    }
  }

  private async getSecretList(
    amplifyProject: AmplifyProject
  ): Promise<SecretNameTreeItem[]> {
    const secretsClient = new AmplifyBackendSecret(
      amplifyProject.getBackendIdentifier()!
    );
    const secretsList = await secretsClient.listSecrets();
    return secretsList.map((name) => {
      return new SecretNameTreeItem(
        amplifyProject,
        name,
        vscode.TreeItemCollapsibleState.None
      );
    });
  }
}
