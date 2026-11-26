# 2026-11-27 — Recette iPhone du 26/11/2026 (soir) — paquet CLAVIER

> **Preuve.** La cause du retard et de l'absence de la barre est établie par lecture du code natif de React Native 0.86 et du code de l'app, **pas** par une observation sur iPhone : Jest ne joue ni le clavier iOS, ni `InputAccessoryView`, ni les feuilles natives. Tous les points ci-dessous sont des **hypothèses à vérifier sur iPhone**, pas des corrections démontrées.

## Objectif

Traiter les constats de Hermann (recette iPhone du 26/11/2026, soir) sur la barre d'options du clavier :

1. `d607-clavier` (modales des paramètres d'exécution) : « La barre d'options du clavier n'est pas synchronisée » ; « Il faut ralentir encore les mouvements d'apparition et de disparition du clavier ».
2. `fmt-modale-rapides` : « Exercice libre, cadence : le clavier n'est pas synchronisé ».
3. `r26-barre-phases` (fiche Mouvement, phases) : « la barre d'option du clavier n'apparaît pas ».
4. Remarque b : « exercice libre : le clavier doit présenter la barre d'option précédent - suivant - Fermer ».

Règle déjà validée : Précédent / Suivant passent d'un champ à l'autre (phase n > durée n > phase n+1 > durée n+1).

## Branche et commit de départ

- Worktree `C:\Dev\KODJO-R27-CLAVIER`, branche `fix/recette-27-11-clavier`.
- Départ : `20257090609cddcc9f7ac7e0108d9cc2020f5cf9` (recette `recette/agenda-axe-20261124`, lot 22).

## Périmètre

- Demandé : `ExecutionParametersSheet` (modales et page « Exercice libre »), barre du clavier, fiche Mouvement (phases).
- Traité : `KeyboardAccessoryBar.tsx` (composant partagé : mode `attached`, contexte et crochet de rattachement natif), `KeyboardField.tsx`, `ExecutionParametersSheet.tsx`, `useSheetKeyboard.ts` (révélation), `ActivityEditorForm.tsx` et `MovementPhasesEditor.tsx` (phases de la fiche Mouvement), deux fichiers de test, documentation (ch07, ch13, Formats § 9.10).
- Hors périmètre, non modifiés : `FormatModelScreen.tsx` et `CarrierDurationSheet.tsx` (ils gardent la barre JS RC-1 : non cités par le paquet ; mêmes symptômes probables, voir À CLARIFIER), `CompositionScreen.tsx`.

## Constats et causes

### Mécanisme en place (avant)

Barre RC-1 (recette du 19/10) : `KeyboardAccessoryBar` posée en position absolue au bas de l'écran hôte et translatée en JS (`Animated.timing`, durée de l'événement `keyboardWillShow`, courbe `Easing.out(cubic)`) au-dessus du haut du clavier. Elle part **après** l'aller-retour JS de l'événement clavier, avec une courbe approchée (le clavier iOS utilise la courbe système 7) : elle suit toujours le clavier avec retard → constats 1 et 2. Dans la fiche Mouvement (feuille native depuis l'Exercice libre), sa position dépend de `measureInWindow` d'un hôte plein cadre et du décalage de repère de la feuille (recette du 04/11) : si l'une des mesures est fausse, la barre est hors de l'écran ou sous le clavier → constat 3 (cause exacte non observable sans iPhone).

### Pourquoi `InputAccessoryView` avait « échoué » le 19/10 (historique)

- Introduction : `9417aabbc` (19/10, story 2.2) — **une seule** `InputAccessoryView` (`nativeID="execution-sheet-keyboard-bar"`) rendue au bas de la Feuille, partagée par tous les champs (`inputAccessoryViewID` identique).
- Retrait : `8b21babf1` (19/10, RC-1) — « `InputAccessoryView` ne s'affiche pas dans la `Modal` », remplacée par la barre JS.
- Cause démontrée par lecture de `node_modules/react-native/React/Fabric/Mounting/ComponentViews/InputAccessory/RCTInputAccessoryComponentView.mm` (RN 0.86, nouvelle architecture) : dans `didMoveToWindow`, la vue cherche dans la fenêtre le **premier** `TextInput` portant son `nativeID` et lui affecte `inputAccessoryView`, **une seule fois** (`if (self.window && !_textInput)`), jamais ensuite. Les autres champs du même identifiant ne sont jamais rattachés, et un champ monté après la barre (la Charge, révélée par « Avec », précisément le champ recetté le 19/10) ne l'est pas non plus. Ce n'est donc pas la `Modal` qui empêchait l'affichage, mais le partage d'une barre unique. Attribution : **plausible** (fortement), non démontrée sur appareil.
- Autres pièges vérifiés : `RCTTextInputComponentView.setDefaultInputAccessoryView` ne remplace pas une barre rattachée quand `inputAccessoryViewID` est posé ; changer l'identifiant d'un champ déjà monté ne le rattache pas ; une barre rattachée après le focus n'apparaît qu'au prochain `reloadInputViews`. D'où : identifiant unique et stable par champ, barre montée avec le champ, contenu toujours rendu.

### « Ralentir » le clavier

La durée et la courbe de l'animation du clavier sont imposées par iOS (`UIKeyboardAnimationDurationUserInfoKey`, ≈ 250 ms) ; une application ne peut pas les modifier. La barre native fait partie du clavier : elle a sa vitesse. La modale suit le clavier image par image (`useAnimatedKeyboard`, recette du 26/11 après-midi). Ralentir la seule modale la décalerait du clavier, ce qui contredit « synchronisée ». **À CLARIFIER** (voir plus bas).

## PRESERVE / CHANGE / FORBIDDEN

| | Éléments |
|---|---|
| PRESERVE | Contenu et apparence de la barre (`KeyboardAccessoryBar` : quatre emplacements, « À l'échec », « ± », unités, fondu lent, couleurs, hauteur 52) ; ordre Précédent / Suivant (`keyboardFieldOrder`, `movementPhaseFieldOrder`) ; « Fermer » (`keyboard.close`, `Keyboard.dismiss`) ; focus natif et application de la saisie (`useSheetKeyboard`) ; remontée de la modale (`keyboardLiftStyle`, `useAnimatedKeyboard`) ; réserve de la page (`keyboardRoom`, `automaticallyAdjustKeyboardInsets`) ; pas de barre sur les libellés de phase de la Feuille (verrouillés, D-608 point 6) ; Entrée du libellé → durée de la même ligne, aucun passage automatique depuis la durée ; `TextInput` et clavier natifs ; `FormatModelScreen`, `CarrierDurationSheet`, `CompositionScreen`. |
| CHANGE | Hôte de la barre : `InputAccessoryView` par champ (iOS) au lieu de la barre posée et translatée en JS, dans la Feuille (modale et page) et les phases de la fiche Mouvement ; réserves calculées pour une barre comprise dans le cadre du clavier (`KEYBOARD_BAR_SCROLL_RESERVE` 64 → 12, révélation sans retrait de la hauteur de barre, réserve de barre de la fiche Mouvement retirée). |
| FORBIDDEN | Code natif (Swift/ObjC, patch de module) ; remplacement du clavier ou du `TextInput` ; réimplémentation de la barre ; modification des écrans non cités ; ralentissement inventé. |

Démonstration PRESERVE : `KeyboardAccessoryBar` garde son rendu ; seuls ajouts : prop `attached` (pas de position ni translation), identifiants de test retirés des copies inactives, `keyboardFrame` / `containerBottom` / `onHeight` facultatifs (les appelants `FormatModelScreen`, `CarrierDurationSheet` passent toujours les trois : comportement inchangé, `tsc` vert). Tests existants de parcours (Suivant / Précédent, « À l'échec », « ± », unités, Fermer) verts sans modification de leurs attentes, hors deux attentes remplacées annotées.

## Modifications

- `src/features/activities/KeyboardAccessoryBar.tsx` : `KeyboardAccessoryContext` (barre fournie par l'hôte, `withText`), `useAttachedKeyboardBar(active, text)` (identifiant `useId` unique, `<InputAccessoryView nativeID>` à rendre juste après le `TextInput` ; copie inactive masquée à l'accessibilité), `KeyboardBarCopyContext` (copies sans `testID`), prop `attached`.
- `src/features/activities/KeyboardField.tsx` : `inputAccessoryViewID` et barre rattachée (cellule : après le conteneur sans touchers ; texte : seulement si `withText`).
- `src/features/activities/ExecutionParametersSheet.tsx` : `sheetKeyboardBar` (mêmes props qu'avant, `attached`) fourni par `KeyboardAccessoryContext` autour du contenu ; barre absolue RC-1 retirée ; `KEYBOARD_BAR_SCROLL_RESERVE` 64 → 12 (marge de révélation seule).
- `src/features/activities/useSheetKeyboard.ts` : révélation sans retrait de la hauteur de barre (le haut du clavier inclut la barre native).
- `src/features/activities/ActivityEditorForm.tsx` : `phasesBarSource` (barre toujours rendue, actions de `MovementPhasesEditor`), `KeyboardAccessoryContext` autour de `MovementPhasesEditor` ; hôte `movement-keyboard-bar-host`, état de position et réserve de barre retirés.
- `src/features/activities/MovementPhasesEditor.tsx` : `BarTextInput` (libellés et invite) avec barre rattachée.
- Tests : `ExecutionParametersSheet.libre.d608.test.tsx` (marge 64 → 12, annotée), `MovementScreen.b2.integration.test.tsx` (hôte JS remplacé par la vérification du rattachement natif : `inputAccessoryViewID` du champ = `nativeID` de l'`InputAccessoryView` qui contient la barre).

## Tests et résultats

- `npx tsc --noEmit` : vert.
- `npx eslint` des 6 fichiers source modifiés : vert.
- Jest ciblé (`-w 1 --workerIdleMemoryLimit=800MB`) : `ExecutionParametersSheet*` (15 suites), `ActivityEditorForm`, `MovementScreen.b2` et `.recette2`, `useSheetKeyboard`, `KeyboardField`, `FreeExerciseScreen.d608`, `CarrierDurationSheet.keyboard0611`, `formatKeyboard.recette0411`, `CompositionScreen.circuitActions0411`.
  - 1er passage : 29 échecs (copies de la barre en double dans l'arbre, boutons de la barre sous le conteneur `pointerEvents="none"` de la cellule, attentes RC-1). Corrigé dans le code (copies inactives sans `testID`, barre hors du conteneur sans touchers) puis 5 échecs résiduels d'attentes RC-1 / relevés de nœuds, tests mis à jour (attentes remplacées annotées, helper `outsideKeyboardBar`).
  - Passage final : 644 tests verts sur ces suites (dont `ExecutionParametersSheet.test.tsx` 278/278, relancé seul après la dernière modification).
- Tests mis à jour en plus : `ExecutionParametersSheet.test.tsx` (barre rattachée au champ Charge et à chaque cellule, `inputAccessoryViewID` attendu ; relevés de nœuds et libellé de l'option Autre hors de la barre native).
- Une suite Jest verte ne prouve pas le rendu iPhone : le rattachement natif, la synchronisation avec le clavier, la hauteur réelle du cadre du clavier et les touchers dans la barre ne sont pas joués sous Jest.

## Classe documentaire et documents touchés

Classe **B** (demandes explicites de Hermann) :
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` : compléments datés de D-607 (point 1, clavier) et D-608 (Exercice libre, phases) ; annotation de la formulation B9 (« `InputAccessoryView` ne s'affichant pas dans la modale ») remplacée.
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md` : annotation de la révision B9 (même formulation).
- `docs/KODJO-Formats-entrainement-2026-11-02.md` § 9.10 : complément daté.

## À CLARIFIER

1. **« Ralentir encore les mouvements d'apparition et de disparition du clavier »** : impossible pour le clavier lui-même (animation imposée par iOS) ; la barre native a désormais exactement sa vitesse. Options : (a) garder la synchronisation stricte (lecture appliquée) ; (b) ralentir seulement la remontée de la modale (elle serait alors en retard sur le clavier et sa barre, donc « non synchronisée ») ; (c) si « ralentir » visait la sensation de saut, vérifier d'abord sur iPhone le rendu avec la barre native.
2. **Formats et Circuits** (`FormatModelScreen`, `CarrierDurationSheet`) : même barre JS RC-1, non citée par le paquet, non modifiée ; probablement le même retard. Étendre la barre native à ces écrans ?
3. **Exercice libre, phases** : les libellés sont fixés par la fiche du mouvement (D-608 point 6) ; sur la page, Précédent / Suivant parcourent donc les durées des phases (pas les libellés). La règle « phase n > durée n » est appliquée dans la fiche Mouvement.
4. Hypothèse non démontrée : le cadre du clavier rapporté par iOS (événements `Keyboard` et `useAnimatedKeyboard`) inclut la barre native. Si ce n'était pas le cas sur l'iPhone, la modale remonterait de 52 pt de moins (barre sur la dernière ligne) — à vérifier en recette.

## Vérifications iPhone restantes

- d607-clavier : modale « Paramètres d'exécution » (Composition), toucher une cellule ou la Charge : la barre monte avec le clavier, collée à lui, sans décalage, et redescend avec lui à « Fermer » ; Précédent / Suivant changent de champ sans que la barre bouge ; la modale reste au-dessus de la barre.
- fmt-modale-rapides : Exercice libre, Cadence « Autre » : la barre et le clavier apparaissent ensemble ; le champ reste visible au-dessus de la barre.
- r26-barre-phases : fiche Mouvement (depuis l'Exercice libre ou le catalogue), toucher le libellé 1 : la barre apparaît avec le clavier ; Suivant : durée 1, libellé 2, durée 2, invite ; Précédent : chemin inverse ; Fermer ferme le clavier.
- Remarque b : page « Exercice libre », toucher Charge, une cellule, la Récupération ou une durée de phase : la barre « ← Précédent | Suivant → | Fermer » est présente au-dessus du clavier.
- Contrôle de non-régression : « À l'échec » (cellule Cible), « ± » (Incrément AMRAP), fondu lent des champs hors tableau ; VoiceOver atteint les boutons de la barre.

## Fichiers modifiés

Voir « Modifications » et « Classe documentaire ».

## Commit final et état Git

Renseignés dans le message de livraison (commit de ce rapport sur `fix/recette-27-11-clavier`, poussé sur `origin`).
