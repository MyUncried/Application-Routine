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

- **Cadrage** : chaque image remplit sa case sans déformation. Le visuel d'un mouvement est son **cadrage de vignette** : un rectangle carré (position et taille) stocké avec l'image. La plupart des illustrations du catalogue sont composées de plusieurs vues côte à côte (environ 54 sur les 60 de `catalogue/illustrations/20261117`, branche `assets/illustrations-60-20261117`, gabarit 1206 × 987) ; le cadrage correspond alors à la **première vue** (position de départ). Sans cadrage (image simple, photo d'utilisateur), l'image est recadrée sans déformation autour de son centre.
- **Production du cadrage** : à la publication du catalogue officiel, une étape de l'interface web de gestion des fiches détecte les bandes de séparation entre les vues et propose le rectangle de la première ; la personne qui publie vérifie et corrige. Aucune détection ni calcul dans l'application, qui applique le rectangle stocké. Un placement de points sur le personnage reste un correctif manuel possible, pas la méthode principale.
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

- Le cadrage de vignette est une donnée de l'image du catalogue (x, y, côté, en pourcentage de l'image). Aucun calcul au moment de l'affichage.
- Détection des vues : essai sur les 60 illustrations du 17/11/2026 : séparations nettes détectées sur 44 images, bandes plus fines sur 8 autres (détection à assouplir, avec fausses séparations possibles), 6 images simples. La vérification par la personne qui publie est donc nécessaire.
