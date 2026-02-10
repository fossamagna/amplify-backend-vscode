import * as fsp from "node:fs/promises";
import { glob } from "glob";
import path from "node:path";
import { logger } from "../logger";

type PackageJson = {
  name: string;
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
};

export const detectAmplifyProjects = async (
  workspaceRoot: string
): Promise<string[]> => {
  logger.debug(`Detecting Amplify projects in workspace: ${workspaceRoot}`);
  
  const packageJsonPaths = await glob("**/package.json", {
    cwd: workspaceRoot,
    ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
  });
  logger.debug(`Found ${packageJsonPaths.length} package.json files`);
  
  const packages = await Promise.allSettled(
    packageJsonPaths
      .map((packageJsonPath) => path.join(workspaceRoot, packageJsonPath))
      .map(async (packageJsonPath) => {
        try {
          const content = JSON.parse(
            await fsp.readFile(packageJsonPath, "utf8")
          ) as PackageJson;
          return { path: packageJsonPath, content };
        } catch (error) {
          logger.warn(
            `Failed to read package.json at ${packageJsonPath}: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      })
  );
  
  const amplifyProjects = packages
    .filter((result) => result.status === "fulfilled")
    .filter((result) => isAmplifyProject(result.value.content))
    .map((result) => result.value.path)
    .map((projectPath) => path.dirname(projectPath));
  
  logger.info(`Detected ${amplifyProjects.length} Amplify project(s)`);
  if (amplifyProjects.length > 0) {
    logger.debug(`Amplify projects: ${amplifyProjects.join(", ")}`);
  }
  
  return amplifyProjects;
};

const isAmplifyProject = (packageJson: PackageJson): boolean => {
  return (
    !!packageJson.devDependencies &&
    !!packageJson.devDependencies["@aws-amplify/backend"]
  );
};
