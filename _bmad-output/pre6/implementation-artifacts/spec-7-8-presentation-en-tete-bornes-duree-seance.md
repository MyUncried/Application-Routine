---
title: 'Story 7.8 — Présentation : en-tête du Circuit, bornes de séance, durée de la Séance (D-438)'
type: 'feature'
created: '2026-10-23'
status: 'review'
baseline_commit: '51df2b49'
route: 'dispatch'
review_loop_iteration: 1
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-7-3-en-tete-du-circuit-stepper-permanent-duree-arrondie.md'
  - '{project-root}/docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Recette J6c de Hermann (23/10), verbatim : « Supprimer la durée du circuit et aligner le stepper de tour à droite. Aligner le cadre du compte à rebours et de la fin de séance à droite du cadre des cartes d'exercices, Limiter leurs valeurs à 60s et ne pas afficher les minutes. Durée totale de l'exercice dans la zone de contexte, arrondir à 15 s près et mettre le signe à peu près égal ou supérieur ou égal à en fonction du contexte des exercices. »

**Approach:** D-438 (« Circuit », « Compte à rebours et Fin de séance », « Durée de la Séance » ; remplace dans D-437 l'affichage et l'arrondi de la durée du Circuit, et dans D-089 amendée par D-265 la borne 0..3599 s des champs de la Séance). Présentation seulement : modèle de données et calculs de durée inchangés.

## Boundaries & Constraints

**Always:**
- Sources : D-438 (ch07, commit `835f2df3`) ; epics.md « Story 7.8 » AC1 à AC4.
- **AC1** : en-tête du Circuit sans durée (affichage, nom accessible et code devenu inutile retirés, dont l'arrondi minute de 7.3) ; stepper aligné à droite.
- **AC2** : cadres Compte à rebours et Fin de séance alignés à droite sur le bord droit des cartes d'Exercice.
- **AC3** : réglage borné 0..60 s, pas 1 s ; affichage en secondes seules (« 45 s ») ; valeur existante au-delà de 60 s affichée et réenregistrée à 60 s sans marquer la Séance modifiée ; validateur aligné (0..60), sans migration.
- **AC4** : durée de la Séance de la zone de contexte arrondie aux 15 s, préfixe « ≈ » ou « ≥ » selon la règle de l'estimation existante ; format lisible (« ≈ 12 min 15 s », « ≈ 45 s ») ; accessibilité cohérente.

**Never:**
- Aucune modification de `docs/`, `.github/`, `_bmad-output/pre6.zip`, `migration001.ts`, `tokens.ts` ; aucune dépendance ; aucune migration ; aucun calcul de durée changé.

## I/O & Edge-Case Matrix

| Scenario | Expected |
|---|---|
| En-tête du Circuit | « Circuit » à gauche, stepper calé à droite ; aucune durée, nom accessible du titre = « Circuit » |
| Bornes, valeur ≤ 60 | « 10 s », « 5 s », « 0 s » ; roulette une colonne 0..60 ouverte sur la valeur |
| Borne relue > 60 (Séance ancienne) | affichée « 60 s », roulette sur 60 ; brouillon non modifié ; enregistrée à 60 s au prochain enregistrement |
| Défaut du Profil > 60 (D-265) | Séance créée à 60 s |
| Écriture > 60 (Domaine) | `OUT_OF_RANGE` `{ min: 0, max: 60 }` |
| Durée, travail connu | « ≈ » + arrondi aux 15 s les plus proches (734 s → « ≈ 12 min 15 s ») |
| Durée, travail inconnu | « ≥ » + même arrondi |
| Séance vide | « 0 s » |

</frozen-after-approval>

## Code Map

- `src/features/sessions/CircuitHeader.tsx` : prop `duration`, texte et écart retirés ; bloc du titre `flexGrow: 1`.
- `src/features/sessions/compositionPresentation.ts` : `formatCompositionSummary`, `formatCircuitDurationResult`, `CIRCUIT_DURATION_ROUNDING_THRESHOLD_SECONDS` supprimés ; `formatSessionDurationEstimate`, `SESSION_DURATION_ROUNDING_SECONDS`, `formatBoundarySecondsValue`.
- `src/features/sessions/CompositionScreen.tsx` : bornes en `NumberWheelPicker` (0..60), valeurs en secondes, `boundaryTrailingOutset`.
- `src/domain/sessions/defaults.ts` (`SESSION_BOUNDARY_SECONDS_MAX`, `clampSessionBoundarySeconds`), `SessionDraft.ts` (`toSessionDraft`, `createEmptyDraft`), `validation.ts` (`validateSessionBoundarySeconds`).
- `src/shared/i18n/resources/fr.ts` : `composition.summary` retiré, `composition.boundarySecondsUnit`.
- Tests : `CircuitHeader.test.tsx`, `compositionPresentation.test.ts`, `CompositionScreen.test.tsx`, intégrations Composition, `SessionDraft.test.ts`, `validation.test.ts`, `index.test.ts`, tests d'infrastructure (résumé retiré).
- `src/features/sessions/README.md`, `src/domain/README.md`.

## Tasks & Acceptance

- [x] AC1, AC2, AC3, AC4, tests, README.
- Given l'arbre entier, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert. Given un iPhone, when J7, then en-tête, bornes et durée conformes.

## Implementation Notes

**En-tête.** Le bloc du titre prend toute la place libre (`flexGrow: 1`) : le stepper, dernier élément de la ligne, a son bord droit sur le bord droit de l'en-tête. Ordre de cession : le titre (ellipse), jamais le stepper.

**Bornes.** Les listes de cartes débordent de 8 de la colonne de la séquence (`CARD_OUTSET`) ; les deux bornes reçoivent `marginRight: -CARD_OUTSET` sur leur conteneur extérieur (dans le contenu défilant, toujours touchables), donc leur cadre finit au même bord droit que les cartes. La roulette est `NumberWheelPicker` (primitive native déjà acceptée, une colonne) avec `targetBounds` 0..60 et `valueAccessibilityLabel` « N s » ; `DurationWheelPicker` reste celle de la Récupération.

**Valeurs héritées.** `toSessionDraft` borne à 60 : la base de comparaison et le brouillon sont tous deux issus de cette lecture, la garde de sortie ne voit rien de modifié ; l'enregistrement suivant (si autre chose change) écrit 60. `createEmptyDraft` borne aussi les défauts du Profil (D-265 y conserve une valeur héritée au-delà de 60) : sans cela, la Séance créée serait refusée par le validateur.

**Durée.** « ≈ » (exacte ou estimée) : `Math.round(secondes / 15) × 15`, au moins 15 s pour une durée positive ; « ≥ » (`lowerBound`) : `Math.floor`, pour un minimum vrai ; séance vide exactement nulle : « 0 s » sans préfixe ; durée non finie traitée comme 0 ; format `formatPhraseDuration` (minutes et secondes, sans unité nulle).

**Choix non dictés (à valider en J7)**
1. Préfixe « ≈ » aussi pour une durée exacte (arrondie), « ≥ » pour une borne minimale ; « 0 s » sans préfixe pour une séance vide.
2. « ≈ » arrondi au plus proche (au moins 15 s si positif : 5 s → « ≈ 15 s ») ; « ≥ » arrondi à la tranche inférieure (98 s → « ≥ 1 min 30 s ») ; une borne minimale nulle s'affiche « ≥ 0 s » (l'ancienne règle P47 donnait « ≥ 0 min »).
3. Valeur héritée > 60 : bornée à la lecture du brouillon (non à la base) ; les Séances jamais réenregistrées gardent leur valeur en base (aucune migration, D-438 laisse le modèle inchangé) ; aucun lecteur d'exécution n'existe encore, le README du Domaine impose `clampSessionBoundarySeconds` au futur lecteur.
6. Roulette iOS des bornes : nombres seuls (« 45 »), sans « s » visible ; nom accessible « 45 s » (lu tel quel par VoiceOver) ; roulette nommée d'après sa borne.
4. Défaut du Profil > 60 : Séance créée à 60 s.
5. Roulette des bornes : une colonne de secondes (`NumberWheelPicker`) au lieu de minutes + secondes.

## Spec Change Log

## Review Triage Log

Trois revues indépendantes du 23/10/2026 (aveugle, cas limites, écarts de vérification), sous-agents en lecture seule. Aucun constat Haut sur le code ; un Haut de vérification.

**Corrigés**
1. Moyen (cas limites 1) — « ≥ » arrondi au plus proche pouvait afficher un minimum faux (98 s → « ≥ 1 min 45 s ») : tranche inférieure ; tests.
2. Moyen (aveugle 1, cas limites 4, vérification 4) — « ≈ 0 s » pour une séance de 1 à 7 s : au moins 15 s ; tests.
3. Moyen (aveugle 2, cas limites 3) — `clampSessionBoundarySeconds` ne bornait que par le haut : 0..60, entier, non fini → 0 ; bornage en double retiré de l'écran ; tests.
4. Bas (cas limites 5) — durée non finie : traitée comme 0.
5. Haut (vérification 1) — le test « non modifié » comparait deux lectures identiques : il prouve maintenant que la lecture d'une Séance à 600 / 90 égale celle d'une Séance à 60 / 60.
6. Moyen (vérification 2, 3, 5) — nom accessible de la durée de séance testé (≈ et ≥) ; intégration des Pauses en littéraux ; branche « ≈ » du nom accessible d'une carte retestée.
7. Bas (vérification 6, 7, 8, 10) — valeur exacte au Catalogue ; Séries / Tours en valeurs exactes ; rejet à 61 s par le repository ; Fin de séance lue « 60 s ».
8. Bas (aveugle 5, 10) — ré-exportation de la borne retirée (import direct du Domaine) ; chaque roulette nommée d'après sa borne.
9. Bas (aveugle 4, 6, 7, 8 ; cas limites 7) — commentaires et README périmés corrigés ; `formatDurationRowValue` marqué historique.

**Acceptés / signalés (J7)**
- Aveugle 3, cas limites 2 — valeur en base non bornée pour une Séance ancienne non réenregistrée : obligation écrite dans le README du Domaine (aucun lecteur d'exécution aujourd'hui).
- Vérification 1 (intégration SQLite d'une Séance ancienne), 9 (Profil > 60 via le Provider), 11 (alignement contre chaque zone et en placement) : couverts au niveau Domaine / écran, sans intégration dédiée.
- Aveugle 9, cas limites 10 — boîte du + au bord droit de l'en-tête et grand texte : à vérifier sur appareil.
- Aveugle 10b, cas limites 9 — « s » lu par VoiceOver et absence d'unité visible dans la roulette iOS : J7.
- Cas limites 6 — « ≈ » aussi pour une durée exacte : choix 1.
- Aveugle 11 — `CompositionSummaryFacts` garde son nom (identifiant historique).

## Verification

**Commands:** `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`.

**Manual checks (J7)** : en-tête du Circuit (Tours et Séries, N = 1 et 99, texte agrandi) ; alignement droit des bornes avec les cartes, dans et hors placement ; roulette des bornes (0, 60, Annuler) ; Séance ancienne à 120 s de compte à rebours ; durée de séance avec un travail à l'échec ; VoiceOver sur la durée et les bornes.
