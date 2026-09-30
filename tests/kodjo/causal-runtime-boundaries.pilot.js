'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),scripts=path.join(root,'scripts/kodjo');
const {parse}=require('../../scripts/kodjo/lib/yaml');
const {select,build}=require('../../scripts/kodjo/build-planning-context');
const {boundaryProof}=require('../../scripts/kodjo/lib/boundary-proof');
const {validateSourceBindings}=require('../../scripts/kodjo/generate-ui-plan-contract');
const {validateMatrix,matrixFingerprint}=require('../../scripts/kodjo/lib/ui-criteria-contract');
const {scanDirectImporters,sha256}=require('../../scripts/kodjo/lib/plan-impact');
const {buildRequirementContract,buildTestContract,buildBoundaryContract}=require('../../scripts/kodjo/lib/requirement-contract');
const {verifyWorkflow}=require('../../scripts/kodjo/verify-artifact-retention');
const {classify}=require('../../scripts/kodjo/lib/artifact-policy');
const wf=n=>parse(fs.readFileSync(path.join(root,'.github/workflows',n),'utf8'));
const all=n=>Object.values(wf(n).jobs).flatMap(j=>j.steps||[]);
const tag=(n,v)=>'\n<'+n+'>\n'+JSON.stringify(v)+'\n</'+n+'>\n';
function run(program,args,cwd){return spawnSync(program,args,{cwd,encoding:'utf8',windowsHide:true});}
function git(cwd,...args){const r=run('git',args,cwd);assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function fixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-audit-runtime-'));
 for(const [f,body] of Object.entries({'src/a.ts':'export function kept(){return 1;}\n','docs/spec.md':'Preserve the data contract.\n','.gitignore':'ignored/\n'})){fs.mkdirSync(path.dirname(path.join(dir,f)),{recursive:true});fs.writeFileSync(path.join(dir,f),body);}
 git(dir,'init','-q');git(dir,'config','user.email','test@example.invalid');git(dir,'config','user.name','Test');git(dir,'config','core.autocrlf','false');git(dir,'add','.');git(dir,'commit','-qm','baseline');
 return {dir,head:git(dir,'rev-parse','HEAD')};
}
const empty=()=>({schema:'kodjo.ui-criteria.v3',criteria:[],preservation:{preserve:[],change:[],forbidden:[]}});
const locator=(file,type='FILE_UNCHANGED')=>({kind:'PATH',path:file,symbol:'NONE',invariant_type:type,expected:type==='PATH_ABSENT'?'ABSENT':'UNCHANGED',semantic_justification:'NONE'});
function contracts(f,m=empty()){
 const modules=[{path:'src/a.ts',change:'MODIFY'}],scan=scanDirectImporters({cwd:f.dir,revision:f.head,modifiedModules:modules});
 const impact={schema:'kodjo.plan-impact.v1',scan_revision:f.head,scan_sha256:sha256(scan),modified_modules:modules,rows:modules.map(x=>({...x,candidate_kind:'MODIFIED_MODULE',triggered_by:[],risk_score:0,classification:'MODIFY',justification:'Bounded change'})),scope_allow:['src/a.ts']};
 const requirements=buildRequirementContract(m,[{source:{path:'docs/spec.md',locator:'1',requirement:'Preserve data contract'},requirement_type:'TECHNICAL',change_targets:['src/a.ts'],tests:[],no_automated_test_reason:'Static contract verified by exact type checking and lint, without a change in runtime behavior.',proof_required:['STATIC_ANALYSIS']}],new Set(['src/a.ts']));
 return tag('KODJO_PLAN_IMPACT_JSON',impact)+tag('KODJO_UI_CRITERIA_MATRIX_JSON',m)+tag('KODJO_NON_UI_REQUIREMENTS_JSON',requirements.requirements)+tag('KODJO_REQUIREMENT_CONTRACT_JSON',requirements)+tag('KODJO_TEST_CONTRACT_JSON',buildTestContract(requirements))+tag('KODJO_BOUNDARY_CONTRACT_JSON',buildBoundaryContract(m))+tag('KODJO_UI_PLAN_CONTRACT_JSON',{schema:'kodjo.ui-plan-contract.v1',contract_version:2,scan_revision:f.head,ui_applicable:false,criterion_count:0,criterion_ids_sha256:sha256([]),assertion_count:0,assertion_ids_sha256:sha256([]),matrix_sha256:matrixFingerprint(m)});
}
test('F-001: actual IMPLEMENT YAML freezes the entire recursive local dependency closure',()=>{
 const step=all('kodjo-v2-implementation-artifact.yml').find(s=>s.id==='plan_gate');
 const files=[...step.run.matchAll(/scripts\/kodjo\/[A-Za-z0-9_.\/-]+\.js/g)].map(m=>m[0].slice('scripts/kodjo/'.length));
 const declared=new Set(files),visited=new Set();
 function check(file){if(visited.has(file))return;visited.add(file);assert.ok(declared.has(file),'Dependency missing from actual YAML: '+file);for(const m of fs.readFileSync(path.join(scripts,file),'utf8').matchAll(/require\(['"](\.[^'"]+)['"]\)/g)){const next=path.posix.normalize(path.posix.join(path.posix.dirname(file),m[1]));check(next.endsWith('.js')?next:next+'.js');}}
 for(const file of files)check(file);
 // A newly introduced transitive dependency must fail this closure test.
 assert.equal(declared.has('lib/requirement-contract.js'),true);
 const f=fixture(),runtime=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-control-'));
 try{
  for(const file of declared){fs.mkdirSync(path.dirname(path.join(runtime,file)),{recursive:true});fs.copyFileSync(path.join(scripts,file),path.join(runtime,file));}
  assert.equal(fs.existsSync(path.join(f.dir,'scripts')),false);
  let plan='[KODJO_V2] PLAN_OUTPUT\nslice_id=S\nsource_head='+f.head+'\nplanning_contract=kodjo.plan-impact.v1\nSTATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW\n## scope_allow\n`src/a.ts`\n'+contracts(f);
  const p=path.join(runtime,'plan.md'),proof=path.join(runtime,'contract.json');fs.writeFileSync(p,plan);
  const produced=run(process.execPath,[path.join(runtime,'verify-plan-contract-consistency.js'),p,f.head,f.dir,proof,'produce',f.head],f.dir);assert.equal(produced.status,0,produced.stderr);
  plan+=tag('KODJO_PLAN_CONTRACT_JSON',JSON.parse(fs.readFileSync(proof)));
  const comments=[{id:1,user:{login:'github-actions[bot]'},body:plan},{id:2,user:{login:'github-actions[bot]'},body:'[KODJO_V2] PLAN_REVIEW_OUTPUT\nslice_id=S\nsource_head='+f.head+'\nsource_plan_comment_id=1\nverdict=APPROVE\nSTATUT : PLAN_REVIEW_APPROVED'},{id:3,user:{login:'MyUncried'},body:'[KODJO_V2] USER_IMPLEMENTATION_APPROVED\nslice_id=S\nsource_head='+f.head+'\nsource_plan_comment_id=1\nsource_review_comment_id=2'}];
  comments.forEach((c,i)=>fs.writeFileSync(path.join(runtime,'c'+i+'.json'),JSON.stringify(c)));
  const args=[...comments.map((_,i)=>path.join(runtime,'c'+i+'.json')),'S',f.head,'249',f.dir,path.join(runtime,'verify-plan-contract-consistency.js'),path.join(runtime,'verify-plan-impact.js'),f.head,path.join(runtime,'gate.json')];
  let result=run(process.execPath,[path.join(runtime,'verify-implementation-plan-gate.js'),...args],f.dir);assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(fs.readFileSync(path.join(runtime,'gate.json'))).status,'PASS');
  fs.rmSync(path.join(runtime,'lib/ui-identities.js'));result=run(process.execPath,[path.join(runtime,'verify-implementation-plan-gate.js'),...args],f.dir);assert.notEqual(result.status,0);assert.match(result.stderr,/MODULE_NOT_FOUND/);
 }finally{fs.rmSync(f.dir,{recursive:true,force:true});fs.rmSync(runtime,{recursive:true,force:true});}
});
for(const mode of ['initial','revision'])test('F-002: '+mode+' bot REVISE command builds the actual causal context and refuses forged bindings',()=>{
 const issueUrl='https://api.github.com/repos/R/R/issues/249',head='a'.repeat(40),bind=mode==='initial'?'planning_mode=INITIAL\nsource_head='+head+'\n':'application_pr=250\napplication_head='+head+'\n';
 const c=(id,body)=>({id,body,user:{login:'github-actions[bot]'},issue_url:issueUrl});
 const plan=c(10,'[KODJO_V2] PLAN_OUTPUT\nslice_id=S\n'+bind+'STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW');
 const review=c(11,'[KODJO_V2] PLAN_REVIEW_OUTPUT\nslice_id=S\n'+bind+'source_plan_comment_id=10\nverdict=REVISE\nSTATUT : PLAN_REVISION_REQUIRED'+tag('KODJO_PLAN_REVIEW_FINDINGS_JSON',{verdict:'REVISE',findings:[]}));
 const args={comments:[plan,review],command:review.body,commandId:11,issueUrl,slice:'S',sourceHead:head,applicationHead:head,applicationPr:250,mode};
 assert.deepEqual(select(args).map(x=>[x.role,x.id]),[['BASE_PLAN','10'],['INDEPENDENT_REVIEW','11']]);
 for(const mutate of [x=>x[1].user.login='outsider',x=>x[1].issue_url+='0',x=>x[1].body=x[1].body.replace('slice_id=S','slice_id=OTHER'),x=>x[1].body=x[1].body.replace('verdict=REVISE','verdict=APPROVE'),x=>x[1].body=x[1].body.replace('source_plan_comment_id=10','source_plan_comment_id=9'),x=>x[0].body=x[0].body.replace(head,'b'.repeat(40)),x=>x[0].user.login='outsider']){const comments=structuredClone(args.comments);mutate(comments);assert.throws(()=>select({...args,comments,command:comments[1].body}),/CONTEXT_/);}
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-context-retry-'));
 try{
  const files={'slice-bootstrap.json':JSON.stringify({slice_id:'S',issue_number:249,repository:'R/R'}),'issue.json':JSON.stringify({number:249,url:issueUrl,body:'Existing issue'}),'comments.json':JSON.stringify(args.comments),'planning-mission.md':'Existing mission','product-evidence.txt':'Baseline evidence','code-files.txt':'Baseline code'};
  for(const [n,v] of Object.entries(files))fs.writeFileSync(path.join(d,n),v);
  const manifest=build(d,{PLANNING_MODE:mode,TRIGGER_BODY:review.body,COMMAND_COMMENT_ID:'11',SOURCE_HEAD:head,APPLICATION_HEAD:head,APPLICATION_PR:'250'});
  assert.equal(manifest.status,'PASS');assert.equal(fs.readFileSync(path.join(d,'base-plan-for-revision.md'),'utf8'),plan.body);assert.match(fs.readFileSync(path.join(d,'canonical-context.txt'),'utf8'),/REVIEW_FINDINGS/);
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});
test('F-002: INITIAL dispatch hydrates TRIGGER_BODY before the gate and before context/AI',()=>{
 const s=all('kodjo-v2-slice-initial-plan.yml'),i=s.findIndex(x=>x.name==='Replay causal initial planning command');assert.ok(i>=0&&i<s.findIndex(x=>x.id==='gate'));assert.match(s[i].run,/GITHUB_ENV/);assert.match(s[i].run,/crypto.randomBytes/);assert.match(s[i].if,/inputs.command_comment_id/);
 const code=s[i].run.match(/node <<'NODE'\n([\s\S]*?)\nNODE/)[1];
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-command-hydration-'));try{
  const file=path.join(d,'github-env'),body='[KODJO_V2] PLAN_REVIEW_OUTPUT\nslice_id=S\nverdict=REVISE\nKODJO_REVIEW_REVISION_EVENT\n';
  const result=spawnSync(process.execPath,['-e',code],{encoding:'utf8',env:{...process.env,EVENT_JSON:JSON.stringify({body}),GITHUB_ENV:file}});assert.equal(result.status,0,result.stderr);
  const text=fs.readFileSync(file,'utf8'),delimiter=text.split('\n')[0].slice('TRIGGER_BODY<<'.length);assert.match(delimiter,/^KODJO_EVENT_[a-f0-9]{32}$/);assert.equal(text,'TRIGGER_BODY<<'+delimiter+'\n'+body+'\n'+delimiter+'\n');
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});
test('F-010: actual shell prompt heredoc keeps contract identifiers literal',()=>{
 const step=all('kodjo-v2-slice-plan.yml').find(s=>s.name==='Construct V2 plan draft with OpenAI');
 const prompt=step.run.match(/cat > [^\n]+ <<EOF\n([\s\S]*?)\nEOF/)[1];assert.match(prompt,/kodjo.ui-criteria.v3/);assert.doesNotMatch(prompt,/`|\$\(/);
});
test('F-003: all actual uploads obey policy; unknown names and retention drift fail closed',()=>{
 let count=0;for(const n of fs.readdirSync(path.join(root,'.github/workflows')).filter(n=>/^kodjo-.*\.yml$/.test(n)))count+=verifyWorkflow(wf(n),n).length;assert.ok(count>=36);
 const workflow=name=>({jobs:{a:{steps:[{uses:'actions/upload-artifact@v4',with:{name,'retention-days':7}}]}}});
 assert.throws(()=>verifyWorkflow(workflow('kodjo-v2-disposable-qualification-123')),/POLICY_MISMATCH/);
 assert.throws(()=>verifyWorkflow(workflow('unrecognized-critical-evidence-123')),/POLICY_UNKNOWN/);
 assert.deepEqual(classify('unrecognized-critical-evidence-123'),{role:'UNKNOWN',retention_days:90,critical:true});
});
test('F-006: migration evidence is tolerated; head drift is durable and blocks only its current slice',()=>{
 const {detect,disposition}=require('../../scripts/kodjo/detect-v2-closure-inconsistency');
 const registry={activations:[{slice_id:'A',issue_number:1,status:'ACTIVE'},{slice_id:'B',issue_number:2,status:'CLOSED',closure:{final_head:'a'.repeat(40)}}]};
 const comment=s=>({id:1,body:'[KODJO_SLICE] FINAL_OUTPUT\nslice_id='+s+'\nfinal_head='+'b'.repeat(40)+'\nSTATUT : DONE'});
 const result=detect(registry,{'1':[[comment('A')]],'2':[[comment('B')]]});
 assert.deepEqual(result.anomalies.map(x=>x.code),['CLOSURE_EVIDENCE_WITH_ACTIVE_REGISTRY','CLOSURE_HEAD_DRIFT']);
 assert.equal(disposition(result,'A').block_current_closure,false);assert.equal(disposition(result,'B').block_current_closure,true);assert.deepEqual(disposition(result,'A').durable_anomalies.map(x=>x.slice_id),['B']);
 const step=all('kodjo-slice-finalize.yml').find(s=>s.name==='Detect previously published closure evidence against registry');assert.match(step.run,/\$consistency\.durable_anomalies/);assert.match(step.run,/gh api --method POST/);assert.match(step.run,/if\(\$consistency\.block_current_closure\)\{throw/);
});
test('F-007/008/012: native filters cover protocol/mixed changes; app-only exclusion and dispatch parity are explicit',()=>{
 const {classifyFiles}=require('../../scripts/kodjo/classify-protocol-impact');
 function glob(pattern,file){return new RegExp('^'+pattern.split('**').map(s=>s.split('*').map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('[^/]*')).join('.*')+'$').test(file);}
 const pilot=wf('kodjo-v2-pilot-tests.yml'),audit=wf('kodjo-v2-next-evolution-independent-audit.yml');assert.deepEqual(audit.on.pull_request.paths,pilot.on.pull_request.paths);assert.doesNotMatch(audit.jobs.await_qualified_head.if,/250/);assert.equal(audit.on.workflow_dispatch.inputs.pr_number.default,undefined);
 const matches=file=>pilot.on.pull_request.paths.reduce((included,p)=>glob(p.startsWith('!')?p.slice(1):p,file)?!p.startsWith('!'):included,false);
 for(const file of ['scripts/kodjo/new-runtime.js','tests/kodjo/new-test.pilot.js','.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.51.md']){assert.equal(matches(file),true);assert.equal(classifyFiles([file]).full_windows_required,true);}
 for(const file of ['.github/orchestration/reports/new-evidence.md','.github/orchestration/PROTOCOL_EVOLUTION_BACKLOG.md']){assert.equal(matches(file),false);assert.equal(classifyFiles([file]).full_windows_required,false);}
 for(const file of ['app/new-screen.tsx','src/new-application.ts']){assert.equal(matches(file),false);assert.equal(classifyFiles([file]).category,'UNKNOWN');assert.equal(classifyFiles(['scripts/kodjo/runtime.js',file]).full_windows_required,true);}
 const spec=fs.readFileSync(path.join(root,'.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.51.md'),'utf8');assert.match(spec,/PR exclusivement applicatives/);assert.match(spec,/deltas mixtes/);assert.deepEqual(wf('kodjo-v2-comment-router.yml').on,{issue_comment:{types:['created']}});assert.match(spec,/parité avec `comment-routes.json`/);
});
test('F-004: two increments cannot erase an earlier preservation violation; restoration passes',()=>{
 const f=fixture();try{
  const l=locator('src/a.ts'),options={cwd:f.dir,sourceHead:f.head};assert.equal(boundaryProof(l,new Set(),options),'PASS');
  fs.writeFileSync(path.join(f.dir,'src/a.ts'),'export function kept(){return 2;}\n');git(f.dir,'add','.');git(f.dir,'commit','-qm','first increment');assert.equal(boundaryProof(l,new Set(['src/a.ts']),options),'FAIL');
  fs.writeFileSync(path.join(f.dir,'src/other.ts'),'export const other=3;\n');git(f.dir,'add','.');git(f.dir,'commit','-qm','second increment');assert.equal(boundaryProof(l,new Set(['src/other.ts']),options),'FAIL');
  assert.equal(boundaryProof({...l,kind:'SYMBOL',symbol:'kept',invariant_type:'SYMBOL_UNCHANGED'},new Set(['src/other.ts']),options),'FAIL');
  git(f.dir,'checkout',f.head,'--','src/a.ts');git(f.dir,'commit','-qm','restore invariant');assert.equal(boundaryProof(l,new Set(['src/a.ts']),options),'PASS');
  assert.equal(boundaryProof(l,new Set(),{cwd:f.dir,sourceHead:'b'.repeat(40)}),'NON_VERIFIABLE');
 }finally{fs.rmSync(f.dir,{recursive:true,force:true});}
});
test('F-005: forbidden absent path/tree is valid, remains cumulative and cannot be overridden',()=>{
 const f=fixture();try{
  const m=empty(),l=locator('src/newEngine','PATH_ABSENT');m.preservation.forbidden=[{target:'No new engine',justification:'Outside validated scope',locator:l}];
  assert.doesNotThrow(()=>validateMatrix(m,{scope:new Set(['src/a.ts']),uiPaths:[]}));assert.doesNotThrow(()=>validateSourceBindings({requirements:[]},{scan_revision:f.head},f.dir,new Set(),m));assert.equal(boundaryProof(l,new Set(),{cwd:f.dir}),'PASS');
  const invalid=empty();invalid.preservation.preserve=m.preservation.forbidden;assert.throws(()=>validateMatrix(invalid,{scope:new Set(),uiPaths:[]}),/REQUIRES_FORBIDDEN/);
  fs.mkdirSync(path.join(f.dir,'src/newEngine'));fs.writeFileSync(path.join(f.dir,'src/newEngine/index.ts'),'export const forbidden=1;');assert.equal(boundaryProof(l,new Set(),{cwd:f.dir}),'FAIL');git(f.dir,'add','.');git(f.dir,'commit','-qm','forbidden engine');
  fs.writeFileSync(path.join(f.dir,'src/neighbor.ts'),'export const next=1;');git(f.dir,'add','.');git(f.dir,'commit','-qm','unrelated next increment');assert.equal(boundaryProof(l,new Set(['src/neighbor.ts']),{cwd:f.dir}),'FAIL');
  assert.throws(()=>validateSourceBindings({requirements:[]},{scan_revision:git(f.dir,'rev-parse','HEAD')},f.dir,new Set(),m),/ALREADY_AT_HEAD/);
  fs.writeFileSync(path.join(f.dir,'plan.md'),contracts(f,m));fs.writeFileSync(path.join(f.dir,'changed.txt'),'src/neighbor.ts');
  const review={schema:'kodjo.ui-implementation-review.v1',criteria:[],boundary_results:[{category:'FORBIDDEN',target:'No new engine',status:'PASS',evidence:'Reviewer claims absence'}],non_ui_plan_assessment:{requirements:[{requirement_id:buildRequirementContract(m,[{source:{path:'docs/spec.md',locator:'1',requirement:'Preserve data contract'},requirement_type:'TECHNICAL',change_targets:['src/a.ts'],tests:[],no_automated_test_reason:'Static contract verified by exact type checking and lint, without a change in runtime behavior.',proof_required:['STATIC_ANALYSIS']}],new Set(['src/a.ts'])).requirements[0].requirement_id,status:'CONFORME',evidence:'Static contract',proof_results:[{proof_type:'STATIC_ANALYSIS',status:'PASS',evidence:'Static checks pass'}]}]}};
  fs.writeFileSync(path.join(f.dir,'review.json'),JSON.stringify(review));const r=run(process.execPath,[path.join(scripts,'verify-ui-implementation-review.js'),'validate','plan.md','changed.txt','review.json','out.json'],f.dir);assert.notEqual(r.status,0);assert.match(r.stderr,/BOUNDARY_MACHINE_MISMATCH/);
  fs.mkdirSync(path.join(f.dir,'ignored'));fs.writeFileSync(path.join(f.dir,'ignored/new.ts'),'ignored');assert.equal(boundaryProof(locator('ignored','PATH_ABSENT'),new Set(),{cwd:f.dir}),'FAIL');
 }finally{fs.rmSync(f.dir,{recursive:true,force:true});}
});
