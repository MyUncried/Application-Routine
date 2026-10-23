# Epic 1 Context: Socle Circuit, pauses et calculs (domaine et données, sans interface)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Poser la mécanique commune du Circuit de séance libre, réutilisable plus tard par les formats : nature du Circuit (Tours / Séries) distincte de sa borne, présence de la récupération distinguée de sa valeur, points d'arrêt portés de bout en bout par le brouillon, développement et durées selon la nature, et opérations pures de conversion, de compte et de réserve. L'epic ne change rien de visible : la preuve passe par Jest et par la lecture d'une base réelle v10 migrée (jalon iPhone J0 après la story 1.1). Il débloque les epics 2 à 4.

## Stories

- Story 1.1: Nature du Circuit, borne typée et migration 011
- Story 1.2: Points d'arrêt de bout en bout dans le brouillon
- Story 1.3: Développement du Circuit et durées
- Story 1.4: Opérations de Circuit : compte, réserve, conversion, entrée et sortie

## Requirements & Constraints

- Aucune interface dans cet epic ; aucune validation ni aucun blocage hors des règles citées dans les stories.
- Compatibilité : toute séance existante se relit en Circuit de Tours, cibles, phases, charges et côtés PRE-5 intacts ; ses durées actuelles restent identiques.
- Récupération à trois états : absente (`null`), présente à 0, positive. Seule une valeur positive remplace la Pause terminale de l'occurrence ; 0 et absente ne remplacent rien. Une récupération n'est jamais comptée deux fois.
- Point d'arrêt : durée nulle ; interdit juste après le compte à rebours initial, juste avant la Fin, et en doublon sur un même emplacement. Il est rattaché à l'occurrence qui le précède : il la suit au déplacement, est copié à la duplication, retiré à la suppression. Une mise à jour de séance ne doit plus effacer les points existants.
- Développement : éléments internes au Circuit (récupérations, points) répétés à chaque Tour ou passage, éléments externes non répétés. Ordre interne : Exercice → récupération positive → point d'arrêt.
- Agrégation des natures de durée : ≥ l'emporte sur ≈, qui l'emporte sur exact. Résumé du Circuit = ce Circuit seulement, sans « N exercice(s) », « — min » s'il est vide. Durée de séance hors compte à rebours et Fin.
- Valeurs de test imposées pour les durées : 75 s, 85 s, 225 s et 255 s (passage bilatéral = 2Ti + PC + Pi, ou 2Ti + PC + R si R > 0).
- Séries : une diminution de N passe en réserve sans message ; une augmentation restaure d'abord la réserve puis préremplit par copie de la dernière ligne active. Réserve purgée à l'enregistrement, jamais persistée. Cas à couvrir : 4 → 3 → 4, enregistrement à 3 puis augmentation.
- Conversion Tours → Séries : extension par la dernière ligne active, troncature au-delà de N, perte calculée avant toute mutation. Séries → Tours : sans message, valeurs conservées. Le régime de chaque exercice ne change jamais. L'exercice du Catalogue n'est jamais modifié.
- Référence de non-régression : Jest 125 suites / 3242 tests verts, `npx tsc --noEmit` et `npm run lint` sans erreur. Les tests existants de `calculations.test.ts` et `compositionPresentation.test.ts` ne changent d'attente que là où D-390 ou D-399 l'imposent.

## Technical Decisions

- **Modèle Circuit (AD-34)** : `CircuitNature = "TOURS" | "SERIES"` ; `CircuitBound` union fermée avec la seule variante `{ kind: "COUNT"; count }`, qui **est** le `repeatCount` existant (1..99, défaut 1) — aucun second compte. `switch` exhaustifs sur `kind`. Aucune variante `DURATION` / `MAX` en PRE-6. La borne n'est pas persistée.
- **Migration 011 (AD-34, AD-35)** : `ADD COLUMN` seulement, idempotente, sans reconstruction de table ; `DATABASE_VERSION` passe de 10 à 11. Ajoute `tours.nature TEXT NOT NULL DEFAULT 'TOURS'` avec contrainte `CHECK`, et `activities.post_activity_recovery_present INTEGER NOT NULL DEFAULT 0`, repris à 1 si la valeur existante est > 0. Ne jamais toucher `migration001.ts`.
- **Récupération (AD-35)** : domaine `postActivityRecoverySeconds: number | null`, donnée de l'occurrence. `executionCalculations` inchangé.
- **Point d'arrêt (AD-36)** : forme `{ id, scope, position }` conservée ; `position` = nombre d'occurrences de la portée qui le précèdent ; `UNIQUE(session_id, scope, position)`, sans changement de schéma de `session_stop_points`. `insertStopPoints` enregistre la position reçue (plus de renumérotation). `SessionDraft.stopPoints` transmis par `toCreate/UpdateSessionInput` ; `validation.ts` réutilise `isStopPointPlacementValid` et ajoute l'unicité. Les opérations de `composition.ts` recalculent les positions ; un dépôt vers un emplacement interdit est invalide.
- **Séries (AD-37)** : en `SERIES`, chaque occurrence du Circuit a `count = repeatCount` (série identique) ou `rows.length = repeatCount` (séries variables). `ExecutionParameters` v3 inchangé.
- **Réserve (AD-38)** : `SessionDraft.circuitSeriesReserve?: Record<occurrenceId, SeriesRow[]>`, hors cartes, grille et calculs. Une conversion confirmée tronque définitivement, sans mémorisation.
- **Module `src/domain/sessions/circuit.ts` (AD-39)**, fonctions pures sur le `SessionDraft` : `prepareNatureChange` → `{ losses }`, `applyNatureChange`, `setCircuitCount`, `prepareEnterCircuit` / `enterCircuit`, `exitCircuit`, `circuitVolumes` (séries actives seulement). Aucun nouveau service.
- **Pas de duplication avec la Feuille** : l'adaptation à N réutilise les primitives d'`ExecutionParametersDraft` ; une primitive interne à `ExecutionSheetDraft` (ex. `setSeriesCount`) est extraite en fonction pure dans `ExecutionParameters.ts` à comportement identique, prouvé par les tests existants.
- **Développement (AD-40)** dans `calculations.ts` : Tours = contenu interne × N ; Séries = boucle i = 1..N, exercices dans l'ordre, série i seulement. Sert aux durées, comptes et volumes ; ce n'est pas un plan d'exécution (aucun moteur en PRE-6).
- Brouillon : `sessionDraftsEqual` et la garde de sortie doivent intégrer nature, présence de récupération et points d'arrêt.
- Persistance uniquement par les repositories (`SqliteSessionRepository`) ; cas métier attendus en unions discriminées, seule une entrée invalide lève.

## Cross-Story Dependencies

- Ordre interne : 1.1 → 1.2 ; 1.1 → 1.3 → 1.4. Les stories 1.2 et 1.3 peuvent avancer en parallèle.
- Chemin critique PRE-6 : 1.1 → 1.3 → 1.4 → 3.1 → 3.2.
- En aval : 2.1 dépend de 1.1 ; 2.2 de 1.3 ; 2.3 et tout l'epic 3 de 1.4 ; 4.1 de 1.2. Le résumé de durée (1.3) alimente l'en-tête du Circuit (3.1) ; `circuitVolumes` (1.4) alimente la modale Volumes (3.4) ; la Feuille recevra `inheritedSeriesCount` en story 3.3.
- Jalon J0 sur iPhone après 1.1 : base réelle v10 migrée en v11, séances, durées et paramètres PRE-5 identiques.
