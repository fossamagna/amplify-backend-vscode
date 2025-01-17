import * as vscode from "vscode";
import { createUrlCommand } from "./url-command";

export const openConsoleCommand = createUrlCommand(async (uri: vscode.Uri) => {
  await vscode.env.openExternal(uri);
});
