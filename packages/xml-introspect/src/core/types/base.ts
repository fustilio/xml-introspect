/**
 * Base types and interfaces - fundamental types used throughout the XML introspection library
 * 
 * This file contains the core type definitions that are shared across all modules.
 * These types should be the single source of truth for their respective concepts.
 */

import { SamplingStrategy } from '../enums.js';

// ============================================================================
// CORE XML TYPES
// ============================================================================

/**
 * Represents an XML element with its structure and metadata
 */
export interface XMLElement {
  tagName: string;
  attributes: Record<string, string>;
  children: XMLElement[];
  depth: number;
  parent?: XMLElement;
  textContent?: string;
}

/**
 * Information about a specific element type found in XML
 */
export interface ElementTypeInfo {
  count: number;
  attributes: Set<string>;
  children: Set<string>;
  maxDepth: number;
  examples: XMLElement[];
}

/**
 * Complete XML structure analysis result
 */
export interface XMLStructure {
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

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Result of XML validation
 */
export interface XMLValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Legacy alias for backward compatibility
 */
export type ValidationResult = XMLValidationResult;

// ============================================================================
// OPTION TYPES
// ============================================================================

/**
 * Options for XML sampling and generation
 */
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

/**
 * Options for generating XSD from XML
 */
export interface XSDFromXMLOptions {
  targetNamespace?: string;
  elementForm?: 'qualified' | 'unqualified';
  attributeForm?: 'qualified' | 'unqualified';
  verbose?: boolean;
}

/**
 * Options for generating XML from XSD
 */
export interface XMLFromXSDOptions {
  maxElements?: number;
  generateRealisticData?: boolean;
}

/**
 * Options for XML validation
 */
export interface ValidationOptions {
  strict?: boolean;
  schema?: string;
  initialMemoryPages?: number;
  maxMemoryPages?: number;
}

// ============================================================================
// ANALYSIS TYPES
// ============================================================================

/**
 * Content preview information
 */
export interface ContentPreview {
  firstLines: string[];
  lastLines: string[];
  totalLines: number;
  preview: string;
}

/**
 * Comprehensive content analysis result
 */
export interface ContentAnalysis {
  structure: XMLStructure;
  preview: ContentPreview;
  validation: XMLValidationResult;
}

// ============================================================================
// PATTERN AND RULE TYPES
// ============================================================================

/**
 * Pattern rule for XML structure analysis
 */
export interface PatternRule {
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

// ============================================================================
// SAMPLING TYPES
// ============================================================================

/**
 * Sampling strategy type
 */
export type SamplingStrategyType = (typeof SamplingStrategy)[keyof typeof SamplingStrategy];

/**
 * Options for sample generation
 */
export interface SampleGenerationOptions {
  maxElements: number;
  maxDepth: number;
  strategy: SamplingStrategyType;
  preserveAttributes: boolean;
  preserveRelationships: boolean;
  preserveAllTypes: boolean;
  elementTypeLimits?: Record<string, number>;
}

// ============================================================================
// XAST TYPES (Re-exported from xast library)
// ============================================================================

export {
  Element as XASTElement,
  Text as XASTText,
  Root as XASTRoot,
  Node as XASTNode,
  Comment as XASTComment,
} from 'xast';
