'use strict';
const fs = require('node:fs');
const file = 'tests/kodjo/queue-contract.pilot.js';
const source = fs.readFileSync(file, 'utf8');
const before = "fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'lib', 'visual-checkpoint.js'), 'utf8'),";
const after = "fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'verify-visual-checkpoint.js'), 'utf8'),";
const first = source.indexOf(before);
if (first < 0) throw new Error('ORACLE_PATH_SOURCE_NOT_FOUND');
if (source.indexOf(before, first + before.length) >= 0) throw new Error('ORACLE_PATH_SOURCE_NOT_UNIQUE');
fs.writeFileSync(file, source.slice(0, first) + after + source.slice(first + before.length), 'utf8');
for (const p of ['scripts/kodjo/pr145-final-oracle-fix.js','.github/workflows/kodjo-pr145-final-oracle-fix.yml','.github/orchestration/pr145-final-oracle-trigger.txt']) {
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
