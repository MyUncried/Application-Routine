'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
const verifier = path.join(root, 'scripts', 'kodjo', 'verify-implementation-plan-gate.js');
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();

function write(file, value) { fs.writeFileSync(file, JSON.stringify(value), 'utf8'); }
function fixture({ reviewVerdict='APPROVE', reviewStatus='PLAN_REVIEW_APPROVED', gateReviewId='102' }={}) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-impl-gate-'));
  const planBody='[KODJO_V2] PLAN_OUTPUT\nslice_id=V2-X\nsource_head='+head+'\nplanning_contract=kodjo.plan-impact.v1\nSTATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW\n\n<KODJO_PLAN_IMPACT_JSON>\n{}\n</KODJO_PLAN_IMPACT_JSON>\n';
  const plan={id:101,user:{login:'github-actions[bot]'},body:planBody};
  const review={id:102,user:{login:'github-actions[bot]'},body:`[KODJO_V2] PLAN_REVIEW_OUTPUT\nslice_id=V2-X\nsource_head=${head}\nsource_plan_comment_id=101\nverdict=${reviewVerdict}\nSTATUT : ${reviewStatus}\n`};
  const gate={id:103,user:{login:'MyUncried'},body:`[KODJO_V2] USER_IMPLEMENTATION_APPROVED\nslice_id=V2-X\nsource_head=${head}\nsource_plan_comment_id=101\nsource_review_comment_id=${gateReviewId}\n`};
  const planFile=path.join(dir,'plan.json'); const reviewFile=path.join(dir,'review.json'); const gateFile=path.join(dir,'gate.json');
  write(planFile,plan); write(reviewFile,review); write(gateFile,gate);
  const fakeImpact=path.join(dir,'impact.js');
  fs.writeFileSync(fakeImpact,"const fs=require('node:fs');fs.writeFileSync(process.argv[4],'{}');fs.writeFileSync(process.argv[5],JSON.stringify({status:'MATCH'}));",'utf8');
  const fakeContract=path.join(dir,'contract.js');
  fs.writeFileSync(fakeContract,"const fs=require('node:fs');fs.writeFileSync(process.argv[5],JSON.stringify({schema:'kodjo.plan-contract-consistency.v2',contract_version:2}));",'utf8');
  return {dir,planFile,reviewFile,gateFile,fakeImpact,fakeContract,output:path.join(dir,'proof.json')};
}
function run(f) {
  return spawnSync(process.execPath,[verifier,f.planFile,f.reviewFile,f.gateFile,'V2-X',head,'150',root,f.fakeContract,f.fakeImpact,head,f.output],{cwd:root,encoding:'utf8'});
}

test('implementation gate: plan, revue approuvée et gate utilisateur liés passent',()=>{
  const f=fixture(); const result=run(f);
  assert.equal(result.status,0,result.stderr);
  const proof=JSON.parse(fs.readFileSync(f.output,'utf8'));
  assert.equal(proof.schema,'kodjo.implementation-plan-gate.v1');
  assert.equal(proof.status,'PASS');
  assert.equal(proof.plan_comment_id,101);
  assert.equal(proof.review_comment_id,102);
  assert.equal(proof.user_gate_comment_id,103);
});

test('implementation gate: une revue non approuvée est refusée',()=>{
  const f=fixture({reviewVerdict:'REVISE',reviewStatus:'PLAN_REVISION_REQUIRED'}); const result=run(f);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/IMPLEMENTATION_REVIEW_NOT_APPROVED/);
});

test('implementation gate: le gate utilisateur doit viser exactement la revue approuvée',()=>{
  const f=fixture({gateReviewId:'999'}); const result=run(f);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/IMPLEMENTATION_USER_GATE_REVIEW_LINK_MISMATCH/);
});
