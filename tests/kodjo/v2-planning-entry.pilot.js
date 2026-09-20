'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..', '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const workflowPermissions = (workflow) => {
  const start = workflow.indexOf('permissions:\n');
  assert.notEqual(start, -1, 'workflow permissions block missing');
  const end = workflow.indexOf('\n\n', start);
  return workflow.slice(start, end === -1 ? workflow.length : end);
};

test('V2 planning uses the bootstrap and never invents a V1 manifest', () => {
  const plan = read('.github/workflows/kodjo-v2-slice-plan.yml');
  assert.match(plan, /bootstrap_path=/);
  assert.match(plan, /v2-slices\/\$SLICE_ID\/slice-bootstrap\.json/);
  assert.match(plan, /kodjo\.protocol\.v2\.slice-bootstrap/);
  assert.match(plan, /V2_SLICE_NOT_ACTIVE/);
  assert.match(plan, /Verdict.*APPROVED/);
  assert.match(plan, /START_PLAN_REVISION/);
  assert.doesNotMatch(plan, /orchestration\/slices\/\$SLICE_ID\.yml/);
});

test('V2 plan and review resolve the private target HEAD through the authenticated shared resolver', () => {
  const plan = read('.github/workflows/kodjo-v2-slice-plan.yml');
  const review = read('.github/workflows/kodjo-v2-slice-plan-review.yml');
  for (const workflow of [plan, review]) {
    assert.match(workflow, /persist-credentials:\s*false/);
    assert.match(workflow, /scripts\/kodjo\/resolve-private-head\.js/);
    assert.doesNotMatch(workflow, /git\s+(?:ls-remote|fetch|pull)\s+origin/);
  }
  assert.match(plan, /verify-plan-review-transition\.js "\$SOURCE_HEAD" "\$ACTUAL"/);
  assert.match(plan, /protocol_execution_head=/);
  assert.doesNotMatch(plan, /test "\$ACTUAL" = "\$SOURCE_HEAD"/);
  assert.match(plan, /PLAN_OID=\$\(git rev-parse/);
  assert.match(plan, /REVIEW_OID=\$\(git rev-parse/);
  assert.match(plan, /supersedes_plan_blob_oid=/);
  assert.match(plan, /prior_review_blob_oid=/);
  assert.match(review, /V2 private target branch lookup failed/);
});

test('V2 plan produces and verifies the opposable direct-import matrix', () => {
  const plan = read('.github/workflows/kodjo-v2-slice-plan.yml');
  assert.match(plan, /scan-plan-impact\.js extract-modules/);
  assert.match(plan, /assemble-plan-impact\.js close/);
  assert.match(plan, /assemble-plan-impact\.js assemble/);
  assert.match(plan, /KODJO_PLAN_DECISIONS_JSON/);
  assert.match(plan, /for iteration in 1 2 3 4/);
  assert.match(plan, /PLAN_SCOPE_NOT_CLOSED_BOUND/);
  assert.doesNotMatch(plan, /Include exactly one <KODJO_PLAN_IMPACT_JSON>/);
  assert.match(plan, /scan-plan-impact\.js"? scan "\$APPLICATION_HEAD"/);
  assert.match(plan, /verify-plan-impact\.js/);
  assert.match(plan, /planning_contract=kodjo\.plan-impact\.v1/);
  assert.match(plan, /build-planning-context\.js/);
  assert.match(read('scripts/kodjo/build-planning-context.js'), /'code-files\.txt'/);
  assert.match(plan, /derives scope_allow/);
  assert.match(plan, /full Jest, TypeScript and lint/);
});

test('V2 planning sépare le HEAD produit du HEAD applicatif de la PR ouverte', () => {
  const plan = read('.github/workflows/kodjo-v2-slice-plan.yml');
  const review = read('.github/workflows/kodjo-v2-slice-plan-review.yml');
  for (const workflow of [plan, review]) {
    assert.match(workflow, /application_pr=/);
    assert.match(workflow, /application_head=/);
    assert.match(workflow, /pulls\/\$APPLICATION_PR|pulls\/\$applicationPr/);
    assert.match(workflow, /application\.head\.sha|\.head\.sha/);
    assert.match(workflowPermissions(workflow), /^  pull-requests: read$/m);
  }
  assert.match(plan, /immutable product HEAD \$SOURCE_HEAD, protocol execution HEAD \$PROTOCOL_EXECUTION_HEAD and exact application HEAD \$APPLICATION_HEAD/);
  assert.match(plan, /scan "\$APPLICATION_HEAD"/);
  assert.match(review, /kodjo-v2-current-product-context/);
  assert.match(review, /ref: \$\{\{ steps\.gate\.outputs\.application_head \}\}/);
});

test('tout workflow qui lit une PR déclare la permission GitHub minimale', () => {
  const workflows = fs.readdirSync(path.join(root, '.github', 'workflows'))
    .filter((file) => file.endsWith('.yml'));
  for (const file of workflows) {
    const workflow = read(path.join('.github', 'workflows', file));
    if (!/gh api [^\n]*pulls\//.test(workflow)) continue;
    assert.match(workflowPermissions(workflow), /^  pull-requests: (?:read|write)$/m,
      `${file} reads the pull request API without permission`);
  }
});

test('toute lecture de fichier PowerShell du protocole V2 impose UTF-8', () => {
  const workflowDir = path.join(root, '.github', 'workflows');
  const files = [
    ...fs.readdirSync(workflowDir)
      .filter((file) => file.startsWith('kodjo-v2-') && file.endsWith('.yml'))
      .map((file) => path.join(workflowDir, file)),
    ...fs.readdirSync(path.join(root, 'scripts', 'kodjo'))
      .filter((file) => file.endsWith('.ps1'))
      .map((file) => path.join(root, 'scripts', 'kodjo', file)),
  ];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!/\bGet-Content\b/i.test(line)) return;
      assert.match(line, /-Encoding\s+UTF8\b/i,
        `${path.relative(root, file)}:${index + 1} reads text without explicit UTF-8`);
    });
  }
});

test('V2 plan closure run block is valid Bash after YAML indentation is removed', { skip: process.platform === 'win32' }, () => {
  const workflow = read('.github/workflows/kodjo-v2-slice-plan.yml');
  const marker = '      - name: Close direct-import roots and assemble opposable V2 plan';
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1);
  const runStart = workflow.indexOf('        run: |\n', start);
  assert.notEqual(runStart, -1);
  const bodyStart = runStart + '        run: |\n'.length;
  const nextStep = workflow.indexOf('\n      - name:', bodyStart);
  assert.notEqual(nextStep, -1);
  const script = workflow.slice(bodyStart, nextStep).replace(/^ {10}/gm, '');
  const checked = spawnSync('bash', ['-n'], { input: script, encoding: 'utf8' });
  assert.equal(checked.status, 0, checked.stderr);
});

test('V2 independent review replays the scan and publishes its own proof', () => {
  const review = read('.github/workflows/kodjo-v2-slice-plan-review.yml');
  assert.match(review, /START_PLAN_REVIEW/);
  assert.match(review, /Replay V2 direct-import scan independently/);
  assert.match(review, /verify-plan-impact\.js/);
  assert.match(review, /KODJO_PLAN_IMPACT_REVIEW_JSON/);
  assert.match(review, /verify-plan-review-transition\.js/);
  assert.match(review, /protocol_execution_head=/);
  assert.match(review, /KODJO_PLAN_REVIEW_TRANSITION_JSON/);
  assert.match(review, /kodjo-v2-plan-review-transition\.json/);
  assert.doesNotMatch(review, /V2 target branch moved/);
  assert.doesNotMatch(review, /orchestration\/slices\/\$slice\.yml/);
});

test('V1 and V2 planning triggers and evidence headers stay disjoint', () => {
  const genericPlan = read('.github/workflows/kodjo-slice-plan.yml');
  const genericReview = read('.github/workflows/kodjo-slice-plan-review.yml');
  const v2Plan = read('.github/workflows/kodjo-v2-slice-plan.yml');
  const v2Review = read('.github/workflows/kodjo-v2-slice-plan-review.yml');
  assert.match(genericPlan, /\[KODJO_SLICE\] START_PLAN/);
  assert.match(genericReview, /\[KODJO_SLICE\] START_PLAN_REVIEW/);
  assert.match(v2Plan, /\[KODJO_V2\] START_PLAN_REVISION/);
  assert.match(v2Review, /\[KODJO_V2\] START_PLAN_REVIEW/);
  assert.doesNotMatch(v2Plan, /\[KODJO_SLICE\]/);
  assert.doesNotMatch(v2Review, /\[KODJO_SLICE\]/);
});
