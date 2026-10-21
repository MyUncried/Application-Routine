---
title: 'Story 4.3 — Pauses dans le déroulement et la Composition'
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: 'f7cb765f2849cfa368eab3b8a8f1e5fa72ea8a0e'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La Composition n'affiche pas l'avertissement non bloquant D-301 quand deux exercices s'enchaînent sans pause, et aucun test de bout en bout ne prouve que récupérations et points d'arrêt survivent à l'enregistrement et à la réouverture, ni qu'ils comptent à chaque Tour ou passage dans les durées.

**Approach:** Calculer dans le domaine les enchaînements sans pause à partir du développement de la Composition (`expandComposition`, story 1.3) et afficher un message unique informatif ; ajouter les tests de bout en bout du parcours pauses (placement → Continuer → réouverture) et des durées répétées. Les comportements déjà livrés (rattachement ARB-3, rendu des points, durées) ne changent pas.

## Boundaries & Constraints

**Always:**
- D-301 (ch07 L495, ch10 L556, ch13 L1575) : la condition porte sur chaque frontière entre deux occurrences `EXERCISE` consécutives dans l'ordre d'exécution développé, transitions du Circuit comprises (fin d'un Tour → début du suivant, fin du Circuit → occurrence suivante, passages d'un Circuit de Séries). Elle est vraie quand l'occurrence précédente n'a ni pause effective de transition (dernière Pause de sa dernière série jouée, > 0) ni récupération positive après elle. Un point d'arrêt à cette frontière interrompt l'enchaînement (attente de reprise explicite, RM-191) : pas d'avertissement pour cette frontière. Une seule occurrence `EXERCISE` : jamais d'avertissement.
- Affichage : un seul message, texte exact « Attention, les exercices vont s'enchaîner sans pause. », informatif (style d'information existant, pas d'erreur), au-dessus de l'action finale (et de la barre de placement), annoncé poliment (`accessibilityLiveRegion="polite"`) ; il disparaît dès que plus aucune frontière ne remplit la condition. Il ne bloque ni « Continuer », ni l'enregistrement, ni l'exécution, et ne modifie aucun paramètre.
- Fonction pure dans le domaine (`src/domain/sessions/`) qui renvoie les frontières concernées ; tests sur Tours, Séries, hors Circuit, R positive, R = 0, Pause terminale > 0, point d'arrêt.
- Tests de bout en bout (intégration, base SQLite de test existante) : composer, placer une récupération et un point dans le Circuit et hors Circuit, « Continuer », rouvrir la séance → récupérations (absente / 0 / positive) et points identiques ; durée de la séance relue = durée affichée avant enregistrement, avec récupération et point répétés à chaque Tour (point = 0 s).
- Tests de non-régression du rattachement (déplacer, dupliquer, supprimer une occurrence portant récupération et point) au niveau de l'écran, s'ils ne sont pas déjà couverts par les stories 1.2, 2.3 et 4.2 (vérifier avant d'ajouter).

**Never:**
- Avertissement entre les séries d'un même exercice (D-301 : aucun) ; blocage ou mutation ; nouvelle règle de calcul.
- Modification des stories précédentes au-delà d'un correctif nécessaire et testé.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| A puis B, PN(A) = 0, R absente | hors Circuit | avertissement | — |
| PN(A) = 10 | — | aucun | — |
| R(A) = 20 | PN = 0 | aucun | — |
| R(A) = 0 | PN = 0 | avertissement | — |
| Point après A | PN = 0, R absente | aucun pour cette frontière | — |
| Circuit Tours N = 2 [B], PN(B) = 0 | Tour 1 → Tour 2 | avertissement | — |
| Circuit Séries N = 2 [A, B], Pi = 0 | passages | avertissement | — |
| Un seul exercice | — | aucun | — |
| Continuer | avertissement présent | enregistre normalement | — |
| Réouverture | récupérations et points placés | identiques | — |

</frozen-after-approval>

## Code Map

- `src/domain/sessions/circuit.ts` (`expandComposition`), `src/domain/sessions/calculations.ts`, `src/domain/activities/executionCalculations.ts` (dernière Pause, ledgers) -- base du calcul de frontière.
- `src/features/sessions/CompositionScreen.tsx` -- message au-dessus de l'action finale / de la barre.
- `fr.ts` -- texte.
- Tests : domaine ; `CompositionScreen.test.tsx` ; intégration (`CompositionSaveFlow.integration.test.tsx` ou nouveau fichier `*.integration.test.tsx` sur la base de test, patron existant).

## Tasks & Acceptance

**Execution:**
- [x] Domaine : frontières sans pause + tests (matrice).
- [x] Écran : message D-301 + tests.
- [x] Intégration : pauses de bout en bout (enregistrement, réouverture, durées répétées).
- [x] `fr.ts`.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert.

## Implementation Notes

- **Règle par frontière (à confirmer par Hermann, J3).** Deux jeux consécutifs de la MÊME occurrence ne forment jamais une frontière, en Tours comme en Séries : répétition en Tours d'une occurrence seule dans le Circuit (B1 → B2), ou passages de Séries où les autres exercices n'ont plus de série (A2 → A3). C'est ce qui rend « Une seule occurrence `EXERCISE` : jamais d'avertissement » vrai par construction, sans exemption globale ; la ligne de matrice « Circuit Tours N = 2 [B], PN(B) = 0 → avertissement » est donc lue comme une frontière entre Exercices distincts (testée avec [B, C] : C1 → B2). Une Composition [B] seule et [W, B] donnent la même lecture de B → B (aucun avertissement). Code : `src/domain/sessions/unpausedTransitions.ts`.
- **Annonce.** `accessibilityLiveRegion="polite"` est conservé (Android) ; l'écran annonce aussi le message par `AccessibilityInfo.announceForAccessibility` à chaque apparition (absent → présent).
- **Non-régression du rattachement : aucun test ajouté**, déjà couvert au niveau de l'écran (`src/features/sessions/__tests__/CompositionScreen.test.tsx`) :
  - récupération — « moves the Récupération WITH its Activity — the sub-card follows the block across zones », « AC-06 (T02-S02) — Dupliquer copies the attached Récupération, sub-card included », « removes the Récupération with its Activity — `Supprimer` never leaves an orphan sub-card » ;
  - point d'arrêt (story 1.2, « Points d'arrêt du brouillon ») — « un dépôt valide : le point suit son occurrence », « Dupliquer copie le point de la source sur la copie, juste après elle », « Supprimer retire le point rattaché à l'occurrence » ; (story 2.3) « Supprimer une occurrence portant un point d'arrêt : le point part avec elle ».

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | blind | Même frontière jugée selon le nombre d'exercices ailleurs ; Tours et Séries incohérents | medium | patch : règle par frontière, deux passages de la même occurrence jamais signalés ; à confirmer par Hermann (J3). |
| 2 | blind | Annonce absente sur iOS | medium | patch : `announceForAccessibility`. |
| 3 | verification-gap | Câblage de la nature non épinglé à l'écran | medium | patch : test Séries ≠ Tours. |
| 4 | blind | Cas de domaine manquants (point après le Circuit, passage sauté, mode inconnu, R en fin de Circuit) | low | patch : tests. |
| 5 | blind | Bout en bout : point après le Circuit, avertissement après réouverture ; robustesse (base, `act`, plateforme) | low | patch. |
| 6 | blind | Vérification du rattachement non consignée | low | patch : note. |
| 7 | blind | Pause lue hors du registre de durées | low, rejeté | Même dernière Pause que le registre ; tests bilatéraux et normalisation N = 1 relus sans écart (verification-gap). |
| 8 | blind | Ancienne Récupération autonome à 0 s | false | Une Récupération autonome convertie porte toujours une durée ≥ 1 (D-041, `migration004`). |
| 9 | blind | Ordre avec l'erreur d'enregistrement ; apostrophe de la spec ; citations ; statuts | low, rejeté | Hors défaut constaté ; texte exact dans `fr.ts` avec l'apostrophe des sources. |

## Verification

**Commands:**
- `npx jest src/domain/sessions src/features/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
