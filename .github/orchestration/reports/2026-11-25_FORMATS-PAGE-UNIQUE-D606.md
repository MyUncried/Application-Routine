# 2026-11-25 — Formats : page unique du format, exercice libre, écran des formats (D-606)

## Identifiant et objectif

- **Mission** : « Claude Code — Formats : séquence d'ouverture, page unique du format, exercice libre, écran des formats (25/11/2026) ».
- **Objectif** : appliquer D-568, D-569, D-570 et D-571 de la branche de documentation `docs/planification-grille-creneaux` (lue, non fusionnée ; Formats §§ 9.6 à 9.8).
- **Numérotation** : D-568 à D-570 avaient déjà été reportés en D-603 à D-605 par la mission précédente (même jour, rapport `2026-11-25_FORMATS-SEQUENCE-MODALE.md`). D-571 devient **D-606**, car D-571 est déjà pris sur main. C'est une collision technique, tranchée sans arbitrage.

## Branche et commits

- **Branche** : `feat/formats-sequence-modale-20261125` (PR #461, non fusionnée). C'est la suite directe de la mission D-603 à D-605, sur la même branche.
- **Commit de départ** : `7d68c994`.
- **Commits** : `21012581` (appui sur la carte, écran des formats), puis le commit de livraison qui contient ce rapport (voir « Commit final »).

## Périmètre demandé et périmètre traité

| Point | Demande | Traité |
|---|---|---|
| 1 | Séquence d'ouverture des 10 formats sur le choix des mouvements ; lien « Paramètres » | Déjà livré (D-603, `7d68c994`) ; non retouché |
| 2 | Composition : appui sur la carte d'un exercice issu d'un format → page unique du format ; actions et photo inchangées | Fait (`21012581`) ; un cas reste À CLARIFIER (exercice seul) |
| 3 | Charge et « De chaque côté » réglables dans la page du format | Charge : déjà présente (classe A). « De chaque côté » : aucun écran Figma, donc À CLARIFIER, rien d'inventé |
| 4 | Exercice libre en modale de type format ; valeurs par défaut ; sortie et entrée d'un format | Partiel : en-tête de type format, valeurs par défaut et sortie et entrée faits. Le tableau « Exercice \| S1 … Sn » reste À CLARIFIER (perte de fonctions) |
| 5 | Écran des formats : titre centré, sans sous-titre ; carte Libre en première position, de même taille, logo pointillé, « un mouvement, à régler » | Fait (`21012581`) |
| 6 | Recouvrement D-570 | Déjà livré (D-605, `7d68c994`) ; non retouché |
| 7 | Hors périmètre : durées, exécution, modales de composition | Respecté |
| 8 | Tests | Voir « Preuves et tests » |

## PRESERVE / CHANGE / FORBIDDEN (établi avant le code)

**PRESERVE** (démontré inchangé) :
- La feuille native iOS des formats et ses hauteurs. Fichiers `app/formats-window.tsx` et `app/format-summary*` : non touchés (diff vide).
- La séquence d'ouverture et le lien « Paramètres » (D-603) : `FormatModelScreen.tsx` non touché dans cette mission (diff vide depuis `7d68c994`).
- Les actions de la carte : déplacer, dupliquer, supprimer. Test `CompositionScreen.d606` : actions accessibles présentes.
- La photo, qui ouvre `/exercise-sheet` (test).
- La modale par contexte d'un exercice ouvert depuis la page du format (D-604) : chemin `FormatModelScreen` non modifié.
- La saisie des séries, du Mode, des phases, de la cadence, des côtés et de la récupération de la feuille `ExecutionParametersSheet` : aucune ligne de ces cadres modifiée. Le diff se limite à l'en-tête, à l'intitulé et aux styles nouveaux.
- La présentation de la feuille pour l'éditeur d'Exercice, la création de Mouvement et les formats : `freeFormat` vaut `false` par défaut.
- Les valeurs par défaut des exercices créés hors Composition (`createEmptyExecutionParameters`, Mode Durée) : inchangées.

**CHANGE** :
- `CompositionScreen.handleEditActivity` : un membre d'un Circuit issu d'un format ouvre `/format-summary` (`model`, `circuitId`).
- `FormatsWindow` : titre centré ; carte « Exercice libre » dans la grille, en premier ; section « Formats d'entraînement » retirée.
- `ExecutionParametersSheet` : nouvelle propriété `freeFormat`, qui ajoute la zone de contexte, le titre « Exercice libre », l'accroche et l'intitulé « Paramètres d'exécution ».
- Valeurs par défaut d'un exercice libre de la Composition et d'un exercice sorti d'un format : Mode Répétitions (`createFreeExerciseParameters`).

**FORBIDDEN** (respecté) :
- Aucune feuille réimplémentée ; aucune primitive native remplacée.
- Aucune modification des durées ni de l'exécution.
- Aucune ligne « De chaque côté » inventée dans la page du format.
- Aucune suppression de fonction de l'exercice libre (Pause par série, déplacement et suppression d'une série) sans accord.
- Aucun merge, rebase ni force-push.

## Constats

1. **Exercice issu d'un format.** Seuls les Circuits portent le modèle d'origine (`originModel`). Un format d'un seul mouvement est posé comme exercice seul, sans trace rouvrable (sauf `format` pour EMOM, AMRAP, Death by et For time). La réouverture de la page (`applyModelReedit`) ne travaille que sur un Circuit. Pour l'exercice seul, rouvrir la page demanderait un nouveau mécanisme de réédition : **À CLARIFIER**. Il garde la modale par contexte (D-604).
2. **Charge dans la page du format.** Elle existe déjà : ligne « Charge » pour un seul mouvement (Tabata, 30/30, Renforcement, À l'échec, Death by), et « (+ kg) » dans les tableaux à plusieurs mouvements. C'est une conformité (classe A).
3. **« De chaque côté » dans la page du format.** Une recherche Figma (texte exact, 326 écrans du Prototype MVP) le trouve dans les modales d'exercice et dans la modale libre `13242:26255`, mais **dans aucune page de format**. Rien n'est inventé. Il reste réglable dans la modale du mouvement ouverte depuis la page du format (D-604) : **À CLARIFIER**.
4. **Exercice libre, maquette `13242:26255`.** Elle remplace la ligne « Charge Avec / Sans » et le tableau des séries variables (Pause par série, poignées de déplacement, ✕ de suppression) par « Nombre de séries », une Pause commune et un tableau « Exercice | S1 … Sn » avec « (rép., + kg) ». L'appliquer retirerait trois fonctions de l'exercice libre ; c'est une décision produit, **À CLARIFIER** (seule cette opération est bloquée). Appliqués sans ambiguïté :
   - le titre « Exercice libre » ;
   - la zone de contexte #FBF3E4 et sa part fondue ;
   - l'accroche en Mali Medium Italic ;
   - l'intitulé « Paramètres d'exécution » ;
   - Mode Répétitions par défaut et objectif « À l'objectif » (Cible à renseigner) ;
   - « De chaque côté » en ligne, déjà en place.

## Preuves et tests

- `npx tsc --noEmit -p .` : **PASS**.
- `npx eslint` sur les fichiers modifiés : aucune nouvelle erreur. `CompositionScreen.tsx` porte 12 erreurs `react-hooks/refs` et 2 avertissements, sur des lignes non modifiées ; le même décompte a été mesuré sur sa version du commit de départ `7d68c994`.
- `CompositionScreen.d606.test.tsx` : **6 / 6 PASS**. Le fichier vérifie :
  - carte d'un membre de format → `/format-summary`, sans modale ;
  - photo → fiche ; actions intactes ;
  - exercice libre → modale « Exercice libre » (zone de contexte, accroche, intitulé, tous les champs) ;
  - membre d'un Circuit fait à la main → même modale libre ;
  - `formatOriginOf` ;
  - valeurs par défaut Répétitions / « À l'objectif », à la création et à la sortie d'un format.
- `FormatsWindow.c2.test.tsx` : **3 / 3 PASS** (titre centré, aucun sous-titre, carte Libre en premier et de même largeur, logo pointillé, sous-titre).
- Séquence et lien « Paramètres » (10 formats), recouvrement, sortie puis retour d'un exercice : couverts par les suites de la mission D-603 à D-605 (`FormatModelScreen.d603`, `formatsWindowRoute`, `carrierMembership.c4`).
- Suites voisines (Composition, formats, feuille, appartenance) : résultat consigné ci-dessous.

`npx jest -w 1 "Composition|FormatModel|ExecutionParameters|carrierMembership|movementExercises|formatSheet|FormatsWindow|formatsWindow|useMovementExercise|layoutOperations|MovementFlow"` : 82 suites, 1964 tests.
- Premier passage : **2 échecs attendus** dans `carrierMembership.c4.test.ts`. Ces tests attendaient le Mode Durée d'un exercice sorti d'un format, que D-606 remplace par Répétitions. Les assertions sont mises à jour avec une annotation ; la suite repasse **27 / 27 PASS**.
- Les 81 autres suites : **PASS** (33 tests ignorés, déjà ignorés avant la mission).

## Hypothèses non démontrées

- Rendu de la zone de contexte et de l'accroche dans la feuille (hauteur, part fondue) : non démontré sous Jest.
- Centrage du titre de la fenêtre des formats, à côté de la croix : non démontré sous Jest.

## Éléments non corrigés ou hors périmètre (À CLARIFIER)

1. Exercice seul issu d'un format (un seul mouvement) : pas de page à rouvrir ; il garde la modale par contexte.
2. « De chaque côté » dans la page du format : aucun écran Figma.
3. Tableau « Exercice | S1 … Sn » de l'exercice libre : retrait de la Pause par série, du déplacement et de la suppression d'une série, à faire accepter par Hermann.
4. Hérités de la mission D-603 à D-605, toujours ouverts :
   - ligne Mode des départs rapides à unité libre (désormais seulement dans la modale du mouvement ouverte depuis la page du format) ;
   - buy-in et buy-out en Nombre de répétitions.

## Vérifications sur iPhone

1. Composition : toucher la carte d'un exercice de Tabata (ou d'un autre format à plusieurs mouvements) ouvre la page du format sur ses paramètres. Photo → fiche. Glisser, dupliquer et supprimer fonctionnent.
2. Toucher un exercice libre : modale « Exercice libre » avec la zone de contexte beige, l'accroche et l'intitulé ; tous les champs présents.
3. Nouvel exercice ajouté depuis le catalogue : Mode Répétitions, « À l'objectif ».
4. « Créer un exercice » : titre centré, aucun sous-titre ; carte Exercice libre en haut à gauche, de la taille des autres, cadre pointillé.

## Fichiers modifiés

- **Code** :
  - `src/features/sessions/CompositionScreen.tsx`
  - `src/features/sessions/FormatsWindow.tsx`
  - `src/features/sessions/formatSheetContext.ts`
  - `src/features/sessions/useMovementExerciseIntake.tsx`
  - `src/features/sessions/movementExercises.ts`
  - `src/features/activities/ExecutionParametersSheet.tsx`
  - `src/domain/activities/ExecutionParameters.ts`
  - `src/domain/sessions/carrierMembership.ts`
  - i18n : `fr.ts`, `enScreensActivities.ts`, `frExecutionParameters.ts`, `enExecutionParameters.ts`
- **Tests** : `CompositionScreen.d606.test.tsx` (nouveau), `FormatsWindow.c2.test.tsx`, `carrierMembership.c4.test.ts` (Mode par défaut).
- **Documentation (classe B)** :
  - registre ch07 : D-606 ajoutée, D-604 annotée ;
  - `KODJO-Formats-entrainement-2026-11-02.md` : § 9.8 ajouté, § 9.7 annoté ;
  - `PRODUCT.md` ;
  - ch08, ch10 et ch13 : annotations datées.

## Synchronisation code / documentation

Classe **B** : décision explicite de Hermann, D-571 de la branche de documentation, reportée en D-606. La Charge dans la page du format relève de la classe **A**. Les écarts sont signalés À CLARIFIER dans le § 9.8 et au registre.

## Commit final et état Git

- **Commits** :
  - `21012581` : appui sur la carte, écran des formats ;
  - le commit de livraison qui contient ce rapport : exercice libre, valeurs par défaut, documentation. Son hash figure dans le compte rendu de livraison et dans `git log`.
- **Branche** : `feat/formats-sequence-modale-20261125`, poussée sur origin (PR #461, non fusionnée).
- **Arbre de travail** : propre après ce commit.
- **Recette** : fusion dans `recette/agenda-axe-20261124`.
