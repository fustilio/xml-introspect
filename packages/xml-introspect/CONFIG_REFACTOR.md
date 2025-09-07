# Advanced Configuration System

This document outlines the sophisticated configuration structure that leverages Vite's advanced features including conditional configs, environment variables, and shared base configs to reduce duplication and improve maintainability.

## File Structure

```
├── vite.base.config.ts          # Advanced shared Vite configuration
├── vite.config.ts              # Node.js + CLI build config
├── vite.browser.config.ts      # Browser build config
├── vitest.base.config.ts       # Enhanced shared Vitest configuration
├── vitest.node.config.ts       # Node.js test config
├── vitest.browser.config.ts    # Browser test config
├── vitest.cli.config.ts        # CLI test config
├── env.example                 # Environment variables template
└── CONFIG_REFACTOR.md          # This documentation
```

## Shared Configurations

### Advanced Vite Base Config (`vite.base.config.ts`)

```typescript
import { defineConfig, type UserConfig, loadEnv } from 'vite';

// Common external dependencies
export const NODE_EXTERNALS = ['fs', 'path', 'process', 'stream', 'util', 'crypto', 'sax'];

// Environment-specific build targets
export const BUILD_TARGETS = {
  node: 'node18',
  browser: 'esnext',
  modern: 'es2022'
} as const;

// Pre-configured rollup options
export const ROLLUP_OPTIONS = {
  node: { external: NODE_EXTERNALS, output: { format: 'es' } },
  browser: { external: NODE_EXTERNALS, output: { format: 'es' } }
} as const;

// Advanced factory with conditional config and environment variables
export const createViteConfig = (overrides: Partial<UserConfig> = {}) => {
  return defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    // Conditional configuration based on command and mode
    if (command === 'serve') {
      return { /* dev server config */ };
    }
    
    if (command === 'build') {
      return { /* build config with defines */ };
    }
    
    return baseConfig;
  });
};
```

### Vitest Base Config (`vitest.base.config.ts`)

```typescript
export const baseVitestConfig = {
  globals: true,
  setupFiles: [],
  coverage: { /* shared coverage config */ },
  resolve: { alias: { '@': './src' } }
} as const;

// Pre-configured test environments
export const NODE_TEST_CONFIG = { /* Node.js settings */ };
export const BROWSER_TEST_CONFIG = { /* Browser settings */ };
export const CLI_TEST_CONFIG = { /* CLI settings */ };

export const createVitestConfig = (overrides: any) => { /* ... */ };
```

## Advanced Features

### 1. **Conditional Configuration**
Based on [Vite's conditional config documentation](https://llmtext.com/vite.dev/config/), our configs automatically adapt based on:
- **Command**: `serve` vs `build` vs `preview`
- **Mode**: `development` vs `production` vs custom modes
- **Build Type**: `isSsrBuild` and `isPreview` flags

### 2. **Environment Variable Support**
- Automatic loading of `.env` files using `loadEnv()`
- Support for mode-specific environment files
- Runtime configuration based on environment variables
- Example: `VITE_DEV_PORT` for custom dev server port

### 3. **Build-time Defines**
Automatic injection of build metadata:
```typescript
define: {
  __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  __BUILD_MODE__: JSON.stringify(mode),
  __BUILD_VERSION__: JSON.stringify(process.env.npm_package_version)
}
```

### 4. **TypeScript Integration**
- Full TypeScript support with `type UserConfig`
- IntelliSense and type checking for all configurations
- Compile-time validation of configuration structure

### 5. **Coverage Thresholds**
- Enforced code coverage thresholds (80% minimum)
- Automatic coverage reporting across all test environments
- Quality gates for CI/CD pipelines

## Benefits

### 1. **DRY Principle**
- No duplication of common settings
- Single source of truth for shared configurations
- Easy to update common settings across all configs

### 2. **Maintainability**
- Changes to shared settings only need to be made in one place
- Clear separation between shared and environment-specific settings
- Consistent configuration patterns across all environments

### 3. **Type Safety**
- Shared constants are properly typed
- IDE autocomplete for shared configurations
- Compile-time validation of configuration structure

### 4. **Readability**
- Individual configs are much shorter and focused
- Clear intent with descriptive shared configurations
- Easy to understand what's shared vs. environment-specific

### 5. **Production Ready**
- Environment-specific optimizations
- Build-time metadata injection
- Coverage quality gates
- Advanced Vite features utilization

## Usage Examples

### Creating a New Build Config

```typescript
import { createViteConfig, NODE_EXTERNALS } from './vite.base.config';

export default createViteConfig({
  build: {
    target: 'esnext',
    lib: {
      entry: 'src/new-entry.ts',
      formats: ['es']
    },
    rollupOptions: {
      external: NODE_EXTERNALS
    }
  }
});
```

### Creating a New Test Config

```typescript
import { createVitestConfig, NODE_TEST_CONFIG } from './vitest.base.config';

export default createVitestConfig({
  ...NODE_TEST_CONFIG,
  include: ['test/new-environment/**/*.test.ts'],
  testTimeout: 30000
});
```

## Configuration Hierarchy

1. **Base Config** - Common settings shared across all environments
2. **Environment Config** - Pre-configured settings for specific environments
3. **Individual Config** - Environment-specific overrides and customizations

This hierarchy ensures consistency while allowing flexibility for environment-specific needs.

## Migration Notes

- All existing functionality preserved
- No breaking changes to build or test commands
- Improved maintainability and consistency
- Easier to add new environments in the future

