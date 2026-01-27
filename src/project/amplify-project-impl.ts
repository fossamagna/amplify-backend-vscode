import * as fs from "node:fs";
import * as path from "node:path";
import { BackendIdentifierConversions } from "@aws-amplify/platform-core";
import type { AmplifyProject } from "./types";
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { logger } from "../logger";

export class AmplifyProjectImpl implements AmplifyProject {
  private readonly relativeCloudAssemblyLocation = ".amplify/artifacts/cdk.out";

  constructor(
    private amplifyProjectPath: string,
    private client: CloudFormationClient
  ) { }

  async getStackArn(): Promise<string | undefined> {
    // Get stack ARN using CloudFormation DescribeStacks API
    const stackName = this.getStackName();
    if (!stackName) {
      logger.debug("Stack name not found, cannot retrieve stack ARN");
      return undefined;
    }
    try {
      logger.debug(`Describing CloudFormation stack: ${stackName}`);
      const client = this.client;
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await client.send(command);
      if (!response.Stacks) {
        logger.warn(`No stacks found for stack name: ${stackName}`);
        return undefined;
      }
      const stack = response.Stacks.find(
        (s: { StackName?: string }) => s.StackName === stackName
      );
      if (stack?.StackId) {
        logger.debug(`Retrieved stack ARN: ${stack.StackId}`);
      }
      return stack?.StackId;
    } catch (error) {
      logger.error(
        `Failed to describe stack: ${stackName}`,
        error instanceof Error ? error : new Error(String(error))
      );
      return undefined;
    }
  }

  getStackName(): string | undefined {
    const manifestJsonPath = this.getManifestJsonPath();
    if (this.pathExists(manifestJsonPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestJsonPath, "utf-8"));
        const stackName = Object.entries(manifest.artifacts)
          .filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ([, value]: [string, any]) =>
              value.type === "aws:cloudformation:stack"
          )
          .map(([key]: [string, unknown]) => key)[0];
        logger.debug(`Found stack name: ${stackName} in ${manifestJsonPath}`);
        return stackName;
      } catch (error) {
        logger.error(
          `Failed to parse manifest.json at ${manifestJsonPath}`,
          error instanceof Error ? error : new Error(String(error))
        );
        return undefined;
      }
    } else {
      logger.debug(`Manifest file not found: ${manifestJsonPath}`);
      return undefined;
    }
  }

  getBackendIdentifier() {
    const stackName = this.getStackName();
    return BackendIdentifierConversions.fromStackName(stackName);
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      return false;
    }
    return true;
  }

  private getManifestJsonPath(): string {
    return path.join(
      this.amplifyProjectPath,
      this.relativeCloudAssemblyLocation,
      "manifest.json"
    );
  }
}
