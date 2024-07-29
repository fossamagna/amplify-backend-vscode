import * as vscode from "vscode";
import { AmpxAmplifySecrets } from "./amplify-secrets";
import { SecretNameTreeItem } from "./secrets-tree-data-provider";
import { secretValueInput } from "./secret-value-input-box";

export const editSecretCommand = async (node: SecretNameTreeItem) => {
  const secretName = node.name;
  await secretValueInput(
    secretName,
    new AmpxAmplifySecrets(node.projectDir, node.identifier)
  );
};
