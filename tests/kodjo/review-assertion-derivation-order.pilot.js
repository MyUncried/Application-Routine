'use strict';
// Regression for implementation review run 36850540673: a STATIC_ANALYSIS FAIL listed after a
// NON_VERIFIABLE FUNCTIONAL_TEST was derived NON_VERIFIABLE instead of NON_CONFORME.
// The documented precedence (any FAIL => NON_CONFORME) must not depend on proof order.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','..','scripts','kodjo','verify-ui-implementation-review.js'),'utf8');
const start=source.indexOf('function deriveAssertionStatus(');
const end=source.indexOf('\nfunction ',start+1);
const ctx={BLOCKING_PROOFS:new Set(['FUNCTIONAL_TEST','STATIC_ANALYSIS']),
  validateProof:(id,p)=>({type:p.proof_type,status:p.status}),enforceMachineProof:()=>{}};
vm.createContext(ctx);
vm.runInContext(source.slice(start,end)+'\nthis.derive=deriveAssertionStatus;',ctx);
const derive=(proofs)=>ctx.derive({},{assertion_id:'A'},proofs.map(([proof_type,status])=>({proof_type,status})));

test('any FAIL wins regardless of proof order',()=>{
  assert.equal(derive([['FUNCTIONAL_TEST','NON_VERIFIABLE'],['STATIC_ANALYSIS','FAIL'],['VISUAL_COMPARE','PENDING_DEVICE']]),'NON_CONFORME');
  assert.equal(derive([['STATIC_ANALYSIS','FAIL'],['FUNCTIONAL_TEST','NON_VERIFIABLE']]),'NON_CONFORME');
  assert.equal(derive([['VISUAL_COMPARE','PENDING_DEVICE'],['DEVICE_CHECK','FAIL']]),'NON_CONFORME');
});

test('remaining precedence is unchanged',()=>{
  assert.equal(derive([['FUNCTIONAL_TEST','NON_VERIFIABLE'],['VISUAL_COMPARE','PENDING_DEVICE']]),'NON_VERIFIABLE');
  assert.equal(derive([['VISUAL_COMPARE','PENDING_DEVICE'],['STATIC_ANALYSIS','NON_VERIFIABLE']]),'NON_VERIFIABLE');
  assert.equal(derive([['ACCESSIBILITY_CHECK','NON_VERIFIABLE']]),'NON_VERIFIABLE');
  assert.equal(derive([['FUNCTIONAL_TEST','PASS'],['VISUAL_COMPARE','PENDING_DEVICE']]),'PENDING_DEVICE');
  assert.equal(derive([['FUNCTIONAL_TEST','PASS'],['STATIC_ANALYSIS','PASS']]),'CONFORME');
});
