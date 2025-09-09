/**
 * Shared Sample Generation Logic
 *
 * This module contains the core sample generation functionality that can be used
 * by both Node.js and Browser implementations.
 */

import { SamplingStrategy } from './enums.js';
import type {
  XMLStructure,
  XMLElement,
  SamplingOptions,
  SamplingStrategyType,
  SampleGenerationOptions,
} from './types/base.js';
import { BrowserSamplingOptions } from './types/index.js';

/**
 * Select sample elements from XML structure
 */
export function selectSampleElements(
  structure: XMLStructure,
  options: SampleGenerationOptions
): XMLElement[] {
  const { maxElements = 100, strategy, preserveAllTypes } = options;
  const sampleElements: XMLElement[] = [];
  const referencedIds = new Set<string>();

  // Safety limit to prevent excessive processing
  const maxTotalElements = Math.min(maxElements * 10, 10000);
  let totalProcessed = 0;

  if (preserveAllTypes) {
    // Always include at least one of each element type to preserve structure
    for (const [tagName, typeInfo] of Array.from(
      structure.elementTypes?.entries() || []
    )) {
      if (totalProcessed >= maxTotalElements) break;

      if (typeInfo.examples.length > 0) {
        // Choose a diverse example - prefer ones with different attributes or content
        let bestExample = typeInfo.examples[0];
        let bestScore = 0;

        for (let i = 0; i < typeInfo.examples.length; i++) {
          const example = typeInfo.examples[i];
          const score =
            example.children.length +
            Object.keys(example.attributes).length +
            (example.textContent ? 1 : 0);

          // Prefer examples that are different from what we already have
          const isDuplicate = sampleElements.some(
            (existing) =>
              existing.tagName === example.tagName &&
              existing.attributes.id === example.attributes.id
          );

          if (!isDuplicate && score > bestScore) {
            bestExample = example;
            bestScore = score;
          }
        }

        // Add the best example
        sampleElements.push(bestExample);
        totalProcessed++;

        // Collect all referenced IDs from this example
        collectReferencedIds(bestExample, referencedIds);
      }
    }
  }

  // Select additional elements based on strategy, but ensure we don't exceed maxElements
  const remainingElements = Math.max(0, maxElements - sampleElements.length);

  if (remainingElements > 0) {
    if (strategy === SamplingStrategy.BALANCED) {
      selectBalancedElements(
        structure,
        remainingElements,
        sampleElements,
        maxTotalElements,
        totalProcessed,
        referencedIds
      );
    } else if (strategy === SamplingStrategy.RANDOM) {
      selectRandomElements(
        structure,
        remainingElements,
        sampleElements,
        maxTotalElements,
        totalProcessed,
        referencedIds
      );
    } else {
      selectFirstElements(
        structure,
        remainingElements,
        sampleElements,
        maxTotalElements,
        totalProcessed,
        referencedIds
      );
    }
  }

  // Ensure all referenced elements are included
  includeReferencedElements(
    structure,
    sampleElements,
    referencedIds,
    maxElements
  );

  // Sort elements by depth to maintain proper structure
  sampleElements.sort((a, b) => a.depth - b.depth);

  return sampleElements;
}

/**
 * Build sample XML from selected elements
 */
export function buildSampleXML(
  elements: XMLElement[],
  structure: XMLStructure,
  options: SampleGenerationOptions
): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';

  if (structure.rootElement) {
    xml += `<!DOCTYPE ${structure.rootElement} SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.3.dtd">\n`;
  }

  // Start with root element
  xml += `<${structure.rootElement}`;

  // Add namespace attributes if present
  for (const [key, value] of Array.from(
    (structure.namespaces as Map<string, string>)?.entries() || []
  )) {
    xml += ` ${key}="${value}"`;
  }
  xml += '>\n';

  // Add GlobalInformation if this is a WordNet-like structure
  if (structure.rootElement === 'LexicalResource') {
    xml += generateGlobalInformation();
  }

  const maxElements = options.maxElements || 100;
  let totalElementCount = 0;

  // Group elements by type for better structure
  const elementsByType = new Map<string, XMLElement[]>();
  for (const element of elements) {
    if (element.tagName === structure.rootElement) continue; // Skip root element

    if (!elementsByType.has(element.tagName)) {
      elementsByType.set(element.tagName, []);
    }
    elementsByType.get(element.tagName)!.push(element);
  }

  // Start with Lexicon if this is a WordNet structure
  if (
    structure.rootElement === 'LexicalResource' &&
    elementsByType.has('Lexicon')
  ) {
    const lexiconElements = elementsByType.get('Lexicon')!;
    if (lexiconElements.length > 0) {
      const lexicon = lexiconElements[0];
      const result = elementToXMLWithLimit(
        lexicon,
        options,
        maxElements,
        totalElementCount
      );
      xml += result.xml;
      totalElementCount = result.count;
      elementsByType.delete('Lexicon'); // Remove from remaining elements
    }
  }

  // Add remaining elements in proper order
  const elementOrder = [
    'LexicalEntry',
    'Synset',
    'Sense',
    'Lemma',
    'Form',
    'Definition',
    'ILIDefinition',
  ];
  for (const tagName of elementOrder) {
    if (totalElementCount >= maxElements) break;

    const typeElements = elementsByType.get(tagName);
    if (typeElements) {
      for (const element of typeElements) {
        if (totalElementCount >= maxElements) break;

        // Adjust depth to be child of Lexicon when inside LexicalResource
        const adjustedElement = { ...element };
        if (structure.rootElement === 'LexicalResource') {
          adjustedElement.depth = 2; // Make it child of Lexicon (which is child of LexicalResource)
        } else {
          adjustedElement.depth = 1; // Make it child of root
        }

        const elementXML = elementToXMLWithLimit(
          adjustedElement,
          options,
          maxElements,
          totalElementCount
        );
        xml += elementXML.xml;
        totalElementCount = elementXML.count;
      }
      elementsByType.delete(tagName);
    }
  }

  // Add any remaining elements
  for (const [tagName, typeElements] of elementsByType) {
    if (totalElementCount >= maxElements) break;

    for (const element of typeElements) {
      if (totalElementCount >= maxElements) break;

      const elementXML = elementToXMLWithLimit(
        element,
        options,
        maxElements,
        totalElementCount
      );
      xml += elementXML.xml;
      totalElementCount = elementXML.count;
    }
  }

  // Close Lexicon if we opened it
  if (structure.rootElement === 'LexicalResource') {
    xml += '  </Lexicon>\n';
  }

  // Close root element
  xml += `</${structure.rootElement}>\n`;

  return xml;
}

// Helper functions

function collectReferencedIds(
  element: XMLElement,
  referencedIds: Set<string>
): void {
  // Collect IDs from attributes that reference other elements
  for (const [key, value] of Object.entries(element.attributes)) {
    if (key === 'synset' || key === 'target' || key === 'members') {
      referencedIds.add(value);
    }
  }

  // Recursively collect from children
  for (const child of element.children) {
    collectReferencedIds(child, referencedIds);
  }
}

function includeReferencedElements(
  structure: XMLStructure,
  sampleElements: XMLElement[],
  referencedIds: Set<string>,
  maxElements: number
): void {
  // Find and include elements that are referenced but not yet in the sample
  for (const referencedId of Array.from(referencedIds)) {
    if (sampleElements.length >= maxElements) break;

    // Find the element with this ID
    for (const [tagName, typeInfo] of Array.from(
      structure.elementTypes?.entries() || []
    )) {
      for (const example of typeInfo.examples) {
        if (
          example.attributes.id === referencedId &&
          !sampleElements.some(
            (existing) => existing.attributes.id === referencedId
          )
        ) {
          // Ensure the element has required children for WordNet structure
          const enhancedElement = enhanceElementForWordNet(example, tagName);
          sampleElements.push(enhancedElement);
          break;
        }
      }
    }
  }
}

function enhanceElementForWordNet(
  element: XMLElement,
  tagName: string
): XMLElement {
  const enhanced = { ...element };

  // Add required children based on element type
  if (tagName === 'Synset') {
    // Synset must have Definition, and optionally ILIDefinition, SynsetRelation, Example
    if (!enhanced.children.some((c) => c.tagName === 'Definition')) {
      enhanced.children.push({
        tagName: 'Definition',
        attributes: {},
        children: [],
        depth: enhanced.depth + 1,
        parent: enhanced,
        textContent: 'Sample definition for ' + enhanced.attributes.id,
      });
    }

    // Add ILIDefinition if missing
    if (!enhanced.children.some((c) => c.tagName === 'ILIDefinition')) {
      enhanced.children.push({
        tagName: 'ILIDefinition',
        attributes: {},
        children: [],
        depth: enhanced.depth + 1,
        parent: enhanced,
        textContent: 'Sample ILI definition',
      });
    }
  }

  if (tagName === 'LexicalEntry') {
    // LexicalEntry must have Lemma, and optionally Form, Sense, SyntacticBehaviour
    if (!enhanced.children.some((c) => c.tagName === 'Lemma')) {
      enhanced.children.push({
        tagName: 'Lemma',
        attributes: {
          writtenForm: 'sample',
          partOfSpeech: 'n',
        },
        children: [],
        depth: enhanced.depth + 1,
        parent: enhanced,
      });
    }

    // Add Sense if missing
    if (!enhanced.children.some((c) => c.tagName === 'Sense')) {
      enhanced.children.push({
        tagName: 'Sense',
        attributes: {
          id: enhanced.attributes.id + '-1',
          synset: 'oewn-00000000-n',
        },
        children: [],
        depth: enhanced.depth + 1,
        parent: enhanced,
      });
    }

    // Add Form if missing
    if (!enhanced.children.some((c) => c.tagName === 'Form')) {
      enhanced.children.push({
        tagName: 'Form',
        attributes: {
          writtenForm: 'sample',
        },
        children: [],
        depth: enhanced.depth + 1,
        parent: enhanced,
      });
    }
  }

  // Ensure all elements have proper feat attributes for WordNet
  if (
    tagName === 'LexicalEntry' ||
    tagName === 'Synset' ||
    tagName === 'Sense'
  ) {
    // Add feat elements for required attributes
    const requiredFeats = ['dc:type', 'dc:source'];
    for (const featName of requiredFeats) {
      if (
        !enhanced.children.some(
          (c) => c.tagName === 'feat' && c.attributes.att === featName
        )
      ) {
        enhanced.children.push({
          tagName: 'feat',
          attributes: {
            att: featName,
            val: 'sample',
          },
          children: [],
          depth: enhanced.depth + 1,
          parent: enhanced,
        });
      }
    }
  }

  return enhanced;
}

function selectBalancedElements(
  structure: XMLStructure,
  count: number,
  sampleElements: XMLElement[],
  maxTotalElements: number,
  totalProcessed: number,
  referencedIds: Set<string>
): void {
  const elementTypes = Array.from(structure.elementTypes?.entries() || []);
  const elementsPerType = Math.floor(count / elementTypes.length);

  for (const [tagName, typeInfo] of elementTypes) {
    if (totalProcessed >= maxTotalElements) break;
    const examples = typeInfo.examples.slice(0, elementsPerType);
    sampleElements.push(...examples);
    totalProcessed += examples.length;
  }
}

function selectRandomElements(
  structure: XMLStructure,
  count: number,
  sampleElements: XMLElement[],
  maxTotalElements: number,
  totalProcessed: number,
  referencedIds: Set<string>
): void {
  const allExamples: XMLElement[] = [];
  for (const typeInfo of Array.from(structure.elementTypes?.values() || [])) {
    allExamples.push(...typeInfo.examples);
  }

  const shuffled = allExamples.sort(() => Math.random() - 0.5);
  for (const example of shuffled) {
    if (totalProcessed >= maxTotalElements) break;
    sampleElements.push(example);
    totalProcessed++;
  }
}

function selectFirstElements(
  structure: XMLStructure,
  count: number,
  sampleElements: XMLElement[],
  maxTotalElements: number,
  totalProcessed: number,
  referencedIds: Set<string>
): void {
  let added = 0;
  for (const typeInfo of Array.from(structure.elementTypes?.values() || [])) {
    if (totalProcessed >= maxTotalElements) break;
    for (const example of typeInfo.examples) {
      if (added >= count) break;
      sampleElements.push(example);
      totalProcessed++;
      added++;
    }
  }
}

function elementToXMLWithLimit(
  element: XMLElement,
  options: SampleGenerationOptions,
  maxElements: number,
  currentCount: number
): { xml: string; count: number } {
  if (currentCount >= maxElements) {
    return { xml: '', count: currentCount };
  }

  let xml = '';
  const indent = '  '.repeat(element.depth);

  // Opening tag
  xml += `${indent}<${element.tagName}`;

  // Add attributes
  for (const [key, value] of Object.entries(element.attributes)) {
    xml += ` ${key}="${value}"`;
  }

  if (element.children.length === 0 && !element.textContent) {
    // Self-closing tag
    xml += '/>\n';
    return { xml, count: currentCount + 1 };
  }

  xml += '>';

  // Add text content
  if (element.textContent) {
    xml += element.textContent;
  }

  // Add children
  if (element.children.length > 0) {
    xml += '\n';
    let childCount = currentCount + 1;

    for (const child of element.children) {
      if (childCount >= maxElements) break;

      const childResult = elementToXMLWithLimit(
        child,
        options,
        maxElements,
        childCount
      );
      xml += childResult.xml;
      childCount = childResult.count;
    }

    xml += `${indent}`;
  }

  // Closing tag
  xml += `</${element.tagName}>\n`;

  return { xml, count: currentCount + 1 };
}

function generateGlobalInformation(): string {
  return `  <GlobalInformation>
    <label>Open English WordNet</label>
    <dc:title>Open English WordNet</dc:title>
    <dc:description>Open English WordNet is a large lexical database of English</dc:description>
    <dc:creator>Open English WordNet</dc:creator>
    <dc:contributor>Princeton University</dc:contributor>
    <dc:date>2023</dc:date>
    <dc:format>WN-LMF 1.3</dc:format>
    <dc:language>en</dc:language>
    <dc:identifier>oewn</dc:identifier>
    <dc:version>2023</dc:version>
    <dc:license>https://creativecommons.org/licenses/by/4.0/</dc:license>
  </GlobalInformation>
  
  <Lexicon id="oewn" label="Open English WordNet" language="en" email="wordnet@princeton.edu" license="https://creativecommons.org/licenses/by/4.0/">
`;
}

/**
 * Convert Node.js SamplingOptions to shared options
 */
export function convertNodeSamplingOptions(
  options: SamplingOptions
): SampleGenerationOptions {
  return {
    maxElements: options.maxElements || 100,
    maxDepth: options.maxDepth || 5,
    strategy: options.strategy || SamplingStrategy.BALANCED,
    preserveAttributes: options.preserveAttributes || false,
    preserveRelationships: options.preserveRelationships || false,
    preserveAllTypes: options.preserveAllTypes || false,
    elementTypeLimits: options.elementTypeLimits || {},
  };
}

/**
 * Convert Browser SamplingOptions to shared options
 */
export function convertBrowserSamplingOptions(
  options: BrowserSamplingOptions
): SampleGenerationOptions {
  return {
    maxElements: options.maxElements || 100,
    maxDepth: options.maxDepth || 10,
    strategy: options.strategy || SamplingStrategy.BALANCED,
    preserveAttributes: options.preserveAttributes || true,
    preserveRelationships: options.preserveRelationships || true,
    preserveAllTypes: options.preserveAllTypes || true,
    elementTypeLimits: options.elementTypeLimits || {},
  };
}
