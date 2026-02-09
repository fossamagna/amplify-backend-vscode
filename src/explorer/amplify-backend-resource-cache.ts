import {
  ListStackResourcesCommand,
  ListStackResourcesCommandInput,
  StackResourceSummary,
} from "@aws-sdk/client-cloudformation";
import { parse } from "@aws-sdk/util-arn-parser";
import type { BackendIdentifier } from "@aws-amplify/plugin-types";
import { AWSClientProvider } from "../client/provider";
import { logger } from "../logger";
import { AmplifyProject } from "../project";

export interface CachedStackResource {
  logicalResourceId: string;
  resourceType: string;
  physicalResourceId: string;
  backendIdentifier: BackendIdentifier;
  region?: string;
  accountId?: string;
  children?: CachedStackResource[];
}

export interface CachedAmplifyProject {
  stackName: string;
  backendIdentifier: BackendIdentifier;
  resourceType: "AWS::CloudFormation::Stack";
  stackArn: string;
  region?: string;
  accountId?: string;
  resources: CachedStackResource[];
}

/**
 * Model class that manages CloudFormation API calls and caches resources
 */
export class AmplifyBackendResourceCache {
  private cache = new Map<string, CachedAmplifyProject>();
  private loading = false;

  constructor(private awsClientProvider: AWSClientProvider) {}

  /**
   * Load all Amplify projects and their resources into cache
   */
  async loadProjects(amplifyProjects: AmplifyProject[]): Promise<void> {
    this.loading = true;
    try {
      this.cache.clear();

      await Promise.all(
        amplifyProjects.map(async (project) => {
          const stackName = project.getStackName();
          const backendIdentifier = project.getBackendIdentifier();
          const stackArn = await project.getStackArn();
          const { region, accountId } = parse(stackArn ?? "");

          if (stackName && backendIdentifier) {
            const resources = await this.loadStackResourcesRecursively(
              backendIdentifier,
              stackArn ?? stackName,
              region,
              accountId,
            );

            const cachedProject: CachedAmplifyProject = {
              stackName,
              backendIdentifier,
              resourceType: "AWS::CloudFormation::Stack",
              stackArn: stackArn!,
              region,
              accountId,
              resources,
            };

            this.cache.set(stackName, cachedProject);
          }
        }),
      );
    } finally {
      this.loading = false;
    }
  }

  /**
   * Recursively load stack resources including nested stacks
   */
  private async loadStackResourcesRecursively(
    backendIdentifier: BackendIdentifier,
    stackNameOrArn: string,
    region?: string,
    accountId?: string,
  ): Promise<CachedStackResource[]> {
    try {
      const client = await this.awsClientProvider.getCloudFormationClient();
      let nextToken: string | undefined;
      const resources: StackResourceSummary[] = [];

      do {
        const input: ListStackResourcesCommandInput = {
          StackName: stackNameOrArn,
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

      // Convert to cached resources and load nested stacks
      const cachedResources: CachedStackResource[] = await Promise.all(
        resources.map(async (resource) => {
          const cachedResource: CachedStackResource = {
            logicalResourceId: resource.LogicalResourceId!,
            resourceType: resource.ResourceType!,
            physicalResourceId: resource.PhysicalResourceId!,
            backendIdentifier,
            region,
            accountId,
          };

          // Recursively load nested stack resources
          if (
            resource.ResourceType === "AWS::CloudFormation::Stack" &&
            resource.PhysicalResourceId
          ) {
            cachedResource.children =
              await this.loadStackResourcesRecursively(
                backendIdentifier,
                resource.PhysicalResourceId,
                region,
                accountId,
              );
          }

          return cachedResource;
        }),
      );

      return cachedResources;
    } catch (error) {
      logger.error(
        `Failed to list stack resources for stack: ${stackNameOrArn}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return [];
    }
  }

  /**
   * Get all cached projects
   */
  getCachedProjects(): CachedAmplifyProject[] {
    return Array.from(this.cache.values());
  }

  /**
   * Get a specific cached project by stack name
   */
  getCachedProject(stackName: string): CachedAmplifyProject | undefined {
    return this.cache.get(stackName);
  }

  /**
   * Get resources for a specific stack (including nested resources)
   */
  getResourcesForStack(
    stackName: string,
    logicalResourceId?: string,
  ): CachedStackResource[] {
    const project = this.cache.get(stackName);
    if (!project) {
      return [];
    }

    // If no logicalResourceId specified, return root resources
    if (!logicalResourceId) {
      return project.resources;
    }

    // Find the nested stack resource
    return this.findNestedStackResources(project.resources, logicalResourceId);
  }

  /**
   * Recursively find resources within nested stacks
   */
  private findNestedStackResources(
    resources: CachedStackResource[],
    logicalResourceId: string,
  ): CachedStackResource[] {
    for (const resource of resources) {
      if (resource.logicalResourceId === logicalResourceId) {
        return resource.children || [];
      }
      if (resource.children) {
        const found = this.findNestedStackResources(
          resource.children,
          logicalResourceId,
        );
        if (found.length > 0) {
          return found;
        }
      }
    }
    return [];
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if cache is currently loading
   */
  isLoading(): boolean {
    return this.loading;
  }
}
