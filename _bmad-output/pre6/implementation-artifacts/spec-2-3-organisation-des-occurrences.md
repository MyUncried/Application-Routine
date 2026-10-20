---
title: 'Story 2.3 — Organisation des occurrences'
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: '9e63e007dcfe5bd09583eaf03ba78154899590c8'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les opérations d'organisation de la Composition (ajout, duplication, suppression, glisser) ignorent encore le Circuit de Séries (adaptation à N, perte à confirmer), la duplication ne suffixe pas la copie, et aucune alternative accessible au glisser n'existe.

**Approach:** Raccorder l'écran aux opérations pures de l'epic 1 (`moveOccurrence`, `removeOccurrence`, `duplicateOccurrence`, `prepareEnterCircuit` / `enterCircuit`, `exitCircuit`) ; confirmation de perte par le dialogue de décision existant ; suffixe `(copie)` ; actions accessibles sur la carte. Comportements existants conservés.

## Boundaries & Constraints

**Always:**
- Ajout depuis le Catalogue (`ActivitySelectionScreen`) : insertion atomique, ordre de la liste filtrée, aucune récupération automatique (inchangés). Si des copies arrivent dans un Circuit de Séries : adaptation à N de chacune (`enterCircuit`) ; si au moins une perd des séries (`prepareEnterCircuit`), dialogue de confirmation unique avant toute mutation ; Annuler ferme le dialogue sans rien ajouter (sélection conservée) ; Confirmer applique l'ajout adapté puis revient à la Composition. Le Catalogue n'est jamais modifié.
- Création d'une occurrence (`ExerciseScreen`, « Terminer » d'un nouvel exercice) qui arrive dans un Circuit de Séries : même règle (adaptation, confirmation si perte, Annuler reste sur l'écran sans ajout).
- Dupliquer (`duplicateOccurrence`) : copie nommée `{nom} (copie)`, puis `{nom} (copie 2)`, `(copie 3)`… sans collision avec les noms de la Composition (ch13 « Consultation et modification d'un Exercice », D-124) ; tous les paramètres, Pause, Récupération et Point d'arrêt conservés ; insertion juste après la source.
- Supprimer (`removeOccurrence`) : la récupération et le point d'arrêt partent avec l'occurrence ; réserve de Circuit de l'occurrence retirée (`exitCircuit`).
- Glisser-déposer (`moveOccurrence`) : bloc carte + récupération + point d'arrêt ; identifiant conservé ; dépôt invalide (y compris point d'arrêt sur emplacement interdit) → position restituée. Entrée dans un Circuit de Séries : adaptation ; perte → confirmation, Annuler restitue la position ; sortie du Circuit : `exitCircuit`, nombre et paramètres conservés, sans message.
- Dialogue de perte : composant `DecisionDialog` existant, rendu de `8328:34964` (titre Semi Bold 18, message 14, Annuler à gauche, Confirmer à droite). Ajout : titre « Ajouter au circuit de séries ? », message « Les exercices ajoutés auront {N} séries. Les séries au-delà de la {N-ième} seront supprimées, avec les valeurs qu'elles portent. » ; déplacement : titre « Déplacer dans le circuit de séries ? », même message au singulier. Libellés dans `fr.ts` (formulation calquée sur la conversion `8328:34964`, à valider par Hermann).
- Alternatives accessibles (CE-T03-08 §18) : sur chaque carte, `accessibilityActions` « Monter », « Descendre » (une position dans la séquence affichée, en franchissant les limites du Circuit, mêmes règles que le glisser, confirmation comprise), « Dupliquer », « Supprimer ». Le bouton existant d'actions (balayage) est conservé.
- Modifier une occurrence copiée conserve tous ses paramètres PRE-5 ; la Feuille s'ouvre sans Compte à rebours ni Fin d'exercice (RC-7, D-214) — vérifier, sans changement attendu.

**Never:**
- En-tête et compteur du Circuit, choix de nature (epic 3) ; placement des pauses (epic 4).
- Modifier les fonctions pures de l'epic 1 au-delà d'un correctif nécessaire et testé.
- Supprimer le geste de balayage ou l'appui long existants.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ajout en Séries sans perte | N = 4, exercice 3 séries | ajouté avec 4 séries, sans dialogue | — |
| Ajout avec perte | N = 2, exercice 3 séries | dialogue ; Confirmer → 2 séries ; Annuler → rien, reste sur la sélection | — |
| Ajout en Tours | — | inchangé | — |
| Dupliquer | « Squat », puis encore | « Squat (copie) », « Squat (copie 2) » | — |
| Supprimer avec point | A(point) B | B seul | — |
| Glisser vers Séries avec perte | Annuler / Confirmer | position restituée / adaptée et déplacée | — |
| Glisser hors Circuit | — | paramètres conservés, sans message | — |
| Point d'arrêt interdit | dépôt en dernière position | restitution | — |
| Accessibilité | action « Descendre » sur la dernière carte avant le Circuit | entre dans le Circuit (règles du glisser) | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/CompositionScreen.tsx:470-505` -- `handleDropActivity`, `handleDuplicateActivity`, `handleDeleteActivity` (déjà sur `moveOccurrence` / `duplicateOccurrence` / `removeOccurrence`, story 1.2) : ajouter entrée / sortie de Circuit et confirmation ; actions accessibles sur `CompositionActivityRow`.
- `src/domain/sessions/composition.ts` (`duplicateActivity`, D-124) -- suffixe de copie (fonction pure + tests ; le commentaire T02-S02 qui l'avait retiré est mis à jour).
- `src/domain/sessions/circuit.ts` -- `prepareEnterCircuit`, `enterCircuit`, `exitCircuit` (story 1.4).
- `src/features/sessions/DecisionDialog.tsx` -- dialogue réutilisé.
- `src/features/activities/ActivitySelectionScreen.tsx:126-150` -- `handleAdd`.
- `src/features/sessions/ExerciseScreen.tsx:~618-635` -- `handleTerminer`.
- `src/shared/i18n/resources/fr.ts` -- titres, messages, actions accessibles.
- Tests : `composition.test.ts`, `CompositionScreen.test.tsx`, `ActivitySelectionScreen.test.tsx`, `ExerciseScreen.test.tsx`, flux d'intégration existants.

## Tasks & Acceptance

**Execution:**
- [x] `composition.ts` + tests -- suffixe de copie.
- [x] `CompositionScreen.tsx` + tests -- entrée / sortie de Circuit au dépôt, confirmation, actions accessibles.
- [x] `ActivitySelectionScreen.tsx` + tests -- ajout en Séries.
- [x] `ExerciseScreen.tsx` + tests -- création en Séries.
- [x] `fr.ts` -- libellés.

**Acceptance Criteria:**
- Given la suite complète, when `npm test`, `npx tsc --noEmit`, `npm run lint`, then tout est vert ; attentes existantes changées seulement pour le suffixe de copie.
- Given une Séance en Tours, when on ajoute, duplique, supprime ou déplace, then le comportement est identique à avant, sauf le nom de la copie.

## Implementation Notes

- Implémenté par sous-agent (21/10). `circuitMembership.ts` (`settleCircuitMembership`, `copyCircuitReserveEntry`, `planOccurrenceMove`), `nextCopyName`, `resolveStepTarget`, `CircuitEntryConfirmModal.tsx`.
- Revue (3 relecteurs) : correctifs appliqués — nom de copie ≤ 80 et comparé normalisé ; actions Monter / Descendre proposées seulement si le déplacement est accepté ; Confirmer recalcule sur le brouillon courant ; dialogue de sortie prioritaire dans `ExerciseScreen` ; réserve copiée à la duplication ; N affiché = N appliqué ; test de suppression avec réserve ; couleur de dialogue partagée.
- Points soumis à Hermann (J1, `epics.md`) : textes des dialogues de perte ; copie d'une copie ; registre D-124 (lot documentaire, point 7).
- Vérification : Jest 129 suites / 3472 tests, `tsc` et `lint` sans erreur.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npx jest src/domain/sessions src/features` -- expected: vert.
- `npm test` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.

**Manual checks (if no CLI):**
- iPhone (J1, Hermann) : glisser avant / dans / après le Circuit, VoiceOver (actions « Monter », « Descendre »).
