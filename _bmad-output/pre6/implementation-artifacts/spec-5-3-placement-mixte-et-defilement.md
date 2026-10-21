---
title: 'Story 5.3 — Placement mixte et défilement'
type: 'feature'
created: '2026-10-21'
status: 'in-progress'
baseline_commit: '10ca6f16'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-4-1-mode-placement-et-sous-brouillon.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-5-2-rail-segmente-circuit-bornes-et-points-d-arret.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le mode placement (story 4.1) présente encore ses emplacements sur une rangée sous chaque carte (récupération à gauche, point à droite) et atténue les cartes ; D-435 prévoit un placement mixte : points d'arrêt entre les cartes, récupération dans la troisième ligne des cartes éligibles, défilement jusqu'à la dernière position.

**Approach:** Réutiliser `PlacementLayer`, le sous-brouillon et la roulette de la story 4.1 en changeant seulement la présentation des emplacements : puce de point d'arrêt centrée dans une rangée raccordée au rail ; cadre pointillé « Récupération » dans la ligne 3 de la carte v2 ; cartes non atténuées (D6) ; défilement jusqu'au dernier emplacement sous le pied protégé.

## Boundaries & Constraints

**Always:**
- Sources : D-435 ; CE-T03-08 (ch13 L1478, L1480, L1486 : placement, défilement, interactions) ; ch10 L626 (PR #391) ; ch08 L473 ; choix D6 (validé). Figma : placement `8328:29270` (puce `9849:43089`, point existant `9843:18974`, cadre de récupération `9848:18968`, zone `9798:19918`).
- Rendu relevé à 402 (à confirmer sur les nœuds) :
  - emplacement de point d'arrêt : rangée 22 centrée entre deux éléments (écart 9 dans le Circuit, 8 ailleurs), puce centrée sur la page : pointillé 1 `#0508E5`, fond `#0508E5` à 5 %, rayon 10, deux barres 3 × 10, texte Medium 10 ; raccordée au rail (point du rail, story 5.2) ; un point d'arrêt existant occupe une rangée de 24 ;
  - emplacement de récupération : cadre pointillé 1,5 `#0508E5`, fond 5 %, rayon 10, environ 106 × 24, dans la ligne 3 de la carte, aligné à droite sur la colonne des valeurs, sablier visible dans le cadre, « Récupération » Semi Bold 11 couleur primaire ; seulement sur les cartes sans récupération (une récupération existante, même à 0 s, interdit le cadre — ch13 L1486) ;
  - récupération existante en placement : sa valeur effective (sous-brouillon) en ligne 3, touchable pour la modifier comme aujourd'hui (story 4.2), sans second ajout ;
  - cartes non atténuées (D6), toujours inactives (pas d'ouverture, pas de glisser, pas de balayage) ; seuls les emplacements répondent.
- Cibles tactiles des emplacements ≥ 44 quand la place le permet, disjointes entre elles et des autres contrôles ; actions accessibles et annonces existantes conservées (libellés, état sélectionné, décompte).
- Défilement : toute la séquence défile, y compris quand le placement allonge le contenu ; le dernier emplacement (avant « Fin de séance » : aucun point autorisé, mais dernier emplacement de récupération ou point après le Circuit) reste atteignable au-dessus du pied Annuler / Confirmer ; Safe Areas respectées.
- Rail : continu à travers les rangées d'emplacement (story 5.2), opacité uniforme.
- Logique inchangée : sous-brouillon, positions autorisées (`placement.ts`), décompte N, roulette au choix d'une récupération (défaut Profil 30 s), Confirmer / Annuler, avertissement D-301.

**Never:**
- Modifier positions autorisées, décompte, roulette, confirmation, annulation, données ou calculs.
- Proposer deux récupérations pour une même occurrence, ou un point immédiatement après le Compte à rebours ou avant la Fin.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Entrée en placement | A, B hors Circuit, sans pauses | cadre Récupération en ligne 3 de A et B ; puce Point entre A et B | — |
| R existante 0 s | A avec R = 0 | aucun cadre sur A | — |
| R existante 20 s | — | « 20 s » en ligne 3, touchable pour modifier ; pas de cadre | — |
| Choisir Récupération | toucher le cadre de A | roulette (défaut Profil) ; ✓ → cadre sélectionné, N + 1 | — |
| Choisir Point | toucher la puce | sélection, N + 1 ; retoucher : désélection | — |
| Dans le Circuit | cartes IN_TOUR | même présentation, écart 9 | — |
| Longue séquence | contenu > écran | défilement jusqu'au dernier emplacement, pied visible | — |
| Confirmer / Annuler | — | inchangés | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/PlacementLayer.tsx` -- emplacements (puces, cadres), sélection, accessibilité.
- `src/features/sessions/OccurrenceCard.tsx`, `ActivityRecoveryLine.tsx` -- ligne 3 en placement.
- `src/features/sessions/CompositionScreen.tsx` -- montage des emplacements, atténuation, défilement (`bodyContent`, pied), rangées.
- `src/features/sessions/CompositionSequence.tsx`, `compositionRail.ts` -- rail à travers les rangées.
- `src/domain/sessions/placement.ts` -- positions autorisées (lecture seule).
- Tests : `CompositionScreen.test.tsx` (bloc placement), `PlacementLayer` tests, `CompositionPausesFlow.integration.test.tsx`.

## Tasks & Acceptance

**Execution:**
- [ ] Puce de point d'arrêt centrée raccordée au rail + tests.
- [ ] Cadre de récupération en ligne 3 des cartes éligibles + tests.
- [ ] Cartes non atténuées, inactives + tests.
- [ ] Défilement jusqu'au dernier emplacement sous le pied + tests.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert ; tests de comportement du placement (4.1, 4.2, 4.3) inchangés.
- Given un iPhone, when on place des pauses, then le rendu suit `8328:29270` (Hermann, J4).

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npx jest src/features/sessions src/domain/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
