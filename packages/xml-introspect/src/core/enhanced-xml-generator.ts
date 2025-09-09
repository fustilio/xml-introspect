/**
 * Enhanced XML Generator using xastscript
 * 
 * This module demonstrates advanced usage of xastscript for XML generation
 * with proper TypeScript support and performance optimizations.
 */

import { x } from 'xastscript';
import type { Node as XASTNode, Element as XASTElement, Root as XASTRoot } from 'xast';

/**
 * XML generation options
 */
export interface XMLGenerationOptions {
  includeXMLDeclaration?: boolean;
  encoding?: string;
  version?: string;
  prettyPrint?: boolean;
  indentSize?: number;
  namespace?: string;
  namespacePrefix?: string;
  defaultAttributes?: Record<string, string>;
}

/**
 * Element definition for programmatic XML generation
 */
export interface ElementDefinition {
  name: string;
  attributes?: Record<string, string | number | boolean>;
  children?: (ElementDefinition | string)[];
  textContent?: string;
  namespace?: string;
}

/**
 * Schema-based XML generation options
 */
export interface SchemaBasedGenerationOptions extends XMLGenerationOptions {
  schema: {
    rootElement: string;
    elements: Map<string, ElementDefinition>;
    relationships: Map<string, string[]>; // parent -> children
    cardinality: Map<string, { min: number; max: number | 'unbounded' }>;
  };
  dataProvider?: (elementName: string) => any;
}

/**
 * Generate XML with advanced xastscript features
 */
export function generateXMLAdvanced(
  structure: ElementDefinition,
  options: XMLGenerationOptions = {}
): XASTRoot {
  const {
    includeXMLDeclaration = true,
    encoding = 'UTF-8',
    version = '1.0',
    namespace,
    namespacePrefix = 'ns',
    defaultAttributes = {}
  } = options;

  // Build namespace attributes
  const namespaceAttrs: Record<string, string> = {};
  if (namespace) {
    namespaceAttrs[`xmlns:${namespacePrefix}`] = namespace;
  }

  // Merge default attributes
  const mergedAttributes = { ...defaultAttributes, ...namespaceAttrs };

  // Generate the root element using xastscript
  const rootElement = buildElement(structure, namespacePrefix);

  // Create XML declaration if requested
  const children: XASTNode[] = [];
  
  if (includeXMLDeclaration) {
    children.push({
      type: 'instruction',
      name: 'xml',
      value: `version="${version}" encoding="${encoding}"`
    });
  }
  
  children.push(rootElement);

  return {
    type: 'root',
    children
  };
}

/**
 * Build an element using xastscript with proper type handling
 */
function buildElement(
  definition: ElementDefinition,
  namespacePrefix?: string
): XASTElement {
  const { name, attributes = {}, children = [], textContent, namespace } = definition;
  
  // Handle namespace prefix
  const elementName = namespace && namespacePrefix 
    ? `${namespacePrefix}:${name}` 
    : name;

  // Convert attributes to strings (xastscript requirement)
  const stringAttributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(attributes)) {
    stringAttributes[key] = String(value);
  }

  // Build children
  const elementChildren: XASTNode[] = [];
  
  // Add text content if present
  if (textContent) {
    elementChildren.push({
      type: 'text',
      value: textContent
    });
  }
  
  // Add child elements
  for (const child of children) {
    if (typeof child === 'string') {
      elementChildren.push({
        type: 'text',
        value: child
      });
    } else {
      elementChildren.push(buildElement(child, namespacePrefix));
    }
  }

  return x(elementName, stringAttributes, elementChildren);
}

/**
 * Generate XML from a schema definition
 * 
 * This demonstrates advanced xastscript usage for schema-based generation
 */
export function generateXMLFromSchema(
  options: SchemaBasedGenerationOptions
): XASTRoot {
  const { schema, dataProvider, ...xmlOptions } = options;
  
  // Get root element definition
  const rootDefinition = schema.elements.get(schema.rootElement);
  if (!rootDefinition) {
    throw new Error(`Root element '${schema.rootElement}' not found in schema`);
  }

  // Generate data for the root element
  const generatedRoot = generateElementWithData(
    rootDefinition,
    schema,
    dataProvider
  );

  return generateXMLAdvanced(generatedRoot, xmlOptions);
}

/**
 * Generate element with realistic data based on schema
 */
function generateElementWithData(
  definition: ElementDefinition,
  schema: SchemaBasedGenerationOptions['schema'],
  dataProvider?: (elementName: string) => any
): ElementDefinition {
  const { name, children = [], ...rest } = definition;
  
  // Get cardinality for this element
  const cardinality = schema.cardinality.get(name) || { min: 1, max: 1 };
  
  // Generate children based on relationships and cardinality
  const generatedChildren: (ElementDefinition | string)[] = [];
  
  if (children.length > 0) {
    // Use provided children structure
    generatedChildren.push(...children);
  } else {
    // Generate children based on schema relationships
    const childNames = schema.relationships.get(name) || [];
    
    for (const childName of childNames) {
      const childDefinition = schema.elements.get(childName);
      if (!childDefinition) continue;
      
      const childCardinality = schema.cardinality.get(childName) || { min: 1, max: 1 };
      const count = generateCount(childCardinality);
      
      for (let i = 0; i < count; i++) {
        const generatedChild = generateElementWithData(
          childDefinition,
          schema,
          dataProvider
        );
        generatedChildren.push(generatedChild);
      }
    }
  }

  // Generate realistic data if data provider is available
  let textContent = definition.textContent;
  if (!textContent && dataProvider) {
    const data = dataProvider(name);
    if (typeof data === 'string') {
      textContent = data;
    } else if (data && typeof data === 'object') {
      // Handle complex data objects
      textContent = JSON.stringify(data);
    }
  }

  return {
    ...rest,
    name,
    children: generatedChildren,
    textContent
  };
}

/**
 * Generate count based on cardinality
 */
function generateCount(cardinality: { min: number; max: number | 'unbounded' }): number {
  const { min, max } = cardinality;
  
  if (max === 'unbounded') {
    // For unbounded, generate between min and min + 5
    return min + Math.floor(Math.random() * 6);
  }
  
  if (min === max) {
    return min;
  }
  
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Generate WordNet-style XML using xastscript
 * 
 * Demonstrates complex XML generation with proper structure
 */
export function generateWordNetXML(
  options: {
    lexicalEntries?: number;
    synsets?: number;
    includeDefinitions?: boolean;
    language?: string;
    version?: string;
  } = {}
): XASTRoot {
  const {
    lexicalEntries = 3,
    synsets = 2,
    includeDefinitions = true,
    language = 'en',
    version = '1.4'
  } = options;

  // Generate lexical entries
  const generatedEntries: XASTElement[] = [];
  for (let i = 0; i < lexicalEntries; i++) {
    const entry = generateLexicalEntry(i, includeDefinitions);
    generatedEntries.push(entry);
  }

  // Generate synsets
  const generatedSynsets: XASTElement[] = [];
  for (let i = 0; i < synsets; i++) {
    const synset = generateSynset(i, includeDefinitions);
    generatedSynsets.push(synset);
  }

  // Build the complete WordNet structure using xastscript
  return x('LexicalResource', {
    'xmlns': 'https://globalwordnet.github.io/schemas/',
    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    'xsi:schemaLocation': 'https://globalwordnet.github.io/schemas/ https://globalwordnet.github.io/schemas/wn-lmf-1.4.xsd'
  }, [
    x('Lexicon', {
      id: 'sample-lexicon',
      language: language,
      version: version
    }, [
      ...generatedEntries,
      ...generatedSynsets
    ])
  ]);
}

/**
 * Generate a lexical entry using xastscript
 */
function generateLexicalEntry(index: number, includeDefinitions: boolean): XASTElement {
  const words = ['example', 'sample', 'test', 'demo', 'instance'];
  const word = words[index % words.length];
  
  const children: XASTElement[] = [
    x('Lemma', {
      writtenForm: word,
      partOfSpeech: 'n'
    })
  ];

  // Add sense if definitions are included
  if (includeDefinitions) {
    children.push(
      x('Sense', {
        id: `sense-${index}`,
        synset: `synset-${index}`
      })
    );
  }

  return x('LexicalEntry', {
    id: `entry-${index}`,
    pos: 'n'
  }, children);
}

/**
 * Generate a synset using xastscript
 */
function generateSynset(index: number, includeDefinitions: boolean): XASTElement {
  const children: XASTElement[] = [];
  
  if (includeDefinitions) {
    children.push(
      x('Definition', {
        language: 'en'
      }, `Definition for synset ${index}`)
    );
  }

  return x('Synset', {
    id: `synset-${index}`,
    ili: `i${index}`
  }, children);
}

/**
 * Generate XSD schema using xastscript
 * 
 * Demonstrates programmatic XSD generation with proper structure
 */
export function generateXSDSchema(
  elementDefinitions: Map<string, {
    attributes: string[];
    children: string[];
    type: 'simple' | 'complex';
  }>,
  options: {
    targetNamespace?: string;
    elementFormDefault?: 'qualified' | 'unqualified';
    attributeFormDefault?: 'qualified' | 'unqualified';
  } = {}
): XASTRoot {
  const {
    targetNamespace = 'http://example.com/schema',
    elementFormDefault = 'qualified',
    attributeFormDefault = 'unqualified'
  } = options;

  // Generate element declarations
  const elementDeclarations: XASTElement[] = [];
  for (const [elementName, definition] of elementDefinitions) {
    elementDeclarations.push(
      x('xs:element', {
        name: elementName,
        type: `${elementName}Type`
      })
    );
  }

  // Generate complex type definitions
  const typeDefinitions: XASTElement[] = [];
  for (const [elementName, definition] of elementDefinitions) {
    if (definition.type === 'complex') {
      const typeChildren: XASTElement[] = [];
      
      // Add sequence for child elements
      if (definition.children.length > 0) {
        const sequenceChildren = definition.children.map(childName =>
          x('xs:element', {
            ref: childName,
            minOccurs: '0',
            maxOccurs: 'unbounded'
          })
        );
        typeChildren.push(x('xs:sequence', {}, sequenceChildren));
      }
      
      // Add attributes
      for (const attrName of definition.attributes) {
        typeChildren.push(
          x('xs:attribute', {
            name: attrName,
            type: 'xs:string'
          })
        );
      }
      
      typeDefinitions.push(
        x('xs:complexType', {
          name: `${elementName}Type`
        }, typeChildren)
      );
    }
  }

  // Build complete XSD schema
  return x('xs:schema', {
    'xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
    targetNamespace: targetNamespace,
    elementFormDefault: elementFormDefault,
    attributeFormDefault: attributeFormDefault
  }, [
    ...elementDeclarations,
    ...typeDefinitions
  ]);
}

/**
 * Export all generators
 */
export const XMLGenerators = {
  generateXMLAdvanced,
  generateXMLFromSchema,
  generateWordNetXML,
  generateXSDSchema
};
