'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const workflowPath = path.join(root, '.github', 'workflows', 'kodjo-v2-comment-causal-implementation.yml');
const missionPath = path.join(root, '.github', 'orchestration', 'v2-slices', 'V2-CAT-01', 'implementation-mission.md');
const supervisorPath = path.join(root, 'scripts', 'kodjo', 'run-queued-request.ps1');
const scannerPath = path.join(root, 'scripts', 'kodjo', 'scan-remote-write-capability.js');
const driftVerifierPath = path.join(root, 'scripts', 'kodjo', 'verify-causal-application-drift.js');
const { changedPaths, applicationDrift } = require(driftVerifierPath);

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, shell: false });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return String(result.stdout || '').trim();
}

test('0.6.32 — l entree IMPLEMENT comment-causal utilise le runner Claude local', () => {
  const workflow = read(workflowPath);
  assert.match(workflow, /runs-on:\s*\[self-hosted, Windows, X64, kodjo-claude-local\]/);
  assert.match(workflow, /verify-implementation-plan-gate\.js/);
  assert.match(workflow, /CAUSAL_REQUEST_SCOPE_CONTRADICTION/);
  assert.match(workflow, /run-queued-request\.ps1/);
  assert.match(workflow, /-LocalRequestFile/);
  assert.match(workflow, /persist-credentials:\s*false/);
  assert.doesNotMatch(workflow, /persist-credentials:\s*true/);
  const gate = workflow.indexOf('Validate approved PLAN_OUTPUT, review and explicit user gate');
  const agent = workflow.indexOf('Execute through existing Windows local supervisor');
  assert.ok(gate >= 0 && agent > gate, 'le gate doit preceder le superviseur local');
});

test('0.6.32 — la demande causale est immuable, sans derive applicative et lie plan revue gate', () => {
  const workflow = read(workflowPath);
  assert.match(workflow, /CAUSAL_REQUEST_SOURCE_MUST_EQUAL_PARENT/);
  assert.match(workflow, /verify-causal-application-drift\.js/);
  assert.doesNotMatch(workflow, /git diff --name-only \(\[string\]\$q\.planning_source_head\)/);
  assert.match(workflow, /CAUSAL_REQUEST_BOOTSTRAP_REFUSED/);
  assert.match(workflow, /plan_comment_id/);
  assert.match(workflow, /review_comment_id/);
  assert.match(workflow, /user_gate_comment_id/);
  assert.match(workflow, /planning_source_head/);
  assert.match(workflow, /kodjo\.protocol\.v2\.comment-causal-request\.0\.6\.32/);
});

test('0.6.32 — le scan de derive conserve les chemins Unicode verbatim et NUL-safe', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-causal-drift-'));
  git(dir, ['init']);
  git(dir, ['config', 'user.email', 'kodjo@example.invalid']);
  git(dir, ['config', 'user.name', 'KODJO Test']);
  fs.mkdirSync(path.join(dir, 'docs', 'Specifications-fonctionnelles'), { recursive: true });
  const unicodePath = 'docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md';
  fs.writeFileSync(path.join(dir, unicodePath), 'v1\n', 'utf8');
  git(dir, ['add', '--', unicodePath]);
  git(dir, ['commit', '-m', 'baseline']);
  const from = git(dir, ['rev-parse', 'HEAD']);
  fs.writeFileSync(path.join(dir, unicodePath), 'v2\n', 'utf8');
  git(dir, ['add', '--', unicodePath]);
  git(dir, ['commit', '-m', 'docs unicode']);
  const to = git(dir, ['rev-parse', 'HEAD']);
  const paths = changedPaths(dir, from, to);
  assert.deepEqual(paths, [unicodePath]);
  assert.deepEqual(applicationDrift(paths), []);
});

test('0.6.32 — le scan de derive refuse un vrai changement applicatif', () => {
  assert.deepEqual(applicationDrift([
    'docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md',
    'src/features/sessions/CatalogueScreen.tsx',
  ]), ['src/features/sessions/CatalogueScreen.tsx']);
});

test('0.6.32 — le cleanup ne tente jamais Remove-Item avec un chemin vide', () => {
  const workflow = read(workflowPath);
  assert.match(workflow, /IsNullOrWhiteSpace\(\$projected\)/);
  assert.doesNotMatch(workflow, /Remove-Item -LiteralPath '\$\{\{ steps\.project\.outputs\.absolute \}\}'/);
});

test('0.6.32 — le scope runtime provient du contrat de plan approuve', () => {
  const workflow = read(workflowPath);
  assert.match(workflow, /plan_contract\.write_scope/);
  assert.match(workflow, /Compare-Object \$declared \$approved/);
  assert.match(workflow, /kodjo\.protocol\.v2\.local-implementation\.0\.6\.12/);
  assert.doesNotMatch(workflow, /agent_adapter/);
});

test('0.6.32 — le superviseur n accepte la requete locale que depuis le schema causal', () => {
  const supervisor = read(supervisorPath);
  assert.match(supervisor, /LocalRequestFile/);
  assert.match(supervisor, /kodjo\.protocol\.v2\.comment-causal-request\.0\.6\.32/);
  assert.match(supervisor, /KODJO_CAUSAL_LOCAL_REQUEST_SCHEMA_REFUSED/);
  assert.match(supervisor, /KODJO_CAUSAL_LOCAL_REQUEST_SCOPE_MISMATCH/);
  assert.match(supervisor, /kodjo\.protocol\.v2\.local-implementation\.0\.6\.12/);
});

test('0.6.32 — le scanner n ouvre contents write qu aux deux transports du meme superviseur', () => {
  const scanner = read(scannerPath);
  assert.match(scanner, /kodjo-v2-lean-queue\.yml/);
  assert.match(scanner, /kodjo-v2-comment-causal-implementation\.yml/);
  assert.match(scanner, /value === 'contents: write'/);
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
