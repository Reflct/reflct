import "dotenv/config";

import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  minify: true,
  sourcemap: true,
  tsconfig: "tsconfig.json",
  outfile: "dist/cjs/index.js",
  define: {
    "process.env.API_BASE_URL": JSON.stringify(process.env.API_BASE_URL),
  },
});

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: "esm",
  tsconfig: "tsconfig.json",
  outfile: "dist/esm/index.js",
  define: {
    "process.env.API_BASE_URL": JSON.stringify(process.env.API_BASE_URL),
  },
});
