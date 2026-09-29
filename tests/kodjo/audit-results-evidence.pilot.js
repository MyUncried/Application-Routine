'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {computeStatus}=require('../../scripts/kodjo/lib/status');
const {collect}=require('../../scripts/kodjo/collect-implementation-report');
test('audit F11: only an explicit PASS satisfies a reported required check',()=>{
  const base={hasChanges:true,patchValidated:true,recoveryUploaded:true,requiredChecks:['jest']};
  for(const status of ['PASS','FAIL','NOT_RUN','SKIPPED','NOT_APPLICABLE','BLOCKED','',null,undefined,false,{},[]]){
    const result=computeStatus({...base,checks:[{check:'jest',status}]});
    assert.equal(result.status,status==='PASS'?'IMPLEMENTED_AND_VERIFIED':'IMPLEMENTED_WITH_FAILED_CHECKS');
    if(status!=='PASS')assert.ok(result.failed_checks.includes('jest')||result.not_run_checks.includes('jest'));
  }
  assert.equal(computeStatus({...base,recoveryUploaded:false,checks:[{check:'jest',status:'PASS'}]}).status,'IMPLEMENTATION_FAILED');
});
test('audit F12: evidence preserves full missing/incomplete/complete report and exact identity',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-report-evidence-'));
  try{
    fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({request_id:'r1',source_head:'a'.repeat(40)}));
    for(const text of ['', 'KODJO_IMPLEMENTATION_CONFORMANCE\nUI-1 incomplete', 'KODJO_IMPLEMENTATION_CONFORMANCE\nUI-1 implementation_status files_or_symbols component_used tests_run proof_status preserve_status residual_status\nKODJO_STOP_STATUS: NONE']){
      fs.writeFileSync(path.join(dir,'claude-output.json'),JSON.stringify({result:text}));
      const e=collect(dir,'r1','a'.repeat(40));assert.equal(e.report_text,text);assert.equal(e.truncated,false);assert.equal(e.report_present,text.includes('KODJO_IMPLEMENTATION_CONFORMANCE'));
    }
    assert.throws(()=>collect(dir,'other','a'.repeat(40)),/IDENTITY_MISMATCH/);
    fs.writeFileSync(path.join(dir,'claude-output.json'),JSON.stringify({result:'é'.repeat(90000)}));
    const large=collect(dir,'r1','a'.repeat(40));assert.equal(large.truncated,true);assert.ok(Buffer.byteLength(JSON.stringify(large))<=40000);
    fs.unlinkSync(path.join(dir,'claude-output.json'));assert.equal(collect(dir,'r1','a'.repeat(40)).report_present,false);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('audit F13: current manifest points to the highest existing specification without erasing inheritance',()=>{
  const dir=path.resolve(__dirname,'../../.github/orchestration');
  const versions=fs.readdirSync(dir).filter(n=>/^KODJO_PROTOCOL_V2_SPEC_0\.6\.\d+\.md$/.test(n)).sort((a,b)=>Number(a.match(/0\.6\.(\d+)/)[1])-Number(b.match(/0\.6\.(\d+)/)[1]));
  const manifest=fs.readFileSync(path.join(dir,'PACKAGE_MANIFEST.md'),'utf8');
  assert.ok(manifest.includes(versions.at(-1)+'` | Spécification normative candidate'));\n  assert.match(manifest,/NON RETESTÉE/);\n  assert.match(manifest,/0\.6\.47.*dernière base normative fusionnée|0\.6\.47.*Base normative actuellement fusionnée/);
  assert.match(manifest,/hérit/);assert.doesNotMatch(manifest,/contenu version 3\.22\.0|spécification `0\.6\.21` complétant/);
});
