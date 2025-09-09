/**
 * XSDAST Validator
 * 
 * Provides practical validation capabilities for XSD Abstract Syntax Trees,
 * including structural validation, syntax checking, and common issue detection.
 */

import type { 
  EnhancedXSDASTNode, 
  XSDValidationResult,
  XSDValidationError,
  XSDValidationWarning,
  XSDValidationStatistics,
  XSDDesignIssues,
  XSDSchemaSummary,
  XSDValidationRule
} from './types';
import { XSDASTNodeType } from './types';
import { XSDASTTraverser } from './traverser';
import { XSDHelper } from './helper';
import { readFileSync } from 'fs';
import { join } from 'path';

export class XSDASTValidator {
  private traverser: XSDASTTraverser;
  private helper: XSDHelper;
  private validationRules: XSDValidationRule[] = [];

  constructor(traverser: XSDASTTraverser) {
    this.traverser = traverser;
    this.helper = new XSDHelper(traverser);
    this.initializeDefaultRules();
  }

  /**
   * Initialize default validation rules
   */
  private initializeDefaultRules(): void {
    // Rule 1: Schema must have targetNamespace
    this.validationRules.push(this.helper.createValidationRule(
      'schema-target-namespace',
      'Schema must have a targetNamespace attribute',
      (node) => {
        if (node.type === XSDASTNodeType.SCHEMA) {
          return !!node.attributes.targetNamespace;
        }
        return true;
      },
      'Schema element must have a targetNamespace attribute'
    ));

    // Rule 2: Elements must have names
    this.validationRules.push(this.helper.createValidationRule(
      'element-name-required',
      'Element must have a name attribute',
      (node) => {
        if (node.type === XSDASTNodeType.ELEMENT) {
          return !!node.attributes.name;
        }
        return true;
      },
      'Element must have a name attribute'
    ));

    // Rule 3: Complex types must have names
    this.validationRules.push(this.helper.createValidationRule(
      'complex-type-name-required',
      'Complex type must have a name attribute',
      (node) => {
        if (node.type === XSDASTNodeType.COMPLEX_TYPE) {
          return !!node.attributes.name;
        }
        return true;
      },
      'Complex type must have a name attribute'
    ));

    // Rule 4: Simple types must have names
    this.validationRules.push(this.helper.createValidationRule(
      'simple-type-name-required',
      'Simple type must have a name attribute',
      (node) => {
        if (node.type === XSDASTNodeType.SIMPLE_TYPE) {
          return !!node.attributes.name;
        }
        return true;
      },
      'Simple type must have a name attribute'
    ));

    // Rule 5: Attributes must have names
    this.validationRules.push(this.helper.createValidationRule(
      'attribute-name-required',
      'Attribute must have a name attribute',
      (node) => {
        if (node.type === XSDASTNodeType.ATTRIBUTE) {
          return !!node.attributes.name;
        }
        return true;
      },
      'Attribute must have a name attribute'
    ));

    // Rule 6: minOccurs must be non-negative
    this.validationRules.push(this.helper.createValidationRule(
      'min-occurs-non-negative',
      'minOccurs must be non-negative',
      (node) => {
        const minOccurs = node.attributes.minOccurs;
        if (minOccurs) {
          const value = parseInt(minOccurs, 10);
          return !isNaN(value) && value >= 0;
        }
        return true;
      },
      'minOccurs must be a non-negative integer'
    ));

    // Rule 7: maxOccurs must be positive or unbounded
    this.validationRules.push(this.helper.createValidationRule(
      'max-occurs-valid',
      'maxOccurs must be positive or unbounded',
      (node) => {
        const maxOccurs = node.attributes.maxOccurs;
        if (maxOccurs) {
          if (maxOccurs === 'unbounded') return true;
          const value = parseInt(maxOccurs, 10);
          return !isNaN(value) && value > 0;
        }
        return true;
      },
      'maxOccurs must be a positive integer or "unbounded"'
    ));

    // Rule 8: maxOccurs must be >= minOccurs
    this.validationRules.push(this.helper.createValidationRule(
      'max-occurs-gte-min-occurs',
      'maxOccurs must be >= minOccurs',
      (node) => {
        const minOccurs = node.attributes.minOccurs;
        const maxOccurs = node.attributes.maxOccurs;
        if (minOccurs && maxOccurs) {
          const min = parseInt(minOccurs, 10);
          if (maxOccurs === 'unbounded') return true;
          const max = parseInt(maxOccurs, 10);
          return !isNaN(min) && !isNaN(max) && max >= min;
        }
        return true;
      },
      'maxOccurs must be greater than or equal to minOccurs'
    ));

    // Rule 9: Type references must be valid
    this.validationRules.push(this.helper.createValidationRule(
      'type-reference-valid',
      'Type references must be valid',
      (node) => {
        const typeRef = node.attributes.type;
        if (typeRef) {
          // Check if it's a built-in XSD type (with or without prefix)
          const builtInTypes = [
            'string', 'boolean', 'decimal', 'float', 'double', 'duration', 'dateTime',
            'time', 'date', 'gYearMonth', 'gYear', 'gMonthDay', 'gDay', 'gMonth',
            'hexBinary', 'base64Binary', 'anyURI', 'QName', 'NOTATION', 'integer',
            'positiveInteger', 'negativeInteger', 'nonPositiveInteger', 'nonNegativeInteger',
            'long', 'int', 'short', 'byte', 'unsignedLong', 'unsignedInt', 'unsignedShort',
            'unsignedByte', 'normalizedString', 'token', 'language', 'Name', 'NCName',
            'ID', 'IDREF', 'IDREFS', 'ENTITY', 'ENTITIES', 'NMTOKEN', 'NMTOKENS'
          ];
          
          // Check both with and without prefix
          const typeName = typeRef.includes(':') ? typeRef.split(':')[1] : typeRef;
          if (builtInTypes.includes(typeName)) return true;
          
          // Check if it's a custom type defined in the schema
          const customTypes = this.traverser.query({ 
            type: 'type',
            namePattern: typeRef
          }).nodes;
          
          return customTypes.length > 0;
        }
        return true;
      },
      'Type reference must be a valid built-in or custom type'
    ));

    // Rule 10: No circular references in type definitions
    this.validationRules.push(this.helper.createValidationRule(
      'no-circular-type-references',
      'No circular references in type definitions',
      (node) => {
        if (node.type === XSDASTNodeType.COMPLEX_TYPE || node.type === XSDASTNodeType.SIMPLE_TYPE) {
          return !this.helper.hasCircularReferences(node);
        }
        return true;
      },
      'Type definitions cannot have circular references'
    ));
  }

  /**
   * Validate the entire XSD AST
   */
  async validate(): Promise<XSDValidationResult> {
    const startTime = performance.now();
    const errors: XSDValidationError[] = [];
    const warnings: XSDValidationWarning[] = [];
    
    let totalElements = 0;
    let totalAttributes = 0;
    let totalComplexTypes = 0;
    let totalSimpleTypes = 0;

    // Clear previous validation errors
    this.traverser.traverse((node) => {
      this.helper.clearValidationErrors(node);
    });

    // Apply all validation rules
    this.traverser.traverse((node) => {
      // Count node types
      if (node.type === XSDASTNodeType.ELEMENT) totalElements++;
      else if (node.type === XSDASTNodeType.ATTRIBUTE) totalAttributes++;
      else if (node.type === XSDASTNodeType.COMPLEX_TYPE) totalComplexTypes++;
      else if (node.type === XSDASTNodeType.SIMPLE_TYPE) totalSimpleTypes++;

      // Apply validation rules
      for (const rule of this.validationRules) {
        const isValid = this.helper.applyValidationRule(node, rule);
        if (!isValid) {
          errors.push({
            code: rule.name,
            message: rule.errorMessage,
            node,
            severity: 'error',
            suggestion: this.getSuggestion(rule.name)
          });
        }
      }
    });

    // Check for additional structural issues
    this.checkStructuralIssues(errors, warnings);

    // Perform structural validation
    const structuralValidation = this.performStructuralValidation();

    const duration = performance.now() - startTime;
    const memoryUsage = this.getMemoryUsage();

    const statistics: XSDValidationStatistics = {
      totalElements,
      totalAttributes,
      totalComplexTypes,
      totalSimpleTypes,
      duration,
      memoryUsage
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      statistics,
      structuralValidation
    };
  }

  /**
   * Perform structural validation checks
   */
  private performStructuralValidation(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const circularReferences = this.traverser.findCircularReferences();
    const recursiveTypes = this.findRecursiveTypes();
    
    // Check for circular references (common XSD design issue)
    if (circularReferences.length > 0) {
      issues.push(`Found ${circularReferences.length} circular reference(s): ${circularReferences.map(ref => ref.join(' -> ')).join(', ')}`);
    }
    
    // Check for recursive types (not necessarily bad, but worth noting)
    if (recursiveTypes.length > 0) {
      issues.push(`Found ${recursiveTypes.length} recursive type(s): ${recursiveTypes.join(', ')}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Find recursive type definitions
   */
  private findRecursiveTypes(): string[] {
    const recursiveTypes: string[] = [];
    
    this.traverser.traverse((node) => {
      if (node.type === XSDASTNodeType.COMPLEX_TYPE || node.type === XSDASTNodeType.SIMPLE_TYPE) {
        if (node.metadata.isSelfReferencing) {
          recursiveTypes.push(node.name || 'unnamed');
        }
      }
    });

    return recursiveTypes;
  }

  /**
   * Calculate schema quality score based on common best practices
   */
  private calculateQualityScore(): number {
    let score = 0;
    let maxScore = 0;

    // Check for required schema elements
    const root = this.traverser.getRoot();
    if (root.attributes.targetNamespace) score += 20;
    maxScore += 20;

    if (root.attributes.elementFormDefault) score += 10;
    maxScore += 10;

    if (root.attributes.attributeFormDefault) score += 10;
    maxScore += 10;

    // Check for element definitions
    const elements = this.traverser.findAllElements();
    if (elements.length > 0) score += 20;
    maxScore += 20;

    // Check for type definitions
    const complexTypes = this.traverser.findAllComplexTypes();
    const simpleTypes = this.traverser.findAllSimpleTypes();
    if (complexTypes.length > 0 || simpleTypes.length > 0) score += 20;
    maxScore += 20;

    // Check for proper structure
    const hasProperStructure = this.checkProperStructure();
    if (hasProperStructure) score += 20;
    maxScore += 20;

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  /**
   * Check if schema has proper structure
   */
  private checkProperStructure(): boolean {
    const root = this.traverser.getRoot();
    const elements = this.traverser.findAllElements();
    
    // Must have at least one element
    if (elements.length === 0) return false;

    // All elements should have proper type references
    for (const element of elements) {
      const typeRef = element.attributes.type;
      if (typeRef && !this.isValidTypeReference(typeRef)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a type reference is valid
   */
  private isValidTypeReference(typeRef: string): boolean {
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

    if (builtInTypes.includes(typeRef)) return true;

    // Check for custom types
    const customTypes = this.traverser.query({ 
      type: 'type',
      namePattern: typeRef
    }).nodes;

    return customTypes.length > 0;
  }



  /**
   * Check for structural issues
   */
  private checkStructuralIssues(errors: XSDValidationError[], warnings: XSDValidationWarning[]): void {
    // Check for duplicate element names
    const elementNames = new Map<string, EnhancedXSDASTNode[]>();
    this.traverser.traverse((node) => {
      if (node.type === XSDASTNodeType.ELEMENT && node.name) {
        if (!elementNames.has(node.name)) {
          elementNames.set(node.name, []);
        }
        elementNames.get(node.name)!.push(node);
      }
    });

    for (const [name, nodes] of elementNames) {
      if (nodes.length > 1) {
        warnings.push({
          code: 'duplicate-element-name',
          message: `Element name '${name}' is defined ${nodes.length} times`,
          node: nodes[0],
          severity: 'warning'
        });
      }
    }

    // Check for duplicate type names
    const typeNames = new Map<string, EnhancedXSDASTNode[]>();
    this.traverser.traverse((node) => {
      if ((node.type === XSDASTNodeType.COMPLEX_TYPE || node.type === XSDASTNodeType.SIMPLE_TYPE) && node.name) {
        if (!typeNames.has(node.name)) {
          typeNames.set(node.name, []);
        }
        typeNames.get(node.name)!.push(node);
      }
    });

    for (const [name, nodes] of typeNames) {
      if (nodes.length > 1) {
        errors.push({
          code: 'duplicate-type-name',
          message: `Type name '${name}' is defined ${nodes.length} times`,
          node: nodes[0],
          severity: 'error',
          suggestion: 'Ensure each type has a unique name'
        });
      }
    }
  }

  /**
   * Get suggestion for a validation error
   */
  private getSuggestion(ruleName: string): string | undefined {
    const suggestions: Record<string, string> = {
      'schema-target-namespace': 'Add a targetNamespace attribute to the schema element',
      'element-name-required': 'Add a name attribute to the element',
      'complex-type-name-required': 'Add a name attribute to the complex type',
      'simple-type-name-required': 'Add a name attribute to the simple type',
      'attribute-name-required': 'Add a name attribute to the attribute',
      'min-occurs-non-negative': 'Set minOccurs to a non-negative integer',
      'max-occurs-valid': 'Set maxOccurs to a positive integer or "unbounded"',
      'max-occurs-gte-min-occurs': 'Ensure maxOccurs is greater than or equal to minOccurs',
      'type-reference-valid': 'Use a valid built-in or custom type name',
      'no-circular-type-references': 'Remove circular references in type definitions'
    };

    return suggestions[ruleName];
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Add a custom validation rule
   */
  addValidationRule(rule: XSDValidationRule): void {
    this.validationRules.push(rule);
  }

  /**
   * Remove a validation rule
   */
  removeValidationRule(ruleName: string): boolean {
    const index = this.validationRules.findIndex(rule => rule.name === ruleName);
    if (index !== -1) {
      this.validationRules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all validation rules
   */
  getValidationRules(): XSDValidationRule[] {
    return [...this.validationRules];
  }

  /**
   * Validate a specific node
   */
  validateNode(node: EnhancedXSDASTNode): XSDValidationResult {
    const errors: XSDValidationError[] = [];
    const warnings: XSDValidationWarning[] = [];

    // Clear previous validation errors
    this.helper.clearValidationErrors(node);

    // Apply validation rules
    for (const rule of this.validationRules) {
      const isValid = this.helper.applyValidationRule(node, rule);
      if (!isValid) {
        errors.push({
          code: rule.name,
          message: rule.errorMessage,
          node,
          severity: 'error',
          suggestion: this.getSuggestion(rule.name)
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      statistics: {
        totalElements: node.type === XSDASTNodeType.ELEMENT ? 1 : 0,
        totalAttributes: node.type === XSDASTNodeType.ATTRIBUTE ? 1 : 0,
        totalComplexTypes: node.type === XSDASTNodeType.COMPLEX_TYPE ? 1 : 0,
        totalSimpleTypes: node.type === XSDASTNodeType.SIMPLE_TYPE ? 1 : 0,
        duration: 0,
        memoryUsage: 0
      }
    };
  }

  /**
   * Check for common XSD design issues and best practices
   */
  checkDesignIssues(): {
    issues: string[];
    recommendations: string[];
    qualityScore: number;
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check for missing target namespace
    const root = this.traverser.getRoot();
    if (!root.attributes.targetNamespace) {
      issues.push('Schema is missing targetNamespace - this can cause namespace conflicts');
      recommendations.push('Add a targetNamespace attribute to the schema element');
    }
    
    // Check for missing form defaults
    if (!root.attributes.elementFormDefault) {
      recommendations.push('Consider adding elementFormDefault="qualified" for better namespace control');
    }
    
    if (!root.attributes.attributeFormDefault) {
      recommendations.push('Consider adding attributeFormDefault="unqualified" for better namespace control');
    }
    
    // Check for duplicate element names
    const elementNames = new Map<string, number>();
    this.traverser.traverse((node) => {
      if (node.type === XSDASTNodeType.ELEMENT && node.name) {
        elementNames.set(node.name, (elementNames.get(node.name) || 0) + 1);
      }
    });
    
    for (const [name, count] of elementNames) {
      if (count > 1) {
        issues.push(`Element '${name}' is defined ${count} times - this will cause conflicts`);
      }
    }
    
    // Check for duplicate type names
    const typeNames = new Map<string, number>();
    this.traverser.traverse((node) => {
      if ((node.type === XSDASTNodeType.COMPLEX_TYPE || node.type === XSDASTNodeType.SIMPLE_TYPE) && node.name) {
        typeNames.set(node.name, (typeNames.get(node.name) || 0) + 1);
      }
    });
    
    for (const [name, count] of typeNames) {
      if (count > 1) {
        issues.push(`Type '${name}' is defined ${count} times - this will cause conflicts`);
      }
    }
    
    // Check for circular references
    const circularRefs = this.traverser.findCircularReferences();
    if (circularRefs.length > 0) {
      issues.push(`Found ${circularRefs.length} circular reference(s) - this can cause infinite loops`);
      recommendations.push('Consider refactoring to break circular dependencies');
    }
    
    // Check for unused types
    const allTypes = this.traverser.findAllComplexTypes().concat(this.traverser.findAllSimpleTypes());
    const usedTypes = new Set<string>();
    
    this.traverser.traverse((node) => {
      if (node.attributes.type) {
        usedTypes.add(node.attributes.type);
      }
    });
    
    const unusedTypes = allTypes.filter(type => type.name && !usedTypes.has(type.name));
    if (unusedTypes.length > 0) {
      recommendations.push(`Found ${unusedTypes.length} unused type(s) - consider removing them`);
    }
    
    // Calculate quality score
    const qualityScore = this.calculateQualityScore();
    
    return {
      issues,
      recommendations,
      qualityScore
    };
  }

  /**
   * Get a summary of the schema structure and quality
   */
  getSchemaSummary(): {
    elementCount: number;
    attributeCount: number;
    complexTypeCount: number;
    simpleTypeCount: number;
    hasTargetNamespace: boolean;
    hasFormDefaults: boolean;
    circularReferences: number;
    qualityScore: number;
  } {
    const elements = this.traverser.findAllElements();
    const attributes = this.traverser.findAllAttributes();
    const complexTypes = this.traverser.findAllComplexTypes();
    const simpleTypes = this.traverser.findAllSimpleTypes();
    const circularRefs = this.traverser.findCircularReferences();
    
    const root = this.traverser.getRoot();
    const hasTargetNamespace = !!root.attributes.targetNamespace;
    const hasFormDefaults = !!(root.attributes.elementFormDefault && root.attributes.attributeFormDefault);
    
    return {
      elementCount: elements.length,
      attributeCount: attributes.length,
      complexTypeCount: complexTypes.length,
      simpleTypeCount: simpleTypes.length,
      hasTargetNamespace,
      hasFormDefaults,
      circularReferences: circularRefs.length,
      qualityScore: this.calculateQualityScore()
    };
  }
}
