import { test, describe, beforeEach, afterEach } from "mocha";
import assert from "node:assert";
import { AmplifyProjectImpl } from "./amplify-project-impl";
import path from "node:path";
import { mockClient } from 'aws-sdk-client-mock';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { logger } from "../logger";
import * as sinon from "sinon";

describe("amplify-project-impl", () => {
  beforeEach(() => {
    // Stub logger methods
    sinon.stub(logger, "debug");
    sinon.stub(logger, "info");
    sinon.stub(logger, "warn");
    sinon.stub(logger, "error");
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  test("getStackName returns stack name", () => {
    const projectPath = path.join(
      __dirname,
      "amplify-project-impl.test.fixtures",
      "app"
    );
    const cloudFormationClientMock = mockClient(CloudFormationClient);
    const project = new AmplifyProjectImpl(projectPath, cloudFormationClientMock as unknown as CloudFormationClient);
    assert.equal(
      project.getStackName(),
      "amplify-amplifyvitereacttemplate-fossamagna-sandbox-a8f5c46cb7"
    );
  });

  test("getStackName returns undefined when no exists manifest.json", () => {
    const projectPath = path.join(
      __dirname,
      "amplify-project-impl.test.fixtures",
      "noapp"
    );
    const cloudFormationClientMock = mockClient(CloudFormationClient);
    const project = new AmplifyProjectImpl(projectPath, cloudFormationClientMock as unknown as CloudFormationClient);
    assert.equal(project.getStackName(), undefined);
  });

  test("getBackendIdentifier returns backend identifier", () => {
    const projectPath = path.join(
      __dirname,
      "amplify-project-impl.test.fixtures",
      "app"
    );
    const cloudFormationClientMock = mockClient(CloudFormationClient);
    const project = new AmplifyProjectImpl(projectPath, cloudFormationClientMock as unknown as CloudFormationClient);
    assert.deepStrictEqual(project.getBackendIdentifier(), {
      namespace: "amplifyvitereacttemplate",
      name: "fossamagna",
      type: "sandbox",
      hash: "a8f5c46cb7",
    });
  });

  test("getBackendIdentifier returns undefined when no exists manifest.json", () => {
    const projectPath = path.join(
      __dirname,
      "amplify-project-impl.test.fixtures",
      "noapp"
    );
    const cloudFormationClientMock = mockClient(CloudFormationClient);
    const project = new AmplifyProjectImpl(projectPath, cloudFormationClientMock as unknown as CloudFormationClient);
    assert.equal(project.getBackendIdentifier(), undefined);
  });

  test("getStackArn returns stack ARN", async () => {
    const projectPath = path.join(
      __dirname,
      "amplify-project-impl.test.fixtures",
      "app"
    );
    const cloudFormationClientMock = mockClient(CloudFormationClient);
    const expectedStackArn = "arn:aws:cloudformation:us-east-1:123456789012:stack/amplify-amplifyvitereacttemplate-fossamagna-sandbox-a8f5c46cb7/12345678-1234-1234-1234-123456789012";
    cloudFormationClientMock.on(DescribeStacksCommand).resolves({
      Stacks: [
        {
          StackName: "amplify-amplifyvitereacttemplate-fossamagna-sandbox-a8f5c46cb7",
          StackId: expectedStackArn,
          CreationTime: new Date(),
          StackStatus: "CREATE_COMPLETE",
        },
      ],
    });
    const project = new AmplifyProjectImpl(projectPath, cloudFormationClientMock as unknown as CloudFormationClient);
    const stackArn = await project.getStackArn();
    assert.equal(stackArn, expectedStackArn);
  });

  test("getStackArn returns undefined when stack is not found", async () => {
    const projectPath = path.join(
      __dirname,
      "amplify-project-impl.test.fixtures",
      "app"
    );
    const cloudFormationClientMock = mockClient(CloudFormationClient);
    cloudFormationClientMock.on(DescribeStacksCommand).resolves({
      Stacks: [],
    });
    const project = new AmplifyProjectImpl(projectPath, cloudFormationClientMock as unknown as CloudFormationClient);
    const stackArn = await project.getStackArn();
    assert.equal(stackArn, undefined);
  });

  test("getStackArn returns undefined when no exists manifest.json", async () => {
    const projectPath = path.join(
      __dirname,
      "amplify-project-impl.test.fixtures",
      "noapp"
    );
    const cloudFormationClientMock = mockClient(CloudFormationClient);
    const project = new AmplifyProjectImpl(projectPath, cloudFormationClientMock as unknown as CloudFormationClient);
    const stackArn = await project.getStackArn();
    assert.equal(stackArn, undefined);
  });
});
