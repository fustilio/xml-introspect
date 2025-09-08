# Technical Documentation

Technical details for XML Introspect.

## Architecture

XML Introspect uses a modular architecture:

- **XMLIntrospector** - Main processing engine
- **FormatProcessor** - Data loading and format handling
- **ContentTypeDetector** - Format detection
- **XMLFakerGenerator** - Realistic data generation

## UNIST Integration

XML Introspect leverages UNIST for efficient XML tree processing:

- Tree traversal and filtering
- Memory-efficient processing
- Optimized algorithms

See [UNIST Utilities](unist-utilities.md) for detailed usage.

## Plugin System

Extend XML Introspect with custom:

- Content detectors
- Format processors
- Data generators

## Performance

- Streaming processing for large files
- Memory-efficient algorithms
- Handles files with millions of elements