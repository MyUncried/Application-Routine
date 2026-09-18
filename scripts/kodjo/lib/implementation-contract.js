'use strict';

const { extractTaggedJson, sha256, fail } = require('./plan-impact');

const IMPLEMENTATION_CONTRACT_SCHEMA = 'kodjo.ui-implementation-contract.v1';
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

function deriveImplementationContract(planBody, planBlobOid) {
  if (!/^[0-9a-f]{40}$/i.test(String(planBlobOid || ''))) {
    fail('IMPLEMENTATION_PLAN_BLOB_INVALID', 'plan_blob_oid absent ou invalide');
  }
  const matrix = extractTaggedJson(planBody, 'KODJO_UI_CRITERIA_MATRIX_JSON', 'IMPLEMENTATION_UI_MATRIX_MISSING');
  const planContract = extractTaggedJson(planBody, 'KODJO_UI_PLAN_CONTRACT_JSON', 'IMPLEMENTATION_UI_PLAN_CONTRACT_MISSING');
  if (!matrix || matrix.schema !== 'kodjo.ui-criteria.v1') {
    fail('IMPLEMENTATION_UI_MATRIX_INVALID', 'schema kodjo.ui-criteria.v1 requis');
  }
  if (!planContract || planContract.schema !== UI_PLAN_CONTRACT_SCHEMA) {
    fail('IMPLEMENTATION_UI_PLAN_CONTRACT_INVALID', 'schema kodjo.ui-plan-contract.v1 requis');
  }
  const matrixHash = sha256(matrix);
  if (planContract.matrix_sha256 !== matrixHash) {
    fail('IMPLEMENTATION_UI_MATRIX_HASH_MISMATCH', 'matrice != contrat UI approuve');
  }
  const criteria = Array.isArray(matrix.criteria) ? matrix.criteria : [];
  const ids = criteria.map((c) => String(c && c.criterion_id || '')).sort();
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    fail('IMPLEMENTATION_UI_CRITERIA_INVALID', 'criterion_id absent ou duplique');
  }
  const preservation = matrix.preservation;
  if (!preservation || typeof preservation !== 'object' || Array.isArray(preservation)) {
    fail('IMPLEMENTATION_PRESERVATION_INVALID', 'PRESERVE/CHANGE/FORBIDDEN absent');
  }
  for (const key of ['preserve','change','forbidden']) {
    if (!Array.isArray(preservation[key])) fail('IMPLEMENTATION_PRESERVATION_INVALID', key + ' absent');
  }
  return {
    schema: IMPLEMENTATION_CONTRACT_SCHEMA,
    plan_blob_oid: String(planBlobOid).toLowerCase(),
    ui_plan_contract_schema: planContract.schema,
    ui_matrix_sha256: matrixHash,
    ui_criterion_count: ids.length,
    ui_criterion_ids_sha256: sha256(ids),
    ui_preservation_sha256: sha256(preservation),
    ui_applicable: Boolean(planContract.ui_applicable),
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
    'ui_preservation_sha256=' + contract.ui_preservation_sha256,
    'required_stops=' + contract.required_stops.join(','),
    '',
    '## Contrat de développement opposable',
    '',
    '- Lire avant tout code le bloc exact `KODJO_UI_CRITERIA_MATRIX_JSON` de `technical-plan.md`. Cette matrice approuvée est la seule source du contrat UI de cette implémentation ; ne pas la recopier, réencoder ni reconstruire depuis la mémoire.',
    '- Appliquer chaque `criterion_id` sans omission et respecter sa décision `REUSE | EXTEND | CREATE`, ses `change_targets`, ses tests et ses `proof_required`.',
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
    'Le rapport final doit contenir un bloc `KODJO_IMPLEMENTATION_CONFORMANCE` listant chaque `criterion_id` approuvé avec : `implementation_status`, `files_or_symbols`, `component_used`, `tests_run`, `proof_status`, `preserve_status`, `residual_status`.',
    'Aucun critère ne peut disparaître du rapport. Toute preuve visuelle/device non exécutée reste `PENDING_DEVICE` ou `NON_VERIFIABLE`.',
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
    ui_preservation_sha256: lineField(missionText, 'ui_preservation_sha256'),
    required_stops: lineField(missionText, 'required_stops').split(',').filter(Boolean),
  };
  if (observed.schema !== derived.schema ||
      observed.plan_blob_oid !== derived.plan_blob_oid ||
      observed.ui_plan_contract_schema !== derived.ui_plan_contract_schema ||
      observed.ui_matrix_sha256 !== derived.ui_matrix_sha256 ||
      observed.ui_criterion_count !== derived.ui_criterion_count ||
      observed.ui_criterion_ids_sha256 !== derived.ui_criterion_ids_sha256 ||
      observed.ui_preservation_sha256 !== derived.ui_preservation_sha256 ||
      JSON.stringify(observed.required_stops) !== JSON.stringify(derived.required_stops)) {
    fail('IMPLEMENTATION_CONTRACT_DRIFT', 'mission != plan UI approuve');
  }
  const requiredFragments = [
    'REUSE | EXTEND | CREATE',
    'PRESERVE / CHANGE / FORBIDDEN',
    'PENDING_DEVICE',
    'KODJO_IMPLEMENTATION_CONFORMANCE',
    'Une suite Jest verte ne constitue jamais à elle seule',
  ];
  for (const fragment of requiredFragments) {
    if (!String(missionText).includes(fragment)) fail('IMPLEMENTATION_CONTRACT_INCOMPLETE', fragment);
  }
  return derived;
}

module.exports = {
  IMPLEMENTATION_CONTRACT_SCHEMA,
  UI_PLAN_CONTRACT_SCHEMA,
  REQUIRED_STOPS,
  deriveImplementationContract,
  renderImplementationMission,
  verifyImplementationMission,
};
