# Phase 2 rework 01 — Roulette native Apple (Composition)

## Identifiant et objectif

- **Identifiant** : `P0-phase02-composition-rework01-native-wheel`
- **Issue** : #35, addendum obligatoire `[ChatGPT] PHASE02 REWORK01 ADDENDUM — NATIVE APPLE WHEEL TARGET` (2026-09-03T12:47:34Z).
- **Objectif** : remplacer la réimplémentation maison (`ScrollView` + calcul manuel) par la roulette native Apple (SwiftUI, `@expo/ui`) pour les roulettes de Composition (Compte à rebours initial, Fin de séance), extraire et documenter les bornes exactes de toutes les roulettes numériques depuis les sources fonctionnelles, et fermer l'écart de méthode restant.

## Branche et commit de départ

- **Branche** : `feat/creation-seance-catalogue`
- **Baseline** : `a41d5a62b588b315f454871654dddc50e3650a93`
- **Précondition Git vérifiée avant tout code** : `git fetch` + `git rev-parse origin/feat/creation-seance-catalogue`, identique ; `git status --short` vide.

## Périmètre réellement traité

- Investigation et décision d'architecture (primitive native, disponibilité Expo Go).
- Résolution de l'ARBITRAGE 1 (pas des secondes) — voir section dédiée.
- Implémentation de la roulette native pour `DurationWheelPicker` (Compte à rebours initial, Fin de séance de Composition) — iOS uniquement, `Platform.select` runtime.
- Extraction et documentation du référentiel complet des bornes (toutes les roulettes listées par l'addendum, y compris celles d'Exercice, **non implémentées** dans ce cycle — hors périmètre Composition).
- Tests automatisés pour les deux chemins (natif iOS, maison Android/web).
- **Non traité, explicitement bloqué** : preuve device (POC minimal sur appareil réel, capture/vidéo iPhone) — voir section dédiée.

## Décision d'architecture

### Primitive retenue

`@expo/ui` est une dépendance **déjà installée** (`package.json`, `~57.0.13`) — confirmé par lecture directe, aucune nouvelle dépendance ajoutée. Investigation du code source local (`node_modules/@expo/ui/src/`) :

- `@expo/ui` (entrée universelle) expose un `Picker` cross-plateforme avec `appearance="wheel"`, mais son implémentation iOS (`Picker.ios.tsx`) délègue directement à `@expo/ui/swift-ui`'s `Picker` **sans** l'envelopper dans un `Host` — la composition à deux colonnes (minutes + secondes) que Composition nécessite n'est de toute façon pas possible avec une seule instance de ce composant (un `Picker` = une seule colonne).
- Retenu directement : **`@expo/ui/swift-ui`** (`Host` + `HStack` + `Picker` × 2, `pickerStyle('wheel')`) — le repli explicitement prévu par l'addendum pour une composition multi-colonnes, confirmé nécessaire dès la première investigation plutôt qu'après un échec du chemin universel.

### Compatibilité Expo Go

Vérifiée par recherche web + lecture directe de la documentation officielle Expo (`docs.expo.dev/versions/latest/sdk/ui/swift-ui/`, `docs.expo.dev/versions/latest/sdk/ui/swift-ui/picker/`) : le module `swift-ui` est explicitement listé **« Included in Expo Go »** — aucun build de développement personnalisé requis a priori. `Host` est requis pour tout composant `@expo/ui/swift-ui` (confirmé par la même documentation : « Using a component from `@expo/ui/swift-ui` requires wrapping it in a `Host` component »).

### Contrainte de largeur

Documentation officielle : « segmented and wheel pickers stretch to the width they are given, so they collapse under `matchContents` » — une largeur explicite est donc requise sur `Host` (`nativeHost.width = 260`, valeur par défaut raisonnée, **non confirmée contre un rendu device réel**).

## Résolution de l'ARBITRAGE 1 — pas des secondes (5 s, pas 1 s)

**Écart de méthode fermé** : les cycles précédents (audit du 02/09, plusieurs rapports ultérieurs) avaient classé ce point comme une contradiction non résolue entre le Registre des décisions (D-089) et `13 – Contrats d'écran.md` (CE-T01-07/10), et conservé un pas de `1` s en attendant un arbitrage qui n'est jamais venu.

**Relecture exacte, effectuée dans ce cycle** :
- **D-089** (Registre) : « Le Compte à rebours initial et la Fin de séance acceptent une durée de `0 s à 59 min 59 s` (0 à 3599 secondes) » — borne la plage, **silencieux sur le pas**.
- **CE-T01-07** (`13 – Contrats d'écran.md`, ligne 445) : « Les secondes avancent par pas de `5`. » — explicite, et **« Tests bloquants : deux roulettes fonctionnelles ; bornes et pas conformes aux règles métier ; […] »** (ligne 451) : le pas y est un critère de test bloquant, pas une note secondaire.
- **CE-T01-14** (Durée d'Exercice, ligne 598) : « selon le même contrat que CE-T01-07 » — même pas, appliqué de façon transverse.

**Conclusion** : D-089 ne **contredit** pas CE-T01-07 (aucune mention de pas de `1`), il est simplement **muet** sur ce point. L'ordre de préséance `INDEX.md` §6 (Registre > … > Contrats d'écran) ne s'applique qu'en cas de contradiction réelle — un document de rang inférieur peut légitimement préciser un détail que le document de rang supérieur ne couvre pas, sans que cela constitue une contradiction. Le pas de `5` s **est donc implémenté** dans ce cycle, fermant l'arbitrage au lieu de le reconduire une quatrième fois.

**Conséquence** : `59 s`, `99 s`… ne sont plus des valeurs atteignables par les roulettes de durée — la dernière valeur de chaque minute est désormais `55 s`. `fromTotalSeconds` ramène toute valeur non alignée au multiple de `5` le plus proche (défense en profondeur).

## Référentiel des bornes — toutes les roulettes numériques (exigé par l'addendum)

| Roulette | Min | Max | Pas | Défaut | Politique du zéro | Unité | Source | Implémenté dans ce cycle |
|---|---|---|---|---|---|---|---|---|
| Compte à rebours initial (min/s) | `0 s` | `59 min 59 s` (3599 s) | `5 s` (secondes) ; `1` (minutes) | `10 s` | `0 s` autorisé, rend la phase instantanée | s / min | D-089, D-004, CE-T01-07 | **Oui** (roulette native) |
| Fin de séance (min/s) | `0 s` | `59 min 59 s` (3599 s) | `5 s` (secondes) ; `1` (minutes) | `5 s` | `0 s` autorisé, rend la phase instantanée | s / min | D-089, D-004, CE-T01-10 (« identique à CE-T01-07 ») | **Oui** (roulette native) |
| Durée d'un Exercice (min/s) | `1 s` | `99 min 59 s` (5999 s) | `5 s` (secondes, « selon le même contrat que CE-T01-07 ») ; `1` (minutes) | `30 s` | **`0 s` non documenté comme valeur autorisée** (min explicite `1 s`, doc08 l.921) | s / min | doc08 §Écran Exercice (l.921), CE-T01-14 | Non — hors périmètre Composition, documenté seulement |
| Pause après Série | `0 s` | `99 min 59 s` (5999 s) | `5 s` (secondes, même contrat) ; `1` (minutes) | `0 s` | `0 s` autorisé (pause désactivée) | s / min | doc08 §Écran Exercice (l.923) | Non — hors périmètre, documenté seulement |
| Nombre de répétitions | `1` | `99` | `1` (entier) | `1` | Non applicable (jamais `0`) | — | D-092, doc08 (l.922) | Non — hors périmètre, documenté seulement |
| Nombre de Séries | `1` | `99` | `1` (entier) | `1` | Non applicable (jamais `0`) | — | D-092, doc08 (l.924) | Non — hors périmètre, documenté seulement |

**Aucune plage n'a été inférée depuis les 3 valeurs visibles d'une frame Figma** — chaque ligne cite sa source textuelle exacte (Registre ou Conception fonctionnelle détaillée), conformément à l'exigence explicite de l'addendum. Aucun `CLARIFICATION_REQUIRED` nécessaire : toutes les bornes utiles à ce cycle (Compte à rebours, Fin de séance) sont explicitement documentées et cohérentes entre elles.

**Point relevé, non bloquant pour ce cycle** : la Durée d'Exercice a un minimum documenté de `1 s` (doc08), alors que `wheelPickerMath.ts`/`DurationWheelPicker` autorisent structurellement `0 s` sur toute colonne minutes/secondes (aucune borne basse spécifique à `1` n'est appliquée nulle part dans le code actuel pour ce champ précis). Ceci est un écart potentiel, mais **hors périmètre de ce cycle** (Exercice n'est pas modifié) — signalé pour un cycle ultérieur.

## Modifications réalisées

**`src/features/sessions/wheelPickerMath.ts`** : `WHEEL_SECONDS_STEP = 5`, `WHEEL_SECONDS_ITEM_COUNT = 12`, `WHEEL_SECONDS_MAX_INDEX = 11` (remplace l'ancien `59`) ; nouvelles fonctions `secondsIndexToValue`/`secondsValueToIndex` ; `fromTotalSeconds` ramène désormais les secondes au multiple de `5` le plus proche.

**`src/features/sessions/DurationWheelPicker.tsx`** (réécrit) : `DurationWheelPicker` devient un simple aiguillage `Platform.OS === "ios" ? <NativeAppleDurationWheelPicker/> : <LegacyDurationWheelPicker/>` — même interface de props, aucun appelant (`CompositionScreen.tsx`, `ExerciseScreen.tsx`) modifié. `NativeAppleDurationWheelPicker` (nouveau) : `Host` + `HStack` + deux `Picker` SwiftUI (`pickerStyle('wheel')`), options déclarées via `<Text modifiers={[tag(valeur)]}>`. `LegacyDurationWheelPicker` (renommage de l'ancienne implémentation) : logique de glissement/toucher direct inchangée, adaptée pour la conversion index↔valeur de la colonne secondes (pas de `5`).

**Tests** : `wheelPickerMath.test.ts` (fonctions/constantes du pas mises à jour et étendues), `DurationWheelPicker.test.tsx` (18 tests existants revalidés sous `Platform.OS="android"` forcé + 6 nouveaux tests sous `Platform.OS="ios"` pour le chemin natif), `compositionPresentation.test.ts` (3 assertions de bornes hautes corrigées), `CompositionScreen.test.tsx` (3 tests convertis de `fireEvent.scroll` vers l'événement natif `selectionChange`, `Platform.OS="ios"` forcé explicitement pour tout le fichier).

## Preuves et tests

- `npx tsc --noEmit` → **PASS, 0 erreur**.
- `npx eslint .` (dépôt entier) → **PASS, 0 erreur, 0 avertissement**.
- `npx jest --maxWorkers=2` → **PASS, 35/35 suites, 437/437 tests**. Aucune régression une fois toutes les répercussions du pas de `5` propagées (6 tests initialement rouges par effet de bord direct : `wheelPickerMath.test.ts` ×6 au premier passage, corrigés puis étendus à 37 ; `compositionPresentation.test.ts` ×3 ; `CompositionScreen.test.tsx` ×3 — tous corrigés, aucun contourné).
- **Tests automatisés explicitement exigés par l'addendum** : génération de plage (`WHEEL_SECONDS_ITEM_COUNT`/`secondsIndexToValue`/`secondsValueToIndex`), défauts (`initializes both columns from the supplied totalSeconds`), propagation d'état (`propagates a native minutes selection change to onChange`), valeurs limites (`clamps the upper bound…`, `secondsValueToIndex clamps a value beyond the last step`).

## Mandatory proof before closure — statut exact par point (addendum)

1. **« A minimal on-device proof of concept… before integrating every wheel »** : **BLOQUÉ**. Cet environnement ne dispose d'aucun simulateur iOS ni d'appareil physique — aucun POC device n'a pu être exécuté avant l'intégration. L'intégration a été réalisée directement, avec la meilleure preuve de substitution disponible (tests automatisés du chemin JS, revue de code de l'API native).
2. **« iPhone capture/video »** (rendu cylindrique/fondu/échelle, défilement/magnétisme, première/dernière valeur, espacement horizontal multi-colonnes, valeur restaurée après fermeture/réouverture) : **BLOQUÉ** — aucun outil de capture d'écran ni de caméra disponible dans cet environnement.
3. **Tests automatisés** (génération de plage, défauts, propagation d'état, valeurs limites) : **FAIT** — voir « Preuves et tests » ci-dessus.
4. **Rapport avec package/API/version exacts et repli plateforme** : **FAIT** — `@expo/ui@~57.0.13`, `@expo/ui/swift-ui` (`Host`, `HStack`, `Picker`, `Text`, modificateurs `pickerStyle`, `tag`, `accessibilityLabel`), repli explicite vers l'implémentation maison sur Android/web (`Platform.OS !== "ios"`), voir « Modifications réalisées » ci-dessus.

**Aucune clôture n'est déclarée.** Conformément à l'instruction explicite de l'addendum (« do not declare the wheel compliant from unit tests alone »), les tests ci-dessus prouvent uniquement la cohérence de la couche JS de ce composant — jamais le rendu ni le comportement gestuel réels de la roulette SwiftUI elle-même, qu'aucun outil de cet environnement ne peut exercer.

## Hypothèses non démontrées

- Largeur `260` du `Host` — valeur par défaut raisonnée, non mesurée contre un rendu device.
- Rendu réel de `pickerStyle('wheel')` sur le device de test de l'utilisateur (perspective, fondu, échelle) — entièrement délégué à SwiftUI, jamais observé depuis cet environnement.
- Disponibilité réelle du module natif dans l'environnement Expo Go précis utilisé par l'utilisateur (SDK/version d'Expo Go installée) — la documentation officielle l'annonce inclus, mais aucune vérification directe sur l'installation réelle de l'utilisateur n'a été possible.
- Minimum `1 s` documenté pour la Durée d'Exercice (doc08) vs. absence de cette borne basse spécifique dans le code actuel — écart potentiel non traité (hors périmètre Composition).

## Éléments non corrigés ou hors périmètre

`NumberWheelPicker` (Répétitions/Séries) — non touché, roulette native non implémentée pour ce composant dans ce cycle (Exercice hors périmètre de la phase Composition). `CTRL-02` (arbitrage des gestes/empilement), `LAY-06/07`, tout écran autre que Composition — non touchés.

## Vérifications restant à effectuer sur appareil réel

L'intégralité des points 1 et 2 de « Mandatory proof before closure » ci-dessus — sans exception, ce cycle ne peut fournir aucune preuve visuelle/gestuelle réelle.

## Fichiers modifiés

- `src/features/sessions/wheelPickerMath.ts`
- `src/features/sessions/DurationWheelPicker.tsx`
- `src/features/sessions/__tests__/wheelPickerMath.test.ts`
- `src/features/sessions/__tests__/DurationWheelPicker.test.tsx`
- `src/features/sessions/__tests__/compositionPresentation.test.ts`
- `src/features/sessions/__tests__/CompositionScreen.test.tsx`
- `.github/orchestration/reports/2026-09-03_P0-phase02-composition-rework01-native-wheel.md` (créé — ce rapport)

## Commit final

Voir la réponse de clôture pour les hashes exacts.

## État Git

Voir la réponse de clôture pour `git status --short`, HEAD local et HEAD distant vérifié après push.

## Statut

`PHASE02_REWORK01_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`

La phase Composition reste ouverte, conformément à l'addendum. Aucune phase suivante commencée.
