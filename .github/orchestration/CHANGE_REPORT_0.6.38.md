# Change report — KODJO Protocol V2 0.6.38

## Objet

Restaurer la revue indépendante d’implémentation dans le chemin réel V2 sans supprimer ni contourner les mécanismes stabilisés pendant V2-BILAT-01 et V2-CAT-01.

## Incident

V2-CAT-01 a produit une PR techniquement verte et bornée mais plusieurs critères explicites du plan approuvé n’étaient pas réalisés : navigation basse, arbres de création, réutilisation de l’éditeur, Médias et sélection multiple notamment.

La cause est un débranchement entre la règle normative de revue d’implémentation et Lean Queue : `run-queued-request.ps1` pouvait annoncer `IMPLEMENTED_AND_VERIFIED` après contrôles techniques et publication, sans exécution de la revue exhaustive requise par les versions antérieures et encore prescrite par 0.6.23 pour une première livraison.

## Restauration

- conservation intégrale de Lean Queue, recovery, checkpoints, double HEAD et `VISUAL_CORRECTION` ;
- état de livraison technique renommé `IMPLEMENTATION_CHECKS_PASSED` ;
- production d’une métadonnée durable de livraison destinée au reviewer ;
- dispatch `repository_dispatch: kodjo_v2_implementation_ready` après livraison ;
- nouveau workflow V2 de revue, fondé sur les invariants de `.github/workflows/kodjo-slice-implementation-review.yml` ;
- extraction déterministe de tous les critères d’acceptation du plan ;
- vérification mécanique de la complétude du rapport ;
- HEAD exact obligatoire ;
- nouvelle revue après chaque nouveau HEAD, correctifs inclus ;
- `USER_VALIDATION_PENDING` uniquement après rapport valide et sans non-conformité bloquante.

## Non-régression

Le workflow générique historique de revue n’est ni supprimé ni modifié. Les mécanismes introduits après BILAT restent en place. Aucun fichier applicatif produit n’est modifié par ce correctif protocolaire.
