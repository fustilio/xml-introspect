# Architecture Overview

XML Introspect is designed with a modular architecture that separates core functionality from environment-specific implementations. This design enables the library to work seamlessly across different JavaScript environments while maintaining code reusability and type safety.

## Module Structure

```
packages/xml-introspect/src/
├── core/           # Shared functionality and abstract classes
├── node/           # Node.js-specific implementations
├── browser/        # Browser-specific implementations
└── cli/            # Command-line interface tools
```

## Core Module

The `core` module contains shared functionality that works across all environments:

- **`XMLAnalyzer`** - Base class for XML analysis functionality
- **`XMLFakerGenerator`** - XML data generation utilities
- **`XSDParser`** - Abstract base class for XSD parsing
- **`types.ts`** - Shared TypeScript type definitions
- **`xast-util-to-xml-pretty.ts`** - XML formatting utilities

### Key Design Principles

- **Environment Agnostic**: Core classes don't depend on Node.js or browser-specific APIs
- **Abstract Interfaces**: Abstract classes define contracts that environment-specific implementations must follow
- **Shared Logic**: Common functionality is centralized to avoid duplication

## Node.js Module

The `node` module provides Node.js-specific implementations with file system access:

- **`XMLIntrospector`** - Full-featured XML introspector with file operations
- **`NodeXMLIntrospector`** - Node.js-specific XML introspector
- **`NodeXSDParser`** - XSD parser with file system access
- **`StreamingXMLIntrospector`** - Memory-efficient streaming implementation

### Features

- File system operations (`fs` module)
- Path resolution (`path` module)
- Streaming support for large files
- Full CLI integration

## Browser Module

The `browser` module provides browser-compatible implementations:

- **`BrowserXMLIntrospector`** - Browser-specific XML introspector
- **`BrowserXSDParser`** - XSD parser for content-based operations
- **`cdn.ts`** - CDN entry point with global exports

### Features

- Content-based operations (no file system access)
- CDN support with UMD/IIFE builds
- WebAssembly integration for XML validation
- Global object exposure for script tags

## Environment-Specific XSDParser

### Abstract Base Class

```typescript
// core/XSDParser.ts
export abstract class XSDParser {
  protected xsdXAST: XSDAST | null = null;

  abstract parseXSDFile(filePath: string): Promise<XSDAST>;
  
  parseXSDContent(content: string): XSDAST {
    // Shared implementation
  }
  
  getElementNames(): string[] {
    // Shared implementation
  }
}
```

### Node.js Implementation

```typescript
// node/NodeXSDParser.ts
export class NodeXSDParser extends XSDParser {
  async parseXSDFile(filePath: string): Promise<XSDAST> {
    const content = readFileSync(filePath, 'utf8');
    return this.parseXSDContent(content);
  }
}
```

### Browser Implementation

```typescript
// browser/BrowserXSDParser.ts
export class BrowserXSDParser extends XSDParser {
  async parseXSDFile(_filePath: string): Promise<XSDAST> {
    throw new Error('File system operations not supported in browser');
  }
}
```

## XSD Validation Architecture

The XSD validation system is built on top of the XSDAST (XSD Abstract Syntax Tree) module, providing comprehensive validation and quality analysis capabilities.

### XSDAST Module Structure

```
src/xsdast/
├── types.ts          # XSD type definitions and interfaces
├── traverser.ts      # Tree traversal and querying utilities
├── validator.ts      # XSD validation and quality analysis
├── helper.ts         # Common XSD manipulation functions
├── generator.ts      # Recursive XSD generation utilities
└── utils.ts          # Utility functions
```

### XSDASTValidator Class

The `XSDASTValidator` class provides practical XSD validation capabilities:

```typescript
// validator.ts
export class XSDASTValidator {
  private traverser: XSDASTTraverser;
  private helper: XSDHelper;
  private validationRules: XSDValidationRule[] = [];

  constructor(traverser: XSDASTTraverser) {
    this.traverser = traverser;
    this.helper = new XSDHelper(traverser);
    this.initializeDefaultRules();
  }

  async validate(): Promise<XSDValidationResult> {
    // Comprehensive validation logic
  }

  checkDesignIssues(): XSDDesignIssues {
    // Design issue detection
  }

  getSchemaSummary(): XSDSchemaSummary {
    // Schema analysis
  }
}
```

### Validation Features

- **Structural Validation**: Checks XSD syntax and structure
- **Design Issue Detection**: Identifies common XSD problems
- **Quality Scoring**: Rates schema completeness (0-100)
- **Best Practice Recommendations**: Suggests improvements
- **Schema Analysis**: Provides detailed structure summaries

### Integration with Core Module

The XSD validation system integrates with the core XSD parsing functionality:

```typescript
// Parse XSD and create validator
const xsdAST = await parser.parseXSDFile('schema.xsd');
const traverser = new XSDASTTraverser(xsdAST);
const validator = new XSDASTValidator(traverser);

// Validate and analyze
const validationResult = await validator.validate();
const designIssues = validator.checkDesignIssues();
const summary = validator.getSchemaSummary();
```

## Build Configuration

### Vite Configuration

The project uses Vite for building with environment-specific configurations:

- **`vite.config.ts`** - Base configuration
- **`vite.browser.config.ts`** - Browser-specific build
- **`vite.cdn.config.ts`** - CDN build (UMD/IIFE)
- **`vite.cli.config.ts`** - CLI build

### Entry Points

- **`index.ts`** - Main entry point (Node.js)
- **`browser/index.ts`** - Browser entry point
- **`browser/cdn.ts`** - CDN entry point
- **`cli/index.ts`** - CLI entry point

## Import Strategy

### Direct Imports

Instead of using complex factory patterns, the library uses direct imports that leverage bundler tree-shaking:

```typescript
// Node.js usage
import { XMLIntrospector, NodeXSDParser } from 'xml-introspect';

// Browser usage
import { BrowserXMLIntrospector, BrowserXSDParser } from 'xml-introspect/browser';
```

### CDN Usage

```html
<script src="https://cdn.jsdelivr.net/npm/xml-introspect@latest/dist/xml-introspect.umd.js"></script>
<script>
  // Global XMLIntrospect object available
  const result = await XMLIntrospect.analyzeXML(xmlContent);
</script>
```

## Benefits of This Architecture

### 1. **Environment Compatibility**
- Node.js gets full file system access
- Browser gets content-based operations
- CDN provides global object access

### 2. **Code Reusability**
- Shared logic in core module
- Environment-specific implementations extend base classes
- No code duplication

### 3. **Type Safety**
- Abstract classes enforce consistent interfaces
- TypeScript provides compile-time checking
- Environment-specific types prevent misuse

### 4. **Bundle Optimization**
- Tree-shaking removes unused code
- Environment-specific builds are optimized
- CDN builds include only necessary functionality

### 5. **Maintainability**
- Clear separation of concerns
- Easy to add new environment support
- Shared functionality is centralized

## Future Extensions

This architecture supports future enhancements:

- **OPFS Support**: Browser file system access via Origin Private File System
- **Web Workers**: Background processing for large files
- **Service Workers**: Offline XML processing
- **Deno Support**: Additional environment-specific implementation

## Migration Guide

### From Monolithic to Modular

1. **Update Imports**: Use environment-specific imports
2. **Choose Implementation**: Select appropriate XSDParser for your environment
3. **Update Builds**: Use environment-specific build configurations
4. **Test Compatibility**: Verify functionality in target environment

### Example Migration

```typescript
// Before (monolithic)
import { XMLIntrospector } from 'xml-introspect';

// After (modular)
// Node.js
import { XMLIntrospector, NodeXSDParser } from 'xml-introspect';

// Browser
import { BrowserXMLIntrospector, BrowserXSDParser } from 'xml-introspect/browser';
```

This architecture provides a solid foundation for XML processing across different JavaScript environments while maintaining simplicity and performance.
