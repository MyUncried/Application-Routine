#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const History = require('./lib/vnext-historical-coverage');
const Equivalence = require('./lib/vnext-historical-equivalence');

const cwd = process.cwd();
const inventory = JSON.parse(fs.readFileSync(path.join(cwd, '.github/orchestration/KODJO_VNEXT_HISTORICAL_DISPOSITION.json'), 'utf8'));
const correspondence = JSON.parse(fs.readFileSync(path.join(cwd, '.github/orchestration/KODJO_VNEXT_HISTORICAL_EQUIVALENCE.json'), 'utf8'));
const candidateHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8', windowsHide: true }).trim();
Equivalence.validateCorrespondence(correspondence, inventory, History.readSourcesAtRevision(inventory, { cwd }), { cwd });
const records = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').map(line => JSON.parse(line));
const result = Equivalence.resolveExecution(correspondence, records, { candidateHead, platform: process.platform });
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(result, null, 2) + '\n');
// Each line is a separately retrievable proof, never a historical PASS recycled.
console.log('KODJO_EQ_IDENTITY ' + JSON.stringify({ candidate_head: candidateHead, platform: result.platform, counts: result.counts, readiness: result.readiness }));
for (const row of result.cases) console.log('KODJO_EQ_CASE ' + JSON.stringify(row));
for (const row of result.subjects) console.log('KODJO_EQ_SUBJECT ' + JSON.stringify(row));
const missing = result.cases.filter(row => !['PASS', 'SKIP'].includes(row.status));
if (missing.length) throw new Error('Unresolved mapped assertions: ' + missing.map(row => row.case_id).join(','));
