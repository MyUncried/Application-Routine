# Revue indépendante matérialisée — V2-CAT-01

Verdict: APPROVED
Plan reviewed: `technical-plan.md`

[KODJO_V2] PLAN_REVIEW_OUTPUT
slice_id=V2-CAT-01
bootstrap_path=.github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json
source_head=63a3c26ed492f7c0925cfb57419f3dc2dcc5e476
protocol_execution_head=bed140fac4dd5507d9d3a1f2eca821008e26efb8
planning_mode=INITIAL
source_plan_comment_id=5720329801
reviewer=CLAUDE
review_session_id=aad1b27d-26a3-4cc9-9f82-942c714b01a7
verdict=APPROVE
STATUT : PLAN_REVIEW_APPROVED

## Revue indépendante — plan technique INITIAL `V2-CAT-01`

### Déterminisme du périmètre — le point dur des revues 2 et 3 est fermé

Les **neuf** représentations du périmètre d'écriture sont strictement identiques : 70 chemins, mêmes chemins, mêmes statuts — prose §5, prose §11, bloc `scope_allow machine`, `<KODJO_MODIFIED_MODULES_JSON>`, `modified_modules` et `scope_allow` de l'artefact d'impact, `write_scope` du contrat inline, plus les deux artefacts rejoués indépendamment. `modified_modules` est **octet pour octet identique** entre le plan et le rejeu de scan ; contrat inline == contrat rejoué ; `plan_scan_sha256` == `reviewer_scan_sha256` (`MATCH`). `rows` = 84 = 70 modules + 14 candidats : fermeture complète. `required_test_writes` (33) == exactement les tests de `write_scope`, les 10 nouveaux déclarés `CREATE`.

### Classifications vérifiées sur le code, pas sur déclaration

Les 14 candidats sont tous non affectés et **aucun n'est ouvert en écriture**. J'ai contre-vérifié les trois à risque élevé : `SqliteSessionRepository.test.ts` (150) et `SqliteCategoryRepository.test.ts` (128) n'appellent `migrateDatabase()` qu'en montage, sans assertion de version ni de tables ; `SessionService.ts` (148) n'importe que `toCreateSessionInput`, `toUpdateSessionInput` et le type `SessionDraft`. Les deux barrels passent (`export *`, `typeof strings`), `DatabaseRows.ts` est un module de types pur, `runNativeDatabaseIntegrationCheck.ts` n'assure ni version ni inventaire. Mon balayage indépendant des importeurs de 11 modules modifiés n'a trouvé **aucun consommateur hors `scope_allow ∪ candidats`**.

### Migration

`migration006`/v6 correspond exactement à la décision déjà gravée dans `constants.ts` et `migration005.ts` (« T03 utilisera `006` et `DATABASE_VERSION = 6` ») — pas de renumérotation. Le seul fichier qui casse réellement en v5→v6 est `migrateDatabase.test.ts` (`expect(DATABASE_VERSION).toBe(5)`, `user_version = 6`, unique lecteur de `sqlite_master`), et il **est** dans le périmètre.

### Acquis préservés

`calculations.ts`, `sideMode.ts`, `Session.ts`, `SessionCard` + test, `SessionService` + test, `tokens.ts`, `migration005.ts` et — point décisif — les roulettes natives `DurationWheelPicker` / `NumberWheelPicker` / `WheelPickerOverlay` sont **hors périmètre d'écriture**. L'extraction d'`ActivityEditorForm` depuis `ExerciseScreen.tsx` (1375 lignes) ne peut donc pas substituer une réimplémentation aux primitives d'interaction sans franchir `SCOPE_EXPANSION_REQUIRED` : la régression de classe REWORK06 est bloquée par construction, pas par promesse.

### Immuabilité produit et absence d'implémentation

Le contexte matérialisé est octet pour octet identique aux blobs de `63a3c26` ; les empreintes divergentes du bootstrap sont couvertes par la migration liée `authority=GIT_BLOB`, `scope=PRODUCT_SOURCE_HASHES_ONLY`. Le plan ne contient que deux blocs `text` (listes de chemins) — zéro SQL, zéro TypeScript — et l'arbre était propre à la baseline.

### Observations non bloquantes

1. **D-184 vs `Filtrer`** : la décision validée exige `Filtrer` fonctionnel pour `Archivées` en T03 ; le plan le laisse inerte. C'est la lecture correcte du bornage (l'Issue #150 exclut explicitement filtre et archivage), mais **D-184 reste à porter par une tranche T03 ultérieure**.
2. `app/_layout.tsx` en `MODIFY` est correctement classé (la pile racine porte la transition `(creation)`→`(tabs)` de l'étape 9), mais sa seule justification écrite est une contrainte de non-changement SQLite — prose plus mince que l'exigence de justifier chaque entrée.
3. `tokens.ts` exclu : correct si `SegmentedControl` réutilise les tokens `Controls / Segmented` ; sinon c'est un arrêt de scope, pas un ajout silencieux.

### Livraison

- **Rapport :** `.github/orchestration/reports/2026-09-17_V2-CAT-01-revue-independante-plan-initial.md`
- **Commit :** `bdd3aa2b38723fe0a90091e6a689ee282070a66f`
- **État Git :** propre. **HEAD détaché déplacé de `63a3c26` à `bdd3aa2`** (enfant direct, rapport documentaire seul) — à signaler si une étape ultérieure vérifie `HEAD == baseline`. Le commit `63a3c26` et tous ses blobs restent intacts et atteignables.
- **Tests :** aucun applicable — revue `PLAN_ONLY` sans diff de code ; `node_modules` absent de ce workspace, Jest/tsc/lint n'y sont de toute façon pas exécutables. Aucun résultat de test n'est revendiqué.

VERDICT: APPROVE
<KODJO_PLAN_IMPACT_REVIEW_JSON>
{
  "schema": "kodjo.plan-impact-review.v1",
  "scan_revision": "63a3c26ed492f7c0925cfb57419f3dc2dcc5e476",
  "plan_scan_sha256": "38427d297cc454eb365de48acd986449a69548111914790d62488c24da210ab7",
  "reviewer_scan_sha256": "38427d297cc454eb365de48acd986449a69548111914790d62488c24da210ab7",
  "candidate_count": 14,
  "verdict": "MATCH"
}
</KODJO_PLAN_IMPACT_REVIEW_JSON>

<KODJO_PLAN_CONTRACT_REVIEW_JSON>
{
  "schema": "kodjo.plan-contract-consistency.v2",
  "contract_version": 2,
  "protocol_commit": "bed140fac4dd5507d9d3a1f2eca821008e26efb8",
  "scan_revision": "63a3c26ed492f7c0925cfb57419f3dc2dcc5e476",
  "write_scope": [
    "app/(creation)/_layout.tsx",
    "app/(creation)/activity-selection.tsx",
    "app/(creation)/exercise.tsx",
    "app/(tabs)/_layout.tsx",
    "app/__tests__/creationLayout.test.tsx",
    "app/__tests__/rootLayoutGesture.test.tsx",
    "app/_layout.tsx",
    "src/domain/activities/ActivityDefinition.ts",
    "src/domain/activities/ActivityDefinitionRepository.ts",
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/activities/index.ts",
    "src/domain/sessions/SessionDraft.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/domain/sessions/composition.ts",
    "src/features/activities/ActivityCard.tsx",
    "src/features/activities/ActivityCatalogueList.tsx",
    "src/features/activities/ActivityDefinitionService.ts",
    "src/features/activities/ActivityDefinitionServiceContext.tsx",
    "src/features/activities/ActivityDefinitionServiceProvider.tsx",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/activities/CatalogueCreateOptions.tsx",
    "src/features/activities/__tests__/ActivityCard.test.tsx",
    "src/features/activities/__tests__/ActivityCatalogueList.test.tsx",
    "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
    "src/features/activities/__tests__/useActivityCatalogue.test.ts",
    "src/features/activities/useActivityCatalogue.ts",
    "src/features/sessions/CatalogueScreen.tsx",
    "src/features/sessions/CategoriesScreen.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SessionDraftContext.tsx",
    "src/features/sessions/SessionDraftProvider.tsx",
    "src/features/sessions/SessionServiceProvider.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
    "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
    "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
    "src/features/sessions/__tests__/compositionGesture.test.ts",
    "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "src/features/sessions/compositionGesture.ts",
    "src/features/sessions/compositionPresentation.ts",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/infrastructure/database/constants.ts",
    "src/infrastructure/database/migrateDatabase.ts",
    "src/infrastructure/database/migrations/migration006.ts",
    "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
    "src/infrastructure/database/types/DatabaseRows.ts",
    "src/shared/i18n/resources/fr.ts",
    "src/shared/ui/ScreenShell.tsx",
    "src/shared/ui/SegmentedControl.tsx",
    "src/shared/ui/__tests__/ScreenShell.test.tsx",
    "src/shared/ui/__tests__/SegmentedControl.test.tsx",
    "src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx",
    "src/shared/ui/__tests__/navigationLayout.test.ts",
    "src/shared/ui/navigationLayout.ts"
  ],
  "required_test_writes": [
    "app/__tests__/creationLayout.test.tsx",
    "app/__tests__/rootLayoutGesture.test.tsx",
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/features/activities/__tests__/ActivityCard.test.tsx",
    "src/features/activities/__tests__/ActivityCatalogueList.test.tsx",
    "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
    "src/features/activities/__tests__/useActivityCatalogue.test.ts",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
    "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
    "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
    "src/features/sessions/__tests__/compositionGesture.test.ts",
    "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/shared/ui/__tests__/ScreenShell.test.tsx",
    "src/shared/ui/__tests__/SegmentedControl.test.tsx",
    "src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx",
    "src/shared/ui/__tests__/navigationLayout.test.ts"
  ]
}
</KODJO_PLAN_CONTRACT_REVIEW_JSON>
