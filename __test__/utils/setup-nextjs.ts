import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { BuildConfig } from "./types.js";

export async function setupNextJs(paths: BuildConfig): Promise<void> {
  console.log("Creating Next.js app...");
  const nextTestEnv = path.join(paths.envDir, "next-test");

  execSync(
    'npx -y create-next-app@14 next-test --ts --no-tailwind --no-eslint --app --no-src-dir --import-alias "@/*"',
    { cwd: paths.envDir }
  );
  execSync("npm install ../reflct-react.tgz", {
    cwd: path.join(paths.envDir, "next-test"),
  });

  // Create Next.js example page
  const nextPageContent = `"use client";

import { Viewer } from "@reflct/react";

export default function Home() {
  return (
    <main style={{ width: "100vw", height: "100vh" }}>
      <Viewer
        id={process.env.NEXT_PUBLIC_SCENE_ID || ""}
        apikey={process.env.NEXT_PUBLIC_REFLCT_API_KEY || ""}
        sharedMemoryForWorkers={false}
      />
    </main>
  );
}`;

  fs.writeFileSync(
    path.join(paths.envDir, "next-test/app/page.tsx"),
    nextPageContent
  );

  // Create Next.js env file
  const nextEnvContent = fs
    .readFileSync(path.join(paths.tmpDir, paths.envFile), "utf8")
    .replace(/SCENE_ID/g, "NEXT_PUBLIC_SCENE_ID")
    .replace(/REFLCT_API_KEY/g, "NEXT_PUBLIC_REFLCT_API_KEY");

  fs.writeFileSync(path.join(nextTestEnv, ".env"), nextEnvContent);

  console.log(`Created Next.js project in ${nextTestEnv}`);
}
