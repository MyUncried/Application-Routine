# Claude Code — Agenda : filtre par routine (20/11/2026)

Mission : appliquer D-539 (registre, ch07 ; ch13 annoté ; `docs/DSF-AGENDA-PLANNING-2026-11-19.md` § 9 et § 2), branche `docs/planification-grille-creneaux`, à lire sans la fusionner. S'appuie sur le lot de la zone de contexte (`PROMPT-CLAUDE-CODE-AGENDA-ZONE-CONTEXTE-2026-11-20.md`, D-538), à appliquer avant ou avec celui-ci. Références Figma : « P-Calendrier — Semaine — Filtre par routine — Choix de la routine (proposition) » et « … — Vue filtrée (proposition) ». Le Figma définit le rendu ; il ne crée pas de règle métier. Expo v57 : lire la documentation versionnée avant d'écrire du code.

## Besoin

Retrouver en un geste tous les créneaux d'une même routine dans l'Agenda, passés et à venir.

## À faire

1. Icône entonnoir (`icon/filtre-routine`, trait 1,5, zone de tap 34 × 34, sans cercle) à l'extrême droite de la ligne 1 de la zone de contexte, symétrique de « Aujourd'hui ». Gris foncé sans filtre, bleu (couleur de « Planifier ») quand un filtre est actif.
2. Un tap ouvre la modale « Filtrer par routine », version simplifiée de l'écran Journal : en-tête avec le bouton de fermeture (✕) en haut à gauche et le titre ; une carte par routine au format de la carte du Journal, réduite à la ligne 1 (nom) et à la ligne 3 (« X à venir, jusqu'au jj/mm/aaaa »), avec le cadre de gauche et un sélecteur à cocher à droite (pas de chevron, pas de ligne 2) ; sélection multiple ; en bas, une barre de séparation et le bouton « Filtrer N routines » (« Filtrer 1 routine » au singulier), désactivé tant qu'aucune routine n'est cochée. Routines ayant au moins un créneau, archivées comprises, ordre alphabétique. À la réouverture, les routines du filtre en cours sont cochées. Réutiliser le composant carte du Journal, pas une nouvelle carte.
3. Vue filtrée : ligne 1 : « Aujourd'hui » à gauche, pastille centrée « Nom de la routine ✕ » (une routine) ou « N routines ✕ » (plusieurs), icône bleue à droite (rouvre la modale) ; le ✕ efface le filtre et ramène à la semaine affichée avant le filtre. Ligne 2 : compteur centré « N créneaux · N faits · N à rattraper · N à venir », « Planifier » inchangé. Flèches de mois et de semaine et rangée des sept jours masquées.
4. Compteur (toutes routines du filtre confondues) : « faits » = créneaux commencés (au moins une séance lancée) ; « à rattraper » = créneaux passés non commencés ; « à venir » = créneaux futurs non commencés ; total = somme.
5. Liste filtrée : tous les créneaux des routines choisies, toutes périodes, regroupés par jour, ordre chronologique, ouverte sur le premier créneau à venir. « Aujourd'hui » fait défiler jusqu'au jour courant. Cartes, états, couleurs, déploiement, démarrer / rattraper, modification et suppression glissées inchangés, avec les règles D-536 et D-537.

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE : carte d'une routine et ses trois zones (planification à gauche, déploiement au centre, action à droite), états et couleurs des cartes, règles de figement, de modification et de suppression, navigation par semaine et par mois hors filtre, filtre multicritère du Journal et des catalogues.
- CHANGE : zone de contexte de l'Agenda (icône entonnoir, vue filtrée), nouvelle modale « Filtrer par routine ».
- FORBIDDEN : réutiliser l'icône à trois traits du filtre multicritère pour ce filtre ; ajouter une zone d'action dans la carte de l'Agenda ; remplacer une primitive native par une imitation ; promouvoir en règle un comportement non décidé.

## Tests et recette

- Tests : ouverture et fermeture de la modale (✕), sélection multiple, bouton « Filtrer N routines » (libellé, singulier, désactivé sans sélection), cases cochées à la réouverture, application et effacement du filtre (retour à la semaine d'avant), pastille « N routines », compteur (faits, à rattraper, à venir, total) pour une routine avec créneaux commencés, passés non commencés et à venir, liste chronologique ouverte sur le premier créneau à venir, routine archivée présente dans la liste, icône grise puis bleue, modification et suppression d'un créneau depuis la vue filtrée (règles D-536 et D-537), le compteur suit une suppression.
- À vérifier sur iPhone : zone de tap 34 × 34 de l'icône, lisibilité du compteur sur une seule ligne, défilement jusqu'au premier créneau à venir, modale avec beaucoup de routines (défilement, bouton fixe en bas) et pastille avec un nom de routine très long.

Livraison : classe de synchronisation A (le code rejoint D-539). Rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git.
