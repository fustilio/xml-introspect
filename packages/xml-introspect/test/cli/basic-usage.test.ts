import { describe, it, expect } from 'vitest';
import { execa } from 'execa';

describe('CLI Basic Usage', () => {
  it('should execute a basic command successfully', async () => {
    const { stderr } = await execa('node', ['dist/cli.js', '--help']);
    expect(stderr).toContain('XML Introspector CLI Tool'); // Commander.js outputs help to stderr
  });

  it('should process a valid input file', async () => {
    const { stdout } = await execa('node', ['dist/cli.js', 'schema', 'data/input/WN-LMF-1.4.xsd']);
    expect(stdout).toContain('Command completed successfully'); // Adjust based on actual output
  });
});
