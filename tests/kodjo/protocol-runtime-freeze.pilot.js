'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const {parse}=require('../../scripts/kodjo/lib/yaml');
const root=path.resolve(__dirname,'../..');
const workflow=name=>parse(fs.readFileSync(path.join(root,'.github/workflows',name),'utf8').replace(/\r\n/g,'\n'));
const steps=name=>Object.values(workflow(name).jobs).flatMap(j=>j.steps||[]);
function execute(script,args,cwd){const r=spawnSync(process.execPath,[script,...args],{cwd,encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);return r;}
test('IA-001/002: no direct protocol script lookup after the application checkout',()=>{
 for(const name of ['kodjo-v2-slice-plan-review.yml','kodjo-v2-slice-initial-plan-review.yml','kodjo-slice-finalize.yml']){
  let application=false;
  for(const s of steps(name)){
   if(s.uses?.startsWith('actions/checkout')&&s.with?.ref!=='main')application=true;
   if(application)assert.doesNotMatch(s.run||'',/\bnode\s+scripts\/kodjo\//,name+': '+s.name);
  }
 }
});
test('IA-001: each actual YAML snapshot provides the retry CLI in an application with no protocol scripts',()=>{
 for(const name of ['kodjo-v2-slice-plan-review.yml','kodjo-v2-slice-initial-plan-review.yml']){
  const all=steps(name),snapshot=all.find(s=>s.name.startsWith('Snapshot ')),publish=all.find(s=>s.name.startsWith('Publish independent'));
  assert.match(snapshot.run,/Copy-Item -LiteralPath scripts\/kodjo\/decide-plan-review-retry\.js/);
  assert.match(publish.run,/\$retry=node \(Join-Path \(Join-Path \$env:RUNNER_TEMP 'kodjo-v2-[^']+-protocol'\) 'decide-plan-review-retry\.js'\)/);
  const d=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-frozen-retry-'));
  try{
   const frozen=path.join(d,'runtime');fs.mkdirSync(frozen);fs.copyFileSync(path.join(root,'scripts/kodjo/decide-plan-review-retry.js'),path.join(frozen,'decide-plan-review-retry.js'));
   const app=path.join(d,'application');fs.mkdirSync(app);
   const comments=[{id:1,user:{login:'MyUncried'},body:'[KODJO_V2] START_INITIAL_PLAN\nslice_id=S'},{id:2,body:'[KODJO_V2] PLAN_REVIEW_OUTPUT\nslice_id=S\nverdict=REVISE'}];
   const file=path.join(d,'history.json');fs.writeFileSync(file,JSON.stringify([comments]));
   assert.equal(JSON.parse(execute(path.join(frozen,'decide-plan-review-retry.js'),[file,'S','2'],app).stdout).status,'RETRY');
   comments.push({id:3,body:'[KODJO_V2] PLAN_REVIEW_OUTPUT\nslice_id=S\nverdict=REVISE'});fs.writeFileSync(file,JSON.stringify([comments]));
   assert.equal(JSON.parse(execute(path.join(frozen,'decide-plan-review-retry.js'),[file,'S','3'],app).stdout).status,'USER_VALIDATION');
  }finally{fs.rmSync(d,{recursive:true,force:true});}
 }
});
test('IA-002: closure transform and artifact inventory run with no application-side scripts',()=>{
 const all=steps('kodjo-slice-finalize.yml'),snapshot=all.find(s=>s.name==='Snapshot canonical V2 closure transformer');
 for(const script of ['inventory-closure-artifacts.js','lib/artifact-policy.js'])assert.ok(snapshot.run.includes('scripts/kodjo/'+script));
 assert.ok(all.indexOf(snapshot)<all.findIndex(s=>s.name==='Checkout final HEAD'));
 assert.match(all.find(s=>s.name==='Close V2 activation registry canonically').run,/node \(Join-Path \(Join-Path \$env:RUNNER_TEMP 'kodjo-closure-protocol'\) 'inventory-closure-artifacts\.js'\)/);
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-frozen-closure-'));
 try{
  const runtime=path.join(d,'runtime'),app=path.join(d,'application');fs.mkdirSync(path.join(runtime,'lib'),{recursive:true});fs.mkdirSync(app);
  for(const script of ['close-v2-activation.js','inventory-closure-artifacts.js','lib/artifact-policy.js'])fs.copyFileSync(path.join(root,'scripts/kodjo',script),path.join(runtime,script));
  fs.writeFileSync(path.join(d,'registry.json'),JSON.stringify({activations:[{slice_id:'S',issue_number:249,status:'ACTIVE'}]}));
  execute(path.join(runtime,'close-v2-activation.js'),[path.join(d,'registry.json'),path.join(d,'closed.json'),'S','249','a'.repeat(40),'1','2'],app);
  assert.equal(JSON.parse(fs.readFileSync(path.join(d,'closed.json'))).registry.activations[0].status,'CLOSED');
  fs.writeFileSync(path.join(d,'artifacts.json'),JSON.stringify([{artifacts:[{name:'kodjo-v2-recovery-1',size_in_bytes:42}]}]));
  execute(path.join(runtime,'inventory-closure-artifacts.js'),[path.join(d,'artifacts.json'),path.join(d,'inventory.json')],app);
  assert.equal(JSON.parse(fs.readFileSync(path.join(d,'inventory.json'))).total_bytes,42);
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});
test('IA-003: audit quota gate precedes Claude and preserves the mandatory artifact transport',()=>{
 const all=workflow('kodjo-v2-next-evolution-independent-audit.yml').jobs['independent-audit'].steps;
 const gate=all.findIndex(s=>(s.run||'').includes('node scripts/kodjo/check-artifact-budget.js'));
 assert.ok(gate>=0&&gate<all.findIndex(s=>s.name==='Run independent Claude audit'));
 assert.match(all[gate].run,/if\(\$LASTEXITCODE-ne0\)\{throw/);
 assert.ok(all.some(s=>s.uses==='actions/upload-artifact@v4'&&s.with['if-no-files-found']==='error'));
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-audit-budget-'));
 try{const f=path.join(d,'full.json');fs.writeFileSync(f,JSON.stringify([{artifacts:[{name:'kodjo-v2-independent-audit-1',size_in_bytes:100}]}]));const r=spawnSync(process.execPath,[path.join(root,'scripts/kodjo/check-artifact-budget.js'),f,'100'],{encoding:'utf8'});assert.equal(r.status,75);assert.match(r.stderr,/ARTIFACT_STORAGE_PREFLIGHT_EXCEEDED/);}finally{fs.rmSync(d,{recursive:true,force:true});}
});
test('IA-004: normative inputs and every direct V2 workflow script are included in the package',()=>{
 const manifest=fs.readFileSync(path.join(root,'.github/orchestration/PACKAGE_MANIFEST.md'),'utf8');
 const inputs=JSON.parse(fs.readFileSync(path.join(root,'.github/orchestration/normative-inputs.json'))).files;
 for(const f of fs.readdirSync(path.join(root,'.github/workflows')).filter(f=>/^kodjo-v2-.*\.yml$/.test(f)))for(const m of fs.readFileSync(path.join(root,'.github/workflows',f),'utf8').matchAll(/scripts\/kodjo\/[a-zA-Z0-9_.\-/]+\.(?:js|ps1)/g))inputs.push(m[0]);
 for(const f of new Set(inputs))assert.ok(manifest.includes(f),f);
});
test('IA-009: a blocking generic PLAN target is refused instead of starting an impossible revision',()=>{
 const {normalize}=require('../../scripts/kodjo/lib/review-findings');
 const row={category:'OTHER',target_kind:'PLAN',target:'whole plan',blocking:true,diagnostic:'Gap',expected_correction:'Revise',dependency_expansion_required:false,dependency_evidence:''};
 assert.throws(()=>normalize({findings:[row]}),/UNACTIONABLE_PLAN_TARGET/);
 assert.doesNotThrow(()=>normalize({findings:[{...row,target:'NON_UI_COVERAGE'}]}));
});
