---
title: 'Revue indépendante (grille) — spine d''architecture PRE-5 (delta)'
reviewed: '_bmad-output/pre5/planning-artifacts/architecture/architecture-kodjo-pre5-2026-10-19/ARCHITECTURE-SPINE.md'
parent: '_bmad-output/planning-artifacts/architecture/architecture-kodjo-pre4-2026-10-16/ARCHITECTURE-SPINE.md'
prd: '_bmad-output/pre5/planning-artifacts/prds/prd-kodjo-pre5-2026-10-19/prd.md'
code: 'src/ au commit 277296c6 (bmad/pre5-depuis-pre4), lecture seule'
date: '2026-10-19'
reviewer: 'relecteur indépendant (sous-agent), lecture seule hors de ce fichier'
---

# Revue du spine PRE-5 selon la grille

## Verdict

Le spine est solide. Il ratifie correctement l'essentiel du code, couvre les 45 FR et respecte les contraintes du projet : aucune migration modifiée, jetons inchangés, pas de troisième Mode, pas de Mixte persisté, `SegmentedControl` accepté conservé. Il **n'est pas encore prêt pour les épopées**. Six points de divergence de niveau **élevé** restent ouverts, ou sont tranchés d'une manière que le code ou le PRD contredit :

- la propagation des nouveaux champs et la constante de version ;
- la mémoire « À la cible » et l'affichage de la Condition d'arrêt ;
- la synchronisation entre le focus natif et la surface `keyboard` ;
- deux lignes segmentées dont l'état ne se déduit pas de la donnée ;
- la limite des étapes, contraire à FR-34 ;
- la réutilisation du tableau et l'éligibilité des phases à N = 1.

La revue ne relève aucun constat critique.

## Vérification des affirmations sur le code

Les affirmations suivantes ont été **vérifiées exactes** :

- **Bornes et versions** :
  - `EXECUTION_BOUNDS.durationTarget = { min: 5, max: 3535 }` à `EP:88` ;
  - `EXECUTION_PARAMETERS_VERSION = 2` à `EP:25` ;
  - `EXERCISE_SNAPSHOT_VERSION` et `parseExerciseSnapshot` sont dans `exerciseSnapshot.ts`, avec lecture v1 par `readV1` et v2 par `readV2` (l. 135).
- **Fonctions de `EP`** : `readV2`, `serializeV2`, `checkStructuralNumber`, `sameRowValue`, `alignRowsToBaseline`, `executionParametersEqual`, `cloneExecutionParameters`, `allTargetsFailure`, `hasFailureTarget`, `hasUnsetTarget`, `isBilateral`, `selectorOpeningPosition` (« — » ouvre sur `targetBounds(mode).min`) et `stepTarget` existent et se comportent comme décrit.
- **`migration010`** embarque son propre sérialiseur, `serialize` à la l. 344, avec `version: 2` écrit en dur. AD-4 n'est donc pas touché par le passage du domaine en v3.
- **Brouillon** : `targetsById`, `pendingRemoval`, `openSheetDraft`, `plain`, `requestedParameters`, `setVariable` (l'uniforme reprend la première ligne) et `commitSheetDraft` existent dans `Draft`.
- **Surfaces** :
  - `sheetSurface.ts` porte `popover(mode|side|order|regime)`, `selector(commonTarget|total|rowTarget)` et `stepper(…)` ;
  - `sheetCommandsAbsorbed` n'absorbe rien pour un `stepper`.
- **Feuille** :
  - `groupBox` et `variableGroupY` existent (`Sheet:593-595`, `:960-983`) ;
  - `ClosingSelector` sert Côté, Ordre, Régime et Mode ;
  - la Feuille est une `Modal` (`Sheet:1337`) ;
  - `SheetMotionScrollView` a déjà `keyboardShouldPersistTaps="handled"` (`Sheet:1391`).
- **Côtés** :
  - `SideModeControl.tsx` n'a aucun appelant de production : seul son test l'importe ;
  - `LedgerSide = "NONE" | "RIGHT" | "LEFT"` (`executionCalculations.ts:34`), dont l'ordre dépend de `RIGHT_LEFT` (l. 146).
- **Éditeur** :
  - `phasesRow` et `cardSeparator` sont dans `ActivityEditorForm.tsx` ;
  - `Terminer` est hors du `KeyboardAvoidingView` (l. 389-519, puis l. 521 et suivantes) ;
  - `formValueEquals` est dans `ExerciseScreen.tsx:192`.
- **Description** :
  - `INSTRUCTION_MAX_LENGTH = 1000` (`validation.ts:42`) est compté en points de code (`codePointLength`) ;
  - le CHECK `length(instruction) <= 1000` est à `migration010.ts:548`.
- **Autres** :
  - `PAUSE_GRID_VALUES` est dans `domain/preferences/Profile.ts` ;
  - `legacyModeConfinement.test.ts` existe ;
  - le dossier `src/domain/activities/__tests__/fixtures/` existe.
- **Tests de garde** : `DurationWheelPicker.test.tsx:371` et `NumberWheelPicker.test.tsx:260` contiennent bien les assertions « zéro `ScrollView` ». `ExecutionParametersSheet.test.tsx:1257` et `:1368` portent les tests du popover de Mode.
- **Stack** : les versions relevées dans `node_modules` sont exactes (expo 57.0.16, react-native 0.86.2, react 19.2.3, @expo/ui 57.0.13, reanimated 4.5.1, expo-sqlite 57.0.1, typescript 6.0.3, jest-expo 57.0.4). `automaticallyAdjustKeyboardInsets` (`ScrollView.d.ts:360`) et `InputAccessoryView` existent dans RN 0.86.2.

Les affirmations suivantes sont **inexactes ou incomplètes** ; elles sont détaillées dans les constats :

- **« `readV2` (grammaire inchangée) »** : `readV2` et `serializeV2` lisent et écrivent `EXECUTION_PARAMETERS_VERSION` (`EP:792`, `:731`). Passer cette constante à 3 casse les deux fonctions (E-1).
- **« extension de `targetsById` »** : la sémantique actuelle de `targetsById` (dernière Cible, `FAILURE` comprise, réécrite par `rememberCurrentTargets`) est incompatible avec une mémoire de la « dernière valeur `NUMBER` » (E-2).
- **`readV2` hors de `EP`** : `readV2` et `serializeV2` sont importés directement par cinq fichiers de tests d'infrastructure et deux de domaine, et pas seulement par « leurs tests ». La garde d'AD-18 doit les nommer (M-1).
- **`requestedParameters`** est privé (non exporté). Le test d'aller-retour d'AD-25 doit passer par `effectiveParameters` ou `commitSheetDraft`, ou exporter la fonction (F-1).
- **QP5-06** : `@expo/ui` 57.0.13 expose un modificateur générique `disabled` (`build/swift-ui/modifiers/index.d.ts:441`). L'affirmation « aucune API documentée pour une option désactivée » est trop forte, même si la conclusion (conserver `SegmentedControl`) reste juste : rien ne documente son effet par segment, ni le chevron, ni la police (F-2).

## Constats élevés

### E-1 — Propagation des nouveaux champs et constante de version : points de divergence non fixés (AD-18, AD-19, AD-20, AD-33)

**Constat.**

- **Constante de version.** `EXECUTION_PARAMETERS_VERSION` sert à quatre usages distincts :
  - le type du champ `version` du modèle (`EP:133`) ;
  - le contrôle de `validateForSave` (`EP:585`) ;
  - l'acceptation de `readV2` (`EP:792`) ;
  - la valeur écrite par `serializeV2` (`EP:731`).

  Le spine fixe la constante à 3, garde `readV2` « grammaire inchangée » et réserve `serializeV2` à la parité `serializeV2(readV2(sortie 010)) === sortie` (`migration010.test.ts:244-249`). Il ne dit pas qu'un littéral v2 distinct est nécessaire. Un développeur peut aussi bien faire accepter 3 à `readV2` que casser la parité.
- **Fonctions qui reconstruisent des séries.** AD-19 et AD-20 listent `executionParametersEqual`, `cloneExecutionParameters` et les constructeurs du Brouillon. Ils omettent les fonctions du domaine qui reconstruisent des séries champ par champ et perdraient `loadKg` ou `workPhases` :
  - `normalizeEffective` (`EP:342-354`), qui crée l'uniforme depuis la première ligne à N = 1 ;
  - `seriesRowsOf` (`EP:214-224`), qui développe l'uniforme sans `loadKg`, alors que la Phrase et la charge par ligne en dépendent ;
  - `createEmptyExecutionParameters` (`EP:884`) ;
  - `readV1` (l. 187 et 235) ;
  - `SessionDraft.ts:75` ;
  - `composition.ts` ;
  - `recoveryExecutionParameters` (`SqliteSessionRepository.ts:754`) ;
  - `testing/executionParametersFixtures.ts`.

  Avec des champs optionnels, une ligne v3 sans `loadKg` serait écrite (`JSON.stringify` omet `undefined`), puis rejetée par `readV3` strict : l'Exercice deviendrait illisible.
- **Contradiction dans AD-33.** La Story 1 doit rester « atomique, trois contrôles verts, aucune interface ». Or des champs obligatoires imposent de toucher `Draft` (`plain`, `requestedParameters`), `SessionDraft` et les tests d'interface dès cette story, alors qu'AD-33 place le Brouillon en story 2.

**Correctif proposé.**

- Dans AD-18 :
  - déclarer `EXECUTION_PARAMETERS_V2 = 2` (littéral privé de `EP`), utilisé par `readV2` (acceptation) et `serializeV2` (écriture) ;
  - garder `EXECUTION_PARAMETERS_VERSION = 3` pour le modèle, `validateForSave` et l'écrivain v3.
- Dans AD-19 et AD-20 :
  - déclarer `loadEnabled`, `loadKg` et `workPhases` **obligatoires** (non optionnels) dans les types, pour que `tsc` serve de garde ;
  - lister `normalizeEffective`, `seriesRowsOf` (qui recopie `loadKg`), `createEmptyExecutionParameters`, `readV1`, `SessionDraft`, `composition.ts`, `recoveryExecutionParameters` et les fixtures.
- Dans AD-33 : intégrer à la Story 1 l'« adaptation mécanique » de ces constructeurs, Brouillon compris (valeurs neutres : `loadKg: 0`, `workPhases: []`, sans nouvelle transition). La story 2 garde les transitions nouvelles.

### E-2 — Condition d'arrêt : mémoire « À la cible » et affichage en identiques non définis de façon applicable (AD-23)

**Constat.**

- **Mémoire.** AD-23 place la « dernière valeur `NUMBER` » dans une « extension de `targetsById` ». Or :
  - `targetsById[id][mode]` mémorise la Cible courante, `FAILURE` compris ;
  - `rememberCurrentTargets` l'écrase à chaque `setMode`, `setVariable` ou `setSeriesCount` ;
  - `setUniformTarget` ne mémorise rien.

  Deux séquences le montrent :
  - **30 s, puis 40 s, puis À l'échec, puis À la cible** : la mémoire contient 30 (la valeur d'ouverture), pas 40 ;
  - **30 s, puis À l'échec, puis changement de Mode aller-retour, puis À la cible** : la mémoire contient `FAILURE`.

  FR-19 n'est alors pas tenu, et deux stories peuvent l'implémenter différemment.
- **Affichage.** `stopConditionOf` renvoie `INCOMPLETE` pour une Cible commune `UNSET`. Or, en identiques, FR-19 veut « À la cible par défaut » : un Exercice neuf a un Mode `null` et une Cible `UNSET`. La Rule « La Feuille l'affiche » ne dit pas si l'identiques lit `stopConditionOf` ou la Cible commune.
- **Cas non décidés** :
  - le rendu du résultat `INCOMPLETE` en variables (aucune option sélectionnée ? D-384 ?) ;
  - le cas N = 1 avec Variables demandé : l'effectif est uniforme ; s'agit-il d'une entrée ou d'un résultat dérivé ?
  - le Mode `null`, pour lequel `rememberCurrentTargets` ne mémorise rien.

**Correctif proposé.**

- **Mémoire.** Ajouter au Brouillon un champ distinct, `lastNumberTargetById: Record<id, Partial<Record<ExecutionMode, number>>>`. Toute transition qui remplace une Cible `NUMBER` le met à jour (`setUniformTarget`, `setRowTarget`, Condition d'arrêt, `setMode`). `targetsById` et H27 restent inchangés.
- **Affichage**, dans AD-23 :
  - en identiques **effectif**, Cible commune `FAILURE` ⇒ À l'échec, sinon À la cible, `UNSET` compris ;
  - `stopConditionOf` ne sert qu'en variables effectives (N ≥ 2) ;
  - `INCOMPLETE` s'affiche avec deux options, aucune sélectionnée, en lecture seule ; ou bien la question QN-2 est complétée sur ce rendu.
- **Mode `null`** : définir le cas (Condition d'arrêt indisponible tant que le Mode n'est pas choisi, ou mémoire différée).

### E-3 — Focus natif et surface `keyboard` : la synchronisation dans les deux sens n'est pas décidée (AD-26, AD-27)

**Constat.**

- **Sens surface → focus.** AD-27 veut qu'un toucher sur une autre surface « ferme le champ et ouvre l'autre dans le même geste ». Avec `keyboardShouldPersistTaps="handled"`, qui existe déjà, un toucher sur une autre cellule **ne retire pas** le focus du `TextInput` : le clavier reste ouvert pendant qu'un panneau de roue s'ouvre. Rien n'impose `blur()` quand le réducteur quitte `keyboard`.
- **Sens focus → surface.** Rien n'impose non plus qu'un `onBlur` d'origine système (fermeture du clavier par iOS, démontage d'une ligne, ✕ de la Feuille) émette `close` vers le réducteur. Le fond de la cellule active, « dérivé de la surface `keyboard` », peut donc survivre à un clavier fermé.
- **Précédent / Suivant.** `focus()` est programmatique. Le spine n'ordonne pas cet appel par rapport au `touch` du réducteur.
- **Première activation de la charge** (FR-12, FR-14 : « la saisie s'ouvre ») : le champ qui reçoit le focus en variables n'est pas fixé.

Deux stories (essai NFR-6, puis généralisation) peuvent résoudre ces points différemment.

**Correctif proposé.** Ajouter à AD-27 une règle de synchronisation unique, implémentée en un seul endroit (un hook de la Feuille, par exemple `useKeyboardSurface`) :

1. `onFocus` d'un `KeyboardField` émet `touch(keyboard(field))`.
2. `onBlur` émet `close(key)` si la surface ouverte est encore ce champ ; la valeur est appliquée avant `close`.
3. Tout passage du réducteur de `keyboard` à une autre surface, ou à `none`, appelle `blur()` sur la référence du champ.
4. Précédent / Suivant : appliquer la valeur, émettre `touch` vers le voisin, puis appeler `focus()`.
5. Première activation : focus sur `uniform` en identiques, sur la première ligne de `loadFieldOrder` en variables.

Ratifier aussi `keyboardShouldPersistTaps="handled"` (`Sheet:1391`), sur lequel repose la règle du « même geste ». Ajouter ces lignes à la table de transitions héritée d'AD-15, qui porte les T1 à T27.

### E-4 — Deux lignes segmentées dont l'état affiché ne se déduit pas de la donnée (AD-24, AD-26)

**Constat.**

- **Charge commune.** FR-12 : « une fois saisie, la valeur remplace Avec, par exemple « 20 kg », et reste éditable ». AD-24 range la Charge parmi les segmentés `inline`. AD-26 dit que `KeyboardField` « sert la ligne Charge commune ». Le spine ne dit pas comment une option d'un `SegmentedControl` devient un champ texte : `TextInput` dans l'option, ou option remplacée par un `KeyboardField` hors du segmenté. C'est un point de divergence direct entre la story `SegmentedControl` et la story `KeyboardField`. Le placement du `nativeID` de l'accessoire et l'ordre `loadFieldOrder` en dépendent.
- **Cadence.** `cadenceOptionOf(value)` fait correspondre 0, 1, 2 et 5 à Sans, 1 s, 2 s et 5 s, et toute autre valeur à Autre. Le spine ne dit pas ce que fait un toucher sur « Autre » quand la valeur vaut 0, 1, 2 ou 5 : l'affichage, dérivé de la valeur, revient aussitôt sur l'option fixe. Il faut soit modifier la valeur (laquelle ?), soit tenir un état d'interface « Autre révélé ». La décision 8 de Hermann ne le tranche pas.

**Correctif proposé.**

- **Charge** : fixer dans AD-24 et AD-26 la composition de la ligne Charge commune. Par exemple : segmenté `inline` Avec / Sans, et sous Avec, un `KeyboardField` qui occupe la place de l'option « Avec » (la largeur de l'option est conservée), seul porteur de l'accessoire.
- **Cadence** : décider que « Autre » révèle le ± par un état d'interface de la Feuille, hors Brouillon, réinitialisé à la fermeture, sans changer la valeur. L'option affichée reste `cadenceOptionOf(value)`, sauf pendant cette révélation. Sinon, inscrire la question à Hermann dans « Questions ouvertes », avec un défaut.

### E-5 — Limite des étapes : la Rule contredit FR-34 et la décision « refusée » (AD-22, QN-1)

**Constat.**

- **Comptage.** FR-34 dit explicitement : « la limite de 1 000 caractères porte sur l'ensemble des textes des étapes, numérotation exclue ». AD-22 fixe au contraire la limite sur la chaîne encodée, séparateurs compris. Il classe la question QN-1 « Bloque : Non ». Une Rule qui contredit une exigence du PRD sans décision de Hermann doit au minimum bloquer la story concernée. Par ailleurs, la conséquence annoncée (« une `migration011` relâchant le CHECK devient nécessaire ») n'est pas la seule voie : un encodage sans séparateur compté reste impossible dans la colonne, mais la limite de saisie pourrait être fixée à 1000 − (n − 1).
- **Saisie à la limite.** La décision 7 de Hermann dit : « toute saisie supplémentaire est refusée ». AD-22 écrit : « l'ajout est tronqué à la limite ». Un collage partiellement accepté n'est pas un refus.

**Correctif proposé.**

- Passer QN-1 à « Bloque : story Description ». Présenter à Hermann les trois options, avec leur coût :
  - (a) limite sur la chaîne encodée ;
  - (b) limite sur les textes, plus une `migration011` ;
  - (c) limite sur les textes plafonnée par le CHECK, avec un refus explicite au-delà.
- Remplacer « tronqué » par « refusé en entier » (collage compris), ou soumettre la troncature à Hermann.

### E-6 — Tableau des phases : réutilisation et éligibilité non fixées (AD-20, AD-27, AD-28)

**Constat.**

- **Réutilisation.** FR-4 exige que le tableau des phases réutilise les gestes et les alternatives accessibles du tableau des séries. Le code les porte dans des composants internes de `Sheet` : `DraggableRow` (l. 2031), `RemoveRowButton` (l. 1997), `dragDestination` et `tableRowIdentity` (exportés), et `VariableTable` (l. 1825), qui est spécialisé. Le spine ne décide ni d'extraire ces briques, ni de les dupliquer. La story « tableau des phases » et la story « cellules sans ± » (R-05) toucheront donc les mêmes composants sans règle commune. Le fichier `Sheet` compte déjà 2 641 lignes.
- **Bandeau d'annulation.** Son texte et son mécanisme pour une phase ne sont pas fixés (« Phase supprimée — Annuler » ? même composant ?).
- **Éligibilité.** AD-20 rend les phases éligibles en « séries identiques ». Or, à N = 1 avec Variables **demandé**, l'effectif est uniforme : `normalizeEffective` produit une `UNIFORM` à partir de la première ligne, sans `workPhases`. Si l'éligibilité lit l'effectif, des phases créées seraient perdues par `requestedParameters`, qui produit `VARIABLE`.

**Correctif proposé.**

- **Dans AD-27 ou AD-28** :
  - décider l'extraction de `DraggableRow`, `RemoveRowButton` et du bandeau d'annulation dans un module de la feature, par exemple `src/features/activities/sheetTable.tsx`, paramétré par la hauteur de ligne et le libellé ;
  - les faire réutiliser par `VariableTable` et `WorkPhasesTable` (nouveau fichier) ;
  - fixer la clé de lexique du bandeau des phases.
- **Dans AD-20** : l'éligibilité aux phases se lit sur l'état **demandé** du Brouillon : `!draft.variable`, Mode `DURATION` et Cible commune non `FAILURE`.

## Constats moyens (7)

- **M-1 — Garde de `serializeV2` et `readV2` (AD-18).**
  - Constat : « hors de `EP`, de leurs tests et de `readExecutionParameters` » ne dit pas quoi faire des sept fichiers de tests qui importent directement ces fonctions : `SqliteActivityDefinitionRepository.test.ts`, `SqliteSessionRepository.test.ts`, `copiesAndSnapshots.story13.test.ts`, `preservation.story14.test.ts`, `migration010.test.ts`, `ExecutionParameters.test.ts` et `ExecutionParametersDraft.test.ts`.
  - Correctif : nommer la liste blanche (tests de parité `migration010` et tests de `EP`) et exiger que les autres tests passent par `readExecutionParameters` et `serializeExecutionParameters`.
- **M-2 — Moment de `normalizeLoad` (AD-19, AD-23, AD-25).**
  - Constat : `normalizeLoad` est appelé par `setLoadValue` (AD-19), après `setVariable(false)` (AD-23) et au ✓ (AD-25). Rien n'est dit pour `removeRow`, `setSeriesCount` (ligne positive masquée) ou `undoRemoval`. L'affichage en cours d'édition (Sans, ou Avec avec toutes les valeurs à 0) peut donc diverger entre stories.
  - Correctif : fixer une règle unique. Par exemple, `normalizeLoad` s'applique après **toute** transition qui change les lignes actives, et au ✓.
- **M-3 — Famille de la surface `keyboard` (AD-27).**
  - Constat : AD-27 dit que `keyboard` « suit la famille des champs ± » et, dans la même Rule, qu'il absorbe ✓ et ✕. C'est l'inverse de T19 pour les champs ±.
  - Correctif : déclarer `keyboard` comme quatrième famille, avec ses lignes propres dans la table T d'AD-15 (toucher d'une autre surface, appui extérieur, ✓ et ✕ de la Feuille, `Annuler` du retrait, glisser pendant la saisie).
- **M-4 — Phrase, charges variables égales (AD-29).**
  - Constat : en `VARIABLE` avec des charges toutes égales, la forme n'est pas fixée : « (charge : 20 kg) » ou « (charges : 20, 20, 20 kg) » ? FR-42 dit seulement qu'une charge commune n'est pas présentée quand les séries diffèrent.
  - Correctif : fixer la forme (le régime décide, `UNIFORM` donne « charge », `VARIABLE` donne « charges ») et ajouter un cas au corpus.
- **M-5 — Sort de `SideModeControl.tsx` et des clés (AD-21, AD-32).**
  - Constat : AD-32 retire les clés anatomiques (`shared.sideMode.*`) dont dépendent `SideModeControl.tsx` et son test, ainsi que `shared/i18n/index.test.ts:460-504`. « Non étendu » ne dit pas s'il est supprimé.
  - Correctif : décider la suppression du composant sans appelant et de son test dans la story du lexique, ou garder ses clés.
- **M-6 — Primitive de saisie des étapes (AD-22).**
  - Constat : trois choix ne sont pas fixés :
    - un `TextInput` par étape, monoligne ou multiligne ;
    - la détection d'Entrée (`onSubmitEditing` et `submitBehavior`, ou `onKeyPress`) ;
    - le suivi de la sélection pour `splitStepAt`, et le Retour arrière sur une étape vide.

    Le comportement d'un collage multiligne dans un champ monoligne iOS diffère aussi : les sauts de ligne peuvent y être perdus avant `insertPastedText`.
  - Correctif : fixer la primitive (un `TextInput` `multiline` par étape, avec `submitBehavior="submit"` et `onSelectionChange`), ou prévoir un essai précoce sur iPhone comparable à NFR-6.
- **M-7 — Enveloppe opérationnelle incomplète (Deferred).**
  - Constat : Deferred traite le déploiement, mais pas trois points :
    - **performances** : jusqu'à 99 `KeyboardField` dans le tableau variable, plus l'accessoire et le défilement calculé, dans une `Modal` animée ;
    - **comportement visible** d'une `ExecutionParametersDataError` sur une ligne v3 malformée, ou au retour arrière (écran d'erreur ? liste du Catalogue entière en échec ?) ;
    - **séparateur décimal** accepté par `parseLoadText` (« , » seulement, ou « , » et « . », par exemple au collage).
  - Correctif : décider ces trois points, ou les différer explicitement avec leur effet.

## Constats faibles (10)

- **F-1** — Le test « `requestedParameters(openSheetDraft(p))` = `p` » d'AD-25 vise une fonction privée. Passer par `effectiveParameters` (N ≥ 2) ou `commitSheetDraft`, ou exporter la fonction.
- **F-2** — QP5-06 : nuancer l'affirmation. Un modificateur `disabled` générique existe dans `@expo/ui` ; son effet par segment n'est pas documenté. La conclusion est inchangée.
- **F-3** — C-2 doit aussi citer AD-7 (« la roulette de Cible Durée… 5..3535 ») et AD-15 (T3 : « 00:05 »), que D-430 amende.
- **F-4** — AD-33 : la Story 1, « aucune interface », inclut AD-31. Les tests de la Feuille qui attendent 00:05 changent dans cette story ; le dire.
- **F-5** — `commitSheetDraft` doit recevoir `defaultLabel` (AD-20, AD-25) : fixer la nouvelle signature, appelée par la Feuille.
- **F-6** — `readV3` : préciser qu'il vérifie aussi le contrôle structurel de la charge (fini, ≥ 0, multiple de 0,25) et l'unicité des `id` de phase, comme `validateForSave`.
- **F-7** — FR-14, valeur négative : AD-19 dit où la règle vit (`setLoadValue`), mais pas ce qu'elle fait (refus, valeur absolue, 0 ?). Le clavier `decimal-pad` iOS n'a pas de signe moins, mais un collage en a un.
- **F-8** — Le comptage de la limite des étapes doit utiliser `codePointLength` (`validation.ts`) et non `maxLength` du `TextInput`, qui compte en unités UTF-16. À écrire dans AD-22.
- **F-9** — Contrôle d'ajout d'une phase (FR-5, `NON VÉRIFIABLE`) : préciser qu'il n'ouvre aucune surface et qu'il est indisponible à 6. Préciser aussi son nom accessible.
- **F-10** — Comportement du libellé de phase (clavier texte) quand Précédent / Suivant d'un champ de charge est utilisé : ces champs sont exclus de `loadFieldOrder`. Le dire, pour éviter qu'une story les y inclue.

## Grille

| Critère | Résultat |
|---|---|
| Vrais points de divergence fixés, aucun oublié | Partiel. E-1, E-2, E-3, E-4 et E-6 sont des points de divergence non fixés ; M-2, M-3 et M-6 aussi, à moindre portée. |
| Rules applicables et efficaces | Majoritairement. AD-23 (mémoire) et AD-27 (famille `keyboard`) ne sont pas applicables telles quelles. |
| Deferred sans risque de divergence | Oui pour les éléments listés. L'enveloppe opérationnelle est incomplète (M-7). |
| Technologie vérifiée à jour | Oui : toutes les versions sont exactes. Nuance sur QP5-06 (F-2). |
| Ratifie le code au lieu de le contredire | Oui dans l'ensemble. Deux affirmations sont inexactes : `readV2` « inchangé » et l'extension de `targetsById` (E-1, E-2). |
| Couvre les capacités du PRD | Oui : les FR-1 à FR-45 sont tous rattachés. FR-34 est couvert par une règle contraire (E-5). |
| Aucun AD n'affaiblit un AD hérité sans conflit déclaré | Oui. C-1 à C-5 sont déclarés ; C-2 est à compléter (F-3). La surface `keyboard`, qui absorbe ✓ et ✕, s'écarte de T19 sans conflit déclaré (M-3). |
| Dimensions de l'altitude décidées, différées ou en question | Partiel : Cadence « Autre », composition de la ligne Charge, saisie des étapes, enveloppe opérationnelle. |
| Contraintes du projet | Respectées : aucune migration modifiée (`migration010` a son propre sérialiseur), jetons inchangés, aucun troisième Mode, aucun Mixte persisté, primitives natives d'abord (`InputAccessoryView`, roues), `SegmentedControl` accepté conservé. Une `migration011` n'est envisagée que dans une option de QN-1. |
