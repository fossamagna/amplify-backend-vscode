import * as vscode from "vscode";
import { AmplifyBackendBaseNode } from "./amplify-backend-base-node";

export class AuthNode extends AmplifyBackendBaseNode {
  readonly label: string;
  readonly profile: string;
  constructor(label: string, profile: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.label = label;
    this.profile = profile;
    this.contextValue = "authNode";
  }
}
