'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const P=require('../../scripts/kodjo/lib/vnext-execution-provenance');
test('generic closure provenance verifies the actual workflow and refuses stale workflow bytes',()=>{
 const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-closure-provenance-'));
 const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const workflowPath='.github/workflows/kodjo-vnext-closure.yml';
 try{
  for(const file of [P.WORKFLOW,workflowPath,'scripts/kodjo/close-vnext-github-delivery.js','scripts/kodjo/finalize-vnext-delivery.js','scripts/kodjo/lib/vnext-contract.js','scripts/kodjo/lib/vnext-legacy-queue-adapter.js']){
   fs.mkdirSync(path.join(cwd,path.dirname(file)),{recursive:true});fs.writeFileSync(path.join(cwd,file),'original:'+file+'\n');
  }
  git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');git('add','.');git('commit','-qm','baseline');const head=git('rev-parse','HEAD');
  const args={controllerCwd:cwd,approvedCwd:cwd,controllerHead:head,approvedHead:head,workflowPath,controllerScript:'scripts/kodjo/close-vnext-github-delivery.js',runtimeScript:'scripts/kodjo/finalize-vnext-delivery.js',env:{GITHUB_WORKFLOW_SHA:head,GITHUB_WORKFLOW_REF:'MyUncried/Application-Routine/'+workflowPath+'@refs/heads/fixture',GITHUB_RUN_ID:'1',GITHUB_RUN_ATTEMPT:'1'}};
  const observed=P.observe(args);assert.equal(observed.workflow.path,workflowPath);assert.equal(observed.workflow.sha256,P.blob(cwd,head,workflowPath).sha256);
  assert.throws(()=>P.observe({...args,workflowPath:'.github/workflows/unrelated.yml'}),/WORKFLOW_PATH_REFUSED/);
  fs.appendFileSync(path.join(cwd,workflowPath),'changed\n');git('add','.');git('commit','-qm','workflow fix');
  assert.throws(()=>P.observe({...args,controllerHead:git('rev-parse','HEAD')}),/WORKFLOW_STALE_NEW_EVENT_REQUIRED/);
 }finally{fs.rmSync(cwd,{recursive:true,force:true});}
});
