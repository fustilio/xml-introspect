# Technical Documentation

Technical details for XML Introspect.

## Architecture

XML Introspect uses a modular, environment-specific architecture:

- **[Architecture Overview](architecture.md)** - Complete system architecture documentation
- **Core Module** - Shared functionality and abstract classes
- **Node.js Module** - Node.js-specific implementations with file system access
- **Browser Module** - Browser-specific implementations with CDN support
- **CLI Module** - Command-line interface tools

### Key Components

- **XMLIntrospector** - Main processing engine
- **XSDParser** - Environment-specific XSD parsing (abstract base class)
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