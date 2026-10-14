'use strict';
// Only verified artifact transport is signalled. No model, semantic approval or
// business write is performed by this publisher.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {execFileSync,spawn}=require('node:child_process');
const {pipeline}=require('node:stream/promises');
const V=require('./lib/vnext-contract'),B=require('./lib/vnext-file-bundle'),Relay=require('./lib/vnext-agent-relay');
const Identity=require('./lib/slice-identity');
const CONFIG='.github/orchestration/KODJO_VNEXT_WORK_TRANSPORT.json';
const ROOT='.github/orchestration/requests/vnext-work/signals/';
function binding(c){
 V.assertExactKeys(c,['schema_version','repository','transport_pr','transport_branch','automation_id','conversation_id','allowed_workflows','contract_hash'],[],'WORK_BINDING_KEYS');V.verifyContractHash(c);
 if(c.schema_version!=='kodjo.vnext.work-transport.v1'||!Number.isSafeInteger(c.transport_pr)||c.transport_pr<1
  ||!/^[-\w]+\/[-.\w]+$/.test(c.repository)||c.transport_branch!=='orchestration/vnext-work-signals'
  ||!c.automation_id||!c.conversation_id||!Array.isArray(c.allowed_workflows)||!c.allowed_workflows.length)throw Error('WORK_BINDING_INVALID');
 for(const w of c.allowed_workflows){V.assertExactKeys(w,['path','artifact_prefix'],[],'WORK_WORKFLOW_KEYS');
  if(!/^\.github\/workflows\/[\w-]+\.yml$/.test(w.path)||!/^[\w-]+-$/.test(w.artifact_prefix))throw Error('WORK_WORKFLOW_INVALID');}
 return c;
}
function makeSignal(c,request,run,artifact,directory,bootstrap,registry){
 binding(c);V.verifyContractHash(request);V.assertSliceId(request.slice_id);Identity.validateBootstrap(bootstrap);Identity.validateRegistry(registry,bootstrap);
 if(request.schema_version!=='kodjo.vnext.agent-request.v1'||request.pilot!=='CHATGPT_WORK'
  ||request.repository!==c.repository
  ||!['plan-review','review-scope','implementation-review'].includes(request.operation)
  ||bootstrap.protocol!=='VNEXT'||bootstrap.slice_id!==request.slice_id||bootstrap.repository!==c.repository
  ||bootstrap.issue_number!==request.issue_number)throw Error('WORK_REQUEST_SCOPE');
 const workflow=c.allowed_workflows.find(w=>w.path===run.path);
 if(!workflow||run.status!=='completed'||!['success','failure','cancelled','timed_out'].includes(run.conclusion)
  ||run.repository?.full_name!==c.repository||run.head_repository?.full_name!==c.repository||run.repository?.id!==run.head_repository?.id||run.head_branch!=='main'
  ||!bootstrap.authorized_actors.includes(run.actor?.login))throw Error('WORK_RUN_PROVENANCE');
 V.assertSha40(run.head_sha);V.assertSha40(request.source_head);V.assertSha64(request.operation_hash);
 if(!Number.isSafeInteger(run.id)||run.id<1||!Number.isSafeInteger(run.run_attempt)||run.run_attempt<1
  ||!Number.isSafeInteger(artifact.id)||artifact.id<1||artifact.expired
  ||artifact.workflow_run?.id!==run.id||artifact.workflow_run?.head_sha!==run.head_sha
  ||artifact.name!==workflow.artifact_prefix+run.id+'-'+run.run_attempt
  ||!/^sha256:[a-f0-9]{64}$/.test(artifact.digest))throw Error('WORK_ARTIFACT_BINDING');
 Relay.verifyEvidence(request,directory);
 const failure=fs.existsSync(path.join(directory,'failure.json'));
 const record=B.read(path.join(directory,failure?'failure.json':'result.json')),checkpoint=B.read(path.join(directory,'checkpoint.json'));
 V.verifyContractHash(record);
 if(record.request_hash!==request.contract_hash||record.source_head!==request.source_head||record.slice_id!==request.slice_id
  ||record.operation!==request.operation||checkpoint.request_hash!==request.contract_hash||checkpoint.slice_id!==request.slice_id
  ||checkpoint.operation!==request.operation||String(checkpoint.run_id)!==String(run.id)||String(checkpoint.run_attempt)!==String(run.run_attempt))throw Error('WORK_RESULT_BINDING');
 if(failure){
  if(record.schema_version!=='kodjo.vnext.agent-failure.v1'||record.status!=='ORCHESTRATION_FAILURE'
   ||checkpoint.state!=='ORCHESTRATION_FAILURE'||checkpoint.error!==record.error
   ||typeof record.model_invoked!=='boolean'||checkpoint.model_invoked!==record.model_invoked)throw Error('WORK_FAILURE_BINDING');
 }else if(record.schema_version!=='kodjo.vnext.agent-result.v1'||record.status!=='COMPLETED'
  ||checkpoint.state!=='AGENT_OPERATION_COMPLETED'||record.inputs_hash!==request.inputs_hash)throw Error('WORK_SUCCESS_BINDING');
 const signal_key=V.canonicalHash({request_hash:request.contract_hash,operation_hash:request.operation_hash,run_id:run.id,run_attempt:run.run_attempt});
 return V.sealContract({schema_version:'kodjo.vnext.work-signal.v1',repository:c.repository,transport_pr:c.transport_pr,
  automation_id:c.automation_id,conversation_id:c.conversation_id,signal_key,slice_id:request.slice_id,issue_number:request.issue_number,
  operation:request.operation,request_hash:request.contract_hash,source_head:request.source_head,operation_hash:request.operation_hash,
  run_id:run.id,run_attempt:run.run_attempt,run_head:run.head_sha,artifact_id:artifact.id,artifact_name:artifact.name,artifact_sha256:artifact.digest.slice(7),
  evidence_manifest_hash:B.read(path.join(directory,'evidence-manifest.json')).contract_hash,result_contract_hash:record.contract_hash,
  transport_status:record.status,error:failure?record.error:null,model_invoked:checkpoint.model_invoked,
  semantic_verdict:failure?null:record.verdict,semantic_validation_required:true});
}
function publish(c,signal,api){
 binding(c);V.verifyContractHash(signal);
  V.assertSha64(signal.signal_key,'WORK_SIGNAL_KEY');
 if(signal.repository!==c.repository||signal.transport_pr!==c.transport_pr||signal.automation_id!==c.automation_id
  ||signal.conversation_id!==c.conversation_id||signal.schema_version!=='kodjo.vnext.work-signal.v1')throw Error('WORK_SIGNAL_BINDING');
 const prefix='repos/'+c.repository,pr=api(prefix+'/pulls/'+c.transport_pr);
 if(pr.state!=='open'||pr.head?.repo?.full_name!==c.repository||pr.head.ref!==c.transport_branch)throw Error('WORK_DESTINATION_INVALID');
 const ref=prefix+'/git/refs/heads/'+c.transport_branch,head=api(ref).object.sha;V.assertSha40(head);
 if(pr.head.sha!==head)throw Error('WORK_DESTINATION_MOVED');
 const file=ROOT+signal.signal_key+'.json';
 const old=api(prefix+'/contents/'+file+'?ref='+head,'GET',undefined,true);
 if(old){
  const existing=JSON.parse(Buffer.from(old.content,'base64').toString('utf8'));V.verifyContractHash(existing);
  if(V.canonicalHash(existing)!==V.canonicalHash(signal))throw Error('WORK_SIGNAL_ALREADY_CHANGED');
  return {status:'REUSED_EXISTING_SIGNAL',signal_key:signal.signal_key,signal_head:head,transport_pr:c.transport_pr};
 }
 const base=api(prefix+'/git/commits/'+head);
 const blob=api(prefix+'/git/blobs','POST',{encoding:'utf-8',content:V.canonicalStringify(signal)+'\n'});
 const tree=api(prefix+'/git/trees','POST',{base_tree:base.tree.sha,tree:[{path:file,mode:'100644',type:'blob',sha:blob.sha}]});
 const commit=api(prefix+'/git/commits','POST',{message:'[skip ci] VNext verified operation signal\nsignal_key='+signal.signal_key,tree:tree.sha,parents:[head]});
 if(api(ref).object.sha!==head)throw Error('WORK_DESTINATION_MOVED');
 api(ref,'PATCH',{sha:commit.sha,force:false});
 if(api(ref).object.sha!==commit.sha)throw Error('WORK_SIGNAL_NOT_OBSERVED');
 return {status:'SIGNAL_PUBLISHED',signal_key:signal.signal_key,signal_head:commit.sha,transport_pr:c.transport_pr};
}
function gh(endpoint,method='GET',data,allowMissing=false){
 try{return JSON.parse(execFileSync('gh',['api',endpoint,'--method',method,...(data?['--input','-']:[])],{input:data?JSON.stringify(data):undefined,encoding:'utf8',maxBuffer:16*1024*1024,timeout:30000}));}
 catch(e){if(allowMissing&&/HTTP 404/.test(String(e.stderr)))return null;throw e;}
}
function git(args,cwd=process.cwd()){return execFileSync('git',args,{cwd,encoding:'utf8',maxBuffer:16*1024*1024,timeout:30000}).trim();}
async function archive(repository,artifact,directory){
 const file=path.join(directory,'artifact.zip'),child=spawn('gh',['api','repos/'+repository+'/actions/artifacts/'+artifact.id+'/zip','--allow-escape-sequences'],{shell:false,stdio:['ignore','pipe','pipe']});
 let err='';child.stderr.on('data',b=>{err=(err+b).slice(-4096);});
 const closed=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error('WORK_DOWNLOAD_FAILED: '+err)));});
 const digest=crypto.createHash('sha256');child.stdout.on('data',b=>digest.update(b));
 await Promise.all([pipeline(child.stdout,fs.createWriteStream(file)),closed]);
 if(digest.digest('hex')!==artifact.digest.slice(7))throw Error('WORK_ARCHIVE_DIGEST_CHANGED');
 const evidence=path.join(directory,'evidence');fs.mkdirSync(evidence);
 const extract="import sys,zipfile,pathlib,stat,shutil\nz=zipfile.ZipFile(sys.argv[1]);root=pathlib.Path(sys.argv[2]);seen=set()\nfor i in z.infolist():\n p=pathlib.PurePosixPath(i.filename)\n if p.is_absolute() or '\\\\' in i.filename or '..' in p.parts or stat.S_ISLNK(i.external_attr >> 16) or i.filename in seen: raise ValueError('WORK_ARCHIVE_PATH')\n seen.add(i.filename)\nfor i in z.infolist():\n p=root.joinpath(*pathlib.PurePosixPath(i.filename).parts)\n if i.is_dir(): p.mkdir(parents=True,exist_ok=True);continue\n p.parent.mkdir(parents=True,exist_ok=True)\n with z.open(i) as src,p.open('xb') as dst: shutil.copyfileobj(src,dst)";
 execFileSync('python3',['-c',extract,file,evidence],{stdio:['ignore','pipe','pipe']});return evidence;
}
async function main(){
 const env=process.env;
 if(env.GITHUB_ACTIONS!=='true'||env.VNEXT_WORK_SIGNAL_JOB!=='publish-signal')throw Error('WORK_SERIALIZED_JOB_REQUIRED');
 const c=binding(B.read(CONFIG));if(env.GITHUB_REPOSITORY!==c.repository)throw Error('WORK_REPOSITORY');
 let id=Number(env.VNEXT_SOURCE_RUN_ID);
 if(env.GITHUB_EVENT_NAME==='push'){
  const changed=git(['diff','--name-status',env.VNEXT_PUSH_BEFORE,env.GITHUB_SHA]).split('\n');
  if(changed.length!==1||!/^A\t\.github\/orchestration\/requests\/vnext-work\/publish\/[1-9][0-9]*\.json$/.test(changed[0]))throw Error('WORK_SINGLE_PUBLICATION_REQUIRED');
  const file=changed[0].split('\t')[1],input=JSON.parse(git(['show',env.GITHUB_SHA+':'+file]));
  V.assertExactKeys(input,['schema_version','repository','run_id','contract_hash'],[],'WORK_PUBLICATION_KEYS');V.verifyContractHash(input);
  if(input.schema_version!=='kodjo.vnext.work-publication.v1'||input.repository!==c.repository||path.posix.basename(file,'.json')!==String(input.run_id))throw Error('WORK_PUBLICATION_BINDING');id=input.run_id;
 }
 if(!Number.isSafeInteger(id)||id<1)throw Error('WORK_RUN_REQUIRED');
 const run=gh('repos/'+c.repository+'/actions/runs/'+id);
 // Refuse foreign runs before downloading any artifact or granting a signal.
 if(run.status!=='completed'||!c.allowed_workflows.some(w=>w.path===run.path)||run.head_repository?.full_name!==c.repository||run.head_branch!=='main')throw Error('WORK_RUN_PROVENANCE');
 const listing=gh('repos/'+c.repository+'/actions/runs/'+id+'/artifacts?per_page=100');
 const prefix=c.allowed_workflows.find(w=>w.path===run.path).artifact_prefix;
 const candidates=listing.artifacts.filter(a=>a.name===prefix+id+'-'+run.run_attempt&&!a.expired);
 if(candidates.length!==1)throw Error('WORK_UNIQUE_ARTIFACT_REQUIRED');
 const artifact=candidates[0],directory=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-work-signal-'));
 try{
  const evidence=await archive(c.repository,artifact,directory),checkpoint=B.read(path.join(evidence,'checkpoint.json'));V.assertSha64(checkpoint.request_hash);
  const requestFile='.github/orchestration/requests/vnext-agent/'+checkpoint.request_hash+'.json';
  const request=JSON.parse(git(['show',run.head_sha+':'+requestFile]));V.verifyContractHash(request);
  V.assertSliceId(request.slice_id);
  require('./lib/vnext-operation-admission').admit(request,{cwd:process.cwd(),actor:run.actor?.login});
  const bootstrap=JSON.parse(git(['show',request.source_head+':.github/orchestration/v2-slices/'+request.slice_id+'/slice-bootstrap.json']));
  const registry=JSON.parse(git(['show',request.source_head+':.github/orchestration/v2-activation-registry.json']));
  git(['merge-base','--is-ancestor',run.head_sha,'origin/main']);
  const issue=gh('repos/'+c.repository+'/issues/'+request.issue_number);if(issue.state!=='open')throw Error('WORK_ISSUE_NOT_OPEN');
  return publish(c,makeSignal(c,request,run,artifact,evidence,bootstrap,registry),gh);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
}
if(require.main===module)main().then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={binding,makeSignal,publish,main,archive};
