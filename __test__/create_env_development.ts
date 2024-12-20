#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Environment, BuildConfig } from "./utils/types.js";
import { buildAndPackageModules } from "./utils/build-packages.js";
import { setupNextJs } from "./utils/setup-nextjs.js";
import { setupVite } from "./utils/setup-vite.js";

// Get environment from command line arguments
const validEnvs: Environment[] = ["development", "staging", "production"];
const userInput = process.argv[2];

const environment: Environment = (validEnvs.find((env) => env === userInput) ||
  "development") as Environment;
const envFile: string =
  environment === "production" ? ".env" : `.env.${environment}.local`;

if (!validEnvs.includes(environment as Environment)) {
  console.error(
    `Error: Invalid environment "${environment}". Must be one of: ${validEnvs.join(
      ", "
    )}`
  );
  process.exit(1);
}

// Create temporary directory
const paths: BuildConfig = {
  rootDir: process.cwd(),
  tmpDir: fs.mkdtempSync(path.join(os.tmpdir(), "reflct-")),
  envDir: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "reflct-")), "tmp"),
  envFile,
};

fs.mkdirSync(paths.envDir, { recursive: true });

console.log(`Environment: ${environment}`);
console.log(`root_dir: ${paths.rootDir}`);
console.log(`tmp_dir: ${paths.tmpDir}`);
console.log(`env_dir: ${paths.envDir}`);

let isError = false;

const tasks = [
  {
    name: "Build and Package Modules",
    task: () => buildAndPackageModules(paths),
  },
  { name: "Setup Next.js", task: () => setupNextJs(paths) },
  { name: "Setup Vite", task: () => setupVite(paths) },
];

for (const { name, task } of tasks) {
  try {
    console.log(`Starting: ${name}`);
    await task();
    console.log(`Completed: ${name}`);
  } catch (error) {
    console.error(`Error in ${name}:`, error);
    isError = true;
  }
}

console.log(`Setup complete! Test environments created in ${paths.tmpDir}`);
process.exit(isError ? 1 : 0);
