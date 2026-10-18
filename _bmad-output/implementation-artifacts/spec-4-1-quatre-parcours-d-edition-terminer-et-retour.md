---
title: 'Story 4.1 — Quatre Parcours d''édition, Terminer et retour'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: '46abbb5a4140a94caf9d0502c019ac53acadabb5'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-4.md'
  - '{project-root}/_bmad-output/implementation-artifacts/bilan-ecarts-2026-10-17.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les quatre Parcours d'édition existent déjà dans un Éditeur unique. Deux écarts restent :
- au Catalogue, `Créer` ouvre une liste d'options au lieu de l'Éditeur ;
- les garanties des AC ne sont pas toutes prouvées par parcours.

**Approach:** Implémenter la **story 4.1 (AC1 à AC13, `epics-parts/epic-4.md`)**, avec les décisions de Hermann du 2026-10-17 :
- **Q33** : sur le segment Exercices, `Créer` ouvre directement l'Éditeur ; les autres segments gardent la liste d'options existante.
- **Q34** : le bouton Lecture reste désactivé ; on vérifie que son appui n'ouvre pas l'Éditeur.

Le travail se limite à l'écart du bilan approuvé : la branche directe de `Créer`, puis les preuves. L'aiguillage existant et Composition ne sont pas touchés.

**Dépendance à la story 3.3, levée par Hermann le 2026-10-17** (« avance sur la partie indépendante de la story 4.1 ») :
- tout ce qui ne dépend pas des popovers de la Feuille est fait ici ;
- la saisie d'une Cible à l'échec par l'interface n'existe qu'à partir de la story 3.4 : l'AC10 part donc d'un Exercice **déjà enregistré** à Cibles mixtes, puis exerce les bascules disponibles (Mode, déplacement, N) ;
- la reprise de l'AC10 par la saisie, après les stories 3.3 et 3.4, est inscrite dans les travaux reportés.

## Boundaries & Constraints

**Always:**
- Réutiliser l'aiguillage d'`ExerciseScreen` (routes `catalogueDefinitionId` / `exerciseId`), `ActivityEditorForm`, `ExecutionParametersSheet`, les verrous contre le double appui, la garde de sortie, `ExerciseExitConfirmModal` et le flux de Composition `Un nouvel exercice` / `Un exercice existant` / `Annuler`.
- Q33 : la branche directe ne vaut que pour le segment Exercices. `CatalogueCreateOptions` reste inchangé et sert toujours aux autres segments. Au retour avant validation, le segment, les filtres et le défilement sont restitués, avec le mécanisme existant de la liste d'options s'il y en a un.
- Q34 : le bouton Lecture de `ActivityCard` reste désactivé ; un test vérifie que son appui n'ouvre pas l'Éditeur.
- Tests d'intégration (`*.integration.test.tsx`) nommés `PRE4-4.1/ACn` :
  - un par parcours (CC, MC, CS, MS) pour l'AC6 et l'AC8 ;
  - le double appui sur `Créer` ;
  - la restauration du Catalogue ;
  - l'appui court et l'appui long dans Composition ;
  - `Un nouvel exercice` ;
  - l'isolation dans les deux sens ;
  - la relecture typée (AC10) ;
  - l'absence de Récupération ;
  - la source supprimée ;
  - l'absence des mots « Circuit » et « Tour » dans l'Éditeur et la Feuille.
  
  Le modèle de l'AC12 se teste au domaine. Réutiliser les tests existants qui couvrent déjà un critère (`ExerciseNavigationGuard`, `CompositionExerciseFlow`, `ExerciseEditorNoWrite`, `CatalogueCompositionEditFlow`), en les complétant sans les dupliquer.
- Le helper partagé `src/features/activities/testing/executionSheetActions.ts` (`chooseExecutionMode`) sert au choix du Mode dans les tests.

**Never:**
- Aucun nouveau parcours de création ou de duplication. Aucun point d'entrée ajouté ni retiré en Composition. Pas d'arbitrage de D-194.
- Aucun changement visuel de l'écran (4.2), aucun libellé « Un circuit » modifié, aucun moteur d'Exécution.
- Aucun texte nouveau pour l'échec d'enregistrement : le texte du code de départ s'applique (AC13).

</frozen-after-approval>

## Code Map

- `src/features/sessions/CatalogueScreen.tsx:163-174` (et ses états d'ouverture) : `Créer` ouvre `CatalogueCreateOptions` quel que soit le segment. Ajouter la branche directe pour le segment Exercices, avec la même navigation que l'option « Un nouvel exercice » et le même verrou contre le double appui. Lire les commentaires l.50-58 et l.91-93 sur le segment et sa restitution.
- `src/features/activities/CatalogueCreateOptions.tsx` : inchangé.
- `src/features/activities/ActivityCard.tsx:~154-164` : bouton Lecture désactivé (Q34).
- `src/features/sessions/ExerciseScreen.tsx:202-210` (aiguillage), `handleFinish` (l.~323), `patchLocal` (l.~522) : réutilisés tels quels.
- `src/features/sessions/CompositionScreen.tsx` : `:452` (appui court, MS), `:948-970` (choix CS), `:1741` (appui long réservé au réordonnancement). Lecture et tests seulement.
- Tests existants à compléter :
  - `src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx` ;
  - `CompositionExerciseFlow.integration.test.tsx` ;
  - `ExerciseEditorNoWrite.integration.test.tsx` ;
  - `CatalogueCompositionEditFlow.integration.test.tsx` ;
  - `CatalogueScreen.test.tsx` ;
  - `CompositionScreen.test.tsx:2029+` (appui long).
- `docs/preparation/PRE-4/bmad/recette-iphone.md` : ajouter un §4.4 « Éditeur (Epic 4) » avec R-4.1-01 à 05, dans le format des sections précédentes.

## Tasks & Acceptance

**Execution:**
- [x] `CatalogueScreen.tsx` -- branche directe de `Créer` sur le segment Exercices (Q33), liste d'options conservée ailleurs -- AC1, AC2.
- [x] Tests `PRE4-4.1/AC1` à `AC13`, selon la liste ci-dessus ; l'AC10 sur un Exercice enregistré à Cibles mixtes.
- [x] `recette-iphone.md` §4.4 -- R-4.1-01 à 05.
- [x] `deferred-work.md` -- AC10 à rejouer par la saisie des Cibles à l'échec après les stories 3.3 et 3.4.

**Acceptance Criteria:**
- Given la story 4.1 de `epics-parts/epic-4.md` et les décisions Q33 et Q34, when elle est livrée, then chacun de ses critères AC1 à AC13 est vérifié par un test nommé, et `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Implementation Notes

- `CatalogueScreen.tsx` : `handleCreatePress` ouvre l'Éditeur (`/exercise?catalogueDefinitionId=new`) sur le segment Exercices, la liste d'options ailleurs ; navigation partagée avec l'option `Un nouvel exercice` (`openNewExerciseEditor`), verrou `useRef` (`isOpeningEditorRef`) partagé avec l'ouverture d'une carte Exercice (MC), armé au premier appui et réarmé au focus suivant. Restitution : le Catalogue reste monté sous l'Éditeur (pile racine) ; `useActivityCatalogue.reload` garde la liste prête pendant le rechargement du focus au lieu de repasser par « loading », qui démontait la `FlatList` et perdait le défilement (constaté par le test de restitution). Filtre : la commande `Filtrer` est inerte dans le code de départ, aucun état de filtre n'existe à restituer.
- Tests d'intégration : `src/features/sessions/__tests__/ExerciseEditingPaths.integration.test.tsx` (vrai navigateur, vraies routes, racine en `Stack` comme `app/_layout.tsx`, SQLite `node:sqlite`). `renderRouter` active les minuteries simulées : `settle` avance le temps (`advanceTimersByTimeAsync`). `getSearchParams` hérite du `sessionId` de Composition ; le contexte d'ouverture est comparé sur `catalogueDefinitionId` / `exerciseId` seulement.
- AC10 : Zones comparées comme ensemble (l'Éditeur les relit dans l'ordre du référentiel). CC et CS sans Cible à l'échec ni Médias : report inscrit dans `deferred-work.md`.
- AC12 (modèle) : test `PRE4-4.1/AC12` dans `src/domain/activities/__tests__/ExecutionParametersDraft.test.ts`, en complément de `PRE4-3.2/AC14`.
- AC13 : Définition supprimée couverte par le test existant `PRE4-1.3/AC12` d'`ExerciseEditorNoWrite`, renommé `PRE4-1.3/AC12, PRE4-4.1/AC13` et complété par le texte d'erreur du code de départ. Copie : en MS, `Terminer` n'écrit que le Brouillon de Composition (P8) ; l'écriture, et donc l'erreur, n'a lieu qu'à l'enregistrement de la Séance (`Continuer`, puis `Enregistrer` sur Catégories de la séance). Défaut corrigé (décision du 2026-10-17) : `mergeActivities` recréait sans erreur une Copie supprimée pendant l'édition. `toSessionDraft` renseigne désormais `SessionDraft.persistedExerciseIds` (occurrences chargées), champ de transport non persisté et ignoré par `sessionDraftsEqual` ; `toUpdateSessionInput` le transmet en `UpdateSessionInput.persistedActivityIds`. `SqliteSessionRepository.update` vérifie, avant toute écriture, qu'aucune occurrence listée n'a disparu ; sinon il rend `{ status: "ACTIVITY_NOT_FOUND" }` (nouvelle branche de `UpdateSessionOutcome` et `UpdateSessionResult`), sans rien écrire. `CategoriesScreen` traite déjà tout résultat autre que `UPDATED` comme échec : texte `saveError` existant, Brouillon conservé. Les occurrences nouvelles (CS, duplication, ajout depuis le Catalogue) restent insérées. Aucune migration. Tests : `PRE4-4.1/AC13` (intégration, repository).
- AC4 (appui long) : complète `CompositionScreen.test.tsx` par le parcours réel ; AC5 : complète `CompositionExerciseFlow`.

## Spec Change Log

## Review Triage Log

Revue du 2026-10-17 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V). V : aucune lacune ; une remarque sur un JSDoc mal placé.

| Constat | Verdict | Preuve | Route |
|---|---|---|---|
| E1/B10 — verrou contre le double appui limité à `Créer` : `Créer` puis carte → deux Éditeurs | low | `CatalogueScreen.tsx:112-118` | patch (verrou partagé) |
| B10 — verrou jamais réarmé si `push` échoue ; réarmé par un changement de paramètre | low | Cas improbables ; le réarmement au focus est testé | rejeté (faible, garde superflue) |
| B2 — restitution du filtre et du défilement non testée | low | AC1, AC2 | patch (tests) |
| B3 — titre AC13 sans l'assertion du texte | medium | L'assertion est dans le test voisin | patch |
| B4 — AC13 Copie : Séance supprimée au lieu de la Copie ; déclencheur non conforme | medium | En MS, `Terminer` n'écrit que le Brouillon (P8) : l'erreur arrive à `Continuer` | patch (test et note) |
| B5 — `dump()` omet des tables | medium | Écriture prématurée des Zones d'une Copie non détectée | patch |
| B6 — AC10 : ordre des Médias et Catégorie non comparés | low | `expect.any` | patch |
| B7 — AC5 : position non vérifiée | low | `toContain` | patch |
| B8 — AC4 : réordonnancement non constaté | low | Couvert par `CompositionScreen.test.tsx` | patch (assertion ou renvoi) |
| B9 — tests réécrits plutôt qu'étendus | low | Fichier d'intégration consolidé par parcours ; aucun dommage nommé | rejeté |
| B11 — AC11 CC : Feuille non balayée | low | | patch |
| E3 — AC12 « Circuit/Tour » vérifié en MC seulement | low | | patch |
| B12 — AC12 modèle : indicateur non vérifié sur `created` ni à la sérialisation | low | | patch |
| B13/V — JSDoc orphelin | low | | patch |
| B14 — incohérences de la recette §4.4 | low | R-4.1-01, R-4.1-05 | patch |
| E2 — AC10 en CC/CS sans Cibles mixtes | low | Prévu par la spec (saisie de « à l'échec » après 3.3/3.4) ; consigné dans `deferred-work.md` | rejeté (déjà reporté) |
| E4 — l'option « Un nouvel exercice » hérite du verrou | false | Le verrou est réarmé au focus ; testé (`CatalogueScreen.test.tsx:458-476`) | rejeté |
| B1 — patch sans `deferred-work.md` ni la spec | false | Fichiers de l'orchestrateur, hors code revu | rejeté |

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
