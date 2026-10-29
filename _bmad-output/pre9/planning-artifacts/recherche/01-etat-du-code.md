# PRE-9 — Inventaire factuel du CODE (base `pre9-bmad/plan` = `main @ 547bb7ef`)

Lecture seule. Chemins relatifs à `C:\Dev\KODJO-BMAD-PRE8`. `DATABASE_VERSION = 15` (`src/infrastructure/database/constants.ts:90`).

## Synthèse en une ligne

**Le stockage et le Domaine savent représenter Exercices directs + plusieurs Circuits + plusieurs Cycles (D-449, migration 014) [correction du 29/10 : sauf les Exercices directs de Cycle introduits par D-451 — `StructureCycle` ne contient que des Circuits, `activities` et `session_stop_points` n'ont pas de `cycle_id` ; voir `etat-initial-et-ecarts.md` §1] ; l'interface (Composition, brouillon, service, édition, duplication) ne manipule encore que l'ancien modèle « avant / Circuit unique / après ». Aucun Format n'est persisté (vignettes affichées, seul « Libre » est disponible). Aucun moteur d'exécution, mais des briques pures (développement d'étapes, calcul de durée, instantané) existent.**

---

## 1. Modèle de domaine (`src/domain/**`)

| Élément | Où | Ce qui existe |
|---|---|---|
| Structure générale D-449 | `src/domain/sessions/structure.ts:45-74` | `StructureElement = EXERCISE \| CIRCUIT \| CYCLE` ; `StructureCycle{id, repeatCount, circuits[]}` ; `StructureCircuit{id, repeatCount, nature, exercises[]}` ; `SessionStructure{elements, stopPoints}`. Aucune imbrication (en-tête l.4-8). |
| Bornes | `structure.ts:40-43` | Circuit 1..99 ; Cycle ≥ 1, **pas de borne haute**. |
| Conversions ancien ↔ général | `structure.ts:216` (`structureFromLegacy`), `:249` (`legacyFromStructure`, renvoie `null` si non représentable) | Ancien modèle = `[Exercices…, Circuit, Exercices…]` sans Cycle. |
| Durée et décompte | `structure.ts:145` (`countStructureExercises`), `:181` (`computeStructureDuration`) | Cycle multiplie ses Circuits ; TOURS : ×N ; SERIES : `seriesCircuitContribution`. |
| Validation de forme | `structure.ts:306` (`validateStructureShape`), codes `:288-296` | Cycle vide, comptes hors bornes, nature, identifiants dupliqués, points d'arrêt. |
| **Garde Points d'arrêt** | `structure.ts:15-20`, `:384-385` | `STRUCTURE_STOP_POINTS_UNSUPPORTED` : une structure non représentable dans l'ancien modèle **n'accepte aucun Point d'arrêt** (généralisation renvoyée à l'« Epic C »). Mappé en `FORBIDDEN_PLACEMENT` (`structuredInput.ts:58`). |
| Entrée d'écriture structurée | `src/domain/sessions/structuredInput.ts:40`, `:130` | `StructuredSessionInput` + `validateStructuredSessionInput` (réutilise la validation de l'ancien chemin via `equivalentLegacyInput`, l.69). |
| Séance lue (ancien modèle) | `src/domain/sessions/Session.ts:175-260` | `Session.cycle` = Cycle technique unique (`repeatCount: 1`), `beforeTour`/`afterTour`, `tour{repeatCount, nature, exercises}` ; `structure?` (l.214) = forme générale, `stopPoints?` (l.207). |
| Occurrence (Exercice de Séance) | `Session.ts:94-170` | `Activity` : `structuralPosition` BEFORE/IN/AFTER_TOUR, `executionParameters` typés (l.107), `postActivityRecoverySeconds` null/0/>0 (l.130), `sideMode`, `sourceMovementId` (référence ACTIVE au Mouvement, l.162), `copyNumber`. Type `RECOVERY` conservé pour lecture défensive seulement (l.35-55). |
| Nature de Circuit | `src/domain/sessions/circuit.ts:53-59` | `TOURS \| SERIES`, défaut TOURS ; opérations sur brouillon mono-Circuit : `applyNatureChange` (:408), `setCircuitCount` (:443), `enterCircuit`/`exitCircuit` (:577/:590), `circuitVolumes` (:605). |
| Brouillon | `src/domain/sessions/SessionDraft.ts:190-266` | **Mono-Circuit** : `tourRepeatCount`, `circuitNature`, `exercises[]` (chacun avec `structuralPosition`, l.124), `stopPoints`, `circuitSeriesReserve`, `movements` (Mouvements créés/modifiés dans le brouillon). Aucun champ Cycle / liste de Circuits / Format. |
| Points d'arrêt (ancien modèle) | `src/domain/sessions/StopPoint.ts:44-52` | `{id, scope: BEFORE/IN/AFTER_TOUR, position}` ; règles RM-219/RM-251/D-441/D-442 (`isStopPointAllowed` :216, `tourBoundaryConflict` :412…). |
| Composition (opérations pures) | `src/domain/sessions/composition.ts` | 3 zones (`STRUCTURAL_ZONES` :47), `moveOccurrence` :856, `stepOccurrence` :877, `removeOccurrence` :931, `duplicateOccurrence` :969, `moveStopPoint` :986, `resolveTourBoundaryConflict` :564, numéro de copie :256-268. |
| Placement (pauses / points) | `src/domain/sessions/placement.ts` | Mode placement : récupérations (`setPlacementRecovery` :266, `setOccurrenceRecovery` :767) et points d'arrêt (`togglePlacementStopPoint` :620), `applyPlacementDraft` :728. |
| Paramètres d'exécution | `src/domain/activities/ExecutionParameters.ts:222-245` (v5, l.59) | Mode DURATION/REPETITIONS, séries uniformes/variables, Cible typée NUMBER/FAILURE/UNSET (:81), phases de travail (≤6, :168), côtés + ordre + récupération de côté, bip, compte à rebours, Fin, charge. |
| Mouvement | `src/domain/activities/Movement.ts`, `MovementRepository.ts` | Contenu partagé (nom unique, phases, zones, médias, alias, familles de niveaux, archivage). |
| ActivityDefinition (anciens Exercices autonomes) | `src/domain/activities/ActivityDefinition.ts` | Toujours présent (430 l.) : `movement_id` + `execution_parameters`. |

D-451 : **aucune mention dans le code**. D-449 : citée dans `structure.ts`, `SessionRepository.ts:58-90`, `migration014.ts`, `SqliteSessionRepository.ts`, catalogue E.

## 2. SQLite : migrations et schéma

| Migr. | Objet (une ligne) |
|---|---|
| 001 | Schéma initial : `users`, `sessions`, `cycles`, `tours`, `activities` (`migration001.ts:2-56`). |
| 002 | `categories`, `session_categories` N:N, `activity_body_zones` (T01-S09). |
| 003 | Reconstruction `activities` pour mode « À l'échec » `TO_FAILURE` (D-111). |
| 004 | Récupération attachée à l'Activité ; suppression des lignes `RECOVERY`. |
| 005 | `side_mode` sur `activities` et `tours` (bilatéralité). |
| 006 | `activity_definitions` + `activity_definition_body_zones` (Catalogue d'Exercices, V2-CAT-01). |
| 007 | Référentiels `body_zones`, `labels`, `profiles`, `media_assets`, `activity_media`, `session_stop_points` ; `sessions.label_id`. |
| 008 | Profil complété, clés normalisées uniques, `activity_body_zones` avec FK réelle. |
| 009 | JSON `execution_parameters` (définitions + occurrences), `activities.category_id`, `session_activity_media`. |
| 010 | « Deux Modes, Cible typée par Série » (conversion v1→v2, `migration_notices`). |
| 011 | `tours.nature` (TOURS/SERIES) + `activities.post_activity_recovery_present`. |
| 012 | Schéma Mouvement/filiation/niveaux (`movements`, `movement_phases`, `_body_zones`, `_media`) ; **réinitialisation** Exercices + Séances. |
| 013 | Occurrence → référence active au Mouvement (FK RESTRICT), `movement_aliases`, `copy_number` ; suppression `activity_body_zones` et `session_activity_media` ; réinitialisation. |
| 014 | **Structure générale D-449** : `cycles`, `tours`, `activities`, `session_stop_points` recréées, conversion sans perte (`migration014.ts:1-50`). |
| 015 | `movements.archived_at` (archivage Mouvement). |

Schéma courant des tables de composition (`migration014.ts:107-178`) :

| Table | Colonnes clés |
|---|---|
| `sessions` (001+007) | `id, owner_id, name, color, status ACTIVE/ARCHIVED, archived_at, initial_countdown_seconds, final_phase_seconds, label_id, created/updated_at`. **Aucune colonne format.** |
| `cycles` (:109) | `id, session_id, position` (rang au niveau principal), `repeat_count ≥ 1`. |
| `tours` = Circuits (:117) | `id, session_id, cycle_id NULL` (=niveau principal), `position`, `repeat_count 1..99`, `side_mode`, `nature TOURS/SERIES`. |
| `activities` = Exercices (:133) | `tour_id NULL` (=niveau principal), `position`, `type`, scalaires projetés, `execution_parameters` JSON, `post_activity_recovery_seconds/_present`, `side_mode`, `source_movement_id NOT NULL` FK RESTRICT, `copy_number`. Plus de `structural_position` ni `cycle_id`. |
| `session_stop_points` (:195) | `tour_id NULL` (=niveau principal) + `position` ; index uniques partiels (:176-177). |
| `activity_definitions` (013:135) | `id, movement_id, execution_parameters, created/updated_at` — conservée « en attendant l'Epic E » (`migration014.ts:28`). |
| `session_activity_media` | **supprimée** en 013 (médias lus dans le Mouvement). |

Le rang du niveau principal est partagé par `cycles`/`tours`/`activities` ; unicité et contiguïté garanties par le repository, pas par SQL (`migration014.ts:42-44`).

Repositories (`src/infrastructure/database/repositories/`) : ActivityDefinition, BodyZone, Category, Label, Media, MigrationNotice, Movement, Profile, Session. `SqliteSessionRepository` (`:283`) implémente 3 ports :
- `SessionRepository` (ancien modèle) : `create` :299, `update` :366, `findById` :485 → `toLegacySession` (:1394) ; **lève `SessionStructureNotRepresentableError` (:276)** pour une structure plus riche ;
- `StructuredSessionRepository` : `createStructured` :317, `updateStructured` :391, `findStructuredById` :491 — **aucun consommateur hors tests** (grep `src/features`, `app/`) ;
- `SessionCatalogueRepository` : `listCatalogue` :533 (structure générale), `findForConsultation` :548 (projection legacy → même erreur), `archive`/`restore`/`deleteArchived` :564-583.
`listActive` (:513) : décompte et durée via la structure (`:1436-1446`), `tourRepeatCount = 1` si non représentable.

## 3. Formats

| Aspect | État |
|---|---|
| Liste | `src/features/sessions/sessionFormats.ts:18-55` : 12 clés (TABATA, INTERVALS_30_30, EMOM, AMRAP, FOR_TIME, DEATH_BY, STRENGTH « Renforcement », CORE_MOBILITY, SUPERSET, PROGRESSION, UNTIL_FAILURE, FREE) + vignettes PNG `assets/formats/`. |
| Disponibilité | `available: false` partout sauf `FREE` (l.54) ; `FREE_SESSION_FORMAT` (l.58). Décision Q-E5 option A (l.2-11). |
| Consommateurs | Filtre/affichage catalogue seulement : `SessionFilterSheet.tsx`, `sessionCatalogueFilters.ts`, `sessionCatalogueProjection.ts`, `SessionCard.tsx`. |
| Absent | Persistance (aucune colonne, aucune migration), sélection d'un format à la création, paramètres de format (rounds, travail/repos, cap…), contraintes, calcul de durée par format, écran de configuration. « À l'échec » n'existe que comme Cible de Série (`ExecutionParameters.ts:81`, `failureTarget` :94). |

## 4. Écran Composition (`src/features/sessions/CompositionScreen.tsx`, 6 060 l.)

| Capacité | Présent ? | Preuve |
|---|---|---|
| Modèle manipulé | Ancien modèle uniquement (zones avant/dans/après, Circuit unique), via `SessionDraft` | `composition.ts:47`, `CompositionScreen.tsx:337-436` |
| Cycles / plusieurs Circuits | **Non** | aucun usage de `structure`/`createStructured` dans `src/features/sessions` (hors catalogue) |
| Exercices directs au niveau principal | Oui, limité à « avant » / « après » le Circuit unique | `StructuralPosition` (`Session.ts`), `STRUCTURAL_ZONES` |
| Choix « ajouter » | Arbre à 3 options : nouvelle activité → `/exercise`, activité existante → `/activity-selection`, annuler | `:3445-3497` |
| Nature Tours/Séries, compte, volumes | Oui | `CircuitNatureMenu` (:104), `CircuitVolumesSheet` (:3370), `CircuitEntryConfirmModal` (:3386), `TourBoundaryChoiceDialog` (:3360) |
| Repli / dépli | **Non** dans la Composition (aucune occurrence `collaps`/`isExpanded`) ; repli présent dans la carte Catalogue (`SessionCompositionTree.tsx`) | grep |
| Glisser-déposer + défilement auto | Oui : appui long, `DragShiftSession` local, `useDragAutoScroll` | `:898`, `:5531-5619`, `compositionGesture.ts:167-513` |
| Déplacement pas-à-pas (accessibilité) | Oui | `stepOccurrence` `:623`, `:2281` |
| Duplication / suppression | Oui (occurrence) | `handleDuplicateActivity` `:2584-2624`, `startDeletion` `:2376` |
| Pauses (récupérations) + Points d'arrêt | Oui, via le mode Placement | `enterPlacement` `:1227`, `placement.ts` |
| Durée et phrases | `formatCompositionSessionDuration` `:2664` (`formatSessionSummary.ts:70`) ; résumés d'occurrence `formatSessionSummary.ts:210-499` | |
| Enregistrement | `sessionService.updateSession` / `createSession` (ancien chemin) | `:1113-1114` |
| Réouverture | `hydrateFromSession` → `SessionService.getSessionForEdit` → `findById` (ancien modèle) | `SessionDraftProvider.tsx:153`, `SessionService.ts:224` |
| Consultation lecture seule | Oui (`editState === "consulting"`, `ReadOnlyFrame`) | `:2711`, `:3271`, `:5325` |
| Édition d'un Exercice | `/exercise?exerciseId=` | `:2657` |

Risque relevé : une Séance stockée avec Cycles ou plusieurs Circuits (possible via `createStructured`) ne peut être ni réouverte, ni consultée, ni dupliquée par l'interface (`findById`/`findForConsultation` lèvent ; `duplicateSession` utilise `findById`, `SessionService.ts:202-215`). Aucun écran ne gère `SessionStructureNotRepresentableError` (grep `src/features` : 0).

## 5. Anciens Exercices autonomes et routes

Routes (`app/`) : `(tabs)/index` (Catalogue), `(tabs)/calendar` et `(tabs)/history` (placeholders), `(tabs)/profile`, `(creation)/composition`, `(creation)/exercise`, `(creation)/activity-selection`, `movement`, `profile-edit`, `diagnostic-updates`, `+not-found`. Groupe `(creation)` enveloppé par `SessionDraftProvider` (`app/(creation)/_layout.tsx`).

| Chemin | État | Preuve |
|---|---|---|
| Segment « Exercices » du Catalogue | **Retiré** ; segments `movements \| sessions \| programs` | `CatalogueScreen.tsx:32-36` ; Créer → `/composition` (:188) |
| Sélection d'Exercices existants | **Active**, lit `activity_definitions` (`listActivityDefinitions`) | `ActivitySelectionScreen.tsx:95`, `useActivityCatalogue.ts:74` |
| Commande « Modifier » (E.8-a, transitoire) | **Active** : `/exercise?catalogueDefinitionId=<id>` ; « retiré quand l'epic C remplacera ce parcours (E.8-b) » | `ActivitySelectionScreen.tsx:144-155` |
| `ExerciseScreen` | 4 parcours : définition Catalogue `new`/`<id>` (écrit via `ActivityDefinitionService`) ; occurrence de Séance sans paramètre / `exerciseId` (écrit dans le brouillon seulement) | `ExerciseScreen.tsx:268-290`, `:309-326`, `:1385-1410` |
| Écritures `activity_definitions` encore câblées | `createActivityDefinition`, `updateActivityDefinition`, `createActivityDefinitionWithOrigin` (niveaux) | `ExerciseScreen.tsx:822-929`, `ActivityDefinitionService.ts:223-319` |
| `ActivityDefinitionService` | Mélange définitions + Mouvements + référentiels + médias (`:160-686`) ; utilisé aussi par l'éditeur d'occurrence (zones, niveaux, médias, `getMovement`) | `ExerciseScreen.tsx:1394-1814` |
| Création de niveau depuis un Exercice | `router.replace /exercise` avec `levelOriginDefinitionId` | `ExerciseScreen.tsx:1067-1075` |

## 6. Exécution

| Élément | État | Preuve |
|---|---|---|
| Moteur / écrans d'exécution | **Absent** : `src/features/execution/` ne contient que `README.md` (« ExecutionService… introduit après le spike RT-001 ») ; aucune route | `src/features/execution/README.md` |
| Développement en étapes | `expandComposition` (Tours/Séries, récupérations, points d'arrêt, omissions RM-219/251, D-441/442) — **mono-Circuit**, utilisé seulement par les tests | `src/domain/sessions/circuit.ts:150-192` |
| Registre d'événements / durée Exercice | `buildExecutionLedger` :153, `computeOccurrenceDuration` :255, `buildSeriesCircuitLedger` :277, `aggregateSessionDuration` :468 ; 5 issues (exact/estimé/minorant/omis/incomplet) | `src/domain/activities/executionCalculations.ts` |
| Durée Séance | `computeStructuredSessionDuration` :218, `computeSessionExecutionDuration` :278 (ancien modèle) ; `computeStructureDuration` (général) | `src/domain/sessions/calculations.ts`, `structure.ts:181` |
| Instantané immuable | `createExerciseSnapshot`/`serialize`/`parse` (v3) — préparé pour l'exécution, non utilisé en production | `src/domain/activities/exerciseSnapshot.ts:42-160` |
| Guidage des phases | `phaseGuidance.ts` (prévu pour `ExecutionService`) | `src/domain/activities/phaseGuidance.ts:4` |
| Phrases | `generateExecutionPhrase` | `executionPhrase.ts:185` ; résumés `formatSessionSummary.ts` ; durée carte D-391 `sessionCatalogueProjection.ts:143-156` |
| Feuille de paramètres | `ExecutionParametersSheet` | `src/features/activities/ExecutionParametersSheet.tsx:524` |
| Absent | plan d'exécution persistable, horodatage/timer, tables Exécution/Résultat, audio/voix (`src/infrastructure/{audio,speech,notifications,haptics}` = README seuls) | |

## 7. Tests (fichiers `*.test.ts(x)`)

| Zone | Nb |
|---|---|
| `src/features/sessions` | 65 (dont 19 `*.integration.test.tsx`) |
| `src/features/activities` | 45 |
| `src/domain/activities` | 28 |
| `src/infrastructure/database` | 27 |
| `src/shared/ui` | 16 |
| `src/domain/sessions` | 12 |
| autres (reference-data 7, preferences 4, app 3, media 4, divers 8) | ~26 |
| `tests/kodjo-prod-qualif/preflight.test.ts` | 1 |

À protéger en PRE-9 :
- Domaine : `src/domain/sessions/__tests__/structure.a2.test.ts`, `circuit.test.ts` (développement), `StopPoint.test.ts`, `placement.test.ts`, `composition.test.ts`, `calculations.test.ts`, `validation.test.ts`.
- Base : `migration014.test.ts`, `migration015.test.ts`, `sessionStructure.a4.test.ts`, `migrateDatabase.test.ts`, `targetSchema.test.ts`, `SqliteSessionRepository.test.ts`, `sessionCatalogue.e1.test.ts`, `sessionLifecycle.e5.test.ts`, `preservation.story1[14].*`.
- Intégration UI : `CompositionSaveFlow`, `CompositionPausesFlow`, `CompositionExerciseFlow`, `CompositionNavigationGuard`, `CatalogueCompositionEditFlow`, `CatalogueLifecycle.e7`, `EmptySessionOpenFlow`, `ExerciseEditingPaths`, `ExerciseEditorNoWrite`, `ExerciseScreen.*.integration` (r4–r10, mfn a22/a31/a32) — tous dans `src/features/sessions/__tests__/`.
- Catalogue structure-aware : `SessionCompositionTree.e3.test.tsx`, `sessionCatalogueProjection.e1.test.ts`.

## 8. Composants réutilisables

| Composant | Où | Usage potentiel PRE-9 |
|---|---|---|
| `SheetMotionView`/`Provider`/`ScrollView`, `rowShiftLayout` | `src/features/activities/SheetMotion.tsx:55-258` | apparition/repli de conteneurs (déjà utilisé par l'arbre catalogue) |
| `SwipeActionsRow` | `src/features/activities/SwipeActionsRow.tsx:71` | actions de ligne (dupliquer/supprimer) |
| `TransientNotification` | `src/shared/ui/TransientNotification.tsx:93` | annonces (suppression, points retirés) |
| `DisclosureControl` | `src/shared/ui/DisclosureControl.tsx:84` | repli/dépli Cycle/Circuit |
| `SegmentedControl` | `src/shared/ui/SegmentedControl.tsx:194` | choix nature / format |
| `PrimaryActionZone`/`Button` | `src/shared/ui/PrimaryActionZone.tsx:55-131` | barre d'action bas |
| `CatalogueCommands` | `src/shared/ui/CatalogueCommands.tsx:35-127` | |
| `useDragAutoScroll` / `DragAutoScrollController` | `src/features/sessions/useDragAutoScroll.ts:57-164` | glisser-déposer multi-conteneurs |
| `useAnimatedShiftRegistry` | `src/features/sessions/useAnimatedShift.ts:57-406` | décalages animés |
| Gestes/drop purs | `compositionGesture.ts:72-513` (`resolveDropTarget`, `resolveDragShifts`, `autoScrollVelocity`) | à généraliser (zones → conteneurs) |
| Rail | `compositionRail.ts:122` | filet de liaison dans un Circuit |
| `CircuitHeader`, `circuitUnitLabel` | `CircuitHeader.tsx:93-170` | en-tête Circuit (Cycle à créer) |
| `OccurrenceCard` | `OccurrenceCard.tsx:272` | carte Exercice |
| `NumberWheelPicker`/`DurationWheelPicker`/`WheelPickerOverlay` | `src/features/sessions/*.tsx` | comptes de Cycle/Circuit, paramètres de format |
| `DecisionDialog`, `AnchoredPanel` | `DecisionDialog.tsx:51`, `src/features/activities/AnchoredPanel.tsx:68` | confirmations, menus ancrés |
| `ExecutionParametersSheet` | `src/features/activities/ExecutionParametersSheet.tsx:524` | paramètres d'Exercice |
| `SessionCompositionTree` + `projectSessionTree` | `SessionCompositionTree.tsx`, `sessionCatalogueProjection.ts:156` | **seule vue UI déjà lisant Cycles/Circuits** (lecture seule) |

## Écarts évidents pour PRE-9 (constats, pas de jugement de spec)

1. Le chemin structuré (`createStructured`/`updateStructured`/`findStructuredById`) existe sans aucun appelant UI ; brouillon, service et Composition restent mono-Circuit.
2. Points d'arrêt interdits dès que la structure dépasse l'ancien modèle (`STRUCTURE_STOP_POINTS_UNSUPPORTED`).
3. `expandComposition` (base naturelle d'un plan d'exécution) est mono-Circuit et sans Cycle.
4. Formats : catalogue de vignettes seulement ; aucune persistance ni paramètre.
5. `activity_definitions` + `ActivityDefinitionService` + parcours `catalogueDefinitionId` toujours actifs via la sélection d'Exercices (E.8-a transitoire).
