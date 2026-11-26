# 2026-11-26 — Exercice libre (coque), phases et clavier — D-607 / D-608

- **Mission** : appliquer les points restants de D-607/D-608 (D-572 point 1, D-573 points 5 et 6 sur la branche de documentation) : A. coque de la modale de l'exercice libre ; B. phases définies dans la fiche du mouvement ; C. le clavier ne masque jamais le champ saisi.
- **Branche / départ** : `feat/formats-libre-phases-20261126`, worktree `C:\Dev\KODJO-D607-LIBRE`, départ `e0239297` (fusion des travaux D-607/D-608 des autres sessions).
- **Périmètre demandé** : `ExecutionParametersSheet` (exercice libre et feuille générique), modèle `WorkPhase`, logique clavier de la feuille ; pas de `docs/` (documentation tenue par une autre session) ; exécution hors périmètre sauf câblage local.
- **Périmètre traité** : A, B (modèle + feuille + câblage local de l'exécution pour le son), C (feuille des paramètres d'exécution). `FormatModelScreen` : non modifié (voir C).

## PRESERVE / CHANGE / FORBIDDEN

| | Contenu |
|---|---|
| PRESERVE | En-tête gris, titre « Exercice libre », accroche ; ligne Charge Avec/Sans et tableau des séries variables ; modales de format (D-604 : pas de phases) ; feuille native, hauteur et ancrage ; durées de phase modifiables, règles de durée (D-446, arrondi du 09/11) ; ordres des segmentés partagés ; `automaticallyAdjustKeyboardInsets` et `revealDelta` ; présentation des autres modales (lignes de 44, cadres arrondis). |
| CHANGE | Exercice libre : cadre « Mouvement et phases » en tête (ligne « Mouvement », carte du mouvement, ligne des phases), bandes pleine largeur #F9FAFC, lignes de 38, De chaque côté + Cadence + Récupération dans un même dernier cadre, intitulé « Paramètres d'exécution » retiré. Phases (toutes feuilles) : plus d'option Avec/Sans ; sans phases aucune ligne ; avec phases « n phases » + chevron, nombre/ordre/libellés fixés ; son de chaque phase désactivable (`WorkPhase.soundOff`, clé facultative). Clavier : réserve de la hauteur du clavier sous les cadres pendant une saisie. |
| FORBIDDEN | Remplacer une primitive native ; changer la feuille native ou sa hauteur hors saisie ; modifier `docs/` ; push, merge, rebase, reset ; autres worktrees ; changer les modales de format au-delà du nécessaire. |

## Constats

- **Option sélectionnée à droite** : déjà assurée par le segmenté partagé `inline` (`SegmentedControl`, essai du 04/11/2026 : l'option sélectionnée est toujours la dernière). L'ordre de Figma `13269:26160` en découle : aucune modification (classe A).
- **« + Créer un mouvement »** : absent du choix du mouvement de l'exercice libre (`MovementScreen`, `hideFinish` en création ; un nom inexistant validé crée le mouvement). Aucune modification (classe A).
- **« Changer »** : aucun parcours de changement du mouvement d'un exercice existant (Composition, `useMovementExerciseIntake`, `movementExercises.ts`). Ligne « Mouvement » rendue sans l'action : **À CLARIFIER**.
- **Durée de l'exercice** : Figma `13269:26160` ne montre pas cette ligne. Conservée dans son cadre, placé avant le dernier cadre : **À CLARIFIER**.
- **Images d'une phase** : aucune image par phase dans le modèle, la fiche du mouvement ni l'exécution (seul le libellé de guidage est affiché). Non implémenté : **À CLARIFIER**. Son : implémenté (bip et annonce du changement de phase).
- **Interrupteur du son** : aucun écran Figma ; rendu CHOISI (pictogramme du guidage sonore à la place de la croix, plein = actif, clair atténué = coupé) — à valider sur iPhone.
- **Libellés de phase d'un Mouvement NOUVEAU du brouillon** : ils ne sont plus modifiables dans la feuille et le gabarit de l'exercice n'a pas de bloc Phases (contre-recette du 30/10, r1-exo) : renommage impossible en Séance — **À CLARIFIER**.
- **Clavier (C)** : cause démontrée par la logique — une feuille plus courte que le clavier (départ rapide : Charge et De chaque côté seulement) est entièrement recouverte ; la course iOS (`automaticallyAdjustKeyboardInsets`) et `revealDelta` ne peuvent que faire défiler le contenu dans un corps lui-même caché (la ligne sort par le haut du corps). Correction : réserve égale à la part du corps recouverte par le clavier, ajoutée sous les cadres pendant une saisie : la feuille (ancrée en bas, taille au contenu) grandit et remonte ses lignes ; à sa hauteur maximale, la réserve donne la course de défilement. `FormatModelScreen` (feuille native plein écran, alignement propre des cellules) : aucun défaut démontré par le code, vérification iPhone seulement.

## Modifications

- `src/domain/activities/ExecutionParameters.ts` : `WorkPhase.soundOff?: true` — écrit seulement si vrai (sérialisation, copie), lecture stricte (absent ou `true`), égalité.
- `src/domain/activities/ExecutionParametersDraft.ts` : `DraftWorkPhase.soundOff`, ouverture et paramètres demandés, transition `toggleWorkPhaseSound`.
- `src/domain/execution/signals.ts`, `src/features/execution/ExecutionService.ts` : `PhasePattern.silent` — aucun signal `PHASE` au début d'une phase au son coupé.
- `src/features/activities/ExecutionParametersSheet.tsx` : cadre du mouvement (exercice libre), bandes et lignes de 38 (contexte `FreeLayoutContext`), dernier cadre (côté, cadence, récupération), ordre des champs Précédent/Suivant ; phases : option unique « n phases » (`FixedPhaseCount`), structure toujours fixée, aucun cadre sans phases ; réserve clavier `execution-sheet-keyboard-room`.
- `src/features/activities/WorkPhasesTable.tsx` : interrupteur du son (`onToggleSound`) à la place de la croix.
- `src/features/activities/SelectedMovementCard.tsx` : variante `row` (38, photo 34) ; prop `movement` réduite à nom, médias, zones.
- `src/features/activities/useSheetKeyboard.ts` : `keyboardBodyReserve`.
- `src/features/sessions/useMovementExerciseIntake.tsx`, `CompositionScreen.tsx` : `freeMovement` (nom, photo, zones, rang de Niveau).
- i18n fr/en : `freeMovement`, `phaseSound`.
- Tests mis à jour (règles remplacées annotées « remplacé le 26/11/2026 par D-608 ») : `ExecutionParametersSheet.phases`, `.mfn.a21`, `.test`, `.recovery`, `CompositionScreen.d608`, `ExerciseScreen.test`, `ExerciseScreen.sessionMovement.integration`. `FormatModelScreen.d603` : HIIT ajouté à l'objectif de répétitions (incohérence de fusion antérieure, code déjà conforme à D-608 point 8).
- Nouveaux tests : `ExecutionParameters.phaseSound.d608.test.ts`, `ExecutionParametersSheet.libre.d608.test.tsx`.

## Preuves et tests

- `npx tsc --noEmit` : OK.
- `npx jest -w 1 "ExecutionParametersSheet|ExerciseScreen|CompositionScreen|FormatModelScreen|ExecutionParameters|domain/execution|ExecutionService|SelectedMovementCard|WorkPhases|useSheetKeyboard|i18n|movementExercises|MovementScreen|formatSheetContext|ExecutionSignalAdapter"` : 98 suites, 1906 réussis, 33 ignorés (préexistants), 1 échec (`FormatModelScreen.d603`, HIIT, corrigé puis 19/19).
- Relances ciblées après nettoyage : phases, mfn.a21, libre.d608, phaseSound.d608 : 67/67.
- ESLint sur les fichiers touchés : aucune nouvelle alerte (alerte `quickValueRow` préexistante, erreurs `react-hooks/refs` préexistantes de `CompositionScreen.tsx`).

## Classes documentaires (à reporter par la session documentaire)

- A (D-573 point 5) : option sélectionnée à droite (segmenté partagé) ; absence de « + Créer un mouvement ».
- B (D-573 points 5 et 6, D-572 point 1) : présentation de la modale libre ; phases (remplace Avec/Sans, D-413, D-448 ; structure fixée hors fiche du mouvement, remplace PRE-7 A2.1 pour les créations locales) ; clé `soundOff` (ch11, contrat des paramètres) ; réserve clavier.
- D : `keyboardBodyReserve`, contexte de présentation.

## Vérifications iPhone

- A : ouvrir un exercice libre : cadre « Mouvement » (photo, nom, zones, Niveau) et ligne « n phases » en tête, bandes pleine largeur, lignes de 38, De chaque côté / Cadence / Récupération dans le dernier cadre.
- B : un mouvement sans phases n'a aucune ligne de phases ; avec phases, « n phases » déplie le tableau, durées modifiables, son coupé par phase muet à l'exécution.
- C : départ rapide (Tabata) : toucher « Avec » de la Charge, la feuille remonte et le champ reste au-dessus du clavier et de sa barre ; idem Récupération, cellules du tableau, champs de l'écran du format.

## Git

- Commit final et état : voir le message de remise (commit contenant ce rapport).
