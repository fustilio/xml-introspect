/**
 * Consolidated type exports for the XML introspection library
 * 
 * This file re-exports all types from their respective modules to provide
 * a single entry point for type imports.
 */

// ============================================================================
// BASE TYPES (Core functionality)
// ============================================================================

export {
  // Core XML types
  XMLElement,
  ElementTypeInfo,
  XMLStructure,
  
  // Validation types
  XMLValidationResult,
  ValidationResult, // Legacy alias
  
  // Option types
  SamplingOptions,
  XSDFromXMLOptions,
  XMLFromXSDOptions,
  ValidationOptions,
  
  // Analysis types
  ContentPreview,
  ContentAnalysis,
  
  // Pattern types
  PatternRule,
  
  // Sampling types
  SamplingStrategyType,
  SampleGenerationOptions,
  
  // XAST types
  XASTElement,
  XASTText,
  XASTRoot,
  XASTNode,
  XASTComment,
} from './base.js';

// ============================================================================
// XSD TYPES (Schema Definition Language)
// ============================================================================

// Re-export XSD types from the xsdast module (primary definition)
export {
  // XSD AST types
  XSDASTResult,
  XSDASTComparison,
  
  // XSD Schema types
  XSDSchema,
  XSDElement,
  XSDAttribute,
  
  // XSD Type definitions
  XSDComplexType,
  XSDSimpleType,
  
  // XSD Compositor types
  XSDSequence,
  XSDChoice,
  
  // XSD Facet types
  XSDRestriction,
  
  // XSD AST node types
  XSDAST,
  XSDASTNode,
  
  // XSD Analysis types
  XSDElementInfo,
  XSDAttributeInfo,
  XSDTypeInfo,
} from '../../xsdast/types.js';

// ============================================================================
// ENVIRONMENT-SPECIFIC TYPES
// ============================================================================

// Import the base types for extension
import type {
  SamplingOptions,
  XSDFromXMLOptions,
  ValidationOptions,
  XMLValidationResult,
  XMLStructure,
} from './base.js';

// Browser-specific type extensions
export interface BrowserSamplingOptions extends SamplingOptions {}
export interface BrowserXSDFromXMLOptions extends XSDFromXMLOptions {}
export interface BrowserValidationOptions extends ValidationOptions {}
export interface BrowserXMLValidationResult extends XMLValidationResult {}
export interface BrowserXMLStructure extends XMLStructure {}