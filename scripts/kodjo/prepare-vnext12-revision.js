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
  if (allowed.authorized_targets.some(x => x.target_type !== 'PLAN_ITEM')) throw Error('VNEXT12_REVISION_REQUIRES_DIAGNOSIS');
  const patch = Revision.buildRevisionPatch({ allowedChangeSet: allowed,
    corrections: allowed.authorized_targets.map(x => ({ target_type: x.target_type, target_id: x.target_id,
      finding_ids: x.finding_ids, correction: 'Rétablir exclusivement les intentions value() === 2 et attente Jest 2, conformément à la source Git et aux obligations inchangées.' })) });
  const recipe = buildRecipe(cwd);
  recipe.planningInput = { ...recipe.planningInput, planning_mode: 'REVISION',
    base_plan_hash: a.planContract.contract_hash, base_review_hash: receipt.review_report.contract_hash,
    causal_findings: receipt.review_report.findings.filter(x => x.blocking).map(x => x.finding_id).sort(),
    created_from: { kind: 'PLAN_REVIEW_REVISE', refs: ['claude_session:' + receipt.session_id + '#' + receipt.contract_hash] } };
  const previous = Register.buildRegister({ ...base.register_input, candidateHead: base.producer_revision,
    lot: a.planningEnvelope.slice_id, phase: 'REVIEW' });
  recipe.registerInput = { ...recipe.registerInput, previous, revisionCount: 1 };
  return { recipe, allowed, patch, baseArtifacts: { ...a, cumulativeRegister: previous } };
}
function completeRevision(base, receipt, correction, next, nextReceipt) {
  Chain.validateReceipt(next, nextReceipt);
  const nextArtifacts = { ...next.artifacts, cumulativeRegister: Register.buildRegister({
    ...next.register_input, candidateHead: next.producer_revision, lot: next.artifacts.planningEnvelope.slice_id, phase: 'REVISION' }) };
  const outcome = Revision.verifyRevisionOutcome({ allowedChangeSet: correction.allowed,
    revisionPatch: correction.patch, baseArtifacts: correction.baseArtifacts, nextArtifacts,
    nextReviewContext: next.artifacts.reviewContext, nextReviewReport: nextReceipt.review_report });
  if (outcome.status !== 'RESOLVED') throw Error('VNEXT12_REVISION_NOT_RESOLVED:' + outcome.status);
  const ledger = Convergence.buildFindingLedger({ previousReviewReport: receipt.review_report,
    nextReviewReport: nextReceipt.review_report, resolutions: receipt.review_report.findings.filter(x => x.blocking)
      .map(x => ({ finding_id: x.finding_id, status: 'RESOLVED',
        evidence_refs: ['claude_session:' + nextReceipt.session_id + '#' + nextReceipt.contract_hash],
        note: 'Correction bornée confrontée à une nouvelle revue réelle du candidat exact.' })) });
  return { base_artifacts: correction.baseArtifacts, allowed_change_set: correction.allowed,
    revision_patch: correction.patch, revision_outcome: outcome,
    previous_review_report: receipt.review_report, finding_ledger: ledger };
}
function main() {
  const [stage, output] = process.argv.slice(2);
  if (!['produce', 'review'].includes(stage) || !output) throw Error('Usage: prepare-vnext12-revision.js <produce|review> <external-evidence-directory>');
  const cwd = process.cwd(), out = path.resolve(output);
  const relative = path.relative(cwd, out);
  if (!relative.startsWith('..' + path.sep) && !path.isAbsolute(relative)) throw Error('VNEXT12_EVIDENCE_MUST_BE_OUTSIDE_CHECKOUT');
  fs.mkdirSync(out, { recursive: true });
  const write = (name, value) => fs.writeFileSync(path.join(out, name), JSON.stringify(value, null, 2) + '\n');
  let phase = 'PRODUCE';
  try {
    const recipe = benchmarkRecipe(cwd), base = Chain.produce(recipe, { cwd });
    write('benchmark-declaration.json', { kind: 'EXPLICIT_NEGATIVE_PLAN_PROPOSAL',
      proposed_value: 3, required_value: 2, requirement_source_unchanged: true,
      implementation_invoked: false, maximum_corrections: 1, candidate_head: base.producer_revision });
    write('base-recipe.json', recipe); write('base-produced.json', base);
    if (stage === 'produce') return;
    phase = 'BASE_REVIEW';
    const receipt = Chain.review(base, { cwd }); write('base-review-receipt.json', receipt);
    phase = 'BOUNDED_CORRECTION';
    const correction = deriveCorrection(cwd, base, receipt);
    write('allowed-change-set.json', correction.allowed); write('revision-patch.json', correction.patch);
    write('revision-recipe.json', correction.recipe);
    const next = Chain.produce(correction.recipe, { cwd }); write('revision-produced.json', next);
    phase = 'REVISION_REVIEW';
    const nextReceipt = Chain.review(next, { cwd }); write('revision-review-receipt.json', nextReceipt);
    phase = 'VERIFY_CAUSAL_OUTCOME';
    const artifacts = completeRevision(base, receipt, correction, next, nextReceipt);
    write('revision-artifacts.json', artifacts);
    write('status.json', { status: 'REVIEWED_REVISION_PENDING_HANDOFF', candidate_head: next.producer_revision,
      base_verdict: receipt.review_report.verdict, revision_verdict: nextReceipt.review_report.verdict,
      base_session: receipt.session_id, revision_session: nextReceipt.session_id,
      revision_count: 1, revision_limit: 1, implementation_invoked: false, final_audit_invoked: false });
    console.log('REVIEWED_REVISION_PENDING_HANDOFF');
  } catch (error) {
    write('status.json', { status: 'FAILED', phase, error: error.message, implementation_invoked: false, final_audit_invoked: false });
    throw error;
  }
}
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { benchmarkRecipe, deriveCorrection, completeRevision };
