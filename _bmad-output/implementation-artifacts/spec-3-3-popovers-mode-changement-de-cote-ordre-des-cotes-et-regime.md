---
title: 'Story 3.3 — Popovers Mode, Changement de côté, Ordre des côtés et Régime'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: '838cbb56f2a004b426b6047f21366b506e2ec4ca'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-3.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/questions-ouvertes.md'
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Une partie de la story 3.3 est déjà livrée par l'essai de la story 3.1 et par les décisions de recette de Hermann (Q35 à Q42, `questions-ouvertes.md`) :
- popover natif du Mode ;
- panneaux `AnchoredPanel` sans flèche, avec le `SegmentedControl` accepté, pour le Changement de côté et l'Ordre des côtés ;
- Ordre masqué à N = 1 ;
- sélection unique, sans liseré et sans mouvement du texte ;
- lignes de 44 pt.

Il reste :
- le champ Régime, qui remplace l'interrupteur « Séries variables » ;
- les ± affichés à l'appui seulement sur les valeurs hors tableau, avec un seul champ actif ;
- l'état d'une seule surface ouverte ;
- `—` pour un Changement de côté non renseigné ;
- `UNSELECTED_OPACITY` ;
- le repli Android et web.

**Approach:** Implémenter la **story 3.3 (AC1 à AC11, `epics-parts/epic-3.md`)**, telle que réécrite par Q38 à Q42, en se limitant à l'écart restant. Ce qui est conforme et validé par Hermann est réutilisé sans y toucher. On commence par le relevé visuel exigé par les règles communes de l'epic.

**Décision de cohérence (Claude, 2026-10-17, application de Q41 sans redemander, consignée en Q43) :** sur iOS, le champ de Régime s'ouvre dans le même `AnchoredPanel` sans flèche, sous le champ et aligné à droite, avec le `SegmentedControl` accepté (`identiques`, `variables` et leurs sous-titres), comme le Changement de côté et l'Ordre. Seul le Mode garde le popover natif avec sa flèche, validé par Hermann.

## Boundaries & Constraints

**Always:**
- Réutiliser sans modification ce qui est conforme et validé :
  - le popover natif du Mode (`NativeRowPopover`, `ModePopoverOptions`) ;
  - `AnchoredPanel` ;
  - `SheetMotion` (révélation par le bas, Q41) ;
  - la sélection par calque (Q40, Q41) ;
  - `SHEET_ROW_MIN_HEIGHT` (Q42) ;
  - la sélection unique du tableau (Q40) ;
  - Q38 (Ordre masqué à N = 1).
- Ne modifier ni `InlineStepper`, ni `ProfileStepper`, ni `createHoldRepeater`, ni les politiques `EXECUTION_*` (AD-16). Les ± à l'appui s'obtiennent en **enveloppant** `InlineStepper` dans un état ouvert ou fermé, sur le modèle `isOpen`/`onToggle` de `ProfileStepper`. Au repos, seule la valeur est visible. À l'appui, − et + apparaissent à sa droite, et la valeur se décale d'une translation constante.
- Un seul champ ouvert dans toute la Feuille (AD-15) : un état d'interface `openSurface` (popover, panneau ou champ ±), jamais dans le Brouillon du domaine. Les transitions sont celles de l'AC8 : T10, T15 à T17, T19, T20, T22 et T23. Les ± d'un champ ouvert ne le referment jamais. Un toucher extérieur le range, sans bouton Annuler.
- Le champ Régime : à N = 1, il n'est pas modifiable (état uniforme, P16). En `variables`, le chevron garde ses trois états (identiques sans chevron, variables déployé, variables replié). Le comportement du Brouillon est inchangé (`setVariable`, story 3.2).
- `UNSELECTED_OPACITY` (0,45) dans `src/shared/ui/opacity.ts`, hors jetons, remplace la constante locale de la Feuille (AD-11).
- Repli Android et web : le `SegmentedControl` en ligne pour Mode, Côté, Ordre et Régime, dans le cadre de sélection, avec une parité testée.
- Le lexique pour tout texte nouveau ; l'apostrophe `’`.
- Les garde-fous zéro `ScrollView` intacts.

**Never:**
- Aucune réimplémentation du segmenté, des steppers ni des roues. Aucun jeton modifié. Aucune refonte du tableau (3.6), du Sélecteur de cible (3.4, 3.5) ni de la ligne Durée totale (3.7).
- Ne pas retravailler l'ergonomie fine validée et réservée par Hermann à une session dédiée : durées, courbes, présentation des panneaux.

</frozen-after-approval>

## Code Map

- `src/features/activities/ExecutionParametersSheet.tsx` : ligne Séries et `Switch` des séries variables (à remplacer par le champ Régime) ; lignes N, Pauses, Pause entre les côtés, Bip, Compte à rebours et Fin (`InlineStepper` toujours ouverts, à mettre en ± à l'appui) ; `openControl`/`closingControl` (à étendre en `openSurface` à surface unique, en conservant les comportements validés Q40 et Q41) ; `pauseLabel` (le littéral `"0 s"` peut passer par `formatPhraseDuration`) ; libellé du Côté non renseigné (`—`, AC9) ; style `withoutEffect` (à remplacer par `UNSELECTED_OPACITY`).
- `src/shared/ui/ProfileStepper.tsx` : `InlineStepper`, `ProfileStepper` (`isOpen`/`onToggle`), `steppedValue`, politiques ; en lecture seule.
- `src/features/activities/AnchoredPanel.tsx`, `SheetMotion.tsx` ; `src/shared/ui/SegmentedControl.tsx` (inchangé).
- `src/shared/i18n/` : libellés du Régime (`identiques`, `variables`, sous-titres « toutes les séries ont la même valeur » et « chaque série a sa propre valeur ») ; vérifier ceux qui existent déjà.
- Tests : `src/features/activities/__tests__/ExecutionParametersSheet.test.tsx` ; helper `src/features/activities/testing/executionSheetActions.ts` et tests d'intégration qui l'utilisent (`CategoriesSaveFlow`, `CompositionExerciseFlow`, `ExerciseEditorNoWrite`, `ExerciseScreen`, `ExerciseEditingPaths`). Tout test qui actionne l'ancien interrupteur ou des ± toujours visibles doit passer par un helper partagé, ajouté au même module.
- Relevé visuel : `docs/preparation/PRE-4/figma/<frame>.json.gz` des frames de la story et `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/preparation/PRE-4/figma/fermeture-maitres-et-variables.json.gz`. Le consigner dans les Implementation Notes : une ligne par élément et par état, sans chiffre devenu règle.

## Tasks & Acceptance

**Execution:**
- [x] Relevé visuel des frames de la story, dans les Implementation Notes.
- [x] Champ Régime (panneau sans flèche sur iOS, segmenté sur Android et web) à la place de l'interrupteur -- AC2, AC6.
- [x] ± à l'appui sur les valeurs hors tableau, un seul champ actif, transitions T10, T15 à T17, T19, T20, T22 et T23 -- AC7, AC8.
- [x] `—` pour le Côté non renseigné ; `UNSELECTED_OPACITY` ; repli Android et web -- AC9, AC11.
- [x] Tests `PRE4-3.3/ACn` (AC1 à AC11). La preuve Q29 reportée par la story 3.2 n'est pas jouable par l'interface de 3.3 (aucun retrait dans la Feuille avant 3.6) : l'entrée de `deferred-work.md` reste pour la story 3.6, annotée.
- [x] `docs/preparation/PRE-4/bmad/questions-ouvertes.md` : ligne Q43 (Régime dans le même panneau que le Côté et l'Ordre, par cohérence avec Q41). `recette-iphone.md` §4.3 : R-3.3-01 à 06, adaptés à Q38 à Q43.

**Acceptance Criteria:**
- Given la story 3.3 de `epics-parts/epic-3.md` et les décisions Q35 à Q43, when elle est livrée, then chacun de ses critères AC1 à AC11 est vérifié par un test nommé ; les comportements validés par Hermann sont inchangés ; `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Implementation Notes

### Relevé visuel (règles communes de l'epic ; D-255, D-300 : aucun chiffre lu ne devient une règle)

Source : `docs/preparation/PRE-4/figma/<frame>.json.gz` (11 frames de la story) et `sources-caa2a5cf/.../fermeture-maitres-et-variables.json.gz` (noms des maîtres et des variables). Géométrie relevée à 402 pt, en positions relatives au groupe Paramètres (x 24, largeur 354). « Jeton retenu » : jeton existant de `tokens.ts` utilisé par le code ; aucun jeton modifié.

| Frame et état | Élément (nœud) | Maître et variante | Style ou variable | Police | Couleurs | Contour | Ombre et effets | Espacements relatifs | Jeton retenu | Écart |
|---|---|---|---|---|---|---|---|---|---|---|
| `8328:36923` champs vides | Groupe Paramètres (`8328:36997`) | — | `color/surface-subtle` | — | `#F9FAFC` | `#FFFFFF` 1 | — | rayon 12 ; lignes de premier niveau à 12 du bord, indentées à 28 | `surfaceSubtle`, `fixedRadii[12]` | contour blanc 1 non rendu (code PRE-3 accepté) |
| `8328:36923` champs vides | Valeur Mode « — » (`8328:36999`) | `Texte=13, État=Normal` (Valeur modifiable) | `color/surface`, `color/primary` | Inter Semi Bold 13 | fond `#F5F7FA`, texte `#0508E5` | — | — | marges 4 / 10, rayon 10, alignée à droite | `surface`, `primary`, `type.editableValue` | — |
| `8328:36923` champs vides | Valeur Changement de côté « — » (`8328:37008`) | idem | idem | idem | idem | — | — | idem | idem | AC9 livré : « — » (le code PRE-3 affichait « Sans changement ») |
| `8328:36923` champs vides | Valeur Régime « identiques » (`8328:37016`) | idem | idem | idem | idem | — | — | juste après le libellé « Séries » (12 à 402) ; N à droite | idem ; écart libellé/champ `spacing[8]` (gap de la ligne) | écart de 8 au lieu de 12 (gap existant de la ligne, non tiré de Figma) |
| `8328:36923` champs vides | Valeurs N « 1 série », Pause « 0 s », Bip « Aucun », Compte à rebours, Fin (`8328:37017` à `:37021`) | idem | idem | idem | idem | — | — | au repos, valeur seule, alignée à droite | idem (`RevealStepper` fermé = même pastille) | — |
| `8328:37760` série en durée | Mêmes valeurs au repos (`8328:37856` à `:37861`) | idem | idem | idem | idem | — | — | idem | idem | aucune frame ne montre un champ ± ouvert : état ouvert `NON VÉRIFIABLE` ; `InlineStepper` (accepté) place − à gauche et + à droite de la valeur, pas « − et + à droite » (voir Écarts) |
| `8328:37092` Mode (popover) | Cadre sélectionné — Mode (`8328:37167`) | — | non lié | — | `#F4F4FF` | — | — | rayon 12, pleine largeur du groupe | `stepperSurface` (`#F2F2FF`, Q40) | teinte voisine ; repère d'accent `8328:37168` (3 × 26, `#0508E5`) non rendu depuis Q40 (« sans liseré ») — signalé |
| `8328:37092` Mode (popover) | Popover — Mode (`8328:37197`) | — | non lié | Inter Medium 15 (choisie), Regular 15 | fond `#F6F6F9`, choisie `#0508E5`, autre `#141414` | `#C7C7D1` 70 % 1 | — | 184 × 99, options 40, rayon 16 | `Popover` SwiftUI natif (rendu système, P33) | rendu natif prime ; inchangé (3.1 validé) |
| `8328:38513` Mode (popover), variables | Popover Mode (`8328:38623`) ; Régime « variables » (`8328:38616`) ; chevron (`8328:38617`, `État=Déployé, Cadre=Non`) | Valeur modifiable ; Repli | `color/category-action/create-border` (chevron) | Semi Bold 13 | chevron `#8283F2` | — | — | chevron juste après le champ de Régime | `DisclosureControl` inchangé | — |
| `8328:38513` | Groupe — Séries variables (`8328:38589`) | `DSF / Forms / Encadré de groupe` | — | — | `#F9FAFC` | — | — | commence sous la ligne « Séries » | `variableGroup` (Q40) | le groupe ne contient plus de ligne d'interrupteur (retirée, FR-04-01) |
| `8328:37972` Côté (popover) | Cadre sélectionné — Changement de côté (`8328:38055`) | — | non lié | — | `#F4F4FF` | — | — | rayon 12 | `stepperSurface` | idem `37092` |
| `8328:37972` Côté (popover) | Popover — Changement de côté (`8328:38075`) | — | non lié | Medium / Regular 15 | `#F6F6F9`, `#0508E5`, `#141414` | `#C7C7D1` 70 % | — | liste verticale 3 × 40, sous la ligne, alignée à droite | Q41 : `AnchoredPanel` + `SegmentedControl` accepté (fond `background`, rayon 12, ombre) | présentation remplacée par Q41 (segmenté dans le panneau, pas une liste) — décision de Hermann |
| `8328:38953` Ordre (popover) | Popover (`8328:39064`), options avec sous-titres | — | `color/text-tertiary` (sous-titres) | Medium / Regular 15 ; sous-titres Regular 11 | sous-titres `#7A7A80` | `#C7C7D1` 70 % | — | 252 × 117, options 49 | Q41 : segmenté « Paramètres » 60 min (D-341) dans le panneau | idem Q41 |
| `8328:38193` un côté après l'autre | Ligne Ordre (`8328:38290`), valeur (`8328:38291`) | Valeur modifiable Normal | idem | Semi Bold 13 | idem | — | — | ligne indentée | idem | — |
| `8328:38301` les deux côtés | Valeur Ordre « Les deux côtés à chaque série » (`8328:38376`) | idem | idem | idem | idem | — | — | idem | idem | — |
| `8328:39390` Régime (popover) | Popover — Mode des séries (`8328:39493`) : `identiques` / « toutes les séries ont la même valeur », `variables` / « chaque série a sa propre valeur » | — | `color/text-tertiary` | Medium / Regular 15 ; Regular 11 | `#F6F6F9`, `#0508E5`, `#141414`, `#7A7A80` | `#C7C7D1` 70 % | — | 252 × 117, ancré sous le champ de Régime (x 90) | Q43 : même `AnchoredPanel` + segmenté que le Côté et l'Ordre (largeur de la ligne) | Figma : bulle ancrée sous le champ, à gauche ; livré : panneau pleine largeur sous la ligne (cohérence Q41/Q43) — à juger sur iPhone |
| `8328:39390` Régime (popover) | Ligne « Séries » sélectionnée | — | — | — | aucun cadre sélectionné dans la frame | — | — | — | `stepperSurface` (AC7, sélection de la ligne déclenchante) | Figma ne montre pas le fond de sélection sur cette frame |
| `8328:39181` variables replié | Chevron (`8328:39274`, `État=Replié, Cadre=Non`) ; Régime « variables » | Repli ; Valeur modifiable | `color/observed/8282f2` | — | `#8282F2` | — | — | — | `DisclosureControl` inchangé | — |
| `8328:39072` une seule série | Régime « identiques » (`8328:39174`) | Valeur modifiable `État=Normal` | — | Semi Bold 13 | `#0508E5` | — | — | — | `UNSELECTED_OPACITY` sur le champ (AD-11, P16) | Figma : non atténué ; livré : atténué 0,45 (non modifiable, remplace la constante locale) — signalé |
| `8328:39072` une seule série | Ligne Ordre grisée (`8328:39161`, op. 0,45 ; valeur `État=Grisé`, `#BEC2CC`) | Valeur modifiable Grisé | `color/disabled` | — | — | — | — | — | — | remplacé par Q38 : ligne masquée à N = 1 |

**`NON VÉRIFIABLE` (absents de Figma) :** champ ± ouvert sur une valeur hors tableau (aucune frame) ; panneau sans flèche (Q41, Q43 : aucun composant Figma) ; fond de sélection de la ligne « Séries » pendant le Régime ouvert.

### Ce qui a été livré

- `src/features/activities/sheetSurface.ts` (nouveau) : réducteur pur `sheetSurfaceReducer` de la surface unique (`popover(mode|side|order|regime)`, `selector(commonTarget|total)`, `stepper(count|pause|sideRecovery|beep|countdown|end)`), clé croissante, règles T7, T8, T10, T15 à T17, T19, T20, T22 à T24, D-4 (`choose` / `closed`) et Q38 (`prune`). Il remplace `openControl` / `closingControl` dans la Feuille. `activeCell` et `selector(rowTarget)` restent pour 3.6.
- `ExecutionParametersSheet.tsx` :
  - ligne `Séries` = libellé, champ de Régime (+ chevron en `variables`), nombre ; interrupteur `Switch` et ligne « Séries variables » retirés ; panneau `regime` (iOS, Q43) ou segmenté en ligne (Android, web) ; choix par `setVariable` inchangé ;
  - `RevealStepper` (local) enveloppe `InlineStepper` sans le modifier : fermé, pastille de valeur (`-toggle`, `-value`) ; ouvert, `InlineStepper` à 137, dans un conteneur qui retient le toucher (un ± à la borne ne ferme pas le champ, T22) ;
  - appui extérieur (T23) : l'hôte des panneaux devient un `Pressable` non accessible qui émet `outside` (ne range qu'un champ ±) ;
  - `—` pour un Changement de côté non renseigné, segmenté sans valeur choisie ; `pauseLabel` passe par `formatPhraseDuration` (y compris « 0 s ») ;
  - `UNSELECTED_OPACITY` (`src/shared/ui/opacity.ts`, nouveau) remplace `withoutEffect` ; il atténue le champ de Régime à N = 1 ; la pastille `ValuePill` désactivée ne change plus la couleur de son texte ;
  - Q40 : le tableau n'est surligné que si aucune surface n'est ouverte (passage en `variables` : fond du tableau après la fermeture du panneau du Régime).
- Lexique : `regime`, `regimes`, `regimeSubtitles`. La clé `variable` reste (plus utilisée par la Feuille).
- Tests : `sheetSurface.test.ts` (14 tests, transitions) ; bloc `ExecutionParametersSheet — PRE-4 story 3.3` (AC1 à AC11, 22 tests) ; helpers partagés `openExecutionSheetField`, `tapExecutionSheetStep`, `chooseExecutionRegime` dans `testing/executionSheetActions.ts`, utilisés par la Feuille et les tests d'intégration (`ActivityEditorForm`, `ExerciseScreen`, `ExerciseEditorNoWrite`, `ExerciseEditingPaths`). Les tests Android qui enchaînaient deux sélecteurs touchent désormais deux fois (T10). `T-53` (Switch centré) remplacé par le centrage de la ligne « Séries ».

### Corrections après revue (2026-10-17)

- `RevealStepper` : focus VoiceOver sur le champ ouvert (`AccessibilityInfo.sendAccessibilityEvent(vue, "focus")`), fermeture accessible (échappement, Magic Tap, action « Fermer » du lexique) avec retour du focus à la valeur ; même cadre fermé / ouvert ; cible de 44 × 44 au moins.
- Zone d'appui extérieur (T23) étendue aux marges du corps (`execution-sheet-body-outside`).
- Le ± de la Cible commune Répétitions (stepper permanent jusqu'à 3.5) ferme la surface ouverte.
- Re-choisir `variables` ne déplie plus un tableau replié (seul un passage effectif agit).
- `ValuePill` indisponible : atténuée par `UNSELECTED_OPACITY` et responder sans effet (l'appui ne range plus un champ ±).
- La ligne `Séries` est dans le groupe du tableau (fond Q40) ; la position du panneau du Régime en tient compte.
- `prune` documenté comme défense ; test `PRE4-Q38 (c ter)` renommé ; lexique : espace après `showTable:`, clé `variable` supprimée, clé `closeField` ajoutée ; READMEs `src/features/activities` et `src/shared/ui` créés.
- Tests ajoutés : D-4 du Régime (iOS et Android), sélection de chaque ligne de champ ±, VoiceOver, zone extérieure, tableau neutre et glisser, Cible Répétitions, re-choix de `variables`.

### Écarts et points à juger par Hermann (P33, NFR-04)

1. **± « à droite » de la valeur (AC8).** `InlineStepper`, accepté et non modifiable (AD-16), place − à gauche et + à droite de la valeur. Après revue : fermé et ouvert partagent le même cadre (largeur 137, valeur centrée, hauteur minimale 44), si bien que la valeur ne bouge pas (Q41) et que la zone de toucher fermée fait au moins 44 × 44 (NFR-09) ; la pastille fermée n'est donc plus collée au bord droit. Le libellé « − et + apparaissent à sa droite » n'est donc pas littéralement tenu sans modifier `InlineStepper`. Aucune frame ne montre l'état ouvert.
2. **T10 sur Android et web.** Un popover ou une roue en ligne ouvert, toucher un autre champ le ferme sans ouvrir le champ touché, comme sur iOS (table AD-15 appliquée uniformément ; parité AC11). Auparavant, sur Android, l'autre champ s'ouvrait dans le même geste.
3. **Régime à N = 1 atténué** (0,45), alors que `8328:39072` le montre normal.
4. **Panneau du Régime pleine largeur** sous la ligne `Séries` (Q43), alors que la bulle Figma est ancrée sous le champ, à gauche.
5. **Barre d'accent de la ligne active** (repère `#0508E5`) toujours absente (sélection Q40/Q41 validée sans elle).
6. **Q29 (3.2 AC10).** Aucun retrait de ligne dans la Feuille avant 3.6 : la preuve par l'interface reste dans `deferred-work.md` pour 3.6. Le réducteur ne touche jamais le Brouillon (`sheetSurface.ts`), ce que vérifie la conception, pas un test d'écran.
7. **H13 (focus rendu au déclencheur)** : non vérifiable sous Jest ; recette R-3.3-06 et 3.8.

## Spec Change Log

## Review Triage Log

Revue du 2026-10-17 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V).

| Constat | Verdict | Preuve | Route |
|---|---|---|---|
| B4/E4 — VoiceOver : focus perdu à l'ouverture d'un champ ±, aucun moyen accessible de le ranger | high | `RevealStepper` démonte le bouton focalisé | patch |
| B5 — la valeur se déplace latéralement à l'ouverture d'un champ ± | medium | Contraire à Q41 (aucun mouvement du texte) | patch |
| B6 — pastille fermée sous 44 pt de large | medium | `hitSlop` vertical seulement ; NFR-09, Q42 | patch |
| B3 — zone de toucher extérieur incomplète | low | Seul `panel-host` est couvert | patch |
| B12 — corps entier dans un `Pressable` : glisser non testé | low | | patch (test) |
| E1 — Cible commune Répétitions hors de la surface unique | medium | Stepper toujours visible (3.5) | patch |
| E2 — re-choisir `variables` déplie un tableau replié | low | | patch |
| E6 — pastille Régime désactivée : l'appui remonte et ferme un champ ouvert | low | | patch |
| E7 — le groupe sélectionné ne couvre plus la ligne Séries | low | En Q40, l'interrupteur faisait partie du groupe | patch |
| B11 — atténuation `disabled` retirée de `ValuePill` | low | Seul le Régime est atténué | patch |
| B1/V3 — `prune` inatteignable, titre de test trompeur | low | T10 ferme d'abord la surface | patch (commentaire, renommage) |
| V1 — sélection unique pendant le cadre D-4 du Régime non testée | medium | | patch (test) |
| V2 — fond de sélection des champs ± testé pour le Bip seulement | low | | patch (test) |
| B9/E9 — lexique : espace manquant, clé orpheline, libellés de tests périmés | low | | patch |
| B10 — READMEs non mis à jour | low | Règle d'`AGENTS.md` | patch |
| B7 — Q43 présentée comme décision sans arbitrage de Hermann | low | Hermann a demandé d'appliquer ses décisions par cohérence sans redemander ; la frame `8328:39390` diffère | patch documentaire (Q43 révisable par Hermann, ordre corrigé) |
| B8 — écarts visuels absents de `questions-ouvertes.md` | low | Ergonomie réservée par Hermann à une session dédiée | patch documentaire (liste de points à juger, non ouverts) |
| B2 — Android et web : pas de fermeture par toucher extérieur pour les sélecteurs en ligne | low | Plateformes non recettées (Q5) ; le comportement en ligne est celui d'avant | rejeté (faible) |
| E3 — Android : toucher pendant le cadre D-4 sans effet | low | Conforme à T10 (AD-15) | rejeté |
| E5 — son de clic Android sur le corps | low | Plateforme non recettée | rejeté |
| E8 — T10 change le passage en un geste | false | Sur iOS, depuis Q41 validée par Hermann, un toucher extérieur ferme le panneau sans ouvrir le champ ; seul Android change, conformément à AD-15 | rejeté (noté en recette) |
| B13 — patch sans `deferred-work.md`, sprint ni spec | false | Fichiers de l'orchestrateur | rejeté |

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- Recette iPhone par Hermann : R-3.3-01 à 06 (ensemble « Feuille des paramètres »).
