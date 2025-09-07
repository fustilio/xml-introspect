# Getting Started

Install and start using XML Introspect in minutes.

## Install

```bash
npm install xml-introspect
```

## CLI Usage

```bash
# Sample large XML
xml-introspect sample input.xml output.xml

# Generate schema
xml-introspect schema input.xml schema.xsd

# Process from URL
xml-introspect sample https://en-word.net/static/english-wordnet-2024.xml.gz sample.xml
```

## Library Usage

```typescript
import { XMLIntrospector } from 'xml-introspect';

const introspector = new XMLIntrospector();

// Generate sample
await introspector.generateSample('input.xml', 'output.xml', {
  maxElements: 100,
  maxDepth: 3
});

// Generate schema
await introspector.generateSchema('input.xml', 'schema.xsd');
```

## Examples

**XML Sampling:**
```typescript
await introspector.generateSample('large-file.xml', 'sample.xml', {
  maxElements: 100,
  maxDepth: 3,
  strategy: 'balanced'
});
```

**Schema Generation:**
```typescript
await introspector.generateSchema('data.xml', 'schema.xsd', {
  namespace: 'http://example.com/schema'
});
```

**Realistic Data:**
```typescript
import { XMLFakerGenerator } from 'xml-introspect';

const faker = new XMLFakerGenerator();
await faker.generateRealisticXML('template.xml', 'realistic.xml', {
  seed: 42,
  maxElements: 200
});
```

## Options

**Sampling:**
- `maxElements` - Max elements (default: 100)
- `maxDepth` - Max nesting depth (default: 5)
- `strategy` - 'balanced', 'random', or 'first'

**Schema:**
- `namespace` - Target namespace
- `elementForm` - 'qualified' or 'unqualified'

## Next

- [CLI Reference](cli-reference.md) - All commands
- [API Reference](api-reference.md) - Full API
- [Examples](examples/) - Real usage
