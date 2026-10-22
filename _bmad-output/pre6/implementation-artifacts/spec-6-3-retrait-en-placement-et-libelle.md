---
title: 'Story 6.3 — Retrait en placement, libellé, fin de la bulle des points'
type: 'feature'
created: '2026-10-22'
status: 'in-progress'
baseline_commit: '1057630a'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-6-1-domaine-points-d-arret-independants.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-6-2-glisser-deposer-d-un-point-d-arret.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-5-3-placement-mixte-et-defilement.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Depuis la story 6.2, l'appui long d'un Point d'arrêt est réservé à son déplacement et sa bulle « Retirer » a disparu : un point ne peut plus être retiré. D-436 (R3) prévoit que le retrait passe exclusivement par le mode Placement.

**Approach:** Brancher l'écran de placement sur le sous-brouillon de la story 6.1 : les points existants y apparaissent sélectionnés ; les toucher programme leur retrait, les retoucher l'annule ; Confirmer applique, Annuler restaure ; le libellé du bouton suit l'arbitrage du 22/10. Réutiliser `PlacementLayer`, `PlacementBar`, la puce de placement (story 5.3) et les fonctions pures de `placement.ts`.

## Boundaries & Constraints

**Always:**
- Sources : D-436 (R3), RM-251, CE-T03-08 (ch13 : placement, contrôles, accessibilité), ch08 placement, API-COM-09 ; epics.md Epic 6 et arbitrages du 22/10 (libellé).
- En placement, chaque point existant est rendu comme puce de placement **sélectionnée** (style « sélectionné » existant, ou celui de la puce de placement Figma `8328:29270` à l'état choisi), à sa position, y compris un point sur un emplacement non proposé (`kind: UNOFFERED_STOP_POINT`) ; toucher → désélection = retrait programmé (`togglePlacementStopPointRemoval`), retoucher → resélection ; aucun autre effet ; libellés et états accessibles (sélectionné / non sélectionné, indice « toucher pour retirer » / « toucher pour conserver »).
- Les emplacements libres proposés tiennent compte de l'état effectif (existants − retraits + ajouts) via `placementSlots(…, placement)` et `togglePlacementStopPoint(…, context)` (jamais la forme historique sans contexte).
- Libellé du bouton (`placementConfirmation`) : `ADDITIONS_ONLY {count}` → « Confirmer N pause(s) ajoutée(s) » (formulation actuelle) ; `CHANGES` (au moins un retrait, un mélange, ou une modification de durée de récupération existante) → « Confirmer les modifications » ; `NONE` → bouton indisponible.
- Confirmer applique ajouts, modifications et retraits en une fois (`applyPlacementDraft`), sans point consécutif ; Annuler restaure intégralement l'état d'entrée ; persistance seulement à « Continuer ».
- Les points n'ont plus de bulle ni d'action « Retirer » nulle part ; la récupération conserve sa bulle et ses actions.
- Rail, rangées et défilement du placement (story 5.3) inchangés ; cibles tactiles réelles.

**Never:**
- Changer les règles de placement, le décompte des ajouts, la roulette, les récupérations ou le Domaine (sauf correctif nécessaire et testé).
- Retirer un point hors du mode Placement.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Entrée en placement | point P existant | P affiché sélectionné | — |
| Retrait | toucher P | P désélectionné ; libellé « Confirmer les modifications » | — |
| Annuler le retrait | retoucher P | P sélectionné ; libellé selon le reste | — |
| Confirmer | P désélectionné | P retiré du brouillon | — |
| Annuler le placement | ajouts + retraits | état d'entrée intact | — |
| Ajouts seuls | 2 ajouts | « Confirmer 2 pauses ajoutées » | — |
| Mélange | 1 ajout + 1 retrait | « Confirmer les modifications » | — |
| Durée modifiée seule | R 20 → 45 | « Confirmer les modifications » | — |
| Point non proposé (hérité) | P en tête de Circuit | affiché sélectionné, retirable | — |
| Voisin consécutif | retrait de P libère l'emplacement voisin | emplacement voisin proposé | — |
| Persistance | Confirmer puis Continuer, réouverture | point absent | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/CompositionScreen.tsx` -- état de placement (`placement`, entrée, Confirmer, Annuler), `placementSlots`, rangées et puces en placement.
- `src/features/sessions/PlacementLayer.tsx`, `PlacementBar.tsx` -- puces, libellé (`formatPlacementConfirmLabel`).
- `src/domain/sessions/placement.ts` (lecture : `togglePlacementStopPointRemoval`, `placementConfirmation`, `effectivePlacementStopPoints`).
- `src/shared/i18n/resources/fr.ts` (+ `index.test.ts`).
- Tests : `CompositionScreen.test.tsx` (bloc placement), `PlacementBar`/`PlacementLayer` tests, `CompositionPausesFlow.integration.test.tsx` (persistance).

## Tasks & Acceptance

**Execution:**
- [ ] Points existants sélectionnés et retrait programmé en placement + tests.
- [ ] Emplacements selon l'état effectif + tests.
- [ ] Libellé du bouton + tests.
- [ ] Confirmer / Annuler / persistance (intégration) + tests.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert.
- Given un iPhone, when on retire et rétablit des points en placement, then les scénarios 9 à 12 de la recette de Hermann sont conformes (J5).

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npx jest src/features/sessions src/domain/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
