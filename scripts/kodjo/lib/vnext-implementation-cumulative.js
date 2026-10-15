'use strict';
// One immutable implementation dossier; raw scoped responses remain independent evidence.
const V=require('./vnext-contract');
const LIMIT=require('./vnext-cumulative-review').MAX_DIRECT_TARGETS;
function catalog(d,ledger=null){
 const links=d.component_review?.plan.inheritance_links||[],conditional=new Set(links.map(r=>r.assertion_id));
 const qualified=new Set((d.qualified_common_imports||[]).flatMap(q=>q.imported_common_assertions.map(x=>x.assertion_id)));
 const mismatched=new Set((ledger?.records||[]).flatMap(r=>r.assessment.component_mapping_observations||[]).filter(r=>r.status==='MISMATCH').map(r=>r.criterion_id));
 for(const id of [...qualified])if(links.some(l=>l.common_assertion_id===id&&mismatched.has(l.common_criterion_id)))qualified.delete(id);
 const direct=d.assertion_ids.filter(id=>!qualified.has(id)&&(!conditional.has(id)||links.some(r=>r.assertion_id===id&&(mismatched.has(r.instance_criterion_id)||mismatched.has(r.common_criterion_id)))));
 return [...direct.map(id=>'ASSERTION:'+id),...d.scenario_ids.map(id=>'SCENARIO:'+id),...(d.preservation_ids||[]).map(id=>'PRESERVATION:'+id),...(d.component_review?.mapping_facts||[]).map(x=>'MAPPING:'+x.criterion_id)];
}
const hash=d=>V.canonicalHash({plan:d.approved_plan_sha256,delivery:d.delivery_head,assertions:d.assertion_ids,scenarios:d.scenario_ids,preservation:d.preservation_ids||[],references:d.observation.references.map(x=>x.reference_hash),facts:d.measurements,scenario_results:d.scenario_results,component_signature:d.component_review?.signature||null,...(d.qualified_common_imports?.length?{qualified_imports:d.qualified_common_imports.map(q=>q.contract_hash)}:{})});
const eq=(a,b,code)=>{if(V.canonicalHash(a)!==V.canonicalHash(b))throw Error(code);};
function scope(d,ledger=null,{capacity=LIMIT}={}){
 if(ledger)verify(d,ledger);if(!Number.isSafeInteger(capacity)||capacity<1||capacity>LIMIT)throw Error('IMPLEMENTATION_REVIEW_CAPACITY');
 const done=new Set(ledger?.reviewed_targets||[]),ids=catalog(d,ledger).filter(id=>!done.has(id));if(!ids.length)return null;
 return V.sealContract({schema_version:'kodjo.vnext.implementation-review-scope.v1',dossier_hash:hash(d),previous_ledger_hash:ledger?.contract_hash||null,capacity:ledger?.capacity||capacity,target_ids:ids.slice(0,ledger?.capacity||capacity)});
}
function record(d,s,raw,process){
 V.assertExactKeys(s,['schema_version','dossier_hash','previous_ledger_hash','capacity','target_ids','contract_hash'],[],'IMPLEMENTATION_REVIEW_SCOPE_KEYS');V.verifyContractHash(s);
 const allowed=new Set([...d.assertion_ids.map(id=>'ASSERTION:'+id),...catalog(d)]);
 if(s.dossier_hash!==hash(d)||s.schema_version!=='kodjo.vnext.implementation-review-scope.v1'||!Number.isSafeInteger(s.capacity)||s.capacity<1||s.capacity>LIMIT||s.target_ids.length>s.capacity||new Set(s.target_ids).size!==s.target_ids.length||s.target_ids.some(id=>!allowed.has(id)))throw Error('IMPLEMENTATION_REVIEW_SCOPE_CHANGED');
 V.verifyContractHash(process);if(process.status!==0||process.signal||process.error_code||process.stdout_sha256!==V.sha256(raw))throw Error('IMPLEMENTATION_REVIEW_PROCESS_UNVERIFIED');
 const response=JSON.parse(raw),a=response.structured_output;
 if(response.type!=='result'||response.is_error||typeof response.session_id!=='string'||!response.session_id||a?.verdict!=='REVIEW_INCOMPLETE')throw Error('IMPLEMENTATION_PARTIAL_NOT_APPROVAL');
 V.assertExactKeys(a,['verdict','reference_hashes','reviewed_assertion_ids','reviewed_scenario_ids','findings','reservations','reason'],['reviewed_preservation_ids','component_mapping_observations'],'IMPLEMENTATION_PARTIAL_KEYS');
 V.assertUnicodeExactText(a.reason,'IMPLEMENTATION_PARTIAL_REASON');
 eq(a.reference_hashes.slice().sort(),d.observation.references.map(x=>x.reference_hash).sort(),'IMPLEMENTATION_PARTIAL_REFERENCES');
 for(const rows of [a.findings,a.reservations])if(!Array.isArray(rows))throw Error('IMPLEMENTATION_PARTIAL_FINDINGS');
 for(const f of a.findings){V.assertExactKeys(f,['blocking','reason'],[],'IMPLEMENTATION_PARTIAL_FINDING_KEYS');if(typeof f.blocking!=='boolean')throw Error('IMPLEMENTATION_PARTIAL_FINDING');V.assertUnicodeExactText(f.reason,'IMPLEMENTATION_PARTIAL_FINDING');}
 for(const r of a.reservations)V.assertUnicodeExactText(r,'IMPLEMENTATION_PARTIAL_RESERVATION');
 const ids=[...a.reviewed_assertion_ids.map(id=>'ASSERTION:'+id),...a.reviewed_scenario_ids.map(id=>'SCENARIO:'+id),...(a.reviewed_preservation_ids||[]).map(id=>'PRESERVATION:'+id),...(a.component_mapping_observations||[]).map(x=>'MAPPING:'+x.criterion_id)];
 if(!ids.length||new Set(ids).size!==ids.length||ids.some(id=>!s.target_ids.includes(id)))throw Error('IMPLEMENTATION_PARTIAL_SCOPE_OR_PROGRESS');
 for(const m of a.component_mapping_observations||[]){const fact=d.component_review?.mapping_facts.find(x=>x.criterion_id===m.criterion_id);V.assertExactKeys(m,['criterion_id','status','observed_files','reason'],[],'IMPLEMENTATION_MAPPING_KEYS');if(!fact||!['MATCH','MISMATCH'].includes(m.status))throw Error('IMPLEMENTATION_MAPPING_INVALID');V.assertUnicodeExactText(m.reason,'IMPLEMENTATION_MAPPING_REASON');eq(m.observed_files.slice().sort((a,b)=>a.path.localeCompare(b.path)),fact.files.map(({materialized_path,...x})=>x).sort((a,b)=>a.path.localeCompare(b.path)),'IMPLEMENTATION_MAPPING_FACTS_CHANGED');}
 return V.sealContract({schema_version:'kodjo.vnext.partial-implementation-review.v1',dossier_hash:hash(d),scope:s,session_id:response.session_id,raw_response:raw,process,assessment:a,reviewed_targets:ids.sort(),status:'REVIEW_INCOMPLETE'});
}
function append(d,ledger,receipt){
 if(ledger)verify(d,ledger);eq(record(d,receipt.scope,receipt.raw_response,receipt.process),receipt,'IMPLEMENTATION_PARTIAL_CHANGED');
 if(ledger?.records.some(r=>r.contract_hash===receipt.contract_hash))return ledger;
 eq(scope(d,ledger,{capacity:receipt.scope.capacity}),receipt.scope,'IMPLEMENTATION_SCOPE_ORDER');
 return project(d,[...(ledger?.records||[]),receipt]);
}
function project(d,records){return V.sealContract({schema_version:'kodjo.vnext.implementation-review-ledger.v1',dossier_hash:hash(d),capacity:records[0]?.scope.capacity||LIMIT,records,reviewed_targets:[...new Set(records.flatMap(r=>r.reviewed_targets))].sort(),status:'PARTIAL_NOT_APPROVED'});}
function verify(d,ledger){V.verifyContractHash(ledger);if(ledger.schema_version!=='kodjo.vnext.implementation-review-ledger.v1'||ledger.dossier_hash!==hash(d))throw Error('IMPLEMENTATION_LEDGER_STALE');let prior=null;for(const r of ledger.records){eq(record(d,r.scope,r.raw_response,r.process),r,'IMPLEMENTATION_PARTIAL_CHANGED');eq(scopeUnchecked(d,prior,r.scope.capacity),r.scope,'IMPLEMENTATION_SCOPE_ORDER');const next=project(d,[...(prior?.records||[]),r]);if(next.reviewed_targets.length===(prior?.reviewed_targets.length||0))throw Error('IMPLEMENTATION_NO_PROGRESS');prior=next;}eq(prior||project(d,[]),ledger,'IMPLEMENTATION_LEDGER_CHANGED');return ledger;}
function scopeUnchecked(d,ledger,capacity){const done=new Set(ledger?.reviewed_targets||[]);return V.sealContract({schema_version:'kodjo.vnext.implementation-review-scope.v1',dossier_hash:hash(d),previous_ledger_hash:ledger?.contract_hash||null,capacity:ledger?.capacity||capacity,target_ids:catalog(d,ledger).filter(id=>!done.has(id)).slice(0,ledger?.capacity||capacity)});}
function aggregate(d,ledger){
 verify(d,ledger);eq(ledger.reviewed_targets,catalog(d,ledger).slice().sort(),'IMPLEMENTATION_CUMULATIVE_INCOMPLETE');
 const unique=(field,key)=>{const m=new Map();for(const r of ledger.records.flatMap(r=>r.assessment[field]||[])){const k=key(r);if(m.has(k))eq(m.get(k),r,'IMPLEMENTATION_OBSERVATION_CONFLICT');else m.set(k,r);}return [...m.values()];};
 const findings=unique('findings',V.canonicalHash),reservations=unique('reservations',x=>x),mappings=unique('component_mapping_observations',x=>x.criterion_id);
 const reviewed=ledger.reviewed_targets.filter(x=>x.startsWith('ASSERTION:')).map(x=>x.slice(10));
 const assessment={verdict:findings.some(f=>f.blocking)||mappings.some(m=>m.status==='MISMATCH')?'REVISE':'APPROVE',reference_hashes:d.observation.references.map(x=>x.reference_hash),reviewed_assertion_ids:reviewed,reviewed_scenario_ids:d.scenario_ids,reviewed_preservation_ids:d.preservation_ids||[],findings,reservations,reason:'Derived from all verified scoped implementation responses; no additional model call.',...(d.component_review?{component_mapping_observations:mappings}:{})};
 require('./vnext-figma-implementation-review').validateAssessment(d,assessment);
 return V.sealContract({schema_version:'kodjo.vnext.cumulative-implementation-review.v1',dossier_hash:hash(d),approved_plan_sha256:d.approved_plan_sha256,delivery_head:d.delivery_head,ledger,session_ids:[...new Set(ledger.records.map(r=>r.session_id))].sort(),assessment});
}
module.exports={LIMIT,catalog,hash,scope,record,append,verify,aggregate};
