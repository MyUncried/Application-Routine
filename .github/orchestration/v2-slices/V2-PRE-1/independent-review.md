# Revue indépendante matérialisée — V2-PRE-1

Verdict: APPROVED
Plan reviewed: `technical-plan.md`

[KODJO_V2] PLAN_REVIEW_OUTPUT
slice_id=V2-PRE-1
bootstrap_path=.github/orchestration/v2-slices/V2-PRE-1/slice-bootstrap.json
source_head=e216294506bed87dd80855937e3fabfbfa322b82
protocol_execution_head=620f87b981142cd01e98659cda0d323da9f98d34
planning_mode=INITIAL
source_plan_comment_id=5918243649
reviewer=CLAUDE
review_session_id=25caf6b2-1663-4a23-bb75-204982cc2b7b
verdict=APPROVE
STATUT : PLAN_REVIEW_APPROVED

Round-2 candidate confirmed (`corrected_plan_commit=0e476328`, `corrected_plan_blob=0c2b1bee`). Structural diff against the round-1 blob `8ed0768c` shows the change is strictly confined to finding 9: only `UI-D35DA2C4F266` and `REQ-2376BBC2C2A2CA1B` changed (their `tests` lists), four impact rows added/changed, four scope entries added. `KODJO_BOUNDARY_CONTRACT_JSON`, `KODJO_PLAN_DECISIONS_JSON`, `KODJO_NON_UI_REQUIREMENTS_JSON`, `KODJO_NON_UI_COVERAGE_JSON`, `KODJO_PLAN_CLARIFICATIONS_JSON` and the matrix `preservation` block are byte-identical; `requirement_ids_sha256` and `assertion_ids_sha256` are unchanged. The evidence used for findings 1-8, 10 and 11 is therefore untouched.

| N | Correction examinée | Preuve précise | Fermé | Justification |
|---|---|---|---|---|
| 1 | ExerciseScreen.tsx reclassé MODIFY, ajouté à `scope_allow`/`write_scope`, rattaché à `REQ-7F0490E8E377987C` / `UI-7138CD4F656C`, test `ExerciseScreen.test.tsx` requis | Row `src/features/sessions/ExerciseScreen.tsx` `classification=MODIFY` ; `KODJO_PLAN_CONTRACT_JSON.write_scope` ; `UI-7138CD4F656C` assertions `-A7927DC0DEE92`, `-AB361F9B9383E`, `-A41D43154AAE0` ; `…/__tests__/ExerciseScreen.test.tsx` en `required_test_writes`, row `TEST_MUST_ADAPT`. Inchangé au tour 2 (`assertion_ids_sha256` et `requirement_ids_sha256` identiques) | OUI | Reporté de la revue run36763786560, non affecté par la correction du tour 2 |
| 2 | CompositionScreen.tsx reclassé MODIFY avec `REQ-492BB5EE6047BD47` / `UI-74BBA70BF09F` couvrant les trois points normatifs ; primitives génériques laissées inchangées avec justification | Row `CompositionScreen.tsx` `MODIFY` ; `write_scope` ; assertions `-AC8AD824374E8`, `-A11F5CF2B687B`, `-AA62F52830301` ; `CompositionScreen.test.tsx` en `required_test_writes` ; `SideModeControl.test.tsx:21,60-61` n'utilise que des props littérales. Rows `ColorPalette.tsx`/`SideModeControl.tsx` inchangées au tour 2 | OUI | Reporté de la revue run36763786560, non affecté par la correction du tour 2 |
| 3 | ActivityCard.tsx en périmètre MODIFY rattaché à la suppression de `recoverySeconds` et au contrat de résolution des Zones ; `ActivityCard.test.tsx` requis | Row `ActivityCard.tsx` `MODIFY` ; `write_scope` ; `UI-07F470FC189F` assertions `-AA4EE9A87C7C7`, `-A9AF26915ACCF` ; change_target de `REQ-FBE85CDF92C9E827` / `UI-CDBCCFD16078` ; test en `required_test_writes`, row `TEST_MUST_ADAPT`. Critère non modifié au tour 2 (seul `UI-D35DA2C4F266` diffère) | OUI | Reporté de la revue run36763786560, non affecté par la correction du tour 2 |
| 4 | ActivitySelectionScreen.tsx en périmètre MODIFY avec les mêmes deux rattachements et son test requis | Row `ActivitySelectionScreen.tsx` `MODIFY` ; `write_scope` ; `UI-9C227EDDE427` assertions `-A1D27AEDC4E85`, `-AB219BEAE758C` ; change_target de `UI-CDBCCFD16078` ; test en `required_test_writes`, row `TEST_MUST_ADAPT`. Inchangé au tour 2 | OUI | Reporté de la revue run36763786560, non affecté par la correction du tour 2 |
| 5 | `UI-73382D60E040` éclaté en quatre assertions nommant les quatre chemins de clé `UNILATERAL`, deux modifiés et deux gelés, avec les tests d'écran en périmètre | Assertions `-A3E11D4F3FF2A`, `-AA62F6B2F0B57`, `-AF7FFFF9CA501`, `-A4D1451B88C36` ; test `src/shared/i18n/index.test.ts` ; `CompositionScreen.test.tsx` et `ExerciseScreen.test.tsx` en `required_test_writes`. Critère identique au tour 2 | OUI | Reporté de la revue run36763786560, non affecté par la correction du tour 2 |
| 6 | `UI-CDBCCFD16078` étendu par la signature cible de `formatExerciseBodyZones` et le contrat de `formatActivityRecoveryLabel`, trois appelants et leurs tests en change_targets | Assertions `-A8E35BF832F87` (`formatExerciseBodyZones(bodyZoneIds: readonly string[], bodyZones: readonly BodyZone[]): string \| null`) et `-AFDAAA5838C4F` ; change_targets `compositionPresentation.ts, CompositionScreen.tsx, ActivityCard.tsx, ActivitySelectionScreen.tsx` ; baseline `compositionPresentation.ts:479,506`. Critère identique au tour 2 | OUI | Reporté de la revue run36763786560, non affecté par la correction du tour 2 |
| 7 | `defaults.ts` retiré du périmètre d'écriture et protégé par un locator PRESERVE `FILE_UNCHANGED`, lié à la comparaison du SQL effectif | `KODJO_BOUNDARY_CONTRACT_JSON` PRESERVE `src/domain/categories/defaults.ts` `FILE_UNCHANGED` ; `boundary_count=12` ; hors `write_scope` (98) et `modified_modules` (89) ; `REQ-D22AC3A2E90D8620` lié à `migrateDatabase.test.ts` et `targetSchema.test.ts`. Bloc frontières byte-identique au tour 2, `preservation` identique | OUI | Reporté de la revue run36763786560, non affecté par la correction du tour 2 |
| 8 | `validation.ts` gelé par `FILE_UNCHANGED` et hors périmètre ; réécriture de l'union `ValidationField` portée par `errors.ts` ; SQL historique comparé | Boundary PRESERVE `src/domain/categories/validation.ts` `FILE_UNCHANGED` ; `REQ-D27BF6F54CCDD015` change_targets = `[src/domain/categories/errors.ts]` ; baseline `src/domain/categories/errors.ts:12` ; `canonicalCategoryKey` (`validation.ts:39`) importé par `migration002.ts:2`, couvert par `REQ-D22AC3A2E90D8620`. Blocs concernés inchangés au tour 2 | OUI | Reporté de la revue run36763786560, non affecté par la correction du tour 2 |
| 9 | Déclaration du blast radius de `UI-D35DA2C4F266` / `REQ-2376BBC2C2A2CA1B` : les quatre tests hors périmètre entrent en périmètre d'écriture et en tests requis, et `SessionCard.test.tsx` est reclassé | Les quatre chemins sont dans `scope_allow` (98), `KODJO_PLAN_CONTRACT_JSON.write_scope` (98) et `required_test_writes` (41). Rows d'impact : `formatSessionSummary.test.ts`, `ExerciseExitConfirmModal.test.tsx`, `CatalogueCreateOptions.test.tsx` ajoutées en `MODIFIED_MODULE` / `MODIFY` (aussi dans `KODJO_MODIFIED_MODULES_JSON`, 89) ; `SessionCard.test.tsx` passe de `TEST_UNAFFECTED` à `TEST_MUST_ADAPT`, la justification réfutée étant remplacée par « Blast radius du critère UI-D35DA2C4F266 … les lignes 37 et 185 assertent « 1 activité · … » issu de fr.ts activitySingular/activityPlural via formatSessionSummary et SessionCard ». `UI-D35DA2C4F266.tests` et `REQ-2376BBC2C2A2CA1B.tests` listent désormais les quatre tests + `index.test.ts` ; `KODJO_TEST_CONTRACT_JSON` passe de 57 à 61 liaisons, dont 5 pour `REQ-2376BBC2C2A2CA1B`. Prose §12 « Correction du constat 9 » (plan:255-258), « Tests supplémentaires » (plan:265-268) et `scope_allow` machine. Contre-vérification indépendante à la baseline `e216294` : tout fichier de test contenant une assertion sur une chaîne littérale « activité » est désormais dans `write_scope`, la seule exception `src/features/sessions/__tests__/CatalogueScreen.test.tsx:364` portant sur une donnée de fixture construite localement (`:86 name: \`Activité ${id}\``) et non sur une valeur de `fr.ts`, sa ligne 363 n'utilisant qu'une référence dynamique `strings.screens.activities.title` | OUI | La partie exacte restée non satisfaite — « with its blast radius and tests » — est désormais inscrite : les quatre fichiers que j'avais nommés comme condition de fermeture (`SessionCard.test.tsx`, `formatSessionSummary.test.ts`, `ExerciseExitConfirmModal.test.tsx`, `CatalogueCreateOptions.test.tsx`) sont en périmètre d'écriture, en tests requis et liés au critère par le contrat de tests, et la classification `TEST_UNAFFECTED` réfutée de `SessionCard.test.tsx` est corrigée avec une justification conforme au code. Le renommage §4 ne laisse plus de test rouge hors périmètre, donc `REQ-7121A20CC376709A` et les critères de sortie de §11 redeviennent atteignables sans arrêt `SCOPE_EXPANSION_REQUIRED`. L'inventaire est vérifié complet indépendamment, la seule occurrence hors périmètre restante ne dépendant pas des valeurs renommées. |
| 10 | Exigence explicite `REQ-4EBE6018B4091DBB` sur la compatibilité future des variantes média, avec preuves dans `MediaRepository.test.ts` et `targetSchema.test.ts` | `KODJO_NON_UI_REQUIREMENTS_JSON` entrée « §13 — compatibilité future des variantes média » ; change_targets `MediaAsset.ts, ActivityMedia.ts, MediaRepository.ts, migration007.ts` ; bindings vers les deux tests nommés. Bloc `KODJO_NON_UI_REQUIREMENTS_JSON` byte-identique au tour 2 | OUI | Reporté de la revue run36763786560, non affecté par la correction du tour 2 |
| 11 | Ré-énumération de `KODJO_NON_UI_COVERAGE_JSON` avec les quatre consommateurs et §§4/13, motif réaligné sur `kodjo.ui-criteria.v3` / `kodjo.ui-plan-criteria.v2` version 2 et sur les onze constats structurés | `source_paths` inclut `ActivityCard.tsx`, `ActivitySelectionScreen.tsx`, `CompositionScreen.tsx`, `ExerciseScreen.tsx` et `qualification-spec.md` ; `reason` cite les §§4 et 13, la matrice et la version du contrat, et « ne transforme pas un verdict REVISE en APPROVE ». Bloc `KODJO_NON_UI_COVERAGE_JSON` byte-identique au tour 2 ; `KODJO_UI_PLAN_CONTRACT_JSON.contract_version` toujours 2, matrice toujours 13 critères / 32 assertions | OUI | Reporté de la revue run36763786560, non affecté par la correction du tour 2 |

<KODJO_PRE1_CLOSURE_JSON>
{"closures":[{"finding":1,"closed":true,"correction_examined":"ExerciseScreen.tsx reclassé MODIFY, ajouté à scope_allow/write_scope, rattaché à REQ-7F0490E8E377987C / UI-7138CD4F656C, test ExerciseScreen.test.tsx requis","evidence":"Row src/features/sessions/ExerciseScreen.tsx classification=MODIFY ; KODJO_PLAN_CONTRACT_JSON.write_scope ; UI-7138CD4F656C assertions -A7927DC0DEE92 / -AB361F9B9383E / -A41D43154AAE0 ; required_test_writes contient src/features/sessions/__tests__/ExerciseScreen.test.tsx (row TEST_MUST_ADAPT) ; diff tour 2 : critère et exigence inchangés, assertion_ids_sha256 et requirement_ids_sha256 identiques","justification":"Reporté de la revue run36763786560, non affecté par la correction du tour 2"},{"finding":2,"closed":true,"correction_examined":"CompositionScreen.tsx reclassé MODIFY avec REQ-492BB5EE6047BD47 / UI-74BBA70BF09F couvrant les trois points normatifs ; ColorPalette.tsx et SideModeControl.tsx laissés génériques avec justification","evidence":"Row CompositionScreen.tsx classification=MODIFY ; write_scope ; UI-74BBA70BF09F assertions -AC8AD824374E8 / -A11F5CF2B687B / -AA62F52830301 ; CompositionScreen.test.tsx en required_test_writes ; src/features/sessions/__tests__/SideModeControl.test.tsx:21,60-61 n'utilise que des props littérales ; diff tour 2 : rows ColorPalette.tsx et SideModeControl.tsx inchangées","justification":"Reporté de la revue run36763786560, non affecté par la correction du tour 2"},{"finding":3,"closed":true,"correction_examined":"ActivityCard.tsx en périmètre MODIFY rattaché à la suppression de recoverySeconds et au contrat de résolution des Zones ; ActivityCard.test.tsx requis","evidence":"Row ActivityCard.tsx classification=MODIFY ; write_scope ; UI-07F470FC189F assertions -AA4EE9A87C7C7 et -A9AF26915ACCF ; change_target de REQ-FBE85CDF92C9E827 / UI-CDBCCFD16078 ; ActivityCard.test.tsx en required_test_writes, row TEST_MUST_ADAPT ; diff tour 2 : seul UI-D35DA2C4F266 modifié","justification":"Reporté de la revue run36763786560, non affecté par la correction du tour 2"},{"finding":4,"closed":true,"correction_examined":"ActivitySelectionScreen.tsx en périmètre MODIFY avec les mêmes deux rattachements et son test requis","evidence":"Row ActivitySelectionScreen.tsx classification=MODIFY ; write_scope ; UI-9C227EDDE427 assertions -A1D27AEDC4E85 et -AB219BEAE758C ; change_target de UI-CDBCCFD16078 ; ActivitySelectionScreen.test.tsx en required_test_writes, row TEST_MUST_ADAPT ; diff tour 2 : critères et exigences concernés inchangés","justification":"Reporté de la revue run36763786560, non affecté par la correction du tour 2"},{"finding":5,"closed":true,"correction_examined":"UI-73382D60E040 éclaté en quatre assertions nommant les quatre chemins de clé UNILATERAL, deux modifiés et deux gelés, avec CompositionScreen/ExerciseScreen tests en périmètre","evidence":"Assertions -A3E11D4F3FF2A (shared.sideMode.valueLabels.UNILATERAL = «Aucun»), -AA62F6B2F0B57, -AF7FFFF9CA501 (tour.valueLabels.UNILATERAL = «–», préservée), -A4D1451B88C36 (tour.accessibilityLabels.UNILATERAL, préservée) ; test src/shared/i18n/index.test.ts ; CompositionScreen.test.tsx et ExerciseScreen.test.tsx en required_test_writes ; diff tour 2 : UI-73382D60E040 identique","justification":"Reporté de la revue run36763786560, non affecté par la correction du tour 2"},{"finding":6,"closed":true,"correction_examined":"UI-CDBCCFD16078 étendu par la signature cible de formatExerciseBodyZones et le contrat de formatActivityRecoveryLabel, avec les trois appelants et leurs tests en change_targets","evidence":"Assertion -A8E35BF832F87 (formatExerciseBodyZones(bodyZoneIds: readonly string[], bodyZones: readonly BodyZone[]): string | null) et -AFDAAA5838C4F (récupération réservée à l'occurrence, zéro affiché) ; change_targets compositionPresentation.ts, CompositionScreen.tsx, ActivityCard.tsx, ActivitySelectionScreen.tsx ; baseline compositionPresentation.ts:479 et :506 ; diff tour 2 : UI-CDBCCFD16078 identique","justification":"Reporté de la revue run36763786560, non affecté par la correction du tour 2"},{"finding":7,"closed":true,"correction_examined":"defaults.ts retiré du périmètre d'écriture et protégé par un locator PRESERVE FILE_UNCHANGED, lié à la comparaison du SQL effectif de migrateDatabase.test.ts","evidence":"KODJO_BOUNDARY_CONTRACT_JSON PRESERVE src/domain/categories/defaults.ts invariant_type=FILE_UNCHANGED, boundary_count=12 ; hors write_scope (98) et modified_modules (89) ; REQ-D22AC3A2E90D8620 lié à migrateDatabase.test.ts et targetSchema.test.ts ; diff tour 2 : KODJO_BOUNDARY_CONTRACT_JSON et matrice preservation byte-identiques","justification":"Reporté de la revue run36763786560, non affecté par la correction du tour 2"},{"finding":8,"closed":true,"correction_examined":"validation.ts gelé par FILE_UNCHANGED et hors périmètre ; réécriture de l'union ValidationField portée par errors.ts ; SQL historique comparé à la baseline","evidence":"Boundary PRESERVE src/domain/categories/validation.ts FILE_UNCHANGED ; REQ-D27BF6F54CCDD015 change_targets = [src/domain/categories/errors.ts] ; baseline src/domain/categories/errors.ts:12 déclare CategoryValidationField ; canonicalCategoryKey (validation.ts:39) importé par migration002.ts:2, couvert par REQ-D22AC3A2E90D8620 ; diff tour 2 : blocs concernés inchangés","justification":"Reporté de la revue run36763786560, non affecté par la correction du tour 2"},{"finding":9,"closed":true,"correction_examined":"Déclaration du blast radius de UI-D35DA2C4F266 / REQ-2376BBC2C2A2CA1B : les quatre tests hors périmètre entrent en modified_modules, scope_allow, write_scope, required_test_writes et dans les tests du critère ; SessionCard.test.tsx reclassé TEST_MUST_ADAPT","evidence":"scope_allow 94→98, write_scope 94→98, required_test_writes 37→41, KODJO_MODIFIED_MODULES_JSON 86→89, liaisons du contrat de tests 57→61 dont 5 pour REQ-2376BBC2C2A2CA1B. Rows ajoutées MODIFIED_MODULE/MODIFY pour src/features/sessions/__tests__/formatSessionSummary.test.ts, src/features/sessions/__tests__/ExerciseExitConfirmModal.test.tsx, src/features/activities/__tests__/CatalogueCreateOptions.test.tsx ; row src/features/sessions/__tests__/SessionCard.test.tsx passe de TEST_UNAFFECTED à TEST_MUST_ADAPT avec la justification refutée remplacée par «Blast radius du critère UI-D35DA2C4F266 … les lignes 37 et 185 assertent «1 activité · …» issu de fr.ts activitySingular/activityPlural via formatSessionSummary et SessionCard». UI-D35DA2C4F266.tests et REQ-2376BBC2C2A2CA1B.tests listent les quatre tests plus src/shared/i18n/index.test.ts. Prose plan:255-258 et plan:265-268. Contre-vérification à la baseline e216294 : tous les tests assertant une chaîne littérale «activité» sont dans write_scope, seule exception src/features/sessions/__tests__/CatalogueScreen.test.tsx:364 portant sur la fixture locale :86 name: `Activité ${id}` et non sur une valeur de fr.ts","justification":"La partie exacte de expected_correction restée non satisfaite — «with its blast radius and tests» — est désormais inscrite, et la condition de fermeture que j'avais énoncée est remplie point par point : les quatre fichiers nommés sont en périmètre d'écriture et en tests requis, liés au critère par le contrat de tests, et la classification TEST_UNAFFECTED de SessionCard.test.tsx, réfutée par sa ligne 37, est corrigée avec une justification conforme au code. Le renommage §4 ne laisse plus aucun test rouge hors périmètre, donc REQ-7121A20CC376709A et les critères de sortie de §11 sont atteignables sans arrêt SCOPE_EXPANSION_REQUIRED. L'inventaire est vérifié complet de façon indépendante, la seule occurrence restante hors périmètre ne dépendant pas des valeurs renommées."},{"finding":10,"closed":true,"correction_examined":"Exigence explicite REQ-4EBE6018B4091DBB sur la compatibilité future des variantes média, avec preuves dans MediaRepository.test.ts et targetSchema.test.ts","evidence":"KODJO_NON_UI_REQUIREMENTS_JSON entrée «§13 — compatibilité future des variantes média» (identité d'asset indépendante, plusieurs assets par Exercice, aucun UNIQUE sur exercice seul, aucune enum fermée, extension additive par assetId) ; change_targets MediaAsset.ts, ActivityMedia.ts, MediaRepository.ts, migration007.ts ; bindings vers les deux tests nommés ; diff tour 2 : KODJO_NON_UI_REQUIREMENTS_JSON byte-identique","justification":"Reporté de la revue run36763786560, non affecté par la correction du tour 2"},{"finding":11,"closed":true,"correction_examined":"Ré-énumération de KODJO_NON_UI_COVERAGE_JSON avec les quatre consommateurs et §§4/13, et réalignement du motif sur la version réelle du contrat et sur les onze constats structurés","evidence":"source_paths inclut ActivityCard.tsx, ActivitySelectionScreen.tsx, CompositionScreen.tsx, ExerciseScreen.tsx et qualification-spec.md ; reason cite les §§4 et 13, «Matrice kodjo.ui-criteria.v3, contrat kodjo.ui-plan-criteria.v2 version 2» et «ne transforme pas un verdict REVISE en APPROVE» ; KODJO_UI_PLAN_CONTRACT_JSON.contract_version=2, matrice 13 critères / 32 assertions ; diff tour 2 : KODJO_NON_UI_COVERAGE_JSON byte-identique","justification":"Reporté de la revue run36763786560, non affecté par la correction du tour 2"}]}
</KODJO_PRE1_CLOSURE_JSON>

<KODJO_REVIEW_FINDINGS_JSON>
{"findings":[]}
</KODJO_REVIEW_FINDINGS_JSON>
<KODJO_PLAN_IMPACT_REVIEW_JSON>
{
  "schema": "kodjo.plan-impact-review.v1",
  "scan_revision": "e216294506bed87dd80855937e3fabfbfa322b82",
  "plan_scan_sha256": "cbdeb42f0f7734d5204bb15843ed8faeb13dbd488c7b0c00f7c7e415585110d9",
  "reviewer_scan_sha256": "cbdeb42f0f7734d5204bb15843ed8faeb13dbd488c7b0c00f7c7e415585110d9",
  "candidate_count": 41,
  "verdict": "MATCH"
}
</KODJO_PLAN_IMPACT_REVIEW_JSON>

<KODJO_PLAN_CONTRACT_REVIEW_JSON>
{
  "schema": "kodjo.plan-contract-consistency.v2",
  "contract_version": 2,
  "protocol_commit": "620f87b981142cd01e98659cda0d323da9f98d34",
  "scan_revision": "e216294506bed87dd80855937e3fabfbfa322b82",
  "write_scope": [
    "src/domain/activities/ActivityDefinition.ts",
    "src/domain/activities/ActivityDefinitionRepository.ts",
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/activities/index.ts",
    "src/domain/body-zones/BodyZone.ts",
    "src/domain/body-zones/BodyZoneRepository.ts",
    "src/domain/body-zones/__tests__/BodyZone.test.ts",
    "src/domain/body-zones/index.ts",
    "src/domain/categories/Category.ts",
    "src/domain/categories/CategoryRepository.ts",
    "src/domain/categories/__tests__/matching.test.ts",
    "src/domain/categories/__tests__/validation.test.ts",
    "src/domain/categories/errors.ts",
    "src/domain/categories/index.ts",
    "src/domain/categories/matching.ts",
    "src/domain/labels/Label.ts",
    "src/domain/labels/LabelRepository.ts",
    "src/domain/labels/__tests__/Label.test.ts",
    "src/domain/labels/index.ts",
    "src/domain/media/ActivityMedia.ts",
    "src/domain/media/MediaAsset.ts",
    "src/domain/media/MediaRepository.ts",
    "src/domain/media/__tests__/MediaRepository.test.ts",
    "src/domain/media/index.ts",
    "src/domain/preferences/Profile.ts",
    "src/domain/preferences/ProfileRepository.ts",
    "src/domain/preferences/__tests__/Profile.test.ts",
    "src/domain/preferences/index.ts",
    "src/domain/sessions/Session.ts",
    "src/domain/sessions/SessionDraft.ts",
    "src/domain/sessions/SessionRepository.ts",
    "src/domain/sessions/StopPoint.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/StopPoint.test.ts",
    "src/domain/sessions/__tests__/calculations.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/domain/sessions/__tests__/sideMode.test.ts",
    "src/domain/sessions/__tests__/validation.test.ts",
    "src/domain/sessions/calculations.ts",
    "src/domain/sessions/composition.ts",
    "src/domain/sessions/defaults.ts",
    "src/domain/sessions/errors.ts",
    "src/domain/sessions/index.ts",
    "src/domain/sessions/sideMode.ts",
    "src/domain/sessions/validation.ts",
    "src/features/activities/ActivityCard.tsx",
    "src/features/activities/ActivityDefinitionService.ts",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/activities/__tests__/ActivityCard.test.tsx",
    "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
    "src/features/reference-data/__tests__/bodyZones.test.ts",
    "src/features/reference-data/bodyZones.ts",
    "src/features/sessions/BodyZoneSelector.tsx",
    "src/features/sessions/CategoriesScreen.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SessionService.ts",
    "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseExitConfirmModal.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionCard.test.tsx",
    "src/features/sessions/__tests__/SessionService.test.ts",
    "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "src/features/sessions/__tests__/formatSessionSummary.test.ts",
    "src/features/sessions/compositionPresentation.ts",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
    "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/infrastructure/database/__tests__/targetSchema.test.ts",
    "src/infrastructure/database/constants.ts",
    "src/infrastructure/database/initializeDatabase.ts",
    "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
    "src/infrastructure/database/migrateDatabase.ts",
    "src/infrastructure/database/migrations/migration007.ts",
    "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
    "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
    "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
    "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
    "src/infrastructure/database/repositories/SqliteMediaRepository.ts",
    "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
    "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
    "src/infrastructure/database/types/DatabaseRows.ts",
    "src/shared/i18n/index.test.ts",
    "src/shared/i18n/resources/fr.ts"
  ],
  "required_test_writes": [
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/body-zones/__tests__/BodyZone.test.ts",
    "src/domain/categories/__tests__/matching.test.ts",
    "src/domain/categories/__tests__/validation.test.ts",
    "src/domain/labels/__tests__/Label.test.ts",
    "src/domain/media/__tests__/MediaRepository.test.ts",
    "src/domain/preferences/__tests__/Profile.test.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/StopPoint.test.ts",
    "src/domain/sessions/__tests__/calculations.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/domain/sessions/__tests__/sideMode.test.ts",
    "src/domain/sessions/__tests__/validation.test.ts",
    "src/features/activities/__tests__/ActivityCard.test.tsx",
    "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
    "src/features/reference-data/__tests__/bodyZones.test.ts",
    "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseExitConfirmModal.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionCard.test.tsx",
    "src/features/sessions/__tests__/SessionService.test.ts",
    "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "src/features/sessions/__tests__/formatSessionSummary.test.ts",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
    "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/infrastructure/database/__tests__/targetSchema.test.ts",
    "src/shared/i18n/index.test.ts"
  ],
  "requirement_contract_sha256": "ab92fdf081e09329b82bf006c27d870db2bce50572517ecbc896d6aa71ec7285",
  "test_contract_sha256": "16c1a941a0b965e63336a17780fc96050c7892d4908cab5d97a69a907a023e5f",
  "boundary_contract_sha256": "8d290bd47df7851de55aadc88c35156bb213a035e83b2348452378b1fb2bf3a0",
  "requirement_count": 27
}
</KODJO_PLAN_CONTRACT_REVIEW_JSON>

<KODJO_UI_PLAN_CONTRACT_REVIEW_JSON>
{
  "schema": "kodjo.ui-plan-contract.v1",
  "contract_version": 2,
  "protocol_commit": "620f87b981142cd01e98659cda0d323da9f98d34",
  "scan_revision": "e216294506bed87dd80855937e3fabfbfa322b82",
  "ui_applicable": true,
  "ui_paths": [
    "src/features/activities/ActivityCard.tsx",
    "src/features/activities/ActivityDefinitionService.ts",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/reference-data/bodyZones.ts",
    "src/features/sessions/BodyZoneSelector.tsx",
    "src/features/sessions/CategoriesScreen.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SessionService.ts",
    "src/features/sessions/compositionPresentation.ts",
    "src/shared/i18n/resources/fr.ts"
  ],
  "criterion_count": 13,
  "assertion_count": 32,
  "assertion_ids_sha256": "534163c795e81bbf3909122b2bdd0ec2568c187f94d8d0564979cc8b5e8d836f",
  "matrix_sha256": "d08cde6f5d92cde30023c9d9549164b7e750485bc932a6a4d1511c1820b8543a"
}
</KODJO_UI_PLAN_CONTRACT_REVIEW_JSON>

<KODJO_PLAN_REVIEW_FINDINGS_JSON>
{
  "schema": "kodjo.plan-review-findings.v1",
  "finding_count": 0,
  "verdict": "APPROVE",
  "affected_targets": [],
  "findings": []
}
</KODJO_PLAN_REVIEW_FINDINGS_JSON>
