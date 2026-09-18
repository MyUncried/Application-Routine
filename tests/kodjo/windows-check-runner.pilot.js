'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
const source = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'run-local-claude.js'), 'utf8');

test('generated Claude check runner uses cmd.exe for npm.cmd/npx.cmd on Windows', () => {
  assert.match(source, /process\.platform === 'win32'[\s\S]*process\.env\.ComSpec \|\| 'cmd\.exe'/);
  assert.match(source, /args: \['\/d', '\/s', '\/c', commands\[id\]\[0\], \.\.\.commands\[id\]\[1\]\]/);
  assert.doesNotMatch(
    source,
    /spawnSync\(commands\[id\]\[0\], commands\[id\]\[1\], \{ cwd: process\.cwd\(\), env, shell: false/
  );
});

test('generated Claude check runner keeps shell disabled and static command selection', () => {
  assert.match(source, /if \(!Object\.prototype\.hasOwnProperty\.call\(commands, id\)\) process\.exit\(78\)/);
  assert.match(source, /spawnSync\(child\.bin, child\.args, \{ cwd: process\.cwd\(\), env, shell: false/);
});
