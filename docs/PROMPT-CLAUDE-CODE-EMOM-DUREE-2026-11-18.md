# Claude Code — cahier de recette : écran d'exécution EMOM en durée (18/11/2026)

Mission : corriger l'écran d'exécution de l'EMOM en durée relevé en recette. Claude Code a reproduit le double anneau du For time ; il n'est pas voulu. Sources à lire d'abord : décision D-528, règles RM-265 à RM-268 (chapitre 10) et contrat CE-UI-13 (chapitre 13) du patch `planification-grille-docs.patch`, `docs/AGENTS.md` (Expo v57) et `CLAUDE.md`. Recopie D-528, RM-265 à RM-268 et CE-UI-13 mot pour mot dans les chapitres 07, 10 et 13. Les décisions EMOM D-517 et D-518 (PR #431) ne sont pas modifiées. Branche dédiée, pas de fusion.

## Baseline gelée
PRESERVE : le For time (son double anneau et son centre restent identiques) ; les autres formats ; la saisie et le récapitulatif de l'EMOM ; le moteur d'exécution hors EMOM en durée.
CHANGE : l'écran d'exécution de l'EMOM en durée uniquement.
FORBIDDEN : modifier le composant du For time autrement que pour le partager ; réécrire les tests en masse ; remplacer une primitive native. Tout besoin hors périmètre → `SCOPE_EXPANSION_REQUIRED`.

## À réaliser
1. Retirer le double anneau : un seul anneau, celui des 60 secondes du tour, en avancement continu, qui ne s'arrête jamais.
2. Réutiliser le centre du For time (position, couleur, flash, double chrono, appui) en le partageant, sans le dupliquer.
3. Appui au centre en Effort : pause / reprise du compteur d'effort cumulé seul ; l'anneau de la minute continue ; la durée totale de l'EMOM n'est pas faussée.
4. Chiffre central : effort cumulé sur objectif (ex. 00:25 / 00:40) ; temps restant avant la minute suivante en secondaire.
5. Effort borné par l'objectif : à l'atteinte, l'anneau et le fond passent seuls en mode Repos jusqu'à la fin de la minute ; appui au centre sans effet en Repos.
6. Fin de minute avec effort inférieur à l'objectif : la minute se ferme, la suivante démarre, tour enregistré en effort partiel (cumul réalisé sur objectif).
7. Sons : trois dernières secondes de la minute selon l'anneau ; signal au passage en Repos.

## Tests et preuves
Tests ciblés : un seul anneau rendu ; pause répétée sans dérive de la durée totale ; bascule en Repos à l'objectif ; appui sans effet en Repos ; effort partiel enregistré ; composant du centre partagé avec le For time. Une suite verte ne remplace pas la validation sur iPhone.

## Livraison
Synchronisation code/documentation classe A. Rapport de mission dans `.github/orchestration/reports/` (PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git). À vérifier sur iPhone : flash et couleurs identiques au For time, pause répétée, bascule en Repos, bips.
