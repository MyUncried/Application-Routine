# Revue « reality check » — Architecture Spine PRE-5 (delta)

- **Objet :** `ARCHITECTURE-SPINE.md` (2026-10-19, statut draft).
- **Lentille :** chaque décision engagée a-t-elle été confrontée au dépôt, à `node_modules` ou à la documentation en ligne, plutôt qu'affirmée de mémoire ?
- **Méthode :** lecture de `node_modules` du clone `C:\Dev\KODJO-BMAD-PRE5` (HEAD `277296c6`), du code natif iOS de React Native 0.86.2 (Fabric), de `react-native-reanimated` 4.5.1 et de `@expo/ui` 57.0.13 ; reactnative.dev/docs/inputaccessoryview ; docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/picker/ ; recherche des symboles cités dans `src/`.
- **Lecture seule**, sauf ce fichier.

## Verdict

Le spine est bien ancré dans le dépôt : versions, symboles et lignes cités sont exacts. Une affirmation technique décisive reste cependant fausse : le partage d'un seul `InputAccessoryView` par `nativeID` entre plusieurs `TextInput`. La documentation l'annonce, mais l'implémentation Fabric de React Native 0.86.2 ne le réalise pas. AD-26 doit être corrigé avant la story d'essai NFR-6. Deux autres points demandent une précision : le défilement au focus et le séparateur décimal.

## 1. Table Stack : confirmée

| Paquet | Spine | `node_modules` | `package.json` |
|---|---|---|---|
| expo | 57.0.16 | 57.0.16 | `~57.0.16` |
| react-native | 0.86.2 | 0.86.2 | `0.86.2` |
| react | 19.2.3 | 19.2.3 | `19.2.3` |
| @expo/ui | 57.0.13 | 57.0.13 | `~57.0.13` |
| react-native-reanimated | 4.5.1 | 4.5.1 | `4.5.1` |
| expo-sqlite | 57.0.1 | 57.0.1 | `~57.0.1` |
| typescript | 6.0.3 | 6.0.3 | `~6.0.3` |
| jest-expo | 57.0.4 | 57.0.4 | `~57.0.4` |

Aucun écart. Les plages `~` admettent un correctif ; la mention « aucune montée de version dans PRE-5 » suffit, à condition de ne pas relancer `npm install` sans verrou.

Remarque mineure : le front matter cite `HEAD 52382b04`. Le HEAD réel est `277296c6`. Les deux portent le même contenu de `src/` et `app/`, identique à `1116586b` (vérifié par `git diff --quiet`). L'affirmation tient, mais il faut citer le HEAD réel ou préciser que `52382b04` désigne la base du code.

## 2. `InputAccessoryView` partagé : affirmation fausse sous la nouvelle architecture (gravité haute)

**Ce qu'affirme AD-26 :** « un seul `InputAccessoryView` (`nativeID` partagé) rendu dans la Feuille, relié par `inputAccessoryViewID` aux seuls champs de charge ».

**Documentation :** reactnative.dev indique que le `nativeID` associe le composant à « specified TextInput(s) ». La page reste muette sur la nouvelle architecture et sur `Modal`. Ses limites connues sont #18997 (multiligne) et #20157 (barre d'onglets).

**Code réel exécuté** (RN 0.86.2, Fabric, seule architecture d'Expo SDK 57), `node_modules/react-native/React/Fabric/Mounting/ComponentViews/InputAccessory/RCTInputAccessoryComponentView.mm` :

```objc
- (void)didMoveToWindow {
  if (self.window && !_textInput) {
    if (self.nativeId) {
      _textInput = RCTFindTextInputWithNativeId(self.window, self.nativeId);
      _textInput.inputAccessoryView = _contentView;
```

- `RCTFindTextInputWithNativeId` renvoie le **premier** champ trouvé dans l'arbre de la fenêtre, et l'accessoire ne s'attache qu'à lui.
- La recherche ne se fait **qu'une fois**, quand l'accessoire entre dans la fenêtre (`!_textInput`). Un champ monté ensuite ne reçoit pas la barre : par exemple après un passage de Sans à Avec, ou après l'ajout d'une série ou d'une ligne variable.
- Côté `RCTTextInputComponentView.mm` (`setDefaultInputAccessoryView`), un champ qui porte un `inputAccessoryViewID` renonce à la barre par défaut et ne cherche lui-même aucun accessoire.

**Conséquences pour PRE-5 :**

1. **Tableau variable :** seule la première cellule de charge aurait la barre Précédent / Suivant / Fermer. Les autres n'auraient aucune barre, et pas même le bouton « Done » par défaut, puisque l'identifiant le désactive. Le clavier `decimal-pad` n'ayant pas de touche Retour, ces champs ne pourraient plus se fermer que par un appui extérieur.
2. **Feuille ouverte sous Sans :** aucun champ de charge n'existe au montage, donc aucune barre pour toute la durée de la Feuille.
3. Le repli d'AD-26 ne couvre que le cas où l'accessoire ne s'afficherait pas dans la `Modal`. Il ne couvre pas ce défaut, qui est certain et ne dépend pas de la `Modal`.

**Correctif demandé :**

- Remplacer dans AD-26 « un seul `InputAccessoryView` (`nativeID` partagé) » par : **un `InputAccessoryView` par champ de charge, avec un `nativeID` propre** (dérivé de l'identité de la ligne ou de `uniform`), rendu **après** son `TextInput` dans le même parent, monté et démonté avec lui. Le contenu de la barre reste un seul composant React (`LoadAccessoryBar`), et `loadFieldOrder(draft)` reste l'unique source de l'ordre.
- Une autre voie existe : remonter (par `key`) l'accessoire à chaque changement de champ actif. Elle est fragile, car l'accessoire doit être attaché **avant** `becomeFirstResponder`, et l'accessoire Fabric n'appelle pas `reloadInputViews`. Elle est à écarter.
- Le scénario de l'essai NFR-6 (AD-26, AD-33) doit vérifier explicitement :
  - au moins trois champs de charge en variables, avec la barre sur chacun ;
  - un champ ajouté après l'ouverture (ajout de série) ;
  - le passage de Sans à Avec pendant que la Feuille est ouverte ;
  - Précédent / Suivant, clavier ouvert, d'un champ à l'autre ;
  - la présence dans la `Modal`.
- Ajouter la source `RCTInputAccessoryComponentView.mm` (RN 0.86.2) aux `sources` du spine.

**`Modal` :** aucune documentation ne traite ce cas. D'après le code, la recherche part de `self.window`. Or la `Modal` Fabric présente un contrôleur dans la même fenêtre, si bien que le champ devrait être trouvé. Ce raisonnement n'est **pas confirmé sur appareil** ; l'essai NFR-6 reste nécessaire, et le spine a raison de le prévoir.

## 3. `automaticallyAdjustKeyboardInsets` et `Reanimated.ScrollView` (gravité moyenne)

**Transmission : confirmée.**

- `SheetMotionScrollView` (`src/features/activities/SheetMotion.tsx:212`) transmet tous ses props : `<Reanimated.ScrollView {...props} ref={ref} layout={motion.layout} />`.
- `react-native-reanimated/src/component/ScrollView.tsx` (4.5.1) est `createAnimatedComponent(ScrollView)` de React Native. Il ne retire aucun prop et n'ajoute que `scrollEventThrottle = 1` par défaut.
- Le prop existe dans RN 0.86.2 : `ScrollView.d.ts:360`, et il est géré par Fabric (`RCTScrollViewComponentView.mm`, `_keyboardWillChangeFrame`).

**Point non traité par le spine :** sous Fabric, `automaticallyAdjustKeyboardInsets` ne se limite pas à l'inset. À chaque `keyboardWillChangeFrame`, il **décale lui-même `contentOffset`** pour amener le champ focalisé juste au-dessus du clavier (`firstResponderFocus`, `contentDiff = keyboardEndFrame.origin.y - focusEnd`), sans marge. AD-26 ajoute « au focus, un défilement calculé […] avec une marge de 12 ». On obtient donc deux défilements concurrents à l'ouverture du clavier : le natif, animé avec la courbe du clavier, et celui de JS. Il faut s'attendre à un saut ou à une position finale imprévisible. À l'inverse, pour Précédent / Suivant, le cadre du clavier ne change pas : la notification n'arrive pas, et seul le défilement de JS agit.

**Correctif demandé :** préciser dans AD-26 qui fait autorité.

- Recommandation : le défilement calculé de JS, déclenché **après** `keyboardDidShow` à l'ouverture, et immédiatement lors de Précédent / Suivant. Il prend en compte la hauteur clavier plus accessoire, la marge de 12 et la tentative de garder le tableau visible.
- Ou bien le défilement natif seul, en renonçant à la marge de 12 et à la règle « autant que possible le tableau ».
- Ajouter ce cas à l'essai NFR-6.

**Réglage d'accessibilité :** avec « Préférer les transitions en fondu », Fabric remet `contentOffset` et l'inset à 0 si le clavier est rapporté avec une hauteur nulle (même fichier). C'est un cas à prévoir dans la recette.

## 4. `TextInput` `keyboardType="decimal-pad"` (gravité basse à moyenne)

- `'decimal-pad'` figure dans `TextInput.d.ts:30` et est géré sous iOS. Confirmé.
- `inputAccessoryViewID` (`TextInput.d.ts:989`) et `inputAccessoryViewButtonLabel` (`:995`) existent. Confirmé.
- **Non confirmé dans le spine :** sous iOS, la touche décimale de `decimal-pad` suit la **région de l'appareil**, pas la langue de l'application. Un iPhone réglé sur une région anglophone affiche « . ». AD-19 prévoit `parseLoadText` « séparateur de la langue », ce qui ferait rejeter « 12.5 » comme illisible, donc 0, donc une série sans charge. **Correctif :** `parseLoadText` accepte « , » **et** « . » comme séparateur décimal, quelle que soit la langue ; `formatLoadKg` garde le séparateur du français. Ajouter un cas de test pour chacun.
- **Rappel :** `maxLength` de `TextInput` compte en unités UTF-16, pas en points de code. Cela n'a pas d'effet sur la charge ni sur le libellé limité à 20 avec du texte courant. Mais un emoji compte pour 2 et réduit la limite de 20 libellés. La validation `labelMaxLength: 20` doit utiliser la même mesure que le champ, sinon un libellé accepté par le champ pourrait être refusé par la validation, ou l'inverse. À préciser dans AD-20 (même remarque pour les étapes, voir §6).

## 5. `@expo/ui` 57.0.13 : `Picker` et `pickerStyle('segmented')`, confirmé

- `node_modules/@expo/ui/build/swift-ui/modifiers/pickerStyle.d.ts` : `PickerStyleType` comprend `'segmented'`. `Picker/index.d.ts` documente `<Picker modifiers={[pickerStyle('segmented')]}>`.
- La page docs.expo.dev v57 (SDK 57, branche `sdk-57`) existe. Elle montre l'exemple segmenté et ne mentionne ni option désactivée, ni police par option.
- **Nuance :** il existe dans `@expo/ui` un modificateur générique `disabled` (`modifiers/index.d.ts:441`, `View.disabled` de SwiftUI), ainsi qu'un modificateur de police. Le spine dit vrai (« aucune API **documentée** pour une option désactivée… »), mais rien ne montre que ces modificateurs ont été essayés sur un `Text` enfant. En SwiftUI, un segmenté ne garantit pas de les respecter option par option. La conclusion (conserver `SegmentedControl`) tient. Pour être complet, ajouter une phrase : « `disabled` et la police appliqués à un `Text` enfant ne sont pas documentés pour un segment et n'ont pas été essayés ».

## 6. Noms de code du dépôt : tous présents

| Symbole cité | Emplacement vérifié | Conforme |
|---|---|---|
| `EXECUTION_BOUNDS.durationTarget.min = 5` (`EP:88`) | `ExecutionParameters.ts:88` `{ min: 5, max: 3535 }` | oui |
| `EXECUTION_PARAMETERS_VERSION` | `ExecutionParameters.ts:25`, valeur 2 | oui |
| `readV2`, `serializeV2` | `:778`, `:717` (exportés) | oui |
| `checkStructuralNumber` (entier) | `:464`, privé, refuse un non-entier (`NOT_INTEGER`) | oui |
| `sameRowValue`, `alignRowsToBaseline` | `:387` (privé), `:412` | oui |
| `executionParametersEqual`, `cloneExecutionParameters` | `:899`, `:937` | oui |
| `allTargetsFailure`, `hasFailureTarget`, `hasUnsetTarget`, `isBilateral` | `:226` à `:240` | oui |
| `selectorOpeningPosition`, `stepTarget` | `:273`, `:324` | oui |
| `setVariable` | `ExecutionParametersDraft.ts:315` | oui |
| `targetsById` | `ExecutionParametersDraft.ts:109`, `:143` | oui |
| `plain` (sans `loadKg`) | `ExecutionParametersDraft.ts:178` | oui |
| `openSheetDraft`, `commitSheetDraft`, `pendingRemoval` | `Draft:132`, `:621` | oui |
| `LedgerSide` | `executionCalculations.ts:34` : `"NONE" \| "RIGHT" \| "LEFT"` (le passage à l'ordinal est bien un changement à faire) | oui |
| `sheetCommandsAbsorbed` | `sheetSurface.ts:158` (popover ou selector seulement ; l'extension à `keyboard` est à faire) | oui |
| `EXERCISE_SNAPSHOT_VERSION`, `parseExerciseSnapshot`, `readV1` | `exerciseSnapshot.ts:29` (= 2), `:116` ; `readV1.ts:251` | oui |
| `DATABASE_VERSION = 10` | `infrastructure/database/constants.ts:53` | oui |
| `INSTRUCTION_MAX_LENGTH`, `codePointLength` | `domain/sessions/validation.ts:42` (1000), `:76` (`Array.from(value).length`), appliqués à `:375` | oui |
| CHECK `length(instruction) <= 1000` | `migration010.ts:548` (aussi dans 001, 003, 004) | oui |
| `legacyModeConfinement.test.ts` | `src/domain/activities/__tests__/` | oui |
| `DurationWheelPicker.test.tsx:371`, `NumberWheelPicker.test.tsx:260` | tests « primitive native, jamais un `ScrollView` » | oui |
| `Sheet.test.tsx:1257`, `:1368` | `ExecutionParametersSheet.test.tsx` : popover natif du Mode (1257), un seul `Popover` et une seule `Modal` (1368) | oui (nom de fichier abrégé) |
| `SheetMotionScrollView`, `groupBox`, `variableGroupY`, `ClosingSelector`, `DisclosureControl`, `InlineStepper`, `AnchoredPanel`, `failureOption`, `phasesRow`, `cardSeparator`, `withProfilePhases`, `PAUSE_GRID_VALUES`, `SideModeControl`, corpus `phrases-276` / `attendus-phrases-276` | présents | oui |

**Remarques sur la limite des étapes (AD-22) :**

- SQLite `length()` sur du TEXT compte des caractères, soit des points de code. Cette mesure est cohérente avec `codePointLength`. La garantie « encodée ≤ 1000 points de code ⇒ CHECK respecté » est donc correcte.
- `normalizeInstruction` (`validation.ts:91`) se contente de `trim()` : les `\n` internes de la chaîne encodée sont conservés. Le codec est compatible avec la validation existante. Attention : le commentaire de la ligne 80 décrit `normalizeName`, pas `normalizeInstruction`.
- **Risque :** l'Éditeur borne aujourd'hui la Description par `maxLength={INSTRUCTION_MAX_LENGTH}` (`ActivityEditorForm.tsx:419`), donc en UTF-16. Avec plusieurs champs d'étape, le spine prévoit une troncature « à la limite » calculée sur la chaîne encodée. Il faut préciser que ce calcul se fait en points de code par le codec (`instructionSteps.ts`), et non par `maxLength` de chaque champ. Sinon, deux mesures différentes produiraient une troncature incohérente avec les emoji.

## 7. Autres affirmations vérifiées

- **Nouvelle architecture :** aucun drapeau `newArchEnabled` dans `app.json` ; avec RN 0.86 et Expo SDK 57, Fabric est la seule voie. L'analyse du §2 s'applique donc.
- **`Modal` de la Feuille :** `ExecutionParametersSheet.tsx:1337`, `<Modal transparent visible animationType="fade">`. Le corps défilant est bien `SheetMotionScrollView` (`:1387`), déjà doté de `keyboardShouldPersistTaps="handled"`, ce qui convient aux boutons de la barre et aux cellules voisines.
- **`KeyboardAvoidingView` de l'Éditeur** (AD-30) : présent dans `ActivityEditorForm.tsx`, conforme.

## Synthèse des correctifs

| # | Gravité | AD | Correctif |
|---|---|---|---|
| 1 | Haute | AD-26, AD-33 | Un `InputAccessoryView` par champ de charge, avec un `nativeID` propre, monté après son champ. Citer `RCTInputAccessoryComponentView.mm`. Essai NFR-6 étendu : plusieurs champs, champ ajouté après l'ouverture, Sans → Avec, `Modal`. |
| 2 | Moyenne | AD-26 | Désigner l'autorité du défilement au focus (natif `automaticallyAdjustKeyboardInsets` ou calcul JS après `keyboardDidShow`) ; traiter Précédent / Suivant, qui ne déclenchent aucune notification clavier. |
| 3 | Basse à moyenne | AD-19 | `parseLoadText` accepte « , » et « . » (la touche de `decimal-pad` suit la région iOS). |
| 4 | Basse | AD-20, AD-22 | Une seule mesure de longueur (points de code) pour le libellé et les étapes ; `maxLength` de `TextInput` compte en UTF-16. |
| 5 | Basse | AD-24 | Mentionner que `disabled` et la police sur un `Text` enfant du segmenté natif n'ont pas été essayés ; la conclusion reste valable. |
| 6 | Info | front matter | HEAD réel `277296c6` ; `src/` et `app/` identiques à `52382b04` et `1116586b`. |
