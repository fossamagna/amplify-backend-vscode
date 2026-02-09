import * as vscode from "vscode";
import { StackResourceSummary } from "@aws-sdk/client-cloudformation";
import { AmplifyBackendResourceTreeNode } from "./amplify-backend-resource-tree-node";
import Auth from "../auth/credentials";
import { AuthNode } from "./auth-node";
import { AmplifyBackendBaseNode } from "./amplify-backend-base-node";
import { detectAmplifyProjects } from "./amplify-project-detector";
import { getAmplifyProject } from "../project";
import {
  DefaultResourceFilterProvider,
  ResourceFilterProvider,
} from "./resource-filter";
import { AWSClientProvider } from "../client/provider";
import { logger } from "../logger";
import {
  AmplifyBackendResourceCache,
  CachedStackResource,
  CachedAmplifyProject,
} from "./amplify-backend-resource-cache";
import { buildUrl, UriComponents } from "../console-url-builder";

export interface FilteredTreeNode {
  type: "resource";
  data: CachedStackResource;
  children: FilteredTreeNode[];
  consoleUrl?: string | UriComponents;
}

export interface ProjectTreeNode {
  type: "project";
  data: CachedAmplifyProject;
  children: FilteredTreeNode[];
  consoleUrl?: string | UriComponents;
}

class FilteredTreeNodeImpl implements FilteredTreeNode {
  type: "resource" = "resource" as const;
  data: CachedStackResource;
  children: FilteredTreeNode[];

  constructor(data: CachedStackResource, children: FilteredTreeNode[] = []) {
    this.data = data;
    this.children = children;
  }

  get consoleUrl(): string | UriComponents | undefined {
    return this.data && buildUrl({ ...this.data });
  }
}

class ProjectTreeNodeImpl implements ProjectTreeNode {
  type: "project" = "project" as const;
  data: CachedAmplifyProject;
  children: FilteredTreeNode[];

  constructor(data: CachedAmplifyProject, children: FilteredTreeNode[] = []) {
    this.data = data;
    this.children = children;
  }

  get consoleUrl(): string | UriComponents | undefined {
    return (
      this.data &&
      buildUrl({
        ...this.data,
        physicalResourceId: this.data.stackArn,
        resourceType: "AWS::CloudFormation::Stack",
      })
    );
  }
}

export type TreeNode = ProjectTreeNode | FilteredTreeNode | AuthNode;

export class AmplifyBackendTreeDataProvider
  implements vscode.TreeDataProvider<TreeNode>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    TreeNode | undefined | void
  > = new vscode.EventEmitter<TreeNode | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined | void> =
    this._onDidChangeTreeData.event;

  private searchFilter: string = "";
  private resourceCache: AmplifyBackendResourceCache;
  private filteredTree: (ProjectTreeNode | FilteredTreeNode)[] = [];

  constructor(
    private workspaceRoot: string,
    private resourceFilterProvider: ResourceFilterProvider,
    private awsClientProvider: AWSClientProvider,
  ) {
    this.resourceCache = new AmplifyBackendResourceCache(awsClientProvider);
  }

  refresh() {
    logger.debug("AmplifyBackendTreeDataProvider: Refreshing tree view");
    this.resourceCache.clear();
    this.filteredTree = [];
    this._onDidChangeTreeData.fire();
  }

  setSearchFilter(filter: string) {
    this.searchFilter = filter.toLowerCase();
    this.rebuildFilteredTree();
    this._onDidChangeTreeData.fire();
  }

  getSearchFilter(): string {
    return this.searchFilter;
  }

  clearSearchFilter() {
    this.searchFilter = "";
    this.rebuildFilteredTree();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
    if (element instanceof AuthNode) {
      return element;
    }
    return this.createTreeItemFromNode(element);
  }

  /**
   * Rebuild the filtered tree based on current search filter and resource filter
   */
  private rebuildFilteredTree(): void {
    this.filteredTree = [];

    const cachedProjects = this.resourceCache.getCachedProjects();
    if (cachedProjects.length === 0) {
      return;
    }

    const predicate = this.resourceFilterProvider.getResourceFilterPredicate();

    for (const project of cachedProjects) {
      const filteredNode = this.filterProject(project, predicate);
      if (filteredNode) {
        this.filteredTree.push(filteredNode);
      }
    }
  }

  /**
   * Filter a project and its resources recursively
   */
  private filterProject(
    project: CachedAmplifyProject,
    predicate: (resource: StackResourceSummary) => boolean,
  ): ProjectTreeNode | null {
    const filteredChildren = this.filterResources(project.resources, predicate);

    // If search filter is active and no children match, exclude this project
    if (this.searchFilter && filteredChildren.length === 0) {
      return null;
    }

    return new ProjectTreeNodeImpl(project, filteredChildren);
  }

  /**
   * Filter resources recursively (bottom-up approach)
   */
  private filterResources(
    resources: CachedStackResource[],
    predicate: (resource: StackResourceSummary) => boolean,
  ): FilteredTreeNode[] {
    const filtered: FilteredTreeNode[] = [];

    for (const resource of resources) {
      // Apply resource type filter
      if (
        !predicate({
          LogicalResourceId: resource.logicalResourceId,
          ResourceType: resource.resourceType,
          PhysicalResourceId: resource.physicalResourceId,
        } as StackResourceSummary)
      ) {
        continue;
      }

      if (resource.resourceType === "AWS::CloudFormation::Stack") {
        // For nested stacks, recursively filter children
        const filteredChildren = resource.children
          ? this.filterResources(resource.children, predicate)
          : [];

        // If search filter is active, only include stack if it has matching descendants
        if (this.searchFilter && filteredChildren.length === 0) {
          continue;
        }

        filtered.push(new FilteredTreeNodeImpl(resource, filteredChildren));
      } else {
        // For non-stack resources, check if they match the search filter
        if (this.searchFilter) {
          if (
            !resource.logicalResourceId
              ?.toLowerCase()
              .includes(this.searchFilter) &&
            !resource.resourceType?.toLowerCase().includes(this.searchFilter)
          ) {
            continue;
          }
        }

        filtered.push(new FilteredTreeNodeImpl(resource));
      }
    }

    return filtered;
  }

  private async getRootChildren() {
    const client = await this.awsClientProvider.getCloudFormationClient();
    const projects = await detectAmplifyProjects(this.workspaceRoot);
    const amplifyProjects = await Promise.all(
      projects.map((project) => getAmplifyProject(project, client)),
    );

    // Load all projects into cache if not already loaded
    if (this.resourceCache.getCachedProjects().length === 0) {
      await this.resourceCache.loadProjects(amplifyProjects);
      this.rebuildFilteredTree();
    }

    const children: TreeNode[] = [];
    const profile = Auth.instance.getProfile();
    const filterName = this.resourceFilterProvider.getResourceFilterName();
    let label =
      filterName === DefaultResourceFilterProvider.NONE_FILTER_NAME
        ? `Connected with profile: ${profile}`
        : `Connected with profile ${profile} and resources filtered with ${filterName}`;

    // Add search filter info to label
    if (this.searchFilter) {
      label += ` (searching: "${this.searchFilter}")`;
    }

    children.push(new AuthNode(label, profile));

    // Convert filtered tree nodes to tree items
    if (this.filteredTree.length > 0) {
      children.push(...this.filteredTree);
    } else if (this.resourceCache.getCachedProjects().length === 0) {
      vscode.window.showInformationMessage(
        "Workspace has no amplify artifacts in .amplify/artifacts/cdk.out",
      );
    }

    return Promise.resolve(children);
  }

  /**
   * Create a tree item from a filtered node
   */
  private createTreeItemFromNode(
    node: ProjectTreeNode | FilteredTreeNode,
  ): AmplifyBackendBaseNode {
    if (node.type === "project") {
      const project = node.data;
      return new AmplifyBackendResourceTreeNode({
        label: project.stackName,
        cloudformationType: "AWS::CloudFormation::Stack",
        backendIdentifier: project.backendIdentifier,
        resource: {
          PhysicalResourceId: project.stackArn,
          ResourceType: "AWS::CloudFormation::Stack",
        },
        region: project.region,
        accountId: project.accountId,
      });
    } else {
      const resource = node.data;
      return new AmplifyBackendResourceTreeNode({
        label: resource.logicalResourceId,
        cloudformationType: resource.resourceType,
        backendIdentifier: resource.backendIdentifier,
        resource: {
          PhysicalResourceId: resource.physicalResourceId,
          ResourceType: resource.resourceType,
        },
        region: resource.region,
        accountId: resource.accountId,
      });
    }
  }

  getChildren(element?: TreeNode): vscode.ProviderResult<TreeNode[]> {
    if (element) {
      if (element instanceof AuthNode) {
        return [];
      }
      return element.children;
    } else {
      return this.getRootChildren();
    }
  }
}
