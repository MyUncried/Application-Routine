# KODJO — mise à jour documentaire des écrans

Oct 14, 2026 · @Hermann

Ce document décrit l'état du fichier Figma après l'introduction des formats de séance : les écrans ajoutés, le gabarit de carte refait, les composants qui le portent, et les règles qui s'appliquent désormais. Les pages `Prototype MVP` et `Conception — Hors MVP` sont alignées à l'identique sur ces 141 cartes.

## Ce qui a changé

| Objet | Changement | Portée |
| --- | --- | --- |
| Rangée des formats | 41 écrans, onze blocs de format ou de départ rapide | Les deux pages |
| Carte de séance | Cadre carré du format, chevron après le nom, durée en troisième ligne | Composant, 100 instances par page |
| Carte d'exercice | Catégorie retirée, zone corporelle conservée avec sa pastille | Composant, 43 instances par page |
| Icônes de format | Jeu de 12 variantes `DSF / Cards / Format — cadre carré` | Nouveau composant |
| Titres d'écran | Style `KODJO / Texte / Inter Medium 17`, distinct du nom d'objet | Tous les écrans à en-tête |
| Navigation | Barre à cinq onglets avec Communauté | 47 écrans sur MVP, 52 sur Conception |
| Série Planifier | Sept écrans passés de surcouche à écran plein | Les deux pages |
| Badges de durée et d'heure | Fond et arrondi retirés partout | Tout le fichier |

L'ordre va du plus structurant au plus local : les trois premières lignes changent ce que l'application montre, les suivantes comment elle le montre.

## La rangée des formats

Une rangée unique, sur les deux pages, qui part de `Composition séance — Modèles` et déroule les onze modèles dans l'ordre : Tabata, EMOM, AMRAP, Death by, For time, Intervalles 30/30, puis Renforcement, Gainage · Mobilité, Superset, Progression, À l'échec.

Un bloc de **format** compte quatre écrans :

1. `Composition séance — Modèles — <format> (paramètres)` : la phrase du format et ses paramètres imposés.
2. `Composition séance — Modèles — <format> (récapitulatif)` : nom prérempli, étiquette, paramètres, bouton de validation.
3. `Composition séance — <format> (préremplie)` : la séance composée, valeurs verrouillées grisées.
4. `Modification activité — Paramètres (modale) — Exercice <format>` : la modale d'exercice, amputée des lignes que le format masque.

Un bloc de **départ rapide** n'en compte que trois : il n'a pas de modale d'exercice, puisqu'il ne masque ni ne verrouille aucune ligne.

Tous ces écrans portent le même titre, `Composer une séance`, sauf les modales qui portent `Modifier un exercice`. La zone de contexte reprend la couleur du format et son illustration, posée en toile de fond à droite, à 55 % d'opacité.

L'écran d'entrée `Composition séance — Modèles` présente les douze cartes en trois colonnes, deux sections, sans défilement : 742 à 774 px de contenu pour 779 disponibles. Il porte désormais la barre de navigation à cinq onglets, et ses deux blocs sont recentrés verticalement dans l'espace restant.

## Le gabarit de carte

Carte de 354 px de large, 90 à 96 px de haut selon le contexte. Cadre carré de 64 × 64 à x=12, bloc de texte à x=88 sur 250 px.

| Ligne | Carte de séance | Carte d'exercice |
| --- | --- | --- |
| Cadre carré | Format, couleur et motif du modèle | Photo, ou icône de nature en repli |
| 1 | Nom + chevron de déploiement | Nom seul |
| 2 | Étiquette | Zone corporelle, avec sa pastille de silhouette |
| 3 | Nombre d'exercices ⬛ durée | Séries ⬛ durée |
| Bouton | Démarrer, centré sur le bloc d'en-tête | Démarrer, centré sur le bloc d'en-tête |

Le symbole ⬛ marque le sablier, qui a remplacé le point médian entre les deux informations de la troisième ligne.

Quatre règles tiennent ce gabarit.

**Le cadre carré porte la nature de l'objet**, format pour une séance, catégorie pour un exercice. C'est pourquoi la catégorie textuelle a été retirée des deux cartes : elle faisait doublon avec son propre pictogramme. La ligne de texte porte, elle, l'attribut que l'utilisateur a renseigné lui-même, étiquette ou zone corporelle.

**Le chevron n'existe que sur les cartes de séance**, collé au nom et centré verticalement sur lui, dans un groupe `Nom et chevron`. Il pointe vers le bas replié, vers le haut déployé. Les exercices n'ont plus de déploiement depuis l'arrivée de l'illustration photo.

**Les séries s'écrivent sous forme multiplicative** : `3 × 1 min 30 s`, `2 × 10 rép.`, `1 × 45 s`, `3 × à l'échec`. Le `1 ×` est conservé pour une série unique.

**Le bouton d'action est calé sur le milieu du bloc d'en-tête**, du haut du nom au bas de la troisième ligne, et non sur la hauteur de la carte. Il tombe ainsi à la même hauteur que la carte soit repliée ou déployée.

Sur les cartes du calendrier, la troisième ligne porte la durée avec son sablier, puis l'heure avec son horloge, seule information en gras. Le nombre d'exercices et le nombre de séries n'y figurent pas, et la première ligne ne porte que le nom et le chevron.

## Les composants de carte

Deux jeux vivants, et eux seuls. Toutes les cartes des deux pages en sont des instances : 100 séances et 43 exercices sur MVP, 102 et 44 sur Conception.

| Jeu | Variantes | Ce que porte la variante |
| --- | --- | --- |
| `DSF / Cards / Séance` | Catalogue replié, archivé, déployé | Carré de format, chevron, durée en ligne 3 |
|  | Calendrier Semaine replié, déployé | Durée puis heure en ligne 3 |
|  | Suivi replié, déployé | Pastille de statut, ressenti, pas de carré sur le replié |
|  | Choix calendrier, choix multiple, sélectionné ou non | Radio ou case à x=312, texte borné à 279 |
|  | Calendrier Jour replié | Pastille d'événement 298 × 46, sans ligne de titre |
| `DSF / Cards / Exercice` | Mêmes contextes, sans chevron | Cadre photo, zone corporelle |
| `DSF / Cards / Format — cadre carré` | 12, une par format | Fond, motif et nom du format |

Les anciens jeux `Exercice — catalogue`, `Séance — catalogue`, `Sélection — séance` et `Sélection — exercice` ne sont plus instanciés nulle part. Ils portent encore l'ancien nommage du bloc de classement, `Zones travaillées — Défilement horizontal`, là où les jeux vivants disent `Classement — Étiquette et catégories` ou `Classement — Catégorie et zones corporelles`. Ils peuvent être archivés.

Deux règles de largeur, issues des corrections faites sur ces composants. Le bloc de texte s'arrête avant le premier contrôle visible à droite, soit 295 px, ce qui donne 207 de large à x=88 et 279 à x=16. Et le rail de texte des lignes 2 et 3 est calé à 115, quelle que soit la pastille qui le précède.

## Les icônes de format

Chaque icône est un carré de 64 × 64, rayon 6, construit à partir du motif de la carte du modèle, pas redessiné : la grammaire d'illustration validée sur l'écran des modèles est donc conservée telle quelle.

Trois règles de construction.

Le **fond** reprend la couleur de bande du format. Le **motif** occupe le carré jusqu'aux marges intérieures, cadré à 4 px, dimensionné au mieux selon qu'il est large comme Tabata ou haut comme Gainage · Mobilité, et centré sur sa forme réelle et non sur son cadre. Le **nom** se pose par dessus en bas, en ton sur ton : même teinte et même saturation que le fond, luminosité abaissée à 73 %.

Deux ajustements ont été nécessaires à cette taille : l'épaisseur des traits des arcs de Gainage · Mobilité et de For time, que la réduction ramenait à un cheveu, et le nom de Renforcement, abrégé en `Renfo.` pour tenir à 9 px comme les autres.

Les douze planches de travail sont sur la page `Cartes - Icônes` : `Icônes de format — essai`, sa version de contrôle agrandie trois fois, et `Carte de séance — essai du cadre de format`.

## Les titres d'écran

Le titre d'écran et le nom d'un objet partageaient la même police et la même taille, et se disputaient la hiérarchie. Un style distinct a été créé pour le titre d'écran : `KODJO / Texte / Inter Medium 17`, en `#3A3A3F`, porté par le composant `DSF / Navigation / En-tête fixe`.

Il a été créé plutôt que de modifier l'existant : l'ancien style `Inter Semi Bold 20` était utilisé 603 fois dans le fichier, le toucher aurait déplacé bien plus que les titres.

Le titre est posé à x=24, largeur 354, hauteur 26, centré verticalement. Le composant a trois états : `Standard`, `Retour` et `Fermer`, ce dernier portant la croix à gauche.

## La navigation

La barre à quatre onglets est remplacée par `Navigation / Bottom — 5 onglets`, qui ajoute Communauté entre Suivi et Profil. Positionnement standard : x=0, y=788, 402 × 77.

47 instances remplacées sur `Prototype MVP`, 52 sur `Conception — Hors MVP`, l'onglet actif de chaque écran conservé. L'ancienne variante `Active=Search` n'a pas d'équivalent dans le nouveau jeu, mais aucun écran ne l'utilisait.

Le nouveau jeu porte en plus une propriété `Badge`, à quatre valeurs, `Aucune`, `1-9`, `10-99`, `99+`, pour la pastille de compteur. Toutes les instances posées sont sur `Aucune`.

## La série Planifier

Sept écrans — Création, Sélecteur de date, Rappel ouvert, Rappel sélectionné, Stepper des semaines, Sans répétition, et Planifier un parcours — sont passés de surcouche à écran plein, sur les deux pages.

Ce qui a été retiré de chacun : le fond calendrier, soit la bande de sélecteur, les actions contextuelles, le contrôle segmenté, la vue jour, le dégradé et le fond blanc de navigation, le voile modal. Et à l'intérieur, le bandeau de modale et le halo du bouton Annuler.

Ce qui reste : un bloc `Contenu — Planifier une séance`, angles à zéro, surmonté de l'en-tête fixe en variante `Fermer`. Les sous-modales, sélecteur de date et rappel personnalisé, restent en surcouche par dessus, puisque ce sont elles les vraies surcouches.

La croix et le bouton Enregistrer mènent au catalogue des séances. C'est un choix de prototype : la règle de gestion est le retour au point d'entrée, calendrier ou catalogue selon d'où la planification a été lancée, et Figma ne sait pas mémoriser ce point d'entrée. Les seuls liens entrants câblés aujourd'hui viennent du catalogue.

Un écran reste orphelin : `Planifier un parcours` n'est atteint depuis aucun autre.

## Dette et points ouverts

- **Huit écrans `PROG — …`** ont leur en-tête construit hors du composant, en 16 px Semi Bold. À basculer sur `DSF / Navigation / En-tête fixe`.
- **`Composition séance — Modèles`** porte encore le titre `Nouvelle séance` sur les deux pages, là où toute la rangée dit `Composer une séance`.
- **Les styles de texte du DSF** n'ont pas de nom sémantique : `Titre d'écran`, `Titre de modale`, `Nom d'objet` rendraient le choix évident au prochain écran créé.
- **Quatre jeux de composants de carte** ne sont plus instanciés et peuvent être archivés.
- **La carte d'exercice déployée** et son écran `Catalogue des Exercices — Liste — Première carte déployée — Média` n'ont plus aucun lien entrant, le déploiement ayant été retiré des exercices.
- **Six instances d'exercice** n'ont pas de valeur de durée ; leur sablier est masqué en attendant.
- **La carte d'exécution déployée** tronque le nom en `Renforcement du ge…` : la pastille de statut occupe la première ligne à partir de 262 px. Accepté en l'état.
- **Deux cases cochées différentes** entre les deux pages dans `Modal — Planifier une séance — Sélectionner une séance`. Contenu de démonstration, pas de gabarit.

## Sources

Fichier Figma KODJO, pages `Prototype MVP`, `Conception — Hors MVP`, `Design system — Fondations` et `Cartes - Icônes`. Les chiffres d'instances et d'écarts viennent d'un relevé comparatif des 141 cartes communes aux deux pages, fait le jour de cette mise à jour.
