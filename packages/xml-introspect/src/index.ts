// Export core functionality
export * from './core/index.js';

// Export environment-specific functionality
export { NodeXMLIntrospector as XMLIntrospector } from './node/NodeXMLIntrospector.js';
export { BrowserXMLIntrospector } from './browser/BrowserXMLIntrospector.js';

// Export Node.js-specific functionality
export * from './node/index.js';

// Export CLI functionality
export * from './cli/index.js';

// Re-export legacy types for backward compatibility
export type { 
  XMLStructure as LegacyXMLStructure,
  ContentAnalysis as LegacyContentAnalysis,
  ValidationResult as LegacyValidationResult
} from './core/XMLAnalyzer.js';
