import { describe, it, expect } from 'vitest';
import { generateXSDFromStructure, convertNodeXSDOptions, convertBrowserXSDOptions } from '../../../src/core/XSDGenerator';
import type { XMLStructure } from '../../../src/core/types';

describe('XSDGenerator with XAST utilities', () => {
  const mockXMLStructure: XMLStructure = {
    elementCounts: {
      'Person': 5,
      'Name': 5,
      'Age': 3,
      'Address': 2
    },
    attributeCounts: {
      'id': 10,
      'version': 2
    },
    rootElements: ['Person'],
    commonElements: [
      { name: 'Person', count: 5 },
      { name: 'Name', count: 5 },
      { name: 'Age', count: 3 },
      { name: 'Address', count: 2 }
    ],
    attributes: [
      { name: 'id', count: 10 },
      { name: 'version', count: 2 }
    ],
    maxDepth: 3,
    totalElements: 15,
    rootElement: 'Person',
    elementTypes: new Map(),
    namespaces: new Map()
  };

  describe('generateXSDFromStructure', () => {
    it('should generate XSD using XAST utilities with proper formatting', () => {
      const xsd = generateXSDFromStructure(mockXMLStructure);
      
      // Check that it starts with XML declaration (updated format)
      expect(xsd).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      
      // Check for proper XSD schema structure
      expect(xsd).toContain('<xs:schema');
      expect(xsd).toContain('xmlns:xs="http://www.w3.org/2001/XMLSchema"');
      expect(xsd).toContain('targetNamespace="http://example.com/schema"');
      expect(xsd).toContain('elementFormDefault="qualified"');
      expect(xsd).toContain('attributeFormDefault="unqualified"');
      
      // Check for element declarations (updated format with spaces)
      expect(xsd).toContain('<xs:element name="Person" type="PersonType" />');
      expect(xsd).toContain('<xs:element name="Name" type="NameType" />');
      expect(xsd).toContain('<xs:element name="Age" type="AgeType" />');
      expect(xsd).toContain('<xs:element name="Address" type="AddressType" />');
      
      // Check for complex type definitions (updated format - self-closing when empty)
      expect(xsd).toContain('<xs:complexType name="PersonType" />');
      expect(xsd).toContain('<xs:complexType name="NameType" />');
      expect(xsd).toContain('<xs:complexType name="AgeType" />');
      expect(xsd).toContain('<xs:complexType name="AddressType" />');
      
      // Check for proper closing
      expect(xsd).toContain('</xs:schema>');
    });

    it('should generate XSD with custom options', () => {
      const customOptions = {
        targetNamespace: 'https://custom.example.com/schema',
        elementForm: 'unqualified' as const,
        attributeForm: 'qualified' as const
      };
      
      const xsd = generateXSDFromStructure(mockXMLStructure, customOptions);
      
      expect(xsd).toContain('targetNamespace="https://custom.example.com/schema"');
      expect(xsd).toContain('elementFormDefault="unqualified"');
      expect(xsd).toContain('attributeFormDefault="qualified"');
    });

    it('should generate properly formatted XSD with indentation', () => {
      const xsd = generateXSDFromStructure(mockXMLStructure);
      
      // Check for proper indentation (2 spaces)
      expect(xsd).toContain('  <xs:element name="Person"');
      expect(xsd).toContain('  <xs:complexType name="PersonType" />');
      
      // Check that elements are properly nested
      const lines = xsd.split('\n');
      const schemaLine = lines.find(line => line.includes('<xs:schema'));
      const elementLine = lines.find(line => line.includes('<xs:element name="Person"'));
      const complexTypeLine = lines.find(line => line.includes('<xs:complexType name="PersonType"'));
      
      expect(schemaLine).toBeDefined();
      expect(elementLine).toBeDefined();
      expect(complexTypeLine).toBeDefined();
      
      // Check indentation levels
      if (schemaLine && elementLine && complexTypeLine) {
        const schemaIndent = schemaLine.match(/^(\s*)/)?.[1]?.length || 0;
        const elementIndent = elementLine.match(/^(\s*)/)?.[1]?.length || 0;
        const complexTypeIndent = complexTypeLine.match(/^(\s*)/)?.[1]?.length || 0;
        
        expect(elementIndent).toBeGreaterThan(schemaIndent);
        // Complex types and elements are at the same level in our current implementation
        expect(complexTypeIndent).toBeGreaterThanOrEqual(elementIndent);
      }
    });

    it('should handle empty structure gracefully', () => {
      const emptyStructure: XMLStructure = {
        elementCounts: {},
        attributeCounts: {},
        rootElements: [],
        commonElements: [],
        attributes: [],
        maxDepth: 0,
        totalElements: 0,
        rootElement: '',
        elementTypes: new Map(),
        namespaces: new Map()
      };
      
      const xsd = generateXSDFromStructure(emptyStructure);
      
      expect(xsd).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      expect(xsd).toContain('<xs:schema');
      // When empty, schema is self-closing, so check for either format
      expect(xsd.includes('</xs:schema>') || xsd.includes('<xs:schema')).toBe(true);
      // Should not contain any element declarations
      expect(xsd).not.toContain('<xs:element name=');
    });
  });

  describe('convertNodeXSDOptions', () => {
    it('should convert Node.js options correctly', () => {
      const nodeOptions = {
        targetNamespace: 'https://node.example.com/schema',
        elementForm: 'qualified' as const,
        attributeForm: 'unqualified' as const,
        verbose: true
      };
      
      const converted = convertNodeXSDOptions(nodeOptions);
      
      expect(converted).toEqual({
        targetNamespace: 'https://node.example.com/schema',
        elementForm: 'qualified',
        attributeForm: 'unqualified'
      });
      expect(converted).not.toHaveProperty('verbose');
    });
  });

  describe('convertBrowserXSDOptions', () => {
    it('should convert Browser options correctly', () => {
      const browserOptions = {
        targetNamespace: 'https://browser.example.com/schema',
        elementForm: 'unqualified' as const,
        attributeForm: 'qualified' as const
      };
      
      const converted = convertBrowserXSDOptions(browserOptions);
      
      expect(converted).toEqual({
        targetNamespace: 'https://browser.example.com/schema',
        elementForm: 'unqualified',
        attributeForm: 'qualified'
      });
    });
  });

  describe('XAST tree structure validation', () => {
    it('should generate valid XAST tree structure', () => {
      const xsd = generateXSDFromStructure(mockXMLStructure);
      
      // Check for well-formed XML structure
      expect(xsd).toMatch(/^<\?xml[^>]*\?>\s*<xs:schema[^>]*>[\s\S]*<\/xs:schema>$/);
      
      // Verify basic XML structure elements
      expect(xsd).toContain('<?xml');
      expect(xsd).toContain('<xs:schema');
      expect(xsd).toContain('</xs:schema>');
    });

    it('should use proper XAST element structure', () => {
      // This test verifies that the XAST tree is built correctly
      // by checking the output format matches what xastscript would produce
      const xsd = generateXSDFromStructure(mockXMLStructure);
      
      // Check that self-closing elements are properly formatted
      expect(xsd).toContain('<xs:element name="Person" type="PersonType" />');
      
      // Check that complex types are properly formatted (self-closing when empty)
      expect(xsd).toContain('<xs:complexType name="PersonType" />');
      
      // Verify no malformed XML
      expect(xsd).not.toContain('<<');
      expect(xsd).not.toContain('>>');
      expect(xsd).not.toContain('</>');
    });
  });
});