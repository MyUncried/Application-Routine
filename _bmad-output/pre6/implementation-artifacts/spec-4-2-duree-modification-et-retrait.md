---
title: 'Story 4.2 — Durée, modification et retrait'
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: 'dbc238633c88be3fe3ab4f8a77dec7063981b8cf'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-4-1-mode-placement-et-sous-brouillon.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Une récupération ou un point d'arrêt ajoutés (story 4.1) ne peuvent être ni modifiés ni retirés, et les points d'arrêt ne sont pas visibles hors du mode placement.

**Approach:** Afficher les points d'arrêt sur la ligne structurelle hors placement (`8328:29428`) ; toucher une récupération positive ouvre la roulette « Durée de récupération » existante (story 4.1) pour la modifier ; un appui long sur une récupération ou un point ouvre une bulle « Retirer » (`8328:29133`, `8328:33689`) ; alternatives accessibles. Toute modification reste dans le brouillon jusqu'à « Continuer ».

## Boundaries & Constraints

**Always:**
- Point d'arrêt hors placement (`8328:29428`, ch13 L1258 PR #390) : sur la ligne structurelle de l'emplacement, puce « ❚❚ Point d'arrêt » (symbole orange `color-warning`, texte Medium 10 label, fond blanc, bordure 1 #C8C8D7, rayon 12, padding 10/4, intervalle 6), bord droit aligné sur le bord droit des cartes ; le trait de démarcation occupe la largeur restante. Point après le Circuit : sur une ligne structurelle sous le conteneur du Circuit. Récupération et point au même emplacement : récupération à gauche, point à droite.
- Toucher une récupération positive (hors placement) ouvre la roulette « Durée de récupération » (grille 0..300 de la story 4.1) à sa valeur ; ✓ met à jour le brouillon (0 conservé comme présent, D-323 : la ligne n'affiche alors plus d'information) ; ✕ ne change rien. En placement, toucher une récupération existante ouvre la même roulette ; la nouvelle valeur va dans le sous-brouillon, n'est pas comptée dans N (ch08 : « la modification de leur durée n'est pas un ajout ») et s'applique avec Confirmer.
- Appui long (hors placement) sur une récupération positive : bulle « Retirer la récupération » ancrée à la ligne (`8328:29133` : pilule rouge, texte blanc) ; sur un point : « Retirer le point d'arrêt » (`8328:33689`). Choisir Retirer supprime l'objet du brouillon (récupération → absente `null`, la Pause terminale configurée est rétablie dans les durées, RM-038 ; point → retiré de `stopPoints`). Toucher hors de la bulle la ferme sans mutation. Aucun second dialogue (ch10 L631). Une seule bulle à la fois ; elle se ferme au défilement, au glisser d'une carte et à l'ouverture d'un autre contrôle.
- Alternatives accessibles : la récupération est un bouton (« Récupération {durée}, toucher pour modifier ») avec action personnalisée « Retirer la récupération » ; le point est un élément avec action « Retirer le point d'arrêt » ; focus rendu à la ligne après retrait.
- Durées de séance et de Circuit recalculées en direct.
- Composants séparés (bulle, puce de point), réutilisation de `ActivityRecoveryLine`, de la roulette et des constantes de la story 4.1.

**Never:**
- Retirer une récupération à 0 (aucun élément visible, D-303) ; modifier la définition de l'Exercice ; persistance avant « Continuer ».
- Répétition des pauses dans le déroulement et avertissement D-301 (story 4.3).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Point affiché | point après A | puce « Point d'arrêt » alignée à droite sous A | — |
| Modifier R | R = 20, toucher, ✓ 45 | « Récupération 45 s » | — |
| ✕ | — | inchangé | — |
| R à 0 | ✓ 0 | présente à 0, ligne sans information | — |
| Retirer R | appui long, Retirer | R absente, durée recalculée (Pause terminale) | — |
| Retirer point | appui long, Retirer | point retiré | — |
| Toucher ailleurs | bulle ouverte | fermée, aucun changement | — |
| VoiceOver | action « Retirer » | même effet que la bulle | — |
| Placement, modifier existant | R = 20 → 45 | N inchangé ; appliqué à Confirmer ; Annuler le restitue | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/ActivityRecoveryLine.tsx` -- récupération (toucher, appui long, accessibilité) et point d'arrêt hors placement.
- `src/features/sessions/PlacementLayer.tsx`, `src/domain/sessions/placement.ts` -- modification d'une récupération existante dans le sous-brouillon (non comptée).
- `src/features/sessions/CompositionScreen.tsx` -- roulette de récupération (story 4.1), bulle, mises à jour fonctionnelles du brouillon.
- `src/domain/sessions/StopPoint.ts` -- emplacements des points (affichage hors placement, point après le Circuit).
- `fr.ts` ; tests `CompositionScreen.test.tsx`, composants, domaine.

## Tasks & Acceptance

**Execution:**
- [x] Point d'arrêt hors placement + tests.
- [x] Modification de la récupération (hors placement et en placement) + tests.
- [x] Bulle « Retirer » (récupération, point) + alternatives accessibles + tests.
- [x] `fr.ts`.

**Acceptance Criteria:**
- Given la suite complète, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert.

## Implementation Notes

- **Confirmer à N = 0 avec une modification seule** (interprétation, à valider par Hermann) : la story 4.1 rend « Confirmer » indisponible à N = 0, mais la story 4.2 veut qu'une modification non comptée dans N « s'applique avec Confirmer ». « Confirmer » est donc disponible dès que le sous-brouillon porte un ajout OU une modification (`hasPlacementChanges`) ; le libellé reste « Confirmer 0 pause ajoutée ». Revenir à la valeur d'origine efface la modification.
- **Nom accessible de la récupération** : libellé unique « Récupération {durée}, toucher pour modifier » (spec gelée), sans indice ; le retrait passe par l'action « Retirer la récupération ».
- **Bulle** : `Modal` transparente montée seulement une fois l'élément mesuré (`measureAnchor` ; mesure vide : pas de bulle), invisible tant que sa largeur n'est pas connue ; au-dessus de l'élément, dessous s'il manque la place sous la zone protégée ; maintenue dans l'écran (marge 8) des deux côtés. Le voile invisible capte le premier toucher hors bulle ; fermeture aussi par le retour Android, au défilement, au glisser ou au balayage, à l'entrée en placement, à la perte du premier plan et à une sortie interceptée. Ouvrir la bulle referme actions glissées et roulettes ; ouvrir une roulette referme l'autre et la bulle. Position (sablier sur sablier, bord droit sur la puce) : valeurs de rendu, à juger en J3.
- **Focus après retrait** : à l'image suivante (la `Modal` se démonte), sur la ligne (récupération, sinon point restant), sinon sur la carte de l'occurrence ; après le point « après le Circuit », sur la première occurrence qui suit le Circuit (à défaut, l'œil de l'en-tête du Circuit).
- **Valeurs hors grille** (données historiques jusqu'à 5999 s) : la roue s'ouvre sur la valeur ramenée à la grille 0..300 ; ✓ sans avoir bougé la roue ne change rien (hors placement comme en placement). `setOccurrenceRecovery` ignore une durée invalide et une occurrence non `EXERCISE`.
- **Cibles tactiles** : bouton de la récupération limité au sablier et au libellé, puce du point ; marges tactiles limitées à celles de la ligne (4 / 4), jamais sur la carte au-dessus (appui long = glisser).
- **Points non affichés** : un point en tête de portée avant ou dans le Circuit (`position = 0` hors `AFTER_TOUR`) n'a pas d'emplacement affichable (le placement ne le propose jamais) et n'est pas rendu hors placement.
- Icône `remove-recovery` (`8328:41025`, sablier blanc 12) : export MCP en lecture seule, déclarée dans `assets/icons/manifest.json`.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | edge | Récupération existante hors grille (> 300 s ou hors pas) réécrite par un ✓ sans changement | medium | patch : appliquer seulement si la valeur a bougé. |
| 2 | verification-gap | Confirmer avec une seule modification (N = 0) jamais pressé en test | medium | patch : test. |
| 3 | verification-gap + blind + edge | Retrait du point après le Circuit non testé ; focus perdu | medium | patch : tests, focus de repli. |
| 4 | edge + blind | Bulle hors écran en haut, saut au premier affichage, mesure nulle | medium | patch. |
| 5 | blind + edge | Zones tactiles de la ligne débordant sur la carte au-dessus (conflit avec le glisser) | medium | patch. |
| 6 | edge + blind | Roulette non fermée par la garde de sortie ; états non réinitialisés | low | patch. |
| 7 | blind | Nom accessible scindé (spec : un seul libellé) | low | patch. |
| 8 | edge | `setOccurrenceRecovery` sans garde | low | patch. |
| 9 | blind | Durées en direct peu testées | low | patch : tests. |
| 10 | blind | Documentation périmée (« indisponible à N = 0 »), README du domaine, commentaire d'icône | low | patch. |
| 11 | blind | Points en tête de portée non affichables | low, rejeté | Jamais créés par l'interface (story 4.1) ni présents en base (aucun écran antérieur) ; à revoir si une source en produit. |
| 12 | blind | Tests de chemins inatteignables (second appui long, défilement) | low, rejeté | Conservés ; chemins atteignables ajoutés (#3, #6). |
| 13 | blind | « Confirmer 0 pause ajoutée » actif | — | Soumis à Hermann (J3). |
| 14 | blind | Expression régulière fragile, Code Map incomplète, statuts | low, rejeté | Transitions du workflow ; sans défaut constaté. |

## Verification

**Commands:**
- `npx jest src/features/sessions src/domain/sessions --maxWorkers=2` -- expected: vert.
- `npm test -- --maxWorkers=2` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
