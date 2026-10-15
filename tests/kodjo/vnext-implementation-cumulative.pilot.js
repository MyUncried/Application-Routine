'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),V=require('../../scripts/kodjo/lib/vnext-contract'),C=require('../../scripts/kodjo/lib/vnext-implementation-cumulative');
function dossier(){return {approved_plan_sha256:'a'.repeat(64),delivery_head:'b'.repeat(40),assertion_ids:['A1','A2'],scenario_ids:['S1'],preservation_ids:['P1'],observation:{references:[{reference_hash:'c'.repeat(64)}]},measurements:[],scenario_results:[]};}
function record(d,s,patch={}){const choose=prefix=>s.target_ids.filter(x=>x.startsWith(prefix)).map(x=>x.slice(prefix.length));const a={verdict:'REVIEW_INCOMPLETE',reference_hashes:['c'.repeat(64)],reviewed_assertion_ids:choose('ASSERTION:'),reviewed_scenario_ids:choose('SCENARIO:'),reviewed_preservation_ids:choose('PRESERVATION:'),findings:[],reservations:[],reason:'TEST ONLY scoped observations',...patch};const raw=JSON.stringify({type:'result',is_error:false,session_id:'TEST-'+s.contract_hash,structured_output:a});return C.record(d,s,raw,V.sealContract({status:0,signal:null,error_code:null,stdout_sha256:V.sha256(raw)}));}
test('two scoped implementation reviews preserve raw sessions and aggregate without another reviewer',()=>{
 const d=dossier(),s=C.scope(d,null,{capacity:2}),r=record(d,s);let ledger=C.append(d,null,r);assert.equal(r.status,'REVIEW_INCOMPLETE');assert.equal(C.append(d,ledger,r).contract_hash,ledger.contract_hash);assert.throws(()=>C.aggregate(d,ledger),/INCOMPLETE/);
 const next=C.scope(d,ledger);ledger=C.append(d,ledger,record(d,next));assert.equal(C.scope(d,ledger),null);const complete=C.aggregate(d,ledger);assert.equal(complete.assessment.verdict,'APPROVE');assert.equal(complete.session_ids.length,2);assert.equal(complete.session_id,undefined);assert.equal(complete.ledger.records[0].raw_response,r.raw_response);C.verify(d,ledger);
});
test('a partial implementation response cannot claim approval, exceed scope or lose preservation coverage',()=>{
 const d=dossier(),s=C.scope(d,null,{capacity:2});assert.throws(()=>record(d,s,{verdict:'APPROVE'}),/NOT_APPROVAL/);assert.throws(()=>record(d,s,{reviewed_assertion_ids:['FOREIGN']}),/SCOPE/);let ledger=C.append(d,null,record(d,s));const next=C.scope(d,ledger);ledger=C.append(d,ledger,record(d,next,{reviewed_preservation_ids:[]}));assert.throws(()=>C.aggregate(d,ledger),/INCOMPLETE/);
});
test('changed source, altered process, duplicate direct targets and reordered ledgers are refused',()=>{
 const d=dossier(),s=C.scope(d,null,{capacity:1}),r=record(d,s),ledger=C.append(d,null,r);assert.throws(()=>C.verify({...d,delivery_head:'d'.repeat(40)},ledger),/STALE/);assert.throws(()=>record(d,s,{reviewed_assertion_ids:['A1','A1']}),/SCOPE/);
 const bad=V.sealContract({status:1,signal:null,error_code:null,stdout_sha256:V.sha256(r.raw_response)});assert.throws(()=>C.record(d,s,r.raw_response,bad),/PROCESS/);const s2=C.scope(d,ledger),r2=record(d,s2);assert.throws(()=>C.append(d,null,r2),/ORDER/);
});
test('observed blocking findings survive the cumulative verdict',()=>{
 const d=dossier(),s=C.scope(d,null,{capacity:4}),r=record(d,s,{findings:[{blocking:true,reason:'TEST ONLY actual scope defect'}]}),l=C.append(d,null,r);assert.equal(C.aggregate(d,l).assessment.verdict,'REVISE');
});
