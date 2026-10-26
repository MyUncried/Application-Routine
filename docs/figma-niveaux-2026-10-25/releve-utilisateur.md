# Prompt — Mise à jour de la documentation KODJO (niveaux)

## Contexte

Tu mets à jour la documentation fonctionnelle de KODJO, une application mobile de fitness et de rééducation. Le document de référence est « KODJO — Niveaux, recherche, parcours et règles » (dernière version v6).

Les changements ci-dessous ont été faits dans la maquette Figma, page Prototype MVP et page Design system — Fondations.

Ta tâche : intégrer ces changements au document, signaler toute contradiction avec le texte existant, et ne rien inventer. Si un point est ambigu, pose la question plutôt que de trancher.

---

## 1. Parcours de création d'un mouvement, par la recherche de nom

La saisie du nom d'un mouvement déclenche un rapprochement par nom proche, affiché dans un panneau sous le champ, par-dessus le formulaire, clavier visible.

Écrans : `Mouvements proches`, `Nom déjà utilisé`, `Options d'un résultat`.

Règles posées :

- La touche entrée ne sélectionne jamais un résultat. Elle valide le nom saisi et poursuit la création d'un mouvement indépendant.
- Sélectionner se fait en appuyant sur un bouton de la carte, jamais par validation.
- Chaque carte de résultat porte deux issues à l'intérieur : « Utiliser ce mouvement » en bouton à droite, « Créer une variante » en texte bleu à gauche. Il n'y a plus d'action globale au bas du panneau, plus de bouton radio, plus d'état grisé.
- Les noms de mouvements sont uniques, jugés sur la clé canonique : espaces normalisés, casse ignorée, accents retirés, soit la même fonction que celle déjà utilisée pour l'unicité des catégories.
- Un nom strictement identique à un mouvement existant est refusé au champ, avec un message rouge affiché dès la frappe et non à la validation. Deux sorties : appuyer sur la carte pour reprendre le mouvement existant, ou corriger le nom.
- La liste de résultats est plafonnée à cinq et ne se réordonne pas pendant qu'un doigt est posé.

## 2. Création d'une variante, c'est-à-dire d'un niveau

Appuyer sur « Créer une variante » sur une carte ouvre `Variante, plus ou moins difficile` : le mouvement retenu seul, et sous lui deux options subordonnées, « Plus difficile » et « Moins difficile », marquées par un symbole de hiérarchie. Un cadre de retour aux résultats est posé au-dessus de la carte.

Le choix mène à `Variante, formulaire vierge` :

- Rien n'est hérité de l'origine : ni description, ni médias, ni catégorie, ni zone corporelle.
- Le niveau est déjà posé et découle du sens choisi.
- Le nom saisi par l'utilisateur est conservé, sauf s'il était exactement celui de l'origine : dans ce cas le champ affiche le nom de l'origine suivi d'une invite grise, « Squats (compléter le nom) », qui disparaît à la première frappe.
- La recherche par nom proche est désactivée sur cet écran, la filiation étant déjà déclarée. L'unicité reste contrôlée à la sauvegarde.

## 3. Reprise d'un mouvement existant et portée des modifications

`Repris (lecture seule)` affiche le mouvement repris avec ses champs verrouillés et un bouton d'édition en haut à droite. Ce bouton n'existe que là où les champs sont verrouillés.

Table des parcours à documenter :

| Parcours | Champs du mouvement | Bouton d'édition | Raison |
|---|---|---|---|
| Créer un exercice, mouvement écrit sur place | modifiables | absent | le mouvement n'existe que dans cet exercice |
| Créer un exercice, mouvement repris | lecture seule | présent | contenu partagé avec d'autres exercices |
| Créer une variante | modifiables | absent | mouvement neuf |
| Ouvrir un exercice depuis le catalogue | lecture seule | présent | corriger engage tous les exercices |
| Ouvrir un exercice depuis une séance | lecture seule | présent | on vient régler l'exécution |

Portée du bouton : uniquement les champs propres du mouvement, nom, description, médias, et les trois puces catégorie, zone corporelle et niveau. Les paramètres d'exécution appartiennent à l'exercice et restent modifiables partout sans déverrouillage.

État actif du bouton : pastille blanche, crayon bleu plein, pendant toute la durée de l'édition.

## 4. Fenêtre de portée à la sauvegarde

Trois écrans : `Sauvegarde — Nom inchangé`, `Sauvegarde — Nom modifié`, `Sauvegarde — Choix sélectionné`. Gabarit de fenêtre du système, 354 de large, titre 18, message 14, boutons de 147 avec le neutre à gauche et le principal à droite.

- **Nom inchangé** : seule la mise à jour est possible, puisque l'unicité interdit un second mouvement du même nom. Actions : Annuler, Confirmer.
- **Nom modifié** : « Vous souhaitez : », puis deux cartes de choix portant chacune leur conséquence, « Mettre à jour ce mouvement, pour tous les exercices qui l'utilisent » et « Créer un nouveau mouvement, uniquement pour cet exercice », plus Annuler.
- Les deux cartes portent un bouton radio à droite. Tant qu'aucune n'est cochée, Confirmer est indisponible. Annuler reste disponible à tout moment et ne se transforme pas en Confirmer.
- La fenêtre n'apparaît que si le mouvement est utilisé par au moins deux exercices. Sinon la sauvegarde est silencieuse.
- **Point à arbitrer, à mentionner comme tel** : la mise à jour se propage aux exercices, présents et futurs. Pour l'historique des séances réalisées, la pratique du marché est de le geler. À trancher.

## 5. Gestion des niveaux depuis un exercice

`Popover de niveau` à trois options : « Changer de niveau », « Ajouter un niveau », « Réordonner les niveaux ». Les deux premières portent un chevron vers la droite et ouvrent un déploiement en place avec les choix subordonnés et un chevron vers le bas.

`Groupe de niveaux — Ordre` liste les niveaux du plus facile au plus difficile, numéro à gauche dans un cadre figé, photo, nom et description sur deux lignes tronquées.

Non traité, à documenter comme manquant : rattacher un mouvement indépendant à une famille, le détacher, et supprimer un niveau. Ces trois opérations relèvent d'une gestion des mouvements à part entière, hors MVP.

## 6. Affichage du niveau

- Là où la carte dispose d'une puce de niveau : jauge verticale de trois segments, bleu plein jusqu'au rang atteint, bleu à 28 % au-delà, suivie du libellé « Niveau N ». Un mouvement sans niveau affiche « Niveau » et une jauge entièrement pâle.
- Là où la carte n'a pas de puce : le niveau s'écrit à la suite du nom, dans le même texte, sous la forme « Squat assisté - N1 ». Rien n'est écrit si le mouvement n'a pas de niveau.
- Trois rangs sont dessinés. Au-delà de cinq, et peut-être dès trois, une jauge générique remplace le décompte segmenté.
- Le nombre de niveaux d'une famille n'est pas plafonné.

## 7. Catalogue des mouvements

Écran existant `Catalogue des mouvements — Liste complète` et son état vide.

Proposition montée dans `Catalogue — Vue Mouvements (piles)` : Mouvements devient un quatrième onglet du contrôle segmenté du catalogue, placé en premier, et les membres d'une même famille sont présentés en pile, la carte du dessus étant le rang 1 et l'épaisseur écrite en toutes lettres, « 3 niveaux ». Un mouvement seul n'est pas une pile. La recherche sort de la pile et montre le mouvement trouvé en carte simple.

Statut : le catalogue des mouvements sert à l'entretien, pas au choix d'un mouvement, qui passe par la saisie du nom.

## 8. Changements indirects, à refléter partout où la documentation décrit les cartes

- Deux composants nouveaux : `Carte — Mouvement`, et `Carte — Mouvement — Résultat` qui porte les deux actions à l'intérieur.
- Toute carte non dépliée mesure 80 de haut, soit le gabarit photo de 64 plus 8 de marge en haut et en bas. Photo à 8 et 8, colonne de texte à 84, trois lignes tenant dans la carte.
- Sablier et durée : réserve de largeur fixe calculée sur la durée la plus longue, position du sablier constante d'une carte à l'autre, durée collée au symbole. Même règle pour l'horloge et l'heure du calendrier semaine, où le point médian qui les précédait est supprimé.
- L'icône de bilatéralité passe de la troisième à la deuxième ligne, à la suite immédiate du texte de zone corporelle.
- Les petites icônes d'étiquette, de catégorie et de zone corporelle perdent leur cercle, leur symbole est agrandi à 14, au gabarit des icônes de ligne.
- Terminologie : « mouvement » remplace « geste » partout, dans la maquette comme dans le dépôt.

---

## Ce que j'attends de toi

Une version mise à jour du document, structurée comme l'actuelle, qui intègre ces points.

Signale séparément :

1. les passages du document existant que ces changements contredisent,
2. les points laissés en arbitrage,
3. ce qui manque encore pour que le parcours soit complet.
