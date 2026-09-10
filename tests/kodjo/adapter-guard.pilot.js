'use strict';

/**
 * Encadrement de l'adaptateur d'implementation — KODJO V2 §1.2-A, §4.1, §10.2.
 *
 * Deux exigences :
 *   1. aucune commande arbitraire n'est executee (elle echapperait au garde
 *      lib/git.js et pourrait creer un commit) ;
 *   2. une mutation de HEAD, des refs, du reflog ou de l'index par l'adaptateur
 *      est detectee et bloque la suite fonctionnelle, sans detruire le delta.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const H = require('./helpers/sandbox');
const F = require('./helpers/fakes');
const { runPipeline } = require('./helpers/pipeline');

const APP_PATCHED = 'export const VERSION = 2;\nexport const FIXED = true;\n';
const { resolveAdapter, ADAPTERS } = require(path.join(H.SCRIPTS, 'run-implementation-agent.js'));

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const recovery = (d) => path.join(d, 'recovery');
const result = (d) => path.join(d, 'result');

function setup() {
  const sandbox = H.createSandbox();
  const delivery = path.join(H.tmp('kodjo-adapter-'), 'delivery');
  const fakes = F.fakesDir();
  return { sandbox, delivery, fakes, counter: path.join(fakes, 'ai-calls.log') };
}

test.after(() => H.cleanupAll());

test('preflight — un chemin technique dans le depot bloque avant tout appel agent', () => {
  const ctx = setup();
  const invalidDelivery = path.join(ctx.sandbox.dir, 'delivery');
  const env = H.baseEnv(ctx.sandbox, invalidDelivery, {
    KODJO_DELIVERY_DIR: invalidDelivery,
    KODJO_SOURCE_RECOVERY_DIR: path.join(ctx.fakes, 'source-recovery'),
    KODJO_SOURCE_RESULT_DIR: path.join(ctx.fakes, 'source-result'),
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
  });

  const preflight = H.runScript('validate-orchestration-paths.js', [], { env: env });
  assert.equal(preflight.status, 3);
  assert.match(preflight.stderr, /DELIVERY_LOCATION_INVALID/);

  // Le workflow place ce preflight avant l'adaptateur : sur refus, celui-ci
  // n'est pas invoque et aucune modification applicative n'est produite.
  assert.equal(fs.existsSync(ctx.counter), false);
  assert.equal(fs.readFileSync(path.join(ctx.sandbox.dir, 'src', 'app.ts'), 'utf8'), 'export const VERSION = 1;\n');
});

test('preflight — la racine exacte du depot est elle aussi refusee', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.sandbox.dir, {
    KODJO_DELIVERY_DIR: ctx.sandbox.dir,
    KODJO_SOURCE_RECOVERY_DIR: path.join(ctx.fakes, 'source-recovery'),
    KODJO_SOURCE_RESULT_DIR: path.join(ctx.fakes, 'source-result'),
  });
  const preflight = H.runScript('validate-orchestration-paths.js', [], { env: env });
  assert.equal(preflight.status, 3);
  assert.match(preflight.stderr, /inside or equal/);
});

test('adaptateur — une commande arbitraire est refusee, jamais executee', () => {
  const ctx = setup();
  const marker = path.join(ctx.fakes, 'executed.txt');
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    // Une commande qui, si elle etait executee, laisserait une trace.
    KODJO_AGENT_CMD: JSON.stringify(process.execPath) + ' -e ' + JSON.stringify('require("fs").writeFileSync(' + JSON.stringify(marker) + ',"x")'),
  });

  const res = H.runScript('run-implementation-agent.js', [ctx.delivery], { env: env });
  assert.equal(res.status, 78);
  assert.match(res.stderr, /AGENT_COMMAND_NOT_ALLOWED/);
  assert.equal(fs.existsSync(marker), false, 'the arbitrary command must never be executed');
});

test('adaptateur — seuls les identifiants du registre sont acceptes', () => {
  assert.deepEqual(Object.keys(ADAPTERS), ['none']);
  assert.equal(resolveAdapter('none', {}).test, false);
  assert.ok(resolveAdapter('none', {}).script.endsWith(path.join('adapters', 'no-remote-agent.js')));
  assert.ok(fs.existsSync(resolveAdapter('none', {}).script), 'the registered adapter script must exist');

  for (const bad of ['claude', 'sh -c ls', '../../evil', 'node']) {
    assert.throws(
      () => resolveAdapter(bad, {}),
      (err) => err.code === 'AGENT_ADAPTER_NOT_ALLOWED',
      'adapter "' + bad + '" must be refused'
    );
  }
});

test('adaptateur — les adaptateurs de test exigent un drapeau explicite et restent confines', () => {
  assert.throws(
    () => resolveAdapter('test:mutating-agent', {}),
    (err) => err.code === 'TEST_ADAPTER_NOT_ENABLED'
  );
  const ok = resolveAdapter('test:mutating-agent', { KODJO_ALLOW_TEST_ADAPTER: '1' });
  assert.equal(ok.test, true);
  assert.ok(ok.script.includes(path.join('tests', 'kodjo', 'adapters')));

  for (const bad of ['test:../../scripts/kodjo/check-scope', 'test:a/b', 'test:']) {
    assert.throws(
      () => resolveAdapter(bad, { KODJO_ALLOW_TEST_ADAPTER: '1' }),
      (err) => ['TEST_ADAPTER_NAME_INVALID', 'TEST_ADAPTER_PATH_ESCAPE', 'TEST_ADAPTER_NOT_FOUND'].includes(err.code),
      'test adapter "' + bad + '" must be refused'
    );
  }
});

test('adaptateur — le registre de production ne fournit aucun agent distant (NON_VERIFIABLE)', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, { KODJO_AGENT_ADAPTER: 'none' });
  const res = H.runScript('run-implementation-agent.js', [ctx.delivery], { env: env });
  assert.equal(res.status, 78);
  assert.match(res.stderr, /NO_AGENT_ADAPTER_CONFIGURED/);
  assert.match(res.stderr, /NON_VERIFIABLE/);
  const record = readJson(path.join(ctx.delivery, 'adapter.json'));
  assert.equal(record.status, 'NO_ADAPTER');
  assert.equal(record.shell, false);
  assert.equal(record.adapter, 'none');
});

test('controles — un remplacement de commande est ignore sans le drapeau de test', () => {
  const ctx = setup();
  fs.mkdirSync(path.join(ctx.delivery, 'checks'), { recursive: true });
  const marker = path.join(ctx.fakes, 'check-executed.txt');
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    KODJO_ALLOW_TEST_ADAPTER: '',
    KODJO_CHECK_CMD_LINT:
      JSON.stringify(process.execPath) + ' -e ' + JSON.stringify('require("fs").writeFileSync(' + JSON.stringify(marker) + ',"x")'),
  });
  const res = H.runScript('run-check.js', ['lint', path.join(ctx.delivery, 'checks', 'lint.json')], { env: env });
  assert.equal(res.status, 0);
  assert.match(res.stderr, /CHECK_COMMAND_OVERRIDE_IGNORED/);
  assert.equal(fs.existsSync(marker), false, 'the overridden command must not be executed');
  const out = readJson(path.join(ctx.delivery, 'checks', 'lint.json'));
  assert.equal(out.command, 'npm run lint --silent', 'the repository command must be used');
});

test('garde git — un etat intact est constate avant et apres l adaptateur', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
  });
  assert.equal(H.runScript('git-state-guard.js', ['capture', ctx.delivery, 'before'], { env: env }).status, 0);
  assert.equal(H.runScript('run-implementation-agent.js', [ctx.delivery], { env: env }).status, 0);
  const verify = H.runScript('git-state-guard.js', ['verify', ctx.delivery], { env: env });
  assert.equal(verify.status, 0, verify.stderr);
  const state = readJson(path.join(ctx.delivery, 'integrity', 'git-state.json'));
  assert.equal(state.status, 'INTACT');
  assert.equal(state.functional_continuation, 'ALLOWED');
  assert.deepEqual(state.differences, []);
});

test('garde git — une mutation de HEAD/refs/reflog par l adaptateur est detectee et bloque la suite', () => {
  const ctx = setup();
  const before = H.repoState(ctx.sandbox.dir);

  // Adaptateur hostile : il appelle git lui-meme, contournant lib/git.js.
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }], {
      name: 'hostile',
      gitAttempt: ['commit', '-a', '-m', 'commit distant interdit'],
    }),
    ...(() => ({
      KODJO_CHECK_CMD_JEST: F.fakeCheck(ctx.fakes, 'jest-ok-h', { exitCode: 0, stdout: F.jestOutput(864, 0) }),
      KODJO_CHECK_CMD_TYPESCRIPT: F.fakeCheck(ctx.fakes, 'tsc-ok-h', { exitCode: 0 }),
      KODJO_CHECK_CMD_LINT: F.fakeCheck(ctx.fakes, 'lint-ok-h', { exitCode: 0 }),
    }))(),
    KODJO_SCOPE_ALLOW: 'src/**',
  });

  const run = runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env });

  // Le commit hostile a bien eu lieu : le garde ne l'empeche pas, il le detecte.
  const after = H.repoState(ctx.sandbox.dir);
  assert.notEqual(after.head, before.head, 'the hostile adapter was expected to commit');

  // Detection.
  assert.equal(run.byId.git_state_after.status, 4);
  assert.match(run.byId.git_state_after.stderr, /GIT_STATE_MUTATED/);
  const state = readJson(path.join(ctx.delivery, 'integrity', 'git-state.json'));
  assert.equal(state.status, 'MUTATED');
  assert.equal(state.functional_continuation, 'BLOCKED');
  const fields = state.differences.map((d) => d.field);
  assert.ok(fields.includes('head'), 'HEAD mutation must be reported');
  assert.ok(fields.includes('refs') || fields.includes('reflog'), 'ref/reflog mutation must be reported');

  // La suite fonctionnelle est bloquee...
  const manifest = readJson(path.join(result(ctx.delivery), 'manifest.json'));
  assert.equal(manifest.functional_continuation, 'BLOCKED');
  assert.equal(manifest.integrity.git_state, 'MUTATED');
  assert.equal(run.byId.exit_status.status, 4);
  assert.match(run.byId.exit_status.stderr, /FUNCTIONAL_CONTINUATION_BLOCKED/);
  const comment = fs.readFileSync(path.join(result(ctx.delivery), 'implementation-output.txt'), 'utf8');
  assert.match(comment, /^functional_continuation=BLOCKED$/m);

  // ...mais le verdict d'integrite voyage dans le paquet immuable...
  const uploaded = readJson(path.join(run.artifacts.recovery.dir, 'manifest.json'));
  assert.equal(uploaded.integrity.git_state, 'MUTATED');
  assert.equal(uploaded.integrity.functional_continuation, 'BLOCKED');

  // ...et le delta reste conserve et recuperable.
  assert.ok(fs.existsSync(path.join(recovery(ctx.delivery), 'implementation.patch')));
  assert.equal(run.byId.recovery_upload.status, 0);
  assert.ok(manifest.has_changes, 'the produced delta must still be preserved');
});

test('garde git — une mutation de l index seul est detectee', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }], {
      name: 'index-only',
      gitAttempt: ['add', '-A'],
    }),
  });
  assert.equal(H.runScript('git-state-guard.js', ['capture', ctx.delivery, 'before'], { env: env }).status, 0);
  H.runScript('run-implementation-agent.js', [ctx.delivery], { env: env });
  const verify = H.runScript('git-state-guard.js', ['verify', ctx.delivery], { env: env });
  assert.equal(verify.status, 4);
  const state = readJson(path.join(ctx.delivery, 'integrity', 'git-state.json'));
  assert.equal(state.status, 'MUTATED');
  assert.deepEqual(
    state.differences.map((d) => d.field),
    ['index']
  );

  // Le delta reste conservable malgre la violation.
  assert.equal(H.runScript('preserve-implementation.js', [ctx.delivery], { env: env }).status, 0);
  const manifest = readJson(path.join(recovery(ctx.delivery), 'manifest.json'));
  assert.equal(manifest.has_changes, true);
  assert.equal(manifest.integrity.git_state, 'MUTATED');
});

test('garde git — une absence de baseline bloque la suite fonctionnelle', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {});
  const verify = H.runScript('git-state-guard.js', ['verify', ctx.delivery], { env: env });
  assert.equal(verify.status, 3);
  assert.match(verify.stderr, /GIT_STATE_BASELINE_MISSING/);
  const state = readJson(path.join(ctx.delivery, 'integrity', 'git-state.json'));
  assert.equal(state.functional_continuation, 'BLOCKED');
});

/* ------------------------------------------------------------------ *
 * MIN-01 — contrat de clarification de l'adaptateur (exit 75)
 * ------------------------------------------------------------------ */
test('adaptateur — une ambiguite fonctionnelle (exit 75) donne CLARIFICATION_REQUIRED sans perdre le delta', () => {
  const ctx = setup();
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    // L'adaptateur modifie un fichier PUIS s'arrete sur une ambiguite.
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }], {
      name: 'clarify',
      exitCode: 75,
    }),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  const run = runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env, checks: ['scope'] });

  const adapter = readJson(path.join(ctx.delivery, 'adapter.json'));
  assert.equal(adapter.exit_code, 75);
  assert.equal(adapter.status, 'CLARIFICATION_REQUIRED');

  // Le delta produit avant l'arret est conserve et depose, comme tout delta.
  const preserved = readJson(path.join(recovery(ctx.delivery), 'manifest.json'));
  assert.equal(preserved.has_changes, true);
  assert.equal(preserved.agent_reported_status, 'CLARIFICATION_REQUIRED');
  assert.equal(run.byId.recovery_upload.status, 0);

  const manifest = readJson(path.join(result(ctx.delivery), 'manifest.json'));
  assert.equal(manifest.implementation_status, 'CLARIFICATION_REQUIRED');
  assert.equal(manifest.recovery, 'CLARIFICATION');
  assert.equal(run.byId.exit_status.status, 2);
});

/* ------------------------------------------------------------------ *
 * MIN-06 — selection declaree, refus des derivations non declarees
 * ------------------------------------------------------------------ */
test('validation — selection par type declare et refus d une derivation non declaree', () => {
  const { parse } = require(path.join(H.SCRIPTS, 'lib', 'yaml.js'));
  const V = require(path.join(H.SCRIPTS, 'validate-workflows.js'));
  const wf = path.join(H.REPO_ROOT, '.github', 'workflows', 'kodjo-v2-implementation-artifact.yml');
  const doc = parse(fs.readFileSync(wf, 'utf8'));

  // Selection par type declare, independante du nom de fichier.
  assert.equal(V.declaredKind(doc), 'IMPLEMENTATION');
  assert.equal(V.isImplementationWorkflow(doc), true);

  // Une copie qui retire la declaration reste reconnue structurellement
  // et est refusee comme derivation non declaree.
  const undeclared = JSON.parse(JSON.stringify(doc));
  delete undeclared.env.KODJO_WORKFLOW_KIND;
  assert.equal(V.declaredKind(undeclared), null);
  assert.equal(V.looksLikeImplementation(undeclared), true);

  // Un workflow ordinaire n'est ni declare ni structurellement suspect :
  // aucun faux positif.
  const ordinary = { jobs: { build: { steps: [{ id: 'compile', run: 'make' }] } } };
  assert.equal(V.declaredKind(ordinary), null);
  assert.equal(V.looksLikeImplementation(ordinary), false);

  // Un depot de secours absent est refuse.
  const broken = JSON.parse(JSON.stringify(doc));
  broken.jobs.implementation.steps = broken.jobs.implementation.steps.filter(
    (st) => st.id !== 'recovery_upload_retry'
  );
  const errors = [];
  V.validateImplementationWorkflow(broken, H.REPO_ROOT, errors);
  assert.ok(errors.some((e) => e.includes('recovery_upload_retry')), JSON.stringify(errors));

  // Un chemin d artefact relatif au depot est refuse (BLK-01).
  const leaky = JSON.parse(JSON.stringify(doc));
  leaky.jobs.implementation.steps = leaky.jobs.implementation.steps.map((st) =>
    String(st.uses || '').startsWith('actions/download-artifact')
      ? { ...st, with: { ...(st.with || {}), path: 'agent-scratch' } }
      : st
  );
  const errors2 = [];
  V.validateImplementationWorkflow(leaky, H.REPO_ROOT, errors2);
  assert.ok(
    errors2.some((e) => e.includes('agent-scratch') && e.includes('repo-relative')),
    JSON.stringify(errors2)
  );

  // Une implantation figee dans l env du workflow est refusee.
  const fixed = JSON.parse(JSON.stringify(doc));
  fixed.env.KODJO_DELIVERY_DIR = 'delivery';
  const errors3 = [];
  V.validateImplementationWorkflow(fixed, H.REPO_ROOT, errors3);
  assert.ok(errors3.some((e) => e.includes('KODJO_DELIVERY_DIR')), JSON.stringify(errors3));

  // Le preflight executable est obligatoire et doit suivre immediatement la
  // resolution des chemins, donc preceder restauration et adaptateur.
  const noPreflight = JSON.parse(JSON.stringify(doc));
  noPreflight.jobs.implementation.steps = noPreflight.jobs.implementation.steps.filter(
    (st) => st.id !== 'orchestration_preflight'
  );
  const errors4 = [];
  V.validateImplementationWorkflow(noPreflight, H.REPO_ROOT, errors4);
  assert.ok(errors4.some((e) => e.includes('orchestration_preflight')), JSON.stringify(errors4));
});

/* ------------------------------------------------------------------ *
 * MIN-01 — le contrat structure prime sur le code de sortie
 * ------------------------------------------------------------------ */
test('adaptateur — un statut structure declare prime sur la liaison par code de sortie', () => {
  const ctx = setup();
  fs.mkdirSync(ctx.delivery, { recursive: true });
  fs.writeFileSync(
    path.join(ctx.delivery, 'adapter-status.json'),
    JSON.stringify({ status: 'CLARIFICATION_REQUIRED', question_id: 'Q-1', question: 'Quel format ?' })
  );
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    // exitCode 0 : sans le fichier, le statut serait COMPLETED.
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }], { name: 'declared' }),
    KODJO_SCOPE_ALLOW: 'src/**',
  });
  const run = runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env, checks: ['scope'] });

  const adapter = readJson(path.join(ctx.delivery, 'adapter.json'));
  assert.equal(adapter.status, 'CLARIFICATION_REQUIRED');
  assert.equal(adapter.status_origin, 'ADAPTER_STATUS_FILE');
  assert.equal(adapter.exit_code, 0);

  const manifest = readJson(path.join(result(ctx.delivery), 'manifest.json'));
  assert.equal(manifest.implementation_status, 'CLARIFICATION_REQUIRED');
  assert.equal(run.byId.exit_status.status, 2);
  // Le delta produit avant l arret reste conserve et depose.
  assert.equal(run.byId.recovery_upload.status, 0);
  assert.equal(readJson(path.join(recovery(ctx.delivery), 'manifest.json')).has_changes, true);
});
