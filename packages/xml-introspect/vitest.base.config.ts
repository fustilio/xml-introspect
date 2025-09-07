import { defineConfig } from 'vitest/config';

// Base test configuration
const baseConfig = {
  globals: true,
  setupFiles: [],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: ['node_modules/', 'dist/', 'test/', '**/*.d.ts', '**/*.config.*'],
    thresholds: {
      global: { branches: 80, functions: 80, lines: 80, statements: 80 }
    }
  },
  resolve: {
    alias: { '@': './src' }
  },
  esbuild: { target: 'node18' }
} as const;

// Environment-specific configs
export const NODE_CONFIG = {
  environment: 'node',
  pool: 'forks',
  poolOptions: { forks: { singleFork: true, maxForks: 1 } }
} as const;

export const BROWSER_CONFIG = {
  environment: 'jsdom',
  testTimeout: 30000,
  hookTimeout: 10000,
  teardownTimeout: 10000
} as const;

export const CLI_CONFIG = {
  environment: 'node',
  testTimeout: 120000,
  hookTimeout: 30000,
  teardownTimeout: 30000,
  pool: 'forks',
  poolOptions: { forks: { singleFork: true, maxForks: 1 } }
} as const;

// Factory function
export const createVitestConfig = (overrides: any) => {
  return defineConfig({
    test: { ...baseConfig, ...overrides },
    resolve: baseConfig.resolve
  });
};
