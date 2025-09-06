# @fustilio/xml-introspect

[![npm version](https://img.shields.io/npm/v/@fustilio/xml-introspect.svg)](https://www.npmjs.com/package/@fustilio/xml-introspect)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/fustilio/xml-introspect)

A powerful TypeScript library and CLI tool for analyzing large XML files and generating representative samples with identical structure. Built with performance and real-world data processing in mind.

## 🚀 Installation

```bash
npm install @fustilio/xml-introspect
# or
pnpm add @fustilio/xml-introspect
# or
yarn add @fustilio/xml-introspect
```

## 📖 API Reference

### Core Classes

#### `XMLIntrospector`

The main class for XML analysis and processing.

```typescript
import { XMLIntrospector } from '@fustilio/xml-introspect';

const introspector = new XMLIntrospector();
```

#### `XMLFakerGenerator`

Generates realistic XML data using Faker.js.

```typescript
import { XMLFakerGenerator } from '@fustilio/xml-introspect';

const faker = new XMLFakerGenerator();
```

#### `XSDGenerator`

Generates XSD schemas from XML files.

```typescript
import { XSDGenerator } from '@fustilio/xml-introspect';

const generator = new XSDGenerator();
```

### Core Methods

#### `analyzeStructure(filePath: string, options?: AnalysisOptions): Promise<StructureAnalysis>`

Analyzes the structure of an XML file and returns detailed information.

```typescript
const analysis = await introspector.analyzeStructure('input.xml', {
  maxDepth: 5,
  preserveAttributes: true
});

console.log(analysis.totalElements); // Total number of elements
console.log(analysis.elementTypes);  // Map of element types and counts
console.log(analysis.maxDepth);      // Maximum nesting depth
```

#### `generateSample(inputPath: string, outputPath: string, options?: SamplingOptions): Promise<void>`

Generates a representative sample from a large XML file.

```typescript
await introspector.generateSample('large.xml', 'sample.xml', {
  maxElements: 100,
  maxDepth: 3,
  strategy: 'balanced'
});
```

#### `generateSchema(inputPath: string, outputPath: string, options?: SchemaOptions): Promise<void>`

Generates an XSD schema from an XML file.

```typescript
await introspector.generateSchema('input.xml', 'schema.xsd', {
  namespace: 'http://example.com/schema',
  elementForm: 'qualified',
  attributeForm: 'unqualified'
});
```

#### `validateXML(xmlPath: string, schemaPath: string): Promise<boolean>`

Validates an XML file against an XSD schema.

```typescript
const isValid = await introspector.validateXML('data.xml', 'schema.xsd');
if (isValid) {
  console.log('XML is valid!');
} else {
  console.log('XML validation failed');
}
```

### Advanced Methods

#### `generateRealisticXML(inputPath: string, outputPath: string, options?: FakerOptions): Promise<void>`

Generates realistic XML data using Faker.js.

```typescript
await introspector.generateRealisticXML('template.xml', 'realistic.xml', {
  seed: 42,
  maxElements: 200,
  maxDepth: 4,
  customGenerators: {
    'person': (faker) => faker.person.fullName(),
    'email': (faker) => faker.internet.email()
  }
});
```

#### `performRoundtrip(inputPath: string, outputPath: string, options?: RoundtripOptions): Promise<void>`

Performs XML → XAST → XML roundtrip processing.

```typescript
await introspector.performRoundtrip('input.xml', 'output.xml', {
  preserveStructure: true,
  enhanceWithRealisticData: true
});
```

#### `expandXML(inputPath: string, outputPath: string, options?: ExpansionOptions): Promise<void>`

Expands a small XML file to a larger size based on discovered patterns.

```typescript
await introspector.expandXML('small.xml', 'large.xml', {
  targetSize: 5000,
  maxDepth: 5,
  useRealisticData: true
});
```

### Data Processing Integration

#### `processDataFromURL(url: string, options?: DataProcessingOptions): Promise<ProcessingResult>`

Downloads and processes XML data from URLs with automatic format detection.

```typescript
import { FormatProcessor } from '@fustilio/xml-introspect/data-loader';

const processor = new FormatProcessor();
const result = await processor.processData(arrayBuffer, {
  projectId: 'oewn:2024',
  enableTarExtraction: true
});

if (result.success) {
  console.log('XML content:', result.xmlContent);
  console.log('Processing steps:', result.processingSteps);
}
```

## 🎯 Configuration Options

### `AnalysisOptions`

```typescript
interface AnalysisOptions {
  maxDepth?: number;           // Maximum nesting depth to analyze
  preserveAttributes?: boolean; // Whether to preserve attributes
  includeTextContent?: boolean; // Whether to include text content analysis
  streamingMode?: boolean;     // Use streaming for large files
}
```

### `SamplingOptions`

```typescript
interface SamplingOptions {
  maxElements?: number;        // Maximum elements to include
  maxDepth?: number;          // Maximum nesting depth
  strategy?: 'balanced' | 'random' | 'first'; // Sampling strategy
  preserveAllTypes?: boolean;  // Ensure all element types are represented
  elementTypeLimits?: Record<string, number>; // Per-type element limits
}
```

### `SchemaOptions`

```typescript
interface SchemaOptions {
  namespace?: string;          // Target namespace
  elementForm?: 'qualified' | 'unqualified'; // Element form
  attributeForm?: 'qualified' | 'unqualified'; // Attribute form
  includeDocumentation?: boolean; // Include XSD documentation
  strictMode?: boolean;        // Use strict validation rules
}
```

### `FakerOptions`

```typescript
interface FakerOptions {
  seed?: number;               // Random seed for consistent generation
  maxElements?: number;        // Maximum elements to generate
  maxDepth?: number;          // Maximum nesting depth
  customGenerators?: Record<string, (faker: Faker) => string>; // Custom generators
  realisticMode?: boolean;     // Use realistic data generation
}
```

## 🔧 CLI Usage

The package includes a powerful CLI tool for quick XML processing:

```bash
# Generate sample
xml-introspect sample input.xml output.xml --max-elements 100

# Generate schema
xml-introspect schema input.xml output.xsd

# Generate realistic data
xml-introspect realistic input.xml output.xml --seed 42

# Process real data from URLs
xml-introspect sample https://en-word.net/static/english-wordnet-2024.xml.gz sample.xml

# Validate XML
xml-introspect validate input.xml schema.xsd
```

## 🌍 Real Data Processing

### Supported Data Sources

- **WordNet LMF**: English, French, German, and 30+ other languages
- **CILI**: Collaborative Interlingual Index
- **Open Multilingual WordNet (OMW)**: Multi-language lexical resources
- **Open WordNets (OWN)**: Community-driven wordnets

### Automatic Format Handling

- **Compression**: gzip, xz, tar, and combinations
- **Content Detection**: Automatic format detection and processing
- **Error Handling**: Graceful fallbacks and detailed error reporting

## 🧪 Testing

The package includes comprehensive tests with 100% coverage:

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test categories
pnpm test:cli        # CLI tests
pnpm test:schema     # Schema tests
```

### Test Categories

- **Unit Tests**: Core functionality testing
- **Integration Tests**: End-to-end workflow testing
- **CLI Tests**: Command-line interface testing
- **Performance Tests**: Large file processing testing
- **Real Data Tests**: Actual WordNet data processing

## 📊 Performance

- **Memory Usage**: Streams files to handle files of any size
- **Processing Speed**: Optimized for large XML files (100MB+)
- **Scalability**: Performance scales with available memory and CPU cores
- **Real Data**: Successfully processes 1.6M+ line WordNet files

## 🔍 Examples

### Basic XML Analysis

```typescript
import { XMLIntrospector } from '@fustilio/xml-introspect';

const introspector = new XMLIntrospector();

// Analyze structure
const analysis = await introspector.analyzeStructure('data.xml');
console.log(`Found ${analysis.totalElements} elements`);

// Generate sample
await introspector.generateSample('data.xml', 'sample.xml', {
  maxElements: 50,
  maxDepth: 3
});
```

### WordNet LMF Processing

```typescript
import { XMLIntrospector } from '@fustilio/xml-introspect';

const introspector = new XMLIntrospector();

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

// Generate realistic XML
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

## 🛠️ Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/fustilio/xml-introspect.git
cd xml-introspect

# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build the package |
| `pnpm test` | Run test suite |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:ui` | Run tests with UI |
| `pnpm demo:faker` | Run Faker integration demo |
| `pnpm demo:schema` | Run schema consistency demo |
| `pnpm cli` | Run CLI tool |

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/fustilio/xml-introspect/issues)
- **Discussions**: [GitHub Discussions](https://github.com/fustilio/xml-introspect/discussions)
- **Documentation**: [Project Wiki](https://github.com/fustilio/xml-introspect/wiki)

---

**Made with ❤️ by [fustilio](https://github.com/fustilio)**