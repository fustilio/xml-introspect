# xml-introspect

[![npm version](https://img.shields.io/npm/v/xml-introspect.svg)](https://www.npmjs.com/package/xml-introspect)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/fustilio/xml-introspect)

TypeScript library and CLI for analyzing large XML files and generating representative samples. **Now with complete feature parity between Node.js and Browser environments!** 🎯

## Install

```bash
npm install xml-introspect
```

## Quick Start

### Node.js

```typescript
import { XMLIntrospector, NodeXSDParser } from 'xml-introspect';

const introspector = new XMLIntrospector();
const xsdParser = new NodeXSDParser();

await introspector.generateSample('input.xml', 'sample.xml', {
  maxElements: 100,
  maxDepth: 3
});

await introspector.generateSchema('input.xml', 'schema.xsd');

// Parse XSD file
const xsdAST = await xsdParser.parseXSDFile('schema.xsd');
```

### Browser

```typescript
import { BrowserXMLIntrospector, BrowserXSDParser } from 'xml-introspect/browser';

const introspector = new BrowserXMLIntrospector();
const xsdParser = new BrowserXSDParser();

// 🆕 XSD Generation (now available in browser!)
const xsd = await introspector.generateXSDFromXML(xmlContent);

// 🆕 Sample Generation (now available in browser!)
const sample = await introspector.generateSample(xmlContent, {
  maxElements: 100,
  strategy: 'balanced'
});

// 🆕 Compressed File Processing (now available in browser!)
const result = await introspector.processCompressedURL('data.xml.gz');
const analysis = await introspector.analyzeCompressedURL('archive.tar.gz');

// Analyze XML content
const analysis = await introspector.analyzeContent(xmlContent);

// Analyze XSD content
const xsdAnalysis = await introspector.analyzeXSDContent(xsdContent);
```

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/xml-introspect@latest/dist/xml-introspect.umd.js"></script>
<script>
  const analysis = await XMLIntrospect.analyzeXML(xmlContent);
  const preview = XMLIntrospect.previewXML(xmlContent, 10);
</script>
```

## CLI Usage

```bash
xml-introspect sample input.xml output.xml
xml-introspect schema input.xml output.xsd
xml-introspect sample https://en-word.net/static/english-wordnet-2024.xml.gz sample.xml
```

## API

### Node.js API

**Core Methods:**
```typescript
import { XMLIntrospector, NodeXSDParser } from 'xml-introspect';

const introspector = new XMLIntrospector();
const xsdParser = new NodeXSDParser();

// Analyze structure
const analysis = await introspector.analyzeStructure('input.xml');

// Generate sample
await introspector.generateSample('input.xml', 'output.xml', {
  maxElements: 100,
  maxDepth: 3,
  strategy: 'balanced'
});

// Generate schema
await introspector.generateSchema('input.xml', 'schema.xsd', {
  namespace: 'http://example.com/schema'
});

// Validate XML
const isValid = await introspector.validateXML('data.xml', 'schema.xsd');

// Parse XSD file
const xsdAST = await xsdParser.parseXSDFile('schema.xsd');
```

### Browser API

**Browser Methods:**
```typescript
import { BrowserXMLIntrospector, BrowserXSDParser } from 'xml-introspect/browser';

const introspector = new BrowserXMLIntrospector();
const xsdParser = new BrowserXSDParser();

// Analyze XML content
const analysis = await introspector.analyzeContent(xmlContent);

// Analyze XSD content
const xsdAnalysis = await introspector.analyzeXSDContent(xsdContent);

// Generate sample XML
const sampleXML = introspector.generateSampleXML(100);

// Generate XML from XSD
const generatedXML = introspector.generateXMLFromXSD(xsdContent);

// Process compressed files from URLs
const result = await introspector.processCompressedURL('https://example.com/data.xml.gz');
const analysis = await introspector.analyzeCompressedURL('https://example.com/data.tar.gz');
const sample = await introspector.generateSampleFromCompressedURL('https://example.com/data.xml.gz', 100);
```

### CDN API

**Global Methods:**
```javascript
// Available on window.XMLIntrospect
const analysis = await XMLIntrospect.analyzeXML(xmlContent);
const preview = XMLIntrospect.previewXML(xmlContent, 10);
const validation = await XMLIntrospect.validateXML(xmlContent);
const xsdAnalysis = await XMLIntrospect.analyzeXSD(xsdContent);

// Process compressed files from URLs
const result = await XMLIntrospect.processCompressedURL('https://example.com/data.xml.gz');
const analysis = await XMLIntrospect.analyzeCompressedURL('https://example.com/data.tar.gz');
const sample = await XMLIntrospect.generateSampleFromCompressedURL('https://example.com/data.xml.gz', 100);
```

**Data Processing:**
```typescript
import { FormatProcessor } from 'xml-introspect/data-loader';

const processor = new FormatProcessor();
const result = await processor.processData(arrayBuffer, {
  projectId: 'oewn:2024',
  enableTarExtraction: true
});
```

## Options

**Sampling:**
- `maxElements` - Max elements (default: 100)
- `maxDepth` - Max depth (default: 5)
- `strategy` - 'balanced', 'random', or 'first'

**Schema:**
- `namespace` - Target namespace
- `elementForm` - 'qualified' or 'unqualified'

## Feature Availability

> 🎯 **Complete Feature Parity Achieved!** All core XML processing features are now available in both Node.js and Browser environments.

| Feature | CLI | Node.js | Browser/CDN |
|---------|-----|---------|------------|
| **XML Analysis** |
| Analyze XML structure | ✅ | ✅ | ✅ |
| Content preview | ✅ | ✅ | ✅ |
| XML validation | ✅ | ✅ | ✅ |
| **XSD Operations** |
| Generate XSD from XML | ✅ | ✅ | ✅ |
| Analyze XSD content | ✅ | ✅ | ✅ |
| Generate XML from XSD | ✅ | ✅ | ✅ |
| Validate XML against XSD | ✅ | ✅ | ✅ |
| **XML Generation** |
| Generate sample XML | ✅ | ✅ | ✅ |
| Generate realistic XML | ✅ | ✅ | ✅ |
| Expand small XML to large | ✅ | ✅ | ✅ |
| **File Operations** |
| Process local files | ✅ | ✅ | ❌ |
| Process URLs/remote files | ✅ | ✅ | ✅ |
| Process compressed files (.gz, .tar, etc.) | ✅ | ✅ | ✅ |
| Multi-file processing (archives) | ✅ | ✅ | ✅ |
| **Advanced Features** |
| Streaming for large files | ✅ | ✅ | ❌ |
| Roundtrip XML processing | ✅ | ✅ | ✅ |
| Element search/filtering | ✅ | ✅ | ✅ |
| Structure transformation | ✅ | ✅ | ❌ |

## 🆕 New in v0.5.0: Complete Browser Feature Parity

This release achieves the primary goal of enabling all advanced XML processing features in the browser environment:

### ✨ New Browser Capabilities

- **XSD Generation**: Generate XSD schemas directly in the browser
- **Advanced Sample Generation**: Create representative XML samples with multiple strategies
- **Compressed File Processing**: Handle .gz, .tar, .xz files and multi-file archives
- **XML Validation**: Validate XML against XSD schemas
- **Element Search & Filtering**: Find and filter XML elements programmatically
- **Roundtrip Processing**: XML → XAST → XML transformations

### 🚀 Browser API Examples

```typescript
import { BrowserXMLIntrospector } from 'xml-introspect/browser';

const introspector = new BrowserXMLIntrospector();

// Generate XSD from XML (NEW!)
const xsd = await introspector.generateXSDFromXML(xmlContent);

// Process compressed files (NEW!)
const result = await introspector.processCompressedURL('data.xml.gz');

// Advanced sample generation (NEW!)
const sample = await introspector.generateSample(xmlContent, {
  maxElements: 100,
  strategy: 'balanced',
  preserveAllTypes: true
});

// XML validation (NEW!)
const validation = await introspector.validateXML(xmlContent, xsdContent);
```

## 🆕 XSD Validation & Quality Analysis

The library now includes comprehensive XSD validation capabilities:

```typescript
import { XSDASTValidator, XSDASTTraverser } from 'xml-introspect/xsdast';

// Parse XSD and create validator
const traverser = new XSDASTTraverser(xsdAST);
const validator = new XSDASTValidator(traverser);

// Validate XSD structure
const validationResult = await validator.validate();
console.log('Valid:', validationResult.isValid);
console.log('Errors:', validationResult.errors);

// Check for design issues
const designIssues = validator.checkDesignIssues();
console.log('Issues:', designIssues.issues);
console.log('Recommendations:', designIssues.recommendations);
console.log('Quality Score:', designIssues.qualityScore);

// Get schema summary
const summary = validator.getSchemaSummary();
console.log('Elements:', summary.elementCount);
console.log('Types:', summary.complexTypeCount + summary.simpleTypeCount);
console.log('Has Target Namespace:', summary.hasTargetNamespace);
```

### XSD Validation Features

- **Structural Validation**: Checks XSD syntax and structure
- **Design Issue Detection**: Identifies common XSD problems
- **Quality Scoring**: Rates schema completeness (0-100)
- **Best Practice Recommendations**: Suggests improvements
- **Schema Analysis**: Provides detailed structure summaries

## Features

- **XML Analysis**: Structure analysis and sampling
- **XSD Generation**: Create schemas from XML
- **XSD Validation**: Comprehensive XSD quality analysis and validation
- **Real Data**: Process WordNet LMF files
- **Memory Efficient**: Streams large files
- **TypeScript**: Full type safety

## Development

```bash
pnpm install
pnpm test
pnpm build
```

## License

MIT - see [LICENSE](../../LICENSE)
