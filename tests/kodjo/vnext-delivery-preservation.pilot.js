'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), os=require('node:os'), path=require('node:path');
const {execFileSync,spawnSync}=require('node:child_process');
const V=require('../../scripts/kodjo/lib/vnext-contract'), Delivery=require('../../scripts/kodjo/lib/vnext-delivery-preservation');
const Adapter=require('../../scripts/kodjo/lib/vnext-legacy-queue-adapter'), Req=require('../../scripts/kodjo/lib/requirement-contract');
const {sha256}=require('../../scripts/kodjo/lib/plan-impact');
const {matrixFingerprint}=require('../../scripts/kodjo/lib/ui-criteria-contract');
const F=require('./helpers/vnext-planning-fixture');
const root=path.resolve(__dirname,'../..');
function cli(script,args,cwd){const evidence=script==='verify-ui-implementation-review.js'?path.join(path.dirname(args[1]),'test-evidence.json'):'';return spawnSync(process.execPath,[path.join(root,'scripts/kodjo',script),...args],{cwd,encoding:'utf8',env:{...process.env,...(evidence&&fs.existsSync(evidence)?{KODJO_TEST_CONTRACT_EVIDENCE_FILE:evidence,KODJO_EXPECTED_REVIEW_HEAD:execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim()}: {})}});}
function fixture(atomic=false){
 const repo=F.fixtureRepo(), dir=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-delivery-evidence-'));
 const profile='src/features/preferences/profilePhoto.ts';
 const matrix={schema:'kodjo.ui-criteria.v1',criteria:[{criterion_id:'UI-103FBF8D197A',source:{path:'docs/profile.md',locator:'profile',requirement:'Modifier le profil'},risk_types:['FUNCTIONAL'],reuse_search:['src/shared/ui'],component_decision:'REUSE',selected_component:'Profile',decision_justification:'Existing delivery',change_targets:[profile],tests:['tests/profile.test.js'],proof_required:['FUNCTIONAL_TEST']}],preservation:{preserve:[],change:[],forbidden:[]}};
 fs.mkdirSync(path.dirname(path.join(repo.cwd,profile)),{recursive:true});fs.writeFileSync(path.join(repo.cwd,profile),"module.exports={value:require('../../core.js').value};\n");
 fs.writeFileSync(path.join(repo.cwd,'tests/profile.test.js'),"const assert=require('node:assert/strict');assert.equal(require('../src/features/preferences/profilePhoto.ts').value,1);\n");
 const prior={schema:'kodjo.ui-implementation-review.v1',verdict:'APPROVE',criteria:[{criterion_id:matrix.criteria[0].criterion_id,implementation_status:'CONFORME',preserve_status:'PASS',evidence:'FIXTURE: prior delivery',proof_results:[{proof_type:'FUNCTIONAL_TEST',status:'PASS',evidence:'FIXTURE: prior check'}]}]};
 if(atomic){matrix.schema='kodjo.ui-criteria.v2';matrix.criteria[0].assertions=[{assertion_id:'UI-103FBF8D197A-A000000000001',source:matrix.criteria[0].source,property_type:'INTERACTION',expected:'Profile remains correct',proof_required:['FUNCTIONAL_TEST']}];prior.criteria[0].assertion_results=[{assertion_id:matrix.criteria[0].assertions[0].assertion_id,status:'CONFORME',evidence:'FIXTURE previous check',proof_results:structuredClone(prior.criteria[0].proof_results)}];}
 const priorPlan='<KODJO_UI_CRITERIA_MATRIX_JSON>\n'+JSON.stringify(matrix)+'\n</KODJO_UI_CRITERIA_MATRIX_JSON>\n';
 const finalization={schema:'kodjo.ui-final-verification.v1',final_status:'READY_TO_CLOSE',head:repo.revision,slice_id:'V2-VNEXT-09',issue_number:999,plan_blob_oid:Adapter.gitBlobOid(priorPlan),technical_review_sha256:sha256(prior),criterion_count:1,criterion_ids_sha256:sha256([matrix.criteria[0].criterion_id]),implementation_review_comment_id:'201',human_device_approval_comment_id:'202',not_executed_proofs:[{requirement_id:'SQLITE-FIXTURE',status:'NOT_EXECUTED'}]};
 const blobs={'prior-plan.md':priorPlan,'prior-review.json':JSON.stringify(prior),'prior-finalization.json':JSON.stringify(finalization)};
 for(const [file,body]of Object.entries(blobs))fs.writeFileSync(path.join(repo.cwd,file),body);
 execFileSync('git',['add','.'],{cwd:repo.cwd});execFileSync('git',['commit','-m','fixture approved delivery evidence'],{cwd:repo.cwd});
 const ref={revision:execFileSync('git',['rev-parse','HEAD'],{cwd:repo.cwd,encoding:'utf8'}).trim(),plan_path:'prior-plan.md',review_path:'prior-review.json',finalization_path:'prior-finalization.json',repository:'MyUncried/Application-Routine',issue_number:999};
 const github={comment:(_r,id)=>({id:Number(id),user:{login:id==='201'?'github-actions[bot]':'MyUncried'},issue_url:'https://api.github.com/repos/MyUncried/Application-Routine/issues/999',body:id==='201'?'[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT\nhead='+finalization.head+'\n<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>'+JSON.stringify(prior)+'</KODJO_UI_IMPLEMENTATION_REVIEW_JSON>':'[KODJO_SLICE] VISUAL_APPROVED\nslice_id=V2-VNEXT-09\nhead='+finalization.head+'\nsource_review_comment_id=201'})};
 const readGit=(cwd,rev,file)=>execFileSync('git',['show',rev+':'+file],{cwd,encoding:'utf8'});
 const baseline=Delivery.observe(ref,{cwd:repo.cwd,readGit,github});
 const manifest=F.sourceManifest(),envelope=F.makeEnvelope(manifest,repo,'INITIAL');
 const a=F.buildPlanningArtifacts({repo,manifest,envelope});
 const raw=structuredClone(a.planContract);delete raw.contract_hash;raw.delivery_preservation=Delivery.build({baseline,replacements:[]},raw.plan_items,raw.boundaries.write_scope);a.planContract=V.sealContract(raw);
 const plan=Adapter.renderCompatibilityPlan({application_head:repo.revision,plan_contract_hash:a.planContract.contract_hash},a.planContract,null,a.requirementRegistry,a.candidateManifest);
 const file=(name,body)=>{const p=path.join(dir,name);fs.writeFileSync(p,body);return p;};
 return {repo,dir,baseline,a,plan,file,profile,ref,github,readGit,cleanup:()=>{fs.rmSync(repo.cwd,{recursive:true,force:true});fs.rmSync(dir,{recursive:true,force:true});}};
}
function prepare(f,changed=f.a.planContract.boundaries.write_scope.map(r=>r.path)){
 const paths=[...new Set(Req.verifyEmbedded(f.plan).test_contract.bindings.map(r=>r.test_path))];
 const results=paths.map(p=>{const r=spawnSync(process.execPath,[p],{cwd:f.repo.cwd,encoding:'utf8'});return {name:path.join(f.repo.cwd,p),status:r.status===0?'passed':'failed',assertionResults:[{status:r.status===0?'passed':'failed'}]};});
 const evidence=require('../../scripts/kodjo/verify-test-contract-results').verify(f.plan,{testResults:results},f.repo.cwd);
 f.file('test-evidence.json',JSON.stringify(evidence));
 const plan=f.file('plan.md',f.plan),delta=f.file('delta.txt',changed.join('\n')),input=f.file('input.json','');
 const r=cli('verify-ui-implementation-review.js',['prepare',plan,delta,input],f.repo.cwd);assert.equal(r.status,0,r.stderr);
 return {input:JSON.parse(fs.readFileSync(input)),plan,delta};
}
function reviewValue(input,failed=false){return {schema:'kodjo.ui-implementation-review.v1',verdict:failed?'REVISE':'APPROVE',criteria:input.criteria.map(c=>({criterion_id:c.criterion_id,implementation_status:failed?'NON_CONFORME':'CONFORME',preserve_status:failed?'FAIL':'PASS',evidence:'FIXTURE fresh inspection',proof_results:c.proof_required.map(type=>({proof_type:type,status:failed?'FAIL':'PASS',evidence:'FIXTURE fresh check'})),...(c.assertions?{assertion_results:c.assertions.map(a=>({assertion_id:a.assertion_id,status:failed?'NON_CONFORME':'CONFORME',evidence:'FIXTURE fresh assertion',proof_results:a.proof_required.map(type=>({proof_type:type,status:failed?'FAIL':'PASS',evidence:'FIXTURE fresh assertion check'}))}))}:{})})),non_ui_plan_assessment:{status:'CONFORME',requirements:input.non_ui_requirements.map(r=>({requirement_id:r.requirement_id,status:'CONFORME',evidence:'FIXTURE fresh correction check',proof_results:r.proof_required.map(type=>({proof_type:type,status:'PASS',evidence:'FIXTURE fresh check'}))}))},boundary_results:input.boundary_requirements.map(r=>({category:r.category,target:r.target,status:'PASS',evidence:'FIXTURE exact changed paths'}))};}
function finalize(f,review){
 const head='d'.repeat(40),base=f.baseline.finalization.head,queuePath='.github/orchestration/queue/v2/test.json';
 const reviewFile=f.file('review.md','[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT\nslice_id=V2-VNEXT-09\nhead='+head+'\nverdict='+review.verdict+'\ndevice_gate_required=false\nsource_implementation_comment_id=301\nSTATUT : IMPLEMENTATION_REVIEW_APPROVED\n<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>'+JSON.stringify(review)+'</KODJO_UI_IMPLEMENTATION_REVIEW_JSON>');
 const impl=f.file('implementation.md','[KODJO_SLICE] IMPLEMENTATION_OUTPUT\nslice_id=V2-VNEXT-09\nhead='+head+'\nbase_head='+base+'\ncontinuity_origin=V2_LEAN_QUEUE\nv2_queue_path='+queuePath+'\napplication_branch=fixture/correction\napplication_pr=302\nSTATUT : IMPLEMENTATION_READY_FOR_REVIEW');
 const visual=f.file('visual.md','[KODJO_SLICE] VISUAL_APPROVED\nslice_id=V2-VNEXT-09\nhead='+head+'\nsource_review_comment_id=303');
 const queue=path.join(f.dir,queuePath);fs.mkdirSync(path.dirname(queue),{recursive:true});fs.writeFileSync(queue,JSON.stringify({schema_version:'kodjo.protocol.v2.lean-request.0.6.13',slice_id:'V2-VNEXT-09',issue_number:999,authorized_plan:{plan_blob_oid:Adapter.gitBlobOid(f.plan)}}));
 return cli('verify-v2-finalization.js',[reviewFile,impl,visual,queue,'999','303','304',path.join(f.dir,'final.json')],f.dir);
}
test('delivered criterion outside correction scope is reviewed and finalized without expanding write authority',()=>{
 const f=fixture();try{
  const {input,plan,delta}=prepare(f);
  assert.equal(input.criteria[0].delivery_role,'RETAINED');assert.equal(input.criteria[0].review_scope,'AFFECTED');
  assert.equal(input.criteria[0].previous_head,f.baseline.finalization.head);
  assert.ok(!f.a.planContract.boundaries.write_scope.some(r=>r.path===f.profile));
  Req.verifyEmbedded(f.plan);
  const req=Req.verifyEmbedded(f.plan).test_contract.bindings;assert.ok(req.some(r=>r.test_path==='tests/profile.test.js'));
  const draft=reviewValue(input), raw=f.file('raw.json',JSON.stringify(draft)),out=path.join(f.dir,'validated.json');
  const validated=cli('verify-ui-implementation-review.js',['validate',plan,delta,raw,out],f.repo.cwd);assert.equal(validated.status,0,validated.stderr);
  const final=finalize(f,JSON.parse(fs.readFileSync(out)));assert.equal(final.status,0,final.stderr);
  const finalValue=JSON.parse(fs.readFileSync(path.join(f.dir,'final.json')));
  assert.equal(finalValue.criterion_count,1);assert.equal(finalValue.all_device_proofs_executed,false);
  assert.equal(finalValue.not_executed_proofs[0].status,'NOT_EXECUTED');
  assert.deepEqual(f.baseline.finalization.not_executed_proofs,[{requirement_id:'SQLITE-FIXTURE',status:'NOT_EXECUTED'}]);
  const original=JSON.stringify(f.baseline);prepare(f);assert.equal(JSON.stringify(f.baseline),original);
 }finally{f.cleanup();}
});
test('real modification outside correction scope is refused even if mentioned by a delivered criterion',()=>{
 const f=fixture();try{
  const plan=f.file('plan.md',f.plan),delta=f.file('delta.txt',f.profile),out=path.join(f.dir,'input.json');
  const r=cli('verify-ui-implementation-review.js',['prepare',plan,delta,out],f.repo.cwd);assert.notEqual(r.status,0);assert.match(r.stderr,/WRITE_OUTSIDE_CORRECTION/);
  const bad={baseline:f.baseline,replacements:[{criterion_id:'UI-103FBF8D197A',requirement_id:'MISSING'}]};
  assert.throws(()=>Delivery.build(bad,f.a.planContract.plan_items,f.a.planContract.boundaries.write_scope),/REPLACEMENT_REQUIRES_CHANGE/);
  const current=structuredClone(f.a.planContract);delete current.contract_hash;delete current.delivery_preservation;
  current.boundaries.write_scope.push({path:f.profile,change_kind:'MODIFY'});
  const preservation=Delivery.build({baseline:f.baseline,replacements:[]},current.plan_items,current.boundaries.write_scope);
  assert.ok(preservation.correction_write_scope.includes(f.profile)); // Only explicit write scope can authorize it.
 }finally{f.cleanup();}
});
test('regression in a retained previously conforming criterion blocks approval and finalization',()=>{
 const f=fixture();try{
  fs.writeFileSync(path.join(f.repo.cwd,'src/core.js'),'module.exports={value:9};\n');
  const {input,plan,delta}=prepare(f),draft=reviewValue(input,true);
  draft.verdict='APPROVE';let raw=f.file('raw.json',JSON.stringify(draft));
  let r=cli('verify-ui-implementation-review.js',['validate',plan,delta,raw,path.join(f.dir,'out.json')],f.repo.cwd);
  assert.notEqual(r.status,0);assert.match(r.stderr,/VERDICT_INCONSISTENT/);
  draft.verdict='REVISE';raw=f.file('raw.json',JSON.stringify(draft));
  r=cli('verify-ui-implementation-review.js',['validate',plan,delta,raw,path.join(f.dir,'out.json')],f.repo.cwd);assert.equal(r.status,0,r.stderr);
  assert.notEqual(finalize(f,draft).status,0);
 }finally{f.cleanup();}
});
test('delivery evidence rejects wrong authors, altered proof binding and incomplete retained coverage',()=>{
 const f=fixture();try{
  assert.throws(()=>Delivery.observe(f.ref,{cwd:f.repo.cwd,readGit:f.readGit,github:{comment:(repo,id)=>({...f.github.comment(repo,id),user:{login:'outsider'}})}}),/SOURCE_COMMENT_ORIGIN_MISMATCH/);
  const data=structuredClone(f.baseline);delete data.contract_hash;data.review.criteria[0].proof_results[0].status='FAIL';
  assert.throws(()=>Delivery.validateBaseline(V.sealContract(data)),/BASELINE_NOT_APPROVED/);
  const p=structuredClone(f.a.planContract.delivery_preservation);delete p.contract_hash;p.retained_criteria=[];
  assert.throws(()=>Delivery.merge({schema:'kodjo.ui-criteria.v1',criteria:[]},V.sealContract(p)),/RETAINED_CRITERIA_DRIFT/);
 }finally{f.cleanup();}
});

test('atomic retained assertions keep coverage through planning review and implementation finalization',()=>{
 const f=fixture(true);try{
  const Plan=require('../../scripts/kodjo/lib/plan-contract');Plan.validatePlanContract(f.a.planContract,f.a);
  const context=require('../../scripts/kodjo/lib/review-contract').buildReviewContext(f.a);
  assert.ok(context.target_catalog.CRITERION.includes('UI-103FBF8D197A'));
  assert.ok(context.target_catalog.ASSERTION.includes('UI-103FBF8D197A-A000000000001'));
  const {input,plan,delta}=prepare(f);assert.equal(input.assertion_count,1);
  const raw=f.file('raw.json',JSON.stringify(reviewValue(input))),out=path.join(f.dir,'review.json');
  const r=cli('verify-ui-implementation-review.js',['validate',plan,delta,raw,out],f.repo.cwd);assert.equal(r.status,0,r.stderr);
  assert.equal(finalize(f,JSON.parse(fs.readFileSync(out))).status,0);
 }finally{f.cleanup();}
});

test('a changed criterion requires the profile in the explicit correction scope and replaces its old version',()=>{
 const f=fixture();try{
  const Impact=require('../../scripts/kodjo/lib/impact-graph'),Plan=require('../../scripts/kodjo/lib/plan-contract'),Ui=require('../../scripts/kodjo/lib/ui-atomicity-contract');
  const candidates=Impact.buildCandidateManifest({cwd:f.repo.cwd,revision:f.ref.revision});
  const profile=candidates.candidates.find(c=>c.path===f.profile),testFile=candidates.candidates.find(c=>c.path==='tests/profile.test.js');
  const source=f.a.requirementRegistry.requirements[0];
  const registry=require('../../scripts/kodjo/lib/requirement-registry').build({planning_envelope_hash:f.a.planningEnvelope.contract_hash,source_manifest:F.sourceManifest(),requirements:[{source_id:source.source_id,unit_id:source.unit_id,kind:'UI',statement:'Correct the profile',priority:'MUST',status:'ACTIVE',rationale:'Explicit UI correction',related_unit_ids:[],conflict_unit_ids:[]}]});
  const reqId=registry.requirements[0].requirement_id;
  const scan=Impact.scanOneLevelDirectImporters({cwd:f.repo.cwd,candidateManifest:candidates,modifyCandidateIds:[profile.candidate_id]});
  const impact=Impact.buildImpactGraph({requirementRegistry:registry,candidateManifest:candidates,directImportScan:scan,classifications:[
   {requirement_id:reqId,candidate_id:profile.candidate_id,change_kind:'MODIFY',impact_reason:'Explicit profile correction',dependency_evidence:['current requirement'],tests_affected_candidate_ids:[testFile.candidate_id],preservation_candidate_ids:[]},
   {requirement_id:reqId,candidate_id:testFile.candidate_id,change_kind:'MODIFY',impact_reason:'Profile correction test',dependency_evidence:['direct test'],tests_affected_candidate_ids:[],preservation_candidate_ids:[]}
  ]});
  const changes=impact.impacts.filter(r=>r.change_kind==='MODIFY'),target=changes.find(r=>r.path===f.profile),testImpact=changes.find(r=>r.path==='tests/profile.test.js'),covered=changes.map(r=>r.impact_id).sort();
  const plan=Plan.buildPlanContract({requirementRegistry:registry,impactGraph:impact,candidateManifest:candidates,deliveryPreservation:{baseline:f.baseline,replacements:[{criterion_id:'UI-103FBF8D197A',requirement_id:reqId}]},requirementPlans:[{
   requirement_id:reqId,implementation_intents:changes.map(r=>({impact_id:r.impact_id,intent:'Explicit correction'})),test_obligations:[{target_impact_id:testImpact.impact_id,covered_change_impact_ids:covered,expected:'Profile is correct',justification:'Direct regression test'}],proof_obligations:[{proof_type:'FUNCTIONAL_TEST',target_test_impact_id:testImpact.impact_id,covered_change_impact_ids:covered,expected:'Profile is correct',justification:'Direct regression test'}],implementation_constraints:[],residual_risks:[],rationale:'Changed profile criterion'
  }]});
  const proof=plan.plan_items[0].proof_obligations[0];
  const ui=Ui.buildUiAtomicityContract({requirementRegistry:registry,impactGraph:impact,candidateManifest:candidates,planContract:plan,criteria:[{requirement_id:reqId,statement:'Correct the profile',risk_types:['FUNCTIONAL'],reuse_search_candidate_ids:[profile.candidate_id],component_decision:'EXTEND',selected_component:'default',selected_component_candidate_id:profile.candidate_id,decision_justification:'Correct the existing module',change_impact_ids:[target.impact_id],proof_ids:[proof.proof_id],assertions:[{subject:'Profile',property_type:'INTERACTION',expected:'Correct profile behavior',proof_ids:[proof.proof_id],covered_change_impact_ids:[target.impact_id]}]}]});
  assert.throws(()=>Adapter.renderCompatibilityPlan({application_head:f.repo.revision},plan,null,registry,candidates),/UI_CONTRACT_REQUIRED|UI_CRITERION_REQUIRED/);
  f.plan=Adapter.renderCompatibilityPlan({application_head:f.repo.revision,plan_contract_hash:plan.contract_hash},plan,ui,registry,candidates);f.a.planContract=plan;
  assert.equal(plan.delivery_preservation.retained_criteria.length,0);assert.ok(plan.delivery_preservation.correction_write_scope.includes(f.profile));
  const prepared=prepare(f);assert.equal(prepared.input.criteria.length,1);assert.notEqual(prepared.input.criteria[0].criterion_id,'UI-103FBF8D197A');
  assert.ok(Req.verifyEmbedded(f.plan).test_contract.bindings.some(r=>r.test_path==='tests/profile.test.js'));
 }finally{f.cleanup();}
});

test('a subsequent correction observes the complete delivered matrix, including retained criteria',()=>{
 const f=fixture();try{
  const full=Delivery.merge({schema:'kodjo.ui-criteria.v1',criteria:[]},f.a.planContract.delivery_preservation);
  const final={...f.baseline.finalization,plan_blob_oid:Adapter.gitBlobOid(f.plan),technical_review_sha256:sha256(f.baseline.review),criterion_count:full.criteria.length,criterion_ids_sha256:sha256(full.criteria.map(c=>c.criterion_id).sort())};
  fs.writeFileSync(path.join(f.repo.cwd,'prior-plan.md'),f.plan);fs.writeFileSync(path.join(f.repo.cwd,'prior-finalization.json'),JSON.stringify(final));
  execFileSync('git',['add','.'],{cwd:f.repo.cwd});execFileSync('git',['commit','-m','fixture next approved delivery'],{cwd:f.repo.cwd});
  const reference={...f.ref,revision:execFileSync('git',['rev-parse','HEAD'],{cwd:f.repo.cwd,encoding:'utf8'}).trim()};
  const next=Delivery.observe(reference,{cwd:f.repo.cwd,readGit:f.readGit,github:f.github});
  assert.deepEqual(next.matrix.criteria,full.criteria);
 }finally{f.cleanup();}
});
