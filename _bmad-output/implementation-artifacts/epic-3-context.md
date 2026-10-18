# Epic 3 Context: Régler chaque Série dans la Feuille Paramètres d'exécution

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Dans la Feuille Paramètres d'exécution, Hermann choisit le Mode, le Changement de côté, l'Ordre des côtés et le Régime dans des popovers natifs ancrés à leur ligne. Il règle chaque Cible, numérique ou à l'échec, sur la roulette native avec ses ✕ / ✓, présentée sans flèche, centrée horizontalement, sur voile, dans `WheelPickerOverlay` de PRE-3 et fermée par ✕ / ✓ seulement (*Q37, 2026-10-17*) : minutes-secondes en Durée, une colonne en Répétitions. Il gère le Tableau des séries variables par une Cellule active et le Pied commun, avec glisser, retrait et annulation. Il lit la Durée totale selon sa nature et peut l'inverser si la règle le permet. Changer de Mode ou de N ne perd aucun réglage. Rien n'est enregistré avant le ✓ de la Feuille puis `Terminer`. Une story de faisabilité sur iPhone (3.1, S0) précède toute autre story d'interface.

## Stories

- Story 3.1 : Faisabilité sur iPhone du Popover natif dans la Feuille (S0)
- Story 3.2 : Brouillon de Feuille : Cibles typées, Régime, mémoire par Mode, retrait et annulation
- Story 3.3 : Popovers Mode, Changement de côté, Ordre des côtés et Régime
- Story 3.4 : Sélecteur de cible en Durée : option échec et grisé manipulable
- Story 3.5 : Sélecteur de cible en Répétitions à une colonne
- Story 3.6 : Tableau des séries variables : Cellule active, Pied commun, retrait, glisser
- Story 3.7 : Ligne Durée totale et Inversion dans la Feuille
- Story 3.8 : Accessibilité et recette de la Feuille

## Requirements & Constraints

- **Règles communes (3.1, 3.3 à 3.8).**
  - Les garde-fous « zéro `ScrollView` iOS » restent verts et inchangés : `DurationWheelPicker.test.tsx:378` et `:619`, `NumberWheelPicker.test.tsx:267`.
  - Primitive native partout où iOS en a une (NFR-02). Une primitive déjà acceptée n'est pas remplacée ; seule la liste fermée de NFR-03 l'est. Tout écart visuel est signalé à Hermann (P33), jamais corrigé par une réimplémentation.
  - NFR-04 : aucune story ne déclare de conformité visuelle.
  - Avant de coder, la story relève les frames qu'elle cite, à partir de `docs/preparation/PRE-4/figma/<frame>.json.gz` et de `fermeture-maitres-et-variables.json.gz` : un tableau par élément et par état, repris par 4.6. Aucun chiffre lu n'y devient une règle. Un élément absent de Figma est classé `NON VÉRIFIABLE`.
  - Lexique et apostrophe `’` (NFR-08), jetons intouchés, « Réduire les animations » respecté (NFR-10), cibles tactiles ≥ 44 × 44 pt (NFR-09, P30).
- **Brouillon (3.2).**
  - Cible = `SeriesTarget` (`NUMBER` ≥ 1, `FAILURE`, `UNSET`), jamais 0 ni sentinelle. Les quatre combinaisons Mode × Régime acceptent `FAILURE`.
  - Valeurs de création (P19, P37) : Mode `—`, N = 1, Pause 0 s, `identiques`, Bip `Aucun`, côté non renseigné, Cible Durée `UNSET`. Choisir Répétitions en premier donne `NUMBER 1` ; passer de Durée à Répétitions laisse `UNSET`. Le Mode ne revient jamais à `—`.
  - Changement de Mode (H26) : aucune conversion ; tout le reste est conservé ; Cibles `UNSET`, sauf `FAILURE`. Mémoire par Mode et par identité de ligne (H4). Au retour, le dernier choix explicite l'emporte (H27).
  - Régime : `variables` copie N lignes ; revenir à `identiques` reprend la ligne 1 de l'ordre courant ; le Régime ne se déduit jamais des valeurs.
  - N ∈ 1..99 : la Réserve est restituée dans l'ordre ; une ligne ajoutée copie la dernière, `FAILURE` comprise. À N = 1, l'état effectif est uniforme et l'Ordre est `Un côté après l’autre`, l'état demandé étant restauré si N remonte.
  - Retrait : `pendingRemoval`, invalidé par toute modification du Brouillon (liste de Q29). Ouvrir puis fermer une surface sans appliquer ne l'invalide pas. Retrait refusé à N = 1.
  - ✓ de la Feuille : `validateForSave(params, baseline)`, puis production d'un bloc, sans identité, Réserve, mémoire ni `pendingRemoval`. Violation → union, sans état partiel. N hérité (P42) : accepté, testé au domaine seulement.
- **Popovers (3.3).**
  - Ordre du corps : FR-03-02. Mode : `Durée` puis `Répétitions`. Côté : `Sans changement`, `Droite puis gauche`, `Gauche puis droite`, libellés accessibles en toutes lettres. Ordre : deux options, ligne absente en `Sans changement`. Régime : `identiques` / `variables` avec chevron, trois états.
  - À N = 1 : Régime non modifiable ; Ordre des côtés masqué à N = 1 ; l'Ordre choisi est conservé et réaffiché dès N ≥ 2 — source : Q38 (n'est plus atténué à `UNSELECTED_OPACITY`).
  - L'interrupteur « Séries variables » et l'option ou l'écran « échec » disparaissent.
  - ± à l'appui seulement ; maintien à ≈ 500 ms puis toutes les 150 ms, paliers 5 puis 10 pour N et les Pauses ; Bip, Compte à rebours et Fin au pas de 1. Cible à renseigner (Durée ou Répétitions, `identiques` ou `variables`) : fond `#FFF1F0` (`color.dangerSurface`), sans contour ni liseré, sans message, ✓ indisponible, indice VoiceOver « Valeur à renseigner » (*Q35*, remplace le contour orange `#FF8D28` de 1,5 de P4 ; D-337). La Pause 0 s est valide.
- **Sélecteur Durée (3.4).**
  - Composition : « Aucune durée, à l’échec », un filet, puis la roue minutes 00..58 et secondes au pas de 1 (*Q36, 2026-10-17 : le pas de 5 est levé*). Pas de rebouclage (H15, P21). `00:00` n'est jamais une Cible : le ✓ est indisponible (Q15, FR-08-04).
  - L'échec atténue le bloc à 45 % ; tourner la roue revient au numérique sans déverrouillage (P5).
  - Ouverture par `selectorOpeningPosition` : hors bornes → `nearestGridValue`, simple bornage depuis Q36 (Q21 : 5999 → 3535 ; 7 → 7, valeur valide) ; `UNSET` → 00:05 (Q25). Pendant l'ouverture, la ligne garde son affichage. ✕ ne change rien ; ✓ applique au Brouillon seulement (Q12).
- **Sélecteur Répétitions (3.5).** Une colonne : « Aucune répétition, à l’échec », puis 1..100 (Q8, Q14), sans filet ni grisé ajouté. Ouverture : 150 → 100, `UNSET` → 1. Le stepper en ligne de la Cible est retiré. Libellé de la ligne : `Nombre de répétitions` (H14).
- **Tableau (3.6).**
  - Ligne : poignée, numéro, cellules Cible et Pause, croix. Les deux colonnes restent même si tout est à l'échec.
  - Une seule Cellule active, désignée par une barre d'accent, un fond de colonne et la mention `Série i · <champ>`. Toucher une Cible ouvre le Sélecteur, et la cellule reste active après son ✓ ou son ✕ (Q13).
  - Pied commun : Durée au pas de 1, maintien accéléré existant, dans 5..3535 (*Q36*), Répétitions 1..100, Pause 0..300. Indisponible sans Cellule active ou sur `FAILURE` (Q13, Q26, H33). Sur `UNSET` : + → minimum, − indisponible. Hors grille, voir P38.
  - Croix sans confirmation ; message « Série supprimée — Annuler » ; croix indisponible à N = 1.
  - Glisser et actions `Monter`/`Descendre la série {n}` conservés. Affichage `1 série` / `3 séries` (H22). Pas de Bip par ligne (P22).
- **Durée totale (3.7).**
  - Durée, `identiques`, Cible numérique → roulette d'Inversion. Toutes Cibles numériques en `variables`, ou Répétitions avec Bip → lecture seule (`≈` en Répétitions). Mélange → `≥` en lecture seule (30 s / 45 s / échec, Pauses 10 / 20 / 30 → `≥ 2 min 15 s`). Sans Bip en Répétitions, tout à l'échec ou `UNSET` → aucune ligne.
  - Roulette : T(1)..T(99) à la seconde (30 s + 10 s : `40 s`..`66 min`, H8), sans option échec.
  - 160 s → N = 4, sans message ; 180 s → N = 5 et message littéral `Durée ajustée à 3 min 20 s pour respecter un nombre entier de séries.`, avec `Annuler`.
  - Annonces VoiceOver : `≈` « estimation », `≥` « total prévisionnel partiel ».
- **Accessibilité (3.8).** Focus confiné, puis rendu à la Carte. Aucune action extérieure pendant qu'une roulette est ouverte (FR-22-11). Annonces par clés du lexique (H23). Table FR-03-13 couverte par des tests. Texte à 100, 135 et ≈ 200 %, largeurs 360, 402 et 440. Section Feuille de `recette-iphone.md`, colonne Résultat vide.

## Technical Decisions

- **AD-2.** `ExecutionParametersDraft.ts` est l'unique machine du Brouillon, en fonctions pures. Il porte la mémoire par Mode et par identité de ligne, la précédence H27, `pendingRemoval` et l'Inversion. Il ne contient ni surface ni Cellule active.
- **AD-7.**
  - La `Modal` de la Feuille est conservée. Sur iOS, les popovers de choix (Mode, Côté, Ordre, Régime) passent par le `Popover` SwiftUI de `@expo/ui` 57.0.13, dans un `Host`. Les roues (Sélecteur de cible, commun ou de ligne, et Durée totale) s'ouvrent dans `WheelPickerOverlay` (`src/features/sessions/`), composant PRE-3 accepté : couche centrée, voile atténué non pressable, position indépendante du déclencheur, sans flèche ; fermeture par ✕ / ✓ seulement ; roulettes et `PickerToolbar` inchangées (*Q37, rendu remplacé ; historique : « popovers et roulettes passent par le `Popover` »*). Hors iOS, repli : `SegmentedControl` et roulettes `Legacy*`, avec parité testée sous Jest.
  - *Q41 (2026-10-17, E-15), présentation remplacée :* sur iOS, Changement de côté et Ordre des côtés (`SegmentedControl` inchangé), roue de « Durée d’une série » et roue de Durée totale (`DurationWheelPicker` inchangé) s'ouvrent dans `AnchoredPanel` (`src/features/activities/AnchoredPanel.tsx`), panneau sans flèche juste sous le champ, aligné à droite, au-dessus du contenu, dans le contenu défilant ; toucher extérieur = fermeture sans application ; ni `Modal` ni `Popover`. Le Mode garde le `Popover` SwiftUI. `WheelPickerOverlay` n'est plus utilisé par la Feuille (inchangé, toujours utilisé par Composition). Par cohérence (décision consignée le 2026-10-17), toutes les roues de la Feuille — Cible Durée, Cible Répétitions (3.5), Cellule active du tableau (3.6), Durée totale — s'ouvrent dans ce même panneau, sous leur champ ou leur cellule, aligné à droite ; Q37 ne s'applique plus à aucune roue de la Feuille. 3.5 et 3.6 réutilisent `AnchoredPanel` (placement calculé depuis la ligne ou la cellule).
  - Un test iOS par popover vérifie l'absence de `Modal` et de `Pressable` de substitution. Pour une roue, le test vérifie son rendu dans `WheelPickerOverlay`, sans `Popover`, voile non pressable (Q37). *Depuis Q41 : pour la roue de Durée commune, celle du total et les panneaux Côté et Ordre (iOS), le test vérifie le panneau sans flèche sous le champ, aligné à droite, sans `Popover` ni `Modal` supplémentaire, et la fermeture extérieure sans application (tests `PRE4-Q41`).*
  - Roulettes étendues par props optionnelles (pas, bornes, `failureOption` dont le rappel émet une `SeriesTarget`) ; sans ces props, comportement inchangé. Elles reçoivent une valeur déjà dans les bornes et ne recalent jamais (*Q36 : secondes de la roulette de Cible au pas de 1*). Aucune haptique ajoutée.
  - `PickerToolbar` reçoit une seule prop, `validateDisabled`, identique dans ses deux copies. Le grisé est une opacité autour de la primitive, jamais un `disabled`.
- **AD-8.** Glisser par responder PRE-3, sans `List` native. Steppers permanents retirés. Le message « Série supprimée — Annuler » réutilise le message d'ajustement existant.
- **AD-11.** `UNSELECTED_OPACITY` (0,45) est créée dans `src/shared/ui/opacity.ts`, hors jetons, et remplace la constante locale de la Feuille.
- **AD-13.** `validateForSave(params, baseline)` est la seule validation. La ligne de base est alignée par identité de ligne ; une valeur héritée non modifiée est tolérée (H25), mais une `UNSET` bloque toujours.
- **AD-15.** Un réducteur d'interface pur, dans la Feuille, gère `openSurface` (`none` | `popover(mode|side|order|regime)` | `selector(rowTarget(l)|commonTarget|total)` | `stepper(champ)`, avec une clé `surfaceKey` de génération croissante) et `activeCell` (`none` | `{ ligne, target|pause }`). Résumé de T1 à T27 :
  - **Une seule surface** ; ouvrir une surface ferme la précédente sans appliquer. `stepper` et `activeCell` ne coexistent jamais (T15, T16, T20). `selector(rowTarget(l))` implique `activeCell = { l, target }`.
  - **Surfaces natives** (popover, selector) : l'appui extérieur est absorbé, ferme sans appliquer, range la Cellule et n'active rien (T7, T10). Ce cas couvre ✓, ✕ de la Feuille et `Annuler` (T19, T27). *Q37 : pour un `selector`, le voile de `WheelPickerOverlay` absorbe l'appui **sans fermer** la roue ; `openSurface` et `activeCell` restent inchangés ; seuls ✕ / ✓ ferment (T5, T6, T25, T26) ; pas de `onIsPresentedChange`, T7 et T8 ne visent plus que les popovers.*
  - **Rappel tardif** `onIsPresentedChange(false)` d'une autre clé, ou alors que `openSurface = none` : ignoré (T8). ✓ et ✕ ferment par transition explicite (T5, T6, T25, T26).
  - **Stepper** (état RN) : l'appui ailleurs atteint sa cible. Il range le stepper et active une cible inoffensive dans le même geste : autre champ, cellule ou ligne de popover (T20, T21, T15) ; Cible commune ou total, chevron, ✓/✕ (T24, T14, T19). Ses ± ne le ferment jamais, y compris le − de N qui retire des lignes (T22).
  - **Sélecteur de ligne** : il s'ouvre avec la Cellule (T2, T3) ; la Cellule reste active après son ✓ ou son ✕ (T5, T6). La valeur reste locale jusqu'au ✓.
  - **Pied commun** : il agit si `openSurface = none`, si une Cellule est active et si `stepTarget` est disponible (T11) ; sinon il est indisponible (T12). L'appui extérieur range la Cellule ; la croix ne retire jamais la ligne (T13).
  - **Croix** : active seulement si aucune surface n'est ouverte et qu'aucune Cellule n'est active (T18).
  - **`Annuler`** : il restaure la ligne sans ranger la Cellule (T27).
  - **Ligne disparue** : la Cellule ou le Sélecteur concerné revient à `none`. Les séquences R-3.6-08 et S4 sont rejouées dans les tests.
- **AD-16.** Le seul mécanisme ± est `InlineStepper`/`ProfileStepper`, `createHoldRepeater`, `steppedValue`, `StepperHoldPolicy`.
  - Fonctions pures à ajouter dans `ExecutionParameters.ts` : `nearestGridValue` (bornage, *Q36*), `selectorOpeningPosition` et `stepTarget` (`FAILURE` → `unavailable` ; `UNSET` : + → min, − → `unavailable` ; P38).
  - Corriger `steppedValue`, qui ne doit jamais aller à contresens.
  - Nouvelle politique de maintien pour la Cible Durée : base 5, paliers 5 puis 10 (H19). La Cible Répétitions garde `EXECUTION_ACCELERATED_HOLD_POLICY`. `PROFILE_HOLD_POLICY` est inchangée.
- **AD-5.** La nature, l'Inversion (`isTotalDurationInvertible`, `invertTotalDuration`) et le formateur `durationFormat.ts` viennent du domaine. La Feuille ne formate aucune durée.

## Existing Code & Remaining Gaps

Source : bilan approuvé (`bilan-ecarts-2026-10-17.md`), vérifié contre le code à `12183548`. Réutiliser l'existant conforme et développer l'écart seulement. **Ne pas remplacer :** la `Modal` et son fondu ; `DurationWheelPicker`/`NumberWheelPicker` et leurs garde-fous ; `InlineStepper` et `EXECUTION_*_HOLD_POLICY` ; `DraggableRow` et monter/descendre ; `DisclosureControl` ; le message d'ajustement avec `Annuler` ; `SegmentedControl`, qui devient le repli Android/web. Simplifications admises : étendre les roulettes par props, sans nouveau sélecteur ; envelopper `InlineStepper` dans un état ouvert/fermé, sur le modèle de `ProfileStepper`.

- **3.1.**
  - Existant : `<Modal … animationType="fade">` (`ExecutionParametersSheet.tsx:404`) ; `DurationWheelPicker` iOS = `Host` `matchContents` + `SwiftUIPicker` (`DurationWheelPicker.tsx:235-293`) ; `@expo/ui` `~57.0.13` (`package.json`).
  - Écart : un prototype de popover sur la ligne Mode, et un autre qui enveloppe la roulette existante, sans la modifier ; le test d'absence de substitution ; la décision et la voie consignées.
- **3.2.**
  - Existant : `ExecutionSheetDraft` avec `rowIds`, `hiddenRows` (Réserve), `savedVariableRows` et `targetsById`, mémoire par Mode et identité ; `setMode`, `setVariable`, `setSeriesCount`, `moveRow`, `setRow*`, `applyRequestedTotal`, `commitSheetDraft(draft, baseline)` → `validateForSave` (`ExecutionParametersDraft.ts:52-450`).
  - Écart réel : `pendingRemoval`, retrait et annulation (AC10) ; ligne de base alignée par identité (AC12) ; le reste est prouvé par des tests aux attendus littéraux. Le Régime est encore un booléen `variable` : vérifier qu'il couvre AC5/AC6 sans changement de modèle.
- **3.3.**
  - Existant : l'état local `openControl`/`closingControl` (`InlineControl`, l. 111-115, 285-292) ; les `SegmentedControl` de Mode (l. 470), de Côté (l. 667) et d'Ordre (l. 711) ; le `Switch` « Séries variables » (l. 521) ; des `InlineStepper` toujours ouverts (l. 491, 634, 733, 751, 834, 848).
  - Écart : champ Régime et popover à la place du `Switch` ; popovers à la place des segmentés sur iOS ; réducteur `openSurface` ; ± à l'appui en enveloppant `InlineStepper` ; `—` pour un côté non renseigné ; repli Android câblé.
  - Créer `src/shared/ui/opacity.ts` et y remplacer `withoutEffect: { opacity: 0.45 }` (l. 1250).
- **3.4.**
  - Existant : `DurationWheelPickerProps` (l. 115) n'a que `maxTotalSeconds` ; `PickerToolbar` (l. 315) n'a ni `validateDisabled` ni `failureOption`. La Cible commune Durée utilise déjà `DurationWheelPicker` en ligne (l. 586).
  - Écart : props de pas, bornes, `failureOption` et `validateDisabled`, sans toucher `WHEEL_SECONDS_STEP` ; `nearestGridValue` et `selectorOpeningPosition` (absents du domaine) ; placement dans `WheelPickerOverlay` (*Q37 ; historique : « dans le popover »*).
- **3.5.**
  - Existant : `NumberWheelPickerProps` (l. 88), bornée par `WHEEL_NUMBER_MAX` 99, et son `PickerToolbar` (l. 180). La Cible Répétitions passe encore par un `InlineStepper` (l. 614).
  - Écart : brancher `NumberWheelPicker` à sa place ; borne 100 par prop, sans toucher `WHEEL_NUMBER_MAX` ; ligne de tête « échec » ; `validateDisabled` dans la copie.
- **3.6.**
  - Existant : `DraggableRow` (l. 906, 960) avec les actions `moveUp`/`moveDown` (l. 981-1025 ; lexique `src/shared/i18n/index.ts:45-47`, `moveHandle` compris) ; message d'ajustement et `Annuler` (l. 800-830).
  - Écart : retirer les `InlineStepper` permanents des cellules (l. 919, 936) ; ajouter la Cellule active, le Pied commun, `stepTarget`, la croix et « Série supprimée — Annuler » ; ~~politique Durée au pas de 5~~ (levée par Q36, 2026-10-17 : politique existante conservée) ; corriger `steppedValue` (`ProfileStepper.tsx:66`, qui clampe aujourd'hui 5999 + → 3535).
- **3.7.**
  - Existant : Inversion conforme (`isRequestedTotalEditable`, `applyRequestedTotal`, `invertTotalDuration`), roulette du total en ligne (l. 788), `t.adjusted` ; natures `lowerBound`/`incomplete` et `inheritedSeriesCount` dans `executionCalculations.ts` (2.1) ; préfixes `strings.shared.durationNature` (2.2).
  - Écart : `totalApplicable` (l. 351-354) masque encore tout `FAILURE`. Afficher `≥` pour un mélange et masquer pour `UNSET`. Restent la présentation de la roulette (*Q41 : panneau sans flèche sous le champ, aligné à droite, déjà livré ; historique : « le popover de la roulette », puis `WheelPickerOverlay` (Q37)*) et les annonces.
- **3.8.** Annonces des nouveaux contrôles, retour du focus, table FR-03-13, section de recette.

## UX & Interaction Patterns

- Voile en fondu `#1F2129` à 34 %, Feuille montant du bas, en place avec « Réduire les animations ». En-tête fixe ✕ / `Paramètres d’exécution` / ✓ ; l'Éditeur est inerte.
- **Apparitions et disparitions fluides (Q39, NFR-10, 3.8 AC9).** Une ligne, un sélecteur en ligne, une roulette en ligne, le tableau des séries variables et ses lignes, le message d'ajustement entrent en fondu avec un léger déploiement et sortent en fondu avec un repli ; lignes voisines, groupe, corps et feuille glissent vers leur nouvelle place. Animations de mise en page de `react-native-reanimated` 4.5.1 sur le fil UI (`src/features/activities/SheetMotion.tsx`, durée unique `SHEET_MOTION_MS` = 220 ms), jamais d'animation de hauteur sur le fil JS. « Réduire les animations » : aucune animation. Le sélecteur garde D-4 (valeur visible 220 ms, puis `onClosed`). Inchangés : montée de la Feuille, fondus des `Modal`, popovers natifs, roulettes, `SegmentedControl`, glisser des lignes (les lignes du tableau n'ont pas de transition de place).
- **Vitesse, sens et sélection (Q40, E-14, amende Q39).** `SHEET_MOTION_MS` = 350 ms et cadre D-4 (`SELECTOR_SETTLE_MS`) = 350 ms. Entrée par le bas (montée depuis un décalage vers le bas) et sortie vers le bas, en fondu simultané, même courbe que la transition de place : l'espace se referme pendant le fondu. Ligne sélectionnée (`rowSelected`) : fond `stepperSurface`, rayon 12, sans contour. Tableau des séries variables : sélectionné à l'ouverture (interrupteur, chevron) et après une action dedans ; état normal dès qu'un champ hors tableau est sélectionné, au repli et à l'ouverture de la Feuille. Sélectionné, le groupe prend le fond `stepperSurface` sans contour ; le cadre fixe X-3 est retiré. Tests `PRE4-Q40`.
- **Sans fondu, révélation par le bas, sélection immobile (Q41, E-15, amende Q39 et Q40).** Aucune opacité animée. `SheetMotionView` rend chaque élément qui apparaît dans un cadre de découpe (`overflow: hidden`) : à l'entrée, le cadre s'ouvre de 0 à sa hauteur (`revealClipEntering`) pendant que la barre du dessous glisse (transition de place des voisines) et le contenu monte de sa hauteur (`revealContentEntering`) — il sort de sous la barre ; sortie symétrique. 350 ms, `Easing.out(cubic)`, fil UI ; « Réduire les animations » : immédiat. Le fond de sélection est un calque absolu (`-selection`) qui déborde de `GROUP_PADDING` : la ligne garde le même style sélectionnée ou non, aucune transition de place n'est jouée (le mouvement « droite-gauche-droite » venait des marges compensées de `rowSelected`, animées par la transition de place). Le contrôle en ligne (Android, web) est rendu dans le cadre de sa ligne (`Row` `below`). Lignes du tableau : découpe levée pendant un glisser. Panneaux iOS (`AnchoredPanel`) : apparition et disparition immédiates ; réserve vide sous le groupe si le panneau dépasse le bas du contenu (Durée totale), défilement jusqu'au bas si la Feuille est à sa hauteur maximale. Tests `PRE4-Q41`.
- Ligne déclenchante active : barre d'accent et fond. Le focus revient au déclencheur (H13).
- Le rendu natif prime sur les niveaux de la roue et la géométrie des popovers (P33). Les sous-titres d'options sont repris si la primitive le permet.
- Le ✓ indisponible du Sélecteur, la ligne de tête Répétitions et le Pied sans Cellule active sont `NON VÉRIFIABLE`, jugés par Hermann.
- Frames, visuel seulement (D-255) : `8328:36923`, `37092`, `37760`, `37862` (maître `8452:13297`), `37972`, `38084` (maître `5544:5118`), `38193`, `38301`, `38409`, `38513`, `38632`, `38741`, `38848` (sans sa Phrase, P1), `8470:13303`, `38953`, `39072`, `39181`, `39279`, `39390`.
- **Recette.** Les scénarios R-3.1-00 à R-3.8-03 sont joués dans le dev client « Routine Dev » (Q22) et regroupés dans l'ensemble « Feuille des paramètres ». L'essai R-3.1-00 à 03 se fait quand il devient nécessaire, avant toute autre recette d'interface. Aucun résultat n'est prérempli ni fabriqué.

## Cross-Story Dependencies

- **Epics 1 et 2 commités :** 1.1 `77e1630c`, 1.2 `8133e4bb`, 1.3 `9cc21b3b`, 1.4 `22a85a79` ; 2.1 `bdf0f47e`, 2.2 `8d329c93`, 2.3 `e0d1d253`, 2.4 `12183548`.
- **3.1 (S0) bloque 3.3 à 3.8.** En cas de succès ou de repli (a), elle fixe la voie de la roue dans `Popover.Content` : (i) `RNHostView` autour des roulettes existantes, ou (ii) `Picker` SwiftUI direct (leur branche iOS rendue sans `Host` propre). 3.4, 3.5 et 3.7 appliquent cette voie, sans en ouvrir une autre. *Rendu remplacé par Q37 (2026-10-17) : la voie de la roue est `WheelPickerOverlay` ; 3.4, 3.5 et 3.7 l'appliquent. La voie (i) a été constatée sur iPhone (E-05 validé) avant ce changement.* En repli (b), 3.3 à 3.8 attendent l'arbitrage P33. En cas d'échec, le prototype est retiré et les trois contrôles restent verts. 3.1 AC1 : si la version native diffère, s'arrêter et le signaler, sans EAS.
- **Ordre :** 3.1 → 3.2 (dépend de 1.1, 2.1) → 3.3 → 3.4 → 3.5 → 3.6 ; 3.7 ← 3.4, 2.1 et 2.2 (nature, formateur, préfixes) ; 3.8 ← 3.3 à 3.7.
- 3.2 AC14 reprend l'indicateur « N hérité » de 2.1. Les recettes R-2.3-03, R-2.3-04 et R-2.4-03 deviennent exécutables après l'Epic 3.
- 4.6 reprend les relevés visuels de 3.3 à 3.7 et les libellés de 3.8 AC2.
