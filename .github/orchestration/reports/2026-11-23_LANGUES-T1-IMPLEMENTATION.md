# 2026-11-23 — LANGUES-T1-IMPLEMENTATION : externalisation des textes

## Identification

- **Mission** : lot T1 du chantier langues, approuvé par Hermann (« T1 approuvé »), et correction de deux fautes (« Corrige les deux fautes »).
- **Plan** : `docs/preparation/langues/T1-PLAN-EXTERNALISATION-TEXTES-2026-11-23.md`
- **Branche** : `claude/exciting-lovelace-iyn2wf`
- **Commit de départ** : `f747c80`

## Périmètre

- **Demandé** :
  - plan T1, groupes E (Exécution), B (Bibliothèques) et D (divers) ;
  - garde-fou ;
  - deux fautes.
- **Traité** : tout, avec les écarts listés plus bas.

## Modifications réalisées

1. **Fautes (`dac793e`)** — « Passer à l'exercice suivant ? » et « … avec l'exercice suivant, … ».
   - Corrigées dans `executionStrings.ts` et dans le contrat d'écran du chapitre 13, texte d'origine conservé en annotation.
   - Synchronisation code/doc : classe **B**. Les titres de section des chapitres 03 et 10 et de l'annexe, qui contiennent la même faute, ne sont pas modifiés : changer un titre casse les liens d'ancre.
2. **Groupe E (`6b18a2c`)**
   - `executionStrings` devient `strings.execution` (`resources/frExecution.ts`), à l'identique. Seul `formatClock` reste dans `src/features/execution/executionStrings.ts`.
   - Les annonces vocales d'`ExecutionSignalAdapter` passent dans `strings.voice`.
3. **Groupe B et garde-fou (commit final)**
   - 312 textes vont dans `strings.libraries` (`resources/frLibraries.ts`), sous 16 groupes. Fichiers concernés : `LibraryScreens`, `PersonalLibraryScreens`, `libraryPresentation`, `ProfileLibrariesSection`, `ImportedMovementBadge`, `importedMovements`, et les dialogues de `MovementCatalogueList`.
   - Garde-fou `src/shared/i18n/hardcodedUserText.test.ts`, avec ses exclusions motivées.
   - Les noms saisis par l'utilisateur sont insérés par substitution en fonction (`fillTemplate`, `() => nom`), pour qu'un nom contenant `$&` ne soit pas altéré.
   - Synchronisation code/doc : classe **A** (conformité à RM-092 et D-081) ; aucune documentation modifiée.

## Écarts au plan approuvé

- **Groupe D réduit à zéro :**
  - les textes de `SessionFilterSheet` sont des libellés de `console.error` ;
  - « échec » de `formatTimeline` appartient au domaine. Le domaine ne peut pas importer le catalogue, car `build-domain.mjs` refuse les imports externes ;
  - le message de `SqliteCatalogueRegistry` est une `Error` technique ;
  - « coupé / activé » d'`ExecutionScreen` est un journal de développement ;
  - `KodjoSplash` est laissé : `visualAssets.test` vérifie le texte dans la source, et modifier son attente est interdit. Il passe en exclusion, à traiter au lot T2.
- **Domaine :** `duplicateLibraryTitleMessage` reste dans le domaine pour le message d'`Error`. L'écran utilise la clé du catalogue avec le même nom normalisé, pour un rendu identique.
- **Garde-fou :** il ne couvre pas `src/domain/` (phrase de synthèse et référentiels : lots T6 et T7).

## Preuves et tests

- Référence avant T1 (worktree à `dac793e`) : **398 suites, 6 167 tests passés, 32 ignorés**.
- Après T1 : **399 suites, 6 168 tests passés, 32 ignorés**. La suite en plus est le garde-fou. Aucune attente de test existante n'a été modifiée ; seul le chemin d'import d'`executionStrings.ordinal.test.ts` change.
- `npx tsc --noEmit -p .` : 0 erreur. `eslint` sur les fichiers touchés : 0 erreur, 0 avertissement.
- **Identité :**
  - Exécution : le bloc déplacé est identique, octet pour octet.
  - Annonces : 78 cas comparés entre l'ancienne et la nouvelle version (objectifs, durées, phases, côtés), plus les tests existants de l'adaptateur.
  - Bibliothèques : chaque fragment retiré est retrouvé tel quel dans `frLibraries.ts` (script de l'agent).

## Hypothèses non démontrées

- Le contrôle d'identité des Bibliothèques porte sur les fragments de texte, pas sur le rendu de chaque combinaison de valeurs. Les tests d'écran existants restent verts.

## À vérifier sur iPhone

Les écrans suivants ne doivent présenter aucun changement visible ou audible, hors dialogue corrigé :
- Profil › Bibliothèques (ajout, appairage, aperçu, installation) ;
- Bibliothèques personnelles ;
- badge des Mouvements importés ;
- archivage d'un Mouvement de bibliothèque ;
- Exécution : dialogues et annonces vocales.

Le dialogue « Passer à l'exercice suivant ? » affiche désormais le texte corrigé.

## Fichiers modifiés

`src/shared/i18n/{index.ts, resources/frExecution.ts, resources/frLibraries.ts, hardcodedUserText.test.ts}`, `src/features/execution/{executionStrings.ts, ExecutionScreen.tsx, ExecutionClosureSheet.tsx, ExecutionPartialRepetitionsSheet.tsx, ExecutionRecoveryGate.tsx, RepetitionsWheel.tsx, __tests__/executionStrings.ordinal.test.ts}`, `src/infrastructure/haptics/ExecutionSignalAdapter.ts`, `src/features/catalogue/{LibraryScreens.tsx, PersonalLibraryScreens.tsx, libraryPresentation.ts, ProfileLibrariesSection.tsx, ImportedMovementBadge.tsx, importedMovements.ts}`, `src/features/activities/MovementCatalogueList.tsx`, `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`, présent rapport.

## Commit final et état Git

Voir le commit qui contient ce rapport sur `claude/exciting-lovelace-iyn2wf`.

## Complément — cahier de recette BMAD

Cahier de recette iPhone : `_bmad-output/langues/implementation-artifacts/recette-iphone-langues-t1.md` (23 cas, OK/KO), à exécuter par Hermann.
