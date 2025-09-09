/**
 * XSDAST Utility Functions
 * 
 * Convenience functions for common XSDAST operations.
 */

import type { XSDAST } from './types';
import type { 
  RecursiveXSDGenerationOptions,
  XSDValidationRule,
  EnhancedXSDASTNode
} from './types';
import { XSDASTTraverser } from './traverser';
import { XSDHelper } from './helper';
import { XSDASTValidator } from './validator';
import { XSDRecursiveGenerator } from './generator';

/**
 * Create an XSDAST traverser from an XSD AST
 */
export function createXSDASTTraverser(xsdAST: XSDAST): XSDASTTraverser {
  return new XSDASTTraverser(xsdAST);
}

/**
 * Create a self-validating XSD schema
 */
export async function createSelfValidatingXSD(
  targetNamespace: string = 'http://example.com/self-validating-schema',
  options: Partial<RecursiveXSDGenerationOptions> = {}
): Promise<string> {
  // Create a minimal XSD AST for the schema structure
  const schemaAST: XSDAST = {
    type: 'xsd:schema',
    name: 'schema',
    attributes: {
      targetNamespace,
      elementFormDefault: 'qualified',
      attributeFormDefault: 'unqualified'
    },
    children: []
  };

  const traverser = createXSDASTTraverser(schemaAST);
  const generator = new XSDRecursiveGenerator(traverser);

  const generationOptions: RecursiveXSDGenerationOptions = {
    targetNamespace,
    includeSelfValidation: true,
    maxRecursionDepth: 10,
    generateComments: true,
    typeMappings: {},
    validationRules: [],
    ...options
  };

  return generator.generateRecursiveXSD(generationOptions);
}

/**
 * Create a validation rule for XSD elements
 */
export function createElementValidationRule(
  name: string,
  description: string,
  errorMessage: string
): XSDValidationRule {
  return {
    name,
    description,
    implementation: (node: EnhancedXSDASTNode) => {
      return node.type === 'xsd:element' && !!node.attributes.name;
    },
    errorMessage
  };
}

/**
 * Create a validation rule for XSD types
 */
export function createTypeValidationRule(
  name: string,
  description: string,
  errorMessage: string
): XSDValidationRule {
  return {
    name,
    description,
    implementation: (node: EnhancedXSDASTNode) => {
      return (node.type === 'xsd:complexType' || node.type === 'xsd:simpleType') && !!node.attributes.name;
    },
    errorMessage
  };
}

/**
 * Create a validation rule for XSD attributes
 */
export function createAttributeValidationRule(
  name: string,
  description: string,
  errorMessage: string
): XSDValidationRule {
  return {
    name,
    description,
    implementation: (node: EnhancedXSDASTNode) => {
      return node.type === 'xsd:attribute' && !!node.attributes.name;
    },
    errorMessage
  };
}

/**
 * Create a validation rule for occurrence constraints
 */
export function createOccurrenceValidationRule(
  name: string,
  description: string,
  errorMessage: string
): XSDValidationRule {
  return {
    name,
    description,
    implementation: (node: EnhancedXSDASTNode) => {
      const minOccurs = node.attributes.minOccurs;
      const maxOccurs = node.attributes.maxOccurs;
      
      if (!minOccurs && !maxOccurs) return true;
      
      const min = minOccurs ? parseInt(minOccurs, 10) : 1;
      const max = maxOccurs === 'unbounded' ? Infinity : (maxOccurs ? parseInt(maxOccurs, 10) : 1);
      
      return !isNaN(min) && min >= 0 && (max === Infinity || (!isNaN(max) && max >= min));
    },
    errorMessage
  };
}

/**
 * Create a validation rule for type references
 */
export function createTypeReferenceValidationRule(
  name: string,
  description: string,
  errorMessage: string,
  validTypes: string[] = []
): XSDValidationRule {
  return {
    name,
    description,
    implementation: (node: EnhancedXSDASTNode) => {
      const typeRef = node.attributes.type;
      if (!typeRef) return true;
      
      // Built-in XSD types
      const builtInTypes = [
        'string', 'boolean', 'decimal', 'float', 'double', 'duration', 'dateTime',
        'time', 'date', 'gYearMonth', 'gYear', 'gMonthDay', 'gDay', 'gMonth',
        'hexBinary', 'base64Binary', 'anyURI', 'QName', 'NOTATION', 'integer',
        'positiveInteger', 'negativeInteger', 'nonPositiveInteger', 'nonNegativeInteger',
        'long', 'int', 'short', 'byte', 'unsignedLong', 'unsignedInt', 'unsignedShort',
        'unsignedByte', 'normalizedString', 'token', 'language', 'Name', 'NCName',
        'ID', 'IDREF', 'IDREFS', 'ENTITY', 'ENTITIES', 'NMTOKEN', 'NMTOKENS'
      ];
      
      const allValidTypes = [...builtInTypes, ...validTypes];
      return allValidTypes.includes(typeRef);
    },
    errorMessage
  };
}

/**
 * Create a validation rule for circular references
 */
export function createCircularReferenceValidationRule(
  name: string,
  description: string,
  errorMessage: string
): XSDValidationRule {
  return {
    name,
    description,
    implementation: (node: EnhancedXSDASTNode) => {
      // This is a simplified check - in practice, you'd need to traverse the tree
      // to detect actual circular references
      return !node.metadata.isSelfReferencing;
    },
    errorMessage
  };
}

/**
 * Get default validation rules
 */
export function getDefaultValidationRules(): XSDValidationRule[] {
  return [
    createElementValidationRule(
      'element-name-required',
      'Element must have a name attribute',
      'Element must have a name attribute'
    ),
    createTypeValidationRule(
      'type-name-required',
      'Type must have a name attribute',
      'Type must have a name attribute'
    ),
    createAttributeValidationRule(
      'attribute-name-required',
      'Attribute must have a name attribute',
      'Attribute must have a name attribute'
    ),
    createOccurrenceValidationRule(
      'occurrence-constraints-valid',
      'Occurrence constraints must be valid',
      'minOccurs must be non-negative and maxOccurs must be positive or unbounded'
    ),
    createTypeReferenceValidationRule(
      'type-reference-valid',
      'Type reference must be valid',
      'Type reference must be a valid built-in or custom type'
    ),
    createCircularReferenceValidationRule(
      'no-circular-references',
      'No circular references allowed',
      'Circular references are not allowed in type definitions'
    )
  ];
}

/**
 * Create a complete XSDAST analysis suite
 */
export function createXSDASTAnalysisSuite(xsdAST: XSDAST) {
  const traverser = createXSDASTTraverser(xsdAST);
  const helper = new XSDHelper(traverser);
  const validator = new XSDASTValidator(traverser);
  const generator = new XSDRecursiveGenerator(traverser);

  return {
    traverser,
    helper,
    validator,
    generator,
    
    // Convenience methods
    async validate() {
      return validator.validate();
    },
    
    async generateSelfValidatingXSD(options: Partial<RecursiveXSDGenerationOptions> = {}) {
      return generator.generateRecursiveXSD({
        targetNamespace: 'http://example.com/self-validating-schema',
        includeSelfValidation: true,
        maxRecursionDepth: 10,
        generateComments: true,
        typeMappings: {},
        validationRules: getDefaultValidationRules(),
        ...options
      });
    },
    
    getStatistics() {
      return traverser.getStatistics();
    },
    
    findElements(namePattern?: string | RegExp) {
      if (namePattern) {
        return traverser.findByName(namePattern);
      }
      return traverser.findAllElements();
    },
    
    findTypes(namePattern?: string | RegExp) {
      if (namePattern) {
        return traverser.findByName(namePattern);
      }
      return [...traverser.findAllComplexTypes(), ...traverser.findAllSimpleTypes()];
    },
    
    findAttributes(namePattern?: string | RegExp) {
      if (namePattern) {
        return traverser.findByName(namePattern);
      }
      return traverser.findAllAttributes();
    }
  };
}

/**
 * Quick validation function
 */
export async function quickValidateXSD(xsdAST: XSDAST): Promise<{
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  summary: string;
}> {
  const suite = createXSDASTAnalysisSuite(xsdAST);
  const result = await suite.validate();
  
  return {
    isValid: result.isValid,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
    summary: `Validation ${result.isValid ? 'passed' : 'failed'}: ${result.errors.length} errors, ${result.warnings.length} warnings`
  };
}

/**
 * Quick self-validating XSD generation
 */
export async function quickGenerateSelfValidatingXSD(
  targetNamespace: string = 'http://example.com/self-validating-schema'
): Promise<string> {
  return createSelfValidatingXSD(targetNamespace, {
    includeSelfValidation: true,
    generateComments: true,
    validationRules: getDefaultValidationRules()
  });
}
