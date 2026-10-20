---
title: 'Story 2.8 — Phases de l’exercice dans la Feuille'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: 'a870be6a3925de1354b71840fab4c32bc17c5745'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/pre5/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre5/ajustement-figma-phases.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le Brouillon (story 2.1) sait porter des phases (`workPhases`, transitions `setWorkPhasesEnabled`, `setWorkPhaseCount`, `removeWorkPhase`, `moveWorkPhase`, `setWorkPhaseLabel`, `setWorkPhaseDuration`, `normalizeWorkPhases`), mais la Feuille « Paramètres d’exécution » n’offre aucun moyen de les régler : pas de ligne « Phases de l’exercice », pas de tableau des phases, et le ✓ ne fournit pas le libellé par défaut « Phase n ».

**Approach:** Ajouter en tête du cadre Séries la ligne « Phases de l’exercice » (segmenté `inline` Avec / Sans, arbitrage D-432 de Hermann), un tableau `WorkPhasesTable` bâti sur les briques de `sheetTable.tsx`, la saisie du libellé au clavier texte et de la durée au clavier numérique MMSS (D-434), sans nouvelle règle métier : toutes les règles viennent des transitions existantes du Brouillon.

## Boundaries & Constraints

**Always:**
- Segmenté `inline` existant (`SegmentedControl`), Sans par défaut ; Avec disponible seulement si `canEnableWorkPhases(draft)` (sinon indisponible, valeur réelle affichée) ou si des phases existent.
- Avec sélectionné : l’option Avec affiche, par `selectedContent`, « n phases » (pluriel, n ≥ 2) et, par la prop `chevron` de l’option, le chevron graphique existant (`up` tableau déployé, `down` replié) dont `onChevronPress` ne fait que replier / déployer le tableau (nombre et phases inchangés, surface ouverte rangée).
- Toucher l’option Avec sélectionnée (valeur « n phases ») révèle le réglage du nombre : l’`InlineStepper` existant, 2..6, pas 1, valeur « n phases », − et + visibles ; toucher la valeur (ou action « activer ») le referme (RC-4) ; fermé, − et + disparaissent, valeur et chevron restent. Surface `stepper(phaseCount)` du réducteur unique `sheetSurface.ts` (une seule surface ouverte).
- − à 2 et + à 6 indisponibles (bornes du stepper). + appelle `setWorkPhaseCount(n+1)` (ajout en fin à la durée de la dernière) ; − appelle `setWorkPhaseCount(n−1)` (retrait annulable de la dernière) et affiche le message existant « Phase supprimée — Annuler » (`UndoMessage`), une seule annulation en attente (série ou phase, `undoRemoval`).
- Largeur de l’option Avec adaptée au strict nécessaire (constantes locales nommées, métriques Inter de l’application) : Sans sélectionné → 62 ; Avec fermé → contenu « 6 phases » Semi Bold 12 (52,7) + écart 4 + chevron 10, arrondi à 76 ; Avec réglage ouvert → − 28 + écart 2 + valeur (52,7 + 2 × 4) + écart 2 + + 28 + écart 4 + chevron 10 = 134,7, arrondi à 136. Sans garde 62.
- Activation (Sans → Avec) : `setWorkPhasesEnabled(true)` ; tableau déployé. Avec → Sans : `setWorkPhasesEnabled(false)` (somme = durée unique de série). ✕ de la Feuille restaure l’ouverture (comportement existant).
- `WorkPhasesTable` : nouveau fichier `src/features/activities/WorkPhasesTable.tsx`, composant distinct de `VariableTable`, construit sur `DraggableRow`, `InsertionGuide`, `RemoveRowButton`, `tableStyles` (`sheetTable.tsx`) sans copie ; bloc blanc, en-têtes « Libellé » et « Durée », lignes de 36, ni pied ni ±, aucun espace sous la dernière ligne (RC-9) ; glisser RC-5 et actions Monter / Descendre (`moveWorkPhase`, libellé attaché) ; croix ✕ par ligne (`removeWorkPhase`, message « Phase supprimée — Annuler »), indisponible à 2 phases (état exposé) et, comme pour les séries, un appui alors qu’une surface est ouverte la range sans retirer.
- Libellé : `KeyboardField` mode `text` (surface `keyboard(phaseLabel)`), 20 points de code, Retour ferme, sans barre ; appliqué à la sortie par `setWorkPhaseLabel` ; vide → affiche « Phase n » (position courante).
- Durée : `KeyboardField` mode `cellDuration` (surface `keyboard(phaseDuration)`), mêmes règles que les cellules du tableau des séries : bornes 1..3535 (`EXECUTION_BOUNDS.durationTarget`), secondes > 59 reportées, hors bornes ramené à la borne, vidée → à renseigner (`null`, fond `#FFF1F0`) ; au repos « 9 s », « 1 min 5 s » ou « — » ; appliquée à la sortie par `setWorkPhaseDuration`. Barre du clavier (RC-1) sans « À l’échec » ; Précédent / Suivant ne parcourent que les durées du tableau des phases.
- Avec des phases : ligne « Durée d’une série » en lecture seule (D = Σ, sans roue ni pastille modifiable, annoncée non modifiable) ; Répétitions, À l’échec, Variables indisponibles (déjà livré, à conserver).
- ✓ : la Feuille passe `defaultLabel` (`n => "Phase n"`, depuis `strings`) à `commitSheetDraft` (disponibilité du ✓ et résultat) : normalisation existante (phases 0 / à renseigner retirées, libellés vides → « Phase n », une seule restante → Sans).
- Textes visibles par `src/shared/i18n/` ; code en anglais, commentaires en français citant FR / D / AD ; `tokens.ts` inchangé ; aucune migration ; aucun nouveau composant de contrôle (segmenté, stepper, champ clavier réutilisés).

**Never:** ligne « Ajouter une phase », ± propres au tableau, roue de durée de phase, « À l’échec » pour une phase, dernière phase calculée (formats, hors périmètre), modification de Figma, nouvelle règle de domaine dans la Feuille, changement du stepper « Nombre de séries » (NR Δ38), ScrollView supplémentaire.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Activation depuis 9 s | Durée, identiques, D = 9 s, Sans | Avec → « 2 phases », lignes 9 s et « — » (rouge pâle), tableau déployé, chevron haut | N/A |
| Activation depuis « — » | D à renseigner | deux durées « — » | N/A |
| Avec indisponible | Mode Répétitions, ou À l’échec, ou Variables | option Avec indisponible, Sans affiché | appui sans effet |
| Stepper | 2 phases, réglage ouvert | − indisponible ; + jusqu’à 6 puis indisponible ; − retire la dernière + message Annuler | N/A |
| Fermeture du réglage | réglage ouvert | toucher « n phases » → − et + masqués, valeur et chevron visibles | N/A |
| Chevron | tableau déployé | appui → tableau masqué, chevron bas, nombre et phases inchangés | N/A |
| Croix | 3 phases / 2 phases | 3 : retrait + « Phase supprimée — Annuler », Annuler restitue ordre, libellé, durée, D ; 2 : croix indisponible | N/A |
| Durée au clavier | cellule Durée, frappe 1,7,5 puis sortie | « 2 min 15 s » ; D redérivée | vidée → « — » ; 9999 → 58 min 55 s ; 0 → 1 s |
| Libellé | frappe « Descente », Retour | « Descente » affiché ; vide → « Phase n » | > 20 points de code refusé |
| Navigation | durée de la phase 1 active | Suivant → durée de la phase 2 (jamais un libellé ni une charge) ; « À l’échec » absent | N/A |
| Avec → Sans | 6 s + 3 s + 5 s | Sans, « Durée d’une série » 14 s modifiable | N/A |
| ✓ | `[9, —]`, libellés vides | onApply : Sans, cible 9 s, aucune phase | N/A |
| ✓ | `[6 « » , 3 « Maintien »]` | phases `Phase 1` 6 s, `Maintien` 3 s, cible 9 | N/A |

</frozen-after-approval>

## Code Map

- `src/features/activities/ExecutionParametersSheet.tsx` -- Feuille (2 732 lignes). Cadre Séries rendu vers la l. 1506 (`<SheetMotionView ... testID="execution-sheet-frame-series">`) : insérer la ligne Phases (`Row label={t.workPhases}`) puis le tableau des phases et un `Separator` AVANT la ligne « Nombre de séries ». Réutiliser : `chooseInline`-like flush (`keyboard.flush(draft)` avant toute transition), `update`, `commitKeyboard`, `handleRemove` (modèle pour la croix de phase, `removalEnabled(surface)`), `handleAdjustmentUndo` (déjà générique via `undoRemoval`), type `Adjustment` (ajouter le genre `phaseRemoval`, rendu sous le tableau des phases), `stepperSurface`, `isOpen`, `toggle`, `OpenStepperField`/`useOpenFieldFocus` (modèle RC-4 et focus VoiceOver), `keyboardCell` (modèle de cellule clavier, `KEYBOARD_CELL_HIT_SLOP`, `tableCellStyle`, `tableCellValueStyle`, `styles.keyboardCell`), `VariableTable` / `SeriesTableRow` (modèle de rendu, `SheetMotionView` `transition`/`raised`/`clip`/`bleed`, `liftedRow`, `isDraggingRow`). `validation = commitSheetDraft(draft, baseline)` (l. 541) : passer le 3ᵉ argument `defaultLabel`. Ligne « Durée d’une série » (l. ~1585) : avec des phases, valeur en lecture seule (texte `styles.staticValue`, annonce `${t.durationTarget}, ${valeur}, ${t.totalReadOnlySpoken}`), `TARGET_SELECTOR` non ouvrable. `keyboardFieldOrder(draft, !isTableFolded)` (l. 483) : passer aussi l’état du tableau des phases et le champ actif.
- `src/features/activities/WorkPhasesTable.tsx` (nouveau) -- tableau des phases, sur le patron de `VariableTable` ; cellules fournies par la Feuille (`cell(kind: "phaseLabel" | "phaseDuration", phaseId, number)`), croix, glisser, repère d’insertion ; testIDs `execution-sheet-phases-table`, `execution-sheet-phase-row-{n}` (préfixe de `DraggableRow`), `…-{n}-label`, `…-{n}-duration`, `…-{n}-remove`. Constantes Figma (`9207:18817`, lecture seule) : cellules Libellé et Durée de 76 × 24, écart de 20 entre elles, mêmes amorce, lignes et croix que le tableau des séries. Repère de la ligne active (Figma « Repère — phase en cours de réglage » : 3 × 24, `colors.primary`, à gauche de la ligne) quand une cellule de la ligne est active.
- `src/features/activities/sheetTable.tsx` -- briques partagées ; ne pas modifier sauf besoin strict (aucune copie).
- `src/features/activities/sheetSurface.ts` -- ajouter `{ kind: "phaseDuration"; phase: number }` à `KeyboardFieldId` (`sameKeyboardField`, `keyboardFieldRow` → `null`), `"phaseCount"` à `SheetStepperField`, et un événement « phase disparue » `{ type: "phases"; phaseIds }` qui ferme un champ clavier de phase dont la phase n’existe plus (dispatché par la Feuille sur changement de `draft.workPhases` ids, comme `rows`).
- `src/features/activities/useSheetKeyboard.ts` -- `fieldKey` (ajouter `phaseDuration`), `editTextOf` (`phaseLabel` → libellé courant ; `phaseDuration` → `mmssDigitsOf(d)` ou `""` si `null`), `applyEdit` (`phaseLabel` → `setWorkPhaseLabel` si différent ; `phaseDuration` → `cellDurationSeconds(text, EXECUTION_BOUNDS.durationTarget)` puis `setWorkPhaseDuration` si différent), `keyboardFieldOrder` : si le champ actif est une durée de phase, ordre = durées des phases (tableau des phases déployé), sinon inchangé. `accessoryVisible` exclut déjà `phaseLabel` ; `failureAvailable` reste réservé à `rowTarget`. Exporter des fonctions pures testables (`applyPhaseDurationEdit`, `phaseDurationEditText`).
- `src/features/activities/KeyboardField.tsx` -- modes `text` et `cellDuration` déjà prêts ; réutiliser tels quels.
- `src/shared/ui/SegmentedControl.tsx` -- `selectedContent`, `chevron`, `chevronAccessibilityLabel`, `onChevronPress`, `width` par option déjà livrés ; ne pas modifier.
- `src/shared/ui/ProfileStepper.tsx` (`InlineStepper`) -- réutiliser. Il dessine une pilule lavande de 36 de haut (padding 4) et sa valeur en primaire Semi Bold 13 : trop haut pour l’option `inline` (26) et illisible sur le violet. Ajout additif et optionnel, défaut inchangé : prop `appearance?: "pill" | "bare"` (`bare` : ni fond, ni padding, ni hauteur minimale, mêmes cercles 28 et même accessibilité ajustable) et `valueStyle?: StyleProp<TextStyle>` (style de la valeur, ici `inlineSelectedLabelStyle` : Semi Bold 12 blanc, `paddingHorizontal` 4). Aucun autre changement.
- `src/domain/activities/ExecutionParametersDraft.ts` -- transitions de phases (l. 852-1040) et `canEnableWorkPhases`, `undoRemoval`, `commitSheetDraft(draft, baseline, defaultLabel)` ; NE PAS modifier.
- `src/shared/i18n/index.ts` (`executionParameters.sheet`) -- ajouter : `workPhases: "Phases de l’exercice"`, `workPhaseChoices: { WITH: "Avec", WITHOUT: "Sans" }`, `workPhaseCount: "{n} phases"`, `workPhaseCountLabel: "Nombre de phases"` (nom accessible du stepper), `showPhases` / `hidePhases` (« Afficher / Masquer le tableau des phases »), `phaseColumns: { label: "Libellé", duration: "Durée" }`, `phaseDefault: "Phase {n}"`, `phaseRow: "Phase {n}"`, `phaseLabel: "Phase {n}, libellé"`, `phaseDuration: "Phase {n}, durée"`, `phaseMoveUp` / `phaseMoveDown` / `phaseMoveHandle` (« Monter / Descendre / Déplacer la phase {n} »), `removePhase: "Supprimer la phase {n}"`, `phaseRemoved: "Phase supprimée"`, `removePhaseClosesFieldHint`.
- `src/features/activities/__tests__/` -- suite existante `ExecutionParametersSheet.test.tsx` (6 825 lignes, helpers `renderSheetView`, `params`, `captureKeyboard`) et helpers `testing/executionSheetActions.ts` (`enterExecutionSheetCell`, `typeInExecutionSheetCell`, `showExecutionSheetKeyboard`). Nouvelles suites : `ExecutionParametersSheet.phases.test.tsx`, compléments dans `sheetSurface.test.ts`, `useSheetKeyboard.test.ts`, test `InlineStepper` `bare` (fichier de test existant de `ProfileStepper` s’il existe, sinon dans la suite des phases).

## Tasks & Acceptance

**Execution:**
- [x] `src/shared/i18n/index.ts` -- clés listées au Code Map -- FR-44.
- [x] `src/shared/ui/ProfileStepper.tsx` -- props additives `appearance` / `valueStyle` de `InlineStepper` -- stepper existant dans l’option Avec.
- [x] `src/features/activities/sheetSurface.ts` -- champ `phaseDuration`, stepper `phaseCount`, événement `phases` -- AD-27.
- [x] `src/features/activities/useSheetKeyboard.ts` -- texte d’édition, application et ordre des champs de phase -- D-434.
- [x] `src/features/activities/WorkPhasesTable.tsx` -- tableau des phases sur les briques partagées -- FR-29, AD-27.
- [x] `src/features/activities/ExecutionParametersSheet.tsx` -- ligne Phases, réglage du nombre, chevron et repli, tableau, croix et message, cellules clavier, Durée d’une série en lecture seule, `defaultLabel` au ✓ -- FR-2 à FR-9, D-432, D-434.
- [x] `src/features/activities/__tests__/…` -- tests de la matrice I/O et du réducteur / hook -- NFR-4.

**Acceptance Criteria:**
- Given une Feuille sans phase, when elle s’affiche, then la ligne « Phases de l’exercice » est la première du cadre Séries, Sans sélectionné, sans tableau ni chevron.
- Given des phases, when un champ de phase est focalisé et ✓ ou ✕ est touché, then le premier appui sort du champ (Q47) sans valider ni abandonner.
- Given six phases, when la Feuille s’affiche, then le corps défile et un repli du tableau ne laisse aucun espace vide (SheetMotion existant).
- Given les contrôles, when la story est livrée, then `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts, les gardes zéro-ScrollView intactes.

## Implementation Notes

- Implémentation par un sous-agent depuis la spec, puis séparateur après le tableau des phases retiré (AC3b, PR-02 : aucun séparateur après le tableau déployé ; il reste entre les lignes quand le tableau est replié ou absent).
- `InlineStepper` : props additives `appearance` (`pill` par défaut, `bare`) et `valueStyle` ; comportement par défaut inchangé. Option Avec : 62 / 76 / 136 (dimensions reportées dans `ajustement-figma-phases.md`).
- Revue : constante du minimum de phases reprise du domaine ; « Durée d'une série » en lecture seule marquée (#FFF1F0, indice annoncé) quand la Cible ou la somme des phases (violation `workPhases`) est invalide ; « 1 phase » au singulier ; test du glisser d'une phase.
- Contrôles : `npm test` (123 suites, 3 222 tests), `npx tsc --noEmit`, `npm run lint` verts. Aucun constat iPhone : recette R-2.8-01 à R-2.8-11 en attente (lot Feuille).

## Spec Change Log

## Review Triage Log

| # | Couche | Constat | Verdict | Preuve / suite |
|---|---|---|---|---|
| 1 | blind | Chevron des phases : saisie perdue (pas de `flush`) | false | Le champ démonté est traité par `useSheetKeyboard` (« Champ démonté » → `onBlur` → saisie appliquée) ; même chemin que `toggleTable` des séries. |
| 2 | blind | « Phase supprimée — Annuler » survit à Sans | false | Sans passe par `chooseInline` → `update` → `setAdjustment(null)`. |
| 3 | blind | + efface un ajustement ; − puis + puis Annuler | false | Toute modification efface le message (règle existante d'`update`) ; l'ajout remet `pendingRemoval` à `null` (`withWorkPhases`). |
| 4 | blind | Minimum 2 dupliqué dans `WorkPhasesTable` | low | patch : `WORK_PHASE_LIMITS.controlMinCount`. |
| 5 | blind | Cercles de 28 dans l'option de 26 | low | Rejeté : tient dans le segmenté de 32 ; consigné dans `ajustement-figma-phases.md`, à juger en recette. |
| 6 | blind | Largeurs fixes et texte agrandi | low | Rejeté : même limite que les autres segmentés `inline`, déjà différée (spec 2.3). |
| 7 | blind + edge | « Durée d'une série » en lecture seule sans marque d'invalidité quand ✓ est bloqué | medium | patch : fond `#FFF1F0` et indice annoncé. |
| 8 | blind + gap | Glisser d'une phase non testé | medium | patch : test du geste (fermeture de surface, repère, ordre, ✓). |
| 9 | blind | `isDraggingRow` partagé lève la découpe du groupe des séries | low | Rejeté : seulement pendant le glisser, sans effet visible. |
| 10 | blind | Libellé vide sans invite en saisie | low | Rejeté : exigerait une prop nouvelle ; « Phase n » affiché au repos (AC4). |
| 11 | blind | Paramètres positionnels de `keyboardFieldOrder` | low | Rejeté : lisibilité seulement. |
| 12 | blind | Clé `phase:` du libellé | low | Rejeté : clé existante (2.2), interne. |
| 13 | blind | Traçabilité, fichier Figma absent du diff | false | `ajustement-figma-phases.md` mis à jour hors `src/`. |
| 14 | blind | `afterEach(useRealTimers)` inutile | low | patch : retrait. |
| 15 | blind | Cas N = 1 et ouverture depuis une Séance non testés | low | Rejeté : `canEnableWorkPhases` couvre N = 1 (testé en 2.1) ; la ligne ne dépend pas de `exerciseSignals`. |
| 16 | edge | « Phase n » affiché selon la position courante, stocké selon la position finale | low | Rejeté : conforme à AC4 (affichage) et AC7 (stockage) ; signalé à Hermann. |
| 17 | edge | Une phase lue des données → « 1 phases » | low | patch : clé au singulier. |
| 18 | edge | Démontage du tableau pendant un glisser | low | Rejeté : improbable (geste à deux doigts), patron identique au tableau des séries. |
| 19 | edge | Borne 1..3535 par phase dans l'interface | false | Exigée par D-434 (« mêmes règles que les cellules du tableau des séries ») et par la spec. |

## Design Notes

Cadre d’exécution : dépôt `C:\Dev\KODJO-BMAD-PRE5` (branche `bmad/pre5-depuis-pre4`) seulement ; fichiers source en CRLF (à conserver) ; aucun commit, push, serveur ni Metro ; ne pas toucher `C:\Dev\KODJO-BMAD-PRE5-fix`, `C:\Dev\KODJO-BMAD-PRE5-recette`, `_bmad/`, `.claude/skills/` ; pas de python système ; fichiers temporaires dans le clone (`.tmp-2-8/`) ; docs Expo SDK 57.

Option Avec (selectedContent) :

```tsx
// fermé : Pressable « n phases » (inlineSelectedLabelStyle) → toggle(stepper(phaseCount))
// ouvert : <InlineStepper appearance="bare" valueStyle={…} value={n} min={2} max={6}
//            formatValue={(v) => t.workPhaseCount.replace("{n}", String(v))}
//            onValuePress={fermer} onChange={(c) => …setWorkPhaseCount…} />
// chevron : prop `chevron` de l’option (rendu par SegmentedControl après le contenu)
```

Re-choisir Avec déjà sélectionné (zone de l’option hors valeur) ouvre ou ferme aussi le réglage. Le libellé de ligne « Phases de l’exercice » (Regular 12, 117) passe sur deux lignes quand le réglage est ouvert à 375 et 402 (contrôle de 206) : ligne de 44 inchangée, comme RC-11 ; à signaler pour la recette.

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- Recette iPhone R-2.8-01 à R-2.8-11 (lot Feuille), par Hermann ; aucun constat fabriqué.
