'use strict';

const { canonicalJson, sha256, normalizeRepoPath, extractTaggedJson, fail } = require('./plan-impact');

const REQUIREMENT_SCHEMA = 'kodjo.requirement-contract.v1';
const TEST_SCHEMA = 'kodjo.test-contract.v1';
const BOUNDARY_SCHEMA = 'kodjo.boundary-contract.v1';
const NON_UI_TYPES = new Set(['FUNCTIONAL','DATA','TECHNICAL','MIGRATION','PRESERVATION']);
const PROOF_TYPES = new Set(['FUNCTIONAL_TEST','STATIC_ANALYSIS','VISUAL_COMPARE','ACCESSIBILITY_CHECK','DEVICE_CHECK']);
const { TEST_PATH } = require('./ui-criteria-contract');
const PATH_TARGET = /^(?:app|src|tests|assets|docs|scripts)\//;

function text(value, code, label) {
  if (typeof value !== 'string' || !value.trim()) fail(code, label);
  return value.trim();
}
function uniquePaths(values, code, label) {
  if (!Array.isArray(values)) fail(code, label);
  const out = values.map((value) => normalizeRepoPath(text(value, code, label), label));
  if (new Set(out).size !== out.length) fail(code, label + ': duplicate');
  return out.sort();
}
function requirementId(domain, type, source) {
  const identity = canonicalJson({
    domain, requirement_type:type,
    source:{path:source.path, locator:source.locator, requirement:source.requirement},
  });
  return 'REQ-' + sha256(identity).slice(0,16).toUpperCase();
}
function normalizeNonUiRequirements(rows, scope, requireNoTestReason=false) {
  if (!Array.isArray(rows)) fail('REQUIREMENT_CONTRACT_INVALID','non_ui_requirements must be an array');
  const ids = new Set();
  return rows.map((row,index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) fail('REQUIREMENT_CONTRACT_INVALID','row '+index);
    const source = row.source || {};
    const normalizedSource = {
      path: normalizeRepoPath(text(source.path,'REQUIREMENT_SOURCE_INVALID','source.path'),'source.path'),
      locator: text(source.locator,'REQUIREMENT_SOURCE_INVALID','source.locator'),
      requirement: text(source.requirement,'REQUIREMENT_SOURCE_INVALID','source.requirement'),
    };
    const type = text(row.requirement_type,'REQUIREMENT_TYPE_INVALID','requirement_type');
    if (!NON_UI_TYPES.has(type)) fail('REQUIREMENT_TYPE_INVALID',type);
    const targets = uniquePaths(row.change_targets,'REQUIREMENT_TARGET_INVALID','change_targets');
    if (!targets.length) fail('REQUIREMENT_TARGET_INVALID','empty');
    for (const target of targets) if (!scope.has(target)) fail('REQUIREMENT_TARGET_OUT_OF_SCOPE',target);
    const tests = uniquePaths(row.tests || [],'REQUIREMENT_TEST_INVALID','tests');
    const proofs = Array.isArray(row.proof_required) ? row.proof_required.map(String).sort() : [];
    if (!proofs.length || proofs.some((p)=>!PROOF_TYPES.has(p)) || new Set(proofs).size!==proofs.length) fail('REQUIREMENT_PROOF_INVALID',String(index));
    if (proofs.includes('FUNCTIONAL_TEST') && tests.length === 0) fail('REQUIREMENT_FUNCTIONAL_TEST_BINDING_MISSING',String(index));
    const noAutomatedTestReason = row.no_automated_test_reason;
    if (requireNoTestReason && !tests.length && (typeof noAutomatedTestReason !== 'string' || noAutomatedTestReason.trim().length < 40)) fail('REQUIREMENT_NO_TEST_REASON_REQUIRED',String(index));
    const status = String(row.status || 'DEFINED');
    if (!['DEFINED','CLARIFICATION_REQUIRED'].includes(status)) fail('REQUIREMENT_STATUS_INVALID',status);
    const id = requirementId('NON_UI',type,normalizedSource);
    if (ids.has(id)) fail('REQUIREMENT_ID_COLLISION',id);
    ids.add(id);
    return {requirement_id:id,domain:'NON_UI',requirement_type:type,source:normalizedSource,change_targets:targets,tests,proof_required:proofs,status,...(noAutomatedTestReason!==undefined?{no_automated_test_reason:String(noAutomatedTestReason).trim()}: {})};
  }).sort((a,b)=>a.requirement_id.localeCompare(b.requirement_id));
}
function uiRequirements(matrix) {
  const criteria = Array.isArray(matrix && matrix.criteria) ? matrix.criteria : [];
  return criteria.map((criterion) => {
    const source = criterion.source;
    const id = requirementId('UI','UI',source);
    return {
      requirement_id:id, domain:'UI', requirement_type:'UI',
      source:{path:source.path,locator:source.locator,requirement:source.requirement},
      change_targets:[...(criterion.change_targets||[])].sort(),
      tests:[...(criterion.tests||[])].sort(),
      proof_required:[...(criterion.proof_required||[])].sort(),
      status:'DEFINED',
      ui_binding:{criterion_id:criterion.criterion_id,component_decision:criterion.component_decision,selected_component:criterion.selected_component},
      assertions:Array.isArray(criterion.assertions)?criterion.assertions.map(a=>({assertion_id:a.assertion_id,property_type:a.property_type,expected:a.expected,proof_required:[...(a.proof_required||[])].sort()})):[],
    };
  });
}
function buildRequirementContract(uiMatrix, nonUiRows, scope) {
  const rows=[...uiRequirements(uiMatrix),...normalizeNonUiRequirements(nonUiRows,scope,uiMatrix?.schema==='kodjo.ui-criteria.v3')].sort((a,b)=>a.requirement_id.localeCompare(b.requirement_id));
  if (!rows.length) fail('REQUIREMENT_CONTRACT_EMPTY');
  const ids=rows.map(r=>r.requirement_id);
  if(new Set(ids).size!==ids.length)fail('REQUIREMENT_ID_DUPLICATE');
  const covered = new Set(rows.flatMap(row=>row.change_targets));
  for (const target of scope) if (!TEST_PATH.test(target) && !covered.has(target)) fail('NON_UI_SCOPE_COVERAGE_INCOMPLETE',target);
  return {schema:REQUIREMENT_SCHEMA,requirement_count:rows.length,requirement_ids_sha256:sha256(ids),requirements:rows};
}
function buildTestContract(requirementContract) {
  const bindings=[];
  for(const req of requirementContract.requirements){
    for(const testPath of req.tests||[]) bindings.push({requirement_id:req.requirement_id,test_path:testPath,proof_type:'FUNCTIONAL_TEST'});
  }
  bindings.sort((a,b)=>(a.requirement_id+':'+a.test_path).localeCompare(b.requirement_id+':'+b.test_path));
  const exemptions=requirementContract.requirements.filter(req=>!req.tests.length&&req.no_automated_test_reason).map(req=>({requirement_id:req.requirement_id,status:'NO_AUTOMATED_TEST',justification:req.no_automated_test_reason}));
  return {schema:TEST_SCHEMA,binding_count:bindings.length,bindings,...(exemptions.length?{no_automated_tests:exemptions}: {})};
}
function boundaryEntry(category, entry, structured=false) {
  const target=text(entry && entry.target,'BOUNDARY_INVALID',category+'.target');
  const justification=text(entry && entry.justification,'BOUNDARY_INVALID',category+'.justification');
  if(structured){
    const {normalizeBoundaryLocator}=require('./ui-criteria-contract');
    return {category,target,justification,locator:normalizeBoundaryLocator(entry.locator,target)};
  }
  let locator={kind:'SEMANTIC',value:target};
  if(PATH_TARGET.test(target)){
    const value=normalizeRepoPath(target,category+'.target');
    locator={kind:'PATH',value};
  }
  return {category,target,justification,locator};
}
function buildBoundaryContract(uiMatrix) {
  const p=(uiMatrix&&uiMatrix.preservation)||{preserve:[],forbidden:[]};
  const rows=[
    ...(Array.isArray(p.preserve)?p.preserve.map(x=>boundaryEntry('PRESERVE',x,uiMatrix.schema==='kodjo.ui-criteria.v3')):[]),
    ...(Array.isArray(p.forbidden)?p.forbidden.map(x=>boundaryEntry('FORBIDDEN',x,uiMatrix.schema==='kodjo.ui-criteria.v3')):[]),
  ].sort((a,b)=>(a.category+':'+a.target).localeCompare(b.category+':'+b.target));
  return {schema:BOUNDARY_SCHEMA,boundary_count:rows.length,boundaries:rows};
}
function tagged(markdown,tag,required=true){
  try{return extractTaggedJson(markdown,tag,required?'REQUIREMENT_CONTRACT_MISSING':'REQUIREMENT_CONTRACT_OPTIONAL');}
  catch(error){if(!required&&String(error.code||'').includes('OPTIONAL'))return null;throw error;}
}
function verifyEmbedded(markdown) {
  const impact=extractTaggedJson(markdown, markdown.includes('<KODJO_VNEXT_SCOPE_JSON>') ? 'KODJO_VNEXT_SCOPE_JSON' : 'KODJO_PLAN_IMPACT_JSON');
  if(markdown.includes('<KODJO_VNEXT_SCOPE_JSON>') && (impact.schema !== 'kodjo.vnext.downstream-scope.v1' || !/^[0-9a-f]{64}$/.test(impact.plan_contract_hash)))fail('VNEXT_DOWNSTREAM_SCOPE_INVALID');
  const ui=extractTaggedJson(markdown,'KODJO_UI_CRITERIA_MATRIX_JSON');
  const nonUi=extractTaggedJson(markdown,'KODJO_NON_UI_REQUIREMENTS_JSON');
  const scope=new Set((impact.scope_allow||[]).map(p=>normalizeRepoPath(p,'scope_allow')));
  if(ui.schema==='kodjo.ui-criteria.v3'){
    const {validateMatrix,isUiPath}=require('./ui-criteria-contract');
    validateMatrix(ui,{scope,uiPaths:[...scope].filter(isUiPath),requireAssertions:true});
  }
  const Delivery=require('./vnext-delivery-preservation');
  const preservation=Delivery.fromMarkdown(markdown);
  if(preservation && canonicalJson([...scope].sort())!==canonicalJson([...preservation.correction_write_scope].sort()))fail('VNEXT_DELIVERY_CORRECTION_SCOPE_DRIFT');
  const expectedReq=buildRequirementContract(Delivery.merge(ui,preservation),nonUi,scope);
  const expectedTests=buildTestContract(expectedReq);
  const expectedBoundaries=buildBoundaryContract(ui);
  const actualReq=extractTaggedJson(markdown,'KODJO_REQUIREMENT_CONTRACT_JSON');
  const actualTests=extractTaggedJson(markdown,'KODJO_TEST_CONTRACT_JSON');
  const actualBoundaries=extractTaggedJson(markdown,'KODJO_BOUNDARY_CONTRACT_JSON');
  if(canonicalJson(actualReq)!==canonicalJson(expectedReq))fail('REQUIREMENT_CONTRACT_DRIFT');
  if(canonicalJson(actualTests)!==canonicalJson(expectedTests))fail('TEST_CONTRACT_DRIFT');
  if(canonicalJson(actualBoundaries)!==canonicalJson(expectedBoundaries))fail('BOUNDARY_CONTRACT_DRIFT');
  return {requirement_contract:expectedReq,test_contract:expectedTests,boundary_contract:expectedBoundaries};
}

module.exports={
  REQUIREMENT_SCHEMA,TEST_SCHEMA,BOUNDARY_SCHEMA,NON_UI_TYPES,PROOF_TYPES,
  requirementId,normalizeNonUiRequirements,buildRequirementContract,buildTestContract,buildBoundaryContract,verifyEmbedded,
};
