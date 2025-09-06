import { describe, it, expect } from 'vitest';
import { execa } from 'execa';
import * as config from './xml-urls.config.json';

describe('CLI XML URL Tests', () => {
  config.xmlUrls.forEach((url) => {
    it(`should process the URL: ${url}`, async () => {
      const { stdout } = await execa('node', ['packages/xml-introspect/src/cli.ts', '--url', url]);
      expect(stdout).toContain('Processing completed'); // Adjust based on actual CLI output
    });
  });
});
