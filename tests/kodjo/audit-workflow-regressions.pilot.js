'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto');
const {parse}=require('../../scripts/kodjo/lib/yaml');
const root=path.resolve(__dirname,'../..');
function workflow(name){return parse(fs.readFileSync(path.join(root,'.github/workflows',name),'utf8'));}
function selected(condition,manifest,kind){
  let expr=String(condition).replace(/^\$\{\{\s*|\s*\}\}$/g,'');
  expr=expr.replace(/startsWith\(steps.gate.outputs.manifest, '([^']+)'\)/g,(_,prefix)=>JSON.stringify(manifest.startsWith(prefix)))
    .replace(/steps.gate.outputs.v2_operation_kind/g,JSON.stringify(kind));
  return Function('return ('+expr+')')();
}
test('audit F02: actual workflow conditions select exactly one review and prepare its input',()=>{
  const steps=workflow('kodjo-slice-implementation-review.yml').jobs.review.steps;
  const prepare=steps.find(s=>s.name==='Prepare criterion-complete UI review input');
  const full=steps.find(s=>s.name==='Independent OpenAI review — V2 criterion contract');
  const delta=steps.find(s=>s.name==='Independent OpenAI review — legacy path unchanged');
  for(const [manifest,kind,expected] of [
    ['.github/orchestration/queue/v2/a.json','IMPLEMENT',[true,true,false]],
    ['.github/orchestration/queue/v2/a.json','VISUAL_CORRECTION',[false,false,true]],
    ['.github/orchestration/slices/a.yml','',[false,false,true]],
  ]) assert.deepEqual([prepare,full,delta].map(s=>selected(s.if,manifest,kind)),expected);
});
const ps=process.platform==='win32'?'powershell':'pwsh';
const available=cp.spawnSync(ps,['-NoProfile','-Command','$PSVersionTable.PSVersion.ToString()'],{encoding:'utf8'}).status===0;
test('audit F01: native parser accepts every finalizer PowerShell run block',{skip:!available?'PowerShell unavailable; native parse required on Windows CI':false},()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-final-parse-'));
  try{
    const steps=workflow('kodjo-slice-finalize.yml').jobs.finalize.steps;
    let count=0;
    for(const step of steps.filter(s=>s.run)){
      const file=path.join(dir,'step-'+(++count)+'.ps1');
      fs.writeFileSync(file,step.run.replace(/\$\{\{[\s\S]*?\}\}/g,'AUDIT_VALUE'));
      const script="$tokens=$null;$errors=$null;[void][System.Management.Automation.Language.Parser]::ParseFile($args[0],[ref]$tokens,[ref]$errors);if($errors.Count){$errors|ForEach-Object{Write-Error $_};exit 1}";
      const parser=path.join(dir,'parse.ps1');fs.writeFileSync(parser,script);
      const r=cp.spawnSync(ps,['-NoProfile','-File',parser,file],{encoding:'utf8'});
      assert.equal(r.status,0,step.name+'\n'+r.stdout+r.stderr);
    }
    assert.ok(count>=3);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});


test('CRLF-safe diff check accepts Windows line endings but still rejects real trailing spaces',()=>{
  const review=fs.readFileSync(path.join(root,'.github/workflows/kodjo-slice-implementation-review.yml'),'utf8');
  assert.ok(review.includes('git -c core.whitespace=cr-at-eol diff --check "$REVIEW_BASE..$REVIEW_HEAD"'));

  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-crlf-check-'));
  const run=(args)=>cp.spawnSync('git',args,{cwd:dir,encoding:'utf8'});
  try{
    assert.equal(run(['init']).status,0);
    assert.equal(run(['config','user.email','kodjo@example.invalid']).status,0);
    assert.equal(run(['config','user.name','KODJO Test']).status,0);
    fs.writeFileSync(path.join(dir,'sample.txt'),'base\r\n');
    assert.equal(run(['add','sample.txt']).status,0);
    assert.equal(run(['commit','-m','base']).status,0);

    fs.writeFileSync(path.join(dir,'sample.txt'),'clean\r\n');
    const clean=run(['-c','core.whitespace=cr-at-eol','diff','--check','HEAD']);
    assert.equal(clean.status,0,clean.stdout+clean.stderr);

    fs.writeFileSync(path.join(dir,'sample.txt'),'dirty \r\n');
    const dirty=run(['-c','core.whitespace=cr-at-eol','diff','--check','HEAD']);
    assert.notEqual(dirty.status,0);
    assert.match(dirty.stdout+dirty.stderr,/trailing whitespace/i);
  }finally{
    fs.rmSync(dir,{recursive:true,force:true});
  }
});


test('implementation report identity binds application source to base_head, not protocol head',()=>{
  const {inspectImplementation}=require('../../scripts/kodjo/lib/implementation-report');
  const source='1'.repeat(40);
  const protocol='2'.repeat(40);
  const reportText=[
    '<KODJO_IMPLEMENTATION_CONFORMANCE>',
    JSON.stringify({criteria:[{
      criterion_id:'UI-CAT-R-001',
      implementation_status:'IMPLEMENTED',
      files_or_symbols:['a.ts'],
      component_used:'existing component',
      tests_run:['a.test.ts'],
      proof_status:'FUNCTIONAL_TEST=PASS',
      preserve_status:'PASS',
      residual_status:'NONE'
    }]}),
    '</KODJO_IMPLEMENTATION_CONFORMANCE>',
    'KODJO_STOP_STATUS: NONE'
  ].join('\n');
  const envelope={
    request_id:'req-1',
    source_head:source,
    truncated:false,
    original_text_sha256:crypto.createHash('sha256').update(reportText).digest('hex'),
    machine_evidence:{
      modified_files:['a.ts'],
      agent_mutation_files:['a.ts'],
      out_of_scope_files:[],
      post_check_drift:[],
      integrity_status:'INTACT',
      checks:[{check:'jest',status:'PASS',exit_code:0,passed_tests:1,failed_tests:0,total_tests:1}],
    },
    report_text:reportText
  };
  const body=[
    'base_head='+source,
    'v2_protocol_head='+protocol,
    'v2_request_id=req-1',
    '<KODJO_IMPLEMENTATION_REPORT_JSON>',
    JSON.stringify(envelope),
    '</KODJO_IMPLEMENTATION_REPORT_JSON>'
  ].join('\n');
  const result=inspectImplementation(body,['UI-CAT-R-001']);
  assert.equal(result.status,'COMPLETE',JSON.stringify(result.errors));
  assert.ok(!result.errors.includes('REPORT_IDENTITY_MISMATCH'));
});
