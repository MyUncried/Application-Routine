---
title: 'Story 1.3 — Développement du Circuit et durées'
type: 'feature'
created: '2026-10-20'
status: 'done'
baseline_commit: '252c959a33a57f15411271c10c59d948a186458f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les durées ne connaissent que le Circuit de Tours (zone `IN_TOUR` × N). Un Circuit de Séries (story 1.1) se développe autrement — passage i = série i de chaque exercice, dans l'ordre (ch10 L651) — et le résumé sous le titre du Circuit affiche encore « N exercice(s) · X min » et « 0 exercice · 0 min » à vide, contraires à D-390 et D-399.

**Approach:** Ajouter au domaine un développement pur de la Composition selon la nature (occurrences, récupérations positives, points d'arrêt, répétés à chaque passage dans le Circuit), faire dépendre de la nature toutes les durées (Composition, lecture complète, liste) et ramener le résumé du Circuit à sa seule durée. Le moteur d'exécution reste hors périmètre.

## Boundaries & Constraints

**Always:**
- Tours : développement et durées strictement inchangés (contenu interne × N ; R positive remplace la seule dernière Pause de l'occurrence, à chaque Tour).
- Séries : pour i = 1..N, chaque exercice du Circuit, dans l'ordre, sa série i seulement. Passage unilatéral = Ti + Pi, ou Ti + R si R > 0. Passage bilatéral = côté de départ → PC → autre côté → Pi, soit 2Ti + PC + Pi, ou 2Ti + PC + R si R > 0 ; aucun Pi avant PC ; règle appliquée aussi pour N = 1, quel que soit l'ordre des côtés réglé (réglage non réécrit). Un exercice qui a moins de N séries ne contribue que ses séries existantes.
- Éléments internes au Circuit (récupérations positives, points d'arrêt) répétés à chaque Tour ou passage ; externes une seule fois. Ordre à un emplacement : Exercice → R positive → Point d'arrêt. Un point d'arrêt ne compte aucune durée. R = 0 ou absente ne remplace rien. Aucune récupération comptée deux fois.
- Nature du total : ≥ l'emporte sur ≈, qui l'emporte sur exact (agrégation existante `aggregateSessionDuration`).
- Résumé sous le titre du Circuit : durée de ce seul Circuit (D-382), sans nombre d'exercices (D-390) ; « — min » si le Circuit est vide (D-399). Formats d'affichage de la durée existants conservés (`formatEstimatedDuration`, préfixes ≈ / ≥).
- Durée de séance hors compte à rebours initial et Fin (RM-159) ; la durée d'exécution P31 garde son ajout existant.
- Nature lue `?? "TOURS"` partout.

**Never:**
- Aucun plan d'exécution ni moteur, aucune interface nouvelle (en-tête du Circuit : story 3.1).
- Ne pas modifier les formules de l'exercice autonome ni de la Feuille.
- Ne pas changer D-391 (minutes et secondes) dans cette story.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Passage bilatéral | Séries, N = 1, Ti 30, Pi 10, PC 5 | 75 s | — |
| Avec R | idem, R 20 | 85 s | — |
| Trois passages | N = 3, séries identiques | 225 s ; 255 s avec R 20 | — |
| PC = 0 | idem, PC 0 | Pi conservée (2Ti + Pi) | — |
| R = 0 | unilatéral, R 0 | Ti + Pi par passage | — |
| Développement Séries | A, B dans le Circuit, N = 2, point après A | A1, B1… : A1, point, B1, A2, point, B2 | — |
| Développement Tours | A (R 20), B, N = 2 ; C hors Circuit | A, R, B, A, R, B, C | — |
| Nature du total | une cible À l'échec | ≥ ; une Répétitions avec bip : ≈ | — |
| Résumé | Circuit vide / non vide | « — min » / durée seule | — |
| Non-régression | séances existantes (Tours) | durées identiques à avant | — |

</frozen-after-approval>

## Code Map

- `src/domain/activities/executionCalculations.ts:128-218` -- réutiliser `workSeconds`, `seriesRowsOf`, `isBilateral`, `summarize` ; ajouter le registre « passages en Circuit de Séries » d'un exercice (`computeSeriesCircuitOccurrenceDuration(parameters, recoverySeconds, passages)`), sans toucher `buildExecutionLedger`.
- `src/domain/sessions/calculations.ts:177-245` -- `StructuredActivities` gagne `circuitNature?` ; `computeStructuredSessionDuration` : en Séries, chaque exercice `IN_TOUR` contribue son total de passages (multiplicité 1). `toStructuredActivities` lit `session.cycle.tour.nature`.
- `src/domain/sessions/circuit.ts` -- développement pur `expandComposition({ exercises, stopPoints, circuitNature, tourRepeatCount })` → étapes ordonnées (`OCCURRENCE` avec passage et série i en Séries, `RECOVERY` positive, `STOP_POINT`). Rattachement des points : `StopPoint.position` = emplacement (story 1.2).
- `src/features/sessions/compositionPresentation.ts:24-160` -- `CompositionSummaryFacts` gagne `circuitNature?` ; `formatCompositionSummary` = durée seule, via `computeStructuredSessionDuration` (zone `IN_TOUR` seule), « — min » à vide ; `fr.ts` : `summary.empty` → `— min`.
- `src/features/sessions/CompositionScreen.tsx:561` -- passer `circuitNature` du brouillon.
- `src/infrastructure/database/repositories/SqliteSessionRepository.ts:547-560,1360-1366` -- requête de liste : lire `tours.nature` ; `mapSummaryRow` passe la nature.
- Tests : `executionCalculations.test.ts` ou `calculations.test.ts` (matrice), `circuit.test.ts` (développement), `compositionPresentation.test.ts` et `CompositionScreen.test.tsx` (attentes du résumé changées seulement pour D-390 / D-399), `SqliteSessionRepository.test.ts` (liste en Séries).

## Tasks & Acceptance

**Execution:**
- [x] `executionCalculations.ts` + tests -- passages en Séries (75 / 85 / 225 / 255, PC 0, R 0).
- [x] `calculations.ts` + tests -- durée selon la nature ; Tours inchangé.
- [x] `circuit.ts` + tests -- `expandComposition` (Tours, Séries, internes répétés, externes non, ordre Exercice → R → point).
- [x] `compositionPresentation.ts`, `fr.ts`, `CompositionScreen.tsx` + tests -- résumé D-382 / D-390 / D-399.
- [x] `SqliteSessionRepository.ts` + test -- liste selon la nature.

**Acceptance Criteria:**
- Given une séance en Circuit de Séries, when elle est listée, ouverte ou composée, then les trois durées sont identiques et suivent la règle des passages.
- Given la suite complète, when `npm test`, `npx tsc --noEmit`, `npm run lint`, then tout est vert ; les attentes existantes ne changent que pour D-390 / D-399.

## Implementation Notes

- Points d'arrêt en Séries : un point rattaché à un exercice (`position = p`) n'est produit qu'au passage où cet exercice joue sa série i ; un exercice à moins de N séries n'émet donc plus ses points aux passages suivants. Lecture de « le point suit son occurrence » (ARB-3), non tranchée explicitement par la spec — à confirmer par Hermann. Un point `position = 0` interne est répété en tête de chaque Tour ou passage.
- Ancienne Récupération autonome (`type = RECOVERY`) ou Mode inconnu dans un Circuit de Séries : lecture défensive conservée, multiplicité N comme en Tours.
- Liste : nature lue par `listActive` (`tours.nature`) ; une valeur non reconnue y est lue `TOURS` (la lecture complète, elle, la rejette déjà) — impossible en pratique grâce au `CHECK` de `migration011`.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | blind + edge | Développement et durées divergent (Récupération autonome, mode inconnu, passes vides) | medium | patch : le développement suit le modèle de durée ; passe vide sautée. |
| 2 | verification-gap | Garde Séries (mode inconnu, Récupération autonome) non testée | medium | patch : tests ajoutés. |
| 3 | verification-gap + blind | Points en position 0, après le Circuit, en Tours non épinglés | low | patch : tests ajoutés (coût faible). |
| 4 | blind | Résumé Séries ≈ / ≥ non testé | low | patch : un cas ajouté. |
| 5 | blind | JSDoc, titres de tests, README périmés ; découpage des séries dupliqué | low | patch : documentation et découpage unique. |
| 6 | blind + edge | Point d'arrêt d'un exercice ayant moins de N séries : arbitrage à ouvrir | false | En Circuit de Séries, chaque exercice porte N séries (AD-37, imposé par la story 1.4) : le cas ne survient pas dans une séance libre. |
| 7 | edge | `passages <= 0` qualifié ≈ | low, rejeté | `tourRepeatCount` validé 1..99. |
| 8 | edge | Point hors bornes absent du développement | low, rejeté | Donnée invalide refusée à l'enregistrement (story 1.2). |
| 9 | edge | AC « trois durées identiques » fausse avec des exercices hors Circuit | false | Le résumé de Composition porte sur le seul Circuit (D-382) ; liste et lecture complète portent sur la séance. L'AC compare des séances au Circuit seul (tests). |
| 10 | blind | Étapes sans durée | false | Choix de conception : le développement n'est pas le plan d'exécution (AD-40). |
| 11 | blind | Littéral « — min » dans les tests, `tour_nature` en `string`, séance antérieure à 011 non relue en liste | low, rejeté | Sans défaut constaté ; la préservation v10 → v11 est couverte par `preservation.story11.pre6.test.ts`. |
| 12 | blind | Statuts divergents | false | Transitions du workflow. |

## Verification

**Commands:**
- `npx jest src/domain src/features/sessions src/infrastructure/database` -- expected: vert.
- `npm test` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
