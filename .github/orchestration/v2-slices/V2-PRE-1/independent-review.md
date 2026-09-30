# Revue indépendante matérialisée — V2-PRE-1

Verdict: APPROVED
Plan reviewed: `technical-plan.md`

[KODJO_V2] PLAN_REVIEW_OUTPUT
slice_id=V2-PRE-1
bootstrap_path=.github/orchestration/v2-slices/V2-PRE-1/slice-bootstrap.json
source_head=e216294506bed87dd80855937e3fabfbfa322b82
protocol_execution_head=3419d5d31266e74a2180c45d5c0d6219be2854dc
planning_mode=INITIAL
source_plan_comment_id=5920359910
reviewer=CLAUDE
review_session_id=25caf6b2-1663-4a23-bb75-204982cc2b7b
verdict=APPROVE
STATUT : PLAN_REVIEW_APPROVED

Both items verified against the round-3 candidate (`corrected_plan_commit=f3e7f492`, `corrected_plan_blob=c42de1f1`). The structural diff versus the approved round-2 candidate is confined to the two corrections and their recomputed derived contracts: `KODJO_PLAN_DECISIONS_JSON`, `KODJO_BOUNDARY_CONTRACT_JSON`, `KODJO_PLAN_CLARIFICATIONS_JSON` and the matrix `preservation` block are byte-identical, `assertion_ids_sha256` is unchanged, criteria/assertions stay at 13/32, and the only pre-existing requirement modified is `REQ-C706F1B21014E9F7` (its `tests` list, which is item 1's own derived binding).

| N | Correction examinée | Preuve précise | Fermé | Justification |
|---|---|---|---|---|
| 1 | `src/features/sessions/__tests__/SideModeControl.test.tsx` ajouté au périmètre d'écriture, aux tests requis et aux tests de `UI-73382D60E040`, avec sa classification d'impact ; `SideModeControl.tsx` laissé inchangé | Row d'impact ajoutée `src/features/sessions/__tests__/SideModeControl.test.tsx` `candidate_kind=MODIFIED_MODULE`, `classification=MODIFY`, justification « Blast radius de UI-73382D60E040 … les lignes 26 et 156 assertent la valeur vide de shared.sideMode.valueLabels.UNILATERAL lue par SideModeControl hors contexte Tour ; le plan fixe « Aucun ». SideModeControl.tsx reste inchangé. » ; présent dans `KODJO_MODIFIED_MODULES_JSON` (89→90) avec `change=MODIFY`, dans `write_scope` (98→99) et dans `required_test_writes` (41→42) ; `UI-73382D60E040.tests` = `["…/SideModeControl.test.tsx","src/shared/i18n/index.test.ts"]` et liaison ajoutée `REQ-C706F1B21014E9F7 → …/SideModeControl.test.tsx` (liaisons 61→64). `src/features/sessions/SideModeControl.tsx` reste `CONSUMER_UNAFFECTED`, hors `write_scope`, hors `modified_modules` et hors `scope_allow`. Baseline `e216294` confirmée : `SideModeControl.test.tsx:26` et `:156` assertent `getByTestId("side-mode-value").props.children` `toBe("")`. Blast radius contre-vérifié indépendamment par balayage de toutes les références `valueLabels` de `src`/`app` : la seule occurrence hors périmètre restante est `SideModeControl.tsx:92`, précisément le fichier que l'`expected_correction` exige de laisser inchangé ; tous les autres consommateurs et tests du jeu non-Tour (`CompositionScreen.tsx:1769`, `CompositionScreen.test.tsx:3170,3184`, `ExerciseScreen.test.tsx:2024,2027`, `index.test.ts:370,385`, `fr.ts:31`) sont déjà dans `write_scope`, et les seuls autres fichiers rendant `SideModeControl` (`ActivityEditorForm.tsx`, `CompositionScreen.tsx`, `validation.ts`) y sont également avec leurs tests | OUI | Les quatre éléments de l'`expected_correction` sont réunis : le test entre au périmètre d'écriture, aux tests requis et aux tests du critère, avec une classification d'impact explicite remplaçant son absence du plan ; `SideModeControl.tsx` demeure hors périmètre et inchangé ; et le balayage indépendant ne laisse aucune autre lacune de blast radius pour le passage de `shared.sideMode.valueLabels.UNILATERAL` de `""` à « Aucun ». L'assertion `UI-73382D60E040-A3E11D4F3FF2A` redevient implémentable sans arrêt `CLARIFICATION_REQUIRED`. |
| 2 | Exigence dédiée `REQ-6158C99B50273D8D` portant les valeurs D-240, liée au modèle Profil, à la persistance/seed du Profil et à leurs tests ; §3.2 du plan énonce les valeurs ; la couverture cite le registre | `KODJO_REQUIREMENT_CONTRACT_JSON` (27→28, `requirement_count=28` cohérent avec le tableau) : `REQ-6158C99B50273D8D`, `domain=NON_UI`, `source.path="docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md"`, `source.locator="D-240 (30/09/2026), complète qualification-spec.md §10"`, exigence « compte à rebours d'Exercice 10 s et fin d'Exercice 5 s, en plus de la pause de changement de côté 10 s et de la récupération post-exercice 30 s ; elles initialisent les nouveaux Exercices sans rétroactivité » ; `change_targets = [Profile.ts, migration007.ts, SqliteProfileRepository.ts]`, `tests = [Profile.test.ts, SqliteProfileRepository.test.ts]`, tous déjà dans `write_scope` et, pour les tests, dans `required_test_writes` ; entrée miroir dans `KODJO_NON_UI_REQUIREMENTS_JSON` (14→15) ; deux liaisons ajoutées `REQ-6158C99B50273D8D →` chacun des deux tests. Plan §3.2 : « compte à rebours d'Exercice par défaut : `10 s` (décision D-240) ; fin d'Exercice par défaut : `5 s` (décision D-240) ». `KODJO_NON_UI_COVERAGE_JSON` ajoute `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` à `source_paths` et « Tour 3 : décision D-240 (registre 07) pour les défauts d'Exercice du Profil » au motif. Conformité au registre : `kodjo-pre1-decision-register.md:352` énonce « Compte à rebours d'Exercice `10 s` et Fin d'Exercice `5 s` … complètent les défauts déjà spécifiés (pause de changement de côté `10 s`, récupération post-exercice `30 s`) … sans rétroactivité ». Aucune autre exigence n'est modifiée : le diff ne change que `REQ-C706F1B21014E9F7`, dont la seule évolution est la liaison de test relevant de l'item 1 | OUI | L'exigence dédiée reprend les valeurs D-240 exactement — `10 s` et `5 s` — et les rattache aux trois cibles demandées (modèle Profil, `migration007`, `SqliteProfileRepository`) et à leurs deux tests, avec les liaisons correspondantes dans le contrat de tests ; §3.2 énonce les valeurs en citant D-240 et la couverture cite le registre comme source. Le vide normatif de `qualification-spec.md` §10 qui avait arrêté le run 36773441104 est comblé sans toucher à une autre exigence. |

<KODJO_PRE1_CLOSURE_JSON>
{"closures":[{"finding":1,"closed":true,"correction_examined":"src/features/sessions/__tests__/SideModeControl.test.tsx ajouté à write_scope, required_test_writes et aux tests de UI-73382D60E040, avec sa classification d'impact ; src/features/sessions/SideModeControl.tsx laissé inchangé","evidence":"Row d'impact ajoutée src/features/sessions/__tests__/SideModeControl.test.tsx candidate_kind=MODIFIED_MODULE classification=MODIFY, justification citant les lignes 26 et 156 et la lecture hors contexte Tour par SideModeControl ; KODJO_MODIFIED_MODULES_JSON 89->90 avec change=MODIFY ; write_scope 98->99 ; required_test_writes 41->42 ; UI-73382D60E040.tests = [src/features/sessions/__tests__/SideModeControl.test.tsx, src/shared/i18n/index.test.ts] ; liaison ajoutée REQ-C706F1B21014E9F7 -> src/features/sessions/__tests__/SideModeControl.test.tsx (liaisons 61->64) ; src/features/sessions/SideModeControl.tsx reste CONSUMER_UNAFFECTED, hors write_scope, hors modified_modules, hors scope_allow. Baseline e216294 : SideModeControl.test.tsx:26 et :156 assertent getByTestId(\"side-mode-value\").props.children toBe(\"\"). Balayage indépendant de toutes les références valueLabels de src et app : seule occurrence hors périmètre = SideModeControl.tsx:92, le fichier que l'expected_correction exige de laisser inchangé ; CompositionScreen.tsx:1769, CompositionScreen.test.tsx:3170,3184, ExerciseScreen.test.tsx:2024,2027, index.test.ts:370,385 et fr.ts:31 sont dans write_scope ; les seuls autres fichiers rendant SideModeControl (ActivityEditorForm.tsx, CompositionScreen.tsx, validation.ts) y sont aussi avec leurs tests","justification":"Les quatre éléments de l'expected_correction sont réunis : le test entre au périmètre d'écriture, aux tests requis et aux tests du critère avec une classification d'impact explicite ; SideModeControl.tsx demeure hors périmètre et inchangé ; et le balayage indépendant ne laisse aucune autre lacune de blast radius pour le passage de shared.sideMode.valueLabels.UNILATERAL de la valeur vide à «Aucun». L'assertion UI-73382D60E040-A3E11D4F3FF2A redevient implémentable sans arrêt CLARIFICATION_REQUIRED."},{"finding":2,"closed":true,"correction_examined":"Exigence dédiée REQ-6158C99B50273D8D portant les valeurs D-240, liée au modèle Profil, à la persistance et au seed du Profil et à leurs tests ; §3.2 du plan énonce les valeurs ; la couverture cite le registre","evidence":"KODJO_REQUIREMENT_CONTRACT_JSON 27->28 (requirement_count=28 cohérent) : REQ-6158C99B50273D8D domain=NON_UI, source.path=docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md, source.locator=D-240 (30/09/2026), complète qualification-spec.md §10, exigence «compte à rebours d'Exercice 10 s et fin d'Exercice 5 s, en plus de la pause de changement de côté 10 s et de la récupération post-exercice 30 s ; elles initialisent les nouveaux Exercices sans rétroactivité» ; change_targets=[src/domain/preferences/Profile.ts, src/infrastructure/database/migrations/migration007.ts, src/infrastructure/database/repositories/SqliteProfileRepository.ts] tous dans write_scope ; tests=[src/domain/preferences/__tests__/Profile.test.ts, src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts] dans write_scope et required_test_writes ; entrée miroir dans KODJO_NON_UI_REQUIREMENTS_JSON 14->15 ; deux liaisons de test ajoutées. Plan §3.2 : «compte à rebours d'Exercice par défaut : 10 s (décision D-240) ; fin d'Exercice par défaut : 5 s (décision D-240)». KODJO_NON_UI_COVERAGE_JSON ajoute le registre 07 à source_paths et «Tour 3 : décision D-240 (registre 07) pour les défauts d'Exercice du Profil» au motif. Registre kodjo-pre1-decision-register.md:352 : «Compte à rebours d'Exercice 10 s et Fin d'Exercice 5 s … complètent les défauts déjà spécifiés (pause de changement de côté 10 s, récupération post-exercice 30 s) … sans rétroactivité». Aucune autre exigence modifiée : le diff ne change que REQ-C706F1B21014E9F7, dont la seule évolution est la liaison de test relevant de l'item 1","justification":"L'exigence dédiée reprend les valeurs D-240 exactement — 10 s et 5 s — et les rattache aux trois cibles demandées (modèle Profil, migration007, SqliteProfileRepository) et à leurs deux tests, avec les liaisons correspondantes dans le contrat de tests ; §3.2 énonce les valeurs en citant D-240 et la couverture cite le registre comme source. Le vide normatif de qualification-spec.md §10 qui avait arrêté le run 36773441104 est comblé sans toucher à une autre exigence."}]}
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
  "protocol_commit": "3419d5d31266e74a2180c45d5c0d6219be2854dc",
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
  "requirement_contract_sha256": "5689ae195e44eeaef25faf3ad3c9b297eee60cd4462153857ddbea975c5282a6",
  "test_contract_sha256": "c0f1ad49bdd59dd3cbbcafe4cd5fae2e22196615d7753404479b66ff13ea19e4",
  "boundary_contract_sha256": "8d290bd47df7851de55aadc88c35156bb213a035e83b2348452378b1fb2bf3a0",
  "requirement_count": 28
}
</KODJO_PLAN_CONTRACT_REVIEW_JSON>

<KODJO_UI_PLAN_CONTRACT_REVIEW_JSON>
{
  "schema": "kodjo.ui-plan-contract.v1",
  "contract_version": 2,
  "protocol_commit": "3419d5d31266e74a2180c45d5c0d6219be2854dc",
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
  "matrix_sha256": "d0d9023eedc511b3b3045a4e274592b20b65257c463ab98eb70fcef6394fbfea"
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
