#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { writeJson } = require('./lib/json');

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd, encoding: 'utf8', windowsHide: true, shell: false,
    maxBuffer: 32 * 1024 * 1024,
  });
  return {
    status: result.status,
    output: String(result.stdout || '') + String(result.stderr || ''),
    error: result.error ? result.error.message : null,
  };
}

function filesBelow(root) {
  if (!fs.existsSync(root)) return [];
  const result = [];
  const pending = [root];
  while (pending.length) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(target);
      else if (entry.isFile()) result.push(target);
    }
  }
  return result;
}

function normalizedLines(value) {
  return value.split(/\r?\n/).map((line) => line.trim().replace(/\\/g, '/')).filter(Boolean);
}

function main(argv) {
  const repoRoot = path.resolve(argv[0] || process.cwd());
  const output = path.resolve(argv[1] || path.join(repoRoot, 'prod-qualification-scope.json'));
  const relative = 'tests/kodjo-prod-qualif/preflight.test.ts';
  const target = path.join(repoRoot, ...relative.split('/'));
  if (!fs.existsSync(target)) throw new Error('PROD_QUALIFICATION_CANARY_MISSING');

  const jest = run(process.execPath,
    [path.join(repoRoot, 'node_modules', 'jest', 'bin', 'jest.js'), '--listTests', '--runInBand'], repoRoot);
  const tsc = run(process.execPath,
    [path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit', '--listFiles', '--pretty', 'false'], repoRoot);
  const eslint = run(process.execPath,
    [path.join(repoRoot, 'node_modules', 'eslint', 'bin', 'eslint.js'), relative, '--no-cache'], repoRoot);

  const normalizedTarget = target.replace(/\\/g, '/');
  const jestCollected = jest.status === 0 && normalizedLines(jest.output).includes(normalizedTarget);
  const typescriptCollected = tsc.status === 0 && normalizedLines(tsc.output).includes(normalizedTarget);
  const eslintCollected = eslint.status === 0;
  const applicationReferences = ['src', 'app'].flatMap((directory) =>
    filesBelow(path.join(repoRoot, directory)).filter((file) => {
      try { return fs.readFileSync(file, 'utf8').includes('kodjo-prod-qualif'); }
      catch (_) { return false; }
    }).map((file) => path.relative(repoRoot, file).replace(/\\/g, '/')));
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const outsideApplicationEntry = !String(packageJson.main || '').includes('kodjo-prod-qualif');

  const evidence = {
    schema_version: 'kodjo.protocol.v2.prod-qualification-scope.0.6.22',
    target: relative,
    jest: { status: jest.status, collected: jestCollected, error: jest.error },
    typescript: { status: tsc.status, collected: typescriptCollected, error: tsc.error },
    lint: { status: eslint.status, collected: eslintCollected, error: eslint.error },
    application: {
      entry: packageJson.main || null,
      outside_application_entry: outsideApplicationEntry,
      references_from_src_or_app: applicationReferences,
    },
    status: jestCollected && typescriptCollected && eslintCollected &&
      outsideApplicationEntry && applicationReferences.length === 0 ? 'PASS' : 'FAIL',
  };
  writeJson(output, evidence);
  if (evidence.status !== 'PASS') throw new Error('PROD_QUALIFICATION_SCOPE_PREFLIGHT_FAILED');
  process.stdout.write('[KODJO_V2] PROD_QUALIFICATION_SCOPE_PREFLIGHT_PASS\n');
  return evidence;
}

if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) {
    process.stderr.write('[KODJO_V2] ' + error.message + '\n');
    process.exitCode = 1;
  }
}

module.exports = { filesBelow, main, normalizedLines, run };
