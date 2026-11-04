import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        autoSubfolderIndex: true,
        // Static resumes are copied from public; the prerenderer reads responses as text.
        filter: ({ path }) => !/\.(pdf|html)$/i.test(path),
      },
    }),
    viteReact(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
    },
  },
});
