'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const {
  MATRIX_SCHEMA, buildReviewProof, scanDirectImporters, sha256,
  verifyImpactMatrix, verifyPlanAtRevision,
} = require('../../scripts/kodjo/lib/plan-impact');

function fixture() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-plan-impact-'));
  const files = {
    'src/domain/sessions/Session.ts': 'export interface Session { id: string }\n',
    'src/domain/sessions/SessionDraft.ts': 'export interface SessionDraft { name: string }\n',
    'src/domain/sessions/__tests__/validation.test.ts': 'import type { Session } from "../Session";\nexpect({}).toEqual({});\n',
    'src/domain/sessions/__tests__/SessionDraft.test.ts': 'import { SessionDraft } from "../SessionDraft";\nexpect({}).toEqual({});\n',
    'src/features/sessions/__tests__/SessionService.test.ts': [
      'import type { Session } from "@/domain/sessions/Session";',
      'import { SessionDraft } from "@/domain/sessions/SessionDraft";',
      'expect({ sideMode: "UNILATERAL" }).toEqual({});',
    ].join('\n') + '\n',
    'src/features/sessions/SessionService.ts': 'import type { Session } from "@/domain/sessions/Session";\nexport const service = 1;\n',
    'src/unrelated.test.ts': 'expect(true).toBe(true);\n',
  };
  for (const [name, body] of Object.entries(files)) {
    const target = path.join(cwd, ...name.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body, 'utf8');
  }
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'user.email', 'kodjo@example.invalid'], { cwd });
  execFileSync('git', ['config', 'user.name', 'KODJO test'], { cwd });
  execFileSync('git', ['add', '.'], { cwd });
  execFileSync('git', ['commit', '-qm', 'fixture'], { cwd });
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
  return { cwd, revision };
}

function scan(f) {
  return scanDirectImporters({
    cwd: f.cwd,
    revision: f.revision,
    modifiedModules: [
      { path: 'src/domain/sessions/Session.ts', change: 'MODIFY' },
      { path: 'src/domain/sessions/SessionDraft.ts', change: 'MODIFY' },
    ],
  });
}

function matrixFor(result, overrides = {}) {
  const classifications = {
    'src/domain/sessions/Session.ts': 'MODIFY',
    'src/domain/sessions/SessionDraft.ts': 'MODIFY',
    'src/domain/sessions/__tests__/validation.test.ts': 'TEST_MUST_ADAPT',
    'src/domain/sessions/__tests__/SessionDraft.test.ts': 'TEST_MUST_ADAPT',
    'src/features/sessions/__tests__/SessionService.test.ts': 'TEST_MUST_ADAPT',
    'src/features/sessions/SessionService.ts': 'CONSUMER_UNAFFECTED',
  };
  const rows = [
    ...result.modified_modules.map((module) => ({
      path: module.path, candidate_kind: 'MODIFIED_MODULE', triggered_by: [], risk_score: 0,
      classification: classifications[module.path], justification: 'module declare modifie',
    })),
    ...result.candidates.map((candidate) => ({
      ...candidate, classification: classifications[candidate.path], justification: 'preuve examinee',
    })),
  ];
  const value = {
    schema: MATRIX_SCHEMA,
    scan_revision: result.scan_revision,
    modified_modules: result.modified_modules,
    scan_sha256: sha256(result),
    rows,
    scope_allow: rows.filter((row) => ['MODIFY', 'TEST_MUST_ADAPT'].includes(row.classification)).map((row) => row.path).sort(),
  };
  return Object.assign(value, overrides);
}

function throwsCode(fn, code) {
  assert.throws(fn, (error) => error && error.code === code && error.message.startsWith(code));
}

test('run #53 representative: direct imports surface SessionService.test.ts as TEST_MUST_ADAPT', () => {
  const f = fixture();
  const result = scan(f);
  assert.deepEqual(result.candidates.map((candidate) => candidate.path), [
    'src/domain/sessions/__tests__/SessionDraft.test.ts',
    'src/domain/sessions/__tests__/validation.test.ts',
    'src/features/sessions/__tests__/SessionService.test.ts',
    'src/features/sessions/SessionService.ts',
  ]);
  const sessionService = result.candidates.find((candidate) => candidate.path.endsWith('/SessionService.test.ts'));
  assert.deepEqual(sessionService.triggered_by, [
    'src/domain/sessions/Session.ts',
    'src/domain/sessions/SessionDraft.ts',
  ]);
  const matrix = matrixFor(result);
  const verified = verifyImpactMatrix(matrix, result, f.revision);
  assert.ok(verified.scope_allow.includes('src/features/sessions/__tests__/SessionService.test.ts'));
});

test('risk score changes ordering only and never removes a direct importer', () => {
  const f = fixture();
  const result = scan(f);
  assert.equal(result.candidates.length, 4);
  assert.ok(result.candidates[0].risk_score >= result.candidates.at(-1).risk_score);
  assert.ok(result.candidates.some((candidate) => candidate.risk_score === 0));
});

test('PLAN_SCOPE_UNCLASSIFIED rejects a missing candidate and REQUIRES_CLARIFICATION', () => {
  const f = fixture();
  const result = scan(f);
  const missing = matrixFor(result);
  missing.rows = missing.rows.filter((row) => !row.path.endsWith('/SessionService.test.ts'));
  throwsCode(() => verifyImpactMatrix(missing, result, f.revision), 'PLAN_SCOPE_UNCLASSIFIED');

  const unresolved = matrixFor(result);
  unresolved.rows.find((row) => row.path.endsWith('/SessionService.test.ts')).classification = 'REQUIRES_CLARIFICATION';
  throwsCode(() => verifyImpactMatrix(unresolved, result, f.revision), 'PLAN_SCOPE_UNCLASSIFIED');
});

test('PLAN_SCOPE_CONTRADICTION rejects scope_allow outside MODIFY union TEST_MUST_ADAPT', () => {
  const f = fixture();
  const result = scan(f);
  const matrix = matrixFor(result);
  matrix.scope_allow = matrix.scope_allow.filter((entry) => !entry.endsWith('/SessionService.test.ts'));
  throwsCode(() => verifyImpactMatrix(matrix, result, f.revision), 'PLAN_SCOPE_CONTRADICTION');
});

test('PLAN_SCAN_STALE rejects a matrix when source_head changed', () => {
  const f = fixture();
  const result = scan(f);
  const matrix = matrixFor(result);
  throwsCode(() => verifyImpactMatrix(matrix, result, 'f'.repeat(40)), 'PLAN_SCAN_STALE');
});

test('PLAN_SCAN_STALE follows the application tree, while protocol-only commits remain valid', () => {
  const changed = fixture();
  const changedScan = scan(changed);
  const changedMatrix = matrixFor(changedScan);
  const changedPlan = '<KODJO_PLAN_IMPACT_JSON>\n' + JSON.stringify(changedMatrix) + '\n</KODJO_PLAN_IMPACT_JSON>\n';
  fs.writeFileSync(path.join(changed.cwd, 'src/unrelated.test.ts'), 'expect(false).toBe(false);\n', 'utf8');
  execFileSync('git', ['add', '.'], { cwd: changed.cwd });
  execFileSync('git', ['commit', '-qm', 'application change'], { cwd: changed.cwd });
  const changedHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: changed.cwd, encoding: 'utf8' }).trim();
  throwsCode(() => verifyPlanAtRevision({
    cwd: changed.cwd, sourceHead: changedHead, planMarkdown: changedPlan,
  }), 'PLAN_SCAN_STALE');

  const protocolOnly = fixture();
  const protocolScan = scan(protocolOnly);
  const protocolMatrix = matrixFor(protocolScan);
  const protocolPlan = '<KODJO_PLAN_IMPACT_JSON>\n' + JSON.stringify(protocolMatrix) + '\n</KODJO_PLAN_IMPACT_JSON>\n';
  fs.mkdirSync(path.join(protocolOnly.cwd, '.github'), { recursive: true });
  fs.writeFileSync(path.join(protocolOnly.cwd, '.github', 'protocol.md'), 'protocol only\n', 'utf8');
  execFileSync('git', ['add', '.'], { cwd: protocolOnly.cwd });
  execFileSync('git', ['commit', '-qm', 'protocol change'], { cwd: protocolOnly.cwd });
  const protocolHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: protocolOnly.cwd, encoding: 'utf8' }).trim();
  assert.equal(verifyPlanAtRevision({
    cwd: protocolOnly.cwd, sourceHead: protocolHead, planMarkdown: protocolPlan,
  }).scan_sha256, protocolMatrix.scan_sha256);
});

test('independent review proof is reproducible and opposed to the same replay', () => {
  const f = fixture();
  const result = scan(f);
  const matrix = matrixFor(result);
  const plan = '<KODJO_PLAN_IMPACT_JSON>\n' + JSON.stringify(matrix) + '\n</KODJO_PLAN_IMPACT_JSON>\n';
  const verified = verifyPlanAtRevision({ cwd: f.cwd, sourceHead: f.revision, planMarkdown: plan });
  const proof = buildReviewProof(verified);
  const review = '<KODJO_PLAN_IMPACT_REVIEW_JSON>\n' + JSON.stringify(proof) + '\n</KODJO_PLAN_IMPACT_REVIEW_JSON>\n';
  assert.equal(verifyPlanAtRevision({
    cwd: f.cwd, sourceHead: f.revision, planMarkdown: plan, reviewMarkdown: review,
  }).scan_sha256, matrix.scan_sha256);
});

test('portable path contract rejects backslashes, traversal and ambiguous extension matches', () => {
  const f = fixture();
  throwsCode(() => scanDirectImporters({
    cwd: f.cwd, revision: f.revision, modifiedModules: ['src\\domain\\sessions\\Session.ts'],
  }), 'PLAN_SCAN_PATH_AMBIGUOUS');
  throwsCode(() => scanDirectImporters({
    cwd: f.cwd, revision: f.revision, modifiedModules: ['src/domain/../sessions/Session.ts'],
  }), 'PLAN_SCAN_PATH_AMBIGUOUS');

  fs.mkdirSync(path.join(f.cwd, 'src/ambiguous'), { recursive: true });
  fs.writeFileSync(path.join(f.cwd, 'src/ambiguous.ts'), 'export const value = 1;\n', 'utf8');
  fs.writeFileSync(path.join(f.cwd, 'src/ambiguous/index.ts'), 'export const value = 2;\n', 'utf8');
  fs.writeFileSync(path.join(f.cwd, 'src/ambiguous-importer.ts'), 'import { value } from "@/ambiguous";\nexport { value };\n', 'utf8');
  execFileSync('git', ['add', '.'], { cwd: f.cwd });
  execFileSync('git', ['commit', '-qm', 'ambiguous import'], { cwd: f.cwd });
  const ambiguousHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: f.cwd, encoding: 'utf8' }).trim();
  throwsCode(() => scanDirectImporters({
    cwd: f.cwd, revision: ambiguousHead,
    modifiedModules: ['src/domain/sessions/Session.ts'],
  }), 'PLAN_SCAN_PATH_AMBIGUOUS');
});

test('workflows and admission bind production planning to the deterministic contract', () => {
  const root = path.resolve(__dirname, '..', '..');
  const plan = fs.readFileSync(path.join(root, '.github/workflows/kodjo-slice-plan.yml'), 'utf8');
  const review = fs.readFileSync(path.join(root, '.github/workflows/kodjo-slice-plan-review.yml'), 'utf8');
  const admission = fs.readFileSync(path.join(root, 'scripts/kodjo/verify-authorizations.js'), 'utf8');
  const pilot = fs.readFileSync(path.join(root, '.github/workflows/kodjo-v2-pilot-tests.yml'), 'utf8');
  assert.match(plan, /scan-plan-impact\.js extract-modules/);
  assert.match(plan, /verify-plan-impact\.js/);
  assert.match(review, /Replay direct-import scan independently/);
  assert.match(review, /KODJO_PLAN_IMPACT_REVIEW_JSON/);
  assert.match(admission, /verifyPlanAtRevision/);
  assert.match(admission, /queue\.scope_allow/);
  assert.match(pilot, /kodjo-slice-\*\.yml/);
});

test('D12 DELETE and JSON asset aliases still expose their existing direct importers', () => {
  const f=fixture();
  try {
    fs.mkdirSync(path.join(f.cwd,'assets'),{recursive:true});
    fs.writeFileSync(path.join(f.cwd,'assets/colors.json'),'{}');
    fs.writeFileSync(path.join(f.cwd,'src/settings.json'),'{}');
    fs.writeFileSync(path.join(f.cwd,'src/consumer.ts'),'import colors from "@/assets/colors.json"; const settings=require("@/settings.json");');
    execFileSync('git',['add','.'],{cwd:f.cwd}); execFileSync('git',['commit','-qm','json fixture'],{cwd:f.cwd});
    const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:f.cwd,encoding:'utf8'}).trim();
    const result=scanDirectImporters({cwd:f.cwd,revision,modifiedModules:[{path:'assets/colors.json',change:'DELETE'},{path:'src/settings.json',change:'DELETE'}]});
    const consumer=result.candidates.find(row=>row.path==='src/consumer.ts');
    assert.deepEqual(consumer.triggered_by,['assets/colors.json','src/settings.json']);
  } finally {fs.rmSync(f.cwd,{recursive:true,force:true});}
});
