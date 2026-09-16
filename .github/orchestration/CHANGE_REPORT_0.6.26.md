# Change report — KODJO Protocol V2 0.6.26

## Objet

Rétablir un chemin canonique pour le **premier plan d’une nouvelle tranche V2** après la régression de raccordement constatée sur `V2-CAT-01`.

Le défaut observé est protocolaire : le workflow V2 disponible pour la planification (`START_PLAN_REVISION`) exige déjà un plan antérieur, une revue antérieure approuvée et une PR applicative. Ces préconditions conviennent à une révision mais sont circulaires pour une tranche neuve.

## Correction minimale

Ajouts uniquement :

- `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.26.md` ;
- `.github/workflows/kodjo-v2-slice-initial-plan.yml` ;
- `.github/workflows/kodjo-v2-slice-initial-plan-review.yml` ;
- `tests/kodjo/v2-initial-planning-entry.pilot.js`.

Le parcours existant `START_PLAN_REVISION → START_PLAN_REVIEW` n’est pas modifié.

## Nouveau parcours

```text
SPEC_PREPARED
  → activation V2
  → planning-mission
  → START_INITIAL_PLAN
  → PLAN_OUTPUT (planning_mode=INITIAL)
  → START_INITIAL_PLAN_REVIEW
  → PLAN_REVIEW_APPROVED | PLAN_REVISION_REQUIRED
  → gate utilisateur ultérieur
```

Aucune PR applicative n’est requise avant la production ou la revue du premier plan.

## Garanties

- `source_head` du premier plan = `baseline_head` du bootstrap ;
- tranche unique `ACTIVE` dans le registre ;
- sources produit vérifiées par SHA-256 ;
- code et tests lus au HEAD produit exact ;
- plan-impact déterministe produit puis rejoué indépendamment ;
- sortie opposable publiée par `github-actions[bot]` ;
- revue indépendante sur runner Claude local ;
- aucune modification de fichier métier pendant plan/revue ;
- aucun contournement par PR vide, faux commentaire ou artefact fictif ;
- `PLAN_REVIEW_APPROVED` ne vaut pas autorisation d’implémentation.

## Compatibilité

Le chemin de révision V2 introduit par la PR #114 reste inchangé et continue de porter ses préconditions historiques.

## Qualification attendue

Le test pilote `tests/kodjo/v2-initial-planning-entry.pilot.js` vérifie statiquement les nouveaux contrats et la conservation du parcours de révision. La PR doit en outre passer les contrôles CI applicables avant fusion.

Après fusion, `V2-CAT-01` doit reprendre au point `PLANNING_AUTHORIZED` en produisant un `PLAN_OUTPUT` INITIAL canonique ; il n’est pas nécessaire de reconstruire son Issue, son bootstrap, sa baseline ou sa mission de planification.
