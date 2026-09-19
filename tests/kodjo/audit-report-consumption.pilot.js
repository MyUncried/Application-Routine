'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const {sha256}=require('../../scripts/kodjo/lib/plan-impact');
const {inspectReport}=require('../../scripts/kodjo/lib/implementation-report');
const root=path.resolve(__dirname,'../..');
const collector=path.join(root,'scripts/kodjo/collect-implementation-report.js');
const verifier=path.join(root,'scripts/kodjo/verify-ui-implementation-review.js');
function row(id){return {criterion_id:id,implementation_status:'CONFORME',files_or_symbols:['src/x.ts'],component_used:'Existing',tests_run:['fixture only'],proof_status:'PASS / PENDING_DEVICE',preserve_status:'PASS',residual_status:'NONE'};}
function report(rows=[row('UI-1'),row('UI-2')],stop='KODJO_STOP_STATUS: NONE'){return '<KODJO_IMPLEMENTATION_CONFORMANCE>'+JSON.stringify({criteria:rows})+'</KODJO_IMPLEMENTATION_CONFORMANCE>\n'+stop;}
function fixture(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-report-consumer-'));
  const matrix={schema:'kodjo.ui-criteria.v1',criteria:['UI-1','UI-2'].map(criterion_id=>({criterion_id,change_targets:['src/x.ts'],proof_required:['FUNCTIONAL_TEST','DEVICE_CHECK']})),preservation:{preserve:[],forbidden:[],change:[]}};
  const contract={schema:'kodjo.ui-plan-contract.v1',ui_applicable:true,matrix_sha256:sha256(matrix)};
  fs.writeFileSync(path.join(dir,'plan.md'),'<KODJO_UI_CRITERIA_MATRIX_JSON>'+JSON.stringify(matrix)+'</KODJO_UI_CRITERIA_MATRIX_JSON>\n<KODJO_UI_PLAN_CONTRACT_JSON>'+JSON.stringify(contract)+'</KODJO_UI_PLAN_CONTRACT_JSON>');
  fs.writeFileSync(path.join(dir,'changed.txt'),'src/x.ts\n');
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({request_id:'r1',source_head:'a'.repeat(40)}));
  return dir;
}
function run(script,args,cwd){return cp.spawnSync(process.execPath,[script,...args],{cwd,encoding:'utf8'});}
function review(status='CONFORME'){return {schema:'kodjo.ui-implementation-review.v1',verdict:status==='CONFORME'?'APPROVE':'REVISE',device_gate_required:true,boundary_results:[],criteria:['UI-1','UI-2'].map(criterion_id=>({criterion_id,implementation_status:status,preserve_status:'PASS',evidence:'isolated fixture',proof_results:[{proof_type:'FUNCTIONAL_TEST',status:'PASS',evidence:'fixture'},{proof_type:'DEVICE_CHECK',status:'PENDING_DEVICE',evidence:'human required'}]}))};}
const variants={complete:report(),absent:'',incomplete:report([{criterion_id:'UI-1'},row('UI-2')]),missing:report([row('UI-1')]),duplicate:report([row('UI-1'),row('UI-1')]),noStop:report(undefined,''),stop:report(undefined,'KODJO_STOP_STATUS: CLARIFICATION_REQUIRED'),truncated:report()+'\n'+'x'.repeat(100000)};
test('F12: real collector CLI -> prepared review -> consumer refuses approval for every incomplete output',()=>{
  const dir=fixture();try{
    for(const [name,text] of Object.entries(variants)){
      fs.writeFileSync(path.join(dir,'claude-output.json'),JSON.stringify({result:text}));
      const c=run(collector,[dir,'r1','a'.repeat(40),path.join(dir,'report.json')],dir);assert.equal(c.status,0,c.stderr);
      const e=JSON.parse(fs.readFileSync(path.join(dir,'report.json')));
      fs.writeFileSync(path.join(dir,'implementation.md'),'v2_request_id=r1\nv2_protocol_head='+'a'.repeat(40)+'\n<KODJO_IMPLEMENTATION_REPORT_JSON>'+JSON.stringify(e)+'</KODJO_IMPLEMENTATION_REPORT_JSON>');
      const p=run(verifier,['prepare','plan.md','changed.txt','input.json','implementation.md'],dir);assert.equal(p.status,0,p.stderr);
      const input=JSON.parse(fs.readFileSync(path.join(dir,'input.json')));
      assert.equal(input.implementation_report.status,name==='complete'?'COMPLETE':'NON_VERIFIABLE',name);
      fs.writeFileSync(path.join(dir,'review.json'),JSON.stringify(review()));
      const v=run(verifier,['validate','plan.md','changed.txt','review.json','out.json','implementation.md'],dir);
      if(name==='complete')assert.equal(v.status,0,v.stderr);
      else{
        assert.notEqual(v.status,0,name);assert.match(v.stderr,/IMPLEMENTATION_REPORT_UNVERIFIABLE/);
        fs.writeFileSync(path.join(dir,'review.json'),JSON.stringify(review('NON_VERIFIABLE')));
        const negative=run(verifier,['validate','plan.md','changed.txt','review.json','out.json','implementation.md'],dir);assert.equal(negative.status,0,negative.stderr);
      }
    }
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('F12: each required field, duplicate block and invalid stop are observable',()=>{
  for(const key of ['implementation_status','files_or_symbols','component_used','tests_run','proof_status','preserve_status','residual_status']){
    const r=row('UI-1');delete r[key];assert.equal(inspectReport(report([r,row('UI-2')]),['UI-1','UI-2']).status,'NON_VERIFIABLE',key);
  }
  for(const text of [report()+report(),report(undefined,'KODJO_STOP_STATUS: MADE_UP'),report(undefined,'KODJO_STOP_STATUS: NONE\nKODJO_STOP_STATUS: NONE')])assert.equal(inspectReport(text).status,'NON_VERIFIABLE');
});
const ps=process.platform==='win32'?'powershell':'pwsh';
const native=cp.spawnSync(ps,['-NoProfile','-Command','$PSVersionTable.PSVersion.ToString()']).status===0;
test('F12: execute the actual runner evidence block with native PowerShell and real collector',{skip:!native?'Native PowerShell required on CI':false},()=>{
  const dir=fixture();try{
    const runner=fs.readFileSync(path.join(root,'scripts/kodjo/run-queued-request.ps1'),'utf8');
    const start=runner.indexOf('  if (-not $isVisual) {\n    $reportPath');assert.ok(start>=0);
    const end=runner.indexOf('\n  }',start)+4;assert.ok(end>start);
    const block=runner.slice(start,end);
    const script="$ErrorActionPreference='Stop'\n$runDir=$args[0]\n$runtimeScriptRoot=$args[1]\n$queue=@{request_id='r1';source_head=('a'*40)}\n$isVisual=$false\n$reviewBody=''\n"+block+"\n[IO.File]::WriteAllText((Join-Path $runDir 'transport.md'),$reviewBody)\n";
    fs.writeFileSync(path.join(dir,'block.ps1'),script);
    for(const [name,text] of Object.entries(variants)){
      fs.writeFileSync(path.join(dir,'claude-output.json'),JSON.stringify({result:text}));
      const r=cp.spawnSync(ps,['-NoProfile','-File',path.join(dir,'block.ps1'),dir,path.join(root,'scripts/kodjo')],{encoding:'utf8'});
      assert.equal(r.status,0,r.stdout+r.stderr);
      const e=JSON.parse(fs.readFileSync(path.join(dir,'implementation-report.json')));
      assert.equal(e.structural_assessment.status,name==='complete'||name==='missing'?'COMPLETE':'NON_VERIFIABLE',name);
      // Missing criterion needs the approved plan: the review consumer above detects it.
      assert.match(fs.readFileSync(path.join(dir,'transport.md'),'utf8'),/KODJO_IMPLEMENTATION_REPORT_JSON/);
    }
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
