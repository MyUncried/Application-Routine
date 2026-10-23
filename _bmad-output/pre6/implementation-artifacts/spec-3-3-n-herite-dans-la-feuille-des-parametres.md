---
title: 'Story 3.3 — N hérité dans la Feuille des paramètres'
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: '5d8411d0114da5318912950a7e13cf0a063625ee'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** En Circuit de Séries, le nombre de séries de chaque exercice est imposé par N (AD-37, ch10 L693), mais la Feuille des paramètres ouverte depuis la Composition laisse le modifier : l'option `inheritedSeriesCount` d'`openSheetDraft` existe sans jamais être transmise (E8). La réserve de Circuit d'une occurrence n'est pas non plus vidée quand ses séries changent dans la Feuille (report de la story 1.4).

**Approach:** Transmettre le contexte « N hérité » de la Composition à la Feuille (AD-44 : `ExerciseScreen` → `ActivityEditorForm` → `ExecutionParametersSheet` → `openSheetDraft(parent, { inheritedSeriesCount: true })`) et rendre indisponibles, dans ce seul contexte, les commandes qui changent le nombre de séries. Hors Circuit de Séries, rien ne change.

## Boundaries & Constraints

**Always:**
- Contexte hérité = occurrence `IN_TOUR`, de type `EXERCISE`, d'une Composition dont la nature est `SERIES` (lu sur le brouillon de séance à l'ouverture de l'éditeur de l'occurrence).
- Dans ce contexte : le nombre de séries est affiché et indisponible (état indisponible existant des commandes de la Feuille, RM-247) ; aucune commande ne change le nombre : stepper du nombre, retrait de ligne, et toute autre commande qui ajoute ou retire une ligne ; un nom accessible ou un indice l'explique (« Nombre de séries imposé par le circuit »). Le régime (identiques / variables), les cibles, pauses, charge, phases, côtés, cadence restent modifiables ; passer de identiques à variables et inversement conserve N.
- `isRequestedTotalEditable` / l'inversion de la durée totale suivent `inheritedSeriesCount` (logique existante, inchangée).
- Hors contexte (Tours, hors Circuit, Catalogue, exercice autonome) : Feuille strictement identique à PRE-5 (aucun test existant modifié).
- Sortie du Circuit (glisser hors du Circuit ou passage en Tours) : la prochaine ouverture de la Feuille rend le nombre modifiable, sans message.
- Réserve : lorsqu'une occurrence modifiée dans l'éditeur (« Terminer ») revient avec des séries différentes de celles qu'elle avait à l'ouverture, son entrée de `circuitSeriesReserve` est retirée (mise à jour fonctionnelle du brouillon).
- Textes dans `fr.ts`.

**Never:**
- Ne pas modifier le domaine `ExecutionParametersDraft` au-delà d'un garde nécessaire (une primitive qui changerait N alors que `inheritedSeriesCount` est vrai retourne le brouillon inchangé), testé.
- Ne pas modifier le comportement PRE-5 hors contexte hérité ; aucune nouvelle surface.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Séries, ouvrir la Feuille | N = 3 | nombre « 3 » indisponible ; régime modifiable | — |
| Séries, passer en variables | N = 3 | 3 lignes | — |
| Séries, retrait de ligne | variables | croix de retrait indisponible | — |
| Tours | — | Feuille inchangée | — |
| Hors Circuit | — | Feuille inchangée | — |
| Sortie du Circuit | puis ouvrir | nombre modifiable | — |
| Réserve | occurrence modifiée en Séries | entrée de réserve retirée | — |
| Inversion | Durée totale | suit `isTotalDurationInvertible(…, true)` | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/ExerciseScreen.tsx` (`CompositionExerciseEditor`, ~L520-660) -- calcul du contexte (nature du brouillon, zone et type de l'occurrence), passage à `ActivityEditorForm` ; `handleTerminer` : retrait de l'entrée de réserve.
- `src/features/activities/ActivityEditorForm.tsx:~606` -- nouvelle prop transmise à `ExecutionParametersSheet`.
- `src/features/activities/ExecutionParametersSheet.tsx:511` -- `openSheetDraft(parent)` → avec `inheritedSeriesCount` ; commandes du nombre (`setSeriesCount` ~L1260-1310) et du retrait (`removeRow` ~L774, ~L2512) à rendre indisponibles en contexte hérité.
- `src/domain/activities/ExecutionParametersDraft.ts:129, 182, 245, 398, 682` -- option existante ; gardes éventuels.
- Tests : `ExecutionParametersSheet.test.tsx`, `ExerciseScreen.test.tsx`, tests d'intégration du parcours Composition → Exercice.

## Tasks & Acceptance

**Execution:**
- [x] `ExecutionParametersSheet.tsx` + tests -- contexte hérité.
- [x] `ActivityEditorForm.tsx`, `ExerciseScreen.tsx` + tests -- transmission, réserve.
- [x] Domaine (gardes si nécessaires) + tests.
- [x] `fr.ts`.

**Acceptance Criteria:**
- Given la suite complète, when `npm test`, `npx tsc --noEmit`, `npm run lint`, then tout est vert ; aucun test PRE-5 de la Feuille modifié.

## Implementation Notes

- Domaine non gardé : un garde dans `setSeriesCount` casserait le test PRE-4 existant `PRE4-3.2/AC14` (`ExecutionParametersDraft.test.ts:1087`, `setSeriesCount` sous N hérité), que la story interdit de modifier. Le garde n'étant pas nécessaire (la Feuille rend indisponibles toutes les commandes qui changent N), il n'est pas ajouté.
- Contexte hérité limité aux occurrences EXISTANTES du brouillon : une nouvelle occurrence est adaptée à N à `Terminer` (story 2.3, dont les tests règlent N dans la Feuille).
- Réserve : « séries différentes » = `executionParametersEqual` sur le seul champ `series` (Régime, nombre, Cibles, Pauses, charges, phases), comparé aux paramètres figés à l'ouverture (forme lue et forme produite par le ✓, `validateForSave`). Retrait dans UNE mise à jour fonctionnelle `{ exercises, circuitSeriesReserve }`, seulement si l'occurrence a une entrée de réserve.
- Contexte figé dès que l'occurrence existante est résolue sur le brouillon (montage ou hydratation tardive), puis pour la vie de l'éditeur.
- Nom accessible du nombre indisponible : suffixe dédié « imposé par le circuit » (`inheritedSeriesCountSuffix`), et non `disabledSuffix` (« sans effet pour une seule série »), faux à N > 1. Textes sous `executionParameters.circuit` (`index.ts`) : pas sous `executionParameters.sheet`, dont le lexique est vérifié sans « Circuit » par le test PRE-4 `PRE4-3.8/AC4` (`FORBIDDEN`), non modifiable.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | edge | En N hérité, retoucher l'option « Type de série » ouvre la surface cachée du stepper | medium | patch. |
| 2 | edge + blind + verification-gap | Réserve comparée au brouillon courant et non aux séries d'ouverture ; normalisation au ✓ ; deux mises à jour ; tests manquants | medium | patch : référence d'ouverture normalisée, mise à jour unique, tests. |
| 3 | edge | Contexte hérité figé avant l'hydratation de l'occurrence | medium | patch. |
| 4 | blind | Champ indisponible sans suffixe « indisponible » | low | patch. |
| 5 | blind | Clé de lexique rangée sous la Composition | low | patch : `executionParameters.sheet`. |
| 6 | blind | Occurrence non `EXERCISE` non testée | low | patch. |
| 7 | blind | Garde du domaine non ajouté (« Never » de la spec) | — | Décision : `PRE4-3.2/AC14` appelle volontairement `setSeriesCount` en N hérité ; la Feuille bloque toutes les commandes. Garde « éventuel » selon la spec. |
| 8 | blind | Nombre verrouillé non comparé à N | low, rejeté | Les opérations de Circuit (1.4, 2.3, 3.1, 3.2) maintiennent `count = N` ; aucune donnée antérieure en Séries. |
| 9 | blind | N = 1 : régime verrouillé par P16 | false | Règle PRE-5 existante (une seule série = identiques), inchangée. |
| 10 | blind | Statuts, test « sortie du Circuit » sans sortie réelle, intégration absente | low, rejeté | Transitions du workflow ; l'ouverture lit la position courante, couverte par le cas hors Circuit. |

## Verification

**Commands:**
- `npx jest src/features/activities src/features/sessions src/domain/activities` -- expected: vert.
- `npm test` (au besoin `--maxWorkers=2`) ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
