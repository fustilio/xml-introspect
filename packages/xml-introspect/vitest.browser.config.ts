import { createVitestConfig, BROWSER_CONFIG } from './vitest.base.config';

export default createVitestConfig({
  ...BROWSER_CONFIG,
  include: ['test/browser/**/*.test.ts'],
  exclude: ['node_modules', 'dist', 'test/node', 'test/cli', 'test/unit', 'test/integration']
});
