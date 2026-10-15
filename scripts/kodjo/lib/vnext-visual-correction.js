'use strict';
// A bounded execution of the unchanged approved plan, not a new plan/review.
const fs=require('node:fs'),path=require('node:path');
const V=require('./vnext-contract'),Adapter=require('./vnext-legacy-queue-adapter');
const SCHEMA='kodjo.vnext.visual-correction-input.v1';
function equal(a,b,code){if(V.canonicalStringify(a)!==V.canonicalStringify(b))V.fail(code);}
function prepare(reference,{cwd,github=require('../verify-authorizations').ghClient()}={}) {
 const Chain=require('./vnext-live-chain');
 V.assertExactKeys(reference,['revision','path','sha256'],[],'VNEXT_VISUAL_REFERENCE_KEYS');
 V.assertSha40(reference.revision);V.assertSha64(reference.sha256);Chain.relative(reference.path);
 const bytes=Chain.readGit(cwd,reference.revision,reference.path);
 if(V.sha256(bytes)!==reference.sha256)V.fail('VNEXT_VISUAL_INPUT_HASH');
 const input=JSON.parse(bytes);V.verifyContractHash(input);
 V.assertExactKeys(input,['schema_version','base_queue','acceptance_reference','delivery_target','delivery_checkpoint','session_id','request_id','created_at','contract_hash'],[],'VNEXT_VISUAL_INPUT_KEYS');
 if(input.schema_version!==SCHEMA)V.fail('VNEXT_VISUAL_INPUT_SCHEMA');
 const b=input.base_queue;
 V.assertExactKeys(b,['revision','path','sha256'],[],'VNEXT_VISUAL_BASE_KEYS');
 V.assertSha40(b.revision);V.assertSha64(b.sha256);Chain.relative(b.path);
 const baseBytes=Chain.readGit(cwd,b.revision,b.path);
 if(V.sha256(baseBytes)!==b.sha256)V.fail('VNEXT_VISUAL_BASE_HASH');
 const baseQueue=JSON.parse(baseBytes);
 if(baseQueue.operation_kind!=='IMPLEMENT')V.fail('VNEXT_VISUAL_BASE_IMPLEMENT_REQUIRED');
 const base=Chain.deriveQueue(baseQueue,{cwd,github});
 equal(baseQueue,base.projection.legacy_queue_request,'VNEXT_VISUAL_BASE_QUEUE_DRIFT');
 const runtime=require('./vnext-runtime').buildRuntimeSnapshot(base.artifacts);
 Adapter.verifyCompatibilityFilesAtApprovedCommit(base.projection,base.executionRequest,{cwd});
 const baseline=require('./vnext-post-acceptance').observe(input.acceptance_reference,{cwd,readGit:Chain.readGit,github});
 const a=baseline.acceptance,core=base.executionRequest;
 if(a.decision!=='AUTHORIZE_VISUAL_CORRECTION'||a.slice_id!==core.slice_id
   ||input.acceptance_reference.repository!==/^github_issue:([^#]+)#/.exec(core.issue_id)?.[1]
   ||input.acceptance_reference.issue_number!==baseQueue.issue_number
   ||a.base_plan_hash!==core.plan_contract_hash||a.base_review_hash!==core.review_report_hash
   ||baseline.plan_blob_oid!==baseQueue.authorized_plan.plan_blob_oid
   ||input.delivery_target.application_head!==a.head)V.fail('VNEXT_VISUAL_AUTHORIZATION_MISMATCH');
 // This is the same plan, not a projection rebuilt from edited requirements.
 const oldPlan=Chain.readGit(cwd,core.protocol_head,baseQueue.authorized_plan.plan_path);
 if(Chain.readGit(cwd,input.acceptance_reference.revision,input.acceptance_reference.plan_path)!==oldPlan)V.fail('VNEXT_VISUAL_PLAN_CHANGED');
 const ancestor=(older,newer)=>Chain.command('git',['merge-base','--is-ancestor',older,newer],cwd);
 ancestor(core.protocol_head,b.revision);ancestor(b.revision,reference.revision);
 const sources=base.artifacts.planningEnvelope.source_manifest.sources;
 for(const source of sources) {
   if(source.source_kind==='GITHUB_COMMENT')continue; // deriveQueue reobserves the exact owner/source comment.
   const file=source.source_kind==='FIGMA'?source.locator.slice('figma-snapshot:'.length):source.locator;
   const original=Chain.readGit(cwd,source.revision,file);
   if(Chain.readGit(cwd,reference.revision,file)!==original)V.fail('VNEXT_VISUAL_CONTRACT_CHANGED');
   // Protocol-only frozen resources need not exist in an older application tree.
   let present=false;try{Chain.readGit(cwd,core.application_head,file);present=true;}catch(_){}
   if(present&&Chain.readGit(cwd,a.head,file)!==original)V.fail('VNEXT_VISUAL_CONTRACT_CHANGED');
 }
 const scope=[...new Set(a.gaps.flatMap(g=>g.allowed_write_paths))].sort();
 if(!scope.length||scope.some(file=>!core.write_scope.some(row=>row.path===file)))V.fail('VNEXT_VISUAL_SCOPE_CHANGED');
 const cp=input.delivery_checkpoint,t=input.delivery_target;
 if(t.kind!=='EXISTING_PR'||cp.application_pr!==t.application_pr||cp.application_head!==a.head
   ||cp.delivery_head!==a.head||cp.protocol_head!==core.protocol_head)V.fail('VNEXT_VISUAL_CHECKPOINT_BINDING');
 const pr=github.pullRequest(input.acceptance_reference.repository,t.application_pr);
 if(pr.number!==t.application_pr||pr.state!=='open'||pr.merged||pr.head?.sha!==a.head||pr.head?.ref!==t.branch
   ||pr.head?.repo?.full_name!==input.acceptance_reference.repository||pr.base?.repo?.full_name!==input.acceptance_reference.repository
   ||pr.base?.ref!=='main')V.fail('VNEXT_VISUAL_DELIVERY_STALE');
 const id=/^issue_comment:([1-9][0-9]*)$/.exec(cp.checkpoint_ref)?.[1];
 if(!id)V.fail('VNEXT_VISUAL_CHECKPOINT_REQUIRED');
 const checkpoint=require('../verify-source-comment').verify(github.comment(input.acceptance_reference.repository,id),{
   repository:input.acceptance_reference.repository,issue:baseQueue.issue_number,id});
 if(!checkpoint.body.startsWith('[KODJO_V2] APPLICATION_CHECKPOINT\n'))V.fail('VNEXT_VISUAL_CHECKPOINT_MARKER');
 const expected={status:'CERTIFIED',slice_id:core.slice_id,checkpoint_ref:cp.checkpoint_ref,
   application_pr:String(t.application_pr),application_head:a.head,delivery_head:a.head,
   protocol_head:core.protocol_head,plan_blob_oid:baseQueue.authorized_plan.plan_blob_oid,
   review_blob_oid:baseQueue.independent_review.review_blob_oid,gate_comment_id:baseQueue.user_gate.gate_ref.slice('issue_comment:'.length),
   package_run_id:String(cp.package_run_id),package_artifact_id:String(cp.package_artifact_id),attestation_blob_oid:cp.attestation_blob_oid};
 for(const [key,value] of Object.entries(expected)) {
   const fields=[...checkpoint.body.matchAll(new RegExp('^'+key+'=([^\\n]*)$','gm'))].map(m=>m[1]);
   equal(fields,[value],'VNEXT_VISUAL_CHECKPOINT_FIELD_'+key);
 }
 const queue={...baseQueue,mode:'RESUME_DELTA',operation_kind:'VISUAL_CORRECTION',
   delivery_target:t,delivery_checkpoint:{...cp,vnext_correction:reference},scope_allow:scope,
   session_id:input.session_id,request_id:input.request_id,created_at:input.created_at,retry_of_run_id:String(cp.package_run_id),
   retry_reason:{code:'VISUAL_CORRECTION',detail:'Corriger exclusivement les écarts autorisés : https://github.com/'+input.acceptance_reference.repository+'/issues/'+baseQueue.issue_number+'#issuecomment-'+input.acceptance_reference.acceptance_comment_id+'. Le plan approuvé reste inchangé. Nouvelle revue et contrôle device requis après correction.'}};
 delete queue.recovery_migration;delete queue.materialized_recovery;delete queue.initial_restart;
 const violations=require('./queue-contract').validateQueueRequest(queue);
 if(violations.length)V.fail('VNEXT_VISUAL_QUEUE_INVALID',JSON.stringify(violations));
 const executionRequest=V.sealContract({schema_version:'kodjo.vnext.visual-execution-request.v1',
   operation_kind:'VISUAL_CORRECTION',slice_id:core.slice_id,issue_id:core.issue_id,baseline_head:core.baseline_head,protocol_head:core.protocol_head,
   application_head:a.head,plan_contract_hash:core.plan_contract_hash,checks:core.checks,
   execution_context:{...core.execution_context,delivery_target:t},write_scope:core.write_scope.filter(row=>scope.includes(row.path)),
   base_execution_request_hash:core.contract_hash,acceptance_baseline_hash:baseline.contract_hash,
   correction_input_hash:input.contract_hash,execution_fingerprint:V.canonicalHash({base:core.contract_hash,input:input.contract_hash})});
 const raw={...base.projection};delete raw.contract_hash;
 const projection=V.sealContract({...raw,execution_request_hash:executionRequest.contract_hash,
   execution_fingerprint:executionRequest.execution_fingerprint,legacy_queue_request:queue,
   projection_guard:{...raw.projection_guard,scope_sha256:V.canonicalHash(scope),application_head:a.head}});
 Adapter.verifyCompatibilityFilesAtApprovedCommit(projection,executionRequest,{cwd});
 return {...base,executionRequest,projection,visual_baseline:baseline,runtime_snapshot:runtime,
   visual_checkpoint:{status:'CERTIFIED',contract_status:'CONTRACT_UNCHANGED',checkpoint_ref:cp.checkpoint_ref,
     application_pr:t.application_pr,application_head:a.head,protocol_head:core.protocol_head,
     review_policy:{plan_revision_forbidden:true,post_correction_review_required:true,device_check_required:true}}};
}
function admit(queueFile,{cwd,github=require('../verify-authorizations').ghClient()}={}) {
 const queue=JSON.parse(fs.readFileSync(path.resolve(cwd,queueFile),'utf8'));
 if(queue.operation_kind!=='VISUAL_CORRECTION'||!queue.delivery_checkpoint?.vnext_correction)V.fail('VNEXT_VISUAL_REFERENCE_REQUIRED');
 const result=prepare(queue.delivery_checkpoint.vnext_correction,{cwd,github});
 equal(queue,result.projection.legacy_queue_request,'VNEXT_VISUAL_QUEUE_DRIFT');
 // Keep the existing identity, approved artifacts and owner reaction checks.
 const authorization=require('../verify-authorizations').verify(queueFile,{cwd,github,vnextTransportChecked:true});
 const admission=V.sealContract({schema_version:'kodjo.vnext.queue-admission.v1',status:'AUTHORIZED',
   execution_request_hash:result.executionRequest.contract_hash,projection_hash:result.projection.contract_hash,
   protocol_head:queue.source_head,runtime_snapshot_hash:result.runtime_snapshot.contract_hash,
   visual_baseline_hash:result.visual_baseline.contract_hash,authorization});
 return {...result,admission};
}
module.exports={SCHEMA,prepare,admit};
