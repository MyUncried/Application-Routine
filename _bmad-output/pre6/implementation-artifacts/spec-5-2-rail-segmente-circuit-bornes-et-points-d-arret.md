---
title: 'Story 5.2 — Rail segmenté, Circuit, bornes et points d''arrêt'
type: 'feature'
created: '2026-10-21'
status: 'in-progress'
baseline_commit: '1e052b5a'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-5-1-carte-v2-et-recuperation-en-troisieme-ligne.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Après la story 5.1, la mise en page autour des cartes v2 suit encore l'ancien rendu : rail continu gris clair à gauche avec un repère par occurrence, cartes dans une colonne étroite (328 à 402 au lieu de 370), Circuit violet à bord arrondi 10, en-tête sur deux lignes, point d'arrêt aligné à droite sous la carte.

**Approach:** Élargir la séquence aux dimensions Figma (cartes 370 à x16 sur 402), reconstruire le rail en segments calculés depuis les positions réelles des éléments (anneaux, médias, points d'arrêt), passer le Circuit en aplat Figma avec son en-tête aligné, et placer le point d'arrêt hors placement dans une rangée centrée raccordée au rail. Comportements inchangés.

## Boundaries & Constraints

**Always:**
- Sources : D-435 ; CE-T03-08 (ch13 L1478 : rail, Circuit, points ; L1480 : largeurs) ; DSF-CARTES L132 ; ch08 « Présentation des occurrences » ; choix D1, D4, D5 de l'epic 5 (validés). Figma : Standard `8328:28605` (rail `9819:20056`–`20061`, anneaux `9819:19909`/`20017`, Circuit `9819:19906`/`19946`, point d'arrêt `9819:20018`/`20062`/`20063`), point d'arrêt `8328:29428`.
- Rendu relevé à 402 (à confirmer sur les nœuds) :
  - colonne de séquence x24 (354) ; cartes 370 à x16 ; largeur adaptée à 360 / 440 (marges constantes, aucune largeur d'exemple codée en dur) ;
  - rail `#7A7A80` (`textTertiary` ch12 L1010), 1,5, centré sur le centre du média (x56) ; segments d'un bord à l'autre, sans traverser médias ni anneaux ; plus de repère par occurrence (le média sert d'ancrage) ; anneaux de 10 (fond blanc, contour gris) pour Compte à rebours, Circuit et Fin de séance ; point 6 × 6 sur le rail au niveau d'un point d'arrêt ;
  - écart vertical 8 hors Circuit ; bornes : rangée 27, libellé Medium 14 `#46464C` à x69, pastille de valeur existante ;
  - Circuit : aplat `#F3F4F9` (constante locale, D5), sans contour, rayon 18, débord 8 de chaque côté des cartes (386 à x8), padding vertical 14, écart 9 entre en-tête et cartes et entre cartes ; le fond en trois couches de la story 2.3b (croissance animée pendant le glisser) est conservé, recalé sur ce rayon ; `tourSurface` non modifié ;
  - en-tête du Circuit (hauteur 40) : anneau sur le rail, « Circuit » Semi Bold 16, œil des Volumes à côté du titre (D4), compteur à la position Figma, durée Regular 12 `#7A7A80` alignée à droite sur la ligne du titre ; commandes (compteur révélé, nature, volumes) et leurs comportements inchangés ;
  - point d'arrêt hors placement : rangée 22 centrée entre les deux éléments, puce existante (`StopPointChip`) centrée sur la page, point de raccord sur le rail ; « après le Circuit » : rangée centrée sous le Circuit ; retrait par appui long, focus et actions accessibles inchangés.
- Rail : segments dérivés des mesures `onLayout` réelles (ou de la mise en page déjà mesurée pour le glisser), jamais d'un nombre de segments ni de coordonnées d'exemple ; ils suivent les décalages animés du glisser (story 2.3b : chaque segment porté par l'élément qu'il relie, ou translations identiques), sans recalcul de mise en page pendant le geste.
- Aucun trait de démarcation (D1). Les zones tactiles des bornes, de l'en-tête, des cartes et des puces ne se chevauchent pas.
- Ne modifier aucune valeur existante de `tokens.ts` ; constantes locales nommées citant ch13 / DSF ; `dimensions` non verrouillées ajustables si le test le permet.

**Never:**
- Changer un comportement (compteur, nature, volumes, placement, glisser, balayage, retrait, focus), un calcul ou une donnée.
- Refaire le mode placement (story 5.3) ou les états soulevé / balayage (story 5.4) au-delà de ce qu'impose la nouvelle largeur ; ils doivent rester fonctionnels.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Séquence vide | aucun Exercice | rail entre Compte à rebours, Circuit vide et Fin | — |
| Avant / dans / après | une carte par zone | segments anneau → média → anneau → média → … → Fin, sans traverser | — |
| Point d'arrêt | point après A | rangée 22 centrée, point sur le rail, segments de part et d'autre | — |
| Point après le Circuit | — | rangée centrée sous le Circuit | — |
| Glisser | carte déplacée entre zones | segments et Circuit suivent les décalages, retour à 0 au dépôt | — |
| Largeurs | 360 / 402 / 440 | cartes et Circuit adaptés, sans débordement | — |
| Compteur et œil | toucher | comportements inchangés | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/CompositionSequence.tsx` -- rail, anneaux, repères.
- `src/features/sessions/CompositionScreen.tsx` -- `bodyContent`, zones, conteneur du Circuit et `CircuitSurface`, rangées de point d'arrêt (dont après le Circuit), mesures `onLayout`, décalages du glisser (`dragShifts`, `DRAG_SHIFT_GAPS`), constantes d'écart.
- `src/features/sessions/CircuitHeader.tsx` -- en-tête du Circuit.
- `src/features/sessions/ActivityRecoveryLine.tsx`, `StopPointChip.tsx` -- point d'arrêt hors placement.
- `src/features/sessions/compositionGesture.ts` -- écarts utilisés par le calcul de dépôt et de décalage.
- Tests : `CompositionScreen.test.tsx`, `CircuitHeader.test.tsx`, `compositionGesture.test.ts`, `CompositionSequence` s'il existe.

## Tasks & Acceptance

**Execution:**
- [ ] Largeur des cartes et de la séquence (370 à 402, adaptatif) + tests.
- [ ] Rail segmenté calculé + anneaux + point des points d'arrêt + tests (dont glisser).
- [ ] Circuit (aplat, débord, rayon, espacements, fond animé recalé) + en-tête + tests.
- [ ] Point d'arrêt hors placement centré + tests.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert ; attentes modifiées seulement là où D-435 change le rendu.
- Given un iPhone, when on ouvre et manipule la Composition, then rail, Circuit et points suivent `8328:28605` (Hermann, J4).

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npx jest src/features/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
