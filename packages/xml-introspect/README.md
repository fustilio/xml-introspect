# @fustilio/xml-introspect

[![npm version](https://img.shields.io/npm/v/@fustilio/xml-introspect.svg)](https://www.npmjs.com/package/@fustilio/xml-introspect)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/fustilio/xml-introspect)

A TypeScript library and CLI tool for analyzing large XML files and generating representative samples.

## Installation

```bash
npm install @fustilio/xml-introspect
```

## Quick Start

```typescript
import { XMLIntrospector } from '@fustilio/xml-introspect';

const introspector = new XMLIntrospector();

// Generate sample
await introspector.generateSample('input.xml', 'sample.xml', {
  maxElements: 100,
  maxDepth: 3
});

// Generate schema
await introspector.generateSchema('input.xml', 'schema.xsd');
```

## CLI Usage

```bash
# Generate sample
xml-introspect sample input.xml output.xml

# Generate schema
xml-introspect schema input.xml output.xsd

# Process real data
xml-introspect sample https://en-word.net/static/english-wordnet-2024.xml.gz sample.xml
```

## API Reference

### Core Methods

```typescript
// Analyze XML structure
const analysis = await introspector.analyzeStructure('input.xml');

// Generate sample with options
await introspector.generateSample('input.xml', 'output.xml', {
  maxElements: 100,
  maxDepth: 3,
  strategy: 'balanced'
});

// Generate XSD schema
await introspector.generateSchema('input.xml', 'schema.xsd', {
  namespace: 'http://example.com/schema'
});

// Validate XML
const isValid = await introspector.validateXML('data.xml', 'schema.xsd');

// Generate realistic data
await introspector.generateRealisticXML('template.xml', 'realistic.xml', {
  seed: 42,
  maxElements: 200
});
```

### Data Processing

```typescript
import { FormatProcessor } from '@fustilio/xml-introspect/data-loader';

const processor = new FormatProcessor();
const result = await processor.processData(arrayBuffer, {
  projectId: 'oewn:2024',
  enableTarExtraction: true
});
```

## Configuration

```typescript
interface SamplingOptions {
  maxElements?: number;        // Default: 100
  maxDepth?: number;          // Default: 5
  strategy?: 'balanced' | 'random' | 'first';
  preserveAllTypes?: boolean;
}

interface SchemaOptions {
  namespace?: string;
  elementForm?: 'qualified' | 'unqualified';
  attributeForm?: 'qualified' | 'unqualified';
}
```

## Features

- **XML Analysis**: Structure analysis and sampling
- **XSD Generation**: Create schemas from XML
- **Real Data**: Process WordNet LMF files
- **Memory Efficient**: Streams large files
- **TypeScript**: Full type safety

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build
```

## License

MIT - see [LICENSE](../../LICENSE) file.

---

<details>
<summary>📖 Detailed API Documentation</summary>

## Advanced API

### XMLIntrospector Class

```typescript
class XMLIntrospector {
  // Core analysis
  analyzeStructure(filePath: string, options?: AnalysisOptions): Promise<StructureAnalysis>
  
  // Sampling and generation
  generateSample(inputPath: string, outputPath: string, options?: SamplingOptions): Promise<void>
  generateSchema(inputPath: string, outputPath: string, options?: SchemaOptions): Promise<void>
  generateRealisticXML(inputPath: string, outputPath: string, options?: FakerOptions): Promise<void>
  
  // Validation and processing
  validateXML(xmlPath: string, schemaPath: string): Promise<boolean>
  performRoundtrip(inputPath: string, outputPath: string, options?: RoundtripOptions): Promise<void>
  expandXML(inputPath: string, outputPath: string, options?: ExpansionOptions): Promise<void>
}
```

### XMLFakerGenerator Class

```typescript
class XMLFakerGenerator {
  generateRealisticXML(inputPath: string, outputPath: string, options?: FakerOptions): Promise<void>
  generateFromXSD(xsdPath: string, outputPath: string, options?: FakerOptions): Promise<void>
}
```

### XSDGenerator Class

```typescript
class XSDGenerator {
  generateSchema(inputPath: string, outputPath: string, options?: SchemaOptions): Promise<void>
  parseXSD(xsdPath: string): Promise<XASTStructure>
}
```

## Real Data Processing

### Supported Formats

- **Gzip**: GNU zip compression
- **XZ**: XZ compression with LZMA2
- **Tar**: Tape archive format
- **XML**: Direct XML processing

### Data Sources

- **WordNet LMF**: English, French, German, and 30+ other languages
- **CILI**: Collaborative Interlingual Index
- **Open Multilingual WordNet (OMW)**: Multi-language lexical resources
- **Open WordNets (OWN)**: Community-driven wordnets

## Performance

- **Memory Usage**: Streams files to handle any size
- **Processing Speed**: Optimized for large XML files (100MB+)
- **Real Data**: Successfully processes 1.6M+ line WordNet files

## Examples

### WordNet LMF Processing

```typescript
// Process WordNet LMF file
await introspector.generateSample('oewn.xml', 'oewn-sample.xml', {
  maxElements: 200,
  strategy: 'balanced'
});

// Generate schema
await introspector.generateSchema('oewn.xml', 'oewn-schema.xsd');
```

### Realistic Data Generation

```typescript
import { XMLFakerGenerator } from '@fustilio/xml-introspect';

const faker = new XMLFakerGenerator();

await faker.generateRealisticXML('template.xml', 'realistic.xml', {
  seed: 42,
  maxElements: 100,
  customGenerators: {
    'lemma': (faker) => faker.word.noun(),
    'definition': (faker) => faker.lorem.sentence()
  }
});
```

### Data Processing from URLs

```typescript
import { FormatProcessor } from '@fustilio/xml-introspect/data-loader';

const processor = new FormatProcessor();

// Download and process real data
const response = await fetch('https://en-word.net/static/english-wordnet-2024.xml.gz');
const arrayBuffer = await response.arrayBuffer();

const result = await processor.processData(arrayBuffer, {
  projectId: 'oewn:2024',
  enableTarExtraction: true
});

if (result.success) {
  console.log('Processed XML:', result.xmlContent);
}
```

</details>