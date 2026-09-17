'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const workflowPath = path.join(root, '.github', 'workflows', 'kodjo-v2-comment-causal-implementation.yml');
const missionPath = path.join(root, '.github', 'orchestration', 'v2-slices', 'V2-CAT-01', 'implementation-mission.md');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

test('0.6.32 — l entree IMPLEMENT comment-causal utilise le runner Claude local', () => {
  const workflow = read(workflowPath);
  assert.match(workflow, /runs-on:\s*\[self-hosted, Windows, X64, kodjo-claude-local\]/);
  assert.match(workflow, /verify-implementation-plan-gate\.js/);
  assert.match(workflow, /CAUSAL_REQUEST_SCOPE_CONTRADICTION/);
  assert.match(workflow, /run-queued-request\.ps1/);
  const gate = workflow.indexOf('Validate approved PLAN_OUTPUT, review and explicit user gate');
  const agent = workflow.indexOf('Execute through existing Windows local supervisor');
  assert.ok(gate >= 0 && agent > gate, 'le gate doit preceder le superviseur local');
});

test('0.6.32 — la demande causale est immuable et lie plan revue gate', () => {
  const workflow = read(workflowPath);
  assert.match(workflow, /CAUSAL_REQUEST_SOURCE_MUST_EQUAL_PARENT/);
  assert.match(workflow, /plan_comment_id/);
  assert.match(workflow, /review_comment_id/);
  assert.match(workflow, /user_gate_comment_id/);
  assert.match(workflow, /planning_source_head/);
  assert.match(workflow, /kodjo\.protocol\.v2\.comment-causal-request\.0\.6\.32/);
});

test('0.6.32 — le scope runtime provient du contrat de plan approuve', () => {
  const workflow = read(workflowPath);
  assert.match(workflow, /plan_contract\.write_scope/);
  assert.match(workflow, /Compare-Object \$declared \$approved/);
  assert.doesNotMatch(workflow, /agent_adapter/);
});

test('V2-CAT-01 — mission d implementation bornee existe et conserve les decisions fermees', () => {
  const mission = read(missionPath);
  assert.match(mission, /5720329801/);
  assert.match(mission, /5720519466/);
  assert.match(mission, /5720551793/);
  assert.match(mission, /Une nouvelle activité/);
  assert.match(mission, /updatedAt DESC/);
  assert.match(mission, /SessionServiceProvider\.tsx/);
  assert.match(mission, /aucun second `SQLiteProvider`/i);
  assert.match(mission, /CLARIFICATION_REQUIRED/);
});
