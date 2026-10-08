'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const F=require('./helpers/vnext-post-acceptance-fixture'),Transport=require('./helpers/vnext-planning-fixture');
const V=require('../../scripts/kodjo/lib/vnext-contract'),Chain=require('../../scripts/kodjo/lib/vnext-live-chain');
const Post=require('../../scripts/kodjo/lib/vnext-post-acceptance'),Review=require('../../scripts/kodjo/lib/review-contract');
const Runtime=require('../../scripts/kodjo/lib/vnext-runtime'),Approval=require('../../scripts/kodjo/lib/approval-handoff-contract');
const seal=v=>{const copy=structuredClone(v);delete copy.contract_hash;return V.sealContract(copy);};
test('post-acceptance revision integration uses owner gaps, preserves APPROVE and prepares an authorized correction',async t=>{
 const f=F.fixture();t.after(()=>f.cleanup());
 const ready=Chain.prepare(f.produced,f.receipt,Transport.transport(),{cwd:f.cwd,github:f.github,revisionEvidence:f.revisionEvidence});
 await t.test('nominal: approved delivery -> acceptance gaps -> revision -> review -> immutable plan -> runtime admission',()=>{
  assert.equal(f.baseReceipt.review_report.verdict,'APPROVE');assert.equal(f.produced.artifacts.planningEnvelope.created_from.kind,'ACCEPTANCE_GAPS');
  assert.deepEqual(f.produced.artifacts.planningEnvelope.causal_findings,[]);assert.equal(f.outcome.status,'RESOLVED');
  assert.equal(f.baseline.finalization,undefined);assert.equal(f.baseline.acceptance.decision,'AUTHORIZE_REVISION');
  assert.equal(f.receipt.review_report.acceptance_resolutions[0].status,'RESOLVED');
  assert.ok(!f.produced.artifacts.planContract.boundaries.write_scope.some(r=>r.path===f.profile));
  for(const file of Object.values(ready.compatibility_files))f.write(file.path,file.content);
  f.write('prepared-post-acceptance.json',JSON.stringify(ready.prepared));f.git('add','.');f.git('commit','-m','local fixture immutable revision publication');
  const head=f.git('rev-parse','HEAD'),a=Chain.preparedArtifacts(ready.prepared,f.cwd,head,f.github);
  const state={...a.currentState,native_primitive_decisions:[]},approved=Transport.approve(a,f.receipt.review_report,state);
  const cumulativeRegister=require('../../scripts/kodjo/lib/vnext-audit-register').buildRegister({...f.produced.register_input,candidateHead:head,lot:a.planningEnvelope.slice_id,phase:'HANDOFF'});
  const snapshot=Runtime.buildRuntimeSnapshot({...a,...approved,currentState:state,cumulativeRegister});
  assert.equal(snapshot.stages.find(s=>s.stage==='REVISION').status,'RESOLVED');Runtime.validateRuntimeSnapshot(snapshot);
  const supervisor=require('../../scripts/kodjo/execute-vnext12');
  supervisor.validateAdmittedRevision({...a,cumulativeRegister});
  assert.throws(()=>supervisor.validateAdmittedRevision({...a,cumulativeRegister,revisionArtifacts:{...a.revisionArtifacts,outcome:{...a.revisionArtifacts.outcome,status:'OPEN'}}}),/REAL_BOUNDED_REVISION_REQUIRED/);
  const target=Chain.approvalTarget(ready.prepared,{cwd:f.cwd,protocolHead:head,github:f.github});
  assert.equal(target.execution_core.planning_mode,'REVISION');assert.equal(target.execution_core.application_head,f.baseline.delivery.head);
  assert.ok(Approval.renderApprovalMessage(target).includes(target.contract_hash));
 });
 await t.test('owner identity, issue, exact delivered head and old review identity are mandatory',()=>{
  const original=structuredClone(f.comments);
  for(const patch of [{user:{login:'outsider'}},{issue_url:'https://api.github.com/repos/MyUncried/Application-Routine/issues/998'}]){
   f.comments[202]={...original[202],...patch};assert.throws(()=>Post.observe(f.reference,{cwd:f.cwd,readGit:Chain.readGit,github:f.github}),/SOURCE_COMMENT_ORIGIN_MISMATCH/);
  }
  f.comments[202]=original[202];const wrong={...f.reference,delivery_head:f.baseProduced.producer_revision};
  assert.throws(()=>Post.observe(wrong,{cwd:f.cwd,readGit:Chain.readGit,github:f.github}),/REVIEW_HEAD_MISMATCH/);
  f.comments[201]={...original[201],user:{login:'outsider'}};
  assert.throws(()=>Post.observe(f.reference,{cwd:f.cwd,readGit:Chain.readGit,github:f.github}),/SOURCE_COMMENT_ORIGIN_MISMATCH/);f.comments[201]=original[201];
 });
 await t.test('a genuine correction outside the owner-authorized paths is refused',()=>{
  const raw=structuredClone(f.baseline);raw.acceptance.gaps[0].allowed_write_paths=['tests/core.test.js'];raw.acceptance_body='<KODJO_VNEXT_ACCEPTANCE_GAPS_JSON>'+JSON.stringify(raw.acceptance)+'</KODJO_VNEXT_ACCEPTANCE_GAPS_JSON>';
  const baseline=seal(raw),a=structuredClone(f.produced.artifacts);a.planContract.delivery_preservation.baseline=baseline;
  a.planningEnvelope.source_manifest.sources[0].fingerprint=V.sha256(baseline.acceptance_body);
  assert.throws(()=>Post.validateBindings(baseline,a.acceptanceBindings,a),/WRITE_OUTSIDE_AUTHORIZATION/);
 });
 await t.test('missing, duplicate or unresolved gap resolutions cannot yield an approved revised plan',()=>{
  const base=require('./helpers/review-attestation-fixture').semantic(f.produced.artifacts.reviewContext);
  assert.throws(()=>Review.buildReviewReport({reviewContext:f.produced.artifacts.reviewContext,semanticReview:base}),/RESOLUTION_REQUIRED/);
  const row=f.receipt.review_report.acceptance_resolutions[0];
  for(const rows of [[],[row,row],[{...row,gap_id:'UNKNOWN'}]])assert.throws(()=>Review.buildReviewReport({reviewContext:f.produced.artifacts.reviewContext,semanticReview:{...base,acceptance_resolutions:rows}}),/RESOLUTION_COVERAGE_INVALID/);
  const report=Review.buildReviewReport({reviewContext:f.produced.artifacts.reviewContext,semanticReview:{...base,acceptance_resolutions:[{...row,status:'OPEN'}]}});assert.equal(report.verdict,'REVISE');
  assert.throws(()=>Post.buildOutcome({baseline:f.baseline,bindings:f.produced.artifacts.acceptanceBindings,artifacts:f.produced.artifacts,reviewReport:report,baseRegister:f.baseRegister,cumulativeRegister:f.nextRegister}),/NOT_RESOLVED/);
 });
 await t.test('technical failures and omitted retained assertions cannot enter the pre-closure baseline',()=>{
  const bad=structuredClone(f.baseline);bad.review.criteria[0].proof_results[0].status='FAIL';assert.throws(()=>Post.validateBaseline(seal(bad)),/TECHNICAL_GAP/);
  const missing=structuredClone(f.baseline);missing.review.criteria[0].assertion_results=[];assert.throws(()=>Post.validateBaseline(seal(missing)),/ASSERTION_COVERAGE_INVALID/);
  const changed=structuredClone(f.baseline);changed.acceptance.gaps[0].criterion_id='UNKNOWN';changed.acceptance_body='<KODJO_VNEXT_ACCEPTANCE_GAPS_JSON>'+JSON.stringify(changed.acceptance)+'</KODJO_VNEXT_ACCEPTANCE_GAPS_JSON>';
  assert.throws(()=>Post.validateBaseline(seal(changed)),/GAP_TARGET_INVALID/);
 });
 await t.test('the old approved plan bytes and independent receipt remain bound, not replaceable by a fake REVISE',()=>{
  const evidence=structuredClone(f.revisionEvidence);evidence.base_review_receipt.review_report.verdict='REVISE';
  assert.throws(()=>Chain.prepare(f.produced,f.receipt,Transport.transport(),{cwd:f.cwd,github:f.github,revisionEvidence:evidence}),/HASH_INVALID/);
  const altered=structuredClone(f.revisionEvidence);altered.outcome.next_plan_hash='a'.repeat(64);altered.outcome=seal(altered.outcome);
  assert.throws(()=>Chain.prepare(f.produced,f.receipt,Transport.transport(),{cwd:f.cwd,github:f.github,revisionEvidence:altered}),/OUTCOME_MISMATCH/);
 });
 await t.test('recovery revalidates the saved response without another model call or a new approval target',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'post-acceptance-recovery-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));let calls=0;
  const receipt=Chain.reviewOrRecover(f.produced,{cwd:f.cwd,github:f.github,evidenceDirectory:dir,claude:'TEST-FIXTURE',invoke:()=>{calls++;return F.response(f.produced);}});
  const saved=fs.readFileSync(path.join(dir,'revision-review-response.json'),'utf8');
  const again=Chain.reviewOrRecover(f.produced,{cwd:f.cwd,github:f.github,evidenceDirectory:dir,invoke:()=>assert.fail('no extra model call')});
  assert.equal(again.raw_result,receipt.raw_result);assert.equal(calls,1);assert.equal(fs.readFileSync(path.join(dir,'revision-review-response.json'),'utf8'),saved);
 });
});
