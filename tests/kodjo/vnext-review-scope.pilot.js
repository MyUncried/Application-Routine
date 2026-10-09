'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const F=require('./helpers/vnext-planning-fixture'),V=require('../../scripts/kodjo/lib/vnext-contract'),Review=require('../../scripts/kodjo/lib/review-contract'),R=require('../../scripts/kodjo/lib/revision-contract'),Scope=require('../../scripts/kodjo/lib/vnext-review-scope'),Chain=require('../../scripts/kodjo/lib/vnext-live-chain');
function setup(t){
 const repo=F.fixtureRepo();t.after(()=>fs.rmSync(repo.cwd,{recursive:true,force:true}));const manifest=F.sourceManifest(),envelope=F.makeEnvelope(manifest,repo,'INITIAL');
 const a=F.buildPlanningArtifacts({repo,manifest,envelope});
 const report=Review.buildReviewReport({reviewContext:a.reviewContext,semanticReview:require('./helpers/review-attestation-fixture').semantic(a.reviewContext,[{category:'MISSING_REQUIREMENT',target_type:'SOURCE_UNIT',target_id:a.requirementRegistry.coverage[0].unit_id,finding:'Le type des règles existantes est incorrect.',evidence:['source fixture'],required_correction:'Corriger les exigences existantes, pas seulement ajouter une exigence.',dependency_target_ids:[] }])});
 const graph=R.buildArtifactGraph(a),q=a.requirementRegistry.requirements[0];
 const request=Scope.buildRequest({reviewContext:a.reviewContext,reviewReport:report,artifactGraph:graph,candidates:[{finding_id:report.findings[0].finding_id,target_ids:[q.requirement_id],reason:'Une exigence existante exige une correction de classification.'}]});
 const raw=JSON.stringify({type:'result',session_id:'TEST-ONLY-NOT-INDEPENDENT-EVIDENCE',structured_output:{request_hash:request.contract_hash,assessments:[{finding_id:report.findings[0].finding_id,dependency_indices:[0],observed_indices:[0],evidence_refs:['fixture source inspected'],reason:'Cette règle est nécessaire à la correction du constat.'}]}});
 return {repo,manifest,a,report,graph,q,request,raw};
}
test('scope supplement opens only an independently selected existing requirement and leaves the original report unchanged',t=>{
 const s=setup(t),before=V.canonicalHash(s.report),old=R.buildAllowedChangeSet({...s.a,reviewReport:s.report});
 assert(old.preserved_targets.some(x=>x.target_id===s.q.requirement_id));
 const receipt=Scope.fromRaw(s.request,s.raw),allowed=R.buildAllowedChangeSet({...s.a,reviewReport:s.report,scopeRefinement:receipt});
 R.validateAllowedChangeSet(allowed);
 assert(allowed.authorized_targets.some(x=>x.target_id===s.q.requirement_id&&x.finding_ids.includes(s.report.findings[0].finding_id)));
 assert.equal(V.canonicalHash(s.report),before);assert.equal(allowed.review_report_hash,s.report.contract_hash);
 assert.equal(allowed.authorized_targets.find(x=>x.target_type==='SOURCE_UNIT').mutation_mode,'ANCHOR_ONLY');
 const patch=R.buildRevisionPatch({allowedChangeSet:allowed,corrections:[{target_type:'REQUIREMENT',target_id:s.q.requirement_id,finding_ids:[s.report.findings[0].finding_id],correction:'Corriger précisément la règle existante.'}]});
 assert.equal(R.applyRevisionPatch({allowedChangeSet:allowed,revisionPatch:patch}).reentry_stage,'REQUIREMENTS');
 assert.equal(s.report.verdict,'REVISE'); // Never an approval or finding resolution.
});
test('scope supplement rejects unauthorized target, unobserved selection, changed request, altered raw result and manufactured additions',t=>{
 const s=setup(t),change=f=>{const o=JSON.parse(s.raw);f(o.structured_output);return JSON.stringify(o);};
 assert.throws(()=>Scope.fromRaw(s.request,change(o=>o.assessments[0].dependency_indices=[1])),/INDEX_INVALID/);
 assert.throws(()=>Scope.fromRaw(s.request,change(o=>o.assessments[0].observed_indices=[])),/UNOBSERVED/);
 assert.throws(()=>Scope.fromRaw(s.request,change(o=>o.request_hash='0'.repeat(64))),/REQUEST_MISMATCH/);
 const receipt=Scope.fromRaw(s.request,s.raw);
 const {contract_hash,...fields}=receipt;
 assert.throws(()=>Scope.validateReceipt(V.sealContract({...fields,raw_result:s.raw+' '})),/RAW_HASH/);
 assert.throws(()=>Scope.validateReceipt(V.sealContract({...fields,additions:[]})),/RESULT_MISMATCH/);
 assert.throws(()=>Scope.buildRequest({reviewContext:s.a.reviewContext,reviewReport:s.report,artifactGraph:s.graph,candidates:[{finding_id:s.report.findings[0].finding_id,target_ids:[s.a.planContract.contract_hash],reason:'open whole plan'}]}),/SEMANTIC_TARGET_REQUIRED/);
 const other={...s.a.reviewContext,contract_hash:'f'.repeat(64)};
 assert.throws(()=>Scope.validateReceipt(receipt,{reviewContext:other,reviewReport:s.report,artifactGraph:s.graph}),/HASH|MISMATCH/);
});
test('scope supplement Git admission ignores dirty bytes and refuses an unbound envelope or forged fingerprint',t=>{
 const s=setup(t),receipt=Scope.fromRaw(s.request,s.raw),file='scope.json',content=JSON.stringify(receipt)+'\n';
 fs.writeFileSync(path.join(s.repo.cwd,file),content);const {execFileSync}=require('node:child_process');const git=(...args)=>execFileSync('git',args,{cwd:s.repo.cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();git('add',file);git('commit','-m','TEST scope receipt');const revision=git('rev-parse','HEAD');
 const ref={path:file,revision,content_sha256:V.sha256(content)},env={product_head:revision,created_from:{refs:['review_scope:'+receipt.contract_hash]}};
 fs.writeFileSync(path.join(s.repo.cwd,file),'dirty bytes');assert.deepEqual(Chain.observeScopeRefinement(ref,env,s.repo.cwd),receipt);
 assert.throws(()=>Chain.observeScopeRefinement(ref,{...env,created_from:{refs:[]}},s.repo.cwd),/ENVELOPE_UNBOUND/);
 assert.throws(()=>Chain.observeScopeRefinement({...ref,content_sha256:'0'.repeat(64)},env,s.repo.cwd),/CONTENT_MISMATCH/);
 assert.throws(()=>Chain.observeScopeRefinement({...ref,path:'../outside'},env,s.repo.cwd),/PATH_INVALID/);
});
test('scope supervisor archives a rejected reply, recovers a durable reply without another invocation, and refuses duplicate starts',t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-scope-supervisor-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const cwd=path.join(tmp,'checkout');fs.mkdirSync(cwd);const root=path.resolve(__dirname,'../..');
 const {execFileSync}=require('node:child_process');const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();git('init');git('config','user.name','Test');git('config','user.email','test@example.invalid');
 for(const file of ['scripts/kodjo','tests/fixtures/vnext12','.github/orchestration/vnext12/VNEXT-12-QUALIF/requirement.md','.github/orchestration/vnext12/VNEXT-12-QUALIF/request.json','.github/orchestration/v2-slices/VNEXT-12-QUALIF/slice-bootstrap.json','.github/orchestration/v2-activation-registry.json']){fs.mkdirSync(path.dirname(path.join(cwd,file)),{recursive:true});fs.cpSync(path.join(root,file),path.join(cwd,file),{recursive:true});}
 git('add','.');git('commit','-m','TEST only');
 const produced=Chain.produce(require('../../scripts/kodjo/prepare-vnext12-revision').benchmarkRecipe(cwd),{cwd}),a=produced.artifacts;
 const q=a.requirementRegistry.requirements[0],finding={category:'MISSING_REQUIREMENT',target_type:'SOURCE_UNIT',target_id:q.unit_id,finding:'Typage incomplet de la règle.',evidence:['fixture source'],required_correction:'Corriger la règle existante.',dependency_target_ids:[]};
 const baseReceipt=Chain.validateReviewResponse(produced,JSON.stringify({type:'result',session_id:'TEST-INITIAL',structured_output:{semantic_review:require('./helpers/review-attestation-fixture').semantic(a.reviewContext,[finding]),native_assessment_observations:[]}}));
 const request=Scope.buildRequest({reviewContext:a.reviewContext,reviewReport:baseReceipt.review_report,artifactGraph:R.buildArtifactGraph(a),candidates:[{finding_id:baseReceipt.review_report.findings[0].finding_id,target_ids:[q.requirement_id],reason:'Correction existante nécessaire.'}]});
 const raw=JSON.stringify({type:'result',session_id:'TEST-SCOPE',structured_output:{request_hash:request.contract_hash,assessments:[{finding_id:request.requests[0].finding_id,dependency_ranges:[[0,0]],observed_ranges:[[0,0]],evidence_refs:['fixture source'],reason:'Dépendance justifiée.'}]}});
 let calls=0;const evidenceDirectory=path.join(tmp,'evidence');const options={produced,baseReceipt,request,cwd,evidenceDirectory,claude:'TEST-ONLY',invoke:(bin,args,workdir,input,env,budget,hooks)=>{calls++;assert.equal(budget,7200000);assert.equal(env.GH_TOKEN,undefined);assert(args.includes('Read,Glob,Grep'));assert(!args.includes('Bash'));assert(fs.existsSync(path.join(JSON.parse(input).dossier,'subjects.json')));hooks.onResult({stdout:raw,status:0,signal:null,error_code:null});return raw;}};
 const receipt=Scope.run(options);assert.equal(calls,1);assert.equal(receipt.additions[0].target_ids[0],q.requirement_id);
 assert.equal(Scope.run({...options,recover:true}).contract_hash,receipt.contract_hash);assert.equal(calls,1);
 assert.throws(()=>Scope.run(options),/ALREADY_STARTED/);assert.equal(calls,1);
 const rejected={...options,evidenceDirectory:path.join(tmp,'invalid'),invoke:(...args)=>{args.at(-1).onResult({stdout:'not-json',status:0});return 'not-json';}};
 assert.throws(()=>Scope.run(rejected),/RESULT_INVALID/);assert(fs.existsSync(path.join(rejected.evidenceDirectory,'scope-review-response.json')));
 assert.throws(()=>Scope.run({...options,evidenceDirectory:path.join(cwd,'evidence')}),/OUTSIDE_CHECKOUT/);
});
