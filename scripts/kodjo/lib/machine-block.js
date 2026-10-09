'use strict';
function parse(body, tag, {required = true, code = 'MACHINE_BLOCK_INVALID', cwd = process.cwd()} = {}) {
  if (!/^[A-Z0-9_]+$/.test(tag)) throw Error(code);
  const text = String(body || '').replace(/\r\n?/g, '\n');
  const opens = text.split('<' + tag + '>').length - 1;
  const closes = text.split('</' + tag + '>').length - 1;
  const hits = [...text.matchAll(new RegExp('<'+tag+'>\\s*([\\s\\S]*?)\\s*</'+tag+'>','g'))];
  if (!opens && !closes && !required) return null;
  if (!hits.length || hits.length !== opens || opens !== closes) throw Error(code);
  const V = require('./vnext-contract'), canonical = V.canonicalHash;
  let values; try {values = hits.map(hit => JSON.parse(hit[1]));} catch {throw Error(code);}
  if (values.some(value => value === null || typeof value !== 'object')) throw Error(code);
  if (values.some(value => canonical(value) !== canonical(values[0]))) throw Error(code + ':CONFLICTING_BLOCKS');
  const reference = values[0];
  if (reference.schema_version !== 'kodjo.vnext.block-bundle.v1') return reference;
  V.assertExactKeys(reference, ['schema_version', 'block_tag', 'file', 'manifest_sha256', 'logical_sha256'], [], code);
  if (reference.block_tag !== tag || !/^\.github\/orchestration\/vnext-contracts\/[0-9a-f]{64}\/[A-Z0-9_]+\.json$/.test(reference.file)) throw Error(code + ':BUNDLE_PATH_INVALID');
  V.assertSha64(reference.manifest_sha256, code);
  V.assertSha64(reference.logical_sha256, code);
  const fs = require('node:fs'), path = require('node:path');
  const base = fs.realpathSync(cwd), file = path.resolve(base, reference.file);
  if (!fs.realpathSync(file).startsWith(base + path.sep)) throw Error(code + ':BUNDLE_PATH_INVALID');
  if (V.sha256(fs.readFileSync(file, 'utf8')) !== reference.manifest_sha256) throw Error(code + ':BUNDLE_MANIFEST_MISMATCH');
  const value = require('./vnext-file-bundle').read(file);
  if (V.canonicalHash(value) !== reference.logical_sha256) throw Error(code + ':BUNDLE_LOGICAL_MISMATCH');
  return value;
}
module.exports = {parse};
