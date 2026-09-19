'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
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
