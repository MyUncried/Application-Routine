# CHANGE REPORT — KODJO Protocol V2 0.6.40

Date : 2026-09-19  
Objet : restauration bornée de la revue d’implémentation et de la clôture probante UI.

## Portée

Ajouts V2 uniquement :
- input de revue déterministe dérivé du plan UI approuvé et du diff réel ;
- revue OpenAI structurée par `criterion_id` ;
- couverture exacte des preuves requises ;
- contrôle `PRESERVE / CHANGE / FORBIDDEN` ;
- impossibilité pour la revue automatisée de certifier `VISUAL_COMPARE` ou `DEVICE_CHECK` ;
- propagation explicite de `device_gate_required` ;
- publication du contrat de revue dans le commentaire existant.

## Non-régression

Inchangés :
- transport `[KODJO_SLICE] IMPLEMENTATION_OUTPUT → IMPLEMENTATION_REVIEW_OUTPUT` ;
- workflow de revue existant ;
- chemin legacy non V2 ;
- statuts `IMPLEMENTATION_REVIEW_APPROVED` / `IMPLEMENTATION_REVISION_REQUIRED` ;
- queue, recovery, checkpoint, attestation et VISUAL_CORRECTION ;
- gates finaux existants.

Aucun nouveau canal de communication n’est introduit.

## Fichiers

- `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.40.md`
- `.github/orchestration/CHANGE_REPORT_0.6.40.md`
- `scripts/kodjo/verify-ui-implementation-review.js`
- `.github/workflows/kodjo-slice-implementation-review.yml`
- `tests/kodjo/ui-implementation-review.pilot.js`
- registre/tests de gouvernance concernés.

## Qualification attendue

1. tous les `criterion_id` doivent être présents ;
2. tout `change_target` UI approuvé doit être livré ;
3. toute preuve technique requise doit être `PASS` pour APPROVE ;
4. toute preuve device automatisée en `PASS` doit être refusée ;
5. `PENDING_DEVICE` doit laisser possible l’approbation technique tout en maintenant `device_gate_required=true` ;
6. chemin legacy non V2 inchangé ;
7. suite protocolaire Linux ;
8. Windows preflight ;
9. seconde passe indépendante de non-régression avant fusion.
