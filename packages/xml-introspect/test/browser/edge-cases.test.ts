import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserXMLIntrospector } from '../../dist/browser.js';

describe('Browser Edge Cases and Error Handling', () => {
  let introspector: BrowserXMLIntrospector;

  beforeEach(() => {
    introspector = new BrowserXMLIntrospector();
  });

  describe('Empty and Minimal XML', () => {
    it('should handle empty XML content', async () => {
      const emptyXML = '';

      const structure = await introspector.analyzeContent(emptyXML);
      expect(structure.totalElements).toBe(0);
      expect(structure.elementCounts).toEqual({});
      expect(structure.attributeCounts).toEqual({});
      expect(structure.rootElements).toEqual([]);
      expect(structure.commonElements).toEqual([]);
      expect(structure.attributes).toEqual([]);
      expect(structure.maxDepth).toBe(0);

      const validation = await introspector.validateContent(emptyXML);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);

      const preview = introspector.getContentPreview(emptyXML, 5);
      expect(preview.firstLines).toEqual([]);
      expect(preview.lastLines).toEqual([]);
      expect(preview.totalLines).toBe(0);
      expect(preview.preview).toBe('');
    });

    it('should handle XML with only whitespace', async () => {
      const whitespaceXML = '   \n  \t  \n  ';

      const structure = await introspector.analyzeContent(whitespaceXML);
      expect(structure.totalElements).toBe(0);
      expect(structure.elementCounts).toEqual({});

      const validation = await introspector.validateContent(whitespaceXML);
      expect(validation.valid).toBe(false);
    });

    it('should handle XML with only XML declaration', async () => {
      const declarationOnlyXML = '<?xml version="1.0" encoding="UTF-8"?>';

      const structure = await introspector.analyzeContent(declarationOnlyXML);
      expect(structure.totalElements).toBe(0);
      expect(structure.elementCounts).toEqual({});

      const validation = await introspector.validateContent(declarationOnlyXML);
      expect(validation.valid).toBe(false);
    });

    it('should handle self-closing root element', async () => {
      const selfClosingXML = '<?xml version="1.0" encoding="UTF-8"?>\n<root/>';

      const structure = await introspector.analyzeContent(selfClosingXML);
      expect(structure.totalElements).toBe(1);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.maxDepth).toBe(1);

      const validation = await introspector.validateContent(selfClosingXML);
      expect(validation.valid).toBe(true);
    });

    it('should handle XML with only text content', async () => {
      const textOnlyXML = '<?xml version="1.0" encoding="UTF-8"?>\n<root>Just some text content</root>';

      const structure = await introspector.analyzeContent(textOnlyXML);
      expect(structure.totalElements).toBe(1);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.maxDepth).toBe(1);

      const validation = await introspector.validateContent(textOnlyXML);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Malformed XML', () => {
    it('should handle XML with missing closing tags', async () => {
      const missingClosingXML = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>content</item>\n  <item>more content';

      const structure = await introspector.analyzeContent(missingClosingXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.item).toBeGreaterThan(0);

      const validation = await introspector.validateContent(missingClosingXML);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should handle XML with mismatched tags', async () => {
      const mismatchedXML = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>content</other>\n</root>';

      const structure = await introspector.analyzeContent(mismatchedXML);
      expect(structure.totalElements).toBeGreaterThan(0);

      const validation = await introspector.validateContent(mismatchedXML);
      expect(validation.valid).toBe(false);
    });

    it('should handle XML with unclosed tags', async () => {
      const unclosedXML = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>content\n</root>';

      const structure = await introspector.analyzeContent(unclosedXML);
      expect(structure.totalElements).toBeGreaterThan(0);

      const validation = await introspector.validateContent(unclosedXML);
      expect(validation.valid).toBe(false);
    });

    it('should handle XML with invalid characters', async () => {
      const invalidCharsXML = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>content with \x00 invalid chars</item>\n</root>';

      const structure = await introspector.analyzeContent(invalidCharsXML);
      expect(structure.totalElements).toBeGreaterThan(0);

      const validation = await introspector.validateContent(invalidCharsXML);
      expect(validation.valid).toBe(false);
    });

    it('should handle XML with malformed attributes', async () => {
      const malformedAttrsXML = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item id=1 name="test">content</item>\n</root>';

      const structure = await introspector.analyzeContent(malformedAttrsXML);
      expect(structure.totalElements).toBeGreaterThan(0);

      const validation = await introspector.validateContent(malformedAttrsXML);
      expect(validation.valid).toBe(false);
    });
  });

  describe('Complex Edge Cases', () => {
    it('should handle XML with very long element names', async () => {
      const longName = 'a'.repeat(1000);
      const longNameXML = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <${longName}>content</${longName}>\n</root>`;

      const structure = await introspector.analyzeContent(longNameXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts[longName]).toBe(1);

      const validation = await introspector.validateContent(longNameXML);
      expect(validation.valid).toBe(true);
    });

    it('should handle XML with very long attribute values', async () => {
      const longValue = 'x'.repeat(10000);
      const longValueXML = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item id="${longValue}">content</item>\n</root>`;

      const structure = await introspector.analyzeContent(longValueXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.attributeCounts.id).toBe(1);

      const validation = await introspector.validateContent(longValueXML);
      expect(validation.valid).toBe(true);
    });

    it('should handle XML with many attributes', async () => {
      const manyAttrs = Array.from({ length: 50 }, (_, i) => `attr${i}="value${i}"`).join(' ');
      const manyAttrsXML = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item ${manyAttrs}>content</item>\n</root>`;

      const structure = await introspector.analyzeContent(manyAttrsXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.attributeCounts.attr0).toBe(1);
      expect(structure.attributeCounts.attr49).toBe(1);

      const validation = await introspector.validateContent(manyAttrsXML);
      expect(validation.valid).toBe(true);
    });

    it('should handle XML with deeply nested structure', async () => {
      let deepXML = '<?xml version="1.0" encoding="UTF-8"?>\n<root>';
      for (let i = 1; i <= 50; i++) {
        deepXML += `<level${i}>`;
      }
      deepXML += 'deep content';
      for (let i = 50; i >= 1; i--) {
        deepXML += `</level${i}>`;
      }
      deepXML += '</root>';

      const structure = await introspector.analyzeContent(deepXML);
      expect(structure.totalElements).toBe(51); // 50 levels + 1 root
      expect(structure.maxDepth).toBe(51);

      const validation = await introspector.validateContent(deepXML);
      expect(validation.valid).toBe(true);
    });

    it('should handle XML with many siblings', async () => {
      const manySiblings = Array.from({ length: 1000 }, (_, i) => `<item id="${i}">Item ${i}</item>`).join('\n');
      const manySiblingsXML = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${manySiblings}\n</root>`;

      const structure = await introspector.analyzeContent(manySiblingsXML);
      expect(structure.totalElements).toBe(1001); // 1000 items + 1 root
      expect(structure.elementCounts.item).toBe(1000);
      expect(structure.attributeCounts.id).toBe(1000);

      const validation = await introspector.validateContent(manySiblingsXML);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Special Characters and Encoding', () => {
    it('should handle XML with special characters', async () => {
      const specialCharsXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item name="test &amp; example">content with &lt;tags&gt; and &quot;quotes&quot;</item>
  <item name="unicode: 你好世界">unicode content: 🌍</item>
  <item name="math: α + β = γ">math symbols: ∑, ∫, ∞</item>
</root>`;

      const structure = await introspector.analyzeContent(specialCharsXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.item).toBe(3);

      const validation = await introspector.validateContent(specialCharsXML);
      expect(validation.valid).toBe(true);
    });

    it('should handle XML with CDATA sections', async () => {
      const cdataXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item>
    <content><![CDATA[This is CDATA content with <tags> and & symbols]]></content>
  </item>
  <item>
    <script><![CDATA[
      function test() {
        if (x < y && y > z) {
          return "test";
        }
      }
    ]]></script>
  </item>
</root>`;

      const structure = await introspector.analyzeContent(cdataXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.item).toBe(2);
      expect(structure.elementCounts.content).toBe(1);
      expect(structure.elementCounts.script).toBe(1);

      const validation = await introspector.validateContent(cdataXML);
      expect(validation.valid).toBe(true);
    });

    it('should handle XML with comments', async () => {
      const commentXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <!-- This is a comment -->
  <item id="1">content</item>
  <!-- Another comment with <tags> and & symbols -->
  <item id="2">more content</item>
  <!--
    Multi-line comment
    with multiple lines
  -->
</root>`;

      const structure = await introspector.analyzeContent(commentXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.item).toBe(2);

      const validation = await introspector.validateContent(commentXML);
      expect(validation.valid).toBe(true);
    });

    it('should handle XML with processing instructions', async () => {
      const piXML = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="style.xsl"?>
<root>
  <item>content</item>
</root>`;

      const structure = await introspector.analyzeContent(piXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.item).toBe(1);

      const validation = await introspector.validateContent(piXML);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Namespace Handling', () => {
    it('should handle XML with default namespace', async () => {
      const defaultNSXML = `<?xml version="1.0" encoding="UTF-8"?>
<root xmlns="http://example.com/ns">
  <item>content</item>
  <item>more content</item>
</root>`;

      const structure = await introspector.analyzeContent(defaultNSXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.item).toBe(2);

      const validation = await introspector.validateContent(defaultNSXML);
      expect(validation.valid).toBe(true);
    });

    it('should handle XML with prefixed namespaces', async () => {
      const prefixedNSXML = `<?xml version="1.0" encoding="UTF-8"?>
<ns:root xmlns:ns="http://example.com/ns">
  <ns:item>content</ns:item>
  <ns:item>more content</ns:item>
</ns:root>`;

      const structure = await introspector.analyzeContent(prefixedNSXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts['ns:root']).toBe(1);
      expect(structure.elementCounts['ns:item']).toBe(2);

      const validation = await introspector.validateContent(prefixedNSXML);
      expect(validation.valid).toBe(true);
    });

    it('should handle XML with multiple namespaces', async () => {
      const multiNSXML = `<?xml version="1.0" encoding="UTF-8"?>
<root xmlns:ns1="http://example.com/ns1" xmlns:ns2="http://example.com/ns2">
  <ns1:item>content</ns1:item>
  <ns2:item>more content</ns2:item>
  <item>default namespace content</item>
</root>`;

      const structure = await introspector.analyzeContent(multiNSXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts['ns1:item']).toBe(1);
      expect(structure.elementCounts['ns2:item']).toBe(1);
      expect(structure.elementCounts.item).toBe(1);

      const validation = await introspector.validateContent(multiNSXML);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle very large XML content', async () => {
      // Generate a very large XML structure
      const items = Array.from({ length: 10000 }, (_, i) => 
        `<item id="${i}" category="test" value="${Math.random()}">
          <name>Item ${i}</name>
          <description>Description for item ${i} with some additional content to make it larger</description>
          <metadata>
            <created>2024-01-01</created>
            <updated>2024-01-15</updated>
            <tags>tag1,tag2,tag3</tags>
          </metadata>
        </item>`
      ).join('\n');

      const largeXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  ${items}
</root>`;

      const startTime = performance.now();
      const structure = await introspector.analyzeContent(largeXML);
      const endTime = performance.now();

      expect(structure.totalElements).toBe(70001); // 1 root + 10000 items + 60000 child elements
      expect(structure.elementCounts.item).toBe(10000);
      expect(endTime - startTime).toBeLessThan(90000); // Should complete within 90 seconds (regex fallback is slower)
    });

    it('should handle XML with many different element types', async () => {
      const manyTypes = Array.from({ length: 1000 }, (_, i) => 
        `<type${i} id="${i}">content ${i}</type${i}>`
      ).join('\n');

      const manyTypesXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  ${manyTypes}
</root>`;

      const structure = await introspector.analyzeContent(manyTypesXML);
      expect(structure.totalElements).toBe(1001); // 1000 types + 1 root
      expect(Object.keys(structure.elementCounts).length).toBe(1001); // 1000 types + 1 root
    });
  });

  describe('Error Recovery and Graceful Degradation', () => {
    it('should provide partial results for partially valid XML', async () => {
      const partialXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1">valid item</item>
  <item id="2">another valid item</item>
  <item id="3">item with missing closing tag
  <item id="4">this item is also affected</item>
</root>`;

      const structure = await introspector.analyzeContent(partialXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.item).toBeGreaterThan(0);

      const validation = await introspector.validateContent(partialXML);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should handle concurrent analysis operations', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1">content</item>
  <item id="2">more content</item>
</root>`;

      // Run multiple operations concurrently
      const [structure, validation, preview] = await Promise.all([
        introspector.analyzeContent(xmlContent),
        introspector.validateContent(xmlContent),
        Promise.resolve(introspector.getContentPreview(xmlContent, 3))
      ]);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(validation.valid).toBe(true);
      expect(preview.firstLines.length).toBeGreaterThan(0);
    });

    it('should handle rapid successive operations', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item>content</item>
</root>`;

      // Run many operations in quick succession
      const promises = Array.from({ length: 10 }, () => 
        introspector.analyzeContent(xmlContent)
      );

      const results = await Promise.all(promises);
      
      // All results should be identical
      results.forEach(result => {
        expect(result.totalElements).toBe(2); // root + item
        expect(result.elementCounts.root).toBe(1);
        expect(result.elementCounts.item).toBe(1);
      });
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle XML with very long content without memory issues', async () => {
      const longContent = 'x'.repeat(100000); // 100KB of content
      const longContentXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item>${longContent}</item>
</root>`;

      const structure = await introspector.analyzeContent(longContentXML);
      expect(structure.totalElements).toBe(2); // root + item
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.item).toBe(1);

      const validation = await introspector.validateContent(longContentXML);
      expect(validation.valid).toBe(true);
    });

    it('should handle XML with many small elements efficiently', async () => {
      const manySmallElements = Array.from({ length: 5000 }, (_, i) => 
        `<e${i}>${i}</e${i}>`
      ).join('');

      const manyElementsXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>${manySmallElements}</root>`;

      const startTime = performance.now();
      const structure = await introspector.analyzeContent(manyElementsXML);
      const endTime = performance.now();

      expect(structure.totalElements).toBe(5001); // 5000 elements + 1 root
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Browser-Specific Edge Cases', () => {
    it('should handle XML with browser-specific characters', async () => {
      const browserXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <script>
    <![CDATA[
      if (window.location) {
        console.log("Browser detected");
      }
    ]]>
  </script>
  <style>
    <![CDATA[
      body { font-family: Arial, sans-serif; }
      .test { color: red; }
    ]]>
  </style>
  <data>
    <url>https://example.com/path?param=value&amp;other=test</url>
    <html>&lt;div&gt;HTML content&lt;/div&gt;</html>
  </data>
</root>`;

      const structure = await introspector.analyzeContent(browserXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.script).toBe(1);
      expect(structure.elementCounts.style).toBe(1);
      expect(structure.elementCounts.data).toBe(1);

      const validation = await introspector.validateContent(browserXML);
      expect(validation.valid).toBe(true);
    });

    it('should handle XML with JavaScript-like content', async () => {
      const jsXML = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <javascript>
    <![CDATA[
      const config = {
        apiUrl: "https://api.example.com",
        timeout: 5000,
        retries: 3
      };
      
      function init() {
        if (typeof window !== 'undefined') {
          window.config = config;
        }
      }
    ]]>
  </javascript>
  <json>
    <![CDATA[
      {
        "name": "test",
        "value": 42,
        "nested": {
          "array": [1, 2, 3]
        }
      }
    ]]>
  </json>
</config>`;

      const structure = await introspector.analyzeContent(jsXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.config).toBe(1);
      expect(structure.elementCounts.javascript).toBe(1);
      expect(structure.elementCounts.json).toBe(1);

      const validation = await introspector.validateContent(jsXML);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Comprehensive Analysis Edge Cases', () => {
    it('should perform comprehensive analysis on edge case XML', async () => {
      const edgeCaseXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <empty/>
  <text>simple text</text>
  <mixed>text <bold>bold</bold> more text</mixed>
  <attributes id="1" class="test" data-value="example">content</attributes>
  <nested>
    <level1>
      <level2>
        <level3>deep content</level3>
      </level2>
    </level1>
  </nested>
</root>`;

      const analysis = await introspector.analyzeContentStructure(edgeCaseXML);

      expect(analysis.structure.totalElements).toBeGreaterThan(0);
      expect(analysis.structure.elementCounts.root).toBe(1);
      expect(analysis.structure.elementCounts.empty).toBe(1);
      expect(analysis.structure.elementCounts.text).toBe(1);
      expect(analysis.structure.elementCounts.mixed).toBe(1);
      expect(analysis.structure.elementCounts.attributes).toBe(1);
      expect(analysis.structure.elementCounts.nested).toBe(1);
      expect(analysis.structure.maxDepth).toBeGreaterThan(3);
      expect(analysis.validation.valid).toBe(true);
      expect(analysis.preview.totalLines).toBeGreaterThan(0);
    });

    it('should handle comprehensive analysis on malformed XML', async () => {
      const malformedXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1">valid item</item>
  <item id="2">item with missing closing tag
  <item id="3">this item is also affected</item>
</root>`;

      const analysis = await introspector.analyzeContentStructure(malformedXML);

      expect(analysis.structure.totalElements).toBeGreaterThan(0);
      expect(analysis.structure.elementCounts.root).toBe(1);
      expect(analysis.structure.elementCounts.item).toBeGreaterThan(0);
      expect(analysis.validation.valid).toBe(false);
      expect(analysis.validation.errors.length).toBeGreaterThan(0);
      expect(analysis.preview.totalLines).toBeGreaterThan(0);
    });
  });
});