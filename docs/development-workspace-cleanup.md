# Règle de nettoyage des espaces de développement KODJO

## Principe
Un seul dépôt permanent : `C:\Dev\Application-routine`. Les branches sont privilégiées pour les travaux successifs. Un clone ou un worktree distinct n'est créé que si l'isolation de travaux parallèles le justifie. Ne pas recopier le dépôt pour chaque lot, recette ou revue.

## Cycle de vie
1. À la création d'un espace temporaire, nommer son objectif, sa branche et son propriétaire.
2. Après livraison, confirmer la fusion dans `origin/main` et la clôture des tâches pertinentes. Ne pas assimiler une PR ouverte ou un simple push à une fusion.
3. Contrôler les changements non commités, fichiers non suivis et ignorés, commits locaux et données de recette. Archiver seulement les éléments uniques nécessaires ; ne pas recopier l'ensemble du dépôt.
4. Lancer le contrôle du script `scripts/kodjo/cleanup-workspace.ps1` **sans** `-Remove`. La suppression automatique est autorisée uniquement si le commit de la cible est ancêtre de `origin/main`, l'espace est propre et aucun fichier ignoré n'est présent.
5. Si la branche a été fusionnée par squash, si des fichiers ignorés sont présents, ou si la cible est un clone indépendant, garder le dossier et faire une qualification spécifique ; ne pas forcer une suppression pour passer le contrôle.
6. Après vérification, relancer avec `-Remove` pour ce seul worktree ; confirmer la disparition physique et l'absence de référence worktree. Les branches Git et archives demeurent indépendantes de cette suppression.

## Utilisation Windows PowerShell

Diagnostic :

```powershell
powershell -NoProfile -File C:\Dev\Application-routine\scripts\kodjo\cleanup-workspace.ps1 -Path "C:\Dev\Application-routine-travail-temporaire"
```

Suppression d'un worktree explicitement qualifié :

```powershell
powershell -NoProfile -File C:\Dev\Application-routine\scripts\kodjo\cleanup-workspace.ps1 -Path "C:\Dev\Application-routine-travail-temporaire" -Remove
```

## Garde-fous
- Jamais de suppression de `main`, du dépôt permanent, d'un environnement PRE encore actif ou de clés/secrets.
- Pas d'utilisation automatique de `--force`, `git reset --hard` ou `git clean -fdx`.
- Ni suppression de clones indépendants, ni effacement des caches, preuves ou `node_modules` par ce script.
- Les dossiers déplacés en quarantaine nécessitent un traitement manuel distinct : déplacer un worktree peut invalider ses métadonnées Git.
- Le nettoyage ne doit pas bloquer le développement : une exception justifiée peut laisser un dossier provisoirement en place.
- Les archives documentaires et sauvegardes doivent rester traçables, et leur intégrité vérifiée avant destruction de l'original.

La suppression est une opération locale sur le poste qui exécute le script. La présence de ce fichier dans GitHub ne déclenche aucune suppression automatique sur le PC.
