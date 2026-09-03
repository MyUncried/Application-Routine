# Phase 1 — LAY-01 Catalogue vide (P0-LAYOUT-CONTROLS-20260903)

## Identifiant et objectif

- **Identifiant** : `P0-phase01-catalogue-vide`
- **Issue** : #35, autorisée par `[ChatGPT] PLAN_APPROVED — PHASE 1 ONLY — CATALOGUE VIDE` (2026-09-03T08:47:12Z)
- **Objectif** : recomposer l'écran Catalogue (état vide) selon `Shell / Screen — Context=On, Bottom=Navigation` (doc12 §12.26, frame Figma `2117:86`) : Header fixe + séparateur + bande Context (filtres + Créer) + corps. Aucun autre écran, aucun autre identifiant (`CTRL-01`, `CTRL-02`, `LAY-02..07` explicitement différés et interdits dans cette phase).

## Branche et commit de départ

- **Branche** : `feat/creation-seance-catalogue`
- **Baseline exigée par `PLAN_APPROVED`** : `b85dccbfad5d9c5aaf7513d11df713187e698ba1`
- **Précondition Git vérifiée avant tout code** : `git fetch` + `git rev-parse origin/feat/creation-seance-catalogue` = `b85dccb...`, identique à la baseline ; `git status --short` vide au moment de commencer.

## Périmètre demandé

Les 9 critères numérotés du commentaire `PLAN_APPROVED` (Header 0–92 sans double inset ; titre dans son slot ; séparateur ; bande Context bleu très pâle ; segmenté + Créer aux positions contractuelles ; Créer `90×32`/rayon `16`/cible `48` ; corps vide conforme ; Shell inférieur non modifié ; aucun offset magique), plus les interactions obligatoires (appui sur chaque segment, appui sur Créer, cible tactile distincte, aucune validation par callback interne).

## Périmètre réellement traité

Les 9 critères traités et documentés individuellement ci-dessous. Les interactions obligatoires : appui sur `Créer` (déjà testé, navigation réelle confirmée) et sur les segments (`Toutes` sélectionné, `Planifiées`/`Archivées` désactivés — comportement déjà existant, intentionnel et documenté, aucune nouvelle capacité fonctionnelle ajoutée ni requise par cette phase) restent couverts par les tests déjà en place plus le nouveau test structurel de cette phase.

## Constats

- **État antérieur** : `CatalogueScreen.tsx` rendait titre, sélecteur de filtres et bouton Créer en flux direct dans un unique conteneur à fond uniforme (`colors.background`) — aucune séparation Header/Context, exactement le défaut `LAY-01` décrit par l'audit de fiabilité.
- **Tokens réutilisés, aucun n'a été inventé** : `dimensions.header.contentHeight` (déjà défini, jamais utilisé jusqu'ici — désormais utilisé pour la hauteur du Header) ; `colors.divider` (séparateur, déjà utilisé ailleurs) ; `colors.selectionSurface` (bande Context, réutilisation de l'unique token « bleu très pâle » déjà présent dans ce code — **valeur par défaut proposée dans le plan, non confirmée contre la teinte exacte de la frame Figma, faute d'accès Figma live dans cet environnement**).
- **`+ Créer` (critère 6)** : déjà conforme depuis le cycle de correction précédent (`UI-CAT-001`) — non retouché, seulement déplacé dans la nouvelle bande Context, avec son test dédié revérifié vert.

## Preuves et tests

- `npx tsc --noEmit` → **PASS, 0 erreur**.
- `npx eslint .` (dépôt entier) → **PASS, 0 erreur, 0 avertissement**.
- `npx jest --maxWorkers=2` → **PASS, 35/35 suites, 407/407 tests** (406 précédents + 1 nouveau test structurel LAY-01). Aucune régression sur les tests Catalogue existants (12/12 verts, dont les 11 déjà présents avant cette phase).
- Nouveau test dédié (`CatalogueScreen.test.tsx`) : Header contient le titre ; séparateur présent avec un fond distinct du fond général ; bande Context à fond distinct contenant à la fois le sélecteur de filtres ET Créer ; le titre n'est jamais dupliqué dans la bande Context.
- **Captures normalisées** : `NON_VERIFIABLE_DEVICE` — cet environnement ne dispose d'aucun simulateur/rendu visuel capable de produire une capture `402×874` comparable à `catalogue-vide.png`. Aucune capture n'a donc été produite ; ce n'est pas déclaré comme preuve visuelle.

## Hypothèses non démontrées

- La teinte exacte de `colors.selectionSurface` (`#E5F0FF`) pour la bande Context n'est pas confirmée contre la frame Figma `2117:86` — reprise telle quelle du plan (ambiguïté déjà signalée, valeur par défaut assumée).
- La position/l'alignement horizontal précis du sélecteur de filtres et de `Créer` à l'intérieur de la bande Context n'a pas été mesuré contre la frame (pas d'accès Figma live) — seul leur regroupement dans la bonne zone (Context, pas Header ni Body) est démontré.
- La hauteur totale réelle du Header sur un device donné (`insets.top` variable) n'a pas été mesurée physiquement — seule la formule (`insets.top + dimensions.header.contentHeight`, un seul point d'application de l'inset) est démontrée par lecture du code.

## Modifications réalisées

**`src/features/sessions/CatalogueScreen.tsx`** :
- Nouvelle structure : `header` (titre, hauteur `insets.top + dimensions.header.contentHeight`) → `headerSeparator` (1px, `colors.divider`) → `contextBand` (fond `colors.selectionSurface`, contient `FilterSelector` + `CreateAction`) → `body` (inchangé fonctionnellement, porte désormais son propre `paddingHorizontal`/`paddingTop`).
- `container` ne porte plus de `paddingHorizontal`/`gap` globaux (redistribués aux zones qui en ont besoin — `header`, `contextBand`, `body`) — évite un double espacement.
- `centeredBody` : `paddingHorizontal` retiré (héritée désormais de `body`, son parent direct) — même largeur effective, pas de changement visuel.
- Aucune donnée, aucune logique de chargement/erreur/filtre modifiée.

**`src/features/sessions/__tests__/CatalogueScreen.test.tsx`** : nouveau test structurel LAY-01 (voir « Preuves et tests »).

## Tableau atomique avant/après — 9 critères (`PLAN_APPROVED`)

Statuts distincts par dimension, conformément à `G-02` : un test Jest vert ne vaut que `PASS` fonctionnel/structurel, jamais `PASS` visuel ni `PASS` device.

| # | Critère | code/structure | fonctionnel automatisé | visuel | device |
|---|---|---|---|---|---|
| 1 | Header fixe `0–92`, sans double inset | **PASS** — `insets.top` appliqué une seule fois (hauteur du Header), plus aucun `paddingTop` concurrent sur `container` | **PASS** (Header rendu, titre présent) | NON VÉRIFIABLE | NON VÉRIFIABLE |
| 2 | Titre `Catalogue des séances` dans son slot | **PASS** | **PASS** (test dédié) | NON VÉRIFIABLE | NON VÉRIFIABLE |
| 3 | Séparateur horizontal sous le Header | **PASS** | **PASS** (test dédié) | NON VÉRIFIABLE (teinte/épaisseur exactes non confirmées Figma) | NON VÉRIFIABLE |
| 4 | Bande Context bleu très pâle distincte | **PASS** structurel (fond distinct appliqué) | **PASS** (test dédié) | NON VÉRIFIABLE — **teinte exacte non confirmée** (valeur par défaut du plan) | NON VÉRIFIABLE |
| 5 | Segmenté + Créer aux positions/dimensions contractuelles | **PARTIEL** — regroupés dans la bonne zone, position/alignement pixel non mesurés | **PASS** partiel (présence dans la bande démontrée, géométrie relative non testée) | NON VÉRIFIABLE | NON VÉRIFIABLE |
| 6 | Créer `90×32`, rayon `16`, cible `≥48` | **PASS** (inchangé depuis `UI-CAT-001`) | **PASS** (test dédié déjà existant, revérifié) | NON VÉRIFIABLE | NON VÉRIFIABLE |
| 7 | Corps vide conforme (texte/largeur/alignement/position) | **PASS** non-régression ; NON VÉRIFIABLE conformité exacte à la frame | **PASS** (message vide toujours affiché correctement) | NON VÉRIFIABLE | NON VÉRIFIABLE |
| 8 | Shell inférieur/navigation non modifiés | **PASS** (aucun fichier de navigation touché, diff vérifié) | **PASS** (suite de tests navigation inchangée, toujours verte) | NON VÉRIFIABLE | NON VÉRIFIABLE |
| 9 | Aucun offset magique ajouté | **PASS** (revue du diff : uniquement tokens déjà existants réutilisés) | N/A (non testable directement) | NON VÉRIFIABLE | NON VÉRIFIABLE |

## Éléments non corrigés ou hors périmètre

`CTRL-01`, `CTRL-02`, `LAY-02` à `LAY-07`, tout écran autre que Catalogue — **explicitement non traités**, conformément à l'interdiction du `PLAN_APPROVED` de cette phase. Aucune nouvelle capacité fonctionnelle ajoutée aux filtres `Planifiées`/`Archivées` (hors périmètre, décision déjà actée antérieurement).

## Vérifications restant à effectuer sur appareil réel

Toutes les cases « visuel » et « device » du tableau ci-dessus : comparaison de capture `402×874` réelle contre `catalogue-vide.png`, en particulier la teinte de la bande Context, l'épaisseur/couleur du séparateur, la géométrie exacte du sélecteur de filtres et de Créer, et la hauteur réelle du Header sur un device physique.

## Fichiers modifiés

- `src/features/sessions/CatalogueScreen.tsx` (modifié)
- `src/features/sessions/__tests__/CatalogueScreen.test.tsx` (modifié)
- `.github/orchestration/reports/2026-09-03_P0-phase01-catalogue-vide.md` (créé — ce rapport)

## Commit final

Voir la réponse de clôture pour les hashes exacts (commit applicatif puis commit du rapport, réalisés immédiatement avant push).

## État Git

Voir la réponse de clôture pour `git status --short`, HEAD local et HEAD distant vérifié après push.

## Statut

`PHASE01_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`

Conformément à la condition d'arrêt du `PLAN_APPROVED`, cette mission s'arrête ici. Aucune phase suivante (Calendrier, Suivi, Composition, contrôles des autres écrans) n'est commencée. La phase 1 ne sera fermée et la phase 2 ouverte qu'après comparaison de la capture iPhone réelle du Catalogue vide par l'utilisateur/ChatGPT.
