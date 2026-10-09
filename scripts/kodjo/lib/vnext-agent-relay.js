'use strict';
// One transport lifecycle. Operation adapters retain their semantic validators.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const V=require('./vnext-contract'),B=require('./vnext-file-bundle'),Chain=require('./vnext-live-chain');
function files(directory,prefix=''){
  return fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0).flatMap(entry=>{
    const name=prefix+entry.name,file=path.join(directory,entry.name);
    if(entry.isSymbolicLink())throw Error('AGENT_RELAY_EVIDENCE_SYMLINK');
    return entry.isDirectory()?files(file,name+'/'):[{path:name,sha256:V.sha256(fs.readFileSync(file))}];
  });
}
function publishManifest(output,request){
  const entries=files(output).filter(row=>row.path!=='evidence-manifest.json');
  B.write(path.join(output,'evidence-manifest.json'),V.sealContract({schema_version:'kodjo.vnext.agent-evidence.v1',request_hash:request.contract_hash,files:entries}));
}
function verifyEvidence(request,directory){
  const manifest=B.read(path.join(directory,'evidence-manifest.json'));V.verifyContractHash(manifest);
  if(manifest.schema_version!=='kodjo.vnext.agent-evidence.v1'||manifest.request_hash!==request.contract_hash)throw Error('AGENT_RELAY_EVIDENCE_BINDING');
  if(V.canonicalHash(manifest.files)!==V.canonicalHash(files(directory).filter(row=>row.path!=='evidence-manifest.json')))throw Error('AGENT_RELAY_EVIDENCE_CHANGED');
}
function execute(request,{cwd,evidenceRoot,outputDirectory,adapter,issueState,lock=require('./execution-lock'),priorAttempt=()=>false}={}){
  if(!evidenceRoot||!outputDirectory||!adapter)throw Error('CHATGPT_REVIEW_STORAGE_REQUIRED');
  fs.mkdirSync(outputDirectory,{recursive:true});
  const diagnostic={request_hash:request.contract_hash,slice_id:request.slice_id,operation:adapter.name,
    state:'ORCHESTRATION_FAILURE',waiting_for:'TECHNICAL_RECOVERY',next_actor:'CHATGPT_WORK',model_invoked:false,
    run_id:process.env.GITHUB_RUN_ID||null,run_attempt:process.env.GITHUB_RUN_ATTEMPT||null};
  const record=()=>B.write(path.join(outputDirectory,'checkpoint.json'),diagnostic);
  let directory,ownedLock,primary;
  try{
    if(issueState(340)!=='closed')throw Error('CHATGPT_REVIEW_PRE3_NOT_CLOSED');
    if(issueState(request.issue_number)!=='open')throw Error('CHATGPT_REVIEW_ISSUE_NOT_OPEN');
    // Validate immutable inputs before reserving any model invocation.
    adapter.preflight();
    fs.mkdirSync(evidenceRoot,{recursive:true});
    const root=fs.realpathSync(evidenceRoot),checkout=fs.realpathSync(cwd),rel=path.relative(checkout,root);
    if(!rel||(!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel)))throw Error('CHATGPT_REVIEW_CACHE_OUTSIDE_CHECKOUT_REQUIRED');
    directory=path.join(root,adapter.storageKey||request.contract_hash);
    if(fs.existsSync(directory)&&fs.lstatSync(directory).isSymbolicLink())throw Error('AGENT_RELAY_CACHE_SYMLINK');
    fs.mkdirSync(directory,{recursive:true});
    const receiptFile=path.join(directory,'receipt.json'),intentFile=path.join(directory,'invocation-intent.json');
    let receipt;
    if(fs.existsSync(receiptFile))receipt=adapter.verify(B.read(receiptFile),directory);
    else if(adapter.hasResponse(directory))receipt=adapter.recover(directory);
    else{
      if(fs.existsSync(intentFile)||priorAttempt())throw Error('CHATGPT_REVIEW_PRIOR_INVOCATION_UNKNOWN_NO_RETRY');
      const active=lock.claudeProcessState();
      if(active.state!=='NONE'||active.external_claude_count>0)throw Error('CHATGPT_REVIEW_CLAUDE_EXECUTION_UNAVAILABLE');
      ownedLock=lock.acquire(path.join(process.env.KODJO_STATE_ROOT||path.join(os.homedir(),'.kodjo-v2'),'claude-local.lock'),
        {run_id:diagnostic.run_id||request.contract_hash,request_id:request.contract_hash,github_run_id:diagnostic.run_id,github_run_attempt:diagnostic.run_attempt});
      fs.writeFileSync(intentFile,JSON.stringify({request_hash:request.contract_hash,operation:adapter.name}),{flag:'wx'});
      diagnostic.model_invoked=true;record();
      receipt=adapter.invoke(directory);
    }
    receipt=adapter.verify(receipt,directory);
    if(!fs.existsSync(receiptFile))B.write(receiptFile,receipt,{exclusive:true});
    const result=adapter.result(receipt,directory);
    fs.rmSync(path.join(outputDirectory,'failure.json'),{force:true});
    B.write(path.join(outputDirectory,'result.json'),result);
    B.write(path.join(outputDirectory,'review-receipt.json'),receipt);
    if(receipt.review_report)B.write(path.join(outputDirectory,'review-report.json'),receipt.review_report);
    Object.assign(diagnostic,{state:'AGENT_OPERATION_COMPLETED',waiting_for:'CHATGPT_REVIEW_CONSUMPTION',verdict:result.verdict||null,resume_from:request.contract_hash});
    record();return result;
  }catch(error){
    primary=error;diagnostic.error=Chain.boundedReviewOutput(error.message).text;
    try{
      record();B.write(path.join(outputDirectory,'failure.json'),V.sealContract({schema_version:'kodjo.vnext.agent-failure.v1',
        request_hash:request.contract_hash,source_head:request.source_head,slice_id:request.slice_id,operation:adapter.name,
        status:'ORCHESTRATION_FAILURE',error:diagnostic.error,model_invoked:diagnostic.model_invoked}));
    }catch(archiveError){Chain.preserveFailure(error,()=>{throw archiveError;});}
    throw error;
  }finally{
    try{
      if(directory&&fs.existsSync(directory))fs.cpSync(directory,path.join(outputDirectory,'process-evidence'),{recursive:true});
      publishManifest(outputDirectory,request);
    }catch(error){if(primary)Chain.preserveFailure(primary,()=>{throw error;});else throw error;}
    finally{if(ownedLock){if(primary)Chain.preserveFailure(primary,()=>lock.release(ownedLock));else lock.release(ownedLock);}}
  }
}
module.exports={execute,verifyEvidence,publishManifest};
