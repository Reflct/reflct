import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { setupNextJs } from "./utils/setup-nextjs.js";
import {
  setupTestEnvironment,
  startNextJsProject,
  takeSnapshot,
} from "./utils/test-helpers.js";

test.describe("Visual Regression Tests", () => {
  test("Next.js project snapshot", async ({ page }, testInfo) => {
    const paths = await setupTestEnvironment("development");

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

        // Take snapshot
        await takeSnapshot(page, "nextjs-viewer", testInfo);

        // Compare with baseline
        await expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
          "nextjs-viewer.png"
        );
      } finally {
        cleanup();
      }
    } finally {
      // Cleanup temp directories
      fs.rmSync(paths.tmpDir, { recursive: true, force: true });
      fs.rmSync(paths.envDir, { recursive: true, force: true });
    }
  });
});
