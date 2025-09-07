# xml-introspect

[![npm version](https://img.shields.io/npm/v/xml-introspect.svg)](https://www.npmjs.com/package/xml-introspect)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/fustilio/xml-introspect)

TypeScript library and CLI for analyzing large XML files and generating representative samples.

## Install

```bash
npm install xml-introspect
```

## Quick Start

```typescript
import { XMLIntrospector } from 'xml-introspect';

const introspector = new XMLIntrospector();

await introspector.generateSample('input.xml', 'sample.xml', {
  maxElements: 100,
  maxDepth: 3
});

await introspector.generateSchema('input.xml', 'schema.xsd');
```

## CLI Usage

```bash
xml-introspect sample input.xml output.xml
xml-introspect schema input.xml output.xsd
xml-introspect sample https://en-word.net/static/english-wordnet-2024.xml.gz sample.xml
```

## API

**Core Methods:**
```typescript
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

// Generate realistic data
await introspector.generateRealisticXML('template.xml', 'realistic.xml', {
  seed: 42,
  maxElements: 200
});
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

## Features

- **XML Analysis**: Structure analysis and sampling
- **XSD Generation**: Create schemas from XML
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
