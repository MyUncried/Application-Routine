# KODJO Protocol V2 — spécification 0.6.43

Date : 2026-09-19  
Base : 0.6.42  
Objet : Lot A — moteur shadow du préflight déterministe et attestation locale, sans changement du runtime de production.

## Portée

0.6.43 implémente le premier lot prévu par l’architecture 0.6.42.

Le moteur :
- sélectionne/relit la queue exacte à partir du boundary Git fourni ;
- agrège les contrôles pré-Claude déterministes ;
- collecte plusieurs défauts indépendants dans un seul rapport ;
- marque les contrôles dépendants `BLOCKED` au lieu de masquer les erreurs ;
- produit une attestation locale `kodjo.protocol.v2.queue-preflight.v1` ;
- calcule un fingerprint opposable.

## Aucun changement de comportement production

Ce lot est volontairement **shadow-only** :
- aucun workflow de production ne l’invoque ;
- `run-queued-request.ps1` n’est pas modifié ;
- `start-kodjo-v2.ps1` n’est pas modifié ;
- `run-local-claude.js` n’est pas modifié ;
- aucun contrôle historique n’est supprimé.

## Sources de vérité réutilisées

Le moteur appelle les sources existantes :
- queue-contract ;
- verify-authorizations ;
- verify-visual-checkpoint ;
- verify-plan-contract-consistency ;
- verify-implementation-mission ;
- queue-request / normalizeRequest ;
- buildPrompt ;
- recovery read-only inspection ;
- toolchain/version/auth probes.

Les règles ne sont pas recopiées dans un second contrat fonctionnel.

## Attestation

L’attestation porte notamment :
- queue path/blob/request_id ;
- before/after ;
- protocol_head/execution_head ;
- operation_kind/mode ;
- bindings plan/review/gate/checkpoint/attestation ;
- projection/prompt/package-lock hashes ;
- toolchain observée ;
- freshness guards à rejouer ;
- checks détaillés ;
- fingerprint global.

## Statuts de contrôle

Les valeurs `PASS / FAIL / BLOCKED / NOT_APPLICABLE` appartiennent uniquement à l’attestation de préflight.
Elles ne deviennent pas des états de la machine protocolaire.

## Non-régression

- Lean Queue reste 0.6.13 ;
- aucun nouvel event, workflow, queue ou bridge ;
- aucun fichier applicatif ;
- IMPLEMENT et VISUAL_CORRECTION restent distincts ;
- review/finalisation restent en aval ;
- les cinq invariants restent inchangés.

## Qualification

Le Lot A doit démontrer :
1. attestation nominale PASS ;
2. fingerprint anti-altération ;
3. refus queue consommée ;
4. collecte multi-erreurs indépendante ;
5. contrôles dépendants BLOCKED ;
6. absence de référence au moteur dans les workflows production ;
7. Linux et Windows verts.

Le Lot B est interdit avant qualification de ce lot.
