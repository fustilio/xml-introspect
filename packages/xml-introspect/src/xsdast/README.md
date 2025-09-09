# XSDAST (XSD Abstract Syntax Tree) Utilities

This module provides comprehensive utilities for working with XSD Abstract Syntax Trees, including traversal, validation, manipulation, and quality analysis capabilities.

## Features

- **XSDAST Traversal**: Navigate and query XSD structures
- **XSD Validation**: Validate XSD schemas for correctness and best practices
- **Quality Analysis**: Check for common XSD design issues and provide recommendations
- **Recursive XSD Generation**: Create XSD files that define their own structure
- **Helper Functions**: Utilities for common XSD operations
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Core Concepts

### XSDAST Structure
The XSDAST is a tree representation of XSD schemas where each node represents an XSD construct (element, complexType, etc.) with:
- `type`: The XSD node type (xsd:schema, xsd:element, etc.)
- `name`: The name of the construct
- `attributes`: XSD attributes as key-value pairs
- `children`: Child XSD constructs
- `text`: Text content (for simple types)
- `parent`: Reference to parent node

### XSD Validation
The XSDAST validator provides comprehensive validation capabilities for XSD schemas:
1. **Structural Validation**: Checks for proper XSD syntax and structure
2. **Design Issue Detection**: Identifies common XSD design problems
3. **Quality Scoring**: Rates schema completeness and best practices
4. **Recommendations**: Provides suggestions for improvement

## Usage

```typescript
import { 
  XSDASTTraverser, 
  XSDASTValidator, 
  XSDHelper 
} from 'xml-introspect/xsdast';

// Traverse an XSD AST
const traverser = new XSDASTTraverser(xsdAST);
const elements = traverser.findAllElements();

// Validate XSD structure and quality
const validator = new XSDASTValidator(traverser);
const validationResult = await validator.validate();

// Check for design issues
const designIssues = validator.checkDesignIssues();
console.log('Issues:', designIssues.issues);
console.log('Recommendations:', designIssues.recommendations);
console.log('Quality Score:', designIssues.qualityScore);

// Get schema summary
const summary = validator.getSchemaSummary();
console.log('Schema Summary:', summary);

// Use helper functions
const helper = new XSDHelper();
const elementType = helper.getElementType(elementNode);
```

## Architecture

- `types.ts`: Core XSDAST type definitions and interfaces
- `traverser.ts`: Tree traversal and querying utilities
- `validator.ts`: XSD validation and quality analysis logic
- `helper.ts`: Common XSD manipulation functions
- `generator.ts`: Recursive XSD generation utilities
- `self-validating.xsd`: Example self-validating XSD schema
