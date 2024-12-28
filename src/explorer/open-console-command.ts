import * as vscode from "vscode";
import { AmplifyBackendResourceTreeNode } from "./amplify-backend-resource-tree-node";

export const openConsoleCommand = async (
  node: AmplifyBackendResourceTreeNode
) => {
  const { consoleUrl } = node;
  if (consoleUrl) {
    const uri =
      typeof consoleUrl === "string"
        ? vscode.Uri.parse(consoleUrl)
        : vscode.Uri.from(consoleUrl);
    vscode.env.openExternal(uri);
  } else {
    const selection = await vscode.window.showInformationMessage(
      `Now ${node.cloudformationType} is not supported resource type to open AWS Cosnsole.`,
      "Request Feature"
    );
    if (selection === "Request Feature") {
      openGitHubIssue(node.cloudformationType);
    }
  }
};

const openGitHubIssue = (cloudformationType: string) => {
  vscode.env.openExternal(
    vscode.Uri.parse(
      `https://github.com/fossamagna/amplify-backend-vscode/issues/new?labels=enhancement&title=support+to+open+AWS+console+for+${cloudformationType}`
    )
  );
};
