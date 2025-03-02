import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { setupViteV5, setupViteV6 } from "./utils/setup-vite.js";
import {
  setupTestEnvironment,
  startViteProject,
  takeSnapshot,
  getEnvironmentFromTestName,
} from "./utils/test-helpers.js";

const environments = ["development", "staging", "production"] as const;

test.describe("Visual Regression Tests", () => {
  for (const env of environments) {
    test(`Vite v5 project snapshot (${env})`, async ({ page }, testInfo) => {
      const environment = getEnvironmentFromTestName(testInfo.title);
      const paths = await setupTestEnvironment(environment);

      try {
        // Setup Vite project
        await setupViteV5(paths);

        // Start the project
        const { port, cleanup } = await startViteProject(paths, "vite-v5-test");

        try {
          // Navigate to the page
          await page.goto(`http://localhost:${port}`, {
            waitUntil: "networkidle",
          });

          // Wait for 5 seconds
          await page.waitForTimeout(5000);

          const snapshotName = `vite-v5-viewer-${environment}`;

          // Take snapshot
          await takeSnapshot(page, snapshotName, testInfo);

          // Compare with baseline
          await expect(
            await page.screenshot({ fullPage: true })
          ).toMatchSnapshot(`${snapshotName}.png`);
        } finally {
          cleanup();
        }
      } finally {
        // Cleanup temp directories
        fs.rmSync(paths.tmpDir, { recursive: true, force: true });
        fs.rmSync(paths.envDir, { recursive: true, force: true });
      }
    });

    test(`Vite v6 project snapshot (${env})`, async ({ page }, testInfo) => {
      const environment = getEnvironmentFromTestName(testInfo.title);
      const paths = await setupTestEnvironment(environment);

      try {
        // Setup Vite project
        await setupViteV6(paths);

        // Start the project
        const { port, cleanup } = await startViteProject(paths, "vite-v6-test");

        try {
          // Navigate to the page
          await page.goto(`http://localhost:${port}`, {
            waitUntil: "networkidle",
          });

          // Wait for 5 seconds
          await page.waitForTimeout(5000);

          const snapshotName = `vite-v6-viewer-${environment}`;

          // Take snapshot
          await takeSnapshot(page, snapshotName, testInfo);

          // Compare with baseline
          await expect(
            await page.screenshot({ fullPage: true })
          ).toMatchSnapshot(`${snapshotName}.png`);
        } finally {
          cleanup();
        }
      } finally {
        // Cleanup temp directories
        fs.rmSync(paths.tmpDir, { recursive: true, force: true });
        fs.rmSync(paths.envDir, { recursive: true, force: true });
      }
    });
  }
});
