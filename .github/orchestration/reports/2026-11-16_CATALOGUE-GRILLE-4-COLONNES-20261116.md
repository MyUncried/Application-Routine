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

---

# Reprise — création de la vue en grille (correction de périmètre du 16/11/2026)

## Périmètre corrigé

Correction de périmètre reçue : la mission est une **création** de la vue en grille, autorisée par Hermann (registre ch07, « Catalogue des Mouvements — présentation en grille » puis « grille à quatre colonnes »). `CHANGE_REQUEST` et `SCOPE_EXPANSION` ne s'appliquent pas à la liste reçue ci-dessous. Branche et départ inchangés : `catalogue/grille-4-colonnes-20261116` depuis `d108ad2c`, rapport d'arrêt `59292e29`.

## PRESERVE / CHANGE / FORBIDDEN (établi avant le code)

- **PRESERVE (baseline gelée) :**
  - catalogue des Mouvements en liste ;
  - carte Mouvement en liste ;
  - badge « New » en liste ;
  - comportement de la pile en liste ;
  - catalogue des Séances et des Programmes ;
  - fiche du mouvement.
- **CHANGE :**
  1. vue en grille à quatre colonnes ;
  2. pile repliée (une feuille) et pile dépliée (flux, liseré) ;
  3. badge « New » à 62 % ;
  4. bascule DSF liste / grille, choix mémorisé dans le mécanisme de préférences existant ;
  5. chapitres 09 et 12.
- **FORBIDDEN :**
  - réécrire la liste ou ses cartes ;
  - redessiner la bascule ;
  - inventer une règle pour les états non dessinés ;
  - assembler une grille maison à la place d'une liste native ;
  - toucher à `pre11-formats`.

## Réalisation

- **Grille** (`src/features/activities/MovementCatalogueGrid.tsx`, nouveau)
  - Liste native `FlatList`, `numColumns = 4`, `columnWrapperStyle` (8 pt entre colonnes), marges de 16 pt ; 4 × 86,5 + 3 × 8 + 2 × 16 = 402.
  - Carte 86,5 × 112, fond blanc, rayon 12, ombre de la carte liste ; photo de 70 en tête ; nom Inter Regular 10,5 / 13, `#14171C`, deux lignes au plus, à 6 des bords et 8 sous la photo. Ni niveau, ni description.
  - Chaque case porte l'écart de 10 sous sa carte : la feuille de pile et le liseré restent dans la case, condition pour qu'ils reçoivent le toucher sur iOS.
  - Même collection que la liste : `useMovementCatalogue` → `visibleMovementItems` → `applyMovementCounter`, avec les mêmes compteurs (`movementCatalogueSummary`). Le compteur « mouvements » déplie toutes les piles, comme en liste.
  - Positionnement sur la fiche créée (D-510, règle 8) par rangée.
- **Pile**
  - Repliée : une feuille de 76,5 × 112, 4 plus bas, 5 de retrait de chaque côté.
  - Dépliée : niveaux dans le flux, cases suivantes décalées ; liseré sous chaque niveau, prolongé jusqu'au niveau suivant de la même rangée. Un appui sur le liseré replie la pile.
- **Badge « New »** : forme et libellé de la liste (`NEW_BADGES`, désormais exporté par `MovementCatalogueList`) réduits à 62 %, collés au coin bas droit ; « New ↓ » sur la tête d'une pile dont un niveau caché est nouveau.
- **Bascule** (`src/shared/ui/ListGridToggle.tsx`, nouveau)
  - Rendu exact des deux états du composant DSF : `12548:29164` (Vue=Liste) et `12548:29163` (Vue=Grille), lus dans Figma. 56 × 24, liseré 1,5, segment actif de 28, traits 10 × 2, carrés 5 × 5.
  - Deux onglets accessibles « Afficher en liste » / « Afficher en grille » ; cible de 44 pt de haut.
  - Posée par la nouvelle prop facultative `summaryAccessory` de `CatalogueContextZone`, à droite de la ligne des compteurs, bord droit à 16 pt.
- **Mémorisation : mécanisme existant du Profil**
  - `ProfileService.setPreference("movementCatalogueGridEnabled", …)`.
  - Stockage selon le patron de `migration025` : table singleton `catalogue_preferences` (`migration030`, version 30), jointe au Profil. `profiles` n'est pas modifiée.
  - Une première version qui ajoutait une colonne à `profiles` faisait échouer les tests « aucune autre table touchée » des migrations 016 à 021. Elle a été remplacée par ce patron avant toute livraison.
  - À l'ouverture, le Catalogue lit le choix ; rien n'est rendu tant qu'il n'est pas lu. Sans service de Profil, la liste d'origine.
- **Jetons** : `colors.movementGridCardName`, `colors.movementGridRail`, `type.movementGridCardName`. Ils sont documentés au chapitre 12 ; l'empreinte de `tokens.ts` est mise à jour avec une note, comme aux évolutions précédentes.
- **Textes** : `viewList`, `viewGrid` (fr).

## Choix de mise en page sans maquette (à valider sur iPhone)

- **Pile déployée en quatre colonnes** (non dessinée) :
  - liseré repris de l'écran à trois colonnes `12478:26998` : 3 pt, bleu KODJO à 60 %, rayon 2 ;
  - centré dans l'écart de 10 sous chaque rangée ; aucune règle ajoutée.
- **Repli de la pile dépliée** : un appui sur le liseré, comme le filet de la liste. Les cartes d'une pile dépliée ouvrent leur fiche.
  - Le liseré offre une cible de 10 pt de haut, inférieure aux 44 pt habituels. Point à juger sur iPhone.
- **Filtres** : « N résultats » se place juste à gauche de la bascule.
- **Archivés** : fond `color.surface` et estompage à 60 %, comme en liste.
- **Suppression** : pas d'action en grille (CE-MVT-03 : actions de la liste non redessinées).

## Preuve que PRESERVE est inchangé

- **`MovementCatalogueList.tsx`** : diff limité à deux mots-clés `export`, sans changement de comportement.
  - `-type NewState …` / `+export type NewState …`
  - `-const NEW_BADGES = {` / `+export const NEW_BADGES = {`
- **`CatalogueContextZone.tsx`** : ajout d'une prop facultative. Sans `summaryAccessory` (Séances, sélection « Utiliser un mouvement existant »), le rendu est identique : aucun style existant modifié, `results` ne reçoit un style supplémentaire qu'en présence de l'accessoire.
- **Aucun diff** sur `SessionCatalogueList.tsx`, `SessionCommandRow.tsx`, `MovementScreen.tsx` (fiche), `MovementSelectionScreen.tsx` et `app/`.
- **`CatalogueScreen.tsx`** :
  - la liste est rendue telle quelle quand la présentation est « Liste » (défaut), avec les mêmes props ;
  - seule différence : avec un service de Profil, la liste attend la lecture du choix avant d'apparaître.
- **Tests existants de la liste, du catalogue et des Séances** : tous verts, sans modification (suite complète ci-dessous).

## Tests

- **Nouveaux :**
  - `src/features/activities/__tests__/MovementCatalogueGrid.grille4.test.tsx` (6) : dimensions, nom sans niveau ni description, feuille unique, pile dépliée et liseré, repli, compteur, badge et position, « New ↓ ».
  - `src/features/sessions/__tests__/CatalogueScreen.grille4.test.tsx` (2) : bascule DSF, mémorisation en base réelle relue à la réouverture, absence de service de Profil.
  - `src/infrastructure/database/__tests__/migration030.test.ts` (2) : table, `profiles` inchangée, aller-retour, contrainte.
- **Adaptés :**
  - vingt tests de base de données dont l'assertion « version courante » passe de 29 à 30, comme à la `migration029` (`88f39b00`) ;
  - l'empreinte de `tokens.ts`.
- **Suite complète :** 358 suites, 5 785 tests réussis, 0 échec. `tsc` propre ; ESLint sans erreur sur les fichiers touchés.
- Aucune vérification visuelle automatique. Validation sur iPhone par Hermann.

## Risques et points ouverts

- **Version de base 30.**
  - Une fois l'application lancée sur cette branche, la base de l'iPhone passe en version 30. Le code de `pre11-formats` (version 29) refuse alors de l'ouvrir : « Database version 30 is newer than supported version 29 ».
  - Il faut donc finir la recette de `pre11-formats` avant de tester la grille sur la même installation, ou accepter de ne plus pouvoir revenir à `pre11-formats` sans réinstaller.
- **Numéro de migration en double** : `planification/main-20261113` (branche locale, non fusionnée) utilise aussi `migration030`. La branche fusionnée en second devra renuméroter.
- **Documentation** : chapitres 09 et 12 mis à jour sur cette branche. Les chapitres 07 et 13 étaient déjà à jour sur `main` (`a2bb69b5`, `d108ad2c`).

## Vérifications restant à faire sur appareil réel

- Grille : alignement, photo, nom sur deux lignes, ombres, feuille de pile, badge (forme et découpe au coin).
- Bascule : rendu, position à droite des compteurs, cible tactile.
- Pile dépliée : liseré et repli par appui.
- Mémorisation après relance.
- Le mode Filtré, avec « N résultats » à côté de la bascule.

## Fichiers modifiés (code non commité, en attente de validation)

- **Nouveaux :**
  - `src/features/activities/MovementCatalogueGrid.tsx`
  - `src/shared/ui/ListGridToggle.tsx`
  - `src/infrastructure/database/migrations/migration030.ts`
  - les trois tests listés ci-dessus
- **Modifiés :**
  - `src/features/sessions/CatalogueScreen.tsx`
  - `src/shared/ui/CatalogueContextZone.tsx`
  - `src/features/activities/MovementCatalogueList.tsx` (deux `export`)
  - `src/domain/preferences/Profile.ts`
  - `src/domain/preferences/ProfileRepository.ts`
  - `src/infrastructure/database/repositories/SqliteProfileRepository.ts`
  - `src/infrastructure/database/types/DatabaseRows.ts`
  - `src/infrastructure/database/migrateDatabase.ts`
  - `src/infrastructure/database/constants.ts`
  - `src/shared/ui/tokens.ts`
  - `src/shared/i18n/resources/fr.ts`
  - `src/shared/ui/__tests__/pre4Story11Controls.test.ts`
  - vingt tests de `src/infrastructure/database/__tests__/`
- **Documentation :**
  - `docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md`
  - `docs/Specifications-fonctionnelles/12 – Architecture technique.md`

## Commit et état Git

- Ce rapport est committé seul (voir le message de clôture) ; le code reste non commité jusqu'à la validation de Hermann.
- Worktree `C:\Dev\KODJO-GRILLE4`, branche locale non poussée.
- `node_modules` est une jonction vers `C:\Dev\PRE10-SON\node_modules` (dépendances identiques, `package-lock.json` comparé) ; elle est ignorée par Git.
