# KODJO Protocol V2 — spécification 0.6.37

Date : 2026-09-18  
Base : 0.6.36  
Objet : figer le runtime protocolaire courant avant tout checkout applicatif.

## Incident

Après fusion de la correction 0.6.36, une reprise V2-CAT-01 depuis un `source_head` applicatif antérieur aurait réutilisé les scripts présents dans ce HEAD, car `run-queued-request.ps1` ne copiait le runtime courant que pour `VISUAL_CORRECTION`.

Ainsi un `IMPLEMENT` ou `RESUME_DELTA` pouvait perdre une correction protocolaire fusionnée après le `source_head`.

## Correction

Le répertoire `scripts/kodjo` du HEAD protocolaire courant est désormais copié dans `RUNNER_TEMP` avant toute bascule vers le HEAD applicatif, pour les parcours IMPLEMENT et VISUAL_CORRECTION.

L'exécution de `start-kodjo-v2.ps1` et des utilitaires de publication utilise cette copie figée.

## Invariants

- le `source_head` applicatif reste inchangé ;
- la baseline produit reste inchangée ;
- le runtime protocolaire exécuté est celui du HEAD de workflow ;
- aucun changement applicatif n'est introduit par cette correction.
