---
title: 'Story 1.3 — Copies, duplications et Instantanés à Cibles typées'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
baseline_commit: '8133e4bb018beaf009bc0b8f6fda8c5bdeae6135'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-1.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Après la story 1.1, les copies du Catalogue vers une Séance, la duplication d'une occurrence, la réouverture d'une Copie et les Instantanés doivent conserver à l'identique les Cibles typées, le Régime, le Bip, les côtés, la Catégorie et l'ordre des Médias. Plusieurs de ces garanties ne sont pas prouvées, et quelques clonages restent superficiels.

**Approach:** Prouver par des tests nommés `PRE4-1.3/ACn` chacun des critères de la **story 1.3 (`epics-parts/epic-1.md`)**, et corriger seulement les écarts que ces preuves révèlent (AD-9, P27, P28, H11, H12, H29). Aucun nouveau parcours de duplication (P36).

## Boundaries & Constraints

**Always:**
- Clonage profond par le domaine (`cloneExecutionParameters`, `cloneTarget`) : aucune collection partagée entre une Définition, ses copies et leurs duplications, réouverture comprise.
- Les fichiers de Médias sont référencés, jamais copiés ni supprimés tant qu'une référence existe, Séances archivées comprises (H12).
- Instantanés existants jamais réécrits ; lecture versionnée v1 et v2 ; un Instantané v1 sans clé Bip se lit avec un Bip à 0 (ch. 09 l. 1156) ; aucune performance inventée.
- Une Copie à Cible `UNSET` héritée peut être ajoutée au brouillon de Composition, et `Continuer` la refuse (H29).

**Never:**
- Aucun parcours de duplication de Séance ni d'Exercice au Catalogue, aucune suppression de Définition (P36 ; AC6 et AC8 sans objet, à consigner).
- Aucun changement de `migration010`, du schéma des liens Médias ni de leurs `ON DELETE CASCADE`.
- Aucune refonte de Composition (Q4).

</frozen-after-approval>

## Code Map

- `src/domain/activities/ActivityDefinition.ts:339-366` (`activityDefinitionToDraftExercise`) -- copie vers la Séance ; vérifier que tous les champs sont clonés en profondeur.
- `src/domain/sessions/SessionDraft.ts` -- `activityToDraftExercise` (:296, `bodyZoneIds` partagé : à cloner), projection vers la persistance (:434, `asset` non cloné : à cloner), `exerciseEquals` (:323-343).
- `src/domain/sessions/composition.ts:217-247` (`duplicateActivity`) -- insertion à `index+1`, clonage profond, Récupération conservée.
- `src/features/activities/ActivitySelectionScreen.tsx:120-147` -- copie groupée en un seul `updateDraft`, dans l'ordre de `listAll` (ne pas inventer de filtre).
- `src/domain/activities/ExecutionParametersDraft.ts:194-227` (`setSeriesCount`) -- N+1 copie la dernière ligne, Cible `FAILURE` et Pause comprises.
- `src/domain/activities/exerciseSnapshot.ts` (:72-84, :91-104, :120-140) et `src/domain/activities/readV1.ts` (:109-123, clé Bip obligatoire, à rendre facultative avec 0 par défaut ; vérifier `readV1.test.ts`).
- Médias : `SqliteMediaRepository.ts` (`replaceDefinitionMediaLinks` :243-262, `listDefinitionMediaByIds` :137, `countReferences` :71-76, `replaceSessionActivityMediaLinks` :265), `LocalMediaStore.ts:99-105` (seule suppression), `ActivityMediaImportService.ts:219-236`, `MediaDraftLeases.ts:51`, `ActivityDefinitionService.ts:229-245`.
- Tests à étendre : `composition.test.ts:312-360`, `SessionDraft.test.ts:802-830`, `SqliteSessionRepository.test.ts:2200-2239`, `ExecutionParametersDraft.test.ts:124-147`, `exerciseSnapshot.test.ts`, `SqliteMediaRepository.test.ts`, `ActivitySelectionScreen.test.tsx`, intégrations `CatalogueCompositionEditFlow`, `CompositionExerciseFlow`, `ExerciseNavigationGuard`.
- Pièges : `draftMediaEqual` ne compare que les `assetId`, et `exerciseEquals` compare les Zones comme un ensemble ; pour prouver un ordre, comparer les tableaux eux-mêmes. Ne pas re-sérialiser un v1 pour prouver qu'il n'est pas réécrit : comparer la chaîne source.

## Tasks & Acceptance

**Execution:**
- [x] `SessionDraft.ts` -- cloner `bodyZoneIds` à la réouverture et l'actif de Média en sortie -- AC2.
- [x] `readV1.ts` + `exerciseSnapshot.ts` -- Bip absent d'un v1 lu à 0 ; aucune réécriture d'un v1 -- AC9.
- [x] tests nommés `PRE4-1.3/AC1` à `AC17`, sur `node:sqlite` pour la persistance et les références de fichiers ; AC6 et AC8 consignés « sans objet » dans un test ou les Implementation Notes.
- [x] tout autre écart révélé par ces tests, corrigé au plus petit.

**Acceptance Criteria:**
- Given la story 1.3 de `epics-parts/epic-1.md`, when elle est livrée, then chacun de ses critères est vérifié par un test nommé ou consigné sans objet, et `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Implementation Notes

**Corrections de production (au plus petit).**
- `SessionDraft.ts` : `activityToDraftExercise` clone `bodyZoneIds` (la Séance relue et le brouillon ne partagent plus le tableau) ; `toDraftActivityParameters` clone `bodyZoneIds` et l'actif de chaque Média en sortie (AC2).
- `readV1.ts` : option `ReadV1Options.absentBeepAsZero` (défaut `false`). `exerciseSnapshot.ts` la passe pour une enveloppe v1 : un Instantané sans clé Bip est lu avec un Bip 0 (ch. 09 l. 1156, « absent dans ancien snapshot = non cadencé »). **Écart d'exécution assumé avec la Code Map** (« clé Bip à rendre facultative ») : la clé n'est pas rendue facultative pour tous les appelants, car `readV1` doit rester à parité avec le convertisseur figé de `migration010` (clé absente = illisible, cas c2), que la story interdit de modifier. Seul le lecteur d'Instantané change de comportement. `src/domain/README.md` mis à jour.
- `ExecutionParametersDraft.ts` (`setSeriesCount`) : la ligne ajoutée à N + 1, comme une ligne restaurée après une baisse de N, ne partage plus l'objet Cible de sa source (écart AD-9 révélé par AC7 ; le comportement fonctionnel, Cible `FAILURE` et Pause copiées, était déjà correct).
- `SessionDraft.ts` (`toDraftActivityParameters`) : les paramètres d'exécution sont clonés en sortie, Exercice comme Récupération.
- `readV1.ts` : avec l'option d'Instantané, un Bip présent mais `null` est lu comme absent (Bip 0) ; sans l'option, inchangé (parité `migration010`).
- `exerciseSnapshot.ts` : des paramètres illisibles dans une enveloppe sont signalés par `ExerciseSnapshotDataError` (message d'origine conservé), plus par `ExecutionParametersDataError`.
- Outils de test : `src/infrastructure/database/testing/buildVersion9.ts` (constructeur de base v9 extrait de `migration010.test.ts`, qui l'importe désormais) et `testing/failOnWrite.ts` (échec injecté sur une écriture ultérieure de la transaction, poignée de transaction enveloppée).

**Tests nommés `PRE4-1.3/ACn`.**
- Domaine : `SessionDraft.test.ts` (AC1, AC2, AC4, AC5), `ExecutionParametersDraft.test.ts` (AC7), `exerciseSnapshot.test.ts` (AC9, AC10), `readV1.test.ts` (AC9, option limitée à l'Instantané).
- SQLite réelle `node:sqlite` : `src/infrastructure/database/__tests__/copiesAndSnapshots.story13.test.ts` (AC1, AC2, AC4, AC5, AC7, AC9 à AC17), fichiers simulés par un magasin qui compte copies et suppressions.
- Interface : `ActivitySelectionScreen.test.tsx` (AC3, ordre et échec provoqué) ; `src/features/sessions/__tests__/ExerciseEditorNoWrite.integration.test.tsx` (AC11 pour les quatre Parcours, avec ✕ de la Feuille, ✓ puis fermeture sans `Terminer` et abandon confirmé ; AC12 avec erreur injectée et Définition supprimée ; AC17 dans l'Éditeur), avec un `ActivityDefinitionService` réel sur `node:sqlite`.

**Sans objet ou limites, consignés.**
- **AC6 — sans objet** : le code de départ n'offre ni duplication de Séance ni duplication d'Exercice au Catalogue ; aucune route ni action ajoutée (P36). Les deuxième et troisième conséquences de FR-19-08 sont sans objet.
- **AC8 — sans objet** : aucune suppression ni archivage de Définition n'est exposé (`ActivityDefinitionRepository.ts:7`). Le seul cas de disparition d'une source est l'écart par `migration010`, couvert par 1.1 AC12. FR-19-06 est sans autre objet.
- AC3 : l'écran de sélection n'a pas de filtre ; « liste filtrée » est lue comme l'ordre de `listActivityDefinitions` (aucun filtre inventé). L'échec est provoqué par un identifiant indisponible à la deuxième copie ; `updateDraft` n'est pas appelé.
- AC9 : H11, aucune table d'Instantanés. « Jamais réécrit » est prouvé par l'absence de tout chemin d'écriture : seul `exerciseSnapshot.ts` crée, sérialise ou relit une enveloppe, et aucun module d'infrastructure (repositories, migrations) ne mentionne un Instantané. « Après la migration » part d'une base v9 réelle : des enveloppes v1 prises sur une Définition v9 sont relues selon leur version après `migration010`, égales aux paramètres migrés de leur source.
- AC12 : l'échec est injecté au premier lien de Média, après la mise à jour de la Définition et de ses Zones dans la même transaction ; la base relue est identique.
- AC14 : la migration est vérifiée sur une base v9 réelle (Médias d'une Définition, d'une Copie, d'une Séance archivée et un asset sans lien) ; les autres opérations sur une base déjà migrée.
- AC11 : « fermer l'application sans `Terminer` » est simulé par le démontage de l'Éditeur ; l'abandon confirmé rejoue le rappel transmis à `useCompositionExitGuard` (la garde de navigation réelle reste couverte par `ExerciseNavigationGuard.integration.test.tsx`).
- AC13 : la vignette de carte n'est pas implémentée dans le code de départ (`ActivityCard.tsx:106`, D-264). Le test prouve seulement que le premier Média relu est le premier de l'ordre affiché. Il n'y a pas d'interface d'import et de réordonnancement à piloter ici (4.4) : le test passe par `ActivityMediaImportService`, `moveDraftMedia` et le repository.
- AC14 : l'archivage d'une Séance n'a pas de parcours dans le code de départ ; il est posé par SQL (`status = 'ARCHIVED'`) pour vérifier H12.
- AC16 : les lectures n'accèdent jamais au système de fichiers. Un fichier disparu est donc sans effet sur la lecture, et aucun lien n'est supprimé.
- Rappel NFR-04 : ces tests ne valent pas recette. Les scénarios R-1.3-01 à R-1.3-03 restent à exécuter par Hermann sur l'iPhone.

## Spec Change Log

## Review Triage Log

Revue du 2026-10-16 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V). La couche V ne relève aucune lacune de vérification.

| Constat | Verdict | Preuve | Route |
|---|---|---|---|
| V-autre/E1/B1 — `executionParameters` partagé entre brouillon et entrée persistable | low | `SessionDraft.ts:428` (EXERCISE) et 414-421 (RECOVERY) passent la référence, contrairement au commentaire. | patch |
| E3/B2 — ligne restaurée qui partage sa Cible avec `hiddenRows` | low | `ExecutionParametersDraft.ts:213-216` : seul l'ajout d'une nouvelle ligne clone. | patch |
| E4 — Bip `null` d'un Instantané v1 | low | L'option ne couvre que l'absence de clé. | patch |
| E5 — erreur v1 non enveloppée | low | `exerciseSnapshot.ts:136-137`. | patch |
| E6 — fuite de la simulation de `randomUUID` | low | `ActivitySelectionScreen.test.tsx:408-412`. | patch |
| B3 — tests AC9 « jamais réécrit » tautologiques | low | Comparaison d'une chaîne avec elle-même. | patch |
| B4 — migration relancée sur une base déjà en version 10 | low | `migrateDatabase` ne fait rien sur une base v10. | patch |
| B5/B6 — échec injecté sur la première écriture ; poignée de transaction ignorée | low | L'annulation n'est pas prouvée, et l'adaptateur s'écarte du contrat d'expo-sqlite. | patch |
| B7 — AC4 accepte n'importe quelle erreur | low | `.rejects.toThrow()` sans motif. | patch |
| B8 — exception non gérée en copie groupée | low | Chemin improbable (`randomUUID` ou clonage qui lève) ; la correction ajouterait une interface d'erreur. | rejeté |
| B9 — Instantané seul non protégé d'un nettoyage | maybe-false (medium si vrai) | Aucun Instantané persisté (H11), aucun nettoyage sur ce chemin. | defer |
| B10 — nettoyage à l'abandon d'un Média importé non testé | false | Couvert par les tests PRE-3 du service (`ActivityDefinitionService.test.ts:218-233`, AC15). | rejeté |
| B11 — AC17 dans l'Éditeur sans Cible `FAILURE` | low | Le cas « tout à l'échec » est vérifiable dès maintenant. | patch (test) |
| B12/B13 — formulations du contexte d'epic | low | « Livrées » et hypothèses sans référence. | patch documentaire (fait) |
| B14 — spec non suivie par Git, « sans objet » invisible | false | La spec est commitée avec la story ; AC6 et AC8 figurent dans ses Implementation Notes. | rejeté |

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
- Fins de ligne : un fichier existant garde ses fins de ligne d'origine (CRLF ou LF) ; vérifier avec `git diff --stat` qu'aucun fichier n'apparaît réécrit en entier.
