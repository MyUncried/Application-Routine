# Claude Code — « Max » (À l'échec) : trois cas autorisés, interdit en boucle (19/11/2026)

Mission : appliquer D-531 et RM-270 à RM-272 (`docs/Specifications-fonctionnelles/07` et `10`, branche `docs/planification-grille-creneaux`, à lire sans la fusionner : `git fetch origin`). Lis aussi `docs/AGENTS.md` (Expo v57) et `CLAUDE.md`. Branche dédiée, pas de fusion.

Définition : « Max » est un mouvement sans objectif de répétitions, fait jusqu'à l'échec ; le résultat est un nombre de répétitions, pas un tour.

À faire :
1. **Autorisé** : (a) buy-in de l'AMRAP, fait une fois sans chrono propre : Suivant à l'échec, enchaînement avec le bloc, répétitions saisies à la clôture du bloc (règle existante, ne la change pas) ; (b) AMRAP à un seul mouvement ; (c) cellule « à l'échec » de la Progression.
2. **Interdit** : « Max » pour un mouvement d'une boucle de plusieurs mouvements, en AMRAP et en For time. L'option est **grisée avec un message court**, comme l'option Durée déjà désactivée dans le tableau AMRAP. Pas de Max en buy-out.
3. **AMRAP à un seul mouvement en Max** : le chronomètre du bloc continue ; à chaque échec, Suivant puis saisie de la série au clavier numérique ; les séries s'additionnent ; le score cumulé s'affiche en direct dans le coin bas droite (CE-UI-14) ; le total est le score. Ni « +Tour », ni annonce de tour (D-530 ne s'applique pas), ni compteur de tours.
4. **Progression, cellule « à l'échec »** : vérifie le déroulé actuel. Attendu : Suivant à l'échec, saisie des répétitions, puis chrono de repos ou fin de l'exercice. Si l'application fait autre chose, corrige-le ; ne limite pas la cellule à la dernière série.
5. **Sessions existantes** contenant « Max » dans une boucle de plusieurs mouvements : ne supprime aucune donnée et ne tranche pas leur sort ; signale-les et décris ce qui leur arrive aujourd'hui.
6. Cas non couvert : ne tranche pas, signale-le.

Baseline gelée : PRESERVE le buy-in « À l'échec » existant, la cellule « à l'échec » de la Progression, les colonnes grisées par Max (Objectif et Par tour, Charge modifiable), les autres formats, le moteur ; CHANGE la disponibilité de Max, l'exécution d'un mouvement en Max et la saisie des répétitions ; FORBIDDEN réécrire les tests en masse. Tout besoin hors périmètre → `SCOPE_EXPANSION_REQUIRED`.

Tests : Max proposé en buy-in et en AMRAP à un seul mouvement, grisé avec message pour un mouvement de boucle à plusieurs mouvements (AMRAP et For time), absent en buy-out ; saisie des répétitions à l'échec ; additions successives en AMRAP à un seul mouvement avec score cumulé affiché en bas à droite ; déroulé de la cellule « à l'échec » de la Progression (saisie puis repos) ; ni « +Tour » ni annonce de tour dans ce cas ;  session existante avec Max en boucle conservée sans perte. Une suite verte ne remplace pas la validation sur iPhone.

Livraison : classe A (le code rejoint D-531). Rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git. À vérifier sur iPhone : buy-in Max, AMRAP à un seul mouvement avec plusieurs séries, tableau AMRAP à plusieurs mouvements sans Max.
