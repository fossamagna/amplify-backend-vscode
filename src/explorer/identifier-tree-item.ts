
import * as vscode from "vscode";
import { AmplifyProject } from "../project";
import { AmplifyBackendBaseNode } from "./amplify-backend-base-node";

export class IdentifierTreeItem extends AmplifyBackendBaseNode {
  constructor(
    public readonly amplifyProject: AmplifyProject,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(amplifyProject.getStackName()!, collapsibleState);
    this.contextValue = "identifierNode";
  }
}
