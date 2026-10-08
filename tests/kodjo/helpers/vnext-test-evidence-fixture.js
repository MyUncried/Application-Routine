'use strict';
// Injected GitHub records, never a claim of real GitHub or product test execution.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const E=require('../../../scripts/kodjo/lib/vnext-test-evidence'),V=require('../../../scripts/kodjo/lib/vnext-contract');
function install(cwd){
 for(const file of [E.WORKFLOW,E.PRODUCER,'scripts/kodjo/lib/vnext-test-evidence.js']){
  fs.mkdirSync(path.dirname(path.join(cwd,file)),{recursive:true});fs.copyFileSync(path.join(__dirname,'../../..',file),path.join(cwd,file));
 }
}
function zip(receipt){
 const name=Buffer.from(E.NAME),body=Buffer.from(JSON.stringify(receipt)),local=Buffer.alloc(30),central=Buffer.alloc(46),end=Buffer.alloc(22);
 local.writeUInt32LE(0x04034b50);local.writeUInt32LE(body.length,18);local.writeUInt32LE(body.length,22);local.writeUInt16LE(name.length,26);
 central.writeUInt32LE(0x02014b50);central.writeUInt32LE(body.length,20);central.writeUInt32LE(body.length,24);central.writeUInt16LE(name.length,28);
 end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(central.length+name.length,12);end.writeUInt32LE(local.length+name.length+body.length,16);
 return Buffer.concat([local,name,body,central,name,end]);
}
function fixture(cwd,head){
 const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
 const executions=Object.fromEntries(Object.entries(E.COMMANDS).map(([key,[command,args]])=>[key,{command,args,exit_code:0,signal:null,error_code:null,started_at:'2026-10-08T00:00:00Z',finished_at:'2026-10-08T00:00:01Z',stdout_sha256:V.sha256('fixture'),stderr_sha256:V.sha256('')}]));
 const row={schema_version:'kodjo.vnext.executed-tests.v1',repository:'MyUncried/Application-Routine',head,tested_tree_oid:git('rev-parse',head+'^{tree}'),source_run:'100',source_attempt:1,controller_head:head,source_job:'test-delivery',profile:'PRODUCT_CHECKS',executions,checks:{jest:'PASS',typescript:'PASS',lint:'PASS',head:'PASS',clean:'PASS'}};
 const archive=zip(V.sealContract(row)),digest=E.byteHash(archive);
 const run={id:100,head_sha:head,repository:{full_name:row.repository},path:E.WORKFLOW,run_attempt:1,status:'completed',conclusion:'success'};
 const jobs=[{id:102,name:'test-delivery',head_sha:head,status:'completed',conclusion:'success'}];
 const artifact={id:101,name:'vnext-delivery-tests-100-1',expired:false,digest:'sha256:'+digest,workflow_run:{id:100,head_sha:head}};
 const receipt={head,tested_tree_oid:row.tested_tree_oid,source_run:'100',source_artifact:'101',source_archive_sha256:digest,checks:{jest:'PASS',typescript:'PASS',lint:'PASS',head:'PASS',clean:'PASS'}};
 const github={run:()=>run,jobs:()=>jobs,artifact:()=>artifact,archive:()=>archive};
 return {row,run,jobs,artifact,archive,receipt,github};
}
module.exports={install,fixture,zip};
