#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { verifyEmbedded } = require('./lib/requirement-contract');

function repoPath(value, cwd) {
  const absolute = path.resolve(value);
  const relative = path.relative(cwd, absolute).replace(/\\/g, '/');
  if (!relative || relative.startsWith('../') || path.isAbsolute(relative)) {
    throw new Error('TEST_RESULT_PATH_OUTSIDE_REPOSITORY:' + value);
  }
  return relative;
}

function gitHead(cwd) {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8', shell: false, windowsHide: true });
  if (r.error || r.status !== 0) throw new Error('TEST_CONTRACT_HEAD_UNREADABLE');
  return String(r.stdout).trim();
}

function verify(planText, jestJson, cwd = process.cwd()) {
  const contracts = verifyEmbedded(planText);
  const bindings = contracts.test_contract.bindings || [];
  const results = Array.isArray(jestJson && jestJson.testResults) ? jestJson.testResults : [];
  const byPath = new Map();

  for (const row of results) {
    const p = repoPath(row.name, cwd);
    if (byPath.has(p)) throw new Error('TEST_RESULT_DUPLICATE:' + p);
    let status = 'NON_VERIFIABLE';
    if (String(row.status) === 'failed' || Number(row.numFailingTests || 0) > 0) status = 'FAIL';
    else if (String(row.status) === 'passed' && Number(row.numFailingTests || 0) === 0 && Number(row.numPassingTests || 0) > 0) status = 'PASS';
    byPath.set(p, {
      status,
      num_passing_tests: Number(row.numPassingTests || 0),
      num_failing_tests: Number(row.numFailingTests || 0),
      num_pending_tests: Number(row.numPendingTests || 0),
    });
  }

  const evidence = bindings.map((binding) => {
    const result = byPath.get(binding.test_path);
    return {
      requirement_id: binding.requirement_id,
      test_path: binding.test_path,
      proof_type: binding.proof_type,
      status: result ? result.status : 'NON_VERIFIABLE',
      ...(result || { num_passing_tests: 0, num_failing_tests: 0, num_pending_tests: 0 }),
    };
  });

  return {
    schema: 'kodjo.test-contract-evidence.v1',
    head: gitHead(cwd),
    binding_count: evidence.length,
    bindings: evidence,
    status: evidence.every((x) => x.status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

if (require.main === module) {
  try {
    const [planFile, jestFile, outputFile, cwdArg] = process.argv.slice(2);
    if (!planFile || !jestFile || !outputFile) throw new Error('USAGE: verify-test-contract-results.js <plan.md> <jest.json> <output.json> [cwd]');
    const cwd = path.resolve(cwdArg || process.cwd());
    const plan = fs.readFileSync(path.resolve(planFile), 'utf8');
    const jest = JSON.parse(fs.readFileSync(path.resolve(jestFile), 'utf8'));
    const result = verify(plan, jest, cwd);
    fs.writeFileSync(path.resolve(outputFile), JSON.stringify(result, null, 2) + '\n', 'utf8');
    process.stdout.write('[KODJO_V2] test contract evidence — bindings=' + result.binding_count + ' status=' + result.status + '\n');
    if (result.status !== 'PASS') process.exit(1);
  } catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exit(1);
  }
}

module.exports = { verify, repoPath };
