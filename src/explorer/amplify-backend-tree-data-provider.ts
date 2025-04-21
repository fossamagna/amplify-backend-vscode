import * as vscode from "vscode";
import {
  CloudFormationClient,
  ListStackResourcesCommand,
  ListStackResourcesCommandInput,
  StackResourceSummary,
} from "@aws-sdk/client-cloudformation";
import { fromIni } from "@aws-sdk/credential-providers";
import type { BackendIdentifier } from "@aws-amplify/plugin-types";
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

export class AmplifyBackendTreeDataProvider
  implements vscode.TreeDataProvider<AmplifyBackendBaseNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    AmplifyBackendBaseNode | undefined | void
  > = new vscode.EventEmitter<AmplifyBackendBaseNode | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AmplifyBackendBaseNode | undefined | void
  > = this._onDidChangeTreeData.event;

  constructor(
    private workspaceRoot: string,
    private resourceFilterProvider: ResourceFilterProvider
  ) { }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(
    element: AmplifyBackendBaseNode
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  private async getStackResources(
    backendIdentifier: BackendIdentifier,
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
    let nextToken: string | undefined;
    const resources: StackResourceSummary[] = [];
    do {
      const input: ListStackResourcesCommandInput = {
        StackName: stackName,
        NextToken: nextToken,
      };
      const command = new ListStackResourcesCommand(input);
      const response = await client.send(command);
      nextToken = response.NextToken;
      if (!response.StackResourceSummaries) {
        continue;
      }
      resources.push(...response.StackResourceSummaries)
    } while (nextToken);
    const predicate = this.resourceFilterProvider.getResourceFilterPredicate();
    return resources.filter(predicate).map((resource) => {
      return new AmplifyBackendResourceTreeNode(
        resource.LogicalResourceId!,
        resource.ResourceType!,
        backendIdentifier,
        resource,
        region,
      );
    });
  }

  private async getRootChildren() {
    const projects = await detectAmplifyProjects(this.workspaceRoot);
    const nodes = projects
      .map((project) => getAmplifyProject(project))
      .map((project) => this.getResourcesInAmplifyProject(project))
      .filter((node): node is AmplifyBackendBaseNode => !!node);

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
      if (isStackNode(element)) {
        return this.getStackResources(
          element.backendIdentifier,
          element.resource?.PhysicalResourceId ?? element.label
        );
      } else {
        return [];
      }
    } else {
      return this.getRootChildren();
    }
  }

  private getResourcesInAmplifyProject(
    amplifyProject: AmplifyProject
  ): AmplifyBackendBaseNode | undefined {
    const stackName = amplifyProject.getStackName();
    const backendIdentifier = amplifyProject.getBackendIdentifier();
    if (stackName && backendIdentifier) {
      return new AmplifyBackendResourceTreeNode(
        stackName,
        "AWS::CloudFormation::Stack",
        backendIdentifier
      );
    }
  }
}
