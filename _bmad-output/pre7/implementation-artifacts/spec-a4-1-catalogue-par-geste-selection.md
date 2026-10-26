---
title: 'A4.1 — Catalogue par geste et sélection'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: '60ee7eb532e55ec61d693eab5da7f2e0754e3876'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/implementation-artifacts/epic-A4-context.md'
  - '{project-root}/src/features/activities/README.md'
  - '{project-root}/src/features/sessions/README.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le Catalogue des Exercices et la modale « Sélection des exercices » de la Composition listent les définitions à plat par `updatedAt DESC` : deux Exercices du même geste peuvent y être séparés, alors que « la liste regroupe les définitions par geste ; chaque définition garde son identité et son résumé de paramètres » (CE-T03-02 §5 ch13 l.695, CE-T03-07 §5 l.1391, MFN-10 ch10 l.452-454, D-439). Report A2.1 : un frère incomplet est sélectionnable pour une Séance et n'est refusé qu'à l'enregistrement.

**Approach:** Ordre regroupé par geste, calculé par le domaine A1.3 (`groupDefinitionsByMovement`, groupes dans l'ordre de première apparition de la liste `updatedAt DESC`, définitions dans cet ordre), appliqué par `useActivityCatalogue` aux deux listes. Chaque définition reste sa propre carte existante (`ActivityCard`, `SelectionRow`) avec son résumé (`formatExerciseRowSummary`) : aucune ligne de groupe n'existe, donc rien ne se lance ni ne s'insère sans désigner une définition. La sélection insère dans cet ordre affiché ; copie, filiation et duplication restent celles d'A1.3, prouvées de bout en bout sur SQLite réelle.

## Boundaries & Constraints

**Always:** D-437, D-439, D-124, MFN-03, MFN-09, MFN-10, CE-T03-02, CE-T03-07, D-389 ; tri par défaut, filtres (inertes), gouttière et géométrie des cartes inchangés ; aucun alias ni paramètre choisi implicitement ; copie = contenu résolu (libellés de phases compris) + `sourceMovementId` non nul ; Fermer / Annuler sans mutation ; insertion atomique ; insertion dans un brouillon abandonné sans marque « déjà utilisé » ; textes au lexique, jamais « mouvement » ; trois contrôles verts ; tests existants non affaiblis.

**Never:** en-tête, ligne ou espacement de groupe inventés (aucune frame : `NON VÉRIFIABLE`, ch13 l.157) ; recherche ou filtre dans le Catalogue ou la modale (D-221, CE-T03-07) ; actions glissées Planifier / Dupliquer / Archiver (D-196, hors périmètre) ; message d'erreur supplémentaire pour un frère incomplet (D-389) ; nouvelle route ; migration, schéma, `tokens.ts`, `package.json`, `app.json`, `.github/`, `main`.

**Décisions conservatrices (Hermann absent, à valider — détail en Implementation Notes) :** regroupement rendu par la seule contiguïté des cartes existantes ; frère incomplet sélectionnable (définition active), signalé par le résumé existant « Paramètres à compléter. » sur la carte de choix puis sur la carte d'occurrence, `Continuer` désactivé tant qu'il n'est pas complété dans l'occurrence (durées = paramètres modifiables, MFN-02, MFN-09).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Regroupement | A1 (récent), B, A2 (même geste que A1) | A1, A2, B ; deux cartes distinctes, résumés propres | lecture en échec → état d'erreur existant |
| Duplicatas identiques | deux définitions du geste, mêmes paramètres | deux cartes, deux identifiants (MFN/AC31 accepté indiscernable) | N/A |
| Sélection | touchers B puis A2 puis A1 | copies insérées A1, A2, B ; `sourceMovementId` de chacune | Annuler / ✕ → brouillon inchangé |
| Contenu résolu | définition à phases libellées | copie avec libellés et durées ; source non relue ensuite | N/A |
| Frère incomplet | définition `missingPhaseIds` | carte « Paramètres à compléter. », sans durée ; insérable ; `toCreateSessionInput` refusé (Continuer inactif) | aucun message |
| Brouillon abandonné | insertion sans enregistrement | geste `used = 0` | N/A |
| Duplication en Composition | copie dupliquée puis Séance enregistrée | nouvel id, même `sourceMovementId`, « (copie) » ; geste et définitions non renommés ; `used = 1` | N/A |

</frozen-after-approval>

## Code Map

- `src/domain/activities/ActivityDefinition.ts:407-430` -- `groupDefinitionsByMovement` (A1.3) réutilisé tel quel ; `activityDefinitionToDraftExercise:368` (copie + `sourceMovementId`) inchangé.
- `src/features/activities/ActivityDefinitionService.ts:475` -- `listActivityDefinitionsByMovement` = `groupDefinitionsByMovement(listAll())` ; même calcul appliqué dans le hook sur `listActivityDefinitions()` (les doublures de test existantes ne fournissent que cette méthode).
- `src/features/activities/useActivityCatalogue.ts` -- l'état `ready` porte `definitions` à l'ordre regroupé (aplati) ; seul point modifié pour les deux listes.
- `src/features/activities/ActivityCatalogueList.tsx` -- `FlatList` sur `state.definitions`, `ActivityCard` inchangé ; JSDoc à mettre à jour (« jamais retriée ici » → ordre regroupé du hook).
- `src/features/activities/ActivitySelectionScreen.tsx` -- `planAdd` filtre `state.definitions` (ordre affiché) : rien à changer hors JSDoc ; `SelectionRow` inchangé.
- `src/features/sessions/compositionPresentation.ts:234` -- Cible `UNSET` → « Paramètres à compléter. » (déjà le signal du frère incomplet).
- `src/features/sessions/CompositionScreen.tsx:2666` -- `Continuer` inactif si `toCreateSessionInput` refuse ; inchangé.
- `src/domain/sessions/composition.ts:916` -- `duplicateOccurrenceOutcome` / `duplicateActivity` (D-124, filiation) ; inchangé.
- Patrons de test : `features/sessions/__tests__/ExerciseScreen.mfn.a32.integration.test.tsx` (services réels, `NodeSqliteDatabase`), `infrastructure/database/__tests__/mfnServices.a13.test.ts` (`SessionService`, `occurrencesOf`), `features/activities/__tests__/ActivitySelectionScreen.test.tsx` (contexte de brouillon, `expo-router` simulé).

## Tasks & Acceptance

**Execution:**
- [x] `src/features/activities/useActivityCatalogue.ts` -- ordre regroupé par `groupDefinitionsByMovement` ; JSDoc D-439 / CE-T03-02.
- [x] `src/features/activities/ActivityCatalogueList.tsx`, `ActivitySelectionScreen.tsx` -- JSDoc (ordre regroupé, ordre d'insertion = ordre affiché regroupé).
- [x] `src/features/activities/__tests__/useActivityCatalogue.test.ts` -- cas regroupé (gestes entrelacés), ordre interne conservé.
- [x] `src/features/activities/__tests__/catalogueByMovement.a41.test.tsx` (nouveau, SQLite réelle) -- matrice : Catalogue regroupé, duplicatas, sélection dans l'ordre affiché, contenu résolu, Annuler, frère incomplet (résumé, insertion, refus), brouillon abandonné, duplication puis enregistrement.
- [x] READMEs `src/features/activities/`, `deferred-work.md` (report A2.1 traité), `sprint-status.yaml`.

**Acceptance Criteria:**
- Given deux Exercices d'un geste et un troisième d'un autre geste modifié entre eux, when le Catalogue et la modale s'affichent, then les deux Exercices du geste sont contigus, chacun avec sa carte et son résumé.
- Given l'application, when les trois contrôles s'exécutent, then ils sont verts.

## Implementation Notes

- **Point unique :** `useActivityCatalogue` aplatit `groupDefinitionsByMovement(listActivityDefinitions())` ; `ActivityCatalogueList`, `ActivitySelectionScreen` (`planAdd` filtre `state.definitions`, donc l'ordre affiché regroupé) et `SelectionRow` / `ActivityCard` inchangés hors JSDoc. `listActivityDefinitionsByMovement` (A1.3) n'est pas appelé : les doublures de test existantes ne fournissent que `listActivityDefinitions`, et le calcul est le même.
- **Points renvoyés à Hermann (option conservatrice appliquée) :**
  1. Regroupement rendu par la seule contiguïté des cartes : aucun en-tête, nom de geste, séparateur ni espacement de groupe (aucune frame, `NON VÉRIFIABLE`, ch13 l.157). Alternative : un repère de groupe, à dessiner d'abord dans Figma.
  2. Frère incomplet sélectionnable dans la modale (définition active ; durées = paramètres modifiables de l'occurrence, MFN-02, MFN-09), signalé par le résumé existant « Paramètres à compléter. » (carte de choix sans durée, puis carte d'occurrence) ; `Continuer` inactif tant qu'il n'est pas complété ; aucun message (D-389). Alternative : l'exclure de la modale.
- **Ordre interne d'un groupe :** celui de la liste (`updatedAt DESC`) ; l'ordre des niveaux (A3.2) n'intervient pas, le regroupement est par geste et non par groupe de niveaux.
- **Recette JA :** Catalogue et modale avec deux Exercices d'un geste et un autre geste modifié entre eux (contiguïté), frère incomplet (résumé, insertion, `Continuer` inactif), 360 / 402 / 440, texte agrandi.

## Spec Change Log

## Review Triage Log

Passe 1 (24/10/2026) : trois relectures (aveugle, cas limites, lacunes de vérification), sous-agents indépendants. Lacunes de vérification : aucune lacune ; une « autre constatation » (#2).

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | blind + edge | Test « contenu résolu » : aucune relecture après la modification de la source, assertion vide | low | Vérifié (aucun `reload` ni remontage) ; patch (remontage, nouveau résumé de la source, copie inchangée) |
| 2 | blind + verification-gap | « Continuer inactif » affirmé, jamais rendu | low | Comportement préexistant non modifié (`CompositionScreen.tsx:2666`, condition `toCreateSessionInput`) ; patch (titre du test exact) |
| 3 | blind | « Aucun message » D-389 à moitié testé ; carte Catalogue du frère non testée | low | Aucun chemin d'`Alert` ou de message dans le diff ; même `formatExerciseRowSummary` que la carte de choix testée ; rejeté |
| 4 | blind | Test de duplication sans écran de Composition | low | Vérifié (appel de `duplicateActivity`, comme l'écran) ; patch (titre exact) |
| 5 | blind | « Brouillon abandonné » jamais abandonné | low | Vérifié ; patch (démontage avant lecture de `used`) |
| 6 | blind | Annuler / ✕ : une seule table comparée | low | Vérifié ; patch (`movements` et `sessions` comparées) |
| 7 | blind | Regroupement calculé en double (hook et service) | low | Même fonction de domaine des deux côtés ; dérive possible si le service change ; patch (JSDoc liant les deux) |
| 8 | blind + edge (×2) | Assistant `order()` dépendant du format `def-N` ; filtre du test Catalogue masquant une carte intruse, différent du test de la modale | low | Format d'identifiant local au test, échec bruyant s'il change ; filtre réel ; patch (filtre retiré), reste rejeté |
| 9 | blind | Choix conservateurs présentés comme établis dans README / JSDoc | low | Vérifié ; patch (mention « à valider par Hermann » au README) |
| 10 | blind | Rechargement pendant une sélection qui réordonne les groupes non testé | low | Sélection par identifiant, ordre pris à la validation (`planAdd`) : comportement voulu (CE-T03-07 « ordre courant ») ; rejeté |
| 11 | blind | Échec de lecture non testé de bout en bout | low | Chemin d'erreur inchangé, couvert par `useActivityCatalogue.test.ts` et `ActivityCatalogueList.test.tsx` ; rejeté |
| 12 | blind | Titre renommé d'`ActivityCatalogueList.test.tsx` trompeur | low | Vérifié (une seule `movementId`) ; patch (titre exact) |
| 13 | blind | Import mixte baril / module, README sans le test renommé, compteurs non remis à zéro | low | Ligne de type du baril préexistante ; compteurs : identifiants uniques suffisent ; rejeté |
| 14 | edge | Rechargement : un groupe entier remonte, position de défilement restituée sur d'autres cartes | low | Même effet qu'avant pour l'Exercice modifié (`updatedAt DESC`) ; conséquence assumée du regroupement ; rejeté |

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

Contrôles après correctifs : `npm test -- --maxWorkers=2` 172 suites, 4 309 tests verts ; `npx tsc --noEmit` vert ; `npm run lint` vert.
