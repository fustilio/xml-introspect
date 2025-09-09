import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserXMLIntrospector } from '../../dist/browser.js';

describe('Browser Integration Tests', () => {
  let introspector: BrowserXMLIntrospector;

  beforeEach(() => {
    introspector = new BrowserXMLIntrospector();
  });

  describe('End-to-End XML Processing', () => {
    it('should demonstrate complete XML analysis workflow', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <LexicalEntry id="entry1" pos="n">
    <Lemma writtenForm="test" partOfSpeech="n"/>
    <Sense id="sense1" synset="synset1"/>
  </LexicalEntry>
  <Synset id="synset1" ili="i123">
    <Definition>Test definition</Definition>
  </Synset>
</LexicalResource>`;

      // Step 1: Analyze structure
      const structure = await introspector.analyzeContent(xmlContent);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.LexicalResource).toBe(1);
      expect(structure.elementCounts.LexicalEntry).toBe(1);
      expect(structure.elementCounts.Synset).toBe(1);

      // Step 2: Get content preview
      const preview = introspector.getContentPreview(xmlContent, 5);
      expect(preview.firstLines).toHaveLength(5);
      expect(preview.totalLines).toBeGreaterThan(0);

      // Step 3: Validate XML
      const validation = await introspector.validateContent(xmlContent);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Step 4: Comprehensive analysis
      const analysis = await introspector.analyzeContentStructure(xmlContent);
      expect(analysis.structure.totalElements).toBeGreaterThan(0);
      expect(analysis.preview.totalLines).toBeGreaterThan(0);
      expect(analysis.validation.valid).toBe(true);
    });

    it('should handle complex XML with multiple operations', async () => {
      const complexXML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="1" category="fiction">
    <title>The Great Novel</title>
    <author>Jane Author</author>
    <year>2023</year>
    <description>A captivating story about adventure and discovery.</description>
    <reviews>
      <review rating="5">Excellent read!</review>
      <review rating="4">Very good book</review>
    </reviews>
  </book>
  <book id="2" category="non-fiction">
    <title>Technical Guide</title>
    <author>John Expert</author>
    <year>2023</year>
    <description>Comprehensive guide to modern technology.</description>
    <reviews>
      <review rating="5">Must read for developers</review>
    </reviews>
  </book>
  <magazine id="3" category="news">
    <title>Tech Weekly</title>
    <issue>2023-01</issue>
    <description>Latest technology news and trends.</description>
  </magazine>
</catalog>`;

      // Analyze structure
      const structure = await introspector.analyzeContent(complexXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.catalog).toBe(1);
      expect(structure.elementCounts.book).toBe(2);
      expect(structure.elementCounts.magazine).toBe(1);
      expect(structure.elementCounts.review).toBe(3);

      // Validate
      const validation = await introspector.validateContent(complexXML);
      expect(validation.valid).toBe(true);

      // Preview
      const preview = introspector.getContentPreview(complexXML, 3);
      expect(preview.firstLines.length).toBeGreaterThan(0);

      // Comprehensive analysis
      const analysis = await introspector.analyzeContentStructure(complexXML);
      expect(analysis.structure.maxDepth).toBeGreaterThan(2);
      expect(analysis.validation.valid).toBe(true);
    });
  });

  describe('Cross-Component Interactions', () => {
    it('should analyze XML structure and validate consistently', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <record id="1" type="A">
    <field name="title">Record One</field>
    <field name="value">100</field>
  </record>
  <record id="2" type="B">
    <field name="title">Record Two</field>
    <field name="value">200</field>
  </record>
</data>`;

      // Multiple analysis operations
      const structure1 = await introspector.analyzeContent(xmlContent);
      const structure2 = await introspector.analyzeContent(xmlContent);
      const validation = await introspector.validateContent(xmlContent);

      // Results should be consistent
      expect(structure1.totalElements).toBe(structure2.totalElements);
      expect(structure1.elementCounts.data).toBe(structure2.elementCounts.data);
      expect(structure1.elementCounts.record).toBe(structure2.elementCounts.record);
      expect(validation.valid).toBe(true);
    });

    it('should handle preview and analysis operations together', async () => {
      const longXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1">Item 1</item>
  <item id="2">Item 2</item>
  <item id="3">Item 3</item>
  <item id="4">Item 4</item>
  <item id="5">Item 5</item>
  <item id="6">Item 6</item>
  <item id="7">Item 7</item>
  <item id="8">Item 8</item>
  <item id="9">Item 9</item>
  <item id="10">Item 10</item>
</root>`;

      // Get preview first
      const preview = introspector.getContentPreview(longXML, 3);
      expect(preview.firstLines).toHaveLength(3);
      expect(preview.totalLines).toBe(13); // XML declaration + 10 items + root tags

      // Then analyze structure
      const structure = await introspector.analyzeContent(longXML);
      expect(structure.totalElements).toBe(11); // 10 items + 1 root
      expect(structure.elementCounts.item).toBe(10);

      // Validate
      const validation = await introspector.validateContent(longXML);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle e-commerce XML data', async () => {
      const ecommerceXML = `<?xml version="1.0" encoding="UTF-8"?>
<store>
  <products>
    <product id="1" category="electronics" price="299.99">
      <name>Smartphone</name>
      <description>Latest generation smartphone</description>
      <specifications>
        <screen>6.1 inch</screen>
        <storage>128GB</storage>
        <camera>12MP</camera>
      </specifications>
      <reviews>
        <review rating="5" user="john">Great phone!</review>
        <review rating="4" user="jane">Good value</review>
      </reviews>
    </product>
    <product id="2" category="books" price="19.99">
      <name>Programming Guide</name>
      <description>Learn programming fundamentals</description>
      <author>Tech Expert</author>
      <pages>350</pages>
    </product>
  </products>
  <customers>
    <customer id="1" type="premium">
      <name>John Doe</name>
      <email>john@example.com</email>
      <orders>
        <order id="1" date="2024-01-15" total="299.99">
          <item productId="1" quantity="1"/>
        </order>
      </orders>
    </customer>
  </customers>
</store>`;

      const analysis = await introspector.analyzeContentStructure(ecommerceXML);

      expect(analysis.structure.totalElements).toBeGreaterThan(0);
      expect(analysis.structure.elementCounts.store).toBe(1);
      expect(analysis.structure.elementCounts.product).toBe(2);
      expect(analysis.structure.elementCounts.customer).toBe(1);
      expect(analysis.structure.elementCounts.order).toBe(1);
      expect(analysis.structure.elementCounts.review).toBe(2);
      expect(analysis.validation.valid).toBe(true);
      expect(analysis.preview.totalLines).toBeGreaterThan(0);
    });

    it('should handle scientific data XML', async () => {
      const scientificXML = `<?xml version="1.0" encoding="UTF-8"?>
<experiment id="exp001" date="2024-01-15">
  <metadata>
    <title>Temperature Analysis</title>
    <researcher>Dr. Smith</researcher>
    <institution>University of Science</institution>
  </metadata>
  <samples>
    <sample id="s1" temperature="25.5" humidity="60">
      <measurements>
        <measurement type="pressure" value="1013.25" unit="hPa"/>
        <measurement type="wind" value="5.2" unit="m/s"/>
      </measurements>
    </sample>
    <sample id="s2" temperature="26.1" humidity="58">
      <measurements>
        <measurement type="pressure" value="1012.80" unit="hPa"/>
        <measurement type="wind" value="4.8" unit="m/s"/>
      </measurements>
    </sample>
  </samples>
  <results>
    <conclusion>Temperature shows slight increase over time</conclusion>
    <confidence>0.95</confidence>
  </results>
</experiment>`;

      const analysis = await introspector.analyzeContentStructure(scientificXML);

      expect(analysis.structure.totalElements).toBeGreaterThan(0);
      expect(analysis.structure.elementCounts.experiment).toBe(1);
      expect(analysis.structure.elementCounts.sample).toBe(2);
      expect(analysis.structure.elementCounts.measurement).toBe(4);
      expect(analysis.structure.attributeCounts.temperature).toBe(2);
      expect(analysis.structure.attributeCounts.humidity).toBe(2);
      expect(analysis.validation.valid).toBe(true);
    });

    it('should handle configuration XML', async () => {
      const configXML = `<?xml version="1.0" encoding="UTF-8"?>
<configuration version="1.0">
  <database>
    <host>localhost</host>
    <port>5432</port>
    <name>myapp</name>
    <credentials>
      <username>admin</username>
      <password encrypted="true">encrypted_password</password>
    </credentials>
  </database>
  <server>
    <host>0.0.0.0</host>
    <port>8080</port>
    <ssl enabled="true">
      <certificate>server.crt</certificate>
      <key>server.key</key>
    </ssl>
  </server>
  <features>
    <feature name="logging" enabled="true"/>
    <feature name="caching" enabled="false"/>
    <feature name="monitoring" enabled="true"/>
  </features>
</configuration>`;

      const analysis = await introspector.analyzeContentStructure(configXML);

      expect(analysis.structure.totalElements).toBeGreaterThan(0);
      expect(analysis.structure.elementCounts.configuration).toBe(1);
      expect(analysis.structure.elementCounts.database).toBe(1);
      expect(analysis.structure.elementCounts.server).toBe(1);
      expect(analysis.structure.elementCounts.feature).toBe(3);
      expect(analysis.structure.attributeCounts.enabled).toBe(4);
      expect(analysis.validation.valid).toBe(true);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large XML structures efficiently', async () => {
      // Generate a large XML structure
      const items = Array.from({ length: 100 }, (_, i) => 
        `<item id="${i + 1}" category="test">
          <name>Item ${i + 1}</name>
          <value>${Math.random() * 100}</value>
          <description>Description for item ${i + 1}</description>
        </item>`
      ).join('\n');

      const largeXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  ${items}
</root>`;

      const startTime = performance.now();
      const analysis = await introspector.analyzeContentStructure(largeXML);
      const endTime = performance.now();

      expect(analysis.structure.totalElements).toBe(401); // 1 root + 100 items + 300 child elements
      expect(analysis.structure.elementCounts.item).toBe(100);
      expect(analysis.validation.valid).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle deeply nested XML structures', async () => {
      // Generate deeply nested XML
      let nestedXML = '<?xml version="1.0" encoding="UTF-8"?>\n<root>';
      for (let i = 1; i <= 10; i++) {
        nestedXML += `<level${i}>`;
      }
      nestedXML += 'Deep content';
      for (let i = 10; i >= 1; i--) {
        nestedXML += `</level${i}>`;
      }
      nestedXML += '</root>';

      const analysis = await introspector.analyzeContentStructure(nestedXML);

      expect(analysis.structure.totalElements).toBe(11); // 10 levels + 1 root
      expect(analysis.structure.maxDepth).toBe(11);
      expect(analysis.validation.valid).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from validation errors and continue analysis', async () => {
      const partiallyValidXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1">Valid item</item>
  <item id="2">Another valid item</item>
  <item id="3">Third valid item
  <!-- Missing closing tag -->
</root>`;

      // Should still be able to analyze structure even with validation errors
      const structure = await introspector.analyzeContent(partiallyValidXML);
      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.item).toBeGreaterThan(0);

      // Validation should detect the error
      const validation = await introspector.validateContent(partiallyValidXML);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);

      // Preview should still work
      const preview = introspector.getContentPreview(partiallyValidXML, 3);
      expect(preview.firstLines.length).toBeGreaterThan(0);
    });
  });
});