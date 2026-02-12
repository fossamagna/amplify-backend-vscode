import { test, describe } from "mocha";
import * as assert from "node:assert";
import { buildUrl } from ".";

describe("Console URL Builder Test Suite", () => {
  test("AWS::CloudFormation::Stack", () => {
    const url = buildUrl({
      resourceType: "AWS::CloudFormation::Stack",
      physicalResourceId:
        "arn:aws:cloudformation:ap-northeast-1:123456789012:stack/amplify-amplifyvitereacttemplate-fossamagna-sandbox-5f9286339c-data123456-Q4HYM3CGZQQQ/b32ba610-2941-11ef-9062-061f906d3db3",
      region: "ap-northeast-1",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/cloudformation/home?region=ap-northeast-1#/stacks/stackinfo?stackId=arn%3Aaws%3Acloudformation%3Aap-northeast-1%3A123456789012%3Astack%2Famplify-amplifyvitereacttemplate-fossamagna-sandbox-5f9286339c-data123456-Q4HYM3CGZQQQ%2Fb32ba610-2941-11ef-9062-061f906d3db3"
    );
  });

  test("AWS::AppSync::Resolver", () => {
    const url = buildUrl({
      resourceType: "AWS::AppSync::Resolver",
      physicalResourceId:
        "arn:aws:appsync:ap-northeast-1:123456789012:apis/abcdefghijklmnopqrstuvwxyz/types/Mutation/resolvers/updateTodo",
      region: "ap-northeast-1",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/appsync/home?region=ap-northeast-1#/abcdefghijklmnopqrstuvwxyz/v1/schema/Mutation/updateTodo/resolver"
    );
  });

  test("Custom::AmplifyDynamoDBTable", () => {
    const url = buildUrl({
      resourceType: "Custom::AmplifyDynamoDBTable",
      physicalResourceId: "Todo-1234567890-NOE",
      region: "ap-northeast-1",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/dynamodbv2/home?region=ap-northeast-1#table?name=Todo-1234567890-NOE&tab=overview"
    );
  });

  test("AWS::DynamoDB::Table", () => {
    const url = buildUrl({
      resourceType: "AWS::DynamoDB::Table",
      physicalResourceId: "Todo-1234567890-NOE",
      region: "ap-northeast-1",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/dynamodbv2/home?region=ap-northeast-1#table?name=Todo-1234567890-NOE&tab=overview"
    );
  });

  test("AWS::StepFunctions::StateMachine", () => {
    const url = buildUrl({
      resourceType: "AWS::StepFunctions::StateMachine",
      physicalResourceId:
        "arn:aws:states:ap-northeast-1:123456789012:stateMachine:AmplifyTableWaiterStateMachine01234567-aBcDeFgHiJkLmNoPqRsT",
      region: "ap-northeast-1",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/states/home?region=ap-northeast-1#/statemachines/view/arn:aws:states:ap-northeast-1:123456789012:stateMachine:AmplifyTableWaiterStateMachine01234567-aBcDeFgHiJkLmNoPqRsT"
    );
  });

  test("AWS::AppSync::GraphQLApi", () => {
    const url = buildUrl({
      resourceType: "AWS::AppSync::GraphQLApi",
      physicalResourceId:
        "arn:aws:appsync:ap-northeast-1:767397698580:apis/0123456789abcdefghijklmnop",
      region: "ap-northeast-1",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/appsync/home?region=ap-northeast-1#/0123456789abcdefghijklmnop/v1/home"
    );
  });

  test("AWS::AppSync::GraphQLSchema", () => {
    const url = buildUrl({
      resourceType: "AWS::AppSync::GraphQLSchema",
      physicalResourceId: "0123456789abcdefghijklmnopGraphQLSchema",
      region: "ap-northeast-1",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/appsync/home?region=ap-northeast-1#/0123456789abcdefghijklmnop/v1/schema"
    );
  });

  test("AWS::SQS::Queue", () => {
    const url = buildUrl({
      resourceType: "AWS::SQS::Queue",
      physicalResourceId:
        "https://sqs.ap-northeast-1.amazonaws.com/123456789012/test-queue-name.fifo",
      region: "ap-northeast-1",
    });
    assert.deepEqual(url, {
      scheme: "https",
      authority: "ap-northeast-1.console.aws.amazon.com",
      path: "/sqs/v3/home",
      query: "region=ap-northeast-1",
      fragment:
        "/queues/https%3A%2F%2Fsqs.ap-northeast-1.amazonaws.com%2F123456789012%2Ftest-queue-name.fifo",
    });
  });

  test("AWS::Events::EventBus", () => {
    const url = buildUrl({
      resourceType: "AWS::Events::EventBus",
      physicalResourceId: "amplifyEventBus5866C2C9",
      region: "ap-northeast-1",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/events/home?region=ap-northeast-1#/eventbus/amplifyEventBus5866C2C9"
    );
  });

  test("AWS::Scheduler::Schedule", () => {
    const url = buildUrl({
      resourceType: "AWS::Scheduler::Schedule",
      physicalResourceId: "amplify-schedule-1234567890",
      region: "ap-northeast-1",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/scheduler/home?region=ap-northeast-1#schedules/default/amplify-schedule-1234567890"
    );
  });

  test("AWS::CloudWatch::Alarm", () => {
    const url = buildUrl({
      resourceType: "AWS::CloudWatch::Alarm",
      physicalResourceId: "amplifyAlarm1234567890",
      region: "ap-northeast-1",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#alarmsV2:alarm/amplifyAlarm1234567890"
    );
  });

  test("AWS::VerifiedPermissions::PolicyStore", () => {
    const url = buildUrl({
      resourceType: "AWS::VerifiedPermissions::PolicyStore",
      physicalResourceId: "policy-store-1234567890",
      region: "ap-northeast-1",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/verifiedpermissions/policy-store-1234567890/overview?region=ap-northeast-1"
    );
  });

  test("AWS::VerifiedPermissions::Policy", () => {
    const url = buildUrl({
      resourceType: "AWS::VerifiedPermissions::Policy",
      physicalResourceId: "policy-store-1234567890|policy-abcdef123456",
      region: "ap-northeast-1",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/verifiedpermissions/policy-store-1234567890/policies/policy-abcdef123456?region=ap-northeast-1"
    );
  });

  test("AWS::ApiGatewayV2::Api", () => {
    const url = buildUrl({
      resourceType: "AWS::ApiGatewayV2::Api",
      physicalResourceId: "a1b2c3d4e5",
      region: "ap-northeast-1",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/apigateway/main/api-detail?api=a1b2c3d4e5&region=ap-northeast-1"
    );
  });

  test("AWS::BedrockAgentCore::Runtime", () => {
    const url = buildUrl({
      resourceType: "AWS::BedrockAgentCore::Runtime",
      physicalResourceId: "ABCDEFGHIJ",
      region: "us-east-1",
    });
    assert.strictEqual(
      url,
      "https://us-east-1.console.aws.amazon.com/bedrock-agentcore/agents/ABCDEFGHIJ"
    );
  });

  test("buildGoConsoleUrl with valid ARN", () => {
    const url = buildUrl({
      resourceType: "AWS::SomeUnsupportedType",
      physicalResourceId:
        "arn:aws:ec2:us-west-2:123456789012:vpc/vpc-0e9801d129EXAMPLE",
      region: "us-west-2",
    });
    assert.strictEqual(
      url,
      "https://console.aws.amazon.com/go/view?arn=arn:aws:ec2:us-west-2:123456789012:vpc/vpc-0e9801d129EXAMPLE"
    );
  });

  test("buildGoConsoleUrl with invalid ARN", () => {
    const url = buildUrl({
      resourceType: "AWS::SomeUnsupportedType",
      physicalResourceId: "not-a-valid-arn",
      region: "us-west-2",
    });
    assert.strictEqual(url, undefined);
  });
});
