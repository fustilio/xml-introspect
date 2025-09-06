import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    include: ['test/browser/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'test/node', 'test/cli', 'test/unit', 'test/integration'],
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
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000
  },
  resolve: {
    alias: {
      '@': './src'
    }
  }
});
