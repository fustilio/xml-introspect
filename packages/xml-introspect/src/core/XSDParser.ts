import { 
  XSDSchema,
  XSDElement,
  XSDAttribute,
  XSDComplexType,
  XSDSimpleType,
  XSDSequence,
  XSDChoice,
  XSDRestriction,
  XSDAST,
  XSDASTWrapper,
  XSDElementInfo,
  XSDAttributeInfo,
  XSDTypeInfo,
  XSDASTNode,
} from '../xsdast/types.js';
import type { Element as XASTElement } from 'xast';
import { fromXml } from 'xast-util-from-xml';
import { visit, SKIP } from 'unist-util-visit';

export abstract class XSDParser {
  protected xsdXAST: XSDAST | null = null;
  protected elements: Map<string, XSDElementInfo> = new Map();
  protected attributes: Map<string, XSDAttributeInfo> = new Map();
  protected types: Map<string, XSDTypeInfo> = new Map();

  /**
   * Parse an XSD file into a unified XAST structure
   * This method should be implemented by environment-specific subclasses
   */
  abstract parseXSDFile(filePath: string): Promise<XSDAST>;

  /**
   * Parse XSD content string into a unified XAST structure
   */
  parseXSDContent(content: string): XSDAST {
    const xast = fromXml(content);
    let schemaNode: XASTElement | null = null;

    visit(xast, 'element', (node) => {
      const el = node as XASTElement;
      if (el.name === 'xs:schema' || el.name === 'schema') {
        schemaNode = el;
        return SKIP;
      }
    });

    if (!schemaNode) {
      // Fallback for schemas that might not have a schema tag but are valid XSDs
      schemaNode = {
        type: 'element',
        name: 'schema',
        attributes: {},
        children: xast.children?.filter(c => c.type === 'element') as XASTElement[] || []
      };
    }
    
    const convertNode = (xastNode: XASTElement): XSDASTNode => {
      const name = (xastNode.name || '').replace(/xs:/g, '');
      const xsdNode: XSDASTNode = {
        type: `xsd:${name}` as any,
        name: name,
        attributes: (xastNode.attributes || {}) as Record<string, string>,
        children: []
      };

      if (xastNode.children) {
        xsdNode.children = xastNode.children
          .filter(c => c.type === 'element')
          .map(c => convertNode(c as XASTElement));
      }
      return xsdNode;
    };

    const schema: XSDSchema = {
      elements: new Map(),
      complexTypes: new Map(),
      simpleTypes: new Map(),
      namespaces: new Map()
    };
    this.elements.clear();
    this.attributes.clear();
    this.types.clear();

    const extractElementInfo = (xsdElementNode: XSDASTNode): XSDElementInfo => {
      const name = xsdElementNode.attributes.name || xsdElementNode.attributes.ref || '';
      const elementAttributes: XSDAttributeInfo[] = [];
      const elementChildren: XSDElementInfo[] = [];

      const complexTypeNode = xsdElementNode.children?.find(c => c.type === 'xsd:complexType');
      if (complexTypeNode) {
        complexTypeNode.children?.forEach(child => {
          if (child.type === 'xsd:attribute') {
            elementAttributes.push({
              name: child.attributes.name || '',
              type: child.attributes.type || 'string',
              use: (child.attributes.use as 'optional' | 'required' | 'prohibited') || 'optional',
              form: (child.attributes.form as 'qualified' | 'unqualified') || 'unqualified'
            });
          }
        });

        const sequenceNode = complexTypeNode.children?.find(c => c.type === 'xsd:sequence');
        if (sequenceNode) {
          sequenceNode.children?.forEach(child => {
            if (child.type === 'xsd:element') {
              elementChildren.push(extractElementInfo(child));
            }
          });
        }
      }

      return {
        name,
        type: 'element',
        minOccurs: parseInt(xsdElementNode.attributes.minOccurs || '1'),
        maxOccurs: xsdElementNode.attributes.maxOccurs === 'unbounded' ? 'unbounded' : parseInt(xsdElementNode.attributes.maxOccurs || '1'),
        nillable: xsdElementNode.attributes.nillable === 'true',
        attributes: elementAttributes,
        children: elementChildren,
        isComplex: !!complexTypeNode,
        isAbstract: xsdElementNode.attributes.abstract === 'true'
      };
    };
    
    schemaNode.children?.forEach(node => {
      if (node.type === 'element' && (node as XASTElement).name?.includes('element')) {
        const xastElement = node as XASTElement;
        const name = xastElement.attributes?.name || xastElement.attributes?.ref;
        if (name) {
          this.elements.set(name, extractElementInfo(convertNode(xastElement)));

          // Also recursively find nested elements
          visit(node, (childNode: any) => {
            if (childNode.type === 'element' && childNode.name?.includes('element') && childNode.attributes?.name) {
              this.elements.set(childNode.attributes.name, extractElementInfo(convertNode(childNode)));
            }
          });
        }
      }
    });

    const rootNode: XSDASTNode = {
      type: 'xsd:schema',
      name: 'schema',
      attributes: (schemaNode.attributes || {}) as Record<string, string>,
      children: schemaNode.children?.map(child => convertNode(child as XASTElement)) || [],
      text: undefined
    };

    const xsdXAST: XSDASTWrapper = {
      root: rootNode,
      elements: this.elements,
      attributes: this.attributes,
      types: this.types,
      namespaces: new Map(Object.entries(schemaNode.attributes || {}).filter(([k, v]) => (k.startsWith('xmlns') || k === 'targetNamespace') && v != null).map(([k, v]) => [k, v as string])),
      rootElement: this.elements.keys().next().value || null
    };

    this.xsdXAST = xsdXAST as any; // Cast to any for backward compatibility
    return xsdXAST as any; // Cast to any for backward compatibility
  }

  /**
   * Get the parsed XSD XAST
   */
  getXSDXAST(): XSDAST | null {
    return this.xsdXAST;
  }

  /**
   * Get all element names from the XSD
   */
  getElementNames(): string[] {
    if (!this.xsdXAST) return [];
    return Array.from(this.elements.keys());
  }

  /**
   * Get a specific element by name
   */
  getElement(name: string): XSDElementInfo | undefined {
    if (!this.xsdXAST) return undefined;
    return this.elements.get(name);
  }

  /**
   * Get all attribute names from the XSD
   */
  getAttributeNames(): string[] {
    if (!this.xsdXAST) return [];
    return Array.from(this.attributes.keys());
  }

  /**
   * Get a specific attribute by name
   */
  getAttribute(name: string): XSDAttributeInfo | undefined {
    if (!this.xsdXAST) return undefined;
    return this.attributes.get(name);
  }

  /**
   * Validate that an XML structure conforms to the XSD
   */
  validateXMLStructure(xmlElements: string[]): boolean {
    if (!this.xsdXAST) return false;
    
    const xsdElementNames = this.getElementNames();
    return xmlElements.every(element => xsdElementNames.includes(element));
  }

  /**
   * Generate a summary of the XSD structure
   */
  getStructureSummary(): string {
    if (!this.xsdXAST) return 'No XSD loaded';
    
    const elementCount = this.elements.size;
    const attributeCount = this.attributes.size;
    const typeCount = this.types.size;
    const rootElement = this.elements.keys().next().value || 'None';
    
    return `XSD Structure Summary:
 - Root Element: ${rootElement}
 - Elements: ${elementCount}
 - Attributes: ${attributeCount}
 - Types: ${typeCount}`;
  }
}
