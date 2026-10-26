---
title: 'R-7 — Recette JA2 : phases, durées et signalements (D-448)'
type: 'bugfix'
created: '2026-10-26'
status: 'done'
baseline_commit: '366caaf2c2bd2c4572c6ef694f4ea67714c432f3'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/planning-artifacts/arbitrage-2026-10-26-recette-ja2-d448.md'
  - '{project-root}/docs/KODJO-Phases-Guidage-Cyclique-2026-10-26.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La recette JA2 du 26/10 relève, sur la Feuille des paramètres et la Composition :
- en mode Durée, une phase sans durée supprime le total (ph-5) ;
- désactiver puis réactiver les phases perd libellés et durées (ph-1) ;
- une durée de phase à 0 s est ramenée à 1 s ;
- « Paramètres à compléter. » ne se voit pas, et une carte de Composition incomplète après un changement de rang non plus (nv-5) ;
- libellé « Phases de l'exercice », cadre des phases variables trop étroit, lignes de « Durée de l'exercice » dépliées hors écran.

**Approach:** Corrections ciblées du calcul, du brouillon de la Feuille et du rendu, selon le lot D-448 validé par Hermann (arbitrage de séance : PH-5 et NV-3 verbatim, points 4, 6, 7, 8). D-448 est consignée au chapitre 07.

## Boundaries & Constraints

**Always:**
- **PH-5** (verbatim dans l'arbitrage) :
  - en mode Durée, la durée totale se calcule à partir des cibles de séries, des pauses et des autres paramètres, indépendamment des durées de phase ; une phase vide n'empêche pas d'afficher le total calculable ;
  - une phase vide reste non renseignée, jamais 0 s ; la validation des phases manquantes reste appliquée à l'enregistrement (Terminer indisponible) ;
  - « Paramètres à compléter. » reste affiché ;
  - en Répétitions chiffrées avec phases, PHC : estimation = répétitions × motif complet, aucune estimation si une durée manque. Aucune autre règle de calcul modifiée.
- **NV-3** : les durées locales des rangs communs sont conservées, une durée renseignée n'est jamais écrasée, une durée manquante n'est jamais remplacée par 0 s. Le préremplissage ne s'applique que si un Exercice du Catalogue est explicitement sélectionné pour le niveau cible. Aucun chemin actuel ne transfère de paramètres dans ce cas : au Catalogue, le choix ouvre l'Exercice existant. En Séance et en reprise, le choix porte sur un mouvement : pas de préremplissage. Aucun changement de code ; la règle est consignée dans D-448, et un test vérifie qu'une durée de rang surnuméraire s'affiche vide.
- **Point 4** : pendant une édition de la Feuille, réactiver les phases restitue les phases désactivées (libellés, durées, nombre) au lieu de deux phases vides. Cette mémoire n'est pas persistée.
- **Point 6** : 0 s saisi dans une durée de phase reste 0 s (affiché « 0:00 »), cellule rouge, sauvegarde de la Feuille refusée comme pour une durée manquante. Une durée vide reste vide (« — »).
- **Point 7** : « Paramètres à compléter. » en rouge `colors.danger` partout où il s'affiche (fiche de l'éditeur, carte du Catalogue, Composition). Une carte de Composition dont le résumé est incomplet a le fond `colors.dangerSurface`.
- **Point 8** :
  - libellé « Phases du mouvement » ;
  - option « n phases » des phases variables élargie, pour que le chevron soit nettement séparé du nombre ;
  - au dépliage de « Durée de l'exercice », défilement de la Feuille pour que ses deux lignes (Compte à rebours, Fin) soient visibles.
- `tokens.ts` non modifié ; textes via le lexique.

**Never:** modifier les règles de transfert par rang autres que les durées manquantes ; inventer une durée ; toucher au Circuit de Séries, aux alias, à VoiceOver ; remplacer une primitive native.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Durée, phase vide | 3 × 30 s, pause 60 s, phases 3 s / — | Total affiché ; « Paramètres à compléter. » rouge ; Terminer indisponible | N/A |
| Répétitions, phase vide | 3 × 10, phases 3 s / — | Pas d'estimation (comportement actuel) | N/A |
| Répétitions complètes | 3 × 10, phases 3 s / 2 s | Estimation 10 × 5 s par série (inchangée) | N/A |
| Phase à 0 s | Saisie « 0000 » | Cellule « 0:00 » rouge, sauvegarde refusée | Même blocage qu'une durée manquante |
| Phases Sans puis Avec | 3 phases nommées, durées | Mêmes 3 phases restituées | Hors édition : deux phases vides (Q5) |

</frozen-after-approval>

## Code Map

- `src/domain/activities/executionCalculations.ts:230` `summarizeTargets` -- `hasMissingPhaseDuration` force `incomplete` dans tous les modes ; c'est ce qui supprime le total en Durée. `:118` `workSeconds` ignore déjà les phases en Durée ; `:140` `isWorkEstimable`, `:243` `computeIntrinsicDuration` forment le chemin du total. Le signalement « incomplet » doit rester distinct de la calculabilité du total.
- `src/domain/activities/phaseGuidance.ts:35` `nominalGuidanceSeconds` -- null si une phase est sous 1 s : garde PHC en Répétitions, à conserver.
- `src/domain/activities/ExecutionParameters.ts:417` `hasMissingPhaseDuration` ; `:837`, `:1497` refus des durées sous le minimum, à conserver.
- `src/features/activities/ExecutionParametersSheet.tsx:732-751` -- calcul du total ; `:739` exige `validation.ok`, à assouplir pour les seules violations de phase manquante en mode Durée. `:871` `choosePhases` → `:889`. `:1807` / `:1815` cellule rouge (`missing` / `invalid`). `:379-380` `PHASE_OPTION_CLOSED_WIDTH` / `PHASE_OPTION_OPEN_WIDTH`, `:3372-3378` marges, `:3090` `PhaseCountField`. `:2359-2401` ligne Durée de l'exercice, `:1039` `toggleDuration`, `:589` `scrollRef`, `trackRow` pour les positions.
- `src/domain/activities/ExecutionParametersDraft.ts:960` `setWorkPhasesEnabled` -- l'option Sans vide les phases sans mémoire (`:954-955`). Réutiliser l'idée de `PendingRemoval.clearedPhases` (`:132-149`) pour une mémoire de brouillon. `:296` `openSheetDraft` ; `:1106` / `:1112` `setWorkPhaseDuration` accepte déjà 0.
- `src/features/activities/useSheetKeyboard.ts:253` `applyPhaseDurationEdit` -- `cellDurationSeconds(text, EXECUTION_BOUNDS.durationTarget)` borne à 1. `src/features/activities/cellEntry.ts:107` / `:114-118` `clamp`. Pour les phases, accepter 0 sans changer la borne des cibles.
- `src/shared/i18n/index.ts:21` `incomplete`, `:108` `workPhases`.
- Rendu de « Paramètres à compléter. » : `src/features/activities/ActivityEditorForm.tsx:398-401`, `src/features/activities/ActivityCard.tsx:131`, `src/features/sessions/compositionPresentation.ts:225` et `:377` (résumés en texte) ; `src/features/sessions/CompositionScreen.tsx:5108` (résumé passé à la carte), `:4967-4971` (fond de ligne) ; `src/features/sessions/OccurrenceCard.tsx:161` (fond de carte), `:265`. La présentation peut exposer un indicateur « incomplet » plutôt que comparer des chaînes.
- `src/domain/activities/Movement.ts:612` `transferParametersByRank` -- rang surnuméraire à 0 s : c'est la représentation de « vide » (ouverte en `null` par `openSheetDraft`). Ne pas changer.
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` -- ajouter « D-448 » à la fin, au format de D-446 (l.955-969).

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/activities/executionCalculations.ts` -- en mode Durée, total calculé malgré des phases vides ; signalement incomplet conservé ; Répétitions inchangé -- PH-5.
- [x] `src/features/activities/ExecutionParametersSheet.tsx` -- total affiché en Durée malgré une phase manquante ; libellé, largeur de l'option, défilement au dépliage -- PH-5, points 8.
- [x] `src/domain/activities/ExecutionParametersDraft.ts` -- mémoire des phases désactivées dans le brouillon, restituée à la réactivation -- point 4.
- [x] `src/features/activities/useSheetKeyboard.ts`, `cellEntry.ts` -- 0 s accepté pour une phase -- point 6.
- [x] `src/shared/i18n/index.ts` -- « Phases du mouvement » -- point 8.
- [x] `ActivityEditorForm.tsx`, `ActivityCard.tsx`, `compositionPresentation.ts`, `CompositionScreen.tsx`, `OccurrenceCard.tsx` -- texte en `colors.danger`, fond `colors.dangerSurface` sur une carte incomplète -- point 7.
- [x] Tests à côté des sources (`__tests__/`, suffixe `.r7`) : matrice I/O ; restitution des phases ; 0 s ; texte et fond rouges ; durée de rang surnuméraire vide après changement de niveau ; défilement au dépliage (appel de `scrollTo`). Mettre à jour les tests existants qui figent l'ancien comportement : libellé, 0 → 1, total absent.
- [x] Chapitre 07 : section « D-448 — Recette JA2 PRE-7 du 26/10/2026 », reprenant l'arbitrage. Elle nomme les règles remplacées : interdépendance total/phases en Durée ; « Sans » vide les phases (pendant l'édition) ; minimum 1 s à la saisie de phase ; « sans → phases, durées vides » précisé par NV-3 ; libellé D-432 « Phases de l'exercice ». Points 1, 2, 9, 10 et cr-8 relèvent de R-8 et R-9 mais sont consignés ici. Annoter « [remplacé par D-448 du 26/10/2026 : …] » les phrases visées des chapitres 07 et 13 (libellé, règle 0 s / 1 s, total).

**Acceptance Criteria:**
- Given une Séance avec une occurrence dont une phase manque après un changement de niveau, when la Composition s'affiche, then la carte a le fond `dangerSurface` et « Paramètres à compléter. » est en rouge.
- Given une Feuille en mode Durée avec phases incomplètes, when on déplie « Durée de l'exercice », then le total est affiché et les deux lignes dépliées sont amenées à l'écran.
- Given les trois contrôles, when ils s'exécutent, then `npx tsc --noEmit`, `npm run lint` et `npx jest --maxWorkers=2` passent.

## Implementation Notes

- **PH-5** : `summarizeTargets` ne rend plus `incomplete` pour une phase manquante en mode Durée (Répétitions inchangé) ; la Feuille affiche le montant quand les seules violations sont des durées de phase manquantes (`REQUIRED` `workPhases` avec `phaseId`), en Durée. Conséquence cohérente avec PH-5 : `catalogueDuration` (carte du Catalogue, écran de sélection) affiche aussi la durée en Durée malgré une phase vide, et les totaux de Composition et de Séance l'incluent. L'inversion du total (roulette) devient disponible dans ce cas, comme pour tout total exact.
- **Point 6, affichage** : la cellule à 0 s affiche « 0 s » par le formateur commun des cellules (D-434 : « durée nulle autorisée « 0 s » »), et « 00:00 » au focus. Le « 0:00 » de la matrice I/O n'est pas un format existant des cellules ; à confirmer par Hermann si un autre rendu est voulu.
- **Point 8, défilement** : `scrollToEnd` à la mise en page de la ligne Fin qui suit un dépliage (le cadre « Cadence et durée » est le dernier du corps), plutôt qu'un `scrollTo` calculé ; le test vérifie l'appel de `scrollToEnd`.
- **Point 8, largeur** : seule l'option fermée est élargie (104 → 110, écart libellé–chevron 6 → 12) ; le réglage ouvert garde 150.
- **Point 7** : `isIncompleteSummary` (présentation) ; rouge aussi sur le texte « Paramètres à compléter. » de l'étape de complétion des frères (`SiblingCompletionStep`). L'écran de sélection d'Exercice et les dialogues de l'éditeur de Séance ne sont pas modifiés.
- Tests ajoutés : `phasesDurations.r7.test.ts`, `cellEntry.r7.test.ts`, `ExecutionParametersSheet.r7.test.tsx`, `ActivityCard.r7.test.tsx`, `CompositionScreen.r7.test.tsx`, bloc R-7 de `ActivityEditorForm.test.tsx`. Tests mis à jour : libellé, largeur 104, 0 → 1 s, « sans mémoire » de Sans, `incomplete` en Durée, durée absente d'un frère incomplet en Durée (`catalogueByMovement.a41`).

## Spec Change Log

## Review Triage Log

Revue du 26/10/2026 : trois couches (Blind Hunter, Edge Case Hunter, Verification Gap) sur le diff depuis `366caaf2`.

| # | Source | Constat | Verdict | Preuve | Route |
|---|---|---|---|---|---|
| 1 | ECH | Passage à Sans par la croix à deux phases : aucune mémoire, Avec recrée deux phases vides | medium | `removeWorkPhase` (branche à une phase restante) ne remplit pas `disabledWorkPhases` ; le point 4 vise toute désactivation | patch |
| 2 | BH, ECH, VG | « Paramètres à compléter. » reste gris dans la liste de choix des Exercices | low | `ActivitySelectionScreen.tsx:405` sans style conditionnel ; point 7 « partout » | patch (+ test) |
| 3 | ECH | Double toucher rapide sur « Durée de l'exercice » : drapeau de défilement désynchronisé | low | `toggleDuration` lit `isDurationExpanded` dans la fermeture ; correction directe dans la fonction de mise à jour | patch |
| 4 | BH | Détection de l'état incomplet par comparaison de chaîne dupliquée dans l'éditeur | low | `ActivityEditorForm.tsx:741` n'emploie pas `isIncompleteSummary` ; correction directe | patch |
| 5 | BH, VG | Garde redondante dans `catalogueDuration` | low | Le domaine rend déjà `incomplete` en Répétitions ; deux sources de la même règle, suppression directe | patch |
| 6 | BH, ECH | Commentaire de `cellPhaseDurationSeconds` : « 0:00 » au lieu de « 0 s » | low | Les tests attestent « 0 s » (formateur de D-434) | patch |
| 7 | BH | Ancien libellé « Phases de l'exercice » non annoté aux chapitres 03, 06, 09, 10, 11 et au nom de la ligne 2b du chapitre 13 | low | Recherche dans `docs/Specifications-fonctionnelles` | patch (doc) |
| 8 | BH | QD-434-4 (« cellule vidée vaut 0 s ») non annotée ; règle (b) absente du corps de D-432 et de la ligne 2b | low | Seule QD-434-3 est annotée | patch (doc) |
| 9 | BH | Mémoire des phases peu testée (une seule étiquette vérifiée, aucune édition intermédiaire) | low | `ExecutionParametersDraft.test.ts` | patch (test) |
| 10 | ECH, BH, VG | Durées de Séance et de Circuit, et libellé accessible, comptent désormais une occurrence en Durée à phase manquante | false | Voulu par PH-5 : « ne doit pas empêcher l'affichage du total calculable en mode Durée » ; la carte affiche la même durée que son libellé accessible | reject |
| 11 | ECH | Roue d'inversion du total modifiable sur une Feuille dont seules des phases manquent | false | Le total est affiché par PH-5 ; la roue n'agit que sur les séries, le ✓ reste refusé ; aucun dommage | reject |
| 12 | ECH, BH | `scrollToEnd` dans `onLayout` de la ligne Fin peut précéder la mise à jour de la taille du contenu | maybe-false | Ne se tranche que sur appareil (recette JA3) | defer |
| 13 | BH | `onlyMissingPhaseDurations` dépend de la forme des violations | low | Aucun appelant divergent nommé ; contrat local à `ExecutionParameters.ts` | reject |
| 14 | BH | Tests « phase vide » construits avec 0 | false | Dans le modèle persisté, une durée manquante est représentée par une valeur inférieure à 1 (`openSheetDraft` l'ouvre en `null`) ; les tests suivent la représentation réelle | reject |
| 15 | BH | Carte du Circuit et état soulevé non testés pour le fond rouge | low | Circuit de Séries abandonné (recette nv-8) ; style combiné trivial | reject |
| 16 | BH | Tests NV-3 sans comportement nouveau | false | NV-3 n'appelle aucun changement de code (spec) ; le test fige la durée vide | reject |
| 17 | BH | Liste « Lot validé » sans les points 3 et 5 ; arbitrage non suivi par git | false | Points 3 et 5 = NV-3 et PH-5, cités verbatim dans leurs sections ; l'arbitrage est ajouté au commit, comme les précédents | reject |
| 18 | BH | Résumés de `ExerciseScreen.tsx:431` et `:832` non rouges | false | `:431` alimente les entrées du menu natif (texte seul) ; `:832` passe par `SiblingCompletionStep`, déjà rouge | reject |
| 19 | VG | Couleur de `SiblingCompletionStep` sans assertion | low | Gap filé, disposition de la couche : defer | defer |

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
- `npx jest --maxWorkers=2` -- expected: toutes les suites vertes

**Manual checks (if no CLI):**
- Rendu sur iPhone (rouge, largeur, défilement) : recette de Hermann.
