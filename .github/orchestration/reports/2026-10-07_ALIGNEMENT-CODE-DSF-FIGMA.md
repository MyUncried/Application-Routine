# Rapport de mission — Alignement de la présentation du code sur le DSF Figma

| | |
|---|---|
| Identifiant | `ALIGNEMENT-CODE-DSF-FIGMA` (2026-10-07) |
| Objectif | Réaligner la présentation du code KODJO (tokens, typographie, géométrie, icônes, composants déjà implémentés) sur le Design System Figma, à partir de `BRIEF-ALIGNEMENT-CODE-FIGMA-2026-10-07-v3.md` |
| Cadre | Cadre alternatif autorisé explicitement par Hermann pour cette mission : analyse ciblée → réalignement → vérifications → PR d’aperçu. Pas de V2/VNext, pas de porte de plan ni d’approbation préalable, pas d’audit DSF global (§ 6 bis). Aucun workflow lancé, aucun fichier de protocole modifié. |
| Branche | `feat/alignement-dsf-figma-2026-10-07` (worktree dédié `C:\Dev\Application-routine-dsf-align`) |
| Commit de départ | `72d1bf47` (`origin/main`, merge de la PR #323). Le commit `6d03f5b` cité par le brief est historique : le dépôt n’y a pas été ramené. |
| Figma | `G6RY5Ebhgwb4AHIOYDwwvg`, lecture seule exclusivement (aucune écriture) |

## 1. État de départ

- Le checkout principal `C:\Dev\Application-routine` est sur `main` local (`c91bea3b`, en retard sur `origin/main`) avec 13 fichiers de `docs/Specifications-fonctionnelles/` modifiés (essentiellement des fins de ligne). **Il n’a pas été touché.** Aucune opération Git en cours (pas de merge, rebase, ni `index.lock`).
- Le travail a été fait dans un worktree dédié créé depuis `origin/main`. Un second worktree détaché (`C:\Dev\Application-routine-dsf-baseline`, `origin/main`) a servi de base de comparaison pour les tests.
- Les deux worktrees utilisent les `node_modules` du checkout principal via une jonction (même `package-lock.json` qu’`origin/main`) ; la jonction est ignorée par Git.

## 2. Périmètre

**Demandé** : tokens et alias (couleurs, typographie, espacements, rayons) et leurs consommateurs ; polices prévues pour les usages existants ; assets, manifeste et `KodjoIcon` ; présentation des composants et écrans déjà implémentés ; les deux libellés D10 ; mises à jour documentaires nécessaires. Avec les limites fixées par Hermann (pas d’accélération du stepper, pas de retrait d’action, déclencheurs inchangés, durée optionnelle sans changer les règles, phrase de synthèse en présentation seule, pas de `newCircuit`).

**Réellement traité** : voir § 4. **Non traité ou laissé en l’état** : voir § 6.

## 3. Sources consultées

### Figma (lecture seule, 2026-10-07)

| Référence | Usage |
|---|---|
| Collections `KODJO / Primitives` (350), `KODJO / Sémantiques` (432), `KODJO / Responsive` (4) | Valeurs résolues et alias de toutes les variables sémantiques (hors `observed`) |
| 51 styles de texte locaux | Interlignes Auto / explicites (règle D2) |
| `DSF / Cards / Séance` `6214:7276`, variante `6214:3572` ; `DSF / Cards / Exercice` `6214:7278`, variante `6214:4111` | Anatomie, durée sans cadre, couleurs, marges, propriétés `Durée#7344:11` / `Durée#7344:0` |
| `DSF / Forms / Valeur modifiable` `6944:26423` (4 variantes, dont `7092:13604` Grisé) | Valeur fermée du Profil |
| `DSF / Controls / Stepper / Profil` `5544:4732` ; glyphes `5826:4101` (−), `5826:4105` (+) | Stepper du Profil, export des glyphes |
| `DSF / Forms / Roulette` `5544:5146`, variante `7130:13496` | Constat : variante « secondes par répétition » (cadence) sans usage codé |
| `DSF / Status & Tags / Ressenti` `6234:8895` ; `DSF / Forms / Ressenti` `5544:5525` | Constat : aucun usage codé |
| `DSF / Controls / Disclosure` `5544:4650` | Couleurs réelles du chevron de déploiement |
| `DSF / Overlays / Confirmation` `5544:6095` (Destructive, Abandon) ; `DSF / Primitives / Dialogue de décision (ancien)` `2590:2961` | Couleurs et interlignes des dialogues |
| `DSF / Primitives / Icône d’action de modale` `4155:6201` ; `icon/retour` `6959:15940` ; `icon/ajouter` `6959:15706` ; `Icône — Démarrer` `6214:3525` ; chevrons `5544:4638` / `5544:4641` | Comparaison octet à octet des exports avec les assets du dépôt |
| Identifiants historiques du manifeste (25) | Existence vérifiée un par un |
| Écrans `1992:474` (Profil — Stepper), `3542:4656` (Création activité — Avant paramètres), `2028:11298`, `4714:6241`, `4861:6145`, `6407:10127` (voiles), `3518:4576` (déplacement) | Rendu de référence et contrôles ciblés |
| Page `Prototype MVP` `510:101` | Inventaire des écrans ; recensement des textes en Roboto Condensed |

### Dépôt

`12 – Architecture technique.md` (section « Design tokens canoniques »), `06 – Ecrans et navigation de la V1.md`, `assets/icons/manifest.json`, `assets/icons/figma-current-exports.json`, les composants et tests listés au § 9.

## 4. Correspondance Figma → code (modifications réalisées)

| Référence Figma | Token / composant de code | Modification | Usages affectés | Vérification |
|---|---|---|---|---|
| `color/divider` = `color/border` `#E0E3E8` | `colors.divider` | `#DBE0E8` → alias de `border` | Séparateurs : ScreenShell, Profil, Composition, roulettes, options du catalogue | `tokensSpecification.test` ; tests d’écrans au vert |
| `color/icon-neutral` = `color/text-secondary` | `colors.iconNeutral` | `#5C636E` → `#595E66` (alias) | Aucun consommateur | idem |
| `color/text-label` `#46464C` | `colors.textLabel` (nouveau) ; `dialogMessageText` | message de dialogue `#474D57` → `#46464C` (D3) | 3 dialogues | idem |
| `color/text-primary` | `dialogTitleText`, `exerciseParameterValueText`, `exerciseParameterLabelText` | `#121212`, `#14171C`, `#1F1F26` → `#141414` (D3) | Dialogues, Création d’activité, Composition | idem |
| `color/surface` | `dialogNeutralActionBackground`, `exerciseContextBandBackground`, `exerciseParameterCardBackground` (via `mediaSurface`) | `#F3F4F6`, `#F7F7FF`, `#F6F6FF` → `#F5F7FA` (D3) | Dialogues, bandeau Activité, carte soulevée de Composition | idem + tests AbandonCreationModal / ExerciseExitConfirmModal adaptés |
| `color/danger` (lié au bouton destructif de `5544:6095`) | `dialogDestructiveActionBackground`, `dialogDestructiveActionBorder` | `#E62B1E` / `#DB2E2E` → `#D92D20` | Dialogues destructifs | idem |
| `color/media/border` `#CDCEFA`, `color/media/surface` | `mediaBorder`, `mediaSurface` (nouveaux) ; `tourSurface` alias | aucune valeur changée pour `tourSurface` | Tour, carré de chevron | idem |
| `color/primary-soft` `#8283F2` | `primarySoft` (nouveau) ; `disclosureBorderExpanded` alias | aucune valeur changée | Disclosure déployé | idem |
| `color/cards/border` `#CCD1E0` | `cardsBorder` (nouveau) | remplace le littéral de `ProfileEditScreen` et sert de contour des cartes | Profil (silhouettes), cartes | idem |
| `color/observed/f2f2ff` (stepper) | `stepperSurface` (nouveau) | fond de la pilule du stepper | Profil | tests Profil (stub) |
| Annexe F | `ProfileScreen` (`#FCFCFE`, `#FFFFFF`), `ProfileEditScreen` (`#CCD1E0`, `#0508E5`), `DecisionDialog` (voile) | littéraux → tokens | Profil, dialogues | `grep` § 7.4 |
| Styles Inter Auto (D2) | `type.*` | interlignes : `metricPrimary` 27, `sectionTitle`/`cardTitle` 19, `body`/`label`/`button` 17, `supporting` 15, `caption`/`navLabel` 13, `exerciseFieldValue` 16, libellés d’action de dialogue 19 | Tous les écrans codés | `tokensSpecification.test`, tests CompositionScreen adaptés |
| D9 | `type.compactCardTitle` | 14/18 → 15/18 | Composition (Récupération, Tour) | idem |
| § 5.1, `DSF / Cards` (Semi Bold 15) | `type.listCardTitle` (nouveau) | titre des cartes Séance/Exercice 16/20 → 15/18 | Catalogue des séances, catalogue des exercices | tests SessionCard / ActivityCard |
| D11 | `type.cardDuration` (nouveau), `CardTitleLine` (nouveau composant partagé) | durée Semi Bold 12 `#141414`, sans cadre, à droite à 16 du bord | Cartes de Séance | test SessionCard adapté |
| `Valeur modifiable` `Texte=13` | `type.editableValue` (nouveau) | valeur fermée du Profil en badge `surface`, rayon 10, marges 4 × 10, Semi Bold 13 bleu | Profil | tests Profil (stub) |
| Échelles `spacing/10,14,20`, `radius/14,17` | `spacing`, `fixedRadii` | ajout | — | `tokensSpecification.test` |
| `DSF / Cards / Séance` `6214:3572` | `SessionCard` | durée déplacée sur la ligne de titre (même calcul, même format « ≥ ») ; ligne de titre pleine largeur ; Déployer et Démarrer en bas à droite ; fond `surface-subtle`, contour 0,5 `cards/border`, rayon 8 ; métadonnées Regular 12 | Catalogue des séances | test SessionCard (2 tests adaptés) |
| `DSF / Cards / Exercice` `6214:4111` | `ActivityCard` | chevron Déployer retiré (contrôle désactivé, **sans action**) ; titre 15 ; Lecture en bas à droite ; même conteneur ; métadonnées Regular 12 | Catalogue des exercices | test ActivityCard (1 test adapté) |
| `DSF / Controls / Stepper / Profil` `5544:4732` | `ProfileStepper` | stepper sur la même ligne que le libellé, pilule `#F2F2FF` 36 / rayon 18, cercles blancs 28, valeur Semi Bold 13 bleue ; « − »/« + » remplacés par les assets `stepper-minus.svg` / `stepper-plus.svg` (export exact des glyphes Figma) ; aux bornes, le signe passe en `color/disabled`, le cercle ne change pas | Profil (5 réglages) | ProfileStepper.test, ProfileScreen.test (stub) |
| `icon/retour` `6959:15940` | `KodjoIcon` `control-back` | pointe sur l’export exact `icon-retour.svg` (même tracé, trait `#141414` au lieu de `#1F2023`) ; `control-back.svg` supprimé | En-têtes avec Retour | ScreenShell.test |
| Manifeste | `assets/icons/manifest.json` v2 | identifiants recalés ; statut par asset (`EXACT_EXPORT`, `EQUIVALENT_GEOMETRY`, `SOURCE_EXISTS`, `SOURCE_REMOVED`) ; 11 assets hors manifeste ajoutés | — | `visualAssets.test` (nouveau test « aucun SVG sans entrée ») |
| D10 | `fr.ts` | `contentTypes.circuits` → « Parcours » ; `circuitsUnavailableAccessibilityLabel` → « Parcours — indisponible » | Contrôle segmenté du catalogue | i18n test adapté |
| — | spécification 12 et 06 | valeurs retenues, table des alias d’usage du code, nouveaux rôles typographiques, exceptions documentées | — | `tokensSpecification.test` (nouveau, critère 2 du brief) |

## 5. Questions du § 5 du brief — résolution

| § | Résolution |
|---|---|
| 5.1 | Token dédié `type.listCardTitle` 15/18 pour les cartes Séance/Exercice ; `type.cardTitle` reste 16 (hors cartes). Vérifié sur Figma : titres Semi Bold 15. |
| 5.2 | `compositionDraggedCardShadow` garde son nom (non ambigu avec `overlayScrim`) ; documenté comme valeur de `color/overlay-scrim`. |
| 5.3 | `disclosureBorderCollapsed` **conservé** `#D6D9E3` : le composant Figma `5544:4650` porte toujours cette valeur (ainsi que `#FBFCFF` et `#8282F2`), Figma faisant foi. `compositionDraggedCardBorder` **conservé** `#D1D1D6` (non reconfirmable : pas de contour au premier niveau du bloc Figma `4916:6844`). |
| 5.4 | Convention appliquée : `textLabel`, `primarySoft`, `cardsBorder`, `mediaSurface`, `mediaBorder`, `stepperSurface`. |
| 5.5 | Seuls les tokens consommés sont ajoutés au code (`textTertiary`, `onPrimary`, `calendarMarker`, `breakpoint` restent documentés seulement). |
| 5.6 | Icônes de navigation : dessins **non modifiés** ; sources qualifiées dans le manifeste (Figma 24 × 24 / 24 × 19,38 / 21,52 × 24 contre 26 × 26 / 26 × 21 / 26 × 29 dans le dépôt). Les sources `navigation.sessions` ont disparu ; le candidat `icon/catalogue` est un dessin différent, non substitué. |
| 5.7 | `newCircuit` (« Un circuit ») inchangé. `circuitsTitle` (« Catalogue des circuits ») inchangé (hors D10). |
| 5.8 | Aucune quatrième valeur de gris figée : la durée est en `textPrimary` (vérifié : `color/text-primary` sur la carte Figma ; le `#595E66` du § 11.3 correspond aux métadonnées, déjà `textSecondary`). |
| 5.9 | Asymétrie des marges consignée ; sans objet ici (pas de gouttière codée). |

## 6. Éléments non traités, laissés inchangés ou en attente

1. **Roboto Condensed non ajoutée.** Le recensement Figma montre qu’elle n’est utilisée que sur les écrans d’Exécution (chronomètre, compteurs), non codés. Conformément à la consigne (« polices prévues pour les usages existants », pas de dépendance sans usage), ni la dépendance ni le chargement ne sont ajoutés. `type.timerPrimary` (Inter 58/64, sans consommateur) est retiré. La spécification documente déjà les rôles Roboto Condensed.
2. **`color.overlayScrim`** : valeur de code `rgba(20,20,20,0.5)` conservée — Figma est incohérent (variable `#1F2129` à 34 %, voiles dessinés `#000000` à 28 % ou `#14171F` à 34 %). **Contradiction visuelle à arbitrer.** Documentée dans la spécification 12.
3. **`dialogMessage`** : interligne 21 conservé (interligne explicite dans Figma, exception D2) au lieu du 17 de l’annexe B.
4. **Disclosure** : `#FBFCFF`, `#D6D9E3`, `#8282F2` conservés (Figma les porte toujours) au lieu des cibles de l’annexe A.3.
5. **Anatomie complète des cartes Figma non reproduite** : icônes d’étiquette et de catégorie, ligne « Étiquette · Catégorie », icônes de métadonnées, barre de couleur (masquée dans Figma pour le catalogue, conservée dans le code car elle porte la couleur de la Séance, validée par un test existant). Hors des deltas de l’annexe I ; à arbitrer.
6. **Gouttière photo des cartes d’Exercice (64 × 64)** non ajoutée : elle dépend de la vignette du premier média (D-264), non implémentée ; afficher l’icône de nature seule donnerait un rendu faux pour les exercices avec photo. La carte utilise la variante Figma « sans gouttière » (texte 16 → 338).
7. **Annexe J (24 modales de paramètres), phrase de synthèse, Roulette « secondes avec unité », Ressenti 20 × 20** : aucun de ces éléments n’existe dans le code actuel (la Création d’activité codée utilise encore l’ancienne rangée de paramètres). Rien à aligner sans développer un écran ou un paramètre futur (exclu).
8. **`Valeur modifiable` — état Grisé** : aucun usage désactivé dans le code ; aucun état n’est ajouté. Constat : le code n’utilise pas d’opacité de conteneur pour ce composant.
9. **Accélération du stepper (D13)** : non implémentée (consigne) ; gestes et répétition existants inchangés.
10. **Icônes E.8 / E.9** (couples contour/plein, pause composée, chronomètre) : pas d’usage codé ; non intégrées.
11. **Assets sans source Figma actuelle** (`SOURCE_REMOVED`) : `control-repetition-pull-down`, `composition-fixed` (non branchés), `navigation-sessions*`, `state-selected` (branchés). Identifiant historique tracé ; aucun dessin modifié.
12. **`wheel-action-validate`** : Figma refuse l’export SVG de la variante `4155:6200` ; octets non comparés.
13. **Dette Figma** (§ 11.5, 6 % de liaison) et composants obsolètes (G.6) : hors périmètre.
14. **Échecs préexistants d’environnement** (§ 7) non corrigés : hors mission.

## 7. Preuves et tests

### 7.1 Base de référence (`origin/main` `72d1bf47`, worktree détaché, mêmes `node_modules`)

| Contrôle | Commande | Résultat |
|---|---|---|
| TypeScript | `npx tsc --noEmit -p .` | **FAIL** — 1 erreur : `profilePhoto.ts` ne trouve pas `expo-image-picker` (absent des `node_modules` partagés) |
| Lint | `npx expo lint` | **FAIL** — 1 erreur, même cause (`import/no-unresolved`) |
| Jest | `npx jest --ci --silent` | **FAIL** — 84 suites dont 3 en échec ; 1494 tests, 1 échec : `targetSchema` (empreinte SHA-256 d’une migration altérée par la conversion CRLF du checkout Windows), `ProfileScreen.test` et `profilePhoto.test` non chargés (`expo-image-picker`) |

Ces trois échecs sont préexistants et relèvent de l’environnement local, non du code de la mission.

### 7.2 Branche (avant commit)

| Contrôle | Commande | Résultat |
|---|---|---|
| TypeScript | `npx tsc --noEmit -p .` | **FAIL** — la même et unique erreur préexistante (`expo-image-picker`) ; aucune nouvelle erreur |
| Lint | `npx expo lint` | **FAIL** — le même et unique problème préexistant ; aucun nouveau |
| Jest | `npx jest --ci --silent` | **FAIL** — 85 suites (une nouvelle : `tokensSpecification`), 3 en échec, **identiques à la base** ; 1498 tests, 1497 réussis, 1 échec identique à la base (`targetSchema`) |

Comparaison : aucune régression introduite. Un premier passage complet sur la branche avait fait apparaître 8 tests figeant d’anciennes valeurs (D3, D2/D9, D10) ; ils sont adaptés et justifiés au § 7.5.

### 7.3 Profil avec stub temporaire de `expo-image-picker`

`ProfileScreen.test.tsx` ne se charge pas dans cet environnement (`expo-image-picker` absent des `node_modules` partagés — échec préexistant identique sur la base). Exécuté avec un `moduleNameMapper` vers un stub temporaire (fichier créé puis supprimé, jamais commité) : **base 16/16, branche 16/16**. `profilePhoto.test` et `ProfileEditScreen.test` : 32/32 sur les deux.

### 7.4 Couleurs en dur hors `tokens.ts` (`grep` sur `src` et `app`, hors tests)

Restent uniquement : palette de couleurs de Séance/Catégorie (`Session.ts`, migrations 001/007 — données), `KodjoSplash.tsx` (splash dédié, laissé tel quel), `shadowColor: "#000000"` (ombres, hors périmètre), et des commentaires.

### 7.5 Tests adaptés — justification un par un

| Test | Changement | Justification |
|---|---|---|
| `SessionCard` × 2 | la durée n’est plus dans « 1 exercice · 18 min · 1 tour » mais dans `session-card-duration` ; même valeur et même « ≥ » | D11 |
| `ActivityCard` × 1 | « Déployer » attendu absent | Annexe I.2 ; le contrôle était désactivé et sans action |
| `AbandonCreationModal` × 2, `ExerciseExitConfirmModal` × 2 | fond neutre = `surface`, rouge = `danger` (au lieu de `#F3F4F6`, `#E62B1E`, « jamais `danger` ») | D3 ; Figma lie le bouton à `color/danger` |
| `CompositionScreen` × 4 | interlignes 20 → 19 (`cardTitle`), 14 → 13 (`caption`) | D2 |
| `i18n` × 1 | « Parcours » | D10 |
| `visualAssets` | identifiant nul admis seulement pour `SOURCE_REMOVED` ; nouveau test « aucun SVG sans entrée » | Critère 6 du brief |
| `tokensSpecification` (nouveau) | compare `tokens.ts` aux tableaux du chapitre 12 | Critère 2 du brief |

Aucun instantané n’existe dans ces suites ; aucun n’a été régénéré.

### 7.6 Rendu

- **Propriétés vérifiées dans le code** : valeurs des tokens (test déterministe), styles des composants modifiés (tests de styles existants et adaptés).
- **Rendu effectivement observé** : **aucun**. Aucun simulateur, appareil ni navigateur pilotable n’était disponible dans cette session ; les comparaisons visuelles ont porté sur les captures et relevés Figma uniquement. Des tests au vert ne prouvent pas la conformité visuelle.

## 8. Vérifications restant à faire sur iPhone

1. **Catalogue des séances** : durée à droite de la ligne de titre (titre long tronqué/à deux lignes), Déployer et Démarrer en bas à droite sans chevauchement, police agrandie (135 %, ~200 %).
2. **Catalogue des exercices** : absence du chevron, Lecture en bas à droite, Zones corporelles et synthèse qui s’arrêtent avant Lecture.
3. **Profil** : stepper ouvert sur la même ligne que le libellé (libellés longs comme « Pause au changement de côté » à 360 pt), signes −/+ (rendu `tintColor` sur SVG), état aux bornes, valeurs fermées en badge, cible tactile 48 des cercles de 28.
4. **Interlignes réduits** (`body` 20 → 17, `navLabel` 16 → 13, `caption` 14 → 13) : Profil, Catalogue, Composition, Création d’activité ; absence de coupure de jambages.
5. **Dialogues** (abandon de création, sortie d’exercice, confirmation) : rouge `#D92D20`, fond neutre `#F5F7FA`, message `#46464C`.
6. Séparateurs (`divider` `#E0E3E8`) et bouton Retour (`#141414`).

## 9. Fichiers modifiés

- `src/shared/ui/tokens.ts`, `src/shared/ui/CardTitleLine.tsx` (nouveau), `src/shared/ui/KodjoIcon.tsx`, `src/shared/ui/ProfileStepper.tsx`
- `src/features/sessions/SessionCard.tsx`, `src/features/activities/ActivityCard.tsx`, `src/features/sessions/DecisionDialog.tsx`
- `src/features/preferences/ProfileScreen.tsx`, `src/features/preferences/ProfileEditScreen.tsx`
- `src/shared/i18n/resources/fr.ts`
- `assets/icons/manifest.json`, `assets/icons/stepper-minus.svg` (nouveau), `assets/icons/stepper-plus.svg` (nouveau), `assets/icons/control-back.svg` (supprimé)
- Tests : `SessionCard.test.tsx`, `ActivityCard.test.tsx`, `AbandonCreationModal.test.tsx`, `ExerciseExitConfirmModal.test.tsx`, `CompositionScreen.test.tsx`, `src/shared/i18n/index.test.ts`, `visualAssets.test.ts`, `tokensSpecification.test.ts` (nouveau)
- Documentation : `12 – Architecture technique.md`, `06 – Ecrans et navigation de la V1.md`, ce rapport

## 10. Hypothèses non démontrées

- `tintColor` d’`expo-image` recolore correctement les SVG des signes −/+ (précédent existant : chevrons de Disclosure et de Tour), non observé sur appareil.
- Les interlignes `round(1,2102 × corps)` reproduisent le rendu « Auto » de Figma sur iOS et Android (approximation du brief).
- La réservation des lignes basses des cartes (2 × 48 + 2 − 16) suffit à éviter tout chevauchement avec les actions à toutes les tailles de police.

## 11. Commit final et état Git

ETAT_GIT
