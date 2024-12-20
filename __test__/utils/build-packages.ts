import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { BuildConfig } from "./types.js";

export async function buildAndPackageModules(
  paths: BuildConfig
): Promise<void> {
  // Copy everything except node_modules and .git
  execSync(
    `rsync -av --exclude='node_modules' --exclude='.git' ${paths.rootDir}/ ${paths.tmpDir}/`
  );

  // Copy env files based on environment
  fs.copyFileSync(
    path.join(paths.tmpDir, paths.envFile),
    path.join(paths.tmpDir, "packages/api/.env")
  );
  fs.copyFileSync(
    path.join(paths.tmpDir, paths.envFile),
    path.join(paths.tmpDir, "packages/react/.env")
  );

  // Install dependencies
  execSync("npm install", { cwd: paths.tmpDir });

  // Build and pack API
  execSync("npm run build", { cwd: path.join(paths.tmpDir, "packages/api") });
  execSync("npm pack", { cwd: path.join(paths.tmpDir, "packages/api") });

  // Move API package
  const apiTarball = fs
    .readdirSync(path.join(paths.tmpDir, "packages/api"))
    .find((file) => file.startsWith("reflct-api-") && file.endsWith(".tgz"));

  if (!apiTarball) {
    throw new Error("API tarball not found");
  }

  fs.renameSync(
    path.join(paths.tmpDir, "packages/api", apiTarball),
    path.join(paths.tmpDir, "packages/react/reflct-api.tgz")
  );

  // Update react package.json
  execSync("npm pkg set dependencies.@reflct/api=./reflct-api.tgz", {
    cwd: path.join(paths.tmpDir, "packages/react"),
  });

  // Build and pack React
  execSync("npm run build", { cwd: path.join(paths.tmpDir, "packages/react") });
  execSync("npm pack", { cwd: path.join(paths.tmpDir, "packages/react") });

  // Move packages to env directory
  const reactTarball = fs
    .readdirSync(path.join(paths.tmpDir, "packages/react"))
    .find((file) => file.startsWith("reflct-react-") && file.endsWith(".tgz"));

  if (!reactTarball) {
    throw new Error("React tarball not found");
  }

  fs.renameSync(
    path.join(paths.tmpDir, "packages/react", reactTarball),
    path.join(paths.envDir, "reflct-react.tgz")
  );
  fs.renameSync(
    path.join(paths.tmpDir, "packages/react/reflct-api.tgz"),
    path.join(paths.envDir, "reflct-api.tgz")
  );
}
