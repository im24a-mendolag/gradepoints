import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json"],
      include: ["src/**", "extension/**/*.js", "public/sw.js", "prisma/**/*.ts"],
      exclude: ["src/generated/**", "**/*.test.{ts,tsx}"],
    },
  },
});
