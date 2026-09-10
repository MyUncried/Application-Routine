# PLAN — P0 Contrôles tactiles et conformité layout ciblée (LAY-01 à LAY-07)

## Fiche de mission

- **ID** : `P0-LAYOUT-CONTROLS-20260903`
- **Issue** : #35 — « [P0] Contrôles tactiles et conformité layout ciblée LAY-01 à LAY-07 »
- **Dépôt** : `MyUncried/Application-Routine`
- **Branche** : `feat/creation-seance-catalogue`
- **Baseline distante vérifiée** : `bec17056dd4c6f99e96fe56d81d68c180878834a`
- **Mode** : `LOCAL`, écrivain `CLAUDE_CODE_LOCAL`
- **Phase** : lecture seule + rapport de plan uniquement — **aucun fichier applicatif n'a été modifié pour produire ce plan**

## PRÉCONDITION GIT (exécutée avant toute analyse)

1. `git fetch origin feat/creation-seance-catalogue` → `origin/feat/creation-seance-catalogue` = `bec17056dd4c6f99e96fe56d81d68c180878834a`.
2. Comparaison à la baseline exigée par l'Issue #35 : **identique**.
3. `git status --short` au moment de l'analyse : **vide** (arbre propre).
4. Conclusion : précondition satisfaite — analyse et publication du plan autorisées ; aucune barrière `WORKTREE_LOCKED`.

## TÂCHE

`P0-LAYOUT-CONTROLS-20260903` — corriger la cause P0 démontrée de la non-sélection tactile des roulettes (`CTRL-01`), ses causes secondaires d'empilement/geste (`CTRL-02`), et les sept écarts visuels atomiques `LAY-01` à `LAY-07` identifiés par l'audit `2026-09-03_P0-audit-fiabilite-corrections-layout.md`. Aucune autre correction, aucun autre écran.

## COMPRÉHENSION

Le défaut CTRL-01 est démontré par lecture directe du code (`2026-09-03_P0-diagnostic-controles-interactifs.md`, point 1) : les items de roulette (`DurationWheelPicker.tsx`, `NumberWheelPicker.tsx`) sont des `View`/`Text` sans `onPress` — seul le geste de glissement peut changer la valeur. Les écarts `LAY-01` à `LAY-07` sont démontrés par l'audit de fiabilité, qui établit qu'ils étaient tous identifiables à partir des sources disponibles (Figma, doc12 §12.26, contrats d'écran CE-T01-xx) mais n'ont jamais été traduits en critères vérifiables — corrigés par symptôme partiel plutôt que par recomposition selon le Screen Shell et les composants DS documentés en doc12 §12.26 (`Shell / Screen`, `Header / Fixed`, `Composition / Boundary Activity`, `Composition / Tour Section`, `Controls / Segmented`).

Conformément à `G-03`, chaque correction ci-dessous cite des critères atomiques (dimensions, tokens, composants), pas une reformulation qualitative de « aligner l'écran ».

## PÉRIMÈTRE / FICHIERS IMPACTÉS

`src/features/sessions/DurationWheelPicker.tsx`, `src/features/sessions/NumberWheelPicker.tsx`, `src/features/sessions/CompositionScreen.tsx`, `src/features/sessions/ExerciseScreen.tsx`, `src/features/sessions/CatalogueScreen.tsx`, leurs fichiers de test associés, et potentiellement `assets/icons/manifest.json`/un nouvel asset SVG pour `LAY-04` (voir AMBIGUÏTÉS — statut à trancher avant implémentation, pas un blocage du plan lui-même).

Hors périmètre, explicitement : T01-S09, persistance finale, catégories — aucun fichier de `src/domain/`, `src/infrastructure/` ou `app/(tabs)`.

## PLAN D'IMPLÉMENTATION — tableau par identifiant

### CTRL-01 — Sélection tactile des roulettes

| Champ | Contenu |
|---|---|
| Source Figma/contrat/token | `2026-09-03_P0-diagnostic-controles-interactifs.md`, point 1 (cause démontrée par lecture directe du code, pas une exigence Figma) |
| État actuel constaté | `WheelColumn`/`values.map` (`DurationWheelPicker.tsx`) et `VALUES.map` (`NumberWheelPicker.tsx`) rendent chaque valeur en `<View><Text>` sans `onPress` |
| Cause racine | Absence totale de gestionnaire de toucher sur l'item — seul `onScroll` peut changer la valeur |
| Composant/primitive retenu | `Pressable` natif (déjà utilisé partout ailleurs dans ce code) enveloppant chaque item, `onPress` appelant la même logique que `handleScroll`/`handleColumnScroll` (calcul d'index depuis la valeur tapée → comparaison à `ref.current` → haptique conditionnelle → `onChange` → `scrollTo` de recentrage). **Écarté** : `@react-native-picker/picker` — nouvelle dépendance non installée, réécriture large qui perdrait `WheelSelectionOverlay`/le double-colonne minutes-secondes déjà validés, alors que les critères d'acceptation de CTRL-01 décrivent explicitement le comportement de l'architecture actuelle (scroll + tap, un haptique, sync index/brouillon/libellé) — corriger l'existant est la voie la moins risquée et suffisante |
| Fichiers prévus | `DurationWheelPicker.tsx`, `NumberWheelPicker.tsx`, leurs tests |
| Résultat mesurable | Taper une valeur visible ≠ valeur courante déclenche exactement un `onChange` + un haptique + un recentrage visuel ; taper la valeur déjà centrée ne déclenche ni haptique ni `onChange` ; le geste de glissement reste inchangé |
| Test automatisé prévu | `fireEvent.press` sur un item de roulette (nouveau — aucun test existant ne presse un item), assertion sur `onChange`, sur le nombre d'appels haptique, sur la persistance après fermeture/réouverture ; conserver les tests `fireEvent.scroll` existants inchangés |
| Preuve visuelle prévue | Non applicable directement (comportement tactile, pas une divergence visuelle) |
| Risques de régression | Conflit de geste avec le `ScrollView` (double déclenchement scroll+tap sur un item traversé pendant un glissement) — à couvrir par un test dédié ; effet sur `CompositionExerciseFlow.integration.test.tsx` (persistance de valeur) à revérifier |
| Statut initial | `OPEN` |

### CTRL-02 — Arbitrage des gestes et empilement

| Champ | Contenu |
|---|---|
| Source | `2026-09-03_P0-diagnostic-controles-interactifs.md`, points 2/3/4 |
| État actuel constaté | (a) `<Pressable onPress={closeOverlay} accessible={false}>` englobe l'écran entier dans `CompositionScreen.tsx`/`ExerciseScreen.tsx` ; (b) `styles.elevated = { zIndex: 1 }` sans `position: "relative"` explicite ; (c) `wheelArea`/`column` sans `width` fixe |
| Cause racine | Trois causes secondaires indépendantes, toutes des hypothèses au niveau de confiance moyen/faible dans le diagnostic — à revalider une fois CTRL-01 corrigé, avant de les considérer nécessaires |
| Composant/primitive retenu | (a) remplacer le `Pressable` racine interactif par un calque de fermeture dédié (`Pressable`, même primitive standard), rendu **uniquement** quand un sélecteur est ouvert (`openOverlay !== null`), positionné en dernier enfant (au-dessus du contenu, sous le popover lui-même) ; (b) ajouter `position: "relative"` au style `elevated` ; (c) fixer une largeur explicite (`64`–`72`) sur `wheelArea`/`column`. Aucune nouvelle dépendance, aucune primitive de bas niveau |
| Fichiers prévus | `CompositionScreen.tsx`, `ExerciseScreen.tsx`, `DurationWheelPicker.tsx`, `NumberWheelPicker.tsx` |
| Résultat mesurable | Le geste de fermeture « toucher en dehors » reste fonctionnel uniquement quand un sélecteur est ouvert ; les lignes/champs ordinaires (nom, segments, etc.) ne sont plus des enfants d'un `Pressable` interactif plein écran ; `elevated` porte `position` et `zIndex` explicites ; colonnes de roulette à largeur fixe |
| Test automatisé prévu | Test structurel : le conteneur racine n'est plus un `Pressable` avec `onPress` lorsque `openOverlay === null` (ou : le calque de fermeture n'existe que si un sélecteur est ouvert) ; test de style (`position`/`zIndex` sur `elevated`) ; test de largeur fixe sur les colonnes |
| Preuve visuelle prévue | Capture avant/après uniquement si le calque de fermeture modifie visuellement quoi que ce soit (attendu : non, changement invisible) |
| Risques de régression | Casser le « toucher en dehors ferme le sélecteur » déjà testé (`CompositionScreen.test.tsx`, `ExerciseScreen.test.tsx`, exclusivité des sélecteurs) ; casser `onFocus={closeOverlay}` du champ Nom |
| Statut initial | `OPEN` — dépend du résultat de CTRL-01 (revalider si (a)/(b)/(c) restent nécessaires une fois le tap-to-select en place, conformément à l'instruction « ne corriger que ce qui est nécessaire et démontrable ») |

### LAY-01 — Catalogue vide : Shell Header/Context absent

| Champ | Contenu |
|---|---|
| Source | Frame `2117:86`, doc12 §12.26 `Shell / Screen` (`Context=On, Bottom=Navigation` : Header `0–92`, Context `92–207`, Body `207–797`, Navigation `797–874`) |
| État actuel constaté | `CatalogueScreen.tsx` : titre, `FilterSelector`, `CreateAction` rendus en flux direct dans `styles.container` (fond `colors.background` uniforme) — aucun séparateur, aucune bande Context distincte |
| Cause racine | Écran jamais recomposé selon le Shell — validé « conforme » lors de l'audit du 02/09 sans comparaison visuelle (RC-01) |
| Composant/primitive retenu | Zone Header dédiée (titre) ; séparateur horizontal 1px (`colors.divider`, déjà utilisé ailleurs) ; bande Context (`View` fond pâle contenant `FilterSelector` + `CreateAction`) — hauteur proportionnelle au gabarit `92–207` (115pt de référence), adaptée aux insets réels comme le reste de l'écran |
| Fichiers prévus | `CatalogueScreen.tsx` |
| Résultat mesurable | Titre isolé dans une zone Header distincte ; séparateur visible immédiatement sous ; bande à fond pâle distinct du fond général contenant filtres + Créer ; corps (`body`) inchangé en dessous |
| Test automatisé prévu | Présence d'un séparateur (`testID`) ; `StyleSheet.flatten` du conteneur de bande Context ≠ `colors.background` (fond distinct) |
| Preuve visuelle prévue | Capture `402×874`, Catalogue vide, comparée à `catalogue-vide.png` |
| Risques de régression | Les tests existants localisent des éléments par `getByLabelText`/`getByText` (pas par position) — faible risque direct ; vérifier que `CreateAction` (déjà à géométrie exacte `90×32`, `UI-CAT-001`) reste inchangée dans son nouveau conteneur |
| Statut initial | `OPEN` |

### LAY-02 — Composition : titre d'écran et Shell Header/Context absents

| Champ | Contenu |
|---|---|
| Source | Frame `2028:11137`, doc12 §12.26 `Shell / Screen` |
| État actuel constaté | `topBar` (bouton Retour seul) + `header` (nom + couleur) directement en flux ; aucun titre fixe « Composition d'une séance » ; le nom saisi ne remplace rien visuellement mais aucun titre d'écran n'existe non plus ; pas de séparateur ; pas de bande Context distincte |
| Cause racine | Corrigé par audit du 02/09 uniquement pour le Retour (AUD-03) — le titre et la structure Shell n'ont jamais été recensés (RC-03, correction par symptôme partiel) |
| Composant/primitive retenu | `Header / Fixed` avec titre statique `composition.title` (déjà dans `fr.ts`) toujours affiché, indépendamment de `draft.name` ; séparateur horizontal ; bande Context regroupant nom + couleur + (position du bouton Ajouter, voir LAY-03) sur fond pâle |
| Fichiers prévus | `CompositionScreen.tsx` |
| Résultat mesurable | Le Header affiche exactement `composition.title`, jamais `draft.name`, quel que soit son contenu ; séparateur visible ; bande Context à fond distinct |
| Test automatisé prévu | Test que le Header contient `composition.title` même après une saisie de nom non vide (`fireEvent.changeText` puis assertion que le titre reste inchangé) |
| Preuve visuelle prévue | Capture Composition état initial vs `composition-etat-initial.png` |
| Risques de régression | Tests déjà existants sur le champ Nom et son `accessibilityLabel` — ne pas les casser en déplaçant le champ dans la nouvelle bande Context |
| Statut initial | `OPEN` |

### LAY-03 — Bouton `+ Ajouter une activité` : boîte visuelle trop haute

| Champ | Contenu |
|---|---|
| Source | Frame + `dimensions.compactSecondaryButton` (déjà appliqué au bouton Créer du Catalogue, `UI-CAT-001`, cycle précédent) |
| État actuel constaté | `styles.addActivityAction` : hauteur dictée par `paddingVertical: spacing[8]` × 2 + icône 24pt + texte — aucune hauteur explicite, résultat visuellement plus haut que la référence |
| Cause racine | Validation de présence de l'asset `action-add` confondue avec validation du composant rendu (audit LAY-03) |
| Composant/primitive retenu | Réutiliser exactement `dimensions.compactSecondaryButton` (`visualHeight: 32`, `radius: 16`, `minTouchTarget: 48`) — même token déjà appliqué avec succès à `CreateAction` du Catalogue, cohérence immédiate, aucune nouvelle primitive |
| Fichiers prévus | `CompositionScreen.tsx` (`styles.addActivityAction`) |
| Résultat mesurable | `height: 32` explicite, `borderRadius: 16`, `hitSlop` calculé pour porter la cible tactile réelle à `≥48×48` sans agrandir la boîte visuelle |
| Test automatisé prévu | `StyleSheet.flatten` : `height===32`, `borderRadius===16` ; `hitSlop` + hauteur ≥ 48 |
| Preuve visuelle prévue | Capture bouton Ajouter avant/après |
| Risques de régression | Texte/icône pouvant sembler compressés à 32pt de hauteur — vérifier l'alignement optique (centrage vertical `alignItems:"center"`, déjà en place) |
| Statut initial | `OPEN` |

### LAY-04 — Carte Tour non conforme

| Champ | Contenu |
|---|---|
| Source | doc12 §12.26 `Composition / Tour Section — Source exact` |
| État actuel constaté | `styles.tourRow` : `View` générique, fond `colors.surfaceSubtle`, `opacity: 0.6`, aucune icône, libellé + `×1` seulement — déjà correctement positionnée entre Compte à rebours/Activité et Fin de séance depuis le cycle de correction précédent (`UI-COMP-002/003`) |
| Cause racine | Composant DS `Tour Section` jamais implémenté visuellement — seules la position et la donnée (`×1`) ont été traitées (audit LAY-04) |
| Composant/primitive retenu | Fond token dédié « lavande/bleu » ; icône Tour à gauche ; libellé + contrôle `×1` aux emplacements de la frame — **voir AMBIGUÏTÉS : aucune icône « Tour » n'existe dans `assets/icons/manifest.json` actuel (19 assets déclarés, aucun `tour.*`)** |
| Fichiers prévus | `CompositionScreen.tsx` ; potentiellement `assets/icons/manifest.json` + nouvel asset SVG (bloquant partiel, voir AMBIGUÏTÉS) |
| Résultat mesurable | Fond distinct conforme au token retenu ; icône Tour visible à gauche (si l'asset est fourni) ; dimensions/rayon conformes au token `standardCard` ou dédié |
| Test automatisé prévu | Présence de l'icône Tour (`testID`) si l'asset existe ; `StyleSheet.flatten` du fond |
| Preuve visuelle prévue | Capture carte Tour avant/après |
| Risques de régression | Aucun si limité au style ; risque de fabriquer un glyphe non canonique si l'absence d'asset n'est pas traitée comme un blocage explicite (interdit par les règles du manifeste) |
| Statut initial | `OPEN` — **partiellement bloqué en l'absence de l'asset icône Tour**, voir AMBIGUÏTÉS |

### LAY-05 — Cartes Compte à rebours / Fin de séance : icônes mal positionnées

| Champ | Contenu |
|---|---|
| Source | doc12 §12.26 `Composition / Boundary Activity — Source exact` (`Type=Initial countdown/End session`) |
| État actuel constaté | `DurationRow` : icône + libellé regroupés à **gauche** (`durationRowLeading`), valeur + chevron à **droite** (`durationRowTrailing`) — l'audit LAY-05 attend l'icône de rôle à **droite**, poignée/structure à gauche, titre/sous-libellé au centre |
| Cause racine | Ligne conçue comme ligne générique (icône+libellé/valeur+chevron), pas comme le composant `Boundary Activity` dédié (audit LAY-05, RC-03) |
| Composant/primitive retenu | Restructurer `DurationRow` en trois zones : gauche (poignée/structure), centre (titre + sous-libellé), droite (icône de rôle countdown/end-session + chevron, sans que le chevron ne déplace l'icône de rôle) |
| Fichiers prévus | `CompositionScreen.tsx` (`DurationRow` + styles) |
| Résultat mesurable | Icône de rôle positionnée à droite ; chevron distinct de l'icône de rôle ; libellé au centre |
| Test automatisé prévu | Ordre de rendu des enfants (`testID` icône vs libellé vs chevron) vérifié par parcours d'arbre, même patron que les tests d'ordre déjà écrits pour `UI-COMP-002/003` |
| Preuve visuelle prévue | Capture avant/après |
| Risques de régression | Zone tactile de la ligne (`onPress` sur toute la largeur) à préserver ; tests d'accessibilité/labels existants à revérifier |
| Statut initial | `OPEN` — **ambiguïté sur la présence exacte d'une poignée à gauche** (« si prévue », formulation conditionnelle de l'audit lui-même) — non tranchable sans accès Figma direct, voir AMBIGUÏTÉS |

### LAY-06 — Rangée Durée/Pause/Séries non compacte

| Champ | Contenu |
|---|---|
| Source | CE-T01-13 (explicite : rangée conservée, réorganisation uniquement en largeur compacte), référence `402×874` |
| État actuel constaté | Trois `AnchoredRow` empilées verticalement dans `ExerciseScreen.tsx`, chacune pleine largeur avec son propre fond `colors.surface` — déjà signalé comme écart résiduel explicite dans `T01_S01_S08_CONFORMITY_AUDIT_20260902.md` (non traité, risque de régression jugé trop élevé pour ce cycle-là) |
| Cause racine | Contrat textuel explicite jamais traduit en assertion de layout (audit LAY-06, RC-03/RC-04) |
| Composant/primitive retenu | Nouveau conteneur de groupe (fond pâle) avec `flexDirection: "row"`, trois cellules internes bordées blanches, chacune conservant son `Row`/picker actuel |
| Fichiers prévus | `ExerciseScreen.tsx` |
| Résultat mesurable | À largeur `402`, les trois paramètres sont côte à côte dans un même cadre visuel |
| Test automatisé prévu | Test structurel : les trois `Row` sont des enfants directs d'un même conteneur `flexDirection:"row"` |
| Preuve visuelle prévue | Capture écran Exercice avant/après |
| Risques de régression | **Le plus élevé de ce plan** — dépendance croisée directe avec `CTRL-02` : chaque `AnchoredRow`/`PopoverAnchor` actuel suppose une ligne pleine largeur (`popoverAnchor: {left:0, right:0}`) ; en rangée à trois colonnes, le popover ouvert doit soit s'étendre en pleine largeur sous les trois colonnes (changement de la structure d'ancrage), soit se limiter à la largeur de sa seule colonne (changement visuel du picker lui-même) — **à trancher avant l'implémentation de LAY-06**, voir AMBIGUÏTÉS |
| Statut initial | `OPEN` — dépendance bloquante avec le point d'ancrage ci-dessus |

### LAY-07 — Couleur du segment sélectionné incorrecte

| Champ | Contenu |
|---|---|
| Source | Figma + tokens `Controls / Segmented` (doc12 §12.26) |
| État actuel constaté | `styles.segmentSelected: { backgroundColor: colors.background }` (blanc), `segmentLabelSelected: { color: colors.textPrimary }` (texte sombre) — inversé par rapport à l'attendu (fond plein bleu/violet, texte blanc) |
| Cause racine | Présence/action du composant validée sans vérification de ses variantes visuelles (audit LAY-07, RC-04) |
| Composant/primitive retenu | `segmentSelected.backgroundColor = colors.primary` ; `segmentLabelSelected.color = colors.background` (blanc) — **ambiguïté mineure `colors.primary` vs `colors.selection`, voir AMBIGUÏTÉS**, `colors.primary` retenu par défaut (cohérent avec les autres usages « action principale » de ce token dans le code actuel) |
| Fichiers prévus | `ExerciseScreen.tsx` (`SegmentButton`/styles, déjà commun aux deux contrôles segmentés Type et Mode d'exécution — aucune duplication à corriger) |
| Résultat mesurable | Segment sélectionné : fond plein `colors.primary`, texte blanc ; segment non sélectionné/désactivé inchangés |
| Test automatisé prévu | `StyleSheet.flatten` du segment sélectionné |
| Preuve visuelle prévue | Capture segments avant/après |
| Risques de régression | Contraste texte blanc/fond à vérifier visuellement (faible risque, token déjà utilisé ailleurs pour du texte sur fond `primary`) |
| Statut initial | `OPEN` |

## MIGRATION / DONNÉES

Aucune — corrections strictement visuelles/tactiles, aucun schéma SQLite ni contrat de persistance concerné.

## TESTS PRÉVUS

Pour chaque ID : au minimum un test structurel/de style automatisé (Jest + RNTL), conformément à la colonne « test automatisé prévu » ci-dessus. Rappel explicite du contrat d'audit (`G-02`) : un test Jest vert ne produit qu'un `PASS fonctionnel/structurel`, jamais un `PASS visuel` ni un `PASS device` — ces deux dernières dimensions restent `NON VÉRIFIABLE` jusqu'à capture normalisée et confirmation iPhone. `npx tsc --noEmit`, `npx eslint .` et la suite Jest complète seront exécutés avant toute déclaration de statut, sans jamais être présentés comme preuve visuelle ou tactile réelle.

## RISQUES / EFFETS DE BORD

- **LAY-06 / CTRL-02** : dépendance croisée directe (structure d'ancrage des popovers vs rangée à trois colonnes) — le plus grand risque de régression de ce plan, à traiter en premier lieu de l'implémentation pour ne pas découvrir le conflit après coup.
- **CTRL-01** : conflit potentiel de geste (tap vs scroll) sur un item traversé pendant un glissement.
- **LAY-01/LAY-02** : déplacement de `FilterSelector`/`CreateAction` (Catalogue) et de `TextInput`/`ColorPalette` (Composition) dans de nouveaux conteneurs Context — risque de casser des tests existants qui présument leur parent direct actuel (à vérifier au cas par cas, faible risque puisque les requêtes RNTL utilisées sont majoritairement par label/texte, pas par structure).
- **LAY-04** : asset manquant (icône Tour) — risque de blocage partiel, pas de régression.

## AMBIGUÏTÉS

1. **LAY-04 — icône Tour absente du manifeste** (`assets/icons/manifest.json`, 19 assets déclarés, aucun `tour.*`) : ressource non disponible localement, ne peut être fabriquée sans inventer un glyphe (interdit par les règles du manifeste et par doc12 §Icônes). **Ambiguïté technique non déterminable localement** — nécessite soit un export Figma dédié (accès MCP Figma indisponible dans cet environnement, authentification requise non fournie), soit une décision explicite d'accepter la carte Tour sans icône dans ce cycle (écart résidu documenté), soit un canal de génération d'asset externe. Ne bloque que la sous-partie « icône » de LAY-04 — le fond/dimensions/position du contrôle `×1` restent traitables sans cette ressource.
2. **LAY-04/LAY-05 — valeurs exactes de couleur et présence d'une poignée gauche** : l'audit décrit qualitativement (« lavande/bleu », « poignée si prévue ») sans valeur hexadécimale ni confirmation binaire vérifiable depuis le code seul. Accès Figma live non disponible dans cet environnement (MCP `figma` non authentifié). Valeurs par défaut proposées : `colors.selectionSurface` (`#E5F0FF`, déjà utilisé comme fond pâle ailleurs dans ce code) pour LAY-04 à défaut d'un token dédié plus précis ; poignée gauche de LAY-05 proposée absente par défaut (aucune évidence dans le code actuel qu'une poignée est nécessaire hors du composant `Composition / Activity Row`, qui, lui, en porte une conforme depuis le cycle précédent) — **à confirmer explicitement avant implémentation**, sinon la valeur par défaut ci-dessus est appliquée telle quelle.
3. **LAY-06 — structure du popover en rangée à trois colonnes** : ambiguïté technique déterminable, mais nécessitant un choix explicite avant implémentation entre (a) popover pleine largeur sous les trois colonnes ou (b) popover limité à la largeur de sa colonne. Recommandation : (a), pour rester cohérent avec la largeur déjà réduite du `NumberWheelPicker`/`DurationWheelPicker` (colonnes internes déjà étroites) et pour ne pas réduire davantage la zone de sélection tactile déjà corrigée par CTRL-01.
4. **LAY-07 — `colors.primary` vs `colors.selection`** : ambiguïté mineure, tranchée par défaut vers `colors.primary` (voir tableau LAY-07) — à confirmer ou corriger explicitement lors de la revue.

Aucune de ces ambiguïtés n'est fonctionnelle/produit : toutes portent sur des valeurs de token/asset non vérifiables sans accès Figma direct depuis cet environnement. Conformément au protocole, elles sont proposées avec une valeur par défaut raisonnée plutôt que de bloquer l'ensemble du plan en `CLARIFICATION_REQUIRED` — la revue peut les confirmer, les corriger ponctuellement, ou lever un `CLARIFICATION_REQUIRED` ciblé sur celles jugées insuffisamment déterminées avant `PLAN_APPROVED`.

## STATUT

`PLAN_READY_FOR_REVIEW`

Aucune correction applicative ne sera entreprise avant un commentaire distinct `[ChatGPT] PLAN_APPROVED`, conformément à l'Issue #35.
