'use strict';
// Regression for run 36773441104: the bounded-correction step read the selected
// request from a checkout already switched to the older request source_head (ENOENT).
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {materialize}=require('../../scripts/kodjo/materialize-boundary-file');

test('the selected request is materialized byte-exactly from the boundary commit after the checkout switch',t=>{
  const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'boundary-file-'));
  t.after(()=>fs.rmSync(cwd,{recursive:true,force:true}));
  const git=(...a)=>execFileSync('git',a,{cwd,encoding:'utf8',windowsHide:true}).trim();
  git('init','-q');git('config','user.email','test@example.invalid');git('config','user.name','Test');git('config','core.autocrlf','false');
  fs.writeFileSync(path.join(cwd,'README.md'),'source head\n');git('add','.');git('commit','-qm','source');
  const sourceHead=git('rev-parse','HEAD');
  const rel='.github/orchestration/queue/v2/TEST-implement-1.json';
  const bytes=Buffer.from('{"request_id":"é-1","slice_id":"TEST"}\n','utf8');
  fs.mkdirSync(path.join(cwd,path.dirname(rel)),{recursive:true});fs.writeFileSync(path.join(cwd,rel),bytes);
  git('add','.');git('commit','-qm','queue');const after=git('rev-parse','HEAD');
  git('switch','-q','--detach',sourceHead);
  assert.equal(fs.existsSync(path.join(cwd,rel)),false);
  const out=path.join(cwd,'..',path.basename(cwd)+'-copy.json');t.after(()=>fs.rmSync(out,{force:true}));
  assert.equal(materialize(after,rel,out,cwd),bytes.length);
  assert.deepEqual(fs.readFileSync(out),bytes);
  assert.throws(()=>materialize(sourceHead,rel,out,cwd),/BOUNDARY_FILE_UNAVAILABLE/);
  assert.throws(()=>materialize('HEAD',rel,out,cwd),/BOUNDARY_COMMIT_INVALID/);
  assert.throws(()=>materialize(after,'../x.json',out,cwd),/BOUNDARY_PATH_INVALID/);
});

test('the Lean Queue correction step reads the request from the boundary, never from the switched checkout',()=>{
  const wf=fs.readFileSync(path.join(__dirname,'..','..','.github','workflows','kodjo-v2-lean-queue.yml'),'utf8');
  const step=wf.slice(wf.indexOf('- name: Materialize one bounded automatic correction when eligible'),wf.indexOf('- name: Publish visual application checkpoint'));
  assert.match(step,/KODJO_EVENT_AFTER: \$\{\{ steps\.boundary\.outputs\.after_sha \}\}/);
  assert.match(step,/materialize-boundary-file\.js \$env:KODJO_EVENT_AFTER \$env:SELECTED_QUEUE \$selectedCopy/);
  assert.match(step,/generate-bounded-correction-request\.js \$selectedCopy /);
  assert.doesNotMatch(step,/generate-bounded-correction-request\.js \$env:SELECTED_QUEUE/);
});
