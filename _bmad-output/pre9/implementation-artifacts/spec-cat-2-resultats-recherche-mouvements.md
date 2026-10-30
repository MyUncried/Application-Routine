# CAT.2 — Résultats de recherche des Mouvements : cartes Résultat et Composition

Story PRE-9, epic CAT. Sources normatives lues sans fusion au commit `af2e64a4` (branche `docs/pre9-resultats-mouvements-20261030`) : `docs/KODJO-Resultats-recherche-mouvements-PRE9-2026-10-30.md` (spécification complète), `_bmad-output/pre9/planning-artifacts/epics.md` § CAT.2, chapitre 13 contrat **CE-MVT-RESULT-01**, `git diff 2b7ba4fa af2e64a4 -- docs/` (DSF Mouvements, v7 §6, ch08, ch10, ch12, ch07). Figma `G6RY5Ebhgwb4AHIOYDwwvg` en lecture seule (MCP `get_metadata` / `get_design_context`) : `10415:21713`, `10415:21814`, `10415:21916`, `10415:21939` (Créer un Mouvement), `9882:19049`, `10175:20349`, `10131:21995` (Créer un Exercice) ; captures PNG du commit `af2e64a4`.

Branche de développement `pre9-bmad/dev`, départ `d67b463a`.

## Décision de Hermann du 30/10/2026 (classe B)

Texte exact, transmis pendant le développement :

> « CAT.2 - Utiliser ce mouvement n'est plus utile sur la carte de résultat de recherche dans la composition de séance, l'utilisateur doit simplement appuyer sur la carte pour l'utiliser. Et À partir du catalogue des mouvements, cette option n'est pas utile, seul la création d'un niveau est une action pertinente. »

Appliquée telle quelle ; elle tranche la question de la réutilisation laissée ouverte par la spécification (« la sélection existante reste attachée au parcours, pas à une nouvelle commande visuelle ») — ce n'est plus un point À CLARIFIER. Elle est consignée au registre (chapitre 07, « CAT.2 — reprise d'un Mouvement existant », ajout du coordinateur dans la même livraison).

- **Composition de Séance / création d'un Exercice** : carte Composition sans bouton ; **toucher la carte = utiliser le Mouvement existant** (effet de l'ancien « Utiliser ce mouvement » : reprise, aucun doublon, validations existantes). Toute la carte est un seul élément accessible, rôle bouton, nom = « nom, Niveau N, description », indication VoiceOver « Utiliser ce mouvement ».
- **Catalogue des Mouvements (Créer un Mouvement)** : carte Résultat avec « Ajouter un niveau » seul ; **aucune action de réutilisation** [remplace « Ouvrir ce mouvement » de la recette A/B B.10, remarque 6, qui ouvrait la fiche existante en consultation]. Le corps de la carte n'est pas activable (aucun comportement antérieur hors bouton n'existait : rien à conserver) ; il reste un élément VoiceOver de lecture (nom, niveau, description).

## Réalisé

1. **Carte « Mouvement — Résultat »** (`MovementResultCard`, `10199:22268`) — parcours Créer un Mouvement depuis le Catalogue (`/movement`), et écran de recherche explicite (sans point d'entrée, R-8) lorsqu'il offre le choix de niveau :
   - 338 × 73 nominal, contour 0,5 `#CCD1E0`, fond `surfaceSubtle`, rayon 12, ombre 0/2/5 à 8 % ;
   - photo 57 à (8, 8) rayon 12 ; nom Semi Bold 15 à (77, 11), bord droit à 74 ; « Niveau N » Medium 12, bord droit à 8, centré à y = 20 ;
   - description Regular 12/16 à (77, 33), **179 pt** (bord droit à 82), deux lignes, « … » ;
   - **« Ajouter un niveau »** : libellé Medium 13/16 bleu sur deux lignes (« Ajouter\nun niveau »), aligné à droite, **66 × 32 à x = 264, y = 33** (bas à 65 = fin de la description) ; **zone tactile 78 × 36 à (258, 31)** ; nom accessible « Ajouter un niveau, {nom} », état `expanded` ;
   - **aucun** « Utiliser », « Utiliser ce mouvement » ni « Ouvrir ce mouvement ».
2. **Carte « Mouvement — Composition »** (`MovementCompositionCard`, `10895:19870`) — tous les emplois : éditeur d'Exercice du Catalogue (`/exercise?catalogueDefinitionId=new`), éditeur d'occurrence de Séance, création depuis la Composition (`/movement?context=session`), écran de recherche explicite sans choix de niveau :
   - 338 × 73, ombre 0/2/10 à 8 %, **aucun bouton** ; description **253 pt** (bord droit à 8), **deux lignes au maximum, « … »** (`numberOfLines={2}`, `ellipsizeMode="tail"`) ; nom borné à 74 du bord, « Niveau N » à droite ;
   - toucher = utiliser (décision ci-dessus), retour visuel d'appui (opacité 0,6, valeur système, aucune valeur Figma).
3. **Panneau des résultats** (`MovementSuggestionPanel`) : contour 1 `#E3E8F0`, rayon 12, ombre 0/8/20 à 10 % ; cartes à 8 du bord ; 14 au-dessus de la première carte et sous la dernière ; **4 entre deux cartes consécutives d'une même famille, 8 sinon** (cinq résultats : 14 + 5 × 73 + 4 + 3 × 8 + 14 = **421**) ; message d'unicité Medium 12 `#D92D20` à (14, 12), 12 au-dessus des cartes. Classement, nombre de résultats (illimité, contre-recette du 30/10) et figement pendant l'appui inchangés ; aucune donnée de maquette codée en dur.
4. **Filet « groupe de niveaux »** : `x = 3`, largeur 2, rayon 1, `rgba(5, 8, 229, 0.35)` (Figma `10906:19879` / `10906:19877`), du **centre vertical de la première carte affichée** de la famille au **centre de la dernière** ; positions mesurées par `onLayout` (hauteur et ordre réellement affichés, texte agrandi compris), gabarit nominal de 73 à défaut de mesure. Famille = `levelGroup.groupId` d'une carte portant un rang (« Niveau N »). Présent dans les six listes (Mouvements proches, Nom déjà utilisé, Options d'un résultat × Créer un Mouvement / Créer un Exercice) ; absent de l'état de choix du niveau (une seule carte). Non accessible (décoratif).
5. **État « Niveau, plus facile ou plus difficile »** (`10415:21939`) : cadre de retour 338 × 36 à 14 du haut (chevron), 10 au-dessus de **la seule carte, dépliée en 338 × 104** (marges verticales 8) ; panneau 14 + 36 + 10 + 104 + 14 = **178** ; les trois lignes de la carte Résultat avec « Ajouter un niveau » à droite (toucher à nouveau : replie) ; **quatrième ligne** : « Plus facile » à x = 90,5 (largeur 64), « Plus difficile » à x = 183,5, y = 68, hauteur 28, Medium 13 bleu ; **séparateur 1,5 × 12 à (166,5 ; 74,5)**, bleu. Supprimés : « Utiliser ce mouvement », second cadre, symboles d'arborescence. Sémantique conservée : Plus facile → `BEFORE_ORIGIN` (avant l'origine), Plus difficile → `AFTER_ORIGIN` ; le choix ouvre le formulaire du nouveau Niveau (nom repris + invite « (compléter le nom) », Catégorie et Zones reprises) ; rien n'est créé avant Terminer (`createVariant` à l'enregistrement seulement) ; fin de saisie et clavier : comportements cr-8 inchangés (l'étape survit à la fin de saisie, une vraie modification du nom revient à la liste, Retour revient à la liste).
6. **Branchement** (`useMovementOriginChoice`, option `cardVariant`) : `MovementScreen` Catalogue → `"result"` (pas d'`onSameMovement`) ; `MovementScreen` `context=session` → `"composition"` (toucher → `handMovementsToComposition`, retour) ; `ExerciseScreen` (Catalogue et occurrence de Séance) → `"composition"` (toucher → reprise existante : contenu verrouillé + crayon, filiation `sourceMovementId`). La carte Résultat n'est rendue que si « Ajouter un niveau » est disponible.

Coordonnées : celles du composant (bord extérieur) ; dans le code, décalages depuis le bord intérieur du contour (0,5 pour la carte, 1 pour le panneau). Positions horizontales du bouton et du niveau exprimées depuis le bord **droit** (largeurs d'écran autres que 402) ; la quatrième ligne garde les abscisses de la maquette. Constantes locales : `tokens.ts` inchangé. Texte ajouté : `editor.movementSuggestion.addLevelTwoLines`.

## Conséquence notée (spécification, non une interprétation)

La carte Composition « n'en comporte jamais » (« Ajouter un niveau ») : le panneau de l'**éditeur d'Exercice** ne propose donc plus « Créer une variante » [remplace R-5 C02 pour ce panneau]. Restent disponibles : le menu Niveau de l'éditeur (« Ajouter un niveau » → Plus facile / Plus difficile, `levelOriginDefinitionId` + `levelPlacement`) et la fiche Mouvement. Dans l'éditeur d'occurrence de Séance, la variante LOCALE n'avait que ce panneau pour accès : elle n'est plus atteignable, ce qui rejoint CE-MVT-01 §3 (« La création de variante depuis une séance reste exclue ») ; l'état `variantOrigin` reste lu à l'enregistrement (toujours `null`), le code de sauvegarde n'est pas modifié.

## À CLARIFIER (classe C — choix provisoires en place)

1. **Membres d'une famille non consécutifs dans le classement.** La spécification interdit de modifier « identifiants de famille, rangs, clés de tri ou règles de recherche » et demande que le filet « suive l'ordre réellement affiché ». Choix retenu : un filet par **suite consécutive** d'au moins deux cartes de la même famille ; deux membres séparés par un autre résultat n'ont pas de filet commun (un filet traversant une carte étrangère, ou deux filets superposés à x = 3, serait trompeur). Alternative : regrouper les familles dans le classement (changement de règle de tri, non autorisé ici). Changement localisé dans `familyRuns`.
2. **Écart de 4 entre cartes d'une même famille** : lu sur Figma (`10415:21733`, `10175:20369`), non écrit dans la spécification (qui donne 421 pour cinq cartes, cohérent avec 4 + 3 × 8).
3. **Message « nom déjà utilisé »** : aligné sur Figma (Medium 12, à 12 du haut) au lieu de Regular 13 ; texte et règles inchangés.

## Écarts à Figma

- Carte Composition : Figma `10175:20349` / `10131:21995` montre la description sur une ligne (`whitespace-nowrap`) ; la spécification (deux lignes, « … ») l'emporte.
- Séparateur « | » rendu comme un trait 1,5 × 12 (spécification) et non comme un glyphe texte (Figma : texte Medium 12).
- « Plus difficile » : largeur non spécifiée (Figma 76) → largeur du texte.
- Le panneau prend la largeur de l'hôte (`ActivityEditorForm`), comme avant ; les cartes s'y étirent (338 à 402 pt).

## Fichiers

- `src/features/activities/MovementResultCard.tsx` — deux composants (Résultat, Composition), géométrie CAT.2, quatrième ligne.
- `src/features/activities/MovementSuggestionPanel.tsx` — variante de carte, espacements, filet de famille (`familyRuns`), état de choix du niveau.
- `src/features/activities/useMovementOriginChoice.tsx` — option `cardVariant` ; `onSameMovement` facultatif.
- `src/features/activities/MovementSearchScreen.tsx` — cartes selon l'appelant ; « Utiliser » retiré.
- `src/features/activities/MovementScreen.tsx` — Catalogue sans réutilisation ; Séance en carte Composition.
- `src/features/sessions/ExerciseScreen.tsx` — cartes Composition ; branchement de variante du panneau retiré (`withVariantContent` supprimé).
- `src/shared/i18n/resources/fr.ts` — `addLevelTwoLines`.
- Tests : `src/features/activities/__tests__/MovementSuggestionPanel.r5.test.tsx` (réécrit), `MovementSearchScreen.r8.test.tsx`, `MovementScreen.b2.integration.test.tsx`, `src/features/sessions/__tests__/CompositionMovementFlow.integration.test.tsx`, `ExerciseScreen.r5`, `ExerciseScreen.r6`, `ExerciseScreen.r8` (`.integration.test.tsx`).

## Tests

Ciblés (`npx jest --maxWorkers=1`) : `MovementSuggestionPanel.r5` 13/13, `MovementSearchScreen.r8` + `MovementScreen.b2` (37 + 4), `CompositionMovementFlow` 4/4, `ExerciseScreen.r5` 16/16, `ExerciseScreen.r6` + `r9` 17/17, `ExerciseScreen.r8` 6/6, `ExerciseScreen.r10` + `mfn.a31` + `ExerciseEditingPaths` 60/60. `npx tsc --noEmit -p .` et `npx eslint` des fichiers modifiés : propres. Suite complète non lancée (machine contrainte ; à lancer par Hermann).

Retirés avec le comportement (remplacés par des assertions d'absence) : variante par le panneau de l'éditeur d'Exercice (R-5 C02 ×2, Séance ×1 ; cr-8 ×5 dans r8) ; l'étape de variante et la fin de saisie (cr-8) sont désormais vérifiées sur la fiche Mouvement (`MovementScreen.b2`, CAT.2). Le test « DuplicateMovementNameError » passe par la route « Ajouter un niveau » de l'éditeur d'Exercice.

## Synchronisation documentaire

Classe **B** (évolution validée : spécification CAT.2 + décision du 30/10/2026). Documents : spécification et CE-MVT-RESULT-01 sur la branche documentaire `af2e64a4` (non fusionnée, non modifiée ici) ; registre chapitre 07 (entrée de la décision, ajoutée par le coordinateur). Formulation à préciser lors de la fusion documentaire, **non modifiée ici** : ch13 CE-MVT-01 §4 sur `af2e64a4` (« La réutilisation d'un Mouvement existant conserve son comportement sans création de doublon ») — depuis le Catalogue des Mouvements, la décision du 30/10/2026 retire toute réutilisation ; elle reste par toucher de la carte Composition depuis la Séance. Historique technique non mis à jour : `src/features/activities/README.md` (entrée PRE-7 de `MovementResultCard`).
