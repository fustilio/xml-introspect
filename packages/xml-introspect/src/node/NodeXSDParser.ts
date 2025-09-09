import { XSDParser } from '../core/XSDParser.js';
import { XSDAST } from '../xsdast/types.js';
import { readFileSync } from 'fs';

export class NodeXSDParser extends XSDParser {
  /**
   * Parse an XSD file using Node.js file system
   */
  async parseXSDFile(filePath: string): Promise<XSDAST> {
    const content = readFileSync(filePath, 'utf8');
    return this.parseXSDContent(content);
  }
}
