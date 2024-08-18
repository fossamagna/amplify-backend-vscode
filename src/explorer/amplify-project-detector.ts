import * as fsp from "node:fs/promises";
import { glob } from "glob";
import path from "node:path";

type PackageJson = {
  name: string;
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
};

export const detectAmplifyProjects = async (
  workspaceRoot: string
): Promise<string[]> => {
  const packageJsonPaths = await glob("**/package.json", {
    cwd: workspaceRoot,
  });
  const packages = await Promise.allSettled(
    packageJsonPaths
      .map((packageJsonPath) => path.join(workspaceRoot, packageJsonPath))
      .map(async (packageJsonPath) => ({
        path: packageJsonPath,
        content: JSON.parse(
          await fsp.readFile(packageJsonPath, "utf8")
        ) as PackageJson,
      }))
  );
  return packages
    .filter((result) => result.status === "fulfilled")
    .filter((result) => isAmplifyProject(result.value.content))
    .map((result) => path.dirname(result.value.path));
};

const isAmplifyProject = (packageJson: PackageJson): boolean => {
  return (
    !!packageJson.devDependencies &&
    !!packageJson.devDependencies["@aws-amplify/backend"]
  );
};
