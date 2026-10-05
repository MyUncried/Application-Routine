'use strict';

const path = require('node:path');
const { execFileSync } = require('node:child_process');

function failureDetails(error, depth = 0) {
  if (!error || depth > 5) return null;
  return { name: error.name, message: error.message, code: error.code,
    failureType: error.failureType, stack: error.stack,
    ...(error.cause ? { cause: failureDetails(error.cause, depth + 1) } : {}) };
}

// Consume the test runner's structured events, never grep the tested program's
// stdout for strings that look like a successful test.
module.exports = async function* equivalenceReporter(source) {
  const cwd = process.cwd();
  const candidate = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8', windowsHide: true }).trim();
  yield JSON.stringify({ type: 'identity', candidate_head: candidate, platform: process.platform,
    node_version: process.version }) + '\n';
  for await (const event of source) {
    if (event.type === 'test:pass' || event.type === 'test:fail') {
      const data = event.data;
      yield JSON.stringify({ type: 'test', file: data.file ? path.relative(cwd, data.file).replace(/\\/g, '/') : null,
        name: data.name, line: data.line || null,
        status: data.skip ? 'SKIP' : data.todo ? 'TODO' : event.type === 'test:pass' ? 'PASS' : 'FAIL',
        ...(event.type === 'test:fail' ? { error: failureDetails(data.details?.error) } : {}) }) + '\n';
    } else if (event.type === 'test:summary') {
      yield JSON.stringify({ type: 'summary', ...event.data }) + '\n';
    }
  }
};
