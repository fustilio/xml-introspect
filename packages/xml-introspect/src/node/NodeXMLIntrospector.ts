/**
 * Node.js XML Introspector - Extends core functionality with Node.js-specific features
 * 
 * This contains Node.js-specific functionality like file system operations,
 * streaming, and other Node.js APIs.
 */

import { writeFileSync, readFileSync, statSync, createReadStream } from 'fs';
import { XMLAnalyzer, type XMLStructure, type ContentAnalysis } from '../core/XMLAnalyzer.js';
import { XSDParser } from '../core/XSDParser.js';
import { XMLFakerGenerator, type XMLFakerOptions } from '../core/XMLFakerGenerator.js';
import { fromXml } from 'xast-util-from-xml';
import { toXmlPretty as toXml } from '../core/xast-util-to-xml-pretty.js';
import { visit } from 'unist-util-visit';
import { filter } from 'unist-util-filter';
import { find } from 'unist-util-find';
import { map } from 'unist-util-map';
import { size } from 'unist-util-size';
import { parents } from 'unist-util-parents';
import sax from 'sax';
import type { Tag } from 'sax';
import { validateXML, memoryPages } from 'xmllint-wasm';

// Node.js-specific types
export interface SamplingOptions {
  maxElements?: number;
  maxDepth?: number;
  strategy?: 'balanced' | 'random' | 'first';
  preserveAttributes?: boolean;
  preserveRelationships?: boolean;
  preserveAllTypes?: boolean;
  elementTypeLimits?: Record<string, number>;
  schema?: string;
}

export interface XSDFromXMLOptions {
  targetNamespace?: string;
  elementForm?: 'qualified' | 'unqualified';
  attributeForm?: 'qualified' | 'unqualified';
}

export interface XMLFromXSDOptions {
  maxElements?: number;
  generateRealisticData?: boolean;
}

export interface XMLTransformationOptions {
  inputFile: string;
  outputFile: string;
  maxElements?: number;
  preserveStructure?: boolean;
  samplingStrategy?: 'balanced' | 'random' | 'first';
}

export interface ValidationOptions {
  strict?: boolean;
  schema?: string;
}

export interface XMLValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Node.js-specific element types
export interface ElementTypeInfo {
  count: number;
  attributes: Set<string>;
  children: Set<string>;
  maxDepth: number;
  examples: string[];
}

export interface XMLElement {
  tagName: string;
  attributes: Record<string, string>;
  children: XMLElement[];
  depth: number;
  parent?: XMLElement;
  textContent?: string;
}

export interface NodeXMLStructure extends XMLStructure {
  rootElement: string;
  elementTypes: Map<string, ElementTypeInfo>;
  namespaces: Map<string, string>;
}

const LARGE_FILE_THRESHOLD_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Node.js XML Introspector that extends core functionality
 */
export class NodeXMLIntrospector extends XMLAnalyzer {
  private defaultOptions: Required<SamplingOptions>;

  constructor(options: Partial<SamplingOptions> = {}) {
    super();
    this.defaultOptions = {
      maxElements: options.maxElements ?? 100,
      maxDepth: options.maxDepth ?? 5,
      strategy: options.strategy ?? 'balanced',
      preserveAttributes: options.preserveAttributes ?? false,
      preserveRelationships: options.preserveRelationships ?? false,
      preserveAllTypes: options.preserveAllTypes ?? false,
      elementTypeLimits: options.elementTypeLimits ?? {},
      schema: options.schema ?? ''
    };
  }

  /**
   * Analyze the structure of an XML file (Node.js-specific)
   */
  async analyzeStructure(filePath: string, verbose: boolean = false): Promise<NodeXMLStructure> {
    const stats = statSync(filePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);
    if (verbose) console.log(`📊 Analyzing XML file: ${fileSizeMB} MB`);
    
    const isLargeFile = stats.size > LARGE_FILE_THRESHOLD_BYTES;

    if (isLargeFile) {
      if (verbose) console.log('🔄 Using streaming analysis for large file...');
      return this._analyzeStructureStreaming(filePath, verbose);
    }
    
    if (verbose) console.log('🔄 Using in-memory analysis...');
    try {
      const xmlContent = readFileSync(filePath, 'utf8');
      if (verbose) console.log('📖 XML file loaded into memory');
      
      const xast = fromXml(xmlContent);
      if (verbose) console.log('🔍 Parsing XML structure...');

      const elementTypes = new Map<string, ElementTypeInfo>();
      const namespaces = new Map<string, string>();
      let rootElement = '';
      let maxDepth = 0;
      let totalElements = 0;

      // Use a more controlled traversal approach with safety limits
      const traverseNode = (node: any, depth: number = 0, parentElement?: XMLElement): XMLElement | null => {
        // Safety check to prevent infinite recursion
        if (depth > 1000 || totalElements > 100000) {
          console.warn(`Safety limit reached: depth=${depth}, elements=${totalElements}`);
          return null;
        }

        if (node.type === 'element' && node.name) {
          const tagName = node.name.includes(':') ? node.name.split(':')[1] : node.name;
          
          totalElements++;
          maxDepth = Math.max(maxDepth, depth + 1);
          
          if (!rootElement) {
            rootElement = tagName;
          }
          
          const textContent = node.children
            ?.filter((c: any) => c.type === 'text' && c.value?.trim())
            .map((c: any) => c.value.trim())
            .join(' ') || '';

          const element: XMLElement = {
            tagName,
            attributes: node.attributes ?? {},
            children: [],
            depth: depth,
            parent: parentElement,
            textContent: textContent || undefined
          };
          
          // Populate namespaces from root element attributes
          if (depth === 0 && node.attributes) {
            for (const [key, value] of Object.entries(node.attributes)) {
              if (key.startsWith('xmlns') && key !== 'xmlns') {
                namespaces.set(key, value);
              }
            }
          }

          if (!elementTypes.has(tagName)) {
            elementTypes.set(tagName, {
              count: 0,
              attributes: new Set<string>(),
              children: new Set<string>(),
              maxDepth: depth + 1,
              examples: []
            });
          }

          const elementInfo = elementTypes.get(tagName)!;
          elementInfo.count++;
          elementInfo.maxDepth = Math.max(elementInfo.maxDepth, depth + 1);

          // Track attributes
          if (node.attributes) {
            Object.keys(node.attributes).forEach(attrName => {
              elementInfo.attributes.add(attrName);
            });
          }

          // Track parent-child relationships
          if (parentElement) {
            elementInfo.children.add(parentElement.tagName);
          }

          // Store text content examples
          if (textContent && elementInfo.examples.length < 5) {
            elementInfo.examples.push(textContent);
          }

          // Process children
          if (node.children) {
            for (const child of node.children) {
              const childElement = traverseNode(child, depth + 1, element);
              if (childElement) {
                element.children.push(childElement);
              }
            }
          }

          return element;
        }
        return null;
      };

      traverseNode(xast);

      if (verbose) {
        console.log(`✅ Analysis complete: ${totalElements} elements, max depth: ${maxDepth}`);
        console.log(`📊 Element types: ${Array.from(elementTypes.keys()).join(', ')}`);
      }

      // Convert to the expected format
      const elementCounts: Record<string, number> = {};
      const attributeCounts: Record<string, number> = {};
      const rootElements: string[] = [rootElement];
      const commonElements: Array<{ name: string; count: number }> = [];
      const attributes: Array<{ name: string; count: number }> = [];

      elementTypes.forEach((info, name) => {
        elementCounts[name] = info.count;
        info.attributes.forEach(attr => {
          attributeCounts[attr] = (attributeCounts[attr] || 0) + 1;
        });
      });

      // Sort and limit common elements
      Object.entries(elementCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .forEach(([name, count]) => {
          commonElements.push({ name, count });
        });

      // Sort and limit attributes
      Object.entries(attributeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .forEach(([name, count]) => {
          attributes.push({ name, count });
        });

      return {
        elementCounts,
        attributeCounts,
        rootElements,
        commonElements,
        attributes,
        maxDepth,
        totalElements,
        rootElement,
        elementTypes,
        namespaces
      };
    } catch (error) {
      throw new Error(`Failed to analyze XML structure: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate XSD from XML file (Node.js-specific)
   */
  async generateXSDFromXML(filePath: string, options: XSDFromXMLOptions = {}): Promise<string> {
    const structure = await this.analyzeStructure(filePath);
    return this.generateXSDFromStructure(structure, options);
  }

  /**
   * Generate XSD from structure
   */
  private generateXSDFromStructure(structure: NodeXMLStructure, options: XSDFromXMLOptions = {}): string {
    const targetNamespace = options.targetNamespace || 'http://example.com/schema';
    const elementForm = options.elementForm || 'qualified';
    const attributeForm = options.attributeForm || 'unqualified';

    let xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="${targetNamespace}"
           elementFormDefault="${elementForm}"
           attributeFormDefault="${attributeForm}">\n`;

    // Generate element declarations
    structure.elementTypes.forEach((elementInfo, elementName) => {
      xsd += `  <xs:element name="${elementName}" type="${elementName}Type"/>\n`;
    });

    xsd += '\n';

    // Generate complex type definitions
    structure.elementTypes.forEach((elementInfo, elementName) => {
      xsd += `  <xs:complexType name="${elementName}Type">\n`;
      
      if (elementInfo.children.size > 0) {
        xsd += '    <xs:sequence>\n';
        elementInfo.children.forEach(childName => {
          xsd += `      <xs:element ref="${childName}" minOccurs="0" maxOccurs="unbounded"/>\n`;
        });
        xsd += '    </xs:sequence>\n';
      }

      // Generate attribute declarations
      elementInfo.attributes.forEach(attrName => {
        xsd += `    <xs:attribute name="${attrName}" type="xs:string"/>\n`;
      });

      xsd += '  </xs:complexType>\n\n';
    });

    xsd += '</xs:schema>';
    return xsd;
  }

  /**
   * Streaming analysis for large files (Node.js-specific)
   */
  private async _analyzeStructureStreaming(filePath: string, verbose: boolean = false): Promise<NodeXMLStructure> {
    // This would use the StreamingXMLIntrospector
    // For now, fall back to regular analysis
    return this.analyzeStructure(filePath, verbose);
  }

  /**
   * Validate XML against XSD (Node.js-specific)
   */
  async validateXML(xmlPath: string, xsdPath: string, options: ValidationOptions = {}): Promise<XMLValidationResult> {
    try {
      const xmlContent = readFileSync(xmlPath, 'utf8');
      const xsdContent = readFileSync(xsdPath, 'utf8');
      
      // Try xmllint-wasm first for comprehensive validation
      try {
        const result = await validateXML({
          xml: [{
            fileName: xmlPath,
            contents: xmlContent,
          }],
          schema: [xsdContent],
          initialMemoryPages: 256,
          maxMemoryPages: 2 * memoryPages.GiB,
        });
        
        return {
          valid: result.valid,
          errors: Array.from(result.errors).map(error => error.message || String(error)),
          warnings: (result as any).warnings ? Array.from((result as any).warnings).map((w: any) => w.message || String(w)) : []
        };
      } catch (wasmError) {
        // If WASM fails, fall back to basic validation
        return this.performBasicValidationWithXSD(xmlContent, xsdContent);
      }
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      };
    }
  }

  /**
   * Perform basic XML validation without WASM
   */
  private performBasicValidationWithXSD(xmlContent: string, xsdContent: string): XMLValidationResult {
    try {
      // Basic validation - try to parse both XML and XSD
      fromXml(xmlContent);
      fromXml(xsdContent);
      return {
        valid: true,
        errors: [],
        warnings: ['Basic validation only - use xmllint-wasm for comprehensive validation']
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Invalid XML or XSD'],
        warnings: []
      };
    }
  }

  /**
   * Generate realistic sample from XML file (Node.js-specific)
   */
  async generateRealisticSample(filePath: string, options: XMLFakerOptions = {}): Promise<string> {
    const structure = await this.analyzeStructure(filePath);
    const fakerGenerator = new XMLFakerGenerator(options);
    return fakerGenerator.generateXMLFromStructure(structure, options);
  }
}
