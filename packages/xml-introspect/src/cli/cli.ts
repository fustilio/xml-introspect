#!/usr/bin/env node

import { Command } from 'commander';
import { NodeXMLIntrospector } from '../node/NodeXMLIntrospector.js';
import { XMLFakerGenerator, XMLFakerOptions } from '../core/XMLFakerGenerator.js';
import { FormatProcessor } from '@xml-introspect/data-loader';
import { readFileSync, writeFileSync, unlinkSync, statSync } from 'fs';
import inquirer from 'inquirer';

// Global verbose flag
let verbose = false;

// Helper function for verbose logging
function logVerbose(message: string) {
  if (verbose) {
    console.log(message);
  }
}

// Multi-file mode selection types
type MultiFileMode = 'comprehensive' | 'primary-only' | 'language-specific';

// Prompt user for multi-file mode selection
async function promptMultiFileMode(xmlFiles: Array<{name: string, size: number}>): Promise<MultiFileMode> {
  const choices = [
    {
      name: 'Comprehensive XSD (Recommended) - One schema that validates all files',
      value: 'comprehensive' as MultiFileMode,
      short: 'Comprehensive'
    },
    {
      name: 'Primary file only - Generate XSD from the main file only',
      value: 'primary-only' as MultiFileMode,
      short: 'Primary only'
    },
    {
      name: 'Language-specific XSDs - Generate separate schema for each language',
      value: 'language-specific' as MultiFileMode,
      short: 'Language-specific'
    }
  ];

  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: `Found ${xmlFiles.length} XML files. How would you like to generate the XSD?`,
      choices,
      default: 'comprehensive'
    }
  ]);

  return mode;
}

// Common URL handling logic
async function processUrlOrFile(input: string, projectId: string = 'unknown'): Promise<string | any> {
  // Check if it's a URL
  if (input.startsWith('http://') || input.startsWith('https://')) {
    logVerbose('🌐 Detected URL input, downloading and processing...');
    logVerbose(`📥 URL: ${input}`);
    
    // Download and process the file using data-loader
    const response = await fetch(input);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    logVerbose(`📊 Downloaded ${arrayBuffer.byteLength} bytes`);
    
    // Use data-loader to process the file
    const dataLoader = new FormatProcessor();
    
    logVerbose('🔄 Processing file with data-loader...');
    const result = await dataLoader.processData(arrayBuffer, {
      projectId,
      enableTarExtraction: true
    });
    
    if (!result.success) {
      // Provide more specific error messages for common issues
      if (result.error?.includes('TSV') || result.error?.includes('tsv')) {
        throw new Error(`This appears to be a TSV (tab-separated values) file, not XML. The XML Introspector only processes XML files.`);
      } else if (result.error?.includes('Invalid tar header')) {
        throw new Error(`Failed to process archive: ${result.error}`);
      } else {
        throw new Error(`Failed to process file: ${result.error}`);
      }
    }
    
    // Check for multi-file discovery and prompt user
    if (result.extractedXmlFiles && result.extractedXmlFiles.length > 1) {
      console.log(`\n🔍 Found ${result.extractedXmlFiles.length} XML files in the archive:`);
      result.extractedXmlFiles.forEach(file => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        console.log(`   - ${file.name} (${sizeMB} MB)`);
      });
      console.log('');
      
      // Store the multi-file information for later use
      (result as any).__multiFileMode = true;
      (result as any).__allXmlFiles = result.extractedXmlFiles;
    }
    
    let xmlContent = result.xmlContent!;
    logVerbose(`📄 Extracted content: ${xmlContent.length} characters`);
    
    // Clean up the content by finding the actual XML start
    const xmlStart = xmlContent.indexOf('<?xml');
    if (xmlStart > 0) {
      xmlContent = xmlContent.substring(xmlStart);
      logVerbose(`🧹 Cleaned up content, removed ${xmlStart} characters of non-XML data`);
    }
    
    // For very large files, check if the XML is complete
    if (xmlContent.length > 50 * 1024 * 1024) { // 50MB threshold
      logVerbose('⚠️ Very large file detected, checking XML completeness...');
      
      // Check if XML is properly closed
      const lastTagIndex = xmlContent.lastIndexOf('</');
      const rootTagName = xmlContent.match(/<(\w+)[^>]*>/)?.[1];
      
      if (rootTagName && lastTagIndex > 0) {
        const expectedEndTag = `</${rootTagName}>`;
        const actualEndTag = xmlContent.substring(lastTagIndex, lastTagIndex + expectedEndTag.length);
        
        if (actualEndTag !== expectedEndTag) {
          logVerbose(`⚠️ XML appears incomplete. Expected: ${expectedEndTag}, Found: ${actualEndTag}`);
          logVerbose('🔧 Attempting to fix incomplete XML...');
          
          // Try to find a better end point
          const betterEndIndex = xmlContent.lastIndexOf(expectedEndTag);
          if (betterEndIndex > lastTagIndex) {
            xmlContent = xmlContent.substring(0, betterEndIndex + expectedEndTag.length);
            logVerbose(`✅ Fixed XML by truncating at proper end tag`);
          } else {
            // For very large files, try a different approach
            logVerbose('🔧 Large file extraction incomplete, trying alternative approach...');
            
            // Try to find the last complete element and truncate there
            const lastCompleteElement = xmlContent.lastIndexOf('</Synset>');
            if (lastCompleteElement > 0) {
              // Find the Lexicon that contains this Synset
              const lexiconStart = xmlContent.lastIndexOf('<Lexicon', lastCompleteElement);
              if (lexiconStart > 0) {
                const lexiconEnd = xmlContent.indexOf('</Lexicon>', lastCompleteElement);
                if (lexiconEnd > 0) {
                  xmlContent = xmlContent.substring(0, lexiconEnd + 10); // 10 = length of '</Lexicon>'
                  xmlContent += expectedEndTag;
                  logVerbose(`✅ Fixed XML by truncating at last complete Lexicon`);
                } else {
                  xmlContent += expectedEndTag;
                  logVerbose(`✅ Added missing end tag: ${expectedEndTag}`);
                }
              } else {
                xmlContent += expectedEndTag;
                logVerbose(`✅ Added missing end tag: ${expectedEndTag}`);
              }
            } else {
              xmlContent += expectedEndTag;
              logVerbose(`✅ Added missing end tag: ${expectedEndTag}`);
            }
          }
        }
      }
    }
    
    // Write the cleaned XML to a temporary file
    const tempFile = `temp_${Date.now()}.xml`;
    writeFileSync(tempFile, xmlContent, 'utf8');
    logVerbose(`💾 Temporary file created: ${tempFile}`);
    
    // Return the temp file path with multi-file information if available
    const tempResult = {
      filePath: tempFile,
      __multiFileMode: (result.extractedXmlFiles && result.extractedXmlFiles.length > 0) || false,
      __allXmlFiles: result.extractedXmlFiles || []
    };
    
    return tempResult;
  } else {
    // Handle local file
    return input;
  }
}

// Clean up temporary file
function cleanupTempFile(tempFile: string) {
  try {
    unlinkSync(tempFile);
    logVerbose(`🗑️ Temporary file cleaned up: ${tempFile}`);
  } catch (cleanupError) {
    logVerbose(`⚠️ Warning: Could not clean up temporary file ${tempFile}: ${cleanupError}`);
  }
}

// Determine project ID from URL
function getProjectId(input: string, suffix: string = 'unknown'): string {
  if (input.includes('omw')) {
    return `omw:${suffix}`;
  } else if (input.includes('oewn') || input.includes('english-wordnet')) {
    return `oewn:${suffix}`;
  } else if (input.includes('cili')) {
    return `cili:${suffix}`;
  }
  return `unknown:${suffix}`;
}

const program = new Command();

program
  .name('xml-introspect')
  .description('XML Introspector CLI Tool')
  .version('0.1.0')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-h, --help', 'Show help');

// Schema command
program
  .command('schema')
  .description('Generate XSD schema from XML file or URL')
  .argument('<input>', 'Input XML file path or URL')
  .argument('[output]', 'Output XSD file path')
  .option('-n, --namespace <url>', 'Target namespace for XSD generation')
  .option('--element-form <type>', 'Element form default (qualified/unqualified)', 'qualified')
  .option('--attribute-form <type>', 'Attribute form default (qualified/unqualified)', 'unqualified')
  .option('--multi-file-mode <mode>', 'Multi-file mode: comprehensive, primary-only, or language-specific', 'comprehensive')
  .option('--no-prompt', 'Skip interactive prompts and use default multi-file mode')
  .action(async (input, output, options) => {
    try {
      verbose = program.opts().verbose || false;
      let xsd: string = '';
    
    console.log(`🚀 Starting XML Introspector CLI...`);
      logVerbose(`📁 Input: ${input}`);
      logVerbose(`📄 Output: ${output || 'stdout'}`);
      logVerbose(`🔧 Command: schema`);
    logVerbose('');

        logVerbose('🔄 Generating XSD schema from XML...');
        logVerbose('⏳ This may take a while for large files...');
        
        const startTime = Date.now();
      const projectId = getProjectId(input, 'schema');
      const processedInput = await processUrlOrFile(input, projectId);
      
      let isTempFile = processedInput !== input;
      let actualFilePath = processedInput;
      
      // Handle the new object structure for multi-file mode
      if (typeof processedInput === 'object' && processedInput.filePath) {
        actualFilePath = processedInput.filePath;
      }
      
      try {
        // Check if we're in multi-file mode
        const multiFileMode = (processedInput as any).__multiFileMode;
        const allXmlFiles = (processedInput as any).__allXmlFiles;
        
        if (multiFileMode && allXmlFiles) {
          // Determine multi-file mode based on command-line options or prompt
          let selectedMode: MultiFileMode;
          
          if (options.noPrompt) {
            // Use command-line specified mode
            selectedMode = options.multiFileMode as MultiFileMode;
            logVerbose(`🔍 Multi-file mode: ${selectedMode} (from command line)`);
          } else {
            // Prompt user for multi-file mode selection
            selectedMode = await promptMultiFileMode(allXmlFiles);
            logVerbose(`🔍 Multi-file mode: ${selectedMode} selected`);
          }
          
          if (selectedMode === 'comprehensive') {
            logVerbose(`📋 Generating comprehensive XSD that accommodates all XML structures...`);
            
            // Use the primary file (English WordNet) as the base since it's the most comprehensive
            const stats = statSync(actualFilePath);
            const fileSizeMB = stats.size / (1024 * 1024);
            const isLargeFile = stats.size > 10 * 1024 * 1024; // 10MB threshold
            
            if (isLargeFile) {
              logVerbose(`📊 Large file detected (${fileSizeMB.toFixed(1)} MB), using streaming analysis...`);
              const streamingIntrospector = new NodeXMLIntrospector();
              xsd = await streamingIntrospector.generateXSDFromXML(actualFilePath, {
                targetNamespace: options.namespace,
                elementForm: options.elementForm as 'qualified' | 'unqualified',
                attributeForm: options.attributeForm as 'qualified' | 'unqualified'
              });
            } else {
              logVerbose(`📊 Small file detected (${fileSizeMB.toFixed(1)} MB), using standard analysis...`);
              const introspector = new NodeXMLIntrospector();
              xsd = await introspector.generateXSDFromXML(actualFilePath, {
                targetNamespace: options.namespace,
                elementForm: options.elementForm as 'qualified' | 'unqualified',
                attributeForm: options.attributeForm as 'qualified' | 'unqualified',
                verbose: verbose
              });
            }
            
            logVerbose(`✅ Generated comprehensive XSD based on primary file (${allXmlFiles[0]?.name})`);
            logVerbose(`💡 This XSD should validate against all ${allXmlFiles.length} XML files in the archive`);
            
          } else if (selectedMode === 'primary-only') {
            logVerbose(`📋 Generating XSD from primary file only...`);
            
            const stats = statSync(actualFilePath);
            const fileSizeMB = stats.size / (1024 * 1024);
            const isLargeFile = stats.size > 10 * 1024 * 1024; // 10MB threshold
            
            if (isLargeFile) {
              logVerbose(`📊 Large file detected (${fileSizeMB.toFixed(1)} MB), using streaming analysis...`);
              const streamingIntrospector = new NodeXMLIntrospector();
              xsd = await streamingIntrospector.generateXSDFromXML(actualFilePath, {
                targetNamespace: options.namespace,
                elementForm: options.elementForm as 'qualified' | 'unqualified',
                attributeForm: options.attributeForm as 'qualified' | 'unqualified'
              });
            } else {
              logVerbose(`📊 Small file detected (${fileSizeMB.toFixed(1)} MB), using standard analysis...`);
              const introspector = new NodeXMLIntrospector();
              xsd = await introspector.generateXSDFromXML(actualFilePath, {
                targetNamespace: options.namespace,
                elementForm: options.elementForm as 'qualified' | 'unqualified',
                attributeForm: options.attributeForm as 'qualified' | 'unqualified',
                verbose: verbose
              });
            }
            
            logVerbose(`✅ Generated XSD from primary file (${allXmlFiles[0]?.name})`);
            
          } else if (selectedMode === 'language-specific') {
            logVerbose(`📋 Generating language-specific XSDs...`);
            console.log(`⚠️  Language-specific mode not yet implemented. Falling back to comprehensive mode.`);
            
            // For now, fall back to comprehensive mode
            const stats = statSync(actualFilePath);
            const fileSizeMB = stats.size / (1024 * 1024);
            const isLargeFile = stats.size > 10 * 1024 * 1024; // 10MB threshold
            
            if (isLargeFile) {
              logVerbose(`📊 Large file detected (${fileSizeMB.toFixed(1)} MB), using streaming analysis...`);
              const streamingIntrospector = new NodeXMLIntrospector();
              xsd = await streamingIntrospector.generateXSDFromXML(actualFilePath, {
                targetNamespace: options.namespace,
                elementForm: options.elementForm as 'qualified' | 'unqualified',
                attributeForm: options.attributeForm as 'qualified' | 'unqualified'
              });
            } else {
              logVerbose(`📊 Small file detected (${fileSizeMB.toFixed(1)} MB), using standard analysis...`);
              const introspector = new NodeXMLIntrospector();
              xsd = await introspector.generateXSDFromXML(actualFilePath, {
                targetNamespace: options.namespace,
                elementForm: options.elementForm as 'qualified' | 'unqualified',
                attributeForm: options.attributeForm as 'qualified' | 'unqualified',
                verbose: verbose
              });
            }
            
            logVerbose(`✅ Generated comprehensive XSD (language-specific mode not yet implemented)`);
          }
        } else {
          // Single file mode - original logic
          const stats = statSync(actualFilePath);
          const fileSizeMB = stats.size / (1024 * 1024);
          const isLargeFile = stats.size > 10 * 1024 * 1024; // 10MB threshold
          
          if (isLargeFile) {
            logVerbose(`📊 Large file detected (${fileSizeMB.toFixed(1)} MB), using streaming analysis...`);
            const streamingIntrospector = new NodeXMLIntrospector();
            xsd = await streamingIntrospector.generateXSDFromXML(actualFilePath, {
              targetNamespace: options.namespace,
              elementForm: options.elementForm as 'qualified' | 'unqualified',
              attributeForm: options.attributeForm as 'qualified' | 'unqualified'
            });
          } else {
            logVerbose(`📊 Small file detected (${fileSizeMB.toFixed(1)} MB), using standard analysis...`);
            const introspector = new NodeXMLIntrospector();
            xsd = await introspector.generateXSDFromXML(actualFilePath, {
          targetNamespace: options.namespace,
          elementForm: options.elementForm as 'qualified' | 'unqualified',
          attributeForm: options.attributeForm as 'qualified' | 'unqualified',
              verbose: verbose
            });
          }
        }
      } finally {
        if (isTempFile) {
          cleanupTempFile(actualFilePath);
        }
      }
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        logVerbose(`✅ XSD generation completed in ${duration.toFixed(2)} seconds`);
        logVerbose(`📊 Generated XSD size: ${(xsd.length / 1024).toFixed(2)} KB`);
        
      if (output) {
        writeFileSync(output, xsd);
        logVerbose(`💾 XSD saved to: ${output}`);
        } else {
          console.log('\n📋 Generated XSD:');
          console.log('─'.repeat(50));
          console.log(xsd);
        }
        console.log('✅ Command completed successfully');
    } catch (error) {
      console.error(`❌ Schema generation failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Sample command
program
  .command('sample')
  .description('Generate a sample XML from input file')
  .argument('<input>', 'Input XML file path')
  .argument('[output]', 'Output XML file path')
  .option('-m, --max-elements <number>', 'Maximum number of elements', '100')
  .option('-d, --max-depth <number>', 'Maximum nesting depth', '5')
  .action(async (input, output, options) => {
    try {
      verbose = program.opts().verbose || false;
      
      console.log(`🚀 Starting XML Introspector CLI...`);
      logVerbose(`📁 Input: ${input}`);
      logVerbose(`📄 Output: ${output || 'stdout'}`);
      logVerbose(`🔧 Command: sample`);
      logVerbose('');

      const introspector = new NodeXMLIntrospector();
      
      const sample = await introspector.generateSample(input, {
        maxElements: parseInt(options.maxElements),
        maxDepth: parseInt(options.maxDepth)
      });
      
      if (output) {
        writeFileSync(output, sample, 'utf8');
        logVerbose(`✅ Sample XML written to ${output}`);
        } else {
          console.log(sample);
        }
        console.log('✅ Command completed successfully');
    } catch (error) {
      console.error(`❌ Sample generation failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Generate command
program
  .command('generate')
  .description('Generate XML from XSD schema')
  .argument('<xsd>', 'Input XSD file path')
  .argument('[output]', 'Output XML file path')
  .option('-m, --max-elements <number>', 'Maximum number of elements', '100')
  .option('-d, --max-depth <number>', 'Maximum nesting depth', '5')
  .option('-s, --seed <number>', 'Random seed for consistent generation')
  .option('-r, --realistic', 'Use Faker for realistic data generation')
  .action(async (xsd, output, options) => {
    try {
      verbose = program.opts().verbose || false;
      
      console.log(`🚀 Starting XML Introspector CLI...`);
      logVerbose(`📁 Input: ${xsd}`);
      logVerbose(`📄 Output: ${output || 'stdout'}`);
      logVerbose(`🔧 Command: generate`);
      logVerbose('');

      const introspector = new NodeXMLIntrospector();
        
        let xml: string;
        if (options.realistic) {
        xml = await introspector.generateXMLFromXSDWithFaker(xsd, {
          seed: options.seed ? parseInt(options.seed) : undefined,
          maxDepth: parseInt(options.maxDepth),
          maxChildren: parseInt(options.maxElements),
            realisticData: true
          });
        } else {
        xml = await introspector.generateXMLFromXSD(xsd, {
          maxElements: parseInt(options.maxElements),
            generateRealisticData: false
          });
        }
        
      if (output) {
        writeFileSync(output, xml, 'utf8');
        logVerbose(`✅ Generated XML written to ${output}`);
        } else {
          console.log(xml);
        }
        console.log('✅ Command completed successfully');
    } catch (error) {
      console.error(`❌ XML generation failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Roundtrip command
program
  .command('roundtrip')
  .description('XML -> XAST -> XML roundtrip')
  .argument('<input>', 'Input XML file path')
  .argument('[output]', 'Output XML file path')
  .option('-r, --realistic', 'Use enhanced roundtrip with realistic data')
  .action(async (input, output, options) => {
    try {
      verbose = program.opts().verbose || false;
      
      console.log(`🚀 Starting XML Introspector CLI...`);
      logVerbose(`📁 Input: ${input}`);
      logVerbose(`📄 Output: ${output || 'stdout'}`);
      logVerbose(`🔧 Command: roundtrip`);
      logVerbose('');

      const introspector = new NodeXMLIntrospector();
        
        let result: string;
        if (options.realistic) {
        result = await introspector.xmlToXASTToXMLEnhanced(input);
        } else {
        result = await introspector.xmlToXASTToXML(input);
      }
      
      if (output) {
        writeFileSync(output, result, 'utf8');
        logVerbose(`✅ Roundtrip XML written to ${output}`);
        } else {
          console.log(result);
        }
        console.log('✅ Command completed successfully');
    } catch (error) {
      console.error(`❌ Roundtrip failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Expand command
program
  .command('expand')
  .description('Expand small XML to larger XML')
  .argument('<input>', 'Input XML file path')
  .argument('<output>', 'Output XML file path')
  .option('-t, --target-size <number>', 'Target size for expansion', '1000')
  .option('-s, --seed <number>', 'Random seed for consistent generation')
  .option('-d, --max-depth <number>', 'Maximum nesting depth', '5')
  .option('-r, --realistic', 'Use Faker for realistic data generation')
  .action(async (input, output, options) => {
    try {
      verbose = program.opts().verbose || false;
      
      console.log(`🚀 Starting XML Introspector CLI...`);
      logVerbose(`📁 Input: ${input}`);
      logVerbose(`📄 Output: ${output}`);
      logVerbose(`🔧 Command: expand`);
      logVerbose('');

      const introspector = new NodeXMLIntrospector();
        
        if (options.realistic) {
          const realisticXML = await introspector.generateRealisticExpandedXML(
          input, 
          parseInt(options.targetSize),
            {
            seed: options.seed ? parseInt(options.seed) : undefined,
            maxDepth: parseInt(options.maxDepth),
              realisticData: true
            }
          );
        writeFileSync(output, realisticXML);
        } else {
          await introspector.transformSmallToBig(
          input, 
          output, 
          parseInt(options.targetSize)
        );
      }
      
      logVerbose(`✅ Expanded XML written to ${output}`);
        console.log('✅ Command completed successfully');
    } catch (error) {
      console.error(`❌ Expansion failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Realistic command
program
  .command('realistic')
  .description('Generate realistic XML using Faker')
  .argument('<input>', 'Input XML file path')
  .argument('[output]', 'Output XML file path')
  .option('-s, --seed <number>', 'Random seed for consistent generation')
  .option('-d, --max-depth <number>', 'Maximum nesting depth', '5')
  .option('-m, --max-elements <number>', 'Maximum number of elements', '100')
  .action(async (input, output, options) => {
    try {
      verbose = program.opts().verbose || false;
      
      console.log(`🚀 Starting XML Introspector CLI...`);
      logVerbose(`📁 Input: ${input}`);
      logVerbose(`📄 Output: ${output || 'stdout'}`);
      logVerbose(`🔧 Command: realistic`);
      logVerbose('');

      const introspector = new NodeXMLIntrospector();
      
      const realisticXML = await introspector.generateRealisticSample(input, {
        seed: options.seed ? parseInt(options.seed) : undefined,
        maxDepth: parseInt(options.maxDepth),
        maxChildren: parseInt(options.maxElements),
          realisticData: true
        });
        
      if (output) {
        writeFileSync(output, realisticXML, 'utf8');
        logVerbose(`✅ Realistic XML written to ${output}`);
        } else {
          console.log(realisticXML);
        }
        console.log('✅ Command completed successfully');
    } catch (error) {
      console.error(`❌ Realistic generation failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate XML against XSD schema')
  .argument('<xml>', 'XML file path or URL')
  .argument('<xsd>', 'XSD schema file path')
  .action(async (xml, xsd) => {
    try {
      verbose = program.opts().verbose || false;
      
      console.log(`🚀 Starting XML Introspector CLI...`);
      logVerbose(`📁 XML: ${xml}`);
      logVerbose(`📄 XSD: ${xsd}`);
      logVerbose(`🔧 Command: validate`);
      logVerbose('');

      const introspector = new NodeXMLIntrospector();
      
      // Process URL or file input
      const projectId = getProjectId(xml, 'validate');
      const processedXml = await processUrlOrFile(xml, projectId);
      
      // Extract the actual file path from the processed result
      let xmlFilePath = processedXml;
      if (typeof processedXml === 'object' && processedXml.filePath) {
        xmlFilePath = processedXml.filePath;
      }
      
      const validation = await introspector.validateXML(xmlFilePath, xsd);
        
        if (validation.valid) {
          console.log('✅ XML is valid according to the XSD schema');
        } else {
          console.log('❌ XML validation failed:');
          validation.errors.forEach(error => {
            // Handle different error formats from xmllint-wasm
            const errorMessage = (error as any)?.message || error?.toString() || String(error);
            console.log(`  - ${errorMessage}`);
          });
        }
        console.log('✅ Command completed successfully');
        
        // Clean up temporary file if it was created
        if (typeof processedXml === 'object' && processedXml.filePath && processedXml.filePath !== xml) {
          cleanupTempFile(processedXml.filePath);
        }
    } catch (error) {
      console.error(`❌ Validation failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Preview command
program
  .command('preview')
  .description('Preview and summarize XML file from URL or local file')
  .argument('<input>', 'URL or local file path')
  .action(async (input) => {
    try {
      verbose = program.opts().verbose || false;
      
      console.log(`🚀 Starting XML Introspector CLI...`);
      logVerbose(`📁 Input: ${input}`);
      logVerbose(`🔧 Command: preview`);
      logVerbose('');
        
        logVerbose('🌐 Downloading and analyzing file from URL...');
      logVerbose(`📥 URL: ${input}`);
        
          let arrayBuffer: ArrayBuffer;
          let isLocalFile = false;
          
          // Check if it's a local file
      if (input.startsWith('file://') || (!input.startsWith('http://') && !input.startsWith('https://'))) {
            // Handle local file
        const filePath = input.startsWith('file://') 
          ? input.replace('file://', '') 
          : input;
            const fileBuffer = readFileSync(filePath);
            arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
            isLocalFile = true;
            logVerbose(`📁 Reading local file: ${filePath}`);
          } else {
            // Handle remote URL
        const response = await fetch(input);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            arrayBuffer = await response.arrayBuffer();
            logVerbose(`📊 Downloaded ${arrayBuffer.byteLength} bytes`);
          }
          
          // Use data-loader to process the file
          const dataLoader = new FormatProcessor();
      const projectId = getProjectId(input, 'preview');
          
          logVerbose('🔄 Processing file with data-loader...');
          const result = await dataLoader.processData(arrayBuffer, {
            projectId,
            enableTarExtraction: true
          });
          
          if (!result.success) {
            throw new Error(`Failed to process file: ${result.error}`);
          }
          
          const content = result.xmlContent!;
          const contentType = result.contentType;
          
          const lines = content.split('\n');
          const totalLines = lines.length;
          
          console.log('\n📋 File Summary:');
          console.log('═'.repeat(50));
      console.log(`📁 ${isLocalFile ? 'File' : 'URL'}: ${input}`);
          console.log(`📊 Original size: ${result.originalSize.toLocaleString()} bytes`);
          console.log(`📊 Final size: ${result.finalSize.toLocaleString()} characters`);
          console.log(`📄 Total lines: ${totalLines.toLocaleString()}`);
          console.log(`🔍 Content type: ${contentType} (confidence: ${result.confidence})`);
          console.log(`⏱️  Processing time: ${result.totalProcessingTime}ms`);
          console.log(`🔄 Processing steps: ${result.processingSteps.join(' → ')}`);
          
          if (totalLines <= 400) {
            // If file is small, show everything
            console.log('\n📄 Full Content:');
            console.log('─'.repeat(50));
            console.log(content);
          } else {
            // Show first and last 200 lines
            const firstLines = lines.slice(0, 200).join('\n');
            const lastLines = lines.slice(-200).join('\n');
            
            console.log('\n📄 First 200 lines:');
            console.log('─'.repeat(50));
            console.log(firstLines);
            console.log('\n... (content truncated) ...\n');
            console.log('📄 Last 200 lines:');
            console.log('─'.repeat(50));
            console.log(lastLines);
          }
          
          console.log('\n✅ Preview completed successfully');
        } catch (error) {
          console.error(`❌ Preview failed: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
  });

// Configure program to exit with code 0 for help
program.exitOverride((err) => {
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  throw err;
});

// Parse command line arguments
program.parse();

export { processUrlOrFile, cleanupTempFile, getProjectId };