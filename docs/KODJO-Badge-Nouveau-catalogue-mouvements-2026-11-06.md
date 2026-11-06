# KODJO — Badge « NOUVEAU » dans le catalogue des mouvements — spec différentielle

**Date :** 6 novembre 2026.

**Décision :** D-510 (demande de Hermann du 6/11/2026).

**Statut :** intégrée le 6/11/2026 : registre (D-510), contrat CE-MVT-03 et Figma.

**Figma :** composant « Carte — Mouvement » (`10124:21979`), propriété de variante « Nouveau » (Non / Oui), variante « Sélection=Absente, Nouveau=Oui » `11762:2205` ; écran « Mouvement — Catalogue — Fiche créée » `11762:23747` (fiche seule « Fentes avant » et pile repliée « Squats sautés »).

**Référence :**
- [KODJO-Catalogues-cartes-modales-2026-11-06](KODJO-Catalogues-cartes-modales-2026-11-06.md), §7 : la carte Mouvement et les piles ;
- les contrats CE-MVT-01 à CE-MVT-03.

## 1. Besoin

Après une création, la nouvelle fiche se range selon le tri en cours, et parfois dans une pile repliée. L'utilisateur doit la retrouver d'un coup d'œil.

## 2. Écart avec l'existant

| | Avant | Après |
|---|---|---|
| Carte Mouvement après création | aucun repère | badge « NOUVEAU » en bas à droite |
| Pile repliée qui contient une fiche nouvelle | aucun repère | badge « NOUVEAU » sur la carte de tête de la pile |
| Position de la liste au retour dans le catalogue | inchangée | la liste défile jusqu'à la fiche nouvelle |

Le reste est inchangé : carte, tri, filtres, piles, gestes et données.

## 3. Règles

1. **Fiches concernées.** Est nouvelle toute fiche créée par l'utilisateur, quel que soit le point d'entrée :
   - le bouton + du catalogue ;
   - l'action Ajouter un niveau ;
   - la duplication ;
   - l'ajout d'un exercice depuis la Composition.
2. **Apparition.** Le badge apparaît au premier affichage du catalogue des mouvements qui suit la création. Une fiche créée depuis la Composition est donc marquée à la prochaine visite du catalogue.
3. **Disparition.** Le badge disparaît dès que l'utilisateur quitte le catalogue des mouvements, de deux façons :
   - par les onglets du haut (Séances, Programmes) ;
   - par la barre de navigation du bas.

   Ouvrir la fiche puis revenir au catalogue ne le retire pas.
4. **Pas de donnée enregistrée.** Le marquage n'est pas stocké : c'est un état d'affichage du moment. Il disparaît aussi si l'application est fermée.
5. **Plusieurs créations.** Toutes les fiches créées depuis la dernière sortie du catalogue portent le badge.
6. **Pile.** La carte de tête d'une pile repliée porte le badge si l'un de ses niveaux est nouveau. Pile déployée : le badge figure sur la carte du niveau concerné, et non plus sur la tête.
7. **Filtres.** Le badge ne modifie ni les filtres ni le tri. Une fiche nouvelle exclue par un filtre actif ne s'affiche pas.
8. **Défilement.** Au retour dans le catalogue après une création, la liste se positionne sur la fiche nouvelle. Si elle est dans une pile repliée, la liste se positionne sur la pile, sans la déployer.
9. **Hors catalogue.** Le badge n'apparaît que dans l'onglet Mouvements du catalogue. Il n'apparaît pas dans le mode catalogue des questionnaires de Formats, ni dans les autres listes de mouvements.

## 4. Rendu

**Badge :**
- **Position :** en bas à droite de la carte, à 12 px du bord droit et à 8 px du bas. Son bord droit est aligné sur celui de « Niveau X ».
- **Texte :** « NOUVEAU » en majuscules, Inter Medium 12, comme « Niveau X », blanc.
- **Fond :** bleu KODJO (`color/primary`), rayon 4, marge interne de 6 px à l'horizontale et de 1 px à la verticale, soit environ 18 px de haut.
- **Couleur, raison du choix :** le rouge est réservé à la suppression (« Supprimer » dans les actions glissées). Un badge rouge sur une fiche qu'on vient de créer ferait croire à une erreur.

**Description de la carte :**
- Tant que le badge est affiché, la description est limitée à la largeur qui précède le badge, avec 8 px d'écart. Elle reste sur deux lignes au plus, avec des points de suspension.
- La description occupe aujourd'hui toute la largeur sur deux lignes : sans cette réduction, le badge la masquerait.
- La troncature est temporaire et disparaît avec le badge.

**Mode sélection :** le badge n'existe pas dans ce mode, conformément à la règle 9.

**Accessibilité :**
- Le badge est annoncé avec le nom : « Squats sautés, nouveau ».
- Le badge n'est pas une cible tactile.

## 5. Impacts

- **Figma :**
  - le composant « Carte — Mouvement » (`10124:21979`) reçoit une propriété de variante « Nouveau » : une variante dédiée porte la description raccourcie, ce qu'une propriété booléenne ne permet pas ; le badge est ancré en bas à droite ;
  - la carte de tête d'une pile est la même carte : même propriété ;
  - écran « Mouvement — Catalogue — Fiche créée » ajouté, avec une fiche seule et une pile repliée.
- **Contrats d'écran (chapitre 13) :**
  - CE-MVT-03 (catalogue) : état « fiche nouvelle », règles 2, 3 et 5 à 8 ;
  - CE-MVT-01 et CE-MVT-02 : sortie de création vers le catalogue, avec défilement et badge.
- **Registre (chapitre 07) :** D-510.
- **Spec §7 des cartes** du 6/11/2026 : un renvoi vers ce document.
- **Code :**
  - un état d'affichage, non persistant, qui contient la liste des identifiants créés depuis la dernière sortie du catalogue ;
  - cet état est vidé au changement d'onglet ou de vue ;
  - aucune migration ni modification d'API.

## 6. Hors périmètre

Le catalogue des séances : sa carte n'a pas la place pour ce badge.
