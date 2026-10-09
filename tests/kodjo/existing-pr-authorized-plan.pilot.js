'use strict';
// Livraison sur une PR existante (run 37208114796) : l'arbre de travail est au HEAD applicatif, dont technical-plan.md
// était le plan remplacé ; le modèle l'a lu et n'a rien implémenté. Le superviseur fournit désormais le plan autorisé,
// lu au HEAD protocolaire et lié à son blob, dans l'arbre de travail (Read y est confiné), exclu de Git.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const C = require('../../scripts/kodjo/lib/claude-local');
const L = require('../../scripts/kodjo/run-local-claude');
const I = require('../../scripts/kodjo/lib/slice-identity');
const { projectQueueRequest } = require('../../scripts/kodjo/lib/queue-request');

const PLAN = { plan_path: '.github/orchestration/v2-slices/SMOKE/technical-plan.md', plan_blob_oid: 'd'.repeat(40) };
const TARGET = { kind: 'EXISTING_PR', application_pr: 303, application_head: 'a'.repeat(40), branch: 'kodjo/v2-smoke-1' };

function fixture(overrides) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-authorized-plan-'));
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'docs', 'task.md'), 'Exécuter le plan approuvé matérialisé dans `technical-plan.md`.\n');
  const bootstrapDir = path.join(root, '.github', 'orchestration', 'v2-slices', 'SMOKE');
  fs.mkdirSync(bootstrapDir, { recursive: true });
  const bootstrap = { schema_version: I.BOOTSTRAP_SCHEMA, slice_id: 'SMOKE', issue_number: 1, repository: 'MyUncried/Application-Routine', target_branch: 'main', baseline_head: 'a'.repeat(40), protocol_version: '0.6.12', protocol_commit: 'b'.repeat(40), activation_registry: '.github/orchestration/v2-activation-registry.json', previous_slice_id: null, previous_checkpoint: null, product_sources: [{ path: 'docs/task.md', sha256: 'c'.repeat(64) }], authorized_actors: ['user', 'claude-local'], created_at: '2026-09-10T18:00:00.000Z' };
  bootstrap.slice_bootstrap_sha256 = I.sha256(I.canonical(bootstrap));
  fs.writeFileSync(path.join(bootstrapDir, 'slice-bootstrap.json'), JSON.stringify(bootstrap));
  fs.writeFileSync(path.join(root, '.github', 'orchestration', 'v2-activation-registry.json'), JSON.stringify({ schema_version: I.REGISTRY_SCHEMA, activations: [{ slice_id: 'SMOKE', status: 'ACTIVE', issue_number: 1, baseline_head: 'a'.repeat(40), bootstrap_path: '.github/orchestration/v2-slices/SMOKE/slice-bootstrap.json', slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256 }] }));
  const request = {
    schema_version: 'kodjo.protocol.v2.local-implementation.0.6.12',
    slice_id: 'SMOKE', source_head: 'a'.repeat(40), baseline_head: 'a'.repeat(40), slice_bootstrap_file: '.github/orchestration/v2-slices/SMOKE/slice-bootstrap.json', slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256, mode: 'INITIAL',
    session_id: null, request_id: '550e8400-e29b-41d4-a716-446655440001',
    prompt_file: 'docs/task.md', scope_allow: ['src/**'], checks: ['jest'], limits: { ...C.DEFAULT_LIMITS },
    delivery_target: TARGET, authorized_plan: PLAN,
    ...(overrides || {}),
  };
  return { root, request };
}

test('projection: authorized_plan is carried only for an existing-PR delivery', () => {
  const q = { slice_id: 'S', source_head: 'b'.repeat(40), baseline_head: 'c'.repeat(40), slice_bootstrap_file: 'x', slice_bootstrap_sha256: 'e'.repeat(64),
    mode: 'INITIAL', session_id: null, prompt_file: 'm.md', scope_allow: ['src/**'], checks: ['jest'], limits: { max_ai_calls: 1 },
    request_id: '550e8400-e29b-41d4-a716-446655440001', authorized_plan: { ...PLAN, approved_at_commit: 'b'.repeat(40), evidence_kind: 'ARTIFACT_HASH' } };
  assert.deepEqual(projectQueueRequest({ ...q, delivery_target: TARGET }).authorized_plan, PLAN);
  assert.equal(projectQueueRequest(q).authorized_plan, undefined);
});

test('normalization keeps a valid authorized plan and refuses an invalid or orphan one', () => {
  const f = fixture();
  assert.deepEqual(C.normalizeRequest(f.request, f.root).authorized_plan, PLAN);
  for (const bad of [{ ...PLAN, plan_blob_oid: 'xyz' }, { ...PLAN, plan_path: '../technical-plan.md' }, { ...PLAN, plan_path: '.github/orchestration/v2-slices/OTHER/technical-plan.md' }]) {
    const g = fixture({ authorized_plan: bad });
    assert.throws(() => C.normalizeRequest(g.request, g.root), /AUTHORIZED_PLAN_INVALID/);
  }
  const h = fixture({ delivery_target: undefined });
  assert.throws(() => C.normalizeRequest(h.request, h.root), /AUTHORIZED_PLAN_INVALID/);
});

test('prompt designates the in-tree authorized copy and declares the application copy non-opposable', () => {
  const f = fixture();
  const prompt = C.buildPrompt(C.normalizeRequest(f.request, f.root), 'Mission.', f.root);
  assert.match(prompt, new RegExp('Plan approuvé opposable \\(blob ' + 'd'.repeat(40) + ', lu au HEAD protocolaire, en lecture seule\\): \\.kodjo-authorized-plan/technical-plan\\.md'));
  assert.match(prompt, /Toute mention de `technical-plan\.md` dans la mission désigne ce fichier/);
  assert.ok(prompt.indexOf('Plan approuvé opposable') < prompt.indexOf('Mission:'));
  const g = fixture({ authorized_plan: undefined });
  assert.doesNotMatch(C.buildPrompt(C.normalizeRequest(g.request, g.root), 'Mission.', g.root), /Plan approuvé opposable/);
});

test('materialization: read-only copy inside the worktree, excluded from git status and staging', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-authorized-plan-git-'));
  t.after(() => { try { fs.chmodSync(path.join(dir, '.kodjo-authorized-plan', 'technical-plan.md'), 0o600); } catch (_) {} fs.rmSync(dir, { recursive: true, force: true }); });
  const git = (...a) => { const r = spawnSync('git', a, { cwd: dir, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout; };
  git('init', '-q', '.'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't');
  fs.mkdirSync(path.join(dir, 'src')); fs.writeFileSync(path.join(dir, 'src', 'a.ts'), 'x\n'); git('add', '-A'); git('commit', '-qm', 'base');
  const file = L.materializeAuthorizedPlan(dir, Buffer.from('# Plan approuvé\n'));
  assert.equal(path.relative(dir, file).replace(/\\/g, '/'), '.kodjo-authorized-plan/technical-plan.md');
  assert.equal(fs.readFileSync(file, 'utf8'), '# Plan approuvé\n');
  assert.throws(() => fs.writeFileSync(file, 'altered'));
  assert.deepEqual(L.changedFiles(dir), []);
  git('add', '--all');
  assert.equal(git('diff', '--cached', '--name-only'), '');
  // Idempotent : une seconde matérialisation remplace la copie sans dupliquer la règle d'exclusion.
  L.materializeAuthorizedPlan(dir, Buffer.from('# Plan approuvé v2\n'));
  assert.equal(fs.readFileSync(file, 'utf8'), '# Plan approuvé v2\n');
  assert.equal(fs.readFileSync(path.join(dir, '.git', 'info', 'exclude'), 'utf8').split('\n').filter((l) => l === '/.kodjo-authorized-plan/').length, 1);
});

test('supervisor binds the authorized plan to its blob before materializing it, and removes it after Claude', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'kodjo', 'run-local-claude.js'), 'utf8').replace(/\r\n/g, '\n');
  const read = src.indexOf('Source.readFileAtHead(request.authorized_plan.plan_path, request.protocol_source_head, repoRoot)');
  const bind = src.indexOf("writeFailure('AUTHORIZED_PLAN_BLOB_MISMATCH'");
  const clean = src.indexOf("writeFailure('WORKTREE_NOT_CLEAN'");
  const place = src.indexOf('authorizedPlanFile = materializeAuthorizedPlan(repoRoot, authorizedPlanBuffer, vnextAdmission ? request.protocol_source_head : null)');
  const visible = src.indexOf("writeFailure('AUTHORIZED_PLAN_NOT_EXCLUDED'");
  const run = src.indexOf('result = command(claudeBin, [...claudePrefix, ...args], repoRoot, claudeEnv');
  const remove = src.indexOf('fs.rmSync(path.dirname(authorizedPlanFile), { recursive: true, force: true })');
  assert.ok(read > 0 && read < bind && bind < clean && clean < place && place < visible && visible < run && run < remove);
});
