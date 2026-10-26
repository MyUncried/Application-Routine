---
title: 'R-2 — Phases : motif commun aux séries identiques et variables, calculs et guidage'
type: 'feature'
created: '2026-10-26'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/planning-artifacts/arbitrage-2026-10-26-phases-motif-cyclique.md'
  - '{project-root}/_bmad-output/pre7/planning-artifacts/arbitrage-2026-10-26-reprise-q1-q11.md'
  - '{project-root}/_bmad-output/pre7/planning-artifacts/sprint-change-proposal-2026-10-26.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** D-446 (`decda295`) refuse encore les phases avec des séries variables. Le complément de Hermann du 26/10 lève cette exclusion : une seule séquence de phases, commune à toutes les séries. Les calculs ignorent encore le motif, et aucune règle pure de guidage n'existe.

**Approach:** Les phases deviennent une propriété de l'ensemble des séries, uniformes ou variables (`series.workPhases` sur les deux régimes). Les formats persistés passent en version 5, la migration 013 de R-3 réinitialisant les données. On ajoute le calcul R × motif et un module pur `phaseGuidance.ts`. Q5 : l'activation crée deux phases aux durées vides.

## Boundaries & Constraints

**Always:**
- Une seule liste de phases et de durées par exercice.
- Identiques ↔ Variables conserve phases et durées ; les autres paramètres suivent les règles existantes.
- Les durées de phase ne sont jamais recalculées depuis les cibles, et aucune cible n'est remplacée par leur somme.
- Formes v5 strictes : Catalogue (`phaseDurations` dans les deux régimes), et résolue (`workPhases` dans les deux régimes).
- `readExecutionParameters` lit v2, v3 (anciennes formes : `[]` dans le régime variable) et v5.
- Commentaires en français citant D-446 ; les tests de l'ancienne exclusion deviennent des tests de compatibilité.

**Never:**
- Aucune durée de phase propre à une série.
- Aucune fin automatique du fait des phases.
- Aucun signal à l'atteinte de la cible (Q4 : le motif continue de boucler).
- Aucune UI d'exécution ni aucun timer (Q11).
- Aucune modification de `migration001`–`012`, `tokens.ts`, `app.json` ou `package.json`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Variables Durée | [5,2], séries 30 s / 45 s / échec | valide ; phrase et Feuille montrent les phases ; total omis (échec) | N/A |
| Variables Répétitions | [5,2], 10 / 12 / échec | valide ; travail nominal des lignes chiffrées 70 s, 84 s | N/A |
| Passage aux Variables | Identiques N=3 + phases | Variables autorisé ; phases et durées conservées ; retour aux Identiques idem | N/A |
| Variables N=1 | variable demandé, N=1 | uniforme effectif, phases conservées | N/A |
| Activation | Durée 30 s, sans phase | deux phases, durées `null` (Q5), Cible 30 s inchangée | N/A |
| Répétitions | 3 × 10, [5,2], sans cadence | `estimated` 210 s (+ pauses), « ≈ » ; plus « Non calculable » | N/A |
| Motif incomplet | [5, null] | calcul sans phases (règle actuelle) | N/A |
| Guidage | [5,2] ; t = 0/4/5/7/15 | phase 0 / 0 / 1 / 0 (1 cycle) / 0 (2 cycles) | N/A |
| Arrêt à la cible | Durée 120 s, t ≥ 120 | `ended` ; 17 cycles ; phase 0 interrompue | N/A |
| Échec ou Répétitions | t quelconque | jamais `ended` (limite `null`) | N/A |
| Temps invalide | t < 0 ou non fini | — | lève |

</frozen-after-approval>

## Code Map

- `src/domain/activities/ExecutionParameters.ts` :
  - `VariableSeries.workPhases` ; contrôle des phases de `validateForSave` commun aux deux régimes ; `normalizeEffective` et `resizeSeriesWithReserve` conservent les phases ;
  - versions : `EXECUTION_PARAMETERS_VERSION` 5 ; `EXECUTION_PARAMETERS_V3` pour le lecteur hérité ; Catalogue et résolue en 5 ;
  - Catalogue : `CatalogVariableSeries.phaseDurations`.
- `src/domain/activities/ExecutionParametersDraft.ts` :
  - `openSheetDraft` lit les phases des deux régimes ; `requestedParameters` les écrit dans les deux ;
  - `setVariable(true)` est permis avec des phases ; `canEnableWorkPhases` = Mode renseigné ;
  - `setWorkPhasesEnabled` crée deux durées `null`.
- `src/domain/activities/Movement.ts` : `splitResolvedParameters`, `resolveCatalogParameters`, `allocatePhaseIdentities` et `repriseExecutionParameters` traitent les deux régimes.
- `src/domain/activities/sharedCorrection.ts`, `composition.ts:285`, `exerciseSnapshot.ts:101`, `executionPhrase.ts:104` : lisent `series.workPhases` dans les deux régimes.
- `src/domain/activities/executionCalculations.ts` : `workSeconds` en Répétitions avec un motif complet vaut cible × Σ par ligne.
- `src/domain/activities/phaseGuidance.ts` (nouveau) : `workPhasesCycleSeconds`, `seriesGuidanceLimitSeconds`, `nominalGuidanceSeconds`, `phaseGuidanceAt`.
- `src/features/activities/ExecutionParametersSheet.tsx` : la commande Variables est active avec des phases ; `totalNotCalculable` tient compte du motif.
- Lecteurs et écrivains des repositories : passent en v5 avec le domaine (signatures inchangées).
- Fixtures : `testing/executionParametersFixtures.ts`.
- Tests : les littéraux de séries variables reçoivent `workPhases: []`.

## Tasks & Acceptance

**Execution:**
- [ ] `ExecutionParameters.ts`, `ExecutionParametersDraft.ts`, `Movement.ts` -- modèle commun et v5 -- complément D-446.
- [ ] Consommateurs du domaine et Feuille -- lecture commune des phases.
- [ ] `executionCalculations.ts` et `phaseGuidance.ts` -- calculs et guidage -- D-446 §3-4, Q4, Q11.
- [ ] Tests : matrice ci-dessus ; anciens tests d'exclusion convertis ; aller-retour v5.

**Acceptance Criteria:**
- Given un exercice à phases [5,2] en séries identiques N=3, when on touche Variables, then les séries deviennent variables et les phases restent affichées, durées comprises.
- Given des séries variables à phases, when on enregistre au Catalogue puis on relit, then les phases et les cibles sont restituées à l'identique.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

## Implementation Notes

- Placement : `workPhases` sur les deux régimes de `ExecutionSeries` (et `phaseDurations` sur les deux régimes Catalogue), plutôt qu'à la racine : même garantie d'une seule séquence par exercice, et beaucoup moins de code modifié.
- Ordre de livraison : les lecteurs n'acceptent plus la v4 ; aucune installation sur appareil entre R-2 et la migration 013 de R-3 (jalon JP fusionné dans JA1-bis).
- Tests (agent) : 4341 → 4368, puis ajouts de revue.

## Spec Change Log

## Review Triage Log

| Constat | Verdict | Suite |
|---|---|---|
| Résolution Catalogue : variable avec ligne UNSET devenue INCOMPLETE (Movement.ts) | medium — contredit PRE-4 AC8 et `isIncompleteSibling` | patch : règle variable rétablie (seule une durée de phase manquante rend incomplet) |
| v4 illisible sans migration 013 | medium — réel si installé seul | ordre : 013 livrée avant toute installation (R-3), noté ci-dessus |
| Code mort INELIGIBLE / INELIGIBLE_SIBLINGS (sharedCorrection.ts, ActivityDefinitionService.ts) | low — branches inatteignables | defer vers R-4, qui réécrit la condition de correction |
| Commentaires v3/v4 obsolètes, JSDoc du lecteur Catalogue déplacée, « Cible objet » | low — documentation fausse | patch |
| Commentaires de la Feuille et du README contraires (Variables indisponible) | low | patch |
| `setWorkPhasesEnabled` ne passe plus par l'uniforme effectif à N = 1 | low — écart AD-20 | patch |
| « Non calculable » affiché pour un motif incomplet en Répétitions | low — D-433 : donnée manquante = « — » | patch |
| Règle R × motif dupliquée (workSeconds / nominalGuidanceSeconds) | low — divergence possible | patch : workSeconds délègue |
| `phaseGuidanceAt` : arrondi flottant hors bornes | low — t non entier proche d'une frontière | patch : bornes |
| Durée de phase non entière acceptée puis cycle nul | false — `workPhasesProblem` exige un entier | rejet |
| Version 5 commune aux formes canonique et résolue | false — même strictesse qu'avant (v3 refusait déjà une durée manquante) | rejet |
| `stopConditionOf` construit `workPhases: []` | false — prédicats appelés ne lisent pas les phases | rejet |
| Tests manquants : égalité variable, phrase variable, frère incomplet variable, « ≈ » dans la Feuille, v3 variable, N = 1 | medium — régressions non détectées | patch (tests ajoutés) |
| Copie en attente variable (`settlePendingLocalCopies`) non testée | false — fonction retirée par R-3 | rejet |
| Rendu Feuille phases + tableau variable | maybe-false — visuel | recette JA1-bis sur appareil |
