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
xml-introspect sample https://example.com/data.xml.gz sample.xml
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

```bash
# Process large XML data
xml-introspect sample https://example.com/data.xml.gz sample.xml
xml-introspect schema sample.xml schema.xsd

# Batch processing
for file in *.xml; do
  xml-introspect sample "$file" "sample-$file" --max-elements 50
done

# Complete pipeline
xml-introspect sample input.xml sample.xml
xml-introspect schema sample.xml schema.xsd
xml-introspect validate sample.xml schema.xsd
```

## Error Handling

Exit codes: `0` (success), `1` (general error), `2` (invalid arguments), `3` (file not found), `4` (processing error), `5` (validation error)

## Performance Tips

- Use `--max-elements` and `--max-depth` for large files
- Process compressed files directly
- Use `--seed` for reproducible results

## Troubleshooting

```bash
# Debug mode
xml-introspect sample input.xml output.xml --verbose

# Memory optimization
xml-introspect sample large.xml output.xml --max-elements 50 --max-depth 3

# Network timeout
export XML_INTROSPECT_TIMEOUT=300000
```

## See Also

- **[API Reference](api-reference.md)** - Programmatic usage
- **[Examples](examples/)** - Real-world usage examples
- **[Data Sources](data-sources.md)** - Supported formats and sources
