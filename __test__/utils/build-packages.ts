import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BuildConfig } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildAndPackageModules(
  paths: BuildConfig
): Promise<void> {
  try {
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
    execSync("npm install", { cwd: paths.tmpDir, stdio: "inherit" });

    if (process.env.CI) {
      // In CI environment, run the root build first
      execSync("npm run build", {
        cwd: paths.tmpDir,
        stdio: "inherit",
        env: { ...process.env, NODE_ENV: "production" },
      });
    }

    // Build and pack API
    console.log("Building API package...");
    execSync("npm run build", {
      cwd: path.join(paths.tmpDir, "packages/api"),
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" },
    });
    execSync("npm pack", {
      cwd: path.join(paths.tmpDir, "packages/api"),
      stdio: "inherit",
    });

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
      stdio: "inherit",
    });

    // Install dependencies in React package
    console.log("Installing React package dependencies...");
    execSync("npm install", {
      cwd: path.join(paths.tmpDir, "packages/react"),
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" },
    });

    // Build and pack React
    console.log("Building React package...");
    execSync("npm run build", {
      cwd: path.join(paths.tmpDir, "packages/react"),
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production", DEBUG: "true" },
    });
    execSync("npm pack", {
      cwd: path.join(paths.tmpDir, "packages/react"),
      stdio: "inherit",
    });

    // Move packages to env directory
    const reactTarball = fs
      .readdirSync(path.join(paths.tmpDir, "packages/react"))
      .find(
        (file) => file.startsWith("reflct-react-") && file.endsWith(".tgz")
      );

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
  } catch (error) {
    console.error("Build error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
}
