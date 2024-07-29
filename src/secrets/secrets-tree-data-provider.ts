import * as vscode from "vscode";
import { userInfo } from "os";
import { AmpxAmplifySecrets } from "./amplify-secrets";
import { detectAmplifyProjects } from "../explorer/amplify-project-detector";

export abstract class SecretsTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }
}

export class IdentifierTreeItem extends SecretsTreeItem {
  constructor(
    public readonly projectDir: string,
    public readonly identifier: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(identifier, collapsibleState);
    this.contextValue = "identifierNode";
  }
}

export class SecretNameTreeItem extends SecretsTreeItem {
  constructor(
    public readonly projectDir: string,
    public readonly identifier: string,
    public readonly name: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(name, collapsibleState);
    this.contextValue = "secretNameNode";
  }
}

export class SecretsTreeDataProvider
  implements vscode.TreeDataProvider<SecretsTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    SecretsTreeItem | undefined | void
  > = new vscode.EventEmitter<SecretsTreeItem | undefined | void>();

  private identifier?: string;

  constructor(private workspaceRoot: string) {}

  onDidChangeTreeData = this._onDidChangeTreeData.event;

  getTreeItem(
    element: SecretsTreeItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  private async getSecretList(
    projectDir: string,
    identifier: string
  ): Promise<SecretNameTreeItem[]> {
    const secretsClient = new AmpxAmplifySecrets(projectDir, identifier);
    const secretsList = await secretsClient.listSecrets();
    return secretsList.map((name) => {
      return new SecretNameTreeItem(
        projectDir,
        identifier,
        name,
        vscode.TreeItemCollapsibleState.None
      );
    });
  }

  private async getRootChildren(): Promise<SecretsTreeItem[]> {
    const projects = await detectAmplifyProjects(this.workspaceRoot);
    return projects.map(
      (project) =>
        new IdentifierTreeItem(
          project,
          this.identifier ?? userInfo().username,
          vscode.TreeItemCollapsibleState.Collapsed
        )
    );
  }

  getChildren(
    element?: SecretsTreeItem | undefined
  ): vscode.ProviderResult<SecretsTreeItem[]> {
    if (element) {
      if (element instanceof IdentifierTreeItem) {
        return this.getSecretList(element.projectDir, element.identifier);
      }
    } else {
      return this.getRootChildren();
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
