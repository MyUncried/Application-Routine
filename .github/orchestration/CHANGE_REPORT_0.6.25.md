# Change report — KODJO Protocol V2 0.6.25

## Objet

Corriger le cycle de vie absent qui bloquait la revue du plan `5672106559` après une correction exclusivement protocolaire de `main`.

## Cause

Le workflow utilisait `source_head` pour deux autorités différentes : la référence produit immuable du plan et le HEAD protocolaire d'exécution. L'égalité stricte rendait impossible toute correction du protocole entre la planification et sa revue.

## Correction

- conserver `source_head` et `application_head` sans les réécrire ;
- relever automatiquement `protocol_execution_head` ;
- vérifier l'ascendance et le checkout exact ;
- protéger les entrées produit du plan par chemins exacts et identité de blob entre les deux HEAD, sans confondre une empreinte déclarative historique avec l'état du plan approuvé ;
- n'admettre que des chemins protocolaires fermés ;
- publier la preuve de transition dans l'artefact et le commentaire de revue.

## Qualification exigée

- reproduction exacte de `ef0bf111… → HEAD` ;
- PASS pour un delta exclusivement protocolaire ;
- refus d'un changement applicatif ou d'une entrée produit ;
- refus d'une source non ancêtre et d'un HEAD discordant ;
- suite complète Linux et Windows ;
- mise en service réelle sans Claude au moyen d'un contrôle dédié avant toute nouvelle demande de revue.

Aucun fichier applicatif n'est modifié et aucune nouvelle boucle de revue n'est créée.
