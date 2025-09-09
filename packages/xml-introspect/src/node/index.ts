/**
 * Node.js XML Introspect - Node.js-specific functionality
 * 
 * This package contains functionality that only works in Node.js environments,
 * such as file system operations and streaming.
 */

export { NodeXMLIntrospector } from './NodeXMLIntrospector.js';
export { NodeXSDParser } from './NodeXSDParser.js';

// Re-export core functionality for convenience
export * from '../core/index.js';
