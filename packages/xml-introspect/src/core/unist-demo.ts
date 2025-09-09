/**
 * UNIST Utilities Demonstration
 * 
 * This module demonstrates comprehensive usage of UNIST utilities
 * for XML processing, showcasing best practices and advanced patterns.
 */

import { visit, SKIP } from 'unist-util-visit';
import { filter } from 'unist-util-filter';
import { find } from 'unist-util-find';
import { map } from 'unist-util-map';
import { size } from 'unist-util-size';
import { parents } from 'unist-util-parents';
import { x } from 'xastscript';
import { fromXml } from 'xast-util-from-xml';
import { toXml } from 'xast-util-to-xml';
import type { Node as XASTNode, Element as XASTElement, Root as XASTRoot } from 'xast';

/**
 * Comprehensive XML analysis using all UNIST utilities
 */
export class UNISTXMLProcessor {
  private xast: XASTRoot | null = null;
  private elementCache = new Map<string, XASTElement[]>();
  private statistics: any = null;

  /**
   * Load XML content and parse into XAST
   */
  async loadXML(xmlContent: string): Promise<void> {
    this.xast = fromXml(xmlContent);
    this.elementCache.clear();
    this.statistics = null;
  }

  /**
   * Comprehensive analysis using multiple UNIST utilities
   */
  analyzeWithUNIST(): {
    elementCounts: Map<string, number>;
    depthAnalysis: { maxDepth: number; averageDepth: number };
    attributeAnalysis: { totalAttributes: number; uniqueAttributes: Set<string> };
    performance: { processingTime: number; memoryUsage: number };
    structure: { totalElements: number; totalTextNodes: number; hasMixedContent: boolean };
  } {
    if (!this.xast) throw new Error('No XML loaded');

    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    const elementCounts = new Map<string, number>();
    const depths: number[] = [];
    const allAttributes = new Set<string>();
    let totalAttributes = 0;
    let totalElements = 0;
    let totalTextNodes = 0;
    let hasMixedContent = false;

    // Use unist-util-visit for comprehensive traversal
    visit(this.xast, (node, index, parent) => {
      if (node.type === 'element') {
        const element = node as XASTElement;
        totalElements++;
        
        // Count elements by type
        elementCounts.set(element.name, (elementCounts.get(element.name) || 0) + 1);
        
        // Calculate depth using unist-util-parents
        const elementWithParents = parents(this.xast!, element);
        const depth = elementWithParents.length;
        depths.push(depth);
        
        // Analyze attributes
        if (element.attributes) {
          const attrKeys = Object.keys(element.attributes);
          totalAttributes += attrKeys.length;
          attrKeys.forEach(attr => allAttributes.add(attr));
        }
        
        // Check for mixed content
        if (element.children) {
          const hasText = element.children.some(child => child.type === 'text');
          const hasElements = element.children.some(child => child.type === 'element');
          if (hasText && hasElements) {
            hasMixedContent = true;
          }
        }
      } else if (node.type === 'text') {
        totalTextNodes++;
      }
    });

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    const maxDepth = Math.max(...depths, 0);
    const averageDepth = depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 0;

    this.statistics = {
      elementCounts,
      depthAnalysis: { maxDepth, averageDepth },
      attributeAnalysis: { totalAttributes, uniqueAttributes: allAttributes },
      performance: {
        processingTime: endTime - startTime,
        memoryUsage: endMemory - startMemory
      },
      structure: { totalElements, totalTextNodes, hasMixedContent }
    };

    return this.statistics;
  }

  /**
   * Advanced filtering using unist-util-filter
   */
  findElementsAdvanced(criteria: {
    tagName?: string | RegExp;
    hasAttributes?: boolean;
    minDepth?: number;
    maxDepth?: number;
    hasTextContent?: boolean;
    attributeValue?: { name: string; value: string | RegExp };
  }): XASTRoot {
    if (!this.xast) throw new Error('No XML loaded');

    return filter(this.xast, (node) => {
      if (node.type !== 'element') return false;
      
      const element = node as XASTElement;
      
      // Tag name filtering
      if (criteria.tagName) {
        if (typeof criteria.tagName === 'string') {
          if (element.name !== criteria.tagName) return false;
        } else {
          if (!criteria.tagName.test(element.name)) return false;
        }
      }
      
      // Attribute presence filtering
      if (criteria.hasAttributes !== undefined) {
        const hasAttrs = element.attributes && Object.keys(element.attributes).length > 0;
        if (hasAttrs !== criteria.hasAttributes) return false;
      }
      
      // Depth filtering
      if (criteria.minDepth !== undefined || criteria.maxDepth !== undefined) {
        const elementWithParents = parents(this.xast, element);
        const depth = elementWithParents.length;
        
        if (criteria.minDepth !== undefined && depth < criteria.minDepth) return false;
        if (criteria.maxDepth !== undefined && depth > criteria.maxDepth) return false;
      }
      
      // Text content filtering
      if (criteria.hasTextContent !== undefined) {
        const hasText = element.children?.some(child => child.type === 'text') || false;
        if (hasText !== criteria.hasTextContent) return false;
      }
      
      // Attribute value filtering
      if (criteria.attributeValue) {
        const { name, value } = criteria.attributeValue;
        const elementValue = element.attributes?.[name];
        if (!elementValue) return false;
        
        if (typeof value === 'string') {
          if (elementValue !== value) return false;
        } else {
          if (!value.test(elementValue)) return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Transform XML using unist-util-map
   */
  transformXML(transformations: {
    renameElements?: Map<string, string>;
    addAttributes?: Record<string, string>;
    removeAttributes?: string[];
    transformTextContent?: (text: string) => string;
    addNamespace?: { prefix: string; uri: string };
  }): XASTRoot {
    if (!this.xast) throw new Error('No XML loaded');

    return map(this.xast, (node) => {
      if (node.type !== 'element') {
        // Transform text content if specified
        if (node.type === 'text' && transformations.transformTextContent) {
          return {
            ...node,
            value: transformations.transformTextContent(node.value)
          };
        }
        return node;
      }
      
      const element = node as XASTElement;
      let transformedElement = { ...element };
      
      // Rename elements
      if (transformations.renameElements?.has(element.name)) {
        transformedElement.name = transformations.renameElements.get(element.name)!;
      }
      
      // Add namespace prefix
      if (transformations.addNamespace) {
        const { prefix } = transformations.addNamespace;
        transformedElement.name = `${prefix}:${element.name}`;
      }
      
      // Modify attributes
      if (transformations.addAttributes || transformations.removeAttributes) {
        let newAttributes = { ...element.attributes };
        
        if (transformations.addAttributes) {
          newAttributes = { ...newAttributes, ...transformations.addAttributes };
        }
        
        if (transformations.removeAttributes) {
          for (const attrName of transformations.removeAttributes) {
            delete newAttributes[attrName];
          }
        }
        
        transformedElement.attributes = newAttributes;
      }
      
      return transformedElement;
    });
  }

  /**
   * Generate XML using xastscript with advanced features
   */
  generateXMLAdvanced(structure: {
    rootName: string;
    namespace?: { prefix: string; uri: string };
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
  }): string {
    const { rootName, namespace, elements } = structure;
    
    // Build namespace attributes
    const rootAttributes: Record<string, string> = {};
    if (namespace) {
      rootAttributes[`xmlns:${namespace.prefix}`] = namespace.uri;
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
    
    const rootElement = x(rootName, rootAttributes, childElements);
    return toXml(rootElement);
  }

  /**
   * Performance-optimized processing for large files
   */
  processLargeFile(
    processor: (elements: XASTElement[]) => void,
    batchSize: number = 1000
  ): {
    process: () => void;
    getProgress: () => { processed: number; total: number; percentage: number };
  } {
    if (!this.xast) throw new Error('No XML loaded');

    const totalElements = size(this.xast, (node) => node.type === 'element');
    let processedCount = 0;
    
    return {
      process: () => {
        const batch: XASTElement[] = [];
        
        visit(this.xast!, 'element', (node) => {
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
   * Find elements by complex criteria using multiple utilities
   */
  findElementsByComplexCriteria(criteria: {
    tagNamePattern?: RegExp;
    hasSpecificAttribute?: string;
    hasChildWithTag?: string;
    minChildrenCount?: number;
    maxChildrenCount?: number;
    depthRange?: { min: number; max: number };
  }): XASTElement[] {
    if (!this.xast) throw new Error('No XML loaded');

    // First, filter by basic criteria
    const filtered = filter(this.xast, (node) => {
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
    
    // Then, check for child elements and depth
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
        const elementWithParents = parents(this.xast!, element);
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
   * Generate statistics using unist-util-size
   */
  getDetailedStatistics(): {
    totalElements: number;
    totalTextNodes: number;
    totalAttributes: number;
    elementsWithAttributes: number;
    elementsWithChildren: number;
    elementsWithText: number;
    averageChildrenPerElement: number;
  } {
    if (!this.xast) throw new Error('No XML loaded');

    const totalElements = size(this.xast, (node) => node.type === 'element');
    const totalTextNodes = size(this.xast, (node) => node.type === 'text');
    const totalAttributes = size(this.xast, (node) => 
      node.type === 'element' && 
      (node as XASTElement).attributes && 
      Object.keys((node as XASTElement).attributes!).length > 0
    );
    const elementsWithAttributes = size(this.xast, (node) => 
      node.type === 'element' && 
      (node as XASTElement).attributes && 
      Object.keys((node as XASTElement).attributes!).length > 0
    );
    const elementsWithChildren = size(this.xast, (node) => 
      node.type === 'element' && 
      (node as XASTElement).children && 
      (node as XASTElement).children!.length > 0
    );
    const elementsWithText = size(this.xast, (node) => 
      node.type === 'element' && 
      (node as XASTElement).children && 
      (node as XASTElement).children!.some(child => child.type === 'text')
    );

    // Calculate average children per element
    let totalChildren = 0;
    visit(this.xast, 'element', (node) => {
      const element = node as XASTElement;
      if (element.children) {
        totalChildren += element.children.length;
      }
    });

    return {
      totalElements,
      totalTextNodes,
      totalAttributes,
      elementsWithAttributes,
      elementsWithChildren,
      elementsWithText,
      averageChildrenPerElement: totalElements > 0 ? totalChildren / totalElements : 0
    };
  }
}

/**
 * Export the processor class
 */
export { UNISTXMLProcessor };
