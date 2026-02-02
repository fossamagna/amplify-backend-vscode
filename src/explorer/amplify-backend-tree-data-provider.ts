import * as vscode from "vscode";
import { StackResourceSummary } from "@aws-sdk/client-cloudformation";
import { AmplifyBackendResourceTreeNode } from "./amplify-backend-resource-tree-node";
import Auth from "../auth/credentials";
import { AuthNode } from "./auth-node";
import { AmplifyBackendBaseNode } from "./amplify-backend-base-node";
import { isStackNode } from "./utils";
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

/**
 * Filtered tree node that holds both the resource data and its filtered children
 */
interface FilteredTreeNode {
  type: "project" | "resource";
  data: CachedAmplifyProject | CachedStackResource;
  children: FilteredTreeNode[];
}

export class AmplifyBackendTreeDataProvider
  implements vscode.TreeDataProvider<AmplifyBackendBaseNode>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    AmplifyBackendBaseNode | undefined | void
  > = new vscode.EventEmitter<AmplifyBackendBaseNode | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AmplifyBackendBaseNode | undefined | void
  > = this._onDidChangeTreeData.event;

  private searchFilter: string = "";
  private resourceCache: AmplifyBackendResourceCache;
  private filteredTree: FilteredTreeNode[] = [];
  private nodeMap = new Map<string, FilteredTreeNode>();

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
    this.nodeMap.clear();
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

  getTreeItem(
    element: AmplifyBackendBaseNode,
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  /**
   * Rebuild the filtered tree based on current search filter and resource filter
   */
  private rebuildFilteredTree(): void {
    this.filteredTree = [];
    this.nodeMap.clear();

    const cachedProjects = this.resourceCache.getCachedProjects();
    if (cachedProjects.length === 0) {
      return;
    }

    const predicate = this.resourceFilterProvider.getResourceFilterPredicate();

    for (const project of cachedProjects) {
      const filteredNode = this.filterProject(project, predicate);
      if (filteredNode) {
        this.filteredTree.push(filteredNode);
        this.nodeMap.set(this.getNodeKey(project), filteredNode);
      }
    }
  }

  /**
   * Filter a project and its resources recursively
   */
  private filterProject(
    project: CachedAmplifyProject,
    predicate: (resource: StackResourceSummary) => boolean,
  ): FilteredTreeNode | null {
    const filteredChildren = this.filterResources(project.resources, predicate);

    // If search filter is active and no children match, exclude this project
    if (this.searchFilter && filteredChildren.length === 0) {
      return null;
    }

    return {
      type: "project",
      data: project,
      children: filteredChildren,
    };
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
          LastUpdatedTimestamp: new Date(),
          ResourceStatus: "CREATE_COMPLETE",
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

        const node: FilteredTreeNode = {
          type: "resource",
          data: resource,
          children: filteredChildren,
        };
        filtered.push(node);
        this.nodeMap.set(this.getNodeKey(resource), node);
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

        const node: FilteredTreeNode = {
          type: "resource",
          data: resource,
          children: [],
        };
        filtered.push(node);
        this.nodeMap.set(this.getNodeKey(resource), node);
      }
    }

    return filtered;
  }

  /**
   * Generate a unique key for a node
   */
  private getNodeKey(
    data: CachedAmplifyProject | CachedStackResource,
  ): string {
    if ("stackName" in data) {
      return `project:${data.stackName}`;
    }
    return `resource:${data.backendIdentifier.namespace}:${data.backendIdentifier.name}:${data.logicalResourceId}`;
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

    const children: AmplifyBackendBaseNode[] = [];
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
      for (const node of this.filteredTree) {
        const treeItem = this.createTreeItemFromNode(node);
        if (treeItem) {
          children.push(treeItem);
        }
      }
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
    node: FilteredTreeNode,
  ): AmplifyBackendBaseNode | null {
    const data = node.data;

    if (node.type === "project") {
      const project = data as CachedAmplifyProject;
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
      const resource = data as CachedStackResource;
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

  getChildren(
    element?: AmplifyBackendBaseNode,
  ): vscode.ProviderResult<AmplifyBackendBaseNode[]> {
    if (element) {
      if (isStackNode(element)) {
        // Find the filtered node for this element
        const nodeKey = this.getNodeKeyFromElement(element);
        const filteredNode = this.nodeMap.get(nodeKey);

        if (filteredNode && filteredNode.children.length > 0) {
          // Return children as tree items
          return filteredNode.children.map((child) =>
            this.createTreeItemFromNode(child),
          ).filter((item): item is AmplifyBackendBaseNode => item !== null);
        }
        return [];
      } else {
        return [];
      }
    } else {
      return this.getRootChildren();
    }
  }

  /**
   * Generate a node key from a tree element
   */
  private getNodeKeyFromElement(element: AmplifyBackendBaseNode): string {
    if (isStackNode(element)) {
      const node = element as AmplifyBackendResourceTreeNode;
      // Check if this is a root stack (project) or nested stack
      const cachedProjects = this.resourceCache.getCachedProjects();
      for (const project of cachedProjects) {
        if (project.stackName === element.label) {
          return `project:${project.stackName}`;
        }
      }
      // It's a nested stack resource
      return `resource:${node.backendIdentifier.namespace}:${node.backendIdentifier.name}:${element.label}`;
    }
    return "";
  }
}
