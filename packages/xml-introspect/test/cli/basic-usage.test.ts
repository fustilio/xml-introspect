import { describe, it, expect } from 'vitest';
import { execa } from 'execa';

describe('CLI Basic Usage', () => {
  it('should execute a basic command successfully', async () => {
    const { stdout } = await execa('node', ['packages/xml-introspect/src/cli.ts', '--version']);
    expect(stdout).toMatch(/\d+\.\d+\.\d+/); // Expect a version number output
  });

  it('should process a valid input file', async () => {
    const { stdout } = await execa('node', ['packages/xml-introspect/src/cli.ts', '--input', 'data/input/WN-LMF-1.4.xsd']);
    expect(stdout).toContain('Processing completed'); // Adjust based on actual output
  });
});
