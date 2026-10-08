'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parse } = require('../../scripts/kodjo/lib/yaml');
const root = path.resolve(__dirname, '../..');
const repo = 'MyUncried/Application-Routine';
function selected(file, job, github, extra = {}) {
  const workflow = parse(fs.readFileSync(path.join(root, '.github/workflows', file), 'utf8'));
  const expression = String(workflow.jobs[job].if).trim().replace(/^\$\{\{\s*|\s*\}\}$/g, '');
  // Evaluate the actual job condition, never any workflow run block or agent.
  return Boolean(vm.runInNewContext(expression, { github, inputs:{}, ...extra,
    contains: (value, text) => String(value || '').includes(text),
    startsWith: (value, text) => String(value || '').startsWith(text),
  }, { timeout: 1000 }));
}
function pr(source = repo) {
  return { repository: repo, event_name: 'pull_request', head_ref: 'protocol/vnext-proof-stability-test',
    run_attempt: 1, event: { action: 'opened', pull_request: { head: { repo: { full_name: source } } } } };
}
test('D10: Windows runner accepts internal PR and manual dispatch, refuses fork even with matching branch', () => {
  const needs = { protocol: { outputs: { full_windows_required: 'true' } } };
  const file = 'kodjo-v2-pilot-tests.yml', job = 'protocol-windows-preflight';
  assert.equal(selected(file, job, pr(), { needs }), true);
  assert.equal(selected(file, job, pr('External/Application-Routine'), { needs }), false);
  assert.equal(selected(file, job, { repository: repo, event_name: 'workflow_dispatch', event: {} }, { needs }), true);
  assert.equal(selected(file, job, pr(), { needs: { protocol: { outputs: { full_windows_required: 'false' } } } }), false);
});
test('D10: architecture audit requires exact source repository as well as inherited branch/event/attempt gates', () => {
  const file = 'kodjo-vnext-proof-stability.yml', job = 'architecture-audit';
  assert.equal(selected(file, job, pr()), true);
  assert.equal(selected(file, job, pr('External/Application-Routine')), false);
  assert.equal(selected(file, job, { ...pr(), run_attempt: 2 }), false);
  assert.equal(selected(file, job, { ...pr(), head_ref: 'feature/other' }), false);
  assert.equal(selected(file, job, { ...pr(), event: { ...pr().event, action: 'synchronize' } }), false);
});
function comment(author, body, issue = 17) {
  return { repository: repo, actor: author, event_name: 'issue_comment',
    event: { issue: { number: issue }, comment: { body, user: { login: author } } } };
}
for (const [file, job, marker] of [
  ['kodjo-e2e-orchestration-test-v1-3.yml', 'e2e-review-bridge', '[KODJO_E2E_AUTOMATION_TEST]'],
  ['kodjo-e2e-t1-t6-v1-3.yml', 't1-to-t2', '[KODJO_E2E_T1_T6_REAL_CLAUDE_TEST]'],
  ['t01-s09-implementation-v1-3-temporary.yml', 'implement', '@claude-t01-s09-implement-v1-3-phase-a'],
  ['t01-s09-plan-revision-v1-3-temporary.yml', 'revise-plan', '@claude-t01-s09-plan-revision-v1-3'],
]) test('D13: ' + file + ' checks comment author, marker and issue before scheduling', () => {
  assert.equal(selected(file, job, comment('MyUncried', marker)), true);
  for (const actor of ['External', 'github-actions[bot]']) assert.equal(selected(file, job, comment(actor, marker)), false);
  assert.equal(selected(file, job, comment('MyUncried', marker, 18)), false);
  assert.equal(selected(file, job, comment('MyUncried', 'unrelated')), false);
});
test('D13: historical internal dispatch accepts only owner or expected Actions actor', () => {
  for (const actor of ['MyUncried', 'github-actions[bot]', 'External']) {
    const github = { actor, event_name: 'repository_dispatch', event: { action: 'kodjo-e2e-t2-claude-real' } };
    assert.equal(selected('kodjo-e2e-t1-t6-v1-3.yml', 't2-to-t3', github), actor !== 'External');
  }
});
for (const marker of ['PLAN_APPROVED', 'IMPLEMENTATION_REVISION', 'VISUAL_CORRECTION', 'CORRECT']) {
  test('D14: local ' + marker + ' rejects non-owner before runner/checkout/Claude', () => {
    const file = 'kodjo-v14-s09-implementation-local.yml', job = 'implement', body = '[KODJO_V14_S09] ' + marker;
    assert.equal(selected(file, job, comment('MyUncried', body)), true);
    assert.equal(selected(file, job, comment('External', body)), false);
    assert.equal(selected(file, job, comment('github-actions[bot]', body)), false);
    assert.equal(selected(file, job, comment('MyUncried', body, 18)), false);
  });
}
