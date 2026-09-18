# KODJO Protocol V2 — spécification 0.6.35

Date : 2026-09-18  
Base : 0.6.34  
Objet : fermeture des derniers écarts du handoff approuvé → Lean Queue.

## 1. Déclenchement de Lean Queue

Après création et push de la Lean Request canonique, le workflow de handoff déclenche explicitement `kodjo-v2-lean-queue.yml` via `workflow_dispatch`.

Cette étape est nécessaire car un push effectué avec le `GITHUB_TOKEN` d’un workflow ne déclenche pas automatiquement un second workflow GitHub Actions.

Le mode `VALIDATE_PLAN_HANDOFF` reste borné et ne déclenche jamais Lean Queue.

## 2. Budget d’exécution

Le générateur `generate-approved-plan-lean-request.js` ne définit plus de valeurs de budget privées.

Il réutilise directement `DEFAULT_LIMITS` de `scripts/kodjo/lib/claude-local.js`.

Référence actuelle :
- `max_ai_calls=1`
- `max_duration_seconds=3600`
- `max_prompt_bytes=32768`
- `max_total_prompt_bytes=32768`
- `max_rollovers=0`

Ainsi le handoff ne peut plus produire une Lean Request admise structurellement mais refusée ensuite par le moteur local pour dépassement de plafond.

## 3. Acceptation

- qualification Linux ;
- qualification Windows ;
- test structurel du dispatch explicite ;
- test de liaison du budget aux `DEFAULT_LIMITS` ;
- rejeu réel de V2-CAT-01 depuis le handoff validé.
