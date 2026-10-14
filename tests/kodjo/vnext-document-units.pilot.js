'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../../scripts/kodjo/lib/vnext-figma-launch'),V=require('../../scripts/kodjo/lib/vnext-contract');
function doc({compact=false,crlf=false}={}){
 const states=[{state_id:'A',origin:'DOCUMENT_ONLY',disposition:'REQUIRED',expected:'Escaped "quotes" and {braces}',reason:'explicit',scenarios:[{scenario_id:'A-1',given:'before',when:'act',then:'after',proof_required:['FUNCTIONAL_TEST']}]},{state_id:'B',origin:'DOCUMENT_ONLY',disposition:'CONTEXT_ONLY',expected:'context',reason:'explicit'}];
 let content='Normative prose retained.\n<KODJO_SCREEN_STATES_JSON>\n'+JSON.stringify({schema_version:'kodjo.screen-states.v1',states},null,compact?undefined:2)+'\n</KODJO_SCREEN_STATES_JSON>\n';
 if(crlf)content=content.replace(/\n/g,'\r\n');return {document_id:'DOC',locator:'FULL_FILE',content,fingerprint:V.sha256(content)};
}
test('atomic inventory units retain full bytes as context and state with its scenarios',()=>{
 const d=doc(),units=L.documentUnits(d,true),lines=d.content.split('\n');assert.equal(units.length,3);assert.deepEqual(units[0],{locator:'FULL_FILE',fingerprint:d.fingerprint,disposition:'CONTEXT_ONLY'});
 const m=/L(\d+)-L(\d+)/.exec(units[1].locator),part=lines.slice(+m[1]-1,+m[2]).join('\n');assert.equal(units[1].fingerprint,V.sha256(part));assert.match(part,/A-1/);assert.doesNotMatch(part,/"state_id": "B"/);assert.equal(units[1].disposition,'REQUIREMENT_SOURCE');assert.equal(units[2].disposition,'CONTEXT_ONLY');
});
test('atomic line hashes accept CRLF without changing frozen full document hash',()=>{const a=doc(),b=doc({crlf:true});assert.notEqual(a.fingerprint,b.fingerprint);assert.deepEqual(L.documentUnits(a,true).slice(1),L.documentUnits(b,true).slice(1));});
test('historical FULL_FILE requirement checkpoint keeps original projection',()=>{const d=doc();assert.deepEqual(L.documentUnits(d,false),[{locator:'FULL_FILE',fingerprint:d.fingerprint,disposition:'REQUIREMENT_SOURCE'}]);});
test('same-line inventory states fail closed rather than claim atomicity',()=>assert.throws(()=>L.documentUnits(doc({compact:true}),true),/NON_ATOMIC_LINES/));
