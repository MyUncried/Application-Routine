# Revue indépendante matérialisée — V2-PRE-1

Verdict: APPROVED
Plan reviewed: `technical-plan.md`

[KODJO_V2] PLAN_REVIEW_OUTPUT
slice_id=V2-PRE-1
bootstrap_path=.github/orchestration/v2-slices/V2-PRE-1/slice-bootstrap.json
source_head=e216294506bed87dd80855937e3fabfbfa322b82
protocol_execution_head=e49e5a97069c017baac4ff7743403de49d5cfb42
planning_mode=INITIAL
source_plan_comment_id=5939160567
reviewer=CLAUDE
review_session_id=25caf6b2-1663-4a23-bb75-204982cc2b7b
verdict=APPROVE
STATUT : PLAN_REVIEW_APPROVED

All elements of item 1's `expected_correction` are present, and the round-5 diff is confined to that correction plus its recomputed derived contracts.

| N | Correction examinée | Preuve précise | Fermé | Justification |
|---|---|---|---|---|
| 1 | `SessionServiceProvider.tsx` reclassé `CONSUMER_UNAFFECTED` → `MODIFY` et `SessionServiceProvider.test.tsx` reclassé `TEST_UNAFFECTED` → `TEST_MUST_ADAPT` ; les deux ajoutés au périmètre d'écriture et aux cibles/tests de `UI-16294D4D4345` et de `REQ-A2F15FD967FEAC96`, le test aux tests requis ; modification du provider bornée à l'injection de `SqliteProfileRepository` construit sur la même connexion en troisième argument, et du test à un seul test ajouté, sans assertion existante modifiée | Row d'impact `src/features/sessions/SessionServiceProvider.tsx` : `classification` `CONSUMER_UNAFFECTED` → `MODIFY`, justification « … le chemin de production construit SessionService sans ProfileRepository, si bien que le snapshot du Profil (REQ-A2F15FD967FEAC96, UI-16294D4D4345) ne s'applique pas dans l'application. Seule modification permise : injecter SqliteProfileRepository, construit sur la même connexion, comme troisième argument de SessionService ; aucun autre changement du provider. » ; row `…/__tests__/SessionServiceProvider.test.tsx` : `TEST_UNAFFECTED` → `TEST_MUST_ADAPT`, justification « … prouver par le provider réel (base en mémoire migrée) que la création d'une occurrence initialise postActivityRecoverySeconds depuis le Profil persistant. Ajout de ce seul test ; aucune assertion existante ajoutée, supprimée ni modifiée. » — `candidate_kind`, `triggered_by` et `risk_score` inchangés pour les deux. `KODJO_PLAN_DECISIONS_JSON` : 41 entrées, exactement ces deux lignes modifiées, désormais alignées sur les rows d'impact. `write_scope` et `scope_allow` 100 → 102 contenant les deux chemins ; `required_test_writes` 43 → 44 contenant le test. `UI-16294D4D4345.change_targets` = `[SessionService.ts, SessionServiceProvider.tsx]` et `.tests` = `[SessionService.test.ts, SessionServiceProvider.test.tsx]`, ses deux assertions `-A60BD8133829B` / `-A88C0507C1BC3` inchangées ; `REQ-A2F15FD967FEAC96.change_targets` et `.tests` gagnent le provider et son test, de même que l'entrée non-UI `qualification-spec.md §§7 et 10` qui en est la source, et `REQ-982901A85204184E` (exigence UI miroir du critère) ; liaisons 65 → 67 (`REQ-982901A85204184E` et `REQ-A2F15FD967FEAC96` → `SessionServiceProvider.test.tsx`) ; `ui_paths` 12 → 13 par l'ajout du provider, dérivé des `change_targets` du critère. `SqliteProfileRepository.ts` est déjà dans `write_scope`, l'injection n'exigeant donc aucune extension supplémentaire. Prose §12 tour 5 : « **Correction strictement limitée** : le provider injecte `SqliteProfileRepository`, construit sur la même connexion, comme troisième argument de `SessionService` ; `SessionServiceProvider.test.tsx` reçoit un seul test supplémentaire prouvant, par le provider réel et la base en mémoire migrée, que la création d'une occurrence initialise `postActivityRecoverySeconds` depuis le Profil persistant ; aucune assertion existante n'est modifiée. » Constat vérifié à la baseline `e216294` : `SessionServiceProvider.tsx:92-95` construit `new SessionService(new SqliteSessionRepository(database), new SqliteCategoryRepository(database),)` — deux arguments seulement, `SqliteProfileRepository` absent de ses imports (lignes 8-9) ; `SessionServiceProvider.test.tsx` existe. Confinement du diff : `KODJO_MODIFIED_MODULES_JSON` (90, identique — les deux chemins restent des candidats de scan reclassés, non promus en racines), `KODJO_NON_UI_COVERAGE_JSON`, `KODJO_BOUNDARY_CONTRACT_JSON`, `KODJO_PLAN_CLARIFICATIONS_JSON` et le bloc `preservation` byte-identiques ; `scan_sha256`, `requirement_ids_sha256`, `assertion_ids_sha256` et `boundary_contract_sha256` inchangés ; 131 rows, 13 critères, 32 assertions, 28 exigences, 15 exigences non UI ; aucun chemin retiré du périmètre ni des tests requis ; diff de prose limité à la section « Changement de périmètre après la revue d'implémentation 5938943370 (tour 5) », à l'entrée des tests supplémentaires et aux deux lignes de la liste `scope_allow` machine | OUI | Les deux reclassements exigés sont inscrits avec leur classification exacte, les deux chemins entrent dans le périmètre d'écriture et dans les cibles et tests du critère `UI-16294D4D4345` comme de l'exigence `REQ-A2F15FD967FEAC96`, et le test entre dans les tests requis. Les deux bornages demandés figurent à la fois dans les justifications des rows d'impact, dans la table des décisions et dans la prose : injection de `SqliteProfileRepository` sur la même connexion en troisième argument comme seule modification du provider, et un unique test ajouté prouvant par le provider réel et la base en mémoire migrée l'initialisation de `postActivityRecoverySeconds` depuis le Profil persistant, sans assertion existante modifiée. La cause est vérifiée au code de la baseline. Le reste du plan est inchangé, les seules évolutions au-delà des deux chemins ciblés étant les contrats dérivés recalculés qu'impose leur entrée au périmètre. |

<KODJO_PRE1_CLOSURE_JSON>
{"closures":[{"finding":1,"closed":true,"correction_examined":"SessionServiceProvider.tsx reclassé CONSUMER_UNAFFECTED -> MODIFY et SessionServiceProvider.test.tsx reclassé TEST_UNAFFECTED -> TEST_MUST_ADAPT ; les deux ajoutés à write_scope et aux change_targets/tests de UI-16294D4D4345 et de REQ-A2F15FD967FEAC96, le test à required_test_writes ; modification du provider bornée à l'injection de SqliteProfileRepository construit sur la même connexion en troisième argument de SessionService, et du test à un seul test ajouté sans assertion existante modifiée","evidence":"Row d'impact src/features/sessions/SessionServiceProvider.tsx : CONSUMER_UNAFFECTED -> MODIFY, justification «le chemin de production construit SessionService sans ProfileRepository, si bien que le snapshot du Profil (REQ-A2F15FD967FEAC96, UI-16294D4D4345) ne s'applique pas dans l'application. Seule modification permise : injecter SqliteProfileRepository, construit sur la même connexion, comme troisième argument de SessionService ; aucun autre changement du provider.» ; row src/features/sessions/__tests__/SessionServiceProvider.test.tsx : TEST_UNAFFECTED -> TEST_MUST_ADAPT, justification «prouver par le provider réel (base en mémoire migrée) que la création d'une occurrence initialise postActivityRecoverySeconds depuis le Profil persistant. Ajout de ce seul test ; aucune assertion existante ajoutée, supprimée ni modifiée.» ; candidate_kind, triggered_by et risk_score inchangés. KODJO_PLAN_DECISIONS_JSON : 41 entrées, exactement ces deux lignes modifiées et alignées sur les rows. write_scope et scope_allow 100->102 avec les deux chemins ; required_test_writes 43->44 avec le test. UI-16294D4D4345.change_targets=[SessionService.ts, SessionServiceProvider.tsx] et .tests=[SessionService.test.ts, SessionServiceProvider.test.tsx], ses 2 assertions -A60BD8133829B/-A88C0507C1BC3 inchangées ; REQ-A2F15FD967FEAC96 et son entrée non-UI source (qualification-spec §§7 et 10) ainsi que REQ-982901A85204184E gagnent le provider et son test ; bindings 65->67 ; ui_paths 12->13 par ajout du provider. SqliteProfileRepository.ts déjà dans write_scope. Prose §12 tour 5 porte le double bornage. Baseline e216294 : SessionServiceProvider.tsx:92-95 construit new SessionService(new SqliteSessionRepository(database), new SqliteCategoryRepository(database),) sans troisième argument, SqliteProfileRepository absent des imports (lignes 8-9) ; le fichier de test existe. Confinement : KODJO_MODIFIED_MODULES_JSON (90), KODJO_NON_UI_COVERAGE_JSON, KODJO_BOUNDARY_CONTRACT_JSON, KODJO_PLAN_CLARIFICATIONS_JSON et le bloc preservation byte-identiques ; scan_sha256, requirement_ids_sha256, assertion_ids_sha256 et boundary_contract_sha256 inchangés ; 131 rows, 13 critères, 32 assertions, 28 exigences, 15 exigences non UI ; aucun chemin retiré ; diff de prose limité à la section tour 5, aux tests supplémentaires et aux deux lignes de la liste scope_allow machine","justification":"Les deux reclassements exigés sont inscrits avec leur classification exacte, les deux chemins entrent dans le périmètre d'écriture et dans les cibles et tests du critère UI-16294D4D4345 comme de l'exigence REQ-A2F15FD967FEAC96, et le test entre dans les tests requis. Les deux bornages demandés figurent dans les justifications des rows d'impact, dans la table des décisions et dans la prose : injection de SqliteProfileRepository sur la même connexion en troisième argument comme seule modification du provider, et un unique test ajouté prouvant par le provider réel et la base en mémoire migrée l'initialisation de postActivityRecoverySeconds depuis le Profil persistant, sans assertion existante modifiée. La cause est vérifiée au code de la baseline. Le reste du plan est inchangé, les seules évolutions au-delà des deux chemins ciblés étant les contrats dérivés recalculés qu'impose leur entrée au périmètre."}]}
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
  "protocol_commit": "e49e5a97069c017baac4ff7743403de49d5cfb42",
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
    "src/features/sessions/SessionServiceProvider.tsx",
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
    "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
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
    "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
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
  "requirement_contract_sha256": "0a632f3579856e80cd5482dd24ff3b609d8c8b804c1e84d347c49799b819f80d",
  "test_contract_sha256": "84713d14def3c301dbe75a8f41888a99d5f363a8074282a913448b047088dcbb",
  "boundary_contract_sha256": "8d290bd47df7851de55aadc88c35156bb213a035e83b2348452378b1fb2bf3a0",
  "requirement_count": 28
}
</KODJO_PLAN_CONTRACT_REVIEW_JSON>

<KODJO_UI_PLAN_CONTRACT_REVIEW_JSON>
{
  "schema": "kodjo.ui-plan-contract.v1",
  "contract_version": 2,
  "protocol_commit": "e49e5a97069c017baac4ff7743403de49d5cfb42",
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
    "src/features/sessions/SessionServiceProvider.tsx",
    "src/features/sessions/compositionPresentation.ts",
    "src/shared/i18n/resources/fr.ts"
  ],
  "criterion_count": 13,
  "assertion_count": 32,
  "assertion_ids_sha256": "534163c795e81bbf3909122b2bdd0ec2568c187f94d8d0564979cc8b5e8d836f",
  "matrix_sha256": "bf3b9feef6166d4a4daf0bf9068e960af20f211cb146531d4faf4b8b351804dd"
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
