import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { BuildConfig } from "./types.js";

export async function setupViteV5(paths: BuildConfig): Promise<void> {
  console.log("Creating Vite app...");

  const viteTestEnv = path.join(paths.envDir, "vite-v5-test");
  console.log(viteTestEnv);

  execSync("npm create -y vite@5 vite-v5-test -- --template react-ts", {
    cwd: paths.envDir,
  });

  // Copy package files to the Vite project directory
  fs.copyFileSync(
    path.join(paths.envDir, "reflct-react.tgz"),
    path.join(viteTestEnv, "reflct-react.tgz")
  );
  fs.copyFileSync(
    path.join(paths.envDir, "reflct-api.tgz"),
    path.join(viteTestEnv, "reflct-api.tgz")
  );

  execSync("npm install ./reflct-react.tgz", {
    cwd: viteTestEnv,
  });

  // Create Vite example page
  const viteAppContent = `"use client";

import { Viewer } from "@reflct/react";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Viewer
        id={import.meta.env.VITE_SCENE_ID || "a"}
        apikey={import.meta.env.VITE_API_KEY || "b"}
        sharedMemoryForWorkers={false}
      />
    </div>
  );
}

export default App;`;

  fs.writeFileSync(
    path.join(paths.envDir, "vite-v5-test/src/App.tsx"),
    viteAppContent
  );

  // Create Vite env file
  const viteEnvContent = fs
    .readFileSync(path.join(paths.tmpDir, paths.envFile), "utf8")
    .replace(/SCENE_ID/g, "VITE_SCENE_ID")
    .replace(/REFLCT_API_KEY/g, "VITE_API_KEY");
  fs.writeFileSync(
    path.join(paths.envDir, "vite-v5-test/.env"),
    viteEnvContent
  );

  console.log(`Created Vite project in ${viteTestEnv}`);
}

export async function setupViteV6(paths: BuildConfig): Promise<void> {
  console.log("Creating Vite app...");

  const viteTestEnv = path.join(paths.envDir, "vite-v6-test");
  console.log(viteTestEnv);

  execSync("npm create -y vite@6 vite-v6-test -- --template react-ts", {
    cwd: paths.envDir,
  });

  fs.copyFileSync(
    path.join(paths.envDir, "reflct-react.tgz"),
    path.join(viteTestEnv, "reflct-react.tgz")
  );
  fs.copyFileSync(
    path.join(paths.envDir, "reflct-api.tgz"),
    path.join(viteTestEnv, "reflct-api.tgz")
  );
  execSync("npm install ./reflct-react.tgz", {
    cwd: viteTestEnv,
  });

  // Create Vite example page
  const viteAppContent = `"use client";

import { Viewer } from "@reflct/react";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Viewer
        id={import.meta.env.VITE_SCENE_ID || "a"}
        apikey={import.meta.env.VITE_API_KEY || "b"}
        sharedMemoryForWorkers={false}
      />
    </div>
  );
}

export default App;`;

  fs.writeFileSync(
    path.join(paths.envDir, "vite-v6-test/src/App.tsx"),
    viteAppContent
  );

  // Create Vite env file
  const viteEnvContent = fs
    .readFileSync(path.join(paths.tmpDir, paths.envFile), "utf8")
    .replace(/SCENE_ID/g, "VITE_SCENE_ID")
    .replace(/REFLCT_API_KEY/g, "VITE_API_KEY");
  fs.writeFileSync(
    path.join(paths.envDir, "vite-v6-test/.env"),
    viteEnvContent
  );

  console.log(`Created Vite project in ${viteTestEnv}`);
}
