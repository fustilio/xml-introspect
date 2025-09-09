/**
 * XSDAST Helper Utilities
 * 
 * Provides common utility functions for working with XSD Abstract Syntax Trees.
 */

import type { 
  EnhancedXSDASTNode, 
  XSDValidationRule
} from './types';
import { 
  XSDASTNodeType,
  XSDASTNodeRelationship
} from './types';
import { XSDASTTraverser } from './traverser';

export class XSDHelper {
  private traverser: XSDASTTraverser;

  constructor(traverser: XSDASTTraverser) {
    this.traverser = traverser;
  }

  /**
   * Get the type of an element node
   */
  getElementType(elementNode: EnhancedXSDASTNode): string | null {
    if (elementNode.type !== XSDASTNodeType.ELEMENT) {
      return null;
    }
    return elementNode.attributes.type || null;
  }

  /**
   * Get the name of a node
   */
  getNodeName(node: EnhancedXSDASTNode): string | null {
    return node.name || null;
  }

  /**
   * Get the namespace of a node
   */
  getNodeNamespace(node: EnhancedXSDASTNode): string | null {
    return node.attributes.targetNamespace || 
           node.attributes['xmlns'] || 
           node.attributes['xmlns:xs'] || 
           null;
  }

  /**
   * Check if a node is a complex type
   */
  isComplexType(node: EnhancedXSDASTNode): boolean {
    return node.type === XSDASTNodeType.COMPLEX_TYPE;
  }

  /**
   * Check if a node is a simple type
   */
  isSimpleType(node: EnhancedXSDASTNode): boolean {
    return node.type === XSDASTNodeType.SIMPLE_TYPE;
  }

  /**
   * Check if a node is an element
   */
  isElement(node: EnhancedXSDASTNode): boolean {
    return node.type === XSDASTNodeType.ELEMENT;
  }

  /**
   * Check if a node is an attribute
   */
  isAttribute(node: EnhancedXSDASTNode): boolean {
    return node.type === XSDASTNodeType.ATTRIBUTE;
  }

  /**
   * Check if a node is a sequence
   */
  isSequence(node: EnhancedXSDASTNode): boolean {
    return node.type === XSDASTNodeType.SEQUENCE;
  }

  /**
   * Check if a node is a choice
   */
  isChoice(node: EnhancedXSDASTNode): boolean {
    return node.type === XSDASTNodeType.CHOICE;
  }

  /**
   * Check if a node is a restriction
   */
  isRestriction(node: EnhancedXSDASTNode): boolean {
    return node.type === XSDASTNodeType.RESTRICTION;
  }

  /**
   * Get the base type of a restriction or extension
   */
  getBaseType(node: EnhancedXSDASTNode): string | null {
    return node.attributes.base || null;
  }

  /**
   * Get the minOccurs value of a node
   */
  getMinOccurs(node: EnhancedXSDASTNode): number {
    const minOccurs = node.attributes.minOccurs;
    return minOccurs ? parseInt(minOccurs, 10) : 1;
  }

  /**
   * Get the maxOccurs value of a node
   */
  getMaxOccurs(node: EnhancedXSDASTNode): number | 'unbounded' {
    const maxOccurs = node.attributes.maxOccurs;
    if (!maxOccurs) return 1;
    return maxOccurs === 'unbounded' ? 'unbounded' : parseInt(maxOccurs, 10);
  }

  /**
   * Check if a node is optional (minOccurs = 0)
   */
  isOptional(node: EnhancedXSDASTNode): boolean {
    return this.getMinOccurs(node) === 0;
  }

  /**
   * Check if a node is required (minOccurs > 0)
   */
  isRequired(node: EnhancedXSDASTNode): boolean {
    return this.getMinOccurs(node) > 0;
  }

  /**
   * Check if a node can occur multiple times (maxOccurs > 1 or unbounded)
   */
  isMultiple(node: EnhancedXSDASTNode): boolean {
    const maxOccurs = this.getMaxOccurs(node);
    return maxOccurs === 'unbounded' || maxOccurs > 1;
  }

  /**
   * Check if a node is nillable
   */
  isNillable(node: EnhancedXSDASTNode): boolean {
    return node.attributes.nillable === 'true';
  }

  /**
   * Check if a node is abstract
   */
  isAbstract(node: EnhancedXSDASTNode): boolean {
    return node.attributes.abstract === 'true';
  }

  /**
   * Get the use attribute of an attribute node
   */
  getAttributeUse(node: EnhancedXSDASTNode): 'optional' | 'required' | 'prohibited' {
    if (node.type !== XSDASTNodeType.ATTRIBUTE) {
      return 'optional';
    }
    return (node.attributes.use as 'optional' | 'required' | 'prohibited') || 'optional';
  }

  /**
   * Check if an attribute is required
   */
  isAttributeRequired(node: EnhancedXSDASTNode): boolean {
    return this.getAttributeUse(node) === 'required';
  }

  /**
   * Get the default value of a node
   */
  getDefaultValue(node: EnhancedXSDASTNode): string | null {
    return node.attributes.default || null;
  }

  /**
   * Get the fixed value of a node
   */
  getFixedValue(node: EnhancedXSDASTNode): string | null {
    return node.attributes.fixed || null;
  }

  /**
   * Get the form attribute of a node
   */
  getForm(node: EnhancedXSDASTNode): 'qualified' | 'unqualified' | null {
    return (node.attributes.form as 'qualified' | 'unqualified') || null;
  }

  /**
   * Get all attributes of a node
   */
  getNodeAttributes(node: EnhancedXSDASTNode): Record<string, string> {
    return { ...node.attributes };
  }

  /**
   * Get a specific attribute value
   */
  getAttributeValue(node: EnhancedXSDASTNode, attributeName: string): string | null {
    return node.attributes[attributeName] || null;
  }

  /**
   * Set an attribute value
   */
  setAttributeValue(node: EnhancedXSDASTNode, attributeName: string, value: string): void {
    node.attributes[attributeName] = value;
  }

  /**
   * Remove an attribute
   */
  removeAttribute(node: EnhancedXSDASTNode, attributeName: string): boolean {
    if (attributeName in node.attributes) {
      delete node.attributes[attributeName];
      return true;
    }
    return false;
  }

  /**
   * Get all child elements of a node
   */
  getChildElements(node: EnhancedXSDASTNode): EnhancedXSDASTNode[] {
    return node.children.filter(child => this.isElement(child));
  }

  /**
   * Get all child attributes of a node
   */
  getChildAttributes(node: EnhancedXSDASTNode): EnhancedXSDASTNode[] {
    return node.children.filter(child => this.isAttribute(child));
  }

  /**
   * Get all child types of a node
   */
  getChildTypes(node: EnhancedXSDASTNode): EnhancedXSDASTNode[] {
    return node.children.filter(child => 
      this.isComplexType(child) || this.isSimpleType(child)
    );
  }

  /**
   * Get all child sequences of a node
   */
  getChildSequences(node: EnhancedXSDASTNode): EnhancedXSDASTNode[] {
    return node.children.filter(child => this.isSequence(child));
  }

  /**
   * Get all child choices of a node
   */
  getChildChoices(node: EnhancedXSDASTNode): EnhancedXSDASTNode[] {
    return node.children.filter(child => this.isChoice(child));
  }

  /**
   * Get all child restrictions of a node
   */
  getChildRestrictions(node: EnhancedXSDASTNode): EnhancedXSDASTNode[] {
    return node.children.filter(child => this.isRestriction(child));
  }

  /**
   * Find a child node by name
   */
  findChildByName(node: EnhancedXSDASTNode, name: string): EnhancedXSDASTNode | null {
    return node.children.find(child => child.name === name) || null;
  }

  /**
   * Find a child node by type
   */
  findChildByType(node: EnhancedXSDASTNode, type: XSDASTNodeType): EnhancedXSDASTNode | null {
    return node.children.find(child => child.type === type) || null;
  }

  /**
   * Add a child node
   */
  addChild(parent: EnhancedXSDASTNode, child: EnhancedXSDASTNode): void {
    child.parent = parent;
    parent.children.push(child);
    parent.isLeaf = false;
  }

  /**
   * Remove a child node
   */
  removeChild(parent: EnhancedXSDASTNode, child: EnhancedXSDASTNode): boolean {
    const index = parent.children.indexOf(child);
    if (index !== -1) {
      parent.children.splice(index, 1);
      child.parent = undefined;
      parent.isLeaf = parent.children.length === 0;
      return true;
    }
    return false;
  }

  /**
   * Clone a node (deep copy)
   */
  cloneNode(node: EnhancedXSDASTNode): EnhancedXSDASTNode {
    const cloned: EnhancedXSDASTNode = {
      ...node,
      id: `cloned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      attributes: { ...node.attributes },
      children: node.children.map(child => this.cloneNode(child)),
      metadata: {
        ...node.metadata,
        isGenerated: true,
        validationErrors: [...node.metadata.validationErrors]
      }
    };

    // Update parent references
    cloned.children.forEach(child => {
      child.parent = cloned;
    });

    return cloned;
  }

  /**
   * Get the depth of a node
   */
  getNodeDepth(node: EnhancedXSDASTNode): number {
    return node.depth;
  }

  /**
   * Get the path to a node
   */
  getNodePath(node: EnhancedXSDASTNode): string {
    return node.path;
  }

  /**
   * Check if a node is a leaf (has no children)
   */
  isLeafNode(node: EnhancedXSDASTNode): boolean {
    return node.isLeaf;
  }

  /**
   * Check if a node is the root
   */
  isRootNode(node: EnhancedXSDASTNode): boolean {
    return node.isRoot;
  }

  /**
   * Get the root element of the schema
   */
  getRootElement(): EnhancedXSDASTNode | null {
    const rootElements = this.traverser.getRootElements();
    return rootElements.length > 0 ? rootElements[0] : null;
  }

  /**
   * Get all root elements
   */
  getAllRootElements(): EnhancedXSDASTNode[] {
    return this.traverser.getRootElements();
  }

  /**
   * Find nodes that reference a specific type
   */
  findReferencesToType(typeName: string): EnhancedXSDASTNode[] {
    return this.traverser.findByTypeReference(typeName);
  }

  /**
   * Find nodes that are self-referencing
   */
  findSelfReferencingNodes(): EnhancedXSDASTNode[] {
    return this.traverser.findSelfReferencing();
  }

  /**
   * Check if a node has circular references
   */
  hasCircularReferences(node: EnhancedXSDASTNode): boolean {
    const circularRefs = this.traverser.findCircularReferences();
    return circularRefs.some(ref => ref.includes(node.id));
  }

  /**
   * Get the schema namespace
   */
  getSchemaNamespace(): string | null {
    const root = this.traverser.getRoot();
    return this.getNodeNamespace(root);
  }

  /**
   * Get the target namespace
   */
  getTargetNamespace(): string | null {
    const root = this.traverser.getRoot();
    return root.attributes.targetNamespace || null;
  }

  /**
   * Get element form default
   */
  getElementFormDefault(): 'qualified' | 'unqualified' | null {
    const root = this.traverser.getRoot();
    return (root.attributes.elementFormDefault as 'qualified' | 'unqualified') || null;
  }

  /**
   * Get attribute form default
   */
  getAttributeFormDefault(): 'qualified' | 'unqualified' | null {
    const root = this.traverser.getRoot();
    return (root.attributes.attributeFormDefault as 'qualified' | 'unqualified') || null;
  }

  /**
   * Create a validation rule
   */
  createValidationRule(
    name: string,
    description: string,
    implementation: (node: EnhancedXSDASTNode) => boolean,
    errorMessage: string
  ): XSDValidationRule {
    return {
      name,
      description,
      implementation,
      errorMessage
    };
  }

  /**
   * Apply a validation rule to a node
   */
  applyValidationRule(node: EnhancedXSDASTNode, rule: XSDValidationRule): boolean {
    try {
      const isValid = rule.implementation(node);
      if (!isValid) {
        node.metadata.validationErrors.push(rule.errorMessage);
        node.metadata.validationStatus = 'invalid';
      }
      return isValid;
    } catch (error) {
      const errorMessage = `Validation rule '${rule.name}' failed: ${error}`;
      node.metadata.validationErrors.push(errorMessage);
      node.metadata.validationStatus = 'invalid';
      return false;
    }
  }

  /**
   * Clear validation errors from a node
   */
  clearValidationErrors(node: EnhancedXSDASTNode): void {
    node.metadata.validationErrors = [];
    node.metadata.validationStatus = 'unknown';
  }

  /**
   * Get validation status of a node
   */
  getValidationStatus(node: EnhancedXSDASTNode): 'valid' | 'invalid' | 'unknown' {
    return node.metadata.validationStatus;
  }

  /**
   * Get validation errors of a node
   */
  getValidationErrors(node: EnhancedXSDASTNode): string[] {
    return [...node.metadata.validationErrors];
  }

  /**
   * Check if a node is valid
   */
  isValid(node: EnhancedXSDASTNode): boolean {
    return node.metadata.validationStatus === 'valid';
  }

  /**
   * Check if a node is invalid
   */
  isInvalid(node: EnhancedXSDASTNode): boolean {
    return node.metadata.validationStatus === 'invalid';
  }

  /**
   * Get a summary of a node
   */
  getNodeSummary(node: EnhancedXSDASTNode): {
    id: string;
    name: string | null;
    type: string;
    path: string;
    depth: number;
    isLeaf: boolean;
    isRoot: boolean;
    childrenCount: number;
    attributesCount: number;
    validationStatus: string;
    validationErrors: string[];
  } {
    return {
      id: node.id,
      name: node.name || null,
      type: node.type,
      path: node.path,
      depth: node.depth,
      isLeaf: node.isLeaf,
      isRoot: node.isRoot,
      childrenCount: node.children.length,
      attributesCount: Object.keys(node.attributes).length,
      validationStatus: node.metadata.validationStatus,
      validationErrors: [...node.metadata.validationErrors]
    };
  }
}
