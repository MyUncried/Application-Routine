# Claude Code — Calendrier : troisième onglet « Plan » (20/11/2026)

Mission : appliquer D-541 (registre, ch07 ; D-532 annoté ; `docs/DSF-PLAN-2026-11-20.md` ; `docs/DSF-BARRE-TITRE-ONGLETS-2026-11-19.md`), branche `docs/planification-grille-creneaux`, à lire sans la fusionner. S'appuie sur la zone de contexte de l'Agenda (D-538) et sur le cycle de vie des créneaux (D-540). Référence Figma : « P-Calendrier — Vue d'ensemble — Routines et jours (proposition) » (l'écran garde l'ancien nom de l'onglet). Le Figma définit le rendu ; il ne crée pas de règle métier. Expo v57 : lire la documentation versionnée avant d'écrire du code.

## À faire

1. Renommer le troisième onglet du Calendrier « Vue d'ensemble » → « Plan » (libellé centré sur le même axe, forme arrondie de l'onglet actif inchangée).
2. Écran « Plan » : grille d'une semaine, une ligne par routine, une colonne par jour, dans le centre de l'écran. Zone de contexte : ligne 1 comme l'Agenda (« Aujourd'hui », mois en doubles flèches, filtre par routine) ; ligne 2 : flèche de semaine, bilan de la semaine centré (« Semaine : N complétées · N partielles · N manquées », les manquées incluent les expirées), flèche de semaine, « Planifier » 34 × 34. Libellé du mois et changement de mois : règles de l'Agenda (D-538).
3. Grille : en-tête de dates (jour Inter 10, numéro Inter 13 gras, jour courant sur fond bleu avec sa colonne teintée) ; colonne des noms (88 de large, Inter Semi Bold 12, deux lignes au plus) ; sept colonnes de 42 jusqu'au bord droit ; lignes de 52 ; case 38 × 30 rayon 8 avec la teinte de l'état et l'heure (« 8h00 », Inter Semi Bold 11) : vert complétée, orange partielle, rouge manquée ou expirée, gris à venir ou arrêtée (teintes de l'Agenda) ; légende des quatre états sous la grille.
4. Routines affichées : celles qui ont au moins un créneau dans la semaine, ordre alphabétique. Le filtre par routine de l'Agenda s'applique aussi au Plan (même état de filtre). Navigation : flèches de semaine et balayage horizontal du centre ; « Aujourd'hui » revient à la semaine courante. Toucher une case ouvre l'Agenda sur ce jour.
5. Pas de vue quinze jours ni mois.

## À CLARIFIER à ne pas trancher

- Routine avec plusieurs créneaux le même jour : règle d'affichage de la case non définie. Affiche le premier créneau et signale-le.

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE : onglets Journal et Agenda, zone de contexte de l'Agenda, états et règles des créneaux (D-536, D-537, D-540), filtre par routine, barre de navigation.
- CHANGE : libellé du troisième onglet, nouvel écran Plan.
- FORBIDDEN : vue mois ou quinze jours ; défilement horizontal des jours ; remplacer une primitive native par une imitation ; promouvoir en règle un comportement non décidé.

## Tests et recette

- Tests : libellé de l'onglet ; une ligne par routine ayant un créneau dans la semaine, ordre alphabétique ; teinte et heure de chaque état (y compris expiré) ; bilan de la semaine ; flèches et balayage de semaine ; « Aujourd'hui » ; filtre par routine appliqué ; toucher une case ouvre l'Agenda sur le bon jour.
- À vérifier sur iPhone : lisibilité de l'heure et des noms (taille 12), largeur de la grille jusqu'au bord droit, conflit du balayage horizontal avec le geste de retour.

Livraison : classe de synchronisation A (le code rejoint D-541). Rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git.
