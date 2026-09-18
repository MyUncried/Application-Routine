# KODJO Protocol V2 — spécification 0.6.38

Date : 2026-09-19  
Base : 0.6.37  
Objet : restaurer, sans retrait d’aucun invariant existant, le contrat atomique de conformité UI pendant PLAN et PLAN_REVIEW.

## Principe de non-régression

Cette version est strictement additive par rapport à 0.6.37.

- aucune règle de 0.6.37 ou des addenda antérieurs n’est supprimée, assouplie ou remplacée ;
- les contrôles de HEAD, scope, impact direct, contrat de tests, transition, product_sources, queue, recovery et runtime restent inchangés ;
- toute incompatibilité découverte avec un invariant existant doit arrêter la livraison de 0.6.38 au lieu de supprimer silencieusement l’invariant concerné ;
- cette version ne modifie ni le contrat de développement ni le contrat de revue d’implémentation : ils seront traités dans des étapes séparées après qualification de PLAN/PLAN_REVIEW.

## Nouveau contrat UI de planification

Tout PLAN_OUTPUT qui modifie au moins un module de présentation dans `app/`, `src/features/`, `src/shared/ui/`, `src/shared/i18n/` ou `assets/icons/` porte exactement un bloc `KODJO_UI_CRITERIA_MATRIX_JSON` de schéma `kodjo.ui-criteria.v1`.

Chaque critère atomique contient obligatoirement :

- un `criterion_id` stable ;
- la source normative exacte : chemin, locator/node/contrat et exigence ;
- les risques `FUNCTIONAL`, `VISUAL`, `ACCESSIBILITY`, `DEVICE` applicables ;
- une recherche explicite de composants/patrons existants ;
- une décision `REUSE | EXTEND | CREATE` et sa justification ;
- les chemins réellement modifiés couverts par le critère ;
- les tests prévus ;
- les types de preuve requis.

Le plan porte également les trois catégories explicites `preserve`, `change` et `forbidden`. Elles restaurent le tableau historique `PRESERVE / CHANGE / FORBIDDEN` sans modifier le mécanisme de scope V2.

## Règles de preuve du plan

Le contrat refuse notamment :

- un module UI modifié sans critère atomique ;
- un critère sans source normative ;
- une création/réutilisation sans recherche d’existant ;
- une cible de changement hors `scope_allow` ;
- un risque `VISUAL` sans `VISUAL_COMPARE` ;
- un risque `ACCESSIBILITY` sans `ACCESSIBILITY_CHECK` ;
- un risque `DEVICE` sans `DEVICE_CHECK` ;
- un risque `FUNCTIONAL` sans preuve logique adaptée.

Le validateur produit `KODJO_UI_PLAN_CONTRACT_JSON`, schéma `kodjo.ui-plan-contract.v1`, contenant l’empreinte canonique de la matrice et la liste déterministe des modules UI concernés.

## Revue indépendante

Avant toute invocation du reviewer, les deux parcours `START_INITIAL_PLAN_REVIEW` et `START_PLAN_REVIEW` rejouent le validateur UI en mode `consume`.

Le reviewer doit ensuite contre-vérifier directement, contre les sources produit courantes et le code checkouté :

1. la complétude source → critères atomiques ;
2. l’absence d’exigence normative omise ou fusionnée dans un critère vague ;
3. la réalité de la recherche de composants existants ;
4. la justification de toute décision `CREATE` face aux composants/patrons déjà présents ;
5. la classification `PRESERVE / CHANGE / FORBIDDEN` ;
6. l’adéquation risque → test → preuve.

Une matrice cohérente avec elle-même mais incomplète par rapport aux sources normatives doit recevoir `VERDICT: REVISE`.

## Hors périmètre de 0.6.38

- développement applicatif ;
- `implementation-mission.md` ;
- contrat de sortie Claude pendant IMPLEMENT ;
- revue d’implémentation ;
- gate device et clôture finale.

Ces éléments ne sont pas supprimés ni modifiés par 0.6.38. Leur restauration détaillée appartient aux étapes suivantes du plan approuvé.
