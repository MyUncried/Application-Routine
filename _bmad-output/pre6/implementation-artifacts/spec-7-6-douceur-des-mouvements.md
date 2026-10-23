---
title: 'Story 7.6 — Douceur des mouvements de la Composition'
type: 'feature'
created: '2026-10-23'
status: 'review'
baseline_commit: '9c418822'
route: 'dispatch'
review_loop_iteration: 1
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-7-4-glisser-defilement-automatique-et-coherence.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-7-5-retours-j6-suppression-tolerante-animee-cadre-circuit.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Recette J6b de Hermann (23/10), sur iPhone : « Le fondu est trop rapide, le mouvement des cartes aussi et est parfois saccadé. Quand on déplace une carte, le positionnement de la carte est trop rapide, on a l'impression qu'elle saute dans sa position cible. Il faut que tous les mouvements soient plus doux avec une fin de mouvement progressive. » ; « Dans l'animation, l'arrêt des mouvements peut être moins brutal. »

**Approach:** un seul jeu de durées et de courbes (`compositionMotion.ts`) pour tous les mouvements de la Composition ; à la dépose, l'élément déposé part de l'endroit du lâcher et glisse jusqu'à sa place ; un dépôt pendant le décalage des voisines les laisse achever leur chemin ; fondu et glissement de la suppression se chevauchent.

## Boundaries & Constraints

**Always:**
- Sources : epics.md « Story 7.6 » (commit `31bbc3bc`) ; specs 2.3b, 5.2b, 7.4, 7.5.
- **AC1** : fondu et glissements plus lents, décélération progressive jusqu'à l'arrêt.
- **AC2** : à la dépose d'une carte ou d'un Point (directe, ou après « Confirmer » du dialogue de perte ou un choix de Tour), l'élément rejoint sa place par un mouvement doux, sans saut ; retour d'une dépose refusée ou annulée et décalages pendant le glisser : même jeu de mouvements.
- **AC3** : animations sur le pilote natif, aucune écriture d'état pendant un mouvement du registre, un seul jeu de durées et de courbes.
- **AC4** : aucune régression de d-13 à d-17, j6b-1 à j6b-8, du placement, de `guardNativeEcho` / `resyncNative` ; « Réduire les animations » : mouvements immédiats comme aujourd'hui ; verrous de la suppression animée adaptés (ils suivent l'état, pas une durée).

**Never:**
- Aucune modification de `docs/`, `.github/`, `_bmad-output/pre6.zip` ; aucune nouvelle dépendance ; `tokens.ts` inchangé ; aucun changement de règle métier.

## I/O & Edge-Case Matrix

| Scenario | Expected |
|---|---|
| Dépôt appliqué d'une carte / d'un point | l'élément glisse de l'endroit du lâcher à sa place (320 ms, décélération), au premier plan, hors de la chaîne du rail le temps du mouvement |
| Dépôt pendant le décalage des voisines | les voisines achèvent leur chemin depuis la position atteinte |
| « Confirmer » (perte) / choix de Tour après un dépôt tenu | la carte tenue glisse à sa place |
| Dépose refusée / « Annuler » | retour (320 ms, même courbe) |
| Suppression | fondu 260 ms ; glissement lancé à 120 ms ; écriture à la fin du glissement |
| « Réduire les animations » | tout est posé sans mouvement |

</frozen-after-approval>

## Code Map

- `src/features/sessions/compositionMotion.ts` (nouveau) : durées, délai, courbe.
- `src/features/sessions/useAnimatedShift.ts` : durée / courbe partagées ; `prepareLayoutCommit(pose)` ; position estimée des mouvements (`motions`, `carried`, `position`).
- `src/features/sessions/compositionGesture.ts` : `resolveDropSettleOffset`.
- `src/features/sessions/CompositionScreen.tsx` : `finishAppliedDrop`, `dropSettlePose`, `heldDropSettlePose` ; fondu chevauché.
- Tests : `compositionMotion.test.ts` (nouveau), `useAnimatedShift.test.ts`, `CompositionScreen.test.tsx`.
- `src/features/sessions/README.md`.

## Tasks & Acceptance

**Execution:**
- [x] Jeu de mouvements partagé et branchement (registre, fondu).
- [x] Dépose : pose de départ et glissement à la place (dépôt direct, « Confirmer », choix de Tour).
- [x] Dépôt en plein mouvement : reste du chemin.
- [x] Tests, README.

**Acceptance Criteria:**
- Given l'arbre entier, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert.
- Given un iPhone, when le jalon J6c est mené, then les mouvements sont jugés doux par Hermann.

## Implementation Notes

**« Saute dans sa position cible » — cause prouvée.** Au dépôt appliqué (`handleDropItem` → `finishDragPreview(false)`), la translation locale de la carte (suivi du doigt) revenait à 0 et toutes les translations de l'aperçu étaient mises à 0 (`prepareLayoutCommit`, story 7.4) dans le rendu même de la nouvelle disposition, sans animation : la carte passait d'un coup de l'endroit du lâcher (jusqu'à une demi-carte de décalage) à sa place. Même chose après « Confirmer » et après un choix de Tour. Preuve : le test écran « dépôt appliqué : la carte part de l'endroit du lâcher » relève 0 au lieu de 58 sans le correctif. Correctif : `resolveDropSettleOffset` calcule, sur la disposition de l'aperçu (celle que le dépôt produit), la translation qui garde l'élément sous le lâcher dans la nouvelle disposition ; `prepareLayoutCommit(pose)` l'y pose avant le rendu, puis le registre l'anime vers 0 (l'élément reste au premier plan et hors de la chaîne du rail jusqu'à la fin, comme le retour d'une dépose refusée).

**« Parfois saccadé » — causes** (courbes définitives : voir les choix 3 et la revue).
- Prouvée et corrigée : un dépôt pendant le décalage des voisines (180 ms avant, 320 désormais) les faisait sauter à leur place — `prepareLayoutCommit` arrêtait leur animation et les posait à 0 avec la nouvelle disposition. Le registre estime désormais la position atteinte (courbe et temps écoulé ; la valeur JS n'avance pas sur le pilote natif) et pose chaque élément au reste de son chemin, que l'animation suivante achève. Test écran « dépôt pendant le décalage des voisines ».
- Prouvée et corrigée : fondu (150 ms) puis glissement (180 ms) enchaînés, courbes différentes (`Easing.out(quad)` / `Easing.out(cubic)`) — arrêt marqué entre les deux ; désormais une courbe, chevauchement.
- Non corrigées, signalées : (1) la carte soulevée suit le doigt par un état React (`setDragTranslationY`, un rendu de la rangée à chaque mouvement) et non par une valeur animée — une charge du fil JS peut la faire hésiter ; (2) chaque changement d'emplacement pendant le glisser relance les animations des voisines depuis leur position, la nouvelle partant à pleine vitesse (courbe à décélération) — changement de vitesse visible si l'emplacement change vite ; (3) le démarrage d'une animation attend la fin du rendu de l'écran (microtâche après le commit) : un rendu lourd la retarde. Aucune ne relève du pilote JS : toutes les animations du registre et le fondu sont sur le pilote natif.

**Choix non dictés (à valider en J6c)**
1. Glissements, mise en place, retours, Circuit : 320 ms (180 avant).
2. Fondu : 260 ms (150 avant) ; glissement de la suppression lancé à 120 ms du fondu (chevauchement) : 440 ms au total (330 avant), écriture à la fin.
3. Glissements : Bézier (0,33 ; 1 ; 0,68 ; 1) (« ease-out cubic »), décélération sans rebond, départ environ deux fois plus lent qu'avant (le « quint » (0,22 ; 1 ; 0,36 ; 1) proposé démarrait aussi brusquement que l'ancienne courbe de 180 ms — revue) ; fondu : Bézier (0,4 ; 0 ; 0,2 ; 1), départ et fin progressifs. Préférées à un ressort : durée connue (verrous, enchaînements) et aucune oscillation.
4. Dépôt en plein mouvement : chaque voisine repart du point estimé (départ natif compté une image plus tard) pour une nouvelle animation de 320 ms (fin plus tardive que l'originale, sans saut) ; les bords du Circuit, dont la bande s'étire sur la hauteur relevée au début du geste, sont posés à leur place (pas de continuation).
5. Pendant la mise en place (320 ms), l'élément déposé reste au premier plan et hors de la chaîne du rail (le rail des voisines traverse sa place), comme pour un retour refusé.

## Spec Change Log

## Review Triage Log

Trois revues indépendantes du 23/10/2026 (aveugle, cas limites, écarts de vérification), sous-agents en lecture seule.

**Corrigés**
1. Moyen (aveugle 1) — bande du Circuit mal étirée si ses bords sont « continués » au dépôt (hauteur de base périmée) : bords du Circuit exclus de la continuation.
2. Moyen (aveugle 2, cas limites B3) — estimation en avance sur le pilote natif (départ à l'image suivante, courbe raide) : départ compté une image (16 ms) plus tard ; courbe moins raide (point 6).
3. Moyen (aveugle 3) — choix de Tour d'un Point glissé : le point peut aller à l'autre borne — aucune pose de mise en place dans ce cas.
4. Moyen (aveugle 4, cas limites M1) — points retirés par le déplacement tolérant au-dessus de la place : place finale corrigée (`removedIds`), dépôt direct, choix de Tour d'une carte, « Confirmer ».
5. Bas-moyen (aveugle 5, cas limites B4) — recopie native d'une animation arrêtée reçue pendant la nouvelle : ignorée et ramenée au départ de la nouvelle (`echoExpected`).
6. Moyen (cas limites M2) — courbe « quint » aussi brusque au départ qu'avant, fondu plus rapide au début : glissements en « ease-out cubic » (départ deux fois plus lent), fondu en courbe douce aux deux bouts ; tests.
7. Bas (aveugle 6, cas limites B6) — écriture de la suppression possible avant la fin du fondu : elle attend fondu ET glissement.
8. Bas (cas limites B1) — continuation seulement quand l'`apply` suivant est animé (pose de mise en place) ; ailleurs, tout à 0 comme en 7.4.
9. Bas (aveugle 7, cas limites B5) — pose calculée avec la hauteur d'insertion prédite de l'aperçu.
10. Bas (vérification G1, G2, G5, G6, G9) — tests : « Confirmer » (pose puis glissement), dépôt d'un Point (pose puis glissement), suppression non écrite entre la fin du fondu et celle du glissement, position estimée à mi-course, commentaires de tests.

**Acceptés / signalés**
- Cas limites B2 — `prepareLayoutCommit` non idempotent (second appel : reste nul) : seul double appel (`enterPlacement`) où c'est le bon résultat.
- Aveugle 8 — place finale d'un Circuit vide supposée à la marge basse : géométrie actuelle (pas de pied de Circuit).
- Aveugle 9 — `animated` de la session après un dépôt sans pose : inchangé depuis 7.4 (pose immédiate).
- Vérification G3, G4 — choix de Tour : valeur de pose non chiffrée ; configuration réelle du fondu non captée par un test (constantes vérifiées).
- Vérification G8 — feuille « Volumes du circuit » (`CircuitVolumesSheet`) hors périmètre : feuille modale, pas un mouvement de la séquence.
- Nouveau glisser pendant la mise en place : `reset` pose tout à 0 (saut accepté, story 5.2b).

## Verification

**Commands:**
- `npm test -- --maxWorkers=2`
- `npx tsc --noEmit`
- `npm run lint`

**Manual checks (J6c)** : glisser une carte et un Point vers le haut et le bas, dans le Circuit et hors du Circuit ; lâcher loin de la place visée, puis juste après un changement d'emplacement ; supprimer une carte ; dialogues de perte et de Tour ; « Réduire les animations ».
