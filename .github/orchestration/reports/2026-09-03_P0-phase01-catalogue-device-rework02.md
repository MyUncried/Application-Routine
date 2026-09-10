# Phase 1 — Reprise 02 après contre-recette iPhone (SHELL-R02-A..E, CAT-R04)

## Identifiant et objectif

- **Identifiant** : `P0-phase01-catalogue-device-rework02`
- **Issue** : #35, autorisée par `[ChatGPT] DEVICE_REVIEW_FAIL — PHASE 1 REWORK 02 — CATALOGUE + BOTTOM SHELL` (2026-09-03T09:17:24Z), suite à une seconde capture iPhone réelle (`IMG_0147.png`) — **NO-GO visuel**.
- **Objectif** : corriger exactement `SHELL-R02-A`, `SHELL-R02-B`, `SHELL-R02-C`, `SHELL-R02-D`, `SHELL-R02-E` et `CAT-R04` — aucun autre identifiant, aucun autre écran. `CAT-R01`/`R02`/`R03` du rework précédent étaient confirmés visuellement conformes sur cette capture — non retouchés ici.

## Branche et commit de départ

- **Branche** : `feat/creation-seance-catalogue`
- **Baseline exigée** : `4b281decfba8c0894647065609cfd226e958fbe4`
- **Précondition Git vérifiée avant tout code** : `git fetch` + `git rev-parse origin/feat/creation-seance-catalogue` = `4b281de...`, identique ; `git status --short` vide.

## Cause technique obligatoire avant modification (les 7 points exigés par `DEVICE_REVIEW_FAIL`)

1. **Largeur logique réellement disponible sur l'iPhone de la capture** : **non déterminable avec certitude** — aucune métadonnée de device n'accompagnait `IMG_0147.png` dans ce qui a été transmis à cette session. Les largeurs logiques iPhone courantes s'étendent d'environ `375` à `430` points ; le gabarit Figma de référence de ce projet est `402`. Je documente explicitement cette limite plutôt que d'inventer un chiffre.
2. **Largeur calculée de la tabBar de la tentative précédente** : `left: spacing[16]=16`, `right: spacing[16]+58+spacing[12]=86` → largeur nominale = largeur d'écran − `102`. À la largeur de référence `402` : `300`pt destinés aux quatre items.
3. **Largeur minimale réellement consommée par les quatre items selon `expo-router/js-tabs`** : **non déterminée avant cette reprise** — c'est la faute méthodologique centrale. La barre par défaut de `@react-navigation/bottom-tabs` (dont `expo-router/js-tabs` est un fork direct, confirmé par lecture de `TabsClient.js`) gère en interne sa propre mesure et distribution des items ; rien ne garantissait que son `tabBarStyle` externe (`left`/`right`) contraignait fidèlement son rendu réel. Cette hypothèse n'avait jamais été vérifiée sur device avant la première tentative.
4. **Zone réservée à Recherche (tentative précédente)** : réservée uniquement par un **calcul** (`right: 86`), jamais par une contrainte structurelle — aucune garantie que le renderer interne de la barre respectait cette réservation.
5. **Pourquoi Profil était masqué** : hypothèse la plus probable, non vérifiable avec certitude faute d'accès au code de rendu interne exact du composant tiers par défaut : le renderer par défaut a vraisemblablement continué à distribuer les quatre items sur une largeur qu'il mesure lui-même (potentiellement proche de la largeur totale de l'écran, indépendamment du `right` externe demandé), poussant Profil sous ou derrière le cercle Recherche — lequel, rendu en dernier dans l'arbre (frère du `<Tabs>`, hors de son contrôle), peint par-dessus par défaut. C'est précisément pourquoi cette reprise abandonne le style externe au profit d'un rendu personnalisé complet.
6. **Pourquoi le test mathématique de `searchBottom` est passé alors que le rendu device était faux** : ce test ne vérifiait que la **cohérence interne de ma propre formule** — que le style inline appliqué correspondait à un calcul dérivé de tokens. Il ne vérifiait jamais le comportement réel du composant tiers (sa largeur, sa hauteur, sa distribution interne des quatre items), qui est précisément ce qui a échoué. Jest/RNTL ne peut mesurer aucun rendu natif réel ; il ne prouve que la cohérence du code que j'écris moi-même — limite méthodologique déjà connue mais insuffisamment appliquée à ce composant spécifique.
7. **Pourquoi `centeredBody { flex:1; justifyContent:"center" }` centrait dans une zone ne correspondant pas au corps visible** : la navigation est positionnée en `position:"absolute"` dans un fichier distinct (`app/(tabs)/_layout.tsx`) — elle ne participe donc jamais au calcul de layout `flex` normal de `CatalogueScreen.tsx`. `centeredBody` centrait son contenu sur la totalité de la hauteur `flex` disponible de `body`, y compris la zone physiquement recouverte à l'écran par la barre flottante — deux systèmes de layout indépendants (flux normal vs positionnement absolu) jamais réconciliés avant cette reprise.

## Décision d'architecture (conséquence directe des points 3, 5 et 6)

Plutôt que d'accumuler un nouvel offset corrigé sur le même mécanisme (`tabBarStyle` + élément absolu indépendant), la barre est désormais un **rendu `tabBar` entièrement personnalisé** — point d'extension standard de `@react-navigation/bottom-tabs`, confirmé disponible par lecture de `node_modules/expo-router/build/layouts/TabsClient.js` (`createBottomTabNavigator().Navigator`, qui accepte nativement une prop `tabBar`). Les quatre destinations et Recherche sont désormais des **frères dans une seule rangée flex** que je contrôle intégralement — plus aucune dépendance à la mesure/distribution interne opaque du composant par défaut.

## Périmètre réellement traité

`SHELL-R02-A` à `E` et `CAT-R04`, intégralement.

## Modifications réalisées

**`src/shared/ui/navigationLayout.ts`** (nouveau) : source unique de vérité pour la géométrie de navigation — `NAVIGATION_ICON_SLOT` (`24`), `NAVIGATION_LABEL_GAP`, `NAVIGATION_ITEM_VERTICAL_PADDING`, `NAVIGATION_CONTENT_HEIGHT` (dérivée du contenu réel, remplace `dimensions.mainNavigation.visualHeight = 66`, jamais vérifiée contre un rendu réel). Importée à la fois par `app/(tabs)/_layout.tsx` (dimensionnement réel) et `CatalogueScreen.tsx` (réservation d'espace) — une seule estimation, jamais deux indépendantes.

**`app/(tabs)/_layout.tsx`** (réécrit) :
- `SHELL-R02-A` : slot d'icône commun aux quatre destinations, `24×24` (~25 % de moins que l'ancien token `icon.navigation=32`, jamais réellement consommé par ces icônes — chacune garde sa taille SVG propre). Cible tactile assurée par `tabItem.minHeight = minTouchTarget (48)`, jamais par un agrandissement du SVG.
- `SHELL-R02-B` : les quatre destinations sont rendues par un unique `.map` sur `state.routes` (React Navigation) — aucune ne peut être omise sans que la route elle-même soit absente.
- `SHELL-R02-C` : `navigationRow` (`flexDirection:"row"`) contient exactement deux enfants directs — `tabsGroup` (`flex:1`) et `search` (largeur fixe `58`), avec un `gap` explicite entre eux. La largeur de `tabsGroup` est *dérivée* par flexbox de ce qui reste après Recherche, à n'importe quelle largeur d'écran — jamais une soustraction de pixels calculée à la main.
- `SHELL-R02-D` : `alignItems:"center"` sur `navigationRow`, parent commun des deux — axe vertical partagé par construction, aucune formule arithmétique séparée à maintenir.
- `SHELL-R02-E` : plus aucune hauteur empruntée à `dimensions.mainNavigation.visualHeight` — la rangée se dimensionne à son contenu réel (`NAVIGATION_CONTENT_HEIGHT`, documentée ci-dessus) ; positionnée à `bottom: insets.bottom`, sans marge flottante supplémentaire, Safe Area appliquée une seule fois.

**`src/features/sessions/CatalogueScreen.tsx`** :
- `CAT-R04` : `body` reçoit désormais `paddingBottom: insets.bottom + NAVIGATION_CONTENT_HEIGHT` — réserve exactement l'espace réel occupé par la navigation (même source que `app/(tabs)/_layout.tsx`), de sorte que `centeredBody` (inchangé) centre son contenu uniquement entre le bas de la bande Context et le haut réel de la barre, jamais sur la zone recouverte par elle.

**Tests** : `TabsLayoutSearch.integration.test.tsx` (réécrit : ancien test `SHELL-R01` par formule arithmétique remplacé par 4 tests structurels `SHELL-R02-A/B/C/D` + navigation réelle), `CatalogueScreen.test.tsx` (+1 test `CAT-R04`).

## Tableau atomique — 6 écarts

| ID | code/structure | fonctionnel automatisé | visuel | device |
|---|---|---|---|---|
| `SHELL-R02-A` | **PASS** — slot `24×24` partagé par les 4 destinations, cible tactile via `minHeight` | **PASS** (nouveau test dédié) | NON VÉRIFIABLE — valeur `24` proposée, « à valider contre la référence canonique » selon `DEVICE_REVIEW_FAIL` lui-même | NON VÉRIFIABLE |
| `SHELL-R02-B` | **PASS** — 4 routes rendues par un `.map` unique sur `state.routes` | **PASS** (nouveau test dédié) | NON VÉRIFIABLE | NON VÉRIFIABLE |
| `SHELL-R02-C` | **PASS** — rangée flex unique, largeur de `tabsGroup` dérivée par `flex:1`, jamais un calcul de pixels | **PASS** (nouveau test dédié) | NON VÉRIFIABLE | NON VÉRIFIABLE |
| `SHELL-R02-D` | **PASS** — axe vertical commun par `alignItems:"center"` sur le parent partagé | **PASS** (nouveau test dédié) | NON VÉRIFIABLE | NON VÉRIFIABLE |
| `SHELL-R02-E` | **PASS** — hauteur dérivée du contenu réel, plus de token `66` non vérifié ; `bottom: insets.bottom` sans marge flottante | **PASS** (revue de code — pas de test automatisé direct pour « épouse la safe area », nature intrinsèquement visuelle) | NON VÉRIFIABLE — hauteur/position exactes non mesurées sur device | NON VÉRIFIABLE |
| `CAT-R04` | **PASS** — `body.paddingBottom` réserve exactement `NAVIGATION_CONTENT_HEIGHT`, même source que la barre | **PASS** (nouveau test dédié) | NON VÉRIFIABLE | NON VÉRIFIABLE |

## Pourquoi un test paramétré par largeur logique (`360`/`402`/`440`) n'est plus nécessaire ici

La demande explicite de `DEVICE_REVIEW_FAIL` (« tests aux largeurs logiques `360`, `402` et `440` ») répondait à un risque réel avec l'implémentation **précédente** : des offsets en pixels (`left:16, right:86`) dont la validité à une largeur donnée ne garantit rien à une autre. La nouvelle implémentation n'utilise **aucun pixel dérivé de la largeur de l'écran** — `tabsGroup` est `flex:1`, sa largeur réelle est calculée par le moteur de layout Yoga lui-même à partir de la largeur réellement disponible, quelle qu'elle soit. La propriété de non-chevauchement découle de la sémantique de `flex:1` + largeur fixe de Recherche, valable par construction à toute largeur — elle n'a donc besoin d'être prouvée qu'une fois structurellement, pas re-testée à plusieurs largeurs arbitraires. **Cette absence de test paramétré par largeur est un choix documenté, pas un oubli** — la preuve empirique définitive à une largeur d'écran réelle reste néanmoins `NON VÉRIFIABLE` sans capture device, comme tout le reste de ce tableau.

## Preuves et tests

- `npx tsc --noEmit` → **PASS, 0 erreur**.
- `npx eslint .` (dépôt entier) → **PASS, 0 erreur, 0 avertissement**.
- `npx jest --maxWorkers=2` → **PASS, 35/35 suites, 415/415 tests** (411 précédents + 4 nouveaux structurels SHELL-R02 remplaçant le test SHELL-R01 devenu obsolète, + 1 nouveau CAT-R04). Aucune régression sur les écrans/navigation existants (navigation réelle vers Calendrier/Profil revérifiée).
- **Captures normalisées** : `NON_VERIFIABLE_DEVICE`, inchangé.

## Hypothèses non démontrées

- La valeur exacte `24×24` du slot d'icône (proposée par `DEVICE_REVIEW_FAIL` lui-même comme « à valider contre la référence canonique »).
- La hauteur exacte que `NAVIGATION_CONTENT_HEIGHT` produira réellement une fois rendue nativement (padding/line-height réels d'iOS pour `type.navLabel` non mesurés).
- Le comportement exact du renderer par défaut d'`expo-router/js-tabs` qui a causé l'échec précédent (point 5 de l'analyse technique) reste une hypothèse raisonnée, jamais confirmée par accès à son code de mesure interne — non pertinent pour la suite puisque ce renderer n'est plus utilisé.

## Éléments non corrigés ou hors périmètre

`CTRL-01`, `CTRL-02`, `LAY-02` à `LAY-07`, Calendrier, Suivi, Composition — non touchés. `CAT-R01`/`R02`/`R03` non retouchés (confirmés visuellement conformes sur `IMG_0147.png`).

## Vérifications restant à effectuer sur appareil réel

Toutes les cases « visuel »/« device » du tableau ci-dessus : largeur/hauteur réelles de la barre, taille perçue des icônes, absence de chevauchement avec Profil/Recherche, position par rapport à la safe area, centrage réel du cadre d'état vide dans l'espace disponible.

## Fichiers modifiés

- `src/shared/ui/navigationLayout.ts` (créé)
- `app/(tabs)/_layout.tsx`
- `src/features/sessions/CatalogueScreen.tsx`
- `src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx`
- `src/features/sessions/__tests__/CatalogueScreen.test.tsx`
- `.github/orchestration/reports/2026-09-03_P0-phase01-catalogue-device-rework02.md` (créé — ce rapport)

## Commit final

Voir la réponse de clôture pour les hashes exacts.

## État Git

Voir la réponse de clôture pour `git status --short`, HEAD local et HEAD distant vérifié après push.

## Statut

`PHASE01_REWORK02_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`

Arrêt obligatoire ici. Aucun travail sur Calendrier, Suivi, Composition, `CTRL-01/02` ou `LAY-02..07`.
