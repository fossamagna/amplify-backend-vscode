import * as vscode from "vscode";
import { StackResource } from "@aws-sdk/client-cloudformation";
import { AmplifyBackendBaseNode } from "./amplify-backend-base-node";
import { isStack } from "./utils";
import { buildUrl, UriComponents } from "../console-url-builder";
import type { BackendIdentifier } from "@aws-amplify/plugin-types";

export class AmplifyBackendResourceTreeNode extends AmplifyBackendBaseNode {
  constructor(
    public readonly label: string,
    public readonly cloudformationType: string,
    public readonly backendIdentifier: BackendIdentifier,
    public readonly resource?: StackResource
  ) {
    super(
      label,
      isStack(cloudformationType)
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
      cloudformationType
    );
    this.tooltip = resource
      ? JSON.stringify(resource, null, 2)
      : `${this.label}-${this.cloudformationType}`;
    this.description = this.cloudformationType;
    this.contextValue = "resourceNode";
  }

  get consoleUrl(): string | UriComponents | undefined {
    return this.resource && buildUrl(this.resource);
  }
}
