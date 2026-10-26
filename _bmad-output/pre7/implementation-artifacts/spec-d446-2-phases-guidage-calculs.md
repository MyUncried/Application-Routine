---
title: 'D-446 (2/3) — motif cyclique : durée nominale et guidage des phases'
type: 'feature'
created: '2026-10-26'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/planning-artifacts/arbitrage-2026-10-26-phases-motif-cyclique.md'
  - '{project-root}/src/domain/README.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** D-446 (arbitrage de Hermann du 26/10/2026, §1, §3, §4) fait des phases un motif cyclique répété pendant la série. Rien dans le code ne le calcule : les calculs ignorent les phases (D = Σ supposée), et il n'existe aucun moteur d'exécution (`src/features/execution/` ne contient qu'un README ; T04 non implémenté).

**Approach:** (a) Calculs : en mode Répétitions avec un motif complet, travail nominal d'une série = nombre cible × durée du motif (nature `estimated`, « ≈ ») ; Durée : Cible saisie, indépendante du motif ; À l'échec : inchangé (« Non calculable », D-433). (b) Module de domaine pur `phaseGuidance.ts`, destiné au futur `ExecutionService` : phase courante à un instant écoulé depuis le début du passage de travail, bouclage, cycles guidés, fin de série à la durée cible (au milieu d'une phase) ; aucune fin automatique en Répétitions ni À l'échec (« Suivant »). Aucun écran, aucun timer.

## Boundaries & Constraints

**Always:** Durée du motif = Σ des durées de phase (toutes ≥ 1 s, sinon motif inconnu). Chaque passage de travail (série, et chaque côté d'une série) commence à la première phase : l'instant 0 est le début du passage. Les cycles guidés comptent les passages complets du motif ; ils ne sont pas une mesure des répétitions réalisées. Pauses, changements de côté, Compte à rebours et Fin : règles inchangées. Commentaires français citant D-446 ; tests existants mis à jour en citant D-446, jamais supprimés.

**Never:** Pas de fin de série causée par les phases ; pas d'arrêt automatique en Répétitions à l'atteinte du nombre cible ; pas de signal ou d'annonce inventé ; pas d'UI d'exécution ; pas de modification des invariants, du Brouillon, du schéma, de `tokens.ts`, `app.json`, `package.json`, docs.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Enchaînement | motif [5,2], t = 0 / 4 / 5 / 6 | phase 0 (reste 5) / 0 (reste 1) / 1 (reste 2) / 1 (reste 1) | N/A |
| Bouclage | [5,2], t = 7 / 15 | phase 0, 1 cycle / phase 0 (écoulé 1), 2 cycles | N/A |
| Arrêt à la cible au milieu d'une phase | Durée 120 s, [5,2], t = 120 | série terminée ; 17 cycles (119 s), phase 0 interrompue après 1 s ; t = 130 → même résultat (borné à la limite) | N/A |
| Arrêt manuel à l'échec | Durée À l'échec, t = 10 000 | jamais terminée par le guidage (limite `null`) | N/A |
| Répétitions, objectif 10 | [5,2] | limite `null` (validation manuelle « Suivant ») ; nominal 70 s ; après 70 s le motif continue | N/A |
| Nouvelle série | t mesuré depuis le début du passage | t = 0 → phase 0, 0 cycle | N/A |
| Calcul Répétitions | 3 × 10 rép., [5,2], Pause 0 | `estimated`, 210 s (cadence ignorée quand le motif est complet) | N/A |
| Motif incomplet | [5, 0], Répétitions sans cadence | motif inconnu ; calcul comme sans phases | N/A |
| Temps invalide | t < 0 ou non fini | — | lève (entrée invalide) |

</frozen-after-approval>

## Code Map

- `src/domain/activities/executionCalculations.ts` -- `workSeconds` (l.111-122) : Répétitions + motif complet (séries `UNIFORM`, `workPhases` non vide, toutes ≥ 1 s) → `target.value × Σ` ; sinon règle actuelle (cadence). Durée inchangée (`target.value`). `summarizeTargets` (l.189-217) donne alors `estimated` sans changement. En-tête l.1-21 : paragraphe D-446. Exposer ou réutiliser `workPhasesCycleSeconds` depuis `phaseGuidance.ts`.
- `src/domain/activities/phaseGuidance.ts` (nouveau) -- `workPhasesCycleSeconds(phases): number | null` ; `seriesGuidanceLimitSeconds(parameters): number | null` (Durée + Cible `NUMBER` → valeur ; sinon `null`) ; `nominalGuidanceSeconds(parameters): number | null` (Répétitions `NUMBER` × motif ; Durée `NUMBER` → valeur ; sinon `null`) ; `phaseGuidanceAt(phases, elapsedSeconds, limitSeconds)` → `{ ended, phaseIndex, phaseElapsedSeconds, phaseRemainingSeconds, completedCycles }` (`ended` vrai dès `elapsed ≥ limit` ; alors `completedCycles = floor(limit / Σ)` et la phase est celle en cours à la limite). Lève si phases vides, motif incomplet, `elapsed` négatif/non fini. Domaine pur : n'importe que `./ExecutionParameters`.
- `src/features/activities/ExecutionParametersSheet.tsx` -- `totalNotCalculable` (l.718-721) : Répétitions sans cadence n'est plus « Non calculable » si le motif est complet (même prédicat `workPhasesCycleSeconds(...) !== null`). Rien d'autre.
- `src/domain/README.md`, `src/features/execution/README.md` -- une ligne : `phaseGuidance.ts` est la règle de guidage à consommer par `ExecutionService` (D-446).
- Tests : `src/domain/activities/__tests__/phaseGuidance.test.ts` (matrice + §6 : enchaînement, bouclage, arrêt à la cible en milieu de phase, arrêt manuel, cycle complet, reprise à la première phase, validation manuelle en Répétitions) ; `executionCalculations.test.ts` (Répétitions + phases : 3 × 10 × 7 s ; Durée + phases : Cible indépendante de Σ ; À l'échec + phases : `omitted`) ; `ExecutionParametersSheet*.test.tsx` (Répétitions sans cadence + phases complètes → « ≈ »). Voir `executionPhrase.ts` `totalClauseAmount` (aucun changement attendu, « ≈ »).

## Tasks & Acceptance

**Execution:**
- [ ] `src/domain/activities/phaseGuidance.ts` -- module pur -- D-446 §3, §4.
- [ ] `src/domain/activities/executionCalculations.ts` -- travail nominal Répétitions × motif -- D-446 §4.
- [ ] `src/features/activities/ExecutionParametersSheet.tsx` -- « Non calculable » réservé aux cas sans motif complet -- D-433, D-446.
- [ ] Tests et READMEs ci-dessus.

**Acceptance Criteria:**
- Given 3 séries identiques de 10 répétitions et un motif 5 s / 2 s, when on ouvre la Feuille, then « Durée de l'exercice » affiche une valeur précédée de « ≈ » (210 s plus les pauses).
- Given un Exercice Durée 2 min à phases [5,2], when on calcule la durée, then le travail par série vaut 120 s, pas 7 s.

## Design Notes

Après l'atteinte du nombre cible en Répétitions et avant « Suivant » : aucune règle propre au guidage par phases (ch08 l.694 : le bip continue « y compris après le nominal Répétitions » ; ch13 l.3182 : progression plafonnée sans fin de série). Le module ne termine rien et continue le bouclage (arbitrage §1, « recommencent tant que la série continue ») ; tout signal à l'atteinte reste à décider par Hermann. Cadence + motif complet en Répétitions : le motif prime pour la durée nominale (arbitrage §1 : un passage du motif = une répétition) — à confirmer.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

## Implementation Notes

## Spec Change Log

## Review Triage Log
