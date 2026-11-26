# Recette iPhone du 26/11/2026 (après-midi) — paquet MODALE

## Identification

- Mission : corrections de la recette iPhone du 26/11/2026 (après-midi), paquet **MODALE** — modale « Paramètres d'exécution » (`ExecutionParametersSheet`), Composition et formats.
- Branche : `fix/recette-26-11-modale` (worktree `C:\Dev\KODJO-R26-MODALE`).
- Départ : `feat/exercice-libre-page-20261126`, commit `30214251f` (lots 20 et 21).
- Type : correction (classe documentaire B — décisions explicites de Hermann).

## Périmètre demandé (verbatim de Hermann)

- A. « Pas de barre horizontale au-dessus du titre. Fermeture uniquement par la croix (sans valider) ou la coche (valide) ; le glissé vers le bas est désactivé. » ; « La hauteur de la modale s'adapte au contenu : aucun espace superflu entre le dernier cadre et le bord de l'écran. » ; « Mettre le titre de la modale des paramètres d'exécution sur deux lignes s'il est trop long, centrer verticalement le texte avec les bords haut et bas de la zone colorée. »
- B. « Le clavier pousse le cadre et la modale vers le haut en un seul mouvement, parfaitement synchronisé avec les tableaux, à l'apparition comme à la disparition. » ; « L'animation verticale du clavier est plus lente, sans rebond du contenu de la modale. » ; « Tout le contenu de la modale reste visible au-dessus du clavier, autant que possible. » ; « La ligne n'est pas colorée au focus (contraste trop faible avec le champ). Le champ et son cadre grossissent légèrement pendant le focus et la frappe. »
- C. Cadence « Autre » : « même comportement que Charge. Aucun nouveau champ n'apparaît en dessous ; le focus se place sur le champ « Autre », vide, fond rouge, en attente d'une valeur au clavier. »
- D. « A la sélection du mode […] ne pas mettre par défaut "1 rép." pour le nombre de répétitions, mais un cadre fond rouge avec un trait. » ; AMRAP : « ne pas mettre "1 rép." ni "0" pour l'incrément, comme valeur par défaut, mais un trait horizontal et un fond rouge. »
- E. « Mouvement avec phases : je ne vois pas le tableau des phases dans la modale des paramètres d'exécution. »

Contraintes : mode `presentation="page"` (page Exercice libre) fonctionnel ; pas de restructuration du fichier (agent parallèle sur `FormatModelScreen` / modale Renforcement) ; ne pas toucher à `hostScreenFocused`.

## Périmètre réellement traité

Les cinq points, dans la modale (présentations `default` et `compositionCard`). La page « Exercice libre » (`presentation="page"`) garde son comportement (clavier, poignée remplacée par sa marge, surlignage des lignes, marges) — seuls les points D (domaine) et C (Cadence) s'y appliquent aussi, car ils passent par le même code de domaine / de contrôle. `hostScreenFocused` non touché ; `FormatModelScreen` non touché.

## Constats et causes

- A. La poignée (`styles.handle`, 50 × 4) était rendue au-dessus de l'en-tête dans la zone colorée ; aucun geste de glissé n'existe dans la modale (Modal RN `transparent`, sans `PanResponder`), mais le rebond iOS du corps défilant (`bounces`) déplaçait le contenu vers le bas. Marge basse du contenu : 24 + zone de l'indicateur d'accueil. Titre au nom du mouvement : `titleNumberOfLines: 1`.
- B. Trois mouvements indépendants à l'apparition du clavier : réserve `keyboardRoom` ajoutée sous les cadres (la feuille grandit avec la transition de mise en page de 350 ms, `SheetMotion`), course ajoutée par iOS (`automaticallyAdjustKeyboardInsets`, courbe du clavier) et défilement de révélation au `keyboardDidShow`, plus la réserve de la barre (64) — d'où désynchronisation et rebond. Fond de sélection de la ligne (`selectionBackgroundSelected`, #F2F2FF) et du groupe du tableau pendant la saisie d'une cellule.
- C. Autre révélait un champ clavier sous la ligne (`below`, `execution-sheet-beep-motion`), prérempli de la valeur courante.
- D. `setMode` (domaine) posait `numberTarget(1)` en Répétitions à la création. AMRAP : l'Incrément n'était « à renseigner » que si la page du format le demandait (`incrementRequired`).
- E. **Cause démontrée** : le cadre « Phases du mouvement » était retiré dans toute modale de format (`leanFormat || quickScope ||`, règle D-604), alors que D-608 point 6 vaut pour toutes les modales. La page Exercice libre (`freeFormat`) rend les phases dans son cadre Mouvement, d'où la différence. Dans la Composition, un exercice issu d'un format ouvre la même modale (`useMovementExerciseIntake`, `format`/`quickFormatName`) : même cause. Les paramètres de ces exercices portent bien `workPhases` (`repriseExecutionParameters`, `formatModels.ts` conserve `workPhases`).

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE : structure du fichier (aucun cadre déplacé), composants partagés (`ModalHeader`, `SegmentedControl`, `KeyboardField`, `KeyboardAccessoryBar`, `WorkPhasesTable`), montée/fermeture de la feuille (`sheetEntry`, `closeAnimated`), `hostScreenFocused`, révélation `reveal()` de `useSheetKeyboard`, page « Exercice libre » (clavier par réserve + `automaticallyAdjustKeyboardInsets`, marge 24, surlignage des lignes et du tableau), règles de validation existantes, Charge « Avec ».
- CHANGE : poignée (modale), lignes de titre (1 → 2), marge basse (modale), mécanique clavier (modale), surlignage au focus (modale), agrandissement du champ actif (modale), Cadence Autre, cible initiale en Répétitions, Incrément AMRAP sans valeur, condition du cadre des phases.
- FORBIDDEN : remplacement de primitive (le `TextInput` natif et le clavier natif restent), réimplémentation d'une feuille, restructuration du fichier, modification de `FormatModelScreen`, de `hostScreenFocused`, du `Modal visible`.

Démonstration PRESERVE : diff limité aux blocs listés ci-dessous ; chaque changement de la modale est conditionné par `pageMode` lorsqu'il touche la page (`keyboardRoom`, `automaticallyAdjustKeyboardInsets`, réserve de barre, `bodyContentModal`, `KeyboardFieldGrowContext` à `null`, surlignage gardé par `compact`) ; tests de la page (`ExecutionParametersSheet.libre.d608`, `FreeExerciseScreen.d608`) relancés.

## Modifications (localisées)

`src/features/activities/ExecutionParametersSheet.tsx` :
- import Reanimated (`useAnimatedKeyboard`, `useAnimatedStyle`, `useSharedValue`), `SHEET_KEYBOARD_BAR_ENABLED`, `KeyboardFieldGrowContext`, `useMemo` ; constante `KEYBOARD_BAR_LIFT_RAMP`.
- état `beepPending` + `beepEntryRef` (remplace `beepReveal`).
- bloc « point B » après `scrimBottom` : `animatedKeyboard`, `sheetHeadroom`, `sheetHeight`, `sheetMaxHeight`, `keyboardLiftStyle` (translation de la feuille sur la position du clavier natif, bornée par la place libre), `keyboardFieldGrow`.
- `tableSelected` : plus surligné pendant la saisie d'une cellule (modale).
- `chooseCadence` : Autre depuis 1″ / Sans → `beepPending` ; 1″ / Sans le lèvent.
- `beepOpen` / `cadenceOption` / `beepFieldShown` ; ordre Précédent/Suivant (`beepFieldShown`).
- `formatIncrementMissing` : AMRAP sans valeur → « — » rouge ; `validateDisabled`, `handleValidate`, `validateEnabled` : `beepPending` bloque le ✓.
- `scalarValueOf("beep")` : `null` en attente (champ vide).
- `cadenceControl` : option Autre sélectionnée → `KeyboardField` dans l'option (comme la charge commune), « — » sur fond rouge en attente.
- lignes Cadence (deux occurrences) : plus de `below` ni de `selected`.
- `keyboardRoom` (page seulement) et `keyboardScrollInset` (modale) ; `SheetMotionScrollView` : `automaticallyAdjustKeyboardInsets={pageMode}`, modale : `bounces={false}`, `contentInset`/`scrollIndicatorInsets` ; réserve de barre : page seulement ; `contentContainerStyle` + style `bodyContentModal` (marge basse 8).
- surface : `onLayout` (place libre), `maxHeight: sheetMaxHeight`, `keyboardLiftStyle`.
- poignée retirée (modale) ; `titleNumberOfLines: 2`.
- `KeyboardFieldGrowContext.Provider` autour du contenu (modale).
- cadre des phases : `freeFormat || phasesGroup === null` (plus `leanFormat || quickScope`).
- `Row` : fond de sélection seulement en page (`compact`).

Autres fichiers :
- `src/features/activities/KeyboardField.tsx` : `KeyboardFieldGrowContext`, `FIELD_GROW_SCALE` (1,08), cellule active agrandie (`Animated`, fil natif, 160 ms ; immédiat sous « Réduire les animations »).
- `src/features/activities/SheetMotion.tsx` : type de `style` de `SheetMotionView` élargi au style animé (aucun changement de comportement).
- `src/domain/activities/ExecutionParametersDraft.ts` : `setMode` — cible initiale `unsetTarget()`.
- `jest.setup.js` : simulacre `useAnimatedKeyboard` (valeurs partagées, clavier fermé).
- Tests mis à jour : `ExecutionParametersSheet.test.tsx`, `.keyboard0611.test.tsx`, `.libre.d608.test.tsx`, `ExecutionParametersDraft.test.ts` (attentes remplacées annotées, nouvelles attentes pour C et D).

## « Plus lente » (point B) — ce qui est possible

La durée et la courbe de l'animation du clavier iOS sont imposées par le système (`UIKeyboardAnimationDurationUserInfoKey`, ≈ 250 ms, courbe 7) ; une application ne peut pas les ralentir. La modale suit désormais le clavier image par image (`useAnimatedKeyboard`, fil UI) : un seul mouvement, sans rebond. La rendre plus lente que le clavier la désynchroniserait (contradiction avec « parfaitement synchronisé »). **À CLARIFIER** : si « plus lente » visait le rebond/saut ancien (trois mouvements de 350 ms et plus), il est supprimé ; sinon, choisir entre synchronisation (actuelle) et lenteur (désynchronisée).

## Tests et résultats

- `npx tsc --noEmit` : OK.
- `npx eslint` (fichiers modifiés) : 0 erreur ; 1 avertissement préexistant (`quickValueRow` inutilisé, présent au commit de départ).
- Jest ciblé (`-w 1 --workerIdleMemoryLimit=800MB`) — 1er passage : 31 échecs, tous liés aux comportements remplacés (champ de Cadence révélé sous la ligne, fond de sélection au focus, cible initiale 1, réserve clavier) ; tests mis à jour (attentes remplacées annotées). 2e passage : `ExecutionParametersSheet*` (13 suites), `ExecutionParametersDraft*`, `KeyboardField`, `ActivityEditorForm`, `MovementScreen.b2`, `CarrierDurationSheet`, `Composition*`, `Exercise*`, `formatKeyboard`, `FormatModelScreen*`, `FreeExerciseScreen*`, `movementPhaseDurations*` : 1743 réussis, 33 ignorés (préexistants), 2 échecs (`CompositionSaveFlow` : cible 1 en Répétitions ; `CompositionScreen.d608` : titre sur une ligne), corrigés puis relancés : 11/11 réussis.
- Passe complète non lancée (consigne : faite par le coordinateur).
- Une suite Jest verte ne prouve pas le rendu iPhone : animations, clavier réel, géométrie et toucher ne sont pas joués sous Jest.

## Classe documentaire et documents touchés

Classe **B** (décisions explicites de Hermann) :
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` : compléments datés dans D-607 (point B, clavier) et D-608 (points A, C, D, E) ; annotation de D-604 (phases dans toutes les modales).
- `docs/KODJO-Formats-entrainement-2026-11-02.md` : § 9.10 (complément daté) et § 9.7 (annotation de la liste des champs retirés).

## À CLARIFIER

1. « Plus lente » (ci-dessus).
2. Hauteur : marge sous le dernier cadre réduite à 8 (écart entre cadres) + zone de l'indicateur d'accueil (conservée pour ne pas poser le dernier cadre sous l'indicateur). Si Hermann veut aussi retirer cette zone, à confirmer.
3. « Glissé vers le bas » : la modale n'avait aucun geste de fermeture ; seul le rebond du défilement est retiré (`bounces={false}`).
4. AMRAP (point D) : les exercices AMRAP créés par la page du format portent déjà un Incrément numérique (`formatModels.ts`, `values.increment ?? 0`) — ce 0 enregistré à la création n'est pas distinguable d'un 0 choisi et reste affiché « + 0 rép. ». Seul un Incrément absent est maintenant « — » rouge dans la modale (Composition comme page du format). Corriger la création (`formatModels.ts`, hors périmètre, agent parallèle sur les formats) si Hermann veut « — » dans ce cas.
5. Phases dans les modales à départ rapide (Tabata, 30/30, HIIT, Renforcement…) : lecture appliquée = toutes les modales (« Composition et formats »). Le cadre des phases s'insère avant le cadre Séries ; l'agent qui construit la modale Renforcement à trois cadres devra le placer.
6. Point C, valeur personnalisée déjà choisie (ex. 3″) : Autre la reprend (champ prérempli), comme la charge commune ; seule une ouverture depuis 1″ / Sans est vide.

## Vérifications restant à faire sur iPhone

- A : pas de poignée ; titre long sur deux lignes puis « … », centré dans la zone colorée ; aucun glissé ni rebond du contenu ; espace sous le dernier cadre réduit.
- B : focus sur un champ (dont cellules) — la modale monte d'un seul mouvement avec le clavier et redescend avec lui, sans rebond ; contenu au-dessus du clavier et de sa barre ; modale haute : la ligne saisie remonte au-dessus du clavier (défilement) ; ligne non colorée ; champ légèrement agrandi (vérifier qu'il n'est pas rogné dans l'option Charge/Cadence).
- C : Autre → champ dans l'option, « — » fond rouge, clavier ouvert ; ✓ indisponible jusqu'à la saisie.
- D : choisir Répétitions → « — » rouge ; AMRAP sans Incrément → « — » rouge.
- E : mouvement à phases dans la Composition (exercice de format) et dans la page d'un format → ligne « n phases » et tableau.

## Fichiers modifiés

Voir la liste « Modifications » ; plus ce rapport.

## Commit final et état Git

- Commit de code et documentation : `84e27b320` (branche `fix/recette-26-11-modale`, poussée sur `origin`) ; ce rapport y est inclus, complété (résultats Jest, commit) par le commit documentaire suivant, rattaché à `84e27b320`.
- État Git attendu : arbre propre, branche à jour avec `origin/fix/recette-26-11-modale`.
- Tests modifiés en plus : `src/features/sessions/__tests__/CompositionSaveFlow.integration.test.tsx`, `src/features/sessions/__tests__/CompositionScreen.d608.test.tsx`.
