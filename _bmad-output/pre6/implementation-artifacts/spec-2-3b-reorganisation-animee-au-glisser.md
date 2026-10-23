---
title: 'Story 2.3b — Réorganisation animée pendant le glisser-déposer'
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: '875fc43b0c7290c78f4a7718b99bcee823967c79'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Pendant le glisser-déposer d'une carte d'exercice dans la Composition, les autres cartes restent immobiles jusqu'au dépôt ; l'emplacement d'insertion n'est pas matérialisé (demande de Hermann, recette iPhone du 21/10/2026).

**Approach:** Pendant le glisser, calculer en continu l'emplacement d'insertion avec la règle de dépôt existante (`resolveDropTarget`, `compositionGesture.ts`) et décaler progressivement, par animation, les cartes situées entre la position d'origine et l'emplacement visé pour libérer la place (réorganisation animée, « animated drag-and-drop reordering »). Le dépôt et ses règles ne changent pas.

## Boundaries & Constraints

**Always:**
- En temps réel pendant le glisser : chaque fois que l'emplacement d'insertion calculé change, les blocs concernés (carte + ligne de récupération / point, repère du rail) glissent vers leur nouvelle position : vers le bas glissé → les blocs traversés remontent de la hauteur du bloc déplacé (+ écart entre blocs) ; vers le haut → ils descendent. Plusieurs blocs traversés se décalent successivement ; revenir en arrière les ramène.
- Animation progressive (environ 150–200 ms, courbe douce), sur le pilote natif (`useNativeDriver`), sans ralentir ni entraver le geste : la carte soulevée suit toujours le doigt sans latence ; aucun recalcul de mise en page pendant le geste (translations seulement).
- L'emplacement visé est exactement celui que le dépôt appliquera (même fonction `resolveDropTarget`, mêmes zones avant / dans / après le Circuit). Au dépôt : les translations reviennent à 0 au moment où la nouvelle disposition s'affiche, sans saut visible ; dépôt invalide, dépôt refusé (point d'arrêt sur emplacement interdit) ou Annuler d'une confirmation de perte → les blocs reviennent en douceur à leur place.
- Entre zones : les blocs de la zone d'origine situés après la carte remontent ; ceux de la zone visée situés à partir de l'emplacement descendent ; le conteneur du Circuit n'est pas redimensionné pendant le geste (sa taille change au dépôt).
- « Réduire les animations » (`useReduceMotion`) : décalages immédiats, sans animation.
- Les actions accessibles Monter / Descendre (story 2.3) et le balayage ne sont pas modifiés.
- Logique de décalage dans une fonction pure testée (positions → décalage par bloc), animation dans l'écran / un hook dédié.

**Never:**
- Modifier la règle de dépôt, les confirmations, ou le brouillon pendant le geste (aucune mutation avant le dépôt).
- Nouvelle dépendance (pas de bibliothèque de glisser-déposer) : animations `Animated` de React Native.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Vers le bas | A B C, glisser A sous B | B remonte de la hauteur du bloc A | — |
| Plusieurs | glisser A sous C | B puis C remontent | — |
| Retour | revenir au-dessus de B | B redescend | — |
| Vers le haut | glisser C au-dessus de A | A et B descendent | — |
| Entre zones | A avant le Circuit → dans le Circuit | blocs du Circuit à partir de l'emplacement descendent | — |
| Dépôt | — | disposition finale sans saut, translations à 0 | — |
| Dépôt invalide / Annuler | — | retour en douceur | — |
| Réduire les animations | — | décalages immédiats | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/compositionGesture.ts` -- `resolveDropTarget`, mise en page des lignes (`buildDragLayout`).
- `src/features/sessions/CompositionScreen.tsx` -- `CompositionActivityRow` (réponse au geste, `dragTranslationY`, `blockTransform`), `handleDropActivity`, `moveActivityTo`, mesures `onLayout` des zones et lignes.
- `src/shared/ui/useReduceMotion.ts` ; `src/features/sessions/useAnimatedShift.ts` (animation 180 ms, pilote natif) ; `src/features/sessions/CircuitHeader.tsx` (translation pendant le geste).
- Tests : `compositionGesture.test.ts` (fonction pure de décalage), `CompositionScreen.test.tsx` (décalages pendant le geste, retour, réduire les animations).

## Tasks & Acceptance

**Execution:**
- [x] Fonction pure de décalage + tests (matrice).
- [x] Animation des blocs pendant le glisser, retour au dépôt / à l'annulation + tests.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert ; aucun test de dépôt existant modifié.
- Given un iPhone, when on fait glisser une carte, then les cartes traversées se décalent en temps réel avec fluidité (vérification Hermann).

## Implementation Notes

- Hauteur du bloc dans la zone visée (revue, point 5) : prédite. Le pas d’insertion utilise la carte telle que le dépôt la produirait (`planOccurrenceMove`, ligne « durée estimée » selon la zone et le Circuit de Séries adapté à N) ; la ligne de récupération est invariante (récupération et point d’arrêt suivent l’occurrence, ARB-3). Emplacement refusé (point d’arrêt interdit) : hauteur mesurée d’origine — aperçu conservé tel quel, à trancher par Hermann en J3.
- Limite à vérifier en J3 : le rail de la Séquence (`SequenceRail`) n’est pas décalé ; quand le décalage net (`end`) est non nul (Circuit vide : écart 12 au lieu de 6 ; carte qui gagne ou perd la ligne « durée estimée »), son extrémité basse s’écarte de quelques points du repère de « Fin de séance » pendant le geste.

## Spec Change Log

### Amendement Hermann du 21/10/2026 (remplace la limite « conteneur non redimensionné pendant le geste »)

Pendant le glisser, le conteneur du Circuit s'agrandit progressivement quand la carte y entre et se rétracte quand elle en sort, avec la même animation (150–200 ms, pilote natif) ; les éléments qui le suivent (occurrences après le Circuit, ligne après le Circuit, Fin de séance, repères du rail) se décalent d'autant. Mise en œuvre retenue (sans refonte) : fond du conteneur en trois couches absolues — haut arrondi, bande centrale sans rayon étirée par `scaleY`, bas arrondi — animées par translations sur le pilote natif ; aucun changement de mise en page pendant le geste (géométrie figée au début du glisser, même `resolveDropTarget`). Au dépôt, la mise en page réelle prend le relais sans saut. Composition inchangée tant que le dépôt n'est pas confirmé.

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | blind + edge | Emplacement calculé sur la mise en page vivante, décalages sur la géométrie figée | medium | patch : `resolveDropTarget(originLayout, …)` pendant le geste ; test. |
| 2 | blind | Translation de rangée écrasant celle de la carte soulevée | medium | patch : composition des transformations ; test. |
| 3 | verification-gap + blind | Second glisser après un dépôt appliqué ; ordre de remise à zéro dépendant du regroupement | medium | patch : test, ordre explicite. |
| 4 | edge | Écarts d'insertion ≠ écarts de retrait ; Fin de séance non décalée (contraire à l'amendement) | medium | patch : décalage net appliqué à la Fin de séance et au contenu final ; test. |
| 5 | edge | Hauteur du bloc différente dans la zone visée (ligne de durée estimée) | medium | patch si déterministe, sinon limite notée (J3). |
| 6 | edge | Aperçu périmé si l'occurrence disparaît pendant le geste | low | patch : garde ; test. |
| 7 | blind | Fond du Circuit sans garde (échelle, Circuit non mesuré) | low | patch. |
| 8 | blind | Dialogue de perte : saut à la confirmation | low | patch : aperçu maintenu ; Annuler / Confirmer testés. |
| 9 | blind | Commentaire périmé « REWORK07B » | low | patch. |
| 10 | blind | Trou affiché pour un emplacement refusé (point d'arrêt) | — | Soumis à Hermann (J3). |
| 11 | blind + edge | Image de remise à zéro du pilote natif au dépôt ; images perdues sur longue liste | low | Vérification sur appareil (J3). |
| 12 | blind | Glisser rapide : plusieurs blocs décalés d'un coup | low, rejeté | Chaque changement d'emplacement anime ; comportement attendu. |
| 13 | verification-gap | Test du nombre de rendus | low, différé | `deferred-work.md`. |
| 14 | blind | Amendement hors Change Log ; Code Map incomplète | low | patch (spec). |

## Verification

**Commands:**
- `npx jest src/features/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
