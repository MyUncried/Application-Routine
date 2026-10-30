'use strict';
const C=require('./lib/vnext-work-consumption'),V=require('./lib/vnext-contract'),W=require('./signal-vnext-agent-continuation');
function read(api,c,file,head){const r=api('repos/'+c.repository+'/contents/'+file+'?ref='+head,'GET',undefined,true);if(!r)return null;return JSON.parse(Buffer.from(r.content,'base64').toString('utf8'));}
function transaction(c,file,value,api=W.gh){
 W.binding(c);V.verifyContractHash(value);
 if(!new RegExp('^'+C.ROOT.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:claims|checkpoints|receipts)/[a-f0-9]{64}\\.json$').test(file)&&!new RegExp('^'+C.ROOT.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'wakeup-[a-f0-9]{64}\\.json$').test(file))throw Error('WORK_CONSUMPTION_WRITE_SCOPE');
 const base='repos/'+c.repository,ref=base+'/git/refs/heads/'+c.transport_branch,head=api(ref).object.sha;V.assertSha40(head);
 const pr=api(base+'/pulls/'+c.transport_pr);if(pr.state!=='open'||pr.head?.ref!==c.transport_branch||pr.head?.repo?.full_name!==c.repository||pr.head.sha!==head)throw Error('WORK_CONSUMPTION_DESTINATION');
 const existing=read(api,c,file,head);if(existing){V.verifyContractHash(existing);if(existing.contract_hash!==value.contract_hash)throw Error('WORK_CONSUMPTION_ALREADY_OWNED_OR_CHANGED');return {head,reused:true,value:existing};}
 const treeBase=api(base+'/git/commits/'+head).tree.sha;
 const blob=api(base+'/git/blobs','POST',{encoding:'utf-8',content:V.canonicalStringify(value)+'\n'});
 const tree=api(base+'/git/trees','POST',{base_tree:treeBase,tree:[{path:file,mode:'100644',type:'blob',sha:blob.sha}]});
 const commit=api(base+'/git/commits','POST',{message:'[skip ci] VNext durable consumption\nsignal_key='+(value.signal_key||'recovery'),tree:tree.sha,parents:[head]});
 if(api(ref).object.sha!==head)throw Error('WORK_CONSUMPTION_HEAD_MOVED');api(ref,'PATCH',{sha:commit.sha,force:false});
 if(api(ref).object.sha!==commit.sha||read(api,c,file,commit.sha)?.contract_hash!==value.contract_hash)throw Error('WORK_CONSUMPTION_NOT_OBSERVED');return {head:commit.sha,reused:false,value};
}
function acquire(c,s,input,api=W.gh){
 C.validateSignal(c,s);const source=read(api,c,'.github/orchestration/requests/vnext-work/signals/'+s.signal_key+'.json',input.signal_commit_sha);
 if(source?.contract_hash!==s.contract_hash)throw Error('WORK_SIGNAL_SOURCE_NOT_OBSERVED');
 const owned=C.claim(c,s,input),head=api('repos/'+c.repository+'/git/refs/heads/'+c.transport_branch).object.sha;
 if(read(api,c,C.ROOT+'receipts/'+s.signal_key+'.json',head))return {status:'ALREADY_PROCESSED'};
 const existing=read(api,c,C.ROOT+'claims/'+s.signal_key+'.json',head);if(existing){C.owns(existing,owned);return {status:'OWNED_BY_THIS_CONSUMER',claim:existing,head};}
 const result=transaction(c,C.ROOT+'claims/'+s.signal_key+'.json',owned,api);return {status:'CLAIMED',claim:result.value,head:result.head};
}
function finish(c,s,owned,outcome,api=W.gh){
 const head=api('repos/'+c.repository+'/git/refs/heads/'+c.transport_branch).object.sha;
 const actual=read(api,c,C.ROOT+'claims/'+s.signal_key+'.json',head);if(!actual)throw Error('WORK_CLAIM_NOT_OBSERVED');C.owns(actual,owned);
 const cp=C.checkpoint(c,s,owned,outcome),written=transaction(c,C.ROOT+'checkpoints/'+s.signal_key+'.json',cp,api);
 const receipt=C.processed(owned,cp,'git:'+written.head+':'+C.ROOT+'checkpoints/'+s.signal_key+'.json');
 const done=transaction(c,C.ROOT+'receipts/'+s.signal_key+'.json',receipt,api);
 let notification=null;try{notification=require('./lib/vnext-work-resume').notification(s,cp);}catch{/* Advisory feedback cannot invalidate a published receipt. */}
 return {status:'PROCESSED',head:done.head,checkpoint_hash:cp.contract_hash,notification};
}

// Replay only recorded connector results. Never execute an API from the stepper.
// The next missing request is returned to the authorized connector caller.
function step(c,s,action,input,transcript=[]){
 if(!['claim','finish'].includes(action)||!Array.isArray(transcript))throw Error('WORK_STEP_INPUT');
 return require('./lib/vnext-connector-step').step({binding:c,signal:s,action,input},api=>action==='claim'?acquire(c,s,input,api):finish(c,s,input.claim,input.outcome,api),transcript);
}

function main(args=process.argv.slice(2)){
 const fs=require('node:fs'),c=W.binding(JSON.parse(fs.readFileSync(W.CONFIG||'.github/orchestration/KODJO_VNEXT_WORK_TRANSPORT.json','utf8'))),[action,signalPath,inputPath]=args;
 const s=JSON.parse(fs.readFileSync(signalPath,'utf8')),input=JSON.parse(fs.readFileSync(inputPath,'utf8'));
 if(action==='step-claim'||action==='step-finish')return step(c,s,action.slice(5),input.input,input.transcript);
 if(action==='claim')return acquire(c,s,input);
 if(action==='finish')return finish(c,s,input.claim,input.outcome);
 throw Error('Usage: consume-vnext-work-signal.js claim|finish signal.json private-input.json');
}
if(require.main===module)try{console.log(JSON.stringify(main()));}catch(e){console.error(e.message);process.exitCode=1;}
module.exports={read,transaction,acquire,finish,step};
