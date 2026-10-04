#!/usr/bin/env node
'use strict';
// Explicit negative planning benchmark. Both review verdicts come from Claude;
// no faulty implementation is executed and no approval is synthesized.
const fs = require('node:fs');
const path = require('node:path');
const Chain = require('./lib/vnext-live-chain');
const Revision = require('./lib/revision-contract');
const Register = require('./lib/vnext-audit-register');
const Convergence = require('./lib/audit-convergence-contract');
const { buildRecipe } = require('./prepare-vnext12');
const V = require('./lib/vnext-contract');
const Identity = require('./lib/slice-identity');
const ROOT = '.github/orchestration/vnext12/VNEXT-12-QUALIF';

function benchmarkRecipe(cwd) {
  const recipe = buildRecipe(cwd);
  recipe.requirementPlans[0].implementation_intents[0].intent = 'Conserver l’export CommonJS value() ; retourner exactement le nombre 3, sans autre comportement ni dépendance.';
  recipe.requirementPlans[0].implementation_intents[1].intent = 'Conserver le test Jest et son import direct ; remplacer son attente 1 par 3 ; exécuter ce test puis les checks contractuels.';
  return recipe;
}
function deriveCorrection(cwd, base, receipt) {
  if (receipt.review_report.verdict !== 'REVISE') throw Error('VNEXT12_EXPECTED_REAL_REVISE:' + receipt.review_report.verdict);
  const a = base.artifacts;
  const allowed = Revision.buildAllowedChangeSet({ ...a, reviewReport: receipt.review_report });
  // This technical benchmark only corrects plan intents. Broader findings must
  // be diagnosed; they cannot silently authorize unrelated mutations.
  const item = a.planContract.plan_items[0];
  if (!allowed.authorized_targets.some(x => x.target_id === item.plan_item_id)) throw Error('VNEXT12_PLAN_CORRECTION_NOT_AUTHORIZED');
  // Dependencies describe the finding's evidence closure; they are not all
  // requested mutations. Only blocking findings on this plan item authorize
  // the benchmark correction. Requirements, impacts, tests and proofs stay exact.
  const blocking = receipt.review_report.findings.filter(x => x.blocking);
  for (const finding of blocking) {
    if (finding.target_type === 'PLAN_ITEM' && finding.target_id === item.plan_item_id) continue;
    // A TEST finding can cite an incorrect plan intent while the TEST obligation
    // itself is correct. Require its exact parent and change identity, retain
    // the original finding, and authorize only the parent plan's intents.
    const test = item.test_obligations.find(x => x.test_id === finding.target_id);
    const change = test && item.change_items.find(x => x.impact_id === test.target_impact_id);
    if (finding.category !== 'TEST_GAP' || finding.target_type !== 'TEST' || !change
        || !finding.dependency_target_ids.includes(item.plan_item_id)
        || !finding.required_correction.includes(change.change_id)
        || item.change_items.filter(x => finding.required_correction.includes(x.change_id)).length !== 1) {
      throw Error('VNEXT12_REVISION_REQUIRES_DIAGNOSIS');
    }
  }
  const patch = Revision.buildRevisionPatch({ allowedChangeSet: allowed,
    corrections: allowed.authorized_targets.filter(x => x.target_type === 'PLAN_ITEM' && x.target_id === item.plan_item_id).map(x => ({ target_type: x.target_type, target_id: x.target_id,
      finding_ids: x.finding_ids, correction: 'Rétablir exclusivement les intentions value() === 2 et attente Jest 2, conformément à la source Git et aux obligations inchangées.' })) });
  const recipe = buildRecipe(cwd);
  recipe.planningInput = { ...recipe.planningInput, planning_mode: 'REVISION',
    base_plan_hash: a.planContract.contract_hash, base_review_hash: receipt.review_report.contract_hash,
    causal_findings: receipt.review_report.findings.filter(x => x.blocking).map(x => x.finding_id).sort(),
    created_from: { kind: 'PLAN_REVIEW_REVISE', refs: ['claude_session:' + receipt.session_id + '#' + receipt.contract_hash,
      'revision_patch:' + patch.contract_hash] } };
  const previous = Register.buildRegister({ ...base.register_input, candidateHead: base.producer_revision,
    lot: a.planningEnvelope.slice_id, phase: 'REVIEW' });
  recipe.registerInput = { ...recipe.registerInput, previous, revisionCount: 1 };
  return { recipe, allowed, patch, baseArtifacts: { ...a, cumulativeRegister: previous } };
}
function completeRevision(base, receipt, correction, next, nextReceipt) {
  Chain.validateReceipt(next, nextReceipt);
  const dependencies = a => ({
    requirements: a.requirementRegistry.requirements, coverage: a.requirementRegistry.coverage,
    registry_status: a.requirementRegistry.registry_status, blocking_reasons: a.requirementRegistry.blocking_reasons,
    source_manifest_hash: a.requirementRegistry.source_manifest_hash, impacts: a.impactGraph.impacts,
    candidateManifest: a.candidateManifest, directImportScan: a.directImportScan, uiAtomicityContract: a.uiAtomicityContract });
  const left = dependencies(base.artifacts), right = dependencies(next.artifacts);
  for (const key of Object.keys(left)) {
    if (V.canonicalStringify(left[key]) !== V.canonicalStringify(right[key])) throw Error('VNEXT12_REVISION_DEPENDENCY_MUTATED:' + key);
  }
  const freezePlan = plan => ({ boundaries: plan.boundaries,
    items: plan.plan_items.map(({ change_items, ...item }) => ({ ...item,
      change_items: change_items.map(({ intent, ...change }) => change) })) });
  if (V.canonicalStringify(freezePlan(base.artifacts.planContract)) !== V.canonicalStringify(freezePlan(next.artifacts.planContract))) throw Error('VNEXT12_REVISION_OBLIGATION_MUTATED');
  const nextArtifacts = { ...next.artifacts, cumulativeRegister: Register.buildRegister({
    ...next.register_input, candidateHead: next.producer_revision, lot: next.artifacts.planningEnvelope.slice_id, phase: 'REVISION' }) };
  const outcome = Revision.verifyRevisionOutcome({ allowedChangeSet: correction.allowed,
    revisionPatch: correction.patch, baseArtifacts: correction.baseArtifacts, nextArtifacts,
    nextReviewContext: next.artifacts.reviewContext, nextReviewReport: nextReceipt.review_report });
  if (outcome.status !== 'RESOLVED') throw Error('VNEXT12_REVISION_NOT_RESOLVED:' + outcome.status);
  const ledger = Convergence.buildFindingLedger({ previousReviewReport: receipt.review_report,
    nextReviewReport: nextReceipt.review_report, resolutions: nextReceipt.review_report.finding_resolutions
      .filter(row => row.status === 'RESOLVED').map(row => ({ ...row,
        evidence_refs: [...row.evidence_refs, 'claude_session:' + nextReceipt.session_id + '#' + nextReceipt.contract_hash] })) });
  return { base_artifacts: correction.baseArtifacts, allowed_change_set: correction.allowed,
    revision_patch: correction.patch, revision_outcome: outcome,
    previous_review_report: receipt.review_report, finding_ledger: ledger };
}
function preparePublication(cwd, base, receipt, next, nextReceipt, artifacts) {
  const bootstrapPath = '.github/orchestration/v2-slices/VNEXT-12-QUALIF/slice-bootstrap.json';
  const old = JSON.parse(Chain.readGit(cwd, next.producer_revision, bootstrapPath));
  Identity.validateBootstrap(old);
  if (old.protocol !== 'VNEXT' || old.slice_id !== 'VNEXT-12-QUALIF') throw Error('VNEXT12_REVISION_BOOTSTRAP_REQUIRED');
  const bootstrap = { ...old, vnext_chain_file: ROOT + '/revision/prepared.json',
    baseline_head: next.artifacts.planningEnvelope.baseline_head, protocol_commit: next.producer_revision,
    product_sources: [{ path: ROOT + '/requirement.md', sha256: next.source_observations[0].fingerprint }] };
  delete bootstrap.slice_bootstrap_sha256;
  bootstrap.slice_bootstrap_sha256 = V.canonicalHash(bootstrap);
  Identity.validateBootstrap(bootstrap);
  const registry = JSON.parse(Chain.readGit(cwd, next.producer_revision, old.activation_registry));
  const rows = registry.activations.filter(x => x.slice_id === old.slice_id);
  if (rows.length !== 1 || rows[0].status !== 'ACTIVE' || rows[0].slice_bootstrap_sha256 !== old.slice_bootstrap_sha256) throw Error('VNEXT12_REVISION_REGISTRY_MISMATCH');
  rows[0].baseline_head = bootstrap.baseline_head; rows[0].slice_bootstrap_sha256 = bootstrap.slice_bootstrap_sha256;
  Identity.validateRegistry(registry, bootstrap);
  const transport = require('./lib/vnext-legacy-queue-adapter').prepareTransport({ slice_bootstrap_file: bootstrapPath, slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256,
    plan_path: ROOT + '/revision/technical-plan.md', review_path: ROOT + '/revision/independent-review.md',
    prompt_file: ROOT + '/revision/implementation-mission.md' });
  const revisionEvidence = { base_produced: base, base_review_receipt: receipt, revision_artifacts: artifacts };
  const ready = Chain.prepare(next, nextReceipt, transport, { cwd, revisionEvidence });
  return { ...ready, transport, publication: [
    { path: bootstrap.vnext_chain_file, content: JSON.stringify(ready.prepared, null, 2) + '\n' },
    { path: bootstrapPath, content: JSON.stringify(bootstrap, null, 2) + '\n' },
    { path: bootstrap.activation_registry, content: JSON.stringify(registry, null, 2) + '\n' },
    ...Object.values(ready.compatibility_files).map(x => ({ path: x.path, content: x.content }))] };
}
function loadResumedBase(base, out, {cwd}) {
  const prior=JSON.parse(fs.readFileSync(path.join(out,'base-produced.json'),'utf8'));
  if(prior.contract_hash !== base.contract_hash) throw Error('VNEXT12_RESUME_BASE_CHANGED');
  const receipt=JSON.parse(fs.readFileSync(path.join(out,'base-review-receipt.json'),'utf8'));
  Chain.verifyReceipt(base,receipt);
  return receipt;
}
function main() {
  const [stage, output] = process.argv.slice(2);
  if (!['produce', 'review', 'resume'].includes(stage) || !output) throw Error('Usage: prepare-vnext12-revision.js <produce|review|resume> <external-evidence-directory>');
  const cwd = process.cwd(), out = path.resolve(output);
  const relative = path.relative(cwd, out);
  if (!relative.startsWith('..' + path.sep) && !path.isAbsolute(relative)) throw Error('VNEXT12_EVIDENCE_MUST_BE_OUTSIDE_CHECKOUT');
  fs.mkdirSync(out, { recursive: true });
  const write = (name, value) => fs.writeFileSync(path.join(out, name), JSON.stringify(value, null, 2) + '\n');
  let phase = 'PRODUCE';
  try {
    const recipe = benchmarkRecipe(cwd), base = Chain.produce(recipe, { cwd });
    const resumedReceipt=stage === 'resume' ? loadResumedBase(base,out,{cwd}) : null;
    write('benchmark-declaration.json', { kind: 'EXPLICIT_NEGATIVE_PLAN_PROPOSAL',
      proposed_value: 3, required_value: 2, requirement_source_unchanged: true,
      implementation_invoked: false, maximum_corrections: 1, candidate_head: base.producer_revision });
    write('base-recipe.json', recipe); write('base-produced.json', base);
    if (stage === 'produce') return;
    phase = 'BASE_REVIEW';
    const receipt = resumedReceipt || Chain.reviewOrRecover(base, { cwd, evidenceDirectory: out });
    Chain.verifyReceipt(base, receipt);
    write('base-review-receipt.json', receipt);
    phase = 'BOUNDED_CORRECTION';
    const correction = deriveCorrection(cwd, base, receipt);
    write('allowed-change-set.json', correction.allowed); write('revision-patch.json', correction.patch);
    write('revision-recipe.json', correction.recipe);
    const next = Chain.produce(correction.recipe, { cwd }); write('revision-produced.json', next);
    phase = 'REVISION_REVIEW';
    let nextReceipt;
    if (stage === 'resume' && fs.existsSync(path.join(out, 'revision-review-receipt.json'))) {
      nextReceipt = JSON.parse(fs.readFileSync(path.join(out, 'revision-review-receipt.json'), 'utf8'));
      Chain.validateReceipt(next, nextReceipt);
    } else nextReceipt = Chain.reviewOrRecover(next, { cwd, evidenceDirectory: out });
    write('revision-review-receipt.json', nextReceipt);
    phase = 'VERIFY_CAUSAL_OUTCOME';
    const artifacts = completeRevision(base, receipt, correction, next, nextReceipt);
    write('revision-artifacts.json', artifacts);
    phase = 'PREPARE_HANDOFF';
    const ready = preparePublication(cwd, base, receipt, next, nextReceipt, artifacts);
    write('prepared.json', ready.prepared); write('transport.json', ready.transport); write('publication.json', ready.publication);
    write('status.json', { status: 'REVIEWED_REVISION_PENDING_HANDOFF', candidate_head: next.producer_revision,
      base_verdict: receipt.review_report.verdict, revision_verdict: nextReceipt.review_report.verdict,
      base_session: receipt.session_id, revision_session: nextReceipt.session_id,
      revision_count: 1, revision_limit: 1, implementation_invoked: false, final_audit_invoked: false });
    console.log('REVIEWED_REVISION_PENDING_HANDOFF');
  } catch (error) {
    Chain.preserveFailure(error, () => write('status.json', { status: 'FAILED', phase, error: error.message, implementation_invoked: false, final_audit_invoked: false }));
    throw error;
  }
}
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { loadResumedBase, benchmarkRecipe, deriveCorrection, completeRevision, preparePublication };
