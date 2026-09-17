# KODJO Protocol V2 — Addendum 0.6.30

## Objet

Cet addendum introduit un chemin borné de **clarification mineure du plan**. Il complète 0.6.29 sans modifier les règles d’activation de tranche, la baseline produit, le contrat `kodjo.plan-impact.v1`, le gate utilisateur ni les règles d’implémentation.

Le chemin complet reste la règle par défaut. Le fast path n’est admissible que pour une clarification explicite qui se réduit à un remplacement littéral déterministe dans le plan, sans modification du contrat machine ni du périmètre technique.

## Déclencheur

Commande :

```text
[KODJO_V2] START_MINOR_PLAN_CLARIFICATION
slice_id=<slice>
bootstrap_path=.github/orchestration/v2-slices/<slice>/slice-bootstrap.json
source_plan_comment_id=<PLAN_OUTPUT>
clarification_source_comment_id=<CLARIFICATION_RESOLVED>
from_text=<littéral exact avant>
to_text=<littéral exact après>
expected_occurrences=<N>
```

Le commentaire `clarification_source_comment_id` doit être publié par le propriétaire du dépôt et porter exactement `[ChatGPT] CLARIFICATION_RESOLVED` ou `[KODJO_V2] CLARIFICATION_RESOLVED`, avec le même `slice_id` et le même `source_plan_comment_id`.

## Conditions d’admission

Le workflow refuse le fast path si l’une des conditions suivantes n’est pas satisfaite :

1. le plan source est un `[KODJO_V2] PLAN_OUTPUT` publié par `github-actions[bot]` ;
2. `planning_mode=INITIAL` et `planning_contract=kodjo.plan-impact.v1` ;
3. `source_head` est exactement le `baseline_head` du bootstrap actif ;
4. le plan source est `PLAN_READY_FOR_INDEPENDENT_REVIEW` ou `CLARIFICATION_REQUIRED` ;
5. le plan contient les blocs `KODJO_MODIFIED_MODULES_JSON`, `KODJO_PLAN_IMPACT_JSON` et `KODJO_PLAN_CONTRACT_JSON` ;
6. `from_text` et `to_text` sont des littéraux UTF-8 mono-ligne distincts, bornés à 200 caractères et ne ciblent aucun marqueur protocolaire ni chemin `app/` ou `src/` ;
7. le nombre réel d’occurrences remplacées est exactement `expected_occurrences`.

Tout échec renvoie au chemin complet. Aucun fallback silencieux n’est autorisé.

## Transformation autorisée

La transformation est purement déterministe :

- remplacement exact de `from_text` par `to_text` ;
- uniquement hors des blocs machine KODJO ;
- aucun appel de modèle pour reconstruire le plan ;
- aucun ajout, suppression ou reclassement de fichier ;
- aucun changement de `modified_modules`, `scope_allow`, tests requis, migration, API, architecture, modèle de données, persistance ou stratégie d’implémentation.

Les blocs machine avant/après sont comparés en JSON canonique. Toute divergence produit `MINOR_CLARIFICATION_MACHINE_CONTRACT_CHANGED`.

## Revalidation déterministe

Après remplacement, le workflow exécute :

1. `verify-plan-impact.js` au `source_head` inchangé ;
2. `verify-plan-contract-consistency.js` ;
3. comparaison du `KODJO_PLAN_CONTRACT_JSON` embarqué avec le contrat recalculé ;
4. production d’une preuve `kodjo.minor-plan-clarification.v1` contenant l’identité des commentaires, les empreintes avant/après, le nombre d’occurrences et les empreintes des scopes.

Le fast path n’est donc utilisable qu’après le durcissement C-3/C-4 de 0.6.29.

## Revue réduite indépendante

Une revue Claude séparée reste obligatoire, mais son contexte est borné à :

- la clarification utilisateur résolue ;
- le diff exact ancien/nouveau plan ;
- la preuve déterministe ;
- la preuve de rejeu `plan-impact` ;
- le plan révisé.

Elle ne refait pas une revue produit complète. Elle doit répondre `REVISE` si le diff introduit ou réinterprète un comportement fonctionnel au-delà du littéral, ou s’il touche scope, fichiers, tests, migration, API, architecture, données, persistance ou stratégie d’implémentation.

En cas de `REVISE`, le workflow publie `MINOR_PLAN_CLARIFICATION_REJECTED / FULL_PLAN_PATH_REQUIRED` et ne publie aucun nouveau plan.

En cas d’`APPROVE`, le workflow publie :

1. un nouveau `[KODJO_V2] PLAN_OUTPUT` compatible, lié au plan supersédé et à la clarification ;
2. un `[KODJO_V2] PLAN_REVIEW_OUTPUT` standard avec `reviewer=CLAUDE`, `review_mode=MINOR_CLARIFICATION`, `verdict=APPROVE` et `STATUT : PLAN_REVIEW_APPROVED`.

Le gate utilisateur explicite reste obligatoire. Le fast path n’autorise jamais directement l’implémentation.

## Invariants

- `source_head` inchangé ;
- bootstrap inchangé ;
- machine contract inchangé ;
- scope d’écriture inchangé ;
- impact replay `MATCH` ;
- remplacement littéral exact et borné ;
- revue réduite indépendante obligatoire ;
- rejet automatique vers le chemin complet dès qu’un invariant n’est plus démontré.

## Périmètre de la version 0.6.30

Cette première version du fast path s’applique exclusivement au chemin de planification initiale `planning_mode=INITIAL`. `START_PLAN_REVISION`, les plans associés à une PR applicative et toute correction structurelle continuent d’utiliser le parcours complet jusqu’à qualification explicite d’une extension ultérieure.
