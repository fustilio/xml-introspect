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
import { FormatProcessor, type FormatProcessingResult, type FormatProcessingOptions } from '@fustilio/data-loader';

// Browser-specific types (same as core for now, but can be extended)
export type BrowserXMLStructure = XMLStructure;
export type BrowserContentAnalysis = ContentAnalysis;

/**
 * Browser XML Introspector that extends core functionality
 */
export class BrowserXMLIntrospector extends XMLAnalyzer {
  private xsdParser: XSDParser;
  private fakerGenerator: XMLFakerGenerator;
  private formatProcessor: FormatProcessor;

  constructor(options: XMLFakerOptions = {}) {
    super();
    this.xsdParser = new BrowserXSDParser();
    this.fakerGenerator = new XMLFakerGenerator(options);
    this.formatProcessor = new FormatProcessor();
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

  /**
   * Process compressed files from URL (supports .gz, .tar, .xz, etc.)
   */
  async processCompressedURL(url: string, projectId: string = 'browser'): Promise<FormatProcessingResult> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      const result = await this.formatProcessor.processData(arrayBuffer, {
        projectId,
        enableTarExtraction: true
      });
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        contentType: 'unknown',
        confidence: 'low',
        processingSteps: ['URL fetch failed'],
        totalProcessingTime: 0,
        originalSize: 0,
        finalSize: 0
      };
    }
  }

  /**
   * Analyze compressed XML from URL
   */
  async analyzeCompressedURL(url: string, projectId: string = 'browser'): Promise<{
    analysis: XMLStructure | null;
    processing: FormatProcessingResult;
  }> {
    const processing = await this.processCompressedURL(url, projectId);
    
    if (!processing.success || !processing.xmlContent) {
      return {
        analysis: null,
        processing
      };
    }

    try {
      const analysis = await this.analyzeContent(processing.xmlContent);
      return {
        analysis,
        processing
      };
    } catch (error) {
      return {
        analysis: null,
        processing: {
          ...processing,
          success: false,
          error: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`
        }
      };
    }
  }

  /**
   * Generate sample XML from compressed URL
   */
  async generateSampleFromCompressedURL(
    url: string, 
    elementCount: number = 100, 
    projectId: string = 'browser'
  ): Promise<{
    sampleXML: string | null;
    processing: FormatProcessingResult;
  }> {
    const processing = await this.processCompressedURL(url, projectId);
    
    if (!processing.success || !processing.xmlContent) {
      return {
        sampleXML: null,
        processing
      };
    }

    try {
      const structure = await this.analyzeContent(processing.xmlContent);
      const sampleXML = this.fakerGenerator.generateXMLFromStructure(structure, { maxElements: elementCount });
      return {
        sampleXML,
        processing
      };
    } catch (error) {
      return {
        sampleXML: null,
        processing: {
          ...processing,
          success: false,
          error: `Sample generation failed: ${error instanceof Error ? error.message : String(error)}`
        }
      };
    }
  }

  /**
   * Get format processor instance
   */
  getFormatProcessor(): FormatProcessor {
    return this.formatProcessor;
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

// Compressed file processing functions
export const processCompressedURL = (url: string, projectId?: string) => xmlIntrospect.processCompressedURL(url, projectId);
export const analyzeCompressedURL = (url: string, projectId?: string) => xmlIntrospect.analyzeCompressedURL(url, projectId);
export const generateSampleFromCompressedURL = (url: string, elementCount?: number, projectId?: string) => 
  xmlIntrospect.generateSampleFromCompressedURL(url, elementCount, projectId);

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
    processCompressedURL,
    analyzeCompressedURL,
    generateSampleFromCompressedURL,
    default: xmlIntrospect
  };
}
