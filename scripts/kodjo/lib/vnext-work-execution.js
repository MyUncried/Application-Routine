'use strict';
// Transport facts only. Completion is never review approval or permission to write product code.
const V=require('./vnext-contract');
const KINDS=new Set(['CI','IMPLEMENTATION','DELIVERY_TESTS_AND_CLOSURE']);
function descriptor(input){
 V.assertExactKeys(input,['kind','repository','source_head','request_path','request_hash','slice_id','issue_number','bootstrap_hash','subject_ref'],[],'WORK_OPERATION_KEYS');
 if(!KINDS.has(input.kind)||!/^[-\w]+\/[-.\w]+$/.test(input.repository))throw Error('WORK_OPERATION_KIND');
 V.assertSha40(input.source_head);
 if(input.kind==='CI'){
  if(input.slice_id!==null||input.bootstrap_hash!==null||input.request_path!==null||input.request_hash!==null)throw Error('WORK_CI_NOT_A_SLICE');
 }else{
  V.assertSliceId(input.slice_id);V.assertSha64(input.bootstrap_hash);V.assertSha64(input.request_hash);
  if(!/^\.github\/orchestration\/(queue\/v2|vnext-closure)\/[\w/.-]+\.json$/.test(input.request_path)||input.request_path.includes('..'))throw Error('WORK_OPERATION_PATH');
 }
 if(!Number.isSafeInteger(input.issue_number)||input.issue_number<1||input.subject_ref!=='https://github.com/'+input.repository+'/'+(input.kind==='CI'?'pull':'issues')+'/'+input.issue_number)throw Error('WORK_OPERATION_SUBJECT');
 return V.sealContract({schema_version:'kodjo.vnext.work-operation.v1',...input});
}
function verifyDescriptor(d){V.verifyContractHash(d);const {schema_version,contract_hash,...input}=d;if(schema_version!=='kodjo.vnext.work-operation.v1'||descriptor(input).contract_hash!==contract_hash)throw Error('WORK_OPERATION_CHANGED');return d;}
function execution(run,jobs,repository){
 if(run.repository?.full_name!==repository||run.head_repository?.full_name!==repository||run.repository.id!==run.head_repository.id||run.status!=='completed'||!['success','failure','cancelled','timed_out','action_required','neutral','skipped','stale'].includes(run.conclusion))throw Error('WORK_RUN_PROVENANCE');
 V.assertSha40(run.head_sha);
 if(!Number.isSafeInteger(run.id)||run.id<1||!Number.isSafeInteger(run.run_attempt)||run.run_attempt<1||!Array.isArray(jobs)||!jobs.length||jobs.some(j=>!Number.isSafeInteger(j.id)||j.id<1||j.run_id!==run.id||j.status!=='completed')||new Set(jobs.map(j=>j.id)).size!==jobs.length)throw Error('WORK_JOB_PROVENANCE');
 return V.sealContract({schema_version:'kodjo.vnext.work-execution.v1',repository,run_id:run.id,run_attempt:run.run_attempt,head:run.head_sha,workflow:run.path,event:run.event,conclusion:run.conclusion,actor:run.actor.login,jobs:jobs.map(j=>({id:j.id,name:j.name,conclusion:j.conclusion,started_at:j.started_at,completed_at:j.completed_at})).sort((a,b)=>a.id-b.id)});
}
function makeSignal(binding,operation,run,jobs,archives){
 verifyDescriptor(operation);const facts=execution(run,jobs,binding.repository),producer=binding.allowed_workflows.find(w=>w.path===run.path);
 if(!producer||producer.operation_kind!==operation.kind||operation.repository!==binding.repository)throw Error('WORK_OPERATION_PRODUCER');
 if(!Array.isArray(archives))throw Error('WORK_ARCHIVES_REQUIRED');
 const ids=new Set();for(const a of archives){
  V.assertExactKeys(a,['artifact_id','artifact_name','artifact_sha256','run_id','run_attempt','run_head','files','manifest_hash'],[],'WORK_ARCHIVE_KEYS');
  V.assertSha64(a.artifact_sha256);V.assertSha64(a.manifest_hash);
  if(ids.has(a.artifact_id)||!Number.isSafeInteger(a.artifact_id)||a.artifact_id<1||a.run_id!==run.id||a.run_attempt!==run.run_attempt||a.run_head!==run.head_sha||(operation.kind!=='CI'&&!a.artifact_name.endsWith('-'+run.id+'-'+run.run_attempt))||!Array.isArray(a.files)||!a.files.length)throw Error('WORK_ARCHIVE_BINDING');ids.add(a.artifact_id);
  const paths=new Set();for(const f of a.files){V.assertExactKeys(f,['path','sha256','bytes'],[],'WORK_ARCHIVE_FILE_KEYS');V.assertSha64(f.sha256);if(!f.path||f.path.startsWith('/')||f.path.includes('\\')||f.path.split('/').includes('..')||paths.has(f.path)||!Number.isSafeInteger(f.bytes)||f.bytes<0)throw Error('WORK_ARCHIVE_FILE_PATH');paths.add(f.path);}
  if(V.canonicalHash(a.files)!==a.manifest_hash)throw Error('WORK_ARCHIVE_MANIFEST_CHANGED');
 }
 const absent=producer.operation_kind!=='CI'&&!archives.length;
 const signal_key=V.canonicalHash({operation_hash:operation.contract_hash,run_id:run.id,run_attempt:run.run_attempt});
 return V.sealContract({schema_version:'kodjo.vnext.work-signal.v2',repository:binding.repository,transport_pr:binding.transport_pr,automation_id:binding.automation_id,conversation_id:binding.conversation_id,signal_key,operation_descriptor:operation,operation_hash:operation.contract_hash,execution:facts,evidence_archives:archives,transport_status:absent?'RESULT_ARCHIVE_MISSING':run.conclusion==='success'?'EXECUTION_SUCCEEDED':'EXECUTION_NOT_SUCCEEDED',model_invoked:null,semantic_verdict:null,semantic_validation_required:true});
}
function validateSignal(s,binding){
 V.verifyContractHash(s);verifyDescriptor(s.operation_descriptor);V.verifyContractHash(s.execution);
 if(s.schema_version!=='kodjo.vnext.work-signal.v2'||s.repository!==binding.repository||s.transport_pr!==binding.transport_pr||s.automation_id!==binding.automation_id||s.conversation_id!==binding.conversation_id||s.operation_hash!==s.operation_descriptor.contract_hash||s.semantic_validation_required!==true||s.semantic_verdict!==null||s.model_invoked!==null||s.execution.repository!==s.repository)throw Error('WORK_SIGNAL_BINDING');
 if(s.signal_key!==V.canonicalHash({operation_hash:s.operation_hash,run_id:s.execution.run_id,run_attempt:s.execution.run_attempt}))throw Error('WORK_SIGNAL_KEY');return s;
}
module.exports={KINDS,descriptor,verifyDescriptor,execution,makeSignal,validateSignal};
