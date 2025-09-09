/**
 * Standalone Browser-compatible XML Introspector
 * 
 * This version uses the same parsing logic as the node version for consistency.
 */

import { fromXml } from 'xast-util-from-xml';
import type { XASTElement, XASTText } from 'xast';

// xmllint-wasm will be imported dynamically in validation method

// Standalone types for browser compatibility
export interface StandaloneXMLStructure {
  elementCounts: Record<string, number>;
  attributeCounts: Record<string, number>;
  rootElements: string[];
  commonElements: Array<{ name: string; count: number }>;
  attributes: Array<{ name: string; count: number }>;
  maxDepth: number;
  totalElements: number;
}

export interface StandaloneContentPreview {
  firstLines: string[];
  lastLines: string[];
  totalLines: number;
  preview: string;
}

export interface StandaloneValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StandaloneContentAnalysis {
  structure: StandaloneXMLStructure;
  preview: StandaloneContentPreview;
  validation: StandaloneValidationResult;
}

export class StandaloneBrowserXMLIntrospector {
  /**
   * Analyze XML content structure using XAST parsing (same as node version)
   */
  async analyzeContent(xmlContent: string): Promise<StandaloneXMLStructure> {
    try {
      // Use the same XAST parsing approach as the node version
      const xast = fromXml(xmlContent);
      const structure = this.parseXASTStructure(xast);
      return structure;
    } catch (error) {
      console.warn('Failed to analyze XML content:', error);
      return this.createEmptyStructure();
    }
  }

  /**
   * Get content preview (first and last N lines)
   */
  getContentPreview(content: string, lines: number = 200): StandaloneContentPreview {
    const contentLines = content.split('\n');
    const totalLines = contentLines.length;
    
    if (totalLines <= lines * 2) {
      return {
        firstLines: contentLines,
        lastLines: [],
        totalLines,
        preview: content
      };
    }
    
    const firstLines = contentLines.slice(0, lines);
    const lastLines = contentLines.slice(-lines);
    
    const preview = [
      ...firstLines,
      `\n... (${totalLines - lines * 2} lines omitted) ...\n`,
      ...lastLines
    ].join('\n');
    
    return {
      firstLines,
      lastLines,
      totalLines,
      preview
    };
  }

  /**
   * Validate XML content (try xmllint-wasm first, fallback to basic validation)
   */
  async validateContent(xmlContent: string): Promise<StandaloneValidationResult> {
    try {
      // Try to use xmllint-wasm for comprehensive validation
      try {
        const { validateXML } = await import('xmllint-wasm');
        const result = await validateXML({
          xml: [{
            fileName: 'input.xml',
            contents: xmlContent,
          }],
          schema: [],
          initialMemoryPages: 256,
          maxMemoryPages: 1024,
        });
        
        return {
          valid: result.valid,
          errors: Array.from(result.errors),
          warnings: (result as any).warnings ? Array.from((result as any).warnings) : []
        };
      } catch (wasmError) {
        // If WASM fails, fall back to basic validation
        return this.performBasicValidation(xmlContent);
      }
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Invalid XML'],
        warnings: []
      };
    }
  }

  /**
   * Perform basic XML validation without WASM
   */
  private performBasicValidation(xmlContent: string): StandaloneValidationResult {
    try {
      // Try to parse with XAST - if it succeeds, XML is well-formed
      fromXml(xmlContent);
      return {
        valid: true,
        errors: [],
        warnings: []
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Invalid XML structure'],
        warnings: []
      };
    }
  }

  /**
   * Comprehensive content analysis
   */
  async analyzeContentStructure(content: string): Promise<StandaloneContentAnalysis> {
    const structure = await this.analyzeContent(content);
    const preview = this.getContentPreview(content);
    const validation = await this.validateContent(content);
    
    return {
      structure,
      preview,
      validation
    };
  }

  /**
   * Parse XAST structure (same logic as node version)
   */
  private parseXASTStructure(xast: any): StandaloneXMLStructure {
    const elementCounts: Record<string, number> = {};
    const attributeCounts: Record<string, number> = {};
    const rootElements: string[] = [];
    const commonElements: Array<{ name: string; count: number }> = [];
    const attributes: Array<{ name: string; count: number }> = [];
    let maxDepth = 0;
    let totalElements = 0;

    // Use the same traversal logic as the node version
    const traverseNode = (node: any, depth: number = 0): void => {
      // Safety check to prevent infinite recursion
      if (depth > 1000 || totalElements > 100000) {
        console.warn(`Safety limit reached: depth=${depth}, elements=${totalElements}`);
        return;
      }

      if (node.type === 'element' && node.name) {
        const xastElement = node as XASTElement;
        const tagName = xastElement.name.includes(':') ? xastElement.name.split(':')[1] : xastElement.name;
        
        totalElements++;
        maxDepth = Math.max(maxDepth, depth + 1); // Convert to 1-based depth for test expectations
        
        if (depth === 0) {
          rootElements.push(tagName);
        }

        // Count element
        elementCounts[tagName] = (elementCounts[tagName] || 0) + 1;

        // Count attributes
        if (xastElement.attributes) {
          for (const [attrName, attrValue] of Object.entries(xastElement.attributes)) {
            attributeCounts[attrName] = (attributeCounts[attrName] || 0) + 1;
          }
        }

        // Traverse children
        if (xastElement.children) {
          for (const child of xastElement.children) {
            traverseNode(child, depth + 1);
          }
        }
      }
    };

    // Start traversal from root
    traverseNode(xast);

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
      totalElements
    };
  }


  /**
   * Create empty structure for error cases
   */
  private createEmptyStructure(): StandaloneXMLStructure {
    return {
      elementCounts: {},
      attributeCounts: {},
      rootElements: [],
      commonElements: [],
      attributes: [],
      maxDepth: 0,
      totalElements: 0
    };
  }
}
