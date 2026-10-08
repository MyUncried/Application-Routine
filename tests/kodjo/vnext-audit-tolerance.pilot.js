'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const Block=require('../../scripts/kodjo/lib/machine-block');
function tagged(tag,value){return '<'+tag+'>'+JSON.stringify(value)+'</'+tag+'>';}
test('IA-003 identical block duplicates are tolerated; conflicting or malformed blocks are refused',()=>{
 const a=tagged('KODJO_TARGETED_VALIDATION_JSON',{a:1,b:2});
 assert.deepEqual(Block.parse(a+a,'KODJO_TARGETED_VALIDATION_JSON'),{a:1,b:2});
 assert.deepEqual(Block.parse(a+tagged('KODJO_TARGETED_VALIDATION_JSON',{b:2,a:1}),'KODJO_TARGETED_VALIDATION_JSON'),{a:1,b:2});
 for(const value of [null,1,'text']) assert.throws(()=>Block.parse(tagged('KODJO_TARGETED_VALIDATION_JSON',value),'KODJO_TARGETED_VALIDATION_JSON'),/INVALID/);
 for(const suffix of [tagged('KODJO_TARGETED_VALIDATION_JSON',{a:2}),'<KODJO_TARGETED_VALIDATION_JSON>','</KODJO_TARGETED_VALIDATION_JSON>']) assert.throws(()=>Block.parse(a+suffix,'KODJO_TARGETED_VALIDATION_JSON'),/INVALID/);
 assert.equal(Block.parse('unrelated','TAG',{required:false}),null);
});
test('IA-003 global requalification rejects foreign decoy before slice filtering',()=>{
 const verify=require('../../scripts/kodjo/verify-global-requalification-state').verify;
 const proof={slice_id:'PRE-3',application_pr:7,plan_blob_oid:'same'};
 const body='[KODJO_V2] TARGETED_VALIDATION_OUTPUT\n'+tagged('KODJO_TARGETED_VALIDATION_JSON',{...proof,slice_id:'FOREIGN'})+tagged('KODJO_TARGETED_VALIDATION_JSON',proof);
 assert.throws(()=>verify({final_status:'READY_TO_CLOSE',review_mode:'CRITERION_COMPLETE',slice_id:'PRE-3',application_pr:7,plan_blob_oid:'same'},[{user:{login:'github-actions[bot]'},body}]),/CONFLICTING_BLOCKS/);
});
test('IA-003 stable final consumer tolerates identical duplicate and refuses conflict',()=>{
 const parse=require('../../scripts/kodjo/resolve-stable-environment-sync').taggedFinal;
 const header='[KODJO_SLICE] FINAL_OUTPUT\nSTATUT : READY_TO_CLOSE\n';const block=tagged('KODJO_UI_FINAL_VERIFICATION_JSON',{head:'a'});
 assert.equal(parse(header+block+block).meta.head,'a');
 assert.throws(()=>parse(header+block+tagged('KODJO_UI_FINAL_VERIFICATION_JSON',{head:'b'})),/CONFLICTING_BLOCKS/);
});
test('IA-002 governing VNext corpus is present, unique and classified normative',()=>{
 const manifest=JSON.parse(fs.readFileSync('.github/orchestration/normative-inputs.json','utf8'));
 const classify=require('../../scripts/kodjo/classify-protocol-impact').classifyPath;
 for(const name of ['KODJO_PROTOCOL_VNEXT_SPEC.md','KODJO_VNEXT_ANTI_REGRESSION_MATRIX.md','KODJO_VNEXT_HISTORICAL_DISPOSITION.json','KODJO_VNEXT_HISTORICAL_EQUIVALENCE.json','KODJO_VNEXT_REMOTE_WRITE_POLICY.json']){
 const file='.github/orchestration/'+name;assert.ok(fs.existsSync(file));assert.equal(manifest.files.filter(x=>x===file).length,1);assert.equal(classify(file),'NORMATIVE_PROTOCOL_CHANGE');}
 const text=fs.readFileSync('.github/orchestration/PACKAGE_MANIFEST.md','utf8');assert.equal(text.split('## Dépendances conservées pour l’intégration VNext').length-1,1);
});

test('real-review gate refuses failed or wrong-head qualification without invoking a reviewer',async()=>{
 const wait=require('../../scripts/kodjo/wait-vnext-audit-qualification').wait;
 const head='a'.repeat(40),repository='MyUncried/Application-Routine';
 await assert.rejects(wait({head,repository,timeoutMs:10,read:()=>({workflow_runs:[{id:99,path:'.github/workflows/kodjo-vnext-proof-stability.yml',head_sha:head,status:'completed',conclusion:'failure'}]})}),/QUALIFICATION_FAILED/);
});
