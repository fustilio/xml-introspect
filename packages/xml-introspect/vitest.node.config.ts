import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: [
      'test/node/**/*.test.ts',
      'test/integration/**/*.test.ts',
      'test/unit/**/*.test.ts'
    ],
    exclude: ['node_modules', 'dist', 'test/browser', 'test/cli'],
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
    testTimeout: 60000,
    hookTimeout: 20000,
    teardownTimeout: 20000,
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
