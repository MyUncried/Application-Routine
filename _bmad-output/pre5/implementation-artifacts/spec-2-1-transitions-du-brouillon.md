---
title: 'Story 2.1 — Transitions du Brouillon : phases, charge, Condition d''arrêt et côtés'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: '03f9df048cc16eac4f64d65788f1bedde804285a'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre5/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre5/planning-artifacts/architecture/architecture-kodjo-pre5-2026-10-19/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le Brouillon de la Feuille transporte phases et charge (story 1.1) mais n'offre aucune transition pour les créer, les modifier ou les normaliser, ni pour choisir la Condition d'arrêt avec mémoire « À la cible » ; les transitions existantes acceptent encore, avec des phases, des états non enregistrables (Répétitions, À l'échec, Variables, Cible commune).

**Approach:** Story 2.1 de `epics.md` (AC1 à AC9, qui font foi dans le détail), domaine seul, sans interface : transitions pures dans `ExecutionParametersDraft.ts` (AD-20, AD-19, AD-23, AD-25, AD-21), fonction unique `sheetDraftResult(draft, defaultLabel)` (normalisation des phases, de la charge, puis `validateForSave`) servant le ✓ et `commitSheetDraft`. Arbitrage de Hermann du 19/10 : Avec → Sans = la somme devient la durée unique de série, modifiable, sans mémoire ; réactivation = deux phases (la première à la durée courante, sinon à renseigner ; la seconde à renseigner) ; ✕ restaure ; stepper 2..6.

## Boundaries & Constraints

**Always:** domaine pur sans i18n (`defaultLabel` fourni par l'appelant) ; toute transition nouvelle remet `pendingRemoval` à `null` sauf le retrait qu'elle crée ; `deriveSeriesDuration` seul écrivain de D, appelé seulement quand ≥ 2 phases restent ; charge via `exerciseLoad.ts` uniquement ; `normalizeLoad` jamais dans `setLoadValue` ; comportements PRE-3/PRE-4 inchangés (tests existants verts sans affaiblissement, seule la forme de `pendingRemoval` gagne `kind: "series"`) ; tests `@jest/globals`, commentaires en français citant FR, Δ, D, AD ; fins de ligne CRLF des fichiers touchés.

**Never:** aucune modification de `src/features/`, `app/`, `src/shared/`, `executionCalculations.ts`, `exerciseLoad.ts` (sauf besoin prouvé), migrations, jetons ; aucun calcul de la dernière phase sur le restant ; aucune mémoire des anciennes phases ; aucune réécriture d'une valeur bilatérale existante hors passage par Sans ; aucune conversion destructive automatique.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Activation | Durée, identiques, Cible 30 s | phases `[30, null]`, ids `nextPhaseId`, `nextPhaseId+1`, libellés vides, D = 30 s | — |
| Activation sans durée | Cible `UNSET` ou héritée 5999 s | phases `[null, null]`, D `UNSET` | — |
| Activation refusée | Répétitions, variables N ≥ 2, Cible `FAILURE` | Brouillon inchangé | — |
| N = 1 variable demandé | activation des phases, charge commune | `setVariable(false)` d'abord, dans la même transition | — |
| Stepper | 2 → 3 ; 6 → 7 ; 2 → 1 | ajout à la durée de la dernière ; refus ; refus | inchangé |
| Avec → Sans | 6, 3, 5 | `[]`, D = 14 s ; réactivation : `[14, null]` | — |
| Avec → Sans, somme nulle | `[null, null]` | `[]`, D `UNSET` | — |
| ✓ `[0, null]` | — | phases retirées, Sans, validation de la durée seule décide | — |
| ✓ `[9, null]` | — | Sans, D = 9 s | — |
| ✓ somme 3 536 s | — | ✓ indisponible | violation `workPhases` |
| Avec phases | Répétitions, À l'échec, Variables, Cible commune | refus / sans effet | inchangé |
| Charge | activation sans valeur ; `setLoadValue(1,3)` ; `null` | 0,25 ; 1,5 ; 0 | — |
| À l'échec ↔ À la cible | Cible 30 s | `FAILURE` puis 30 s ; sans valeur connue → `UNSET` | — |

</frozen-after-approval>

## Code Map

- `src/domain/activities/ExecutionParametersDraft.ts` -- machine du Brouillon (CRLF). `PendingRemoval` (l. 86) à étendre en union `kind: "series" | "phase"` ; `removeRow` (l. 540) et `undoRemoval` (l. 563) à adapter ; `setVariable` (l. 366), `setMode` (l. 447), `setUniformTarget` (l. 479) à garder contre les phases ; `rememberCurrentTargets` (l. 289) et `cloneIdentity` (l. 306) à étendre à `lastNumberById` ; `commitSheetDraft` (l. 672) à faire passer par `sheetDraftResult` ; `applyRequestedTotal` (l. 627) utilise `setVariable(false)` en interne (garder sans `normalizeLoad`).
- `src/domain/activities/exerciseLoad.ts` -- `roundLoadUp`, `normalizeLoad`, `reactivateLoad`, `REACTIVATED_LOAD_KG` à réutiliser tels quels.
- `src/domain/activities/ExecutionParameters.ts` -- `WORK_PHASE_LIMITS` (l. 131), `EXECUTION_BOUNDS.durationTarget` (1..3535), `workPhasesProblem` (l. 636), violation `workPhases` (l. 863-864) : ajouter `details` (bornes de la somme) quand la somme sort de 1..3535 ; `codePointLength` dans `src/domain/sessions/validation.ts`.
- `src/features/activities/ExecutionParametersSheet.tsx:655, 772, 795` -- appelants de `commitSheetDraft`, `removeRow`, `undoRemoval` : signatures compatibles, aucune modification.
- `src/domain/activities/__tests__/ExecutionParametersDraft.test.ts` -- l. 748 et 782 attendent l'ancienne forme de `pendingRemoval` (ajouter `kind: "series"`) ; ajouter un `describe` PRE-5 story 2.1.

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/activities/ExecutionParametersDraft.ts` -- `lastNumberById` ; `canEnableWorkPhases`, `deriveSeriesDuration`, `setWorkPhasesEnabled`, `setWorkPhaseCount`, `removeWorkPhase`, `moveWorkPhase`, `setWorkPhaseLabel`, `setWorkPhaseDuration`, `normalizeWorkPhases` ; `setLoadEnabled`, `setLoadValue`, `normalizeDraftLoad` ; `setStopCondition` ; gardes de `setMode`, `setVariable(true)`, `setUniformTarget` ; `setVariable(false)` suivi de `normalizeLoad` ; `pendingRemoval` en union et `undoRemoval` des phases ; `sheetDraftResult` et `commitSheetDraft` -- AC1 à AC8.
- [x] `src/domain/activities/ExecutionParameters.ts` -- `details` de la violation `workPhases` pour une somme hors bornes -- suite signalée par 1.1.
- [x] `src/domain/activities/__tests__/ExecutionParametersDraft.test.ts` -- tests AC1 à AC9 (matrice ci-dessus, Δ48, aller-retour étendu à `lastNumberById` absent des paramètres) ; adaptation de `pendingRemoval`.
- [x] `src/domain/README.md` -- mention des transitions 2.1 si la liste du Brouillon y figure.

**Acceptance Criteria:**
- Given la story livrée, when on exécute `npm test`, `npx tsc --noEmit`, `npm run lint`, then les trois sont verts, sans test existant affaibli.
- Given `sheetDraftResult(draft, defaultLabel)` et `commitSheetDraft(draft, baseline, defaultLabel)`, when on les applique au même Brouillon, then ils rendent le même résultat.
- Given un ✓ réussi, when on lit la valeur, then elle ne porte ni identité volatile, ni `lastNumberById`, ni `pendingRemoval`.

## Implementation Notes

- Checkpoint 1 (2026-10-19) : spec d'environ 2 600 tokens conservée entière (story L atomique, AD-33 : transitions avant toute story de Feuille) ; aucune question ouverte ; approbation pré-autorisée par Hermann (développement PRE-5 autorisé le 2026-10-19, enchaînement sans approbation par story).

- Implémentation (sous-agent) : `toUniform` (ancien `setVariable(false)` sans `normalizeLoad`) sert l'Inversion du total et le passage à l'uniforme fait d'office à N = 1 ; seul `setVariable(false)` public normalise la charge. Transition refusée ou sans effet : Brouillon inchangé, annulation comprise. `setLoadValue("uniform")` refusé en variables effectives. `removeWorkPhase`, `setWorkPhaseLabel`, `setWorkPhaseDuration` prennent l'identité de la phase ; `moveWorkPhase` des indices. Après revue : D redérivée dès une liste non vide (Brouillon relu à une seule phase) ; la réactivation de la charge ne pose 0,25 que sur les valeurs nulles. Contrôles : 117 suites, 2 994 tests, `tsc` et lint verts.

## Spec Change Log

## Review Triage Log

Passe 1 (2026-10-19) — couches : Blind Hunter (B), Edge Case Hunter (E), Verification Gap (V).

| # | Constat | Verdict | Preuve / route |
|---|---|---|---|
| B1 / E8 | Constante `WORK_PHASES_SUM_OUT_OF_RANGE` insérée entre la JSDoc de `workPhasesProblem` et la fonction | low | Vérifié ; correction directe. **patch**. |
| B2 | `details` décidé par comparaison de la chaîne de raison | low | Constante unique, partagée par les deux usages ; aucune divergence possible aujourd'hui ; refonte en code structuré = complexité. Rejeté. |
| B3 | `codePointLength` dupliqué (`EP` privé, `sessions/validation` exporté) | low | Même mesure en points de code ; aucun appelant ne diverge. Rejeté. |
| B4 | Libellé blanc « ␣␣␣ » enregistré sans `defaultLabel` | false | `workPhasesProblem` refuse `label.trim().length === 0` : la validation le refuse. |
| B5 | Libellés non rognés au ✓ | false | AC5 ne rogne que pour décider du libellé vide ; aucune règle de rognage d'un libellé non vide. |
| B6 / E5 / E6 | `setLoadEnabled(true)` écrase par 0,25 les charges positives des lignes retirées ou réservées | medium | Vérifié (`withLoadEverywhere`) : perte d'une valeur conservée (AC6 « restaurées telles quelles »). **patch** : 0,25 seulement sur les valeurs nulles. Comparaison avant/après de `reactivateLoad` : correcte, rejetée. |
| B7 / V1 | Inversion du total et transitions à N = 1 sans `normalizeLoad` non testées avec charge active | low | Code correct, test absent. **patch** (test). Mention README : rejetée (commentaires de code suffisants). |
| B8 / E7 | `setStopCondition` sans garde pour Mode `null` | low | La ligne Condition d'arrêt suit le Mode ; garde supplémentaire. Rejeté. |
| B9 | Somme dérivée versée dans `lastNumberById` | false | D dérivée est la Cible `NUMBER` connue du Brouillon ; après Sans elle est la durée de série (FR-8), qu'À la cible doit restituer. |
| B10 | Ordre des paramètres `commitSheetDraft` / `sheetDraftResult` | false | Types disjoints (fonction / paramètres) : une inversion est une erreur de type. Signatures imposées par l'existant et AC5. |
| B11 | Durée de phase sans plafond | low | Roue 1..3535 ; somme > 3535 bloque ✓. Rejeté. |
| B12 | `setLoadValue` permis sous Sans | low | Champ masqué sous Sans (2.7) ; garde supplémentaire. Rejeté. |
| B13 | README incomplet (`normalizeWorkPhases`, `details`, `toUniform`) | low | Cosmétique ; commentaires du code à jour. Rejeté. |
| B14 | Tests AC8 n'exercent que l'existant | low | AC8 est satisfait par `setSideMode` existant (QN-4 : existant conservé) ; la ligne Avec / Sans (2.5) dispatche `RIGHT_LEFT` seulement depuis Sans. Rejeté, noté pour 2.5. |
| E1 | Une seule phase ouverte supprimée au ✓ sans modification | false | Règle QR-2 validée par Hermann (une phase restante → Sans, sa durée devient la durée de série). |
| E2 / E3 / E4 / E9 | Brouillon ouvert à une phase : durée modifiée sans redérivation, D périmée après Sans ou au ✓ | medium | Vérifié (`withWorkPhases` dérive à ≥ 2 seulement). **patch** : dérivation dès une liste non vide (AD-20). |
| V2 | Copie de `lastNumberById` par `cloneIdentity` non vérifiée | low | Test absent. **patch** (test). |

## Design Notes

Choix non visibles par l'utilisateur, décidés ici :
- `lastNumberById: Record<id, Partial<Record<ExecutionMode, number>>>` : alimentée par `rememberCurrentTargets` (Cibles `NUMBER` seulement) et par toute écriture d'une Cible `NUMBER` dans l'uniforme ; copiée par `cloneIdentity`. `setStopCondition(draft, "FAILURE" | "TARGET")` est refusée en variables effectives (N ≥ 2, résultat dérivé, FR-20) et avec des phases (vers `FAILURE`) ; à N = 1 variable demandé, elle passe d'abord par `setVariable(false)` comme les phases et la charge commune (même uniforme vu par la Feuille et le Brouillon).
- `setWorkPhaseCount(n)` n'accepte que n = longueur ± 1 dans 2..6 (le stepper avance d'un pas) ; n − 1 = `removeWorkPhase` de la dernière.
- `setWorkPhaseLabel` refuse un libellé de plus de 20 points de code ; `setWorkPhaseDuration` accepte un entier ≥ 0 ou `null`, sinon Brouillon inchangé.
- `setLoadValue(draft, "uniform" | { rowId }, kg | null)` désigne une identité de ligne (AD-27) ; identité inconnue → inchangé. `setLoadEnabled(true)` applique `reactivateLoad` aux paramètres demandés ; si toutes les valeurs étaient nulles, 0,25 est posé sur l'uniforme et sur toutes les lignes (actives, retirées, réservées). `normalizeDraftLoad` (fermeture du clavier) applique `normalizeLoad` aux paramètres effectifs.
- `sheetDraftResult(draft, defaultLabel, baseline = null)` ; `commitSheetDraft(draft, baseline = null, defaultLabel?)` : sans `defaultLabel` (Feuille actuelle, qui ne crée aucune phase), un libellé vide reste vide et la validation le refuse ; aucun texte inventé. La Feuille passera `defaultLabel` depuis `strings` en 2.8.

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
