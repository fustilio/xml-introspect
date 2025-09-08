# Examples

Real-world usage examples for XML Introspect.

## Quick Examples

### Basic Usage

```bash
# Sample large XML file
xml-introspect sample large-file.xml sample.xml --max-elements 100

# Generate XSD schema
xml-introspect schema data.xml schema.xsd

# Generate realistic test data
xml-introspect realistic template.xml realistic.xml --seed 42
```

### Library Usage

```typescript
import { XMLIntrospector } from 'xml-introspect';

const introspector = new XMLIntrospector();

// Generate sample from large XML
await introspector.generateSample('input.xml', 'output.xml', {
  maxElements: 100,
  maxDepth: 3
});

// Generate schema
await introspector.generateSchema('data.xml', 'schema.xsd');
```

### Data Processing

```typescript
import { FormatProcessor } from 'xml-introspect/data-loader';

const processor = new FormatProcessor();
const result = await processor.processData(arrayBuffer, {
  projectId: 'my-project',
  enableTarExtraction: true
});
```

## Advanced Examples

### Custom Data Generation

```typescript
import { XMLFakerGenerator } from 'xml-introspect';

const faker = new XMLFakerGenerator();
await faker.generateRealisticXML('template.xml', 'realistic.xml', {
  seed: 42,
  maxElements: 100,
  customGenerators: {
    'name': (faker) => faker.person.fullName(),
    'description': (faker) => faker.lorem.sentence()
  }
});
```

### Batch Processing

```bash
# Process multiple files
for file in *.xml; do
  xml-introspect sample "$file" "sample-$file" --max-elements 50
done
```

### Performance Optimization

```bash
# Process large files efficiently
xml-introspect sample huge-file.xml sample.xml --max-elements 1000 --max-depth 2 --strategy first
```

## Next Steps

- **[CLI Reference](../cli-reference.md)** - Complete command documentation
- **[API Reference](../api-reference.md)** - Full TypeScript/JavaScript API
- **[Getting Started](../getting-started.md)** - Installation and setup