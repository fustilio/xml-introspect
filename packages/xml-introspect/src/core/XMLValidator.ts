/**
 * Shared XML Validation Logic
 *
 * This module contains the core XML validation functionality that can be used
 * by both Node.js and Browser implementations.
 */

import { validateXML, memoryPages } from 'xmllint-wasm';
import type {
  ValidationOptions,
  XMLValidationResult,
} from './types/base.js';
import { BrowserValidationOptions, BrowserXMLValidationResult } from './types/index.js';

// Re-export for backward compatibility
export type ValidationResult = XMLValidationResult;

/**
 * Validate XML against XSD using xmllint-wasm
 */
export async function validateXMLWithXSD(
  xmlContent: string,
  xsdContent: string,
  options: { initialMemoryPages?: number; maxMemoryPages?: number } = {}
): Promise<ValidationResult> {
  try {
    const result = await validateXML({
      xml: [
        {
          fileName: 'input.xml',
          contents: xmlContent,
        },
      ],
      schema: [xsdContent],
      initialMemoryPages: options.initialMemoryPages || 256,
      maxMemoryPages: options.maxMemoryPages || 2 * memoryPages.GiB,
    });

    return {
      valid: result.valid,
      errors: Array.from(result.errors).map(
        (error) => (error as any).message || String(error)
      ),
      warnings: (result as any).warnings
        ? Array.from((result as any).warnings).map(
            (warning: any) => warning.message || String(warning)
          )
        : [],
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        `Validation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      warnings: [],
    };
  }
}

/**
 * Convert Node.js ValidationOptions to shared options
 */
export function convertNodeValidationOptions(options: ValidationOptions): {
  initialMemoryPages?: number;
  maxMemoryPages?: number;
} {
  return {
    initialMemoryPages: options.initialMemoryPages,
    maxMemoryPages: options.maxMemoryPages,
  };
}

/**
 * Convert Browser ValidationOptions to shared options
 */
export function convertBrowserValidationOptions(
  options: BrowserValidationOptions
): { initialMemoryPages?: number; maxMemoryPages?: number } {
  return {
    initialMemoryPages: options.initialMemoryPages,
    maxMemoryPages: options.maxMemoryPages,
  };
}

/**
 * Convert shared ValidationResult to Node.js XMLValidationResult
 */
export function toNodeValidationResult(
  result: ValidationResult
): XMLValidationResult {
  return {
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
  };
}

/**
 * Convert shared ValidationResult to Browser XMLValidationResult
 */
export function toBrowserValidationResult(
  result: ValidationResult
): BrowserXMLValidationResult {
  return {
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
  };
}
