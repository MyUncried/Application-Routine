'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync,spawnSync}=require('node:child_process');
const E=require('../../scripts/kodjo/lib/vnext-test-evidence'),F=require('./helpers/vnext-test-evidence-fixture'),V=require('../../scripts/kodjo/lib/vnext-contract');
function setup(t){const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-executed-tests-'));t.after(()=>fs.rmSync(cwd,{recursive:true,force:true}));
 F.install(cwd);const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');git('add','.');git('commit','-qm','fixture controller');
 const head=git('rev-parse','HEAD');return {cwd,head,git,...F.fixture(cwd,head)};}
test('IA-F01 source run job archive bytes and exact delivery tree jointly authorize executed tests',t=>{
 const f=setup(t);const result=E.verify(f.receipt,{repository:f.row.repository,head:f.head,cwd:f.cwd,github:f.github});
 assert.equal(result.status,'VERIFIED_EXECUTED_TESTS');assert.equal(result.source_artifact,'101');assert.equal(result.source_archive_sha256,E.byteHash(f.archive));
 // Declared values have no authority: verification returns the executed receipt.
 f.receipt.checks.jest='FAIL';assert.equal(E.verify(f.receipt,{repository:f.row.repository,head:f.head,cwd:f.cwd,github:f.github}).checks.jest,'PASS');
});
test('IA-F01 invented PASS cannot bypass absent failed stale expired or substituted proof',t=>{
 const f=setup(t),args={repository:f.row.repository,head:f.head,cwd:f.cwd,github:f.github};
 for(const mutate of [x=>delete x.receipt.source_run,x=>x.run.conclusion='failure',x=>x.jobs[0].conclusion='failure',x=>x.run.head_sha='a'.repeat(40),x=>x.artifact.expired=true,x=>x.artifact.workflow_run.id=999,x=>x.artifact.digest='sha256:'+'f'.repeat(64),x=>x.receipt.source_archive_sha256='f'.repeat(64),x=>x.receipt.tested_tree_oid='a'.repeat(40)]){
  const x=F.fixture(f.cwd,f.head);mutate(x);assert.throws(()=>E.verify(x.receipt,{...args,github:x.github}),/VNEXT_TEST_/);
 }
});
test('IA-F01 valid transport with failed observed execution never becomes a PASS',t=>{
 const f=setup(t),row={...f.row,executions:structuredClone(f.row.executions)};row.executions.jest.exit_code=1;
 const archive=F.zip(V.sealContract(row)),digest=E.byteHash(archive);f.receipt.source_archive_sha256=digest;f.artifact.digest='sha256:'+digest;
 assert.throws(()=>E.verify(f.receipt,{repository:f.row.repository,head:f.head,cwd:f.cwd,github:{...f.github,archive:()=>archive}}),/EXECUTION_NOT_PASSED/);
});
test('IA-F01 producer derives results from observed processes and preserves failure without executing publication',t=>{
 const f=setup(t),calls=[];
 const env={...process.env,GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:f.row.repository,GITHUB_RUN_ID:'100',GITHUB_RUN_ATTEMPT:'1',VNEXT_TEST_JOB:'test-delivery',VNEXT_CONTROLLER_HEAD:f.head};
 const receipt=E.produce({cwd:f.cwd,env,invoke:(cmd,args,options)=>{calls.push([cmd,args]);return spawnSync(process.execPath,['-e','process.exit('+ (cmd==='npx'?1:0) +')'],options);}});
 assert.equal(receipt.checks.jest,'PASS');assert.equal(receipt.checks.typescript,'FAIL');assert.equal(receipt.executions.typescript.exit_code,1);assert.equal(calls.length,3);
 assert.throws(()=>E.produce({cwd:f.cwd,env:{}}),/CONTEXT_REQUIRED/);
});
test('IA-F01 same running closure run requires its producer job already successful',t=>{
 const f=setup(t);f.run.status='in_progress';f.run.conclusion=null;
 const args={repository:f.row.repository,head:f.head,cwd:f.cwd,github:f.github,env:{GITHUB_ACTIONS:'true',GITHUB_RUN_ID:'100',VNEXT_CLOSURE_JOB:'close-vnext-delivery'}};
 assert.equal(E.verify(f.receipt,args).status,'VERIFIED_EXECUTED_TESTS');f.jobs[0].status='in_progress';assert.throws(()=>E.verify(f.receipt,args),/JOB_NOT_VERIFIED/);
 assert.throws(()=>E.verify(f.receipt,{...args,env:{}}),/RUN_NOT_VERIFIED/);
});
test('IA-F01 hostile or ambiguous archives are refused before filesystem extraction',()=>{
 for(const bytes of [Buffer.from('not zip'),Buffer.alloc(4*1024*1024+1),F.zip({}).subarray(0,15)])assert.throws(()=>E.extract(bytes),/ARCHIVE_INVALID/);
 const archive=F.zip({});archive.writeUInt16LE(2,archive.length-12);assert.throws(()=>E.extract(archive),/ARCHIVE_INVALID/);
});
