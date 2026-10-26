---
title: 'A1.3 — Services et filiation'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: '481ff5d2dc1e30a24752188749b8b0fabb0fcee2'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/implementation-artifacts/epic-A1-context.md'
  - '{project-root}/src/domain/README.md'
  - '{project-root}/src/infrastructure/database/README.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Après A1.2, le Mouvement est persisté mais aucun service ne l'exploite : la création ne connaît qu'un geste indépendant, un changement de phases d'un geste partagé est refusé par une garde provisoire (`SharedMovementStructureError`), le Catalogue n'est pas regroupable par geste, une occurrence locale dupliquée avant le premier enregistrement reçoit un Mouvement distinct, la duplication de Séance (API-SEA-05) n'existe pas et l'Instantané ne porte aucune filiation (plan `epics.md:80`).

**Approach:** Domaine pur de la correction partagée (évaluation : usage, champs sensibles, nombre de définitions, durées manquantes des frères ; plan par frère, durées associées par `phaseId`, frères incomplets explicitement acceptés) ; `ActivityDefinitionService` : création avec origine explicite, correction partagée atomique, liste regroupée par geste ; repositories : origine, rattachement au groupe et correction dans une seule transaction ; `SessionService` : duplication de Séance ; filiation pré-allouée de la copie d'une occurrence locale ; `ExerciseSnapshot.sourceMovementId`.

## Boundaries & Constraints

**Always:** D-437 à D-440, MFN-01 à MFN-13 (ch10 l.249-526), ch11 l.97-137, ch12 l.237-247, ch09 l.287-305 ; aucune valeur inventée (durée manquante explicite, `null` = passer la complétion) ; l'Exercice édité reste complet (MFN/AC25) ; une correction ne touche jamais les copies ni les instantanés ; filiation copiée à l'identique à toute duplication ; aucun rattachement de groupe automatique ; transactions uniques, rien de partiel ; cas attendus en unions au service, entrée invalide levée au repository ; tests existants non affaiblis ; trois contrôles verts.

**Never:** interface MFN (dialogue, crayon, complétion, recherche : A2.x ; niveaux : A3.x ; Catalogue regroupé à l'écran : A4.1) ; moteur d'exécution, historique, records ; migration nouvelle (aucune n'est nécessaire) ; modifier les migrations 001–012, `tokens.ts`, `package.json`, `app.json`, `.github/`, `main`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Même geste | origine `SAME_MOVEMENT`, mêmes phases | nouvelle définition, même `movementId` ; contenu saisi appliqué au geste partagé | Mouvement inconnu → `MOVEMENT_NOT_FOUND` |
| Variante | origine `VARIANT`, `joinOriginGroup` vrai / faux | nouveau Mouvement ; inséré après l'origine ou sans groupe ; original intact | échec → aucun résidu |
| Correction sans structure | nom changé, frères | geste corrigé, tous les frères relisent le nouveau nom | N/A |
| Correction structurelle | [1,2] → [1,2,3], frère sans complétion | `SIBLING_COMPLETION_REQUIRED` (phase 3), rien écrit | N/A |
| Complétion passée | frère `{3: null}` | frère `INCOMPLETE`, `missingPhaseIds [3]`, durées 1 et 2 conservées par id | durée < 1 → `INVALID_SIBLING_COMPLETION` |
| Avec → Sans | frère complet [6,3] / incomplet | durée de série 9 / complétion requise (`null` → incomplet, Cible à renseigner) | N/A |
| Frère inéligible | ajout de phases, frère en Répétitions | `INELIGIBLE_SIBLINGS`, rien écrit | N/A |
| Échec au milieu | erreur injectée après l'écriture du Mouvement | rollback complet | N/A |
| Locale dupliquée | occurrence locale non enregistrée dupliquée | un seul Mouvement, deux filiations égales | source retirée avant enregistrement → Mouvement créé depuis la copie |
| Séance dupliquée | Séance enregistrée | nouvelle Séance `{nom} (copie)`, nouveaux identifiants, filiations identiques | inconnue → `NOT_FOUND` |
| Instantané | occurrence | `sourceMovementId` copié ; paramètres incomplets refusés | entrée invalide → lève |

</frozen-after-approval>

## Code Map

- `src/domain/activities/sharedCorrection.ts` (nouveau) -- `assessSharedCorrection`, `planSiblingCorrection`, `phaseSetChanged`, types `SiblingCompletion`, `SiblingGap`, `SharedCorrectionRefusedError` ; réutilise `allocatePhaseIdentities`, `splitResolvedParameters`, `validateCatalogParameters` (`Movement.ts`).
- `src/domain/activities/Movement.ts` -- `resolveCatalogParameters` : uniforme à Cible `UNSET` sans phase manquante → `INCOMPLETE` (`missingPhaseIds: []`, durée de série à renseigner).
- `src/domain/activities/ActivityDefinition.ts` -- `DefinitionOrigin`, `groupDefinitionsByMovement`, doc `missingPhaseIds` (vide possible).
- `src/domain/activities/ActivityDefinitionRepository.ts` -- `create(input, origin?)`, `update(id, input, completions?)` (paramètres optionnels : les doublures existantes restent conformes).
- `src/domain/activities/MovementRepository.ts` -- retirer `SharedMovementStructureError`.
- `src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts` -- origine, correction partagée transactionnelle (frères réécrits en v4), garde levée par `SharedCorrectionRefusedError`.
- `src/infrastructure/database/repositories/SqliteMovementRepository.ts` -- extraire `joinMovementGroup(transaction, …)` de `join` (réutilisé par la variante).
- `src/features/activities/ActivityDefinitionService.ts` -- `createActivityDefinitionWithOrigin`, `assessActivityDefinitionCorrection`, `updateActivityDefinition(id, input, completions?)` (nouvelles issues), `listActivityDefinitionsByMovement` ; 6e paramètre optionnel `movementRepository`.
- `src/features/sessions/SessionServiceProvider.tsx` -- injecter `SqliteMovementRepository`.
- `src/domain/sessions/composition.ts` (`duplicateActivity`), `SessionDraft.ts`, `Session.ts`, `validation.ts` (`pre3Transport`) -- `pendingLocalMovement`.
- `src/infrastructure/database/repositories/SqliteSessionRepository.ts` -- `resolveNewOccurrenceFiliation` : Mouvement local en attente.
- `src/domain/sessions/SessionDraft.ts` (`toDuplicateSessionDraft`), `src/features/sessions/SessionService.ts` (`duplicateSession`) -- API-SEA-05.
- `src/domain/activities/exerciseSnapshot.ts` -- `sourceMovementId`.
- Déjà fait par A1.2, vérifié, non refait : filiation portée par le brouillon et la réécriture (`mfnPersistence.a12.test.ts:271`), Mouvement local dans la transaction de la Séance, « déjà utilisé » au succès (`SqliteSessionRepository.ts:415`, `:526`).
- Pièges : fabriques d'identifiants à valeurs fixes (`SqliteSessionRepository.test.ts`) — aucune consommation nouvelle d'identifiant au repository de Séances ; `ActivityDefinitionService.test.ts:126` asserte la forme exacte de `UPDATED` (inchangée) ; doublures `FakeRepository` partagent `mov-1`.

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/activities/sharedCorrection.ts`, `Movement.ts`, `ActivityDefinition.ts`, `ActivityDefinitionRepository.ts`, `MovementRepository.ts`, `index.ts` -- domaine de la correction et de l'origine.
- [x] `SqliteMovementRepository.ts`, `SqliteActivityDefinitionRepository.ts` -- persistance atomique.
- [x] `ActivityDefinitionService.ts`, `SessionServiceProvider.tsx` -- service.
- [x] `composition.ts`, `SessionDraft.ts`, `Session.ts`, `validation.ts`, `SqliteSessionRepository.ts`, `SessionService.ts` -- filiation des duplications.
- [x] `exerciseSnapshot.ts` + appels de test -- instantané.
- [x] Tests : `sharedCorrection.a13.test.ts` (domaine), `mfnServices.a13.test.ts` (SQLite réelle, services, rollback), adaptations (`mfnPersistence.a12.test.ts` : garde provisoire → correction partagée ; `exerciseSnapshot.test.ts`).
- [x] READMEs `src/domain/`, `src/features/activities/`, `src/features/sessions/`, `src/infrastructure/database/`.

**Acceptance Criteria:**
- Given deux Exercices d'un geste, when l'un est corrigé avec ajout d'une phase et complétion passée pour l'autre, then les deux relisent la nouvelle structure, l'édité est exécutable, le frère `INCOMPLETE`, aucune copie de Séance n'a changé.
- Given l'application, when les trois contrôles s'exécutent, then ils sont verts.

## Design Notes

- **Choix et dialogue :** l'évaluation (`assessActivityDefinitionCorrection`) donne usage, changement sensible (nom, description, médias, structure : identités, libellés, ordre), nombre de définitions touchées et frères à compléter ; l'interface (A2.2) en déduit le dialogue. « Corriger » = `updateActivityDefinition` ; « Créer un nouvel exercice » = origine `VARIANT` (`joinOriginGroup` sans valeur par défaut). Sans complétion fournie, l'ancien appelant (`ExerciseScreen`) garde son comportement : un geste à définition unique n'a aucun frère.
- **Liste regroupée :** groupes dans l'ordre de première apparition de la liste `updatedAt DESC`, définitions dans cet ordre.
- **Duplication d'une occurrence locale non enregistrée :** la copie reçoit `sourceMovementId` = identifiant de la source (identifiant du futur Mouvement local, règle A1.2) et `pendingLocalMovement` ; à l'enregistrement, le Mouvement est créé par la source si elle est présente, sinon par la première copie en attente.
- **Points renvoyés à Hermann (option conservatrice appliquée) :**
  1. Avec → Sans dans une correction partagée (ch10 l.300, l.428-433) : frère complet → somme de ses durées ; frère incomplet → durée de série à renseigner (complétion ou passage explicite). Alternative : durée de la phase restante (analogie D-371).
  2. Ajout de phases à un geste partagé par un Exercice inéligible (Répétitions, À l'échec, séries variables ; MFN-02 éligibilité) : refus sans écriture. Alternatives : variante imposée, conversion du frère.
  3. Duplication de Séance : collisions du suffixe calculées sur les Séances actives.
  4. Occurrence locale dupliquée puis source retirée avant le premier enregistrement : le Mouvement local est créé depuis la copie et porte son nom « X (copie) » (D-124 ne vise que le nom de l'occurrence). Alternative : nom de la source retiré du suffixe, ou geste sans Mouvement.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

## Implementation Notes

- Implémentation conduite directement par l'agent de la story (pas de sous-agent d'implémentation : l'investigation détaillée était dans son contexte) ; revues du step-04 confiées à trois sous-agents indépendants.
- **Correction partagée :** le service rend les refus en union (`SIBLING_COMPLETION_REQUIRED`, `INELIGIBLE_SIBLINGS`, `INVALID_SIBLING_COMPLETION`) en convertissant `SharedCorrectionRefusedError`, levée par le repository AVANT toute écriture, sur l'état relu dans la transaction (source unique : `planSiblingsCorrection`). Une complétion est exigée pour toute phase sans durée connue, y compris une phase conservée dont le frère manquait déjà de durée. Les frères réécrits reçoivent `updated_at` de la correction ; un frère inchangé n'est pas réécrit.
- **Frère sans phase incomplet :** `resolveCatalogParameters` rend `INCOMPLETE` (`missingPhaseIds: []`) pour un uniforme à Cible `UNSET` ; `ActivityDefinition.missingPhaseIds` peut donc être vide.
- **Évaluation :** `affectedDefinitionCount` = définitions qui partagent déjà le Mouvement (l'Exercice créé sur un geste repris n'y est pas compté). Les libellés et l'ordre des phases sont des changements sensibles sans être structurels.
- **Instantané :** enveloppe v3 conservée, clé `sourceMovementId` ajoutée (aucun Instantané stocké, H11) ; la garde « frère incomplet » vise l'uniforme (Cible `UNSET` ou durée < 1 s) : une Cible `UNSET` d'une ligne de séries variables reste instantanée comme avant (test PRE-4 `executionCalculations.test.ts` AC8, non affaibli).
- **Frère incomplet hors Séance :** `toCreateSessionInput` refuse sa copie (test) ; le signalement à l'insertion relève d'A2.1 / A4.1.
- **Duplication de Séance :** `SessionService.duplicateSession(sessionId, newActivityId)` ; sans interface (aucune n'est prévue par le plan).
- **Tests adaptés, non affaiblis :** `mfnPersistence.a12.test.ts` (la garde provisoire devient le refus sans complétion, sur un ajout de phase : un retrait n'exige plus rien) ; `composition.test.ts` (la copie d'une source locale porte désormais la filiation pré-allouée, attente plus stricte) ; fixtures d'Instantané (`exerciseSnapshot.test.ts`, `executionCalculations.test.ts`, `copiesAndSnapshots.story13.test.ts`) complétées de la filiation.
- Reports traités : `deferred-work.md` « occurrence locale dupliquée » (A1.2) résolu ; « paramètres d'un frère incomplet écrits en v3 » (A1.1) couvert pour l'Instantané et la copie de Séance.
- Fichiers non suivis `epic-A2-context.md`, `epic-A3-context.md`, `epic-A4-context.md` apparus pendant la story, hors de son travail : laissés tels quels, hors commit.
- Revue passe 1 : correctifs retenus appliqués (lignes 1 à 5, 8, 13, 17, 19 du journal) ; un report (ligne 7, A2.2) dans `deferred-work.md`.
- Contrôles finaux : `npm test -- --maxWorkers=2` 157 suites, 4 185 tests verts ; `npx tsc --noEmit` vert ; `npm run lint` vert.
- Contrôles avant revue : `npm test -- --maxWorkers=2` 157 suites, 4 180 tests verts ; `npx tsc --noEmit` vert ; `npm run lint` vert.

## Spec Change Log

## Review Triage Log

Passe 1 (24/10/2026) : trois relectures (aveugle, cas limites, lacunes de vérification).

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | verification-gap | Création « même geste » qui change la structure : complétions et refus non testés | medium | Gap pré-vérifié ; patch (test `mfnServices.a13`, refus sans écriture, complétions, évaluation `SAME_MOVEMENT`) |
| 2 | verification-gap | Médias du geste conservés à une création « même geste » sans `media` : non testé | medium | Gap pré-vérifié ; patch (test) |
| 3 | verification-gap + blind | Avec → Sans avec frère incomplet jamais exécuté sur SQLite ; `missingPhaseIds: []` jamais relu ; refus de copie en Séance non prouvé pour ce cas | medium | Gap pré-vérifié ; patch (test : complétion requise, `null` → `[]` + `UNSET`, `toCreateSessionInput` refuse) |
| 4 | verification-gap + blind | Copie en attente par la mise à jour d'une Séance (`mergeActivities`) non couverte | medium | Gap pré-vérifié ; patch (test, source placée après, source retirée) |
| 5 | blind + edge | `duplicateSession` duplique une Séance archivée (`findById` ne filtre pas le statut) alors que `NOT_FOUND` = « non active » | medium | Vérifié (`readSession` sans filtre de statut) ; patch (`findSessionStatus` d'abord, test) |
| 6 | blind | Copie seule restante : Mouvement local créé au nom « X (copie) » ; source orpheline + copie éligible | low | Comportement voulu par la matrice gelée (ligne « Locale dupliquée ») ; aucune règle sur le nom du geste dans ce cas → point 4 renvoyé à Hermann ; rejeté |
| 7 | blind | Question d'identité non imposée à l'écriture (`updateActivityDefinition` sans accusé du choix) | low | Seul appelant : `ExerciseScreen`, geste à définition unique ; dialogue = A2.2 (Design Notes) ; defer (A2.2 doit appeler l'évaluation avant d'écrire) |
| 8 | blind | Création « même geste » : phases appariées par numéro | low | Contrat : paramètres construits sur la structure du geste repris (A2.3) ; patch (JSDoc d'`ActivityDefinitionOrigin`) |
| 9 | blind | Avec → Sans = somme sans décision de Hermann | false | Option conservatrice imposée par la mission, consignée comme point 1 renvoyé à Hermann |
| 10 | blind | Évaluation par `listAll` hors transaction, ordre différent de l'écriture | low | Égalité des jeux de frères, seul l'ordre à `updated_at` égal peut différer ; tables petites ; rejeté |
| 11 | blind | Complétions inutiles ignorées sans signal | low | Comportement documenté (`SiblingCompletion`) ; ajout d'un signal = surface publique ; rejeté |
| 12 | blind | Refus arrêtés à la première catégorie ; l'évaluation ne prédit pas les durées invalides | low | Priorité documentée ; l'évaluation précède la saisie ; rejeté |
| 13 | blind + edge | Instantané : filiation rognée à la création mais non à la relecture ; version d'enveloppe inchangée | low | Asymétrie : correction directe ; patch (rognage des deux côtés). Version : choix consigné (aucun Instantané stocké) ; rejeté |
| 14 | blind | Garde de l'Instantané plus large (uniforme `UNSET` en Répétitions, occurrences locales) | false | Une occurrence enregistrée n'a jamais de Cible `UNSET` (`validateForSave` `STORAGE`) ; un uniforme `UNSET` n'est exécutable dans aucun mode |
| 15 | blind | `missingPhaseIds` vide sans prédicat d'exécutabilité | low | Aucun consommateur ; type documenté ; rejeté |
| 16 | blind | Autres manques de tests (évaluation `SAME_MOVEMENT` / `NOT_FOUND`, `duplicateSession` `INVALID`, variante « original intact ») | low | Évaluation couverte avec #1 ; autres rejetés (chemins sans branche propre) |
| 17 | blind | `split` calculé inutilement ; commentaire orphelin ; `joinMovementGroup` en `Error` simple | low | Corrections directes ; patch (2 premiers) ; erreur de groupe inatteignable (origine vérifiée, Mouvement neuf) : rejeté |
| 18 | edge | Copie en attente éligible avec source orpheline dans la même Séance | low | Copie = clone de la source (mêmes Catégorie et Zones) ; correction = branches nouvelles ; rejeté |
| 19 | edge | Source à filiation `""` : copie sans filiation pré-allouée | low | Correction directe ; patch (`trim`) |
| 20 | edge | Complétions en double pour un même frère : la dernière l'emporte | low | Entrée hors interface ; rejeté |
| 21 | edge | Création « même geste » sans phases sur un geste à phases convertit les frères sans complétion | false | Règle Avec → Sans appliquée comme à la correction ; frères complets → somme, incomplets → complétion exigée ; l'évaluation signale `structuralChange` |
| 22 | edge | Donnée de frère incohérente : `ExecutionParametersDataError` brute | false | Donnée corrompue jamais montrée atteignable ; échec bruyant voulu |
