'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RUNNER = path.resolve(__dirname, '..', '..', 'scripts', 'kodjo', 'kodjo-file-mutation.js');

function workspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-mutation-'));
  fs.mkdirSync(path.join(root, 'tests', 'kodjo-prod-qualif'), { recursive: true });
  return root;
}

function run(root, args, scopes = ['tests/kodjo-prod-qualif/**']) {
  return spawnSync(process.execPath, [RUNNER, ...args], {
    cwd: root,
    env: { ...process.env, KODJO_MUTATION_SCOPE_JSON: JSON.stringify(scopes) },
    encoding: 'utf8',
    windowsHide: true,
  });
}

test('mutation bornée: écriture binaire, renommage et suppression', () => {
  const root = workspace();
  const base = 'tests/kodjo-prod-qualif/';
  const bytes = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0x0d, 0x0a, 0x00, 0x7f, 0x80]);

  let result = run(root, ['write-base64', base + 'octets.bin', bytes.toString('base64')]);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(fs.readFileSync(path.join(root, base, 'octets.bin')), bytes);

  result = run(root, ['rename', base + 'octets.bin', base + 'renommé.bin']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(root, base, 'octets.bin')), false);
  assert.deepEqual(fs.readFileSync(path.join(root, base, 'renommé.bin')), bytes);

  result = run(root, ['delete', base + 'renommé.bin']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(root, base, 'renommé.bin')), false);
});

test('mutation bornée: hors périmètre, traversée et base64 ambiguë refusés', () => {
  const root = workspace();
  for (const args of [
    ['write-base64', 'outside.bin', 'AA=='],
    ['write-base64', 'tests/kodjo-prod-qualif/../outside.bin', 'AA=='],
    ['write-base64', '/tmp/outside.bin', 'AA=='],
    ['write-base64', 'tests/kodjo-prod-qualif/bad.bin', 'AA'],
  ]) {
    const result = run(root, args);
    assert.equal(result.status, 78, result.stderr);
  }
});

test('mutation bornée: destination existante et fichiers non réguliers refusés', () => {
  const root = workspace();
  const base = path.join(root, 'tests', 'kodjo-prod-qualif');
  fs.writeFileSync(path.join(base, 'source.txt'), 'source');
  fs.writeFileSync(path.join(base, 'destination.txt'), 'destination');

  let result = run(root, ['rename',
    'tests/kodjo-prod-qualif/source.txt',
    'tests/kodjo-prod-qualif/destination.txt',
  ]);
  assert.equal(result.status, 78, result.stderr);
  assert.equal(fs.readFileSync(path.join(base, 'source.txt'), 'utf8'), 'source');

  result = run(root, ['delete', 'tests/kodjo-prod-qualif']);
  assert.equal(result.status, 78, result.stderr);
});

test('mutation bornée: lien symbolique intermédiaire refusé', {
  skip: process.platform === 'win32' ? 'création de symlink non garantie sans privilège Windows' : false,
}, () => {
  const root = workspace();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-mutation-outside-'));
  fs.symlinkSync(outside, path.join(root, 'tests', 'kodjo-prod-qualif', 'link'));
  const result = run(root, ['write-base64', 'tests/kodjo-prod-qualif/link/out.bin', 'AA==']);
  assert.equal(result.status, 78, result.stderr);
  assert.equal(fs.existsSync(path.join(outside, 'out.bin')), false);
});
