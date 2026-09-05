# Invariant d’orchestration — pagination complète des commentaires GitHub

Date : 2026-09-05

## Constat

Le workflow T01-S09 de correction a échoué avant l’appel Claude car il recherchait le Gate 1 uniquement dans `GET /issues/17/comments?per_page=100`. L’Issue #17 contient désormais plus de 100 commentaires ; le commentaire de bridge `[KODJO_S09_PLAN_GATE]` `5552063575` n’était donc pas présent dans la page lue.

## Règle permanente

Tout workflow KODJO qui doit retrouver une décision, un gate, une revue, un checkpoint ou tout autre artefact dans les commentaires d’une Issue/PR doit respecter l’un des deux modes suivants :

1. **Référence directe préférée** : si l’identifiant du commentaire attendu est déjà connu et transporté dans le déclencheur/contexte, le workflow lit directement ce commentaire par son ID et vérifie son contenu attendu.
2. **Recherche historique** : si une recherche dans le fil est réellement nécessaire, le workflow doit paginer jusqu’à épuisement des pages et attester la complétude de la lecture. Il est interdit de supposer qu’une valeur `per_page` couvre l’historique complet.

Une recherche partielle, un nombre de commentaires récupérés inférieur au nombre attendu ou une pagination non terminée est un `ORCHESTRATION_FAILURE`; aucun appel IA ne doit être lancé sur cette base.

## Application immédiate S09

`.github/workflows/kodjo-v14-s09-implementation-local.yml` a été corrigé pour parcourir toutes les pages de 100 commentaires jusqu’à la dernière page, puis rechercher le dernier `[KODJO_S09_PLAN_GATE]` valide.

Cette correction est strictement une correction d’orchestration : elle n’autorise ni ne modifie aucun code métier S09 et ne vaut pas Gate fonctionnel supplémentaire.
