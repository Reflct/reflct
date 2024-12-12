// Import necessary modules
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Set up directories
const PORT = 5188;
const rootDir = process.cwd();
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tmp-"));
const envDir = path.join(tmpDir, "tmp");

fs.mkdirSync(envDir, { recursive: true });

console.log(`root_dir: ${rootDir}`);
console.log(`tmp_dir: ${tmpDir}`);
console.log(`env_dir: ${envDir}`);

// Copy everything except node_modules and .git
execSync(
  `rsync -av --exclude='node_modules' --exclude='.git' ${rootDir}/ ${tmpDir}/`
);

// Copy .env files
fs.copyFileSync(
  path.join(tmpDir, ".env"),
  path.join(tmpDir, "packages/api/.env")
);
fs.copyFileSync(
  path.join(tmpDir, ".env"),
  path.join(tmpDir, "packages/react/.env")
);

// Install npm packages
execSync("npm install", { cwd: tmpDir });

// Build and pack API
execSync("npm run build", { cwd: path.join(tmpDir, "packages/api") });
execSync("npm pack", { cwd: path.join(tmpDir, "packages/api") });
fs.renameSync(
  path.join(tmpDir, "packages/api", "reflct-api-*.tgz"),
  path.join(tmpDir, "packages/react", "reflct-api.tgz")
);

// Set React package dependency
execSync("npm pkg set dependencies.@reflct/api=./reflct-api.tgz", {
  cwd: path.join(tmpDir, "packages/react"),
});

// Build and pack React
execSync("npm run build", { cwd: path.join(tmpDir, "packages/react") });
execSync("npm pack", { cwd: path.join(tmpDir, "packages/react") });
fs.renameSync(
  path.join(tmpDir, "packages/react", "reflct-react-*.tgz"),
  path.join(envDir, "reflct-react.tgz")
);
fs.renameSync(
  path.join(tmpDir, "packages/react", "reflct-api.tgz"),
  path.join(envDir, "reflct-api.tgz")
);

// Create Next.js app
console.log("Creating Next.js app...");
execSync(
  `npx -y create-next-app@14 ${envDir}/next-test --ts --no-tailwind --no-eslint --app --no-src-dir --import-alias "@/*"`,
  { cwd: envDir }
);
execSync("npm install ../reflct-react.tgz", {
  cwd: path.join(envDir, "next-test"),
});

// Create example page
const nextPageContent = `
"use client";

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
}
`;
fs.writeFileSync(path.join(envDir, "next-test/app/page.tsx"), nextPageContent);

// Update .env for Next.js
const envContent = fs
  .readFileSync(path.join(tmpDir, ".env"), "utf8")
  .replace(/SCENE_ID/g, "NEXT_PUBLIC_SCENE_ID")
  .replace(/REFLCT_API_KEY/g, "NEXT_PUBLIC_REFLCT_API_KEY");
fs.writeFileSync(path.join(envDir, "next-test/.env"), envContent);

// Create React app
execSync("npm create -y vite@latest tmp/vite-test -- --template react-ts", {
  cwd: tmpDir,
});
execSync("npm install ../reflct-react.tgz", {
  cwd: path.join(tmpDir, "vite-test"),
});

// Update App.tsx
const viteAppContent = `
"use client";

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

export default App;
`;
fs.writeFileSync(path.join(tmpDir, "vite-test/src/App.tsx"), viteAppContent);

// Update .env for Vite
const viteEnvContent = fs
  .readFileSync(path.join(rootDir, ".env"), "utf8")
  .replace(/SCENE_ID/g, "VITE_SCENE_ID")
  .replace(/REFLCT_API_KEY/g, "VITE_API_KEY");
fs.writeFileSync(path.join(tmpDir, "vite-test/.env"), viteEnvContent);

console.log(`Setup complete! Test environments created in ${tmpDir}`);
