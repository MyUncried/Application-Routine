---
title: "Story 2.2 — Cartes d'occurrence"
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: '3dfa9eac8f148d4fb4bb61651ec7cfcfcbeee8d1'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La carte d'occurrence de la Composition ne suit pas le composant Figma actualisé `DSF / Cards / Composition — exercice` (`5544:6797`) : pas de classification (pastille + catégorie), synthèse non conforme à la notation du chapitre 13 (D-238), indicateur de côté non neutre (report AC6 de PRE-5). La carte de sélection d'exercice (`DSF / Cards / Exercice` `6214:7278`, contexte « Choix composition ») a aussi été ajustée (PR #390, ch13 L1256).

**Approach:** Refaire le rendu de la carte d'occurrence dans un composant dédié, à partir des données existantes de l'occurrence (nom, catégorie, zones, paramètres d'exécution), avec une fonction pure de synthèse ; ajouter l'icône neutre de changement de côté (ARB-2 clos) ; ajuster la carte de sélection dans son seul contexte « Choix composition ». Aucune règle de calcul ni paramètre PRE-5 modifié.

## Boundaries & Constraints

**Always:**
- Carte d'occurrence (`5544:6797`) : fond blanc, bordure 1 (#E4E4EB, constante nommée si sans jeton), rayon 14, padding 14 / 12 ; largeur de son conteneur (hors Circuit et dans le Circuit).
  - Ligne 1 : nom, Inter Semi Bold 15, texte primaire, une ligne, ellipse.
  - Ligne 2 (ligne de classement) : pastille ronde 6 couleur de la catégorie, puis catégorie (Inter Semi Bold 12, #46464C) et « · zones » (Inter Regular 12, texte tertiaire) ; une ligne ; la partie zones est tronquée en premier ; écart minimal 8 avec la synthèse. Sans catégorie : pas de pastille ni de nom de catégorie, zones seules ; sans zone : catégorie seule ; ni l'un ni l'autre : ligne vide.
  - Synthèse en bas à droite, sur la ligne 2, Inter Medium 12 (#46464C), alignée à droite. Variante Répétitions + bip : seconde ligne « durée estimée » en Inter 11 sous la synthèse (`9522:43875`), hauteur de carte 70.
  - Icône de changement de côté 16 en haut à droite, seulement si l'exercice a un changement de côté (`sideMode` bilatéral) ; bord droit aligné sur celui de la synthèse ; aucune flèche, aucun badge, aucune direction (RM-243, D-407, ARB-2).
- Synthèse (D-238, ch13 « Résumé de la ligne d'un Exercice ») — fonction pure : séries identiques `N × cible` avec unité (« 3 × 1 min 30 », « 3 × 10 rép. ») — une seule série : la cible seule (« 45 s », « 10 rép. ») ; séries variables : cibles séparées par « · », unité à la fin, au plus trois valeurs puis « … » ; À l'échec : libellé métier existant ; paramètres incomplets : libellé existant « Paramètres à compléter ». Durée au format `formatCompactDuration` existant. Le nom et le mode ne sont pas répétés ; aucun texte de pause ni de récupération dans la carte.
- En Circuit de Séries, la carte reflète les N séries effectives de l'occurrence (aucune règle propre : la synthèse lit les paramètres adaptés par la story 1.4).
- Nom accessible de la carte : type (« Exercice »), nom, position dans sa zone (« n sur m ») et durée d'occurrence (CE-T03-08 §18).
- Gestes, ligne de récupération (story 2.1), états soulevé et balayé, ouverture de la Feuille : inchangés.
- Carte de sélection (contexte « Choix composition » seulement, `8328:28445`, ch13 L1256 PR #390) : catégorie et zones sur une seule ligne, zones tronquées sans augmenter la hauteur ; icône de changement de côté 16 sur cette ligne, 8 après le texte, si l'exercice en a un ; durée totale alignée à gauche dans une réserve de 68, à 8 du sablier. Les autres contextes de la carte (Catalogue) ne changent pas.
- Icône de changement de côté : export SVG exact depuis Figma (nœud `9522:20651` pour la Composition, `6238:8587` pour la sélection — un seul fichier si le tracé est identique), ajouté à `KodjoIcon`.
- Textes dans `fr.ts`, tokens réutilisés, constantes locales nommées sinon.

**Never:**
- Ne pas modifier les paramètres, calculs, la Feuille ni l'éditeur PRE-5 ; ne pas modifier `tokens.ts` ; aucune dépendance.
- Pas de suffixe « (copie) » ni d'opération d'organisation (story 2.3) ; pas d'en-tête de Circuit (story 3.1).
- Ne pas rendre l'indicateur de côté pour un exercice unilatéral.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Durée, 1 série, bilatéral | 45 s, gauche-droite | « 45 s » + icône de côté | — |
| Identiques | 3 × 90 s | « 3 × 1 min 30 » | — |
| Répétitions | 1 × 10 | « 10 rép. » | — |
| Variables | 10, 12, 14, 16 rép. | « 10 · 12 · 14 … rép. » (trois valeurs ; avec trois séries : « 10 · 12 · 14 rép. », Figma `8328:34520`) | — |
| À l'échec | toutes les cibles | libellé métier existant | — |
| Incomplet | cible à renseigner | « Paramètres à compléter » | — |
| Classification | catégorie + zones longues | zones tronquées, synthèse intacte | — |
| Sans catégorie | zones seules | pas de pastille | — |
| Séries | Circuit de Séries N = 4 | « 4 × … » | — |
| Unilatéral | — | aucune icône | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/CompositionScreen.tsx` (`CompositionActivityRow`, ~1500-1720) -- contenu de la carte à remplacer par le nouveau composant ; conserver conteneur, gestes, balayage, état soulevé, `ActivityRecoveryLine`, repère.
- `src/features/sessions/compositionPresentation.ts:171-300` -- `formatExerciseRowSummary` (synthèse actuelle) et `formatExerciseBodyZones` : faire évoluer vers la notation D-238 ; tests `compositionPresentation.test.ts`.
- Catégories : trouver la source des noms et couleurs (référentiel des Catégories utilisé par le Catalogue / `ActivityCard.tsx`) et la réutiliser.
- `src/features/activities/ActivityCard.tsx` -- contexte « Choix composition » (rendu dans `ActivitySelectionScreen.tsx`) ; le contexte Catalogue reste inchangé.
- `src/shared/ui/KodjoIcon.tsx`, `assets/icons/manifest.json` -- icône de côté (même procédé que `recovery-hourglass`, story 2.1).
- Session Figma lecture seule : fichier `G6RY5Ebhgwb4AHIOYDwwvg`.

## Tasks & Acceptance

**Execution:**
- [x] Icône de côté depuis Figma.
- [x] `compositionPresentation.ts` + tests -- synthèse D-238 (matrice).
- [x] Composant de carte d'occurrence + branchement dans `CompositionScreen.tsx` + tests.
- [x] `ActivityCard.tsx` contexte sélection + tests.
- [x] Nom accessible.

**Acceptance Criteria:**
- Given une Composition, when elle s'affiche, then chaque carte suit `5544:6797` (vérification visuelle J1 par Hermann, largeurs 375 et 402).
- Given la suite complète, when `npm test`, `npx tsc --noEmit`, `npm run lint`, then tout est vert ; attentes existantes modifiées seulement là où la notation D-238, l'indicateur neutre ou la nouvelle anatomie l'imposent.

## Implementation Notes

- Implémenté par sous-agent (21/10). `OccurrenceCard.tsx` (carte), synthèse `formatOccurrenceSummary`, nom accessible, hook partagé `useCategoriesReferential` (relu au retour de focus). Carte de sélection : `SelectionRow` d'`ActivitySelectionScreen.tsx` (et non `ActivityCard.tsx`, dont le contexte Catalogue est inchangé).
- Poignée de réorganisation conservée (ch13 L1567) bien qu'absente de la maquette Figma : texte 36 pt plus étroit que la maquette, à juger en J1.
- Points soumis à Hermann (J1) : « 3 × 1 min 30 s » (`formatCompactDuration`) au lieu de l'exemple Figma « 1 min 30 » ; unité répétée sur les durées variables ; lignes mixtes « 10 · à l'échec rép. » (ch13 : « à aligner ») ; « ≈ » sur la ligne estimée.
- Vérification : Jest 128 suites / 3428 tests, `tsc` et `lint` sans erreur.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | blind | Poignée de réorganisation retirée | high | patch : rétablie (ch13 L1567 l'exige ; aucun contrôle acquis retiré sans remplacement). |
| 2 | blind + edge + verification-gap | Changement de côté et intention de modification non annoncés ; « ≥ 0 min » annoncé | medium | patch : nom accessible et indice. |
| 3 | verification-gap | Nom accessible en Circuit de Séries non testé | medium | patch : tests. |
| 4 | verification-gap + blind + edge | Référentiel des Catégories non relu (création, renommage) ; hook dupliqué | medium | patch : hook partagé, relecture au retour de focus, test. |
| 5 | edge | « 3 × à l'échec » au lieu du libellé métier existant ; 0 série lue « À l'échec » | low | patch. |
| 6 | blind | Rayons 14 / 12 incohérents (carte, actions, soulevé) | low | patch : constante unique. |
| 7 | edge + blind | Durée de la carte de sélection tronquée à 68 ; test fragile | low | patch. |
| 8 | blind | Commentaires et README périmés | low | patch. |
| 9 | blind + edge | Notation « 3 × 1 min 30 s » au lieu de « 1 min 30 » ; durées variables avec unité répétée ; « 10 · à l'échec rép. » | — | Écart entre la matrice (exemple Figma) et la règle `formatCompactDuration` de la spec ; le chapitre 13 marque les lignes mixtes « à aligner ». Soumis à Hermann (recette J1), aucune règle inventée. |
| 10 | edge | Synthèse longue sur 320 pt ; Dynamic Type sur hauteur fixe | low, rejeté | Trois valeurs au plus bornent la synthèse ; la hauteur fixe préexiste (R7, vérification J1). |
| 11 | blind | Jetons et clé de lexique orphelins (`restHeight`, `compactRestHeight`) | defer | `tokens.ts` verrouillé (même report que la story 2.1). |
| 12 | blind | Couleurs codées dans les SVG | false | Export SVG exact depuis Figma, procédé établi de `KodjoIcon`. |
| 13 | blind | Ligne estimée en Medium 11 alignée à gauche | false | Rendu du nœud Figma `9522:43884`. |
| 14 | blind | Tenue de la spec (statut, cases, `ActivityCard` vs `SelectionRow`) | rejeté | Correctif = édition de la spec ; consigné en notes d'implémentation. |

## Verification

**Commands:**
- `npx jest src/features` -- expected: vert.
- `npm test` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
