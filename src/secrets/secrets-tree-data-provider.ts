import * as vscode from "vscode";
import { AmplifyBackendSecret } from "./amplify-secrets";
import { detectAmplifyProjects } from "../explorer/amplify-project-detector";
import { AmplifyProject, getAmplifyProject } from "../project";
import { AWSClientProvider } from "../client/provider";

export abstract class SecretsTreeItem extends vscode.TreeItem {
  constructor(
    public readonly amplifyProject: AmplifyProject,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(amplifyProject.getStackName()!, collapsibleState);
  }
}

export class IdentifierTreeItem extends SecretsTreeItem {
  constructor(
    public readonly amplifyProject: AmplifyProject,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(amplifyProject, collapsibleState);
    this.contextValue = "identifierNode";
  }
}

export class SecretNameTreeItem extends SecretsTreeItem {
  constructor(
    public readonly amplifyProject: AmplifyProject,
    public readonly name: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(amplifyProject, collapsibleState);
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

  constructor(
    private workspaceRoot: string,
    private awsClientProvider: AWSClientProvider
  ) {}

  onDidChangeTreeData = this._onDidChangeTreeData.event;

  getTreeItem(
    element: SecretsTreeItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  private async getSecretList(
    amplifyProject: AmplifyProject
  ): Promise<SecretNameTreeItem[]> {
    const secretsClient = new AmplifyBackendSecret(
      amplifyProject.getBackendIdentifier()!
    );
    const secretsList = await secretsClient.listSecrets();
    return secretsList.map((name) => {
      return new SecretNameTreeItem(
        amplifyProject,
        name,
        vscode.TreeItemCollapsibleState.None
      );
    });
  }

  private async getRootChildren(): Promise<SecretsTreeItem[]> {
    const cloudFormationClient =
      await this.awsClientProvider.getCloudFormationClient();
    const projects = await detectAmplifyProjects(this.workspaceRoot);
    const amplifyProjects = projects
      .map((project) => getAmplifyProject(project, cloudFormationClient))
      .filter((project) => !!project.getBackendIdentifier());
    return amplifyProjects.map(
      (amplifyProject) =>
        new IdentifierTreeItem(
          amplifyProject,
          vscode.TreeItemCollapsibleState.Collapsed
        )
    );
  }

  getChildren(
    element?: SecretsTreeItem | undefined
  ): vscode.ProviderResult<SecretsTreeItem[]> {
    if (element) {
      if (element instanceof IdentifierTreeItem) {
        return this.getSecretList(element.amplifyProject);
      }
    } else {
      return this.getRootChildren();
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
