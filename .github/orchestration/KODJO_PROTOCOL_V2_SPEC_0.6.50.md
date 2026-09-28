# KODJO Protocol V2 — 0.6.50 — Assertions UI atomiques

## Objet

Cette évolution ferme PE-27 sans créer de nouveau workflow, canal, état runtime ni type de gate.

Le contrat UI de planification distingue désormais :

- le `criterion_id`, qui reste l’unité fonctionnelle/UX de traçabilité ;
- les `assertion_id`, qui deviennent l’unité observable de conformité à l’intérieur d’un critère.

Un nouveau plan UI est généré en `kodjo.ui-criteria.v2`. Les plans historiques `kodjo.ui-criteria.v1` restent lisibles et rejouables sans migration rétroactive.

## Règle d’atomicité

Une assertion représente un invariant observable pouvant être faux indépendamment des autres.

Deux propriétés sont séparées en assertions distinctes lorsque au moins une des conditions suivantes est vraie :

1. l’une peut être non conforme alors que l’autre reste conforme ;
2. elles exigent des types de preuve différents ;
3. leur correction peut être indépendante.

L’atomicité ne suit pas les nœuds d’implémentation React/Figma. Elle porte uniquement sur les propriétés normatives observables.

## Types d’assertion

Chaque assertion porte exactement un `property_type` parmi :

- `PRESENCE`
- `CONTENT`
- `STATE`
- `GEOMETRY`
- `RELATION`
- `STYLE`
- `LAYERING`
- `INTERACTION`
- `RESPONSIVE`

Les relations, alignements, gaps, layering et comportements responsive sont des assertions de premier rang lorsqu’ils sont normés.

## Source et valeur attendue

Chaque assertion contient :

- `assertion_id=<criterion_id>-Axx` ;
- `source.path` ;
- `source.locator` ;
- `property_type` ;
- `expected` ;
- `proof_required`.

Aucune géométrie, couleur, rayon, marge, typographie ou valeur de style ne peut être inventé. Une valeur n’est opposable que si elle est fournie par Figma, un token, un contrat d’écran ou une décision validée. Sinon la planification doit produire `CLARIFICATION_REQUIRED`.

## Dérivation des preuves

Le validateur applique notamment :

- `GEOMETRY`, `RELATION`, `STYLE`, `LAYERING`, `RESPONSIVE` exigent `VISUAL_COMPARE` ;
- `INTERACTION` exige `FUNCTIONAL_TEST` ou `STATIC_ANALYSIS` ;
- `PRESENCE`, `CONTENT`, `STATE` exigent au moins une preuve observable ;
- chaque preuve exigée au niveau du critère doit être allouée à au moins une assertion ;
- aucune assertion ne peut utiliser un type de preuve absent du critère parent.

## Développement

La mission d’implémentation v2 transporte les empreintes :

- nombre d’assertions ;
- hash de la liste des `assertion_id`.

Le rapport `KODJO_IMPLEMENTATION_CONFORMANCE` doit fournir `assertion_results` pour toutes les assertions, sans omission ni fusion.

## Revue indépendante

Pour les plans v2 :

- chaque assertion est revue séparément ;
- ses `proof_results` sont complets et bornés aux preuves demandées ;
- `VISUAL_COMPARE` et `DEVICE_CHECK` restent `PENDING_DEVICE` sauf défaut démontré ;
- le statut de l’assertion est dérivé mécaniquement de ses preuves ;
- le statut du critère est dérivé mécaniquement des statuts de ses assertions ;
- les `proof_results` du critère sont l’agrégation des preuves des assertions.

Le reviewer ne choisit donc plus librement un verdict global pouvant masquer un sous-écart.

## Compatibilité

- `kodjo.ui-criteria.v1` : lecture/rejeu historique conservé ;
- `kodjo.ui-criteria.v2` : obligatoire pour tout nouveau plan UI produit après activation de 0.6.50 ;
- aucun plan historique n’est réécrit ;
- aucun cycle applicatif en cours n’est rétrofité.

## Qualification attendue

La qualification doit démontrer au minimum :

1. production d’un plan v2 avec assertions ;
2. refus d’un plan UI nouveau sans assertions ;
3. refus d’une assertion sans source ;
4. refus d’une géométrie sans `VISUAL_COMPARE` ;
5. compatibilité de consommation d’un plan v1 historique ;
6. liaison des assertions à la mission d’implémentation ;
7. refus d’un rapport d’implémentation omettant une assertion ;
8. refus d’une revue omettant une assertion ;
9. refus d’un statut de critère plus favorable que ses assertions ;
10. maintien du gate device pour les assertions perceptives.
