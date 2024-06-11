import * as vscode from "vscode";

export abstract class AmplifyBackendBaseNode extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly cloudformationType?: string
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.cloudformationType}`;
    this.description = this.cloudformationType;
  }
}
