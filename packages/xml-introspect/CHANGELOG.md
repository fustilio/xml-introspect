# xml-introspect

## 0.5.0

### Minor Changes

- update browser introspector to include sample generation
- add xsdast definitions and reorganize

## 0.5.0

### Minor Changes

- **XSD Validation Improvements**: Refactored `XSDSelfValidator` to `XSDASTValidator` with practical validation capabilities
- **Quality Analysis**: Added comprehensive XSD quality analysis and design issue detection
- **Schema Analysis**: Added detailed schema structure summaries and recommendations
- **Robustness Testing**: Enhanced XSD robustness testing with real-world validation scenarios

### Patch Changes

- Removed impractical "self-validation" concept in favor of practical XSD validation
- Added `checkDesignIssues()` method for identifying common XSD problems
- Added `getSchemaSummary()` method for detailed schema analysis
- Improved validation error reporting and suggestions
- Updated documentation to reflect new validation capabilities

## 0.4.0

### Minor Changes

- restructure core, node, browser, cli, cdn organization

### Patch Changes

- Updated dependencies
  - @fustilio/data-loader@0.4.0

## 0.3.2

### Patch Changes

- add root index.js export for cdn

## 0.3.1

### Patch Changes

- remove wordnet specific implementations
- Updated dependencies
  - @fustilio/data-loader@0.3.1

## 0.3.0

### Minor Changes

- refactor data-loader to be agnostic

### Patch Changes

- Updated dependencies
  - @fustilio/data-loader@0.3.0

## 0.2.1

### Patch Changes

- fix validate command url handling

## 0.2.0

### Minor Changes

- 20e175e: - Add .npmignore to exclude test files and large data files from published package
  - Reduce package size from 13.6MB to ~2MB by excluding unnecessary files
  - Add changesets for better version management
  - Fix workspace dependency reference

### Patch Changes

- Updated dependencies [20e175e]
  - @fustilio/data-loader@0.2.0
