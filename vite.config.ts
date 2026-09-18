import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    projects: [
      "apps/backend/vitest.config.ts",
      "apps/frontend/vitest.config.ts",
      {
        root: "packages/@romanizer",
        resolve: {
          tsconfigPaths: true,
        },
        test: {
          include: ["**/*.test.ts"],
        },
      },
    ],
  },
});
