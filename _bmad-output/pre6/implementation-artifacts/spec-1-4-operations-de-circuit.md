---
title: 'Story 1.4 — Opérations de Circuit : compte, réserve, conversion, entrée et sortie'
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: 'cbf20ea4da810eaccd86b527efc854372bda417f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le domaine ne sait pas encore faire vivre un Circuit de Séries : changer de nature, changer N, faire entrer ou sortir un exercice, ni lire ses volumes. Les écrans des epics 2 et 3 attendent ces opérations pures.

**Approach:** Compléter `src/domain/sessions/circuit.ts` avec les opérations de l'API Circuits (AD-39), toutes pures sur le `SessionDraft`, et une réserve de lignes au niveau du brouillon (AD-38). La règle « le tableau suit N » est partagée avec la Feuille par une primitive extraite à comportement identique, sans duplication. Aucune interface.

## Boundaries & Constraints

**Always:**
- Seules les occurrences `IN_TOUR` de type `EXERCISE` sont adaptées. Le régime (identiques / variables) et tous les autres paramètres de chaque exercice sont inchangés ; l'exercice du Catalogue n'est jamais touché.
- Adaptation d'un exercice à N : identiques → `count = N` ; variables → lignes ramenées à N. Extension par copie de la dernière ligne active (Cible, Pause, charge ; objets non partagés).
- `prepareNatureChange(draft, nature)` → `{ losses }` calculé sur l'état courant, sans mutation : Tours → Séries perd les séries au-delà de N (par exercice : identifiant et nombre de séries perdues). Même nature ou Séries → Tours : aucune perte.
- `applyNatureChange(draft, nature)` : Tours → Séries adapte chaque exercice à N, troncature définitive (rien en réserve) ; Séries → Tours change la seule nature, comptes et valeurs conservés. Même nature : brouillon inchangé (même référence).
- `setCircuitCount(draft, n)` (n borné 1..99) : Tours → seul `tourRepeatCount` change. Séries → diminution : lignes retirées placées en réserve, sans message ; augmentation : restauration d'abord depuis la réserve, puis copie de la dernière ligne active. Identiques : seul `count` suit N.
- Réserve : `SessionDraft.circuitSeriesReserve?: Readonly<Record<occurrenceId, readonly SeriesRow[]>>`, jamais persistée, ignorée par `toCreate/UpdateSessionInput`, les durées, les volumes et `sessionDraftsEqual` ; absente d'un brouillon relu (purge par construction à l'enregistrement).
- `prepareEnterCircuit(draft, exercise)` → `{ losses }` et `enterCircuit(draft, exercise)` → exercice adapté à N si le Circuit est en Séries (troncature définitive après confirmation par l'appelant), inchangé en Tours. `exitCircuit(exercise)` : nombre et paramètres conservés ; la réserve de cette occurrence est retirée.
- `circuitVolumes(draft)` : colonnes S1..Smax (Smax = plus grand nombre de séries actives des exercices du Circuit) ; une ligne par exercice `IN_TOUR` dans l'ordre : identifiant, nom, mode, `sideMode`, cellules = Cible de la série i ou `null` si la série n'existe pas. Réserve exclue. Même résultat dans les deux natures.
- Pas de duplication avec la Feuille : la règle « réduire → réserve ; augmenter → restaurer puis copier la dernière » est une seule fonction pure (dans `ExecutionParameters.ts`), utilisée par `circuit.ts` et par `setSeriesCount` de `ExecutionParametersDraft.ts`, dont le comportement et les tests restent identiques.

**Never:**
- Aucune interface, aucun message, aucune confirmation (stories 3.1 à 3.4 et 2.3).
- Ne pas modifier `ExecutionParameters` v3, la persistance ou les migrations.
- Ne pas modifier les variantes de `CircuitBound`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tours → Séries sans perte | N = 4 ; A identiques 3 séries, B variables 2 lignes | A count 4 ; B 4 lignes (2 dernières = copie de la 2e) ; `losses` vide | — |
| Tours → Séries avec perte | N = 2 ; A variables 3 lignes | `losses` = [A, 1] avant mutation ; après application : 2 lignes, réserve vide | — |
| Séries → Tours | Séries N = 3 | nature Tours ; comptes et valeurs identiques | — |
| 4 → 3 → 4 | Séries, B variables 4 lignes distinctes | à 3 : 3 lignes, réserve [ligne 4] ; à 4 : ligne 4 d'origine restaurée, réserve vide | — |
| Enregistrement à 3 puis augmentation | brouillon relu à 3 | à 4 : copie de la 3e ligne | — |
| Entrée avec perte | Séries N = 2 ; exercice 3 séries | `losses` = 1 ; `enterCircuit` → 2 séries | — |
| Sortie | exercice du Circuit de Séries | paramètres inchangés, réserve de l'occurrence retirée | — |
| Volumes | A 3 séries, B 2 séries | 3 colonnes ; B : 3e cellule `null` | — |
| Feuille | tests existants de `setSeriesCount` | inchangés et verts | — |

</frozen-after-approval>

## Code Map

- `src/domain/activities/ExecutionParametersDraft.ts:398-440` -- `setSeriesCount` : remplacer sa boucle « réduire / restaurer / cloner » par la primitive pure partagée, appliquée aux couples (ligne, identité) ; la gestion des identités et des mémoires (`cloneIdentity`, `rememberCurrentTargets`) reste ici. Tests existants : `src/domain/activities/__tests__/ExecutionParametersDraft*.test.ts`.
- `src/domain/activities/ExecutionParameters.ts:259-275` -- à côté de `seriesCountOf` / `seriesRowsOf` : primitive générique `resizeWithReserve(active, reserve, count, copyLast)` → `{ active, reserve }`, et adaptateur sur `ExecutionSeries` (identiques : `count` ; variables : lignes + réserve).
- `src/domain/sessions/circuit.ts` -- opérations AD-39 (`prepareNatureChange`, `applyNatureChange`, `setCircuitCount`, `prepareEnterCircuit`, `enterCircuit`, `exitCircuit`, `circuitVolumes`) ; types `CircuitLoss`, `CircuitVolumes`.
- `src/domain/sessions/SessionDraft.ts` -- champ `circuitSeriesReserve?` ; non transmis, non comparé.
- `src/domain/sessions/defaults.ts` / `ExecutionParameters.ts` (`EXECUTION_BOUNDS.seriesCount`) -- bornes 1..99 réutilisées.
- Tests : `src/domain/sessions/__tests__/circuit.test.ts` (toute la matrice), tests existants de la Feuille inchangés.

## Tasks & Acceptance

**Execution:**
- [x] `ExecutionParameters.ts` + tests -- primitive pure partagée.
- [x] `ExecutionParametersDraft.ts` -- `setSeriesCount` délègue ; tests existants inchangés et verts.
- [x] `SessionDraft.ts` -- réserve, hors entrée et hors égalité.
- [x] `circuit.ts` + `circuit.test.ts` -- opérations et volumes, matrice complète.

**Acceptance Criteria:**
- Given la suite complète, when `npm test`, `npx tsc --noEmit`, `npm run lint`, then tout est vert ; aucun test existant de la Feuille modifié.
- Given une opération de Circuit, when elle s'applique, then le brouillon d'entrée n'est jamais muté (immutabilité vérifiée par test).

## Implementation Notes

- Implémenté par sous-agent (21/10). Primitive partagée `resizeWithReserve` + `clampSeriesCount` (`ExecutionParameters.ts`), utilisées par `setSeriesCount` (Feuille, tests existants inchangés) et par `circuit.ts`.
- Écarts assumés : `exitCircuit(draft, exercise)` (la réserve vit sur le brouillon) ; `enterCircuit` adapte l'exercice sans changer sa position structurelle (le déplacement reste aux opérations de Composition) ; réserve vidée par `circuitSeriesReserve: undefined` explicite (le fournisseur fusionne les patchs).
- Reports : `deferred-work.md` (raccordements 3.1 et 3.3).
- Vérification : Jest 128 suites / 3390 tests, `tsc` et `lint` sans erreur.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | verification-gap | Réserve vidée par omission de la clé : le fournisseur fusionne le patch et la garde | medium | patch : clé présente à `undefined`. |
| 2 | edge + blind | Même N comparé au champ brut ; requête `NaN` | low | patch : compte effectif, requête non finie ignorée. |
| 3 | blind | Bornage dupliqué avec la Feuille | low | patch : une seule fonction exportée. |
| 4 | edge + blind | Réserve périmée (occurrence supprimée, sortie, passage à identiques) | medium | patch : réserve élaguée avant redimensionnement, tests. |
| 5 | edge + blind | Réserve conservée en Tours | low, rejeté | Invisible en Tours et jetée par la conversion suivante (conforme à la spec). |
| 6 | edge + blind | Feuille et réserve du Circuit non coordonnées | defer | Raccordement de la Feuille en story 3.3. |
| 7 | verification-gap | Changement de N à l'écran sans `setCircuitCount` | defer | Raccordement de l'écran en story 3.1. |
| 8 | edge + blind | Tableaux parallèles désynchronisés dans `setSeriesCount` | low, rejeté | Invariant maintenu par toutes les opérations de la Feuille ; tests existants verts. |
| 9 | blind | Contrat du rappel `copyLast` non documenté | low | patch : JSDoc. |
| 10 | blind | Test « même résultat dans les deux natures » trivial | low | patch : test réel (Smax > N). |
| 11 | verification-gap + blind | `RECOVERY` entrant non testé | low | patch : test. |
| 12 | blind | Troncature d'identiques comptée comme perte : arbitrage | false | « Confirmation si au moins un exercice perd des séries » (ch10 L653) : une série identique retirée est une série perdue. |
| 13 | blind | N inchangé sans réalignement | low, rejeté | Invariant AD-37 tenu par les opérations ; aucune voie ne le rompt en Séries. |
| 14 | blind | Signature `exitCircuit(draft, exercise)` différente de la spec | rejeté | Correctif = édition de la spec ; la réserve vit sur le brouillon. |
| 15 | blind | Immutabilité partiellement vérifiée | low, rejeté | `deepFreeze` sur chaque opération ; chemins restants identiques. |

## Verification

**Commands:**
- `npx jest src/domain` -- expected: vert.
- `npm test` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
