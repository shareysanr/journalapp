import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/generated/**", "**/*.d.ts", "dist/**", "node_modules/**"],
      thresholds: {
        lines: 20,
        statements: 20,
        functions: 20,
        branches: 20
      }
    }
  }
});
