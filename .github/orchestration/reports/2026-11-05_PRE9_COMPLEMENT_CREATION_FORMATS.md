# 2026-11-05 — PRE-9 — Évolution « Complément parcours de création et Formats » (5 novembre 2026)

## Identifiant et objectif

- **Mission** : `PRE9_COMPLEMENT_CREATION_FORMATS`.
- **Objectif** : adapter le parcours de création, les écrans des Formats et leurs règles de gestion à la documentation actualisée de `main` @ `aab49948` (complément du 5 novembre 2026), après la recette terminée des Formats ; sans réinitialiser les stories recettées ; sans développer le moteur PRE-10/11.

## Branche et commit de départ

- Branche : `pre9-bmad/dev`.
- Départ : `303c7e4b` (fin de la contre-recette du 05/11).
- Fusion de `main` `aab49948` : commit `20a8f313` (conflits documentaires résolus : texte de `main` retenu pour les règles ; annotations de recette de Hermann conservées à la suite ; incrément de charge EMOM négatif annoté remplacé). Le `CLAUDE.md` local, équivalent à celui de `main` à un saut de ligne près, est conservé dans le stash `CLAUDE.md local (version main à un saut de ligne près) avant fusion aab49948`.

## Périmètre demandé

Les huit évolutions de la demande du 05/11/2026 (création commune, menu Créer, charges, AMRAP, Superset, EMOM, Death by, présentation et paramètres partagés), avec analyse d'impact ciblée, données, validations, capacités et instantanés concernés ; tests ciblés ; suivi PRE-9 ; arrêt pour une recette ciblée.

## Périmètre réellement traité

Tout le périmètre demandé, au niveau Configuration et Composition (PRE-9). Détail et classement A/B/C/D : `_bmad-output/pre9/implementation-artifacts/spec-complement-creation-formats-2026-11-05.md`. Décisions de Hermann prises pendant la mission (récapitulatif « si tableau » ; incrément AMRAP non saisi vide et rouge) : registre ch07, « Complément du 5 novembre 2026 — réalisation PRE-9 ».

## Constats

1. **Contradictions réelles** entre les annotations de recette (04–05/11) et le complément : récapitulatif des modèles sans tableau ; affichage de l'incrément AMRAP non saisi — soumises à Hermann, tranchées.
2. **EMOM « dans chaque intervalle »** : la référence garde « Circuit porteur de N tours groupés » et impose des prescriptions par série (§17). Choix : chaque membre porte N séries, le tour k joue la série k (comme le For time), sans N×N — interprétation consignée (classe C).
3. **Contrôle EMOM** : la validité (D.4), la feuille des paramètres et le récapitulatif ne vérifiaient que la première série ; désormais chaque série/fenêtre.
4. **Écarts documentaires de `main`** non corrigés ici (documentation propre à `main`) : listés au § 5 de la spec du lot (ch13 l. ≈ 5898, ch08 l. ≈ 955, restes de l'ancien menu, Formats §12 un mouvement, validité/capacités non mises à jour).

## Preuves et tests

- `npx tsc --noEmit` : sans erreur.
- ESLint (fichiers touchés) : aucune nouvelle erreur ; les erreurs « Cannot access refs during render » de `FormatModelScreen` et `CompositionScreen` préexistent.
- Tests ajoutés : `src/domain/sessions/__tests__/formats.complement0511.test.ts` (20), `app/__tests__/compositionCreateEntry.test.tsx` (5), `FormatModelScreen.c3` (charges, Superset, clavier), `FormatsWindow.c2` (Exercice libre), `ExerciseSheet` (« Dans cette séance »), `CompositionScreen*` (menu à trois options, œil retiré).
- Tests adaptés, règle remplacée citée en commentaire : `formatModels.c3`, `formatModels.reprise0411`, `formatModels.recette0411`, `configurationValidity.d4`, `formatKeyboard.recette0411`, intégrations `CompositionMovementFlow`, `ExerciseEditingPaths`, `ExerciseRecovery`, `movementPhaseDurations.a2b`, `CatalogueLifecycle.e7`, `CatalogueScreen`. Tests supprimés avec le comportement retiré : `CircuitVolumesSheet`, `circuitVolumesPresentation`, bloc « Volumes du circuit » de `CompositionScreen.test`, parcours « Utiliser un mouvement existant » du menu.
- Suites ciblées : domaine 1 947 tests verts ; séances et activités : voir la suite complète ci-dessous.
- **Suite complète** : lancée le 05/11 après les derniers changements, **interrompue par Claude Code faute de mémoire sur le poste** (arrêt automatique pendant l’inactivité de la session) ; non rejouée. Exécutés et verts : tout le domaine (`src/domain`, 1 947 tests), et les suites séances touchées (`FormatModelScreen.c3`, `CompositionScreen.test`, `.b1b`, `.b2`, `ExerciseSheet`, `FormatsWindow.c2`, `CatalogueScreen`, `CatalogueLifecycle.e7`, intégrations `CompositionMovementFlow`, `ExerciseEditingPaths`, `ExerciseRecovery`, `movementPhaseDurations.a2b`, `formatKeyboard.recette0411`, `formats.recette0511`, `compositionCreateEntry`). À rejouer : `npx jest --maxWorkers=2`.

## Hypothèses non démontrées

- Rendu et gestes sur iPhone : non vérifiés (feuilles natives, cadres, boutons « (+ kg) », barre « ± », présentation de la modale depuis le Catalogue).
- Présentation de la modale de création depuis le Catalogue : la Composition du nouveau brouillon s'affiche brièvement derrière la feuille (fond représenté par Figma `9977:19613`) ; à confirmer en recette.
- Fermeture de la feuille par glissement natif : non garantie (choix antérieurs `gestureEnabled: false`).

## Modifications réalisées

- **Création** : `FormatsWindow` = modale « Créer un exercice » (Exercice libre + Formats) ; Catalogue « Créer » → `/composition?create=1` qui présente la modale ; retour sans contenu → Catalogue ; menu Créer à trois options ; œil et `CircuitVolumesSheet` retirés ; fiche de l'Exercice « Dans cette séance ».
- **Domaine Formats** (`formatModels.ts`, `formatReedit.ts`, `formatTimeline.ts`) : charges par mouvement (`loadOn`) et restauration dans le brouillon ; AMRAP signé et borné (`amrapRoundTarget`) ; EMOM et Superset par série (`cells`, `withSeriesValue`) ; Superset alterné 3 tours, récupération du dernier ; Death by Répétitions/Durée et avertissement ; Tabata/30/30/Renforcement/À l'échec par mouvement.
- **Règles transverses** : registre (incrément AMRAP sans minimum, Death by en unité d'objectif), validité (EMOM par rang, Death by en Durée admis), plan (EMOM série k au tour k), appartenance aux porteurs (séries EMOM conservées, mode Death by conservé), capacités (`prescription`, `INTERVAL_LIMIT_REACHED`), contrat `deathByLimit.ts`.
- **Interface** : tableaux en cadres (`tableFrame`), `SeriesTable` EMOM/Superset, `ObjectivePauseTable`, colonne Charge (AMRAP, Death by), « (+ kg) » / « (− kg) », valeurs « (12 kg) » / « (—) », ligne Charge d'un mouvement seul, « ± » sur l'incrément AMRAP, unités Death by au clavier, « + Ajouter » du Superset désactivé à deux, ordre de Suivant à travers les cadres, feuille des paramètres (incrément signé, contrôle EMOM par rang).
- **Documentation** : ch07 (décisions du 05/11), spec du lot, `sprint-status.yaml` (`evo-complement-0511-creation-formats: review`).

## Éléments non corrigés ou hors périmètre

- **Moteur PRE-10/11 (différé)** : arrêt du Death by avant un rang incompatible, résultat « limite de l'intervalle atteinte », durée tenue d'une fenêtre tentée ; exécution des prescriptions EMOM par série et du plancher AMRAP. Contrat et tests préparés (`deathByLimit.ts`), **aucune exécution livrée**.
- Écarts documentaires de `main` (spec du lot § 5) : à corriger dans `main` par Hermann.
- Interprétations à confirmer (spec du lot § 3).
- `CLAUDE.md` de `main` exige ce rapport dans `.github/orchestration/reports/` ; l'ancien `CLAUDE.md` du clone interdisait `.github/`. Le fichier de `main` (désormais celui de la branche) est appliqué ; à confirmer par Hermann.

## Vérifications restant à effectuer sur appareil réel

1. Catalogue des séances → Créer : modale « Créer un exercice » (Exercice libre pleine largeur, grille) ; croix → retour au Catalogue, aucune Séance créée ; Exercice libre → fiche de création → Composition d'une nouvelle Séance avec l'Exercice ; un Format → questionnaire → (récapitulatif) → Composition d'une nouvelle Séance ; quitter sans enregistrer → confirmation d'abandon.
2. Composition → menu Créer : trois options, axe jusqu'à « Créer un cycle » ; plus d'œil dans la zone de contexte ; « Créer un exercice » → même modale.
3. Photo d'une carte d'Exercice : « Fiche de l'exercice », section « Dans cette séance » (Phrase + Récupération) sous la photo.
4. « Avec charge » dans les dix questionnaires ; « (+ kg) » sous l'unité (Progression, For time, Superset, EMOM) ou dans la colonne Charge (AMRAP, Death by, Tabata…) ; « (− kg) » puis « (+ kg) » retrouve la valeur ; cases vidées → ligne retirée à la fermeture du clavier.
5. AMRAP Volume croissant : « ± » dans la barre sur Par tour, « − 2 » ; Déroulé 5, 3, 1, n.
6. Superset : 3 tours, « Récupération après le tour », « + Ajouter » grisé à deux ; tableau par tour, Tour 1 recopié ; rouvrir après avoir ajouté un troisième exercice dans la Composition.
7. EMOM : tableau Unité | S1…Sn ; S1 recopiée ; 30 s + 30 s dans un intervalle de 1 min → message et cases rouges, enregistrement bloqué.
8. Death by à deux mouvements, un en Durée (10 s, + 10 s) ; colonne Charge ; premier rang ≥ intervalle → avertissement, enregistrement possible.
9. Tabata / 30/30 / Renforcement / À l'échec à deux mouvements : récapitulatif avec tableau Objectif | Pause | Charge ; à un mouvement : enregistrement depuis le questionnaire, ligne Charge.
10. Non-régression : Progression 10/12/14, For time 21/15/9, clavier et Suivant, réédition d'un Circuit (« Modifier le format »).

## Fichiers modifiés

Voir `git show --stat` des commits ci-dessous (code : `app/(creation)/composition.tsx`, `formats-window.tsx`, `src/features/sessions/{FormatsWindow,CreateMenu,CompositionScreen,CompositionContextHeader,CatalogueScreen,ExerciseSheet,FormatModelScreen,FormatTables,formatSheetContext}.tsx/ts`, `src/features/activities/{ActivityEditorForm,FormatSettingsFrame,ExecutionParametersSheet}.tsx`, `src/domain/sessions/{formatModels,formatReedit,formatTimeline,configurationValidity,carrierMembership,planExpansion,deathByLimit}.ts`, `src/domain/sessions/formats/{registry,capabilities}.ts`, `src/shared/i18n/{index,resources/fr}.ts` ; supprimés : `CircuitVolumesSheet.tsx`, `circuitVolumesPresentation.ts` et leurs tests ; documentation : ch07, spec du lot, `sprint-status.yaml`, ce rapport).

## Commit final et état Git

Renseignés dans le message de livraison de la mission (commit contenant ce rapport) ; aucun push, aucune fusion dans `main`.
