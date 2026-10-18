---
title: 'Story 1.1 — Socle : Cible typée, format v2 et migration 010'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
baseline_commit: 'd07a3817a065a107ecd48c458757587c41c1009f'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-1.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-kodjo-pre4-2026-10-16/ARCHITECTURE-SPINE.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/questions-ouvertes.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le code de départ porte « À l'échec » comme troisième Mode et code la Cible en `number | null`, où `null` confond échec et vide. Les données PRE-3, dont l'ancien mode À l'échec, ne peuvent pas porter une Cible typée par Série.

**Approach:** Livrer en une seule story atomique et verte (AD-14) le socle des données : la Cible typée `NUMBER | FAILURE | UNSET` et les deux Modes (AD-1) ; le JSON v2 figé, les lecteurs v1 et v2 et une projection scalaire unique (AD-3) ; `validateForSave` (AD-13) ; `migration010` avec prédicat d'illisibilité fermé, écart Q19/Q28 et `migration_notices` (AD-4, AD-12) ; l'adaptation mécanique de tous les consommateurs et des tests `TO_FAILURE` ; une adaptation minimale de l'interface PRE-3. Les critères d'acceptation font foi : **story 1.1, AC1 à AC25, dans `epics-parts/epic-1.md`**, avec le tableau de tolérance d'AC7.

## Boundaries & Constraints

**Always:**
- `migration001` à `migration009` ne changent pas ; `DATABASE_VERSION` passe à 10 ; tout dans la transaction exclusive de `migrateDatabase.ts`.
- Conversion v1 → v2 embarquée et figée dans `migration010.ts`, sans import du sérialiseur évolutif du domaine ; parité testée en octets relus par `readV2`.
- Reconstruction d'`activities` : sauvegarde et restauration de `activity_body_zones` (schéma de 008) et de `session_activity_media` ; comptes avant et après ; `PRAGMA foreign_key_check` vide ; schéma égal à la v9 hors CHECK ; bornes de 004 reprises à l'identique (Durée 1..5999).
- Illisible (écarté avec ses liens, Séance conservée, aucun fichier supprimé, nombre inscrit dans `migration_notices`) : JSON non analysable, version inconnue, types impossibles, Mode ou `kind` inconnu, lignes incohérentes avec N, N non entier, valeur positive dont la projection viole le CHECK, **toute valeur numérique négative ou non entière** (Q28). Une valeur positive hors bornes est conservée (Q15, Q21, H25) ; une Cible nulle ou à 0 devient `UNSET` (H7).
- Erreur structurelle : exception, annulation complète, `user_version` inchangé (H6).
- Preuves sur `node:sqlite` réel (base v9 construite par 001 à 009) et injection d'échec ; les étapes de 010 passent par une API interceptée par `FailingDatabase`.
- Corpus PRE-3 inchangé sur disque ; adaptation minimale des 92 cas `TO_FAILURE` dans `executionPhrase.test.ts` (Répétitions et toutes Cibles `FAILURE`, sans clause de Bip).
- Lexique pour tout texte ; jetons inchangés ; garde-fous zéro `ScrollView` intacts ; les trois contrôles verts.

**Never:**
- Ni Sélecteur avec option échec, ni popovers, ni tableau à Pied commun (E3), ni nature `lowerBound` ou nouveaux gabarits de Phrase (E2), ni affichage de l'avis (1.2), ni copies et Instantanés au-delà de la lecture et de l'écriture v2 (1.3).
- Aucune lecture du sens d'une Cible dans les colonnes scalaires ; aucune écriture applicative d'`UNSET` ; aucune conversion d'une donnée invalide en `FAILURE` ; aucune réinitialisation de base.
- Aucune modification de skill, ni de `docs/preparation/PRE-3/planification/attendus-phrases-276.json`.

</frozen-after-approval>

## Code Map

- `src/domain/activities/ExecutionParameters.ts` -- types (`SeriesTarget`, `ExecutionMode`, `LegacyExecutionMode` réservé à `readV1`), version 2, `readV1` (absorbe `parseRow`:297 et `legacyExecutionParameters`:395), `readV2`, `serializeV2` (clés et ordre de 280-290), `validateForSave(params, baseline | "STORAGE")`, projection unique ; supprimer `validateExecutionParameters`, `projectLegacyScalars`, `resolveExecutionParameters` et la branche échec de `normalizeEffective`:148-159 ; égalité et clone par `kind`/`value` (piège : `===` en 505-514, clone superficiel 519).
- `ExecutionParametersDraft.ts` -- Cibles en `SeriesTarget` (`UNSET` au lieu de `null`), `setMode`:290-299 conserve `FAILURE`, `commitSheetDraft`:417 appelle `validateForSave` avec la ligne de base ; ne pas toucher aux réserves et identités (3.2).
- `executionCalculations.ts` -- `workSeconds`:55-63 : `FAILURE` et `UNSET` → `null` même avec Bip ; `isTotalDurationInvertible`:153 exige `NUMBER` ; `summarize` et l'agrégation inchangés (2.1).
- `executionPhrase.ts` -- 105, 109, 129-147 : tout `FAILURE` → gabarit 147 sans Bip ; un `UNSET` → `null`.
- `exerciseSnapshot.ts` -- version 2 (`serializeV2`/`readV2`) ; enveloppe v1 lue par `readV1`.
- `ActivityDefinition.ts` -- `executionParameters` obligatoire, scalaires retirés ; 250-333 remplacées par `validateForSave(…, "STORAGE")`.
- `src/domain/sessions/Session.ts`, `validation.ts` (545-617), `SessionDraft.ts`, `calculations.ts` (77-85), `errors.ts` -- Mode réexporté, paramètres obligatoires pour `EXERCISE`, chemins scalaires supprimés ; branches `RECOVERY` intactes.
- `src/infrastructure/database/constants.ts`, `migrateDatabase.ts` (étape `version === 9` après 116-119, sur le modèle 85-112), `migrations/migration010.ts` (nouveau ; motif de 004:85-261 ; schéma v9 = 004 + 005:35 + 007:160 + 009:25-27), `types/DatabaseRows.ts`.
- `repositories/SqliteActivityDefinitionRepository.ts` (`scalarValues`:59, `create`:136, `update`:180, mapping 325), `SqliteSessionRepository.ts` (`insertActivities`:526, `toActivitySqlValues`:665, `toActivity`:977, faits par lot 1113-1158, `assertSessionAggregateRow`:1205, exporté pour la parité et appliqué aussi avant écriture), nouveau `SqliteMigrationNoticeRepository.ts` et son port, câblé dans `SessionServiceProvider.tsx` (112-115, 243-251).
- Interface minimale : `ExecutionParametersSheet.tsx` (segmenté 431-435 sans `TO_FAILURE` ; `FAILURE` en lecture « à l’échec », `UNSET` en « — » invalide), `ActivityEditorForm.tsx`:110, `ActivityCard.tsx`:115, `compositionPresentation.ts` (246-295 sur Cibles typées, sans `?? 0` ; supprimer `formatExerciseRecap`:354 et `formatExerciseDurationLine`:441, sans appelant de production), `ExerciseScreen.tsx` (254, 316-337, 433-444), `src/shared/i18n/index.ts`:27, `resources/fr.ts`:380 (« à l’échec », Q24).
- Tests : les 18 fichiers qui fixent `TO_FAILURE` (dont `migrateDatabase` 9, `compositionPresentation` 13) ; `targetSchema.test.ts` (DDL historique conservé, `migration_notices` ajouté vers 691-719) ; bâtisseur de base v9 depuis `seedVersion8` (`migrateDatabase.test.ts`:1287) + 009 ; garde `TO_FAILURE` par `readdirSync` (modèle `visualAssets.test.ts`).

## Tasks & Acceptance

**Execution:** (jalons J1 à J7 de la story ; contrôles complets à chaque jalon)
- [x] `src/domain/activities/ExecutionParameters.ts` + `src/domain/sessions/Session.ts` -- types, lecteurs, sérialiseur v2, projection, `validateForSave` et leurs tests unitaires (AC1-AC8) -- fondation unique (AD-1, AD-3, AD-13).
- [x] `src/infrastructure/database/migrations/migration010.ts`, `migrateDatabase.ts`, `constants.ts` -- conversion figée, prédicat, écart, reconstruction, `migration_notices`, tests v9 réels et annulation (AC9-AC17) -- AD-4, AD-12.
- [x] repositories (définitions, sessions, avis) + `SessionServiceProvider.tsx` -- écriture v2 et projection unique, assertion alignée et testée en parité avec le CHECK réel, aller-retour (AC18-AC19).
- [x] domaine consommateur (brouillon, calculs, phrase, Instantané, sessions) -- adaptation mécanique (AC20-AC22).
- [x] interface minimale et lexique (AC21-AC23) -- deux Modes, échec affiché en lecture, perte transitoire assumée jusqu'à 3.4.
- [x] tests `TO_FAILURE`, corpus et garde `TO_FAILURE` hors lecteur v1 et migration (AC4, AC24-AC25).

**Acceptance Criteria:**
- Given la story 1.1 de `epics-parts/epic-1.md`, when elle est livrée, then chacun de ses AC1 à AC25 est vérifié par un test nommé, et les trois contrôles (`npm test`, `npx tsc --noEmit`, `npm run lint`) sont verts.

## Implementation Notes

- **Emplacement de `readV1`** : `src/domain/activities/readV1.ts` (module propre, avec `LegacyExecutionMode` et `LegacyExecutionScalars`) plutôt qu'à l'intérieur d'`ExecutionParameters.ts`, pour que la garde d'AC4 puisse cantonner le littéral de l'ancien mode par fichier. `ExecutionParameters.ts` reste seul à définir le Mode, la Cible, les bornes, `validateForSave`, `serializeV2`, `readV2` et `projectScalars`.
- **Alignement sur la ligne de base (AC7)** : dans cette story, les Séries sont comparées à la ligne de base par leur rang ; l'alignement par identité de ligne relève du brouillon étendu (3.2). Champs communs comparés un par un ; une Cible n'est tolérée que dans le Mode de la base.
- **Récupération autonome (`RECOVERY`)** : les types de lecture n'exposant plus de scalaires, une ancienne ligne `RECOVERY` (convertie par 004, plus jamais produite, création toujours refusée) est lue comme une seule Série chronométrée de sa durée, sans Pause ; branches `RECOVERY` du CHECK, du calcul et de la validation conservées.
- **Côté écrit** : la direction persistée (`side_mode`) et relue vient de `executionParameters.sideMode` (AD-3) ; `Activity.sideMode` / `SessionDraftExercise.sideMode` en sont un reflet, synchronisé par `ExerciseScreen` au ✓.
- **Total de la Feuille** : la ligne Durée totale n'est pas proposée tant qu'une Cible est `FAILURE` (comportement de l'ancien mode conservé, AC21).
- **Grille Durée** : `EXECUTION_BOUNDS.durationTarget` vaut désormais 5..3535 au pas de 5 (AC6) ; la roulette et les steppers existants peuvent proposer une valeur hors grille, refusée (✓ indisponible) — comportement transitoire assumé jusqu'à 3.4.
- **Gel des migrations** : `targetSchema.test.ts` gèle désormais aussi les empreintes LF de 007, 008 et 009 (code de départ `d07a3817`).
- **Jalons** : le développement a été mené d'un bloc (types → lecteurs → migration → repositories → consommateurs → interface → tests), avec les trois contrôles complets en fin de story (voir Verification) ; aucun jalon intermédiaire n'a été consigné séparément.

## Spec Change Log

## Review Triage Log

Revue du 2026-10-16 (itération 0) : relecteurs `blind-hunter` (B), `edge-case-hunter` (E) et `verification-gap` (V). Chaque constat a été vérifié dans le code.

| ID | Verdict | Preuve | Route |
|---|---|---|---|
| V1 | low | Le chemin Séance est câblé (`ExerciseScreen.tsx:461-463`, `:522`, `:567`, `:586`), mais aucun test ne monte `CompositionExerciseEditor` avec une valeur hors grille. | patch (test) |
| B1/V2 | low | `Math.max(series_count, 1)` (`migration010.ts:295`, `readV1.ts:193`) ramène un N négatif à 1, alors que Q28 écarte toute valeur négative. 0 → 1 reste conforme à AC3. | patch : N négatif → illisible |
| B2 | low | `fromScalars` ignore une colonne de Cible inactive négative ou non entière (`migration010.ts:297-298`). Cas possible dans `activity_definitions` seulement. | patch : classer aussi la colonne inactive non nulle |
| B3 | false | AC9 (c7) définit l'incohérence avec N par `count` < 1 ; elle est implémentée et testée (`migration010.test.ts:304`). | rejeté |
| B4 | maybe-false (low) | Le lecteur v1 de PRE-3 rejetait déjà une clé Bip absente, et aucun Instantané n'est persisté. | rejeté ; à revoir en 1.3 |
| B5 | false | Les seules filles d'`activity_definitions` (006:36, 007:125) sont en CASCADE ; une fille inconnue fait échouer la migration ou relève du `foreign_key_check`, sans perte silencieuse. | rejeté |
| B6 | low | Les regex de la garde (`legacyModeConfinement.test.ts:103`, `:136`) ratent `import type`, `import *`, `export … from`, `require` et `?? 0` après une Cible. | patch |
| B7 | low | Aucun test nommé pour AC25, alors que le critère global l'exige. | patch (test) |
| B8 | low | « indisponible tant qu’une valeur requise manque » et « Valeur à renseigner » sont annoncés pour une valeur hors grille (`ExecutionParametersSheet.tsx:379`, `:1057`). | patch (lexique neutre, hint selon le code) |
| B9 | low | `FailureTargetText` (`ExecutionParametersSheet.tsx:1075-1083`) n'a pas de libellé accessible de ligne ni de champ, et une largeur figée. | patch |
| B10/E6 | false | La branche `RECOVERY` de `validateActivityParameters` est morte : `validateCreatableActivityType` refuse `RECOVERY` (`validation.ts:290-291`). | rejeté |
| B11/E8 | low | `toSessionViolation` retire `level`, `step` et `seriesNumber`, mais aucun consommateur ne les lit, et il n'y a aucune violation INPUT au niveau STORAGE. | rejeté (aucun préjudice nommé) |
| B12 | false | Afficher « Paramètres à compléter. » pour une Copie à Cible `UNSET` est la règle H28 ; le mélange FAILURE/NUMBER est inatteignable en 1.1. | rejeté |
| B13 | false | AC13 impose ce schéma exact ; un UNIQUE ou un CHECK(kind) violerait AC13. | rejeté |
| B14 | low | H6, H7, H24 et H25 sont implémentées sans mention de confirmation. Le plan a été validé globalement par Hermann (2026-10-16 19:56). | patch documentaire (`questions-ouvertes.md`) |
| B15 | low | Tenue de la spec (`npx jest` au lieu de `npm test`, jalons, statut). | rejeté : la correction modifierait la spec ; le statut est aligné à l'étape 5 |
| B16 | low | `assertExpectedSchema` ne compare que les noms et l'ordre des colonnes ; un écart n'est possible que sur une base altérée hors application. Comparer les types ajouterait de la complexité. | rejeté (improbable, correction non triviale) |
| E1/E2 | low | `validateForSave` lève une `TypeError` sur `undefined` ou `null` (`ExecutionParameters.ts:381-385`), contre son contrat « ne lève jamais ». | patch (garde en tête de fonction) |
| E3 | low | Une Définition conservée au-dessus de 5999 s, copiée en Séance, provoque une erreur générique du repository. Une telle valeur ne peut pas venir de PRE-3 (bornes 1..5999 du domaine PRE-3). | rejeté (improbable, nouveau chemin de validation) |
| E4 | low | Un Instantané v1 relu puis resérialisé garde `snapshotVersion` 1 avec des paramètres v2, et sa relecture échoue (`exerciseSnapshot.ts:88`). | patch |
| E5 | low | La roulette et les steppers existants produisent des durées hors grille, et le ✓ est indisponible : comportement transitoire assumé. | defer → 3.4 |
| E7 | maybe-false (high si vrai) | `foreign_key_check` porte sur toute la base ; une violation préexistante ailleurs bloquerait le démarrage. Improbable, car les FK sont actives à chaque ouverture. | defer → à vérifier en 1.4 sur une vraie base v9 |
| E9 | low | `DatabaseRows.ts:1` importe le type `LegacyExecutionMode` depuis `readV1`, contredisant AC4 et le README. | patch (type local) |

## Verification

**Commands:**
- `npx jest` -- expected: toutes les suites vertes, dont `migrateDatabase`, `targetSchema`, `executionPhrase` (276 cas)
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

**Résultat (2026-10-16, fin de story)** : `npm test` 101 suites, 2038 tests verts (dont corpus 276, `migration010.test.ts` 55 tests, garde `legacyModeConfinement.test.ts`) ; `npx tsc --noEmit` sans erreur ; `npm run lint` sans erreur.

**Manual checks (if no CLI):**
- Aucune recette iPhone à ce stade : R-1.1-xx est jouée avec la story S0, après vérification du dev client (Q22).
