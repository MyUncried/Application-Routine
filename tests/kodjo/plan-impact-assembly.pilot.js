'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { assemblePlanImpact, expandModifiedRoots } = require('../../scripts/kodjo/assemble-plan-impact');
const { SCAN_SCHEMA, extractTaggedJson, sha256 } = require('../../scripts/kodjo/lib/plan-impact');

const REVISION = 'a'.repeat(40);

function scan() {
  return {
    schema: SCAN_SCHEMA,
    scan_revision: REVISION,
    application_tree_sha256: 'b'.repeat(64),
    modified_modules: [
      { path: 'src/features/sessions/SessionDraftContext.tsx', change: 'MODIFY' },
      { path: 'src/features/sessions/SessionDraftProvider.tsx', change: 'MODIFY' },
    ],
    candidates: [
      {
        path: 'app/__tests__/creationLayout.test.tsx',
        candidate_kind: 'TEST',
        triggered_by: [
          'src/features/sessions/SessionDraftContext.tsx',
          'src/features/sessions/SessionDraftProvider.tsx',
        ],
        risk_score: 112,
      },
      {
        path: 'app/(creation)/_layout.tsx',
        candidate_kind: 'CONSUMER',
        triggered_by: ['src/features/sessions/SessionDraftProvider.tsx'],
        risk_score: 0,
      },
    ],
  };
}

function plan(decisions) {
  return [
    '# Plan',
    '<KODJO_PLAN_DECISIONS_JSON>',
    JSON.stringify(decisions, null, 2),
    '</KODJO_PLAN_DECISIONS_JSON>',
    'PLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW',
    '',
  ].join('\n');
}

function validDecisions() {
  return [
    {
      path: 'app/__tests__/creationLayout.test.tsx',
      classification: 'TEST_MUST_ADAPT',
      justification: 'Le test observe directement les deux fournisseurs modifies.',
    },
    {
      path: 'app/(creation)/_layout.tsx',
      classification: 'CONSUMER_UNAFFECTED',
      justification: 'Le montage du fournisseur conserve le meme contrat.',
    },
  ];
}

function throwsCode(fn, code) {
  assert.throws(fn, (error) => error && error.code === code && error.message.startsWith(code));
}

test('assembler preserves overlapping creationLayout evidence byte-for-byte from the scan', () => {
  const evidence = scan();
  const assembled = assemblePlanImpact(plan(validDecisions()), evidence);
  const matrix = extractTaggedJson(assembled.markdown, 'KODJO_PLAN_IMPACT_JSON');
  const row = matrix.rows.find((entry) => entry.path === 'app/__tests__/creationLayout.test.tsx');

  assert.deepEqual(row.triggered_by, evidence.candidates[0].triggered_by);
  assert.equal(row.candidate_kind, evidence.candidates[0].candidate_kind);
  assert.equal(row.risk_score, evidence.candidates[0].risk_score);
  assert.equal(matrix.scan_revision, evidence.scan_revision);
  assert.equal(matrix.scan_sha256, sha256(evidence));
  assert.deepEqual(matrix.modified_modules, evidence.modified_modules);
  assert.deepEqual(matrix.scope_allow, [
    'app/__tests__/creationLayout.test.tsx',
    'src/features/sessions/SessionDraftContext.tsx',
    'src/features/sessions/SessionDraftProvider.tsx',
  ]);
  assert.doesNotMatch(assembled.markdown, /KODJO_PLAN_DECISIONS_JSON/);
});

test('model decisions cannot carry or override deterministic evidence fields', () => {
  const decisions = validDecisions();
  decisions[0].triggered_by = ['invented.ts'];
  throwsCode(() => assemblePlanImpact(plan(decisions), scan()), 'PLAN_SCOPE_CONTRADICTION');
});

test('a production consumer classified MODIFY is promoted before a bounded rescan', () => {
  const decisions = validDecisions();
  decisions[1].classification = 'MODIFY';
  const closure = expandModifiedRoots(plan(decisions), scan());
  assert.equal(closure.closed, false);
  assert.deepEqual(closure.promoted_modules, ['app/(creation)/_layout.tsx']);
  assert.ok(closure.modified_modules.some((entry) =>
    entry.path === 'app/(creation)/_layout.tsx' && entry.change === 'MODIFY'));
  throwsCode(() => assemblePlanImpact(plan(decisions), scan()), 'PLAN_SCOPE_NOT_CLOSED');
});

test('missing, duplicate and out-of-scan decisions are refused', () => {
  throwsCode(() => assemblePlanImpact(plan(validDecisions().slice(0, 1)), scan()), 'PLAN_SCOPE_UNCLASSIFIED');

  const duplicate = validDecisions();
  duplicate.push({ ...duplicate[0] });
  throwsCode(() => assemblePlanImpact(plan(duplicate), scan()), 'PLAN_SCOPE_CONTRADICTION');

  const outside = validDecisions();
  outside[0].path = 'src/unrelated.test.ts';
  throwsCode(() => assemblePlanImpact(plan(outside), scan()), 'PLAN_SCOPE_CONTRADICTION');
});
