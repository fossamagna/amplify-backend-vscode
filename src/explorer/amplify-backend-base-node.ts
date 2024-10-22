import * as vscode from "vscode";

export abstract class AmplifyBackendBaseNode extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public description?: string
  ) {
    super(label, collapsibleState);
    this.description = description;
  }
}
