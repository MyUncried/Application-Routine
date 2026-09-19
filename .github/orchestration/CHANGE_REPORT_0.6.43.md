# CHANGE REPORT — KODJO Protocol V2 0.6.43

Date : 2026-09-19  
Objet : Lot A du préflight déterministe.

## Ajouts

- `scripts/kodjo/lib/preflight-contract.js`
- `scripts/kodjo/verify-queue-preflight.js`
- `tests/kodjo/preflight-lot-a.pilot.js`
- spécification/registre associés.

## Comportement

Le moteur est créé mais **non branché** sur la Lean Queue de production.

Il produit une preuve complète et agrégée sans retirer les contrôles existants.

## Invariants

- I1 : chaque check possède id/source/évidence/diagnostic ;
- I2 : les validateurs existants restent les sources de vérité ;
- I3 : preuve structurée par nature du contrôle ;
- I4 : aucune confusion avec review/finalisation ;
- I5 : aucune mutation/Claude dans le moteur shadow.

## Qualification attendue

Linux + Windows, suite complète, tests Lot A et seconde passe indépendante.
