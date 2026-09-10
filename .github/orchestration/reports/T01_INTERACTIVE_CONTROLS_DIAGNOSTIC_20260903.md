# DIAGNOSTIC — Contrôles interactifs non fonctionnels sur iPhone réel

**Aucun fichier applicatif n'a été modifié pour produire ce diagnostic.** Seules des lectures de code et des recherches (`grep`) ont été effectuées.

**Portée** : branche `feat/creation-seance-catalogue`, commit `6ef1821` (working tree non commité identique à celui livré au tour précédent — corrections zIndex/ordre incluses, non commitées au moment du diagnostic). Ce diagnostic reconsidère la correction précédente (élévation `zIndex`) avec scepticisme, puisque l'utilisateur rapporte qu'elle ne suffit pas : cette correction reste réelle et démontrée structurellement, mais n'est plus présentée ici comme LA cause suffisante.

---

## Constat central, démontré par le code (pas une hypothèse)

**`DurationWheelPicker.tsx` et `NumberWheelPicker.tsx` n'ont jamais eu de mécanisme réel de sélection par toucher direct — seul le glissement (drag/scroll) peut changer la valeur.**

```tsx
// DurationWheelPicker.tsx et NumberWheelPicker.tsx, WheelColumn / values.map
{values.map((value) => (
  <View key={value} style={styles.item}>      {/* ← View, pas Pressable */}
    <Text style={styles.itemLabel}>{formatTwoDigits(value)}</Text>
  </View>
))}
```

Aucun `onPress`, aucun `Pressable`/`TouchableOpacity` sur un item. Or l'instruction du cycle précédent exigeait explicitement (UI-CTRL-002, point documenté mais jamais implémenté ni testé) : *« toucher une valeur visible la sélectionne aussi »*. Ce n'était donc jamais vrai, et ceci n'a jamais pu être détecté par Jest puisqu'aucun test n'a jamais tenté de presser un item (tous les tests existants utilisent `fireEvent.scroll`, jamais `fireEvent.press` sur un item de roulette).

**Conséquence concrète sur device** : un utilisateur dont le geste naturel est de *taper* la valeur qu'il voit (plutôt que de la faire glisser précisément au centre) ne produit strictement aucun effet utile — le toucher, n'étant capté par aucun élément interactif à cet endroit, retombe sur ce qu'il trouve en remontant l'arbre (voir point suivant), ce qui correspond exactement au symptôme rapporté « s'ouvre mais ne permet pas de sélectionner ».

---

## Rapport par contrôle

### 1. `DurationWheelPicker.tsx` / `NumberWheelPicker.tsx` — items de roulette

- **Fichier/composant** : `src/features/sessions/DurationWheelPicker.tsx` (`WheelColumn`), `src/features/sessions/NumberWheelPicker.tsx` (`values.map`).
- **Symptôme** : la roulette s'ouvre, le geste de glissement semble fonctionner en théorie, mais taper directement une valeur visible ne fait rien.
- **Cause démontrée** (pas une hypothèse) : items rendus en `View`/`Text` non interactifs — aucun `onPress`.
- **Preuve** : lecture directe du code, ci-dessus. Aucun test existant (Jest) ne presse un item — seul `fireEvent.scroll` est utilisé, ce qui masque totalement cette lacune.
- **Solution recommandée** : envelopper chaque item dans un `Pressable`/`TouchableOpacity` dont `onPress` appelle directement la même mise à jour que `handleScroll`/`handleColumnScroll` (recalcule l'index depuis la valeur tapée, applique l'haptique, appelle `onChange`, puis `scrollTo` pour recentrer visuellement).
- **Primitive standard proposée** : plutôt que de patcher la réimplémentation maison, remplacer ce composant par **`@react-native-picker/picker`** (compatible Expo, wraps `UIPickerView` natif sur iOS / `Spinner` natif sur Android) — le geste de glissement ET le tap-to-select y sont gérés nativement, sans logique `onScroll`/`snapToInterval`/`ref` à maintenir soi-même. C'est la primitive Expo/RN construite précisément pour ce patron d'IU.
- **Niveau de confiance** : **Haute** (démontrée par lecture directe du code, pas une supposition).

### 2. `CompositionScreen.tsx` / `ExerciseScreen.tsx` — `Pressable` racine englobant tout l'écran

- **Fichier/composant** : `CompositionScreen.tsx` et `ExerciseScreen.tsx`, `<Pressable style={styles.container} onPress={closeOverlay} accessible={false}>` enveloppant l'intégralité de l'écran, y compris le `ScrollView` de la roulette.
- **Symptôme** : plausible fermeture du sélecteur au relâchement du doigt, y compris pendant/après un glissement, sans qu'aucune sélection n'ait eu le temps d'être perçue comme retenue.
- **Cause** : *hypothèse*, non confirmée sur device. Un unique `Pressable` interactif enveloppant tout l'écran (utilisé uniquement pour « toucher en dehors ferme le sélecteur ») est un patron atypique — chaque toucher, y compris ceux destinés à un enfant profondément imbriqué (la `ScrollView` de la roulette), doit négocier la responsabilité du geste avec ce parent. Combiné au point 1 (un tap sur un item n'a nulle part où aller), ce toucher peut remonter jusqu'à ce `Pressable` et déclencher `closeOverlay` — fermant le sélecteur sans sélection.
- **Preuve** : structurelle (lecture du code), pas de preuve device directe — aucun accès à un iPhone pour reproduire l'arbitrage de responder réel. Aucun test Jest ne peut trancher ce point : RNTL ne simule pas l'arbitrage natif du `GestureResponderSystem`.
- **Solution recommandée** : ne pas envelopper tout l'écran dans un `Pressable` interactif. Utiliser plutôt un calque de fermeture dédié, actif **uniquement quand un sélecteur est ouvert**, rendu **en dernier** (au-dessus), couvrant l'écran mais **derrière** le popover lui-même — motif standard « backdrop ».
- **Primitive standard proposée** : `Pressable` (ou `TouchableWithoutFeedback`) réservé à ce calque de fond, jamais au conteneur racine qui porte aussi les contrôles interactifs eux-mêmes.
- **Niveau de confiance** : **Moyenne** (risque structurel réel et documenté dans l'écosystème RN, mais non confirmé comme cause directe sur ce device précis).

### 3. `AnchoredRow` — élévation `zIndex` (correction du cycle précédent)

- **Fichier/composant** : `CompositionScreen.tsx`, `ExerciseScreen.tsx`, style `elevated: { zIndex: 1 }`.
- **Symptôme** : persistant malgré cette correction, d'après le retour utilisateur.
- **Cause démontrée** : le style `elevated` ne pose que `zIndex: 1`, **sans `position: "relative"` explicite**. Sous la Nouvelle Architecture (Fabric) — active par défaut à partir d'Expo SDK 52+, et rien dans `app.json`/`package.json` ne la désactive ici (confirmé par recherche, aucun `newArchEnabled: false`) — la création fiable d'un contexte d'empilement pour un `zIndex` posé sur un enfant en flux normal (ni `absolute` ni `relative` explicite) est moins garantie que documentée sous l'ancienne architecture.
- **Preuve** : lecture du style (`CompositionScreen.tsx`, styles `elevated`) + absence de toute désactivation de la Nouvelle Architecture dans la configuration. Pas de preuve device.
- **Solution recommandée** : ajouter `position: "relative"` explicite à `elevated`, en plus de `zIndex: 1`, pour forcer sans ambiguïté un contexte d'empilement propre.
- **Primitive standard proposée** : aucune primitive alternative nécessaire — correction de style pure.
- **Niveau de confiance** : **Faible à moyenne** — reste une correction défensive raisonnable, pas une cause certaine à elle seule ; le point 1 (absence totale de cible tactile sur les items) explique déjà, à lui seul, une grande partie du symptôme indépendamment de ce point.

### 4. `wheelArea` / `column` — largeur non contrainte

- **Fichier/composant** : `DurationWheelPicker.tsx` et `NumberWheelPicker.tsx`, styles `wheelArea`/`column` (aucune propriété `width`).
- **Symptôme** : zone de toucher potentiellement très étroite (dimensionnée par le contenu texte le plus large, ex. « 59 »), aggravant la difficulté à toucher précisément une valeur — même une fois le point 1 corrigé.
- **Cause** : *hypothèse*, plausible mais non mesurée sur device réel (dépend de la résolution Yoga exacte du flex-row parent sans largeur explicite sur aucun niveau).
- **Preuve** : lecture du code — aucune largeur fixée à aucun niveau (`container` en `flexDirection:"row"`, `wheelArea`/`column` sans `width`, `item` sans `width`).
- **Solution recommandée** : fixer une largeur explicite et confortable (ex. 64-72px) sur `wheelArea`/`column`, indépendante du contenu texte.
- **Niveau de confiance** : **Moyenne**.

### 5. `react-native-gesture-handler` — dépendance présente, jamais montée en racine

- **Fichier/composant** : aucun fichier de l'application (`grep` sur `src/`/`app/` ne trouve aucun import de `react-native-gesture-handler` ni `react-native-reanimated`) ; `app/_layout.tsx` ne monte aucun `GestureHandlerRootView`.
- **Symptôme** : risque générique de conflits de gestes natifs, potentiellement pour tout contrôle imbriqué.
- **Cause** : *hypothèse faible*. `react-native-gesture-handler` (~2.32.0) et `react-native-reanimated` (4.5.1) sont des dépendances déclarées (`package.json`) mais consommées uniquement en interne par le fork `native-stack` d'`expo-router` (confirmé par lecture de `node_modules/expo-router/build/layouts/StackClient.js`, qui utilise `createNativeStackNavigator` — lequel s'appuie sur `react-native-screens`, dont le geste de retour par balayage sur iOS est nativement porté par `UINavigationController`, pas par `react-native-gesture-handler`). Rien ne prouve donc que l'absence de `GestureHandlerRootView` soit la cause directe de ce symptôme précis.
- **Preuve** : recherche exhaustive (`grep -rln`), aucun résultat applicatif.
- **Solution recommandée** : ajouter `GestureHandlerRootView` (`style={{flex: 1}}`) autour du contenu de `app/_layout.tsx`, par précaution/bonne pratique standard Expo — faible risque, gain potentiel non garanti pour ce symptôme précis.
- **Primitive standard proposée** : `GestureHandlerRootView` de `react-native-gesture-handler` (déjà une dépendance).
- **Niveau de confiance** : **Faible** pour ce symptôme précis ; **Moyenne à haute** comme lacune générale de bonne pratique à corriger de toute façon.

### 6. `TextInput` (Nom) → première pression sur une ligne après frappe au clavier

- **Fichier/composant** : `CompositionScreen.tsx` (`TextInput` du nom, pas de `ScrollView` englobant) ; `ExerciseScreen.tsx` (déjà `keyboardShouldPersistTaps="handled"` sur son `ScrollView` — donc probablement déjà atténué côté Exercice).
- **Symptôme possible** : après avoir saisi le nom de la Séance/Activité, le premier tap sur une ligne de sélecteur ne fait que fermer le clavier (comportement natif iOS de première résignation du *first responder*) ; il faut taper une seconde fois pour que l'action réelle se déclenche — un testeur peut interpréter cela comme « ne fonctionne pas ».
- **Cause** : *hypothèse*, connue et documentée dans l'écosystème RN pour ce patron d'usage, non confirmée ici sur ce device précis. `keyboardShouldPersistTaps` ne s'applique qu'à un `ScrollView` — Composition n'en a pas, donc ce point est moins certain pour cet écran spécifiquement.
- **Preuve** : absence de `keyboardShouldPersistTaps` pertinent sur Composition (n'y a pas de `ScrollView`) ; présence confirmée sur Exercice.
- **Solution recommandée** : demander spécifiquement, lors du prochain test iPhone, si le problème persiste en tapant deux fois de suite sur la même ligne (sans repasser par le champ Nom) — isolerait ce facteur.
- **Niveau de confiance** : **Faible à moyenne**, à vérifier explicitement sur device plutôt qu'à corriger à l'aveugle.

### 7. `ColorPalette.tsx` / `BodyZoneSelector.tsx` / `SegmentButton` (Exercice) — pour référence, contrôles jugés structurellement sains

- **Constat** : ces trois contrôles utilisent déjà `Pressable` avec `onPress` réel sur chaque option (grille de couleur, tags de zones, segments) — contrairement aux items de roulette (point 1), ils ne présentent pas la même lacune structurelle démontrée.
- **Risque résiduel** : uniquement les points 2/3 ci-dessus (`Pressable` racine, empilement) peuvent encore les affecter indirectement, notamment la grille de couleur (son propre popover, imbriqué de la même façon).
- **Niveau de confiance** : **Moyenne** que ces trois contrôles fonctionnent correctement une fois les points 1 et 2 traités ; non vérifié sur device.

---

## Chaîne complète action → persistance (revue, pas seulement les points de rupture)

`geste → onScroll/onPress → offsetToIndex/valeur tapée → ref.current + état React (patchLocal/updateDraft) → libellé de ligne recalculé au rendu → Terminer/Valider → SessionDraft partagé (uniquement à Terminer, une fois) → aucune persistance SQLite avant T01-S09 (Composition reste un brouillon en mémoire)`.

Cette chaîne, en aval de la sélection elle-même (mise à jour d'état → libellé → validation → `SessionDraft`), a été relue et reste correcte et déjà testée (Jest, y compris intégration multi-écrans). **Le problème démontré se situe uniquement en amont : à l'étape « geste → valeur », précisément là où Jest ne peut rien prouver** (points 1 et 2 ci-dessus).

---

## Synthèse par niveau de confiance

| Rang | Cause | Confiance | Prouvée par |
|---|---|---|---|
| 1 | Items de roulette non interactifs (aucun tap-to-select) | **Haute** | Lecture directe du code |
| 2 | `Pressable` racine englobant tout l'écran (risque d'arbitrage de geste) | Moyenne | Analyse structurelle |
| 3 | `elevated` sans `position: relative` sous Fabric | Faible-Moyenne | Lecture du style + config SDK |
| 4 | Largeur de colonne non contrainte | Moyenne | Lecture du code |
| 5 | `GestureHandlerRootView` absent | Faible (pour ce symptôme) | Recherche exhaustive |
| 6 | Clavier → premier tap perdu (Composition spécifiquement) | Faible-Moyenne | Absence du garde-fou standard sur cet écran |

**Recommandation d'ordre de traitement** (pour la prochaine autorisation de correction, non exécutée dans ce diagnostic) : 1 d'abord (cause la plus certaine et la plus probablement suffisante à elle seule), puis 2, en évaluant si 3-4-5-6 restent nécessaires après un nouveau test iPhone.

---

## Note de méthode

Ce diagnostic a été produit strictement en lecture seule (lecture de code + `grep`), sans exécution de correction, sans commit ni modification de fichier applicatif, conformément à l'instruction « DIAGNOSTIC SEUL — NE MODIFIER AUCUN FICHIER » du tour précédent. La présente sauvegarde de ce même contenu, intégral et non modifié, dans ce fichier Markdown versionné est la seule action de ce tour-ci, sur instruction explicite ultérieure de correction de livraison.

**git status au moment du diagnostic** : identique à l'état laissé par le cycle de correction précédent (21 fichiers modifiés, 4 non suivis dont l'audit de conformité) — inchangé par ce diagnostic lui-même.
**HEAD au moment du diagnostic** : `6ef18213e95e66e5b31b3da72ac010265c8e4efd` — branche `feat/creation-seance-catalogue`.
