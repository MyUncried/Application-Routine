# Revue indépendante matérialisée — V2-CAT-01

Verdict: APPROVED
Plan reviewed: `technical-plan.md`

[KODJO_V2] PLAN_REVIEW_OUTPUT
slice_id=V2-CAT-01
bootstrap_path=.github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json
source_head=b2d5db7bde4127bf85d60a7f4107e7b4ebd96265
protocol_execution_head=b2d5db7bde4127bf85d60a7f4107e7b4ebd96265
application_pr=181
application_head=e43004df9f04a10aa091ba28cc681592bea759ca
source_plan_comment_id=5749470081
reviewer=CLAUDE
review_session_id=d247e3ff-43fd-4a60-b94d-bdabc6be3ce5
verdict=APPROVE
STATUT : PLAN_REVIEW_APPROVED

All inputs were regenerated again (new protocol HEAD `b2d5db7b`, new plan `a715abbe…`). Full re-review below.

# Revue indépendante du plan V2-CAT-01

**Entrées** — plan `kodjo-v2-plan.md` (sha256 `a715abbe…`) ; source produit et exécution protocolaire `b2d5db7b` ; application PR 181 `e43004df` (HEAD détaché, arbre propre) ; contexte produit courant. Lecture seule, aucun fichier modifié.

## 1. Transition et fraîcheur des sources

Transition `PASS`, `reason: null`, `changed_paths: []`, 21 chemins protégés, **0** divergence de blob protégé, tous les `transition_matches` à `true`, **0** divergence de blob de politique. Comparaison indépendante des OID entre les HEAD protocolaires successifs : `13 – Contrats d'écran.md`, `07 – Registre des décisions`, `06 – Écrans et navigation`, `09 bis`, `planning-mission.md` et `slice-bootstrap.json` sont **inchangés**. Le changement de HEAD est bien protocolaire seul, et la base normative que je contrôle est la base courante. `scan_revision` = `e43004df` = HEAD applicatif.

## 2. Contrôles déterministes — CONFORMES

| Contrôle | Résultat |
|---|---|
| `proof` rejoué | `MATCH`, `plan_scan_sha256 == reviewer_scan_sha256`, 6 candidats |
| `modified_modules` (24) ↔ scan rejoué | identiques |
| `write_scope` (24) ↔ contrat rejoué | identiques ; **`write_scope` ≡ `modified_modules`** |
| `required_test_writes` (14) ↔ rejeu | identiques |
| Contrat UI ↔ rejeu | identique ; `criterion_count` 10 = 10 critères ; `matrix_sha256` conforme |
| §4 prose (10 production + 14 tests) ↔ `write_scope` | ensembles strictement égaux |
| `ui_paths` (10) ↔ fichiers de production | identiques |
| Liaisons | **0** test requis non rattaché à un critère ; **0** `change_target` hors périmètre ; **0** test de critère hors `required_test_writes` ; les 10 fichiers de production portent tous un critère |
| Classifications | `MODIFY` ×24, `CONSUMER_UNAFFECTED` ×6 ; aucun `CREATE` ; risques tous à 0, servant à l'ordre et jamais au filtrage |

## 3. Fermeture vérifiée des quatre résidus du cycle précédent

Chacun est contrôlé contre le code, non pris sur parole :

1. **`CompositionNavigationGuard.integration.test.tsx` sorti du périmètre.** Vérification : ce test ne rend jamais `CompositionScreen` — il construit son propre harnais à partir de `useCompositionExitGuard`, `SessionDraftProvider`, `AbandonCreationModal`, `isSessionDraftDirty` — et ne contient **aucune** référence à swipe/geste/actions. Les corrections planifiées sur `CompositionScreen.tsx` et `compositionGesture.ts` ne peuvent donc pas l'affecter : l'exclusion est fondée, et le gel en `FORBIDDEN` + exécution en régression sous Jest complet est plus solide que l'« adaptation ciblée » précédente. Le contraste avec `ExerciseNavigationGuard.integration.test.tsx`, maintenu au périmètre, est motivé : celui-ci réplique explicitement le mécanisme de `ExerciseScreen.tsx` (désarmement après `Terminer`, verrou `finishingRef`, isolation du brouillon) que `UI-CAT-R-008` modifie.
2. **`pendingSwipeRef`** est correctement attribué à `CompositionScreen.tsx:1290` dans `UI-CAT-R-007` et §5 impose la séparation (« aucune attribution de `pendingSwipeRef` à `compositionGesture.ts` ne doit subsister »). `compositionGesture.ts` ne contient effectivement que des fonctions pures (`classifyMovement`, `isCompletedHorizontalSwipe`, `isTap`, `resolveDropZone`, `resolveDropTarget`, seuils).
3. **Verrou Catégories** désormais explicite dans le `requirement` de `UI-CAT-R-006`, en `PRESERVE`, en §6 Étape 5, en AC 7, et lié à `CategoriesSaveFlow.integration.test.tsx` — conforme à `CE-T03-16 §§12,14,19` et au code existant (`CategoriesScreen.tsx:174-177`, `:318-321`).
4. **`CE-T03-07 §16`** (contexte, brouillon et scroll de Composition après annulation ou ajout) est maintenant cité comme locator distinct, porté par le `requirement` de `UI-CAT-R-003`, §6 Étape 3, §8, AC 4, et lié à `CompositionExerciseFlow.integration.test.tsx`.

## 4. Décisions `REUSE`/`EXTEND` et dérivation du périmètre

Aucune création. Les primitives réutilisées existent toutes (`KodjoIcon`, `SegmentedControl`, `ScreenShell`, `DurationWheelPicker`, `NumberWheelPicker`, `WheelPickerOverlay`, `WheelSelectionOverlay`, `ExerciseExitConfirmModal`, `useCompositionExitGuard`). Les tokens invoqués pour le gap sont réels et exacts : `dimensions.compositionTourSection` (`tokens.ts:308`) expose `inset: 10`, soit précisément la marge carte↔cadre (`containerWidth 374 − cardWidth 354 = 2 × 10`), et `colors.tourSurface` (`tokens.ts:53`) — `UI-CAT-R-010` est donc déterminable sans littéral arbitraire.

Les 10 entrées de production sont chacune justifiées par un défaut que j'ai constaté directement : arbre `Créer` sans vecteurs, scrim interne à `ScreenShell` incapable de couvrir la `tabBar` frère et fermeture implicite contraire à `CE-T03-03 §13` ; `ActivityCard` réduit au nom ; `ActivitySelectionScreen` sans compteur/CTA/stale/verrou ; `SegmentButton` locaux dans `ActivityEditorForm` (`:380-390`, `:832`) ; `router.back` nu et `loadState` bloqué dans `ExerciseScreen` (`:172`, `:88-116`) ; `activeSegment` en état local dans `CatalogueScreen` (`:51`) ; `dismissTo("/")` dans `CategoriesScreen` (`:202`) ; coins **droits** au lieu des coins gauches et absence de gap dans `CompositionScreen` (`:2419-2420`), `Côté` à `right:16`/`top:4` (`:2321-2329`) ; défaut de suivi du doigt documenté par l'en-tête de `compositionGesture.ts` ; `Stack` de `app/(creation)/_layout.tsx` sans transition de retour.

## 5. Complétude source → critères

Balayage complet du périmètre fonctionnel de la mission verrouillée et des contrats `CE-T03-02/03/04/07/08/16` : **aucune exigence normative omise ni diluée**. Les deux exigences `CE-T03-08` (coins haut-gauche/bas-gauche, gap au fond du Tour) restent portées par un critère dédié `UI-CAT-R-010` typé `VISUAL,DEVICE`, plus §3, §6 Étape 6, AC 9 et `CompositionScreen.test.tsx`. L'icône `Côté` est couverte par le `requirement` de `UI-CAT-R-009`, une ligne d'écart dédiée en §3, §6 Étape 6, AC 10, l'entrée `CHANGE` et l'affectation de test en §9.

Traçabilité des sources contrôlée pièce par pièce : `D-185` existe et est la décision **courante** (« section Médias visible et repliable … `Déployer / Condenser` et placeholder désactivés », validée par arbitrage V2-CAT-01, supersédant `D-116`) — le plan cite donc la règle en vigueur, pas la règle supersédée. Toutes les frames citées en §9 sont réelles : `3787:5148`/`3841:8375` (CE-T03-03), `3786:5093`/`2537:214`/`2537:1033` (CE-T03-02), `3789:5349`/`3789:5405` (CE-T03-07), `3879:5947`/`3879:6079` (CE-T03-04), `2028:11808` (CE-T03-08), `2028:11204` (CE-T03-16).

`PRESERVE` (9) / `CHANGE` (6) / `FORBIDDEN` (4) : couverture complète, chaque acquis nommé par son mécanisme réel plutôt que par une formule générique.

## 6. Migration, compatibilité et adéquation des preuves

§7 exclut toute migration, table, énumération ou modification de domaine ; `UNILATERAL`/`RIGHT_LEFT`/`LEFT_RIGHT` et les calculs de bilatéralité restent fermés ; la séparation `ActivityDefinition`/`SessionActivity`, les copies indépendantes atomiques et l'absence d'écriture pour une sélection vide sont contractualisées. Les modules gelés sont explicitement listés en `FORBIDDEN`.

Chaque critère porte `risk_types`, `proof_required` et des tests du périmètre. Jest complet, `tsc --noEmit` et lint sont obligatoires, régressions inchangées incluses, sans réduction à des cibles. §6 Étape 7 pose que « aucune preuve ciblée ne vaut conformité globale par inférence » ; §1 maintient la tranche en `NON_CONFORME / REQUALIFICATION_REQUIRED` et borne le checkpoint utilisateur à la seule ouverture du menu. §6 Étape 1 impose de rejouer le scan déterministe avant toute écriture et de reconfirmer les statuts `TEST_UNAFFECTED`/`CONSUMER_UNAFFECTED`, et §11 pose la requalification obligatoire si un scan ultérieur révèle un contrat importé différent — traitement correct du fait que le scan direct n'est pas une preuve de complétude absolue.

## 7. Synthèse

Les artefacts machine sont exacts et mutuellement cohérents avec les rejeux ; le périmètre est dérivé exactement, sans entrée de confort ni omission, et chaque entrée est justifiée par un défaut constaté dans le code livré ; toutes les décisions `REUSE`/`EXTEND` correspondent à des composants et tokens réellement existants ; la couverture `PRESERVE`/`CHANGE`/`FORBIDDEN` est complète ; la chaîne risque → test → preuve ne laisse aucune entrée non liée ; la sûreté de migration, la compatibilité ascendante et les décisions produit validées sont préservées ; les quatre résidus du cycle précédent sont fermés et vérifiés contre le code, pas seulement affirmés. Je ne relève aucun écart bloquant ni résiduel.

**Tests** — aucun test exécuté : revue en lecture seule et `node_modules` absent de ce workspace de runner (Jest/tsc/lint y sont inexécutables). Aucun test n'était applicable à cette revue ; le plan conserve correctement Jest complet, TypeScript et lint comme obligation d'implémentation.

**Obligation documentaire** — le dépôt est sur un HEAD détaché (`e43004df`) dans un workspace de runner : un commit de rapport y serait non rattaché et non poussable. Sous le protocole V2, la revue indépendante est matérialisée par le workflow dans `.github/orchestration/v2-slices/V2-CAT-01/independent-review.md`. Je le signale explicitement ; si un rapport distinct dans `.github/orchestration/reports/` est attendu, il faut un arbitrage sur la branche cible avant clôture.

VERDICT: APPROVE
<KODJO_PLAN_IMPACT_REVIEW_JSON>
{
  "schema": "kodjo.plan-impact-review.v1",
  "scan_revision": "e43004df9f04a10aa091ba28cc681592bea759ca",
  "plan_scan_sha256": "4ab8aac0b0ceecacd592007d220ca4f7d3c80b2817fe14c199780e7bcb76cbf2",
  "reviewer_scan_sha256": "4ab8aac0b0ceecacd592007d220ca4f7d3c80b2817fe14c199780e7bcb76cbf2",
  "candidate_count": 6,
  "verdict": "MATCH"
}
</KODJO_PLAN_IMPACT_REVIEW_JSON>

<KODJO_PLAN_CONTRACT_REVIEW_JSON>
{
  "schema": "kodjo.plan-contract-consistency.v2",
  "contract_version": 2,
  "protocol_commit": "b2d5db7bde4127bf85d60a7f4107e7b4ebd96265",
  "scan_revision": "e43004df9f04a10aa091ba28cc681592bea759ca",
  "write_scope": [
    "app/(creation)/_layout.tsx",
    "app/__tests__/creationLayout.test.tsx",
    "src/features/activities/ActivityCard.tsx",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/activities/CatalogueCreateOptions.tsx",
    "src/features/activities/__tests__/ActivityCard.test.tsx",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
    "src/features/sessions/CatalogueScreen.tsx",
    "src/features/sessions/CategoriesScreen.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/compositionGesture.test.ts",
    "src/features/sessions/compositionGesture.ts"
  ],
  "required_test_writes": [
    "app/__tests__/creationLayout.test.tsx",
    "src/features/activities/__tests__/ActivityCard.test.tsx",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/activities/__tests__/CatalogueCreateOptions.test.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/compositionGesture.test.ts"
  ]
}
</KODJO_PLAN_CONTRACT_REVIEW_JSON>

<KODJO_UI_PLAN_CONTRACT_REVIEW_JSON>
{
  "schema": "kodjo.ui-plan-contract.v1",
  "contract_version": 1,
  "protocol_commit": "b2d5db7bde4127bf85d60a7f4107e7b4ebd96265",
  "scan_revision": "e43004df9f04a10aa091ba28cc681592bea759ca",
  "ui_applicable": true,
  "ui_paths": [
    "app/(creation)/_layout.tsx",
    "src/features/activities/ActivityCard.tsx",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/activities/CatalogueCreateOptions.tsx",
    "src/features/sessions/CatalogueScreen.tsx",
    "src/features/sessions/CategoriesScreen.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/compositionGesture.ts"
  ],
  "criterion_count": 10,
  "matrix_sha256": "a3c2aa8e052960900e752bab8e41faaceea004da8fa409d5cea5ce5eaed6e2fb"
}
</KODJO_UI_PLAN_CONTRACT_REVIEW_JSON>

<KODJO_PLAN_REVIEW_TRANSITION_JSON>
{
  "schema_version": "kodjo.protocol.v2.plan-review-transition.0.6.25",
  "source_head": "b2d5db7bde4127bf85d60a7f4107e7b4ebd96265",
  "protocol_execution_head": "b2d5db7bde4127bf85d60a7f4107e7b4ebd96265",
  "bootstrap_path": ".github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json",
  "status": "PASS",
  "reason": null,
  "protected_paths": [
    ".github/orchestration/v2-activation-registry.json",
    ".github/orchestration/v2-slices/V2-CAT-01/independent-review.md",
    ".github/orchestration/v2-slices/V2-CAT-01/planning-mission.md",
    ".github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json",
    ".github/orchestration/v2-slices/V2-CAT-01/technical-plan.md",
    "docs/INDEX.md",
    "docs/MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md",
    "docs/PRODUCT.md",
    "docs/Specifications-fonctionnelles/03 – Parcours utilisateur.md",
    "docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md",
    "docs/Specifications-fonctionnelles/05 – Versions du produit.md",
    "docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md",
    "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
    "docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md",
    "docs/Specifications-fonctionnelles/09 bis – Modèle et migration T03 Catalogue.md",
    "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
    "docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md",
    "docs/Specifications-fonctionnelles/11 – API fonctionnelles.md",
    "docs/Specifications-fonctionnelles/12 – Architecture technique.md",
    "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
    "docs/Specifications-fonctionnelles/images/README-T03-FIGMA.md"
  ],
  "changed_paths": [],
  "protocol_changes": [],
  "protected_blobs": [
    {
      "path": ".github/orchestration/v2-activation-registry.json",
      "source_oid": "7a5241f9333cbd128c1f0f2e1bcddf3c46ab20eb",
      "execution_oid": "7a5241f9333cbd128c1f0f2e1bcddf3c46ab20eb"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-CAT-01/independent-review.md",
      "source_oid": "845d920fe0e5dd1baf0d88d625f7da3d67d94670",
      "execution_oid": "845d920fe0e5dd1baf0d88d625f7da3d67d94670"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-CAT-01/planning-mission.md",
      "source_oid": "11e54c5bf7efe7367e825c042fd6b9303e16756b",
      "execution_oid": "11e54c5bf7efe7367e825c042fd6b9303e16756b"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json",
      "source_oid": "d94b0df4af5e8e0bbefb1c494a3d1134cd85124c",
      "execution_oid": "d94b0df4af5e8e0bbefb1c494a3d1134cd85124c"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-CAT-01/technical-plan.md",
      "source_oid": "77955eb471b42ccaaab1dc42c5313c941e43cf3e",
      "execution_oid": "77955eb471b42ccaaab1dc42c5313c941e43cf3e"
    },
    {
      "path": "docs/INDEX.md",
      "source_oid": "2b3546868ffdbf7170f0c74c23210aea4daef559",
      "execution_oid": "2b3546868ffdbf7170f0c74c23210aea4daef559"
    },
    {
      "path": "docs/MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md",
      "source_oid": "3f906269888ab779f840fa6e08a76a7df1af5dd5",
      "execution_oid": "3f906269888ab779f840fa6e08a76a7df1af5dd5"
    },
    {
      "path": "docs/PRODUCT.md",
      "source_oid": "70b1cd4443795bdbcdbb897fe82f3376399dcefb",
      "execution_oid": "70b1cd4443795bdbcdbb897fe82f3376399dcefb"
    },
    {
      "path": "docs/Specifications-fonctionnelles/03 – Parcours utilisateur.md",
      "source_oid": "b260059a7a3de61e404967a81c02efebe959417e",
      "execution_oid": "b260059a7a3de61e404967a81c02efebe959417e"
    },
    {
      "path": "docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md",
      "source_oid": "2af376b78b4f638c2868861331fbc86a34b628a6",
      "execution_oid": "2af376b78b4f638c2868861331fbc86a34b628a6"
    },
    {
      "path": "docs/Specifications-fonctionnelles/05 – Versions du produit.md",
      "source_oid": "327b0e9969202c8912789611bf624e2f8fc64e4e",
      "execution_oid": "327b0e9969202c8912789611bf624e2f8fc64e4e"
    },
    {
      "path": "docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md",
      "source_oid": "8b298db3b0cd3ecb2f025fe4c8ec16c062c2beef",
      "execution_oid": "8b298db3b0cd3ecb2f025fe4c8ec16c062c2beef"
    },
    {
      "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
      "source_oid": "c3dedcefd1023eb619ada51fc9c0f7f5a840af2e",
      "execution_oid": "c3dedcefd1023eb619ada51fc9c0f7f5a840af2e"
    },
    {
      "path": "docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md",
      "source_oid": "c5acf766b1c6e986bf98244f6208076d9d033aca",
      "execution_oid": "c5acf766b1c6e986bf98244f6208076d9d033aca"
    },
    {
      "path": "docs/Specifications-fonctionnelles/09 bis – Modèle et migration T03 Catalogue.md",
      "source_oid": "c2c319a0075ecbd042d50559212a810dff265315",
      "execution_oid": "c2c319a0075ecbd042d50559212a810dff265315"
    },
    {
      "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
      "source_oid": "bc80fe71bef7fe3c5c63171ff0e80a52a6ef769e",
      "execution_oid": "bc80fe71bef7fe3c5c63171ff0e80a52a6ef769e"
    },
    {
      "path": "docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md",
      "source_oid": "770f8a8c02285f5e7bd454c44d7725b162090a47",
      "execution_oid": "770f8a8c02285f5e7bd454c44d7725b162090a47"
    },
    {
      "path": "docs/Specifications-fonctionnelles/11 – API fonctionnelles.md",
      "source_oid": "ea5c33e3c3f8d446478a7e96a69aa6562d497caa",
      "execution_oid": "ea5c33e3c3f8d446478a7e96a69aa6562d497caa"
    },
    {
      "path": "docs/Specifications-fonctionnelles/12 – Architecture technique.md",
      "source_oid": "876f104f183114dd96410ddd1f2a6dae82c9a21d",
      "execution_oid": "876f104f183114dd96410ddd1f2a6dae82c9a21d"
    },
    {
      "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
      "source_oid": "5d4da4a64b677761a9070b1cfd8e8888659b7b8d",
      "execution_oid": "5d4da4a64b677761a9070b1cfd8e8888659b7b8d"
    },
    {
      "path": "docs/Specifications-fonctionnelles/images/README-T03-FIGMA.md",
      "source_oid": "506528425028003e278b2e6aded6cb86b1057ec7",
      "execution_oid": "506528425028003e278b2e6aded6cb86b1057ec7"
    }
  ],
  "product_source_evidence": [
    {
      "path": "docs/PRODUCT.md",
      "declared_sha256": "e7b541ac38aa7cdafa84adb8791b2936c6a2515ddc0d750a9887fc739f67cc33",
      "source_sha256": "c1bdf3e7ac30e1ebdf586b1cde0b66a2885c355d9340075a6287c0146aacc73d",
      "execution_sha256": "c1bdf3e7ac30e1ebdf586b1cde0b66a2885c355d9340075a6287c0146aacc73d",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/INDEX.md",
      "declared_sha256": "9a06be0f88a4933fc7d226b3d6fb71b39f9f7eeb91edfc7ae1c1334cfce68d88",
      "source_sha256": "c0a144c67c1fc94cf0619c3081bdc5652928344353e6bb8cebf033876569501a",
      "execution_sha256": "c0a144c67c1fc94cf0619c3081bdc5652928344353e6bb8cebf033876569501a",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/03 – Parcours utilisateur.md",
      "declared_sha256": "18dbd018d6bd5f320130f576dfd2f35f1c780ca21e03fff843985ed2de169cc6",
      "source_sha256": "18dbd018d6bd5f320130f576dfd2f35f1c780ca21e03fff843985ed2de169cc6",
      "execution_sha256": "18dbd018d6bd5f320130f576dfd2f35f1c780ca21e03fff843985ed2de169cc6",
      "declared_hash_matches_source": true,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md",
      "declared_sha256": "261694d498d4f4eb772f42535b2e03806a4f191db95a3c436b386e8f28b383b0",
      "source_sha256": "261694d498d4f4eb772f42535b2e03806a4f191db95a3c436b386e8f28b383b0",
      "execution_sha256": "261694d498d4f4eb772f42535b2e03806a4f191db95a3c436b386e8f28b383b0",
      "declared_hash_matches_source": true,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/05 – Versions du produit.md",
      "declared_sha256": "a5d59c17a20c75d475507dbecbd9991a7badd54640eb70e1196fab60b23164ce",
      "source_sha256": "c96ab94dca83a2e868de5b691c257484c9654a0978f08df8e1d26751e84a25e9",
      "execution_sha256": "c96ab94dca83a2e868de5b691c257484c9654a0978f08df8e1d26751e84a25e9",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md",
      "declared_sha256": "e6d11c07be3f5f7735bd518e13d25b107028d223b599e5e543e7eab50802263c",
      "source_sha256": "3fb103d67ab21f36c354d89625e90e77a83c45a3b4fd8f2dac97c4472158d4a9",
      "execution_sha256": "3fb103d67ab21f36c354d89625e90e77a83c45a3b4fd8f2dac97c4472158d4a9",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
      "declared_sha256": "1e9db752cbde1382747733fa976921f8c745c5b91e59a1c100ee97db1ff7976f",
      "source_sha256": "5685e61185e916b726427b11dfeededd2f1a38ec51d444d714a6d6fe81624698",
      "execution_sha256": "5685e61185e916b726427b11dfeededd2f1a38ec51d444d714a6d6fe81624698",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md",
      "declared_sha256": "19c3f09580f30c59c83ae1bb03f478598fa81414c5a427abc34cef2492b99b58",
      "source_sha256": "51ed514a7e4b5219ee4366efe4577cf8b721671b99a27f8df58bab54ae12eca5",
      "execution_sha256": "51ed514a7e4b5219ee4366efe4577cf8b721671b99a27f8df58bab54ae12eca5",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
      "declared_sha256": "f2c79ad1e4d4e6a8a78b17570dac136a4ba675e470d8d3fd28dec54437c0161b",
      "source_sha256": "fea3cec46e94fb2eafef00414c34826bfd42d516861ac8c31b11d4f69fbdf7a1",
      "execution_sha256": "fea3cec46e94fb2eafef00414c34826bfd42d516861ac8c31b11d4f69fbdf7a1",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/09 bis – Modèle et migration T03 Catalogue.md",
      "declared_sha256": "775d55ed3804425563c3d072b4ef0d5fc3fc5f3a8b0b8e99d01a99a8ae0cef84",
      "source_sha256": "599cf0bda959be4a5cf397eaf99a255c0c002c42f007a814cd516a565f530f4c",
      "execution_sha256": "599cf0bda959be4a5cf397eaf99a255c0c002c42f007a814cd516a565f530f4c",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md",
      "declared_sha256": "233fcac8e351152e443bf1054594bcd358bb65ca8b776ace3717bb78b4f003bb",
      "source_sha256": "2742fd91b1fff691d80cd1a93ebc9ce0637b0c8e3fafd311e4f8c46b428ab984",
      "execution_sha256": "2742fd91b1fff691d80cd1a93ebc9ce0637b0c8e3fafd311e4f8c46b428ab984",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/11 – API fonctionnelles.md",
      "declared_sha256": "349c24d7d88e9c9989d065c92fec386e02b8e8d1dd0eb03ea38e5746ad26d3a5",
      "source_sha256": "2ef5b59f5623da5ac1ca891cd8137396c1b6959c3670b1036ddc9d0f8c4d222a",
      "execution_sha256": "2ef5b59f5623da5ac1ca891cd8137396c1b6959c3670b1036ddc9d0f8c4d222a",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/12 – Architecture technique.md",
      "declared_sha256": "2154f66cc21a349dbf926785abc002f4737c7fd225b9976dccb1fc8774902a41",
      "source_sha256": "6eb228565adc229ba355e696714461be0d128ad563006b4a693f2392a1a18b56",
      "execution_sha256": "6eb228565adc229ba355e696714461be0d128ad563006b4a693f2392a1a18b56",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
      "declared_sha256": "b288655be2d0392363bee3b39f6d96c9a333e60209b95de0dcdf9fa375b9293f",
      "source_sha256": "eba8b139f9fc8c3a76af138c65ab015e2a3630b202eaba6bf6ab389025f36a3c",
      "execution_sha256": "eba8b139f9fc8c3a76af138c65ab015e2a3630b202eaba6bf6ab389025f36a3c",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md",
      "declared_sha256": "cdbea10df53d81cdde02c367b5fc8ec4063eb939ee2356c7076ad4b7090cf373",
      "source_sha256": "752d5284f8a65177d81aea6fe2a7f8f3d671a5e29fda5d117a9c91334a207143",
      "execution_sha256": "752d5284f8a65177d81aea6fe2a7f8f3d671a5e29fda5d117a9c91334a207143",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/images/README-T03-FIGMA.md",
      "declared_sha256": "e5b1d2c275ada45f5ca6fc058ddfed5e0ac7ca8d2415ee0be919873050329653",
      "source_sha256": "2e4b9e1d86d50d80d806258ab2dcb2eba0d1849d092ff5012d779891b69b0d96",
      "execution_sha256": "2e4b9e1d86d50d80d806258ab2dcb2eba0d1849d092ff5012d779891b69b0d96",
      "declared_hash_matches_source": false,
      "transition_matches": true
    }
  ],
  "policy": {
    "classifier_sha256": "18de39663c8d9af96585a0ec7366f2a1756ff1a1c5573c6e06aea4df77f70b74",
    "blobs": [
      {
        "path": "scripts/kodjo/verify-plan-review-transition.js",
        "source_oid": "ff40f12f7f4d5c03d849d70e1f498039621098e4",
        "execution_oid": "ff40f12f7f4d5c03d849d70e1f498039621098e4"
      },
      {
        "path": ".github/workflows/kodjo-v2-slice-plan.yml",
        "source_oid": "9136f43182ed6dcd51482626c29655c3edc3bd64",
        "execution_oid": "9136f43182ed6dcd51482626c29655c3edc3bd64"
      },
      {
        "path": ".github/workflows/kodjo-v2-slice-plan-review.yml",
        "source_oid": "9e63fc578bcf269eeb8fec120d90db4f4ce147be",
        "execution_oid": "9e63fc578bcf269eeb8fec120d90db4f4ce147be"
      }
    ]
  }
}
</KODJO_PLAN_REVIEW_TRANSITION_JSON>
