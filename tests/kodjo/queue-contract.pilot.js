'use strict';

/**
 * Contrat de file et autorisations — KV2-22, KV2-23.
 *
 * L'audit avait produit une PR `IMPLEMENTED_AND_VERIFIED` à partir d'une demande
 * dont les trois preuves valaient `null`, et le HEAD 9d31461 portait encore la
 * chaîne littérale `"PLAN_APPROVED"`. Ces essais exercent le contrat exécutable
 * et la vérification réellement appelée par l'admission.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const C = require(path.join(root, 'scripts', 'kodjo', 'lib', 'queue-contract.js'));
const A = require(path.join(root, 'scripts', 'kodjo', 'verify-authorizations.js'));
const G = require(path.join(root, 'scripts', 'kodjo', 'generate-queue-schema.js'));
const M = require(path.join(root, 'scripts', 'kodjo', 'lib', 'recovery-migration.js'));
const P = require(path.join(root, 'scripts', 'kodjo', 'lib', 'plan-impact.js'));

const canonical = (v) => Array.isArray(v)
  ? '[' + v.map(canonical).join(',') + ']'
  : (v && typeof v === 'object'
    ? '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}'
    : JSON.stringify(v));
const sha256 = (v) => crypto.createHash('sha256').update(v, 'utf8').digest('hex');
const uuid = () => '550e8400-e29b-41d4-a716-446655440000';

/* ------------------------------------------------------------------ *
 * Contrat
 * ------------------------------------------------------------------ */

function validQueue(overrides = {}) {
  return {
    schema_version: C.LEAN_REQUEST_SCHEMA,
    slice_id: 'QUALIF', issue_number: 999, mode: 'INITIAL', session_id: null,
    source_head: 'a'.repeat(40), baseline_head: 'e'.repeat(40),
    slice_bootstrap_file: '.github/orchestration/v2-slices/QUALIF/slice-bootstrap.json',
    slice_bootstrap_sha256: 'c'.repeat(64),
    prompt_file: 'mission.md', scope_allow: ['src/**'], checks: ['jest'],
    request_id: uuid(), created_at: '2026-09-11T00:00:00.000Z',
    authorized_plan: {
      plan_path: 'plan.md', plan_blob_oid: 'b'.repeat(40),
      approved_at_commit: 'a'.repeat(40), evidence_kind: 'ARTIFACT_HASH',
    },
    independent_review: {
      review_path: 'independent-review.md', review_blob_oid: 'a'.repeat(40),
      reviewed_plan_blob_oid: 'b'.repeat(40),
      verdict: 'APPROVED', evidence_kind: 'ARTIFACT_HASH',
    },
    user_gate: {
      gate_ref: 'issue_comment:2', gated_reference: 'b'.repeat(40),
      decision: 'APPROVED', user_login: 'proprietaire', evidence_kind: 'ORGANISATIONAL',
    },
    ...overrides,
  };
}
const diagnostics = (q) => C.validateQueueRequest(q).map((v) => v.diagnostic);

test('le contrat accepte une demande conforme', () => {
  assert.deepEqual(C.validateQueueRequest(validQueue()), []);
});



test('IMPLEMENT peut cibler une PR applicative existante sans modifier le schéma Lean', () => {
  const target = {
    kind: 'EXISTING_PR',
    application_pr: 181,
    branch: 'kodjo/application',
    application_head: 'd'.repeat(40),
  };
  assert.deepEqual(C.validateQueueRequest(validQueue({
    operation_kind: 'IMPLEMENT',
    delivery_target: target,
  })), []);
  assert.ok(diagnostics(validQueue({
    operation_kind: 'IMPLEMENT',
    delivery_target: { ...target, application_head: 'bad' },
  })).includes('KODJO_QUEUE_DELIVERY_TARGET_REFUSED'));
});

test('la référence de migration est structurée, bornée et optionnelle', () => {
  const migration = {
    attestation_path: '.github/orchestration/v2-slices/QUALIF/recovery-migration.json',
    attestation_blob_oid: 'd'.repeat(40), evidence_kind: 'ARTIFACT_HASH',
  };
  const resume = { mode: 'RESUME_DELTA', session_id: uuid(), retry_of_run_id: '123',
    retry_reason: { code: 'CLARIFICATION', detail: 'migration' } };
  assert.deepEqual(C.validateQueueRequest(validQueue({ ...resume, recovery_migration: migration })), []);
  assert.ok(diagnostics(validQueue({ ...resume, recovery_migration: { ...migration, attestation_blob_oid: '' } }))
    .includes('KODJO_QUEUE_RECOVERY_MIGRATION_REFUSED'));
  assert.ok(diagnostics(validQueue({ ...resume, recovery_migration: { ...migration, evidence_kind: 'DECLARATIVE' } }))
    .includes('KODJO_QUEUE_RECOVERY_MIGRATION_REFUSED'));
  assert.ok(diagnostics(validQueue({ recovery_migration: migration }))
    .includes('KODJO_QUEUE_RECOVERY_MIGRATION_REFUSED'));
});

test('le contrat refuse toute limite de tours imposée par le protocole', () => {
  const d = diagnostics(validQueue({ limits: {
    max_ai_calls: 1, max_turns: 40, max_duration_seconds: 3600,
    max_prompt_bytes: 32768, max_total_prompt_bytes: 32768, max_rollovers: 0,
  } }));
  assert.ok(d.includes('KODJO_QUEUE_LIMITS_REFUSED'));
  assert.deepEqual(C.validateQueueRequest(validQueue({ limits: {
    max_ai_calls: 1, max_duration_seconds: 3600,
    max_prompt_bytes: 32768, max_total_prompt_bytes: 32768, max_rollovers: 0,
  } })), []);
});

test('le contrat refuse toute propriété inconnue', () => {
  assert.ok(diagnostics(validQueue({ champ_invente: 1 })).includes('KODJO_QUEUE_UNKNOWN_PROPERTY'));
});

test('le contrat refuse une chaîne déclarative en guise de preuve', () => {
  // C'est exactement ce que portait le HEAD 9d31461 : user_gate = "PLAN_APPROVED".
  const d = diagnostics(validQueue({ user_gate: 'PLAN_APPROVED' }));
  assert.ok(d.includes('KODJO_QUEUE_USER_GATE_REFUSED'));
  assert.ok(diagnostics(validQueue({ authorized_plan: 'PLAN_APPROVED' }))
    .includes('KODJO_QUEUE_AUTHORIZED_PLAN_REFUSED'));
  assert.ok(diagnostics(validQueue({ independent_review: null }))
    .includes('KODJO_QUEUE_INDEPENDENT_REVIEW_REFUSED'));
});

test('evidence_kind est obligatoire et contraint pour les trois preuves', () => {
  const plan = validQueue().authorized_plan;
  assert.ok(diagnostics(validQueue({ authorized_plan: { ...plan, evidence_kind: undefined } }))
    .includes('KODJO_QUEUE_AUTHORIZED_PLAN_REFUSED'));
  // La validation métier ne peut pas se déclarer preuve technique.
  const gate = validQueue().user_gate;
  assert.ok(diagnostics(validQueue({ user_gate: { ...gate, evidence_kind: 'ARTIFACT_HASH' } }))
    .includes('KODJO_QUEUE_USER_GATE_REFUSED'));
  assert.deepEqual(C.validateQueueRequest(validQueue({ user_gate: { ...gate, evidence_kind: 'ORGANISATIONAL' } })), []);
});

test('request_id est obligatoire et doit être un UUID', () => {
  assert.ok(diagnostics(validQueue({ request_id: undefined })).includes('KODJO_QUEUE_REQUEST_ID_INVALID'));
  assert.ok(diagnostics(validQueue({ request_id: 'PLAN_APPROVED' })).includes('KODJO_QUEUE_REQUEST_ID_INVALID'));
});

test('les champs conditionnels suivent le mode', () => {
  const resume = validQueue({ mode: 'RESUME_DELTA', session_id: uuid() });
  const d = diagnostics(resume);
  assert.ok(d.includes('KODJO_QUEUE_RETRY_SOURCE_MISSING'));
  assert.ok(d.includes('KODJO_QUEUE_RETRY_REASON_INVALID'));
  assert.deepEqual(C.validateQueueRequest({
    ...resume, retry_of_run_id: '123', retry_reason: { code: 'CHECKS_FAILED', detail: 'jest' },
  }), []);
  assert.deepEqual(C.validateQueueRequest({
    ...resume,
    retry_of_run_id: '34724854785',
    retry_reason: {
      code: 'CONTROLLED_INTERRUPTION_AFTER_RECOVERY',
      detail: 'certified package preserved before checks',
    },
  }), []);
  // En INITIAL, ces champs sont interdits.
  assert.ok(diagnostics(validQueue({ retry_of_run_id: '123' })).includes('KODJO_QUEUE_RETRY_SOURCE_MISSING'));
  assert.ok(diagnostics(validQueue({ retry_reason: { code: 'CHECKS_FAILED', detail: 'jest' } }))
    .includes('KODJO_QUEUE_RETRY_REASON_INVALID'));
});

test('retry_reason exige une structure exacte, un détail textuel non vide et borné', () => {
  const base = validQueue({
    mode: 'RESUME_DELTA', session_id: uuid(), retry_of_run_id: '34760019019',
  });
  const refused = [
    undefined,
    { code: 'CHECKS_FAILED' },
    { code: 'CHECKS_FAILED', detail: '' },
    { code: 'CHECKS_FAILED', detail: '   \n\t' },
    { code: 'CHECKS_FAILED', detail: 5 },
    { code: 'CHECKS_FAILED', detail: 'ok', scope_allow: ['**'] },
    { code: 'INVENTED', detail: 'diagnostic' },
    { code: 'CHECKS_FAILED', detail: 'é'.repeat(C.MAX_RETRY_REASON_DETAIL_BYTES) },
  ];
  for (const retry_reason of refused) {
    assert.ok(diagnostics({ ...base, retry_reason }).includes('KODJO_QUEUE_RETRY_REASON_INVALID'));
  }
  assert.deepEqual(C.validateQueueRequest({
    ...base,
    retry_reason: { code: 'CHECKS_FAILED', detail: 'x'.repeat(C.MAX_RETRY_REASON_DETAIL_BYTES) },
  }), []);
});

test('complétude · toute propriété BEHAVIOUR est transmise au superviseur', () => {
  const { projectQueueRequest } = require(path.join(root, 'scripts', 'kodjo', 'lib', 'queue-request.js'));
  const produced = new Set(Object.keys(projectQueueRequest(
    validQueue({
      allow_legacy_recovery_bootstrap: true, mode: 'RESUME_DELTA', session_id: uuid(),
      retry_of_run_id: '123', retry_reason: { code: 'CHECKS_FAILED', detail: 'jest' },
    })
  )));
  const restarted = projectQueueRequest(validQueue({ initial_restart: {code:'IRRECOVERABLE_INITIAL_RESTART',source_run_id:'123',source_run_attempt:1,source_request_id:'550e8400-e29b-41d4-a716-446655440099'} }));
  for (const name of Object.keys(restarted)) produced.add(name);
  const manquants = C.propertiesOfNature('BEHAVIOUR')
    .filter((name) => name !== 'schema_version' && !produced.has(name));
  assert.deepEqual(manquants, [],
    'un champ BEHAVIOUR du contrat n’est pas transmis : c’est la classe KV2-01');
});

test('complétude · toute propriété AUTHORIZATION est consommée par la vérification', () => {
  const source = [
    fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'verify-authorizations.js'), 'utf8'),
    fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'verify-queue-admission.js'), 'utf8'),
    fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'verify-visual-checkpoint.js'), 'utf8'),
  ].join('\n');
  const jamais = C.propertiesOfNature('AUTHORIZATION').filter((name) => !source.includes(name));
  assert.deepEqual(jamais, [], 'une preuve d’autorisation n’est lue par aucun code');
});

test('le schéma publié est la projection exacte du contrat exécutable', () => {
  const commité = fs.readFileSync(
    path.join(root, '.github', 'orchestration', 'lean-request.schema.json'),
    'utf8',
  ).replace(/\r\n/g, '\n');
  assert.equal(commité, G.serialize(), 'régénérer avec generate-queue-schema.js --write');
  const schéma = JSON.parse(commité);
  assert.equal(schéma.additionalProperties, false);
  for (const name of Object.keys(C.PROPERTIES)) {
    assert.equal(schéma.properties[name]['x-kodjo-nature'], C.PROPERTIES[name].nature, name);
  }
});


/**
 * Client GitHub de test. Aucun accès réseau : les essais injectent cet objet là
 * où la production appelle `gh api`.
 */
function fakeGithub(overrides = {}) {
  const state = {
    comments: {
      12: { id: 12, issue_url: 'https://api.github.com/repos/o/r/issues/52',
        body: 'Validation métier demandée sur PLANBLOB. Réagissez par 👍 pour approuver.',
        user: { login: 'kodjo-protocol' } },
    },
    reactions: { 12: [{ content: '+1', user: { login: 'MyUncried' } }] },
    ...overrides,
  };
  return {
    state,
    comment: (repo, id) => state.comments[id] || null,
    // Valeur brute : un test doit pouvoir simuler une réponse illisible.
    reactions: (repo, id) => (id in state.reactions ? state.reactions[id] : []),
  };
}

/**
 * Remplace le marqueur du commentaire de validation. La revue ne passe plus par
 * GitHub : elle est prouvée par le fichier versionné et son empreinte.
 */
function githubFor(planBlob, gateReference = null, overrides = {}) {
  const g = fakeGithub(overrides);
  g.state.comments[12].body = g.state.comments[12].body.replace('PLANBLOB', gateReference || planBlob);
  return g;
}

/* ------------------------------------------------------------------ *
 * Autorisations, sur un dépôt Git réel
 * ------------------------------------------------------------------ */

function authFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-auth-'));
  const git = (args) => {
    const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
    assert.equal(r.status, 0, 'git ' + args.join(' ') + ': ' + r.stderr);
    return r.stdout.trim();
  };
  git(['init', '-q', '.']);
  git(['config', 'user.email', 'auth@test.local']);
  git(['config', 'user.name', 'auth']);
  fs.writeFileSync(path.join(dir, 'package-source.txt'), 'package source\n');
  git(['add', '-A']);
  git(['commit', '-qm', 'package source']);
  const packageSource = git(['rev-parse', 'HEAD']);
  const sliceDir = path.join(dir, '.github', 'orchestration', 'v2-slices', 'QUALIF');
  fs.mkdirSync(sliceDir, { recursive: true });
  fs.mkdirSync(path.join(dir, '.github', 'orchestration', 'queue', 'v2'), { recursive: true });
  fs.writeFileSync(path.join(sliceDir, 'technical-plan.md'), '# Plan approuvé\n');
  fs.writeFileSync(path.join(sliceDir, 'independent-review.md'),
    '# Revue indépendante\n\n- Plan revu : `technical-plan.md`\n\nVerdict : `APPROVED`\n');

  const bootstrap = {
    schema_version: 'kodjo.protocol.v2.slice-bootstrap.0.6.12', slice_id: 'QUALIF',
    issue_number: 52, repository: 'MyUncried/Application-Routine', target_branch: 'main',
    baseline_head: 'e'.repeat(40), protocol_version: '0.6.12', protocol_commit: 'f'.repeat(40),
    activation_registry: '.github/orchestration/v2-activation-registry.json',
    previous_slice_id: null, previous_checkpoint: null,
    product_sources: [{ path: 'x', sha256: '0'.repeat(64) }],
    authorized_actors: ['kodjo-protocol', 'kodjo-reviewer'], created_at: '2026-09-11T00:00:00.000Z',
    planning_application_head: packageSource,
  };
  bootstrap.slice_bootstrap_sha256 = sha256(canonical(bootstrap));
  fs.writeFileSync(path.join(sliceDir, 'slice-bootstrap.json'), JSON.stringify(bootstrap, null, 2) + '\n');
  fs.writeFileSync(path.join(dir, '.github', 'orchestration', 'v2-activation-registry.json'),
    JSON.stringify({
      schema_version: 'kodjo.protocol.v2.activation-registry.0.6.12',
      activations: [{
        slice_id: 'QUALIF', status: 'ACTIVE', issue_number: 52, baseline_head: 'e'.repeat(40),
        bootstrap_path: '.github/orchestration/v2-slices/QUALIF/slice-bootstrap.json',
        slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256,
      }],
    }, null, 2) + '\n');
  git(['add', '-A']);
  git(['commit', '-qm', 'plan approuvé']);
  const planCommit = git(['rev-parse', 'HEAD']);
  const planBlob = git(['rev-parse', 'HEAD:.github/orchestration/v2-slices/QUALIF/technical-plan.md']);
  const reviewPath = '.github/orchestration/v2-slices/QUALIF/independent-review.md';
  const reviewBlob = git(['rev-parse', 'HEAD:' + reviewPath]);
  fs.writeFileSync(path.join(dir, 'suite.md'), 'suite\n');
  git(['add', '-A']);
  git(['commit', '-qm', 'suite']);

  const queue = validQueue({
    issue_number: 52, source_head: git(['rev-parse', 'HEAD']),
    slice_bootstrap_file: '.github/orchestration/v2-slices/QUALIF/slice-bootstrap.json',
    slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256,
    authorized_plan: {
      plan_path: '.github/orchestration/v2-slices/QUALIF/technical-plan.md',
      plan_blob_oid: planBlob, approved_at_commit: planCommit, evidence_kind: 'ARTIFACT_HASH',
    },
    independent_review: {
      review_path: reviewPath, review_blob_oid: reviewBlob, reviewed_plan_blob_oid: planBlob,
      verdict: 'APPROVED', evidence_kind: 'ARTIFACT_HASH',
    },
    user_gate: {
      gate_ref: 'issue_comment:12', gated_reference: planBlob,
      decision: 'APPROVED', user_login: 'MyUncried', evidence_kind: 'ORGANISATIONAL',
    },
  });
  const write = (q) => {
    const rel = '.github/orchestration/queue/v2/demande.json';
    fs.writeFileSync(path.join(dir, rel), JSON.stringify(q, null, 2) + '\n');
    return rel;
  };
  return { dir, queue, write, packageSource, planCommit, planBlob, reviewPath, reviewBlob, git };
}

function bindMigrationAttestation(f, overrides = {}) {
  const attestationPath = '.github/orchestration/v2-slices/QUALIF/recovery-migration.json';
  const attestation = {
    schema_version: M.ATTESTATION_SCHEMA, status: 'CERTIFIED',
    slice_id: 'QUALIF', source_head: f.queue.source_head,
    certified_target_head: f.queue.source_head, baseline_head: f.queue.baseline_head,
    source_run_id: '34770454986', session_id: uuid(),
    application_pr_head: f.packageSource,
    certified_protocol_executable_paths: [], certified_protocol_document_paths: [],
    certified_product_document_paths: [], compatible_application_paths: [],
    post_certification_protocol_files: { [attestationPath]: 'SELF' },
    authorization_binding: {
      authorized_plan: {
        plan_path: f.queue.authorized_plan.plan_path,
        plan_blob_oid: f.queue.authorized_plan.plan_blob_oid,
      },
      independent_review: {
        review_path: f.queue.independent_review.review_path,
        review_blob_oid: f.queue.independent_review.review_blob_oid,
        reviewed_plan_blob_oid: f.queue.independent_review.reviewed_plan_blob_oid,
      },
      user_gate: { ...f.queue.user_gate },
    },
    ...overrides,
  };
  const absolute = path.join(f.dir, ...attestationPath.split('/'));
  fs.writeFileSync(absolute, JSON.stringify(attestation, null, 2) + '\n');
  f.git(['add', '-A']); f.git(['commit', '-qm', 'migration attestation']);
  const sourceHead = f.git(['rev-parse', 'HEAD']);
  const oid = f.git(['rev-parse', 'HEAD:' + attestationPath]);
  return {
    ...f.queue, mode: 'RESUME_DELTA', session_id: uuid(), source_head: sourceHead,
    retry_of_run_id: '34770454986', retry_reason: { code: 'CLARIFICATION', detail: 'certified migration' },
    recovery_migration: {
      attestation_path: attestationPath, attestation_blob_oid: oid, evidence_kind: 'ARTIFACT_HASH',
    },
  };
}

test('une demande cohérente est acceptée, avec ses limites déclarées', () => {
  const f = authFixture();
  const result = A.verify(f.write(f.queue), { cwd: f.dir, github: githubFor(f.planBlob) });
  assert.equal(result.plan_blob_oid, f.planBlob);
  assert.equal(result.evidence_kinds.user_gate, 'ORGANISATIONAL');
  // La limite non démontrable est NOMMÉE, pas passée sous silence.
  assert.ok(result.notes.includes('REVIEW_ACTOR_INDEPENDENCE_NOT_GUARANTEED'));
  // Le pouce levé n'est plus une remarque : il est vérifié, ou l'admission échoue.
  assert.equal(result.notes.some((n) => n.startsWith('GATE_REACTION')), false);
});

test('sans vérification GitHub activée, l’admission est refusée', () => {
  const f = authFixture();
  const avant = process.env.KODJO_VERIFY_GITHUB;
  delete process.env.KODJO_VERIFY_GITHUB;
  try {
    assert.throws(() => A.verify(f.write(f.queue), { cwd: f.dir }), /GITHUB_VERIFICATION_REQUIRED/);
  } finally {
    if (avant !== undefined) process.env.KODJO_VERIFY_GITHUB = avant;
  }
  // Le workflow de production l'active.
  const wf = fs.readFileSync(path.join(root, '.github', 'workflows', 'kodjo-v2-lean-queue.yml'), 'utf8');
  assert.match(wf, /KODJO_VERIFY_GITHUB: '1'/);
});

test('la migration est liée aux empreintes du plan, de la revue et à la validation utilisateur', () => {
  const f = authFixture();
  const queue = bindMigrationAttestation(f);
  const result = A.verify(f.write(queue), { cwd: f.dir, github: githubFor(f.planBlob) });
  assert.equal(result.recovery_migration_blob_oid, queue.recovery_migration.attestation_blob_oid);
});

test('cycle de vie — une attestation antérieure au plan approuvé est refusée avant Claude', () => {
  const f = authFixture();
  const queue = bindMigrationAttestation(f, {
    certified_target_head: f.packageSource,
  });
  assert.throws(
    () => A.verify(f.write(queue), { cwd: f.dir, github: githubFor(f.planBlob) }),
    /RECOVERY_MIGRATION_ATTESTATION_PRE_APPROVAL/
  );
});

test('cycle de vie — l’ancre finale doit porter les blobs exacts du plan et de la revue', () => {
  for (const [file, replacement, diagnostic] of [
    ['technical-plan.md', '# Plan remplacé après approbation\n',
      /RECOVERY_MIGRATION_PLAN_NOT_AT_CERTIFIED_TARGET/],
    ['independent-review.md', '# Revue remplacée après approbation\n',
      /RECOVERY_MIGRATION_REVIEW_NOT_AT_CERTIFIED_TARGET/],
  ]) {
    const f = authFixture();
    const artifactPath = path.join(f.dir, '.github', 'orchestration', 'v2-slices', 'QUALIF', file);
    fs.writeFileSync(artifactPath, replacement);
    f.git(['add', '-A']); f.git(['commit', '-qm', 'artefact remplacé sans nouvelle approbation']);
    f.queue.source_head = f.git(['rev-parse', 'HEAD']);
    const queue = bindMigrationAttestation(f);
    assert.throws(
      () => A.verify(f.write(queue), { cwd: f.dir, github: githubFor(f.planBlob) }),
      diagnostic
    );
  }
});

test('cycle de vie — plan puis revue puis attestation finale liée au blob du plan passent', () => {
  const f = authFixture();
  const queue = bindMigrationAttestation(f);
  assert.notEqual(queue.source_head, f.queue.source_head,
    'le commit d attestation doit suivre le commit qui porte le plan et la revue');
  assert.equal(queue.user_gate.gated_reference, f.planBlob,
    'le gate reste lié au plan immuable malgré le commit final d attestation');
  const result = A.verify(f.write(queue), { cwd: f.dir, github: githubFor(f.planBlob) });
  assert.equal(result.recovery_migration_blob_oid, queue.recovery_migration.attestation_blob_oid);
});

test('VISUAL_CORRECTION — l attestation suit le HEAD applicatif repris, pas le scan historique du plan', () => {
  const planApplicationHead = 'a'.repeat(40);
  const deliveryHead = 'b'.repeat(40);
  const queue = {
    operation_kind: 'VISUAL_CORRECTION',
    delivery_target: { kind: 'EXISTING_PR', application_head: deliveryHead },
    delivery_checkpoint: { application_head: deliveryHead },
  };

  assert.equal(A.resolveAttestedApplicationHead(queue, planApplicationHead), deliveryHead);
  assert.doesNotThrow(() => A.verifyAttestedApplicationHead({
    application_pr_head: deliveryHead,
  }, A.resolveAttestedApplicationHead(queue, planApplicationHead)));

  assert.throws(
    () => A.resolveAttestedApplicationHead({
      ...queue,
      delivery_checkpoint: { application_head: 'c'.repeat(40) },
    }, planApplicationHead),
    /VISUAL_CORRECTION_CHECKPOINT_HEAD_MISMATCH/
  );

  assert.equal(A.resolveAttestedApplicationHead({
    operation_kind: 'IMPLEMENT',
  }, planApplicationHead), planApplicationHead);
});

test('cycle à trois HEAD — le scan suit la révision applicative exacte, jamais source_head', () => {
  const applicationHead = 'a'.repeat(40);
  const planBody = '<KODJO_PLAN_IMPACT_JSON>\n' + JSON.stringify({
    schema: 'kodjo.plan-impact.v1', scan_revision: applicationHead,
  }) + '\n</KODJO_PLAN_IMPACT_JSON>\n';
  assert.equal(A.resolveImpactApplicationHead({
    planning_application_head: applicationHead,
  }, planBody), applicationHead);
  assert.throws(
    () => A.resolveImpactApplicationHead({}, planBody),
    /PLAN_APPLICATION_HEAD_INVALID/
  );
  assert.throws(
    () => A.resolveImpactApplicationHead({
      planning_application_head: 'b'.repeat(40),
    }, planBody),
    /PLAN_APPLICATION_HEAD_MISMATCH/
  );
  assert.doesNotThrow(() => A.verifyAttestedApplicationHead({
    application_pr_head: applicationHead,
  }, applicationHead));
  assert.throws(
    () => A.verifyAttestedApplicationHead({
      application_pr_head: 'b'.repeat(40),
    }, applicationHead),
    /RECOVERY_MIGRATION_APPLICATION_HEAD_MISMATCH/
  );

  const admission = fs.readFileSync(path.join(root, 'scripts', 'kodjo',
    'verify-authorizations.js'), 'utf8');
  assert.match(admission, /sourceHead: applicationHead/);
  assert.doesNotMatch(admission, /sourceHead: queue\.source_head/);
});

test('run 34943819818 — le plan réel passe sur la PR #131 et échoue sur le HEAD protocolaire', (t) => {
  const applicationHead = '3a0dbbe7510f69f702c4b440e25b63b893d2d492';
  const protocolHead = '7e61a9d855dcb3362bb75f44410ac8ae10d63045';
  for (const revision of [applicationHead, protocolHead]) {
    const present = spawnSync('git', ['cat-file', '-e', revision + '^{commit}'], {
      cwd: root, encoding: 'utf8', windowsHide: true,
    });
    if (present.status !== 0) return t.skip('source archive sans historique Git complet');
  }
  const bootstrap = JSON.parse(fs.readFileSync(path.join(root,
    '.github/orchestration/v2-slices/V2-BILAT-01/slice-bootstrap.json'), 'utf8'));
  bootstrap.planning_application_head = applicationHead;
  const planBody = fs.readFileSync(path.join(root,
    '.github/orchestration/v2-slices/V2-BILAT-01/technical-plan.md'), 'utf8');
  const reviewBody = fs.readFileSync(path.join(root,
    '.github/orchestration/v2-slices/V2-BILAT-01/independent-review.md'), 'utf8');
  assert.equal(A.resolveImpactApplicationHead(bootstrap, planBody), applicationHead);
  assert.equal(P.verifyPlanAtRevision({
    cwd: root, sourceHead: applicationHead, planMarkdown: planBody, reviewMarkdown: reviewBody,
  }).replay_scan.scan_revision, applicationHead);
  assert.throws(() => P.verifyPlanAtRevision({
    cwd: root, sourceHead: protocolHead, planMarkdown: planBody, reviewMarkdown: reviewBody,
  }), /PLAN_SCAN_(?:PATH_INVALID|STALE)/);
});

test('admission prospective réelle — les trois HEAD restent distincts avant Claude', (t) => {
  const consumedRequestPath = path.join(root, '.github', 'orchestration', 'queue', 'v2',
    'V2-BILAT-01-resume-final-39cee884.json');
  const attestationPath = '.github/orchestration/v2-slices/V2-BILAT-01/' +
    'recovery-migration-34872653037.json';
  const head = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: root, encoding: 'utf8', windowsHide: true,
  });
  if (head.status !== 0 || !fs.existsSync(consumedRequestPath)) {
    return t.skip('source archive sans historique Git ou demande diagnostique réelle');
  }
  const attestationBlob = spawnSync('git', ['rev-parse', 'HEAD:' + attestationPath], {
    cwd: root, encoding: 'utf8', windowsHide: true,
  });
  if (attestationBlob.status !== 0) return t.skip('attestation finale absente du HEAD qualifié');

  // La demande consommée n'est jamais rejouée : elle sert uniquement de
  // témoin pour construire en mémoire une admission prospective non publiée.
  const prospective = JSON.parse(fs.readFileSync(consumedRequestPath, 'utf8'));
  prospective.request_id = '550e8400-e29b-41d4-a716-446655440107';
  prospective.created_at = '2026-09-15T09:00:00.000Z';
  prospective.source_head = head.stdout.trim();
  prospective.recovery_migration.attestation_blob_oid = attestationBlob.stdout.trim();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-prospective-admission-'));
  const tempRequest = path.join(tempDir, 'prospective-resume-delta.json');
  fs.writeFileSync(tempRequest, JSON.stringify(prospective, null, 2) + '\n');

  const planBlob = prospective.authorized_plan.plan_blob_oid;
  const gateId = Number(prospective.user_gate.gate_ref.split(':')[1]);
  const github = fakeGithub({
    comments: {
      [gateId]: { id: gateId,
        issue_url: 'https://api.github.com/repos/MyUncried/Application-Routine/issues/52',
        body: 'Validation utilisateur du plan immuable ' + planBlob,
        user: { login: 'kodjo-protocol' } },
    },
    reactions: { [gateId]: [{ content: '+1', user: { login: 'MyUncried' } }] },
  });
  const activationRegistry = JSON.parse(fs.readFileSync(
    path.join(root, '.github', 'orchestration', 'v2-activation-registry.json'), 'utf8'));
  const activation = (activationRegistry.activations || []).find((a) => a && a.slice_id === prospective.slice_id);
  if (activation && activation.status !== 'ACTIVE') {
    assert.throws(() => A.verify(tempRequest, { cwd: root, github }), /SLICE_NOT_ACTIVE/);
    return;
  }
  const result = A.verify(tempRequest, { cwd: root, github });
  assert.equal(result.plan_blob_oid, planBlob);
  assert.equal(result.recovery_migration_blob_oid, attestationBlob.stdout.trim());
  assert.notEqual(prospective.source_head,
    JSON.parse(fs.readFileSync(path.join(root, prospective.slice_bootstrap_file), 'utf8'))
      .planning_application_head,
    'le HEAD protocolaire et le HEAD applicatif ne doivent pas être confondus');
});

test('0.6.24 — la migration peut s appuyer sur les autorisations de la demande vérifiées séparément', () => {
  const f = authFixture();
  const queue = bindMigrationAttestation(f, {
    authorization_binding: undefined,
    authorization_policy: 'CURRENT_REQUEST_VERIFIED_SEPARATELY',
  });
  const result = A.verify(f.write(queue), { cwd: f.dir, github: githubFor(f.planBlob) });
  assert.equal(result.recovery_migration_blob_oid, queue.recovery_migration.attestation_blob_oid);
});

test('0.6.24 — une politique d autorisation inconnue ne remplace pas le binding exact', () => {
  const f = authFixture();
  const queue = bindMigrationAttestation(f, {
    authorization_binding: undefined,
    authorization_policy: 'TRUST_ME',
  });
  assert.throws(
    () => A.verify(f.write(queue), { cwd: f.dir, github: githubFor(f.planBlob) }),
    /RECOVERY_MIGRATION_AUTHORIZATION_BINDING_MISMATCH/
  );
});

test('une migration avec plan, revue ou validation incohérents est refusée avant Claude', () => {
  for (const overrides of [
    { authorization_binding: { authorized_plan: null } },
    { authorization_binding: { independent_review: null } },
    { authorization_binding: { user_gate: null } },
  ]) {
    const f = authFixture();
    const queue = bindMigrationAttestation(f, overrides);
    assert.throws(() => A.verify(f.write(queue), { cwd: f.dir, github: githubFor(f.planBlob) }),
      /RECOVERY_MIGRATION_AUTHORIZATION_BINDING_MISMATCH/);
  }
});

test('un pouce levé absent, illisible ou d’un autre compte bloque l’admission', () => {
  const f = authFixture();
  // Absent.
  const sans = githubFor(f.planBlob); sans.state.reactions[12] = [];
  assert.throws(() => A.verify(f.write(f.queue), { cwd: f.dir, github: sans }), /GATE_REACTION_ABSENT/);
  // Posé par un autre compte : le nom du poseur est rapporté.
  const autre = githubFor(f.planBlob);
  autre.state.reactions[12] = [{ content: '+1', user: { login: 'un-autre-compte' } }];
  assert.throws(() => A.verify(f.write(f.queue), { cwd: f.dir, github: autre }),
    /GATE_REACTION_ABSENT.*un-autre-compte/);
  // Illisible.
  const illisible = githubFor(f.planBlob); illisible.state.reactions[12] = null;
  assert.throws(() => A.verify(f.write(f.queue), { cwd: f.dir, github: illisible }), /GATE_REACTION_UNREADABLE/);
  // Un simple cœur ne vaut pas approbation.
  const coeur = githubFor(f.planBlob);
  coeur.state.reactions[12] = [{ content: 'heart', user: { login: 'MyUncried' } }];
  assert.throws(() => A.verify(f.write(f.queue), { cwd: f.dir, github: coeur }), /GATE_REACTION_ABSENT/);
});

test('l’identité de l’utilisateur est obligatoire et contraignante', () => {
  const f = authFixture();
  const sansLogin = { ...f.queue, user_gate: { ...f.queue.user_gate, user_login: undefined } };
  assert.ok(C.validateQueueRequest(sansLogin).some((v) => v.diagnostic === 'KODJO_QUEUE_USER_GATE_REFUSED'));
  const autreUtilisateur = { ...f.queue, user_gate: { ...f.queue.user_gate, user_login: 'inconnu' } };
  const reactionInconnue = githubFor(f.planBlob);
  reactionInconnue.state.reactions[12] = [{ content: '+1', user: { login: 'inconnu' } }];
  assert.throws(() => A.verify(f.write(autreUtilisateur), { cwd: f.dir, github: reactionInconnue }),
    /GATE_USER_NOT_AUTHORIZED/);
});

test('une revue portant sur une autre version du plan est refusée', () => {
  const f = authFixture();
  const q = { ...f.queue,
    independent_review: { ...f.queue.independent_review, reviewed_plan_blob_oid: 'b'.repeat(40) } };
  assert.throws(() => A.verify(f.write(q), { cwd: f.dir, github: githubFor(f.planBlob) }),
    /REVIEW_PLAN_HASH_MISMATCH/);
});

test('la revue est prouvée par le fichier versionné et son empreinte Git', () => {
  const f = authFixture();
  const fausse = { ...f.queue,
    independent_review: { ...f.queue.independent_review, review_blob_oid: 'c'.repeat(40) } };
  assert.throws(() => A.verify(f.write(fausse), { cwd: f.dir, github: githubFor(f.planBlob) }),
    /REVIEW_PATH_MISMATCH/);

  const absente = { ...f.queue,
    independent_review: { ...f.queue.independent_review, review_path: 'docs/inexistante.md' } };
  assert.throws(() => A.verify(f.write(absente), { cwd: f.dir, github: githubFor(f.planBlob) }),
    /REVIEW_PATH_MISMATCH/);

  const malformee = { ...f.queue,
    independent_review: { ...f.queue.independent_review, review_blob_oid: 'PLAN_APPROVED' } };
  assert.throws(() => A.verify(f.write(malformee), { cwd: f.dir, github: githubFor(f.planBlob) }),
    /REVIEW_BLOB_OID_INVALID/);
});

test('le contenu de la revue doit porter le verdict et nommer le plan', () => {
  const f = authFixture();
  const sliceDir = path.join(f.dir, '.github', 'orchestration', 'v2-slices', 'QUALIF');

  // Une revue sans verdict favorable dans son texte ne vaut pas approbation,
  // même si la demande l'affirme.
  fs.writeFileSync(path.join(sliceDir, 'sans-verdict.md'),
    '# Revue\n\n- Plan revu : `technical-plan.md`\n\nRéserves en cours.\n');
  f.git(['add', '-A']); f.git(['commit', '-qm', 'revue sans verdict']);
  let commit = f.git(['rev-parse', 'HEAD']);
  let oid = f.git(['rev-parse', 'HEAD:.github/orchestration/v2-slices/QUALIF/sans-verdict.md']);
  assert.throws(() => A.verify(f.write({ ...f.queue, source_head: commit,
    authorized_plan: { ...f.queue.authorized_plan, approved_at_commit: commit },
    independent_review: { ...f.queue.independent_review,
      review_path: '.github/orchestration/v2-slices/QUALIF/sans-verdict.md', review_blob_oid: oid },
  }), { cwd: f.dir, github: githubFor(f.planBlob) }), /REVIEW_VERDICT_NOT_IN_ARTEFACT/);

  // Une revue qui ne nomme pas le plan approuvé est refusée.
  fs.writeFileSync(path.join(sliceDir, 'autre-plan.md'),
    '# Revue\n\n- Plan revu : `un-autre-document.md`\n\nVerdict : `APPROVED`\n');
  f.git(['add', '-A']); f.git(['commit', '-qm', 'revue d un autre plan']);
  commit = f.git(['rev-parse', 'HEAD']);
  oid = f.git(['rev-parse', 'HEAD:.github/orchestration/v2-slices/QUALIF/autre-plan.md']);
  assert.throws(() => A.verify(f.write({ ...f.queue, source_head: commit,
    authorized_plan: { ...f.queue.authorized_plan, approved_at_commit: commit },
    independent_review: { ...f.queue.independent_review,
      review_path: '.github/orchestration/v2-slices/QUALIF/autre-plan.md', review_blob_oid: oid },
  }), { cwd: f.dir, github: githubFor(f.planBlob) }), /REVIEW_PLAN_NOT_NAMED/);
});

test('une revue déclarant une révision du plan doit l’avoir réellement examinée', () => {
  const f = authFixture();
  const sliceDir = path.join(f.dir, '.github', 'orchestration', 'v2-slices', 'QUALIF');
  fs.writeFileSync(path.join(sliceDir, 'revue-datee.md'),
    '# Revue\n\n- Plan revu : `technical-plan.md`\n'
    + '- Dernière correction du plan : `' + 'f'.repeat(40) + '`\n\nVerdict : `APPROVED`\n');
  f.git(['add', '-A']); f.git(['commit', '-qm', 'revue datée']);
  const commit = f.git(['rev-parse', 'HEAD']);
  const oid = f.git(['rev-parse', 'HEAD:.github/orchestration/v2-slices/QUALIF/revue-datee.md']);
  assert.throws(() => A.verify(f.write({ ...f.queue, source_head: commit,
    authorized_plan: { ...f.queue.authorized_plan, approved_at_commit: commit },
    independent_review: { ...f.queue.independent_review,
      review_path: '.github/orchestration/v2-slices/QUALIF/revue-datee.md', review_blob_oid: oid },
  }), { cwd: f.dir, github: githubFor(f.planBlob) }), /REVIEW_PLAN_REVISION_MISMATCH/);
});

test('un hash de plan qui ne correspond pas au commit approuvé est refusé', () => {
  const f = authFixture();
  const q = { ...f.queue, authorized_plan: { ...f.queue.authorized_plan, plan_blob_oid: 'b'.repeat(40) } };
  assert.throws(() => A.verify(f.write(q), { cwd: f.dir, github: githubFor(f.planBlob) }), /PLAN_PATH_MISMATCH/);
});

test('une validation portant sur une référence étrangère est refusée', () => {
  const f = authFixture();
  const q = { ...f.queue, user_gate: { ...f.queue.user_gate, gated_reference: 'd'.repeat(40) } };
  assert.throws(() => A.verify(f.write(q), { cwd: f.dir, github: githubFor(f.planBlob) }),
    /GATE_REFERENCE_MISMATCH/);
  // Le HEAD exact est en revanche une référence légitime.
  const surHead = { ...f.queue, user_gate: { ...f.queue.user_gate, gated_reference: f.queue.source_head } };
  assert.ok(A.verify(f.write(surHead), { cwd: f.dir, github: githubFor(f.planBlob, f.queue.source_head) }));
});

test('une référence de commentaire de validation malformée est refusée', () => {
  const f = authFixture();
  const q = { ...f.queue, user_gate: { ...f.queue.user_gate, gate_ref: 'PLAN_APPROVED' } };
  assert.throws(() => A.verify(f.write(q), { cwd: f.dir, github: githubFor(f.planBlob) }), /GATE_REF_INVALID/);
});

test('un numéro d’Issue discordant est refusé', () => {
  const f = authFixture();
  assert.throws(() => A.verify(f.write({ ...f.queue, issue_number: 999 }),
    { cwd: f.dir, github: githubFor(f.planBlob) }), /ISSUE_NUMBER_MISMATCH/);
});

test('toutes les demandes de file restent intactes et sans marqueur interne', () => {
  // Décision de revue : le fichier commité n'est pas réécrit. Son obsolescence
  // est enregistrée ailleurs, liée à son blob OID.
  const dir = path.join(root, '.github', 'orchestration', 'queue', 'v2');
  const fichiers = fs.readdirSync(dir).filter((n) => n.endsWith('.json'));
  assert.ok(fichiers.length >= 6);
  for (const nom of fichiers) {
    const q = JSON.parse(fs.readFileSync(path.join(dir, nom), 'utf8'));
    assert.equal('consumed' in q, false, nom + ' : aucun marqueur inséré dans la demande');
    assert.equal(q.schema_version, C.LEAN_REQUEST_SCHEMA, nom);
  }
  assert.equal('consumed' in C.PROPERTIES, false, 'un seul mécanisme d’obsolescence');
});

test('le registre d’obsolescence lie chaque demande à son blob OID', () => {
  const V = require(path.join(root, 'scripts', 'kodjo', 'verify-queue-admission.js'));
  const registre = JSON.parse(fs.readFileSync(
    path.join(root, '.github', 'orchestration', 'queue', 'v2-consumed-registry.json'), 'utf8'));
  const fichiers = new Set(fs.readdirSync(path.join(root, '.github', 'orchestration', 'queue', 'v2'))
    .filter((n) => n.endsWith('.json')));
  assert.ok(registre.entries.length >= 6);
  const chemins = new Set();
  for (const entree of registre.entries) {
    assert.equal(chemins.has(entree.path), false, 'entree dupliquee: ' + entree.path);
    chemins.add(entree.path);
    assert.equal(fichiers.has(path.basename(entree.path)), true, 'demande absente: ' + entree.path);
    assert.match(entree.blob_oid, /^[0-9a-f]{40}$/);
    assert.equal(entree.status, 'OBSOLETE_NON_REPLAYABLE');
    assert.equal(V.blobOid(entree.path, root), entree.blob_oid, entree.path);
  }
});

test('la spécification 0.6.16 supersède explicitement les formulations incompatibles', () => {
  const spec = fs.readFileSync(
    path.join(root, '.github', 'orchestration', 'KODJO_PROTOCOL_V2_SPEC_0.6.16.md'), 'utf8');

  // La version applicable n'est plus annoncée comme 0.6.12.
  assert.doesNotMatch(spec, /les règles courantes sont celles de la version la plus récente du présent document, soit `0\.6\.12`/);
  assert.match(spec, /soit `0\.6\.16`/);

  // L'interdiction générale d'écriture distante est explicitement restreinte.
  assert.match(spec, /Supersédé en 0\.6\.16 — portée restreinte au parcours distant éphémère/);
  assert.match(spec, /NO_UNDECLARED_REMOTE_WRITE_CAPABILITY/);

  // L'interdiction d'activation liée au writer de preuves ne vise plus le lean.
  assert.match(spec, /ACTIVATION DU PARCOURS DISTANT ÉPHÉMÈRE INTERDITE/);
  assert.doesNotMatch(spec, /\*\*ACTIVATION DE V2 INTERDITE\*\*/);

  // La limite de trois workflows est rattachée au seul parcours distant.
  assert.match(spec, /Supersédé en 0\.6\.16\*\* : un quatrième workflow opérationnel existe/);

  // Le parcours réellement exécuté est décrit.
  assert.match(spec, /## PARCOURS-LEAN/);
  for (const ancre of ['PL.2', 'PL.3', 'PL.5', 'PL.6', 'PL.7', 'PL.8', 'PL.9']) {
    assert.ok(spec.includes('### ' + ancre), 'section manquante : ' + ancre);
  }
});


test('le workflow lean isole le checkout du runner persistant', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'kodjo-v2-lean-queue.yml'), 'utf8');
  assert.match(workflow, /working-directory:\s*_kodjo\/\$\{\{ github\.run_id \}\}/);
  assert.match(workflow, /path:\s*_kodjo\/\$\{\{ github\.run_id \}\}/);
});


test('le mode INITIAL neutralise le code de sortie attendu de la sonde de reprise', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'kodjo-v2-lean-queue.yml'), 'utf8');
  assert.match(workflow, /\$global:LASTEXITCODE\s*=\s*0/);
});
