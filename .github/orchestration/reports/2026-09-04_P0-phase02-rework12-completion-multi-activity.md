# P0 — Phase 2 — REWORK12, complétion — Nouveau shell Activité + plusieurs Activités

## Identification

- **Mission** : terminer REWORK12 à partir des références Figma et documentaires mises à jour depuis la précédente livraison partielle — nouveau shell des écrans Activité (titre fonctionnel, zone bleue contextuelle), synthèse reformulée, icône Tour corrigée définitivement, et transformation explicitement autorisée du brouillon `exercise` unique vers une collection `exercises` ordonnée.
- **Issue** : [#35](https://github.com/MyUncried/Application-Routine/issues/35)
- **Autorisation** : message utilisateur direct « Applique impérativement le protocole KODJO actif, notamment G-01 à G-08... Objectif : terminer REWORK12 à partir des références Figma et documentaires désormais mises à jour... », 2026-09-04, faisant explicitement suite à trois commits de design (`e35f837`, `890b1e7`, `44d6f11`) publiés entre le rapport REWORK12 précédent et ce message.

## Branche et commit de départ

- Branche : `feat/creation-seance-catalogue`
- Préconditions vérifiées avant tout code :
  - `git fetch` → HEAD local et distant identiques : `44d6f117025ab7523cca1cad235f95f4b236ead4`.
  - `git status --porcelain` : vide.
  - `git log 4fc63d6..44d6f11 --oneline` : trois commits `docs(design)` lus intégralement avant tout code (`e35f837` aligner les écrans Activité/contexte/synthèse ; `890b1e7` canonicaliser l'icône Tour ; `44d6f11` fixer le contexte Activité en 14/17 et spacing/16).

## Périmètre demandé

Sept groupes de changements numérotés (1 à 7) plus la liste d'acquis gelés et les tests obligatoires, définis intégralement par le message d'autorisation.

## Consultation directe des sources (préalable obligatoire)

Conformément à « Le rapport REWORK12 précédent et le code actuel ne constituent pas des preuves de conformité », chaque exigence a été revérifiée **directement** via l'outil MCP Figma avant tout code — jamais sur mon propre rapport précédent :

- `1992:9132` (CE-T01-13, Durée) et `1992:9212` (Répétitions) : structure complète de la nouvelle « Zone bleue — Contexte séance et nom de l'activité » (`3261:4151`/`3261:4160`), du corps reformulé, et du récapitulatif ancré en bas.
- `1992:9292` (CE-T01-15, Informations complémentaires) : confirmation qu'aucune zone bleue n'y apparaît (absente de cette étape), en-tête canonique seul.
- Texte exact des synthèses calculées (`3261:4157`/`3261:4166`) — mode Durée et mode Répétition, toutes deux avec `seriesCount=3`.
- `assets/icons/manifest.json`/`assets/icons/icon-tour.svg` (déjà mis à jour par le commit `890b1e7`) : confirmation que `icon.tour` est l'unique entrée pour cette icône, `composition.mainContent` n'existe plus.

### Point 3 — confirmation explicite

Chaque en-tête fixe des frames Activité contrôlées (`1992:9132`, `1992:9212`, `1992:9292`) ne contient plus qu'une seule instance canonique (`En-tête fixe — titre et démarcation`) — aucune n'embarque plus le nom de la Séance ni aucun élément de contexte : confirmé directement, condition préalable à tout code satisfaite.

## Résolution d'une contradiction interne : typographie du contexte

Le corps du message d'autorisation (point 2) indique `Séance · {nom}` en « `KODJO / Body`, `14/20 Regular` ». Le commit de correction dédié le plus récent (`44d6f11`, « fixer le contexte Activité en 14/17 »islocalement plus spécifique et explicitement daté après la rédaction du point 2) documente **14/17**, avec le contrôle direct suivant sur `3261:4152` : `Inter Regular`, hauteur de ligne `17`. Le même commit précise explicitement : « La synthèse d'Activité reste en `14/20` : elle constitue un usage distinct et n'est pas concernée par la correction. » — confirmant que le récapitulatif (pas le contexte) est bien `14/20`.

**Résolution** : `14/17` appliqué au contexte (nouveau token `type.contextLine`), `14/20` (`type.body`, déjà existant) conservé pour le récapitulatif — cohérent avec la source la plus fraîche et la plus spécifiquement vérifiée, jamais une invention. Disclosé ici plutôt que silencieusement tranché.

## Tableau PRESERVE / CHANGE / FORBIDDEN (avant code)

| Élément | Statut | Preuve |
|---|---|---|
| Dialogues d'abandon (Séance REWORK10, Activité REWORK11) | **PRESERVE** | `git diff --stat` : `AbandonCreationModal.tsx`/`ExerciseExitConfirmModal.tsx`/`DecisionDialog.tsx` absents du diff. |
| Roulette Durée native (`DurationWheelPicker.tsx`) | **PRESERVE, strictement inchangée** | Absente du diff. |
| Roulettes numériques natives (`NumberWheelPicker.tsx`) | **PRESERVE** | Absente du diff — seul son câblage dans `ExerciseScreen.tsx` (déjà réalisé au cycle précédent) est repris tel quel. |
| Cartes Compte à rebours/Fin de séance (`BoundaryActivityRow`, callers Composition) | **PRESERVE** | Aucune ligne touchée hors généralisation déjà actée au cycle précédent (`icon` nullable). |
| Section Tour hors icône | **PRESERVE** | `tourSectionContainer`/`tourCardControl`/`tourCardTextBlock` non touchés — seule la ligne `KodjoIcon name=...` change. |
| Contrôle du nombre de tours | **PRESERVE** | Non touché. |
| Champ Nom de la séance (Composition) | **PRESERVE** | `nameColorField`/`nameInput` (Composition) non touchés — seul le champ Nom de l'**Activité** (Exercice) change, sur une autorisation distincte. |
| Fixité des zones validées, Catalogue, navigation basse | **PRESERVE** | Aucun fichier concerné dans le diff. |
| Absence de synthèse globale en bas de Composition | **PRESERVE** | Confirmé inchangé (déjà retiré depuis REWORK09). |
| Shell/titre/contexte de l'écran Activité | **CHANGE** | `ExerciseScreen.tsx` reconstruit (points 1-2). |
| Synthèse calculée de l'Activité | **CHANGE** | `compositionPresentation.ts`, `formatExerciseRecap` reformulée (point 5, ACT-08/09 enfin résolus). |
| Icône du bloc Tour | **CHANGE (correction définitive)** | `icon-tour` restauré, `composition-main-content` retiré (point 6). |
| Modèle `SessionDraft.exercise` | **CHANGE, explicitement autorisé** | `exercise: SessionDraftExercise \| null` → `exercises: readonly SessionDraftExercise[]` (point 7). |
| Bouton `Ajouter une activité` | **CHANGE** | Toujours visible désormais (point 7, abroge COMP-03 précédent). |

**Fichiers réellement modifiés** (confirmé par `git diff --stat`) : `src/domain/sessions/SessionDraft.ts`, `src/features/sessions/CompositionScreen.tsx`, `src/features/sessions/ExerciseScreen.tsx`, `src/features/sessions/compositionPresentation.ts`, `src/shared/i18n/resources/fr.ts`, `src/shared/ui/KodjoIcon.tsx`, `src/shared/ui/tokens.ts`, `assets/icons/composition-main-content.svg` (supprimé), et les tests correspondants. Aucun autre fichier.

## Correspondance point par point

### 1 — Nouveau shell des écrans Activité

| Réf. | État avant | Correction | Test | Résultat | Verdict |
|---|---|---|---|---|---|
| Titre fonctionnel | Nom de la Séance (REWORK09) | `t.titleAdd`/`t.titleEdit` (étape 1), `t.titleInformation` (étape 2, CE-T01-15) réintroduits avec un sens fonctionnel | `ExerciseScreen.test.tsx`, describe « Shell partagé » + « étape 2 » | PASS | **CONFORME** |
| En-tête canonique + séparateur + safe area | Déjà le Shell partagé | Inchangé (réutilisé) | héritée | PASS | **CONFORME** |
| Zone bleue immédiatement sous l'en-tête | Absente | `exercise-context-band`, fixe, sibling du `ScrollView`, visible étape 1 seulement | `ExerciseScreen.test.tsx` | PASS | **CONFORME** |
| En-tête/action finale fixes, formulaire défilant | Déjà conforme | Inchangé | héritée | PASS | **CONFORME** |

### 2 — Zone bleue contextuelle

| Réf. | État avant | Correction | Test | Résultat | Verdict |
|---|---|---|---|---|---|
| `Séance · {nom}`, 14/17 Regular | Absent | Nouveau token `type.contextLine` (14/17, vérifié `3261:4152`), composé `${t.context.prefix} · ${draft.name}` | `ExerciseScreen.test.tsx` | PASS | **CONFORME** (écart de typographie avec le point 2 littéral disclosé et résolu ci-dessus) |
| Champ Nom 354×46, transparent, liseré blanc, 18/22 Semi Bold | Champ blanc opaque, liseré `exerciseFieldBorder`, 13px Regular (hors bandeau) | `dimensions.exerciseTextField` réutilisée telle quelle (46/8/14, inchangée) ; fond `transparent`, bordure `colors.sessionNameBorder` (réutilisation du token Composition), texte `type.modalTitle` (18/22 SemiBold, déjà existant) | `ExerciseScreen.test.tsx` | PASS | **CONFORME** |

### 3 — Formulaire

Ordre Type → Mode → Paramètres, titres 16px Semi Bold, couleurs segmentées DSF, rangée de paramètres et déclencheurs canoniques : tous **déjà conformes** depuis REWORK09/REWORK12 (première partie), revérifiés directement sur `1992:9147` (via `3261:4155`, « Contenu du formulaire ») — aucune ligne modifiée.

### 4 — Sélecteurs numériques

`DurationWheelPicker.tsx` et `NumberWheelPicker.tsx` : **aucune ligne modifiée** (confirmé par `git diff --stat`). Contrat brouillon/Annuler/Confirmer, deux cadres gris séparés (Durée), défilement tactile natif, aucune fermeture au toucher : hérités, non retouchés.

### 5 — Synthèse de l'activité (ACT-08/ACT-09, enfin résolus)

| Réf. | État avant | Correction | Test | Résultat | Verdict |
|---|---|---|---|---|---|
| Suppression des préfixes type/mode | Présents (« Exercice · Mode X · ») | Retirés — `formatExerciseRecap` reformulée | `compositionPresentation.test.ts` | PASS | **CONFORME** |
| `{N} série(s) de {activité} de {durée}` (Durée) | Absent (mode/répétitions au lieu du nom) | Implémenté, `name` ajouté à `ExerciseRecapFacts` | idem | PASS | **CONFORME** |
| `{N} série(s) de {X} {activité}` (Répétitions) | Absent | Implémenté | idem | PASS | **CONFORME** |
| `, avec {pause} de pause` si non nulle | Toujours présent avec suffixe fixe | `recap.pauseLabel` (« de pause ») toujours appliqué si `pauseSeconds > 0` | idem | PASS | **CONFORME** |
| `entre les séries` uniquement si `N > 1` | Toujours présent | `recap.pauseSuffix` (« entre les séries ») conditionné à `seriesCount > 1` | idem | PASS | **CONFORME** |
| Style `KODJO / Body` | Déjà `type.body` | Inchangé | idem | PASS | **CONFORME** |

Vérifié directement sur `3261:4157` (Durée, `"3 séries de squat sautés de 1 min 30 s, avec 15 s de pause entre les séries."`) et `3261:4166` (Répétitions, `"3 séries de 12 squat sautés, avec 15 s de pause entre les séries."`) — les deux exemples Figma correspondent exactement à la sortie de la fonction reformulée (test dédié). Le cas singulier (`N=1`, jamais illustré sur Figma) suit la règle explicitement écrite dans la documentation mise à jour (`06 – Ecrans et navigation de la V1.md`).

### 6 — Composition — icône Tour (correction définitive)

| Réf. | État avant (rapport REWORK12 précédent) | Correction | Test | Résultat | Verdict |
|---|---|---|---|---|---|
| Source canonique | `composition-main-content` (résolution technique du cycle précédent, disclosée comme divergente de la description littérale) | `icon-tour` restauré — le composant DSF `Icon / Tour` (`3066:4685`) a depuis été reconstruit par le commit `890b1e7` sur la géométrie validée, republié `18×18` | `CompositionScreen.test.tsx` | PASS | **CONFORME (définitif)** |
| Taille d'affichage | 18×18 (`composition-main-content`) | 18×18 (`icon-tour`, size mis à jour dans `KodjoIcon.tsx` de `20×20` à `18×18`) | idem | PASS | **CONFORME** |
| Trait `1,35`, couleur `color.textPrimary` | Porté par le SVG lui-même | Inchangé — `assets/icons/icon-tour.svg` (remplacé par le commit `890b1e7`) contient `stroke-width="1.35" stroke="#141414"`, vérifié directement | — (propriété de l'asset, non du code React) | — | **CONFORME (vérifié)** |
| `composition-main-content` retiré | Présent dans `KodjoIcon.tsx` (`sources`/`sizes`), physiquement sur disque | Entrée retirée de `KodjoIcon.tsx` ; fichier `assets/icons/composition-main-content.svg` supprimé (`git rm`) — plus aucune entrée de manifeste concurrente | `visualAssets.test.ts` (itère `manifest.json`, ne référence plus ce fichier) | PASS | **CONFORME** |

### 7 — Plusieurs activités et bouton persistant

| Réf. | État avant | Correction | Test | Résultat | Verdict |
|---|---|---|---|---|---|
| 1. Ajout d'une première activité | OK (modèle singulier) | `SessionDraft.exercises: readonly SessionDraftExercise[]`, `createExerciseDraft(id)` — `id` fourni par l'appelant (`Crypto.randomUUID()` dans `ExerciseScreen.tsx`, fonction pure du domaine inchangée) | `CompositionExerciseFlow.integration.test.tsx` (vrai navigateur) | PASS | **CONFORME** |
| 2. Retour avec la première conservée | N/A (modèle singulier) | `handleTerminer` ajoute (`[...draft.exercises, local]`) ou remplace par `id` — jamais un remplacement complet | `ExerciseScreen.test.tsx`, test dédié | PASS | **CONFORME** |
| 3. Bouton toujours visible | Masqué dès qu'une Activité existait | Condition `draft.exercise === null` retirée — toujours rendu | `CompositionScreen.test.tsx` | PASS | **CONFORME** |
| 4. Ajout d'une seconde sans écraser la première | Non représentable (modèle singulier) | `draft.exercises.map(...)`, chaque ligne avec son propre `key`/`testID` | `CompositionScreen.test.tsx` (test multi-activités dédié) + `ExerciseScreen.test.tsx` | PASS | **CONFORME** |
| 5. Ouverture/modification par identifiant | Route `/exercise` sans paramètre | `useLocalSearchParams<{exerciseId}>()` ; `router.push({pathname:"/exercise", params:{exerciseId}})` depuis Composition | `CompositionScreen.test.tsx` + `ExerciseScreen.test.tsx` | PASS | **CONFORME** |
| 6. Ordre stable | N/A | Ordre du tableau = ordre d'affichage, jamais retrié | `CompositionScreen.test.tsx` (ordre `ex-1` avant `ex-2`) | PASS | **CONFORME** |
| 7. Déplacement hors périmètre S08 | — | Poignée reste non interactive (`BoundaryActivityRow`, comportement hérité, non touché) | héritée | PASS | **CONFORME** |

**Limite disclosée** : `CreateSessionInput`/`Session` (`Session.ts`) modélisent toujours une seule Activité persistée (`cycle.tour.exercise`, jamais un tableau) — `toCreateSessionInput` ne valide/assemble donc que `draft.exercises[0]`. Cette fonction n'est invoquée par aucun parcours réellement câblé en T01-S08 (`Continuer`/`Enregistrer` restent désactivés dans `CompositionScreen.tsx`), donc sans régression observable pour l'utilisateur de cette tranche — disclosé, testé explicitement (`SessionDraft.test.ts`), non silencieusement ignoré.

## Acquis gelés — vérification finale

| Acquis | Vérifié inchangé |
|---|---|
| Dialogues d'abandon Séance/Activité | ✅ (fichiers absents du diff) |
| Roulette Durée validée | ✅ (fichier absent du diff) |
| Roulettes numériques natives | ✅ (fichier absent du diff) |
| Cartes Compte à rebours/Fin de séance | ✅ (styles/comportement non touchés) |
| Section Tour hors icône | ✅ (seule la ligne icône change) |
| Contrôle du nombre de tours | ✅ |
| Champ Nom de la séance (Composition) | ✅ |
| Fixité des zones validées | ✅ |
| Catalogue et navigation basse | ✅ (hors périmètre, aucun fichier touché) |
| Absence de synthèse globale en bas | ✅ |

## Tests obligatoires — correspondance

| Exigence | Test |
|---|---|
| Création Durée | `ExerciseScreen.test.tsx`, describe « mode modification » (mode Durée déjà couvert par les tests hérités) |
| Création Répétitions | `ExerciseScreen.test.tsx`, « ACT-10 — end-to-end Répétition mode » |
| Modification d'une activité existante | `ExerciseScreen.test.tsx`, « Terminer calls updateDraft... replacing the edited Activity by id » |
| Formulations singulier/pluriel, avec/sans pause | `compositionPresentation.test.ts`, describe « formatExerciseRecap (reformulé) », 10 tests dédiés |
| Nouveau titre et contexte de séance | `ExerciseScreen.test.tsx`, describe « Shell partagé » (titre) + « Champ Nom de l'activité » (bandeau) |
| Persistance de deux activités distinctes | `CompositionScreen.test.tsx`, « Plusieurs activités » ; `ExerciseScreen.test.tsx`, « Terminer on a NEW Activity... appends... never replacing » |
| Bouton Ajouter toujours disponible | `CompositionScreen.test.tsx`, COMP-03 ; `CompositionExerciseFlow.integration.test.tsx` (vrai navigateur) |
| Source exacte de l'icône Tour | `CompositionScreen.test.tsx`, R4-11 + COMP-02 |
| Non-régression roulettes/dialogues | Fichiers non modifiés (`DurationWheelPicker.tsx`, `NumberWheelPicker.tsx`, `AbandonCreationModal.tsx`, `ExerciseExitConfirmModal.tsx`) + suites correspondantes vertes sans modification |
| TypeScript/ESLint/Jest complet | Voir ci-dessous |

## Tests et preuves

### Commandes exécutées et résultats

```
npx tsc --noEmit
→ sortie vide, code de sortie 0

npx eslint .
→ sortie vide, code de sortie 0

npx jest --maxWorkers=2   (suite complète du projet)
→ Test Suites: 37 passed, 37 total
→ Tests:       573 passed, 573 total
```

### Non-régression explicite

- `DurationWheelPicker.tsx`/`.test.tsx`, `NumberWheelPicker.tsx`/`.test.tsx` : fichiers **non modifiés**, suites vertes.
- `AbandonCreationModal.test.tsx`, `ExerciseExitConfirmModal.test.tsx` : fichiers **non modifiés**, verts.
- `CompositionNavigationGuard.integration.test.tsx`, `ExerciseNavigationGuard.integration.test.tsx` (mécanisme de garde réel, vrai navigateur) : verts.
- `CompositionExerciseFlow.integration.test.tsx` (parcours complet, vraies routes `app/(creation)/*`, vrai `SessionDraftProvider`, id généré par le vrai `Crypto.randomUUID()`) : 4/4 verts.

### Limite technique observée, non bloquante

Un avertissement React (« Each child in a list should have a unique "key" prop ») a été observé pendant `CompositionExerciseFlow.integration.test.tsx` (test #2), sans faire échouer aucune assertion (ce fichier ne vérifie pas `console.error`). Investigation : le seul `.map()` introduit par cette mission (`draft.exercises.map(...)`, `CompositionScreen.tsx`) porte explicitement `key={exercise.id}` ; le seul autre `.map()` du périmètre (`BodyZoneSelector.tsx`, non modifié) porte déjà `key={zone.id}`. L'origine de cet avertissement n'a donc pas pu être rattachée à une ligne modifiée par cette mission — probablement interne au rendu de transition de `expo-router`/`react-navigation` dans l'environnement `react-test-renderer`. Non résolu, disclosé comme limite technique observée plutôt que silencieusement ignoré.

## Fichiers modifiés

| Fichier | +/- |
|---|---|
| `src/domain/sessions/SessionDraft.ts` | +98/-22 (collection `exercises`, `id` obligatoire) |
| `src/features/sessions/CompositionScreen.tsx` | +73/-52 (bouton persistant, liste d'Activités, icône Tour) |
| `src/features/sessions/ExerciseScreen.tsx` | +186/-61 (shell, bandeau contextuel, id-based create/edit) |
| `src/features/sessions/compositionPresentation.ts` | +65/-58 (`formatCompositionSummary` multi-Activités, `formatExerciseRecap` reformulée) |
| `src/shared/i18n/resources/fr.ts` | +41/-8 (titres fonctionnels, contexte, recap) |
| `src/shared/ui/KodjoIcon.tsx` | +15/-3 (icon-tour 18×18, composition-main-content retiré) |
| `src/shared/ui/tokens.ts` | +29/-6 (`type.contextLine`, `colors.exerciseContextBandBackground`, `dimensions.exerciseContextBand`) |
| `assets/icons/composition-main-content.svg` | supprimé |
| `src/domain/sessions/__tests__/SessionDraft.test.ts` | +136/-56 |
| `src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx` | +24/-7 |
| `src/features/sessions/__tests__/CompositionScreen.test.tsx` | +87/-33 |
| `src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx` | +2/-2 |
| `src/features/sessions/__tests__/ExerciseScreen.test.tsx` | +153/-78 |
| `src/features/sessions/__tests__/SessionDraftProvider.test.tsx` | +1/-1 |
| `src/features/sessions/__tests__/SessionService.test.ts` | +4/-4 |
| `src/features/sessions/__tests__/compositionPresentation.test.ts` | +208/-84 |
| `src/shared/i18n/index.test.ts` | +17/-4 |

Total (`git diff --numstat`) : 16 fichiers modifiés + 1 supprimé, 1139 insertions / 479 suppressions.

## Éléments non corrigés ou hors périmètre

- Persistance réelle de plusieurs Activités dans `Session`/SQLite (`toCreateSessionInput` limité à la première) : hors périmètre, disclosé, T01-S08 ne câble de toute façon aucun parcours d'enregistrement réel.
- Réorganisation réelle (glisser-déposer) des Activités : explicitement hors périmètre S08, réservée à S09 par l'autorisation elle-même.

## Vérifications restant à effectuer sur appareil réel

- Rendu visuel exact de la nouvelle zone bleue contextuelle (couleur `#F7F7FF`, typographie 14/17 du contexte, 18/22 du champ Nom).
- Rendu de l'icône Tour reconstruite (`icon-tour.svg`, nouvel export, `18×18`).
- Comportement tactile réel de l'ajout d'une seconde Activité (bouton persistant, ouverture/fermeture, absence de perte de la première).
- Lisibilité/troncature du récapitulatif reformulé avec un nom d'Activité long.

## Hypothèses non démontrées

- La distinction 14/17 (contexte) vs 14/20 (récapitulatif) — bien que directement vérifiée sur deux nœuds Figma distincts et documentée par un commit de correction dédié — n'a pas été recontrôlée sur device dans ce cycle.
- `Crypto.randomUUID()` (génération d'identifiant réel à la création d'une Activité) n'a été exercée que dans l'environnement Jest (`CompositionExerciseFlow.integration.test.tsx`) — jamais sur un appareil réel dans ce cycle.

## État Git

- Branche : `feat/creation-seance-catalogue`
- HEAD avant ce cycle : `44d6f117025ab7523cca1cad235f95f4b236ead4`
- Ce rapport est committé séparément du commit de code applicatif.

### SHA finaux

- **SHA applicatif** : `c311526` (« fix(T01-S08/REWORK12-bis): shell Activite + plusieurs Activites + icone Tour definitive », 17 fichiers, 1139 insertions / 480 suppressions).
- **SHA rapport** : renseigné dans le commentaire de transition GitHub (commit `docs(orchestration): ...` immédiatement suivant).
- **État Git final** : `working tree clean`, branche `feat/creation-seance-catalogue`, HEAD local = HEAD distant après push.

## Statut de clôture

**`REWORK12_COMPLETION_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`**

Les sept groupes de changements (shell, bandeau contextuel, formulaire, sélecteurs numériques, synthèse reformulée, icône Tour définitive, plusieurs Activités) sont intégralement implémentés et vérifiés directement contre les sources Figma/documentaires mises à jour. `tsc`/`eslint`/Jest complet (37 suites, 573 tests) sont verts. Un test technique vert ne prouve pas le rendu visuel ou tactile sur iPhone — arrêt obligatoire après cette livraison, en attente de la contre-recette device, conformément à l'autorisation.

## Self-check Claude

- Les trois commits de design publiés depuis mon dernier checkpoint ont été lus intégralement avant tout code.
- Chaque exigence a été vérifiée directement sur les nœuds Figma actuels (`1992:9132`/`1992:9212`/`1992:9292`/`3261:41xx`), jamais sur mon propre rapport précédent ni sur l'implémentation existante.
- La contradiction interne entre le point 2 littéral (14/20) et le commit de correction dédié (14/17) a été détectée, disclosée et résolue en faveur de la source la plus fraîche et la plus spécifiquement vérifiée — jamais silencieusement tranchée.
- Les acquis gelés (dialogues, roulettes natives, cartes limites, contrôle Tour, Nom de la séance, Catalogue/navigation) sont confirmés inchangés par `git diff --stat` — aucun fichier correspondant dans le diff.
- `tsc --noEmit`, `eslint .` et la suite Jest complète (37 suites, 573 tests) sont verts au moment de la rédaction de ce rapport.
