/**
 * XSDAST (XSD Abstract Syntax Tree) Types and Interfaces
 * 
 * This module defines comprehensive types for working with XSD Abstract Syntax Trees,
 * including enhanced traversal, validation, and self-validation capabilities.
 * 
 * This is the primary definition of XSD types for the entire library.
 */

// ============================================================================
// CORE XSD TYPES
// ============================================================================

/**
 * XSD Abstract Syntax Tree node
 */
export interface XSDASTNode {
  type:
    | 'xsd:schema'
    | 'xsd:element'
    | 'xsd:complexType'
    | 'xsd:simpleType'
    | 'xsd:attribute'
    | 'xsd:sequence'
    | 'xsd:choice'
    | 'xsd:restriction';
  name?: string;
  attributes: Record<string, string>;
  children: XSDASTNode[];
  text?: string;
  parent?: XSDASTNode;
}

/**
 * XSD Abstract Syntax Tree with root node
 */
export interface XSDASTWrapper {
  root: XSDASTNode;
  elements: Map<string, XSDElementInfo>;
  attributes: Map<string, XSDAttributeInfo>;
  types: Map<string, XSDTypeInfo>;
  namespaces: Map<string, string>;
  rootElement: string | null;
}

/**
 * XSD Abstract Syntax Tree - for backward compatibility, this is just a node
 */
export type XSDAST = XSDASTNode;

/**
 * XSD element definition
 */
export interface XSDElement {
  name: string;
  type?: string;
  minOccurs?: number;
  maxOccurs?: number | 'unbounded';
  nillable?: boolean;
  attributes: Map<string, XSDAttribute>;
  complexType?: XSDComplexType;
  simpleType?: XSDSimpleType;
  substitutionGroup?: string;
  abstract?: boolean;
  final?: string;
  block?: string;
}

/**
 * XSD attribute definition
 */
export interface XSDAttribute {
  name: string;
  type?: string;
  use?: 'optional' | 'required' | 'prohibited';
  default?: string;
  fixed?: string;
  form?: 'qualified' | 'unqualified';
  simpleType?: XSDSimpleType;
}

/**
 * XSD complex type definition
 */
export interface XSDComplexType {
  name: string;
  abstract?: boolean;
  mixed?: boolean;
  final?: string;
  block?: string;
  sequence?: XSDSequence;
  choice?: XSDChoice;
  all?: XSDSequence;
  attributes: Map<string, XSDAttribute>;
  base?: string;
  restriction?: XSDRestriction;
  extension?: {
    base: string;
    sequence?: XSDSequence;
    choice?: XSDChoice;
    all?: XSDSequence;
    attributes: Map<string, XSDAttribute>;
  };
}

/**
 * XSD simple type definition
 */
export interface XSDSimpleType {
  name: string;
  base?: string;
  restriction?: XSDRestriction;
  union?: string[];
  list?: string;
}

/**
 * XSD sequence compositor
 */
export interface XSDSequence {
  elements: XSDElement[];
  minOccurs?: number;
  maxOccurs?: number | 'unbounded';
}

/**
 * XSD choice compositor
 */
export interface XSDChoice {
  elements: XSDElement[];
  minOccurs?: number;
  maxOccurs?: number | 'unbounded';
}

/**
 * XSD restriction with facets
 */
export interface XSDRestriction {
  base: string;
  facets: Map<string, any>;
  enumeration?: string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minInclusive?: number;
  maxInclusive?: number;
  minExclusive?: number;
  maxExclusive?: number;
  totalDigits?: number;
  fractionDigits?: number;
  whiteSpace?: 'preserve' | 'replace' | 'collapse';
}

/**
 * Detailed element information for analysis
 */
export interface XSDElementInfo {
  name: string;
  type: string;
  minOccurs: number;
  maxOccurs: number | 'unbounded';
  nillable: boolean;
  attributes: XSDAttributeInfo[];
  children: XSDElementInfo[];
  isComplex: boolean;
  isAbstract: boolean;
  substitutionGroup?: string;
}

/**
 * Detailed attribute information for analysis
 */
export interface XSDAttributeInfo {
  name: string;
  type: string;
  use: 'optional' | 'required' | 'prohibited';
  default?: string;
  fixed?: string;
  form: 'qualified' | 'unqualified';
}

/**
 * Detailed type information for analysis
 */
export interface XSDTypeInfo {
  name: string;
  baseType?: string;
  isComplex: boolean;
  isAbstract: boolean;
  mixed: boolean;
  elements: XSDElementInfo[];
  attributes: XSDAttributeInfo[];
  facets?: Map<string, any>;
}

/**
 * Complete XSD schema definition
 */
export interface XSDSchema {
  targetNamespace?: string;
  elementFormDefault?: 'qualified' | 'unqualified';
  attributeFormDefault?: 'qualified' | 'unqualified';
  elements: Map<string, XSDElement>;
  complexTypes: Map<string, XSDComplexType>;
  simpleTypes: Map<string, XSDSimpleType>;
  namespaces: Map<string, string>;
}

/**
 * Result of XSD AST parsing
 */
export interface XSDASTResult {
  elements: Map<string, any>;
  rootElement: string;
}

/**
 * Comparison result between two XSD ASTs
 */
export interface XSDASTComparison {
  equal: boolean;
  elementDifferences: string[];
  attributeDifferences: string[];
  namespaceDifferences: string[];
  structuralDifferences: string[];
}

// ============================================================================
// ENHANCED XSDAST TYPES
// ============================================================================

/**
 * Enhanced XSDAST node with additional metadata and traversal capabilities
 */
export interface EnhancedXSDASTNode extends XSDASTNode {
  /** Unique identifier for the node */
  id: string;
  /** Depth level in the tree */
  depth: number;
  /** Path from root to this node */
  path: string;
  /** Whether this node is a leaf (no children) */
  isLeaf: boolean;
  /** Whether this node is the root of the tree */
  isRoot: boolean;
  /** Metadata for validation and analysis */
  metadata: XSDASTNodeMetadata;
}

/**
 * Metadata associated with XSDAST nodes
 */
export interface XSDASTNodeMetadata {
  /** Line number in original XSD (if available) */
  lineNumber?: number;
  /** Column number in original XSD (if available) */
  columnNumber?: number;
  /** Whether this node was generated (not from original XSD) */
  isGenerated: boolean;
  /** Validation status */
  validationStatus: 'valid' | 'invalid' | 'unknown';
  /** Validation errors (if any) */
  validationErrors: string[];
  /** Dependencies on other nodes */
  dependencies: string[];
  /** Whether this node is self-referencing */
  isSelfReferencing: boolean;
}

/**
 * XSDAST traversal context
 */
export interface XSDASTTraversalContext {
  /** Current depth in traversal */
  depth: number;
  /** Path from root */
  path: string[];
  /** Parent node */
  parent?: EnhancedXSDASTNode;
  /** Sibling index */
  siblingIndex: number;
  /** Whether to continue traversal */
  shouldContinue: boolean;
  /** Custom data attached to context */
  data: Map<string, any>;
}

/**
 * XSDAST query result
 */
export interface XSDASTQueryResult {
  /** Matching nodes */
  nodes: EnhancedXSDASTNode[];
  /** Total count of matches */
  count: number;
  /** Query execution time */
  executionTime: number;
  /** Query metadata */
  metadata: {
    query: string;
    filters: string[];
    sortBy?: string;
  };
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * XSD validation result
 */
export interface XSDValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Validation errors */
  errors: XSDValidationError[];
  /** Validation warnings */
  warnings: XSDValidationWarning[];
  /** Validation statistics */
  statistics: XSDValidationStatistics;
  /** Self-validation result (if applicable) */
  structuralValidation?: { isValid: boolean; issues: string[] };
}

/**
 * XSD validation error
 */
export interface XSDValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Node where error occurred */
  node?: EnhancedXSDASTNode;
  /** Severity level */
  severity: 'error' | 'fatal';
  /** Suggested fix */
  suggestion?: string;
}

/**
 * XSD validation warning
 */
export interface XSDValidationWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Node where warning occurred */
  node?: EnhancedXSDASTNode;
  /** Severity level */
  severity: 'warning' | 'info';
}

/**
 * XSD validation statistics
 */
export interface XSDValidationStatistics {
  /** Total elements validated */
  totalElements: number;
  /** Total attributes validated */
  totalAttributes: number;
  /** Total complex types validated */
  totalComplexTypes: number;
  /** Total simple types validated */
  totalSimpleTypes: number;
  /** Validation duration in milliseconds */
  duration: number;
  /** Memory usage during validation */
  memoryUsage: number;
}

/**
 * Self-validation specific result
 */
export interface XSDDesignIssues {
  /** Design issues found in the schema */
  issues: string[];
  /** Recommendations for improvement */
  recommendations: string[];
  /** Quality score (0-100) */
  qualityScore: number;
}

export interface XSDSchemaSummary {
  /** Number of elements in the schema */
  elementCount: number;
  /** Number of attributes in the schema */
  attributeCount: number;
  /** Number of complex types in the schema */
  complexTypeCount: number;
  /** Number of simple types in the schema */
  simpleTypeCount: number;
  /** Whether the schema has a target namespace */
  hasTargetNamespace: boolean;
  /** Whether the schema has form defaults set */
  hasFormDefaults: boolean;
  /** Number of circular references found */
  circularReferences: number;
  /** Overall quality score (0-100) */
  qualityScore: number;
}

// ============================================================================
// TRAVERSAL TYPES
// ============================================================================

/**
 * XSDAST traversal options
 */
export interface XSDASTTraversalOptions {
  /** Maximum depth to traverse */
  maxDepth?: number;
  /** Whether to include generated nodes */
  includeGenerated?: boolean;
  /** Whether to follow references */
  followReferences?: boolean;
  /** Custom filter function */
  filter?: (node: EnhancedXSDASTNode, context: XSDASTTraversalContext) => boolean;
  /** Custom visitor function */
  visitor?: (node: EnhancedXSDASTNode, context: XSDASTTraversalContext) => void;
  /** Whether to stop on first match */
  stopOnFirst?: boolean;
}

/**
 * XSDAST query options
 */
export interface XSDASTQueryOptions {
  /** Query type */
  type: 'element' | 'attribute' | 'type' | 'all';
  /** Name pattern to match */
  namePattern?: string | RegExp;
  /** Type pattern to match */
  typePattern?: string | RegExp;
  /** Attribute filters */
  attributeFilters?: Record<string, string | RegExp>;
  /** Depth constraints */
  depthConstraints?: {
    min?: number;
    max?: number;
  };
  /** Whether to include children in results */
  includeChildren?: boolean;
  /** Sort options */
  sortBy?: {
    field: 'name' | 'type' | 'depth' | 'path';
    direction: 'asc' | 'desc';
  };
}

// ============================================================================
// GENERATION TYPES
// ============================================================================

/**
 * Recursive XSD generation options
 */
export interface RecursiveXSDGenerationOptions {
  /** Target namespace */
  targetNamespace: string;
  /** Whether to include self-validation */
  includeSelfValidation: boolean;
  /** Maximum recursion depth */
  maxRecursionDepth: number;
  /** Whether to generate comments */
  generateComments: boolean;
  /** Custom type mappings */
  typeMappings?: Record<string, string>;
  /** Validation rules to include */
  validationRules?: XSDValidationRule[];
}

/**
 * XSD validation rule
 */
export interface XSDValidationRule {
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Rule implementation */
  implementation: (node: EnhancedXSDASTNode) => boolean;
  /** Error message if rule fails */
  errorMessage: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * XSDAST node type enumeration
 */
export enum XSDASTNodeType {
  SCHEMA = 'xsd:schema',
  ELEMENT = 'xsd:element',
  COMPLEX_TYPE = 'xsd:complexType',
  SIMPLE_TYPE = 'xsd:simpleType',
  ATTRIBUTE = 'xsd:attribute',
  SEQUENCE = 'xsd:sequence',
  CHOICE = 'xsd:choice',
  ALL = 'xsd:all',
  RESTRICTION = 'xsd:restriction',
  EXTENSION = 'xsd:extension',
  UNION = 'xsd:union',
  LIST = 'xsd:list',
  ANNOTATION = 'xsd:annotation',
  DOCUMENTATION = 'xsd:documentation',
  APPINFO = 'xsd:appinfo'
}

/**
 * XSDAST traversal direction
 */
export enum XSDASTTraversalDirection {
  DEPTH_FIRST = 'depth-first',
  BREADTH_FIRST = 'breadth-first',
  UP = 'up',
  DOWN = 'down'
}

/**
 * XSDAST node relationship
 */
export enum XSDASTNodeRelationship {
  PARENT = 'parent',
  CHILD = 'child',
  SIBLING = 'sibling',
  ANCESTOR = 'ancestor',
  DESCENDANT = 'descendant',
  REFERENCE = 'reference',
  SELF = 'self'
}
