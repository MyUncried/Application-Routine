'use strict';

/**
 * Unit tests of the pilot invariants (KODJO V2 §5.2-A, §6.13-B, §6.13-C).
 * These do not touch the application and require no node_modules.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const H = require('./helpers/sandbox');
const { computeStatus, STATUSES, EXIT_CODES, RECOVERY } = require(path.join(H.SCRIPTS, 'lib', 'status.js'));
const {
  resolveChecksToRerun,
  parseJestCounts,
  classifyLaunchFailure,
  commandFor,
  REQUIRED_CHECKS,
} = require(path.join(H.SCRIPTS, 'lib', 'checks.js'));
const { parse, YamlError } = require(path.join(H.SCRIPTS, 'lib', 'yaml.js'));

const ALL_PASS = REQUIRED_CHECKS.map((c) => ({ check: c, status: 'PASS' }));

test('status — un patch conserve et tous les controles verts donnent IMPLEMENTED_AND_VERIFIED', () => {
  const r = computeStatus({ hasChanges: true, patchValidated: true, checks: ALL_PASS, requiredChecks: REQUIRED_CHECKS });
  assert.equal(r.status, STATUSES.VERIFIED);
  assert.deepEqual(r.failed_checks, []);
});

test('status — un controle en echec ne retrograde jamais une conservation valide', () => {
  for (const failing of REQUIRED_CHECKS) {
    const checks = REQUIRED_CHECKS.map((c) => ({ check: c, status: c === failing ? 'FAIL' : 'PASS' }));
    const r = computeStatus({ hasChanges: true, patchValidated: true, checks: checks, requiredChecks: REQUIRED_CHECKS });
    assert.equal(r.status, STATUSES.FAILED_CHECKS, failing + ' must not produce IMPLEMENTATION_FAILED');
    assert.deepEqual(r.failed_checks, [failing]);
  }
});

test('status — un controle non execute n est jamais compte comme reussi', () => {
  const checks = REQUIRED_CHECKS.map((c) => ({ check: c, status: c === 'lint' ? 'NOT_RUN' : 'PASS' }));
  const r = computeStatus({ hasChanges: true, patchValidated: true, checks: checks, requiredChecks: REQUIRED_CHECKS });
  assert.equal(r.status, STATUSES.FAILED_CHECKS);
  assert.deepEqual(r.failed_checks, [], 'a NOT_RUN check is not a failure');
  assert.deepEqual(r.not_run_checks, ['lint']);
});

test('status — un controle absent est signale NOT_RUN et bloque IMPLEMENTED_AND_VERIFIED', () => {
  const r = computeStatus({
    hasChanges: true,
    patchValidated: true,
    checks: [{ check: 'jest', status: 'PASS' }],
    requiredChecks: REQUIRED_CHECKS,
  });
  assert.equal(r.status, STATUSES.FAILED_CHECKS);
  assert.deepEqual(r.not_run_checks.sort(), ['lint', 'scope', 'typescript']);
});

test('status — sans delta ou sans patch valide : IMPLEMENTATION_FAILED', () => {
  assert.equal(
    computeStatus({ hasChanges: false, patchValidated: false, checks: [], requiredChecks: [] }).status,
    STATUSES.FAILED
  );
  assert.equal(
    computeStatus({ hasChanges: true, patchValidated: false, checks: ALL_PASS, requiredChecks: REQUIRED_CHECKS }).status,
    STATUSES.FAILED
  );
});

test('status — clarification attestee par l agent', () => {
  assert.equal(
    computeStatus({
      hasChanges: false,
      patchValidated: false,
      agentStatus: STATUSES.CLARIFICATION,
      checks: [],
      requiredChecks: [],
    }).status,
    STATUSES.CLARIFICATION
  );
  assert.equal(
    computeStatus({
      hasChanges: true,
      patchValidated: true,
      agentStatus: STATUSES.CLARIFICATION,
      checks: ALL_PASS,
      requiredChecks: REQUIRED_CHECKS,
    }).status,
    STATUSES.CLARIFICATION
  );
});

test('status — les quatre statuts ont un code de sortie et une reprise distincts', () => {
  const values = Object.values(STATUSES);
  assert.equal(values.length, 4);
  for (const s of values) {
    assert.equal(typeof EXIT_CODES[s], 'number');
    assert.equal(typeof RECOVERY[s], 'string');
  }
  assert.equal(EXIT_CODES[STATUSES.VERIFIED], 0);
  assert.notEqual(EXIT_CODES[STATUSES.FAILED_CHECKS], 0);
  assert.equal(RECOVERY[STATUSES.FAILED_CHECKS], 'TARGETED_FIX');
});

test('reprise ciblee — relance les controles echoues et directement impactes', () => {
  assert.deepEqual(resolveChecksToRerun(['jest']), ['jest', 'scope']);
  assert.deepEqual(resolveChecksToRerun(['typescript']), ['jest', 'typescript', 'scope']);
  assert.deepEqual(resolveChecksToRerun(['lint']), ['lint', 'scope']);
  assert.deepEqual(resolveChecksToRerun([]), ['scope']);
  assert.deepEqual(resolveChecksToRerun(['jest', 'lint']), ['jest', 'lint', 'scope']);
});

test('compteurs Jest — 862 passed / 2 failed sont extraits exactement', () => {
  assert.deepEqual(parseJestCounts('Tests:       2 failed, 862 passed, 864 total\n'), {
    passed_tests: 862,
    failed_tests: 2,
    total_tests: 864,
  });
  assert.deepEqual(parseJestCounts('Tests:       864 passed, 864 total\n'), {
    passed_tests: 864,
    failed_tests: 0,
    total_tests: 864,
  });
  assert.deepEqual(parseJestCounts('pas de compteurs'), {
    passed_tests: null,
    failed_tests: null,
    total_tests: null,
  });
});

test('qualification jetable — Jest réutilise uniquement une cache isolée au run', () => {
  const isolated = commandFor('jest', {
    KODJO_QUALIFICATION_ISOLATED_CHECKS: '1',
    KODJO_QUALIFICATION_CHECK_CACHE_DIR: 'C:\\runner-temp\\kodjo-run-1\\check-cache',
  });
  assert.match(isolated, /--cacheDirectory/);
  assert.match(isolated, /kodjo-run-1/);
  assert.doesNotMatch(isolated, /--no-cache/);
  assert.match(commandFor('jest', { KODJO_QUALIFICATION_ISOLATED_CHECKS: '1' }), /--no-cache/);
  assert.equal(commandFor('jest', {}), 'npm test --silent');
});

test('parser YAML — structure du workflow reelle et refus des constructions non supportees', () => {
  const wfPath = path.join(H.REPO_ROOT, '.github', 'workflows', 'kodjo-v2-implementation-artifact.yml');
  const doc = parse(fs.readFileSync(wfPath, 'utf8'));
  assert.equal(doc.name, 'KODJO V2 implementation artifact');
  assert.deepEqual(Object.keys(doc.on), ['workflow_dispatch']);
  assert.equal(doc.jobs.implementation['runs-on'], 'ubuntu-latest');
  assert.ok(Array.isArray(doc.jobs.implementation.steps));
  assert.ok(doc.jobs.implementation.steps.length >= 12);
  assert.deepEqual(doc.on.workflow_dispatch.inputs.mode.options, ['IMPLEMENT', 'TARGETED_FIX']);

  assert.deepEqual(parse('a: 1\nb: [x, y]\nc:\n  - p: 1\n    q: 2\n'), {
    a: 1,
    b: ['x', 'y'],
    c: [{ p: 1, q: 2 }],
  });
  assert.throws(() => parse('a: &anchor 1\nb: *anchor\n'), YamlError);
  assert.throws(() => parse('a: 1\na: 2\n'), YamlError);
});

test('validation des workflows — le pilote refuse un workflow qui controle avant de conserver', () => {
  const { validateImplementationWorkflow } = require(path.join(H.SCRIPTS, 'validate-workflows.js'));
  const bad = {
    permissions: { contents: 'write' },
    jobs: {
      implementation: {
        steps: [
          { uses: 'actions/checkout@v4', with: { 'persist-credentials': true } },
          { id: 'jest', run: 'node scripts/kodjo/run-check.js jest x.json' },
          { id: 'preserve', run: 'node scripts/kodjo/preserve-implementation.js delivery' },
          { id: 'patch_check', run: 'node scripts/kodjo/verify-delivery.js delivery' },
          { id: 'typescript', run: 'true' },
          { id: 'lint', run: 'true' },
          { id: 'scope', run: 'true' },
          { id: 'summarize', run: 'true' },
          { id: 'upload', run: 'true' },
          { id: 'publish', run: 'true' },
          { id: 'exit_status', run: 'true' },
        ],
      },
    },
  };
  const errors = [];
  validateImplementationWorkflow(bad, H.REPO_ROOT, errors);
  const joined = errors.join(' | ');
  assert.match(joined, /permissions\.contents must be "read"/);
  assert.match(joined, /persist-credentials: false/);
  assert.match(joined, /check "jest" runs before preservation/);
  assert.match(joined, /must be guarded by always\(\)/);
});

test('perimetre — un allowlist absent donne NOT_RUN, jamais PASS', () => {
  const ctx = { sandbox: H.createSandbox(), delivery: path.join(H.tmp('kodjo-scope-'), 'delivery') };
  fs.mkdirSync(path.join(ctx.delivery, 'checks'), { recursive: true });
  fs.mkdirSync(path.join(ctx.delivery, 'recovery'), { recursive: true });
  fs.writeFileSync(
    path.join(ctx.delivery, 'recovery', 'modified-files.json'),
    JSON.stringify({ files: [{ path: 'src/app.ts' }] })
  );
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, { KODJO_SCOPE_ALLOW: '' });
  const res = H.runScript('run-check.js', ['scope', path.join(ctx.delivery, 'checks', 'scope.json')], { env: env });
  assert.equal(res.status, 0, 'run-check must never propagate a check failure');
  const out = JSON.parse(fs.readFileSync(path.join(ctx.delivery, 'checks', 'scope.json'), 'utf8'));
  assert.equal(out.status, 'NOT_RUN');
  assert.match(out.reason, /SCOPE_ALLOWLIST_NOT_CONFIGURED/);
});

test('classification — une chaine d outils indisponible est NOT_RUN, pas un verdict FAIL', () => {
  // Codes de sortie impossibles pour un verdict POSIX, ou messages de lancement.
  assert.match(classifyLaunchFailure(127, ''), /COMMAND_NOT_FOUND/);
  assert.match(classifyLaunchFailure(9009, ''), /COMMAND_NOT_FOUND/);
  assert.match(classifyLaunchFailure(4294963238, ''), /COMMAND_LAUNCH_FAILURE/);
  assert.match(classifyLaunchFailure(1, "'jest' n'est pas reconnu en tant que commande interne"), /COMMAND_NOT_FOUND/);
  assert.match(classifyLaunchFailure(1, 'jest: command not found'), /COMMAND_NOT_FOUND/);
  assert.match(
    classifyLaunchFailure(1, 'npm error npx canceled due to missing packages and no YES option'),
    /DEPENDENCIES_NOT_INSTALLED/
  );
  assert.match(classifyLaunchFailure(1, 'npm ERR! Missing script: "lint"'), /NPM_MISSING_SCRIPT/);

  // Un vrai verdict de controle n est jamais requalifie.
  assert.equal(classifyLaunchFailure(1, 'Tests:       2 failed, 862 passed, 864 total'), null);
  assert.equal(classifyLaunchFailure(2, "src/app.ts(2,14): error TS2322: Type 'boolean' ..."), null);
  assert.equal(classifyLaunchFailure(1, 'SCOPE_VIOLATION: 1 file(s) outside the authorized scope'), null);
});

test('run-check — une commande introuvable est NOT_RUN, jamais PASS', () => {
  const ctx = { sandbox: H.createSandbox(), delivery: path.join(H.tmp('kodjo-cmd-'), 'delivery') };
  fs.mkdirSync(path.join(ctx.delivery, 'checks'), { recursive: true });
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    KODJO_CHECK_CMD_LINT: 'commande-kodjo-inexistante-xyz --version',
  });
  const res = H.runScript('run-check.js', ['lint', path.join(ctx.delivery, 'checks', 'lint.json')], { env: env });
  assert.equal(res.status, 0);
  const out = JSON.parse(fs.readFileSync(path.join(ctx.delivery, 'checks', 'lint.json'), 'utf8'));
  assert.notEqual(out.status, 'PASS');
});

test('adaptateur — aucun appel IA sans adaptateur borne configure', () => {
  const ctx = { sandbox: H.createSandbox(), delivery: path.join(H.tmp('kodjo-agent-'), 'delivery') };
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, { KODJO_AGENT_CMD: '' });
  const res = H.runScript('run-implementation-agent.js', [], { env: env });
  assert.equal(res.status, 78);
  assert.match(res.stderr, /NO_AGENT_ADAPTER_CONFIGURED/);
});

test.after(() => H.cleanupAll());
