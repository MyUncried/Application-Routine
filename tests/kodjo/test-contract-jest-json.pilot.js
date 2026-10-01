'use strict';
// Regression for implementation review run 36832810388: `jest --json` exposes per-file
// assertionResults only, so every test-contract binding stayed NON_VERIFIABLE.
const test=require('node:test');
const assert=require('node:assert/strict');
const {testCounts}=require('../../scripts/kodjo/verify-test-contract-results');

const a=(status)=>({status,title:'t'});

test('counts are derived from jest --json assertionResults',()=>{
  assert.deepEqual(testCounts({status:'passed',assertionResults:[a('passed'),a('passed'),a('pending'),a('todo')]}),{passing:2,failing:0,pending:2});
  assert.deepEqual(testCounts({status:'failed',assertionResults:[a('passed'),a('failed')]}),{passing:1,failing:1,pending:0});
  assert.deepEqual(testCounts({status:'passed',assertionResults:[]}),{passing:0,failing:0,pending:0});
  assert.deepEqual(testCounts({status:'passed'}),{passing:0,failing:0,pending:0});
});

test('aggregated counters keep precedence when present',()=>{
  assert.deepEqual(testCounts({numPassingTests:3,numFailingTests:0,numPendingTests:1,assertionResults:[a('failed')]}),{passing:3,failing:0,pending:1});
});
