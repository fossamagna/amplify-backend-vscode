import type { AmplifyProject } from "./types";
import { AmplifyProjectImpl } from "./amplify-project-impl";

export { AmplifyProject } from "./types";

export const getAmplifyProject = (
  amplifyProjectPath: string
): AmplifyProject => {
  return new AmplifyProjectImpl(amplifyProjectPath);
};
