#!/usr/bin/env node
'use strict';
// The pilot runs this after archive verification. It materializes an append-only
// ledger for Git publication; it neither dispatches a model nor approves a plan.
const path=require('node:path'),fs=require('node:fs');
const Agent=require('./agent-relay'),Chain=require('./lib/vnext-live-chain'),B=require('./lib/vnext-file-bundle'),C=require('./lib/vnext-cumulative-review'),V=require('./lib/vnext-contract');
function consume(request,directory,output,{cwd=process.cwd()}={}){
 if(request.operation==='plan-review'&&fs.existsSync(path.join(directory,'failure.json'))){
  require('./lib/vnext-agent-relay').verifyEvidence(request,directory);const failure=B.read(path.join(directory,'failure.json'));V.verifyContractHash(failure);
  if(failure.request_hash!==request.contract_hash||failure.operation!==request.operation||failure.slice_id!==request.slice_id||failure.source_head!==request.source_head||failure.model_invoked!==true||failure.error!=='VNEXT_REVIEW_COVERAGE_INCOMPLETE')throw Error('VNEXT_HISTORICAL_PARTIAL_BINDING');
  const data=Agent.inputs(request,cwd),produced=Chain.readGitObject(cwd,request.source_head,data.produced_file);Chain.verifyProduced(produced,cwd);if(request.operation_hash!==produced.contract_hash)throw Error('VNEXT_HISTORICAL_CONTEXT_CHANGED');
  const mode=produced.artifacts.planningEnvelope.planning_mode.toLowerCase(),saved=B.read(path.join(directory,mode+'-review-response.json')),receipt=C.record(produced,saved,{sourceRequestHash:request.contract_hash}),ledger=C.append(produced,null,receipt),file=C.pathFor(produced);B.write(path.join(output,file),ledger);
  const checkpoint=V.sealContract({schema_version:'kodjo.vnext.historical-review-reconciliation.v1',request_hash:request.contract_hash,produced_chain_hash:produced.contract_hash,ledger_path:file,ledger_hash:ledger.contract_hash,direct_targets:ledger.coverage.direct_target_ids.length,pending_targets:ledger.coverage.pending_target_ids.length,status:'PARTIAL_NOT_APPROVED',model_invoked:false});B.write(path.join(output,'historical-review-reconciliation.json'),checkpoint);return checkpoint;
 }
 const result=Agent.verify(request,directory,{cwd});
 if(request.operation==='implementation-review'){
  const I=require('./lib/vnext-implementation-cumulative');if(result.status!=='COMPLETED'||result.receipt?.schema_version!=='kodjo.vnext.partial-implementation-review.v1')throw Error('VNEXT_PARTIAL_IMPLEMENTATION_RESULT_REQUIRED');
  const op=Agent.adapterFor(request,cwd),d=op.implementationDossier,ledger=I.append(d,op.reviewLedger,result.receipt),next=I.scope(d,ledger),file='.github/orchestration/vnext-implementation-review-ledgers/'+I.hash(d)+'.json';B.write(path.join(output,file),ledger);
  const complete=next?null:I.aggregate(d,ledger);if(complete)B.write(path.join(output,'cumulative-implementation-review-receipt.json'),complete);
  const progress=V.sealContract({schema_version:'kodjo.vnext.implementation-review-progress.v1',request_hash:request.contract_hash,dossier_hash:I.hash(d),ledger_path:file,ledger_hash:ledger.contract_hash,reviewed_targets:ledger.reviewed_targets.length,pending_targets:I.catalog(d,ledger).filter(id=>!ledger.reviewed_targets.includes(id)).length,next_action:next?'PUBLISH_LEDGER_AND_REQUEST_NEXT_SCOPE':'CONSUME_COMPLETE_REVIEW_THROUGH_EXISTING_GATES',next_scope_hash:next?.contract_hash||null,complete_receipt_hash:complete?.contract_hash||null,model_invoked:false});B.write(path.join(output,'implementation-review-progress-checkpoint.json'),progress);return progress;
 }
 if(result.status!=='COMPLETED'||result.receipt?.schema_version!==C.PARTIAL)throw Error('VNEXT_PARTIAL_REVIEW_RESULT_REQUIRED');
 const data=Agent.inputs(request,cwd),produced=Chain.readGitObject(cwd,request.source_head,data.produced_file);Chain.verifyProduced(produced,cwd);
 const file=C.pathFor(produced),exists=require('node:child_process').spawnSync('git',['cat-file','-e',request.source_head+':'+file],{cwd,stdio:'ignore',windowsHide:true}).status===0;
 const previous=exists?Chain.readGitObject(cwd,request.source_head,file):null,ledger=C.append(produced,previous,result.receipt),scope=C.scopeFor(produced,ledger);
 const target=path.join(output,file);B.write(target,ledger);
 let complete=null;if(!scope){complete=C.aggregate(produced,ledger);B.write(path.join(output,'cumulative-review-receipt.json'),complete);}
 const checkpoint=V.sealContract({schema_version:'kodjo.vnext.review-progress-checkpoint.v1',request_hash:request.contract_hash,produced_chain_hash:produced.contract_hash,review_context_hash:ledger.review_context_hash,ledger_path:file,ledger_hash:ledger.contract_hash,
  direct_targets:ledger.coverage.direct_target_ids.length,inherited_targets:ledger.coverage.inherited_target_ids.length,pending_targets:ledger.coverage.pending_target_ids.length,finding_ids:ledger.finding_ids,
  next_action:scope?'PUBLISH_LEDGER_AND_REQUEST_NEXT_SCOPE':'CONSUME_COMPLETE_REVIEW_THROUGH_EXISTING_GATES',next_scope_hash:scope?.contract_hash||null,complete_receipt_hash:complete?.contract_hash||null,verdict:complete?.review_report.verdict||null,model_invoked:false});
 B.write(path.join(output,'review-progress-checkpoint.json'),checkpoint);return checkpoint;
}
if(require.main===module)try{const [file,directory,output]=process.argv.slice(2);if(!output)throw Error('Usage: consume-vnext-review-progress.js <request.json> <verified-artifact-directory> <output-directory>');console.log(JSON.stringify(consume(B.read(file),directory,output)));}catch(e){console.error(e.message);process.exitCode=1;}
module.exports={consume};
