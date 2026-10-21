---
title: 'Story 5.2 — Rail segmenté, Circuit, bornes et points d''arrêt'
type: 'feature'
created: '2026-10-21'
status: 'done'
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
- [x] Largeur des cartes et de la séquence (370 à 402, adaptatif) + tests.
- [x] Rail segmenté calculé + anneaux + point des points d'arrêt + tests (dont glisser).
- [x] Circuit (aplat, débord, rayon, espacements, fond animé recalé) + en-tête + tests.
- [x] Point d'arrêt hors placement centré + tests.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert ; attentes modifiées seulement là où D-435 change le rendu.
- Given un iPhone, when on ouvre et manipule la Composition, then rail, Circuit et points suivent `8328:28605` (Hermann, J4).

## Implementation Notes

- **Figma (lecture seule, 21/10/2026).** `get_metadata` de `8328:28605` et `9798:19935`, `get_design_context` de la Séquence `9819:19905` ; SVG des anneaux et du point lus pour leur trait (aucun asset importé). Relevés à 402, dans le repère de la colonne (x 24) : Compte à rebours 0–27 (contenu 24 + `pb 3`, anneau 7–17), carte 35–115 (média 43–107), Circuit 123–369 (marge 14, en-tête 137–177 avec anneau 152–162, cartes 186–266 et 275–355, écart 9), rangée de point 377–399 (point 385–391), carte 407–487, Fin 495–519 (24, anneau 502–512). Segments `9819:20056`–`20061` : 17–43, 107–152, 162–194, 258–283, 347–415 (passe sous le point), 479–502 — tous d'un bord de média ou d'anneau à l'autre, x 31,25 + 0,75 = 32 (56 à 402). Anneau : cercle de 10 blanc, contour EXTÉRIEUR 1,5 `#7A7A80`. Point : 6, `#7A7A80`. Puce du point `9819:20063` : identique à `StopPointChip` (96 × 22), centrée (x 201).
- **Architecture du rail (choix).** Option « chaque bloc dessine ses segments », retenue sur l'option « couche calculée depuis les mesures » pour une raison d'ordre de peinture : le rail doit passer AU-DESSUS des marges des cartes (jusqu'au bord du média) et de l'aplat du Circuit, mais SOUS la carte soulevée ; or le correctif 2.3b passe toute la zone (ou tout le Circuit, aplat compris) au premier plan pendant le glisser — une couche unique aurait disparu sous l'aplat du Circuit à chaque glisser d'une de ses cartes. Chaque élément (Compte à rebours, occurrence, en-tête du Circuit, bas du Circuit, rangée après le Circuit, Fin) porte, dans son repère et sous sa translation : sa queue (de son ancre à son bord bas, longueur donnée par sa propre mise en page : rangée du point ou emplacement de placement compris) et son lien vers le HAUT jusqu'au bord bas de l'élément visible précédent. La longueur d'un lien au repos est une somme d'écarts de conception (`resolveRailLinks`, `compositionRail.ts`, fonction pure testée par une simulation de mise en page en flux) — aucune coordonnée d'exemple, aucun nombre de segments. Ces écarts sont les MÊMES constantes que les styles (`SEQUENCE_GAP`, `CIRCUIT_GAP`, `CIRCUIT_PADDING_VERTICAL`, ancre du média `OCCURRENCE_CARD_MEDIA.top`, anneau de Fin `BOUNDARY_RING_TOP`) ; l'anneau du Circuit suit la hauteur MESURÉE de l'en-tête (`circuitHeaderLayout`, 40 avant mesure). Pendant le glisser, chaque lien s'étire de `shift - prevShift` par `scaleY` à bas fixe, avec les valeurs animées MÊMES qui translatent les deux éléments : registre partagé `AnimatedShiftRegistry` (`useAnimatedShift.ts`) qui remplace les `useAnimatedShift` par élément (une copie aurait divergé au retour d'un dépôt refusé ou à « Annuler » d'une perte). L'occurrence glissée sort de la chaîne : son successeur se relie à son prédécesseur à travers sa place (hauteur relevée au début du geste). Le bas du Circuit est un élément à part (lien ancré au bord bas du conteneur, piste `circuitBottom`) : il garde le rail sur l'aplat quand le Circuit est au premier plan et quand il s'agrandit. Cas vérifiés par tests : vide, avant / dans / après, Circuit vide, point après A, point après le Circuit, glisser vers le bas, entrée par le bas (étirement à travers l'emplacement ouvert), rétraction bornée à 0.
- **Démarrage différé (constat pendant l'implémentation).** Les valeurs étant partagées, le graphe animé relie plusieurs éléments ; React Native détache les propriétés animées d'un composant démonté dans une microtâche (`createAnimatedPropsHook`) : une animation native démarrée dans le même rendu qu'un démontage (lien de la carte glissée, occurrence supprimée pendant le geste) atteignait le composant démonté (« Unable to find node on an unmounted component »). Le registre démarre donc ses animations dans une microtâche (jeton par clé : une pose ultérieure annule le démarrage en attente) ; la pose immédiate (dépôt appliqué, « Réduire les animations ») reste synchrone, avant l'affichage.
- **Largeurs (360 / 402 / 440).** Marges constantes, aucune largeur : colonne à 24 (`bodyContent`), listes de cartes à −8 (`exerciseList`, Circuit compris), Circuit à −16 avec `paddingHorizontal` 16. Écart du glisser : `DragShiftGaps.circuitRow` (9) ajouté, `DRAG_SHIFT_GAPS` = 8 / 9 / 8 / 9 ; `compositionGesture.test.ts` adapté (fixture `circuitRow` = `row`) et complété d'un cas à écarts distincts.
- **Carte.** Média à 8 du bord EXTÉRIEUR avec ou sans bord (`paddingLeft = 8 − bord`) : le Standard `8328:28605` le pose ainsi (`pl 7` + bord 1), la carte v2 `9798:44464` à 9 (story 5.1). Retenu pour que le rail passe par le centre du média (x 56) ; 1 point d'écart entre les deux sources, soumis à Hermann. `OCCURRENCE_CARD_MEDIA` exporté (ancre du rail) ; prop `inCircuit` d'`OccurrenceCard` retirée (plus d'effet). Cible de la récupération (5.1) inchangée : `occurrenceRecoveryHitSlop` ne dépend que des constantes verticales.
- **Circuit.** Aplat `#F3F4F9` (constante locale `CIRCUIT_SURFACE_COLOR`, D5), rayon 18, débord 8, marge 14, écart 9, plus de `minHeight` (Circuit vide : 14 + 40 + 14) ; `CircuitSurface` et le fond statique recalés ; rangées du Circuit sur le même aplat (fond révélé par le balayage). `tourSurface` et `dimensions.compositionTourSection` inchangés (`SWIPE_REVEAL_OFFSET` utilise encore `inset`, refonte 5.4). En-tête : une ligne de hauteur minimale 40, titre à `titleInset` 45, œil, compteur à la suite (D4), durée calée à droite ; ordre de cession de la place et cibles tactiles : voir « Revue ».
- **Bornes et point d'arrêt.** `BoundaryStep` reçoit `kind` : Compte à rebours 27, Fin 24 (relevé des nœuds ; la spec annonçait 27 pour les deux). Marges tactiles portées à 44 sans dépasser l'écart de 8 vers la carte (Compte à rebours 10 / 7, Fin 8 / 12 ; Fin 4 / 16 sous une rangée de point d'arrêt, voir « Revue ») : l'ancien `hitSlop` de 10 empiétait de 2 sur la première et la dernière carte. Point hors placement : rangée de 22 centrée, à l'écart de la zone sous la carte (8, 9 dans le Circuit) ; point de raccord sur le rail au centre de la rangée. La puce garde sa marge tactile 4 / 4 (dans l'écart).
- **Tests modifiés (rendu changé par D-435).** Écarts 6 → 8 (corps, liste, rangée du point), Circuit (couleur, rayon 18, débord 16), en-tête sur une ligne (CompositionScreen, CircuitHeader), bornes 27 / 24 et cible tactile, puce centrée de 22, média à 7 + bord, rail (anneau 13 / 1,5 / `#7A7A80` ; plus de rail continu ni de repère d'occurrence : trois tests de repères remplacés par des tests de rail), pas du glisser 2.3b (8 hors Circuit, 9 dedans : `PITCH`, `CIRCUIT_PITCH`, bande au rayon 18). **Ajoutés** : `compositionRail.test.ts` (7 tests), matrice 5.2 au repos (6 tests), rail pendant le glisser (3 tests), cas `circuitRow` de `compositionGesture.test.ts`. Aucun test de comportement affaibli ; garde-fous des roulettes intacts.
- **Limites connues, non traitées ici.** Le rail ne suit pas le balayage (le rail ne glisse pas) : carte ouverte, les segments restent sur l'axe et le média s'en écarte (refonte des actions glissées en 5.4). La carte soulevée n'a plus de rail (le repère qui la suivait disparaît avec D-435). Pendant une confirmation de perte, l'occurrence reste hors chaîne (aperçu conservé, comportement 2.3b), puis jusqu'à la fin de son retour. En placement, le rail traverse l'emplacement et passe sous les puces (translucides en pointillés : visible au travers ; refonte 5.3). Panneau de nature Android / web toujours ancré au bord droit (`deferred-work.md`).
- **Points pour Hermann (J4).** Média à 8 (Standard) contre 9 (carte v2) ; Fin de séance 24 contre 27 annoncé ; densité de l'en-tête avec le compteur révélé (risque R7, traité en revue : la durée puis le titre cèdent ; « Circuit » s'abrège à 360 compteur ouvert, et à 320 en « séries » la ligne est à 1 ou 2 points de sa limite selon la largeur réelle de la pastille) ; rail fixe pendant le balayage ; carte soulevée sans rail.
- **Revue 5.2 (correctifs appliqués).**
  - En-tête du Circuit : cibles de l'œil et du compteur DISJOINTES — écart œil → compteur calculé (`CIRCUIT_HEADER_TOUCH_GEOMETRY`) : au repos 6 + 12 = 18 (marge de l'œil + marge gauche du chiffre, cible du chiffre gardée à 44), révélé 6 + (10 − 4) = 12 (débord de la cible du « − », `INLINE_STEPPER_STEP_HIT_SLOP` exporté de `ProfileStepper.tsx`). Plus de `gap` de rangée : espacements portés par chaque enfant ; pas d'écart réservé avant la durée (elle peut toucher le compteur une fois tronquée).
  - En-tête étroit : le compteur (emplacement, stepper, pastille) ne rétrécit jamais ni ne quitte la ligne ; la durée cède d'abord (base 0, `flex: 1`), puis le titre (`flexShrink: 1`, `minWidth: 0`, ellipse). Largeur fixe compteur révélé, titre effacé : 45 + 8 + 32 + 12 + stepper (168 « tours ») = 265, sous la colonne de 272 à 320. `minHeight: 40` (Dynamic Type) ; l'anneau, son lien et sa queue suivent la hauteur mesurée de l'en-tête (le haut reste à la marge 14, dans le flux).
  - VoiceOver : le titre porte « Circuit, {durée} » ; la durée affichée à droite est retirée de l'accessibilité (`accessible={false}`, `importantForAccessibility="no"`).
  - Retour en douceur (dépôt refusé, geste interrompu, « Annuler » d'une perte) : l'occurrence reste hors du rail (`DragShiftSession.returning`) jusqu'à la fin des animations (`AnimatedShiftRegistry.whenSettled`) ; dépôt appliqué : retour immédiat.
  - Registre : démarrage différé revérifié (jeton, clé toujours visée, même cible, même valeur), `stopAll` oublie les cibles posées (relance au `apply` suivant), drapeau de mode retiré (seule la cible est mémorisée ; une pose immédiate fige une animation en cours vers la même cible), création pendant le rendu documentée comme idempotente et sans effet ; `useAnimatedShift` retiré (plus importé). Tests unitaires : `useAnimatedShift.test.ts`.
  - Fin de séance sous une rangée de point d'arrêt (dernière carte après le Circuit, ou rangée « après le Circuit » sans carte après) : marge haute = écart − marge de la puce (8 − 4).
  - Placement : anneau et queue des bornes posés hors de l'atténuation (`BoundaryRail`) ; tout le rail a la même opacité.
  - Hauteur de repli de la carte glissée non mesurée : carte + rangée de son point d'arrêt (écart de la zone + 22).
  - Nettoyage : `RailLink.shift` / `prevShift` et l'entrée `shifts` de `resolveRailLinks` retirés (copie de la correspondance de l'écran, sans logique propre) ; `RailNodeKind`, `OCCURRENCE_CARD_MEDIA.left` / `size` et constantes internes du rail non exportés ; jetons orphelins `compositionTourSection.radius` / `closedHeight` consignés.

## Spec Change Log

## Review Triage Log

| # | Gravité | Constat | Verdict |
|---|---|---|---|
| 1 | high | Marge tactile du chiffre recouvrant l'œil | patch : écart calculé, test des rectangles |
| 2 | high | Débordement de l'en-tête aux faibles largeurs (« + » intouchable sur Android) | patch : ordre de cession durée → titre, compteur fixe, `minHeight`, anneau sur la hauteur mesurée ; test |
| 3 | medium | Trou du rail pendant le retour en douceur | patch : `returning` jusqu'à `whenSettled` ; test |
| 4 | medium | Registre : ordre des microtâches, `stopAll`, effet de bord au rendu | patch + tests unitaires |
| 5 | low | Marge de la Fin et puce du point au-dessus | patch : 8 − 4 ; tests (deux cas) |
| 6 | low | Deux opacités du rail en placement | patch : rail des bornes hors atténuation ; test |
| 7 | low | Ordre VoiceOver de la durée | patch : nom du titre ; test |
| 8 | low | Repli de hauteur sans la rangée du point | patch |
| 9 | low | Tests tautologiques, code mort | patch : test unitaire de `RailLink` (rétraction à 0), anneau et libellé des bornes, en-tête / première carte, exports retirés, jetons orphelins consignés |
| — | — | Longueurs du rail issues des écarts ; Fin à 24 ; média à 8 ; écart du placement 8 / 9 ; rail fixe au balayage, carte soulevée sans rail | acceptés, sans changement |

## Verification

**Commands:**
- `npx jest src/features/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
