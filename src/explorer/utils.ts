import { AmplifyBackendResourceTreeNode } from "./amplify-backend-resource-tree-node";
import { AmplifyBackendBaseNode } from "./amplify-backend-base-node";

export function isStackNode(
  node: AmplifyBackendBaseNode
): node is AmplifyBackendResourceTreeNode {
  return isStack(node.cloudformationType);
}

export function isStack(cloudformationType?: string): boolean {
  return (
    !!cloudformationType &&
    equalsIgnoreCase(cloudformationType, "AWS::CloudFormation::Stack")
  );
}

function equalsIgnoreCase(a: string, b: string): boolean {
  //return a.localeCompare(b, undefined, { sensitivity: "base" }) === 0;
  return a.toLowerCase() === b.toLowerCase();
}
