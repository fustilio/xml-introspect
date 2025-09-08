# Getting Started

Get up and running with XML Introspect in minutes.

## Installation

### Prerequisites

- Node.js 16+ 
- npm or pnpm

### Install

```bash
# Using npm
npm install xml-introspect

# Using pnpm
pnpm add xml-introspect

# Global installation for CLI usage
npm install -g xml-introspect
```

## Quick Start

### 1. Sample Large XML Files

```bash
# Create a sample from a large XML file
xml-introspect sample large-file.xml sample.xml

# With custom options
xml-introspect sample large-file.xml sample.xml --max-elements 200 --max-depth 3
```

### 2. Generate XSD Schemas

```bash
# Generate schema from XML
xml-introspect schema data.xml schema.xsd

# With namespace
xml-introspect schema data.xml schema.xsd --namespace "http://example.com/schema"
```

### 3. Process Compressed Files

```bash
# Process gzipped XML directly
xml-introspect sample data.xml.gz output.xml

# Process from URL
xml-introspect sample https://example.com/data.xml.gz output.xml
```

## Library Usage

### Basic XML Processing

```typescript
import { XMLIntrospector } from 'xml-introspect';

const introspector = new XMLIntrospector();

// Generate sample from large XML
await introspector.generateSample('input.xml', 'output.xml', {
  maxElements: 100,
  maxDepth: 3,
  strategy: 'balanced'
});

// Generate XSD schema
await introspector.generateSchema('data.xml', 'schema.xsd', {
  namespace: 'http://example.com/schema'
});
```

### Realistic Data Generation

```typescript
import { XMLFakerGenerator } from 'xml-introspect';

const faker = new XMLFakerGenerator();

// Generate realistic test data
await faker.generateRealisticXML('template.xml', 'realistic.xml', {
  seed: 42,
  maxElements: 200
});

// Generate from XSD schema
await faker.generateFromXSD('schema.xsd', 'generated.xml', {
  maxElements: 500
});
```

### Data Loading and Processing

```typescript
import { FormatProcessor } from 'xml-introspect/data-loader';

const processor = new FormatProcessor();

// Process various formats (gzip, xz, tar, etc.)
const result = await processor.processData(arrayBuffer, {
  projectId: 'my-project',
  enableTarExtraction: true
});

if (result.success) {
  console.log('Processed XML:', result.xmlContent);
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxElements` | number | 100 | Maximum elements to process |
| `maxDepth` | number | 5 | Maximum nesting depth |
| `strategy` | string | 'balanced' | Sampling: 'balanced', 'random', 'first' |
| `namespace` | string | - | Target namespace for schemas |
| `seed` | number | - | Random seed for reproducible results |

## Common Use Cases

```bash
# Analyze large XML structure
xml-introspect sample huge-file.xml sample.xml --max-elements 50
xml-introspect schema sample.xml structure.xsd

# Generate test data
xml-introspect realistic schema.xsd test-data.xml --max-elements 1000

# Validate XML
xml-introspect validate data.xml schema.xsd
```

## Next Steps

- **[CLI Reference](cli-reference.md)** - Complete command documentation
- **[API Reference](api-reference.md)** - Full TypeScript/JavaScript API
- **[Examples](examples/)** - Real-world usage examples
- **[Data Sources](data-sources.md)** - Supported formats and sources
