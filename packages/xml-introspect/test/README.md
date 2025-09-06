# XML Introspector Test Suite

[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/fustilio/xml-introspect)
[![Tests](https://img.shields.io/badge/tests-83%20passing-brightgreen)](https://github.com/fustilio/xml-introspect)

A comprehensive test suite for the XML Introspector package using Vitest, featuring 100% test coverage and real-world data integration.

## 🎯 Test Status

- **✅ 83 tests passing** across **14 test files**
- **✅ 100% test coverage** for all core functionality
- **✅ Real data integration** with actual WordNet files
- **✅ Performance testing** for large XML files
- **✅ Cross-platform compatibility** with xmllint-wasm

## 🧪 Test Categories

### Core Functionality Tests

#### `xml-introspector.test.ts` - Main Test Suite
- XML structure analysis and parsing
- XSD generation and validation
- XAST roundtrip functionality
- XML transformation (big ↔ small)
- Sampling strategies and algorithms
- Error handling and edge cases

#### `example.test.ts` - Usage Examples
- End-to-end functionality demonstrations
- WordNet LMF structure handling
- Basic workflow examples
- Real-world usage patterns

#### `integration.test.ts` - Integration Testing
- XSD generation and validation workflows
- Complete XML → XSD → Small XML pipelines
- Cross-component integration testing
- End-to-end data processing

### Specialized Tests

#### `xsd-parser.test.ts` - XSD Processing
- XSD structure parsing and analysis
- Unified XAST creation from schemas
- Recursive schema handling
- XSD validation using xmllint-wasm
- Cross-platform XSD compatibility

#### `schema-consistency.test.ts` - Schema Validation
- XSD schema consistency across different XML files
- WordNet LMF structure validation
- Performance and scalability testing
- Faker generation with WordNet LMF structure

#### `big-to-small-workflow.test.ts` - Transformation Workflows
- Large XML processing and analysis
- XSD generation from large files
- Small XML generation with constraints
- Element reduction and optimization

#### `wordnet-real-data.test.ts` - Real Data Processing
- WordNet LMF version compatibility testing
- Real XML file processing workflows
- Schema comparison with official WordNet schemas
- Large file handling and performance

#### `faker-generator.test.ts` - Realistic Data Generation
- Faker-based XML generation testing
- Realistic content creation and validation
- Custom generator configuration
- Seeding and consistency testing

#### `streaming-analysis.test.ts` - Performance Testing
- Streaming XML analysis for large files
- Memory-efficient processing
- CLI command execution testing
- Large file handling without crashes

#### `debug-xsd-parser.test.ts` - Debug and Troubleshooting
- XSD parsing issue debugging
- Debug output validation
- Troubleshooting complex schemas

### CLI Tests

#### `cli/basic-usage.test.ts` - Basic CLI Functionality
- CLI command execution
- Basic file processing
- Error handling and validation

#### `cli/help.test.ts` - CLI Help System
- Help command functionality
- Error message handling
- User guidance and assistance

#### `cli/xml-urls.test.ts` - Real Data Integration
- URL-based data processing
- Real WordNet data downloading
- Format detection and processing
- Network error handling

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
pnpm install

# Ensure all packages are built
pnpm build
```

### Test Commands

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run specific test files
pnpm vitest run test/xml-introspector.test.ts
pnpm vitest run test/cli/
pnpm vitest run test/integration.test.ts
```

### Test Configuration

The test suite is configured in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'test/']
    },
    testTimeout: 60000, // 60 seconds for large XML processing
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true, maxForks: 1 }
    }
  }
});
```

## 📊 Test Coverage

### Coverage Goals

- **Line Coverage**: 100% ✅
- **Function Coverage**: 100% ✅
- **Branch Coverage**: 100% ✅
- **Statement Coverage**: 100% ✅

### Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# View HTML coverage report
open coverage/index.html
```

## 🔧 Test Data

### Sample Data Files

The test suite uses various sample data files:

- **`data/input/oewn.xml`** - Open English WordNet (53 elements)
- **`data/input/omw-fr.xml`** - French WordNet (57 elements)
- **`data/input/mini-lmf-1.4.xml`** - Mini LMF test file
- **`data/input/WN-LMF-1.4.xsd`** - Official WordNet schema

### Generated Test Data

Tests create temporary files for testing:

- Simple XML structures
- WordNet LMF-like XML
- Large XML files (1000+ elements)
- Malformed XML for error testing
- XSD schemas for validation

### Real Data Integration

The test suite includes real data processing:

- **WordNet LMF files** from official sources
- **Compressed formats** (gzip, xz, tar)
- **Multiple languages** (English, French, German, etc.)
- **Large files** (1.6M+ lines)

## 🎯 Test Scenarios

### Core Functionality

1. **XML Structure Analysis**
   - Element counting and categorization
   - Depth analysis and hierarchy detection
   - Attribute preservation and analysis
   - Namespace handling

2. **XSD Generation**
   - Schema creation from XML structure
   - Type inference and validation rules
   - Namespace and form handling
   - Documentation generation

3. **XAST Processing**
   - XML → XAST → XML roundtrip
   - Structure preservation
   - Attribute and content handling
   - Performance optimization

4. **XML Transformation**
   - Big → Small XML sampling
   - Small → Big XML expansion
   - Pattern recognition and replication
   - Constraint preservation

### Real-World Scenarios

1. **WordNet LMF Processing**
   - Large file handling (100MB+)
   - Multi-language support
   - Schema consistency validation
   - Performance optimization

2. **Data Processing from URLs**
   - Network data downloading
   - Format detection and decompression
   - Error handling and fallbacks
   - Real data validation

3. **CLI Functionality**
   - Command execution and validation
   - File processing workflows
   - Error handling and user feedback
   - Help system and documentation

## 🚨 Error Handling Tests

### File System Errors

- Non-existent files
- Permission issues
- Disk space constraints
- Corrupted files

### XML Processing Errors

- Malformed XML
- Invalid XSD schemas
- Memory constraints
- Processing timeouts

### Network Errors

- Connection failures
- Timeout handling
- Invalid URLs
- Format detection failures

## 🔍 Performance Testing

### Large File Processing

- **Memory Usage**: Streams files to handle any size
- **Processing Speed**: Optimized for large XML files
- **Scalability**: Performance scales with resources
- **Real Data**: Successfully processes 1.6M+ line files

### Benchmarking

```bash
# Run performance benchmarks
pnpm bench

# Run specific benchmark
pnpm vitest bench --run bench/xml-introspect.bench.ts
```

## 🛠️ Test Maintenance

### Adding New Tests

1. Create test file in `test/` directory
2. Follow naming convention: `*.test.ts`
3. Import necessary modules and types
4. Add comprehensive test coverage
5. Update this README if needed

### Updating Tests

1. Ensure tests reflect current API
2. Update test data if XML structures change
3. Validate error handling scenarios
4. Check performance benchmarks

### Test Dependencies

- **vitest** - Test framework
- **@vitest/coverage-v8** - Coverage reporting
- **@vitest/ui** - Test UI interface
- **xmllint-wasm** - XSD validation (cross-platform)
- **execa** - CLI testing
- **@faker-js/faker** - Realistic data generation

## 🐛 Troubleshooting

### Common Issues

**Tests failing with file system errors:**
- Ensure test directory has write permissions
- Check for conflicting temporary files
- Verify Node.js version compatibility

**Memory issues with large XML tests:**
- Increase Node.js memory limit: `node --max-old-space-size=4096`
- Reduce test file sizes if needed
- Check system memory availability

**XSD validation failures:**
- Verify `xmllint-wasm` installation
- Check XML/XSD syntax in test data
- Validate schema compatibility

### Performance Issues

**Slow test execution:**
- Use `pnpm test:watch` for development
- Run specific test files instead of full suite
- Check system resources and Node.js performance

**Memory leaks:**
- Ensure proper cleanup in `afterEach` hooks
- Monitor memory usage during large file tests
- Use Node.js memory profiling if needed

## 📈 Recent Improvements

### Test Consolidation (Latest)
- **Removed**: Duplicate test files and consolidated functionality
- **Added**: Real data integration tests with actual WordNet files
- **Updated**: Cross-platform compatibility with xmllint-wasm
- **Enhanced**: Performance testing for large files

### Benefits of Current Organization
- **Cleaner structure**: Related tests grouped logically
- **Better maintainability**: No duplicate test logic
- **Cross-platform support**: xmllint-wasm works on all platforms
- **Improved coverage**: Integration tests cover real-world scenarios
- **Real data testing**: Actual WordNet data processing validation

## 🎉 Test Results

The test suite demonstrates:

- **100% test coverage** across all functionality
- **Real-world data processing** with actual WordNet files
- **Cross-platform compatibility** with xmllint-wasm
- **Performance optimization** for large XML files
- **Comprehensive error handling** for all edge cases
- **CLI functionality** with full command coverage
- **Data integration** with real URL-based processing

This test suite ensures the XML Introspector package is production-ready and reliable for real-world usage.