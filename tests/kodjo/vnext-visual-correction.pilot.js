'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const F=require('./helpers/vnext-post-acceptance-fixture'),Planning=require('./helpers/vnext-planning-fixture');
const V=require('../../scripts/kodjo/lib/vnext-contract'),Chain=require('../../scripts/kodjo/lib/vnext-live-chain');
const Approval=require('../../scripts/kodjo/lib/approval-handoff-contract'),Visual=require('../../scripts/kodjo/lib/vnext-visual-correction');
function fixture(t,sliceId='VNEXT-VISUAL-A'){
 const f=F.fixture({sliceId});t.after(f.cleanup);
 const a=f.baseProduced.artifacts,transport={...Planning.transport(),slice_bootstrap_file:'.github/orchestration/v2-slices/'+sliceId+'/slice-bootstrap.json'};
 const prepared=Chain.prepare(f.baseProduced,f.baseReceipt,transport,{cwd:f.cwd});
 const bootstrap={schema_version:'kodjo.protocol.v2.slice-bootstrap.0.6.12',protocol:'VNEXT',slice_id:sliceId,issue_number:999,
  repository:'MyUncried/Application-Routine',target_branch:'main',baseline_head:a.planningEnvelope.baseline_head,
  protocol_version:'0.6.12',protocol_commit:f.baseProduced.producer_revision,previous_slice_id:null,previous_checkpoint:null,
  product_sources:[{path:'docs/profile.md',sha256:V.sha256('FIXTURE profile delivery\n')}],created_at:'2026-10-15T08:00:00Z',authorized_actors:['MyUncried'],
  activation_registry:'.github/orchestration/v2-activation-registry.json',vnext_chain_file:'.github/orchestration/vnext-runtime/'+sliceId+'/prepared.json'};
 bootstrap.slice_bootstrap_sha256=V.canonicalHash(bootstrap);transport.slice_bootstrap_sha256=bootstrap.slice_bootstrap_sha256;
 f.write(transport.slice_bootstrap_file,JSON.stringify(bootstrap));f.write(bootstrap.vnext_chain_file,JSON.stringify(prepared.prepared));
 f.write(bootstrap.activation_registry,JSON.stringify({schema_version:'kodjo.protocol.v2.activation-registry.0.6.12',activations:[{slice_id:sliceId,status:'ACTIVE',issue_number:999,
 baseline_head:bootstrap.baseline_head,bootstrap_path:transport.slice_bootstrap_file,slice_bootstrap_sha256:bootstrap.slice_bootstrap_sha256}]}));
 for(const file of Object.values(prepared.compatibility_files))f.write(file.path,file.content);
 f.git('add','.');f.git('commit','-qm','FIXTURE exact immutable approval dossier');const protocolHead=f.git('rev-parse','HEAD');
 const target=Chain.approvalTarget(prepared.prepared,{cwd:f.cwd,protocolHead});
 f.comments[12345]={id:12345,issue_url:'https://api.github.com/repos/MyUncried/Application-Routine/issues/999',updated_at:'2026-10-15T08:01:00Z',body:protocolHead+'\n'+Approval.renderApprovalMessage(target)};
 f.github.reactions=()=>[{id:67890,content:'+1',user:{login:'MyUncried'},created_at:'2026-10-15T08:02:00Z'}];
 const seed={slice_id:sliceId,issue_number:999,source_head:protocolHead,slice_bootstrap_file:transport.slice_bootstrap_file,slice_bootstrap_sha256:bootstrap.slice_bootstrap_sha256,
  authorized_plan:{plan_path:transport.plan_path},independent_review:{review_path:transport.review_path},prompt_file:transport.prompt_file,user_gate:{gate_ref:transport.gate_ref},request_id:transport.request_id,created_at:transport.created_at};
 const base=Chain.deriveQueue(seed,{cwd:f.cwd,github:f.github}),queueBytes=JSON.stringify(base.projection.legacy_queue_request);
 f.write('base-queue.json',queueBytes);f.git('add','.');f.git('commit','-qm','FIXTURE archived original queue');const baseRevision=f.git('rev-parse','HEAD');
 f.write(f.profile,'module.exports={value:2};\n');f.git('add','.');f.git('commit','-qm','FIXTURE delivered rendering');const deliveryHead=f.git('rev-parse','HEAD');
 const acceptance={...f.baseline.acceptance,decision:'AUTHORIZE_VISUAL_CORRECTION',slice_id:sliceId,head:deliveryHead,
  gaps:f.baseline.acceptance.gaps.map(g=>({...g,allowed_write_paths:[f.profile]}))};
 f.comments[202].body='<KODJO_VNEXT_ACCEPTANCE_GAPS_JSON>'+JSON.stringify(acceptance)+'</KODJO_VNEXT_ACCEPTANCE_GAPS_JSON>';
 f.comments[201].body=f.comments[201].body.replace(f.reference.delivery_head,deliveryHead);
 const cp={checkpoint_ref:'issue_comment:203',application_pr:777,application_head:deliveryHead,protocol_head:protocolHead,delivery_head:deliveryHead,
  package_run_id:'123',package_artifact_id:'456',attestation_blob_oid:'',evidence_kind:'ORGANISATIONAL'};
 const fields={status:'CERTIFIED',slice_id:sliceId,...cp,plan_blob_oid:base.projection.legacy_queue_request.authorized_plan.plan_blob_oid,
  review_blob_oid:base.projection.legacy_queue_request.independent_review.review_blob_oid,gate_comment_id:'12345'};
 f.comments[203]={id:203,user:{login:'github-actions[bot]'},issue_url:f.comments[201].issue_url,
  body:'[KODJO_V2] APPLICATION_CHECKPOINT\n'+Object.entries(fields).map(([k,v])=>k+'='+v).join('\n')};
 const input=V.sealContract({schema_version:Visual.SCHEMA,base_queue:{revision:baseRevision,path:'base-queue.json',sha256:V.sha256(queueBytes)},
  acceptance_reference:{...f.reference,revision:deliveryHead,delivery_head:deliveryHead},delivery_target:{kind:'EXISTING_PR',application_pr:777,application_head:deliveryHead,branch:'fixture/delivery'},delivery_checkpoint:cp,
  session_id:'550e8400-e29b-41d4-a716-446655440001',request_id:'550e8400-e29b-41d4-a716-446655440002',created_at:'2026-10-15T08:10:00Z'});
 const bytes=JSON.stringify(input);f.write('correction.json',bytes);f.git('add','.');f.git('commit','-qm','FIXTURE bound direct correction input');
 const reference={revision:f.git('rev-parse','HEAD'),path:'correction.json',sha256:V.sha256(bytes)};
 f.github.pullRequest=()=>({number:777,state:'open',merged:false,base:{ref:'main',repo:{full_name:bootstrap.repository}},head:{sha:deliveryHead,ref:'fixture/delivery',repo:{full_name:bootstrap.repository}}});
 const options={cwd:f.cwd,github:f.github},result=Visual.prepare(reference,options);
 f.write('visual-queue.json',JSON.stringify(result.projection.legacy_queue_request));
 return {...f,reference,input,options,result,protocolHead,deliveryHead,queueFile:'visual-queue.json'};
}
for(const slice of ['VNEXT-VISUAL-A','VNEXT-VISUAL-B'])test('PE-28 direct VNext admission, runtime plan and device checkpoint without a new plan: '+slice,t=>{
 const f=fixture(t,slice),before=f.git('rev-parse','HEAD'),admitted=Chain.admit(f.queueFile,f.options);
 assert.equal(admitted.admission.status,'AUTHORIZED');assert.equal(admitted.executionRequest.operation_kind,'VISUAL_CORRECTION');
 assert.equal(admitted.executionRequest.schema_version,'kodjo.vnext.visual-execution-request.v1');
 assert.deepEqual(admitted.projection.compatibility_files,f.result.projection.compatibility_files);
 assert.deepEqual(admitted.projection.legacy_queue_request.scope_allow,[f.profile]);
 const Runtime=require('../../scripts/kodjo/lib/vnext-runtime-plan');
 Runtime.verify(admitted,{cwd:f.cwd,missionBytes:Buffer.from(admitted.projection.compatibility_files.mission.content)});
 const raw=JSON.parse(JSON.stringify(require('../../scripts/kodjo/lib/queue-request').projectQueueRequest(admitted.projection.legacy_queue_request)));
 assert.equal(Chain.guardLocalRequest(raw,{...f.options,queueFile:path.join(f.cwd,f.queueFile)}).admission.status,'AUTHORIZED');
 const normalized=require('../../scripts/kodjo/lib/claude-local').normalizeRequest(raw,f.cwd,admitted);
 assert.equal(normalized.operation_kind,'VISUAL_CORRECTION');
 const os=require('node:os'),directory=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-visual-view-'));
 try { const handle=Runtime.install(admitted,{cwd:f.cwd,runDir:directory,missionBytes:Buffer.from(admitted.projection.compatibility_files.mission.content)});
 Runtime.assertView(handle);Runtime.restore(handle); } finally { fs.rmSync(directory,{recursive:true,force:true}); }
 const checkpoint=require('../../scripts/kodjo/verify-visual-checkpoint').verify(f.queueFile,f.options);
 assert.equal(checkpoint.contract_status,'CONTRACT_UNCHANGED');assert.equal(checkpoint.review_policy.device_check_required,true);
 assert.equal(f.git('rev-parse','HEAD'),before);
});
test('PE-28 refuses changed source, authorization, scope, delivery and checkpoint without replanning silently',t=>{
 const f=fixture(t),original=f.comments[202].body;
 f.comments[202].body=original.replace('AUTHORIZE_VISUAL_CORRECTION','AUTHORIZE_REVISION');assert.throws(()=>Chain.admit(f.queueFile,f.options),/AUTHORIZATION_MISMATCH/);f.comments[202].body=original;
 f.github.reactions=()=>[];assert.throws(()=>Chain.admit(f.queueFile,f.options),/OWNER_APPROVAL_REQUIRED/);
});
test('PE-28 hand editing the requested scope or clearing the direct reference never downgrades to legacy',t=>{
 const f=fixture(t),q=f.result.projection.legacy_queue_request;
 f.write(f.queueFile,JSON.stringify({...q,scope_allow:['src/outside.js']}));assert.throws(()=>Chain.guard(f.queueFile,f.options),/QUEUE_DRIFT/);
 const cp={...q.delivery_checkpoint};delete cp.vnext_correction;f.write(f.queueFile,JSON.stringify({...q,delivery_checkpoint:cp}));
 assert.throws(()=>Chain.guard(f.queueFile,f.options),/VISUAL_REFERENCE_REQUIRED/);
});


test('PE-28 changed documentation forces revision; unchanged references never permit a scope extension',t=>{
 const f=fixture(t),rewrite=patch=>{
  const input=structuredClone(f.input);delete input.contract_hash;patch(input);
  const bytes=JSON.stringify(V.sealContract(input));f.write('correction.json',bytes);f.git('add','.');f.git('commit','--allow-empty','-qm','FIXTURE changed correction input');
  return {revision:f.git('rev-parse','HEAD'),path:'correction.json',sha256:V.sha256(bytes)};
 };
 const body=f.comments[202].body;
 f.comments[202].body=body.replace(f.profile,'src/forbidden.js');
 assert.throws(()=>Visual.prepare(f.reference,f.options),/SCOPE_CHANGED/);f.comments[202].body=body;
 f.write('docs/profile.md','NEW PRODUCT CONTRACT\n');f.git('add','.');f.git('commit','-qm','FIXTURE product contract changed');
 const reference=rewrite(()=>{});
 assert.throws(()=>Visual.prepare(reference,f.options),/CONTRACT_CHANGED/);
});
test('PE-28 wrong device author, stale PR, edited checkpoint and removed independent approval fail closed',t=>{
 const f=fixture(t),owner=f.comments[202].user.login,checkpoint=f.comments[203].body,pull=f.github.pullRequest;
 f.comments[202].user.login='someone-else';assert.throws(()=>Visual.prepare(f.reference,f.options),/ORIGIN_MISMATCH/);f.comments[202].user.login=owner;
 f.github.pullRequest=()=>({...pull(),state:'closed'});assert.throws(()=>Visual.prepare(f.reference,f.options),/DELIVERY_STALE/);f.github.pullRequest=pull;
 f.comments[203].body=checkpoint.replace('status=CERTIFIED','status=FAILED');assert.throws(()=>Visual.prepare(f.reference,f.options),/CHECKPOINT_FIELD/);f.comments[203].body=checkpoint;
 const bytes=f.result.projection.legacy_queue_request;f.write(f.queueFile,JSON.stringify({...bytes,checks:['jest']}));assert.throws(()=>Chain.admit(f.queueFile,f.options),/QUEUE_DRIFT/);
});
