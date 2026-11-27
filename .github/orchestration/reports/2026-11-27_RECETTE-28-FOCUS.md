# Recette iPhone du 27/11/2026 (matin) — paquet FOCUS (lot 24)

## Objectif

Standard unique du champ en saisie (focus, clavier ouvert) dans toute la saisie des paramètres : modale « Paramètres d'exécution » et modales de formats, page « Exercice libre », tableaux des formats, Composition (Compte à rebours, Fin de séance). Corriger deux défauts de « De chaque côté » (ligne vide, texte non centré).

## Branche et commit de départ

- Branche : `fix/recette-28-focus` (worktree `C:\Dev\KODJO-R28-FOCUS`).
- Départ : `900502584` (recette `recette/agenda-axe-20261124`, lot 23).

## Périmètre demandé (citations exactes de Hermann)

1. Ligne « Champ en saisie, De chaque côté » (KO) : « Exercice libre, modale paramètres d'exécution : le focus sur les champs ne respecte pas ce format (la ligne change toujours de couleur, pas de liseré, pas de grossissement). Appliquer ce même principe de manière cohérente et standard sur tous les champs des modales de tous les formats, et de la composition de séance. Comment se fait-il qu'il y a ces différences, n'y a-t-il pas un token pour cela ? »
2. Note b) : « Appliquer le même principe d'affichage des champs qui ont le focus, clavier ouvert pour : - Compte à rebours - Fin de séance - les champs des tableaux des formats (la hauteur des lignes du tableau ne doit pas varier). »
3. Note c) : « J'aimerais qu'on applique un standard pour toute la solution le format d'un standard pour le focus d'un champ dans la composition de séance, ou la modale des paramètres d'exécution. »
4. Note d) : « DD..>DG se présente toujours sur deux lignes, la deuxième est vide »
5. Note e) : « EMOM / For Time - Le texte Avec du changement de côté se présente dans son cadre sur une première ligne avec une deuxième vide. IL n'est plus centré verticalement. »

## Périmètre réellement traité

Points 1 à 5. Les champs de valeur saisis au clavier (cellules numériques) sont couverts partout où ils sont cités. Hors périmètre, voir « À CLARIFIER » : champs de texte (recherche, nom de séance, renommage de circuit, libellé de phase) et fiche Mouvement.

## Inventaire des rendus de focus et cause des écarts (réponse à « n'y a-t-il pas un token ? »)

Non, il n'existait aucun jeton commun. Il y avait **deux composants de saisie distincts**, nés à des dates différentes, chacun avec ses constantes locales :

| Rendu | Composant | Où | Focus avant ce lot |
|---|---|---|---|
| A | `KeyboardField` (`src/features/activities/KeyboardField.tsx`), modes `cellDuration` / `cellInteger` / `cellDecimal` | modale « Paramètres d'exécution » (Composition et modales de formats), page « Exercice libre », fiche Mouvement (`MovementPhasesEditor`) | fond `TABLE_CELL_ACTIVE_BACKGROUND` `#EAEAFF` (constante de `sheetTable.tsx`) ; **dans la modale seulement** (contexte `KeyboardFieldGrowContext`, branché `pageMode ? null : …`), agrandissement 1,15 et liseré bleu (lots du 26/11) |
| A' | ligne de la feuille (`Row`, calque `-selection`) | modale et page | modale : ligne non colorée depuis le 26/11 après-midi ; **page « Exercice libre » : ligne colorée** (`colors.stepperSurface`, condition `selected && compact`), exclue explicitement du point B du 26/11 (« page non citée ») |
| B | `TableCell` (`src/features/sessions/FormatTables.tsx`) | tableaux des formats et lignes de paramètres (`FormatModelScreen`, `FormatTables`, `ForTimeBlocks`), saisie en place de la Composition (`InlineDurationField` : Compte à rebours initial, Fin de séance, durée d'un Circuit porteur) | fond `valueFieldColors.active` `#E8E9FF` (constante de `valueField.ts`) ; ni agrandissement ni liseré ; la convention `valueField` (06/11) prescrivait même « Pas de liseré, dans aucune situation » |

Pourquoi ces différences :
- `tokens.ts` est figé (empreinte vérifiée par `pre4Story11Controls`, `tokensSpecification`) : chaque évolution a créé ses constantes locales (`sheetTable.tsx` pour la feuille, `valueField.ts` pour les formats), d'où deux fonds voisins (`#EAEAFF`, `#E8E9FF`).
- Les décisions du 26/11 (point B puis « liseré bleu ») ont été appliquées au seul périmètre cité alors : la modale. La page « Exercice libre » et `TableCell` (autre composant) sont restés à l'ancien rendu ; la convention « sans liseré » des formats n'a pas été revue.

## Constats et causes des points 4 et 5

- Le déclencheur du menu natif (« Avec » non sélectionné, ou l'enchaînement sélectionné) est une vue React Native de taille fixe (62 × 26 ou 116 × 26) : le texte y tient sur une ligne (l'élargissement à 116 du lot 23 n'a rien changé, ce qui confirme que la largeur n'était pas la cause).
- Ce déclencheur est hébergé par `Host matchContents` / `RNHostView matchContents` (`@expo/ui`). Ce dimensionnement sur le contenu est une boucle Yoga ↔ SwiftUI déjà responsable de défauts connus (PRE-7 B5, story 7.9, constat du 08/11 sur `CircuitHeader` : hôte mesuré avant la mise en page de son emplacement). Un hôte plus haut que son contenu, contenu calé en haut, donne exactement « une première ligne et une deuxième vide, plus centré verticalement ».
- Les deux points (Avec et « DD… → GG… ») passent par le même `NativeSideOrderMenu` ; la mention « EMOM / For Time » s'explique par le nombre de séries > 1 (seul cas où le menu existe).
- **Attribution : plausible, non démontrée.** Jest ne joue ni SwiftUI ni l'hôte natif.

Historique (règle VNext/recette) : mécanisme introduit par `3e5bc0278` (D-607, menu natif réintroduit, 26/11) et étendu par `3f37761f0` (lot 23, MODALE2 : déclencheur « Avec » idle, `key` de l'hôte, largeur 116). Dernière preuve de bon rendu sur iPhone : aucune connue pour ce menu dans la modale (première recette iPhone : 26/11 soir, déjà KO « ligne vide »). Détection : recettes du 26/11 soir et du 27/11 matin.

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE : `KeyboardField` (composition de saisie, clavier natif, barre rattachée, fond rouge / orange, règle « à renseigner reste rouge »), `TableCell` (composition, curseur, signe, unité, mesure de largeur, couleurs vide / à vérifier / à compléter, `barOnly`), primitive native `Menu` d'`@expo/ui` et ses options, `chooseSide` / `chooseNativeSide`, largeurs des options (62, 116), place réservée de la ligne, mécanique du clavier et du défilement (paquet CLAVIER2), alerte d'arrondi (paquet DEATHBY3), fiche Mouvement (contexte `null`, inchangée), `tokens.ts`.
- CHANGE : jetons et composant uniques du focus (`src/shared/ui/fieldFocus.tsx`) ; `KeyboardField` s'en sert ; contexte d'agrandissement fourni aussi par la page ; ligne de la page non colorée ; `TableCell` agrandi + liseré en saisie ; `valueFieldColors.active` et `TABLE_CELL_ACTIVE_BACKGROUND` dérivés du jeton (`#E8E9FF` → `#EAEAFF` pour les formats) ; hôte du menu natif « De chaque côté » à taille fixe.
- FORBIDDEN : modification de `tokens.ts` ; code natif (aucun nouveau build) ; réimplémentation du menu ; changement de mise en page des champs ou des lignes (transformation seule) ; défilement / clavier ; `CompositionScreen.tsx`, `FormatModelScreen.tsx` (aucun diff).

Démonstration : le diff ne touche ni `tokens.ts`, ni `CompositionScreen.tsx`, ni `FormatModelScreen.tsx`, ni le clavier ; dans `ExecutionParametersSheet.tsx`, seuls le `Provider` (1 ligne), le calque de sélection de `Row`, le style retiré et l'hôte de `NativeSideOrderMenu` changent ; les suites existantes de la feuille et des formats passent (voir Tests).

## Modifications

- `src/shared/ui/fieldFocus.tsx` (nouveau) : `fieldFocusTokens` (échelle 1,15, 160 ms, liseré 1 `colors.primary`, fond `#EAEAFF`), `useFieldFocusScale`, `fieldFocusTransform`, `FieldFocusFrame` (`${testID}-focus-frame`). Nouveau fichier de jetons : `tokens.ts` reste figé.
- `src/features/activities/KeyboardField.tsx` : utilise le standard (comportement inchangé dans la modale) ; `FIELD_GROW_SCALE` = jeton.
- `src/features/activities/ExecutionParametersSheet.tsx` : contexte d'agrandissement aussi en page (l. 3496) ; ligne jamais colorée (l. 4331, style `selectionBackgroundSelected` retiré, prop `selected` gardée sans effet) ; hôte `NativeSideOrderMenu` de taille fixe (l. 4658-4660).
- `src/features/sessions/FormatTables.tsx` : `TableCell` agrandi (transformation sur une vue enveloppe, `${testID}-focus-scale`) et liseré en saisie (l. 417-426), sauf case désactivée.
- `src/shared/ui/valueField.ts`, `src/features/activities/sheetTable.tsx` : fond de saisie dérivé du jeton.
- Tests : `src/features/activities/__tests__/fieldFocus.recette2711matin.test.tsx` (nouveau).
- Doc : registre ch07 (D-607, D-608, section « Homogénéité des tableaux… »), Formats (§ 9, après la recette du 26/11 après-midi), `src/shared/ui/README.md`.

## Tests et résultats

- `npx tsc --noEmit` : OK (aucune erreur).
- `npx eslint` sur les 6 fichiers source modifiés : OK.
- `npx jest -w 1 --workerIdleMemoryLimit=800MB src/features/activities/__tests__/fieldFocus.recette2711matin.test.tsx` : 6/6 réussis.
- Suites existantes : voir ci-dessous (complété après exécution).

- Feuille : `ExecutionParametersSheet*` (15 suites) et `KeyboardField.test.tsx` : 16 suites réussies, 447 tests réussis, 0 échec.
- Formats et Composition : `FormatModelScreen*` (9 suites), `CarrierDurationSheet.keyboard0611`, `FreeExerciseScreen.d608`, `CompositionScreen.d608`, `CompositionScreen.forTimeRepetitions`, `SegmentedControl`, `pre4Story11Controls` : 14 suites réussies ; 204 tests réussis, 33 ignorés (préexistants) ; **1 échec préexistant** : `pre4Story11Controls` « aucun jeton de tokens.ts n'est modifié » (empreinte attendue `814fde0b…`, reçue `de4ca174…`) — `tokens.ts` n'est pas touché par ce paquet (`git diff 900502584 -- src/shared/ui/tokens.ts` vide), échec signalé comme préexistant par le brief.
- Pas de passe complète (contrainte mémoire, faite par l'intégrateur).
- Avertissements `act(...)` nouveaux dans les tests de `TableCell` (lecture asynchrone de « Réduire les animations » par `useReduceMotion`) : sans échec.

Une suite Jest verte ne prouve pas le rendu iPhone (agrandissement, liseré, menu natif, hôte SwiftUI).

## Classe documentaire et documents touchés

Classe B (décisions explicites de Hermann) :
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` : complément daté dans D-607 (règle du standard, citations, « De chaque côté »), dans D-608 (page « Exercice libre ») ; annotation datée sous « Pas de liseré, dans aucune situation » (section « Homogénéité des tableaux des Formats et convention des champs de valeur »), citation d'origine conservée.
- `docs/KODJO-Formats-entrainement-2026-11-02.md` : complément daté après la recette du 26/11 après-midi (remplace « page « Exercice libre » inchangée » pour le focus).
- `src/shared/ui/README.md` : entrée `fieldFocus.tsx` (relevé des composants partagés ; aucun autre document de design system ne décrit les jetons hors `tokens.ts`).
Classe D : fond `#E8E9FF` → `#EAEAFF` (unification technique, écart imperceptible), consigné au registre.

## À CLARIFIER

1. Champs de texte (recherche du catalogue, nom de la séance `CompositionContextHeader`, renommage d'un circuit `CircuitHeader`, libellé de phase modifiable `KeyboardField` mode `text`) : non modifiés (ce ne sont pas des champs de valeur ; libellés de phases figés par D-608). Le standard doit-il s'y appliquer ?
2. Fiche Mouvement (`MovementPhasesEditor`, durées des phases) : non citée, inchangée (contexte `null`). « Toute la solution » l'inclut-elle ?
3. Points 4 et 5 : cause plausible (hôte natif dimensionné sur son contenu), non démontrée ; si l'iPhone montre encore la ligne vide, la piste suivante est le style propre du `Menu` SwiftUI (marges du libellé), qui demanderait un modificateur ou un module natif (nouveau build, non fait).
4. Agrandissement dans une option de segmenté (Charge « Avec », Cadence « Autre ») ou dans une colonne de 44 : le champ agrandi peut chevaucher l'option ou la colonne voisine (transformation sans mise en page), réserve déjà notée au lot 23.
5. Case de charge « à vérifier » (orange) encore vide en saisie : garde son fond orange (règle du 16/11) mais reçoit maintenant liseré et agrandissement.

## Vérifications restant à faire sur iPhone

- Exercice libre : toucher Cible, Pause, Compte à rebours : le champ grossit, liseré bleu, la ligne ne change pas de couleur.
- Modale d'un format (EMOM, AMRAP…) et ses tableaux : même rendu ; la hauteur des lignes ne bouge pas.
- Écran d'un format (`FormatModelScreen`) : cases des tableaux et lignes de paramètres : même rendu.
- Composition : Compte à rebours initial, Fin de séance, durée d'un Circuit porteur : même rendu.
- « De chaque côté » (plusieurs séries, EMOM et For Time compris) : « Avec » sur une ligne, centré ; « DD… → GG… » sur une ligne, sans ligne vide ; le menu s'ouvre toujours.

## Fichiers modifiés

- `src/shared/ui/fieldFocus.tsx` (nouveau)
- `src/features/activities/KeyboardField.tsx`
- `src/features/activities/ExecutionParametersSheet.tsx`
- `src/features/activities/sheetTable.tsx`
- `src/features/sessions/FormatTables.tsx`
- `src/shared/ui/valueField.ts`
- `src/shared/ui/README.md`
- `src/features/activities/__tests__/fieldFocus.recette2711matin.test.tsx` (nouveau)
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/KODJO-Formats-entrainement-2026-11-02.md`
- `.github/orchestration/reports/2026-11-27_RECETTE-28-FOCUS.md`

## Commit final et état Git

- Commit de code et de documentation : `08edd6b7d` ; commit documentaire final (résultats des tests de ce rapport) rattaché à `08edd6b7d`, sur `fix/recette-28-focus`, poussé sur `origin`.
- État Git après push : arbre propre (hors `node_modules`, jonction ignorée).
