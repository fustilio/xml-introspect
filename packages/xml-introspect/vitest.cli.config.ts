import { createVitestConfig, CLI_CONFIG } from './vitest.base.config';

export default createVitestConfig({
  ...CLI_CONFIG,
  include: ['test/cli/**/*.test.ts'],
  exclude: ['node_modules', 'dist', 'test/browser', 'test/node', 'test/unit', 'test/integration']
});
