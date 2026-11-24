# DSF — Bouton flottant « Créer » — 22/11/2026

**Décisions :** D-558 (bouton flottant), D-559 (Agenda, Journal et Plan), registre ch07. Classe B : demandes et validations de Hermann du 22/11/2026.

**Figma** (fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP ») :
- composant `DSF / Actions / Bouton flottant — Créer` (`13039:49732`), six variantes ;
- planche de comparaison des styles : `13021:19` (trace de l'essai, non normative).

## 1. Principe

Les actions de création ne sont plus dans la zone de contexte. Un bouton rond flottant les porte, en bas à droite de l'écran. La zone de contexte s'allège :
- dans les catalogues et le Journal, le champ « Rechercher » s'élargit, et le filtre et le tri passent à droite ;
- dans l'Agenda, les deux lignes deviennent symétriques.

## 2. Rendu

- **Forme** : rond de 60 ; verre blanc dépoli à 65 % d'opacité, avec un flou de l'arrière-plan de 12.
- **Ombre** : large et douce (gris, 14 %, décalage 4, flou 24).
- **Liseré** : blanc, fin (1,2), translucide et irrégulier sur le pourtour (plus brillant en haut à gauche et en bas à droite).
- **Contenu** : bleu `#0508E5`.
- **Position par défaut** : 16 du bord droit, 12 au-dessus de la barre de navigation, ou au-dessus du bouton « Continuer » en composition.
- **Plan d'affichage** : le bouton passe sous les feuilles modales.
- **Mode sombre** : hors MVP. Aucune variante sombre n'est dessinée.

## 3. Contenu selon l'écran

| Variante | Écrans | Action |
|---|---|---|
| Calendrier (calendrier « + ») | Journal | Créer une routine (planification habituelle) |
| Calendrier (calendrier « + ») | Agenda | Créer un créneau unique au jour sélectionné (planification pré-remplie, sans répétition) |
| Mouvement (silhouette « + ») | Catalogue des mouvements | Créer un mouvement |
| Séance (liste « + », symbole existant de la séance) | Catalogue des séances | Créer une séance |
| Programme (carnet « + ») | Catalogue des programmes | Créer un programme |
| Plus (« + ») | Composition de séance | Ouvrir le menu Créer (§ 4) |
| Fermer (croix) | Composition, menu ouvert | Fermer le menu |

Le Plan n'a pas de bouton flottant. On y crée en touchant une case ou par « + Routine » ([DSF Plan](DSF-PLAN-2026-11-21.md)).

## 4. Composition de séance

- **Zone de contexte allégée.** Le « + Ajouter une activité » et le sablier « Ajouter un arrêt » quittent la zone de contexte.
- **Ouverture du menu.** Toucher le bouton flottant ouvre le menu Créer, vers le haut :
  - le bouton devient une croix ;
  - un voile couvre l'écran ;
  - les options s'empilent au-dessus du bouton, chacune avec son icône ronde alignée sur l'axe du bouton.
- **Options**, de haut en bas :
  1. Créer un exercice ;
  2. Créer un circuit ;
  3. Créer un cycle ;
  4. **Ajouter un point d'arrêt** (icône du sablier).
- **Comportement des options.** Chaque option garde son comportement existant. « Ajouter un point d'arrêt » ouvre le placement d'un point d'arrêt (écran « P-Composition séance — Placement d'un point d'arrêt »). Toucher la croix ou le voile ferme le menu sans action.

## 5. Déplacement

Le bouton est flottant : l'utilisateur peut le déplacer.
- **Geste** : un appui maintenu puis un glissement déplacent le bouton.
- **Rangement** : au relâchement, le bouton se range contre le bord gauche ou droit le plus proche, à 16 du bord.
- **Hauteur** : il garde sa hauteur, entre le bas de la zone de contexte et le haut de la barre de navigation (ou du bouton « Continuer »).
- **Mémoire** : la position choisie est conservée sur l'appareil et vaut pour tous les écrans.
- **Toucher simple** : il déclenche l'action.

[Comportement détaillé (rangement contre un bord, mémoire de la position) retenu par Claude le 22/11/2026, à partir de la demande de Hermann : « Le bouton est flottant, donc par définition on peut le déplacer ».]
