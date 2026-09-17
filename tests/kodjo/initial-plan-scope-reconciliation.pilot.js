'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
const script = path.join(root, 'scripts', 'kodjo', 'reconcile-initial-plan-prose.js');

function run(plan, matrix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-reconcile-'));
  const planFile = path.join(dir, 'plan.md');
  const matrixFile = path.join(dir, 'matrix.json');
  const outFile = path.join(dir, 'out.md');
  fs.writeFileSync(planFile, plan, 'utf8');
  fs.writeFileSync(matrixFile, JSON.stringify(matrix, null, 2), 'utf8');
  const result = spawnSync(process.execPath, [script, planFile, matrixFile, outFile], { encoding: 'utf8' });
  return { result, out: fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '' };
}

test('scope_allow prose is replaced by the canonical machine scope', () => {
  const plan = '# Plan\n\n### scope_allow proposé\n\n```text\nsrc/a.ts\n```\n\n## Tests\n\n- `src/a.test.ts`\n\n<KODJO_MODIFIED_MODULES_JSON>\n[]\n</KODJO_MODIFIED_MODULES_JSON>\n';
  const matrix = {
    scope_allow: ['src/a.test.ts', 'src/a.ts', 'src/b.ts'],
    modified_modules: [{ path: 'src/a.ts', change: 'MODIFY' }],
    rows: [
      { path: 'src/a.test.ts', classification: 'TEST_MUST_ADAPT' },
      { path: 'src/b.ts', classification: 'MODIFY' },
    ],
  };
  const { result, out } = run(plan, matrix);
  assert.equal(result.status, 0, result.stderr);
  assert.match(out, /### scope_allow machine/);
  assert.match(out, /src\/a\.test\.ts/);
  assert.match(out, /src\/a\.ts/);
  assert.match(out, /src\/b\.ts/);
  assert.doesNotMatch(out, /scope_allow proposé/);
});

test('missing TEST_MUST_ADAPT paths are added to a deterministic Tests section', () => {
  const plan = '# Plan\n\n### scope_allow\n\n```text\nsrc/a.ts\n```\n\n<KODJO_MODIFIED_MODULES_JSON>\n[]\n</KODJO_MODIFIED_MODULES_JSON>\n';
  const matrix = {
    scope_allow: ['src/a.ts', 'src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts'],
    modified_modules: [{ path: 'src/a.ts', change: 'MODIFY' }],
    rows: [
      { path: 'src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts', classification: 'TEST_MUST_ADAPT' },
    ],
  };
  const { result, out } = run(plan, matrix);
  assert.equal(result.status, 0, result.stderr);
  assert.match(out, /## Tests — fermeture d’impact machine/);
  assert.match(out, /SqliteSessionRepository\.test\.ts/);
});

test('multiple prose scope sections are rejected instead of silently normalized', () => {
  const plan = '# Plan\n\n## scope_allow A\n`src/a.ts`\n\n## scope_allow B\n`src/b.ts`\n';
  const matrix = { scope_allow: ['src/a.ts'], modified_modules: [], rows: [] };
  const { result } = run(plan, matrix);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /INITIAL_PLAN_SCOPE_RECONCILIATION/);
});
