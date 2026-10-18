---
title: 'Story 2.2 — Format des durées et agrégation de Séance'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: 'bdf0f47ebcd25ffa6b9cf6c066a81821cb4c74f9'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-2.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-1-nature-et-montant-de-la-duree-totale-d-un-exercice.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Trois formateurs de durée coexistent. Les symboles `≈` et `≥` sont codés en dur dans les cartes de Séance. La Durée estimée d'exécution d'une Séance, qui comprend le Compte à rebours initial et la Fin de séance (P31), n'existe pas dans le domaine. L'agrégation de Séance est déjà juste depuis la story 2.1, mais ses attendus normatifs ne sont pas prouvés.

**Approach:** Implémenter la **story 2.2 (AC1 à AC6, `epics-parts/epic-2.md`)** en se limitant à l'écart restant (bilan approuvé du 2026-10-17) :
- **déplacer** `formatPhraseDuration` vers `src/domain/activities/durationFormat.ts`, sans le réécrire, et y faire converger `formatCompactDuration` ;
- faire passer par le lexique les symboles des formateurs de `src/features/` ;
- ajouter au domaine la Durée estimée d'exécution de la Séance (P31) ;
- prouver l'agrégation existante par des tests nommés `PRE4-2.2/ACn`.

## Boundaries & Constraints

**Always:**
- Réutiliser sans réécriture : `buildExecutionLedger`, `computeOccurrenceDuration` (la substitution de PN par R précède déjà la qualification), `aggregateSessionDuration`, `computeStructuredSessionDuration` et `computeZoneDurationFacts`. Ne les modifier que si un attendu de la story les met en défaut ; dans ce cas, consigner la correction.
- `durationFormat.ts` est pur et ne dépend de rien hors du domaine. Il est importé par la Phrase, la Feuille, la carte Catalogue (par `totalClauseAmount`) et par `formatCompactDuration`. Aucun autre module ne formate une durée d'Exercice en minutes et secondes. Les sorties de `formatCompactDuration` restent identiques ; les tests de Composition existants restent verts.
- `formatEstimatedDuration` garde son comportement : arrondi à la minute supérieure, unité du lexique, toutes natures (P41). Seuls ses préfixes `≈ `/`≥ ` viennent désormais de clés de lexique uniques (NFR-08, AD-11). La Phrase et les formateurs du domaine sont exemptés du lexique (AD-11) : leurs symboles restent dans le domaine.
- P31 : une fonction du domaine distincte donne la Durée estimée d'exécution de la Séance. Elle vaut le total d'occurrence de la Séance (avec la Récupération et les répétitions du Circuit), plus `initialCountdownSeconds` et `finalPhaseSeconds`, avec la nature agrégée. Les mesures intrinsèque et d'occurrence restent distinctes et excluent ces deux phases. Le Compte à rebours et la Fin propres d'un Exercice ne sont jamais comptés dans la Séance.
- Les attendus sont des constantes ou des formules écrites dans le test (AD-10).

**Never:**
- Aucun changement de rendu des cartes Catalogue et Composition (2.4), ni de la Phrase (2.3). Aucune refonte de Composition. Aucun affichage nouveau de la Durée estimée d'exécution : la fonction P31 est du domaine seul, sans consommateur d'interface.
- Ne pas modifier `formatDurationRowValue` (roulettes du Compte à rebours initial et de la Fin de séance : ce ne sont pas des durées d'Exercice).
- Aucun jeton modifié.

</frozen-after-approval>

## Code Map

- `src/domain/activities/executionPhrase.ts:33-41` -- `formatPhraseDuration`, à **déplacer** vers `durationFormat.ts`. Mettre à jour ses imports : `executionPhrase.ts` (appels l.130-222), `ExecutionParametersSheet.tsx:56`. Ne pas laisser de réexport durable sans nécessité ; adapter les imports des tests.
- `src/features/sessions/compositionPresentation.ts:182-205` -- `formatCompactDuration`, à faire converger sur le formateur du domaine. Mêmes sorties « 45 s », « 1 min », « 1 min 30 s ». Vérifier que les unités du lexique `exerciseRow.durationUnitSeconds/Minutes` valent « s » et « min » ; sinon, consigner l'écart et garder le lexique. Appelants : l.258, 277, 287, 357. Les tests sont dans `compositionPresentation.test.ts`.
- `src/features/sessions/formatSessionSummary.ts:59-69` -- `formatEstimatedDuration` : remplacer les préfixes en dur par des clés de `src/shared/i18n/resources/fr.ts` (avec le typage de `src/shared/i18n/index.ts`). Les tests de lexique sont dans `src/shared/i18n/index.test.ts`.
- `src/domain/sessions/calculations.ts:184-213` -- `computeStructuredSessionDuration` et `toSessionDurationResult` : la fonction P31 s'ajoute à côté, en s'appuyant sur eux. Les champs de Séance `initialCountdownSeconds` et `finalPhaseSeconds` sont dans `Session.ts:347-348`.
- `src/domain/activities/executionCalculations.ts:208-217, 335-357` -- `computeOccurrenceDuration` et `aggregateSessionDuration`, à couvrir par les tests (AC2 à AC4).
- Tests à étendre :
  - `src/domain/activities/__tests__/executionCalculations.test.ts` ;
  - `src/domain/sessions/__tests__/calculations.test.ts` ;
  - nouveau `src/domain/activities/__tests__/durationFormat.test.ts` ;
  - `src/features/sessions/__tests__/formatSessionSummary.test.ts` et `SessionCard.test.tsx` (AC6, forme inchangée).

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/activities/durationFormat.ts` -- nouveau, par déplacement -- AC1.
- [x] `executionPhrase.ts`, `ExecutionParametersSheet.tsx`, `compositionPresentation.ts` -- importer le formateur unique -- AC1.
- [x] `formatSessionSummary.ts` et lexique -- préfixes ≈/≥ par clés -- AC6.
- [x] `src/domain/sessions/calculations.ts` -- Durée estimée d'exécution de la Séance (P31) -- AC5.
- [x] Tests `PRE4-2.2/AC1` à `AC6` -- toutes les valeurs de l'AC1 ; attendus 135 s, 60 s, 30 s, 90/120 s, 105/135 s, 270 s, 269 s, 195 s, 210 s et 150 s ; forme de la carte de Séance inchangée pour chaque nature.

**Acceptance Criteria:**
- Given la story 2.2 de `epics-parts/epic-2.md`, when elle est livrée, then chacun de ses critères AC1 à AC6 est vérifié par un test nommé `PRE4-2.2/ACn`, et `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts, sans aucun test existant affaibli.

## Design Notes

H8 (minutes sans heures) est appliquée comme écrite, au titre de la validation globale du plan. La recette R-2.2-01 entre dans l'ensemble « durées et phrases ». Aucune validation sur appareil n'est déclarée.

## Implementation Notes

- `formatPhraseDuration` est déplacée octet pour octet dans `src/domain/activities/durationFormat.ts` (aucun import) ; aucun réexport depuis `executionPhrase.ts`. Importateurs : `executionPhrase.ts`, `ExecutionParametersSheet.tsx`, `compositionPresentation.ts` et, après revue, `ActivityEditorForm.tsx` (Compte à rebours et Fin d'exercice de la carte : 60 → « 1 min »). Un test (`durationFormat.test.ts`) fige la définition unique et l'absence de ré-export, sans liste d'importateurs.
- `formatCompactDuration` délègue au formateur du domaine. Les unités du lexique `exerciseRow.durationUnitSeconds/Minutes` valent bien « s » et « min » : aucun écart, sorties identiques (tests de Composition verts). Ces clés, devenues sans lecteur, sont supprimées après revue (lexique et assertion de `index.test.ts`). L'égalité des préfixes de `totalClauseAmount` (domaine) et de `strings.shared.durationNature` est vérifiée par un test du lexique, sans import du lexique dans le domaine.
- Lexique : nouvelles clés uniques `strings.shared.durationNature.estimatedPrefix` (`"≈ "`) et `lowerBoundPrefix` (`"≥ "`), consommées par `formatEstimatedDuration` ; arrondi, unité et forme inchangés. Placées sous `shared` pour être reprises par la story 2.4 sans toucher au `toEqual` de `sessions.card`.
- P31 : `computeSessionExecutionDuration(structure, { initialCountdownSeconds, finalPhaseSeconds })` et `toSessionExecutionDurationResult(session)` dans `calculations.ts`, au-dessus de `computeStructuredSessionDuration` (nature de l'agrégat, phases ajoutées au montant). Aucun consommateur d'interface. `toSessionDurationResult` passe par un petit assistant `toStructuredActivities`, sans changement de comportement.
- `buildExecutionLedger`, `computeOccurrenceDuration`, `aggregateSessionDuration`, `computeStructuredSessionDuration` et `computeZoneDurationFacts` : aucun attendu ne les a mis en défaut ; non modifiés.
- Non modifiés : `formatDurationRowValue`, les jetons, `SessionCard.tsx`, `CompositionScreen.tsx`, la Phrase. Aucun test existant modifié ni affaibli.
- Hors du formateur, `ExecutionParametersSheet.tsx:271` garde un littéral `"0 s"` pour une Pause nulle (même sortie que `formatPhraseDuration(0)`) ; laissé tel quel, hors périmètre de la story.

## Spec Change Log

## Review Triage Log

Revue du 2026-10-17 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V). V : aucune lacune de vérification ; une remarque sur des clés mortes (voir B4).

| Constat | Verdict | Preuve | Route |
|---|---|---|---|
| B1 — l'AC6 interdit de modifier `formatEstimatedDuration`, que le diff modifie | false | Sortie identique (arrondi, unité, symbole) ; la même AC6 exige les symboles du lexique (NFR-08) | rejeté |
| B2 — Compte à rebours et Fin de l'Exercice formatés `${n} s` dans l'Éditeur | medium | `ActivityEditorForm.tsx:347,353` : 60 s s'affiche « 60 s » alors que l'AC1 exige « 1 min » | patch |
| B3 — ≈/≥ dans le domaine et dans le lexique, sans lien | low | `totalClauseAmount` contre `shared.durationNature` | patch (test d'égalité) |
| B4/E6/V — clés `durationUnitSeconds/Minutes` mortes | low | Aucun lecteur en production | patch (suppression) |
| B5/E1 — entrées négatives, fractionnaires ou NaN du formateur | low | Les entrées sont des entiers positifs validés en amont (`validateForSave`) | rejeté (faible ; garde superflue) |
| B6/E3/E4 — garde du formateur unique fragile (importateurs en dur, mentions en commentaire) | low | La story 2.4 casserait la liste | patch (garde réduite à la définition unique) |
| E5 — retrait des commentaires par regex dans un test de source | low | Cas de chaîne contenant `//` improbable | rejeté |
| B7 — AC6 sans test de bout en bout ; `≥ 0 min` si tout est omis sans Pause | low | Comportement PRE-3 préexistant (omis sans contribution) ; projection de liste déjà couverte par les tests du repository | rejeté (préexistant, recette R-2.2-01) |
| B8 — test de carte avec des drapeaux concordants | low | `SessionCard.tsx:108` donne la priorité à `durationKind`, mais aucun test ne le prouve | patch (test) |
| B9 — « retirer la Récupération » non testé par un parcours d'édition | low | Fonction pure : R = 0 est l'état retiré | rejeté |
| B10 — P31 : pas de `lowerBound` sur une Séance persistée ; répétition de Cycle ; gardes négatives | low | Le cas `lowerBound` persisté manque ; la répétition de Cycle est hors de cette story (agrégation existante) ; les phases sont validées en amont | patch (test `lowerBound`) ; rejeté pour le reste |
| B11 — clause des 520 durées du Corpus non vérifiée | false | L'AC1 la renvoie au test du corpus (2.3) ; le test du corpus 276 existant passe sur le formateur déplacé | rejeté |
| E2 — phases négatives dans P31 | low | Validées en amont (`validation.ts`) | rejeté |
| E7 — parité de `formatCompactDuration` pour des entrées négatives | false | Aucune durée négative n'atteint ce formateur | rejeté |

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
- `git diff --stat` -- expected: aucun fichier réécrit en entier ; fins de ligne d'origine conservées
