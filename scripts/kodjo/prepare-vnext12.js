#!/usr/bin/env node
'use strict';
// Disposable operational dossier. No injected reviewer, approval or implementation.
const fs = require('node:fs');
const path = require('node:path');
const V = require('./lib/vnext-contract');
const Source = require('./lib/source-manifest');
const Envelope = require('./lib/planning-envelope');
const Requirements = require('./lib/requirement-registry');
const Impact = require('./lib/impact-graph');
const Chain = require('./lib/vnext-live-chain');
const ROOT = '.github/orchestration/vnext12/VNEXT-12-QUALIF';
const CORE = 'scripts/kodjo/fixtures/vnext12/core.js';
const TEST = 'tests/fixtures/vnext12/core.test.js';
const KEEP = 'scripts/kodjo/fixtures/vnext12/keep.js';
const SOURCE = ROOT + '/requirement.md';
function buildRecipe(cwd) {
  const head = Chain.command('git', ['rev-parse', 'HEAD'], cwd).trim();
  const content = Chain.readGit(cwd, head, SOURCE);
  const sourceManifestInput = { slice_id: 'VNEXT-12-QUALIF', product_head: head,
    sources: [{ source_kind: 'MARKDOWN', authority: 'FUNCTIONAL', locator: SOURCE,
      revision: head, fingerprint: V.sha256(content), units: [{ locator: 'FULL_FILE',
        fingerprint: V.sha256(content), disposition: 'REQUIREMENT_SOURCE' }] }] };
  const manifest = Source.build(sourceManifestInput);
  const planningInput = { slice_id: manifest.slice_id, planning_mode: 'INITIAL',
    baseline_head: head, product_head: head, application_head: head,
    issue_id: 'github_issue:MyUncried/Application-Routine#269', base_plan_hash: null,
    base_review_hash: null, causal_findings: [], created_from: { kind: 'INITIAL_REQUEST',
      refs: ['git:' + head + ':' + ROOT + '/request.json'] } };
  const envelope = Envelope.build({ ...planningInput, source_manifest: manifest });
  const requirementInput = { requirements: [{ source_id: manifest.sources[0].source_id,
    unit_id: manifest.sources[0].units[0].unit_id, kind: 'FUNCTIONAL',
    statement: content.trim(), priority: 'MUST', status: 'ACTIVE',
    rationale: 'Tranche jetable autorisée pour la qualification opérationnelle VNext-12.',
    related_unit_ids: [], conflict_unit_ids: [] }] };
  const registry = Requirements.build({ ...requirementInput,
    planning_envelope_hash: envelope.contract_hash, source_manifest: manifest });
  const candidates = Impact.buildCandidateManifest({ cwd, revision: head });
  const at = p => { const row = candidates.candidates.find(x => x.path === p);
    if (!row) throw new Error('VNEXT12_CANDIDATE_ABSENT:' + p); return row; };
  const req = registry.requirements[0].requirement_id;
  const classifications = [
    { requirement_id: req, candidate_id: at(CORE).candidate_id, change_kind: 'MODIFY',
      impact_reason: 'Porter la valeur demandée de 1 à 2.', dependency_evidence: [SOURCE],
      tests_affected_candidate_ids: [at(TEST).candidate_id], preservation_candidate_ids: [at(KEEP).candidate_id] },
    { requirement_id: req, candidate_id: at(TEST).candidate_id, change_kind: 'MODIFY',
      impact_reason: 'Adapter le test Jest direct à la valeur 2.', dependency_evidence: [CORE],
      tests_affected_candidate_ids: [], preservation_candidate_ids: [] },
  ];
  const directImportScan = Impact.scanOneLevelDirectImporters({ cwd,
    candidateManifest: candidates, modifyCandidateIds: [at(CORE).candidate_id] });
  const graph = Impact.buildImpactGraph({ requirementRegistry: registry,
    candidateManifest: candidates, directImportScan, classifications });
  const core = graph.impacts.find(x => x.path === CORE);
  const test = graph.impacts.find(x => x.path === TEST);
  const covered = [core.impact_id, test.impact_id].sort();
  const requirementPlans = [{ requirement_id: req, implementation_intents: [
    { impact_id: core.impact_id, intent: 'Conserver l’export CommonJS value() ; retourner exactement le nombre 2, sans autre comportement ni dépendance.' },
    { impact_id: test.impact_id, intent: 'Conserver le test Jest et son import direct ; remplacer son attente 1 par 2 ; exécuter ce test puis les checks contractuels.' },
  ], test_obligations: [{ target_impact_id: test.impact_id,
    covered_change_impact_ids: covered, expected: 'Le test Jest observe value() === 2.',
    justification: 'Vérification directe de la fonction réellement modifiée.' }],
  proof_obligations: [{ proof_type: 'FUNCTIONAL_TEST', target_test_impact_id: test.impact_id,
    covered_change_impact_ids: covered, expected: 'Le test Jest passe avec la valeur 2.',
    justification: 'Résultat exécuté ; pas de statut déclaré sans observation.' }],
  implementation_constraints: ['Modifier uniquement les deux fichiers du write_scope.',
    'Préserver keep.js octet pour octet.', 'Ne pas créer de dépendance ; aucun composant UI ni exception native.',
    'Ne pas publier, fusionner, activer VNext ni intervenir sur PRE-1.'],
  residual_risks: ['Tranche synthétique jetable : ne certifie aucun comportement produit réel.'],
  rationale: 'INITIAL opérationnel nominal, deux fichiers, une exigence observable.' }];
  return { sourceManifestInput, planningInput, requirementInput, classifications,
    requirementPlans, executionContext: { mode: 'LOCAL', writer_id: 'CLAUDE:kodjo-local-vnext12' },
    nativeAssessments: [], registerInput: { authorizedActor: 'MyUncried', revisionCount: 0,
      revisionLimit: 1, observations: [] } };
}
function main() {
  const [stage, output] = process.argv.slice(2);
  if (!['produce', 'prepare'].includes(stage) || !output) throw new Error('Usage: prepare-vnext12.js <produce|prepare> <external-evidence-directory>');
  const cwd = process.cwd();
  const out = path.resolve(output);
  if (out.startsWith(cwd + path.sep)) throw new Error('VNEXT12_EVIDENCE_MUST_BE_OUTSIDE_CHECKOUT');
  fs.mkdirSync(out, { recursive: true });
  const write = (name, value) => fs.writeFileSync(path.join(out, name), JSON.stringify(value, null, 2) + '\n');
  const recipe = buildRecipe(cwd);
  const produced = Chain.produce(recipe, { cwd });
  write('recipe.json', recipe); write('produced.json', produced);
  if (stage === 'produce') return;
  const receipt = Chain.review(produced, { cwd });
  write('review-receipt.json', receipt);
  // REVISE is retained, never converted to APPROVE or automatically retried.
  if (receipt.review_report.verdict !== 'APPROVE') throw new Error('VNEXT12_INITIAL_REVIEW_' + receipt.review_report.verdict);
  const bootstrap = { protocol: 'VNEXT', vnext_chain_file: ROOT + '/initial/prepared.json',
    slice_id: 'VNEXT-12-QUALIF', issue_number: 269, repository: 'MyUncried/Application-Routine',
    authorized_actors: [], activation_registry: ROOT + '/disposable-registry.json' };
  bootstrap.slice_bootstrap_sha256 = V.canonicalHash(bootstrap);
  const transport = { slice_bootstrap_file: ROOT + '/initial/slice-bootstrap.json',
    slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256,
    plan_path: ROOT + '/initial/technical-plan.md', review_path: ROOT + '/initial/independent-review.md',
    prompt_file: ROOT + '/initial/implementation-mission.md', gate_ref: 'issue_comment:1',
    request_id: require('node:crypto').randomUUID(), created_at: new Date().toISOString() };
  const ready = Chain.prepare(produced, receipt, transport, { cwd });
  write('prepared.json', ready.prepared); write('transport.json', transport);
  write('publication.json', [{ path: bootstrap.vnext_chain_file, content: JSON.stringify(ready.prepared, null, 2) + '\n' },
    { path: transport.slice_bootstrap_file, content: JSON.stringify(bootstrap, null, 2) + '\n' },
    { path: bootstrap.activation_registry, content: JSON.stringify({ qualification_only: true,
      activations: [{ slice_id: bootstrap.slice_id, status: 'ACTIVE', issue_number: 269 }] }, null, 2) + '\n' },
    ...Object.values(ready.compatibility_files).map(x => ({ path: x.path, content: x.content }))]);
  write('status.json', { status: 'PREPARED_FOR_PUBLICATION', candidate_head: produced.producer_revision,
    review_verdict: receipt.review_report.verdict, claude_session_id: receipt.session_id,
    implementation_invoked: false, user_approval_observed: false, revision_limit: 1 });
  console.log(JSON.stringify({ status: 'PREPARED_FOR_PUBLICATION', review: receipt.review_report.verdict, session: receipt.session_id }));
}
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { buildRecipe };
