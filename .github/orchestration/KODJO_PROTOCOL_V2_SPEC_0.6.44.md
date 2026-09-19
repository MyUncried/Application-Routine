# KODJO Protocol V2 — spécification 0.6.44

Date : 2026-09-19  
Base : 0.6.43  
Objet : Lot B — activation du préflight déterministe dans la Lean Queue et consommation opposable de son attestation.

## Portée

0.6.44 branche le moteur validé en Lot A sur le chemin production existant.

Ordre obligatoire :

```
verify-queue-admission
→ verify-queue-preflight
→ verify-preflight-attestation
→ run-queued-request
→ freshness guards
→ Claude
```

Aucun nouvel événement, workflow, queue, bridge ou état protocolaire n’est créé.

## Attestation obligatoire

Le workflow `kodjo-v2-lean-queue.yml` produit une attestation locale avant `run-queued-request.ps1`.

En production supervisée :
- l’absence d’attestation bloque ;
- un fingerprint invalide bloque ;
- un autre queue blob bloque ;
- un autre request_id bloque ;
- un autre protocol/execution HEAD bloque ;
- une projection locale divergente bloque ;
- un `package-lock.json` divergent au HEAD d’exécution bloque.

## Freshness guards

Après acceptation de l’attestation, seules les données volatiles sont revalidées.

Avant Claude, `run-local-claude.js` vérifie :
- attestation toujours PASS ;
- request_id/protocol_head/execution_head ;
- projection locale exacte ;
- source de prompt inchangée ;
- package-lock du checkout exact.

Les gardes historiques live restent en place :
- PR/branche/HEAD ;
- checkout HEAD ;
- auth/version Claude ;
- acquisition atomique du lock ;
- contrôle post-push.

## Source unique du binaire Claude

La résolution du binaire Claude est centralisée dans `lib/claude-local.js::resolveClaudeBinary` et utilisée à la fois par le préflight et par le runtime local.

## Preuves liées au HEAD d’exécution

Pour VISUAL_CORRECTION, prompt et package-lock sont lus au HEAD applicatif exact, avec fallback GitHub read-only lorsque l’objet n’est pas encore présent dans le clone local.

Cette lecture est centralisée dans `lib/preflight-source.js`.

## Duplications

Lot B **ne supprime encore aucun garde historique stable**.

C’est volontaire :
- le nouveau préflight est désormais autoritatif pour l’admission production ;
- les anciennes validations restent temporairement en double pour démontrer l’équivalence ;
- leur suppression appartient uniquement au Lot C après qualification E2E.

## Non-régression

- Lean Queue reste 0.6.13 ;
- IMPLEMENT conserve le contrat UI complet ;
- VISUAL_CORRECTION conserve le delta historique ;
- recovery/checkpoint/attestation inchangés ;
- implementation review, humain/device et finalisation restent en aval ;
- aucun fichier applicatif modifié.

## Qualification

Lot B doit démontrer :
1. ordre admission → preflight → runner ;
2. refus production sans attestation ;
3. consumer anti-drift ;
4. freshness projection/prompt/package-lock avant Claude ;
5. source Claude partagée ;
6. gardes historiques encore présents ;
7. Linux et Windows verts.

Lot C est interdit avant qualification et fusion de Lot B.
