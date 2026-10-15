'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync,spawnSync}=require('node:child_process');
const P=require('../../scripts/kodjo/lib/vnext-pilot-continuity');
const V=require('../../scripts/kodjo/lib/vnext-contract');
const F=require('./helpers/vnext-planning-fixture');
const Source=require('../../scripts/kodjo/lib/source-manifest');
const Envelope=require('../../scripts/kodjo/lib/planning-envelope');
const Chain=require('../../scripts/kodjo/lib/vnext-live-chain');
const ROOT=path.resolve(__dirname,'../..');
const select=(r,keys)=>Object.fromEntries(keys.map(k=>[k,r[k]]));

function fixture(t,id){
  const repo=F.fixtureRepo();t.after(()=>fs.rmSync(repo.cwd,{recursive:true,force:true}));
  fs.cpSync(path.join(ROOT,'scripts/kodjo'),path.join(repo.cwd,'scripts/kodjo'),{recursive:true});
  fs.mkdirSync(path.join(repo.cwd,'docs'));const content='Modifier le comportement du module.\n';
  fs.writeFileSync(path.join(repo.cwd,'docs/functional.md'),content);
  const git=(...a)=>execFileSync('git',a,{cwd:repo.cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('add','.');git('commit','-m','TEST ONLY exact source and common executable');repo.revision=git('rev-parse','HEAD');
  const sourceManifestInput={slice_id:id,product_head:repo.revision,sources:[{source_kind:'MARKDOWN',authority:'FUNCTIONAL',locator:'docs/functional.md',revision:repo.revision,fingerprint:V.sha256(content),units:[{locator:'FULL_FILE',fingerprint:V.sha256(content),disposition:'REQUIREMENT_SOURCE'}]}]};
  const manifest=Source.build(sourceManifestInput);
  const planningInput={slice_id:id,planning_mode:'INITIAL',baseline_head:repo.revision,product_head:repo.revision,application_head:repo.revision,issue_id:'github_issue:MyUncried/Application-Routine#999',base_plan_hash:null,base_review_hash:null,causal_findings:[],created_from:{kind:'INITIAL_REQUEST',refs:['issue_comment:100']}};
  const a=F.buildPlanningArtifacts({repo,manifest,envelope:Envelope.build({...planningInput,source_manifest:manifest})});
  const recipe={sourceManifestInput,planningInput,
    requirementInput:{requirements:a.requirementRegistry.requirements.map(r=>select(r,['source_id','unit_id','kind','statement','priority','status','rationale','related_unit_ids','conflict_unit_ids']))},
    classifications:a.impactGraph.impacts.map(r=>select(r,['requirement_id','candidate_id','change_kind','impact_reason','dependency_evidence','tests_affected_candidate_ids','preservation_candidate_ids'])),
    requirementPlans:a.planContract.plan_items.map(r=>({...select(r,['requirement_id','implementation_constraints','residual_risks','rationale']),implementation_intents:r.change_items.map(x=>select(x,['impact_id','intent'])),test_obligations:r.test_obligations.map(x=>select(x,['target_impact_id','covered_change_impact_ids','expected','justification'])),proof_obligations:r.proof_obligations.map(x=>select(x,['proof_type','target_test_impact_id','covered_change_impact_ids','expected','justification']))})),
    executionContext:{mode:'LOCAL',writer_id:'CLAUDE:TEST-ONLY'},nativeAssessments:[],registerInput:{authorizedActor:'MyUncried',revisionCount:0,revisionLimit:1,observations:[]}};
  return {repo,recipe};
}

for(const id of ['VNEXT-CONTINUITY-A','VNEXT-CONTINUITY-B'])test('common CLI refuses, guides and admits the corrected preparation without a model: '+id,t=>{
  const f=fixture(t,id),config=path.join(f.repo.cwd,'recipe.json'),output=path.join(f.repo.cwd,'produced.json');
  const invalid=structuredClone(f.recipe);invalid.sourceManifestInput.sources[0].fingerprint='0'.repeat(64);
  fs.writeFileSync(config,JSON.stringify(invalid));
  const run=()=>spawnSync(process.execPath,[path.join(ROOT,'scripts/kodjo/vnext-chain.js'),'produce',config,output],{cwd:f.repo.cwd,encoding:'utf8',maxBuffer:1024*1024});
  const failed=run();assert.equal(failed.status,1);assert.equal(fs.existsSync(output),false);
  const feedback=JSON.parse(failed.stdout).continuation;
  assert.equal(feedback.state,'ACTION_REQUIRED');assert.equal(feedback.mission_completed,false);
  assert.equal(feedback.next_action,'FIX_DETERMINISTIC_CAUSE');assert.equal(feedback.grants_additional_retry,false);
  assert.equal(feedback.github_refresh_required_before_diagnosis,true);assert.equal(feedback.checkout_head,f.repo.revision);
  // Simulate the authorized pilot's technical correction, not a new approval.
  fs.writeFileSync(config,JSON.stringify(f.recipe));const passed=run();assert.equal(passed.status,0,passed.stderr);
  const result=JSON.parse(passed.stdout);assert.equal(result.status,'RECORDED');
  assert.equal(result.continuation.state,'ACTION_REQUIRED');assert.equal(result.continuation.mission_completed,false);
  assert.equal(result.continuation.next_action,'VERIFY_AND_REVIEW_PLAN');
  const recorded=require('../../scripts/kodjo/lib/vnext-file-bundle').read(output);
  assert.equal(recorded.artifacts.planningEnvelope.slice_id,id);assert.equal(result.continuation.artifact_hash,recorded.contract_hash);
  V.verifyContractHash(recorded); // Feedback never changes the sealed artifact.
  assert.equal(Object.hasOwn(recorded,'continuation'),false);
  let original;
  try{Chain.produce(invalid,{cwd:f.repo.cwd});}catch(error){original=error;}
  assert(original?.continuation);assert.equal(original.continuation.next_action,'FIX_DETERMINISTIC_CAUSE');
});

test('a technical refusal or an unknown error never becomes an owner gate or a paid retry',()=>{
  for(const code of ['VNEXT_COMPONENT_REUSE_QUALIFICATION_REQUIRED_BEFORE_LARGE_REVIEW','SOMETHING_UNKNOWN','USAGE_LIMIT','EACCES','VNEXT_REVIEW_USAGE_LIMIT','VNEXT_REVIEW_AUTHENTICATION_REQUIRED']){
    const c=P.describe({stage:'review',error:Error(code+': ghp_TEST_SECRET')});
    assert.equal(c.state,'ACTION_REQUIRED');assert.equal(c.grants_additional_retry,false);assert.equal(c.mission_completed,false);
    assert.equal(JSON.stringify(c).includes('ghp_TEST_SECRET'),false);
  }
  assert.equal(P.describe({stage:'review',error:Error('VNEXT_COMPONENT_REUSE_QUALIFICATION_REQUIRED_BEFORE_LARGE_REVIEW')}).next_action,'QUALIFY_COMPONENT_MAPPINGS');
  for(const code of ['VNEXT_REVIEW_USAGE_LIMIT','VNEXT_REVIEW_AUTHENTICATION_REQUIRED'])assert.equal(P.describe({stage:'review',error:Error(code)}).next_action,'DIAGNOSE_WITHOUT_IMPLICIT_RETRY');
});

test('a real owner gate is preserved; a clarification still needs an actionable owner question',()=>{
  const c=P.describe({stage:'request-approval',result:{status:'USER_APPROVAL_REQUIRED',gate_ref:'issue_comment:123',approval_url:'https://github.com/MyUncried/Application-Routine/issues/999#issuecomment-123'}});
  assert.equal(c.state,'WAITING_OWNER');assert.equal(c.next_action,'WAIT_FOR_EXISTING_OWNER_GATE');
  assert.equal(P.describe({stage:'review',artifact:{review_report:{verdict:'CLARIFICATION_REQUIRED'}}}).next_action,'MATERIALIZE_OWNER_DECISION');
  assert.equal(P.describe({stage:'handoff',error:Error('VNEXT_HANDOFF_USER_APPROVAL_REQUIRED')}).next_action,'MATERIALIZE_OWNER_DECISION');
  assert.equal(P.describe({stage:'request-approval',result:{status:'USER_APPROVAL_REQUIRED'}}).state,'ACTION_REQUIRED');
});

test('REVISE and partial coverage continue; duplicate feedback reconciles without re-execution',()=>{
  const c=P.describe({stage:'review',artifact:{contract_hash:'a'.repeat(64),review_report:{verdict:'REVISE'}}});
  assert.equal(c.next_action,'CORRECT_WITHIN_EXISTING_AUTHORITY');
  const duplicate=P.describe({stage:'review',artifact:{contract_hash:'a'.repeat(64),review_report:{verdict:'REVISE'}},previous:c});
  assert.equal(duplicate.no_progress,true);assert.equal(duplicate.next_action,'RECONCILE_WITHOUT_REPEATING_OPERATION');
  assert.equal(P.describe({stage:'review',artifact:{review_report:{verdict:'REVIEW_INCOMPLETE'}}}).next_action,'PROCESS_EXISTING_CUMULATIVE_COVERAGE');
  assert.equal(P.describe({stage:'review',error:Error('VNEXT_REVIEW_COVERAGE_INCOMPLETE')}).next_action,'PROCESS_EXISTING_CUMULATIVE_COVERAGE');
  assert.equal(P.describe({stage:'review',error:Error('VNEXT_LIVE_REVIEW_NOT_APPROVED: REVISE')}).next_action,'READ_ARCHIVED_RESULT');
  const changed=P.describe({stage:'review',artifact:{contract_hash:'b'.repeat(64),review_report:{verdict:'REVISE'}},previous:c});
  assert.equal(changed.no_progress,false);
});

test('guidance is not an admission rule, does not rehash large catalogues and preserves the primary failure',async()=>{
  const artifact={contract_hash:'a'.repeat(64)};
  Object.defineProperty(artifact,'huge_payload',{enumerable:true,get(){throw Error('must not rehash');}});
  assert.equal(P.describe({stage:'produce',artifact}).artifact_hash,artifact.contract_hash);
  const value=V.sealContract({status:'UNCHANGED'});assert.equal(P.wrap('produce',()=>value)(),value);
  const primary=Error('PRIMARY');assert.throws(()=>P.wrap('produce',()=>{throw primary;})(),e=>e===primary);
  const frozen=Object.freeze(Error('FROZEN'));assert.throws(()=>P.wrap('produce',()=>{throw frozen;})(),e=>e===frozen);
  await assert.rejects(P.wrap('launch',async()=>{throw primary;})(),e=>e===primary);
});
