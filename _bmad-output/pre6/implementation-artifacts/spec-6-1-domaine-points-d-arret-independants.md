---
title: 'Story 6.1 — Domaine : Points d''arrêt indépendants et non-consécutivité'
type: 'feature'
created: '2026-10-22'
status: 'done'
baseline_commit: '34f80244'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le Domaine rattache chaque Point d'arrêt à l'occurrence qui le précède (`anchorStopPoints` / `reattachStopPoints`, ARB-3) : il la suit au déplacement, est copié à la duplication et retiré à la suppression, et un point devenu interdit est supprimé silencieusement. Aucune règle n'interdit deux Points consécutifs. Hermann a remplacé ces règles (D-436, epic 6).

**Approach:** Dans le Domaine pur, raisonner sur la séquence mêlée de chaque portée (occurrences et points) : les opérations sur les occurrences laissent les points à leur place dans cette séquence et recalculent leur `position` ; un prédicat RM-251 (non-consécutivité) et les interdits existants refusent toute opération invalide sans mutation ; ajout d'un déplacement autonome de point, des retraits programmés dans le sous-brouillon de placement, et de la fusion des points successifs du plan d'exécution en Séries partielles. Schéma, repositories et API inchangés.

## Boundaries & Constraints

**Always:**
- Règles : epics.md « Epic 6 » (R1 à R4 et arbitrages du 22/10). Représentation `StopPoint = { id, scope, position }` inchangée (`position` = nombre d'occurrences de la portée qui précèdent le point).
- Séquence mêlée d'une portée : `[pt(s,0)?, occ1, pt(s,1)?, …, occn, pt(s,n)?]` ; séquence structurelle complète : BEFORE_TOUR puis IN_TOUR puis AFTER_TOUR. Deux points sont consécutifs si aucune occurrence `EXERCISE` ne les sépare dans la séquence structurelle (les récupérations ne comptent pas). Frontières : `(BEFORE, nB)`+`(IN, 0)`, `(IN, nI)`+`(AFTER, 0)`, et avec Circuit vide `(BEFORE, nB)`+`(AFTER, 0)`. Interdits conservés : `isStopPointAllowed` (pas juste après le Compte à rebours, pas juste avant la Fin) ; tête de Circuit `(IN, 0)` non proposée.
- **R1** déplacement d'occurrence : les points gardent leur place dans la séquence mêlée ; la cible d'insertion de l'occurrence est exprimée sans ambiguïté par rapport aux points (index dans la séquence mêlée de la portée cible). Conserver une forme compatible avec l'appel actuel de l'écran (`{zone, index}` en occurrences) avec une convention documentée (l'occurrence est insérée avant le point qui occupe l'emplacement visé), pour que l'écran actuel continue de fonctionner sans modification ; la story 6.2 passera à l'index mêlé. Refus (résultat discriminé existant, sans mutation) si un point devient interdit ou consécutif.
- **Duplication** : la copie est insérée juste après la source, avant le point qui la suivait (`[A, P, B]` → `[A, A′, P, B]`) ; la récupération est copiée, jamais le point ; refus si cela rendait un point interdit ou consécutif (en pratique impossible : documenter).
- **Suppression d'occurrence** : refus sans mutation si un point deviendrait interdit ou consécutif ; plus aucune suppression silencieuse de point. Retour discriminé exploitable par l'écran (raison du refus pour l'annonce d'accessibilité).
- **R2** déplacement autonome : nouvelle opération (point, portée et position cibles) ; refus si interdit, consécutif, ou emplacement occupé ; identité conservée.
- **Placement** : `placementSlots` ne propose jamais un emplacement qui créerait deux points consécutifs compte tenu de l'état effectif (existants − retraits + ajouts) ; le sous-brouillon porte des retraits programmés de points existants (toggle) ; `hasPlacementChanges` et `applyPlacementDraft` les appliquent ; une resélection annule le retrait ; état du libellé : fournir au Domaine ou à la présentation une fonction pure qui distingue « ajouts seuls » de « retraits, mélange ou modification de durée » (le libellé lui-même est fait en 6.3).
- **Exécution** : `expandComposition` ne produit jamais deux étapes `STOP_POINT` successives (étapes `RECOVERY` ignorées pour ce test) : en Séries partielles, le second est omis ; Tours inchangés (garantis par la règle structurelle).
- Fonctions pures, résultats discriminés plutôt qu'exceptions (convention du Domaine) ; noms en anglais ; commentaires en français citant D-436 / RM-251.

**Never:**
- Migration, changement de repository, de `Session.ts` persistant ou d'API ; modification de `src/features/` ou `app/` (story 6.2/6.3), sauf si une signature publique change de façon incompatible — dans ce cas, s'arrêter et le signaler plutôt que de modifier l'écran.
- Déplacer ou supprimer automatiquement un point pour rendre une opération valide.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Déplacer A sans P | [A, P, B, C] → A après B | [P?] : P devient premier → interdit (après Compte à rebours) | refus, inchangé |
| Déplacer A | [W, A, P, B] → A après B | [W, P, B, A] | — |
| Déplacer B rend P+Q consécutifs | [A, P, B, Q, C] → B après C | refus | inchangé |
| Supprimer A | [A, P, B] | refus (P après Compte à rebours) | raison |
| Supprimer B | [A, P, B, Q, C] | refus (P, Q consécutifs) | raison |
| Dupliquer A | [A, P, B] | [A, A′, P, B], R copiée | — |
| Déplacer P | [A, P, B, C] → après B | [A, B, P, C] | — |
| Déplacer P à côté de Q | [A, P, B, Q, C] → après C ? | autorisé si pas avant la Fin / pas consécutif | refus sinon |
| Frontière Circuit | point après dernier du Circuit + point après le Circuit | refus de l'opération qui crée le second | — |
| Placement | point existant après A | emplacement après A non proposé à l'ajout ; existant désélectionnable ; emplacements voisins consécutifs non proposés | — |
| Séries partielles | dernier exercice sans série au passage N, points avant et après | un seul STOP_POINT dans le plan | — |

</frozen-after-approval>

## Code Map

- `src/domain/sessions/StopPoint.ts` -- `isStopPointAllowed`, `anchorStopPoints`, `reattachStopPoints`, `stopPointDisplay`.
- `src/domain/sessions/composition.ts` -- `moveOccurrence`, `removeOccurrence`, `duplicateOccurrence`.
- `src/domain/sessions/placement.ts` -- `placementSlots`, `PlacementDraft`, `hasPlacementChanges`, `applyPlacementDraft`.
- `src/domain/sessions/circuit.ts` -- `expandComposition`.
- `src/domain/sessions/validation.ts` -- validation à l'enregistrement (ajouter RM-251).
- Tests : `src/domain/sessions/__tests__/` (`StopPoint.test.ts`, `composition.test.ts`, `placement.test.ts`, `circuit.test.ts`, `validation.test.ts`).

## Tasks & Acceptance

**Execution:**
- [x] Séquence mêlée et prédicat RM-251 + tests.
- [x] Opérations d'occurrence découplées (déplacer, dupliquer, supprimer avec refus) + tests.
- [x] Déplacement autonome d'un point + tests.
- [x] Placement : retraits programmés, emplacements non consécutifs, état du libellé + tests.
- [x] Plan d'exécution : fusion en Séries partielles + tests ; validation à l'enregistrement.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert ; les tests qui encodaient ARB-3 sont réécrits selon D-436 (liste dans les notes), aucun autre affaibli.

## Implementation Notes

Périmètre tenu : `src/domain/sessions/` (code et tests) et la fiche `src/domain/README.md` (le README de la tranche ; `src/domain/sessions/README.md` n'existe pas). Aucun fichier de `src/features/`, `app/` ou `docs/` modifié ; aucune migration, aucun repository, `Session.ts` inchangé. Fins de ligne conservées (LF / CRLF de chaque fichier). État après la revue (voir Review Triage Log).

**API du Domaine (ajouts et changements)**
- `StopPoint.ts` : supprimés `anchorStopPoints`, `reattachStopPoints`, `AnchoredStopPoint` (ARB-3 ; aucun usage hors Domaine). Ajoutés `STOP_POINT_SCOPE_ORDER`, `isSequenceSeparator` (prédicat unique : seule une occurrence `EXERCISE` sépare ; type absent = `EXERCISE`), `SequenceOccurrence`, `SequenceItem`, `scopeSequence`, `structuralSequence`, `positionInSequence`, `consecutiveStopPointPairs`, `areStopPointsNonConsecutive`, `wouldBeConsecutive`, `isCircuitHead`, `isStopPointProposable` (autorisé RM-219 et hors `(IN_TOUR, 0)`). `stopPointNeighbors` / `isStopPointAllowed` ne comptent plus que les séparateurs : une ancienne Récupération autonome n'est plus un voisin (RM-219). `stopPointDisplay` : même signature et même sortie ; l'occurrence n'est plus qu'un repère d'affichage.
- `composition.ts` : `CompositionOutcome` = `APPLIED {state}` | `NOT_FOUND` | `REFUSED {reason, stopPointIds}`, `reason` ∈ `STOP_POINT_NOT_ALLOWED` | `CONSECUTIVE_STOP_POINTS` | `LOCATION_OCCUPIED` | `AT_BOUNDARY`. Fonctions : `moveOccurrenceInSequence(state, id, zone, sequenceIndex)`, `moveOccurrenceOutcome(state, id, zone, occurrenceIndex)`, `stepOccurrence(state, id, "UP" | "DOWN")`, `removeOccurrenceOutcome(state, id)`, `duplicateOccurrenceOutcome(state, id, newId)` (lève si `newId` existe déjà), `moveStopPoint(state, stopPointId, {scope, position})`. Formes historiques conservées, signatures compatibles : `moveOccurrence`, `removeOccurrence` (état appliqué, ou l'entrée elle-même) et `duplicateOccurrence(state, id, newId, _newStopPointId?)` (4e paramètre optionnel et ignoré).
- `placement.ts` : `PlacementSlot.kind` (`OCCURRENCE` | `AFTER_CIRCUIT` | `UNOFFERED_STOP_POINT`), `PlacementStopPointSlot.stopPointId?` ; `PlacementDraft.stopPointRemovals` (identifiants) ; `placementSlots(exercises, stopPoints, placement?)` ; `PlacementContext` ; `togglePlacementStopPoint(placement, location, context?)`, `togglePlacementStopPointRemoval(placement, id, context?)`, `isPlacementStopPointRemoved(placement, id)`, `effectivePlacementStopPoints`, `placementConfirmation(placement, context?)` ; `hasPlacementChanges` compte les retraits ; `applyPlacementDraft` et `placementConfirmation` partagent un seul juge d'applicabilité.
- `circuit.ts` : `expandComposition` produit chaque point à sa place même si l'occurrence qui le précède ne joue pas, puis omet le point en trop (successif, en tête ou en fin, séparateur = `EXERCISE` joué) ; en Séries, un passage sans `EXERCISE` joué est omis.
- `validation.ts` : voisins lus sur la séquence triée (zone, puis `position`) ; RM-251 non contrôlée à l'enregistrement. `errors.ts` inchangé (le code `CONSECUTIVE` ajouté puis retiré).

**Convention `{zone, index}` (forme historique, appel actuel de l'écran)** : `index` compte les occurrences restantes de la portée cible ; l'occurrence est insérée juste après la `index`-ième, donc AVANT le point qui occupe l'emplacement visé (`index = 0` : en tête de portée). Même portée et même rang qu'avant : non-déplacement (l'entrée elle-même). En tête d'`AFTER_TOUR`, l'occurrence passe avant le point « après le Circuit ». La story 6.2 passera à `moveOccurrenceInSequence` / `stepOccurrence`.

**Contrat de `moveOccurrenceInSequence`** : `sequenceIndex` est compté sur la séquence mêlée de la portée cible dont la source est DÉJÀ retirée ; l'occurrence est insérée à ce rang. Revenir au rang d'origine dans la même portée : `APPLIED` avec l'entrée.

**Jugement des opérations (`judge`)**, dans l'ordre : Circuit vidé alors qu'il porte un point ; point devenu interdit (RM-219) ; point amené en tête de Circuit (sauf s'il y était déjà) ; nouvelle paire consécutive (RM-251 ; paire héritée exemptée sur ses seuls identifiants, même renumérotée — jamais pour le point déplacé par `moveStopPoint`) ; perte de l'unicité `(scope, position)`. Un point hérité hors bornes ou non entier est laissé intact (jamais borné).

**Tests réécrits (ARB-3 → D-436)**
- `StopPoint.test.ts` : bloc `anchorStopPoints / reattachStopPoints (ARB-3)` remplacé par « séquence mêlée (D-436) », « RM-251 : non-consécutivité » et « isStopPointProposable » ; libellé du test `stopPointDisplay` ajusté (attente inchangée).
- `composition.test.ts` : bloc ARB-3 remplacé par la matrice I/O et les cas de la revue.
- `placement.test.ts` : les attentes complètes de `placementSlots` (story 4.1) portent désormais `kind` ; le test « ancienne Récupération autonome » est réécrit (un point qu'elle seule précède n'est plus proposé, séparateur unique).
- `circuit.test.ts` : deux tests à point de tête de Circuit sans rien avant lui reçoivent un Exercice avant le Circuit (le point serait sinon en tête de Séance, désormais omis).
- `validation.test.ts` : le test d'origine est intact ; ajout d'un test « consécutifs hérités enregistrables, un seul arrêt au plan ».

**Écran (6.2 / 6.3)** — tests en échec, non corrigés ici, réécrits par le coordinateur après 5.1b : voir la section Verification du rapport. Branchements : 6.2 — `moveOccurrenceInSequence` (glisser), `stepOccurrence` (Monter / Descendre), `moveStopPoint`, rangée autonome à partir de `scopeSequence` ; 6.3 — `removeOccurrenceOutcome` (raison pour l'annonce), `placementSlots(…, placement)` et `kind`, `togglePlacementStopPoint(…, context)` / `togglePlacementStopPointRemoval`, `placementConfirmation(…, draft)`, retrait de `withoutStopPoint` / bulle et du 4e argument de `duplicateOccurrence`.

**Points pour Hermann**
- Plan développé : le point en trop (successif, en tête, en fin) est omis à l'exécution ; un point de tête de Circuit hérité n'est joué qu'au Tour 1 s'il coexiste avec un point de fin de Circuit.
- Les anciennes Récupérations autonomes ne sont jamais enregistrables (`MUST_BE_ABSENT`, T02-S02) : le tri et le séparateur de la validation n'ont donc pas d'effet observable à l'enregistrement ; ils servent de défense.

## Spec Change Log

## Review Triage Log

Revue du 22/10/2026, décisions du coordinateur sous délégation de Hermann ; toutes appliquées.

1. **Haut — tête de Circuit, Circuit vidé** : `judge` refuse (`STOP_POINT_NOT_ALLOWED`) tout point amené en `(IN, 0)` (sauf s'il y était déjà) et tout Circuit vidé qui porte encore un point. Tests : « Descendre » A dans `[W | A, P, B | Z]` (forme historique et `stepOccurrence`), A sortie vers AFTER, A supprimée, Circuit vidé par déplacement et par suppression, Circuit vidé avec `(BEFORE, nB)` + `(AFTER, 0)` → `CONSECUTIVE_STOP_POINTS`.
2. **Haut — unicité, exemption des paires héritées** : perte d'unicité refusée (`LOCATION_OCCUPIED`, contrôlée après RM-251 puisque deux points réunis sont aussi consécutifs) ; clé d'exemption `id@scope:position` (remplacée ensuite, voir 10) ; `moveStopPoint` n'exempte aucune paire contenant le point déplacé. Tests : retrait et sortie d'une ancienne Récupération entre P et Q, paire héritée qui bouge, P déplacé de l'autre côté d'un Q resté adjacent.
3. **Haut — plan Séries** : omission du point en tête et en fin en plus du successif ; passage sans `EXERCISE` joué omis (Séries) ; commentaire Tours corrigé (point de tête hérité fusionné, joué au Tour 1 seulement), avec test.
4. **Moyen — enregistrement** : violation `CONSECUTIVE` retirée de `validation.ts` et du code d'erreur (`errors.ts` revenu à l'identique) ; test : enregistrement accepté et plan à un seul arrêt.
5. **Moyen — points hérités hors bornes / non entiers** : laissés intacts par `stopPointsFromSequences` ; test.
6. **Moyen — placement** : points existants non proposés rendus (`UNOFFERED_STOP_POINT`), retraits par identifiant, ajout rendu même devenu consécutif, `togglePlacementStopPoint` avec contexte jugé contre `placementSlots`, sans contexte documenté comme historique, applicabilité commune à `applyPlacementDraft` et `placementConfirmation` ; tests.
7. **Moyen — non-déplacement, Monter / Descendre** : même place → `APPLIED` avec l'entrée (forme mêlée et forme historique) ; `stepOccurrence` ajouté ; contrat de `moveOccurrenceInSequence` documenté et testé, refus testé.
8. **Bas** : prédicat `isSequenceSeparator` unique (RM-251, fusion du plan, voisins de RM-219 — une ancienne Récupération n'est plus un voisin, documenté) ; validation triée par `(zone, position)` ; `duplicateOccurrenceOutcome` lève si `newId` existe déjà.
9. **Tests du verification gap** : refus « juste avant la Fin » (`[A, P, B]`, B en tête), inter-portées avec un point hérité en tête de Circuit, raison vérifiée sur « supprimer B `[A, P, B]` », fusion en Tours.
10. **Correctif final (point 2, séances héritées)** : pour les opérations sur les occurrences, l'exemption d'une paire héritée est de nouveau clée sur les seuls identifiants — une paire simplement renumérotée par un déplacement sans rapport reste autorisée. Restent refusés : deux points réunis sur un même emplacement (unicité, `LOCATION_OCCUPIED`) et toute paire contenant le point déplacé par `moveStopPoint`. Tests : paire héritée renumérotée par une occurrence déplacée devant elle → `APPLIED` (remplace « paire héritée qui bouge ») ; « P de l'autre côté d'un Q resté adjacent » → `REFUSED`, conservé ; retrait / sortie de l'ancienne Récupération entre P et Q → refusés par l'unicité.

## Verification

**Commands:**
- `npx jest src/domain/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
