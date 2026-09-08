#!/usr/bin/env node
'use strict';

/**
 * Pilot test runner.
 *
 * Uses the Node built-in test runner: this worktree has no node_modules, and
 * the pilot must not alter package.json or jest.config.js (applicative files).
 * The `*.pilot.js` suffix keeps these files outside jest's default testMatch,
 * so `npm test` of the application is unaffected.
 *
 * Usage: node tests/kodjo/run-all.js
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const dir = __dirname;
const files = fs
  .readdirSync(dir)
  .filter((n) => n.endsWith('.pilot.js'))
  .sort()
  .map((n) => path.join(dir, n));

if (files.length === 0) {
  process.stderr.write('no *.pilot.js test file found in ' + dir + '\n');
  process.exit(1);
}

process.stdout.write('running ' + files.length + ' pilot suite(s) with node ' + process.version + '\n');
const res = spawnSync(process.execPath, ['--test', ...files], {
  cwd: path.resolve(dir, '..', '..'),
  stdio: 'inherit',
  windowsHide: true,
});
process.exit(res.status === null ? 1 : res.status);
