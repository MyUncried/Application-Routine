#!/usr/bin/env node
'use strict';

const { matrixFingerprint, MATRIX_SCHEMA_V2 } = require('./lib/ui-criteria-contract');
const fs = require('node:fs');
const path = require('node:path');
const { extractTaggedJson, sha256, fail } = require('./lib/plan-impact');
const {inspectImplementation}=require('./lib/implementation-report');
const {verifyEmbedded:verifyRequirementContracts}=require('./lib/requirement-contract');

const INPUT_SCHEMA = 'kodjo.ui-implementation-review-input.v1';
const REVIEW_SCHEMA = 'kodjo.ui-implementation-review.v1';
const BLOCKING_PROOFS = new Set(['FUNCTIONAL_TEST','STATIC_ANALYSIS']);
const DEVICE_PROOFS = new Set(['VISUAL_COMPARE','DEVICE_CHECK']);
const DEFERABLE_PROOFS = new Set([...DEVICE_PROOFS,'ACCESSIBILITY_CHECK']);
const IMPLEMENTATION_STATUSES = new Set(['CONFORME','PARTIELLEMENT_CONFORME','NON_CONFORME','NON_VERIFIABLE']);
const ASSERTION_STATUSES = new Set(['CONFORME','NON_CONFORME','NON_VERIFIABLE','PENDING_DEVICE']);
const PROOF_STATUSES = new Set(['PASS','FAIL','PENDING_DEVICE','NON_VERIFIABLE']);
const PRESERVE_STATUSES = new Set(['PASS','FAIL','NON_VERIFIABLE']);

function componentEvidence(criterion, changedSet, cwd){
  const decision=criterion.component_decision;
  if(decision==='CREATE')return (criterion.change_targets||[]).length>0 &&
    (criterion.change_targets||[]).every(target=>changedSet.has(target)&&fs.existsSync(path.resolve(cwd,target)))
    ? {status:'PASS',reason:'CREATED_TARGET_PRESENT_IN_DELTA'}
    : {status:'FAIL',reason:'CREATED_TARGET_NOT_DELIVERED'};
  if(!criterion.selected_component||typeof criterion.selected_component!=='object')return null;
  const selected=criterion.selected_component;
  const component=path.resolve(cwd,selected.path);
  if(!fs.existsSync(component))return {status:'FAIL',reason:'SELECTED_COMPONENT_MISSING'};
  if(decision==='EXTEND')return changedSet.has(selected.path)
    ? {status:'PASS',reason:'SELECTED_COMPONENT_CHANGED'}
    : {status:'FAIL',reason:'SELECTED_COMPONENT_NOT_CHANGED'};
  // Resolve literal relative imports and repository aliases before checking use.
  let aliases={};
  try { aliases=JSON.parse(fs.readFileSync(path.join(cwd,'tsconfig.json'),'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'')).compilerOptions?.paths||{}; } catch {}
  for(const target of criterion.change_targets||[]){
    const absolute=path.resolve(cwd,target);
    if(!changedSet.has(target)||!fs.existsSync(absolute))continue;
    const source=fs.readFileSync(absolute,'utf8');
    const imports=[...source.matchAll(/\bimport\s+([^;\n]+?)\s+from\s+['"]([^'"]+)['"]/g)];
    for(const match of imports){
      const spec=match[2],binding=match[1];
      let resolved;
      if(spec.startsWith('.'))resolved=path.resolve(path.dirname(absolute),spec);
      else for(const [pattern,targets] of Object.entries(aliases)){
        const [prefix,suffix]=pattern.split('*');
        if(!spec.startsWith(prefix)||!spec.endsWith(suffix||''))continue;
        const middle=spec.slice(prefix.length,suffix? -suffix.length:undefined);
        const target=String(targets?.[0]||'').replace('*',middle);
        resolved=path.resolve(cwd,target);
        break;
      }
      if(!resolved)continue;
      if(![component,component.replace(/\.[cm]?[jt]sx?$/,''),path.join(component,'index')].includes(resolved))continue;
      const name=selected.export;
      const bound=name==='default' ? binding.match(/^\s*([A-Za-z_$][\w$]*)/)?.[1]
        : binding.match(new RegExp('\\b'+name+'\\b(?:\\s+as\\s+([A-Za-z_$][\\w$]*))?'))?.[1]||name;
      if(!bound)continue;
      const remainder=source.replace(match[0],'');
      if(new RegExp('\\b'+bound+'\\b').test(remainder))return {status:'PASS',reason:'EXACT_IMPORT_AND_USE',target};
    }
  }
  return {status:'FAIL',reason:'SELECTED_COMPONENT_USE_NOT_PROVEN'};
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}
function unique(values, code, label) {
  if (!Array.isArray(values)) fail(code, label + ' doit etre un tableau');
  const normalized = values.map((v) => String(v || '').trim());
  if (normalized.some((v) => !v) || new Set(normalized).size !== normalized.length) fail(code, label + ' invalide');
  return normalized;
}
function canonicalProofs(proofs) {
  return Array.isArray(proofs) ? proofs.map((proof) => ({
    proof_type:String(proof && proof.proof_type || ''),
    status:String(proof && proof.status || ''),
    evidence:String(proof && proof.evidence || ''),
  })).sort((a,b)=>a.proof_type.localeCompare(b.proof_type)) : [];
}
function canonicalAssertions(assertions) {
  return Array.isArray(assertions) ? assertions.map((assertion) => ({
    assertion_id:String(assertion && assertion.assertion_id || ''),
    status:String(assertion && assertion.status || ''),
    evidence:String(assertion && assertion.evidence || ''),
    proof_results:canonicalProofs(assertion && assertion.proof_results),
  })).sort((a,b)=>a.assertion_id.localeCompare(b.assertion_id)) : [];
}
function canonicalCriterionResult(row) {
  return {
    criterion_id:String(row && row.criterion_id || ''),
    implementation_status:String(row && row.implementation_status || ''),
    preserve_status:String(row && row.preserve_status || ''),
    evidence:String(row && row.evidence || ''),
    proof_results:canonicalProofs(row && row.proof_results),
    ...(Array.isArray(row && row.assertion_results) ? {assertion_results:canonicalAssertions(row.assertion_results)} : {}),
  };
}
function normalizeInheritedResult(row) {
  const normalized = canonicalCriterionResult(row);
  return normalized;
}
function readPreviousReview(file) {
  if (!file) return null;
  const body = fs.readFileSync(path.resolve(file), 'utf8').trim();
  if (!body) return null;
  if (body.startsWith('{')) return JSON.parse(body);
  return extractTaggedJson(body, 'KODJO_UI_IMPLEMENTATION_REVIEW_JSON', 'UI_IMPLEMENTATION_PREVIOUS_REVIEW_MISSING');
}
function buildInput(planBody, changedFiles, previousReview) {
  const matrix = extractTaggedJson(planBody, 'KODJO_UI_CRITERIA_MATRIX_JSON', 'UI_IMPLEMENTATION_REVIEW_PLAN_MATRIX_MISSING');
  const planContract = extractTaggedJson(planBody, 'KODJO_UI_PLAN_CONTRACT_JSON', 'UI_IMPLEMENTATION_REVIEW_PLAN_CONTRACT_MISSING');
  if (!matrix || !['kodjo.ui-criteria.v1',MATRIX_SCHEMA_V2].includes(matrix.schema)) fail('UI_IMPLEMENTATION_REVIEW_PLAN_MATRIX_INVALID', 'schema matrice invalide');
  if (!planContract || planContract.schema !== 'kodjo.ui-plan-contract.v1') fail('UI_IMPLEMENTATION_REVIEW_PLAN_CONTRACT_INVALID', 'schema contrat invalide');
  if (planContract.matrix_sha256 !== matrixFingerprint(matrix)) fail('UI_IMPLEMENTATION_REVIEW_PLAN_DRIFT', 'matrice != contrat approuve');
  const hasRequirementContract=/<KODJO_REQUIREMENT_CONTRACT_JSON>[\s\S]*?<\/KODJO_REQUIREMENT_CONTRACT_JSON>/.test(planBody);
  if(matrix.schema===MATRIX_SCHEMA_V2&&!hasRequirementContract)fail('REQUIREMENT_CONTRACT_REQUIRED_FOR_V2');
  const requirementContracts=hasRequirementContract?verifyRequirementContracts(planBody):null;
  const nonUiSource=requirementContracts?requirementContracts.requirement_contract.requirements.filter((row)=>row.domain==='NON_UI'):[];
  const uiRequirementByCriterion=new Map(requirementContracts?requirementContracts.requirement_contract.requirements
    .filter((row)=>row.domain==='UI'&&row.ui_binding&&row.ui_binding.criterion_id)
    .map((row)=>[String(row.ui_binding.criterion_id),row]):[]);

  const assertionMode = matrix.schema === MATRIX_SCHEMA_V2;
  const criteria = Array.isArray(matrix.criteria) ? matrix.criteria : [];
  const criterionIds = criteria.map((c) => String(c && c.criterion_id || '')).sort();
  if (criterionIds.some((id) => !id) || new Set(criterionIds).size !== criterionIds.length) {
    fail('UI_IMPLEMENTATION_REVIEW_CRITERIA_INVALID', 'criterion_id absent ou duplique');
  }
  const assertionIds = criteria.flatMap((criterion)=>Array.isArray(criterion.assertions)?criterion.assertions.map((a)=>String(a&&a.assertion_id||'')):[]).sort();
  if (assertionMode) {
    if (assertionIds.some((id)=>!id) || new Set(assertionIds).size!==assertionIds.length) {
      fail('UI_IMPLEMENTATION_REVIEW_ASSERTIONS_INVALID','assertion_id absent ou duplique');
    }
    if (Number(planContract.contract_version)<2 ||
        Number(planContract.assertion_count)!==assertionIds.length ||
        planContract.assertion_ids_sha256!==sha256(assertionIds)) {
      fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_CONTRACT_MISMATCH','assertions != contrat approuve');
    }
  }

  const changed = unique(changedFiles, 'UI_IMPLEMENTATION_REVIEW_CHANGED_FILES_INVALID', 'changed_files').sort();
  const changedSet = new Set(changed);
  const uiApplicable = Boolean(planContract.ui_applicable);
  if (!uiApplicable && criteria.length) fail('NON_UI_PLAN_HAS_UI_CRITERIA', 'contrat non UI contradictoire');

  let previousById = null;
  if (previousReview) {
    if (previousReview.schema !== REVIEW_SCHEMA || !Array.isArray(previousReview.criteria)) {
      fail('UI_IMPLEMENTATION_PREVIOUS_REVIEW_INVALID', 'ancienne revue invalide');
    }
    previousById = new Map(previousReview.criteria.map((row) => [String(row && row.criterion_id || ''), row]));
    const previousIds = [...previousById.keys()].sort();
    if (previousIds.some((id) => !id) || previousById.size !== previousReview.criteria.length ||
        JSON.stringify(previousIds) !== JSON.stringify(criterionIds)) {
      fail('UI_IMPLEMENTATION_PREVIOUS_REVIEW_COVERAGE_MISMATCH', 'ancienne revue != critères approuvés');
    }
    if (assertionMode) {
      for (const criterion of criteria) {
        const prior=previousById.get(String(criterion.criterion_id));
        const expected=(criterion.assertions||[]).map(a=>String(a.assertion_id)).sort();
        const observed=(prior&&prior.assertion_results||[]).map(a=>String(a&&a.assertion_id||'')).sort();
        if (JSON.stringify(expected)!==JSON.stringify(observed)) {
          fail('UI_IMPLEMENTATION_PREVIOUS_REVIEW_ASSERTION_MISMATCH',String(criterion.criterion_id));
        }
      }
    }
  }

  let previousRequirementById=null;
  if(previousReview&&nonUiSource.length){
    const prior=previousReview.non_ui_plan_assessment&&Array.isArray(previousReview.non_ui_plan_assessment.requirements)
      ? previousReview.non_ui_plan_assessment.requirements : [];
    previousRequirementById=new Map(prior.map((row)=>[String(row&&row.requirement_id||''),row]));
    const expected=nonUiSource.map((row)=>row.requirement_id).sort();
    const observed=[...previousRequirementById.keys()].sort();
    if(observed.some((id)=>!id)||previousRequirementById.size!==prior.length||JSON.stringify(expected)!==JSON.stringify(observed)){
      fail('NON_UI_PREVIOUS_REVIEW_COVERAGE_MISMATCH','ancienne revue != requirements approuves');
    }
  }
  const normalizedRequirements=nonUiSource.map((req)=>{
    const targets=[...(req.change_targets||[])].map(String).sort();
    const tests=[...(req.tests||[])].map(String).sort();
    const affectedPaths=[...new Set([...targets,...tests].filter((p)=>changedSet.has(p)))].sort();
    const reviewScope=previousRequirementById&&affectedPaths.length===0?'INHERITED':'AFFECTED';
    const row={...req,review_scope:reviewScope,affected_paths:affectedPaths};
    if(reviewScope==='INHERITED')row.inherited_result=previousRequirementById.get(req.requirement_id);
    return row;
  }).sort((a,b)=>a.requirement_id.localeCompare(b.requirement_id));
  const normalizedCriteria = criteria.map((criterion) => {
    const id = String(criterion.criterion_id);
    const targets = unique(criterion.change_targets || [], 'UI_IMPLEMENTATION_REVIEW_TARGET_INVALID', id + '.change_targets').sort();
    const missingTargets = targets.filter((target) => !changedSet.has(target));
    const tests = Array.isArray(criterion.tests) ? [...criterion.tests].map(String).sort() : [];
    const affectedPaths = [...new Set([...targets, ...tests].filter((target) => changedSet.has(target)))].sort();
    const reviewScope = previousById && affectedPaths.length === 0 ? 'INHERITED' : 'AFFECTED';
    if (!previousById && uiApplicable && missingTargets.length) {
      fail('UI_IMPLEMENTATION_REVIEW_TARGET_NOT_DELIVERED', id + ': ' + missingTargets.join(','));
    }
    const proofs = unique(criterion.proof_required || [], 'UI_IMPLEMENTATION_REVIEW_PROOF_INVALID', id + '.proof_required').sort();
    const assertions = assertionMode ? (criterion.assertions||[]).map((assertion)=>({
      assertion_id:String(assertion.assertion_id),
      source:assertion.source,
      property_type:String(assertion.property_type),
      expected:String(assertion.expected),
      proof_required:unique(assertion.proof_required||[],'UI_IMPLEMENTATION_REVIEW_ASSERTION_PROOF_INVALID',String(assertion.assertion_id)+'.proof_required').sort(),
      device_proof_required:(assertion.proof_required||[]).some((p)=>DEFERABLE_PROOFS.has(String(p))),
    })).sort((a,b)=>a.assertion_id.localeCompare(b.assertion_id)) : [];
    const boundRequirement=uiRequirementByCriterion.get(id);
    const normalized = {
      criterion_id: id,
      ...(boundRequirement?{requirement_id:boundRequirement.requirement_id}:{}),
      source: criterion.source,
      component_decision: criterion.component_decision,
      selected_component: criterion.selected_component,
      ...(assertionMode&&reviewScope==='AFFECTED'&&process.env.KODJO_REQUIRE_COMPONENT_PROOF==='1'
        ?{component_evidence:componentEvidence(criterion,changedSet,process.cwd())}:{}),
      change_targets: targets,
      tests,
      proof_required: proofs,
      ...(assertionMode ? {assertions} : {}),
      device_proof_required: assertionMode
        ? assertions.some((a)=>a.device_proof_required)
        : proofs.some((p) => DEFERABLE_PROOFS.has(p)),
      review_scope: reviewScope,
      affected_paths: affectedPaths,
    };
    if (reviewScope === 'INHERITED') normalized.inherited_result = normalizeInheritedResult(previousById.get(id));
    return normalized;
  }).sort((a,b) => a.criterion_id.localeCompare(b.criterion_id));

  const preservation = matrix.preservation || { preserve:[], change:[], forbidden:[] };
  const boundaryRequirements=requirementContracts
    ? requirementContracts.boundary_contract.boundaries.map((row)=>({
        category:row.category,target:row.target,locator:row.locator,
        machine_status:row.locator&&row.locator.kind==='PATH' ? (changedSet.has(row.locator.value)?'FAIL':'PASS') : null,
      }))
    : [
        ...(Array.isArray(preservation.preserve) ? preservation.preserve.map((x) => ({ category:'PRESERVE', target:String(x.target || ''),machine_status:null })) : []),
        ...(Array.isArray(preservation.forbidden) ? preservation.forbidden.map((x) => ({ category:'FORBIDDEN', target:String(x.target || ''),machine_status:null })) : []),
      ];
  boundaryRequirements.sort((a,b)=>(a.category+':'+a.target).localeCompare(b.category+':'+b.target));
  const deviceGateRequired = normalizedCriteria.some((c) => c.device_proof_required) ||
    normalizedRequirements.some((r)=>(r.proof_required||[]).some((p)=>DEFERABLE_PROOFS.has(String(p))));

  return {
    schema: INPUT_SCHEMA,
    review_mode: (previousById||previousRequirementById) ? 'DELTA_WITH_INHERITANCE' : 'FULL',
    assertion_mode: assertionMode,
    ui_applicable: uiApplicable,
    ui_matrix_sha256: planContract.matrix_sha256,
    criterion_count: normalizedCriteria.length,
    criterion_ids_sha256: sha256(criterionIds),
    ...(assertionMode ? {assertion_count:assertionIds.length,assertion_ids_sha256:sha256(assertionIds)} : {}),
    non_ui_requirement_count: normalizedRequirements.length,
    non_ui_requirements: normalizedRequirements,
    changed_files: changed,
    criteria: normalizedCriteria,
    preservation,
    boundary_requirements: boundaryRequirements,
    device_gate_required: deviceGateRequired,
  };
}
function validateProof(id, proof) {
  const type=String(proof&&proof.proof_type||'');
  const status=String(proof&&proof.status||'');
  if (!PROOF_STATUSES.has(status)) fail('UI_IMPLEMENTATION_REVIEW_PROOF_INVALID', id + ':' + type + ':' + status);
  if (DEVICE_PROOFS.has(type)) {
    if (status !== 'PENDING_DEVICE' && status !== 'FAIL') {
      fail('UI_IMPLEMENTATION_REVIEW_DEVICE_PROOF_UNSUPPORTED', id + ':' + type + ' doit rester PENDING_DEVICE sauf defaut demontre');
    }
  } else if (type === 'ACCESSIBILITY_CHECK') {
    if (!['PASS','PENDING_DEVICE','FAIL'].includes(status)) {
      fail('UI_IMPLEMENTATION_REVIEW_ACCESSIBILITY_PROOF_UNSUPPORTED', id + ':' + type + ':' + status);
    }
  } else if (BLOCKING_PROOFS.has(type)) {
    if (!['PASS','FAIL','NON_VERIFIABLE'].includes(status)) {
      fail('UI_IMPLEMENTATION_REVIEW_PROOF_INVALID', id + ':' + type + ':' + status);
    }
  }
  if (typeof proof?.evidence !== 'string' || !proof.evidence.trim()) {
    fail('UI_IMPLEMENTATION_REVIEW_PROOF_INVALID', id + ':' + type + ': evidence absente');
  }
  return {type,status};
}
function deriveAssertionStatus(input,assertion,proofs) {
  let pending=false;
  for(const proof of proofs){
    const {type,status}=validateProof(assertion.assertion_id,proof);
    enforceMachineProof(input,assertion.assertion_id,type,status);
    if(status==='FAIL')return 'NON_CONFORME';
    if(BLOCKING_PROOFS.has(type)&&status!=='PASS')return 'NON_VERIFIABLE';
    if(type==='ACCESSIBILITY_CHECK'&&status==='NON_VERIFIABLE')return 'NON_VERIFIABLE';
    if(status==='PENDING_DEVICE')pending=true;
  }
  return pending?'PENDING_DEVICE':'CONFORME';
}
function aggregateProofStatus(statuses) {
  if(statuses.includes('FAIL'))return 'FAIL';
  if(statuses.includes('NON_VERIFIABLE'))return 'NON_VERIFIABLE';
  if(statuses.includes('PENDING_DEVICE'))return 'PENDING_DEVICE';
  return 'PASS';
}
function deriveCriterionFromAssertions(input,expected,row) {
  const observed=Array.isArray(row.assertion_results)?row.assertion_results:null;
  if(!observed)fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_RESULTS_MISSING',expected.criterion_id);
  const expectedIds=expected.assertions.map(a=>a.assertion_id).sort();
  const observedIds=observed.map(a=>String(a&&a.assertion_id||'')).sort();
  if(JSON.stringify(expectedIds)!==JSON.stringify(observedIds)) {
    fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_COVERAGE_INCOMPLETE',expected.criterion_id);
  }
  const expectedById=new Map(expected.assertions.map(a=>[a.assertion_id,a]));
  const proofStatuses=new Map();
  const assertionStatuses=[];
  for(const result of observed){
    const id=String(result.assertion_id);
    const assertion=expectedById.get(id);
    if(!ASSERTION_STATUSES.has(String(result.status))) {
      fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_STATUS_INVALID',id);
    }
    if(typeof result.evidence!=='string'||!result.evidence.trim()) {
      fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_EVIDENCE_MISSING',id);
    }
    const proofs=Array.isArray(result.proof_results)?result.proof_results:null;
    if(!proofs)fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_PROOF_INVALID',id+'.proof_results absent');
    const expectedProofs=[...assertion.proof_required].sort();
    const observedProofs=proofs.map(p=>String(p&&p.proof_type||'')).sort();
    if(JSON.stringify(expectedProofs)!==JSON.stringify(observedProofs)) {
      fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_PROOF_COVERAGE_INCOMPLETE',id);
    }
    const derived=deriveAssertionStatus(input,assertion,proofs);
    // A reviewer may identify a semantic defect even when the bound test passed.
    if(String(result.status)!==derived && !(String(result.status)==='NON_CONFORME'&&derived==='CONFORME')) {
      fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_STATUS_DERIVATION_MISMATCH',id+': attendu '+derived);
    }
    assertionStatuses.push(String(result.status));
    for(const proof of proofs){
      const type=String(proof.proof_type), status=String(proof.status);
      if(!proofStatuses.has(type))proofStatuses.set(type,[]);
      proofStatuses.get(type).push(status);
    }
  }
  let criterionStatus='CONFORME';
  if(assertionStatuses.includes('NON_CONFORME'))criterionStatus='NON_CONFORME';
  else if(assertionStatuses.includes('NON_VERIFIABLE')||assertionStatuses.includes('PENDING_DEVICE'))criterionStatus='NON_VERIFIABLE';
  if(String(row.implementation_status)!==criterionStatus) {
    fail('UI_IMPLEMENTATION_REVIEW_CRITERION_DERIVATION_MISMATCH',expected.criterion_id+': attendu '+criterionStatus);
  }
  const criterionProofs=Array.isArray(row.proof_results)?row.proof_results:null;
  if(!criterionProofs)fail('UI_IMPLEMENTATION_REVIEW_PROOF_INVALID',expected.criterion_id+'.proof_results absent');
  const expectedCriterionProofs=[...expected.proof_required].sort();
  const observedCriterionProofs=criterionProofs.map(p=>String(p&&p.proof_type||'')).sort();
  if(JSON.stringify(expectedCriterionProofs)!==JSON.stringify(observedCriterionProofs)) {
    fail('UI_IMPLEMENTATION_REVIEW_PROOF_COVERAGE_INCOMPLETE',expected.criterion_id);
  }
  for(const proof of criterionProofs){
    const validated=validateProof(expected.criterion_id,proof);
    enforceMachineProof(input,expected.criterion_id,validated.type,validated.status);
    const statuses=proofStatuses.get(String(proof.proof_type))||[];
    if(!statuses.length)fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_PROOF_COVERAGE_INCOMPLETE',expected.criterion_id+':'+proof.proof_type);
    const aggregate=aggregateProofStatus(statuses);
    if(String(proof.status)!==aggregate) {
      fail('UI_IMPLEMENTATION_REVIEW_PROOF_DERIVATION_MISMATCH',expected.criterion_id+':'+proof.proof_type+': attendu '+aggregate);
    }
  }
  const pendingOnly=assertionStatuses.every(s=>s==='CONFORME'||s==='PENDING_DEVICE')&&assertionStatuses.includes('PENDING_DEVICE');
  return {criterionStatus,pendingOnly,assertionStatuses};
}

function exactFunctionalTestStatus(input,id){
  const evidence=input&&input.test_contract_evidence;
  if(!evidence||evidence.schema!=='kodjo.test-contract-evidence.v1'||!Array.isArray(evidence.bindings))return null;
  let requirementId=String(id||'');
  if(!requirementId.startsWith('REQ-')){
    const criterion=(input.criteria||[]).find((row)=>String(row&&row.criterion_id||'')===requirementId||
      (row.assertions||[]).some((assertion)=>assertion.assertion_id===requirementId));
    requirementId=String(criterion&&criterion.requirement_id||'');
  }
  if(!requirementId)return 'NON_VERIFIABLE';
  const rows=evidence.bindings.filter((row)=>String(row&&row.requirement_id||'')===requirementId);
  const req=(input.non_ui_requirements||[]).find((row)=>row.requirement_id===requirementId)||
    (input.criteria||[]).find((row)=>row.requirement_id===requirementId);
  const expectedTests=Array.isArray(req&&req.tests)?req.tests:[];
  if(expectedTests.length===0)return 'NON_VERIFIABLE';
  const actualPaths=rows.map((row)=>String(row&&row.test_path||'')).sort();
  if(JSON.stringify(actualPaths)!==JSON.stringify([...expectedTests].sort()))return 'NON_VERIFIABLE';
  const statuses=rows.map((row)=>String(row&&row.status||''));
  if(statuses.includes('FAIL'))return 'FAIL';
  if(statuses.length&&statuses.every((status)=>status==='PASS'))return 'PASS';
  return 'NON_VERIFIABLE';
}
function machineProofStatus(input,id,type){
  const checks=input&&input.implementation_report&&input.implementation_report.machine_evidence&&Array.isArray(input.implementation_report.machine_evidence.checks)
    ? input.implementation_report.machine_evidence.checks : [];
  const by=new Map(checks.map((row)=>[String(row&&row.check||''),String(row&&row.status||'')]));
  if(type==='FUNCTIONAL_TEST'){
    const exact=exactFunctionalTestStatus(input,id);
    if(exact)return exact;
    const status=by.get('jest');
    // A green global Jest run does not establish coverage of this requirement.
    return status==='FAIL'?'FAIL':null;
  }
  if(type==='STATIC_ANALYSIS'){
    const observed=['typescript','lint'].map((name)=>by.get(name));
    if(input.test_contract_evidence?.schema!=='kodjo.test-contract-evidence.v1')return observed.includes('FAIL')?'FAIL':null;
    if(observed.includes('FAIL'))return 'FAIL';
    return observed.every(status=>status==='PASS')?'PASS':'NON_VERIFIABLE';
  }
  return null;
}
function enforceMachineProof(input,id,type,status){
  if(!BLOCKING_PROOFS.has(type))return;
  const expected=machineProofStatus(input,id,type);
  if(expected==='FAIL'&&status==='PASS')fail('UI_IMPLEMENTATION_MACHINE_PROOF_MISMATCH',id+':'+type+': echec machine ignore');
  if(expected==='NON_VERIFIABLE'&&status==='PASS')fail('UI_IMPLEMENTATION_MACHINE_PROOF_MISMATCH',id+':'+type+': preuve exacte absente');
}
function validateReview(input, review) {
  if (!review || review.schema !== REVIEW_SCHEMA) fail('UI_IMPLEMENTATION_REVIEW_OUTPUT_INVALID', 'schema review invalide');
  review.device_gate_required = Boolean(input.device_gate_required);
  const results = Array.isArray(review.criteria) ? review.criteria : null;
  if (!results) fail('UI_IMPLEMENTATION_REVIEW_OUTPUT_INVALID', 'criteria absent');
  const expectedIds = input.criteria.map((c) => c.criterion_id).sort();
  const observedIds = results.map((r) => String(r && r.criterion_id || '')).sort();
  if (JSON.stringify(expectedIds) !== JSON.stringify(observedIds)) {
    fail('UI_IMPLEMENTATION_REVIEW_COVERAGE_INCOMPLETE', 'criteria reviewer != plan');
  }

  let blocking = false;
  const byId = new Map(input.criteria.map((c) => [c.criterion_id, c]));
  for (const row of results) {
    const id = String(row.criterion_id);
    const expected = byId.get(id);
    if(expected.component_evidence && !['PASS','NOT_APPLICABLE'].includes(expected.component_evidence.status))blocking=true;
    if (!IMPLEMENTATION_STATUSES.has(String(row.implementation_status))) {
      fail('UI_IMPLEMENTATION_REVIEW_STATUS_INVALID', id + '.implementation_status');
    }
    if (!PRESERVE_STATUSES.has(String(row.preserve_status))) {
      fail('UI_IMPLEMENTATION_REVIEW_STATUS_INVALID', id + '.preserve_status');
    }
    const reviewScope = expected.review_scope || 'AFFECTED';
    if (reviewScope === 'INHERITED') {
      const observed = canonicalCriterionResult(row);
      const inherited = canonicalCriterionResult(expected.inherited_result);
      if (JSON.stringify(observed) !== JSON.stringify(inherited)) {
        fail('UI_IMPLEMENTATION_REVIEW_INHERITED_DRIFT', id + ': critère non affecté réévalué');
      }
    }
    if (String(row.preserve_status) !== 'PASS') blocking = true;

    if (input.assertion_mode) {
      const derived=deriveCriterionFromAssertions(input,expected,row);
      if(['NON_CONFORME','NON_VERIFIABLE'].includes(derived.criterionStatus)&&!derived.pendingOnly)blocking=true;
    } else {
      if (['PARTIELLEMENT_CONFORME','NON_CONFORME'].includes(String(row.implementation_status))) blocking = true;
      const proofs = Array.isArray(row.proof_results) ? row.proof_results : null;
      if (!proofs) fail('UI_IMPLEMENTATION_REVIEW_PROOF_INVALID', id + '.proof_results absent');
      const expectedProofs = expected.proof_required.slice().sort();
      const observedProofs = proofs.map((p) => String(p && p.proof_type || '')).sort();
      if (JSON.stringify(expectedProofs) !== JSON.stringify(observedProofs)) {
        fail('UI_IMPLEMENTATION_REVIEW_PROOF_COVERAGE_INCOMPLETE', id);
      }
      for (const proof of proofs) {
        const {type,status}=validateProof(id,proof);
        enforceMachineProof(input,id,type,status);
        if (DEVICE_PROOFS.has(type)&&status==='FAIL') blocking=true;
        else if(type==='ACCESSIBILITY_CHECK'&&status==='FAIL')blocking=true;
        else if(BLOCKING_PROOFS.has(type)&&status!=='PASS')blocking=true;
        if(status==='FAIL')blocking=true;
      }
      if (String(row.implementation_status) === 'NON_VERIFIABLE') {
        const deviceOnlyGap = proofs.length > 0 && proofs.every((proof) =>
          String(proof.status) === 'PASS' ||
          (DEFERABLE_PROOFS.has(String(proof.proof_type)) && String(proof.status) === 'PENDING_DEVICE'));
        if (!deviceOnlyGap) blocking = true;
      }
    }
    if (typeof row.evidence !== 'string' || !row.evidence.trim()) {
      fail('UI_IMPLEMENTATION_REVIEW_OUTPUT_INVALID', id + ': evidence absente');
    }
  }
  const boundaries = Array.isArray(review.boundary_results) ? review.boundary_results : null;
  if (!boundaries) fail('UI_IMPLEMENTATION_REVIEW_BOUNDARY_INVALID', 'boundary_results absent');
  const expectedBoundaries = input.boundary_requirements.map((x) => x.category + ':' + x.target).sort();
  const observedBoundaries = boundaries.map((x) => String(x && x.category || '') + ':' + String(x && x.target || '')).sort();
  if (JSON.stringify(expectedBoundaries) !== JSON.stringify(observedBoundaries)) {
    fail('UI_IMPLEMENTATION_REVIEW_BOUNDARY_COVERAGE_INCOMPLETE', 'PRESERVE/FORBIDDEN incomplet');
  }
  const boundaryByKey=new Map(input.boundary_requirements.map((row)=>[row.category+':'+row.target,row]));
  for (const row of boundaries) {
    if (!['PRESERVE','FORBIDDEN'].includes(String(row.category))) {
      fail('UI_IMPLEMENTATION_REVIEW_BOUNDARY_INVALID', 'categorie inconnue');
    }
    if (!PRESERVE_STATUSES.has(String(row.status))) {
      fail('UI_IMPLEMENTATION_REVIEW_BOUNDARY_INVALID', String(row.category) + ':' + String(row.target));
    }
    const key=String(row.category)+':'+String(row.target);
    const expectedBoundary=boundaryByKey.get(key);
    if(expectedBoundary&&expectedBoundary.machine_status==='FAIL'&&String(row.status)==='PASS'){
      fail('UI_IMPLEMENTATION_REVIEW_BOUNDARY_MACHINE_MISMATCH',key+': attendu '+expectedBoundary.machine_status);
    }
    if (String(row.status) !== 'PASS') blocking = true;
    if (typeof row.evidence !== 'string' || !row.evidence.trim()) {
      fail('UI_IMPLEMENTATION_REVIEW_BOUNDARY_INVALID', 'evidence absente');
    }
  }

  if (input.non_ui_requirement_count > 0) {
    const assessment=review.non_ui_plan_assessment;
    const statuses=new Set(['CONFORME','NON_CONFORME','NON_VERIFIABLE']);
    const text=value=>typeof value==='string'&&value.trim();
    if(!assessment||!Array.isArray(assessment.requirements)){
      fail('NON_UI_PLAN_ASSESSMENT_REQUIRED','requirement review required');
    }
    const expectedIds=input.non_ui_requirements.map((row)=>row.requirement_id).sort();
    const observedIds=assessment.requirements.map((row)=>String(row&&row.requirement_id||'')).sort();
    if(JSON.stringify(expectedIds)!==JSON.stringify(observedIds)){
      fail('NON_UI_REQUIREMENT_COVERAGE_MISMATCH','reviewer requirements != plan');
    }
    const expectedById=new Map(input.non_ui_requirements.map((row)=>[row.requirement_id,row]));
    let nonUiBlocking=false;
    for(const row of assessment.requirements){
      const id=String(row.requirement_id);
      const expected=expectedById.get(id);
      if(!statuses.has(String(row.status))||!text(row.evidence))fail('NON_UI_PLAN_ASSESSMENT_INVALID',id);
      if(expected.review_scope==='INHERITED'){
        if(JSON.stringify(row)!==JSON.stringify(expected.inherited_result))fail('NON_UI_REQUIREMENT_INHERITED_DRIFT',id);
      }else{
        const proofs=Array.isArray(row.proof_results)?row.proof_results:null;
        if(!proofs)fail('NON_UI_REQUIREMENT_PROOF_INVALID',id);
        const expectedProofs=[...(expected.proof_required||[])].sort();
        const observedProofs=proofs.map((proof)=>String(proof&&proof.proof_type||'')).sort();
        if(JSON.stringify(expectedProofs)!==JSON.stringify(observedProofs))fail('NON_UI_REQUIREMENT_PROOF_COVERAGE_MISMATCH',id);
        for(const proof of proofs){
          const validated=validateProof(id,proof);
          enforceMachineProof(input,id,validated.type,validated.status);
          if(validated.status==='FAIL'||(BLOCKING_PROOFS.has(validated.type)&&validated.status!=='PASS'))nonUiBlocking=true;
        }
      }
      if(String(row.status)!=='CONFORME')nonUiBlocking=true;
    }
    assessment.status=nonUiBlocking?'NON_CONFORME':'CONFORME';
    if(!text(assessment.evidence))assessment.evidence='Derived from requirement-level results.';
    if(nonUiBlocking)blocking=true;
  } else if (!input.ui_applicable) {
    const assessment = review.non_ui_plan_assessment;
    const statuses = new Set(['CONFORME','NON_CONFORME','NON_VERIFIABLE']);
    const text = value => typeof value === 'string' && value.trim();
    if (!assessment || !statuses.has(assessment.status) || !text(assessment.evidence) ||
        !Array.isArray(assessment.requirements) || !assessment.requirements.length) {
      fail('NON_UI_PLAN_ASSESSMENT_REQUIRED', 'revue motivee du plan complet requise');
    }
    const requirements = new Set();
    for (const row of assessment.requirements) {
      if (!row || !text(row.plan_requirement) || requirements.has(row.plan_requirement) ||
          !statuses.has(row.status) || !text(row.evidence)) {
        fail('NON_UI_PLAN_ASSESSMENT_INVALID', 'exigence, statut ou preuve absent/duplique');
      }
      requirements.add(row.plan_requirement);
      if (row.status !== 'CONFORME') blocking = true;
    }
    if (assessment.status !== 'CONFORME') blocking = true;
  }

  if (input.implementation_report && input.implementation_report.status !== 'COMPLETE') {
    blocking = true;
  }
  const machineEvidence=input.implementation_report?.machine_evidence;
  if(machineEvidence?.out_of_scope_files?.length||machineEvidence?.post_check_drift?.length){
    blocking=true;
    review.scope_status='SCOPE_EXPANSION_REQUIRED';
  }
  review.report_status=input.implementation_report?.status||'NOT_AVAILABLE';
  review.verdict=blocking?'REVISE':'APPROVE';
  return review;
}

try {
  const args = process.argv.slice(2);
  const mode = args[0], planFile = args[1], changedFile = args[2], third = args[3];
  if (!['prepare','validate'].includes(mode) || !planFile || !changedFile || !third) {
    throw new Error('USAGE: verify-ui-implementation-review.js <prepare|validate> <plan.md> <changed-files.txt> <review.json|output.json> [output.json|implementation.md] [implementation.md|previous-review.md] [previous-review.md]');
  }
  const planBody = fs.readFileSync(path.resolve(planFile), 'utf8');
  const changedFiles = fs.readFileSync(path.resolve(changedFile), 'utf8').split(/\r?\n/).map((x)=>x.trim()).filter(Boolean);
  const outputFile = mode === 'validate' ? args[4] : null;
  const evidenceFile = mode === 'prepare' ? args[4] : args[5];
  const previousFile = mode === 'prepare' ? args[5] : args[6];
  const input = buildInput(planBody, changedFiles, readPreviousReview(previousFile));
  const testEvidenceFile=String(process.env.KODJO_TEST_CONTRACT_EVIDENCE_FILE||'').trim();
  if(input.non_ui_requirement_count>=0&&/<KODJO_REQUIREMENT_CONTRACT_JSON>/.test(planBody)&&process.env.KODJO_REQUIRE_TEST_CONTRACT_EVIDENCE==='1'&&
     (!testEvidenceFile||!fs.existsSync(path.resolve(testEvidenceFile))))throw new Error('TEST_CONTRACT_EVIDENCE_MISSING');
  if(testEvidenceFile&&fs.existsSync(path.resolve(testEvidenceFile))){
    input.test_contract_evidence=readJson(testEvidenceFile);
    const expectedHead=String(process.env.KODJO_EXPECTED_REVIEW_HEAD||'');
    if(expectedHead&&input.test_contract_evidence.schema==='kodjo.test-contract-evidence.v1'&&
       input.test_contract_evidence.head!==expectedHead)throw new Error('TEST_CONTRACT_EVIDENCE_HEAD_MISMATCH');
    if(/<KODJO_REQUIREMENT_CONTRACT_JSON>/.test(planBody)){
      const expected=verifyRequirementContracts(planBody).test_contract.bindings.map(row=>row.requirement_id+':'+row.test_path).sort();
      const observed=Array.isArray(input.test_contract_evidence.bindings)
        ?input.test_contract_evidence.bindings.map(row=>String(row.requirement_id)+':'+String(row.test_path)).sort():[];
      if(input.test_contract_evidence.schema!=='kodjo.test-contract-evidence.v1'||
         input.test_contract_evidence.binding_count!==expected.length||JSON.stringify(observed)!==JSON.stringify(expected)){
        throw new Error('TEST_CONTRACT_EVIDENCE_BINDINGS_MISMATCH');
      }
    }
  }
  if (evidenceFile) input.implementation_report = inspectImplementation(
    fs.readFileSync(path.resolve(evidenceFile),'utf8'), {
      criteria: input.criteria,
      requirements: input.non_ui_requirements,
    });
  if (mode === 'prepare') {
    fs.writeFileSync(path.resolve(third), JSON.stringify(input, null, 2) + '\n', 'utf8');
    process.stdout.write('[KODJO_V2] UI implementation review input prepared — criteria=' + input.criterion_count + ' assertions=' + (input.assertion_count||0) + ' device=' + input.device_gate_required + ' mode=' + input.review_mode + '\n');
  } else {
    if (!outputFile) throw new Error('validate requiert output.json');
    const review = readJson(third);
    validateReview(input, review);
    fs.writeFileSync(path.resolve(outputFile), JSON.stringify(review, null, 2) + '\n', 'utf8');
    process.stdout.write('[KODJO_V2] UI implementation review verified — verdict=' + review.verdict + ' device=' + review.device_gate_required + ' mode=' + input.review_mode + '\n');
  }
} catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}
