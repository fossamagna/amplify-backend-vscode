import type { StackResource } from "@aws-sdk/client-cloudformation";

export function isSupportedResourceType(resourceType: string) {
  return urlBuilders[resourceType] !== undefined;
}

export function buildUrl(
  stackResource: Pick<
    StackResource,
    "ResourceType" | "PhysicalResourceId" | "StackId"
  >
) {
  if (!stackResource.ResourceType) {
    return;
  }
  const urlBuilder = urlBuilders[stackResource.ResourceType];
  if (urlBuilder) {
    const region = stackResource.StackId?.split(":").at(3);
    if (!region) {
      return;
    }
    return urlBuilder(stackResource.PhysicalResourceId!, region);
  }
}

export type UriComponents = {
  /**
   * The scheme of the uri
   */
  readonly scheme: string;
  /**
   * The authority of the uri
   */
  readonly authority?: string;
  /**
   * The path of the uri
   */
  readonly path?: string;
  /**
   * The query string of the uri
   */
  readonly query?: string;
  /**
   * The fragment identifier of the uri
   */
  readonly fragment?: string;
};

const urlBuilders: Record<
  string,
  (physicalResourceId: string, region: string) => string | UriComponents
> = {
  "AWS::CloudFormation::Stack": (physicalResourceId, region) => {
    const resourceId = physicalResourceId!;
    return `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/stackinfo?stackId=${encodeURIComponent(
      resourceId
    )}`;
  },
  "AWS::Cognito::IdentityPool": (physicalResourceId, region) => {
    const resourceId = physicalResourceId;
    return `https://${region}.console.aws.amazon.com/cognito/v2/identity/identity-pools/${resourceId}/user-statistics?region=${region}`;
  },
  "AWS::Cognito::UserPool": (physicalResourceId, region) => {
    const resourceId = physicalResourceId;
    return `https://${region}.console.aws.amazon.com/cognito/v2/idp/user-pools/${resourceId}/users?region=${region}`;
  },
  "AWS::AppSync::GraphQLApi": (physicalResourceId, region) => {
    const resourceId = physicalResourceId?.split("/", 2)[1];
    return `https://${region}.console.aws.amazon.com/appsync/home?region=${region}#/${resourceId}/v1/home`;
  },
  "AWS::AppSync::GraphQLSchema": (physicalResourceId, region) => {
    const resourceId = physicalResourceId.replace("GraphQLSchema", "");
    return `https://${region}.console.aws.amazon.com/appsync/home?region=${region}#/${resourceId}/v1/schema`;
  },
  "AWS::AppSync::DataSource": (physicalResourceId, region) => {
    const resourceId = physicalResourceId?.split("/", 2)[1];
    return `https://${region}.console.aws.amazon.com/appsync/home?region=${region}#/${resourceId}/v1/datasources`;
  },
  "AWS::AppSync::Resolver": (physicalResourceId, region) => {
    const apiId = physicalResourceId.split("/")[1];
    const resolver = physicalResourceId.split("/")[3];
    const operation = physicalResourceId.split("/")[5];
    return `https://${region}.console.aws.amazon.com/appsync/home?region=${region}#/${apiId}/v1/schema/${resolver}/${operation}/resolver`;
  },
  "AWS::Lambda::Function": (physicalResourceId, region) => {
    const resourceId = physicalResourceId;
    return `https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/functions/${resourceId}`;
  },
  "AWS::S3::Bucket": (physicalResourceId, region) => {
    const resourceId = physicalResourceId;
    return `https://${region}.console.aws.amazon.com/s3/buckets/${resourceId}?region=${region}`;
  },
  "AWS::StepFunctions::StateMachine": (physicalResourceId, region) => {
    const resourceId = physicalResourceId;
    return `https://${region}.console.aws.amazon.com/states/home?region=${region}#/statemachines/view/${resourceId}`;
  },
  "AWS::IAM::Role": (physicalResourceId, region) => {
    const resourceId = physicalResourceId;
    return `https://${region}.console.aws.amazon.com/iam/home?region=${region}#/roles/${resourceId}`;
  },
  "AWS::IAM::Policy": (physicalResourceId, region) => {
    const resourceId = physicalResourceId;
    return `https://${region}.console.aws.amazon.com/iam/home?region=${region}#/policies/${resourceId}`;
  },
  "Custom::AmplifyDynamoDBTable": (physicalResourceId, region) => {
    const tableName = physicalResourceId;
    return `https://${region}.console.aws.amazon.com/dynamodbv2/home?region=${region}#table?name=${tableName}&tab=overview`;
  },
  "AWS::SQS::Queue": (physicalResourceId, region) => {
    const resourceId = physicalResourceId;
    return {
      scheme: "https",
      authority: `${region}.console.aws.amazon.com`,
      path: `/sqs/v3/home`,
      query: `region=${region}`,
      fragment: `/queues/${encodeURIComponent(resourceId)}`,
    };
  },
};
