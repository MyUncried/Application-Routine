'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const F = require('./helpers/vnext-planning-fixture');
const V = require('../../scripts/kodjo/lib/vnext-contract');
const Source = require('../../scripts/kodjo/lib/source-manifest');
const Envelope = require('../../scripts/kodjo/lib/planning-envelope');
const Requirements = require('../../scripts/kodjo/lib/requirement-registry');
const Impact = require('../../scripts/kodjo/lib/impact-graph');
const Chain = require('../../scripts/kodjo/lib/vnext-live-chain');

function fixture(t) {
  const repo = F.fixtureRepo();
  t.after(() => fs.rmSync(repo.cwd, {recursive:true, force:true}));
  fs.mkdirSync(path.join(repo.cwd, 'docs'));
  const content = 'Modifier le comportement du module.\n';
  fs.writeFileSync(path.join(repo.cwd, 'docs/spec.md'), content);
  fs.writeFileSync(path.join(repo.cwd, 'src/écran.js'), 'module.exports = 1;\n');
  const git = (...args) => execFileSync('git', args, {cwd:repo.cwd, encoding:'utf8', windowsHide:true}).trim();
  git('add', '.'); git('commit', '-m', 'exact source paths'); repo.revision = git('rev-parse', 'HEAD');
  const sourceManifestInput = {slice_id:'VNEXT-PATH-32', product_head:repo.revision, sources:[{
    source_kind:'MARKDOWN', authority:'FUNCTIONAL', locator:'docs/spec.md', revision:repo.revision,
    fingerprint:V.sha256(content), units:[{locator:'FULL_FILE', fingerprint:V.sha256(content), disposition:'REQUIREMENT_SOURCE'}],
  }]};
  const manifest = Source.build(sourceManifestInput);
  const planningInput = {slice_id:manifest.slice_id, planning_mode:'INITIAL', baseline_head:repo.revision,
    product_head:repo.revision, application_head:repo.revision, issue_id:'github_issue:MyUncried/Application-Routine#999',
    base_plan_hash:null, base_review_hash:null, causal_findings:[], created_from:{kind:'INITIAL_REQUEST', refs:['issue_comment:100']}};
  const source = manifest.sources[0];
  const requirementInput = {requirements:[{source_id:source.source_id, unit_id:source.units[0].unit_id,
    kind:'FUNCTIONAL', statement:'Modifier le comportement du module.', priority:'MUST', status:'ACTIVE',
    rationale:'Exact path preflight.', related_unit_ids:[], conflict_unit_ids:[]}]};
  const envelope = Envelope.build({...planningInput, source_manifest:manifest});
  const registry = Requirements.build({...requirementInput, planning_envelope_hash:envelope.contract_hash, source_manifest:manifest});
  const candidates = Impact.buildCandidateManifest({cwd:repo.cwd, revision:repo.revision});
  const byPath = p => candidates.candidates.find(c => c.path === p);
  const row = (candidateId, changeKind='MODIFY') => ({requirement_id:registry.requirements[0].requirement_id,
    candidate_id:candidateId, change_kind:changeKind, impact_reason:'Source-backed path change.',
    dependency_evidence:['docs/spec.md'], tests_affected_candidate_ids:[], preservation_candidate_ids:[]});
  return {repo, registry, candidates, byPath, row, recipe:{sourceManifestInput, planningInput, requirementInput,
    classifications:[row(byPath('src/core.js').candidate_id)], requirementPlans:[]}};
}

function refuseBeforeScan(f, edit, code) {
  const recipe = structuredClone(f.recipe); edit(recipe);
  let scans = 0;
  const original = Impact.scanOneLevelDirectImporters;
  Impact.scanOneLevelDirectImporters = () => { scans++; throw Error('TEST_SCAN_REACHED_BEFORE_PATH_REFUSAL'); };
  try { assert.throws(() => Chain.produce(recipe, {cwd:f.repo.cwd}), code); assert.equal(scans, 0); }
  finally { Impact.scanOneLevelDirectImporters = original; }
}

test('PE-32 missing, wrong-case and Unicode-substituted MODIFY targets stop the real preparation before dependency scanning', t => {
  const f = fixture(t);
  for (const file of ['src/absent.js', 'src/Core.js', 'src/ecran.js', 'src/e\u0301cran.js']) {
    assert.equal(f.byPath(file), undefined);
    const invented = V.stableId('CAND', [f.repo.revision, 'EXISTING_FILE', file]);
    refuseBeforeScan(f, recipe => recipe.classifications.push(f.row(invented)), /VNEXT_IMPACT_CANDIDATE_UNKNOWN/);
  }
});

test('PE-32 invalid CREATE choices and MODIFY of a creation slot stop before dependency scanning', t => {
  const f = fixture(t);
  refuseBeforeScan(f, recipe => recipe.classifications.push(f.row(f.byPath('src/keep.js').candidate_id, 'CREATE')), /VNEXT_IMPACT_CHANGE_KIND_NOT_ALLOWED/);
  for (const [file, code] of [['src/core.js', /VNEXT_CREATE_SLOT_ALREADY_EXISTS/], ['private/new.js', /VNEXT_CREATE_SLOT_ROOT_FORBIDDEN/]]) {
    refuseBeforeScan(f, recipe => { recipe.createSlots = [{path:file, policy_id:'P', policy_hash:'a'.repeat(64)}]; }, code);
  }
  const slot = {path:'src/new.js', policy_id:'P', policy_hash:'a'.repeat(64)};
  const id = V.stableId('CAND', [f.repo.revision, 'CREATE_SLOT', slot.path, slot.policy_id, slot.policy_hash]);
  refuseBeforeScan(f, recipe => { recipe.createSlots = [slot]; recipe.classifications.push(f.row(id)); }, /VNEXT_IMPACT_CHANGE_KIND_NOT_ALLOWED/);
});

test('PE-32 accepts exact tracked accented MODIFY and absent authorized CREATE at the immutable source', t => {
  const f = fixture(t);
  const manifest = Impact.buildCandidateManifest({cwd:f.repo.cwd, revision:f.repo.revision,
    createSlots:[{path:'src/nouveau.js', policy_id:'P', policy_hash:'a'.repeat(64)}]});
  const candidate = file => manifest.candidates.find(c => c.path === file).candidate_id;
  // A local uncommitted file must not replace the immutable Git source of truth.
  fs.writeFileSync(path.join(f.repo.cwd, 'src/nouveau.js'), 'uncommitted local file');
  const rows = [f.row(candidate('src/écran.js')), f.row(candidate('src/nouveau.js'), 'CREATE')];
  assert.deepEqual(Impact.validateImpactClassifications({requirementRegistry:f.registry, candidateManifest:manifest, classifications:rows}), rows);
  assert.equal(Impact.verifyCandidateManifestAtHead(manifest, {cwd:f.repo.cwd}), true);
});
