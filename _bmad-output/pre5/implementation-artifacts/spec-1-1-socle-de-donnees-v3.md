---
title: 'Story 1.1 — Socle de données v3 : phases, charge, étapes et minimum de 1 s'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: 'adc2314f72301b3264dd9ba0e0509f045dc5b562'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre5/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre5/planning-artifacts/architecture/architecture-kodjo-pre5-2026-10-19/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/pre5/propagation-borne-1s.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les paramètres d'exécution (JSON v2) ne portent ni phases, ni charge, la Description n'a pas de codec d'étapes et la Cible Durée a un minimum de 5 s ; les stories d'interface PRE-5 n'ont donc aucun modèle sur lequel s'appuyer, et une donnée PRE-5 serait perdue à l'enregistrement.

**Approach:** Story 1.1 de `epics.md` (AC1 à AC15, qui font foi dans le détail), livrée atomiquement (AD-33) : format v3 écrit par un seul écrivain et lu avec la v2 par un seul lecteur, sans migration (AD-18) ; charge (AD-19) et phases (AD-20) obligatoires dans les types ; codec des étapes (AD-22) ; `stopConditionOf` (AD-23) ; transport par le Brouillon sans transition nouvelle (AD-25) ; minimum de 1 s (AD-31). Aucune interface nouvelle.

## Boundaries & Constraints

**Always:** `migration001` à `migration010` intactes, `DATABASE_VERSION` = 10, aucune migration SQL ; `readExecutionParameters`/`serializeExecutionParameters` seuls points d'entrée des repositories et de l'Instantané ; `loadEnabled`, `loadKg`, `workPhases` obligatoires (jamais optionnels) ; nom de code `workPhases` ; domaine pur sans i18n ; commentaires en français citant FR, Δ, D, AD ; retrait des `\r` sur tout découpage par lignes ; tests `@jest/globals`. `checkStructuralNumber` reste entier et inchangé ; `sameRowValue` et `alignRowsToBaseline` ignorent la charge ; `workSeconds`, `projectScalars`, Inversion, `computeIntrinsicDuration` non modifiés.

**Never:** transition nouvelle du Brouillon (story 2.1) ; interface de phases, charge, côtés, Condition d'arrêt (Epic 2), étapes à l'écran (3.1), Phrase (1.2) ; modification de `tokens.ts`, de `executionCalculations.ts`, de `PAUSE_GRID_VALUES`, de `EXECUTION_ACCELERATED_HOLD_POLICY`, des bornes de Pause ou de `NumberWheelPicker` ; affaiblissement de `DurationWheelPicker.test.tsx:371` et `NumberWheelPicker.test.tsx:260` ; appelant de production de `serializeV2`/`readV2` hors `readExecutionParameters`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ligne PRE-4 | JSON `version:2` | modèle courant, `workPhases: []`, `loadEnabled:false`, `loadKg:0` partout, aucun autre champ changé | — |
| Réenregistrement | paramètres relus v2 | écrits `{"version":3,…}` forme AD-18, `false`/`0`/`[]` toujours écrits | — |
| v3 incomplet | clé `loadEnabled`/`loadKg`/`workPhases` absente ou mal typée | — | `ExecutionParametersDataError` |
| Phases incohérentes | somme ≠ Cible, Mode Répétitions, 0 s, libellé vide ou > 20, `id` dupliqué, > 6 phases, Σ 3536 | refus | violation `STRUCTURE` (`validateForSave`), `ExecutionParametersDataError` (`readV3`) |
| Charge sous Sans | `loadEnabled:false`, `loadKg` 2,5 | conservée à l'écriture, à la relecture, au clone, à la copie | — |
| Charge invalide | −1, NaN, 1,3 | refus structurel | violation `STRUCTURE` champ `loadKg` |
| `serializeV2` + v3 | phases, charge active ou `loadKg` ≠ 0 | — | lève une `Error` |
| Version inconnue | `version:7` ou build PRE-4 lisant du v3 | — | `ExecutionParametersDataError` |
| Durée minimale | Cible Durée 1 s ; 0 s | 1 s acceptée ; 0 refusé | violation |

</frozen-after-approval>

## Code Map

- `src/domain/activities/ExecutionParameters.ts` -- `EP` : version (l. 25), bornes (l. 88), types (l. 110-153), `seriesRowsOf` (l. 214), `normalizeEffective` (l. 342), `validateForSave` (l. 571), `serializeV2`/`readV2` (l. 717, 778), `createEmptyExecutionParameters`, `executionParametersEqual`, `cloneExecutionParameters` (fin de fichier).
- `src/domain/activities/ExecutionParametersDraft.ts` -- `ExecutionSheetDraft` (l. 89), `openSheetDraft` (l. 132), `plain` (l. 178), `requestedParameters` (l. 181, à exporter pour le test d'aller-retour).
- `src/domain/activities/readV1.ts` (l. 177-237), `src/domain/sessions/SessionDraft.ts:72`, `src/domain/activities/testing/executionParametersFixtures.ts`, `src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts:29`, `SqliteSessionRepository.ts:752` (`recoveryExecutionParameters`), `src/features/activities/ExecutionParametersSheet.tsx:641` -- constructeurs à adapter mécaniquement (`tsc` les signale tous). `composition.ts` passe par `cloneExecutionParameters`.
- `src/domain/activities/exerciseSnapshot.ts` -- version d'enveloppe 3, lecture 1/2/3.
- `SqliteActivityDefinitionRepository.ts` (l. 169, 229, 330), `SqliteSessionRepository.ts` (l. 819, 1135) -- remplacer `readV2`/`serializeV2`.
- `src/domain/sessions/validation.ts` -- `INSTRUCTION_MAX_LENGTH` (1000), `normalizeInstruction`, `codePointLength` (privé) ; `validateForSave(…, "STORAGE")` l. 477, 497.
- `src/infrastructure/database/migrations/migration010.ts` -- autonome (types propres), ne pas toucher.
- `src/domain/activities/__tests__/legacyModeConfinement.test.ts` -- modèle de la garde `serializeV2`/`readV2`.
- `src/infrastructure/database/testing/NodeSqliteDatabase.ts` -- base `node:sqlite` réelle des tests de repositories.
- Tests de borne à adapter : liste de `propagation-borne-1s.md` §4.3 ; commentaires §4.1.

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/activities/ExecutionParameters.ts` -- version 3, `EXECUTION_PARAMETERS_V2`, `WorkPhase`, `WORK_PHASE_LIMITS`, champs obligatoires, contrôle structurel charge et invariant des phases (helper partagé par `validateForSave` et `readV3`), `serializeExecutionParameters`, `readV3`, `readExecutionParameters`, `serializeV2` gardé, `stopConditionOf`, `normalizeEffective`/égalité/clone/constructeurs, min 1 et commentaires -- AC1-AC6, AC8, AC10, AC12.
- [x] `src/domain/activities/exerciseLoad.ts` (nouveau) -- `roundLoadUp`, `normalizeLoad`, `reactivateLoad`, `formatLoadKg`, `parseLoadText` -- AC7.
- [x] `src/domain/activities/instructionSteps.ts` (nouveau) -- `decodeInstructionSteps`, `encodeInstructionSteps`, `splitStepAt`, `insertPastedText`, `instructionStepsLength` -- AC9.
- [x] `ExecutionParametersDraft.ts` -- `workPhases`, `nextPhaseId`, `loadEnabled`, `loadKg` transportés ; `plain` recopie `loadKg` -- AC13.
- [x] Constructeurs, `exerciseSnapshot.ts`, deux repositories, contrôle natif -- AC1, AC11.
- [x] Tests : `ExecutionParameters.test.ts`, nouveaux `exerciseLoad.test.ts`, `instructionSteps.test.ts`, garde `executionParametersV2Confinement.test.ts`, `ExecutionParametersDraft.test.ts`, `exerciseSnapshot.test.ts`, aller-retour SQLite (repositories), `copiesAndSnapshots.story13.test.ts`, `executionCalculations.test.ts` (6 s + 3 s, 3 séries, Pause 15 s → 9 s / 72 s), tests de borne §4.3 -- AC2-AC15.
- [x] READMEs de `src/domain/activities/` et commentaires citant `readV2` -- cohérence documentaire.

**Acceptance Criteria:**
- Given la story livrée, when on exécute `npm test`, `npx tsc --noEmit`, `npm run lint`, then les trois sont verts, `migration010.test.ts`, `preservation.story14.test.ts`, `tokensSpecification.test.ts`, `calculations.test.ts`, `compositionPresentation.test.ts`, `ActivityCard.test.tsx` passent sans affaiblissement.
- Given un aller-retour `node:sqlite`, when une ligne v2 est relue puis réenregistrée, then elle est relue sans phases et Sans, puis écrite en v3 ; charge sous Sans, phases (`id`, libellés, durées) et `RIGHT_LEFT`/`LEFT_RIGHT` sont conservés.
- Given `requestedParameters(openSheetDraft(p))`, when `p` porte une charge sous Sans non nulle, des charges variables, des phases ou `LEFT_RIGHT`, then le résultat égale `p`.

## Implementation Notes

- Checkpoint 1 (2026-10-19) : spec au-delà de 1 600 tokens conservée entière (story atomique par AD-33) ; aucune question ouverte ; approbation pré-autorisée par Hermann (développement PRE-5 autorisé le 2026-10-19, enchaînement sans approbation par story).

- Implémentation (sous-agent) : nouveaux modules `exerciseLoad.ts` (`LOAD_STEP_KG`, `REACTIVATED_LOAD_KG`) et `instructionSteps.ts` (`insertPastedText` prend une sélection `{start, end}`) ; `codePointLength` exporté de `src/domain/sessions/validation.ts` ; `requestedParameters` exporté. Violations de charge : `REQUIRED`/`UNRECOGNIZED`/`OUT_OF_RANGE` sur `loadKg` ; tout écart de phases : un `OUT_OF_RANGE` structurel sur `workPhases`.
- Tests de roue : à 0 min depuis 01:02, la seconde reste 00:02 (plus de recalage sur 00:05 sous min 1) ; valeurs historiques hors bornes de test portées à 3536/3600/4000 s. `ProfileStepper.test.ts` garde ses bornes génériques 5..3535 (adaptation optionnelle du §4.3).
- Garde `executionParametersV2Confinement.test.ts` : `serializeV2`/`readV2` admis dans `EP` et six fichiers de tests (tests des deux fonctions, parité `migration010`, insertion de lignes v2 historiques) ; `readExecutionParameters` emploie la grammaire v2 interne (`readV2Object`).
- Fins de ligne : `DatabaseRows.ts` et `SqliteSessionRepository.test.ts` (CRLF dans l'index) ramenés en CRLF après l'implémentation.

## Spec Change Log

## Review Triage Log

Passe 1 (2026-10-19) — couches : Blind Hunter (B), Edge Case Hunter (E), Verification Gap (V).

| # | Constat | Verdict | Preuve / route |
|---|---|---|---|
| B1 / E3 | Transitions existantes (Mode, Cible commune, échec, N) sur un Brouillon à phases → état non enregistrable | low | Inatteignable dans ce build : aucune interface ni donnée ne crée de phases ; les refus de transition relèvent de la story 2.1 (AD-20), exclue par le bloc figé (« Never : transition nouvelle »). Rejeté, hors périmètre. |
| B2 / E1 / E11 | `setVariable(true)` puis ✓ perd les phases | low | Même cause, même inatteignabilité ; AD-20 fait refuser Variables avec phases en 2.1. Rejeté, hors périmètre. |
| E2 | `normalizeEffective` à N = 1 depuis une série variable pose `workPhases: []` | false | Exigé par AC1 / AD-19 ; une série variable ne porte aucune phase. |
| B3 / E4 | Violation `workPhases` unique, sans index ; `firstIncompleteSeries` ne la nomme pas | low | Aucun écran ne l'affiche avant 2.1/2.8 ; la correction ajoute de la surface publique. Rejeté. |
| B4 | `id` de phase non borné (1e300) | low | Donnée écrite uniquement par l'application ; garde supplémentaire. Rejeté. |
| B5 / E10 | Libellé de phase admettant sauts de ligne ou caractères de contrôle | low | La saisie au clavier texte arrive en 2.8 ; garde supplémentaire. Rejeté. |
| B6 / E5 | `decodeInstructionSteps` donne une étape vide pour une ligne vide ou finale | low | Décodage littéral `/\r?\n/` décidé (AD-22, Design Notes) ; `normalizeInstruction` retire les fins ; les vides sont retirés à l'encodage. À reprendre si besoin dans l'affichage de 3.1. Rejeté. |
| B7 | Réenregistrer une Description PRE-4 retire ses lignes vides | low | Effet voulu d'`encodeInstructionSteps` (QP5-02 : étapes vides retirées) ; encodage seulement à `Terminer` (3.1). Rejeté. |
| E6 | `\r` isolé non découpé | false | AD-22 fixe `/\r?\n/` ; aucune source ne produit de `\r` seul. |
| B8 / E7 | Curseur au milieu d'une paire de substitution | low | Une sélection de `TextInput` ne tombe pas entre deux demi-caractères ; garde supplémentaire. Rejeté. |
| B9 | Garde ne confine pas `readV3` ; titre du test sans le contrôle natif | low | AC4 ne confine que `serializeV2`/`readV2` ; cosmétique. Rejeté. |
| B10 | `reactivateLoad` lit l'état brut, `normalizeLoad` l'effectif | false | À N = 1 variable, `rows` n'a qu'une ligne : mêmes valeurs ; un second appel restaure les valeurs non nulles (idempotent). |
| B11 / E8 / E9 | Charge gigantesque (1e21, 4e307) : format exponentiel, `Infinity` | low | Hors de tout usage réel ; garde ou plafond non décidés. Rejeté. |
| B12 | Versions d'enveloppe et des paramètres non croisées | false | `readExecutionParameters` lit selon la version interne : aucune perte ni erreur. |
| B13 | README : « lit la v2 par `readV2` » alors que le code passe par la grammaire partagée | low | Correction directe. **patch** (`src/domain/README.md`). Commentaire de `DurationWheelPicker.tsx` exact (cas générique) : rejeté. |
| B14 | Cas d'invariant non testés (Mode `null`, Cible `UNSET`, `loadKg` absent d'une ligne v3) | low | Code correct, tests absents ; ajout direct. **patch** (`ExecutionParameters.test.ts`). |
| V1 | `exerciseSnapshot.test.ts:323` : commentaire inséré avalant `.toBe(true)`, assertion vide | medium | Vérifié dans le fichier. **patch**. |

## Design Notes

Choix d'implémentation non visibles par l'utilisateur, décidés ici :
- Brouillon : `DraftWorkPhase = { id; label; durationSeconds: number | null }` (forme AD-20) ; `requestedParameters` transmet `null` comme 0 (aucune transition ne crée `null` en 1.1 ; `sheetDraftResult` arrive en 2.1). `lastNumberById` appartient à 2.1.
- Libellé de phase : 1 à 20 points de code, non blanc après `trim`.
- `parseLoadText` retourne la valeur lue sans arrondi ; l'arrondi (`roundLoadUp`) appartient aux transitions (2.1). `normalizeLoad`/`reactivateLoad` opèrent sur des paramètres (lignes effectives via `seriesRowsOf`) ; `reactivateLoad` pose 0,25 sur l'uniforme et chaque ligne si toutes les valeurs sont nulles.
- `decodeInstructionSteps` est un découpage littéral `/\r?\n/` (`null`/`""` → `[]`) ; `encodeInstructionSteps` retire les espaces extérieurs de chaque étape, retire les vides et éclate un saut de ligne résiduel ; les fonctions de saisie retournent la liste, la limite se teste par `instructionStepsLength` (encodée, points de code).
- `stopConditionOf` retourne `"TARGET" | "FAILURE" | "MIXED" | "NONE"`.
- `readV3` ignore les clés inconnues, comme `readV2`.

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
