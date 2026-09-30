# Plan technique final — PRE-1 — Fondations du modèle cible avant moteur

## 1. Statut et correction bornée

Ce plan reprend le plan de base et corrige uniquement les constats bloquants de la revue indépendante ainsi que leurs dépendances directes démontrées par le code au HEAD `e216294506bed87dd80855937e3fabfbfa322b82`.

Il ne crée ni nouvelle tranche, ni nouvelle baseline, ni nouvelle décision produit. PRE-1 reste limitée aux fondations Domaine, aux contrats Repository, à la persistance SQLite, aux services non visuels, aux calculs métier directement affectés et aux tests associés.

La tranche s’arrête avant tout Générateur de Plan d’Exécution, Moteur d’Exécution, UI d’Exécution, recherche Catalogue, refonte d’écran ou modification Figma.

## 2. Règle de scan et périmètre final

Le scan d’impact est déterministe et limité à un seul niveau d’import direct depuis les modules modifiables. Aucun consommateur découvert n’est promu en nouvelle racine de scan et aucun import transitif n’est inféré.

Les racines modifiables du draft révisé sont conservées, avec les dépendances directement démontrées par la revue : les deux unions `ValidationField`, le formulaire d’Exercice, l’écran Catégories, l’outil d’intégration native et la ressource française. Chaque candidat du scan direct est classifié exactement une fois dans `decision_classifications` : les tests restent `TEST_UNAFFECTED` et les consommateurs restent `CONSUMER_UNAFFECTED`, sauf preuve directe d’une adaptation nécessaire. Un import direct seul ne constitue pas une preuve de modification.

Les migrations `migration001.ts` à `migration006.ts` restent immuables, y compris leurs exports, leurs valeurs historiques, leur génération SQL à l’évaluation du module et leur effet effectif. Les sources consommées par leur SQL — `PREDEFINED_CATEGORIES`, `canonicalCategoryKey` et `BODY_ZONES` — conservent leur contenu historique et ne sont pas remplacées par des re-exports vers les seeds cibles.

Le chemin exact des lignes SQLite est `src/infrastructure/database/types/DatabaseRows.ts`. Le chemin `src/infrastructure/database/rows/DatabaseRows.ts` est absent et reste interdit.

## 3. Modèle Domaine cible

### 3.1 Exercice et référentiels

`ActivityDefinition` porte l’identité, le nom, la description, le mode `DURATION | REPETITIONS | TO_FAILURE`, la valeur cible applicable, le nombre de Séries, la pause entre Séries, le mode de côté `UNILATERAL | RIGHT_LEFT | LEFT_RIGHT`, `sideRecoverySeconds`, la Catégorie obligatoire, une collection non vide de Zones corporelles distinctes, les paramètres propres de compte à rebours et de fin, les médias ordonnés et l’état technique nécessaire au futur cycle de vie Catalogue.

`ActivityDefinition.recoverySeconds` est supprimé du contrat cible, des mappings et de la persistance. La récupération post-exercice n’appartient jamais à la définition.

Les référentiels persistants sont :

- `Label` : nom, couleur, état actif/retiré, affectation facultative à une Séance ;
- `Category` : nom, couleur, état actif/retiré, affectation obligatoire à un Exercice ;
- `BodyZone` : nom, état actif/retiré, sans couleur.

Une valeur retirée est indisponible pour les nouvelles affectations mais reste représentable par les objets existants. Aucune réaffectation automatique n’est effectuée.

`BODY_ZONES` reste une source historique et de seed compatible avec les migrations historiques. La lecture runtime cible passe par le référentiel persistant.

### 3.2 Occurrence et Profil

L’occurrence d’Exercice copie les propriétés intrinsèques applicables au moment de son insertion dans la Séance et porte systématiquement `postActivityRecoverySeconds`, y compris lorsqu’il vaut zéro.

La création lit le Profil une fois, écrit immédiatement la valeur copiée et ne relit ensuite ni le Profil ni la définition source pour modifier l’occurrence. La duplication, le déplacement et la suppression conservent cette propriété avec l’occurrence.

Le Profil est un agrégat persistant singleton comprenant au minimum :

- pause de changement de côté par défaut : `10 s` ;
- récupération post-exercice par défaut : `30 s` ;
- compte à rebours d’Exercice par défaut ;
- fin d’Exercice par défaut.

Les préférences initialisent les nouveaux objets sans rétroactivité.

### 3.3 Séance, composition, Point d’arrêt et médias

`Session` porte l’Étiquette facultative, la couleur dérivée de celle-ci, le compte à rebours initial, la fin de Séance, un cycle technique unique, un Circuit unique, un nombre de Tours dans `1..99`, les Exercices avant/dans/après Circuit et le booléen global activé par défaut pour inclure les comptes à rebours et fins propres aux Exercices.

La relation Catégorie de Séance N:N et la couleur autonome historique de Séance sont retirées du contrat cible et de la persistance cible.

Le `sideMode` du Tour ne possède plus aucune influence fonctionnelle. S’il est conservé pour compatibilité technique, il est neutralisé à `UNILATERAL`, n’est pas exposé et n’est lu par aucun calcul, validateur ou Repository.

`StopPoint` porte une identité, une position hors ou dans le Circuit et un ordre dans sa portée. Un Point d’arrêt interne au Circuit est rejoué implicitement à chaque Tour. Il est interdit immédiatement après le compte à rebours initial et immédiatement avant la fin de Séance. Lorsqu’il suit un Exercice, la récupération post-exercice précède le Point d’arrêt.

`MediaAsset` représente l’identité et les métadonnées persistables d’un média. `ActivityMedia` associe un média à un Exercice avec une position stable et unique par Exercice. Aucun comportement de lecture vidéo, galerie, plein écran ou exécution n’est ajouté.

## 4. Invariants et calculs

Les validateurs, constructeurs, contrats Repository et calculs garantissent :

- modes d’Exercice fermés et valeurs applicables positives ;
- Catégorie exactement unique et Zones non vides, distinctes et valides ;
- retrait empêchant les nouvelles affectations tout en conservant les références existantes ;
- bilatéralité portée exclusivement par l’Exercice ;
- pause de changement de côté utilisée uniquement pour un Exercice bilatéral ;
- `postActivityRecoverySeconds` obligatoire et indépendant de la définition ;
- cycle unique, Circuit unique et répétition technique du cycle égale à `1` ;
- `repeatCount` compris entre `1` et `99` ;
- ordres d’Exercices, Points d’arrêt et médias stables et sans doublon ;
- Profil singleton et préférences non négatives ;
- distinction entre compte à rebours/fin de Séance et compte à rebours/fin propres à l’Exercice.

Les calculs comptent la pause entre Séries `C - 1` fois par côté, la pause de changement de côté exactement une fois entre les deux côtés et la récupération post-exercice à la position de l’occurrence. Le calcul intrinsèque ne contient jamais `postActivityRecoverySeconds` et ne lit jamais la direction du Tour.

Les unions `ValidationField` de `src/domain/categories/errors.ts` et `src/domain/sessions/errors.ts` sont adaptées aux champs cibles. Les champs historiques supprimés, notamment ceux liés à `recoverySeconds`, à la couleur autonome et à la relation de Catégorie de Séance, ne restent pas dans les unions canoniques.

## 5. Consommateurs directement affectés

Les adaptations suivantes sont nécessaires et restent minimales :

- `src/features/activities/ActivityEditorForm.tsx` ne porte plus le champ `recoverySeconds` ;
- `src/features/sessions/CategoriesScreen.tsx` ne lit ni n’écrit la relation Catégorie de Séance N:N ni la couleur autonome historique ;
- `src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts` supprime les fixtures et lectures obsolètes `recoverySeconds` et `categories` ;
- `src/features/sessions/BodyZoneSelector.tsx` et `src/features/sessions/compositionPresentation.ts` n’utilisent plus `BODY_ZONES` comme autorité runtime ;
- `src/shared/i18n/resources/fr.ts` expose `UNILATERAL` comme `Aucun`, avec vérification dans `src/shared/i18n/index.test.ts`.

Aucun écran non listé n’est adapté. Les candidats directs classifiés `CONSUMER_UNAFFECTED` restent hors périmètre ; aucune adaptation transitive n’est inférée.

## 6. Préservation effective des migrations historiques

Les migrations historiques importent des symboles dont la valeur est incorporée au SQL lors de l’évaluation du module. Le développement doit donc :

1. conserver inchangés `PREDEFINED_CATEGORIES`, `canonicalCategoryKey` et `BODY_ZONES` dans leur rôle historique ;
2. conserver leurs valeurs, ordre, clés canoniques et listes utilisées dans le SQL ;
3. ne pas remplacer ces exports par des re-exports vers les nouveaux seeds ;
4. ajouter des données de seed cible distinctes et explicitement nommées pour `migration007` et le runtime ;
5. ne modifier aucun fichier `migration001.ts` à `migration006.ts` ;
6. comparer le SQL effectivement généré par `migration002.ts`, `migration003.ts` et `migration004.ts` à la baseline.

La convergence ne doit jamais être obtenue par une modification indirecte des dépendances historiques.

## 7. Schéma SQLite et convergence

`migration007.ts` reconstruit dans une transaction les structures incompatibles et porte le schéma cible :

- `activity_definitions` sans récupération post-exercice, avec Catégorie, bilatéralité, pause de côté, paramètres propres et état Catalogue ;
- `categories`, `body_zones` et leurs états actif/retiré ;
- `activity_body_zones` avec unicité Exercice–Zone ;
- `labels` et `sessions.label_id` nullable ;
- tables de cycle, Tour et occurrence avec cycle unique, répétition technique `1` et `post_activity_recovery_seconds` obligatoire ;
- `session_stop_points` avec Session, portée et ordre ;
- `profiles` avec contrainte singleton ;
- `media_assets` et `activity_media` avec ordre stable et unicité par Exercice ;
- clés étrangères, index, contraintes de cardinalité et valeurs par défaut nécessaires.

Les anciennes Catégories de Séance N:N, la couleur autonome de Séance, `ActivityDefinition.recoverySeconds`, l’ancien champ de récupération d’occurrence et la bilatéralité fonctionnelle du Tour ne sont pas migrés sémantiquement. Les données de développement incompatibles peuvent être supprimées ou réinitialisées.

Installation neuve : exécuter `migration001` à `migration007`, puis les seeds déterministes.

Base existante : exécuter les migrations manquantes, puis `migration007`, reconstruire les structures incompatibles et réinitialiser les données autorisées à la destruction.

Les deux parcours doivent produire le même schéma normalisé, les mêmes contraintes, les mêmes index et les mêmes seeds. L’initialisation est idempotente et le Profil reste singleton. Les opérations de reconstruction et Repository sont transactionnelles avec rollback vérifiable.

## 8. Repositories et services

Les contrats `ActivityDefinitionRepository`, `CategoryRepository`, `LabelRepository`, `BodyZoneRepository`, `SessionRepository`, `ProfileRepository` et `MediaRepository` sont créés ou étendus dans leurs chemins exacts.

Ils valident les références et états actif/retiré, persistent cardinalités et ordres, gèrent les Points d’arrêt et médias, garantissent le Profil singleton et exécutent les opérations multi-tables atomiques.

`ActivityDefinitionService` transporte le contrat cible de l’Exercice sans récupération post-exercice. `SessionService` lit le Profil au moment de l’insertion et persiste l’occurrence indépendante. Aucun service de planification, de recherche Catalogue ou d’exécution n’est ajouté.

## 9. Tests et preuves

### Tests nouveaux

Les nouveaux tests requis sont :

- `src/domain/body-zones/__tests__/BodyZone.test.ts`
- `src/domain/labels/__tests__/Label.test.ts`
- `src/domain/preferences/__tests__/Profile.test.ts`
- `src/domain/media/__tests__/MediaRepository.test.ts`
- `src/domain/sessions/__tests__/StopPoint.test.ts`
- `src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts`
- `src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts`
- `src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts`
- `src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts`
- `src/infrastructure/database/__tests__/targetSchema.test.ts`

### Tests mis à jour

Les tests existants à mettre à jour sont :

- `src/domain/activities/__tests__/ActivityDefinition.test.ts`
- `src/domain/categories/__tests__/matching.test.ts`
- `src/domain/categories/__tests__/validation.test.ts`
- `src/domain/sessions/__tests__/SessionDraft.test.ts`
- `src/domain/sessions/__tests__/calculations.test.ts`
- `src/domain/sessions/__tests__/composition.test.ts`
- `src/domain/sessions/__tests__/sideMode.test.ts`
- `src/domain/sessions/__tests__/validation.test.ts`
- `src/features/activities/__tests__/ActivityDefinitionService.test.ts`
- `src/features/reference-data/__tests__/bodyZones.test.ts`
- `src/features/sessions/__tests__/SessionService.test.ts`
- `src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts`
- `src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts`
- `src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts`
- `src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts`
- `src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts`
- `src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts`
- `src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts`
- `src/infrastructure/database/__tests__/initializeDatabase.test.ts`
- `src/infrastructure/database/__tests__/migrateDatabase.test.ts`
- `src/features/activities/__tests__/ActivityEditorForm.test.tsx`
- `src/features/sessions/__tests__/BodyZoneSelector.test.tsx`
- `src/features/sessions/__tests__/CategoriesScreen.test.tsx`
- `src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx`
- `src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx`
- `src/features/sessions/__tests__/compositionPresentation.test.ts`
- `src/shared/i18n/index.test.ts`

Les preuves minimales couvrent les cardinalités, les champs supprimés, les unions `ValidationField`, la bilatéralité du seul Exercice, la séparation des pauses et récupérations, le snapshot Profil/source sans rétroactivité, les Points d’arrêt et médias ordonnés, les transactions et rollback, les seeds idempotents, le Profil singleton, la convergence des bases, l’absence des colonnes et relations historiques incompatibles, l’identité du SQL historique et la compatibilité minimale des consommateurs directement affectés.

L’outil natif ne possède pas de harnais unitaire dédié. Il est couvert par revue statique, typecheck et `DEVICE_CHECK` lors de l’exécution native disponible.

## 10. Ordre de développement

1. Reconfirmer les imports et le SQL évalués par `migration002` à `migration004`.
2. Figer les exports historiques et ajouter les seeds cibles distincts.
3. Créer les types `Label`, `BodyZone`, `Profile`, `MediaAsset`, `ActivityMedia` et `StopPoint` avec leurs tests.
4. Étendre les modèles Exercice, Catégorie, Séance et occurrence.
5. Adapter les deux unions `ValidationField` et les validateurs.
6. Mettre à jour calculs purs, composition et tests atomiques.
7. Étendre les interfaces Repository et les services de snapshot.
8. Adapter les consommateurs directement démontrés : éditeur, Catégories, Zones, présentation de composition, outil natif et i18n.
9. Ajouter `migration007`, les mappings de `types/DatabaseRows.ts`, constantes et Repositories SQLite.
10. Adapter initialisation, migration, seeds et tests de convergence.
11. Exécuter les tests Domaine, services, Repositories, migration et intégration native.
12. Effectuer la seconde passe de cohérence avant handoff.

## 11. Seconde passe et critères de sortie

Avant handoff, vérifier que chaque racine modifiable est rattachée à une exigence et à une preuve, que les migrations historiques sont inchangées, que le SQL historique reste identique, que les deux parcours de base convergent et que les seeds sont idempotents.

Rechercher `recoverySeconds`, la relation Catégorie de Séance, la couleur autonome de Séance, les lectures de `tour.sideMode`, `ExecutionPlan`, le Générateur, le Moteur et toute UI d’Exécution. Vérifier les traductions, les assertions atomiques, l’absence de modification Figma et l’absence de modification de `src/shared/ui`.

PRE-1 est prête pour clôture lorsque les référentiels, cardinalités, Profil, occurrence, Point d’arrêt, médias, calculs, migrations et tests répondent à la spécification, que l’affichage `UNILATERAL` vaut `Aucun`, que l’outil natif est validé et qu’aucun moteur n’a été commencé.

Aucune clarification produit ne demeure nécessaire.


### scope_allow machine

```text
src/domain/activities/ActivityDefinition.ts
src/domain/activities/ActivityDefinitionRepository.ts
src/domain/activities/__tests__/ActivityDefinition.test.ts
src/domain/activities/index.ts
src/domain/body-zones/BodyZone.ts
src/domain/body-zones/BodyZoneRepository.ts
src/domain/body-zones/__tests__/BodyZone.test.ts
src/domain/body-zones/index.ts
src/domain/categories/Category.ts
src/domain/categories/CategoryRepository.ts
src/domain/categories/__tests__/matching.test.ts
src/domain/categories/__tests__/validation.test.ts
src/domain/categories/defaults.ts
src/domain/categories/errors.ts
src/domain/categories/index.ts
src/domain/categories/matching.ts
src/domain/categories/validation.ts
src/domain/labels/Label.ts
src/domain/labels/LabelRepository.ts
src/domain/labels/__tests__/Label.test.ts
src/domain/labels/index.ts
src/domain/media/ActivityMedia.ts
src/domain/media/MediaAsset.ts
src/domain/media/MediaRepository.ts
src/domain/media/__tests__/MediaRepository.test.ts
src/domain/media/index.ts
src/domain/preferences/Profile.ts
src/domain/preferences/ProfileRepository.ts
src/domain/preferences/__tests__/Profile.test.ts
src/domain/preferences/index.ts
src/domain/sessions/Session.ts
src/domain/sessions/SessionDraft.ts
src/domain/sessions/SessionRepository.ts
src/domain/sessions/StopPoint.ts
src/domain/sessions/__tests__/SessionDraft.test.ts
src/domain/sessions/__tests__/StopPoint.test.ts
src/domain/sessions/__tests__/calculations.test.ts
src/domain/sessions/__tests__/composition.test.ts
src/domain/sessions/__tests__/sideMode.test.ts
src/domain/sessions/__tests__/validation.test.ts
src/domain/sessions/calculations.ts
src/domain/sessions/composition.ts
src/domain/sessions/defaults.ts
src/domain/sessions/errors.ts
src/domain/sessions/index.ts
src/domain/sessions/sideMode.ts
src/domain/sessions/validation.ts
src/features/activities/ActivityDefinitionService.ts
src/features/activities/ActivityEditorForm.tsx
src/features/activities/__tests__/ActivityDefinitionService.test.ts
src/features/activities/__tests__/ActivityEditorForm.test.tsx
src/features/reference-data/__tests__/bodyZones.test.ts
src/features/reference-data/bodyZones.ts
src/features/sessions/BodyZoneSelector.tsx
src/features/sessions/CategoriesScreen.tsx
src/features/sessions/SessionService.ts
src/features/sessions/__tests__/BodyZoneSelector.test.tsx
src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx
src/features/sessions/__tests__/CategoriesScreen.test.tsx
src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx
src/features/sessions/__tests__/SessionService.test.ts
src/features/sessions/__tests__/compositionPresentation.test.ts
src/features/sessions/compositionPresentation.ts
src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts
src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts
src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts
src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts
src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts
src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts
src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts
src/infrastructure/database/__tests__/initializeDatabase.test.ts
src/infrastructure/database/__tests__/migrateDatabase.test.ts
src/infrastructure/database/__tests__/targetSchema.test.ts
src/infrastructure/database/constants.ts
src/infrastructure/database/initializeDatabase.ts
src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts
src/infrastructure/database/migrateDatabase.ts
src/infrastructure/database/migrations/migration007.ts
src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts
src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts
src/infrastructure/database/repositories/SqliteCategoryRepository.ts
src/infrastructure/database/repositories/SqliteLabelRepository.ts
src/infrastructure/database/repositories/SqliteMediaRepository.ts
src/infrastructure/database/repositories/SqliteProfileRepository.ts
src/infrastructure/database/repositories/SqliteSessionRepository.ts
src/infrastructure/database/types/DatabaseRows.ts
src/shared/i18n/index.test.ts
src/shared/i18n/resources/fr.ts
```

<KODJO_MODIFIED_MODULES_JSON>
[
  {
    "path": "src/domain/activities/ActivityDefinition.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/activities/ActivityDefinitionRepository.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/activities/index.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/body-zones/BodyZone.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/body-zones/BodyZoneRepository.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/body-zones/__tests__/BodyZone.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/body-zones/index.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/categories/Category.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/categories/CategoryRepository.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/categories/__tests__/matching.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/categories/__tests__/validation.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/categories/defaults.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/categories/errors.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/categories/index.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/categories/matching.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/categories/validation.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/labels/Label.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/labels/LabelRepository.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/labels/__tests__/Label.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/labels/index.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/media/ActivityMedia.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/media/MediaAsset.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/media/MediaRepository.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/media/__tests__/MediaRepository.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/media/index.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/preferences/Profile.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/preferences/ProfileRepository.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/preferences/__tests__/Profile.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/preferences/index.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/sessions/Session.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/SessionDraft.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/SessionRepository.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/StopPoint.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/__tests__/StopPoint.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/domain/sessions/__tests__/calculations.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/__tests__/composition.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/__tests__/sideMode.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/__tests__/validation.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/calculations.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/composition.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/defaults.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/errors.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/index.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/sideMode.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/domain/sessions/validation.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/features/activities/ActivityDefinitionService.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/features/activities/ActivityEditorForm.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/reference-data/__tests__/bodyZones.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/features/reference-data/bodyZones.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/BodyZoneSelector.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/CategoriesScreen.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/SessionService.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/SessionService.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/features/sessions/compositionPresentation.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/__tests__/targetSchema.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/infrastructure/database/constants.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/initializeDatabase.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/migrateDatabase.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/migrations/migration007.ts",
    "change": "CREATE"
  },
  {
    "path": "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
    "change": "CREATE"
  },
  {
    "path": "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
    "change": "CREATE"
  },
  {
    "path": "src/infrastructure/database/repositories/SqliteMediaRepository.ts",
    "change": "CREATE"
  },
  {
    "path": "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
    "change": "CREATE"
  },
  {
    "path": "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/infrastructure/database/types/DatabaseRows.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/shared/i18n/index.test.ts",
    "change": "MODIFY"
  },
  {
    "path": "src/shared/i18n/resources/fr.ts",
    "change": "MODIFY"
  }
]
</KODJO_MODIFIED_MODULES_JSON>

<KODJO_PLAN_DECISIONS_JSON>
[
  {
    "path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Le test importe directement des contrats modifiés, mais aucune assertion de ce test n’est directement démontrée comme incompatible et aucun contrat d’écran n’est modifié."
  },
  {
    "path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "L’import direct d’un contrat de Domaine ou de service ne suffit pas à établir une adaptation de ce test d’écran hors périmètre."
  },
  {
    "path": "src/features/sessions/__tests__/useSessionCatalogue.test.ts",
    "classification": "TEST_UNAFFECTED",
    "justification": "Le test de catalogue n’est pas directement affecté par les changements de fondations et aucune assertion obsolète n’est démontrée."
  },
  {
    "path": "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Le contrat d’écran Catalogue reste hors périmètre et l’import direct ne prouve pas un changement requis."
  },
  {
    "path": "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Le provider d’écran n’est pas adapté ; la présence d’un import direct ne suffit pas à imposer une modification du test."
  },
  {
    "path": "src/features/sessions/__tests__/SessionCard.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Aucune assertion de présentation directement incompatible n’est démontrée par le scan à un niveau."
  },
  {
    "path": "src/features/sessions/__tests__/ColorPalette.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "La palette existante est hors adaptation PRE-1 et l’import direct de Session ne prouve pas un changement."
  },
  {
    "path": "src/features/activities/__tests__/ActivityCard.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Le test de carte n’est pas directement affecté par les contrats de persistance ajoutés."
  },
  {
    "path": "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Aucune assertion directement incompatible n’est démontrée et aucun écran de sélection n’est reconçu."
  },
  {
    "path": "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Le flux UI existant reste hors périmètre ; aucun import transitif n’est inféré et aucun changement direct n’est requis."
  },
  {
    "path": "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Le contrat de navigation n’est pas modifié par PRE-1."
  },
  {
    "path": "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Le contrat de navigation n’est pas modifié par PRE-1."
  },
  {
    "path": "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Le provider de service existant n’est pas une racine modifiée et l’import direct ne suffit pas."
  },
  {
    "path": "src/features/activities/__tests__/useActivityCatalogue.test.ts",
    "classification": "TEST_UNAFFECTED",
    "justification": "Le hook Catalogue n’est pas modifié et aucune assertion directement obsolète n’est démontrée."
  },
  {
    "path": "src/features/activities/__tests__/ActivityCatalogueList.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "La liste Catalogue reste hors contrat d’adaptation de PRE-1."
  },
  {
    "path": "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Le contexte existant reste hors périmètre et aucune incompatibilité directe n’est établie."
  },
  {
    "path": "src/features/sessions/__tests__/SessionServiceContext.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Le contexte de service n’est pas modifié ; aucune adaptation n’est démontrée au niveau direct."
  },
  {
    "path": "app/(creation)/categories.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "La route importe l’écran, mais la correction de l’écran reste compatible avec la route et ne crée pas de nouveau contrat."
  },
  {
    "path": "src/features/activities/ActivityCard.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "L’import direct de l’index Domaine ne prouve pas que ce composant de présentation doit changer."
  },
  {
    "path": "src/features/activities/ActivityDefinitionServiceContext.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Le contexte conserve son rôle et aucune modification directe de son contrat n’est nécessaire."
  },
  {
    "path": "src/features/activities/ActivityDefinitionServiceProvider.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "L’extension interne du service ne démontre pas une adaptation du provider."
  },
  {
    "path": "src/features/activities/ActivitySelectionScreen.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Aucun contrat d’écran de sélection n’est anticipé et l’import direct ne suffit pas."
  },
  {
    "path": "src/features/activities/useActivityCatalogue.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Le hook Catalogue n’est pas directement affecté par les fondations persistantes."
  },
  {
    "path": "src/features/sessions/CatalogueScreen.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "L’écran Catalogue reste hors périmètre et l’import direct de Session ne prouve pas une modification."
  },
  {
    "path": "src/features/sessions/ColorPalette.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "La primitive de palette n’est pas modifiée par PRE-1."
  },
  {
    "path": "src/features/sessions/CompositionScreen.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Aucune interaction ou contrat d’écran de composition n’est modifié dans cette tranche."
  },
  {
    "path": "src/features/sessions/ExerciseScreen.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "L’écran d’Exercice reste hors périmètre ; aucune dépendance directe incompatible n’est démontrée."
  },
  {
    "path": "src/features/sessions/SessionCard.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Le composant de présentation reste compatible et n’est pas une racine de modification."
  },
  {
    "path": "src/features/sessions/SessionDraftContext.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Le contexte UI conserve son contrat existant."
  },
  {
    "path": "src/features/sessions/SessionDraftProvider.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Le provider n’est pas directement affecté par les changements de persistance."
  },
  {
    "path": "src/features/sessions/SessionServiceContext.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Le contexte conserve l’interface du service nécessaire aux consommateurs existants."
  },
  {
    "path": "src/features/sessions/SessionServiceProvider.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "L’extension des services et Repositories ne démontre pas un changement requis de ce provider."
  },
  {
    "path": "src/features/sessions/SideModeControl.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Le contrôle existant reste hors adaptation d’écran ; le changement de source fonctionnelle est couvert par le Domaine et l’i18n."
  },
  {
    "path": "src/features/sessions/compositionGesture.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Aucune interaction de composition n’est modifiée dans PRE-1."
  },
  {
    "path": "src/features/sessions/useSessionCatalogue.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Le hook Catalogue n’est pas directement affecté par le schéma cible."
  },
  {
    "path": "src/infrastructure/database/ExpoDatabase.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Le point d’accès SQLite reste compatible avec les changements portés par l’initialisation et les migrations."
  },
  {
    "path": "src/infrastructure/database/migrations/migration002.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "La migration historique est explicitement préservée ; aucun import direct ne justifie sa modification."
  },
  {
    "path": "src/infrastructure/database/migrations/migration003.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "La migration historique est explicitement préservée et son SQL doit rester identique."
  },
  {
    "path": "src/infrastructure/database/migrations/migration004.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "La migration historique est explicitement préservée et son SQL doit rester identique."
  },
  {
    "path": "src/shared/i18n/index.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Le module d’index consomme la ressource corrigée sans changement direct démontré de son contrat."
  }
]
</KODJO_PLAN_DECISIONS_JSON>

<KODJO_UI_CRITERIA_MATRIX_JSON>
{
  "schema": "kodjo.ui-criteria.v3",
  "criteria": [
    {
      "criterion_id": "UI-16294D4D4345",
      "source": {
        "path": "src/features/sessions/SessionService.ts",
        "locator": "création d’une occurrence",
        "requirement": "La création doit copier la récupération post-exercice du Profil dans l’occurrence sans rétroactivité de la source ou du Profil."
      },
      "risk_types": [
        "FUNCTIONAL"
      ],
      "reuse_search": [
        "src/features/sessions/SessionService.ts",
        "src/features/sessions/__tests__/SessionService.test.ts",
        "src/domain/preferences/ProfileRepository.ts",
        "src/domain/sessions/SessionRepository.ts"
      ],
      "component_decision": "EXTEND",
      "selected_component": {
        "path": "src/features/sessions/SessionService.ts",
        "export": "SessionService"
      },
      "decision_justification": "Le service existant orchestre déjà la composition et reçoit l’extension minimale nécessaire au snapshot atomique.",
      "change_targets": [
        "src/features/sessions/SessionService.ts"
      ],
      "tests": [
        "src/features/sessions/__tests__/SessionService.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-16294D4D4345-A60BD8133829B",
          "source": {
            "path": "src/features/sessions/SessionService.ts",
            "locator": "lecture du Profil lors de l’insertion"
          },
          "property_type": "RELATION",
          "expected": "postActivityRecoverySeconds est initialisé depuis le Profil au moment de la création de l’occurrence.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-16294D4D4345-A88C0507C1BC3",
          "source": {
            "path": "src/features/sessions/SessionService.ts",
            "locator": "persistance de l’occurrence"
          },
          "property_type": "STATE",
          "expected": "Une modification ultérieure du Profil ou de la définition source ne modifie pas l’occurrence déjà créée.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        }
      ]
    },
    {
      "criterion_id": "UI-1652FFC3B512",
      "source": {
        "path": "src/features/sessions/BodyZoneSelector.tsx",
        "locator": "source des options de Zone",
        "requirement": "Le sélecteur doit consommer le référentiel persistant sans réintroduire BODY_ZONES comme source runtime."
      },
      "risk_types": [
        "FUNCTIONAL"
      ],
      "reuse_search": [
        "src/features/sessions/BodyZoneSelector.tsx",
        "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
        "src/domain/body-zones/BodyZoneRepository.ts"
      ],
      "component_decision": "EXTEND",
      "selected_component": {
        "path": "src/features/sessions/BodyZoneSelector.tsx",
        "export": "BodyZoneSelector"
      },
      "decision_justification": "Le composant est adapté à la nouvelle source de données sans changement de contrat d’écran ou de présentation.",
      "change_targets": [
        "src/features/sessions/BodyZoneSelector.tsx"
      ],
      "tests": [
        "src/features/sessions/__tests__/BodyZoneSelector.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-1652FFC3B512-A53C3A28B6B1F",
          "source": {
            "path": "src/features/sessions/BodyZoneSelector.tsx",
            "locator": "sélection et validation"
          },
          "property_type": "STATE",
          "expected": "La sélection conserve la cardinalité cible et refuse une définition sans Zone valide.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        },
        {
          "assertion_id": "UI-1652FFC3B512-A44DC9AD88F62",
          "source": {
            "path": "src/features/sessions/BodyZoneSelector.tsx",
            "locator": "chargement des options"
          },
          "property_type": "RELATION",
          "expected": "Les options proviennent du référentiel BodyZone persistant et non de BODY_ZONES directement.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        }
      ]
    },
    {
      "criterion_id": "UI-40094921B202",
      "source": {
        "path": "src/features/activities/ActivityDefinitionService.ts",
        "locator": "contrat de création et persistance d’ActivityDefinition",
        "requirement": "Le service doit transporter la Catégorie obligatoire, les Zones, les paramètres de bilatéralité, les paramètres propres de l’Exercice et les médias ordonnés sans récupération post-exercice."
      },
      "risk_types": [
        "FUNCTIONAL"
      ],
      "reuse_search": [
        "src/features/activities/ActivityDefinitionService.ts",
        "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
        "src/domain/activities/ActivityDefinitionRepository.ts"
      ],
      "component_decision": "EXTEND",
      "selected_component": {
        "path": "src/features/activities/ActivityDefinitionService.ts",
        "export": "ActivityDefinitionService"
      },
      "decision_justification": "Le service existant est étendu au contrat Domaine cible sans créer d’écran ni de comportement d’exécution.",
      "change_targets": [
        "src/features/activities/ActivityDefinitionService.ts"
      ],
      "tests": [
        "src/features/activities/__tests__/ActivityDefinitionService.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-40094921B202-A2B9231E552E0",
          "source": {
            "path": "src/features/activities/ActivityDefinitionService.ts",
            "locator": "mapping de récupération"
          },
          "property_type": "RELATION",
          "expected": "Aucun champ recoverySeconds ou postActivityRecoverySeconds n’est lu depuis ActivityDefinition.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-40094921B202-A668499E759A7",
          "source": {
            "path": "src/features/activities/ActivityDefinitionService.ts",
            "locator": "payload de création d’ActivityDefinition"
          },
          "property_type": "CONTENT",
          "expected": "La payload contient categoryId, bodyZoneIds, sideMode, sideRecoverySeconds et les paramètres propres de l’Exercice.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        },
        {
          "assertion_id": "UI-40094921B202-A2E0666968E44",
          "source": {
            "path": "src/features/activities/ActivityDefinitionService.ts",
            "locator": "mapping ActivityMedia"
          },
          "property_type": "RELATION",
          "expected": "Les médias sont transmis avec une position stable et persistés dans l’ordre de l’Exercice.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        }
      ]
    },
    {
      "criterion_id": "UI-5FAB9AD7AB21",
      "source": {
        "path": "src/features/reference-data/bodyZones.ts",
        "locator": "BODY_ZONES et seed initial",
        "requirement": "Les Zones statiques restent disponibles pour le seed historique mais ne sont plus l’autorité runtime."
      },
      "risk_types": [
        "FUNCTIONAL"
      ],
      "reuse_search": [
        "src/features/reference-data/bodyZones.ts",
        "src/features/reference-data/__tests__/bodyZones.test.ts",
        "src/domain/body-zones/BodyZoneRepository.ts"
      ],
      "component_decision": "EXTEND",
      "selected_component": {
        "path": "src/features/reference-data/bodyZones.ts",
        "export": "BODY_ZONES"
      },
      "decision_justification": "Le module est conservé comme source de seed et de compatibilité historique, tandis que le runtime utilise BodyZoneRepository.",
      "change_targets": [
        "src/features/reference-data/bodyZones.ts"
      ],
      "tests": [
        "src/features/reference-data/__tests__/bodyZones.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-5FAB9AD7AB21-A9D11A07DBF3D",
          "source": {
            "path": "src/features/reference-data/bodyZones.ts",
            "locator": "API runtime du module"
          },
          "property_type": "RELATION",
          "expected": "Le module n’est pas utilisé comme autorité runtime pour les nouvelles affectations de Zones.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-5FAB9AD7AB21-A315835B08A9E",
          "source": {
            "path": "src/features/reference-data/bodyZones.ts",
            "locator": "export BODY_ZONES"
          },
          "property_type": "CONTENT",
          "expected": "Les valeurs historiques nécessaires aux migrations restent disponibles sans changement de valeurs ni d’ordre.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        }
      ]
    },
    {
      "criterion_id": "UI-6FC9FA01250C",
      "source": {
        "path": "src/features/activities/ActivityEditorForm.tsx",
        "locator": "champ recoverySeconds",
        "requirement": "Le formulaire ne doit plus porter ni réintroduire le champ supprimé recoverySeconds."
      },
      "risk_types": [
        "FUNCTIONAL"
      ],
      "reuse_search": [
        "src/features/activities/ActivityEditorForm.tsx",
        "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
        "src/domain/activities/ActivityDefinition.ts"
      ],
      "component_decision": "EXTEND",
      "selected_component": {
        "path": "src/features/activities/ActivityEditorForm.tsx",
        "export": "ActivityEditorForm"
      },
      "decision_justification": "Le formulaire existant reçoit uniquement la suppression du champ historique, sans refonte d’écran ni nouveau contrat visuel.",
      "change_targets": [
        "src/features/activities/ActivityEditorForm.tsx"
      ],
      "tests": [
        "src/features/activities/__tests__/ActivityEditorForm.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-6FC9FA01250C-AB0E9F9EC7534",
          "source": {
            "path": "src/features/activities/ActivityEditorForm.tsx",
            "locator": "payload de sauvegarde"
          },
          "property_type": "RELATION",
          "expected": "La sauvegarde ne transmet pas recoverySeconds à ActivityDefinitionService.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-6FC9FA01250C-A928F4809B379",
          "source": {
            "path": "src/features/activities/ActivityEditorForm.tsx",
            "locator": "état et soumission du champ recoverySeconds"
          },
          "property_type": "PRESENCE",
          "expected": "Le formulaire ne déclare, n’affiche et ne soumet aucun champ recoverySeconds.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        }
      ]
    },
    {
      "criterion_id": "UI-73382D60E040",
      "source": {
        "path": "src/shared/i18n/resources/fr.ts",
        "locator": "libellé français de UNILATERAL",
        "requirement": "Le libellé fonctionnel français de UNILATERAL doit être explicite et valoir Aucun."
      },
      "risk_types": [
        "FUNCTIONAL"
      ],
      "reuse_search": [
        "src/shared/i18n/resources/fr.ts",
        "src/shared/i18n/index.ts",
        "src/shared/i18n/index.test.ts"
      ],
      "component_decision": "EXTEND",
      "selected_component": {
        "path": "src/shared/i18n/resources/fr.ts",
        "export": "fr"
      },
      "decision_justification": "La ressource existante est complétée par le libellé validé, sans création de composant ni modification de primitive UI.",
      "change_targets": [
        "src/shared/i18n/resources/fr.ts"
      ],
      "tests": [
        "src/shared/i18n/index.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "assertions": [
        {
          "assertion_id": "UI-73382D60E040-A4FF02C1B8271",
          "source": {
            "path": "src/shared/i18n/resources/fr.ts",
            "locator": "clé UNILATERAL"
          },
          "property_type": "CONTENT",
          "expected": "La traduction française de UNILATERAL est exactement « Aucun ».",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        }
      ]
    },
    {
      "criterion_id": "UI-8CB4E7976CBA",
      "source": {
        "path": "src/features/sessions/CategoriesScreen.tsx",
        "locator": "relation Catégorie de Séance",
        "requirement": "L’écran ne doit plus lire ni écrire la relation historique Catégorie de Séance ni la couleur autonome de Séance."
      },
      "risk_types": [
        "FUNCTIONAL"
      ],
      "reuse_search": [
        "src/features/sessions/CategoriesScreen.tsx",
        "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
        "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx"
      ],
      "component_decision": "EXTEND",
      "selected_component": {
        "path": "src/features/sessions/CategoriesScreen.tsx",
        "export": "CategoriesScreen"
      },
      "decision_justification": "La correction est limitée à la suppression des accès historiques directement démontrés ; aucune fonctionnalité d’écran nouvelle n’est introduite.",
      "change_targets": [
        "src/features/sessions/CategoriesScreen.tsx"
      ],
      "tests": [
        "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
        "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-8CB4E7976CBA-A232B8F5CB511",
          "source": {
            "path": "src/features/sessions/CategoriesScreen.tsx",
            "locator": "lecture de la relation Session–Category"
          },
          "property_type": "RELATION",
          "expected": "L’écran ne lit plus la relation Catégorie de Séance N:N.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-8CB4E7976CBA-A244820E39CC7",
          "source": {
            "path": "src/features/sessions/CategoriesScreen.tsx",
            "locator": "sauvegarde de la Séance"
          },
          "property_type": "INTERACTION",
          "expected": "La sauvegarde n’écrit plus de relation Catégorie de Séance ni de couleur autonome historique.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        }
      ]
    },
    {
      "criterion_id": "UI-CDBCCFD16078",
      "source": {
        "path": "src/features/sessions/compositionPresentation.ts",
        "locator": "construction de la présentation des Zones et de la composition",
        "requirement": "La présentation doit refléter les données cibles sans utiliser BODY_ZONES comme autorité runtime ni le sideMode du Tour."
      },
      "risk_types": [
        "FUNCTIONAL"
      ],
      "reuse_search": [
        "src/features/sessions/compositionPresentation.ts",
        "src/features/sessions/__tests__/compositionPresentation.test.ts",
        "src/domain/sessions/composition.ts"
      ],
      "component_decision": "EXTEND",
      "selected_component": {
        "path": "src/features/sessions/compositionPresentation.ts",
        "export": "formatExerciseBodyZones"
      },
      "decision_justification": "Le module de présentation est ajusté uniquement pour consommer les contrats cibles déjà définis ; aucune nouvelle interaction de composition n’est créée.",
      "change_targets": [
        "src/features/sessions/compositionPresentation.ts"
      ],
      "tests": [
        "src/features/sessions/__tests__/compositionPresentation.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-CDBCCFD16078-A02C89E1B9BA5",
          "source": {
            "path": "src/features/sessions/compositionPresentation.ts",
            "locator": "résolution de la direction"
          },
          "property_type": "RELATION",
          "expected": "La direction affichée provient exclusivement du sideMode de l’Exercice et jamais du Tour.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-CDBCCFD16078-A89783883A31A",
          "source": {
            "path": "src/features/sessions/compositionPresentation.ts",
            "locator": "résolution des Zones"
          },
          "property_type": "RELATION",
          "expected": "La présentation utilise les Zones persistées ou les données de composition fournies, jamais BODY_ZONES comme autorité runtime.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        }
      ]
    }
  ],
  "preservation": {
    "preserve": [
      {
        "target": "src/infrastructure/database/migrations/migration001.ts",
        "justification": "La migration historique doit rester strictement inchangée.",
        "locator": {
          "kind": "PATH",
          "path": "src/infrastructure/database/migrations/migration001.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/infrastructure/database/migrations/migration002.ts",
        "justification": "Le SQL historique et les exports consommés restent inchangés.",
        "locator": {
          "kind": "PATH",
          "path": "src/infrastructure/database/migrations/migration002.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/infrastructure/database/migrations/migration003.ts",
        "justification": "Le SQL historique des Zones reste inchangé.",
        "locator": {
          "kind": "PATH",
          "path": "src/infrastructure/database/migrations/migration003.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/infrastructure/database/migrations/migration004.ts",
        "justification": "Le SQL historique des Zones reste inchangé.",
        "locator": {
          "kind": "PATH",
          "path": "src/infrastructure/database/migrations/migration004.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/infrastructure/database/migrations/migration005.ts",
        "justification": "La migration historique reste inchangée.",
        "locator": {
          "kind": "PATH",
          "path": "src/infrastructure/database/migrations/migration005.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/infrastructure/database/migrations/migration006.ts",
        "justification": "La migration historique reste inchangée.",
        "locator": {
          "kind": "PATH",
          "path": "src/infrastructure/database/migrations/migration006.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/shared/ui/ScreenShell.tsx",
        "justification": "Aucune primitive UI partagée n’est modifiée par PRE-1.",
        "locator": {
          "kind": "PATH",
          "path": "src/shared/ui/ScreenShell.tsx",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "app/(creation)/_layout.tsx",
        "justification": "Les contrats d’écran de création restent hors périmètre.",
        "locator": {
          "kind": "PATH",
          "path": "app/(creation)/_layout.tsx",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      }
    ],
    "change": [
      {
        "target": "src/features/activities/ActivityDefinitionService.ts",
        "justification": "Le service adopte le contrat Domaine cible."
      },
      {
        "target": "src/features/activities/ActivityEditorForm.tsx",
        "justification": "Le champ recoverySeconds historique est retiré."
      },
      {
        "target": "src/features/reference-data/bodyZones.ts",
        "justification": "Le module devient une source de seed et non l’autorité runtime."
      },
      {
        "target": "src/features/sessions/BodyZoneSelector.tsx",
        "justification": "Le sélecteur utilise le référentiel persistant."
      },
      {
        "target": "src/features/sessions/CategoriesScreen.tsx",
        "justification": "Les accès à la relation historique sont retirés."
      },
      {
        "target": "src/features/sessions/SessionService.ts",
        "justification": "Le service snapshotte les valeurs du Profil."
      },
      {
        "target": "src/features/sessions/compositionPresentation.ts",
        "justification": "La présentation cesse d’utiliser les sources historiques comme autorité runtime."
      },
      {
        "target": "src/shared/i18n/resources/fr.ts",
        "justification": "Le libellé cible UNILATERAL est ajouté."
      }
    ],
    "forbidden": [
      {
        "target": "src/features/execution/README.md",
        "justification": "Aucun module d’Exécution ne doit être commencé dans PRE-1.",
        "locator": {
          "kind": "PATH",
          "path": "src/features/execution/README.md",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/shared/ui",
        "justification": "Les primitives UI partagées sont hors périmètre de la correction.",
        "locator": {
          "kind": "PATH",
          "path": "src/shared/ui/ScreenShell.tsx",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      }
    ]
  }
}
</KODJO_UI_CRITERIA_MATRIX_JSON>

<KODJO_NON_UI_REQUIREMENTS_JSON>
[
  {
    "source": {
      "path": ".github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md",
      "locator": "§§5–9",
      "requirement": "Représenter les référentiels persistants, les cardinalités Catégorie 1, Zones 1..N, la bilatéralité portée par l’Exercice et la séparation des pauses."
    },
    "requirement_type": "DATA",
    "change_targets": [
      "src/domain/activities/ActivityDefinition.ts",
      "src/domain/activities/ActivityDefinitionRepository.ts",
      "src/domain/activities/index.ts",
      "src/domain/body-zones/BodyZone.ts",
      "src/domain/body-zones/BodyZoneRepository.ts",
      "src/domain/body-zones/index.ts",
      "src/domain/categories/Category.ts",
      "src/domain/categories/CategoryRepository.ts",
      "src/domain/categories/defaults.ts",
      "src/domain/categories/errors.ts",
      "src/domain/categories/index.ts",
      "src/domain/categories/matching.ts",
      "src/domain/categories/validation.ts",
      "src/domain/labels/Label.ts",
      "src/domain/labels/LabelRepository.ts",
      "src/domain/labels/index.ts",
      "src/domain/sessions/Session.ts",
      "src/domain/sessions/SessionDraft.ts",
      "src/domain/sessions/SessionRepository.ts",
      "src/domain/sessions/calculations.ts",
      "src/domain/sessions/composition.ts",
      "src/domain/sessions/defaults.ts",
      "src/domain/sessions/errors.ts",
      "src/domain/sessions/index.ts",
      "src/domain/sessions/sideMode.ts",
      "src/domain/sessions/validation.ts"
    ],
    "tests": [
      "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "src/domain/body-zones/__tests__/BodyZone.test.ts",
      "src/domain/categories/__tests__/matching.test.ts",
      "src/domain/categories/__tests__/validation.test.ts",
      "src/domain/labels/__tests__/Label.test.ts",
      "src/domain/sessions/__tests__/calculations.test.ts",
      "src/domain/sessions/__tests__/composition.test.ts",
      "src/domain/sessions/__tests__/sideMode.test.ts",
      "src/domain/sessions/__tests__/validation.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST",
      "STATIC_ANALYSIS"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": ".github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md",
      "locator": "§§7 et 10",
      "requirement": "Créer une occurrence indépendante avec postActivityRecoverySeconds initialisé depuis le Profil, sans rétroactivité de la source ni du Profil."
    },
    "requirement_type": "FUNCTIONAL",
    "change_targets": [
      "src/domain/preferences/Profile.ts",
      "src/domain/preferences/ProfileRepository.ts",
      "src/domain/preferences/index.ts",
      "src/domain/sessions/Session.ts",
      "src/features/sessions/SessionService.ts"
    ],
    "tests": [
      "src/domain/preferences/__tests__/Profile.test.ts",
      "src/features/sessions/__tests__/SessionService.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": ".github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md",
      "locator": "§§11–13",
      "requirement": "Représenter la Séance, les Points d’arrêt, les médias ordonnés et les limites de composition sans construire le moteur."
    },
    "requirement_type": "DATA",
    "change_targets": [
      "src/domain/sessions/Session.ts",
      "src/domain/sessions/SessionDraft.ts",
      "src/domain/sessions/SessionRepository.ts",
      "src/domain/sessions/StopPoint.ts",
      "src/domain/sessions/composition.ts",
      "src/domain/media/ActivityMedia.ts",
      "src/domain/media/MediaAsset.ts",
      "src/domain/media/MediaRepository.ts",
      "src/domain/media/index.ts"
    ],
    "tests": [
      "src/domain/sessions/__tests__/SessionDraft.test.ts",
      "src/domain/sessions/__tests__/StopPoint.test.ts",
      "src/domain/sessions/__tests__/composition.test.ts",
      "src/domain/media/__tests__/MediaRepository.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST",
      "STATIC_ANALYSIS"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": ".github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md",
      "locator": "§14",
      "requirement": "Définir le schéma SQLite cible, les clés étrangères, cardinalités, unicités, index et valeurs par défaut."
    },
    "requirement_type": "TECHNICAL",
    "change_targets": [
      "src/infrastructure/database/constants.ts",
      "src/infrastructure/database/types/DatabaseRows.ts",
      "src/infrastructure/database/migrations/migration007.ts",
      "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
      "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
      "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
      "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
      "src/infrastructure/database/repositories/SqliteMediaRepository.ts",
      "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
      "src/infrastructure/database/repositories/SqliteSessionRepository.ts"
    ],
    "tests": [
      "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
      "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
      "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
      "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
      "src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts",
      "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
      "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
      "src/infrastructure/database/__tests__/targetSchema.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST",
      "STATIC_ANALYSIS"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": ".github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md",
      "locator": "§§3, 14.2 et 16",
      "requirement": "Faire converger installation neuve et base existante vers le même schéma cible, avec destruction autorisée des données de développement incompatibles."
    },
    "requirement_type": "MIGRATION",
    "change_targets": [
      "src/infrastructure/database/initializeDatabase.ts",
      "src/infrastructure/database/migrateDatabase.ts",
      "src/infrastructure/database/migrations/migration007.ts"
    ],
    "tests": [
      "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
      "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "src/infrastructure/database/__tests__/targetSchema.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST",
      "STATIC_ANALYSIS"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": "src/infrastructure/database/migrations/migration002.ts",
      "locator": "imports et génération SQL des valeurs historiques",
      "requirement": "Préserver exactement les exports et le SQL historique consommés par migration002, migration003 et migration004 malgré l’évolution des sources cibles."
    },
    "requirement_type": "PRESERVATION",
    "change_targets": [
      "src/domain/categories/defaults.ts",
      "src/domain/categories/validation.ts",
      "src/features/reference-data/bodyZones.ts"
    ],
    "tests": [
      "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "src/infrastructure/database/__tests__/targetSchema.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST",
      "STATIC_ANALYSIS"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": "src/domain/categories/errors.ts",
      "locator": "union ValidationField",
      "requirement": "Adapter l’union canonique des Catégories aux champs cibles et retirer les champs historiques supprimés."
    },
    "requirement_type": "TECHNICAL",
    "change_targets": [
      "src/domain/categories/errors.ts",
      "src/domain/categories/validation.ts"
    ],
    "tests": [
      "src/domain/categories/__tests__/validation.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST",
      "STATIC_ANALYSIS"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": "src/domain/sessions/errors.ts",
      "locator": "union ValidationField",
      "requirement": "Adapter l’union canonique des Séances aux paramètres cibles et retirer les champs historiques supprimés."
    },
    "requirement_type": "TECHNICAL",
    "change_targets": [
      "src/domain/sessions/errors.ts",
      "src/domain/sessions/validation.ts"
    ],
    "tests": [
      "src/domain/sessions/__tests__/validation.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST",
      "STATIC_ANALYSIS"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": "src/features/activities/ActivityEditorForm.tsx",
      "locator": "champ recoverySeconds",
      "requirement": "Retirer les références directes au champ supprimé afin que le consommateur compile et ne réintroduise pas l’ancienne sémantique."
    },
    "requirement_type": "FUNCTIONAL",
    "change_targets": [
      "src/features/activities/ActivityEditorForm.tsx"
    ],
    "tests": [
      "src/features/activities/__tests__/ActivityEditorForm.test.tsx"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST",
      "STATIC_ANALYSIS"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": "src/features/sessions/CategoriesScreen.tsx",
      "locator": "relation Catégorie de Séance",
      "requirement": "Retirer la lecture et l’écriture de la relation historique supprimée et de la couleur autonome sans créer une nouvelle fonctionnalité d’écran."
    },
    "requirement_type": "FUNCTIONAL",
    "change_targets": [
      "src/features/sessions/CategoriesScreen.tsx"
    ],
    "tests": [
      "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
      "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST",
      "STATIC_ANALYSIS"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
      "locator": "fixtures et lectures recoverySeconds/categories",
      "requirement": "Adapter l’outil natif aux contrats cibles et supprimer les fixtures obsolètes."
    },
    "requirement_type": "TECHNICAL",
    "change_targets": [
      "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts"
    ],
    "tests": [],
    "no_automated_test_reason": "Le contrôle est un outil natif sans harnais unitaire dédié ; l’analyse statique, le typecheck et l’exécution native disponible fournissent la preuve adaptée.",
    "proof_required": [
      "STATIC_ANALYSIS",
      "DEVICE_CHECK"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": "src/shared/i18n/resources/fr.ts",
      "locator": "clé UNILATERAL",
      "requirement": "Rendre explicite le libellé français cible UNILATERAL → Aucun."
    },
    "requirement_type": "FUNCTIONAL",
    "change_targets": [
      "src/shared/i18n/resources/fr.ts"
    ],
    "tests": [
      "src/shared/i18n/index.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST",
      "STATIC_ANALYSIS"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": ".github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md",
      "locator": "§§16–17",
      "requirement": "Les tests Domaine, services, Repository, persistance, migration et convergence doivent être verts avant la clôture de PRE-1."
    },
    "requirement_type": "PRESERVATION",
    "change_targets": [
      "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "src/domain/categories/__tests__/validation.test.ts",
      "src/domain/sessions/__tests__/calculations.test.ts",
      "src/infrastructure/database/__tests__/targetSchema.test.ts",
      "src/infrastructure/database/__tests__/migrateDatabase.test.ts"
    ],
    "tests": [
      "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "src/domain/sessions/__tests__/calculations.test.ts",
      "src/infrastructure/database/__tests__/targetSchema.test.ts",
      "src/infrastructure/database/__tests__/migrateDatabase.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST"
    ],
    "status": "DEFINED"
  }
]
</KODJO_NON_UI_REQUIREMENTS_JSON>

<KODJO_NON_UI_COVERAGE_JSON>
{
  "status": "ENUMERATED",
  "reason": "Les exigences non visuelles de la qualification, de la revue et des dépendances causales sont énumérées séparément ; les exigences des modules UI et i18n modifiables sont couvertes par la matrice UI v3.",
  "source_paths": [
    ".github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md",
    "src/infrastructure/database/migrations/migration002.ts",
    "src/domain/categories/errors.ts",
    "src/domain/sessions/errors.ts",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/sessions/CategoriesScreen.tsx",
    "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
    "src/shared/i18n/resources/fr.ts"
  ]
}
</KODJO_NON_UI_COVERAGE_JSON>

<KODJO_REQUIREMENT_CONTRACT_JSON>
{
  "schema": "kodjo.requirement-contract.v1",
  "requirement_count": 21,
  "requirement_ids_sha256": "6848460f1104f5b9f26491080295182c6c98d9a329e1d2cd3b4aaf2925cf5a31",
  "requirements": [
    {
      "requirement_id": "REQ-001108DC7F67664C",
      "domain": "NON_UI",
      "requirement_type": "DATA",
      "source": {
        "path": ".github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md",
        "locator": "§§11–13",
        "requirement": "Représenter la Séance, les Points d’arrêt, les médias ordonnés et les limites de composition sans construire le moteur."
      },
      "change_targets": [
        "src/domain/media/ActivityMedia.ts",
        "src/domain/media/MediaAsset.ts",
        "src/domain/media/MediaRepository.ts",
        "src/domain/media/index.ts",
        "src/domain/sessions/Session.ts",
        "src/domain/sessions/SessionDraft.ts",
        "src/domain/sessions/SessionRepository.ts",
        "src/domain/sessions/StopPoint.ts",
        "src/domain/sessions/composition.ts"
      ],
      "tests": [
        "src/domain/media/__tests__/MediaRepository.test.ts",
        "src/domain/sessions/__tests__/SessionDraft.test.ts",
        "src/domain/sessions/__tests__/StopPoint.test.ts",
        "src/domain/sessions/__tests__/composition.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-0754A5F195D47F95",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "src/features/sessions/BodyZoneSelector.tsx",
        "locator": "source des options de Zone",
        "requirement": "Le sélecteur doit consommer le référentiel persistant sans réintroduire BODY_ZONES comme source runtime."
      },
      "change_targets": [
        "src/features/sessions/BodyZoneSelector.tsx"
      ],
      "tests": [
        "src/features/sessions/__tests__/BodyZoneSelector.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-1652FFC3B512",
        "component_decision": "EXTEND",
        "selected_component": {
          "path": "src/features/sessions/BodyZoneSelector.tsx",
          "export": "BodyZoneSelector"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-1652FFC3B512-A53C3A28B6B1F",
          "property_type": "STATE",
          "expected": "La sélection conserve la cardinalité cible et refuse une définition sans Zone valide.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        },
        {
          "assertion_id": "UI-1652FFC3B512-A44DC9AD88F62",
          "property_type": "RELATION",
          "expected": "Les options proviennent du référentiel BodyZone persistant et non de BODY_ZONES directement.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-0A670F0C0E88AF43",
      "domain": "NON_UI",
      "requirement_type": "FUNCTIONAL",
      "source": {
        "path": "src/features/activities/ActivityEditorForm.tsx",
        "locator": "champ recoverySeconds",
        "requirement": "Retirer les références directes au champ supprimé afin que le consommateur compile et ne réintroduise pas l’ancienne sémantique."
      },
      "change_targets": [
        "src/features/activities/ActivityEditorForm.tsx"
      ],
      "tests": [
        "src/features/activities/__tests__/ActivityEditorForm.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-325E2AA8C2F2693A",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "src/features/activities/ActivityDefinitionService.ts",
        "locator": "contrat de création et persistance d’ActivityDefinition",
        "requirement": "Le service doit transporter la Catégorie obligatoire, les Zones, les paramètres de bilatéralité, les paramètres propres de l’Exercice et les médias ordonnés sans récupération post-exercice."
      },
      "change_targets": [
        "src/features/activities/ActivityDefinitionService.ts"
      ],
      "tests": [
        "src/features/activities/__tests__/ActivityDefinitionService.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-40094921B202",
        "component_decision": "EXTEND",
        "selected_component": {
          "path": "src/features/activities/ActivityDefinitionService.ts",
          "export": "ActivityDefinitionService"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-40094921B202-A2B9231E552E0",
          "property_type": "RELATION",
          "expected": "Aucun champ recoverySeconds ou postActivityRecoverySeconds n’est lu depuis ActivityDefinition.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-40094921B202-A668499E759A7",
          "property_type": "CONTENT",
          "expected": "La payload contient categoryId, bodyZoneIds, sideMode, sideRecoverySeconds et les paramètres propres de l’Exercice.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        },
        {
          "assertion_id": "UI-40094921B202-A2E0666968E44",
          "property_type": "RELATION",
          "expected": "Les médias sont transmis avec une position stable et persistés dans l’ordre de l’Exercice.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-425A6FE7F5647AA7",
      "domain": "NON_UI",
      "requirement_type": "FUNCTIONAL",
      "source": {
        "path": "src/shared/i18n/resources/fr.ts",
        "locator": "clé UNILATERAL",
        "requirement": "Rendre explicite le libellé français cible UNILATERAL → Aucun."
      },
      "change_targets": [
        "src/shared/i18n/resources/fr.ts"
      ],
      "tests": [
        "src/shared/i18n/index.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-42FABF7B1BDBB222",
      "domain": "NON_UI",
      "requirement_type": "FUNCTIONAL",
      "source": {
        "path": "src/features/sessions/CategoriesScreen.tsx",
        "locator": "relation Catégorie de Séance",
        "requirement": "Retirer la lecture et l’écriture de la relation historique supprimée et de la couleur autonome sans créer une nouvelle fonctionnalité d’écran."
      },
      "change_targets": [
        "src/features/sessions/CategoriesScreen.tsx"
      ],
      "tests": [
        "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
        "src/features/sessions/__tests__/CategoriesScreen.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-7121A20CC376709A",
      "domain": "NON_UI",
      "requirement_type": "PRESERVATION",
      "source": {
        "path": ".github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md",
        "locator": "§§16–17",
        "requirement": "Les tests Domaine, services, Repository, persistance, migration et convergence doivent être verts avant la clôture de PRE-1."
      },
      "change_targets": [
        "src/domain/activities/__tests__/ActivityDefinition.test.ts",
        "src/domain/categories/__tests__/validation.test.ts",
        "src/domain/sessions/__tests__/calculations.test.ts",
        "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
        "src/infrastructure/database/__tests__/targetSchema.test.ts"
      ],
      "tests": [
        "src/domain/activities/__tests__/ActivityDefinition.test.ts",
        "src/domain/sessions/__tests__/calculations.test.ts",
        "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
        "src/infrastructure/database/__tests__/targetSchema.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-8669953876F41507",
      "domain": "NON_UI",
      "requirement_type": "PRESERVATION",
      "source": {
        "path": "src/infrastructure/database/migrations/migration002.ts",
        "locator": "imports et génération SQL des valeurs historiques",
        "requirement": "Préserver exactement les exports et le SQL historique consommés par migration002, migration003 et migration004 malgré l’évolution des sources cibles."
      },
      "change_targets": [
        "src/domain/categories/defaults.ts",
        "src/domain/categories/validation.ts",
        "src/features/reference-data/bodyZones.ts"
      ],
      "tests": [
        "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
        "src/infrastructure/database/__tests__/targetSchema.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-982901A85204184E",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "src/features/sessions/SessionService.ts",
        "locator": "création d’une occurrence",
        "requirement": "La création doit copier la récupération post-exercice du Profil dans l’occurrence sans rétroactivité de la source ou du Profil."
      },
      "change_targets": [
        "src/features/sessions/SessionService.ts"
      ],
      "tests": [
        "src/features/sessions/__tests__/SessionService.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-16294D4D4345",
        "component_decision": "EXTEND",
        "selected_component": {
          "path": "src/features/sessions/SessionService.ts",
          "export": "SessionService"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-16294D4D4345-A60BD8133829B",
          "property_type": "RELATION",
          "expected": "postActivityRecoverySeconds est initialisé depuis le Profil au moment de la création de l’occurrence.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-16294D4D4345-A88C0507C1BC3",
          "property_type": "STATE",
          "expected": "Une modification ultérieure du Profil ou de la définition source ne modifie pas l’occurrence déjà créée.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-A2F15FD967FEAC96",
      "domain": "NON_UI",
      "requirement_type": "FUNCTIONAL",
      "source": {
        "path": ".github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md",
        "locator": "§§7 et 10",
        "requirement": "Créer une occurrence indépendante avec postActivityRecoverySeconds initialisé depuis le Profil, sans rétroactivité de la source ni du Profil."
      },
      "change_targets": [
        "src/domain/preferences/Profile.ts",
        "src/domain/preferences/ProfileRepository.ts",
        "src/domain/preferences/index.ts",
        "src/domain/sessions/Session.ts",
        "src/features/sessions/SessionService.ts"
      ],
      "tests": [
        "src/domain/preferences/__tests__/Profile.test.ts",
        "src/features/sessions/__tests__/SessionService.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-A5DDEE4EC1994A6B",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "src/features/activities/ActivityEditorForm.tsx",
        "locator": "champ recoverySeconds",
        "requirement": "Le formulaire ne doit plus porter ni réintroduire le champ supprimé recoverySeconds."
      },
      "change_targets": [
        "src/features/activities/ActivityEditorForm.tsx"
      ],
      "tests": [
        "src/features/activities/__tests__/ActivityEditorForm.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-6FC9FA01250C",
        "component_decision": "EXTEND",
        "selected_component": {
          "path": "src/features/activities/ActivityEditorForm.tsx",
          "export": "ActivityEditorForm"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-6FC9FA01250C-AB0E9F9EC7534",
          "property_type": "RELATION",
          "expected": "La sauvegarde ne transmet pas recoverySeconds à ActivityDefinitionService.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-6FC9FA01250C-A928F4809B379",
          "property_type": "PRESENCE",
          "expected": "Le formulaire ne déclare, n’affiche et ne soumet aucun champ recoverySeconds.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-A9FC7C3A2A476D40",
      "domain": "NON_UI",
      "requirement_type": "MIGRATION",
      "source": {
        "path": ".github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md",
        "locator": "§§3, 14.2 et 16",
        "requirement": "Faire converger installation neuve et base existante vers le même schéma cible, avec destruction autorisée des données de développement incompatibles."
      },
      "change_targets": [
        "src/infrastructure/database/initializeDatabase.ts",
        "src/infrastructure/database/migrateDatabase.ts",
        "src/infrastructure/database/migrations/migration007.ts"
      ],
      "tests": [
        "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
        "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
        "src/infrastructure/database/__tests__/targetSchema.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-B89A1B7A4F23FA8B",
      "domain": "NON_UI",
      "requirement_type": "TECHNICAL",
      "source": {
        "path": "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
        "locator": "fixtures et lectures recoverySeconds/categories",
        "requirement": "Adapter l’outil natif aux contrats cibles et supprimer les fixtures obsolètes."
      },
      "change_targets": [
        "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts"
      ],
      "tests": [],
      "proof_required": [
        "DEVICE_CHECK",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "Le contrôle est un outil natif sans harnais unitaire dédié ; l’analyse statique, le typecheck et l’exécution native disponible fournissent la preuve adaptée."
    },
    {
      "requirement_id": "REQ-BD9607FF0909157B",
      "domain": "NON_UI",
      "requirement_type": "TECHNICAL",
      "source": {
        "path": "src/domain/sessions/errors.ts",
        "locator": "union ValidationField",
        "requirement": "Adapter l’union canonique des Séances aux paramètres cibles et retirer les champs historiques supprimés."
      },
      "change_targets": [
        "src/domain/sessions/errors.ts",
        "src/domain/sessions/validation.ts"
      ],
      "tests": [
        "src/domain/sessions/__tests__/validation.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-C706F1B21014E9F7",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "src/shared/i18n/resources/fr.ts",
        "locator": "libellé français de UNILATERAL",
        "requirement": "Le libellé fonctionnel français de UNILATERAL doit être explicite et valoir Aucun."
      },
      "change_targets": [
        "src/shared/i18n/resources/fr.ts"
      ],
      "tests": [
        "src/shared/i18n/index.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-73382D60E040",
        "component_decision": "EXTEND",
        "selected_component": {
          "path": "src/shared/i18n/resources/fr.ts",
          "export": "fr"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-73382D60E040-A4FF02C1B8271",
          "property_type": "CONTENT",
          "expected": "La traduction française de UNILATERAL est exactement « Aucun ».",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-C78EAD48949240B1",
      "domain": "NON_UI",
      "requirement_type": "TECHNICAL",
      "source": {
        "path": ".github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md",
        "locator": "§14",
        "requirement": "Définir le schéma SQLite cible, les clés étrangères, cardinalités, unicités, index et valeurs par défaut."
      },
      "change_targets": [
        "src/infrastructure/database/constants.ts",
        "src/infrastructure/database/migrations/migration007.ts",
        "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
        "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
        "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
        "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
        "src/infrastructure/database/repositories/SqliteMediaRepository.ts",
        "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
        "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
        "src/infrastructure/database/types/DatabaseRows.ts"
      ],
      "tests": [
        "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
        "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
        "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
        "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
        "src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts",
        "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
        "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
        "src/infrastructure/database/__tests__/targetSchema.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-CA29CD728EEABCB2",
      "domain": "NON_UI",
      "requirement_type": "DATA",
      "source": {
        "path": ".github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md",
        "locator": "§§5–9",
        "requirement": "Représenter les référentiels persistants, les cardinalités Catégorie 1, Zones 1..N, la bilatéralité portée par l’Exercice et la séparation des pauses."
      },
      "change_targets": [
        "src/domain/activities/ActivityDefinition.ts",
        "src/domain/activities/ActivityDefinitionRepository.ts",
        "src/domain/activities/index.ts",
        "src/domain/body-zones/BodyZone.ts",
        "src/domain/body-zones/BodyZoneRepository.ts",
        "src/domain/body-zones/index.ts",
        "src/domain/categories/Category.ts",
        "src/domain/categories/CategoryRepository.ts",
        "src/domain/categories/defaults.ts",
        "src/domain/categories/errors.ts",
        "src/domain/categories/index.ts",
        "src/domain/categories/matching.ts",
        "src/domain/categories/validation.ts",
        "src/domain/labels/Label.ts",
        "src/domain/labels/LabelRepository.ts",
        "src/domain/labels/index.ts",
        "src/domain/sessions/Session.ts",
        "src/domain/sessions/SessionDraft.ts",
        "src/domain/sessions/SessionRepository.ts",
        "src/domain/sessions/calculations.ts",
        "src/domain/sessions/composition.ts",
        "src/domain/sessions/defaults.ts",
        "src/domain/sessions/errors.ts",
        "src/domain/sessions/index.ts",
        "src/domain/sessions/sideMode.ts",
        "src/domain/sessions/validation.ts"
      ],
      "tests": [
        "src/domain/activities/__tests__/ActivityDefinition.test.ts",
        "src/domain/body-zones/__tests__/BodyZone.test.ts",
        "src/domain/categories/__tests__/matching.test.ts",
        "src/domain/categories/__tests__/validation.test.ts",
        "src/domain/labels/__tests__/Label.test.ts",
        "src/domain/sessions/__tests__/calculations.test.ts",
        "src/domain/sessions/__tests__/composition.test.ts",
        "src/domain/sessions/__tests__/sideMode.test.ts",
        "src/domain/sessions/__tests__/validation.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-D27BF6F54CCDD015",
      "domain": "NON_UI",
      "requirement_type": "TECHNICAL",
      "source": {
        "path": "src/domain/categories/errors.ts",
        "locator": "union ValidationField",
        "requirement": "Adapter l’union canonique des Catégories aux champs cibles et retirer les champs historiques supprimés."
      },
      "change_targets": [
        "src/domain/categories/errors.ts",
        "src/domain/categories/validation.ts"
      ],
      "tests": [
        "src/domain/categories/__tests__/validation.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-E7260E768F020CE0",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "src/features/reference-data/bodyZones.ts",
        "locator": "BODY_ZONES et seed initial",
        "requirement": "Les Zones statiques restent disponibles pour le seed historique mais ne sont plus l’autorité runtime."
      },
      "change_targets": [
        "src/features/reference-data/bodyZones.ts"
      ],
      "tests": [
        "src/features/reference-data/__tests__/bodyZones.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-5FAB9AD7AB21",
        "component_decision": "EXTEND",
        "selected_component": {
          "path": "src/features/reference-data/bodyZones.ts",
          "export": "BODY_ZONES"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-5FAB9AD7AB21-A9D11A07DBF3D",
          "property_type": "RELATION",
          "expected": "Le module n’est pas utilisé comme autorité runtime pour les nouvelles affectations de Zones.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-5FAB9AD7AB21-A315835B08A9E",
          "property_type": "CONTENT",
          "expected": "Les valeurs historiques nécessaires aux migrations restent disponibles sans changement de valeurs ni d’ordre.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-E93E249B50BFD089",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "src/features/sessions/CategoriesScreen.tsx",
        "locator": "relation Catégorie de Séance",
        "requirement": "L’écran ne doit plus lire ni écrire la relation historique Catégorie de Séance ni la couleur autonome de Séance."
      },
      "change_targets": [
        "src/features/sessions/CategoriesScreen.tsx"
      ],
      "tests": [
        "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
        "src/features/sessions/__tests__/CategoriesScreen.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-8CB4E7976CBA",
        "component_decision": "EXTEND",
        "selected_component": {
          "path": "src/features/sessions/CategoriesScreen.tsx",
          "export": "CategoriesScreen"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-8CB4E7976CBA-A232B8F5CB511",
          "property_type": "RELATION",
          "expected": "L’écran ne lit plus la relation Catégorie de Séance N:N.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-8CB4E7976CBA-A244820E39CC7",
          "property_type": "INTERACTION",
          "expected": "La sauvegarde n’écrit plus de relation Catégorie de Séance ni de couleur autonome historique.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-FBE85CDF92C9E827",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "src/features/sessions/compositionPresentation.ts",
        "locator": "construction de la présentation des Zones et de la composition",
        "requirement": "La présentation doit refléter les données cibles sans utiliser BODY_ZONES comme autorité runtime ni le sideMode du Tour."
      },
      "change_targets": [
        "src/features/sessions/compositionPresentation.ts"
      ],
      "tests": [
        "src/features/sessions/__tests__/compositionPresentation.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-CDBCCFD16078",
        "component_decision": "EXTEND",
        "selected_component": {
          "path": "src/features/sessions/compositionPresentation.ts",
          "export": "formatExerciseBodyZones"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-CDBCCFD16078-A02C89E1B9BA5",
          "property_type": "RELATION",
          "expected": "La direction affichée provient exclusivement du sideMode de l’Exercice et jamais du Tour.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-CDBCCFD16078-A89783883A31A",
          "property_type": "RELATION",
          "expected": "La présentation utilise les Zones persistées ou les données de composition fournies, jamais BODY_ZONES comme autorité runtime.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS",
            "VISUAL_COMPARE"
          ]
        }
      ]
    }
  ]
}
</KODJO_REQUIREMENT_CONTRACT_JSON>

<KODJO_TEST_CONTRACT_JSON>
{
  "schema": "kodjo.test-contract.v1",
  "binding_count": 47,
  "bindings": [
    {
      "requirement_id": "REQ-001108DC7F67664C",
      "test_path": "src/domain/media/__tests__/MediaRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-001108DC7F67664C",
      "test_path": "src/domain/sessions/__tests__/composition.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-001108DC7F67664C",
      "test_path": "src/domain/sessions/__tests__/SessionDraft.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-001108DC7F67664C",
      "test_path": "src/domain/sessions/__tests__/StopPoint.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-0754A5F195D47F95",
      "test_path": "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-0A670F0C0E88AF43",
      "test_path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-325E2AA8C2F2693A",
      "test_path": "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-425A6FE7F5647AA7",
      "test_path": "src/shared/i18n/index.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-42FABF7B1BDBB222",
      "test_path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-42FABF7B1BDBB222",
      "test_path": "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-7121A20CC376709A",
      "test_path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-7121A20CC376709A",
      "test_path": "src/domain/sessions/__tests__/calculations.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-7121A20CC376709A",
      "test_path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-7121A20CC376709A",
      "test_path": "src/infrastructure/database/__tests__/targetSchema.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-8669953876F41507",
      "test_path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-8669953876F41507",
      "test_path": "src/infrastructure/database/__tests__/targetSchema.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-982901A85204184E",
      "test_path": "src/features/sessions/__tests__/SessionService.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-A2F15FD967FEAC96",
      "test_path": "src/domain/preferences/__tests__/Profile.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-A2F15FD967FEAC96",
      "test_path": "src/features/sessions/__tests__/SessionService.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-A5DDEE4EC1994A6B",
      "test_path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-A9FC7C3A2A476D40",
      "test_path": "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-A9FC7C3A2A476D40",
      "test_path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-A9FC7C3A2A476D40",
      "test_path": "src/infrastructure/database/__tests__/targetSchema.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-BD9607FF0909157B",
      "test_path": "src/domain/sessions/__tests__/validation.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C706F1B21014E9F7",
      "test_path": "src/shared/i18n/index.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C78EAD48949240B1",
      "test_path": "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C78EAD48949240B1",
      "test_path": "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C78EAD48949240B1",
      "test_path": "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C78EAD48949240B1",
      "test_path": "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C78EAD48949240B1",
      "test_path": "src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C78EAD48949240B1",
      "test_path": "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C78EAD48949240B1",
      "test_path": "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C78EAD48949240B1",
      "test_path": "src/infrastructure/database/__tests__/targetSchema.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-CA29CD728EEABCB2",
      "test_path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-CA29CD728EEABCB2",
      "test_path": "src/domain/body-zones/__tests__/BodyZone.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-CA29CD728EEABCB2",
      "test_path": "src/domain/categories/__tests__/matching.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-CA29CD728EEABCB2",
      "test_path": "src/domain/categories/__tests__/validation.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-CA29CD728EEABCB2",
      "test_path": "src/domain/labels/__tests__/Label.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-CA29CD728EEABCB2",
      "test_path": "src/domain/sessions/__tests__/calculations.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-CA29CD728EEABCB2",
      "test_path": "src/domain/sessions/__tests__/composition.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-CA29CD728EEABCB2",
      "test_path": "src/domain/sessions/__tests__/sideMode.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-CA29CD728EEABCB2",
      "test_path": "src/domain/sessions/__tests__/validation.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-D27BF6F54CCDD015",
      "test_path": "src/domain/categories/__tests__/validation.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-E7260E768F020CE0",
      "test_path": "src/features/reference-data/__tests__/bodyZones.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-E93E249B50BFD089",
      "test_path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-E93E249B50BFD089",
      "test_path": "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-FBE85CDF92C9E827",
      "test_path": "src/features/sessions/__tests__/compositionPresentation.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    }
  ],
  "no_automated_tests": [
    {
      "requirement_id": "REQ-B89A1B7A4F23FA8B",
      "status": "NO_AUTOMATED_TEST",
      "justification": "Le contrôle est un outil natif sans harnais unitaire dédié ; l’analyse statique, le typecheck et l’exécution native disponible fournissent la preuve adaptée."
    }
  ]
}
</KODJO_TEST_CONTRACT_JSON>

<KODJO_BOUNDARY_CONTRACT_JSON>
{
  "schema": "kodjo.boundary-contract.v1",
  "boundary_count": 10,
  "boundaries": [
    {
      "category": "FORBIDDEN",
      "target": "src/features/execution/README.md",
      "justification": "Aucun module d’Exécution ne doit être commencé dans PRE-1.",
      "locator": {
        "kind": "PATH",
        "path": "src/features/execution/README.md",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "FORBIDDEN",
      "target": "src/shared/ui",
      "justification": "Les primitives UI partagées sont hors périmètre de la correction.",
      "locator": {
        "kind": "PATH",
        "path": "src/shared/ui/ScreenShell.tsx",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "app/(creation)/_layout.tsx",
      "justification": "Les contrats d’écran de création restent hors périmètre.",
      "locator": {
        "kind": "PATH",
        "path": "app/(creation)/_layout.tsx",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/infrastructure/database/migrations/migration001.ts",
      "justification": "La migration historique doit rester strictement inchangée.",
      "locator": {
        "kind": "PATH",
        "path": "src/infrastructure/database/migrations/migration001.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/infrastructure/database/migrations/migration002.ts",
      "justification": "Le SQL historique et les exports consommés restent inchangés.",
      "locator": {
        "kind": "PATH",
        "path": "src/infrastructure/database/migrations/migration002.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/infrastructure/database/migrations/migration003.ts",
      "justification": "Le SQL historique des Zones reste inchangé.",
      "locator": {
        "kind": "PATH",
        "path": "src/infrastructure/database/migrations/migration003.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/infrastructure/database/migrations/migration004.ts",
      "justification": "Le SQL historique des Zones reste inchangé.",
      "locator": {
        "kind": "PATH",
        "path": "src/infrastructure/database/migrations/migration004.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/infrastructure/database/migrations/migration005.ts",
      "justification": "La migration historique reste inchangée.",
      "locator": {
        "kind": "PATH",
        "path": "src/infrastructure/database/migrations/migration005.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/infrastructure/database/migrations/migration006.ts",
      "justification": "La migration historique reste inchangée.",
      "locator": {
        "kind": "PATH",
        "path": "src/infrastructure/database/migrations/migration006.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/shared/ui/ScreenShell.tsx",
      "justification": "Aucune primitive UI partagée n’est modifiée par PRE-1.",
      "locator": {
        "kind": "PATH",
        "path": "src/shared/ui/ScreenShell.tsx",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    }
  ]
}
</KODJO_BOUNDARY_CONTRACT_JSON>

<KODJO_PLAN_CLARIFICATIONS_JSON>
[]
</KODJO_PLAN_CLARIFICATIONS_JSON>

PLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW


<KODJO_PLAN_IMPACT_JSON>
{
  "schema": "kodjo.plan-impact.v1",
  "scan_revision": "e216294506bed87dd80855937e3fabfbfa322b82",
  "scan_sha256": "85a70759ba6015a37d0c79770784f367beb01c41d64ed6ce29cf7a5069ede0b8",
  "modified_modules": [
    {
      "path": "src/domain/activities/ActivityDefinition.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/activities/ActivityDefinitionRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/activities/index.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/body-zones/BodyZone.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/body-zones/BodyZoneRepository.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/body-zones/__tests__/BodyZone.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/body-zones/index.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/categories/Category.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/categories/CategoryRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/categories/__tests__/matching.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/categories/__tests__/validation.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/categories/defaults.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/categories/errors.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/categories/index.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/categories/matching.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/categories/validation.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/labels/Label.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/labels/LabelRepository.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/labels/__tests__/Label.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/labels/index.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/media/ActivityMedia.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/media/MediaAsset.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/media/MediaRepository.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/media/__tests__/MediaRepository.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/media/index.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/preferences/Profile.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/preferences/ProfileRepository.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/preferences/__tests__/Profile.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/preferences/index.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/sessions/Session.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/SessionDraft.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/SessionRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/StopPoint.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/sessions/__tests__/SessionDraft.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/__tests__/StopPoint.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/sessions/__tests__/calculations.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/__tests__/composition.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/__tests__/sideMode.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/__tests__/validation.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/calculations.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/composition.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/defaults.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/errors.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/index.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/sideMode.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/validation.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/ActivityDefinitionService.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/ActivityEditorForm.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/reference-data/__tests__/bodyZones.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/reference-data/bodyZones.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/BodyZoneSelector.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/CategoriesScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/SessionService.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SessionService.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/compositionPresentation.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/compositionPresentation.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/targetSchema.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/infrastructure/database/constants.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/initializeDatabase.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/migrateDatabase.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/migrations/migration007.ts",
      "change": "CREATE"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
      "change": "CREATE"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
      "change": "CREATE"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteMediaRepository.ts",
      "change": "CREATE"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
      "change": "CREATE"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/types/DatabaseRows.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/i18n/index.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/i18n/resources/fr.ts",
      "change": "MODIFY"
    }
  ],
  "rows": [
    {
      "path": "src/domain/activities/ActivityDefinition.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/activities/ActivityDefinitionRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/activities/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/body-zones/BodyZone.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/body-zones/BodyZoneRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/body-zones/__tests__/BodyZone.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/body-zones/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/categories/Category.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/categories/CategoryRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/categories/__tests__/matching.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/categories/__tests__/validation.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/categories/defaults.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/categories/errors.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/categories/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/categories/matching.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/categories/validation.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/labels/Label.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/labels/LabelRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/labels/__tests__/Label.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/labels/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/media/ActivityMedia.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/media/MediaAsset.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/media/MediaRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/media/__tests__/MediaRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/media/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/preferences/Profile.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/preferences/ProfileRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/preferences/__tests__/Profile.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/preferences/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/Session.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/SessionDraft.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/SessionRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/StopPoint.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/__tests__/SessionDraft.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/__tests__/StopPoint.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/__tests__/calculations.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/__tests__/composition.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/__tests__/sideMode.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/__tests__/validation.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/calculations.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/composition.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/defaults.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/errors.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/sideMode.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/validation.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/ActivityDefinitionService.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/ActivityEditorForm.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/reference-data/__tests__/bodyZones.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/reference-data/bodyZones.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/BodyZoneSelector.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/CategoriesScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/SessionService.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/SessionService.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/compositionPresentation.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/compositionPresentation.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/targetSchema.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/constants.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/initializeDatabase.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/migrateDatabase.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/migrations/migration007.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteMediaRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/types/DatabaseRows.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/i18n/index.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/i18n/resources/fr.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/Session.ts",
        "src/domain/sessions/SessionDraft.ts",
        "src/domain/sessions/validation.ts"
      ],
      "risk_score": 150,
      "classification": "TEST_UNAFFECTED",
      "justification": "Le test importe directement des contrats modifiés, mais aucune assertion de ce test n’est directement démontrée comme incompatible et aucun contrat d’écran n’est modifié."
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/activities/index.ts",
        "src/domain/sessions/SessionDraft.ts",
        "src/features/activities/ActivityDefinitionService.ts"
      ],
      "risk_score": 150,
      "classification": "TEST_UNAFFECTED",
      "justification": "L’import direct d’un contrat de Domaine ou de service ne suffit pas à établir une adaptation de ce test d’écran hors périmètre."
    },
    {
      "path": "src/features/sessions/__tests__/useSessionCatalogue.test.ts",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/Session.ts",
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 150,
      "classification": "TEST_UNAFFECTED",
      "justification": "Le test de catalogue n’est pas directement affecté par les changements de fondations et aucune assertion obsolète n’est démontrée."
    },
    {
      "path": "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/activities/index.ts",
        "src/domain/sessions/Session.ts",
        "src/features/activities/ActivityDefinitionService.ts",
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 148,
      "classification": "TEST_UNAFFECTED",
      "justification": "Le contrat d’écran Catalogue reste hors périmètre et l’import direct ne prouve pas un changement requis."
    },
    {
      "path": "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/Session.ts",
        "src/domain/sessions/SessionDraft.ts",
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 142,
      "classification": "TEST_UNAFFECTED",
      "justification": "Le provider d’écran n’est pas adapté ; la présence d’un import direct ne suffit pas à imposer une modification du test."
    },
    {
      "path": "src/features/sessions/__tests__/SessionCard.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/Session.ts"
      ],
      "risk_score": 138,
      "classification": "TEST_UNAFFECTED",
      "justification": "Aucune assertion de présentation directement incompatible n’est démontrée par le scan à un niveau."
    },
    {
      "path": "src/features/sessions/__tests__/ColorPalette.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/Session.ts"
      ],
      "risk_score": 132,
      "classification": "TEST_UNAFFECTED",
      "justification": "La palette existante est hors adaptation PRE-1 et l’import direct de Session ne prouve pas un changement."
    },
    {
      "path": "src/features/activities/__tests__/ActivityCard.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/activities/index.ts"
      ],
      "risk_score": 130,
      "classification": "TEST_UNAFFECTED",
      "justification": "Le test de carte n’est pas directement affecté par les contrats de persistance ajoutés."
    },
    {
      "path": "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/activities/index.ts",
        "src/domain/sessions/SessionDraft.ts",
        "src/features/activities/ActivityDefinitionService.ts"
      ],
      "risk_score": 130,
      "classification": "TEST_UNAFFECTED",
      "justification": "Aucune assertion directement incompatible n’est démontrée et aucun écran de sélection n’est reconçu."
    },
    {
      "path": "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/activities/index.ts",
        "src/domain/categories/Category.ts",
        "src/domain/categories/CategoryRepository.ts",
        "src/domain/sessions/Session.ts",
        "src/domain/sessions/SessionRepository.ts",
        "src/features/activities/ActivityDefinitionService.ts",
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 130,
      "classification": "TEST_UNAFFECTED",
      "justification": "Le flux UI existant reste hors périmètre ; aucun import transitif n’est inféré et aucun changement direct n’est requis."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts"
      ],
      "risk_score": 130,
      "classification": "TEST_UNAFFECTED",
      "justification": "Le contrat de navigation n’est pas modifié par PRE-1."
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts"
      ],
      "risk_score": 130,
      "classification": "TEST_UNAFFECTED",
      "justification": "Le contrat de navigation n’est pas modifié par PRE-1."
    },
    {
      "path": "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/features/activities/ActivityDefinitionService.ts",
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 124,
      "classification": "TEST_UNAFFECTED",
      "justification": "Le provider de service existant n’est pas une racine modifiée et l’import direct ne suffit pas."
    },
    {
      "path": "src/features/activities/__tests__/useActivityCatalogue.test.ts",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/activities/index.ts",
        "src/features/activities/ActivityDefinitionService.ts"
      ],
      "risk_score": 120,
      "classification": "TEST_UNAFFECTED",
      "justification": "Le hook Catalogue n’est pas modifié et aucune assertion directement obsolète n’est démontrée."
    },
    {
      "path": "src/features/activities/__tests__/ActivityCatalogueList.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/activities/index.ts"
      ],
      "risk_score": 115,
      "classification": "TEST_UNAFFECTED",
      "justification": "La liste Catalogue reste hors contrat d’adaptation de PRE-1."
    },
    {
      "path": "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts"
      ],
      "risk_score": 112,
      "classification": "TEST_UNAFFECTED",
      "justification": "Le contexte existant reste hors périmètre et aucune incompatibilité directe n’est établie."
    },
    {
      "path": "src/features/sessions/__tests__/SessionServiceContext.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 109,
      "classification": "TEST_UNAFFECTED",
      "justification": "Le contexte de service n’est pas modifié ; aucune adaptation n’est démontrée au niveau direct."
    },
    {
      "path": "app/(creation)/categories.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/CategoriesScreen.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "La route importe l’écran, mais la correction de l’écran reste compatible avec la route et ne crée pas de nouveau contrat."
    },
    {
      "path": "src/features/activities/ActivityCard.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/activities/index.ts",
        "src/features/sessions/compositionPresentation.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "L’import direct de l’index Domaine ne prouve pas que ce composant de présentation doit changer."
    },
    {
      "path": "src/features/activities/ActivityDefinitionServiceContext.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/activities/ActivityDefinitionService.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le contexte conserve son rôle et aucune modification directe de son contrat n’est nécessaire."
    },
    {
      "path": "src/features/activities/ActivityDefinitionServiceProvider.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/activities/ActivityDefinitionService.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "L’extension interne du service ne démontre pas une adaptation du provider."
    },
    {
      "path": "src/features/activities/ActivitySelectionScreen.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/activities/index.ts",
        "src/domain/sessions/composition.ts",
        "src/domain/sessions/defaults.ts",
        "src/features/sessions/compositionPresentation.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Aucun contrat d’écran de sélection n’est anticipé et l’import direct ne suffit pas."
    },
    {
      "path": "src/features/activities/useActivityCatalogue.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/activities/index.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le hook Catalogue n’est pas directement affecté par les fondations persistantes."
    },
    {
      "path": "src/features/sessions/CatalogueScreen.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/Session.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "L’écran Catalogue reste hors périmètre et l’import direct de Session ne prouve pas une modification."
    },
    {
      "path": "src/features/sessions/ColorPalette.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/Session.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "La primitive de palette n’est pas modifiée par PRE-1."
    },
    {
      "path": "src/features/sessions/CompositionScreen.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/Session.ts",
        "src/domain/sessions/SessionDraft.ts",
        "src/domain/sessions/composition.ts",
        "src/domain/sessions/defaults.ts",
        "src/domain/sessions/sideMode.ts",
        "src/domain/sessions/validation.ts",
        "src/features/sessions/compositionPresentation.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Aucune interaction ou contrat d’écran de composition n’est modifié dans cette tranche."
    },
    {
      "path": "src/features/sessions/ExerciseScreen.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/activities/index.ts",
        "src/domain/sessions/SessionDraft.ts",
        "src/domain/sessions/composition.ts",
        "src/domain/sessions/defaults.ts",
        "src/features/activities/ActivityEditorForm.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "L’écran d’Exercice reste hors périmètre ; aucune dépendance directe incompatible n’est démontrée."
    },
    {
      "path": "src/features/sessions/SessionCard.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/Session.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le composant de présentation reste compatible et n’est pas une racine de modification."
    },
    {
      "path": "src/features/sessions/SessionDraftContext.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le contexte UI conserve son contrat existant."
    },
    {
      "path": "src/features/sessions/SessionDraftProvider.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le provider n’est pas directement affecté par les changements de persistance."
    },
    {
      "path": "src/features/sessions/SessionServiceContext.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le contexte conserve l’interface du service nécessaire aux consommateurs existants."
    },
    {
      "path": "src/features/sessions/SessionServiceProvider.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/activities/ActivityDefinitionService.ts",
        "src/features/sessions/SessionService.ts",
        "src/infrastructure/database/constants.ts",
        "src/infrastructure/database/initializeDatabase.ts",
        "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
        "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
        "src/infrastructure/database/repositories/SqliteSessionRepository.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "L’extension des services et Repositories ne démontre pas un changement requis de ce provider."
    },
    {
      "path": "src/features/sessions/SideModeControl.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/sideMode.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le contrôle existant reste hors adaptation d’écran ; le changement de source fonctionnelle est couvert par le Domaine et l’i18n."
    },
    {
      "path": "src/features/sessions/compositionGesture.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/Session.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Aucune interaction de composition n’est modifiée dans PRE-1."
    },
    {
      "path": "src/features/sessions/useSessionCatalogue.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/Session.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le hook Catalogue n’est pas directement affecté par le schéma cible."
    },
    {
      "path": "src/infrastructure/database/ExpoDatabase.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/infrastructure/database/constants.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le point d’accès SQLite reste compatible avec les changements portés par l’initialisation et les migrations."
    },
    {
      "path": "src/infrastructure/database/migrations/migration002.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/categories/defaults.ts",
        "src/domain/categories/validation.ts",
        "src/features/reference-data/bodyZones.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "La migration historique est explicitement préservée ; aucun import direct ne justifie sa modification."
    },
    {
      "path": "src/infrastructure/database/migrations/migration003.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/reference-data/bodyZones.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "La migration historique est explicitement préservée et son SQL doit rester identique."
    },
    {
      "path": "src/infrastructure/database/migrations/migration004.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/reference-data/bodyZones.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "La migration historique est explicitement préservée et son SQL doit rester identique."
    },
    {
      "path": "src/shared/i18n/index.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/shared/i18n/resources/fr.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le module d’index consomme la ressource corrigée sans changement direct démontré de son contrat."
    }
  ],
  "scope_allow": [
    "src/domain/activities/ActivityDefinition.ts",
    "src/domain/activities/ActivityDefinitionRepository.ts",
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/activities/index.ts",
    "src/domain/body-zones/BodyZone.ts",
    "src/domain/body-zones/BodyZoneRepository.ts",
    "src/domain/body-zones/__tests__/BodyZone.test.ts",
    "src/domain/body-zones/index.ts",
    "src/domain/categories/Category.ts",
    "src/domain/categories/CategoryRepository.ts",
    "src/domain/categories/__tests__/matching.test.ts",
    "src/domain/categories/__tests__/validation.test.ts",
    "src/domain/categories/defaults.ts",
    "src/domain/categories/errors.ts",
    "src/domain/categories/index.ts",
    "src/domain/categories/matching.ts",
    "src/domain/categories/validation.ts",
    "src/domain/labels/Label.ts",
    "src/domain/labels/LabelRepository.ts",
    "src/domain/labels/__tests__/Label.test.ts",
    "src/domain/labels/index.ts",
    "src/domain/media/ActivityMedia.ts",
    "src/domain/media/MediaAsset.ts",
    "src/domain/media/MediaRepository.ts",
    "src/domain/media/__tests__/MediaRepository.test.ts",
    "src/domain/media/index.ts",
    "src/domain/preferences/Profile.ts",
    "src/domain/preferences/ProfileRepository.ts",
    "src/domain/preferences/__tests__/Profile.test.ts",
    "src/domain/preferences/index.ts",
    "src/domain/sessions/Session.ts",
    "src/domain/sessions/SessionDraft.ts",
    "src/domain/sessions/SessionRepository.ts",
    "src/domain/sessions/StopPoint.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/StopPoint.test.ts",
    "src/domain/sessions/__tests__/calculations.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/domain/sessions/__tests__/sideMode.test.ts",
    "src/domain/sessions/__tests__/validation.test.ts",
    "src/domain/sessions/calculations.ts",
    "src/domain/sessions/composition.ts",
    "src/domain/sessions/defaults.ts",
    "src/domain/sessions/errors.ts",
    "src/domain/sessions/index.ts",
    "src/domain/sessions/sideMode.ts",
    "src/domain/sessions/validation.ts",
    "src/features/activities/ActivityDefinitionService.ts",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/reference-data/__tests__/bodyZones.test.ts",
    "src/features/reference-data/bodyZones.ts",
    "src/features/sessions/BodyZoneSelector.tsx",
    "src/features/sessions/CategoriesScreen.tsx",
    "src/features/sessions/SessionService.ts",
    "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/SessionService.test.ts",
    "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "src/features/sessions/compositionPresentation.ts",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
    "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/infrastructure/database/__tests__/targetSchema.test.ts",
    "src/infrastructure/database/constants.ts",
    "src/infrastructure/database/initializeDatabase.ts",
    "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
    "src/infrastructure/database/migrateDatabase.ts",
    "src/infrastructure/database/migrations/migration007.ts",
    "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
    "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
    "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
    "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
    "src/infrastructure/database/repositories/SqliteMediaRepository.ts",
    "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
    "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
    "src/infrastructure/database/types/DatabaseRows.ts",
    "src/shared/i18n/index.test.ts",
    "src/shared/i18n/resources/fr.ts"
  ]
}
</KODJO_PLAN_IMPACT_JSON>

<KODJO_PLAN_REVISION_STATUS_JSON>
{
  "status": "LEGACY_UNBOUNDED",
  "reason": "Legacy review has no structured findings; full independent revalidation required"
}
</KODJO_PLAN_REVISION_STATUS_JSON>

<KODJO_UI_PLAN_CONTRACT_JSON>
{
  "schema": "kodjo.ui-plan-contract.v1",
  "contract_version": 2,
  "protocol_commit": "48b444ededb735da47a42474c39e150224e92395",
  "scan_revision": "e216294506bed87dd80855937e3fabfbfa322b82",
  "ui_applicable": true,
  "ui_paths": [
    "src/features/activities/ActivityDefinitionService.ts",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/reference-data/bodyZones.ts",
    "src/features/sessions/BodyZoneSelector.tsx",
    "src/features/sessions/CategoriesScreen.tsx",
    "src/features/sessions/SessionService.ts",
    "src/features/sessions/compositionPresentation.ts",
    "src/shared/i18n/resources/fr.ts"
  ],
  "criterion_count": 8,
  "assertion_count": 16,
  "assertion_ids_sha256": "dc2bfee2017416817c0410e7f73ff42fee5000200cc53217dc7289eea5f058da",
  "matrix_sha256": "93566b46b77c3f2b46854fffde2d46e67d8ec3050a9cc16a5453982bc07c3fff"
}
</KODJO_UI_PLAN_CONTRACT_JSON>

<KODJO_PLAN_CONTRACT_JSON>
{
  "schema": "kodjo.plan-contract-consistency.v2",
  "contract_version": 2,
  "protocol_commit": "48b444ededb735da47a42474c39e150224e92395",
  "scan_revision": "e216294506bed87dd80855937e3fabfbfa322b82",
  "write_scope": [
    "src/domain/activities/ActivityDefinition.ts",
    "src/domain/activities/ActivityDefinitionRepository.ts",
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/activities/index.ts",
    "src/domain/body-zones/BodyZone.ts",
    "src/domain/body-zones/BodyZoneRepository.ts",
    "src/domain/body-zones/__tests__/BodyZone.test.ts",
    "src/domain/body-zones/index.ts",
    "src/domain/categories/Category.ts",
    "src/domain/categories/CategoryRepository.ts",
    "src/domain/categories/__tests__/matching.test.ts",
    "src/domain/categories/__tests__/validation.test.ts",
    "src/domain/categories/defaults.ts",
    "src/domain/categories/errors.ts",
    "src/domain/categories/index.ts",
    "src/domain/categories/matching.ts",
    "src/domain/categories/validation.ts",
    "src/domain/labels/Label.ts",
    "src/domain/labels/LabelRepository.ts",
    "src/domain/labels/__tests__/Label.test.ts",
    "src/domain/labels/index.ts",
    "src/domain/media/ActivityMedia.ts",
    "src/domain/media/MediaAsset.ts",
    "src/domain/media/MediaRepository.ts",
    "src/domain/media/__tests__/MediaRepository.test.ts",
    "src/domain/media/index.ts",
    "src/domain/preferences/Profile.ts",
    "src/domain/preferences/ProfileRepository.ts",
    "src/domain/preferences/__tests__/Profile.test.ts",
    "src/domain/preferences/index.ts",
    "src/domain/sessions/Session.ts",
    "src/domain/sessions/SessionDraft.ts",
    "src/domain/sessions/SessionRepository.ts",
    "src/domain/sessions/StopPoint.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/StopPoint.test.ts",
    "src/domain/sessions/__tests__/calculations.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/domain/sessions/__tests__/sideMode.test.ts",
    "src/domain/sessions/__tests__/validation.test.ts",
    "src/domain/sessions/calculations.ts",
    "src/domain/sessions/composition.ts",
    "src/domain/sessions/defaults.ts",
    "src/domain/sessions/errors.ts",
    "src/domain/sessions/index.ts",
    "src/domain/sessions/sideMode.ts",
    "src/domain/sessions/validation.ts",
    "src/features/activities/ActivityDefinitionService.ts",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/reference-data/__tests__/bodyZones.test.ts",
    "src/features/reference-data/bodyZones.ts",
    "src/features/sessions/BodyZoneSelector.tsx",
    "src/features/sessions/CategoriesScreen.tsx",
    "src/features/sessions/SessionService.ts",
    "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/SessionService.test.ts",
    "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "src/features/sessions/compositionPresentation.ts",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
    "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/infrastructure/database/__tests__/targetSchema.test.ts",
    "src/infrastructure/database/constants.ts",
    "src/infrastructure/database/initializeDatabase.ts",
    "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
    "src/infrastructure/database/migrateDatabase.ts",
    "src/infrastructure/database/migrations/migration007.ts",
    "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
    "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
    "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
    "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
    "src/infrastructure/database/repositories/SqliteMediaRepository.ts",
    "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
    "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
    "src/infrastructure/database/types/DatabaseRows.ts",
    "src/shared/i18n/index.test.ts",
    "src/shared/i18n/resources/fr.ts"
  ],
  "required_test_writes": [
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/body-zones/__tests__/BodyZone.test.ts",
    "src/domain/categories/__tests__/matching.test.ts",
    "src/domain/categories/__tests__/validation.test.ts",
    "src/domain/labels/__tests__/Label.test.ts",
    "src/domain/media/__tests__/MediaRepository.test.ts",
    "src/domain/preferences/__tests__/Profile.test.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/StopPoint.test.ts",
    "src/domain/sessions/__tests__/calculations.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/domain/sessions/__tests__/sideMode.test.ts",
    "src/domain/sessions/__tests__/validation.test.ts",
    "src/features/activities/__tests__/ActivityDefinitionService.test.ts",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/reference-data/__tests__/bodyZones.test.ts",
    "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/SessionService.test.ts",
    "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
    "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/infrastructure/database/__tests__/targetSchema.test.ts",
    "src/shared/i18n/index.test.ts"
  ],
  "requirement_contract_sha256": "02549e8c57d1866b92b715d93e60cb5ab4ce9d174bf61015447fb6151d1a7be4",
  "test_contract_sha256": "b2599c9cf9d2e361298cfbd2b5875f04661a29ea14a78b75c1414c52d074f48f",
  "boundary_contract_sha256": "78e3a9faed3cfe50e30eaf3511d279e652518eca6cf8db4b6954d83962f05595",
  "requirement_count": 21
}
</KODJO_PLAN_CONTRACT_JSON>
