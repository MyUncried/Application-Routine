'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
const workflow = fs.readFileSync(
  path.join(root, '.github', 'workflows', 'kodjo-v2-plan-handoff-queue.yml'),
  'utf8'
);

test('approved-plan queue dispatches Lean Queue explicitly after the canonical request push', () => {
  assert.match(workflow, /actions:\s*write/);
  const push = workflow.indexOf('git push origin HEAD:main');
  const dispatch = workflow.indexOf('gh workflow run kodjo-v2-lean-queue.yml');
  assert.ok(push >= 0 && dispatch > push, 'Lean Queue dispatch must follow the queue commit push');
  assert.match(workflow, /--ref main/);
});

test('bounded validation never dispatches Lean Queue', () => {
  const validate = workflow.indexOf('- name: Bounded validation stop');
  const queue = workflow.indexOf('- name: Commit canonical Lean Request');
  const segment = workflow.slice(validate, queue);
  assert.doesNotMatch(segment, /gh workflow run kodjo-v2-lean-queue\.yml/);
});

test('approved-plan queue grants the minimum private PR read permission used by its generator', () => {
  assert.match(workflow, /^  pull-requests: read$/m);
  assert.doesNotMatch(workflow, /^  pull-requests: write$/m);
  assert.match(workflow, /node scripts\/kodjo\/generate-approved-plan-lean-request\.js/);
});
