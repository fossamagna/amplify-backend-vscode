import * as vscode from "vscode";
import { AmplifyBackendSecret } from "./amplify-secrets";
import { SecretNameTreeItem } from "./secrets-tree-data-provider";
import { secretValueInput } from "./secret-value-input-box";

export const addSecretCommand = async (node: SecretNameTreeItem) => {
  const name = await secretNameInput();
  if (!name) {
    return;
  }
  await secretValueInput(
    name,
    new AmplifyBackendSecret(node.amplifyProject.getBackendIdentifier()!)
  );
};

const secretNameInput = async (): Promise<string> => {
  const disposables: vscode.Disposable[] = [];
  try {
    return await new Promise<string>((resolve, reject) => {
      const inputBox = vscode.window.createInputBox();
      inputBox.title = "Enter Secret Name";
      inputBox.placeholder = "Enter Secret Name";
      disposables.push(
        inputBox.onDidAccept(async () => {
          const result = inputBox.value;
          resolve(result);
          inputBox.hide();
        }),
        inputBox.onDidHide(() => {
          inputBox.dispose();
        })
      );
      inputBox.show();
    });
  } finally {
    disposables.forEach((d) => d.dispose());
  }
};
