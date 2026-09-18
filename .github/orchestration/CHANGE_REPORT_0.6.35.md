# Change report — KODJO Protocol V2 0.6.35

Date : 2026-09-18

## Incidents réels

1. Une Lean Request CAT a été commitée sans déclencher Lean Queue : cause GitHub Actions, un push par `GITHUB_TOKEN` ne chaîne pas automatiquement un second workflow.
2. Après ajout du dispatch explicite, le run Lean Queue `35322584442` a refusé la demande avant Claude avec `BUDGET_INVALID_MAX_DURATION_SECONDS` : le générateur utilisait `4500/65536/65536` au lieu des plafonds stables `3600/32768/32768`.

## Corrections génériques

- dispatch explicite de `kodjo-v2-lean-queue.yml` après push de la demande ;
- permission `actions: write` bornée au workflow de handoff ;
- budget du générateur dérivé directement de `DEFAULT_LIMITS` du moteur Claude local ;
- tests dédiés pour empêcher toute divergence future.

## Portée

Aucun changement applicatif. Aucun changement du contrat `lean-request.0.6.13`, du superviseur, de recovery, RESUME_DELTA ou VISUAL_CORRECTION.
