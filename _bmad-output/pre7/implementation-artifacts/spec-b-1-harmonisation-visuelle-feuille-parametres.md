---
title: 'B.1 — Harmonisation visuelle de la Feuille des paramètres (B3, B4, B6, B7)'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: '1e8c8468ede02b4f0230121ac6fd79da5d6ca1b1'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/implementation-artifacts/epic-B-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Dans la Feuille des paramètres d'exécution (CE-UI-10), les contrôles éditables n'ont pas la même hauteur (pastilles ≈ 24, steppers ouverts 36, segmentés 32, segmentés Séries et Phases ouverts 34), les rayons diffèrent, les steppers fermés sont centrés dans un cadre de 137 au lieu d'être alignés à droite comme Durée de l'exercice, les boutons actifs de Séries sont serrés (marge 8) et le chevron de Durée de l'exercice porte un cadre (D-447, B3, B4, B6, B7).

**Approach:** Harmonisation de présentation seule, sans jeton modifié : hauteur 32 pour pastilles de valeur, steppers ouverts et segmentés ouverts ; pastilles et steppers de la Feuille sur `colors.surface` ; valeur fermée et stepper ouvert alignés à droite ; marge des boutons actifs Séries 12 ; variante sans cadre (propriété optionnelle, défaut inchangé) de `DisclosureControl` pour Durée de l'exercice.

## Boundaries & Constraints

**Always:** D-447 (ch07 l.73-85) et CE-UI-10 §9 « Révision 24/10 », lignes 5, 9, 11, 12, 13 du tableau. Comportements, accessibilité (noms, états, actions, focus), cibles tactiles ≥ 44 (chevron 48), mécanismes des steppers et identifiants inchangés. Composants partagés modifiés seulement par ajout optionnel, défaut strictement inchangé (Profil, `CircuitHeader`, `SessionCard`, Catalogue). Mise en page sans débordement à 360 / 402 / 440.

**Never:** modifier `tokens.ts`, `app.json`, `package.json`, `.github/` ; inventer une couleur ou un composant ; toucher B1, B2, B5, B8, B9, B10 ; affaiblir un test existant (garde-fous zéro `ScrollView` iOS des roulettes).

**Arbitrages pré-approuvés (Hermann absent, option la plus conservatrice, à confirmer en recette JB) :**
- A1 (B3, fond) : les champs de saisie hors options (pastilles de valeur, steppers fermés et ouverts de la Feuille) prennent `colors.surface` ; les options des segmentés gardent leur rendu (aucune couleur inventée pour elles).
- A2 (B6) : valeur fermée et stepper ouvert alignés sur le même bord droit ; le cadre et sa zone de toucher (137 × 44) ne bougent pas ; le texte de la valeur se décale de la largeur du +, ce que le plan accepte (« règle maintenue par l'alignement à droite du stepper ouvert »).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Pastille de valeur | Durée, Répétitions, Durée de l'exercice, stepper fermé | hauteur ≥ 32 (texte agrandi : grandit), rayon 8, marges 12, `colors.surface` | valeur à renseigner : fond `dangerSurface` inchangé |
| Stepper ouvert de la Feuille | Pause, Pause entre les côtés, Compte à rebours, Fin, Cadence | 32 de haut, cercles 28, fond `colors.surface`, aligné à droite | bornes : ± indisponibles inchangés |
| Séries / Phases ouverts | stepper dans l'option | segmenté de 32 (au lieu de 34) | — |
| Séries fermé | « 99 séries identiques / variables » | marge 12 de chaque côté ; « Séries » garde ≥ 36 à 360, 375, 402, 440 | option non sélectionnée réduite si nécessaire (règle existante) |
| Durée de l'exercice | chevron replié / déployé | sans fond ni contour, chevron et teintes inchangés, cible 48 | Exercice ouvert depuis une Séance : pas de chevron (inchangé) |

</frozen-after-approval>

## Code Map

- `src/features/activities/ExecutionParametersSheet.tsx` -- `ValuePill` (~l.2625), `RevealStepper` (~l.2750), `RevealedStepperField` (Cadence), `OpenStepperField`, `DisclosureControl` (~l.2217), constantes `SERIES_CONTROL_OPEN_HEIGHT` / `PHASE_CONTROL_OPEN_HEIGHT` (34), styles `valuePill`, `stepperFrame`. Les champs Séries / Phases (`seriesStepperField`, `phaseStepperField`) gardent leurs surfaces RC-15 / RC-16.
- `src/features/activities/seriesTypeOptionWidths.ts` -- `SERIES_LABEL_INSET` 8 → 12 (largeur de l'option sélectionnée fermée).
- `src/shared/ui/ProfileStepper.tsx` -- `InlineStepper` : ajouter `frameStyle` optionnel (appliqué après le style de base, avant `invalid` / `disabled`), absent = rendu inchangé.
- `src/shared/ui/DisclosureControl.tsx` -- ajouter `framed` (défaut `true`) : `false` retire fond, contour et rayon, garde le cadre interne 28 × 28, le chevron, ses teintes et la cible 48 (Disclosure `5544:4650`, Cadre Non, ch12).
- Tests : `src/shared/ui/__tests__/DisclosureControl.test.tsx`, `src/features/activities/__tests__/ExecutionParametersSheet.test.tsx` (l.2676-2712), `ExecutionParametersSheet.rc15.test.tsx` (l.132-137, 222-280), `ExecutionParametersSheet.phases.test.tsx` (l.279).

## Tasks & Acceptance

**Execution:**
- [x] `src/shared/ui/DisclosureControl.tsx` -- prop `framed` -- B7, défaut inchangé.
- [x] `src/shared/ui/ProfileStepper.tsx` -- prop `frameStyle` -- B3 sans changer le Profil.
- [x] `src/features/activities/seriesTypeOptionWidths.ts` -- `SERIES_LABEL_INSET = 12` -- B4.
- [x] `src/features/activities/ExecutionParametersSheet.tsx` -- pastille 32 / rayon 8 / marges 12 ; steppers ouverts 32 sur `colors.surface` via `frameStyle` ; `stepperFrame` aligné à droite ; hauteurs ouvertes Séries et Phases 32 ; `framed={false}` sur le chevron de Durée de l'exercice -- B3, B6, B7.
- [x] Tests -- géométrie mise à jour ; Disclosure sans cadre ; largeurs Séries à 360 / 375 / 402 / 440.

**Acceptance Criteria:**
- Given la Feuille ouverte, when on mesure pastilles, steppers ouverts et segmentés (ouverts ou fermés), then tous font 32 de haut, sans jeton modifié.
- Given un stepper fermé puis ouvert (Pause, Pause entre les côtés, Compte à rebours, Fin), when on l'ouvre, then pastille et stepper sont collés au bord droit de la ligne, dans le même cadre 137 × 44.
- Given le Profil, le Circuit, `SessionCard` ou le Catalogue, when ils sont rendus, then aucun style ne change.

## Implementation Notes

- Implémentation directe par l'agent de la story (sans sous-agent d'implémentation : investigation déjà en contexte).
- `InlineStepper.frameStyle` (additif) plutôt qu'un emballage `bare` : un seul élément ajustable, ordre des styles conservé (`invalid`, `disabled` après). Aucun stepper de la Feuille ne passe `invalid`.
- `DisclosureControl.framed` (défaut `true`) ; `frameless` garde le cadre interne 28 × 28 : le chevron reste à la même place (12 du libellé + 10 de cadre interne, comme avant).
- Hauteurs ouvertes Séries / Phases à 32 : le stepper de 28 déborde d'1 de l'option de 26 de chaque côté, soit 2 / 2 dans le cadre de 32 (comme 3 / 3 à 34 auparavant).
- Tests : DisclosureControl (+4), Feuille (+1 test PRE7-B.1, géométrie 3.3/AC8 mise à jour), rc15 (hauteur 32, largeurs fermées 134 / 142, boucle 360 / 375 / 402 / 440), phases (hauteur 32). Garde-fous zéro `ScrollView` intacts.
- Contrôles finaux : 149 suites, 4 075 tests verts ; `tsc` et `lint` sans erreur.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Suite |
|---|---|---|---|---|
| 1 | aveugle + cas limites | Valeur statique (phases) : `valuePill` appliqué seulement si invalide → décalage 12 et hauteur 32 au basculement | low | defer : comportement préexistant (décalage de 10 auparavant), corriger change le rendu valide hors périmètre |
| 2 | aveugle | Stepper de 28 non centré dans le segmenté de 32 | false | option de 26 centrée (marge 3), enfant de 28 centré dans l'option : 2 / 2, comme 3 / 3 à 34 |
| 3 | aveugle + lacunes | Commentaires restés à 34 / marge 8 (l.1233, 1699, 3153, 3163 ; `seriesTypeOptionWidths.ts` l.7, 40-41) | low | patch appliqué |
| 4 | aveugle | Constantes ouvertes égales au défaut 32 | low | patch : commentaire « restent explicites » |
| 5 | aveugle | Titre du test rc15 « Figma 127 / 134 / 138 à un point près » contredit 134 / 142 | low | patch : titre corrigé |
| 6 | aveugle | Bloc `SHEET_CONTROL_*` : rayon 8 annoncé pour tous les éléments de 32 | low | patch : exception des steppers (rayon 16) écrite |
| 7 | aveugle | `VALUE_PILL_HIT_SLOP` fixe malgré texte agrandi ; largeur < 44 pour une valeur courte | low | rejeté : même schéma fixe qu'avant (10 / 10), cas rare, correction = logique nouvelle |
| 8 | aveugle | Pas de test des états invalide / désactivé avec les nouveaux styles | false | `valuePillInvalid` reste après `valuePill` (tests `dangerSurface` existants verts) ; aucun stepper de la Feuille n'est invalide |
| 9 | aveugle | Pas de test de non-régression Profil / Circuit | false | `ProfileStepper.test.tsx:423` et `CircuitHeader.test.tsx:423` figent `minHeight 36`, `padding 4`, fond |
| 10 | aveugle | Cas « Exercice depuis une Séance, sans chevron » non couvert | false | couvert par les tests existants (`disclosure: false`, `ExecutionParametersSheet.test.tsx` ~l.6127) |
| 11 | aveugle | Largeurs 360 / 440 vérifiées par calcul seulement | low | rejeté : rendu réel hors Jest, recette JB |
| 12 | aveugle | `frameless` duplique une partie de `frame` ; test de la Feuille en dur 28 / 48 | low | rejeté : cosmétique, sans dérive nommée |
| 13 | aveugle | Q41 remplacé sans décision qui le nomme | low | rejeté en code : arbitrage A2 déjà renvoyé à Hermann (rapport, recette JB) |
| 14 | cas limites | Approche « steppers sur `colors.surface` » alors que Séries / Phases gardent leurs surfaces | false | Code Map : surfaces RC-15 / RC-16 conservées explicitement |
| 15 | lacunes | Aucune lacune de vérification | — | — |

## Design Notes

Rayons : les éléments de 32 (segmenté, pastille) partagent le rayon 8 du segmenté `inline` ; les steppers ouverts restent arrondis (rayon 16, moitié de la hauteur), comme leurs cercles et comme le stepper Séries. Marge horizontale 12 des pastilles = marge B4 des boutons Séries. Le champ Charge est le contenu d'une option de 26 dans un segmenté de 32 : déjà conforme, inchangé.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- Recette JB (iPhone, 360 / 402 / 440, iOS 26) : hauteurs, alignements, contraste des steppers sur `colors.surface`, chevron sans cadre.
