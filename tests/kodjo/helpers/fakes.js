'use strict';

/**
 * Fake check commands and test adapter plans.
 *
 * The pilot matrix must not depend on a real AI call, on a real GitHub API nor
 * on the application test suite.
 *
 * The implementation adapter is NEVER a generated command: it is the in-repo
 * script tests/kodjo/adapters/mutating-agent.js, selected by the id
 * `test:mutating-agent` and driven by a declarative JSON plan. Only the check
 * commands remain command strings, and their override is itself gated behind
 * KODJO_ALLOW_TEST_ADAPTER=1, which the workflow never sets.
 */

const fs = require('node:fs');
const path = require('node:path');

const { tmp } = require('./sandbox');

function quote(s) {
  return JSON.stringify(String(s));
}

/** Build a runnable command from generated JavaScript (check commands only). */
function nodeCommand(dir, name, source) {
  const file = path.join(dir, name + '.js');
  fs.writeFileSync(file, source, 'utf8');
  return quote(process.execPath) + ' ' + quote(file);
}

function fakesDir() {
  return tmp('kodjo-fakes-');
}

/** A check command with a chosen exit code and output. */
function fakeCheck(dir, name, options) {
  const opts = options || {};
  const src =
    'process.stdout.write(' +
    JSON.stringify(opts.stdout || '') +
    ');process.stderr.write(' +
    JSON.stringify(opts.stderr || '') +
    ');process.exit(' +
    Number(opts.exitCode || 0) +
    ');';
  return nodeCommand(dir, 'check-' + name, src);
}

/** Jest output carrying the canonical counters line. */
function jestOutput(passed, failed) {
  const total = passed + failed;
  const head = failed > 0 ? failed + ' failed, ' : '';
  return (
    'Test Suites: ' +
    (failed > 0 ? '1 failed, ' : '') +
    '10 passed, 10 total\n' +
    'Tests:       ' +
    head +
    passed +
    ' passed, ' +
    total +
    ' total\n'
  );
}

/**
 * Write a mutation plan for the in-repo test adapter and return the environment
 * that selects it.
 * @returns {object} env fragment
 */
function testAdapter(dir, counterFile, mutations, options) {
  const opts = options || {};
  const planPath = path.join(dir, 'adapter-plan-' + (opts.name || 'default') + '.json');
  fs.writeFileSync(
    planPath,
    JSON.stringify(
      {
        counterFile: counterFile,
        mutations: mutations || [],
        exitCode: Number(opts.exitCode || 0),
        gitAttempt: opts.gitAttempt || null,
      },
      null,
      2
    ),
    'utf8'
  );
  return {
    KODJO_AGENT_ADAPTER: 'test:mutating-agent',
    KODJO_ALLOW_TEST_ADAPTER: '1',
    KODJO_TEST_ADAPTER_PLAN: planPath,
  };
}

/**
 * Publication adapters are confined exactly like the implementation adapter:
 * an identifier naming an in-repo script under tests/kodjo/adapters/, never a
 * command string. Both return an environment fragment.
 */

/** Simulates an unavailable comment API. */
function failingPublisher() {
  return { KODJO_PUBLISH_CMD: 'test:failing-publisher', KODJO_ALLOW_TEST_ADAPTER: '1' };
}

/** Records the published body into `recordFile`. */
function recordingPublisher(recordFile) {
  return {
    KODJO_PUBLISH_CMD: 'test:recording-publisher',
    KODJO_ALLOW_TEST_ADAPTER: '1',
    KODJO_TEST_PUBLISH_RECORD: recordFile,
  };
}

module.exports = {
  fakesDir,
  fakeCheck,
  jestOutput,
  testAdapter,
  failingPublisher,
  recordingPublisher,
  nodeCommand,
};
