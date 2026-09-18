# KODJO Protocol V2 — spécification 0.6.34

Date : 2026-09-18  
Base : 0.6.33  
Objet : identité applicative native des nouvelles tranches et confinement des migrations historiques.

## 1. Décision

Toute nouvelle activation V2 doit porter dès sa création une identité applicative complète :

`planning_application_head = baseline_head`.

Cette valeur est écrite simultanément :
- dans `slice-bootstrap.json` ;
- dans l’entrée correspondante de `v2-activation-registry.json`.

Une tranche nouvelle ne peut pas dépendre d’une correction ultérieure du handoff pour compléter cette identité.

## 2. Compatibilité historique

Les bootstraps historiques créés avant 0.6.34 peuvent ne pas porter `planning_application_head`.

Cette compatibilité est limitée à la lecture de leur identité historique. Elle ne permet pas de franchir le nouveau parcours INITIAL→IMPLEMENT avec une identité incomplète.

Le handoff refuse explicitement :
- l’absence de `planning_application_head` ;
- la divergence bootstrap / registre ;
- la divergence avec le `scan_revision` du plan approuvé.

Aucune migration n’est créée automatiquement pour corriger une tranche incomplète.

## 3. Premier plan INITIAL

`START_INITIAL_PLAN` exige désormais avant toute construction de plan :

`bootstrap.planning_application_head == bootstrap.baseline_head == source_head`.

Une activation manuelle ou ancienne ne respectant pas cet invariant est refusée avant le planner.

## 4. Replanification ultérieure

Après activation, un plan ultérieur peut être calculé sur une autre révision applicative.

Dans ce cas, la matérialisation approuvée peut mettre à jour explicitement :
- `planning_application_head` ;
- `slice_bootstrap_sha256` ;
- l’entrée correspondante du registre d’activation.

La mise à jour reste protocolaire et doit être cohérente avec `KODJO_PLAN_IMPACT_JSON.scan_revision`.

## 5. Migration historique de sources produit

`initial-product-source-migrations.json` reste un registre de compatibilité historique explicite.

Une migration de sources produit est liée à une identité stable composée de :
- `slice_id` ;
- `baseline_head` ;
- `product_sources`.

Elle n’est plus liée au hash complet du bootstrap lorsque `product_identity_sha256` est présent.

Ainsi, un changement légitime de `planning_application_head` ne nécessite pas de modifier ou recréer une migration historique de sources produit.

Aucune nouvelle tranche ne reçoit automatiquement une entrée de migration.

## 6. Schéma et identité

`slice-bootstrap.schema.json` déclare `planning_application_head` comme propriété SHA-40 optionnelle afin de conserver la lecture des identités historiques.

`slice-identity.js` impose :
- un SHA-40 valide lorsque le champ existe ;
- l’identité exacte bootstrap / registre dès que le champ existe dans l’un des deux.

## 7. Acceptation

La qualification doit démontrer :
- activation neuve : `planning_application_head == baseline_head` dans bootstrap et registre ;
- premier plan : absence ou divergence refusée ;
- registre : divergence bootstrap / activation refusée ;
- migration V2-CAT-01 : reste valable après changement de `planning_application_head` sans changement de migration ;
- E2E handoff positif et négatifs inchangés ;
- suite protocolaire Linux et Windows verte.
