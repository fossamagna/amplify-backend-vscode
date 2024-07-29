import * as vscode from "vscode";
import { AmpxAmplifySecrets } from "./amplify-secrets";
import { SecretNameTreeItem } from "./secrets-tree-data-provider";

export const removeSecretCommand = async (node: SecretNameTreeItem) => {
  const secretName = node.name;
  const secretsClient = new AmpxAmplifySecrets(
    node.projectDir,
    node.identifier
  );
  await secretsClient.removeSecret(secretName);
};
