/**
 * Core XML Introspect - Shared functionality for both Node.js and Browser
 * 
 * This package contains all the core functionality that works in both
 * Node.js and browser environments.
 */

export { XMLAnalyzer } from './XMLAnalyzer.js';
export type { ContentPreview, ValidationResult, ContentAnalysis } from './XMLAnalyzer.js';

export { XSDParser } from './XSDParser.js';

export { XMLFakerGenerator } from './XMLFakerGenerator.js';
export type { XMLFakerOptions } from './XMLFakerGenerator.js';

export { toXmlPretty } from './xast-util-to-xml-pretty.js';

// Re-export all types from the base types module
export * from './types/base.js';  

export { SamplingStrategy } from './enums';

// Shared modules
export * from './XSDGenerator.js';
export * from './XMLValidator.js';
export * from './SampleGenerator.js';