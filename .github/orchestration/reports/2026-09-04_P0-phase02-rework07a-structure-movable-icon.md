# P0 — Phase 2 — REWORK07-A — Icon / Structure / Movable uniquement

## Identification

- **Mission** : REWORK07-A — remplacer l'asset provisoire du pictogramme structurel « poignée de déplacement » par l'export canonique Figma/DSF `Icon / Structure / Movable` (`3066:4676`), corriger sa géométrie (glyphe `20×20`, slot `28×28`) et centraliser son opacité (`0.5`) dans le composant/token partagé, sans paramètre local par écran.
- **Objectif** : fermer un point cosmétique unique, isolé par un diagnostic indépendant qui a établi que les deux hausses successives de taille d'affichage (REWORK04 `16→20`, REWORK06 `20→24`) n'avaient pas corrigé l'aspect « encore trop petit » du pictogramme, parce que l'asset lui-même (`composition-reorder.svg`, `2537:1456`) était sous-dimensionné dans son propre canevas (encre limitée à `x=5…11` d'un `viewBox` `16×16`) — agrandir sa boîte d'affichage agrandissait un vide proportionnel, pas le tracé.
- **Issue** : [#35](https://github.com/MyUncried/Application-Routine/issues/35)
- **Autorisation** : `[ChatGPT] CHANGES_REQUESTED — REWORK07-A — ICON / STRUCTURE / MOVABLE UNIQUEMENT`, 2026-09-04T07:53:39Z (35ᵉ et dernier commentaire de l'Issue #35 au moment de cette clôture — confirmé par relecture intégrale de la liste des commentaires avant implémentation ; le seul commentaire publié depuis mon dernier checkpoint, `PHASE02_REWORK06_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`, 2026-09-04T00:50:41Z).

## Branche et commit de départ

- Branche : `feat/creation-seance-catalogue`
- HEAD initial (point de reprise attendu par l'autorisation, confirmé identique local/distant, worktree propre, avant toute modification) : `7aca9cb9142c830a01a721d81c49c413320ec24b`

## Périmètre demandé

Défini intégralement par le commentaire d'autorisation (texte complet relu et archivé), portant sur **un seul point cosmétique** : le pictogramme partagé `Icon / Structure / Movable`.

1. Récupérer l'export canonique du composant Figma/DSF `Icon / Structure / Movable`, node `3066:4676`.
2. Remplacer l'asset provisoire actuel (`composition-reorder.svg`) par cet export canonique — ne pas redessiner, étirer ou reconstruire le glyphe de mémoire.
3. Définition canonique : glyphe `20×20 pt` ; slot/conteneur `28×28 pt` ; opacité du composant/variant `Movable` : `0.5`.
4. Supprimer les dimensions locales REWORK06 `24×24` et `32×32`.
5. Supprimer tous les `opacity={0.5}` locaux appliqués à ce pictogramme.
6. Porter dimensions et opacité dans le composant/token DSF partagé, pour que chaque utilisation obtienne automatiquement et strictement le même asset/glyph/slot/opacité, sans paramètre d'écran.
7. Remplacer les usages existants de ce rôle structurel par cette primitive partagée, sans modifier les autres familles d'icônes.
8. Mettre à jour la documentation DSF/technique applicable (asset/node, glyph, slot, opacité, règle de réutilisation).
9. Le pictogramme reste purement structurel/non interactif — ne pas inventer de cible tactile ou de comportement de drag.
10. **Roulette, titres, contrôle Nombre de tours, shells, cartes (hors ce point précis), navigation et comportements** : `PRESERVE`/`FORBIDDEN` dans cette tranche.
11. Barrière `ASSET_REQUIRED` si l'export canonique n'est pas accessible/vérifiable — ne jamais substituer un SVG inventé.
12. Preuves obligatoires : vérification du fichier exporté contre la source Figma (node, dimensions/viewBox, identité) ; test positif glyph `20×20`/slot `28×28`/opacité `0.5` ; recherche prouvant l'absence de dimensions/opacités locales résiduelles ; diff borné ; `tsc`/`eslint`/tests ciblés puis suite Jest ; rapport à ce chemin exact.
13. Condition d'arrêt : `REWORK07A_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`, ou `ASSET_REQUIRED`/`SCOPE_EXPANSION_REQUIRED`. Ne traiter aucun autre point cosmétique, ne commencer aucun écran suivant.

## Périmètre réellement traité

Intégralement conforme au périmètre demandé, sans extension :

- **`assets/icons/composition-reorder.svg`** : contenu remplacé par l'export canonique du node `3066:4676` (téléchargé via l'outil Figma MCP `download_assets`, URL d'export à courte durée de vie), à l'octet près pour les deux tracés vectoriels — seul le `<rect>` de fond `#F5F5F5` propre au cadre d'export Figma (hors du groupe `Icon / Structure / Movable`, jamais un élément du glyphe) a été omis, par cohérence stricte avec la convention déjà en vigueur pour **tous** les autres assets du dépôt (`icon-tour.svg`, `composition-initial-countdown.svg`, etc. — aucun n'embarque de fond), vérifié par différence textuelle exacte (voir « Preuves »).
- **`assets/icons/manifest.json`** : entrée `composition.reorder` mise à jour — `figmaNodeId` `2537:1456` (asset provisoire) → `3066:4676` (canonique), `width`/`height` `16×16` → `20×20`. Seule entrée modifiée.
- **`src/shared/ui/tokens.ts`** : nouveau token `dimensions.structureMovableIcon = { glyph: 20, slot: 28 }` — source unique consommée par `KodjoIcon.tsx` (taille du glyphe) et `CompositionScreen.tsx` (taille du slot), remplaçant les deux littéraux locaux dupliqués.
- **`src/shared/ui/KodjoIcon.tsx`** : `sizes["composition-reorder"]` référence désormais `dimensions.structureMovableIcon.glyph` (`20×20`, était `24×24` en dur) ; nouveau registre `defaultOpacities` (opacité par défaut intrinsèque par nom d'icône, `0.5` pour `composition-reorder`, absente = `1` pour toutes les autres — comportement inchangé) ; le composant résout `opacity ?? defaultOpacities[name] ?? 1`, la prop `opacity` explicite restant disponible en priorité si un appelant en a réellement besoin. Aucune autre famille d'icônes modifiée.
- **`src/features/sessions/CompositionScreen.tsx`** : suppression des deux `opacity={0.5}` locaux (`BoundaryActivityRow`, ligne Exercice) ; `boundaryRowHandleSlot` référence désormais `dimensions.structureMovableIcon.slot` (`28×28`, était `32` en dur). Aucune autre géométrie, aucun autre comportement modifié.
- **`src/features/sessions/__tests__/CompositionScreen.test.tsx`** : les deux tests REWORK06 devenus obsolètes (slot `32×32`, icône Exercice `24×24`) remplacés par leurs équivalents REWORK07-A (slot `28×28` + icône interne `20×20`/opacité `0.5` ; icône Exercice `20×20`/opacité `0.5`).

Aucun fichier hors de cette liste n'a été modifié. La roulette, les titres de carte, le contrôle Nombre de tours, les shells, les autres cartes, la navigation et les comportements n'ont subi aucune modification. Aucun écran suivant n'a été démarré.

## Tableau PRESERVE / CHANGE / FORBIDDEN

| Élément | Statut | Preuve |
|---|---|---|
| Roulette (`DurationWheelPicker.tsx`, primitive native, contrat draft/committed) | **PRESERVE** | Fichier non touché dans ce diff (`git diff --numstat` : 6 fichiers, aucun n'est `DurationWheelPicker.tsx`). |
| Titres de cartes (`type.cardTitle`, `16/20`) | **PRESERVE** | `rowLabel`/`tourCardLabel` non modifiés dans ce diff. |
| Contrôle Nombre de tours (cadre `78×44`, carré violet `28×28`, valeur centrée) | **PRESERVE** | `tourCardControl`/`tourCardControlChevronBox`/`tourCardControlValue` non modifiés dans ce diff. |
| Shells (Header/Context/Bottom Action, contrat de scroll R4-13) | **PRESERVE** | Aucune ligne de ces zones dans le diff. |
| Autres cartes (Boundary rows hors slot gauche, ligne Exercice hors icône reorder) | **PRESERVE** | Seules les lignes citées ci-dessus (opacité, taille du slot) sont modifiées dans `CompositionScreen.tsx`. |
| Navigation, comportements, persistance | **PRESERVE** | Aucun fichier de ces domaines dans le diff. |
| Autres familles d'icônes (`action-add`, `control-back`, `icon-tour`, etc.) | **PRESERVE** | `sizes`/`sources`/`defaultOpacities` de `KodjoIcon.tsx` : seule l'entrée `composition-reorder` change de valeur ; toutes les autres clés restent des littéraux inchangés. |
| Asset `composition-reorder.svg` | **CHANGE** | Contenu remplacé par l'export canonique `3066:4676`, vérifié octet-identique aux tracés vectoriels de la source Figma (fond de cadre exclu, convention du dépôt). |
| `manifest.json` — entrée `composition.reorder` | **CHANGE** | `figmaNodeId`/`width`/`height` mis à jour vers les valeurs canoniques. |
| Glyphe affiché (`sizes["composition-reorder"]`) | **CHANGE** | `24×24` (littéral REWORK06) → `20×20` (`dimensions.structureMovableIcon.glyph`). Test dédié vert. |
| Slot/conteneur (`boundaryRowHandleSlot`) | **CHANGE** | `32×32` (littéral REWORK06) → `28×28` (`dimensions.structureMovableIcon.slot`). Test dédié vert. |
| Opacité `0.5` du pictogramme | **CHANGE** | Deux `opacity={0.5}` locaux supprimés ; portée par défaut dans `KodjoIcon.tsx` (`defaultOpacities`). Recherche exhaustive (voir « Preuves ») : zéro occurrence locale résiduelle pour ce pictogramme. |
| Redessin/reconstruction du glyphe « de mémoire » | **FORBIDDEN** | Non réalisé — octets exacts de l'export Figma utilisés (voir vérification ci-dessous), aucun tracé recréé manuellement. |
| Invention d'une cible tactile / comportement de drag | **FORBIDDEN** | Aucun `Pressable`/gestionnaire ajouté autour du pictogramme ; il reste purement décoratif dans les deux usages. |
| Modification d'une autre famille d'icônes | **FORBIDDEN** | Recherche ciblée : seules les lignes `composition-reorder` de `KodjoIcon.tsx` changent de valeur (voir diff). |

## Constats

- Le diagnostic indépendant de l'autorisation est confirmé par inspection directe de l'ancien asset : `composition-reorder.svg` (avant ce cycle) dessinait trois traits horizontaux dans un `viewBox 0 0 16 16`, occupant seulement `x=5` à `x=11` (37,5 % de la largeur du canevas) — un pictogramme visuellement beaucoup plus petit que son propre cadre. Les deux hausses de taille d'affichage précédentes (REWORK04 `16→20`, REWORK06 `20→24`) agrandissaient ce vide proportionnellement, sans jamais corriger le ratio encre/canevas.
- L'export canonique (`3066:4676`, `Icon / Structure / Movable`) est un pictogramme différent — trois traits horizontaux **et** une double flèche verticale (« poignée de déplacement » complète), dessiné dans un `viewBox 0 0 20 20` avec une occupation d'encre nettement supérieure (coordonnées `2` à `14`) — cohérent avec le nom DSF du composant et avec l'attente « poignée de déplacement », par opposition à l'ancien simple « hamburger » à trois traits.
- La baisse numérique du glyphe affiché (`24×24 → 20×20`) et du slot (`32×32 → 28×28`) n'est pas un retour en arrière sur l'intention de REWORK06 (« encore trop petites ») : c'est la correction de la cause racine identifiée par ce diagnostic — un asset sous-dimensionné dans son propre canevas, pas un conteneur trop petit.

## Preuves et tests

### Vérification de l'asset contre la source Figma

- `get_metadata` (Figma MCP, fichier `G6RY5Ebhgwb4AHIOYDwwvg`, node `3066:4676`) confirme : nom `Icon / Structure / Movable`, dimensions `20×20`, deux sous-calques vectoriels.
- `download_assets` (même node) renvoie l'export du nœud entier (`439` octets) — téléchargé, comparé octet à octet (hors mise en forme et hors le `<rect>` de fond de cadre, absent du groupe `Icon / Structure / Movable` et de tous les autres assets du dépôt) au fichier final commité :

```
diff <(tr -d '\r\n ' < <téléchargement Figma>.svg | sed 's/<rect[^>]*\/>//') \
     <(tr -d '\r\n ' < assets/icons/composition-reorder.svg)
→ IDENTICAL (background rect excluded)
```

### Recherche — absence de dimensions/opacités locales résiduelles

```
grep -rn "composition-reorder|opacity={0.5}|opacity: 0.5" src/ --include="*.tsx" --include="*.ts"
```

Résultat : les deux seules occurrences de `KodjoIcon name="composition-reorder"` (Boundary row, ligne Exercice) ne portent plus de prop `opacity` ; la seule définition d'opacité `0.5` pour ce nom est désormais `defaultOpacities["composition-reorder"]` dans `KodjoIcon.tsx`. Les autres occurrences de `opacity: 0.5` du dépôt (`ExerciseScreen.tsx:626`, `WheelSelectionOverlay.tsx:60`) appartiennent à des composants sans rapport avec ce pictogramme, non modifiés.

### Commandes exécutées et résultats

```
npx tsc --noEmit
→ sortie vide, code de sortie 0

npx eslint .
→ sortie vide, code de sortie 0

npx jest src/features/sessions/__tests__/CompositionScreen.test.tsx --maxWorkers=2
→ Test Suites: 1 passed, 1 total
→ Tests:       60 passed, 60 total

npx jest --maxWorkers=2   (suite complète du projet)
→ Test Suites: 37 passed, 37 total
→ Tests:       485 passed, 485 total
```

### Tests positifs dédiés (glyph 20×20 / slot 28×28 / opacité 0.5)

- « REWORK07-A — the structure/move slot is back to the canonical 28×28... » (`CompositionScreen.test.tsx`) : vérifie `boundaryRowHandleSlot` `28×28` **et** l'icône interne `20×20`/`opacity:0.5`.
- « REWORK07-A — the composition-reorder (grip handle) icon on the Exercise row now displays the canonical 20×20 glyph... » : vérifie l'icône de la ligne Exercice `20×20`/`opacity:0.5`.

Ces deux tests couvrent les deux seuls usages réels du pictogramme dans l'application — aucun fichier de test dédié à `KodjoIcon.tsx` n'existe dans ce dépôt (convention déjà établie : les tailles/opacités d'icônes sont vérifiées via les écrans qui les consomment) ; ce cycle suit cette convention plutôt que d'introduire un nouveau fichier de test isolé, hors du périmètre strictement nécessaire.

## Hypothèses non démontrées

- **Rendu device réel** (`NON_VERIFIABLE_DEVICE`) : le rendu pixel exact du nouveau glyphe (proportions, netteté à `20×20`, perception visuelle de l'opacité `0.5`) sur iPhone n'est pas vérifiable dans cet environnement. Ce rapport ne prouve que l'identité octet-à-octet de l'asset avec la source Figma et les valeurs de style transmises au composant, jamais le rendu final à l'écran.
- Le nouveau pictogramme (trois traits + double flèche verticale) est visuellement différent de l'ancien (trois traits seuls) — un changement de forme, pas seulement de taille. Ce changement de forme est la conséquence directe et voulue du remplacement d'asset demandé par l'autorisation ; il n'a pas été possible de le confirmer visuellement autrement que par inspection du SVG source, faute de device.

## Fichiers modifiés

| Fichier | +/- |
|---|---|
| `assets/icons/composition-reorder.svg` | +6 / -1 |
| `assets/icons/manifest.json` | +1 / -1 |
| `src/features/sessions/CompositionScreen.tsx` | +30 / -11 |
| `src/features/sessions/__tests__/CompositionScreen.test.tsx` | +13 / -6 |
| `src/shared/ui/KodjoIcon.tsx` | +48 / -14 |
| `src/shared/ui/tokens.ts` | +14 / -0 |

## Éléments non corrigés ou hors périmètre

- Roulette, titres de cartes, contrôle Nombre de tours, shells, autres cartes, navigation, comportements et persistance : non touchés, `PRESERVE`/`FORBIDDEN` explicite de cette tranche.
- Aucun autre point cosmétique traité (conformément à « Ne traiter aucun autre point cosmétique »).

## Vérifications restant à effectuer sur appareil réel

- Confirmation visuelle sur iPhone que le nouveau pictogramme (glyphe `20×20`, slot `28×28`, opacité `0.5`) correspond bien au rendu Figma/DSF attendu et n'est plus perçu comme « trop petit » — c'est la preuve que ce cycle ne peut par construction pas produire dans cet environnement.
- Confirmation que le changement de forme du glyphe (ajout de la double flèche verticale) est bien perçu comme la « poignée de déplacement » attendue et non comme une régression visuelle inattendue.

## Modifications réalisées

Voir « Périmètre réellement traité » et le tableau PRESERVE/CHANGE/FORBIDDEN ci-dessus pour le détail exhaustif fichier par fichier.

## État Git

- Branche : `feat/creation-seance-catalogue`
- HEAD avant ce rapport : `7aca9cb9142c830a01a721d81c49c413320ec24b` (identique local/distant, vérifié par `git fetch` avant toute modification)
- Ce rapport sera committé séparément du commit de code applicatif, conformément à l'exigence de livraison documentaire (`CLAUDE.md`).

### SHA finaux

- **SHA applicatif** : `817f9daaa9056b82786eb454593608efdd336e3c` (`fix(T01-S07/S08): REWORK07-A — remplace l'asset Icon/Structure/Movable`).
- **SHA rapport** : voir commit `docs(orchestration): ...` immédiatement suivant, contenant ce fichier — renseigné dans le commentaire de transition GitHub.
- **État Git final** : `working tree clean`, branche `feat/creation-seance-catalogue`, HEAD local = HEAD distant après push (vérifié post-commit).

## Statut de clôture

`REWORK07A_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION` — implémentation, tests (`tsc`/`eslint`/Jest complet) et documentation conformes au périmètre strictement autorisé ; seule la vérification perceptive sur iPhone réel reste hors de portée de cet environnement.

## Self-check Claude

- Le seul commentaire de l'Issue #35 publié depuis mon dernier checkpoint (REWORK06, HEAD `7aca9cb`) a été relu intégralement avant implémentation : `[ChatGPT] CHANGES_REQUESTED — REWORK07-A`, texte intégral archivé et confronté point par point à l'implémentation ci-dessus.
- Aucune autre famille d'icône, aucun autre écran, aucune roulette/titre/contrôle Tour/shell n'a été touché — vérifié par `git diff --numstat` (6 fichiers, tous strictement dans le périmètre listé par l'autorisation).
- L'asset a été vérifié octet-identique à la source Figma (fond de cadre exclu, convention constante du dépôt), jamais redessiné de mémoire.
- La recherche d'absence de dimensions/opacités locales résiduelles a été exécutée et documentée explicitement, pas seulement affirmée.
- `tsc --noEmit`, `eslint .` et la suite Jest complète (37 suites, 485 tests) sont verts au moment de la rédaction de ce rapport.
