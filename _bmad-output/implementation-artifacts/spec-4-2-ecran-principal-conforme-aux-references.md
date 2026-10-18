---
title: 'Story 4.2 — Écran principal conforme aux références'
type: 'feature'
created: '2026-10-18'
status: 'done'
route: 'dispatch'
baseline_commit: 'b269beaa'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-4.md'
  - '{project-root}/_bmad-output/implementation-artifacts/bilan-ecarts-2026-10-17.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
  - '{project-root}/_bmad-output/planning-artifacts/prds/prd-kodjo-pre4-2026-10-16/prd.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-kodjo-pre4-2026-10-16/ARCHITECTURE-SPINE.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/questions-ouvertes.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/recette-iphone.md'
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'écran principal de l'Éditeur d'Exercice est en grande partie conforme depuis PRE-3, mais garde des écarts : la Carte Paramètres d'exécution précède la Description, la fermeture est un chevron, la marge latérale ne passe pas à 16 sous 390, la Carte vide n'a pas d'invite, l'abandon en création n'a pas de dialogue, un bouton de Mode reste à droite du titre de la Carte (Q23), et aucun relevé visuel bloc par bloc n'existe.

**Approach:** Implémenter la **story 4.2 (AC1 à AC14, `epics-parts/epic-4.md`)** selon le bilan des écarts approuvé : établir d'abord le relevé visuel (AC1), puis **ne corriger que les écarts relevés**. Écarts déjà identifiés : Description avant la Carte (P7) ; ✕ circulaire par une prop locale de `FixedHeader` (composant partagé) ; marge 16 sous 390 ; invite de la Carte vide (H22) ; dialogue d'abandon en création (Q18) ; retrait du bouton de Mode (Q23) ; retour de ligne avant « Durée totale » dans la Carte. **Conserver** le halo, le dégradé et la gestion du clavier, acceptés en recette PRE-3 (N-05, T-49). Rejouer aussi le report de 4.1 : AC10 avec saisie de Cibles à l'échec dans la Feuille, dans les quatre parcours (`deferred-work.md`).

## Boundaries & Constraints

**Always:**
- AC1 avant tout changement de `src/` : tableau de relevé (une ligne par élément et par état, jeton retenu ou écart) dans les Implementation Notes, depuis `docs/preparation/PRE-4/figma/<frame>.json.gz` et `fermeture-maitres-et-variables.json.gz` ; éléments sans référence `NON VÉRIFIABLE` ; textes des captures non repris listés. Aucun chiffre lu n'y devient une règle (D-255) ; les écarts sont listés à part et signalés à Hermann.
- `FixedHeader` est partagé : le ✕ passe par une prop locale, les autres écrans sont inchangés.
- Lexique pour tout nouveau texte (invite H22, titre et message d'abandon en création Q18) ; clés devenues sans usage retirées (AC14).
- `Terminer` : état par `validateForSave` (AD-13), `accessibilityState.disabled` ; un seul enregistrement à la fois ; atomicité et erreur d'écriture par le motif `FailingDatabase`.
- Carte : un seul focus, libellé composé selon AC6 ; Phrase par le générateur unique (2.3), retour de ligne avant « Durée totale » au rendu seulement ; aucune hauteur fixée.
- Marges : 24 à partir de 390, 16 en dessous ; grille 20 / 13 / 12 par styles ; aucune coordonnée Figma absolue.
- Décisions de la Feuille (Q35 à Q47) inchangées ; tokens intouchés (`tokensSpecification.test.ts` vert) ; `UNSELECTED_OPACITY` pour tout atténué.

**Never:**
- Ne pas retravailler l'ergonomie de la Feuille ni réimplémenter un composant accepté (halo, dégradé, clavier, `FixedHeader`, `ExerciseExitConfirmModal`).
- Hors story : comportement de Catégorie et Zones (4.3), galerie Médias (4.4, 4.5), Feuille (E3), Phrase elle-même (2.3), Q9.
- Aucune conformité visuelle déclarée (NFR-04).

</frozen-after-approval>

## Code Map

- `src/features/activities/ActivityEditorForm.tsx` (ordre des blocs, Carte, bouton de Mode `exercise-parameters-mode`, libellé l.~310).
- `src/features/sessions/ExerciseScreen.tsx`, `ExerciseExitConfirmModal.tsx` ; `FixedHeader` dans `src/shared/ui/ScreenShell.tsx` ; `src/shared/ui/KodjoIcon.tsx`.
- `src/shared/i18n/index.ts` ; `src/shared/ui/tokens.ts` (lecture seule).
- Tests : `ActivityEditorForm.test.tsx`, `ExerciseScreen.test.tsx`, `ExerciseEditingPaths.integration.test.tsx` (AC10 de 4.1).
- Frames : `8328:35698`, `8328:35740`, `8328:36278`, `8328:36711`, `8328:36853`, `8328:37022`, `8328:36781`.
- Recette `recette-iphone.md` §4.4 : R-4.2-01 à 06 ; R-4.1-05 mis à jour.

## Tasks & Acceptance

**Execution:**
- [x] Relevé visuel AC1 et liste des écarts (avant tout changement de `src/`) -- Implementation Notes.
- [x] Corrections des écarts relevés (ordre, ✕, marges, invite, abandon en création, bouton de Mode) -- E-F1 à E-F7 ; retour de ligne déjà conforme au départ (Spec Change Log).
- [x] Tests `PRE4-4.2/AC1` à `AC14`, dont les états d'AC11 -- table de correspondance ci-dessous.
- [x] Report 4.1 AC10 : Cibles à l'échec saisies dans la Feuille, quatre parcours ; `deferred-work.md` mis à jour (report clos, et report Q29 de 3.2 clos par un test complémentaire).
- [x] Recette R-4.2-01 à 06 et R-4.1-05 mis à jour (`recette-iphone.md` §4.4) ; READMEs (`src/features/activities`, `src/features/sessions`, `src/shared/ui`).

**Acceptance Criteria:**
- Given la story 4.2, when elle est livrée, then chacun de ses critères AC1 à AC14 est vérifié par un test nommé ou, pour AC1, par le relevé consigné ; `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Implementation Notes

### Relevé visuel AC1 (consigné le 2026-10-18, avant toute modification de `src/`)

Sources : arbres `docs/preparation/PRE-4/figma/8328-*.json.gz` des sept frames et `sources-caa2a5cf/docs/preparation/PRE-4/figma/fermeture-maitres-et-variables.json.gz` (maîtres, styles, variables), lus par un script de lecture jetable (supprimé). Code relevé : `b269beaa`. Frames : **A** `8328:35698` Initial ; **B** `8328:35740` Nom Description Média ; **C** `8328:36278` Catégorie renseignée ; **D** `8328:36711` Avant Paramètres ; **E** `8328:36853` Paramètres — Champ vide ; **F** `8328:37022` Résumé affiché ; **G** `8328:36781` Abandon (confirmation). Toutes sont en création ; aucune frame « Modifier un exercice ». Les chiffres ci-dessous sont des constats, jamais des règles (D-255, NFR-01) ; aucune coordonnée absolue n'est reprise ; la barre d'état dessinée est un décor système. « auto » = interligne automatique Figma. Écarts : **E-F** corrigé dans la story, **E-V** signalé à Hermann, non corrigé.

| # | Frame / état | Élément (nœud) | Maître / variante | Style / variable lié | Police | Couleurs | Contour | Ombre / effets | Espacement relatif | Jeton retenu (code) | Écart |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | A–G | Titre (`I…;5544:4501`) | En-tête fixe `5544:4503` (État=Fermer) | Texte « KODJO / Texte / Inter Semi Bold 20 » ; `color/text-primary` | Inter Semi Bold 20 / auto | #141414 | — | — | après la cible ✕ 48 + 4 (`spacing/4`) | `type.screenTitle` (20/24), `colors.textPrimary` | E-V1 (abscisse du titre : 64 contre 74) |
| 2 | A–G | Action / Fermer, cible (`I…;5544:4497`) | idem | `size/touch-target-min` ; en-tête `spacing/12` à gauche, `spacing/24` à droite | — | — | — | — | cible 48 × 48 à 12 du bord | `minTouchTarget` 48 par `hitSlop`, `dimensions.backAction` ; en-tête `spacing[24]` | E-V1 (centre du ✕ : 36 contre 43, en-tête partagé) |
| 3 | A–G | Fond circulaire (`I…;5544:4498`) | idem | `component/action/circular-visual-box` ; `color/observed/fcfcfe` ; effet « DSF / Effet observé / 01 » | — | fond #FCFCFE | #FFFFFF 1, intérieur | ombre portée #1A1A26 8 %, (0, 2), flou 10 | centré dans la cible | `dimensions.backAction.visualCircle` 38 ; fond `colors.selectionSurface` #E5F0FF | E-V2 (fond, contour et ombre) |
| 4 | A–G | Icône ✕ (`I…;6959:27983`) | `icon/fermer` `6959:15825` | `color/observed/14141a` | — | trait #14141A, 2,2 | — | — | 24 × 24 centré | `KodjoIcon` `control-close` → `assets/icons/icon-fermer.svg` (export exact `6959:15825`, trait #141414, 2,2), `dimensions.backAction.icon` 24 | **E-F2** (chevron → ✕) ; teinte #14141A de l'instance contre #141414 de l'export : E-V3 |
| 5 | A–G | Divider / Header — 1px (`I…;5544:4502`) | idem | `color/observed/dbe0e8-alpha-0-9` | — | #DBE0E8 90 % | — | — | sous l'en-tête | aucun `HeaderSeparator` dans l'Éditeur (T-49) | conforme : **masqué** (`visible: false`), non rendu (AC4) |
| 6 | A–G | Halo blanc — bouton Annuler (ellipse) | — | `color/background` | — | #FFFFFF | — | — | Ø 59,28, centre sur le centre du ✕ | `BACK_HALO_DIAMETER` 59,28, `colors.background`, concentrique au ✕ du code | conservé (T-49) ; position liée à E-V1 |
| 7 | A–G | Zone bleue — Nom de l'exercice et média (fond) | — | `spacing/12`, `spacing/24`, `spacing/16` ; dégradé (style maître « KODJO / DSF / Contexte / Lavande vers transparent ») | — | dégradé linéaire #EAEAFF 0 % → #EAEAFF 80 % → transparent 100 % | — | — | 402 × 115, marges 12 / 24 / 16 / 24, écart interne 0 | `colors.exerciseEditorContextBand` #EAEAFF, `dimensions.contextBand` (115, 12, 16), fondu sur 20 % (couches T-49) | conservé ; **E-F3** (marge 24 → 16 sous 390) ; écart interne Nom → accès : 0 contre `spacing[12]` (E-V4) |
| 8 | A | Champ Nom, placeholder (`I…;6981:14889`) | Champ — Nom de l'exercice `6981:14888` (État=Nom d'exercice — champ vide) | `radius/10` | Inter Semi Bold 20 / auto | #7A7A80 (sans variable) | — | — | 354 × 42, texte à 14 du bord | `type.screenTitle`, placeholder `colors.textSecondary` #595E66, `fixedRadii[10]`, hauteur min. 42, `dimensions.exerciseTextField.paddingHorizontal` 14 | E-V5 (#7A7A80 sans jeton) |
| 9 | B–G | Champ Nom, valeur | idem | `color/text-primary` | Inter Semi Bold 20 / 22 | #141414 | aucun liseré | — | idem | `type.screenTitle` (20/24), `colors.textPrimary` | E-V6 (interligne 22 contre 24, jeton verrouillé) |
| 10 | A, B | Accès Catégorie non renseigné | — | — | libellé « Catégorie » Inter Regular 13 / auto | fond #FFFFFF 35 %, icône et libellé #0508E5 | — | — | 103 × 26, rayon 13, marges 0 / 10 / 0 / 8, écart 6 ; zone tactile 113 × 48 | cercle 34 à icône seule, bordure `colors.primary` | E-V7 (rendu des accès : story 4.3, P35) |
| 11 | A, B, C | Accès Zones non renseigné | — | — | libellé « Zone corporelle » Inter Regular 13 / auto | idem | — | — | 139 × 26 ; zone tactile 149 × 48 | cercle 34, `BodyZoneIcon` 26 | E-V7 (4.3) |
| 12 | C–G | Accès Catégorie renseigné | — | `radius/16`, `spacing/6` (D–G) | Inter Regular 13 / auto | icône couleur de Catégorie (#8FB8FF), libellé #141414 | — | — | 111 × 20 | pilule bordée `colors.primary`, pastille 24, libellé `type.button` `colors.primary` | E-V7 (4.3) |
| 13 | D–G | Accès Zones renseigné | — | `radius/16` | Inter Regular 13 / auto | glyphe #0508E5, libellé #141414 | — | — | 127 × 20 | pilule, noms joints par « · », `type.button` | E-V7 (4.3) |
| 14 | — | Accès ouverts (icône pleine) | — | — | — | — | — | — | — | — | NON VÉRIFIABLE dans ces sept frames ; relevé en 4.3 (`8328:35810` et suivantes) |
| 15 | A–G | En-tête — Description de l'exercice (texte) | — | `color/text-secondary` | Inter Regular 11 / auto | #595E66 | — | — | écart 10 jusqu'au contenu | `type.sectionTitle` (Semi Bold 16/19), `colors.textPrimary` ; 13 jusqu'au champ (**E-F4**) | E-V8 (corrigeable par `type.caption` + `colors.textSecondary`, titre de section accepté en PRE-3) |
| 16 | A | Description, repos (« 1. » / « Décrivez la première étape ») | — | — | Medium 14 / Regular 14 | #AEB3BA | aucun cadre | — | — | champ multiligne : bordure 1 `colors.disabled`, `fixedRadii[8]`, `spacing[14]`, `type.exerciseFieldValue` ; placeholder du code de départ (P18, P34) | structure en étapes **non reprise** (P18) ; cadre et typographie : E-V9 |
| 17 | B–G | Description, valeur (étapes 1 à 4, « Étape suivante ») | — | `color/text-primary` | Regular 14 / auto ; numéros Medium 14 #595E66 | #141414 | — | — | écart 8 entre étapes | `type.exerciseFieldValue` (13/16), `colors.textPrimary` | non repris (P18) ; E-V9 |
| 18 | — | Description, saisie avec ↑ | — | — | — | — | — | — | — | ↑ 32, `colors.primary`, symbole `type.button` blanc (N-05) | NON VÉRIFIABLE (aucune frame) ; conservé |
| 19 | A–G | Libellé de section de la Carte | — | `color/text-secondary` ; écart `spacing/4` jusqu'au cadre | Inter Regular 11 / auto | #595E66 | — | — | 4 jusqu'au cadre | texte du lexique `Paramètres d’exécution` (Q11), `type.sectionTitle`, `colors.textPrimary` ; 13 jusqu'à la Carte (**E-F4**, règle D-327) | texte « Modalités d'exécution » non repris (Q11) ; typographie : E-V8 |
| 20 | A–G | Modalités — cadre appuyable | — | `spacing/12` (haut, bas), `spacing/4` | — | fond #F9FAFC (sans variable) | aucun | aucune | marges 12 / 24 / 12 / 24 ; rayon 12 | fond `colors.background`, bordure 1 `colors.border`, `fixedRadii[12]`, marges 12 / 14 | E-V10 (`colors.surfaceSubtle` #F9FAFC existe ; contour et marge latérale) |
| 21 | A, B, D, E | Carte vide — invite (« Phrase — consigne ») | — | — | Inter Regular 14 / 20 | #6B6E75 (sans variable) | — | — | une ligne | clé `executionParameters.card.emptyPrompt` (H22), style de la Phrase (13/20), `colors.textSecondary` | **E-F5** (invite ajoutée) ; taille 14 et teinte #6B6E75 : E-V11 |
| 22 | F, G | Carte — Phrase affichée (« Phrase — texte ») | — | — | Inter 14 / 20, valeurs et unités Semi Bold | #141414 | — | — | retour de ligne avant « Durée totale » | `type.exerciseFieldValue` + interligne 20, gras `Inter_600SemiBold`, `colors.textPrimary` ; retour de ligne de rendu (`presentationText`) | retour de ligne déjà conforme au départ ; taille 14 contre 13 (règle FR-02-06 / AC6 maintenue) : E-V12 |
| 23 | — | Carte — lignes Compte à rebours et Fin | — | — | — | — | — | — | — | séparateur 1 `colors.border` ; libellés `type.exerciseFieldValue` ; valeurs `type.editableValue` `colors.primary` sur `colors.surface` | NON VÉRIFIABLE (absentes de F, P17) |
| 24 | A–G | Bloc Médias, titre de section | — | — | — | — | — | — | — | « Médias » en `type.sectionTitle` | aucun titre dans les frames : E-V13 (à arbitrer avec 4.4) |
| 25 | A–G | Media / Gallery — Source exact (emprise) | — | `color/media/surface`, `radius/16`, `spacing/8` | — | #F5F7FA | — | — | 354 de large, marges 8, écart 8 | `galleryFrame` : `colors.mediaSurface`, `fixedRadii[16]`, `spacing[8]` | conforme ; tuiles : 4.4 |
| 26 | A, C–G | Terminer actif (« Valider ») | — | `color/primary`, `radius/24`, texte « Inter Semi Bold 14 », `color/on-primary` | Inter Semi Bold 14 / auto, centré | fond #0508E5, libellé #FFFFFF | — | ombre portée #1A1A26 18 %, (0, 2), flou 10 | 354 × 48 ; pied 12 (A) ou 7 / 24 / 24 / 24 | `colors.primary`, rayon 24, hauteur min. 48, `type.button`, `colors.background` ; pied N-05 conservé | E-V14 (ombre absente, aucun jeton d'ombre) |
| 27 | B | Terminer inactif | — | idem | idem | fond #0508E5 à opacité 0,4 | — | idem | — | fond `colors.disabled` #BEC2CC | E-V15 (rendu de l'état inactif ; la couleur des captures ne vaut pas règle, AC9) |
| 28 | G | Voile modal | — | `color/overlay/scrim` | — | #1F2129 34 % | — | — | plein écran | `colors.overlayScrim` | conforme |
| 29 | G | Overlay / Decision Dialog (carte) | `5544:6087` (État=Abandon) ; poignée **masquée** | effet « DSF / Effet observé / 05 », `radius/observed-18` | — | fond #FFFFFF | — | ombre portée #000 16 %, (0, 8), flou 24 | 354 × 194 | `DecisionDialog` : `dimensions.decisionDialog`, ombre 0,16 (0, 8) 24 | conforme |
| 30 | G | Dialogue — titre | idem | texte « Inter Semi Bold 18 » ; `color/observed/121212` | Inter Semi Bold 18 / auto | #121212 | — | — | — | `type.modalTitle` (18/22), `colors.dialogTitleText` #141414 | conforme (écart #121212 déjà consigné dans `ExerciseExitConfirmModal.tsx`) |
| 31 | G | Dialogue — message | idem | `color/observed/474d57` | Inter Regular 14 / 21 | #474D57 | — | — | — | `type.body` (14/17), `colors.textSecondary` (instance d'édition `3224:4140` acceptée en PRE-3) | texte « l'activité ne sera pas créé » non repris (Q18) ; typographie : E-V16 |
| 32 | G | Dialogue — `Annuler` | idem | — | Inter Semi Bold 16 / auto | fond #F3F4F6, libellé #292E38 | — | — | 147 × 48, rayon 24 | `colors.dialogNeutralActionBackground` #F5F7FA, `type.button` (14), `colors.dialogTitleText` | E-V16 |
| 33 | G | Dialogue — `Confirmer` | idem | `color/danger` | Inter Medium 16 / auto | fond #D92D20, libellé #FFFFFF | #D92D20 1 | — | 147 × 48, rayon 24 | `colors.dialogDestructiveActionBackground`, sans liseré (`confirmBordered={false}`), `type.button` | E-V16 |
| 34 | — | Dialogue d'abandon en modification | — | — | — | — | — | — | — | `ExerciseExitConfirmModal` PRE-3 (`3224:4140`) | NON VÉRIFIABLE (aucune frame parmi les sept) |
| 35 | — | Erreur d'enregistrement | — | — | — | — | — | — | — | `type.body`, `colors.danger`, centré au-dessus de `Terminer` | NON VÉRIFIABLE (aucune frame) |
| 36 | A–G | Contenu du formulaire (grille) | — | `spacing/16` (écart), `spacing/24`, `spacing/12` | — | — | — | — | marges 14 / 24 / 12 / 24, écart 16 | avant : haut 14, écart 16, titre → bloc 8 | **E-F4** : grille de D-327 appliquée (18 / 20 / 13 / 12) ; les chiffres de Figma ne sont pas repris (D-255) |

**Textes des captures non repris :** « Modalités d’exécution » (Q11) ; titres de frames « Ajouter un exercice — … » et « Création activité — … » (D-325) ; liste d'étapes « 1. Décrivez la première étape » / « Étape suivante » et étapes de démonstration (P18) ; message « Les informations saisies seront perdues et l'activité ne sera pas créé. » (Q18) ; données de démonstration « Squats sautés », « Renforcement », « Cuisses . Fessier », Phrase « 3 séries de 1 min 30 s… Durée totale : 5 min 15 s. » ; « 9:41 » (barre d'état) ; noms de calques « Valider », « Libellé — Rester en pause ».

**Écarts corrigés (E-F) :** E-F1 Description avant la Carte (P7) ; E-F2 ✕ circulaire par la prop locale `closeIcon` de `FixedHeader` ; E-F3 marge latérale 16 sous 390 (en-tête, zone de contexte, corps, `Terminer`, halo) ; E-F4 grille 18 / 20 / 13 / 12 ; E-F5 invite de la Carte vide (H22) ; E-F6 dialogue d'abandon en création (Q18) ; E-F7 bouton de Mode retiré (Q23) et clé `chooseMode` retirée.

**Écarts signalés à Hermann, non corrigés (E-V)** — chacun demanderait de changer un jeton verrouillé, un composant partagé ou un style accepté en recette PRE-3 :

- E-V1 — en-tête partagé : ✕ à 12 du bord dans Figma (centre 36), à 24 dans le code (centre 43) ; titre à 64 contre 74. Géométrie de `FixedHeader`, commune à tous les écrans.
- E-V2 — cercle du ✕ : fond #FCFCFE, contour blanc 1 et ombre « Effet observé / 01 » dans Figma ; fond `colors.selectionSurface` #E5F0FF sans contour ni ombre dans `FixedHeader`. Aucun jeton d'ombre ; #FCFCFE n'existe que comme `parametersSegmentedOption` (autre rôle).
- E-V3 — trait de l'icône ✕ : #14141A sur l'instance, #141414 dans l'export exact du maître.
- E-V4 — zone de contexte : écart interne 0 entre le champ Nom et la rangée des accès dans Figma, `spacing[12]` dans le code ; il place les accès, dont le rendu relève de 4.3.
- E-V5 — placeholder du Nom #7A7A80, sans jeton (code : `colors.textSecondary`).
- E-V6 — interligne de la valeur du Nom 22, jeton `type.screenTitle` à 24.
- E-V7 — accès Catégorie et Zones (non renseignés : pilule claire icône + libellé ; renseignés : sans contour, libellé #141414 Regular 13 ; écart Nom → accès) : rendu porté par la story 4.3 (P35).
- E-V8 — titres de section (Description, Paramètres d'exécution) : Inter Regular 11 #595E66 dans Figma, `type.sectionTitle` Semi Bold 16 `colors.textPrimary` dans le code. Corrigeable avec les jetons existants (`type.caption`, `colors.textSecondary`), mais style accepté en PRE-3 : arbitrage demandé.
- E-V9 — Description : champ bordé 13/16 dans le code, texte libre 14 sans cadre dans Figma (structure en étapes non reprise, P18).
- E-V10 — cadre de la Carte : fond #F9FAFC sans contour, marges latérales 24 dans Figma ; fond blanc, contour `colors.border`, marges 14 dans le code (test PRE-3 « carte bordée rayon 12 »). `colors.surfaceSubtle` #F9FAFC existe.
- E-V11 — invite : Inter Regular 14, #6B6E75 (sans jeton) dans Figma ; 13/20 `colors.textSecondary` dans le code.
- E-V12 — Phrase : Inter 14 dans Figma, 13 par la règle écrite (FR-02-06, AC6), maintenue.
- E-V13 — bloc Médias sans titre de section dans les frames ; « Médias » affiché par le code (à arbitrer avec 4.4).
- E-V14 — `Terminer` sans l'ombre portée #1A1A26 18 % des frames ; aucun jeton d'ombre.
- E-V15 — `Terminer` inactif : primaire à opacité 0,4 dans `8328:35740`, fond `colors.disabled` dans le code (et 0,4 ≠ `UNSELECTED_OPACITY` 0,45).
- E-V16 — dialogue d'abandon (`8328:36781`) : message 14/21 #474D57, actions 16 (`Annuler` Semi Bold #292E38 sur #F3F4F6, `Confirmer` Medium avec liseré) ; le code garde le rendu de l'instance d'édition acceptée en PRE-3 (`3224:4140` : message `type.body`, actions `type.button` 14, sans liseré) pour les deux textes. Les jetons de l'instance Séance (`type.dialogMessage`, `colors.dialogMessageText`, `type.dialogNeutralActionLabel`, `type.dialogDestructiveActionLabel`) existent.

### Réalisation (2026-10-18)

- `ActivityEditorForm.tsx` : Description avant la Carte (E-F1) ; section de la Carte réduite au titre et à la Carte, bouton `exercise-parameters-mode` retiré (E-F7) ; Carte vide (`mode === null`) : `exercise-parameters-empty-prompt` (clé `executionParameters.card.emptyPrompt`, E-F5), qui prend la place de la Phrase dans le libellé accessible, lignes Compte à rebours et Fin conservées ; `EDITOR_VERTICAL_GRID` (18 / 20 / 13 / 12) et `editorSideMargin` (24 à partir de 390, 16 en dessous, `useWindowDimensions`), appliqués au bandeau, au corps, à `Terminer` et à la position du halo (E-F3, E-F4). Halo, dégradé, clavier, Phrase et `presentationText` inchangés.
- `ScreenShell.tsx` (`FixedHeader`, partagé) : props locales optionnelles `closeIcon` (✕ `control-close`) et `horizontalPadding` ; sans elles, rendu inchangé (E-F2). `KodjoIcon.tsx` : `control-close` → `assets/icons/icon-fermer.svg` (export exact déjà déposé ; `manifest.json` : usage renseigné).
- `ExerciseScreen.tsx` : `EditorHeader` (✕, marge de l'Éditeur ; libellé `Retour` inchangé) dans les deux adaptateurs ; `ExerciseExitConfirmModal` reçoit `isCreation` (CC, CS) (E-F6). `ExerciseExitConfirmModal.tsx` : seuls le titre et le message changent selon `isCreation`.
- Lexique : `executionParameters.card.emptyPrompt` ajoutée, `chooseMode` retirée (AC14) ; `screens.exercise.exitConfirmModal.createTitle` / `createMessage` ajoutées (Q18).
- Fichiers non touchés : `tokens.ts` (`tokensSpecification.test.ts` vert), `migration001.ts`, garde-fous zéro `ScrollView`, Feuille.

**Correspondance des critères et des tests**

| AC | Preuve |
|---|---|
| AC1 | Relevé ci-dessus ; `ExerciseScreen.test.tsx` `PRE4-4.2/AC1` (séparateur masqué dans les sept arbres, non rendu ; halo et fondu présents) |
| AC2 | `ExerciseScreen.test.tsx` `PRE4-4.2/AC2` (CC, MC, CS, MS) |
| AC3 | `ActivityEditorForm.test.tsx` `PRE4-4.2/AC3` |
| AC4 | `ExerciseScreen.test.tsx` `PRE4-4.2/AC4` (×2 : quatre parcours, ✕ annoncé `Retour`, halo centré sur le ✕ rendu ; géométrie du ✕) et `PRE4-4.2/AC4 AC5` |
| AC5 | `ActivityEditorForm.test.tsx` `PRE4-4.2/AC5` (360, 390, 402, 440 par largeur simulée) ; `ExerciseScreen.test.tsx` `PRE4-4.2/AC4 AC5` (quatre parcours à 360, 390, 440 : padding reçu par `FixedHeader` = `editorSideMargin(width)`, halo cohérent) et `PRE4-4.2/AC5` (erreur de chargement MC) ; géométrie : R-4.2-06 |
| AC6 | `ActivityEditorForm.test.tsx` `PRE4-4.2/AC6` (Carte vide), `PRE4-4.2/AC6` (aucune invite avec Mode validé), `PRE4-4.2/AC6 AC14` (Phrase unique, retour de ligne, focus unique) ; phrase longue : `PRE4-2.3/AC15` |
| AC7 | `ActivityEditorForm.test.tsx` `PRE4-4.2/AC7` (et N-05 conservés) |
| AC8 | `ActivityEditorForm.test.tsx` `PRE4-4.2/AC8` (et N-05 conservé) |
| AC9 | `ExerciseScreen.test.tsx` `PRE4-4.2/AC9` |
| AC10 | `ExerciseEditingPaths.integration.test.tsx` `PRE4-4.2/AC10` (CC : base réelle, `failOnWrite` ; CS : appuis répétés sur `Terminer`, `Continuer`, `Enregistrer` → une seule Copie) ; `ExerciseScreen.test.tsx` `PRE4-4.2/AC10` |
| AC11 | `ActivityEditorForm.test.tsx` `PRE4-4.2/AC11` (rendus) ; `ExerciseScreen.test.tsx` `PRE4-4.2/AC11` (modification, abandon, erreur) ; recette R-4.2-01 à 05 |
| AC12 | `ExerciseScreen.test.tsx` `PRE4-4.2/AC12` (quatre parcours ; intention de la route en Séance) ; `ExerciseEditingPaths.integration.test.tsx` `PRE4-4.2/AC12` (navigation réelle : CC, CS, MC, MS) |
| AC13 | `ActivityEditorForm.test.tsx` `PRE4-4.2/AC13` (styles rendus : opacités `UNSELECTED_OPACITY` ou 1, hors couches du dégradé T-49) ; `tokensSpecification.test.ts` inchangé et vert ; écarts E-V listés |
| AC14 | `ActivityEditorForm.test.tsx` `PRE4-4.2/AC14`, `PRE4-4.2/AC6 AC14` ; `src/shared/i18n/index.test.ts` (clé retirée) |

Report de 4.1 (AC10) : quatre tests `PRE4-4.1/AC10` ajoutés (Cible à l'échec saisie par la roue de cellule ; tests de départ conservés). Report Q29 (3.2 AC10) : test `PRE4-3.6/AC9 — Q29 (report de 3.2 clos en 4.2)`. Tests de départ adaptés à Q23 sans retrait de critère : `PRE4-1.1/AC21`, `PRE4-2.3/AC15` (absence du bouton au lieu de sa présence), `P3-20/all-surfaces` (invite au lieu de « Choisir un mode », style 13 / 20 vérifié sur l'invite), `index.test.ts` (clés du lexique).

### Correctifs de revue (2026-10-18)

- `ExerciseScreen.tsx` : le corps d'erreur de chargement (MC) suit `editorSideMargin` ; en Séance, `isCreation` du dialogue dérive de l'intention de la route (aucun `exerciseId`, ou `new`), un `exerciseId` absent du Brouillon restant une modification.
- `ActivityEditorForm.tsx` : libellé accessible de la Carte vide — l'invite est close par un point avant « Compte à rebours » (R-4.2-01 mis à jour).
- Tests : AC4 et AC4 AC5 étendus aux quatre parcours, padding reçu par `FixedHeader` et centre du halo comparés dans le même rendu (assertions tautologiques retirées) ; ✕ annoncé `Retour` asserté (choix en attente, Q48) ; AC9 : nom d'espaces seulement, `maxLength` 80 ; AC11 : tuile de Média par identifiant ; AC13 : opacités des styles rendus au lieu d'un balayage du source ; `renderAtWidth` rétablit la largeur même en cas d'exception ; AC10 en Séance (appuis répétés) et AC12 par navigation réelle en CS et MC ; report 4.1 AC10 en CC et CS avec tous les Paramètres de AC10 (`toEqual`) ; Q29 : panneaux fermés aussi par toucher extérieur, Ordre des côtés couvert.
- **Antériorité du relevé** : le relevé AC1 a été consigné avant toute modification de `src/` dans la session de réalisation, mais il arrivera dans le même commit local que le code ; aucune preuve d'antériorité n'existe au-delà du processus suivi.
- **E-F4 change un espacement accepté en PRE-3** : la grille appliquée (18 en tête du corps, 13 / 20 entre titres et blocs, 12 avant `Terminer`) remplace les 14 / 16 / 8 du code PRE-3. Elle applique AC4 et AC5, mais modifie un rendu accepté en recette PRE-3 : soumis à Hermann (Q48).

## Spec Change Log

- 2026-10-18 — **Retour de ligne avant « Durée totale »** : listé comme écart dans l'Intent et le bilan §4.2, il est déjà réalisé au départ (`presentationText`, phrase v1 §5, test « phrase v1 §5 »). Aucun changement de code ; preuve ajoutée par `PRE4-4.2/AC6 AC14`.
- 2026-10-18 — **« 12, bloc → bloc sans titre » (D-327)** : la seule relation de ce type sur l'écran est Médias → `Terminer` ; appliquée là (bas du corps 12, ancienne marge haute de 8 du pied retirée). Lecture à confirmer par Hermann (R-4.2-06).
- 2026-10-18 — **18 et 13 sans jeton d'espacement** : constantes nommées `EDITOR_VERTICAL_GRID` dans l'Éditeur, valeurs de la règle écrite (D-327, FR-02-03, FR-02-04) ; `tokens.ts` intouché (AD-11).
- 2026-10-18 — **Marge de l'en-tête** : FR-02-04 vaut pour tout l'écran ; le ✕ passe par la prop locale `closeIcon`, et la marge par une seconde prop locale, `horizontalPadding`, de `FixedHeader` ; les autres écrans ne la passent pas (inchangés). Le halo suit la marge pour rester concentrique.
- 2026-10-18 — **Écarts visuels corrigeables avec des jetons existants** (E-V8 titres de section, E-V10 cadre de la Carte, E-V16 dialogue, etc.) : ils portent sur des styles acceptés en recette PRE-3 ; selon la consigne de cette story, ils sont listés et signalés, non corrigés.
- 2026-10-18 — **Libellé accessible du ✕** : `Retour`, texte du code de départ, conservé (FR-22-07 n'exige qu'un libellé ; « Fermer » serait un texte nouveau). Point soumis à Hermann.
- 2026-10-18 — **Dialogue en création** : seuls titre et message changent (Q18) ; rendu de l'instance d'édition acceptée (`3224:4140`) conservé, la typographie de `8328:36781` étant inscrite en E-V16.
- 2026-10-18 — **Carte vide** : l'invite prend le style de la Phrase (13 / 20) atténué par `colors.textSecondary` ; les lignes Compte à rebours et Fin restent affichées, comme le veut la composition du libellé accessible d'AC6.
- 2026-10-18 — **Sources contraires à Q23** : `DSF-PHRASES-V15-2026-10-07.md` l. 15 et ch. 13 l. 572 (copies `caa2a5cf`) décrivent encore « le champ à droite de Paramètres d'exécution [qui] affiche le mode ». Q23 (décision de Hermann) prévaut ; aucun document modifié.
- 2026-10-18 — **Q55 : invite de la Carte vide retirée** (décision de Hermann, recette E-21 : « il ne doit pas s'afficher ») : l'invite H22 « Appuyez pour définir les séries et les durées » n'est plus affichée ni annoncée ; la Carte vide est rendue comme en PRE-3. Exigences alignées : PRD FR-02-06 (note Q55, H22), story 4.2 AC6 dans `epics-parts/epic-4.md` et `epics.md`.

## Review Triage Log

Revue du 2026-10-18 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V). Correctifs appliqués par l'implémenteur ; Q48 ouverte et Q23 annotée par Claude.

| Constat | Verdict | Route |
|---|---|---|
| V1 — ✕ et marge de l'en-tête non testés côté Catalogue (CC, MC) | medium | patch (quatre parcours, halo dans le même rendu) |
| E1 — erreur de chargement MC : marge 24 sous 390 | low | patch |
| E2 — `exerciseId` introuvable en Séance : dialogue de création | medium | patch (`isCreationRoute`) |
| E3 — `Dimensions` non restauré si le rendu lève | low | patch |
| B1 — libellé de la Carte vide sans ponctuation | low | patch |
| B2 — test Média AC11 qui attrape le conteneur | medium | patch |
| B3/E6 — report 4.1 AC10 incomplet en CC et CS | medium | patch (`toEqual` des paramètres AC10) |
| B4/E5 — Q29 : fermeture extérieure et panneau Ordre non prouvés | low | patch |
| B5 — commentaire contraire à l'assertion (4.1 AC2) | low | patch |
| B6 — points ouverts absents de `questions-ouvertes.md` | medium | patch (Q48, note Q23) |
| B7 — libellé « Retour » du ✕ non épinglé | low | patch |
| B8 — assertions tautologiques AC5 / AC8 | low | patch |
| B9 — AC10 / AC12 non couverts en CS / MC par vraie navigation | low | patch |
| B10 — nom fait d'espaces ; `maxLength` | low | patch |
| B11 — `deferred-work.md` : evidence périmée | low | patch |
| B12 — antériorité du relevé AC1 non prouvable | low | patch (consigné) |
| B13 — Code Map avec un emplacement à chercher | low | patch |
| B14 — AC13 par regex du source | low | patch (styles rendus) |
| B15 — E-F4 change un espacement accepté en PRE-3 | low | patch (soumis à Hermann, Q48) |
| E4 — `gap` de la section Médias sur des enfants internes | low | rejeté (la liste rend une seule racine) |


## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
