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
    'scripts/kodjo/cleanup-run-checkout.ps1',
  ];
  for (const relative of files) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.doesNotMatch(source, /ConvertTo-Json[^\n]*Set-Content[^\n]*Encoding UTF8/, relative);
    assert.match(source, /UTF8Encoding\(\$false\)/, relative);
  }
});

test('0.6.22 — le plan distingue reprise, refus et décompte réel', () => {
  const plan = fs.readFileSync(path.join(root, '.github', 'orchestration', 'KODJO_V2_ORDINARY_PATH_CERTIFICATION_PLAN_0.1.md'), 'utf8');
  assert.match(plan, /--resume <session_id>/);
  assert.match(plan, /13 scénarios/);
  assert.match(plan, /branche \*\*distante\*\*/);
  assert.match(plan, /R5 corrige l'ancien oracle/);
  assert.match(plan, /Une IA ou un automatisme ne peut pas produire le 👍/);
});
