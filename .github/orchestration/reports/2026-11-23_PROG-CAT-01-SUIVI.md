# Mission PROG-CAT-01-SUIVI — état des branches et des points ouverts après l'intégration des programmes

**Date :** 23/11/2026. **Type :** investigation, sans modification applicative.

## Identifiant et objectif

PROG-CAT-01-SUIVI. Question de Hermann : « Je suis perdu entre les différentes branches de modification et ce qui est ou pas fusionné », puis « la planification et la gestion des programmes sont terminées par une autre session. Est-ce que les 3 points sont toujours d'actualité ? »

Les trois points sont ceux proposés à la fin de PROG-CAT-01 :
- la renumérotation des décisions ;
- les 13 points À CLARIFIER ;
- le push de la branche.

## Branche et commit de départ

`feat/programmes-catalogue-20261121`, au commit `3cce3a39`. Le worktree `C:\Dev\KODJO-PROG-CAT-01` était propre.

## Périmètre

- **Demandé :** situer les branches, et dire si les trois points sont encore d'actualité.
- **Traité :**
  - lecture de git, après `git fetch` ;
  - lecture des PR, par `gh pr list` ;
  - lecture des rapports `2026-11-23_INTEG-PROG-2311.md` et `2026-11-23_RECETTE-PROG-2311.md` de `origin/feat/plan-20261121` ;
  - lecture des registres des branches documentaires.
- **Non lu :** le cahier de recette des programmes de Hermann.

## Constats

### Branches au 23/11/2026

- **`origin/main` :** contient la spécification des programmes, par la PR #447 (D-543 à D-552), fusionnée le 20/11.
- **`origin/integration/bmad-planification-20261120` :** branche de l'iPhone.
- **`feat/plan-20261121` (PR #450, ouverte vers la branche d'intégration) :**
  - elle contient tout PROG-CAT-01 : `git merge-base --is-ancestor 3cce3a39 origin/feat/plan-20261121` réussit ;
  - fusion `6746cb07`, avec la migration 035 renumérotée 038 ;
  - puis RECETTE-PROG-2311, lots 1 à 4.
- **`docs/agenda-seances-journal-filtre-20261121` (PR #448) :** décisions D-553 à D-569 de la planification, du calendrier et des programmes.
- **`docs/planification-grille-creneaux` :** commit `c489b91d`, qui renumérote les décisions Programmes D-543 à D-545 en D-560 à D-562.

### Point 3 — push de la branche PROG-CAT-01 : sans objet

Le code est déjà intégré dans `feat/plan-20261121`. La branche locale et le worktree ne servent plus.

### Point 1 — numéros de décision : toujours ouvert, et élargi

- Les sept décisions du 21/11 de PROG-CAT-01 ne figurent dans aucun registre :
  - modèle grisé ;
  - Dupliquer sans dates ni routines ;
  - « + Planifier une séance » ;
  - « N planifications · N séances » ;
  - « Garder les routines dans le calendrier » ;
  - « Effacer mes relevés » grisé ;
  - planification bornée par la période.
- Elles n'existent que dans `_bmad-output/prog-cat-01/integration-documentaire-main.patch`, sous les numéros D-553 à D-559. Ces numéros sont déjà pris par la PR #448 avec d'autres sens.
- **Collision constatée entre deux autres branches :**
  - sur `docs/planification-grille-creneaux` (`c489b91d`), D-560 à D-562 désignent la période, les routines et le rattachement d'un programme ;
  - sur `docs/agenda-seances-journal-filtre-20261121`, ces mêmes numéros désignent le marqueur « hors routine », la bande du Plan et l'arrivée dans le calendrier.
- Le plus grand numéro observé est D-569.
- **Recommandation :** renuméroter une seule fois, lors de l'intégration documentaire dans `main`, après fusion des branches de documentation. Une renumérotation faite maintenant serait périmée par les sessions en cours.

### Point 2 — les 13 points À CLARIFIER : en partie traités

Ce classement repose sur les rapports de l'autre session, pas sur le cahier de recette.

| N° | Sujet | État |
|---|---|---|
| 4 | La croix de la modale | Traité. La croix annule tout. Exception : une routine ouverte en modification reste enregistrée. |
| 5 | Dates d'un nouveau programme | Remplacé par D-563 : un seul calendrier natif `UICalendarView`, sélection en deux appuis. |
| 6 | « Rattacher une routine existante » | Traité. La modale reprend le filtre des routines, avec sélection multiple. |
| 9 | Accord puis croix | En partie : le consentement passe par une fenêtre centrée (`PainConsentDialog`). Le sort de l'accord après la croix n'est pas établi. |
| 1 | Filtre et Tri du catalogue des programmes | Ouvert. |
| 2 | « semaine 3 sur 13 » | Ouvert. |
| 3 | Message de suppression sans historique | Ouvert. |
| 7 | Écran Compte : Figma contre la spécification | Ouvert. |
| 8 | « Utilisé par N programmes » | Ouvert. |
| 10 | Suppression d'un programme terminé avec historique | Ouvert. |
| 11 | Nouvelles variantes de Confirmation | Ouvert, pour information (hors lot). |
| 12 | Libellé « + Planifier une séance » | Sans objet, réglé par la décision du 21/11. |
| 13 | État vide | Ouvert. |

Le rapport `2026-11-23_INTEG-PROG-2311.md` cite les 13 points comme « non corrigés ». Le rapport `RECETTE-PROG-2311` traite les points 4, 5, 6 et 9.

### Message à transmettre à la session des programmes

> PROG-CAT-01 est intégré dans `feat/plan-20261121`. Deux éléments restent à reprendre de son rapport `2026-11-21_PROG-CAT-01.md` :
> 1. **Les sept décisions du 21/11** (modèle grisé, Dupliquer, « + Planifier une séance », « N planifications · N séances », « Garder les routines », « Effacer mes relevés », planification bornée) ne sont dans aucun registre. Elles n'existent que dans `_bmad-output/prog-cat-01/integration-documentaire-main.patch`, sous D-553 à D-559, numéros déjà pris. Il y a aussi une collision : D-560 à D-562 n'ont pas le même sens sur `docs/planification-grille-creneaux` (`c489b91d`) et sur `docs/agenda-seances-journal-filtre-20261121`. Il faut une renumérotation unique lors de l'intégration documentaire dans `main`.
> 2. **Les points À CLARIFIER restant ouverts :**
>    - 1 : Filtre et Tri des programmes ;
>    - 2 : « semaine N sur M » ;
>    - 3 : message de suppression sans historique ;
>    - 7 : écran Compte ;
>    - 8 : « Utilisé par N programmes », terminés compris ;
>    - 10 : suppression d'un programme terminé avec historique ;
>    - 13 : état vide ;
>    - 9 : vérifier le sort de l'accord après la croix.

## Preuves et tests

- **Commandes :**
  - `git fetch`, `git rev-list`, `git merge-base --is-ancestor`, `git for-each-ref` ;
  - `git grep` des registres sur les branches distantes ;
  - `gh pr list` ;
  - `git show` des deux rapports de `origin/feat/plan-20261121`.
- **Tests :** aucun test applicable, car aucun code n'a été modifié.

## Hypothèses non démontrées

Le classement des points 4, 5, 6 et 9 repose sur les rapports de l'autre session. Le cahier de recette n'a pas été lu, et l'iPhone n'a pas été vérifié.

## Modifications réalisées

Ce rapport seulement.

## Hors périmètre

- Renumérotation, application du patch, et toute modification des branches de l'autre session.
- Suppression de la branche locale et du worktree : demandée par Hermann. Elle n'est faite qu'après conservation de ce rapport sur le dépôt distant, car sinon ce rapport serait perdu.

## Vérifications restant à faire sur l'iPhone

Aucune pour cette mission. Celles des programmes relèvent de RECETTE-PROG-2311.

## Fichiers modifiés

`.github/orchestration/reports/2026-11-23_PROG-CAT-01-SUIVI.md`.

## Commit final et état Git

Voir le commit qui contient ce rapport, sur `feat/programmes-catalogue-20261121`.
