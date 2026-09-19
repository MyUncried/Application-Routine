# CHANGE REPORT — KODJO Protocol V2 0.6.45

Date : 2026-09-19  
Objet : Lot C/3 — déduplication sûre et qualification E2E du préflight déterministe.

## Changements

- ajout de `preflight-freshness.js` comme source unique des gardes locales pré-Claude ;
- le consumer d’attestation matérialise la projection attestée ;
- `run-queued-request.ps1` saute les validations stables déjà attestées uniquement sur le chemin avec preflight vérifié ;
- le chemin sans attestation conserve les contrôles historiques ;
- ajout des tests de races queue/prompt/package-lock et de conservation des guards PR/HEAD/lock.

## Déduplication

Supprimé sur le chemin attesté :
- seconde validation structurelle de queue ;
- seconde preuve source_head/ascendance ;
- seconde projection indépendante ;
- second replay de mission IMPLEMENT.

Conservé :
- tous les freshness guards live/runner ;
- tous les contrôles post-Claude ;
- review/device/finalisation.

## Invariants

I1 — l’attestation reste la preuve atomique d’admission.  
I2 — aucune source de vérité n’est copiée.  
I3 — seules les données volatiles sont rejouées.  
I4 — review et clôture restent indépendantes.  
I5 — toute dérive après PASS est arrêtée au guard correspondant.

## Qualification attendue

Linux, Windows, queue bench, disposable preflight, tests Lot C, seconde passe indépendante.
