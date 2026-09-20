'use strict';
const { normalizeRepoPath, fail } = require('./plan-impact');

const MATRIX_SCHEMA = 'kodjo.ui-criteria.v1';
const RISK_TYPES = new Set(['FUNCTIONAL','VISUAL','ACCESSIBILITY','DEVICE']);
const PROOF_TYPES = new Set(['FUNCTIONAL_TEST','STATIC_ANALYSIS','VISUAL_COMPARE','ACCESSIBILITY_CHECK','DEVICE_CHECK']);
const COMPONENT_DECISIONS = new Set(['REUSE','EXTEND','CREATE']);
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

function normalizeMatrix(matrix, {scope, uiPaths}) {
  const uiApplicable = uiPaths.length > 0;
  if (!matrix || matrix.schema !== MATRIX_SCHEMA) fail('UI_PLAN_CRITERIA_INVALID', 'schema attendu ' + MATRIX_SCHEMA);

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
    const selectedComponent = requireText(criterion.selected_component, 'UI_PLAN_REUSE_INVALID', id + '.selected_component');
    const decisionJustification = requireText(criterion.decision_justification, 'UI_PLAN_REUSE_INVALID', id + '.decision_justification');
    if ((decision === 'REUSE' || decision === 'EXTEND') && selectedComponent === 'NONE') fail('UI_PLAN_REUSE_INVALID', id + ': composant requis pour ' + decision);

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
    if (riskTypes.includes('VISUAL') && !proofRequired.includes('VISUAL_COMPARE')) fail('UI_PLAN_PROOF_INVALID', id + ': VISUAL exige VISUAL_COMPARE');
    if (riskTypes.includes('ACCESSIBILITY') && !proofRequired.includes('ACCESSIBILITY_CHECK')) fail('UI_PLAN_PROOF_INVALID', id + ': ACCESSIBILITY exige ACCESSIBILITY_CHECK');
    if (riskTypes.includes('DEVICE') && !proofRequired.includes('DEVICE_CHECK')) fail('UI_PLAN_PROOF_INVALID', id + ': DEVICE exige DEVICE_CHECK');
    if (riskTypes.includes('FUNCTIONAL') && !proofRequired.some((proof) => proof === 'FUNCTIONAL_TEST' || proof === 'STATIC_ANALYSIS')) {
      fail('UI_PLAN_PROOF_INVALID', id + ': FUNCTIONAL exige FUNCTIONAL_TEST ou STATIC_ANALYSIS');
    }

    return {
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

  const normalizedMatrix = { schema: MATRIX_SCHEMA, criteria: normalizedCriteria, preservation: normalizedPreservation };
  return normalizedMatrix;
}

// Authoritative structural contract. Both the decoder and the deterministic
// receiver consume this object; the semantic rules above remain unchanged.
const text = {type:'string', minLength:1, pattern:'\\S'};
const object = (properties) => ({type:'object', additionalProperties:false, required:Object.keys(properties), properties});
const array = (items, minItems=0) => ({type:'array', items, minItems});
const enumeration = (values) => ({type:'string', enum:[...values]});
const preservationEntry = object({target:text, justification:text});
const matrixSchema = object({
  schema:{type:'string', enum:[MATRIX_SCHEMA]},
  criteria:array(object({
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
  })),
  preservation:object({preserve:array(preservationEntry), change:array(preservationEntry), forbidden:array(preservationEntry)}),
});

// Small validator for exactly the JSON Schema subset emitted above. Unknown
// keywords fail closed, so adding a decoder rule cannot silently bypass replay.
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
function validateMatrix(matrix, context) {
  // Preserve all historical deterministic checks and their diagnostics.
  const normalized = normalizeMatrix(matrix, context);
  validateShape(matrix,matrixSchema);
  return normalized;
}
function contractPrompt() {
  // The conditional instructions are generated from the actual executable
  // validator, not maintained as an independent prompt checklist.
  return 'Authoritative kodjo.ui-criteria.v1 contract:\n'+JSON.stringify(matrixSchema)+
    '\nAll conditional, uniqueness, path, scope and coverage rules below are mandatory. '+
    'The receiver runs this same code before accepting a generated plan.\n'+
    [requireText, requireArray, uniqueStrings, isUiPath, normalizeRepoPath, normalizeMatrix].map(String).join('\n');
}
module.exports = {matrixSchema, validateMatrix, validateShape, contractPrompt, isUiPath, object, array, text};
