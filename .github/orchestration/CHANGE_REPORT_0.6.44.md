# CHANGE REPORT — KODJO Protocol V2 0.6.44

Date : 2026-09-19  
Objet : Lot B — consommation production de l’attestation de préflight.

## Changements

- Lean Queue exécute le préflight avant le runner.
- `run-queued-request.ps1` exige l’attestation sur le chemin GitHub supervisé.
- `run-local-claude.js` applique les freshness guards de projection/prompt/lockfile.
- le préflight est archivé dans le diagnostic existant ;
- la résolution Claude est centralisée ;
- les lectures prompt/lockfile sont liées au HEAD d’exécution exact.

## Conservation

Aucun garde historique stable n’est retiré dans ce lot. L’équivalence est d’abord démontrée.

## Invariants

I1 : attestation liée queue/request/HEAD/projection.  
I2 : validateurs historiques conservés.  
I3 : stable vs live distingués.  
I4 : review/finalisation hors préflight.  
I5 : aucun Claude sans attestation PASS + freshness guards.

## Qualification attendue

Suite Linux/Windows complète, queue bench, preflight jetable et seconde passe indépendante.
