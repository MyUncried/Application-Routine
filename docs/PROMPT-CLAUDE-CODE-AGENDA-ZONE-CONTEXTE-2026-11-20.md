# Claude Code — Agenda : zone de contexte avec la rangée des sept jours (20/11/2026)

Mission : appliquer D-538 (registre, ch07 ; ch13 annoté ; `docs/DSF-AGENDA-PLANNING-2026-11-19.md` § 2, qui remplace l'ancien § 2 et l'ancien § 3), branche `docs/planification-grille-creneaux`, à lire sans la fusionner. Ce lot remplace le point 1 et le point 2 du « Lot 2 » de `PROMPT-CLAUDE-CODE-AGENDA-ONGLETS-2026-11-19.md` (zone de contexte et rangée des jours). Référence Figma : écran « P-Calendrier — Semaine — Carrousel dans la zone de contexte (proposition) » (`12765:24572`). Le Figma définit le rendu ; il ne crée pas de règle métier. Expo v57 : lire la documentation versionnée avant d'écrire du code.

## À faire

1. Bande de contexte 402 × 115 à y = 92 : hauteur inchangée. Deux lignes, la rangée des sept jours est dans la bande.
2. Ligne 1 (centre vertical y = 115) :
   - bouton « Aujourd'hui » à l'extrême gauche : calendrier portant le numéro du jour courant, sans cercle, zone de tap 34 × 34 ; toucher le bouton ramène au jour courant (et à sa semaine) ;
   - « Novembre 2026 » centré sur l'écran (Inter 18 semi-gras), une double flèche de mois de chaque côté à 10 px du libellé ; elles ne se placent pas au-dessus des flèches de semaine ;
   - le libellé « du 16 au 22 » n'est plus affiché.
   - à l'extrême droite de la ligne 1 : l'icône du filtre par routine, traitée par le prompt `PROMPT-CLAUDE-CODE-AGENDA-FILTRE-ROUTINE-2026-11-20.md` (laisser son emplacement libre : zone de tap 34 × 34, bord visible à 16 px du bord droit).
3. Ligne 2 (centre vertical y = 166) : flèche simple de semaine (le bord visible de la précédente est aligné sur le bord visible de l'icône « Aujourd'hui »), sept cartes de jour centrées entre les glyphes des flèches, flèche simple de semaine, bouton « Planifier » 34 × 34 au bord droit (x = 352, y = 149).
4. Cartes de jour : 36 × 46, rayon 10, écart 3 px (largeur totale 270). Jour abrégé (11), numéro (18), un point de 4 px par séance du jour en bas de la carte. Jour sélectionné : plein, violet-bleu opaque, texte blanc. Autres jours : blanc à 30 % d'opacité.
5. Icône « Aujourd'hui » : composant `icon/aujourd'hui` (même calendrier que l'icône « Planifier », trait 1,5, chiffre du jour à la place du « + »). Gris foncé quand le jour sélectionné est le jour courant ; bleu (couleur de « Planifier ») dès que le jour sélectionné est un autre jour. Le chiffre suit la date du jour (la maquette affiche 20).
6. Icône « Planifier » : le « + » est recentré verticalement dans la partie du calendrier sous le bandeau. Mettre à jour l'icône partout où elle est utilisée.
7. Liste sous la bande (premier en-tête de jour à y = 215).

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE : hauteur de la bande (115) et sa position, barre de titre à onglets, carte d'une routine, regroupement par jour, états déployé, actions glissées, suppression, modification ; règles de navigation et de défilement existantes (le jour choisi passe en tête, RM-046) ; comportement des flèches de mois et de semaine.
- CHANGE : disposition de la zone de contexte et de la rangée des jours (dimensions ci-dessus), bouton « Aujourd'hui », libellé de semaine retiré, icône « Planifier » (« + » recentré).
- FORBIDDEN : remplacer une primitive native par une imitation ; modifier la hauteur de la bande ; toucher aux écrans Journal, Vue d'ensemble et catalogues ; promouvoir en règle un comportement non décidé.

## Points À CLARIFIER à ne pas trancher

- Libellé du mois quand la semaine affichée chevauche deux mois : non défini. Signale ce que le code affiche aujourd'hui.
- Changement de semaine ou de mois par balayage : non défini ; flèches uniquement.
- Comportement du changement de mois sur la semaine affichée : proposé = première semaine du mois (déjà au DSF Agenda).

## Tests et recette

- Tests : bouton « Aujourd'hui » (chiffre du jour, ramène au jour courant), état gris sur le jour courant et bleu sur un autre jour, sept cartes avec points par séance, jour sélectionné plein, flèches de mois et de semaine, aucune régression sur les états de la liste.
- À vérifier sur iPhone : rendu des cartes de 36 × 46 (lisibilité du jour et du numéro), alignement des flèches, bascule gris / bleu de l'icône, zone de tap de 34 × 34 de « Aujourd'hui » et de « Planifier », semaine à cheval sur deux mois.

Livraison : classe de synchronisation A (le code rejoint D-538). Rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git.
