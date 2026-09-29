'use strict';

const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');

const root=path.resolve(__dirname,'../..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');

const {stabilizeUiIdentities,decode}=require('../../scripts/kodjo/generate-ui-plan-contract');
const {validateMatrix}=require('../../scripts/kodjo/lib/ui-criteria-contract');
const {buildRequirementContract,buildTestContract,buildBoundaryContract}=require('../../scripts/kodjo/lib/requirement-contract');
const {normalize:normalizeFindings}=require('../../scripts/kodjo/lib/review-findings');
const {closeRegistry}=require('../../scripts/kodjo/close-v2-activation');
const {classify,inventory}=require('../../scripts/kodjo/lib/artifact-policy');
const {resolveImplementationReviewPolicy}=require('../../scripts/kodjo/resolve-implementation-review-policy');
const {repoPath}=require('../../scripts/kodjo/verify-test-contract-results');
const {verify:verifyIndependentAudit,EXPECTED_MATRIX_IDS}=require('../../scripts/kodjo/verify-independent-protocol-audit');

function atomicMatrix(){
  return {
    schema:'kodjo.ui-criteria.v2',
    criteria:[{
      criterion_id:'TEMP-ID',
      source:{path:'docs/Specifications-fonctionnelles/05.md',locator:'§1',requirement:'Le bouton confirme la sélection.'},
      risk_types:['FUNCTIONAL','VISUAL'],
      reuse_search:['src/shared/ui/Button.tsx'],
      component_decision:'REUSE',
      selected_component:'src/shared/ui/Button.tsx',
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
  assert.deepEqual(criterion.assertions.map(x=>x.assertion_id),[criterion.criterion_id+'-A01',criterion.criterion_id+'-A02']);
  assert.doesNotThrow(()=>validateMatrix(a,{
    scope:new Set(['src/features/example/ExampleScreen.tsx']),
    uiPaths:['src/features/example/ExampleScreen.tsx'],
    requireAssertions:true,
  }));
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
  assert.deepEqual(classify('kodjo-v2-recovery-123-1'),{role:'RECOVERY_REQUIRED',retention_days:14,critical:true});
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
  assert.match(w,/next_action=WAIT_USER_APPROVAL/);
  assert.match(w,/approval_url=\$HANDOFF_URL/);
});

test('PE-37/38 prevent obsolete and report-only heavy pilot work',()=>{
  const w=read('.github/workflows/kodjo-v2-pilot-tests.yml');
  assert.match(w,/group: kodjo-v2-pilot-/);
  assert.match(w,/cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/);
  assert.match(w,/!\.github\/orchestration\/reports\/\*\*/);
  assert.match(w,/!\.github\/orchestration\/KODJO_PROTOCOL_NEXT_EVOLUTION_\*\.md/);
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
  assert.doesNotMatch(revision,/EOF\s+cat \/tmp\/kodjo-v2-plan\/current-command\.txt/);
  assert.match(revision,/kodjo\.ui-criteria\.v2/);
  assert.match(revision,/validate-plan-module-paths\.js/);
});


test('independent Claude audit is manual, exact-HEAD, read-only and artifact-free',()=>{
  const workflow=read('.github/workflows/kodjo-v2-next-evolution-independent-audit.yml');
  assert.match(workflow,/workflow_dispatch:/);
  assert.doesNotMatch(workflow,/pull_request:/);
  assert.match(workflow,/candidate_sha:/);
  assert.match(workflow,/Candidate PR moved/);
  assert.match(workflow,/node tests\/kodjo\/run-all\.js/);
  assert.match(workflow,/node scripts\/kodjo\/validate-workflows\.js/);
  assert.match(workflow,/Remove-Item Env:GH_TOKEN/);
  assert.match(workflow,/Independent auditor modified checkout/);
  assert.doesNotMatch(workflow,/actions\/upload-artifact/);
  assert.match(workflow,/NEXT_EVOLUTION_INDEPENDENT_AUDIT/);
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
  const body=(overrides={})=>{
    const value={
      schema:'kodjo.protocol-independent-audit.v1',verdict:'APPROVE',
      blocking_findings:0,major_findings:0,minor_findings:0,
      matrix_ids_total:64,matrix_ids_covered:64,matrix_ids_partial:0,
      matrix_ids_not_covered:0,matrix_ids_non_verifiable:0,
      ...overrides,
    };
    return 'VERDICT: '+value.verdict+'\n<KODJO_INDEPENDENT_PROTOCOL_AUDIT_JSON>\n'+JSON.stringify(value)+'\n</KODJO_INDEPENDENT_PROTOCOL_AUDIT_JSON>\n';
  };
  assert.doesNotThrow(()=>verifyIndependentAudit(body()));
  assert.throws(()=>verifyIndependentAudit(body({matrix_ids_total:63,matrix_ids_covered:63})),/MATRIX_COVERAGE_INVALID/);
  assert.throws(()=>verifyIndependentAudit(body({matrix_ids_covered:63,matrix_ids_not_covered:1})),/APPROVE_WITH_UNCOVERED/);
});
