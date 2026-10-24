---
title: 'A1.1 — Domaine Mouvement et paramètres v4'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: '91359946ea1a598c9b4e4a95145a0669a2ebf4bf'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/implementation-artifacts/epic-A1-context.md'
  - '{project-root}/src/domain/README.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** MFN (D-437 à D-440, MFN-01 à MFN-13) n'existe pas dans le domaine : aucun Mouvement, des phases `{id,label,durationSeconds}` aplaties dans les paramètres v3, un `nextPhaseId` recalculé par max + 1 (réutilisation possible d'un identifiant retiré), et un nettoyage silencieux des phases à 0 ou vides au ✓ que D-438 abolit.

**Approach:** Poser, en domaine pur couvert par des tests unitaires, le type `Movement` (contenu partagé, structure `{id,label}`, compteur monotone, « déjà utilisé », groupe de niveaux), les paramètres Catalogue v4 (`{phaseId, durationSeconds|null}`, sérialiseur et lecteur stricts), la résolution structure + valeurs vers la représentation résolue existante avec un état exécutable / incomplet, `ActivityDefinition.movementId`, et adapter validateur et brouillon (fin du nettoyage silencieux, croix à 2 phases, 2 → 1 = Sans), sans changer phrase ni calculs pour une définition complète.

## Boundaries & Constraints

**Always:** domaine pur (aucun React, SQLite, Expo, i18n) ; les cas métier attendus en unions discriminées, une donnée corrompue lève `ExecutionParametersDataError` ; la représentation résolue (`ExecutionParameters`, `WorkPhase`) reste celle que consomment Feuille, phrase, calculs, Séance et Instantané ; le lecteur v3 (`readExecutionParameters`) reste en place tant que la persistance en dépend (suppression avec la migration 012, A1.2) ; une version inconnue n'est jamais rabattue sur une durée scalaire ; identifiants `ActivityDefinition` / `ACTIVITY` inchangés ; aucun terme métier « Set » ; noms de code anglais, commentaires français citant les décisions ; `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint` verts au commit.

**Never:** migration, schéma, repository SQLite ou `MovementRepository` (A1.2) ; services et transport de `sourceMovementId` (A1.3) ; comportement MFN nouveau dans l'interface, y compris l'activation de la croix à 2 phases dans `WorkPhasesTable.tsx` (A2.1) ; modification de `migration001.ts`, `tokens.ts`, `package.json`, `app.json`, `.github/` ; affaiblir un test existant (seuls les tests qui décrivent le nettoyage silencieux aboli par D-438 sont réécrits sur la règle nouvelle).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Aller-retour complet | paramètres résolus à phases [6, 3] | `split` → structure `{id,label}` + v4 `{phaseId,6|3}` ; `resolve` → paramètres identiques ; phrase et durée identiques | N/A |
| Frère incomplet | structure [1,2,3], v4 [1:6, 2:3, 3:null], Cible `UNSET` | `INCOMPLETE`, `missingPhaseIds: [3]`, paramètres éditables (durée manquante à 0, ouverte `null` dans le brouillon) | N/A |
| Structure ≠ valeurs | ids v4 ≠ ids de la structure | — | `ExecutionParametersDataError` |
| Lecture v4 | JSON v3, v5, `null`, durée 0, phase dupliquée | — | `ExecutionParametersDataError`, jamais de repli |
| ✓ avec durée vide | brouillon [9, null] ou [6, 0, 3] | ✓ refusé, phases conservées, violations `REQUIRED` `workPhases` par `phaseId` | N/A |
| Croix à 2 phases | brouillon [9, 4], retrait de la phase 2 | Sans, Cible 9 s, annulation restitue les deux phases | durée restante `null` → Cible `UNSET` |
| Compteur monotone | Mouvement `nextPhaseId: 5`, phases [1,2] | brouillon ouvert avec `nextPhaseId` 5 ; la phase ajoutée reçoit 5 ; compteur rendu ≥ 6 | compteur ≤ max(id) → violation |

</frozen-after-approval>

## Code Map

- `src/domain/activities/ExecutionParameters.ts` -- seul module des formats : types résolus v3 (`WorkPhase`, `UniformSeries`, `ExecutionParameters`, l.140-205), `workPhasesProblem` (l.718), `validateForSave` (l.831), sérialiseur et lecteurs v2/v3 (l.1051-1285). Y ajouter les types v4 Catalogue, leur invariant, `serializeCatalogExecutionParameters` et `readCatalogExecutionParameters` (réutilise `parseParametersJson`, `readRootFields`, `readUniformCount`, `readTargetAndPause`, `readLoadKg`, `encodeTarget`), et la violation `REQUIRED` + `phaseId` pour une durée de phase manquante.
- `src/domain/activities/ExecutionParametersDraft.ts` -- `openSheetDraft` (l.199, `nextPhaseId` = max + 1 l.253), `normalizeWorkPhases` (l.1065, nettoyage à abolir), `sheetDraftResult` (l.837), `removeWorkPhase` (l.970, refusé à 2), `undoWorkPhaseRemoval` (l.981), `PendingRemoval` (l.111).
- `src/domain/activities/ActivityDefinition.ts` -- type lu `ActivityDefinition` (l.48-80) : y ajouter `movementId`.
- `src/domain/activities/Movement.ts` (nouveau) -- `Movement`, `MovementPhase`, `MovementLevelGroup`, validation, compteur, résolution et état exécutable.
- `src/domain/sessions/validation.ts` -- `validateExerciseName`, `validateInstruction` à réutiliser pour le Mouvement.
- `src/domain/media/ActivityMedia.ts` -- `DraftMediaItem` (médias ordonnés, ordre = position).
- `src/domain/activities/testing/executionParametersFixtures.ts` -- `uniformParameters` pour les tests.
- `src/domain/activities/executionPhrase.ts` (`generateExecutionPhrase`), `executionCalculations.ts` (`computeIntrinsicDuration`) -- inchangés, utilisés par le test d'équivalence.
- `src/domain/activities/__tests__/ExecutionParametersDraft.test.ts` l.1415-1580 -- tests du nettoyage silencieux (AC5) et du refus de la croix à 2 (QR-1), à réécrire sur D-438.
- `src/features/activities/WorkPhasesTable.tsx:215`, `ExecutionParametersSheet.tsx:800-810` -- croix désactivée à 2 phases : NE PAS modifier (A2.1).
- `src/domain/README.md` -- section activities à compléter.

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/activities/ExecutionParameters.ts` -- ajouter `CATALOG_EXECUTION_PARAMETERS_VERSION = 4`, `PhaseDuration`, `CatalogUniformSeries`, `CatalogExecutionParameters`, invariant `phaseDurationsProblem`, sérialiseur et lecteur v4 stricts ; `workPhasesProblem` distingue la durée manquante (0) et `validateForSave` émet `REQUIRED` `workPhases` avec `phaseId` -- format unique et fin du nettoyage silencieux côté validateur.
- [x] `src/domain/activities/Movement.ts` -- types, `validateMovement`, `advancePhaseCounter`, `withPhaseStructure`, `markMovementUsed`, `splitResolvedParameters`, `resolveCatalogParameters` (union `EXECUTABLE` / `INCOMPLETE`, `DataError` si structure ≠ valeurs), `validateCatalogParameters` (exercice édité complet ou frère incomplet accepté) -- domaine MFN.
- [x] `src/domain/activities/ActivityDefinition.ts` -- `movementId` sur le type lu -- relation active.
- [x] `src/domain/activities/ExecutionParametersDraft.ts` -- option `nextPhaseId` à l'ouverture (monotone), durée < 1 ouverte `null`, `normalizeWorkPhases` limité au nommage par défaut, `removeWorkPhase` à 2 → Sans (durée restante = Cible) avec annulation restituant les deux phases -- D-438.
- [x] `src/domain/activities/__tests__/Movement.test.ts`, `catalogExecutionParameters.test.ts` (nouveaux), `ExecutionParametersDraft.test.ts`, `ExecutionParameters.test.ts` -- couvrir la matrice ; réécrire les tests du nettoyage aboli -- preuve unitaire.
- [x] `src/domain/README.md` -- documenter les ajouts.

**Acceptance Criteria:**
- Given un exercice édité complet à phases, when il est scindé puis résolu, then les paramètres, la phrase (`generateExecutionPhrase`) et la durée (`computeIntrinsicDuration`) sont identiques à l'original.
- Given un Mouvement dont la phase de plus grand identifiant a été retirée, when on rouvre et ajoute une phase, then l'identifiant retiré n'est pas réutilisé (MFN/AC30).
- Given une durée de phase vide dans l'exercice édité, when on valide, then l'enregistrement est refusé et la phase est conservée (MFN/AC15, AC25).
- Given un frère incomplet, when on le valide en mode « frère accepté », then il est valide et `INCOMPLETE`, jamais `EXECUTABLE` (MFN/AC24).
- Given l'application, when les trois contrôles s'exécutent, then ils sont verts sans test existant affaibli.

## Design Notes

Décisions d'intégration (choix sans effet visible, ou option la plus conservatrice compatible avec les documents) :

- **Deux représentations.** `ExecutionParameters` (v3) reste la représentation **résolue** (copies, Feuille, phrase, calculs, Instantané ; ch10 MFN-02 « représentation résolue des copies contenant le libellé »). `CatalogExecutionParameters` (v4) est la forme Catalogue, sans libellé (aucune seconde source modifiable). Le format JSON des copies après 012 est laissé à A1.2 (proposition : forme résolue en v4, retrait de `readV2`/`readV3` avec la migration).
- **Nature des phases sur le Mouvement** (ch10 l.278, « Nature, libellés et ordre des phases → Mouvement ») : la résolution exige l'égalité exacte des identifiants entre structure et valeurs (vide ⇔ vide) ; un écart est une donnée invalide (`DataError`).
- **Frère incomplet en v4 :** au moins une durée `null` ⇒ Cible `UNSET` (aucun total inventé, jamais exécutable) ; complet ⇒ Cible `NUMBER` = Σ. Une durée 0 n'est jamais stockée : `null` est la seule absence.
- **Durée 0 ≡ non renseignée (D-438)** : refusée au ✓ (`REQUIRED`, `phaseId`), ouverte `null` par le brouillon.
- **Croix à 2 phases :** autorisée par le domaine seulement ; le stepper reste borné 2..6 (D-432) ; une phase unique relue des données n'est pas retirable par la croix (Sans reste le geste). L'interface (croix active à 2) est à A2.1.
- **`movementId` optionnel sur le type lu** jusqu'à la colonne de 012 (A1.2), même patron de transition que `categoryId?` ; A1.2 le rend obligatoire.
- **Renvoyé à Hermann (A1.3, non tranché ici) :** lors d'une correction partagée qui retire toute la structure (Avec → Sans, ou retrait de l'avant-dernière phase), quelle durée de série reçoit un exercice frère ? Sources : ch10 `10 – Processus métier et règles métier transverses.md:300` (D-371 au geste de retrait), `:428-433` (étape de complétion, frère incomplet). Proposition : la somme de ses durées si elle est complète, sinon durée à renseigner (frère incomplet), sans valeur inventée. A1.1 ne fournit pas de réassociation des frères.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

## Implementation Notes

- Écart au Code Map, hors domaine : `src/features/activities/ExecutionParametersSheet.tsx` (calcul de `uniformTargetViolation`, hors l.800-810) ignore désormais une violation `workPhases` portant un `phaseId`. Sans cela, une durée de phase manquante marquait aussi « Durée d'une série » (« Valeur à renseigner »), un rendu nouveau. Le test `ExecutionParametersSheet.phases.test.tsx` « ✓ avec [9, —] → Sans » (nettoyage aboli) est réécrit : ✓ indisponible, phases conservées. Conséquence visible héritée du domaine : dans la Feuille actuelle, ✓ est indisponible tant qu'une phase n'a pas de durée.
- Choix sans effet visible : `MovementLevelGroup.sortKey` est un nombre fini ; `Movement.media` réutilise `DraftMediaItem` ; `splitResolvedParameters` rabat la Cible à `UNSET` quand une durée manque ; `serializeCatalogExecutionParameters` lève sur invariant rompu ; `resolvedWorkPhasesProblem` est exporté pour la résolution.

- Revue (passe 1) : correctifs retenus appliqués (lignes 1, 2, 3, 6, 10, 11, 12, 14, 16, 21 du journal de triage) : tests de refus du lecteur v4 en séries variables ; commentaires et citations alignés sur le texte de D-438 (ch07 l.15) ; cellule de phase signalée aussi à durée < 1 s (défensif : la Feuille ne produit pas 0 aujourd'hui) ; `withPhaseStructure` lève sur la réintroduction d'une identité retirée (MFN/AC30) ; frère incomplet normalisé (`normalizeEffective`) ; README complété. Deux renvois dans `deferred-work.md` (total partiel du brouillon, A2.1 ; écriture v3 d'un frère incomplet, A1.2/A1.3).
- Audit de la matrice : chaque ligne est couverte par `Movement.test.ts`, `catalogExecutionParameters.test.ts`, `ExecutionParameters.test.ts` et `ExecutionParametersDraft.test.ts`, exécutés et verts.
- Contrôles finaux : `npm test -- --maxWorkers=2` 151 suites, 4 120 tests verts ; `npx tsc --noEmit` vert ; `npm run lint` vert.
- Laissé explicitement : A1.2 (format JSON des copies après 012, retrait de `readV2`/`readV3`, `movementId` obligatoire, persistance v4 et du Mouvement, `MovementRepository`) ; A1.3 (réassociation des durées des frères, question renvoyée à Hermann en Design Notes, transport de `sourceMovementId`) ; A2.1 (croix active à 2 phases dans `WorkPhasesTable.tsx`, affichage d'une durée vide et d'un frère incomplet).

## Spec Change Log

## Review Triage Log

Passe 1 (24/10/2026) : trois relectures (aveugle, cas limites, lacunes de vérification).

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | verification-gap | Branche VARIABLE du lecteur v4 sans test de refus (`rows: []`, ligne sans `loadKg`, `kind` inconnu) | medium | Gap pré-vérifié ; patch (tests) |
| 2 | verification-gap + blind | Commentaires périmés : `ExecutionParametersSheet.tsx:800-801` (« refusé à deux phases »), `WorkPhasesTable.tsx:214` (QR-1), JSDoc de `setWorkPhaseCount` | low | Le domaine accepte 2 → Sans ; seule la prop `disabled` garde la croix ; patch (commentaires) |
| 3 | blind | Phase à 0 s : ✓ bloqué sans cellule signalée (`missing` ne teste que `null`, `ExecutionParametersSheet.tsx:1736`) | medium | Vérifié : 0 était nettoyé avant D-438, il bloque désormais sans repère ; patch (cellule invalide aussi à durée < 1) |
| 4 | blind | Brouillon : total partiel `NUMBER(Σ connus)` alors que v4 impose `UNSET` si incomplet | low | Comportement PRE-5 de `deriveSeriesDuration`, affichage seulement, ✓ refusé ; defer (A2.1, « durée vide conservée ») |
| 5 | blind | Impasse à 2 phases, croix désactivée non testée | false | Croix désactivée assertée `ExecutionParametersSheet.phases.test.tsx:345-346` ; saisir la durée ou Sans débloque |
| 6 | blind | `withPhaseStructure` accepte la réintroduction d'une identité retirée (< compteur, absente de la structure précédente) | medium | Vérifié : [1,2] compteur 4 → [1,2,3] accepté ; patch (entrée invalide → lève, convention du domaine) |
| 7 | blind | Écrivain v4 ne contrôle que les phases (série variable vide écrite) | low | Même contrat que l'écrivain v3 ; garde supplémentaire ; rejeté |
| 8 | blind | Paramètres résolus `INCOMPLETE` (durée 0) sérialisables en v3 puis illisibles | maybe-false | Aucun appelant aujourd'hui ; à garantir en A1.2/A1.3 (une copie n'est créée que d'un exercice exécutable) ; defer (medium non vérifié) |
| 9 | blind + edge | `validateMovement` : médias en double non refusés, code de l'incohérence asset | low | Aucune règle documentée d'unicité des médias ; rejeté |
| 10 | blind | Annulation 2 → Sans : cas durée restante 0 et invalidation Q29 non testés | low | Tests seuls, correction directe ; patch |
| 11 | blind | Citations « D-438 remplace QR-1 / QR-2 » non explicites dans D-438 (ch07 l.15 nomme D-373, D-371/D-432 pour le retrait, FR-3/FR-9/AD-20) | low | Règle du clone (remplacement explicite) ; patch (citations alignées sur D-438) |
| 12 | blind | Test Feuille renommé n'asserte pas la cellule « — » invalide | low | Corrigé avec #3 ; patch |
| 13 | blind | `validateCatalogParameters` perd la raison d'un écart | low | Ajouter une raison = surface publique ; rejeté |
| 14 | blind | README : exports publics non listés | low | Correction directe ; patch |
| 15 | edge | `EDITED` incomplet avec `validateForSave` ok | false | Inatteignable : une durée 0 donne toujours `REQUIRED` (`workPhasesProblem` MISSING) |
| 16 | edge | `SIBLING_ACCEPTED` rend les paramètres non normalisés (N = 1, côté) | low | Vérifié : le chemin `EXECUTABLE` rend `result.value` normalisé, pas le frère ; patch (`normalizeEffective`) |
| 17 | edge | `validateMovement` lève sur nom non chaîne / média `null` | false | Entrée hors type ; échec bruyant sur une donnée corrompue jamais montrée atteignable |
| 18 | edge | Compteur `NaN` dans `advancePhaseCounter` | false | Hors type ; `validateMovement` le refuse |
| 19 | edge | `rows` non tableau dans `resolveCatalogParameters` | false | Hors type ; le lecteur v4 garantit la forme |
| 20 | edge | Durée manquante masque une Cible `FAILURE` | low | Le brouillon interdit À l'échec avec phases ; garde supplémentaire ; rejeté |
| 21 | edge | JSDoc « Ne lève jamais » de `validateCatalogParameters` trop large | low | Correction directe du commentaire ; patch |
