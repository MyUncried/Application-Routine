'use strict';
// Deterministic non-UI coverage repair (run 36867721125): only extra rows duplicating a UI-bound
// requirement judged CONFORME may be removed; every other deviation keeps the review rejected.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {repair}=require('../../scripts/kodjo/repair-review-nonui-coverage');

const input={non_ui_requirements:[{requirement_id:'REQ-N1'},{requirement_id:'REQ-N2'}],criteria:[{criterion_id:'UI-1',requirement_id:'REQ-U1'}]};
const row=(id,status='CONFORME',proof='PASS')=>({requirement_id:id,status,evidence:'e',proof_results:[{proof_type:'FUNCTIONAL_TEST',status:proof,evidence:'p'}]});
const review=rows=>({criteria:[{criterion_id:'UI-1'}],non_ui_plan_assessment:{status:'CONFORME',evidence:'n',requirements:rows}});

test('removes only a CONFORME duplicate of a UI-bound requirement and keeps everything else',()=>{
  const before=review([row('REQ-N1'),row('REQ-U1'),row('REQ-N2','NON_VERIFIABLE','NON_VERIFIABLE')]);
  const {review:after,removed}=repair(input,before);
  assert.deepEqual(removed,['REQ-U1']);
  assert.deepEqual(after.non_ui_plan_assessment.requirements,[before.non_ui_plan_assessment.requirements[0],before.non_ui_plan_assessment.requirements[2]]);
  assert.deepEqual(after.criteria,before.criteria);
  assert.equal(after.non_ui_plan_assessment.status,'CONFORME');
});

test('every other coverage deviation stays rejected',()=>{
  assert.throws(()=>repair(input,review([row('REQ-N1')])),/MISSING_REQUIREMENT/);
  assert.throws(()=>repair(input,review([row('REQ-N1'),row('REQ-N2'),row('REQ-N1')])),/DUPLICATE_ROW/);
  assert.throws(()=>repair(input,review([row('REQ-N1'),row('REQ-N2'),row('REQ-X')])),/EXTRA_NOT_UI_BOUND/);
  assert.throws(()=>repair(input,review([row('REQ-N1'),row('REQ-N2'),row('REQ-U1','NON_CONFORME')])),/EXTRA_CARRIES_SIGNAL/);
  assert.throws(()=>repair(input,review([row('REQ-N1'),row('REQ-N2'),row('REQ-U1','CONFORME','FAIL')])),/EXTRA_CARRIES_SIGNAL/);
  assert.throws(()=>repair(input,review([row('REQ-N1'),row('REQ-N2')])),/NOTHING_TO_REMOVE/);
});

test('the workflow applies this repair only on a coverage mismatch, then revalidates strictly',()=>{
  const wf=fs.readFileSync(path.join(__dirname,'..','..','.github','workflows','kodjo-slice-implementation-review.yml'),'utf8').replace(/\r\n/g,'\n');
  const step=wf.slice(wf.indexOf('- name: Independent OpenAI review — V2 criterion contract'),wf.indexOf('- name: Independent OpenAI review — legacy path unchanged'));
  assert.match(step,/grep -qE '\^NON_UI_REQUIREMENT_COVERAGE_MISMATCH' "\$validate_err"/);
  assert.match(step,/repair-review-nonui-coverage\.js \/tmp\/ui-implementation-review-input\.json \/tmp\/review-structured-coverage\.json \/tmp\/review-structured\.json/);
  assert.match(wf,/scripts\/kodjo\/repair-review-nonui-coverage\.js "\$runtime\/"/);
});
