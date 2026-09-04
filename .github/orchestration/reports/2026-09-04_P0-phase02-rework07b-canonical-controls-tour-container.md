# P0 — Phase 2 — REWORK07B — Contrôles canoniques + structure Tour

## Identification

- **Mission** : REWORK07B — implémenter cumulativement trois ensembles de corrections cosmétiques : **A** contrôle Retour canonique (`48/28/24`) ; **B** actions Annuler/Valider de la roulette (actifs SVG canoniques, aucun glyphe Unicode) ; **C** structure extérieure « Nombre de tours » (structure bleue seule surface visuelle, en-tête technique intérieur transparent).
- **Issue** : [#35](https://github.com/MyUncried/Application-Routine/issues/35)
- **Autorisation** : `[ChatGPT] PLAN_APPROVED — REWORK07B — contrôles canoniques + structure Tour`, 2026-09-04T09:23:31Z, puis `[ChatGPT] WORKTREE_RESUME_APPROVED — reprendre REWORK07B`, 2026-09-04T09:46:36Z (reprise après résolution de la fusion `WORKTREE_LOCKED`).
- **Reprise conforme, disclosure explicite** : la reprise depuis le checkpoint GitHub a montré que le commentaire `PLAN_APPROVED — REWORK07B` (09:23:31Z) avait été publié **avant** mon propre commentaire `WORKTREE_LOCKED` (09:28:23Z) du cycle précédent, mais n'avait pas été lu à ce moment — le blocage Git réel a été correctement détecté et signalé, mais sans lecture préalable de ce commentaire spécifique. Aucune conséquence pratique (le blocage restait bloquant quel que soit le contenu de ce commentaire), mais l'omission est explicitement reconnue ici, conformément à la règle de cette session de toujours divulguer un tel écart. Tous les commentaires depuis le dernier checkpoint valide ont été relus intégralement avant cette implémentation : `PLAN_APPROVED — REWORK07B`, `ADDENDUM EN ATTENTE` (`QUEUED_FOR_NEXT_COMPOSITION_REWORK`, explicitement hors périmètre), et `WORKTREE_RESUME_APPROVED`.

## Branche et commit de départ

- Branche : `feat/creation-seance-catalogue`
- Baseline exigée par `PLAN_APPROVED`/`WORKTREE_RESUME_APPROVED` : `725dd33edbac5769e467508985a21a28f87de426` (« 2 commits devant » confirmés par ChatGPT).
- **HEAD constaté à cette reprise, préconditions vérifiées avant tout code** :
  - `git fetch` puis `git rev-parse HEAD` = `77f8f99c577ed1bd7e46409accc1d1792f333bca`.
  - `git rev-parse origin/feat/creation-seance-catalogue` = identique (`77f8f99`).
  - `git status --short` : vide (worktree propre).
  - `git rev-parse -q --verify MERGE_HEAD` : absent (aucune fusion en cours).
  - `git log --oneline 725dd33..HEAD` : exactement 2 commits (`3f4447a`, `77f8f99` — le commit de fusion résolue) — confirme la baseline attendue sans divergence.
  - `grep -rn '^<<<<<<<'` sur les 3 fichiers précédemment en conflit : aucune occurrence — fusion réellement propre, pas de marqueur résiduel.

## Périmètre demandé

Défini intégralement par `PLAN_APPROVED — REWORK07B` (texte complet relu et archivé) :

- **A — Contrôle Retour canonique** : actif `assets/icons/control-back.svg` ; cible tactile `48×48`, cercle visible `28×28`, pictogramme/cadre SVG `24×24` ; corriger tokens/mapping `KodjoIcon`/composant partagé ; aucun tracé local ni substitut Unicode.
- **B — Actions Annuler/Valider de la roulette** : consommer exclusivement `wheel-action-cancel.svg`/`wheel-action-validate.svg` via `KodjoIcon` ; `48/28/24` ; conserver la primitive OS native de roulette et son comportement documenté (brouillon/validation) ; chevron de carte absent à l'ouverture, icône fonctionnelle fixe.
- **C — Structure extérieure « Nombre de tours »** : structure extérieure = seule surface visuelle (`374 pt`, fond bleu DSF, rayon canonique, inset `10 pt`) ; en-tête technique intérieur `354 pt` transparent (ni fond, ni bordure, ni ombre, ni apparence de carte) ; état sans activité = une seule structure bleue visible ; préserver le contrôle interne du nombre de tours déjà corrigé.
- **Non-régression explicite** : ne modifier aucun autre rendu/comportement (shell fixe, zone bleue supérieure du Header n'est pas concernée — à ne pas confondre avec le fond bleu de C, propre au Tour —, cartes Compte à rebours/Fin, poignées canoniques, titres, navigation, bouton inférieur, roulette native, valeurs et logique métier). Aucune phase ni écran suivant.
- **Tests obligatoires** : Retour (source + `48/28/24`) ; Annuler/Valider (actifs SVG + aucun glyphe Unicode + `48/28/24`) ; Tour (fond porté par le conteneur extérieur, en-tête intérieur transparent sans bordure/ombre, `374/10/354`) ; suite existante/`tsc`/`eslint`/Jest verts.
- **Hors périmètre explicite de ce cycle** : la synthèse activité/durée sous le libellé `Nombre de tours` (`ADDENDUM EN ATTENTE`, `QUEUED_FOR_NEXT_COMPOSITION_REWORK`) — non implémentée ici, reportée au prochain run Composition.

## Périmètre réellement traité

Conforme au périmètre demandé, sans extension — chaque modification est rattachée explicitement à A, B ou C ci-dessous.

### A — Contrôle Retour canonique

| Fichier | Modification |
|---|---|
| `src/shared/ui/KodjoIcon.tsx` | `sizes["control-back"]` : `[14, 14]` → `[24, 24]` (registre partagé). Aucune autre entrée du registre touchée. |

`ScreenShell.tsx` (cercle `28×28`, `hitSlop` portant la cible `48×48`) n'a nécessité **aucune modification** : sa géométrie était déjà conforme (`dimensions.backAction.visualCircle`) — seule la taille d'affichage de l'icône, définie exclusivement dans le registre partagé `KodjoIcon.tsx`, était non conforme.

**Effet de bord accepté, déjà précédenté (R4-02)** : `ExerciseScreen.tsx` consomme la même icône partagée (`KodjoIcon name="control-back"`, sans prop `size` locale) et hérite donc de la même correction — aucun fichier de cet écran n'a été modifié ; seul le rendu de l'icône partagée change, effet inhérent à la correction d'un token DSF réellement partagé (le registre `sizes` de `KodjoIcon.tsx` est délibérément le seul point de vérité de cette taille).

### B — Actions Annuler/Valider de la roulette

| Fichier | Modification |
|---|---|
| `src/shared/ui/KodjoIcon.tsx` | Ajout `"wheel-action-cancel"`/`"wheel-action-validate"` dans `sources` (require des deux actifs déjà présents dans `assets/icons/`, ajoutés par la fusion externe) et dans `sizes` (`[24, 24]` chacun, matching le `viewBox` exact de chaque export). |
| `src/features/sessions/DurationWheelPicker.tsx` | Import de `KodjoIcon`. `PickerToolbar` (composant **partagé** entre les chemins natif iOS et Legacy Android/web — un seul point de rendu, deux appelants) : remplace `<Text style={styles.actionGlyphCancel}>✕</Text>`/`<Text style={styles.actionGlyphValidate}>✓</Text>` par `<KodjoIcon name="wheel-action-cancel" .../>`/`<KodjoIcon name="wheel-action-validate" .../>`. Styles `actionGlyphCancel`/`actionGlyphValidate` (devenus inutilisés) supprimés. |
| `src/shared/ui/tokens.ts` | `colors.wheelActionCancelIcon`/`wheelActionValidateIcon` conservés (traçabilité DSF) mais annotés comme non consommés directement — la couleur est désormais portée nativement par le tracé SVG (`#141414`/blanc, déjà identique à ces tokens), sans `tintColor`. |

**Primitive native préservée** : aucune ligne de `NativeAppleDurationWheelPicker`/`LegacyDurationWheelPicker` (colonnes minutes/secondes, contrat draft/validation, `onValidate`/`onCancel`) n'a été touchée — seul le rendu du glyphe à l'intérieur des deux `Pressable` déjà existants (`duration-wheel-cancel`/`duration-wheel-validate`, géométrie `28×28`/`hitSlop` déjà conforme) a changé.

### C — Structure extérieure « Nombre de tours »

| Fichier | Modification |
|---|---|
| `src/shared/ui/tokens.ts` | Nouveau `colors.tourSurface = "#CDCEFA"` (fond bleu canonique documenté, distinct de `selectionSurface` `#E5F0FF` jusqu'ici réutilisé par erreur). `dimensions.compositionTourSection` : ajout de `radius: 10` (rayon canonique de la structure extérieure, distinct du `12` de `limitCardBase`). |
| `src/features/sessions/CompositionScreen.tsx` | `tourSectionContainer` (testID inchangé `composition-tour-section`) : ajout `backgroundColor: colors.tourSurface`, `borderRadius: dimensions.compositionTourSection.radius`, `paddingVertical: spacing[12]` (relocalisé, valeur numérique identique à l'ancienne `limitCardBase.paddingVertical`), `minHeight: dimensions.compositionTourSection.closedHeight` (relocalisé depuis l'ancien style `tourCard`). `[limitCardBase, tourCard]` (fond/bordure/rayon partagés avec les cartes limites) retiré de la vue interne, remplacée par un nouveau style `tourHeader` strictement transparent (`flexDirection:"row", alignItems:"center", gap: spacing[8]` — aucun fond, aucune bordure, aucun rayon, aucun padding propre). JSX et testID de la vue interne inchangés (`composition-tour-card`) — seule sa signification visuelle change. |

**Contrôle interne du nombre de tours préservé intact** : `tourCardControl`/`tourCardControlValue`/`tourCardControlChevronBox` (cadre `78×44`, valeur centrée/grasse, carré violet `28×28`) — **aucune ligne modifiée**.

## Tableau PRESERVE / CHANGE / FORBIDDEN

| Élément | Statut | Preuve |
|---|---|---|
| Primitive native de roulette (`NativeAppleDurationWheelPicker`, contrat draft/committed, colonnes minutes/secondes) | **PRESERVE** | Aucune ligne modifiée dans `DurationWheelPicker.tsx` en dehors de `PickerToolbar` et de l'import `KodjoIcon`. |
| Contrôle Nombre de tours (cadre `78×44`, carré violet `28×28`, valeur centrée/grasse) | **PRESERVE** | `tourCardControl`/`tourCardControlValue`/`tourCardControlChevronBox` non modifiés — vérifié par diff et par le test CMP-04/T-04a/b/c inchangé sur ces assertions. |
| Header fixe, Context band, Bottom Action | **PRESERVE** | Aucune ligne de `ScreenShell.tsx` autre que le registre `KodjoIcon` (A) ; `CompositionScreen.tsx` ne touche à aucune de ces zones. |
| Cartes Compte à rebours/Fin de séance (hors héritage transverse déjà documenté de `rowLabel`) | **PRESERVE** | `BoundaryActivityRow` non modifié dans ce cycle. |
| Chevron de carte absent à l'ouverture / icône fonctionnelle fixe | **PRESERVE** | Règle déjà implémentée (REWORK06) — non retouchée ; tests dédiés toujours verts sans modification. |
| Navigation, bouton inférieur, valeurs et logique métier | **PRESERVE** | Aucun fichier de ces domaines dans le diff. |
| Icône `control-back` (taille d'affichage) | **CHANGE (A)** | `14×14` → `24×24` dans `KodjoIcon.tsx`. Test dédié `ScreenShell.test.tsx` vert. |
| Glyphes Annuler/Valider de la roulette | **CHANGE (B)** | Unicode `✕`/`✓` → `KodjoIcon` SVG canoniques `24×24`. Test dédié `DurationWheelPicker.test.tsx` vert (assets présents, glyphes absents). |
| Fond/rayon de la structure Tour | **CHANGE (C)** | Relocalisés de l'en-tête intérieur (`tourCard`, retiré) vers la structure extérieure (`tourSectionContainer`) ; nouvelle couleur canonique `#CDCEFA`, nouveau rayon `10`. Tests dédiés `CompositionScreen.test.tsx` verts. |
| Bordure de l'en-tête intérieur Tour (héritée de `limitCardBase`) | **CHANGE (C)** | Retirée — l'en-tête intérieur est désormais strictement transparent, conformément à « ni fond, ni bordure, ni ombre, ni apparence de carte autonome ». |
| T-01 (« Tour partage exactement la géométrie de boîte des cartes limites ») | **SUPERSEDED, explicitement documenté** | Ce cycle **révise** un acquis antérieur sur autorisation explicite de la documentation canonique mergée (`12 – Architecture technique.md`, « Anatomie canonique — Nombre de tours ») citée nommément par `PLAN_APPROVED — REWORK07B` (« Appliquer l'anatomie canonique documentée et Figma ») — pas une contradiction silencieuse. Le test T-01 original a été remplacé par un test qui démontre et documente explicitement la supersession (voir `CompositionScreen.test.tsx`). |
| Synthèse activité/durée sous « Nombre de tours » | **FORBIDDEN pour ce cycle** | Explicitement `QUEUED_FOR_NEXT_COMPOSITION_REWORK` — non implémentée, aucune ligne de code y afférente. |
| Toute modification hors A/B/C | **FORBIDDEN** | `git diff --numstat` : 7 fichiers, tous strictement dans le périmètre A/B/C ou leurs tests directement associés — aucune extension constatée. |

## Constats

- Le registre de traçabilité canonique mergé (`12 – Architecture technique.md`) documentait déjà, avant tout code de ce cycle, les 3 écarts corrigés ici (« Écarts applicatifs constatés, non corrigés » du rapport `2026-09-04_canonical-ui-controls-traceability.md`, fusionné) : `control-back` à `14×14` au lieu de `24×24` ; glyphes Unicode au lieu des actifs vectoriels ; fond bleu incorrect du conteneur Tour. Ce cycle ferme exactement ces 3 écarts, sans en introduire de nouveaux constatés.
- La restructuration C ne nécessitait **aucun nouveau conteneur React** : `tourSectionContainer` disposait déjà, depuis R4-12 (cycle antérieur), de la géométrie exacte requise pour porter la surface visuelle (`374` large via bleed `marginHorizontal:-10`/`paddingHorizontal:10`, contenu effectif `354`) — il suffisait de lui transférer le fond/rayon/padding vertical/hauteur minimale précédemment portés par l'en-tête intérieur, et de rendre ce dernier strictement transparent.
- La divergence de couleur (`#E5F0FF` utilisé à la place du `#CDCEFA` documenté) n'avait jamais été signalée avant la mission de canonicalisation Figma fusionnée dans ce cycle — un nouveau token dédié (`colors.tourSurface`) a été créé plutôt que de réutiliser `selectionSurface` pour un rôle qui ne lui correspondait pas.

## Preuves et tests

### Commandes exécutées et résultats

```
npx tsc --noEmit
→ sortie vide, code de sortie 0

npx eslint .
→ sortie vide, code de sortie 0

npx jest src/features/sessions/__tests__/CompositionScreen.test.tsx src/features/sessions/__tests__/DurationWheelPicker.test.tsx src/shared/ui/__tests__/ScreenShell.test.tsx --maxWorkers=2
→ Test Suites: 3 passed, 3 total
→ Tests:       106 passed, 106 total

npx jest --maxWorkers=2   (suite complète du projet)
→ Test Suites: 37 passed, 37 total
→ Tests:       487 passed, 487 total
```

### Correspondance avec les tests obligatoires de l'autorisation

| Preuve exigée | Test |
|---|---|
| Retour : source canonique et géométrie `48/28/24` | `ScreenShell.test.tsx` — « REWORK07B — the Retour chevron itself renders at the canonical 24×24... » (nouveau) + test existant (cercle `28×28`/cible `48×48`, inchangé, toujours vert) |
| Annuler/Valider : actifs SVG canoniques présents, aucun glyphe Unicode, géométrie `48/28/24` | `DurationWheelPicker.test.tsx` — « REWORK07B — renders the canonical wheel-action SVG assets at 24×24, never the previous Unicode ✕/✓ glyphs » (nouveau) + test existant (cercle `28×28`/cible `48×48`, inchangé, toujours vert) |
| Tour : fond bleu porté par le conteneur extérieur ; en-tête intérieur transparent et sans bordure/ombre ; largeur/insets `374/10/354` | `CompositionScreen.test.tsx` — test CMP-04 étendu (fond + rayon sur `composition-tour-section`, absence de fond/bordure/rayon sur `composition-tour-card`) ; test R4-12 inchangé (marge/padding `374/10`, toujours vert) ; nouveau test « REWORK07B — supersedes T-01 » (rayon `10` distinct des cartes limites) |
| Suite existante/`tsc`/`eslint`/Jest verts | Ci-dessus, tous verts |

**Limite explicitement déclarée (rappelée par l'autorisation elle-même)** : ces tests prouvent la structure/les valeurs de style transmises, jamais le rendu pixel final sur iPhone — un test technique vert ne constitue pas une preuve de conformité visuelle device.

## Hypothèses non démontrées

- **Rendu device réel** (`NON_VERIFIABLE_DEVICE`) : couleur perçue du fond Tour (`#CDCEFA`), netteté du chevron Retour à `24×24`, rendu exact des glyphes SVG Annuler/Valider, absence perceptible de toute ombre/bordure sur l'en-tête Tour — aucun ne peut être vérifié dans cet environnement sans appareil iOS physique.
- Le rayon canonique `10` de la structure extérieure Tour a été pris tel quel dans la documentation mergée (`12 – Architecture technique.md`) sans seconde source de confirmation indépendante (le fichier `13 – Contrats d'écran.md` ne redonne pas explicitement ce chiffre) — cohérent mais non recoupé par une deuxième source canonique distincte.

## Fichiers modifiés

| Fichier | +/- |
|---|---|
| `src/features/sessions/CompositionScreen.tsx` | +50 / -10 |
| `src/features/sessions/DurationWheelPicker.tsx` | +13 / -19 |
| `src/features/sessions/__tests__/CompositionScreen.test.tsx` | +43 / -11 |
| `src/features/sessions/__tests__/DurationWheelPicker.test.tsx` | +20 / -0 |
| `src/shared/ui/KodjoIcon.tsx` | +28 / -9 |
| `src/shared/ui/__tests__/ScreenShell.test.tsx` | +11 / -0 |
| `src/shared/ui/tokens.ts` | +25 / -1 |

## Éléments non corrigés ou hors périmètre

- Synthèse activité/durée sous le libellé `Nombre de tours` : explicitement `QUEUED_FOR_NEXT_COMPOSITION_REWORK`, non implémentée.
- Cartes d'activité futures à l'intérieur de la structure Tour (variante déployée avec activités) : le modèle T01 ne permet qu'un seul Exercice hors Tour — cette variante reste non représentable avec des données réelles à ce stade, non implémentée.
- Toute autre correction cosmétique non explicitement listée par A/B/C : non traitée, conformément à « ne traiter aucun autre point cosmétique ».

## Vérifications restant à effectuer sur appareil réel

- Confirmation visuelle sur iPhone du rendu du contrôle Retour (`24×24` dans le cercle `28×28`), des icônes Annuler/Valider (SVG vs ancien Unicode), et de la structure Tour (fond `#CDCEFA`, rayon `10`, en-tête transparent sans bordure visible).
- Confirmation que l'absence de bordure sur l'en-tête intérieur Tour ne crée pas de confusion visuelle avec le fond de la structure extérieure (contraste attendu entre le bleu de la structure et le contenu de l'en-tête).

## Modifications réalisées

Voir « Périmètre réellement traité » et le tableau PRESERVE/CHANGE/FORBIDDEN ci-dessus pour le détail exhaustif fichier par fichier, classé par A/B/C.

## État Git

- Branche : `feat/creation-seance-catalogue`
- HEAD avant ce cycle (baseline vérifiée) : `77f8f99c577ed1bd7e46409accc1d1792f333bca`
- Ce rapport sera committé séparément du commit de code applicatif, conformément à l'exigence de livraison documentaire (`CLAUDE.md`).

### SHA finaux (renseignés après commit)

- **SHA applicatif** : `0678b43678d280cc52a57d83b7ea645f1934c28b` (`fix(T01-S07/S08): REWORK07B — contrôles canoniques + structure Tour`).
- **SHA rapport** : voir commit `docs(orchestration): ...` immédiatement suivant, contenant ce fichier — renseigné dans le commentaire de transition GitHub.
- **État Git final** : `working tree clean`, branche `feat/creation-seance-catalogue`, HEAD local = HEAD distant après push (vérifié post-commit).

## Statut de clôture

`REWORK07B_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION` — implémentation cumulative des trois ensembles A/B/C, tests (`tsc`/`eslint`/Jest complet) et documentation conformes au périmètre strictement autorisé ; seule la vérification perceptive sur iPhone réel reste hors de portée de cet environnement.

## Self-check Claude

- Les préconditions de reprise (`WORKTREE_RESUME_APPROVED`) ont été vérifiées avant tout code : HEAD local = HEAD distant, worktree propre, absence de `MERGE_HEAD`, absence de marqueur de conflit résiduel, baseline `725dd33..HEAD` = exactement 2 commits.
- Une omission de lecture (comment `PLAN_APPROVED — REWORK07B` non lu avant le `WORKTREE_LOCKED` du cycle précédent) est explicitement divulguée ci-dessus, sans conséquence pratique démontrée sur ce cycle.
- Chaque modification de code est rattachée explicitement à A, B ou C dans ce rapport — aucune modification non classée.
- La supersession du test T-01 est documentée explicitement comme une révision autorisée, pas une contradiction silencieuse d'un acquis antérieur.
- L'addendum `QUEUED_FOR_NEXT_COMPOSITION_REWORK` n'a pas été implémenté par erreur — vérifié explicitement absent du diff.
- `tsc --noEmit`, `eslint .` et la suite Jest complète (37 suites, 487 tests) sont verts au moment de la rédaction de ce rapport.
