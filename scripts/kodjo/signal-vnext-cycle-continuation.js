'use strict';
const fs=require('node:fs'),{execFileSync}=require('node:child_process');
const ROOT='.github/orchestration/vnext12/VNEXT-12-QUALIF';
const REPO='MyUncried/Application-Routine',BRANCH='protocol/vnext-proof-stability-20260930';
function validate(c){
 if(c.repository!==REPO||c.campaign_id!=='628b3349-88b4-4bf1-be6b-50bc09e7d245'||c.slice_id!=='VNEXT-12-QUALIF'||c.auto_continue!==true||c.pre1_in_scope!==false||c.final_audit_authorized!==false||c.revision_limit!==1||c.human_review_performed!==false||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(c.cycle_id)||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(c.request_id))throw Error('VNEXT_CYCLE_CONTINUATION_SCOPE_REFUSED');
 return c;
}
function materializeTransport(t,c){
 validate(c);
 const keys=['slice_bootstrap_file','slice_bootstrap_sha256','plan_path','review_path','prompt_file'];
 if(keys.some(k=>typeof t[k]!=='string')||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(c.execution_request_id)||!Number.isFinite(Date.parse(c.execution_created_at)))throw Error('VNEXT_CYCLE_TRANSPORT_INVALID');
 const result=Object.fromEntries(keys.map(k=>[k,t[k]]));
 return {...result,request_id:c.execution_request_id,created_at:c.execution_created_at};
}
function ghClient(){return(endpoint,method='GET',data)=>JSON.parse(execFileSync('gh',['api','--hostname','github.com',endpoint,'--method',method,...(data?['--input','-']:[])],{input:data?JSON.stringify(data):undefined,encoding:'utf8',timeout:30000,maxBuffer:16*1024*1024}));}
function signal(c,{api,head,runId,attempt,kind,results}){
 validate(c);
 if(!/^[a-f0-9]{40}$/.test(head)||!Number.isSafeInteger(runId)||runId<1||!Number.isSafeInteger(attempt)||attempt<1)throw Error('VNEXT_CYCLE_SIGNAL_IDENTITY_INVALID');
 const stages=['PREPARE_INITIAL','EXECUTE_INITIAL','PREPARE_REVISION','EXECUTE_REVISION','FIGMA_INITIAL','CERTIFY_INCIDENTS','CERTIFY_HISTORICAL','FINALIZE_DELIVERY'];
 if(kind==='QUALIFICATION'){
  if(!['qualification'].every(k=>results[k]?.result==='success'))throw Error('VNEXT_CYCLE_QUALIFICATION_SIGNAL_NOT_READY');
 }else if(kind!=='OPERATIONAL'||!stages.includes(c.stage))throw Error('VNEXT_CYCLE_SIGNAL_STAGE_REFUSED');
 const path=ROOT+'/full-cycle-20261007/continuation-signal.json';
 const key=c.cycle_id+':'+c.request_id+':'+runId+':'+attempt;
 const ref='repos/'+REPO+'/git/refs/heads/'+BRANCH;
 const pr=api('repos/'+REPO+'/pulls/269');
 if(pr.state!=='open'||pr.head?.repo?.full_name!==REPO||pr.head?.ref!==BRANCH)throw Error('VNEXT_CYCLE_SIGNAL_DESTINATION_REFUSED');
 // A delayed job must never overwrite a newer controller request.
 const current=api(ref).object.sha;
 if(current!==head){
  const commit=api('repos/'+REPO+'/git/commits/'+current);
  if(commit.message.includes('signal_key='+key))return {status:'REUSED_EXISTING_SIGNAL',head:current,key};
  return {status:'SKIPPED_CONTROLLER_MOVED',head:current,key};
 }
 const record={schema_version:'kodjo.vnext.cycle-signal.v1',cycle_id:c.cycle_id,campaign_id:c.campaign_id,slice_id:c.slice_id,request_id:c.request_id,generation:c.generation,stage:c.stage,kind,run_id:runId,run_attempt:attempt,source_head:head,signal_key:key,job_results:results,business_write:false,implementation_authorized:false,human_review_performed:false};
 const base=api('repos/'+REPO+'/git/commits/'+head);
 const blob=api('repos/'+REPO+'/git/blobs','POST',{content:JSON.stringify(record,null,2)+'\n',encoding:'utf-8'});
 const tree=api('repos/'+REPO+'/git/trees','POST',{base_tree:base.tree.sha,tree:[{path,mode:'100644',type:'blob',sha:blob.sha}]});
 const commit=api('repos/'+REPO+'/git/commits','POST',{message:'[skip ci] VNext cycle completion signal\nsignal_key='+key,tree:tree.sha,parents:[head]});
 api(ref,'PATCH',{sha:commit.sha,force:false});
 if(api(ref).object.sha!==commit.sha)throw Error('VNEXT_CYCLE_SIGNAL_NOT_OBSERVED');
 return {status:'SIGNAL_PUBLISHED',head:commit.sha,key,path};
}
function main(){
 const env=process.env;
 if(env.GITHUB_ACTIONS!=='true'||env.GITHUB_REPOSITORY!==REPO||env.VNEXT_CONTINUATION_JOB!=='wake-orchestrator')throw Error('VNEXT_CYCLE_SERIALIZED_SIGNAL_JOB_REQUIRED');
 const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 if(head!==env.CONTROLLER_HEAD)throw Error('VNEXT_CYCLE_SIGNAL_CHECKOUT_MISMATCH');
 return signal(JSON.parse(fs.readFileSync(ROOT+'/request.json')),{api:ghClient(),head,runId:Number(env.GITHUB_RUN_ID),attempt:Number(env.GITHUB_RUN_ATTEMPT),kind:env.VNEXT_RUN_KIND,results:JSON.parse(env.VNEXT_JOB_RESULTS)});
}
if(require.main===module){try{console.log(JSON.stringify(main()));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={validate,materializeTransport,signal};
