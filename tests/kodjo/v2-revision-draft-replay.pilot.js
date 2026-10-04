'use strict';
// Local replay, without any API call, of a revision draft through the real decoder
// (generate-ui-plan-contract.js decode draft), on the approved V2-PRE-2 plan materialized by the handoff:
// modules in the structured field, narrative without machine markers, and a preserved criterion whose
// change_targets name an existing, unchanged file declared in the cumulative scope (runs 37189965479, 37190167568).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { decode } = require('../../scripts/kodjo/generate-ui-plan-contract');

const ROOT = path.join(__dirname, '..', '..');
// Plan approuvé rejoué, figé par son blob : technical-plan.md est remplacé à chaque relais approuvé (99e8d134).
const PLAN_BLOB = 'ae2a7a0d30e5895b91e5782e5a85d0a5f1808e94';
const PHOTO = 'src/features/preferences/profilePhoto.ts';
const IDENTITY = 'UI-103FBF8D197A';

function approved() {
  const blob = spawnSync('git', ['cat-file', 'blob', PLAN_BLOB], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  assert.equal(blob.status, 0, blob.stderr);
  const text = blob.stdout.replace(/\r\n/g, '\n');
  const block = (name) => JSON.parse(text.match(new RegExp('<KODJO_' + name + '_JSON>\\s*([\\s\\S]*?)\\s*</KODJO_' + name + '_JSON>'))[1]);
  // Narrative = the plan body after the PLAN_OUTPUT header, before the first machine block, without status lines.
  const body = text.slice(text.indexOf('\n\n') + 2);
  const narrative = body.slice(0, body.indexOf('\n<KODJO_')).split('\n').filter((line) => !/^\s*PLAN_STATUS:/.test(line)).join('\n').trim();
  return { narrative, matrix: block('UI_CRITERIA_MATRIX'), requirements: block('NON_UI_REQUIREMENTS'), coverage: block('NON_UI_COVERAGE') };
}
function cumulativeModules(matrix, requirements, omit = null) {
  const paths = new Set([...matrix.criteria.flatMap((c) => c.change_targets), ...requirements.flatMap((r) => r.change_targets)]);
  if (omit) paths.delete(omit);
  return [...paths].sort().map((p) => ({ path: p, change: 'MODIFY' }));
}
function draft({ narrative, modules } = {}) {
  const a = approved();
  return {
    plan_markdown: narrative ?? '# V2-PRE-2 — révision\n\n' + a.narrative,
    modified_modules: modules ?? cumulativeModules(a.matrix, a.requirements),
    ui_criteria_matrix: a.matrix,
    non_ui_requirements: a.requirements,
    non_ui_coverage: a.coverage,
    clarifications: [],
  };
}
const response = (value) => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] });

test('replay inputs come from the approved plan: the identity criterion targets the unchanged profilePhoto.ts', () => {
  const a = approved();
  const identity = a.matrix.criteria.find((c) => c.criterion_id === IDENTITY);
  assert.ok(identity && identity.change_targets.includes(PHOTO));
  assert.doesNotMatch(a.narrative, /<\/?KODJO_|^\s*PLAN_STATUS:/m);
});

test('nominal revision draft is accepted by the real decoder (module and CLI)', () => {
  const value = draft();
  const out = decode('draft', response(value));
  assert.ok(out.startsWith('# V2-PRE-2 — révision\n'));
  const modules = JSON.parse(out.match(/<KODJO_MODIFIED_MODULES_JSON>\s*([\s\S]*?)\s*<\/KODJO_MODIFIED_MODULES_JSON>/)[1]);
  assert.ok(modules.some((m) => m.path === PHOTO && m.change === 'MODIFY'));
  const matrix = JSON.parse(out.match(/<KODJO_UI_CRITERIA_MATRIX_JSON>\s*([\s\S]*?)\s*<\/KODJO_UI_CRITERIA_MATRIX_JSON>/)[1]);
  assert.ok(matrix.criteria.find((c) => c.criterion_id === IDENTITY).change_targets.includes(PHOTO));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'revision-replay-'));
  try {
    fs.writeFileSync(path.join(dir, 'draft-response.json'), JSON.stringify(response(value)));
    const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/kodjo/generate-ui-plan-contract.js'), 'decode', 'draft',
      path.join(dir, 'draft-response.json'), path.join(dir, 'plan-draft.md')], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(fs.readFileSync(path.join(dir, 'plan-draft.md'), 'utf8'), out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a machine marker in the narrative is still refused', () => {
  for (const narrative of ['# Plan\n\n<KODJO_MODIFIED_MODULES_JSON>\n[]\n</KODJO_MODIFIED_MODULES_JSON>', '# Plan\n\nPLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW']) {
    assert.throws(() => decode('draft', response(draft({ narrative }))), /PLAN_GENERATION_MARKER_DUPLICATION/);
  }
});

test('omitting the unchanged profilePhoto.ts from the cumulative scope is still refused', () => {
  const a = approved();
  assert.throws(() => decode('draft', response(draft({ modules: cumulativeModules(a.matrix, a.requirements, PHOTO) }))),
    new RegExp('UI_PLAN_TARGET_INVALID: ' + IDENTITY + ': cible hors scope_allow: ' + PHOTO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
