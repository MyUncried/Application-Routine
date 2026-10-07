#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { verifyPlatformCoverage } = require('./lib/vnext-historical-equivalence');
const correspondence = JSON.parse(fs.readFileSync('.github/orchestration/KODJO_VNEXT_HISTORICAL_EQUIVALENCE.json', 'utf8'));
const results = process.argv.slice(2).map(file => JSON.parse(fs.readFileSync(file, 'utf8')));
console.log(JSON.stringify(verifyPlatformCoverage(correspondence, results, execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim())));
