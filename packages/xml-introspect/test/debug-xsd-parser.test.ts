import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { XSDParser } from '../src/XSDParser';

describe('Debug XSD Parser', () => {
  it('should debug the official WN-LMF-1.4.xsd parsing', async () => {
    const parser = new XSDParser();
    
    // Read the official schema
    const officialXSDPath = join(process.cwd(), 'data', 'input', 'WN-LMF-1.4.xsd');
    const officialXSDContent = readFileSync(officialXSDPath, 'utf8');
    
    console.log('📄 Official WN-LMF-1.4.xsd content (first 500 chars):');
    console.log(officialXSDContent.substring(0, 500));
    
    console.log('\n🔍 Looking for element tags...');
    const lines = officialXSDContent.split('\n');
    let elementCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('<element')) {
        console.log(`Line ${i + 1}: ${line}`);
        elementCount++;
        if (elementCount > 10) break; // Limit output
      }
    }
    
    console.log(`\n📊 Found ${elementCount} element tags`);
    
    // Try to parse it
    console.log('\n🔄 Attempting to parse...');
    try {
      const xsdXAST = parser.parseXSDContent(officialXSDContent);
      console.log('✅ Parsing successful!');
      console.log('Namespace:', xsdXAST.namespace);
      console.log('Elements found:', xsdXAST.elements.size);
      console.log('Element names:', Array.from(xsdXAST.elements.keys()));
    } catch (error) {
      console.log('❌ Parsing failed:', error);
    }
  });
});
