# P0 — Phase 2 — REWORK09 — Reconstruction de l'écran « Ajouter une activité » + corrections connexes Composition

## Identification

- **Mission** : reconstruction de l'écran `ExerciseScreen.tsx` (CE-T01-13) depuis le Shell/composants DS, conformément au Figma actuel et à la documentation canonique mise à jour — plus deux corrections connexes déjà validées sur `CompositionScreen.tsx`.
- **Issue** : [#35](https://github.com/MyUncried/Application-Routine/issues/35)
- **Autorisation** : message direct de l'utilisateur, 2026-09-04, appliquant explicitement `G-01` à `G-08` (`.github/orchestration/reports/2026-09-03_P0-audit-fiabilite-corrections-layout.md`, § « Correctifs obligatoires du protocole »).
- **Protocole appliqué** : `G-01` (registre de défauts ci-dessous, IDs `AA-01`…`AA-09`/`CO-01`…`CO-03`) ; `G-02` (verdicts `PASS`/`FAIL`/`NON VÉRIFIABLE` par dimension, jamais « conforme » seul) ; `G-03` (critères atomiques cités par ID) ; `G-04` (preuves avant/après — limitées à des preuves de code/style dans cet environnement, aucune capture device possible) ; `G-05` (statut de clôture `IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`, jamais `DONE`/`CONFORME`) ; `G-06` (ce rapport livre l'implémentation et les preuves techniques ; la comparaison visuelle aux références et la fermeture définitive des IDs restent au contrôle indépendant) ; `G-07` (ce rapport) ; `G-08` (worktree vérifié propre avant démarrage, voir ci-dessous).

## Branche et commit de départ

- Branche : `feat/creation-seance-catalogue`
- Préconditions vérifiées avant tout code (`G-08`) :
  - `git fetch` puis `git pull --ff-only origin feat/creation-seance-catalogue` → `Already up to date`.
  - `git rev-parse HEAD` = `bc16a6d52abfd74901ee8f6a6d6aa1098e437ac6`.
  - `git status --porcelain` : vide (worktree propre).
- Dernier checkpoint identifié : commit `bc16a6d` (« docs(design): aligner les contrôles UI, dialogues et captures Figma », 2026-09-04T14:38:08+02:00) — contient trois rapports de canonicalisation Figma/documentation lus intégralement avant tout code :
  - `.github/orchestration/reports/2026-09-04_activity-form-control-order.md`
  - `.github/orchestration/reports/2026-09-04_repetition-pull-down-canonical-icon.md`
  - `.github/orchestration/reports/2026-09-04_ui-wheel-dialogs-session-name-documentation.md`

## Périmètre demandé

Défini intégralement par le message utilisateur (texte complet relu et archivé) :

- **Écran « Ajouter une activité » (CE-T01-13)** — 9 corrections numérotées : shell partagé (1), ordre exact des champs (2), champ Nom de l'activité (3), contrôles segmentés (4), titres visibles (5), rangée compacte des paramètres (6), anatomie des chevrons (7), cadre récapitulatif (8), conservation des comportements métier (9).
- **Roulette de durée** — verrou de non-régression explicite : primitive OS native, défilement fonctionnel, deux cadres gris (désormais documentés comme limite native acceptée), brouillon/validation, boutons canoniques ; adaptation d'ancrage autorisée, toute autre modification interne doit être signalée et démontrée sans régression avant exécution.
- **Corrections connexes Composition** (2 items) : champ Nom de la séance conforme à `Session / Name Field — Source exact` (fond transparent, liseré blanc `color/session-name-border`) ; suppression de la ligne de synthèse basse `0 activité · 0 min`. Aucun autre élément déjà validé de Composition ne doit être modifié.
- **Contraintes** : réutiliser composants/tokens canoniques (aucune copie locale équivalente) ; ne pas modifier la navigation, la roulette validée ou un écran hors périmètre ; pas de réécriture massive ; toute divergence locale justifiée explicitement ; contradiction Figma/DSF/documentation non résolue → `À CLARIFIER`, jamais inventée.
- **Tests obligatoires** : liste de 13 exigences (header partagé, ordre des champs, titres visibles, états/couleurs des segments, rangée unique, anatomie des chevrons, récapitulatif calculé, en-tête/action fixes + formulaire défilant, fonctionnement des sélections, non-modification avant confirmation, restauration après Annuler, transparence/liseré du champ Nom de séance, disparition de la synthèse basse, non-régression des tests existants) — voir correspondance point par point ci-dessous.

## Périmètre réellement traité

Conforme au périmètre demandé, sans extension. Fichiers modifiés : `ExerciseScreen.tsx` (reconstruction), `CompositionScreen.tsx` (2 corrections ciblées), `compositionPresentation.ts` (nouvelle fonction pure `formatExerciseRecap`), `tokens.ts` (nouveaux tokens couleur/dimension/typographie), `KodjoIcon.tsx`/`manifest.json`/`select-field-chevron.svg` (nouvel actif canonique), `fr.ts` (chaînes), et les fichiers de tests correspondants. **Aucune ligne de `DurationWheelPicker.tsx` modifiée.** Aucun autre écran touché.

## Contrôle direct des nodes Figma actuels (avant tout code)

Conformément à l'instruction explicite (« ne pas se fonder sur une ancienne capture ni sur l'implémentation existante »), les nodes suivants ont été contrôlés directement via l'outil Figma MCP (fichier `G6RY5Ebhgwb4AHIOYDwwvg`), pas sur une capture antérieure :

| Référence | Node(s) | Constat retenu |
|---|---|---|
| CE-T01-13 (état Durée) | `1992:9132` | Ordre exact, géométrie complète (voir ci-dessous) |
| CE-T01-13 (état Répétitions) | `1992:9212` | Confirme le libellé compact `Répétitions` et le format du récapitulatif mode Répétition |
| CE-T01-14 (Durée ouverte) | `1992:9430` | Position du popover (centré sous le cadre `354`, jamais sous une seule colonne) |
| `Type d'activité` (segment) | `1992:9148` | `354×42`, padding `4`, gap `14`, segments `166×34`, rayon `12`/`10`, `#5f60ee`/blanc vs transparent/`#595e66` |
| `Nom de l'activité` (champ) | `1992:9155` | Fond blanc, liseré `#c7c9d1`, rayon `8`, hauteur `46` |
| `Sélecteur compact — Durée/Pause/Séries` | `1992:9166`/`1992:9246` | Cadre `354/8/16` fond `#f6f6ff` ; rangée `338×66` gap `8` ; colonnes `124`/`124`/`74` ; contrôle `42/10`, liseré `#dbdbe5` ; carré chevron `28×28` fond `#cdcefa` rayon `6` ; chevron `14×14` blanc ; récapitulatif liseré `#cdcefa` rayon `12` |

## Tableau PRESERVE / CHANGE / FORBIDDEN (avant code)

| Élément | Statut | Preuve |
|---|---|---|
| `DurationWheelPicker.tsx` (primitive native, contrat `onValidate`/`onCancel`, brouillon local) | **PRESERVE** | Aucune ligne modifiée — `git diff --stat` ne cite pas ce fichier. |
| Roulette — deux cadres gris de sélection | **PRESERVE (limite native documentée)** | Non retouché ; le message d'autorisation lui-même les qualifie de « désormais documentés », confirmant la clôture de l'escalade `NATIVE_PRIMITIVE_EXCEPTION_REQUIRED` de REWORK08. |
| Structure Tour, contrôle Nombre de tours, icônes Retour/Annuler/Valider (REWORK07B/08 gelés) | **PRESERVE** | Aucune ligne de ces mécanismes touchée dans `CompositionScreen.tsx`. |
| Navigation, `SessionDraftProvider`, garde de sortie (`useCompositionExitGuard`), verrou d'idempotence `Terminer` | **PRESERVE** | Logique métier de `ExerciseScreen.tsx` recopiée à l'identique (voir diff — seule la couche de rendu change). |
| En-tête local (`header`/`backButton`/`title`/`headerSeparator` de `ExerciseScreen.tsx`) | **CHANGE** | Remplacé par `ScreenShell`/`FixedHeader`/`HeaderSeparator` partagés (point 1). |
| Ordre et hiérarchie du formulaire, grand titre local (`titleAdd`/`titleEdit`) | **CHANGE** | Nouvel ordre exact (point 2), titre local supprimé. |
| Champ Nom (style, libellé) | **CHANGE** | Anatomie `Forms / Text Field` (point 3), libellé `Nom de l'activité`. |
| Composant segmenté local | **CHANGE** | Nouvelle anatomie `Controls / Segmented` (point 4/5). |
| Trois lignes verticales Durée/Pause/Séries (`Row`, `AnchoredRow` ×3, `PopoverAnchor` ×3) | **CHANGE** | Remplacées par une rangée compacte unique + un `PopoverAnchor` unique (point 6/7). |
| Chevron `control-chevron-down`/`control-chevron-up` (24×24 sombre) des anciennes lignes | **CHANGE** | Remplacé par `select-field-chevron` (14×14 blanc, actif canonique nouveau) dans un carré `28×28`. |
| Cadre récapitulatif | **CHANGE** | Nouveau, calculé (`formatExerciseRecap`), point 8. |
| Mécanisme de fermeture (root `Pressable` plein écran) | **CHANGE, jugée indispensable** | Remplacé par le patron `backdrop` dédié + élévation du `ScrollView` déjà validé sur `CompositionScreen.tsx` (REWORK08-B) — voir justification dédiée ci-dessous. |
| Champ Nom de la séance (Composition) | **CHANGE** | Fond transparent + liseré `color.sessionNameBorder` (CO-01). |
| Ligne de synthèse basse (Composition, `bottomAction`) | **CHANGE (suppression)** | Retirée (CO-02) ; la synthèse reste affichée sous « Nombre de tours » (REWORK08-C, non touché). |
| Étape 2 (`Informations complémentaires`, CE-T01-15) | **PRESERVE** | Rendu inchangé (`TextInput` Consigne, `BodyZoneSelector`) — hors périmètre explicite. |
| Autres écrans (Catalogue, Calendrier, Suivi, Profil) | **FORBIDDEN** | Aucun fichier de ces écrans dans le diff. |

### Justification de la modification indispensable du mécanisme de fermeture (hors roulette elle-même)

Le message d'autorisation restreint l'exigence de signalement préalable à toute « modification interne indispensable » de **la roulette**. Le mécanisme de fermeture modifié ici est distinct : l'ancien `Pressable` racine plein écran de `ExerciseScreen.tsx` (`onPress={closeOverlay}` sur tout le conteneur) est le même anti-pattern D-03 déjà identifié et corrigé sur `CompositionScreen.tsx` avant ce cycle — il intercepte le geste avant qu'il n'atteigne un contrôle imbriqué. La restructuration du point 6 (une rangée compacte unique remplaçant trois lignes verticales) rendait ce défaut latent immédiatement observable (les quatre déclencheurs compacts, rapprochés, auraient hérité du même risque que celui corrigé par REWORK08-B sur Composition). Corriger ce point est une conséquence directe et nécessaire de la restructuration demandée (point 9 : « ne pas introduire de changement fonctionnel » implique que les sélections doivent réellement fonctionner) — traité comme faisant implicitement partie du périmètre plutôt que silencieusement ignoré, et documenté explicitement ici plutôt que signalé après coup.

## Correspondance point par point — Écran « Ajouter une activité »

| ID | Demande | Référence | Fichier/code | Test | Verdict (`G-02`) |
|---|---|---|---|---|---|
| **AA-01** | Shell canonique partagé (`FixedHeader`/`HeaderSeparator`/Action Back/titre=nom réel/fixes/séparateur pleine largeur/formulaire seul défile/action finale fixe) | `Header / Fixed`, `Action / Back` (déjà validés, réutilisés tels quels) | `ExerciseScreen.tsx` — `<ScreenShell><FixedHeader/><HeaderSeparator/>…</ScreenShell>` | `ExerciseScreen.test.tsx` — describe « Shell partagé » (4 tests) | Fonctionnel : **PASS**. Visuel/Device : **NON VÉRIFIABLE**. |
| **AA-02** | Ordre exact : Nom → Type → Mode → Paramètres ; suppression de l'ancienne hiérarchie | `1992:9132` | `ExerciseScreen.tsx`, JSX du corps | `ExerciseScreen.test.tsx` — describe « ordre exact du formulaire » (2 tests, `textOrder`) | Fonctionnel : **PASS**. Visuel : **NON VÉRIFIABLE**. |
| **AA-03** | Champ Nom de l'activité — `Forms / Text Field — Source exact` | `2537:1075`/`1992:9155` | `ExerciseScreen.tsx` — `styles.nameInput` (+ `tokens.ts`, `exerciseFieldBorder`/`exerciseTextField`) | describe « Champ Nom de l'activité » | Fonctionnel/style : **PASS**. Visuel : **NON VÉRIFIABLE**. |
| **AA-04** | Contrôles segmentés canoniques (`354×42`, segments égaux, sélection `color.selection`/blanc, libellés centrés, états accessibles) | `2586:2759`/`1992:9148` | `ExerciseScreen.tsx` — `SegmentButton`, `styles.segmentedControl`/`segment*` | describe « Contrôles segmentés » (4 tests) | Fonctionnel/style : **PASS**. Visuel : **NON VÉRIFIABLE**. |
| **AA-05** | Titres `Type d'activité`/`Mode d'exécution` visibles (pas seulement `accessibilityLabel`) | — | `ExerciseScreen.tsx` — `<Text style={styles.fieldTitle}>` avant chaque segment | « shows both segmented-control titles VISIBLY » | **PASS** (assertion `getByText`, pas seulement `getByLabelText`). |
| **AA-06** | Rangée unique `Activity / Parameter Row — Source exact` (`338×66`/`354`, Durée/Pause `124`, Séries `74`, gap `8`, libellés au-dessus, contrôles `42`) | `1992:9166`/`1992:9246` | `ExerciseScreen.tsx` — `ParameterField`, `styles.parameterCard`/`parameterRow`/`parameterControl` | describe « Rangée compacte » (4 tests) | Fonctionnel/style : **PASS**. Visuel : **NON VÉRIFIABLE**. |
| **AA-07** | Carré `28×28` fond `#CDCEFA` rayon `6`, chevron blanc `14×14` canonique, jamais un chevron sombre isolé, cible tactile conforme | `Forms / Select Field`, sous-nœud « Chevron — Sélecteur » | `ExerciseScreen.tsx` — `styles.parameterChevronBox` ; `select-field-chevron.svg` (nouvel actif), `KodjoIcon.tsx` | « gives every parameter control the canonical 28×28 chevron square… » + « keeps a real ≥48×48 touch target… » | Fonctionnel/style : **PASS**. Visuel : **NON VÉRIFIABLE**. |
| **AA-08** | Cadre récapitulatif calculé, largeur utile complète, liseré/rayon/marges Figma, croissance verticale, aucune valeur statique | `1992:9166`/`1992:9246` | `compositionPresentation.ts` — `formatExerciseRecap` ; `ExerciseScreen.tsx` — `styles.summaryCard` (pas de hauteur figée) | describe « cadre récapitulatif calculé » (3 tests) + `compositionPresentation.test.ts` (7 tests dédiés) | Fonctionnel/style : **PASS**. Visuel : **NON VÉRIFIABLE**. |
| **AA-09** | Conservation des comportements métier (validation conditionnelle, brouillon local, modale de sortie), aucun changement fonctionnel hors références actualisées | — | `ExerciseScreen.tsx` — logique (`isStep1Valid`, `patchLocal`, `handleExecutionModeChange`, `handleTerminer`, `finishingRef`/`isFinishing`) recopiée à l'identique | Tests « mode Répétitions », « mode modification », « modale d'abandon » (tous hérités, verts sans modification de leur logique) | **PASS**. |

## Correspondance point par point — Roulette (verrou de non-régression)

| Exigence | Preuve |
|---|---|
| Primitive OS native inchangée | Aucune ligne de `DurationWheelPicker.tsx` modifiée — vérifié par `git diff --stat` (absent du diff) et par le test « no line of DurationWheelPicker's own rendering is duplicated or reimplemented locally ». |
| Défilement fonctionnel | Test « draft vs committed value (D-06) » : `fireNativeSelectionChange` accepté, valeur affichée inchangée tant que non validée. |
| Deux cadres gris — désormais documentés | Non retouchés ; qualifiés de limite native acceptée par l'autorisation elle-même (clôture de l'escalade REWORK08). |
| Brouillon jusqu'à confirmation | « draft vs committed value (D-06) » (ci-dessus). |
| Annuler restaure la valeur précédente | Test « Annuler restores the previously committed value… » : valeur par défaut `00 min 30 s` confirmée restaurée, jamais le brouillon `02 min 30 s`. |
| Confirmer enregistre la valeur | Test « Valider applies the drafted value… » : `02 min 30 s` bien affiché après Validation. |
| Boutons canoniques existants | `PickerToolbar` (icônes `wheel-action-cancel`/`wheel-action-validate`, REWORK07B) non modifié — même composant, même rendu. |
| Adaptation d'ancrage uniquement | Un unique `PopoverAnchor`, commun aux quatre sélecteurs de la rangée compacte (remplace trois ancres verticales séparées, structurellement incompatibles avec la nouvelle rangée horizontale) — vérifié directement sur `1992:9430` : le popover ouvert est centré sous le cadre `354` de la rangée compacte, jamais sous une seule colonne. Aucune ligne de rendu interne du composant lui-même modifiée. |

## Correspondance point par point — Corrections connexes Composition

| ID | Demande | Fichier/code | Test | Verdict |
|---|---|---|---|---|
| **CO-01** | Champ Nom de la séance conforme à `Session / Name Field — Source exact` (fond transparent, liseré blanc `1pt`, token `color/session-name-border`) | `tokens.ts` — `colors.sessionNameBorder` ; `CompositionScreen.tsx` — `styles.nameColorField` | « REWORK09 — supersedes CMP-02's opaque white field… » | Fonctionnel/style : **PASS**. Visuel : **NON VÉRIFIABLE**. |
| **CO-02** | Suppression de la ligne de synthèse basse `0 activité · 0 min` | `CompositionScreen.tsx` — `bottomAction` (Text + style `summary` retirés) | « REWORK09 — supersedes CMP-06… » + 3 tests ajustés (comptage `getAllByText`) | **PASS** (absence positivement vérifiée, synthèse Tour confirmée toujours présente). |
| **CO-03** | Aucun autre élément déjà validé de Composition modifié | — | Suite complète `CompositionScreen.test.tsx` (69 tests, tous verts sans autre modification requise) | **PASS**. |

## Écarts documentaires disclosés (non inventés, décisions explicites)

- **Titre « Paramètres de l'activité » — couleur `#14141a`** : la source Figma de ce troisième titre diffère d'un seul pas hexadécimal de `colors.textPrimary` (`#141414`), utilisé par les deux autres titres identiques en rôle (`Nom de l'activité`, `Type d'activité`, tous deux exactement `#141414`). Traité comme un bruit d'export Figma plutôt qu'une décision de design distincte (aucune règle DSF ne documente une troisième nuance de texte primaire) — `colors.textPrimary` réutilisé uniformément pour les quatre titres. Décision explicite, pas un `À CLARIFIER` : l'écart est sous le seuil de perceptibilité et aucune règle contradictoire ne s'applique.
- **Ligne de valeur de texte du champ Nom** : Figma documente `13px` Regular pour le texte affiché dans `Forms / Text Field — Source exact`, sans hauteur de ligne explicite (« leading: normal »). `type.exerciseFieldValue` (nouveau token, `13/18`) interpole une hauteur de ligne raisonnable entre les tokens existants les plus proches (`caption` `11/14`, `label`/`body` `14/18`…`20`) — estimation raisonnée, signalée comme telle dans le code, pas une valeur Figma exacte.
- **Libellé de colonne compact (« Durée »/« Pause »/« Séries »/« Répétitions »), `15px` Semi Bold** : même situation — hauteur de ligne `18` reprise de la hauteur réelle mesurée du nœud texte Figma (`18`), pas d'une valeur de ligne explicitement documentée par ailleurs.
- **Ambiguïté d'accessibilité pré-existante découverte (non introduite)** : `strings.screens.exercise.validateAction` (action principale de l'étape 1) et `strings.screens.exercise.wheelPicker.validateAccessibilityLabel` (bouton Valider du toolbar de la roulette) portent tous deux le libellé accessible « Valider » — lorsque le sélecteur est ouvert, deux boutons distincts partagent le même nom accessible. Ce défaut existait avant ce cycle (mêmes chaînes, non modifiées ici) mais n'était jamais exercé par un test interrogeant les deux simultanément ; mes nouveaux tests l'ont révélé et ont été adaptés (`within(popoverAnchor)`) pour lever l'ambiguïté **côté test uniquement**, sans toucher au code applicatif — hors périmètre explicite des 9 corrections demandées. **Signalé ici pour arbitrage futur, pas corrigé silencieusement ni laissé non consigné.**

Aucune contradiction Figma/DSF/documentation bloquante n'a été rencontrée nécessitant un arrêt `À CLARIFIER`.

## Tests et preuves

### Commandes exécutées et résultats

```
npx tsc --noEmit
→ sortie vide, code de sortie 0

npx eslint .
→ sortie vide, code de sortie 0

npx jest src/features/sessions/__tests__/ExerciseScreen.test.tsx --maxWorkers=2
→ Test Suites: 1 passed, 1 total
→ Tests:       36 passed, 36 total

npx jest --maxWorkers=2   (suite complète du projet)
→ Test Suites: 37 passed, 37 total
→ Tests:       516 passed, 516 total
```

### Correspondance avec les 13 exigences de test de l'autorisation

| # | Exigence | Couverture |
|---|---|---|
| 1 | Utilisation du header partagé | `ExerciseScreen.test.tsx` — describe « Shell partagé » |
| 2 | Ordre exact des champs | describe « ordre exact du formulaire » |
| 3 | Présence visible des deux titres de segments | « shows both segmented-control titles VISIBLY » |
| 4 | États et couleurs des segments | « colours the selected segment… » + « centers segment labels… » |
| 5 | Rangée unique des trois paramètres | describe « Rangée compacte » |
| 6 | Anatomie des trois contrôles et chevrons | « gives Durée and Pause a 124pt-wide column… » + « gives every parameter control the canonical 28×28 chevron square… » |
| 7 | Récapitulatif calculé | describe « cadre récapitulatif calculé » + `compositionPresentation.test.ts` |
| 8 | En-tête/action fixes, formulaire central défilant | « exactly one scrollable container exists for the whole screen… » |
| 9 | Fonctionnement des sélections | describe « sélections et ancrage du popover unique » (5 tests) |
| 10 | Absence de modification avant confirmation (durées) | « draft vs committed value (D-06)… » |
| 11 | Restauration après Annuler | « Annuler restores the previously committed value… » |
| 12 | Transparence/liseré du champ Nom de séance | `CompositionScreen.test.tsx` — CO-01 |
| 13 | Disparition de la synthèse basse Composition | `CompositionScreen.test.tsx` — CO-02 |
| — | Absence de régression des tests existants | Suite complète : 516/516 verts |

### Limites des tests (`G-02`, explicite)

Ces tests prouvent la structure/les valeurs de style/le comportement d'interaction JS, jamais le rendu pixel réel ni le geste tactile sur iPhone. Pour chaque ID `AA-0x`/`CO-0x` ci-dessus, la dimension **Visuel/Device** reste **NON VÉRIFIABLE** dans cet environnement, conformément à `G-05` — aucun de ces IDs ne peut être déclaré `DONE`/`CONFORME` avant contre-recette iPhone. `G-04` (captures avant/après normalisées `402×874`) n'a pas pu être produit — aucun outil de capture d'écran ou de simulateur n'est disponible dans cet environnement ; seules des preuves de code/style ont pu être produites.

## Fichiers modifiés

| Fichier | +/- |
|---|---|
| `assets/icons/manifest.json` | +2 / -1 |
| `src/features/sessions/CompositionScreen.tsx` | +29 / -17 |
| `src/features/sessions/ExerciseScreen.tsx` | +417 / -299 |
| `src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx` | +3 / -4 |
| `src/features/sessions/__tests__/CompositionScreen.test.tsx` | +21 / -17 |
| `src/features/sessions/__tests__/ExerciseScreen.test.tsx` | +415 / -74 |
| `src/features/sessions/__tests__/compositionPresentation.test.ts` | +103 / -0 |
| `src/features/sessions/compositionPresentation.ts` | +59 / -0 |
| `src/shared/i18n/index.test.ts` | +20 / -3 |
| `src/shared/i18n/resources/fr.ts` | +32 / -3 |
| `src/shared/ui/KodjoIcon.tsx` | +11 / -0 |
| `src/shared/ui/tokens.ts` | +89 / -0 |
| `assets/icons/select-field-chevron.svg` | nouveau, actif canonique (octets exacts de l'export Figma, fond de cadre exclu — même convention que tous les autres actifs du dépôt) |

## Éléments non corrigés ou hors périmètre

- Étape 2 (`Informations complémentaires`, CE-T01-15) : non modifiée, hors périmètre explicite.
- Double libellé accessible « Valider » (voir « Écarts documentaires disclosés ») : signalé, non corrigé côté application (hors des 9 corrections demandées).
- `Controls / Repetition Pull-down` du contrôle Tour (Composition) : asset canonique déjà préparé par la mission de design (`control-repetition-pull-down.svg`) mais son intégration code reste `NON CONFORME connu`, explicitement non traitée par ce cycle — hors périmètre (contrainte explicite « ne pas modifier un autre élément déjà validé de Composition »).

## Vérifications restant à effectuer sur appareil réel

- Confirmation visuelle complète de l'écran reconstruit (header, ordre des champs, segments, rangée compacte, chevrons, récapitulatif) contre les nœuds Figma actuels.
- Confirmation que le geste réel (toucher/faire défiler chacun des quatre sélecteurs de la rangée compacte) fonctionne sans fermeture prématurée — le mécanisme corrigé (backdrop dédié + élévation du `ScrollView`) est un fait de code vérifiable statiquement, sa correspondance exacte avec le geste réel reste `NON VÉRIFIABLE` sans device.
- Confirmation de la transparence/liseré du champ Nom de séance sur la bande Context colorée réelle.
- Confirmation que la disparition de la synthèse basse ne laisse pas d'espace vide perceptible dans la zone d'action basse de Composition.

## Modifications réalisées

Voir les tableaux de correspondance point par point ci-dessus pour le détail exhaustif par identifiant.

## État Git

- Branche : `feat/creation-seance-catalogue`
- HEAD avant ce cycle : `bc16a6d52abfd74901ee8f6a6d6aa1098e437ac6`
- Ce rapport sera committé séparément du commit de code applicatif, conformément à l'exigence de livraison documentaire (`CLAUDE.md`).

### SHA finaux (renseignés après commit)

- **SHA applicatif** : `895de9f2f19a129d19a6aa8d4734a7a526b9646d` (`feat(T01-S08): REWORK09 — reconstruction de l'écran Ajouter une activité`).
- **SHA rapport** : voir commit `docs(orchestration): ...` immédiatement suivant, contenant ce fichier — renseigné dans le commentaire de transition GitHub.
- **État Git final** : `working tree clean`, branche `feat/creation-seance-catalogue`, HEAD local = HEAD distant après push (vérifié post-commit).

## Statut de clôture

`IMPLEMENTED_AWAITING_DEVICE_VERIFICATION` (`G-05`) — les 9 corrections de l'écran, le verrou de non-régression de la roulette et les 2 corrections connexes Composition sont intégralement implémentés, testés (`tsc`/`eslint`/Jest complet, 37 suites/516 tests) et documentés point par point ; seule la comparaison visuelle/tactile réelle (`G-06`) reste à effectuer par contre-recette iPhone.

## Self-check Claude

- Préconditions `G-08` vérifiées avant tout code (`git pull --ff-only`, HEAD identifié, worktree propre).
- Chaque correction est rattachée explicitement à un ID (`AA-01`…`AA-09`, `CO-01`…`CO-03`) — aucune modification non classée.
- Les nodes Figma actuels ont été contrôlés directement (outil MCP), pas une ancienne capture ni l'implémentation précédente — dimensions/couleurs exactes extraites et vérifiées, pas approximées.
- Aucune ligne de `DurationWheelPicker.tsx` modifiée ; le seul mécanisme adjacent modifié (fermeture par backdrop) est explicitement justifié comme indispensable et distinct de la roulette elle-même.
- L'ambiguïté d'accessibilité « Valider » découverte en cours de test est explicitement signalée, pas silencieusement contournée dans le code applicatif.
- `tsc --noEmit`, `eslint .` et la suite Jest complète (37 suites, 516 tests) sont verts au moment de la rédaction de ce rapport.
