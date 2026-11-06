# KODJO — Badge « New » dans le catalogue des mouvements — spec différentielle

**Date :** 6 novembre 2026.

**Décision :** D-510 (demande de Hermann du 6/11/2026).

**Statut :** intégrée le 6/11/2026 : registre (D-510), contrat CE-MVT-03 et Figma.

**Figma :** composant « Carte — Mouvement » (`10124:21979`), propriété de variante « Nouveau » (Non / Oui / Dans la pile), variantes « Sélection=Absente, Nouveau=Oui » `11762:2205` et « Sélection=Absente, Nouveau=Dans la pile » `11765:2101` ; écran « Mouvement — Catalogue — Fiche créée » `11762:23747` (fiche seule « Fentes avant » : « New » ; pile repliée « Squats sautés » : « New ↓ »).

**Référence :**
- [KODJO-Catalogues-cartes-modales-2026-11-06](KODJO-Catalogues-cartes-modales-2026-11-06.md), §7 : la carte Mouvement et les piles ;
- les contrats CE-MVT-01 à CE-MVT-03.

## 1. Besoin

Après une création, la nouvelle fiche se range selon le tri en cours, et parfois dans une pile repliée. L'utilisateur doit la retrouver d'un coup d'œil.

## 2. Écart avec l'existant

| | Avant | Après |
|---|---|---|
| Carte Mouvement après création | aucun repère | badge « New » au coin bas droit |
| Pile repliée qui contient une fiche nouvelle | aucun repère | badge « New ↓ » sur la carte de tête de la pile |
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
6. **Pile.** La carte de tête d'une pile repliée porte « New » si elle est elle-même nouvelle, et « New ↓ » dès qu'un niveau caché sous elle est nouveau : la flèche indique que la fiche créée est sous la pile. Pile déployée : « New » figure sur la carte de chaque niveau concerné.
7. **Filtres.** Le badge ne modifie ni les filtres ni le tri. Une fiche nouvelle exclue par un filtre actif ne s'affiche pas.
8. **Défilement.** Au retour dans le catalogue après une création, la liste se positionne sur la fiche nouvelle. Si elle est dans une pile repliée, la liste se positionne sur la pile, sans la déployer.
9. **Hors catalogue.** Le badge n'apparaît que dans l'onglet Mouvements du catalogue. Il n'apparaît pas dans le mode catalogue des questionnaires de Formats, ni dans les autres listes de mouvements.

## 4. Rendu

**Badge :**
- **Position et forme :** en forme d'onglet, comme l'onglet sélectionné des catalogues, logé dans le coin bas droit de la carte. Les deux côtés qui touchent le cadre (bord droit et bas) n'ont pas d'angle : ils s'évasent en arrondis inversés (rayon 8) qui se fondent dans le bord. L'angle libre, en haut à gauche, est arrondi (rayon 12) ; le coin bas droit suit celui de la carte. Corps de 24 px de haut, marge interne de 10 px à l'horizontale.
- **Texte :** « New », seule la première lettre en majuscule, Inter Medium 12 comme « Niveau X », blanc, sans gras ; « New ↓ » sur la tête d'une pile (règle 6).
- **Couleur :** vert `color/status/positive-text` (#1F804F). Le badge n'est pas une action : le bleu KODJO, qui signale ce qui se touche (boutons, valeurs modifiables), induirait en erreur ; le rouge est réservé à la suppression. Le vert d'état « positif » se lit comme un ajout ; ce ton foncé garde le contraste du texte blanc en petit corps (environ 5:1).

**Description de la carte :**
- Tant que le badge est affiché, la description est limitée à la largeur qui précède le badge, avec 8 px d'écart. Elle reste sur deux lignes au plus, avec des points de suspension.
- La description occupe aujourd'hui toute la largeur sur deux lignes : sans cette réduction, le badge la masquerait.
- La troncature est temporaire et disparaît avec le badge.

**Mode sélection :** le badge n'existe pas dans ce mode, conformément à la règle 9.

**Accessibilité :**
- Le badge est annoncé avec le nom : « Squats sautés, nouveau » ; sur la tête d'une pile : « Squats sautés, contient un niveau nouveau ».
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
