# XML Introspect

[![npm version](https://img.shields.io/npm/v/@fustilio/xml-introspect.svg)](https://www.npmjs.com/package/@fustilio/xml-introspect)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/fustilio/xml-introspect)

A CLI tool and library for analyzing large XML files and generating representative samples with identical structure.

## Quick Start

```bash
# Install
npm install @fustilio/xml-introspect

# Generate sample from large XML
xml-introspect sample input.xml output.xml

# Generate XSD schema
xml-introspect schema input.xml output.xsd

# Process real data from URLs
xml-introspect sample https://en-word.net/static/english-wordnet-2024.xml.gz sample.xml
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `sample` | Generate representative sample |
| `schema` | Generate XSD schema |
| `generate` | Generate XML from XSD |
| `validate` | Validate XML against XSD |
| `realistic` | Generate realistic data |

## Library Usage

```typescript
import { XMLIntrospector } from '@fustilio/xml-introspect';

const introspector = new XMLIntrospector();

// Generate sample
await introspector.generateSample('input.xml', 'output.xml', {
  maxElements: 100,
  maxDepth: 3
});

// Generate schema
await introspector.generateSchema('input.xml', 'schema.xsd');
```

## Features

- **XML Analysis**: Structure analysis and sampling
- **XSD Support**: Generate and validate schemas
- **Real Data**: Process WordNet LMF files from URLs
- **Memory Efficient**: Streams large files
- **TypeScript**: Full type safety

## Development

```bash
# Setup
git clone https://github.com/fustilio/xml-introspect.git
cd xml-introspect
pnpm install

# Test
pnpm test

# Build
pnpm build
```

## License

MIT - see [LICENSE](LICENSE) file.

---

**Made with ❤️ by [fustilio](https://github.com/fustilio)**

<details>
<summary>📖 Detailed Documentation</summary>

## Detailed Features

- **XML Structure Analysis**: Automatically analyzes XML structure and generates representative samples
- **XSD Schema Support**: Generate, validate, and work with XSD schemas
- **Real Data Processing**: Download and process real XML data from URLs with automatic decompression
- **Memory Efficient**: Streams large XML files to handle files of any size
- **Format Preservation**: Maintains exact XML structure, attributes, and relationships
- **Realistic Data Generation**: Uses Faker.js for generating realistic test data
- **XAST Support**: Full XML Abstract Syntax Tree manipulation and roundtrip processing
- **Multi-format Support**: Handles gzip, xz, tar, and other compressed formats automatically

## Supported Data Sources

- **WordNet LMF**: English, French, German, and 30+ other languages
- **CILI**: Collaborative Interlingual Index
- **Open Multilingual WordNet (OMW)**: Multi-language lexical resources
- **Open WordNets (OWN)**: Community-driven wordnets

## CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--input` | `-i` | Input file path or URL | Required |
| `--output` | `-o` | Output file path | stdout |
| `--max-elements` | `-m` | Maximum elements to include | 100 |
| `--max-depth` | `-d` | Maximum nesting depth | 5 |
| `--realistic` | `-r` | Use Faker for realistic data | false |
| `--seed` | `-s` | Random seed for consistent generation | Random |

## Advanced Usage

### Real Data Processing

```typescript
import { FormatProcessor } from '@fustilio/xml-introspect/data-loader';

const processor = new FormatProcessor();
const result = await processor.processData(arrayBuffer, {
  projectId: 'oewn:2024',
  enableTarExtraction: true
});
```

### Custom Sampling

```typescript
await introspector.generateSample('input.xml', 'output.xml', {
  maxElements: 200,
  maxDepth: 4,
  strategy: 'balanced',
  elementTypeLimits: {
    'LexicalEntry': 50,
    'Synset': 30
  }
});
```

## Performance

- **Memory Usage**: Streams files to handle any size
- **Processing Speed**: Optimized for large XML files (100MB+)
- **Real Data**: Successfully processes 1.6M+ line WordNet files

## Testing

- **83 tests** with **100% coverage**
- **Real data integration** tests
- **Performance testing** for large files
- **Cross-platform compatibility**

</details>