import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));
const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": srcDir,
      "@root": rootDir,
    },
  },
  test: {
    environment: "node",
    env: {
      POSTGRES_LYRICS_URL: "postgresql://materiaq:materiaq_password@localhost:5432/lyrics_test",
      POSTGRES_AUTH_URL: "postgresql://materiaq:materiaq_password@localhost:5432/auth_test",
      VALKEY_URL: "redis://:materiaq_valkey_password@localhost:6379",
    },
    globalSetup: [fileURLToPath(new URL("./vitest.global-setup.ts", import.meta.url))],
  },
});
