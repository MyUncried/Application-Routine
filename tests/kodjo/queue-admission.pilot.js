'use strict';

/**
 * Admission d'une demande de file — KV2-10.
 *
 * Les essais s'exécutent sur de vrais dépôts Git et appellent la fonction
 * réellement utilisée par le workflow.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const { admit, queueChanges } = require(path.join(root, 'scripts', 'kodjo', 'verify-queue-admission.js'));

const QUEUE = '.github/orchestration/queue/v2';
const uuid = (n) => '550e8400-e29b-41d4-a716-4466554400' + String(n).padStart(2, '0');
const noAuth = { verifyAuthorizations: false };

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, 'git ' + args.join(' ') + ': ' + r.stderr);
  return r.stdout.trim();
}

function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-admission-'));
  git(['init', '-q', '.'], dir);
  git(['config', 'user.email', 'a@test.local'], dir);
  git(['config', 'user.name', 'admission'], dir);
  fs.mkdirSync(path.join(dir, QUEUE), { recursive: true });
  fs.writeFileSync(path.join(dir, 'README.md'), 'base\n');
  git(['add', '-A'], dir);
  git(['commit', '-qm', 'base'], dir);
  return dir;
}

/**
 * Demande conforme au contrat. Les essais de cette suite portent sur les règles
 * d'admission `AR-1` à `AR-4` : la cohérence des autorisations est éprouvée
 * séparément dans `queue-contract.pilot.js`, et désactivée ici.
 */
function addQueue(dir, name, overrides = {}) {
  const payload = {
    schema_version: 'kodjo.protocol.v2.lean-request.0.6.13',
    slice_id: 'QUALIF', issue_number: 52, mode: 'INITIAL', session_id: null,
    request_id: uuid(1), source_head: 'a'.repeat(40), baseline_head: 'e'.repeat(40),
    slice_bootstrap_file: 'bootstrap.json', slice_bootstrap_sha256: 'c'.repeat(64),
    prompt_file: 'mission.md', scope_allow: ['src/**'], checks: ['jest'],
    created_at: '2026-09-11T00:00:00.000Z',
    authorized_plan: {
      plan_path: 'plan.md', plan_blob_oid: 'b'.repeat(40),
      approved_at_commit: 'a'.repeat(40), evidence_kind: 'ARTIFACT_HASH',
    },
    independent_review: {
      review_path: 'independent-review.md', review_blob_oid: 'a'.repeat(40),
      reviewed_plan_blob_oid: 'b'.repeat(40), verdict: 'APPROVED', evidence_kind: 'ARTIFACT_HASH',
    },
    user_gate: {
      gate_ref: 'issue_comment:2', gated_reference: 'b'.repeat(40),
      decision: 'APPROVED', user_login: 'proprietaire', evidence_kind: 'ORGANISATIONAL',
    },
    ...overrides,
  };
  for (const key of Object.keys(payload)) if (payload[key] === undefined) delete payload[key];
  fs.writeFileSync(path.join(dir, QUEUE, name + '.json'), JSON.stringify(payload, null, 2) + '\n');
  git(['add', '-A'], dir);
  git(['commit', '-qm', 'ajout ' + name], dir);
  return { before: git(['rev-parse', 'HEAD~1'], dir), after: git(['rev-parse', 'HEAD'], dir) };
}

test('AR-3 · une relance de workflow est refusée avant toute lecture de Git', () => {
  const dir = repo();
  const { before, after } = addQueue(dir, 'demande');
  assert.throws(
    () => admit({ before, after, cwd: dir, runAttempt: 2, ...noAuth }),
    /KODJO_QUEUE_RERUN_REFUSED/
  );
  // La première tentative, elle, est admise.
  assert.equal(admit({ before, after, cwd: dir, runAttempt: 1, ...noAuth }).selected, QUEUE + '/demande.json');
});

test('AR-1 · modifier une demande déjà en file est refusé', () => {
  const dir = repo();
  addQueue(dir, 'demande');
  const file = path.join(dir, QUEUE, 'demande.json');
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  payload.source_head = 'b'.repeat(40);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n');
  git(['add', '-A'], dir);
  git(['commit', '-qm', 'modification'], dir);
  assert.throws(
    () => admit({ before: git(['rev-parse', 'HEAD~1'], dir), after: git(['rev-parse', 'HEAD'], dir), cwd: dir, ...noAuth }),
    /KODJO_QUEUE_MUTATION_REFUSED: M/
  );
});

test('AR-1 · supprimer puis réintroduire une demande est refusé', () => {
  const dir = repo();
  addQueue(dir, 'demande');
  fs.unlinkSync(path.join(dir, QUEUE, 'demande.json'));
  git(['add', '-A'], dir);
  git(['commit', '-qm', 'suppression'], dir);
  assert.throws(
    () => admit({ before: git(['rev-parse', 'HEAD~1'], dir), after: git(['rev-parse', 'HEAD'], dir), cwd: dir, ...noAuth }),
    /KODJO_QUEUE_MUTATION_REFUSED: D/
  );
});

test('AR-1 · renommer une demande est refusé', () => {
  const dir = repo();
  addQueue(dir, 'demande');
  git(['mv', QUEUE + '/demande.json', QUEUE + '/renommee.json'], dir);
  git(['commit', '-qm', 'renommage'], dir);
  assert.throws(
    () => admit({ before: git(['rev-parse', 'HEAD~1'], dir), after: git(['rev-parse', 'HEAD'], dir), cwd: dir, ...noAuth }),
    /KODJO_QUEUE_MUTATION_REFUSED: R/
  );
});

test('AR-2 · un request_id déjà présent dans l’arbre est refusé', () => {
  const dir = repo();
  addQueue(dir, 'premiere');
  const { before, after } = addQueue(dir, 'seconde'); // même request_id
  assert.throws(
    () => admit({ before, after, cwd: dir, ...noAuth }),
    /KODJO_QUEUE_REQUEST_ID_DUPLICATE/
  );
});

test('AR-2 · un request_id absent ou malformé est refusé', () => {
  const dir = repo();
  const sans = addQueue(dir, 'sans-id', { request_id: undefined });
  assert.throws(() => admit({ ...sans, cwd: dir, ...noAuth }), /KODJO_QUEUE_REQUEST_ID_INVALID/);
  const mauvais = addQueue(dir, 'mauvais-id', { request_id: 'PLAN_APPROVED' });
  assert.throws(() => admit({ ...mauvais, cwd: dir, ...noAuth }), /KODJO_QUEUE_REQUEST_ID_INVALID/);
});

test('AR-4 · une reprise doit se déclarer', () => {
  const dir = repo();
  const sansSource = addQueue(dir, 'reprise-nue', {
    mode: 'RESUME_DELTA', session_id: '550e8400-e29b-41d4-a716-446655440099', request_id: uuid(2),
  });
  assert.throws(() => admit({ ...sansSource, cwd: dir, ...noAuth }), /KODJO_QUEUE_RETRY_SOURCE_MISSING/);

  const sansRaison = addQueue(dir, 'reprise-sans-raison', {
    mode: 'RESUME_DELTA', session_id: '550e8400-e29b-41d4-a716-446655440099', request_id: uuid(3), retry_of_run_id: '123',
  });
  assert.throws(() => admit({ ...sansRaison, cwd: dir, ...noAuth }), /KODJO_QUEUE_RETRY_REASON_INVALID/);

  const complete = addQueue(dir, 'reprise-complete', {
    mode: 'RESUME_DELTA', session_id: '550e8400-e29b-41d4-a716-446655440099', request_id: uuid(4),
    retry_of_run_id: '123', retry_reason: { code: 'CHECKS_FAILED', detail: 'jest' },
  });
  assert.equal(admit({ ...complete, cwd: dir, ...noAuth }).selected, QUEUE + '/reprise-complete.json');
});

test('cardinalité · deux demandes dans un même push sont refusées, et nommées', () => {
  const dir = repo();
  addQueue(dir, 'seule');
  const before = git(['rev-parse', 'HEAD'], dir);
  for (const [name, id] of [['a', uuid(5)], ['b', uuid(6)]]) {
    fs.writeFileSync(path.join(dir, QUEUE, name + '.json'),
      JSON.stringify({ request_id: id, mode: 'INITIAL' }, null, 2) + '\n');
    void id;
  }
  git(['add', '-A'], dir);
  git(['commit', '-qm', 'deux demandes'], dir);
  assert.throws(
    () => admit({ before, after: git(['rev-parse', 'HEAD'], dir), cwd: dir, ...noAuth }),
    /KODJO_QUEUE_CARDINALITY_REFUSED: 2 — demandes non traitees/
  );
});

test('un before nul (création de branche, force-push) se replie sur git show', () => {
  const dir = repo();
  const { after } = addQueue(dir, 'premiere-poussee');
  const entries = queueChanges('0'.repeat(40), after, dir);
  assert.deepEqual(entries.map((e) => e.status), ['A']);
  assert.equal(admit({ before: '0'.repeat(40), after, cwd: dir, ...noAuth }).selected, QUEUE + '/premiere-poussee.json');
});

test('le workflow appelle bien l’admission avant l’exécution', () => {
  const wf = fs.readFileSync(
    path.join(root, '.github', 'workflows', 'kodjo-v2-lean-queue.yml'), 'utf8');
  assert.match(wf, /verify-queue-admission\.js/);
  assert.match(wf, /GITHUB_RUN_ATTEMPT/);
  assert.doesNotMatch(wf, /git diff --name-only \$env:KODJO_EVENT_BEFORE/);
  const admission = wf.indexOf('verify-queue-admission.js');
  const execution = wf.indexOf('run-queued-request.ps1');
  assert.ok(admission > 0 && admission < execution, 'l’admission précède l’exécution');
});

test('registre · une demande enregistrée obsolète est refusée, par chemin ou par contenu', () => {
  const dir = repo();
  const { before, after } = addQueue(dir, 'demande');
  const V = require(path.join(root, 'scripts', 'kodjo', 'verify-queue-admission.js'));
  const rel = QUEUE + '/demande.json';
  const oid = V.blobOid(rel, dir);

  // Sans registre, la demande est admise.
  assert.equal(admit({ before, after, cwd: dir, ...noAuth }).selected, rel);

  // Enregistrée par son chemin.
  fs.mkdirSync(path.join(dir, '.github', 'orchestration', 'queue'), { recursive: true });
  const registre = path.join(dir, V.CONSUMED_REGISTRY);
  fs.writeFileSync(registre, JSON.stringify({
    schema_version: 'kodjo.protocol.v2.queue-consumed-registry.0.6.16',
    entries: [{ path: rel, blob_oid: 'f'.repeat(40), status: 'OBSOLETE_NON_REPLAYABLE', reason: 'test' }],
  }, null, 2) + '\n');
  assert.throws(() => admit({ before, after, cwd: dir, ...noAuth }), /KODJO_QUEUE_CONSUMED_REFUSED/);

  // Enregistrée par son contenu : la recopier sous un autre nom ne la relance pas.
  fs.writeFileSync(registre, JSON.stringify({
    schema_version: 'kodjo.protocol.v2.queue-consumed-registry.0.6.16',
    entries: [{ path: 'un/autre/chemin.json', blob_oid: oid, status: 'OBSOLETE_NON_REPLAYABLE', reason: 'test' }],
  }, null, 2) + '\n');
  assert.throws(() => admit({ before, after, cwd: dir, ...noAuth }), /KODJO_QUEUE_CONSUMED_REFUSED/);

  // La demande elle-même n'est jamais réécrite par le protocole.
  const contenu = JSON.parse(fs.readFileSync(path.join(dir, rel), 'utf8'));
  assert.equal('consumed' in contenu, false);
  assert.equal(V.blobOid(rel, dir), oid, 'octets inchangés');
});
