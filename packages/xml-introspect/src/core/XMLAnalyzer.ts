/**
 * Core XML Analyzer - Works in both Node.js and Browser environments
 *
 * This contains the core XML analysis functionality that doesn't depend on
 * Node.js-specific APIs like file system operations.
 */

import { fromXml } from 'xast-util-from-xml';
import type { Element as XASTElement, Text as XASTText } from 'xast';
import type { 
  XMLStructure, 
  ContentPreview, 
  XMLValidationResult, 
  ContentAnalysis 
} from './types/base.js';

// Re-export types for backward compatibility
export type { ContentPreview, ContentAnalysis };
export type ValidationResult = XMLValidationResult;

/**
 * Core XML Analyzer that works in both Node.js and browser
 */
export class XMLAnalyzer {
  /**
   * Analyze XML content structure using XAST parsing
   */
  async analyzeContent(xmlContent: string): Promise<XMLStructure> {
    try {
      const xast = fromXml(xmlContent);
      return this.parseXASTStructure(xast);
    } catch (error) {
      // For malformed XML, try to extract partial structure using regex fallback
      console.warn(
        'Failed to analyze XML content with XAST, trying regex fallback:',
        error
      );
      return this.parseXMLWithRegex(xmlContent);
    }
  }

  /**
   * Get content preview (first and last N lines)
   */
  getContentPreview(content: string, lines: number = 200): ContentPreview {
    const contentLines = content.split('\n');
    const totalLines = contentLines.length;

    if (
      totalLines === 0 ||
      (totalLines === 1 && contentLines[0].trim() === '')
    ) {
      return {
        firstLines: [],
        lastLines: [],
        totalLines: 0,
        preview: '',
      };
    }

    if (totalLines <= lines) {
      return {
        firstLines: contentLines,
        lastLines: [],
        totalLines,
        preview: content,
      };
    }

    const firstLines = contentLines.slice(0, lines);
    const lastLines = contentLines.slice(-lines);

    const preview = [
      ...firstLines,
      `\n... (${totalLines - lines * 2} lines omitted) ...\n`,
      ...lastLines,
    ].join('\n');

    return {
      firstLines,
      lastLines,
      totalLines,
      preview,
    };
  }

  /**
   * Validate XML content (try xmllint-wasm first, fallback to basic validation)
   */
  async validateContent(xmlContent: string): Promise<XMLValidationResult> {
    try {
      // Try to use xmllint-wasm for comprehensive validation
      try {
        const { validateXML } = await import('xmllint-wasm');
        const result = await validateXML({
          xml: [
            {
              fileName: 'input.xml',
              contents: xmlContent,
            },
          ],
          schema: [],
          initialMemoryPages: 256,
          maxMemoryPages: 1024,
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
        return this.performBasicValidation(xmlContent);
      }
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Invalid XML'],
        warnings: [],
      };
    }
  }

  /**
   * Comprehensive content analysis
   */
  async analyzeContentStructure(content: string): Promise<ContentAnalysis> {
    const structure = await this.analyzeContent(content);
    const preview = this.getContentPreview(content);
    const validation = await this.validateContent(content);

    return {
      structure,
      preview,
      validation,
    };
  }

  /**
   * Parse XAST structure (same logic as node version)
   */
  private parseXASTStructure(xast: any): XMLStructure {
    const elementCounts: Record<string, number> = {};
    const attributeCounts: Record<string, number> = {};
    const rootElements: string[] = [];
    const commonElements: Array<{ name: string; count: number }> = [];
    const attributes: Array<{ name: string; count: number }> = [];
    const elementTypes = new Map<string, any>();
    const namespaces = new Map<string, string>();
    let maxDepth = 0;
    let totalElements = 0;
    let rootElement = '';

    // Use the same traversal logic as the node version
    const traverseNode = (node: any, depth: number = 0): void => {
      // Safety check to prevent infinite recursion
      if (depth > 1000 || totalElements > 100000) {
        console.warn(
          `Safety limit reached: depth=${depth}, elements=${totalElements}`
        );
        return;
      }

      if (node.type === 'element' && node.name) {
        const xastElement = node as XASTElement;
        const tagName = xastElement.name; // Keep the full name including namespace prefix

        totalElements++;
        maxDepth = Math.max(maxDepth, depth + 1);

        if (depth === 0) {
          rootElements.push(tagName);
          if (!rootElement) {
            rootElement = tagName;
          }
        }

        // Count element
        elementCounts[tagName] = (elementCounts[tagName] || 0) + 1;

        // Track element types
        if (!elementTypes.has(tagName)) {
          elementTypes.set(tagName, {
            count: 0,
            attributes: new Set<string>(),
            children: new Set<string>(),
            maxDepth: 0,
            examples: []
          });
        }
        const typeInfo = elementTypes.get(tagName)!;
        typeInfo.count++;
        typeInfo.maxDepth = Math.max(typeInfo.maxDepth, depth + 1);

        // Count attributes
        if (xastElement.attributes) {
          for (const [attrName, attrValue] of Object.entries(
            xastElement.attributes
          )) {
            attributeCounts[attrName] = (attributeCounts[attrName] || 0) + 1;
            
            // Track attributes in element types
            typeInfo.attributes.add(attrName);
            
            // Extract namespaces
            if (attrName.startsWith('xmlns') || attrName === 'targetNamespace') {
              namespaces.set(attrName, attrValue as string);
            }
          }
        }

        // Traverse children
        if (xastElement.children) {
          for (const child of xastElement.children) {
            if (child.type === 'element') {
              const childElement = child as XASTElement;
              typeInfo.children.add(childElement.name);
            }
            traverseNode(child, depth + 1);
          }
        }
      }
    };

    // Start traversal from root - XAST has a root element that contains the actual XML
    if (xast.children) {
      for (const child of xast.children) {
        traverseNode(child, 0);
      }
    } else {
      traverseNode(xast, 0);
    }

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
  }

  /**
   * Perform basic XML validation without WASM
   */
  private performBasicValidation(xmlContent: string): XMLValidationResult {
    try {
      // Try to parse with XAST - if it succeeds, XML is well-formed
      fromXml(xmlContent);
      return {
        valid: true,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          error instanceof Error ? error.message : 'Invalid XML structure',
        ],
        warnings: [],
      };
    }
  }

  /**
   * Parse XML using regex fallback for malformed XML
   */
  private parseXMLWithRegex(xmlContent: string): XMLStructure {
    const elementCounts: Record<string, number> = {};
    const attributeCounts: Record<string, number> = {};
    const rootElements: string[] = [];
    const commonElements: Array<{ name: string; count: number }> = [];
    const attributes: Array<{ name: string; count: number }> = [];
    const elementTypes = new Map<string, any>();
    const namespaces = new Map<string, string>();
    let maxDepth = 0;
    let totalElements = 0;
    let rootElement = '';

    // Combined regex to find both opening and self-closing tags
    const elementRegex = /<([a-zA-Z][a-zA-Z0-9:_-]*)(?:\s+[^>]*)?(?:\/>|>)/g;

    let match;
    const depthStack: string[] = [];

    // Find all XML elements (both opening and self-closing)
    while ((match = elementRegex.exec(xmlContent)) !== null) {
      const tagName = match[1];
      const fullMatch = match[0];

      // Skip closing tags
      if (fullMatch.startsWith('</')) continue;

      // Check if it's self-closing
      const isSelfClosing = fullMatch.endsWith('/>');

      totalElements++;
      maxDepth = Math.max(maxDepth, depthStack.length + 1);

      if (depthStack.length === 0) {
        rootElements.push(tagName);
        if (!rootElement) {
          rootElement = tagName;
        }
      }

      // Count element
      elementCounts[tagName] = (elementCounts[tagName] || 0) + 1;

      // Track element types
      if (!elementTypes.has(tagName)) {
        elementTypes.set(tagName, {
          count: 0,
          attributes: new Set<string>(),
          children: new Set<string>(),
          maxDepth: 0,
          examples: []
        });
      }
      const typeInfo = elementTypes.get(tagName)!;
      typeInfo.count++;
      typeInfo.maxDepth = Math.max(typeInfo.maxDepth, depthStack.length + 1);

      // Extract attributes from the tag
      const attrRegex = /(\w+)=["']([^"']*)["']/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(fullMatch)) !== null) {
        const attrName = attrMatch[1];
        const attrValue = attrMatch[2];
        attributeCounts[attrName] = (attributeCounts[attrName] || 0) + 1;
        
        // Track attributes in element types
        typeInfo.attributes.add(attrName);
        
        // Extract namespaces
        if (attrName.startsWith('xmlns') || attrName === 'targetNamespace') {
          namespaces.set(attrName, attrValue);
        }
      }

      // Only push to stack if not self-closing
      if (!isSelfClosing) {
        depthStack.push(tagName);
      }
    }

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
  }

  /**
   * Create empty structure for error cases
   */
  private createEmptyStructure(): XMLStructure {
    return {
      elementCounts: {},
      attributeCounts: {},
      rootElements: [],
      commonElements: [],
      attributes: [],
      maxDepth: 0,
      totalElements: 0,
      rootElement: '',
      elementTypes: new Map(),
      namespaces: new Map(),
    };
  }
}
