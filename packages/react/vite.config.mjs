import { libInjectCss } from "vite-plugin-lib-inject-css";
import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    libInjectCss(),
    dts({
      insertTypesEntry: true,
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**"],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ReflctReact",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "mjs" : "js"}`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "@react-three/drei",
        "@react-three/fiber",
        "@react-three/offscreen",
        "@mkkellogg/gaussian-splats-3d",
        "gsap",
        "three",
        "@reflct/api-internal",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@react-three/drei": "ReactThreeDrei",
          "@react-three/fiber": "ReactThreeFiber",
          "@react-three/offscreen": "ReactThreeOffscreen",
          "@mkkellogg/gaussian-splats-3d": "GaussianSplats3d",
          gsap: "gsap",
          three: "THREE",
          "@reflct/api-internal": "ReflctApi",
        },
      },
    },
    sourcemap: true,
    minify: true,
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
  define: {
    "process.env.API_BASE_URL": JSON.stringify(process.env.API_BASE_URL),
  },
});
