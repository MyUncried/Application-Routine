'use strict';
// One verification boundary shared by CLI finalization and GitHub closure.
const {execFileSync,spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const V=require('./vnext-contract');
const byteHash=bytes=>require('node:crypto').createHash('sha256').update(bytes).digest('hex');
const WORKFLOW='.github/workflows/kodjo-vnext-closure.yml';
const PRODUCER='scripts/kodjo/produce-vnext-test-evidence.js';
const NAME='test-evidence.json';
const COMMANDS={jest:['npm',['test','--','--runInBand']],typescript:['npx',['--no-install','tsc','--noEmit']],lint:['npm',['run','lint']]};
function git(cwd,...args){return execFileSync('git',args,{cwd,encoding:'utf8',windowsHide:true}).trim();}
function produce({cwd,env=process.env,invoke=spawnSync}){
  if(env.GITHUB_ACTIONS!=='true'||env.GITHUB_REPOSITORY!=='MyUncried/Application-Routine'
      ||! /^[1-9][0-9]*$/.test(env.GITHUB_RUN_ID||'')||env.VNEXT_TEST_JOB!=='test-delivery') V.fail('VNEXT_TEST_PRODUCER_CONTEXT_REQUIRED');
  const head=git(cwd,'rev-parse','HEAD'),tree=git(cwd,'rev-parse','HEAD^{tree}');
  if(git(cwd,'status','--porcelain','--untracked-files=all')) V.fail('VNEXT_TEST_DIRTY_DELIVERY');
  const executions={};
  for(const [key,[command,args]] of Object.entries(COMMANDS)){
    const started=new Date().toISOString();
    const result=invoke(command,args,{cwd,env,encoding:'utf8',windowsHide:true,timeout:900000,maxBuffer:32*1024*1024});
    executions[key]={command,args,started_at:started,finished_at:new Date().toISOString(),exit_code:result.status,
      signal:result.signal||null,error_code:result.error?.code||null,
      stdout_sha256:V.sha256(result.stdout||''),stderr_sha256:V.sha256(result.stderr||'')};
  }
  const stable=git(cwd,'rev-parse','HEAD')===head&&git(cwd,'rev-parse','HEAD^{tree}')===tree;
  const clean=!git(cwd,'status','--porcelain','--untracked-files=all');
  return V.sealContract({schema_version:'kodjo.vnext.executed-tests.v1',repository:env.GITHUB_REPOSITORY,
    head,tested_tree_oid:tree,source_run:String(env.GITHUB_RUN_ID),source_attempt:Number(env.GITHUB_RUN_ATTEMPT),
    controller_head:env.VNEXT_CONTROLLER_HEAD,source_job:'test-delivery',profile:'PRODUCT_CHECKS',executions,
    checks:{...Object.fromEntries(Object.entries(executions).map(([k,r])=>[k,r.exit_code===0&&!r.error_code&&!r.signal?'PASS':'FAIL'])),head:stable?'PASS':'FAIL',clean:clean?'PASS':'FAIL'}});
}
function extract(archive){
  // Inspect the central directory; never extract paths onto the filesystem.
  if(!Buffer.isBuffer(archive)||archive.length>4*1024*1024) V.fail('VNEXT_TEST_ARCHIVE_INVALID');
  try{
    let end=-1;for(let i=archive.length-22;i>=Math.max(0,archive.length-65557);i--) if(archive.readUInt32LE(i)===0x06054b50){end=i;break;}
    if(end<0||end+22+archive.readUInt16LE(end+20)!==archive.length||archive.readUInt16LE(end+4)!==0||archive.readUInt16LE(end+6)!==0
        ||archive.readUInt16LE(end+8)!==1||archive.readUInt16LE(end+10)!==1) throw Error('directory');
    const at=archive.readUInt32LE(end+16);
    if(at+archive.readUInt32LE(end+12)!==end||archive.readUInt32LE(at)!==0x02014b50) throw Error('directory');
    const flags=archive.readUInt16LE(at+8),method=archive.readUInt16LE(at+10),size=archive.readUInt32LE(at+20),plain=archive.readUInt32LE(at+24);
    const len=archive.readUInt16LE(at+28),extra=archive.readUInt16LE(at+30),comment=archive.readUInt16LE(at+32),local=archive.readUInt32LE(at+42);
    if(flags&1||![0,8].includes(method)||plain>1024*1024||at+46+len+extra+comment!==end
        ||archive.subarray(at+46,at+46+len).toString('utf8')!==NAME||archive.readUInt32LE(local)!==0x04034b50
        ||archive.readUInt16LE(local+6)!==flags||archive.readUInt16LE(local+8)!==method) throw Error('entry');
    const localLen=archive.readUInt16LE(local+26),localExtra=archive.readUInt16LE(local+28);
    if(archive.subarray(local+30,local+30+localLen).toString('utf8')!==NAME) throw Error('entry');
    const start=local+30+localLen+localExtra;if(start+size>at) throw Error('bounds');
    const bytes=archive.subarray(start,start+size),decoded=method===8?zlib.inflateRawSync(bytes,{maxOutputLength:1024*1024}):bytes;
    if(decoded.length!==plain) throw Error('size');
    return JSON.parse(decoded.toString('utf8'));
  }catch{V.fail('VNEXT_TEST_ARCHIVE_INVALID');}
}
function githubClient(){
  const read=(endpoint,binary=false)=>{
    const out=execFileSync('gh',['api','--hostname','github.com','--method','GET',endpoint],{windowsHide:true,timeout:60000,maxBuffer:binary?4*1024*1024:16*1024*1024});
    return binary?out:JSON.parse(out.toString('utf8'));
  };
  return {run:(r,id)=>read('repos/'+r+'/actions/runs/'+id),
    jobs:(r,id,attempt)=>require('./vnext-github-qualification').pages('repos/'+r+'/actions/runs/'+id+'/attempts/'+attempt+'/jobs','jobs',read),
    artifact:(r,id)=>read('repos/'+r+'/actions/artifacts/'+id),archive:(r,id)=>read('repos/'+r+'/actions/artifacts/'+id+'/zip',true)};
}
function verify(receipt,{repository,head,cwd,controllerCwd=cwd,github=githubClient(),env=process.env}){
  if(!receipt||receipt.head!==head) V.fail('VNEXT_FINAL_CHECKS_HEAD_MISMATCH');
  if(!/^[1-9][0-9]*$/.test(String(receipt.source_run))||! /^[1-9][0-9]*$/.test(String(receipt.source_artifact))
      ||! /^[0-9a-f]{64}$/.test(receipt.source_archive_sha256||'')) V.fail('VNEXT_TEST_SOURCE_REQUIRED');
  if(!github?.run||!github?.jobs||!github?.artifact||!github?.archive) V.fail('VNEXT_TEST_SOURCE_UNREADABLE');
  const run=github.run(repository,receipt.source_run);
  const current=env.GITHUB_ACTIONS==='true'&&String(env.GITHUB_RUN_ID)===String(run.id)&&env.VNEXT_CLOSURE_JOB==='close-vnext-delivery';
  if(String(run.id)!==String(receipt.source_run)||run.repository?.full_name!==repository||run.path!==WORKFLOW
      ||!Number.isSafeInteger(run.run_attempt)||run.run_attempt<1
      ||(!current&&(run.status!=='completed'||run.conclusion!=='success'))
      ||(current&&!['in_progress','completed'].includes(run.status))
      ||(current&&run.status==='completed'&&run.conclusion!=='success')) V.fail('VNEXT_TEST_RUN_NOT_VERIFIED');
  V.assertSha40(run.head_sha,'VNEXT_TEST_CONTROLLER_REQUIRED');
  const jobs=github.jobs(repository,run.id,run.run_attempt).filter(j=>j.name==='test-delivery');
  if(jobs.length!==1||jobs[0].status!=='completed'||jobs[0].conclusion!=='success'||jobs[0].head_sha!==run.head_sha) V.fail('VNEXT_TEST_JOB_NOT_VERIFIED');
  // Verify the executed producer/workflow against the controller's exact Git bytes.
  for(const file of [WORKFLOW,PRODUCER,'scripts/kodjo/lib/vnext-test-evidence.js']){
    if(git(controllerCwd,'rev-parse',run.head_sha+':'+file)!==git(controllerCwd,'rev-parse','HEAD:'+file)) V.fail('VNEXT_TEST_PRODUCER_VERSION_MISMATCH');
  }
  const artifact=github.artifact(repository,receipt.source_artifact);
  if(String(artifact.id)!==String(receipt.source_artifact)||artifact.expired!==false
      ||String(artifact.workflow_run?.id)!==String(run.id)||artifact.workflow_run?.head_sha!==run.head_sha
      ||artifact.name!=='vnext-delivery-tests-'+run.id+'-'+run.run_attempt) V.fail('VNEXT_TEST_ARTIFACT_NOT_VERIFIED');
  const archive=github.archive(repository,artifact.id),digest=byteHash(archive);
  if(digest!==receipt.source_archive_sha256||(artifact.digest&&artifact.digest!=='sha256:'+digest)) V.fail('VNEXT_TEST_ARCHIVE_DIGEST_MISMATCH');
  const observed=extract(archive);V.verifyContractHash(observed,'VNEXT_TEST_RECEIPT_HASH_INVALID');
  if(observed.schema_version!=='kodjo.vnext.executed-tests.v1'||observed.repository!==repository||observed.head!==head
      ||observed.tested_tree_oid!==git(cwd,'rev-parse',head+'^{tree}')||observed.tested_tree_oid!==receipt.tested_tree_oid
      ||String(observed.source_run)!==String(run.id)||observed.source_attempt!==run.run_attempt||observed.controller_head!==run.head_sha
      ||observed.source_job!=='test-delivery'||observed.profile!=='PRODUCT_CHECKS') V.fail('VNEXT_TEST_RECEIPT_BINDING');
  for(const [key,[command,args]] of Object.entries(COMMANDS)){
    const row=observed.executions?.[key];
    if(!row||row.command!==command||V.canonicalStringify(row.args)!==V.canonicalStringify(args)
        ||row.exit_code!==0||row.signal!==null||row.error_code!==null||!row.started_at||!row.finished_at
        ||! /^[0-9a-f]{64}$/.test(row.stdout_sha256||'')||! /^[0-9a-f]{64}$/.test(row.stderr_sha256||'')) V.fail('VNEXT_TEST_EXECUTION_NOT_PASSED',key);
  }
  if(['jest','typescript','lint','head','clean'].some(k=>observed.checks?.[k]!=='PASS')) V.fail('VNEXT_TEST_EXECUTION_NOT_PASSED');
  return {status:'VERIFIED_EXECUTED_TESTS',head,tested_tree_oid:observed.tested_tree_oid,source_run:String(run.id),source_attempt:run.run_attempt,
    source_job_id:String(jobs[0].id),source_artifact:String(artifact.id),source_archive_sha256:digest,checks:observed.checks};
}
module.exports={WORKFLOW,PRODUCER,NAME,COMMANDS,produce,extract,verify,githubClient,byteHash};
