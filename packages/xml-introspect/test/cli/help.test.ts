import { describe, it, expect } from 'vitest';
import { execa } from 'execa';

describe('CLI Help Command', () => {
  it('should display help information', async () => {
    const { stderr } = await execa('node', ['dist/cli.js', '--help']);
    expect(stderr).toContain('Usage'); // Commander.js outputs help to stderr
  });

  it('should handle invalid arguments gracefully', async () => {
    try {
      const { stderr, stdout } = await execa('node', ['dist/cli.js', '--invalid']);
      // The CLI shows "unknown option" error in stderr
      expect(stderr).toContain('unknown option');
    } catch (error) {
      // If execa throws an error, check that it contains the expected content
      expect(error.stderr).toContain('unknown option');
    }
  });
});
