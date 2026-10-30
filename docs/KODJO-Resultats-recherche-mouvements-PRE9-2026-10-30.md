# KODJO — PRE-9 — Résultats de recherche des Mouvements : spécification de développement

## Périmètre et références

**Résultat final à développer immédiatement dans PRE-9.** La présente spécification concerne les résultats « Mouvements proches », « Nom déjà utilisé », « Options d’un résultat » et « Niveau, plus facile ou plus difficile » affichés pendant la création d'un Mouvement ou d'un Exercice à partir d'un Mouvement. Elle distingue explicitement les cartes de **Résultat** et de **Composition**.

Source de décision : document fourni par Hermann le 30/10/2026, « Modifications des écrans Mouvement — maquettes PRE-9.md », contrôlé sur Figma (fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page `510:101`).

| Parcours / état | Référence Figma |
|---|---|
| Créer un Mouvement — Mouvements proches | `10415:21713` |
| Créer un Mouvement — Nom déjà utilisé | `10415:21814` |
| Créer un Mouvement — Options d’un résultat | `10415:21916` |
| Créer un Mouvement — Niveau, plus facile ou plus difficile | `10415:21939` |
| Créer un Exercice — Mouvements proches | `9882:19049` |
| Créer un Exercice — Nom déjà utilisé | `10175:20349` |
| Créer un Exercice — Options d’un résultat | `10131:21995` |

Les cartes de résultats et de Composition réutilisent leurs **composants existants**. Aucun nouveau composant ni nouveau type de Mouvement n'est introduit.

## 1. Composant « Carte — Mouvement — Résultat »

Utilisé pour les **résultats du parcours de création de Mouvement**, notamment les Mouvements proches, le nom déjà utilisé et les options d'un résultat.

- La carte conserve le nom, le média éventuel, le rang de Niveau et la description du Mouvement.
- La **description dispose de 179 pt de largeur**.
- Le bouton **« Ajouter un niveau »** reste **à droite**, sur **deux lignes**, au format **66 × 32 pt**, à **x = 264 pt**, son bord inférieur aligné sur la fin de la description (lignes 2 et 3).
- Sa **zone tactile est de 78 × 36 pt**, à **x = 258, y = 31 pt**, dans les coordonnées du composant.
- L'action « Ajouter un niveau » conserve son comportement métier existant : elle prépare le choix du sens de difficulté, puis la création d'un Mouvement de Niveau distinct ; elle ne crée rien au simple toucher avant validation de l'éditeur.
- **Aucun bouton « Utiliser » ni « Utiliser ce mouvement »** n'est affiché sur les cartes de ce parcours de création de Mouvement.

Ces dimensions sont celles du composant de référence ; elles ne désignent pas les coordonnées globales d'un écran.

## 2. Composant « Carte — Mouvement — Composition »

Utilisé dans le contexte de sélection ou de rapprochement de Mouvements **depuis la composition d'une Séance / création d'un Exercice**.

- La carte mesure **338 × 73 pt** dans les listes de référence.
- **Aucun bouton** dans la carte, notamment aucun « Ajouter un niveau » ni « Utiliser ».
- La description dispose de **253 pt de largeur**, sur **deux lignes au maximum**. Tout dépassement est **tronqué avec des points de suspension « … »**.
- Cette règle s'applique au composant commun « Carte — Mouvement — Composition » dans **tous ses emplois du projet**, sans changer les parcours de sélection existants.

Les deux composants ne sont pas substituables : un résultat de création de Mouvement conserve l'action « Ajouter un niveau », une carte de Composition n'en comporte jamais.

## 3. Listes et regroupement par famille

- Les états **Mouvements proches** montrent, dans l'exemple Figma, cinq cartes : Squats, Squats assistés, Squat bulgare, Front squat, Goblet squat. Ces noms et quantités sont des **données de démonstration** ; les résultats réels proviennent de la recherche existante.
- Dans la création de Mouvement, la liste de cinq résultats « Résultat » occupe **421 pt** sur la maquette.
- Dans les écrans **Nom déjà utilisé** et **Options d’un résultat**, les cartes appartenant à la même famille restent visuellement regroupées ; la liste n'est pas artificiellement aplatie. Le groupe Squats/Squats assistés n'est qu'un exemple.
- **Filet bleu « groupe de niveaux »** : `x = 3 pt`, largeur **2 pt**, du **centre vertical de la première carte visible de la famille** au **centre vertical de la dernière carte visible de cette famille** ; appliqué aux six listes concernées.
- Le filet suit la hauteur et l'ordre réellement affichés des cartes. Il représente uniquement l'appartenance existante, sans modifier les identifiants de famille, rangs, clés de tri ou règles de recherche.

## 4. État « Niveau, plus facile ou plus difficile »

Référence : Figma `10415:21939`. Il est atteint depuis le résultat « Ajouter un niveau » du parcours de création de Mouvement.

- La carte dépliée reprend les **trois lignes** de la carte Résultat du mouvement de référence ; « Ajouter un niveau » reste à droite.
- Une **quatrième ligne** présente deux actions : **« Plus facile »** et **« Plus difficile »**, séparées par un trait vertical **« | »**.
- Cadre étendu **338 × 104 pt** ; marges verticales internes **8 pt** en haut et en bas. Zone de liste de recherche : **178 pt** de hauteur.
- Contrôle « Plus facile » : **x = 90,5 pt**, largeur **64 pt**, **y = 68 pt**, hauteur **28 pt**. Contrôle « Plus difficile » : **x = 183,5 pt**, **y = 68 pt**, hauteur **28 pt**.
- Séparateur vertical : **1,5 × 12 pt**, à **x = 166,5, y = 74,5 pt**, avec des marges de **14 pt** autour des séparations de la ligne de titre/onglets, et un écart de **12 pt** avec les deux actions de difficulté dans cette carte.
- Retirer de cet état les anciens éléments **« Utiliser ce mouvement »**, le second cadre et les symboles d'arborescence. Ne pas les recréer.
- **Plus facile** / **Plus difficile** conservent leur sémantique existante de Niveau moins/plus difficile que la source ; après le choix, ouvrir le formulaire du nouveau Niveau selon le parcours déjà documenté. Ne pas confondre le choix de difficulté avec le réordonnancement par glisser-déposer dans le Catalogue.

## 5. Recherche et états communs

- La recherche et les filtres des Catalogues continuent de se **cumuler**, selon [la spécification PRE-9 de zone de contexte](KODJO-Zones-contexte-catalogues-PRE9-2026-10-30.md).
- Le champ « Rechercher » des Catalogues conserve `x = 16, y = 155` et **216 × 44 pt** ; dans les états filtrés ou archivés, largeur **107 pt** pour « N résultats ». Ce présent lot ne modifie pas les règles des compteurs.
- La ligne d'onglets de Catalogue reprend le séparateur vertical `|` de **1,5 × 12 pt**, avec marges horizontales **14 pt**.
- Les listes restent **sous** le champ de recherche ; l'icône d'ajout de photo ne doit pas empiéter visuellement sur le champ.
- Conserver la recherche de Mouvements existante, les règles de nom unique, les familles de Niveaux, leurs numéros, le tri, les actions de Catalogue, le clavier, l'annulation et les validations métier. Aucune recherche n'enregistre à elle seule un nouveau Mouvement.

## 6. Limites de cette livraison

Les modifications de composants recensées dans le document d'entrée qui concernent **Calendrier**, **Suivi**, **Profil**, les **modales de planification**, les **modales d'archives Séance** et la **restauration d'écrans Gainage · Mobilité** ne font **pas partie** du correctif de résultats de recherche demandé. Ne pas reproduire une suppression accidentelle de sélecteur Jour/Semaine/Mois dans les modales de planification. Ne pas utiliser les détails purement visuels de ces autres écrans pour changer leurs règles métier.

L'absence de nouveau composant Figma n'autorise ni nouvelle action métier ni changement de navigation.

## 7. Critères d'acceptation — PRE-9

1. Les résultats « Mouvements proches », « Nom déjà utilisé » et « Options d’un résultat » du parcours **Créer un Mouvement** utilisent la carte **Résultat**, avec bouton « Ajouter un niveau » **66 × 32 pt** à droite et zone tactile **78 × 36 pt**.
2. La description de la carte Résultat dispose de **179 pt** ; le bouton n'empiète ni sur elle, ni sur les informations de Niveau ; son bord inférieur est aligné avec la zone de description.
3. Les résultats du parcours **Créer un Exercice depuis la Composition** utilisent la carte **Composition** **338 × 73 pt**, sans bouton, description **253 pt**, limitée à deux lignes avec « … ». Tous les autres emplois du même composant conservent cette règle.
4. Les résultats regroupés par famille présentent le filet bleu `x=3`, épaisseur 2, du centre de la première au centre de la dernière carte affichée, dans les six listes visées.
5. L'état de difficulté `10415:21939` possède **un seul cadre** de 338 × 104 pt, ligne « Plus facile | Plus difficile », contrôles aux positions définies, liste de 178 pt et **aucun** « Utiliser ce mouvement ».
6. Le choix de difficulté conserve la création d'un Niveau distinct et les règles existantes d'annulation ; aucune nouvelle identité créée avant l'enregistrement.
7. Recherche, filtrage, tri, sélection depuis la Composition, familles, états de nom déjà utilisé et clavier ne régressent pas.
8. Les dimensions et états sont comparés aux nœuds Figma de référence ; les exemples de noms et le nombre illustratif de résultats ne sont pas figés dans le code.
9. Aucun changement de comportement n'est apporté aux écrans hors périmètre recensés au §6.

**Exécution :** correctif à développer **dès maintenant dans PRE-9**, indépendamment du moteur PRE-10/11. Tests ciblés des deux variantes de cartes, des six listes, de la difficulté et des parcours de navigation.
