# PRE-8 — Epics A et B : rapport de mission

- **Identifiant** : PRE8_EPICS_A_B
- **Objectif** : développer les fondations du modèle D-449 (Epic A) et la gestion des Mouvements et du Catalogue des Mouvements (Epic B), selon l'autorisation de Hermann du 27/10/2026.
- **État du rapport** : Epics A et B terminés (A.1 à A.4, B.1 à B.8). Q-B2, Q-B3 et Q-E1 tranchés le 27/10 ; arbitrages du Catalogue des Mouvements (Q1 à Q8, Q3 définitif) intégrés et développés.

## Baseline et environnement

- `main` vérifié : `origin/main` = `082390c01e6ba60846cceac943529593ca318309` (fusion de la PR #401).
- Clone dédié `C:\Dev\KODJO-BMAD-PRE8`, branche `pre8-bmad/dev` créée depuis `082390c0`. Installation BMAD locale copiée du clone PRE-7 et exclue du suivi (`.git/info/exclude`).
- `C:\Dev\Application-routine` (`main` local à `a9de5845`, 9 chapitres modifiés non commités) : non touché.
- `main` n'est pas modifié ; aucune fusion.

## Périmètre

- **Demandé** : epics A et B ; conservation des données ; médias conservés ; aucune décision fonctionnelle nouvelle.
- **Traité** : A.1 à A.4 ; B.1 à B.4 ; puis, après arbitrages du 27/10, B.5 (piles), B.6 (variante par action glissée), B.7 (filtres et recherche), B.8 (archivage, restauration, suppression ; migration 015).
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
- Après B.5 à B.8 : `npx tsc --noEmit` vert ; Jest **206 suites, 4 609 tests, tous verts** (suite complète relancée après la dernière modification) ; ESLint propre sur les fichiers modifiés.
  - Nouveaux : `movementCatalogueView.b7.test.ts` (6), `MovementFilterSheet.b7.test.tsx` (2), `MovementCatalogueList.b5.test.tsx` (7), `movementLifecycle.b8.test.ts` (7), `migration015.test.ts` (3) ; `MovementScreen.b2.integration.test.tsx` +2 ; `CatalogueScreen.test.tsx` +1.
  - Remplacé : `MovementCatalogueList.b3.test.tsx` (4 tests de la liste plate, comportement supplanté par Q-B2 et Q3).
  - Adaptés au schéma 15, sans changement de comportement : assertions de version dans `migrateDatabase`, `migration012`, `migration013`, `migration014` (et instantané de la 014 hors colonne additive `archived_at`), `executionParametersV3.roundTrip`.
- Nouveaux tests (A.1 à B.4) :
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

## Stories B.5 à B.8 (arbitrages du 27/10)

Détail : `_bmad-output/pre8/implementation-artifacts/spec-b-5-b-8-catalogue-piles-filtres-archives.md`.

- **B.5** : piles (rang le plus haut en tête), dépliage au toucher, repli par le trait de famille, recherche en piles dépliables (`movementCatalogueView.ts`, `MovementCatalogueList.tsx`).
- **B.6** : `SwipeActionsRow.tsx`, même mécanisme de geste que la carte de Composition (modules purs réutilisés, aucune bibliothèque ajoutée) ; Partager grisé ; Créer une variante → Plus facile / Plus difficile → fiche B.2 existante ; Archiver.
- **B.7** : `MovementFilterSheet.tsx` et règles Q1, Q2, Q4, Q3 définitif ; filtres gardés pendant la session par `CatalogueScreen` ; Filtrer actif sur le seul segment Mouvements ; Trier grisé.
- **B.8** : `migration015` additive (`movements.archived_at`, `DATABASE_VERSION = 15`) ; `archive`, `restore`, `deleteArchived`, `listArchivedIds` ; refus « Archivage impossible » ; annulation immédiate de l'archivage et de la restauration ; suppression confirmée sans annulation ni cascade ; Q6 : archivé exclu de la recherche à la création d'un Exercice et non sélectionnable dans le menu Niveau d'un Exercice ; fiche archivée en consultation seule.
- **Documentation intégrée** : chapitre 07 (section « Arbitrages du 27/10/2026 — Catalogue des Mouvements », numéro de décision à attribuer), chapitre 10 (MFN-10), DSF Mouvements (hors lot, archivage dans une famille), DSF Niveaux (piles).
- **Choix techniques à valider** (aucune nouvelle règle fonctionnelle) : Exercices du Catalogue comptés comme Exercices persistés pour le refus d'archivage ; repli de pile par le trait ; fiche archivée en consultation seule ; libellés « Mouvement archivé », « Mouvement restauré », « Suppression impossible », « N filtres » ; couleurs des actions d'après Figma.
- **Tests remplacés** : `MovementCatalogueList.b3.test.tsx` (liste plate, supplantée par Q-B2 et Q3) remplacé par `MovementCatalogueList.b5.test.tsx`.

## Hypothèses non démontrées

- Les migrations 014 et 015 n'ont pas été exécutées sur la base réelle de l'iPhone (015 testée sur copie de base fichier au schéma 014).
- La migration 014 n'a pas été exécutée sur la base réelle de l'iPhone. Elle est testée sur une copie de base reconstruite au schéma 013, pas sur une copie de la base de l'appareil.

## Éléments non corrigés, différés ou à clarifier

- Q-B2, Q-B3 et Q-E1 : tranchés le 27/10 (voir plus bas). Q-E1 s'appliquera dans l'Epic E, non commencé.
- Non développés : tri (aucune règle), Partager (nouveau), réordonnancement des familles depuis la pile, C08.
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

## B.9 — Corrections de la recette iPhone A/B (27/10, soir)

**Demande.** Écarts de recette A01–G (Catalogue, Niveaux, recherche, filtres, navigation, fiche Mouvement) et compléments : A01 arbitré à 16 pt, A02 (titres). Intégrés au lot A/B, sans nouvel epic ni audit global. Point de départ : `d47d695d`.

**Réalisé** (détail par item : `_bmad-output/pre8/implementation-artifacts/spec-b-9-corrections-recette-a-b.md`) :

- **A01.** Jeton `layout.screenGutter` (16). `finalActionSideMargin` le renvoie à toutes les largeurs. Écrans passés à 16 :
  - `ScreenShell` (en-tête, zone de contexte), Catalogue, Composition (colonne, halo du Retour, arbre d'ajout) ;
  - Profil, Modifier le profil, Sélection d'Exercices, menu Créer, écrans de repli.
  - Exceptions conservées : navigation (24), modales et feuilles, médias pleine largeur.
- **A02.** Le titre du Catalogue était déjà conforme ; la fiche et la création restent en Medium 17, désormais vérifié par un test.
- **B01–B12.** Carte Figma `Carte — Mouvement` :
  - Animations de mise en page communes (`SheetMotion`).
  - Repli par la marge gauche.
  - Réordonnancement par appui long, avec actions VoiceOver équivalentes. Nouvelle méthode `MovementCatalogueService.reorderFamily`, qui appelle le `MovementRepository.reorder` existant : aucune migration.
  - Aucun glissé sur une pile condensée ; écart de 8 avant « Partager ».
  - « Ajouter un niveau » ; le choix Plus facile / Plus difficile se déploie sous les actions, avec les raccords Figma.
- **C01, C02.** Déjà conformes, tests ajoutés.
- **D01–D07.** Nouveau module commun `src/shared/ui/CatalogueCommands.tsx` :
  - Commandes rondes 34 ; champ Rechercher sur la rangée, avec croix d'effacement.
  - Filtrer étendu avec résumé.
  - Réinitialiser selon Figma.
  - Zones corporelles du filtre prises dans le référentiel.
- **E01.** Barre à cinq destinations. Communauté est désactivée et non routée. Aucun bouton Recherche.
- **F01–F07.**
  - Média sous la zone de contexte et fixe ; gabarit toujours présent.
  - Titres « Description du mouvement » et « Phases » harmonisés.
  - Phases présentées en liste ; limite de 20 points de code (`WORK_PHASE_LIMITS`).
  - Depuis le Catalogue, la fiche s'ouvre en édition (`mode=edit`) ; un Mouvement archivé reste en consultation seule.

**Mode de travail.** Deux sous-agents ont travaillé en parallèle, sans commit : l'un sur la navigation (E01), l'autre sur la fiche (F, C, A02). Le Catalogue, A01, l'intégration, la documentation et les tests sont de la session principale. Les résultats des sous-agents ont été relus et repassés aux tests complets.

**Gardes de non-régression mises à jour, chaque fois par une modification autorisée :**
- empreinte de `tokens.ts` dans `pre4Story11Controls.test.ts`, avec un commentaire qui en conserve l'historique ;
- nouveaux jetons documentés au chapitre 12, comme l'exige `tokensSpecification.test.ts` ;
- assertions 24 → 16 de A01 dans `PrimaryActionZone`, `CompositionScreen`, `ExerciseScreen`, `ActivityEditorForm` et `EditorAccessibility` ;
- les anciens contrats D-184 de commande à libellé (108 × 32) sont remplacés par le contrat D01.

**Documentation mise à jour :**
- chapitre 07 : section « Recette A/B du 27/10/2026 » (numéro à attribuer) ; D-225 annotée ;
- chapitres 06, 12 et 13 : navigation, jetons, marges, animations, §4.5, CE-MVT-01 ;
- chapitre 10 et DSF Mouvements ;
- BMAD : epics (B.9) et sprint-status (`b-9` en review).

**Tests B.9.** `npx tsc --noEmit` : propre. ESLint sur les fichiers modifiés : propre. Jest complet : 207 suites, 4 623 tests, tous verts (avant B.9 : 206 / 4 609). Nouveaux tests : `CatalogueCommands.test.tsx` ; `MovementCatalogueList.b5` (B03, B08, B09, B11/B12) ; `MovementFilterSheet.b7` (D06, D07, libellés) ; `movementCatalogueView.b7` (ordre de famille) ; `CatalogueScreen` (D01–D03) ; `TabsLayoutSearch.integration` (E01) ; `MovementScreen.b2.integration` (F07, C02, A02, F06). Tests rejoués après la mise à jour documentaire : 6 suites lisant la documentation, 699 tests, verts. Aucun test sur appareil par Claude.

**Constat sur appareil (journal Metro, 13:21, avant ces corrections).** Après chargement du bundle, trois `Exception in HostFunction: std::bad_alloc` dans `Performance.js` (`reportMeasure`), appelé par `logComponentRender` du moteur React de développement. Chacune est suivie de « Should not already be working ».
- **Démontré :** la pile d'appels ne contient que le moteur de rendu et l'API Performance de React Native, en mode développement.
- **Non démontré :** la cause, et le fait que l'erreur existe ou non avec `main`. Aucune correction n'a été tentée.
- **Vérification proposée :** noter l'écran et l'action au moment de l'erreur, puis comparer avec la build de `main`.
- **Suite (27/10, après B.9).** Hermann signale l’écran de démarrage bloqué à chaque rechargement. Journal Metro : les deux premiers chargements de la session réussissent ; tous les suivants, à partir du premier rechargement après les modifications B.9 en cours, lèvent `std::bad_alloc`. Attribution à B.9 : **plausible**, non démontrée ; aucune boucle de rendu trouvée à la relecture. Mesure prise : garde de développement `src/shared/utils/devPerformanceGuard.ts` (installée dans `app/_layout.tsx`, sans effet hors `__DEV__`), qui intercepte l’échec de `performance.measure` (mesure de diagnostic de React) et journalise le composant concerné, pour débloquer la recette et identifier la cause. Tests `app` et `src/shared` : 20 suites, 212 tests, verts.

**À clarifier / à valider** (aussi dans le cahier de recette) :
1. Déplacement des phases : il ne se fait plus que par VoiceOver.
2. L'étape « Filtres / Aucun » n'est pas développée.
3. Résumé de Filtrer : le nom du critère s'il est seul, sinon « N filtres ».
4. Les archivés masqués gardent leur place lors d'un réordonnancement.
5. Hors segment Mouvements, les commandes sont alignées à droite.
6. La croix d'effacement est dessinée sans maquette Figma, et le champ a un fond uni au lieu du dégradé.
7. Les reports dans Figma (marge 16, écart 8, champ 34) ne sont pas faits : aucune écriture Figma.

## Vérifications restant à effectuer sur appareil réel

- Cahier de recette : https://claude.ai/artifact/KR5M1XyoWc4eDFpAE5bZBV ; serveur Expo lancé depuis ce clone sur `5cadfcd9`, tunnel `https://fi5f9dc-uncried-8081.exp.direct`.

- Fiche Mouvement : gabarit photo (proportions, recouvrement par la zone de contexte), ajout, consultation, retrait et réordonnancement des médias, clavier et défilement, invite des phases, crayon, menu Niveau, dialogue C03.
- Catalogue : quatre segments à 360 pt, carte Mouvement, recherche ; piles (épaisseur, dépliage, trait de repli) ; glissement des cartes (seuil, retour, défilement vertical préservé) ; feuille Filtres ; résumé « N filtres » dans la commande de 108 pt ; dialogues d'archivage refusé et de suppression ; snackbar Annuler.
- B.9 : les points de la section « Corrections A/B » du cahier (marges, cartes, animations de pile, appui long, glissés, rangée de commandes, navigation à cinq destinations, fiche en édition, média fixe, phases).
- Premier lancement après les migrations 014 et 015 sur l'iPhone (schéma attendu : 15) : Séances, Circuit, ordre, Points d'arrêt et Exercices du Catalogue retrouvés à l'identique ; aucun avis de réinitialisation.

## Fichiers modifiés (à cette étape)

- `src/domain/sessions/` : `structure.ts`, `structuredInput.ts`, `Session.ts`, `SessionRepository.ts`, `errors.ts`, `index.ts`, `calculations.ts` et les tests associés.
- `src/infrastructure/database/` : `migrations/migration014.ts`, `migrateDatabase.ts`, `constants.ts`, `types/DatabaseRows.ts`, `repositories/SqliteSessionRepository.ts`, `repositories/SqliteMovementRepository.ts`, `README.md` et les tests associés.
- `src/domain/activities/` : `MovementRepository.ts`, `movementPhaseList.ts` et le test associé.
- `src/features/activities/` : `MovementCatalogueService.ts`, `MovementScreen.tsx`, `MovementPhasesEditor.tsx`, `MovementCatalogueList.tsx`, `ActivityEditorForm.tsx`, `ActivityMediaList.tsx`, `MovementSaveDialog.tsx`, `ActivityDefinitionService.ts` et les tests associés.
- `src/features/sessions/` : `CatalogueScreen.tsx` (segment), `ExerciseScreen.tsx` (ajout du seul mot-clé `export` sur `EditorHeader` et `EditMovementAction`) et le test associé.
- `app/movement.tsx`, `app/_layout.tsx` ; `src/shared/i18n/resources/fr.ts`.
- `_bmad-output/pre8/` : README, epics, sprint-status, specs.
- B.5 à B.8 : `src/features/activities/` (`movementCatalogueView.ts`, `SwipeActionsRow.tsx`, `MovementFilterSheet.tsx`, `MovementCatalogueList.tsx`, `MovementCatalogueService.ts`, `ActivityDefinitionService.ts`, `useMovementOriginChoice.tsx`, `MovementScreen.tsx`) ; `src/features/sessions/` (`CatalogueScreen.tsx`, `ExerciseScreen.tsx` : niveau archivé non sélectionnable) ; `src/domain/activities/MovementRepository.ts` ; `src/infrastructure/database/` (`migrations/migration015.ts`, `migrateDatabase.ts`, `constants.ts`, `repositories/SqliteMovementRepository.ts`, `README.md`) ; `src/shared/i18n/resources/fr.ts` ; tests associés.
- Documentation : chapitres 07 et 10, `docs/DSF-MOUVEMENTS-CREATION-EDITION-2026-10-27.md`, `docs/DSF-NIVEAUX-RECHERCHE-2026-10-25.md` ; BMAD : epics, sprint-status, `spec-b-5-b-8-catalogue-piles-filtres-archives.md`, `recette-iphone-pre8.md`.

- B.9 : `src/shared/ui/` (`tokens.ts`, `finalAction.ts`, `ScreenShell.tsx`, `CatalogueCommands.tsx` nouveau, `navigationLayout.ts`, `KodjoIcon.tsx`, `PlaceholderScreen.tsx`, `RootErrorFallback.tsx`) ; `app/(tabs)/_layout.tsx`, `app/+not-found.tsx` ; `src/features/activities/` (`MovementCatalogueList.tsx`, `SwipeActionsRow.tsx`, `MovementFilterSheet.tsx`, `movementCatalogueView.ts`, `MovementCatalogueService.ts`, `MovementScreen.tsx`, `ActivityEditorForm.tsx`, `MovementPhasesEditor.tsx`, `ActivitySelectionScreen.tsx`, `CatalogueCreateOptions.tsx`) ; `src/features/sessions/` (`CatalogueScreen.tsx`, `CompositionScreen.tsx`) ; `src/features/preferences/` (`ProfileScreen.tsx`, `ProfileEditScreen.tsx`) ; `fr.ts` ; 15 icônes SVG et `assets/icons/manifest.json` ; tests associés ; documentation (chapitres 06, 07, 10, 12, 13, DSF Mouvements) ; BMAD (epics, sprint-status, `spec-b-9-corrections-recette-a-b.md`, `recette-iphone-pre8.md`).

## Commits et état Git

- `b3e6f0b1` A.1 et A.2 ; `510c764f` A.3 et A.4 ; `22fc7d3d` B.1 ; `b9473713` rapport d'étape ; `9b3db6e6` B.2 à B.4 ; `35690f24`, `1936a54e`, `1f2dc356` arbitrages et retour arrière (documentation) ; `5cadfcd9` B.5 à B.8 ; `d47d695d` lien du cahier de recette ; commit B.9 (corrections de recette A/B) avec ce rapport (hash communiqué dans la réponse de clôture).
- Branche `pre8-bmad/dev`, non poussée, sans fusion.

## Résultats de la recette iPhone A/B (27/10, 13:10–14:41)

Source : collection `results` du cahier de recette (https://claude.ai/artifact/KR5M1XyoWc4eDFpAE5bZBV), relue le 27/10 après 14:41 ; build servie : `a5795271`. Le démarrage, bloqué auparavant sur l'écran de lancement, a fonctionné (tests réalisés).

**Bilan.** 66 tests : 60 OK, 5 KO (`b2-4`, `b2-5`, `b2-8`, `q6-2`, `r9-a02`), 1 non testé (`q6-4`, VoiceOver). Plusieurs tests OK portent une note qui modifie le besoin.

**KO :**
- `b2-4` clavier : dans Description et Phases, les champs remontent sous la photo. Demande : la photo remonte aussi (derrière la zone de contexte) pendant la saisie seulement, puis reprend sa place. Question : comment fermer le clavier (pas de bouton) ?
- `b2-5` nom déjà utilisé : la liste de suggestions est en partie sous la zone de contexte ; Entrée ferme le clavier sans message ; la liste reste et masque le gabarit ; la fiche reste modifiable mais non sauvegardable. Demande : message (Figma) à l'appui sur Entrée, clavier maintenu, fiche non modifiable.
- `b2-8` menu Niveau depuis le Catalogue : libellé « Ouvrir un autre niveau » ; textes du menu plus petits.
- `q6-2` niveaux archivés : côté Exercice, tous les niveaux sont grisés sauf le courant (archivés compris) ; côté Mouvement, tous actifs, l'archivé s'ouvre en lecture seule sans indication. Demande : « (archivé) » dans le menu et, si possible, sur le nom.
- `r9-a02` titres : tous les titres d'écran en Medium 17 (y compris Catalogue, auparavant Semi Bold 20).

**Notes modifiant le besoin sur des tests OK :**
- `b7-5` : la pile filtrée n'affiche que les cartes qui correspondent aux filtres (la Recherche, elle, garde toute la pile). Contredit l'arbitrage définitif Q3 (pile entière).
- `b8-3` : les niveaux sont recalculés directement après archivage. Contredit l'arbitrage « pas de recalcul ».
- `b2-6` : comportement observé conforme à F07 (ouverture en édition).
- `b5-5` : la recherche par alias n'a pas pu être testée ; question sur la gestion des alias et sur une interface d'administration.

**Remarques générales :**
1. Fiche de Mouvement dans la Composition de Séance : encore l'ancien format.
2. Réordonnancement : la carte déplacée passe derrière un emplacement blanc ; la carte à déplacer disparaît puis bouge au relâcher.
3. Titre du Catalogue : trop gros et gras (cf. `r9-a02`).
4. Retour dans le Catalogue : les options glissées doivent être refermées ; filtres et piles dépliées conservés.
5. Médias : compteur « 1 / n » à la place de « Vidéo » ; icône de lecture transparente au centre pour une vidéo.
6. Création : curseur dans le champ Nom à l'ouverture.
7. Suggestions en création : « Ajouter un niveau » et « Ouvrir ce mouvement » (au lieu de « Créer une variante » / « Utiliser ce mouvement »).
8. Nouveau niveau depuis un Mouvement ouvert : aucune recherche de nom similaire ; un nom identique bloque la sauvegarde sans explication. Demande : la recherche et le blocage du nom identique avant de continuer.
9. Seconde rangée de commandes de la zone de contexte : trop haute par rapport aux Catalogues Séances / Exercices.

**Constat technique (alias).** Le modèle, la persistance (`movement_aliases`, migration 013) et la recherche (`rankMovements`) gèrent les alias, mais aucun écran ne permet d'en saisir (`aliases: []` à la création) et aucun jeu de données n'en contient. Il n'existe pas d'interface d'administration de la base. La recherche par alias n'est donc pas testable sur l'appareil. Démontré par lecture du code ; non vérifié sur l'appareil.

**Suite.** Aucune correction engagée : en attente de l'accord de Hermann sur le lot de corrections, notamment sur les deux changements d'arbitrage (`b7-5`, `b8-3`) et sur la remarque 1 (Composition), dont l'appartenance au périmètre A/B est à confirmer.

## B.10 — Second passage de la recette iPhone A/B (27/10)

**Demande.** Accord de Hermann sur la synthèse de recette (`4c53d26c`) : « 1. Oui » (lot de corrections), « 2. Non » (fiche Mouvement dans la Composition hors périmètre), « 3. Non » (pas de saisie d'alias, reportée à la question des langues). Complément : spécification du bouton de lecture vidéo (Figma « DSF / Actions / Bouton d'action circulaire », Action=Lecture). Point de départ : `4c53d26c`.

**Mode de travail.** Un sous-agent, sans commit, a traité la fiche Mouvement (b2-4, b2-5, b2-8, q6-2, remarques 4 à 7) ; la session principale a traité le Catalogue et les titres (r9-a02, b7-5, b8-3, remarques 2, 4, 9), l'intégration, la documentation et les tests.

**Réalisé** (détail : `_bmad-output/pre8/implementation-artifacts/spec-b-10-corrections-second-passage.md`) :
- Titres d'écran en Medium 17 (`type.screenHeaderTitle`) ; empreinte de `tokens.ts` mise à jour (`5d8a7e03…ec54`), jeton documenté au chapitre 12.
- Piles filtrées (b7-5) et rangs affichés recalculés après archivage (b8-3, `familyPosition` conserve l'ordre complet).
- Réordonnancement visible pendant le geste ; cartes refermées au retour ; écart de 8 sous les segments rétabli.
- Fiche : média remonté pendant la saisie, bouton ↑ des Phases, nom déjà utilisé (création et nouveau Niveau), autofocus du Nom, libellés des suggestions, menu « Ouvrir un autre niveau », repère « (archivé) », compteur de médias.

**Non livré.** Bouton de lecture vidéo : `expo-blur` absent ; l'ajouter est une nouvelle dépendance native qui impose une nouvelle build de développement de Routine BMAD. Arbitrage demandé. Le lecteur système plein écran existe déjà.

**Décisions reportées au registre** (chapitre 07, « Recette A/B du 27/10/2026, second passage ») : b7-5 remplace Q3 sur l'affichage des piles filtrées ; b8-3 remplace Q5 sur le recalcul ; r9-a02 remplace A02 et G-4 pour les titres d'écran.

**Tests.** `npx tsc --noEmit` : OK. ESLint sur les fichiers modifiés : OK. `npx jest` complet : 207 suites, 4 635 tests, tous verts ; après les mises à jour documentaires, les 21 suites qui lisent des fichiers (1 272 tests) repassées vertes. Ajoutés ou modifiés : `movementCatalogueView.b7`, `movementLifecycle.b8`, `MovementCatalogueList.b5` (retour au Catalogue, carte portée), `CatalogueScreen` (marge 8), `ScreenShell` (Medium 17), `ExerciseScreen` (titre Composition), `MovementScreen.b2.integration` (6 tests), `MovementLevelMenu` (2), `ActivityMediaList` (2), `pre4Story11Controls` (empreinte).

**À vérifier sur l'iPhone :** remontée de la photo pendant la saisie et bouton ↑ ; liste de suggestions sous la zone de contexte, message à l'Entrée, clavier maintenu ; repères « (archivé) » ; glisser de réordonnancement ; renumérotation après archivage ; titres Medium 17.

**À clarifier :** voir la spec B.10 (7 points, dont la taille du menu Niveau natif iOS et le rang affiché d'un archivé).

## Correction UX « clavier » de la fiche Mouvement (27/10)

**Demande.** « KODJO — PRE-8 — Correction UX du formulaire Mouvement lors de l'ouverture du clavier » : média et contexte fixes ; le formulaire éditable (Description, Phases) remonte devant le média sur une surface claire translucide (95 %), le champ actif reste visible ; retour progressif à la fermeture. Autorisée dans PRE-8 A/B, sans nouvel epic. Point de départ : `e98f4341`.

**Cause technique.**
- Structure d'origine, PRE-8 F01/F02 : zone de contexte, puis gabarit photo dans le flux de mise en page (hauteur fixe, environ 329 à 402 pt), puis `KeyboardAvoidingView` et `ScrollView` qui occupent le reste.
- À l'ouverture du clavier, la zone d'évitement réduisait le défilement à l'espace compris entre le bas de la photo et le haut du clavier, presque nul. Le champ actif passait donc sous la photo ; c'est l'écart b2-4 de la recette.
- B.10 a corrigé à l'envers : la hauteur visible de la photo était animée jusqu'à 21 pt et l'image entraînée vers le haut. C'est le défaut constaté : le média disparaît derrière la zone de contexte.
- Attribution démontrée par lecture du code (`photoVisibleHeight`, `MOVEMENT_PHOTO_RAISE_TIMING` dans `e98f4341`).

**Correction.** `ActivityEditorForm.tsx` :
- **Gabarit média** : redevenu une vue fixe, hauteur et marge inchangées. Il ne réagit plus au clavier.
- **Couche éditable** : une nouvelle couche `movement-editable-layer` enveloppe la zone qui évite le clavier et le défilement. Elle s'affiche au-dessus du média et sous la zone de contexte (`zIndex` 1), sur `colors.movementEditableSurface` (blanc à 95 %).
- **Remontée** : sa marge haute est animée de 0 à `-(hauteur du média − 21)`, soit jusqu'au bas de la zone de contexte.
  - Primitive : Reanimated `withTiming`, avec la durée de l'évènement clavier, à défaut 250 ms, et `ReduceMotion.System`.
  - Déclenchement : focus d'une étape de Description ou d'une Phase, ou réouverture du clavier dans un champ resté actif.
  - Retour : fermeture du clavier, ou focus du Nom.
- **Recadrage** : le champ actif est recadré une seule fois, à la fin de la remontée, par les mécanismes existants `revealDescription` et `revealPhases`. Il n'y a aucun recadrage pendant l'animation, donc pas de double décalage.
- **Description et Phases** : même mécanique.
- **Sans changement** : médias, données, règles de Phases (20 caractères), C03, brouillon. Aucune migration.

**Tests.**
- `npx tsc --noEmit` : OK. ESLint sur les fichiers modifiés : OK.
- Nouveau test `MovementScreen.b2.integration` « KBD-01 à KBD-07 » :
  - les couches sont séparées et la surface est à 95 % ;
  - le style du média est identique avant et après le focus et après la fermeture ;
  - la couche remonte au focus d'une étape et reste remontée en passant aux Phases ;
  - elle redescend à la fermeture du clavier, sans perte de la saisie ;
  - elle remonte à la réouverture du clavier dans un champ resté actif ;
  - elle ne remonte pas pour le Nom.
- Le simulacre Jest de Reanimated ne conserve pas les valeurs animées. L'état de remontée est donc lu sur la couche (`-lifted`), et le déplacement réel se vérifie sur l'iPhone.
- Empreinte de `tokens.ts` mise à jour (`6358eb15…d86c`).
- `npx jest` complet : 207 suites, 4 636 tests, tous verts. Après les derniers ajustements (réouverture du clavier, documentation), 31 suites concernées repassées : 1 404 tests verts.

**Documentation.**
- Ch.13 CE-MVT-01 §10 : nouvelle règle, et précisions de mise en œuvre à confirmer.
- Ch.06 : parcours Mouvement.
- Ch.12 : jeton et mise en œuvre.
- Ch.07 : l'entrée b2-4 est annotée « remplacé ».
- Figma n'est pas modifié ; l'état clavier n'y est pas représenté.
- Contrôle documentaire indépendant, en lecture seule : aucun écart bloquant. Trois écarts mineurs, corrigés :
  - précisions de mise en œuvre marquées comme telles ;
  - cible 94–96 % citée au ch.13 ;
  - durée de repli de 250 ms citée au ch.12.
- La remarque sur la réouverture du clavier sans nouveau focus est traitée dans le code et testée.

**À vérifier sur l'iPhone (KBD-01 à KBD-11)** :
- immobilité du média et du contexte ;
- fluidité de la remontée et de la descente, et synchronisation avec le clavier ;
- recadrage de la dernière étape et de la dernière Phase ;
- passage d'un champ à l'autre ;
- gabarit vide ; photo puis vidéo ;
- largeurs 360, 402 et 440 ;
- réduction des animations et texte agrandi ;
- absence d'interstice entre la couche et la zone de contexte.

**À confirmer par Hermann** :
- la saisie du Nom n'entraîne pas la remontée ;
- la surface à 95 % est posée en permanence sur la couche, sans différence visible au repos sur fond blanc.

## Feuille des filtres au format standard (27/10)

**Demande.** « La modale de filtres n'a pas le format standard, celle des paramètres d'exécution par exemple (boutons annuler et valider, barres horizontales...) ».
**Réalisé.** `MovementFilterSheet.tsx` reprend le cadre de `ExecutionParametersSheet` : poignée 50 × 4, ✕ et ✓ ronds 38 (`wheel-action-cancel` / `wheel-action-validate`, fonds `wheelActionCancelBackground` / `wheelActionValidateBackground`, cible `minTouchTarget`), titre `type.modalTitle` centré, filet `divider` sous l'en-tête, voile `overlayScrim`. Contenu, libellés et règles des filtres inchangés. Registre (ch.07) complété.
**Tests.** tsc et ESLint : OK. `MovementFilterSheet.b7` (4 tests, dont le cadre standard) et `CatalogueScreen` : verts.
**À vérifier sur l'iPhone.** Rendu de la feuille comparé à la feuille Paramètres d'exécution. Les filets entre groupes de filtres n'ont pas été ajoutés : à préciser si « barres horizontales » les désigne aussi.

## Bouton de lecture vidéo de la fiche Mouvement (27/10)

**Demande.** Spécification de Hermann : bouton « DSF / Actions / Bouton d'action circulaire », Action=Lecture, posé au centre du gabarit photo. Arbitrage « B » : utiliser `expo-glass-effect`, déjà présent depuis l'initialisation du projet, plutôt que d'ajouter `expo-blur`, ce qui impose une nouvelle build.

**Réalisé.** `ActivityMediaList.tsx`, composant `MediaPlayButton` :
- **Rendu** : Ø 72, centré dans le gabarit ; verre natif `GlassView` (style « clear », clair) quand `isGlassEffectAPIAvailable()` et `isLiquidGlassAvailable()` le permettent ; voile blanc 22 % (`colors.mediaPlaySurface`) ; contour blanc 35 % d'épaisseur 1 (`colors.mediaPlayBorder`) ; triangle blanc 26 × 30 décalé de 2 pt vers la droite ; ni ombre ni couleur de marque.
- **Interaction** : bouton sur une vidéo seulement ; cible tactile égale au cercle, sans `hitSlop` ; l'appui ouvre le lecteur système plein écran existant (`VideoConsultation`, `enterFullscreen`).
- **Sans Liquid Glass** (iOS antérieur à 26, ou API absente) : voile et contour seuls.
- **Triangle** : `assets/icons/media-lecture.svg`, redessiné en tracé d'après le glyphe texte « ▶ » de Figma `7872:14698`. Entrée de manifeste `EQUIVALENT_GEOMETRY`.
- **Retrait** : le petit cercle violet était déjà retiré en B.10.

**Tests.**
- tsc et ESLint : OK.
- `ActivityMediaList` : nouveau test du bouton (absent sur une photo, géométrie, voile, contour, triangle, verre natif, ouverture du lecteur).
- `npx jest` complet : 207 suites, 4 638 tests, tous verts.
- Empreinte de `tokens.ts` : `8e16c394…7c2c`. Chapitres 12 (jetons) et 07 (arbitrage B) mis à jour.

**Hypothèse non démontrée.** Le module natif `ExpoGlassEffect` est bien dans la build installée de Routine BMAD : il est lié automatiquement depuis l'initialisation. Si la vérification au lancement échoue, le bouton s'affiche sans verre.

**À vérifier sur l'iPhone** :
- triangle lisible et image devinée à travers le cercle, sur une illustration claire puis sur une sombre ;
- rendu selon la version d'iOS (verre sur iOS 26 et suivants) ;
- appui : lecteur plein écran, puis retour à la fiche dans son état.

## Troisième passage de la recette iPhone (27/10, 17:03–17:51)

**Résultats.** 84 OK, 3 KO (`r10-glisser`, `r10-kbd-accessibilite`, `r10-kbd-derniere`), `q6-4` non testé (VoiceOver). Trois demandes sur `r10-kbd-description`, trois remarques générales. Accord de Hermann : « 1. Garde le menu natif d'iOS — 2. Ok — 3. Ok ». Point de départ : `e74f85b1`.

**Diagnostic et corrections.**

- **`r10-glisser`, appui long qui fige l'écran.**
  - *Cause, démontrée par lecture du code (B.10, `e98f4341`)* : au début du glisser, la carte passait d'une enveloppe `DragShift` à une `View`. Ce changement démontait la carte sous le doigt et le geste en cours était perdu.
  - *Correction* : une seule enveloppe animée (`DragShift`, mode `follow` pour la carte portée).
  - *Test* : l'instance de la carte est identique avant et après l'appui long.
- **`r10-kbd-derniere`, dernière Phase inatteignable, le formulaire redescend.**
  - *Cause, démontrée par lecture du code* : `KeyboardAvoidingView` calcule sa réserve à partir de son cadre relatif à son parent. Depuis la couche à marge animée (`6412580b`), ce parent est la couche elle-même : la réserve était donc fausse et le bas du contenu restait sous le clavier.
  - *Cause aggravante* : chaque recadrage forçait la position de défilement (`scrollTo(bottom − viewport)`), même vers le haut.
  - *Correction* :
    - la réserve basse est mesurée dans la fenêtre (`measureInWindow`, haut du clavier), et la zone d'évitement est désactivée pour la fiche Mouvement ;
    - le défilement n'est complété que si le champ reste sous le clavier ;
    - la position de défilement est suivie (`onScroll`).
- **`r10-kbd-accessibilite`, glissement malgré « Réduire les animations ».**
  - *Cause plausible* : `ReduceMotion.System` n'a pas suffi sur l'appareil.
  - *Correction* : le hook du projet `useReduceMotion` est lu explicitement. Remontée immédiate et défilement sans animation.
- **`r10-kbd-description`, trois demandes.**
  - La remontée est limitée à ce qu'il faut pour poser l'étape en saisie (ou le bas des Phases) juste au-dessus du clavier, au plus jusqu'au bas de la zone de contexte ; au-delà, défilement.
  - Surface à 90 % (`colors.movementEditableSurface`).
  - `keyboardShouldPersistTaps="always"` sur la fiche Mouvement, hors saisie du Nom : un toucher hors d'un champ ne ferme plus le clavier.
- **Remarque 2, touche Entrée des Phases** : comme la Description, Entrée ouvre l'invite juste après la phase en cours, et la saisie y insère la phase (`moveMovementPhase`). Touche « retour » (`returnKeyType="default"`), numéros décalés sous l'invite insérée.
- **Remarque 3, toucher hors du menu Niveau ouvert.**
  - Le menu natif reste celui d'iOS ; la remarque 1 est sans suite.
  - *Correction* : l'apparition et la disparition de son contenu (`onAppear`/`onDisappear` SwiftUI sur l'entrée « Réordonner les niveaux ») affichent un voile transparent qui absorbe le toucher.
  - *Sécurité* : le voile se retire aussi au premier toucher.
  - *Hypothèse non démontrée* : SwiftUI déclenche `onAppear`/`onDisappear` à l'ouverture et à la fermeture du menu. Si ce n'est pas le cas, le comportement reste celui d'avant.

**Tests.** tsc et ESLint : OK. Tests ajoutés ou modifiés :
- `MovementCatalogueList.b5` : carte non démontée ;
- `MovementScreen.b2.integration` : Entrée des Phases, surface à 90 % ;
- `MovementLevelMenu` : visibilité du menu natif ;
- `pre4Story11Controls` : empreinte des jetons.

Suite complète `npx jest` : 207 suites, 4 640 tests, tous verts.

**Documentation.** CE-MVT-01 §10 (remontée limitée, 90 %, toucher hors champ, réduction des animations), ch.12 (jeton), ch.07 (troisième passage).

**À vérifier sur l'iPhone.**
- Appui long puis glisser dans une pile.
- Dernière étape et dernière Phase atteignables clavier ouvert, sans retour forcé.
- Remontée juste suffisante.
- « Réduire les animations » : aucun glissement.
- Toucher un titre de section : le clavier reste.
- Entrée sur une Phase au milieu de la liste.
- Menu Niveau ouvert : un toucher ailleurs ne déclenche rien.

## Quatrième passage de la recette iPhone (27/10, 19:30–20:00)

**Résultats du troisième passage.** `r11-glisser`, `r11-fond`, `r11-reduire` et `r11-toucher` sont OK. Quatre tests sont KO : `r11-remontee`, `r11-derniere` (renvoie à `r11-remontee`), `r11-entree-phases` et `r11-menu-dehors`. La remarque générale sur l'élargissement du menu Niveau est inchangée et reste sans suite : Hermann a décidé de garder le menu natif d'iOS. Point de départ : `4c44cca2`.

**Diagnostic et corrections.**

- **`r11-remontee` et `r11-derniere` : remontée insuffisante, et le formulaire redescend.**
  - *Cause, démontrée par lecture du code* : la remontée du troisième passage était recalculée à chaque changement de champ, à partir du champ actif. Elle redescendait donc quand on revenait sur la Description et ne montrait ni la ligne suivante ni les autres.
  - *Nouvelle règle, demandée par Hermann* :
    - la couche remonte jusqu'à poser le bas des Phases juste au-dessus du clavier ;
    - elle y reste tant que le clavier est ouvert, et ne redescend jamais ;
    - elle monte au plus jusqu'à la part opaque de la zone de contexte, en glissant sous son fondu (20 % de la zone) ;
    - au-delà, le contenu défile, seulement si la ligne en saisie est cachée.
  - La ligne en saisie des Phases est maintenant signalée : `onActiveRowBottomChange`.
- **`r11-remontee`, inactivité de la zone de contexte.** Clavier ouvert sur la Description ou les Phases, un voile transparent sur la zone de contexte (`movement-context-keyboard-shield`) ferme seulement le clavier. Nom, Catégorie, Zones et Niveau ne réagissent pas.
- **`r11-entree-phases` : le clavier descend puis remonte.**
  - *Cause, démontrée par lecture du code* :
    - l'invite insérée au milieu de la liste passait d'un `Fragment` à la fin de la liste, ce qui démontait son champ en pleine saisie ;
    - le retrait d'une phase vide démontait le champ qui avait le focus.
  - *Correction* :
    - lignes et invite sont dans une seule liste à clés, donc l'invite n'est jamais démontée ; elle reste sous la phase créée ;
    - le focus passe à la phase précédente avant le retrait.
- **`r11-menu-dehors` : le voile ne fonctionne qu'à la première ouverture.**
  - *Cause plausible* : SwiftUI ne rejoue pas `onAppear` sur un contenu de menu déjà créé.
  - *Correction* : à chaque fermeture, l'hôte natif du menu est recréé par une génération dans sa clé. L'ouverture suivante est donc de nouveau signalée.
  - *Hypothèse non démontrée* : la recréation rétablit le signal à chaque ouverture. Seul l'iPhone peut le vérifier.

**Tests.**
- tsc et ESLint : OK.
- Tests ajoutés :
  - `MovementScreen.b2.integration` : invite non démontée pendant la saisie et retrait d'une phase vidée ; couche jamais redescendue clavier ouvert ; voile de la zone de contexte qui ferme seulement le clavier.
  - `MovementLevelMenu` : une nouvelle génération recrée l'hôte natif.
- Suite complète `npx jest` : 207 suites, 4 643 tests, tous verts.

**Documentation.**
- CE-MVT-01 §10 : nouvelle règle de remontée et inactivité du contexte.
- ch.07 : entrée « quatrième passage » ; la règle du troisième passage est marquée « remplacé ».

**À vérifier sur l'iPhone.**
- Toucher une étape : le bas des Phases se pose juste au-dessus du clavier.
- Passer d'un champ à l'autre, ajouter des lignes : le formulaire ne redescend pas.
- Beaucoup de lignes : le formulaire monte jusque sous le fondu du contexte, puis défile.
- Clavier ouvert, toucher Nom, Catégorie, Zones ou Niveau : le clavier se ferme, rien d'autre.
- Phases : ajouter ou effacer une ligne sans que le clavier clignote.
- Menu Niveau ouvert plusieurs fois de suite : un toucher ailleurs ne déclenche rien.

## Cinquième passage de la recette iPhone (27/10, 20:43–20:44)

**Résultats du quatrième passage.** Six tests `r12-*` sont OK. Un seul est KO, `r12-limite` : à la limite haute, le contenu « ressort au doigt » (réponse de Hermann à la question de précision). Point de départ : `5eee0b99`.

**`r12-limite`, fin du contenu inatteignable.**
- *Cause, démontrée par lecture du code de React Native* : `KeyboardAvoidingView` en comportement `padding` compose toujours `paddingBottom: bottomHeight` après le style reçu, et `bottomHeight` vaut 0 quand la zone est désactivée (`KeyboardAvoidingView.js`, `render`). La réserve basse mesurée de la fiche Mouvement (`keyboardInset`, introduite au troisième passage) était donc remplacée par 0. Le défilement s'étendait sous le clavier : à la limite haute, le contenu semblait tenir dans la vue et revenait en place.
- *Attribution* :
  - défaut introduit au troisième passage (`4c44cca2`, remplacement de l'évitement relatif par une réserve mesurée) ;
  - non visible dans les tests Jest, car le bas de la couche n'y est pas mesuré ;
  - détecté sur l'iPhone au quatrième passage.
- *Correction* : aucun comportement d'évitement sur la fiche Mouvement (l'Éditeur d'Exercice reste en `padding`). La réserve mesurée s'applique donc.
- *Test* : `MovementScreen.b2.integration`, la réserve basse atteint la vue (`editor-keyboard-reserve`).

**Remarque générale, élargir le menu des niveaux.** Hermann a demandé : « On ne peut pas élargir la taille de la fenêtre ? ». Réponse : non avec le menu natif d'iOS, dont la largeur et la taille des textes sont fixées par le système. La demande est en **ARBITRAGE**, avec trois possibilités :
- A : sur iOS, remplacer le menu natif par le panneau KODJO, déjà utilisé sur Android. C'est une dérogation à la règle des primitives natives, qui exige une autorisation explicite.
- B : garder le menu natif et raccourcir les libellés.
- C : laisser tel quel.

Aucun code n'est modifié pour ce point.

**Tests.** tsc et ESLint : OK. Suite complète `npx jest` : 207 suites, 4 643 tests, tous verts.

**À vérifier sur l'iPhone.** Beaucoup d'étapes et de Phases, clavier ouvert : le contenu défile jusqu'à la dernière Phase, au-dessus du clavier, sans ressort.

## Sixième passage (27/10) — butée du défilement clavier ouvert

**Retour de Hermann.** `r13-limite` fonctionne. Nouvelle demande : en faisant défiler vers la fin, le défilement doit s'arrêter quand la dernière ligne des Phases est juste au-dessus du clavier.

**Cause, démontrée par lecture du code.** Clavier ouvert, le contenu gardait en bas la réserve de la zone d'action (`actionZone.scrollReserve`), alors que cette zone est masquée par le clavier. La dernière ligne pouvait donc monter de cette hauteur au-dessus du clavier.

**Correction.** Sur la fiche Mouvement, clavier ouvert, la réserve basse du défilement vaut l'écart au clavier (`DESCRIPTION_KEYBOARD_GAP`, 12). Clavier fermé, la réserve de la zone d'action est inchangée, tout comme l'Éditeur d'Exercice.

**Documentation.** CE-MVT-01 §10 : butée du défilement.

**Tests.**
- `MovementScreen.b2.integration` : réserve de 12 clavier ouvert, réserve de la zone d'action clavier fermé.
- tsc et ESLint : OK. Suite complète `npx jest` : 207 suites, 4 643 tests, tous verts.

**À vérifier sur l'iPhone.** Clavier ouvert, faire défiler vers la fin : le défilement s'arrête avec la dernière ligne des Phases juste au-dessus du clavier.

**Toujours en ARBITRAGE.** Le menu des niveaux : A, B ou C (voir le cinquième passage).
