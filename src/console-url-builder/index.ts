import { StackResource } from "@aws-sdk/client-cloudformation";

export function buildUrl(stackResource: StackResource) {
  if (!stackResource.ResourceType) {
    return;
  }
  const urlBuilder = urlBuilders[stackResource.ResourceType];
  if (urlBuilder) {
    return urlBuilder(stackResource);
  }
}

const urlBuilders: Record<string, (stackResource: StackResource) => string> = {
  "AWS::CloudFormation::Stack": (stackResource) => {
    const region = stackResource.StackId?.split(":")[3];
    const resourceId = stackResource.PhysicalResourceId!;
    return `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/stackinfo?stackId=${encodeURIComponent(
      resourceId
    )}`;
  },
  "AWS::Cognito::IdentityPool": (stackResource) => {
    const region = stackResource.StackId?.split(":")[3];
    const resourceId = stackResource.PhysicalResourceId;
    return `https://${region}.console.aws.amazon.com/cognito/v2/identity/identity-pools/${resourceId}/user-statistics?region=${region}`;
  },
  "AWS::Cognito::UserPool": (stackResource) => {
    const region = stackResource.StackId?.split(":")[3];
    const resourceId = stackResource.PhysicalResourceId;
    return `https://${region}.console.aws.amazon.com/cognito/v2/idp/user-pools/${resourceId}/users?region=${region}`;
  },
  "AWS::AppSync::GraphQLApi": (stackResource) => {
    const region = stackResource.StackId?.split(":")[3];
    const resourceId = stackResource.PhysicalResourceId?.split("/", 2)[1];
    return `https://${region}.console.aws.amazon.com/appsync/home?region=${region}#/${resourceId}/v1/home`;
  },
  "AWS::AppSync::GraphQLSchema": (stackResource) => {
    const region = stackResource.StackId?.split(":")[3];
    const resourceId = stackResource.PhysicalResourceId?.split("/", 2)[1];
    return `https://${region}.console.aws.amazon.com/appsync/home?region=${region}#/${resourceId}/v1/schema`;
  },
  "AWS::AppSync::DataSource": (stackResource) => {
    const region = stackResource.StackId?.split(":")[3];
    const resourceId = stackResource.PhysicalResourceId?.split("/", 2)[1];
    return `https://${region}.console.aws.amazon.com/appsync/home?region=${region}#/${resourceId}/v1/datasources`;
  },
  "AWS::Lambda::Function": (stackResource) => {
    const region = stackResource.StackId?.split(":")[3];
    const resourceId = stackResource.PhysicalResourceId;
    return `https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/functions/${resourceId}`;
  },
  "AWS::S3::Bucket": (stackResource) => {
    const region = stackResource.StackId?.split(":")[3];
    const resourceId = stackResource.PhysicalResourceId;
    return `https://${region}.console.aws.amazon.com/s3/buckets/${resourceId}?region=${region}`;
  },
  "AWS::IAM::Role": (stackResource) => {
    const region = stackResource.StackId?.split(":")[3];
    const resourceId = stackResource.PhysicalResourceId;
    return `https://${region}.console.aws.amazon.com/iam/home?region=${region}#/roles/${resourceId}`;
  },
  "AWS::IAM::Policy": (stackResource) => {
    const region = stackResource.StackId?.split(":")[3];
    const resourceId = stackResource.PhysicalResourceId;
    return `https://${region}.console.aws.amazon.com/iam/home?region=${region}#/policies/${resourceId}`;
  },
};
