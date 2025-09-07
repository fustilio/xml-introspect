import { describe, it, expect } from 'vitest';
import { execa } from 'execa';
import * as config from './xml-urls.config.json';

function getFilenameWithoutExtension(url: string) {
  return url.split('/').pop()?.split('.').slice(0, -1).join('.');
}

describe('CLI XML URL Tests', () => {
  config.xmlUrls.slice(0, 1).forEach((url) => {
    it(`should be able to preview: ${url}`, async () => {
      const { stdout } = await execa('node', [
        'dist/cli.js',
        'schema',
        url,
        `${getFilenameWithoutExtension(url)}.xsd`,
      ]);
      if (!stdout.includes('Preview completed')) {
        console.warn(`stdout for ${url}:`, stdout);
      }
      expect(stdout).toContain('Preview completed');
    }, 60000);
  });
});
