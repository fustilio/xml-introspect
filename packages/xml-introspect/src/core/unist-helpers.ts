/**
 * UNIST Utilities Helper Functions
 * 
 * This module provides composed utility functions that leverage UNIST utilities
 * for common XML processing patterns. These helpers demonstrate best practices
 * and provide reusable functionality.
 */

import { visit, SKIP } from 'unist-util-visit';
import { filter } from 'unist-util-filter';
import { find } from 'unist-util-find';
import { map } from 'unist-util-map';
import { size } from 'unist-util-size';
import { parents } from 'unist-util-parents';
import { x } from 'xastscript';
import type { Node as XASTNode, Element as XASTElement, Root as XASTRoot } from 'xast';

/**
 * Element analysis result
 */
export interface ElementAnalysis {
  totalElements: number;
  elementCounts: Map<string, number>;
  elementTypes: Set<string>;
  maxDepth: number;
  averageChildren: number;
  hasAttributes: number;
  hasTextContent: number;
}

/**
 * Element statistics for performance monitoring
 */
export interface ElementStatistics {
  processingTime: number;
  memoryUsage: number;
  elementsPerSecond: number;
}

/**
 * Advanced element filtering options
 */
export interface ElementFilterOptions {
  tagName?: string | RegExp;
  hasAttributes?: boolean;
  hasChildren?: boolean;
  hasTextContent?: boolean;
  minDepth?: number;
  maxDepth?: number;
  attributeFilter?: Record<string, string | RegExp>;
  customFilter?: (element: XASTElement) => boolean;
}

/**
 * XML transformation options
 */
export interface XMLTransformationOptions {
  transformTagNames?: (name: string) => string;
  transformAttributes?: (attrs: Record<string, string>) => Record<string, string>;
  addAttributes?: Record<string, string>;
  removeAttributes?: string[];
  transformTextContent?: (text: string) => string;
}

/**
 * Analyze XML structure using UNIST utilities
 * 
 * This function demonstrates proper composition of UNIST utilities
 * for comprehensive XML analysis.
 */
export function analyzeXMLStructure(xast: XASTRoot): ElementAnalysis {
  const startTime = performance.now();
  
  const elementCounts = new Map<string, number>();
  const elementTypes = new Set<string>();
  let maxDepth = 0;
  let totalChildren = 0;
  let hasAttributes = 0;
  let hasTextContent = 0;
  let totalElements = 0;

  // Use unist-util-visit for efficient traversal
  visit(xast, 'element', (node, index, parent) => {
    const element = node as XASTElement;
    totalElements++;
    
    // Count elements by type
    elementTypes.add(element.name);
    elementCounts.set(element.name, (elementCounts.get(element.name) || 0) + 1);
    
    // Calculate depth using unist-util-parents
    const elementWithParents = parents(xast, element);
    const depth = elementWithParents.length;
    maxDepth = Math.max(maxDepth, depth);
    
    // Count children
    if (element.children) {
      totalChildren += element.children.length;
    }
    
    // Check for attributes
    if (element.attributes && Object.keys(element.attributes).length > 0) {
      hasAttributes++;
    }
    
    // Check for text content
    if (element.children?.some(child => child.type === 'text')) {
      hasTextContent++;
    }
  });

  const processingTime = performance.now() - startTime;
  
  return {
    totalElements,
    elementCounts,
    elementTypes,
    maxDepth,
    averageChildren: totalElements > 0 ? totalChildren / totalElements : 0,
    hasAttributes,
    hasTextContent
  };
}

/**
 * Find elements using advanced filtering
 * 
 * Demonstrates proper use of unist-util-filter with complex conditions
 */
export function findElementsAdvanced(
  xast: XASTRoot, 
  options: ElementFilterOptions
): XASTRoot {
  return filter(xast, (node) => {
    if (node.type !== 'element') return false;
    
    const element = node as XASTElement;
    
    // Tag name filtering
    if (options.tagName) {
      if (typeof options.tagName === 'string') {
        if (element.name !== options.tagName) return false;
      } else {
        if (!options.tagName.test(element.name)) return false;
      }
    }
    
    // Attribute presence filtering
    if (options.hasAttributes !== undefined) {
      const hasAttrs = element.attributes && Object.keys(element.attributes).length > 0;
      if (hasAttrs !== options.hasAttributes) return false;
    }
    
    // Children presence filtering
    if (options.hasChildren !== undefined) {
      const hasChildren = element.children && element.children.length > 0;
      if (hasChildren !== options.hasChildren) return false;
    }
    
    // Text content filtering
    if (options.hasTextContent !== undefined) {
      const hasText = element.children?.some(child => child.type === 'text') || false;
      if (hasText !== options.hasTextContent) return false;
    }
    
    // Depth filtering
    if (options.minDepth !== undefined || options.maxDepth !== undefined) {
      const elementWithParents = parents(xast, element);
      const depth = elementWithParents.length;
      
      if (options.minDepth !== undefined && depth < options.minDepth) return false;
      if (options.maxDepth !== undefined && depth > options.maxDepth) return false;
    }
    
    // Attribute value filtering
    if (options.attributeFilter) {
      for (const [attrName, attrValue] of Object.entries(options.attributeFilter)) {
        const elementValue = element.attributes?.[attrName];
        if (!elementValue) return false;
        
        if (typeof attrValue === 'string') {
          if (elementValue !== attrValue) return false;
        } else {
          if (!attrValue.test(elementValue)) return false;
        }
      }
    }
    
    // Custom filtering
    if (options.customFilter) {
      if (!options.customFilter(element)) return false;
    }
    
    return true;
  });
}

/**
 * Transform XML structure using UNIST utilities
 * 
 * Demonstrates proper use of unist-util-map for tree transformation
 */
export function transformXMLStructure(
  xast: XASTRoot,
  options: XMLTransformationOptions
): XASTRoot {
  return map(xast, (node) => {
    if (node.type !== 'element') return node;
    
    const element = node as XASTElement;
    let transformedElement = { ...element };
    
    // Transform tag names
    if (options.transformTagNames) {
      transformedElement.name = options.transformTagNames(element.name);
    }
    
    // Transform attributes
    if (options.transformAttributes || options.addAttributes || options.removeAttributes) {
      let newAttributes = { ...element.attributes };
      
      if (options.transformAttributes) {
        newAttributes = options.transformAttributes(newAttributes);
      }
      
      if (options.addAttributes) {
        newAttributes = { ...newAttributes, ...options.addAttributes };
      }
      
      if (options.removeAttributes) {
        for (const attrName of options.removeAttributes) {
          delete newAttributes[attrName];
        }
      }
      
      transformedElement.attributes = newAttributes;
    }
    
    // Transform text content
    if (options.transformTextContent && element.children) {
      transformedElement.children = element.children.map(child => {
        if (child.type === 'text') {
          return {
            ...child,
            value: options.transformTextContent!(child.value)
          };
        }
        return child;
      });
    }
    
    return transformedElement;
  });
}

/**
 * Generate XML programmatically with advanced features
 * 
 * Demonstrates proper xastscript usage with complex structures
 */
export function generateAdvancedXML(
  structure: {
    rootName: string;
    namespace?: string;
    attributes?: Record<string, string>;
    elements: Array<{
      name: string;
      attributes?: Record<string, string>;
      children?: Array<{
        name: string;
        attributes?: Record<string, string>;
        textContent?: string;
      }>;
      textContent?: string;
    }>;
  }
): XASTRoot {
  const { rootName, namespace, attributes = {}, elements } = structure;
  
  // Build namespace attributes
  const rootAttributes = { ...attributes };
  if (namespace) {
    rootAttributes['xmlns'] = namespace;
  }
  
  // Generate child elements using xastscript
  const childElements = elements.map(element => {
    const elementAttributes = element.attributes || {};
    const elementChildren: XASTNode[] = [];
    
    // Add text content if present
    if (element.textContent) {
      elementChildren.push({
        type: 'text',
        value: element.textContent
      });
    }
    
    // Add child elements
    if (element.children) {
      element.children.forEach(child => {
        const childElement = x(child.name, child.attributes || {});
        if (child.textContent) {
          childElement.children = [{
            type: 'text',
            value: child.textContent
          }];
        }
        elementChildren.push(childElement);
      });
    }
    
    return x(element.name, elementAttributes, elementChildren);
  });
  
  return x(rootName, rootAttributes, childElements);
}

/**
 * Get performance statistics for XML processing
 * 
 * Demonstrates proper use of unist-util-size for performance monitoring
 */
export function getPerformanceStatistics(xast: XASTRoot): ElementStatistics {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  // Use unist-util-size for efficient counting
  const totalElements = size(xast, (node) => node.type === 'element');
  const totalTextNodes = size(xast, (node) => node.type === 'text');
  const totalAttributes = size(xast, (node) => 
    node.type === 'element' && 
    (node as XASTElement).attributes && 
    Object.keys((node as XASTElement).attributes!).length > 0
  );
  
  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;
  
  const processingTime = endTime - startTime;
  const memoryUsage = endMemory - startMemory;
  const elementsPerSecond = totalElements / (processingTime / 1000);
  
  return {
    processingTime,
    memoryUsage,
    elementsPerSecond
  };
}

/**
 * Find elements by complex criteria using multiple UNIST utilities
 * 
 * Demonstrates composition of multiple utilities for complex operations
 */
export function findElementsByComplexCriteria(
  xast: XASTRoot,
  criteria: {
    tagNamePattern?: RegExp;
    hasSpecificAttribute?: string;
    hasChildWithTag?: string;
    minChildrenCount?: number;
    maxChildrenCount?: number;
    depthRange?: { min: number; max: number };
  }
): XASTElement[] {
  // First, filter by basic criteria using unist-util-filter
  const filtered = filter(xast, (node) => {
    if (node.type !== 'element') return false;
    
    const element = node as XASTElement;
    
    // Tag name pattern matching
    if (criteria.tagNamePattern && !criteria.tagNamePattern.test(element.name)) {
      return false;
    }
    
    // Specific attribute check
    if (criteria.hasSpecificAttribute && !element.attributes?.[criteria.hasSpecificAttribute]) {
      return false;
    }
    
    // Children count check
    const childrenCount = element.children?.length || 0;
    if (criteria.minChildrenCount && childrenCount < criteria.minChildrenCount) {
      return false;
    }
    if (criteria.maxChildrenCount && childrenCount > criteria.maxChildrenCount) {
      return false;
    }
    
    return true;
  });
  
  // Then, use unist-util-visit to check for child elements and depth
  const results: XASTElement[] = [];
  
  visit(filtered, 'element', (node) => {
    const element = node as XASTElement;
    
    // Check for specific child tag
    if (criteria.hasChildWithTag) {
      const hasChild = element.children?.some(child => 
        child.type === 'element' && (child as XASTElement).name === criteria.hasChildWithTag
      );
      if (!hasChild) return;
    }
    
    // Check depth range
    if (criteria.depthRange) {
      const elementWithParents = parents(xast, element);
      const depth = elementWithParents.length;
      
      if (depth < criteria.depthRange.min || depth > criteria.depthRange.max) {
        return;
      }
    }
    
    results.push(element);
  });
  
  return results;
}

/**
 * Create a streaming processor for large XML files
 * 
 * Demonstrates performance optimization using UNIST utilities
 */
export function createStreamingProcessor(
  xast: XASTRoot,
  batchSize: number = 1000
): {
  processBatch: (processor: (elements: XASTElement[]) => void) => void;
  getProgress: () => { processed: number; total: number; percentage: number };
} {
  let processedCount = 0;
  const totalElements = size(xast, (node) => node.type === 'element');
  
  return {
    processBatch: (processor: (elements: XASTElement[]) => void) => {
      const batch: XASTElement[] = [];
      
      visit(xast, 'element', (node) => {
        if (batch.length >= batchSize) {
          processor(batch);
          processedCount += batch.length;
          batch.length = 0; // Clear array efficiently
        }
        
        batch.push(node as XASTElement);
      });
      
      // Process remaining elements
      if (batch.length > 0) {
        processor(batch);
        processedCount += batch.length;
      }
    },
    
    getProgress: () => ({
      processed: processedCount,
      total: totalElements,
      percentage: totalElements > 0 ? (processedCount / totalElements) * 100 : 0
    })
  };
}

/**
 * Export all utilities for easy importing
 */
export const UNISTHelpers = {
  analyzeXMLStructure,
  findElementsAdvanced,
  transformXMLStructure,
  generateAdvancedXML,
  getPerformanceStatistics,
  findElementsByComplexCriteria,
  createStreamingProcessor
};
