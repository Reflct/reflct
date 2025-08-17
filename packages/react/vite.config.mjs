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
        "react/jsx-runtime",
        "gsap",
        "gsap/CustomEase",
        "playcanvas",
        "@reflct/api",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
          gsap: "gsap",
          "gsap/CustomEase": "gsap.CustomEase",
          playcanvas: "pc",
          "@reflct/api": "ReflctApi",
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
