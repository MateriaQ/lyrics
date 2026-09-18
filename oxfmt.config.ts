import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: [
    "dist/**",
    "**/dist/**",
    ".svelte-kit/**",
    "**/node_modules/**",
    "**/.turbo/**",
    "**/migrations/**",
    "**/kuromoji-dict/**",
  ],
});
