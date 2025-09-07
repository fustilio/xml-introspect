import { describe, it, expect } from 'vitest';
import { execa } from 'execa';
import * as config from './xml-urls.config.json';

describe('CLI XML URL Tests', () => {
  config.xmlUrls
  .forEach((url) => {
    it(`should be able to preview: ${url}`, async () => {
      const { stdout } = await execa('node', ['dist/cli.js', 'preview', url]);
      if (!stdout.includes('Preview completed')) {
        console.warn(`stdout for ${url}:`, stdout);
      }
      expect(stdout).toContain('Preview completed');
    }, 60000);
  });
});
