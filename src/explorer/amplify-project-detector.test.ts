import { test, describe } from "mocha";
import * as path from "node:path";
import * as assert from "node:assert";
import { detectAmplifyProjects } from "./amplify-project-detector";

const fixtureRoot = path.join(
  __dirname,
  "amplify-project-detector.test.fixtures"
);

describe("amplify-project-detector", () => {
  test("detectAmplifyProjects returns empty array if not found amplify projects", async () => {
    const projects = await detectAmplifyProjects(
      path.join(fixtureRoot, "non-amplify")
    );
    assert.equal(projects.length, 0);
  });

  test("detectAmplifyProjects returns path to nested project", async () => {
    const projects = await detectAmplifyProjects(
      path.join(fixtureRoot, "monorepo")
    );
    assert.equal(projects.length, 2);
    assert.deepStrictEqual(projects.sort(), [
      path.join(fixtureRoot, "monorepo/packages/boo"),
      path.join(fixtureRoot, "monorepo/packages/foo"),
    ]);
  });

  test("detectAmplifyProjects returns path to root project", async () => {
    const projects = await detectAmplifyProjects(path.join(fixtureRoot, "app"));
    assert.equal(projects.length, 1);
    assert.equal(projects[0], path.join(fixtureRoot, "app"));
  });
});
