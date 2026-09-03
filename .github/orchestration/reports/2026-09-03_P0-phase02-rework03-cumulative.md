# Rapport de mission — Phase 2 Composition, correction cumulative REWORK03

TÂCHE
T01-S07/S08 — Composition d'une séance + Navigation basse (Catalogue), correction cumulative post contre-recette iPhone
Autorisation : `[ChatGPT] DEVICE NO-GO — PHASE02 REWORK03 CUMULATIVE CORRECTION` (supersède `[ChatGPT] DEVICE VERIFICATION NO-GO — PHASE02 WHEEL GEOMETRY`, commentaire #5527075883)

STATUT
`PHASE02_REWORK03_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`

BRANCHE ET COMMIT DE DÉPART
`feat/creation-seance-catalogue`, HEAD `9fcf9a289559e13df12fa57167a9c60b0de7d31b` (vérifié propre et synchronisé avec `origin` par `git fetch` avant implémentation)

## Périmètre demandé

Registre cumulatif W-01 à W-05 (roulette native), C-01/C-02 (cartes limites), T-01 à T-05 (carte Tour), A-01 (zone d'action basse), N-01 à N-03 (navigation basse Catalogue) — texte intégral verbatim dans le commentaire GitHub source, repris ci-dessous.

## Périmètre réellement traité

L'intégralité du registre W/C/T/A/N a été traitée. Aucun point n'a été laissé de côté sans justification explicite (voir « Points non résolus »).

## Constats et corrections

### Registre OPEN initial (reconstitué avant modification)

| ID | Constat | Statut à l'ouverture |
|---|---|---|
| W-01 | Colonne minutes prend presque toute la largeur | OPEN |
| W-02 | Unité `min` hors du cadre | OPEN |
| W-03 | Colonne secondes + unité `s` hors écran | OPEN |
| W-04 | Deux cadres de sélection (bleu + gris natif) | OPEN |
| W-05 | Pas de fermeture par tap sur le cadre gris | OPEN |
| C-01 | Fond gris des cartes limites | OPEN |
| C-02 | Pictogramme de déplacement absent à gauche | OPEN |
| T-01 | Largeur de la carte Tour divergente | OPEN |
| T-02 | Logo Tour absent | OPEN |
| T-03 | Libellé `Tour` incorrect | OPEN |
| T-04 | Mauvais chevron/contrôle Tour | OPEN |
| T-05 | Contenu `×1` incorrect | OPEN |
| A-01 | Bloc synthèse + Continuer trop haut | OPEN |
| N-01 | Icônes de navigation trop grandes | OPEN |
| N-02 | Cadre des quatre icônes trop large | OPEN |
| N-03 | Cadre de navigation trop bas | OPEN |

### W — Roulette native (`src/features/sessions/DurationWheelPicker.tsx`)

- **W-01/W-02/W-03** : la largeur disponible du popover est désormais mesurée via `useWindowDimensions()` (moins le padding horizontal de la ligne hôte et celui de `nativeSurface`), **avant** de dimensionner le `Host`/`HStack` — jamais l'inverse. Chaque colonne numérique (`SwiftUIPicker`) et chaque séparateur d'unité (`SwiftUIText`, `min`/`s`) reçoit désormais un modificateur `frame({width})` explicite (`@expo/ui/swift-ui/modifiers`), dont la somme + les écarts du `HStack` égale exactement la largeur du `Host` : aucun élément ne peut plus grandir au détriment d'un autre. Preuve JS : `DurationWheelPicker.test.tsx`, describe « géométrie de la roulette », tests W-01 (largeur finie, pas de `layoutPriority`/flex), W-01/W-03 (symétrie exacte minutes/secondes), W-02/W-03 (unités bornées), et un test vérifiant que la largeur du `Host` couvre au moins la somme des quatre éléments.
- **W-04** : la bande de sélection bleue superposée (`nativeSelectionBand`) du cycle précédent est **supprimée** — seul le cadre de sélection natif SwiftUI subsiste. Preuve : test explicite `queryByTestId("duration-wheel-native-selection-band")` → `null`.
- **W-05** : nouvelle prop optionnelle `onRequestClose` sur `DurationWheelPicker`/`NativeAppleDurationWheelPicker`, câblée dans `CompositionScreen.tsx` aux deux roulettes (Compte à rebours, Fin de séance) via `toggleOverlay(kind)`. Une cible tactile invisible (`nativeCloseTapArea`, transparente — pas un second cadre visible) est positionnée sur la bande centrale (mesurée via `onLayoutContent`) ; un appui ferme le sélecteur sans toucher `draftMinutes`/`draftSeconds`. Preuve : tests W-05 (appel unique de `onRequestClose`, `onChange` jamais appelé par ce tap, absence de cible tant que `onLayoutContent` n'a pas fourni de hauteur, absence totale si `onRequestClose` est omis — `ExerciseScreen.tsx`, non câblé ce cycle, garde son comportement).

### C — Cartes limites (`CompositionScreen.tsx`, `BoundaryActivityRow`)

- **C-01** : fond passé de `colors.surface` à `colors.background` (blanc), avec un liseré gris (`borderWidth:1, borderColor:colors.border`) — géométrie portée par un nouveau style partagé `limitCardBase` (voir T-01). Preuve : test C-01.
- **C-02** : le slot gauche (`boundaryRowHandleSlot`) porte désormais le pictogramme `composition-reorder` (même icône « déplacement/structure » que `Composition / Activity Row` — réutilisation désormais explicitement demandée par cette revue, qui abroge la restriction du cycle précédent). La prop `structureIcon` (défaut `composition-reorder`) permet un remplacement ultérieur par un pictogramme « carte fixe » sans toucher au layout. Preuve : test C-02.

### T — Carte Tour (`CompositionScreen.tsx`, `TourCard`)

- **T-01** : géométrie (padding/bordure/rayon) désormais partagée avec `BoundaryActivityRow` via `limitCardBase` — seul le fond diverge. Preuve : test T-01 (padding/border/radius identiques, background différent).
- **T-02** : slot gauche toujours vide — **icône Tour canonique toujours absente**, voir « Points non résolus ». Délibérément non comblé par une réutilisation de `composition-reorder` (représenterait faussement « Tour » avec un pictogramme de déplacement).
- **T-03** : libellé changé à la source (`src/shared/i18n/resources/fr.ts`) : `"Tour"` → `"Nombre de tours"`. `src/shared/i18n/index.test.ts` mis à jour en conséquence.
- **T-04** : contrôle carré (`width === height`), fond violet (`colors.selection`), chevron recoloré en blanc via le nouveau prop `tintColor` de `KodjoIcon` (`src/shared/ui/KodjoIcon.tsx`, ajout rétrocompatible — `undefined` par défaut, aucun appel existant affecté).
- **T-05** : contenu `×1` → `1` seul (préfixe `×` retiré).
- Preuve combinée T-03/T-04/T-05 : un seul test dédié dans `CompositionScreen.test.tsx`.

### A — Zone d'action basse

- **A-01** : `body` (conteneur des lignes Compte à rebours/Exercice/Tour/Fin de séance) passe à `flex: 1`, absorbant tout l'espace vertical restant entre la bande Context et `bottomAction` ; `marginTop: "auto"` retiré de `bottomAction` (devenu redondant/moins robuste que le mécanisme `flex:1`). `Continuer` reste centré sur l'axe horizontal de l'écran (`marginHorizontal` symétrique) — le critère « centré sur l'axe du cadre de navigation principal » ne s'applique pas : Composition est un écran de création hors `(tabs)`, sans cadre de navigation basse (condition explicitement posée par la revue elle-même, « lorsqu'il est présent »). Preuve : test A-01 (`body.flex === 1`, `bottomAction.marginTop === undefined`).

### N — Navigation basse (Catalogue, `app/(tabs)/_layout.tsx`, `src/shared/ui/navigationLayout.ts`)

- **N-01** : `NAVIGATION_ICON_SLOT` réduit de `24` à `20` — cible tactile inchangée (`tabItem.minHeight` reste `minTouchTarget`, indépendant de ce slot).
- **N-02** : `NAVIGATION_ROW_GAP` élargi de `spacing[12]` à `spacing[16]` — resserre `tabsGroup` (`flex: 1`) sans toucher aux marges extérieures ni à Recherche ; non-chevauchement garanti par flexbox (propriété déjà établie, revalidée par la suite de tests existante).
- **N-03** : le résiduel bas (`NAVIGATION_BAR_BOTTOM_RESIDUAL`) est désormais **égal par construction** à la marge horizontale (`NAVIGATION_ROW_HORIZONTAL_MARGIN`), remplaçant la formule précédente (fonction de `insets.bottom`, dérivée d'un unique point de référence, jugée trop basse au rendu réel). Preuve : `navigationLayout.test.ts` (égalité structurelle) et `TabsLayoutSearch.integration.test.tsx` (assertion sur le style réel de `navigation-row`).

## Preuves et tests

```
commande : npx tsc --noEmit
résultat : PASS (aucune sortie)

commande : npx eslint .
résultat : PASS (aucune sortie)

commande : npx jest --maxWorkers=2
résultat : PASS — 37 suites, 470 tests, 0 échec
```

Détail des tests ajoutés/modifiés ce cycle :
- `DurationWheelPicker.test.tsx` : +7 tests (describe « géométrie de la roulette W-01…W-05 »).
- `CompositionScreen.test.tsx` : +4 tests (C-01, C-02, T-01, A-01) ; 2 tests existants mis à jour (T-05 : `"×1"` → `"1"` ; CMP-04 : fond/chevron du contrôle Tour).
- `TabsLayoutSearch.integration.test.tsx` : describe « position verticale » réécrit pour N-03 (égalité résiduel/marge).
- `navigationLayout.test.ts` : réécrit pour la nouvelle API (`NAVIGATION_BAR_BOTTOM_RESIDUAL`, `navigationBarTotalHeight()` sans argument).
- `CatalogueScreen.test.tsx` : assertion `paddingBottom` alignée sur `navigationBarTotalHeight()`.
- `src/shared/i18n/index.test.ts` : libellé Tour mis à jour.

## Hypothèses non démontrées

- **W-01/02/03** : les largeurs bornées calculées (division de l'espace mesuré entre deux colonnes numériques + deux unités) sont une répartition raisonnée mais non confirmée visuellement — le rendu SwiftUI réel d'un `Picker(style: .wheel)` contraint par `frame(width:)` n'est pas mesurable dans cet environnement.
- **W-05** : l'interaction entre la cible tactile RN (`Pressable`) superposée et le mécanisme de défilement natif SwiftUI sous-jacent (arbitrage de geste entre les deux moteurs de rendu) n'est pas vérifiable sans device — un tap précis sur la bande centrale devrait fonctionner (la cible ne couvre qu'une bande étroite, hors des zones de défilement actif), mais ce n'est pas garanti.
- **T-04** : la taille du contrôle carré (`36×36`) est un choix raisonné pour contenir le chevron (`24×24`, taille DS exacte) + le chiffre `1`, non confirmé contre un rendu réel.
- **N-03** : la nouvelle règle d'égalité résiduel/marge est mesurée sur la capture de référence de cette revue, mais reste `NON_VERIFIABLE_DEVICE` de ce côté (aucune capture pixel n'a été directement analysée par cet environnement — seule la description textuelle du défaut et le critère d'acceptation ont été utilisés).

## Modifications réalisées

Fichiers applicatifs modifiés :
- `app/(tabs)/_layout.tsx`
- `src/features/sessions/CatalogueScreen.tsx`
- `src/features/sessions/CompositionScreen.tsx`
- `src/features/sessions/DurationWheelPicker.tsx`
- `src/shared/i18n/resources/fr.ts`
- `src/shared/ui/KodjoIcon.tsx`
- `src/shared/ui/navigationLayout.ts`

Fichiers de test modifiés :
- `src/features/sessions/__tests__/CatalogueScreen.test.tsx`
- `src/features/sessions/__tests__/CompositionScreen.test.tsx`
- `src/features/sessions/__tests__/DurationWheelPicker.test.tsx`
- `src/shared/i18n/index.test.ts`
- `src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx`
- `src/shared/ui/__tests__/navigationLayout.test.ts`

## Éléments non corrigés ou hors périmètre

- **T-02 (icône Tour)** : toujours bloqué — voir « Points non résolus ».
- Aucun autre point du registre W/C/T/A/N n'a été laissé de côté.
- Catalogue non modifié hors N-01/N-02/N-03, conformément à la contrainte explicite de cette revue.
- Écran « Ajouter une activité » (Exercice) et tout écran suivant : non entamés. `onRequestClose` (W-05) n'a volontairement pas été câblé dans `ExerciseScreen.tsx` (hors périmètre de cette revue, qui porte sur Composition/Catalogue).

## Vérifications restant à effectuer sur appareil réel

1. Roulette ouverte (Compte à rebours et Fin de séance) : deux colonnes + deux unités entièrement visibles, aucun débordement, un seul cadre de sélection (gris natif).
2. Tap sur le cadre gris natif : ferme le sélecteur, valide la valeur centrée, ne déplace/incrémente rien.
3. Cartes Compte à rebours/Fin de séance : fond blanc, liseré gris visible, pictogramme de déplacement à gauche.
4. Carte Tour : mêmes bords gauche/droit que les cartes limites, libellé « Nombre de tours », contrôle carré violet avec chevron blanc et contenu `1` seul.
5. Zone synthèse + Continuer : positionnée au bas de l'écran, pas de chevauchement.
6. Catalogue : icônes de navigation légèrement réduites, cadre des quatre destinations légèrement resserré, marge basse visuellement égale à la marge gauche.
7. Captures requises : Composition fermée, roulette Compte à rebours ouverte, roulette Fin de séance ouverte, Catalogue avec navigation.

Les tests Jest ne constituent pas une preuve de fluidité, de centrage ou d'alignement natifs : une vérification finale sur iPhone réel reste obligatoire avant toute clôture.

## Points non résolus

**Icône Tour canonique (T-02) — toujours absente**, pour la troisième fois consécutive. Recherche exhaustive reconduite ce cycle sur `assets/icons/manifest.json` (19 entrées) : aucune entrée `tour.*` ni glyphe sémantiquement proche (répétition/cycle/boucle). Le MCP `figma` de cet environnement est **non authentifié** — aucun flux OAuth n'est exécutable en session non interactive, donc aucun accès à un asset réel n'a été possible depuis ce run. Ce point nécessite explicitement soit une autorisation `figma` MCP (action utilisateur, `claude mcp` / `/mcp`), soit un dépôt d'asset explicite côté design — il ne peut pas être résolu par un nouveau cycle de correction de code seul.

## Fichiers modifiés

Voir « Modifications réalisées » ci-dessus (liste exhaustive, 13 fichiers).

## Commit final

Code applicatif et ce rapport committés séparément (voir état Git ci-dessous et le commentaire de transition GitHub pour les hash exacts, publiés après ce commit).

## État Git

Branche `feat/creation-seance-catalogue`. Avant implémentation : HEAD local `9fcf9a289559e13df12fa57167a9c60b0de7d31b`, identique à `origin` (`git fetch` vérifié), worktree propre. Après cette mission : voir le commentaire de transition GitHub pour les hash finaux.

## Self-check Claude

- `tsc --noEmit` : PASS. `eslint .` : PASS. `jest --maxWorkers=2` : PASS, 470/470, 0 échec, 0 ignoré.
- Registre OPEN initial (16 points, W/C/T/A/N) entièrement recensé avant modification, chacun statué explicitement ci-dessus.
- Aucune commande Git destructive (`reset`, `rebase`, `force-push`) exécutée.
- Écran Exercice et tout écran suivant : non entamés.
- Un seul point reste `BLOQUÉ` (T-02, icône Tour) — escaladé explicitement, pas reconduit silencieusement.
