/**
 * XSDAST Traverser
 * 
 * Provides comprehensive tree traversal and querying capabilities for XSD Abstract Syntax Trees.
 */

import type { XSDAST } from './types';
import type { 
  EnhancedXSDASTNode, 
  XSDASTTraversalContext, 
  XSDASTTraversalOptions, 
  XSDASTQueryOptions, 
  XSDASTQueryResult
} from './types';
import { 
  XSDASTNodeType,
  XSDASTTraversalDirection,
  XSDASTNodeRelationship
} from './types';

export class XSDASTTraverser {
  private root: EnhancedXSDASTNode;
  private nodeMap: Map<string, EnhancedXSDASTNode> = new Map();
  private idCounter = 0;

  constructor(xsdAST: XSDAST) {
    this.root = this.enhanceNode(xsdAST, null, 0, []);
    this.buildNodeMap();
  }

  /**
   * Enhance a basic XSDAST node with additional metadata
   */
  private enhanceNode(
    node: XSDAST, 
    parent: EnhancedXSDASTNode | null, 
    depth: number, 
    path: string[]
  ): EnhancedXSDASTNode {
    const id = `node_${this.idCounter++}`;
    const currentPath = [...path, node.name || 'unnamed'];
    
    const enhanced: EnhancedXSDASTNode = {
      type: node.type,
      name: node.name,
      attributes: node.attributes,
      children: [],
      text: node.text,
      parent: parent || undefined,
      id,
      depth,
      path: currentPath.join('.'),
      isLeaf: !node.children || node.children.length === 0,
      isRoot: parent === null,
      metadata: {
        isGenerated: false,
        validationStatus: 'unknown',
        validationErrors: [],
        dependencies: [],
        isSelfReferencing: false
      }
    };

    // Process children
    if (node.children) {
      enhanced.children = node.children.map((child: XSDAST) => 
        this.enhanceNode(child, enhanced, depth + 1, currentPath)
      );
    }

    return enhanced;
  }

  /**
   * Build a map of all nodes for quick lookup
   */
  private buildNodeMap(): void {
    this.traverse((node) => {
      this.nodeMap.set(node.id, node);
    });
  }

  /**
   * Get the root node
   */
  getRoot(): EnhancedXSDASTNode {
    return this.root;
  }

  /**
   * Get a node by ID
   */
  getNodeById(id: string): EnhancedXSDASTNode | undefined {
    return this.nodeMap.get(id);
  }

  /**
   * Find all nodes of a specific type
   */
  findByType(type: XSDASTNodeType): EnhancedXSDASTNode[] {
    return this.query({ type: 'all' }).nodes.filter(node => node.type === type);
  }

  /**
   * Find all elements
   */
  findAllElements(): EnhancedXSDASTNode[] {
    return this.findByType(XSDASTNodeType.ELEMENT);
  }

  /**
   * Find all complex types
   */
  findAllComplexTypes(): EnhancedXSDASTNode[] {
    return this.findByType(XSDASTNodeType.COMPLEX_TYPE);
  }

  /**
   * Find all simple types
   */
  findAllSimpleTypes(): EnhancedXSDASTNode[] {
    return this.findByType(XSDASTNodeType.SIMPLE_TYPE);
  }

  /**
   * Find all attributes
   */
  findAllAttributes(): EnhancedXSDASTNode[] {
    return this.findByType(XSDASTNodeType.ATTRIBUTE);
  }

  /**
   * Find nodes by name pattern
   */
  findByName(namePattern: string | RegExp): EnhancedXSDASTNode[] {
    const pattern = typeof namePattern === 'string' ? new RegExp(namePattern) : namePattern;
    return this.query({ 
      type: 'all',
      namePattern: pattern
    }).nodes;
  }

  /**
   * Find nodes by path
   */
  findByPath(path: string): EnhancedXSDASTNode[] {
    return this.query({ type: 'all' }).nodes.filter(node => 
      node.path === path || node.path.endsWith('.' + path)
    );
  }

  /**
   * Find nodes by attribute value
   */
  findByAttribute(attributeName: string, value: string | RegExp): EnhancedXSDASTNode[] {
    const pattern = typeof value === 'string' ? new RegExp(value) : value;
    return this.query({ 
      type: 'all',
      attributeFilters: { [attributeName]: pattern }
    }).nodes;
  }

  /**
   * Find elements by type reference
   */
  findByTypeReference(typeName: string): EnhancedXSDASTNode[] {
    return this.findByAttribute('type', typeName);
  }

  /**
   * Find self-referencing nodes
   */
  findSelfReferencing(): EnhancedXSDASTNode[] {
    return this.query({ type: 'all' }).nodes.filter(node => 
      node.metadata.isSelfReferencing
    );
  }

  /**
   * Find circular references
   */
  findCircularReferences(): string[][] {
    const circularRefs: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: EnhancedXSDASTNode, path: string[]): void => {
      if (recursionStack.has(node.id)) {
        circularRefs.push([...path, node.id]);
        return;
      }

      if (visited.has(node.id)) {
        return;
      }

      visited.add(node.id);
      recursionStack.add(node.id);

      for (const child of node.children as EnhancedXSDASTNode[]) {
        dfs(child, [...path, node.id]);
      }

      recursionStack.delete(node.id);
    };

    dfs(this.root, []);
    return circularRefs;
  }

  /**
   * Get all leaf nodes
   */
  getLeafNodes(): EnhancedXSDASTNode[] {
    return this.query({ type: 'all' }).nodes.filter(node => node.isLeaf);
  }

  /**
   * Get all root-level elements
   */
  getRootElements(): EnhancedXSDASTNode[] {
    return (this.root.children as EnhancedXSDASTNode[]).filter(child => child.type === XSDASTNodeType.ELEMENT);
  }

  /**
   * Get parent of a node
   */
  getParent(node: EnhancedXSDASTNode): EnhancedXSDASTNode | null {
    return this.findParentRecursive(this.root, node);
  }

  /**
   * Get children of a node
   */
  getChildren(node: EnhancedXSDASTNode): EnhancedXSDASTNode[] {
    return node.children as EnhancedXSDASTNode[];
  }

  /**
   * Get siblings of a node
   */
  getSiblings(node: EnhancedXSDASTNode): EnhancedXSDASTNode[] {
    const parent = this.getParent(node);
    if (!parent) return [];
    
    return (parent.children as EnhancedXSDASTNode[]).filter(child => child.id !== node.id);
  }

  /**
   * Get ancestors of a node
   */
  getAncestors(node: EnhancedXSDASTNode): EnhancedXSDASTNode[] {
    const ancestors: EnhancedXSDASTNode[] = [];
    let current = this.getParent(node);
    
    while (current) {
      ancestors.push(current);
      current = this.getParent(current);
    }
    
    return ancestors;
  }

  /**
   * Get descendants of a node
   */
  getDescendants(node: EnhancedXSDASTNode): EnhancedXSDASTNode[] {
    const descendants: EnhancedXSDASTNode[] = [];
    
    const collectDescendants = (n: EnhancedXSDASTNode): void => {
      for (const child of n.children as EnhancedXSDASTNode[]) {
        descendants.push(child);
        collectDescendants(child);
      }
    };
    
    collectDescendants(node);
    return descendants;
  }

  /**
   * Get depth of a node
   */
  getDepth(node: EnhancedXSDASTNode): number {
    return node.depth;
  }

  /**
   * Get path to a node
   */
  getPath(node: EnhancedXSDASTNode): string {
    return node.path;
  }

  /**
   * Check if one node is ancestor of another
   */
  isAncestor(ancestor: EnhancedXSDASTNode, descendant: EnhancedXSDASTNode): boolean {
    return this.getAncestors(descendant).some(node => node.id === ancestor.id);
  }

  /**
   * Check if one node is descendant of another
   */
  isDescendant(descendant: EnhancedXSDASTNode, ancestor: EnhancedXSDASTNode): boolean {
    return this.isAncestor(ancestor, descendant);
  }

  /**
   * Check if two nodes are siblings
   */
  areSiblings(node1: EnhancedXSDASTNode, node2: EnhancedXSDASTNode): boolean {
    const parent1 = this.getParent(node1);
    const parent2 = this.getParent(node2);
    return parent1 !== null && parent2 !== null && parent1.id === parent2.id;
  }

  /**
   * Get relationship between two nodes
   */
  getRelationship(node1: EnhancedXSDASTNode, node2: EnhancedXSDASTNode): XSDASTNodeRelationship | null {
    if (node1.id === node2.id) return XSDASTNodeRelationship.SELF;
    if (this.isAncestor(node1, node2)) return XSDASTNodeRelationship.ANCESTOR;
    if (this.isAncestor(node2, node1)) return XSDASTNodeRelationship.DESCENDANT;
    if (this.areSiblings(node1, node2)) return XSDASTNodeRelationship.SIBLING;
    if (this.getParent(node1)?.id === node2.id) return XSDASTNodeRelationship.PARENT;
    if (this.getParent(node2)?.id === node1.id) return XSDASTNodeRelationship.CHILD;
    
    return null;
  }

  /**
   * Traverse the tree with custom options
   */
  traverse(
    visitor: (node: EnhancedXSDASTNode, context: XSDASTTraversalContext) => void,
    options: XSDASTTraversalOptions = {}
  ): void {
    const context: XSDASTTraversalContext = {
      depth: 0,
      path: [],
      parent: undefined,
      siblingIndex: 0,
      shouldContinue: true,
      data: new Map()
    };

    this.traverseNode(this.root, visitor, context, options);
  }

  /**
   * Query the tree with specific criteria
   */
  query(options: XSDASTQueryOptions): XSDASTQueryResult {
    const startTime = performance.now();
    const results: EnhancedXSDASTNode[] = [];
    
    const visitor = (node: EnhancedXSDASTNode, context: XSDASTTraversalContext): void => {
      if (this.matchesQuery(node, options)) {
        results.push(node);
      }
    };

    this.traverse(visitor, {
      includeGenerated: options.type === 'all',
      maxDepth: options.depthConstraints?.max
    });

    // Apply sorting if specified
    if (options.sortBy) {
      results.sort((a, b) => {
        const field = options.sortBy!.field;
        const direction = options.sortBy!.direction;
        const aValue = this.getFieldValue(a, field);
        const bValue = this.getFieldValue(b, field);
        
        if (direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    const executionTime = performance.now() - startTime;

    return {
      nodes: results,
      count: results.length,
      executionTime,
      metadata: {
        query: JSON.stringify(options),
        filters: this.extractFilters(options),
        sortBy: options.sortBy?.field
      }
    };
  }

  /**
   * Get statistics about the tree
   */
  getStatistics(): {
    totalNodes: number;
    nodeTypes: Record<string, number>;
    maxDepth: number;
    averageChildrenPerNode: number;
    selfReferencingNodes: number;
    circularReferences: number;
  } {
    const nodeTypes: Record<string, number> = {};
    let maxDepth = 0;
    let totalChildren = 0;
    let selfReferencingNodes = 0;

    this.traverse((node) => {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
      maxDepth = Math.max(maxDepth, node.depth);
      totalChildren += node.children.length;
      if (node.metadata.isSelfReferencing) {
        selfReferencingNodes++;
      }
    });

    const totalNodes = this.nodeMap.size;
    const circularReferences = this.findCircularReferences().length;

    return {
      totalNodes,
      nodeTypes,
      maxDepth,
      averageChildrenPerNode: totalNodes > 0 ? totalChildren / totalNodes : 0,
      selfReferencingNodes,
      circularReferences
    };
  }

  // Private helper methods

  private traverseNode(
    node: EnhancedXSDASTNode,
    visitor: (node: EnhancedXSDASTNode, context: XSDASTTraversalContext) => void,
    context: XSDASTTraversalContext,
    options: XSDASTTraversalOptions
  ): void {
    if (!context.shouldContinue) return;

    // Apply filter if provided
    if (options.filter && !options.filter(node, context)) {
      return;
    }

    // Call visitor
    visitor(node, context);

    // Stop if requested
    if (options.stopOnFirst) {
      context.shouldContinue = false;
      return;
    }

    // Check depth limit
    if (options.maxDepth !== undefined && context.depth >= options.maxDepth) {
      return;
    }

    // Traverse children
    for (let i = 0; i < (node.children as EnhancedXSDASTNode[]).length; i++) {
      const child = (node.children as EnhancedXSDASTNode[])[i];
      const childContext: XSDASTTraversalContext = {
        ...context,
        depth: context.depth + 1,
        path: [...context.path, child.name || 'unnamed'],
        parent: node,
        siblingIndex: i
      };

      this.traverseNode(child, visitor, childContext, options);
    }
  }

  private findParentRecursive(
    current: EnhancedXSDASTNode,
    target: EnhancedXSDASTNode
  ): EnhancedXSDASTNode | null {
    for (const child of current.children as EnhancedXSDASTNode[]) {
      if (child.id === target.id) {
        return current;
      }
      const found = this.findParentRecursive(child, target);
      if (found) return found;
    }
    return null;
  }

  private matchesQuery(node: EnhancedXSDASTNode, options: XSDASTQueryOptions): boolean {
    // Check type filter
    if (options.type !== 'all') {
      const typeMap = {
        element: XSDASTNodeType.ELEMENT,
        attribute: XSDASTNodeType.ATTRIBUTE,
        type: [XSDASTNodeType.COMPLEX_TYPE, XSDASTNodeType.SIMPLE_TYPE]
      };
      
      const expectedType = typeMap[options.type];
      if (Array.isArray(expectedType)) {
        if (!expectedType.includes(node.type as XSDASTNodeType)) return false;
      } else if (node.type !== expectedType) {
        return false;
      }
    }

    // Check name pattern
    if (options.namePattern) {
      const pattern = typeof options.namePattern === 'string' 
        ? new RegExp(options.namePattern) 
        : options.namePattern;
      if (!pattern.test(node.name || '')) return false;
    }

    // Check type pattern
    if (options.typePattern) {
      const pattern = typeof options.typePattern === 'string' 
        ? new RegExp(options.typePattern) 
        : options.typePattern;
      if (!pattern.test(node.type)) return false;
    }

    // Check attribute filters
    if (options.attributeFilters) {
      for (const [attrName, attrValue] of Object.entries(options.attributeFilters)) {
        const nodeValue = node.attributes[attrName];
        if (!nodeValue) return false;
        
        const pattern = typeof attrValue === 'string' 
          ? new RegExp(attrValue) 
          : attrValue;
        if (!pattern.test(nodeValue)) return false;
      }
    }

    // Check depth constraints
    if (options.depthConstraints) {
      if (options.depthConstraints.min !== undefined && node.depth < options.depthConstraints.min) {
        return false;
      }
      if (options.depthConstraints.max !== undefined && node.depth > options.depthConstraints.max) {
        return false;
      }
    }

    return true;
  }

  private getFieldValue(node: EnhancedXSDASTNode, field: string): any {
    switch (field) {
      case 'name': return node.name || '';
      case 'type': return node.type;
      case 'depth': return node.depth;
      case 'path': return node.path;
      default: return '';
    }
  }

  private extractFilters(options: XSDASTQueryOptions): string[] {
    const filters: string[] = [];
    if (options.namePattern) filters.push(`name:${options.namePattern}`);
    if (options.typePattern) filters.push(`type:${options.typePattern}`);
    if (options.attributeFilters) {
      filters.push(`attributes:${Object.keys(options.attributeFilters).join(',')}`);
    }
    if (options.depthConstraints) {
      filters.push(`depth:${options.depthConstraints.min || 0}-${options.depthConstraints.max || '∞'}`);
    }
    return filters;
  }
}
