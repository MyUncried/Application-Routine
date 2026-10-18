# Revue « vérification de la réalité » — ARCHITECTURE-SPINE PRE-4

> Historique — revue interne du 2026-10-16, antérieure à la revue ChatGPT ; non mise à jour.

Date : 2026-10-16. Objet : `../ARCHITECTURE-SPINE.md` et `../../research/primitives-natives-expo-ui.md`. Revue en lecture seule. Elle vérifie que chaque décision engagée repose sur le dépôt ou sur une source web, et non sur la mémoire. Elle ne vaut ni revue ChatGPT, ni preuve sur appareil.

## Verdict

**Globalement fondé, avec deux hypothèses porteuses non confirmées.**

- Les versions de la Stack, l'API `Popover`, les correctifs 57.0.12 et 57.0.13, les tags hétérogènes du `Picker`, `node:sqlite` sous Node 24 et l'infrastructure de test citée sont confirmés.
- Deux hypothèses ne sont pas confirmées :
  - un `Popover` SwiftUI hébergé dans la `Modal` React Native de la Feuille ;
  - le mode d'installation sur iPhone (Expo Go ou dev client), avec ses conséquences sur la version de `@expo/ui` réellement exécutée.
- Aucune affirmation n'est fausse. Une imprécision est à corriger : la note de Stack « figée par le lockfile du commit de départ » (§4).

## 1. Confirmé

| Affirmation de la spine | Preuve |
|---|---|
| expo ~57.0.16, react-native 0.86.2, react 19.2.3, @expo/ui ~57.0.13, expo-sqlite ~57.0.1, expo-router ~57.0.16, expo-dev-client ~57.0.15, typescript ~6.0.3, jest-expo ~57.0.4 | `package.json` du dépôt. `package-lock.json` résout respectivement 57.0.16 (l. 7788), 0.86.2 (l. 13502), 19.2.3 (l. 13431), 57.0.13 (l. 2555), 57.0.1 (l. 8225), 57.0.16 (l. 8130), 57.0.15 (l. 7887), 6.0.3 (l. 15296) et 57.0.4 (l. 10536). |
| Node 24, non déclaré | `node --version` donne v24.19.0. Le dépôt n'a ni `.nvmrc` ni champ `engines`. |
| `Popover` dans `@expo/ui/swift-ui` avec `isPresented` et `onIsPresentedChange` | Doc v57, page popover : props `isPresented`, `onIsPresentedChange`, `attachmentAnchor`, `arrowEdge` (défaut `none`). `Popover.Trigger` et `Popover.Content` figurent dans les exemples. Exemple `RNHostView matchContents` dans le contenu. Plateforme : iOS seulement. |
| `presentationCompactAdaptation(.popover)` : une bulle sur iPhone | **Absent de la doc v57.** Confirmé seulement par le source `packages/expo-ui/ios/Popover/PopoverView.swift`, branche `sdk-57` (GitHub). L'appel y est conditionné à iOS ≥ 16.4. La fermeture utilisateur est remontée par `onIsPresentedChange`. Réserve : la branche n'est pas l'archive 57.0.13 elle-même (voir §2). |
| « au moins 57.0.12 pour les modificateurs de `Popover` » | CHANGELOG `sdk-57`, 57.0.12 : « Fixed `Overlay`, `Alert`, `ConfirmationDialog` and `Popover` silently ignoring the `modifiers` prop ». |
| Correctifs cités par la recherche (`Toggle` 57.0.12, `RNHostView` vide 57.0.13, `spacing` 57.0.9, `menuOrder` 57.0.8, `Modal` RN rendues inertes 57.0.5) | Les cinq entrées figurent dans le CHANGELOG `sdk-57`. |
| `Picker` en roue, tags hétérogènes | Doc v57, page picker : `selection: T` et `onSelectionChange(selection: T)`. L'exemple officiel mélange `tag('option1')` et `tag(0)`. Avertissement : une roue sous `matchContents` se replie. |
| Roulettes à étendre par des props, sans toucher aux constantes partagées | `wheelPickerMath.ts:49` (`WHEEL_SECONDS_STEP = 1`) et `:194` (`WHEEL_NUMBER_MAX = 99`). Le pas 5 et la borne 100 de PRE-4 imposent bien un paramétrage. |
| Tests sur `node:sqlite` réel (`NodeSqliteDatabase`) et motif `FailingDatabase` | `src/infrastructure/database/testing/NodeSqliteDatabase.ts` importe `DatabaseSync` depuis `node:sqlite`. `FailingDatabase` figure dans `migrateDatabase.test.ts`. Un essai `node -e` sur ce poste ouvre une base `:memory:` (SQLite 3.53.3), sans option. |
| Migration 010 à la suite de 009 ; `DATABASE_VERSION` 9 → 10 ; transaction exclusive unique | Les fichiers `migration001` à `migration009` existent. `constants.ts:46` contient `DATABASE_VERSION = 9`. `migrateDatabase.ts` applique toutes les migrations dans un seul `withExclusiveTransactionAsync`. |
| Reconstruction de `activities` sur le motif de 003 et 004 ; CHECK permissif de `activity_definitions` | 003 et 004 suivent le motif `activities_new` + `PRAGMA defer_foreign_keys = ON` + `RENAME`. 006 crée `activity_definitions` avec `CHECK (execution_mode IN ('DURATION','REPETITIONS','TO_FAILURE'))`. |
| La Feuille est une `Modal` React Native existante | `ExecutionParametersSheet.tsx:362` : `<Modal transparent … testID="execution-sheet-modal">`, avec un `ScrollView` à la l. 403. |
| `@expo/ui` est inclus dans Expo Go | Doc v57, pages swift-ui et popover : « Included in Expo Go ». |

## 2. Non confirmé (hypothèses à garder explicites)

1. **`Popover` SwiftUI dans la `Modal` React Native de la Feuille (AD-7, Structural Seed).** Ni la doc v57 ni une recherche web n'en parlent. La spine le marque `[ASSUMPTION]` dans Deferred, ce qui est correct. AD-7 l'énonce pourtant comme une règle ferme : il faut le renvoyer à cette hypothèse. Le cas réel est plus contraint qu'un simple « Popover dans une Modal » : `Host` dans un `ScrollView`, lui-même dans une `Modal` présentée en `fade` transparente. Le correctif 57.0.5 (« RN `Modal`s … becoming untappable ») montre que l'interaction `Modal`/SwiftUI a déjà causé des défauts. **Preuve sur appareil requise dans la première story d'interface.**
2. **Sélecteur de cible et roulette de Durée hébergés dans le `Popover`, avec leurs propres ✕/✓ (AD-7).** Il faut imbriquer un `Picker` roue SwiftUI, ou `RNHostView` → `DurationWheelPicker` → `Host` SwiftUI, dans `Popover.Content`. Aucune source ne documente cette imbrication. Le dimensionnement est une difficulté connue : la roue se replie sous `matchContents`, et `RNHostView` ne mesure que son premier enfant (doc rnhostview).
3. **Version de `@expo/ui` exécutée lors de la recette.** Sous Expo Go, le module natif est celui embarqué dans Expo Go et non 57.0.13 du lockfile. La présence des correctifs 57.0.12 (modificateurs de `Popover`) dépend alors de la build Expo Go installée. Seul un dev client garantit 57.0.13. Ce point n'a pas été vérifié.
4. **Expo Go suffit-il ?** Pour `@expo/ui`, oui d'après la doc. Pour l'application entière, ce n'est pas vérifié. Le projet déclare `expo-dev-client` et un profil EAS `development` (`eas.json`), et Q5 exclut EAS. Or ce poste est sous Windows : une build locale du dev client iOS exige un Mac avec Xcode. Le report « mode d'installation » de la spine est donc un **prérequis bloquant de la recette**, à trancher avant la première story d'interface, et non un simple détail.
5. **Le source Swift vérifié est la branche `sdk-57`, pas l'archive 57.0.13.** La recherche s'appuie sur une copie installée dans un autre clone, que cette revue n'a pas lue (consigne). `node_modules` est absent ici. Il faut confirmer `node_modules/@expo/ui/package.json` = 57.0.13 et `ios/Popover/PopoverView.swift` après `npm ci`.
6. **Aucun appui extérieur n'applique de choix (AD-7).** `onIsPresentedChange(false)` est bien émis à la fermeture, mais rien n'est appliqué tant que le code ne le fait pas. Il s'agit d'une règle d'implémentation, non d'un comportement de la primitive. Sa conformité est à vérifier sur appareil.
7. **Suites Jest.** `npm test`, `npx tsc --noEmit` et `npm run lint` n'ont pas été exécutés : il n'y a pas de `node_modules`. Seul le chargement de `node:sqlite` par Node a été vérifié, pas son exécution sous le preset `jest-expo` dans ce clone. Le risque est faible, car des tests existants le font déjà.

## 3. Faux

Aucune affirmation de la spine n'est contredite par le dépôt ou par la doc v57.

## 4. Points périmés ou imprécis à corriger

- Stack : « Figée par le lockfile du commit de départ ». Le lockfile lu est celui de l'arbre de travail actuel (`a8ec6c35`), dont le code applicatif est censé être celui de `626632c3`. Il faut écrire « `package-lock.json` de la branche `bmad/pre4-comparaison` », ou vérifier `git diff 626632c3 -- package-lock.json`. Ce diff n'a pas été exécuté ici.
- AD-7 renvoie à P33 en cas d'impossibilité. Il faudrait ajouter que l'essai de faisabilité du point 1 du §2 conditionne aussi le Sélecteur de cible, pas seulement les choix à 2–4 options.
- La recherche, §Q1 Popover, cite la doc v57 pour la bulle sur iPhone. La doc v57 ne le dit pas : seul le source Swift l'établit. Le niveau de confiance reste « élevé (source) », mais la mention de la doc est à retirer.

## Sources consultées

- https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/
- https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/popover/
- https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/picker/
- https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/rnhostview/ (via recherche web)
- https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo-ui/ios/Popover/PopoverView.swift
- https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo-ui/CHANGELOG.md
- Dépôt : `package.json`, `package-lock.json`, `eas.json`, `src/infrastructure/database/{constants.ts,migrateDatabase.ts,migrations/,testing/NodeSqliteDatabase.ts}`, `src/features/sessions/wheelPickerMath.ts`, `src/features/activities/ExecutionParametersSheet.tsx`.
