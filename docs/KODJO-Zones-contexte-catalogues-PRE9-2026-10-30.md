# KODJO — PRE-9 — Spécification de développement : zones de contexte des Catalogues

## 1. Périmètre et référence d'interface

La présente spécification définit le **résultat final à développer dès PRE-9**, dans les Catalogues **Mouvements** et **Séances**, pour leurs états par défaut, filtrés, archivés et les autres variantes des mêmes Catalogues.

Références Figma : fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page **Prototype MVP** (`510:101`), notamment :

| Catalogue | État | Nœud |
|---|---|---|
| Mouvements | « Mouvement — Catalogue — Piles » | `10266:20575` |
| Mouvements | « Mouvement — Catalogue — Filtre actif » | `10465:23141` |
| Mouvements | « Mouvement — Catalogue — Archivés » | `10495:24099` |
| Séances | « P-Catalogue des séances — Liste par défaut » | `1992:9910` |
| Séances | « Catalogue des séances — Filtre actif Archivé » | `4549:6742` |
| Séances | « Catalogue des séances — Archivées — Séance restaurée » | `1992:10848` |

L'implantation de référence est un écran de **402 × 874 pt**, avec **16 pt de marge latérale**. Conserver la navigation de Catalogue Mouvements / Séances / Programmes et les comportements existants hors de la zone concernée. **Masquer le titre de page individuel dans les deux Catalogues.**

Les coordonnées définissent la référence visuelle à 402 pt ; sur les autres largeurs, maintenir les marges de 16 pt, l'alignement à droite et les cibles accessibles, sans collision ni rognage.

## 2. Zone de contexte commune — « Recherche et création »

| Élément | Résultat attendu sur la référence 402 × 874 |
|---|---|
| Fond | Bande **lilas**, pleine largeur, de `y = 92` à `y = 207` (hauteur 115 pt) |
| Ligne 1 | Compteurs / sélecteurs ou indications de résultats, texte à `y = 118`, départ `x = 24` |
| Ligne 2 — Recherche par défaut | Champ à `x = 16`, `y = 155`, largeur **216 pt**, hauteur **44 pt** |
| Placeholder | **« Rechercher »**, **15 pt**, `#7A7A80` |
| Ligne 2 — Recherche en état filtré ou archivé | Champ à `x = 16`, `y = 155`, largeur **107 pt**, hauteur **44 pt**, afin de ménager l'affichage du compteur de résultats |
| Filtre | Contrôle visuel **34 pt**, `x = 260`, `y = 160` |
| Tri | Contrôle visuel **34 pt**, `x = 306`, `y = 160` |
| Créer | Contrôle visuel **34 pt**, `x = 352`, `y = 160` |
| Cibles des trois contrôles | **44 × 44 pt** chacune ; bord supérieur à `y = 155`, sans recouvrement des actions voisines |

La liste résultante combine **tous les filtres actifs et la recherche**. La recherche ne neutralise ni le filtre de Compteur, ni le panneau Filtre, ni la sélection existante « Un exercice / Plusieurs ». Le tri conserve son comportement existant ; sa présentation ne modifie pas sa disponibilité.

Les nombres affichés sont **dérivés des données réelles**, jamais des valeurs statiques issues de Figma. Ils se recalculent lorsqu'un filtre, une recherche, une vue ou le contenu de la collection modifie le résultat.

## 3. Catalogue Mouvements — compteurs de la première ligne

Libellé : **« N familles · N mouvements »** à partir de `x = 24`, `y = 118`.

- Police **14 pt**, **Regular**, couleur `#333333` lorsque le compteur est inactif.
- Séparateur **« · »** entre les deux compteurs.
- Les zones **« N familles »** et **« N mouvements »** sont **deux contrôles distincts et activables**.
- **Un seul compteur actif au maximum** : toucher l'inactif l'active et désactive l'autre ; toucher le compteur déjà actif le désactive. Aucun compteur sélectionné correspond à l'état sans ce filtre.
- Compteur actif : **bleu Kodjo `#0508E5`** et graisse **Semi Bold ou Bold**. Compteur inactif : `#333333`, **Regular**.
- L'activation participe au filtrage de la liste au même titre que les filtres du bouton **Filtre** et la recherche. Ne pas réinitialiser les autres critères lors d'une bascule.
- **Familles affichées** : nombre de familles dont **au moins une carte est effectivement affichée**.
- **Mouvements affichés** : nombre de **cartes effectivement affichées**.
- En particulier, ne pas utiliser automatiquement le nombre total de membres d'une famille repliée à la place du nombre de cartes affichées.

Les deux compteurs reflètent la liste courante, après application de ses filtres, de sa recherche et de ses états de visibilité. Ils restent corrects pour les listes vides, les familles repliées ou déployées, les archives et les autres variantes du Catalogue.

## 4. Catalogue Séances — libellés de vue et compteurs

Ligne 1 à partir de `x = 24`, `y = 118` :

**« Un exercice N | Plusieurs N »**

| Élément | Présentation |
|---|---|
| Libellés « Un exercice », « Plusieurs » | **14 pt**, Regular, couleur `#595E66` à l'état inactif |
| Compteurs `N` | **14 pt**, Regular, `#333333` |
| Séparateur `|` | Couleur `#9499A8`, position de référence `x = 127` |
| Libellé de vue sélectionnée | Bleu Kodjo `#0508E5`, graisse **Semi Bold ou Bold** |
| Compteur de vue | **Purement informatif** : aucun geste et aucune commande sur le chiffre |

Le comportement existant de la bascule est **inchangé** : « Un exercice » et « Plusieurs » sont mutuellement exclusifs ; une nouvelle pression sur la vue déjà active la désélectionne et affiche de nouveau la collection complète.

Chaque `N` correspond au **nombre réel de Séances de sa vue**, et non à une valeur de maquette. Les valeurs **2** et **3** ne sont que des exemples Figma et ne doivent pas être codées en dur.

La sélection porte sur le **libellé de vue** ; l'ajout du compteur ne doit ni étendre la commande au chiffre ni modifier les interactions précédemment développées. La recherche et les autres filtres continuent de s'appliquer au contenu affiché.

## 5. Indication « N résultats »

Sur les états **filtrés ou archivés** des deux Catalogues :

- Afficher un texte à droite de la première ligne, avec **bord droit à `x = 378`**.
- Police **14 pt**, **Regular**, couleur `#333333`.
- Le chiffre est le **nombre d'éléments réellement présents dans la liste après application de la recherche et de tous les filtres actifs**.
- Recalculer **en direct** dès que la liste résultante change.
- Accorder **« 1 résultat »** pour un seul élément ; **« 0 résultat »**, **« 2 résultats »**, etc., pour zéro ou plusieurs éléments.
- En même temps, réduire la largeur du champ de recherche à **107 pt** conformément au §2. Aucune valeur illustrée dans la maquette ne devient un nombre fixe.

## 6. Cohérence, interaction et accessibilité

- Les compteurs de Mouvements sont des **contrôles à état actif/inactif**, séparés et mutuellement exclusifs. Leur état doit être identifiable au-delà de la seule couleur et annoncé à l'accessibilité.
- Les compteurs numériques accolés aux vues Séances et « N résultats » sont du **texte informatif**, jamais des boutons.
- Les cibles Filtre, Tri et Créer restent chacune **44 × 44 pt**, avec leurs actions existantes.
- Les filtres, la recherche et le choix de vue doivent s'appliquer ensemble à une **même liste résultante**, sans compteurs calculés depuis une collection différente de celle affichée.
- Ne pas remplacer les conventions déjà validées du Catalogue : cartes, statut d'archivage, actions glissées, états vides, filtres du panneau, navigation, sélection de la vue Séances et comportement du tri.
- Aucune donnée métier n'est ajoutée ni modifiée du seul fait des compteurs ou de l'affichage.

## 7. Critères d'acceptation PRE-9

1. **Implantation** : sur 402 × 874 pt, bande `y = 92..207`, texte première ligne `x = 24` / `y = 118`, champ et contrôles exactement positionnés selon §2 ; marges 16 pt.
2. **Recherche par défaut** : `216 × 44` pt, `x = 16`, `y = 155` ; placeholder exact, taille et couleur requises.
3. **Recherche filtrée/archivée** : largeur 107 pt, avec « N résultats » à droite ; cibles tactiles Filtre/Tri/Créer de 44 × 44 pt sans chevauchement.
4. **Mouvements** : activation/désactivation et exclusion mutuelle des deux compteurs ; couleurs et graisses conformes ; recherche et panneau Filtre restent appliqués.
5. **Mouvements — calculs** : familles = familles avec au moins une carte visible ; mouvements = cartes visibles ; ne pas compter comme visibles les cartes masquées dans une pile repliée.
6. **Séances** : aucune régression de la bascule Un exercice/Plusieurs, y compris désélection ; seuls les libellés demeurent interactifs ; les chiffres sont informatifs et réels.
7. **Résultats** : compte recalculé après recherche et filtres, y compris archives, listes vides et changements de contenu ; accords exacts pour 0, 1 et 2.
8. **Navigation et UI** : titres individuels de page masqués ; navigation Mouvements/Séances/Programmes conservée ; état vide et listes/archives toujours accessibles.
9. **Non-régression** : actions des cartes, familles/niveaux, navigation et actions de création, filtres et tri restent conformes à leurs contrats existants.
10. **Validation** : tests ciblés des sélecteurs, résultats dérivés, interactions et variantes d'écrans ; comparer la géométrie aux références Figma sur la taille cible. Ne pas traiter les valeurs de démonstration des maquettes comme données de test fixes.

## 8. Livraison attendue de Claude Code dans PRE-9

Développer ce comportement **dès PRE-9**, indépendamment des travaux du moteur d'exécution PRE-10/11.

Réutiliser les composants, les services de filtrage, la recherche et la navigation déjà disponibles ; produire le rendu final sur les deux Catalogues et leurs variantes. Mettre à jour les tests directement concernés et la documentation de la story dans la même livraison. Aucun changement Figma n'est requis pour la réalisation du comportement spécifié ici.
