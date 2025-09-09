/**
 * Node.js XML Introspector - Extends core functionality with Node.js-specific features
 *
 * This contains Node.js-specific functionality like file system operations,
 * streaming, and other Node.js APIs.
 */

import { writeFileSync, readFileSync, statSync, createReadStream } from 'fs';
import {
  XMLAnalyzer,
  type XMLStructure,
  type ContentAnalysis,
} from '../core/XMLAnalyzer.js';
import { XSDParser } from '../core/XSDParser.js';
import {
  XMLFakerGenerator,
  type XMLFakerOptions,
} from '../core/XMLFakerGenerator.js';
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
import {
  Node as XASTNode,
  Element as XASTElement,
  Text as XASTText,
} from 'xast';

// Pattern rule types
interface PatternRule {
  elementName: string;
  attributes: string[];
  children: string[];
  minOccurrences: number;
  maxOccurrences: number;
  constraints: Array<{
    type: 'attribute' | 'child';
    name: string;
    required: boolean;
  }>;
}

// Sampling strategy enum
enum SamplingStrategy {
  BALANCED = 'balanced',
  RANDOM = 'random',
  FIRST = 'first',
}

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
  verbose?: boolean;
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
  examples: XMLElement[];
}

export interface XMLElement {
  tagName: string;
  attributes: Record<string, string>;
  children: XMLElement[];
  depth: number;
  parent?: XMLElement;
  textContent?: string;
}

export interface NodeXMLStructure {
  elementCounts: Record<string, number>;
  attributeCounts: Record<string, number>;
  rootElements: string[];
  commonElements: Array<{ name: string; count: number }>;
  attributes: Array<{ name: string; count: number }>;
  maxDepth: number;
  totalElements: number;
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
      schema: options.schema ?? '',
    };
  }

  /**
   * Analyze the structure of an XML file (Node.js-specific)
   */
  async analyzeStructure(
    filePath: string,
    verbose: boolean = false
  ): Promise<NodeXMLStructure> {
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
      const traverseNode = (
        node: any,
        depth: number = 0,
        parentElement?: XMLElement
      ): XMLElement | null => {
        // Safety check to prevent infinite recursion
        if (depth > 1000 || totalElements > 100000) {
          console.warn(
            `Safety limit reached: depth=${depth}, elements=${totalElements}`
          );
          return null;
        }

        if (node.type === 'element' && node.name) {
          const tagName = node.name.includes(':')
            ? node.name.split(':')[1]
            : node.name;

          totalElements++;
          maxDepth = Math.max(maxDepth, depth + 1);

          if (!rootElement) {
            rootElement = tagName;
          }

          const textContent =
            node.children
              ?.filter((c: any) => c.type === 'text' && c.value?.trim())
              .map((c: any) => String(c.value).trim())
              .join(' ') || '';

          const element: XMLElement = {
            tagName,
            attributes: Object.fromEntries(
              Object.entries(node.attributes ?? {}).map(([key, value]) => [key, String(value ?? '')])
            ),
            children: [],
            depth: depth,
            parent: parentElement,
            textContent: textContent || undefined,
          };

          // Populate namespaces from root element attributes
          if (depth === 0 && node.attributes) {
            for (const [key, value] of Object.entries(node.attributes)) {
              if (key.startsWith('xmlns') && key !== 'xmlns') {
                namespaces.set(key, String(value));
              }
            }
          }

          if (!elementTypes.has(tagName)) {
            elementTypes.set(tagName, {
              count: 0,
              attributes: new Set<string>(),
              children: new Set<string>(),
              maxDepth: depth + 1,
              examples: [],
            });
          }

          const elementInfo = elementTypes.get(tagName)!;
          elementInfo.count++;
          elementInfo.maxDepth = Math.max(elementInfo.maxDepth, depth + 1);

          // Track attributes
          if (node.attributes) {
            Object.keys(node.attributes).forEach((attrName) => {
              elementInfo.attributes.add(attrName);
            });
          }

          // Track parent-child relationships
          if (parentElement) {
            // Add this element as a child of its parent
            const parentInfo = elementTypes.get(parentElement.tagName);
            if (parentInfo) {
              parentInfo.children.add(tagName);
            }
          }

          // Store examples (text content or attributes)
          if ((textContent || Object.keys(element.attributes).length > 0) && elementInfo.examples.length < 5) {
            elementInfo.examples.push(element);
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

      // Handle different XAST structures
      if (Array.isArray(xast)) {
        // If xast is an array, traverse each root element
        for (const rootNode of xast) {
          traverseNode(rootNode);
        }
      } else if (xast && xast.children) {
        // If xast has children, traverse them
        for (const child of xast.children) {
          traverseNode(child);
        }
      } else {
        // Single root element
        traverseNode(xast);
      }


      if (verbose) {
        console.log(
          `✅ Analysis complete: ${totalElements} elements, max depth: ${maxDepth}`
        );
        console.log(
          `📊 Element types: ${Array.from(elementTypes.keys()).join(', ')}`
        );
      }

      // Convert to the expected format
      const elementCounts: Record<string, number> = {};
      const attributeCounts: Record<string, number> = {};
      const rootElements: string[] = [rootElement];
      const commonElements: Array<{ name: string; count: number }> = [];
      const attributes: Array<{ name: string; count: number }> = [];

      elementTypes.forEach((info, name) => {
        elementCounts[name] = info.count;
        info.attributes.forEach((attr) => {
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
        namespaces,
      };
    } catch (error) {
      throw new Error(
        `Failed to analyze XML structure: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Generate XSD from XML file (Node.js-specific)
   */
  async generateXSDFromXML(
    filePath: string,
    options: XSDFromXMLOptions = {}
  ): Promise<string> {
    const structure = await this.analyzeStructure(filePath);
    return this.generateXSDFromStructure(structure, options);
  }

  /**
   * Generate XSD from structure
   */
  private generateXSDFromStructure(
    structure: NodeXMLStructure,
    options: XSDFromXMLOptions = {}
  ): string {
    const targetNamespace =
      options.targetNamespace || 'http://example.com/schema';
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
        elementInfo.children.forEach((childName) => {
          xsd += `      <xs:element ref="${childName}" minOccurs="0" maxOccurs="unbounded"/>\n`;
        });
        xsd += '    </xs:sequence>\n';
      }

      // Generate attribute declarations
      elementInfo.attributes.forEach((attrName) => {
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
  private async _analyzeStructureStreaming(
    filePath: string,
    verbose: boolean = false
  ): Promise<NodeXMLStructure> {
    return new Promise((resolve, reject) => {
      const structure: NodeXMLStructure = {
        elementCounts: {},
        attributeCounts: {},
        rootElements: [],
        commonElements: [],
        attributes: [],
        rootElement: '',
        elementTypes: new Map<string, ElementTypeInfo>(),
        maxDepth: 0,
        totalElements: 0,
        namespaces: new Map<string, string>(),
      };

      let currentDepth = 0;
      let elementStack: string[] = [];

      const parser = sax.createStream(true, {
        trim: true,
        normalize: true,
        lowercase: false,
        position: false,
        xmlns: false,
      });

      parser.on('opentag', (node) => {
        const tagName = node.name;
        structure.totalElements++;
        currentDepth = elementStack.length + 1;
        structure.maxDepth = Math.max(structure.maxDepth, currentDepth);

        // Set root element if this is the first element
        if (!structure.rootElement) {
          structure.rootElement = tagName;
          structure.rootElements = [tagName];
        }

        // Track element types
        if (!structure.elementTypes.has(tagName)) {
          structure.elementTypes.set(tagName, {
            count: 0,
            attributes: new Set<string>(),
            children: new Set<string>(),
            maxDepth: currentDepth,
            examples: [],
          });
        }

        const elementInfo = structure.elementTypes.get(tagName)!;
        elementInfo.count++;
        elementInfo.maxDepth = Math.max(elementInfo.maxDepth, currentDepth);

        // Track attributes
        if (node.attributes) {
          Object.keys(node.attributes).forEach((attrName) => {
            elementInfo.attributes.add(attrName);
          });
        }

        // Track parent-child relationships
        if (elementStack.length > 0) {
          const parentTag = elementStack[elementStack.length - 1];
          elementInfo.children.add(parentTag);
        }

        // Store examples for elements with attributes
        if (Object.keys(node.attributes || {}).length > 0 && elementInfo.examples.length < 5) {
          const example: XMLElement = {
            tagName,
            attributes: Object.fromEntries(
              Object.entries(node.attributes || {}).map(([key, value]) => [key, String(value ?? '')])
            ),
            children: [],
            depth: currentDepth,
            parent: undefined,
          };
          elementInfo.examples.push(example);
        }

        elementStack.push(tagName);
      });

      parser.on('closetag', (tagName) => {
        elementStack.pop();
      });

      parser.on('text', (text) => {
        if (text.trim() && elementStack.length > 0) {
          const currentTag = elementStack[elementStack.length - 1];
          const elementInfo = structure.elementTypes.get(currentTag);
          if (elementInfo && elementInfo.examples.length < 5) {
            // Create a simple example element
            const example: XMLElement = {
              tagName: currentTag,
              attributes: {},
              children: [],
              depth: elementStack.length,
              textContent: text.trim(),
            };
            elementInfo.examples.push(example);
          }
        }
      });

      parser.on('error', (error) => {
        reject(new Error(`Streaming analysis failed: ${error.message}`));
      });

      parser.on('end', () => {
        // Convert to the expected format
        const elementCounts: Record<string, number> = {};
        const attributeCounts: Record<string, number> = {};
        const commonElements: Array<{ name: string; count: number }> = [];
        const attributes: Array<{ name: string; count: number }> = [];

        structure.elementTypes.forEach((info, name) => {
          elementCounts[name] = info.count;
          info.attributes.forEach((attr) => {
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

        structure.elementCounts = elementCounts;
        structure.attributeCounts = attributeCounts;
        structure.commonElements = commonElements;
        structure.attributes = attributes;

        if (verbose) {
          console.log(
            `✅ Streaming analysis complete: ${structure.totalElements} elements, max depth: ${structure.maxDepth}`
          );
          console.log(
            `📊 Element types: ${Array.from(structure.elementTypes.keys()).join(
              ', '
            )}`
          );
        }

        resolve(structure);
      });

      const stream = createReadStream(filePath, { encoding: 'utf8' });
      stream.pipe(parser);
    });
  }

  /**
   * Validate XML against XSD (Node.js-specific)
   */
  async validateXML(
    xmlPath: string,
    xsdPath: string,
    options: ValidationOptions = {}
  ): Promise<XMLValidationResult> {
    try {
      const xmlContent = readFileSync(xmlPath, 'utf8');
      const xsdContent = readFileSync(xsdPath, 'utf8');

      // Try xmllint-wasm first for comprehensive validation
      try {
        const result = await validateXML({
          xml: [
            {
              fileName: xmlPath,
              contents: xmlContent,
            },
          ],
          schema: [xsdContent],
          initialMemoryPages: 256,
          maxMemoryPages: 2 * memoryPages.GiB,
        });

        return {
          valid: result.valid,
          errors: Array.from(result.errors).map(
            (error) => error.message || String(error)
          ),
          warnings: (result as any).warnings
            ? Array.from((result as any).warnings).map(
                (w: any) => w.message || String(w)
              )
            : [],
        };
      } catch (wasmError) {
        // If WASM fails, fall back to basic validation
        return this.performBasicValidationWithXSD(xmlContent, xsdContent);
      }
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
      };
    }
  }

  /**
   * Perform basic XML validation without WASM
   */
  private performBasicValidationWithXSD(
    xmlContent: string,
    xsdContent: string
  ): XMLValidationResult {
    try {
      // Basic validation - try to parse both XML and XSD
      fromXml(xmlContent);
      fromXml(xsdContent);
      return {
        valid: true,
        errors: [],
        warnings: [
          'Basic validation only - use xmllint-wasm for comprehensive validation',
        ],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Invalid XML or XSD'],
        warnings: [],
      };
    }
  }

  /**
   * Generate realistic sample from XML file (Node.js-specific)
   */
  /**
   * Generate realistic sample from XML file (Node.js-specific)
   */
  async generateRealisticSample(
    filePath: string,
    options: XMLFakerOptions = {}
  ): Promise<string> {
    const structure = await this.analyzeStructure(filePath);
    const fakerGenerator = new XMLFakerGenerator(options);
    return fakerGenerator.generateXMLFromStructure(structure, options);
  }

  /**
   * Generate sample XML from XSD
   */
  async generateXMLFromXSD(
    xsdPath: string,
    options: XMLFromXSDOptions = {}
  ): Promise<string> {
    const xsdContent = readFileSync(xsdPath, 'utf8');
    const structure = this.parseXSDStructure(xsdContent);
    return this.generateXMLFromStructure(structure, options);
  }

  /**
   * Generate sample XML from XSD using Faker for realistic data
   */
  async generateXMLFromXSDWithFaker(
    xsdPath: string,
    options: XMLFakerOptions = {}
  ): Promise<string> {
    const xsdContent = readFileSync(xsdPath, 'utf8');
    const fakerGenerator = new XMLFakerGenerator(options);
    return fakerGenerator.generateXMLFromXSD(xsdContent, options);
  }

  /**
   * XML -> XAST -> XML roundtrip
   */
  async xmlToXASTToXML(filePath: string): Promise<string> {
    const xmlContent = readFileSync(filePath, 'utf8');
    const xast = this.parseXMLToXAST(xmlContent);
    const result = toXml(xast);

    // Ensure the result starts with XML declaration
    if (!result.startsWith('<?xml')) {
      return '<?xml version="1.0" encoding="UTF-8"?>\n' + result;
    }

    return result;
  }

  /**
   * XML -> XAST -> XML roundtrip using xast-util libraries
   */
  async xmlToXASTToXMLEnhanced(filePath: string): Promise<string> {
    const xmlContent = readFileSync(filePath, 'utf8');
    const fakerGenerator = new XMLFakerGenerator();
    return fakerGenerator.xmlToXASTToXML(xmlContent);
  }

  /**
   * Transform big XML into small XML for testing
   */
  async transformBigToSmall(
    inputFile: string,
    outputFile: string,
    options: XMLTransformationOptions
  ): Promise<void> {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Transform timeout after 45 seconds')),
        45000
      );
    });

    const transformPromise = (async () => {
      const sample = await this.generateSample(inputFile, {
        maxElements: options.maxElements || 100,
        strategy: options.samplingStrategy || SamplingStrategy.BALANCED,
        preserveAllTypes: options.preserveStructure || true,
      });

      writeFileSync(outputFile, sample);
    })();

    return Promise.race([transformPromise, timeoutPromise]);
  }

  /**
   * Transform small XML into big XML for testing
   */
  async transformSmallToBig(
    inputFile: string,
    outputFile: string,
    targetSize: number
  ): Promise<void> {
    const structure = await this.analyzeStructure(inputFile);
    const rules = this.identifyPatternsAndRules(structure);
    const expandedXML = this.generateExpandedXML(structure, rules, targetSize);

    writeFileSync(outputFile, expandedXML);
  }

  /**
   * Generate a sample XML file from the input file
   */
  async generateSample(
    filePath: string,
    options: SamplingOptions = {}
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
      const structure = await this.analyzeStructure(filePath);

      // Generate sample based on strategy
      const sampleElements = this.selectSampleElements(
        structure,
        mergedOptions
      );

      // Build the sample XML
      return this.buildSampleXML(sampleElements, structure, mergedOptions);
    })();

    return Promise.race([samplePromise, timeoutPromise]);
  }

  /**
   * Find elements by tag name using unist-util-filter
   */
  async findElementsByTag(
    filePath: string,
    tagName: string
  ): Promise<XMLElement[]> {
    const xmlContent = readFileSync(filePath, 'utf8');
    const xast = fromXml(xmlContent);

    // Use unist-util-filter to find elements with specific tag names
    const filteredNodes = filter(
      xast,
      (node) => node.type === 'element' && (node as any).name === tagName
    );

    if (!filteredNodes) return [];

    // Convert filtered nodes to XMLElement format
    const elements: XMLElement[] = [];
    visit(filteredNodes, 'element', (node) => {
      const xastElement = node as XASTElement;
      elements.push({
        tagName: xastElement.name,
        attributes: Object.fromEntries(
          Object.entries(xastElement.attributes ?? {}).map(([key, value]) => [key, String(value ?? '')])
        ),
        children: [],
        depth: 0, // Would need proper depth calculation
        parent: undefined,
      });
    });

    return elements;
  }

  /**
   * Count elements by type using unist-util-size
   */
  async countElementsByType(filePath: string): Promise<Map<string, number>> {
    const xmlContent = readFileSync(filePath, 'utf8');
    const xast = fromXml(xmlContent);

    const counts = new Map<string, number>();

    // Use unist-util-visit to count elements by type
    visit(xast, 'element', (node) => {
      const tagName = (node as any).name;
      if (tagName) {
        counts.set(tagName, (counts.get(tagName) || 0) + 1);
      }
    });

    return counts;
  }

  /**
   * Transform XML structure using unist-util-map
   */
  async transformXMLStructure(
    filePath: string,
    transformFn: (node: any) => any
  ): Promise<string> {
    const xmlContent = readFileSync(filePath, 'utf8');
    const xast = fromXml(xmlContent);

    // Use unist-util-map to transform the tree
    const transformedXast = map(xast, transformFn);

    return toXml(transformedXast);
  }

  /**
   * Example transformation: Convert element names to uppercase
   */
  async transformToUppercase(filePath: string): Promise<string> {
    return this.transformXMLStructure(filePath, (node) => {
      if (node.type === 'element' && node.name) {
        return { ...node, name: node.name.toUpperCase() };
      }
      return node;
    });
  }

  /**
   * Find the first element matching a condition using unist-util-find
   */
  async findFirstElement(
    filePath: string,
    condition: (node: any) => boolean
  ): Promise<XMLElement | null> {
    const xmlContent = readFileSync(filePath, 'utf8');
    const xast = fromXml(xmlContent);

    // Use unist-util-find to locate the first matching element
    const foundNode = find(xast, condition);

    if (foundNode && foundNode.type === 'element') {
      const xastElement = foundNode as XASTElement;
      return {
        tagName: xastElement.name,
        attributes: Object.fromEntries(
          Object.entries(xastElement.attributes ?? {}).map(([key, value]) => [key, String(value ?? '')])
        ),
        children: [],
        depth: 0, // Would need proper depth calculation
        parent: undefined,
      };
    }

    return null;
  }

  /**
   * Find element with specific attribute value
   */
  async findElementByAttribute(
    filePath: string,
    attrName: string,
    attrValue: string
  ): Promise<XMLElement | null> {
    return this.findFirstElement(
      filePath,
      (node) =>
        node.type === 'element' &&
        node.attributes &&
        node.attributes[attrName] === attrValue
    );
  }

  /**
   * Generate XML programmatically using xastscript
   */
  async generateXMLProgrammatically(
    template: Record<string, any>
  ): Promise<string> {
    const { x } = require('xastscript');

    // Build XML structure using xastscript
    const rootElement = x('root', template);

    return toXml(rootElement);
  }

  /**
   * Generate sample XML with specific structure using xastscript
   */
  async generateSampleXMLWithStructure(structure: {
    rootName: string;
    elements: Array<{
      name: string;
      attributes?: Record<string, string>;
      children?: string[];
    }>;
  }): Promise<string> {
    const { x } = require('xastscript');

    const children = structure.elements.map((element) => {
      if (element.children && element.children.length > 0) {
        return x(
          element.name,
          element.attributes || {},
          element.children.map((child) => x(child))
        );
      }
      return x(element.name, element.attributes || {}, []);
    });

    const rootElement = x(structure.rootName, {}, children);

    return toXml(rootElement);
  }

  /**
   * Generate realistic expanded XML using Faker for data generation
   */
  async generateRealisticExpandedXML(
    filePath: string,
    targetSize: number,
    options: XMLFakerOptions = {}
  ): Promise<string> {
    const structure = await this.analyzeStructure(filePath);
    const rules = this.identifyPatternsAndRules(structure);

    const fakerGenerator = new XMLFakerGenerator({
      ...options,
      maxChildren: Math.ceil(targetSize / rules.length),
      realisticData: true,
    });

    return fakerGenerator.generateXMLFromStructure(structure, options);
  }

  // Private helper methods from XMLIntrospector
  private parseXMLToXAST(xmlContent: string): XASTNode[] {
    try {
      const xast = fromXml(xmlContent);
      return this.parseXMLBasic(xmlContent);
    } catch (error) {
      console.warn(
        'Failed to parse XML with fromXml, falling back to basic parsing'
      );
      return this.parseXMLBasic(xmlContent);
    }
  }

  private parseXMLBasic(xmlContent: string): XASTNode[] {
    const lines = xmlContent.split('\n');
    const nodes: XASTNode[] = [];
    const stack: XASTElement[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (
        trimmedLine.startsWith('<?xml') ||
        trimmedLine.startsWith('<!DOCTYPE')
      ) {
        continue;
      }

      if (trimmedLine.startsWith('</')) {
        // Closing tag
        if (stack.length > 0) {
          stack.pop();
        }
        continue;
      }

      if (trimmedLine.startsWith('<') && !trimmedLine.startsWith('<!--')) {
        // Check if it's a self-closing tag
        if (trimmedLine.endsWith('/>')) {
          const tagMatch = trimmedLine.match(/<(\w+)([^>]*)\/>/);
          if (tagMatch) {
            const tagName = tagMatch[1];
            const attributes = this.parseAttributes(tagMatch[2]);

            const element: XASTElement = {
              type: 'element',
              name: tagName,
              attributes,
              children: [],
            };

            if (stack.length > 0) {
              stack[stack.length - 1]!.children.push(element);
            } else {
              nodes.push(element);
            }
          }
        } else if (trimmedLine.includes('</')) {
          // Check if this line has both opening and closing tags
          const fullTagMatch = trimmedLine.match(/<(\w+)([^>]*)>([^<]*)<\/\1>/);
          if (fullTagMatch) {
            const [, tagName, attributes, textContent] = fullTagMatch;
            const element: XASTElement = {
              type: 'element',
              name: tagName,
              attributes: this.parseAttributes(attributes),
              children: [],
            };

            // Add text content as child
            if (textContent.trim()) {
              const textNode: XASTText = {
                type: 'text',
                value: textContent.trim(),
              };
              element.children.push(textNode);
            }

            if (stack.length > 0) {
              stack[stack.length - 1]!.children.push(element);
            } else {
              nodes.push(element);
            }
          }
        } else {
          // Opening tag
          const tagMatch = trimmedLine.match(/<(\w+)([^>]*)>/);
          if (tagMatch) {
            const tagName = tagMatch[1];
            const attributes = this.parseAttributes(tagMatch[2]);

            const element: XASTElement = {
              type: 'element',
              name: tagName,
              attributes,
              children: [],
            };

            if (stack.length > 0) {
              stack[stack.length - 1]!.children.push(element);
            } else {
              nodes.push(element);
            }

            stack.push(element);
          }
        }
      } else if (trimmedLine && !trimmedLine.startsWith('<!--')) {
        // Text content
        const textContent = trimmedLine.trim();
        if (textContent && stack.length > 0) {
          const textNode: XASTText = {
            type: 'text',
            value: textContent,
          };
          stack[stack.length - 1]!.children.push(textNode);
        }
      }
    }

    return nodes;
  }

  private parseXSDStructure(xsdContent: string): NodeXMLStructure {
    const elementTypes = new Map<string, ElementTypeInfo>();
    const namespaces = new Map<string, string>();

    // Extract element names from XSD
    const elementMatches = xsdContent.match(/<xs:element\s+name="([^"]+)"/g);
    if (elementMatches) {
      for (const match of elementMatches) {
        const nameMatch = match.match(/name="([^"]+)"/);
        if (nameMatch) {
          const elementName = nameMatch[1];
          elementTypes.set(elementName, {
            count: 0,
            attributes: new Set(),
            children: new Set(),
            maxDepth: 0,
            examples: [],
          });
        }
      }
    }

    // Convert to elementCounts format
    const elementCounts: Record<string, number> = {};
    elementTypes.forEach((_, name) => {
      elementCounts[name] = 0;
    });

    return {
      elementCounts,
      attributeCounts: {},
      rootElements: ['root'],
      commonElements: [],
      attributes: [],
      rootElement: 'root',
      elementTypes,
      maxDepth: 3,
      totalElements: elementTypes.size,
      namespaces,
    };
  }

  private generateXMLFromStructure(
    structure: NodeXMLStructure,
    options: XMLFromXSDOptions
  ): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<${structure.rootElement}>\n`;

    const maxElements = options.maxElements || 100;
    let elementCount = 0;

    for (const [elementName, typeInfo] of Array.from(
      structure.elementTypes.entries()
    )) {
      if (elementCount >= maxElements) break;

      const count = Math.min(
        3,
        Math.ceil(maxElements / structure.elementTypes.size)
      );

      for (let i = 0; i < count; i++) {
        xml += `  <${elementName}`;

        // Add attributes if we have examples
        if (typeInfo.examples.length > 0) {
          const example = typeInfo.examples[0];
          for (const [attrName, attrValue] of Object.entries(
            example.attributes
          )) {
            xml += ` ${attrName}="${attrValue}"`;
          }
        }

        xml += '>';

        if (options.generateRealisticData) {
          xml += `Sample ${elementName} ${i + 1}`;
        }

        xml += `</${elementName}>\n`;
        elementCount++;
      }
    }

    xml += `</${structure.rootElement}>`;
    return xml;
  }
  private identifyPatternsAndRules(structure: NodeXMLStructure): PatternRule[] {
    const rules: PatternRule[] = [];

    for (const [elementName, typeInfo] of Array.from(
      structure.elementTypes.entries()
    )) {
      const rule: PatternRule = {
        elementName,
        attributes: Array.from(typeInfo.attributes),
        children: Array.from(typeInfo.children),
        minOccurrences: 0,
        maxOccurrences: -1, // Always allow unbounded expansion for transformSmallToBig
        constraints: [],
      };

      // Add attribute constraints
      for (const attr of Array.from(typeInfo.attributes)) {
        rule.constraints.push({
          type: 'attribute',
          name: attr,
          required: false, // Could be enhanced to detect required attributes
        });
      }

      // Add child constraints
      for (const child of Array.from(typeInfo.children)) {
        rule.constraints.push({
          type: 'child',
          name: child,
          required: false,
        });
      }

      rules.push(rule);
    }

    return rules;
  }

  private generateExpandedXML(
    structure: NodeXMLStructure,
    rules: PatternRule[],
    targetSize: number
  ): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<${structure.rootElement}>\n`;

    const elementsPerRule = Math.ceil(targetSize / rules.length);

    for (const rule of rules) {
      const count = Math.min(
        elementsPerRule,
        rule.maxOccurrences === -1 ? elementsPerRule : rule.maxOccurrences
      );

      for (let i = 0; i < count; i++) {
        xml += `  <${rule.elementName}`;

        // Add attributes
        for (const attr of rule.attributes) {
          xml += ` ${attr}="value${i}"`;
        }

        xml += '>';

        // Add children
        for (const child of rule.children) {
          xml += `\n    <${child}>child${i}</${child}>`;
        }

        if (rule.children.length > 0) {
          xml += '\n  ';
        }

        xml += `</${rule.elementName}>\n`;
      }
    }

    xml += `</${structure.rootElement}>`;
    return xml;
  }

  private selectSampleElements(
    structure: NodeXMLStructure,
    options: SamplingOptions
  ): XMLElement[] {
    const { maxElements = 100, strategy, preserveAllTypes } = options;
    const sampleElements: XMLElement[] = [];
    const referencedIds = new Set<string>();

    // Safety limit to prevent excessive processing
    const maxTotalElements = Math.min(maxElements * 10, 10000);
    let totalProcessed = 0;

    if (preserveAllTypes) {
      // Always include at least one of each element type to preserve structure
      for (const [tagName, typeInfo] of Array.from(
        structure.elementTypes.entries()
      )) {
        if (totalProcessed >= maxTotalElements) break;

        if (typeInfo.examples.length > 0) {
          // Choose a diverse example - prefer ones with different attributes or content
          let bestExample = typeInfo.examples[0];
          let bestScore = 0;

          for (let i = 0; i < typeInfo.examples.length; i++) {
            const example = typeInfo.examples[i];
            const score =
              example.children.length +
              Object.keys(example.attributes).length +
              (example.textContent ? 1 : 0);

            // Prefer examples that are different from what we already have
            const isDuplicate = sampleElements.some(
              (existing) =>
                existing.tagName === example.tagName &&
                existing.attributes.id === example.attributes.id
            );

            if (!isDuplicate && score > bestScore) {
              bestExample = example;
              bestScore = score;
            }
          }

          // Add the best example
          sampleElements.push(bestExample);
          totalProcessed++;

          // Collect all referenced IDs from this example
          this.collectReferencedIds(bestExample, referencedIds);
        }
      }
    }

    // Select additional elements based on strategy, but ensure we don't exceed maxElements
    const remainingElements = Math.max(0, maxElements - sampleElements.length);

    if (remainingElements > 0) {
      if (strategy === SamplingStrategy.BALANCED) {
        this.selectBalancedElements(
          structure,
          remainingElements,
          sampleElements,
          maxTotalElements,
          totalProcessed,
          referencedIds
        );
      } else if (strategy === SamplingStrategy.RANDOM) {
        this.selectRandomElements(
          structure,
          remainingElements,
          sampleElements,
          maxTotalElements,
          totalProcessed,
          referencedIds
        );
      } else {
        this.selectFirstElements(
          structure,
          remainingElements,
          sampleElements,
          maxTotalElements,
          totalProcessed,
          referencedIds
        );
      }
    }

    // Ensure all referenced elements are included
    this.includeReferencedElements(
      structure,
      sampleElements,
      referencedIds,
      maxElements
    );

    // Sort elements by depth to maintain proper structure
    sampleElements.sort((a, b) => a.depth - b.depth);

    return sampleElements;
  }

  private collectReferencedIds(
    element: XMLElement,
    referencedIds: Set<string>
  ): void {
    // Collect IDs from attributes that reference other elements
    for (const [key, value] of Object.entries(element.attributes)) {
      if (key === 'synset' || key === 'target' || key === 'members') {
        referencedIds.add(value);
      }
    }

    // Recursively collect from children
    for (const child of element.children) {
      this.collectReferencedIds(child, referencedIds);
    }
  }

  private includeReferencedElements(
    structure: NodeXMLStructure,
    sampleElements: XMLElement[],
    referencedIds: Set<string>,
    maxElements: number
  ): void {
    // Find and include elements that are referenced but not yet in the sample
    for (const referencedId of Array.from(referencedIds)) {
      if (sampleElements.length >= maxElements) break;

      // Find the element with this ID
      for (const [tagName, typeInfo] of Array.from(
        structure.elementTypes.entries()
      )) {
        for (const example of typeInfo.examples) {
          if (
            example.attributes.id === referencedId &&
            !sampleElements.some(
              (existing) => existing.attributes.id === referencedId
            )
          ) {
            // Ensure the element has required children for WordNet structure
            const enhancedElement = this.enhanceElementForWordNet(
              example,
              tagName
            );
            sampleElements.push(enhancedElement);
            break;
          }
        }
      }
    }
  }

  private enhanceElementForWordNet(
    element: XMLElement,
    tagName: string
  ): XMLElement {
    const enhanced = { ...element };

    // Add required children based on element type
    if (tagName === 'Synset') {
      // Synset must have Definition, and optionally ILIDefinition, SynsetRelation, Example
      if (!enhanced.children.some((c) => c.tagName === 'Definition')) {
        enhanced.children.push({
          tagName: 'Definition',
          attributes: {},
          children: [],
          depth: enhanced.depth + 1,
          parent: enhanced,
          textContent: 'Sample definition for ' + enhanced.attributes.id,
        });
      }

      // Add ILIDefinition if missing
      if (!enhanced.children.some((c) => c.tagName === 'ILIDefinition')) {
        enhanced.children.push({
          tagName: 'ILIDefinition',
          attributes: {},
          children: [],
          depth: enhanced.depth + 1,
          parent: enhanced,
          textContent: 'Sample ILI definition',
        });
      }
    }

    if (tagName === 'LexicalEntry') {
      // LexicalEntry must have Lemma, and optionally Form, Sense, SyntacticBehaviour
      if (!enhanced.children.some((c) => c.tagName === 'Lemma')) {
        enhanced.children.push({
          tagName: 'Lemma',
          attributes: {
            writtenForm: 'sample',
            partOfSpeech: 'n',
          },
          children: [],
          depth: enhanced.depth + 1,
          parent: enhanced,
        });
      }

      // Add Sense if missing
      if (!enhanced.children.some((c) => c.tagName === 'Sense')) {
        enhanced.children.push({
          tagName: 'Sense',
          attributes: {
            id: enhanced.attributes.id + '-1',
            synset: 'oewn-00000000-n',
          },
          children: [],
          depth: enhanced.depth + 1,
          parent: enhanced,
        });
      }

      // Add Form if missing
      if (!enhanced.children.some((c) => c.tagName === 'Form')) {
        enhanced.children.push({
          tagName: 'Form',
          attributes: {
            writtenForm: 'sample',
          },
          children: [],
          depth: enhanced.depth + 1,
          parent: enhanced,
        });
      }
    }

    // Ensure all elements have proper feat attributes for WordNet
    if (
      tagName === 'LexicalEntry' ||
      tagName === 'Synset' ||
      tagName === 'Sense'
    ) {
      // Add feat elements for required attributes
      const requiredFeats = ['dc:type', 'dc:source'];
      for (const featName of requiredFeats) {
        if (
          !enhanced.children.some(
            (c) => c.tagName === 'feat' && c.attributes.att === featName
          )
        ) {
          enhanced.children.push({
            tagName: 'feat',
            attributes: {
              att: featName,
              val: 'sample',
            },
            children: [],
            depth: enhanced.depth + 1,
            parent: enhanced,
          });
        }
      }
    }

    return enhanced;
  }

  private selectBalancedElements(
    structure: NodeXMLStructure,
    count: number,
    sampleElements: XMLElement[],
    maxTotalElements: number,
    totalProcessed: number,
    referencedIds: Set<string>
  ): void {
    const elementTypes = Array.from(structure.elementTypes.entries());
    const elementsPerType = Math.floor(count / elementTypes.length);

    for (const [tagName, typeInfo] of elementTypes) {
      if (totalProcessed >= maxTotalElements) break;
      const examples = typeInfo.examples.slice(0, elementsPerType);
      sampleElements.push(...examples);
      totalProcessed += examples.length;
    }
  }

  private selectRandomElements(
    structure: NodeXMLStructure,
    count: number,
    sampleElements: XMLElement[],
    maxTotalElements: number,
    totalProcessed: number,
    referencedIds: Set<string>
  ): void {
    const allExamples: XMLElement[] = [];
    for (const typeInfo of Array.from(structure.elementTypes.values())) {
      allExamples.push(...typeInfo.examples);
    }

    const shuffled = allExamples.sort(() => Math.random() - 0.5);
    for (const example of shuffled) {
      if (totalProcessed >= maxTotalElements) break;
      sampleElements.push(example);
      totalProcessed++;
    }
  }

  private selectFirstElements(
    structure: NodeXMLStructure,
    count: number,
    sampleElements: XMLElement[],
    maxTotalElements: number,
    totalProcessed: number,
    referencedIds: Set<string>
  ): void {
    let added = 0;
    for (const typeInfo of Array.from(structure.elementTypes.values())) {
      if (totalProcessed >= maxTotalElements) break;
      for (const example of typeInfo.examples) {
        if (added >= count) break;
        sampleElements.push(example);
        totalProcessed++;
        added++;
      }
    }
  }

  private buildSampleXML(
    elements: XMLElement[],
    structure: NodeXMLStructure,
    options: SamplingOptions
  ): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';

    if (structure.rootElement) {
      xml += `<!DOCTYPE ${structure.rootElement} SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.3.dtd">\n`;
    }

    // Start with root element
    xml += `<${structure.rootElement}`;

    // Add namespace attributes if present
    for (const [key, value] of Array.from(
      (structure.namespaces as Map<string, string>).entries()
    )) {
      xml += ` ${key}="${value}"`;
    }
    xml += '>\n';

    // Add GlobalInformation if this is a WordNet-like structure
    if (structure.rootElement === 'LexicalResource') {
      xml += this.generateGlobalInformation();
    }

    const maxElements = options.maxElements || 100;
    let totalElementCount = 0;

    // Group elements by type for better structure
    const elementsByType = new Map<string, XMLElement[]>();
    for (const element of elements) {
      if (element.tagName === structure.rootElement) continue; // Skip root element

      if (!elementsByType.has(element.tagName)) {
        elementsByType.set(element.tagName, []);
      }
      elementsByType.get(element.tagName)!.push(element);
    }

    // Start with Lexicon if this is a WordNet structure
    if (
      structure.rootElement === 'LexicalResource' &&
      elementsByType.has('Lexicon')
    ) {
      const lexiconElements = elementsByType.get('Lexicon')!;
      if (lexiconElements.length > 0) {
        const lexicon = lexiconElements[0];
        xml += this.elementToXMLWithLimit(
          lexicon,
          options,
          maxElements,
          totalElementCount
        ).xml;
        totalElementCount++;
        elementsByType.delete('Lexicon'); // Remove from remaining elements
      }
    }

    // Add remaining elements in proper order
    const elementOrder = [
      'LexicalEntry',
      'Synset',
      'Sense',
      'Lemma',
      'Form',
      'Definition',
      'ILIDefinition',
    ];
    for (const tagName of elementOrder) {
      if (totalElementCount >= maxElements) break;

      const typeElements = elementsByType.get(tagName);
      if (typeElements) {
        for (const element of typeElements) {
          if (totalElementCount >= maxElements) break;

          // Adjust depth to be child of Lexicon when inside LexicalResource
          const adjustedElement = { ...element };
          if (structure.rootElement === 'LexicalResource') {
            adjustedElement.depth = 2; // Make it child of Lexicon (which is child of LexicalResource)
          } else {
            adjustedElement.depth = 1; // Make it child of root
          }

          const elementXML = this.elementToXMLWithLimit(
            adjustedElement,
            options,
            maxElements,
            totalElementCount
          );
          xml += elementXML.xml;
          totalElementCount = elementXML.count;
        }
        elementsByType.delete(tagName);
      }
    }

    // Add any remaining elements
    for (const [tagName, typeElements] of elementsByType) {
      if (totalElementCount >= maxElements) break;

      for (const element of typeElements) {
        if (totalElementCount >= maxElements) break;

        const elementXML = this.elementToXMLWithLimit(
          element,
          options,
          maxElements,
          totalElementCount
        );
        xml += elementXML.xml;
        totalElementCount = elementXML.count;
      }
    }

    // Close Lexicon if we opened it
    if (structure.rootElement === 'LexicalResource') {
      xml += '  </Lexicon>\n';
    }

    // Close root element
    xml += `</${structure.rootElement}>\n`;

    return xml;
  }

  private generateGlobalInformation(): string {
    return `  <GlobalInformation>
    <label>Open English WordNet</label>
    <dc:title>Open English WordNet</dc:title>
    <dc:description>Open English WordNet is a large lexical database of English</dc:description>
    <dc:creator>Open English WordNet</dc:creator>
    <dc:contributor>Princeton University</dc:contributor>
    <dc:date>2023</dc:date>
    <dc:format>WN-LMF 1.3</dc:format>
    <dc:language>en</dc:language>
    <dc:identifier>oewn</dc:identifier>
    <dc:version>2023</dc:version>
    <dc:license>https://creativecommons.org/licenses/by/4.0/</dc:license>
  </GlobalInformation>
  
  <Lexicon id="oewn" label="Open English WordNet" language="en" email="wordnet@princeton.edu" license="https://creativecommons.org/licenses/by/4.0/">
`;
  }

  private elementToXMLWithLimit(
    element: XMLElement,
    options: SamplingOptions,
    maxElements: number,
    currentCount: number
  ): { xml: string; count: number } {
    if (currentCount >= maxElements) {
      return { xml: '', count: currentCount };
    }

    let xml = '';
    const indent = '  '.repeat(element.depth);

    // Opening tag
    xml += `${indent}<${element.tagName}`;

    // Add attributes
    for (const [key, value] of Object.entries(element.attributes)) {
      xml += ` ${key}="${value}"`;
    }

    if (element.children.length === 0 && !element.textContent) {
      // Self-closing tag
      xml += '/>\n';
      return { xml, count: currentCount + 1 };
    }

    xml += '>';

    // Add text content
    if (element.textContent) {
      xml += element.textContent;
    }

    // Add children
    if (element.children.length > 0) {
      xml += '\n';
      let childCount = currentCount + 1;

      for (const child of element.children) {
        if (childCount >= maxElements) break;

        const childResult = this.elementToXMLWithLimit(
          child,
          options,
          maxElements,
          childCount
        );
        xml += childResult.xml;
        childCount = childResult.count;
      }

      xml += `${indent}`;
    }

    // Closing tag
    xml += `</${element.tagName}>\n`;

    return { xml, count: currentCount + 1 };
  }

  private parseAttributes(attrString: string): Record<string, string> {
    const attributes: Record<string, string> = {};

    if (!attrString.trim()) return attributes;

    // Simple attribute parsing - matches key="value" patterns
    const attrRegex = /(\w+)=["']([^"']*)["']/g;
    let match;

    while ((match = attrRegex.exec(attrString)) !== null) {
      attributes[match[1]] = match[2];
    }

    return attributes;
  }

  /**
   * Generate XSD AST from XSD content
   */
  generateXSDAST(xsdContent: string): { elements: Map<string, any>; rootElement: string } {
    const xast = fromXml(xsdContent);
    const elements = new Map<string, any>();
    let rootElement = '';

    const traverseNode = (node: any) => {
      if (node.type === 'element' && node.name) {
        const tagName = node.name.includes(':') ? node.name : node.name;
        if (!rootElement) rootElement = tagName;
        
        elements.set(tagName, {
          name: tagName,
          type: 'element',
          attributes: node.attributes ?? {},
          children: node.children?.filter((c: any) => c.type === 'element') || []
        });

        if (node.children) {
          for (const child of node.children) {
            traverseNode(child);
          }
        }
      }
    };

    if (Array.isArray(xast)) {
      for (const rootNode of xast) {
        traverseNode(rootNode);
      }
    } else if (xast && xast.children) {
      for (const child of xast.children) {
        traverseNode(child);
      }
    } else {
      traverseNode(xast);
    }

    return { elements, rootElement };
  }

  /**
   * Compare two XSD ASTs for structural similarity
   */
  compareXSDAST(ast1: { elements: Map<string, any>; rootElement: string }, ast2: { elements: Map<string, any>; rootElement: string }): {
    equal: boolean;
    elementDifferences: string[];
    attributeDifferences: string[];
    namespaceDifferences: string[];
    structuralDifferences: string[];
  } {
    const result = {
      equal: false,
      elementDifferences: [] as string[],
      attributeDifferences: [] as string[],
      namespaceDifferences: [] as string[],
      structuralDifferences: [] as string[]
    };

    // Check root elements
    if (ast1.rootElement !== ast2.rootElement) {
      result.structuralDifferences.push(`Root element mismatch: ${ast1.rootElement} vs ${ast2.rootElement}`);
    }

    const elements1 = Array.from(ast1.elements.keys());
    const elements2 = Array.from(ast2.elements.keys());
    
    // Find element differences
    const onlyIn1 = elements1.filter(el => !elements2.includes(el));
    const onlyIn2 = elements2.filter(el => !elements1.includes(el));
    
    result.elementDifferences.push(...onlyIn1.map(el => `Only in AST1: ${el}`));
    result.elementDifferences.push(...onlyIn2.map(el => `Only in AST2: ${el}`));

    // Check if both have similar element types (allowing for some variation)
    const commonElements = elements1.filter(el => elements2.includes(el));
    const similarity = commonElements.length / Math.max(elements1.length, elements2.length);
    
    result.equal = similarity > 0.7 && result.structuralDifferences.length === 0; // 70% similarity threshold
    
    return result;
  }
}
