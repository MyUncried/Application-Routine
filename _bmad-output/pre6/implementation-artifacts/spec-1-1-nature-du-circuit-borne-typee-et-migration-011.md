---
title: 'Story 1.1 — Nature du Circuit, borne typée et migration 011'
type: 'feature'
created: '2026-10-20'
status: 'done'
baseline_commit: 'd3604841d367a8563a034ef8e6560f9183916d06'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/architecture-pre6.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le Circuit n'a pas de nature (Tours / Séries) et sa condition de fin n'est pas typée ; la récupération post-exercice ne distingue pas « absente » de « présente à 0 » (colonne `NOT NULL DEFAULT 0`). Les stories suivantes (développement, conversion, pauses) en dépendent.

**Approach:** Ajouter au domaine `CircuitNature` et `CircuitBound` (variante `COUNT` seule, qui est le `repeatCount` existant), faire passer la récupération à `number | null`, et persister les deux par une migration 011 additive (`ADD COLUMN` uniquement), avec aller-retour complet brouillon → entrée → SQLite → lecture. Aucune interface nouvelle.

## Boundaries & Constraints

**Always:**
- `COUNT` = `tourRepeatCount` / `tour.repeatCount` existant (1..99, défaut 1) : aucun second compte, borne non persistée. Union fermée et `switch` exhaustifs (`never`).
- Migration 011 : `tours.nature TEXT NOT NULL DEFAULT 'TOURS' CHECK (nature IN ('TOURS','SERIES'))` et `activities.post_activity_recovery_present INTEGER NOT NULL DEFAULT 0 CHECK (… IN (0,1))`, puis reprise `present = 1` si `post_activity_recovery_seconds > 0`. Idempotente (colonne déjà présente → non rajoutée). `DATABASE_VERSION = 11`. Dans la transaction unique du runner.
- Écriture : `seconds = value ?? 0`, `present = value === null ? 0 : 1`. Lecture : `present = 1 ? seconds : null`.
- Une nouvelle occurrence (Catalogue, « + ») naît sans récupération (`null`), conformément à « aucune récupération automatique ».
- Calculs inchangés : `null` et `0` ne remplacent aucune Pause.
- Rendu inchangé dans cette story : la Composition affiche la récupération comme aujourd'hui (`?? 0`) ; la correction d'affichage relève de la story 2.1.
- Champs de transition optionnels selon la convention existante (`tourRepeatCount?`) : lecture `?? "TOURS"`.

**Never:**
- Ne pas modifier `migration001.ts` à `migration010.ts`, ni reconstruire une table.
- Ne pas créer de variante `DURATION` / `MAX`, ni d'écran, ni de logique de conversion (story 1.4).
- Ne pas changer la plage de récupération 0..5999 (story 4.2), ni le Profil.
- Ne pas affaiblir les tests de gel des migrations (`targetSchema.test.ts`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Base v10 | séances, récupérations 0 et 45 | v11 ; `nature = TOURS` partout ; 45 → présente 45 ; 0 → absente (`null`) ; JSON, phases, charges, côtés, cibles identiques | échec → annulation complète, `user_version` = 10 |
| Aller-retour nature | brouillon `SERIES`, N = 4 | relu `SERIES`, N = 4 | — |
| Aller-retour récupération | `null`, `0`, `30` | relus `null`, `0`, `30` | — |
| Nature invalide | entrée `"FOO"` | violation `UNRECOGNIZED` sur `session.circuitNature`, rien écrit | union discriminée |
| Récupération invalide | `-1`, `1.5` | violation existante (`OUT_OF_RANGE`, `NOT_INTEGER`) | — |
| Garde de sortie | seule la nature ou la récupération (null ↔ 0) change | brouillon « modifié » | — |

</frozen-after-approval>

## Code Map

- `src/domain/sessions/circuit.ts` (nouveau) -- `CircuitNature`, `CIRCUIT_NATURES`, `DEFAULT_CIRCUIT_NATURE`, `CircuitBound`, `circuitBoundOf(draft)`, `circuitBoundCount(bound)` (switch exhaustif). Futur foyer d'AD-39.
- `src/domain/sessions/Session.ts:122,196-203,244,280,324,350` -- `Activity.postActivityRecoverySeconds?: number | null` ; `cycle.tour.nature?` ; `Create/UpdateSessionActivityInput.postActivityRecoverySeconds: number | null` ; `Create/UpdateSessionInput.circuitNature?`.
- `src/domain/sessions/SessionDraft.ts:132,165,215,236-246,286,306,351,403-411,444,479,534` -- champ `circuitNature?`, `createExerciseDraft` défaut `null`, `toSessionDraft`, `exerciseEquals`, `sessionDraftsEqual`, `toCreate/UpdateSessionInput`.
- `src/domain/sessions/validation.ts:201,433-514,612-663,731-780` -- `validatePostActivityRecoverySeconds(number | null)`, `validateCircuitNature`, propagation dans les deux agrégats. Récupération autonome (`RECOVERY`) : `null` ou 0 admis, normalisé `null`.
- `src/domain/sessions/errors.ts:28-59` -- champ `session.circuitNature`.
- `src/domain/sessions/defaults.ts:65` -- constante récupération : conserver le nom, documenter que l'occurrence naît `null`.
- `src/domain/activities/ActivityDefinition.ts:339-342` -- paramètre `number | null`.
- `src/features/activities/ActivitySelectionScreen.tsx:139`, `src/features/sessions/ExerciseScreen.tsx:541` -- passer `null` au lieu de `0`.
- `src/features/sessions/CompositionScreen.tsx:1714` -- `?? 0` (rendu inchangé).
- `src/infrastructure/database/migrations/migration011.ts` (nouveau) -- `applyMigration011(transaction)` : `PRAGMA table_info` puis `ALTER TABLE … ADD COLUMN`, `UPDATE` de reprise.
- `src/infrastructure/database/migrateDatabase.ts:144-150`, `constants.ts:53` -- branche `version === 10`, version 11, JSDoc.
- `src/infrastructure/database/repositories/SqliteSessionRepository.ts:277-300,389,487,640-660,715,741,794-834,930-977,1165,1243-1251,1311,1372-1420` -- SELECT des deux colonnes, INSERT/UPDATE `tours.nature`, `ACTIVITY_ROW_COLUMNS` + `present`, `ActivitySqlValues`, `UPDATE activities`, lecture en `null`, assertion de ligne (`present ∈ {0,1}`, `present = 0 ⇒ seconds = 0`, nature connue).
- `src/infrastructure/database/types/DatabaseRows.ts:66,88` -- colonnes.
- `src/infrastructure/database/README.md`, `AGENTS.md` (« onze présentes, 001 à 011 ») -- mention de 011.
- Patron de preuve sur base réelle : `src/infrastructure/database/__tests__/preservation.story14.test.ts` et `testing/buildVersion9.ts` (base fichier construite par les migrations du code de départ, nouvelle connexion).

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/sessions/circuit.ts` -- types et helpers, tests `__tests__/circuit.test.ts` -- AC1.
- [x] `src/domain/sessions/{Session,SessionDraft,validation,errors,defaults}.ts`, `ActivityDefinition.ts` -- nature et récupération nullable de bout en bout -- AC3.
- [x] `ActivitySelectionScreen.tsx`, `ExerciseScreen.tsx`, `CompositionScreen.tsx` -- `null` à la création, `?? 0` à l'affichage -- comportement visible inchangé.
- [x] `migration011.ts`, `migrateDatabase.ts`, `constants.ts`, `DatabaseRows.ts` -- AC2.
- [x] `SqliteSessionRepository.ts` -- persistance et lecture -- AC3.
- [x] Tests : `migrateDatabase.test.ts` (v10 → v11, idempotence, échec annulé), `targetSchema.test.ts` (011 gelée avec les autres si le patron l'exige), nouveau `preservation.story11.pre6.test.ts` (base v10 fichier → v11, relue par nouvelle connexion), `SqliteSessionRepository.test.ts` et `SessionDraft.test.ts` / `validation.test.ts` (matrice). Mettre à jour les seules attentes existantes contredites par `null` à la création ou à la reprise.
- [x] `src/infrastructure/database/README.md`, `AGENTS.md` -- documentation de 011.

**Acceptance Criteria:**
- Given une séance existante (v10), when l'application démarre, then elle se lit en Circuit de Tours avec durées, paramètres PRE-5 et récupérations positives identiques.
- Given la suite complète, when `npm test`, `npx tsc --noEmit`, `npm run lint`, then tout est vert (référence 3242 tests, plus les nouveaux).
- Given la migration déjà appliquée, when on la rejoue, then aucune erreur et aucun changement.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | edge | Colonne `present` déjà là sans reprise | false | Colonne et reprise sont dans la même transaction exclusive ; l'état intermédiaire ne peut pas être validé. |
| 2 | edge | `circuitBoundOf` sans contrôle 1..99 | low, rejeté | Vue dérivée ; le compte est validé à l'enregistrement (`validateTourRepeatCount`). Garde supplémentaire non justifiée. |
| 3 | edge | Suppression du repli `?? 0` à la lecture | false | Seul appelant de `toActivity` : `assembleSession`, alimenté par le SELECT qui lit les deux colonnes ; suites vertes. |
| 4 | edge + blind | Commentaire d'idempotence inexact (reprise non rejouée) | low | patch : commentaire corrigé. |
| 5 | blind | Statuts spec / sprint-status divergents | false | Transitions de workflow : `review` posé à la présentation (étape 5). |
| 6 | blind | AC non numérotés, preuve absente dans la spec | rejeté | Correctif = édition de la spec. |
| 7 | blind | Contrôle natif expo-sqlite sans la nature | medium | patch : création en `SERIES` et relecture vérifiée dans `runNativeDatabaseIntegrationCheck.ts`. |
| 8 | blind | Chemin liste sans les nouvelles colonnes | false | Les durées n'en dépendent pas (`null` et 0 équivalents) ; la nature dans les durées relève de la story 1.3. |
| 9 | blind | Reprise « 0 → absente » non sourcée | false | AD-35 (plan approuvé) ; aucune écriture d'interface autre que 0 explicite (`ActivitySelectionScreen.tsx:139`, `ExerciseScreen.tsx:541` avant la story). |
| 10 | blind | Invariant `present = 0 ⇒ 0 s` contrôlé à la lecture seulement | false | Toute écriture passe par `toActivitySqlValues`, qui dérive les deux colonnes de la même valeur. |
| 11 | blind | Types de ligne trop confiants | low, rejeté | Convention existante (`tour_side_mode: SideMode`). |
| 12 | blind | Constante `DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS` devenue morte | low, rejeté | Inoffensive, documentée. |
| 13 | blind | Lecture `RECOVERY` → `null` non testée | low, rejeté | Lignes historiques seulement, calcul identique. |
| 14 | blind | 011 non gelée dans `targetSchema` | false | Patron du dépôt : une migration est gelée à l'arrivée de la suivante (010 gelée ici). |
| 15 | blind | README sans avertissement sur reconstruction future | low, rejeté | Hors défaut constaté. |
| 16 | blind | Échec entre les deux `ALTER` non testé | low, rejeté | Même transaction que le cas testé ; annulation identique. |
| — | verification-gap | Aucun écart | — | — |

## Design Notes

`circuitNature` est porté par le brouillon et l'entrée comme `tourRepeatCount` ; la borne est dérivée, jamais stockée :

```ts
export type CircuitBound = { readonly kind: "COUNT"; readonly count: number };
export function circuitBoundCount(bound: CircuitBound): number {
  switch (bound.kind) {
    case "COUNT": return bound.count;
    default: { const unreachable: never = bound.kind; return unreachable; }
  }
}
```

## Verification

**Commands:**
- `npx jest src/domain/sessions src/infrastructure/database` -- expected: vert.
- `npm test` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert, aucun test existant supprimé.

**Manual checks (if no CLI):**
- Jalon J0 sur iPhone (Hermann) : base réelle v10 migrée en v11, séances et durées identiques.
