# Claude Code — Agenda : filtre par routine (20/11/2026)

Mission : appliquer D-539 (registre, ch07 ; ch13 annoté ; `docs/DSF-AGENDA-PLANNING-2026-11-19.md` § 9 et § 2), branche `docs/planification-grille-creneaux`, à lire sans la fusionner. S'appuie sur le lot de la zone de contexte (`PROMPT-CLAUDE-CODE-AGENDA-ZONE-CONTEXTE-2026-11-20.md`, D-538), à appliquer avant ou avec celui-ci. Références Figma : « P-Calendrier — Semaine — Filtre par routine — Choix de la routine (proposition) » et « … — Vue filtrée (proposition) ». Le Figma définit le rendu ; il ne crée pas de règle métier. Expo v57 : lire la documentation versionnée avant d'écrire du code.

## Besoin

Retrouver en un geste tous les créneaux d'une même routine dans l'Agenda, passés et à venir.

## À faire

1. Icône entonnoir (`icon/filtre-routine`, trait 1,5, zone de tap 34 × 34, sans cercle) à l'extrême droite de la ligne 1 de la zone de contexte, symétrique de « Aujourd'hui ». Gris foncé sans filtre, bleu (couleur de « Planifier ») quand un filtre est actif.
2. Un tap ouvre la feuille « Filtrer par routine » : « Annuler » en haut à gauche, pas de bouton de validation. Chaque ligne : nom de la routine, « Spécialité · zones corporelles », nombre de créneaux. Un tap sur une routine applique le filtre et ferme la feuille. Liste : routines ayant au moins un créneau, archivées comprises, ordre alphabétique.
3. Vue filtrée : ligne 1 : « Aujourd'hui » à gauche, pastille « Nom de la routine ✕ » centrée, icône bleue à droite (rouvre la feuille pour changer de routine) ; le ✕ efface le filtre et ramène à la semaine affichée avant le filtre. Ligne 2 : compteur centré « N créneaux · N faits · N à rattraper · N à venir », « Planifier » inchangé. Flèches de mois et de semaine et rangée des sept jours masquées.
4. Compteur : « faits » = créneaux commencés (au moins une séance lancée) ; « à rattraper » = créneaux passés non commencés ; « à venir » = créneaux futurs non commencés ; total = somme.
5. Liste filtrée : tous les créneaux de la routine, toutes périodes, regroupés par jour, ordre chronologique, ouverte sur le premier créneau à venir. « Aujourd'hui » fait défiler jusqu'au jour courant. Cartes, états, couleurs, déploiement, démarrer / rattraper, modification et suppression glissées inchangés, avec les règles D-536 et D-537.

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE : carte d'une routine et ses trois zones (planification à gauche, déploiement au centre, action à droite), états et couleurs des cartes, règles de figement, de modification et de suppression, navigation par semaine et par mois hors filtre, filtre multicritère du Journal et des catalogues.
- CHANGE : zone de contexte de l'Agenda (icône entonnoir, vue filtrée), nouvelle feuille « Filtrer par routine ».
- FORBIDDEN : réutiliser l'icône à trois traits du filtre multicritère pour ce filtre ; ajouter une zone d'action dans la carte ; remplacer une primitive native par une imitation ; promouvoir en règle un comportement non décidé.

## Tests et recette

- Tests : ouverture et fermeture de la feuille (Annuler, tap sur une routine), application et effacement du filtre (retour à la semaine d'avant), compteur (faits, à rattraper, à venir, total) pour une routine avec créneaux commencés, passés non commencés et à venir, liste chronologique ouverte sur le premier créneau à venir, routine archivée présente dans la liste, icône grise puis bleue, modification et suppression d'un créneau depuis la vue filtrée (règles D-536 et D-537), le compteur suit une suppression.
- À vérifier sur iPhone : zone de tap 34 × 34 de l'icône, lisibilité du compteur sur une seule ligne, défilement jusqu'au premier créneau à venir, feuille et pastille avec un nom de routine très long.

Livraison : classe de synchronisation A (le code rejoint D-539). Rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git.
