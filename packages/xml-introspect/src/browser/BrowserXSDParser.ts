import { XSDParser } from '../core/XSDParser.js';
import { XSDAST } from '../xsdast/types.js';

export class BrowserXSDParser extends XSDParser {
  /**
   * Parse an XSD file using browser APIs (OPFS, fetch, etc.)
   */
  async parseXSDFile(filePath: string): Promise<XSDAST> {
    // Try OPFS first if available
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage) {
      try {
        return await this.parseXSDFromOPFS(filePath);
      } catch (error) {
        console.warn('OPFS not available or file not found, falling back to fetch:', error);
      }
    }

    // Fallback to fetch for remote files or if OPFS is not available
    try {
      return await this.parseXSDFromFetch(filePath);
    } catch (error) {
      throw new Error(`Failed to load XSD file from ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse XSD from OPFS (Origin Private File System)
   */
  private async parseXSDFromOPFS(filePath: string): Promise<XSDAST> {
    if (typeof navigator === 'undefined' || !('storage' in navigator) || !('getDirectory' in navigator.storage)) {
      throw new Error('OPFS not available in this browser');
    }

    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(filePath);
    const file = await fileHandle.getFile();
    const content = await file.text();
    
    return this.parseXSDContent(content);
  }

  /**
   * Parse XSD from fetch (for remote files or when OPFS is not available)
   */
  private async parseXSDFromFetch(filePath: string): Promise<XSDAST> {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    return this.parseXSDContent(content);
  }

  /**
   * Parse XSD from a File object (e.g., from file input)
   */
  async parseXSDFromFile(file: File): Promise<XSDAST> {
    const content = await file.text();
    return this.parseXSDContent(content);
  }

  /**
   * Parse XSD from a FileList (e.g., from file input with multiple files)
   */
  async parseXSDFromFileList(fileList: FileList): Promise<XSDAST[]> {
    const results: XSDAST[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type === 'text/xml' || file.name.endsWith('.xsd')) {
        try {
          const xsd = await this.parseXSDFromFile(file);
          results.push(xsd);
        } catch (error) {
          console.warn(`Failed to parse XSD file ${file.name}:`, error);
        }
      }
    }
    
    return results;
  }
}
