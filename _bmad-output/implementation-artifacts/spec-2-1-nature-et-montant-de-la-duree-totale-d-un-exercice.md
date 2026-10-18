---
title: 'Story 2.1 — Nature et montant de la Durée totale d''un Exercice'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: '22a85a799886c1b1cedcdeb7e539af76a6b5862b'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-2.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/bilan-ecarts-2026-10-17.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le calcul unique de la durée d'un Exercice ne connaît que trois natures : `exact`, `estimated` et `omitted`. Un Exercice à Cibles mixtes, avec des valeurs numériques et des Cibles à l'échec, est donc déclaré omis alors que son montant connu (≥) est juste. Une Cible à renseigner (`UNSET`) se confond avec l'omission. La disponibilité de l'Inversion n'a pas d'entrée « N hérité ».

**Approach:** Implémenter la **story 2.1 (AC1 à AC9, `epics-parts/epic-2.md`)** en se limitant à l'écart restant consigné dans le bilan approuvé du 2026-10-17 :
- étendre le seul résumé du registre (`summarize`) et l'union des natures à `exact | estimated | lowerBound | omitted | incomplete` ;
- ajouter l'indicateur d'héritage à la disponibilité de l'Inversion ;
- adapter les consommateurs de façon exhaustive ;
- prouver chaque AC par des tests nommés `PRE4-2.1/ACn`.

## Boundaries & Constraints

**Always:**
- **Réutiliser tels quels** `buildExecutionLedger`, `workSeconds`, la substitution de la Pause terminale par la Récupération, `invertTotalDuration`, `totalDurationRange` et `computeExercisePlanDuration`. Leur logique est conforme ; seul le résultat typé change.
- Natures, par priorité : une Cible `UNSET` → `incomplete` ; tout travail connu ou estimable → `exact` (Durée) ou `estimated` (Répétitions avec Bip) ; Répétitions avec Bip 0, ou toutes les Cibles `FAILURE` → `omitted` ; sinon (mélange de travail connu et de `FAILURE`) → `lowerBound`. `lowerBound` porte `seconds` = montant connu. `omitted` et `incomplete` ne portent pas `seconds`, mais gardent `knownSeconds`.
- Les attendus des tests sont des constantes écrites ou des formules dans le test (AD-10, FR-13-06). Les tests PRE-3 existants restent intacts, sauf changement de nature exigé par l'AC2, à consigner.
- Consommateurs pendant la transition (AC9) :
  - `ActivityCard.catalogueDuration` et la clause Durée totale de `executionPhrase` affichent un `lowerBound` sous la forme `≥ {formatPhraseDuration}`, sur le modèle de `≈ ` ;
  - la ligne de total de la Feuille reste masquée pour `lowerBound`, `omitted` et `incomplete` (affichage et roulette : story 3.7) ; elle n'affiche jamais `—` ni `0 s` pour une Cible à renseigner ; pour une autre saisie invalide, le comportement existant est conservé ;
  - l'agrégation de Séance traite `lowerBound` et `incomplete` comme une contribution partielle (`≥`).

**Never:**
- Aucun nouveau formateur ni gabarit de texte (2.2, 2.3, 2.4). Aucun changement de l'arrondi de Composition (2.4). Aucune refonte de Composition.
- Ne jamais lire une Cible `UNSET` comme 0 ni la convertir en `FAILURE`. Aucun forfait par répétition.
- Aucun N hérité produit ni persisté. L'indicateur n'est qu'une entrée de la fonction de disponibilité, `false` par défaut.

</frozen-after-approval>

## Code Map

- `src/domain/activities/executionCalculations.ts` :
  - l.35-44 : union `ExerciseDurationKind` et type `ExerciseDurationResult` ;
  - l.127-139 : `summarize`, qui reçoit aujourd'hui le seul Mode ; lui passer les paramètres, ou les Cibles, pour distinguer `UNSET`, `FAILURE` et l'absence de Bip ;
  - l.165-169 : `isTotalDurationInvertible`, à compléter par un argument facultatif d'héritage ; `invertTotalDuration` lève déjà sur une entrée indisponible ;
  - l.226-240 : `computeExercisePlanDuration`, à faire porter `seconds` pour `lowerBound`.
  - Mettre à jour l'en-tête l.1-15.
- `src/domain/activities/ExecutionParametersDraft.ts:403-420` : appelle `isTotalDurationInvertible`. Il garde la valeur par défaut, l'héritage étant repris par la story 3.2 (AC14).
- `src/domain/sessions/calculations.ts` :
  - l.65-76 : `computeActivityDurationResult` (mode `null` → `omitted`, inchangé) ;
  - l.169 : `isLowerBoundEstimate` doit être vrai pour `omitted`, `lowerBound` et `incomplete` ;
  - mettre à jour les commentaires l.59-64.
- `src/features/activities/ActivityCard.tsx:108-122` : `catalogueDuration`, ajouter `≥`.
- `src/features/activities/ExecutionParametersSheet.tsx:343-351` et `:763` : `totalApplicable` et le libellé. La ligne n'est montrée que pour `exact` et `estimated`, et `—` disparaît pour une Cible `UNSET`. Ne toucher ni aux roulettes, ni à la `Modal`, ni à `InlineStepper`.
- `src/domain/activities/executionPhrase.ts:197-204` : rendre le traitement exhaustif. Le mélange rend déjà `null` plus haut (l.~115) jusqu'à la story 2.3 ; ne pas modifier ce comportement.
- Tests :
  - `src/domain/activities/__tests__/executionCalculations.test.ts` (434 lignes, blocs P3-12 à P3-14 et `PRE4-1.1/AC21` l.416) : à étendre ;
  - `src/domain/sessions/__tests__/calculations.test.ts` (≥ de Séance, l.~398) ;
  - tests de `ActivityCard`, `executionPhrase` et `ExecutionParametersSheet`, pour l'AC9.
- Rejeu de l'AC8 :
  - `setMode` et `moveRow` (`ExecutionParametersDraft.ts:300,355`) ;
  - `activityDefinitionToDraftExercise` (`ActivityDefinition.ts`) ;
  - `exerciseSnapshot.ts` (Instantané v2).

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/activities/executionCalculations.ts` -- union à 5 issues, résumé par Cibles, indicateur d'héritage, plan complet -- AC1, AC2, AC5, AC6.
- [x] `src/domain/sessions/calculations.ts`, `ActivityCard.tsx`, `ExecutionParametersSheet.tsx`, `executionPhrase.ts` -- traitement exhaustif (`switch` avec contrôle `never` ou équivalent) -- AC9.
- [x] `executionCalculations.test.ts` -- tests `PRE4-2.1/AC1` à `AC8` :
  - tableaux littéraux R01 à R04, cas Figma et plus de 3 Cibles (AC3) ; tableau A à F et autres attendus (AC4) ; `UNSET` 105 s et 30 s (AC5) ;
  - Inversion et héritage (AC6) ; T(1) = 40, T(99) = 3 960, cas 160 et 180 (AC7) ;
  - matrice et rejeux (AC8).
- [x] tests des consommateurs -- `PRE4-2.1/AC9` : `≥` sur la carte et dans la Phrase, ligne de total masquée et absence de `—` dans la Feuille, `≥` pour une Séance contenant un `lowerBound` ou un `incomplete`.
- [x] `src/domain/README.md` -- natures de durée, si le README les décrit.

**Acceptance Criteria:**
- Given la story 2.1 de `epics-parts/epic-2.md`, when elle est livrée, then chacun de ses critères AC1 à AC9 est vérifié par un test nommé `PRE4-2.1/ACn`, et `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.
- Given un Exercice entièrement numérique, when il est calculé, then son montant et sa nature sont identiques à ceux d'avant la story (tests PRE-3 inchangés).

## Design Notes

H8, H10 et H28 sont appliquées comme écrites, au titre de la validation globale du plan par Hermann (même régime que l'Epic 1). La recette R-2.1-01 entre dans l'ensemble « durées et phrases ». Aucune validation sur appareil n'est déclarée.

## Implementation Notes

- `summarize` reçoit désormais les paramètres (Cibles effectives après `normalizeEffective`) ; le registre, `workSeconds`, la substitution de la Récupération, l'énumération de l'Inversion et `totalDurationRange` sont inchangés. `computeExercisePlanDuration` porte déjà `seconds` pour `lowerBound` sans modification (il recopie `seconds` dès qu'il est présent).
- Deux prédicats exhaustifs (`switch` + `never`) sont ajoutés à `executionCalculations.ts` : `hasDurationAmount` (montant présent) et `isPartialContribution` (contribution ≥ : `lowerBound`, `omitted`, `incomplete`). Ce dernier est utilisé par `aggregateSessionDuration` et `computeZoneDurationFacts`.
- `invertTotalDuration` reçoit le même indicateur facultatif `inheritedSeriesCount` (défaut `false`) ; sous N hérité, il lève un message distinct (« inherited series count ») de celui d'un Mode ou Régime incompatible (AC6). `ExecutionParametersDraft.ts` garde la valeur par défaut.
- `ActivityCard.catalogueDuration` délègue à `totalClauseAmount` (aucune duplication des préfixes ≈/≥). La Feuille n'a pas de `switch` propre : `totalApplicable` exclut déjà `FAILURE` et `UNSET`, la nature y est donc toujours `exact` ou `estimated`.
- `executionPhrase.ts` : la clause Durée totale passe par `totalClauseAmount` (exporté pour le test AC9, `switch` exhaustif). Le mélange rend toujours `null` plus haut ; le `≥` de la Phrase n'est donc prouvé que sur cette fonction jusqu'à la story 2.3.
- Feuille : la ligne Durée totale est masquée aussi pour une Cible `UNSET` (`hasUnsetTarget`) ; une autre saisie invalide garde « — ». **Test PRE-3 modifié (consigné) :** `P3-16/fold-incomplete` (`ExecutionParametersSheet.test.tsx`) attendait « — » pour une Série 2 à renseigner ; il attend désormais l'absence de la ligne (AC9). Aucun autre test existant n'a été modifié.
- `src/domain/README.md` ne décrit pas les natures de durée : non modifié.

## Spec Change Log

## Review Triage Log

Revue du 2026-10-17 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V). V : aucune lacune de vérification.

| Constat | Verdict | Preuve | Route |
|---|---|---|---|
| B1 — `catalogueDuration` duplique `totalClauseAmount` | low | Même switch et mêmes préfixes dans deux fichiers ; risque de divergence en 2.2 et 2.4 | patch (réutilisation) |
| B2 — cinq switchs exhaustifs sur la même union | low (pour `totalRowShown` seulement) | `totalRowShown` vaut `!isPartialContribution` et n'est jamais atteint (voir B4) ; les autres switchs ont des rôles distincts | patch via B4 ; rejeté pour le reste (préférence de conception, aucun dommage nommé) |
| B3 — `ExerciseDurationResult` n'est pas une union discriminée (`seconds!`) | low | Invariant tenu par `hasDurationAmount` et les tests ; la correction retype tous les consommateurs | rejeté (faible ; correction plus qu'immédiate) |
| B4 — `totalRowShown` mort dans la Feuille | low | `totalApplicable` exclut déjà `FAILURE` et `UNSET`, donc la nature est `exact` ou `estimated` | patch (suppression) |
| B5/E1/E3 — « — » encore affiché pour une autre saisie invalide, sans test | low | Conforme à la spec (comportement existant conservé ; AC9 ne vise que `omitted` et `UNSET`), mais aucun test ne le fige | patch (test) |
| B6 — `summarize` normalise une seconde fois | false | Les deux appellent `normalizeEffective` sur la même entrée : les Cibles sont identiques ; coût négligeable (99 itérations) | rejeté |
| B7 — `computeExercisePlanDuration` teste encore `seconds === undefined` | low | Correct aujourd'hui (`seconds` absent si et seulement si `omitted` ou `incomplete`) | rejeté (faible, aucun défaut) |
| B8 — même message d'erreur pour un N hérité ; tests en `toThrow()` nu | low | Un refus pour une autre cause passerait les tests de l'AC6 | patch |
| B9 — indicateur booléen positionnel non câblé | false | Câblage prévu par la story 3.2 (AC14) et consigné dans la spec | rejeté |
| B10 — `incomplete` non vérifié en bilatéral, par Série et avec Récupération | low | La matrice de l'AC8 n'a aucune ligne `UNSET` | patch (tests) |
| B11 — agrégation peu couverte (Circuit répété partiel, multiplicité 0, ≥ contre ≈) | low | `calculations.test.ts` | patch (tests) |
| B12 — `queryByText` sur une regex, fragile | low | Lève une erreur si plusieurs nœuds correspondent | patch |
| B13 — Phrase : ni `UNSET` en identiques, ni mélange en Répétitions avec Bip 0 | low | `executionPhrase.test.ts` | patch (tests) |
| E2 — aucune Phrase générée ne montre `≥` | false | La spec impose une Phrase `null` pour un mélange jusqu'à la story 2.3 ; seule la clause est testée, comme prévu | rejeté |

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
- `git diff --stat` -- expected: aucun fichier réécrit en entier ; fins de ligne d'origine conservées
