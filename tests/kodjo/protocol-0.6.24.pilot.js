'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const L = require('../../scripts/kodjo/run-local-claude');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-0624-'));
  const git = (args) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git(['init', '-q', '.']);
  git(['config', 'user.email', 'protocol@test.local']);
  git(['config', 'user.name', 'protocol']);
  git(['config', 'core.autocrlf', 'false']);
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  for (let index = 1; index <= 30; index += 1) {
    fs.writeFileSync(path.join(root, 'src', 'recovered-' + String(index).padStart(2, '0') + '.ts'), 'v1\n');
  }
  git(['add', '-A']);
  git(['commit', '-qm', 'base']);
  return { root, git };
}

test('0.6.24 — famille exacte du run 34851607031: 30 fichiers restaurés, scope correctif plus étroit', () => {
  const f = fixture();
  const session = '550e8400-e29b-41d4-a716-446655440000';
  const source = f.git(['rev-parse', 'HEAD']);
  const produced = {
    slice_id: 'V2-BILAT-01', source_head: source, baseline_head: 'e'.repeat(40),
    scope_allow: ['src/**'], generated_session_id: session, request_id: 'source-request',
  };
  const paths = [];
  for (let index = 1; index <= 30; index += 1) {
    const relative = 'src/recovered-' + String(index).padStart(2, '0') + '.ts';
    paths.push(relative);
    fs.writeFileSync(path.join(f.root, relative), 'package-v2\n');
  }
  const first = L.writeRecoveryPackage(fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-0624-run-')),
    f.root, produced, paths, { runId: '34872653037' });
  f.git(['reset', '--hard', '-q', source]);

  const corrective = {
    ...produced, mode: 'RESUME_DELTA', session_id: session,
    scope_allow: ['src/recovered-01.ts'], request_id: 'new-request',
  };
  delete corrective.generated_session_id;
  const restored = L.restoreFromPackage(first.dir, f.root, corrective);
  assert.equal(restored.length, 30);
  assert.equal(fs.readFileSync(path.join(f.root, 'src/recovered-30.ts'), 'utf8'), 'package-v2\n');

  corrective.generated_session_id = session;
  corrective.recovery_paths = restored;
  const cumulative = L.writeRecoveryPackage(fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-0624-next-')),
    f.root, corrective, L.changedFiles(f.root), { runId: 'next' });
  assert.deepEqual(cumulative.manifest.paths, paths);
  assert.deepEqual(cumulative.manifest.recovery_paths, paths);
  assert.deepEqual(cumulative.manifest.scope_allow, ['src/recovered-01.ts']);
});

test('0.6.24 — seuls les changements postérieurs à la restauration consomment le scope de mutation', () => {
  const beforePaths = ['src/a.ts', 'src/b.ts'];
  const before = { 'src/a.ts': 'A', 'src/b.ts': 'B' };
  const afterPaths = ['src/a.ts', 'src/b.ts', 'src/new.ts'];
  const after = { 'src/a.ts': 'A', 'src/b.ts': 'B2', 'src/new.ts': 'N' };
  assert.deepEqual(
    L.mutationPathsSinceRestore(beforePaths, before, afterPaths, after),
    ['src/b.ts', 'src/new.ts']
  );
  const request = { scope_allow: ['src/b.ts'], recovery_paths: beforePaths };
  assert.equal(L.inCumulativeScope('src/a.ts', request), true);
  assert.equal(L.inCumulativeScope('src/new.ts', request), false);
});

test('0.6.24 — un chemin de paquet ambigu reste refusé', () => {
  assert.throws(() => L.exactRecoveryPaths(['src/ok.ts', '../escape.ts']), /RECOVERY_PATH_INVALID/);
  assert.throws(() => L.exactRecoveryPaths(['src/ok.ts', 'src/ok.ts']), /RECOVERY_PATH_DUPLICATE/);
});

test('0.6.24 — le diagnostic durable sépare reprise et mutation', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'kodjo', 'run-local-claude.js'), 'utf8');
  assert.match(source, /KODJO_MUTATION_SCOPE_JSON: JSON\.stringify\(request\.scope_allow\)/);
  assert.match(source, /recovery_scope_paths: request\.recovery_paths/);
  assert.match(source, /mutation_scope_allow: request\.scope_allow/);
  assert.match(source, /agent_mutation_files: agentMutationFiles/);
  assert.match(source, /scopeClear = !outsideMutation\.length/);
});

test('0.6.24 — la preuve réelle du paquet 34872653037 est exacte et sans changement applicatif intermédiaire', () => {
  const attestation = JSON.parse(fs.readFileSync(path.join(
    __dirname, '..', '..', '.github', 'orchestration', 'v2-slices', 'V2-BILAT-01',
    'recovery-migration-34872653037.json'), 'utf8'));
  assert.equal(attestation.schema_version, 'kodjo.protocol.v2.recovery-migration.0.6.24');
  assert.equal(attestation.source_run_id, '34872653037');
  assert.equal(attestation.source_artifact_id, '10358639677');
  assert.equal(attestation.source_artifact_digest,
    'sha256:4736b6311775e7fc51740f7febfe636fce97ae26e1286c31d10cb06cf02a53b9');
  assert.equal(attestation.source_patch_sha256,
    '1e49b433f38fe901e93a2210e10c999e2ac6c86d7a026da126d1158717456c84');
  assert.equal(attestation.authorization_policy, 'CURRENT_REQUEST_VERIFIED_SEPARATELY');
  assert.deepEqual(attestation.compatible_application_paths, []);
  const intervening = [
    ...attestation.certified_protocol_executable_paths,
    ...attestation.certified_protocol_document_paths,
    ...attestation.certified_product_document_paths,
  ];
  assert.equal(intervening.some((file) => file.startsWith('app/') || file.startsWith('src/')), false);
  assert.equal(attestation.certification.package_path_count, 30);
  assert.equal(attestation.certification.claude_invoked, false);
});
