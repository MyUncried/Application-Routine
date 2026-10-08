#!/usr/bin/env node
'use strict';
const Q=require('./lib/vnext-github-qualification');
async function wait({head,repository,timeoutMs=80*60*1000,read=Q.readGithub}) {
 const started=Date.now();
 while(Date.now()-started<timeoutMs) {
  const runs=Q.pages('repos/'+repository+'/actions/runs?head_sha='+head,'workflow_runs',read).filter(r=>r.path===Q.WORKFLOW && r.head_sha===head).sort((a,b)=>b.id-a.id);
  const run=runs[0];
  if(run?.status==='completed') {
   if(run.conclusion!=='success') throw Error('VNEXT_AUDIT_QUALIFICATION_FAILED:'+run.id);
   return Q.verifyQualification({repository,head,runId:run.id,read});
  }
  await new Promise(resolve=>setTimeout(resolve,30000));
 }
 throw Error('VNEXT_AUDIT_QUALIFICATION_PENDING');
}
if(require.main===module)wait({head:process.env.CANDIDATE_HEAD,repository:process.env.GITHUB_REPOSITORY}).then(result=>console.log(JSON.stringify(result))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={wait};
