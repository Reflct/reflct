import { type Page } from "@playwright/test";
import { exec } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildAndPackageModules } from "./build-packages.js";
import type { BuildConfig } from "./types.js";

export function getEnvironmentFromTestName(
  testName: string
): "development" | "staging" | "production" {
  if (testName.includes("(staging)")) return "staging";
  if (testName.includes("(production)")) return "production";
  if (testName.includes("(development)")) return "development";

  return "development"; // fallback
}

export async function setupTestEnvironment(
  environment: "development" | "staging" | "production" = "development"
): Promise<BuildConfig> {
  const envFile =
    environment === "production" ? ".env" : `.env.${environment}.local`;

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "reflct-test"));

  const paths: BuildConfig = {
    rootDir: process.cwd(),
    tmpDir: tmpDir,
    envDir: path.join(tmpDir, "tmp"),
    envFile,
  };

  fs.mkdirSync(paths.envDir, { recursive: true });

  await buildAndPackageModules(paths);
  return paths;
}

export async function startNextJsProject(paths: BuildConfig): Promise<{
  port: number;
  cleanup: () => void;
}> {
  console.log(path.join(paths.envDir, "next-test"));

  const port = 5172;
  const process = exec(`yarn dev --port ${port}`, {
    cwd: path.join(paths.envDir, "next-test"),
  });

  // Wait for the server to start
  await new Promise((resolve) => setTimeout(resolve, 5000));

  return {
    port,
    cleanup: () => {
      if (process.pid) {
        process.kill();
      }
    },
  };
}

export async function startViteProject(paths: BuildConfig): Promise<{
  port: number;
  cleanup: () => void;
}> {
  const port = 5173;
  const process = exec(`yarn dev --port ${port}`, {
    cwd: path.join(paths.envDir, "vite-test"),
  });

  // Wait for the server to start
  await new Promise((resolve) => setTimeout(resolve, 5000));

  return {
    port,
    cleanup: () => {
      if (process.pid) {
        process.kill();
      }
    },
  };
}

export async function takeSnapshot(
  page: Page,
  name: string,
  testInfo: { snapshotDir: string }
): Promise<void> {
  // Wait for the viewer to load
  await page.waitForSelector("canvas", { timeout: 10000 });

  // Wait a bit for the 3D scene to render
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Take screenshot
  await page.screenshot({
    path: path.join(testInfo.snapshotDir, `${name}.png`),
    fullPage: true,
  });
}
