'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const C = require('../../scripts/kodjo/lib/claude-local');
const L = require('../../scripts/kodjo/run-local-claude');
const I = require('../../scripts/kodjo/lib/slice-identity');

function fixture(overrides) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-claude-local-'));
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'docs', 'task.md'), 'Corriger la fonction ciblée.\n');
  const bootstrapDir = path.join(root, '.github', 'orchestration', 'v2-slices', 'SMOKE');
  fs.mkdirSync(bootstrapDir, { recursive: true });
  const bootstrap = { schema_version: I.BOOTSTRAP_SCHEMA, slice_id: 'SMOKE', issue_number: 1, repository: 'MyUncried/Application-Routine', target_branch: 'main', baseline_head: 'a'.repeat(40), protocol_version: '0.6.12', protocol_commit: 'b'.repeat(40), activation_registry: '.github/orchestration/v2-activation-registry.json', previous_slice_id: null, previous_checkpoint: null, product_sources: [{ path: 'docs/task.md', sha256: 'c'.repeat(64) }], authorized_actors: ['user', 'claude-local'], created_at: '2026-09-10T18:00:00.000Z' };
  bootstrap.slice_bootstrap_sha256 = I.sha256(I.canonical(bootstrap));
  fs.writeFileSync(path.join(bootstrapDir, 'slice-bootstrap.json'), JSON.stringify(bootstrap));
  fs.writeFileSync(path.join(root, '.github', 'orchestration', 'v2-activation-registry.json'), JSON.stringify({ schema_version: I.REGISTRY_SCHEMA, activations: [{ slice_id: 'SMOKE', status: 'ACTIVE', issue_number: 1, baseline_head: 'a'.repeat(40), bootstrap_path: '.github/orchestration/v2-slices/SMOKE/slice-bootstrap.json', slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256 }] }));
  const request = {
    schema_version: 'kodjo.protocol.v2.local-implementation.0.6.12',
    slice_id: 'SMOKE', source_head: 'a'.repeat(40), baseline_head: 'a'.repeat(40), slice_bootstrap_file: '.github/orchestration/v2-slices/SMOKE/slice-bootstrap.json', slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256, mode: 'INITIAL',
    session_id: null,
    request_id: '550e8400-e29b-41d4-a716-446655440001',
    prompt_file: 'docs/task.md', scope_allow: ['src/**', 'tests/**'],
    checks: ['jest', 'typescript', 'lint'], limits: { ...C.DEFAULT_LIMITS },
    ...(overrides || {}),
  };
  return { root, request };
}

test('configuration Claude figée, bornée et hashée de façon stable', () => {
  const cfg = C.adapterConfig();
  assert.equal(cfg.claude_code_version, '2.1.263');
  assert.equal(cfg.limits.max_ai_calls, 1);
  assert.equal(cfg.limits.max_rollovers, 0);
  assert.match(C.adapterConfigHash(), /^[0-9a-f]{64}$/);
  assert.equal(C.adapterConfigHash(), C.adapterConfigHash());
});

test('surface positive: outils fichiers et commandes de contrôle seulement', () => {
  assert.equal(C.TOOL_SURFACE, 'Read,Edit,Write,Glob,Grep,Bash');
  assert.ok(C.ALLOWED_TOOLS.includes('Bash(node {KODJO_CHECK_RUNNER} jest)'));
  assert.ok(C.ALLOWED_TOOLS.includes('Bash(node {KODJO_CHECK_RUNNER} typescript)'));
  assert.ok(C.ALLOWED_TOOLS.includes('Bash(node {KODJO_CHECK_RUNNER} lint)'));
  assert.ok(C.ALLOWED_TOOLS.includes('Bash(git status)'));
  assert.ok(C.ALLOWED_TOOLS.includes('Bash(git log:*)'));
  assert.ok(C.ALLOWED_TOOLS.includes('Bash(git diff:*)'));
  assert.ok(!C.DISALLOWED_TOOLS.includes('Bash(git *)'));
  assert.ok(C.DISALLOWED_TOOLS.includes('Bash(gh *)'));
  assert.ok(C.DISALLOWED_TOOLS.includes('mcp__*'));
});

test('arguments effectifs: restricted, non interactif, aucun MCP et plafond de tours', () => {
  const f = fixture();
  const req = C.normalizeRequest(f.request, f.root);
  req.generated_session_id = '550e8400-e29b-41d4-a716-446655440000';
  const args = C.buildArgs(req, f.root, 'mission');
  for (const required of ['-p', '--restricted', '--permission-prompts', 'none', '--strict-mcp-config', '--max-turns', '40']) {
    assert.ok(args.includes(required), required);
  }
  assert.ok(!args.includes('--dangerously-skip-permissions'));
  assert.ok(!args.includes('--allow-dangerously-skip-permissions'));
  assert.ok(args.includes('--session-id'));
});

test('prompt impose la boucle interne test diagnostic correction relance', () => {
  const f = fixture();
  const req = C.normalizeRequest(f.request, f.root);
  const prompt = C.buildPrompt(req, 'Faire la correction demandée.', f.root);
  assert.match(prompt, /Si un contrôle échoue, lire son erreur, corriger/);
  assert.match(prompt, /puis relancer ce contrôle/);
  assert.match(prompt, /Ne jamais affaiblir, supprimer ou contourner un test/);
  assert.match(prompt, /Ne créer ni commit, branche, tag, stash ou push/);
  assert.match(prompt, /kodjo-check-runner\.js/);
  assert.match(prompt, /exactement telle .*sans redirection.*commande supplémentaire/);
});

test('les commandes autorisées passent uniquement par le runner externe figé', () => {
  const f = fixture();
  const tools = C.concreteAllowedTools(f.root);
  assert.ok(tools.some((v) => /^Bash\(node ".*kodjo-check-runner\.js" jest\)$/.test(v)));
  assert.ok(tools.every((v) => !/^Bash\(npm /.test(v)));
});

test('requête refuse un périmètre parent ou absolu', () => {
  for (const scope of [['../src/**'], ['/tmp/**'], ['C:\\Dev\\**']]) {
    const f = fixture({ scope_allow: scope });
    assert.throws(() => C.normalizeRequest(f.request, f.root), /SCOPE_ALLOW_INVALID/);
  }
});

test('requête accepte une extension bornée et refuse un budget supérieur au plafond', () => {
  let f = fixture({ limits: { ...C.DEFAULT_LIMITS, max_turns: 50 } });
  assert.equal(C.normalizeRequest(f.request, f.root).limits.max_turns, 50);
  f = fixture({ limits: { ...C.DEFAULT_LIMITS, max_turns: 51 } });
  assert.throws(() => C.normalizeRequest(f.request, f.root), /BUDGET_INVALID_MAX_TURNS/);
});

test('request_id est obligatoire et transmis sans modification', () => {
  const f = fixture();
  assert.equal(C.normalizeRequest(f.request, f.root).request_id, f.request.request_id);
  const missing = fixture({ request_id: undefined });
  assert.throws(() => C.normalizeRequest(missing.request, missing.root), /REQUEST_ID_INVALID/);
});

test('requête refuse une seconde invocation ou un rollover implicite', () => {
  let f = fixture({ limits: { ...C.DEFAULT_LIMITS, max_ai_calls: 0 } });
  assert.throws(() => C.normalizeRequest(f.request, f.root), /BUDGET_NOT_SINGLE_INVOCATION/);
  f = fixture({ limits: { ...C.DEFAULT_LIMITS, max_rollovers: 1 } });
  assert.throws(() => C.normalizeRequest(f.request, f.root), /BUDGET_INVALID_MAX_ROLLOVERS/);
});

test('RESUME_DELTA exige et reprend la même session UUID', () => {
  const session = '550e8400-e29b-41d4-a716-446655440000';
  const f = fixture({ mode: 'RESUME_DELTA', session_id: session });
  const req = C.normalizeRequest(f.request, f.root);
  const args = C.buildArgs(req, f.root, 'delta');
  assert.equal(args[args.indexOf('--resume') + 1], session);
  assert.ok(!args.includes('--session-id'));
  const bad = fixture({ mode: 'RESUME_DELTA', session_id: null });
  assert.throws(() => C.normalizeRequest(bad.request, bad.root), /RESUME_SESSION_ID_INVALID/);
});

test('authentification, quota et timeout Claude ont des diagnostics distincts', () => {
  assert.equal(C.classifyClaudeFailure({ status: 1, stderr: 'OAuth token expired' }), 'KODJO-V2-CLAUDE-AUTH');
  assert.equal(C.classifyClaudeFailure({ status: 1, stderr: 'usage limit resets at 08:00' }), 'KODJO-V2-CLAUDE-USAGE-LIMIT');
  assert.equal(C.classifyClaudeFailure({ status: null, stderr: '' }), 'KODJO-V2-CLAUDE-TIMEOUT');
  assert.equal(C.classifyClaudeFailure({ status: 0, stderr: '' }), null);
});

test('requête refuse un prompt hors dépôt', () => {
  const f = fixture({ prompt_file: path.join(os.tmpdir(), 'outside.md') });
  fs.writeFileSync(f.request.prompt_file, 'outside');
  assert.throws(() => C.normalizeRequest(f.request, f.root), /PROMPT_FILE_INVALID/);
});

test('contrôle de périmètre reconnaît récursif, direct et refuse le voisin', () => {
  assert.equal(L.inScope('src/a/b.ts', ['src/**']), true);
  assert.equal(L.inScope('README.md', ['README.md']), true);
  assert.equal(L.inScope('scripts/a.js', ['src/**', 'tests/**']), false);
});

test('RESUME_DELTA restaure exactement le paquet de reprise de la même session', () => {
  const f = fixture();
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-recovery-state-'));
  const runDir = path.join(stateRoot, 'runs', 'SMOKE-1');
  const target = path.join(f.root, 'src', 'restored.ts');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(target, 'version-restaurée\n');
  f.request.generated_session_id = '550e8400-e29b-41d4-a716-446655440000';
  L.writeRecovery(runDir, f.root, f.request, ['src/restored.ts'], { runId: 'SMOKE-1' });
  fs.writeFileSync(target, 'version-propre\n');
  const resume = { ...f.request, mode: 'RESUME_DELTA', session_id: f.request.generated_session_id };
  delete resume.generated_session_id;
  const restored = L.restoreRecovery(stateRoot, f.root, resume);
  assert.deepEqual(restored.files, ['src/restored.ts']);
  assert.equal(restored.legacyBootstrap, null);
  assert.equal(fs.readFileSync(target, 'utf8'), 'version-restaurée\n');
});

test('RESUME_DELTA refuse un paquet capté sur un autre source_head', () => {
  // KV2-05 : les entrées sont des contenus de fichiers entiers. Restaurer un
  // paquet d'une autre révision écrasait silencieusement une évolution amont.
  const f = fixture();
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-recovery-head-'));
  const runDir = path.join(stateRoot, 'runs', 'SMOKE-1');
  fs.mkdirSync(runDir, { recursive: true });
  fs.mkdirSync(path.join(f.root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(f.root, 'src', 'restored.ts'), 'x\n');
  f.request.generated_session_id = '550e8400-e29b-41d4-a716-446655440000';
  L.writeRecovery(runDir, f.root, f.request, ['src/restored.ts'], { runId: 'SMOKE-1' });
  const resume = {
    ...f.request, mode: 'RESUME_DELTA', session_id: f.request.generated_session_id,
    source_head: 'd'.repeat(40),
  };
  delete resume.generated_session_id;
  assert.throws(() => L.restoreRecovery(stateRoot, f.root, resume), /RECOVERY_NOT_FOUND/);
});

test('un paquet tronqué est ignoré au profit d’un paquet valide antérieur', () => {
  // KV2-04 : une écriture partielle du paquet le plus récent empoisonnait
  // définitivement la reprise, y compris quand un paquet valide subsistait.
  const f = fixture();
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-recovery-trunc-'));
  const target = path.join(f.root, 'src', 'restored.ts');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, 'version-valide\n');
  f.request.generated_session_id = '550e8400-e29b-41d4-a716-446655440000';
  const older = path.join(stateRoot, 'runs', 'SMOKE-old');
  fs.mkdirSync(older, { recursive: true });
  L.writeRecovery(older, f.root, f.request, ['src/restored.ts'], { runId: 'SMOKE-old' });
  const newer = path.join(stateRoot, 'runs', 'SMOKE-new');
  fs.mkdirSync(newer, { recursive: true });
  const truncated = fs.readFileSync(path.join(older, 'recovery.json'), 'utf8').slice(0, 120);
  fs.writeFileSync(path.join(newer, 'recovery.json'), truncated);
  fs.utimesSync(path.join(newer, 'recovery.json'), new Date(), new Date(Date.now() + 10000));
  fs.writeFileSync(target, 'version-écrasée\n');
  const resume = { ...f.request, mode: 'RESUME_DELTA', session_id: f.request.generated_session_id };
  delete resume.generated_session_id;
  assert.deepEqual(L.restoreRecovery(stateRoot, f.root, resume).files, ['src/restored.ts']);
  assert.equal(fs.readFileSync(target, 'utf8'), 'version-valide\n');
});

test('un paquet REFS_MUTATED est conservé mais jamais restauré', () => {
  const f = fixture();
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-recovery-mutated-'));
  const runDir = path.join(stateRoot, 'runs', 'SMOKE-1');
  fs.mkdirSync(runDir, { recursive: true });
  fs.mkdirSync(path.join(f.root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(f.root, 'src', 'restored.ts'), 'x\n');
  f.request.generated_session_id = '550e8400-e29b-41d4-a716-446655440000';
  L.writeRecovery(runDir, f.root, f.request, ['src/restored.ts'],
    { runId: 'SMOKE-1', integrityStatus: 'REFS_MUTATED' });
  assert.equal(fs.existsSync(path.join(runDir, 'recovery.json')), true, 'le paquet reste conservé');
  const resume = { ...f.request, mode: 'RESUME_DELTA', session_id: f.request.generated_session_id };
  delete resume.generated_session_id;
  assert.throws(() => L.restoreRecovery(stateRoot, f.root, resume), /RECOVERY_INTEGRITY_REFUSED/);
});

test('un lien symbolique dans le périmètre est refusé, jamais capturé', () => {
  // KV2-15 : `statSync` suivait le lien et embarquait un contenu hors dépôt.
  const f = fixture();
  const outside = path.join(os.tmpdir(), 'kodjo-outside-' + Date.now() + '.txt');
  fs.writeFileSync(outside, 'SECRET\n');
  fs.mkdirSync(path.join(f.root, 'src'), { recursive: true });
  const link = path.join(f.root, 'src', 'lien.ts');
  try { fs.symlinkSync(outside, link); } catch (_) { return; }
  f.request.generated_session_id = '550e8400-e29b-41d4-a716-446655440000';
  assert.throws(
    () => L.recoveryPayload(f.root, f.request, ['src/lien.ts'], { runId: 'X' }),
    /RECOVERY_NOT_A_REGULAR_FILE/
  );
});

test('migration autorise une seule amorce explicite depuis un résultat antérieur sans recovery', () => {
  const session = '550e8400-e29b-41d4-a716-446655440000';
  const f = fixture({ mode: 'RESUME_DELTA', session_id: session, allow_legacy_recovery_bootstrap: true });
  const request = C.normalizeRequest(f.request, f.root);
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-legacy-recovery-'));
  const runDir = path.join(stateRoot, 'runs', 'SMOKE-legacy');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    run_id: 'SMOKE-123',
    session_id: session,
    modified_files: ['src/legacy.ts'],
  }));
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    run_id: 'SMOKE-123',
    session_id: session,
    source_head: request.source_head,
    modified_files: ['src/legacy.ts'],
  }));

  // KV2-08 : l'amorce est disponible mais N'EST PAS consommée par la restauration.
  // Un échec avant production du premier paquet ne doit pas la brûler.
  const first = L.restoreRecovery(stateRoot, f.root, request);
  assert.deepEqual(first.files, []);
  assert.notEqual(first.legacyBootstrap, null);
  const second = L.restoreRecovery(stateRoot, f.root, request);
  assert.notEqual(second.legacyBootstrap, null, 'toujours disponible après un échec précoce');

  // Elle n'est consommée qu'après production, et une seule fois.
  L.consumeLegacyBootstrap(stateRoot, request, first.legacyBootstrap, 'SMOKE-run-1');
  assert.throws(() => L.restoreRecovery(stateRoot, f.root, request), /LEGACY_RECOVERY_BOOTSTRAP_ALREADY_USED/);
  assert.throws(
    () => L.consumeLegacyBootstrap(stateRoot, request, first.legacyBootstrap, 'SMOKE-run-2'),
    /LEGACY_RECOVERY_BOOTSTRAP_ALREADY_USED/
  );
});

test('amorce historique exige un booléen explicite', () => {
  const f = fixture({ allow_legacy_recovery_bootstrap: 'yes' });
  assert.throws(() => C.normalizeRequest(f.request, f.root), /LEGACY_RECOVERY_BOOTSTRAP_INVALID/);
});

test('RESUME_DELTA refuse un paquet absent, altéré ou hors périmètre', () => {
  const f = fixture({ mode: 'RESUME_DELTA', session_id: '550e8400-e29b-41d4-a716-446655440000' });
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-recovery-refusal-'));
  assert.throws(() => L.restoreRecovery(stateRoot, f.root, f.request), /RECOVERY_NOT_FOUND/);
  const runDir = path.join(stateRoot, 'runs', 'SMOKE-1');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'recovery.json'), JSON.stringify({
    schema_version: L.RECOVERY_SCHEMA,
    slice_id: 'SMOKE',
    session_id: f.request.session_id,
    baseline_head: f.request.baseline_head,
    source_head: f.request.source_head,
    integrity_status: 'INTACT',
    entries: [{ path: 'docs/task.md', deleted: false, sha256: '0'.repeat(64), content_base64: '' }],
  }));
  assert.throws(() => L.restoreRecovery(stateRoot, f.root, f.request), /RECOVERY_SCOPE_VIOLATION/);
});

test('le jeton OAuth est expurgé des traces', () => {
  const before = process.env.CLAUDE_CODE_OAUTH_TOKEN;
  process.env.CLAUDE_CODE_OAUTH_TOKEN = 'secret-token-never-log';
  assert.equal(C.redact('x secret-token-never-log y'), 'x [REDACTED] y');
  if (before === undefined) delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
  else process.env.CLAUDE_CODE_OAUTH_TOKEN = before;
});

test('scripts PowerShell stockent le jeton via DPAPI et le retirent après exécution', () => {
  const root = path.resolve(__dirname, '..', '..');
  const setup = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'setup-kodjo-claude-auth.ps1'), 'utf8');
  const start = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'start-kodjo-v2.ps1'), 'utf8');
  assert.match(setup, /ConvertFrom-SecureString/);
  assert.match(start, /ConvertTo-SecureString/);
  assert.match(start, /ZeroFreeBSTR/);
  assert.match(start, /Remove-Item Env:CLAUDE_CODE_OAUTH_TOKEN/);
  assert.doesNotMatch(setup, /SetEnvironmentVariable/);
});

test('constructeur PowerShell 0.6.12 est syntaxiquement intact et lie le bootstrap une seule fois', () => {
  const root = path.resolve(__dirname, '..', '..');
  const source = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'create-kodjo-v2-request.ps1'), 'utf8');
  assert.equal((source.match(/\$promptAbsolute\s*=\s*if/g) || []).length, 1);
  assert.equal((source.match(/slice_bootstrap_sha256\s*=\s*\$bootstrapHash/g) || []).length, 1);
  assert.match(source, /validate-slice-bootstrap\.js.*\$bootstrapRelative.*\$head/);
  assert.doesNotMatch(source, /\{64\}\$promptAbsolute/);
});


/** Dépôt Git réel : le paquet transportable manipule un vrai index. */
function gitFixture() {
  const { spawnSync } = require('node:child_process');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-git-fixture-'));
  const git = (args) => {
    const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    assert.equal(r.status, 0, 'git ' + args.join(' ') + ': ' + r.stderr);
    return r.stdout.trim();
  };
  git(['init', '-q', '.']);
  git(['config', 'user.email', 'pkg@test.local']);
  git(['config', 'user.name', 'pkg']);
  git(['config', 'core.autocrlf', 'false']);
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.mkdirSync(path.join(root, 'secrets'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'app.ts'), 'v1\n');
  fs.writeFileSync(path.join(root, 'secrets', '.gitkeep'), '');
  git(['add', '-A']);
  git(['commit', '-qm', 'base']);
  return {
    root,
    request: {
      slice_id: 'PKG', source_head: git(['rev-parse', 'HEAD']),
      baseline_head: 'e'.repeat(40), scope_allow: ['src/**'],
    },
  };
}

/* ================================================================== *
 * Paquet de reprise transportable — KV2-03
 * ================================================================== */

test('le paquet de reprise est un patch borné, hashé et lié à sa révision', () => {
  const g = gitFixture();
  const request = { ...g.request, generated_session_id: '550e8400-e29b-41d4-a716-446655440000' };
  fs.writeFileSync(path.join(g.root, 'src', 'app.ts'), 'v2\n');
  fs.writeFileSync(path.join(g.root, 'src', 'nouveau.ts'), 'neuf\n');
  fs.writeFileSync(path.join(g.root, 'secrets', 'intrus.ts'), 'hors\n');
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-pkg-run-'));
  const built = L.writeRecoveryPackage(runDir, g.root, request,
    ['src/app.ts', 'src/nouveau.ts', 'secrets/intrus.ts'], { runId: 'PKG-1' });

  // Le patch est borné au périmètre : l'intrus n'y figure pas.
  assert.deepEqual(built.manifest.paths, ['src/app.ts', 'src/nouveau.ts']);
  const patch = fs.readFileSync(path.join(built.dir, 'implementation.patch'), 'utf8');
  assert.equal(patch.includes('secrets/intrus.ts'), false);
  assert.match(patch, /src\/nouveau\.ts/);
  assert.equal(built.manifest.source_head, request.source_head);
  assert.equal(built.manifest.patch_sha256.length, 64);
});

test('la reprise depuis l’artefact restaure exactement le delta', () => {
  const g = gitFixture();
  const request = { ...g.request, generated_session_id: '550e8400-e29b-41d4-a716-446655440000' };
  fs.writeFileSync(path.join(g.root, 'src', 'app.ts'), 'modifié\n');
  fs.writeFileSync(path.join(g.root, 'src', 'nouveau.ts'), 'neuf\n');
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-pkg-run-'));
  const built = L.writeRecoveryPackage(runDir, g.root, request,
    ['src/app.ts', 'src/nouveau.ts'], { runId: 'PKG-1' });

  // Le dépôt est ramené à son état d'origine : le disque local a « disparu ».
  fs.writeFileSync(path.join(g.root, 'src', 'app.ts'), 'v1\n');
  fs.unlinkSync(path.join(g.root, 'src', 'nouveau.ts'));

  const resume = { ...request, mode: 'RESUME_DELTA', session_id: request.generated_session_id };
  delete resume.generated_session_id;
  assert.deepEqual(L.restoreFromPackage(built.dir, g.root, resume).sort(),
    ['src/app.ts', 'src/nouveau.ts']);
  assert.equal(fs.readFileSync(path.join(g.root, 'src', 'app.ts'), 'utf8'), 'modifié\n');
  assert.equal(fs.readFileSync(path.join(g.root, 'src', 'nouveau.ts'), 'utf8'), 'neuf\n');
});

test('un paquet transportable altéré ou d’une autre révision est refusé', () => {
  const g = gitFixture();
  const request = { ...g.request, generated_session_id: '550e8400-e29b-41d4-a716-446655440000' };
  fs.writeFileSync(path.join(g.root, 'src', 'app.ts'), 'v2\n');
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-pkg-run-'));
  const built = L.writeRecoveryPackage(runDir, g.root, request, ['src/app.ts'], { runId: 'PKG-1' });
  const resume = { ...request, mode: 'RESUME_DELTA', session_id: request.generated_session_id };
  delete resume.generated_session_id;

  assert.throws(
    () => L.restoreFromPackage(built.dir, g.root, { ...resume, source_head: 'd'.repeat(40) }),
    /RECOVERY_SOURCE_HEAD_MISMATCH/
  );

  fs.appendFileSync(path.join(built.dir, 'implementation.patch'), '\n');
  assert.throws(() => L.restoreFromPackage(built.dir, g.root, resume), /RECOVERY_PACKAGE_DIGEST_MISMATCH/);
});

test('une application partielle est refusée, jamais tentée en 3-way', () => {
  const g = gitFixture();
  const request = { ...g.request, generated_session_id: '550e8400-e29b-41d4-a716-446655440000' };
  fs.writeFileSync(path.join(g.root, 'src', 'app.ts'), 'v2\n');
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-pkg-run-'));
  const built = L.writeRecoveryPackage(runDir, g.root, request, ['src/app.ts'], { runId: 'PKG-1' });
  // Le fichier a diverge : le patch ne s'applique plus proprement.
  fs.writeFileSync(path.join(g.root, 'src', 'app.ts'), 'contenu-amont-different\n');
  const resume = { ...request, mode: 'RESUME_DELTA', session_id: request.generated_session_id };
  delete resume.generated_session_id;
  assert.throws(() => L.restoreFromPackage(built.dir, g.root, resume), /RECOVERY_PARTIAL_APPLY_REFUSED/);
  // Le dépôt n'a pas été modifié par la tentative.
  assert.equal(fs.readFileSync(path.join(g.root, 'src', 'app.ts'), 'utf8'), 'contenu-amont-different\n');
});
