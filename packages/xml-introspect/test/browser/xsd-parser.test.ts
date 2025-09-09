import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserXMLIntrospector } from '../../dist/browser.js';

describe('Browser XSD Parser Functionality', () => {
  let introspector: BrowserXMLIntrospector;

  beforeEach(() => {
    introspector = new BrowserXMLIntrospector();
  });

  describe('XSD Structure Analysis', () => {
    it('should analyze XSD schema structure', async () => {
      const xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" 
           targetNamespace="http://example.com/schema"
           elementFormDefault="qualified"
           attributeFormDefault="unqualified">
  
  <xs:element name="Person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Name" type="xs:string"/>
        <xs:element name="Age" type="xs:integer"/>
      </xs:sequence>
      <xs:attribute name="id" type="xs:ID" use="required"/>
    </xs:complexType>
  </xs:element>
  
  <xs:element name="Company">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Name" type="xs:string"/>
        <xs:element ref="Person" maxOccurs="unbounded"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const structure = await introspector.analyzeContent(xsdContent);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts['xs:schema']).toBe(1);
      expect(structure.elementCounts['xs:element']).toBeGreaterThan(0);
      expect(structure.elementCounts['xs:complexType']).toBeGreaterThan(0);
      expect(structure.maxDepth).toBeGreaterThan(2);
    });

    it('should analyze WordNet-style XSD structure', async () => {
      const wordnetXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" 
           targetNamespace="https://globalwordnet.github.io/schemas/"
           elementFormDefault="qualified"
           attributeFormDefault="unqualified">
  
  <xs:element name="LexicalResource">
    <xs:complexType>
      <xs:sequence>
        <xs:element ref="Lexicon" maxOccurs="unbounded"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
  
  <xs:element name="Lexicon">
    <xs:complexType>
      <xs:sequence>
        <xs:element ref="LexicalEntry" maxOccurs="unbounded"/>
        <xs:element ref="Synset" minOccurs="0" maxOccurs="unbounded"/>
      </xs:sequence>
      <xs:attribute name="id" type="xs:ID" use="required"/>
      <xs:attribute name="language" type="xs:string" use="required"/>
      <xs:attribute name="version" type="xs:string" use="required"/>
    </xs:complexType>
  </xs:element>
  
  <xs:element name="LexicalEntry">
    <xs:complexType>
      <xs:sequence>
        <xs:element ref="Lemma"/>
        <xs:element ref="Sense" minOccurs="0" maxOccurs="unbounded"/>
      </xs:sequence>
      <xs:attribute name="id" type="xs:ID" use="required"/>
      <xs:attribute name="pos" type="xs:string" use="optional"/>
    </xs:complexType>
  </xs:element>
  
  <xs:element name="Lemma">
    <xs:complexType>
      <xs:attribute name="writtenForm" type="xs:string" use="required"/>
      <xs:attribute name="partOfSpeech" type="xs:string" use="required"/>
    </xs:complexType>
  </xs:element>
  
  <xs:element name="Sense">
    <xs:complexType>
      <xs:attribute name="id" type="xs:ID" use="required"/>
      <xs:attribute name="synset" type="xs:IDREF" use="required"/>
    </xs:complexType>
  </xs:element>
  
  <xs:element name="Synset">
    <xs:complexType>
      <xs:sequence>
        <xs:element ref="Definition" minOccurs="0" maxOccurs="unbounded"/>
      </xs:sequence>
      <xs:attribute name="id" type="xs:ID" use="required"/>
      <xs:attribute name="ili" type="xs:string" use="required"/>
    </xs:complexType>
  </xs:element>
  
  <xs:element name="Definition">
    <xs:complexType mixed="true">
      <xs:attribute name="language" type="xs:string" use="optional"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const structure = await introspector.analyzeContent(wordnetXSD);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts['xs:schema']).toBe(1);
      expect(structure.elementCounts['xs:element']).toBeGreaterThan(5);
      expect(structure.elementCounts['xs:complexType']).toBeGreaterThan(5);
      expect(structure.elementCounts['xs:attribute']).toBeGreaterThan(5);
      expect(structure.maxDepth).toBeGreaterThan(3);
    });

    it('should analyze recursive XSD structure', async () => {
      const recursiveXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" 
           targetNamespace="http://recursive.example.com/schema">
  
  <xs:element name="Tree">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Node">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="Value" type="xs:string"/>
              <xs:element name="Children" minOccurs="0" maxOccurs="unbounded">
                <xs:complexType>
                  <xs:sequence>
                    <xs:element ref="Node"/>
                  </xs:sequence>
                </xs:complexType>
              </xs:element>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const structure = await introspector.analyzeContent(recursiveXSD);

      expect(structure.totalElements).toBeGreaterThan(0);
      expect(structure.elementCounts['xs:schema']).toBe(1);
      expect(structure.elementCounts['xs:element']).toBeGreaterThan(0);
      expect(structure.elementCounts['xs:complexType']).toBeGreaterThan(0);
      expect(structure.maxDepth).toBeGreaterThan(2);
    });
  });

  describe('XSD Validation', () => {
    it('should validate well-formed XSD schemas', async () => {
      const validXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="TestElement">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Name" type="xs:string"/>
        <xs:element name="Value" type="xs:integer"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const validation = await introspector.validateContent(validXSD);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect malformed XSD schemas', async () => {
      const invalidXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="TestElement">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Name" type="xs:string"/>
        <xs:element name="Value" type="xs:integer"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema`; // Missing closing >

      const validation = await introspector.validateContent(invalidXSD);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('XSD Content Preview', () => {
    it('should provide content preview for large XSD files', () => {
      const largeXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Element1">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Child1" type="xs:string"/>
        <xs:element name="Child2" type="xs:integer"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
  <xs:element name="Element2">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Child3" type="xs:string"/>
        <xs:element name="Child4" type="xs:integer"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
  <xs:element name="Element3">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Child5" type="xs:string"/>
        <xs:element name="Child6" type="xs:integer"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const preview = introspector.getContentPreview(largeXSD, 3);

      expect(preview.firstLines).toHaveLength(3);
      expect(preview.firstLines[0]).toContain('<?xml version="1.0"');
      expect(preview.firstLines[1]).toContain('<xs:schema');
      expect(preview.firstLines[2]).toContain('<xs:element');
      expect(preview.totalLines).toBeGreaterThan(3);
    });
  });

  describe('XSD Comprehensive Analysis', () => {
    it('should perform comprehensive XSD analysis', async () => {
      const xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Name" type="xs:string"/>
        <xs:element name="Age" type="xs:integer"/>
      </xs:sequence>
      <xs:attribute name="id" type="xs:ID" use="required"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const analysis = await introspector.analyzeContentStructure(xsdContent);

      expect(analysis.structure.totalElements).toBeGreaterThan(0);
      expect(analysis.structure.elementCounts['xs:schema']).toBe(1);
      expect(analysis.structure.elementCounts['xs:element']).toBeGreaterThan(0);
      expect(analysis.validation.valid).toBe(true);
      expect(analysis.preview.totalLines).toBeGreaterThan(0);
    });
  });
});

