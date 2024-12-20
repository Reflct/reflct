import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { setupNextJs } from "./utils/setup-nextjs.js";
import {
  setupTestEnvironment,
  startNextJsProject,
  takeSnapshot,
  getEnvironmentFromTestName,
} from "./utils/test-helpers.js";

const environments = ["development", "staging", "production"] as const;

test.describe("Visual Regression Tests", () => {
  for (const env of environments) {
    test(`Next.js project snapshot (${env})`, async ({ page }, testInfo) => {
      const environment = getEnvironmentFromTestName(testInfo.title);
      const paths = await setupTestEnvironment(environment);

      try {
        // Setup Next.js project
        await setupNextJs(paths);

        // Start the project
        const { port, cleanup } = await startNextJsProject(paths);

        try {
          // Navigate to the page
          await page.goto(`http://localhost:${port}`, {
            waitUntil: "networkidle",
          });

          const snapshotName = `nextjs-viewer-${environment}`;

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
