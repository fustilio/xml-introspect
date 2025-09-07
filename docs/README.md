# XML Introspect Docs

Everything you need to know about XML Introspect.

## Quick Start

```bash
npm install xml-introspect
xml-introspect sample input.xml output.xml
```

## Documentation

- [Getting Started](getting-started.md) - Install and basic usage
- [CLI Reference](cli-reference.md) - All commands and options
- [API Reference](api-reference.md) - TypeScript/JavaScript API
- [Examples](examples/) - Real usage examples
- [Data Sources](data-sources.md) - Supported formats

## Common Tasks

**Sample large XML:**
```bash
xml-introspect sample large-file.xml sample.xml --max-elements 100
```

**Generate schema:**
```bash
xml-introspect schema data.xml schema.xsd
```

**Process from URL:**
```bash
xml-introspect sample https://en-word.net/static/english-wordnet-2024.xml.gz output.xml
```

**Generate test data:**
```bash
xml-introspect realistic template.xml test-data.xml --seed 42
```

## Package Docs

- [Main Package](../packages/xml-introspect/README.md)
- [Data Loader](../packages/data-loader/src/formats/README.md)

## Support

- [Issues](https://github.com/fustilio/xml-introspect/issues)
- [Discussions](https://github.com/fustilio/xml-introspect/discussions)

MIT License - see [LICENSE](../LICENSE)
