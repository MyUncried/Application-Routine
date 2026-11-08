# PRE-9 — Recette iPhone du 08/11/2026 : catalogue d'un Format (b-cat-fondu, b-cat-fermer, b-cat-niveau)

- Identifiant : PRE9-RECETTE-0811-CATALOGUE
- Objectif : diagnostiquer puis corriger les remarques b-cat-fondu, b-cat-fermer et b-cat-niveau de Hermann (mode catalogue ouvert par « + Ajouter » dans un Format ; Niveau des cartes « Mouvement sélectionné »).
- Branche : `feat/pre9-catalogues-cartes-badge-20261106` ; commit de départ : `5d5a5ec0`.
- Mission de correction menée par un sous-agent ; consigne de l'appelant : aucun commit ni push. Ce rapport est livré **non committé** : le commit qui le contiendra reste à créer par l'appelant.
- Travail en parallèle : un autre agent modifiait au même moment `FormatTables.tsx`, les tableaux / paramètres / Déroulé du récapitulatif dans `FormatModelScreen.tsx`, `fr.ts` et le chapitre 07 ; la session principale modifiait `CompositionScreen.tsx`. Ces fichiers ou zones n'ont pas été touchés (dans `FormatModelScreen.tsx` et le chapitre 07, petites modifications Edit seulement, zone relue avant chaque modification).

## Notes de Hermann (verbatim)

1. b-cat-fondu (KO) : « Les boutons apparaissent toujours avec un décalage, puis arrivent les zones corporelles bien après. Quel est le diagnostic de ce problème plusieurs fois rapporté ? Appuyer sur Revenir aux paramètres fait disparaître la liste et apparaître le questionnaire avec environs 0.5 secondes entre les deux où la page est blanche… Appuyer sur +Ajouter crée un saut, et la zone de contexte de la page du catalogue n'a plus le transparent progressif… n'utilises tu pas la même page avec un remplacement d'une partie du contenu ??? »
2. b-cat-fermer (OK avec remarque) : « Même commentaire que lorsqu'on appui sur Revenir aux paramètres »
3. b-cat-niveau (KO) : « Oui. Mais dans le questionnaire et le récapitulatif le niveau est de nouveau bleu et pas aligné. C'est à corriger »

## Périmètre

Demandé : A diagnostic démontré ; B fondu enchaîné à l'ouverture et à la fermeture du mode catalogue, zone de contexte en place avec sa part fondue, boutons / cartes / pastilles ensemble, « Réduire les animations » respecté ; C Niveau noir et sur la ligne de base partout ; tests ; documentation.

Traité : tout le périmètre demandé.

## Historique (règle du diagnostic historique)

- Le mode catalogue d'un Format est, depuis le 05/11/2026 (§19), un remplacement de contenu dans le même `ScrollView` que les paramètres (`catalogueMode`), avec recherche figée et bouton du bas en couches absolues.
- `5d5a5ec0` (07/11 au soir, remarques D et E) a introduit : une seule valeur `catalogueOpacity` appliquée au contenu défilant, à la recherche et au bouton du bas ; ouverture `set(0)` puis fondu vers 1 ; fermeture fondu vers 0, remplacement du contenu, puis `requestAnimationFrame` et fondu vers 1 ; préchargement `Image.prefetch(…, "memory-disk")`. Ce commit introduit la page blanche (attribution **démontrée** : enchaînement séquentiel dans `fadeCatalogueOut` / `finishCatalogueClose`). Avant lui, la bascule était instantanée (pas de blanc, mais apparition brute, remarque D).
- Le masquage de la part fondue de la zone de contexte vient du fond blanc opaque de la recherche (recette t-recherche du 06/11, `searchZoneSolid` qui commence à `top: -16`, soit au bas de la zone peinte) ; il existait donc avant `5d5a5ec0` (attribution **démontrée** par le code ; date exacte de la première détection par Hermann : 08/11).
- Les commandes Filtrer / Trier / Replier en différé (`commandsShown` après `requestAnimationFrame`, `FadeIn.duration(220)`) datent de la recette f4-catalogue du 04/11 (« les 3 boutons apparaissent »).

## Diagnostic (niveau de preuve)

1. **Page blanche à « Revenir aux paramètres », « Fermer sans sélectionner », « Ajouter X mouvement(s) » — démontré (lecture du code).** `fadeCatalogueOut` animait la même opacité que portaient le contenu, la recherche et le bouton jusqu'à 0 (450 ms), puis `finishCatalogueClose` remplaçait le contenu et relançait, à l'image suivante, un fondu de 0 à 1 (450 ms). Entre les deux, tout le contenu est à 0 : page blanche (seule la zone de contexte reste), environ 0,5 s autour du point bas. C'était bien « la même page avec un remplacement d'une partie du contenu ».
2. **À l'ouverture, disparition brute des paramètres — démontré.** `fadeCatalogueIn` faisait `set(0)` immédiat : les paramètres disparaissaient d'un coup avant l'arrivée de la liste.
3. **Perte du « transparent progressif » de la zone de contexte — démontré.** La zone de recherche (`styles.searchZone`, zIndex 1) était rendue après la zone de contexte (`styles.band`, zIndex 1, même niveau) donc peinte au-dessus ; son fond blanc opaque (`searchZoneSolid`, `top: -16`) commençait exactement au bas de la partie peinte, c'est-à-dire sur la part fondue de 22 pt (`bandFade`) : la transition couleur → transparent devenait un bord net.
4. **Saut à « + Ajouter » — démontré (deux causes).** (a) La liste était décalée de `searchZoneHeight`, mesurée par `onLayout` après le premier rendu (0 à la première ouverture) : la liste s'affichait puis descendait. (b) La liste partageait le défilement des paramètres : l'en-tête « Mouvements » passait de sa place dans le défilement à la zone figée, et l'effet « liste au début » (`scrollTo(0)`) faisait défiler le même `ScrollView`.
5. **Boutons décalés — démontré pour Filtrer / Trier / Replier ; plausible pour le bouton du bas.** Les commandes étaient montées une image après la liste (`requestAnimationFrame(() => setCommandsShown(true))`) avec leur propre fondu de 220 ms, et le champ se rétrécissait alors (transition de 220 ms) : décalage démontré. Le bouton du bas, lui, était dans le même rendu et sous la même opacité que la liste : un décalage propre n'est pas démontré par le code ; plausible : perception due au saut de la liste (point 4) et aux images des cartes (photos et pastilles) qui arrivent après.
6. **Pastilles des zones corporelles bien après les cartes — démontré (sources `expo-image` 57.0.3 lues).** Le préchargement avait bien lieu, mais n'était jamais lu par l'affichage : `ImageModule.swift` (`prefetch`) range l'image avec `queryCacheType`/`storeCacheType = none` et `originalStoreCacheType = memory-disk` (cache des originaux) ; une icône `KodjoIcon` n'a pas de `cachePolicy`, donc « disk » par défaut (`ImageView.swift`), et `createSDWebImageContext` (`ImageUtils.swift`) interroge alors le disque seulement (jamais la mémoire). Chaque pastille montée repasse donc par une lecture disque asynchrone et un décodage SVG (SDImageSVGCoder) avant d'apparaître, après la carte (vues natives immédiates). En développement, le premier chargement passe en plus par Metro.

## Corrections

- **Fondu enchaîné (`FormatModelScreen.tsx`, mode catalogue).** Le catalogue devient une couche (`format-catalogue-layer`) : fond blanc opaque, recherche figée en tête (`marginTop` = zone de contexte + 16, sans mesure), résultats dans leur propre `ScrollView` (`format-catalogue-scroll`, clavier gardé, défilement jamais figé), « Fermer sans sélectionner » / « Ajouter X mouvements » dans sa propre zone d'action. Une seule opacité (0 → 1 à l'ouverture, 1 → 0 à la fermeture, 450 ms, courbes inchangées). Les paramètres restent montés et immobiles dessous (masqués à VoiceOver pendant le catalogue, zone « Valider les paramètres » masquée) : les deux contenus se croisent, sans page blanche. À « Ajouter X mouvements », l'ajout s'applique au début du fondu (les cartes ajoutées apparaissent pendant le fondu) ; la fermeture (mode, sélection, recherche) a lieu à la fin. Un second appui pendant le fondu est ignoré ; pendant le fondu de sortie, la couche ne reçoit plus de toucher. Sous « Réduire les animations » : ouverture et fermeture immédiates. Le message du Superset (fermeture directe) remet l'opacité à 0.
- **Zone de contexte.** La couche passe sous la zone de contexte (zIndex 1 de `styles.band`) : la part fondue reste visible dès l'apparition et la zone ne bouge pas.
- **Boutons.** Filtrer, Trier et Replier sont rendus avec la liste (plus de montage différé ni de fondu propre).
- **Pastilles — solution retenue : rendu synchrone par image native préchargée, plus attente bornée.** `KodjoIcon.tsx` : `preloadKodjoIcons` (`Image.loadAsync`, l'image native est gardée) ; une icône préchargée reçoit cette image pour `source` — `expo-image` l'affiche dans le setter de propriété (`renderSourceImage`), sans cache ni décodage. Préchargement à l'ouverture du Format ; le fondu d'apparition attend `whenKodjoIconsReady` au plus 300 ms (normalement déjà prêt). Justification : c'est le seul chemin d'`expo-image` qui ne dépend d'aucune requête de cache ; une `cachePolicy` « memory-disk » aurait dépendu de l'éviction du cache mémoire et de la clé de cache ; retarder sans précharger n'aurait pas rendu la pastille synchrone. `prefetchKodjoIcons` est supprimé (seul appelant : ce Format).
- **Niveau (`SelectedMovementCard.tsx`).** Niveau `colors.textPrimary` (#141414) et première ligne `alignItems: "baseline"` pour toutes les cartes « Mouvement sélectionné » (catalogue, questionnaire, récapitulatif — même composant, seul utilisé dans ces écrans) ; prop `inCatalogue` supprimée. Le liseré bleu de la carte choisie est inchangé.

## Tests et résultats

- Ajustés : `FormatModelScreen.r0711.test.tsx` (B : #141414 et ligne de base, catalogue puis carte du questionnaire ; D : préchargement `Image.loadAsync`, image native donnée à la pastille) ; `FormatModelScreen.c3.test.tsx` (résultats dans `format-catalogue-scroll` ; recherche à `marginTop` 117 ; test des gestes buy-in / buy-out : le registre de test de react-native-gesture-handler garde l'ancien identifiant d'un geste renommé maintenant que les cartes ne sont plus démontées — vérification par l'identifiant porté par le geste).
- Ajoutés (`FormatModelScreen.r0711.test.tsx`, « Recette iPhone du 08/11/2026 ») : ouverture (un seul fondu 0 → 1, paramètres montés et masqués à VoiceOver, commandes sans fondu propre) ; zone de contexte au-dessus de la couche, part fondue présente, recherche hors de la zone de contexte ; « Ajouter 1 mouvement » (carte ajoutée visible pendant le fondu, couche sans toucher, fermeture à la fin) ; « Revenir aux paramètres » et « Fermer sans sélectionner » (un fondu, second appui ignoré) ; le fondu d'apparition attend l'image préchargée ; « Réduire les animations ».
- `npx jest src/features/sessions/__tests__/FormatModelScreen* CatalogueScreen* src/features/activities/__tests__/MovementSelectionScreen* --testPathIgnorePatterns "\.claude" -w 2` : **9 suites, 126 tests PASS**.
- Dépendants : `CompositionScreen.test.tsx`, `CompositionScreen.envelopeFormat`, `formats.recette0511/0611/0811`, `FormatsWindow.c2`, `formatKeyboard.recette0411`, `formatSessionSummary` : **8 suites, 493 tests PASS**.
- `src/shared/ui/__tests__` : `PrimaryActionZone`, `CatalogueCommands`, `ScreenShell`… PASS ; **échecs hors périmètre** : `tokensSpecification.test.ts` (2) et `pre4Story11Controls.test.ts` (1) — comparaison de `tokens.ts` au chapitre 12 et empreinte de `tokens.ts` ; ni `tokens.ts` ni le chapitre 12 ne sont modifiés par cette mission (écart issu des jetons D-501 révisée de `5d5a5ec0`, à traiter séparément).
- `npx tsc --noEmit` : aucune erreur (après stabilisation des modifications parallèles ; une erreur transitoire `styles.summaryRow` venait du travail en cours de l'autre agent).
- `npx eslint` sur `FormatModelScreen.tsx`, `SelectedMovementCard.tsx`, `KodjoIcon.tsx`, `FormatModelScreen.r0711.test.tsx` : aucune erreur. `FormatModelScreen.c3.test.tsx` : 1 erreur `react-hooks/refs` (ligne 105, Harness) et 1 avertissement (`Alert`) antérieurs, hors des lignes modifiées.
- Aucun test ne valide le rendu visuel ni la fluidité.

## Hypothèses non démontrées

- Rendu synchrone de la pastille par image native : démontré dans les sources `expo-image` (`Prop("source")` → `renderSourceImage`), non observé sur iPhone ; rendu SVG vectoriel identique attendu (même décodeur, sans miniature, comme l'affichage actuel sans `tintColor`).
- Coût des paramètres gardés montés pendant le catalogue (chaque frappe de recherche re-rend aussi les paramètres, dans le même composant) : non mesuré ; à surveiller sur iPhone (fluidité de la saisie).
- Les photos des cartes (`MediaPreview`, `expo-image`) restent chargées de façon asynchrone ; Hermann ne les a pas signalées.
- Bouton du bas perçu avant la liste : cause plausible (points 4 et 6), non démontrée.

## Hors périmètre / non corrigé

- `FormatTables.tsx`, tableaux / paramètres d'exécution / Déroulé du récapitulatif, `CompositionScreen.tsx`, `ExecutionParametersSheet.tsx`, `sheetTable.tsx` : non touchés.
- Tests de jetons en échec (voir ci-dessus).

## Documentation (règle de synchronisation)

- b-cat-fondu / b-cat-fermer : classe B (fondu enchaîné, remplace E et le fondu de D du 07/11) ; zone de contexte : classe A (f4-modale du 04/11) ; commandes et pastilles : classe B (w-liste du 06/11) ; b-cat-niveau : classe B.
- Chapitre 07 : sous-section « Recette du 08/11/2026 — catalogue » (notes recopiées, classes, corrections) ; annotations datées des entrées B, D et E du 07/11.
- `docs/KODJO-Catalogues-cartes-modales-2026-11-06.md` §7 : règle du Niveau de la petite carte « Mouvement sélectionné » (ancienne formulation annotée « remplacé le 08/11/2026 »).

## À vérifier sur iPhone (Metro relancé avec `--clear`)

1. « + Ajouter » : les paramètres s'effacent pendant que le catalogue apparaît (pas de blanc) ; la zone colorée ne bouge pas et garde son dégradé vers le transparent ; la liste ne saute pas, y compris à la première ouverture et depuis un questionnaire défilé.
2. Recherche, Filtrer / Trier / Replier, cartes, pastilles des zones et bouton du bas apparaissent ensemble.
3. « Revenir aux paramètres », « Fermer sans sélectionner », « Ajouter X mouvement(s) » : fondu enchaîné, aucune page blanche ; à l'ajout, les cartes apparaissent pendant le fondu ; les paramètres sont à la position d'avant l'ouverture.
4. Niveau noir et sur la ligne de base du nom : catalogue, questionnaire, récapitulatif.
5. « Réduire les animations » activé : bascules immédiates.
6. Fluidité de la saisie dans la recherche du catalogue.

## Fichiers modifiés

`src/features/sessions/FormatModelScreen.tsx` (mode catalogue seulement), `src/features/activities/SelectedMovementCard.tsx`, `src/shared/ui/KodjoIcon.tsx`, `src/features/sessions/__tests__/FormatModelScreen.r0711.test.tsx`, `src/features/sessions/__tests__/FormatModelScreen.c3.test.tsx` (trois assertions), `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` (annotations et nouvelle sous-section), `docs/KODJO-Catalogues-cartes-modales-2026-11-06.md` (une ligne), ce rapport.

## Commit final et état Git

Aucun commit (consigne de l'appelant). HEAD `5d5a5ec0` ; arbre de travail modifié, avec les modifications parallèles d'autres agents (`FormatTables.tsx`, `CompositionScreen.tsx`, `fr.ts`, `formats.recette0611/0811`, `KODJO-Formats-entrainement`, rapport TABLEAUX) non liées à cette mission.
