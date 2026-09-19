'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {consumeDisposable}=require('../../scripts/kodjo/consume-disposable-request');
const {consume}=require('../../scripts/kodjo/consume-queue-request');
const {adapter}=require('./helpers/consumption-git-api');
const root=path.resolve(__dirname,'../..');
function fixture(t){
 const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-disposable-ledger-'));
 t.after(()=>fs.rmSync(cwd,{recursive:true,force:true}));
 const git=args=>{const r=cp.spawnSync('git',args,{cwd,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
 git(['init','-q']);git(['config','user.name','test']);git(['config','user.email','test@example.invalid']);
 fs.writeFileSync(path.join(cwd,'base.txt'),'base');git(['add','.']);git(['commit','-qm','base']);
 const head=git(['rev-parse','HEAD']);
 function options(run='101',requestId='550e8400-e29b-41d4-a716-446655440001'){
  const runDir=path.join(cwd,run),evidenceDirectory=path.join(cwd,run+'-evidence');
  fs.mkdirSync(runDir);fs.mkdirSync(evidenceDirectory);
  return {head,runDir,evidenceDirectory,sessionId:'550e8400-e29b-41d4-a716-446655440002',
   rawRequest:{request_id:requestId,source_head:head,mode:'INITIAL',session_id:null},
   env:{GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'o/r',GITHUB_RUN_ID:run,GITHUB_RUN_ATTEMPT:'1'}};
 }
 return {cwd,options,api:adapter(cwd)};
}
function child(f,o){
 const source="try {const {consumeDisposable}=require(process.argv[1]);const {adapter}=require(process.argv[2]);consumeDisposable({...JSON.parse(process.argv[4]),api:adapter(process.argv[3])});process.stdout.write('EXECUTE')} catch(e){process.stderr.write(e.message);process.exit(1)}";
 const c=cp.spawn(process.execPath,['-e',source,path.join(root,'scripts/kodjo/consume-disposable-request'),path.join(__dirname,'helpers/consumption-git-api'),f.cwd,JSON.stringify(o)]);
 return new Promise(resolve=>{let stdout='',stderr='';c.stdout.on('data',x=>stdout+=x);c.stderr.on('data',x=>stderr+=x);c.on('close',status=>resolve({status,stdout,stderr}));});
}
test('disposable: persisted request/session and typed receipt precede execution, across distinct processes',async t=>{
 const f=fixture(t),a=f.options(); const first=await child(f,a);assert.equal(first.status,0,first.stderr);
 const proof=JSON.parse(fs.readFileSync(path.join(a.runDir,'consumption.json')));
 assert.equal(proof.schema,'kodjo.disposable-consumption.v1');assert.equal(proof.queue_path,null);
 assert.deepEqual(proof.request,a.rawRequest);assert.equal(proof.session_id,a.sessionId);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(a.evidenceDirectory,'consumption.json'))),proof);
 const next=await child(f,f.options('102'));assert.equal(next.status,1);assert.equal(next.stdout,'');assert.match(next.stderr,/CONSUMED_REFUSED/);
 // The production namespace also refuses the same id.
 assert.throws(()=>consume({...proof,run_id:'103'},f.api),/CONSUMED_REFUSED/);
});
test('disposable: concurrent real Git create-ref operations permit one execution only',async t=>{
 const f=fixture(t),runs=await Promise.all([child(f,f.options('201')),child(f,f.options('202'))]);
 assert.equal(runs.filter(x=>x.status===0&&x.stdout==='EXECUTE').length,1,JSON.stringify(runs));
 assert.equal(runs.filter(x=>x.status!==0&&x.stdout==='').length,1);
});
for(const fault of ['lost-response','bad-readback','disk-after-consumption']) test('disposable: '+fault+' never authorizes or releases consumption',t=>{
 const f=fixture(t),o=f.options();let created=false;
 const api=(m,u,b)=>{const r=f.api(m,u,b);if(m==='POST'&&u.endsWith('/refs')){created=true;if(fault==='lost-response')throw Error('lost');if(fault==='disk-after-consumption')fs.writeFileSync(path.join(o.evidenceDirectory,'consumption.json'),'existing');}
 if(created&&m==='GET'&&fault==='bad-readback')return {status:200,data:{}};return r;};
 assert.throws(()=>consumeDisposable({...o,api}));assert.ok(created);
 assert.throws(()=>consumeDisposable({...f.options('102'),api:f.api}),/CONSUMED_REFUSED/);
});
for(const [name,change] of [
 ['wrong HEAD',o=>o.head='0'.repeat(40)],['session absent',o=>o.sessionId=null],
 ['production context',o=>o.env.KODJO_SUPERVISED_QUEUE='1'],['attempt 2',o=>o.env.GITHUB_RUN_ATTEMPT='2'],
 ['restart cannot impersonate queue',o=>o.rawRequest.initial_restart={}],
 ['resume wrong session',o=>{o.rawRequest.mode='RESUME_DELTA';o.rawRequest.session_id='different';}],
]) test('disposable refuses '+name+' before remote effects',t=>{
 const f=fixture(t),o=f.options();change(o);let called=false;
 assert.throws(()=>consumeDisposable({...o,api:()=>{called=true;throw Error('unexpected');}}));assert.equal(called,false);
});
test('disposable wiring: preflight exits before enabling consumption; token is removed before any Claude command',()=>{
 const s=fs.readFileSync(path.join(root,'scripts/kodjo/run-disposable-qualification.ps1'),'utf8');
 const preflight=s.indexOf('if ($PreflightOnly)');assert.ok(preflight>=0);
 const enable=s.indexOf('$env:KODJO_DISPOSABLE_EVIDENCE_DIR = $evidence');assert.ok(enable>preflight);assert.ok(s.slice(preflight,enable).includes('return'));
 const runner=fs.readFileSync(path.join(root,'scripts/kodjo/run-local-claude.js'),'utf8');
 assert.ok(runner.indexOf('consumeLiveToken(process.env)')<runner.indexOf("const version = command(claudeBin"));
 const consumeAt=runner.indexOf("require('./consume-disposable-request').consumeDisposable");
 assert.ok(consumeAt>runner.indexOf('lock = acquireExecutionLock'));
 assert.ok(consumeAt<runner.indexOf("intent.state = 'EXTERNAL_CALL_SENT'"));
 assert.ok(runner.indexOf("intent.state = 'EXTERNAL_CALL_SENT'")<runner.indexOf('result = command(claudeBin'));
});
const ps=process.platform==='win32'?'powershell.exe':'pwsh';
const psAvailable=cp.spawnSync(ps,['-NoProfile','-Command','$PSVersionTable.PSVersion.ToString()'],{encoding:'utf8'}).status===0;
test('native request generator: exact RESUME causality, new ids, missing provenance and INITIAL retry refused',{skip:!psAvailable?'Native PowerShell required; executed on Windows CI':false},t=>{
 const f=fixture(t),head=f.options().head;
 const I=require('../../scripts/kodjo/lib/slice-identity'),C=require('../../scripts/kodjo/lib/claude-local');
 const bootstrapPath='.github/orchestration/v2-slices/SMOKE/slice-bootstrap.json';
 const bootstrap={schema_version:I.BOOTSTRAP_SCHEMA,slice_id:'SMOKE',issue_number:1,repository:'o/r',target_branch:'main',baseline_head:head,protocol_version:'0.6.12',protocol_commit:head,activation_registry:'.github/orchestration/v2-activation-registry.json',previous_slice_id:null,previous_checkpoint:null,product_sources:[{path:'base.txt',sha256:I.sha256('base')}],authorized_actors:['user','claude-local'],created_at:'2026-09-19T00:00:00Z'};
 bootstrap.slice_bootstrap_sha256=I.sha256(I.canonical(bootstrap));
 fs.mkdirSync(path.dirname(path.join(f.cwd,bootstrapPath)),{recursive:true});fs.writeFileSync(path.join(f.cwd,bootstrapPath),JSON.stringify(bootstrap));
 fs.writeFileSync(path.join(f.cwd,bootstrap.activation_registry),JSON.stringify({schema_version:I.REGISTRY_SCHEMA,activations:[{slice_id:'SMOKE',status:'ACTIVE',issue_number:1,baseline_head:head,bootstrap_path:bootstrapPath,slice_bootstrap_sha256:bootstrap.slice_bootstrap_sha256}]}));
 const session='550e8400-e29b-41d4-a716-446655440005';
 function generate(name,extra){const output=path.join(f.cwd,name+'.json');const r=cp.spawnSync(ps,['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'scripts/kodjo/create-kodjo-v2-request.ps1'),'-SliceId','SMOKE','-PromptFile','base.txt','-ScopeAllow','tests/**','-SliceBootstrapFile',bootstrapPath,'-Output',output,...extra],{cwd:f.cwd,encoding:'utf8'});return {...r,output};}
 const retry=['-RetryOfRunId','100','-RetryReasonCode','CONTROLLED_INTERRUPTION_AFTER_RECOVERY','-RetryReasonDetail','Resume exact preserved source delta'];
 const a=generate('resume',['-Mode','RESUME_DELTA','-SessionId',session,...retry]);assert.equal(a.status,0,a.stdout+a.stderr);
 const raw=JSON.parse(fs.readFileSync(a.output,'utf8'));const normalized=C.normalizeRequest(raw,f.cwd);
 assert.equal(normalized.retry_of_run_id,'100');assert.deepEqual(normalized.retry_reason,{code:'CONTROLLED_INTERRUPTION_AFTER_RECOVERY',detail:'Resume exact preserved source delta'});
 const b=generate('resume2',['-Mode','RESUME_DELTA','-SessionId',session,...retry]);assert.equal(b.status,0,b.stdout+b.stderr);assert.notEqual(JSON.parse(fs.readFileSync(b.output)).request_id,raw.request_id);
 const attestationPath='.github/orchestration/v2-slices/SMOKE/recovery-migration-test.json';
 fs.writeFileSync(path.join(f.cwd,attestationPath),JSON.stringify({status:'NOT_CERTIFIED'}));
 cp.execFileSync('git',['add',attestationPath],{cwd:f.cwd});cp.execFileSync('git',['commit','-qm','attestation transport fixture'],{cwd:f.cwd});
 const oid=cp.execFileSync('git',['rev-parse','HEAD:'+attestationPath],{cwd:f.cwd,encoding:'utf8'}).trim();
 const migrated=generate('migrated',['-Mode','RESUME_DELTA','-SessionId',session,...retry,'-RecoveryMigrationFile',attestationPath]);
 assert.equal(migrated.status,0,migrated.stdout+migrated.stderr);
 const migratedRaw=JSON.parse(fs.readFileSync(migrated.output,'utf8'));
 assert.deepEqual(migratedRaw.recovery_migration,{attestation_path:attestationPath,attestation_blob_oid:oid,evidence_kind:'ARTIFACT_HASH'});
 assert.deepEqual(C.normalizeRequest(migratedRaw,f.cwd).recovery_migration,migratedRaw.recovery_migration);
 for(const [name,extra] of [
  ['initial-migration',['-Mode','INITIAL','-RecoveryMigrationFile',attestationPath]],
  ['missing-attestation',['-Mode','RESUME_DELTA','-SessionId',session,...retry,'-RecoveryMigrationFile',attestationPath.replace('test.json','absent.json')]],
  ['traversal',['-Mode','RESUME_DELTA','-SessionId',session,...retry,'-RecoveryMigrationFile','../attestation.json']],
 ]) {const rejected=generate(name,extra);assert.notEqual(rejected.status,0);assert.equal(fs.existsSync(rejected.output),false);}
 const missing=generate('missing',['-Mode','RESUME_DELTA','-SessionId',session]);assert.notEqual(missing.status,0);assert.equal(fs.existsSync(missing.output),false);
 const wrong=generate('wrong',['-Mode','INITIAL',...retry]);assert.notEqual(wrong.status,0);assert.equal(fs.existsSync(wrong.output),false);
});
test('durable permission declaration refuses another job, global scope, credentials and functional writes',()=>{
 const S=require('../../scripts/kodjo/scan-remote-write-capability');
 for(const [workflow,job] of [['kodjo-v2-disposable-qualification.yml','qualify'],['kodjo-v2-pilot-tests.yml','disposable-qualification']]){
  const file=path.join(root,'.github/workflows',workflow),lines=fs.readFileSync(file,'utf8').split(/\r?\n/);
  const index=lines.findIndex(x=>x.includes('contents: write'));assert.ok(index>=0);
  assert.equal(S.isDisposableConsumptionPermission(file,lines,index,'CONTENTS_WRITE',root),true);
  const other=lines.map(x=>x==='  '+job+':'?'  other-job:':x);assert.equal(S.isDisposableConsumptionPermission(file,other,index,'CONTENTS_WRITE',root),false);
  for(const kind of ['GIT_PUSH','GIT_COMMIT','GIT_TAG','GH_API_REF_WRITE','PERSIST_CREDENTIALS_TRUE']) assert.equal(S.isDisposableConsumptionPermission(file,lines,index,kind,root),false);
  const global=['permissions:',lines[index].trimStart()];assert.equal(S.isDisposableConsumptionPermission(file,global,1,'CONTENTS_WRITE',root),false);
 }
});
