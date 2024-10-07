import * as vscode from "vscode";
import { StackResource } from "@aws-sdk/client-cloudformation";
import { isSupportedResourceType } from "../console-url-builder";

export type ResourceFilter = {
  name: string;
  resources: string[];
};

export const getResourceFilters = () => {
  const config = vscode.workspace.getConfiguration();
  return config.get<ResourceFilter[]>("amplifyBackend.explorerFilters") ?? [];
};

export type ResourceFilterPredicate = (resource: StackResource) => boolean;

const stackPredicate = (resource: StackResource) =>
  "AWS::CloudFormation::Stack" === resource.ResourceType;

const defaultPredicate = (resource: StackResource) =>
  isSupportedResourceType(resource.ResourceType!);

const or =
  (predicates: ResourceFilterPredicate[]) => (resource: StackResource) =>
    predicates.some((predicate) => predicate(resource));

const all = () => true;

export interface ResourceFilterProvider {
  getResourceFilterName(): string;
  setResourceFilterName(filterName: string): Thenable<void>;
  getResourceFilterPredicate(): ResourceFilterPredicate;
}

export class DefaultResourceFilterProvider implements ResourceFilterProvider {
  static readonly NONE_FILTER_NAME = "none";
  private static readonly PRESET_FILTER_NAME = "default";
  private static readonly KEY_FILTER_NAME = "filterName";

  private readonly state: vscode.Memento;

  constructor(state: vscode.Memento) {
    this.state = state;
  }

  getResourceFilterName(): string {
    return this.state.get(
      DefaultResourceFilterProvider.KEY_FILTER_NAME,
      DefaultResourceFilterProvider.NONE_FILTER_NAME
    );
  }

  setResourceFilterName(filterName: string): Thenable<void> {
    return this.state.update(
      DefaultResourceFilterProvider.KEY_FILTER_NAME,
      filterName
    );
  }

  getResourceFilterPredicate(): ResourceFilterPredicate {
    const filters = getResourceFilters();
    const filterName = this.getResourceFilterName();
    if (filterName === DefaultResourceFilterProvider.NONE_FILTER_NAME) {
      return all;
    }
    if (filterName === DefaultResourceFilterProvider.PRESET_FILTER_NAME) {
      return or([stackPredicate, defaultPredicate]);
    }
    const filter = filters.find((filter) => filter.name === filterName);
    if (!filter) {
      return all;
    }
    return or([
      stackPredicate,
      (resource: StackResource) =>
        filter.resources.includes(resource.ResourceType!),
    ]);
  }

  getResourceFilterNames(): string[] {
    return [
      DefaultResourceFilterProvider.NONE_FILTER_NAME,
      DefaultResourceFilterProvider.PRESET_FILTER_NAME,
      ...getResourceFilters().map((filter) => filter.name),
    ];
  }
}
