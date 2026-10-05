# 2026-10-05 — V2_FINALIZE_ACCESSIBILITY_DEFERRAL_FIX

## Identifiant et objectif

- Mission : `V2_FINALIZE_ACCESSIBILITY_DEFERRAL_FIX` — correction d'orchestration autorisée explicitement par Hermann (« applique cette correction »), le 2026-10-05.
- Objectif : lever l'`ORCHESTRATION_FAILURE` du run de finalisation V2-PRE-2 [37244733631](https://github.com/MyUncried/Application-Routine/actions/runs/37244733631) (`V2_FINAL_CRITERION_NOT_CLOSED: UI-3D89E598F31D`) en alignant la finalisation sur la revue, sans affaiblir d'autre contrôle.

## Départ

- Branche : `fix/kodjo-v2-finalize-accessibility-pending`, créée depuis `origin/main` `b961719c` (worktree séparé ; `main` local de Hermann non touché).

## Périmètre

- Demandé et traité : `scripts/kodjo/verify-v2-finalization.js` et son test pilote `tests/kodjo/ui-e2e-finalization.pilot.js`.
- Hors périmètre : workflows, revue, code applicatif, PR #303.

## Constats

- La revue (`verify-ui-implementation-review.js:16`, `DEFERABLE_PROOFS = VISUAL_COMPARE, DEVICE_CHECK, ACCESSIBILITY_CHECK` ; `validateProof` : `ACCESSIBILITY_CHECK` ∈ {PASS, PENDING_DEVICE, FAIL}) reporte l'accessibilité runtime à la barrière humaine.
- La finalisation ne reconnaissait que `VISUAL_COMPARE`/`DEVICE_CHECK` comme reportables : tout `ACCESSIBILITY_CHECK: PENDING_DEVICE` rendait le critère « non fermé » malgré `VISUAL_APPROVED`. 5 des 6 critères UI de PRE-2 étaient concernés.

## Modifications réalisées

- `verify-v2-finalization.js` :
  - `DEFERABLE_PROOF_TYPES` (= types d'appareil + `ACCESSIBILITY_CHECK`) et `proofAllowedBeforeGate` : un `ACCESSIBILITY_CHECK` est admis en `PASS` ou `PENDING_DEVICE` avant la barrière ; les types d'appareil restent exclusivement `PENDING_DEVICE` ; toute autre preuve reste exclusivement `PASS`.
  - `hasPendingDeviceProof` compte les preuves reportables en attente (alignement sur la ligne 478 de la revue).
  - Boucle par preuve : `ACCESSIBILITY_CHECK` `FAIL`/`NON_VERIFIABLE` → `V2_FINAL_TECHNICAL_PROOF_NOT_PASS`.
- Contrôles conservés : refus d'un `PASS` d'appareil avant la barrière, d'une preuve technique non `PASS`, d'une assertion `NON_VERIFIABLE`, d'un critère sans preuve en attente, de `preserve_status` ≠ PASS et des frontières non PASS.
- Tests pilotes ajoutés : cas positif à la forme des critères PRE-2 (et variante accessibilité PASS) ; six cas négatifs (accessibilité FAIL/NON_VERIFIABLE au critère et à l'assertion, preuve fonctionnelle NON_VERIFIABLE, VISUAL_COMPARE PASS avant barrière, critère sans aucune preuve en attente).

## Preuves et tests

- `node --test tests/kodjo/ui-e2e-finalization.pilot.js` : 23/23 PASS.
- Contre-épreuve : avec le vérificateur d'origine, le nouveau test positif échoue sur `V2_FINAL_CRITERION_NOT_CLOSED: UI-001` (reproduction du défaut).
- `node --test tests/kodjo/preflight-lot-c.pilot.js` : 11/11 PASS.
- Rejeu sur les entrées réelles de PRE-2 (revue 5984104726, implémentation 5983669824, marqueur 5985692286, file `.github/orchestration/queue/v2/V2-PRE-2-resume-819e43e3.json`) : `finalization verified — slice=V2-PRE-2 head=3780eb9287cf device=true`, code 0.

## Hypothèses non démontrées

- Les étapes suivantes du workflow de finalisation (rejeu de revue, Jest, TypeScript, lint, cohérence de clôture) n'ont pas encore été exécutées : elles le seront par la relance du run 37244733631.

## Éléments non corrigés / hors périmètre

- Finalisation, fusion de #303 et fermeture de #288 : suivies dans `2026-10-05_V2-PRE-2_FUNCTIONAL_ACCEPTANCE_FINALIZATION.md`.

## Vérifications restant à effectuer sur appareil réel

- Aucune pour ce correctif.

## Fichiers modifiés

- `scripts/kodjo/verify-v2-finalization.js`
- `tests/kodjo/ui-e2e-finalization.pilot.js`
- `.github/orchestration/reports/2026-10-05_V2_FINALIZE_ACCESSIBILITY_DEFERRAL_FIX.md`

## Commit final et état Git

- Commit de livraison de la branche `fix/kodjo-v2-finalize-accessibility-pending` (hash communiqué dans la PR et en clôture).
