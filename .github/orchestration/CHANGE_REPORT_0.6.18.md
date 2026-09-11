# KODJO V2 — rapport de changement 0.6.17 → 0.6.18

Origine : run Lean Queue #14 `34602213649`, job `103272027821`, diagnostic `10264104201`.

## Cause démontrée

Le scanner PowerShell 0.6.17 recherchait le motif Claude dans toutes les lignes de commande alors que ce motif figurait dans sa propre commande. Le test T-053 simulait la réponse du scanner et n'exerçait donc pas ce comportement réel.

## Correction

- inventaire CIM brut sans motif Claude dans PowerShell ;
- classification positive dans Node ;
- exclusion de l'inspecteur et de ses descendants ;
- suppression du motif générique `claude` ;
- refus conservateur inchangé en cas d'ambiguïté ;
- certification T-058 obligatoire sur le runner Windows persistant réel ;
- artefact de certification sans contenu sensible et avec `claude_invoked:false`.

## Qualification attendue

La PR ne peut être déclarée prête qu'après succès de la suite complète Ubuntu, de la suite Windows PowerShell 5.1 et de T-058 sur `KODJO-LOCAL-RUNNER`. Le rapport sera complété avec les IDs du run, du job et de l'artefact après exécution.

## Périmètre

Aucun fichier applicatif, plan métier, revue, demande Lean Queue ou comportement fonctionnel n'est modifié. Claude n'est pas invoqué.
