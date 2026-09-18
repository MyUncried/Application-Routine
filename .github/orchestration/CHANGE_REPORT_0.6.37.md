# Change report — KODJO Protocol V2 0.6.37

Date : 2026-09-18

## Cause démontrée

`run-queued-request.ps1` copiait le runtime protocolaire avant checkout uniquement pour `VISUAL_CORRECTION`. Pour `IMPLEMENT/RESUME_DELTA`, le script basculait sur `source_head` puis appelait `start-kodjo-v2.ps1` depuis ce checkout historique.

## Risque

Une correction protocolaire récemment fusionnée pouvait être absente lors de la reprise d'une implémentation basée sur un HEAD applicatif plus ancien.

## Correction générique

- copie du runtime courant avant tout checkout applicatif ;
- utilisation de cette copie pour l'exécution et les utilitaires de publication ;
- nettoyage systématique de la copie ;
- test permanent garantissant l'ordre copie → checkout → exécution.

Aucun changement produit, aucun élargissement de scope, aucune modification du contrat Lean Request.
