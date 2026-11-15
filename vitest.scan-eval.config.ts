import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    include: ["scripts/meal-scan.eval.ts"], environment: "node",
    env: loadEnv("development", process.cwd(), ""),
    testTimeout: 90000, hookTimeout: 90000,
    fileParallelism: false,
  },
});
