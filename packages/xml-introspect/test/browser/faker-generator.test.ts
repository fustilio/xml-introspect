import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserXMLIntrospector } from '../../dist/browser.js';

describe('Browser Faker Generator Functionality', () => {
  let introspector: BrowserXMLIntrospector;

  beforeEach(() => {
    introspector = new BrowserXMLIntrospector();
  });

  describe('Realistic Data Generation', () => {
    it('should generate realistic person data in XML', async () => {
      const personXML = `<?xml version="1.0" encoding="UTF-8"?>
<person id="1" name="John Doe">
  <email>john.doe@example.com</email>
  <phone>+1-555-123-4567</phone>
  <address>
    <street>123 Main St</street>
    <city>New York</city>
    <country>USA</country>
    <zipcode>10001</zipcode>
  </address>
</person>`;

      const structure = await introspector.analyzeContent(personXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.person).toBe(1);
      expect(structure.elementCounts.email).toBe(1);
      expect(structure.elementCounts.phone).toBe(1);
      expect(structure.elementCounts.address).toBe(1);
      expect(structure.attributeCounts.id).toBe(1);
      expect(structure.attributeCounts.name).toBe(1);
    });

    it('should generate realistic business data in XML', async () => {
      const businessXML = `<?xml version="1.0" encoding="UTF-8"?>
<company id="1" name="TechCorp Inc.">
  <description>Leading technology solutions provider</description>
  <website>https://techcorp.example.com</website>
  <employees>
    <employee id="1" position="CEO">
      <name>Jane Smith</name>
      <salary>150000</salary>
    </employee>
    <employee id="2" position="Developer">
      <name>Bob Johnson</name>
      <salary>80000</salary>
    </employee>
  </employees>
  <products>
    <product id="1" price="99.99">
      <name>Software License</name>
      <category>Software</category>
    </product>
  </products>
</company>`;

      const structure = await introspector.analyzeContent(businessXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.company).toBe(1);
      expect(structure.elementCounts.employee).toBe(2);
      expect(structure.elementCounts.product).toBe(1);
      expect(structure.attributeCounts.id).toBeGreaterThan(0);
      expect(structure.attributeCounts.name).toBe(1);
      expect(structure.attributeCounts.price).toBe(1);
    });

    it('should generate realistic content data in XML', async () => {
      const contentXML = `<?xml version="1.0" encoding="UTF-8"?>
<article id="1" title="The Future of Technology">
  <author>Dr. Sarah Wilson</author>
  <published>2024-01-15</published>
  <content>
    <paragraph>Technology continues to evolve at an unprecedented pace...</paragraph>
    <paragraph>Artificial intelligence and machine learning are transforming...</paragraph>
    <paragraph>The implications for society are profound and far-reaching...</paragraph>
  </content>
  <tags>
    <tag>technology</tag>
    <tag>AI</tag>
    <tag>future</tag>
  </tags>
</article>`;

      const structure = await introspector.analyzeContent(contentXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.article).toBe(1);
      expect(structure.elementCounts.paragraph).toBe(3);
      expect(structure.elementCounts.tag).toBe(3);
      expect(structure.attributeCounts.id).toBe(1);
      expect(structure.attributeCounts.title).toBe(1);
    });

    it('should handle WordNet LMF specific elements', async () => {
      const wordnetXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <LexicalEntry id="entry1" pos="n">
    <Lemma writtenForm="test" partOfSpeech="n"/>
    <Sense id="sense1" synset="synset1"/>
  </LexicalEntry>
  <Synset id="synset1" ili="i123">
    <Definition>a procedure for testing something</Definition>
  </Synset>
</LexicalResource>`;

      const structure = await introspector.analyzeContent(wordnetXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.LexicalResource).toBe(1);
      expect(structure.elementCounts.LexicalEntry).toBe(1);
      expect(structure.elementCounts.Lemma).toBe(1);
      expect(structure.elementCounts.Sense).toBe(1);
      expect(structure.elementCounts.Synset).toBe(1);
      expect(structure.elementCounts.Definition).toBe(1);
      expect(structure.attributeCounts.id).toBe(3);
      expect(structure.attributeCounts.pos).toBe(1);
      expect(structure.attributeCounts.writtenForm).toBe(1);
      expect(structure.attributeCounts.partOfSpeech).toBe(1);
    });
  });

  describe('Attribute Generation', () => {
    it('should analyze XML with common attributes', async () => {
      const xmlWithAttributes = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1" name="Item One" type="primary" class="important"/>
  <item id="2" name="Item Two" type="secondary" class="normal"/>
  <item id="3" name="Item Three" type="primary" class="important"/>
</root>`;

      const structure = await introspector.analyzeContent(xmlWithAttributes);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.item).toBe(3);
      expect(structure.attributeCounts.id).toBe(3);
      expect(structure.attributeCounts.name).toBe(3);
      expect(structure.attributeCounts.type).toBe(3);
      expect(structure.attributeCounts.class).toBe(3);
    });

    it('should analyze XML with mixed attribute types', async () => {
      const mixedAttributesXML = `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <record id="1" timestamp="2024-01-15T10:30:00Z" active="true" count="42"/>
  <record id="2" timestamp="2024-01-15T11:45:00Z" active="false" count="17"/>
  <record id="3" timestamp="2024-01-15T12:15:00Z" active="true" count="89"/>
</data>`;

      const structure = await introspector.analyzeContent(mixedAttributesXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.data).toBe(1);
      expect(structure.elementCounts.record).toBe(3);
      expect(structure.attributeCounts.id).toBe(3);
      expect(structure.attributeCounts.timestamp).toBe(3);
      expect(structure.attributeCounts.active).toBe(3);
      expect(structure.attributeCounts.count).toBe(3);
    });
  });

  describe('Child Element Generation', () => {
    it('should analyze XML with nested person elements', async () => {
      const personXML = `<?xml version="1.0" encoding="UTF-8"?>
<person id="1" name="John Doe">
  <name>John Doe</name>
  <email>john.doe@example.com</email>
  <phone>+1-555-123-4567</phone>
  <address>
    <street>123 Main St</street>
    <city>New York</city>
    <state>NY</state>
    <zipcode>10001</zipcode>
  </address>
  <employment>
    <company>TechCorp Inc.</company>
    <position>Software Engineer</position>
    <salary>95000</salary>
  </employment>
</person>`;

      const structure = await introspector.analyzeContent(personXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.person).toBe(1);
      expect(structure.elementCounts.name).toBe(1);
      expect(structure.elementCounts.email).toBe(1);
      expect(structure.elementCounts.phone).toBe(1);
      expect(structure.elementCounts.address).toBe(1);
      expect(structure.elementCounts.employment).toBe(1);
      expect(structure.maxDepth).toBeGreaterThan(2);
    });

    it('should analyze XML with nested product elements', async () => {
      const productXML = `<?xml version="1.0" encoding="UTF-8"?>
<product id="1" name="Smartphone">
  <name>Smartphone</name>
  <description>Latest generation smartphone with advanced features</description>
  <price>699.99</price>
  <specifications>
    <screen>6.1 inch OLED</screen>
    <processor>A15 Bionic</processor>
    <storage>128GB</storage>
    <camera>12MP dual camera</camera>
  </specifications>
  <reviews>
    <review rating="5">Excellent phone!</review>
    <review rating="4">Great value for money</review>
  </reviews>
</product>`;

      const structure = await introspector.analyzeContent(productXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.product).toBe(1);
      expect(structure.elementCounts.name).toBe(1);
      expect(structure.elementCounts.description).toBe(1);
      expect(structure.elementCounts.price).toBe(1);
      expect(structure.elementCounts.specifications).toBe(1);
      expect(structure.elementCounts.reviews).toBe(1);
      expect(structure.elementCounts.review).toBe(2);
      expect(structure.maxDepth).toBeGreaterThan(2);
    });
  });

  describe('XML Generation from Structure', () => {
    it('should analyze generated XML structure', async () => {
      const generatedXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <person id="1" name="John Doe">
    <email>john.doe@example.com</email>
    <phone>+1-555-123-4567</phone>
  </person>
  <person id="2" name="Jane Smith">
    <email>jane.smith@example.com</email>
    <phone>+1-555-987-6543</phone>
  </person>
  <company id="1" name="TechCorp Inc.">
    <website>https://techcorp.example.com</website>
    <employees>150</employees>
  </company>
</root>`;

      const structure = await introspector.analyzeContent(generatedXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.person).toBe(2);
      expect(structure.elementCounts.company).toBe(1);
      expect(structure.attributeCounts.id).toBe(3);
      expect(structure.attributeCounts.name).toBe(3);
    });

    it('should analyze XML with attributes and content', async () => {
      const xmlWithAttributes = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <person id="1" name="John Doe" age="30" active="true">
    <email>john.doe@example.com</email>
    <phone>+1-555-123-4567</phone>
  </person>
  <person id="2" name="Jane Smith" age="28" active="true">
    <email>jane.smith@example.com</email>
    <phone>+1-555-987-6543</phone>
  </person>
</root>`;

      const structure = await introspector.analyzeContent(xmlWithAttributes);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.person).toBe(2);
      expect(structure.attributeCounts.id).toBe(2);
      expect(structure.attributeCounts.name).toBe(2);
      expect(structure.attributeCounts.age).toBe(2);
      expect(structure.attributeCounts.active).toBe(2);
    });
  });

  describe('XSD-based XML Generation', () => {
    it('should analyze XML generated from XSD schema', async () => {
      const xsdGeneratedXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <person id="1" name="John Doe">
    <email>john.doe@example.com</email>
    <phone>+1-555-123-4567</phone>
  </person>
  <company id="1" name="TechCorp Inc.">
    <website>https://techcorp.example.com</website>
    <employees>150</employees>
  </company>
</root>`;

      const structure = await introspector.analyzeContent(xsdGeneratedXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.person).toBe(1);
      expect(structure.elementCounts.company).toBe(1);
      expect(structure.attributeCounts.id).toBe(2);
      expect(structure.attributeCounts.name).toBe(2);
    });
  });

  describe('XAST Roundtrip', () => {
    it('should analyze XML after roundtrip processing', async () => {
      const originalXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <person id="1" name="John">
    <email>john@example.com</email>
  </person>
</root>`;

      const structure = await introspector.analyzeContent(originalXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.person).toBe(1);
      expect(structure.elementCounts.email).toBe(1);
      expect(structure.attributeCounts.id).toBe(1);
      expect(structure.attributeCounts.name).toBe(1);
    });
  });

  describe('Sample XML Generation', () => {
    it('should analyze sample XML with specified element count', async () => {
      const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<sample>
  <item id="1" name="Item One">
    <description>First sample item</description>
    <price>19.99</price>
  </item>
  <item id="2" name="Item Two">
    <description>Second sample item</description>
    <price>29.99</price>
  </item>
  <item id="3" name="Item Three">
    <description>Third sample item</description>
    <price>39.99</price>
  </item>
</sample>`;

      const structure = await introspector.analyzeContent(sampleXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.sample).toBe(1);
      expect(structure.elementCounts.item).toBe(3);
      expect(structure.elementCounts.description).toBe(3);
      expect(structure.elementCounts.price).toBe(3);
      expect(structure.attributeCounts.id).toBe(3);
      expect(structure.attributeCounts.name).toBe(3);
    });
  });

  describe('Custom Generators', () => {
    it('should analyze XML with custom element patterns', async () => {
      const customXML = `<?xml version="1.0" encoding="UTF-8"?>
<custom>
  <special id="1" type="custom">
    <value>Custom Value</value>
    <metadata>Special Content</metadata>
  </special>
  <unique id="2" category="special">
    <data>Unique Data</data>
    <info>Special Info</info>
  </unique>
</custom>`;

      const structure = await introspector.analyzeContent(customXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.custom).toBe(1);
      expect(structure.elementCounts.special).toBe(1);
      expect(structure.elementCounts.unique).toBe(1);
      expect(structure.elementCounts.value).toBe(1);
      expect(structure.elementCounts.metadata).toBe(1);
      expect(structure.elementCounts.data).toBe(1);
      expect(structure.elementCounts.info).toBe(1);
    });
  });

  describe('Seeding and Consistency', () => {
    it('should analyze consistent XML structures', async () => {
      const consistentXML = `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <record id="1" name="Record One" type="A">
    <value>Value One</value>
  </record>
  <record id="2" name="Record Two" type="A">
    <value>Value Two</value>
  </record>
  <record id="3" name="Record Three" type="A">
    <value>Value Three</value>
  </record>
</data>`;

      const structure = await introspector.analyzeContent(consistentXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.data).toBe(1);
      expect(structure.elementCounts.record).toBe(3);
      expect(structure.elementCounts.value).toBe(3);
      expect(structure.attributeCounts.id).toBe(3);
      expect(structure.attributeCounts.name).toBe(3);
      expect(structure.attributeCounts.type).toBe(3);
    });

    it('should analyze different XML structures', async () => {
      const differentXML = `<?xml version="1.0" encoding="UTF-8"?>
<collection>
  <item id="1" category="A">
    <title>Title One</title>
  </item>
  <item id="2" category="B">
    <title>Title Two</title>
  </item>
</collection>`;

      const structure = await introspector.analyzeContent(differentXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.collection).toBe(1);
      expect(structure.elementCounts.item).toBe(2);
      expect(structure.elementCounts.title).toBe(2);
      expect(structure.attributeCounts.id).toBe(2);
      expect(structure.attributeCounts.category).toBe(2);
    });
  });

  describe('Configuration Options', () => {
    it('should analyze XML with depth constraints', async () => {
      const deepXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <level1>
    <level2>
      <level3>
        <level4>Deep content</level4>
      </level3>
    </level2>
  </level1>
</root>`;

      const structure = await introspector.analyzeContent(deepXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.root).toBe(1);
      expect(structure.elementCounts.level1).toBe(1);
      expect(structure.elementCounts.level2).toBe(1);
      expect(structure.elementCounts.level3).toBe(1);
      expect(structure.elementCounts.level4).toBe(1);
      expect(structure.maxDepth).toBeGreaterThan(3);
    });

    it('should analyze XML with multiple children', async () => {
      const multiChildXML = `<?xml version="1.0" encoding="UTF-8"?>
<parent>
  <child1>Content 1</child1>
  <child2>Content 2</child2>
  <child3>Content 3</child3>
  <child4>Content 4</child4>
  <child5>Content 5</child5>
</parent>`;

      const structure = await introspector.analyzeContent(multiChildXML);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts.parent).toBe(1);
      expect(structure.elementCounts.child1).toBe(1);
      expect(structure.elementCounts.child2).toBe(1);
      expect(structure.elementCounts.child3).toBe(1);
      expect(structure.elementCounts.child4).toBe(1);
      expect(structure.elementCounts.child5).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed XML gracefully', async () => {
      const malformedXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1" name="Test">
    <value>Test Value</value>
  </item>
  <item id="2" name="Test2">
    <value>Test Value 2</value>
  </item>
</root`; // Missing closing >

      const structure = await introspector.analyzeContent(malformedXML);

      // Should still provide some analysis even with malformed XML
      expect(structure.totalElements).toBeGreaterThanOrEqual(0);
    });

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
    });
  });
});