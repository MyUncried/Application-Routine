'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const W=require('./signal-vnext-agent-continuation'),E=require('./lib/vnext-work-execution'),V=require('./lib/vnext-contract'),Identity=require('./lib/slice-identity');
function pages(endpoint,field,api=W.gh){const out=[];for(let p=1;p<=100;p++){const r=api(endpoint+(endpoint.includes('?')?'&':'?')+'per_page=100&page='+p);if(!Array.isArray(r[field]))throw Error('WORK_LIST_UNAVAILABLE');out.push(...r[field]);if(r[field].length<100)return out;}throw Error('WORK_PAGINATION_NOT_COMPLETE');}
function context(c,run,api=W.gh,git=W.git){
 const producer=c.allowed_workflows.find(w=>w.path===run.path);if(!producer?.operation_kind||!(c.authorized_actors||[]).includes(run.actor?.login))throw Error('WORK_ACTOR_OR_PRODUCER');
 const repo='repos/'+c.repository,read=(rev,file)=>JSON.parse(git(['show',rev+':'+file]));
 if(producer.operation_kind==='CI'){
  const candidates=run.pull_requests?.length?run.pull_requests.map(p=>api(repo+'/pulls/'+p.number)):api(repo+'/commits/'+run.head_sha+'/pulls');
  const valid=candidates.filter(p=>p.head?.repo?.full_name===c.repository&&p.base?.repo?.full_name===c.repository&&(c.authorized_actors||[]).includes(p.user?.login)&&(p.head.ref===run.head_branch||p.merge_commit_sha===run.head_sha));
  if(valid.length!==1)throw Error('WORK_CI_SUBJECT_AMBIGUOUS');const pr=valid[0];
  git(['merge-base','--is-ancestor',run.head_sha,pr.head.sha===run.head_sha?run.head_sha:pr.merge_commit_sha===run.head_sha?run.head_sha:pr.head.sha]);
  const base=pr.merged&&pr.merge_commit_sha?git(['rev-parse',pr.merge_commit_sha+'^1']):pr.base.sha,changed=git(['diff','--name-only',base+'...'+run.head_sha]).split('\n');
  if(!changed.some(f=>/^scripts\/kodjo\/.*vnext|^tests\/kodjo\/vnext-|^\.github\/(workflows\/kodjo-vnext-|orchestration\/KODJO_VNEXT)/.test(f)))throw Error('WORK_NOT_VNEXT_CANDIDATE');
  return E.descriptor({kind:'CI',repository:c.repository,source_head:run.head_sha,request_path:null,request_hash:null,slice_id:null,issue_number:pr.number,bootstrap_hash:null,subject_ref:pr.html_url});
 }
 let locator;
 if(producer.operation_kind==='IMPLEMENTATION'){
  const changed=git(['diff','--name-status',run.head_sha+'^',run.head_sha]).split('\n');
  const added=changed.filter(f=>/^A\t\.github\/orchestration\/queue\/v2\/[^/]+\.json$/.test(f));
  if(added.length!==1||changed.length!==1)throw Error('WORK_QUEUE_LOCATOR_AMBIGUOUS');locator=added[0].split('\t')[1];
 }else if(run.event==='pull_request')locator='.github/orchestration/vnext-closure/request.json';
 else{
  const jobs=pages(repo+'/actions/runs/'+run.id+'/attempts/'+run.run_attempt+'/jobs','jobs',api);const found=new Set();
  for(const job of jobs){const log=require('node:child_process').execFileSync('gh',['api',repo+'/actions/jobs/'+job.id+'/logs','--allow-escape-sequences'],{encoding:'utf8',maxBuffer:16*1024*1024,timeout:30000});for(const m of log.matchAll(/REQUEST_PATH: (\.github\/orchestration\/vnext-closure\/[\w/.-]+\.json)\s*$/gm))found.add(m[1]);}
  if(found.size!==1)throw Error('WORK_CLOSURE_LOCATOR_AMBIGUOUS');locator=[...found][0];
 }
 const request=read(run.head_sha,locator),source=request.source_head||request.delivery_head;V.assertSha40(source);V.assertSliceId(request.slice_id);
 if(require('./lib/slice-protocol-routing').resolve(request.slice_id,{revision:source})!=='VNEXT')return null;
 if(producer.operation_kind==='IMPLEMENTATION'&&require('./lib/queue-contract').validateQueueRequest(request).length)throw Error('WORK_QUEUE_REQUEST_INVALID');
 const bootstrap=read(source,'.github/orchestration/v2-slices/'+request.slice_id+'/slice-bootstrap.json');Identity.validateBootstrap(bootstrap);
 Identity.validateRegistry(read(source,'.github/orchestration/v2-activation-registry.json'),bootstrap);
 if(bootstrap.protocol!=='VNEXT'||bootstrap.repository!==c.repository||bootstrap.issue_number!==request.issue_number||!bootstrap.authorized_actors.includes(run.actor.login))throw Error('WORK_SLICE_BINDING');
 return E.descriptor({kind:producer.operation_kind,repository:c.repository,source_head:source,request_path:locator,request_hash:request.contract_hash||V.canonicalHash(request),slice_id:request.slice_id,issue_number:request.issue_number,bootstrap_hash:bootstrap.slice_bootstrap_sha256,subject_ref:'https://github.com/'+c.repository+'/issues/'+request.issue_number});
}
function fileManifest(directory){
 const files=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else if(e.isFile()){const b=fs.readFileSync(full);files.push({path:path.relative(directory,full).split(path.sep).join('/'),sha256:crypto.createHash('sha256').update(b).digest('hex'),bytes:b.length});}else throw Error('WORK_ARCHIVE_FILE_TYPE');}}
 walk(directory);return files.sort((a,b)=>a.path.localeCompare(b.path));
}
async function signalRun(c,run){
 W.binding(c);E.execution(run,pages('repos/'+c.repository+'/actions/runs/'+run.id+'/attempts/'+run.run_attempt+'/jobs','jobs'),c.repository);
 const operation=context(c,run);if(!operation)return {status:'LEGACY_OPERATION_IGNORED',run_id:run.id};
 const artifacts=pages('repos/'+c.repository+'/actions/runs/'+run.id+'/artifacts','artifacts').filter(a=>operation.kind==='CI'?Date.parse(a.created_at)>=Date.parse(run.run_started_at):a.name.endsWith('-'+run.id+'-'+run.run_attempt));
 const archives=[],caches=[];for(const a of artifacts){
  if(a.expired||a.workflow_run?.id!==run.id||a.workflow_run.head_sha!==run.head_sha||!/^sha256:[a-f0-9]{64}$/.test(a.digest))throw Error('WORK_ARCHIVE_PROVENANCE');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-work-archive-'));try{const dir=await W.archive(c.repository,a,root),files=fileManifest(dir);archives.push({artifact_id:a.id,artifact_name:a.name,artifact_sha256:a.digest.slice(7),run_id:run.id,run_attempt:run.run_attempt,run_head:run.head_sha,files,manifest_hash:V.canonicalHash(files)});caches.push(require('./lib/vnext-work-archive-cache').encode({artifact_id:a.id,artifact_sha256:a.digest.slice(7)},fs.readFileSync(path.join(root,'artifact.zip'))));}finally{fs.rmSync(root,{recursive:true,force:true,maxRetries:3,retryDelay:100});}
 }
 const jobs=pages('repos/'+c.repository+'/actions/runs/'+run.id+'/attempts/'+run.run_attempt+'/jobs','jobs');
 return W.publish(c,E.makeSignal(c,operation,run,jobs,archives),W.gh,caches);
}
module.exports={pages,context,fileManifest,signalRun};
