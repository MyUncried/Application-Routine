'use strict';
// Fresh immutable Git reads. No cross-operation cache or working-tree fallback.
const crypto = require('node:crypto');
const V = require('./vnext-contract');
const Perf = require('./vnext-performance');
function readBlobs({ revision, files, run }) {
  V.assertSha40(revision, 'VNEXT_GIT_BATCH_REVISION_INVALID');
  const entries = new Map();
  const tree = run(['ls-tree', '-r', '-l', '-z', revision]);
  for (const row of tree.toString('utf8').split('\0').filter(Boolean)) {
    const match = /^(\d{6}) (blob|commit) ([0-9a-f]{40}) +([0-9]+|-)\t([\s\S]+)$/.exec(row);
    if (!match) V.fail('VNEXT_GIT_BATCH_TREE_INVALID');
    entries.set(match[5], { type: match[2], oid: match[3], size: Number(match[4]) });
  }
  const blobs = new Map(), objects = new Map();
  for (const file of files) {
    const entry = entries.get(file);
    if (!entry) V.fail('VNEXT_GIT_BATCH_PATH_ABSENT', file);
    // Preserve prior git-show behavior for unusual non-blob tree entries.
    if (entry.type !== 'blob') blobs.set(file, run(['show', revision + ':' + file]));
    else {
      if (!Number.isSafeInteger(entry.size) || entry.size < 0) V.fail('VNEXT_GIT_BATCH_SIZE_INVALID');
      objects.set(entry.oid, entry);
    }
  }
  const values = new Map(), queue = [...objects.values()];
  while (queue.length) {
    const chunk = []; let bytes = 0;
    while (queue.length && chunk.length < 128 && (!chunk.length || bytes + queue[0].size < 32 * 1024 * 1024)) {
      const row = queue.shift(); chunk.push(row); bytes += row.size;
    }
    const output = Perf.measure('git.batch.blobs', () => run(['cat-file', '--batch'], chunk.map(r => r.oid).join('\n') + '\n'), { objects: chunk.length });
    let offset = 0;
    for (const expected of chunk) {
      const end = output.indexOf(10, offset);
      if (end < 0) V.fail('VNEXT_GIT_BATCH_HEADER_INVALID');
      const header = output.subarray(offset, end).toString('ascii');
      if (header !== expected.oid + ' blob ' + expected.size) V.fail('VNEXT_GIT_BATCH_OBJECT_MISMATCH');
      offset = end + 1;
      const content = output.subarray(offset, offset + expected.size);
      if (content.length !== expected.size || output[offset + expected.size] !== 10) V.fail('VNEXT_GIT_BATCH_CONTENT_INVALID');
      const hash = crypto.createHash('sha1').update('blob ' + content.length + '\0').update(content).digest('hex');
      if (hash !== expected.oid) V.fail('VNEXT_GIT_BATCH_HASH_MISMATCH');
      values.set(expected.oid, content); offset += expected.size + 1;
    }
    if (offset !== output.length) V.fail('VNEXT_GIT_BATCH_TRAILING_DATA');
  }
  for (const file of files) if (!blobs.has(file)) blobs.set(file, values.get(entries.get(file).oid));
  return blobs;
}
module.exports = { readBlobs };
