'use strict';
// Append-only observations for ONE exact context. Every record keeps its raw
// process response and session. A final aggregate has no invented model session.
const V=require('./vnext-contract'),Review=require('./review-contract'),Components=require('./vnext-component-coverage');
const LEDGER='kodjo.vnext.cumulative-review-ledger.v1',PARTIAL='kodjo.vnext.partial-review-receipt.v1',COMPLETE='kodjo.vnext.cumulative-review-receipt.v1';
const MAX_DIRECT_TARGETS=4000;
const targets=p=>Review.TARGET_TYPES.flatMap(t=>p.artifacts.reviewContext.target_catalog[t]);
const equal=(a,b,code)=>{if(V.canonicalHash(a)!==V.canonicalHash(b))throw Error(code);};
function pathFor(produced){return '.github/orchestration/vnext-review-ledgers/'+produced.artifacts.reviewContext.contract_hash+'.json';}
function scopeFor(produced,ledger=null,{maxTargets=MAX_DIRECT_TARGETS}={}){
 if(ledger)verifyLedger(produced,ledger);
 const inherited=new Set(produced.artifacts.reviewContext.component_coverage?.inheritance_links.map(r=>r.assertion_id)||[]),done=new Set(ledger?.coverage.direct_target_ids||[]);
 const limit=ledger?.target_limit||maxTargets;if(!Number.isSafeInteger(limit)||limit<1||limit>MAX_DIRECT_TARGETS)throw Error('VNEXT_CUMULATIVE_CAPACITY_INVALID');
 const pending=targets(produced).filter(id=>!inherited.has(id)&&!done.has(id));
 if(!pending.length)return null;
 return V.sealContract({schema_version:'kodjo.vnext.review-scope.v1',produced_chain_hash:produced.contract_hash,review_context_hash:produced.artifacts.reviewContext.contract_hash,previous_ledger_hash:ledger?.contract_hash||null,target_limit:limit,target_ids:pending.slice(0,limit)});
}
function validateScope(produced,scope){
 V.assertExactKeys(scope,['schema_version','produced_chain_hash','review_context_hash','previous_ledger_hash','target_limit','target_ids','contract_hash'],[],'VNEXT_CUMULATIVE_SCOPE_KEYS');V.verifyContractHash(scope);
 if(scope.schema_version!=='kodjo.vnext.review-scope.v1'||scope.produced_chain_hash!==produced.contract_hash||scope.review_context_hash!==produced.artifacts.reviewContext.contract_hash)throw Error('VNEXT_CUMULATIVE_SCOPE_STALE');
 if(scope.previous_ledger_hash!==null)V.assertSha64(scope.previous_ledger_hash);
 const ids=V.uniqueStrings(scope.target_ids,'VNEXT_CUMULATIVE_SCOPE_TARGETS','target_ids'),allowed=new Set(targets(produced));
 if(!Number.isSafeInteger(scope.target_limit)||scope.target_limit<1||scope.target_limit>MAX_DIRECT_TARGETS||ids.length>scope.target_limit||ids.some(id=>!allowed.has(id)))throw Error('VNEXT_CUMULATIVE_SCOPE_TARGETS');return scope;
}
function record(produced,saved,{scope=null,sourceRequestHash=null}={}){
 V.verifyContractHash(produced);V.verifyContractHash(saved);
 if(saved.schema_version!=='kodjo.vnext.review-response.v1'||saved.produced_chain_hash!==produced.contract_hash||saved.reviewer_packet_hash!==produced.reviewer_packet.contract_hash||saved.stdout_sha256!==V.sha256(saved.stdout)||saved.process_result?.status!==0||saved.process_result.signal||saved.process_result.error_code)throw Error('VNEXT_CUMULATIVE_PROCESS_UNVERIFIED');
 if(scope){validateScope(produced,scope);if(saved.review_scope_hash!==scope.contract_hash)throw Error('VNEXT_CUMULATIVE_SCOPE_UNBOUND');}
 else if(saved.review_scope_hash)throw Error('VNEXT_CUMULATIVE_SCOPE_REQUIRED');
 if(sourceRequestHash!==null){V.assertSha64(sourceRequestHash);if(scope)throw Error('VNEXT_CUMULATIVE_HISTORICAL_SCOPE_INVALID');}
 let result;try{result=JSON.parse(saved.stdout);}catch{throw Error('VNEXT_CUMULATIVE_RAW_INVALID');}
 if(result.type!=='result'||result.is_error||typeof result.session_id!=='string'||!result.session_id||!result.structured_output)throw Error('VNEXT_CUMULATIVE_RAW_INVALID');
 const semantic=require('./vnext-live-chain').decodeReviewOutput(produced.artifacts.reviewContext,result.structured_output.semantic_review);
 if(scope&&semantic.reviewed_target_ids.some(id=>!scope.target_ids.includes(id)))throw Error('VNEXT_CUMULATIVE_SCOPE_EXCEEDED');
 const partial=Review.buildPartialReviewReport({reviewContext:produced.artifacts.reviewContext,semanticReview:semantic});
 if(!Array.isArray(result.structured_output.native_assessment_observations))throw Error('VNEXT_CUMULATIVE_NATIVE_OBSERVATIONS_REQUIRED');
 if(scope&&result.structured_output.native_assessment_observations.some(r=>!scope.target_ids.includes(r.criterion_id)))throw Error('VNEXT_CUMULATIVE_NATIVE_SCOPE_EXCEEDED');
 return V.sealContract({schema_version:PARTIAL,produced_chain_hash:produced.contract_hash,review_context_hash:produced.artifacts.reviewContext.contract_hash,reviewer_packet_hash:produced.reviewer_packet.contract_hash,
  scope,...(sourceRequestHash?{source_request_hash:sourceRequestHash}:{}),session_id:result.session_id,saved_response:saved,partial_report:partial,native_observations:result.structured_output.native_assessment_observations});
}
function verifyRecord(produced,receipt){
 V.verifyContractHash(receipt);if(receipt.schema_version!==PARTIAL)throw Error('VNEXT_CUMULATIVE_PARTIAL_SCHEMA');
 equal(record(produced,receipt.saved_response,{scope:receipt.scope,sourceRequestHash:receipt.source_request_hash||null}),receipt,'VNEXT_CUMULATIVE_PARTIAL_CHANGED');return receipt;
}
function initial(produced){return V.sealContract({schema_version:LEDGER,produced_chain_hash:produced.contract_hash,review_context_hash:produced.artifacts.reviewContext.contract_hash,target_limit:MAX_DIRECT_TARGETS,records:[],coverage:{direct_target_ids:[],inherited_target_ids:[],pending_target_ids:[...targets(produced)].sort()},finding_ids:[],status:'PARTIAL_NOT_APPROVED'});}
function project(produced,records){
 const direct=[...new Set(records.flatMap(r=>r.partial_report.reviewed_target_ids))].sort(),context=produced.artifacts.reviewContext;
 const inherited=context.component_coverage?Components.covered(context.component_coverage,direct):[],covered=new Set([...direct,...inherited]);
 return V.sealContract({schema_version:LEDGER,produced_chain_hash:produced.contract_hash,review_context_hash:context.contract_hash,target_limit:records.find(r=>r.scope)?.scope.target_limit||MAX_DIRECT_TARGETS,records,
  coverage:{direct_target_ids:direct,inherited_target_ids:inherited,pending_target_ids:targets(produced).filter(id=>!covered.has(id)).sort()},finding_ids:[...new Set(records.flatMap(r=>r.partial_report.findings.map(f=>f.finding_id)))].sort(),status:'PARTIAL_NOT_APPROVED'});
}
function append(produced,ledger,receipt){
 const prior=ledger||initial(produced);if(ledger)verifyLedger(produced,ledger);verifyRecord(produced,receipt);
 if(prior.records.some(r=>r.contract_hash===receipt.contract_hash))return prior;
 if(receipt.scope){
  equal(scopeFor(produced,ledger,{maxTargets:receipt.scope.target_limit}),receipt.scope,'VNEXT_CUMULATIVE_NEXT_SCOPE_MISMATCH');
 }else if(prior.records.length)throw Error('VNEXT_CUMULATIVE_HISTORICAL_IMPORT_AMBIGUOUS');
 const next=project(produced,[...prior.records,receipt]);
 if(next.coverage.direct_target_ids.length===prior.coverage.direct_target_ids.length)throw Error('VNEXT_CUMULATIVE_NO_PROGRESS_NO_RETRY');
 return next;
}
function verifyLedger(produced,ledger){
 V.verifyContractHash(ledger);if(ledger.schema_version!==LEDGER||ledger.produced_chain_hash!==produced.contract_hash||ledger.review_context_hash!==produced.artifacts.reviewContext.contract_hash)throw Error('VNEXT_CUMULATIVE_LEDGER_STALE');
 let prefix=null;const seen=new Set();
 for(const row of ledger.records){verifyRecord(produced,row);if(seen.has(row.contract_hash))throw Error('VNEXT_CUMULATIVE_RECORD_DUPLICATE');seen.add(row.contract_hash);
  if(row.scope){
   // Verify ordering without calling scopeFor's full-ledger validator recursively.
   const covered=new Set(prefix?.coverage.direct_target_ids||[]),inherited=new Set(produced.artifacts.reviewContext.component_coverage?.inheritance_links.map(r=>r.assertion_id)||[]);
   const expected=V.sealContract({schema_version:'kodjo.vnext.review-scope.v1',produced_chain_hash:produced.contract_hash,review_context_hash:produced.artifacts.reviewContext.contract_hash,previous_ledger_hash:prefix?.contract_hash||null,target_limit:prefix?.target_limit||row.scope.target_limit,target_ids:targets(produced).filter(id=>!covered.has(id)&&!inherited.has(id)).slice(0,prefix?.target_limit||row.scope.target_limit)});
   equal(expected,row.scope,'VNEXT_CUMULATIVE_SCOPE_ORDER_INVALID');
  }else if(prefix)throw Error('VNEXT_CUMULATIVE_HISTORICAL_IMPORT_AMBIGUOUS');
  const next=project(produced,[...(prefix?.records||[]),row]);if(next.coverage.direct_target_ids.length===(prefix?.coverage.direct_target_ids.length||0))throw Error('VNEXT_CUMULATIVE_NO_PROGRESS_NO_RETRY');prefix=next;
 }
 equal(prefix||initial(produced),ledger,'VNEXT_CUMULATIVE_LEDGER_CHANGED');return ledger;
}
function mergeRows(records,field,key){const found=new Map();for(const row of records.flatMap(r=>r.partial_report[field]||[])){if(found.has(row[key]))equal(found.get(row[key]),row,'VNEXT_CUMULATIVE_OBSERVATION_CONFLICT');else found.set(row[key],row);}return [...found.values()].sort((a,b)=>a[key].localeCompare(b[key]));}
function aggregate(produced,ledger){
 verifyLedger(produced,ledger);const findings=mergeRows(ledger.records,'findings','finding_id');
 const semantic={reviewed_target_ids:ledger.coverage.direct_target_ids,findings:findings.map(({finding_id,blocking,reentry_stage,...row})=>row),finding_resolutions:mergeRows(ledger.records,'finding_resolutions','finding_id'),...(produced.artifacts.reviewContext.acceptance_gaps?{acceptance_resolutions:mergeRows(ledger.records,'acceptance_resolutions','gap_id')}:{})};
 const report=Review.buildReviewReport({reviewContext:produced.artifacts.reviewContext,semanticReview:semantic});
 const native=new Map(),nativeSessions={};for(const r of ledger.records)for(const row of r.native_observations){
  if(native.has(row.criterion_id))equal(native.get(row.criterion_id),row,'VNEXT_CUMULATIVE_NATIVE_CONFLICT');else native.set(row.criterion_id,row);
  (nativeSessions[row.criterion_id]||=[]).push(r.session_id);
 }
 return V.sealContract({schema_version:COMPLETE,produced_chain_hash:produced.contract_hash,reviewer_packet_hash:produced.reviewer_packet.contract_hash,review_context_hash:produced.artifacts.reviewContext.contract_hash,
  ledger,review_report:report,session_ids:[...new Set(ledger.records.map(r=>r.session_id))].sort(),native_observations:[...native.values()],native_observation_sessions:nativeSessions});
}
function verifyComplete(produced,receipt){V.verifyContractHash(receipt);if(receipt.schema_version!==COMPLETE)throw Error('VNEXT_CUMULATIVE_COMPLETE_SCHEMA');equal(aggregate(produced,receipt.ledger),receipt,'VNEXT_CUMULATIVE_RECEIPT_CHANGED');return receipt.review_report;}
module.exports={LEDGER,PARTIAL,COMPLETE,MAX_DIRECT_TARGETS,pathFor,scopeFor,validateScope,record,verifyRecord,append,verifyLedger,aggregate,verifyComplete};
