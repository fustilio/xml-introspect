import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: ['test/cli/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'test/browser', 'test/node', 'test/unit', 'test/integration'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    },
    testTimeout: 120000, // 2 minutes for CLI tests (they can be slow)
    hookTimeout: 30000,
    teardownTimeout: 30000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        maxForks: 1
      }
    }
  },
  resolve: {
    alias: {
      '@': './src'
    }
  }
});
