import { AmplifyBackendSecret } from "./amplify-secrets";
import { SecretNameTreeItem } from "./secrets-tree-data-provider";

export const removeSecretCommand = async (node: SecretNameTreeItem) => {
  const secretName = node.name;
  const secretsClient = new AmplifyBackendSecret(
    node.amplifyProject.getBackendIdentifier()!
  );
  await secretsClient.removeSecret(secretName);
};
