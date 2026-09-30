'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const RW = require('../../scripts/kodjo/lib/vnext-remote-write-policy');

function root() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-vnext-writer-'));
  fs.mkdirSync(path.join(dir, '.github', 'workflows'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.github', 'actions'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'scripts', 'kodjo'), { recursive: true });
  return dir;
}

function put(base, rel, source) {
  const file = path.join(base, ...rel.split('/'));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, source, 'utf8');
  return source;
}

function policy(declarations = []) {
  return {
    schema_version: RW.POLICY_SCHEMA,
    scan_roots: [...RW.EXECUTABLE_ROOTS],
    declarations,
  };
}

function declaration({
  source,
  producer_path,
  capability_type,
  destination,
  lifecycle = 'VNEXT',
  required_permission_scope = 'NONE',
  id = 'DECL-001',
}) {
  return {
    declaration_id: id,
    lifecycle,
    producer_path,
    producer_blob_sha40: RW.gitBlobSha40(source),
    capability_type,
    destination,
    conditions: 'Exact producer and bounded operation accepted only for this fixture.',
    required_permission_scope,
  };
}

test('VNext-11.1 inventorie un workflow arbitrairement nommé, sans filtre de préfixe', () => {
  const base = root();
  put(base, '.github/workflows/anything-at-all.yml', [
    'name: arbitrary',
    'permissions:',
    '  contents: write',
    'jobs:',
    '  x:',
    '    runs-on: ubuntu-latest',
    '    steps: []',
    '',
  ].join('\n'));

  const report = RW.scanRepository({ root: base, policy: policy() });
  assert.equal(report.status, 'FAIL');
  assert.ok(report.undeclared_capabilities.some((x) =>
    x.producer_path === '.github/workflows/anything-at-all.yml'
    && x.type === 'GITHUB_PERMISSION_WRITE'
    && x.destination === 'contents'));
});

test('VNext-11.1 accepte une écriture légitime déclarée au niveau job exact', () => {
  const base = root();
  const rel = '.github/workflows/writer.yml';
  const source = put(base, rel, [
    'name: writer',
    'permissions:',
    '  contents: read',
    'jobs:',
    '  publish:',
    '    permissions:',
    '      contents: write',
    '    runs-on: ubuntu-latest',
    '    steps: []',
    '',
  ].join('\n'));

  const p = policy([declaration({
    source,
    producer_path: rel,
    capability_type: 'GITHUB_PERMISSION_WRITE',
    destination: 'contents',
    required_permission_scope: 'JOB',
  })]);
  const report = RW.scanRepository({ root: base, policy: p });
  assert.equal(report.status, 'PASS');
  assert.equal(report.declared_capability_count, 1);
});

test('VNext-11.1 refuse la même permission si elle est élargie au workflow', () => {
  const base = root();
  const rel = '.github/workflows/writer.yml';
  const jobSource = [
    'name: writer',
    'jobs:',
    '  publish:',
    '    permissions:',
    '      contents: write',
    '    runs-on: ubuntu-latest',
    '    steps: []',
    '',
  ].join('\n');
  const p = policy([declaration({
    source: jobSource,
    producer_path: rel,
    capability_type: 'GITHUB_PERMISSION_WRITE',
    destination: 'contents',
    required_permission_scope: 'JOB',
  })]);

  const workflowSource = [
    'name: writer',
    'permissions:',
    '  contents: write',
    'jobs:',
    '  publish:',
    '    runs-on: ubuntu-latest',
    '    steps: []',
    '',
  ].join('\n');
  put(base, rel, workflowSource);
  const report = RW.scanRepository({ root: base, policy: p });
  assert.equal(report.status, 'FAIL');
  assert.ok(report.undeclared_capabilities.some((x) =>
    x.type === 'GITHUB_PERMISSION_WRITE' && x.permission_scope === 'WORKFLOW'));
});

test('VNext-11.1 refuse un PUT REST non déclaré dans un script appelé', () => {
  const base = root();
  put(base, 'scripts/kodjo/publish.ps1',
    'gh api --method PUT "repos/$env:GITHUB_REPOSITORY/contents/docs/proof.json" --input $payload\n');

  const report = RW.scanRepository({ root: base, policy: policy() });
  assert.equal(report.status, 'FAIL');
  assert.ok(report.undeclared_capabilities.some((x) =>
    x.type === 'GH_API_WRITE'
    && x.producer_path === 'scripts/kodjo/publish.ps1'
    && x.destination.includes('/contents/')));
});

test('VNext-11.1 refuse une écriture ajoutée à un producteur pourtant déclaré', () => {
  const base = root();
  const rel = 'scripts/kodjo/publish.ps1';
  const approved = 'gh api --method PUT "repos/$env:GITHUB_REPOSITORY/contents/docs/proof.json" --input $payload\n';
  const p = policy([declaration({
    source: approved,
    producer_path: rel,
    capability_type: 'GH_API_WRITE',
    destination: 'repos/$env:GITHUB_REPOSITORY/contents/docs/proof.json',
  })]);

  put(base, rel, approved
    + 'gh api --method DELETE "repos/$env:GITHUB_REPOSITORY/contents/docs/other.json" --input $payload\n');

  const report = RW.scanRepository({ root: base, policy: p });
  assert.equal(report.status, 'FAIL');
  assert.ok(report.undeclared_capabilities.length >= 1);
});

test('VNext-11.1 inventorie aussi les credentials Git persistants ou injectés', () => {
  const base = root();
  put(base, 'scripts/kodjo/auth.ps1', [
    'git config --local http.https://github.com/.extraheader "AUTHORIZATION: basic $auth"',
    'git config --local --unset-all http.https://github.com/.extraheader',
    '',
  ].join('\n'));

  const report = RW.scanRepository({ root: base, policy: policy() });
  assert.equal(report.status, 'FAIL');
  assert.equal(
    report.undeclared_capabilities.filter((x) => x.type === 'GIT_CREDENTIAL_HEADER').length,
    2,
  );
});

test('VNext-11.1 traite un writer legacy comme temporaire tant qu’une slice legacy reste active', () => {
  const base = root();
  const rel = '.github/workflows/legacy-finalize.yml';
  const source = put(base, rel, [
    'name: legacy',
    'permissions:',
    '  contents: write',
    'jobs: {}',
    '',
  ].join('\n'));
  const p = policy([declaration({
    source,
    producer_path: rel,
    capability_type: 'GITHUB_PERMISSION_WRITE',
    destination: 'contents',
    lifecycle: 'LEGACY_GRANDFATHERED',
    required_permission_scope: 'WORKFLOW',
    id: 'LEGACY-001',
  })]);
  const report = RW.scanRepository({ root: base, policy: p });
  const gate = RW.buildGate({
    report,
    policy: p,
    activeLegacySliceIds: ['V2-LEGACY-01'],
  });
  assert.equal(gate.status, 'REMOTE_WRITE_CONTROL_READY');
  assert.equal(gate.legacy_retirement_status, 'LEGACY_WRITERS_GRANDFATHERED');
});

test('VNext-11.1 bloque la fin du cutover si un writer legacy subsiste sans slice legacy active', () => {
  const base = root();
  const rel = '.github/workflows/legacy-finalize.yml';
  const source = put(base, rel, [
    'name: legacy',
    'permissions:',
    '  contents: write',
    'jobs: {}',
    '',
  ].join('\n'));
  const p = policy([declaration({
    source,
    producer_path: rel,
    capability_type: 'GITHUB_PERMISSION_WRITE',
    destination: 'contents',
    lifecycle: 'LEGACY_GRANDFATHERED',
    required_permission_scope: 'WORKFLOW',
    id: 'LEGACY-001',
  })]);
  const report = RW.scanRepository({ root: base, policy: p });
  const gate = RW.buildGate({ report, policy: p, activeLegacySliceIds: [] });
  assert.equal(gate.status, 'BLOCKED_LEGACY_WRITERS_NOT_RETIRED');
  assert.equal(gate.legacy_retirement_status, 'LEGACY_WRITERS_NOT_RETIRED');
});

test('VNext-11.1 considère le legacy retiré seulement quand aucune capacité legacy détectée ne subsiste', () => {
  const base = root();
  const report = RW.scanRepository({ root: base, policy: policy() });
  const gate = RW.buildGate({ report, policy: policy(), activeLegacySliceIds: [] });
  assert.equal(gate.status, 'REMOTE_WRITE_CONTROL_READY');
  assert.equal(gate.legacy_retirement_status, 'LEGACY_WRITERS_RETIRED');
});

test('VNext-11.1 la politique canonique contient explicitement la réserve F-01', () => {
  const canonical = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', '..', '.github', 'orchestration', 'KODJO_VNEXT_REMOTE_WRITE_POLICY.json'),
    'utf8',
  ));
  assert.equal(RW.validatePolicy(canonical), true);
  assert.deepEqual([...canonical.scan_roots].sort(), [...RW.EXECUTABLE_ROOTS].sort());
  const finalize = canonical.declarations.filter(
    (x) => x.producer_path === '.github/workflows/kodjo-slice-finalize.yml',
  );
  assert.ok(finalize.some((x) =>
    x.lifecycle === 'LEGACY_GRANDFATHERED'
    && x.capability_type === 'GITHUB_PERMISSION_WRITE'
    && x.destination === 'contents'));
  assert.ok(finalize.some((x) =>
    x.lifecycle === 'LEGACY_GRANDFATHERED'
    && x.capability_type === 'GH_API_WRITE'
    && x.destination.includes('v2-activation-registry.json')));
});


test('VNext-11.1 un writer réservé à la qualification ne peut pas autoriser le cutover', () => {
  const base = root();
  const rel = '.github/workflows/qualification-writer.yml';
  const source = put(base, rel, [
    'name: qualification',
    'jobs:',
    '  publish:',
    '    permissions:',
    '      contents: write',
    '    runs-on: ubuntu-latest',
    '    steps: []',
    '',
  ].join('\n'));
  const p = policy([declaration({
    source,
    producer_path: rel,
    capability_type: 'GITHUB_PERMISSION_WRITE',
    destination: 'contents',
    lifecycle: 'QUALIFICATION',
    required_permission_scope: 'JOB',
    id: 'QUAL-001',
  })]);
  const report = RW.scanRepository({ root: base, policy: p });
  const gate = RW.buildGate({ report, policy: p, activeLegacySliceIds: [] });
  assert.equal(gate.status, 'BLOCKED_QUALIFICATION_WRITER_PRESENT');
  assert.deepEqual(gate.qualification_writer_declaration_ids, ['QUAL-001']);
});


test('VNext-11.1 une permission de production VNext ne peut pas rester au niveau workflow', () => {
  const source = [
    'name: prod',
    'permissions:',
    '  contents: write',
    'jobs: {}',
    '',
  ].join('\n');
  const p = policy([declaration({
    source,
    producer_path: '.github/workflows/prod.yml',
    capability_type: 'GITHUB_PERMISSION_WRITE',
    destination: 'contents',
    lifecycle: 'VNEXT',
    required_permission_scope: 'WORKFLOW',
    id: 'PROD-001',
  })]);
  assert.throws(() => RW.validatePolicy(p), /VNEXT_REMOTE_WRITE_VNEXT_PERMISSION_MUST_BE_JOB_SCOPED/);
});

test('VNext-11.1 interdit persist-credentials true à un writer de production VNext', () => {
  const source = 'persist-credentials: true\n';
  const p = policy([declaration({
    source,
    producer_path: '.github/workflows/prod.yml',
    capability_type: 'PERSIST_CREDENTIALS_TRUE',
    destination: 'git-credentials',
    lifecycle: 'VNEXT',
    required_permission_scope: 'NONE',
    id: 'PROD-002',
  })]);
  assert.throws(() => RW.validatePolicy(p), /VNEXT_REMOTE_WRITE_VNEXT_PERSISTED_CREDENTIALS_FORBIDDEN/);
});
