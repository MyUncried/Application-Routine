# Formats — réglages d'exercice, navigation, HIIT, écran des formats, remarques de Composition (D-607, D-608) — 26/11/2026

## Identifiant et objectif

- Mission : recette iPhone du 25-26/11/2026 — ligne KO `fmt-modale-rapides` du cahier (mission « appliquer D-568 à D-573 », 24 points) et « Autres remarques » a) à g).
- Décisions : D-572 et D-573 de la branche de documentation `docs/planification-grille-creneaux` (non fusionnée), renumérotées **D-607** et **D-608** (D-572/D-573 pris sur main ; collision technique). D-568 à D-570 : déjà livrées (lots 18) ; D-571 : livrée en D-606 (lot 19), son point 1 remplacé par D-608 point 1.

## Branche et commit de départ

- Branche : `feat/formats-reglages-d607-d608-20261126`, créée depuis `785ac655` (PR #461, `feat/formats-sequence-modale-20261125`, non fusionnée).
- Branches d'agents intégrées (worktrees `C:\Dev\KODJO-D607-*`) : `fix/composition-remarques-20261126` (664b03e8), `feat/formats-catalogue-modification-20261126` (c4aa976c), `feat/formats-ecran-hiit-20261126` (0b1dd9af), `feat/formats-emom-intervalles-20261126` (7555c81e), `docs/formats-d607-d608-20261126` (046603ab), `feat/formats-libre-phases-20261126` (e2097fd4). Rapports détaillés des agents : `2026-11-26_COMPOSITION-REMARQUES-A-G.md`, `2026-11-26_D607-D608-ECRAN-FORMATS-HIIT.md`, `2026-11-26_FORMATS-LIBRE-PHASES-CLAVIER-D607-D608.md` (même répertoire).

## Périmètre demandé / traité

| # | Point | État |
|---|---|---|
| 1 | Clavier ne masque jamais le champ | Fait (feuille des paramètres : réserve sous les cadres pendant la saisie) ; écran du format : à vérifier sur iPhone |
| 2 | « De chaque côté » : menu natif iOS | Fait (Enchainement par `Menu` SwiftUI d'`@expo/ui` ; déroulant PRE-7 conservé hors iOS) |
| 3 | « + Ajouter » → « + Modifier » ; 5 mouvements | Fait (plafond sur tout le format, buy-in/buy-out compris — à confirmer) |
| 4 | Catalogue en modification, zone figée ≤ 40 % | Fait |
| 5 | Carte → modale ; fermée → Composition | Fait (D-606 point 1 remplacé) |
| 6 | Ligne « N tours » + durée → page du format ; mouvement → modale → page | Fait (nombre, adjectif et durée de l'en-tête d'un Circuit issu d'un format ; la page ouvrait déjà la modale) |
| 7 | EMOM « dans chaque intervalle » : intervalle partagé | Fait |
| 8 | Titre = nom du mouvement, « … » | Fait (une ligne seulement quand c'est un nom de mouvement) |
| 9 | En-tête en dégradé, sans trait, titre 18 | Fait (couleur du format ; gris #F1F2F5 générique) |
| 10, 11 | Séquence d'ouverture, recouvrement | Déjà livrés (lot 18, OK en recette) |
| 12 | Exercice libre, coque du format | Fait (cadre Mouvement + phases, bandes, lignes 38, trois dernières lignes réunies) ; « Changer » sans action (aucun parcours) — À CLARIFIER |
| 13 | Phases « n phases » ; son par phase | Fait pour le son ; images par phase : inexistantes dans le modèle — À CLARIFIER |
| 14 | 12 formats, ordre et sous-titres | Fait |
| 15 | HIIT | Fait (migration 041) |
| 16 | Cadence rétablie | Fait (Tabata, 30/30, HIIT, Renforcement, Superset, Progression) |
| 17 | Objectif de répétitions facultatif + résultat | Objectif fait (clé `repetitionsGoal`) ; résultat après l'exécution non fait (exécution hors périmètre) — À CLARIFIER |
| 18 | Renforcement : champ valeur, validation en Durée | Fait |
| 19 | Superset : séries, « — », nom par nombre | Fait ; « Récupération après le tour » vide : le questionnaire affichait déjà « — » (à vérifier) |
| 20 | Progression sans pause globale | Fait |
| 21 | EMOM : intervalle par mouvement et par tour | Fait (modèle et écrans) ; l'exécution applique encore l'intervalle du tour 1 — À CLARIFIER |
| 22 | « Nombre de Tabata / … », Repos entre les cycles | **Non fait — À CLARIFIER** (structure non décrite) |
| 23 | AMRAP | Fait (« À l'échec » libre, « Max » renommé, Rôle partout, ligne grisée « — ») |
| 24 | For time sans Condition d'arrêt | Fait |
| a | Annuler traversé par l'axe | Fait |
| b, g | « Enregistrer » / « Fermer » | Fait |
| c | Glisser-gauche qui rebondit | Fait (origine indéterminée) |
| d | Hauteur du circuit / cycle non réajustable | **Non corrigé** : cause non démontrable dans le code — essai ciblé demandé sur iPhone |
| e | Modale inactive après une notification | Fait (cause probable, non prouvable sous Jest) |
| f | Message « nom déjà utilisé » en double | Fait |

## PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE** : feuille native des formats, hauteur et ancrage ; séquence d'ouverture et recouvrement (D-603, D-605) ; photo → fiche, déplacer / dupliquer / supprimer sur la carte ; Circuits composés à la main (stepper, menu de nature) ; repli par le nom et le chevron ; tableaux des séries, Charge Avec/Sans ; déroulant de l'Enchainement hors iOS ; comportement du 30/30 et des autres formats ; migrations 001 à 039 ; titres génériques non limités en lignes (T-61, AC7).
- **CHANGE** : points ci-dessus.
- **FORBIDDEN** (respecté) : aucune primitive native remplacée (au contraire, menu natif rétabli) ; aucun push sur main ; pas de rebase/reset/force-push ; exécution non modifiée hors signal de son de phase.
- Démonstration : 400 suites / 6 100 tests verts avant l'intégration des phases ; passe finale : 490 suites, 6 845 tests verts.

## Constats et modèle

- `ExecutionParameters.repetitionsGoal?` et `WorkPhase.soundOff?` : clés facultatives écrites seulement si renseignées (données existantes relues et réécrites à l'identique).
- EMOM : listes `intervalsSeconds` (exercice) et `windowsSeconds` (Circuit), écrites seulement si les valeurs diffèrent.
- HIIT : migration 041 (colonnes `sessions.origin` et `tours.origin_model` élargies sans reconstruction de table) ; `DATABASE_VERSION` 41 ; la recette (version 40, migration 040 d'une autre branche) passe en 41.
- D-531 (Max grisé en boucle) remplacé pour l'AMRAP.

## Preuves et tests

- `npx tsc --noEmit` : OK.
- Jest (`-w 1`), avant l’intégration de la branche phases / exercice libre / clavier : 400 suites, 6 100 tests, tous verts (séances, activités, domaine, base de données, navigation, i18n).
- Branche phases / exercice libre / clavier (e2097fd4), sur sa base : 98 suites, 1 906 tests verts (rapport de l’agent).
- Passe finale après la dernière fusion, relancée le 26/11/2026 sur `67b42a24` (`jest -w 1 --workerIdleMemoryLimit=800MB`) : **490 suites, 6 845 tests verts, 33 ignorés, aucun échec**. `tsc --noEmit` passe sur l’ensemble. [Première tentative arrêtée par le système faute de mémoire.]
- Aucun test ne remplace la vérification sur iPhone.

## Hypothèses non démontrées / À CLARIFIER (pour Hermann)

1. Point 22 : où stocker « Repos entre les cycles » ; structure « À la suite » / « En alternance » ; lien avec « Nombre de tours / séries » existants (For time, EMOM) ; valeur par défaut ; HIIT concerné ?
2. Point 17 : saisie du résultat (total de répétitions) après l'exécution — écran d'exécution hors périmètre.
3. Point 21 : exécution EMOM par tour (applique le tour 1).
4. Point 13 : images par phase (inexistantes) ; rendu de l'interrupteur de son (sans Figma).
5. Point 12 : « Changer » le mouvement d'un exercice existant (aucun parcours) ; place de « Durée de l'exercice » (absente de Figma).
6. Point 3 : 5 mouvements par format (buy-in/buy-out compris) ou par section ; la Composition limite toujours un Superset à 2 exercices (décision du 08/11).
7. Remarque d : à observer sur iPhone (voir cahier).
8. Navigation : nombre, adjectif et durée d'un Circuit issu d'un format ouvrent la page du format (le stepper et le menu de nature ne s'ouvrent plus pour ces Circuits).

## Fichiers modifiés (principaux)

`src/features/activities/ExecutionParametersSheet.tsx`, `FormatSettingsFrame.tsx`, `sheetSurface.ts`, `useSheetKeyboard.ts`, `WorkPhasesTable.tsx`, `SelectedMovementCard.tsx` ; `src/features/sessions/CompositionScreen.tsx`, `CircuitHeader.tsx`, `FormatModelScreen.tsx`, `FormatsWindow.tsx`, `FormatTables.tsx`, `formatSheetContext.ts`, `useMovementExerciseIntake.tsx`, `CreateMenu.tsx`, `carrierPresentation.ts`, `ForTimeBlocks.tsx`, `formatCatalogueSelection.ts` ; `src/shared/ui/ModalHeaderActions.tsx`, `SwipeActionsRow`, `useHostScreenFocused.ts` ; domaine (`ExecutionParameters.ts`, `ExecutionParametersDraft.ts`, `formatModels.ts`, `formats/*`, `emomIntervals.ts`, `signals.ts`, `ExecutionService.ts`) ; base (`migration041.ts`, `constants.ts`, `migrateDatabase.ts`) ; i18n fr/en ; documentation (registre ch07 D-607/D-608, Formats §§ 9.9-9.10, ch03, ch08, ch10, ch12, ch13, PRODUCT.md, DSF bouton flottant, SOURCE-SAISIE, README sessions) ; tests associés.

## Vérifications restant à faire sur iPhone

Cahier de recette, section « Formats D-607 / D-608 et remarques du 26/11 ».

## Commit final et état Git

Renseignés dans le message de livraison (commit contenant ce rapport, branche poussée, fusion de recette).
