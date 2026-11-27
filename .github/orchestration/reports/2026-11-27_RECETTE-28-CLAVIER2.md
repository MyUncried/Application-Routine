# 2026-11-27 — Recette iPhone du 27/11/2026 (matin) — paquet CLAVIER2

> **Preuve.** Aucun point n'est démontré sur iPhone. Les causes ci-dessous sont établies par **lecture du code** (application, React Native 0.86.2, Reanimated 4.5.1) ; Jest ne joue ni le clavier iOS, ni `useAnimatedKeyboard`, ni `scrollTo` du fil UI, ni `InputAccessoryView`. Chaque point est une **hypothèse corrigée, à vérifier sur iPhone**.

## Objectif

Ligne « Barre du clavier synchronisée », citations exactes de Hermann :

1. « L'apparition du clavier n'est plus synchronisée avec le défilement de l'écran (c'est variable d'un format à l'autre) »
2. « L'écran se déplace vers le haut en un mouvement saccadé »
3. « composition de séance : l'écran saute vers le bas à la fermeture du clavier au lieu de glisser de manière synchronisée. »

But : le contenu monte et descend d'un seul mouvement, synchronisé avec le clavier, à l'ouverture comme à la fermeture, de façon identique sur tous les formats ; garder l'`InputAccessoryView` natif (validé : r27-libre-barre, r26-barre-phases) ; pas de module natif.

## Branche et commit de départ

- Worktree `C:\Dev\KODJO-R28-CLAVIER2`, branche `fix/recette-28-clavier2`.
- Départ : `9005025840d0f73157654162b107a7a415ad7be9` (recette `recette/agenda-axe-20261124`, lot 23).

## Périmètre

- Demandé : réaction du défilement / décalage du contenu au clavier dans les modales « Paramètres d'exécution » (tous formats, Exercice libre) et dans la Composition de séance.
- Traité : `useSheetKeyboard.ts` (planification du défilement, marge gardée jusqu'à `keyboardDidHide`), `ExecutionParametersSheet.tsx` (défilement du corps sur le fil UI, marge commune modale / page), `FormatModelScreen.tsx` (défilements de l'écran sous la modale), un nouveau fichier de test, documentation (ch07 D-607, Formats § 9.10).
- Non touché : style de focus des champs (`KeyboardField`, paquet FOCUS), `KeyboardAccessoryBar`, `InputAccessoryView`, `CompositionScreen.tsx`, `ActivityEditorForm.tsx`, `CarrierDurationSheet.tsx`.

## Comparaison historique (avant / après le lot 23, `cbc31720f`)

- Dernier état comparable : lot 22 (recette du 26/11 après-midi, point B) — modale translatée par `useAnimatedKeyboard` (Reanimated, fil UI), reste en `contentInset` (`keyboardScrollInset`, état JS posé à `keyboardWillShow`, retiré à `keyboardWillHide`), révélation de la ligne à `keyboardDidShow` (`scrollTo` animé, après le clavier) ; page « Exercice libre » : `automaticallyAdjustKeyboardInsets` (natif) + réserve `keyboardRoom` + réserve de barre 64 + révélation à `keyboardDidShow`. Barre JS RC-1 translatée après l'événement.
- Lot 23 (`cbc31720f`) : barre native par champ ; `KEYBOARD_BAR_SCROLL_RESERVE` 64 → 12. **Amplitude de la remontée inchangée** : avant, hauteur clavier + 64 ; après, (hauteur clavier + 52 de barre native, comprise dans le cadre iOS) + 12. Le lot 23 n'a pas modifié la mécanique de défilement de la modale.
- Ce qui a changé de fait (attribution) :
  - **démontré (lecture du code RN)** : depuis le lot 23, chaque `TextInput` de la Feuille porte un `inputAccessoryView`. `RCTScrollViewComponentView._keyboardWillChangeFrame` (RN 0.86.2, l. 221-230) : pour tout `ScrollView` avec `automaticallyAdjustKeyboardInsets` qui ne contient pas le champ, si le premier répondeur a un `inputAccessoryView`, `contentDiff = keyboardEndFrame.origin.y - keyboardBeginFrame.origin.y` — ce défilement extérieur est décalé de toute la hauteur du clavier. Les deux défilements de `FormatModelScreen` (`automaticallyAdjustKeyboardInsets`) restent montés sous la `Modal` de la Feuille : l'écran du format monte et redescend avec le clavier, derrière le voile. La Composition n'a pas ce prop : comportement différent selon l'écran hôte (« variable d'un format à l'autre », plausible) ;
  - **plausible** : la barre native suit exactement le clavier ; la modale suit l'estimation de Reanimated (`REAKeyboardEventObserver` : courbe ajustée sur 0,48 s / 0,496 s, synchronisée sur l'instant de départ de l'animation) ; avant le lot 23 la barre JS était elle-même en retard, ce qui masquait les autres mouvements ; le second mouvement (révélation après `keyboardDidShow`) et le saut de fermeture deviennent visibles à côté d'une barre exactement synchronisée.
- Mécanismes antérieurs au lot 23, causes par lecture (démontrées dans le code, effet visuel à confirmer) :
  - **second mouvement à l'ouverture** (« saccadé », « variable d'un format à l'autre ») : la modale ne peut remonter que de sa place libre (`sheetHeadroom`). Feuille courte : remontée complète, ligne déjà visible, un seul mouvement. Feuille haute (séries variables, formats chargés) : la ligne reste sous le clavier et la révélation la fait défiler **après** la fin de l'animation (`keyboardDidShow`, `useSheetKeyboard.ts`) — deux mouvements, selon la hauteur de la feuille, donc selon le format. Page : course native puis révélation (marge de 12) après le clavier ;
  - **saut vers le bas à la fermeture** (Composition) : `keyboardScrollInset` passait à 0 dès `keyboardWillHide` (état JS, hors animation) ; si le corps avait défilé dans cette marge (révélation d'une ligne basse), iOS ramène d'un coup le défilement dans les bornes — saut, pendant que la feuille glisse avec le clavier. Page : retrait instantané de `keyboardRoom` (mise en page) — même effet.
- Premier échec conservé : recette du 27/11 (matin), cette ligne. Aucune preuve iPhone antérieure au lot 23 sur ces deux mouvements n'est conservée (lot 22 : seulement des constats sur la barre) — **non vérifiable**.

## PRESERVE / CHANGE / FORBIDDEN

| | Éléments |
|---|---|
| PRESERVE | `InputAccessoryView` par champ et contenu de la barre ; remontée de la modale (`keyboardLiftStyle`, `useAnimatedKeyboard`, `sheetHeadroom`, rampe 12) ; marge de révélation 12 et `revealDelta` ; révélation au changement de champ (Précédent / Suivant, toucher direct) ; révélation de `keyboardDidShow` (gardée en filet de sécurité) ; `bounces={false}` de la modale ; focus, application de la saisie, ordre des champs ; style de focus (paquet FOCUS) ; `CompositionScreen`, `KeyboardField`, `KeyboardAccessoryBar`, `ActivityEditorForm`. |
| CHANGE | Défilement du corps à l'apparition du clavier : planifié à `keyboardWillShow` et porté image par image par la même position du clavier que la remontée (fil UI) ; à la fermeture, redescente du défilement avec le clavier, marge retirée après `keyboardDidHide` ; page « Exercice libre » sur le même mécanisme (`automaticallyAdjustKeyboardInsets` retiré, réserves `keyboardRoom` et de barre retirées, marge de défilement) ; `FormatModelScreen` : `automaticallyAdjustKeyboardInsets` coupé pendant que la modale est ouverte. |
| FORBIDDEN | Code natif, patch de module ; remplacement du clavier, du `TextInput` ou de la barre native ; modification du style de focus ; ralentissement inventé. |

Démonstration PRESERVE : `KeyboardAccessoryBar.tsx`, `KeyboardField.tsx`, `CompositionScreen.tsx`, `ActivityEditorForm.tsx` absents du diff ; `keyboardLiftStyle` et `revealDelta` non modifiés ; `ExecutionParametersSheet.libre.d608` (modale : `automaticallyAdjustKeyboardInsets` faux, `bounces` faux, marge, pas de réserve, marge retirée à la fermeture) vert sans modification de ses attentes.

## Modifications

- `src/features/activities/useSheetKeyboard.ts`
  - `keyboardGlideProgress` (fonction worklet, pure) et type `SheetKeyboardGlide` (l. 202 et suivantes).
  - `planGlide` (l. 542) : à `keyboardWillShow` (iOS, clavier fermé avant), mesure ensemble la ligne du champ voulu et le corps (différence indépendante de la translation en cours), calcule le défilement nécessaire au-dessus du futur haut du clavier (`revealDelta`, marge 12) et le confie à la Feuille (`glide.start`), à finir avec le clavier.
  - `keyboardWillHide` (l. 592) : redescente du défilement vers le défilement de repos (sans la marge), portée par la course du clavier jusqu'à 0. `keyboardDidShow` / `keyboardDidHide` arrêtent le suivi.
  - `insetFrame` : cadre gardé jusqu'à `keyboardDidHide` (un cadre de fermeture `keyboardWillChangeFrame` sous l'écran ne le remplace pas).
- `src/features/activities/ExecutionParametersSheet.tsx`
  - `useAnimatedReaction` sur `animatedKeyboard.height` (l. 903) : `scrollTo` (fil UI) du départ à l'arrivée, proportionnellement à la course restante du clavier — même source, même image que la remontée de la modale. Référence du corps fusionnée (`bodyRef` : référence ordinaire + `useAnimatedRef`).
  - `keyboardGlide` (l. 2173) : géométrie (modale : haut du corps une fois remontée, déduit de la mise en page — corps dernier enfant de la feuille ancrée en bas, remontée finale `min(clavier − sécurité + 12, place libre)` ; page : haut mesuré), défilement de repos (`contentHeight − hauteur du corps`).
  - `keyboardScrollInset` (l. 3145) : lit `insetFrame`, aussi en page ; `keyboardRoom` et la réserve de barre de la page retirés (annotés).
  - Corps (l. 3527) : `automaticallyAdjustKeyboardInsets={false}`, `contentInset` / `scrollIndicatorInsets` en modale et en page, `scrollToOverflowEnabled` (le défilement synchronisé n'est pas borné avant que la marge, état JS, n'arrive), `bounces={false}` en modale seulement (inchangé).
- `src/features/sessions/FormatModelScreen.tsx` (l. 2033, 2240) : `automaticallyAdjustKeyboardInsets={parametersOf === null}` sur les deux défilements.
- Test : `src/features/activities/__tests__/useSheetKeyboard.glide2711.test.tsx` (nouveau).

## Tests et résultats

- `npx tsc --noEmit` : vert.
- `npx eslint` des 4 fichiers modifiés ou ajoutés : vert.
- Jest ciblé (`-w 1 --workerIdleMemoryLimit=800MB`) : voir le résultat consigné ci-dessous (« Résultat Jest »).
- Ce que les tests démontrent : le plan (départ 0, arrivée +156 pour une ligne 600..644 sous un clavier à 500, fin à la hauteur 344 du clavier) est demandé à `keyboardWillShow` et non après ; aucun départ pour une ligne visible ou un clavier déjà affiché ; à la fermeture, redescente 156 → 40 vers 0 ; marge gardée entre `keyboardWillHide` et `keyboardDidHide` (modale et page) ; page sans `automaticallyAdjustKeyboardInsets` ni réserves.
- Ce qu'ils ne démontrent pas : la synchronisation réelle (courbe estimée de Reanimated contre courbe du clavier iOS), l'exécution de `scrollTo` image par image, l'absence de saut, l'immobilité de l'écran du format sous la modale. **Une suite Jest verte ne prouve pas le rendu iPhone.**

## Hypothèses non démontrées

1. La courbe de `useAnimatedKeyboard` (estimation de Reanimated) est assez proche de celle du clavier iOS pour que modale et barre native paraissent solidaires ; un léger écart entre le bas de la modale et la barre reste possible (aucune primitive JS ne donne la courbe 7 du clavier ; Fabric n'implémente pas la courbe `keyboard` de `LayoutAnimation` — `utils.cpp`).
2. La géométrie de la modale (corps dernier enfant, feuille ancrée au bas du voile, `scrimBottom` mesuré) correspond au rendu ; sinon la révélation de `keyboardDidShow` termine le travail (petit second mouvement, pas de champ masqué).
3. Le cadre du clavier rapporté par iOS inclut la barre native (déjà supposé au lot 23).
4. Le saut de la Composition provient du retrait de la marge à `keyboardWillHide` (autre cause possible, non vérifiable sans appareil : `REAKeyboardEventObserver` ne suit la fermeture que s'il détecte l'animation du clavier — sinon la feuille descend d'un coup à `keyboardDidHide`).

## Classe documentaire et documents touchés

Classe **B** (constats explicites de Hermann) :
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` : complément daté de D-607 (point 1, clavier).
- `docs/KODJO-Formats-entrainement-2026-11-02.md` § 9.10 : complément daté (nouveau paragraphe après celui du 26/11 soir).
- Remarque hors périmètre : la ligne 716 de Formats contient une fusion de texte antérieure (« …FORMATS2soir), Hermann… ») — non corrigée (pas de réécriture hors paquet).

## À CLARIFIER

1. `ActivityEditorForm` (fiche Mouvement) héberge aussi la modale et contient un `KeyboardAvoidingView` qui réagit à tout clavier : l'écran sous la modale peut bouger. Antérieur au lot 23, non cité : non modifié.
2. `FormatModelScreen` / `CarrierDurationSheet` : leurs propres champs gardent la barre JS RC-1 et `automaticallyAdjustKeyboardInsets` (hors paquet, déjà signalé au lot 23).
3. Si l'écart de courbe (hypothèse 1) reste visible sur iPhone, seule une solution native (lecture de la position réelle de la vue clavier à chaque image) le supprimerait : nouveau build, accord requis.

## Vérifications iPhone restantes

- Composition → modale d'un exercice à séries variables (feuille haute), toucher une cellule de la dernière ligne : la feuille et la ligne montent ensemble, d'un seul mouvement, et s'arrêtent avec le clavier ; aucun défilement après. « Fermer » : tout redescend avec le clavier, sans saut final.
- Même essai sur une modale courte (départ rapide, Charge) et dans une modale de format ouverte depuis l'écran d'un format (AMRAP, EMOM, Tabata) : même mouvement ; l'écran du format, derrière le voile, ne bouge pas.
- Page « Exercice libre » : toucher la Récupération ou la Cadence « Autre » : la ligne monte avec le clavier, un seul mouvement, au-dessus de la barre ; « Fermer » : redescente sans saut.
- Non-régression : Précédent / Suivant ramène toujours la ligne au-dessus de la barre ; la barre native reste présente et collée au clavier ; Réduire les animations : comportement correct.

## Fichiers modifiés

- `src/features/activities/useSheetKeyboard.ts`
- `src/features/activities/ExecutionParametersSheet.tsx`
- `src/features/sessions/FormatModelScreen.tsx`
- `src/features/activities/__tests__/useSheetKeyboard.glide2711.test.tsx` (nouveau)
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/KODJO-Formats-entrainement-2026-11-02.md`
- `.github/orchestration/reports/2026-11-27_RECETTE-28-CLAVIER2.md`

## Résultat Jest

`npx jest -w 1 --workerIdleMemoryLimit=800MB src/features/activities/__tests__/useSheetKeyboard src/features/activities/__tests__/ExecutionParametersSheet src/features/sessions/__tests__/FreeExerciseScreen src/features/sessions/__tests__/FormatModelScreen` : **27 suites vertes sur 27, 623 tests verts, 33 ignorés (déjà ignorés), 0 échec**, dont le nouveau `useSheetKeyboard.glide2711` (10 tests). Passe complète non lancée (consigne du brief).

## Commit final et état Git

- Commit de code et de documentation : `190cbb8f8` ; ce rapport complété dans le commit documentaire suivant sur `fix/recette-28-clavier2`, poussé sur `origin`. État final : arbre propre.
