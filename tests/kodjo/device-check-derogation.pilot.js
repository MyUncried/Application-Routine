'use strict';
// Nominative DEVICE_CHECK derogation decided by Hermann for V2-PRE-1 (REQ-B89A1B7A4F23FA8B):
// the derogated requirement stops blocking only when its sole gap is the non-executed device
// check; the derogation is recorded as NOT_EXECUTED and never as satisfied.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..','..');
const source=fs.readFileSync(path.join(root,'scripts','kodjo','verify-ui-implementation-review.js'),'utf8');
const pick=(name)=>{const s=source.indexOf('function '+name+'(');return source.slice(s,source.indexOf('\nfunction ',s+1));};
const ctx={fs,path,process:{env:{}},fail:(c,d)=>{throw new Error(c+(d?': '+d:''));}};
vm.createContext(ctx);
vm.runInContext(pick('loadDeviceCheckDerogations')+'\n'+pick('deviceCheckOnlyGap')+'\nthis.load=loadDeviceCheckDerogations;this.gap=deviceCheckOnlyGap;',ctx);

const file=path.join(root,'.github','orchestration','v2-slices','V2-PRE-1','device-check-derogation.json');
const input={non_ui_requirements:[{requirement_id:'REQ-B89A1B7A4F23FA8B',proof_required:['STATIC_ANALYSIS','DEVICE_CHECK']},{requirement_id:'REQ-OTHER',proof_required:['FUNCTIONAL_TEST']}]};
const row=(status,stat,dev)=>({requirement_id:'REQ-B89A1B7A4F23FA8B',status,proof_results:[{proof_type:'STATIC_ANALYSIS',status:stat},{proof_type:'DEVICE_CHECK',status:dev}]});

test('the versioned PRE-1 derogation is nominative, NOT_EXECUTED and not satisfied by VISUAL_APPROVED',()=>{
  ctx.process.env={KODJO_DEVICE_CHECK_DEROGATION_FILE:file,SLICE_ID:'V2-PRE-1'};
  const m=ctx.load(input);
  assert.deepEqual(JSON.parse(JSON.stringify([...m.keys()])),['REQ-B89A1B7A4F23FA8B']);
  const d=m.get('REQ-B89A1B7A4F23FA8B');
  assert.equal(d.status,'NOT_EXECUTED');assert.equal(d.proof_type,'DEVICE_CHECK');assert.equal(d.decided_by,'MyUncried');
  assert.deepEqual(JSON.parse(JSON.stringify(d.not_satisfied_by)),['VISUAL_APPROVED']);assert.ok(d.residual_risk.length>40);
  ctx.process.env={KODJO_DEVICE_CHECK_DEROGATION_FILE:file,SLICE_ID:'V2-OTHER'};
  assert.throws(()=>ctx.load(input),/SLICE_MISMATCH/);
  ctx.process.env={};
  assert.equal(ctx.load(input).size,0);
});

test('only a device-check-only gap is waived; any other gap still blocks',()=>{
  assert.equal(ctx.gap(row('NON_VERIFIABLE','PASS','PENDING_DEVICE')),true);
  assert.equal(ctx.gap(row('NON_CONFORME','PASS','PENDING_DEVICE')),false);
  assert.equal(ctx.gap(row('NON_VERIFIABLE','NON_VERIFIABLE','PENDING_DEVICE')),false);
  assert.equal(ctx.gap(row('NON_VERIFIABLE','FAIL','PENDING_DEVICE')),false);
  assert.equal(ctx.gap(row('NON_VERIFIABLE','PASS','FAIL')),false);
  assert.equal(ctx.gap(row('NON_VERIFIABLE','PASS','PASS')),false);
});

test('a derogation for an unknown requirement or another proof type is refused',()=>{
  const tmp=path.join(require('node:os').tmpdir(),'derog-'+process.pid+'.json');
  try{
    fs.writeFileSync(tmp,JSON.stringify({schema:'kodjo.device-check-derogation.v1',slice_id:'V2-PRE-1',derogations:[{requirement_id:'REQ-OTHER',proof_type:'DEVICE_CHECK',status:'NOT_EXECUTED',decided_by:'x',decision:'d',residual_risk:'r'}]}));
    ctx.process.env={KODJO_DEVICE_CHECK_DEROGATION_FILE:tmp};
    assert.throws(()=>ctx.load(input),/PROOF_INVALID/);
    fs.writeFileSync(tmp,JSON.stringify({schema:'kodjo.device-check-derogation.v1',slice_id:'V2-PRE-1',derogations:[{requirement_id:'REQ-NONE',proof_type:'DEVICE_CHECK',status:'NOT_EXECUTED',decided_by:'x',decision:'d',residual_risk:'r'}]}));
    assert.throws(()=>ctx.load(input),/UNKNOWN_REQUIREMENT/);
  }finally{fs.rmSync(tmp,{force:true});}
});

test('the workflow freezes the slice derogation, informs the reviewer and passes it to every validation',()=>{
  const wf=fs.readFileSync(path.join(root,'.github','workflows','kodjo-slice-implementation-review.yml'),'utf8');
  assert.match(wf,/v2-slices\/\$\{\{ steps\.gate\.outputs\.slice_id \}\}\/device-check-derogation\.json"\r?\n\s+if \[ -f "\$derogation" \]; then cp "\$derogation" "\$runtime\/device-check-derogation\.json"; fi/);
  assert.match(wf,/Explicit DEVICE_CHECK derogation decided by the slice owner/);
  assert.match(wf,/export KODJO_DEVICE_CHECK_DEROGATION_FILE="\$KODJO_REVIEW_RUNTIME\/device-check-derogation\.json"/);
});

test('the published review states the non-executed derogated proof in clear text',()=>{
  const wf=fs.readFileSync(path.join(root,'.github','workflows','kodjo-slice-implementation-review.yml'),'utf8');
  assert.ok(wf.includes('"DEVICE_CHECK_DEROGATION: \\(.requirement_id) \\(.proof_type) \\(.status) — decided_by \\(.decided_by); not satisfied by \\(.not_satisfied_by|join(","))'));
});
