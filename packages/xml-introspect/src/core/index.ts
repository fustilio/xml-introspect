/**
 * Core XML Introspect - Shared functionality for both Node.js and Browser
 * 
 * This package contains all the core functionality that works in both
 * Node.js and browser environments.
 */

export { XMLAnalyzer } from './XMLAnalyzer.js';
export type { XMLStructure, ContentPreview, ValidationResult, ContentAnalysis } from './XMLAnalyzer.js';

export { XSDParser } from './XSDParser.js';
export type { XSDBaseNode, XSDSchema, XSDElementInfo, XSDAST } from './XSDParser.js';

export { XMLFakerGenerator } from './XMLFakerGenerator.js';
export type { XMLFakerOptions } from './XMLFakerGenerator.js';

export { toXmlPretty } from './xast-util-to-xml-pretty.js';
