'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const Json = require('../../scripts/kodjo/lib/json');
const Local = require('../../scripts/kodjo/run-local-claude');
const Metrics = require('../../scripts/kodjo/record-infrastructure-metric');
const Identity = require('../../scripts/kodjo/lib/slice-identity');
const ProdScope = require('../../scripts/kodjo/certify-prod-qualification-scope');

test('0.6.22 — le lecteur JSON accepte un BOM historique et l écriture reste sans BOM', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-json-0622-'));
  const legacy = path.join(dir, 'legacy.json');
  fs.writeFileSync(legacy, '\uFEFF{"ok":true}\n', 'utf8');
  assert.deepEqual(Json.readJson(legacy), { ok: true });
  const current = path.join(dir, 'current.json');
  Json.writeJson(current, { ok: true });
  assert.notDeepEqual([...fs.readFileSync(current).subarray(0, 3)], [0xef, 0xbb, 0xbf]);
});

test('0.6.22 — le pathspec absent est toléré hors publication et refusé en file supervisée', () => {
  const beforeTarget = process.env.KODJO_PUBLISH_PATHSPEC_FILE;
  const beforeQueue = process.env.KODJO_SUPERVISED_QUEUE;
  const beforeActions = process.env.GITHUB_ACTIONS;
  delete process.env.KODJO_PUBLISH_PATHSPEC_FILE;
  try {
    delete process.env.KODJO_SUPERVISED_QUEUE;
    delete process.env.GITHUB_ACTIONS;
    assert.equal(Local.writePublishablePathspec(['tests/a.ts']), null);
    process.env.KODJO_SUPERVISED_QUEUE = '1';
    process.env.GITHUB_ACTIONS = 'true';
    assert.throws(() => Local.writePublishablePathspec(['tests/a.ts']), /SUPERVISED_PUBLISH_PATHSPEC_TARGET_MISSING/);
  } finally {
    if (beforeTarget === undefined) delete process.env.KODJO_PUBLISH_PATHSPEC_FILE;
    else process.env.KODJO_PUBLISH_PATHSPEC_FILE = beforeTarget;
    if (beforeQueue === undefined) delete process.env.KODJO_SUPERVISED_QUEUE;
    else process.env.KODJO_SUPERVISED_QUEUE = beforeQueue;
    if (beforeActions === undefined) delete process.env.GITHUB_ACTIONS;
    else process.env.GITHUB_ACTIONS = beforeActions;
  }
});

test('0.6.22 — les métriques de checkout sont atomiques, identifiées et sans effet sur le verdict', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-metrics-0622-'));
  const checkout = path.join(dir, 'checkout');
  fs.mkdirSync(checkout);
  fs.writeFileSync(path.join(checkout, 'sample.txt'), '12345');
  const output = path.join(dir, 'metrics.json');
  const beforeRun = process.env.GITHUB_RUN_ID;
  const beforeAttempt = process.env.GITHUB_RUN_ATTEMPT;
  process.env.GITHUB_RUN_ID = '123';
  process.env.GITHUB_RUN_ATTEMPT = '2';
  try {
    Metrics.main(['init', output, String(Date.now() - 10), '17', '1000000', checkout]);
  } finally {
    if (beforeRun === undefined) delete process.env.GITHUB_RUN_ID; else process.env.GITHUB_RUN_ID = beforeRun;
    if (beforeAttempt === undefined) delete process.env.GITHUB_RUN_ATTEMPT; else process.env.GITHUB_RUN_ATTEMPT = beforeAttempt;
  }
  const result = Json.readJson(output);
  assert.equal(result.github_run_id, '123');
  assert.equal(result.github_run_attempt, '2');
  assert.equal(result.checkout.checkout_bytes, 5);
  assert.equal(result.storage.kodjo_checkout_count_before, 17);
  assert.equal(result.storage.volume_free_bytes_before, 1000000);
  assert.equal(result.cleanup.status, 'NOT_RUN');
  assert.equal(fs.existsSync(output + '.tmp'), false);
});

test('0.6.22 — une mesure de départ absente reste non bloquante et conforme au schéma', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-metrics-missing-0622-'));
  const output = path.join(dir, 'metrics.json');
  Metrics.main(['init', output, '', '', '', path.join(dir, 'missing-checkout')]);
  const result = Json.readJson(output);
  assert.equal(result.schema_version, 'kodjo.protocol.v2.infrastructure-metrics.0.6.22');
  assert.equal(result.checkout.started_at, null);
  assert.equal(result.checkout.duration_ms, null);
  assert.equal(result.storage.kodjo_checkout_count_before, null);
  assert.equal(result.storage.volume_free_bytes_before, null);
});

test('0.6.22 — le nettoyage initialise des métriques saines si le fichier est absent', { skip: process.platform !== 'win32' }, () => {
  const { spawnSync } = require('node:child_process');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-cleanup-missing-0622-'));
  const runId = '123456';
  const checkout = path.join(dir, '_kodjo', runId);
  const output = path.join(dir, 'metrics.json');
  fs.mkdirSync(checkout, { recursive: true });
  fs.writeFileSync(path.join(checkout, 'sample.txt'), 'delta');
  const script = path.join(root, 'scripts', 'kodjo', 'cleanup-run-checkout.ps1');
  const result = spawnSync('powershell.exe', [
    '-NoLogo', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script,
    '-Root', checkout, '-WorkspaceRoot', dir, '-RunId', runId, '-MetricsFile', output,
  ], { encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(checkout), false);
  const metrics = Json.readJson(output);
  assert.equal(metrics.schema_version, 'kodjo.protocol.v2.infrastructure-metrics.0.6.22');
  assert.equal(metrics.cleanup.status, 'PASS');
  assert.equal(Object.prototype.hasOwnProperty.call(metrics.storage, 'Keys'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(metrics.storage, 'Count'), false);
  assert.equal(metrics.storage.checkout_bytes_before_cleanup, 5);
});

test('0.6.22 — les preuves sont préservées avant le nettoyage borné du checkout', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'kodjo-v2-lean-queue.yml'), 'utf8');
  const diagnostic = workflow.indexOf('Preserve KODJO diagnostic');
  const recovery = workflow.indexOf('Preserve KODJO recovery package');
  const cleanup = workflow.indexOf('Clean current run checkout');
  const metrics = workflow.indexOf('Preserve infrastructure metrics');
  assert.ok(diagnostic >= 0 && diagnostic < cleanup);
  assert.ok(recovery >= 0 && recovery < cleanup);
  assert.ok(cleanup < metrics);
  assert.match(workflow, /Clean current run checkout[\s\S]*if: always\(\)/);
  assert.match(workflow, /working-directory: \$\{\{ runner\.temp \}\}/);
  assert.match(workflow, /Le checkout peut échouer avant que l'utilitaire soit copié/);
  assert.match(workflow, /if-no-files-found: warn/);
  const cleanupScript = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'cleanup-run-checkout.ps1'), 'utf8');
  assert.match(cleanupScript, /RUN_CHECKOUT_IDENTITY_MISMATCH/);
  assert.match(cleanupScript, /\$attempt -le 5/);
  assert.match(cleanupScript, /processes referencing root/);
  assert.match(cleanupScript, /New-Object Text\.UTF8Encoding\(\$false\)/);
});

test('0.6.22 — les preuves PowerShell sont écrites en UTF-8 sans BOM', () => {
  const files = [
    'scripts/kodjo/run-disposable-qualification.ps1',
    'scripts/kodjo/run-disposable-resume-qualification.ps1',
    '.github/workflows/kodjo-v2-disposable-qualification.yml',
    '.github/workflows/kodjo-v2-pilot-tests.yml',
    '.github/workflows/kodjo-v2-lean-queue.yml',
    'scripts/kodjo/cleanup-run-checkout.ps1',
  ];
  for (const relative of files) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.doesNotMatch(source, /ConvertTo-Json[^\n]*Set-Content[^\n]*Encoding UTF8/, relative);
    assert.match(source, /UTF8Encoding\(\$false\)/, relative);
  }
});

test('0.6.22 — toute instrumentation du Lean Queue est explicitement non bloquante', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'kodjo-v2-lean-queue.yml'), 'utf8');
  const jobPreamble = workflow.slice(workflow.indexOf('jobs:'), workflow.indexOf('    steps:'));
  assert.doesNotMatch(jobPreamble, /\$\{\{\s*runner\./,
    'le contexte runner est indisponible avant l attribution du runner et ne doit pas vivre dans env du job');
  const blocks = workflow.split(/\n(?=      - (?:name:|uses:))/);
  const measurement = blocks.filter((block) => /^      - name: .*?(?:measurement|metric)/mi.test(block));
  assert.ok(measurement.length >= 3);
  for (const block of measurement) assert.match(block, /\r?\n        continue-on-error: true\r?\n/);
  assert.match(measurement[0], /AppendAllText\(\$env:GITHUB_ENV, "KODJO_INFRA_METRICS_FILE=/);
});

test('0.6.22 — le point d arrêt C4 est inactif hors V2-PROD-00 supervisé', () => {
  const enabled = Local.certificationStopAfterRecoveryEnabled;
  const request = { slice_id: 'V2-PROD-00' };
  const exact = {
    GITHUB_ACTIONS: 'true',
    KODJO_SUPERVISED_QUEUE: '1',
    KODJO_CERTIFICATION_STOP_AFTER_RECOVERY: 'V2-PROD-00',
  };
  assert.equal(enabled(request, exact), true);
  assert.equal(enabled({ slice_id: 'OTHER' }, exact), false);
  assert.equal(enabled(request, { ...exact, GITHUB_ACTIONS: 'false' }), false);
  assert.equal(enabled(request, { ...exact, KODJO_SUPERVISED_QUEUE: '0' }), false);
  assert.equal(enabled(request, { ...exact, KODJO_CERTIFICATION_STOP_AFTER_RECOVERY: '1' }), false);
});

test('0.6.22 — le résultat C4 conserve la durée de l invocation Claude', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'run-local-claude.js'), 'utf8');
  const start = source.indexOf("status: 'CONTROLLED_INTERRUPTION_AFTER_RECOVERY'");
  const end = source.indexOf('return 75;', start);
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);
  assert.match(block, /claude_started_at: claudeStartedAt/);
  assert.match(block, /claude_finished_at: claudeFinishedAt/);
  assert.match(block, /claude_duration_ms: claudeDurationMs/);
});

test('0.6.22 — le plan distingue reprise, refus et décompte réel', () => {
  const plan = fs.readFileSync(path.join(root, '.github', 'orchestration', 'KODJO_V2_ORDINARY_PATH_CERTIFICATION_PLAN_0.1.md'), 'utf8');
  assert.match(plan, /--resume <session_id>/);
  assert.match(plan, /13 scénarios/);
  assert.match(plan, /branche \*\*distante\*\*/);
  assert.match(plan, /R5 corrige l'ancien oracle/);
  assert.match(plan, /Une IA ou un automatisme ne peut pas produire le 👍/);
});

test('0.6.22 — V2-PROD-00 est activée sans demande en file et avec revue approuvée', () => {
  const sliceRoot = path.join(root, '.github', 'orchestration', 'v2-slices', 'V2-PROD-00');
  const bootstrap = Json.readJson(path.join(sliceRoot, 'slice-bootstrap.json'));
  const validated = Identity.validateBootstrap(bootstrap);
  const registry = Json.readJson(path.join(root, '.github', 'orchestration', 'v2-activation-registry.json'));
  assert.equal(Identity.validateRegistry(registry, bootstrap).status, 'ACTIVE');
  assert.equal(validated.hash, bootstrap.slice_bootstrap_sha256);
  assert.equal(bootstrap.issue_number, 79);
  assert.equal(bootstrap.baseline_head, '90a88a96d9dd6ccd80e2f0611d20c6285f02e0b2');
  const review = fs.readFileSync(path.join(sliceRoot, 'independent-review.md'), 'utf8');
  assert.match(review, /KODJO_V2_ORDINARY_PATH_CERTIFICATION_PLAN_0\.1\.md/);
  assert.match(review, /HEAD contrôlé\s*:\s*`90a88a96d9dd6ccd80e2f0611d20c6285f02e0b2`/);
  assert.match(review, /Verdict:\s*APPROVED\s*$/);
  const queued = fs.readdirSync(path.join(root, '.github', 'orchestration', 'queue', 'v2'))
    .filter((name) => name.includes('V2-PROD-00'));
  assert.deepEqual(queued, []);
});

test('0.6.22 — le préflight du périmètre productif observe Jest, TypeScript, lint et l application', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'certify-prod-qualification-scope.js'), 'utf8');
  assert.match(source, /jest[\s\S]*--listTests/);
  assert.match(source, /typescript[\s\S]*--listFiles/);
  assert.match(source, /eslint[\s\S]*--no-cache/);
  assert.match(source, /\['src', 'app'\]/);
  assert.deepEqual(ProdScope.normalizedLines('A\\b\r\nC/d\n'), ['A/b', 'C/d']);
  const canary = fs.readFileSync(path.join(root, 'tests', 'kodjo-prod-qualif', 'preflight.test.ts'), 'utf8');
  assert.doesNotMatch(canary, /(?:from|require\s*\()[^\n]*(?:src\/|app\/)/);
});
