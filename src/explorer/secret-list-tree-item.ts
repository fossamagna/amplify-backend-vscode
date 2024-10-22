import * as vscode from "vscode";
import { AmplifyBackendBaseNode } from "./amplify-backend-base-node";
import { AmplifyProject } from "../project";

export class SecretListTreeItem extends AmplifyBackendBaseNode {
  constructor(public readonly amplifyProject: AmplifyProject) {
    super("Secrets", vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = "secretListNode";
  }
}
