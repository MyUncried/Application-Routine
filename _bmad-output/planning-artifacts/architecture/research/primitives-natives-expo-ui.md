# Recherche technique : primitives natives `@expo/ui` pour PRE-4 (éditeur Exercice)

Date : 2026-10-16. Statut : recherche en lecture seule, préalable aux décisions d'architecture. Ce document ne vaut pas décision et ne remplace aucune preuve sur appareil réel. La validation visuelle et tactile appartient à Hermann (AGENTS.md).

## 0. Périmètre des preuves

- **Version visée :** `@expo/ui` `~57.0.13` (`package.json:7`), résolue en **57.0.13** par `package-lock.json:2555-2558` (`resolved .../ui-57.0.13.tgz`, empreinte `sha512-vGM2iVFK…`). Expo `~57.0.16`, React Native `0.86.2`.
- **Le dossier `node_modules` est absent de ce clone** : aucun `npm ci` n'y a été lancé. Les fichiers `.d.ts`, Swift et `CHANGELOG.md` ont été lus, en lecture seule, dans une copie installée **de la même version 57.0.13**, `C:\Dev\Application-routine-pre2-plan\node_modules\@expo\ui\`. Dans la suite, `$UI` désigne ce dossier. Le chemin équivalent après installation est `C:\Dev\KODJO-BMAD-PRE4\node_modules\@expo\ui\`. **À revérifier :** après `npm ci` dans ce clone, confirmer que `node_modules/@expo/ui/package.json` indique bien `57.0.13`.
- **Documentation consultée (v57) :**
  - https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/menu/
  - https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/popover/
  - https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/picker/
  - https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/contextmenu/
  - https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/list/
  - https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/swipeactions/
- **Cible iOS minimale du module :** iOS 16.4 (`$UI/ios/ExpoUI.podspec:13-15`). Les API SwiftUI conditionnées à iOS 16.4 sont donc toujours actives.
- **Code de départ lu :** `src/features/sessions/DurationWheelPicker.tsx` et `src/features/sessions/NumberWheelPicker.tsx`. On ne trouve aucun autre import de `@expo/ui` dans `src/` ni dans `app/`.
- **Niveaux de confiance :**
  - **Élevé** : l'API figure dans le `.d.ts` et le comportement se lit dans le source Swift.
  - **Moyen** : le comportement relève de SwiftUI lui-même, d'après la documentation Apple ou un changelog, sans exemple Expo.
  - **Faible** : simple déduction.

---

## Q1. Popover ou menu ancré pour choisir une option parmi 2 à 4

Cas visés : Mode (Durée / Répétitions), Changement de côté, Ordre des côtés avec sous-titre, Régime avec sous-titre.

### Primitives disponibles (57.0.13)

| Primitive | Déclenchement | Ancrage | Sous-titre par option | Coche | Fermeture par appui extérieur | Contenu stylable selon Figma |
|---|---|---|---|---|---|---|
| `Menu` | appui simple (ou appui long avec `onPrimaryAction`) | menu système ancré au déclencheur | oui, via le libellé du `Button` (voir plus bas), confiance moyenne | oui, via `Picker` en style `menu` ou `Toggle` imbriqué | oui, comportement système | **non** : rendu par le menu système iOS |
| `Picker` + `pickerStyle('menu')` | appui sur le bouton qui affiche la valeur courante | menu système ancré | moyen (même mécanisme que `Menu`) | **oui, coche native sur l'option sélectionnée** | oui | non : apparence du bouton système |
| `ContextMenu` | **appui long uniquement** | menu contextuel avec aperçu | changelog « subtitle buttons » | `Toggle` → coche | oui | non |
| `Popover` | contrôlé (`isPresented`) | bulle ancrée, flèche paramétrable, **vraie bulle sur iPhone** | libre (contenu SwiftUI ou RN) | à dessiner dans le contenu | oui, comportement système | **oui** |
| `community/menu` `MenuView` | appui simple ou appui long | iOS : SwiftUI `Menu` ; Android : Compose `DropdownMenu` | **non** (aucun champ sous-titre) | `state: 'on'` | oui | non |

### Preuves

**`Menu`**
- `$UI/build/swift-ui/Menu/types.d.ts:11` : `label: string | ReactNode`. Le libellé accepte un nœud personnalisé. La documentation v57 (page Menu) montre qu'une vue React Native, par exemple un `Pressable`, peut servir de libellé, enveloppée dans `RNHostView`.
- `$UI/build/swift-ui/Menu/types.d.ts:22` : `onPrimaryAction`. Avec cette prop, un appui exécute l'action et un appui long ouvre le menu. Sans elle, un appui ouvre le menu.
- `$UI/build/swift-ui/Menu/types.d.ts:27` : le contenu peut comprendre « `Button`, `Toggle`, `Picker`, `Section`, `Divider` or nested `Menu` ».
- `$UI/ios/Menu/MenuView.swift:33-39` : il s'agit de `SwiftUI.Menu`, utilisé sans réimplémentation.
- `$UI/src/community/menu/MenuView.ios.tsx`, bloc final : `<Menu label={<RNHostView matchContents>…</RNHostView>}>`. Ce motif officiel garde un **déclencheur React Native** et ouvre un **menu natif**.

**Sous-titre par option**
- `$UI/build/swift-ui/Button/index.d.ts:32` : `children?: ReactElement | ReactElement[]`. Le libellé du bouton est personnalisable.
- `$UI/build/swift-ui/Label/index.d.ts:19-22` : la documentation du `.d.ts` cite explicitement « a `VStack` with title and subtitle ».
- `$UI/CHANGELOG.md:698` : « [iOS] Fix `ContextMenu` item with subtitle buttons (#40926) ». Expo prend donc en charge les éléments de menu avec sous-titre.
- Côté iOS, le menu système affiche un second `Text` du libellé comme sous-titre, en police secondaire.
- **Limite :** la typographie, la couleur et la taille ne se personnalisent pas. Le menu système ignore les modificateurs de couleur par élément, comme le rappelle `$UI/build/community/menu/types.d.ts:59-65`.

**Coche**
- La documentation v57 (page Menu) indique qu'un `Toggle` placé dans un `Menu` s'affiche comme une ligne avec coche quand `isOn` vaut vrai.
- `$UI/build/swift-ui/modifiers/pickerStyle.d.ts:1` : `'menu'` fait partie de `PickerStyleType`.
- `$UI/ios/Modifiers/PickerStyleModifier.swift:20-22` : `.pickerStyle(.menu)`.
- Un `Picker` en style `menu`, utilisé seul ou imbriqué dans un `Menu`, affiche la coche native sur l'élément sélectionné. C'est le comportement SwiftUI standard. La documentation ContextMenu v57 donne aussi l'exemple « Context menu with picker ».

**`Popover`**
- `$UI/build/swift-ui/Popover/index.d.ts:7-20` : `isPresented`, `onIsPresentedChange`, `attachmentAnchor` (`leading|trailing|center|top|bottom`), `arrowEdge` (défaut `none`).
- `$UI/build/swift-ui/Popover/index.d.ts:28-32` : `Popover.Trigger` et `Popover.Content`.
- `$UI/ios/Popover/PopoverView.swift`, l. 15 : `.popover(isPresented:attachmentAnchor:arrowEdge:)`. L. 22 : `.presentationCompactAdaptation(.popover)` sous `#available(iOS 16.4, *)`. **Sur iPhone, le popover reste donc une bulle ancrée et ne se transforme pas en feuille.**
- L. 26-35 du même fichier : la fermeture système par appui extérieur remet l'état à `false`, et JS en est informé par `onIsPresentedChange`.
- La documentation v57 (page Popover) montre un contenu React Native enveloppé dans `RNHostView matchContents`.

**`ContextMenu`**
- `$UI/build/swift-ui/ContextMenu/index.d.ts:10-12` : le déclencheur est l'élément « long-pressed ». La documentation v57 le confirme et oriente vers `Menu` pour un appui simple. **Il ne convient pas** à un sélecteur ouvert par un appui simple.

**`community/menu`**
- `$UI/build/community/menu/types.d.ts:31-85` : `MenuAction` ne comporte aucun champ sous-titre. La coche passe par `state` (l. 70).
- Sur iOS, `show()` est sans effet (l. 90-99) et `onOpenMenu` / `onCloseMenu` ne sont pas émis (l. 130-148).

**Accessibilité**
- Les éléments de `Menu` et de `Picker` en style `menu` sont des contrôles système, que VoiceOver annonce nativement (libellé, état « sélectionné »).
- Modificateurs disponibles : `accessibilityLabel`, `accessibilityHint`, `accessibilityValue`, `accessibilityAddTraits` (`$UI/build/swift-ui/modifiers/index.d.ts:698-769`).
- Avec un déclencheur `RNHostView`, l'accessibilité du déclencheur reste celle du composant React Native (`accessibilityRole`, `accessibilityLabel`).

### Exemples d'API (esquisses, non validées)

Menu natif, déclencheur React Native, coche et sous-titre :

```tsx
import { Host, Menu, Picker, Button, VStack, Text, RNHostView } from "@expo/ui/swift-ui";
import { pickerStyle, tag, menuOrder } from "@expo/ui/swift-ui/modifiers";

<Host matchContents ignoreSafeArea="all">
  <Menu
    label={<RNHostView matchContents><RegimeTrigger value={regime} /></RNHostView>}
    modifiers={[menuOrder("fixed")]}
  >
    <Picker selection={regime} onSelectionChange={setRegime} modifiers={[pickerStyle("menu")]}>
      <Button modifiers={[tag("A")]}>
        <VStack><Text>Titre A</Text><Text>Sous-titre A</Text></VStack>
      </Button>
      {/* … */}
    </Picker>
  </Menu>
</Host>
```

Popover ancré à contenu libre (rendu Figma) :

```tsx
<Host matchContents>
  <Popover isPresented={open} onIsPresentedChange={setOpen} arrowEdge="top">
    <Popover.Trigger>{/* déclencheur SwiftUI ou RNHostView */}</Popover.Trigger>
    <Popover.Content>
      <RNHostView matchContents><OptionsList … /></RNHostView>
    </Popover.Content>
  </Popover>
</Host>
```

Dans le premier exemple, mettre un `Button` comme enfant d'un `Picker` en style `menu`, avec `tag`, est **une hypothèse**. La forme documentée utilise `Text` avec `tag`. Pour le sous-titre, l'alternative sûre est la suivante : des `Button` ou des `Toggle` à libellé `VStack(Text, Text)` dans un `Menu`, avec une coche gérée par `Toggle isOn`.

### Arbitrage à porter dans l'architecture (non tranché ici)

- **Option A, `Menu` / `Picker` en style `menu` :** tout est natif (ancrage, coche, VoiceOver, fermeture). En contrepartie, l'apparence des lignes du menu (police, couleurs, largeur) est celle d'iOS et **ne pourra pas suivre Figma au pixel près**.
- **Option B, `Popover` natif + contenu React Native :** l'ancrage, la bulle et la fermeture restent natifs, et les lignes peuvent suivre Figma. En contrepartie, la coche, le sous-titre et l'accessibilité des lignes sont à écrire dans le contenu.
- Selon la règle AGENTS.md, aucune des deux options n'est une réimplémentation du mécanisme d'ouverture. **Si Figma montre un rendu de lignes incompatible avec le menu système, la question doit être signalée à Hermann** (fidélité Figma contre menu système). Ce point relève de `questions-ouvertes.md`.

**Confiance :**
- élevée pour l'existence des API, la bulle sur iPhone, l'appui long seul pour `ContextMenu` et la coche via `Picker` en style `menu` ou `Toggle` ;
- moyenne pour le rendu du sous-titre dans `Menu` / `Picker` en style `menu`, et pour un `Button` à `tag` dans un `Picker` en style `menu`.

**Sur appareil :**
- rendu du sous-titre ;
- coche ;
- ordre des éléments quand le menu s'ouvre vers le haut (`menuOrder('fixed')`, voir Q6) ;
- annonce VoiceOver de l'option sélectionnée ;
- position de la bulle `Popover` près des bords de l'écran et dans un `ScrollView` en défilement ;
- fermeture par appui extérieur ;
- absence de double inset de zone sûre (`ignoreSafeArea="all"`, cf. `$UI/CHANGELOG.md:215`).

---

## Q2. Roulette de cible Durée : listes arbitraires, dépendance 58 → 0..55, option « Aucune durée, à l'échec » au-dessus d'un bloc grisé à 45 % mais manipulable

### Listes de valeurs arbitraires

**Oui.** Un `Picker` ne propose que les enfants qu'on lui donne : chaque `Text` porte un `tag(valeur)` (`$UI/build/swift-ui/Picker/index.d.ts:23-26`, `$UI/build/swift-ui/modifiers/tag.d.ts`).

Le code actuel produit déjà ses listes côté JS :
- `minutesValues` : `DurationWheelPicker.tsx:196-197` ;
- `SECONDS_VALUES` : `DurationWheelPicker.tsx:73-75`.

Les nouvelles listes s'en déduisent :
- minutes 0..58 : `Array.from({length: 59})` ;
- secondes par pas de 5 : `[0, 5, …, 55]`.

À noter : le pas actuel vient de `WHEEL_SECONDS_STEP = 1` (`src/features/sessions/wheelPickerMath.ts:49`). Il est partagé avec les roulettes de Composition, qui sont hors périmètre. Le pas 5 doit donc passer par un paramètre, sans modifier la constante partagée. Cette décision relève de l'architecture.

### Dépendance 58 → 0..55

- **Remarque factuelle :** avec un pas de 5, les secondes valent déjà au plus 55. La contrainte « à 58 min, secondes 0..55 » coïncide donc avec la liste complète et n'impose aucun recalcul. À confirmer contre la source ED concernée : si la source entend une autre borne ou un autre pas, le signaler.
- **Si une dépendance réelle existait** (liste de secondes qui change avec les minutes), c'est faisable en recalculant les enfants du `Picker` secondes au rendu. **Risque :** si la valeur sélectionnée disparaît de la liste, SwiftUI garde une sélection sans `tag` correspondant (pas de ligne centrée). Il faut ramener le brouillon à une valeur valide **avant** le rendu. `PickerView.swift:56-58` resynchronise la sélection native sur `props.selection`.

### « Aucune durée, à l'échec » au-dessus du bloc, bloc à 45 %

**Faisable autour de la primitive, sans la remplacer.** Deux points d'application existent :
1. `opacity(0.45)` (`$UI/build/swift-ui/modifiers/index.d.ts:197`) appliqué au `HStack` qui contient les deux `Picker`. C'est un modificateur SwiftUI : il **ne désactive pas** l'interaction (contrairement à `disabled`, l. 441, **à ne pas utiliser** puisque le bloc doit rester manipulable).
2. `opacity: 0.45` sur la `View` React Native qui enveloppe le `Host`. La propriété est appliquée au calque natif et ne bloque pas les gestes.

L'option elle-même, placée hors roue, est un contrôle React Native (`Pressable` avec `accessibilityRole="checkbox"` ou `"radio"` et `accessibilityState`) posé au-dessus du `Host`, dans la surface existante `nativeSurface` (`DurationWheelPicker.tsx:603-616`). Ce n'est pas une réimplémentation de la roue.

Le comportement attendu quand on touche la roue alors que l'option est active (désactiver l'option, restaurer l'opacité) se code dans `onSelectionChange`. **Point de vigilance :** SwiftUI n'émet `onSelectionChange` que lorsque la valeur change (`PickerView.swift:40-45`). Faire tourner la roue puis revenir sur la même valeur, ou la toucher sans la déplacer, **ne déclenche rien**. Si la source exige « toucher la roue désélectionne l'option » même sans changement de valeur, aucun événement de `Picker` ne le permet directement. Piste : `onTapGesture` (`index.d.ts:155`) sur le `HStack`, avec un risque de conflit avec le geste de la roue, à vérifier sur appareil. **À signaler en question ouverte si la source est ambiguë.**

**VoiceOver :** il faut annoncer l'état « inactif » du bloc grisé. Utiliser `accessibilityValue` ou `accessibilityHint` sur les `Picker` (`index.d.ts:704-710`). La seule opacité n'est pas perçue par VoiceOver.

**Confiance :**
- élevée pour les listes arbitraires et pour `opacity` sans blocage (sémantique SwiftUI standard, modificateur exposé) ;
- moyenne pour l'absence d'événement quand la valeur ne change pas (lu dans `PickerView.swift`).

**Sur appareil :**
- rendu à 45 % sur les chiffres et sur le cadre de sélection natif, lisibilité ;
- la roue reste manipulable ;
- géométrie de la surface quand on ajoute la ligne d'option (largeur 330 et hauteur dérivée, `DurationWheelPicker.tsx:599-602`) ;
- annonce VoiceOver.

---

## Q3. Roulette Répétitions : une colonne, première ligne « Aucune répétition, à l'échec », puis 1..100

**Faisable.**

**Types de `tag` :**
- `$UI/build/swift-ui/Picker/index.d.ts:3` : `SelectionValueType = string | number | null`.
- `$UI/ios/Modifiers/TagModifier.swift:7-15` : un `tag` est `Either<String, Double>`, converti en `AnyHashable`.
- `$UI/ios/Picker/PickerView.swift:9`, `:14`, `:46-54` : la sélection est un `AnyHashable?` et l'événement renvoie une chaîne ou un nombre.
- La documentation v57 (page Picker, et l'exemple de `Picker/index.d.ts:33-34`) mélange `tag('option1')` et `tag(0)` dans un même `Picker`.

**Recommandation :** utiliser une sentinelle **numérique** (par exemple `0` ou `-1`), plutôt qu'un mélange chaîne/nombre. Le type `T` du `Picker` reste ainsi `number`, la comparaison `AnyHashable(Double)` reste homogène, et la traduction vers « à l'échec » (valeur nulle, ou autre représentation du domaine) se fait dans le composant. Le mélange chaîne/nombre fonctionne d'après le code Swift, mais complique le typage TypeScript.

**Bornes :** 1..100, contre 1..99 aujourd'hui (`WHEEL_NUMBER_MAX`, `NumberWheelPicker.tsx:68-71`, défini dans `wheelPickerMath.ts`). La constante est partagée : la borne 100 doit passer par un paramètre, sans modifier la constante, si Composition (hors périmètre) l'utilise.

**Largeur :** la colonne native est figée à `frame({ width: 96 })` (`NumberWheelPicker.tsx:165`), dans une surface de largeur canonique 144 (`NumberWheelPicker.tsx:79-86`). Un libellé « Aucune répétition, à l'échec » **sera tronqué** à cette largeur. Le libellé passe par `lineLimit` et `truncationMode`, exposés dans `BuiltInModifier`. Les dimensions viennent de Figma, en dernier. À confronter avec le contrat visuel ED concerné : si Figma ne montre pas cette ligne dans la roue, classer `NON VÉRIFIABLE` ou le signaler.

**Avertissement documentaire :** la documentation v57 (page Picker) indique que « Segmented and wheel pickers stretch to the width they are given, so they collapse under `matchContents` ». Le code actuel s'en protège avec un `frame({width})` explicite. Conserver ce garde-fou si la largeur change.

**Confiance :**
- élevée pour les tags hétérogènes et la sentinelle numérique ;
- moyenne pour le rendu d'une ligne de texte longue dans une roue étroite.

**Sur appareil :**
- troncature ou retour à la ligne du libellé ;
- centrage ;
- haptique au passage de la sentinelle à 1 ;
- annonce VoiceOver de la valeur sentinelle.

---

## Q4. Liste réordonnable et actions de balayage natives pour le tableau des séries variables

**Primitives présentes en 57.0.13 :**
- `List` (`$UI/build/swift-ui/List/index.d.ts:4-22`) et `List.ForEach` avec `onMove(sourceIndices, destination)` et `onDelete(indices)` (`$UI/build/swift-ui/List/ListForEach.d.ts:12`, `:18`). Implémentation : `.onDelete` et `.onMove` SwiftUI natifs (`$UI/ios/ListForEachView.swift:19-21`).
- Mode édition : `environment('editMode', 'active' | 'inactive')` (`$UI/build/swift-ui/modifiers/environment.d.ts:2-4`), montré dans l'exemple `EditableListExample` de la documentation v57 (page List).
- Verrous par ligne : `moveDisabled` et `deleteDisabled` (`$UI/build/swift-ui/modifiers/index.d.ts:676`, `:684`).
- `SwipeActions` + `SwipeActions.Actions` (`edge`, `allowsFullSwipe`) (`$UI/build/swift-ui/SwipeActions/index.d.ts:2-37`), plateforme iOS. La documentation v57 l'emploie dans `Host > List > Section`. Le modificateur SwiftUI `.swipeActions` n'a d'effet que dans une ligne de `List` : il faut donc une `List` native.
- Modificateurs de ligne : `listStyle`, `listRowInsets`, `listRowBackground`, `listRowSeparator`, `listRowSpacing`, `scrollDisabled` (`index.d.ts:618`, `:847-868`, `:1006`, `:1236`).

**Contraintes d'intégration (écran React Native défilant) :**
1. **`List` est elle-même un conteneur défilant.** L'écran Exercice est un `ScrollView` React Native. Dans ce cas, il faut :
   - donner au `Host` une **hauteur explicite**, calculée comme nombre de lignes × hauteur de ligne. La documentation v57 n'utilise que `<Host style={{ flex: 1 }}>` et ne traite pas le cas d'un `ScrollView` parent, et `matchContents` applique `.fixedSize` (`$UI/ios/HostView.swift:61`, `:75`), dont l'effet sur une `List` reste incertain ;
   - appliquer `scrollDisabled(true)` à la `List` pour éviter le double défilement ;
   - prévoir un rendu de `List` de style `plain`, afin de neutraliser les marges `insetGrouped` étrangères à Figma.
2. **Contenu des lignes :** les lignes doivent être des vues SwiftUI (`Text`, `HStack`, `Button`…). Mettre des contrôles React Native existants dans les lignes passe par `RNHostView`, au prix des risques de gestes listés en Q6. Ouvrir une roulette ou un popover depuis une cellule de ligne revient à imbriquer `Popover` ou `Menu` dans une ligne de `List`. C'est possible en SwiftUI, mais l'imbrication ajoute de la complexité.
3. **Réordonnancement :** en mode édition actif, des poignées système s'affichent. Hors mode édition, le glissement par appui long dépend du comportement SwiftUI de la version d'iOS. À vérifier.
4. **Montage :** la documentation v57 (page List) prévient : « `List` does not lazily render rows yet ». C'est sans conséquence pour un tableau de séries court.

**Conclusion :** les primitives natives existent. Leur insertion dans un `ScrollView` React Native, avec des cellules éditables, est **le point le plus risqué** de la liste. L'architecture doit d'abord établir, depuis ED-01 à ED-22 et Figma, si le tableau des séries variables exige le glissement ou le balayage. Si ce n'est pas le cas, ne pas introduire `List`. Si c'est le cas, prévoir un essai sur appareil tôt dans la réalisation.

**Confiance :**
- élevée pour l'existence des API ;
- moyenne pour la cohabitation avec un `ScrollView` React Native, faute de documentation ;
- faible pour le glissement sans mode édition.

**Sur appareil :**
- hauteur du `Host` et absence de défilement imbriqué ;
- poignées de réordonnancement ;
- balayage dans un `ScrollView` parent (conflit de geste horizontal) ;
- ouverture d'un sélecteur depuis une ligne ;
- VoiceOver (actions « Supprimer » et « Déplacer » exposées par le système).

---

## Q5. Android et web : comportement actuel et impact

**Code actuel :**
- `DurationWheelPicker.tsx:129-134` et `NumberWheelPicker.tsx:100-105` testent `Platform.OS === "ios"`.
- Hors iOS, ces composants passent par `Legacy*WheelPicker` : un `ScrollView` avec `snapToInterval`, un `Pressable` par valeur et un recouvrement `WheelSelectionOverlay` (`DurationWheelPicker.tsx:373-557`, `NumberWheelPicker.tsx:231-333`). Ces chemins sont accessibles en mode `adjustable` (incrément et décrément).

**`@expo/ui/swift-ui` :**
- iOS et tvOS seulement (commentaire `DurationWheelPicker.tsx:59-62`). `SwipeActions` est marqué `@platform ios` (`SwipeActions/index.d.ts:30-31`), de même que la page Popover de la documentation v57.
- Sur Android, il n'existe aucun `Menu`, `Popover` ni `List.ForEach` SwiftUI.
- Il existe en revanche :
  - `@expo/ui/jetpack-compose` `DropdownMenu` et `ExposedDropdownMenuBox` (`$UI/build/jetpack-compose/`) ;
  - `community/menu` `MenuView`, multiplateforme : Compose `DropdownMenu` sur Android, et sur le web le déclencheur s'affiche mais les actions ne se déclenchent pas (`$UI/build/community/menu/MenuView.d.ts:1-15`).

**Impact pour PRE-4 :**
- iOS est la cible de recette (`docs/preparation/PRE-4/bmad/recette-iphone.md`).
- Chaque nouveau contrôle natif iOS doit avoir un repli non natif sous `Platform.OS !== "ios"`, au minimum fonctionnel, pour que :
  1. l'application ne plante pas sur Android ou le web ;
  2. **les tests Jest puissent couvrir la logique** : les tests actuels testent les deux chemins en forçant `Platform.OS`, cf. `NumberWheelPicker.test.tsx:52`, `:231`, `:260-267`.
- La fidélité visuelle Android et web est hors recette.
- **Garde-fous à préserver :**
  - `DurationWheelPicker.test.tsx:371` et `NumberWheelPicker.test.tsx:260-267` vérifient qu'iOS n'affiche aucun `ScrollView`. Les nouvelles variantes (option « à l'échec », sentinelle) doivent garder ces assertions vertes.
  - Ajouter l'équivalent pour tout nouveau `Menu` ou `Popover` : vérifier, par exemple, l'absence de `Modal` ou de `Pressable` de substitution sur iOS.

**Confiance :** élevée (code lu).

**Sur appareil :** aucune vérification requise hors iOS pour la recette. Lancer au moins une fois Android ou le web pour vérifier l'absence de plantage, si un appareil est disponible. Ne rien déclarer sans essai.

---

## Q6. Risques connus (changelog 57.x et lecture du code)

1. **`menuOrder` :** avec l'ordre `automatic` par défaut, un menu qui s'ouvre vers le haut **inverse l'ordre des éléments**. Appliquer `menuOrder('fixed')` (`$UI/build/swift-ui/modifiers/menuOrder.d.ts`, `$UI/CHANGELOG.md:76`). Ce point est critique pour Mode, Régime et Ordre des côtés.
2. **`Popover` sans modificateurs avant 57.0.12 :** les versions antérieures ignoraient les `modifiers` de `Overlay`, `Alert`, `ConfirmationDialog` et `Popover`. C'est corrigé en 57.0.12 (`CHANGELOG.md:36`). La version installée, 57.0.13, a la correction. **Ne pas rétrograder.**
3. **`Toggle` dans les menus :** les coches de `community/menu` étaient désynchronisées et un `onPressAction` sur deux était perdu. C'est corrigé en 57.0.12, et `Toggle` est désormais entièrement contrôlé (`CHANGELOG.md:38`). Conséquence : `isOn` doit être mis à jour par JS, sinon la coche ne bouge pas.
4. **Ouverture et fermeture de menu non observables sur iOS :** `Menu` et `ContextMenu` n'ont ni API d'ouverture programmatique ni événement d'ouverture ou de fermeture (`$UI/build/community/menu/types.d.ts:90-99`, `:130-148`). Si la source exige une réaction à la fermeture sans choix (par exemple, restaurer un état), il faut un `Popover` (`onIsPresentedChange`).
5. **Roue repliée sous `matchContents` :** une roue sans largeur explicite se replie (documentation v57, page Picker). Garder `frame({ width })`.
6. **Couleur de texte non résolue derrière `Host` :** constat projet (`DurationWheelPicker.tsx:164-184`). Tout `Text` SwiftUI doit porter `foregroundStyle(...)` explicite. Cela s'applique aussi au contenu SwiftUI d'un `Popover`. Les lignes d'un `Menu` système ne sont pas concernées : le système les colore.
7. **`HStack` / `VStack` sans `spacing` :** depuis 57.0.9, un `spacing` non renseigné prend l'espacement système, et non plus 0 (`CHANGELOG.md` §57.0.9, changement cassant). Passer `spacing={0}` explicitement, comme le fait déjà `DurationWheelPicker.tsx:236`.
8. **Double inset de zone sûre :** il était appliqué deux fois aux composants hébergés. Correction en amont par `ignoreSafeArea="all"` sur le `Host` (`CHANGELOG.md:215`). À reprendre pour tout `Host` qui contient un `Menu` ou un `Popover`.
9. **`RNHostView` :** historique de bogues de gestes et d'accessibilité.
   - Gestionnaire tactile non détaché, qui rendait des `Modal` React Native inertes après une feuille : corrigé en 57.0.5 (`CHANGELOG.md` §57.0.5).
   - `RNHostView` vide qui occupait de la place : corrigé en 57.0.13 (`CHANGELOG.md:23`).
   - Les écrans PRE-3 utilisent des `Modal` React Native (`AbandonCreationModal.tsx`, `ExerciseExitConfirmModal.tsx`) : vérifier sur appareil leur cohabitation avec un `Popover` ou un `Menu` à déclencheur `RNHostView`.
10. **`onSelectionChange` muet sans changement de valeur :** voir Q2 (`PickerView.swift:40-45`).
11. **Sélection dont la valeur n'a pas de `tag` correspondant :** voir Q2. Ramener le brouillon à une valeur présente avant le rendu.
12. **`List` sans rendu paresseux :** noté dans la documentation v57. Sans conséquence ici.
13. **Environnement de test :** `node_modules` n'est pas installé dans ce clone. Toute affirmation sur la compilation ou les tests attend `npm ci`, puis `npm test`, `npx tsc --noEmit` et `npm run lint`.

---

## Synthèse pour l'architecture (sans décision)

| Besoin | Primitive candidate | Confiance | Bloquant à vérifier sur appareil |
|---|---|---|---|
| Choix d'option parmi 2 à 4 (Mode, Changement de côté) | `Menu` + `Picker` en style `menu` (coche native), déclencheur `RNHostView` | élevée | ordre des éléments (`menuOrder('fixed')`), apparence par rapport à Figma |
| Choix avec sous-titre (Ordre des côtés, Régime) | `Menu` à `Button` / `Toggle` avec libellé `VStack(Text, Text)`, **ou** `Popover` à contenu Figma | moyenne | rendu du sous-titre, coche, VoiceOver ; arbitrage de fidélité Figma |
| Cible Durée | `Picker` en style `wheel` (×2), listes paramétrées ; option hors roue en React Native ; `opacity(0.45)` sans `disabled` | élevée | rendu à 45 %, désélection au toucher sans changement de valeur |
| Cible Répétitions | `Picker` en style `wheel`, `tag` numérique sentinelle + 1..100 | élevée | troncature du libellé long dans la colonne de 96 |
| Séries variables : réordonnancement et suppression | `List` + `List.ForEach` (`onMove` / `onDelete`) + `SwipeActions` | moyenne à faible | à n'introduire que si une exigence ED l'impose ; hauteur du `Host` dans un `ScrollView`, conflits de gestes |
| Android et web | repli React Native existant (`Legacy*`), sans fidélité visuelle | élevée | absence de plantage |

Questions à reporter dans `docs/preparation/PRE-4/bmad/questions-ouvertes.md` (à faire par l'appelant, ce document n'y touche pas) :
1. Fidélité Figma des lignes de choix : le menu système iOS est-il acceptable ?
2. « Toucher la roue » sans changement de valeur doit-il désactiver l'option « à l'échec » ?
3. La borne « 58 → 0..55 » coïncide-t-elle avec la liste complète au pas de 5 ?
4. Le tableau des séries variables exige-t-il le glissement ou le balayage ?
