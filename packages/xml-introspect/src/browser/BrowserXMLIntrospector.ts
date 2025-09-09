/**
 * Browser XML Introspector - Extends core functionality for browser environments
 * 
 * This contains browser-specific functionality and provides a clean interface
 * for browser usage.
 */

import { XMLAnalyzer, type XMLStructure, type ContentAnalysis } from '../core/XMLAnalyzer.js';

import { XMLFakerGenerator, type XMLFakerOptions } from '../core/XMLFakerGenerator.js';
import type { XSDParser } from '../core/XSDParser.js';
import { BrowserXSDParser } from './BrowserXSDParser.js';

// Browser-specific types (same as core for now, but can be extended)
export type BrowserXMLStructure = XMLStructure;
export type BrowserContentAnalysis = ContentAnalysis;

/**
 * Browser XML Introspector that extends core functionality
 */
export class BrowserXMLIntrospector extends XMLAnalyzer {
  private xsdParser: XSDParser;
  private fakerGenerator: XMLFakerGenerator;

  constructor(options: XMLFakerOptions = {}) {
    super();
    this.xsdParser = new BrowserXSDParser();
    this.fakerGenerator = new XMLFakerGenerator(options);
  }

  /**
   * Analyze XSD content structure
   */
  async analyzeXSDContent(xsdContent: string): Promise<any> {
    try {
      const xsdAST = this.xsdParser.parseXSDContent(xsdContent);
      return {
        elementNames: this.xsdParser.getElementNames(),
        structure: xsdAST,
        summary: this.xsdParser.getStructureSummary()
      };
    } catch (error) {
      console.warn('Failed to analyze XSD content:', error);
      return {
        elementNames: [],
        structure: null,
        summary: 'Failed to parse XSD content'
      };
    }
  }

  /**
   * Generate XML from XSD content
   */
  generateXMLFromXSD(xsdContent: string): string {
    return this.fakerGenerator.generateXMLFromXSD(xsdContent);
  }

  /**
   * Generate sample XML with specified element count
   */
  generateSampleXML(elementCount: number): string {
    return this.fakerGenerator.generateSampleXML(elementCount);
  }

  /**
   * Generate realistic XML from structure
   */
  generateRealisticXML(structure: XMLStructure, options: XMLFakerOptions = {}): string {
    return this.fakerGenerator.generateXMLFromStructure(structure, options);
  }

  /**
   * Get XSD parser instance
   */
  getXSDParser(): XSDParser {
    return this.xsdParser;
  }

  /**
   * Get faker generator instance
   */
  getFakerGenerator(): XMLFakerGenerator {
    return this.fakerGenerator;
  }
}

// Export convenience functions for CDN usage
export const createXMLIntrospector = (options?: XMLFakerOptions) => new BrowserXMLIntrospector(options);

// Export the default instance for convenience
export const xmlIntrospect = new BrowserXMLIntrospector();

// Export convenience functions
export const analyzeXML = (xmlContent: string) => xmlIntrospect.analyzeContent(xmlContent);
export const previewXML = (xmlContent: string, lines?: number) => xmlIntrospect.getContentPreview(xmlContent, lines);
export const validateXML = (xmlContent: string) => xmlIntrospect.validateContent(xmlContent);
export const analyzeXMLStructure = (xmlContent: string) => xmlIntrospect.analyzeContentStructure(xmlContent);
export const analyzeXSD = (xsdContent: string) => xmlIntrospect.analyzeXSDContent(xsdContent);
export const generateSampleXML = (elementCount: number) => xmlIntrospect.generateSampleXML(elementCount);
export const generateXMLFromXSD = (xsdContent: string) => xmlIntrospect.generateXMLFromXSD(xsdContent);

// For UMD/IIFE builds, expose everything on the global object
if (typeof window !== 'undefined') {
  (window as any).XMLIntrospect = {
    BrowserXMLIntrospector,
    createXMLIntrospector,
    analyzeXML,
    previewXML,
    validateXML,
    analyzeXMLStructure,
    analyzeXSD,
    generateSampleXML,
    generateXMLFromXSD,
    default: xmlIntrospect
  };
}
