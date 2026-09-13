#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

if (process.env.KODJO_BENCH_SCENARIO === 'control-drift') {
  const target = path.join(process.cwd(), 'secrets', 'r4-control-drift.txt');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, 'mutation produite pendant le contrôle Jest\n', 'utf8');
}
process.stdout.write('Tests: 1 passed, 1 total\n');
