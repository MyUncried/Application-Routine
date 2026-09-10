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
    limits: { max_ai_calls: 1 }, ...overrides,
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

  const disabled = project(queue());
  assert.equal(disabled.result.status, 0, disabled.result.stderr);
  assert.equal(disabled.output.allow_legacy_recovery_bootstrap, false);
});

test('la projection réelle refuse une amorce historique non booléenne', () => {
  const invalid = project(queue({ allow_legacy_recovery_bootstrap: 'true' }));
  assert.equal(invalid.result.status, 1);
  assert.match(invalid.result.stderr, /KODJO_QUEUE_LEGACY_RECOVERY_BOOTSTRAP_INVALID/);
});

test('la projection ne perd aucun champ du contrat local', () => {
  const actual = project(queue({ allow_legacy_recovery_bootstrap: true }));
  assert.deepEqual(Object.keys(actual.output).sort(), [
    'allow_legacy_recovery_bootstrap', 'baseline_head', 'checks', 'limits', 'mode',
    'prompt_file', 'schema_version', 'scope_allow', 'session_id', 'slice_bootstrap_file',
    'slice_bootstrap_sha256', 'slice_id', 'source_head',
  ].sort());
});
