# Contributing to XML Introspect

[![Contributing](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](https://github.com/fustilio/xml-introspect)
[![Code Style](https://img.shields.io/badge/code%20style-prettier-ff69b4.svg)](https://prettier.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)

Thank you for your interest in contributing to XML Introspect! This guide will help you get started with contributing to our project.

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (ES modules support required)
- **pnpm** (recommended package manager)
- **Git** for version control
- **TypeScript 4.9+** for type checking

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/xml-introspect.git
cd xml-introspect

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests to ensure everything works
pnpm test
```

## 🏗️ Project Structure

```
xml-introspect/
├── packages/
│   ├── xml-introspect/          # Main package
│   │   ├── src/                 # Source code
│   │   ├── test/                # Test suite
│   │   ├── data/                # Sample data
│   │   └── dist/                # Built files
│   └── data-loader/             # Data processing package
│       └── src/formats/         # Format handlers
├── docs/                        # Documentation
├── examples/                    # Usage examples
├── scripts/                     # Build and utility scripts
└── .github/                     # GitHub workflows and templates
```

## 🔧 Development Workflow

### 1. Create a Feature Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 2. Make Your Changes

- Write clean, well-documented code
- Follow the existing code style and patterns
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test files
pnpm vitest run test/your-test-file.test.ts

# Run tests in watch mode during development
pnpm test:watch
```

### 4. Build and Verify

```bash
# Build all packages
pnpm build

# Test the CLI
pnpm cli --help

# Run demo scripts
pnpm demo:faker
pnpm demo:schema
```

### 5. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add new XML processing feature

- Add support for new XML format
- Include comprehensive tests
- Update documentation

Closes #123"
```

### 6. Push and Create Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name

# Create a pull request on GitHub
```

## 📝 Code Style Guidelines

### TypeScript

- Use **TypeScript 4.9+** features
- Prefer **interfaces** over types for object shapes
- Use **strict null checks** and handle null/undefined properly
- Add **JSDoc comments** for public APIs

```typescript
/**
 * Processes XML data and returns analysis results
 * @param inputPath - Path to the input XML file
 * @param options - Processing options
 * @returns Promise resolving to analysis results
 */
export async function processXML(
  inputPath: string,
  options: ProcessingOptions = {}
): Promise<AnalysisResult> {
  // Implementation
}
```

### Code Formatting

- Use **Prettier** for consistent formatting
- Follow **ESLint** rules
- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Use **trailing commas** in objects and arrays

```typescript
// ✅ Good
const config = {
  maxElements: 100,
  maxDepth: 5,
  preserveAttributes: true,
};

// ❌ Avoid
const config = {
  maxElements: 100,
  maxDepth: 5,
  preserveAttributes: true
};
```

### Naming Conventions

- **camelCase** for variables and functions
- **PascalCase** for classes and interfaces
- **UPPER_SNAKE_CASE** for constants
- **kebab-case** for file names

```typescript
// ✅ Good
const elementCount = 100;
class XMLProcessor {}
const MAX_DEPTH = 10;
// file: xml-processor.ts

// ❌ Avoid
const element_count = 100;
class xmlProcessor {}
const maxDepth = 10;
// file: XMLProcessor.ts
```

## 🧪 Testing Guidelines

### Test Structure

- Write **unit tests** for individual functions
- Write **integration tests** for workflows
- Write **CLI tests** for command-line functionality
- Write **performance tests** for large file processing

### Test Naming

```typescript
describe('XMLProcessor', () => {
  describe('processXML', () => {
    it('should process valid XML files', async () => {
      // Test implementation
    });
    
    it('should handle malformed XML gracefully', async () => {
      // Test implementation
    });
    
    it('should process large files efficiently', async () => {
      // Test implementation
    });
  });
});
```

### Test Coverage

- Maintain **100% test coverage** for new code
- Test **happy paths** and **error cases**
- Test **edge cases** and **boundary conditions**
- Use **real data** when possible

### Test Data

- Use **real WordNet data** for integration tests
- Create **minimal test cases** for unit tests
- Include **malformed data** for error testing
- Use **temporary files** that are cleaned up

## 📚 Documentation Guidelines

### README Files

- Update **package READMEs** for new features
- Include **usage examples** and **API documentation**
- Keep **installation instructions** up to date
- Add **troubleshooting sections** for common issues

### Code Comments

- Add **JSDoc comments** for public APIs
- Explain **complex algorithms** and **business logic**
- Include **usage examples** in comments
- Document **parameters** and **return values**

### API Documentation

```typescript
/**
 * Generates a representative sample from a large XML file
 * 
 * @param inputPath - Path to the input XML file
 * @param outputPath - Path where the sample will be saved
 * @param options - Sampling options
 * 
 * @example
 * ```typescript
 * await generateSample('large.xml', 'sample.xml', {
 *   maxElements: 100,
 *   maxDepth: 3,
 *   strategy: 'balanced'
 * });
 * ```
 * 
 * @throws {Error} When the input file cannot be read
 * @throws {Error} When the output file cannot be written
 */
export async function generateSample(
  inputPath: string,
  outputPath: string,
  options: SamplingOptions = {}
): Promise<void> {
  // Implementation
}
```

## 🐛 Bug Reports

### Before Reporting

1. **Check existing issues** to avoid duplicates
2. **Test with latest version** to ensure it's not fixed
3. **Reproduce the issue** with minimal steps
4. **Check system requirements** and environment

### Bug Report Template

```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g., Windows 10, macOS 12, Ubuntu 20.04]
- Node.js version: [e.g., 18.17.0]
- Package version: [e.g., 0.1.0]
- Browser (if applicable): [e.g., Chrome 91, Firefox 89]

## Additional Context
Any other context about the problem
```

## ✨ Feature Requests

### Before Requesting

1. **Check existing issues** for similar requests
2. **Consider the project scope** and goals
3. **Think about implementation** and complexity
4. **Consider alternatives** and workarounds

### Feature Request Template

```markdown
## Feature Description
Brief description of the feature

## Use Case
Why is this feature needed? What problem does it solve?

## Proposed Solution
How would you like this feature to work?

## Alternatives Considered
What other approaches have you considered?

## Additional Context
Any other context, mockups, or examples
```

## 🔄 Pull Request Process

### Before Submitting

1. **Run all tests** and ensure they pass
2. **Build the project** and verify it works
3. **Update documentation** for new features
4. **Add tests** for new functionality
5. **Follow code style** guidelines

### Pull Request Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] All tests pass in CI
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
- [ ] Changes are backward compatible
```

### Review Process

1. **Automated checks** must pass (tests, linting, building)
2. **Code review** by maintainers
3. **Testing** on different environments
4. **Documentation** review
5. **Approval** and merge

## 🚀 Release Process

### Version Bumping

- **Patch** (0.1.0 → 0.1.1): Bug fixes
- **Minor** (0.1.0 → 0.2.0): New features
- **Major** (0.1.0 → 1.0.0): Breaking changes

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Release notes prepared
- [ ] Packages published to npm

## 🤝 Community Guidelines

### Code of Conduct

- **Be respectful** and inclusive
- **Be constructive** in feedback
- **Be patient** with newcomers
- **Be collaborative** and helpful

### Communication

- **GitHub Issues** for bug reports and feature requests
- **GitHub Discussions** for questions and ideas
- **Pull Requests** for code contributions
- **Discord** for real-time chat (if available)

### Recognition

- **Contributors** are recognized in README
- **Significant contributions** are highlighted in releases
- **Community feedback** is valued and incorporated

## 🛠️ Development Tools

### Recommended VS Code Extensions

- **TypeScript** - Language support
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **Vitest** - Test runner
- **GitLens** - Git integration
- **XML** - XML language support

### Useful Commands

```bash
# Development
pnpm dev                    # Start development mode
pnpm test:watch            # Run tests in watch mode
pnpm test:ui               # Run tests with UI
pnpm build                 # Build all packages
pnpm lint                  # Run linting
pnpm format                # Format code

# Testing
pnpm test                  # Run all tests
pnpm test:coverage         # Run tests with coverage
pnpm test:cli              # Run CLI tests
pnpm test:schema           # Run schema tests

# Demos
pnpm demo:faker            # Run Faker demo
pnpm demo:schema           # Run schema demo
```

## 📞 Getting Help

### Resources

- **Documentation**: [Project Wiki](https://github.com/fustilio/xml-introspect/wiki)
- **Issues**: [GitHub Issues](https://github.com/fustilio/xml-introspect/issues)
- **Discussions**: [GitHub Discussions](https://github.com/fustilio/xml-introspect/discussions)
- **Code**: [Source Code](https://github.com/fustilio/xml-introspect)

### Contact

- **Maintainer**: [fustilio](https://github.com/fustilio)
- **Email**: [Contact via GitHub](https://github.com/fustilio/xml-introspect/issues/new)
- **Discord**: [Join our community](https://discord.gg/your-invite)

## 🙏 Thank You

Thank you for contributing to XML Introspect! Your contributions help make this project better for everyone. Whether you're fixing bugs, adding features, improving documentation, or just asking questions, your involvement is greatly appreciated.

---

**Happy coding! 🚀**
