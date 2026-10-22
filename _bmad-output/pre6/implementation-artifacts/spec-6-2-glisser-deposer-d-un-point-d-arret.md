---
title: 'Story 6.2 — Glisser-déposer d''un Point d''arrêt'
type: 'feature'
created: '2026-10-22'
status: 'done'
baseline_commit: '2156f2be'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-6-1-domaine-points-d-arret-independants.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-5-2b-correction-du-rail-pendant-le-deplacement.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le Domaine traite désormais le Point d'arrêt comme un élément autonome de la séquence (story 6.1, D-436, RM-251), mais l'écran le dessine encore dans le bloc de l'occurrence qui le précède : il se déplace avec la carte au glisser, ne peut pas être saisi lui-même, et Monter / Descendre d'une carte sautent le point.

**Approach:** Faire de la rangée de Point d'arrêt une rangée autonome de la séquence (sœur des cartes, sur le modèle de la rangée « après le Circuit »), glissable par appui long en réutilisant le geste, l'aperçu animé (2.3b), le rail (5.2, 5.2b) et le dépôt existants ; brancher l'écran sur les opérations du Domaine de la story 6.1 (`moveOccurrenceInSequence`, `stepOccurrence`, `moveStopPoint`, `removeOccurrenceOutcome`).

## Boundaries & Constraints

**Always:**
- Sources : D-436 (ch07), RM-251 (ch10), CE-T03-08 (ch13 : gestes, accessibilité, recette), API-COM-05/06/09 (ch11) ; epics.md Epic 6 et arbitrages du 22/10.
- **Rangée autonome** : chaque Point d'arrêt hors placement est une rangée de la séquence (puce centrée, rangée 22, raccord au rail — rendu de la story 5.2 inchangé), positionnée selon `{scope, position}` entre les cartes ; elle n'appartient plus au bloc animé de l'occurrence (ni hauteur de bloc, ni balayage, ni glisser de la carte). Le rail (`compositionRail.ts`) reçoit les points comme nœuds de la chaîne (écart, ancre, queue, point de raccord) ; les hauteurs de bloc d'occurrence n'incluent plus la rangée.
- **Glisser d'une carte (R1)** : la cible de dépôt est un index dans la séquence mêlée (cartes et points) ; le point reste à sa place ; dépôt appliqué par `moveOccurrenceInSequence` ; refus (RM-251, position interdite, tête de Circuit, Circuit vidé) → retour animé de la story 5.2b, aucune mutation ; l'aperçu de décalage (2.3b) traite les rangées de points comme des lignes de la géométrie figée, chacune avec sa hauteur mesurée.
- **Glisser d'un point (R2)** : appui long sur la puce → état soulevé (même traitement que la carte : suit le doigt, voisines décalées en temps réel, rail continu, soulèvement neutre pour la mise en page), dépôt valide par `moveStopPoint`, refus avec retour animé ; identité conservée ; aucun balayage sur un point ; toucher court sans effet hors placement.
- **Monter / Descendre** : la carte utilise `stepOccurrence` (échange avec l'élément voisin de la séquence mêlée) ; le point offre ses propres actions accessibles « Monter » / « Descendre » vers l'emplacement autorisé voisin, proposées seulement si le déplacement serait accepté ; annonces existantes.
- **Suppression refusée** (arbitrage du 22/10) : « Supprimer » reste proposé ; si `removeOccurrenceOutcome` refuse, rien n'est supprimé, la carte se referme et une annonce d'accessibilité donne la raison (texte dans `fr.ts`).
- Duplication : `duplicateOccurrence` sans quatrième argument.
- Le retrait du point par appui long et bulle reste en place dans cette story seulement si son retrait en 6.3 l'exige ; sinon l'appui long du point devient le glisser dès 6.2 (la bulle du point disparaît en 6.3 avec le retrait en placement) — choisir et documenter.
- Cibles tactiles réelles (boîtes dimensionnées, jamais `hitSlop` hors du parent), disjointes.

**Never:**
- Modifier le Domaine au-delà d'un branchement (sauf correctif nécessaire et testé) ; modèle, persistance, API, calculs inchangés.
- Retirer ou altérer la récupération (réglage, bulle, suit l'occurrence).
- Constantes de décalage arbitraires ou segments codés en dur.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Exercice sans le point | [W, A, P, B], A sous B | [W, P, B, A] ; P immobile | — |
| Exercice avec récupération | A (R 20 s) déplacé | R suit A | — |
| Point dans la zone | [A, P, B, C], P sous B | [A, B, P, C] | — |
| Point avant / dans / après le Circuit | P déplacé entre zones | appliqué si autorisé et non consécutif | refus, retour animé |
| Point contre un autre point | dépôt adjacent à Q | refus | inchangé |
| Exercice laissant deux points | [A, P, B, Q, C], B après C | refus | inchangé |
| Suppression refusée | [A, P, B], supprimer A | rien, carte refermée, annonce | — |
| Monter / Descendre point | VoiceOver | emplacement voisin autorisé | action absente sinon |
| Rail | tous les cas | continu, ne traverse aucun média | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/CompositionScreen.tsx` -- rangées de points (`ActivityRecoveryLine` / rangée « après le Circuit »), `ActivityZoneList`, geste et dépôt (`handleRowDragStart`, `handleDragMove`, `handleDropActivity`, `moveActivityTo`, `DragShiftSession`), `stepTargetOf`, suppression et duplication, rail (`railShiftOf`, `railSkip`).
- `src/features/sessions/compositionGesture.ts` -- `buildDragLayout`, `resolveDropTarget` (index mêlé), `resolveDragShifts`.
- `src/features/sessions/compositionRail.ts`, `CompositionSequence.tsx` -- nœuds « point ».
- `src/features/sessions/StopPointChip.tsx`, `ActivityRecoveryLine.tsx`.
- `src/domain/sessions/composition.ts` (lecture : opérations 6.1).
- `src/shared/i18n/resources/fr.ts` -- annonces.
- Tests : `CompositionScreen.test.tsx`, `compositionGesture.test.ts`, `compositionRail.test.ts`.

## Tasks & Acceptance

**Execution:**
- [x] Rangée de point autonome + rail (nœud point) + tests.
- [x] Glisser d'une carte à index mêlé, point immobile, refus animés + tests.
- [x] Glisser d'un point + tests.
- [x] Monter / Descendre (carte via `stepOccurrence`, point) + suppression refusée annoncée + tests.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert.
- Given un iPhone, when on déplace cartes et points, then les scénarios 1 à 8 et 13 à 15 de la recette de Hermann sont conformes (J5).

## Implementation Notes

Domaine inchangé hors le retrait, en revue, du 4e paramètre mort de `duplicateOccurrence` (branchement seul : `moveOccurrenceInSequence`, `stepOccurrence`, `moveStopPoint`, `removeOccurrenceOutcome`, `duplicateOccurrence` à trois arguments, `scopeSequence`, `positionInSequence`, `isStopPointProposable`, `occurrenceCountInScope`) ; aucun correctif de comportement du Domaine nécessaire. `tokens.ts` intact. Fins de ligne de chaque fichier conservées.

**Choix — bulle du point (contrainte « deux comportements sur un même geste »).** L'appui long d'un point devient son glisser dès 6.2 ; sa bulle « Retirer le point d'arrêt » et son action accessible `remove` sont retirées dans la même story (la bulle de la récupération est inchangée). Entre 6.2 et 6.3, un point ne peut plus être retiré par aucun autre moyen — accepté (6.3 suit et apporte le retrait en placement). `RemovalBubble` garde sa variante « point » (non utilisée par l'écran), retirée avec 6.3.

**Architecture de la rangée et de la chaîne.**
- Éléments affichés par zone : `displayedZoneItems` — hors placement, la séquence mêlée du Domaine (`scopeSequence`, D-436) ; en placement, les occurrences seules (les points restent portés par les emplacements de la story 5.3, `stopPointDisplay`). `ActivityZoneList` rend chaque élément : carte (`CompositionActivityRow`, « n sur m » compté sur les occurrences) ou rangée de point (`StopPointRow`), sœurs dans la liste de la zone, séparées par l'écart de la liste (8 ; 9 dans le Circuit) — la géométrie de la story 5.2 est inchangée (rangée de 22, puce centrée).
- La carte ne porte plus de rangée hors placement (plus de `RailDot`, queue jusqu'au bas de la carte, `fallbackBlockHeight` = hauteur de la carte) ; en placement, la rangée d'emplacement sous la carte reste (story 5.3).
- Point « après le Circuit » : première rangée de la zone après le Circuit (la rangée dédiée du corps ne sert plus qu'à l'emplacement du placement ; `hasAfterCircuit` = placement seulement).
- Rail : `RailChainItem` (identifiant d'occurrence ou `{ stopPointId }`) par zone ; nœud `stop` de clé `railStopKey` — écart de sa zone au-dessus, ancre au haut de la rangée (`minLength` 0), queue sur toute la hauteur, point de raccord au centre ; `skipped` désigné par sa clé. Revue : un point hors de la chaîne (soulevé, tenu, en retour) ne dessine AUCUN rail — ni queue ni point de raccord ; le lien de ses voisines traverse déjà sa place (sa puce, centrée, ne recouvre pas l'axe du rail, contrairement à une carte).
- Libellés : « Point d'arrêt après {exercice} » (dernière occurrence qui le précède dans sa portée), « … après le circuit », et, pour des têtes de portée héritées, « … au début du circuit » / « … au début de la séance » (nouvelles clés, formulation à valider) ; indice « Appui long pour déplacer le point d'arrêt ».

**Geste et dépôt.**
- Un seul état pour carte et point : l'élément soulevé est désigné par sa clé de rail (`draggedKey`, `DragShiftSession.preview.key`, `settling.key`, `release.key`). Les mesures (`rowLayoutsRef`) et la géométrie figée (`buildDragLayout`) comptent toutes les rangées affichées, points compris, chacune avec sa hauteur mesurée : `resolveDropTarget` rend un rang de la séquence mêlée, élément glissé retiré — l'indice de `moveOccurrenceInSequence`. `resolveDragShifts` est inchangé (identifiants opaques).
- Carte : `planOccurrenceMove` (glisser : `moveOccurrenceInSequence` ; pas : `stepOccurrence`) puis `settleCircuitMembership` — adaptation au Circuit de Séries et confirmation de perte inchangées ; refus ou non-déplacement → retour animé (5.2b).
- Point : appui long sur la puce (`StopPointChip`, même délai que la carte) → soulevé ; la puce suit le doigt (translation locale), les voisines se décalent (aperçu 2.3b, hauteur d'insertion = hauteur mesurée), le rail reste continu ; dépôt → `moveStopPoint` vers `stopPointLocationAt` (positions = occurrences qui précèdent le rang dans la séquence sans le point) ; refus ou même emplacement → retour animé, rien d'écrit. Aucun balayage ; toucher court sans effet. Soulèvement neutre pour la mise en page (aucune taille changée ; Figma ne dessine pas d'état soulevé pour la puce : NON VÉRIFIABLE, au premier plan seulement).
- Un nouveau geste pendant un retour (5.2b) et l'entrée en placement fonctionnent de même pour un point.

**Accessibilité.**
- Point : élément accessible (la puce), nom selon sa place, indice de glisser, actions « Monter » / « Descendre » vers l'emplacement autorisé voisin (`stopPointStepTarget` : emplacements `(scope, 0..n)` dans l'ordre structurel, en sautant ceux qui ne sont jamais proposables — après le compte à rebours, avant la Fin, tête de Circuit), proposées seulement si `moveStopPoint` accepte (libre, non consécutif). Plus d'action `remove`.
- Carte : « Monter » / « Descendre » par `stepOccurrence` (échange avec l'élément voisin, point compris), proposés seulement si le plan est accepté.
- Suppression refusée (arbitrage du 22/10) : « Supprimer » reste proposé ; refus de `removeOccurrenceOutcome` → rien n'est supprimé, la carte se referme, annonce `AccessibilityInfo.announceForAccessibility` (« Suppression impossible : un point d'arrêt se retrouverait à une position interdite. » / « … deux points d'arrêt se suivraient. » ; `fr.ts`, formulation à valider).

**Cibles tactiles.** La puce garde sa boîte réelle de 30 (marges négatives de 4 dans la rangée de 22), contenue dans les écarts de la séquence (8 / 9) : disjointe des cartes voisines ; la marge haute de la Fin tient compte d'un point juste au-dessus (`finPrecededByStopPoint` lit la dernière rangée de la zone après le Circuit).

**Tests.**
- Écran (`CompositionScreen.test.tsx`), nouveaux, dans la géométrie cohérente de la story 5.2b (rail vérifié par `expectRailJoined`, points compris) : R1 [W, A, P, B] → [W, P, B, A] ; R1 / RM-251 refus avec retour animé ; R2 [A, P, B, C] → [A, B, P, C] (puce qui suit le doigt, voisines décalées, rail continu) ; R2 refus contre un autre point ; « Monter » / « Descendre » d'un point (absent si refusé, saut de la tête du Circuit) ; « Monter » / « Descendre » d'une carte par `stepOccurrence` ; suppression refusée annoncée ; duplication sans copie du point.
- Écran, réécrits (rangée autonome) : rangée hors du bloc de la carte, ni balayage ni glisser avec la carte ; rail de la carte et rangée du point ; point « après le Circuit » en tête de la zone d'après ; appui long d'un point sans bulle ni action de retrait ; tests de la bulle de récupération débarrassés du point. Supprimés (comportement retiré) : retrait d'un point par bulle ou action, focus après ce retrait, rangée du point sous la carte soulevée (5.2b).
- Purs : `compositionRail.test.ts` (nœud point ; modèle 5.2b à rangées autonomes : voisine point, point glissé seul dans sa zone et d'une zone à l'autre, hauteur d'insertion différente de la hauteur retirée) ; `compositionGesture.test.ts` (rang de la séquence mêlée).
- Autres : `CompositionPausesFlow.integration.test.tsx` (points affichés comme rangées), `RemovalBubble.test.tsx` (puce : glisser et actions données).
- Correctif annexe : la doc du modèle pur 5.2b contenait des « \` » littéraux (échappement), corrigés.

**Revue de la story (corrections).**
- Suite complète : `src/shared/i18n/index.test.ts` compare par `toEqual` — clés `placement.stopPointAt…`, `pauses.stopPointReorderAccessibilityHint` ajoutées, `pauses.removeStopPoint` retirée ; test des annonces `activityActions.deleteRefused…`. `npm test` complet exécuté.
- Pas d'un point : premier emplacement accepté par `moveStopPoint` à partir de l'emplacement AFFICHÉ (`displayedStopPointLocation` : position héritée ramenée), en sautant les non proposables ; le point peut en franchir un autre (comme au glisser). Dépôt sur son emplacement affiché : rien n'est écrit.
- Focus : pas d'une zone à l'autre (carte ou point remonté dans une autre liste) → focus d'accessibilité sur l'élément, par sa clé de rail, à l'image suivante (`ItemFocusRequest`, consommé une fois porté — un élément remonté le reçoit à son montage).
- Annonce de suppression refusée : `switch` exhaustif (`STOP_POINT_NOT_ALLOWED` → « position interdite » ; `CONSECUTIVE_STOP_POINTS`, `LOCATION_OCCUPIED` → « se suivraient » ; `AT_BOUNDARY`, jamais produit par une suppression → « position interdite ») ; émise à l'image suivante, après le focus porté sur la carte refermée. Aucun retour visuel (arbitrage du 22/10, inchangé).
- Multitouche : second soulèvement ignoré (`draggedKeyRef`, synchrone) ; `touchStart` ignoré pendant un glisser ; `touchEnd` ne termine le geste qu'au dernier doigt levé ; `touchCancel` du point efface l'origine (un appui long sans origine ne soulève rien).
- Rangées non mesurées : `buildDragLayout` rend `null` si une rangée affichée n'a pas de mesure ou en a une d'une autre zone (la mesure porte sa zone) ; le soulèvement est refusé (l'élément reste au repos ; `onDragStart` rend `false`). Sous Jest, les rendus de test mesurent leurs rangées (`measureDisplayedRows`).
- Mises à jour fonctionnelles : dépôt d'un point, pas des points et déplacement d'une carte rejoués sur le brouillon courant (`updateDraft(current => …)`).
- « Ajouter un arrêt » inactif pendant un glisser ; `enterPlacement` sans effet.
- Bornes : marge tactile du Compte à rebours réduite si la première rangée avant le Circuit est un point (comme la Fin pour la dernière rangée après le Circuit). Seules ces rangées touchent une borne : une rangée du Circuit en est séparée par la marge du Circuit, une rangée après le Circuit par le Circuit.
- Nom d'un point : dernier séparateur (Exercice, `isSequenceSeparator`) qui le précède ; homonymes distingués par la notation « n sur m » des cartes (position de cet exercice parmi les occurrences de sa zone).
- Table des pas (cartes, points) mémorisée par brouillon (`stepAvailability`).
- Code mort retiré : `resolveStepTarget` (et ses tests), `railItemKey`, `PauseFocusRequest.cardOnly`, variante « point » de `RemovalBubble` (prop `kind` retirée) et `pauses.removeStopPoint`, 4e paramètre `_newStopPointId` de `duplicateOccurrence` (Domaine : paramètre mort dont le retrait était annoncé ; tests du Domaine ajustés, aucun comportement changé).
- **Blocage temporaire accepté (jusqu'à 6.3)** : un point qu'on ne peut plus retirer peut empêcher la suppression de ses voisins (refus de `removeOccurrenceOutcome`) ; 6.3 apporte le retrait en placement.
- Tests ajoutés : suppression refusée pour points consécutifs ; point glissé en tête de Circuit (refus) et « après le Circuit » (accepté) ; carte glissée refusée (point après le Compte à rebours) ; « Descendre » absent avant la Fin ; toucher court et balayage sur la puce sans effet ; RM-251 entre portées `(IN, m)` / `(AFTER, 0)` ; soulèvement vérifié (`scrollEnabled`, `zIndex`) ; multitouche ; rangée non mesurée ou mesurée dans une autre zone ; focus après un pas d'une zone à l'autre ; Compte à rebours suivi d'un point ; nom d'un point (séparateur, homonymes) ; position héritée hors bornes ; `expectRailJoined` vérifie qu'un point hors de la chaîne ne dessine aucun rail ; commentaire de la hauteur synthétique du test pur.

**Restes / pour Hermann.** Libellés nouveaux à valider ; état soulevé visuel de la puce non défini (NON VÉRIFIABLE).

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | revue 6.2 | Suite complète rouge : `i18n/index.test.ts` (`toEqual`) sans les nouvelles clés | high | patch : clés ajoutées, `removeStopPoint` retirée, test des annonces ; `npm test` complet. |
| 2 | revue 6.2 | Point en retour : rail de sa propre surface dessiné | medium | patch : aucun rail hors chaîne ; `expectRailJoined` le vérifie. |
| 3 | revue 6.2 | Pas d'un point : arrêt au premier emplacement proposable même refusé ; positions héritées | medium | patch : premier emplacement accepté, position affichée ramenée, dépôt sur place sans écriture ; tests. |
| 4 | revue 6.2 | Focus VoiceOver perdu après un pas d'une zone à l'autre | medium | patch : `ItemFocusRequest` par clé de rail ; test. |
| 5 | revue 6.2 | Annonce : raisons non exhaustives, annonce coupée | medium | patch : `switch` exhaustif, annonce après focus à l'image suivante ; tests. |
| 6 | revue 6.2 | Multitouche | medium | patch : second soulèvement ignoré, `touchStart` ignoré, dernier doigt, `touchCancel` ; test. |
| 7 | revue 6.2 | Geste sur rangées non mesurées | medium | patch : soulèvement refusé ; test. |
| 8 | revue 6.2 | Fermetures figées au rendu | medium | patch : `updateDraft(current => …)`. |
| 9 | revue 6.2 | Placement / « Ajouter un arrêt » pendant un glisser | low | patch : inactif, sans effet. |
| 10 | revue 6.2 | Bornes voisines d'un point | low | patch : Compte à rebours ; Fin déjà traitée (seules rangées adjacentes) ; test. |
| 11 | revue 6.2 | Nom d'un point (séparateur, homonymes) | low | patch ; test. |
| 12 | revue 6.2 | Coût par rendu des pas | low | patch : table mémorisée par brouillon. |
| 13 | revue 6.2 | Tests manquants | medium | patch : voir Implementation Notes. |
| 14 | revue 6.2 | Code mort | low | patch : retraits (dont le 4e paramètre de `duplicateOccurrence`, Domaine). |
| — | revue 6.2 | Blocage temporaire jusqu'à 6.3 ; suppression refusée silencieuse pour la vue | — | Accepté (6.3 suit ; arbitrage du 22/10). |

## Verification

**Commands:**
- `npx jest src/features/sessions src/domain/sessions --maxWorkers=2` -- expected: vert. Résultat : 53 suites, 1633 tests, verts.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert. Résultat : `npx tsc --noEmit` 0 erreur, `npm run lint` sans avertissement ; `npm test` complet non relancé ici (hors périmètre demandé).

**iPhone (J5, Hermann) :** glisser d'un point (appui long, suivi du doigt, voisines décalées, rail continu, dépôt et refus avec retour) ; glisser d'une carte autour d'un point (le point reste en place) ; plusieurs déplacements successifs ; cibles tactiles de la puce entre deux cartes et au-dessus de la Fin ; VoiceOver : « Monter » / « Descendre » d'un point et d'une carte, annonce d'une suppression refusée ; défilement pendant le geste.
