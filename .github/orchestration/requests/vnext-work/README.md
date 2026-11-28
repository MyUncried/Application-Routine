# Transport Work commun à VNext

Cette branche et sa PR restent un canal technique de signaux, pas une branche de livraison. Elles ne portent aucun code produit, décision propriétaire ni approbation. Ne pas fusionner pour livrer une tranche.

Les résultats de toutes les tranches VNext enregistrées peuvent être signalés ici après archivage vérifié. Les signaux conservent tranche, opération, demande, source, run/tentative, archive et empreintes. Un signal ne déclenche jamais un deuxième appel Claude et ne vaut pas conformité. Un même événement causal ne doit produire qu'un seul signal.

Le réveil Work utilise l'événement pull_request:synchronize de cette PR et une automation attachée à la conversation pilote. Une preuve de réception durable reste nécessaire pour déclarer le réveil effectif. Aucune référence de tranche n'est codée en dur dans le transport.
