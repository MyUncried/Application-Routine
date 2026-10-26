---
title: 'R-9 — Recette JA2 : menu Niveau restructuré, crayon actif en Séance (D-448)'
type: 'feature'
created: '2026-10-26'
status: 'done'
baseline_commit: 'b17c290c68ba3eb437c7c06480592212a16a11ea'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/planning-artifacts/arbitrage-2026-10-26-recette-ja2-d448.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Recette JA2 :
- au Catalogue en modification, Hermann veut le menu Niveau en trois entrées de premier niveau : « Naviguer vers », « Ajouter un niveau », « Réordonner les niveaux » (remarques générales) ;
- en Séance, le crayon disparaît une fois touché : on ne voit plus que l'édition du mouvement est active, et on ne peut pas en sortir (nv-9).

**Approach:**
- Le menu partagé reçoit la nouvelle structure dans les trois contextes, avec un libellé adapté au contexte (précision de Hermann).
- Dans l'éditeur d'occurrence de Séance, le crayon devient un interrupteur. Toucher pendant l'édition la quitte : sans confirmation s'il n'y a aucun changement, avec la confirmation d'abandon existante sinon.

## Boundaries & Constraints

**Always:**
- **Point 9, racine du menu** (iOS natif et panneau Android/web) :
  1. sous-menu de la liste des niveaux, intitulé « Naviguer vers » au Catalogue en modification (choix par Exercice) et « Changer de niveau » en Séance et en reprise (choix par mouvement) ;
  2. « Ajouter un niveau », avec Plus facile / Plus difficile, indisponible comme aujourd'hui quand `onAddLevel` est `null` ;
  3. « Réordonner les niveaux », retiré du sous-menu des niveaux, avec la même condition de disponibilité qu'aujourd'hui (au moins deux niveaux).
  Les comportements de choix, d'ajout et de réordonnancement sont inchangés. Le menu reste le `Menu` SwiftUI d'`@expo/ui` sur iOS.
- **Point 10, crayon de l'occurrence en Séance** :
  - une fois touché, le crayon reste affiché, à l'état actif (`accessibilityState.selected`, fond ou teinte d'état actif de la feuille de style existante) ;
  - un nouveau toucher quitte l'édition du mouvement ;
  - sans changement depuis le déverrouillage, retour immédiat à l'état verrouillé ;
  - avec changements (contenu du mouvement ou structure de phases), la confirmation d'abandon existante s'affiche (`ExerciseExitConfirmModal`, « Abandonner les modifications ? ») : Confirmer restaure l'état d'avant le déverrouillage et reverrouille, Annuler laisse l'édition ouverte ;
  - Terminer garde son comportement actuel (dialogue C03).
- Le crayon de reprise au Catalogue (`contentUnlocked`) est hors périmètre.

**Never:** modifier la garde de navigation (`useCompositionExitGuard`) ; ajouter des entrées au menu ; changer le menu Niveau masqué pendant l'édition du mouvement.

</frozen-after-approval>

## Code Map

- `src/features/activities/MovementLevelMenu.tsx`:
  - en-tête `:28-56` (à jour) ; modèle `:84-95` ; `canChangeLevel` `:128-131` ;
  - racine iOS `:240-272` : le sous-menu `changeLevel` en `:256-262` contient le bouton « Réordonner » `:261` (testID `${testID}-reorder`), et `addLevel` est en `:264-271` ;
  - panneau `:388-470` : la ROOT `:398-402`, l'étape LEVELS avec la ligne `reorder` `:441-452` à remonter, l'étape ADD `:403-412`.
  Le libellé du sous-menu dépend de `movementChoice` (absent : « Naviguer vers »).
- `src/shared/i18n/resources/fr.ts:287-300` `levelMenu` -- ajouter « Naviguer vers » ; garder `changeLevel` ; mettre le commentaire de `reorderLevels` à jour.
- `src/features/sessions/ExerciseScreen.tsx`:
  - `:370-389` `EditMovementAction`, qui n'a pas d'état ;
  - `CompositionExerciseEditor` `:1313`, avec `unlockedMovement` `:1385` (type `:1266`), `movementLocked` `:1388`, `canUnlockMovement` `:1392-1396` (qui cache le crayon une fois déverrouillé) et `unlockMovement` `:1693-1725` ;
  - en-tête `:1887` ; `occurrenceEquals` `:1220` ; modale d'abandon `:1955-1957`.
  Prendre un instantané de `local` et `instructionSteps` au déverrouillage pour détecter les changements et les restaurer.
- `src/features/sessions/ExerciseExitConfirmModal.tsx:68` -- réutiliser tel quel.
- Tests à mettre à jour :
  - `src/features/activities/__tests__/MovementLevelMenu.test.tsx` (`:129-183`, `:153`, `:234-235`, `:249-264`, `:327-334`, `:365`) ;
  - `src/features/sessions/__tests__/ExerciseScreen.mfn.a32.integration.test.tsx:215`, `:273` ;
  - `ExerciseScreen.mfn.a31.integration.test.tsx:217`, `:256` ;
  - `ExerciseScreen.r6.integration.test.tsx:234`, `:321-333`, `:374-385` ;
  - `ExerciseScreen.r4.integration.test.tsx:262` (crayon `toBeNull` après déverrouillage, en Séance) ;
  - `ExerciseScreen.mfn.a22.integration.test.tsx:620`.
  Pour `:495-499` (chemin de reprise), vérifier que le test reste valide.
- READMEs : `src/features/activities/README.md:55`, `src/features/sessions/README.md:156`.

## Tasks & Acceptance

**Execution:**
- [x] `src/features/activities/MovementLevelMenu.tsx` -- racine à trois entrées (iOS et panneau), libellé selon le contexte -- point 9.
- [x] `src/shared/i18n/resources/fr.ts` -- « Naviguer vers » -- point 9.
- [x] `src/features/sessions/ExerciseScreen.tsx` -- crayon interrupteur, instantané au déverrouillage, sortie avec ou sans confirmation -- point 10.
- [x] Tests (`.r9`) et mises à jour listées : structure du menu dans les trois contextes ; crayon actif ; sortie sans changement ; sortie avec changements (Annuler puis Confirmer, contenu restauré).
- [x] READMEs et chapitre 13 : annoter la structure du menu Niveau et le crayon de CE-UI-NIV-01 et du contrat de l'éditeur, « [remplacé par D-448 du 26/10/2026 : …] ».

**Acceptance Criteria:**
- Given un Exercice du Catalogue en modification avec un groupe de niveaux, when on ouvre la pastille, then la racine montre « Naviguer vers », « Ajouter un niveau », « Réordonner les niveaux ».
- Given une occurrence en Séance, when on touche le crayon, modifie la description puis retouche le crayon et confirme, then la description d'origine est rétablie et le contenu est reverrouillé.
- Given les trois contrôles, when ils s'exécutent, then ils passent.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Revue du 26/10/2026 : trois couches (Blind Hunter, Edge Case Hunter, Verification Gap) sur le diff depuis `b17c290c`.

| # | Source | Constat | Verdict | Preuve | Route |
|---|---|---|---|---|---|
| 1 | ECH, BH | Une modification de paramètres seule pendant l'édition du mouvement déclenche la confirmation, et Confirmer l'annule | medium | `changedSinceUnlock` et `abandonMovementEdit` portent sur toute l'occurrence ; l'intention vise « contenu du mouvement ou structure de phases » | patch |
| 2 | VG, BH | Aucun test pour un changement de nom ou de structure de phases seule, suivi de l'abandon, ni pour des paramètres seuls conservés | low | Seul le test de description existe | patch (tests) |
| 3 | BH | `isPendingRelock` n'est pas remis à zéro quand le mouvement est reverrouillé par un autre chemin | low | Correction directe : remise à zéro avec `unlockedMovement` nul | patch |
| 4 | BH | Crayon actif sans indication d'accessibilité de l'action suivante | low | Seul `accessibilityState.selected` ; une clé d'indication dans le lexique | patch |
| 5 | BH | Chapitre 13 : §6 « Libellés … statiques » et l.739 « Changer de niveau / Ajouter un niveau » non annotés ; règles du crayon sans source citée ; autres contextes du crayon non précisés | low | Lignes citées | patch (doc) |
| 6 | BH | Panneau Android en Séance : « Réordonner » en troisième ligne racine non exercé jusqu'à l'écran des niveaux | low | Gap | patch (test) |
| 7 | BH | Message de la modale réutilisée inadapté | false | Hermann (nv-9) : « avec le message de demande de confirmation défini » ; réutilisation voulue | reject |
| 8 | BH | Invite « (compléter le nom) » non restaurée à l'abandon | false | L'invite ne concerne que la création d'une variante, jamais une occurrence déverrouillée | reject |
| 9 | BH | `changedSinceUnlock` duplique `occurrenceEquals` | low | Réécrit par le correctif 1 | reject |
| 10 | BH | Rendu actif du crayon non consigné pour contrôle visuel | false | Inscrit au cahier de recette JA3 | reject |
| 11 | ECH | Médias ajoutés pendant l'édition puis abandonnés : copies orphelines validées à Terminer | low | `commitMediaDraft(mediaDraftId)` ; fichiers sans référence, aucun effet visible | defer |
| 12 | ECH | Catégorie supprimée pendant l'édition puis restaurée par l'abandon | low | Séquence improbable ; garde supplémentaire | reject |
| 13 | ECH | Instantané pris avant la fin du chargement du mouvement | false | Le contenu reste verrouillé jusqu'au chargement ; après le correctif 1, les paramètres ne sont plus restaurés | reject |
| 14 | VG | Sortie d'écran pendant une confirmation de reverrouillage non testée | low | Gap filé, disposition de la couche : defer | defer |
| 15 | BH | Fichiers de suivi absents du diff | false | Exclus par construction | reject |

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
- `npx jest --maxWorkers=2` -- expected: toutes les suites vertes
