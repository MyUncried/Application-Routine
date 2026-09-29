'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {request,decode}=require('../../scripts/kodjo/generate-ui-plan-contract');
const {matrixSchema,validateMatrix,contractPrompt}=require('../../scripts/kodjo/lib/ui-criteria-contract');
function validMatrix() {
  return {
    schema:'kodjo.ui-criteria.v2',
    criteria:[{
      criterion_id:'UI-001',
      source:{path:'docs/Specifications-fonctionnelles/13 – Contrats d’écran.md',locator:'CE-X',requirement:'Afficher le contrôle canonique.'},
      risk_types:['FUNCTIONAL','VISUAL','DEVICE'],
      reuse_search:['src/shared/ui','src/features'],
      component_decision:'REUSE',
      selected_component:'ExistingOverlay',
      decision_justification:'Le composant existant couvre le contrat bloquant.',
      change_targets:['src/features/example/ExampleScreen.tsx'],
      tests:['src/features/example/__tests__/ExampleScreen.test.tsx'],
      proof_required:['FUNCTIONAL_TEST','VISUAL_COMPARE','DEVICE_CHECK'],
      assertions:[
        {assertion_id:'UI-001-A01',source:{path:'docs/Specifications-fonctionnelles/13 – Contrats d’écran.md',locator:'CE-X/content'},property_type:'CONTENT',expected:'Le contrôle canonique est présent avec son contenu contractuel.',proof_required:['FUNCTIONAL_TEST']},
        {assertion_id:'UI-001-A02',source:{path:'docs/Specifications-fonctionnelles/13 – Contrats d’écran.md',locator:'CE-X/geometry'},property_type:'GEOMETRY',expected:'La géométrie du contrôle correspond à la source normative.',proof_required:['VISUAL_COMPARE','DEVICE_CHECK']},
      ],
    }],
    preservation:{
      preserve:[{target:'Navigation existante',justification:'Hors changement demandé.'}],
      change:[{target:'ExampleScreen',justification:'Contrôle UI explicitement modifié.'}],
      forbidden:[{target:'Remplacement du shell',justification:'Aucune refonte autorisée.'}],
    },
  };
}
function payload(matrix=validMatrix()) {
  return {plan_markdown:'# Plan complet',modified_modules:[{path:'src/features/example/ExampleScreen.tsx',change:'MODIFY'}],ui_criteria_matrix:matrix,non_ui_requirements:[],clarifications:[],plan_status:'READY_FOR_INDEPENDENT_REVIEW'};
}
function response(value) {return {status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]};}
function validate(matrix) {return validateMatrix(matrix,{scope:new Set(['src/features/example/ExampleScreen.tsx']),uiPaths:['src/features/example/ExampleScreen.tsx']});}

test('KPB-001 all matrix producers share the exact nested contract and executable prompt',()=>{
  for (const phase of ['draft','final']) {
    const req=request(phase,'Mission');
    assert.equal(req.text.format.strict,true);
    assert.deepEqual(req.text.format.schema.properties.ui_criteria_matrix,matrixSchema);
    assert.ok(req.input.includes(contractPrompt()));
  }
  const root=path.resolve(__dirname,'../..');
  const initial=fs.readFileSync(path.join(root,'.github/workflows/kodjo-v2-slice-initial-plan.yml'),'utf8');
  const revised=fs.readFileSync(path.join(root,'.github/workflows/kodjo-v2-slice-plan.yml'),'utf8');
  assert.ok(!initial.includes('generate-ui-plan-contract.js request draft'));
  assert.ok(!initial.includes('generate-ui-plan-contract.js decode draft'));
  assert.ok(initial.includes('generate-ui-plan-contract.js request final'));
  assert.ok(initial.includes('generate-ui-plan-contract.js decode final'));
  for (const phase of ['draft','final']) for (const verb of ['request','decode']) assert.ok(revised.includes('generate-ui-plan-contract.js '+verb+' '+phase));
  assert.ok(!initial.includes('ui_criteria_matrix_json'));
});
test('KPB-001 valid draft and closure output preserve the complete matrix',()=>{
  const value=payload();
  assert.ok(decode('draft',response(value)).includes('KODJO_UI_CRITERIA_MATRIX_JSON'));
  const final={...value,decision_classifications:{}}; delete final.modified_modules;
  assert.ok(decode('final',response(final),{modified_modules:value.modified_modules,candidates:[]}).includes('KODJO_PLAN_DECISIONS_JSON'));
});
const negativeCases = [
  ['observed invalid risk enum',m=>m.criteria[0].risk_types=['INTERACTION']],
  ['observed reuse_search object',m=>m.criteria[0].reuse_search={paths:['src/shared/ui']}],
  ['empty reuse search',m=>m.criteria[0].reuse_search=[]],
  ['invalid component decision',m=>m.criteria[0].component_decision='REPLACE'],
  ['reuse without component',m=>m.criteria[0].selected_component='NONE'],
  ['extend without component',m=>{m.criteria[0].component_decision='EXTEND';m.criteria[0].selected_component='NONE';}],
  ['targets wrong type',m=>m.criteria[0].change_targets='src/features/example/ExampleScreen.tsx'],
  ['targets empty',m=>m.criteria[0].change_targets=[]],
  ['invalid path',m=>m.criteria[0].change_targets=['../outside']],
  ['tests wrong type',m=>m.criteria[0].tests={}],
  ['functional without tests',m=>m.criteria[0].tests=[]],
  ['invalid proof enum',m=>m.criteria[0].proof_required=['SCREENSHOT']],
  ['visual without comparison',m=>m.criteria[0].proof_required=['FUNCTIONAL_TEST','DEVICE_CHECK']],
  ['device without proof',m=>m.criteria[0].proof_required=['FUNCTIONAL_TEST','VISUAL_COMPARE']],
  ['functional without proof',m=>m.criteria[0].proof_required=['DEVICE_CHECK','VISUAL_COMPARE']],
  ['accessibility without proof',m=>m.criteria[0].risk_types.push('ACCESSIBILITY')],
  ['duplicate risks',m=>m.criteria[0].risk_types.push('VISUAL')],
  ['duplicate ids',m=>m.criteria.push(structuredClone(m.criteria[0]))],
  ['missing source',m=>delete m.criteria[0].source],
  ['missing assertions',m=>delete m.criteria[0].assertions],
  ['empty assertions',m=>m.criteria[0].assertions=[]],
  ['bad assertion id',m=>m.criteria[0].assertions[0].assertion_id='UI-001-X'],
  ['unsourced assertion',m=>delete m.criteria[0].assertions[0].source],
  ['geometry without visual proof',m=>m.criteria[0].assertions[1].proof_required=['DEVICE_CHECK']],
  ['unknown field',m=>m.criteria[0].invented=true],
  ['missing preservation block',m=>delete m.preservation.forbidden],
  ['wrong preservation entry type',m=>m.preservation.preserve=['Navigation']],
  ['missing preservation justification',m=>delete m.preservation.change[0].justification],
  ['empty UI change',m=>m.preservation.change=[]],
  ['duplicate preservation target',m=>m.preservation.preserve.push({...m.preservation.preserve[0]})],
  ['missing criteria',m=>m.criteria=[]],
];
for (const [name,mutate] of negativeCases) test('KPB-001 rejected by generation AND deterministic replay: '+name,()=>{
  const m=validMatrix();mutate(m);
  assert.throws(()=>decode('draft',response(payload(m))));
  assert.throws(()=>validate(m));
});
test('KPB-001 incomplete, refused, duplicate markers and ambiguous responses rejected',()=>{
  const value=payload();
  assert.throws(()=>decode('draft',{...response(value),status:'incomplete'}));
  const refused=response(value);refused.output[0].content.push({type:'refusal'});
  assert.throws(()=>decode('draft',refused));
  value.plan_markdown+='<KODJO_UI_CRITERIA_MATRIX_JSON>';
  assert.throws(()=>decode('draft',response(value)));
  const duplicate=response(payload());duplicate.output.push(duplicate.output[0]);
  assert.throws(()=>decode('draft',duplicate));
});
test('KPB-001 non-UI and FUNCTIONAL static-analysis alternative stay supported',()=>{
  const value=payload({schema:'kodjo.ui-criteria.v1',criteria:[],preservation:{preserve:[],change:[],forbidden:[]}});
  value.modified_modules=[{path:'scripts/example.js',change:'MODIFY'}];
  value.non_ui_requirements=[{source:{path:'docs/example.md',locator:'§1',requirement:'Le script conserve le comportement.'},requirement_type:'TECHNICAL',change_targets:['scripts/example.js'],tests:[],proof_required:['STATIC_ANALYSIS'],status:'DEFINED'}];
  assert.doesNotThrow(()=>decode('draft',response(value)));
  const m=validMatrix();m.criteria[0].proof_required[0]='STATIC_ANALYSIS';m.criteria[0].assertions[0].proof_required[0]='STATIC_ANALYSIS';
  assert.doesNotThrow(()=>validate(m));
});
