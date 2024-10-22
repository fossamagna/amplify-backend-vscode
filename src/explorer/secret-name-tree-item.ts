import * as vscode from "vscode";
import { AmplifyProject } from "../project";
import { AmplifyBackendBaseNode } from "./amplify-backend-base-node";

export class SecretNameTreeItem extends AmplifyBackendBaseNode {
  constructor(
    public readonly amplifyProject: AmplifyProject,
    public readonly name: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(name, collapsibleState);
    this.contextValue = "secretNameNode";
  }
}
