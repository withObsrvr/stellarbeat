import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";
import topLevelAwait from "vite-plugin-top-level-await";
import eslint from "vite-plugin-eslint";
import tsConfigPaths from "vite-tsconfig-paths";

/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [tsConfigPaths(), vue(), eslint(), topLevelAwait()],
  envPrefix: "VUE_",
  worker: {
    plugins: () => [topLevelAwait()],
  },
  resolve: {
    alias: {
      "@": "/src",
    },
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
  },
  define: {
    "process.env": process.env,
  },
  build: {
    commonjsOptions: {
      include: [
        /shared/,
        /node_modules/,
        /shared\/lib\/network-schema/,
        /scp-simulation/,
      ],
    },
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          d3: [
            "d3-force",
            "d3-shape",
            "d3-selection",
            "d3-zoom",
            "d3-polygon",
            "d3-drag",
          ],
          jquery: ["jquery"],
          vue: ["vue", "vue-router", "vue-multiselect", "portal-vue"],
          sentry: ["@sentry/vue"],
          shared: ["shared"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["shared", "shared/lib/network-schema", "scp-simulation"],
  },
  css: {
    devSourcemap: true,
  },
});
