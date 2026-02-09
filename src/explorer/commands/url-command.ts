import * as vscode from "vscode";
import { TreeNode } from "../amplify-backend-tree-data-provider";
import { AuthNode } from "../auth-node";

export const createUrlCommand = (
  urlHandler: (uri: vscode.Uri) => Thenable<void>
) => {
  return async (node: TreeNode) => {
    if (node instanceof AuthNode) {
      vscode.window.showInformationMessage(
        "URL operations are not available for authentication nodes."
      );
      return;
    }
    const { consoleUrl } = node;
    if (consoleUrl) {
      const uri =
        typeof consoleUrl === "string"
          ? vscode.Uri.parse(consoleUrl)
          : vscode.Uri.from(consoleUrl);
      await urlHandler(uri);
    } else {
      const selection = await vscode.window.showInformationMessage(
        `Now ${node.data.resourceType} is not supported resource type.`,
        "Request Feature"
      );
      if (selection === "Request Feature") {
        openGitHubIssue(node.data.resourceType);
      }
    }
  };
};

const openGitHubIssue = (cloudformationType: string) => {
  vscode.env.openExternal(
    vscode.Uri.parse(
      `https://github.com/fossamagna/amplify-backend-vscode/issues/new?labels=enhancement&title=support+to+open+AWS+console+for+${cloudformationType}+and+copy+URL`
    )
  );
};
