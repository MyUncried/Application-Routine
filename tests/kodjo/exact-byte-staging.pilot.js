#!/usr/bin/env node
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const L = require('../../scripts/kodjo/run-local-claude');

function git(root, args) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  assert.equal(result.status, 0, 'git ' + args.join(' ') + ': ' + result.stderr);
  return String(result.stdout).trim();
}

function blobSha(bytes) {
  const header = Buffer.from('blob ' + bytes.length + '\0');
  return crypto.createHash('sha1').update(Buffer.concat([header, bytes])).digest('hex');
}

test('capture et publication conservent exactement CRLF sous core.autocrlf=true', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-exact-bytes-'));
  git(root, ['init', '-q', '.']);
  git(root, ['config', 'user.email', 'exact-bytes@test.local']);
  git(root, ['config', 'user.name', 'exact-bytes']);
  git(root, ['config', 'core.autocrlf', 'true']);
  fs.writeFileSync(path.join(root, 'README.md'), 'base\n');
  git(root, ['add', 'README.md']);
  git(root, ['commit', '-qm', 'base']);

  const relative = 'tests/d2-crlf.fixture.txt';
  const absolute = path.join(root, relative);
  const expected = Buffer.from('S09ESk8tVjItUFJPRC1EMg0KQ1JMRg0K', 'base64');
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, expected);

  const sourceHead = git(root, ['rev-parse', 'HEAD']);
  const built = L.buildRecoveryPatch(root, {
    source_head: sourceHead,
    scope_allow: [relative],
  }, [relative]);
  const patchFile = path.join(root, 'implementation.patch');
  fs.writeFileSync(patchFile, built.patch, 'utf8');

  fs.unlinkSync(absolute);
  git(root, ['apply', '--binary', patchFile]);
  assert.deepEqual(fs.readFileSync(absolute), expected, 'le patch doit restaurer les CRLF exacts');

  git(root, ['-c', 'core.autocrlf=false', 'add', '--', relative]);
  git(root, ['commit', '-qm', 'publish']);
  assert.equal(git(root, ['rev-parse', 'HEAD:' + relative]), blobSha(expected),
    'le blob publie doit contenir exactement les octets produits');
});

test('le chemin PowerShell de publication neutralise aussi autocrlf', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'scripts', 'kodjo', 'run-queued-request.ps1'),
    'utf8'
  );
  assert.match(source,
    /git -c core\.autocrlf=false add --all --pathspec-from-file=\$publishPathspec --pathspec-file-nul/);
});
