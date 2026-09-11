'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Lock = require('../../scripts/kodjo/lib/execution-lock');
const GitRead = require('../../scripts/kodjo/kodjo-git-read');
const Run = require('../../scripts/kodjo/initialize-run-diagnostic');
const Resolver = require('../../scripts/kodjo/resolve-run-directory');

const alive = (started_at = '2026-09-11T10:00:00.000Z') => () => ({ state: 'ALIVE', started_at });
const identity = { run_id: 'github-13-1', request_id: '550e8400-e29b-41d4-a716-446655440001', session_id: '550e8400-e29b-41d4-a716-446655440000', github_run_id: '13', github_run_attempt: '1' };

test('verrou: acquisition et libération nominales', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-lock-'));
  const handle = Lock.acquire(path.join(root, 'lock'), identity, alive());
  assert.equal(handle.disposition, 'ACQUIRED');
  assert.equal(Lock.release(handle), true);
  assert.equal(fs.existsSync(handle.path), false);
});

test('verrou: finally après erreur libère le propriétaire exact', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-lock-error-'));
  let handle;
  assert.throws(() => { try { handle = Lock.acquire(path.join(root, 'lock'), identity, alive()); throw new Error('controlled'); } finally { Lock.release(handle); } }, /controlled/);
  assert.equal(fs.existsSync(path.join(root, 'lock')), false);
});

test('verrou: annulation simulée libère seulement le jeton propriétaire', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-lock-cancel-'));
  const handle = Lock.acquire(path.join(root, 'lock'), identity, alive());
  const impostor = { path: handle.path, record: { ...handle.record, token: 'autre' } };
  assert.equal(Lock.release(impostor), false);
  assert.equal(Lock.release(handle), true);
});

test('verrou: résiduel remplacé seulement si propriétaire démontré absent', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-lock-stale-'));
  const file = path.join(root, 'lock');
  const first = Lock.acquire(file, identity, alive('old'));
  let calls = 0;
  const second = Lock.acquire(file, { ...identity, run_id: 'github-14-1' }, () => (++calls === 1 ? { state: 'ALIVE', started_at: 'new' } : { state: 'DEAD', evidence: 'ABSENT' }));
  assert.equal(second.disposition, 'STALE_REPLACED');
  assert.notEqual(first.record.token, second.record.token);
  Lock.release(second);
});

test('verrou: processus vivant, PID réutilisé et état ambigu', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-lock-state-'));
  const file = path.join(root, 'lock');
  const first = Lock.acquire(file, identity, alive('old'));
  assert.throws(() => Lock.acquire(file, identity, alive('old')), /ALREADY_ACTIVE/);
  let ambiguousCalls = 0;
  assert.throws(() => Lock.acquire(file, identity, () => (++ambiguousCalls === 1 ? { state: 'ALIVE', started_at: 'new' } : { state: 'AMBIGUOUS' })), /LOCK_AMBIGUOUS/);
  let reusedCalls = 0;
  const reused = Lock.acquire(file, identity, () => (++reusedCalls === 1 ? { state: 'ALIVE', started_at: 'new' } : { state: 'ALIVE', started_at: 'new' }));
  assert.equal(reused.disposition, 'PID_REUSED_REPLACED');
  Lock.release(reused);
  assert.equal(Lock.release(first), false);
});

test('verrou hérité vide: remplacé seulement si aucun Claude n est actif', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-lock-legacy-'));
  const file = path.join(root, 'lock');
  fs.writeFileSync(file, '');
  const replaced = Lock.acquire(file, identity, alive('new'), () => ({ state: 'NONE' }));
  assert.equal(replaced.disposition, 'LEGACY_STALE_REPLACED');
  Lock.release(replaced);
  fs.writeFileSync(file, '');
  assert.throws(() => Lock.acquire(file, identity, alive('new'), () => ({ state: 'ACTIVE' })), /LOCK_AMBIGUOUS/);
});

test('scanner Windows: ne se détecte pas lui-même et reconnaît seulement une identité Claude positive', () => {
  const inspector = 700;
  const markers = ['c:\\users\\hadjo\\appdata\\roaming\\npm\\node_modules\\@anthropic-ai\\claude-code'];
  const rows = [
    { ProcessId: inspector, ParentProcessId: 1, Name: 'node.exe', CommandLine: 'node run-local-claude.js' },
    { ProcessId: 701, ParentProcessId: inspector, Name: 'powershell.exe', CommandLine: "scanner avec @anthropic-ai\\claude-code\\ dans son argument" },
    { ProcessId: 702, ParentProcessId: 1, Name: 'node.exe', CommandLine: 'node ordinary-claude-notes.js' },
    { ProcessId: 704, ParentProcessId: 1, Name: 'claude.exe', ExecutablePath: 'C:\\Users\\hadjo\\.vscode\\extensions\\anthropic.claude-code\\claude.exe', CommandLine: 'claude.exe --resume=foreign' },
  ];
  assert.deepEqual(Lock.classifyClaudeProcesses(rows, inspector, markers), []);
  rows.push({ ProcessId: 703, ParentProcessId: 1, Name: 'node.exe', CommandLine: 'node C:\\Users\\hadjo\\AppData\\Roaming\\npm\\node_modules\\@anthropic-ai\\claude-code\\cli.js' });
  assert.deepEqual(Lock.classifyClaudeProcesses(rows, inspector, markers).map((row) => row.ProcessId), [703]);
  assert.doesNotMatch(Lock.windowsProcessSnapshot.toString(), /anthropic-ai|claude-code|claude\\.exe/i);
});

test('scanner Windows: sortie CIM invalide reste ambiguë', () => {
  assert.equal(Lock.parseWindowsSnapshot('{').state, 'AMBIGUOUS');
});

test('diagnostic: résolution exclusivement par run GitHub courant', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-run-'));
  const oldEnv = { GITHUB_RUN_ID: '12', GITHUB_RUN_ATTEMPT: '1' };
  const nowEnv = { GITHUB_RUN_ID: '13', GITHUB_RUN_ATTEMPT: '1' };
  Run.initialize(root, oldEnv);
  const current = Run.initialize(root, nowEnv);
  fs.utimesSync(path.join(root, 'runs', 'github-12-1'), new Date(), new Date(Date.now() + 10000));
  assert.equal(Resolver.resolve(root, nowEnv), current.runDir);
  assert.equal(Resolver.resolve(root, { GITHUB_RUN_ID: '14', GITHUB_RUN_ATTEMPT: '1' }), '');
  const result = JSON.parse(fs.readFileSync(path.join(current.runDir, 'result.json'), 'utf8'));
  assert.equal(result.claude_invoked, false);
  assert.equal(result.recovery_package, undefined);
});

test('Git lecture: commandes et arguments sûrs acceptés', () => {
  for (const args of [['status', '--short'], ['diff', '--', 'src/a b.ts'], ['log', '-5', '--oneline'], ['show', 'HEAD:src/a.ts'], ['rev-parse', 'HEAD'], ['ls-files', '--', 'src/a.ts']]) {
    assert.deepEqual(GitRead.validateArgs(args), args);
  }
});

test('Git lecture: mutations, options dangereuses et chaînage refusés', () => {
  for (const args of [['add', '.'], ['commit', '-m', 'x'], ['push'], ['reset', '--hard'], ['checkout', 'x'], ['switch', '-c', 'x'], ['branch', '-D', 'x'], ['config', 'x', 'y'], ['status;git', 'add'], ['status', '&&', 'git', 'add'], ['log', '--exec-path=/tmp']]) {
    assert.throws(() => GitRead.validateArgs(args), /REFUSED/);
  }
});

test('workflow lie initialisation, diagnostic et artefact au run courant', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '..', '..', '.github', 'workflows', 'kodjo-v2-lean-queue.yml'), 'utf8');
  assert.match(workflow, /Initialize current run diagnostic/);
  assert.match(workflow, /kodjo-v2-diagnostic-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/);
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'kodjo', 'resolve-run-directory.js'), 'utf8'), /mtimeMs/);
});
