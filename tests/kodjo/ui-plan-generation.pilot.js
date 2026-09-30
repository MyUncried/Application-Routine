'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {request,decode,stabilizeUiIdentities}=require('../../scripts/kodjo/generate-ui-plan-contract');
const {matrixSchema,validateMatrix,validateShape,contractPrompt}=require('../../scripts/kodjo/lib/ui-criteria-contract');
function validMatrix() {
  const matrix = {
    schema:'kodjo.ui-criteria.v3',
    criteria:[{
      criterion_id:'UI-001',
      source:{path:'docs/Specifications-fonctionnelles/13 – Contrats d’écran.md',locator:'CE-X',requirement:'Afficher le contrôle canonique.'},
      risk_types:['FUNCTIONAL','VISUAL','DEVICE'],
      reuse_search:['src/shared/ui','src/features'],
      component_decision:'REUSE',
      selected_component:{path:'src/shared/ui/ExistingOverlay.tsx',export:'ExistingOverlay'},
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
      preserve:[{locator:{kind:'SEMANTIC',path:'NONE',symbol:'NONE',invariant_type:'SEMANTIC_REVIEW',expected:'UNCHANGED',semantic_justification:'Cette limite porte sur le comportement général hors modification et ne possède pas de fichier ni de symbole unique.'},target:'Navigation existante',justification:'Hors changement demandé.'}],
      change:[{target:'ExampleScreen',justification:'Contrôle UI explicitement modifié.'}],
      forbidden:[{locator:{kind:'SEMANTIC',path:'NONE',symbol:'NONE',invariant_type:'SEMANTIC_REVIEW',expected:'UNCHANGED',semantic_justification:'Cette limite porte sur le comportement général hors modification et ne possède pas de fichier ni de symbole unique.'},target:'Remplacement du shell',justification:'Aucune refonte autorisée.'}],
    },
  };
  const canonical=stabilizeUiIdentities(matrix);
  canonical.criteria[0].assertions.sort((a,b)=>a.property_type.localeCompare(b.property_type));
  return canonical;
}
function payload(matrix=validMatrix()) {
  return {plan_markdown:'# Plan complet',modified_modules:[{path:'src/features/example/ExampleScreen.tsx',change:'MODIFY'}],ui_criteria_matrix:matrix,non_ui_requirements:[],non_ui_coverage:{status:'NONE',reason:'Les sources consultées ne contiennent que des obligations visuelles et aucune exigence métier non visuelle applicable.',source_paths:['docs/Specifications-fonctionnelles/13 – Contrats d’écran.md']},clarifications:[]};
}
function response(value) {return {status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]};}
function validate(matrix) {return validateMatrix(matrix,{scope:new Set(['src/features/example/ExampleScreen.tsx']),uiPaths:['src/features/example/ExampleScreen.tsx']});}

test('KPB-001 all matrix producers share the exact nested contract and executable prompt',()=>{
  for (const phase of ['draft','final']) {
    const req=request(phase,'Mission',{candidates:[]});
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
  ['reuse without component',m=>m.criteria[0].selected_component={path:'NONE',export:'NONE'}],
  ['extend without component',m=>{m.criteria[0].component_decision='EXTEND';m.criteria[0].selected_component={path:'NONE',export:'NONE'};}],
  ['targets wrong type',m=>m.criteria[0].change_targets='src/features/example/ExampleScreen.tsx'],
  ['targets empty',m=>m.criteria[0].change_targets=[]],
  ['invalid path',m=>m.criteria[0].change_targets=['../outside']],
  ['tests wrong type',m=>m.criteria[0].tests={}],
  ['functional without tests',m=>m.criteria[0].tests=[]],
  ['invalid proof enum',m=>m.criteria[0].proof_required=['SCREENSHOT']],
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
test('PRE-1 visual obligations are derived from the same rule as the consumer before identities',()=>{
 for(const property of ['GEOMETRY','RELATION','STYLE','LAYERING','RESPONSIVE']){
  const m=validMatrix();const c=m.criteria[0];c.assertions[1].property_type=property;c.assertions[1].proof_required=['DEVICE_CHECK'];
  c.proof_required=['FUNCTIONAL_TEST','DEVICE_CHECK'];c.risk_types=['FUNCTIONAL','DEVICE'];
  assert.throws(()=>validate(stabilizeUiIdentities(m)),/exige VISUAL_COMPARE/);
  const original=JSON.stringify(m);const output=decode('draft',response(payload(m)));
  const normalized=JSON.parse(output.match(/<KODJO_UI_CRITERIA_MATRIX_JSON>\s*([\s\S]*?)\s*<\/KODJO_UI_CRITERIA_MATRIX_JSON>/)[1]);
  assert.doesNotThrow(()=>validate(normalized));assert.equal(JSON.stringify(m),original);
  const a=normalized.criteria[0].assertions.find(a=>a.property_type===property);
  assert.deepEqual(a.proof_required,['DEVICE_CHECK','VISUAL_COMPARE']);assert.deepEqual(normalized.criteria[0].risk_types,c.risk_types);
  assert.equal(a.expected,c.assertions[1].expected);assert.deepEqual(a.source,c.assertions[1].source);
  const {assertionIdentity}=require('../../scripts/kodjo/lib/ui-identities');assert.equal(a.assertion_id,assertionIdentity(normalized.criteria[0].criterion_id,a));
 }
});
test('PRE-1 serialized normalization executes in isolation with the same consumer outcomes',()=>{
 const code=contractPrompt().split('BEGIN_EXECUTABLE_UI_NORMALIZATION\n')[1].split('\nEND_EXECUTABLE_UI_NORMALIZATION')[0];
 const sandbox=require('node:vm').createContext({require(name){assert.ok(['node:path','node:crypto'].includes(name));return require(name);}});
 require('node:vm').runInContext(code,sandbox);
 const context={scope:new Set(['src/features/example/ExampleScreen.tsx']),uiPaths:['src/features/example/ExampleScreen.tsx']};
 function outcome(fn,m){try{return {value:JSON.parse(JSON.stringify(fn(m,context)))}}catch(e){assert.notEqual(e.name,'ReferenceError',e.message);return {error:e.code||e.message};}}
 const runtime=require('../../scripts/kodjo/lib/ui-criteria-contract').validateMatrix;
 const prompted=(matrix,context)=>{const result=sandbox.normalizeMatrix(matrix,context);validateShape(matrix,matrixSchema);return result;};
 for(const mutate of [()=>{},...negativeCases.map(([,fn])=>fn),
  m=>m.preservation.preserve[0].locator.semantic_justification='Trop court',
  m=>m.preservation.preserve[0].locator.semantic_justification='Préserver le comportement du fichier app/features/session et ses dépendances sans aucune modification.',
  m=>m.preservation.preserve[0].locator.path='src/domain/model.ts',
  m=>m.preservation.preserve[0].locator={kind:'PATH',path:'src/domain/model.ts',symbol:'NONE',invariant_type:'FILE_UNCHANGED',expected:'UNCHANGED',semantic_justification:'NONE'},
  m=>m.preservation.forbidden[0].locator={kind:'PATH',path:'src/domain/new.ts',symbol:'NONE',invariant_type:'PATH_ABSENT',expected:'ABSENT',semantic_justification:'NONE'},
  m=>m.preservation.preserve[0].locator={kind:'SYMBOL',path:'src/domain/model.ts',symbol:'Model',invariant_type:'SYMBOL_UNCHANGED',expected:'UNCHANGED',semantic_justification:'NONE'},
  m=>m.preservation.preserve[0].locator={kind:'PATH',path:'src/domain/model.ts',symbol:'NONE',invariant_type:'FILE_UNCHANGED',expected:'UNCHANGED',semantic_justification:'Une justification de chemin ne peut pas remplacer la sentinelle attendue.'},
 ]){const m=validMatrix();mutate(m);assert.deepEqual(outcome(prompted,m),outcome(runtime,m));}
 for(const kind of ['GEOMETRY','RELATION','STYLE','LAYERING','RESPONSIVE']){
  const m=validMatrix();m.criteria[0].assertions[1].property_type=kind;m.criteria[0].assertions[1].proof_required=['DEVICE_CHECK'];m.criteria[0].proof_required=['FUNCTIONAL_TEST','DEVICE_CHECK'];m.criteria[0].risk_types=['FUNCTIONAL','DEVICE'];
  const canonical=stabilizeUiIdentities(m);assert.deepEqual(outcome(prompted,canonical),outcome(runtime,canonical));
 }
 for(const source of [code,code.replace(/\r?\n/g,'\r\n')]){
  const broken=require('node:vm').createContext({require});
  const mutated=source.replace(/(function normalizeMatrix\([^]*?\{)\r?\n/,'$1\n futureNormalizationRule();\n');
  assert.notEqual(mutated,source,'negative witness must actually inject the missing dependency');
  require('node:vm').runInContext(mutated,broken);
  assert.throws(()=>outcome(broken.normalizeMatrix,validMatrix()),/futureNormalizationRule/);
 }
});
test('PRE-1 construction preserves duplicate and unallocated proof rejection and semantic obligations',()=>{
 for(const mutate of [m=>m.criteria[0].assertions[0].proof_required.push('FUNCTIONAL_TEST'),m=>m.criteria[0].proof_required.push('FUNCTIONAL_TEST'),m=>m.criteria[0].proof_required.push('ACCESSIBILITY_CHECK'),m=>{m.criteria[0].assertions[0].property_type='INTERACTION';m.criteria[0].assertions[0].proof_required=['DEVICE_CHECK'];}]){
  const m=validMatrix();mutate(m);assert.throws(()=>decode('draft',response(payload(m))));
 }
 const m=validMatrix();const decoded=decode('draft',response(payload(m)));const again=decode('draft',response(payload(JSON.parse(decoded.match(/<KODJO_UI_CRITERIA_MATRIX_JSON>\s*([\s\S]*?)\s*<\/KODJO_UI_CRITERIA_MATRIX_JSON>/)[1]))));assert.equal(decoded,again);
});
test('PRE-1 failed decode preserves raw responses selected by the real always-upload step',()=>{
 const workflow=require('../../scripts/kodjo/lib/yaml').parse(fs.readFileSync(path.join(__dirname,'../../.github/workflows/kodjo-v2-slice-initial-plan.yml'),'utf8'));
 const step=workflow.jobs.plan.steps.find(s=>s.name==='Preserve initial planning evidence');assert.equal(step.if,'always()');
 for(const filename of ['draft-response.json','final-response.json'])assert.ok(step.with.path.split(/\r?\n/).includes('/tmp/kodjo-v2-initial/'+filename));
 const value=response(payload());value.output[0].content[0].text=JSON.stringify({...payload(),ui_criteria_matrix:{schema:'invalid'}});
 const directory=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'kodjo-rejected-response-'));try{
  const file=path.join(directory,'final-response.json');const raw=JSON.stringify(value);fs.writeFileSync(file,raw);
  const r=require('node:child_process').spawnSync(process.execPath,[path.join(__dirname,'../../scripts/kodjo/generate-ui-plan-contract.js'),'decode','draft',file,path.join(directory,'plan.md')],{encoding:'utf8'});
  assert.notEqual(r.status,0);assert.equal(fs.readFileSync(file,'utf8'),raw);assert.equal(fs.existsSync(path.join(directory,'plan.md')),false);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
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
  const value=payload({schema:'kodjo.ui-criteria.v3',criteria:[],preservation:{preserve:[],change:[],forbidden:[]}});
  value.modified_modules=[{path:'scripts/example.js',change:'MODIFY'}];
  value.non_ui_requirements=[{source:{path:'docs/example.md',locator:'§1',requirement:'Le script conserve le comportement.'},requirement_type:'TECHNICAL',change_targets:['scripts/example.js'],tests:[],proof_required:['STATIC_ANALYSIS'],status:'DEFINED',no_automated_test_reason:'La preuve porte sur un invariant statique dont le contrôle ne requiert aucune exécution automatisée.'}];
  value.non_ui_coverage={status:'ENUMERATED',reason:'Obligation technique inventoriée.',source_paths:['docs/example.md']};
  assert.doesNotThrow(()=>decode('draft',response(value)));
  const m=validMatrix();m.criteria[0].proof_required[0]='STATIC_ANALYSIS';m.criteria[0].assertions[0].proof_required[0]='STATIC_ANALYSIS';
  assert.doesNotThrow(()=>validate(stabilizeUiIdentities(m)));
});
