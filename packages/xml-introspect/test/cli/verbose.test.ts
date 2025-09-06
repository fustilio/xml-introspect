import { describe, it, expect } from 'vitest';
import { execa } from 'execa';

describe('CLI Verbose Mode', () => {
  it('should show minimal output by default', async () => {
    const { stdout } = await execa('node', ['dist/cli.js', 'schema', 'data/input/oewn.xml']);
    
    // Should not contain verbose messages
    expect(stdout).not.toContain('📁 Input file:');
    expect(stdout).not.toContain('📄 Output file:');
    expect(stdout).not.toContain('🔧 Command:');
    expect(stdout).not.toContain('📊 Analyzing XML file:');
    expect(stdout).not.toContain('🔄 Using in-memory analysis:');
    
    // Should still show essential output
    expect(stdout).toContain('🚀 Starting XML Introspector CLI...');
    expect(stdout).toContain('✅ Command completed successfully');
    expect(stdout).toContain('📋 Generated XSD:');
  });

  it('should show verbose output when --verbose flag is used', async () => {
    const { stdout } = await execa('node', ['dist/cli.js', 'schema', 'data/input/oewn.xml', '--verbose']);
    
    // Should contain verbose messages
    expect(stdout).toContain('📁 Input file: data/input/oewn.xml');
    expect(stdout).toContain('📄 Output file: stdout');
    expect(stdout).toContain('🔧 Command: schema');
    expect(stdout).toContain('📊 Analyzing XML file:');
    expect(stdout).toContain('🔄 Using in-memory analysis...');
    expect(stdout).toContain('📖 XML file loaded into memory');
    expect(stdout).toContain('🔍 Parsing XML structure...');
    
    // Should still show essential output
    expect(stdout).toContain('🚀 Starting XML Introspector CLI...');
    expect(stdout).toContain('✅ Command completed successfully');
    expect(stdout).toContain('📋 Generated XSD:');
  });

  it('should show verbose output when -v flag is used', async () => {
    const { stdout } = await execa('node', ['dist/cli.js', 'schema', 'data/input/oewn.xml', '-v']);
    
    // Should contain verbose messages
    expect(stdout).toContain('📁 Input file: data/input/oewn.xml');
    expect(stdout).toContain('📄 Output file: stdout');
    expect(stdout).toContain('🔧 Command: schema');
    expect(stdout).toContain('📊 Analyzing XML file:');
    expect(stdout).toContain('🔄 Using in-memory analysis...');
  });
});
