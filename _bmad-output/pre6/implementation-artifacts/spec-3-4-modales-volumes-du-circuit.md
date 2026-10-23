---
title: 'Story 3.4 — Modales « Volumes du circuit »'
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: 'b35886e2aa9c1cd09ffd40fd01cf79a4e29d8465'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Aucun moyen de lire les cibles de toutes les séries des exercices du Circuit sans ouvrir chaque exercice (CE-CIR-03, E3) : ni œil dans l'en-tête du Circuit, ni modale « Volumes du circuit ».

**Approach:** Ajouter l'œil permanent sur la ligne du titre du Circuit (`8328:28680`) et une feuille basse en lecture seule (`8328:34965` Séries, `8328:35135` Tours) qui affiche la grille fournie par `circuitVolumes` (story 1.4), formatée selon CE-CIR-03.

## Boundaries & Constraints

**Always:**
- Œil : bouton d'action circulaire DSF 32 (fond clair, liseré blanc, ombre légère), icône `icon/oeil` 24 (`8165:13756`, export SVG exact dans `KodjoIcon`), cible 44, entre le titre « Circuit » et le compteur (`8328:28667`) ; présent dans les deux natures, y compris Circuit vide ; nom accessible « Voir les volumes du circuit ». L'ouvrir ferme le compteur et le choix de nature (un seul contrôle actif).
- Feuille basse (réutiliser `Modal` + `SheetMotion` existants, comme les feuilles basses PRE-5) : voile (scrim), poignée 50 × 4 à 8 du haut, en-tête 60 avec X à gauche et titre « Volumes du circuit » (Semi Bold 18) centré, trait 1 ; hauteur selon le contenu, bornée par l'écran (défilement vertical au-delà) ; safe area du bas.
- Grille : colonnes « Exercice » (fixe) | S1…Smax (défilement horizontal si nécessaire) | « Unité » (fixe). En-têtes Medium 12 (#595E66). Ligne par exercice du Circuit, dans l'ordre : nom Medium 13 (une ligne, ellipse), valeurs Semi Bold 13 centrées, unité Medium 12. Colonnes S impaires sur fond alterné léger (#F9FBFB, constante nommée). Smax = plus grand nombre de séries actives (`circuitVolumes`), réserve exclue.
- Valeurs (CE-CIR-03 §19) : Répétitions → nombre ; Durée → `m:ss` (45 s → « 0:45 », 90 s → « 1:30 ») ; cible À l'échec → « ✓ » ; cible à renseigner → « — » ; série inexistante → « — » (jamais 0). Unité : « rép. » (Répétitions), « durée » (Durée) ; toutes les cibles de la ligne À l'échec → « À l'échec ». Bilatéral : valeur par côté, jamais doublée ; icône de changement de côté (story 2.2) près du nom, sans direction.
- Lecture seule : aucune cellule interactive ; fermer par X, glissement vers le bas de la poignée ou toucher du voile laisse le brouillon strictement identique ; focus rendu à l'œil.
- Accessibilité : chaque ligne lisible comme un élément « {exercice}, série 1 : 10 répétitions, série 2 : … » ; ✓ annoncé « à l'échec » ; « — » annoncé « pas de série » (ou « à renseigner » pour une cible manquante) ; changement de côté annoncé.
- Circuit vide : la feuille s'ouvre avec un état vide sans valeur fictive (« Aucun exercice dans le circuit »).
- Formatage dans une fonction pure testée (`compositionPresentation.ts` ou module voisin) à partir de `circuitVolumes`.

**Never:**
- Aucune écriture du brouillon ; aucune édition, tri ou déplacement dans la grille.
- Pas de nouvelle dépendance ; `tokens.ts` inchangé.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Séries A2 / B4 | A 2 séries, B 4 | 4 colonnes ; A : S3, S4 « — » | — |
| Durées | 45 s, 60 s, 90 s | « 0:45 », « 1:00 », « 1:30 », unité « durée » | — |
| Répétitions | 10, 12, 14 | « 10 », « 12 », « 14 », « rép. » | — |
| À l'échec | toutes | « ✓ » partout, unité « À l'échec » | — |
| Mixte | 10, À l'échec | « 10 », « ✓ », « rép. » | — |
| Bilatéral | 10 par côté | « 10 » (non doublé) + icône | — |
| Tours | N = 3 | même grille (séries propres) | — |
| Fermeture | X / voile / glisser | brouillon identique | — |
| Vide | aucun exercice | état vide | — |
| 12 séries | — | défilement horizontal, Exercice et Unité fixes | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/CircuitHeader.tsx` -- ajouter l'œil (après le titre).
- `src/domain/sessions/circuit.ts` -- `circuitVolumes` (story 1.4) : source des lignes.
- Feuilles basses existantes : `src/features/activities/SheetMotion.tsx`, la Feuille des paramètres et `LabelPickerModal` pour le patron `Modal` + voile + poignée + glisser.
- `src/features/sessions/CompositionScreen.tsx` -- état d'ouverture, fermeture des autres contrôles.
- `src/shared/ui/KodjoIcon.tsx`, `assets/icons/manifest.json` -- icône œil.
- `fr.ts` -- textes.
- Nouveau composant `CircuitVolumesSheet.tsx` + tests ; tests de formatage.

## Tasks & Acceptance

**Execution:**
- [x] Icône œil depuis Figma.
- [x] Formatage pur des volumes + tests (matrice).
- [x] `CircuitVolumesSheet.tsx` + tests (fermetures, lecture seule, accessibilité, défilements).
- [x] `CircuitHeader.tsx`, `CompositionScreen.tsx` + tests.
- [x] `fr.ts`.

**Acceptance Criteria:**
- Given la suite complète, when `npm test --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert.
- Given une Composition, when on ouvre puis ferme la feuille, then le brouillon est égal (`sessionDraftsEqual` et identité) à celui d'avant.

## Implementation Notes

- Icône : export SVG de `8165:13756` par l’outil MCP Figma en lecture seule ; le rectangle de fond `#F5F5F5` ajouté par l’export (fond de canevas) est retiré, l’identifiant `Paupières` doublement encodé est réparé ; tracé inchangé. `assets/icons/icon-oeil.svg`, nom `view-volumes`, entrée `action.view-volumes` du manifeste (`MCP_VECTOR_EXPORT`).
- Formatage : `src/features/sessions/circuitVolumesPresentation.ts` (module voisin de `compositionPresentation.ts`). Durée annoncée par `formatPhraseDuration` (« 1 min 30 s ») ; unité « — » pour un exercice sans Mode (cas hors matrice, aucune règle inventée au-delà du tiret).
- Accessibilité : la grille est en colonnes (Exercice | S défilantes | Unité) ; la lecture « une ligne = un élément » passe par un calque transparent (`pointerEvents: none`) d’éléments accessibles superposés aux lignes, la grille visuelle étant masquée. Comportement VoiceOver réel à vérifier sur iPhone (J2).
- Glisser vers le bas : `PanResponder` sur la zone poignée + en-tête (seuil 80 ou vitesse 0,5) ; décision pure `shouldDismissSheetDrag` testée, geste réel non simulé sous Jest.
- Bouton œil : mêmes valeurs que les actions circulaires de l’Éditeur (`#FCFCFE`, liseré blanc 1, ombre `#1A1A26` 8 % (0, 2) flou 10), constantes locales.
- Libellé d’unité « À l’échec » écrit avec l’apostrophe typographique du lexique (`’`).

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | blind | Œil placé après la colonne titre + durée, pas sur la ligne du titre | medium | patch. |
| 2 | blind + edge | « Réduire les animations » appliqué à l'entrée seulement | low | patch : retour élastique et fondu ; hook partagé. |
| 3 | edge | Focus envoyé pendant la fermeture de la `Modal` ; fermeture répétée | medium | patch : `onDismiss`, garde. |
| 4 | blind + edge | `circuitVolumes(draft)` recalculé à chaque rendu | low | patch : mémorisation. |
| 5 | blind | `row.cells[column]!` suppose le nombre de cellules | low | patch : repli « — ». |
| 6 | verification-gap + blind | Perte de focus, réduction des animations, fermeture du choix de nature non testées | medium | patch : tests. |
| 7 | verification-gap + blind | Glisser pour fermer testé par sa seule fonction de seuil | low | patch si faisable, sinon J2. |
| 8 | edge | Durée non entière ou négative | low, rejeté | Cibles validées entières et positives (`validateForSave`). |
| 9 | edge | Œil touché pendant une roulette de borne | false | La roulette est une superposition plein écran : l'œil n'est pas atteignable. |
| 10 | edge | Exercices sans aucune série (mode inconnu) | low, rejeté | Paramètres incomplets : « Paramètres à compléter » sur la carte ; cas marginal. |
| 11 | blind | Fermeture sans animation de sortie ; texte agrandi sur hauteurs fixes ; couche d'accessibilité | — | Vérification J2 sur iPhone (Hermann). |
| 12 | blind | Unité « — » sans mode, retour visuel de l'œil, insets codés en dur dans un test, statuts | low, rejeté | Hors matrice sans règle ; retour visuel de l'éditeur identique ; transitions du workflow. |

## Verification

**Commands:**
- `npx jest src/features/sessions src/domain/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
