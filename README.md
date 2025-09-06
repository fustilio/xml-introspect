# XML Introspect

[![npm version](https://img.shields.io/npm/v/@fustilio/xml-introspect.svg)](https://www.npmjs.com/package/@fustilio/xml-introspect)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@fustilio/xml-introspect)](https://nodejs.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/fustilio/xml-introspect)

A powerful, production-ready CLI tool and library for analyzing large XML files and generating representative samples with identical structure. Perfect for working with massive XML datasets like WordNet LMF files, with built-in support for compressed formats and real-world data processing.

## ✨ Features

- **🔍 XML Structure Analysis**: Automatically analyzes XML structure and generates representative samples
- **📋 XSD Schema Support**: Generate, validate, and work with XSD schemas
- **🌐 Real Data Processing**: Download and process real XML data from URLs with automatic decompression
- **⚡ Memory Efficient**: Streams large XML files to handle files of any size
- **🎯 Format Preservation**: Maintains exact XML structure, attributes, and relationships
- **🎲 Realistic Data Generation**: Uses Faker.js for generating realistic test data
- **🔄 XAST Support**: Full XML Abstract Syntax Tree manipulation and roundtrip processing
- **📦 Multi-format Support**: Handles gzip, xz, tar, and other compressed formats automatically

## 🚀 Quick Start

### Installation

```bash
# Install globally for CLI usage
npm install -g @fustilio/xml-introspect

# Or install locally in your project
npm install @fustilio/xml-introspect

# Using pnpm (recommended)
pnpm add @fustilio/xml-introspect
```

### Basic Usage

```bash
# Generate a sample from a large XML file
xml-introspect sample input.xml output.xml --max-elements 100

# Generate XSD schema from XML
xml-introspect schema input.xml output.xsd

# Download and process real data from URLs
xml-introspect sample https://en-word.net/static/english-wordnet-2024.xml.gz sample.xml

# Generate realistic data using Faker
xml-introspect realistic input.xml output.xml --seed 42
```

## 📖 Documentation

### CLI Commands

| Command | Description | Example |
|---------|-------------|---------|
| `sample` | Generate representative sample from XML | `xml-introspect sample input.xml output.xml` |
| `schema` | Generate XSD schema from XML | `xml-introspect schema input.xml output.xsd` |
| `generate` | Generate XML from XSD schema | `xml-introspect generate schema.xsd output.xml` |
| `validate` | Validate XML against XSD | `xml-introspect validate input.xml schema.xsd` |
| `roundtrip` | XML → XAST → XML roundtrip | `xml-introspect roundtrip input.xml output.xml` |
| `realistic` | Generate realistic data with Faker | `xml-introspect realistic input.xml output.xml` |

### CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--input` | `-i` | Input file path or URL | Required |
| `--output` | `-o` | Output file path | stdout |
| `--max-elements` | `-m` | Maximum elements to include | 100 |
| `--max-depth` | `-d` | Maximum nesting depth | 5 |
| `--realistic` | `-r` | Use Faker for realistic data | false |
| `--seed` | `-s` | Random seed for consistent generation | Random |
| `--help` | `-h` | Show help message | false |

### Library Usage

```typescript
import { XMLIntrospector } from '@fustilio/xml-introspect';
import { FormatProcessor } from '@fustilio/xml-introspect/data-loader';

// Basic usage
const introspector = new XMLIntrospector();

// Generate sample
const sample = await introspector.generateSample('input.xml', {
  maxElements: 100,
  maxDepth: 3,
  preserveAllTypes: true
});

// Generate schema
const schema = await introspector.generateSchema('input.xml');

// Process real data from URLs
const dataLoader = new FormatProcessor();
const result = await dataLoader.processData(arrayBuffer, {
  projectId: 'oewn:2024',
  enableTarExtraction: true
});
```

## 🌍 Real Data Processing

The package includes built-in support for downloading and processing real XML data:

### Supported Data Sources

- **WordNet LMF**: English, French, German, and 30+ other languages
- **CILI**: Collaborative Interlingual Index
- **Open Multilingual WordNet (OMW)**: Multi-language lexical resources
- **Open WordNets (OWN)**: Community-driven wordnets

### Automatic Format Handling

- **Compression**: gzip, xz, tar, and combinations
- **Content Detection**: Automatic format detection and processing
- **Error Handling**: Graceful fallbacks and detailed error reporting

```bash
# Download and process real WordNet data
xml-introspect sample https://en-word.net/static/english-wordnet-2024.xml.gz sample.xml

# Process compressed tar archives
xml-introspect schema https://github.com/globalwordnet/omw/releases/download/v1.4/omw-fr-1.4.xml.gz schema.xsd
```

## 🧪 Testing

The project includes a comprehensive test suite with 100% test coverage:

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run specific test categories
pnpm test:cli        # CLI tests
pnpm test:schema     # Schema tests
```

### Test Coverage

- **83 tests** across **14 test files**
- **100% test coverage** for all core functionality
- **Real data integration** tests with actual WordNet files
- **Performance testing** for large XML files
- **Error handling** and edge case coverage

## 🏗️ Project Structure

```
xml-introspect/
├── packages/
│   ├── xml-introspect/          # Main package
│   │   ├── src/                 # Source code
│   │   ├── test/                # Test suite
│   │   ├── data/                # Sample data
│   │   └── dist/                # Built files
│   └── data-loader/             # Data processing package
│       └── src/formats/         # Format handlers
├── docs/                        # Documentation
├── examples/                    # Usage examples
└── scripts/                     # Build and utility scripts
```

## 🔧 Development

### Prerequisites

- Node.js 18+ (ES modules support)
- pnpm (recommended package manager)

### Setup

```bash
# Clone the repository
git clone https://github.com/fustilio/xml-introspect.git
cd xml-introspect

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build all packages |
| `pnpm test` | Run test suite |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:ui` | Run tests with UI |
| `pnpm demo:faker` | Run Faker integration demo |
| `pnpm demo:schema` | Run schema consistency demo |
| `pnpm cli` | Run CLI tool |
| `pnpm publish-packages` | Publish all packages |

## 📊 Performance

- **Memory Usage**: Streams files to handle files of any size
- **Processing Speed**: Optimized for large XML files (100MB+)
- **Scalability**: Performance scales with available memory and CPU cores
- **Real Data**: Successfully processes 1.6M+ line WordNet files

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WordNet**: For providing the lexical data that drives this project
- **UNIST**: For the powerful tree manipulation utilities
- **Faker.js**: For realistic data generation capabilities
- **xmllint-wasm**: For cross-platform XSD validation

## 🔗 Related Projects

- **[wn-ts-core](https://github.com/fustilio/wn-ts-core)**: Core WordNet TypeScript library
- **[wn-ts-web](https://github.com/fustilio/wn-ts-web)**: Web-based WordNet interface
- **[wn-cli](https://github.com/fustilio/wn-cli)**: Command-line WordNet tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/fustilio/xml-introspect/issues)
- **Discussions**: [GitHub Discussions](https://github.com/fustilio/xml-introspect/discussions)
- **Documentation**: [Project Wiki](https://github.com/fustilio/xml-introspect/wiki)

---

**Made with ❤️ by [fustilio](https://github.com/fustilio)**
