import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import { dts } from "rollup-plugin-dts";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import replace from "@rollup/plugin-replace";
import "dotenv/config";

const packageJson = require("./package.json");

export default [
  defineConfig({
    input: "src/index.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: true,
        name: "reflct-react",
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
      },
    ],
    external: [
      "@mkkellogg/gaussian-splats-3d",
      "@react-three/drei",
      "@react-three/fiber",
      "gsap",
      "react",
      "three",
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      postcss({
        modules: true,
        extract: false,
        use: ["sass"],
        extensions: [".css", ".scss", ".sass"],
      }),
      typescript({ tsconfig: "./tsconfig.json" }),
      replace({
        "process.env.API_BASE_URL": JSON.stringify(process.env.API_BASE_URL),
      }),
      terser(),
    ],
  }),
  defineConfig({
    input: "dist/esm/types/index.d.ts",
    output: {
      file: "dist/index.d.ts",
      format: "esm",
    },
    external: [/\.css$/],
    plugins: [dts()],
  }),
];
