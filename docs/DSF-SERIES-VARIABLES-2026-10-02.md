# DSF — Séries variables et Ordre des côtés — 02/10/2026

**État courant06/10 :** [DSF Cadence et corrections](DSF-CADENCE-2026-10-06.md), [matrice courante](MATRICE-CADENCE-FIGMA-2026-10-06.md). Les mesures/captures datées ci-dessous restent historiques lorsqu’elles sont remplacées ; règles cartes média conservées. Cadence commune REPS et phrase unique selon paramètres v13, Phrase v1.

Complément des shells et composants existants ; aucun nouveau design. Actualisé le03/10. Sources : métadonnées et captures courantes de Prototype MVP, fichierG6RY5Ebhgwb4AHIOYDwwvg. Figma fixe le layout ; [v13](Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v13.md) et CE-UI-10 fixent les comportements et calculs. Les composants maîtres ne sont pas modifiés par cette livraison documentaire. Inventaire actuel : ETAT-DES-LIEUX-CREATION-EXERCICE-2026-10-03.md.

## Fondations conservées et implantation

| Élément | Prescription |
|---|---|
| Feuille | Blanche, ancrée au bas, coins supérieurs24 px, rognage aux coins, ombre légère vers le haut ; hauteur selon contenu |
| Voile | Noir28 %, plein écran ; arrière-plan inerte et inaccessible au focus |
| En-tête | Composant DSF En-tête de modale ; ✕ à gauche, titre Paramètres d’exécution, ✓ à droite ; labels accessibles Annuler/Valider les paramètres |
| Carte empilée | Fond `surfaceSubtle` `#F9FAFC` (ancien `#FCFCFE`, historique avant la fusion du journal §5.3), contour blanc, lignes42 px à texte standard, séparateurs#DEDEE5 ; libellé14 px à gauche, valeur/contrôle à droite |
| Ligne sélectionnée | Roulette ou segmenté uniquement : bord2 px#0508E5, fond#F4F4FF, rayon12 px ; contour limité à la ligne ; contrôle déployé dessous hors contour |
| Stepper commun | Largeur137 px à402, fond blanc, boutons#F2F2FF, glyphes/valeur bleus, valeur centrée ; aucun cadre sélectionné ; bord droit du + àx370 dans les copies du02/10 (x366 dans la référence du01/10) sur402, donc marge32 px pour le contrôle, avec marge36 px de la ligne de valeur ; boutons alignés entre lignes |
| Valeur modifiable | Composant Valeur modifiable du DSF, sans chevron ; la sélection est portée par la ligne |
| Valeur lecture seule | Texte#141414,14 px, sans pastille/chevron/rôle bouton ; Durée totale ≥ en Répétitions |
| Segmenté en feuille | Trois largeurs égales ; non sélectionné#FCFCFE, contour blanc ; Changement de côté13 px, centré sur deux lignes |
| Libellé long | Pause entre les côtés sur deux lignes ; largeur180 px à402 pour éviter le stepper |
| Roulette | DSF Forms/Roulette, minutes/secondes, sous sa ligne ; pas de seconde modale ni validation indépendante |
| Message temporaire | Sous la ligne concernée à4 px ; état6423:9953 : croissance vers le haut de62 px à402, lignes du bas inchangées |


## Tableau variable et Ordre des côtés

Dimensions de référence à402px ; coordonnées locales au contenu de la feuille, pas à la page Figma.

| Élément | Implantation / adaptation | Preuve |
|---|---|---|
| Groupe Séries variables | x24, largeur354 ; fond et contour rattachent l’interrupteur au tableau | 6665:24616 |
| Ligne de commande | x36, largeur334, hauteur42 ; sous Séries ; libellé/chevron à gauche et interrupteur à droite | 6665:24616 |
| Ligne variable | Numéro aligné à droite sans symbole, poignée puis cible et Pause ; deux steppers128px | 6665:24616/27608 |
| À l’échec | Libellé fixe remplace cible ; seul le stepper Pause subsiste | 6665:25072 |
| Ordre des côtés | Ligne après Changement de côté ; sélection sous la ligne, x36,330×60 ; deux options sur deux lignes, titre et flèches centrés | 6665:26185 (segmenté) /6665:26575 (valeur alternée) |
| Total | Ligne du corps ; sans rôle bouton en variable ; demeure dans le flux lorsque tableau replié | 6665:27458 |
| Douze lignes | Défilement du corps entier, en-tête fixe ; ne pas introduire un second scroll dans le tableau | 6665:25277 (haut ; bas sans frame dédiée) |
| N=1 | Interrupteur désactivé grisé, ordre effectif par défaut grisé ; aucun texte explicatif | 6665:26822, complété par arbitrage D-250 |
| Invalide | ✓ grisé, cellule signalée, message en ligne nommant la Série ; total— | 6665:27232 |
| Résumé parent | Trois premières valeurs et ellipse ; ordre des côtés dans le texte | 6665:27862/28050 ; Répétitions derrière6665:24844 |
| Ligne de Séance | N séries variables, sans liste des valeurs | 6665:23973 |
| Exécution | Série n/N et côté distinct ; aucune barre par Série ; barre Tour réservée à la Séance | 1992:8132,4968:8188,5581:4257 ; états spécialisés non représentés actuellement |

Les largeurs sont des références de rendu : adapter dans le shell360/402/440, Safe Areas et texte agrandi, sans couper les valeurs ni chevaucher les cibles tactiles. Garder les contrôles directs dans la feuille, aucun sous-dialogue variable. Nommer chaque stepper avec Série et unité ; annoncer erreur et lecture seule ; fournir une action accessible de déplacement utilisant le même ordre métier. D-237 régit appuis et maintien450/150ms ; ne pas inventer de temporisation métier.

## Portée et écarts observés

Les anciennes copies et le frame d’essai6607:10896 ne sont plus présents sur Prototype MVP. Les fichiers documentaires historiques restent conservés.6665:25277 montre le haut du contenu12séries ; le total situé plus bas ne peut pas être déclaré visuellement vérifié depuis cette capture. Les anciens écarts de5min20 appartiennent au relevé historique. La recette normative reste8min30 pour les données indiquées. Les références directes affichant Tour et la récupération visible en Composition conservent les écarts déjà tracés, sans changement métier.

La confirmation Supprimer cette séance ? (2234:189) conserve le dialogue destructif du DSF du01/10 : Annuler gris à gauche, Confirmer terre cuite à droite. Sa présence ne prouve aucun câblage interactif.

Inventaire et recettes : [matrice du02/10](MATRICE-SERIES-VARIABLES-2026-10-02.md). Captures exclusivement dans le chapitre06.
