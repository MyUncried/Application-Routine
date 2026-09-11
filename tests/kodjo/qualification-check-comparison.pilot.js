'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { compareQualificationChecks } = require(path.join(
  __dirname, '..', '..', 'scripts', 'kodjo', 'compare-qualification-checks.js'
));

function check(name, status, extras) {
  return { check: name, status, exit_code: status === 'PASS' ? 0 : 1, ...extras };
}

function baseline(overrides) {
  return {
    jest: check('jest', 'PASS'),
    typescript: check('typescript', 'PASS'),
    lint: check('lint', 'PASS'),
    ...(overrides || {}),
  };
}

function post(overrides) {
  const values = {
    jest: check('jest', 'PASS'),
    typescript: check('typescript', 'PASS'),
    lint: check('lint', 'PASS'),
    ...(overrides || {}),
  };
  return Object.values(values);
}

test('qualification checks — trois contrôles exécutés et PASS', () => {
  const result = compareQualificationChecks(baseline(), post());
  assert.equal(result.absolute_status, 'PASS');
  assert.equal(result.executable_status, 'PASS');
  assert.equal(result.regression_status, 'PASS');
  assert.equal(result.verdict, 'PASS');
});

test('qualification checks — un nouvel échec après Claude est une régression', () => {
  const result = compareQualificationChecks(baseline(), post({ lint: check('lint', 'FAIL') }));
  assert.equal(result.regression_status, 'FAIL');
  assert.equal(result.verdict, 'FAIL');
  assert.equal(result.comparisons.find((item) => item.check === 'lint').reason, 'NEW_FAILURE');
});

test('qualification checks — le même échec Jest préexistant reste distinct du verdict protocolaire', () => {
  const failure = { failed_tests: 1, log_excerpt: 'FAIL src/example.test.ts\nTests: 1 failed, 10 passed, 11 total' };
  const result = compareQualificationChecks(
    baseline({ jest: check('jest', 'FAIL', failure) }),
    post({ jest: check('jest', 'FAIL', failure) })
  );
  assert.equal(result.absolute_status, 'FAIL');
  assert.equal(result.regression_status, 'PASS');
  assert.equal(result.verdict, 'PASS');
});

test('qualification checks — une suite Jest différente est refusée conservatoirement', () => {
  const before = check('jest', 'FAIL', { failed_tests: 1, log_excerpt: 'FAIL src/a.test.ts' });
  const after = check('jest', 'FAIL', { failed_tests: 1, log_excerpt: 'FAIL src/b.test.ts' });
  const result = compareQualificationChecks(baseline({ jest: before }), post({ jest: after }));
  assert.equal(result.regression_status, 'FAIL');
  assert.equal(result.verdict, 'FAIL');
});

test('qualification checks — un contrôle non exécuté interdit toute certification', () => {
  const result = compareQualificationChecks(baseline(), post({ typescript: check('typescript', 'NOT_RUN') }));
  assert.equal(result.executable_status, 'FAIL');
  assert.equal(result.verdict, 'FAIL');
});
