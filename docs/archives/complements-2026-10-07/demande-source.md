# Mise à jour de la documentation — voile modal unique

Objet : voile modal — valeur unique `overlayScrim` (#1F2129 à 34 %)

## Décision
Tous les voiles modaux (dialogues de décision, feuilles de sélection, roues, filtres, classification, catégorie, zones corporelles, calendrier ouvert, abandon/confirmation, CE-UI-10) utilisent le seul token `color/overlay/scrim` = #1F2129 à 34 %. Figma est aligné : 62 voiles de la page Prototype MVP, vérifiés.

`color/overlay-scrim` (#14171F, plein) reste la teinte d'ombre de la carte déplacée (D-299). Il ne sert jamais de voile.

## Corrections demandées
1. `12 – Architecture technique.md`, l. ~1340 : remplacer « voile noir 28 % de la feuille » par « voile `overlayScrim` (#1F2129 à 34 %) ».
2. `13 – Contrats d'écran.md`, CE-UI-10 § 9 (l. ~3098) : le texte « Voile modal #1F2129 à 34 % » est déjà correct. Ajouter la référence au token `overlayScrim`.
3. `DSF-CADENCE-2026-10-06.md`, lignes `overlayScrim` et `compositionDraggedCardShadow` (l. ~36-37) :
   - `overlayScrim` est le voile de tous les dialogues, feuilles, roues et modales ;
   - `compositionDraggedCardShadow` (#14171F) n'est jamais utilisé comme voile.
4. POINTS-A-REINTEGRER, point 18 : clore (valeur arrêtée : #1F2129 à 34 %).
5. D-299 : ajouter la précision « distinct de `overlayScrim` ».
6. Audit : clore H-15 (voile).

Aucune autre valeur de voile ne doit subsister : 28 %, 22 %, 35 %, 45 %, #000, #141414, #0D0D1A.

## Hors périmètre de cette mise à jour
Restent ouverts, indépendamment du voile : H-08, H-09, H-10, H-13 (en-tête 92 vs 95), H-14 (modèle de couleur Séance, décision propriétaire), H-16.

## Complément 1 — Contrôle segmenté du catalogue : deux options (décision fonctionnelle)
Décision propriétaire (2026-10-07) : le contrôle segmenté des catalogues d'exercices et de séances, et des modales de sélection (choisir une séance, choisir un exercice), n'a plus que deux options : **Exercices** et **Séances**. « Parcours » est supprimé. Figma est aligné sur Prototype MVP, Design system — Fondations et Communautaire.
À mettre à jour :
- décision D10 : caduque pour le segment de catalogue ; « Circuit » dans la composition de séance est inchangé ;
- `13` l. ~515, glossaire l. 51 et 138, INDEX l. 189, DSF-CADENCE § 4, point 4 de POINTS-A-REINTEGRER ;
- tout passage décrivant trois segments dans les chapitres 12 et 13 (contrôles CE du catalogue et des modales de sélection) ;
- audit : ligne 42 du registre (« Parcours / Circuit »).
Le code dit encore « Circuits » pour le troisième segment : la suppression est un sujet fonctionnel, à suivre dans le backlog et non dans le brief d'alignement visuel.

## Complément 2 — Titres d'écran (libellés)
Titres modifiés dans Figma (textes de titre uniquement) :
- « Composition d'une séance » devient **« Composer une séance »** (écrans de composition, en-tête DSF, pages de validation et de référence responsive, archives) ;
- « Modification d'une séance » devient **« Modifier une séance »** (écran Modifier une séance ; Communautaire portait en plus la faute « Mofification », corrigée) ;
- « Modification d'un exercice » : le titre de l'écran était déjà **« Modifier un exercice »**, rien à changer ;
- « Ajouter un exercice » devient **« Créer un exercice »** (64 textes de titre : écrans de création d'exercice du prototype, de Communautaire et en-tête DSF). Le titre « Créer une activité » n'est pas concerné.
À reporter dans le chapitre 13 (contrats d'écran : titres des CE de création, composition et modification), le glossaire et l'INDEX ; vérifier aussi la cohérence avec le bouton ou l'entrée « Ajouter » qui mène à l'écran « Créer un exercice » et avec l'arbre de création. Les noms de cadres et les étiquettes d'annotation (par exemple « Composition d'une séance — Placement d'une pause », « Ajouter un exercice — Initial », « 5271:5455 · Modification d'une séance ») n'ont pas été renommés : décision à prendre.

## Complément 3 — DSF : contrôle segmenté
- Composant « DSF / Controls / Segmenté » : deux variantes ajoutées, « Deux options — 1 sélectionné » et « Deux options — 2 sélectionné » (354 × 42 px, deux options de 171 × 34 px). Les variantes existantes sont conservées. Mettre à jour la liste des variantes (chapitre 12, l. ~797–820, et journal § 6.3).
- Cadre global (standard, inchangé) : rayon 14, fond blanc lié au token `2290:54` à 50 %, sans contour.
- Option sélectionnée : fond indigo (token d'action), texte blanc, rayon 10. Option inactive : fond #EAEAFF, texte sombre, rayon 10, sans contour.
- Typographie des libellés : style « KODJO / Section title » (Inter Semi Bold 16, interligne 20) pour tous les contrôles segmentés (catalogues, calendrier Jour / Semaine / Mois, Suivi, Mode, Mode d'exécution, Statut des séances). Exceptions conservées : « Changement de côté » (13 px, libellés sur deux lignes) et « Ordre des côtés » (titre 14 px et sous-titre 11 px), dont les hauteurs d'option ne permettent pas le 16 px.
- Piège connu à noter : l'opacité de 50 % du cadre global est portée par une surcharge d'instance ; la lier à un token fait retomber l'opacité à 100 %, à rétablir à chaque fois.
