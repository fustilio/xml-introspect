# Test Organization

This directory contains tests organized by environment and type to ensure comprehensive coverage across different platforms.

## Directory Structure

```
test/
├── node/           # Node.js-specific tests
├── browser/        # Browser-specific tests  
├── cli/            # CLI tool tests
├── unit/           # Unit tests (environment-agnostic)
├── integration/    # Integration tests
└── README.md       # This file
```

## Test Categories

### Node.js Tests (`test/node/`)
- Tests that require Node.js APIs (fs, path, process, etc.)
- File system operations
- Stream processing
- Node.js-specific features

### Browser Tests (`test/browser/`)
- Tests for browser-compatible standalone version
- DOM manipulation (if applicable)
- Browser-specific APIs
- Standalone functionality without Node.js dependencies

### CLI Tests (`test/cli/`)
- Command-line interface tests
- CLI argument parsing
- End-to-end CLI workflows
- Output validation
- Sample command tests
- Validate command tests

### Unit Tests (`test/unit/`)
- Core functionality tests
- Environment-agnostic logic
- Pure functions
- Data processing

### Integration Tests (`test/integration/`)
- End-to-end workflows
- Cross-component interactions
- Real-world scenarios
- Performance tests

## Running Tests

### All Tests
```bash
pnpm test
```

### By Environment
```bash
pnpm test:node      # Node.js tests
pnpm test:browser   # Browser tests  
pnpm test:cli       # CLI tests
```

### Watch Mode
```bash
pnpm test:watch:node
pnpm test:watch:browser
pnpm test:watch:cli
```

### Coverage
```bash
pnpm test:coverage:node
pnpm test:coverage:browser
pnpm test:coverage:cli
```

## Test Configuration

Each environment has its own Vitest configuration:

- `vitest.node.config.ts` - Node.js environment
- `vitest.browser.config.ts` - Browser environment (jsdom)
- `vitest.cli.config.ts` - CLI-specific settings

## Best Practices

1. **Environment Separation**: Keep tests in their appropriate directories
2. **Isolation**: Each test should be independent
3. **Mocking**: Use appropriate mocks for external dependencies
4. **Timeouts**: Set appropriate timeouts for different test types
5. **Coverage**: Aim for high coverage across all environments

## Adding New Tests

1. Determine the appropriate directory based on the test type
2. Follow the naming convention: `*.test.ts`
3. Use descriptive test names
4. Include both positive and negative test cases
5. Add appropriate timeouts for slow operations

## CLI Test Files

- `basic-usage.test.ts` - Basic CLI functionality tests
- `e2e-workflow.test.ts` - End-to-end workflow tests
- `help.test.ts` - Help command tests
- `preview.e2e.test.ts` - Preview command tests with URLs
- `schema.e2e.test.ts` - Schema generation tests
- `sample.test.ts` - Sample command tests
- `validate.test.ts` - Validate command tests
- `verbose.test.ts` - Verbose output tests
- `xml-urls.test.ts` - URL processing tests