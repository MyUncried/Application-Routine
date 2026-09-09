'use strict';

/**
 * KODJO V2 — matrice de conservation T02 0.6.3, scenarios T02-PRES-001 a 012.
 *
 * 001-008 : matrice normative.
 * 009-012 : corrections MAJOR — conservation durable avant controles, perte du
 *           runner, URL/digest/hash distincts, recu de publication separe.
 * 013-016 : corrections de la revue independante 0.6.4 — depot durable en echec,
 *           depot de secours, repertoire de livraison dans le depot (BLK-01),
 *           reprise ciblee privee des controles repris (MAJ-02).
 *
 * Run: node tests/kodjo/run-all.js
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const H = require('./helpers/sandbox');
const F = require('./helpers/fakes');
const { runPipeline, orderOf, RECOVERY_MEMBERS } = require('./helpers/pipeline');

const APP_PATCHED = 'export const VERSION = 2;\nexport const FIXED = true;\n';
const CHECK_IDS = ['jest', 'typescript', 'lint', 'scope'];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

const recovery = (d) => path.join(d, 'recovery');
const result = (d) => path.join(d, 'result');
const receipt = (d) => path.join(d, 'receipt');

/**
 * Independent oracle: the patch must apply on a virgin space at source_head.
 * `patchDir` defaults to the delivery's recovery package.
 */
function oracleApplies(sandbox, patchDir, head) {
  const space = H.virginSpaceAt(sandbox.dir, head || sandbox.head);
  const patch = path.join(patchDir, 'implementation.patch');
  const check = spawnSync('git', ['apply', '--check', '--binary', patch], {
    cwd: space,
    encoding: 'utf8',
    windowsHide: true,
  });
  const applied =
    check.status === 0
      ? spawnSync('git', ['apply', '--binary', patch], { cwd: space, encoding: 'utf8', windowsHide: true })
      : null;
  return {
    space: space,
    checkStatus: check.status,
    checkStderr: check.stderr,
    appliedStatus: applied ? applied.status : null,
  };
}

function setup(options) {
  const opts = options || {};
  const sandbox = H.createSandbox(opts.sandbox);
  const delivery = path.join(H.tmp('kodjo-delivery-'), 'delivery');
  const fakes = F.fakesDir();
  const counter = path.join(fakes, 'ai-calls.log');
  return { sandbox: sandbox, delivery: delivery, fakes: fakes, counter: counter };
}

/** Green check commands for every check but the one under test. */
function greenChecks(fakes, tag) {
  return {
    KODJO_CHECK_CMD_JEST: F.fakeCheck(fakes, 'jest-ok-' + tag, { exitCode: 0, stdout: F.jestOutput(864, 0) }),
    KODJO_CHECK_CMD_TYPESCRIPT: F.fakeCheck(fakes, 'tsc-ok-' + tag, { exitCode: 0 }),
    KODJO_CHECK_CMD_LINT: F.fakeCheck(fakes, 'lint-ok-' + tag, { exitCode: 0 }),
  };
}

test.after(() => H.cleanupAll());

/* ------------------------------------------------------------------ *
 * T02-PRES-001 — modification produite puis Jest en echec
 * ------------------------------------------------------------------ */
test('T02-PRES-001 — Jest en echec : patch conserve, IMPLEMENTED_WITH_FAILED_CHECKS, run rouge apres upload', () => {
  const ctx = setup();
  const before = H.repoState(ctx.sandbox.dir);

  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    ...greenChecks(ctx.fakes, '001'),
    KODJO_CHECK_CMD_JEST: F.fakeCheck(ctx.fakes, 'jest-fail', { exitCode: 1, stdout: F.jestOutput(862, 2) }),
    KODJO_SCOPE_ALLOW: 'src/**',
  });

  const run = runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env });

  // Paquet de recuperation complet.
  for (const member of RECOVERY_MEMBERS) {
    assert.ok(fs.existsSync(path.join(recovery(ctx.delivery), member)), 'missing recovery member: ' + member);
  }
  for (const c of CHECK_IDS) {
    assert.ok(fs.existsSync(path.join(ctx.delivery, 'checks', c + '.json')), 'missing check result: ' + c);
  }

  // Patch applicable sur un espace vierge au source_head.
  const oracle = oracleApplies(ctx.sandbox, recovery(ctx.delivery));
  assert.equal(oracle.checkStatus, 0, 'git apply --check failed: ' + oracle.checkStderr);
  assert.equal(oracle.appliedStatus, 0);
  assert.equal(fs.readFileSync(path.join(oracle.space, 'src/app.ts'), 'utf8'), APP_PATCHED);

  const manifest = readJson(path.join(result(ctx.delivery), 'manifest.json'));
  assert.equal(manifest.implementation_status, 'IMPLEMENTED_WITH_FAILED_CHECKS');
  assert.deepEqual(manifest.failed_checks, ['jest']);
  assert.deepEqual(manifest.not_run_checks, []);
  assert.equal(manifest.passed_tests, 862);
  assert.equal(manifest.failed_tests, 2);
  assert.equal(manifest.recovery, 'TARGETED_FIX');
  assert.equal(manifest.functional_continuation, 'ALLOWED');
  assert.equal(
    manifest.patch_sha256,
    sha256(fs.readFileSync(path.join(recovery(ctx.delivery), 'implementation.patch')))
  );

  // La conservation precede chaque controle, et l'artefact etait deja televerse.
  for (const id of CHECK_IDS) {
    assert.equal(run.byId[id].patch_before.present, true, id + ' ran before preservation');
    assert.equal(run.byId[id].patch_before.sha256, manifest.patch_sha256);
    assert.equal(run.byId[id].recovery_uploaded_before, true, id + ' ran before the recovery upload');
  }
  assert.ok(orderOf(run, 'preserve') < orderOf(run, 'jest'));
  assert.ok(orderOf(run, 'recovery_upload') < orderOf(run, 'jest'));

  // Run rouge, mais seulement apres les deux uploads et la publication.
  assert.equal(run.byId.exit_status.status, 1);
  assert.ok(orderOf(run, 'recovery_upload') < orderOf(run, 'exit_status'));
  assert.ok(orderOf(run, 'result_upload') < orderOf(run, 'exit_status'));
  assert.ok(orderOf(run, 'publish') < orderOf(run, 'exit_status'));

  // Aucun commit, aucune ref, aucun push cote depot.
  const after = H.repoState(ctx.sandbox.dir);
  assert.equal(after.head, before.head);
  assert.equal(after.refs, before.refs);
});

/* ------------------------------------------------------------------ *
 * T02-PRES-002 — TypeScript en echec
 * ------------------------------------------------------------------ */
test('T02-PRES-002 — TypeScript en echec : failed_checks contient uniquement typescript', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    ...greenChecks(ctx.fakes, '002'),
    KODJO_CHECK_CMD_TYPESCRIPT: F.fakeCheck(ctx.fakes, 'tsc-fail', {
      exitCode: 2,
      stdout: "src/app.ts(2,14): error TS2322: Type 'boolean' is not assignable.\n",
    }),
    KODJO_SCOPE_ALLOW: 'src/**',
  });

  const run = runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env });
  const manifest = readJson(path.join(result(ctx.delivery), 'manifest.json'));

  assert.equal(manifest.implementation_status, 'IMPLEMENTED_WITH_FAILED_CHECKS');
  assert.deepEqual(manifest.failed_checks, ['typescript']);
  assert.deepEqual(manifest.not_run_checks, []);
  assert.equal(manifest.checks.jest.status, 'PASS');
  assert.equal(manifest.checks.typescript.exit_code, 2);
  assert.equal(manifest.passed_tests, 864);
  assert.equal(manifest.failed_tests, 0);

  assert.equal(oracleApplies(ctx.sandbox, recovery(ctx.delivery)).checkStatus, 0);
  assert.equal(run.byId.exit_status.status, 1);
});

/* ------------------------------------------------------------------ *
 * T02-PRES-003 — controle de perimetre en echec
 * ------------------------------------------------------------------ */
test('T02-PRES-003 — scope en echec : delta integral conserve, integration bloquee, aucun commit', () => {
  const ctx = setup();
  const before = H.repoState(ctx.sandbox.dir);

  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [
      { path: 'src/app.ts', content: APP_PATCHED },
      { path: 'README.md', content: '# sandbox\n\nhors perimetre\n' },
    ]),
    ...greenChecks(ctx.fakes, '003'),
    KODJO_SCOPE_ALLOW: 'src/**',
  });

  const run = runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env });
  const manifest = readJson(path.join(result(ctx.delivery), 'manifest.json'));
  const modified = readJson(path.join(recovery(ctx.delivery), 'modified-files.json'));

  assert.deepEqual(manifest.failed_checks, ['scope']);
  assert.equal(manifest.implementation_status, 'IMPLEMENTED_WITH_FAILED_CHECKS');

  // Le delta integral, y compris le fichier hors perimetre, reste conserve.
  assert.deepEqual(modified.files.map((f) => f.path).sort(), ['README.md', 'src/app.ts']);
  const scopeResult = readJson(path.join(ctx.delivery, 'checks', 'scope.json'));
  assert.equal(scopeResult.status, 'FAIL');
  assert.match(scopeResult.log_excerpt, /SCOPE_VIOLATION/);
  assert.match(scopeResult.log_excerpt, /README\.md/);

  const oracle = oracleApplies(ctx.sandbox, recovery(ctx.delivery));
  assert.equal(oracle.checkStatus, 0);
  assert.equal(fs.readFileSync(path.join(oracle.space, 'README.md'), 'utf8'), '# sandbox\n\nhors perimetre\n');

  const after = H.repoState(ctx.sandbox.dir);
  assert.equal(after.head, before.head);
  assert.equal(after.refs, before.refs);
  assert.equal(after.reflog, before.reflog);
  assert.equal(run.byId.exit_status.status, 1);
});

/* ------------------------------------------------------------------ *
 * T02-PRES-004 — nouveau fichier non suivi, restaure bit a bit
 * ------------------------------------------------------------------ */
test('T02-PRES-004 — fichier non suivi : present dans le patch et restaure bit a bit', () => {
  const ctx = setup();
  const binary = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0x0d, 0x0a, 0x00, 0x7f, 0x80]);
  const newText = 'export const NOUVEAU = "cree par l agent";\r\nligne 2\n';

  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [
      { path: 'src/nouveau.ts', content: newText },
      { path: 'assets/blob.bin', base64: binary.toString('base64') },
      { path: 'src/util.ts', content: null },
    ]),
    ...greenChecks(ctx.fakes, '004'),
    KODJO_SCOPE_ALLOW: 'src/**,assets/**',
  });

  const run = runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env });
  const modified = readJson(path.join(recovery(ctx.delivery), 'modified-files.json'));
  const manifest = readJson(path.join(result(ctx.delivery), 'manifest.json'));

  const byPath = {};
  for (const f of modified.files) byPath[f.path] = f;

  assert.ok(byPath['src/nouveau.ts'], 'new untracked file missing from modified-files.json');
  assert.equal(byPath['src/nouveau.ts'].tracked, false);
  assert.equal(byPath['src/nouveau.ts'].git_status, 'A');
  assert.ok(byPath['assets/blob.bin'], 'new untracked binary missing from modified-files.json');
  assert.equal(byPath['assets/blob.bin'].tracked, false);
  assert.equal(byPath['src/util.ts'].git_status, 'D');
  assert.equal(byPath['src/util.ts'].tracked, true);
  assert.equal(manifest.untracked_file_count, 2);

  const patchText = fs.readFileSync(path.join(recovery(ctx.delivery), 'implementation.patch'), 'utf8');
  assert.match(patchText, /b\/src\/nouveau\.ts/);
  assert.match(patchText, /b\/assets\/blob\.bin/);
  assert.match(patchText, /GIT binary patch/);

  const oracle = oracleApplies(ctx.sandbox, recovery(ctx.delivery));
  assert.equal(oracle.checkStatus, 0, oracle.checkStderr);
  assert.equal(oracle.appliedStatus, 0);
  assert.equal(
    sha256(fs.readFileSync(path.join(oracle.space, 'src/nouveau.ts'))),
    byPath['src/nouveau.ts'].content_sha256
  );
  assert.deepEqual(fs.readFileSync(path.join(oracle.space, 'assets/blob.bin')), binary);
  assert.equal(fs.existsSync(path.join(oracle.space, 'src/util.ts')), false);

  const validation = readJson(path.join(recovery(ctx.delivery), 'validation.json'));
  assert.equal(validation.valid, true);
  assert.equal(validation.file_hash_mismatches.length, 0);
  assert.equal(validation.file_hash_matches, 2);
  assert.equal(manifest.implementation_status, 'IMPLEMENTED_AND_VERIFIED');
  assert.equal(run.byId.exit_status.status, 0);
});

/* ------------------------------------------------------------------ *
 * T02-PRES-005 — publication du commentaire en echec
 * ------------------------------------------------------------------ */
test('T02-PRES-005 — commentaire indisponible : artefact accessible, receipt FAILED, republication sans IA', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    ...greenChecks(ctx.fakes, '005'),
    KODJO_SCOPE_ALLOW: 'src/**',
    ...F.failingPublisher(),
  });

  const run = runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env });
  const callsAfterRun = H.aiCallCount(ctx.counter);

  const publication = readJson(path.join(receipt(ctx.delivery), 'publication-receipt.json'));
  assert.equal(publication.status, 'FAILED');
  assert.equal(publication.recovery, 'REPUBLISH_EXISTING');
  assert.equal(publication.ai_call_made, false);
  assert.equal(publication.recovery_artifact_still_available, true);

  const manifest = readJson(path.join(result(ctx.delivery), 'manifest.json'));
  assert.equal(manifest.implementation_status, 'IMPLEMENTED_AND_VERIFIED');

  // Les uploads ont eu lieu et l'artefact de recuperation reste complet.
  assert.equal(run.byId.recovery_upload.status, 0);
  assert.equal(run.byId.publish.status, 0, 'publication must not break the job');
  const stored = path.join(run.artifacts.recovery.dir);
  for (const member of RECOVERY_MEMBERS) {
    assert.ok(fs.existsSync(path.join(stored, member)), 'artifact member lost: ' + member);
  }
  assert.equal(oracleApplies(ctx.sandbox, stored).checkStatus, 0);

  // REPUBLISH_EXISTING : rejoue la publication sans aucun appel IA ni regeneration.
  const bodyBefore = fs.readFileSync(path.join(result(ctx.delivery), 'implementation-output.txt'), 'utf8');
  const record = path.join(ctx.fakes, 'published.txt');
  const republish = H.runScript('publish-implementation-output.js', [ctx.delivery, '--republish'], {
    env: { ...env, ...F.recordingPublisher(record) },
  });
  assert.equal(republish.status, 0);
  const publication2 = readJson(path.join(receipt(ctx.delivery), 'publication-receipt.json'));
  assert.equal(publication2.status, 'CONFIRMED');
  assert.equal(publication2.republish, true);
  assert.equal(publication2.ai_call_made, false);
  assert.equal(H.aiCallCount(ctx.counter), callsAfterRun, 'republication must not trigger a new AI call');
  assert.equal(fs.readFileSync(path.join(result(ctx.delivery), 'implementation-output.txt'), 'utf8'), bodyBefore);
  assert.match(fs.readFileSync(record, 'utf8'), /\[KODJO_SLICE\] IMPLEMENTATION_OUTPUT/);
});

/* ------------------------------------------------------------------ *
 * T02-PRES-006 — reprise TARGETED_FIX cumulative
 * ------------------------------------------------------------------ */
test('T02-PRES-006 — TARGETED_FIX : reprise depuis l artefact de recuperation, controles cibles, cumulatif', () => {
  const ctx = setup();

  // --- Run 1 : implementation avec Jest en echec -------------------
  const env1 = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [
      { path: 'src/app.ts', content: 'export const VERSION = 2;\n' },
      { path: 'src/nouveau.ts', content: 'export const AJOUT = 1;\n' },
    ]),
    ...greenChecks(ctx.fakes, '006'),
    KODJO_CHECK_CMD_JEST: F.fakeCheck(ctx.fakes, 'jest-fail6', { exitCode: 1, stdout: F.jestOutput(862, 2) }),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  const run1 = runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env1 });
  const manifest1 = readJson(path.join(result(ctx.delivery), 'manifest.json'));
  assert.equal(manifest1.implementation_status, 'IMPLEMENTED_WITH_FAILED_CHECKS');
  assert.deepEqual(manifest1.failed_checks, ['jest']);
  assert.equal(run1.byId.exit_status.status, 1);
  const callsAfterRun1 = H.aiCallCount(ctx.counter);

  // La reprise part de l'ARTEFACT DE RECUPERATION du run source, pas du worktree.
  const sourceRecovery = run1.artifacts.recovery.dir;
  const sourceResult = run1.artifacts.result.dir;

  // --- Espace de controle propre au source_head initial -------------
  const controlDir = H.tmp('kodjo-control-');
  const clone = path.join(controlDir, 'repo');
  H.rawGitOrThrow(['clone', '--quiet', ctx.sandbox.dir.replace(/\\/g, '/'), clone.replace(/\\/g, '/')], controlDir);
  H.rawGitOrThrow(['-c', 'advice.detachedHead=false', 'checkout', '--quiet', ctx.sandbox.head], clone);
  assert.equal(H.rawGitOrThrow(['rev-parse', 'HEAD'], clone).stdout.trim(), ctx.sandbox.head);
  const controlBefore = H.repoState(clone);

  // (1) verifie le paquet de recuperation, (2) restaure le patch.
  const restore = H.runScript('restore-source-artifact.js', [sourceRecovery, clone], {
    env: { ...env1, KODJO_REPO_DIR: clone, KODJO_SOURCE_ARTIFACT_SHA256: manifest1.patch_sha256 },
  });
  assert.equal(restore.status, 0, restore.stderr);
  assert.equal(fs.readFileSync(path.join(clone, 'src/app.ts'), 'utf8'), 'export const VERSION = 2;\n');
  assert.equal(fs.existsSync(path.join(clone, 'src/nouveau.ts')), true);
  const recoverySource = readJson(path.join(sourceRecovery, 'recovery-source.json'));
  assert.equal(recoverySource.source_patch_sha256, manifest1.patch_sha256);
  assert.equal(recoverySource.ai_call_made, false);

  // (4) seuls les controles echoues et directement impactes sont relances.
  const plan = H.runScript('resolve-checks-to-run.js', ['jest'], {
    env: { KODJO_MODE: 'TARGETED_FIX', KODJO_CARRIED_CHECKS_DIR: path.join(sourceResult, 'checks') },
  });
  const toRerun = plan.stdout.trim().split('\n');
  assert.deepEqual(toRerun.sort(), ['jest', 'scope']);

  // (3) correction bornee, (5) nouvel artefact cumulatif depuis le source_head initial.
  const delivery2 = path.join(H.tmp('kodjo-delivery2-'), 'delivery');
  const env2 = H.baseEnv({ dir: clone, head: ctx.sandbox.head }, delivery2, {
    KODJO_MODE: 'TARGETED_FIX',
    KODJO_SOURCE_RUN_ID: '1001',
    KODJO_RECOVERY_OF_RUN_ID: '1000',
    KODJO_ATTEMPT_ID: 'attempt-2',
    KODJO_CARRIED_CHECKS_DIR: path.join(sourceResult, 'checks'),
    KODJO_FAILED_CHECKS: 'jest',
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }], { name: 'fix' }),
    KODJO_CHECK_CMD_JEST: F.fakeCheck(ctx.fakes, 'jest-ok6b', { exitCode: 0, stdout: F.jestOutput(864, 0) }),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  const run2 = runPipeline({
    sandbox: { dir: clone, head: ctx.sandbox.head },
    deliveryDir: delivery2,
    env: env2,
    checks: toRerun,
  });

  const manifest2 = readJson(path.join(result(delivery2), 'manifest.json'));
  assert.equal(manifest2.mode, 'TARGETED_FIX');
  assert.equal(manifest2.cumulative, true);
  assert.equal(manifest2.recovery_of_run_id, '1000');
  assert.equal(manifest2.base_source_head, ctx.sandbox.head);
  assert.equal(manifest2.implementation_status, 'IMPLEMENTED_AND_VERIFIED');
  assert.equal(run2.byId.exit_status.status, 0);

  // Les controles non relances sont repris de l'artefact de resultat source.
  assert.equal(manifest2.checks.typescript.rerun_in_this_attempt, false);
  assert.equal(manifest2.checks.typescript.carried_from_run_id, '1000');
  assert.equal(manifest2.checks.lint.rerun_in_this_attempt, false);
  assert.equal(manifest2.checks.jest.rerun_in_this_attempt, true);
  assert.equal(manifest2.checks.jest.status, 'PASS');

  // (6) cumulativite : applicable sur le HEAD initial, contenant les deux runs.
  const oracle = oracleApplies({ dir: clone }, recovery(delivery2), ctx.sandbox.head);
  assert.equal(oracle.checkStatus, 0, oracle.checkStderr);
  assert.equal(oracle.appliedStatus, 0);
  assert.equal(fs.readFileSync(path.join(oracle.space, 'src/app.ts'), 'utf8'), APP_PATCHED);
  assert.equal(fs.readFileSync(path.join(oracle.space, 'src/nouveau.ts'), 'utf8'), 'export const AJOUT = 1;\n');

  assert.equal(H.aiCallCount(ctx.counter), callsAfterRun1 + 1);

  const controlAfter = H.repoState(clone);
  assert.equal(controlAfter.head, controlBefore.head);
  assert.equal(controlAfter.refs, controlBefore.refs);
});

/* ------------------------------------------------------------------ *
 * T02-PRES-007 — preservation / validation du patch en echec
 * ------------------------------------------------------------------ */
test('T02-PRES-007 — patch invalide : IMPLEMENTATION_FAILED explicite, aucun faux statut implemente', () => {
  // (a) octets alteres : le hash ne correspond plus.
  const ctxA = setup();
  const envA = H.baseEnv(ctxA.sandbox, ctxA.delivery, {
    ...F.testAdapter(ctxA.fakes, ctxA.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  assert.equal(H.runScript('run-implementation-agent.js', [ctxA.delivery], { env: envA }).status, 0);
  assert.equal(H.runScript('preserve-implementation.js', [ctxA.delivery], { env: envA }).status, 0);
  fs.appendFileSync(path.join(recovery(ctxA.delivery), 'implementation.patch'), 'CORRUPTION\n');
  const verifyA = H.runScript('verify-delivery.js', [ctxA.delivery], { env: envA });
  assert.notEqual(verifyA.status, 0);
  assert.match(verifyA.stderr, /PATCH_HASH_MISMATCH/);
  H.runScript('finalize-implementation-delivery.js', [ctxA.delivery], { env: envA });
  const manifestA = readJson(path.join(result(ctxA.delivery), 'manifest.json'));
  assert.equal(manifestA.implementation_status, 'IMPLEMENTATION_FAILED');
  assert.equal(manifestA.preservation.patch_validated, false);
  assert.equal(manifestA.preservation.status, 'FAILED');
  const exitA = H.runScript('exit-from-business-status.js', [path.join(result(ctxA.delivery), 'manifest.json')], {
    env: envA,
  });
  assert.equal(exitA.status, 3);

  // (b) patch coherent en hash mais inapplicable au source_head.
  const ctxB = setup();
  const envB = H.baseEnv(ctxB.sandbox, ctxB.delivery, {
    ...F.testAdapter(ctxB.fakes, ctxB.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  assert.equal(H.runScript('run-implementation-agent.js', [ctxB.delivery], { env: envB }).status, 0);
  assert.equal(H.runScript('preserve-implementation.js', [ctxB.delivery], { env: envB }).status, 0);
  const patchB = path.join(recovery(ctxB.delivery), 'implementation.patch');
  const brokenB = fs
    .readFileSync(patchB, 'utf8')
    .replace(/^index [0-9a-f]+\.\.[0-9a-f]+/m, 'index dead0000..beef0000')
    .replace('export const VERSION = 1;', 'export const INEXISTANT = 1;');
  fs.writeFileSync(patchB, brokenB, 'utf8');
  const newSha = sha256(fs.readFileSync(patchB));
  fs.writeFileSync(path.join(recovery(ctxB.delivery), 'implementation.patch.sha256'), newSha + '  implementation.patch\n');
  const mB = readJson(path.join(recovery(ctxB.delivery), 'manifest.json'));
  mB.patch_sha256 = newSha;
  fs.writeFileSync(path.join(recovery(ctxB.delivery), 'manifest.json'), JSON.stringify(mB, null, 2) + '\n');

  const verifyB = H.runScript('verify-delivery.js', [ctxB.delivery], { env: envB });
  assert.notEqual(verifyB.status, 0);
  assert.match(verifyB.stderr, /APPLY_CHECK_FAILED|RESTORE_FAILED|RESTORED_CONTENT_HASH_MISMATCH/);
  H.runScript('finalize-implementation-delivery.js', [ctxB.delivery], { env: envB });
  const manifestB = readJson(path.join(result(ctxB.delivery), 'manifest.json'));
  assert.equal(manifestB.implementation_status, 'IMPLEMENTATION_FAILED');
  assert.ok(manifestB.status_reasons.join(' ').length > 0, 'an explicit diagnostic is required');
  assert.equal(readJson(path.join(result(ctxB.delivery), 'summary.json')).patch_validated, false);

  // (c) preservation impossible : source_head inconnu, aucun manifeste produit.
  const ctxC = setup();
  const envC = H.baseEnv(ctxC.sandbox, ctxC.delivery, {
    KODJO_SOURCE_HEAD: '0123456789abcdef0123456789abcdef01234567',
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  const preserveC = H.runScript('preserve-implementation.js', [ctxC.delivery], { env: envC });
  assert.equal(preserveC.status, 3);
  assert.match(preserveC.stderr, /PRESERVATION_FAILED/);
  H.runScript('finalize-implementation-delivery.js', [ctxC.delivery], { env: envC });
  const manifestC = readJson(path.join(result(ctxC.delivery), 'manifest.json'));
  assert.equal(manifestC.implementation_status, 'IMPLEMENTATION_FAILED');
  const exitC = H.runScript('exit-from-business-status.js', [path.join(result(ctxC.delivery), 'manifest.json')], {
    env: envC,
  });
  assert.equal(exitC.status, 3);
});

/* ------------------------------------------------------------------ *
 * T02-PRES-008 — tentative distante de commit / push / ecriture de ref
 * ------------------------------------------------------------------ */
test('T02-PRES-008 — ecriture fonctionnelle distante refusee avant effet', () => {
  const ctx = setup();
  const { git, GitGuardError } = require(path.join(H.SCRIPTS, 'lib', 'git.js'));
  const before = H.repoState(ctx.sandbox.dir);

  const attempts = [
    ['commit', '-m', 'remote commit'],
    ['push', 'origin', 'HEAD'],
    ['tag', 'v-remote'],
    ['update-ref', 'refs/heads/remote-attempt', 'HEAD'],
    ['branch', 'remote-attempt'],
    ['checkout', '-b', 'remote-attempt'],
    ['merge', 'main'],
    ['remote', 'add', 'evil', 'https://example.invalid/x.git'],
    ['fetch', 'origin'],
  ];
  for (const args of attempts) {
    assert.throws(
      () => git(args, { cwd: ctx.sandbox.dir }),
      (err) => err instanceof GitGuardError && err.code === 'FUNCTIONAL_REF_WRITE_FORBIDDEN',
      'git ' + args[0] + ' must be refused'
    );
  }
  assert.throws(
    () => git(['reflog', 'expire', '--all'], { cwd: ctx.sandbox.dir }),
    (err) => err.code === 'FUNCTIONAL_REF_WRITE_FORBIDDEN'
  );

  const after = H.repoState(ctx.sandbox.dir);
  assert.equal(after.head, before.head);
  assert.equal(after.refs, before.refs);
  assert.equal(after.reflog, before.reflog);
  assert.equal(after.status, before.status);

  assert.throws(
    () => git(['add', '-A'], { cwd: ctx.sandbox.dir }),
    (err) => err.code === 'FUNCTIONAL_INDEX_WRITE_FORBIDDEN'
  );
  assert.throws(
    () => git(['apply', '--index', 'x.patch'], { cwd: ctx.sandbox.dir }),
    (err) => err.code === 'FUNCTIONAL_INDEX_WRITE_FORBIDDEN'
  );
  assert.throws(
    () => git(['config', 'user.name', 'x'], { cwd: ctx.sandbox.dir }),
    (err) => err.code === 'GIT_CONFIG_WRITE_FORBIDDEN'
  );

  const scan = H.runScript('scan-remote-write-capability.js', [H.REPO_ROOT], {});
  assert.equal(scan.status, 0, scan.stderr);
  assert.match(scan.stdout, /NO_REMOTE_FUNCTIONAL_WRITE_CAPABILITY/);

  const { parse } = require(path.join(H.SCRIPTS, 'lib', 'yaml.js'));
  const wfPath = path.join(H.REPO_ROOT, '.github', 'workflows', 'kodjo-v2-implementation-artifact.yml');
  const wf = parse(fs.readFileSync(wfPath, 'utf8'));
  assert.equal(wf.permissions.contents, 'read');
  const checkout = wf.jobs.implementation.steps.find((s) => String(s.uses || '').startsWith('actions/checkout'));
  assert.equal(checkout.with['persist-credentials'], false);

  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    ...greenChecks(ctx.fakes, '008'),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env });
  const afterPipeline = H.repoState(ctx.sandbox.dir);
  assert.equal(afterPipeline.head, before.head);
  assert.equal(afterPipeline.refs, before.refs);
  assert.equal(afterPipeline.reflog, before.reflog);
});

/* ------------------------------------------------------------------ *
 * T02-PRES-009 — artefact de recuperation televerse avant tout controle
 * ------------------------------------------------------------------ */
test('T02-PRES-009 — l artefact de recuperation est televerse avant Jest, TypeScript, lint et scope', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    ...greenChecks(ctx.fakes, '009'),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  const run = runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env });

  // Ordre effectif observe a l'execution.
  const uploadIdx = orderOf(run, 'recovery_upload');
  assert.ok(uploadIdx >= 0);
  for (const id of CHECK_IDS) {
    assert.ok(orderOf(run, id) > uploadIdx, id + ' must run after the recovery upload');
    assert.equal(run.byId[id].recovery_uploaded_before, true);
  }
  assert.ok(uploadIdx > orderOf(run, 'preserve'));
  assert.ok(uploadIdx > orderOf(run, 'patch_check'));
  assert.ok(uploadIdx < orderOf(run, 'summarize'));
  assert.ok(uploadIdx < orderOf(run, 'result_upload'));

  // Le paquet televerse contient le noyau immuable et rien de calcule apres.
  assert.deepEqual(run.byId.recovery_upload.uploaded_paths.sort(), RECOVERY_MEMBERS.concat(['validation.json']).sort());
  const uploadedManifest = readJson(path.join(run.artifacts.recovery.dir, 'manifest.json'));
  assert.equal(uploadedManifest.status_finalized, false);
  assert.equal(uploadedManifest.implementation_status, null);
  assert.ok(!('checks' in uploadedManifest), 'the uploaded package must not claim check results');
  assert.ok(!('failed_checks' in uploadedManifest));
  assert.ok(!('publication' in uploadedManifest));
  assert.equal(uploadedManifest.preservation.patch_validated, true);

  // Ordre structurel declare dans le workflow reel.
  const validate = H.runScript('validate-workflows.js', [H.REPO_ROOT], {});
  assert.equal(validate.status, 0, validate.stderr);

  const { parse } = require(path.join(H.SCRIPTS, 'lib', 'yaml.js'));
  const wfPath = path.join(H.REPO_ROOT, '.github', 'workflows', 'kodjo-v2-implementation-artifact.yml');
  const steps = parse(fs.readFileSync(wfPath, 'utf8')).jobs.implementation.steps;
  const idx = (id) => steps.findIndex((s) => s.id === id);
  assert.ok(idx('recovery_upload') > idx('patch_check'));
  for (const id of CHECK_IDS) assert.ok(idx(id) > idx('recovery_upload'), 'workflow: ' + id + ' before upload');
  assert.match(String(steps[idx('recovery_upload')].uses), /^actions\/upload-artifact/);
  assert.equal(steps[idx('recovery_upload')].with['if-no-files-found'], 'error');
  assert.match(String(steps[idx('recovery_upload')].with.path), /delivery\/recovery/);
  // L'artefact de resultat ne re-televerse pas le paquet immuable.
  assert.ok(!/delivery\/recovery/.test(String(steps[idx('result_upload')].with.path)));
});

/* ------------------------------------------------------------------ *
 * T02-PRES-010 — perte du runner apres le televersement de recuperation
 * ------------------------------------------------------------------ */
test('T02-PRES-010 — perte du runner apres l upload : le delta reste integralement recuperable', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [
      { path: 'src/app.ts', content: APP_PATCHED },
      { path: 'src/nouveau.ts', content: 'export const AJOUT = 1;\n' },
    ]),
    KODJO_SCOPE_ALLOW: 'src/**',
  });

  const run = runPipeline({
    sandbox: ctx.sandbox,
    deliveryDir: ctx.delivery,
    env: env,
    stopAfterRecoveryUpload: true,
  });
  assert.equal(run.interrupted, true);
  assert.equal(run.byId.recovery_upload.status, 0);

  // Aucun controle, aucune synthese, aucune publication n'a eu lieu.
  for (const id of CHECK_IDS.concat(['summarize', 'result_upload', 'publish', 'exit_status'])) {
    assert.equal(orderOf(run, id), -1, id + ' must not have run');
  }
  assert.equal(fs.existsSync(path.join(result(ctx.delivery), 'manifest.json')), false);

  // Le workspace du runner disparait : seul l'artefact subsiste.
  const stored = run.artifacts.recovery.dir;
  fs.rmSync(ctx.delivery, { recursive: true, force: true });
  assert.equal(fs.existsSync(ctx.delivery), false);

  for (const member of RECOVERY_MEMBERS) {
    assert.ok(fs.existsSync(path.join(stored, member)), 'lost after runner failure: ' + member);
  }
  const manifest = readJson(path.join(stored, 'manifest.json'));
  const modified = readJson(path.join(stored, 'modified-files.json'));
  assert.equal(manifest.patch_sha256, sha256(fs.readFileSync(path.join(stored, 'implementation.patch'))));
  assert.equal(manifest.preservation.patch_validated, true);

  // Restauration integrale depuis le seul artefact.
  const oracle = oracleApplies(ctx.sandbox, stored);
  assert.equal(oracle.checkStatus, 0, oracle.checkStderr);
  assert.equal(oracle.appliedStatus, 0);
  assert.equal(fs.readFileSync(path.join(oracle.space, 'src/app.ts'), 'utf8'), APP_PATCHED);
  assert.equal(fs.readFileSync(path.join(oracle.space, 'src/nouveau.ts'), 'utf8'), 'export const AJOUT = 1;\n');
  for (const f of modified.files) {
    if (f.git_status === 'D') continue;
    assert.equal(sha256(fs.readFileSync(path.join(oracle.space, f.path))), f.content_sha256, f.path);
  }
});

/* ------------------------------------------------------------------ *
 * T02-PRES-011 — URL, digest et hash du patch sont trois valeurs distinctes
 * ------------------------------------------------------------------ */
test('T02-PRES-011 — le commentaire distingue URL d artefact, digest GitHub et sha256 du patch', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    ...greenChecks(ctx.fakes, '011'),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  const run = runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env });

  const outputs = run.byId.recovery_upload.outputs;
  const manifest = readJson(path.join(result(ctx.delivery), 'manifest.json'));
  const comment = fs.readFileSync(path.join(result(ctx.delivery), 'implementation-output.txt'), 'utf8');

  const field = (name) => {
    const m = new RegExp('^' + name + '=(.*)$', 'm').exec(comment);
    return m ? m[1] : null;
  };

  // Les trois champs exiges, renseignes et distincts.
  assert.equal(field('artifact'), outputs['artifact-url']);
  assert.match(field('artifact'), /^https:\/\/github\.com\//);
  assert.equal(field('artifact_digest'), outputs['artifact-digest']);
  assert.equal(field('patch_sha256'), manifest.patch_sha256);
  assert.notEqual(field('artifact_digest'), field('patch_sha256'), 'digest and patch hash must differ');
  assert.notEqual(field('artifact'), field('artifact_digest'));
  assert.equal(field('artifact_name'), run.names.recovery);

  // Le hash du patch est bien celui du fichier, pas celui de l'artefact.
  assert.equal(
    field('patch_sha256'),
    sha256(fs.readFileSync(path.join(recovery(ctx.delivery), 'implementation.patch')))
  );
  assert.equal(manifest.recovery_artifact.url, outputs['artifact-url']);
  assert.equal(manifest.recovery_artifact.digest, outputs['artifact-digest']);
  assert.equal(manifest.recovery_artifact.uploaded_before_checks, true);

  // Sans upload reussi, aucune URL n'est inventee.
  const delivery2 = path.join(H.tmp('kodjo-nourl-'), 'delivery');
  const env2 = H.baseEnv(ctx.sandbox, delivery2, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }], { name: 'nourl' }),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  H.runScript('run-implementation-agent.js', [delivery2], { env: env2 });
  H.runScript('preserve-implementation.js', [delivery2], { env: env2 });
  H.runScript('verify-delivery.js', [delivery2], { env: env2 });
  H.runScript('finalize-implementation-delivery.js', [delivery2], { env: env2 });
  const comment2 = fs.readFileSync(path.join(result(delivery2), 'implementation-output.txt'), 'utf8');
  assert.match(comment2, /^artifact=$/m, 'no artifact URL must be fabricated when no upload happened');
  assert.match(comment2, /^artifact_digest=$/m);
  assert.doesNotMatch(comment2, /^patch_sha256=$/m, 'the patch hash is always known');
});

/* ------------------------------------------------------------------ *
 * T02-PRES-012 — recu de publication separe
 * ------------------------------------------------------------------ */
test('T02-PRES-012 — le statut de publication vit dans un recu separe, jamais dans l artefact deja televerse', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    ...greenChecks(ctx.fakes, '012'),
    KODJO_SCOPE_ALLOW: 'src/**',
    ...F.failingPublisher(),
  });
  const run = runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env });

  // Le recu existe, dans son propre artefact, apres la tentative.
  const receiptFile = path.join(receipt(ctx.delivery), 'publication-receipt.json');
  assert.ok(fs.existsSync(receiptFile));
  const rec = readJson(receiptFile);
  assert.ok(['CONFIRMED', 'FAILED', 'SKIPPED'].includes(rec.status), 'unexpected receipt status ' + rec.status);
  assert.equal(rec.status, 'FAILED');
  assert.ok(orderOf(run, 'receipt_upload') > orderOf(run, 'publish'));
  assert.ok(orderOf(run, 'exit_status') > orderOf(run, 'receipt_upload'));
  assert.equal(run.byId.receipt_upload.status, 0);
  assert.ok(fs.existsSync(path.join(run.artifacts.receipt.dir, 'publication-receipt.json')));

  // Le paquet de recuperation deja televerse ne contient aucun statut de publication.
  const stored = run.artifacts.recovery.dir;
  assert.equal(fs.existsSync(path.join(stored, 'publication.json')), false);
  assert.equal(fs.existsSync(path.join(stored, 'publication-receipt.json')), false);
  const uploadedManifest = readJson(path.join(stored, 'manifest.json'));
  assert.ok(!('publication' in uploadedManifest));
  assert.equal(uploadedManifest.status_finalized, false);

  // Cas SKIPPED : aucune cible configuree.
  const delivery2 = path.join(H.tmp('kodjo-skip-'), 'delivery');
  const env2 = H.baseEnv(ctx.sandbox, delivery2, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }], { name: 'skip' }),
    KODJO_SCOPE_ALLOW: 'src/**',
    KODJO_PUBLISH_CMD: '',
    KODJO_ISSUE_NUMBER: '',
  });
  runPipeline({ sandbox: ctx.sandbox, deliveryDir: delivery2, env: env2, checks: ['scope'] });
  const rec2 = readJson(path.join(receipt(delivery2), 'publication-receipt.json'));
  assert.equal(rec2.status, 'SKIPPED');
  assert.equal(rec2.reason, 'NO_PUBLICATION_TARGET_CONFIGURED');
});

/* ------------------------------------------------------------------ *
 * T02-PRES-013 — le depot durable echoue : aucun faux statut recuperable
 * ------------------------------------------------------------------ */
test('T02-PRES-013 — depot de recuperation impossible : IMPLEMENTATION_FAILED, aucune promesse de reprise', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    ...greenChecks(ctx.fakes, '013'),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  const run = runPipeline({
    sandbox: ctx.sandbox,
    deliveryDir: ctx.delivery,
    env: env,
    failRecoveryUpload: true,
    failRecoveryRetry: true,
  });

  // Le patch a bien ete produit et valide localement...
  const preserved = readJson(path.join(recovery(ctx.delivery), 'manifest.json'));
  assert.equal(preserved.has_changes, true);
  assert.equal(preserved.preservation.patch_validated, true);

  // ... mais il n'a jamais ete depose : il n'est donc PAS recuperable.
  const manifest = readJson(path.join(result(ctx.delivery), 'manifest.json'));
  assert.equal(manifest.implementation_status, 'IMPLEMENTATION_FAILED');
  assert.equal(manifest.recovery_artifact.uploaded_before_checks, false);
  assert.equal(manifest.recovery_artifact.url, null);
  assert.equal(manifest.recovery_artifact.digest, null);
  assert.equal(manifest.recovery, 'REIMPLEMENT');
  assert.ok(
    manifest.status_reasons.some((r) => r.includes('RECOVERY_NOT_DURABLE')),
    'the diagnosis must name the missing durable deposit'
  );

  // Aucun controle n'a pu demarrer, et aucun n'est compte comme reussi.
  for (const id of CHECK_IDS) assert.equal(run.byId[id].status, 'SKIPPED');
  assert.deepEqual(manifest.failed_checks, []);

  // Le commentaire n'annonce aucune URL d'artefact ni aucune reprise ciblee.
  const comment = fs.readFileSync(path.join(result(ctx.delivery), 'implementation-output.txt'), 'utf8');
  assert.match(comment, /status=IMPLEMENTATION_FAILED/);
  assert.match(comment, /recovery_artifact_uploaded=false/);
  assert.match(comment, /^artifact=$/m);
  assert.ok(!/recovery=TARGETED_FIX/.test(comment));

  // Le run est rouge avec le code du statut metier, apres la synthese.
  assert.equal(run.byId.exit_status.status, 3);
  assert.match(run.byId.exit_status.stdout + run.byId.exit_status.stderr, /NO recovery artifact was durably deposited/);
});

/* ------------------------------------------------------------------ *
 * T02-PRES-014 — le depot de secours sauve la conservation
 * ------------------------------------------------------------------ */
test('T02-PRES-014 — premier depot en echec, depot de secours reussi : le delta reste recuperable', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    ...greenChecks(ctx.fakes, '014'),
    KODJO_CHECK_CMD_JEST: F.fakeCheck(ctx.fakes, 'jest-fail14', { exitCode: 1, stdout: F.jestOutput(862, 2) }),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  const run = runPipeline({
    sandbox: ctx.sandbox,
    deliveryDir: ctx.delivery,
    env: env,
    failRecoveryUpload: true,
  });

  assert.equal(run.byId.recovery_upload.status, 1);
  assert.equal(run.byId.recovery_upload_retry.status, 0);
  // Les controles ont bien tourne : le depot de secours les debloque.
  for (const id of CHECK_IDS) assert.notEqual(run.byId[id].status, 'SKIPPED');

  const manifest = readJson(path.join(result(ctx.delivery), 'manifest.json'));
  assert.equal(manifest.implementation_status, 'IMPLEMENTED_WITH_FAILED_CHECKS');
  assert.equal(manifest.recovery_artifact.uploaded_before_checks, true);
  assert.equal(manifest.recovery_artifact.fallback_used, true);
  assert.equal(manifest.recovery_artifact.upload_outcome, 'failure');
  assert.ok(String(manifest.recovery_artifact.url).startsWith('https://github.com/'));
  assert.equal(run.byId.exit_status.status, 1);

  // Le patch depose est bien applicable sur un espace vierge au source_head.
  const oracle = oracleApplies(ctx.sandbox, run.artifacts.recoveryRetry.dir, ctx.sandbox.head);
  assert.equal(oracle.checkStatus, 0, oracle.checkStderr);
});

/* ------------------------------------------------------------------ *
 * T02-PRES-015 — BLK-01 : une implantation dans le depot est REFUSEE
 * ------------------------------------------------------------------ */
test('T02-PRES-015 — repertoire de livraison DANS le depot : refus bruyant, jamais une exclusion silencieuse', () => {
  const ctx = setup();
  // Disposition invalide : delivery/ a la racine de la copie de travail.
  const delivery = path.join(ctx.sandbox.dir, 'delivery');
  const env = H.baseEnv(ctx.sandbox, delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    ...greenChecks(ctx.fakes, '015'),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  const run = runPipeline({ sandbox: ctx.sandbox, deliveryDir: delivery, env: env });

  // La preservation refuse AVANT de produire quoi que ce soit.
  assert.equal(run.byId.preserve.status, 3);
  assert.match(run.byId.preserve.stderr, /DELIVERY_LOCATION_INVALID/);
  assert.equal(fs.existsSync(path.join(recovery(delivery), 'implementation.patch')), false);

  // Aucun statut ne peut annoncer un travail recuperable.
  const manifest = readJson(path.join(result(delivery), 'manifest.json'));
  assert.equal(manifest.implementation_status, 'IMPLEMENTATION_FAILED');
  assert.equal(run.byId.exit_status.status, 3);

  // Un repertoire de telechargement dans le depot est refuse de la meme facon.
  const outside = path.join(H.tmp('kodjo-out-'), 'delivery');
  const env2 = H.baseEnv(ctx.sandbox, outside, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }], { name: 'dl' }),
    KODJO_SOURCE_RESULT_DIR: path.join(ctx.sandbox.dir, 'source-result'),
  });
  const refused = H.runScript('preserve-implementation.js', [outside], { env: env2 });
  assert.equal(refused.status, 3);
  assert.match(refused.stderr, /DELIVERY_LOCATION_INVALID/);
});

/* ------------------------------------------------------------------ *
 * T02-PRES-017 — implantation nominale hors depot : delta purement fonctionnel
 * ------------------------------------------------------------------ */
test('T02-PRES-017 — implantation hors depot : le delta ne contient que la modification fonctionnelle', () => {
  const ctx = setup();
  // Disposition reelle du workflow : tout le technique vit hors de la copie.
  assert.ok(
    !ctx.delivery.startsWith(ctx.sandbox.dir + path.sep),
    'le harnais doit utiliser la meme implantation que le workflow'
  );
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    ...greenChecks(ctx.fakes, '017'),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  const run = runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env });

  const modified = readJson(path.join(recovery(ctx.delivery), 'modified-files.json'));
  const paths = modified.files.map((f) => f.path).sort();
  assert.deepEqual(paths, ['src/app.ts'], 'only the functional change belongs to the delta');

  const scope = readJson(path.join(ctx.delivery, 'checks', 'scope.json'));
  assert.equal(scope.status, 'PASS');
  const manifest = readJson(path.join(result(ctx.delivery), 'manifest.json'));
  assert.equal(manifest.implementation_status, 'IMPLEMENTED_AND_VERIFIED');
  assert.equal(run.byId.exit_status.status, 0);

  // La restauration n'injecte aucun repertoire de protocole dans /Dev.
  const oracle = oracleApplies(ctx.sandbox, recovery(ctx.delivery), ctx.sandbox.head);
  assert.equal(oracle.checkStatus, 0, oracle.checkStderr);
  assert.equal(oracle.appliedStatus, 0);
  for (const d of ['delivery', 'source-recovery', 'source-result']) {
    assert.equal(fs.existsSync(path.join(oracle.space, d)), false, d + ' must not be restored');
  }
});

/* ------------------------------------------------------------------ *
 * T02-PRES-016 — MAJ-02 : une reprise sans controles repris relance tout
 * ------------------------------------------------------------------ */
test('T02-PRES-016 — TARGETED_FIX sans artefact de resultat source : tous les controles requis sont relances', () => {
  // Sans controles repris, la selection ciblee laisserait typescript et lint en
  // NOT_RUN indefiniment : IMPLEMENTED_AND_VERIFIED deviendrait inatteignable.
  const missing = H.runScript('resolve-checks-to-run.js', ['jest'], {
    env: { KODJO_MODE: 'TARGETED_FIX', KODJO_CARRIED_CHECKS_DIR: path.join(H.tmp('kodjo-absent-'), 'checks') },
  });
  assert.equal(missing.status, 0);
  assert.deepEqual(missing.stdout.trim().split('\n').sort(), ['jest', 'lint', 'scope', 'typescript']);
  assert.match(missing.stderr, /CARRIED_CHECKS_UNAVAILABLE/);

  // Un repertoire present mais vide compte comme absent.
  const empty = path.join(H.tmp('kodjo-empty-'), 'checks');
  fs.mkdirSync(empty, { recursive: true });
  const emptyRun = H.runScript('resolve-checks-to-run.js', ['jest'], {
    env: { KODJO_MODE: 'TARGETED_FIX', KODJO_CARRIED_CHECKS_DIR: empty },
  });
  assert.deepEqual(emptyRun.stdout.trim().split('\n').sort(), ['jest', 'lint', 'scope', 'typescript']);

  // Avec les controles repris, la selection reste bornee.
  fs.writeFileSync(path.join(empty, 'typescript.json'), '{"check":"typescript","status":"PASS"}');
  const carried = H.runScript('resolve-checks-to-run.js', ['jest'], {
    env: { KODJO_MODE: 'TARGETED_FIX', KODJO_CARRIED_CHECKS_DIR: empty },
  });
  assert.deepEqual(carried.stdout.trim().split('\n').sort(), ['jest', 'scope']);
});

/* ------------------------------------------------------------------ *
 * T02-PRES-018 — clôture MAJ-03 : demande de dépôt sur la branche de preuves
 * ------------------------------------------------------------------ */
test('T02-PRES-018 — l artefact reste un transport : la preuve durable est demandee au writer separe', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    ...greenChecks(ctx.fakes, '018'),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env });

  const request = readJson(path.join(result(ctx.delivery), 'evidence-deposit-request.json'));

  // Branche fixe : le writer ne recoit AUCUN nom de branche en entree.
  assert.equal(request.target_branch, 'kodjo/protocol-evidence-v2');
  assert.equal(request.target_repository, 'MyUncried/Application-Routine-KODJO-Evidence');
  assert.equal(request.target_repository_is_fixed, true);
  assert.equal(request.target_branch_is_fixed, true);

  // Append-only, aucune preuve existante modifiee ou supprimee.
  assert.equal(request.append_only, true);
  assert.equal(request.replaces_existing_path, false);

  // Aucun fichier applicatif integre ; le patch reste transport et preuve.
  assert.equal(request.contains_applicative_file, false);
  assert.equal(request.functional_ref_write_allowed, false);
  const patchMember = request.members.find((m) => m.member === 'implementation.patch');
  assert.equal(patchMember.role, 'TRANSPORT_AND_EVIDENCE');

  // Le job d implementation decrit, il ne depose pas.
  assert.equal(request.produced_by, 'IMPLEMENTATION_JOB_READ_ONLY');
  assert.equal(request.deposited_by, 'SEPARATE_EVIDENCE_WRITER');
  assert.equal(request.writer_status, 'PENDING');
  assert.equal(request.diagnostic, 'EVIDENCE_WRITER_ABSENT');

  // Chemins canoniques uniques, derives de la seule identite protocolaire.
  const paths = request.members.map((m) => m.canonical_path);
  assert.equal(new Set(paths).size, paths.length);
  for (const p of paths) assert.ok(p.startsWith('slices/'), p);

  // Chaque membre porte son hash reel.
  for (const m of request.members) {
    const abs = path.join(recovery(ctx.delivery), m.member);
    assert.equal(m.sha256, sha256(fs.readFileSync(abs)), m.member);
  }

  // Le workflow d implementation reste en lecture seule a tous les niveaux.
  const { parse } = require(path.join(H.SCRIPTS, 'lib', 'yaml.js'));
  const doc = parse(
    fs.readFileSync(path.join(H.REPO_ROOT, '.github', 'workflows', 'kodjo-v2-implementation-artifact.yml'), 'utf8')
  );
  assert.equal(doc.permissions.contents, 'read');
  for (const job of Object.values(doc.jobs)) {
    const perms = (job || {}).permissions || {};
    assert.ok(!perms.contents || perms.contents === 'read');
  }

  // Aucun statut recuperable ne peut se passer de cette demande.
  const manifest = readJson(path.join(result(ctx.delivery), 'manifest.json'));
  assert.equal(manifest.implementation_status, 'IMPLEMENTED_AND_VERIFIED');
});
