---
title: 'A3.2 — Consultation et réordonnancement des Niveaux'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: 'c7140692e352f296025ff12e507bc5a379bc360e'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/implementation-artifacts/epic-A3-context.md'
  - '{project-root}/src/features/activities/README.md'
  - '{project-root}/src/features/sessions/README.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le groupe de niveaux d'un geste se lit dans le popover de la fiche (A3.1) mais ne peut ni se consulter en liste ni se réordonner, alors que « l'ordre se modifie par glissement » (MFN-05 ch10 l.374, MFN-07 l.404, ch03 l.154, MFN/AC07, MFN/AC33).

**Approach:** Écran « Niveaux » sans frame Figma (`NON VÉRIFIABLE`, ch13 l.157), composé de composants existants : liste ordonnée du groupe (rang, nom du geste, nombre d'Exercices du Catalogue) en lignes `DraggableRow` (glisser, Monter / Descendre accessibles, repère `InsertionGuide`, transitions `SheetMotionView`), présentée en `Modal` native plein écran au-dessus de la fiche (procédé de `MovementSearchScreen`, A2.3). Chaque dépose écrit l'ordre par `MovementRepository.reorder` via le service, sans question d'identité ; à la fermeture, la fiche relit ses niveaux (pastille et popover à jour).

## Boundaries & Constraints

**Always:** D-439, MFN-05 (rang et total dérivés, jamais persistés ; réordonner n'est pas une modification du geste : aucun dialogue d'identité, aucun contenu touché, aucune fusion), MFN/AC07 (rang recalculé), MFN/AC33 ; primitive acceptée `DraggableRow` réutilisée sans modification ; textes au lexique (« geste », « niveau », jamais « mouvement ») ; cibles ≥ 44 hors poignée (poignée : 36, AD-28 du composant) ; « Réduire les animations » respecté ; écriture par le service et le repository seulement ; trois contrôles verts ; tests existants non affaiblis.

**Never:** mécanique de glisser de la Composition (`useAnimatedShift`, `compositionGesture`) — plan §8 ; retrait d'un membre ou rattachement depuis l'écran (aucun accès documenté) ; quatrième action glissée au Catalogue (D-196) ; rang dans l'historique ; nouvelle route `app/` (CE-T03-04 l.775 : « sans créer de nouvelles destinations ») ; migration, schéma, `tokens.ts`, `package.json`, `app.json`, `.github/`, `main`.

**Décisions conservatrices (Hermann absent, à valider — détail en Implementation Notes) :** accès par une entrée « Réordonner les niveaux » en fin du sous-menu « Changer de niveau » du popover (iOS natif ; étape Niveaux du panneau de repli), disponible dans les mêmes conditions (au moins deux niveaux) ; les deux actions documentées du popover restent seules à sa racine ; titre « Niveaux » ; lignes non touchables (consultation et ordre seulement) ; écriture immédiate à chaque dépose, sans `Terminer` ; échec : ordre relu restauré et message d'erreur.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Consultation | fiche d'un Exercice rang 2 sur 3, entrée choisie | liste « 1 · A », « 2 · B », « 3 · C », nombre d'Exercices par niveau | lecture en échec → liste vide, message d'erreur (journal) |
| Glisser | niveau 3 déposé en tête | ordre C, A, B écrit ; numéros 1-3 recalculés ; contenu et identités intacts | écriture en échec → ordre relu restauré, message |
| Monter / Descendre | action accessible sur le niveau 2 | même déplacement métier que le glisser | idem |
| Bornes | niveau 1 / dernier | pas de Monter / pas de Descendre | N/A |
| Retour à la fiche | après réordonnancement | pastille « Niveau r » et choix du popover relus | N/A |
| Sans groupe / singleton | popover | entrée indisponible (comme « Changer de niveau ») | N/A |
| Geste local du groupe | niveau sans Exercice au Catalogue | ligne présente, « 0 exercice » omis, déplaçable | N/A |

</frozen-after-approval>

## Code Map

- `src/features/activities/ActivityDefinitionService.ts` -- ajouter `reorderMovementLevels(movementId, orderedMovementIds)` : lit le geste (`findById`), `reorder(groupId, ids)` ; issue `{ status: "OK", levels }` (relecture `getMovementLevels`) | `NOT_FOUND` | `INVALID_ORDER` ; `NOT_FOUND` sans `MovementRepository` ou sans groupe. Ne pas toucher `getMovementLevels`.
- `src/infrastructure/database/repositories/SqliteMovementRepository.ts:410-426` -- `reorder` (permutation exacte, transaction exclusive) réutilisé tel quel.
- `src/features/activities/sheetTable.tsx` -- `DraggableRow` (lignes 36, `onMove(to)`, `onDrag`, `onLiftedChange`, `labels` à `{n}`), `InsertionGuide`, `tableStyles.block` ; inchangé.
- `src/features/activities/WorkPhasesTable.tsx:104-152, 187-236` -- patron d'appelant à reproduire (repère `guideBefore`, ligne soulevée, `SheetMotionView transition="row" raised clip`).
- `src/features/activities/SheetMotion.tsx` -- `SheetMotionProvider` (avec `useReduceMotion` de `shared/ui`), `SheetMotionView`, `SheetMotionGroupMount`.
- `src/features/activities/MovementSearchScreen.tsx` -- patron de `Modal` plein écran : `ScreenShell`, `FixedHeader` `closeIcon`, `EDITOR_HEADER`, `editorSideMargin`.
- Nouveau `src/features/activities/MovementLevelsScreen.tsx` -- l'écran (props `service`, `movementId`, `onClose`).
- `src/features/activities/MovementLevelMenu.tsx` -- `MovementLevelMenuModel.onReorderLevels` ; bouton natif en fin du sous-menu `level-change` ; ligne `reorder` en fin de l'étape `LEVELS` du panneau.
- `src/features/sessions/ExerciseScreen.tsx:846-900` -- état d'ouverture de l'écran, `onReorderLevels` (refusé pendant `isSaving`), jeton de relecture des niveaux à la fermeture (sans remettre `levels` à `null` : le formulaire reste monté).
- `src/shared/i18n/resources/fr.ts` -- clés `levelMenu.reorderLevels`, `levelOrder.*`.
- Ne pas toucher : `sheetTable.tsx`, `SheetMotion.tsx`, `compositionMotion.ts`, `useAnimatedShift.ts`, repositories, `ActivityEditorForm.tsx` (le modèle traverse tel quel).

## Tasks & Acceptance

**Execution:**
- [x] `ActivityDefinitionService.ts` + `__tests__/movementLevels.a32.test.ts` (SQLite réelle) -- `reorderMovementLevels`, identités et contenus intacts, `INVALID_ORDER`, sans groupe.
- [x] `fr.ts`, `MovementLevelsScreen.tsx` + `__tests__/MovementLevelsScreen.a32.test.tsx` -- liste, glisser, Monter / Descendre, bornes, échec d'écriture et de lecture, réduction des animations.
- [x] `MovementLevelMenu.tsx` + tests existants complétés -- entrée iOS et panneau, indisponible sans groupe.
- [x] `ExerciseScreen.tsx` + `features/sessions/__tests__/ExerciseScreen.mfn.a32.integration.test.tsx` -- ouverture depuis le popover, réordonnancement réel, pastille relue à la fermeture, aucune question d'identité.
- [x] READMEs `src/features/activities/`, `src/features/sessions/`, `deferred-work.md`, `sprint-status.yaml`.

**Acceptance Criteria:**
- Given un groupe A, B, C et la fiche de B (« Niveau 2 »), when B est monté puis l'écran fermé, then la pastille affiche « Niveau 1 », `movements` ne change que dans `level_sort_key` / `updated_at`, et aucun Exercice n'est modifié.
- Given l'application, when les trois contrôles s'exécutent, then ils sont verts.

## Implementation Notes

- Implémentation conduite directement par l'agent de la story (comme A1.3 à A3.1), sans sous-agent d'implémentation. Checkpoints pré-approuvés par Hermann (absent) ; spec conservée entière (environ 1 700 jetons, au-dessus de la cible de 1 600 : matrice et décisions conservatrices gardées dans le bloc figé).
- **Accès (docs) :** MFN-07 (ch10 l.400) « Accès … par le popover de niveau de sa fiche : Changer de niveau / Ajouter un niveau » ; ch08 l.174 « Les niveaux sont accessibles depuis la fiche » ; ch03 l.154 « glisser réordonne les niveaux ». Aucun texte ni frame ne nomme l'accès à la liste : entrée placée dans le sous-menu « Changer de niveau » pour laisser la racine du popover (`9577:19843`) à ses deux actions documentées.
- **Présentation sans route :** CE-T03-04 (ch13 l.775) « sans créer de nouvelles destinations » et relevé MFN l.7 (« pas … de nouvelles destinations de navigation ») : `Modal` plein écran comme `MovementSearchScreen` (A2.3), au lieu d'une coquille `app/` évoquée par la mission. Avantages : brouillon de la fiche intact, relecture des niveaux à la fermeture sans écouteur de focus.
- **Primitive :** `@expo/ui` 57.0.13 expose `List.ForEach` avec `onMove` (réordonnancement natif SwiftUI). Non utilisé : le plan approuvé (§3, §8) et le contexte d'epic prescrivent `DraggableRow` (composant accepté, Monter / Descendre accessibles) ; consigné pour Hermann (point 5).
- **Mouvements :** `DraggableRow` porte sa propre mise en place (`TABLE_ROW_DROP_MS`) et les autres lignes glissent par `SheetMotionView transition="row"` (`SHEET_ROW_SHIFT_MS`) : jeu de mouvements de la Feuille, déjà associé au composant. `compositionMotion.ts` / `useAnimatedShift.ts` (registre de translations de la Composition) ne sont pas branchés : les y relier modifierait `DraggableRow` ou reprendrait la mécanique de la Composition (plan §8).
- **Points renvoyés à Hermann (option conservatrice appliquée) :**
  1. Accès : « Réordonner les niveaux », dernière entrée du sous-menu « Changer de niveau » (iOS natif ; étape des niveaux du panneau de repli). Alternatives : troisième action à la racine du popover ; « Changer de niveau » ouvrant directement l'écran.
  2. Textes nouveaux : « Réordonner les niveaux », titre « Niveaux », « Déplacer / Monter / Descendre le niveau {n} », « Niveau {n} », « Impossible de charger les niveaux. », « Réessayer », « La modification n’a pas pu être enregistrée. Réessayez. » (modèles du lexique existant).
  3. Écriture immédiate à chaque dépose (comme API-COM-06 : « appelée uniquement à la dépose »), sans `Terminer` ni Annuler. Alternative : brouillon d'ordre validé par une action.
  4. Lignes non touchables (pas d'ouverture d'Exercice depuis la liste), Exercice ouvert non signalé, aucun retrait ni rattachement depuis l'écran (reporté, `deferred-work.md`).
  5. Glisser par `DraggableRow` (lignes de 36, poignée 12 × 18 à cible 36) plutôt que la liste native SwiftUI `List` / `onMove`.
- **Recette JA (écran `NON VÉRIFIABLE`) :** ouverture et fermeture (glissement de la `Modal`), glisser au doigt sur 3 niveaux et plus (repère, ligne soulevée, décalage des voisines), VoiceOver Monter / Descendre, pastille et popover relus au retour, texte agrandi (lignes de 36), 360 / 402 / 440, « Réduire les animations ».

## Spec Change Log

## Review Triage Log

Passe 1 (24/10/2026) : trois relectures (aveugle, cas limites, lacunes de vérification), sous-agents indépendants.

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | blind + edge (×2) | Fermeture pendant une écriture en vol : la fiche relit aussitôt et peut garder l'ancien rang | medium | Vérifié (`onClose` immédiat, relecture avant la fin de la transaction) ; patch (la fermeture attend l'écriture en vol, aucun déplacement après la demande ; test) |
| 2 | blind | La `Modal` glisse même sous « Réduire les animations » | low | Vérifié ; patch (`animationType` `none` ; test) |
| 3 | blind | JSDoc et README « seules les clés de tri changent » alors que `updated_at` change aussi | low | Vérifié (`writeGroupOrder`) ; patch (texte corrigé) |
| 4 | edge | Fermeture pendant l'écriture puis échec : erreur non montrée | low | Avec #1, la fiche relit l'état réel (ancien ordre) ; rejeté |
| 5 | blind + edge | Dépose pendant une écriture ignorée sans signe ; ligne qui saute | low | Écriture locale de quelques millisecondes ; garde = état et poignées indisponibles (scintillement à chaque dépose) ; rejeté |
| 6 | blind | Échec `INVALID_ORDER` / `NOT_FOUND` : instantané restauré périmé, échecs répétés, message inadapté | low | Exige une modification concurrente du groupe, impossible depuis l'app pendant la `Modal` ; rejeté |
| 7 | blind + edge | `getMovementLevels` nul ou vide : « Réessayer » inutile, tableau vide | low | Entrée disponible seulement à deux niveaux ou plus ; même cause concurrente que #6 ; rejeté |
| 8 | blind + edge | `findById` hors transaction, double lecture, statuts repliés en `NOT_FOUND`, relecture en échec après écriture | low | Concurrence non atteignable (base locale, un seul écran) ; repli exhaustif sur l'union actuelle ; rejeté |
| 9 | blind | Bouton Réessayer composé à la main, rayon 24 brut | low | Copie de l'état d'erreur existant d'`ExerciseScreen` (`loadErrorRetry`), non une invention ; rejeté |
| 10 | blind | ✕ annoncé « Retour » | low | Même choix que `MovementSearchScreen` (A2.3, `closeAccessibilityLabel: "Retour"`) ; texte soumis à Hermann (point 2) ; rejeté |
| 11 | blind | Textes et emplacement de l'entrée non consignés pour Hermann | false | Consignés dans Implementation Notes, points 1 et 2, avec sources |
| 12 | blind | Groupe à un niveau non traité | false | Entrée dans le sous-menu indisponible sous deux niveaux (`canChangeLevel`) ; test « geste sans groupe » |
| 13 | blind | « Réordonner les niveaux » sans effet pendant `isSaving`, sans indication | low | Écriture de `Terminer` brève, même garde qu'A3.1 ; rejeté (lacune de test : #15) |
| 14 | edge | `levelMovementId` nul pendant que l'écran est ouvert | false | Ne dépend que du chargement terminé et du geste lu, inchangés pendant la `Modal` |
| 15 | verification-gap | Garde `isSaving` de `onReorderLevels` non testée (comme celles d'A3.1) | low | Lacune pré-vérifiée, disposition defer ; defer (`deferred-work.md`) |
| 16 | blind | Double ligne vide dans le test d'intégration ; spec absente du diff | false | Ligne déjà retirée avant revue ; spec hors diff par construction |

Contrôles après correctifs : `npm test -- --maxWorkers=2` 171 suites, 4 300 tests verts ; `npx tsc --noEmit` vert ; `npm run lint` vert. Avant revue : 171 suites, 4 298 tests.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
