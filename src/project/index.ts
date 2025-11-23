import type { AmplifyProject } from "./types";
import { AmplifyProjectImpl } from "./amplify-project-impl";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";

export { AmplifyProject } from "./types";

export const getAmplifyProject = (
  amplifyProjectPath: string,
  client: CloudFormationClient
): AmplifyProject => {
  return new AmplifyProjectImpl(amplifyProjectPath, client);
};
