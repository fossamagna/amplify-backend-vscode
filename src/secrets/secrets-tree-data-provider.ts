import * as vscode from "vscode";
import type { BackendIdentifier } from "@aws-amplify/plugin-types";
import { AmplifyBackendSecret } from "./amplify-secrets";
import { detectAmplifyProjects } from "../explorer/amplify-project-detector";
import { AmplifyProjectImpl } from "../project";

export abstract class SecretsTreeItem extends vscode.TreeItem {
  constructor(
    public readonly backendIdentifier: BackendIdentifier,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(backendIdentifier.name, collapsibleState);
  }
}

export class IdentifierTreeItem extends SecretsTreeItem {
  constructor(
    public readonly backendIdentifier: BackendIdentifier,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(backendIdentifier, collapsibleState);
    this.contextValue = "identifierNode";
  }
}

export class SecretNameTreeItem extends SecretsTreeItem {
  constructor(
    public readonly backendIdentifier: BackendIdentifier,
    public readonly name: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(backendIdentifier, collapsibleState);
    this.label = name;
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
    backendIdentifier: BackendIdentifier
  ): Promise<SecretNameTreeItem[]> {
    const secretsClient = new AmplifyBackendSecret(backendIdentifier);
    const secretsList = await secretsClient.listSecrets();
    return secretsList.map((name) => {
      return new SecretNameTreeItem(
        backendIdentifier,
        name,
        vscode.TreeItemCollapsibleState.None
      );
    });
  }

  private async getRootChildren(): Promise<SecretsTreeItem[]> {
    const projects = await detectAmplifyProjects(this.workspaceRoot);
    const backendIdentifiers = projects
      .map((project) => new AmplifyProjectImpl(project))
      .map((project) => project.getBackendIdentifier())
      .filter(
        (backendIdentifier): backendIdentifier is BackendIdentifier =>
          !!backendIdentifier
      );
    return backendIdentifiers.map(
      (backendIdentifier) =>
        new IdentifierTreeItem(
          backendIdentifier,
          vscode.TreeItemCollapsibleState.Collapsed
        )
    );
  }

  getChildren(
    element?: SecretsTreeItem | undefined
  ): vscode.ProviderResult<SecretsTreeItem[]> {
    if (element) {
      if (element instanceof IdentifierTreeItem) {
        return this.getSecretList(element.backendIdentifier);
      }
    } else {
      return this.getRootChildren();
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
