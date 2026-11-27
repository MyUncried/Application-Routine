# Claude Code — quatre coins du chronomètre (18/11/2026)

> **PROMPT HISTORIQUE — CONSERVÉ POUR TRAÇABILITÉ.** Le complément D-529 du 26/11/2026 remplace la position initiale du compte à rebours de Série en Durée : **bas droite**, charge **bas gauche**. Pour développer la règle à jour, utiliser exclusivement [le prompt du 26/11/2026](PROMPT-CLAUDE-CODE-COINS-DYNAMIQUES-2026-11-26.md) et CE-UI-14 actualisé ; ne pas appliquer les anciennes indications de coin contradictoires.

Mission : appliquer la décision D-529 et le contrat CE-UI-14 (`docs/Specifications-fonctionnelles/07` et `13`, branche `docs/planification-grille-creneaux`, à lire sans la fusionner) à l'écran d'exécution. Lis aussi `docs/AGENTS.md` (Expo v57) et `CLAUDE.md`. Branche dédiée, pas de fusion.

Règle : une information a un coin fixe, identique dans tous les formats ; un coin vide reste vide. Aucune information ne change de coin d'un format à l'autre.
- Haut gauche : objectif (durée ou répétitions ; durée de la pause ou de la récupération ; durée de la phase Tabata / 30-30 ; objectif du rang en Death by).
- Haut droite : limite de temps (temps max For time, temps limite du bloc AMRAP, intervalle EMOM et Death by).
- Bas gauche : charge ; pendant une pause, charge de la série suivante.
- Bas droite : nombre de mouvements pendant l'effort (exercice en durée avec phases, EMOM en durée) ; compte à rebours du repos en EMOM en répétitions uniquement.

À faire :
1. Relève où chaque information est affichée aujourd'hui, par format, et liste les écarts avec le tableau de CE-UI-14.
2. Centralise l'affectation dans une seule table (scénario → coin → information), source unique de l'écran. Le code ne place plus d'information en dehors d'elle.
3. Corrige les écarts. Ne pas afficher le rang de la fenêtre ni l'incrément. En EMOM en durée, le repos reste en secondaire sous le chiffre central (D-528) : ne pas le répéter en bas à droite.
4. Les tours acquis (For time, AMRAP) s'affichent dans le bouton « +Tour » (« +Tour · 3 », nombre de tours déjà acquis). Série, tour et côté restent sur la ligne de contexte.
5. Cas non couvert par le tableau : ne tranche pas, signale-le.

Baseline gelée : PRESERVE les écrans hors exécution, le moteur, le comportement des boutons, l'anneau et le centre ; CHANGE uniquement le placement des informations dans les coins et le libellé du bouton « +Tour » ; FORBIDDEN réécrire les tests en masse. Tout besoin hors périmètre → `SCOPE_EXPANSION_REQUIRED`.

Tests : un test par scénario du tableau vérifie la table d'affectation ; un test vérifie qu'une information garde son coin d'un format à l'autre et qu'un coin vide reste vide. Une suite verte ne remplace pas la validation sur iPhone.

Livraison : classe de synchronisation A (le code rejoint D-529). Rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git. À vérifier sur iPhone : un exemple par format, dont EMOM en répétitions avec charge au repos (quatre coins occupés).
