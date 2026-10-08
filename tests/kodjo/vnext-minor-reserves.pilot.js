'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const F=require('./helpers/vnext-coverage-fixture'),C=require('../../scripts/kodjo/lib/vnext-review-coverage'),V=require('../../scripts/kodjo/lib/vnext-contract');
test('IA-F07 validated transport retains accepted omissions, exact provenance and complete status',()=>{
 const e=F.evidence(),r=C.fromPlan(F.plan(e));assert.deepEqual(r.pending_target_ids,e.report.pending_target_ids);assert.equal(r.pending_target_ids.length,3);assert.equal(r.review_report_hash,e.report.contract_hash);assert.equal(r.coverage_status,'ACCEPTED_WITH_PENDING_SECONDARY_TARGETS');
 assert.equal(C.fromPlan(F.plan(F.evidence(0))).coverage_status,'COMPLETE');
 assert.deepEqual(C.fromPlan('historical plan'),{coverage_status:'NOT_RECORDED',pending_target_ids:null});
});
test('IA-F07 transport rejects forged omissions, essential gaps, excessive tolerance and conflicting blocks',()=>{
 const e=F.evidence();const drift=structuredClone(e);drift.report.pending_target_ids=[];delete drift.report.contract_hash;drift.report=V.sealContract(drift.report);
 assert.throws(()=>C.fromPlan(F.plan(drift)),/REBUILD|MISMATCH/);
 assert.throws(()=>F.evidence(4),/COVERAGE_INCOMPLETE/);
 assert.throws(()=>C.fromPlan(F.plan(e).replace('plan_contract_hash='+e.report.plan_contract_hash,'plan_contract_hash='+ 'a'.repeat(64))),/COVERAGE_BINDING/);
 assert.throws(()=>C.fromPlan(F.plan(e)+'\n'+F.plan(F.evidence(0))),/CONFLICTING_BLOCKS/);
});
test('IA-F09 absent historical package may skip, present invalid certification fails the VNext job',()=>{
 const workflow=fs.readFileSync('.github/workflows/kodjo-vnext-historical-checks.yml','utf8');
 const download=workflow.split('- name: Download the real run 16 recovery package')[1].split('- name: Certify')[0];assert.match(download,/continue-on-error: true/);
 const certify=workflow.split('- name: Certify present historical run 16 recovery package')[1].split('- name: Preserve')[0];assert.doesNotMatch(certify,/continue-on-error/);assert.match(certify,/if: steps.historical_recovery.outcome == 'success'/);assert.match(certify,/if \(\$LASTEXITCODE -ne 0\) \{ exit \$LASTEXITCODE \}/);
 assert.match(workflow,/HISTORICAL_RECOVERY_CERTIFICATION_FAILED/);assert.match(workflow,/HISTORICAL_RECOVERY_ARTIFACT_UNAVAILABLE/);
});
test('IA-F07 canonical producer transports a validated report and refuses another plan hash',()=>{
 const P=require('./helpers/vnext-planning-fixture'),repo=P.fixtureRepo();
 try{const m=P.sourceManifest(),a=P.buildPlanningArtifacts({repo,manifest:m,envelope:P.makeEnvelope(m,repo,'INITIAL',null)});
 const Review=require('../../scripts/kodjo/lib/review-contract'),A=require('../../scripts/kodjo/lib/vnext-legacy-queue-adapter');
 const report=Review.buildReviewReport(require('./helpers/review-attestation-fixture').attested({reviewContext:a.reviewContext,reviewArtifacts:a,semanticReview:{findings:[]}}));
 const args=[{application_head:repo.revision,plan_contract_hash:a.planContract.contract_hash},a.planContract,null,a.requirementRegistry,a.candidateManifest];
 const plan=A.renderCompatibilityPlan(...args,{context:a.reviewContext,report});assert.equal(C.fromPlan(plan).review_report_hash,report.contract_hash);
 const altered={...report,plan_contract_hash:'a'.repeat(64)};delete altered.contract_hash;
 assert.throws(()=>A.renderCompatibilityPlan(...args,{context:a.reviewContext,report:V.sealContract(altered)}),/MISMATCH|BINDING/);
 }finally{fs.rmSync(repo.cwd,{recursive:true,force:true});}
});
test('IA-F08 authoritative closure validator refuses other legacy product slices before writing',()=>{
 const Closure=require('../../scripts/kodjo/lib/vnext-github-closure');
 const config={stage:'FINALIZE_DELIVERY',repository:'MyUncried/Application-Routine',slice_id:'V2-CAT-01',campaign_id:'628b3349-88b4-4bf1-be6b-50bc09e7d245',closure_scope:'GITHUB_SLICE_DELIVERY',pre1_in_scope:false,final_audit_authorized:false,revision_limit:1,issue_number:900,delivery_pr_number:901,delivery_branch:'feat/legacy',base_branch:'main',delivery_head:'a'.repeat(40),finalization_manifest:'docs/finalization.json',issue_body_sha256:'a'.repeat(64)};
 assert.throws(()=>Closure.validateConfig(config),/LEGACY_SLICE_REFUSED/);
});
