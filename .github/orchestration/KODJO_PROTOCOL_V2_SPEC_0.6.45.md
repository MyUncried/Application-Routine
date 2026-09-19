# KODJO Protocol V2 — spécification 0.6.45

Date : 2026-09-19  
Base : 0.6.44  
Objet : Lot C — déduplication bornée des contrôles stables et qualification E2E/races du préflight déterministe.

## Portée

0.6.45 termine la mise en place du préflight déterministe définie en 0.6.42.

Le Lot C ne supprime que les répétitions dont l’équivalence est déjà portée par l’attestation 0.6.44 et qualifiée par les tests dédiés.

## Déduplication autorisée

Sur le chemin production disposant d’une attestation vérifiée :

- le consumer matérialise directement la projection locale déjà attestée ;
- `run-queued-request.ps1` ne rejoue plus les validations structurelles stables de queue ;
- le contrôle d’existence/ascendance du `source_head` n’est plus rejoué après l’attestation ;
- le contrat `verify-implementation-mission.js` n’est plus rejoué après checkout pour `IMPLEMENT`.

Ces contrôles restent disponibles sur le chemin local/historique sans attestation afin de ne pas casser les usages de qualification et de diagnostic.

## Contrôles non supprimés

Restent obligatoires après le préflight car ils sont volatils ou post-exécution :

- PR toujours ouverte ;
- branche et HEAD applicatif toujours exacts ;
- ref Git distante exacte ;
- checkout au HEAD attendu ;
- worktree propre ;
- prompt source inchangée ;
- package-lock inchangé ;
- auth/version Claude ;
- acquisition atomique du verrou ;
- scope/delta/checks post-Claude ;
- preuve de livraison après push ;
- implementation review ;
- gate humain/device ;
- FINAL_VERIFICATION.

## Freshness canonique

Les gardes locales projection/prompt/package-lock sont centralisées dans :

`scripts/kodjo/lib/preflight-freshness.js`.

Le runtime local l’utilise avant toute invocation Claude.

## Projection

`verify-preflight-attestation.js` peut matérialiser le `request.json` exact déjà haché dans l’attestation.

Le chemin production ne reconstruit donc plus une seconde projection indépendante.

## Races qualifiées

Le Lot C oppose explicitement :

- queue modifiée après préflight ;
- prompt modifié après préflight ;
- package-lock modifié après préflight ;
- PR fermée/déplacée après préflight — guard live conservé ;
- branche/HEAD distant déplacé — guard live conservé ;
- lock occupé après préflight — acquisition atomique conservée ;
- IMPLEMENT / INITIAL ;
- IMPLEMENT / RESUME_DELTA ;
- VISUAL_CORRECTION / RESUME_DELTA ;
- recovery/checkpoint/attestation ;
- finalisation jusqu’à READY_TO_CLOSE via les suites existantes.

## Non-régression

- Lean Queue reste 0.6.13 ;
- aucun nouvel état protocolaire ;
- aucun nouveau workflow/event/queue/bridge/transport ;
- aucun fichier applicatif ;
- aucune modification de PLAN/PLAN_REVIEW ;
- IMPLEMENTATION_REVIEW et FINAL_VERIFICATION restent indépendants ;
- VISUAL_CORRECTION reste une revue delta ;
- les trois HEAD protocole/plan/application restent distincts.

## Critère de clôture

Le chantier préflight ne peut être déclaré terminé que si :

1. suite Linux complète PASS ;
2. Windows preflight PASS ;
3. queue bench PASS ;
4. disposable preflight sans Claude PASS ;
5. tests Lot A/B/C PASS ;
6. seconde passe indépendante PASS ;
7. aucun invariant historique n’a disparu silencieusement.
