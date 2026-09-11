#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const repo = path.resolve(__dirname, '..', '..', '..');
const output = path.resolve(process.argv[2] || path.join(process.cwd(), 'disposable-slice-bench.json'));
const scenarios = [
  { id: 'S1', label: 'delta nominal et préservation', file: 'tests/kodjo/t02-preservation.pilot.js', pattern: 'T02-PRES-001|T02-PRES-009' },
  { id: 'S2', label: 'perte locale et reprise', file: 'tests/kodjo/t02-preservation.pilot.js', pattern: 'T02-PRES-006|T02-PRES-010' },
  { id: 'S3', label: 'migration de HEAD', file: 'tests/kodjo/claude-local.pilot.js', pattern: 'paquet non vide migre|migration de paquet non vide refuse' },
  { id: 'S4', label: 'classification des contrôles', file: 'tests/kodjo/unit.pilot.js', pattern: 'NOT_RUN|controle non execute|contrôle non exécuté' },
  { id: 'S5', label: 'verrou et diagnostic courant', file: 'tests/kodjo/protocol-0.6.17.pilot.js', pattern: 'verrou:|diagnostic:' },
  { id: 'S6', label: 'publication et anti-rejeu', file: 'tests/kodjo/publication-security.pilot.js', pattern: 'publication|recu|reçu' },
  { id: 'S7', label: 'absence de plafond de tours', file: 'tests/kodjo/claude-local.pilot.js', pattern: 'plafond de tours|gouvernance effective des tours' },
];

const report = {
  schema_version: 'kodjo.protocol.v2.disposable-local-bench.0.6.21',
  node: process.version,
  platform: process.platform,
  repo,
  scenarios: [],
  verdict: 'PASS',
};

for (const scenario of scenarios) {
  const result = spawnSync(process.execPath, ['--test', '--test-name-pattern', scenario.pattern, scenario.file], {
    cwd: repo,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
  });
  const stdout = String(result.stdout || '');
  const stderr = String(result.stderr || '');
  const status = result.status === 0 && !result.error ? 'PASS' : 'FAIL';
  report.scenarios.push({
    id: scenario.id,
    label: scenario.label,
    status,
    exit_code: result.status,
    error: result.error ? result.error.message : null,
    output_sha256: crypto.createHash('sha256').update(stdout + stderr).digest('hex'),
    stdout,
    stderr,
  });
  if (status !== 'PASS') report.verdict = 'FAIL';
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', 'utf8');
process.stdout.write(`DISPOSABLE_LOCAL_BENCH=${report.verdict} (${report.scenarios.filter((s) => s.status === 'PASS').length}/7)\n`);
process.exitCode = report.verdict === 'PASS' ? 0 : 1;
