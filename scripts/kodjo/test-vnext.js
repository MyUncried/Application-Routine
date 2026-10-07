#!/usr/bin/env node
'use strict';
// Same complete VNext scope; concurrency is explicit and optional, never a filter.
const fs = require('node:fs'), path = require('node:path'), { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const args = process.argv.slice(2), nodeArgs = ['--test'];
if (args.length > 1 || args.some(arg => !/^--concurrency=(?:[1-9]|[12][0-9]|3[0-2])$/.test(arg))) {
  process.stderr.write('Usage: node scripts/kodjo/test-vnext.js [--concurrency=1..32]\n'); process.exit(2);
}
if (args.length) nodeArgs.push('--test-concurrency=' + args[0].split('=')[1]);
const directory = path.join(root, 'tests/kodjo');
const files = fs.readdirSync(directory).filter(file => /^vnext-.*\.pilot\.js$/.test(file) || file === 'ui-implementation-review.pilot.js').sort();
if (!files.length) throw Error('VNEXT_TEST_SCOPE_EMPTY');
const result = spawnSync(process.execPath, [...nodeArgs, ...files.map(file => path.join(directory, file))], { cwd: root, stdio: 'inherit', windowsHide: true });
process.exit(result.status === null ? 1 : result.status);
