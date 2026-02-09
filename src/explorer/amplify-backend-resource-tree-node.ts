import * as vscode from "vscode";
import { StackResourceSummary } from "@aws-sdk/client-cloudformation";
import { AmplifyBackendBaseNode } from "./amplify-backend-base-node";
import { isStack } from "./utils";
import type { BackendIdentifier } from "@aws-amplify/plugin-types";

export class AmplifyBackendResourceTreeNode extends AmplifyBackendBaseNode {
  public readonly label: string;
  public readonly cloudformationType: string;
  public readonly backendIdentifier: BackendIdentifier;
  public readonly resource?: Pick<
    StackResourceSummary,
    "ResourceType" | "PhysicalResourceId"
  >;
  public readonly region?: string;
  public readonly accountId?: string;

  constructor({
    label,
    cloudformationType,
    backendIdentifier,
    resource,
    region,
    accountId,
  }: {
    label: string;
    cloudformationType: string;
    backendIdentifier: BackendIdentifier;
    resource?: Pick<
      StackResourceSummary,
      "ResourceType" | "PhysicalResourceId"
    >;
    region?: string;
    accountId?: string;
  }) {
    super(
      label,
      isStack(cloudformationType)
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
      cloudformationType,
    );
    this.label = label;
    this.cloudformationType = cloudformationType;
    this.backendIdentifier = backendIdentifier;
    this.resource = resource;
    this.region = region;
    this.accountId = accountId;
    this.tooltip = resource
      ? JSON.stringify(resource, null, 2)
      : `${this.label}-${this.cloudformationType}`;
    this.description = this.cloudformationType;
    this.contextValue = "resourceNode";
  }
}
