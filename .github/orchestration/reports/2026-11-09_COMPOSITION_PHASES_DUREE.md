# Rapport de mission — COMPOSITION_PHASES_DUREE (09/11/2026)

## Identification

| Élément | Valeur |
|---|---|
| Mission | Lot Composition « durée de série et phases du mouvement », ouvert par Hermann le 09/11/2026 (« 2. Oui ») à partir du constat d) de la recette iPhone PRE-10 n° 1 |
| Objectif | Signaler et bloquer une durée de série inférieure à la durée des phases ; demander l'arrondi d'une durée non multiple |
| Branche / départ | `composition-phases-duree`, créée depuis `pre10-bmad/dev` à `d0c4a85a` |
| Spec du lot | `_bmad-output/composition-phases-duree/spec-composition-phases-duree.md` |

## Périmètre

- **Demandé** : constat d) — « Si un objectif en durée est inférieur à la durée totale des phases, il faut un message d'alerte. Si ce n'est pas un multiple il faut un message et demander s'il faut arrondir la valeur au multiple supérieur ou inférieur (appliquer le même mécanisme à la durée totale). » Arbitrages : à la saisie, bloquante, inférieur / supérieur.
- **Traité** : feuille Paramètres d'exécution (Cible commune et Cibles par série, mode Durée chiffrée avec phases complètes) ; registre D-514 et annotation des formulations contraires.
- **Non traité** : contrôle propre à la Durée de l'exercice (À CLARIFIER 1 de la spec) ; marquage des cartes de Séances déjà enregistrées (À CLARIFIER 2).

## Constats

- La règle en vigueur (PHC-20261026, D-446) rendait la cible de série indépendante du motif : la formulation « La somme des phases est la durée du motif, jamais la durée cible de la série. » figure dans 12 passages (11 fichiers) et dans PHC-20261026.
- Toutes les saisies au clavier de la feuille passent par `commitKeyboard` à la sortie du champ (focus d'un autre champ, Précédent / Suivant, fermeture) : point unique du contrôle « à la saisie ».

## Modifications réalisées

- `src/domain/activities/phaseCycleFit.ts` (nouveau) : `phaseCycleFit`, `phaseCycleIssues`.
- `src/features/activities/ExecutionParametersSheet.tsx` : message et marquage rouge (durée inférieure), ✓ indisponible ; alerte native d'arrondi à la sortie d'une Cible non multiple et au ✓.
- `src/shared/i18n/index.ts` : libellés.
- Documentation (classe B) : D-514 au registre (ch07) ; annotations datées dans ch03, ch04, ch05, ch07, ch08, ch09, ch10, ch11, ch12, ch13 et `docs/KODJO-Phases-Guidage-Cyclique-2026-10-26.md`.
- Tests : `phaseCycleFit.test.ts` (nouveau, 4 tests) ; `ExecutionParametersSheet.phases` (4 nouveaux tests, 2 amendés) ; `ExecutionParametersSheet.mfn.a21` (4 amendés : durée choisie multiple du motif obtenu) ; `ExerciseScreen` et `ExerciseScreen.r6.integration` (3 amendés : mêmes raisons).

## Preuves et tests

- `npx jest src/domain/activities/__tests__/phaseCycleFit.test.ts src/features/activities/__tests__/ExecutionParametersSheet.phases.test.tsx` : 64 tests PASS.
- `npx jest src/features/activities src/domain/activities src/features/sessions src/domain/sessions` : 238 suites, 4 619 tests — 3 échecs avant adaptation (`ExerciseScreen`, `ExerciseScreen.r6.integration` : phases saisies plus longues que la durée de série, désormais bloquées), adaptés ; reruns ciblés 65 tests PASS.
- Suite complète `npx jest --maxWorkers=2` : 332 suites, 5 676 tests — 5 675 PASS, 1 échec : `CompositionScreen.recette1` (« carte à compléter → feuille de paramètres », la feuille n'est pas encore fermée après Annuler) ; relancée seule : 9/9 PASS. Le chemin Annuler n'est pas touché par ce lot ; échec attribué à la durée de l'animation de fermeture sous charge (**plausible**, non démontré).
- `npx tsc --noEmit` et `npx eslint` (fichiers modifiés) : propres.

## Hypothèses non démontrées

- L'alerte native s'affiche au-dessus de la feuille (elle-même un `Modal`) sur iPhone : non vérifié sur appareil.

## Vérifications restantes sur iPhone

1. Exercice en Durée avec phases 20″ + 10″ : saisir 1′10″ → alerte « Arrondir à 1′00″ » / « Arrondir à 1′30″ » ; le choix s'applique.
2. Saisir 20″ → message rouge sous le cadre Séries, valeur en rouge, ✓ indisponible.
3. Durée 1′00″ puis phase 10″ → 15″ : ✓ ouvre l'alerte d'arrondi (45″ / 1′30″).
4. Séries variables : l'alerte nomme la série.

## Éléments non corrigés ou hors périmètre

- À CLARIFIER 1 et 2 de la spec du lot.

## Fichiers modifiés, commit final et état Git

Voir le commit de livraison (message « feat(composition): durée de série et phases du mouvement (D-514) »).
- État Git : branche locale `composition-phases-duree` (non poussée), arbre propre après le commit ; `pre10-bmad/dev` inchangée à `d0c4a85a`.

## Recette n° 2 du 09/11/2026 — réponses d5 / d6

- Verdicts (cahier en ligne) : D1–D4 OK sur iPhone ; d6 OK (cartes non marquées, conservé) ; **d5 KO** : « Mettre le même format de message que pour le phase avec les propositions d'arrondi inférieur et supérieur ».
- Correction (D-515, classe B) : `totalDurationRoundings` (`executionCalculations.ts`) ; `applyRequestedTotalSeconds` (`ExecutionParametersSheet.tsx`) ouvre l'alerte native « Arrondir la durée de l'exercice ? » avec les durées réalisables inférieure et supérieure ; durée réalisable appliquée sans alerte ; ajustement automatique et message « Durée ajustée à … — Annuler » retirés (variante `total` du message d'ajustement supprimée). Libellés `totalRoundTitle`, `totalRoundMessage`. Docs : D-515 (ch07), ch03, ch10, `docs/SOURCE-SAISIE-PARAMETRES-MODALE-2026-10-01.md` annotés.
- Tests : `executionCalculations` 87 PASS (1 ajouté) ; `ExecutionParametersSheet` + `src/domain/activities` avant amendement : 41 suites / 1 470 tests, 6 échecs attendus (ancien ajustement automatique) ; après amendement, reruns ciblés PASS (`keyboard0611` 13/13, 5 tests amendés de `ExecutionParametersSheet.test`) ; `tsc --noEmit` et `eslint` des fichiers modifiés propres. **Suite complète non terminée** : arrêtée par le système (mémoire insuffisante), à relancer.
- À vérifier sur iPhone : point E1 du cahier.
