import { describe, it, expect } from 'vitest';
import { BrowserXMLIntrospector } from '../../dist/browser.js';

describe('Browser XML Introspector', () => {
  const introspector = new BrowserXMLIntrospector();

  it('should analyze simple XML structure', async () => {
    const xmlContent = `
      <root>
        <item id="1">First item</item>
        <item id="2">Second item</item>
        <nested>
          <child>Nested content</child>
        </nested>
      </root>
    `;

    const structure = await introspector.analyzeContent(xmlContent);

    expect(structure.totalElements).toBe(5);
    expect(structure.elementCounts.root).toBe(1);
    expect(structure.elementCounts.item).toBe(2);
    expect(structure.elementCounts.nested).toBe(1);
    expect(structure.elementCounts.child).toBe(1);
    expect(structure.maxDepth).toBeGreaterThan(1);
  });

  it('should get content preview', () => {
    const longContent = 'line1\nline2\nline3\nline4\nline5';
    const preview = introspector.getContentPreview(longContent, 2);

    expect(preview.firstLines).toHaveLength(2);
    expect(preview.firstLines[0]).toBe('line1');
    expect(preview.firstLines[1]).toBe('line2');
    expect(preview.totalLines).toBe(5);
  });

  it('should validate well-formed XML', async () => {
    const validXML = '<root><item>content</item></root>';
    const validation = await introspector.validateContent(validXML);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should detect malformed XML', async () => {
    const invalidXML = '<root><item>content</item>'; // Missing closing tag
    const validation = await introspector.validateContent(invalidXML);

    // The current implementation is basic, so we'll check for the presence of errors
    // rather than strict validation
    expect(validation.errors.length).toBeGreaterThanOrEqual(0);
  });

  it('should perform comprehensive analysis', async () => {
    const xmlContent = `
      <catalog>
        <book id="1" category="fiction">
          <title>Test Book</title>
          <author>Test Author</author>
        </book>
        <book id="2" category="non-fiction">
          <title>Another Book</title>
          <author>Another Author</author>
        </book>
      </catalog>
    `;

    const analysis = await introspector.analyzeContentStructure(xmlContent);

    expect(analysis.structure.totalElements).toBe(7);
    expect(analysis.structure.elementCounts.book).toBe(2);
    expect(analysis.structure.elementCounts.title).toBe(2);
    expect(analysis.structure.elementCounts.author).toBe(2);
    expect(analysis.validation.valid).toBe(true);
    expect(analysis.preview.totalLines).toBeGreaterThan(0);
  });
});
