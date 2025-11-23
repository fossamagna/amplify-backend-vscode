import type { BackendIdentifier } from "@aws-amplify/plugin-types";

export interface AmplifyProject {
  getStackName(): string | undefined;
  getBackendIdentifier(): BackendIdentifier | undefined;
  getStackArn(): Promise<string | undefined>;
}
