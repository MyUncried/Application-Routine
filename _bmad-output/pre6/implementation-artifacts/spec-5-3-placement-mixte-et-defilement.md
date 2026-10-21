---
title: 'Story 5.3 — Placement mixte et défilement'
type: 'feature'
created: '2026-10-21'
status: 'done'
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
- [x] Puce de point d'arrêt centrée raccordée au rail + tests.
- [x] Cadre de récupération en ligne 3 des cartes éligibles + tests.
- [x] Cartes non atténuées, inactives + tests.
- [x] Défilement jusqu'au dernier emplacement sous le pied + tests.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert ; tests de comportement du placement (4.1, 4.2, 4.3) inchangés.
- Given un iPhone, when on place des pauses, then le rendu suit `8328:29270` (Hermann, J4).

## Implementation Notes

- **Figma (lecture seule, 21/10/2026).** `get_metadata` de `8328:29270` et `9798:19918` ; `get_design_context` de la carte `9839:19099` (cadre `9848:18968`), de la rangée `9840:18981` (puce `9849:43089`) et du point posé `9843:18974` ; capture de `8328:29270`. Relevés à 402 (carte 370) : cadre x 260–366, y 51–75 (ligne 3 à y 52, son contenu à y 54, colonne des valeurs x 266–362), pointillé 1,5 `#0508E5`, fond 5 %, rayon 10, texte Semi Bold 11 `#0508E5` calé à droite (bord à 9,5 du bord droit du cadre), sablier gris de la carte ; puce 96 × 22 centrée, pointillé 1 `#0508E5`, fond 5 %, rayon 10, marges 10 / 4, intervalle 6, barres 3 × 10 `warning`, texte Medium 10 **`text-label`** ; point posé : rangée 24, puce posée (`#C8C8D7`, rayon 12) de 22. `#0508E5` = `colors.primary` (vérifié) ; le fond 5 % reste une constante locale. Compte à rebours, en-tête du Circuit et Fin non atténués dans Figma (seul le « + » l'est).
- **Présentation (logique inchangée).** `PlacementLayer.tsx` : `PlacementStopPointRow` (rangée sous la carte, ou après le Circuit) et `PlacementRecoveryFrame` (ligne 3) remplacent `PlacementSlotRow`. La rangée sous une carte n'existe en placement que pour un emplacement de point ou un point déjà présent. `placement.ts`, sous-brouillon, N, roulette, Confirmer / Annuler, D-301 : aucun changement.
- **Cibles tactiles réelles (revue 5.3, mécanisme).** Sous Fabric iOS, `RCTViewComponentView -hitTest:` écarte un point hors des limites d'une vue qui ne découpe pas mais n'a aucun débordement mesuré (`clipsToBounds || overflowInset == {}`) : ses enfants ne sont pas interrogés, et le `hitSlop` d'un enfant (appliqué par son seul `pointInside:`) est sans effet au-delà du parent. Chaque cible est donc une BOÎTE réelle : le `Pressable` reçoit la taille voulue par des marges internes (ou une hauteur) compensées par des marges négatives égales — l'encombrement dans la mise en page ne change pas, et la boîte qui dépasse crée un `overflowInset` chez tous ses ancêtres, qui laissent alors passer le toucher. Le dessin (puce, cadre, cercle) est une vue intérieure (`…-face`, `…-circle`, `…-content`). Appliqué à :
  - **5.3** : puce de placement (22 + 2 × écart : 38, 40 dans le Circuit, après le Circuit 38), cadre « Récupération » et récupération existante (`occurrenceRecoveryTouchExtent` : du bas de la ligne 2 au bord intérieur de la carte, 29 / 30, la carte `overflow: hidden` les contient).
  - **5.1 (corrigé)** : la récupération hors placement (`occurrenceRecoveryHitSlop` → `occurrenceRecoveryTouchExtent`) avait un `hitSlop` de 4 / 10 qui dépassait la ligne 3 (17) : seule la boîte de 15 répondait. L'ancre de la bulle « Retirer » reste le contenu (sablier et valeur), pas la cible.
  - **5.2 (corrigé)** : bornes (`boundaryHitSlop` → `boundaryTouchExtent`, boîte de 44, encombrement 27 / 24 conservé ; la limite d'écart et la marge de la Fin sous une puce sont inchangées), puce posée hors placement (`STOP_POINT_CHIP_HIT_SLOP` → `STOP_POINT_CHIP_TOUCH_EXTENT`, boîte de 30 dans la rangée de 22), œil du Circuit (`Pressable` de 44 × 44 autour du cercle de 32, marges −6 / −12,5 : le `hitSlop` de 6 dépassait la ligne du titre), chiffre du compteur (`minWidth` 44, marge −12 : le `hitSlop` gauche dépassait l'élément accessible qui l'enveloppe). Les écarts calculés de l'en-tête (`CIRCUIT_HEADER_TOUCH_GEOMETRY`) sont inchangés.
  - **Non changé** : les ± du stepper révélé (`InlineStepper`, `ProfileStepper.tsx`, partagé avec la Feuille PRE-5) — consigné dans `deferred-work.md`. Les actions de l'en-tête de la Composition (« Ajouter un arrêt », « + », Étiquette) ne sont pas dans la Séquence et n'ont pas été revues.
  - Tests : les attentes ne lisent plus `hitSlop` mais les dimensions réelles (hauteur, marges, marges internes) et vérifient l'absence de `hitSlop` et les rectangles disjoints. La géométrie reste calculée depuis les styles (tests en partie tautologiques) : la preuve au toucher appartient au jalon J4.
- **Cadre « Récupération » (revue 5.3).** Dans le flux de la ligne 3 (plus en absolu) : la colonne des valeurs (`minWidth` 35 %, `maxWidth` 60 %, sans largeur) s'élargit à la mesure du cadre, les Zones (`flex: 1`) cèdent ; « Récupération » ne s'abrège donc ni à 375 ni à 360 (texte ≈ 72, cadre ≈ 104 ; 60 % de la largeur utile vaut 141 à 360) — à confirmer sur appareil. Débord de 4 de chaque côté de la colonne (Figma : 6 à gauche) : à gauche, borné à l'écart entre les colonnes (aucun recouvrement des Zones, aucun toucher sur elles) ; le sablier reste dans la colonne des symboles. `OCCURRENCE_RECOVERY_FRAME` : 3 au-dessus du contenu de la ligne, hauteur 24.
- **Cadre sélectionné (choix, aucun état dans Figma).** Plein `primary`, même sablier de 13 teinté en blanc (pas de décalage) et DURÉE SEULE (« 30 s », format de la ligne 3). Nom accessible inchangé, valeur dans `accessibilityValue`, indice « Un toucher retire cet ajout. ».
- **Récupération existante en placement.** `OccurrenceRecovery` en ligne 3, valeur effective (`recoveryChanges` puis donnée), touchable (`onPressExistingRecovery`, non comptée dans N), bouton « Récupération {durée} après {exercice}, toucher pour modifier » (revue 5.3 : texte de `composition.pauses.modifiableRecoveryAccessibilityLabel` étendu avec l'exercice, comme le cadre et la puce ; le libellé de la story 4.2 ne le nommait pas). Sans appui long en placement : `onLongPress` absent, un appui lent ouvre aussi la roulette. **À 0, affichée « 0 s » en placement** (`showZero`) pour rester modifiable (stories 4.1 / 4.3) ; hors placement, rien à 0 (D2). Une récupération affichée sans contrôle (placement sans emplacement de récupération, ou carte inerte) est retirée de l'accessibilité.
- **Points d'arrêt posés en placement.** Rangée de 22, comme hors placement (revue 5.3 ; Figma : 24), puce posée `StopPointChipFace`, non interactive, nommée « Point d'arrêt après … ». Un point présent dans le brouillon à un emplacement que le placement ne propose plus (avant la Fin, par exemple) reste affiché : la source est `stopPointDisplay` (comme hors placement), pas les seuls emplacements autorisés.
- **Accessibilité.** En placement, la carte (`Pressable` `disabled`) est `accessible={false}` ; `OccurrenceCard` (`hideContentFromAccessibility`) masque média, nom, libellés et ligne 2. VoiceOver lit le cadre ou la récupération existante, puis la puce.
- **Cartes, bornes, en-tête (D6 et revue 5.3).** Plus d'atténuation (Figma `8328:29270`) ; toujours inactifs (cartes `disabled`, bornes et en-tête `pointerEvents="none"` et masqués à l'accessibilité). Le « + » reste atténué (Figma). `CircuitHeader` garde le nom de prop `isAttenuated`.
- **Rail.** Queues jusqu'au bas du bloc, rangées comprises : continuité sans trou, longueurs des liens inchangées. Aucun point de raccord en placement (Figma n'en dessine aucun) ; hors placement, le `RailDot` du point posé est inchangé.
- **Défilement.** Rien à corriger : pied hors du `ScrollView` (`flex: 1`), après lui, `marginBottom` = `insets.bottom + 16` ; contenu défilant terminé par `paddingBottom` 16. Test structurel.
- **Non traité (consigné).** Dynamic Type (déjà différé en 5.1) ; récupération corrompue (NaN, négative) en placement, ni affichée ni modifiable (rare) ; saut de défilement à l'entrée ou à la sortie du placement (J4) ; ± du stepper révélé ; tests de géométrie en partie tautologiques, preuve sur appareil à J4. Voir `deferred-work.md`.
- **Tests.** Modifiés (rendu changé par D-435 / 5.3, ou cibles réelles) : `CompositionScreen.test.tsx` (placement, bornes 2.1 / 5.2, récupération 5.1, rail 5.2, en-tête 3.1 / 5.2), `CircuitHeader.test.tsx` (œil, chiffre), `RemovalBubble.test.tsx` (puce posée), `CompositionPausesFlow.integration.test.tsx` (accès par le nouveau nom accessible, attentes inchangées). Bloc « placement mixte et défilement » : 18 tests (matrice, appui lent, défaut Profil 45 s, sélection, Circuit, cibles du cadre et des puces, cadre non abrégé et Zones, cartes / bornes / en-tête, glisser et balayage, point posé sous A, point à un emplacement non proposé, récupération inerte masquée, rail, défilement).
- **Points pour Hermann (J4).** « 0 s » en placement ; cadre sélectionné à durée seule ; nom accessible « … après {exercice} » ; points posés en rangée de 22 (Figma 24) ; débord gauche du cadre 4 (Figma 6) ; aucun point de raccord sur le rail en placement ; cibles 29 / 30 (cadre, récupération) et 38 / 40 (puces) au lieu de 44 ; texte de la puce `text-label` (Figma) ; dernière puce de `8328:29270` juste avant la Fin : illustrative, la règle l'emporte ; `9798:19918` (zone tactile de la ligne 3 entière) non suivie (D7).

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | blind + edge | Cibles portées par un `hitSlop` hors des limites du parent, sans effet sous Fabric iOS (puces, cadre, récupération ; aussi 5.1 et 5.2 : récupération, bornes, œil, chiffre du compteur) | high | patch : boîtes tactiles réelles (marges internes compensées) ; tests de dimensions et de disjonction. ± du stepper partagé avec PRE-5 : `deferred-work.md`. |
| 2 | blind + edge | Appui lent sur une récupération existante en placement : roulette jamais ouverte | high | patch : `onLongPress` indéfini quand absent ; test d'appui lent. |
| 3 | blind | « Récupération » tronqué à 375 ; cadre débordant sur les Zones | medium | patch : cadre dans le flux, débord borné à l'écart ; test. Troncature réelle : J4. |
| 4 | edge + blind | Nom accessible sans l'exercice ; valeur non interactive lue seule ; assertion morte | medium | patch ; tests. |
| 5 | edge | Point existant à une position non proposée disparu en placement | medium | patch : affiché non interactif, rangée conservée ; test. |
| 6 | verification-gap | Bornes et en-tête atténués contrairement à Figma | medium | patch : non atténués, inactifs. |
| 7 | blind | Saut de 2 (rangée 24) ; sablier sélectionné décalé | low | patch : 22, sablier 13. |
| 8 | verification-gap | Tests manquants (point existant sous A, cadre sélectionné, balayage en placement, défaut Profil 45 s) | low | patch : tests. |
| 9 | edge + blind | Dynamic Type ; récupération corrompue ; saut de défilement ; tests géométriques en partie tautologiques | low, différé | `deferred-work.md` ; J4. |
| 10 | verification-gap | Aucun point du rail en placement ; cibles < 44 ; « 0 s » en placement ; cadre sélectionné durée seule ; texte de puce `text-label` | — | Soumis à Hermann (J4). |

## Verification

**Commands:**
- `npx jest src/features/sessions src/domain/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
