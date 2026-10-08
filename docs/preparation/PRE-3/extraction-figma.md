# PRE-3 — Extraction détaillée Figma

Date : 08/10/2026. Sources : fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page `Prototype MVP` (`510:101`), inventaire fermé de [41 références](perimetre-et-couverture.md). Baseline documentaire `main@17d9774a31429bc2bee4eb834e4ed1e9aafa68ec` ; préparation `#333@63121772773e79df0ace142c5d650b794506a81f`.

## Résultat

L’extraction des propriétés des 41 écrans est terminée : **6725 éléments**, dont 6660 avec visibilité héritée et 65 masqués selon l’arbre, 1719 textes et 881 instances. Chaque élément possède une ligne identifiable dans l’[index](figma/index-elements.jsonl), un pointeur vers ses propriétés exactes et une source Figma. Les 41 captures PNG 402 × 874 sont conservées. Aucune écriture du document Figma ni modification applicative n’a été réalisée.

[Paquet et table des 41 écrans](figma/README.md) · [Manifeste et empreintes](figma/manifest.json) · [Contrôle de seconde lecture](figma/controle-source.json).

| Propriétés | Données relevées | Évidence |
|---|---|---|
| Identité et structure | ID, nom, type, parent, ordre des enfants, visibilité, opacité, masques | Objets `nodes[]`, index unique et contrôle des arbres |
| Géométrie | x/y locaux, largeur/hauteur, rotation, transformations relative/absolue | Nombres API conservés sans arrondi |
| Mise en page | Auto-layout, alignements, gaps, paddings, sizing, grow, contraintes, positionnement, clipping et overflow | Propriétés d’écran + complément de layout par nœud |
| Bornes et grille | min/max width/height, grilles, ordre d’empilement, bordures individuelles, contraintes de cellule disponibles | `complements-layout.json`, aucune valeur par défaut déduite |
| Typographie | Texte intégral, police/taille/poids, alignement, line-height, letter-spacing, paragraphe, casse/décoration, resize/troncature et segments de styles mixtes | Chaque nœud Text et `textSegments` |
| Apparence | Fills/strokes et liaisons, couleurs/opacités, gradients/images, rayons, effets, blend et géométrie vectorielle exposée | Valeurs originales ; IDs de styles conservés |
| Composants | Maître, clé, nom, page, ensemble, variantes/propriétés et références de remplacement | 47 maîtres, 17 ensembles, 75 racines de variantes ; topologies des maîtres |
| Tokens | Styles, variables, liaisons, collections/modes, alias et valeurs terminales | 22 styles, 134 variables, 2 collections ; aucune référence manquante |
| Prototype | Réactions exposées par l’API | Observations conservées ; aucun comportement métier déduit de ces liens |
| Référence visuelle | Export de chaque frame | 41 PNG natifs 402 × 874 |

## Composants partagés

Le recensement des 47 maîtres couvre les **11 pages** du fichier : 3345 instances, dont 881 dans les 41 arbres PRE-3 et 2464 ailleurs. [Liste des instances, surfaces et pages](figma/consommateurs.json). Les usages des pages Archives et Communautaire — Hors MVP sont explicitement distingués par leur page ; leur présence n’élargit pas PRE-3. Ce recensement Figma est une entrée du graphe d’impact ; il ne remplace pas le recensement des consommateurs dans le code.

## Seconde passe et portée de la preuve

Une seconde lecture directe des 41 arbres a recomposé leurs propriétés après extraction, y compris les segments de texte et les contraintes complémentaires. Les **41/41 empreintes concordent**, sur 6725 nœuds. Aucune erreur de lecture n’est enregistrée. Le contrôle a détecté l’option API initiale `skipInvisibleInstanceChildren=true` ; les 65 descendants omis ont été ajoutés, les topologies des maîtres et les consommateurs relus, puis les 41 arbres complets contrôlés avec cette option explicitement désactivée. Les maîtres, leurs définitions/variantes et les dépendances de styles/variables sont résolus séparément ; le catalogue contient aussi les alias terminaux requis par les variantes exposées.

Le contrôle local distinct vérifie les relations parent/enfants, l’identité de chaque ligne d’index, la couverture des compléments, la résolution des maîtres/styles/variables, l’absence de cycles d’alias et les signatures/dimensions PNG. SHA-256 identifie chaque fichier de preuve. Les captures sont des références exportées ; ce lot ne certifie ni les pixels d’une application, ni son comportement sur appareil.

La version amont Figma n’est pas exposée par cette extraction : aucun numéro de version n’est inventé. L’instantané de données et de captures est figé par les fichiers et leurs empreintes dans cette PR. Les propriétés des descendants des instances des 41 écrans sont exhaustives pour les familles relevées ; les variantes non utilisées des ensembles ne sont pas développées en nouveaux écrans. Aucune police ni image source destinée au bundling applicatif n’est importée dans l’application.

## Suite de la préparation

L’entrée « extraction Figma » est disponible pour le futur plan technique. Restent le graphe complet des consommateurs applicatifs, la liste finale des fichiers/tests, le schéma et la migration, ainsi que les précisions du parcours d’import média déjà signalées dans le [rapprochement](rapprochement-main-figma.md). Les gestes et états métier non définis ne sont pas inventés à partir de Figma. Le plan technique n’est pas approuvé par ce relevé ; aucune implémentation, activation de tranche ou exécution d’audit VNext n’est lancée.
