---
title: 'Story 5.1 — Carte v2 et récupération en troisième ligne'
type: 'feature'
created: '2026-10-21'
status: 'in-progress'
baseline_commit: '445457c8'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La carte d'occurrence de la Composition ne suit plus le rendu Figma du 21/10/2026 (D-435) : deux lignes, poignée visible, pas de média, récupération sur une rangée séparée sous la carte avec un trait.

**Approach:** Adapter `OccurrenceCard` en carte v2 à trois lignes avec média intégré, et intégrer la récupération contextuelle à la troisième ligne en réutilisant `ActivityRecoveryLine` (toucher, appui long, accessibilité) ; supprimer la rangée séparée et la poignée. Aucun changement de donnée, de calcul ni de geste.

## Boundaries & Constraints

**Always:**
- Sources : D-435 (ch07 L8-13), CE-T03-08 (ch13 L1434-1510, notamment L1478 et L1480), ch08 « Présentation des occurrences — révision du 21/10/2026 », DSF-CARTES L124-136. Figma (rendu seulement) : composant v2 `9798:44464` et variantes, instances `8328:28605` (hors Circuit `9798:19935`, dans le Circuit `9819:19961`).
- Rendu à la largeur 402 : carte 370 × 80 (marges 16 de part et d'autre de l'écran), rayon 12, fond blanc ; bord 1 `#E4E7EF` hors Circuit, aucun bord dans le Circuit ; padding 8 à gauche, 12 à droite ; média 64 × 64 (rayon 12, bord 1 `#7A7A80`, fond `#EEF0F6`, icône générique centrée de `9798:19907`, variante Circuit `9819:19963`), écart 12 avant le texte.
  - Ligne 1 : nom Inter Semi Bold 15 `#141414`, ellipse ; icône de changement de côté à droite (existante si identique à `9798:19925`), absente si non bilatéral (ARB-2).
  - Ligne 2 : pastille Catégorie 13 (`9798:19913`) + libellé Catégorie Regular 12 `#7A7A80` (ellipse) ; symbole de durée 13 (`9798:19927`) dans la colonne des symboles ; synthèse de travail Regular 12 `#7A7A80` calée à droite (« 10 rép. / 1 min » tient sur cette ligne).
  - Ligne 3 : pastille Zone 13 (`9798:19919`) + Zones Regular 12 `#7A7A80` (coupées avant la colonne) ; sablier 13 (réutiliser `recovery.hourglass` s'il est identique à `9798:19932`) + valeur de récupération sans préfixe, calée à droite.
  - Écarts verticaux et positions des colonnes relevés dans Figma ; colonnes exprimées par rapport à la largeur utile et au bord droit (pas de x absolu d'exemple), valables à 360, 402 et 440 ; aucune superposition texte / symboles.
- Récupération (ch08, ch10 L599 PR #391) : positive → sablier + valeur ; absente ou à 0 → ni sablier ni valeur (choix D2 de l'epic) ; la donnée et ses calculs ne changent pas. Toucher la récupération ouvre la roulette existante (story 4.2) sans ouvrir l'Exercice ; appui long → bulle « Retirer la récupération » ancrée sur la récupération ; actions accessibles existantes conservées ; cible tactile ≥ 44 limitée au sablier et à la valeur (choix D7), jamais la ligne entière.
- Plus de rangée de récupération sous la carte ni de trait de démarcation (choix D1). Le point d'arrêt hors placement garde provisoirement son rendu actuel, sur une rangée sous la carte, sans trait (refonte en story 5.2) ; le placement (story 4.1) reste fonctionnel tel quel (refonte en story 5.3).
- Plus de poignée ; appui long sur toute la carte ; glisser (dont l'animation 2.3b et le calcul de hauteur des blocs), balayage, Dupliquer, Supprimer inchangés ; la récupération suit l'occurrence.
- Catégorie et Zones depuis les propriétés structurées existantes (`resolveOccurrenceCategory`, `formatExerciseBodyZones`), jamais par découpage d'une chaîne.
- Couleurs Figma absentes du registre ch12 : constantes locales nommées citant DSF/ch13 (choix D5) ; `#7A7A80` correspond à `textTertiary` de ch12 L1010 : réutiliser un jeton s'il existe. Ne modifier aucune valeur existante de `tokens.ts`. Icônes nouvelles exportées en lecture seule depuis Figma (MCP `download_assets` ou asset de `get_design_context`), déclarées dans `assets/icons/manifest.json` selon le patron existant.
- Les cartes hors Composition (Catalogue, sélection) ne changent pas.

**Never:**
- Nouvelle fonctionnalité ; ouvrir l'éditeur d'Exercice au toucher de la récupération ; modifier le défaut Profil ; afficher une photo d'occurrence ; afficher une Pause intrinsèque.
- Modifier modèle, repositories, calculs, formats, `migration001.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Hors Circuit | occurrence BEFORE_TOUR | carte v2 avec bord | — |
| Dans le Circuit | IN_TOUR | carte v2 sans bord | — |
| R positive | 20 s | sablier + « 20 s » en ligne 3 | — |
| R = 0 / absente | — | ligne 3 sans sablier ni valeur | — |
| Toucher R | R = 20 | roulette ; Exercice non ouvert | — |
| Appui long R | — | bulle Retirer | — |
| Bilatéral | sideMode bilatéral | icône de côté ligne 1 | — |
| Répétitions + cadence | 10 rép. / 1 min | ligne 2 seule | — |
| Séries variables / À l'échec | — | synthèse existante, ellipse à droite | — |
| Nom et Zones longs | 360 de large | ellipses, aucun chevauchement | — |
| Glisser / balayage | — | inchangés, sans poignée | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/OccurrenceCard.tsx` -- carte d'occurrence (lignes, poignée, styles).
- `src/features/sessions/ActivityRecoveryLine.tsx` -- récupération (toucher, appui long, accessibilité, point d'arrêt hors placement).
- `src/features/sessions/CompositionScreen.tsx` -- montage de la carte et de la ligne (~L2890-3130), `blockHeightFor`, styles de rangée, ancrage de la bulle (`measureAnchor`), mesure des hauteurs pour le glisser.
- `src/features/sessions/compositionPresentation.ts` -- format de la synthèse et de la récupération.
- `assets/icons/manifest.json`, `src/shared/ui/KodjoIcon*` -- icônes.
- Tests : `CompositionScreen.test.tsx` (poignée, surface, contenu de carte, ligne de récupération, hauteurs), `OccurrenceCard` / `ActivityRecoveryLine` tests, `CompositionPausesFlow.integration.test.tsx`.

## Tasks & Acceptance

**Execution:**
- [ ] Icônes (média, pastilles, durée) exportées et déclarées.
- [ ] Carte v2 (3 lignes, média, bord selon la zone, largeurs adaptatives, sans poignée) + tests.
- [ ] Récupération en ligne 3 (toucher, appui long, bulle, accessibilité), suppression de la rangée et du trait + tests.
- [ ] Hauteurs de bloc pour le glisser (story 2.3b) recalées sur la carte v2 + tests existants verts.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert ; les attentes de test modifiées ne le sont que là où D-435 change le rendu.
- Given un iPhone, when on ouvre la Composition, then les cartes suivent `8328:28605` (vérification Hermann, J4).

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npx jest src/features/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
