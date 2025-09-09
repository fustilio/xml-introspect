/**
 * XSDAST Tests
 * 
 * Tests for the XSDAST utilities and self-validation system.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { XSDASTTraverser, XSDHelper, XSDASTValidator, XSDRecursiveGenerator } from '../index';
import type { XSDAST } from '../types'; 

describe('XSDAST', () => {
  let sampleXSD: XSDAST;

  beforeEach(() => {
    // Create a sample XSD AST for testing
    sampleXSD = {
      type: 'xsd:schema',
      name: 'schema',
      attributes: {
        targetNamespace: 'http://example.com/test',
        elementFormDefault: 'qualified',
        attributeFormDefault: 'unqualified'
      },
      children: [
        {
          type: 'xsd:element',
          name: 'root',
          attributes: {
            name: 'root',
            type: 'RootType'
          },
          children: []
        },
        {
          type: 'xsd:complexType',
          name: 'RootType',
          attributes: {
            name: 'RootType'
          },
          children: [
            {
              type: 'xsd:sequence',
              name: 'sequence',
              attributes: {},
              children: [
                {
                  type: 'xsd:element',
                  name: 'child',
                  attributes: {
                    name: 'child',
                    type: 'xs:string',
                    minOccurs: '0',
                    maxOccurs: 'unbounded'
                  },
                  children: []
                }
              ]
            }
          ]
        }
      ]
    };
  });

  describe('XSDASTTraverser', () => {
    it('should create a traverser from XSD AST', () => {
      const traverser = new XSDASTTraverser(sampleXSD);
      expect(traverser).toBeDefined();
      expect(traverser.getRoot()).toBeDefined();
    });

    it('should find all elements', () => {
      const traverser = new XSDASTTraverser(sampleXSD);
      const elements = traverser.findAllElements();
      expect(elements).toHaveLength(2); // root element and child element
    });

    it('should find all complex types', () => {
      const traverser = new XSDASTTraverser(sampleXSD);
      const complexTypes = traverser.findAllComplexTypes();
      expect(complexTypes).toHaveLength(1); // RootType
    });

    it('should find elements by name', () => {
      const traverser = new XSDASTTraverser(sampleXSD);
      const rootElements = traverser.findByName('root');
      expect(rootElements).toHaveLength(1);
      expect(rootElements[0].attributes.name).toBe('root');
    });

    it('should get statistics', () => {
      const traverser = new XSDASTTraverser(sampleXSD);
      const stats = traverser.getStatistics();
      expect(stats.totalNodes).toBeGreaterThan(0);
      expect(stats.nodeTypes).toBeDefined();
    });
  });

  describe('XSDHelper', () => {
    let traverser: XSDASTTraverser;
    let helper: XSDHelper;

    beforeEach(() => {
      traverser = new XSDASTTraverser(sampleXSD);
      helper = new XSDHelper(traverser);
    });

    it('should identify element types', () => {
      const elements = traverser.findAllElements();
      const element = elements[0];
      
      expect(helper.isElement(element)).toBe(true);
      expect(helper.isComplexType(element)).toBe(false);
      expect(helper.getElementType(element)).toBe('RootType');
    });

    it('should identify complex types', () => {
      const complexTypes = traverser.findAllComplexTypes();
      const complexType = complexTypes[0];
      
      expect(helper.isComplexType(complexType)).toBe(true);
      expect(helper.isElement(complexType)).toBe(false);
    });

    it('should get node names', () => {
      const elements = traverser.findAllElements();
      const element = elements[0];
      
      expect(helper.getNodeName(element)).toBe('root');
    });

    it('should check occurrence constraints', () => {
      const elements = traverser.findAllElements();
      const childElement = elements.find(el => el.attributes.name === 'child');
      
      expect(childElement).toBeDefined();
      expect(helper.getMinOccurs(childElement!)).toBe(0);
      expect(helper.getMaxOccurs(childElement!)).toBe('unbounded');
      expect(helper.isOptional(childElement!)).toBe(true);
      expect(helper.isMultiple(childElement!)).toBe(true);
    });
  });

  describe('XSDASTValidator', () => {
    let traverser: XSDASTTraverser;
      let validator: XSDASTValidator;

    beforeEach(() => {  
      traverser = new XSDASTTraverser(sampleXSD);
      validator = new XSDASTValidator(traverser);
    });

    it('should validate XSD structure', async () => {
      const result = await validator.validate();
      expect(result).toBeDefined();
      
      if (!result.isValid) {
        console.log('Validation errors:', result.errors);
        console.log('Validation warnings:', result.warnings);
      }
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should provide validation statistics', async () => {
      const result = await validator.validate();
      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalElements).toBeGreaterThan(0);
    });
  });

  describe('XSDRecursiveGenerator', () => {
    let traverser: XSDASTTraverser;
    let generator: XSDRecursiveGenerator;

    beforeEach(() => {
      traverser = new XSDASTTraverser(sampleXSD);
      generator = new XSDRecursiveGenerator(traverser);
    });

    it('should generate recursive XSD', async () => {
      const xsd = await generator.generateRecursiveXSD({
        targetNamespace: 'http://example.com/recursive',
        includeSelfValidation: true,
        maxRecursionDepth: 5,
        generateComments: true
      });

      expect(xsd).toBeDefined();
      expect(xsd).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xsd).toContain('<xs:schema');
      expect(xsd).toContain('</xs:schema>');
    });

    it('should include self-validation rules when requested', async () => {
      const xsd = await generator.generateRecursiveXSD({
        targetNamespace: 'http://example.com/recursive',
        includeSelfValidation: true,
        maxRecursionDepth: 5,
        generateComments: false
      });

      expect(xsd).toContain('SchemaType');
      expect(xsd).toContain('ElementType');
      expect(xsd).toContain('ComplexTypeType');
    });

    it('should validate generated XSD', async () => {
      const xsd = await generator.generateRecursiveXSD({
        targetNamespace: 'http://example.com/recursive',
        includeSelfValidation: true,
        maxRecursionDepth: 5,
        generateComments: false
      });

      const isValid = await generator.validateGeneratedXSD(xsd);
      expect(isValid).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should work with utility functions', async () => {
      const { createXSDASTAnalysisSuite, quickValidateXSD, quickGenerateSelfValidatingXSD } = await import('../utils');
      
      // Test analysis suite
      const suite = createXSDASTAnalysisSuite(sampleXSD);
      expect(suite).toBeDefined();
      expect(suite.traverser).toBeDefined();
      expect(suite.helper).toBeDefined();
      expect(suite.validator).toBeDefined();
      expect(suite.generator).toBeDefined();

      // Test quick validation
      const validationResult = await quickValidateXSD(sampleXSD);
      
      if (!validationResult.isValid) {
        console.log('Quick validation errors:', validationResult.errorCount);
        console.log('Quick validation summary:', validationResult.summary);
      }
      
      expect(validationResult.isValid).toBe(true);

      // Test quick generation
      const generatedXSD = await quickGenerateSelfValidatingXSD('http://example.com/test');
      expect(generatedXSD).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    });
  });
});
