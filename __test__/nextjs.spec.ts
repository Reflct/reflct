import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { setupNextJsV14, setupNextJsV15 } from "./utils/setup-nextjs.js";
import {
  getEnvironmentFromTestName,
  setupTestEnvironment,
  startNextJsProject,
  takeSnapshot,
} from "./utils/test-helpers.js";

const environments = ["development", "staging", "production"] as const;

test.describe("Visual Regression Tests", () => {
  for (const env of environments) {
    test(`Next.js v14 project snapshot (${env})`, async ({
      page,
    }, testInfo) => {
      const environment = getEnvironmentFromTestName(testInfo.title);
      const paths = await setupTestEnvironment(environment);

      try {
        // Setup Next.js project
        await setupNextJsV14(paths);

        // Start the project
        const { port, cleanup } = await startNextJsProject(
          paths,
          "next-v14-test"
        );

        try {
          // Navigate to the page
          await page.goto(`http://localhost:${port}`, {
            waitUntil: "networkidle",
          });

          // Wait for 5 seconds
          await page.waitForTimeout(5000);

          const snapshotName = `nextjs-v14-viewer-${environment}`;

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

    test(`Next.js v15 project snapshot (${env})`, async ({
      page,
    }, testInfo) => {
      const environment = getEnvironmentFromTestName(testInfo.title);
      const paths = await setupTestEnvironment(environment);

      try {
        // Setup Next.js project
        await setupNextJsV15(paths);

        // Start the project
        const { port, cleanup } = await startNextJsProject(
          paths,
          "next-v15-test"
        );

        try {
          // Navigate to the page
          await page.goto(`http://localhost:${port}`, {
            waitUntil: "networkidle",
          });

          // Wait for 5 seconds
          await page.waitForTimeout(5000);

          const snapshotName = `nextjs-v15-viewer-${environment}`;

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
