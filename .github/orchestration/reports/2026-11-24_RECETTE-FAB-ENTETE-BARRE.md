# 2026-11-24 — RECETTE-FAB-ENTETE-BARRE : branche de recette commune

## Mission

- **Demande** de Hermann, en réponse à la proposition du rapport EN-TETE-CERCLE-UNIQUE (« réunir les deux branches dans une branche de recette ») : « Tu peux donc les deux branches ».
- **Objectif** : servir sur le même tunnel Metro le bouton flottant (PR #452) et le cercle blanc de l'en-tête (PR #453).
- **Ajout** : la barre de navigation du bas en lentille (PR #454), demandée dans la même conversation, est réunie elle aussi pour être recettée ensemble.
- **Branche** : `recette/fab-entete-barre-20261124`, créée depuis `origin/feat/bouton-flottant-20261124` `c747a797` (worktree `C:\Dev\KODJO-RECETTE`).

## Réalisé

- Fusion de `origin/fix/en-tete-cercle-blanc-20261124`, puis de `origin/feat/barre-lentille-20261124`.
- **Deux conflits**, tous deux dans le registre (ch. 07) : chaque branche ajoutait sa décision au même endroit. Ils sont résolus en gardant les trois décisions, dans l'ordre D-593, D-594, D-595. Aucun autre conflit.
- Les trois PR restent séparées vers `main` ; cette branche ne sert qu'à la recette et n'est pas destinée à `main`.
- Aucun fichier applicatif n'est modifié en dehors des fusions.

## Tests

- **Types** : `tsc` est propre sur la branche réunie.
- **Suites** : 7 suites, 155 tests réussis, 0 échec :
  - bouton flottant, menu Créer, Composition `recette1` ;
  - barre de navigation ;
  - en-tête (`ScreenShell`, `ExerciseScreen`) ;
  - Catalogue.
- **Suite complète** : non relancée, pour ménager la mémoire du PC.

## À vérifier sur iPhone

- Lignes du lot 9 et suivantes du cahier :
  - bouton flottant (fondu en placement) ;
  - cercle blanc de l'en-tête ;
  - barre en lentille.

## État Git

- **Commits de fusion** : `ed769045` (en-tête) et `c40b3fe4` (barre).
- Le commit de ce rapport et l'état Git figurent dans le message de livraison.

## Mise à jour du 24/11/2026 : corrections de la recette

- **Fusions** :
  - `origin/fix/en-tete-cercle-blanc-20261124` (`5cb145b7`, ombre du cercle) ;
  - `origin/feat/barre-lentille-20261124` (`e1659ea3`, listes du Catalogue sous la barre, cadre à 20 %).
- **Conflits** :
  - **Registre** : D-595 complétée, D-593 et D-594 conservées.
  - **`CatalogueScreen.test.tsx`** : conflit sur tout le fichier, venu des fins de ligne. J'ai gardé la version de recette (bouton flottant) et réappliqué le diff de la branche barre (`git apply --ignore-whitespace`).
- **Tests** :
  - `tsc` est propre ;
  - 6 suites, 100 tests réussis : Catalogue, barre, en-tête, bouton flottant, menu Créer, Composition `recette1`.
