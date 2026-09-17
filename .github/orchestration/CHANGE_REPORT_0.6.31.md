# KODJO Protocol V2 — Change report 0.6.31

Date : 2026-09-17  
Base : `0.6.30`  
Déclencheur : audit indépendant du protocole après reproduction de l’écart V2-CAT-01 68/70.

## Modifications

- `scripts/kodjo/verify-plan-contract-consistency.js`
  - passage à `kodjo.plan-contract-consistency.v2` ;
  - ajout de `contract_version=2` et `protocol_commit` ;
  - mode `consume` ;
  - auto-détection de toute consommation d’un plan déjà porteur d’un contrat ;
  - rejet `PLAN_PROTOCOL_STALE` d’un plan hérité ;
  - rejet `PLAN_CONTRACT_DRIFT` si le contrat embarqué diverge du recalcul courant.

- `kodjo-v2-slice-initial-plan-review.yml`
  - snapshot du vérificateur de contrat courant ;
  - rejeu déterministe du contrat avant Claude ;
  - publication de `KODJO_PLAN_CONTRACT_REVIEW_JSON` ;
  - documentation exécutable de l’exception INITIAL à `verify-plan-review-transition.js`.

- `kodjo-v2-slice-plan-review.yml`
  - rejeu déterministe du contrat avant Claude en plus du contrôle de transition existant ;
  - publication de `KODJO_PLAN_CONTRACT_REVIEW_JSON`.

- `scripts/kodjo/verify-implementation-plan-gate.js`
  - nouveau gate déterministe plan → revue approuvée → autorisation utilisateur ;
  - rejeu de l’impact et du contrat courant avant implémentation.

- `kodjo-v2-implementation-artifact.yml`
  - nouveaux inputs `plan_comment_id`, `review_comment_id`, `user_gate_comment_id` pour `IMPLEMENT` ;
  - exigence du marqueur utilisateur `[KODJO_V2] USER_IMPLEMENTATION_APPROVED` ;
  - récupération des gardes depuis le `main` protocolaire courant ;
  - gate exécuté avant l’agent ;
  - preuve `kodjo.implementation-plan-gate.v1` conservée avec le résultat.

## Tests ajoutés / étendus

- `tests/kodjo/plan-contract-consistency.pilot.js` ;
- `tests/kodjo/plan-consumption-lifecycle.pilot.js` ;
- `tests/kodjo/implementation-plan-gate.pilot.js`.

## Conséquence opérationnelle

Tout `PLAN_OUTPUT` antérieur au contrat v2 est périmé et doit être régénéré/republié avant revue ou implémentation. En particulier, l’ancien plan V2-CAT-01 qui avait atteint la revue sous 0.6.30 ne doit pas être réutilisé après activation de 0.6.31.

## Qualification requise

La modification n’est considérée qualifiée qu’après :

1. suite pilote complète Linux ;
2. préflight/suite pilote Windows ;
3. validation structurelle des workflows ;
4. contrôle du diff final et absence de fichier temporaire.
