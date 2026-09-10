'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const C = require('../../scripts/kodjo/lib/claude-local');
const L = require('../../scripts/kodjo/run-local-claude');

function fixture(overrides) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-claude-local-'));
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'docs', 'task.md'), 'Corriger la fonction ciblée.\n');
  const request = {
    schema_version: 'kodjo.protocol.v2.local-implementation.0.6.11',
    slice_id: 'SMOKE', source_head: 'a'.repeat(40), mode: 'INITIAL',
    session_id: null,
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
  assert.ok(C.DISALLOWED_TOOLS.includes('Bash(git *)'));
  assert.ok(C.DISALLOWED_TOOLS.includes('Bash(gh *)'));
  assert.ok(C.DISALLOWED_TOOLS.includes('mcp__*'));
});

test('arguments effectifs: restricted, non interactif, aucun MCP et plafond de tours', () => {
  const f = fixture();
  const req = C.normalizeRequest(f.request, f.root);
  req.generated_session_id = '550e8400-e29b-41d4-a716-446655440000';
  const args = C.buildArgs(req, f.root, 'mission');
  for (const required of ['-p', '--restricted', '--permission-prompts', 'none', '--strict-mcp-config', '--max-turns', '12']) {
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

test('requête refuse un budget supérieur au plafond', () => {
  const f = fixture({ limits: { ...C.DEFAULT_LIMITS, max_turns: 13 } });
  assert.throws(() => C.normalizeRequest(f.request, f.root), /BUDGET_INVALID_MAX_TURNS/);
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
