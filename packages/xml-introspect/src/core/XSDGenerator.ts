/**
 * Shared XSD Generation Logic
 *
 * This module contains the core XSD generation functionality that can be used
 * by both Node.js and Browser implementations.
 * Uses XAST utilities for proper tree building and stringification.
 */

import type {
  XMLStructure,
  XSDFromXMLOptions,
  BrowserXSDFromXMLOptions,
} from './types/base.js';
import { x } from 'xastscript';
import { toXmlPretty } from './xast-util-to-xml-pretty.js';
import { visit } from 'unist-util-visit';
import { filter } from 'unist-util-filter';
import { map } from 'unist-util-map';
import { size } from 'unist-util-size';
import type {
  Node as XASTNode,
  Element as XASTElement,
  Root as XASTRoot,
} from 'xast';

export interface XSDGenerationOptions {
  targetNamespace?: string;
  elementForm?: 'qualified' | 'unqualified';
  attributeForm?: 'qualified' | 'unqualified';
}

/**
 * Generate XSD from XML structure using XAST utilities
 */
export function generateXSDFromStructure(
  structure: XMLStructure,
  options: XSDGenerationOptions = {}
): string {
  const targetNamespace =
    options.targetNamespace || 'http://example.com/schema';
  const elementForm = options.elementForm || 'qualified';
  const attributeForm = options.attributeForm || 'unqualified';

  // Build XSD schema using xastscript
  const xsdRoot = buildXSDSchema(structure, {
    targetNamespace,
    elementForm,
    attributeForm,
  });

  // Convert XAST tree to pretty-printed XML string
  return toXmlPretty(xsdRoot);
}

/**
 * Build XSD schema as XAST tree using xastscript
 */
function buildXSDSchema(
  structure: XMLStructure,
  options: {
    targetNamespace: string;
    elementForm: 'qualified' | 'unqualified';
    attributeForm: 'qualified' | 'unqualified';
  }
): XASTRoot {
  const { targetNamespace, elementForm, attributeForm } = options;

  // Create XML declaration as a processing instruction
  const xmlDeclaration = {
    type: 'instruction' as const,
    name: 'xml',
    value: 'version="1.0" encoding="UTF-8"',
  };

  // Build schema element with namespace declarations
  const schemaElement = x(
    'xs:schema',
    {
      'xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
      targetNamespace: targetNamespace,
      elementFormDefault: elementForm,
      attributeFormDefault: attributeForm,
    },
    [
      // Generate element declarations
      ...generateElementDeclarations(structure),

      // Generate complex type definitions
      ...generateComplexTypeDefinitions(structure),
    ]
  );

  return {
    type: 'root',
    children: [xmlDeclaration, schemaElement],
  };
}

/**
 * Generate XSD element declarations
 */
function generateElementDeclarations(structure: XMLStructure): XASTElement[] {
  return Object.keys(structure.elementCounts).map((elementName) =>
    x('xs:element', {
      name: elementName,
      type: `${elementName}Type`,
    })
  );
}

/**
 * Generate XSD complex type definitions
 */
function generateComplexTypeDefinitions(
  structure: XMLStructure
): XASTElement[] {
  return Object.keys(structure.elementCounts).map((elementName) => {
    const typeChildren: XASTElement[] = [];

    // Add sequence for child elements
    const childElements = getChildElements(structure, elementName);
    if (childElements.length > 0) {
      const sequenceChildren = childElements.map((childName) =>
        x('xs:element', {
          ref: childName,
          minOccurs: '0',
          maxOccurs: 'unbounded',
        })
      );

      typeChildren.push(x('xs:sequence', {}, sequenceChildren));
    }

    // Add attributes
    const attributes = getElementAttributes(structure, elementName);
    attributes.forEach((attrName) => {
      typeChildren.push(
        x('xs:attribute', {
          name: attrName,
          type: 'xs:string',
        })
      );
    });

    return x(
      'xs:complexType',
      {
        name: `${elementName}Type`,
      },
      typeChildren.length > 0 ? typeChildren : []
    );
  });
}

/**
 * Get child elements for a given element name
 */
function getChildElements(
  structure: XMLStructure,
  elementName: string
): string[] {
  if (structure.commonElements && Array.isArray(structure.commonElements)) {
    const elementInfo = structure.commonElements.find(
      (item) => item.name === elementName
    );
    if (elementInfo) {
      // Return a mock array of child names - this would need to be populated from actual structure analysis
      return [];
    }
  }
  return [];
}

/**
 * Get attributes for a given element name
 */
function getElementAttributes(
  structure: XMLStructure,
  elementName: string
): string[] {
  if (structure.attributes && Array.isArray(structure.attributes)) {
    const attributeInfo = structure.attributes.find(
      (item) => item.name === elementName
    );
    if (attributeInfo) {
      // Return a mock array of attribute names - this would need to be populated from actual structure analysis
      return [];
    }
  }
  return [];
}

/**
 * Convert Node.js XSDFromXMLOptions to shared options
 */
export function convertNodeXSDOptions(
  options: XSDFromXMLOptions
): XSDGenerationOptions {
  return {
    targetNamespace: options.targetNamespace,
    elementForm: options.elementForm,
    attributeForm: options.attributeForm,
  };
}

/**
 * Convert Browser XSDFromXMLOptions to shared options
 */
export function convertBrowserXSDOptions(
  options: BrowserXSDFromXMLOptions
): XSDGenerationOptions {
  return {
    targetNamespace: options.targetNamespace,
    elementForm: options.elementForm,
    attributeForm: options.attributeForm,
  };
}
