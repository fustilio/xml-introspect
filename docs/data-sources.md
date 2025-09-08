# Data Sources

Supported formats and data sources for XML Introspect.

## Supported Formats

### Compression Formats

- **Gzip** - GNU zip compression (.gz)
- **XZ** - XZ compression with LZMA2 (.xz)
- **Tar** - Tape archive format (.tar, .tar.gz, .tar.xz)
- **XML** - Direct XML processing (.xml)

### Data Types

- **XML** - Extensible Markup Language
- **TSV** - Tab-separated values
- **Unknown** - Fallback for unrecognized formats

## Example Data Sources

### Public XML Datasets

**Large XML Files:**
- Various public datasets in XML format
- Compressed archives containing XML files
- Multi-file XML packages

**Common Sources:**
- Government open data portals
- Academic research datasets
- Open source project data
- API responses in XML format

## Usage Examples

### Process XML Data from URL

```bash
# Download and sample XML data
xml-introspect sample https://example.com/data.xml.gz sample.xml

# Generate schema
xml-introspect schema sample.xml schema.xsd
```

### Process from URL Programmatically

```typescript
import { FormatProcessor } from 'xml-introspect/data-loader';

const processor = new FormatProcessor();

const response = await fetch('https://example.com/data.xml.gz');
const arrayBuffer = await response.arrayBuffer();

const result = await processor.processData(arrayBuffer, {
  projectId: 'my-project',
  enableTarExtraction: true
});

if (result.success) {
  console.log('Processed XML:', result.xmlContent);
  console.log('Content type:', result.contentType);
}
```

### Format Detection

```typescript
import { ContentTypeDetector } from 'xml-introspect/data-loader';

const detector = new ContentTypeDetector();
const analysis = detector.detectContentType(xmlText, 'my-project');

console.log('Type:', analysis.type);        // 'xml', 'tar', 'tsv', 'unknown'
console.log('Confidence:', analysis.confidence); // 'high', 'medium', 'low'
```

## Performance

### Large File Handling

- **Memory Efficient**: Streams files of any size
- **Processing Speed**: ~50MB/s for gzip, ~20MB/s for xz
- **Scalable**: Successfully processes files with millions of elements

### Optimization Tips

- Use `--max-elements` to limit processing time
- Use `--max-depth` to control memory usage
- Process compressed files directly
- Use `--seed` for reproducible results

## Troubleshooting

### Common Issues

**Network timeouts:**
```bash
export XML_INTROSPECT_TIMEOUT=300000  # 5 minutes
```

**Memory issues:**
```bash
xml-introspect sample large.xml output.xml --max-elements 50 --max-depth 3
```

**Format detection:**
- Check content type indicators
- Verify project ID configuration
- Review detection confidence levels
