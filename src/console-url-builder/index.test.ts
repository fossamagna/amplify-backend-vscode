import { test, describe } from "mocha";
import * as assert from "node:assert";
import { buildUrl } from ".";

describe("Console URL Builder Test Suite", () => {
  test("AWS::CloudFormation::Stack", () => {
    const url = buildUrl({
      ResourceType: "AWS::CloudFormation::Stack",
      StackId:
        "arn:aws:cloudformation:ap-northeast-1:123456789012:stack/myteststack/abc",
      PhysicalResourceId:
        "arn:aws:cloudformation:ap-northeast-1:123456789012:stack/amplify-amplifyvitereacttemplate-fossamagna-sandbox-5f9286339c-data123456-Q4HYM3CGZQQQ/b32ba610-2941-11ef-9062-061f906d3db3",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/cloudformation/home?region=ap-northeast-1#/stacks/stackinfo?stackId=arn%3Aaws%3Acloudformation%3Aap-northeast-1%3A123456789012%3Astack%2Famplify-amplifyvitereacttemplate-fossamagna-sandbox-5f9286339c-data123456-Q4HYM3CGZQQQ%2Fb32ba610-2941-11ef-9062-061f906d3db3"
    );
  });

  test("AWS::AppSync::Resolver", () => {
    const url = buildUrl({
      ResourceType: "AWS::AppSync::Resolver",
      StackId:
        "arn:aws:cloudformation:ap-northeast-1:123456789012:stack/myteststack/abc",
      PhysicalResourceId:
        "arn:aws:appsync:ap-northeast-1:123456789012:apis/abcdefghijklmnopqrstuvwxyz/types/Mutation/resolvers/updateTodo",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/appsync/home?region=ap-northeast-1#/abcdefghijklmnopqrstuvwxyz/v1/schema/Mutation/updateTodo/resolver"
    );
  });

  test("Custom::AmplifyDynamoDBTable", () => {
    const url = buildUrl({
      ResourceType: "Custom::AmplifyDynamoDBTable",
      StackId:
        "arn:aws:cloudformation:ap-northeast-1:123456789012:stack/myteststack/abc",
      PhysicalResourceId: "Todo-1234567890-NOE",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/dynamodbv2/home?region=ap-northeast-1#table?name=Todo-1234567890-NOE&tab=overview"
    );
  });

  test("AWS::StepFunctions::StateMachine", () => {
    const url = buildUrl({
      ResourceType: "AWS::StepFunctions::StateMachine",
      StackId:
        "arn:aws:cloudformation:ap-northeast-1:123456789012:stack/myteststack/abc",
      PhysicalResourceId:
        "arn:aws:states:ap-northeast-1:123456789012:stateMachine:AmplifyTableWaiterStateMachine01234567-aBcDeFgHiJkLmNoPqRsT",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/states/home?region=ap-northeast-1#/statemachines/view/arn:aws:states:ap-northeast-1:123456789012:stateMachine:AmplifyTableWaiterStateMachine01234567-aBcDeFgHiJkLmNoPqRsT"
    );
  });

  test("AWS::AppSync::GraphQLApi", () => {
    const url = buildUrl({
      ResourceType: "AWS::AppSync::GraphQLApi",
      StackId:
        "arn:aws:cloudformation:ap-northeast-1:123456789012:stack/myteststack/abc",
      PhysicalResourceId:
        "arn:aws:appsync:ap-northeast-1:767397698580:apis/0123456789abcdefghijklmnop",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/appsync/home?region=ap-northeast-1#/0123456789abcdefghijklmnop/v1/home"
    );
  });

  test("AWS::AppSync::GraphQLSchema", () => {
    const url = buildUrl({
      ResourceType: "AWS::AppSync::GraphQLSchema",
      StackId:
        "arn:aws:cloudformation:ap-northeast-1:123456789012:stack/myteststack/abc",
      PhysicalResourceId: "0123456789abcdefghijklmnopGraphQLSchema",
    });
    assert.strictEqual(
      url,
      "https://ap-northeast-1.console.aws.amazon.com/appsync/home?region=ap-northeast-1#/0123456789abcdefghijklmnop/v1/schema"
    );
  });

  test("AWS::SQS::Queue", () => {
    const url = buildUrl({
      ResourceType: "AWS::SQS::Queue",
      StackId:
        "arn:aws:cloudformation:ap-northeast-1:123456789012:stack/myteststack/abc",
      PhysicalResourceId:
        "https://sqs.ap-northeast-1.amazonaws.com/123456789012/test-queue-name.fifo",
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
});
