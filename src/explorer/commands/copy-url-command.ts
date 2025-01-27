import * as vscode from "vscode";
import { createUrlCommand } from "./url-command";

export const copyUrlCommand = createUrlCommand(async (uri: vscode.Uri) => {
  await vscode.env.clipboard.writeText(uri.toString(true));
  vscode.window.showInformationMessage("URL copied to clipboard");
});
