'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_LIMITS } = require('../../scripts/kodjo/lib/claude-local');

const root = path.resolve(__dirname, '..', '..');
const generator = fs.readFileSync(
  path.join(root, 'scripts', 'kodjo', 'generate-approved-plan-lean-request.js'),
  'utf8'
);

test('approved-plan generator reuses the stable Claude budget defaults', () => {
  assert.match(generator, /DEFAULT_LIMITS/);
  assert.match(generator, /limits:\s*\{ \.\.\.DEFAULT_LIMITS \}/);
  assert.deepEqual(DEFAULT_LIMITS, {
    max_ai_calls: 1,
    max_duration_seconds: 3600,
    max_prompt_bytes: 32768,
    max_total_prompt_bytes: 32768,
    max_rollovers: 0,
  });
});

test('approved-plan generator does not carry private budget overrides', () => {
  assert.doesNotMatch(generator, /max_duration_seconds:\s*4500/);
  assert.doesNotMatch(generator, /max_prompt_bytes:\s*65536/);
  assert.doesNotMatch(generator, /max_total_prompt_bytes:\s*65536/);
});
