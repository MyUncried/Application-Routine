---
title: 'Story 2.2 — Essai sur iPhone du champ clavier de la charge (NFR-6)'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: 'f9163105f315ac50d8808c7a5ac4b7bde655c465'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre5/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/spec-2-6-tableau-des-series-sans-steppers-de-cellule-lignes-de-36.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La charge du Brouillon (transitions de 2.1) n'a aucun champ de saisie dans la Feuille ; le clavier décimal natif, sa barre Précédent / Suivant / « Fermer », le fond de la cellule active et la visibilité de la ligne active au-dessus du clavier doivent être essayés tôt sur iPhone (NFR-6) avec les composants définitifs.

**Approach:** Story 2.2 de `epics.md` (AC1 à AC8, qui font foi, version corrigée par Hermann le 19/10) : composant unique `KeyboardField` (`TextInput`, `decimal-pad` ; mode texte prêt pour 2.8), surface `keyboard` dans `sheetSurface.ts`, un seul hook de synchronisation focus / surface / flush, barre iOS par `InputAccessoryView`, fond actif `#EAEAFF` relevé sur Figma `9292:18077`, défilement du corps existant (`SheetMotionScrollView`) ; champs posés à leur place définitive (ligne Charge après la Pause en identiques ; ligne Charge sous le tableau et colonne Charge en variables), activés par le `SegmentedControl` existant.

**Décisions :**
- Question 1 (colonne Charge, 19/10) : **option B retenue** — l'ordre a été réorganisé (2.3, 2.4 puis 2.6 livrées avant 2.2). L'essai se joue sur le tableau définitif de 2.6 (cellules à valeur seule ; colonnes amorce 38, écart 20, Cible 71, écart 7, Pause 71, espace souple, croix 36) : la colonne Charge est une troisième cellule de 71 après un écart de 7. Rien de jetable.
- Le décalage du ± de Pause d'une ligne avec la colonne Charge (`deferred-work.md`, revue E2 de 2.6) est traité ici : le ± est placé depuis la cellule Pause mesurée, plus par un décalage fixe.
- Segmenté de la ligne Charge : `SegmentedControl` existant, variante `inline` actuelle des lignes de la Feuille, options « Avec | Sans » ; la valeur dans le segment (`formatLoadKg`) reste à 2.7.

## Boundaries & Constraints

**Always:** transitions 2.1 réutilisées (`setLoadEnabled`, `setLoadValue`, `normalizeDraftLoad`, `parseLoadText`) ; une sortie sans changement de valeur ne déclenche aucune transition ; une seule surface ouverte ; ✓ / ✕ absorbés pendant une saisie ; textes par `src/shared/i18n/` ; état Sans de la Feuille strictement inchangé (tests existants verts sans affaiblissement) ; fins de ligne des fichiers touchés conservées.

**Never:** clavier personnalisé ; dépendance native ou nouveau build ; `KeyboardAvoidingView` ou `ScrollView` ajouté ; `tokens.ts` modifié ; autre valeur au clavier (NR Δ30) ; segmenté avec valeur de charge (2.7) ; migration.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Sortie du champ | « 1,3 » | `setLoadValue` → 1,5 kg | — |
| Champ vidé | « » | 0 kg ; à la fermeture, identiques → Sans | — |
| Illisible | « 1,2,3 », « -2 » | valeur précédente, aucune transition | — |
| Sans changement | « 20 » sur 20 kg | aucune transition, `pendingRemoval` intact | — |
| Suivant | champ 2 sur 6 actif | flush, focus du champ 3, clavier ouvert, aucun `normalizeDraftLoad` | — |
| Extrémités | premier / dernier champ | Précédent / Suivant indisponibles, sans boucle | — |
| ✓ pendant saisie | clavier ouvert | 1er appui : valeur appliquée, clavier fermé ; 2e : validation | — |

</frozen-after-approval>

## Code Map

- `src/features/activities/sheetSurface.ts` (CRLF) -- `KeyboardFieldId` = `{ kind: "load"; row: number | "uniform" } | { kind: "phaseLabel"; phase: number }` ; surface `{ kind: "keyboard"; field }` ; `sameSurface` compare le champ ; `touch` : un clavier ouvert suit la famille ± (autre surface ouverte dans le même geste), même champ clavier → état inchangé (pas de fermeture au second toucher) ; nouvel événement `{ type: "blur"; field }` qui ne ferme que si ce champ est la surface ouverte ; `outside` et `rows` (ligne disparue) ferment aussi `keyboard` ; `sheetCommandsAbsorbed` vrai pour `keyboard` ; `removalEnabled` inchangé.
- `src/features/activities/useSheetKeyboard.ts` (nouveau, CRLF) -- hook unique ; détail dans les Design Notes. Exporte aussi les fonctions pures `loadFieldOrder(draft, tableVisible)` (`[]` sous Sans ; `["uniform"]` en identiques effectives ; `rowIds` en variables si le tableau est déplié, sinon `[]`) et `applyLoadEdit(draft, field, text)` (`parseLoadText` : `invalid` → même Brouillon ; `empty` → `setLoadValue(…, null)` ; `value` → `setLoadValue(…, kg)` ; si la charge du champ ne change pas → même Brouillon, `pendingRemoval` intact).
- `src/features/activities/KeyboardField.tsx` (nouveau, CRLF) -- `TextInput` ; `mode: "decimal"` (`keyboardType="decimal-pad"`, `inputAccessoryViewID` sur iOS seulement) ou `"text"` (clavier texte, au plus 20 points de code — saisie plus longue refusée —, `returnKeyType="done"`, Retour ferme, sans barre) ; texte local pendant le focus (initialisé par `editText` au focus), `displayValue` hors focus ; `active` → fond `#EAEAFF` (constante partagée de `sheetTable.tsx`) et `accessibilityState.selected` ; style fourni par l'appelant (gabarit cellule de tableau ou pastille de ligne).
- `src/features/activities/KeyboardAccessoryBar.tsx` (nouveau, CRLF) -- `InputAccessoryView` iOS (rien sur Android et web) : « ← Précédent », « Suivant → » à gauche, « Fermer » à droite ; texte `#5C4DFF` 14 regular, hauteur 44, fond `#E6E9ED` (constantes locales nommées, Figma `9292:18077`) ; extrémités `disabled` (`accessibilityState`).
- `src/features/activities/ExecutionParametersSheet.tsx` (LF) -- ligne « Charge » (`testID` `execution-sheet-row-load`) en dernier dans le cadre Séries, précédée d'un `Separator` : après la Pause en identiques, sous le groupe du tableau en variables. Contenu : `KeyboardField` commun (identiques effectives et Avec) puis segmenté `inline` étroit (`INLINE_OPTION_WIDTHS.narrow`) « Avec | Sans ». Avec (passage Sans → Avec) : `setLoadEnabled(true)`, tableau déplié s'il était replié, puis focus du premier champ de `loadFieldOrder` après le rendu. `VariableTable` : quand la charge est Avec, en-tête « Charge » et cellule `KeyboardField` (71 × 24, gabarit `TableCell`) après la Pause, séparées de 7. ± de Pause d'une ligne : centré sur la cellule Pause mesurée (`onLayout`, borné à la ligne), remplace `PAUSE_CELL_X`. Flush préalable (`keyboard.flush(draft)` comme base de la transition) dans : segmentés Mode, Condition d'arrêt, Type de série, Charge ; début de glisser et `onMove` ; `handleAdjustmentUndo`. Focus d'une cellule → tableau sélectionné ; champ commun → désélectionné ; `tableSelected` admet le clavier d'une ligne. `SheetMotionScrollView` (l. 1400) : `automaticallyAdjustKeyboardInsets`, `onScroll` (offset dans un ref) avec `scrollEventThrottle={16}`. Barre rendue une fois dans la Feuille.
- `src/features/activities/sheetTable.tsx` (CRLF) -- exporter `TABLE_CELL_ACTIVE_BACKGROUND` et les mesures / styles de cellule réutilisés par la cellule Charge.
- `src/shared/i18n/index.ts` (CRLF), dans `executionParameters.sheet` -- `load` (« Charge »), `loadWith` (« Avec »), `loadWithout` (« Sans »), `columns.load` (« Charge »), `rowLoad` (« Série {n}, charge »), `keyboardBar` : `previous` (« ← Précédent »), `previousSpoken` (« Précédent »), `next` (« Suivant → »), `nextSpoken` (« Suivant »), `close` (« Fermer »).
- Tests : `__tests__/sheetSurface.test.ts`, `__tests__/useSheetKeyboard.test.ts` (nouveau), bloc « PRE-5 story 2.2 » dans `__tests__/ExecutionParametersSheet.test.tsx` (focus simulé par `fireEvent(input, "focus")`, `changeText`, `blur`). Mettre à jour un test existant seulement si la nouvelle ligne Charge le casse par conception (compte de lignes, ordre), sans affaiblir ce qu'il prouve.
- Ne pas toucher : `tokens.ts`, `DurationWheelPicker`, `NumberWheelPicker` et leurs gardes zéro-`ScrollView`, `ProfileStepper.tsx`, `SegmentedControl.tsx`, domaine.

## Tasks & Acceptance

**Execution:**
- [x] `sheetSurface.ts` + test -- surface `keyboard` -- AC1, AC8.
- [x] `useSheetKeyboard.ts` + test des fonctions pures (ordre, `applyLoadEdit`) -- AC1, AC2, AC8.
- [x] `KeyboardField.tsx`, `KeyboardAccessoryBar.tsx` -- AC1 à AC3.
- [x] `ExecutionParametersSheet.tsx`, `sheetTable.tsx` + tests de Feuille (ligne Charge, activation et focus, colonne, absorption ✓ / ✕, Précédent / Suivant, Fermer, fond actif, ± de Pause sur sa cellule) -- AC1 à AC5.
- [x] `src/shared/i18n/` -- AC8.

**Acceptance Criteria:**
- Given la story livrée, when on lance `npm test`, `npx tsc --noEmit`, `npm run lint`, then tout est vert sans test existant affaibli.
- Given la Feuille sous Sans, when elle s'affiche, then rendu et comportements déjà livrés sont inchangés hormis la ligne Charge ajoutée.

## Implementation Notes

- Checkpoint 1 (2026-10-19) : question 1 résolue par l'option B (réorganisation 2.3, 2.4, 2.6 avant 2.2), consignée dans les décisions ; spec d'environ 2 300 tokens conservée entière (story M, composants liés) ; approbation pré-autorisée par Hermann (développement PRE-5 autorisé le 2026-10-19, enchaînement sans approbation par story).
- Implémentation (sous-agent, 2026-10-19) : surface `keyboard` et événement `blur` dans `sheetSurface.ts` ; hook `useSheetKeyboard.ts` (fonctions pures `loadFieldOrder`, `applyLoadEdit`, `loadOfField`, `loadEditText`) ; `KeyboardField.tsx` (modes décimal et texte) ; `KeyboardAccessoryBar.tsx` (`InputAccessoryView`, iOS seulement) ; ligne « Charge » et colonne Charge dans la Feuille ; ± de Pause centré sur la cellule mesurée (position nominale seulement avant la mesure). Choix d'intégration : `commit(apply)` sans second argument — la Feuille compare elle-même le Brouillon pour retirer le message d'ajustement ; hauteurs de la barre en `minHeight` (texte agrandi jamais rogné, story 3.8 AC7) ; un test existant révisé par conception (PRE4-3.8/AC7 : segmenté `inline` de la ligne Charge ajouté aux exceptions de hauteur fixe). Contrôles : 118 suites, 3 061 tests, `tsc` et lint verts. Aucun constat iPhone : R-2.2-01 à 07 à jouer par Hermann (AC6, AC7).
- Correctifs de revue (passe 1) : « Annuler » avec une saisie modifiée applique la saisie sans annuler ; révélation aussi au focus direct d'un champ, calcul extrait (`revealDelta`) ; texte d'édition construit sans `formatLoadKg` ; cellule Charge à la largeur de sa colonne et cible de 36 (`hitSlop`) ; libellé propre du champ commun (`loadValue`) ; tests du focus natif (`TextInput.prototype.focus` / `blur`), des sites de `flush`, du repli pendant la saisie, de `revealDelta` et du mode texte (`KeyboardField.test.tsx`). Le ± de Pause placé depuis la cellule mesurée traite la moitié « ± » de l'entrée E2 de `deferred-work.md` ; la tenue du tableau à 375 reste à juger en 2.7.
- Contrôles finaux : 119 suites, 3 074 tests, `npx tsc --noEmit` et `npm run lint` verts. Story laissée à `review` dans `sprint-status.yaml` : recette iPhone R-2.2-01 à 07 en attente ; issue (AC7) à consigner après les constats de Hermann.

## Spec Change Log

## Review Triage Log

Passe 1 (2026-10-19) — couches : Blind Hunter (B), Edge Case Hunter (E), Verification Gap (V).

| # | Constat | Verdict | Preuve / route |
|---|---|---|---|
| B1, E1, V-a | « Annuler » d'un ajustement du total avec une saisie modifiée en cours : `flush` consomme la saisie, puis `adjustment.previous` l'écrase (charge perdue) | medium | Vérifié (`handleAdjustmentUndo`). **patch** : une saisie qui change la charge est une modification du Brouillon — elle est appliquée et l'annulation n'a pas lieu (message retiré, D-5 / Q29). |
| B2, E2 | Même cas pour un retrait : `pendingRemoval` remis à `null` par la saisie, « Annuler » sans effet ni explication | low | Même racine que B1 ; **patch** commun (comportement explicite et testé). |
| B3, E5 | `commitKeyboard` compare au Brouillon du rendu (périmé) pour retirer le message | low | Les appels viennent d'un rendu à jour (hook recréé à chaque rendu) ; divergence seulement si deux validations se suivent sans rendu, improbable ; correctif plus complexe (état mis à jour dans un updater). Rejeté. |
| B4 | Surface clavier laissée ouverte si une cellule focalisée est démontée (repli) : ✓ / ✕ absorbés pour toujours | false | `toggleTable` envoie `closeAll` : l'effet sur `surface.open` court et prend la branche « champ démonté » (`onBlur(focused)`) ; Sans passe aussi par `closeAll`. Test de repli ajouté (V). |
| B5, V1, V2, V4 | Effet de perte de focus, « Fermer », Précédent / Suivant, `focusFirst` et la plupart des sites de `flush` non vérifiés (les tests émettent focus / blur à la main) | medium | Vérifié (mocks `focus` / `blur` sans événement). **patch** : tests sur `TextInput.prototype.focus` / `blur` et un test par site de `flush`. |
| B6, E4 | Toucher direct d'un autre champ, clavier déjà ouvert : aucune révélation | medium | Vérifié (`reveal` seulement à `keyboardDidShow` et dans `step`). **patch** : `reveal()` dans `onFocus` quand le haut du clavier est connu. |
| V3 | Calcul de révélation (FR-24) sans test | medium | Vérifié. **patch** : test du calcul (marge 12, au-dessus du corps, ligne visible). |
| B7 | Deux mécanismes de défilement (inset automatique et `scrollTo`) | false | Choix de la spec (Design Notes) : l'inset donne la course, la révélation ne défile que si la ligne sort de la zone ; à juger en R-2.2-05 / 06. |
| B8 | `register` renvoie un nouveau rappel de ref à chaque rendu ; garde inopérante | low | React détache puis rattache dans le même commit ; aucune suppression d'une inscription plus récente atteignable. Rejeté. |
| B9 | ± de Pause : origine de `pauseCell.x` différente de celle de la ligne du ± | false | La cellule mesurée est enfant direct de la ligne `DraggableRow` (sans marge), sœur de la ligne du ± dans le même conteneur : même origine que l'ancien `PAUSE_CELL_X`. |
| B10 | Champ Charge à largeur fixe 71 : déborde de sa colonne si les cellules rétrécissent ; cible tactile de 24 | low | Vérifié (`tableCellStyle`). **patch** : le champ suit sa colonne, `hitSlop` porté à 36 comme `TableCell`. Tenue à 375 : entrée existante de `deferred-work.md` (2.7). |
| B11 | `loadEditText` retire « kg » du texte de `formatLoadKg` | low | Vérifié (couplage au format d'affichage). **patch** : texte d'édition construit directement. |
| B12 | Champ commun et segmenté portent le même nom accessible « Charge » | low | Vérifié. **patch** : libellé propre du champ (lexique). |
| B13 | Aucun moyen de fermer le clavier décimal sur Android / web | false | Un appui extérieur range la surface et retire le focus ; AC2 admet le clavier natif seul hors iOS. |
| B14 | Texte local périmé après une transition en cours de saisie | low | Le champ se ferme (`closeAll`) à tous les sites sauf « Annuler », où l'affichage se corrige à la sortie sans réappliquer de valeur. Rejeté. |
| B15 | Mode texte (2.8) sans test | low | Vérifié. **patch** : test court (20 points de code, sans barre, Retour). |
| B16 | Charge commune à N = 1 en variables demandées non testée dans la Feuille | low | `setLoadValue("uniform")` à N = 1 couvert par les tests du domaine (2.1) ; l'ordre est testé. Rejeté. |
| E3 | Toucher direct d'un autre champ traité comme fermeture (règles du zéro) | false | Choix consigné dans les Design Notes ; seul Précédent / Suivant garantit l'absence de normalisation (AC2, matrice). |
| E6 | `step` vers un voisin sans entrée inscrite | false | L'ordre est celui des champs rendus (`loadFieldOrder`, tableau déplié) ; aucun voisin non monté atteignable. |
| E7 | Saisie de 22 chiffres → « 1e+21 kg », texte d'édition illisible | low | Saisie absurde ; vider le champ reste possible ; aucune borne de charge au domaine (hors story). Rejeté. |
| V-b | Fichiers nouveaux peut-être non suivis | false | Ajoutés au commit de la story. |

## Design Notes

- Hook `useSheetKeyboard({ draft, surface, dispatchSurface, commit, order, scrollRef, reduceMotion })` (`commit(apply, changed)` : mise à jour fonctionnelle du Brouillon par la Feuille, qui retire aussi le message d'ajustement si `changed`). Refs : entrées par champ (`register(field)`), champ focalisé, champ voulu, édition (champ, texte, texte initial).
  - `onFocus(field)` : champ voulu = focalisé = `field`, édition ouverte, `touch(keyboard(field))`.
  - `onBlur(field)` : l'édition est prise (consommée) et appliquée par `commit` ; si le champ voulu est encore `field` (aucun passage à un autre champ), c'est une fermeture : champ voulu effacé, `normalizeDraftLoad` dans le même `commit`, `blur(field)` au réducteur.
  - `flush(draft)` : prend l'édition (texte initial := texte) et renvoie `applyLoadEdit` ; synchrone, pour qu'une transition du même geste parte du Brouillon appliqué ; le `onBlur` qui suit n'applique plus rien.
  - Effet sur la surface ouverte : si un champ est focalisé et que la surface ouverte n'est pas `keyboard` du champ voulu → `blur()` natif (✓ / ✕ absorbés, autre surface, extérieur, `closeAll`).
  - `previous` / `next` : champ voisin dans `order` (aucune boucle) ; flush appliqué par `commit` sans normalisation ; champ voulu := voisin ; `touch(keyboard(voisin))` ; `focus()` du voisin — le clavier reste ouvert. `close` (« Fermer ») : `blur()` du champ.
  - `focusFirst()` : demande consommée par un effet après rendu (le premier champ n'existe qu'après l'activation).
- Révélation (AC4) : à `keyboardDidShow` (haut du clavier = `endCoordinates.screenY`, barre comprise sur iOS) et à chaque changement de champ voulu clavier ouvert : `measureInWindow` du corps défilant et du champ ; boîte de ligne = centre du champ ± demi-hauteur de ligne (36 en tableau, 44 sinon, passée à `register`) ; si le bas dépasse haut du clavier − 12, ou le haut passe au-dessus du corps, `scrollTo` de l'écart (animé sauf « Réduire les animations »). La Feuille reste ancrée en bas et le clavier la recouvre (Figma `9292:18077`) ; `automaticallyAdjustKeyboardInsets` (prop standard iOS de `ScrollView`) donne la course de défilement sous le clavier. Pas de `KeyboardAvoidingView` (AD-26 ; la Feuille déplacée animerait aussi ses transitions Reanimated).
- Toucher direct d'un autre champ : le système transfère le focus (`onBlur` puis `onFocus`), traité comme une fermeture suivie d'une ouverture ; seul Précédent / Suivant garantit l'absence de normalisation.
- Affichage : hors focus `formatLoadKg` (« 20 kg ») ; au focus le nombre seul au séparateur « , » (« 20 », « 1,25 »), vide pour 0 ; kg jamais saisi.

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- Recette iPhone R-2.2-01 à 07 par Hermann (AC6) ; aucun constat fabriqué.
