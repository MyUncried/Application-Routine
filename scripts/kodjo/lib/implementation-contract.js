'use strict';

const { matrixFingerprint, MATRIX_SCHEMA_V1, MATRIX_SCHEMA_V2, MATRIX_SCHEMA_V3 } = require('./ui-criteria-contract');
const { extractTaggedJson, sha256, fail } = require('./plan-impact');
const { verifyEmbedded: verifyRequirementContracts } = require('./requirement-contract');

const IMPLEMENTATION_CONTRACT_SCHEMA_V1 = 'kodjo.ui-implementation-contract.v1';
const IMPLEMENTATION_CONTRACT_SCHEMA_V2 = 'kodjo.ui-implementation-contract.v2';
const IMPLEMENTATION_CONTRACT_SCHEMA_V3 = 'kodjo.implementation-contract.v3';
const UI_PLAN_CONTRACT_SCHEMA = 'kodjo.ui-plan-contract.v1';
const REQUIRED_STOPS = Object.freeze([
  'CHANGE_REQUEST_REQUIRED',
  'SCOPE_EXPANSION_REQUIRED',
  'NATIVE_PRIMITIVE_EXCEPTION_REQUIRED',
  'CLARIFICATION_REQUIRED',
]);

function lineField(text, name) {
  const m = new RegExp('^' + name + '=([^\\r\\n]+)\\s*$', 'm').exec(String(text || ''));
  return m ? m[1].trim() : '';
}
function assertionIdsOf(criteria) {
  return criteria.flatMap((criterion) =>
    Array.isArray(criterion && criterion.assertions)
      ? criterion.assertions.map((assertion) => String(assertion && assertion.assertion_id || ''))
      : []
  ).sort();
}

function deriveImplementationContract(planBody, planBlobOid) {
  if (!/^[0-9a-f]{40}$/i.test(String(planBlobOid || ''))) {
    fail('IMPLEMENTATION_PLAN_BLOB_INVALID', 'plan_blob_oid absent ou invalide');
  }
  const matrix = extractTaggedJson(planBody, 'KODJO_UI_CRITERIA_MATRIX_JSON', 'IMPLEMENTATION_UI_MATRIX_MISSING');
  const planContract = extractTaggedJson(planBody, 'KODJO_UI_PLAN_CONTRACT_JSON', 'IMPLEMENTATION_UI_PLAN_CONTRACT_MISSING');
  if (!matrix || ![MATRIX_SCHEMA_V1,MATRIX_SCHEMA_V2,MATRIX_SCHEMA_V3].includes(matrix.schema)) {
    fail('IMPLEMENTATION_UI_MATRIX_INVALID', 'schema UI inconnu');
  }
  if (!planContract || planContract.schema !== UI_PLAN_CONTRACT_SCHEMA) {
    fail('IMPLEMENTATION_UI_PLAN_CONTRACT_INVALID', 'schema kodjo.ui-plan-contract.v1 requis');
  }
  const matrixHash = matrixFingerprint(matrix);
  if (planContract.matrix_sha256 !== matrixHash) {
    fail('IMPLEMENTATION_UI_MATRIX_HASH_MISMATCH', 'matrice != contrat UI approuve');
  }
  const criteria = Array.isArray(matrix.criteria) ? matrix.criteria : [];
  const ids = criteria.map((c) => String(c && c.criterion_id || '')).sort();
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    fail('IMPLEMENTATION_UI_CRITERIA_INVALID', 'criterion_id absent ou duplique');
  }
  const assertionMode = [MATRIX_SCHEMA_V2,MATRIX_SCHEMA_V3].includes(matrix.schema);
  const assertionIds = assertionIdsOf(criteria);
  if (assertionMode) {
    if (assertionIds.some((id) => !id) || new Set(assertionIds).size !== assertionIds.length) {
      fail('IMPLEMENTATION_UI_ASSERTIONS_INVALID', 'assertion_id absent ou duplique');
    }
    if (Number(planContract.contract_version) < 2 ||
        Number(planContract.assertion_count) !== assertionIds.length ||
        planContract.assertion_ids_sha256 !== sha256(assertionIds)) {
      fail('IMPLEMENTATION_UI_ASSERTION_CONTRACT_MISMATCH', 'assertions != contrat UI approuve');
    }
  }
  const hasRequirementContract = /<KODJO_REQUIREMENT_CONTRACT_JSON>[\s\S]*?<\/KODJO_REQUIREMENT_CONTRACT_JSON>/.test(planBody);
  if(assertionMode&&!hasRequirementContract)fail('REQUIREMENT_CONTRACT_REQUIRED_FOR_V2');
  const requirementContracts = hasRequirementContract ? verifyRequirementContracts(planBody) : null;
  const preservation = matrix.preservation;
  if (!preservation || typeof preservation !== 'object' || Array.isArray(preservation)) {
    fail('IMPLEMENTATION_PRESERVATION_INVALID', 'PRESERVE/CHANGE/FORBIDDEN absent');
  }
  for (const key of ['preserve','change','forbidden']) {
    if (!Array.isArray(preservation[key])) fail('IMPLEMENTATION_PRESERVATION_INVALID', key + ' absent');
  }
  return {
    schema: requirementContracts ? IMPLEMENTATION_CONTRACT_SCHEMA_V3 : (assertionMode ? IMPLEMENTATION_CONTRACT_SCHEMA_V2 : IMPLEMENTATION_CONTRACT_SCHEMA_V1),
    plan_blob_oid: String(planBlobOid).toLowerCase(),
    ui_plan_contract_schema: planContract.schema,
    ui_matrix_sha256: matrixHash,
    ui_criterion_count: ids.length,
    ui_criterion_ids_sha256: sha256(ids),
    ...(assertionMode ? {
      ui_assertion_count: assertionIds.length,
      ui_assertion_ids_sha256: sha256(assertionIds),
    } : {}),
    ui_preservation_sha256: sha256(preservation),
    ...(requirementContracts ? {
      requirement_count: requirementContracts.requirement_contract.requirement_count,
      requirement_ids_sha256: requirementContracts.requirement_contract.requirement_ids_sha256,
      requirement_contract_sha256: sha256(requirementContracts.requirement_contract),
      test_contract_sha256: sha256(requirementContracts.test_contract),
      boundary_contract_sha256: sha256(requirementContracts.boundary_contract),
    } : {}),
    ui_applicable: Boolean(planContract.ui_applicable),
    assertion_mode: assertionMode,
    required_stops: [...REQUIRED_STOPS],
  };
}

function renderImplementationMission(sliceId, planBody, planBlobOid) {
  const contract = deriveImplementationContract(planBody, planBlobOid);
  const lines = [
    '# Mission d’implémentation — ' + sliceId,
    '',
    'Exécuter exclusivement le plan approuvé matérialisé dans `technical-plan.md`.',
    '',
    'implementation_contract=' + contract.schema,
    'plan_blob_oid=' + contract.plan_blob_oid,
    'ui_plan_contract=' + contract.ui_plan_contract_schema,
    'ui_matrix_sha256=' + contract.ui_matrix_sha256,
    'ui_criterion_count=' + contract.ui_criterion_count,
    'ui_criterion_ids_sha256=' + contract.ui_criterion_ids_sha256,
    ...(contract.assertion_mode ? [
      'ui_assertion_count=' + contract.ui_assertion_count,
      'ui_assertion_ids_sha256=' + contract.ui_assertion_ids_sha256,
    ] : []),
    'ui_preservation_sha256=' + contract.ui_preservation_sha256,
    ...(contract.requirement_contract_sha256 ? [
      'requirement_count=' + contract.requirement_count,
      'requirement_ids_sha256=' + contract.requirement_ids_sha256,
      'requirement_contract_sha256=' + contract.requirement_contract_sha256,
      'test_contract_sha256=' + contract.test_contract_sha256,
      'boundary_contract_sha256=' + contract.boundary_contract_sha256,
    ] : []),
    'required_stops=' + contract.required_stops.join(','),
    '',
    '## Contrat de développement opposable',
    '',
    '- Lire avant tout code le bloc exact `KODJO_UI_CRITERIA_MATRIX_JSON` de `technical-plan.md`. Cette matrice approuvée est la seule source du contrat UI de cette implémentation ; ne pas la recopier, réencoder ni reconstruire depuis la mémoire.',
    ...(contract.requirement_contract_sha256 ? [
      '- Lire aussi `KODJO_REQUIREMENT_CONTRACT_JSON`, `KODJO_TEST_CONTRACT_JSON` et `KODJO_BOUNDARY_CONTRACT_JSON`. Chaque `requirement_id` doit être traité exactement une fois ; les exigences non-UI ne doivent jamais être reconstruites depuis la prose.',
      '- Les bindings requirement→test et les boundaries adressables sont opposables. Ne pas inventer un test, un chemin ou une relation qui n’existe pas dans ces contrats.',
    ] : []),
    '- Appliquer chaque `criterion_id` sans omission et respecter sa décision `REUSE | EXTEND | CREATE`, ses `change_targets`, ses tests et ses `proof_required`.',
    ...(contract.assertion_mode ? [
      '- Pour chaque critère, appliquer chaque `assertion_id` exactement une fois. Une assertion représente un invariant observable indépendamment falsifiable ; aucune assertion ne peut être fusionnée, omise ou reformulée en verdict global.',
      '- Respecter pour chaque assertion sa source exacte, son `property_type`, son `expected` et ses `proof_required`. Une valeur géométrique ou stylistique absente des sources normatives ne doit jamais être inventée : arrêter avec `CLARIFICATION_REQUIRED`.',
      '- Les relations, alignements, gaps, layering, responsive et états sont des invariants autonomes lorsqu’ils sont explicitement normés ; une conformité fonctionnelle n’autorise jamais à les considérer implicitement conformes.',
    ] : []),
    '- Respecter intégralement `PRESERVE / CHANGE / FORBIDDEN`. Tout élément `PRESERVE` doit rester inchangé ; tout élément `FORBIDDEN` interdit la modification correspondante.',
    '- Une décision `REUSE` ou `EXTEND` interdit de créer silencieusement un équivalent local. Une décision `CREATE` ne permet pas de substituer une primitive, un composant canonique ou un asset déjà imposé par le plan.',
    '- Si une substitution, une refonte, un changement de primitive/composant/architecture ou un élargissement de périmètre devient nécessaire, arrêter avant le code concerné avec le statut approprié : `CHANGE_REQUEST_REQUIRED`, `SCOPE_EXPANSION_REQUIRED` ou `NATIVE_PRIMITIVE_EXCEPTION_REQUIRED`. Si un asset canonique requis est indisponible, utiliser `CHANGE_REQUEST_REQUIRED` avec le motif `CANONICAL_ASSET_UNAVAILABLE` ; `ASSET_REQUIRED` reste un libellé historique et n’est pas réintroduit comme état protocolaire.',
    '- En cas d’ambiguïté fonctionnelle ou normative, arrêter avec `CLARIFICATION_REQUIRED` ; ne jamais inventer.',
    '- Une suite Jest verte ne constitue jamais à elle seule une preuve `VISUAL_COMPARE`, `ACCESSIBILITY_CHECK` ou `DEVICE_CHECK`.',
    '- Pour tout critère exigeant une preuve device non disponible dans l’environnement, l’implémentation peut être techniquement prête pour revue mais la preuve doit rester explicitement `PENDING_DEVICE` ; ne jamais la déclarer PASS.',
    '- `PENDING_DEVICE` est une valeur de `proof_status`, jamais un état de la machine protocolaire.',
    '- Si une barrière d’arrêt est rencontrée, terminer le rapport par exactement `KODJO_STOP_STATUS: <STATUT>`, où <STATUT> appartient à la liste `required_stops`. Sans barrière, terminer par `KODJO_STOP_STATUS: NONE`.',
    '- Avant toute modification, effectuer le self-check `PRESERVE / CHANGE / FORBIDDEN`. Après modification, démontrer dans le rapport final que chaque élément `PRESERVE` est resté inchangé.',
    '',
    '## Rapport final obligatoire',
    '',
    'Le rapport final doit contenir un bloc `KODJO_IMPLEMENTATION_CONFORMANCE` listant chaque `criterion_id` approuvé avec : `implementation_status`, `files_or_symbols`, `component_used`, `tests_run`, `proof_status`, `preserve_status`, `residual_status`. Dans files_or_symbols, indiquer uniquement des chemins de fichiers réellement modifiés, relatifs au dépôt. Dans tests_run, indiquer uniquement les identifiants des checks réellement exécutés par le superviseur (jest, typescript, lint).',
    ...(contract.assertion_mode ? [
      'Pour un plan atomique v2, chaque ligne de critère contient aussi `assertion_results` avec exactement tous les `assertion_id` approuvés du critère. Chaque résultat comporte `assertion_id`, `implementation_status` et `evidence`. Les statuts autorisés sont `IMPLEMENTED`, `NOT_IMPLEMENTED`, `PENDING_DEVICE` et `NON_VERIFIABLE`.',
      'Encodage v2 : <KODJO_IMPLEMENTATION_CONFORMANCE>{"criteria":[{"criterion_id":"...","implementation_status":"...","files_or_symbols":["..."],"component_used":"...","tests_run":["..."],"proof_status":"...","preserve_status":"...","residual_status":"...","assertion_results":[{"assertion_id":"...-A01","implementation_status":"IMPLEMENTED","evidence":"..."}]}]}</KODJO_IMPLEMENTATION_CONFORMANCE>.',
    ] : [
      'Encodage du bloc : <KODJO_IMPLEMENTATION_CONFORMANCE>{"criteria":[{"criterion_id":"...","implementation_status":"...","files_or_symbols":["..."],"component_used":"...","tests_run":["..."],"proof_status":"...","preserve_status":"...","residual_status":"..."}]}</KODJO_IMPLEMENTATION_CONFORMANCE>.',
    ]),
    'Chaque champ est explicite. `tests_run` contient uniquement les checks exécutés (tableau vide autorisé) ; les checks non exécutés et leurs raisons vont dans `tests_not_run:[{"check":"...","reason":"..."}]`. `files_or_symbols` contient uniquement les chemins modifiés ; pour un critère sans changement de code, utiliser [] et renseigner `no_code_change_reason`. Les symboles éventuels vont dans `symbols` et ne constituent pas une preuve Git.',
    'Aucun critère ne peut disparaître du rapport. Toute preuve visuelle/device non exécutée reste `PENDING_DEVICE` ou `NON_VERIFIABLE`.',
    ...(contract.requirement_contract_sha256 ? [
      'Le rapport final doit aussi contenir exactement un bloc `KODJO_REQUIREMENT_CONFORMANCE` couvrant chaque `requirement_id` avec `implementation_status`, `files_or_symbols`, `tests_run`, `proof_status` et `residual_status`. Les faits Git/tests seront recoupés mécaniquement par le superviseur.',
    ] : []),
    '',
    '- scope : la propriété `scope_allow` de la Lean Request reste opposable ; aucun élargissement n’est autorisé.',
    '- contrôles : exécuter uniquement les checks déclarés dans la Lean Request.',
    '',
    'Cette mission ne crée aucune décision fonctionnelle ou technique nouvelle et n’ajoute aucun nouveau canal de transport au protocole.',
    '',
  ];
  return { mission: lines.join('\n'), contract };
}

function verifyImplementationMission(missionText, planBody, expectedPlanBlobOid) {
  const derived = deriveImplementationContract(planBody, expectedPlanBlobOid);
  const observed = {
    schema: lineField(missionText, 'implementation_contract'),
    plan_blob_oid: lineField(missionText, 'plan_blob_oid'),
    ui_plan_contract_schema: lineField(missionText, 'ui_plan_contract'),
    ui_matrix_sha256: lineField(missionText, 'ui_matrix_sha256'),
    ui_criterion_count: Number(lineField(missionText, 'ui_criterion_count')),
    ui_criterion_ids_sha256: lineField(missionText, 'ui_criterion_ids_sha256'),
    ui_assertion_count: derived.assertion_mode ? Number(lineField(missionText, 'ui_assertion_count')) : undefined,
    ui_assertion_ids_sha256: derived.assertion_mode ? lineField(missionText, 'ui_assertion_ids_sha256') : undefined,
    ui_preservation_sha256: lineField(missionText, 'ui_preservation_sha256'),
    requirement_count: derived.requirement_contract_sha256 ? Number(lineField(missionText, 'requirement_count')) : undefined,
    requirement_ids_sha256: derived.requirement_contract_sha256 ? lineField(missionText, 'requirement_ids_sha256') : undefined,
    requirement_contract_sha256: derived.requirement_contract_sha256 ? lineField(missionText, 'requirement_contract_sha256') : undefined,
    test_contract_sha256: derived.requirement_contract_sha256 ? lineField(missionText, 'test_contract_sha256') : undefined,
    boundary_contract_sha256: derived.requirement_contract_sha256 ? lineField(missionText, 'boundary_contract_sha256') : undefined,
    required_stops: lineField(missionText, 'required_stops').split(',').filter(Boolean),
  };
  if (observed.schema !== derived.schema ||
      observed.plan_blob_oid !== derived.plan_blob_oid ||
      observed.ui_plan_contract_schema !== derived.ui_plan_contract_schema ||
      observed.ui_matrix_sha256 !== derived.ui_matrix_sha256 ||
      observed.ui_criterion_count !== derived.ui_criterion_count ||
      observed.ui_criterion_ids_sha256 !== derived.ui_criterion_ids_sha256 ||
      (derived.assertion_mode && (observed.ui_assertion_count !== derived.ui_assertion_count ||
        observed.ui_assertion_ids_sha256 !== derived.ui_assertion_ids_sha256)) ||
      observed.ui_preservation_sha256 !== derived.ui_preservation_sha256 ||
      (derived.requirement_contract_sha256 && (observed.requirement_count !== derived.requirement_count ||
        observed.requirement_ids_sha256 !== derived.requirement_ids_sha256 ||
        observed.requirement_contract_sha256 !== derived.requirement_contract_sha256 ||
        observed.test_contract_sha256 !== derived.test_contract_sha256 ||
        observed.boundary_contract_sha256 !== derived.boundary_contract_sha256)) ||
      JSON.stringify(observed.required_stops) !== JSON.stringify(derived.required_stops)) {
    fail('IMPLEMENTATION_CONTRACT_DRIFT', 'mission != plan UI approuve');
  }
  const requiredFragments = [
    'REUSE | EXTEND | CREATE',
    'PRESERVE / CHANGE / FORBIDDEN',
    'PENDING_DEVICE',
    'KODJO_IMPLEMENTATION_CONFORMANCE',
    'Une suite Jest verte ne constitue jamais à elle seule',
    ...(derived.assertion_mode ? ['assertion_results','assertion_id'] : []),
    ...(derived.requirement_contract_sha256 ? ['KODJO_REQUIREMENT_CONFORMANCE','requirement_id'] : []),
  ];
  for (const fragment of requiredFragments) {
    if (!String(missionText).includes(fragment)) fail('IMPLEMENTATION_CONTRACT_INCOMPLETE', fragment);
  }
  return derived;
}

module.exports = {
  IMPLEMENTATION_CONTRACT_SCHEMA: IMPLEMENTATION_CONTRACT_SCHEMA_V1,
  IMPLEMENTATION_CONTRACT_SCHEMA_V1,
  IMPLEMENTATION_CONTRACT_SCHEMA_V2,
  IMPLEMENTATION_CONTRACT_SCHEMA_V3,
  UI_PLAN_CONTRACT_SCHEMA,
  REQUIRED_STOPS,
  deriveImplementationContract,
  renderImplementationMission,
  verifyImplementationMission,
};
