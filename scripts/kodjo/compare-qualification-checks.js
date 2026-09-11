#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REQUIRED = ['jest', 'typescript', 'lint'];

function jestFailureSuites(check) {
  const suites = new Set();
  for (const line of String(check && check.log_excerpt || '').split(/\r?\n/)) {
    const match = /^FAIL\s+(.+?)(?:\s+\(|$)/.exec(line.trim());
    if (match) suites.add(match[1].replace(/\\/g, '/'));
  }
  return [...suites].sort();
}

function compareQualificationChecks(baseline, postChecks) {
  const post = new Map((postChecks || []).map((check) => [check.check, check]));
  const comparisons = [];
  let regression = false;
  let executable = true;

  for (const name of REQUIRED) {
    const before = baseline && baseline[name];
    const after = post.get(name);
    let outcome = 'NON_VÉRIFIABLE';
    let reason = null;

    if (!before || !after || before.status === 'NOT_RUN' || after.status === 'NOT_RUN') {
      executable = false;
      regression = true;
      reason = 'CHECK_NOT_EXECUTED';
    } else if (after.status === 'PASS') {
      outcome = before.status === 'PASS' ? 'PASS' : 'IMPROVED';
    } else if (before.status === 'PASS') {
      outcome = 'FAIL';
      reason = 'NEW_FAILURE';
      regression = true;
    } else if (name === 'jest') {
      const beforeSuites = jestFailureSuites(before);
      const afterSuites = jestFailureSuites(after);
      const countsKnown = Number.isInteger(before.failed_tests) && Number.isInteger(after.failed_tests);
      if (countsKnown && after.failed_tests <= before.failed_tests &&
          JSON.stringify(beforeSuites) === JSON.stringify(afterSuites)) {
        outcome = 'UNCHANGED_BASELINE_FAILURE';
      } else {
        outcome = 'NON_VÉRIFIABLE';
        reason = 'JEST_FAILURE_SET_CHANGED_OR_UNKNOWN';
        regression = true;
      }
    } else {
      outcome = 'NON_VÉRIFIABLE';
      reason = 'NON_JEST_FAILURE_REMAINS';
      regression = true;
    }

    comparisons.push({
      check: name,
      baseline_status: before ? before.status : null,
      post_status: after ? after.status : null,
      outcome,
      reason,
    });
  }

  return {
    schema_version: 'kodjo.protocol.v2.qualification-check-comparison.0.6.21',
    absolute_status: comparisons.every((item) => item.post_status === 'PASS') ? 'PASS' : 'FAIL',
    executable_status: executable ? 'PASS' : 'FAIL',
    regression_status: regression ? 'FAIL' : 'PASS',
    verdict: executable && !regression ? 'PASS' : 'FAIL',
    comparisons,
  };
}

function main() {
  const baselinePath = process.argv[2];
  const resultPath = process.argv[3];
  const outputPath = process.argv[4];
  if (!baselinePath || !resultPath || !outputPath) throw new Error('USAGE: compare-qualification-checks <baseline.json> <result.json> <output.json>');
  const baseline = JSON.parse(fs.readFileSync(path.resolve(baselinePath), 'utf8').replace(/^\uFEFF/, ''));
  const result = JSON.parse(fs.readFileSync(path.resolve(resultPath), 'utf8').replace(/^\uFEFF/, ''));
  const comparison = compareQualificationChecks(baseline, result.checks);
  fs.writeFileSync(path.resolve(outputPath), JSON.stringify(comparison, null, 2) + '\n', 'utf8');
  process.stdout.write('QUALIFICATION_CHECK_COMPARISON=' + comparison.verdict + '\n');
  return comparison.verdict === 'PASS' ? 0 : 1;
}

if (require.main === module) process.exitCode = main();

module.exports = { REQUIRED, jestFailureSuites, compareQualificationChecks };
