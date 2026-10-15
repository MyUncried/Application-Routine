'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const W=require('../../scripts/kodjo/signal-vnext-agent-continuation'),V=require('../../scripts/kodjo/lib/vnext-contract'),B=require('../../scripts/kodjo/lib/vnext-file-bundle'),Relay=require('../../scripts/kodjo/lib/vnext-agent-relay'),I=require('../../scripts/kodjo/lib/slice-identity');
const cp=require('node:child_process'),crypto=require('node:crypto');
function reseal(x){const {contract_hash,...fields}=x;return V.sealContract(fields);}
function fixture(t,slice='VNEXT-TEST-A',operation='plan-review'){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'work-signal-test-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 const c=V.sealContract({schema_version:'kodjo.vnext.work-transport.v1',repository:'owner/repo',transport_pr:42,transport_branch:'orchestration/vnext-work-signals',automation_id:'TEST',conversation_id:'TEST',allowed_workflows:[{path:'.github/workflows/review.yml',artifact_prefix:'review-'}]});
 const request=V.sealContract({schema_version:'kodjo.vnext.agent-request.v1',pilot:'CHATGPT_WORK',repository:c.repository,slice_id:slice,issue_number:9,source_head:'a'.repeat(40),operation,operation_hash:'b'.repeat(64),inputs_hash:'c'.repeat(64)});
 const bootstrap={schema_version:I.BOOTSTRAP_SCHEMA,slice_id:slice,issue_number:9,repository:c.repository,target_branch:'main',baseline_head:'a'.repeat(40),protocol_version:'0.6.12',protocol_commit:'a'.repeat(40),activation_registry:'.github/orchestration/v2-activation-registry.json',previous_slice_id:null,previous_checkpoint:null,product_sources:[{path:'scope.md',sha256:'b'.repeat(64)}],authorized_actors:['owner'],created_at:'2026-01-01T00:00:00Z',protocol:'VNEXT'};
 bootstrap.slice_bootstrap_sha256=I.sha256(I.canonical(bootstrap));
 const registry={schema_version:I.REGISTRY_SCHEMA,activations:[{slice_id:slice,status:'ACTIVE',issue_number:9,baseline_head:bootstrap.baseline_head,bootstrap_path:'.github/orchestration/v2-slices/'+slice+'/slice-bootstrap.json',slice_bootstrap_sha256:bootstrap.slice_bootstrap_sha256}]};
 const run={id:123,run_attempt:1,status:'completed',conclusion:'failure',path:c.allowed_workflows[0].path,repository:{full_name:c.repository,id:1},head_repository:{full_name:c.repository,id:1},head_branch:'main',head_sha:'d'.repeat(40),actor:{login:'owner'}};
 const artifact={id:456,name:'review-123-1',digest:'sha256:'+'e'.repeat(64),expired:false,workflow_run:{id:123,head_sha:run.head_sha}};
 const failure=V.sealContract({schema_version:'kodjo.vnext.agent-failure.v1',request_hash:request.contract_hash,source_head:request.source_head,slice_id:slice,operation,status:'ORCHESTRATION_FAILURE',error:'VNEXT_REVIEW_COVERAGE_INCOMPLETE',model_invoked:true});
 const checkpoint={request_hash:request.contract_hash,slice_id:slice,operation,run_id:'123',run_attempt:'1',state:'ORCHESTRATION_FAILURE',error:failure.error,model_invoked:true};
 B.write(path.join(directory,'failure.json'),failure);B.write(path.join(directory,'checkpoint.json'),checkpoint);Relay.publishManifest(directory,request);
 const build=()=>W.makeSignal(c,request,run,artifact,directory,bootstrap,registry);
 return {c,request,run,artifact,directory,bootstrap,registry,checkpoint,failure,build};
}
test('one common transport supports distinct registered slices and all three operations, including paid partial failures',t=>{
 for(const slice of ['VNEXT-TEST-A','VNEXT-TEST-B'])for(const operation of ['plan-review','review-scope','implementation-review']){
  const f=fixture(t,slice,operation),s=f.build();assert.equal(s.transport_pr,42);assert.equal(s.slice_id,slice);assert.equal(s.error,'VNEXT_REVIEW_COVERAGE_INCOMPLETE');assert.equal(s.model_invoked,true);assert.equal(s.semantic_verdict,null);assert.equal(s.semantic_validation_required,true);
 }
});
test('unknown workflow, foreign fork, nonterminal run and actor mismatch are refused before publication',t=>{
 for(const patch of [{path:'.github/workflows/other.yml'},{head_repository:{full_name:'attacker/fork',id:2}},{status:'in_progress'},{actor:{login:'attacker'}},{head_branch:'feature'}]){
  const f=fixture(t);Object.assign(f.run,patch);assert.throws(f.build,/PROVENANCE/);
 }
});
test('inactive/unregistered/legacy slices and wrong artifact provenance are refused',t=>{
 for(const mutate of [f=>f.registry.activations[0].status='CLOSED',f=>f.registry.activations=[],f=>{f.bootstrap.protocol='V2';delete f.bootstrap.slice_bootstrap_sha256;f.bootstrap.slice_bootstrap_sha256=I.sha256(I.canonical(f.bootstrap));},f=>f.artifact.expired=true,f=>f.artifact.workflow_run.head_sha='f'.repeat(40),f=>f.artifact.name='wrong']){
  const f=fixture(t);mutate(f);assert.throws(f.build);
 }
});
test('corrupt evidence and contradictory model/provenance statements remain refused',t=>{
 const f=fixture(t);fs.appendFileSync(path.join(f.directory,'checkpoint.json'),' ');assert.throws(f.build,/EVIDENCE_CHANGED/);
 const g=fixture(t);B.write(path.join(g.directory,'checkpoint.json'),{...g.checkpoint,model_invoked:false});Relay.publishManifest(g.directory,g.request);assert.throws(g.build,/FAILURE_BINDING/);
});
test('a completed transport carries a verdict requiring semantic validation, never an owner approval',t=>{
 const f=fixture(t);fs.rmSync(path.join(f.directory,'failure.json'));
 B.write(path.join(f.directory,'result.json'),V.sealContract({schema_version:'kodjo.vnext.agent-result.v1',request_hash:f.request.contract_hash,source_head:f.request.source_head,slice_id:f.request.slice_id,operation:f.request.operation,inputs_hash:f.request.inputs_hash,status:'COMPLETED',verdict:'REVISE'}));
 B.write(path.join(f.directory,'checkpoint.json'),{...f.checkpoint,state:'AGENT_OPERATION_COMPLETED'});Relay.publishManifest(f.directory,f.request);
 const s=f.build();assert.equal(s.semantic_verdict,'REVISE');assert.equal(s.semantic_validation_required,true);assert.equal(s.error,null);
});
function apiFixture(f){
 const calls=[],files=new Map();let head='f'.repeat(40),counter=0;
 const api=(url,method='GET',data)=>{
  calls.push({url,method,data});const prefix='repos/'+f.c.repository;
  if(url===prefix+'/pulls/42')return {state:'open',head:{repo:{full_name:f.c.repository},ref:f.c.transport_branch,sha:head}};
  if(url===prefix+'/git/refs/heads/'+f.c.transport_branch){if(method==='PATCH'){assert.equal(data.force,false);head=data.sha;}return {object:{sha:head}};}
  if(url.startsWith(prefix+'/contents/'))return files.get(url.split('/contents/')[1].split('?')[0])||null;
  if(url.startsWith(prefix+'/git/commits/'))return {tree:{sha:'e'.repeat(40)}};
  if(url===prefix+'/git/blobs'){files.set('blob',{content:Buffer.from(data.content).toString('base64')});return {sha:'b'.repeat(40)};}
  if(url===prefix+'/git/trees'){assert.equal(data.tree.length,1);assert.match(data.tree[0].path,/^\.github\/orchestration\/requests\/vnext-work\/signals\/[a-f0-9]{64}\.json$/);files.set(data.tree[0].path,files.get('blob'));return {sha:'c'.repeat(40)};}
  if(url===prefix+'/git/commits')return {sha:String(++counter).padStart(40,'0')};
  throw Error('TEST unexpected API '+url);
 };
 return {api,calls,files};
}
test('one isolated signal commit wakes PR synchronize; duplicate signal is reused without another write',t=>{
 const f=fixture(t),a=apiFixture(f),s=f.build();assert.equal(W.publish(f.c,s,a.api).status,'SIGNAL_PUBLISHED');
 const writes=a.calls.filter(x=>x.method!=='GET').length;assert.equal(writes,4);assert.equal(W.publish(f.c,s,a.api).status,'REUSED_EXISTING_SIGNAL');assert.equal(a.calls.filter(x=>x.method!=='GET').length,writes);
});
test('closed/foreign destinations, conflicting duplicate and changed branch head refuse signal publication',t=>{
 const f=fixture(t),a=apiFixture(f),s=f.build();const bad=(url,...args)=>url.endsWith('/pulls/42')?{state:'closed'}:a.api(url,...args);assert.throws(()=>W.publish(f.c,s,bad),/DESTINATION/);
 W.publish(f.c,s,a.api);const changed=reseal({...s,error:'changed'});assert.throws(()=>W.publish(f.c,changed,a.api),/ALREADY_CHANGED/);
 const malicious=reseal({...s,signal_key:'../business'});const before=a.calls.length;assert.throws(()=>W.publish(f.c,malicious,a.api),/SIGNAL_KEY/);assert.equal(a.calls.length,before);
 const g=fixture(t),b=apiFixture(g);let reads=0;const race=(url,...args)=>{
  if(url.endsWith('/git/refs/heads/'+g.c.transport_branch)&&++reads===2)return {object:{sha:'a'.repeat(40)}};
  return b.api(url,...args);
 };assert.throws(()=>W.publish(g.c,g.build(),race),/DESTINATION_MOVED/);assert.equal(b.calls.some(x=>x.method==='PATCH'),false);
});
test('workflow privileges only the serialized signal job; no model invocation or business checkout',()=>{
 const file=fs.readFileSync(path.join(__dirname,'../../.github/workflows/kodjo-vnext-work-continuation.yml'),'utf8');
 assert.match(file,/workflow_run:/);assert.match(file,/types: \[completed\]/);assert.match(file,/cancel-in-progress: false/);assert.match(file,/permissions:\r?\n  contents: read/);assert.match(file,/publish-signal:[\s\S]*contents: write/);assert.match(file,/ref: refs\/heads\/main/);assert.doesNotMatch(file,/claude-code-action|vnext-chain.js|run-local-claude/);
});
test('Work signal data does not request heavy CI, while its implementation and binding remain qualified',()=>{
 const C=require('../../scripts/kodjo/classify-protocol-impact');
 for(const file of ['README.md','signals/'+('a'.repeat(64))+'.json','publish/123.json'])assert.equal(C.classifyFiles(['.github/orchestration/requests/vnext-work/'+file]).full_windows_required,false);
 for(const file of ['scripts/kodjo/signal-vnext-agent-continuation.js','.github/workflows/kodjo-vnext-work-continuation.yml','.github/orchestration/KODJO_VNEXT_WORK_TRANSPORT.json','.github/orchestration/requests/vnext-work/code.js'])assert.equal(C.classifyFiles([file]).full_windows_required,true);
 assert.equal(C.classifyFiles(['.github/orchestration/requests/vnext-work/publish/123.json','scripts/kodjo/signal-vnext-agent-continuation.js']).full_windows_required,true);
});
test('binary artifact streaming verifies ZIP digest and refuses traversal and symlinks before extraction',{skip:process.platform==='win32'},async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work-zip-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const stub=path.join(root,'gh');fs.writeFileSync(stub,'#!'+process.execPath+'\nif(!process.argv.includes("--allow-escape-sequences"))process.exit(3);process.stdout.write(require("node:fs").readFileSync(process.env.WORK_TEST_ZIP));\n',{mode:0o755});
 const oldPath=process.env.PATH,oldZip=process.env.WORK_TEST_ZIP;process.env.PATH=root+path.delimiter+oldPath;
 try{
  for(const kind of ['valid','traversal','symlink','digest']){
   const zip=path.join(root,kind+'.zip');
   cp.execFileSync('python3',['-c',"import sys,zipfile,stat\nz=zipfile.ZipFile(sys.argv[1],'w');k=sys.argv[2]\ni=zipfile.ZipInfo('../outside' if k=='traversal' else 'checkpoint.json')\nif k=='symlink': i.create_system=3;i.external_attr=(stat.S_IFLNK|0o777)<<16\nz.writestr(i,b'payload');z.close()",zip,kind]);
   process.env.WORK_TEST_ZIP=zip;const directory=path.join(root,'out-'+kind);fs.mkdirSync(directory);
   const digest=crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex');
   const run=()=>W.archive('owner/repo',{id:1,digest:'sha256:'+(kind==='digest'?'0'.repeat(64):digest)},directory);
   if(kind==='valid'){const evidence=await run();assert.equal(fs.readFileSync(path.join(evidence,'checkpoint.json'),'utf8'),'payload');}
   else await assert.rejects(run,kind==='digest'?/DIGEST_CHANGED/:/WORK_ARCHIVE_PATH/);
   assert.equal(fs.existsSync(path.join(root,'outside')),false);
  }
 }finally{process.env.PATH=oldPath;if(oldZip===undefined)delete process.env.WORK_TEST_ZIP;else process.env.WORK_TEST_ZIP=oldZip;}
});
