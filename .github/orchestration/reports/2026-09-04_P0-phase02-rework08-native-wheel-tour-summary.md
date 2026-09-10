# P0 — Phase 2 — REWORK08 — Roulette native + synthèse Tour

## Identification

- **Mission** : REWORK08 — trois ensembles cumulatifs : **A** zone de sélection unique sur la roulette native ; **B** la roulette ne doit jamais se fermer au toucher/défilement ; **C** synthèse activité/durée sous « Nombre de tours ».
- **Issue** : [#35](https://github.com/MyUncried/Application-Routine/issues/35)
- **Autorisation** : `[ChatGPT] CHANGES_REQUESTED — REWORK08 — roulette native + synthèse Tour`, 2026-09-04T10:03:48Z (42ᵉ et dernier commentaire de l'Issue #35 au moment de cette clôture — seul commentaire publié depuis mon dernier checkpoint, `REWORK07B_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`, 2026-09-04T10:01:52Z).

## Branche et commit de départ

- Branche : `feat/creation-seance-catalogue`
- Baseline obligatoire, vérifiée avant tout code : `8da42add6fc3c816f27a1b83a3a6e09caa5f0393` — HEAD local, HEAD distant et baseline exigée par l'autorisation strictement identiques ; `git status --short` vide ; absence de `MERGE_HEAD`.

## Validation device et éléments gelés (rappel, PRESERVE)

La recette iPhone a validé les corrections REWORK07B suivantes, devenues `PRESERVE / BASELINE GELÉE` — **non modifiées par ce cycle** : icône Retour canonique ; icônes Annuler/Valider agrandies/canoniques ; structure extérieure bleue de la section Tour.

## Périmètre demandé

- **A — Roulette native, zone de sélection unique** : constat iPhone — deux zones/cadres gris séparés (un derrière minutes, un derrière secondes) au lieu d'une seule bande continue traversant minutes + `min` + secondes + `s`. Diagnostiquer avant code si la cause vient des indicateurs natifs de chaque `Picker`, d'un overlay applicatif, ou des deux — ne pas masquer par un troisième fond. Si la primitive ne permet pas de fusionner/supprimer les deux indicateurs tout en conservant l'interaction native, arrêter **avant remplacement** en `NATIVE_PRIMITIVE_EXCEPTION_REQUIRED`, preuve technique et options à l'appui — interdiction de réintroduire une roulette `ScrollView` personnalisée.
- **B — Roulette native, ne jamais fermer au toucher/défilement** : constat iPhone — toute pression sur une roue ferme le sélecteur. Diagnostiquer la cause exacte (callback natif, propagation vers un `Pressable`, gestion de focus, remontée d'état/remount conditionnel), montrer la chaîne d'événements avant/après. Conserver obligatoirement la primitive native.
- **C — Synthèse sous « Nombre de tours »** : afficher directement sous le titre la synthèse activité/durée, même typographie que la ligne secondaire des cartes limites, titre+synthèse en un seul bloc, centré verticalement avec le contrôle blanc/violet — sans modifier la structure extérieure bleue ni ce contrôle.
- **Tests obligatoires** : couche de sélection unique (absence de seconde couche applicative) ; aucun chemin `onChange`/sélection/défilement ne ferme ; fermeture exclusivement Annuler/Valider ; brouillon distinct de la carte ; primitive native présente, aucun fallback `ScrollView` ; synthèse Tour présente et structurée ; non-régression des 3 acquis REWORK07B gelés ; `tsc`/ESLint/Jest complet.
- **Maîtrise du changement** : tableau `PRESERVE/CHANGE/FORBIDDEN` avant code, liste exacte des fichiers ; tout arrêt requis pour refonte de primitive/acquis gelé/extension d'écran.

## Tableau PRESERVE / CHANGE / FORBIDDEN (avant code)

| Élément | Statut |
|---|---|
| Icône Retour canonique, icônes Annuler/Valider, structure extérieure bleue Tour (REWORK07B) | **PRESERVE** |
| Primitive native `@expo/ui/swift-ui` `Picker`/`pickerStyle("wheel")`, ses deux colonnes minutes/secondes | **PRESERVE** |
| Contrôle blanc/violet du nombre de tours (`78×44`, carré `28×28`) | **PRESERVE** |
| Mécanisme `AnchoredRow.elevated`/`backdrop` existant | **CHANGE (portée corrigée, pas de refonte)** — voir B |
| `TourCard` : ajout d'un bloc titre+synthèse | **CHANGE** — voir C |
| Indicateurs de sélection natifs des deux `Picker` (A) | **BLOQUÉ, aucun CHANGE possible sans lever `NATIVE_PRIMITIVE_EXCEPTION_REQUIRED`** |
| Toute réintroduction de `ScrollView` pour la roulette | **FORBIDDEN** |
| Toute bande de sélection applicative superposée | **FORBIDDEN** |
| Tout autre écran, la navigation, la logique métier | **FORBIDDEN** |

**Fichiers réellement modifiés** (confirmés a posteriori, strictement dans ce périmètre) : `src/features/sessions/CompositionScreen.tsx`, `src/features/sessions/__tests__/CompositionScreen.test.tsx`, `src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx` (une assertion adaptée à la duplication désormais légitime du texte de synthèse). **Aucun fichier de `DurationWheelPicker.tsx` n'a été modifié** — la primitive native et son contrat restent intacts.

---

## A — Roulette native : zone de sélection unique

### Statut : `NATIVE_PRIMITIVE_EXCEPTION_REQUIRED`

### Diagnostic (avant tout code, conformément à la demande)

`NativeAppleDurationWheelPicker` (`DurationWheelPicker.tsx`) instancie **deux** `<SwiftUIPicker>` distincts côte à côte dans un `HStack` — un pour les minutes, un pour les secondes, chacun avec `modifiers={[pickerStyle("wheel"), ...]}`. Le constat iPhone (deux cadres gris séparés) provient nécessairement de l'un des deux Pickers natifs eux-mêmes, jamais d'un overlay applicatif : ce fichier n'ajoute aucune bande de sélection propre depuis REWORK06 (W-04/R4-06, acquis vérifié inchangé — confirmé par relecture, aucune ligne de ce mécanisme modifiée).

### Preuve technique

Inspection directe du code source réellement installé (pas une supposition sur la documentation Apple) :

- `node_modules/@expo/ui/build/swift-ui/Picker/index.d.ts` : l'unique composant `Picker` exposé lie directement `selection`/`onSelectionChange`/`children` à la vue SwiftUI `Picker` native — aucune prop ne contrôle l'indicateur de sélection.
- `node_modules/@expo/ui/build/swift-ui/modifiers/pickerStyle.d.ts` : `pickerStyle` accepte uniquement un style parmi `'automatic' | 'inline' | 'menu' | 'navigationLink' | 'palette' | 'segmented' | 'wheel'` — aucune variante multi-composant.
- `node_modules/@expo/ui/build/swift-ui/modifiers/index.d.ts` (registre complet, ~150 modificateurs exportés, énumérés intégralement) : aucun ne permet de masquer, fusionner ou reconfigurer l'indicateur de sélection propre à un `Picker` en style `.wheel`. Les candidats les plus proches (`background`, `overlay`, `mask`, `scrollContentBackground`) s'appliquent à la vue entière (jamais sélectivement à son indicateur interne) ou sont documentés pour des conteneurs de type `List`/`Form`, pas pour `Picker`.

Architecturalement, chaque instance `Picker(selection:)` de SwiftUI ne lie qu'**une seule** dimension de sélection ; il n'existe pas de variante SwiftUI publique acceptant plusieurs colonnes avec un indicateur partagé. Le composant système qui produit ce rendu (ex. l'app Horloge/Réveil d'Apple, bande grise unique traversant heures/minutes) repose sur `UIPickerView` (UIKit, multi-composant natif), une primitive distincte que `@expo/ui/swift-ui` n'expose pas.

### Options identifiées, examinées et rejetées

1. **Superposer un cadre applicatif unique par-dessus les deux `Picker`** pour masquer visuellement les deux indicateurs — rejeté : contredit directement l'acquis W-04/R4-06 (« un seul cadre de sélection natif SwiftUI — aucune bande superposée par ce fichier ») et l'esprit de la règle « Priorité aux primitives natives de l'OS » (corriger l'intégration, jamais contourner le rendu natif par un artifice visuel).
2. **Réintroduire une roulette `ScrollView` personnalisée** avec une bande de sélection unique dessinée à la main — **explicitement interdit** par cette même autorisation REWORK08.
3. **Écrire un module natif Swift exposant `UIPickerView` multi-composant** directement (contournant `@expo/ui`) — hors périmètre technique de cette mission : nécessiterait du code natif iOS, potentiellement un nouveau module Expo/pod natif, une révision du pipeline de build, et représente un changement d'ampleur largement supérieure à une correction cosmétique, exigeant une autorisation dédiée distincte.

### Décision

Aucune ligne de `DurationWheelPicker.tsx` n'a été modifiée pour le point A. Conformément à l'instruction explicite de l'autorisation, la mission s'arrête **avant tout remplacement** sur ce point précis et escalade en `NATIVE_PRIMITIVE_EXCEPTION_REQUIRED`, en attente d'une décision explicite (accepter le double indicateur comme limite native documentée, ou autoriser une piste hors périmètre de cette tranche).

---

## B — Roulette native : ne jamais fermer au toucher/défilement

### Statut : `IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`

### Diagnostic — chaîne d'événements AVANT correction

Recherche exhaustive de tout chemin fermant le sélecteur (`grep` sur `closeOverlay`/`onFocus`/`key=` dans `CompositionScreen.tsx`) : aucun callback natif (`handleMinutesChange`/`handleSecondsChange` ne font que mettre à jour un état brouillon local + haptique, jamais `onCancel`/`onValidate`) ; aucune gestion de focus suspecte ; aucun remount conditionnel (`DurationWheelPicker` n'est jamais recréé par une `key` changeante). Le seul chemin de fermeture pertinent est `composition-backdrop` (`Pressable`, `onPress={closeOverlay}`), couvrant tout l'écran, rendu dernier frère direct de `ScreenShell` dans le seul but de fermer un sélecteur au toucher **extérieur**.

**Cause racine identifiée** — un `zIndex` React Native ne se compare qu'entre frères partageant le même parent immédiat. `AnchoredRow.elevated` (portant `zIndex: 1` sur la ligne ouverte) est un **descendant** du `ScrollView` (`composition-body`), jamais un frère direct de `composition-backdrop` (frère direct de `ScreenShell`, rendu APRÈS le `ScrollView`). L'élévation de `AnchoredRow` ne « remontait » donc jamais jusqu'au niveau de comparaison réel : `backdrop`, dernier frère de `ScreenShell` au `zIndex` par défaut (0) — identique à celui, également par défaut, du `ScrollView` lui-même — gagnait la priorité de peinture/hit-testing sur l'**ensemble** du `ScrollView`, popover ancré compris. Toute pression sur la zone du popover (un tap net comme le début d'un geste de défilement) atteignait donc `composition-backdrop` en premier, qui fermait immédiatement le sélecteur, avant même que la vue native `Host` ne reçoive le geste. Le commentaire de code préexistant sur `AnchoredRow` affirmait à tort que son propre `zIndex` « suffit à rester peint au-dessus du backdrop » — vrai pour `ContextBand` (frère direct réel de `backdrop`), jamais vérifié pour `AnchoredRow` (imbriqué plus profondément) : une confusion de portée entre deux niveaux de l'arbre distincts, jamais testée sur device avant ce cycle (les tests Jest existants ciblent directement les `testID`, sans reproduire le hit-testing réel par superposition).

### Correction APRÈS

`composition-body` (le `ScrollView` lui-même — frère direct réel de `composition-backdrop`) porte désormais sa propre élévation conditionnelle (`bodyElevated = openOverlay === "countdown" || openOverlay === "finalPhase"`, réutilise `styles.elevated` déjà établi) — jamais pour la palette de couleur (`ContextBand`, déjà correctement élevée en tant que frère direct distinct). `AnchoredRow.elevated` reste inchangé et nécessaire : il départage désormais correctement les deux `AnchoredRow` entre elles (éviter qu'une ligne fermée ne peigne par-dessus le popover d'une ligne ouverte, UI-CTRL-002, un problème de portée différent). Les deux mécanismes coexistent, à deux niveaux de l'arbre distincts, chacun nécessaire.

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `CompositionScreen.tsx` | `bodyElevated` calculé ; `<ScrollView style={[styles.body, bodyElevated ? styles.elevated : null]}>` (était `style={styles.body}`) ; documentation corrigée sur `AnchoredRow`, le `ScrollView`, et `backdrop` (l'affirmation antérieure inexacte sur la portée du `zIndex` est explicitement rectifiée, pas silencieusement remplacée). |

Aucune ligne de `DurationWheelPicker.tsx` modifiée — la primitive native, son contrat `onValidate`/`onCancel` et son comportement documenté restent intacts, conformément à l'exigence de conservation.

---

## C — Synthèse sous « Nombre de tours »

### Statut : `IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`

Addendum précédemment `QUEUED_FOR_NEXT_COMPOSITION_REWORK` (`[ChatGPT] ADDENDUM EN ATTENTE — prochain run Roulette + synthèse Tour`, 2026-09-04), désormais explicitement autorisé et implémenté.

### Implémentation

- `compositionSummary` (résultat de `formatCompositionSummary`) calculé **une seule fois** dans `CompositionScreen`, réutilisé à la fois par `bottomAction` (déjà existant) et par `TourCard` (nouveau) — même contenu canonique, jamais deux calculs indépendants.
- `TourCard` accepte désormais une prop `summary: string`. Titre (`tourCardLabel`) et synthèse (`composition-tour-summary`) sont regroupés dans un nouveau bloc colonne unique (`tourCardTextBlock`, testID `composition-tour-text-block`) — même patron que `boundaryRowTitleSlot` des cartes limites.
- La synthèse réutilise **littéralement** le style `boundaryRowSecondaryLine` (pas une redéfinition locale) — garantit une typographie strictement identique à la ligne secondaire des cartes `Compte à rebours initial`/`Fin de séance`, plutôt qu'une simple ressemblance.
- Centrage vertical avec `tourCardControl` obtenu gratuitement par `tourHeader.alignItems: "center"`, déjà en place et inchangé.
- Structure extérieure bleue (`tourSectionContainer`) et contrôle blanc/violet (`tourCardControl`/`tourCardControlValue`/`tourCardControlChevronBox`) : **aucune ligne modifiée**.

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `CompositionScreen.tsx` | `compositionSummary` factorisé ; `TourCard({label, summary})` ; nouveau bloc `tourCardTextBlock`/`composition-tour-summary` ; `tourCardLabel.flex:1` déplacé vers `tourCardTextBlock`. |

---

## Tests et preuves

### Correspondance avec les tests obligatoires de l'autorisation

| Preuve exigée | Couverture |
|---|---|
| 1. Une seule couche applicative de sélection, absence de seconde couche | `DurationWheelPicker.test.tsx` — « W-04/R4-06 — never renders a second, overlaid selection frame » (inchangé, toujours vert — confirme qu'aucune régression n'a été introduite ; **ne couvre pas** le double indicateur natif lui-même, hors de portée d'un test JS, voir A) |
| 2. Aucun chemin `onChange`/sélection/défilement ne ferme | `CompositionScreen.test.tsx` — nouveau : « REWORK08-B — no chain of native selection-change events, however many, ever closes the picker » (séquence de 5 changements de sélection successifs, picker et body toujours montés/élevés) |
| 3. Fermeture exclusivement Annuler/Valider | Couvert par le test ci-dessus (fermeture confirmée uniquement via Valider après la séquence) + tests R4-09 existants inchangés |
| 4. État brouillon distinct de la carte | D-06 (existant, inchangé, toujours vert) |
| 5. Primitive native présente, aucun fallback `ScrollView` | `DurationWheelPicker.test.tsx` — test natif existant inchangé, toujours vert |
| 6. Synthèse Tour présente et structurée | `CompositionScreen.test.tsx` — nouveau : « REWORK08-C — shows the activity-count/duration summary directly under 'Nombre de tours'... » + « ...updates the Tour summary reactively... » |
| 7. Non-régression des 3 acquis REWORK07B gelés | Test REWORK08-C ci-dessus vérifie explicitement fond/rayon de la structure extérieure et géométrie du contrôle ; aucune ligne de `KodjoIcon.tsx`/icônes Retour/Annuler/Valider modifiée dans ce cycle |
| 8. `tsc`, ESLint, suite Jest complète | Voir ci-dessous |

### Commandes exécutées et résultats

```
npx tsc --noEmit
→ sortie vide, code de sortie 0

npx eslint .
→ sortie vide, code de sortie 0

npx jest src/features/sessions/__tests__/CompositionScreen.test.tsx --maxWorkers=2
→ Test Suites: 1 passed, 1 total
→ Tests:       65 passed, 65 total

npx jest --maxWorkers=2   (suite complète du projet)
→ Test Suites: 37 passed, 37 total
→ Tests:       492 passed, 492 total
```

### Incident de test rencontré et résolu (transparence)

Une première version d'un test comparait `label.parent`/`summary.parent` (nœuds de fibre React Test Renderer) via `toBe` — l'échec initial (élément non trouvé avant correction du bloc) a déclenché la sérialisation du message d'échec par Jest, qui a provoqué une récursion profonde (`Array.reduce` imbriqué) puis un `FATAL ERROR: JavaScript heap out of memory`, tuant le process de test. Corrigé en évitant toute comparaison directe de nœuds de fibre : un `testID` dédié (`composition-tour-text-block`) a été ajouté au conteneur, et le test vérifie désormais l'appartenance via `within(...)`, un pattern déjà établi partout ailleurs dans ce fichier de tests.

## Hypothèses non démontrées

- **A** : `NON_VERIFIABLE_DEVICE` — l'existence réelle de deux indicateurs séparés reste un constat iPhone rapporté par l'autorisation, non reproductible dans cet environnement ; la preuve technique fournie ici démontre l'**absence de mécanisme de correction disponible dans l'API installée**, pas une nouvelle capture du défaut lui-même.
- **B** : `NON_VERIFIABLE_DEVICE` — le diagnostic (portée du `zIndex`) est un fait de code vérifiable statiquement et un mécanisme React Native bien établi, mais la confirmation que ce mécanisme précis explique intégralement le symptôme observé sur iPhone (par opposition à un facteur natif additionnel non identifiable sans device) reste non vérifiée expérimentalement. Un test technique vert ne prouve pas le geste réel.
- **C** : `NON_VERIFIABLE_DEVICE` — rendu visuel exact (centrage perçu, lisibilité) non vérifiable sans capture.

## Fichiers modifiés

| Fichier | +/- |
|---|---|
| `src/features/sessions/CompositionScreen.tsx` | +130 / -24 |
| `src/features/sessions/__tests__/CompositionScreen.test.tsx` | +119 / -2 |
| `src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx` | +4 / -1 |

## Éléments non corrigés ou hors périmètre

- **A** : non corrigé, escaladé — voir ci-dessus.
- Aucun autre point cosmétique traité ; aucun écran suivant démarré.

## Vérifications restant à effectuer sur appareil réel

- **B** : confirmation que toucher/faire défiler une roue n'entraîne plus la fermeture, sur device réel — seule preuve définitive du geste.
- **C** : confirmation visuelle du centrage et de la lisibilité de la synthèse sous « Nombre de tours ».
- **A** : reste ouvert quelle que soit la décision — si acceptée comme limite native, aucune vérification device supplémentaire n'est requise pour ce point ; si une piste alternative est autorisée, elle nécessitera sa propre vérification.

## Modifications réalisées

Voir sections A/B/C ci-dessus pour le détail exhaustif.

## État Git

- Branche : `feat/creation-seance-catalogue`
- HEAD avant ce cycle : `8da42add6fc3c816f27a1b83a3a6e09caa5f0393`
- Ce rapport sera committé séparément du commit de code applicatif, conformément à l'exigence de livraison documentaire (`CLAUDE.md`).

### SHA finaux (renseignés après commit)

- **SHA applicatif** : `2582aeb5aafdde61a635326236ef156762ffe308` (`fix(T01-S07/S08): REWORK08 — zIndex du body + synthèse Tour (B/C)`).
- **SHA rapport** : voir commit `docs(orchestration): ...` immédiatement suivant, contenant ce fichier — renseigné dans le commentaire de transition GitHub.
- **État Git final** : `working tree clean`, branche `feat/creation-seance-catalogue`, HEAD local = HEAD distant après push (vérifié post-commit).

## Statut de clôture

`NATIVE_PRIMITIVE_EXCEPTION_REQUIRED` (point A, bloquant, décision requise) — B et C sont pleinement `IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`, committés et poussés dans ce même cycle plutôt que retenus par le blocage isolé de A.

## Self-check Claude

- Le seul commentaire publié depuis mon dernier checkpoint (REWORK07B, HEAD `8da42ad`) a été relu intégralement avant implémentation.
- Aucune ligne de `DurationWheelPicker.tsx` n'a été modifiée — la primitive native et son contrat restent strictement intacts, conformément à l'exigence de conservation des points A et B.
- Le diagnostic B est fondé sur une lecture de code vérifiable (portée du `zIndex` React Native), pas une supposition non étayée ; la preuve A repose sur l'inspection directe du package `@expo/ui` réellement installé, pas sur une hypothèse non vérifiée sur l'API SwiftUI.
- Aucune bande de sélection applicative n'a été ajoutée ; aucune roulette `ScrollView` n'a été réintroduite.
- Les 3 acquis REWORK07B gelés sont vérifiés inchangés par un test dédié, pas seulement affirmés.
- `tsc --noEmit`, `eslint .` et la suite Jest complète (37 suites, 492 tests) sont verts au moment de la rédaction de ce rapport.
