# PRE-8 — Epics A et B : rapport de mission

- **Identifiant** : PRE8_EPICS_A_B
- **Objectif** : développer les fondations du modèle D-449 (Epic A) et la gestion des Mouvements et du Catalogue des Mouvements (Epic B), selon l'autorisation de Hermann du 27/10/2026.
- **État du rapport** : Epic A terminé ; Epic B livré sur son périmètre stabilisé (B.1 à B.4). Q-B2, Q-B3 et Q-E1 restent à clarifier.

## Baseline et environnement

- `main` vérifié : `origin/main` = `082390c01e6ba60846cceac943529593ca318309` (fusion de la PR #401).
- Clone dédié `C:\Dev\KODJO-BMAD-PRE8`, branche `pre8-bmad/dev` créée depuis `082390c0`. Installation BMAD locale copiée du clone PRE-7 et exclue du suivi (`.git/info/exclude`).
- `C:\Dev\Application-routine` (`main` local à `a9de5845`, 9 chapitres modifiés non commités) : non touché.
- `main` n'est pas modifié ; aucune fusion.

## Périmètre

- **Demandé** : epics A et B ; conservation des données ; médias conservés ; aucune décision fonctionnelle nouvelle.
- **Traité** : A.1 à A.4 ; B.1 à B.4 (périmètre stabilisé).
- **Hors autorisation, non commencé** : epics C, D, E et formats spécialisés.

## Rapprochement BMAD

Aucun artefact BMAD PRE-8 n'existait (git, disque, Issues et PR GitHub vérifiés). Le découpage repris est celui du prompt d'autorisation ; il est détaillé dans `_bmad-output/pre8/planning-artifacts/epics.md`, avec le suivi dans `_bmad-output/pre8/implementation-artifacts/sprint-status.yaml`.

## Constats (analyse d'impact A.1)

| Cible D-449 | Code livré avant PRE-8 | Écart |
|---|---|---|
| Mouvement partagé | Conforme (PRE-7, schéma 013) | Aucun |
| Exercice, composant de Séance | Conforme (`activities`) | Aucun |
| Plusieurs Cycles successifs de Circuits | Cycle technique unique, Circuit unique (`CHECK position = 1`) | Traité (A.2 à A.4) |
| Aucun Exercice autonome | `activity_definitions` et segment Exercices | Conservé ; relève de l'Epic E (Q-E1) |
| Séance seule lançable ou planifiable | Aucun code de planification ni d'exécution | Rien à adapter |

## Modifications réalisées

- **A.2** : `src/domain/sessions/structure.ts`, structure générale pure (Exercices, Circuits, Cycles sans imbrication). Comptes D-449 §6, durée multi-Cycles, validation de forme, projection sans perte vers l'ancien modèle.
- **A.3** : `migration014.ts`, `DATABASE_VERSION = 14`. Conversion SANS PERTE de toutes les Séances : aucune ligne supprimée, identités conservées, Points d'arrêt convertis, Exercices du Catalogue intacts.
- **A.4** : `SqliteSessionRepository` réécrit sur la structure générale, avec fusion par identité. L'interface actuelle lit une projection exacte : aucun écran modifié. Ajouts : `StructuredSessionRepository` (`createStructured`, `findStructuredById`, `updateStructured`) et `structuredInput.ts`.
- **B.2** : fiche Mouvement CE-MVT-01 (`app/movement.tsx`, `MovementScreen.tsx`). L'éditeur commun reçoit une variante additive `"movement"`, avec `"exercise"` par défaut et inchangé : gabarit photo, phases sans durées (`MovementPhasesEditor`, `movementPhaseList.ts`), aucune carte Paramètres. Les médias gardent les mêmes commandes ; seule la disposition change (`ActivityMediaList.template`). C03 passe par `MovementSaveDialog`, avec l'option `withoutNewMovementDetail` dans le contexte Catalogue (Q-B3).
- **B.3** : segment « Mouvements » placé en premier dans le Catalogue (`MovementCatalogueList`) : familles contiguës, rang de la famille complète, recherche R02 par nom et alias, création, ouverture de la fiche. Piles, filtres, tri et actions glissées ne sont pas développés (Q-B2).
- **B.1** : `MovementRepository.update` et `createVariant` (création et rattachement atomiques) ; `MovementCatalogueService` (création indépendante, variante, C03 dans le contexte Catalogue, nouveau mouvement, familles et rangs dérivés).

## Preuves et tests

- Baseline avant modification : `npx tsc --noEmit` vert ; Jest 195 suites, 4 539 tests, tous verts.
- Après A.3/A.4 : `npx tsc --noEmit` vert ; Jest 198 suites, 4 563 tests, tous verts.
- Après B.2/B.3 : `npx tsc --noEmit` vert ; Jest 202 suites, 4 585 tests, tous verts. Cette suite a démarré avant trois corrections ESLint (`MovementScreen.tsx`, `MovementCatalogueList.tsx`, `MovementPhasesEditor.tsx`) ; les 22 tests de l'Epic B ont été relancés après ces corrections : tous verts.
- Nouveaux tests :
  - `structure.a2.test.ts` : 11 tests ;
  - `migration014.test.ts` : 4 tests, sur une copie de base fichier au schéma 013 peuplée, avec injection d'échec et annulation complète ;
  - `sessionStructure.a4.test.ts` : 9 tests ;
  - `MovementCatalogueService.b1.test.ts` : 8 tests (MVT-01, 02, 05 à 09) ;
  - `MovementScreen.b2.integration.test.tsx` : 7 tests (MVT-01, 04, 05, 06, 09, 10, 11 ; services réels, SQLite réelle) ;
  - `MovementCatalogueList.b3.test.tsx` : 4 tests ;
  - `movementPhaseList.b2.test.ts` : 3 tests.
- Test existant adapté pour B.3 : compte des segments du Catalogue (3 → 4) dans `CatalogueScreen.test.tsx`.
- ESLint propre sur les fichiers modifiés.
- Tests existants adaptés au schéma 014, sans changement de comportement fonctionnel :
  - identifiants générés (le Cycle technique n'en consomme plus) ;
  - SQL brut sur `cycles`, `tours` et `activities` ;
  - parité du CHECK composite (`assertActivityRow`) ;
  - assertions de version 13 → 14.
- La tolérance de lecture des rangs non contigus (cas P39) est conservée.

## Hypothèses non démontrées

- La migration 014 n'a pas été exécutée sur la base réelle de l'iPhone. Elle est testée sur une copie de base reconstruite au schéma 013, pas sur une copie de la base de l'appareil.

## Éléments non corrigés, différés ou à clarifier

- **Q-B2 (À CLARIFIER)** : piles, filtres, tri et actions glissées du Catalogue des Mouvements. Le DSF les exclut de ce lot et le relevé du 25/10 contredit le prototype sur la carte du dessus de pile. Non développés ; commandes inactives comme avant.
- **Q-B3 (À CLARIFIER)** : libellé de la conséquence de « Créer un nouveau mouvement » depuis le Catalogue (DSF §5 : « à adapter », sans texte). Omis en attendant.
- **Q-E1 (À CLARIFIER, Epic E)** : titre d'une Séance issue de la conversion d'un Exercice du Catalogue existant. En attendant, les données restent intactes.
- Points d'arrêt hors du modèle à Circuit unique : refusés jusqu'à la généralisation de RM-219, RM-251 et D-442 (Epic C).
- Le commit `510c764f` contient la modification de `SqliteMovementRepository.ts` de B.1 ; il ne compile pas isolément sans `22fc7d3d`. Le HEAD est cohérent ; l'historique n'a pas été réécrit (aucun rebase spontané).

## Arbitrages reçus le 27/10 après livraison

- **Q-B2** : « le rang le plus haut en tête de l'île » (lu « pile ») — le Niveau le plus élevé de la famille est la carte du dessus, comme le prototype. Restent ouverts : navigation depuis une pile, effet de la recherche, filtres, tri, actions glissées ; les piles ne sont donc pas encore développées.
- **Q-E1** : la Séance issue d'un Exercice du Catalogue prend le titre de son premier Exercice. Consigné pour l'Epic E, non commencé.
- **Q-B3** : aucun texte sous « Créer un nouveau mouvement » depuis le Catalogue (Mouvement nouveau sans lien). Conforme au livré.
- **Q-B2, compléments** : pile dépliée au toucher ; recherche en piles dépliables ; Trier et Partager grisés ; Créer une variante par le choix de difficulté existant ; Archiver transposé de CE-T03-05. Ouverts : combinaison des filtres, archivage dans une famille de Niveaux.
- Aucune modification applicative ; aucun test applicable à cette mise à jour documentaire.

## Test sur appareil et retour arrière (27/10)

- La migration 014 est à sens unique : une version de `main` (schéma 13) refuse d'ouvrir une base 14 (`migrateDatabase`, « newer than supported ») sans l'effacer ; réinstaller PRE-8 la rouvre.
- Les variantes `app.config.js` ont chacune leurs données : Routine (`com.ankusha.kodjo`), Routine Dev (`.dev`), Routine BMAD (`.bmad`). Tester PRE-8 dans Routine BMAD laisse intactes les bases de Routine et Routine Dev. Correction de la réponse précédente, qui supposait un identifiant unique.

## Vérifications restant à effectuer sur appareil réel

- Fiche Mouvement : gabarit photo (proportions, recouvrement par la zone de contexte), ajout, consultation, retrait et réordonnancement des médias, clavier et défilement, invite des phases, crayon, menu Niveau, dialogue C03.
- Catalogue : quatre segments à 360 pt, carte Mouvement, recherche.
- Premier lancement après la migration 014 sur l'iPhone : Séances, Circuit, ordre, Points d'arrêt et Exercices du Catalogue retrouvés à l'identique ; aucun avis de réinitialisation.

## Fichiers modifiés (à cette étape)

- `src/domain/sessions/` : `structure.ts`, `structuredInput.ts`, `Session.ts`, `SessionRepository.ts`, `errors.ts`, `index.ts`, `calculations.ts` et les tests associés.
- `src/infrastructure/database/` : `migrations/migration014.ts`, `migrateDatabase.ts`, `constants.ts`, `types/DatabaseRows.ts`, `repositories/SqliteSessionRepository.ts`, `repositories/SqliteMovementRepository.ts`, `README.md` et les tests associés.
- `src/domain/activities/` : `MovementRepository.ts`, `movementPhaseList.ts` et le test associé.
- `src/features/activities/` : `MovementCatalogueService.ts`, `MovementScreen.tsx`, `MovementPhasesEditor.tsx`, `MovementCatalogueList.tsx`, `ActivityEditorForm.tsx`, `ActivityMediaList.tsx`, `MovementSaveDialog.tsx`, `ActivityDefinitionService.ts` et les tests associés.
- `src/features/sessions/` : `CatalogueScreen.tsx` (segment), `ExerciseScreen.tsx` (ajout du seul mot-clé `export` sur `EditorHeader` et `EditMovementAction`) et le test associé.
- `app/movement.tsx`, `app/_layout.tsx` ; `src/shared/i18n/resources/fr.ts`.
- `_bmad-output/pre8/` : README, epics, sprint-status, specs.

## Commits et état Git

- `b3e6f0b1` A.1 et A.2 ; `510c764f` A.3 et A.4 ; `22fc7d3d` B.1 ; `b9473713` rapport d'étape ; commit final B.2 à B.4 avec ce rapport (hash communiqué dans la réponse de clôture).
- Branche `pre8-bmad/dev`, non poussée, sans fusion.
