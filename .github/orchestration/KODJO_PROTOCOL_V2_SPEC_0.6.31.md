# KODJO Protocol V2 — spécification 0.6.31

Date : 2026-09-17  
Base : 0.6.30  
Objet : validité temporelle des plans, rejeu des invariants aux points de consommation et gate déterministe avant implémentation.

## 1. Cause traitée

L’audit indépendant du protocole au commit `59c9834d9b2c8619e4630f0bf0f91195de26d9d7` a démontré qu’un plan produit avant le durcissement 0.6.29 pouvait être consommé par une revue exécutée sous un protocole plus récent sans repasser les invariants ajoutés entre-temps. Le vérificateur `verify-plan-contract-consistency.js` était correct mais positionné seulement sur la production du plan et le fast path.

Le protocole 0.6.31 considère désormais les invariants de plan comme des propriétés de l’artefact à chaque consommation, et non comme une preuve ponctuelle acquise à sa seule production.

## 2. Contrat de plan versionné

`KODJO_PLAN_CONTRACT_JSON` passe au schéma :

```json
{
  "schema": "kodjo.plan-contract-consistency.v2",
  "contract_version": 2,
  "protocol_commit": "<40-hex>",
  "scan_revision": "<40-hex>",
  "write_scope": [],
  "required_test_writes": []
}
```

Règles :

- `protocol_commit` identifie le commit protocolaire qui a produit le contrat ;
- `contract_version=2` est le minimum consommable par 0.6.31 ;
- un plan sans contrat versionné, avec schéma antérieur ou version inférieure est refusé `PLAN_PROTOCOL_STALE` ;
- le consommateur recalcule `write_scope` et `required_test_writes` à partir du plan et refuse `PLAN_CONTRACT_DRIFT` si le contrat embarqué diverge ;
- les contrôles `PLAN_SCOPE_CONTRADICTION` et `TEST_CONTRACT_CONSISTENCY` restent bloquants.

La présence d’un `KODJO_PLAN_CONTRACT_JSON` transforme automatiquement l’appel au vérificateur en consommation, y compris sur le fast path 0.6.30. Un artefact hérité ne peut donc pas contourner la péremption en empruntant ce chemin.

## 3. Revue indépendante

Avant toute invocation Claude :

- `kodjo-v2-slice-initial-plan-review.yml` rejoue `verify-plan-impact.js` puis `verify-plan-contract-consistency.js` en mode `consume` ;
- `kodjo-v2-slice-plan-review.yml` conserve `verify-plan-review-transition.js`, rejoue l’impact puis le contrat versionné en mode `consume` ;
- les preuves recalculées sont publiées et conservées avec la revue.

Claude n’est plus le premier mécanisme chargé de détecter une divergence calculable de scope ou de contrat de tests.

### Exception INITIAL à `verify-plan-review-transition.js`

Le chemin INITIAL ne réutilise pas `verify-plan-review-transition.js`. Cette différence est intentionnelle : la mission de planification courante peut légitimement superséder la mission présente au commit produit immuable, alors que les `product_sources` restent immuables. L’intégrité produit du chemin INITIAL est assurée par `verify-initial-product-sources.js`, le bootstrap, la baseline produit et le contrat de plan versionné.

Le chemin de révision, lui, conserve le contrôle de transition complet car il admet uniquement une dérive protocolaire fermée entre `source_head` et `protocol_execution_head`.

## 4. Gate utilisateur et implémentation

Une exécution `IMPLEMENT` de `kodjo-v2-implementation-artifact.yml` exige désormais trois références explicites :

- `plan_comment_id` : commentaire `[KODJO_V2] PLAN_OUTPUT` ;
- `review_comment_id` : commentaire `[KODJO_V2] PLAN_REVIEW_OUTPUT` lié au plan, avec `verdict=APPROVE` et `STATUT : PLAN_REVIEW_APPROVED` ;
- `user_gate_comment_id` : commentaire de `MyUncried` dont le premier marqueur est exactement `[KODJO_V2] USER_IMPLEMENTATION_APPROVED`.

Le commentaire utilisateur doit lier exactement :

```text
[KODJO_V2] USER_IMPLEMENTATION_APPROVED
slice_id=<slice>
source_head=<sha>
source_plan_comment_id=<id>
source_review_comment_id=<id>
```

Avant l’agent d’implémentation, le workflow :

1. vérifie les auteurs, marqueurs, identités et liaisons plan → revue → gate utilisateur ;
2. récupère les vérificateurs depuis le `main` protocolaire courant ;
3. rejoue l’impact du plan ;
4. rejoue le contrat de plan en mode `consume` ;
5. produit `kodjo.implementation-plan-gate.v1` ;
6. refuse toute exécution `IMPLEMENT` si une condition échoue.

`TARGETED_FIX` reste une reprise d’un run d’implémentation existant et n’exige pas un nouveau gate plan/revue/utilisateur ; sa causalité reste portée par le paquet source et les contrôles de reprise existants.

## 5. Effet sur les plans hérités

Un plan produit avant le contrat v2 est intentionnellement périmé. Il ne doit pas être approuvé ou implémenté sous 0.6.31. Il doit être régénéré ou republié par un chemin de planification courant avant nouvelle revue.

Ce comportement remplace l’hypothèse implicite antérieure selon laquelle un plan demeurait consommable tant que sa baseline produit n’avait pas changé.

## 6. Tests obligatoires

- `plan-contract-consistency.pilot.js` : production v2, rejet d’un plan sans contrat, rejet v1, dérive du contrat, consommation v2 valide ;
- `plan-consumption-lifecycle.pilot.js` : les deux revues rejouent le contrat avant Claude, asymétrie INITIAL documentée, gate d’implémentation placé avant l’agent ;
- `implementation-plan-gate.pilot.js` : liaison plan/revue/gate valide, revue non approuvée refusée, liaison utilisateur erronée refusée ;
- suite pilote complète Linux et Windows avant fusion.

## 7. Hors périmètre 0.6.31

Restent hors de cette correction : seuil bloquant de taille de scope, contrainte sémantique `risk_score`, registre générique de commentaires consommés, sérialisation transition/implémentation et détection générique de toute contradiction de prose non structurée. Ces sujets restent auditables séparément ; ils ne sont pas nécessaires à la fermeture du défaut de péremption démontré.
