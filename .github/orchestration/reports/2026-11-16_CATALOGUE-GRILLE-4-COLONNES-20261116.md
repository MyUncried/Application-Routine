# CATALOGUE-GRILLE-4-COLONNES-20261116 — rapport d'état (mission arrêtée avant tout code)

## Identifiant et objectif

- **Mission :** grille du catalogue des Mouvements à quatre colonnes (classe B, décisions de Hermann du 16/11/2026).
- **Objectif demandé :** passer la grille de photos du catalogue des Mouvements à quatre colonnes :
  - cartes de 86,5 × 112 pt, photo de 70 pt, nom en 10,5 pt Regular sur deux lignes au plus ;
  - ni pastille de niveau ni description ;
  - une seule feuille sous une pile repliée ;
  - badge « New » en bas à droite, réduit à 62 % ;
  - déploiement de la pile et bascule DSF conservés ;
  - chapitres 09 et 12 mis à jour.

## Branche et commit de départ

- **Branche :** `catalogue/grille-4-colonnes-20261116`, créée depuis `origin/main` = `d108ad2c`.
- **Worktree :** `C:\Dev\KODJO-GRILLE4`. Il est séparé de `C:\Dev\PRE10-SON` (`pre11-formats`, 119 modifications en attente de validation, non touchées).

## Périmètre

- **Demandé :** la grille de photos du catalogue des Mouvements uniquement. Liste, Séances, Programmes et fiche du mouvement : PRESERVE.
- **Réellement traité :** état des lieux des sources et du code. Aucun fichier applicatif modifié.

## Constats

1. **Sources présentes sur `main` :**
   - ch07, « Catalogue des Mouvements — grille à quatre colonnes (16/11/2026) » (`a2bb69b5`) ;
   - ch13, CE-MVT-03, rubriques Bascule (composant DSF, `d108ad2c`), Carte et Pile (`a2bb69b5`).
2. **La grille n'existe pas dans le code.** Recherche dans `src` sur `main` et sur toutes les branches locales et distantes : aucune présentation en grille du catalogue des Mouvements, aucune bascule liste / grille, aucune préférence mémorisée de présentation, aucun composant de bascule DSF en code. Termes cherchés : grille, grid, bascule liste, `numColumns`, `123,33`, `viewMode`, `catalogueLayout` (seul résultat : une transition d'animation de la liste), `GridCard`.
   - Le catalogue des Mouvements est rendu uniquement en liste par `src/features/activities/MovementCatalogueList.tsx` (2 042 lignes), monté par `src/features/sessions/CatalogueScreen.tsx`.
   - La seule mention de 123,33 pt dans le code concerne la navigation du Catalogue (`CatalogueNavigation.tsx`), sans rapport.
   - La grille à trois colonnes du 16/11 (`6663a2ce`, puis `a2bb69b5`) n'a été écrite que dans la documentation et dans Figma.
3. **Prémisses de la mission sans existant dans le code :**
   - point 5, « comportement existant conservé » pour le déploiement de la pile dans la grille ;
   - point 6, « mémorisation inchangée » de la bascule ;
   - contrainte « réutiliser les primitives existantes (… bascule DSF) » : la bascule n'existe que dans Figma (« DSF / Controls / Bascule liste-grille »).
4. **Conséquence :** la mission ne se réduit pas à la mise en page de la grille. Elle demande de créer toute la présentation en grille :
   - bascule à poser dans la ligne des compteurs ;
   - mémorisation du choix (stockage à choisir) ;
   - grille ;
   - pile repliée et déployée dans le flux, avec le liseré bleu ;
   - branchement des appuis vers la fiche.
   Cela dépasse le périmètre borné par la mission (« ne rien réécrire d'autre que la mise en page de la grille »). Les règles du protocole sur l'extension de périmètre (`SCOPE_EXPANSION_REQUIRED`) et sur la demande de changement (`CHANGE_REQUEST_REQUIRED`) imposent donc l'arrêt avant tout code.
5. **Ch07 (`a2bb69b5`) :** « Chapitres 09 et 12 (dimensions de la carte de grille, composant) à traiter avant le développement » ; « États non dessinés en quatre colonnes : pile déployée, filtres, archivés, suppression ».
   - Ch09 et ch12 sur `main` ne contiennent encore aucune mention de la grille du catalogue.

## Liste PRESERVE / CHANGE / FORBIDDEN (établie, non appliquée)

- **PRESERVE :**
  - catalogue des Mouvements en liste (`MovementCatalogueList.tsx` : cartes, piles à deux feuilles, déploiement, gestes, badge D-510, compteurs, filtres) ;
  - catalogue des Séances et des Programmes ;
  - fiche du mouvement ;
  - navigation du Catalogue.
- **CHANGE (si l'extension est autorisée) :**
  - nouvelle présentation en grille des Mouvements ;
  - bascule liste / grille dans la ligne des compteurs ;
  - mémorisation du choix ;
  - ch09 et ch12.
- **FORBIDDEN :**
  - réécrire la liste ou ses cartes ;
  - redessiner la bascule autrement que selon le composant DSF ;
  - inventer des règles pour les états non dessinés (pile déployée en quatre colonnes, filtres, archivés, suppression) ;
  - toucher à `pre11-formats`.

## Preuves et tests

- Recherches `git grep` sur `origin/main` et sur toutes les références (`refs/heads`, `refs/remotes`) : résultats ci-dessus.
- Aucun test exécuté : aucune modification de code. Sans objet.

## Hypothèses non démontrées

- La grille à trois colonnes n'a été développée sur aucune branche absente de ce dépôt (non vérifiable au-delà des références présentes localement et sur `origin`).

## Modifications réalisées

- Ce rapport uniquement.

## Éléments non corrigés ou hors périmètre

- Toute la présentation en grille : en attente de l'arbitrage de Hermann sur l'extension de périmètre.

## Vérifications restant à effectuer sur appareil réel

- Aucune à ce stade.

## Fichiers modifiés

- `.github/orchestration/reports/2026-11-16_CATALOGUE-GRILLE-4-COLONNES-20261116.md` (nouveau).

## Commit final et état Git

- Commit du rapport : voir le message de clôture (rapport committé seul sur `catalogue/grille-4-colonnes-20261116`).
- État Git : worktree `C:\Dev\KODJO-GRILLE4` propre après ce commit ; branche locale non poussée.
