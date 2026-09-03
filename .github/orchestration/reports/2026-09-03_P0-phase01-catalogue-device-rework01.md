# Phase 1 — Reprise après contre-recette iPhone (CAT-R01/R02/R03, SHELL-R01)

## Identifiant et objectif

- **Identifiant** : `P0-phase01-catalogue-device-rework01`
- **Issue** : #35, autorisée par `[ChatGPT] DEVICE_REVIEW_FAIL — PHASE 1 REMAINS OPEN — CATALOGUE VIDE` (2026-09-03T09:02:37Z), suite à une capture iPhone réelle (`IMG_0146.png`) montrant un verdict **NO-GO visuel** sur la livraison précédente.
- **Objectif** : corriger exactement `CAT-R01`, `CAT-R02`, `CAT-R03` et `SHELL-R01` — aucun autre identifiant, aucun autre écran.

## Branche et commit de départ

- **Branche** : `feat/creation-seance-catalogue`
- **Baseline exigée** : `d3b9b3f2f98611894efba1023fe1af682ebfa3dc`
- **Précondition Git vérifiée avant tout code** : `git fetch` + `git rev-parse origin/feat/creation-seance-catalogue` = `d3b9b3f...`, identique ; `git status --short` vide.

## Périmètre demandé

`CAT-R01` (fond du contrôle segmenté), `CAT-R02` (fond du bouton `+ Créer`), `CAT-R03` (cadre de l'état vide), `SHELL-R01` (barre de navigation inférieure : largeur contrainte + position verticale du bouton Recherche). Interdiction explicite de toucher `CTRL-01/02`, `LAY-02..07`, Calendrier/Suivi/Composition, ou le contenu des autres onglets.

## Périmètre réellement traité

Les quatre identifiants, intégralement.

## Cause de processus (exigé par `DEVICE_REVIEW_FAIL`) — pourquoi chaque écart a échappé au cycle précédent

### CAT-R01 — Fond du contrôle segmenté

1. **Pourquoi la comparaison précédente ne l'a pas transformé en critère** : le tableau de la Phase 1 vérifiait la présence d'un fond « distinct du fond général » pour la bande Context, mais ne vérifiait **aucune propriété du contrôle segmenté lui-même** — celui-ci n'apparaît dans aucune ligne du tableau des 9 critères (le critère 5 ne portait que sur la position du groupe, pas sur sa propre couleur).
2. **Assertion/structure manquante** : `filterRow.backgroundColor` était toujours `colors.surface` (gris très pâle, hérité de l'implémentation T01-S06 originale) — jamais réexaminé, aucun test n'avait jamais vérifié cette valeur.
3. **Preuve empêchant une nouvelle fermeture erronée** : nouveau test dédié (`CatalogueScreen.test.tsx`) qui échouait avant la correction (`colors.surface` ≠ `colors.background`) et passe après — assertion directe sur `StyleSheet.flatten(filterRow.props.style).backgroundColor`.

### CAT-R02 — Fond du bouton `+ Créer`

1. **Pourquoi la comparaison précédente ne l'a pas transformé en critère** : le critère 6 du tableau précédent (« Créer `90×32`, rayon `16`, cible `≥48` ») portait uniquement sur la géométrie déjà corrigée lors de `UI-CAT-001` — jamais sur la couleur de fond, qui n'a jamais été un critère explicite nulle part dans l'historique de ce composant.
2. **Assertion/structure manquante** : `styles.createAction` ne déclarait aucun `backgroundColor` — la teinte de son parent (la bande Context, `colors.selectionSurface`) transparaissait à travers lui puisqu'aucune couche opaque ne la couvrait.
3. **Preuve empêchant une nouvelle fermeture erronée** : nouveau test vérifiant `backgroundColor === colors.background` en plus de la géométrie déjà testée (revérifiée pour prouver l'absence de régression).

### CAT-R03 — Cadre de l'état vide

1. **Pourquoi la comparaison précédente ne l'a pas transformé en critère** : le critère 7 du tableau précédent (« corps vide conforme ») a été évalué en `PASS` fonctionnel sur la seule base de la non-régression du texte affiché — sans qu'aucune structure de « cadre » n'ait jamais été recensée comme composant attendu, faute de l'avoir identifiée dans le code existant au moment de l'analyse.
2. **Assertion/structure manquante** : `EmptyBody` rendait le texte directement dans `centeredBody` (un simple conteneur de centrage, sans fond/bordure/rayon) — aucune notion de cadre n'existait dans le composant.
3. **Preuve empêchant une nouvelle fermeture erronée** : nouveau test vérifiant l'existence d'un conteneur dédié (`catalogue-empty-frame`) avec un fond distinct, une bordure et un rayon non nuls, et que le texte en est un **enfant direct** — pas un frère isolé.

### SHELL-R01 — Barre de navigation inférieure

1. **Pourquoi la comparaison précédente ne l'a pas transformé en critère** : le plan de Phase 1 et son rapport ont explicitement exclu la navigation du périmètre (« Shell inférieur et barre de navigation non modifiés dans cette phase »), en la traitant comme hors-Shell de l'écran Catalogue — une lecture trop étroite : la barre de navigation appartient visuellement au Shell affiché à l'écran, même si son fichier (`app/(tabs)/_layout.tsx`) est distinct de `CatalogueScreen.tsx`.
2. **Assertion/structure manquante** : `dimensions.mainNavigation` (hauteur `66`, rayon `33`) était défini dans les tokens depuis le début du projet mais **jamais utilisé nulle part dans le code** avant cette correction — la barre utilisait donc la largeur/le style par défaut d'`expo-router/js-tabs` (pleine largeur). Le bouton Recherche était positionné par un `bottom` indépendant (`insets.bottom + spacing[16]`), sans aucune relation avec la hauteur réelle de la barre.
3. **Preuve empêchant une nouvelle fermeture erronée** : nouveau test vérifiant que le diamètre du bouton Recherche correspond exactement au token, et que sa position verticale est calculée par une **formule** dérivée de `dimensions.mainNavigation.visualHeight` (centrage), pas par une valeur devinée — la preuve porte sur la relation mathématique entre les deux tokens, reproductible indépendamment de la valeur réelle de `insets.bottom` sur un device donné.

## Constats

- Aucun des quatre écarts ne relevait d'une ambiguïté fonctionnelle ou d'un accès Figma manquant — tous étaient déterminables par lecture directe du code existant (absence de `backgroundColor`, absence de cadre, token `mainNavigation` jamais consommé). Ceci confirme le diagnostic de `RC-03`/`RC-04` de l'audit de fiabilité : des critères jamais formulés au niveau atomique requis.
- `dimensions.mainNavigation` et `dimensions.header.contentHeight` (ce dernier déjà mobilisé en Phase 1) étaient tous deux des tokens **définis mais orphelins** avant ces deux corrections — signal que la mise en cohérence tokens ↔ code reste incomplète au-delà de ce périmètre.

## Preuves et tests

- `npx tsc --noEmit` → **PASS, 0 erreur**.
- `npx eslint .` (dépôt entier) → **PASS, 0 erreur, 0 avertissement**.
- `npx jest --maxWorkers=2` → **PASS, 35/35 suites, 411/411 tests** (407 précédents + 4 nouveaux : `CAT-R01`, `CAT-R02`, `CAT-R03`, `SHELL-R01`). Aucune régression.
- **Captures normalisées** : `NON_VERIFIABLE_DEVICE`, inchangé — cet environnement ne dispose toujours d'aucun outil de rendu visuel/simulateur.

## Hypothèses non démontrées

- `SHELL-R01` : les marges horizontales retenues pour contraindre la barre (`spacing[16]` à gauche, `spacing[16] + diamètre recherche + spacing[12]` à droite) et l'espacement de `spacing[12]` entre la barre et le bouton Recherche sont des valeurs par défaut raisonnées (cohérentes avec le reste du code), **non mesurées contre une frame Figma de la navigation** (aucun accès Figma live dans cet environnement, déjà signalé dans le plan initial).
- `CAT-R03` : `colors.surface`/`colors.border`/`dimensions.standardCard.radius` retenus comme valeurs par défaut pour le cadre — non confirmés contre la référence Figma exacte de l'état vide.
- La hauteur réelle occupée par la barre `expo-router/js-tabs` avec `tabBarStyle.height` personnalisé n'a pas été mesurée sur device — seule la valeur déclarée (`dimensions.mainNavigation.visualHeight = 66`) est appliquée ; son rendu natif réel (marges internes du composant tiers, éventuel débordement du texte des libellés à cette hauteur) reste `NON VÉRIFIABLE` sans capture.

## Modifications réalisées

**`src/features/sessions/CatalogueScreen.tsx`** :
- `filterRow.backgroundColor` : `colors.surface` → `colors.background` (CAT-R01).
- `createAction.backgroundColor` : ajouté, `colors.background` (CAT-R02) ; géométrie inchangée.
- `EmptyBody` : le texte est désormais enveloppé dans un nouveau `View` `emptyStateFrame` (fond `colors.surface`, bordure `colors.border`, rayon `dimensions.standardCard.radius`, centré horizontalement/verticalement) (CAT-R03).
- `testID="catalogue-filter-row"` ajouté sur le conteneur du sélecteur de filtres (nécessaire pour le nouveau test CAT-R01).

**`app/(tabs)/_layout.tsx`** :
- `screenOptions.tabBarStyle` ajouté : position absolue, marges gauche/droite (barre contrainte, plus pleine largeur), hauteur/rayon issus de `dimensions.mainNavigation` (jusqu'ici jamais utilisé), fond blanc, ombre légère (SHELL-R01, largeur).
- Position verticale du bouton Recherche recalculée (`searchBottom`) : centrée dans la même bande que la barre de navigation, dérivée de `dimensions.mainNavigation.visualHeight` et `dimensions.globalSearch.visualDiameter`, plus l'inset de sécurité réel appliqué une seule fois (SHELL-R01, position verticale).

**Tests** : `CatalogueScreen.test.tsx` (+3 tests, `CAT-R01/R02/R03`), `TabsLayoutSearch.integration.test.tsx` (+1 test, `SHELL-R01`).

## Tableau atomique des quatre écarts

| ID | code/structure | fonctionnel automatisé | visuel | device |
|---|---|---|---|---|
| `CAT-R01` | **PASS** — `filterRow` fond `colors.background` | **PASS** (nouveau test dédié) | NON VÉRIFIABLE | NON VÉRIFIABLE |
| `CAT-R02` | **PASS** — `createAction` fond `colors.background` ajouté, géométrie inchangée revérifiée | **PASS** (nouveau test dédié) | NON VÉRIFIABLE | NON VÉRIFIABLE |
| `CAT-R03` | **PASS** — cadre dédié (surface/bordure/rayon) introduit, texte en enfant direct | **PASS** (nouveau test dédié) | NON VÉRIFIABLE — valeurs de token par défaut, non confirmées Figma | NON VÉRIFIABLE |
| `SHELL-R01` | **PASS** — barre contrainte via `tabBarStyle` (token `mainNavigation` désormais utilisé) ; bouton Recherche recentré par formule dérivée du même token | **PASS** (nouveau test dédié, preuve mathématique de centrage) | NON VÉRIFIABLE — marges horizontales non mesurées Figma ; rendu réel du composant tiers `expo-router/js-tabs` avec `tabBarStyle` personnalisé non observé | NON VÉRIFIABLE |

## Éléments non corrigés ou hors périmètre

`CTRL-01`, `CTRL-02`, `LAY-02` à `LAY-07`, Calendrier, Suivi, Profil, Composition — non touchés, conformément à l'interdiction explicite de cette reprise.

## Vérifications restant à effectuer sur appareil réel

Toutes les cases « visuel »/« device » du tableau ci-dessus, en particulier : la barre de navigation ne déborde plus horizontalement et le bouton Recherche ne chevauche plus sa ligne supérieure ; le cadre de l'état vide correspond visuellement à la référence Figma ; les fonds blancs du segmenté et de Créer sont bien distincts de la bande Context sur un écran réel (contraste/luminosité device).

## Fichiers modifiés

- `src/features/sessions/CatalogueScreen.tsx`
- `app/(tabs)/_layout.tsx`
- `src/features/sessions/__tests__/CatalogueScreen.test.tsx`
- `src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx`
- `.github/orchestration/reports/2026-09-03_P0-phase01-catalogue-device-rework01.md` (créé — ce rapport)

## Commit final

Voir la réponse de clôture pour les hashes exacts.

## État Git

Voir la réponse de clôture pour `git status --short`, HEAD local et HEAD distant vérifié après push.

## Statut

`PHASE01_REWORK01_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`

Arrêt obligatoire ici, conformément à la condition d'arrêt de `DEVICE_REVIEW_FAIL`. Aucune phase suivante commencée.
