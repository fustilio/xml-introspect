#!/usr/bin/env node

import { XMLIntrospector } from './XMLIntrospector.js';
import { XMLFakerGenerator, XMLFakerOptions } from './XMLFakerGenerator.js';
import { FormatProcessor } from '@xml-introspect/data-loader';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface CLIOptions {
  input?: string;
  output?: string;
  command: string;
  maxElements?: number;
  maxDepth?: number;
  seed?: number;
  realistic?: boolean;
  targetSize?: number;
  namespace?: string;
  elementForm?: 'qualified' | 'unqualified';
  attributeForm?: 'qualified' | 'unqualified';
  help?: boolean;
  verbose?: boolean;
}

// Global verbose flag
let verbose = false;

// Helper function for verbose logging
function logVerbose(message: string) {
  if (verbose) {
    console.log(message);
  }
}

function printHelp() {
  console.log(`
XML Introspector CLI Tool

Usage: xml-introspect <command> [options]

Commands:
  sample <input> [options]     Generate a sample XML from input file
  schema <input> [options]     Generate XSD schema from XML file
  generate <xsd> [options]     Generate XML from XSD schema
  roundtrip <input> [options]  XML -> XAST -> XML roundtrip
  expand <input> [options]     Expand small XML to larger XML
  realistic <input> [options]  Generate realistic XML using Faker
  validate <xml> <xsd>         Validate XML against XSD schema
  preview <url> [options]      Preview and summarize XML file from URL

Options:
  -i, --input <file>           Input XML/XSD file path
  -o, --output <file>          Output file path
  -m, --max-elements <number>  Maximum number of elements (default: 100)
  -d, --max-depth <number>     Maximum nesting depth (default: 5)
  -s, --seed <number>          Random seed for consistent generation
  -r, --realistic              Use Faker for realistic data generation
  -t, --target-size <number>   Target size for expansion (default: 1000)
  -n, --namespace <url>        Target namespace for XSD generation
  --element-form <type>        Element form default (qualified/unqualified)
  --attribute-form <type>      Attribute form default (qualified/unqualified)
  -v, --verbose                Enable verbose output
  -h, --help                   Show this help message

Examples:
  xml-introspect sample input.xml -o sample.xml -m 50
  xml-introspect schema input.xml -o schema.xsd -n "http://example.com"
  xml-introspect generate schema.xsd -o output.xml -r -s 12345
  xml-introspect realistic input.xml -o realistic.xml -s 42
  xml-introspect expand small.xml -o large.xml -t 5000
  xml-introspect preview https://example.com/data.xml.gz
`);
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = { command: '' };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case 'sample':
      case 'schema':
      case 'generate':
      case 'roundtrip':
      case 'expand':
      case 'realistic':
      case 'validate':
      case 'preview':
        options.command = arg;
        // Handle positional arguments: first is input, second is output
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          options.input = args[i + 1];
          i++; // Skip the input argument
          
          // Check if there's a second positional argument for output
          if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
            options.output = args[i + 1];
            i++; // Skip the output argument
          }
        }
        break;
        
      case '-i':
      case '--input':
        options.input = args[++i];
        break;
        
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
        
      case '-m':
      case '--max-elements':
        options.maxElements = parseInt(args[++i]);
        break;
        
      case '-d':
      case '--max-depth':
        options.maxDepth = parseInt(args[++i]);
        break;
        
      case '-s':
      case '--seed':
        options.seed = parseInt(args[++i]);
        break;
        
      case '-r':
      case '--realistic':
        options.realistic = true;
        break;
        
      case '-t':
      case '--target-size':
        options.targetSize = parseInt(args[++i]);
        break;
        
      case '-n':
      case '--namespace':
        options.namespace = args[++i];
        break;
        
      case '--element-form':
        options.elementForm = args[++i] as 'qualified' | 'unqualified';
        break;
        
      case '--attribute-form':
        options.attributeForm = args[++i] as 'qualified' | 'unqualified';
        break;
        
      case '-v':
      case '--verbose':
        options.verbose = true;
        break;
        
      case '-h':
      case '--help':
        options.help = true;
        break;
    }
  }
  
  return options;
}

async function runCommand(options: CLIOptions) {
  try {
    // Set global verbose flag
    verbose = options.verbose || false;
    
    console.log(`🚀 Starting XML Introspector CLI...`);
    logVerbose(`📁 Input file: ${options.input}`);
    logVerbose(`📄 Output file: ${options.output || 'stdout'}`);
    logVerbose(`🔧 Command: ${options.command}`);
    logVerbose('');

    const introspector = new XMLIntrospector();
    
    switch (options.command) {
      case 'schema':
        logVerbose('🔄 Generating XSD schema from XML...');
        logVerbose('⏳ This may take a while for large files...');
        
        const startTime = Date.now();
        const xsd = await introspector.generateXSDFromXML(options.input!, {
          targetNamespace: options.namespace,
          elementForm: options.elementForm as 'qualified' | 'unqualified',
          attributeForm: options.attributeForm as 'qualified' | 'unqualified',
          verbose: options.verbose
        });
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        logVerbose(`✅ XSD generation completed in ${duration.toFixed(2)} seconds`);
        logVerbose(`📊 Generated XSD size: ${(xsd.length / 1024).toFixed(2)} KB`);
        
        if (options.output) {
          writeFileSync(options.output, xsd);
          logVerbose(`💾 XSD saved to: ${options.output}`);
        } else {
          console.log('\n📋 Generated XSD:');
          console.log('─'.repeat(50));
          console.log(xsd);
        }
        console.log('✅ Command completed successfully');
        process.exit(0);
        break;
        
      case 'sample':
        if (!options.input) {
          throw new Error('Input file is required for sample command');
        }
        
        const sample = await introspector.generateSample(options.input, {
          maxElements: options.maxElements || 100,
          maxDepth: options.maxDepth || 5
        });
        
        if (options.output) {
          writeFileSync(options.output, sample, 'utf8');
          logVerbose(`✅ Sample XML written to ${options.output}`);
        } else {
          console.log(sample);
        }
        console.log('✅ Command completed successfully');
        process.exit(0);
        break;
        
      case 'generate':
        if (!options.input) {
          throw new Error('Input XSD file is required for generate command');
        }
        
        let xml: string;
        if (options.realistic) {
          xml = await introspector.generateXMLFromXSDWithFaker(options.input, {
            seed: options.seed,
            maxDepth: options.maxDepth || 5,
            maxChildren: options.maxElements || 100,
            realisticData: true
          });
        } else {
          xml = await introspector.generateXMLFromXSD(options.input, {
            maxElements: options.maxElements || 100,
            generateRealisticData: false
          });
        }
        
        if (options.output) {
          writeFileSync(options.output, xml, 'utf8');
          logVerbose(`✅ Generated XML written to ${options.output}`);
        } else {
          console.log(xml);
        }
        console.log('✅ Command completed successfully');
        process.exit(0);
        break;
        
      case 'roundtrip':
        if (!options.input) {
          throw new Error('Input file is required for roundtrip command');
        }
        
        let result: string;
        if (options.realistic) {
          result = await introspector.xmlToXASTToXMLEnhanced(options.input);
        } else {
          result = await introspector.xmlToXASTToXML(options.input);
        }
        
        if (options.output) {
          writeFileSync(options.output, result, 'utf8');
          logVerbose(`✅ Roundtrip XML written to ${options.output}`);
        } else {
          console.log(result);
        }
        console.log('✅ Command completed successfully');
        process.exit(0);
        break;
        
      case 'expand':
        if (!options.input) {
          throw new Error('Input file is required for expand command');
        }
        
        if (!options.output) {
          throw new Error('Output file is required for expand command');
        }
        
        if (options.realistic) {
          const realisticXML = await introspector.generateRealisticExpandedXML(
            options.input, 
            options.targetSize || 1000,
            {
              seed: options.seed,
              maxDepth: options.maxDepth || 5,
              realisticData: true
            }
          );
          writeFileSync(options.output, realisticXML);
        } else {
          await introspector.transformSmallToBig(
            options.input, 
            options.output, 
            options.targetSize || 1000
          );
        }
        
        logVerbose(`✅ Expanded XML written to ${options.output}`);
        console.log('✅ Command completed successfully');
        process.exit(0);
        break;
        
      case 'realistic':
        if (!options.input) {
          throw new Error('Input file is required for realistic command');
        }
        
        const realisticXML = await introspector.generateRealisticSample(options.input, {
          seed: options.seed,
          maxDepth: options.maxDepth || 5,
          maxChildren: options.maxElements || 100,
          realisticData: true
        });
        
        if (options.output) {
          writeFileSync(options.output, realisticXML, 'utf8');
          logVerbose(`✅ Realistic XML written to ${options.output}`);
        } else {
          console.log(realisticXML);
        }
        console.log('✅ Command completed successfully');
        process.exit(0);
        break;
        
      case 'validate':
        if (!options.input || !options.output) {
          throw new Error('Both XML and XSD files are required for validate command');
        }
        
        const validation = await introspector.validateXML(options.input, options.output);
        
        if (validation.valid) {
          console.log('✅ XML is valid according to the XSD schema');
        } else {
          console.log('❌ XML validation failed:');
          validation.errors.forEach(error => {
            console.log(`  - ${error.message}`);
          });
        }
        console.log('✅ Command completed successfully');
        process.exit(0);
        break;
        
      case 'preview':
        if (!options.input) {
          throw new Error('URL is required for preview command');
        }
        
        logVerbose('🌐 Downloading and analyzing file from URL...');
        logVerbose(`📥 URL: ${options.input}`);
        
        try {
          let arrayBuffer: ArrayBuffer;
          let isLocalFile = false;
          
          // Check if it's a local file
          if (options.input.startsWith('file://') || (!options.input.startsWith('http://') && !options.input.startsWith('https://'))) {
            // Handle local file
            const filePath = options.input.startsWith('file://') 
              ? options.input.replace('file://', '') 
              : options.input;
            const fileBuffer = readFileSync(filePath);
            arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
            isLocalFile = true;
            logVerbose(`📁 Reading local file: ${filePath}`);
          } else {
            // Handle remote URL
            const response = await fetch(options.input);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            arrayBuffer = await response.arrayBuffer();
            logVerbose(`📊 Downloaded ${arrayBuffer.byteLength} bytes`);
          }
          
          // Use data-loader to process the file
          const dataLoader = new FormatProcessor();
          
          // Determine project ID from URL
          let projectId = 'unknown';
          if (options.input.includes('omw')) {
            projectId = 'omw:preview';
          } else if (options.input.includes('oewn') || options.input.includes('english-wordnet')) {
            projectId = 'oewn:preview';
          } else if (options.input.includes('cili')) {
            projectId = 'cili:preview';
          }
          
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
          console.log(`📁 ${isLocalFile ? 'File' : 'URL'}: ${options.input}`);
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
        process.exit(0);
        break;
        
      default:
        throw new Error(`Unknown command: ${options.command}`);
    }
  } catch (error) {
    console.error(`❌ An unexpected error occurred in the CLI:`);
    console.error(error); // Log the full error object
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  const options = parseArgs(args);

  if (!options.command) {
    console.error('❌ No command specified');
    printHelp();
    process.exit(1);
  }

  await runCommand(options);
  // Ensure clean exit after successful execution
  process.exit(0);
}

// This check ensures that the main function is only called when the script is executed directly
const scriptPath = process.argv[1];
if (scriptPath && (scriptPath.endsWith('cli.js') || scriptPath.endsWith('cli.ts'))) {
  main();
}

export { runCommand, parseArgs, printHelp };
