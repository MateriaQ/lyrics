# @workspace/typescript-config

Shared TypeScript configurations for the MateriaQ workspace.

## Usage

Extend from the shared configs in your app's `tsconfig.json`:

```json
{
  "extends": "@workspace/typescript-config/base",
  "compilerOptions": {
    // Your app-specific options
  }
}
```

## Available Configs

- `base.json` - Base configuration for all packages
- `elysia.json` - Configuration for Elysia/Bun backend apps
- `sveltekit.json` - Configuration for SvelteKit frontend apps
