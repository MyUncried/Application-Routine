'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_LIMITS } = require('../../scripts/kodjo/lib/claude-local');

const root = path.resolve(__dirname, '..', '..');
const generator = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'generate-approved-plan-lean-request.js'), 'utf8');

test('plan handoff reuses the canonical runtime limits instead of redefining them', () => {
  assert.match(generator, /DEFAULT_LIMITS/);
  assert.doesNotMatch(generator, /max_duration_seconds:\s*4500/);
  assert.doesNotMatch(generator, /max_prompt_bytes:\s*65536/);
  assert.equal(DEFAULT_LIMITS.max_duration_seconds, 3600);
  assert.equal(DEFAULT_LIMITS.max_prompt_bytes, 32768);
  assert.equal(DEFAULT_LIMITS.max_total_prompt_bytes, 32768);
});
