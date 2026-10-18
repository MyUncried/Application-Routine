---
title: 'Story 2.4 — Durées et résumés sur les cartes Catalogue et Composition'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: 'e0d1d253a14f0e70509153d3b3e899f966411326'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-2.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le résumé de Composition passe une durée partielle (`≥`) au formateur des cartes de Séance, qui l'arrondit à la minute supérieure : il affiche `≥ 2 min` au lieu de `≥ 1 min 45 s`. Les rendus des cartes Catalogue et des résumés de Séries, déjà adaptés par les stories 1.1 et 2.1, ne sont pas prouvés contre le code de départ ni sur toute la matrice des cas.

**Approach:** Implémenter la **story 2.4 (AC1 à AC6, `epics-parts/epic-2.md`)** en se limitant à l'écart restant (bilan approuvé du 2026-10-17) :
- une seule branche `lowerBound` dans `formatCompositionSummary` : préfixe `≥ ` du lexique, montant formaté par `formatPhraseDuration`, sans arrondi ;
- des tests `PRE4-2.4/ACn` qui prouvent la carte Catalogue (déjà en `≥` depuis la story 2.1), le résumé des Séries (déjà sur Cibles typées depuis la story 1.1) et la non-régression.

## Boundaries & Constraints

**Always:**
- Réutiliser sans modification : `catalogueDuration` (qui délègue à `totalClauseAmount`), `formatExerciseRowSummary` et ses branches (tout échec `{N} séries à l’échec`, mélange `{N} séries variables`, `Paramètres à compléter.`), `computeZoneDurationFacts` et `computeEstimatedDurationSeconds`.
- Résumé de Composition : `exact` et `estimated` gardent exactement `formatEstimatedDuration`, avec l'arrondi à la minute supérieure (P41). Seul `lowerBound` change.
- Non-régression de l'AC2 : les attendus du code de départ sont écrits comme constantes dans le test (165 → `2 min 45 s`, 104 → `≈ 1 min 44 s`, 120 → `2 min`), éventuellement relevés une fois dans `git show c32e360d:src/features/activities/ActivityCard.tsx`. Ils ne sont jamais recalculés par le code testé.
- Les attendus de durée sont des constantes ou des formules écrites dans le test (AD-10).

**Never:**
- Aucune ligne de durée ajoutée à la ligne Exercice de Composition ; aucun élément nouveau dans Composition ; aucune refonte (Q4).
- Aucun changement des cartes de Séance (`SessionCard`, `formatEstimatedDuration`) ni du texte des huit cartes du Catalogue et de leurs filtres. Aucune Phrase sur une carte.
- Aucun changement des libellés « Tour » ou « Circuit » existants.

</frozen-after-approval>

## Code Map

- `src/features/sessions/compositionPresentation.ts:107-143` -- `formatCompositionSummary` : seule modification de production. Ajouter une branche `lowerBound` qui écrit `strings.shared.durationNature.lowerBoundPrefix` suivi de `formatPhraseDuration(totalSeconds)` (`src/domain/activities/durationFormat.ts`). Le comptage ne prend que les Exercices `IN_TOUR` et le Circuit est répété ; ne pas le changer. Mettre à jour le commentaire.
- `src/features/activities/ActivityCard.tsx:108-122` -- `catalogueDuration` : déjà conforme (`≥` depuis la story 2.1, ligne absente pour `omitted` et `incomplete`). Tests seulement.
- `src/features/sessions/compositionPresentation.ts` -- `formatExerciseRowSummary` (et ses aides, dont `formatCompactDuration`) : déjà sur Cibles typées. Ajouter le test de matrice de l'AC4 : Mode × Régime × position de l'échec × bilatéral, jamais `0 s` ni `0 rép.`.
- Tests :
  - `src/features/sessions/__tests__/compositionPresentation.test.ts` ;
  - `src/features/activities/__tests__/ActivityCard.test.tsx` ;
  - tests existants du résumé de Composition, qui doivent rester verts sans affaiblissement.

## Tasks & Acceptance

**Execution:**
- [x] `compositionPresentation.ts` -- branche `lowerBound` de `formatCompositionSummary` -- AC5.
- [x] Tests `PRE4-2.4/AC1` à `AC6` :
  - Catalogue : 105 s → `≥ 1 min 45 s`, 135 s → `≥ 2 min 15 s`, Répétitions Bip 0 sans ligne de durée, non-régression 165 / 104 / 120 ;
  - `omitted` et `incomplete` sans ligne de durée, avec `Paramètres à compléter.` ;
  - matrice de l'AC4 ;
  - Composition R01 ×1 → `≥ 1 min 45 s`, ×2 → `≥ 3 min 30 s`, exact et estimé inchangés ;
  - aucun recalcul local, aucune Phrase sur une carte, symboles issus du lexique ou du formateur de domaine exempté (AD-11).

**Acceptance Criteria:**
- Given la story 2.4 de `epics-parts/epic-2.md`, when elle est livrée, then chacun de ses critères AC1 à AC6 est vérifié par un test nommé `PRE4-2.4/ACn`, et `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Design Notes

H9, H20 et H28 sont appliquées comme écrites (validation globale du plan). Recettes R-2.4-01 à 05 : ensemble « durées et phrases », R-2.4-03 seulement après l'Epic 3. Aucune validation sur appareil n'est déclarée.

## Implementation Notes

- Production : seule `formatCompositionSummary` change (branche `lowerBound` : `strings.shared.durationNature.lowerBoundPrefix` + `formatPhraseDuration`, sans arrondi) ; `exact`/`estimated` passent toujours par `formatEstimatedDuration`.
- Quatre attendus existants de `compositionPresentation.test.ts` portaient l'ancien arrondi de la borne (`≥ 1 min` ×2, `≥ 3 min`, `≥ 2 min`) : mis à jour vers la valeur non arrondie (`≥ 40 s` ×2, `≥ 2 min 10 s`, `≥ 1 min 50 s`), même assertion d'égalité stricte.
- Après revue : une borne `lowerBound` de 0 s garde le rendu PRE-3 `≥ 0 min` (règle P47, `questions-ouvertes.md`), jamais `≥ 0 s` ; l'attendu existant `1 exercice · ≥ 0 min` est conservé.

## Spec Change Log

## Review Triage Log

Revue du 2026-10-17 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V). V : aucune lacune de vérification.

| Constat | Verdict | Preuve | Route |
|---|---|---|---|
| B1/E1/E3/E4/V — « 1 exercice · ≥ 0 s » affiché et figé par un test | medium | `formatCompositionSummary` formate un `lowerBound` nul ; 2.1 AC9 interdit « 0 s » | patch : « ≥ 0 min » (rendu PRE-3), règle P47 |
| B2 — AC5 sans le cas Q30 (Cible héritée à renseigner) ni le cas `omitted` nommé | low | Aucun test `PRE4-2.4/AC5` ne les couvre | patch (tests) |
| B3 — tests AC6 tautologiques | low | L'attendu est calculé par le code testé (contraire à AD-10) | patch (littéraux) |
| B4 — assertions négatives inutiles | low | Elles suivent une égalité exacte | patch (suppression) |
| B5 — `durationOf` lit `props.children` par une conversion non vérifiée | low | Fragile si le rendu se découpe | patch |
| B6 — balayage de source fragile | low | Le comportement est déjà fixé par des tests de sortie | rejeté |
| B7 — cartes de Séance testées seulement par le formateur | low | Rendu des cartes de Séance couvert par `SessionCard.test.tsx` (2.2) | rejeté |
| B8 — huit cartes du Catalogue et rendu de `CompositionScreen` non testés | false | Aucun module du Catalogue n'est modifié (tests existants verts) ; V : `CompositionScreen.tsx:477` affiche la chaîne du formateur sans la transformer | rejeté |
| B9 — commentaires périmés dans `ActivityCard.tsx` | low | « (arrondi : story 2.4) » ; « exacte, ≈ ou absente » | patch |
| B10 — lacunes de la matrice AC4 (UNSET combiné, « 0 min », bilatéralité héritée faussée) | low | Matrice | patch |
| B11 — diff incomplet (recette, sprint, spec) | false | Fichiers de l'orchestrateur, hors code revu | rejeté |
| E2 — nombre de répétitions du Circuit non entier | false | Entier 1..99 validé (D-058, `validation.ts`) | rejeté |
| E5 — AC2 comparé à des constantes et non au code de départ exécuté | false | La spec prévoit des constantes relevées à `c32e360d` | rejeté |

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
- `git diff --stat` -- expected: aucun fichier réécrit en entier ; fins de ligne d'origine conservées
