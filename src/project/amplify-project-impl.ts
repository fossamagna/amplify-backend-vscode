import * as fs from "node:fs";
import * as path from "node:path";
import { BackendIdentifierConversions } from "@aws-amplify/platform-core";
import type { AmplifyProject } from "./types";

export class AmplifyProjectImpl implements AmplifyProject {
  private readonly relativeCloudAssemblyLocation = ".amplify/artifacts/cdk.out";

  constructor(private amplifyProjectPath: string) {}

  getStackName(): string | undefined {
    const manifestJsonPath = this.getManifestJsonPath();
    if (this.pathExists(manifestJsonPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestJsonPath, "utf-8"));
      const stackName = Object.entries(manifest.artifacts)
        .filter(
          ([key, value]: [string, any]) =>
            value.type === "aws:cloudformation:stack"
        )
        .map(([key, value]: [string, any]) => key)[0];
      return stackName;
    }
  }

  getBackendIdentifier() {
    const stackName = this.getStackName();
    return BackendIdentifierConversions.fromStackName(stackName);
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
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
