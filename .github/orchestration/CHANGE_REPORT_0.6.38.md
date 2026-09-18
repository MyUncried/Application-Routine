# CHANGE REPORT — KODJO Protocol V2 0.6.38

Date : 2026-09-19  
Objet : restauration bornée du contrat atomique UI dans PLAN / PLAN_REVIEW.

## Portée

Cette étape ne modifie que la planification et la revue du plan.

Ajouts :
- `KODJO_UI_CRITERIA_MATRIX_JSON` dans les plans ;
- `KODJO_UI_PLAN_CONTRACT_JSON` produit par un validateur déterministe ;
- rejeu obligatoire du contrat avant le reviewer ;
- contrôle indépendant de la complétude source → critères, de `REUSE|EXTEND|CREATE`, de `PRESERVE/CHANGE/FORBIDDEN` et de l’adéquation risque → preuve.

## Non-régression

Aucun contrôle existant n’est retiré :
- `KODJO_PLAN_IMPACT_JSON` reste inchangé ;
- `KODJO_PLAN_CONTRACT_JSON` reste inchangé ;
- les contrôles de scope, tests, HEAD, transition et product_sources restent actifs ;
- les workflows d’implémentation, queue, recovery, revue d’implémentation et device ne sont pas modifiés dans cette étape.

Le seul changement apporté au validateur de contrat existant consiste à ignorer les deux nouveaux blocs machine lors de l’analyse de la prose, afin qu’ils ne soient jamais interprétés comme des exigences textuelles concurrentes.

## Fichiers

- `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.38.md`
- `.github/orchestration/CHANGE_REPORT_0.6.38.md`
- `scripts/kodjo/verify-ui-plan-criteria.js`
- `scripts/kodjo/verify-plan-contract-consistency.js`
- `.github/workflows/kodjo-v2-slice-initial-plan.yml`
- `.github/workflows/kodjo-v2-slice-plan.yml`
- `.github/workflows/kodjo-v2-slice-initial-plan-review.yml`
- `.github/workflows/kodjo-v2-slice-plan-review.yml`
- `tests/kodjo/ui-plan-criteria.pilot.js`
- `tests/kodjo/plan-consumption-lifecycle.pilot.js`
- `.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md`

## Qualification attendue

1. tests ciblés du nouveau contrat ;
2. suite protocolaire complète Linux ;
3. suite protocolaire complète Windows ;
4. tranche factice PLAN → PLAN_REVIEW vérifiant au minimum :
   - omission d’un critère UI → refus ;
   - CREATE sans recherche de réutilisation → refus/revise ;
   - preuve incompatible avec le risque → refus ;
   - plan complet → revue possible.

Aucune activation du contrat de développement n’est autorisée avant cette qualification.
