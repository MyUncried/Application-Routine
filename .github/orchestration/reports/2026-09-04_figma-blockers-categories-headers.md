# Correction des blocages Figma — Catégories et en-têtes

## Périmètre

Correction des défauts Figma identifiés lors de l’audit de préparation de T01-S09, T01-S10 et T02, sans modification du code applicatif.

## Décisions validées

- aucun texte introductif dans `Catégories de la séance` ;
- un doublon normalisé sélectionne la Catégorie existante et ferme la création inline ;
- le nom d’une Catégorie personnalisée est limité à `40` caractères après trim.

## Modifications Figma

- création du composant DSF `Selection / Category Tag` (`3302:4166`) ;
- variantes `State=Unselected` (`3302:4160`) et `State=Selected` (`3302:4163`) ;
- remplacement des vingt tags manuels dans `2028:11204` et `2028:11248` par des instances ;
- remplacement des en-têtes manuels des deux écrans Catégories par l’en-tête canonique `Header / Fixed`, variante `Mode=Standard, Back=On` (`2581:2684`) ;
- suppression de l’ancienne barre d’état `2028:11809` et de l’ancien en-tête `2028:11818` de `Composition d’une séance — actions glissées` (`2028:11808`) ;
- conservation de son en-tête canonique `2583:3738`.

## Contrôles

- un seul en-tête effectivement rendu dans chacune des trois frames ;
- captures visuelles contrôlées après remplacement ;
- largeur des tags rendue responsive à chaque instance et rangées espacées sur un pas tactile de `48` sans chevauchement ;
- aucune donnée métier, action finale, carte d’activité ou sélecteur déplacé ;
- recherche documentaire des anciennes formulations contradictoires effectuée.

## Statut

`FIGMA_BLOCKERS_RESOLVED`
