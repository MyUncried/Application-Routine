# DSF — Carte de séance du catalogue : visuel en mosaïque et informations (24/11/2026)

Décisions de Hermann du 24/11/2026 (D-564, D-565). Elles remplacent, pour la carte **repliée** du catalogue des séances, la cascade du visuel et la ligne de synthèse de [KODJO-Spec-Carte-et-catalogue-seances-2026-10-27](KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md) (révisée le 06/11/2026, D-504 à D-507). La carte déployée, les filtres, le glissé et Démarrer ne changent pas.

Figma : planche « Visuel de séance — essais de mosaïque (1 à 6 images) » et écran « P-Catalogue des séances — Visuel en mosaïque et informations (essai) » (cartes détachées, essai non intégré au composant).

## 1. Visuel (D-564)

Le carré de 64 pt à gauche devient une **mosaïque des images des mouvements de la séance**.

- **Images retenues** : les mouvements distincts de la séance, dans l'ordre de la composition, ceux qui n'ont pas d'image étant ignorés. Un mouvement répété compte une fois.
- **Disposition fixée par le nombre d'images, jamais par la forme des photos** (écart de 2 pt entre les cases, coins arrondis de 8 sur l'ensemble) :

| Images | Disposition |
|---|---|
| 1 | une vignette pleine |
| 2 | deux colonnes verticales |
| 3 | une colonne à gauche, deux carrés empilés à droite |
| 4 | 2 × 2 |
| 5 et plus | 2 × 2 ; la quatrième case est un compteur « +N », N = nombre d'images − 3 |

- **Vue retenue** (règle de Hermann du 24/11/2026) : la plupart des illustrations du catalogue sont composées de plusieurs vues côte à côte (environ 54 sur les 60 de `catalogue/illustrations/20261117`, branche `assets/illustrations-60-20261117`, gabarit 1206 × 987). On retient la vue **la plus à droite** ; quand il y en a **trois**, la **plus large**. Une image simple est retenue entière.
- **Recadrage dans la case** : la vue retenue est utilisée **entière** ; si la forme de la case ne le permet pas, ses bords sont réduits autour du **centre** (point focal au centre) : gauche et droite pour une case plus horizontale que la vue, haut et bas pour une case plus verticale. Aucune déformation. Les photos d'utilisateur suivent le même recadrage sur l'image entière.
- **Production du rectangle de la vue** : à la publication du catalogue officiel, une étape de l'interface web de gestion des fiches détecte les bandes de séparation entre les vues, applique la règle de choix et propose le rectangle ; la personne qui publie vérifie et corrige. Le rectangle (x, y, largeur, hauteur, en pourcentage de l'image) est stocké avec l'image ; l'application ne détecte ni ne calcule rien à l'affichage.
- **Aucune image** : on retombe sur la fin de l'ancienne cascade (vignette du format de la séance, sinon vignette du format Libre).
- Toucher le visuel garde son comportement actuel (ouvre la composition en modification).
- Variantes horizontales (2 images empilées ; une horizontale et deux carrés) dessinées sur la planche et **écartées**.

## 2. Informations (D-565)

La carte repliée affiche ce que contient la séance, ses formats et sa durée.

- Ligne 1 : nom (chevron inchangé) et durée en haut à droite (règles de durée inchangées, y compris « ≥ »).
- Ligne 2 : **noms des mouvements** distincts, dans l'ordre de la composition, séparés par des virgules ; ce qui ne tient pas est remplacé par « +N ».
- Ligne 3 : **noms des formats** de la séance, séparés par des virgules ; la ligne n'existe pas s'il n'y a aucun format. Le pictogramme reste l'haltère (une carte sans format ne le montre pas).
- **Retirés de la carte repliée** : catégories, zones corporelles (déjà absentes), nombre d'exercices, nombre de circuits, volume d'une séance à un seul exercice. Ces informations restent visibles dans l'état déployé ; les filtres Catégories et Zones corporelles ne changent pas.
- Hauteur de la carte : 72 pt, inchangée.

## 3. Points techniques

- Le rectangle de la vue retenue est une donnée de l'image du catalogue (x, y, largeur, hauteur, en pourcentage de l'image). Aucun calcul au moment de l'affichage.
- Essai de détection sur les 60 illustrations du 17/11/2026 (planches de Hermann du 24/11/2026) : 43 images à deux vues, 6 à trois vues, 11 à une vue. Une fausse séparation a été observée (montants du portique de `FIT-CRO-010`) : la vérification par la personne qui publie reste nécessaire. Constat de Hermann : le résultat du recadrage centré est « très correct ». Dans les cases carrées, une vue verticale perd du haut et du bas (têtes ou jambes parfois coupées) ; accepté.
