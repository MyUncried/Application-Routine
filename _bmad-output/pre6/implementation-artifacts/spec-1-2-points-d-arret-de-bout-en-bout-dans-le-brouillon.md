---
title: "Story 1.2 — Points d'arrêt de bout en bout dans le brouillon"
type: 'feature'
created: '2026-10-20'
status: 'done'
baseline_commit: '9822b911c7a580df97c9638360da9519dd05352b'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les points d'arrêt existent en base (`session_stop_points`) mais pas dans le brouillon : toute modification de séance les efface (`SqliteSessionRepository.update` supprime puis réinsère ce que le brouillon ne porte pas), et le dépôt renumérote leur position. ARB-3 (clos) impose qu'un point accompagne son occurrence lors des déplacements, duplications et suppressions.

**Approach:** Porter `stopPoints` dans `SessionDraft` de bout en bout (hydratation, création, modification), avec `StopPoint = { id, scope, position }` où `position` est l'emplacement dans la portée (nombre d'occurrences de cette portée qui le précèdent). Rendre les opérations de Composition (déplacer, dupliquer, supprimer) conscientes des points, et valider placement et unicité à l'enregistrement. Aucune interface nouvelle (placement : story 4.1).

## Boundaries & Constraints

**Always:**
- Rattachement (ARB-3, ch09 L682 PR #390) : un point en `position = p ≥ 1` de la portée S est rattaché à la p-ième occurrence de S (dans l'ordre affiché). Un point en `position = 0` n'a pas d'occurrence d'attache : il reste en tête de sa portée.
- Déplacer une occurrence : ses points la suivent (nouvelle portée, nouvel emplacement) ; les autres points suivent leur propre occurrence ; positions recalculées.
- Dupliquer : la copie reçoit une copie de chacun des points de la source (nouvel identifiant fourni par l'appelant), juste après elle.
- Supprimer : les points rattachés à l'occurrence sont retirés avec elle.
- Emplacement interdit (RM-219, CE-T03-08 §14), lu sur la liste affichée (avant → dans → après le Circuit, sans répétition) : aucun Exercice ne le précède (juste après le compte à rebours initial) ou aucun ne le suit (juste avant la Fin). Au plus un point par `(scope, position)`.
- Un déplacement qui amènerait un point sur un emplacement interdit est un dépôt invalide : rien ne change (règle existante « Drop invalide restitue la position »).
- Une suppression qui laisserait un autre point sur un emplacement interdit retire aussi ce point (proposition ARB-3 d'origine, non contredite ; aucun blocage nouveau).
- Validation d'enregistrement : position entière dans `0..nombre d'occurrences de la portée`, emplacement autorisé, pas de doublon ; violations en union discriminée (champ `session.stopPoints`), sans exception côté domaine.
- Le dépôt enregistre `position` telle quelle (plus de renumérotation) ; la modification remplace les points par ceux du brouillon.
- `sessionDraftsEqual` compare les points par `(scope, position)`, identifiants ignorés.

**Never:**
- Aucun changement de schéma (`session_stop_points` inchangée), aucune migration.
- Aucun écran de placement, aucun rendu de point (stories 4.1 à 4.3).
- Ne pas modifier le comportement des occurrences ni des récupérations.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Aller-retour | séance avec points IN_TOUR p=1 et AFTER_TOUR p=0, modifiée (nom) | points relus identiques, rien effacé | — |
| Déplacement | A (point) B C dans le Circuit ; A déposée après B | B A(point) C : point en p=2 | — |
| Déplacement interdit | A(point) déplacée en dernière position, rien après | collection et points inchangés | dépôt invalide |
| Duplication | A(point) B | A(point) A'(point copié) B | — |
| Suppression | A(point) B ; supprimer A | B, aucun point | — |
| Suppression rendant interdit | A(point) B ; supprimer B (dernière) | A, point retiré | — |
| Enregistrement invalide | point p=0 de BEFORE_TOUR, ou doublon, ou p hors bornes | violation, rien écrit | union discriminée |
| Garde de sortie | seul un point ajouté ou déplacé | brouillon « modifié » | — |

</frozen-after-approval>

## Code Map

- `src/domain/sessions/StopPoint.ts` -- renommer `order` → `position` (sémantique : emplacement) ; réutiliser `isStopPointPlacementValid` ; ajouter `stopPointNeighbors(exercises, point)`, `isStopPointPositionInRange`, unicité par `(scope, position)` (adapter `hasUniqueOrderPerScope` / `orderStopPointsByScope`) ; fonctions pures de rattachement (occurrence d'attache ↔ position) utilisées par `composition.ts`. Retirer la mention « non encore câblé ». Tests : `__tests__/StopPoint.test.ts`.
- `src/domain/sessions/composition.ts:146-260` -- garder `moveActivity` / `removeActivity` / `duplicateActivity` (utilisés tels quels) et ajouter leurs équivalents sur `{ exercises, stopPoints }` (ex. `moveOccurrence`, `removeOccurrence`, `duplicateOccurrence(…, newId, newStopPointId)`), qui délèguent aux existants puis recalculent les points. Déplacement interdit → retourne l'entrée inchangée (même référence). Tests : `__tests__/composition.test.ts`.
- `src/features/sessions/CompositionScreen.tsx:470-505` -- `handleDropActivity`, `handleDuplicateActivity`, `handleDeleteActivity` appellent les nouvelles fonctions et mettent à jour `exercises` et `stopPoints` ensemble (`Crypto.randomUUID()` pour chaque point copié). Aucun rendu ajouté.
- `src/domain/sessions/SessionDraft.ts` -- champ `stopPoints?: readonly StopPoint[]` (convention de transition, lecture `?? []`) ; `toSessionDraft` hydrate `session.stopPoints` ; `toCreate/UpdateSessionInput` transmettent `{ scope, position }` ; `sessionDraftsEqual`.
- `src/domain/sessions/Session.ts:176-186,277-279,316,373` -- `CreateStopPointInput = { scope, position }` ; JSDoc mise à jour (plus « plumbing uniquement »).
- `src/domain/sessions/validation.ts:701,817` -- valider les points (avec les occurrences validées de l'agrégat) ; `errors.ts` : champ `session.stopPoints`.
- `src/infrastructure/database/repositories/SqliteSessionRepository.ts:500-515,695-718,1056-1066` -- `insertStopPoints` écrit `position` reçue ; `getStopPoints` mappe vers `position` ; commentaire de remplacement à jour.
- Tests existants passant `stopPoints: [{ scope }]` : ajouter `position` (seules attentes à adapter).

## Tasks & Acceptance

**Execution:**
- [x] `StopPoint.ts` + tests -- modèle `position`, voisins, bornes, unicité, rattachement.
- [x] `composition.ts` + tests -- opérations conscientes des points ; toute la matrice (déplacement, interdit, duplication, suppressions).
- [x] `Session.ts`, `SessionDraft.ts`, `validation.ts`, `errors.ts` + tests -- aller-retour brouillon/entrée, validation, garde de sortie.
- [x] `SqliteSessionRepository.ts` + tests -- position enregistrée telle quelle ; non-régression : une modification sans changement de points les conserve.
- [x] `CompositionScreen.tsx` + test d'intégration existant ou nouveau -- dupliquer / supprimer / déposer mettent à jour les points du brouillon.

**Acceptance Criteria:**
- Given une séance avec points, when elle est rouverte, modifiée puis enregistrée, then ses points sont relus aux mêmes emplacements (R2 corrigé).
- Given la suite complète, when `npm test`, `npx tsc --noEmit`, `npm run lint`, then tout est vert, aucun test existant supprimé.

## Implementation Notes

- Implémenté par sous-agent (20/10). Fonctions pures de rattachement dans `StopPoint.ts` ; opérations `moveOccurrence` / `removeOccurrence` / `duplicateOccurrence` dans `composition.ts`. Un point déjà invalide dans les données n'est ni bloqué ni retiré par une opération ; il est refusé à l'enregistrement.
- Correctifs de revue : validation adossée aux fonctions de `StopPoint.ts`, relecture en ordre structurel (`structuralOrderSql`), dépendances des gestionnaires, documentation.
- Vérification : Jest 127 suites / 3326 tests, `tsc` et `lint` sans erreur.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | edge + blind | Points persistés avant la story relus avec la nouvelle sémantique | false | Aucun écran n'a jamais créé de point (`Session.ts` : « Aucun écran ne les crée encore » ; aucun usage dans `src/features` au commit de base) : seules des données de test existent. |
| 2 | edge + blind | Point invalide = Continuer désactivé sans message | low, rejeté | Atteignable seulement avec des données déjà invalides ; les opérations n'en créent pas. Retrait par l'interface : story 4.2. |
| 3 | edge + blind | Duplication sans contrôle d'emplacement / collision avec un point hors bornes | low, rejeté | Une copie hérite d'un emplacement valide si la source l'était (même voisin suivant) ; seul un point déjà invalide produit ce cas. |
| 4 | edge | `null` dans `stopPoints` lève | low, rejeté | Entrée typée `CreateStopPointInput[]`, construite par le domaine. |
| 5 | edge + blind | Les anciennes Récupérations autonomes comptent comme voisins | low, rejeté | Ce sont des occurrences réelles de la séquence ; plus jamais créables (D-041). |
| 6 | blind | Validation qui réécrit les règles de `StopPoint.ts` | medium | patch : réutilisation des fonctions partagées. |
| 7 | blind | Descriptions des codes d'erreur périmées | low | patch : JSDoc complétée. |
| 8 | blind | Points relus dans l'ordre alphabétique des portées | low | patch : ordre structurel (D-061). |
| 9 | blind | Gestionnaires recréés à chaque frappe | low | patch : dépendances `draft.exercises` et `draft.stopPoints`. |
| 10 | blind | README du domaine contradictoire | low | patch : phrase corrigée. |
| 11 | blind | Erreurs de points masquées par celles des occurrences | false | Choix délibéré : positions non significatives tant qu'une occurrence est rejetée. |
| 12 | blind | Dépôt refusé sans retour | false | Comportement existant du dépôt invalide (restitution), inchangé. |
| 13 | blind | Ajout et édition d'occurrence non analysés | false | L'ajout se fait en fin de zone (rattachements intacts) ; l'édition conserve `id` et zone. |
| 14 | blind | Test de duplication incapable de détecter une inversion d'identifiants | low, rejeté | Logique d'identifiants couverte en domaine (`composition.test.ts`). |
| 15 | blind | Statuts et journaux de spec | false | Transitions du workflow. |
| — | verification-gap | Aucun écart | — | — |

## Design Notes

Rattachement calculé, jamais stocké : avant l'opération, chaque point `p ≥ 1` est associé à l'identifiant de la p-ième occurrence de sa portée ; après l'opération, `scope` = portée actuelle de cette occurrence, `position` = son rang dans cette portée + 1. Points sans attache (`p = 0`) inchangés. Un point dont l'occurrence a disparu est retiré.

## Verification

**Commands:**
- `npx jest src/domain/sessions src/infrastructure/database src/features/sessions` -- expected: vert.
- `npm test` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
