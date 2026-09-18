'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const activationScript = path.join(root, 'scripts', 'kodjo', 'activate-kodjo-v2-slice.js');
const materializerScript = path.join(root, 'scripts', 'kodjo', 'materialize-approved-plan-handoff.js');

function run(cmd, args, cwd, env = {}) {
  return spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, ...env },
    maxBuffer: 32 * 1024 * 1024,
  });
}

function git(cwd, args) {
  const r = run('git', args, cwd);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return r.stdout.trim();
}

function createRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-activation-head-'));
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.github', 'orchestration'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'docs', 'PRODUCT.md'), '# Produit\n', 'utf8');
  fs.writeFileSync(path.join(dir, '.github', 'orchestration', 'v2-activation-registry.json'),
    JSON.stringify({ schema_version: 'kodjo.protocol.v2.activation-registry.0.6.12', activations: [] }, null, 2) + '\n', 'utf8');
  git(dir, ['init']);
  git(dir, ['config', 'user.email', 'kodjo@example.invalid']);
  git(dir, ['config', 'user.name', 'KODJO Test']);
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-m', 'baseline']);
  return dir;
}

test('activation neuve: planning_application_head est natif et égal au baseline dans bootstrap et registre', () => {
  const dir = createRepo();
  try {
    const baseline = git(dir, ['rev-parse', 'HEAD']);
    const r = run(process.execPath, [
      activationScript,
      '--slice-id', 'V2-FRESH-01',
      '--issue-number', '999',
      '--product-sources', 'docs/PRODUCT.md',
      '--authorized-actors', 'user,chatgpt-protocole,claude-local',
      '--target-branch', 'main',
    ], dir);
    assert.equal(r.status, 0, r.stderr);

    const bootstrap = JSON.parse(fs.readFileSync(
      path.join(dir, '.github', 'orchestration', 'v2-slices', 'V2-FRESH-01', 'slice-bootstrap.json'), 'utf8'));
    const registry = JSON.parse(fs.readFileSync(
      path.join(dir, '.github', 'orchestration', 'v2-activation-registry.json'), 'utf8'));
    const activation = registry.activations.find((x) => x.slice_id === 'V2-FRESH-01');

    assert.equal(bootstrap.baseline_head, baseline);
    assert.equal(bootstrap.planning_application_head, baseline);
    assert.equal(activation.planning_application_head, baseline);
    assert.equal(activation.slice_bootstrap_sha256, bootstrap.slice_bootstrap_sha256);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('identité de registre: planning_application_head présent d’un seul côté est refusé', () => {
  const I = require('../../scripts/kodjo/lib/slice-identity');
  const b = {
    schema_version: I.BOOTSTRAP_SCHEMA,
    slice_id: 'V2-FRESH-02',
    issue_number: 998,
    repository: 'MyUncried/Application-Routine',
    target_branch: 'main',
    baseline_head: 'a'.repeat(40),
    planning_application_head: 'a'.repeat(40),
    protocol_version: '0.6.12',
    protocol_commit: 'b'.repeat(40),
    activation_registry: '.github/orchestration/v2-activation-registry.json',
    previous_slice_id: null,
    previous_checkpoint: null,
    product_sources: [{ path: 'docs/PRODUCT.md', sha256: 'd'.repeat(64) }],
    authorized_actors: ['user'],
    created_at: '2026-09-18T00:00:00.000Z',
  };
  b.slice_bootstrap_sha256 = I.sha256(I.canonical(b));
  const r = {
    schema_version: I.REGISTRY_SCHEMA,
    activations: [{
      slice_id: b.slice_id,
      status: 'ACTIVE',
      issue_number: b.issue_number,
      baseline_head: b.baseline_head,
      bootstrap_path: '.github/orchestration/v2-slices/' + b.slice_id + '/slice-bootstrap.json',
      slice_bootstrap_sha256: b.slice_bootstrap_sha256,
    }],
  };
  assert.throws(() => I.validateRegistry(r, b), /ACTIVATION_PLANNING_APPLICATION_HEAD_MISMATCH/);
});

test('handoff: une tranche sans planning_application_head est refusée avant toute matérialisation', () => {
  const source = fs.readFileSync(materializerScript, 'utf8');
  assert.match(source, /HANDOFF_PLANNING_APPLICATION_HEAD_MISSING/);
  assert.match(source, /HANDOFF_PLANNING_APPLICATION_HEAD_REGISTRY_MISMATCH/);
  assert.doesNotMatch(source, /bootstrap\.planning_application_head\s*=\s*String\(impact\.scan_revision\)[\s\S]*HANDOFF_PLANNING_APPLICATION_HEAD_MISSING/);
});
