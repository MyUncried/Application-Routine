# Intégration du lot 25 — réponses du lot 24, « Avant la séance » (D-577) et fin de séance (D-578 à D-581)

## Identifiant et objectif

- Intégrer dans la recette `recette/agenda-axe-20261124` :
  - `fix/recette-29-reponses` @ `96e8e714e` (réponses de Hermann aux questions du lot 24) ;
  - `feat/avant-seance-d577` @ `9829be1ad` (« Avant la séance » `19fe31e4c`, réponses de Hermann `ca4b8f63c`, fin de séance `9829be1ad`).

## Branche et commit de départ

- Base : `96e8e714e` (recette, lot 25). Branche d'intégration : `integration/recette-29` (worktree `C:\Dev\KODJO-R29`).

## Périmètre traité

| Branche | Commits | Rapport |
|---|---|---|
| `fix/recette-29-reponses` | `96e8e714e` | `2026-11-27_RECETTE-29-REPONSES.md` |
| `feat/avant-seance-d577` | `19fe31e4c`, `ca4b8f63c`, `9829be1ad` | `2026-11-27_AVANT-SEANCE-D577.md`, `2026-11-27_FIN-SEANCE-D578.md` |

## Intégration

- Fusion `--no-ff` de `origin/feat/avant-seance-d577` : aucun conflit (73 fichiers).
- Migrations : 041 et 042 identiques à celles de `recette/compte-integration-20261126` (même contenu) ; 043 (`execution_pain_readings`) et
  044 (`execution_feedback`) nouvelles. Aucune collision aujourd'hui ; si la branche Compte ajoute une migration 043, renumérotation
  nécessaire avant fusion.

## Preuves et tests

- `npx tsc --noEmit` : OK.
- Jest ciblé (`-w 1`) : `src/features/execution`, `src/infrastructure/database`, `src/features/programs`, `src/features/profile`,
  FreeExerciseScreen*, ExecutionParametersSheet.recette29, KeyboardField : 99 suites, 837 tests, 0 échec.
- Aucune de ces suites ne prouve le rendu, les gestes, le clavier ni la migration sur iPhone.

## Hypothèses non démontrées / À CLARIFIER (consolidé)

- Voir les rapports des branches. Principaux : douleur avant stockée sur chaque séance d'un parcours ; décocher « Ne plus afficher »
  retire l'exclusion (interprétation) ; libellé « …la 2ème séance » (point 6 de la liste, non confirmé explicitement) ; photo
  (nombre, aperçu, conservation) ; liste des « Valeurs saisies » ; ressenti des séances intermédiaires d'un parcours non demandé
  (CE-UI-08 l'exige à chaque fin normale) ; douleur après obligatoire avec l'option (lecture de D-427).
- Documentation D-577 / D-427 : patch préparé, non appliqué (`_bmad-output/avant-seance-d577/integration-documentaire-D-577-D-427.patch`),
  la D-577 n'existant que sur `docs/planification-grille-creneaux`.

## Éléments non corrigés / SCOPE_EXPANSION_REQUIRED

- Appareil photo : autorisation iOS absente du build (`cameraPermission: false`) → bouton grisé ; nouveau build nécessaire.
- Répétitions corrigées en fin de séance : non enregistrées (résultats d'exécution gelés, aucune API de modification).
- Police Roboto non installée (police système).

## Vérifications restant à faire sur iPhone

- Lignes du cahier de recette, sections « Réponses du 27/11 » (lot 25) et « Avant la séance / Fin de séance ».

## Fichiers modifiés

- Intégration : aucun fichier modifié hors fusion ; ce rapport.

## Commit final et état Git

Renseignés dans le message de livraison ; aucune fusion dans main (accord de Hermann requis).

## Complément du 28/11/2026 — fin de séance complète (lot 26)

- Avance rapide de `integration/recette-29` sur `origin/feat/avant-seance-d577` @ `283507bb0` (commits `ca4b8f63c`… `f7f205b72`,
  `d9f654d51`, `283507bb0` ; rapport `2026-11-27_FIN-SEANCE-D578-V2.md`).
- Contrôle de l'arbitrage A ajusté de Hermann : `execution_repetition_corrections` absente de la migration 045 (mention en commentaire
  seulement) ; `ExecutionService.ts` inchangé depuis `38e4e63a0` ; diff du moteur depuis `d9f654d51` limité à `kernel.ts` (type
  `StepResult.repetitionsDone?`) et `results.ts` (lecture).
- `npx tsc --noEmit` : OK. Jest ciblé (`-w 1`) : `src/features/execution`, `src/infrastructure/database`, `src/domain/execution`,
  `src/features/programs`, `src/features/profile`, FreeExerciseScreen*, ExecutionParametersSheet.recette29 : 117 suites, 972 tests, 0 échec.
- Build iOS `development-bmad` (autorisation de l'appareil photo, `app.json`) : `8294473e-815e-4a8a-b62b-6eb66d4e2af0`, terminé le
  28/11/2026, à partir de `f7f205b72` (seul `app.json` compte côté natif ; inchangé depuis).
- Base de données : version 45 au premier lancement. La branche Compte (dernière migration 042) devra renuméroter toute nouvelle migration.
