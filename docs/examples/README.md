# Examples

Real-world usage examples and tutorials for XML Introspect.

## Quick Examples

### Basic XML Sampling

```bash
# Sample large XML file
xml-introspect sample large-file.xml sample.xml --max-elements 100

# Sample with custom depth
xml-introspect sample large-file.xml sample.xml --max-elements 200 --max-depth 3
```

### Schema Generation

```bash
# Generate XSD schema
xml-introspect schema data.xml schema.xsd

# Generate with namespace
xml-introspect schema data.xml schema.xsd --namespace "http://example.com/schema"
```

### Realistic Data Generation

```bash
# Generate realistic test data
xml-introspect realistic template.xml realistic.xml --seed 42

# Generate from XSD
xml-introspect realistic schema.xsd generated.xml --max-elements 500
```

## WordNet Processing

### Download and Process WordNet

```bash
# Download English WordNet
xml-introspect sample https://en-word.net/static/english-wordnet-2024.xml.gz wordnet-sample.xml

# Generate schema
xml-introspect schema wordnet-sample.xml wordnet-schema.xsd

# Generate realistic WordNet-like data
xml-introspect realistic wordnet-schema.xsd realistic-wordnet.xml --max-elements 1000
```

### Programmatic WordNet Processing

```typescript
import { XMLIntrospector } from 'xml-introspect';

const introspector = new XMLIntrospector();

// Process WordNet LMF file
await introspector.generateSample('oewn.xml', 'oewn-sample.xml', {
  maxElements: 200,
  strategy: 'balanced'
});

// Generate schema
await introspector.generateSchema('oewn.xml', 'oewn-schema.xsd');
```

## Data Processing from URLs

### Download and Process Real Data

```typescript
import { FormatProcessor } from 'xml-introspect/data-loader';

const processor = new FormatProcessor();

// Download and process WordNet data
const response = await fetch('https://en-word.net/static/english-wordnet-2024.xml.gz');
const arrayBuffer = await response.arrayBuffer();

const result = await processor.processData(arrayBuffer, {
  projectId: 'oewn:2024',
  enableTarExtraction: true
});

if (result.success) {
  console.log('Processed XML:', result.xmlContent);
  console.log('Processing steps:', result.processingSteps);
}
```

## Realistic Data Generation

### Custom Faker Generators

```typescript
import { XMLFakerGenerator } from 'xml-introspect';

const faker = new XMLFakerGenerator();

await faker.generateRealisticXML('template.xml', 'realistic.xml', {
  seed: 42,
  maxElements: 100,
  customGenerators: {
    'lemma': (faker) => faker.word.noun(),
    'definition': (faker) => faker.lorem.sentence(),
    'pos': (faker) => faker.helpers.arrayElement(['n', 'v', 'a', 'r'])
  }
});
```

## Batch Processing

### Process Multiple Files

```bash
# Process all XML files in directory
for file in *.xml; do
  xml-introspect sample "$file" "sample-$file" --max-elements 50
done
```

### Integration with Other Tools

```bash
# Generate sample and validate
xml-introspect sample input.xml sample.xml
xml-introspect schema sample.xml schema.xsd
xml-introspect validate sample.xml schema.xsd
```

## Advanced Examples

### Custom Sampling Strategy

```typescript
await introspector.generateSample('input.xml', 'output.xml', {
  maxElements: 200,
  maxDepth: 4,
  strategy: 'balanced',
  elementTypeLimits: {
    'LexicalEntry': 50,
    'Synset': 30,
    'Sense': 20
  }
});
```

### Schema with Custom Options

```typescript
await introspector.generateSchema('data.xml', 'schema.xsd', {
  namespace: 'http://example.com/schema',
  elementForm: 'qualified',
  attributeForm: 'qualified'
});
```

## Performance Examples

### Large File Processing

```bash
# Process very large file with memory limits
xml-introspect sample huge-file.xml sample.xml --max-elements 1000 --max-depth 2

# Process with verbose output for monitoring
xml-introspect sample huge-file.xml sample.xml --max-elements 500 --verbose
```

### Memory-Efficient Processing

```typescript
// Process large file with streaming
await introspector.generateSample('large-file.xml', 'sample.xml', {
  maxElements: 100,
  maxDepth: 3,
  strategy: 'first'  // Faster processing
});
```

## Error Handling

### Graceful Error Handling

```typescript
try {
  const result = await introspector.generateSample('input.xml', 'output.xml');
  console.log('Success!');
} catch (error) {
  console.error('Processing failed:', error.message);
}
```

### Validation with Error Reporting

```typescript
const isValid = await introspector.validateXML('data.xml', 'schema.xsd');
if (!isValid) {
  console.error('XML validation failed');
}
```
