# API Reference

Complete TypeScript/JavaScript API documentation for XML Introspect.

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
  contentType: 'lmf' | 'xml' | 'tar' | 'tsv' | 'ili' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  processingSteps: string[];
}
```
