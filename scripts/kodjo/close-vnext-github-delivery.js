#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const Closure=require('./lib/vnext-github-closure');
const Final=require('./finalize-vnext-delivery');
function ghClient() {
  const api=(endpoint,method='GET',data) => {
    const args=['api','--hostname','github.com',endpoint,'--method',method];
    if(data)args.push('--input','-');
    return JSON.parse(execFileSync('gh',args,{encoding:'utf8',input:data?JSON.stringify(data):undefined,windowsHide:true,timeout:30000,maxBuffer:16*1024*1024}));
  };
  return {
    issue:(r,n)=>api(`repos/${r}/issues/${n}`),pull:(r,n)=>api(`repos/${r}/pulls/${n}`),
    comment:(r,n,body)=>api(`repos/${r}/issues/${n}/comments`,'POST',{body}),
    closeIssue:(r,n)=>api(`repos/${r}/issues/${n}`,'PATCH',{state:'closed',state_reason:'completed'}),
    comments:(r,n)=>{const rows=[];for(let page=1;;page++){const next=api(`repos/${r}/issues/${n}/comments?per_page=100&page=${page}`);rows.push(...next);if(next.length<100)return rows;}},
    // Source-comment reader for the existing finalizer.
    sourceComment:(r,n)=>api(`repos/${r}/issues/comments/${n}`)
  };
}
function main(configFile,directory,{github=ghClient(),env=process.env,cwd=process.cwd()}={}) {
  const c=Closure.validateConfig(JSON.parse(fs.readFileSync(configFile,'utf8')),{cwd});
  if(env.GITHUB_ACTIONS!=='true' || env.GITHUB_REPOSITORY!==c.repository
      || env.VNEXT_CLOSURE_JOB!=='close-vnext-delivery' || !env.GITHUB_RUN_ID) throw Error('VNEXT_GITHUB_CLOSURE_SERIALIZED_WORKFLOW_REQUIRED');
  fs.mkdirSync(directory,{recursive:true});
  const controllerHead=execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim();
  const workflowPath=env.GITHUB_WORKFLOW_REF?.split('@')[0].slice((c.repository+'/').length);
  if(!env.GITHUB_WORKFLOW_REF?.startsWith(c.repository+'/') || !['.github/workflows/kodjo-vnext12-disposable.yml','.github/workflows/kodjo-vnext-closure.yml'].includes(workflowPath)) throw Error('VNEXT_GITHUB_CLOSURE_WORKFLOW_REFUSED');
  const provenance=require('./lib/vnext-execution-provenance').observe({controllerCwd:cwd,approvedCwd:cwd,
    controllerHead,approvedHead:controllerHead,env,workflowPath,controllerScript:'scripts/kodjo/close-vnext-github-delivery.js',
    runtimeScript:'scripts/kodjo/finalize-vnext-delivery.js'});
  fs.writeFileSync(path.join(directory,'execution-provenance.json'),JSON.stringify(provenance,null,2)+'\n');
  const input=JSON.parse(fs.readFileSync(path.join(cwd,c.finalization_manifest),'utf8'));
  if(input.repository!==c.repository || input.issue!==c.issue_number || input.head!==c.delivery_head
      || input.approvedHead!==c.delivery_head || input.sliceId!==c.slice_id) throw Error('VNEXT_GITHUB_CLOSURE_MANIFEST_BINDING');
  Closure.observe(c,github);
  const deliveryCwd=path.resolve(cwd,env.VNEXT_DELIVERY_CWD || '.');
  const git=(...args)=>execFileSync('git',args,{cwd:deliveryCwd,encoding:'utf8'}).trim();
  // A current producer job supplies observed proof, never declared PASS literals.
  if(workflowPath==='.github/workflows/kodjo-vnext-closure.yml'){
    input.checksReceipt={head:c.delivery_head,tested_tree_oid:git('rev-parse','HEAD^{tree}'),
      source_run:env.GITHUB_RUN_ID,source_artifact:env.VNEXT_TEST_ARTIFACT_ID,
      source_archive_sha256:(env.VNEXT_TEST_ARTIFACT_DIGEST||'').replace(/^sha256:/,'')};
  }
  if(git('rev-parse','HEAD')!==c.delivery_head || git('rev-parse','HEAD^{tree}')!==input.checksReceipt?.tested_tree_oid
      || git('status','--porcelain','--untracked-files=all')) throw Error('VNEXT_GITHUB_CLOSURE_TESTED_TREE_MISMATCH');
  // Always revalidate Git objects, the original review, decision and reserves;
  // a previously sealed JSON alone is never sufficient to authorize a write.
  const final=Final.execute(input,{cwd:deliveryCwd,controllerCwd:cwd,directory,env,
    github:{...require('./lib/vnext-test-evidence').githubClient(),...github,comment:github.sourceComment}});
  const result=Closure.close(c,final,github);
  fs.writeFileSync(path.join(directory,'github-closure.json'),JSON.stringify(result,null,2)+'\n');
  const resumed=Closure.close(c,final,github);
  if(resumed.contract_hash!==result.contract_hash) throw Error('VNEXT_GITHUB_CLOSURE_RECOVERY_DRIFT');
  fs.writeFileSync(path.join(directory,'recovery.json'),JSON.stringify({status:'REUSED_EXISTING_CLOSURE',
    final_output_comment_id:resumed.final_output_comment_id,slice_closed_comment_id:resumed.slice_closed_comment_id,
    finalization_hash:resumed.finalization_hash,github_issue_closed:true,new_records_created:false},null,2)+'\n');
  return result;
}
if(require.main===module){try{console.log(JSON.stringify(main(...process.argv.slice(2))));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={main,ghClient};
