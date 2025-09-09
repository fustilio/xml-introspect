# API Reference

Complete TypeScript/JavaScript API documentation for XML Introspect.

## Architecture Overview

XML Introspect is organized into environment-specific modules:

- **`core`** - Shared functionality and abstract classes
- **`node`** - Node.js-specific implementations with file system access
- **`browser`** - Browser-specific implementations with CDN support
- **`cli`** - Command-line interface tools

## Environment-Specific Usage

### Node.js Usage

```typescript
import { XMLIntrospector, NodeXSDParser } from 'xml-introspect';

const introspector = new XMLIntrospector();
const xsdParser = new NodeXSDParser();

// File system operations available
await introspector.generateSample('input.xml', 'output.xml');
await xsdParser.parseXSDFile('schema.xsd');
```

### Browser Usage (CDN)

XML Introspect can be used directly in the browser via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/xml-introspect@latest/dist/xml-introspect.umd.js"></script>
<script>
  // Using the global XMLIntrospect object
  const result = await XMLIntrospect.analyzeXML(xmlContent);
  const preview = XMLIntrospect.previewXML(xmlContent, 10);
  const validation = await XMLIntrospect.validateXML(xmlContent);
</script>
```

### Browser Usage (ES Modules)

```typescript
import { BrowserXMLIntrospector, BrowserXSDParser } from 'xml-introspect/browser';

const introspector = new BrowserXMLIntrospector();
const xsdParser = new BrowserXSDParser();

// Content-based operations (no file system access)
const analysis = await introspector.analyzeContent(xmlContent);
const xsdAnalysis = await introspector.analyzeXSDContent(xsdContent);
```

## XSDParser Classes

### Core XSDParser (Abstract)

Base abstract class for XSD parsing functionality.

```typescript
import { XSDParser } from 'xml-introspect/core';

// Abstract class - use environment-specific implementations
```

### NodeXSDParser

Node.js implementation with file system access.

```typescript
import { NodeXSDParser } from 'xml-introspect/node';

const parser = new NodeXSDParser();

// Parse XSD file from file system
const xsdAST = await parser.parseXSDFile('schema.xsd');

// Parse XSD content directly
const xsdAST = parser.parseXSDContent(xsdContent);

// Get element names
const elementNames = parser.getElementNames();

// Get structure summary
const summary = parser.getStructureSummary();
```

### BrowserXSDParser

Browser implementation for content-based parsing.

```typescript
import { BrowserXSDParser } from 'xml-introspect/browser';

const parser = new BrowserXSDParser();

// Parse XSD content (file system not available in browser)
const xsdAST = parser.parseXSDContent(xsdContent);

// Get element names
const elementNames = parser.getElementNames();

// Get structure summary
const summary = parser.getStructureSummary();
```

## XSD Validation & Quality Analysis

The `XSDASTValidator` class provides comprehensive XSD validation and quality analysis capabilities.

```typescript
import { XSDASTValidator, XSDASTTraverser } from 'xml-introspect/xsdast';

// Create validator from XSD AST
const traverser = new XSDASTTraverser(xsdAST);
const validator = new XSDASTValidator(traverser);
```

### Methods

#### `validate()`

Validate XSD structure and return comprehensive validation results.

```typescript
const result = await validator.validate();
console.log('Valid:', result.isValid);
console.log('Errors:', result.errors);
console.log('Warnings:', result.warnings);
console.log('Statistics:', result.statistics);
```

#### `checkDesignIssues()`

Check for common XSD design issues and provide recommendations.

```typescript
const issues = validator.checkDesignIssues();
console.log('Issues:', issues.issues);
console.log('Recommendations:', issues.recommendations);
console.log('Quality Score:', issues.qualityScore);
```

#### `getSchemaSummary()`

Get detailed summary of schema structure and quality.

```typescript
const summary = validator.getSchemaSummary();
console.log('Elements:', summary.elementCount);
console.log('Types:', summary.complexTypeCount + summary.simpleTypeCount);
console.log('Has Target Namespace:', summary.hasTargetNamespace);
console.log('Circular References:', summary.circularReferences);
console.log('Quality Score:', summary.qualityScore);
```

#### `validateNode(node)`

Validate a specific XSD AST node.

```typescript
const nodeResult = validator.validateNode(elementNode);
console.log('Node Valid:', nodeResult.isValid);
console.log('Node Errors:', nodeResult.errors);
```

### Validation Features

- **Structural Validation**: Checks XSD syntax and structure
- **Design Issue Detection**: Identifies common XSD problems
- **Quality Scoring**: Rates schema completeness (0-100)
- **Best Practice Recommendations**: Suggests improvements
- **Schema Analysis**: Provides detailed structure summaries

## XMLIntrospector

Main class for XML analysis and processing.

```typescript
import { XMLIntrospector } from 'xml-introspect';

const introspector = new XMLIntrospector();
```

### Methods

#### `analyzeStructure(filePath, options?)`

Analyze XML structure and return analysis results.

```typescript
const analysis = await introspector.analyzeStructure('input.xml');
```

#### `generateSample(inputPath, outputPath, options?)`

Generate representative sample from large XML.

```typescript
await introspector.generateSample('input.xml', 'output.xml', {
  maxElements: 100,
  maxDepth: 3,
  strategy: 'balanced'
});
```

#### `generateSchema(inputPath, outputPath, options?)`

Generate XSD schema from XML.

```typescript
await introspector.generateSchema('input.xml', 'schema.xsd', {
  namespace: 'http://example.com/schema'
});
```

#### `validateXML(xmlPath, schemaPath)`

Validate XML against XSD schema.

```typescript
const isValid = await introspector.validateXML('data.xml', 'schema.xsd');
```

#### `generateRealisticXML(inputPath, outputPath, options?)`

Generate realistic test data.

```typescript
await introspector.generateRealisticXML('template.xml', 'realistic.xml', {
  seed: 42,
  maxElements: 200
});
```

## BrowserXMLIntrospector

Browser-specific XML introspector with CDN support.

```typescript
import { BrowserXMLIntrospector } from 'xml-introspect/browser';

const introspector = new BrowserXMLIntrospector();
```

### Methods

#### `analyzeContent(xmlContent)`

Analyze XML content structure.

```typescript
const analysis = await introspector.analyzeContent(xmlContent);
```

#### `analyzeContentStructure(xmlContent)`

Comprehensive analysis including structure, preview, and validation.

```typescript
const analysis = await introspector.analyzeContentStructure(xmlContent);
```

#### `getContentPreview(xmlContent, lines?)`

Get content preview with specified number of lines.

```typescript
const preview = introspector.getContentPreview(xmlContent, 10);
```

#### `validateContent(xmlContent)`

Validate XML content.

```typescript
const validation = await introspector.validateContent(xmlContent);
```

#### `analyzeXSDContent(xsdContent)`

Analyze XSD content structure.

```typescript
const xsdAnalysis = await introspector.analyzeXSDContent(xsdContent);
```

#### `generateSampleXML(elementCount)`

Generate sample XML with specified element count.

```typescript
const sampleXML = introspector.generateSampleXML(100);
```

#### `generateXMLFromXSD(xsdContent)`

Generate XML from XSD content.

```typescript
const generatedXML = introspector.generateXMLFromXSD(xsdContent);
```

## XMLFakerGenerator

Generate realistic test data using Faker.js.

```typescript
import { XMLFakerGenerator } from 'xml-introspect';

const faker = new XMLFakerGenerator();
```

### Methods

#### `generateRealisticXML(inputPath, outputPath, options?)`

Generate realistic XML from template.

```typescript
await faker.generateRealisticXML('template.xml', 'realistic.xml', {
  seed: 42,
  maxElements: 100
});
```

#### `generateFromXSD(xsdPath, outputPath, options?)`

Generate realistic XML from XSD schema.

```typescript
await faker.generateFromXSD('schema.xsd', 'generated.xml', {
  seed: 42,
  maxElements: 200
});
```

## FormatProcessor

Process various compressed formats and archives.

```typescript
import { FormatProcessor } from 'xml-introspect/data-loader';

const processor = new FormatProcessor();
```

### Methods

#### `processData(arrayBuffer, options)`

Process data from various formats.

```typescript
const result = await processor.processData(arrayBuffer, {
  projectId: 'oewn:2024',
  enableTarExtraction: true
});
```

## Options

### SamplingOptions

```typescript
interface SamplingOptions {
  maxElements?: number;        // Default: 100
  maxDepth?: number;          // Default: 5
  strategy?: 'balanced' | 'random' | 'first';
  preserveAllTypes?: boolean;
}
```

### SchemaOptions

```typescript
interface SchemaOptions {
  namespace?: string;
  elementForm?: 'qualified' | 'unqualified';
  attributeForm?: 'qualified' | 'unqualified';
}
```

### FakerOptions

```typescript
interface FakerOptions {
  seed?: number;
  maxElements?: number;
  customGenerators?: Record<string, (faker: any) => string>;
}
```

## Types

### StructureAnalysis

```typescript
interface StructureAnalysis {
  elementCounts: Record<string, number>;
  maxDepth: number;
  totalElements: number;
  uniqueElements: string[];
}
```

### FormatProcessingResult

```typescript
interface FormatProcessingResult {
  success: boolean;
  xmlContent?: string;
  error?: string;
  contentType: 'xml' | 'tar' | 'tsv' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  processingSteps: string[];
  extractedXmlFiles?: ExtractedFile[];
}
```

### Browser Types

#### StandaloneXMLStructure

```typescript
interface StandaloneXMLStructure {
  elementCounts: Record<string, number>;
  attributeCounts: Record<string, number>;
  rootElements: string[];
  commonElements: Array<{ name: string; count: number }>;
  attributes: Array<{ name: string; count: number }>;
  maxDepth: number;
  totalElements: number;
}
```

#### StandaloneContentPreview

```typescript
interface StandaloneContentPreview {
  firstLines: string[];
  lastLines: string[];
  totalLines: number;
  preview: string;
}
```

#### StandaloneValidationResult

```typescript
interface StandaloneValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

#### StandaloneContentAnalysis

```typescript
interface StandaloneContentAnalysis {
  structure: StandaloneXMLStructure;
  preview: StandaloneContentPreview;
  validation: StandaloneValidationResult;
}
```
