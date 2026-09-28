# Change report — KODJO V2 0.6.50

## Motivation

V2-CAT-01 a montré qu’un `criterion_id` dit atomique pouvait encore agréger plusieurs propriétés visuelles indépendantes : contenu, icônes, géométrie, gap, layering, responsive ou interaction. Une revue pouvait donc raisonner globalement alors qu’une sous-propriété restait non conforme.

PE-27 demandait de restaurer dans le contrat V2 la granularité déjà utilisée avec succès dans les contre-recettes CAT-R/SHELL-R.

## Changement

- nouveau schéma de génération `kodjo.ui-criteria.v2` ;
- ajout de `assertions[]` sous chaque critère UI ;
- identifiant stable `<criterion_id>-Axx` ;
- typage déterministe des propriétés observables ;
- source et valeur attendue obligatoires pour chaque assertion ;
- règles de preuve par type de propriété ;
- empreinte des assertions dans `kodjo.ui-plan-contract.v1` version 2 ;
- propagation de cette identité dans `kodjo.ui-implementation-contract.v2` ;
- `assertion_results` obligatoires dans le rapport d’implémentation v2 ;
- revue indépendante assertion par assertion ;
- statut du critère dérivé mécaniquement des assertions ;
- agrégation mécanique des preuves au niveau du critère.

## Compatibilité

Les plans historiques `kodjo.ui-criteria.v1` restent consommables. Ils ne sont ni migrés ni réécrits.

La génération de nouveaux plans UI utilise `kodjo.ui-criteria.v2`.

## Hors périmètre

- aucun nouveau workflow ;
- aucun nouveau canal ;
- aucun changement de Lean Queue ;
- aucun changement applicatif ;
- aucun changement fonctionnel KODJO produit ;
- aucune rétro-application à V2-CAT-01 en cours.

## Activation

La branche protocolaire peut être développée et qualifiée pendant CAT, mais ne doit pas être fusionnée dans `main` avant la fin du cycle CAT actuellement exécuté, afin de ne pas perturber sa continuité.
