# DSF — Séries variables et Ordre des côtés — 02/10/2026

Complément des shells et composants existants ; aucun nouveau design. Sources : métadonnées et captures des copies Figma du02/10, fichierG6RY5Ebhgwb4AHIOYDwwvg. Figma fixe le layout ; [v12](Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md) et CE-UI-10 fixent les comportements et calculs. Les composants maîtres ne sont pas modifiés par cette livraison documentaire.

## Fondations conservées et implantation

| Élément | Prescription |
|---|---|
| Feuille | Blanche, ancrée au bas, coins supérieurs24 px, rognage aux coins, ombre légère vers le haut ; hauteur selon contenu |
| Voile | Noir28 %, plein écran ; arrière-plan inerte et inaccessible au focus |
| En-tête | Composant DSF En-tête de modale ; ✕ à gauche, titre Paramètres d’exécution, ✓ à droite ; labels accessibles Annuler/Valider les paramètres |
| Carte empilée | Fond#FCFCFE, contour blanc, lignes42 px à texte standard, séparateurs#DEDEE5 ; libellé14 px à gauche, valeur/contrôle à droite |
| Ligne sélectionnée | Roulette ou segmenté uniquement : bord2 px#0508E5, fond#F4F4FF, rayon12 px ; contour limité à la ligne ; contrôle déployé dessous hors contour |
| Stepper commun | Largeur137 px à402, fond blanc, boutons#F2F2FF, glyphes/valeur bleus, valeur centrée ; aucun cadre sélectionné ; bord droit du + àx370 dans les copies du02/10 (x366 dans la référence du01/10) sur402, donc marge32 px pour le contrôle, avec marge36 px de la ligne de valeur ; boutons alignés entre lignes |
| Valeur modifiable | Composant Valeur modifiable du DSF, sans chevron ; la sélection est portée par la ligne |
| Valeur lecture seule | Texte#141414,14 px, sans pastille/chevron/rôle bouton ; Durée totale ≥ en Répétitions |
| Segmenté en feuille | Trois largeurs égales ; non sélectionné#FCFCFE, contour blanc ; Changement de côté13 px, centré sur deux lignes |
| Libellé long | Pause entre les côtés sur deux lignes ; largeur180 px à402 pour éviter le stepper |
| Roulette | DSF Forms/Roulette, minutes/secondes, sous sa ligne ; pas de seconde modale ni validation indépendante |
| Message temporaire | Sous la ligne concernée à4 px ; état6603:11493 : croissance vers le haut de62 px à402, lignes du bas inchangées |


## Tableau variable et Ordre des côtés

Dimensions de référence à402px ; coordonnées locales au contenu de la feuille, pas à la page Figma.

| Élément | Implantation / adaptation | Preuve |
|---|---|---|
| Groupe Séries variables | x24, largeur354 ; fond et contour rattachent l’interrupteur au tableau | 6623:13296 |
| Ligne de commande | x36, largeur334, hauteur42 ; sous Séries ; libellé/chevron à gauche et interrupteur à droite | 6623:13296 |
| Ligne variable | Numéro aligné à droite sans symbole, poignée puis cible et Pause ; deux steppers128px | 6623:13296/18007 |
| À l’échec | Libellé fixe remplace cible ; seul le stepper Pause subsiste | 6623:13976 |
| Ordre des côtés | Ligne après Changement de côté ; sélection sous la ligne, x36,330×60 ; deux options sur deux lignes, titre et flèches centrés | 6623:15446/15749 |
| Total | Ligne du corps ; sans rôle bouton en variable ; demeure dans le flux lorsque tableau replié | 6623:17745 |
| Douze lignes | Défilement du corps entier, en-tête fixe ; ne pas introduire un second scroll dans le tableau | 6623:14314/14880 |
| N=1 | Interrupteur désactivé grisé, ordre effectif par défaut grisé ; aucun texte explicatif | 6623:16770, complété par arbitrage D-250 |
| Invalide | ✓ grisé, cellule signalée, message en ligne nommant la Série ; total— | 6623:17404 |
| Résumé parent | Trois premières valeurs et ellipse ; ordre des côtés dans le texte | 6611:12781/12930/13073/13215 |
| Ligne de Séance | N séries variables, sans liste des valeurs | 6637:13132 |
| Exécution | Série n/N et côté distinct ; aucune barre par Série ; barre Tour réservée à la Séance | 6612:12371/12471/12272 |

Les largeurs sont des références de rendu : adapter dans le shell360/402/440, Safe Areas et texte agrandi, sans couper les valeurs ni chevaucher les cibles tactiles. Garder les contrôles directs dans la feuille, aucun sous-dialogue variable. Nommer chaque stepper avec Série et unité ; annoncer erreur et lecture seule ; fournir une action accessible de déplacement utilisant le même ordre métier. D-237 régit appuis et maintien450/150ms ; ne pas inventer de temporisation métier.

## Portée et écarts observés

Le frame6607:10896 est un essai de composants, pas une preuve de promotion dans le DSF. Les chiffres de Figma ne sont pas normatifs : les douze lignes correspondent à8min30s suivant v12 ; la capture affiche5min20s. Les anciennes mentions Tour en direct et les lignes Récupération visibles en Composition restent des écarts connus : ACTIVITY n’a pas de Tour, D-238 retire les récupérations des cartes. Aucun PNG n’est retouché pour masquer ces différences.

La confirmation Supprimer cette séance ? (2234:189) conserve le dialogue destructif du DSF du01/10 : Annuler gris à gauche, Confirmer terre cuite à droite. Sa présence ne prouve aucun câblage interactif.

Inventaire et recettes : [matrice du02/10](MATRICE-SERIES-VARIABLES-2026-10-02.md). Captures exclusivement dans le chapitre06.
