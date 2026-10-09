'use strict';

// Lossless transport of canonical JSON values. Logical contract hashes remain
// authoritative; transport hashes bind every bounded file and its descriptor.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const V = require('./vnext-contract');
const SCHEMA = 'kodjo.vnext.file-bundle.v1';
const LIMIT = 8 * 1024 * 1024;

function boundedJson(value, limit = LIMIT) {
  const overflow = {};
  let bytes = 0, chunks = [];
  try {
    V.writeCanonical(value, chunk => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > limit) throw overflow;
      chunks.push(chunk);
    });
  } catch (error) { if (error === overflow) return null; throw error; }
  return chunks.join('');
}

function partition(item, leaf, pretty = false) {
    const compact = boundedJson(item,pretty?LIMIT/8:LIMIT);
    const text = compact !== null && pretty ? JSON.stringify(JSON.parse(compact),null,2) : compact;
    if (text !== null && Buffer.byteLength(text) <= LIMIT) return leaf(text);
    if (Array.isArray(item)) {
      if (item.length === 1) return { kind: 'array', items: [partition(item[0], leaf, pretty)] };
      const middle = Math.floor(item.length / 2);
      return { kind: 'concat', parts: [partition(item.slice(0, middle), leaf, pretty), partition(item.slice(middle), leaf, pretty)] };
    }
    if (typeof item === 'string') {
      const parts = [];
      const length = Math.floor((pretty ? LIMIT / 8 : LIMIT) / 6);
      for (let i = 0; i < item.length; i += length) parts.push(partition(item.slice(i, i + length), leaf, pretty));
      return { kind: 'string', parts };
    }
    if (!V.isPlainObject(item)) V.fail('VNEXT_BUNDLE_VALUE_INVALID');
    return { kind: 'object', fields: Object.keys(item).map(key => [key, partition(item[key], leaf, pretty)]) };
}

function write(file, value, { exclusive = false, forceBundle = false, pretty = false } = {}) {
  const absolute = path.resolve(file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  if (!forceBundle) {
    const small = boundedJson(value);
    if (small !== null) {
      fs.writeFileSync(absolute, small + '\n', { flag: exclusive ? 'wx' : 'w' });
      return { format: 'json', file: absolute };
    }
  }
  const logicalHash = V.canonicalHash(value);
  const folder = path.basename(absolute) + '.parts-' + logicalHash;
  const directory = path.join(path.dirname(absolute), folder);
  if (fs.existsSync(directory) && fs.lstatSync(directory).isSymbolicLink()) V.fail('VNEXT_BUNDLE_SYMLINK');
  fs.mkdirSync(directory, { recursive: true });
  const leaf = text => {
    const hash = crypto.createHash('sha256').update(text, 'utf8').digest('hex');
    const name = hash + '.json', target = path.join(directory, name);
    if (fs.existsSync(target)) {
      if (fs.lstatSync(target).isSymbolicLink() || fs.readFileSync(target, 'utf8') !== text) V.fail('VNEXT_BUNDLE_PART_CHANGED');
    } else fs.writeFileSync(target, text, { flag: 'wx' });
    return { kind: 'file', file: name, sha256: hash, bytes: Buffer.byteLength(text) };
  };
  const manifest = V.sealContract({ schema_version: SCHEMA, logical_sha256: logicalHash, folder, root: partition(value, leaf, pretty) });
  const text = boundedJson(manifest);
  if (text === null) V.fail('VNEXT_BUNDLE_MANIFEST_TOO_LARGE');
  // Publish the manifest only after every referenced part exists.
  fs.writeFileSync(absolute, text + '\n', { flag: exclusive ? 'wx' : 'w' });
  return { format: SCHEMA, file: absolute, logical_sha256: logicalHash };
}

function describe(file, value, onFile = () => {}) {
  const logicalHash = V.canonicalHash(value);
  const folder = path.basename(file) + '.parts-' + logicalHash;
  const directory = path.join(path.dirname(file), folder);
  const leaf = text => {
    const hash = V.sha256(text), name = hash + '.json';
    onFile(path.join(directory, name).replace(/\\/g, '/'), text);
    return { kind: 'file', file: name, sha256: hash, bytes: Buffer.byteLength(text) };
  };
  const manifest = V.sealContract({ schema_version: SCHEMA, logical_sha256: logicalHash, folder, root: partition(value, leaf, true) });
  const text = boundedJson(manifest);
  if (text === null) V.fail('VNEXT_BUNDLE_MANIFEST_TOO_LARGE');
  onFile(file, text + '\n');
  return { file, manifest_sha256: V.sha256(text + '\n'), logical_sha256: logicalHash };
}

function read(file, { readText } = {}) {
  const get = readText || (name => {
    if (fs.lstatSync(name).isSymbolicLink()) V.fail('VNEXT_BUNDLE_SYMLINK');
    return fs.readFileSync(name, 'utf8');
  });
  const parsed = JSON.parse(get(file).replace(/^\uFEFF/, ''));
  if (parsed?.schema_version !== SCHEMA) return parsed;
  V.assertExactKeys(parsed, ['schema_version', 'logical_sha256', 'folder', 'root', 'contract_hash'], [], 'VNEXT_BUNDLE_MANIFEST_INVALID');
  V.verifyContractHash(parsed, 'VNEXT_BUNDLE_MANIFEST_HASH_INVALID');
  V.assertSha64(parsed.logical_sha256, 'VNEXT_BUNDLE_LOGICAL_HASH_INVALID');
  if (parsed.folder !== path.basename(file) + '.parts-' + parsed.logical_sha256) V.fail('VNEXT_BUNDLE_PATH_INVALID');
  const directory = path.join(path.dirname(file), parsed.folder);
  if (!readText && fs.lstatSync(directory).isSymbolicLink()) V.fail('VNEXT_BUNDLE_SYMLINK');
  let count = 0;
  const decode = (node, depth = 0) => {
    if (++count > 1000000 || depth > 128) V.fail('VNEXT_BUNDLE_DESCRIPTOR_LIMIT');
    if (node?.kind === 'file') {
      V.assertExactKeys(node, ['kind', 'file', 'sha256', 'bytes'], [], 'VNEXT_BUNDLE_DESCRIPTOR_INVALID');
      V.assertSha64(node.sha256, 'VNEXT_BUNDLE_PART_HASH_INVALID');
      if (node.file !== node.sha256 + '.json' || !Number.isInteger(node.bytes) || node.bytes < 1 || node.bytes > LIMIT) V.fail('VNEXT_BUNDLE_PATH_INVALID');
      const text = get(path.join(directory, node.file));
      if (Buffer.byteLength(text) !== node.bytes || crypto.createHash('sha256').update(text, 'utf8').digest('hex') !== node.sha256) V.fail('VNEXT_BUNDLE_PART_HASH_INVALID');
      return JSON.parse(text);
    }
    if (node?.kind === 'object') {
      V.assertExactKeys(node, ['kind', 'fields'], [], 'VNEXT_BUNDLE_DESCRIPTOR_INVALID');
      if (!Array.isArray(node.fields)) V.fail('VNEXT_BUNDLE_DESCRIPTOR_INVALID');
      const seen = new Set();
      return Object.fromEntries(node.fields.map(row => {
        if (!Array.isArray(row) || row.length !== 2 || typeof row[0] !== 'string' || seen.has(row[0])) V.fail('VNEXT_BUNDLE_DESCRIPTOR_INVALID');
        seen.add(row[0]); return [row[0], decode(row[1], depth + 1)];
      }));
    }
    if (node?.kind === 'array') {
      V.assertExactKeys(node, ['kind', 'items'], [], 'VNEXT_BUNDLE_DESCRIPTOR_INVALID');
      if (!Array.isArray(node.items)) V.fail('VNEXT_BUNDLE_DESCRIPTOR_INVALID');
      return node.items.map(item => decode(item, depth + 1));
    }
    if (node?.kind === 'concat' || node?.kind === 'string') {
      V.assertExactKeys(node, ['kind', 'parts'], [], 'VNEXT_BUNDLE_DESCRIPTOR_INVALID');
      if (!Array.isArray(node.parts) || !node.parts.length) V.fail('VNEXT_BUNDLE_DESCRIPTOR_INVALID');
      const parts = node.parts.map(item => decode(item, depth + 1));
      if (node.kind === 'string') {
        if (!parts.every(item => typeof item === 'string')) V.fail('VNEXT_BUNDLE_DESCRIPTOR_INVALID');
        return parts.join('');
      }
      if (!parts.every(Array.isArray)) V.fail('VNEXT_BUNDLE_DESCRIPTOR_INVALID');
      return parts.flat();
    }
    V.fail('VNEXT_BUNDLE_DESCRIPTOR_INVALID');
  };
  const result = decode(parsed.root);
  if (V.canonicalHash(result) !== parsed.logical_sha256) V.fail('VNEXT_BUNDLE_LOGICAL_HASH_INVALID');
  return result;
}

module.exports = { SCHEMA, LIMIT, boundedJson, describe, write, read };
