---
title: 'A2.2 — Contenu partagé et verrouillage'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: '2d73cd90aa19da4d278aa644a676fc71c1f936c0'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/implementation-artifacts/epic-A2-context.md'
  - '{project-root}/src/features/activities/README.md'
  - '{project-root}/src/features/sessions/README.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'éditeur d'Exercice enregistre une correction du contenu partagé sans évaluer l'usage du geste (report A1.3 : `updateActivityDefinition` écrit sans question d'identité), ne connaît ni la création sur un geste repris (contenu en lecture seule + crayon) ni le verrouillage du contenu d'une occurrence de Séance (MFN-09), et n'a ni dialogue d'identité (D-438, `9952:44349`) ni étape de complétion des durées manquantes des Exercices frères (MFN-08).

**Approach:** Trois contextes explicites dans `ExerciseScreen` : (1) Exercice du Catalogue existant, ouvert en édition ; (2) création sur geste repris (point d'entrée route `movementId`, branché par A2.3), contenu en lecture seule déverrouillable par le crayon « Modifier le geste », paramètres modifiables ; (3) occurrence avec filiation, contenu (nom, description, médias, Catégorie, Zones, structure des phases) verrouillé sans crayon, création locale modifiable. À `Terminer` : évaluation (`assessActivityDefinitionCorrection`), feuille basse d'identité à trois choix si « déjà utilisé » et contenu sensible modifié, avec nombre d'Exercices concernés calculé, puis étape de complétion des durées manquantes des frères (passable par frère), puis écriture par les services A1.3.

## Boundaries & Constraints

**Always:** D-437, D-438 et son complément de présentation, MFN-02, MFN-04, MFN-06, MFN-08, MFN-09 ; CE-T03-04 §3, §11, §14, §15 ; relevé `DSF-MOUVEMENT-FILIATION-NIVEAUX-2026-10-23.md` ; services A1.3 seuls pour écrire ; aucune valeur inventée (durée de frère : saisie ou passage explicite) ; l'Exercice édité reste complet (validation existante) ; Annuler (feuille ou étape) rend le brouillon intact, sans écriture ; comptes calculés (création en cours comptée dans le total) ; textes au lexique `strings`, libellés repris des docs et de Figma ; « geste », « exercice », jamais « mouvement » à l'écran ; cibles ≥ 44 ; primitives natives (`TextInput editable={false}`, `Modal`) ; étape de complétion `NON VÉRIFIABLE` (aucune frame) ; trois contrôles verts ; tests existants non affaiblis.

**Never:** recherche, suggestions, trois choix de création et sélection du geste (A2.3) ; pastille et popover de Niveau, rattachement au groupe (A3.x) ; Catalogue regroupé (A4.1) ; migration, schéma, `tokens.ts`, `package.json`, `app.json`, `.github/`, `main` ; modification d'une copie de Séance par une correction ; crayon sur une occurrence.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Paramètres seuls | Catalogue, geste utilisé, durée changée | enregistrement direct, aucune feuille (MFN/AC09) | échec → message d'erreur existant, brouillon conservé |
| Nom changé, geste utilisé | Catalogue, 3 Exercices du geste | feuille « Vous avez modifié {nom} », « 2 autres exercices… », Corriger cet exercice / Créer un nouvel exercice / Annuler | Annuler → brouillon intact, rien écrit (MFN/AC10) |
| Corriger | idem | `updateActivityDefinition`, frères relisent le nom | N/A |
| Nouvelle identité | idem | `createActivityDefinitionWithOrigin(VARIANT)` ; original intact | N/A |
| Geste non utilisé | nom changé | enregistrement direct | N/A |
| Correction structurelle | phase ajoutée, frère à durée manquante | après Corriger : étape de complétion (frère, phase, durée) ; saisie → frère complet ; Passer → frère incomplet | Annuler → retour au brouillon ; Terminer indisponible tant qu'une durée non passée manque |
| Reprise inchangée | `movementId`, contenu en lecture seule | crayon visible ; Terminer → `SAME_MOVEMENT` sans feuille | Mouvement introuvable → erreur de chargement existante |
| Reprise modifiée, geste utilisé | crayon puis nom changé | feuille Corriger ce geste / En faire un geste distinct / Annuler ; total = partageurs + 1 | N/A |
| Occurrence avec filiation | `sourceMovementId` non vide | nom, description, médias, Catégorie, Zones, structure non modifiables ; paramètres modifiables ; aucun crayon (MFN/AC28) | N/A |
| Création locale | occurrence sans filiation | contenu modifiable (MFN/AC29) | N/A |

</frozen-after-approval>

## Code Map

- `src/features/sessions/ExerciseScreen.tsx` -- `CatalogueActivityEditorScreen` (l.253) : `handleFinish` (l.367) écrit sans évaluation ; route `catalogueDefinitionId` (+ nouveau `movementId`) ; `CompositionExerciseEditor` (l.559) : `openedOccurrenceOf` (l.537) fige déjà `phaseStructureLocked` = filiation non vide (A2.1) → étendre au contenu.
- `src/features/activities/ActivityEditorForm.tsx` -- nom (`TextInput` l.~399), accès Catégorie / Zones (`Pressable`), `DescriptionSteps`, `ActivityMediaList` ; ajouter `contentLocked` (structure verrouillée comprise).
- `src/features/activities/DescriptionSteps.tsx` (`editable`), `ActivityMediaList.tsx` (`editable` : consultation conservée, ni ajout ni menu Retirer / Monter / Descendre).
- `src/shared/ui/ScreenShell.tsx` -- `FixedHeader` : prop `trailing` (crayon), rendu antérieur inchangé.
- `src/features/activities/ActivityDefinitionService.ts` -- `assessActivityDefinitionCorrection` (rendre aussi la structure allouée `phases`), `supportsSharedCorrection` (patron `supportsMediaImport` : doublures sans `MovementRepository` gardent l'écriture directe), `getMovement(id)`.
- `src/domain/activities/sharedCorrection.ts` -- fonctions pures : portée du dialogue (`correctionScope`), complétions par frère (`buildSiblingCompletions`).
- Nouveaux : `src/features/activities/IdentityDecisionSheet.tsx` (feuille basse `9952:44349` : titre Semi Bold 20 `#141414`, sous-titre 14 `#7A7A80`, deux choix 354 × 68 bordés `#E4E7EF` rayon 12, libellé Medium 15, explication 13 `#7A7A80`, Annuler Medium 15 `primary`, coins hauts 24) ; `src/features/activities/SiblingCompletionStep.tsx` (étape `NON VÉRIFIABLE`, `Modal` natif, saisie MM:SS par `cellEntry.ts`).
- Icône : `assets/icons/icon-modifier.svg` (export MCP de `9925:41240`), `manifest.json`, `KodjoIcon` `edit-movement` ; action `9952:44374` 40 × 32, fond `#F3F4F9`, rayon 10.
- `src/shared/i18n/resources/fr.ts` -- libellés MFN.
- Ne pas toucher : `ExecutionParametersSheet.tsx` (le verrou A2.1 suffit), services A1.3 (écriture), repositories, `DecisionDialog.tsx` (dialogue centré à deux actions, ne porte pas deux choix expliqués).

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/activities/sharedCorrection.ts` -- `correctionScope`, `buildSiblingCompletions` -- domaine dérivé, éditeur au rendu.
- [x] `src/features/activities/ActivityDefinitionService.ts` -- `phases`, `supportsSharedCorrection`, `getMovement`.
- [x] `assets/icons/icon-modifier.svg`, `manifest.json`, `src/shared/ui/KodjoIcon.tsx`, `src/shared/ui/ScreenShell.tsx` -- crayon d'en-tête.
- [x] `DescriptionSteps.tsx`, `ActivityMediaList.tsx`, `ActivityEditorForm.tsx` -- `contentLocked`.
- [x] `IdentityDecisionSheet.tsx`, `SiblingCompletionStep.tsx`, `fr.ts` -- feuille et étape.
- [x] `src/features/sessions/ExerciseScreen.tsx` -- trois contextes, enchaînement Terminer → évaluation → feuille → complétion → écriture.
- [x] Tests : domaine (portée, complétions), service (`phases`), feuille et étape (rendu, choix, Annuler, Passer), écran (matrice : SQLite réelle via services A1.3), verrou de l'occurrence et du contenu repris.
- [x] READMEs `src/features/activities/`, `src/features/sessions/`, `src/domain/`, `deferred-work.md`, `sprint-status.yaml`.

**Acceptance Criteria:**
- Given un geste utilisé partagé par deux Exercices, when une phase est ajoutée à l'un, Corriger choisi et la complétion du frère passée, then l'édité est enregistré complet, le frère est incomplet et aucune copie de Séance ne change.
- Given l'application, when les trois contrôles s'exécutent, then ils sont verts.

## Design Notes

- **Portée :** édition : total = définitions qui partagent le geste, autres = total − 1 ; reprise : autres = partageurs, total = autres + 1 (création comptée). Nombre affiché seulement au-delà d'un Exercice.
- **Ordre à Terminer :** validation existante → évaluation → (feuille si `requiresIdentityDecision`) → Corriger / sans dialogue : étape de complétion si `siblingGaps` non vide → écriture. Nouvelle identité : `VARIANT`, aucune complétion (nouveau geste). Frère inéligible : écriture refusée par le service → message d'erreur existant.
- **Reprise :** contenu chargé du Mouvement (`getMovement`) ; paramètres initiaux vides, ou, si le geste a des phases, Durée à séries identiques portant sa structure, durées à renseigner (aucune valeur inventée) ; compteur du Mouvement transmis. Le crayon déverrouille contenu et structure dans le brouillon seul.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

## Implementation Notes

- Implémentation conduite directement par l'agent de la story (investigation dans son contexte, comme A1.3 et A2.1) ; revues du step-04 confiées à trois sous-agents indépendants. Checkpoints pré-approuvés par Hermann (absent) ; spec au-delà de 1 600 jetons conservée entière.
- **Figma (lecture seule, session MCP) :** `get_metadata` de `9952:44349`, `get_design_context` de la feuille `9952:44377` et de l'action `9952:44374` ; export SVG de `icon/modifier` (`assets/icons/icon-modifier.svg`, attributs racine retirés, boîte 25,8 de l'export, `manifest.json` `MCP_VECTOR_EXPORT`). Captures du 23/10 (ch06) relues pour `9891:39982` et `9959:19518`.
- **Feuille d'identité :** composée sur la `Modal` native (ni `DecisionDialog`, ni `Alert`, ni `ActionSheetIOS` ne portent une explication par choix, exigée par le relevé « deux choix expliqués »).
- **Doublures antérieures à MFN :** `supportsSharedCorrection` faux sans `MovementRepository` → écriture directe, comme avant ; la production injecte le `MovementRepository` (`SessionServiceProvider`, A1.3), donc toute correction est évaluée (report A1.3 traité).
- **Tests adaptés à la règle nouvelle (MFN-09, MFN/AC28), non affaiblis :** `ExerciseEditingPaths.integration.test.tsx` — les parcours MS qui renommaient la Copie modifient un paramètre (2 → 1 série, persistance vérifiée) après avoir constaté le nom verrouillé ; les parcours MS qui ajoutaient, réordonnaient ou retiraient des Médias, ou saisissaient des étapes, constatent désormais le verrou (aucun ajout, aucun menu, aucune action, étapes non modifiables, Copie et Définition inchangées). `mfnServices.a13.test.ts` : attente `ASSESSED` complétée de `phases`. Garde `legacyModeConfinement` : variable `target` renommée `correctionTarget` ; garde lexique `EditorAccessibility` : annotation `Promise` sortie de l'attribut (`SaveOutcome`).
- **Points renvoyés à Hermann (option conservatrice appliquée) :**
  1. Proposition du groupe de niveaux après une nouvelle identité (MFN-08 « Le rattachement au groupe est proposé sans présélection », CE-T03-04 §14 l.862) : aucun libellé documenté ni frame → aucun rattachement (`joinOriginGroup: false`, MFN-05 « aucun rattachement automatique », rattachement ultérieur possible MFN-06 l.148). Proposition : à la suite du choix, une feuille « Ajouter aux niveaux de {geste} ? » Oui / Non sans présélection, en A3.1 avec le popover.
  2. Titre de l'état contenu éditable : Figma `9959:19518` affiche « Modifier le geste » ; ch13 l.4895 fixe « Créer un exercice » / « Modifier un exercice » → titre documenté conservé, « Modifier le geste » reste le nom accessible du crayon (CE-T03-04 §3 l.791).
  3. Explication du second choix en modification Catalogue : `9952:44349` n'illustre que la reprise (« Seul cet exercice change, {nom} reste intact ») ; en modification, « Créer un nouvel exercice » est rendu sans explication (aucun texte documenté). L'explication du premier choix (« La correction s'applique aux {n} exercices qui l'utilisent ») vaut dans les deux contextes ; accord au singulier ajouté (« 1 autre exercice utilise ce geste. »).
  4. Étape de complétion (`NON VÉRIFIABLE`, aucune frame) : libellés tirés du vocabulaire des documents — titre « Durées manquantes », « Passer », « Terminer », « Annuler », vide « — », frère passé « Paramètres à compléter. » ; désignation de chaque frère par le résumé de ses paramètres (MFN-10, même nom de geste).
  5. Reprise d'un geste à phases : paramètres initiaux en Durée, séries identiques, structure du geste, durées à renseigner (MFN-02 éligibilité ; aucune valeur inventée) ; contenu verrouillé ⇒ structure verrouillée jusqu'au crayon.
  6. Correction structurelle d'un geste NON utilisé partagé par des frères : pas de question (MFN-08), mais l'étape de complétion est présentée (le service exige les complétions).
  7. Frère inéligible à la nouvelle structure (A1.3 point 2) : écriture refusée, message d'erreur existant « L'exercice n'a pas pu être enregistré. Réessayez. » (aucun texte dédié documenté).

## Spec Change Log

## Review Triage Log

Passe 1 (24/10/2026) : trois relectures (aveugle, cas limites, lacunes de vérification).

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | verification-gap | Reprise + changement de structure + complétions (`SAME_MOVEMENT` + `siblingCompletions`) jamais exercée à l'écran | medium | Gap pré-vérifié ; patch (test : crayon, phase ajoutée, Corriger ce geste, une durée saisie, un frère passé) |
| 2 | verification-gap | Verrou de la structure en reprise avant le crayon non observé | medium | Gap pré-vérifié ; patch (test : « n phases » indisponible avant, disponible après le crayon) |
| 3 | verification-gap | Catégorie et Zones verrouillées vérifiées par l'état annoncé seulement | medium | Gap pré-vérifié ; patch (test : toucher sans feuille ouverte, reprise et occurrence) |
| 4 | verification-gap + blind | Reprise d'un geste à médias jamais exercée ; déverrouillage par le crayon vérifié sur le nom seulement | medium | Gap pré-vérifié ; patch (test : tuiles en lecture seule, aucune question, `movement_media` intact ; Description, Catégorie, Zones, structure déverrouillées) |
| 5 | edge | « 00:00 » saisi ramené à 1 s en silence ; durée > 58:55 ramenée à 3535 s, affichage différent de la valeur transmise | medium | Vérifié (`cellDurationSeconds` borne) ; patch (`durationEntryValue` : hors bornes = à renseigner ; tests) |
| 6 | blind | « Passer » réalisé par un `Pressable` au rôle switch au lieu de l'interrupteur natif | medium | AGENTS.md (primitive native) ; patch (`Switch` natif, libellé « Passer ») |
| 7 | blind | Frère passé : les durées saisies restent affichées alors qu'elles ne sont pas transmises | low | Correction directe ; patch (champ vidé à l'écran pendant le passage, saisie conservée en mémoire) |
| 8 | edge | `String.replace` interprète `$&`, `$'` d'un nom de geste ou d'un libellé de phase | low | Correction directe ; patch (remplacement par fonction ; test) |
| 9 | blind | « Paramètres à compléter. » dupliqué dans une clé nouvelle | low | Correction directe ; patch (réutilise `executionParameters.card.incomplete`) |
| 10 | edge | `deferred-work.md` non mis à jour (report A1.3 encore ouvert, point du groupe non tracé) | low | Vérifié ; patch (reports ajoutés, report A1.3 marqué traité par cette spec) |
| 11 | blind + edge | Somme des durées d'un frère non contrôlée à l'étape ; refus du service (`INVALID_SIBLING_COMPLETION`, frère inéligible) rendus par le message générique, saisies de l'étape perdues après un échec | medium | Réel ; aucun texte documenté pour ces refus (RM-092, aucune invention) ; defer (`deferred-work.md`, point 7 renvoyé à Hermann) |
| 12 | blind | Crayon : focus VoiceOver non déplacé après sa disparition, aucune annonce | low | Réel ; comportement d'accessibilité à constater sur iPhone ; defer (recette JA) |
| 13 | blind + edge | Frères à résumé identique (ou relu absent) : blocs indiscernables à l'étape | low | Indiscernabilité de duplicatas acceptée (MFN-10, MFN/AC31) ; frère absent = suppression concurrente non montrée atteignable ; rejeté |
| 14 | blind | Couverture retirée (ajout / réordre de Médias, étape vide par Entrée sur une Copie) | low | Comportements désormais interdits sur une Copie (MFN-09) ; mêmes comportements couverts en CS / MC (`PRE4-4.4/AC2 CS`, `AC3 MC`, `PRE5-3.1/AC5 MC`) ; rejeté |
| 15 | blind | Chemin `supportsSharedCorrection` faux non testé | false | Exercé par toute la suite `ExerciseEditingPaths` (service sans `MovementRepository`, parcours MC verts) |
| 16 | blind | `repriseExecutionParameters` rend `base` pour une série variable | low | Inatteignable (`createEmptyExecutionParameters` rend toujours une série identique) ; rejeté |
| 17 | blind | `correctionScope` borne des comptes incohérents | low | Entrées issues du service (entiers ≥ 0) ; rejeté |
| 18 | blind | Gris secondaires différents entre la feuille (`#7A7A80`, Figma) et l'étape (`textSecondary`) | low | Étape `NON VÉRIFIABLE` (aucune frame), valeurs Figma réservées à `9952:44349` ; rejeté |
| 19 | blind | Copie superficielle des médias en reprise ; pas de point final à l'explication ; fondu au lieu d'un glissement | false | Médias immuables (lecture seule) ; texte de `9952:44349` sans point ; animation non spécifiée (recette JA) |
| 20 | blind | Spec et suivi absents du diff relu | false | Fichiers présents dans `_bmad-output/pre7/` (exclus du diff de code par construction) |

Contrôles après correctifs : `npm test -- --maxWorkers=2` 161 suites, 4 233 tests verts ; `npx tsc --noEmit` vert ; `npm run lint` vert. Avant revue : 161 suites, 4 229 tests.
