---
title: 'Story 6.2 — Glisser-déposer d''un Point d''arrêt'
type: 'feature'
created: '2026-10-22'
status: 'in-progress'
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
- [ ] Rangée de point autonome + rail (nœud point) + tests.
- [ ] Glisser d'une carte à index mêlé, point immobile, refus animés + tests.
- [ ] Glisser d'un point + tests.
- [ ] Monter / Descendre (carte via `stepOccurrence`, point) + suppression refusée annoncée + tests.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert.
- Given un iPhone, when on déplace cartes et points, then les scénarios 1 à 8 et 13 à 15 de la recette de Hermann sont conformes (J5).

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npx jest src/features/sessions src/domain/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
