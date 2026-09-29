'use strict';
const { normalizeRepoPath, sha256, fail } = require('./plan-impact');

const MATRIX_SCHEMA_V1 = 'kodjo.ui-criteria.v1';
const MATRIX_SCHEMA_V2 = 'kodjo.ui-criteria.v2';
const RISK_TYPES = new Set(['FUNCTIONAL','VISUAL','ACCESSIBILITY','DEVICE']);
const PROOF_TYPES = new Set(['FUNCTIONAL_TEST','STATIC_ANALYSIS','VISUAL_COMPARE','ACCESSIBILITY_CHECK','DEVICE_CHECK']);
const COMPONENT_DECISIONS = new Set(['REUSE','EXTEND','CREATE']);
const ASSERTION_PROPERTY_TYPES = new Set([
  'PRESENCE','CONTENT','STATE','GEOMETRY','RELATION','STYLE','LAYERING','INTERACTION','RESPONSIVE',
]);
const TEST_PATH = /(?:^|\/)(__tests__|tests?)\/|\.(?:test|spec)\.[^.]+$/;

function isUiPath(value) {
  return /^(?:app\/|src\/features\/|src\/shared\/ui\/|src\/shared\/i18n\/|assets\/icons\/)/.test(value) && !TEST_PATH.test(value);
}
function requireText(value, code, label) {
  if (typeof value !== 'string' || value.trim().length === 0) fail(code, label + ' absent');
  return value.trim();
}
function requireArray(value, code, label) {
  if (!Array.isArray(value)) fail(code, label + ' doit etre un tableau');
  return value;
}
function uniqueStrings(values, code, label) {
  const out = values.map((value) => requireText(value, code, label));
  if (new Set(out).size !== out.length) fail(code, label + ' contient un doublon');
  return out;
}
function sameSet(a,b) {
  return JSON.stringify([...new Set(a)].sort()) === JSON.stringify([...new Set(b)].sort());
}
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^$()|[\]\\]/g,'\\$&');
}
function assertionMandatoryProofs(propertyType, proofRequired, id) {
  const visual = new Set(['GEOMETRY','RELATION','STYLE','LAYERING','RESPONSIVE']);
  const structural = new Set(['PRESENCE','CONTENT','STATE']);
  if (visual.has(propertyType) && !proofRequired.includes('VISUAL_COMPARE')) {
    fail('UI_PLAN_ASSERTION_PROOF_INVALID', id + ': ' + propertyType + ' exige VISUAL_COMPARE');
  }
  if (propertyType === 'INTERACTION' &&
      !proofRequired.some((proof) => proof === 'FUNCTIONAL_TEST' || proof === 'STATIC_ANALYSIS')) {
    fail('UI_PLAN_ASSERTION_PROOF_INVALID', id + ': INTERACTION exige FUNCTIONAL_TEST ou STATIC_ANALYSIS');
  }
  if (structural.has(propertyType) &&
      !proofRequired.some((proof) => ['FUNCTIONAL_TEST','STATIC_ANALYSIS','VISUAL_COMPARE'].includes(proof))) {
    fail('UI_PLAN_ASSERTION_PROOF_INVALID', id + ': ' + propertyType + ' exige une preuve observable');
  }
}
function normalizeAssertions(criterion, criterionProofs, matrixSchemaName) {
  if (matrixSchemaName === MATRIX_SCHEMA_V1) return [];
  const criterionId = String(criterion.criterion_id || '');
  const assertions = requireArray(criterion.assertions, 'UI_PLAN_ASSERTION_INVALID', criterionId + '.assertions');
  if (assertions.length === 0) fail('UI_PLAN_ASSERTION_MISSING', criterionId + ': assertions vide');
  const seen = new Set();
  const normalized = assertions.map((assertion,index) => {
    if (!assertion || typeof assertion !== 'object' || Array.isArray(assertion)) {
      fail('UI_PLAN_ASSERTION_INVALID', criterionId + '.assertions[' + index + '] invalide');
    }
    const id = requireText(assertion.assertion_id, 'UI_PLAN_ASSERTION_INVALID', criterionId + '.assertion_id');
    if (!new RegExp('^' + escapeRegExp(criterionId) + '-A(?:[0-9]{2,3}|[0-9A-F]{12})$').test(id)) {
      fail('UI_PLAN_ASSERTION_INVALID', id + ': assertion_id invalide');
    }
    if (seen.has(id)) fail('UI_PLAN_ASSERTION_INVALID', id + ': assertion_id duplique');
    seen.add(id);
    const source = assertion.source;
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      fail('UI_PLAN_ASSERTION_SOURCE_INVALID', id + ': source absent');
    }
    const sourcePath = normalizeRepoPath(
      requireText(source.path,'UI_PLAN_ASSERTION_SOURCE_INVALID',id+'.source.path'),
      id+'.source.path',
    );
    const sourceLocator = requireText(source.locator,'UI_PLAN_ASSERTION_SOURCE_INVALID',id+'.source.locator');
    const propertyType = requireText(assertion.property_type,'UI_PLAN_ASSERTION_INVALID',id+'.property_type');
    if (!ASSERTION_PROPERTY_TYPES.has(propertyType)) {
      fail('UI_PLAN_ASSERTION_INVALID', id + ': property_type inconnu');
    }
    const expected = requireText(assertion.expected,'UI_PLAN_ASSERTION_INVALID',id+'.expected');
    const proofs = uniqueStrings(
      requireArray(assertion.proof_required,'UI_PLAN_ASSERTION_PROOF_INVALID',id+'.proof_required'),
      'UI_PLAN_ASSERTION_PROOF_INVALID',
      id+'.proof_required',
    );
    if (proofs.length === 0 || proofs.some((proof)=>!PROOF_TYPES.has(proof))) {
      fail('UI_PLAN_ASSERTION_PROOF_INVALID', id + ': proof_required invalide');
    }
    for (const proof of proofs) {
      if (!criterionProofs.includes(proof)) {
        fail('UI_PLAN_ASSERTION_PROOF_INVALID', id + ': preuve absente du critere parent: ' + proof);
      }
    }
    assertionMandatoryProofs(propertyType, proofs, id);
    return {
      assertion_id:id,
      source:{path:sourcePath,locator:sourceLocator},
      property_type:propertyType,
      expected,
      proof_required:[...proofs].sort(),
    };
  }).sort((a,b)=>a.assertion_id.localeCompare(b.assertion_id));
  const assertionProofUnion = normalized.flatMap((row)=>row.proof_required);
  if (!sameSet(assertionProofUnion, criterionProofs)) {
    fail('UI_PLAN_ASSERTION_PROOF_COVERAGE_INCOMPLETE',
      criterionId + ': chaque preuve du critere doit etre allouee a au moins une assertion');
  }
  return normalized;
}

function normalizeMatrix(matrix, {scope, uiPaths, requireAssertions=false}) {
  const uiApplicable = uiPaths.length > 0;
  if (!matrix || ![MATRIX_SCHEMA_V1,MATRIX_SCHEMA_V2].includes(matrix.schema)) {
    fail('UI_PLAN_CRITERIA_INVALID', 'schema attendu ' + MATRIX_SCHEMA_V1 + ' ou ' + MATRIX_SCHEMA_V2);
  }
  if (requireAssertions && uiApplicable && matrix.schema !== MATRIX_SCHEMA_V2) {
    fail('UI_PLAN_ATOMICITY_REQUIRED', 'les nouveaux plans UI doivent utiliser ' + MATRIX_SCHEMA_V2);
  }

  const criteria = requireArray(matrix.criteria, 'UI_PLAN_CRITERIA_INVALID', 'criteria');
  const preservation = matrix.preservation;
  if (!preservation || typeof preservation !== 'object' || Array.isArray(preservation)) {
    fail('UI_PLAN_PRESERVATION_INVALID', 'preservation absent');
  }
  for (const key of ['preserve','change','forbidden']) requireArray(preservation[key], 'UI_PLAN_PRESERVATION_INVALID', 'preservation.' + key);

  if (uiApplicable && criteria.length === 0) fail('UI_PLAN_CRITERIA_MISSING', 'des modules UI sont modifies mais aucun critere atomique n est fourni');
  if (!uiApplicable && criteria.length > 0) fail('UI_PLAN_CRITERIA_INVALID', 'criteres UI fournis sans module UI modifie');
  if (uiApplicable && preservation.change.length === 0) fail('UI_PLAN_PRESERVATION_INVALID', 'preservation.change vide pour une tranche UI');

  const criterionIds = new Set();
  const assertionIds = new Set();
  const coveredTargets = new Set();
  const normalizedCriteria = criteria.map((criterion, index) => {
    if (!criterion || typeof criterion !== 'object' || Array.isArray(criterion)) fail('UI_PLAN_CRITERIA_INVALID', 'criterion[' + index + '] invalide');
    const id = requireText(criterion.criterion_id, 'UI_PLAN_CRITERIA_INVALID', 'criterion_id');
    if (!/^[A-Z0-9][A-Z0-9._-]{2,63}$/.test(id)) fail('UI_PLAN_CRITERIA_INVALID', 'criterion_id invalide: ' + id);
    if (criterionIds.has(id)) fail('UI_PLAN_CRITERIA_INVALID', 'criterion_id duplique: ' + id);
    criterionIds.add(id);

    const source = criterion.source;
    if (!source || typeof source !== 'object' || Array.isArray(source)) fail('UI_PLAN_SOURCE_INVALID', id + ': source absent');
    const sourcePath = normalizeRepoPath(requireText(source.path, 'UI_PLAN_SOURCE_INVALID', id + '.source.path'), id + '.source.path');
    const sourceLocator = requireText(source.locator, 'UI_PLAN_SOURCE_INVALID', id + '.source.locator');
    const requirement = requireText(source.requirement, 'UI_PLAN_SOURCE_INVALID', id + '.source.requirement');

    const riskTypes = uniqueStrings(requireArray(criterion.risk_types, 'UI_PLAN_PROOF_INVALID', id + '.risk_types'), 'UI_PLAN_PROOF_INVALID', id + '.risk_types');
    if (riskTypes.length === 0 || riskTypes.some((risk) => !RISK_TYPES.has(risk))) fail('UI_PLAN_PROOF_INVALID', id + ': risk_types invalides');

    const reuseSearch = uniqueStrings(requireArray(criterion.reuse_search, 'UI_PLAN_REUSE_INVALID', id + '.reuse_search'), 'UI_PLAN_REUSE_INVALID', id + '.reuse_search');
    if (reuseSearch.length === 0) fail('UI_PLAN_REUSE_INVALID', id + ': reuse_search vide');
    const decision = requireText(criterion.component_decision, 'UI_PLAN_REUSE_INVALID', id + '.component_decision');
    if (!COMPONENT_DECISIONS.has(decision)) fail('UI_PLAN_REUSE_INVALID', id + ': component_decision inconnu');
    const selectedComponent = matrix.schema === MATRIX_SCHEMA_V2
      ? criterion.selected_component
      : requireText(criterion.selected_component, 'UI_PLAN_REUSE_INVALID', id + '.selected_component');
    const decisionJustification = requireText(criterion.decision_justification, 'UI_PLAN_REUSE_INVALID', id + '.decision_justification');
    if(matrix.schema===MATRIX_SCHEMA_V2){
      if(!selectedComponent||typeof selectedComponent!=='object'||Array.isArray(selectedComponent))fail('UI_PLAN_REUSE_INVALID',id+': composant structure requis');
      if(decision==='CREATE'){
        if(selectedComponent.path!=='NONE'||selectedComponent.export!=='NONE')fail('UI_PLAN_REUSE_INVALID',id+': CREATE exige NONE');
      }else{
        if(selectedComponent.path==='NONE'||selectedComponent.export==='NONE')fail('UI_PLAN_REUSE_INVALID',id+': composant requis pour '+decision);
        normalizeRepoPath(requireText(selectedComponent.path,'UI_PLAN_REUSE_INVALID',id+'.selected_component.path'),id+'.selected_component.path');
        if(!/^(?:default|[A-Za-z_$][A-Za-z0-9_$]*)$/.test(String(selectedComponent.export||'')))fail('UI_PLAN_REUSE_INVALID',id+': export invalide');
      }
    }else if ((decision === 'REUSE' || decision === 'EXTEND') && selectedComponent === 'NONE') fail('UI_PLAN_REUSE_INVALID', id + ': composant requis pour ' + decision);

    const changeTargets = uniqueStrings(requireArray(criterion.change_targets, 'UI_PLAN_TARGET_INVALID', id + '.change_targets'), 'UI_PLAN_TARGET_INVALID', id + '.change_targets')
      .map((target) => normalizeRepoPath(target, id + '.change_target'));
    if (changeTargets.length === 0) fail('UI_PLAN_TARGET_INVALID', id + ': change_targets vide');
    for (const target of changeTargets) {
      if (!scope.has(target)) fail('UI_PLAN_TARGET_INVALID', id + ': cible hors scope_allow: ' + target);
      coveredTargets.add(target);
    }

    const tests = uniqueStrings(requireArray(criterion.tests, 'UI_PLAN_TEST_INVALID', id + '.tests'), 'UI_PLAN_TEST_INVALID', id + '.tests')
      .map((testPath) => normalizeRepoPath(testPath, id + '.test'));
    if (riskTypes.includes('FUNCTIONAL') && tests.length === 0) fail('UI_PLAN_TEST_INVALID', id + ': risque FUNCTIONAL sans test');

    const proofRequired = uniqueStrings(requireArray(criterion.proof_required, 'UI_PLAN_PROOF_INVALID', id + '.proof_required'), 'UI_PLAN_PROOF_INVALID', id + '.proof_required');
    if (proofRequired.length === 0 || proofRequired.some((proof) => !PROOF_TYPES.has(proof))) fail('UI_PLAN_PROOF_INVALID', id + ': proof_required invalide');
    if(proofRequired.includes('FUNCTIONAL_TEST')&&tests.length===0)fail('UI_PLAN_TEST_INVALID',id+': FUNCTIONAL_TEST sans test');
    if (riskTypes.includes('VISUAL') && !proofRequired.includes('VISUAL_COMPARE')) fail('UI_PLAN_PROOF_INVALID', id + ': VISUAL exige VISUAL_COMPARE');
    if (riskTypes.includes('ACCESSIBILITY') && !proofRequired.includes('ACCESSIBILITY_CHECK')) fail('UI_PLAN_PROOF_INVALID', id + ': ACCESSIBILITY exige ACCESSIBILITY_CHECK');
    if (riskTypes.includes('DEVICE') && !proofRequired.includes('DEVICE_CHECK')) fail('UI_PLAN_PROOF_INVALID', id + ': DEVICE exige DEVICE_CHECK');
    if (riskTypes.includes('FUNCTIONAL') && !proofRequired.some((proof) => proof === 'FUNCTIONAL_TEST' || proof === 'STATIC_ANALYSIS')) {
      fail('UI_PLAN_PROOF_INVALID', id + ': FUNCTIONAL exige FUNCTIONAL_TEST ou STATIC_ANALYSIS');
    }

    const assertions = normalizeAssertions(criterion, proofRequired, matrix.schema);
    if(assertions.some(a=>a.proof_required.includes('FUNCTIONAL_TEST'))&&tests.length===0)fail('UI_PLAN_TEST_INVALID',id+': assertion FUNCTIONAL_TEST sans test');
    for (const assertion of assertions) {
      if (assertionIds.has(assertion.assertion_id)) fail('UI_PLAN_ASSERTION_INVALID', assertion.assertion_id + ': assertion_id global duplique');
      assertionIds.add(assertion.assertion_id);
    }

    const normalized = {
      criterion_id: id,
      source: { path: sourcePath, locator: sourceLocator, requirement },
      risk_types: [...riskTypes].sort(),
      reuse_search: [...reuseSearch].sort(),
      component_decision: decision,
      selected_component: selectedComponent,
      decision_justification: decisionJustification,
      change_targets: [...changeTargets].sort(),
      tests: [...tests].sort(),
      proof_required: [...proofRequired].sort(),
    };
    if (matrix.schema === MATRIX_SCHEMA_V2) normalized.assertions = assertions;
    return normalized;
  }).sort((a,b) => a.criterion_id.localeCompare(b.criterion_id));

  for (const uiPath of uiPaths) {
    if (!coveredTargets.has(uiPath)) fail('UI_PLAN_COVERAGE_INCOMPLETE', 'module UI sans critere: ' + uiPath);
  }

  const normalizedPreservation = {};
  for (const key of ['preserve','change','forbidden']) {
    const seen = new Set();
    normalizedPreservation[key] = preservation[key].map((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) fail('UI_PLAN_PRESERVATION_INVALID', key + '[' + index + '] invalide');
      const target = requireText(entry.target, 'UI_PLAN_PRESERVATION_INVALID', key + '.target');
      const justification = requireText(entry.justification, 'UI_PLAN_PRESERVATION_INVALID', key + '.justification');
      if (seen.has(target)) fail('UI_PLAN_PRESERVATION_INVALID', key + ' cible dupliquee: ' + target);
      seen.add(target);
      return { target, justification };
    }).sort((a,b) => a.target.localeCompare(b.target));
  }

  return { schema: matrix.schema, criteria: normalizedCriteria, preservation: normalizedPreservation };
}

const text = {type:'string', minLength:1, pattern:'\\S'};
const object = (properties, required=Object.keys(properties)) => ({type:'object', additionalProperties:false, required, properties});
const array = (items, minItems=0) => ({type:'array', items, minItems});
const enumeration = (values) => ({type:'string', enum:[...values]});
const preservationEntry = object({target:text, justification:text});
const baseCriterionProperties = {
  criterion_id:{type:'string', pattern:'^[A-Z0-9][A-Z0-9._-]{2,63}$'},
  source:object({path:text, locator:text, requirement:text}),
  risk_types:array(enumeration(RISK_TYPES),1),
  reuse_search:array(text,1),
  component_decision:enumeration(COMPONENT_DECISIONS),
  selected_component:text,
  decision_justification:text,
  change_targets:array(text,1),
  tests:array(text),
  proof_required:array(enumeration(PROOF_TYPES),1),
};
const assertionSchema = object({
  assertion_id:{type:'string',pattern:'^[A-Z0-9][A-Z0-9._-]{2,63}-A(?:[0-9]{2,3}|[0-9A-F]{12})$'},
  source:object({path:text,locator:text}),
  property_type:enumeration(ASSERTION_PROPERTY_TYPES),
  expected:text,
  proof_required:array(enumeration(PROOF_TYPES),1),
});
const matrixSchemaV1 = object({
  schema:{type:'string', enum:[MATRIX_SCHEMA_V1]},
  criteria:array(object(baseCriterionProperties)),
  preservation:object({preserve:array(preservationEntry), change:array(preservationEntry), forbidden:array(preservationEntry)}),
});
const matrixSchemaV2 = object({
  schema:{type:'string', enum:[MATRIX_SCHEMA_V2]},
  criteria:array(object({...baseCriterionProperties,selected_component:object({path:text,export:text}),assertions:array(assertionSchema,1)})),
  preservation:object({preserve:array(preservationEntry), change:array(preservationEntry), forbidden:array(preservationEntry)}),
});
const matrixSchema = matrixSchemaV2;

function validateShape(value, schema, at='$') {
  const supported = new Set(['type','additionalProperties','required','properties','items','minItems','minLength','pattern','enum']);
  for (const key of Object.keys(schema)) if (!supported.has(key)) fail('UI_PLAN_SCHEMA_UNSUPPORTED',key);
  const type = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
  if (type !== schema.type) fail('UI_PLAN_SHAPE_INVALID',at+': expected '+schema.type);
  if (schema.enum && !schema.enum.includes(value)) fail('UI_PLAN_SHAPE_INVALID',at+': enum');
  if (type === 'object') {
    for (const key of schema.required) if (!Object.hasOwn(value,key)) fail('UI_PLAN_SHAPE_INVALID',at+'.'+key+': required');
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(schema.properties,key)) fail('UI_PLAN_SHAPE_INVALID',at+'.'+key+': unknown field');
      validateShape(value[key],schema.properties[key],at+'.'+key);
    }
  } else if (type === 'array') {
    if (value.length < (schema.minItems || 0)) fail('UI_PLAN_SHAPE_INVALID',at+': minItems');
    value.forEach((item,index)=>validateShape(item,schema.items,at+'['+index+']'));
  } else if (type === 'string') {
    if (value.length < (schema.minLength || 0) || (schema.pattern && !new RegExp(schema.pattern).test(value))) fail('UI_PLAN_SHAPE_INVALID',at+': string constraint');
  }
}
function schemaForMatrix(matrix) {
  return matrix && matrix.schema === MATRIX_SCHEMA_V1 ? matrixSchemaV1 : matrixSchemaV2;
}
function validateMatrix(matrix, context) {
  const normalized = normalizeMatrix(matrix, context);
  validateShape(matrix,schemaForMatrix(matrix));
  return normalized;
}
function matrixFingerprint(matrix) {
  const targets = Array.isArray(matrix?.criteria)
    ? matrix.criteria.flatMap((criterion) => Array.isArray(criterion?.change_targets) ? criterion.change_targets : []) : [];
  const normalizedTargets = targets.map((target) => normalizeRepoPath(target, 'matrix.change_target'));
  return sha256(validateMatrix(matrix, { scope: new Set(normalizedTargets), uiPaths: [...new Set(normalizedTargets)] }));
}
function contractPrompt() {
  return 'Authoritative '+MATRIX_SCHEMA_V2+' contract for every NEW UI plan:\n'+JSON.stringify(matrixSchemaV2)+
    '\nAtomic assertion derivation is mandatory. For every normative UI requirement, identify contract-bearing elements and relations, then create one assertion for each independently falsifiable observable invariant. Split properties when one can fail while another passes, when proof types differ, or when corrections can be independent. Use property_type only from PRESENCE/CONTENT/STATE/GEOMETRY/RELATION/STYLE/LAYERING/INTERACTION/RESPONSIVE. Relations and layering are first-class assertions. Do not create assertions for implementation nodes or decorative details without a normative source. Every assertion must cite an exact source locator and expected observable result. Every criterion proof_required must be allocated to at least one assertion. Never invent geometry or styling absent from Figma, tokens, contracts or validated decisions; use CLARIFICATION_REQUIRED instead.\n'+
    'Historical '+MATRIX_SCHEMA_V1+' remains readable only for already-approved plans; do not generate it.\n'+
    'All conditional, uniqueness, path, scope and coverage rules below are mandatory. The receiver runs this same code before accepting a generated plan.\n'+
    [requireText, requireArray, uniqueStrings, isUiPath, normalizeRepoPath, normalizeAssertions, normalizeMatrix].map(String).join('\n');
}
module.exports = {
  MATRIX_SCHEMA_V1,MATRIX_SCHEMA_V2,matrixFingerprint,matrixSchema,matrixSchemaV1,matrixSchemaV2,
  validateMatrix,validateShape,contractPrompt,isUiPath,object,array,text,ASSERTION_PROPERTY_TYPES,PROOF_TYPES,
};
