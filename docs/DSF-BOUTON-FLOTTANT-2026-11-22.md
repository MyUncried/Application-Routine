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
- **Transparence d'ensemble** (recette du 24/11/2026, Hermann : « rendre le bouton un peu plus transparent, à 65 % d'opacité (35 % de transparence) ») : le bouton entier (verre, liseré, contenu, ombre) est affiché à 70 % d'opacité, dans les deux couleurs (Hermann : « Les 70% et l'ombre sont valables pour les deux couleurs ») ; inactif, il reste atténué à 45 %. [65 % — remplacé le même jour.]
- **Couleurs inversées** (recette du 24/11/2026, Hermann : « un appui long sur le bouton pour lui faire passer d'un fond blanc symbole bleu à un bouton d'un fond bleu symbole blanc (mêmes opacités) ») : un appui long (0,5 s, sans glissement) fait passer le bouton au fond bleu `#0508E5` (même voile de 65 %) avec le symbole blanc, sans déclencher l'action ; un nouvel appui long le ramène au fond blanc. Le choix est conservé sur l'appareil et vaut pour tous les écrans, comme la position. [Liseré, ombre et transparence d'ensemble inchangés — remplacé le 24/11/2026, Hermann : « Retirer le liseré blanc quand le bouton est bleu, passer à 70% d'opacité, assombrir un peu l'ombre ».] Bouton bleu : sans liseré. [« 70 % et ombre plus sombre pour le bleu seul, bouton blanc inchangé » — lecture remplacée le même jour : 70 % et ombre à 22 % valent pour les deux couleurs.] La croix du menu Créer ouvert reste blanche à symbole bleu (non citée).
- **Ombre** : large et douce (gris, 22 %, décalage 4, flou 24) — recette du 24/11/2026, « assombrir un peu l'ombre », valable pour les deux couleurs. [Gris 14 % — remplacé.]
- **Liseré** : blanc, fin (1,2), translucide et irrégulier sur le pourtour (plus brillant en haut à gauche et en bas à droite).
- **Contenu** : bleu `#0508E5`.
- **Position par défaut** : 16 du bord droit, 12 au-dessus de la barre de navigation, ou au-dessus du bouton « Continuer » en composition.
- **Plan d'affichage** : le bouton passe sous les feuilles modales, et au-dessus de tout le reste de l'écran, zone de contexte comprise (recette du 24/11/2026, fab-partout).
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

**Règle en vigueur depuis le 24/11/2026 (D-594)** — vidéo de Hermann et audit `.github/orchestration/reports/2026-11-24_AUDIT-FAB-PHYSIQUE.md` (référence : bouton d'outils d'Expo) :
- **Toucher** : un toucher sans glissement de plus de 10 pt déclenche l'action.
- **Saisie** : dès 10 pt de glissement, sans appui long.
- **Suivi** : le bouton suit le doigt avec un retard qui grandit avec la vitesse du doigt (un ressort le relie au doigt), et le rattrape quand le doigt ralentit ou s'arrête.
- **Relâchement** : le bouton garde son élan. Il se range toujours contre le bord gauche ou droit — celui vers lequel l'élan le porte, sinon le plus proche — à 16 du bord, en le dépassant légèrement avant de s'y poser ; il ne reste jamais au centre. Verticalement, il garde son élan puis s'arrête librement.
- **Zone permise** : tout l'écran — en-tête, zone de contexte, contenu et barre de navigation (l'onglet caché sous le bouton est accepté) ; le bouton reste entièrement visible et, lancé contre le haut ou le bas, il est ramené en douceur.
- **Rattrapage** : il peut être rattrapé en mouvement et repart sans saut.
- **Mémoire** : position conservée sur l'appareil, commune à tous les écrans, ramenée dans l'écran si besoin.
- **Composition** : le menu Créer s'ouvre vers le haut s'il y a la place, sinon vers le bas.
- **Réduire les animations** (réglage iOS) : pose directe, sans ressort ; le réglage est suivi en direct, sans relancer l'application (recette du 24/11/2026).

[Règle du 22/11/2026, remplacée le 24/11/2026 par D-594, texte d'origine conservé ci-dessous.]

Le bouton est flottant : l'utilisateur peut le déplacer.
- **Geste** : un appui maintenu puis un glissement déplacent le bouton.
- **Rangement** : au relâchement, le bouton se range contre le bord gauche ou droit le plus proche, à 16 du bord.
- **Hauteur** : il garde sa hauteur, entre le bas de la zone de contexte et le haut de la barre de navigation (ou du bouton « Continuer »).
- **Mémoire** : la position choisie est conservée sur l'appareil et vaut pour tous les écrans.
- **Toucher simple** : il déclenche l'action.

[Comportement détaillé (rangement contre un bord, mémoire de la position) retenu par Claude le 22/11/2026, à partir de la demande de Hermann : « Le bouton est flottant, donc par définition on peut le déplacer ».]
