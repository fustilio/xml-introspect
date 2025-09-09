/**
 * XSDAST (XSD Abstract Syntax Tree) Module
 * 
 * This module provides comprehensive utilities for working with XSD Abstract Syntax Trees,
 * including traversal, validation, manipulation, and self-validation capabilities.
 */

// Export all types
export * from './types';

// Export main classes
export { XSDASTTraverser } from './traverser';
export { XSDHelper } from './helper';
export { XSDASTValidator } from './validator';
export { XSDRecursiveGenerator } from './generator';

// Export convenience functions
export { createXSDASTTraverser } from './utils.js';
export { createSelfValidatingXSD } from './utils.js';

// Re-export core types for convenience
export type { XSDAST } from './types';
