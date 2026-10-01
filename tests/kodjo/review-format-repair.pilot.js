'use strict';
// Single format-repair pass of the V2 implementation review (run 36834555574):
// only derived criterion fields may change; every reviewer judgment is frozen.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {verify}=require('../../scripts/kodjo/verify-review-format-repair');

const review=()=>({schema:'s',criteria:[{criterion_id:'UI-1',implementation_status:'CONFORME',preserve_status:'PASS',evidence:'e',
  proof_results:[{proof_type:'VISUAL_COMPARE',status:'PASS',evidence:'v'}],
  assertion_results:[{assertion_id:'UI-1-A1',status:'PENDING_DEVICE',evidence:'a',proof_results:[{proof_type:'VISUAL_COMPARE',status:'PENDING_DEVICE',evidence:'p'}]}]}],
  boundary_results:[{status:'PASS'}],non_ui_plan_assessment:{status:'CONFORME',evidence:'n',requirements:[]}});

test('derived criterion fields may be corrected',()=>{
  const after=review();after.criteria[0].implementation_status='NON_VERIFIABLE';after.criteria[0].proof_results[0].status='PENDING_DEVICE';
  assert.deepEqual(verify(review(),after),['UI-1.implementation_status:CONFORME->NON_VERIFIABLE','UI-1.VISUAL_COMPARE:PASS->PENDING_DEVICE']);
});

test('any reviewer judgment change is refused',()=>{
  for(const mutate of [
    r=>{r.criteria[0].assertion_results[0].status='CONFORME';},
    r=>{r.criteria[0].assertion_results[0].proof_results[0].status='PASS';},
    r=>{r.criteria[0].evidence='other';},
    r=>{r.criteria[0].proof_results[0].evidence='other';},
    r=>{r.criteria[0].preserve_status='FAIL';},
    r=>{r.non_ui_plan_assessment.status='NON_CONFORME';},
    r=>{r.boundary_results[0].status='FAIL';},
    r=>{r.criteria.push({criterion_id:'UI-2'});},
  ]){const after=review();mutate(after);assert.throws(()=>verify(review(),after),/REVIEW_REPAIR_CHANGED_REVIEWER_JUDGMENT/);}
});

test('the workflow repairs only derivation mismatches, once, and revalidates strictly',()=>{
  const wf=fs.readFileSync(path.join(__dirname,'..','..','.github','workflows','kodjo-slice-implementation-review.yml'),'utf8').replace(/\r\n/g,'\n');
  const step=wf.slice(wf.indexOf('- name: Independent OpenAI review — V2 criterion contract'),wf.indexOf('- name: Independent OpenAI review — legacy path unchanged'));
  assert.match(step,/\^UI_IMPLEMENTATION_REVIEW_\(CRITERION\|PROOF\)_DERIVATION_MISMATCH/);
  assert.match(step,/verify-review-format-repair\.js \/tmp\/review-structured-attempt1\.json \/tmp\/review-structured\.json/);
  assert.equal((step.match(/verify-ui-implementation-review\.js "\$\{review_validate\[@\]\}"/g)||[]).length,2);
  assert.equal((step.match(/api\.openai\.com\/v1\/responses/g)||[]).length,2);
});
