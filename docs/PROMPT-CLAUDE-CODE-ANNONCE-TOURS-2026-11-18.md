# Claude Code — annonce des tours en AMRAP et en For time (18/11/2026)

Mission : appliquer D-530 et RM-269 (`docs/Specifications-fonctionnelles/07` et `10`, branche `docs/planification-grille-creneaux`, à lire sans la fusionner). Lis aussi `docs/AGENTS.md` (Expo v57) et `CLAUDE.md`. Branche dédiée, pas de fusion.

À faire :
1. **Annonce à chaque début de tour**, y compris le premier : « Premier tour, 21 répétitions », puis « Deuxième tour, 15 répétitions »… Ordinal français, puis l'objectif de répétitions du tour qui démarre ; « 1 répétition » au singulier. Au départ du chrono pour le premier tour, à l'appui sur « +Tour » pour les suivants.
2. **Un seul signal par appui** : si l'interrupteur « Annonce des tours » du Profil est activé (par défaut), annonce seule, sans bip ; sinon, bip seul selon le réglage Son et Vibration existant. Jamais les deux.
3. **Appui répété** : un seul tour compté (D-19), un seul signal.
4. **Dernier appui du For time** : pas d'annonce de tour ; l'annonce de fin habituelle s'applique. En AMRAP, la séance se termine au temps limite du bloc.
5. **Profil** : ajouter l'interrupteur « Annonce des tours » aux six annonces existantes, activé par défaut, indépendant des autres (RM-087).
6. Cas où l'objectif du tour n'est pas un nombre unique (par exemple AMRAP à plusieurs mouvements) : ne tranche pas, signale-le.

Baseline gelée : PRESERVE les six annonces existantes, le comptage des tours et le bouton « +Tour », les autres formats, le moteur ; CHANGE l'annonce ou le bip au début de tour et l'interrupteur du Profil ; FORBIDDEN réécrire les tests en masse. Tout besoin hors périmètre → `SCOPE_EXPANSION_REQUIRED`.

Tests : annonce avec interrupteur activé et pas de bip ; bip avec interrupteur désactivé et pas d'annonce ; appui répété, un seul signal ; singulier « 1 répétition » ; premier tour annoncé au départ ; dernier appui du For time sans annonce de tour ; interrupteur du Profil par défaut activé. Une suite verte ne remplace pas la validation sur iPhone.

Livraison : classe A (le code rejoint D-530). Rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git. À vérifier sur iPhone : voix française des ordinaux, enchaînement avec les autres annonces, chevauchement avec la musique.
