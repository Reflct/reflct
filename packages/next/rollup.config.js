import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import { dts } from "rollup-plugin-dts";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import banner from "rollup-plugin-banner2";
import "dotenv/config";

const packageJson = require("./package.json");

export default [
  defineConfig({
    input: "src/index.ts",
    output: [
      {
        dir: "dist/esm",
        format: "esm",
        sourcemap: true,
        name: "reflct-next",
      },
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
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      terser(),
      banner(() => `"use client"\n`),
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
