import * as vscode from "vscode";
import { AmplifySecrets } from "./amplify-secrets";

export const secretValueInput = async (
  secretName: string,
  secretsClient: AmplifySecrets
) => {
  const disposables: vscode.Disposable[] = [];
  try {
    return await new Promise<void>((resolve, reject) => {
      const inputBox = vscode.window.createInputBox();
      inputBox.title = "Edit Secret Value";
      inputBox.placeholder = "Enter Secret Value";
      inputBox.password = true;
      const getSecretButton = {
        iconPath: new vscode.ThemeIcon("cloud-download"),
        tooltip: "Get Secret Value",
      };
      const showSecretValueButton = {
        iconPath: new vscode.ThemeIcon("eye"),
        tooltip: "Show Secret Value",
      };
      const hideSecretValueButton = {
        iconPath: new vscode.ThemeIcon("eye-closed"),
        tooltip: "Hide Secret Value",
      };
      inputBox.buttons = [showSecretValueButton, getSecretButton];
      disposables.push(
        inputBox.onDidTriggerButton(async (button) => {
          if (button === showSecretValueButton) {
            inputBox.password = false;
            inputBox.buttons = [hideSecretValueButton, getSecretButton];
          } else if (button === hideSecretValueButton) {
            inputBox.password = true;
            inputBox.buttons = [showSecretValueButton, getSecretButton];
          } else if (button === getSecretButton) {
            const secret = await secretsClient.getSecret(secretName);
            inputBox.value = secret.value;
          }
        })
      );
      disposables.push(
        inputBox.onDidAccept(async () => {
          const result = inputBox.value;
          if (result) {
            secretsClient.setSecret(secretName, result).then(() => {
              vscode.window.showInformationMessage(
                `Set secret value for ${secretName}`
              );
            });
          }
          inputBox.hide();
        }),
        inputBox.onDidHide(() => {
          resolve();
          inputBox.dispose();
        })
      );
      inputBox.show();
    });
  } finally {
    disposables.forEach((d) => d.dispose());
  }
};
