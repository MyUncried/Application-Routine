# KODJO Protocol V2 — spécification 0.6.32

Date : 2026-09-17  
Base : 0.6.31  
Objet : raccordement du gate plan/revue/utilisateur 0.6.31 au superviseur Claude local de production.

## 1. Défaut corrigé

Le protocole 0.6.31 a ajouté un gate déterministe avant `IMPLEMENT` dans `kodjo-v2-implementation-artifact.yml`. Ce workflow est cependant un pilote d’exécution distante éphémère dont le registre de production ne contient aucun agent d’implémentation : `agent_adapter=none` exécute volontairement `no-remote-agent.js` et s’arrête sans mutation applicative.

Le véritable chemin d’implémentation KODJO V2 existe déjà sur le runner Windows self-hosted :

`run-queued-request.ps1 → start-kodjo-v2.ps1 → run-local-claude.js`.

Le défaut est donc un défaut de **routage entre la preuve d’autorisation 0.6.31 et le superviseur local**, pas une absence d’agent Claude.

## 2. Nouvelle entrée IMPLEMENT comment-causale

Une nouvelle entrée exécutable est définie par `.github/workflows/kodjo-v2-comment-causal-implementation.yml`.

Elle est déclenchée uniquement par l’ajout sur `main` d’une demande immuable sous :

`.github/orchestration/queue/v2-causal/*.json`

La demande porte au minimum :

- `schema_version = kodjo.protocol.v2.comment-causal-request.0.6.32` ;
- `slice_id` ;
- `issue_number` ;
- `source_head` : parent exact du commit qui ajoute la demande ;
- `planning_source_head` : révision applicative exacte sur laquelle le PLAN_OUTPUT a été calculé ;
- `baseline_head` ;
- `slice_bootstrap_file` et `slice_bootstrap_sha256` ;
- `plan_comment_id` ;
- `review_comment_id` ;
- `user_gate_comment_id` ;
- `prompt_file` ;
- `scope_allow` ;
- `checks`, `limits`, `request_id`, `created_at`.

Aucune commande libre et aucun identifiant d’adaptateur distant ne sont acceptés par cette entrée.

## 3. Gate obligatoire avant Claude

Avant tout appel au superviseur local, le workflow :

1. exige exactement une nouvelle demande dans `queue/v2-causal` ;
2. refuse toute modification/remplacement d’une demande existante ;
3. exige `source_head == parent exact du commit de demande` ;
4. relit sur GitHub les trois commentaires : PLAN_OUTPUT, PLAN_REVIEW_OUTPUT, USER_IMPLEMENTATION_APPROVED ;
5. exécute `verify-implementation-plan-gate.js` avec les vérificateurs du protocole courant ;
6. rejoue donc l’impact et le contrat de plan v2 en mode consommation ;
7. compare strictement `scope_allow` de la demande à `plan_contract.write_scope` recalculé ;
8. refuse avant Claude toute divergence.

Le gate 0.6.31 reste donc l’autorité causale. 0.6.32 ne crée pas une deuxième autorisation parallèle ; il fournit le transport vers l’agent local déjà durci.

## 4. Projection vers le superviseur local

Après validation, la demande comment-causale est projetée temporairement vers le format Lean Queue local `kodjo.protocol.v2.lean-request.0.6.13`.

Cette projection :

- conserve `slice_id`, source d’implémentation, baseline, bootstrap, mission, scope, contrôles, limites et request_id ;
- fixe `mode=INITIAL` et `operation_kind=IMPLEMENT` ;
- n’est jamais commitée ;
- est stockée sous `RUNNER_TEMP` ;
- est supprimée en fin de job.

Le workflow appelle ensuite exclusivement :

`run-queued-request.ps1`

Le superviseur existant conserve ses invariants : checkout du `source_head`, branche dédiée, npm ci, authentification Claude locale, invocation bornée, contrôle du scope, recovery, Jest/TypeScript/lint, commit/push contrôlés et création de PR applicative.

## 5. Source et plan

`planning_source_head` et `source_head` sont volontairement distincts :

- `planning_source_head` est la révision immuable examinée par le plan ;
- `source_head` est le parent protocolaire courant de la demande, qui peut contenir uniquement des évolutions d’orchestration postérieures.

Le gate rejoue le plan sur `planning_source_head`. L’implémentation part de `source_head`. Tout changement applicatif intervenu entre les deux doit être détecté en amont et impose une nouvelle planification ; le chemin 0.6.32 n’autorise aucune dérive applicative implicite.

## 6. V2-CAT-01

Pour `V2-CAT-01`, la mission d’implémentation est :

`.github/orchestration/v2-slices/V2-CAT-01/implementation-mission.md`

Elle référence explicitement :

- PLAN_OUTPUT `5720329801` ;
- PLAN_REVIEW_OUTPUT `5720519466` ;
- USER_IMPLEMENTATION_APPROVED `5720551793` ;
- baseline produit `63a3c26ed492f7c0925cfb57419f3dc2dcc5e476`.

La mission ne remplace pas le plan. Le scope machine issu du plan approuvé reste opposable et est contrôlé avant Claude.

## 7. Ancien workflow implementation-artifact

`kodjo-v2-implementation-artifact.yml` reste conservé comme pilote historique de préservation/reprise. Il ne doit plus être présenté comme le chemin de production pour une première implémentation V2 tant que son registre de production ne contient aucun agent réel.

Aucune exécution `IMPLEMENT` de production ne doit utiliser `agent_adapter=none` comme si cette valeur lançait Claude.

## 8. Qualification obligatoire

Avant fusion :

1. parsing YAML du nouveau workflow ;
2. test statique : runner `[self-hosted, Windows, X64, kodjo-claude-local]` ;
3. preuve que `verify-implementation-plan-gate.js` précède `run-queued-request.ps1` ;
4. preuve que le scope de la demande est comparé au `write_scope` du contrat approuvé ;
5. refus d’une demande dont `source_head` n’est pas le parent exact ;
6. absence de `agent_adapter` dans la nouvelle route ;
7. suite pilote complète Linux ;
8. préflight/suite Windows selon la qualification protocolaire courante.

## 9. Hors périmètre

0.6.32 ne modifie pas :

- les décisions produit de V2-CAT-01 ;
- le moteur d’exécution ;
- les règles de VISUAL_CORRECTION ;
- les calculs de bilatéralité ;
- les contrôles de planification/revue 0.6.31 ;
- le format historique des demandes Lean Queue déjà consommées.
