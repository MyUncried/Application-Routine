# CHANGE REPORT — KODJO Protocol V2 0.6.39

Date : 2026-09-19  
Objet : restauration bornée du contrat de développement UI.

## Portée

0.6.39 consomme le contrat UI de 0.6.38 dans la phase IMPLEMENT, sans ajouter de canal de communication.

Ajouts :
- dérivation déterministe de `implementation-mission.md` depuis le plan approuvé ;
- liaison par `plan_blob_oid`, hash de matrice, hash des IDs et hash `PRESERVE/CHANGE/FORBIDDEN` ;
- règles opposables de réutilisation/conservation/change control ;
- statuts d’arrêt explicites ;
- rapport final par `criterion_id` demandé à Claude ;
- validation avant génération de Lean Request ;
- rejeu de cette validation dans `run-queued-request.ps1` avant Claude.

## Non-régression

Inchangés :
- Lean Queue `0.6.13` ;
- structure de queue ;
- `prompt_file` ;
- workflows de transport ;
- queue/recovery/checkpoint/attestation ;
- vérifications HEAD/scope/checks existantes ;
- publication et revue d’implémentation ;
- VISUAL_CORRECTION.

Aucune donnée de la matrice UI n’est dupliquée dans un nouveau transport. La mission ne contient que des empreintes et l’instruction de lire le plan approuvé exact.

## Fichiers

- `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.39.md`
- `.github/orchestration/CHANGE_REPORT_0.6.39.md`
- `scripts/kodjo/lib/implementation-contract.js`
- `scripts/kodjo/verify-implementation-mission.js`
- `scripts/kodjo/materialize-approved-plan-handoff.js`
- `scripts/kodjo/generate-approved-plan-lean-request.js`
- `scripts/kodjo/run-queued-request.ps1`
- `tests/kodjo/implementation-contract.pilot.js`
- `tests/kodjo/queue-integration/make-fixture.js`
- registre/tests de gouvernance concernés.

## Qualification attendue

1. mission nominale dérivée du plan : PASS ;
2. plan_blob divergent : refus ;
3. matrice modifiée après approbation : refus ;
4. suppression d’un statut d’arrêt : refus ;
5. vérification que le schéma Lean Queue reste 0.6.13 ;
6. suite protocolaire Linux complète ;
7. Windows preflight complet ;
8. banc queue réel avec l’interface `prompt_file` existante.

La PR ne doit pas être fusionnée avant seconde passe indépendante de non-régression.
