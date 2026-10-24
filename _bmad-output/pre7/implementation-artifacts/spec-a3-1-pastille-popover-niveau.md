---
title: 'A3.1 — Pastille et popover de Niveau'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: '173a72565d2dbd8cbf239b334d948406f8aafbbb'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/implementation-artifacts/epic-A3-context.md'
  - '{project-root}/src/features/activities/README.md'
  - '{project-root}/src/features/sessions/README.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les groupes de niveaux existent dans le domaine et la persistance (A1.1 à A1.3), mais la fiche d'un Exercice n'affiche aucun niveau et n'offre aucun accès aux niveaux : ni pastille « Niveau X » dans la rangée de classification, ni popover « Changer de niveau / Ajouter un niveau » (D-439, MFN-05, MFN-07, CE-T03-04 §9).

**Approach:** Service : niveaux dérivés d'un geste (rang, total, membres ordonnés et leurs Exercices du Catalogue). Éditeur : pastille en troisième position de la rangée (Figma `9029:18363`, `9925:41506` / `9925:41515`, icône `9932:44044`) ; sur un Exercice existant du Catalogue, la pastille est le déclencheur du menu natif SwiftUI (`@expo/ui`, procédé de `CircuitNatureMenu.tsx`), repli `AnchoredPanel` hors iOS. « Changer de niveau » : niveau choisi, puis Exercice choisi explicitement par le résumé de ses paramètres s'il y en a plusieurs ; ouvre cet Exercice. « Ajouter un niveau » : création d'un nouveau geste et de son Exercice, initialisés depuis l'original, inséré juste après l'origine (`VARIANT`, `joinOriginGroup: true`), sans question d'identité.

## Boundaries & Constraints

**Always:** D-439, MFN-05 (rang et total dérivés, jamais persistés ; sans groupe ou singleton : aucun faux « Niveau 1 », état vide), MFN-07, MFN-08 (variante sans question d'identité), MFN/AC16 (aucun choix silencieux des paramètres) ; relevé `DSF-MOUVEMENT-FILIATION-NIVEAUX-2026-10-23.md` ; rang annoncé en texte ; total dans le choix ; aucune limite à trois niveaux ; primitive native sur iOS, sans réimplémentation ; textes au lexique (« Changer de niveau », « Ajouter un niveau », « Niveau », « Niveau X ») ; « geste », jamais « mouvement » ; cibles ≥ 44 ; services A1.3 seuls pour écrire ; rien d'écrit avant `Terminer` ; trois contrôles verts ; tests existants non affaiblis.

**Never:** écran de consultation et réordonnancement des niveaux (A3.2) ; Catalogue regroupé (A4.1) ; quatrième action glissée au Catalogue (D-196) ; rang dans l'historique ; migration, schéma, `tokens.ts`, `package.json`, `app.json`, `.github/`, `main` ; rattachement automatique.

**Décisions conservatrices (Hermann absent, à valider — détail en Implementation Notes) :** popover sur un Exercice existant du Catalogue seulement (Séance : aucune pastille) ; création sans geste : aucune pastille (export `8328:35698`) ; création sur geste repris : pastille affichée sans menu ; la variante des suggestions A2.3 et la nouvelle identité A2.2 restent sans rattachement ; « Changer de niveau » et « Ajouter un niveau » remplacent l'écran (garde d'abandon existante) ; « Ajouter un niveau » reprend description, médias, Zones, Catégorie et paramètres de l'Exercice d'origine, nom vide ; jauge : min(rang, 3) tranches pleines, vide : trois tranches à 28 %.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Rang | Exercice d'un geste rang 2 sur 3 | pastille « Niveau 2 », 2 tranches pleines | lecture en échec → pastille vide sans menu (journal) |
| Sans groupe / singleton | geste sans groupe, ou groupe à un membre | pastille vide « Niveau » ; « Changer de niveau » indisponible | N/A |
| Changer, 1 Exercice | niveau 3 choisi, un Exercice | ouverture de cet Exercice (remplacement) | brouillon modifié → confirmation d'abandon existante |
| Changer, plusieurs | niveau choisi, 2 Exercices | choix explicite par résumé, ouverture de l'Exercice choisi | aucun choix par défaut |
| Niveau sans Exercice | geste local du groupe | option indisponible | N/A |
| Ajouter un niveau | Exercice rang 1 sur 2 | création préremplie (nom vide) ; `Terminer` → nouveau geste rang 2 sur 3, l'ancien rang 2 passe 3 ; aucune question d'identité | abandon → rien d'écrit |
| Rang > 3 | rang 5 sur 6 | « Niveau 5 », 3 tranches pleines | N/A |

</frozen-after-approval>

## Code Map

- `src/features/activities/ActivityDefinitionService.ts` -- ajouter `getMovementLevels(movementId)` → `{ position, levels: [{ movement, rank, definitions }] }` (`listGroup`, `repository.listAll()`, `movementLevelPosition`) ; `null` sans `MovementRepository` ou geste inconnu.
- `src/domain/activities/movementSuggestion.ts` -- `movementLevelPosition` réutilisé tel quel.
- Nouveau `src/features/activities/MovementLevelMenu.tsx` -- pastille (`LevelGauge` : jauge 18, tranches 10 × 4 rayon 1, `primary` / `primary` 28 %) ; iOS `Host`/`Menu`/`Button` d'`@expo/ui` (sous-menus imbriqués, `disabled`, `checkmark`), patron de `CircuitNatureMenu.tsx` ; Android/web : déclencheur `Pressable` et panneau `AnchoredPanel` à étapes (racine, niveaux, Exercices).
- `src/features/activities/ActivityEditorForm.tsx` -- prop `level` ; rangée à trois accès : écart 12, Zones élastiques tronquées, Niveau à droite (Figma `9029:18363`), cibles 44 sans recouvrir le Nom ; hôte du panneau de repli.
- `src/features/sessions/ExerciseScreen.tsx` -- lecture des niveaux après chargement (définition ou geste repris) ; choix → `router.replace` vers l'Exercice ; ajout → `router.replace` `catalogueDefinitionId=new&levelOriginDefinitionId=<id>` ; nouveau contexte de création « niveau » (préremplissage, `VARIANT` + `joinOriginGroup: true`, sans suggestion ni recherche).
- `src/shared/i18n/resources/fr.ts` -- libellés `levelMenu`.
- Ne pas toucher : `CircuitNatureMenu.tsx`, `AnchoredPanel.tsx`, repositories, `IdentityDecisionSheet`, `useMovementOriginChoice`.

## Tasks & Acceptance

**Execution:**
- [x] `ActivityDefinitionService.ts` + tests (SQLite réelle) -- `getMovementLevels`.
- [x] `fr.ts`, `MovementLevelMenu.tsx` + tests de rendu (iOS natif, Android panneau, jauge, libellés accessibles).
- [x] `ActivityEditorForm.tsx` -- rangée à trois accès.
- [x] `ExerciseScreen.tsx` + tests d'intégration (matrice).
- [x] READMEs `src/features/activities/`, `src/features/sessions/`, `deferred-work.md`, `sprint-status.yaml`.

**Acceptance Criteria:**
- Given un Exercice du Catalogue rang 1 d'un groupe de 2, when « Ajouter un niveau » puis nom saisi et `Terminer`, then un nouveau geste et son Exercice existent, au rang 2 sur 3, l'origine et ses Exercices intacts.
- Given l'application, when les trois contrôles s'exécutent, then ils sont verts.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

## Implementation Notes

- Implémentation conduite directement par l'agent de la story (comme A1.3 à A2.3). Checkpoints pré-approuvés par Hermann (absent) ; spec conservée entière.
- **Figma (lecture seule, session MCP) :** `get_design_context` de `9577:19843` (popover), `9925:41506` / `9925:41515` (sélecteur rôle Niveau), `9932:44044` (`icon/niveau`), `9029:18363` (rangée à trois accès : écart 12, marges 6, Zones `flex 1`, Niveau à droite). La jauge est faite de trois rectangles (aucun actif SVG) : transcrite en vues, proportions du composant. L'en-tête « 2 sur 3 » et la jauge à tranches noires des instances du popover sont d'anciens exemples (relevé l.68, l.70) : la pastille suit le maître `icon/niveau`.
- **Primitive native :** iOS, `Menu` SwiftUI d'`@expo/ui` (procédé de `CircuitNatureMenu`, sans le modifier) avec sous-menus imbriqués (`Menu` dans `Menu`, documenté par `MenuProps.children`) et `disabled` ; la pastille est le libellé hébergé (`RNHostView`), cible 44 portée par la vue hébergée (débords de la rangée). Android / web : `AnchoredPanel` à étapes hébergé par une vue couvrant l'Éditeur ; position mesurée (`measureInWindow`).
- **Reports A2.2 / A2.3 « rattachement au groupe » examinés :** MFN-06 (ch10 l.391) « Créer une variante / un niveau : … proposer le rattachement au groupe d'origine » et CE-T03-04 §14 « propose le groupe sans présélection » demandent une PROPOSITION, sans libellé ni frame ; MFN-05 l.370 « L’appartenance est toujours choisie par l’utilisateur ». Seul « Ajouter un niveau » du popover est un rattachement explicite (MFN-07 l.400-404 : « le niveau s'insère immédiatement après le niveau d'origine ») : branché (`joinOriginGroup: true`). La variante des suggestions et la nouvelle identité restent sans rattachement (option conservatrice) ; reports maintenus.
- **Points renvoyés à Hermann (option conservatrice appliquée) :**
  1. Variante (A2.3) et nouvelle identité (A2.2) : rattachement proposé sans présélection (feuille Oui / Non, texte à fournir) ou choix « Variante de ce geste » valant rattachement (sous-titre Figma « Crée un niveau de plus dans la progression ») — non branché.
  2. Portée du popover : Exercice existant du Catalogue seulement. Création sur geste repris : pastille (rang) sans popover ; création sans geste : aucune pastille (export `8328:35698` sans pastille, relevé l.65) ; occurrence de Séance : aucune pastille (MFN-09, aucun parcours documenté depuis une Séance). Alternative : pastille en lecture seule dans la Séance (geste `sourceMovementId`).
  3. « Changer de niveau » et « Ajouter un niveau » REMPLACENT l'écran de la fiche (garde d'abandon existante si le brouillon est modifié) ; après « Ajouter un niveau », `Terminer` ou l'abandon ramène au Catalogue. Alternative : empiler l'écran et relire les niveaux au retour.
  4. « Ajouter un niveau » : nom vide (MFN-07 n'énumère que description, médias, Zones ; Catégorie par MFN-05 l.376) ; paramètres repris de l'Exercice d'origine (« éventuellement repris de l'original », MFN-07 l.400), Compte à rebours et Fin compris, ligne de base AD-13. Alternatives : nom prérempli ; paramètres vides.
  5. « Changer de niveau » indisponible sans groupe (moins de deux niveaux) ; un niveau sans Exercice au Catalogue (geste local du groupe) est indisponible ; l'Exercice ouvert est coché et sans effet. Alternative : masquer ces options.
  6. Jauge au-delà du rang 3 (« représentation à compléter dans Figma », relevé l.31, l.79) : trois tranches pleines, rang en texte ; pastille vide : trois tranches à 28 % (aucun faux « Niveau 1 »). À compléter dans Figma.
  7. Nom accessible de la pastille vide « Niveau — non renseigné » (modèle de `category.unsetAccessibilityLabel`) ; libellé d'un niveau « Niveau r sur t · nom » (total dans le choix, séparateur de la recherche A2.3) ; texte nouveau à valider.
- **Rangée à trois accès :** appliquée seulement quand la pastille est présente (Exercice du Catalogue, geste repris) : écart 12 au lieu de 20, Zones élastiques et tronquées, sans retour à la ligne ; la rangée Catégorie / Zones des autres contextes est inchangée (tests existants intacts). Texte agrandi : la Catégorie et le Niveau ne rétrécissent pas, les Zones se tronquent ; à vérifier en recette JA (360 / 402 / 440).

## Spec Change Log

## Review Triage Log

Passe 1 (24/10/2026) : trois relectures (aveugle, cas limites, lacunes de vérification), sous-agents indépendants.

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | verification-gap + blind | Chemin Android du popover (mesure, position du panneau, choix → `router.replace`) jamais exécuté ; test Android du déclencheur sans assertion d'ouverture | medium | Gap pré-vérifié ; patch (test d'intégration Android : `measureInWindow` simulé, panneau à `top` 130 / `right` 20, niveau 1 ouvert, panneau fermé ; test du déclencheur : `onOpenPanel` reçoit la mesure) |
| 2 | blind | Rangée à deux accès puis trois après la lecture asynchrone des niveaux (Zones qui se redimensionnent, pastille qui apparaît) | medium | Vérifié (`levels` nul au premier rendu prêt) ; patch (formulaire affiché une fois les niveaux lus, `levelsPending`) |
| 3 | edge | Popover utilisable pendant une écriture en vol → remplacement d'écran au milieu de l'enregistrement | low | Vérifié (pastille active pendant `isSaving`) ; patch (aucune navigation pendant `isSaving`) |
| 4 | edge | `deferred-work.md` non mis à jour alors que la tâche est cochée | low | Vérifié ; patch (reports A2.2 / A2.3 examinés, garde d'abandon non testée, panneau de repli) |
| 5 | blind | JSDoc de `getMovementLevels` posée sur le getter `supportsMovementLevels` | low | Vérifié ; patch (bloc déplacé) |
| 6 | blind | Android : `Pressable` ancre sans `collapsable={false}`, mesure potentiellement indisponible | low | Correction directe ; patch |
| 7 | blind | Type du menu dupliqué dans `editorLevelOf` ; import d'`AnchoredPanelPlacement` hors de son groupe | low | Correction directe ; patch (`Omit<MovementLevelMenuModel, "levels">`, import regroupé) |
| 8 | blind | Assertions `JSON.stringify(modifiers).toContain("true")` fragiles | low | Vérifié ; patch (comparaison au modificateur `disabled(true / false)` exact) |
| 9 | verification-gap | Marges négatives de la cible iOS, cibles de la Catégorie avec pastille, géométrie inchangée sans pastille : non assertées | low | Gap pré-vérifié ; patch (tests) |
| 10 | verification-gap | Médias et Zones de « Ajouter un niveau », Compte à rebours repris, origine introuvable : non testés | medium | Gap pré-vérifié ; patch (tests : photo `p1` et Zone reprises, origine intacte, Compte à rebours de l'original ; écran d'erreur sans écriture) |
| 11 | verification-gap | Reprise d'un geste sans groupe : absence de pastille non testée | low | Gap pré-vérifié ; patch (test) |
| 12 | verification-gap + blind + edge | Garde d'abandon sur `router.replace` (brouillon modifié) non démontrée, garde simulée | medium | Gap pré-vérifié, disposition defer (`usePreventRemove` non exerçable sans pile native) ; defer (`deferred-work.md`, recette JA) |
| 13 | blind | Panneau de repli sans retour d'étape, sans recadrage aux bords | low | Repli `NON VÉRIFIABLE`, fermer et rouvrir suffit ; defer (`deferred-work.md`) |
| 14 | blind | Lecture en échec : « Ajouter un niveau » retiré et pastille annoncée « non renseigné » | false | Comportement de la matrice figée (« lecture en échec → pastille vide sans menu ») |
| 15 | blind | Nom accessible « Niveau — non renseigné » trompeur pour un geste sans groupe | low | Libellé soumis à Hermann (point 7) ; rejeté |
| 16 | blind | `getMovementLevels` lit tout le Catalogue à chaque ouverture | low | Base locale de quelques dizaines d'Exercices ; requête dédiée = nouvelle méthode de repository ; rejeté (même arbitrage qu'A2.3 #15) |
| 17 | blind | Médias de l'original partagés par référence avec le nouveau niveau | low | Même partage que la variante A2.3 (#14) ; suppression limitée aux copies préparées par le brouillon ; rejeté |
| 18 | blind | `router.replace` : retour au Catalogue après « Ajouter un niveau », abandon demandé si brouillon modifié | low | Choix documenté (point 3 renvoyé à Hermann) ; rejeté |
| 19 | blind | Écran de création d'un niveau sans pastille | low | Rang non encore existant (rien n'est écrit avant `Terminer`, MFN-05 rang dérivé) ; rejeté, noté pour Hermann (point 2) |
| 20 | blind | iOS : ouverture du menu natif sans suppression de la fin de saisie du nom | false | Le popover n'existe que sur un Exercice existant, où `onNameEndEditing` ne propose rien (suggestion réservée à la création, A2.3) |
| 21 | blind + edge | Android : drapeau de fin de saisie posé avant `if (!host) return` | false | L'hôte est rendu sous la même condition que le déclencheur (`levelMenu && Platform.OS !== "ios"`) ; et sans effet hors création |
| 22 | blind | Niveau à un seul Exercice, l'Exercice ouvert : panneau fermé sans action | false | Comportement voulu, identique au menu natif (Exercice ouvert coché, sans effet) |
| 23 | blind | `total ?? 0` mort ; risque « sur 0 » | false | `levels` est vide quand `position` est nulle (contrat du service, testé) |
| 24 | blind | Sémantique de `selected` sur un niveau (contient l'Exercice ouvert) | low | Même coche que le sous-menu natif ; rejeté |
| 25 | blind | Hôte natif non remonté si le contenu du menu change | false | Les enfants SwiftUI se mettent à jour sans remontage ; seule la taille du libellé l'exige (procédé story 7.9) |
| 26 | blind | Accessibilité iOS : pas d'indication de menu ni de total sur la pastille | low | Le rôle est porté par le `Menu` natif ; le total figure dans le choix (relevé l.31) ; rejeté |
| 27 | edge | Deux Exercices d'un niveau aux résumés identiques, indiscernables | false | MFN-10 (ch10) : « Deux duplicatas … peuvent rester visuellement indiscernables … ce comportement est accepté » |
| 28 | edge | Panneau ouvert quand `levelMenu` devient nul ; étape Exercices vide ; ancre nulle | false | Niveaux lus une fois par geste, jamais retirés pendant l'ouverture ; l'étape Exercices n'est atteinte que pour un niveau à plusieurs Exercices ; le `Pressable` est monté quand il est pressé |
| 29 | edge | Reprise en place : pastille périmée | false | Lecture rattachée au geste (`loadedLevels.movementId === levelMovementId`) |

Contrôles après correctifs : `npm test -- --maxWorkers=2` 168 suites, 4 281 tests verts ; `npx tsc --noEmit` vert ; `npm run lint` vert. Avant revue : 168 suites, 4 276 tests.
