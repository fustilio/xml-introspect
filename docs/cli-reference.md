# CLI Reference

All XML Introspect commands and options.

## Install

```bash
npm install -g xml-introspect
```

## Commands

### `sample` - Generate Sample

Create a sample from large XML files.

```bash
xml-introspect sample <input> <output> [options]
```

**Options:**
- `--max-elements, -m` - Max elements (default: 100)
- `--max-depth, -d` - Max depth (default: 5)
- `--strategy, -s` - Strategy: balanced, random, first (default: balanced)
- `--preserve-all-types` - Keep all element types
- `--verbose, -v` - Verbose output

**Examples:**
```bash
xml-introspect sample input.xml output.xml
xml-introspect sample input.xml output.xml --max-elements 200 --max-depth 3
xml-introspect sample https://en-word.net/static/english-wordnet-2024.xml.gz sample.xml
```

### `schema` - Generate XSD

Create XSD schema from XML.

```bash
xml-introspect schema <input> <output> [options]
```

**Options:**
- `--namespace, -n` - Target namespace
- `--element-form` - qualified/unqualified (default: unqualified)
- `--attribute-form` - qualified/unqualified (default: unqualified)
- `--verbose, -v` - Verbose output

**Examples:**
```bash
xml-introspect schema data.xml schema.xsd
xml-introspect schema data.xml schema.xsd --namespace "http://example.com/schema"
```

### `generate` - Generate XML from XSD

Create XML from XSD schema.

```bash
xml-introspect generate <xsd> <output> [options]
```

**Options:**
- `--max-elements, -m` - Max elements (default: 100)
- `--seed, -s` - Random seed
- `--verbose, -v` - Verbose output

**Examples:**
```bash
xml-introspect generate schema.xsd generated.xml
xml-introspect generate schema.xsd generated.xml --max-elements 200 --seed 42
```

### `validate` - Validate XML

Check XML against XSD schema.

```bash
xml-introspect validate <xml> <xsd> [options]
```

**Options:**
- `--verbose, -v` - Verbose output

**Examples:**
```bash
xml-introspect validate data.xml schema.xsd
```

### `realistic` - Generate Realistic Data

Create realistic test data with Faker.js.

```bash
xml-introspect realistic <input> <output> [options]
```

**Options:**
- `--max-elements, -m` - Max elements (default: 100)
- `--seed, -s` - Random seed
- `--verbose, -v` - Verbose output

**Examples:**
```bash
xml-introspect realistic template.xml realistic.xml
xml-introspect realistic template.xml realistic.xml --max-elements 200 --seed 42
```

## Global Options

- `--help, -h` - Show help information
- `--version, -V` - Show version information
- `--verbose, -v` - Enable verbose output
- `--quiet, -q` - Suppress output (except errors)

## Environment Variables

- `XML_INTROSPECT_LOG_LEVEL` - Set logging level (debug, info, warn, error)
- `XML_INTROSPECT_TIMEOUT` - Set processing timeout in milliseconds

## Examples

### Processing WordNet Data

```bash
# Download and sample WordNet data
xml-introspect sample https://en-word.net/static/english-wordnet-2024.xml.gz wordnet-sample.xml

# Generate schema from WordNet data
xml-introspect schema wordnet-sample.xml wordnet-schema.xsd

# Generate realistic WordNet-like data
xml-introspect realistic wordnet-schema.xsd realistic-wordnet.xml --max-elements 500
```

### Batch Processing

```bash
# Process multiple files
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

## Error Handling

The CLI provides detailed error messages and exit codes:

- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - File not found
- `4` - Processing error
- `5` - Validation error

## Performance Tips

- Use `--max-elements` to limit processing time for very large files
- Use `--max-depth` to control memory usage
- Process compressed files directly (gzip, xz support)
- Use `--seed` for reproducible results in testing

## Troubleshooting

### Common Issues

**File not found:**
```bash
# Check file path and permissions
ls -la input.xml
```

**Memory issues with large files:**
```bash
# Reduce max-elements and max-depth
xml-introspect sample large.xml output.xml --max-elements 50 --max-depth 3
```

**Network timeouts:**
```bash
# Set timeout environment variable
export XML_INTROSPECT_TIMEOUT=300000  # 5 minutes
xml-introspect sample https://example.com/large.xml output.xml
```

### Debug Mode

Enable verbose output for debugging:

```bash
xml-introspect sample input.xml output.xml --verbose
```

## See Also

- **[API Reference](api-reference.md)** - Programmatic usage
- **[Examples](examples/)** - Real-world usage examples
- **[Data Sources](data-sources.md)** - Supported formats and sources
