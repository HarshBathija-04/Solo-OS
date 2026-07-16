import { defineConfig } from "vitest/config";

export default defineConfig({
  // Prevent vite from walking up to the repo root and loading the vestigial
  // Next.js postcss.config.mjs there.
  css: { postcss: { plugins: [] } },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
