---
title: 'Story 4.1 — Mode placement et sous-brouillon'
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: '8b9ffbacb6e83a3afbd56e99dfd1fb80d308e4c9'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'utilisateur ne peut ajouter ni récupération ni point d'arrêt dans la Composition (E7, E13) : pas d'action « Ajouter un arrêt », pas de mode placement, pas de roulette de durée de récupération.

**Approach:** Ajouter l'action « Ajouter un arrêt » dans l'en-tête (`8328:28622`) qui ouvre un mode placement (`8328:29270`) travaillant sur un sous-brouillon local (AD-43) : emplacements autorisés proposés, sélection multiple, roulette de récupération au défaut du Profil, barre « Confirmer N pauses ajoutées » / « Annuler ». Seul « Confirmer » applique au brouillon de séance ; seul « Continuer » persiste (D-388).

## Boundaries & Constraints

**Always:**
- Action d'en-tête « Ajouter un arrêt » : bouton rond 34 (cible 44) à gauche du « + » (`8328:28621`, icône sablier avec pastille pause : export SVG exact de `8328:28624` dans `KodjoIcon`), état actif rempli pendant le placement ; nom accessible « Ajouter un arrêt ».
- Mode placement : le reste du contenu est atténué et non interactif (cartes, compteur, œil, « + », bornes) ; le trait de démarcation est masqué (D-303) ; « Continuer » est remplacé par la barre de placement.
- Emplacements (domaine pur, testé) — ni plus ni moins :
  - Récupération : après chaque occurrence `EXERCISE` (toutes zones, dernière comprise) ; jamais avant le premier exercice ; une seule par occurrence. Une occurrence qui a déjà une récupération présente (0 ou positive) l'affiche comme existante, sans puce d'ajout (sa modification relève de la story 4.2).
  - Point d'arrêt : après chaque occurrence (position `p ≥ 1` de sa portée) et après le Circuit (`AFTER_TOUR`, position 0) s'il n'est pas vide, en excluant les emplacements interdits (`isStopPointAllowed` de la story 1.2 : jamais juste après le compte à rebours, jamais juste avant la Fin) ; un seul point par emplacement ; un emplacement qui porte déjà un point l'affiche comme existant.
- Puces (`8328:29270`) sur la ligne structurelle sous l'occurrence : « Récupération » (pointillés, ajout possible) / « Récupération {durée} » (rempli, ajoutée) ; « Point d'arrêt » (pointillés) / rempli quand ajouté ; point aligné à droite (ch13 L1258 PR #390 : bord droit aligné sur les cartes, symbole et texte alignés à droite, marge interne 14, intervalle 6).
- Toucher « Point d'arrêt » bascule son ajout. Toucher « Récupération » ouvre la roulette « Durée de récupération » (`8328:28733`, `DurationWheelPicker` + barre ✕ / ✓ existants) initialisée au défaut du Profil (`Profile.postActivityRecoverySecondsDefault`, 30 s initialement, D-307 / RM-209) ou à la valeur déjà choisie dans le sous-brouillon ; plage 0..300 s, grille 1 s jusqu'à 5, 5 s jusqu'à 120, 30 s jusqu'à 300 (CE-T03-08 §14) ; ✓ ajoute ou met à jour cet emplacement (0 conservé comme présent, D-323) ; ✕ restitue l'état de cet emplacement seulement. Toucher une récupération ajoutée la retire du sous-brouillon (désélection).
- Barre : « Confirmer N pause(s) ajoutée(s) » (N = nombre d'objets nouvellement ajoutés : récupération + point = 2 ; une désélection retranche ; N = 0 : Confirmer indisponible) et « Annuler ». Confirmer applique le sous-brouillon au brouillon de séance en une mise à jour fonctionnelle unique (`postActivityRecoverySeconds` et `stopPoints`), puis quitte le placement. Annuler (et retour système) restitue l'état d'entrée sans mutation. Aucune persistance.
- Accessibilité : chaque puce est un bouton nommé (« Ajouter une récupération après {exercice} », « Ajouter un point d'arrêt après {exercice} » / « après le circuit ») avec état sélectionné ; ordre de focus récupération puis point à chaque emplacement ; la barre annonce le nombre d'ajouts.
- Durée de séance et du Circuit recalculées en direct pendant le placement (R positive remplace la Pause terminale, story 1.3).
- Composants séparés (`PlacementLayer` / `PlacementBar` ou équivalent) ; règles d'emplacement dans le domaine (`src/domain/sessions/`).

**Never:**
- Modification ou retrait d'une récupération ou d'un point existants (story 4.2) ; rendu des points hors placement et avertissement D-301 (story 4.3).
- Persistance avant « Continuer » ; nouvelle dépendance ; modification de `tokens.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Entrée | A (avant), Circuit [B, C], D (après) | Récup. après A, B, C, D ; points après A, B, C, après le Circuit ; pas de point après D (avant Fin) | — |
| Seul exercice | A seul | Récup. après A ; aucun point | — |
| Existant | B a R = 20 s | « Récupération 20 s » affichée, sans puce | — |
| Ajout récup. | toucher, ✓ à 30 s | puce remplie « Récupération 30 s », N = 1 | — |
| ✕ roulette | — | emplacement inchangé | — |
| Récup. + point | même emplacement | N = 2 | — |
| Désélection | toucher une puce ajoutée | N diminue | — |
| N = 0 | — | Confirmer indisponible | — |
| Confirmer | — | brouillon mis à jour en une fois, placement quitté | — |
| Annuler | — | brouillon inchangé (identité) | — |
| R = 0 ✓ | — | présente à 0 (pas d'information affichée hors placement) | — |

</frozen-after-approval>

## Code Map

- `src/domain/sessions/StopPoint.ts` (`isStopPointAllowed`, `stopPointNeighbors`) ; `src/domain/sessions/SessionDraft.ts` (`stopPoints`, `postActivityRecoverySeconds`).
- `src/features/sessions/CompositionContextHeader.tsx` -- bouton « Ajouter un arrêt ».
- `src/features/sessions/CompositionScreen.tsx` -- état de placement, atténuation, barre à la place de « Continuer », branchement de la ligne structurelle.
- `src/features/sessions/ActivityRecoveryLine.tsx` -- ligne structurelle (puces en placement).
- `src/features/sessions/DurationWheelPicker.tsx`, `WheelPickerOverlay`, `src/features/sessions/wheelPickerMath.ts` (E12 : plage et grille de récupération).
- Profil : défaut `postActivityRecoverySecondsDefault` (service / contexte Profil existant).
- `src/shared/ui/KodjoIcon.tsx`, `assets/icons/manifest.json` ; `fr.ts`.
- Tests : domaine (emplacements), composants (placement, roulette, barre), `CompositionScreen.test.tsx`.

## Tasks & Acceptance

**Execution:**
- [x] Domaine : emplacements autorisés + tests.
- [x] Icône « Ajouter un arrêt » ; bouton d'en-tête.
- [x] Sous-brouillon, puces, roulette (grille 0..300), barre ; tests (matrice).
- [x] `fr.ts`.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert.

## Implementation Notes

- Roulette « Durée de récupération » : elle s'ouvre toujours au défaut du Profil (résolu avant l'ouverture ; réponse tardive ignorée). La branche « initialisée à la valeur déjà choisie dans le sous-brouillon » n'est pas atteignable — toucher une récupération ajoutée la retire (désélection) — et n'a donc pas été implémentée.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | blind | Surfaces déjà ouvertes non fermées à l'entrée ; placement ouvrable sans emplacement | medium | patch. |
| 2 | blind + verification-gap | Retour iOS / garde de sortie pendant le placement ; perte de focus non testée | medium | patch. |
| 3 | blind + edge | Défaut du Profil arrivé trop tard ou après sortie | medium | patch. |
| 4 | blind + verification-gap | Gestes de carte pendant le placement non testés | medium | patch : test. |
| 5 | verification-gap | Roue Android : changement de minute sur la grille non testé | medium | patch : test. |
| 6 | blind | Puces de 24 pt ; retrait non annoncé ; focus à l'entrée et à la sortie | medium | patch. |
| 7 | blind | Point existant rendu comme ajouté | low | patch : style « existant ». |
| 8 | edge | Confirmer sans effet ; `$&` dans les noms ; grille vide | low | patch. |
| 9 | blind | Calculs du domaine à chaque rendu | low | patch : mémorisation. |
| 10 | blind | Branche « rouvrir à la valeur choisie » inatteignable | low | patch : retirée (la spec fait retirer une récupération ajoutée au toucher). |
| 11 | blind | Nom et Étiquette actifs pendant le placement | false | Liste de la spec (cartes, compteur, œil, « + », bornes) et Figma `8328:29270` (en-tête non atténué). |
| 12 | blind | Défaut du Profil hors grille arrondi | low, rejeté | Valeur ramenée sur la grille 0..300 (CE-T03-08 §14) ; jugée en J3. |
| 13 | blind | Délai porté à 60 s pour le test de bout en bout | false | Lenteur antérieure à la story (27 s seul) ; assertions inchangées. |
| 14 | blind | Couleurs sans jeton, statuts, notes | low, rejeté | Constantes nommées (règle PRE-5) ; transitions du workflow. |

## Verification

**Commands:**
- `npx jest src/domain/sessions src/features/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.

**Manual checks (if no CLI):**
- iPhone (J3, Hermann) : placement, roulette, Confirmer / Annuler, VoiceOver.
