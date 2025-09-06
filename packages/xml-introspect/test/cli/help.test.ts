import { describe, it, expect } from 'vitest';
import { execa } from 'execa';

describe('CLI Help Command', () => {
  it('should display help information', async () => {
    const { stdout } = await execa('node', ['packages/xml-introspect/src/cli.ts', '--help']);
    expect(stdout).toContain('Usage'); // Adjust based on your CLI's help output
  });

  it('should handle invalid arguments gracefully', async () => {
    const { stderr } = await execa('node', ['packages/xml-introspect/src/cli.ts', '--invalid']);
    expect(stderr).toContain('Unknown option'); // Adjust based on your CLI's error output
  });
});
