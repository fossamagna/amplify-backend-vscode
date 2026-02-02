import * as vscode from "vscode";
import { AmplifyBackendTreeDataProvider } from "../amplify-backend-tree-data-provider";

export async function searchFilterCommand(
  treeDataProvider: AmplifyBackendTreeDataProvider
): Promise<void> {
  const currentFilter = treeDataProvider.getSearchFilter();
  const input = await vscode.window.showInputBox({
    prompt: "Enter search text to filter tree items (leave empty to clear filter)",
    placeHolder: "Search for resource names or types...",
    value: currentFilter,
  });

  if (input !== undefined) {
    if (input.trim() === "") {
      treeDataProvider.clearSearchFilter();
      vscode.window.showInformationMessage("Search filter cleared");
    } else {
      treeDataProvider.setSearchFilter(input.trim());
      vscode.window.showInformationMessage(`Filtering by: "${input.trim()}"`);
    }
  }
}
