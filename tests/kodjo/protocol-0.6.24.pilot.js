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
