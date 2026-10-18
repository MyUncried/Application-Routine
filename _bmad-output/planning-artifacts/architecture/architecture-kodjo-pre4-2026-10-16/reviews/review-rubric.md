# Revue de la spine d'architecture PRE-4 : grille good-spine

> Historique — revue interne du 2026-10-16, antérieure à la revue ChatGPT ; non mise à jour.

- **Objet :** `ARCHITECTURE-SPINE.md` et `.memlog.md` (dossier parent), état du 2026-10-16.
- **Entrées lues :** PRD `prd-kodjo-pre4-2026-10-16/prd.md`, lu tel quel pendant sa correction par un autre agent ; `extracts/code-depart.md` ; `research/primitives-natives-expo-ui.md` ; `AGENTS.md` ; `docs/preparation/PRE-4/bmad/questions-ouvertes.md` ; code `src/` (lecture seule).
- **Non lus :** `docs/preparation/PRE-4/planification/` et `.github/orchestration/`.
- **Nature :** revue interne à la préparation BMad. Ce n'est pas la revue indépendante ChatGPT.

## Verdict global

**À corriger avant de découper en epics et stories.**

La spine est courte et bien orientée. Le paradigme ratifie fidèlement le code. AD-1, AD-2, AD-3, AD-5, AD-6 et AD-9 désignent les bons propriétaires uniques, et la plupart des affirmations sur le code sont exactes.

Deux règles mènent cependant à une perte ou à une destruction de données contraire au PRD :

- la frontière « illisible » d'AD-4 contredit FR-18-14 et H7 ;
- le motif de reconstruction d'AD-4 omet `session_activity_media`.

Quatre points de divergence entre stories n'ont pas de propriétaire : la tolérance des valeurs héritées (H25), le mécanisme ± déjà présent dans le code, la surface unique ouverte de la Feuille, et l'inventaire des lecteurs de scalaires.

| Gravité | Nombre |
|---|---:|
| Critique | 2 |
| Élevé | 4 |
| Moyen | 8 |
| Faible | 7 |

---

## Constats

### Critiques

#### C1. AD-4 et AD-1 : la frontière « ligne illisible » supprime des données que le PRD ordonne de conserver, et le format v2 ne peut pas les représenter

**Emplacement :** AD-4, puce « Ligne illisible (Q19) » ; AD-1, Rule (« `UNSET` … jamais accepté par la validation enregistrable ») ; AD-3, Rule (lecteur v1/v2).

**Constat :**

- AD-4 classe comme illisible toute ligne aux « scalaires incohérents sans JSON », et la supprime.
- FR-18-14 (et H7, FR-18-20 dernière puce, note de FR-18-14) dit le contraire. Une donnée **lisible mais invalide** est conservée telle quelle et n'est jamais convertie en échec : « Répétitions sans nombre », « Durée sans valeur », Durée hors 5..3535, Bip hors 0..10.
- Ces données existent réellement :
  - `activity_definitions` n'a aucun CHECK composite (`migration006.ts:21-23`). Une définition antérieure à PRE-3 (JSON `NULL`) en `REPETITIONS` avec `repetition_count` nul y est donc possible.
  - Le lecteur historique l'accepte aujourd'hui (`ExecutionParameters.ts:395-415`, `scalars.executionMode ?? "DURATION"`).
- Même si cette ligne était conservée, AD-1 ne permet de persister que `NUMBER | FAILURE`. Le v2 « matérialisé pour chaque ligne » ne peut donc pas porter une Cible à renseigner héritée. La spine ne tranche pas entre trois issues : la supprimer, la convertir, ce qu'interdit FR-18-14, ou laisser un JSON nul.

**Correction proposée :**

1. Définir « illisible » de façon fermée et testable. Proposition :
   - JSON syntaxiquement invalide ;
   - version inconnue ;
   - structure non mappable : `series` absent, `kind` inconnu, ligne sans cible ni `null` ;
   - mode hors énumération ;
   - type SQL impossible.
   Tout le reste est « lisible ».
2. Pour une donnée lisible mais invalide, décider sa représentation persistée. Par exemple, une variante `{ kind: "UNSET" }` admise **en lecture et en réécriture inchangée** dans le v2, refusée à toute nouvelle saisie. Ou bien : conservation du JSON v1 ou des scalaires, sans matérialisation. Si cela touche le produit, poser la question à Hermann avant d'écrire AD-4 (règle de `CLAUDE.md`).
3. Ajouter à AD-10 un cas de test : définition `REPETITIONS` sans nombre et sans JSON. Attendu : conservée, relue « — », jamais à l'échec.

#### C2. AD-4 : le « motif en 12 étapes de 003 et 004 » détruit les liens Médias de Séance

**Emplacement :** AD-4, 3ᵉ puce.

**Constat :**

- 003 et 004 sauvegardent puis restaurent `activity_body_zones` (`migration004.ts:233-260`). En effet, `DROP TABLE activities` exécute un `DELETE` implicite qui déclenche les `ON DELETE CASCADE`. `defer_foreign_keys` diffère les vérifications, pas les actions.
- Depuis la migration 009, une seconde table fille existe : `session_activity_media(activity_id … ON DELETE CASCADE)` (`migration009.ts:42-45`).
- Appliqué tel qu'il est écrit, le motif supprime sans bruit tous les liens Médias des Copies en Séance. Cela viole FR-21-57, FR-18-11 et SM-2.
- La reconstruction doit aussi reproduire les colonnes et contraintes ajoutées après 004 : `side_mode` (005), `post_activity_recovery_seconds` (007), `execution_parameters` et la clé étrangère `category_id` (009), ainsi que les index.

**Correction proposée :**

1. Dans la Rule d'AD-4, énumérer les tables filles d'`activities` à sauvegarder puis restaurer : `activity_body_zones` et `session_activity_media`. Les identifier en lisant `sqlite_master` ou `PRAGMA foreign_key_list` plutôt que par une liste figée.
2. Exiger que le schéma reconstruit soit égal au schéma v9, hors le CHECK composite, et que `targetSchema.test.ts` le vérifie.
3. Ajouter à AD-10 une assertion de comptage, avant et après la migration, des lignes de chaque table fille.

### Élevés

#### E1. Valeurs héritées hors bornes (H25, FR-09-05, FR-18-07) : aucune règle ne sépare les bornes de saisie des bornes d'enregistrement

**Emplacement :** AD-1 (« ses bornes, sa validation ») ; absent d'AD-4 et d'AD-8.

**Constat :**

- Les nouvelles bornes de saisie sont : Durée 5..3535 au pas de 5, Répétitions 1..100.
- H25 et FR-09-05 exigent qu'une valeur héritée **non modifiée** (5999 s, 7 s, 150 répétitions, Bip 11) ne bloque ni le ✓ de la Feuille ni `Terminer`, et soit réenregistrée telle quelle.
- La spine ne dit pas laquelle des deux validations porte cette tolérance : celle de la Feuille ou celle du dépôt.
- Aujourd'hui `EXECUTION_BOUNDS.durationTarget` vaut 1..5999 (`ExecutionParameters.ts:33`), et le CHECK d'`activities` vaut 1..5999.
- Sans règle, deux comportements sont plausibles :
  - une story resserre les bornes de `validateExecutionParameters` et rend les Exercices historiques impossibles à réenregistrer ;
  - une autre garde 1..5999 et laisse passer une saisie nouvelle hors grille.

**Correction proposée :** dans AD-1, écrire deux prédicats du domaine.

- `isValidEntry` : grille et bornes de saisie, appliquées à toute valeur modifiée.
- `isStorable(params, original)` : une valeur égale à l'originale passe, même hors grille.

Le CHECK SQL reconstruit garde 1..5999 pour la Durée. Ajouter les tests H25 à AD-10.

#### E2. Le mécanisme ± (FR-03-05, FR-09-04, FR-10-04, FR-10-05) n'est pas ratifié, alors qu'il existe et a été accepté

**Emplacement :** absent ; AD-8 ne traite que le Pied commun.

**Constat :**

- `src/shared/ui/ProfileStepper.tsx` porte déjà le comportement accepté en PRE-3 :
  - le motif « appui sur la valeur → ± » avec une seule ouverture à la fois (`isOpen`/`onToggle`, D-227) ;
  - `StepperHoldPolicy`, `EXECUTION_ACCELERATED_HOLD_POLICY` (500 ms puis 150 ms, paliers de 5 puis de 10) et `EXECUTION_UNIT_HOLD_POLICY` ;
  - `createHoldRepeater` et `steppedValue` (multiples directionnels).
- La spine ne les cite pas. Une story risque d'écrire un troisième stepper, contre la règle de non-remplacement d'AGENTS.md.
- Q21 et P38 ne sont pas couverts :
  - `steppedValue(5999, +1, 5, 5, 3535)` renvoie 3535 : un « + » qui fait baisser la valeur, alors que P38 rend « + » indisponible ;
  - la Cible Durée demande un pas de base de 5. Aucune politique existante ne le fournit.
- L'ouverture du Sélecteur sur « la valeur de grille la plus proche » (Q21) n'a pas de propriétaire. La roulette et le Pied commun peuvent l'arrondir différemment.

**Correction proposée :** ajouter un AD « Réglage numérique ».

1. Réutiliser `InlineStepper`, ou le motif ouvert/fermé de `ProfileStepper`, avec `createHoldRepeater` [ADOPTED].
2. Ajouter une politique « Cible Durée » : pas de base 5, paliers 5 puis 10.
3. Placer dans `ExecutionParameters.ts` les fonctions pures `nearestGridValue` (Q21), `nextDirectionalValue` et `canStep(direction)` (P38). Le Pied commun et la roulette n'appellent que ces fonctions.
4. Le Profil garde `PROFILE_HOLD_POLICY`, inchangé.

#### E3. « Une seule surface ouverte » dans toute la Feuille : aucun propriétaire

**Emplacement :** AD-7, AD-8 (« une seule Cellule active »).

**Constat :**

- Le PRD exige une seule surface ouverte à la fois dans toute la Feuille : un popover, une roulette, un champ ± ou une cellule active (FR-03-10, FR-07-01, FR-10-02, FR-10-05, FR-22-11).
- Un appui qui range l'outil ne déclenche jamais la croix de retrait, mais peut activer une cible inoffensive (FR-03-05, FR-10-04, FR-12-05).
- Chaque `Popover` SwiftUI vit dans son propre `Host`, avec son propre `isPresented`. Rien ne les coordonne nativement.
- La spine ne dit pas où vit cet état : brouillon du domaine, ou état d'interface de la Feuille. Elle ne dit pas non plus comment l'appui extérieur est arbitré face à la croix. Les stories « popovers », « Sélecteur », « tableau » et « ± » vont chacune gérer leur ouverture.

**Correction proposée :** dans AD-7, ou un AD dédié, écrire la règle suivante.

- `ExecutionParametersSheet` détient un unique `activeSurface`, union discriminée `none | popover(kind) | targetPicker(rowId?) | totalPicker | stepper(field) | cell(rowId, column)`, en état d'interface hors domaine.
- Tous les `isPresented` en dérivent.
- `onIsPresentedChange(false)` remet `none`.
- La croix vérifie `activeSurface === none` avant d'agir.
- La Cellule active et le libellé du Pied commun se lisent dans cet état.

#### E4. AD-3 énonce le principe « aucun lecteur de scalaires » sans inventaire ni sort du JSON nul

**Emplacement :** AD-3 ; Structural Seed.

**Constat :** plusieurs modules lisent ou contrôlent les scalaires. Après le premier enregistrement d'une Cible `FAILURE` en tête, ils casseront ou divergeront :

- `assertSessionAggregateRow` (`SqliteSessionRepository.ts:1205-1250`) lève sur `DURATION` avec `duration_seconds` nul. La Séance devient illisible.
- La revalidation des scalaires dans `validateActivityDefinitionInput` (`ActivityDefinition.ts:298-333`) refuse l'écriture.
- Le chemin historique de `sessions/validation.ts:579-617`.
- `ExerciseScreen.occurrenceParameters` (`:433-444`).
- Le repli scalaire de `getDurationFactsBySession` (`SqliteSessionRepository.ts:1134-1145`).
- `legacyExecutionParameters` et `resolveExecutionParameters`.

La spine ne dit pas non plus si `execution_parameters` devient obligatoire après la migration 010, ni ce que fait le lecteur d'un JSON nul résiduel : erreur de donnée ou adaptateur historique.

**Correction proposée :**

1. Ajouter à AD-3 la liste de ces points, chacun avec son sort : supprimé, ou réécrit sur le JSON.
2. Décider : « après 010, JSON nul = erreur de donnée ; l'adaptateur scalaire ne vit plus que dans la migration 010 ».
3. Ou bien décider l'inverse explicitement.

### Moyens

#### M1. Deferred « Popover dans la Modal » : ni porte ni repli, et une hypothèse d'imbrication manque

**Emplacement :** Deferred, dernière puce ; AD-7.

**Constat :**

- La faisabilité est différée à « la première story d'interface ». Si elle échoue, rien n'indique quelles stories sont bloquées. Le Mode, le Côté, l'Ordre, le Régime, le Sélecteur et la Durée totale peuvent alors partir dans des directions différentes.
- La spine n'énonce pas une seconde hypothèse : héberger `DurationWheelPicker`, qui a déjà son propre `Host`, dans `Popover.Content` → `RNHostView`, c'est-à-dire un `Host` dans un `RNHostView` dans un `Host`.
- Deux points de vigilance de la recherche ne sont pas repris : le positionnement de la bulle dans un `ScrollView` en défilement, et la cohabitation avec les `Modal` RN.

**Correction proposée :**

- Faire de la vérification une story 0 (spike sur appareil) qui bloque les autres stories d'interface.
- Énoncer les deux hypothèses : Popover dans la Modal, et imbrication des `Host`.

#### M2. Le « motif de repli existant » d'Android et du web n'existe pas pour les popovers

**Emplacement :** AD-7, puce « Android et web ».

**Constat :** aucun popover n'existe dans le code : l'ancien `PopoverAnchor` a été retiré (`WheelPickerOverlay.tsx:1-40`). Le repli « existant » est le `SegmentedControl` en place pour le Mode, le Côté et l'Ordre, et les roulettes `Legacy*` en `ScrollView`. Pour le Régime, ou pour l'option échec en tête de roue sur Android, rien n'est défini.

**Correction proposée :**

- Nommer le repli contrôle par contrôle.
- Ajouter un garde-fou de test iOS par nouveau popover : aucun `Modal` ni `Pressable` de substitution (recherche, Q5).

#### M3. AD-12 : emplacement de l'avis non fixé ; table construite sur une hypothèse

**Emplacement :** AD-12.

**Constat :**

- La spine ne dit ni quel composant lit l'avis, ni à quel moment du démarrage, ni par quel provider ou écran.
- L'acquittement doit passer par le repository (règle d'AGENTS.md), ce que la spine ne mentionne pas.
- La table repose sur H24, qui est une hypothèse.
- FR-18-20 interdit toute « table … de l'Exercice écarté ».

**Correction proposée :**

- Fixer le lieu d'affichage, par exemple après `SessionServiceProvider`, sur le premier écran à onglets.
- Préciser que `migration_notices` ne contient que le type, le nombre et la date, jamais une donnée d'Exercice.
- Marquer la table `[ASSUMPTION: H24]` et indiquer ce qu'elle devient si Hermann infirme H24.

#### M4. AD-4 : trois précisions de matérialisation manquent

**Emplacement :** AD-4.

**Constat :**

1. Les lignes `type = 'RECOVERY'` d'`activities` : le type existe encore (`Session.ts:48`), et le CHECK l'admet. Elles ne doivent recevoir aucun JSON d'exercice. La spine écrit « chaque ligne … d'occurrence ».
2. La colonne scalaire `activity_definitions.execution_mode = 'TO_FAILURE'` doit être reprojetée en `REPETITIONS`. FR-18-01 l'exige : « aucune Définition ne porte l'Ancien mode ». AD-4 ne parle que du JSON.
3. Une suppression laisse des trous dans `position`, à l'intérieur de la portée. Il faut décider s'ils sont tolérés ou renumérotés (FR-18-20 : « ordre relatif conservé »).

**Correction proposée :** trois phrases dans la Rule d'AD-4.

#### M5. AD-3 : « Les Instantanés passent en version 2 » est ambigu

**Emplacement :** AD-3, dernière phrase.

**Constat :** la phrase ne dit pas si c'est `EXERCISE_SNAPSHOT_VERSION` (`exerciseSnapshot.ts:22`) ou la version des paramètres embarqués qui passe à 2. FR-19-10 exige aussi qu'un Instantané v1 sans Bip soit lu non cadencé.

**Correction proposée :**

- Fixer les deux numéros de version : celui de l'Instantané et celui des paramètres qu'il contient.
- Préciser que le lecteur d'Instantané v1 passe par l'adaptateur v1 d'AD-3.

#### M6. AD-5 : formateur de durée et de carte, portée imprécise

**Emplacement :** AD-5.

**Constat :**

- Quatre formateurs coexistent :
  - `formatPhraseDuration` (`executionPhrase.ts:32`) ;
  - `formatCompactDuration` et `formatDurationRowValue` (`compositionPresentation.ts:149`, `:200`) ;
  - `formatEstimatedDuration` (`formatSessionSummary.ts:54`, `Math.ceil` et `≥`).
- La spine ne nomme pas celui qu'elle adopte.
- Elle range les « cartes de Séance » parmi les appelants du formateur de carte. Or Q20, qui supprime l'arrondi d'un total partiel, ne vise que l'Exercice sur les cartes Catalogue et Composition. Appliquée à `SessionCard`, la règle changerait l'affichage `≥` des Séances, hors Q4.

**Correction proposée :**

- Nommer le formateur adopté [ADOPTED].
- Limiter la règle « `≥` sans arrondi » aux cartes d'Exercice.
- Laisser `formatEstimatedDuration` inchangé pour les totaux de Séance, ou poser la question.

#### M7. Stratégie de test des Phrases : aucune règle d'indépendance de l'oracle

**Emplacement :** AD-10.

**Constat :** FR-17-04 exige des variantes « vérifiées indépendamment du générateur ». FR-17-05 renvoie la matrice Mode × Bip × Régime × Cible × N × côtés à l'architecture. AD-10 ne couvre que le corpus et la migration. Une story peut produire ses attendus en appelant le générateur.

**Correction proposée :** écrire dans AD-10 que les attendus sont des chaînes littérales en fixture, et que les totaux sont recalculés par formule, jamais par `executionCalculations`.

#### M8. Enveloppe opérationnelle incomplète

**Emplacement :** Deferred.

**Constat :** seul le mode d'installation est traité. Trois points ne sont ni décidés, ni différés, ni posés en question :

- l'identification de la version livrée pour la recette (Q5 : « version identifiable ») ;
- le comportement d'erreur de démarrage invoqué par H6 et FR-18-15 : où il est affiché, et s'il existe ;
- la durée de la migration sur une base réelle, avec une transaction exclusive au démarrage.

**Correction proposée :** pour chacun, une ligne : décision, report ou question.

### Faibles

| Réf. | Constat | Correction |
|---|---|---|
| F1 | AD-1 présente comme acquis que « `ExecutionParameters.ts` est le seul module qui définit ces types ». Aujourd'hui, `ExerciseExecutionMode` est défini dans `Session.ts:64` et importé par `ExecutionParameters.ts:19`. Des listes de modes existent aussi dans `ActivityDefinition.ts:194-198`, dans `validation.ts:69-73` et dans `DatabaseRows.ts:51`. | Dire que `Session.ts` réexporte le type, et nommer un type `LegacyExecutionMode` réservé au lecteur v1, aux lignes SQL et à la migration. |
| F2 | Q12 : les ✕/✓ de la roulette. La barre `PickerToolbar` existante affiche Annuler/Valider (`DurationWheelPicker.tsx:315`, en double dans `NumberWheelPicker.tsx:180`, duplication volontaire). La spine ne dit pas si elle est réutilisée ou modifiée. | Préciser : la barre est réutilisée ; seuls ses libellés ou icônes changent, dans les deux copies. |
| F3 | Le message « Série supprimée — Annuler » doit suivre « la convention de notification existante » (FR-12-05). La spine ne nomme pas le message d'ajustement existant (`ExecutionParametersSheet.tsx:348`, `:743-768`). | Ratifier la réutilisation de ce composant. |
| F4 | Retour haptique à chaque cran, indépendant du réglage Vibrations (FR-07-06) : la spine ne dit pas si l'haptique système du `Picker` suffit. | Une ligne dans AD-7. |
| F5 | La Feuille en `Modal` RN, acceptée en PRE-3, n'apparaît que dans le diagramme. NFR-02 cite pourtant « feuille » parmi les primitives natives. | Marquer le conteneur `[ADOPTED]` (non-remplacement). |
| F6 | Texte agrandi (FR-22-05) : aucune convention, alors qu'aucun `allowFontScaling` ni `maxFontSizeMultiplier` n'existe dans le code. | Convention : ne pas borner l'agrandissement ; aucune hauteur fixe. |
| F7 | `formatExerciseRecap` et `formatExerciseDurationLine` (`compositionPresentation.ts:354`, `:441`) ont des branches `TO_FAILURE` et des `?? 0`. Ils n'ont aucun appelant hors tests (grep). AD-6 ne les mentionne pas. | Les déclarer hors service (à supprimer) ou les rattacher à AD-6. |

---

## Rapprochement : exigences et contraintes qui n'atterrissent pas, ou mal

| Élément | Atterrissage dans la spine | Écart |
|---|---|---|
| Q19 : liens écartés (Zones, Médias, Catégorie) | AD-4 | Le motif de reconstruction détruit `session_activity_media` (C2). La frontière lisible/illisible contredit FR-18-14 (C1). |
| H24 : avis unique | AD-12 | Lieu d'affichage non fixé ; table fondée sur une hypothèse (M3). |
| H25 : valeur héritée réenregistrée telle quelle | absent | E1. |
| H7, FR-18-14 : donnée lisible invalide conservée | contredit par AD-4 | C1. |
| Q12 : ✕/✓ de la roulette | AD-7 | Sort de `PickerToolbar` non fixé (F2). |
| Q21, P38 : grille la plus proche, ± directionnels, + indisponible | AD-8 renvoie à AD-1 sans fonctions | E2. |
| Q13, Q15 : ✓ indisponible sur `00:00` ; ± indisponibles sur une cellule à l'échec | implicites (AD-1, AD-8) | Acceptable une fois E2 et E3 corrigés. |
| P9 : popovers natifs, rien appliqué à la fermeture extérieure | AD-7 | Coordination de la surface unique manquante (E3). |
| FR-03-05, FR-10-05 : ± révélés par appui, un champ actif | absent | E2, E3. |
| Migration des Copies en Séance | AD-4 | Lignes `RECOVERY` et trous de position (M4). |
| Lecture des données `NULL` antérieures à PRE-3 | AD-4 (matérialisation depuis les scalaires) | Sort du JSON nul après 010 et des scalaires incohérents (C1, E4). |
| Adaptateur v1 dans les Instantanés | AD-3 | Version ambiguë (M5). |
| Requête de liste « faits de durée par lot » | AD-3 (principe) | Le code lit déjà le JSON s'il est présent, sinon les scalaires (`SqliteSessionRepository.ts:1134-1145`). Le repli est à retirer. Un JSON corrompu fait échouer toute la liste (E4). |
| Q20, Q17 : cartes | AD-5 | Portée « cartes de Séance » erronée ; formateur non nommé (M6). |
| FR-17-04, FR-17-05 : matrice de test, oracle indépendant | AD-10 partiel | M7. |
| Q5 : version identifiable ; H6 : erreur de démarrage | Deferred partiel | M8. |
| Primitives natives, non-remplacement, garde-fous zéro `ScrollView` (AGENTS) | AD-7 | Repli Android des popovers indéfini (M2). Stepper existant non ratifié (E2). |

---

## Affirmations sur le code

### Vérifiées

- **Migrations :** `migration009.ts` est la dernière ; elles vont de 001 à 009.
- **Version :** `DATABASE_VERSION = 9` (`constants.ts:46`).
- **Transaction de migration :** transaction exclusive unique (`migrateDatabase.ts:57`) ; `PRAGMA user_version` écrit à la fin (`:146`).
- **CHECK composite de `migration004.ts` :** `DURATION` impose `duration_seconds` non nul entre 1 et 5999 ; `REPETITIONS` impose `repetition_count ≥ 1` ; `TO_FAILURE` impose les deux colonnes nulles. La branche `RECOVERY` est conservée.
- **Motif de reconstruction de 003 et 004 :** `defer_foreign_keys`, plus sauvegarde et restauration d'`activity_body_zones` (`migration004.ts:86`, `:233-260`).
- **`activity_definitions` :**
  - pas de CHECK composite ;
  - CHECK d'énumération incluant `TO_FAILURE` (`migration006.ts:21`) ;
  - ses tables filles sont en `ON DELETE CASCADE` (`migration006.ts:36`, `migration007.ts:125`).
- **Tables filles d'`activities` :** toutes en `ON DELETE CASCADE` (`migration008.ts:88`, `migration009.ts:44`). `session_stop_points` référence `sessions` seulement (`migration007.ts:134-140`). La suppression d'une occurrence n'orpheline donc aucun Point d'arrêt.
- **Glisser :** il repose sur le responder RN (`onResponderGrant/Move/Release`), avec des `accessibilityActions` (`ExecutionParametersSheet.tsx` vers `:925-957`).
- **Feuille :** `Modal` RN transparente, en fondu (`:362`).
- **Roulettes :**
  - `DurationWheelPicker` : props sans pas, sans borne basse et sans option échec (`:115-127`) ;
  - `WHEEL_SECONDS_STEP = 1`, partagé (`wheelPickerMath.ts:49`) ;
  - garde-fous zéro `ScrollView` iOS : `DurationWheelPicker.test.tsx:378` et `:619` ; `NumberWheelPicker` : `:267` (AGENTS.md cite les `it` englobants, `:371` et `:260`).
- **Scalaires dans `SqliteSessionRepository` :**
  - `assertSessionAggregateRow` reproduit le CHECK, `TO_FAILURE` compris (`:1205-1250`) ;
  - la liste lit les scalaires, et le JSON s'il est présent (`:1121-1145`).
- **Scalaires dans `compositionPresentation` :** `durationSeconds ?? 0` et `repetitionCount ?? 0` (`:280-288`) ; branches `TO_FAILURE` à `:272-278` et `:375-381` ; branche variable `:252-260`.
- **Arrondi des cartes de Séance :** `formatSessionSummary.ts:56-63` (`Math.ceil`, `≥` pour `lowerBound`).
- **Instantané :** `EXERCISE_SNAPSHOT_VERSION = 1` ; aucun import en production.
- **Opacité 0,45 :** constante locale de la Feuille, pas un jeton.
- **Popover :** aucun `Popover` utilisé dans `src/`.
- **Stack :** `package.json` et `package-lock.json` : expo ~57.0.16, react-native 0.86.2, react 19.2.3, `@expo/ui` 57.0.13, expo-sqlite ~57.0.1, expo-router ~57.0.16, expo-dev-client ~57.0.15, typescript ~6.0.3, jest-expo ~57.0.4.

### Fausses ou imprécises

- **« Motif en 12 étapes de 003/004 » appliqué à 010 :** **insuffisant.** Il omet `session_activity_media`, ajoutée en 009 (C2).
- **« Android et web gardent le motif de repli existant » pour les popovers :** **faux.** Il n'existe aucun repli de popover. Le repli réel est le segmenté en place et les roulettes `Legacy*` (M2).
- **« `ExecutionParameters.ts` est le seul module qui définit ces types » :** **état cible, pas état actuel.** Le type vient de `Session.ts:64` ; trois autres listes de modes existent (F1).
- **« Requêtes de liste passent par le JSON » :** **changement à faire, non ratification.** Le code retombe aujourd'hui sur les scalaires quand le JSON est nul (E4).
- **Omission plutôt qu'erreur :** la spine ne cite pas les composants ± acceptés (`ProfileStepper.tsx`, politiques de maintien, `steppedValue`). Le code les fournit pourtant (E2).
