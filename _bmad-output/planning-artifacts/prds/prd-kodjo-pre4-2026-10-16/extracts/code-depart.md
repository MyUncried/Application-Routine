# État des lieux du code de départ — PRE-4 BMAD

- **Date :** 2026-10-16. Lecture seule, HEAD local `a8ec6c35` (branche `bmad/pre4-comparaison`).
- **Code applicatif :** `git diff 626632c3 HEAD -- src app` est vide. `src/` et `app/` sont donc exactement ceux de la clôture PRE-3 `626632c3`.
- **Non consultés :** `docs/preparation/PRE-4/planification/`, `.github/orchestration/`, `scripts/kodjo/`, `tests/kodjo/` et toute autre branche.
- **Fixture lue :** le seul fichier lu sous `docs/preparation/` en dehors de PRE-4/bmad est le corpus PRE-3 `attendus-phrases-276.json`, que les tests consomment.
- **Méthode :** ce document est un constat sourcé (`fichier:ligne`). Il ne propose aucune solution détaillée.
- **Fins de ligne :** les fichiers sources sont en CRLF (`core.autocrlf=true`).

---

## 1. Arborescence et rôle des modules concernés

### Routes (coquilles)
- `app/(creation)/exercise.tsx:1-6` rend `ExerciseScreen` (`src/features/sessions/ExerciseScreen.tsx`).
- `app/(creation)/activity-selection.tsx:1-6` rend `ActivitySelectionScreen` (copie Catalogue → Séance).
- `app/(creation)/_layout.tsx:69-72` déclare la pile `composition`, `exercise`, `categories` et `activity-selection`.

### Éditeur d'Exercice : un seul point d'entrée pour les quatre parcours (ED-01)
- `src/features/sessions/ExerciseScreen.tsx:198-208` aiguille d'après les paramètres de route :
  - avec `catalogueDefinitionId` (`new` ou un id), il rend `CatalogueActivityEditorScreen` (`:210`) ;
  - sinon, il rend `CompositionExerciseEditor` (`:451`), qui travaille sur la copie de Séance.
- Le JSDoc des parcours se trouve à `:183-197`.
- **Catalogue :** l'écriture passe par `ActivityDefinitionService` à « Terminer », et seulement là.
- **Séance :** « Terminer » écrit dans le brouillon `SessionDraftContext` (`handleTerminer` `:547-562`, `appendActivityAfterLastDisplayed`). La persistance a lieu ensuite au « Continuer » de Composition.
- **Fonctions utiles :**
  - `occurrenceParameters()` (`:433-444`) résout les paramètres d'une occurrence (JSON canonique, sinon scalaires historiques) ;
  - `formValueEquals` (`:172`) sert à la garde d'abandon.
- **Garde d'abandon :** `ExerciseExitConfirmModal` (`ExerciseScreen.tsx:427`, `:619`).
- **Composant d'éditeur commun, contrôlé :** `src/features/activities/ActivityEditorForm.tsx` (838 lignes). Le JSDoc est à `:43-58`. Le composant contient :
  - le nom, `:223-226` ;
  - la pilule Catégorie, `:229-249` ;
  - la pilule Zones, `:250-272` ;
  - la carte Paramètres, avec la pilule de mode `:294-305` et la zone phrase, Compte à rebours et Fin `:307-343` ;
  - la description, `:351-396` ;
  - les médias (`ActivityMediaList`), `:400-418` ;
  - l'action Terminer, `:421-437`.
- **Ouverture de la feuille :** `:441-448`. `onApply` remplace atomiquement `executionParameters` (`applyParameters` `:199-200`). Le focus revient sur la carte (`closeSheet` `:189-197`).
- **Validité du formulaire :** `isActivityEditorFormValid` (`:100-117`) exige un nom valide et `validateExecutionParameters(...).ok`. Il exige aussi Catégorie et Zones si `requireReferences`.

### Feuille « Paramètres d'exécution »
`src/features/activities/ExecutionParametersSheet.tsx` (1312 lignes) :
- **Conteneur :** une `Modal` React Native transparente, `animationType="fade"` (`:362`). La montée est animée (`:266-281`) et respecte « Réduire les animations » (`useReduceMotion` `:107-125`).
- **En-tête :** ✕ (`execution-sheet-cancel`, `:381`) et ✓ (`execution-sheet-validate`, `:396`). Le ✓ est grisé si `commitSheetDraft` échoue (`:297-306`, `:357-360`).
- **Mode (`:412-445`) :** une ligne de valeur ouvre un `SegmentedControl` **en place** (`ClosingSelector`, `:132-200`) à trois segments, dont `TO_FAILURE` (`:434`). Il n'y a pas de popover ancré.
- **Séries (`:449-460`) :** `InlineStepper` (stepper +/− maison, `src/shared/ui/ProfileStepper.tsx:143-172`).
- **« Séries variables » :** un **`Switch` natif RN** (`:480-497`), désactivé à N=1 (`:482`). Un `DisclosureControl` replie le tableau (`:471-477`) et n'apparaît qu'en variable.
- **Cible uniforme :**
  - en Durée, `DurationWheelPicker` en place (`:519-550`) ;
  - en Répétitions, `InlineStepper` (`:553-571`) ;
  - pas de roulette numérique pour les Répétitions.
- **Pause commune :** `InlineStepper` (`:574-586`).
- **Côtés :**
  - Changement de côté : `SegmentedControl` en place (`:592-625`) ;
  - Ordre des côtés : idem (`:630-670`) ;
  - Pause entre les côtés : `InlineStepper` (`:673-685`).
- **Bip de cadence :** `InlineStepper` (`:691-703`).
- **Durée totale (`:705-770`) :**
  - la ligne ne s'affiche que si `totalApplicable`, c'est-à-dire Durée, ou Répétitions avec un bip > 0 (`:311-314`) ;
  - elle est modifiable par une roulette `DurationWheelPicker` (`:727-745`) si `isRequestedTotalEditable` ;
  - un message d'ajustement offre une annulation (`:746-768`).
- **Compte à rebours et Fin :** `InlineStepper` (`:774-800`).
- **Tableau variable (`VariableTable`, `:809-892`) :**
  - chaque ligne porte une poignée de glisser ;
  - **deux `InlineStepper` permanents par ligne** : cible (`:854-866`) et Pause (`:870-880`) ;
  - pas de cible si le mode n'est ni Durée ni Répétitions (`hasTarget` `:836`).
- **Glisser (`DraggableRow`, `:894-...`) :**
  - le glisser repose sur le responder RN (`onResponderGrant/Move/Release`, `:927-950`), pas sur gesture-handler ;
  - des `accessibilityActions` monter et descendre sont proposées (`:956-957`) ;
  - le défilement du corps est bloqué pendant le glisser (`:262-265`).
- **Grisé « sans effet » :** `styles.withoutEffect { opacity: 0.45 }` (`:1159-1160`), appliqué à N=1 (`:468`, `:629`).

### Popovers et menus existants
- Il n'existe aucun composant « popover ancré » générique. `WheelPickerOverlay.tsx:1-40` documente le **retrait** de l'ancien `PopoverAnchor` au profit d'une `Modal` plein écran centrée, dont le voile ne se ferme pas au toucher.
- `CatalogueCreateOptions.tsx:31-69` est un menu positionné dans une `Modal` (`menuTop` calculé).
- `ActivityMediaList.tsx:168-215` utilise le menu natif : `ActionSheetIOS` sur iOS, `Alert` ailleurs.
- Les sélecteurs Mode, Côté et Ordre de la feuille sont des segmentés en place, pas des popovers.

### Roulettes natives
- **`src/features/sessions/DurationWheelPicker.tsx` (664 lignes) :**
  - **Branche iOS :** `@expo/ui/swift-ui`. `Host` contient un `HStack` et deux `Picker` en `pickerStyle("wheel")` (`:1-11`, `:129-134`, `NativeAppleDurationWheelPicker` `:186-...`, pickers `:237-281`).
  - **Branche Android/web :** `LegacyDurationWheelPicker` en `ScrollView` (`:373-...`).
  - **Props (`:114-127`) :** `totalSeconds`, `onValidate`, `onCancel`, libellés d'accessibilité, `maxTotalSeconds`. Pas de pas configurable, ni de borne basse, ni d'option « échec ».
  - **Valeurs de secondes :** pas de 1 (`wheelPickerMath.ts:49` `WHEEL_SECONDS_STEP = 1`, `:51-54`).
  - **Bornes :** total 3599 par défaut, 5999 pour l'Exercice (`wheelPickerMath.ts:54-80`).
  - **Toolbar :** Annuler/Valider (`PickerToolbar` `:315`). Seules ces actions ferment la roulette.
- **`src/features/sessions/NumberWheelPicker.tsx` (404 lignes) :**
  - une colonne SwiftUI sur iOS, `ScrollView` sinon (`:100-104`) ;
  - valeurs **fixes 1..99** (`WHEEL_NUMBER_MIN/MAX`, `wheelPickerMath.ts:193-194` ; `VALUES` `:64-67`) ;
  - props `value`, `onValidate`, `onCancel` et libellés (`:88-98`). Ni bornes paramétrables, ni option de tête.
  - **Non utilisé par la feuille Paramètres.** Seule `CompositionScreen.tsx:57` l'importe.
- **Garde-fous de test (zéro `ScrollView` sur iOS) :**
  - `src/features/sessions/__tests__/DurationWheelPicker.test.tsx:378` et `:619` ;
  - `src/features/sessions/__tests__/NumberWheelPicker.test.tsx:267`.
  - Les numéros cités dans AGENTS.md (`:371`, `:260`) ont dérivé : ce sont les `it(` englobants, à `:371-379` et `:265-268`.
  - Ces tests vérifient aussi `selection` et `onSelectionChange` sur la colonne (props exclusives du Picker natif).
- **Duplication volontaire de la toolbar :** `NumberWheelPicker.tsx:47-57` (commentaire) et `PickerToolbar` `:180`, en double de `DurationWheelPicker.tsx:315`.

### Catégorie et Zones (ED-20)
- `src/features/reference-data/CategoryPickerModal.tsx` (`Modal` `:246`), `BodyZonePickerModal.tsx` (`:230`), `ReferenceValueDialog.tsx`, `ReferentialService.ts`.
- Ils sont ouverts par `ExerciseScreen.tsx:417`, `:609` (Catégorie) et `ActivityEditorForm.tsx:450` (Zones).
- `BodyZoneSelector.tsx` (sessions) est un sélecteur historique.

### Médias (ED-21)
- **Domaine :**
  - `src/domain/media/ActivityMedia.ts` (positions stables) ;
  - `ActivityMediaImportService.ts` (import pur, sans SQLite) ;
  - `MediaAsset.ts` (métadonnées natives nullables) ;
  - `MediaDraftLeases.ts` (prêts de fichiers aux brouillons, nettoyage après un abandon confirmé seulement) ;
  - `MediaRepository.ts`, contrat sans suppression physique.
- **Infrastructure :** `src/infrastructure/media/LocalMediaStore.ts`, `PhotoLibraryPicker.ts`, `VideoPoster.ts`.
- **Interface :** `ActivityMediaList.tsx`, et `useMediaImport` dans `ActivityEditorForm.tsx:475`.

### Carte, résumé et phrase des paramètres
- **Carte de l'éditeur :** `generateExecutionPhrase` et `phraseText` (`ActivityEditorForm.tsx:180-181`). Si le mode est renseigné mais une cible manque, elle affiche « Paramètres à compléter. ».
- **Carte Catalogue :** `ActivityCard.tsx:115-130`. Elle appelle `catalogueDuration` (intrinsèque, exact, « ≈ » ou absente) et `formatExerciseRowSummary`.
- **Résumés Composition :** `src/features/sessions/compositionPresentation.ts`.
  - `formatCompositionSummary` : `:104-140` ;
  - `formatExerciseRowSummary` : `:246-290`, avec la branche variable « {n} séries variables » `:252-260` et la branche `TO_FAILURE` `:272-278` ;
  - `formatExerciseRecap` : `:365-385`, branche `TO_FAILURE` `:375-381` ;
  - `formatExerciseDurationLine` : `:438-...`.
- **Résumé et carte Séance :** `formatSessionSummary.ts:42-63` (symboles ≈ et ≥) et `SessionCard.tsx:97-110`.

---

## 2. Modèle de domaine des paramètres d'exécution

**Fichier d'autorité :** `src/domain/activities/ExecutionParameters.ts` (527 lignes, fonctions pures).

### Types
- **Version :** `EXECUTION_PARAMETERS_VERSION = 1` (`:22`).
- **Mode :** `ExecutionMode = ExerciseExecutionMode` (`:24`), défini dans `src/domain/sessions/Session.ts:64` comme `"DURATION" | "REPETITIONS" | "TO_FAILURE"`. `EXECUTION_MODES` liste les trois (`:27`).
- **Série :** `SeriesRow { target: number | null; pauseSeconds }` (`:43-46`). **`null` signifie à la fois « À l'échec » et « non renseignée ».** La distinction se fait uniquement par le mode.
- **Uniforme :** `UniformSeries { kind:"UNIFORM"; count; target; pauseSeconds }` (`:48-53`).
- **Variable :** `VariableSeries { kind:"VARIABLE"; rows }` (`:56-59`).
- **Paramètres complets :** `ExecutionParameters` (`:64-74`) regroupe version, mode, series, sideMode, sideOrder (`BY_SIDE|BY_SERIES`), sideRecoverySeconds, cadenceBeepIntervalSeconds, countdownSeconds et endSeconds.
- **La Récupération (R) n'en fait pas partie.** Elle est portée par l'occurrence (`:10-11`).
- **Brouillon :** `ExecutionParametersInput` (`:82-85`) autorise `mode: null` et `sideMode: null`.

### État « variable »
- L'état variable est **stocké explicitement** (`series.kind`), jamais déduit de l'égalité des valeurs (`:7-8`).
- Normalisation à N=1 (`normalizeEffective` `:146-165`) :
  - un état variable à une ligne devient uniforme sur la première ligne ;
  - l'ordre des côtés devient `BY_SIDE` ;
  - **en `TO_FAILURE`, toutes les cibles sont forcées à `null`** (`:148`, `:154-159`).

### Bornes (`EXECUTION_BOUNDS`, `:31-40`)
- Elles s'appliquent aux nouvelles saisies seulement. Il n'y a pas de clamp à la lecture.

| Champ | Bornes |
|---|---|
| séries | 1..99 |
| `durationTarget` | **1..5999** |
| `repetitionTarget` | 1..100 |
| pause | 0..300 |
| `sideRecovery` | 0..300 |
| bip | 0..10 |
| Compte à rebours | 0..60 |
| Fin | 0..60 |

- Le pas n'est pas modélisé.

### Validation
- **`validateExecutionParameters` (`:205-264`) :**
  - agrège toutes les violations sans lever d'exception ;
  - signale `REQUIRED`, `OUT_OF_RANGE`, `NOT_INTEGER`, `UNRECOGNIZED` et `MUST_BE_ABSENT` (`:100-106`), avec `seriesNumber` ;
  - en `TO_FAILURE`, une cible non nulle déclenche `MUST_BE_ABSENT` (`:235-238`) ;
  - en Durée ou Répétitions, une cible `null` déclenche `REQUIRED` (`:239-244`) ;
  - un côté `null` est normalisé en `UNILATERAL` (`:217`).
- **`validateActivityDefinitionInput` (`src/domain/activities/ActivityDefinition.ts:242-...`) :**
  - valide le JSON canonique, puis le projette sur les scalaires (`:250-274`) ;
  - **revalide ensuite les scalaires projetés** : Durée exige `durationSeconds` (`:298-...`), Répétitions exige `repetitionCount` non nul (`:313-...`), `TO_FAILURE` exige l'absence des deux (`:326-333`) ;
  - définit sa propre liste `EXECUTION_MODES` (`:194-198`).
- **Séance :** `src/domain/sessions/validation.ts:546-577` emprunte le chemin canonique, puis retourne tôt. Le chemin historique est à `:579-617` (`TO_FAILURE` `:600-606`). La liste des modes est à `:69-73` et `validateExecutionMode` à `:258`.

### Défauts
- `createEmptyExecutionParameters` (`:468-480`) : mode et côté `null`, uniforme N=1, cible `null`, pause 0, bip 0. Le Compte à rebours et la Fin sont copiés du Profil.
- `setMode` (Draft `:293`) : à la création en Répétitions uniforme, la cible initiale vaut 1.
- La Pause entre les côtés est copiée du Profil à l'activation bilatérale (`ExecutionParametersDraft.ts:348-360` ; `ActivityDefinition.ts:502-514`).

### Sérialisation, lecture et compatibilité
- `serializeExecutionParameters` (`:267-291`) fixe l'ordre des clés et n'écrit ni phrase ni total.
- **`parseExecutionParameters` (`:321-374`) :**
  - rejette toute version différente de 1 ;
  - **`parseRow` (`:297-313`) lève une erreur si la cible n'est pas cohérente avec le mode** (`TO_FAILURE` exige `null` ; Durée et Répétitions exigent un nombre).
- **Adaptateur des anciens objets :** `legacyExecutionParameters` (`:395-415`) et `resolveExecutionParameters` (`:423-427`).
- **Projection vers les colonnes historiques :** `projectLegacyScalars` (`:444-456`) reprend la **première** cible et la première pause effectives.
- **Égalité et clonage :** `executionParametersEqual` (`:483-516`) et `cloneExecutionParameters` (`:519-527`).

### Machine de brouillon de la feuille
`src/domain/activities/ExecutionParametersDraft.ts` (425 lignes) :
- **État `ExecutionSheetDraft` (`:42-71`) :**
  - `variable` est un booléen demandé ;
  - `uniform`, `rows`, `hiddenRows` (réserves de réduction de N) et `savedVariableRows` (dernier tableau) ;
  - identités volatiles `rowIds`, `hiddenIds`, `savedIds` et `uniformId` ;
  - **`targetsById` mémorise les cibles par mode et par identité** (`:40`, `:62`).
- **Opérations :**
  - `setSeriesCount` (`:183-216`) masque ou restaure les lignes, puis clone la dernière ;
  - `setVariable` (`:225-276`) ;
  - **`setMode` (`:285-304`) : passer en `TO_FAILURE` met toutes les cibles à `null` (`:290`, `:299`), et `rememberCurrentTargets` ne mémorise rien en `TO_FAILURE` (`:154`)** ;
  - `moveRow` (`:335-346`) ;
  - `applyRequestedTotal` (`:395-406`) ;
  - `commitSheetDraft` (`:417-419`) ;
  - `firstIncompleteSeries` (`:422-425`).
- Il n'existe **aucune** opération de suppression d'une ligne précise (seulement la réduction de N).

### Instantané d'Exercice
- `src/domain/activities/exerciseSnapshot.ts` porte `EXERCISE_SNAPSHOT_VERSION = 1` (`:22`).
- Il contient les paramètres canoniques, R, les médias ordonnés et `actualDurationSeconds` (`:29-40`). Il est gelé en profondeur.
- Sa relecture appelle `parseExecutionParameters` (`:118`), donc **impose les paramètres en version 1**.
- **Aucun consommateur en production :** seul `exerciseSnapshot.test.ts` l'appelle (grep).

---

## 3. Calculs

### Durée d'un Exercice
`src/domain/activities/executionCalculations.ts` (270 lignes) :
- **Registre d'événements :** `buildExecutionLedger` (`:70-113`) produit WORK, SERIES_PAUSE, SIDE_PAUSE et RECOVERY. R positive remplace la dernière pause (`:109-111`).
- **Travail d'une série :** `workSeconds` (`:55-63`).
  - En Durée, la cible.
  - En Répétitions avec un bip b > 0, la cible × b.
  - Sinon, `null` (inconnu).
- **Nature du résultat :** `summarize` (`:115-127`) produit `exact`, `estimated` ou `omitted`.
  - **Dès qu'un travail est inconnu, le résultat est `omitted`, sans montant**, mais `knownSeconds` conserve les pauses.
  - **Il n'existe pas de nature « partiel ≥ » au niveau de l'Exercice.**
- **API :**
  - `computeIntrinsicDuration` (`:130`) ;
  - `computeOccurrenceDuration` (`:135`) ;
  - `computeExercisePlanDuration` (`:220-230`), qui ajoute le Compte à rebours et la Fin.

### Inversion de la Durée totale
- `isTotalDurationInvertible` (`:153-157`) ne l'accepte qu'en Durée **uniforme** avec une cible non nulle.
- `invertTotalDuration` (`:183-203`) énumère N = 1..99, en départageant vers le plus grand N.
- `totalDurationRange` est à `:206-211`.

### Agrégation de Séance
- `aggregateSessionDuration` (`:253-267`) : la Séance est `lowerBound` si une contribution est `omitted`, `estimated` si l'une est estimée, sinon `exact`. Les pauses connues sont toujours ajoutées.
- **Consommateurs :** `src/domain/sessions/calculations.ts:72-90` (`computeActivityDurationResult` ; mode `null` → `omitted`), `:174-190` (zones), `:202-215` (`computeStructuredSessionDuration`, multiplicité par Circuit `IN_TOUR`), `:218-246`.
- Ils sont utilisés par `SqliteSessionRepository.ts:244`, `:1176` (liste) et par `compositionPresentation.ts:114-136`, `:445`.

### Phrase
`src/domain/activities/executionPhrase.ts` (201 lignes) :
- Le générateur émet des segments `{texte, gras}` en français uniquement.
- Il retourne `null` si le mode est `null`, ou si une cible manque hors `TO_FAILURE` (`:97-107`).
- **Contenu de la phrase :**
  - Durée : uniforme ; variable ≤ 3 énuméré « a, b puis c » ; > 3 « de min à max » (`:115-128`) ;
  - Répétitions : même logique, plus le bip (`:129-146`) ;
  - `TO_FAILURE` : « menée(s) jusqu'à l'échec » (`:146-148`).
- `targets.map(row.target as number)` (`:109`) suppose que **toutes** les cibles sont numériques hors `TO_FAILURE`. Il n'existe donc aucune variante mixte.
- **Clauses :**
  - pause en uniforme seulement (`:150-158`) ;
  - côtés (`:160-182`) ;
  - total omis si `omitted` ou si redondant en Durée N=1 unilatérale P0 (`:186-193`) ;
  - « ≈ » si estimé.
- **Corpus 276 :**
  - test `src/domain/activities/__tests__/executionPhrase.test.ts:33-37` ;
  - fixture `docs/preparation/PRE-3/planification/attendus-phrases-276.json` ;
  - assertions : `:61-95` (`it.each` sur 276 cas), `:97-171` pour les limites de grammaire, `:173-` pour le cas 144 (224 caractères).
- **Distribution mesurée de la fixture :**

| Mode | Uniforme | Variable | Total |
|---|---:|---:|---:|
| `DURATION` | 52 | 40 | 92 |
| `REPETITIONS` | 52 | 40 | 92 |
| `TO_FAILURE` | 52 | 40 | 92 |

- **92 cas encodent `mode: "TO_FAILURE"`** (type `CorpusCase` `:16-31`). La conversion `toInput` (`:39-58`) produit `version: 1`.
- **Phrase compacte de Composition :** `compositionPresentation.ts` est un générateur **distinct**, fondé sur les **scalaires** (`facts.executionMode`, `durationSeconds ?? 0`, `repetitionCount ?? 0`, `:272-288`, `:375-385`). Seul l'état variable passe par `executionParameters` (`:252-260`).

---

## 4. Persistance SQLite

### Exécuteur de migrations
- `src/infrastructure/database/migrateDatabase.ts:43-150` exécute la séquence dans **une transaction exclusive unique** (`withExclusiveTransactionAsync`, `:57`).
- La garde est `PRAGMA user_version`. La base reçoit `PRAGMA user_version = DATABASE_VERSION` à la fin (`:146`).
- Un échec annule tout (`:38-41`).
- `DATABASE_VERSION = 9` (`src/infrastructure/database/constants.ts:46`). Pragmas : `foreign_keys = ON` et WAL (`:52-55`).

### Migrations

| N° | Contenu (une ligne) |
|---|---|
| 001 | Schéma initial : `users`, `sessions`, `cycles`, `tours`, `activities`. **Intouchable.** |
| 002 | Catégories (amorcées), `session_categories`, `activity_body_zones` avec CHECK sur les ids `BODY_ZONES` (importés depuis `src/features/reference-data/bodyZones`). |
| 003 | Reconstruction en 12 étapes d'`activities` pour accepter `TO_FAILURE` dans le CHECK (`defer_foreign_keys`). |
| 004 | Reconstruction d'`activities` : `recovery_seconds` attaché, conversion et suppression des lignes `RECOVERY`. **CHECK composite mode/cible**, détaillé sous ce tableau. |
| 005 | `ALTER ADD side_mode` sur `activities` et `tours`. |
| 006 | Création de `activity_definitions` (CHECK sur `execution_mode` limité à l'énumération, `:21` ; **pas de CHECK composite cible/mode**) et `activity_definition_body_zones`. |
| 007 | Création de `body_zones`, `labels`, `profiles`, `media_assets`, `activity_media`, `session_stop_points`. Catégorie couleur et actif, `activity_definitions.category_id` et `side_recovery_seconds` ; suppression de `recovery_seconds`. `sessions.label_id` ; suppression de `color` et de `session_categories`. Renommage en `post_activity_recovery_seconds`. |
| 008 | Deux phases (`_COLUMNS`, puis remplissage JS des clés canoniques, puis `_FINALIZE`) : clés uniques Étiquettes et Zones ; reconstruction d'`activity_body_zones` avec une clé étrangère vers `body_zones`. |
| 009 | `execution_parameters TEXT` NULLABLE sur `activity_definitions` et `activities` ; `activities.category_id` ; métadonnées médias ; table `session_activity_media` (cascade sur l'occurrence, RESTRICT sur l'asset). Aucune reconstruction, aucun remplissage rétroactif. |

**Contrainte à retenir (migration 004) :** le CHECK composite mode/cible est à `migration004.ts:117-170`.

| Mode | Contrainte |
|---|---|
| DURATION | `duration_seconds` non nul et entre **1 et 5999**, `repetition_count` nul (`:137-141`) |
| REPETITIONS | `repetition_count` **non nul et ≥ 1** (`:144-148`) |
| TO_FAILURE | les deux colonnes nulles (`:151-154`) |

- La pause et la récupération sont bornées à 0..5999.

### Format de stockage
- **Hybride.**
- **JSON canonique versionné (`version: 1`) :** il fait autorité quand il est présent. Il est écrit **à côté** des colonnes scalaires historiques, qui sont alimentées par `projectLegacyScalars`.
  - `execution_mode`, `duration_seconds`, `repetition_count`, `series_count`, `pause_seconds`, `side_mode`, plus `side_recovery_seconds` (définitions) ou `post_activity_recovery_seconds` (occurrences).
- **`NULL` :** il désigne un objet antérieur à PRE-3, lu par l'adaptateur conservateur.
- **Conséquence :** les colonnes scalaires et les CHECK SQL restent actifs à chaque écriture.

### Repositories
- **`SqliteActivityDefinitionRepository.ts` (360 lignes) :**
  - `scalarValues` (`:59-72`) ;
  - `create` dans une transaction (`:136-178`) ;
  - `update` dans une transaction (`:180-253`). Sans JSON fourni, le JSON déjà persisté reste l'autorité (`:197-202`). Sans `media`, les liens sont conservés ; une liste les remplace (`:240-245`) ;
  - en lecture, le JSON est analysé, ou l'adaptateur historique prend le relais (`:331-345`).
- **`SqliteSessionRepository.ts` (1250 lignes) :**
  - `create` et `update` dans des transactions (`:276`, `:359`) ;
  - insertion des occurrences (`:553`, `:811`) ;
  - mise à jour avec `execution_parameters = COALESCE(?, execution_parameters)` (`:776-800`) ;
  - `executionParametersJson` (`:594-596`) ;
  - faits de durée par lot pour la liste (`:1104-1160`) ;
  - **`assertSessionAggregateRow` (`:1205-1250`) reproduit en TypeScript le CHECK mode/cible, `TO_FAILURE` compris (`:1243-1246`).**
- **`SqliteMediaRepository.ts` (279 lignes) :** lecture ordonnée et `countReferences`. Il n'existe aucune suppression physique.

### Instantanés et historique
- **Aucune table** d'instantané, d'exécution ou d'historique n'existe dans les migrations 001..009.
- `src/features/history/` et `src/features/execution/` ne contiennent qu'un `README.md`.

### Tests de persistance
- **SQLite réelle via `node:sqlite` :** `src/infrastructure/database/testing/NodeSqliteDatabase.ts`.
  - `DatabaseSync` en mémoire ou dans un fichier, avec `foreign_keys = ON` ;
  - transaction `BEGIN IMMEDIATE`, `COMMIT`, `ROLLBACK` (`:61-70`).
- **`migrateDatabase.test.ts` (58 `it`) :**
  - migrations pas à pas (imports `MIGRATION_00x`) ;
  - cas `TO_FAILURE` (`:212-280`, `:386-400`) ;
  - annulation réelle par instruction grâce à un `FailingDatabase` qui fait échouer la N-ième écriture (`:1606-1640`, cas `:1634`).
- **Schéma cible :** `targetSchema.test.ts` (15 tests).
- **Intégration native :** un contrôle existe (`src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts`, README). Il n'est relié à aucun écran.

---

## 5. Copies, duplications, instantanés et consommateurs

### Copies
- **Catalogue vers Séance :**
  - `activityDefinitionToDraftExercise` (`ActivityDefinition.ts:516-546`) clone les paramètres canoniques, la Catégorie et les médias (mêmes fichiers physiques) ;
  - appelée par `ActivitySelectionScreen.tsx:139` (R = 0) et `ExerciseScreen.tsx:254`.
- **Duplication d'une Activité dans la Composition :** `duplicateActivity` (`src/domain/sessions/composition.ts:217-245`), appelée par `CompositionScreen.tsx:435`.
- **Réouverture et édition :** `activityDefinitionToInput` (`ActivityDefinition.ts:422-449`) ; `SessionDraft.ts:292-296` pour le clonage et les médias, `:340-342` pour l'égalité, `:441-445` pour la conversion en entrée.
- **Duplication de Séance :** **aucune fonction trouvée** (grep `duplicate` ne renvoie que `duplicateActivity` et des libellés).
- **Instantanés :** voir la section 2. Le domaine est prêt, mais non branché.

### Consommateurs du mode échec
Résultat de `grep TO_FAILURE|toFailure`, hors tests :

**Domaine**
- `src/domain/sessions/Session.ts:64` : type `ExerciseExecutionMode` (commentaires `:60-62`, `:69-73`, `:248`).
- `src/domain/activities/ExecutionParameters.ts` :
  - `:27` `EXECUTION_MODES` ;
  - `:148` normalisation qui annule les cibles ;
  - `:235` validation `MUST_BE_ABSENT` ;
  - `:306` contrôle de cohérence de `parseRow`.
- `src/domain/activities/ExecutionParametersDraft.ts:154`, `:290`, `:299` : mémorisation et `setMode`.
- `src/domain/activities/executionPhrase.ts:105` (exception de cible nulle) et branche « jusqu'à l'échec » `:146-148`.
- `src/domain/activities/executionCalculations.ts:55-63` : implicite, car un mode autre que Durée ou Répétitions donne un travail `null`, donc `omitted`.
- `src/domain/activities/ActivityDefinition.ts:194-198` (liste des modes) et `:326-333` (scalaires absents).
- `src/domain/sessions/validation.ts:69-73`, `:258`, `:600-606`.
- `src/domain/sessions/errors.ts:23`, `:44` : documentation.
- `src/domain/sessions/SessionDraft.ts:60` : documentation.

**Interface**
- `src/features/activities/ExecutionParametersSheet.tsx:434` : segment de mode « À l'échec ».
- `src/features/sessions/compositionPresentation.ts:272-278` (résumé de ligne) et `:375-381` (récapitulatif).
- `src/shared/i18n/index.ts:27` `modes.TO_FAILURE`. **`failureTarget: "À l'échec"` (`index.ts`, section `sheet`) est déclaré mais jamais utilisé** (grep).
- `src/shared/i18n/resources/fr.ts:380` (`exerciseRow.toFailure`, « jusqu'à l'échec ») et `:478` (« À l'échec »).

**Persistance**
- `migration003.ts:56`, `:106` ; `migration004.ts:99`, `:151` ; `migration006.ts:21` : contraintes CHECK.
- `src/infrastructure/database/repositories/SqliteSessionRepository.ts:1243` : `assertSessionAggregateRow`.
- `src/infrastructure/database/types/DatabaseRows.ts:51` ; `constants.ts:25` ; `migrateDatabase.ts:24` : documentation.

**Tests qui fixent `TO_FAILURE`** (nombre d'occurrences)

| Fichier | Occurrences |
|---|---:|
| `compositionPresentation.test.ts` | 15 |
| `migrateDatabase.test.ts` | 9 |
| `validation.test.ts` | 9 |
| `calculations.test.ts` | 6 |
| `targetSchema.test.ts` | 5 |
| `ExecutionParameters.test.ts` | 4 |
| `ExecutionParametersDraft.test.ts` | 4 |
| `SqliteSessionRepository.test.ts` | 4 |
| `SessionDraft.test.ts` | 3 |
| `ActivityDefinition.test.ts` | 2 |
| `executionCalculations.test.ts` | 2 |
| `SqliteActivityDefinitionRepository.test.ts` | 2 |
| `executionPhrase.test.ts` (corpus) | 1 |
| `ActivityCard.test.tsx` | 1 |
| `ActivityEditorForm.test.tsx` | 1 |
| `ExecutionParametersSheet.test.tsx` | 1 |
| `formatSessionSummary.test.ts` | 1 |
| `src/shared/i18n/index.test.ts` | — (`:233`, `:263`, `:492`) |

### Consommateurs des scalaires de mode et de cible
Ces fichiers sont touchés indirectement par une cible typée.

| Fichier | Occurrences de `executionMode`, `executionParameters` ou `.mode` |
|---|---:|
| `ExerciseScreen.tsx` | 20 |
| `SqliteSessionRepository.ts` | 17 |
| `SessionDraft.ts` | 15 |
| `validation.ts` | 27 |
| `Session.ts` | 10 |
| `ActivityEditorForm.tsx` | 10 |
| `compositionPresentation.ts` | 10 |
| `ExecutionParametersSheet.tsx` | 9 |
| `SqliteActivityDefinitionRepository.ts` | 9 |
| `calculations.ts` | 5 |
| `composition.ts` | 2 |

---

## 6. Brouillons

- **Trois niveaux de brouillon :**
  1. le brouillon de la feuille (`ExecutionSheetDraft`, réserves volatiles, perdues à ✕) ;
  2. le brouillon de l'éditeur (`value` de `ActivityEditorForm`, contrôlé par `ExerciseScreen`) ;
  3. pour la copie de Séance, le brouillon de Composition (`SessionDraftContext` et `SessionDraftProvider.tsx`).
- **✓ :** `commitSheetDraft`, puis `onApply`. Rien n'est persisté.
- **✕ et retour système :** `onCancel`, déclenché par `Modal.onRequestClose` (`:362`).
- **Changement de mode :**
  - N, les pauses, le bip et les côtés sont conservés ;
  - les cibles incompatibles passent à `null` (« — ») ;
  - revenir à un mode déjà visité **restaure** ses cibles, identité par identité (`ExecutionParametersDraft.ts:278-304`).
  - **Passer en `TO_FAILURE` vide toutes les cibles.** En repartir restaure les cibles numériques mémorisées, mais l'« échec » lui-même n'est pas mémorisé par ligne, puisque c'est un mode et non une cible.
- **N :**
  - réduire N masque les lignes dans `hiddenRows`, dans leur ordre ;
  - l'augmenter restaure ces lignes, puis clone la dernière, cibles mémorisées comprises (`:183-216`).
- **Variable ⇄ uniforme :**
  - à la désactivation, l'uniforme reprend la première ligne et le tableau est réservé ;
  - à la réactivation, le tableau réservé est restitué (`:225-276`).
- **Réordonnancement :** `moveRow` (`:335-346`). L'identité voyage avec la ligne. Il n'y a pas d'annulation spécifique.
- **N=1 :** l'état devient effectivement uniforme et l'ordre `BY_SIDE` ; l'interrupteur et l'ordre sont grisés à 45 %.
- **Abandon de l'éditeur :** comparaison `formValueEquals`, puis `ExerciseExitConfirmModal`. Après confirmation, seules les copies de médias préparées et non référencées sont nettoyées (`MediaDraftLeases`).

---

## 7. Lexique, jetons et accessibilité

- **Lexique :**
  - `src/shared/i18n/index.ts` (136 lignes) déclare un objet `executionParameters` (`card`, `sheet`, `media`, `summary`, `referenceSheets`, `:10-131`), fusionné dans `strings` (`:134`) ;
  - `resources/fr.ts` (823 lignes) contient le catalogue général ;
  - `index.test.ts` fige des valeurs (par exemple `:492`, les trois modes).
  - **Clés présentes :** `sheet.modes` (3 modes), `variable: "Séries variables"`, `incompleteSeries` et `incompleteUniform` (Durée et Répétitions seulement), `failureTarget` (non utilisée), `disabledSuffix`, `adjusted`, `totalEstimated: "Durée totale ≈"`.
  - Il n'existe aucune clé pour un total partiel « ≥ » au niveau de l'Exercice, pour le Régime, ni pour l'état de cible « échec » dans une cellule.
- **Jetons :**
  - `src/shared/ui/tokens.ts` (596 lignes) : `colors`, `type`, `spacing`, `fixedRadii`, `borderWidths`, `icon`, `dimensions` (dont `wheelPicker.*` et `contextBand`), `minTouchTarget = 48` (`:596`) ;
  - ils sont verrouillés par `tokensSpecification.test.ts` ;
  - l'opacité « sans effet » de 0,45 est une constante locale (`ExecutionParametersSheet.tsx:1160`), pas un jeton.
- **Accessibilité existante :**
  - environ 38 attributs `accessibility*` dans la feuille, 21 dans l'éditeur, 24 dans `CategoryPickerModal` et 17 dans `BodyZonePickerModal` ;
  - le libellé de la carte est la phrase complète (`ActivityEditorForm.tsx:311`) ;
  - actions accessibles monter et descendre sur les lignes ;
  - `accessibilityLiveRegion` sur l'erreur d'enregistrement (`:423`) ;
  - retour du focus à la fermeture de la feuille ;
  - prise en compte de « Réduire les animations ».
  - Aucun `allowFontScaling` ni `maxFontSizeMultiplier` dans `src/` (grep vide) : le texte agrandi n'est pas borné.

---

## 8. Tests

- **Volume :**
  - 96 fichiers `*.test.ts(x)` dans `src/` et `app/` ;
  - environ 1 655 appels `it(` ou `test(`, plus 276 cas paramétrés du corpus ;
  - Jest `jest-expo`, `maxWorkers: 2`, `testTimeout: 30000` (`jest.config.js`).
- **Organisation :** dossiers `__tests__/` à côté du code ; `@jest/globals` importé explicitement. Les mocks de `@expo/ui` se trouvent dans les deux tests de roulettes.
- **Tests utiles à PRE-4 (nombre d'`it`) :**

| Fichier | `it` |
|---|---:|
| `ExecutionParametersSheet.test.tsx` | 45 |
| `ActivityEditorForm.test.tsx` | 20 |
| `ExerciseScreen.test.tsx` | 26 |
| `ExecutionParameters.test.ts` | 18 |
| `ExecutionParametersDraft.test.ts` | 26 |
| `executionCalculations.test.ts` | 16 |
| `executionPhrase.test.ts` | 10 (+276) |
| `exerciseSnapshot.test.ts` | 4 |
| `ActivityDefinition.test.ts` | 23 |
| `SqliteActivityDefinitionRepository.test.ts` | 26 |
| `SqliteSessionRepository.test.ts` | 70 |
| `migrateDatabase.test.ts` | 58 |
| `targetSchema.test.ts` | 15 |

- **Intégration multi-écrans (`*.integration.test.tsx`) :**
  - `CatalogueCompositionEditFlow`, `CompositionExerciseFlow`, `ExerciseNavigationGuard`, `CompositionNavigationGuard`, `CategoriesSaveFlow` (dans `src/features/sessions/__tests__/`) ;
  - `TabsLayoutSearch` (dans `src/shared/ui/__tests__/`).
- **Utilitaires SQLite :** `NodeSqliteDatabase` (réel) et `FailingDatabase`, local à `migrateDatabase.test.ts:1606`.

---

## 9. Écarts entre le code et ED-01..ED-22

Constat, sans solution.

| ED | Existe déjà | Manque ou diffère |
|---|---|---|
| 01 | Un seul éditeur, quatre parcours (`ExerciseScreen.tsx:198-208`), copie isolée | — |
| 02 | Écran complet (bande, nom, références, carte, description, médias, Terminer) | Fidélité aux références courantes à vérifier |
| 03 | Mode, Côté et Ordre en segmentés **en place** dans une feuille `Modal` | Aucun popover ancré (supprimé, `WheelPickerOverlay.tsx`) ; aucun « Régime » |
| 04 | État variable explicite (`series.kind`), chevron seulement en variable | **Interrupteur `Switch` présent** (`Sheet:480`) |
| 05 | — | **Trois modes partout** : type `Session.ts:64`, listes de modes (3 occurrences), segment, CHECK SQL, analyse, phrase, Composition |
| 06 | — | **Pas de cible typée** : `target: number \| null`, où `null` est ambigu entre échec et vide ; pas de mixte |
| 07 | `DurationWheelPicker` natif pour la Durée uniforme | Pas d'option échec ; pas de roulette Répétitions dans la feuille (stepper) ; `NumberWheelPicker` fixé à 1..99, sans option de tête |
| 08 | Grisé à 0,45 existant (N=1) | Pas d'état grisé lié à l'échec |
| 09 | Bornes nouvelles et anciennes, sans clamp à la lecture | Durée **1..5999 au pas de 1** (borne et pas, domaine et roulette) ; pause 0..300 |
| 10 | Tableau, poignée, numéro, actions accessibles | **Steppers permanents dans chaque cellule** ; pas de pied commun ; pas de retrait de ligne |
| 11 | Mémoire des cibles par mode et par identité ; bip conservé | L'échec n'est pas conservé entre modes (c'est un mode) |
| 12 | Réserves de N, clone, `moveRow`, N=1 normalisé | Pas de suppression d'une ligne ni de son annulation |
| 13 | exact, ≈, omitted ; Séance ≥ | **Pas de « partiel ≥ » à l'Exercice** : dès qu'un travail est inconnu, `omitted` |
| 14 | Inversion réservée à la Durée uniforme renseignée | Pas de règle liée à une cible échec |
| 15 | Pauses connues conservées dans `knownSeconds` ; R terminale ; bilatéral | Résumés Composition fondés sur les scalaires |
| 16 | Énumération ≤ 3, minimum et maximum > 3, gras, aucune persistance | Pas de mixte ; pas de compaction vers Échec |
| 17 | Corpus 276 et test | 92 cas encodés en `TO_FAILURE` |
| 18 | Transaction unique, annulation réelle, `node:sqlite` | Aucune conversion de l'ancien mode ; CHECK `activities` incompatible avec une cible échec en Répétitions ou Durée (**contrainte majeure**) |
| 19 | Copies clonées, médias ordonnés, instantané versionné (non persisté) | Les instantanés et `parseExecutionParameters` n'acceptent que v1 |
| 20 | Sélecteurs PRE-3 de Catégorie et Zones | À vérifier sans changement |
| 21 | Prêts de fichiers, liens ordonnés, aucune suppression physique | — |
| 22 | Accessibilité partielle (libellés, actions, focus, animations réduites) | Pas de gestion du texte agrandi |

---

## 10. Risques et pièges

1. **`migration001.ts` est intouchable.** Le CHECK composite d'`activities` vit dans `migration004.ts:117-170`. Le modifier impose une reconstruction en 12 étapes, déjà pratiquée en 003 et 004 (`defer_foreign_keys`, sauvegarde et restauration d'`activity_body_zones`). Une simple adaptation de la projection n'impose pas cette reconstruction.
2. **Projection des scalaires :** `projectLegacyScalars` ne reprend que la **première** cible. Une Durée ou des Répétitions dont la première cible est un échec produiraient `duration_seconds` ou `repetition_count` nul, ce que refusent le CHECK SQL, `assertSessionAggregateRow` (`SqliteSessionRepository.ts:1235-1242`) et la revalidation scalaire de `validateActivityDefinitionInput` (`ActivityDefinition.ts:298-325`).
3. **Résumés Composition fondés sur les scalaires :** `durationSeconds ?? 0` et `repetitionCount ?? 0` (`compositionPresentation.ts:280-288`). Le risque est d'afficher « 0 répétition » ou « 0 s » pour une cible échec.
4. **`parseRow` lève une erreur** si la cible est incohérente avec le mode (`ExecutionParameters.ts:306`). Les lectures en Repository, en instantané et en liste échoueraient bruyamment (`ExecutionParametersDataError`) en cas de format mixte non reconnu.
5. **Version 1 figée :** le JSON, l'instantané (`exerciseSnapshot.ts:109`, `:118`) et la conversion du corpus (`toInput` `version: 1`) la supposent tous.
6. **CRLF :** `core.autocrlf=true`, sources en CRLF. Toute fixture lue par découpage de lignes doit retirer `\r`.
7. **`SQLiteProvider` :** ne jamais lui passer les `children` de l'application (`SessionServiceProvider.tsx:31-49`).
8. **Garde-fous des roulettes :** zéro `ScrollView` sur iOS et props `selection`/`onSelectionChange` (`DurationWheelPicker.test.tsx:378`, `:619` ; `NumberWheelPicker.test.tsx:267`). Ne pas les affaiblir. Ajouter une option échec ou un pas de 5 se fait dans la primitive SwiftUI `Picker`, sans la remplacer.
9. **`PickerToolbar` dupliqué volontairement** (`NumberWheelPicker.tsx:47-57`, `:180`). Le second paramètre de `SessionService` est aussi conservé volontairement (`SessionService.ts:56-62`).
10. **`tsc --noEmit` couvre aussi** `docs/preparation/PRE-3/planification/execution/preuves/revue-independent-transitions.repro.tsx`. Le corpus 276 est lu depuis `docs/preparation/PRE-3/...` par un test : déplacer ou modifier ce JSON casse la suite.
11. **Inversion de dépendance assumée :** les migrations importent `BODY_ZONES` depuis `src/features/reference-data/bodyZones` (`migration002.ts:3`, `migration003.ts:1`).
12. **README par répertoire :** `src/features/activities/` et `src/domain/activities/` n'en ont pas, alors qu'AGENTS.md annonce un `README.md` dans chaque répertoire de `src/`.
13. **Clé de lexique morte :** `failureTarget` existe sans consommateur.
14. **Glisser par responder RN :** pas de gesture-handler, alors que `react-native-gesture-handler` 2.32 et `reanimated` 4.5.1 sont installés. Le défilement est bloqué pendant le glisser. Tout changement du tableau touche ce mécanisme, recetté sur appareil (recette 2, T-15).
