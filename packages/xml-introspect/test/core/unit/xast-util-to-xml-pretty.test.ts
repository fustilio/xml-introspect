import { describe, it, expect } from 'vitest';
import { toXmlPretty } from '../../../src/core/xast-util-to-xml-pretty';

describe('toXmlPretty', () => {
  it('should format a simple element', () => {
    const tree = {
      type: 'element',
      name: 'root',
      attributes: {},
      children: [],
    };
    const expected = '<root />';
    expect(toXmlPretty(tree)).toBe(expected);
  });

  it('should format an element with attributes', () => {
    const tree = {
      type: 'element',
      name: 'root',
      attributes: { id: '1', version: '1.0' },
      children: [],
    };
    const expected = '<root id="1" version="1.0" />';
    expect(toXmlPretty(tree)).toBe(expected);
  });

  it('should format an element with a text child', () => {
    const tree = {
      type: 'element',
      name: 'p',
      attributes: {},
      children: [{ type: 'text', value: 'Hello World' }],
    };
    const expected = '<p>Hello World</p>';
    expect(toXmlPretty(tree)).toBe(expected);
  });

  it('should format nested elements', () => {
    const tree = {
      type: 'element',
      name: 'root',
      attributes: {},
      children: [
        {
          type: 'element',
          name: 'child',
          attributes: { id: 'a' },
          children: [],
        },
      ],
    };
    const expected = [
      '<root>',
      '  <child id="a" />',
      '</root>',
    ].join('\n');
    expect(toXmlPretty(tree)).toBe(expected);
  });

  it('should handle a root node', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          name: 'a',
          attributes: {},
          children: [],
        },
        {
          type: 'element',
          name: 'b',
          attributes: {},
          children: [],
        },
      ],
    };
    const expected = [
      '<a />',
      '<b />',
    ].join('\n');
    expect(toXmlPretty(tree)).toBe(expected);
  });

  it('should handle processing instructions', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'instruction',
          name: 'xml',
          value: 'version="1.0" encoding="UTF-8"',
        },
        {
          type: 'element',
          name: 'root',
          attributes: {},
          children: [],
        },
      ],
    };
    const expected = '<?xml version="1.0" encoding="UTF-8"?>\n<root />';
    expect(toXmlPretty(tree)).toBe(expected);
  });

  it('should escape attribute values', () => {
    const tree = {
      type: 'element',
      name: 'tag',
      attributes: { special: '<>&"\' ' },
      children: [],
    };
    const expected = '<tag special="&lt;&gt;&amp;&quot;&#39; " />';
    expect(toXmlPretty(tree)).toBe(expected);
  });

  it('should escape text content', () => {
    const tree = {
      type: 'element',
      name: 'p',
      attributes: {},
      children: [{ type: 'text', value: '<em> & <p>' }],
    };
    const expected = '<p>&lt;em> &amp; &lt;p></p>';
    expect(toXmlPretty(tree)).toBe(expected);
  });

  it('should handle complex nested structure', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'instruction',
          name: 'xml',
          value: 'version="1.0"',
        },
        {
          type: 'element',
          name: 'catalog',
          children: [
            {
              type: 'element',
              name: 'book',
              attributes: { id: 'bk101' },
              children: [
                {
                  type: 'element',
                  name: 'author',
                  children: [{ type: 'text', value: 'Gambardella, Matthew' }],
                },
                {
                  type: 'element',
                  name: 'title',
                  children: [{ type: 'text', value: "XML Developer's Guide" }],
                },
              ],
            },
          ],
        },
      ],
    };

    const expected = `<?xml version="1.0"?>
<catalog>
  <book id="bk101">
    <author>Gambardella, Matthew</author>
    <title>XML Developer's Guide</title>
  </book>
</catalog>`;
    expect(toXmlPretty(tree)).toBe(expected);
  });

  it('should handle an array of nodes as input', () => {
    const tree = [
        {
          type: 'element',
          name: 'a',
          attributes: {},
          children: [],
        },
        {
          type: 'element',
          name: 'b',
          attributes: {},
          children: [],
        },
    ];
    const expected = [
      '<a />',
      '<b />',
    ].join('\n');
    expect(toXmlPretty(tree)).toBe(expected);
  });

  it('should handle elements with only whitespace text children as empty', () => {
    const tree = {
      type: 'element',
      name: 'p',
      attributes: {},
      children: [{ type: 'text', value: '  \n  ' }],
    };
    const expected = '<p />';
    expect(toXmlPretty(tree)).toBe(expected);
  });
});
