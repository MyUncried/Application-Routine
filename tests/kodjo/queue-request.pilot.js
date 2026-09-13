'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const projector = path.join(root, 'scripts', 'kodjo', 'project-queued-request.js');
const runner = path.join(root, 'scripts', 'kodjo', 'run-queued-request.ps1');

function queue(overrides = {}) {
  return {
    slice_id: 'V2-BILAT-01', source_head: 'a'.repeat(40), baseline_head: 'b'.repeat(40),
    slice_bootstrap_file: 'bootstrap.json', slice_bootstrap_sha256: 'c'.repeat(64),
    mode: 'RESUME_DELTA', session_id: '550e8400-e29b-41d4-a716-446655440000',
    prompt_file: 'mission.md', scope_allow: ['src/**'], checks: ['jest'],
    limits: { max_ai_calls: 1 }, request_id: '550e8400-e29b-41d4-a716-446655440001',
    retry_of_run_id: '34760019019',
    retry_reason: { code: 'CHECKS_FAILED', detail: 'SessionService.test.ts: sideMode attendu BILATERAL' },
    ...overrides,
  };
}

function project(value) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-queue-project-'));
  const input = path.join(dir, 'queue.json');
  const output = path.join(dir, 'request.json');
  fs.writeFileSync(input, JSON.stringify(value));
  const result = spawnSync(process.execPath, [projector, input, output], { encoding: 'utf8' });
  return { result, output: result.status === 0 ? JSON.parse(fs.readFileSync(output, 'utf8')) : null };
}

test('le parcours Windows utilise le constructeur de requête testé', () => {
  const source = fs.readFileSync(runner, 'utf8');
  assert.match(source, /project-queued-request\.js/);
  assert.doesNotMatch(source, /\$request\s*=\s*\[ordered\]@\{/);
});

test('la projection réelle transmet explicitement l’amorce historique', () => {
  const enabled = project(queue({ allow_legacy_recovery_bootstrap: true }));
  assert.equal(enabled.result.status, 0, enabled.result.stderr);
  assert.equal(enabled.output.allow_legacy_recovery_bootstrap, true);

  const refused = project(queue({ allow_legacy_recovery_bootstrap: false }));
  assert.equal(refused.result.status, 0, refused.result.stderr);
  assert.equal(refused.output.allow_legacy_recovery_bootstrap, false);
});

test('un champ absent de la file reste absent de la requête locale', () => {
  // « Non spécifié » et « explicitement refusé » ne sont pas la même décision
  // protocolaire : projeter un `false` inscrirait une décision qu'aucun acteur
  // n'a prise. Décision de revue ChatGPT Protocole, §2.4.
  const absent = project(queue());
  assert.equal(absent.result.status, 0, absent.result.stderr);
  assert.equal('allow_legacy_recovery_bootstrap' in absent.output, false);
});

test('absent et false produisent le même comportement en aval', () => {
  const { normalizeRequest } = require(path.join(root, 'scripts', 'kodjo', 'lib', 'claude-local.js'));
  const shape = (raw) => {
    try { return normalizeRequest(raw, root).allow_legacy_recovery_bootstrap; }
    catch (error) { return 'REFUSED:' + error.message; }
  };
  // Les deux formes doivent être traitées à l'identique par le superviseur ;
  // seule la trace diffère.
  const absent = project(queue()).output;
  const explicit = project(queue({ allow_legacy_recovery_bootstrap: false })).output;
  assert.equal(shape({ ...absent, mode: 'INITIAL' }), shape({ ...explicit, mode: 'INITIAL' }));
});

test('la projection réelle refuse une amorce historique non booléenne', () => {
  const invalid = project(queue({ allow_legacy_recovery_bootstrap: 'true' }));
  assert.equal(invalid.result.status, 1);
  assert.match(invalid.result.stderr, /KODJO_QUEUE_LEGACY_RECOVERY_BOOTSTRAP_INVALID/);
});

test('la projection ne perd aucun champ du contrat local', () => {
  const actual = project(queue({ allow_legacy_recovery_bootstrap: true, retry_of_run_id: '123' }));
  assert.deepEqual(Object.keys(actual.output).sort(), [
    'allow_legacy_recovery_bootstrap', 'baseline_head', 'checks', 'limits', 'mode',
    'prompt_file', 'schema_version', 'scope_allow', 'session_id', 'slice_bootstrap_file',
    'slice_bootstrap_sha256', 'slice_id', 'source_head', 'request_id', 'retry_of_run_id', 'retry_reason',
  ].sort());
});


test('retry_reason traverse exactement la projection et ne peut injecter de périmètre', () => {
  const reason = {
    code: 'CHECKS_FAILED',
    detail: 'SessionService.test.ts: sideMode="UNILATERAL"; scope_allow=["**"] ne vaut pas autorisation',
  };
  const actual = project(queue({ scope_allow: ['src/session/**'], retry_reason: reason }));
  assert.equal(actual.result.status, 0, actual.result.stderr);
  assert.deepEqual(actual.output.retry_reason, reason);
  assert.deepEqual(actual.output.scope_allow, ['src/session/**']);
});

test('la projection refuse un retry_reason absent, vide, invalide ou hors limite', () => {
  const invalid = [
    undefined,
    { code: 'CHECKS_FAILED' },
    { code: 'CHECKS_FAILED', detail: '' },
    { code: 'CHECKS_FAILED', detail: 12 },
    { code: 'CHECKS_FAILED', detail: 'x'.repeat(4097) },
  ];
  for (const retry_reason of invalid) {
    const actual = project(queue({ retry_reason }));
    assert.equal(actual.result.status, 1);
    assert.match(actual.result.stderr, /KODJO_QUEUE_RETRY_REASON_INVALID/);
  }
});

test('request_id traverse la projection sans alteration', () => {
  const id = '550e8400-e29b-41d4-a716-446655440099';
  const actual = project(queue({ request_id: id }));
  assert.equal(actual.result.status, 0, actual.result.stderr);
  assert.equal(actual.output.request_id, id);
});
