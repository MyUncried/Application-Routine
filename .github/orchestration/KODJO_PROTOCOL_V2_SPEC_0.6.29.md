# KODJO Protocol V2 — addendum normatif 0.6.29

La présente version complète et supersède `0.6.28` pour l’entrée de planification d’une **nouvelle tranche V2**. Toutes les autres règles 0.6.28 et antérieures restent applicables lorsqu’elles ne sont pas contredites ci-dessous.

## A. Défaut corrigé

Le parcours introduit par la PR #114 (`START_PLAN_REVISION → PLAN_OUTPUT → START_PLAN_REVIEW`) est un parcours de **révision** : il suppose un plan antérieur, une revue antérieure approuvée et une PR applicative existante.

Cette précondition ne peut pas servir d’entrée au **premier plan** d’une nouvelle tranche, car à ce stade il n’existe encore ni plan canonique antérieur, ni revue antérieure, ni PR applicative.

Une nouvelle tranche ne doit jamais fabriquer une PR applicative vide, un faux commentaire de bot, une revue fictive ou un artefact historique pour satisfaire ces préconditions.

## B. Chemin canonique — premier plan

Après `SPEC_PREPARED → activation V2 → planning-mission`, la première planification utilise exclusivement :

`[KODJO_V2] START_INITIAL_PLAN`

Le déclencheur porte :

- `slice_id` ;
- `bootstrap_path` ;
- `source_head`.

Pour un premier plan :

- `source_head` doit être exactement le `baseline_head` du bootstrap ;
- la tranche doit apparaître une seule fois dans le registre avec `status=ACTIVE` ;
- `planning-mission.md` doit exister ;
- aucune PR applicative n’est requise ;
- aucun plan antérieur ni revue antérieure n’est requis ;
- aucun fichier métier n’est modifié.

Le workflow analyse en lecture seule le code et les tests du `source_head`, les `product_sources` du bootstrap, la mission de planification, l’Issue et ses commentaires.

Les empreintes des `product_sources` sont des empreintes des **blobs Git du HEAD**, et non des octets dépendants du worktree d’un poste. La compatibilité avec les empreintes CRLF historiques est limitée au bootstrap déjà activé de `V2-CAT-01` ; les activations futures calculent les empreintes depuis Git.

## C. Sortie opposable du premier plan

Le workflow publie un commentaire produit par `github-actions[bot]` au format canonique :

```text
[KODJO_V2] PLAN_OUTPUT
slice_id=...
bootstrap_path=...
source_head=...
planning_mode=INITIAL
planning_contract=kodjo.plan-impact.v1
STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW
```

Le corps contient le plan technique complet ainsi que les blocs d’impact exigés par `kodjo.plan-impact.v1`.

Les sorties génératives utilisées pour construire le premier plan sont structurées par schéma JSON. Les marqueurs protocolaires, la matrice d’impact, les empreintes et le `scope_allow` sont assemblés mécaniquement ; ils ne dépendent pas d’un bloc Markdown libre éventuellement omis par le modèle.

La présence éventuelle d’un `technical-plan.md` préparatoire dans le dossier de tranche ne lui donne aucune autorité protocolaire supplémentaire : il peut être fourni comme **seed de travail non opposable**, mais seule la sortie `PLAN_OUTPUT` de bot devient la source de la revue indépendante.

## D. Revue indépendante du premier plan

Le premier plan utilise :

`[KODJO_V2] START_INITIAL_PLAN_REVIEW`

Le déclencheur porte :

- `slice_id` ;
- `bootstrap_path` ;
- `source_plan_comment_id` ;
- `review_session_id` optionnel.

La revue vérifie notamment :

1. commentaire source produit par `github-actions[bot]` ;
2. `PLAN_OUTPUT` de la même tranche ;
3. `planning_mode=INITIAL` ;
4. `planning_contract=kodjo.plan-impact.v1` ;
5. `source_head = baseline_head` ;
6. tranche toujours `ACTIVE` ;
7. rejeu indépendant du scan d’impact ;
8. code, tests et sources produit lus au `source_head` exact ;
9. aucune PR applicative exigée.

La sortie reste canonique : `PLAN_REVIEW_APPROVED` ou `PLAN_REVISION_REQUIRED`.

## E. Révision avant implémentation

Si la première revue conclut `REVISE`, une nouvelle invocation `START_INITIAL_PLAN` reste autorisée tant qu’aucune implémentation n’a commencé. Le planificateur reçoit l’historique de l’Issue, y compris le `PLAN_OUTPUT` et le `PLAN_REVIEW_OUTPUT` précédents, et doit produire un nouveau `PLAN_OUTPUT` INITIAL complet. La contre-revue suivante cible explicitement le nouvel identifiant de commentaire de plan.

Le parcours historique `START_PLAN_REVISION` conserve son rôle pour les reprises auxquelles ses préconditions sont effectivement applicables. Il ne doit pas être utilisé pour fabriquer artificiellement l’état initial d’une nouvelle tranche.

Une future consolidation peut unifier les workflows, mais aucune refonte générale n’est requise par 0.6.29.

## F. Barrière d’implémentation inchangée

Aucun des états suivants n’autorise l’implémentation : `SPEC_PREPARED`, activation V2, `PLANNING_AUTHORIZED`, `PLAN_READY_FOR_INDEPENDENT_REVIEW`, ni `PLAN_REVIEW_APPROVED` seul.

L’autorisation d’implémentation exige toujours le gate utilisateur explicite et les contrôles d’autorisation applicables du protocole V2.

## G. Qualification obligatoire

La qualification de 0.6.29 couvre au minimum :

1. nouvelle tranche active, sans PR applicative, produisant un `PLAN_OUTPUT` INITIAL ;
2. revue indépendante de ce `PLAN_OUTPUT` sans PR applicative ;
3. refus si `source_head != baseline_head` ;
4. refus si la tranche n’est pas `ACTIVE` ;
5. refus si le commentaire de plan n’est pas produit par `github-actions[bot]` ;
6. refus si `planning_mode != INITIAL` ;
7. rejeu du plan-impact au `source_head` exact ;
8. conservation intacte du parcours `START_PLAN_REVISION` existant ;
9. aucune implémentation autorisée par la seule réussite du plan ou de sa revue ;
10. possibilité de republier un plan INITIAL après un verdict `REVISE`, sans PR applicative ;
11. vérification des `product_sources` indépendante des fins de ligne du worktree ;
12. sorties génératives structurées puis assemblage mécanique des marqueurs et preuves ;
13. scan d’impact INITIAL limité à un niveau d’importateurs directs, sans promotion transitive.

## H. Contrat d’impact du premier plan

Pour `START_INITIAL_PLAN`, `scanDirectImporters` reste un scan **à un seul niveau** à partir des `modified_modules` explicitement déclarés par le premier plan :

- chaque importateur direct candidat est classé exactement une fois ;
- un consommateur direct classé `MODIFY` entre dans `scope_allow` mais ne devient pas une nouvelle racine de scan ;
- un test classé `TEST_MUST_ADAPT` entre dans `scope_allow` ;
- aucune boucle de promotion successive ni fermeture transitive n’est exécutée ;
- le volume `modified_modules`, `candidates`, consommateurs directs `MODIFY` et `scope_allow` est journalisé ;
- un `scope_allow` supérieur à 20 produit un avertissement explicite mais ne change pas le contrat et ne bloque pas à lui seul la planification.

Cette règle supersède `INC-125/T-100` **uniquement pour le chemin `START_INITIAL_PLAN`**. Le parcours historique `START_PLAN_REVISION` n’est pas modifié par cette révision 0.6.29.
