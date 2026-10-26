---
title: 'A1.2 — Schéma 012, transition et repositories'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: 'df3d027df45086168c344b95a6f994bbb57e1fdb'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/implementation-artifacts/epic-A1-context.md'
  - '{project-root}/src/infrastructure/database/README.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le schéma v11 aplatit le contenu du geste dans `activity_definitions` et ne garde aucune filiation des occurrences (`activities`) : le domaine MFN d'A1.1 (Mouvement, paramètres Catalogue v4, frères incomplets) n'a ni stockage ni repository, et D-440 assouplie (ch07 l.27, ch10 l.468, ch12 l.241) impose une transition ponctuelle par la migration 012.

**Approach:** Migration 012, versionnée, exécutée une seule fois dans la transaction exclusive de `migrateDatabase.ts` : elle supprime les Exercices, Séances et leurs associations, recrée les tables MFN (`movements` et ses phases, zones et médias, `activity_definitions.movement_id` intègre, `activities.source_movement_id` non nul sans contrainte), conserve Profil, Catégories et Zones corporelles avec leurs personnalisations et dépose un avis `migration_notices`. Un `SqliteMovementRepository` et les repositories de définitions, de médias et de séances adaptés persistent le Mouvement, la v4 Catalogue et la forme résolue v4 des copies. L'application reste utilisable de bout en bout.

## Boundaries & Constraints

**Always:** décision de Hermann du 24/10 : conserver `users`, `profiles`, `categories`, `body_zones` (créations, renommages, retraits) ; supprimer une seule fois Exercices, Séances et associations (zones, médias, occurrences, points d'arrêt) ; intégrité référentielle vérifiée (`foreign_key_check` vide) ; avis seulement si quelque chose a été supprimé ; aucune réinitialisation aux lancements suivants ; un échec annule tout et laisse `user_version` à 11. Aucun ORM, tout accès par les repositories ; cas métier attendus en unions discriminées ; `movementId` obligatoire et intègre, `sourceMovementId` non nul, immuable, sans clé étrangère ni lecture de contenu ; compteur de phase alloué par le Mouvement, jamais réutilisé ; aucune lecture v2/v3 dans la persistance après 012 ; trois contrôles verts au commit.

**Never:** modifier `migration001.ts` à `migration011.ts`, `tokens.ts`, `package.json`, `app.json`, `.github/`, `main` ; services d'origine (même geste / variante), correction partagée des frères, liste regroupée, instantané (A1.3) ; interface MFN (A2–A4) ; affaiblir un test (les tests 001–011 restent valides, au besoin arrêtés à la version 11) ; charger quoi que ce soit sur un appareil (JA1).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Base v11 peuplée | Profil personnalisé, Catégories et Zones créées / renommées / retirées, Étiquettes, Exercices, Séances, médias | v12 : Profil, Catégories, Zones, Étiquettes identiques ; aucune définition, séance, occurrence, lien ni asset ; un avis `EXERCISES_AND_SESSIONS_RESET` | erreur injectée → rollback, `user_version` 11, données intactes |
| Installation neuve / base v11 vide | rien à supprimer | v12, aucun avis | N/A |
| Second lancement | base v12 avec données recréées | aucune suppression, aucun nouvel avis | N/A |
| Création Catalogue | définition à phases [6, 3] | 1 Mouvement (contenu, structure, compteur 3) + définition v4 ; relue identique | catégorie inconnue → rollback complet |
| Phase retirée puis ajoutée | structure [1,2,3] → [1,2] → [1,2,+] | la phase ajoutée reçoit 4, jamais 3 | N/A |
| Frère incomplet relu | v4 avec durée `null` | définition lue, `missingPhaseIds` renseigné | structure ≠ valeurs → `ExecutionParametersDataError` |
| Suppression d'un Mouvement référencé | ≥ 1 définition | `REFERENCED` avec le nombre, rien supprimé | N/A |
| Occurrence depuis le Catalogue / dupliquée | `sourceMovementId` porté | écrit tel quel, conservé à la mise à jour | N/A |
| Création locale en Séance | occurrence sans filiation, Catégorie et Zones | Mouvement local créé dans la transaction de la Séance, filiation = son id | N/A |

</frozen-after-approval>

## Code Map

- `src/infrastructure/database/migrateDatabase.ts` -- runner ; ajouter l'étape 11 → 12 et un `targetVersion` (défaut `DATABASE_VERSION`) pour que les tests des migrations historiques s'arrêtent à 11.
- `src/infrastructure/database/migrations/migration012.ts` (nouveau) -- `applyMigration012(transaction, now)` : comptes, `DELETE FROM sessions` (cascades), `DROP` des tables d'Exercices et d'occurrences, `DELETE FROM media_assets`, `CREATE` des tables MFN et des occurrences, contrôle `foreign_key_check`, avis.
- `src/infrastructure/database/constants.ts` -- `DATABASE_VERSION = 12`.
- `src/domain/activities/ExecutionParameters.ts` -- ajouter la forme résolue v4 des copies (`serializeResolvedExecutionParameters`, `readResolvedExecutionParameters`, strictes, réutilisent `readV3Object`) ; v2/v3 restent dans le domaine (Instantané, A1.3) mais ne sont plus lues par la persistance.
- `src/domain/activities/Movement.ts` -- ajouter l'allocation des phases par le compteur (`allocatePhaseIdentities`) ; `MovementRepository` (nouveau port, `MovementRepository.ts`).
- `src/domain/activities/ActivityDefinition.ts` -- `movementId` obligatoire, `missingPhaseIds?` ; `activityDefinitionToDraftExercise` porte `sourceMovementId`.
- `src/domain/sessions/Session.ts`, `SessionDraft.ts`, `validation.ts` -- `sourceMovementId?` sur `Activity`, les entrées et `SessionDraftExercise` ; transport (relecture, duplication par étalement, conversions).
- `src/domain/migration/MigrationNotice.ts`, `src/features/migration/MigrationNoticeGate.tsx`, `src/shared/i18n/index.ts` -- nouveau genre d'avis et son texte.
- `src/infrastructure/database/repositories/SqliteMovementRepository.ts` (nouveau) -- créer, lire, rechercher (nom normalisé), marquer utilisé, compter, supprimer (refus si référencé), groupe (rattacher, insérer après, réordonner, retirer, lister) ; fonctions transactionnelles réutilisées par les autres repositories.
- `SqliteActivityDefinitionRepository.ts`, `SqliteMediaRepository.ts`, `SqliteSessionRepository.ts`, `SqliteCategoryRepository.ts`, `SqliteBodyZoneRepository.ts` -- tables MFN, JSON v4, filiation, comptes d'usage (`movements`, `movement_body_zones`, `movement_media`).
- `src/infrastructure/database/types/DatabaseRows.ts` -- lignes MFN.
- `src/infrastructure/database/testing/buildVersion11.ts` (nouveau) -- base v11 de copie (patron `buildVersion10.ts`).
- Pièges relevés : `SqliteSessionRepository.test.ts` injecte des fabriques d'identifiants à 5 ou 6 valeurs fixes (l.70-110) : le repository de séances ne doit consommer aucun identifiant supplémentaire (d'où l'identifiant de Mouvement local dérivé de l'occurrence) ; `expo-crypto` est simulé par `jest.fn()` dans plusieurs tests ; les tests historiques (`migration010.test.ts`, `preservation.story14.test.ts`, `preservation.story11.pre6.test.ts`, `copiesAndSnapshots.story13.test.ts`, `migrateDatabase.test.ts`, `targetSchema.test.ts`) lisent des bases v9/v10 migrées, parfois par les repositories courants : les arrêter à la version 11 et lire les lignes brutes (au besoin par `readExecutionParameters`, conservé dans le domaine) sans changer ce qu'ils prouvent ; ajouter une preuve de chaîne complète v9/v10 → 12. Les tests qui écrivent par les repositories puis lisent le JSON brut passent aux formats v4. `activity_definition_body_zones` n'avait pas de clé étrangère vers `body_zones` ; `movement_body_zones` en a une. Suite de référence : 151 suites, 4 120 tests.
- Ne pas toucher : migrations 001–011 (empreintes de `targetSchema.test.ts`), `SessionServiceProvider.tsx` (aucun consommateur du Mouvement avant A1.3).

## Tasks & Acceptance

**Execution:**
- [x] `migrations/migration012.ts`, `migrateDatabase.ts`, `constants.ts` -- migration et runner -- transition D-440.
- [x] `ExecutionParameters.ts`, `Movement.ts`, `MovementRepository.ts`, `ActivityDefinition.ts`, `Session.ts`, `SessionDraft.ts`, `validation.ts` -- formats v4, allocation, ports, filiation -- domaine.
- [x] `SqliteMovementRepository.ts`, repositories adaptés, `DatabaseRows.ts` -- persistance MFN.
- [x] `MigrationNotice.ts`, `MigrationNoticeGate.tsx`, i18n -- avis affiché.
- [x] Tests : `migration012.test.ts` (base de copie fichier, rollback, second lancement), `SqliteMovementRepository.test.ts`, adaptations des tests de repositories et des tests historiques (arrêt à 11, lecture brute) -- preuve.
- [x] READMEs `src/infrastructure/database/`, `src/domain/` -- documentation de la tranche.

**Acceptance Criteria:**
- Given une base v11 fichier peuplée, when l'application initialise la base puis la rouvre, then Profil, Catégories et Zones (personnalisations comprises) sont identiques, les Exercices et Séances ont disparu, l'avis est présent une fois, et un second lancement ne supprime rien.
- Given l'application après 012, when on crée un Exercice au Catalogue, l'insère dans une Séance, crée un Exercice local et enregistre, then tout se relit à l'identique, chaque occurrence a une filiation non nulle et les Mouvements des occurrences enregistrées sont « déjà utilisés ».
- Given l'application, when les trois contrôles s'exécutent, then ils sont verts.

## Design Notes

- **Forme des copies après 012 :** proposition A1.1 retenue : JSON résolu (libellés compris) en version 4, lu par `readResolvedExecutionParameters` ; la colonne détermine la forme (Catalogue v4 ou résolue v4). La persistance n'appelle plus `readExecutionParameters` (v2/v3).
- **Allocation des phases :** la mise à jour d'une définition garde l'identité des phases déjà présentes dans la structure du Mouvement et alloue par le compteur celles qui n'y sont pas (MFN-02 : « Un compteur monotone porté par le mouvement attribue les identifiants ») ; l'éditeur actuel recalcule max + 1, A2.1 câblera le compteur.
- **Frontière A1.3 :** `create` crée toujours un geste indépendant ; une mise à jour qui change l'ensemble des phases d'un Mouvement partagé est refusée (`SharedMovementStructureError`) en attendant la correction partagée. La filiation est portée par le brouillon et écrite par le repository ; le repository marque « déjà utilisé » les Mouvements des occurrences d'une Séance enregistrée et crée le Mouvement local d'une occurrence nouvelle sans filiation (identifiant = celui de l'occurrence). Sans Catégorie ou sans Zone (entrées hors interface), la filiation reçoit l'identifiant de l'occurrence sans Mouvement (orpheline admise par MFN-03).

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

## Implementation Notes

- **Ce que 012 supprime :** toutes les lignes de `session_activity_media`, `activity_body_zones`, `activities`, `session_stop_points`, `tours`, `cycles`, `sessions`, `activity_media`, `activity_definition_body_zones`, `activity_definitions`, `media_assets` (enfants d'abord, sans dépendre des cascades) ; puis `DROP` et recréation d'`activity_definitions`, `activities`, `activity_body_zones`, `session_activity_media` ; `activity_media` et `activity_definition_body_zones` disparaissent au profit de `movement_media` et `movement_body_zones`. Fichiers physiques des médias non touchés.
- **Ce que 012 conserve :** `users`, `profiles`, `categories`, `body_zones`, `labels`, `migration_notices`, sans aucune écriture. Les tables `sessions`, `cycles`, `tours`, `session_stop_points`, `media_assets` gardent leur schéma.
- **Étiquettes :** conservées comme référentiel de l'utilisateur (ch09 l.220 : « Toute Étiquette et toute Catégorie appartient au référentiel de l'Utilisateur local ») ; seuls les liens Séance–Étiquette disparaissent avec les Séances. Point à confirmer par Hermann (sa décision du 24/10 ne nomme pas les Étiquettes).
- **Avis :** genre `EXERCISES_AND_SESSIONS_RESET`, compte = Exercices du Catalogue + Séances supprimés (non affiché) ; texte nouveau, sans source documentaire (`src/shared/i18n/resources/fr.ts`), à valider par Hermann au jalon JA1. Une base v9/v10 peut porter un avis 010 non acquitté, montré au lancement précédent celui de l'avis 012.
- **Tests historiques :** `migrateDatabase(db, now, targetVersion)` arrête la chaîne à 11 pour les preuves de 001 à 011, qui lisent désormais les lignes brutes (`readExecutionParameters`, conservé dans le domaine pour l'Instantané) ; deux preuves deviennent des chaînes complètes v9 → 12 et v10 → 12 ; le test « Séance vide rouverte » de 010 est repris sur le schéma 012 (`mfnPersistence.a12.test.ts`).
- **Formats :** définitions en v4 Catalogue, copies en v4 résolue ; aucun repository ne lit ni n'écrit v2/v3 (test de garde).
- **Frontière A1.3 :** origine explicite (même geste / variante), correction partagée des frères, liste regroupée, instantané avec filiation, filiation pré-allouée d'une création locale dupliquée avant enregistrement ; `SharedMovementStructureError` reste la garde provisoire.
- Revue passe 1 : correctifs retenus appliqués (lignes 1, 4, 5, 15 à 18, 24, 26, 27 du journal) ; trois reports dans `deferred-work.md`.
- Contrôles finaux : `npm test -- --maxWorkers=2` 155 suites, 4 157 tests verts ; `npx tsc --noEmit` vert ; `npm run lint` vert.

## Spec Change Log

## Review Triage Log

Passe 1 (24/10/2026) : trois relectures (aveugle, cas limites, lacunes de vérification).

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | blind | `allocatePhaseIdentities` garde un identifiant de brouillon encore présent dans la structure : [1,2,3], Feuille rouverte après retrait de 3 sans enregistrer, la phase ajoutée reprend 3 | medium | Vérifié : l'éditeur ouvre la Feuille en max + 1 (`ExecutionParametersSheet.tsx:503`, sans `nextPhaseId`) ; non résoluble au repository ; JSDoc corrigée (patch), câblage du compteur → defer A2.1 |
| 2 | blind | `SharedMovementStructureError` levée pour un cas métier | low | Frontière A1.3 assumée par la spec ; inatteignable depuis l'interface (aucun frère créé avant A1.3) ; rejeté |
| 3 | blind | `MovementRepository` sans `update`, sans lecture du groupe d'un Mouvement | low | Opérations d'A1.3/A2/A3, non requises par le plan A1.2 ; rejeté |
| 4 | blind + edge | `join` : identifiant consommé avant le refus `ALREADY_IN_GROUP` ; `INVALID_ORDER` non documenté pour l'auto-rattachement | low | Correction directe ; patch |
| 5 | blind + edge | Suppression d'un Mouvement groupé : trou dans les clés, contraire à l'en-tête | low | Rang dérivé de l'ordre, sans effet visible ; correction directe ; patch |
| 6 | blind | Avis 010 non acquitté affiché avant l'avis 012 | low | `findUnacknowledged` ORDER BY id ; les deux avis restent montrés (un par lancement) ; modifier un avis existant n'est pas demandé ; rejeté |
| 7 | blind | Fichiers physiques des médias orphelins après 012 | medium | Vérifié : 012 supprime les lignes `media_assets`, pas les fichiers (hors transaction SQL) ; point renvoyé à Hermann ; defer |
| 8 | blind + verification-gap | Mouvements locaux jamais collectés : médias et Zones restent référencés, recherche les propose | false | Règle MFN-04 (« aucun ramassage automatique », ch10) ; comportement voulu |
| 9 | blind | Duplication d'une occurrence locale avant le premier enregistrement : deux Mouvements | medium | Vérifié (aucune filiation au brouillon avant l'enregistrement) ; frontière A1.3 notée en Design Notes ; defer |
| 10 | blind + edge | Identifiant d'occurrence réutilisé comme identifiant de Mouvement ; Mouvement existant de même id repris | low | Identifiants d'occurrence frais (`Crypto.randomUUID`) ; collision seulement par appel hors interface ; rejeté |
| 11 | blind + edge + verification-gap | `Category.isUsed` et `BodyZone.isUsed` divergent | false | Catégorie : sémantique d'avant conservée (Exercice du Catalogue) et seulement retirée, jamais supprimée ; Zone : `movement_body_zones` doit être compté (FK restrictive) |
| 12 | blind | Échec de sauvegarde possible par `validateMovement` sur occurrence locale | false | Nom, description et phases déjà validés par les mêmes règles ; médias de brouillon portent toujours l'asset (`DraftMediaItem`) |
| 13 | blind | `serializeResolvedExecutionParameters` ne contrôle pas les séries variables | false | L'invariant des phases ne concerne que l'uniforme ; une série variable n'a pas de phases |
| 14 | blind | `targetVersion` de test dans le runner de production | low | Choix de la spec, défaut inchangé, bornes contrôlées ; rejeté |
| 15 | blind | `count` de l'avis additionne Exercices et Séances ; README de `migration` périmé | low | Nombre non affiché ; README corrigé ; patch |
| 16 | blind | Expression régulière à caractères combinants littéraux | low | Correction directe (`̀-ͯ`) ; patch |
| 17 | blind | `pre3Transport` rejette une filiation blanche mais transmet la valeur non rognée | low | Correction directe ; patch |
| 18 | blind | Indentation des fixtures (`movementId` en colonne 0), lignes longues | low | Correction directe des fixtures ; patch (lignes longues : rejeté, lint vert) |
| 19 | blind | `Error` simple pour une donnée corrompue au lecteur du Mouvement | low | Échec bruyant sur donnée jamais montrée atteignable ; rejeté |
| 20 | blind | Index manquants (`movements.category_id`), libellé de phase sans borne 20 en SQL | low | Tables petites ; borne appliquée par le domaine avant écriture ; rejeté |
| 21 | edge | `foreign_key_check` global : violation préexistante dans une table conservée bloquerait 012 | false | Aucune table conservée (`users`, `profiles`, `categories`, `body_zones`, `labels`, `migration_notices`) ne porte de clé étrangère ; `sessions` est vidée |
| 22 | edge | Copie d'un frère `INCOMPLETE` vers une Séance : échec à l'enregistrement | maybe-false | Aucun frère incomplet créable avant A1.3 ; déjà consigné dans `deferred-work.md` (A1.1) ; rejeté ici |
| 23 | edge | Réordonnancement / renommage des phases d'un Mouvement partagé propagé aux frères | false | Contenu partagé par définition (MFN-02, structure sur le Mouvement) ; seul l'ensemble des identités est gardé |
| 24 | edge | `replaceDefinitionMediaLinks` devenu code mort | low | Correction directe (suppression si sans appelant) ; patch |
| 25 | edge | « Mouvements des occurrences marqués utilisés » faux pour une occurrence sans Catégorie ni Zone | false | Filiation orpheline admise (MFN-03), pas de Mouvement à marquer ; cas hors interface consigné en Design Notes |
| 26 | verification-gap | Création du Mouvement local par `update` (Séance existante) non testée | medium | Gap pré-vérifié ; patch (test) |
| 27 | verification-gap | Marquage « déjà utilisé » par `update` non observable | medium | Gap pré-vérifié ; patch (test) |
