# Data Sources

Supported formats and real-world data sources for XML Introspect.

## Supported Formats

### Compression Formats

- **Gzip** - GNU zip compression
- **XZ** - XZ compression with LZMA2
- **Tar** - Tape archive format
- **XML** - Direct XML processing

### Data Types

- **LMF** - Lexical Markup Framework (WordNet)
- **TSV** - Tab-separated values
- **ILI** - Interlingual Index (CILI)

## Real Data Sources

### WordNet LMF

**English WordNet:**
- URL: `https://en-word.net/static/english-wordnet-2024.xml.gz`
- Format: Gzipped XML
- Size: ~100MB compressed, ~500MB uncompressed
- Elements: 1.6M+ lines

**French WordNet:**
- URL: `https://en-word.net/static/french-wordnet-2024.xml.gz`
- Format: Gzipped XML
- Language: French

**German WordNet:**
- URL: `https://en-word.net/static/german-wordnet-2024.xml.gz`
- Format: Gzipped XML
- Language: German

### Open Multilingual WordNet (OMW)

**Multi-language support:**
- 30+ languages available
- Tar.xz compressed archives
- LMF format

### CILI (Collaborative Interlingual Index)

**Interlingual Index:**
- Cross-language word mappings
- TSV format
- Multiple language pairs

## Usage Examples

### Process WordNet Data

```bash
# Download and sample English WordNet
xml-introspect sample https://en-word.net/static/english-wordnet-2024.xml.gz wordnet-sample.xml

# Generate schema
xml-introspect schema wordnet-sample.xml wordnet-schema.xsd
```

### Process from URL

```typescript
import { FormatProcessor } from 'xml-introspect/data-loader';

const processor = new FormatProcessor();

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

### Format Detection

```typescript
import { ContentTypeDetector } from 'xml-introspect/data-loader';

const detector = new ContentTypeDetector();
const analysis = detector.detectContentType(xmlText, 'oewn:2024');

console.log('Type:', analysis.type);        // 'lmf', 'xml', 'tar', 'tsv', 'ili'
console.log('Confidence:', analysis.confidence); // 'high', 'medium', 'low'
```

## Performance

### Large File Handling

- **Memory Efficient**: Streams files of any size
- **Processing Speed**: ~50MB/s for gzip, ~20MB/s for xz
- **Real Data**: Successfully processes 1.6M+ line WordNet files

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
