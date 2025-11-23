import * as vscode from "vscode";
import Auth from "./auth/credentials";
import { AmplifyBackendTreeDataProvider } from "./explorer/amplify-backend-tree-data-provider";
import { SecretsTreeDataProvider } from "./secrets/secrets-tree-data-provider";
import { editSecretCommand } from "./secrets/edit-secret-command";
import { removeSecretCommand } from "./secrets/remove-secret-command";
import { addSecretCommand } from "./secrets/add-secret-command";
import { DefaultResourceFilterProvider } from "./explorer/resource-filter";
import { openConsoleCommand } from "./explorer/commands/open-console-command";
import { copyUrlCommand } from "./explorer/commands/copy-url-command";
import { getAWSClientProvider } from "./client/provider";

export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "amplify-backend-explorer.openConsole",
      openConsoleCommand
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "amplify-backend-explorer.copyUrl",
      copyUrlCommand
    )
  );

  const rootPath =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  const resourceFilterProvider = new DefaultResourceFilterProvider(
    context.workspaceState
  );

  const awsClientProvider = await getAWSClientProvider();
  const amplifyBackendTreeDataProvider = new AmplifyBackendTreeDataProvider(
    rootPath || "",
    resourceFilterProvider,
    awsClientProvider
  );
  vscode.window.createTreeView("amplify-backend-explorer", {
    treeDataProvider: amplifyBackendTreeDataProvider,
  });
  context.subscriptions.push(
    vscode.commands.registerCommand("amplify-backend-explorer.refresh", () => {
      amplifyBackendTreeDataProvider.refresh();
    })
  );

  const secretsTreeDataProvider = new SecretsTreeDataProvider(
    rootPath || "",
    awsClientProvider
  );
  vscode.window.createTreeView("amplify-backend-secrets-explorer", {
    treeDataProvider: secretsTreeDataProvider,
  });
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "amplify-backend-secrets-explorer.refresh",
      () => secretsTreeDataProvider.refresh()
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "amplify-backend-secrets-explorer.editSecret",
      async (node) => {
        await editSecretCommand(node);
      }
    ),
    vscode.commands.registerCommand(
      "amplify-backend-secrets-explorer.removeSecret",
      async (node) => {
        await removeSecretCommand(node);
        secretsTreeDataProvider.refresh();
      }
    ),
    vscode.commands.registerCommand(
      "amplify-backend-secrets-explorer.addSecret",
      async (node) => {
        await addSecretCommand(node);
        secretsTreeDataProvider.refresh();
      }
    )
  );

  Auth.instance.setProfile(context.workspaceState.get("profile", "default"));
  Auth.instance.onDidChangeProfile(() => {
    context.workspaceState.update("profile", Auth.instance.getProfile());
    amplifyBackendTreeDataProvider.refresh();
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "amplify-backend-explorer.switchCredentials",
      async () => {
        const options = await Auth.instance.getProfiles();
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = options.map((label) => ({ label }));
        quickPick.onDidChangeSelection((selection) => {
          if (selection[0]) {
            Auth.instance.setProfile(selection[0].label);
            quickPick.hide();
          }
        });
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "amplify-backend-explorer.switchFilter",
      async () => {
        const names = resourceFilterProvider.getResourceFilterNames();
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = names.map((label) => ({ label }));
        quickPick.onDidChangeSelection((selection) => {
          if (selection[0]) {
            resourceFilterProvider.setResourceFilterName(selection[0].label);
            quickPick.hide();
            amplifyBackendTreeDataProvider.refresh();
          }
        });
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
      }
    )
  );
}

export function deactivate() {}
