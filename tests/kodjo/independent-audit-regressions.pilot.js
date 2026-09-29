'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const {buildRequirementContract,buildTestContract,buildBoundaryContract}=require('../../scripts/kodjo/lib/requirement-contract');
const {stabilizeUiIdentities,schemaFor}=require('../../scripts/kodjo/generate-ui-plan-contract');
const {validateMatrix,matrixFingerprint}=require('../../scripts/kodjo/lib/ui-criteria-contract');
const {verify:revise}=require('../../scripts/kodjo/verify-bounded-plan-revision');
const {compareSymbol}=require('../../scripts/kodjo/lib/boundary-proof');
const {classifyFiles}=require('../../scripts/kodjo/classify-protocol-impact');
const {parse}=require('../../scripts/kodjo/lib/yaml');
const {sha256}=require('../../scripts/kodjo/lib/plan-impact');
const root=path.resolve(__dirname,'../..'),ui='app/example.tsx',data='src/infrastructure/database.ts';
function matrix(){return stabilizeUiIdentities({schema:'kodjo.ui-criteria.v3',criteria:[{criterion_id:'TEMP',source:{path:'docs/ui.md',locator:'1',requirement:'Control present'},risk_types:['FUNCTIONAL'],reuse_search:['src/shared/ui'],component_decision:'CREATE',selected_component:{path:'NONE',export:'NONE'},decision_justification:'No existing control applies',change_targets:[ui],tests:['tests/ui.test.js'],proof_required:['FUNCTIONAL_TEST'],assertions:[{assertion_id:'TEMP-A01',source:{path:'docs/ui.md',locator:'1'},property_type:'PRESENCE',expected:'Control exists',proof_required:['FUNCTIONAL_TEST']}]}],preservation:{preserve:[],change:[{target:'Control',justification:'Requested change'}],forbidden:[]}});}
function requirement(){return {source:{path:'docs/data.md',locator:'1',requirement:'Preserve data semantics'},requirement_type:'DATA',change_targets:[data],tests:[],proof_required:['STATIC_ANALYSIS'],status:'DEFINED',no_automated_test_reason:'This invariant is checked by static inspection of the data contract; execution cannot establish the required preservation.'};}
function context(scope=[ui]){return {scope:new Set(scope),uiPaths:[ui],requireAssertions:true};}
function tag(name,value){return '<'+name+'>\n'+JSON.stringify(value)+'\n</'+name+'>\n';}
test('F01: a mixed UI/data scope cannot hide an unbound mutable data file',()=>{
 assert.throws(()=>buildRequirementContract(matrix(),[],new Set([ui,data])),/NON_UI_SCOPE_COVERAGE_INCOMPLETE/);
 const req=buildRequirementContract(matrix(),[requirement()],new Set([ui,data,'tests/ui.test.js']));
 assert.equal(req.requirement_count,2);assert.equal(req.requirements.filter(r=>r.domain==='NON_UI').length,1);
});
test('F01/F14: reviewer consumes exact non-UI rows and NO_AUTOMATED_TEST justification',()=>{
 const m=matrix(),nonUi=[requirement()],scope=[ui,data],req=buildRequirementContract(m,nonUi,new Set(scope));
 const tc=buildTestContract(req);assert.equal(tc.no_automated_tests[0].status,'NO_AUTOMATED_TEST');
 const ids=m.criteria[0].assertions.map(a=>a.assertion_id);
 const plan=tag('KODJO_PLAN_IMPACT_JSON',{scope_allow:scope})+tag('KODJO_UI_CRITERIA_MATRIX_JSON',m)+tag('KODJO_NON_UI_REQUIREMENTS_JSON',nonUi)+tag('KODJO_REQUIREMENT_CONTRACT_JSON',req)+tag('KODJO_TEST_CONTRACT_JSON',tc)+tag('KODJO_BOUNDARY_CONTRACT_JSON',buildBoundaryContract(m))+tag('KODJO_UI_PLAN_CONTRACT_JSON',{schema:'kodjo.ui-plan-contract.v1',contract_version:2,scan_revision:'a'.repeat(40),ui_applicable:true,criterion_count:1,criterion_ids_sha256:sha256(m.criteria.map(c=>c.criterion_id)),assertion_count:ids.length,assertion_ids_sha256:sha256(ids),matrix_sha256:matrixFingerprint(m)});
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-mixed-review-'));
 try{fs.writeFileSync(path.join(dir,'plan.md'),plan);fs.writeFileSync(path.join(dir,'changed.txt'),scope.join('\n'));
 const r=spawnSync(process.execPath,[path.join(root,'scripts/kodjo/verify-ui-implementation-review.js'),'prepare','plan.md','changed.txt','input.json'],{cwd:dir,encoding:'utf8',env:{...process.env,KODJO_REQUIRE_COMPONENT_PROOF:'0'}});
 assert.equal(r.status,0,r.stderr);const input=JSON.parse(fs.readFileSync(path.join(dir,'input.json')));assert.equal(input.non_ui_requirement_count,1);assert.equal(input.non_ui_requirements[0].no_automated_test_reason,nonUi[0].no_automated_test_reason);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('F14: missing or short no-test justification is refused',()=>{for(const reason of [undefined,'No test'])assert.throws(()=>buildRequirementContract(matrix(),[{...requirement(),no_automated_test_reason:reason}],new Set([ui,data])),/REQUIREMENT_NO_TEST_REASON_REQUIRED/);});
test('F04: modern REVISE never silently falls back to unbounded legacy revision',()=>{
 for(const base of [tag('KODJO_REQUIREMENT_CONTRACT_JSON',{}),'kodjo.ui-criteria.v2','kodjo.ui-criteria.v3'])assert.throws(()=>revise(base,'verdict=REVISE','changed'),/STRUCTURED_FINDINGS_REQUIRED/);
 assert.equal(revise('historical plan','verdict=REVISE','changed').status,'LEGACY_UNBOUNDED');
});
test('F10: canonical identities are verified after generation, including assertions',()=>{
 const m=matrix();assert.doesNotThrow(()=>validateMatrix(m,context()));
 const arbitrary=structuredClone(m);arbitrary.criteria[0].criterion_id='UI-ARBITRARY';assert.throws(()=>validateMatrix(arbitrary,context()),/CANONICAL_ID_INVALID/);
 const changed=structuredClone(m);changed.criteria[0].assertions[0].expected='Other result';assert.throws(()=>validateMatrix(changed,context()),/CANONICAL_ASSERTION_ID_INVALID/);
});
function locator(kind='PATH'){return {kind,path:'src/protected.js',symbol:kind==='SYMBOL'?'kept':'NONE',invariant_type:kind==='SYMBOL'?'SYMBOL_UNCHANGED':'FILE_UNCHANGED',expected:'UNCHANGED',semantic_justification:'NONE'};}
test('F05: boundary identity comes from explicit locator, independent of narrative spelling',()=>{
 for(const target of ['src/protected.js','./src/protected.js','src\\protected.js','Protected behavior']){const m=matrix();m.preservation.preserve=[{target,justification:'Preserve existing declaration',locator:locator()}];assert.equal(buildBoundaryContract(m).boundaries[0].locator.kind,'PATH');assert.doesNotThrow(()=>validateMatrix(m,context()));}
 const m=matrix();m.preservation.preserve=[{target:'Protected behavior',justification:'Preserve existing declaration'}];assert.throws(()=>validateMatrix(m,context()),/BOUNDARY_LOCATOR_REQUIRED/);
});
test('F05: semantic boundaries cannot conceal explicit repository paths',()=>{
 for(const target of ['./src/protected.js','src\\protected.js']){const m=matrix();m.preservation.forbidden=[{target,justification:'Do not change',locator:{kind:'SEMANTIC',path:'NONE',symbol:'NONE',invariant_type:'SEMANTIC_REVIEW',expected:'UNCHANGED',semantic_justification:'There is allegedly no unique path or symbol for this behavior, requiring semantic review of the complete invariant.'}}];assert.throws(()=>validateMatrix(m,context()),/PATH_DISGUISED_AS_SEMANTIC/);}
});
test('F05: unchanged symbol passes despite neighboring edit; changed or unsupported declaration cannot pass',()=>{
 const before='export function kept(){return 1;}\nfunction neighbor(){return 2;}';
 assert.equal(compareSymbol(before,before.replace('return 2','return 3'),'kept'),'PASS');
 assert.equal(compareSymbol(before,before.replace('return 1','return 4'),'kept'),'FAIL');
 for(const source of ['/*\nfunction kept(){return 1;}\n*/','function outer(){\nfunction kept(){return 1;}\n}','function kept(){return /pattern/;}','const kept=()=>1;'])assert.equal(compareSymbol(source,source,'kept'),'NON_VERIFIABLE');
});
test('F11: final schema requires a complete deterministic candidate inventory',()=>{assert.throws(()=>schemaFor('final'),/SCAN_CANDIDATES_REQUIRED/);assert.deepEqual(Object.keys(schemaFor('final',{candidates:[]}).properties.decision_classifications.properties),[]);});
function glob(pattern,file){return new RegExp('^'+pattern.split('**').map(s=>s.split('*').map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('[^/]*')).join('.*')+'$').test(file);}
test('F06/F12/F15: actual native event filters exclude evidence, retain every normative report, classify once',()=>{
 const wf=parse(fs.readFileSync(path.join(root,'.github/workflows/kodjo-v2-pilot-tests.yml'),'utf8')),patterns=wf.on.pull_request.paths;
 const matches=file=>patterns.reduce((included,p)=>glob(p.startsWith('!')?p.slice(1):p,file)?!p.startsWith('!'):included,false);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'.github/orchestration/normative-inputs.json')));
 for(const p of manifest.files){assert.equal(matches(p),true,p);assert.equal(classifyFiles([p]).category,'NORMATIVE_PROTOCOL_CHANGE');}
 for(const p of ['.github/orchestration/reports/2030-01-01_NEW_EVIDENCE.md','.github/orchestration/reports/audits/run.md']){assert.equal(matches(p),false);assert.equal(classifyFiles([p]).full_windows_required,false);}
 for(const p of ['.github/workflows/kodjo-slice-plan-review.yml','.github/workflows/kodjo-slice-finalize.yml'])assert.equal(matches(p),true,p);
 assert.equal(matches('scripts/kodjo/runtime.js'),true);assert.equal(matches('.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.51.md'),true);
 assert.equal(Object.values(wf.jobs).flatMap(j=>j.steps||[]).filter(s=>(s.run||'').includes('node scripts/kodjo/classify-protocol-impact.js')).length,1);
 assert.equal(wf.jobs.protocol.outputs.full_windows_required,'${{ needs.classify.outputs.full_required }}');
});
test('F03/F07/F13: final replay enables component proof; hierarchy coherent; auditor lacks write token',()=>{
 const finalize=fs.readFileSync(path.join(root,'.github/workflows/kodjo-slice-finalize.yml'),'utf8');assert.match(finalize,/CRITERION_COMPLETE'\)\{\s+\$env:KODJO_REQUIRE_COMPONENT_PROOF='1'/);
 assert.match(finalize,/git worktree add --detach -- \$finalApplication \$head/);assert.match(finalize,/Push-Location \$finalApplication/);assert.match(finalize,/node \$reviewVerifier validate/);
 const manifest=fs.readFileSync(path.join(root,'.github/orchestration/PACKAGE_MANIFEST.md'),'utf8'),hierarchy=manifest.split('## Hiérarchie')[1].split('\n## ')[0];assert.match(manifest,/0\.6\.51/);assert.match(hierarchy,/0\.6\.51/);assert.match(hierarchy,/0\.6\.47/);assert.doesNotMatch(hierarchy,/0\.6\.4[56]/);
 const wf=parse(fs.readFileSync(path.join(root,'.github/workflows/kodjo-v2-next-evolution-independent-audit.yml'),'utf8'));assert.equal(wf.permissions.issues,undefined);assert.equal(wf.jobs['publish-evidence'].permissions.issues,'write');
});

test('F04: revision status is consumed, published and archived, never executed as a standalone path',()=>{
 for(const name of ['plan','initial-plan']){
  const wf=parse(fs.readFileSync(path.join(root,'.github/workflows/kodjo-v2-slice-'+name+'.yml'),'utf8'));
  const blocks=Object.values(wf.jobs).flatMap(j=>j.steps||[]).map(s=>s.run||'').filter(s=>s.includes('verify-bounded-plan-revision.js'));
  assert.equal(blocks.length,1);const block=blocks[0];assert.match(block,/revision_status=\$\(jq -er '\.status'/);assert.match(block,/<KODJO_PLAN_REVISION_STATUS_JSON>/);
  assert.doesNotMatch(block,/^\s*\/tmp\/[^\n]+\/plan-revision-status\.json\s*$/m);
  const uploads=Object.values(wf.jobs).flatMap(j=>j.steps||[]).filter(s=>s.uses==='actions/upload-artifact@v4');assert.ok(uploads.some(s=>(s.with.path||'').includes('plan-revision-status.json')));
 }
});
