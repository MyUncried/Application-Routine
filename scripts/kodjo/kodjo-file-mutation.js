#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { normalizeScopeCandidate, inScope } = require('./scope-path');

const MAX_WRITE_BYTES = 1024 * 1024;

function refuse(code, detail) {
  process.stderr.write('[KODJO_V2] ' + code + (detail ? ': ' + detail : '') + '\n');
  process.exit(78);
}

function scopesFromEnvironment() {
  let scopes;
  try {
    scopes = JSON.parse(String(process.env.KODJO_MUTATION_SCOPE_JSON || ''));
  } catch (_) {
    refuse('MUTATION_SCOPE_INVALID');
  }
  if (!Array.isArray(scopes) || scopes.length === 0 || scopes.some((value) => typeof value !== 'string')) {
    refuse('MUTATION_SCOPE_INVALID');
  }
  return scopes;
}

function checkedPath(repoRoot, candidate, scopes, allowMissingLeaf) {
  const normalized = normalizeScopeCandidate(candidate);
  if (!normalized || !inScope(normalized, scopes)) refuse('MUTATION_SCOPE_REFUSED', String(candidate || ''));
  const absolute = path.resolve(repoRoot, normalized);
  if (!absolute.startsWith(repoRoot + path.sep)) refuse('MUTATION_PATH_REFUSED', normalized);

  const relativeParts = normalized.split('/');
  let current = repoRoot;
  for (let index = 0; index < relativeParts.length; index += 1) {
    current = path.join(current, relativeParts[index]);
    if (!fs.existsSync(current)) {
      if (allowMissingLeaf) break;
      refuse('MUTATION_SOURCE_MISSING', normalized);
    }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) refuse('MUTATION_SYMLINK_REFUSED', normalized);
    if (index < relativeParts.length - 1 && !stat.isDirectory()) {
      refuse('MUTATION_PARENT_NOT_DIRECTORY', normalized);
    }
  }
  return { normalized, absolute };
}

function ensureParent(target, repoRoot) {
  const parent = path.dirname(target.absolute);
  if (!parent.startsWith(repoRoot + path.sep)) refuse('MUTATION_PARENT_REFUSED', target.normalized);
  fs.mkdirSync(parent, { recursive: true });
  let current = repoRoot;
  for (const part of path.relative(repoRoot, parent).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink()) refuse('MUTATION_SYMLINK_REFUSED', target.normalized);
  }
}

function decodeBase64(value) {
  const input = String(value || '');
  if (!input || input.length > Math.ceil(MAX_WRITE_BYTES / 3) * 4 + 4 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input)) {
    refuse('MUTATION_BASE64_INVALID');
  }
  const bytes = Buffer.from(input, 'base64');
  if (bytes.length > MAX_WRITE_BYTES || bytes.toString('base64') !== input) refuse('MUTATION_BASE64_INVALID');
  return bytes;
}

function main() {
  const operation = process.argv[2];
  const args = process.argv.slice(3);
  const scopes = scopesFromEnvironment();
  const repoRoot = fs.realpathSync(process.cwd());

  if (operation === 'delete' && args.length === 1) {
    const target = checkedPath(repoRoot, args[0], scopes, false);
    if (!fs.lstatSync(target.absolute).isFile()) refuse('MUTATION_NOT_A_REGULAR_FILE', target.normalized);
    fs.unlinkSync(target.absolute);
    return;
  }

  if (operation === 'rename' && args.length === 2) {
    const source = checkedPath(repoRoot, args[0], scopes, false);
    const destination = checkedPath(repoRoot, args[1], scopes, true);
    if (!fs.lstatSync(source.absolute).isFile()) refuse('MUTATION_NOT_A_REGULAR_FILE', source.normalized);
    if (fs.existsSync(destination.absolute)) refuse('MUTATION_DESTINATION_EXISTS', destination.normalized);
    ensureParent(destination, repoRoot);
    fs.renameSync(source.absolute, destination.absolute);
    return;
  }

  if (operation === 'write-base64' && args.length === 2) {
    const target = checkedPath(repoRoot, args[0], scopes, true);
    if (fs.existsSync(target.absolute) && !fs.lstatSync(target.absolute).isFile()) {
      refuse('MUTATION_NOT_A_REGULAR_FILE', target.normalized);
    }
    ensureParent(target, repoRoot);
    fs.writeFileSync(target.absolute, decodeBase64(args[1]), { flag: 'w' });
    return;
  }

  refuse('MUTATION_USAGE', 'delete <path> | rename <source> <destination> | write-base64 <path> <base64>');
}

try {
  main();
} catch (error) {
  refuse('MUTATION_FAILURE', error && error.message ? error.message : String(error));
}
