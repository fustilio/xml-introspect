#!/usr/bin/env node

import { Command } from 'commander';
import { XMLIntrospector } from './XMLIntrospector.js';
import { StreamingXMLIntrospector } from './StreamingXMLIntrospector.js';
import { XMLFakerGenerator, XMLFakerOptions } from './XMLFakerGenerator.js';
import { FormatProcessor } from '@xml-introspect/data-loader';
import { readFileSync, writeFileSync, unlinkSync, statSync } from 'fs';

// Global verbose flag
let verbose = false;

// Helper function for verbose logging
function logVerbose(message: string) {
  if (verbose) {
    console.log(message);
  }
}

// Common URL handling logic
async function processUrlOrFile(input: string, projectId: string = 'unknown'): Promise<string> {
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
      throw new Error(`Failed to process file: ${result.error}`);
    }
    
    let xmlContent = result.xmlContent!;
    logVerbose(`📄 Extracted content: ${xmlContent.length} characters`);
    
    // Clean up the content by finding the actual XML start
    const xmlStart = xmlContent.indexOf('<?xml');
    if (xmlStart > 0) {
      xmlContent = xmlContent.substring(xmlStart);
      logVerbose(`🧹 Cleaned up content, removed ${xmlStart} characters of non-XML data`);
    }
    
    // Write the cleaned XML to a temporary file
    const tempFile = `temp_${Date.now()}.xml`;
    writeFileSync(tempFile, xmlContent, 'utf8');
    logVerbose(`💾 Temporary file created: ${tempFile}`);
    
    return tempFile;
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
  .action(async (input, output, options) => {
    try {
      verbose = program.opts().verbose || false;
      
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
      
      let xsd: string;
      let isTempFile = processedInput !== input;
      
      try {
        // Check file size to determine which introspector to use
        const stats = statSync(processedInput);
        const fileSizeMB = stats.size / (1024 * 1024);
        const isLargeFile = stats.size > 10 * 1024 * 1024; // 10MB threshold
        
        if (isLargeFile) {
          logVerbose(`📊 Large file detected (${fileSizeMB.toFixed(1)} MB), using streaming analysis...`);
          const streamingIntrospector = new StreamingXMLIntrospector();
          xsd = await streamingIntrospector.generateXSDFromXML(processedInput, {
            targetNamespace: options.namespace,
            elementForm: options.elementForm as 'qualified' | 'unqualified',
            attributeForm: options.attributeForm as 'qualified' | 'unqualified'
          });
        } else {
          logVerbose(`📊 Small file detected (${fileSizeMB.toFixed(1)} MB), using standard analysis...`);
          const introspector = new XMLIntrospector();
          xsd = await introspector.generateXSDFromXML(processedInput, {
            targetNamespace: options.namespace,
            elementForm: options.elementForm as 'qualified' | 'unqualified',
            attributeForm: options.attributeForm as 'qualified' | 'unqualified',
            verbose: verbose
          });
        }
      } finally {
        if (isTempFile) {
          cleanupTempFile(processedInput);
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
      console.error(`❌ Schema generation failed: ${error.message}`);
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

      const introspector = new XMLIntrospector();
      
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
      console.error(`❌ Sample generation failed: ${error.message}`);
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

      const introspector = new XMLIntrospector();
      
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
      console.error(`❌ XML generation failed: ${error.message}`);
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

      const introspector = new XMLIntrospector();
      
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
      console.error(`❌ Roundtrip failed: ${error.message}`);
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

      const introspector = new XMLIntrospector();
      
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
      console.error(`❌ Expansion failed: ${error.message}`);
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

      const introspector = new XMLIntrospector();
      
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
      console.error(`❌ Realistic generation failed: ${error.message}`);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate XML against XSD schema')
  .argument('<xml>', 'XML file path')
  .argument('<xsd>', 'XSD schema file path')
  .action(async (xml, xsd) => {
    try {
      verbose = program.opts().verbose || false;
      
      console.log(`🚀 Starting XML Introspector CLI...`);
      logVerbose(`📁 XML: ${xml}`);
      logVerbose(`📄 XSD: ${xsd}`);
      logVerbose(`🔧 Command: validate`);
      logVerbose('');

      const introspector = new XMLIntrospector();
      
      const validation = await introspector.validateXML(xml, xsd);
      
      if (validation.valid) {
        console.log('✅ XML is valid according to the XSD schema');
      } else {
        console.log('❌ XML validation failed:');
        validation.errors.forEach(error => {
          console.log(`  - ${error.message}`);
        });
      }
      console.log('✅ Command completed successfully');
    } catch (error) {
      console.error(`❌ Validation failed: ${error.message}`);
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
      console.error(`❌ Preview failed: ${error.message}`);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

export { processUrlOrFile, cleanupTempFile, getProjectId };