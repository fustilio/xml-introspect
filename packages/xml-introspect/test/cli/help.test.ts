import { describe, it, expect } from 'vitest';
import { execa } from 'execa';

describe('CLI Help Command', () => {
  it('should display help information', async () => {
    const { stdout } = await execa('node', ['dist/cli.js', '--help']);
    expect(stdout).toContain('Usage'); // Adjust based on your CLI's help output
  });

  it('should handle invalid arguments gracefully', async () => {
    try {
      const { stderr, stdout } = await execa('node', ['dist/cli.js', '--invalid']);
      // The CLI shows "No command specified" error in stderr and help in stdout
      expect(stderr).toContain('No command specified');
      expect(stdout).toContain('XML Introspector CLI Tool');
    } catch (error) {
      // If execa throws an error, check that it contains the expected content
      expect(error.stderr).toContain('No command specified');
      expect(error.stdout).toContain('XML Introspector CLI Tool');
    }
  });
});
