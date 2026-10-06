'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const Driver = require('../../scripts/kodjo/prepare-vnext12-revision');
const Chain = require('../../scripts/kodjo/lib/vnext-live-chain');
const V = require('../../scripts/kodjo/lib/vnext-contract');
const F = require('./helpers/vnext-planning-fixture');
const Approval = require('../../scripts/kodjo/lib/approval-handoff-contract');
const CLI = require('../../scripts/kodjo/vnext-chain');
const ROOT = path.resolve(__dirname, '../..');
function fixture(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext12-revision-test-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.test');
  for (const p of ['scripts/kodjo', 'tests/fixtures/vnext12', '.github/orchestration/vnext12/VNEXT-12-QUALIF/requirement.md', '.github/orchestration/vnext12/VNEXT-12-QUALIF/request.json', '.github/orchestration/v2-slices/VNEXT-12-QUALIF/slice-bootstrap.json', '.github/orchestration/v2-activation-registry.json']) {
    fs.mkdirSync(path.dirname(path.join(cwd, p)), { recursive: true });
    fs.cpSync(path.join(ROOT, p), path.join(cwd, p), { recursive: true });
  }
  git('add', '.'); git('commit', '-m', 'fixture only; not campaign evidence');
  return cwd;
}
function receipt(cwd, produced, findings) {
  // Explicit fixture adapter: these receipts are never published as run proof.
  return Chain.review(produced, { cwd, claude: 'unit-test-only', invoke: (_bin, _args, _cwd, _input, _env, timeoutMs) => {
    assert.equal(timeoutMs, 7200000);
    return JSON.stringify({ type: 'result', session_id: 'UNIT-TEST-ONLY', structured_output: { semantic_review: require('./helpers/review-attestation-fixture').semantic(produced.artifacts.reviewContext, findings), native_assessment_observations: [] } });
  } });
}
function setup(t) {
  const cwd = fixture(t), base = Chain.produce(Driver.benchmarkRecipe(cwd), { cwd });
  const report = receipt(cwd, base, [{ category: 'PLAN_GAP', target_type: 'PLAN_ITEM',
    target_id: base.artifacts.planContract.plan_items[0].plan_item_id,
    finding: 'Les intentions 3 contredisent la source 2.', evidence: ['source Git et intentions'],
    required_correction: 'Corriger exclusivement les deux intentions pour obtenir 2.', dependency_target_ids: [] }]);
  const correction = Driver.deriveCorrection(cwd, base, report), next = Chain.produce(correction.recipe, { cwd });
  return { cwd, base, report, correction, next };
}
test('revision supervisor preserves immutable source, scope and causal findings through exactly one correction', t => {
  const f = setup(t), nextReceipt = receipt(f.cwd, f.next, []);
  const artifacts = Driver.completeRevision(f.base, f.report, f.correction, f.next, nextReceipt);
  assert.equal(artifacts.revision_outcome.status, 'RESOLVED');
  assert.equal(f.next.artifacts.planningEnvelope.planning_mode, 'REVISION');
  assert.equal(f.next.register_input.revisionCount, 1);
  assert.deepEqual(f.next.artifacts.planContract.boundaries, f.base.artifacts.planContract.boundaries);
  assert.deepEqual(f.next.artifacts.planningEnvelope.source_manifest, f.base.artifacts.planningEnvelope.source_manifest);
  assert.equal(f.next.artifacts.revisionArtifacts, null, 'post-review outcome must not mutate the reviewed produced object');
});
test('revision publication prepares an exact new dossier and preserves all other registered slices', t => {
  const f = setup(t), nextReceipt = receipt(f.cwd, f.next, []);
  const bundle = Driver.completeRevision(f.base, f.report, f.correction, f.next, nextReceipt);
  const ready = Driver.preparePublication(f.cwd, f.base, f.report, f.next, nextReceipt, bundle);
  const oldRegistry = JSON.parse(fs.readFileSync(path.join(f.cwd, '.github/orchestration/v2-activation-registry.json'), 'utf8'));
  const newRegistry = JSON.parse(ready.publication.find(x => x.path === '.github/orchestration/v2-activation-registry.json').content);
  assert.deepEqual(newRegistry.activations.filter(x => x.slice_id !== 'VNEXT-12-QUALIF'), oldRegistry.activations.filter(x => x.slice_id !== 'VNEXT-12-QUALIF'));
  assert.equal(Object.hasOwn(ready.transport, 'gate_ref'), false, 'preparation must not fabricate an operational gate');
  const reservation = { gate_ref: 'issue_comment:100', repository: 'MyUncried/Application-Routine', issue_number: 269,
    prepared_chain_hash: ready.prepared.contract_hash };
  const reservationApi = { comment: () => ({ id: 100, issue_url: 'https://api.github.com/repos/MyUncried/Application-Routine/issues/269', body: CLI.reservationMessage(ready.prepared) }) };
  const finalTransport = CLI.finalizeTransport(ready.prepared, ready.transport, reservation, { cwd: f.cwd, github: reservationApi });
  assert.equal(finalTransport.gate_ref, reservation.gate_ref);
  assert.notEqual(finalTransport.request_id, CLI.finalizeTransport(ready.prepared, ready.transport, reservation, { cwd: f.cwd, github: reservationApi }).request_id);
  assert.throws(() => CLI.finalizeTransport(ready.prepared, { ...ready.transport, unexpected_field: true }, reservation, { cwd: f.cwd, github: reservationApi }), /PREPARATORY_TRANSPORT_KEYS_INVALID/);
  assert.throws(() => CLI.finalizeTransport(ready.prepared, ready.transport, { ...reservation, gate_ref: 'issue_comment:1' }, { cwd: f.cwd, github: reservationApi }), /REAL_GATE_REQUIRED/);
  assert.throws(() => CLI.finalizeTransport(ready.prepared, { ...ready.transport, gate_ref: 'issue_comment:1' }, reservation, { cwd: f.cwd, github: reservationApi }), /PREPARATORY_GATE_FORBIDDEN/);
  assert.equal(ready.prepared.produced.artifacts.planningEnvelope.planning_mode, 'REVISION');
  assert.equal(Chain.approvalTarget(ready.prepared, { cwd: f.cwd, protocolHead: f.next.producer_revision }).execution_core.planning_mode, 'REVISION');
  for (const row of ready.publication) {
    fs.mkdirSync(path.dirname(path.join(f.cwd, row.path)), { recursive: true });
    fs.writeFileSync(path.join(f.cwd, row.path), row.content);
  }
  const git = (...args) => execFileSync('git', args, { cwd: f.cwd, encoding: 'utf8' }).trim();
  git('add', '.'); git('commit', '-m', 'unit fixture revision dossier; no operational approval');
  const head = git('rev-parse', 'HEAD'), target = Chain.approvalTarget(ready.prepared, { cwd: f.cwd, protocolHead: head });
  const github = { comment: () => ({ id: 100, issue_url: 'https://api.github.com/repos/MyUncried/Application-Routine/issues/269',
    updated_at: '2026-09-30T00:28:00.000Z', body: head + '\n' + Approval.renderApprovalMessage(target) }),
  reactions: () => [{ id: 2, content: '+1', user: { login: 'MyUncried' }, created_at: '2026-09-30T00:29:00.000Z' }] };
  const tr = finalTransport; // Bound to the observed reservation above; fixture only.
  const seed = { slice_id: 'VNEXT-12-QUALIF', issue_number: 269, source_head: head,
    slice_bootstrap_file: tr.slice_bootstrap_file, slice_bootstrap_sha256: tr.slice_bootstrap_sha256,
    authorized_plan: { plan_path: tr.plan_path }, independent_review: { review_path: tr.review_path },
    prompt_file: tr.prompt_file, user_gate: { gate_ref: tr.gate_ref }, request_id: tr.request_id, created_at: tr.created_at };
  const derived = Chain.deriveQueue(seed, { cwd: f.cwd, github });
  assert.equal(derived.artifacts.cumulativeRegister.revision_count, 1);
  fs.writeFileSync(path.join(f.cwd, 'queue.json'), JSON.stringify(derived.projection.legacy_queue_request));
  assert.equal(Chain.admit('queue.json', { cwd: f.cwd, github }).admission.status, 'AUTHORIZED');
  assert.throws(() => Chain.admit('queue.json', { cwd: f.cwd, github: { ...github, reactions: () => [] } }), /OWNER_APPROVAL_REQUIRED/);
});
test('revision supervisor refuses an approved negative benchmark instead of inventing a REVISE', t => {
  const cwd = fixture(t), base = Chain.produce(Driver.benchmarkRecipe(cwd), { cwd });
  assert.throws(() => Driver.deriveCorrection(cwd, base, receipt(cwd, base, [])), /EXPECTED_REAL_REVISE/);
});
test('revision supervisor refuses a corrected plan still rejected by the reviewer', t => {
  const f = setup(t);
  const rejected = receipt(f.cwd, f.next, [{ category: 'PLAN_GAP', target_type: 'PLAN_ITEM',
    target_id: f.next.artifacts.planContract.plan_items[0].plan_item_id, finding: 'Défaut encore présent.',
    evidence: ['unit fixture'], required_correction: 'Ne pas poursuivre.', dependency_target_ids: [] }]);
  assert.throws(() => Driver.completeRevision(f.base, f.report, f.correction, f.next, rejected), /LIVE_REVIEW_NOT_APPROVED/);
});
test('revision supervisor refuses an unrelated change outside the authorized plan correction', t => {
  const f = setup(t);
  const recipe = structuredClone(f.correction.recipe);
  recipe.classifications[0].impact_reason = 'Changement étranger à la correction autorisée.';
  const next = Chain.produce(recipe, { cwd: f.cwd });
  assert.throws(() => Driver.completeRevision(f.base, f.report, f.correction, next, receipt(f.cwd, next, [])), /DEPENDENCY_MUTATED|PRESERV/);
});
test('revision benchmark accepts real-shaped dependency evidence while changing only the plan intents', t => {
  const cwd = fixture(t), base = Chain.produce(Driver.benchmarkRecipe(cwd), { cwd });
  const a = base.artifacts, item = a.planContract.plan_items[0];
  const report = receipt(cwd, base, [{ category: 'PLAN_GAP', target_type: 'PLAN_ITEM',
    target_id: item.plan_item_id, finding: 'Les intentions 3 contredisent la source 2.',
    evidence: ['unit fixture of the dependency closure observed in run 36850188454'],
    required_correction: 'Corriger exclusivement les deux intentions pour obtenir 2.',
    dependency_target_ids: [a.requirementRegistry.requirements[0].requirement_id,
      a.requirementRegistry.coverage[0].unit_id, ...a.impactGraph.impacts.map(x => x.impact_id),
      item.test_obligations[0].test_id, item.proof_obligations[0].proof_id,
      ...a.impactGraph.impacts.map(x => x.candidate_id)] }]);
  const correction = Driver.deriveCorrection(cwd, base, report);
  assert.equal(correction.patch.correction_count, 1);
  assert.equal(correction.patch.corrections[0].target_id, item.plan_item_id);
  const next = Chain.produce(correction.recipe, { cwd });
  assert.equal(Driver.completeRevision(base, report, correction, next, receipt(cwd, next, [])).revision_outcome.status, 'RESOLVED');
  const changed = structuredClone(correction.recipe);
  changed.classifications[0].impact_reason = 'Unrelated mutation of a dependency authorized as evidence.';
  const altered = Chain.produce(changed, { cwd });
  assert.throws(() => Driver.completeRevision(base, report, correction, altered, receipt(cwd, altered, [])), /DEPENDENCY_MUTATED/);
});
test('revision benchmark refuses a blocking finding directly targeting a dependency', t => {
  const cwd = fixture(t), base = Chain.produce(Driver.benchmarkRecipe(cwd), { cwd });
  const item = base.artifacts.planContract.plan_items[0];
  const report = receipt(cwd, base, [
    { category: 'PLAN_GAP', target_type: 'PLAN_ITEM', target_id: item.plan_item_id,
      finding: 'Intentions incorrectes.', evidence: ['unit fixture'], required_correction: 'Corriger.', dependency_target_ids: [] },
    { category: 'PROOF_GAP', target_type: 'PROOF', target_id: item.proof_obligations[0].proof_id,
      finding: 'Preuve incorrecte.', evidence: ['unit fixture'], required_correction: 'Modifier la preuve.', dependency_target_ids: [] }]);
  assert.throws(() => Driver.deriveCorrection(cwd, base, report), /REVISION_REQUIRES_DIAGNOSIS/);
});
test('live revision handoff binds both real-format receipts without rewriting the reviewed proposal', t => {
  const f = setup(t), nextReceipt = receipt(f.cwd, f.next, []);
  const bundle = Driver.completeRevision(f.base, f.report, f.correction, f.next, nextReceipt);
  const evidence = { base_produced: f.base, base_review_receipt: f.report, revision_artifacts: bundle };
  const ready = Chain.prepare(f.next, nextReceipt, F.transport(), { cwd: f.cwd, revisionEvidence: evidence });
  const a = Chain.preparedArtifacts(ready.prepared, f.cwd, f.next.producer_revision);
  assert.deepEqual(a.revisionArtifacts, bundle);
  assert.equal(ready.prepared.produced.contract_hash, f.next.contract_hash);
  assert.equal(nextReceipt.produced_chain_hash, f.next.contract_hash);
  assert.throws(() => Chain.prepare(f.next, nextReceipt, F.transport(), { cwd: f.cwd }), /REVISION_EVIDENCE_REQUIRED/);
  const tampered = structuredClone(ready.prepared);
  tampered.revision_evidence.base_review_receipt.session_id = 'forged-session';
  delete tampered.revision_evidence.base_review_receipt.contract_hash;
  tampered.revision_evidence.base_review_receipt = V.sealContract(tampered.revision_evidence.base_review_receipt);
  delete tampered.contract_hash;
  assert.throws(() => Chain.preparedArtifacts(V.sealContract(tampered), f.cwd, f.next.producer_revision), /RECEIPT_RESULT_INVALID/);
  const wrongBase = structuredClone(ready.prepared);
  wrongBase.revision_evidence.revision_artifacts.base_artifacts.planContract = f.next.artifacts.planContract;
  delete wrongBase.contract_hash;
  assert.throws(() => Chain.preparedArtifacts(V.sealContract(wrongBase), f.cwd, f.next.producer_revision), /BASE_ARTIFACTS_MISMATCH/);
  const wrongOutcome = structuredClone(ready.prepared);
  wrongOutcome.revision_evidence.revision_artifacts.revision_outcome.preserved_target_count = 0;
  delete wrongOutcome.revision_evidence.revision_artifacts.revision_outcome.contract_hash;
  wrongOutcome.revision_evidence.revision_artifacts.revision_outcome = V.sealContract(wrongOutcome.revision_evidence.revision_artifacts.revision_outcome);
  delete wrongOutcome.contract_hash;
  assert.throws(() => Chain.preparedArtifacts(V.sealContract(wrongOutcome), f.cwd, f.next.producer_revision), /OUTCOME_MISMATCH/);
});

test('D5 preserved base receipt is reused only for the exact produced candidate',t=>{
  const {cwd,base,report:original}=setup(t);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-resume-'));
  try {
    fs.writeFileSync(path.join(dir,'base-produced.json'),JSON.stringify(base));
    fs.writeFileSync(path.join(dir,'base-review-receipt.json'),JSON.stringify(original));
    assert.deepEqual(Driver.loadResumedBase(base,dir,{cwd}),original);
    fs.writeFileSync(path.join(dir,'base-produced.json'),JSON.stringify({...base,contract_hash:'0'.repeat(64)}));
    assert.throws(()=>Driver.loadResumedBase(base,dir,{cwd}),/RESUME_BASE_CHANGED/);
    fs.writeFileSync(path.join(dir,'base-produced.json'),JSON.stringify(base));
    fs.writeFileSync(path.join(dir,'base-review-receipt.json'),JSON.stringify({...original,session_id:'invented'}));
    assert.throws(()=>Driver.loadResumedBase(base,dir,{cwd}),/RECEIPT_HASH_INVALID/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('D8 canonical VNext projection reaches the common requirement review and finalizer without empty-plan approval', t => {
  const f=setup(t), nextReceipt=receipt(f.cwd,f.next,[]);
  const revision=Driver.completeRevision(f.base,f.report,f.correction,f.next,nextReceipt);
  const ready=Driver.preparePublication(f.cwd,f.base,f.report,f.next,nextReceipt,revision);
  const body=ready.publication.find(row=>row.path.endsWith('/technical-plan.md')).content;
  const requirements=require('../../scripts/kodjo/lib/requirement-contract').verifyEmbedded(body);
  assert.equal(requirements.requirement_contract.requirement_count,1);
  assert.ok(body.includes(f.next.artifacts.requirementRegistry.requirements[0].requirement_id));
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-downstream-unit-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file=(name,body)=>{const p=path.join(dir,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,body);return p;};
  const plan=file('plan.md',body),changed=file('changed.txt',f.next.artifacts.planContract.boundaries.write_scope.map(row=>row.path).join('\n'));
  const prepare=file('input.json','{}'),verified=file('verified.json','{}');
  const node=(script,args,env=process.env)=>require('node:child_process').spawnSync(process.execPath,[path.join(ROOT,'scripts/kodjo',script),...args],{cwd:f.cwd,encoding:'utf8',env});
  let result=node('verify-ui-implementation-review.js',['prepare',plan,changed,prepare]);assert.equal(result.status,0,result.stderr);
  const input=JSON.parse(fs.readFileSync(prepare,'utf8'));assert.equal(input.non_ui_requirement_count,1);
  const review={schema:'kodjo.ui-implementation-review.v1',verdict:'APPROVE',device_gate_required:false,criteria:[],
    boundary_results:input.boundary_requirements.map(row=>({...row,status:'PASS',evidence:'UNIT TEST ONLY: preserved fixture'})),
    non_ui_plan_assessment:{status:'CONFORME',evidence:'UNIT TEST ONLY: exact canonical source checked',requirements:input.non_ui_requirements.map(row=>({requirement_id:row.requirement_id,status:'CONFORME',evidence:'UNIT TEST ONLY: mock proof',proof_results:row.proof_required.map(proof_type=>({proof_type,status:'PASS',evidence:'UNIT TEST ONLY: mock proof'}))}))}};
  // Explicit unit adapter, never a published Jest/Claude/device receipt.
  const evidence=file('unit-test-evidence.json',JSON.stringify({schema:'kodjo.test-contract-evidence.v1',binding_count:requirements.test_contract.binding_count,bindings:requirements.test_contract.bindings.map(row=>({...row,status:'PASS'}))}));
  const raw=file('review.json',JSON.stringify(review)),env={...process.env,KODJO_TEST_CONTRACT_EVIDENCE_FILE:evidence};
  result=node('verify-ui-implementation-review.js',['validate',plan,changed,raw,verified],env);assert.equal(result.status,0,result.stderr);
  const contract=JSON.parse(fs.readFileSync(verified,'utf8')),head='d'.repeat(40),base='c'.repeat(40),slice='VNEXT-12-QUALIF';
  const queueRel='.github/orchestration/queue/v2/UNIT.json',queue=file(queueRel,JSON.stringify({schema_version:'kodjo.protocol.v2.lean-request.0.6.13',slice_id:slice,issue_number:269,authorized_plan:{plan_blob_oid:'e'.repeat(40)}}));
  const impl=file('implementation.md',`[KODJO_SLICE] IMPLEMENTATION_OUTPUT\nslice_id=${slice}\nhead=${head}\nbase_head=${base}\ncontinuity_origin=V2_LEAN_QUEUE\nv2_queue_path=${queueRel}\napplication_pr=200\napplication_branch=unit/fixture\nSTATUT : IMPLEMENTATION_READY_FOR_REVIEW\n`);
  const rendered=()=>`[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT\nslice_id=${slice}\nhead=${head}\nsource_implementation_comment_id=103\nverdict=APPROVE\ndevice_gate_required=false\nSTATUT : IMPLEMENTATION_REVIEW_APPROVED\n<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>${JSON.stringify(contract)}</KODJO_UI_IMPLEMENTATION_REVIEW_JSON>`;
  const reviewFile=file('review.md',rendered()),visual=file('visual.md',`[KODJO_SLICE] VISUAL_APPROVED\nslice_id=${slice}\nhead=${head}\nsource_review_comment_id=104\n`),out=file('final.json','{}');
  const args=[reviewFile,impl,visual,queue,'269','104','105',out];
  result=node('verify-v2-finalization.js',args);assert.equal(result.status,0,result.stderr);
  assert.equal(JSON.parse(fs.readFileSync(out,'utf8')).final_status,'READY_TO_CLOSE');
  contract.non_ui_plan_assessment.requirements[0].proof_results[0].status='FAIL';fs.writeFileSync(reviewFile,rendered());
  result=node('verify-v2-finalization.js',args);assert.notEqual(result.status,0);assert.match(result.stderr,/TECHNICAL_PROOF_NOT_PASS/);
  contract.non_ui_plan_assessment.requirements=[];fs.writeFileSync(reviewFile,rendered());
  assert.notEqual(node('verify-v2-finalization.js',args).status,0);
});


test('revision benchmark links a TEST finding to its exact plan intent without altering its obligation', t => {
  const cwd = fixture(t), base = Chain.produce(Driver.benchmarkRecipe(cwd), { cwd });
  const item = base.artifacts.planContract.plan_items[0], obligation = item.test_obligations[0];
  const change = item.change_items.find(row => row.impact_id === obligation.target_impact_id);
  const finding = { category: 'TEST_GAP', target_type: 'TEST', target_id: obligation.test_id,
    finding: 'Test intent 3 conflicts with the unchanged obligation 2.', evidence: ['UNIT TEST ONLY'],
    required_correction: 'Correct the intent of ' + change.change_id + ' to expect 2; preserve the obligation.',
    dependency_target_ids: [item.plan_item_id] };
  const report = receipt(cwd, base, [finding]), correction = Driver.deriveCorrection(cwd, base, report);
  assert.equal(correction.patch.correction_count, 1);
  assert.equal(correction.patch.corrections[0].target_id, item.plan_item_id);
  assert.deepEqual(correction.patch.corrections[0].finding_ids, report.review_report.findings.map(row => row.finding_id));
  const next = Chain.produce(correction.recipe, { cwd });
  assert.deepEqual(next.artifacts.planContract.plan_items[0].test_obligations, item.test_obligations);
  assert.equal(Driver.completeRevision(base, report, correction, next, receipt(cwd, next, [])).revision_outcome.status, 'RESOLVED');
  for (const altered of [
    { ...finding, required_correction: 'Change the expected test result to 3.' },
    { ...finding, dependency_target_ids: [] },
    { ...finding, required_correction: 'Correct ' + item.change_items.find(row => row.change_id !== change.change_id).change_id },
  ]) assert.throws(() => Driver.deriveCorrection(cwd, base, receipt(cwd, base, [altered])), /CORRECTION_NOT_AUTHORIZED|REQUIRES_DIAGNOSIS/);
  const mutation = structuredClone(correction.recipe);
  mutation.requirementPlans[0].test_obligations[0].expected = 'Changed obligation';
  const mutated = Chain.produce(mutation, { cwd });
  assert.throws(() => Driver.completeRevision(base, report, correction, mutated, receipt(cwd, mutated, [])), /OBLIGATION_MUTATED/);
});
