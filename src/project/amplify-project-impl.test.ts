import { test, describe } from "mocha";
import assert from "node:assert";
import { AmplifyProjectImpl } from "./amplify-project-impl";
import path from "node:path";

describe("amplify-project-impl", () => {
  test("getStackName returns stack name", () => {
    const projectPath = path.join(
      __dirname,
      "amplify-project-impl.test.fixtures",
      "app"
    );
    const project = new AmplifyProjectImpl(projectPath);
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
    const project = new AmplifyProjectImpl(projectPath);
    assert.equal(project.getStackName(), undefined);
  });

  test("getBackendIdentifier returns backend identifier", () => {
    const projectPath = path.join(
      __dirname,
      "amplify-project-impl.test.fixtures",
      "app"
    );
    const project = new AmplifyProjectImpl(projectPath);
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
    const project = new AmplifyProjectImpl(projectPath);
    assert.equal(project.getBackendIdentifier(), undefined);
  });
});
