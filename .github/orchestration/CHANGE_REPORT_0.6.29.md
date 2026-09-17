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

## Révision et certification du 17/09/2026

La première mise en service réelle de 0.6.29 a révélé trois défauts distincts. Ils ont été isolés et corrigés séparément, sans modification applicative ni reconstruction du bootstrap de `V2-CAT-01`.

### 1. Portabilité des empreintes des sources produit

Le run `35156563712` échouait silencieusement dans `Build immutable initial planning packet`. Les SHA-256 du bootstrap avaient été calculés sur les octets du worktree Windows alors que le runner Linux vérifiait les octets checkoutés depuis Git.

- déblocage borné : PR #153, merge `3165a862971e1099b43bcd71247227d4c8e8640e` ;
- correction racine : PR #154, merge `31087b0f0ce07dfaaadb05e657a5a6c043d86b3e` ;
- activations futures : empreinte du blob Git du HEAD ;
- compatibilité historique : acceptation nominative du seul équivalent CRLF du bootstrap déjà activé.

Le run réel final journalise explicitement les anciennes empreintes CRLF acceptées et poursuit sans altérer les sources produit.

### 2. Sorties génératives non structurées

Après le déblocage des sources, le workflow pouvait produire un brouillon sans le bloc obligatoire `KODJO_MODIFIED_MODULES_JSON`, ce qui faisait échouer la fermeture de scope malgré un texte de plan exploitable.

La PR #155, fusionnée par `9cda81b5163dade75e30cfe6c4f6c3f42cb8bd10`, impose des sorties `json_schema` strictes pour le brouillon et les décisions de classification, puis assemble mécaniquement les marqueurs, modules et preuves déterministes.

### 3. Fausse non-convergence et fermeture transitive non contractuelle

Le run `35168034496` atteignait `Close impact scope and assemble canonical plan` puis échouait après plusieurs passages. L’analyse a démontré deux faits :

1. la stabilité comparait des listes ordonnées par `compareText` côté scan et `localeCompare` côté promotion, donc l’ordre pouvait diverger sans aucune croissance réelle ;
2. `scanDirectImporters` est contractuellement un scan direct à un niveau, alors que le workflow INITIAL avait ajouté une promotion successive qui réintroduisait une fermeture transitive non prévue.

La PR #157 a supprimé cette boucle **uniquement pour `START_INITIAL_PLAN`**, conservé un scan direct unique, ajouté la journalisation du volume et un avertissement au-delà de 20 chemins. Elle a été fusionnée par `9a87aa0354e44112fb2427f738ea66bef776a4b1`. Le parcours historique `START_PLAN_REVISION` reste inchangé.

### Qualification de la PR #157

Run pilote `35170319436` :

- job Linux `105040398770` : `SUCCESS` ;
- job Windows `105040514089` : `SUCCESS` ;
- suite pilote complète : `SUCCESS` ;
- parsing PowerShell 5.1 : `SUCCESS` ;
- chemin isolé PowerShell 5.1 : `SUCCESS` ;
- préflight jetable complet sans Claude : `SUCCESS` ;
- certification historique : `SUCCESS`.

### Preuve d’exécution réelle

Le run réel `35171512526`, au HEAD protocolaire `9a87aa0354e44112fb2427f738ea66bef776a4b1` et au `source_head` produit immuable `63a3c26ed492f7c0925cfb57419f3dc2dcc5e476`, est entièrement vert :

- `Validate initial V2 planning gate` : `SUCCESS` ;
- `Build immutable initial planning packet` : `SUCCESS` ;
- `Draft initial V2 plan` : `SUCCESS` ;
- `Close impact scope and assemble canonical plan` : `SUCCESS` ;
- `Publish canonical initial V2 PLAN_OUTPUT` : `SUCCESS` ;
- `Preserve initial planning evidence` : `SUCCESS`.

Le log de fermeture publie :

```text
INITIAL_PLAN_DIRECT_SCOPE modified_modules=38 candidates=70 direct_modified_consumers=7 scope_allow=73
INITIAL_PLAN_DIRECT_SCOPE_WARNING scope_allow=73 threshold=20 contract=ONE_LEVEL_DIRECT_IMPORTS
[KODJO_V2] plan impact verified — 3f07f94f619d4598f5c52e49862d7ae6b5f7b0b0584ab67725b1cdb8db826828
```

L’avertissement de volume est donc visible sans transformer le contrat direct en fermeture transitive ni bloquer arbitrairement le plan.

Artefact opposable : `10476907373`, nom `kodjo-v2-initial-plan-35171512526`, digest ZIP `sha256:9e1f192a9e27ba6d6bdcc945a22b197f064fe63b78e4fddc1558764dcb58c79c`.

Contenu contrôlé de l’artefact :

- `scan.json` : révision `63a3c26…`, 38 `modified_modules`, 70 candidats directs ;
- `matrix.json` : `scope_allow=73`, dont 7 consommateurs directs `MODIFY` et 28 tests `TEST_MUST_ADAPT` ;
- `proof.json` : `candidate_count=70`, `verdict=MATCH`, empreinte scan plan/reviewer identique `3f07f94f…` ;
- `technical-plan.md` : plan INITIAL complet publié sur l’Issue #150 par le commentaire `5707165177`.

## Verdict de la révision 0.6.29

**QUALIFIED** pour le chemin `START_INITIAL_PLAN` démontré par le run réel `35171512526`.

Cette qualification n’autorise pas l’implémentation : le plan doit encore suivre la revue indépendante puis le gate utilisateur prévu par le protocole. Elle ne modifie pas non plus le comportement de `START_PLAN_REVISION`.
