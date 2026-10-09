'use strict';

// A separate independent supplement can add precise dependencies to an
// existing finding. It cannot rewrite that finding or approve its correction.
const V=require('./vnext-contract'),Review=require('./review-contract');
const REQUEST='kodjo.vnext.review-scope-request.v1';
const RECEIPT='kodjo.vnext.review-scope-receipt.v1';
function buildRequest({reviewContext,reviewReport,artifactGraph,candidates}) {
  Review.validateReviewReport(reviewReport,reviewContext);
  if(!['REVISE','CLARIFICATION_REQUIRED'].includes(reviewReport.verdict))V.fail('VNEXT_SCOPE_BLOCKING_REVIEW_REQUIRED');
  const findings=new Map(reviewReport.findings.filter(f=>f.blocking).map(f=>[f.finding_id,f]));
  const catalog=new Set(Review.TARGET_TYPES.flatMap(t=>reviewContext.target_catalog[t]));
  if(!Array.isArray(candidates)||!candidates.length)V.fail('VNEXT_SCOPE_REQUEST_EMPTY');
  const seen=new Set();
  const rows=candidates.map(row=>{
    V.assertExactKeys(row,['finding_id','target_ids','reason'],[],'VNEXT_SCOPE_CANDIDATE_KEYS');
    const finding=findings.get(row.finding_id);
    if(!finding||seen.has(row.finding_id))V.fail('VNEXT_SCOPE_FINDING_INVALID',row.finding_id);
    seen.add(row.finding_id);V.assertNonEmptyString(row.reason,'VNEXT_SCOPE_REASON_REQUIRED');
    const ids=V.uniqueStrings(row.target_ids,'VNEXT_SCOPE_TARGETS_INVALID','target_ids').sort();
    const targets=ids.map(id=>{
      const target=artifactGraph.records.get(id);
      if(!catalog.has(id)||!target||id===finding.target_id||finding.dependency_target_ids.includes(id))V.fail('VNEXT_SCOPE_TARGET_INVALID',id);
      if(['SOURCE_UNIT','CANDIDATE','PLAN_CONTRACT'].includes(target.target_type))V.fail('VNEXT_SCOPE_SEMANTIC_TARGET_REQUIRED',id);
      return {target_id:id,target_type:target.target_type,object_hash:target.object_hash,parent_ids:target.parent_ids};
    });
    return {finding_id:row.finding_id,finding,reason:row.reason,targets};
  });
  return V.sealContract({schema_version:REQUEST,review_context_hash:reviewContext.contract_hash,review_report_hash:reviewReport.contract_hash,base_target_graph_hash:require('./revision-contract').graphFingerprint(artifactGraph),requests:rows});
}
function validateRequest(request){
  V.assertExactKeys(request,['schema_version','review_context_hash','review_report_hash','base_target_graph_hash','requests','contract_hash'],[],'VNEXT_SCOPE_REQUEST_KEYS');
  if(request.schema_version!==REQUEST)V.fail('VNEXT_SCOPE_REQUEST_SCHEMA');
  for(const k of ['review_context_hash','review_report_hash','base_target_graph_hash'])V.assertSha64(request[k],'VNEXT_SCOPE_HASH_INVALID');
  if(!Array.isArray(request.requests)||!request.requests.length)V.fail('VNEXT_SCOPE_REQUEST_EMPTY');
  V.verifyContractHash(request,'VNEXT_SCOPE_REQUEST_HASH');
}
function fromRaw(request,raw){
  validateRequest(request);
  let result;try{result=JSON.parse(raw);}catch{V.fail('VNEXT_SCOPE_RESULT_INVALID');}
  if(result.type!=='result'||result.is_error||!result.session_id||!result.structured_output)V.fail('VNEXT_SCOPE_RESULT_INVALID');
  const output=result.structured_output;
  V.assertExactKeys(output,['request_hash','assessments'],[],'VNEXT_SCOPE_OUTPUT_KEYS');
  if(output.request_hash!==request.contract_hash)V.fail('VNEXT_SCOPE_REQUEST_MISMATCH');
  if(!Array.isArray(output.assessments)||output.assessments.length!==request.requests.length)V.fail('VNEXT_SCOPE_ASSESSMENT_COVERAGE');
  const seen=new Set(),additions=[];
  for(let row of output.assessments){
    if(Object.hasOwn(row,'dependency_ranges')||Object.hasOwn(row,'observed_ranges')){
      V.assertExactKeys(row,['finding_id','dependency_ranges','observed_ranges','evidence_refs','reason'],[],'VNEXT_SCOPE_ASSESSMENT_KEYS');
      const subject=request.requests.find(r=>r.finding_id===row.finding_id);
      if(!subject)V.fail('VNEXT_SCOPE_FINDING_INVALID');
      const expand=ranges=>{
        if(!Array.isArray(ranges))V.fail('VNEXT_SCOPE_RANGE_INVALID');
        let last=-1;const ids=[];
        for(const range of ranges){if(!Array.isArray(range)||range.length!==2||!range.every(Number.isSafeInteger)||range[0]<=last||range[0]<0||range[0]>range[1]||range[1]>=subject.targets.length)V.fail('VNEXT_SCOPE_RANGE_INVALID');for(let i=range[0];i<=range[1];i++)ids.push(i);last=range[1];}
        return ids;
      };
      row={finding_id:row.finding_id,dependency_indices:expand(row.dependency_ranges),observed_indices:expand(row.observed_ranges),evidence_refs:row.evidence_refs,reason:row.reason};
    }
    V.assertExactKeys(row,['finding_id','dependency_indices','observed_indices','evidence_refs','reason'],[],'VNEXT_SCOPE_ASSESSMENT_KEYS');
    const subject=request.requests.find(r=>r.finding_id===row.finding_id);
    if(!subject||seen.has(row.finding_id))V.fail('VNEXT_SCOPE_FINDING_INVALID');seen.add(row.finding_id);
    for(const field of ['dependency_indices','observed_indices'])if(!Array.isArray(row[field])||new Set(row[field]).size!==row[field].length||row[field].some(i=>!Number.isSafeInteger(i)||i<0||i>=subject.targets.length))V.fail('VNEXT_SCOPE_INDEX_INVALID');
    const observed=new Set(row.observed_indices);
    if(row.dependency_indices.some(i=>!observed.has(i)))V.fail('VNEXT_SCOPE_UNOBSERVED_DEPENDENCY');
    V.uniqueStrings(row.evidence_refs,'VNEXT_SCOPE_EVIDENCE_REQUIRED','evidence_refs');V.assertNonEmptyString(row.reason,'VNEXT_SCOPE_REASON_REQUIRED');
    additions.push({finding_id:row.finding_id,target_ids:row.dependency_indices.map(i=>subject.targets[i].target_id).sort(),evidence_refs:row.evidence_refs,reason:row.reason});
  }
  return V.sealContract({schema_version:RECEIPT,request,session_id:result.session_id,raw_result:raw,raw_result_sha256:V.sha256(raw),additions});
}
function validateReceipt(receipt,{reviewContext,reviewReport,artifactGraph}={}){
  V.assertExactKeys(receipt,['schema_version','request','session_id','raw_result','raw_result_sha256','additions','contract_hash'],[],'VNEXT_SCOPE_RECEIPT_KEYS');
  if(receipt.schema_version!==RECEIPT)V.fail('VNEXT_SCOPE_RECEIPT_SCHEMA');
  V.verifyContractHash(receipt,'VNEXT_SCOPE_RECEIPT_HASH');
  if(receipt.raw_result_sha256!==V.sha256(receipt.raw_result))V.fail('VNEXT_SCOPE_RAW_HASH');
  const rebuilt=fromRaw(receipt.request,receipt.raw_result);
  if(rebuilt.contract_hash!==receipt.contract_hash)V.fail('VNEXT_SCOPE_RESULT_MISMATCH');
  if(reviewContext){
    const expected=buildRequest({reviewContext,reviewReport,artifactGraph,candidates:receipt.request.requests.map(r=>({finding_id:r.finding_id,target_ids:r.targets.map(t=>t.target_id),reason:r.reason}))});
    if(expected.contract_hash!==receipt.request.contract_hash)V.fail('VNEXT_SCOPE_BASE_MISMATCH');
  }
  return receipt.additions;
}
function schema(){return {type:'object',additionalProperties:false,required:['request_hash','assessments'],properties:{request_hash:{type:'string'},assessments:{type:'array',items:{type:'object',additionalProperties:false,required:['finding_id','dependency_ranges','observed_ranges','evidence_refs','reason'],properties:{finding_id:{type:'string'},dependency_ranges:{type:'array',items:{type:'array',minItems:2,maxItems:2,items:{type:'integer',minimum:0}}},observed_ranges:{type:'array',items:{type:'array',minItems:2,maxItems:2,items:{type:'integer',minimum:0}}},evidence_refs:{type:'array',minItems:1,items:{type:'string',minLength:1}},reason:{type:'string',minLength:1}}}}}};}
function run({produced,baseReceipt,request,cwd,evidenceDirectory,recover=false,claude,invoke}){
  const fs=require('node:fs'),path=require('node:path'),B=require('./vnext-file-bundle'),Chain=require('./vnext-live-chain');
  if(!evidenceDirectory||!path.isAbsolute(evidenceDirectory))V.fail('VNEXT_SCOPE_ABSOLUTE_EVIDENCE_REQUIRED');
  const relative=path.relative(cwd,evidenceDirectory);
  if(!relative||(!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative)))V.fail('VNEXT_REVIEW_EVIDENCE_OUTSIDE_CHECKOUT_REQUIRED');
  const a=Chain.verifyProduced(produced,cwd),report=Chain.verifyReceipt(produced,baseReceipt);
  const graph=require('./revision-contract').buildArtifactGraph(a);
  const rebuilt=buildRequest({reviewContext:a.reviewContext,reviewReport:report,artifactGraph:graph,candidates:request.requests.map(r=>({finding_id:r.finding_id,target_ids:r.targets.map(t=>t.target_id),reason:r.reason}))});
  if(rebuilt.contract_hash!==request.contract_hash)V.fail('VNEXT_SCOPE_BASE_MISMATCH');
  fs.mkdirSync(evidenceDirectory,{recursive:true});
  const response=path.join(evidenceDirectory,'scope-review-response.json');
  if(recover){
    const saved=JSON.parse(fs.readFileSync(response,'utf8'));V.verifyContractHash(saved,'VNEXT_SCOPE_RESPONSE_HASH');
    if(saved.request_hash!==request.contract_hash||saved.process_result.status!==0||saved.process_result.signal||saved.process_result.error_code)V.fail('VNEXT_SCOPE_RESPONSE_BINDING');
    return fromRaw(request,saved.stdout);
  }
  if(fs.existsSync(response)||fs.existsSync(path.join(evidenceDirectory,'scope-review-start.json')))V.fail('VNEXT_SCOPE_ALREADY_STARTED_USE_RECOVERY');
  fs.writeFileSync(path.join(evidenceDirectory,'scope-review-start.json'),JSON.stringify({request_hash:request.contract_hash,started_at:new Date().toISOString()})+'\n',{flag:'wx'});
  const subjects=new Set(request.requests.flatMap(r=>r.targets.map(t=>t.target_id))),objects=[];
  const add=(id,payload)=>{if(subjects.has(id))objects.push({target_id:id,payload});};
  for(const row of a.requirementRegistry.requirements)add(row.requirement_id,row);
  for(const row of a.impactGraph.impacts)add(row.impact_id,row);
  for(const row of a.planContract.plan_items){add(row.plan_item_id,row);for(const t of row.test_obligations)add(t.test_id,t);for(const p of row.proof_obligations)add(p.proof_id,p);}
  for(const c of a.uiAtomicityContract?.criteria||[]){add(c.criterion_id,c);for(const s of c.assertions)add(s.assertion_id,s);}
  if(new Set(objects.map(x=>x.target_id)).size!==subjects.size)V.fail('VNEXT_SCOPE_SUBJECT_MISSING');
  const dossier=path.join(evidenceDirectory,'dossier');fs.mkdirSync(dossier);
  for(const [file,value] of [['request.json',request],['subjects.json',objects],['previous-report.json',report],['sources.json',produced.source_observations]])B.write(path.join(dossier,file),value,{exclusive:true,forceBundle:true,pretty:true});
  fs.writeFileSync(path.join(dossier,'mcp.json'),'{"mcpServers":{}}');fs.writeFileSync(path.join(dossier,'settings.json'),'{"disableAllHooks":true}');
  const input=JSON.stringify({request_hash:request.contract_hash,dossier,instructions:'Complément indépendant de portée causale uniquement, même opération de plan. Lire request.json, subjects.json et les sources exactes via les manifestes file-bundle et leurs feuilles. Le rapport original est immuable. Pour chaque request, sélectionner uniquement les dépendances existantes réellement nécessaires à required_correction ; dependency_ranges sont des plages inclusives [début,fin], triées sans chevauchement, des indices zero-based du tableau targets DE CETTE REQUEST. Attester observed_ranges uniquement pour les cibles effectivement consultées. Citer les chemins sources et donner une justification causale. Ne pas approuver le plan, modifier le dépôt, fermer un finding ou changer une règle produit. Retourner toutes les assessments, avec une liste vide si aucune extension n’est justifiée. La machine n’élargit jamais automatiquement une ancre à ses descendants.'});
  const env={...process.env};for(const k of ['GH_TOKEN','GITHUB_TOKEN','KODJO_LIVE_GH_TOKEN'])delete env[k];
  const snapshot=()=>V.canonicalHash({status:Chain.command('git',['status','--porcelain=v1','-z'],cwd),diff:Chain.command('git',['diff','HEAD','--binary'],cwd),untracked:Chain.command('git',['ls-files','--others','--exclude-standard','-z'],cwd).split('\0').filter(Boolean).map(file=>[file,V.sha256(fs.readFileSync(path.join(cwd,file)))])});
  const before=snapshot();
  const execute=invoke||require('./vnext-review-process').command;
  let archived=false;
  const archive=result=>{if(archived)V.fail('VNEXT_SCOPE_RESPONSE_DUPLICATE');fs.writeFileSync(response,JSON.stringify(V.sealContract({request_hash:request.contract_hash,stdout:result.stdout,process_result:{status:result.status,signal:result.signal||null,error_code:result.error_code||null}}))+'\n',{flag:'wx'});archived=true;};
  try{
    const raw=execute(claude||require('./claude-local').resolveClaudeBinary(),['--add-dir',dossier,'-p','--restricted','--permission-mode','dontAsk','--permission-prompts','none','--output-format','stream-json','--verbose','--tools','Read,Glob,Grep','--allowedTools','Read,Glob,Grep','--disallowedTools','mcp__*','--strict-mcp-config','--mcp-config',path.join(dossier,'mcp.json'),'--settings',path.join(dossier,'settings.json'),'--json-schema',JSON.stringify(schema())],cwd,input,env,2*60*60*1000,{onResult:archive,progressPath:path.join(evidenceDirectory,'scope-review-progress.json')});
    if(!archived)archive({stdout:raw,status:0});
    const saved=JSON.parse(fs.readFileSync(response,'utf8'));
    if(saved.process_result.status!==0||saved.process_result.signal||saved.process_result.error_code)V.fail('VNEXT_SCOPE_PROCESS_FAILED');
    return fromRaw(request,raw);
  }finally{if(snapshot()!==before)V.fail('VNEXT_REVIEW_MUTATED_CHECKOUT');}
}
module.exports={buildRequest,validateRequest,fromRaw,validateReceipt,schema,run};
