'use strict';

/**
 * Minimal YAML subset parser for structural checks (not a full syntax certification).
 *
 * The pilot must validate its workflow structurally (permissions, checkout
 * options, `if: always()`, real script names) without adding a dependency:
 * node_modules is not installed in this worktree and no YAML parser ships with
 * Node. Supported: block mappings, block sequences, plain/quoted scalars, flow
 * sequences and mappings, block scalars (| and >), comments, document start.
 * Anchors, aliases, tags and multi-document streams are rejected explicitly
 * rather than silently mis-parsed.
 */

class YamlError extends Error {
  constructor(message, line) {
    super(line === undefined ? message : message + ' (line ' + line + ')');
    this.name = 'YamlError';
    this.line = line;
  }
}

function stripComment(raw) {
  let out = '';
  let quote = null;
  for (let i = 0; i < raw.length; i += 1) {
    const c = raw[i];
    if (quote) {
      out += c;
      if (c === quote && raw[i - 1] !== '\\') quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      out += c;
      continue;
    }
    if (c === '#' && (i === 0 || /\s/.test(raw[i - 1]))) break;
    out += c;
  }
  return out.replace(/\s+$/, '');
}

function parseScalar(text) {
  const s = text.trim();
  if (s === '') return null;
  if (s === 'null' || s === '~') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+$/.test(s)) return Number(s);
  if (/^-?\d*\.\d+$/.test(s)) return Number(s);
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
  }
  if (s.startsWith("'") && s.endsWith("'") && s.length >= 2) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    if (inner === '') return [];
    return splitFlow(inner).map((x) => parseScalar(x));
  }
  if (s.startsWith('{') && s.endsWith('}')) {
    const inner = s.slice(1, -1).trim();
    const obj = {};
    if (inner === '') return obj;
    for (const part of splitFlow(inner)) {
      const idx = part.indexOf(':');
      if (idx < 0) throw new YamlError('invalid flow mapping entry: ' + part);
      obj[parseKey(part.slice(0, idx))] = parseScalar(part.slice(idx + 1));
    }
    return obj;
  }
  if (/:\s/.test(s)) throw new YamlError('colon-space in unquoted scalar: ' + s);
  return s;
}

function splitFlow(inner) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let current = '';
  for (let i = 0; i < inner.length; i += 1) {
    const c = inner[i];
    if (quote) {
      current += c;
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      current += c;
      continue;
    }
    if (c === '[' || c === '{') depth += 1;
    if (c === ']' || c === '}') depth -= 1;
    if (c === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += c;
  }
  if (current.trim() !== '') parts.push(current.trim());
  return parts;
}

function parseKey(raw) {
  const k = raw.trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) return k.slice(1, -1);
  return k;
}

/** Split "key: value" honouring quotes; returns null when there is no key. */
function splitKey(text) {
  let quote = null;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === '[' || c === '{') return null;
    if (c === ':' && (i + 1 === text.length || /\s/.test(text[i + 1]))) {
      return { key: parseKey(text.slice(0, i)), rest: text.slice(i + 1).trim() };
    }
  }
  return null;
}

function parse(source) {
  const rawLines = String(source).split(/\r?\n/);
  const lines = [];
  rawLines.forEach((raw, index) => {
    if (/^\s*(?:#.*)?$/.test(raw)) return;
    if (/^(---|\.\.\.)\s*$/.test(raw)) return;
    if (/(^|\s)[&*][A-Za-z0-9_-]+/.test(stripComment(raw))) {
      throw new YamlError('anchors and aliases are not supported by the pilot parser', index + 1);
    }
    const content = stripComment(raw);
    if (content.trim() === '') return;
    lines.push({ indent: content.match(/^\s*/)[0].length, text: content.trim(), number: index + 1 });
  });

  let pos = 0;

  function parseBlock(indent) {
    if (pos >= lines.length || lines[pos].indent < indent) return null;
    return lines[pos].text.startsWith('- ') || lines[pos].text === '-'
      ? parseSequence(indent)
      : parseMapping(indent);
  }

  function parseBlockScalar(indent, style) {
    const collected = [];
    let baseIndent = null;
    while (pos < lines.length && lines[pos].indent > indent) {
      if (baseIndent === null) baseIndent = lines[pos].indent;
      collected.push(' '.repeat(Math.max(0, lines[pos].indent - baseIndent)) + lines[pos].text);
      pos += 1;
    }
    return style === '|' ? collected.join('\n') + '\n' : collected.join(' ');
  }

  function parseValueAfterKey(indent, rest, lineNumber) {
    if (rest === '|' || rest === '>' || rest === '|-' || rest === '>-') {
      return parseBlockScalar(indent, rest[0]);
    }
    if (rest !== '') return parseScalar(rest);
    if (pos < lines.length && lines[pos].indent > indent) return parseBlock(lines[pos].indent);
    if (pos < lines.length && lines[pos].indent === indent && lines[pos].text.startsWith('- ')) {
      return parseSequence(indent);
    }
    if (pos < lines.length && lines[pos].indent > indent) {
      throw new YamlError('unexpected block under key', lineNumber);
    }
    return null;
  }

  function parseMapping(indent) {
    const obj = {};
    while (pos < lines.length && lines[pos].indent === indent) {
      const line = lines[pos];
      if (line.text.startsWith('- ')) break;
      const split = splitKey(line.text);
      if (!split) throw new YamlError('expected "key: value", got: ' + line.text, line.number);
      pos += 1;
      if (Object.prototype.hasOwnProperty.call(obj, split.key)) {
        throw new YamlError('duplicate key "' + split.key + '"', line.number);
      }
      obj[split.key] = parseValueAfterKey(indent, split.rest, line.number);
    }
    if (pos < lines.length && lines[pos].indent > indent) {
      throw new YamlError('inconsistent indentation', lines[pos].number);
    }
    return obj;
  }

  function parseSequence(indent) {
    const arr = [];
    while (pos < lines.length && lines[pos].indent === indent && (lines[pos].text === '-' || lines[pos].text.startsWith('- '))) {
      const line = lines[pos];
      const inline = line.text === '-' ? '' : line.text.slice(2).trim();
      pos += 1;
      if (inline === '') {
        arr.push(pos < lines.length && lines[pos].indent > indent ? parseBlock(lines[pos].indent) : null);
        continue;
      }
      const split = splitKey(inline);
      if (!split) {
        arr.push(parseScalar(inline));
        continue;
      }
      // "- key: value" opens a mapping whose indent is the dash column + 2.
      const itemIndent = indent + 2;
      const obj = {};
      obj[split.key] = parseValueAfterKey(itemIndent, split.rest, line.number);
      while (pos < lines.length && lines[pos].indent === itemIndent && !lines[pos].text.startsWith('- ')) {
        const nested = lines[pos];
        const s = splitKey(nested.text);
        if (!s) throw new YamlError('expected "key: value", got: ' + nested.text, nested.number);
        pos += 1;
        if (Object.prototype.hasOwnProperty.call(obj, s.key)) {
          throw new YamlError('duplicate key "' + s.key + '"', nested.number);
        }
        obj[s.key] = parseValueAfterKey(itemIndent, s.rest, nested.number);
      }
      arr.push(obj);
    }
    return arr;
  }

  if (lines.length === 0) return null;
  const doc = parseBlock(lines[0].indent);
  if (pos < lines.length) {
    throw new YamlError('unparsed trailing content: ' + lines[pos].text, lines[pos].number);
  }
  return doc;
}

module.exports = { parse, YamlError };
