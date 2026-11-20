# Claude Code — Agenda : filtre par routine (20/11/2026)

Mission : appliquer D-539 (registre, ch07 ; ch13 annoté ; `docs/DSF-AGENDA-PLANNING-2026-11-19.md` § 9 et § 2), branche `docs/planification-grille-creneaux`, à lire sans la fusionner. S'appuie sur le lot de la zone de contexte (`PROMPT-CLAUDE-CODE-AGENDA-ZONE-CONTEXTE-2026-11-20.md`, D-538), à appliquer avant ou avec celui-ci. Références Figma : « P-Calendrier — Semaine — Filtre par routine — Choix de la routine (proposition) » et « … — Vue filtrée (proposition) ». Le Figma définit le rendu ; il ne crée pas de règle métier. Expo v57 : lire la documentation versionnée avant d'écrire du code.

## Besoin

N'afficher dans l'Agenda que les créneaux d'une ou de plusieurs routines.

## À faire

1. Icône entonnoir (`icon/filtre-routine`, trait 1,5, zone de tap 34 × 34, sans cercle) à l'extrême droite de la ligne 1 de la zone de contexte, symétrique de « Aujourd'hui ». Sans filtre : contour gris foncé. Filtre actif : silhouette pleine, bleue (couleur de « Planifier »), variante du composant `icon/filtre-routine`.
2. Un tap ouvre la modale « Filtrer par routine », version simplifiée de l'écran Journal : en-tête avec le bouton de fermeture (✕) en haut à gauche et le titre ; le fond de la zone de contexte du Journal commence tout en haut de la modale (pas de zone blanche), l'en-tête est posé dessus, puis champ de recherche (largeur disponible), bouton de filtre et bouton de tri alignés à droite (marge de 16 px), sans compteurs et sans « Planifier » (même fonctionnement que sur le Journal : réutiliser les composants et la logique du Journal) ; une carte par routine au format de la carte du Journal, réduite à la ligne 1 (nom) et à la ligne 3 (« X à venir, jusqu'au jj/mm/aaaa »), avec le cadre de gauche et un sélecteur à cocher à droite (pas de chevron, pas de ligne 2) ; sélection multiple ; en bas, le bouton « Filtrer N routines » (« Filtrer 1 routine » au singulier). Routines ayant au moins un créneau, archivées comprises, ordre alphabétique. À la réouverture, les routines du filtre en cours sont cochées. Réutiliser le composant carte du Journal, pas une nouvelle carte.
3. Bouton de la modale : « Filtrer N routines » (« Filtrer 1 routine » au singulier) ; quand aucune routine n'est cochée, « Afficher toutes les routines », qui retire le filtre.
4. Vue filtrée : la zone de contexte est inchangée (« Aujourd'hui », mois, semaine, sept jours, « Planifier ») ; seule l'icône change. La liste n'affiche que les créneaux des routines choisies pour la semaine affichée ; un jour sans créneau de ces routines n'apparaît pas ; une semaine sans créneau affiche l'état vide existant. Les points des cartes de jour ne comptent que les séances des routines du filtre. Le filtre reste actif en changeant de semaine ou de mois et avec « Aujourd'hui », et tant qu'il n'est pas retiré.
5. Cartes, états, couleurs, déploiement, démarrer / rattraper, modification et suppression glissées inchangés, avec les règles D-536 et D-537.

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE : carte d'une routine et ses trois zones (planification à gauche, déploiement au centre, action à droite), états et couleurs des cartes, règles de figement, de modification et de suppression, navigation par semaine et par mois hors filtre, filtre multicritère du Journal et des catalogues.
- CHANGE : zone de contexte de l'Agenda (icône entonnoir, vue filtrée), nouvelle modale « Filtrer par routine ».
- FORBIDDEN : réutiliser l'icône à trois traits du filtre multicritère pour ce filtre ; ajouter une zone d'action dans la carte de l'Agenda ; remplacer une primitive native par une imitation ; promouvoir en règle un comportement non décidé.

## Tests et recette

- Tests : ouverture et fermeture de la modale (✕), sélection multiple, libellés du bouton (pluriel, singulier, « Afficher toutes les routines » sans sélection), cases cochées à la réouverture, filtre appliqué à la liste de la semaine et aux points des cartes de jour, filtre conservé au changement de semaine et de mois et avec « Aujourd'hui », semaine sans créneau (état vide), icône contour puis pleine bleue, modification et suppression d'un créneau depuis la vue filtrée (règles D-536 et D-537).
- À vérifier sur iPhone : zone de tap 34 × 34 de l'icône, lisibilité de l'icône pleine, modale avec beaucoup de routines (défilement, bouton fixe en bas), routine archivée dans la liste.

Livraison : classe de synchronisation A (le code rejoint D-539). Rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git.
