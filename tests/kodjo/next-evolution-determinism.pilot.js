'use strict';

const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const {parse}=require('../../scripts/kodjo/lib/yaml');

const root=path.resolve(__dirname,'../..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');

const {stabilizeUiIdentities,decode,schemaFor,validateSourceBindings}=require('../../scripts/kodjo/generate-ui-plan-contract');
const {verify:verifyBoundedRevision}=require('../../scripts/kodjo/verify-bounded-plan-revision');
const {classifyFiles,diff:impactDiff}=require('../../scripts/kodjo/classify-protocol-impact');
const {detect:detectClosure}=require('../../scripts/kodjo/detect-v2-closure-inconsistency');
const {decide:decidePlanRetry}=require('../../scripts/kodjo/decide-plan-review-retry');
const {classifyLog}=require('../../scripts/kodjo/classify-planning-failure');
const {validateMatrix}=require('../../scripts/kodjo/lib/ui-criteria-contract');
const {buildRequirementContract,buildTestContract,buildBoundaryContract}=require('../../scripts/kodjo/lib/requirement-contract');
const {normalize:normalizeFindings}=require('../../scripts/kodjo/lib/review-findings');
const {closeRegistry}=require('../../scripts/kodjo/close-v2-activation');
const {classify,inventory}=require('../../scripts/kodjo/lib/artifact-policy');
const {resolveImplementationReviewPolicy}=require('../../scripts/kodjo/resolve-implementation-review-policy');
const {repoPath}=require('../../scripts/kodjo/verify-test-contract-results');
const {verify:verifyIndependentAudit,EXPECTED_MATRIX_IDS}=require('../../scripts/kodjo/verify-independent-protocol-audit');
const {generate:generateBoundedCorrection,deterministicUuid}=require('../../scripts/kodjo/generate-bounded-correction-request');

test('VISUAL_CORRECTION never dereferences the IMPLEMENT-only frozen review runtime',()=>{
  const workflow=read('.github/workflows/kodjo-slice-implementation-review.yml');
  assert.match(workflow,/if \[ "\$\{\{ steps\.gate\.outputs\.v2_operation_kind \}\}" = IMPLEMENT \] && grep -q '<KODJO_REQUIREMENT_CONTRACT_JSON>'/);
});
test('legacy REVISE review can continue with full independent revalidation',()=>{
  assert.equal(verifyBoundedRevision('old plan','verdict=REVISE\n','candidate').status,'LEGACY_UNBOUNDED');
});

function atomicMatrix(){
  return {
    schema:'kodjo.ui-criteria.v2',
    criteria:[{
      criterion_id:'TEMP-ID',
      source:{path:'docs/Specifications-fonctionnelles/05.md',locator:'§1',requirement:'Le bouton confirme la sélection.'},
      risk_types:['FUNCTIONAL','VISUAL'],
      reuse_search:['src/shared/ui/Button.tsx'],
      component_decision:'REUSE',
      selected_component:{path:'src/shared/ui/Button.tsx',export:'Button'},
      decision_justification:'Composant canonique existant.',
      change_targets:['src/features/example/ExampleScreen.tsx'],
      tests:['src/features/example/__tests__/ExampleScreen.test.tsx'],
      proof_required:['FUNCTIONAL_TEST','VISUAL_COMPARE'],
      assertions:[
        {assertion_id:'TEMP-A99',source:{path:'docs/Specifications-fonctionnelles/05.md',locator:'§1'},property_type:'INTERACTION',expected:'Le bouton confirme.',proof_required:['FUNCTIONAL_TEST']},
        {assertion_id:'TEMP-A98',source:{path:'docs/Specifications-fonctionnelles/05.md',locator:'§1'},property_type:'GEOMETRY',expected:'Le bouton reste aligné.',proof_required:['VISUAL_COMPARE']},
      ],
    }],
    preservation:{
      preserve:[{target:'Navigation existante',justification:'Hors changement.'}],
      change:[{target:'Bouton de confirmation',justification:'Exigence ciblée.'}],
      forbidden:[{target:'src/infrastructure/database/migrations/migration001.ts',justification:'Migration historique protégée.'}],
    },
  };
}

test('DET-02/PE-27 stable UI IDs and atomic assertions are deterministic',()=>{
  const a=stabilizeUiIdentities(atomicMatrix());
  const b=stabilizeUiIdentities(atomicMatrix());
  assert.deepEqual(a,b);
  const criterion=a.criteria[0];
  assert.match(criterion.criterion_id,/^UI-[0-9A-F]{12}$/);
  assert.equal(criterion.assertions.length,2);
  for(const assertion of criterion.assertions)assert.match(assertion.assertion_id,new RegExp('^'+criterion.criterion_id+'-A[0-9A-F]{12}$'));
  assert.doesNotThrow(()=>validateMatrix(a,{
    scope:new Set(['src/features/example/ExampleScreen.tsx']),
    uiPaths:['src/features/example/ExampleScreen.tsx'],
    requireAssertions:true,
  }));
});

test('PE-27 insertion leaves existing assertion identities unchanged',()=>{
  const base=atomicMatrix();
  const before=stabilizeUiIdentities(base).criteria[0].assertions.map(a=>a.assertion_id);
  base.criteria[0].assertions.push({assertion_id:'TEMP',source:{path:'docs/Specifications-fonctionnelles/05.md',locator:'§0'},property_type:'CONTENT',expected:'Un nouveau contrôle.',proof_required:['FUNCTIONAL_TEST']});
  const after=stabilizeUiIdentities(base).criteria[0].assertions.map(a=>a.assertion_id);
  for(const id of before)assert.ok(after.includes(id));
});

test('PE-30 flags final evidence while the activation registry remains ACTIVE',()=>{
  const registry={activations:[{slice_id:'X',issue_number:12,status:'ACTIVE'}]};
  const comments={'12':[[{id:42,body:'[KODJO_SLICE] FINAL_OUTPUT\nslice_id=X\nfinal_head=abc\nSTATUT : DONE'}]]};
  assert.equal(detectClosure(registry,comments).anomalies[0].code,'CLOSURE_EVIDENCE_WITH_ACTIVE_REGISTRY');
  assert.deepEqual(detectClosure({...registry,activations:[{...registry.activations[0],status:'CLOSED',closure:{final_head:'abc'}}]},comments).anomalies,[]);
});

test('PE-35 stops the plan review loop after one automatic revision',()=>{
  const user={id:10,user:{login:'MyUncried'},body:'[KODJO_V2] START_INITIAL_PLAN\nslice_id=X'};
  const review=(id)=>({id,user:{login:'github-actions[bot]'},body:'[KODJO_V2] PLAN_REVIEW_OUTPUT\nslice_id=X\nverdict=REVISE'});
  assert.equal(decidePlanRetry([[user,review(11)]],'X',11).status,'RETRY');
  assert.equal(decidePlanRetry([[user,review(11),review(12)]],'X',12).status,'USER_VALIDATION');
  assert.match(read('.github/workflows/kodjo-v2-slice-initial-plan-review.yml'),/decide-plan-review-retry\.js/);
  assert.match(read('.github/workflows/kodjo-v2-slice-plan-review.yml'),/decide-plan-review-retry\.js/);
});

test('PE-33 reworded targeted requirement may supersede its old ID only',()=>{
  const tag=(name,value)=>'<'+name+'>'+JSON.stringify(value)+'</'+name+'>';
  const source={path:'docs/spec.md',locator:'§1',requirement:'Before'};
  const old={requirement_id:'REQ-A',domain:'NON_UI',requirement_type:'FUNCTIONAL',source};
  const changed={...old,requirement_id:'REQ-B',source:{...source,requirement:'After'}};
  const plan=(rows)=>tag('KODJO_REQUIREMENT_CONTRACT_JSON',{requirements:rows});
  const review=tag('KODJO_PLAN_REVIEW_FINDINGS_JSON',{verdict:'REVISE',findings:[{blocking:true,target_kind:'REQUIREMENT_ID',target:'REQ-A'}]});
  assert.equal(verifyBoundedRevision(plan([old]),review,plan([changed])).status,'BOUNDED');
  assert.throws(()=>verifyBoundedRevision(plan([old,{...old,requirement_id:'REQ-C',source:{path:'docs/other.md',locator:'§2',requirement:'Other'}}]),review,plan([changed,{...old,requirement_id:'REQ-D',source:{path:'docs/other.md',locator:'§2',requirement:'Changed'}}])),/PLAN_REVISION_UNTARGETED_CHANGE/);
});

test('PE-36 classifies every implementation transport by its actual artifact name',()=>{
  assert.equal(classify('kodjo-V2-CAT-01-123-recovery').role,'RECOVERY_REQUIRED');
  assert.equal(classify('kodjo-V2-CAT-01-123-recovery-retry').role,'RECOVERY_REQUIRED');
  assert.equal(classify('kodjo-V2-CAT-01-123-result').critical,true);
  assert.equal(classify('kodjo-V2-CAT-01-123-publication-receipt').retention_days,7);
  assert.equal(classify('kodjo-v2-disposable-qualification-123-1').retention_days,90);
});

test('DET-04 keeps exact test evidence at both authoritative review gates',()=>{
  const review=read('.github/workflows/kodjo-slice-implementation-review.yml');
  const finalize=read('.github/workflows/kodjo-slice-finalize.yml');
  assert.match(review,/KODJO_REQUIRE_TEST_CONTRACT_EVIDENCE: '1'/);
  assert.match(review,/KODJO_TEST_CONTRACT_EVIDENCE_FILE: \/tmp\/kodjo-test-contract-evidence\.json/);
  assert.match(review,/<KODJO_TEST_CONTRACT_EVIDENCE_JSON>/);
  assert.match(finalize,/KODJO_REQUIRE_TEST_CONTRACT_EVIDENCE='1'/);
  assert.match(finalize,/V2 implementation review replay is not APPROVE/);
});

test('PE-38 rename classification includes both source and destination',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-impact-'));
  const git=(...args)=>{const r=spawnSync('git',args,{cwd:tmp,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
  try{
    fs.mkdirSync(path.join(tmp,'scripts/kodjo'),{recursive:true});
    fs.mkdirSync(path.join(tmp,'.github/orchestration'),{recursive:true});
    fs.writeFileSync(path.join(tmp,'scripts/kodjo/foo.js'),'x\n');
    git('init');git('config','user.email','test@example.test');git('config','user.name','Test');git('add','.');git('commit','-m','before');
    const base=git('rev-parse','HEAD');
    git('mv','scripts/kodjo/foo.js','.github/orchestration/PROTOCOL_EVOLUTION_BACKLOG.md');git('commit','-m','rename');
    const paths=impactDiff(base,git('rev-parse','HEAD'),tmp);
    assert.equal(classifyFiles(paths).category,'RUNTIME_PROTOCOL_CHANGE');
    assert.equal(paths.length,2);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});

test('DET-08 plan status is computed, never requested from the model',()=>{
  for(const phase of ['draft','final']){
    const schema=schemaFor(phase,{candidates:[]});
    assert.equal(Object.hasOwn(schema.properties,'plan_status'),false);
    assert.equal(schema.required.includes('plan_status'),false);
  }
});

test('PE-33 rejects changes outside blocking review targets and missing contracts',()=>{
  const tag=(name,value)=>`<KODJO_${name}_JSON>\n${JSON.stringify(value)}\n</KODJO_${name}_JSON>\n`;
  const req=(path,value)=>({requirement_id:path,source:{path},change_targets:[path],tests:[],value});
  const base=tag('REQUIREMENT_CONTRACT',{requirements:[req('src/a.ts','old'),req('src/b.ts','old')]});
  const review=tag('PLAN_REVIEW_FINDINGS',{verdict:'REVISE',findings:[{target:'src/a.ts',blocking:true}]});
  assert.deepEqual(verifyBoundedRevision(base,review,tag('REQUIREMENT_CONTRACT',{requirements:[req('src/a.ts','new'),req('src/b.ts','old')]})),{status:'BOUNDED',blocking_findings:1});
  assert.throws(()=>verifyBoundedRevision(base,review,tag('REQUIREMENT_CONTRACT',{requirements:[req('src/a.ts','new'),req('src/b.ts','new')]})),/PLAN_REVISION_UNTARGETED_CHANGE/);
  assert.throws(()=>verifyBoundedRevision(base,review,''),/PLAN_REVISION_CONTRACT_REMOVED_OR_ADDED/);
});

test('P-11 invented test paths are rejected at the exact source HEAD',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-plan-source-'));
  try{
    const git=(...args)=>{const r=spawnSync('git',args,{cwd:dir,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
    git('init','-q');fs.mkdirSync(path.join(dir,'docs'));fs.writeFileSync(path.join(dir,'docs','spec.md'),'Requirement');
    git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','source');
    const head=git('rev-parse','HEAD');
    const requirements={requirements:[{domain:'NON_UI',source:{path:'docs/spec.md'},tests:['tests/invented.test.ts']}]};
    const scan={scan_revision:head,modified_modules:[]};
    assert.throws(()=>validateSourceBindings(requirements,scan,dir,new Set()),/PLAN_TEST_PATH_NOT_AT_HEAD_OR_AUTHORIZED_CREATE/);
    scan.modified_modules=[{path:'tests/invented.test.ts',change:'CREATE'}];
    assert.doesNotThrow(()=>validateSourceBindings(requirements,scan,dir,new Set(['tests/invented.test.ts'])));
    assert.throws(()=>validateSourceBindings(requirements,scan,dir,new Set(['tests/invented.test.ts']),{
      criteria:[{component_decision:'REUSE',selected_component:{path:'src/shared/ui/Imaginary.tsx',export:'Imaginary'}}],
    }),/PLAN_SELECTED_COMPONENT_NOT_AT_HEAD/);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('P-13 new plans require explicit non-UI coverage and source references',()=>{
  const schema=schemaFor('final',{candidates:[]});
  assert.ok(schema.required.includes('non_ui_coverage'));
  assert.deepEqual(schema.properties.non_ui_coverage.required,['status','reason','source_paths']);
  for(const workflow of ['kodjo-v2-slice-initial-plan-review.yml','kodjo-v2-slice-plan-review.yml']){
    assert.match(read('.github/workflows/'+workflow),/unsupported NONE requires VERDICT: REVISE/);
  }
});

test('PE-38 uses four explicit categories and treats unknown paths as full qualification',()=>{
  const classification=(file)=>classifyFiles([file]);
  assert.equal(classification('scripts/kodjo/verify-ui-plan-criteria.js').category,'RUNTIME_PROTOCOL_CHANGE');
  assert.equal(classification('.github/orchestration/reports/2026-09-29_PROTOCOL_DETERMINISM_MATRIX.md').category,'NORMATIVE_PROTOCOL_CHANGE');
  assert.equal(classification('.github/orchestration/PROTOCOL_EVOLUTION_BACKLOG.md').category,'NON_NORMATIVE_DOCUMENTATION');
  assert.equal(classification('docs/new-unknown.md').category,'UNKNOWN');
  assert.equal(classification('docs/new-unknown.md').full_windows_required,true);
  assert.equal(classification('.github/orchestration/PROTOCOL_EVOLUTION_BACKLOG.md').full_windows_required,false);
  assert.equal(classifyFiles(['.github/orchestration/PROTOCOL_EVOLUTION_BACKLOG.md','docs/new-unknown.md']).full_windows_required,true);
});

test('PE-35 classifies planning failures before retry and never retries without recovery',()=>{
  assert.equal(classifyLog('PLAN_SCAN_PATH_INVALID: typo').category,'PREVENTABLE_BY_DETERMINISM');
  assert.equal(classifyLog('CLARIFICATION_REQUIRED').category,'HUMAN_DECISION_REQUIRED');
  assert.equal(classifyLog('runner terminated unexpectedly').auto_retry,false);
  for(const name of ['kodjo-v2-slice-initial-plan.yml','kodjo-v2-slice-plan.yml']){
    assert.match(read('.github/workflows/'+name),/classify-planning-failure\.js/);
  }
});

test('DET-02/04/05 unified requirements derive exact tests and machine-addressable boundaries',()=>{
  const matrix=stabilizeUiIdentities(atomicMatrix());
  const scope=new Set([
    'src/features/example/ExampleScreen.tsx',
    'src/domain/example/example.ts',
  ]);
  const nonUi=[{
    source:{path:'docs/Specifications-fonctionnelles/09.md',locator:'§2',requirement:'La valeur doit être persistée.'},
    requirement_type:'DATA',
    change_targets:['src/domain/example/example.ts'],
    tests:['src/domain/example/__tests__/example.test.ts'],
    proof_required:['FUNCTIONAL_TEST','STATIC_ANALYSIS'],
    status:'DEFINED',
  }];
  const req=buildRequirementContract(matrix,nonUi,scope);
  assert.equal(req.requirement_count,2);
  assert.equal(new Set(req.requirements.map(x=>x.requirement_id)).size,2);
  const tests=buildTestContract(req);
  assert.equal(tests.binding_count,2);
  assert.ok(tests.bindings.every(x=>x.proof_type==='FUNCTIONAL_TEST'));
  const boundaries=buildBoundaryContract(matrix);
  const forbidden=boundaries.boundaries.find(x=>x.category==='FORBIDDEN');
  assert.equal(forbidden.locator.kind,'PATH');
  const preserve=boundaries.boundaries.find(x=>x.category==='PRESERVE');
  assert.equal(preserve.locator.kind,'SEMANTIC');
});

test('DET-03 review findings derive stable IDs and aggregate verdict',()=>{
  const source={findings:[
    {category:'PATH',target_kind:'PATH',target:'src/a.ts',blocking:true,diagnostic:'Chemin invalide.',expected_correction:'Utiliser le chemin réel.',dependency_expansion_required:false,dependency_evidence:''},
    {category:'OTHER',target_kind:'PLAN',target:'technical-plan.md',blocking:false,diagnostic:'Note.',expected_correction:'Aucune action bloquante.',dependency_expansion_required:false,dependency_evidence:''},
  ]};
  const a=normalizeFindings(source),b=normalizeFindings(source);
  assert.deepEqual(a,b);
  assert.equal(a.verdict,'REVISE');
  assert.deepEqual(a.affected_targets,['src/a.ts']);
  assert.ok(a.findings.every(x=>/^RF-[0-9A-F]{16}$/.test(x.finding_id)));
});

test('PE-30 closure is idempotent and evidence-bound',()=>{
  const registry={activations:[{slice_id:'S',status:'ACTIVE',issue_number:1}]};
  const input={slice_id:'S',issue_number:1,final_head:'a'.repeat(40),implementation_review_comment_id:'2',visual_approval_comment_id:'3'};
  const first=closeRegistry(registry,input);
  assert.equal(first.changed,true);
  assert.equal(first.registry.activations[0].status,'CLOSED');
  const second=closeRegistry(first.registry,input);
  assert.equal(second.changed,false);
  assert.throws(()=>closeRegistry(first.registry,{...input,final_head:'b'.repeat(40)}),/DIFFERENT_EVIDENCE/);
});

test('PE-36 artifact roles keep recovery longer and inventory exact bytes',()=>{
  assert.deepEqual(classify('kodjo-v2-recovery-123-1'),{role:'RECOVERY_REQUIRED',retention_days:90,critical:true});
  assert.equal(classify('kodjo-v2-diagnostic-123-1').role,'DIAGNOSTIC');
  const inv=inventory([{artifacts:[
    {name:'kodjo-v2-recovery-1-1',size_in_bytes:10,expired:false},
    {name:'kodjo-v2-diagnostic-2-1',size_in_bytes:5,expired:false},
    {name:'old',size_in_bytes:99,expired:true},
  ]}]);
  assert.equal(inv.artifact_count,2);
  assert.equal(inv.total_bytes,15);
});

test('PE-28 visual correction distinguishes unchanged and changed contract',()=>{
  const common={operation_kind:'VISUAL_CORRECTION',same_slice_id:true,same_approved_plan_binding:true,within_approved_scope:true,prior_slice_review_completed:true};
  const unchanged=resolveImplementationReviewPolicy({...common,introduces_new_requirement:false});
  assert.equal(unchanged.contract_status,'CONTRACT_UNCHANGED');
  assert.equal(unchanged.plan_revision_forbidden,true);
  const changed=resolveImplementationReviewPolicy({...common,introduces_new_requirement:true});
  assert.equal(changed.contract_status,'CONTRACT_CHANGED');
  assert.equal(changed.plan_revision_required,true);
});

test('PE-29 handoff is explicitly actionable',()=>{
  const w=read('.github/workflows/kodjo-v2-plan-handoff-materialize.yml');
  assert.match(w,/approval_action=ADD_REACTION_\+1/);
  assert.match(w,/next_action=ADD_REACTION_THEN_COMMENT/);
  assert.match(w,/\[KODJO_V2\] VALIDATE_PLAN_HANDOFF/);
  assert.match(w,/approval_url=\$HANDOFF_URL/);
});

test('PE-37/38 prevent obsolete and report-only heavy pilot work',()=>{
  const w=read('.github/workflows/kodjo-v2-pilot-tests.yml');
  assert.match(w,/group: kodjo-v2-pilot-/);
  assert.match(w,/cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/);
  assert.match(w,/!\.github\/orchestration\/reports\/\*\*/);
  assert.doesNotMatch(w,/!\.github\/orchestration\/reports\/2026-09-29_PROTOCOL_DETERMINISM_MATRIX\.md/);
  assert.doesNotMatch(w,/!\.github\/orchestration\/reports\/2026-09-29_PROTOCOL_DETERMINISM_AUDIT\.md/);
  assert.doesNotMatch(w,/kodjo-v2-complete-source-/);
});

test('DET-08 model no longer owns review aggregate verdict/device flag',()=>{
  const w=read('.github/workflows/kodjo-slice-implementation-review.yml');
  assert.doesNotMatch(w,/required:\["schema","verdict","device_gate_required"/);
  assert.match(w,/Do not return verdict or device_gate_required/);
  const validator=read('scripts/kodjo/verify-ui-implementation-review.js');
  assert.match(validator,/review\.device_gate_required = Boolean\(input\.device_gate_required\)/);
  assert.match(validator,/review\.verdict=blocking\?'REVISE':'APPROVE'/);
});

test('DET-04 exact Jest path normalization remains repository relative',()=>{
  const p=path.join(root,'tests','kodjo','next-evolution-determinism.pilot.js');
  assert.equal(repoPath(p,root),'tests/kodjo/next-evolution-determinism.pilot.js');
});

test('planning workflows use structured findings and valid atomic revision heredoc',()=>{
  const initial=read('.github/workflows/kodjo-v2-slice-initial-plan-review.yml');
  const revisionReview=read('.github/workflows/kodjo-v2-slice-plan-review.yml');
  const revision=read('.github/workflows/kodjo-v2-slice-plan.yml');
  for(const w of [initial,revisionReview]){
    assert.match(w,/KODJO_REVIEW_FINDINGS_JSON/);
    assert.match(w,/normalize-review-findings\.js/);
    assert.doesNotMatch(w,/End with exactly VERDICT: APPROVE or VERDICT: REVISE/);
  }
  assert.doesNotMatch(revision,/^\s*EOF[ \t]+cat \/tmp\/kodjo-v2-plan\/current-command\.txt/m);
  assert.match(revision,/kodjo\.ui-criteria\.v3/);
  assert.match(revision,/validate-plan-module-paths\.js/);
});


test('independent Claude audit requires exact qualified HEAD, remains read-only and artifact-free',()=>{
  const workflow=read('.github/workflows/kodjo-v2-next-evolution-independent-audit.yml');
  assert.match(workflow,/workflow_dispatch:/);
  assert.deepEqual(parse(workflow).on.pull_request.paths,parse(read('.github/workflows/kodjo-v2-pilot-tests.yml')).on.pull_request.paths);
  assert.doesNotMatch(workflow,/github\.event\.pull_request\.number == 250/);
  assert.match(workflow,/needs: await_qualified_head/);
  assert.match(workflow,/if \[ "\$state" = 'completed:success' \]/);
  assert.match(workflow,/\.head_sha == \$sha/);
  assert.match(workflow,/candidate_sha:/);
  assert.match(workflow,/Candidate PR moved/);
  assert.match(workflow,/npm ci --prefix scripts\/kodjo\/openai-runtime --ignore-scripts --no-audit --no-fund/);
  assert.match(workflow,/node tests\/kodjo\/run-all\.js/);
  assert.match(workflow,/node scripts\/kodjo\/validate-workflows\.js/);
  assert.match(workflow,/Remove-Item Env:GH_TOKEN/);
  assert.match(workflow,/Independent auditor modified checkout/);
  assert.match(workflow,/actions\/upload-artifact@v4/);
  assert.match(workflow,/if: always\(\)/);
  assert.match(read('scripts/kodjo/publish-independent-protocol-audit.js'),/NEXT_EVOLUTION_INDEPENDENT_AUDIT/);
});

test('independent Claude audit mission covers the entire 64-ID determinism matrix',()=>{
  const matrix=read('.github/orchestration/reports/2026-09-29_PROTOCOL_DETERMINISM_MATRIX.md');
  const ids=[...matrix.matchAll(/\| ((?:P|D|T)-\d{2}|DET-\d{2}) \|/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,EXPECTED_MATRIX_IDS);
  const mission=read('.github/orchestration/reports/2026-09-29_PROTOCOL_EVOLUTION_CLAUDE_AUDIT_MISSION.md');
  assert.match(mission,/Pour chaque ligne P-xx, D-xx, T-xx et DET-xx/);
  assert.match(mission,/Une validation tardive d’une sortie libre n’est pas équivalente à une déterminisation en amont/);
  assert.match(mission,/Faux déterminismes/);
  assert.match(mission,/Sur-déterminisation/);
});

test('independent audit output contract refuses incomplete matrix coverage and approve with uncovered IDs',()=>{
  const ids=[...read('.github/orchestration/reports/2026-09-29_PROTOCOL_DETERMINISM_MATRIX.md').matchAll(/^\| ((?:P|D|T)-\d{2}|DET-\d{2}) \|/gm)].map(m=>m[1]);
  const rows=ids.map(id=>({id,status:'COVERED',evidence:'Verified source and implementation for '+id}));
  const body=(overrides={})=>{
    const value={
      schema:'kodjo.protocol-independent-audit.v1',verdict:'APPROVE',
      blocking_findings:0,major_findings:0,minor_findings:0,
      matrix_ids_total:64,matrix_ids_covered:64,matrix_ids_partial:0,
      matrix_ids_not_covered:0,matrix_ids_non_verifiable:0,matrix_rows:rows,
      ...overrides,
    };
    return 'VERDICT: '+value.verdict+'\n<KODJO_INDEPENDENT_PROTOCOL_AUDIT_JSON>\n'+JSON.stringify(value)+'\n</KODJO_INDEPENDENT_PROTOCOL_AUDIT_JSON>\n';
  };
  assert.doesNotThrow(()=>verifyIndependentAudit(body()));
  assert.throws(()=>verifyIndependentAudit(body({matrix_rows:rows.slice(1)})),/MATRIX_COVERAGE_INVALID/);
  assert.throws(()=>verifyIndependentAudit(body({matrix_rows:[...rows.slice(1),rows[1]]})),/MATRIX_ID_INVALID/);
  assert.throws(()=>verifyIndependentAudit(body({matrix_rows:rows.map((r,i)=>i? r:{...r,status:'PARTIAL'})})),/MATRIX_COUNT_MISMATCH/);
  assert.throws(()=>verifyIndependentAudit(body({matrix_ids_covered:63,matrix_ids_not_covered:1,matrix_rows:rows.map((r,i)=>i? r:{...r,status:'NOT_COVERED'})})),/APPROVE_WITH_UNCOVERED/);
  assert.throws(()=>verifyIndependentAudit(body({matrix_ids_covered:63,matrix_ids_non_verifiable:1,matrix_rows:rows.map((r,i)=>i? r:{...r,status:'NON_VERIFIABLE'})})),/APPROVE_WITH_NON_VERIFIABLE/);
});


test('PE-35 bounded correction request is deterministic and cannot recurse past RESUME_DELTA',()=>{
  const queue={
    schema_version:'kodjo.protocol.v2.lean-request.0.6.13',
    slice_id:'S',issue_number:1,source_head:'a'.repeat(40),baseline_head:'a'.repeat(40),
    slice_bootstrap_file:'.github/orchestration/v2-slices/S/slice-bootstrap.json',
    slice_bootstrap_sha256:'b'.repeat(64),mode:'INITIAL',operation_kind:'IMPLEMENT',
    session_id:null,prompt_file:'.github/orchestration/v2-slices/S/implementation-mission.md',
    scope_allow:['src/a.ts'],checks:['jest','typescript','lint'],
    limits:{max_ai_calls:1,max_duration_seconds:3600,max_prompt_bytes:32768,max_total_prompt_bytes:32768,max_rollovers:0},
    request_id:'11111111-1111-4111-8111-111111111111',
    created_at:'2026-09-29T10:00:00.000Z',
    authorized_plan:{plan_path:'.github/orchestration/v2-slices/S/technical-plan.md',plan_blob_oid:'c'.repeat(40),approved_at_commit:'d'.repeat(40),evidence_kind:'ARTIFACT_HASH'},
    independent_review:{review_path:'.github/orchestration/v2-slices/S/independent-review.md',review_blob_oid:'e'.repeat(40),reviewed_plan_blob_oid:'c'.repeat(40),verdict:'APPROVED',evidence_kind:'ARTIFACT_HASH'},
    user_gate:{gate_ref:'issue_comment:1',gated_reference:'c'.repeat(40),decision:'APPROVED',user_login:'MyUncried',evidence_kind:'ORGANISATIONAL'},
  };
  const result={
    status:'IMPLEMENTED_WITH_FAILED_CHECKS',
    session_id:'22222222-2222-4222-8222-222222222222',
    claude_finished_at:'2026-09-29T10:10:00.000Z',
    checks:[{check:'jest',status:'FAIL'}],
  };
  const first=generateBoundedCorrection(queue,result,'123',true);
  const second=generateBoundedCorrection(queue,result,'123',true);
  assert.equal(first.status,'READY');
  assert.deepEqual(first,second);
  assert.equal(first.request.request_id,deterministicUuid(queue.request_id+'|123|CHECKS_FAILED'));
  assert.equal(first.request.mode,'RESUME_DELTA');
  assert.equal(first.request.retry_of_run_id,'123');
  const resumed=generateBoundedCorrection(first.request,{...result,status:'IMPLEMENTED_WITH_FAILED_CHECKS'},'124',true);
  assert.equal(resumed.status,'NOT_REQUIRED');
  assert.equal(resumed.policy.auto_retry,false);
});

test('PE-35 Lean Queue materializes retry only after failed INITIAL checks and uploaded recovery',()=>{
  const workflow=read('.github/workflows/kodjo-v2-lean-queue.yml');
  assert.match(workflow,/Materialize one bounded automatic correction when eligible/);
  assert.match(workflow,/if: failure\(\) && steps\.execute\.outputs\.selected_queue != '' && steps\.diag\.outputs\.dir != ''/);
  assert.match(workflow,/RECOVERY_UPLOAD_OUTCOME: \$\{\{ steps\.recovery_package\.outcome \}\}/);
  assert.match(workflow,/RECOVERY_ARTIFACT_ID: \$\{\{ steps\.recovery_package\.outputs\.artifact-id \}\}/);
  assert.match(workflow,/generate-bounded-correction-request\.js/);
  assert.match(workflow,/AUTO_CORRECTION_QUEUED/);
  assert.match(workflow,/mode=RESUME_DELTA/);
  assert.match(workflow,/ALREADY_EXISTS/);
});
