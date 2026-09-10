'use strict';

/**
 * Minimal tar (ustar/pax) reader.
 *
 * `git archive` is the only read-only way to materialise a clean space at
 * source_head without creating a worktree, a ref or an index in the source
 * repository. Extracting its output with the external `tar` binary is not
 * portable (GNU tar reads an absolute Windows path such as `C:/x` as a remote
 * host), so the pilot extracts the archive itself. Only the entry types git
 * archive emits are supported.
 */

const fs = require('node:fs');
const path = require('node:path');

const BLOCK = 512;

function str(buf, offset, length) {
  const slice = buf.subarray(offset, offset + length);
  const end = slice.indexOf(0);
  return slice.subarray(0, end === -1 ? slice.length : end).toString('utf8');
}

function octal(buf, offset, length) {
  const text = str(buf, offset, length).trim().replace(/[^0-7]/g, '');
  return text === '' ? 0 : parseInt(text, 8);
}

function isZeroBlock(buf) {
  for (const byte of buf) {
    if (byte !== 0) return false;
  }
  return true;
}

/** Reject absolute paths and traversal — an archive must not escape destDir. */
function safeJoin(destDir, entryName) {
  const normalized = entryName.replace(/\\/g, '/').replace(/^\/+/, '');
  const target = path.resolve(destDir, normalized);
  const root = path.resolve(destDir);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error('TAR_PATH_ESCAPE: ' + entryName);
  }
  return target;
}

function parsePax(data) {
  const fields = {};
  let offset = 0;
  const text = data.toString('utf8');
  while (offset < text.length) {
    const space = text.indexOf(' ', offset);
    if (space < 0) break;
    const length = Number(text.slice(offset, space));
    if (!Number.isFinite(length) || length <= 0) break;
    const record = text.slice(space + 1, offset + length).replace(/\n$/, '');
    const eq = record.indexOf('=');
    if (eq > 0) fields[record.slice(0, eq)] = record.slice(eq + 1);
    offset += length;
  }
  return fields;
}

/**
 * Extract a tar archive into destDir.
 * @returns {string[]} extracted file paths, relative and slash-separated
 */
function extract(tarPath, destDir) {
  const buf = fs.readFileSync(tarPath);
  fs.mkdirSync(destDir, { recursive: true });

  const extracted = [];
  let offset = 0;
  let pending = null;

  while (offset + BLOCK <= buf.length) {
    const header = buf.subarray(offset, offset + BLOCK);
    offset += BLOCK;
    if (isZeroBlock(header)) break;

    const prefix = str(header, 345, 155);
    let name = str(header, 0, 100);
    if (prefix) name = prefix + '/' + name;
    const size = octal(header, 124, 12);
    const mode = octal(header, 100, 8);
    const type = String.fromCharCode(header[156]) === '\u0000' ? '0' : String.fromCharCode(header[156]);
    const dataLength = Math.ceil(size / BLOCK) * BLOCK;
    const data = buf.subarray(offset, offset + size);
    offset += dataLength;

    if (type === 'x' || type === 'g') {
      const fields = parsePax(data);
      pending = fields.path ? { path: fields.path } : null;
      continue;
    }
    if (type === 'L') {
      pending = { path: data.toString('utf8').replace(/\0+$/, '') };
      continue;
    }
    if (pending && pending.path) {
      name = pending.path;
      pending = null;
    }
    if (name === '') continue;

    if (type === '5' || name.endsWith('/')) {
      fs.mkdirSync(safeJoin(destDir, name), { recursive: true });
      continue;
    }
    if (type !== '0') continue;

    const target = safeJoin(destDir, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
    if (process.platform !== 'win32' && mode) {
      try {
        fs.chmodSync(target, mode & 0o777);
      } catch {
        /* mode is not essential to content fidelity */
      }
    }
    extracted.push(name);
  }
  return extracted;
}

module.exports = { extract, safeJoin };
