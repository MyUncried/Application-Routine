'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const Security = require('../../scripts/kodjo/lib/vnext-remote-write-security');

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim();
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-vnext-writer-'));
  git(root, 'init');
  git(root, 'config', 'user.name', 'KODJO Test');
  git(root, 'config', 'user.email', 'kodjo@example.test');
  fs.mkdirSync(path.join(root, '.github', 'workflows'), { recursive: true });
  fs.mkdirSync(path.join(root, 'scripts', 'kodjo'), { recursive: true });
  return root;
}

function write(root, rel, content) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function blob(root, rel) {
  return git(root, 'hash-object', '--', rel);
}

function policy(overrides = {}) {
  return {
    schema_version: Security.POLICY_SCHEMA,
    policy_mode: 'CUTOVER_PREPARATION',
    frozen_workflows: overrides.frozen_workflows || [],
    frozen_scripts: overrides.frozen_scripts || [],
    declared_vnext_writers: overrides.declared_vnext_writers || [],
    retirement_rule: 'REMOVE_OR_DISABLE_ALL_LEGACY_WRITERS_AFTER_LAST_LEGACY_SLICE',
  };
}

function registry(active = true) {
  return {
    schema_version: 'test',
    activations: active
      ? [{ slice_id: 'V2-LEGACY-01', status: 'ACTIVE' }]
      : [{ slice_id: 'V2-LEGACY-01', status: 'CLOSED' }],
  };
}

test('F-01 — le dépôt VNext courant est entièrement inventorié sans filtre de préfixe', () => {
  const root = path.resolve(__dirname, '..', '..');
  const p = JSON.parse(fs.readFileSync(
    path.join(root, '.github', 'orchestration', 'KODJO_VNEXT_REMOTE_WRITE_POLICY.json'),
    'utf8',
  ));
  const reg = JSON.parse(fs.readFileSync(
    path.join(root, '.github', 'orchestration', 'v2-activation-registry.json'),
    'utf8',
  ));
  const attestation = Security.evaluateRemoteWriteSecurity({
    root,
    policy: p,
    legacyActivationRegistry: reg,
  });
  assert.equal(attestation.status, 'PASS_WITH_FROZEN_LEGACY');
  assert.deepEqual(attestation.findings, []);
  assert.ok(attestation.scanned_file_count >= p.frozen_workflows.length + p.frozen_scripts.length);
  assert.ok(p.frozen_workflows.some((row) => row.path === '.github/workflows/kodjo-slice-finalize.yml'));
  assert.ok(p.frozen_workflows.some((row) => row.path === '.github/workflows/kodjo-v2-lean-queue.yml'));
});

test('F-01 — un workflow arbitrairement nommé avec écriture non déclarée est refusé', () => {
  const root = fixture();
  write(root, '.github/workflows/not-kodjo-v2-name.yml', `
name: rogue
on: workflow_dispatch
jobs:
  write:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - run: gh api --method PUT "repos/x/y/contents/file.txt" --input payload.json
`);
  const attestation = Security.evaluateRemoteWriteSecurity({
    root,
    policy: policy(),
    legacyActivationRegistry: registry(true),
  });
  assert.equal(attestation.status, 'FAIL');
  assert.ok(attestation.findings.some((row) => row.code === 'VNEXT_REMOTE_WRITE_UNDECLARED_PRODUCER'));
});

test('F-01 — un script appelé pouvant pousser au dépôt est refusé même si le workflow ne porte pas le préfixe historique', () => {
  const root = fixture();
  write(root, '.github/workflows/anything.yml', `
name: caller
on: workflow_dispatch
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - run: node scripts/kodjo/rogue.js
`);
  write(root, 'scripts/kodjo/rogue.js', "require('child_process').execSync('git push origin HEAD:main');\n");
  const attestation = Security.evaluateRemoteWriteSecurity({
    root,
    policy: policy(),
    legacyActivationRegistry: registry(true),
  });
  assert.equal(attestation.status, 'FAIL');
  assert.ok(attestation.findings.some((row) =>
    row.code === 'VNEXT_REMOTE_WRITE_UNDECLARED_PRODUCER'
      && row.producer === 'scripts/kodjo/rogue.js'));
});

test('F-01 — une écriture REST repository non déclarée est refusée', () => {
  const root = fixture();
  write(root, 'scripts/kodjo/rogue.ps1',
    'gh api --method PATCH "repos/x/y/git/refs/heads/main" --input payload.json\n');
  const attestation = Security.evaluateRemoteWriteSecurity({
    root,
    policy: policy(),
    legacyActivationRegistry: registry(true),
  });
  assert.equal(attestation.status, 'FAIL');
  assert.ok(attestation.observed_capabilities.some((row) =>
    row.producer === 'scripts/kodjo/rogue.ps1'
      && row.capability === 'REST_REPOSITORY_WRITE'));
});

test('F-01 — une surface legacy exacte peut coexister uniquement tant qu’une slice legacy reste active', () => {
  const root = fixture();
  const rel = '.github/workflows/legacy-finalize.yml';
  write(root, rel, `
name: legacy
on: workflow_dispatch
permissions:
  contents: write
jobs:
  finalize:
    runs-on: ubuntu-latest
    steps:
      - run: git push origin HEAD:main
`);
  const p = policy({
    frozen_workflows: [{
      path: rel,
      blob_oid: blob(root, rel),
      authorization_condition: 'LEGACY_FROZEN_EXACT_BLOB_ONLY',
    }],
  });
  const active = Security.evaluateRemoteWriteSecurity({
    root,
    policy: p,
    legacyActivationRegistry: registry(true),
  });
  assert.equal(active.status, 'PASS_WITH_FROZEN_LEGACY');

  const closed = Security.evaluateRemoteWriteSecurity({
    root,
    policy: p,
    legacyActivationRegistry: registry(false),
  });
  assert.equal(closed.status, 'FAIL');
  assert.ok(closed.findings.some((row) => row.code === 'VNEXT_REMOTE_WRITE_LEGACY_WRITER_NOT_RETIRED'));
});

test('F-01 — ajouter une écriture à un workflow legacy figé invalide son empreinte', () => {
  const root = fixture();
  const rel = '.github/workflows/legacy.yml';
  write(root, rel, `
name: legacy
on: workflow_dispatch
jobs:
  read:
    runs-on: ubuntu-latest
    steps:
      - run: echo ok
`);
  const p = policy({
    frozen_workflows: [{
      path: rel,
      blob_oid: blob(root, rel),
      authorization_condition: 'LEGACY_FROZEN_EXACT_BLOB_ONLY',
    }],
  });
  write(root, rel, fs.readFileSync(path.join(root, rel), 'utf8')
    + '      - run: git push origin HEAD:main\n');
  const attestation = Security.evaluateRemoteWriteSecurity({
    root,
    policy: p,
    legacyActivationRegistry: registry(true),
  });
  assert.equal(attestation.status, 'FAIL');
  assert.ok(attestation.findings.some((row) => row.code === 'VNEXT_REMOTE_WRITE_FROZEN_PRODUCER_DRIFT'));
});

test('F-01 — un writer VNext doit déclarer producteur, destination, condition et job exact', () => {
  const root = fixture();
  const rel = '.github/workflows/vnext-writer.yml';
  write(root, rel, `
name: vnext-writer
on: workflow_dispatch
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - run: echo publish
`);
  const scan = Security.scanRepository(root);
  const caps = scan.capabilities.filter((row) => row.producer === rel);
  assert.equal(caps.length, 1);
  const p = policy({
    declared_vnext_writers: [{
      producer: rel,
      producer_blob_oid: blob(root, rel),
      authorization_condition: 'EXACT_APPROVED_EXECUTION_REQUEST',
      required_job: 'publish',
      capabilities: caps.map((row) => ({
        capability: row.capability,
        destination: row.destination,
        scope: row.scope,
      })),
    }],
  });
  const attestation = Security.evaluateRemoteWriteSecurity({
    root,
    policy: p,
    legacyActivationRegistry: registry(true),
  });
  assert.equal(attestation.status, 'PASS_WITH_FROZEN_LEGACY');
  assert.deepEqual(attestation.findings, []);
});

test('F-01 — VNext interdit une permission write au niveau workflow', () => {
  const root = fixture();
  const rel = '.github/workflows/vnext-bad.yml';
  write(root, rel, `
name: bad
on: workflow_dispatch
permissions:
  contents: write
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: echo x
`);
  const cap = Security.scanRepository(root).capabilities.find((row) => row.producer === rel);
  assert.ok(cap);
  assert.throws(() => Security.validatePolicy(policy({
    declared_vnext_writers: [{
      producer: rel,
      producer_blob_oid: blob(root, rel),
      authorization_condition: 'EXACT_APPROVED_EXECUTION_REQUEST',
      required_job: 'publish',
      capabilities: [{
        capability: cap.capability,
        destination: cap.destination,
        scope: cap.scope,
      }],
    }],
  })), /VNEXT_REMOTE_WRITE_VNEXT_WORKFLOW_LEVEL_WRITE_FORBIDDEN/);
});
