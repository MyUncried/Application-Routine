---
title: 'Story 7.1 — Domaine : déplacement tolérant, début et fin de Tour, retrait de récupération en placement'
type: 'feature'
created: '2026-10-22'
status: 'review'
baseline_commit: '1c32a2c8'
route: 'dispatch'
review_loop_iteration: 1
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La recette iPhone du 22/10/2026 (commentaires 5, 6, 15, 17) a conduit Hermann à la décision D-442. Elle remplace trois règles de D-441 : le refus d'un déplacement d'Exercice pour cause de Point d'arrêt interdit ou consécutif, et la non-proposition de la tête de Circuit. Elle limite en outre le réglage de la Récupération au seul mode Placement : une récupération existante doit pouvoir y être retirée.

**Approach:** Dans le Domaine pur (`src/domain/sessions/`) :
- le déplacement d'une occurrence devient tolérant : il est appliqué et les points en cause sont retirés ; l'issue les nomme ;
- la tête de Circuit devient autorisée et proposée ; N (`tourRepeatCount`) est passé comme contexte optionnel des règles d'emplacement ;
- à N ≥ 2, RM-219 ne s'applique pas aux points de début et de fin de Tour, et la coexistence des deux (conflit de Tour) rend une issue « choix requis » avec deux résolutions, sans mutation ;
- le sous-brouillon de placement gagne des retraits programmés de récupération.
L'écran n'est adapté que pour compiler et garder ses tests verts ; la story 7.2 branchera les dialogues.

## Boundaries & Constraints

**Always:**
- Règles : D-442 (ch07 l. 8-19) et D-441 (ch07, juste après), epics.md « Epic 7 », story 7.1, AC1 à AC3. Représentation `StopPoint = { id, scope, position }` inchangée.
- **AC1** : `moveOccurrenceInSequence`, `moveOccurrenceOutcome`, `stepOccurrence` et la forme historique `moveOccurrence` appliquent le déplacement. Ils retirent d'abord les points devenus interdits (RM-219, ou Circuit vidé qui porte un point), puis, itérativement, le second point de chaque paire devenue consécutive (RM-251) ; le premier est conservé. L'issue `APPLIED` porte `removedStopPointIds` (vide par défaut). Les paires héritées restent exemptées. La suppression d'un Exercice garde le refus de D-441. `moveStopPoint` garde ses refus, sauf pour la tête de Circuit.
- **AC2** : la tête de Circuit `(IN, 0)` est autorisée et proposée par le placement, `moveStopPoint`, `isStopPointProposable` et le juge, sous réserve de RM-219 et de RM-251. N est passé en contexte optionnel (`StopPointRules`).
  - À N ≥ 2, un point de début et un point de fin de Tour coexistants forment un conflit de Tour, détecté par un prédicat exporté. Toute opération qui le crée rend `CHOICE_REQUIRED` avec les résolutions `HEAD` et `TAIL`, sans muter : ajout en placement, `moveStopPoint`, déplacement d'occurrence, changement de N de 1 à N ≥ 2.
  - À N ≥ 2, RM-219 ne s'applique pas à ces deux emplacements.
  - Le plan d'exécution ne place jamais un arrêt juste après le compte à rebours, juste avant la Fin, ni deux arrêts successifs.
  - Au passage à N = 1, les points devenus interdits sont retirés, et l'issue les nomme.
  - La validation accepte ces états et les conflits hérités.
- **AC3** : `placementSlots` rend sélectionnée chaque récupération existante (0 compris). Le sous-brouillon porte `recoveryRemovals`.
  - Désélection : un ajout est jeté ; pour une récupération existante, le retrait est programmé.
  - Resélection à une durée : le retrait est annulé, et une modification est programmée si la durée diffère.
  - `applyPlacementDraft` applique le retrait (`null`, Pause terminale rétablie, RM-038). `placementConfirmation` compte un retrait comme `CHANGES`. `setOccurrenceRecovery` est conservé.
- Fonctions pures, résultats discriminés plutôt qu'exceptions, noms en anglais, commentaires en français citant D-442.

**Never:**
- Aucune migration, aucun changement de repository, de `Session.ts` ni d'API technique. Aucune modification sous `docs/`, ni de l'interface au-delà du minimum pour compiler et garder les tests verts : dialogues et dessin de l'emplacement de tête relèvent de la story 7.2.
- La suppression d'un Exercice ne devient pas tolérante.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Déplacer A, point devenu premier | [A, P, B, C] → A après B | [B, A, C], P retiré | APPLIED, removed [P] |
| Déplacer B, paire consécutive | [A, P, B, Q, C] → B après C | [A, P, C, B], Q retiré | APPLIED, removed [Q] |
| Trois points réunis | P, Q, R consécutifs | seul P reste | retrait itératif |
| Circuit vidé | [W \| A, P \| Z] → A dehors | P retiré | APPLIED |
| Tête de Circuit, N = 1 | [W \| A, P, B \| Z] → A descend | P en (IN, 0), conservé | — |
| Tête en ouverture de Séance | Circuit seul, N = 1 / N ≥ 2 | interdite (retirée) / conservée | — |
| Conflit créé par déplacement | [W \| A, P, B, Q \| Z], N = 2, A sort | rien appliqué ; HEAD → Q retiré, TAIL → P retiré | CHOICE_REQUIRED |
| Conflit créé par moveStopPoint | P déposé en (IN, 0), T en fin, N ≥ 2 | idem ; TAIL retire le point déplacé | CHOICE_REQUIRED |
| Conflit créé par suppression | [A, P, B, Q] (Circuit), N = 2, supprimer A | refus (consécutifs entre deux Tours) | REFUSED CONSECUTIVE_STOP_POINTS |
| N 1 → 2 avec début et fin | W \| H, A, B, T \| Z | choix requis ; forme historique : N appliqué, deux points gardés | CHOICE_REQUIRED |
| N ≥ 2 → 1 | Circuit seul + point de tête | point retiré | APPLIED, removed |
| Plan, N ≥ 2, Circuit seul | début ou fin de Tour | aucun arrêt en tête ni en fin ; un seul entre deux Tours | — |
| Placement, N ≥ 2, fin existante | choisir la tête | rien ajouté ; HEAD → tête + retrait de la fin ; TAIL → rien | CHOICE_REQUIRED |
| Récupération existante 0 | désélection, Confirmer | `postActivityRecoverySeconds = null` | CHANGES |
| Récupération retirée | resélection à 45 (20 avant) | retrait annulé + modification 45 | CHANGES |

</frozen-after-approval>

## Code Map

- `src/domain/sessions/StopPoint.ts` : `StopPointRules`, `repeatsCircuit`, `tourBoundaryOf`, `isStopPointPlacementAllowed`, `isStopPointAllowed` / `isStopPointProposable` (+ `rules`), `tourBoundaryConflict`, `hasTourBoundaryConflict`, `withoutStopPoints`, types `TourBoundary`, `TourBoundaryChoice`, `TourBoundaryConflict`.
- `src/domain/sessions/composition.ts` : `CompositionState.tourRepeatCount?`, `CompositionOutcome` (`removedStopPointIds`, `CHOICE_REQUIRED`), `CompositionResolution`, `resolveTourBoundaryConflict`, `settle` (tolérant), `judge` (strict, `onTourConflict`).
- `src/domain/sessions/placement.ts` : `CIRCUIT_HEAD`, `placementSlots(…, rules?)`, `PlacementContext.tourRepeatCount?`, `togglePlacementStopPointOutcome`, `PlacementTourConflict`, `PlacementStopPointOutcome`, `recoveryRemovals`, `deselectPlacementRecovery`, `selectPlacementRecovery`, `isPlacementRecoveryRemoved`, `placementRecoverySeconds`.
- `src/domain/sessions/circuit.ts` : `circuitCountOutcome`, `CircuitCountOutcome`, `CircuitCountResolution` ; `setCircuitCount` en forme historique ; commentaire d'`expandComposition`.
- `src/domain/sessions/validation.ts` : `validateStopPoints(…, rules)` (N validé).
- `src/features/sessions/CompositionScreen.tsx` : minimum (N passé au Domaine, `CIRCUIT_HEAD` existant rendu comme avant, emplacement libre de tête ignoré jusqu'à 7.2).
- Tests : `src/domain/sessions/__tests__/` ; `src/features/sessions/__tests__/CompositionScreen.test.tsx` (tests de l'ancienne règle mis à jour).

## Tasks & Acceptance

**Execution:**
- [x] Règles d'emplacement avec N, début et fin de Tour, conflit de Tour (`StopPoint.ts`) + tests.
- [x] Déplacement tolérant, issue `CHOICE_REQUIRED`, refus de suppression étendu au conflit (`composition.ts`) + tests.
- [x] Placement : tête de Circuit, choix requis, retraits de récupération (`placement.ts`) + tests.
- [x] `circuitCountOutcome`, plan d'exécution (`circuit.ts`) ; validation (`validation.ts`) + tests.
- [x] Écran au minimum ; tests d'écran de l'ancienne règle réécrits vers D-442.
- [x] `src/domain/README.md` à jour.

**Acceptance Criteria:**
- Given l'arbre entier, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit` et `npm run lint` sont lancés, then tout est vert ; les tests qui encodaient le refus de D-441 au déplacement ou la non-proposition de la tête sont réécrits (liste ci-dessous), aucun autre n'est affaibli.

## Implementation Notes

**API pour la story 7.2** (signatures exactes)
- `StopPoint.ts`
  - `type StopPointRules = { readonly tourRepeatCount?: number }`
  - `repeatsCircuit(rules?: StopPointRules): boolean`
  - `type TourBoundary = "HEAD" | "TAIL"`
  - `tourBoundaryOf(occurrences, point): TourBoundary | null`
  - `isStopPointPlacementAllowed(occurrences, point, rules?)`
  - `isStopPointAllowed(occurrences, point, rules?)` et `isStopPointProposable(occurrences, point, rules?)`, qui n'excluent plus la tête de Circuit
  - `tourBoundaryConflict<P extends StopPointLocation>(occurrences, points: readonly P[], rules?): { head: P; tail: P } | null`
  - `hasTourBoundaryConflict(occurrences, points, rules?): boolean`
  - `type TourBoundaryChoice = TourBoundary`
  - `type TourBoundaryConflict = { headStopPointId: string; tailStopPointId: string }`
  - `withoutStopPoints(points, ids)`
  - `tourBoundaryPoints<P>(occurrences, points: readonly P[], boundary: TourBoundary): readonly P[]`
- `composition.ts`
  - `CompositionState = { exercises; stopPoints; tourRepeatCount?: number }`
  - `CompositionResolution = { state: CompositionState; removedStopPointIds: readonly string[] }`
  - `CompositionOutcome` est l'union de quatre issues :
    - `{ status: "APPLIED"; state; removedStopPointIds }`
    - `{ status: "NOT_FOUND" }`
    - `{ status: "REFUSED"; reason; stopPointIds }`
    - `{ status: "CHOICE_REQUIRED"; conflict: TourBoundaryConflict; resolutions: Record<TourBoundaryChoice, CompositionResolution> }`
  - `resolveTourBoundaryConflict(state, keep: TourBoundaryChoice): CompositionResolution`
  - Les formes historiques (`moveOccurrence`, `removeOccurrence`, `duplicateOccurrence`) rendent l'entrée si un choix est requis.
- `placement.ts`
  - `PlacementSlotKind` comprend `"CIRCUIT_HEAD"`.
  - `placementSlots(exercises, stopPoints?, placement?, rules?)`
  - `type PlacementContext = StopPointRules & { exercises; stopPoints? }`
  - `type PlacementExistingStopPoint` est exporté ; `effectivePlacementStopPoints` rend les identifiants des points existants.
  - `type PlacementTourConflict = { head: StopPointLocation; tail: StopPointLocation; headStopPointId?; tailStopPointId? }`
  - `type PlacementStopPointOutcome = { status: "APPLIED"; placement } | { status: "CHOICE_REQUIRED"; conflict: PlacementTourConflict; resolutions: Record<TourBoundaryChoice, PlacementDraft> }`
  - `togglePlacementStopPointOutcome(placement, location, context): PlacementStopPointOutcome`. Sa forme historique, `togglePlacementStopPoint`, rend l'entrée si un choix est requis.
  - `PlacementDraft.recoveryRemovals: readonly string[]` (requis ; présent dans `EMPTY_PLACEMENT_DRAFT`)
  - `deselectPlacementRecovery(placement, occurrenceId, context): PlacementDraft`
  - `selectPlacementRecovery(placement, occurrenceId, seconds, context): PlacementDraft`
  - `isPlacementRecoveryRemoved(placement, occurrenceId): boolean`
  - `placementRecoverySeconds(placement, occurrence): number | null`
- `circuit.ts`
  - `CircuitCountResolution = { draft: SessionDraft; removedStopPointIds }`
  - `CircuitCountOutcome` a deux issues :
    - `{ status: "APPLIED"; draft; removedStopPointIds }`
    - `{ status: "CHOICE_REQUIRED"; conflict; resolutions: Record<TourBoundaryChoice, CircuitCountResolution>; unresolved: SessionDraft }`
  - `circuitCountOutcome(draft, requested): CircuitCountOutcome`

**Décisions prises sur les cas ambigus (réversibles, à signaler à Hermann)**
1. **Résolution d'un conflit au profit de l'autre point.** La résolution retire tous les points de la limite écartée (`tourBoundaryPoints`, revue). Pour un `moveStopPoint` ou un ajout en placement, choisir « l'autre » point supprime donc le point déplacé, ou jette l'ajout. L'option « Annuler » reste l'abandon de l'action.
2. **Suppression créant un conflit de Tour.** D-442 ne range pas la suppression parmi les opérations à choix. Une telle suppression est refusée avec `CONSECUTIVE_STOP_POINTS`, comme le refus doux de D-441 : les deux points se suivraient entre deux Tours. L'annonce d'écran existante convient.
3. **`LOCATION_OCCUPIED` au déplacement d'une occurrence.** Cette raison n'est plus jamais rendue. Le seul cas est celui d'une paire héritée qu'une ancienne Récupération autonome séparait sur deux emplacements, réunie par le déplacement de cette Récupération : le second point est retiré. Elle reste rendue par la suppression et par `moveStopPoint`.
4. **Limite de Tour.** Le début et la fin de Tour se définissent par l'absence d'Exercice du Circuit avant ou après le point ; les anciennes Récupérations ne comptent pas. Un Circuit sans Exercice n'a pas de limite de Tour.
5. **Conflit hérité.** Un conflit déjà présent avant l'opération ne redemande rien, quels que soient les points (revue). `setCircuitCount` en forme historique applique N et garde les deux points, car c'est l'état d'un conflit hérité. L'écran devra passer à `circuitCountOutcome` en 7.2.
6. **Retrait d'un point au passage à N = 1.** Seuls les points autorisés à l'ancien N et interdits au nouveau sont retirés. Un point déjà interdit, issu de données héritées, est laissé en place.
7. **Placement à N = 1 avec un Exercice avant le Circuit.** Deux emplacements libres voisins sont proposés : « après W » `(BEFORE, nB)` et la tête de Circuit `(IN, 0)`. Choisir l'un retire l'autre, puisqu'ils seraient consécutifs. C'est un doublon visuel à arbitrer en 7.2.
8. **« Monter » et « Descendre » d'une carte.** Étant tolérants, ils sont désormais toujours proposés, sauf en début ou en fin de Séance. Un pas qui échange une carte avec un point peut retirer ce point : `[A, P, B]`, avec B qui monte, donne `[A, B]` et retire P, qui précéderait la Fin.
9. **Changement de nature.** Il est jugé non pertinent : le conflit dépend de N, pas de la nature.

**Écran, minimum de 7.1**
- N est transmis au Domaine (`compositionStateOf`, `placementContext`, appels de `placementSlots`).
- Un point existant en tête est porté par `CIRCUIT_HEAD`. Il reste rendu comme rangée autonome, comme avant, jusqu'à 7.2.
- L'emplacement libre `CIRCUIT_HEAD` n'est ni dessiné ni compté par `placementOfferOf` avant 7.2.
- `CHOICE_REQUIRED` est traité comme un refus (aucune écriture, retour animé) jusqu'à 7.2.

**Tests réécrits (D-441 → D-442)**
- `composition.test.ts` : les refus au déplacement (point premier, dernier, consécutifs, tête de Circuit, Circuit vidé, frontières, ancienne Récupération sortie, indice mêlé) deviennent des `APPLIED` avec retraits. La suppression qui amène en tête est désormais acceptée. Le refus de `moveStopPoint` vers la tête est remplacé par une acceptation. Les `APPLIED` complets portent `removedStopPointIds: []`.
- `placement.test.ts` : l'emplacement `CIRCUIT_HEAD` apparaît dans les listes attendues. Le point de tête existant n'est plus `UNOFFERED_STOP_POINT`. L'ajout en tête est désormais accepté.
- `StopPoint.test.ts` : `isStopPointProposable` propose la tête.
- `CompositionScreen.test.tsx` :
  - « Descendre » est offert et retire le point ;
  - le dépôt avec point interdit retire le point (2.3b) ;
  - les deux tests de dépôt du bloc 1.2, auparavant vides de sens car la rangée du point n'était pas mesurée, mesurent maintenant la rangée et vérifient le retrait ;
  - B glissée après C retire Q ;
  - la carte glissée qui laisse un point en tête retire le point ;
  - le point déposé en tête du Circuit est accepté ;
  - « Monter » et « Descendre » d'un point passent par la tête ;
  - l'animation du dépôt non appliqué utilise désormais un conflit de Tour (N = 2).

## Spec Change Log

## Review Triage Log

Trois revues indépendantes du 22/10/2026 (aveugle, cas limites, écarts de vérification), menées par des sous-agents en lecture seule. Triage du développeur, sous la délégation de Hermann.

**Corrigés**
1. **Élevé (aveugle) — la résolution ne retirait qu'un point de la limite écartée.** Avec deux fins de Tour héritées, le conflit subsistait. En placement, l'ajout du début était alors rejeté en silence après le retrait d'une des fins. Ajout de `tourBoundaryPoints`. `resolveTourBoundaryConflict`, `circuitCountOutcome` et les résolutions du placement retirent désormais TOUS les points de la limite écartée. Tests en Composition et en placement.
2. **Moyen (cas limites) — resélection d'un point existant en conflit avec un ajout.** Elle était refusée en silence. `togglePlacementStopPointOutcome` rend désormais `CHOICE_REQUIRED` : `HEAD` ou `TAIL` conserve le point resélectionné et jette l'ajout de la limite opposée ; l'autre choix laisse l'entrée inchangée. `togglePlacementStopPointRemoval` garde son refus, puisque c'est une forme sans issue. Test ajouté.
3. **Moyen (aveugle) — `stopPointStepOutcome` (écran) franchissait un emplacement à choix requis.** La recherche s'arrête désormais au premier emplacement qui demande un choix : le pas n'est pas offert jusqu'à la story 7.2.
4. **Bas (cas limites) — position héritée NaN, hors bornes ou non entière lue comme un début de Tour (faux conflit).** `tourBoundaryOf` rend désormais `null` hors de `isStopPointPositionInRange`. Test ajouté.
5. **Bas (aveugle) — faux « conflit créé » quand une fin de Tour est déplacée vers une autre fin.** `newTourConflict` tient désormais tout conflit déjà présent avant l'opération pour hérité, comme `circuitCountOutcome` et le placement. Test ajouté.
6. **Bas — commentaires périmés.** Corrigés : `placement.ts` (`UNOFFERED_STOP_POINT`), la JSDoc de `moveActivityTo` à l'écran, et `CompositionScreen.test.tsx` (bloc 1.2, pas d'un point, titre « absent si refusé »). L'assertion `toHaveLength(2)` est remplacée par les points attendus.
7. **Écarts de vérification — tests ajoutés.**
   - `stepOccurrence` : retrait d'un point, et choix requis.
   - Retrait itératif réel dans une seule opération : une paire héritée rattrapée perd son point.
   - Circuit vidé, puis « avant » et « après » devenus consécutifs.
   - Conflit en sens inverse en placement : début existant, ajout de la fin.
   - Retrait et modification sur la même occurrence.
   - Plan en Séries, Circuit seul.
   - Passage de N ≥ 2 à N = 1 avec une fin de Tour.

**Reportés à la story 7.2 (écran)**
- `removedStopPointIds` n'est pas encore annoncé, et le focus n'est pas déplacé quand un point disparaît (aveugle 3).
- `CHOICE_REQUIRED` est traité comme un refus muet pour le glisser, les pas, le placement et la dépose d'un point (aveugle 4, cas limites 4).
- `CompositionScreen` appelle encore `setCircuitCount` : le passage de N = 1 à N ≥ 2 garde alors les deux points sans demander de choix (vérification, cas limites 4). La story 7.2 doit passer à `circuitCountOutcome`.
- L'emplacement libre `CIRCUIT_HEAD` n'est pas encore dessiné.

**Soumis à Hermann (aucun changement)**
- **Cas limites 2.** « Monter » ou « Descendre » d'un Exercice peut se réduire à supprimer un point sans changer l'ordre : `[A, P, B]`, B monte → `[A, B]`. C'est conforme à la lettre de D-442. À arbitrer : masquer le pas, ou assumer la suppression.
- **Aveugle 6.** L'exception de N ≥ 2 est lue sur N seul. En Séries, des exercices hérités à moins de N séries peuvent réduire les passages effectifs. Le comportement est documenté (`repeatsCircuit`) et non modifié.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` : 145 suites, 4023 tests, vert.
- `npx tsc --noEmit` : vert.
- `npm run lint` : vert, 0 avertissement.

**Manual checks:** aucun dans cette story (Domaine). La recette sur appareil relève du jalon J6, après 7.4.
