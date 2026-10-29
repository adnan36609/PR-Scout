import { existsSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { defineConfig } from "vitest/config";

const envFile = resolve(process.cwd(), ".env");

if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["eval/**/*.eval.test.ts"],
    testTimeout: 150_000,
    hookTimeout: 150_000,
    fileParallelism: false,
  },
});