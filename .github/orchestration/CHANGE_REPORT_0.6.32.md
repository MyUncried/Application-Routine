# Change report — KODJO Protocol V2 0.6.32

Date : 2026-09-17

## Objet

Fermer le défaut de routage entre le gate d’implémentation 0.6.31 et l’agent Claude local réellement utilisé en production.

## Constat

Le workflow `kodjo-v2-implementation-artifact.yml` valide correctement plan, revue et gate utilisateur, mais son registre de production ne contient que `agent_adapter=none`, qui exécute `no-remote-agent.js` et ne produit aucune implémentation.

Le chemin local existant et qualifié est :

`run-queued-request.ps1 → start-kodjo-v2.ps1 → run-local-claude.js` sur runner `[self-hosted, Windows, X64, kodjo-claude-local]`.

## Modifications

- ajout de `.github/workflows/kodjo-v2-comment-causal-implementation.yml` ;
- ajout de l’entrée immuable `.github/orchestration/queue/v2-causal/*.json` ;
- réutilisation de `verify-implementation-plan-gate.js` avant toute invocation locale ;
- comparaison stricte du `scope_allow` transporté avec `plan_contract.write_scope` recalculé ;
- projection temporaire vers le format Lean Queue existant, sous `RUNNER_TEMP` ;
- appel exclusif de `run-queued-request.ps1` pour l’exécution ;
- ajout de `.github/orchestration/v2-slices/V2-CAT-01/implementation-mission.md` ;
- ajout de `tests/kodjo/comment-causal-implementation-entry.pilot.js` ;
- ajout de la spécification `KODJO_PROTOCOL_V2_SPEC_0.6.32.md`.

## Invariants conservés

- aucun développement avant PLAN_REVIEW_APPROVED et USER_IMPLEMENTATION_APPROVED ;
- rejeu de l’impact et du contrat v2 avant l’agent ;
- scope strictement identique au contrat de plan ;
- aucune commande d’agent libre ;
- authentification Claude locale inchangée ;
- contrôles et publication applicative assurés par le superviseur local existant ;
- aucune modification du produit ni de la baseline documentaire par ce correctif protocolaire.

## V2-CAT-01

Chaîne causale utilisée :

- plan : `5720329801` ;
- revue approuvée : `5720519466` ;
- gate utilisateur : `5720551793` ;
- planning source : `63a3c26ed492f7c0925cfb57419f3dc2dcc5e476`.

Après fusion et qualification de 0.6.32, une nouvelle demande comment-causale sera ajoutée sous `queue/v2-causal`. Son parent exact deviendra le `source_head` d’implémentation et le workflow local produira la PR applicative.

## Hors périmètre

Aucune correction des findings D-4, D-5, D-8, D-9, D-10 ou D-11 de l’audit indépendant antérieur. Aucun changement fonctionnel V2-CAT-01. Aucun changement du routage VISUAL_CORRECTION.
