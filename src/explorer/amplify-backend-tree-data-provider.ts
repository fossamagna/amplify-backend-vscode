import * as vscode from "vscode";
import {
  ListStackResourcesCommand,
  ListStackResourcesCommandInput,
  StackResourceSummary,
} from "@aws-sdk/client-cloudformation";
import { parse } from "@aws-sdk/util-arn-parser";
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
import { AWSClientProvider } from "../client/provider";

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
    private resourceFilterProvider: ResourceFilterProvider,
    private awsClientProvider: AWSClientProvider,
  ) {}

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(
    element: AmplifyBackendBaseNode,
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  private async getStackResources(
    backendIdentifier: BackendIdentifier,
    stackName: string,
    region?: string,
    accountId?: string,
  ): Promise<AmplifyBackendBaseNode[]> {
    const client = await this.awsClientProvider.getCloudFormationClient();
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
      resources.push(...response.StackResourceSummaries);
    } while (nextToken);
    const predicate = this.resourceFilterProvider.getResourceFilterPredicate();
    return resources.filter(predicate).map((resource) => {
      return new AmplifyBackendResourceTreeNode({
        label: resource.LogicalResourceId!,
        cloudformationType: resource.ResourceType!,
        backendIdentifier,
        resource,
        region,
        accountId,
      });
    });
  }

  private async getRootChildren() {
    const client = await this.awsClientProvider.getCloudFormationClient();
    const projects = await detectAmplifyProjects(this.workspaceRoot);
    const amplifyNodes = await Promise.allSettled(
      projects
        .map((project) => getAmplifyProject(project, client))
        .map((project) => this.getResourcesInAmplifyProject(project)),
    );
    const nodes = amplifyNodes
      .filter(
        (result): result is PromiseFulfilledResult<AmplifyBackendBaseNode> =>
          result.status === "fulfilled" && !!result.value,
      )
      .map((result) => result.value);

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
        "Workspace has no amplify artifacts in .amplify/artifacts/cdk.out",
      );
    }
    return Promise.resolve(children);
  }

  getChildren(
    element?: AmplifyBackendBaseNode,
  ): vscode.ProviderResult<AmplifyBackendBaseNode[]> {
    if (element) {
      if (isStackNode(element)) {
        return this.getStackResources(
          element.backendIdentifier,
          element.resource?.PhysicalResourceId ?? element.label,
          element.region,
          element.accountId,
        );
      } else {
        return [];
      }
    } else {
      return this.getRootChildren();
    }
  }

  private async getResourcesInAmplifyProject(
    amplifyProject: AmplifyProject,
  ): Promise<AmplifyBackendBaseNode | undefined> {
    const stackName = amplifyProject.getStackName();
    const backendIdentifier = amplifyProject.getBackendIdentifier();
    const stackArn = await amplifyProject.getStackArn();
    const { region, accountId } = parse(stackArn ?? "");
    if (stackName && backendIdentifier) {
      return new AmplifyBackendResourceTreeNode({
        label: stackName,
        cloudformationType: "AWS::CloudFormation::Stack",
        backendIdentifier,
        resource: {
          PhysicalResourceId: stackArn,
          ResourceType: "AWS::CloudFormation::Stack",
        },
        region,
        accountId,
      });
    }
  }
}
