'use strict';
// Regression for implementation review run 36833751887: the reviewer returned
// PARTIELLEMENT_CONFORME for a criterion whose assertions derive NON_VERIFIABLE, because
// the prompt did not state the mechanical mapping enforced by the validator.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','..');
const wf=fs.readFileSync(path.join(root,'.github','workflows','kodjo-slice-implementation-review.yml'),'utf8');
const validator=fs.readFileSync(path.join(root,'scripts','kodjo','verify-ui-implementation-review.js'),'utf8');

test('the reviewer prompt states the exact criterion derivation enforced by the validator',()=>{
  assert.match(wf,/any NON_CONFORME assertion => NON_CONFORME; otherwise any NON_VERIFIABLE or PENDING_DEVICE assertion => NON_VERIFIABLE; otherwise CONFORME\. PARTIELLEMENT_CONFORME is never valid when assertion_mode=true\./);
  assert.match(validator,/let criterionStatus='CONFORME';\s*if\(assertionStatuses\.includes\('NON_CONFORME'\)\)criterionStatus='NON_CONFORME';\s*else if\(assertionStatuses\.includes\('NON_VERIFIABLE'\)\|\|assertionStatuses\.includes\('PENDING_DEVICE'\)\)criterionStatus='NON_VERIFIABLE';/);
});
