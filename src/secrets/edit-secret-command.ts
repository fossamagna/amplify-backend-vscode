import { AmplifyBackendSecret } from "./amplify-secrets";
import { SecretNameTreeItem } from "./secrets-tree-data-provider";
import { secretValueInput } from "./secret-value-input-box";

export const editSecretCommand = async (node: SecretNameTreeItem) => {
  const secretName = node.name;
  await secretValueInput(
    secretName,
    new AmplifyBackendSecret(node.backendIdentifier)
  );
};
