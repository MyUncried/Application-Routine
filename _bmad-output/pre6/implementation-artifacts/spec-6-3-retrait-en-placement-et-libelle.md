---
title: 'Story 6.3 — Retrait en placement, libellé, fin de la bulle des points'
type: 'feature'
created: '2026-10-22'
status: 'done'
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
- [x] Points existants sélectionnés et retrait programmé en placement + tests.
- [x] Emplacements selon l'état effectif + tests.
- [x] Libellé du bouton + tests.
- [x] Confirmer / Annuler / persistance (intégration) + tests.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert.
- Given un iPhone, when on retire et rétablit des points en placement, then les scénarios 9 à 12 de la recette de Hermann sont conformes (J5).

## Implementation Notes

*Première passe ci-dessous ; les corrections de la revue sont dans « Revue 6.3 » à la fin de cette section, qui l'emporte en cas d'écart.*

Domaine inchangé en première passe (lecture seule de `placement.ts` et `StopPoint.ts` ; modifié par la revue, voir plus bas). Branchement seul, dans `CompositionScreen.tsx`, `PlacementLayer.tsx`, `PlacementBar.tsx`, `fr.ts`.

**Contexte toujours fourni.** `placementContext` (exercices et points du brouillon) est passé à `togglePlacementStopPoint` et `placementConfirmation` ; les emplacements du placement sont `placementSlots(…, placement)` (état effectif : un retrait programmé libère ses voisins, RM-251). Plus aucun appel à la forme historique sans contexte dans l'application ; les surcharges sans contexte, `hasPlacementChanges`, `placementAdditionCount` et `stopPointDisplay` restent exportées par le Domaine (tests du Domaine), non appelées par l'écran — leur retrait est un nettoyage du Domaine, hors périmètre.

**Points existants.**
- Rendu : `PlacementStopPointRow` (variante `EXISTING` : `stopPointId`, `location`, `accessibilityLabel`) en bouton sélectionné, avec le style « sélectionné » existant de la puce de placement 5.3 (pleine `primary`, symbole et texte blancs) ; désélectionné : style « à ajouter » (pointillés, fond 5 %). **Figma** (`8328:29270`, lu le 22/10) : aucun état sélectionné / désélectionné d'un point existant ; le point existant y est la puce posée `9843:18975` (contour `#C8C8D7`, rayon 12) d'avant D-436. Choix noté, à valider par Hermann.
- Position : emplacement de carte → rangée sous la carte ; `AFTER_CIRCUIT` → rangée dédiée (seul ce `kind` la porte désormais : `find(occurrenceId === null)` pouvait retenir un `UNOFFERED_STOP_POINT`) ; `UNOFFERED_STOP_POINT` → rangée autonome de la séquence mêlée en placement (`displayedZoneItems` avec l'ensemble des identifiants non proposés, `PlacementStopPointItemRow` : rail lien + queue sans point de raccord comme les rangées du placement, aucun glisser, cible bornée à l'écart de la zone, 8 ou 9). Un point « après le Circuit » d'un Circuit vide est non proposé : rangée en tête de la zone après le Circuit (même place que hors placement).
- Toucher : `togglePlacementStopPoint(location, context)` → `togglePlacementStopPointRemoval`. Une resélection qui rendrait le point consécutif à un ajout est refusée par le Domaine (puce inchangée, aucune annonce : aucune règle d'annonce ici, non inventée).
- Accessibilité : nom par la règle 6.2 (`stopPointRowAccessibilityLabel` sur `scopeSequence` de sa portée, homonymes « n sur m », « après le circuit », têtes de portée) ; `accessibilityState.selected` ; indices `existingStopPointSelectedHint` « Toucher pour retirer ce point d'arrêt. » / `existingStopPointRemovedHint` « Toucher pour conserver ce point d'arrêt. » (formulations à valider).
- Cibles : boîtes réelles de 22 + 2 × écart (marges négatives), jamais de `hitSlop` ; disjointes des cartes voisines (écart exact).

**Libellé.** `PlacementBar` reçoit `confirmation` (`PlacementConfirmation`) au lieu de `count` / `canConfirm` ; `formatPlacementConfirmLabel(confirmation)` ; clé `confirmChanges` « Confirmer les modifications ». `NONE` garde « Confirmer 0 pause ajoutée », indisponible. Annonce à chaque changement de libellé (et non plus de N). Le point J3 « Confirmer 0 pause ajoutée actif quand seule une durée existante a été modifiée » est remplacé par « Confirmer les modifications ».

**Entrée en placement.** « Ajouter un arrêt » est désormais disponible dès qu'un point existe, même sans aucun ajout possible : le placement est le seul chemin de retrait (D-436 R3). Conséquence nécessaire, sans règle écrite sur ce bouton — à valider par Hermann.

**Nettoyage.** Retirés : `PauseRowContext.stopPointFor` et l'usage de `stopPointDisplay` par l'écran, `placementExistingStopPoint`, la variante `EXISTING` sans identifiant, `StopPointChipFace` (`StopPointChip.tsx`), les props `count` / `canConfirm` de `PlacementBar`.

**Tests.** `CompositionScreen.test.tsx` : deux tests 5.3 adaptés (point existant sélectionné, bouton) ; deux attentes 4.2 passées à « Confirmer les modifications » ; bloc « retrait en placement et libellé (story 6.3) » (sélection / désélection / resélection, indices et rendu ; Confirmer ; Annuler avec ajout + retrait ; ajouts seuls / mélange ; voisin libéré et resélection refusée ; point non proposé en tête de Circuit ; nom 6.2 avec homonymes ; entrée disponible avec un point seul ; aucun retrait hors placement). `PlacementBar.test.tsx` réécrit, `RemovalBubble.test.tsx` adapté, `index.test.ts` (trois clés). `CompositionPausesFlow.integration.test.tsx` : retrait en placement → Confirmer (base inchangée) → Continuer → relecture → réouverture.

**Revue 6.3 (corrections appliquées).**
- *Point existant par identifiant* : variante `EXISTING` sans `location` ; `onToggleExistingStopPoint(id)` → `togglePlacementStopPointRemoval(placement, id, context)`. Deux points hérités sur la même clé, ou à position NaN, se retirent indépendamment (Domaine et écran testés).
- *Resélection refusée* : `blocked` calculé par l'écran (l'annulation rendrait le sous-brouillon inchangé) → `accessibilityState: { selected: false, disabled: true }`, indice « Ne peut pas être conservé : un point ajouté le suivrait. », toucher reçu et refus annoncé. **Domaine (correctif signalé)** : `togglePlacementStopPointRemoval` ne refuse plus que si un point AJOUTÉ suivrait le point ; deux points existants déjà consécutifs (hérités) ne bloquent plus la resélection de l'un d'eux.
- *Superpositions* : aucun emplacement libre proposé là où est dessiné un point non proposé (position tronquée ou ramenée aux bornes : `displayedStopPointLocation`, déjà présent depuis 6.2) ; deux rangées de placement adjacentes se partagent l'écart (`{ top, bottom }`, moitié côté voisin) — rangée sous une carte / rangée non proposée, deux rangées non proposées, rangée « après le Circuit » / tête de la zone après le Circuit.
- *Rendu « à retirer »* : pointillés + opacité `UNSELECTED_OPACITY`, nom propre du point (et non « Ajouter… »). NON VÉRIFIABLE (aucun état Figma).
- *Annonces* : l'écran est seule source — un message « Point d'arrêt retiré / conservé » suivi, si la disponibilité de « Confirmer » change, de son libellé (« … . Confirmer les modifications ») ; refus annoncé seul. `PlacementBar` n'annonce plus rien : chaque ajout ou annulation d'ajout est annoncé par l'écran avec le nouveau libellé (ch13 L1524, ligne 11 du triage).
- *Entrée* : point sans identifiant non compté ; indice « Permet de retirer des points d'arrêt existants. » quand seul un retrait est possible ; après Confirmer, si « Ajouter un arrêt » devient indisponible, focus sur la première carte.
- *Noms* : puces à ajouter nommées par la même règle (`stopPointAnchor` : dernier Exercice, « n sur m » pour les homonymes) ; `exerciseName` retiré de `PlacementStopPointRow`.
- *Domaine* : `context` obligatoire pour `togglePlacementStopPoint`, `togglePlacementStopPointRemoval` et `placementConfirmation` ; `hasPlacementChanges`, `placementAdditionCount`, `stopPointDisplay` (et le type `AnchorableOccurrence`) retirés avec leurs tests — aucun usage applicatif. Reste exporté sans usage applicatif : `withoutStopPoint` (hors demande, signalé). Tests du Domaine : sous-brouillons inapplicables construits directement (`withAddedStopPoints`).
- *Saut de mise en page* (rangée libérée au-dessus de la puce touchée, ex. rangée « après le Circuit ») : inchangé, à vérifier en J5 sur iPhone.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Gravité | Décision |
|---|--------|---------|---------|----------|
| 1 | revue 6.3 | Point existant basculé par emplacement : deux points sur la même clé indissociables | moyenne-haute | patch : bascule par identifiant ; tests clé dupliquée et NaN. |
| 2 | revue 6.3 | Resélection refusée silencieuse ; paire héritée bloquante | moyenne | patch : état indisponible, indice, annonce ; Domaine : seul un ajout bloque (testé). |
| 3 | revue 6.3 | Puces superposées (point tronqué libéré) ; cibles adjacentes qui se recouvrent | moyenne | patch : emplacement masqué ; écart partagé ; tests. |
| 4 | revue 6.3 | Point « à retirer » identique à un emplacement libre | moyenne | patch : opacité réduite + nom propre ; NON VÉRIFIABLE. |
| 5 | revue 6.3 | Annonces concurrentes (écran / barre) | basse | patch : écran seule source, message unique ; la barre n'annonce plus. |
| 6 | revue 6.3 | Entrée : point sans identifiant compté ; pas d'indice ; focus sur un bouton désactivé | basse | patch : les trois. |
| 7 | revue 6.3 | Noms des puces à ajouter (exercice de la carte, homonymes) | basse | patch : règle 6.2. |
| 8 | revue 6.3 | Formes sans contexte et code mort au Domaine | basse | patch : `context` obligatoire, retraits, tests mis à jour. |
| 9 | revue 6.3 | Cas manquants ; écarts de vérification (10) et (11) | — | patch : tests ajoutés. |
| 10 | revue 6.3 | Saut de mise en page après une bascule | — | accepté, à vérifier en J5. |
| 11 | revue 6.3 (point 5, ch13 L1524) | Nombre d'ajouts plus annoncé depuis le retrait des annonces de la barre | moyenne | patch : l'écran annonce l'effet puis le nouveau libellé à chaque ajout ou annulation d'ajout (point ou récupération : « Point d'arrêt ajouté / Récupération ajoutée / Ajout annulé. Confirmer N … ») ; la barre n'annonce toujours rien ; tests. |

## Verification

**Commands:**
- `npx jest src/features/sessions src/domain/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
