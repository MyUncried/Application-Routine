'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
const script = path.join(root, 'scripts', 'kodjo', 'apply-minor-plan-clarification.js');
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();

function sourceComment(label = 'Une activité') {
  return `[KODJO_V2] PLAN_OUTPUT\nslice_id=V2-TEST\nbootstrap_path=.github/orchestration/v2-slices/V2-TEST/slice-bootstrap.json\nsource_head=${head}\nplanning_mode=INITIAL\nplanning_contract=kodjo.plan-impact.v1\nSTATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW\n\n# Plan\n\nLe libellé est \`${label}\`.\n\n## Tests\n- \`src/example.test.ts\` est créé.\n\n<KODJO_MODIFIED_MODULES_JSON>\n[{"path":"src/example.test.ts","change":"CREATE"}]\n</KODJO_MODIFIED_MODULES_JSON>\n<KODJO_PLAN_IMPACT_JSON>\n{"schema":"kodjo.plan-impact.v1","scan_revision":"${head}","scan_sha256":"x","modified_modules":[{"path":"src/example.test.ts","change":"CREATE"}],"rows":[{"path":"src/example.test.ts","candidate_kind":"MODIFIED_MODULE","triggered_by":[],"risk_score":0,"classification":"MODIFY","justification":"test"}],"scope_allow":["src/example.test.ts"]}\n</KODJO_PLAN_IMPACT_JSON>\n<KODJO_PLAN_CONTRACT_JSON>\n{"schema":"kodjo.plan-contract-consistency.v2","contract_version":2,"protocol_commit":"${head}","scan_revision":"${head}","write_scope":["src/example.test.ts"],"required_test_writes":["src/example.test.ts"]}\n</KODJO_PLAN_CONTRACT_JSON>\n`;
}

function run(body, fromText, toText, expected = 1) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-minor-plan-'));
  const input = path.join(dir, 'source.md');
  const output = path.join(dir, 'plan.md');
  const proof = path.join(dir, 'proof.json');
  fs.writeFileSync(input, body, 'utf8');
  const result = spawnSync(process.execPath, [script, input, head, '123', '456', fromText, toText, String(expected), output, proof], {
    cwd: root,
    encoding: 'utf8',
  });
  return { ...result, output, proof, dir };
}

test('fast path: remplace seulement le littéral demandé et conserve les contrats machine', () => {
  const result = run(sourceComment(), 'Une activité', 'Une nouvelle activité');
  assert.equal(result.status, 0, result.stderr);
  const revised = fs.readFileSync(result.output, 'utf8');
  assert.match(revised, /Une nouvelle activité/);
  assert.doesNotMatch(revised, /Le libellé est `Une activité`/);
  const proof = JSON.parse(fs.readFileSync(result.proof, 'utf8'));
  assert.equal(proof.machine_contract_unchanged, true);
  assert.equal(proof.actual_occurrences, 1);
  assert.equal(proof.source_plan_comment_id, 123);
  assert.equal(proof.clarification_comment_id, 456);
});

test('fast path: refuse un nombre d occurrences différent de l attestation', () => {
  const body = sourceComment().replace('Le libellé est `Une activité`.', 'Une activité puis Une activité.');
  const result = run(body, 'Une activité', 'Une nouvelle activité', 1);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /MINOR_CLARIFICATION_OCCURRENCE_MISMATCH/);
});

test('fast path: refuse toute tentative de toucher aux marqueurs protocolaires', () => {
  const result = run(sourceComment(), 'scope_allow', 'scope_allow bis');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /MINOR_CLARIFICATION_REPLACEMENT_INVALID/);
});

test('fast path: exige le contrat plan-machine versionné courant', () => {
  const body = sourceComment().replace(/<KODJO_PLAN_CONTRACT_JSON>[\s\S]*?<\/KODJO_PLAN_CONTRACT_JSON>\n/, '');
  const result = run(body, 'Une activité', 'Une nouvelle activité');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /KODJO_PLAN_CONTRACT_JSON attendu exactement une fois/);
});

test('fast path: refuse un plan source déjà non reviewable', () => {
  const body = sourceComment().replace('STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW', 'STATUT : PLAN_REVISION_REQUIRED');
  const result = run(body, 'Une activité', 'Une nouvelle activité');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /statut source non admissible/);
});
