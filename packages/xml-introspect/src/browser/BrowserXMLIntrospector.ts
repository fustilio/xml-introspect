/**
 * Browser XML Introspector - Extends core functionality for browser environments
 * 
 * This contains browser-specific functionality and provides a clean interface
 * for browser usage with complete feature parity with Node.js version.
 */

import { 
  XMLAnalyzer, 
  type XMLStructure, 
  type XMLValidationResult,
  type BrowserSamplingOptions,
  type BrowserXSDFromXMLOptions,
  type BrowserValidationOptions,
  type BrowserXMLValidationResult,
  generateXSDFromStructure,
  convertBrowserXSDOptions,
  validateXMLWithXSD,
  convertBrowserValidationOptions,
  toBrowserValidationResult,
  selectSampleElements,
  buildSampleXML,
  convertBrowserSamplingOptions,
} from '../core/index.js';
import { XMLFakerGenerator, type XMLFakerOptions } from '../core/XMLFakerGenerator.js';
import type { XSDParser } from '../core/XSDParser.js';
import { BrowserXSDParser } from './BrowserXSDParser.js';
import { FormatProcessor, type FormatProcessingResult } from '@fustilio/data-loader';

// Browser-specific types (re-export for convenience)
export type { BrowserXMLStructure } from '../core/index.js';

/**
 * Browser XML Introspector that extends core functionality with complete feature parity
 */
export class BrowserXMLIntrospector extends XMLAnalyzer {
  private xsdParser: XSDParser;
  private fakerGenerator: XMLFakerGenerator;
  private formatProcessor: FormatProcessor;
  private defaultOptions: BrowserSamplingOptions;

  constructor(options: XMLFakerOptions = {}) {
    super();
    this.xsdParser = new BrowserXSDParser();
    this.fakerGenerator = new XMLFakerGenerator(options);
    this.formatProcessor = new FormatProcessor();
    this.defaultOptions = {
      maxElements: 100,
      maxDepth: 10,
      strategy: 'balanced',
      preserveAttributes: true,
      preserveRelationships: true,
      preserveAllTypes: true,
    };
  }

  /**
   * Generate XSD from XML content (NEW - Key feature!)
   */
  async generateXSDFromXML(
    xmlContent: string,
    options: BrowserXSDFromXMLOptions = {}
  ): Promise<string> {
    const analysis = await this.analyzeContent(xmlContent);
    // Convert XMLAnalyzer's XMLStructure to the expected format
    const structure: XMLStructure = {
      elementCounts: analysis.elementCounts || {},
      attributeCounts: analysis.attributeCounts || {},
      rootElements: analysis.rootElements || [],
      commonElements: analysis.commonElements || [],
      attributes: analysis.attributes || [],
      maxDepth: analysis.maxDepth || 0,
      totalElements: analysis.totalElements || 0,
      rootElement: analysis.rootElement || '',
      elementTypes: analysis.elementTypes || new Map(),
      namespaces: analysis.namespaces || new Map(),
    };
    const sharedOptions = convertBrowserXSDOptions(options);
    return generateXSDFromStructure(structure, sharedOptions);
  }

  /**
   * Validate XML against XSD (NEW - Key feature!)
   */
  async validateXML(
    xmlContent: string,
    xsdContent: string,
    options: BrowserValidationOptions = {}
  ): Promise<BrowserXMLValidationResult> {
    const sharedOptions = convertBrowserValidationOptions(options);
    const result = await validateXMLWithXSD(xmlContent, xsdContent, sharedOptions);
    return toBrowserValidationResult(result);
  }

  /**
   * Generate sample XML from content (NEW - Enhanced feature!)
   */
  async generateSample(
    xmlContent: string,
    options: BrowserSamplingOptions = {}
  ): Promise<string> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Sample generation timeout after 30 seconds')),
        30000
      );
    });

    const samplePromise = (async () => {
      const analysis = await this.analyzeContent(xmlContent);
      // Convert XMLAnalyzer's XMLStructure to the expected format
      const structure: XMLStructure = {
        elementCounts: analysis.elementCounts || {},
        attributeCounts: analysis.attributeCounts || {},
        rootElements: analysis.rootElements || [],
        commonElements: analysis.commonElements || [],
        attributes: analysis.attributes || [],
        maxDepth: analysis.maxDepth || 0,
        totalElements: analysis.totalElements || 0,
        rootElement: analysis.rootElement || '',
        elementTypes: analysis.elementTypes || new Map(),
        namespaces: analysis.namespaces || new Map(),
      };
      const sharedOptions = convertBrowserSamplingOptions(mergedOptions);

      // Generate sample based on strategy
      const sampleElements = selectSampleElements(structure, sharedOptions);

      // Build the sample XML
      return buildSampleXML(sampleElements, structure, sharedOptions);
    })();

    return Promise.race([samplePromise, timeoutPromise]);
  }

  /**
   * Process URL (automatically detects compressed files)
   */
  async processURL(url: string, projectId: string = 'browser'): Promise<{
    content: string | null;
    processing: FormatProcessingResult;
    isCompressed: boolean;
  }> {
    const isCompressed = this.isCompressedURL(url);
    
    if (isCompressed) {
      const processing = await this.processCompressedURL(url, projectId);
      return {
        content: processing.xmlContent || null,
        processing,
        isCompressed: true
      };
    } else {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const content = await response.text();
        return {
          content,
          processing: {
            success: true,
            error: undefined,
            contentType: 'text/xml' as any,
            confidence: 'high',
            processingSteps: ['URL fetch'],
            totalProcessingTime: 0,
            originalSize: content.length,
            finalSize: content.length
          },
          isCompressed: false
        };
      } catch (error) {
        return {
          content: null,
          processing: {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            contentType: 'unknown',
            confidence: 'low',
            processingSteps: ['URL fetch failed'],
            totalProcessingTime: 0,
            originalSize: 0,
            finalSize: 0
          },
          isCompressed: false
        };
      }
    }
  }

  /**
   * Analyze URL (automatically detects compressed files)
   */
  async analyzeURL(url: string, projectId: string = 'browser'): Promise<{
    analysis: XMLStructure | null;
    processing: FormatProcessingResult;
    isCompressed: boolean;
  }> {
    const result = await this.processURL(url, projectId);
    
    if (!result.content) {
      return {
        analysis: null,
        processing: result.processing,
        isCompressed: result.isCompressed
      };
    }

    try {
      const analysis = await this.analyzeContent(result.content);
      return {
        analysis,
        processing: result.processing,
        isCompressed: result.isCompressed
      };
    } catch (error) {
      return {
        analysis: null,
        processing: {
          ...result.processing,
          success: false,
          error: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`
        },
        isCompressed: result.isCompressed
      };
    }
  }

  /**
   * Generate sample from URL (automatically detects compressed files)
   */
  async generateSampleFromURL(
    url: string,
    options: BrowserSamplingOptions = {},
    projectId: string = 'browser'
  ): Promise<{
    sampleXML: string | null;
    processing: FormatProcessingResult;
    isCompressed: boolean;
  }> {
    const result = await this.processURL(url, projectId);
    
    if (!result.content) {
      return {
        sampleXML: null,
        processing: result.processing,
        isCompressed: result.isCompressed
      };
    }

    try {
      const sampleXML = await this.generateSample(result.content, options);
      return {
        sampleXML,
        processing: result.processing,
        isCompressed: result.isCompressed
      };
    } catch (error) {
      return {
        sampleXML: null,
        processing: {
          ...result.processing,
          success: false,
          error: `Sample generation failed: ${error instanceof Error ? error.message : String(error)}`
        },
        isCompressed: result.isCompressed
      };
    }
  }

  /**
   * Generate XSD from URL (automatically detects compressed files)
   */
  async generateXSDFromURL(
    url: string,
    options: BrowserXSDFromXMLOptions = {},
    projectId: string = 'browser'
  ): Promise<{
    xsd: string | null;
    processing: FormatProcessingResult;
    isCompressed: boolean;
  }> {
    const result = await this.processURL(url, projectId);
    
    if (!result.content) {
      return {
        xsd: null,
        processing: result.processing,
        isCompressed: result.isCompressed
      };
    }

    try {
      const xsd = await this.generateXSDFromXML(result.content, options);
      return {
        xsd,
        processing: result.processing,
        isCompressed: result.isCompressed
      };
    } catch (error) {
      return {
        xsd: null,
        processing: {
          ...result.processing,
          success: false,
          error: `XSD generation failed: ${error instanceof Error ? error.message : String(error)}`
        },
        isCompressed: result.isCompressed
      };
    }
  }

  // Legacy methods for backward compatibility
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

  generateXMLFromXSD(xsdContent: string): string {
    return this.fakerGenerator.generateXMLFromXSD(xsdContent);
  }

  generateSampleXML(elementCount: number): string {
    return this.fakerGenerator.generateSampleXML(elementCount);
  }

  generateRealisticXML(structure: XMLStructure, options: XMLFakerOptions = {}): string {
    return this.fakerGenerator.generateXMLFromStructure(structure, options);
  }

  // Private helper methods
  private isCompressedURL(url: string): boolean {
    const compressedExtensions = ['.gz', '.tar', '.xz', '.bz2', '.zip'];
    return compressedExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  private async processCompressedURL(url: string, projectId: string = 'browser'): Promise<FormatProcessingResult> {
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

// URL processing functions
export const processURL = (url: string, projectId?: string) => xmlIntrospect.processURL(url, projectId);
export const analyzeURL = (url: string, projectId?: string) => xmlIntrospect.analyzeURL(url, projectId);
export const generateSampleFromURL = (url: string, options?: BrowserSamplingOptions, projectId?: string) => 
  xmlIntrospect.generateSampleFromURL(url, options, projectId);
export const generateXSDFromURL = (url: string, options?: BrowserXSDFromXMLOptions, projectId?: string) => 
  xmlIntrospect.generateXSDFromURL(url, options, projectId);

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
    processURL,
    analyzeURL,
    generateSampleFromURL,
    generateXSDFromURL,
    default: xmlIntrospect
  };
}
