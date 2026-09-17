# Change report — KODJO Protocol V2 0.6.30

## Décision

Introduire un chemin simplifié et borné pour une **clarification mineure du plan initial** lorsque la résolution utilisateur se réduit à un remplacement littéral exact et n’affecte aucun contrat machine.

## Motivation

Le parcours complet `START_INITIAL_PLAN → revue indépendante` est volontairement coûteux car il reconstruit et revalide le plan à partir de toutes les sources produit. Cette profondeur reste nécessaire pour toute correction structurelle. Elle est disproportionnée lorsqu’un point déjà identifié comme clarification est résolu par un simple littéral, par exemple un libellé exact, sans changement de scope, d’architecture, de tests ni de stratégie d’implémentation.

## Implémentation

- Nouveau workflow `.github/workflows/kodjo-v2-slice-minor-plan-clarification.yml`.
- Nouveau transformateur déterministe `scripts/kodjo/apply-minor-plan-clarification.js`.
- Nouveau contrat de preuve `kodjo.minor-plan-clarification.v1`.
- Réutilisation de `verify-plan-impact.js` et `verify-plan-contract-consistency.js` après transformation.
- Revue Claude réduite sur le diff et les preuves, sans reconstruction complète du contexte produit.
- Publication d’un `PLAN_OUTPUT` et d’un `PLAN_REVIEW_OUTPUT` compatibles uniquement après `APPROVE`.
- Repli explicite `FULL_PLAN_PATH_REQUIRED` en cas de doute ou de divergence.

## Bornes de sécurité

Le fast path n’accepte qu’un remplacement littéral UTF-8 mono-ligne. Les blocs KODJO, les chemins applicatifs et les marqueurs protocolaires sont protégés. Le plan doit déjà porter `KODJO_PLAN_CONTRACT_JSON`, ce qui rend le chemin dépendant du durcissement C-3/C-4 antérieur.

Aucune modification de `source_head`, `modified_modules`, `scope_allow`, tests, migration, API, architecture, données ou persistance n’est admise. Le gate utilisateur reste obligatoire.

## Qualification attendue

La PR doit démontrer au minimum :

- remplacement accepté avec contrat machine inchangé ;
- nombre d’occurrences incorrect refusé ;
- tentative de modification d’un marqueur protocolaire refusée ;
- plan sans `KODJO_PLAN_CONTRACT_JSON` refusé ;
- plan source non reviewable refusé ;
- workflow parsable et invariants de publication présents ;
- suite pilote Linux et Windows verte.

## Hors périmètre

L’extension au chemin `START_PLAN_REVISION`, aux plans associés à une PR applicative, aux modifications multi-lignes ou structurelles et aux clarifications entraînant un changement de scope reste hors 0.6.30.
