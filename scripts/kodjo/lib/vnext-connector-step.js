'use strict';
// Shared replay adapter. It returns requests; only the authorized caller executes them.
const V=require('./vnext-contract');
function step(context,operation,transcript=[]) {
  if(!Array.isArray(transcript))throw Error('WORK_STEP_INPUT');
  const context_hash=V.canonicalHash(context);let index=0;
  const api=(endpoint,method='GET',data,allowMissing=false)=>{
    const request={endpoint,method,data:data===undefined?null:data,allowMissing};
    const row=transcript[index++];
    if(!row){const pause=Error('WORK_STEP_WAITING');pause.request=request;throw pause;}
    V.assertExactKeys(row,['context_hash','request','response'],[],'WORK_STEP_ROW');
    if(row.context_hash!==context_hash||V.canonicalStringify(row.request)!==V.canonicalStringify(request))throw Error('WORK_STEP_TRANSCRIPT_CHANGED');
    if(row.response===null&&!allowMissing)throw Error('WORK_STEP_RESPONSE_REQUIRED');
    return row.response;
  };
  try {
    const result=operation(api);
    if(index!==transcript.length)throw Error('WORK_STEP_TRAILING_RESPONSE');
    return {status:'COMPLETE',context_hash,result};
  }catch(error){
    if(error.message!=='WORK_STEP_WAITING')throw error;
    return {status:'WAITING_CONNECTOR',context_hash,request_index:index-1,request:error.request};
  }
}
module.exports={step};
