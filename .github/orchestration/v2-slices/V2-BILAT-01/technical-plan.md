# Plan technique révisé — V2-BILAT-01

## Identité et verdict

- Mode : `PLAN_ONLY`
- Révision applicative : `04a15580f65d2b3702776447c3574dee988e5b83`
- Baseline documentaire : `7e4f6984a8aefb6018e908e183dd7dda56e2482d`
- Implémentation autorisée : **NON**
- Verdict : `PLAN_READY_FOR_INDEPENDENT_REVIEW`

Décision fermée : `migration004` = T02-S02/v4 ; `migration005` = V2-BILAT-01/v5 ; `migration006` = T03/v6.

## Constat vérifié

| Fichier | Symboles | Écart |
|---|---|---|
| `src/domain/sessions/Session.ts` | `Activity`, `Session`, DTO Create/Update | aucun côté |
| `SessionDraft.ts` | `SessionDraftExercise`, `SessionDraft`, conversions/égalité | aucun transport |
| `defaults.ts`, `validation.ts` | défauts et validateurs | aucun `SideMode` |
| `composition.ts` | `moveActivity`, `duplicateActivity` | aucune priorité Tour |
| `calculations.ts` | fonctions de durée/Séries | aucun multiplicateur L |
| `ExerciseScreen.tsx`, `CompositionScreen.tsx` | écrans Activité/Tour | aucun contrôle |
| `compositionPresentation.ts` | synthèses | unilatérales |
| `constants.ts`, `migrateDatabase.ts`, `migration004.ts` | version 4/chaîne 001–004 | migration005 absente |
| `SqliteSessionRepository.ts` | `AGGREGATE_QUERY`, `ACTIVITY_ROW_COLUMNS`, `insertActivities`, `mergeActivities`, `toActivitySqlValues`, `toActivity`, `assembleSession`, create/update | aucun SQL de côté |
| `DatabaseRows.ts` | `SessionAggregateRow` | aucune projection côté |

## Modèle à livrer

Créer `sideMode.ts` avec `SideMode`, `SIDE_MODES`, `cycleSideMode`, `sideMultiplier`, `resolveEffectiveSideMode`, `applyTourSideModeTransition`.

Ajouter :

- `Activity.sideMode`
- `Session.cycle.tour.sideMode`
- `CreateSessionActivityInput.sideMode`
- `UpdateSessionActivityInput.sideMode`
- `CreateSessionInput.tourSideMode`
- `UpdateSessionInput.tourSideMode`
- `SessionDraftExercise.sideMode`
- `SessionDraft.tourSideMode`

Défauts : `DEFAULT_SIDE_MODE = DEFAULT_TOUR_SIDE_MODE = "UNILATERAL"`. Aucun `executionSide` ni `effectiveSideMode` persisté.

## Migration 005

Créer `MIGRATION_005` :

- `activities.side_mode TEXT NOT NULL DEFAULT 'UNILATERAL'`
- `tours.side_mode TEXT NOT NULL DEFAULT 'UNILATERAL'`
- contrainte `CHECK` limitée à `UNILATERAL`, `RIGHT_LEFT`, `LEFT_RIGHT`
- passer `DATABASE_VERSION` à 5 après transaction réussie
- conserver migrations 001–004 intactes et le rejet des versions futures
- ne créer aucune donnée Exécution/Résultat.

Tests : v0–v4→v5, v5 sans rejeu, v6 refusée, défaut historique, valeur invalide, rollback, absence de donnée T03.

## SQL et atomicité

Étendre `AGGREGATE_QUERY`, insert/update Tour, `ACTIVITY_ROW_COLUMNS`, `toActivitySqlValues`, `insertActivities`, `mergeActivities`, `toActivity`, `assembleSession`, `SessionAggregateRow`.

L’activation du Tour produit d’abord un unique nouveau brouillon cohérent, puis `SqliteSessionRepository.update()` scelle Tour et enfants dans sa transaction existante. `Annuler` produit zéro mutation.

## Calculs

- autonome : `D = L × [C × A + (C − 1) × B] + R`
- inverse : `Cth = ((D − R) / L + B) / (A + B)`, arrondi .5 vers le haut, borné 1–99, puis D recalculée
- Répétitions/Échec : `Dmin = L × [(C − 1) × B] + R`
- Tour : pour chaque Activité `i`, `Li = sideMultiplier(resolveEffectiveSideMode(activity.sideMode, tour.sideMode))`, puis somme selon sa direction effective.
- Tour bilatéral : la direction du Tour prévaut, les enfants propres sont `UNILATERAL`, et `Ri` est comptée une fois par passage de côté.
- Tour unilatéral + Activité bilatérale : `Li = 2` pour cette Activité et `Ri` est comptée une seule fois après ses deux côtés.
- Tour et Activité unilatéraux : `Li = 1`.
- jamais de double multiplicateur ; BEFORE/AFTER utilisent leur côté propre ; dans le Tour, la direction du Tour prévaut lorsqu’elle est bilatérale, sinon chaque Activité conserve sa direction propre. `tourRepeatCount` multiplie ensuite le contenu complet du Tour.

## UI

Activité : contrôle `Côtés` après le segment de mode et avant les paramètres, dans les trois modes. Tour : contrôle après `Nombre de tours`.

États : `Unilatéral`, `D→G`, `G→D`. Accessibilité : `Unilatéral`, `Bilatéral droite-gauche`, `Bilatéral gauche-droite`.

Sous Tour bilatéral, enfant visible, désactivé, proprement `UNILATERAL`. Activation : dialogue déterministe avec titre `Voulez-vous exécuter ce Tour de manière bilatérale ?`, texte `À chaque répétition du Tour, toutes ses Activités seront exécutées une première fois d’un côté, puis une seconde fois de l’autre, selon l’ordre choisi. Les réglages de côtés propres aux Activités seront remplacés par celui du Tour.`, actions exactes `Annuler` et `Confirmer`. `Annuler` ne produit aucune mutation ; `Confirmer` applique une transition unique avec remise des enfants. Retour unilatéral sans restauration.

## Fichiers exhaustifs et scope_allow exact

```json
[
"src/domain/sessions/Session.ts",
"src/domain/sessions/SessionDraft.ts",
"src/domain/sessions/defaults.ts",
"src/domain/sessions/validation.ts",
"src/domain/sessions/calculations.ts",
"src/domain/sessions/composition.ts",
"src/domain/sessions/index.ts",
"src/domain/sessions/sideMode.ts",
"src/domain/sessions/__tests__/SessionDraft.test.ts",
"src/domain/sessions/__tests__/calculations.test.ts",
"src/domain/sessions/__tests__/composition.test.ts",
"src/domain/sessions/__tests__/validation.test.ts",
"src/domain/sessions/__tests__/sideMode.test.ts",
"src/features/sessions/CompositionScreen.tsx",
"src/features/sessions/ExerciseScreen.tsx",
"src/features/sessions/SideModeControl.tsx",
"src/features/sessions/compositionPresentation.ts",
"src/features/sessions/__tests__/CompositionScreen.test.tsx",
"src/features/sessions/__tests__/ExerciseScreen.test.tsx",
"src/features/sessions/__tests__/SideModeControl.test.tsx",
"src/features/sessions/__tests__/compositionPresentation.test.ts",
"src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
"src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
"src/infrastructure/database/constants.ts",
"src/infrastructure/database/migrateDatabase.ts",
"src/infrastructure/database/migrations/migration005.ts",
"src/infrastructure/database/repositories/SqliteSessionRepository.ts",
"src/infrastructure/database/types/DatabaseRows.ts",
"src/infrastructure/database/__tests__/migrateDatabase.test.ts",
"src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
"src/shared/i18n/resources/fr.ts"
]
```

Aucun fichier supprimé. Tout autre chemin est interdit, notamment migrations 001–004, Exécution, Historique et manifestes clôturés.

## Matrice BIL individuelle

| ID | Statut | Preuve |
|---|---|---|
|001|IN_SCOPE|SideMode|
|002|IN_SCOPE|Control/fr|
|003|IN_SCOPE|accessibilité|
|004|IN_SCOPE|cycleSideMode|
|005|IN_SCOPE|defaults/migration005|
|006|IN_SCOPE|3 modes|
|007|IN_SCOPE|Tour|
|008|NON_REGRESSION|aucune UI RECOVERY|
|009|NON_REGRESSION|Zones inchangées|
|010|DEFERRED_T03|ordre réel|
|011|IN_SCOPE|formule C−1|
|012|IN_SCOPE|aucune Pause inter-côtés|
|013|IN_SCOPE|autonome +R|
|014|IN_SCOPE|C par côté|
|015|IN_SCOPE|synthèse globale|
|016|IN_SCOPE|multiplicateur|
|017|IN_SCOPE|formule directe|
|018|IN_SCOPE|formule inverse|
|019|IN_SCOPE|arrondi/bornes|
|020|IN_SCOPE|recalcul D|
|021|DEFERRED_T03|contenu par côté|
|022|DEFERRED_T03|paire/répétition|
|023|IN_SCOPE|ordre/calcul invariant|
|024|IN_SCOPE|formule Tour|
|025|IN_SCOPE|priorité Tour|
|026|IN_SCOPE|dialogue|
|027|IN_SCOPE|transition atomique|
|028|IN_SCOPE|résolution effective|
|029|IN_SCOPE|enfant désactivé|
|030|IN_SCOPE|enfant unilatéral|
|031|IN_SCOPE|aucune restauration|
|032|IN_SCOPE|duplicateActivity|
|033|DEFERRED_FUTURE|duplication Tour absente|
|034|DEFERRED_T03|passages|
|035|DEFERRED_T03|résultats|
|036|DEFERRED_T03|partiel|
|037|DEFERRED_T03|rang|
|038|DEFERRED_T03|sous-titre|
|039|DEFERRED_T03|progression|
|040|DEFERRED_T03|annonce 1|
|041|DEFERRED_T03|annonce 2|
|042|DEFERRED_T03|annonce Tour|
|043|DEFERRED_T03|réinitialisation|
|044|DEFERRED_T03|préservation|
|045|DEFERRED_T03|modale|
|046|DEFERRED_T03|partiel côté|
|047|DEFERRED_T03|nœud suivant|
|048|DEFERRED_T03|exécution|
|049|DEFERRED_FUTURE|catalogue absent|
|050|DEFERRED_FUTURE|API-SIDE-04 absente|
|051|DEFERRED_FUTURE|copie Séance absente|
|052|DEFERRED_FUTURE|propagation future|
|053|IN_SCOPE|Activity.sideMode|
|054|IN_SCOPE|tour.sideMode|
|055|DEFERRED_T03|Plan|
|056|DEFERRED_T03|Résultat|
|057|IN_SCOPE|tranche Configuration|
|058|IN_SCOPE|persistance/calcul/UI|
|059|DEFERRED_T03|exécution réelle|
|060|DEFERRED_T03|T03 révisée|

Les lignes sont préfixées implicitement `BIL-`. BIL-049–052/API-SIDE-04 ne sont pas livrées : seul le `side_mode` de l’occurrence de Séance et du Tour est persisté.

## Sortie

Jest complet, TypeScript, lint, scope exact, tests migration/repository/domaine/UI, absence de code T03 et inspection manuelle limitée aux contrôles Activité/Tour et confirmation. Les tests de calcul couvrent explicitement : Tour bilatéral prioritaire avec récupération par passage ; Tour unilatéral + Activité bilatérale avec récupération unique après les deux côtés ; Tour et Activité unilatéraux ; absence de double multiplicateur.

Aucune question métier bloquante.

`PLAN_READY_FOR_INDEPENDENT_REVIEW`
