# Recette iPhone du 27/11/2026 (matin) — paquet DEATHBY3

> **Preuve.** La cause de la disparition du clavier est démontrée par le code source de React Native (voir « Constats ») ; le
> comportement réel sur iPhone (clavier, position de la feuille, retour du clavier après le choix) n'est **pas** reproductible en Jest :
> **hypothèse, à vérifier sur iPhone**. Les tests Jest ne prouvent que l'arbre JS (événements `Keyboard` simulés).

## Objectif

Écart relevé par Hermann (citation exacte) : « Lorsque le message sur l'arrondi s'affiche, le clavier disparait et la modale des
paramètres se baisse faisant apparaître la modale Death by et modifier une séance (soit 4 écrans affichés par couches sur un même
écran). Il ne faut que l'écran reste tel quel pendant le message (le clavier ne disparaît pas). »

Message concerné : alerte « Arrondir l'incrément ? » du Death by (`incrementCycleRounding`, lot 23, paquet FORMATS2, rapport
`2026-11-27_RECETTE-27-11-FORMATS2.md`, commit `1d7084965`), page Death by et modale des paramètres.

## Branche et commit de départ

- Worktree `C:\Dev\KODJO-R28-DEATHBY3`, branche `fix/recette-28-deathby3`.
- Départ : `900502584` (recette `recette/agenda-axe-20261124`, lot 23).

## Périmètre

- Demandé : écran tel quel pendant le message (clavier compris), page Death by et modale des paramètres ; analyse des causes ; primitive
  native prioritaire, pas de réimplémentation de l'alerte.
- Traité : modale des paramètres (`ExecutionParametersSheet` + `useSheetKeyboard`) et page du format (`FormatModelScreen`), pour la seule
  alerte d'arrondi de l'incrément du Death by.
- Non traité (hors paquet) : l'alerte d'arrondi de la durée de série (`askPhaseRounding`, décision du 09/11) a vraisemblablement le même
  défaut ; elle n'est pas citée par le paquet (baseline gelée) — signalé ci-dessous.

## Constats et causes

1. **Pourquoi le clavier tombe (démontré par le source, non observé sur appareil).** `Alert.alert` sur iOS passe par
   `RCTAlertManager` → `RCTAlertController show:` (`node_modules/react-native/React/CoreModules/RCTAlertController.mm`, RN 0.86.2) :
   une **nouvelle `UIWindow`** au niveau `UIWindowLevelAlert + 1` est créée puis rendue clé (`makeKeyAndVisible`) avant de présenter le
   `UIAlertController`. Le clavier système suit le premier répondeur de la fenêtre clé : la fenêtre de l'alerte n'en a pas, le clavier
   disparaît (`keyboardWillHide`), et le champ peut perdre son focus. Au choix, `hide` masque la fenêtre de l'alerte juste après le
   rappel JS. Le code de KODJO n'appelle ni `Keyboard.dismiss()` ni `blur()` avant l'alerte : en modale, l'alerte est ouverte par
   Suivant / Précédent (`step` → `takeExternal` → `applyExternalScalar` → `askIncrementRounding`), puis le focus passe au voisin.
   Conclusion : **la disparition du clavier pendant l'alerte est imposée par l'alerte native de React Native** ; la garder exigerait
   une modification native (fenêtre non clé, ou présentation dans la fenêtre de l'application) → nouveau build, interdit sans accord
   (À CLARIFIER). Aucune réimplémentation de l'alerte (règle des primitives natives).
2. **Pourquoi la modale se baisse.** La feuille est translatée vers le haut image par image sur la hauteur réelle du clavier
   (`keyboardLiftStyle`, `useAnimatedKeyboard`, point B du 26/11) ; le cadre du clavier suivi par `useSheetKeyboard`
   (`keyboardWillHide` → `keyboardFrame = null`) règle la marge de défilement du corps. Clavier retiré par l'alerte → hauteur 0 → la
   feuille redescend, laissant voir la page Death by et « Modifier une séance » dessous. Si le champ perd son focus, `onBlur` le traite
   en plus comme une fermeture (surface clavier fermée).
3. **Page Death by — défaut supplémentaire trouvé.** La case du tableau (`TableCell`) transmet sa valeur à **chaque frappe**
   (`onChangeText` → `onChange`) ; l'alerte du lot 23 (`onIncrement`) s'ouvrait donc dès le premier chiffre non multiple (ex. « 2 »
   pour 20 s, cycle 15 s → « Arrondir à 15 s »), en pleine saisie, retirant le clavier. Le comportement documenté (« à la validation de
   la saisie », rapport FORMATS2 : « saisir 20 s puis Suivant / Fermer ») n'était pas celui du code ; aucun test ne couvrait la page.

## PRESERVE / CHANGE / FORBIDDEN

| | Éléments |
|---|---|
| PRESERVE | Alerte native `Alert.alert` (titre, message, boutons « Arrondir à X », « Arrondir à Y », « Annuler » en style cancel, `cancelable: false`) ; règle d'arrondi `incrementCycleRounding` (inférieur ≥ 1 s, supérieur dans la borne, Répétitions sans message) ; ordre et comportement de Précédent / Suivant / Fermer (`step`, `close`) ; application de la saisie (`onBlur`, `flush`, `takeExternal`) ; remontée de la feuille sur le clavier natif (`useAnimatedKeyboard`, `sheetHeadroom`) ; barre `InputAccessoryView` ; alerte d'arrondi de la durée de série (`askPhaseRounding`) ; retrait de la charge vide à la fermeture du clavier sur la page (hors alerte) ; tout le reste de `FormatModelScreen` / `ExecutionParametersSheet`. |
| CHANGE | Retenue du cadre du clavier pendant l'alerte d'arrondi de l'incrément, focus rendu au champ voulu après le choix (modale et page) ; hauteur de remontée de la feuille gardée pendant l'alerte ; page : alerte à la sortie de la case au lieu de chaque frappe. |
| FORBIDDEN | Réimplémentation maison de l'alerte ; modification native (Swift/ObjC, patch de `RCTAlertController`) ; changement de primitive ; refonte du clavier ; `npm install`. |

Démonstration PRESERVE : les 7 tests FORMATS2 (`ExecutionParametersSheet.recette2611soir.test.tsx` : textes, boutons, style cancel,
Annuler garde 20 s, arrondi à 30 s puis ✓, multiple exact, Répétitions) passent sans modification ; tests de parcours clavier
(`keyboard0611`, `useSheetKeyboard`, `modale2.recette2611soir`, `ExecutionParametersSheet.test.tsx`) et de la page
(`FormatModelScreen.tableauUnique`, `d603`, `c3`) : voir « Tests ». La retenue n'agit que si une alerte d'arrondi d'incrément est
ouverte alors qu'une saisie continue (`wantedRef` non nul) ; sans alerte, aucun écouteur ne change de comportement.

## Modifications

- `src/features/activities/useSheetKeyboard.ts`
  - Type `AlertHold`, constante `KEYBOARD_ALERT_RETURN_MS` (800 ms).
  - `holdForAlert(onEnd)` : si une saisie continue (champ voulu), pose une retenue ; pendant elle, `keyboardWillHide` /
    `keyboardDidHide` / `keyboardWillChangeFrame` / `keyboardDidShow` ne changent plus le cadre, et une perte de focus du champ voulu
    n'est pas une fermeture. La fonction rendue (appelée au choix) rend le focus au champ voulu (`input.focus()`) ; le retour du
    clavier (`keyboardDidShow`) termine la retenue ; sinon, après 800 ms, la disparition est appliquée (cadre retiré). Sans saisie qui
    continue (« Fermer », appui extérieur) : `null`, rien n'est retenu.
- `src/features/activities/ExecutionParametersSheet.tsx`
  - `keyboardHoldHeight` (valeur partagée) : la remontée de la feuille utilise `max(hauteur du clavier, hauteur gardée)`.
  - `askIncrementRounding` : `keyboard.holdForAlert` avant `Alert.alert`, hauteur gardée ; chaque bouton (arrondis et Annuler)
    libère la retenue.
- `src/features/sessions/FormatModelScreen.tsx`
  - `useKeyboardFrame` : même retenue (cadre gardé pendant l'alerte, retour suivi, disparition appliquée après 800 ms), renvoie
    `{ frame, alertHoldRef, holdForAlert }`.
  - `cellBinding` : dernière case focalisée, perte de focus ignorée pendant l'alerte, contrôles à la sortie d'une case
    (`cellBlurChecks`) ; « Fermer » marqué (`keyboardClosingRef`) : aucune retenue.
  - Death by `onIncrement` : l'alerte est préparée à la frappe et ouverte à la sortie de la case, sur la valeur saisie ; écran gardé
    (`holdScreenForAlert`), focus rendu ensuite à la case voulue.
  - Écouteur « Vider toutes les cases retire la ligne à la fermeture du clavier » : sans effet pendant l'alerte.
- Test : `src/features/activities/__tests__/ExecutionParametersSheet.deathby3.recette2711.test.tsx` (3 tests).
- Documentation (classe B) : registre ch07, D-607 (complément daté) ; Formats § 9.9 (complément du 26/11 soir, point Death by).

## Tests et résultats

- `npx tsc --noEmit` : OK (0 erreur).
- `npx eslint` (3 fichiers source modifiés) : OK (0 erreur, 0 avertissement).
- `npx jest -w 1 --workerIdleMemoryLimit=800MB` :
  - `ExecutionParametersSheet.deathby3.recette2711.test.tsx` : 3/3 PASS (Précédent → alerte, clavier retiré par l'alerte simulé :
    marge du corps gardée ; Annuler + retour du clavier : saisie continuée, 20 s gardé ; arrondi choisi → 30 s, clavier non revenu →
    cadre retiré après 800 ms ; sortie du champ : aucune retenue).
  - `ExecutionParametersSheet.recette2611soir.test.tsx` : 7/7 PASS (inchangé).
  - `FormatModelScreen.tableauUnique.test.tsx`, `ExecutionParametersSheet.keyboard0611.test.tsx`, `useSheetKeyboard.test.ts`,
    `ExecutionParametersSheet.modale2.recette2611soir.test.tsx` : 87/87 PASS.
  - `ExecutionParametersSheet.test.tsx`, `FormatModelScreen.d603.test.tsx`, `FormatModelScreen.c3.test.tsx` : voir résultat consigné
    ci-dessous.
- Non couvert par Jest : la page Death by (alerte à la sortie de la case, retenue) — aucun test de page avec un mouvement à phases en
  Durée n'existe ; le scénario demande la composition d'un mouvement à phases dans le tableau (non ajouté, coût). Passe complète non
  lancée (consigne : faite par l'intégrateur).
- Une suite Jest verte ne prouve ni le clavier iOS, ni la position de la feuille (fil UI), ni le retour du focus.

## Classe documentaire

**B — évolution validée** (citation de Hermann). Documents touchés :
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` : D-607, complément « [Recette iPhone du 27/11/2026 (matin) : …] ».
- `docs/KODJO-Formats-entrainement-2026-11-02.md` § 9.9 (complément du 26/11/2026 soir, Death by — incrément et phases) : complément
  daté ; « à la validation de la saisie » précisé = sortie de la case.

## À CLARIFIER

1. **Clavier visible pendant le message.** Non réalisable avec l'alerte native de React Native sans modification native (fenêtre
   d'alerte rendue clé par `RCTAlertController`) → nouveau build. Repli appliqué : écran figé dans sa position avec clavier, clavier
   rendu au champ voulu après le choix. Si Hermann exige le clavier visible pendant le message : arbitrage entre un patch natif (build)
   et une autre forme de message (non native : contraire à la règle des primitives).
2. Pendant le message, la zone qu'occupait le clavier montre ce qui est sous la feuille remontée (sous le voile de l'alerte) : à
   vérifier sur iPhone si c'est acceptable.
3. L'alerte d'arrondi de la durée de série (`askPhaseRounding`) a vraisemblablement le même défaut : non traitée (hors paquet) ; même
   mécanisme réutilisable (`holdForAlert`) si Hermann le demande.
4. Retour du clavier après le choix : supposé par la remise du focus (ou par le retour de la fenêtre clé si le champ a gardé son focus) ;
   s'il ne revient pas sous 800 ms, l'écran redescend (comportement d'avant). À vérifier sur iPhone.

## Vérifications iPhone restantes

- Modale des paramètres du Death by (mouvement à phases 5 s + 10 s, unité Durée) : toucher « Incrément par intervalle », taper 20 s,
  Suivant (ou Précédent) → pendant « Arrondir l'incrément ? », la modale ne descend pas (ni la page Death by ni « Modifier une séance »
  ne réapparaissent) ; choisir « Arrondir à 30 s » ou « Annuler » → le clavier revient sur le champ suivant (ou précédent), modale à la
  même place.
- Page Death by (même mouvement, Durée) : toucher la case « ± / tour », taper 2 puis 0 → aucun message pendant la frappe ; Suivant →
  message ; la page ne bouge pas ; après le choix, le clavier revient sur la case suivante. Avec « Fermer » : message, puis clavier fermé.

## Fichiers modifiés

- `src/features/activities/useSheetKeyboard.ts`
- `src/features/activities/ExecutionParametersSheet.tsx`
- `src/features/sessions/FormatModelScreen.tsx`
- `src/features/activities/__tests__/ExecutionParametersSheet.deathby3.recette2711.test.tsx` (nouveau)
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/KODJO-Formats-entrainement-2026-11-02.md`
- `.github/orchestration/reports/2026-11-27_RECETTE-28-DEATHBY3.md` (ce rapport)

## Commit final et état Git

Voir le message de livraison (hash du commit de livraison, branche poussée `origin/fix/recette-28-deathby3`).
