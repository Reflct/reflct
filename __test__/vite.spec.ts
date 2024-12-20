import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { setupVite } from "./utils/setup-vite.js";
import {
  setupTestEnvironment,
  startViteProject,
  takeSnapshot,
} from "./utils/test-helpers.js";

test.describe("Visual Regression Tests", () => {
  test("Vite project snapshot", async ({ page }, testInfo) => {
    const paths = await setupTestEnvironment("development");

    try {
      // Setup Vite project
      await setupVite(paths);

      // Start the project
      const { port, cleanup } = await startViteProject(paths);

      try {
        // Navigate to the page
        await page.goto(`http://localhost:${port}`, {
          waitUntil: "networkidle",
        });

        // Take snapshot
        await takeSnapshot(page, "vite-viewer", testInfo);

        // Compare with baseline
        await expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
          "vite-viewer.png"
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
