'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {verifyLiveTarget}=require('../../scripts/kodjo/verify-preflight-live-target');
const root=path.resolve(__dirname,'../..');
const head='a'.repeat(40),other='b'.repeat(40);
const queue={operation_kind:'VISUAL_CORRECTION',delivery_target:{kind:'EXISTING_PR',application_pr:142,branch:'kodjo/existing',application_head:head}};
function target(){return {state:'open',base:{ref:'main'},head:{ref:'kodjo/existing',sha:head}};}
test('audit F07: a fresh read at each boundary refuses changes after initial PASS',()=>{
  for(const mutation of ['closed','merged','branch','head','remote-forward','remote-backward','api-down']){
    let pr=target(),remote=head,down=false;
    const options={repository:'o/r',fetchPullRequest:()=>{if(down)throw Error('API_DOWN');return pr;},fetchRemoteHead:()=>remote};
    assert.equal(verifyLiveTarget(queue,options).status,'PASS');
    if(mutation==='closed'||mutation==='merged')pr.state='closed';
    if(mutation==='branch')pr.head.ref='other';
    if(mutation==='head')pr.head.sha=other;
    if(mutation.startsWith('remote-'))remote=other;
    if(mutation==='api-down')down=true;
    let effects=0;
    assert.throws(()=>{verifyLiveTarget(queue,options);effects++;});
    assert.equal(effects,0,mutation);
  }
});
test('audit F07: unchanged target can pass repeatedly; IMPLEMENT is guarded only when it targets an existing PR',()=>{
  const options={repository:'o/r',fetchPullRequest:()=>target(),fetchRemoteHead:()=>head};
  for(let i=0;i<4;i++)assert.equal(verifyLiveTarget(queue,options).status,'PASS');
  assert.equal(verifyLiveTarget({operation_kind:'IMPLEMENT'},{}).status,'NOT_APPLICABLE');
  const targeted={operation_kind:'IMPLEMENT',delivery_target:{kind:'EXISTING_PR',application_pr:142,branch:'kodjo/existing',application_head:head}};
  assert.equal(verifyLiveTarget(targeted,options).status,'PASS');
  assert.throws(()=>verifyLiveTarget(targeted,{...options,fetchRemoteHead:()=>other}),/KODJO_QUEUE_REMOTE_HEAD_MOVED/);
});
test('audit F07: guards are wired immediately before mutable boundaries and agent gets no supervisor token',()=>{
  const ps=fs.readFileSync(path.join(root,'scripts/kodjo/run-queued-request.ps1'),'utf8');
  assert.match(ps,/Assert-LiveTarget\s+git switch --detach \$applicationHead/);
  assert.match(ps,/Assert-LiveTarget\s+git reset --quiet/);
  assert.match(ps,/Assert-LiveTarget\s+git -c user.name=/);
  assert.match(ps,/Assert-LiveTarget\s+git push origin \$pushRefspec/);
  const node=fs.readFileSync(path.join(root,'scripts/kodjo/run-local-claude.js'),'utf8');
  assert.match(node,/assertLiveTarget\(\);\s+const restored = restoreRecovery/);
  assert.match(node,/assertLiveTarget\(\);\s+const claudeStartedMs/);
  assert.ok(node.indexOf('consumeLiveToken(process.env)')<node.indexOf('const claudeEnv ='));
  const final=fs.readFileSync(path.join(root,'.github/workflows/kodjo-slice-finalize.yml'),'utf8');
  const publish=final.slice(final.indexOf('- name: Publish final checkpoint'));
  assert.ok(publish.indexOf('Final target branch moved')<publish.indexOf('gh issue comment'));
});

test('audit F07: private read token is removed from the environment inherited by actual child processes',()=>{
  const {consumeLiveToken}=require('../../scripts/kodjo/verify-preflight-live-target');
  const {spawnSync}=require('node:child_process');
  const env={...process.env,KODJO_LIVE_GH_TOKEN:'audit-placeholder-secret'};
  assert.equal(consumeLiveToken(env),'audit-placeholder-secret');
  const child=spawnSync(process.execPath,['-e',"process.stdout.write(String(process.env.KODJO_LIVE_GH_TOKEN))"],{env,encoding:'utf8'});
  assert.equal(child.status,0);assert.equal(child.stdout,'undefined');
});
