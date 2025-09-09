import { createVitestConfig, NODE_CONFIG } from './vitest.base.config';

export default createVitestConfig({
  ...NODE_CONFIG,
  include: [
    'src/xsdast/**/*.test.ts',
    'test/node/**/*.test.ts',
    'test/core/**/*.test.ts'
  ],
  exclude: ['node_modules', 'dist', 'test/browser', 'test/cli'],
  testTimeout: 60000,
  hookTimeout: 20000,
  teardownTimeout: 20000
});
