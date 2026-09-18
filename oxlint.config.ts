import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["eslint", "typescript", "unicorn", "oxc", "react"],
  rules: {
    "no-await-in-loop": "warn",
    "unicorn/prefer-array-find": "error",
    "unicorn/prefer-array-flat-map": "error",
    "unicorn/prefer-set-has": "error",
    "unicorn/no-new-array": "warn",
  },
  settings: {
    "jsx-a11y": {
      components: {},
      attributes: {},
    },
    jsdoc: {
      ignorePrivate: false,
      ignoreInternal: false,
      ignoreReplacesDocs: true,
      overrideReplacesDocs: true,
      augmentsExtendsReplacesDocs: false,
      implementsReplacesDocs: false,
      exemptDestructuredRootsFromChecks: false,
      tagNamePreference: {},
    },
  },
  env: {
    builtin: true,
  },
  options: {
    typeAware: true,
  },
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
