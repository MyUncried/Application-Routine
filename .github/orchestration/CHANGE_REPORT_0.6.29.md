# Change report — KODJO Protocol V2 0.6.29

## Objet

Rétablir un chemin canonique pour le **premier plan d’une nouvelle tranche V2** après la régression de raccordement constatée sur `V2-CAT-01`.

Le défaut observé est protocolaire : le workflow V2 disponible pour la planification (`START_PLAN_REVISION`) exige déjà un plan antérieur, une revue antérieure approuvée et une PR applicative. Ces préconditions conviennent à une révision mais sont circulaires pour une tranche neuve.

## Correction minimale

Ajouts / modifications bornés :

- ajout de `.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.29.md` ;
- ajout de `.github/orchestration/CHANGE_REPORT_0.6.29.md` ;
- ajout de `.github/workflows/kodjo-v2-slice-initial-plan.yml` ;
- ajout de `.github/workflows/kodjo-v2-slice-initial-plan-review.yml` ;
- ajout de `tests/kodjo/v2-initial-planning-entry.pilot.js`.

Les addenda 0.6.26, 0.6.27 et 0.6.28 existants restent inchangés. Le parcours existant `START_PLAN_REVISION → START_PLAN_REVIEW` n’est pas modifié.

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

Si la revue conclut `PLAN_REVISION_REQUIRED`, une nouvelle invocation `START_INITIAL_PLAN` produit un nouveau `PLAN_OUTPUT` INITIAL complet en tenant compte de l’historique de l’Issue ; la contre-revue cible ensuite ce nouveau commentaire.

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

Le chemin de révision V2 introduit par la PR #114 reste inchangé et continue de porter ses préconditions historiques. Les règles 0.6.26 à 0.6.28 restent applicables.

## Qualification attendue

Le test pilote `tests/kodjo/v2-initial-planning-entry.pilot.js` vérifie les nouveaux contrats, les refus principaux, la conservation du parcours de révision et l’absence d’autorisation d’implémentation implicite. La PR doit en outre passer les contrôles CI applicables avant fusion.

Après fusion, `V2-CAT-01` reprend au point `PLANNING_AUTHORIZED` en produisant un `PLAN_OUTPUT` INITIAL canonique ; il n’est pas nécessaire de reconstruire son Issue, son bootstrap, sa baseline ou sa mission de planification.
