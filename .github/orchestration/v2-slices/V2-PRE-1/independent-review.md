# Revue indépendante matérialisée — V2-PRE-1

Verdict: APPROVED
Plan reviewed: `technical-plan.md`

[KODJO_V2] PLAN_REVIEW_OUTPUT
slice_id=V2-PRE-1
bootstrap_path=.github/orchestration/v2-slices/V2-PRE-1/slice-bootstrap.json
source_head=e216294506bed87dd80855937e3fabfbfa322b82
protocol_execution_head=30769e138c26f541e81ad007bda436fb755615a8
planning_mode=INITIAL
source_plan_comment_id=5930810339
reviewer=CLAUDE
review_session_id=25caf6b2-1663-4a23-bb75-204982cc2b7b
verdict=APPROVE
STATUT : PLAN_REVIEW_APPROVED

Verified against the round-4 candidate (`corrected_plan_commit=32e680cb`, `corrected_plan_blob=6ee4a875`). The structural diff versus the approved round-3 candidate is confined to this single correction and its recomputed derived contracts.

| N | Correction examinée | Preuve précise | Fermé | Justification |
|---|---|---|---|---|
| 1 | `src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx` reclassé `TEST_UNAFFECTED` → `TEST_MUST_ADAPT`, ajouté au périmètre d'écriture, aux tests requis et aux tests de `UI-CDBCCFD16078`, avec adaptation explicitement bornée aux seuls mocks `expo-sqlite` / `SqliteBodyZoneRepository` et sans modification d'assertion | Row d'impact du fichier : `classification` passe de `TEST_UNAFFECTED` (« Le flux UI existant reste hors périmètre … ») à `TEST_MUST_ADAPT`, justification « Changement de périmètre décidé par Hermann (option A, run 36854959192) : la suppression du fallback runtime BODY_ZONES de CompositionScreen exigée par la revue 5930269937 laisse le test 4 (ligne 297) sans référentiel, car il rend l'écran par les routes réelles sans SQLiteProvider. Adaptation limitée à l'ajout des mocks expo-sqlite et SqliteBodyZoneRepository déjà utilisés par les tests du périmètre ; aucune assertion modifiée. » — `candidate_kind`, `triggered_by` et `risk_score` inchangés. `write_scope` 99→100, `scope_allow` 100, `required_test_writes` 42→43, le fichier étant présent dans les trois ; `UI-CDBCCFD16078.tests` le contient désormais (5 tests) et `REQ-FBE85CDF92C9E827.tests` aussi, avec la liaison ajoutée `REQ-FBE85CDF92C9E827 → …/CatalogueCompositionEditFlow.integration.test.tsx` (liaisons 64→65). Prose §12 tour 4 : « **Adaptation strictement limitée** à l'ajout des mocks `expo-sqlite` et `SqliteBodyZoneRepository` déjà utilisés par les tests du périmètre … ; aucune assertion de ce fichier n'est ajoutée, supprimée ni modifiée. » Baseline `e216294` confirmée : la ligne 297 est `screen.getByTestId("composition-exercise-body-zones")` du test 4, assertant `"Épaules · Dos"`, noms résolus aujourd'hui par le fallback `compositionPresentation.ts:484` (`BODY_ZONES.filter(...)`), et le fichier ne contient aucun mock `expo-sqlite`/`SQLiteProvider` (seul `expo-haptics` à la ligne 46) ; le motif de mock invoqué existe bien dans le périmètre (`CategoriesSaveFlow.integration.test.tsx:19-21`, dans `write_scope`) et `SqliteBodyZoneRepository.ts` y figure également. Confinement du diff : `KODJO_MODIFIED_MODULES_JSON` (90), `KODJO_PLAN_DECISIONS_JSON`, `KODJO_NON_UI_REQUIREMENTS_JSON` (15), `KODJO_NON_UI_COVERAGE_JSON`, `KODJO_BOUNDARY_CONTRACT_JSON`, `KODJO_PLAN_CLARIFICATIONS_JSON` et le bloc `preservation` byte-identiques ; `scan_sha256`, `requirement_ids_sha256` et `assertion_ids_sha256` inchangés ; 131 rows, 13 critères, 32 assertions, 28 exigences ; `UI-CDBCCFD16078` ne change que par son champ `tests` (`source`, `change_targets`, `reuse_search` et les 4 assertions identiques) ; `REQ-FBE85CDF92C9E827` ne change que par son champ `tests` ; aucun chemin retiré du périmètre ni des tests requis ; diff de prose limité à la section « Changement de périmètre après le run de développement 36854959192 (tour 4) », à l'entrée des tests supplémentaires et à la liste `scope_allow` machine | OUI | Tous les éléments de l'`expected_correction` sont réunis : le fichier entre dans `write_scope`, dans `required_test_writes` et dans les tests de `UI-CDBCCFD16078` avec la classification `TEST_MUST_ADAPT` demandée, et le bornage de l'adaptation aux seuls mocks `expo-sqlite` et `SqliteBodyZoneRepository`, sans assertion ajoutée, supprimée ni modifiée, est inscrit à la fois dans la justification de la row d'impact et dans la prose du plan. La cause est vérifiée au code de la baseline : la ligne 297 dépend effectivement du fallback `BODY_ZONES` que la revue 5930269937 impose de supprimer, et le fichier ne dispose d'aucun référentiel SQLite. Le reste du plan est inchangé, les seules évolutions au-delà du fichier ciblé étant les contrats dérivés recalculés qu'impose son entrée au périmètre. |

<KODJO_PRE1_CLOSURE_JSON>
{"closures":[{"finding":1,"closed":true,"correction_examined":"src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx reclassé TEST_UNAFFECTED -> TEST_MUST_ADAPT, ajouté à write_scope, required_test_writes et aux tests de UI-CDBCCFD16078, avec adaptation explicitement bornée aux mocks expo-sqlite et SqliteBodyZoneRepository et sans modification d'assertion","evidence":"Row d'impact du fichier : classification TEST_UNAFFECTED -> TEST_MUST_ADAPT, justification «Changement de périmètre décidé par Hermann (option A, run 36854959192) : la suppression du fallback runtime BODY_ZONES de CompositionScreen exigée par la revue 5930269937 laisse le test 4 (ligne 297) sans référentiel, car il rend l'écran par les routes réelles sans SQLiteProvider. Adaptation limitée à l'ajout des mocks expo-sqlite et SqliteBodyZoneRepository déjà utilisés par les tests du périmètre ; aucune assertion modifiée.» ; candidate_kind, triggered_by et risk_score inchangés. write_scope 99->100, scope_allow 100, required_test_writes 42->43, le fichier présent dans les trois ; UI-CDBCCFD16078.tests et REQ-FBE85CDF92C9E827.tests le contiennent ; liaison ajoutée REQ-FBE85CDF92C9E827 -> ce test (bindings 64->65). Prose §12 tour 4 : «Adaptation strictement limitée à l'ajout des mocks expo-sqlite et SqliteBodyZoneRepository déjà utilisés par les tests du périmètre … ; aucune assertion de ce fichier n'est ajoutée, supprimée ni modifiée.» Baseline e216294 : la ligne 297 est screen.getByTestId(\"composition-exercise-body-zones\") du test 4 assertant «Épaules · Dos», résolu par compositionPresentation.ts:484 (BODY_ZONES.filter), et le fichier n'a aucun mock expo-sqlite/SQLiteProvider (seul expo-haptics ligne 46) ; CategoriesSaveFlow.integration.test.tsx:19-21 porte le motif de mock expo-sqlite et est dans write_scope, tout comme SqliteBodyZoneRepository.ts. Confinement : KODJO_MODIFIED_MODULES_JSON (90), KODJO_PLAN_DECISIONS_JSON, KODJO_NON_UI_REQUIREMENTS_JSON (15), KODJO_NON_UI_COVERAGE_JSON, KODJO_BOUNDARY_CONTRACT_JSON, KODJO_PLAN_CLARIFICATIONS_JSON et le bloc preservation byte-identiques ; scan_sha256, requirement_ids_sha256 et assertion_ids_sha256 inchangés ; 131 rows, 13 critères, 32 assertions, 28 exigences ; UI-CDBCCFD16078 et REQ-FBE85CDF92C9E827 ne changent que par leur champ tests ; aucun chemin retiré ; diff de prose limité à la section tour 4, aux tests supplémentaires et à la liste scope_allow machine","justification":"Tous les éléments de l'expected_correction sont réunis : le fichier entre dans write_scope, dans required_test_writes et dans les tests de UI-CDBCCFD16078 avec la classification TEST_MUST_ADAPT demandée, et le bornage de l'adaptation aux seuls mocks expo-sqlite et SqliteBodyZoneRepository, sans assertion ajoutée, supprimée ni modifiée, est inscrit à la fois dans la justification de la row d'impact et dans la prose du plan. La cause est vérifiée au code de la baseline : la ligne 297 dépend effectivement du fallback BODY_ZONES que la revue 5930269937 impose de supprimer, et le fichier ne dispose d'aucun référentiel SQLite. Le reste du plan est inchangé, les seules évolutions au-delà du fichier ciblé étant les contrats dérivés recalculés qu'impose son entrée au périmètre."}]}
</KODJO_PRE1_CLOSURE_JSON>

<KODJO_REVIEW_FINDINGS_JSON>
{"findings":[]}
</KODJO_REVIEW_FINDINGS_JSON>
<KODJO_PLAN_IMPACT_REVIEW_JSON>
{
  "schema": "kodjo.plan-impact-review.v1",
  "scan_revision": "e216294506bed87dd80855937e3fabfbfa322b82",
  "plan_scan_sha256": "5984df2f214355a2ba739f8c8f310a3f3fc475f342b7e9294b26bd6e32d90119",
  "reviewer_scan_sha256": "5984df2f214355a2ba739f8c8f310a3f3fc475f342b7e9294b26bd6e32d90119",
  "candidate_count": 41,
  "verdict": "MATCH"
}
</KODJO_PLAN_IMPACT_REVIEW_JSON>

<KODJO_PLAN_CONTRACT_REVIEW_JSON>
{
  "schema": "kodjo.plan-contract-consistency.v2",
  "contract_version": 2,
  "protocol_commit": "30769e138c26f541e81ad007bda436fb755615a8",
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
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseExitConfirmModal.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionCard.test.tsx",
    "src/features/sessions/__tests__/SessionService.test.ts",
    "src/features/sessions/__tests__/SideModeControl.test.tsx",
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
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseExitConfirmModal.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionCard.test.tsx",
    "src/features/sessions/__tests__/SessionService.test.ts",
    "src/features/sessions/__tests__/SideModeControl.test.tsx",
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
  "requirement_contract_sha256": "f8754d36f84a5cd228c730a7af7dc0c06e596a3997f0e45df8e550ffc62d22cf",
  "test_contract_sha256": "385ae316b17b97aec0bdbbb12b8cf36e13da8499deda3c59e514e37265c61e3f",
  "boundary_contract_sha256": "8d290bd47df7851de55aadc88c35156bb213a035e83b2348452378b1fb2bf3a0",
  "requirement_count": 28
}
</KODJO_PLAN_CONTRACT_REVIEW_JSON>

<KODJO_UI_PLAN_CONTRACT_REVIEW_JSON>
{
  "schema": "kodjo.ui-plan-contract.v1",
  "contract_version": 2,
  "protocol_commit": "30769e138c26f541e81ad007bda436fb755615a8",
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
  "matrix_sha256": "3ffe69d8f141a9ad66ce8d77cb7685a11ed9e7618bcf02621c91915e9e5bc0e0"
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
