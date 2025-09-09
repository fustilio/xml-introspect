# XML Introspect

[![npm version](https://img.shields.io/npm/v/xml-introspect.svg)](https://www.npmjs.com/package/xml-introspect)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/fustilio/xml-introspect)

Analyze large XML files and generate representative samples with identical structure.

## Quick Start

```bash
npm install xml-introspect

# Sample large XML
xml-introspect sample input.xml output.xml

# Generate schema
xml-introspect schema input.xml output.xsd

# Process from URL
xml-introspect sample https://en-word.net/static/english-wordnet-2024.xml.gz sample.xml
```

## Commands

| Command | Description |
|---------|-------------|
| `sample` | Generate representative sample |
| `schema` | Generate XSD schema |
| `generate` | Generate XML from XSD |
| `validate` | Validate XML against XSD |
| `realistic` | Generate realistic data |

## Library Usage

```typescript
import { XMLIntrospector } from 'xml-introspect';

const introspector = new XMLIntrospector();

await introspector.generateSample('input.xml', 'output.xml', {
  maxElements: 100,
  maxDepth: 3
});

await introspector.generateSchema('input.xml', 'schema.xsd');
```

## Feature Availability

| Feature | CLI | Node.js | Browser/CDN |
|---------|-----|---------|------------|
| **XML Analysis** |
| Analyze XML structure | ✅ | ✅ | ✅ |
| Content preview | ✅ | ✅ | ✅ |
| XML validation | ✅ | ✅ | ✅ |
| **XSD Operations** |
| Generate XSD from XML | ✅ | ✅ | ❌ |
| Analyze XSD content | ✅ | ✅ | ✅ |
| Generate XML from XSD | ✅ | ✅ | ✅ |
| Validate XML against XSD | ✅ | ✅ | ❌ |
| **XML Generation** |
| Generate sample XML | ✅ | ✅ | ✅ |
| Generate realistic XML | ✅ | ✅ | ✅ |
| Expand small XML to large | ✅ | ✅ | ❌ |
| **File Operations** |
| Process local files | ✅ | ✅ | ❌ |
| Process URLs/remote files | ✅ | ✅ | ✅ |
| Process compressed files (.gz, .tar, etc.) | ✅ | ✅ | ✅ |
| Multi-file processing (archives) | ✅ | ✅ | ✅ |
| **Advanced Features** |
| Streaming for large files | ✅ | ✅ | ❌ |
| Roundtrip XML processing | ✅ | ✅ | ❌ |
| Element search/filtering | ✅ | ✅ | ❌ |
| Structure transformation | ✅ | ✅ | ❌ |

## Features

- **XML Analysis**: Structure analysis and sampling
- **XSD Support**: Generate and validate schemas
- **Real Data**: Process WordNet LMF files from URLs
- **Memory Efficient**: Streams large files
- **TypeScript**: Full type safety

## Development

```bash
git clone https://github.com/fustilio/xml-introspect.git
cd xml-introspect
pnpm install
pnpm test
pnpm build
```

## Documentation

- [Getting Started](docs/getting-started.md)
- [CLI Reference](docs/cli-reference.md)
- [API Reference](docs/api-reference.md)
- [Examples](docs/examples/)

## License

MIT - see [LICENSE](LICENSE)
