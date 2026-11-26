# DSF — Carte de séance du catalogue : visuel en mosaïque et informations (24/11/2026)

[Numérotation sur main, 25/11/2026 (collision technique, numéros déjà pris) : D-564 → **D-600**, D-565 → **D-601**, D-566 → **D-599**, D-567 → **D-602**. Le texte ci-dessous garde les numéros de la branche `docs/planification-grille-creneaux`.]

Décisions de Hermann du 24/11/2026 et du 25/11/2026 (D-564, D-565, D-567). Elles remplacent, pour la carte **repliée** du catalogue des séances, la cascade du visuel et la ligne de synthèse de [KODJO-Spec-Carte-et-catalogue-seances-2026-10-27](KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md) (révisée le 06/11/2026, D-504 à D-507). Les filtres et le glissé ne changent pas ; la carte déployée est conservée comme variante du composant mais n'est plus ouverte depuis le catalogue (§ 4).

Figma : composant `DSF / Cards / Séance — catalogue` (variantes Repliée, Sélection et Déployée) et composant `DSF / Cards / Séance — mosaïque` (1, 2, 3, 4 et « 5 et plus » images) ; cartes déployées dans les écrans « Catalogue des séances » du prototype et dans la modale « Planifier une séance — Sélectionner une séance ».

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

- **Vue retenue** (règle de Hermann du 24/11/2026) : la plupart des illustrations du catalogue sont composées de plusieurs vues côte à côte (environ 54 sur les 60 de `catalogue/illustrations/20261117`, branche `assets/illustrations-60-20261117`, gabarit 1206 × 987). On retient la vue **la plus à droite** ; quand il y en a **trois**, la **plus large**. Une image simple est retenue entière. Les mises en page à trois vues peuvent aussi être « deux vues en haut, une vue large en bas » (par exemple `FIT-STR-003`, `FIT-PIL-006`, `REED-005`, `REED-007`) : la vue retenue est alors la plus grande, soit la vue du bas.
- **Recadrage dans la case** : la vue retenue est utilisée **entière** ; si la forme de la case ne le permet pas, ses bords sont réduits autour du **centre** (point focal au centre) : gauche et droite pour une case plus horizontale que la vue, haut et bas pour une case plus verticale. Aucune déformation. Les photos d'utilisateur suivent le même recadrage sur l'image entière.
- **Production du rectangle de la vue** : à la publication du catalogue officiel, une étape de l'interface web de gestion des fiches détecte les bandes de séparation entre les vues, applique la règle de choix et propose le rectangle ; la personne qui publie vérifie et corrige. Le rectangle (x, y, largeur, hauteur, en pourcentage de l'image) est stocké avec l'image ; l'application ne détecte ni ne calcule rien à l'affichage.
- **Aucune image** : on retombe sur la fin de l'ancienne cascade (vignette du format de la séance, sinon vignette du format Libre).
- Toucher le visuel garde son comportement actuel (ouvre la composition en modification).
- Variantes horizontales (2 images empilées ; une horizontale et deux carrés) dessinées sur la planche et **écartées**.

**Prérequis : le marquage des photos.** La mosaïque ne peut s'afficher correctement qu'une fois le rectangle de la vue retenue produit et stocké pour chaque image du catalogue (marquage à la publication, vérifié par la personne qui publie). Ce marquage est livré **avant** la mosaïque ; sans lui, les images sont utilisées entières, ce qui n'est qu'un repli provisoire.

## 2. Informations (D-565, D-567)

La carte repliée fait **72 pt de haut et trois lignes** ; elle n'a plus de chevron.

- Ligne 1 : **nom** de la séance.
- Ligne 2 : chronomètre, **durée** (règles de durée inchangées, y compris « ≥ »), point médian, **noms des formats** séparés par des virgules, en semi-gras. Sans format, le texte « Libre » est affiché.
- Ligne 3 : pictogramme haltère puis **noms des mouvements** distincts, dans l'ordre de la composition, séparés par des virgules, sur une seule ligne ; ce qui ne tient pas est remplacé par « +N ».
- Bouton **Démarrer** : icône ronde de 28 pt à droite, centrée sur la hauteur de la carte, relief au repos et état appuyé (D-566) ; l'ombre est de la couleur du fond de la zone de contexte de la composition (`color/catalogue/seances/context`). Il remplace la pastille textuelle « Démarrer ».
- **Retirés de la carte repliée** : catégories, zones corporelles, nombre d'exercices, nombre de circuits, volume d'une séance à un seul exercice, chevron.
- **Mosaïque à 5 images et plus** : trois images et une quatrième case « +N », N = nombre d'images − 3 (les cases à 5 et 6 images seraient trop petites à 64 pt).

## 2 bis. Variante « Sélection » (modales de sélection)

Dans les modales de sélection de séances, la carte est la variante `État=Sélection` du composant `DSF / Cards / Séance — catalogue` : mêmes trois lignes et même mosaïque que la carte repliée, **sans bouton Démarrer** ; la pastille de sélection de la modale (numéro ou cercle vide) occupe la place de droite.

- Écran migré dans le prototype : « Planifier une séance — Sélectionner une séance ».
- Non migrés : les contextes `Choix calendrier ou planification` (radio) et `Choix multiple` de l'ancien composant `DSF / Cards / Séance`, ainsi que les écrans de « Conception — Hors MVP » (remplacement global prévu).

## 3. Points techniques

- Le rectangle de la vue retenue est une donnée de l'image du catalogue (x, y, largeur, hauteur, en pourcentage de l'image). Aucun calcul au moment de l'affichage.
- Essai de détection sur les 60 illustrations du 17/11/2026 (planches de Hermann du 24/11/2026) : 43 images à deux vues, 10 à trois vues (dont 4 en « deux en haut, une en bas »), 7 images simples ; détection d'une séparation horizontale seulement si la bande est blanche sur toute la largeur. Une fausse séparation a été observée (montants du portique de `FIT-CRO-010`) : la vérification par la personne qui publie reste nécessaire. Constat de Hermann : le résultat du recadrage centré est « très correct ». Dans les cases carrées, une vue verticale perd du haut et du bas (têtes ou jambes parfois coupées) ; accepté.

## 4. Toucher la carte (D-567)

Il n'y a plus de synthèse dépliée dans la liste : **toucher la carte (hors Démarrer) ouvre la composition de la séance** (écran « Composition séance en modification ») **présentée en modale iOS**. Le visuel garde le même comportement. Démarrer exécute la séance, comme avant. Le contenu de la modale (titres, boutons Enregistrer et Démarrer) est décrit dans un lot distinct.

La variante `État=Déployée` du composant est conservée (usage futur possible) ; aucun écran du catalogue ne l'ouvre.
