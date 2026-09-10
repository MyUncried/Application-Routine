# P0 — Phase 2 — REWORK11 — Dialogue d'abandon d'une Activité

## Identification

- **Mission** : corriger uniquement le dialogue ouvert lorsqu'un utilisateur tente de quitter un écran Activité contenant des modifications locales non enregistrées (CE-T01-16).
- **Issue** : [#35](https://github.com/MyUncried/Application-Routine/issues/35)
- **Autorisation** : `[ChatGPT] CHANGES_REQUESTED — REWORK11 — dialogue d'abandon d'une Activité`, 2026-09-04T14:34:47Z (48ᵉ et dernier commentaire de l'Issue #35 au moment de cette clôture — seul commentaire publié depuis mon dernier checkpoint).

## Branche et commit de départ

- Branche : `feat/creation-seance-catalogue`
- Préconditions vérifiées avant tout code :
  - `git fetch` → HEAD local et distant identiques à la baseline exigée : `0bcc1e7066e61a0e2a73a336c10fb54a02cb29cb`.
  - `git status --porcelain` : vide (worktree propre).
- Dernier checkpoint identifié : commit `0bcc1e7` (« docs(design): canonicaliser la modale d'abandon d'activité »), contenant deux rapports lus intégralement avant tout code :
  - `.github/orchestration/reports/2026-09-04_activity-abandon-dialog-canonicalization.md` — pertinent, périmètre de ce cycle.
  - `.github/orchestration/reports/2026-09-04_numeric-wheel-generalization.md` — **hors périmètre de REWORK11** (généralisation de la roulette numérique, `NumberWheelPicker.tsx` non mentionné par l'autorisation, statut `READY_FOR_IMPLEMENTATION_REVIEW` non encore réautorisé) — lu pour information, **aucune ligne de code y afférente modifiée**.

## Périmètre demandé

Défini intégralement par le commentaire d'autorisation (texte complet relu et archivé) : 9 exigences de résultat visuel, 6 exigences de comportement, réutilisation canonique obligatoire (extraction d'un composant partagé `DecisionDialog` autorisée sous 4 conditions explicites), acquis gelés, et 12 exigences de test.

## Sources consultées avant code

- Décision `D-094` révisée, contrat `CE-T01-16` (`docs/Specifications-fonctionnelles/13 – Contrats d'écran.md`).
- Composant Figma `Overlay / Decision Dialog` (`2590:2961`), variante `PrimaryTone=Danger,SecondaryTone=Neutral,Actions=2` (`2590:2934`) — **contrôlée directement via l'outil Figma MCP**, pas sur le rapport précédent ni l'implémentation existante :
  - `3224:4082` (frame CE-T01-16 complète) — instance concrète exacte `3224:4140` du dialogue d'abandon d'Activité.
- Dialogue d'abandon de création de séance (REWORK10, `2591:3083`) — implémentation code existante prise comme référence canonique à réutiliser, conformément à l'autorisation.

## Tableau PRESERVE / CHANGE / FORBIDDEN (avant code)

| Élément | Statut | Preuve |
|---|---|---|
| Dialogue d'abandon de création de séance (`AbandonCreationModal.tsx`), rendu et comportement | **PRESERVE, strictement inchangé** | Les 15 tests REWORK10 existants (`AbandonCreationModal.test.tsx`) passent **sans aucune modification de leurs assertions** après l'extraction — preuve directe, pas une déclaration. |
| Écran Activité hors dialogue, écran Composition, roulette native validée, section Tour, cartes, navigation, boutons d'action | **PRESERVE** | Aucun de ces fichiers dans le diff (`git diff --stat` : 6 fichiers, tous strictement liés aux deux dialogues). |
| Logique d'enregistrement de l'Activité hors garde de sortie | **PRESERVE** | `useCompositionExitGuard.ts`, `ExerciseScreen.tsx` (logique) non modifiés — seul le composant de présentation `ExerciseExitConfirmModal.tsx` change. |
| Libellés `ExerciseExitConfirmModal` (« Continuer la modification »/« Abandonner ») | **CHANGE** | → « Annuler »/« Confirmer » (mêmes clés `continueEditing`/`abandon`). |
| Géométrie/comportement communs des deux dialogues | **CHANGE (factorisation)** | Extraits dans un nouveau composant partagé `DecisionDialog.tsx`, consommé par les deux modales — plus aucune duplication locale des dimensions/couleurs/espacements communs. |
| Typographie du dialogue Activité (taille/graisse des libellés, couleur/alignement du message, présence du liseré destructif) | **CHANGE, propre à ce contexte** | Vérifiée distincte de celle du dialogue Séance directement sur l'instance Figma `3224:4140` — voir « Écarts disclosés » ci-dessous. |

**Fichiers prévus, annoncés avant code** : `src/features/sessions/DecisionDialog.tsx` (nouveau, composant partagé) ; `src/features/sessions/AbandonCreationModal.tsx` (refactorisé pour consommer `DecisionDialog`) ; `src/features/sessions/ExerciseExitConfirmModal.tsx` (reconstruit depuis `DecisionDialog`) ; `src/shared/i18n/resources/fr.ts` (libellés) ; tests correspondants. Confirmé a posteriori par `git diff --stat` : exactement ces fichiers, plus `src/shared/i18n/index.test.ts` (assertion littérale à mettre à jour, même patron que REWORK10).

## Réutilisation canonique — les 4 conditions explicites vérifiées

| Condition (autorisation REWORK11) | Vérification |
|---|---|
| Le rendu et le comportement du dialogue d'abandon de séance restent strictement inchangés | `AbandonCreationModal.tsx` passe désormais tous ses props à `DecisionDialog` avec des valeurs reproduisant exactement les styles locaux précédents (mêmes couleurs, mêmes tailles, `confirmBordered={true}`) — capture avant/après impossible dans cet environnement, mais la reproduction exacte est démontrée par le point suivant. |
| Ses tests REWORK10 restent verts | `npx jest AbandonCreationModal.test.tsx` → **15/15**, fichier de test **non modifié** — preuve directe qu'aucune régression visuelle mesurable n'a été introduite. |
| Aucune propriété spécifique à la Séance n'est imposée au dialogue Activité | `DecisionDialog` n'a aucune valeur par défaut câblée pour la Séance : `titleStyle`/`messageStyle`/`cancelLabelStyle`/`confirmLabelStyle`/`confirmBordered` sont des props obligatoires, chaque appelant fournit les siennes. |
| Les textes et callbacks restent propres à chaque contexte | `title`/`message`/`cancelLabel`/`confirmLabel`/`onCancel`/`onConfirm` sont des props ; `AbandonCreationModal` lit `strings.screens.composition.abandonModal`, `ExerciseExitConfirmModal` lit `strings.screens.exercise.exitConfirmModal` — jamais partagés. |

## Correspondance point par point — résultat visuel (9 exigences)

| # | Demande | Fichier/code | Test | Verdict |
|---|---|---|---|---|
| 1 | Dialogue flottant centré dans l'écran Activité | `DecisionDialog.tsx` — `styles.backdrop` (partagé, inchangé depuis REWORK10) | « reuses the shared DecisionDialog geometry… » | **PASS**. |
| 2 | Largeur `354`, hauteur de référence `186`, rayon `18` | `dimensions.decisionDialog.width`/`radius` (partagés) | « floating card is 354pt wide with an 18pt radius… » | Largeur/rayon : **PASS**. Hauteur non figée (même principe disclosé que REWORK10/REWORK09) : **NON VÉRIFIABLE** sans device. |
| 3 | Écran visible derrière un voile assombri, non interactif | `DecisionDialog.tsx` — `styles.backdrop` (inchangé) | « reuses the shared DecisionDialog geometry… » | **PASS** (structure) ; interactivité réelle **NON VÉRIFIABLE**. |
| 4 | Titre centré : « Abandonner les modifications ? » | `ExerciseExitConfirmModal.tsx` — `titleStyle` | « centers the title horizontally… » | **PASS**. |
| 5 | Message exact | `fr.ts` — `exitConfirmModal.message` (déjà exact, inchangé) | « displays the exact title and message… » | **PASS**. |
| 6 | Message → actions : `spacing/16` | `dimensions.decisionDialog.gap` (partagé) | « floating card is 354pt wide… » (`gap: 16`) | **PASS**. |
| 7 | Deux actions, Annuler neutre gris / Confirmer destructif rouge/texte blanc | `ExerciseExitConfirmModal.tsx` — tokens `colors.dialogNeutralActionBackground`/`dialogDestructiveActionBackground` (partagés, réutilisés tels quels) | « gives Annuler… »/« gives Confirmer… » | **PASS**. |
| 8 | Boutons `147×48`, écart `12` | `dimensions.decisionDialog.actionWidth`/`actionHeight`/`actionGap` (partagés) | « keeps the two actions on a single row… » | **PASS**. |
| 9 | Libellés centrés horizontalement et verticalement | `DecisionDialog.tsx` — `alignItems`/`justifyContent: "center"` + `textAlign: "center"` (partagés) | « centers each action's label on both axes » | **PASS**. |

## Correspondance point par point — comportement (6 exigences)

| Demande | Fichier/code | Preuve |
|---|---|---|
| Ouverture uniquement si la copie locale diffère de son état initial | `ExerciseScreen.tsx` — `shouldBlockExit = !isFinishing && !exerciseEquals(local, initialSnapshot)` (non modifié) | `ExerciseScreen.test.tsx` — « renders ExerciseExitConfirmModal exactly when isPendingExit is true » (hérité, vert). |
| Annuler restitue intégralement les modifications locales | `DecisionDialog` → `onCancel` (transmis tel quel) | « calls onCancel, never onConfirm… » |
| Confirmer détruit uniquement les modifications locales de l'Activité, revient à Composition | `useCompositionExitGuard.ts` — `confirmExit` (non modifié) | `ExerciseNavigationGuard.integration.test.tsx` — « Abandonner » rejoue la navigation bloquée sans jamais appeler `updateDraft` (hérité, vert, **vrai navigateur**). |
| Aucun autre élément de la Séance altéré | `useCompositionExitGuard.ts`/`ExerciseScreen.tsx` (logique non modifiée) — `confirmExit` n'écrit jamais dans le `SessionDraft` partagé | Même test que ci-dessus — `updateDraft` jamais appelé. |
| Retour système = Annuler | `DecisionDialog.tsx` — `onRequestClose={onCancel}` (partagé) | « treats the Android hardware back request… » |
| Toucher le voile ne déclenche jamais Confirmer | `DecisionDialog.tsx` — le voile n'est pas un `Pressable` (aucune prop `onPress`) | « never wires a touch on the backdrop/voile to onConfirm… » |
| Aucun double déclenchement | `useCompositionExitGuard.ts` — `finishingRef`/verrou synchrone (non modifié) | `ExerciseNavigationGuard.integration.test.tsx` — « deux `fireEvent.press`… un seul `updateDraft` » (hérité, vert). |

## Écarts disclosés — typographie propre à chaque contexte (pas une divergence silencieuse)

Le nœud Figma concret de l'instance Activité (`3224:4140`) a été comparé directement à l'instance Séance (`2591:3083`, REWORK10). Les différences suivantes sont **réelles et vérifiées**, pas du bruit d'export — chacune est appliquée telle quelle, jamais uniformisée de force :

| Propriété | Séance (REWORK10, inchangé) | Activité (REWORK11) |
|---|---|---|
| Taille/graisse des libellés d'action | `16px` (`Annuler` Semi Bold / `Confirmer` Medium) | `14px` Semi Bold pour les deux (`type.button`, token déjà canonique et partagé ailleurs) |
| Couleur du libellé Annuler | `colors.dialogNeutralActionText` (`#292E38`) | `colors.dialogTitleText` (`#121212`) — réutilisé plutôt qu'un nouveau token, voir ci-dessous |
| Couleur/police/alignement du message | `type.dialogMessage`/`colors.dialogMessageText` (`#474D57`), justifié | `type.body`/`colors.textSecondary` (`#595E66`, déjà canonique et déjà utilisé par l'ancienne implémentation), aligné à gauche (par défaut) |
| Liseré de l'action destructive | Présent (`colors.dialogDestructiveActionBorder`) | **Absent**, vérifié sur `3224:4140` (aucune classe de bordure sur `Bouton — Supprimer la planification`) |

**Décision disclosée sur la couleur du titre/libellé Annuler** : Figma documente `#111` (soit `#111111`) pour le titre ET le libellé Annuler de l'instance Activité — à un seul pas hexadécimal de `colors.dialogTitleText` (`#121212`), déjà établi comme token canonique par REWORK10. Conformément à l'interdiction explicite de duplication locale et à la discipline déjà appliquée dans les cycles précédents (REWORK09, titre « Paramètres de l'activité » `#14141a` vs `#141414`), cet écart imperceptible est traité comme du bruit d'export plutôt que comme une décision de design distincte — `colors.dialogTitleText` est réutilisé pour les deux éléments, sans nouveau token créé pour une différence d'un demi-point.

## Tests et preuves

### Commandes exécutées et résultats

```
npx tsc --noEmit
→ sortie vide, code de sortie 0

npx eslint .
→ sortie vide, code de sortie 0

npx jest src/features/sessions/__tests__/AbandonCreationModal.test.tsx --maxWorkers=2
→ Test Suites: 1 passed, 1 total
→ Tests:       15 passed, 15 total   (fichier de test NON modifié — non-régression REWORK10 directe)

npx jest src/features/sessions/__tests__/ExerciseExitConfirmModal.test.tsx --maxWorkers=2
→ Test Suites: 1 passed, 1 total
→ Tests:       15 passed, 15 total

npx jest src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx --maxWorkers=2
→ Test Suites: 1 passed, 1 total
→ Tests:       12 passed, 12 total   (vrai navigateur, hérité, vert sans modification)

npx jest --maxWorkers=2   (suite complète du projet)
→ Test Suites: 37 passed, 37 total
→ Tests:       536 passed, 536 total
```

### Correspondance avec les 12 exigences de test de l'autorisation

| # | Exigence | Couverture |
|---|---|---|
| 1 | Quatre textes exacts visibles et accessibles | « exposes exactly 'Annuler' and 'Confirmer'… » |
| 2 | Absence des anciens libellés | « never shows the previous labels… » |
| 3 | Titre centré | « centers the title horizontally… » |
| 4 | Boutons `147×48`, même ligne, écart `12` | « keeps the two actions on a single row… » |
| 5 | Couleurs par tokens DSF neutre/destructif | « gives Annuler… »/« gives Confirmer… » |
| 6 | Espacement message/actions = `spacing/16` | « floating card is 354pt wide… » |
| 7 | Ouverture uniquement avec modifications locales | `ExerciseScreen.test.tsx` (hérité) |
| 8 | Annuler/Retour système conservent le brouillon | « calls onCancel… » + « treats the Android hardware back request… » |
| 9 | Confirmer abandonne uniquement le brouillon Activité | `ExerciseNavigationGuard.integration.test.tsx` (hérité, vrai navigateur) |
| 10 | Voile bloquant, jamais destructif | « never wires a touch on the backdrop/voile to onConfirm… » |
| 11 | Vraie navigation Exercices → Composition après confirmation | `ExerciseNavigationGuard.integration.test.tsx` (hérité, vrai navigateur, 12/12 verts) |
| 12 | Non-régression explicite du dialogue Séance REWORK10 | `AbandonCreationModal.test.tsx`, fichier non modifié, 15/15 verts |
| — | `tsc`/ESLint/suite Jest complète | Voir ci-dessus, tous verts |

### Limites des tests

Ces tests prouvent la structure, les valeurs de style et le câblage comportemental en JavaScript — y compris la navigation réelle via `ExerciseNavigationGuard.integration.test.tsx` (vrai `Stack`/navigateur, pas un mock) — mais jamais le rendu pixel réel ni le geste tactile sur iPhone. Statut maximal sans capture device, conformément à l'autorisation : `REWORK11_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`.

## Fichiers modifiés

| Fichier | +/- |
|---|---|
| `src/features/sessions/DecisionDialog.tsx` | nouveau (composant partagé) |
| `src/features/sessions/AbandonCreationModal.tsx` | +35 / -147 (refactorisé pour consommer `DecisionDialog`) |
| `src/features/sessions/ExerciseExitConfirmModal.tsx` | +59 / -93 (reconstruit depuis `DecisionDialog`) |
| `src/features/sessions/__tests__/ExerciseExitConfirmModal.test.tsx` | +153 / -31 |
| `src/shared/i18n/index.test.ts` | +3 / -3 |
| `src/shared/i18n/resources/fr.ts` | +9 / -2 |

Aucun nouveau token n'a été nécessaire dans `tokens.ts` : tous les tokens `colors.dialog*`/`dimensions.decisionDialog`/`type.dialogMessage`/`dialogNeutralActionLabel`/`dialogDestructiveActionLabel` créés par REWORK10 sont réutilisés tels quels ; les valeurs propres à l'Activité réutilisent des tokens déjà canoniques et déjà partagés ailleurs (`type.button`, `type.body`, `colors.textSecondary`, `colors.dialogTitleText`).

## Éléments non corrigés ou hors périmètre

- Généralisation de la roulette numérique (`2026-09-04_numeric-wheel-generalization.md`) : design prêt, statut `READY_FOR_IMPLEMENTATION_REVIEW`, **non implémentée** — hors périmètre explicite de REWORK11, aucune ligne de `NumberWheelPicker.tsx` modifiée.

## Vérifications restant à effectuer sur appareil réel

- Confirmation visuelle que le dialogue d'abandon de séance (REWORK10) reste **visuellement identique** après l'extraction — les tests prouvent l'identité des valeurs de style transmises, pas le rendu pixel.
- Confirmation visuelle des différences typographiques disclosées du dialogue Activité (labels `14px`, message aligné à gauche, absence de liseré rouge).
- Confirmation tactile que le voile reste réellement non interactif sur les deux écrans (Composition et Activité) et que le geste Retour ferme sans jamais confirmer la suppression.

## Modifications réalisées

Voir les tableaux de correspondance point par point ci-dessus pour le détail exhaustif.

## État Git

- Branche : `feat/creation-seance-catalogue`
- HEAD avant ce cycle : `0bcc1e7066e61a0e2a73a336c10fb54a02cb29cb`
- Ce rapport sera committé séparément du commit de code applicatif, conformément à l'exigence de livraison documentaire (`CLAUDE.md`).

### SHA finaux

- **SHA applicatif** : `d1f577d` (« fix(T01-S08/REWORK11): dialogue d'abandon d'une Activité (CE-T01-16) », 6 fichiers, 412 insertions / 276 suppressions).
- **SHA rapport** : renseigné dans le commentaire de transition GitHub (commit `docs(orchestration): ...` immédiatement suivant, contenant ce fichier).
- **État Git final** : `working tree clean`, branche `feat/creation-seance-catalogue`, HEAD local = HEAD distant après push (vérifié post-commit).

## Statut de clôture

`REWORK11_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION` — les 9 exigences visuelles, les 6 exigences comportementales et les 4 conditions de réutilisation canonique sont intégralement implémentées et vérifiées (`tsc`/`eslint`/Jest complet, 37 suites/536 tests, non-régression directe des 15 tests REWORK10 inchangés) ; seule la comparaison visuelle/tactile réelle reste à effectuer par contre-recette iPhone. Arrêt obligatoire après cette correction, conformément à l'autorisation.

## Self-check Claude

- Le seul commentaire publié depuis mon dernier checkpoint (REWORK10, HEAD `0bcc1e7`) a été relu intégralement avant implémentation ; les deux rapports de canonicalisation du checkpoint Git ont été lus, dont un explicitement écarté du périmètre (roulette numérique).
- Le nœud Figma concret (`3224:4082`, instance `3224:4140`) a été contrôlé directement, pas le rapport précédent ni l'implémentation existante — chaque différence typographique avec le dialogue Séance est vérifiée et disclosée, jamais uniformisée sans preuve ni silencieusement ignorée.
- L'extraction du composant partagé respecte les 4 conditions explicites de l'autorisation, chacune vérifiée individuellement (tableau dédié ci-dessus) — en particulier la non-régression du dialogue Séance, démontrée par un fichier de test **non modifié** qui reste vert.
- Aucun fichier hors des deux dialogues et du composant partagé modifié — `git diff --stat` : 6 fichiers, tous strictement dans le périmètre.
- `tsc --noEmit`, `eslint .` et la suite Jest complète (37 suites, 536 tests) sont verts au moment de la rédaction de ce rapport.
