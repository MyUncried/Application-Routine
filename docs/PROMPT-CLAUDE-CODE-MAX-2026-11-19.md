# Claude Code — « Max » (À l'échec) : trois cas autorisés, interdit en boucle (19/11/2026)

Mission : appliquer D-531 et RM-270 à RM-272 (`docs/Specifications-fonctionnelles/07` et `10`, branche `docs/planification-grille-creneaux`, à lire sans la fusionner : `git fetch origin`). Lis aussi `docs/AGENTS.md` (Expo v57) et `CLAUDE.md`. Branche dédiée, pas de fusion.

Définition : « Max » est un mouvement sans objectif de répétitions, fait jusqu'à l'échec ; le résultat est un nombre de répétitions, pas un tour.

À faire :
1. **Autorisé** : (a) buy-in de l'AMRAP, fait une fois, répétitions saisies à la clôture du bloc ; (b) AMRAP à un seul mouvement ; (c) cellule « à l'échec » de la Progression (inchangée).
2. **Interdit** : « Max » pour un mouvement d'une boucle AMRAP de plusieurs mouvements. L'option n'est pas proposée dans le tableau pour ces mouvements (le comportement exact d'affichage est à relever dans le code ; ne masque pas les colonnes différemment de l'existant).
3. **Exécution d'un mouvement en Max** : le chronomètre du bloc continue ; l'utilisateur appuie sur Suivant à l'échec ; saisie du nombre de répétitions au clavier numérique. En AMRAP à un seul mouvement, chaque saisie s'ajoute au total, et le total est le score. Dans ce cas : ni « +Tour », ni annonce de tour (D-530 ne s'applique pas), ni compteur de tours.
4. **Sessions existantes** contenant « Max » dans une boucle de plusieurs mouvements : ne supprime aucune donnée et ne tranche pas leur sort ; signale-les et décris ce qui leur arrive aujourd'hui.
5. Cas non couvert : ne tranche pas, signale-le.

Baseline gelée : PRESERVE le buy-in « À l'échec » existant, la cellule « à l'échec » de la Progression, les colonnes grisées par Max (Objectif et Par tour, Charge modifiable), les autres formats, le moteur ; CHANGE la disponibilité de Max, l'exécution d'un mouvement en Max et la saisie des répétitions ; FORBIDDEN réécrire les tests en masse. Tout besoin hors périmètre → `SCOPE_EXPANSION_REQUIRED`.

Tests : Max proposé en buy-in et en AMRAP à un seul mouvement, absent pour un mouvement de boucle à plusieurs mouvements ; saisie des répétitions à l'échec ; additions successives en AMRAP à un seul mouvement avec total comme score ; ni « +Tour » ni annonce de tour dans ce cas ; la cellule « à l'échec » de la Progression inchangée ; session existante avec Max en boucle conservée sans perte. Une suite verte ne remplace pas la validation sur iPhone.

Livraison : classe A (le code rejoint D-531). Rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git. À vérifier sur iPhone : buy-in Max, AMRAP à un seul mouvement avec plusieurs séries, tableau AMRAP à plusieurs mouvements sans Max.
