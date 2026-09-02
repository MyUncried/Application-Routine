# KODJO — V1.4 LOCAL — adaptation minimale des workflows

Statut : **conception technique vérifiée sur l’état Git actuel ; aucun workflow métier V1.4 activé par ce document**.

## 1. Sources inspectées

- workflow T01-S09 d’implémentation V1.3 actuellement présent sur `main` : `.github/workflows/t01-s09-implementation-v1-3-temporary.yml` ;
- workflow T01-S09 de révision du plan V1.3 : `.github/workflows/t01-s09-plan-revision-v1-3-temporary.yml` ;
- workflow ayant démontré la continuité locale : `.github/workflows/kodjo-claude-local-session-resume-03.yml` ;
- event router V1.3 : `.github/workflows/kodjo-event-router-v1-3.yml` ;
- branche métier : `feat/creation-seance-catalogue` ;
- Issue active : `#17`.

## 2. Écarts factuels à corriger avant toute reprise métier

### Exécuteur

Le workflow T01-S09 V1.3 utilise `runs-on: ubuntu-latest` et `anthropics/claude-code-action@v1`. Ce chemin est incompatible avec la décision V1.4 LOCAL.

Le chemin V1.4 doit utiliser exclusivement :

`runs-on: [self-hosted, Windows, X64, kodjo-claude-local]`

puis `claude.cmd` sous l’identité/configuration locale validée.

### Mode

Le checkpoint historique d’implémentation contrôlé par le workflow V1.3 exige `mode == "CLOUD_WRITE"` et matérialise `mode=CLOUD_WRITE` dans le SOURCE_ATTESTATION. Cette autorisation ne peut pas être réutilisée pour V1.4.

Avant une nouvelle écriture métier, un checkpoint/une autorisation fraîche doit porter le mode local retenu, par exemple `LOCAL_WRITE`, et l’écrivain `CLAUDE_CODE_LOCAL` ou la valeur canonique décidée par le protocole. La valeur canonique doit être unique dans les contrôles et l’état durable.

### HEAD

Le workflow V1.3 d’implémentation est verrouillé sur `34b3e53879d0ac20a3057da932df6b948d6030c9`.

Le HEAD réel observé de `feat/creation-seance-catalogue` le 02/09/2026 est `640f2c91d0a219e88ca010d8feb9e6c181fa4db1`.

Il est donc interdit de simplement remplacer l’exécuteur Cloud par l’exécuteur local dans le workflow existant. Le delta entre le dernier checkpoint métier autorisé et le HEAD actuel doit être revalidé avant de produire un nouveau `authorized_head`.

### Issue #17

Le corps initial de l’Issue #17 mentionne encore :

- baseline `c3af9990c8a35013bbad372c2eca2ce16d66d138` ;
- mode initial `CLOUD` ;
- protocole V1.2.

Ces valeurs sont historiques. Elles ne constituent pas une autorisation V1.4 LOCAL. Avant reprise, l’état actif/checkpoint doit superséder explicitement les anciennes métadonnées d’orchestration sans réécrire les règles fonctionnelles de l’Issue.

## 3. Adaptation minimale retenue

Le workflow métier local ne doit pas être une réécriture de la machine métier. Il réutilise les barrières déterministes existantes et remplace uniquement le transport/exécuteur Claude.

### Préflight commun avant appel Claude

Vérifier, sans appel modèle :

1. runner exact `KODJO-LOCAL-RUNNER` ;
2. branche métier attendue ;
3. HEAD égal au `authorized_head` fraîchement validé ;
4. worktree propre avant écriture ;
5. `CLAUDE_CONFIG_DIR` absolu et attendu ;
6. `claude.cmd` disponible ;
7. credential local présent ;
8. access token non expiré lorsque l’expiration est lisible ;
9. mode local et écrivain local explicitement autorisés ;
10. plan/checkpoint/source attestation/fraîcheur documentaire exigés par V1.3 présents et vérifiés ;
11. session Claude : soit aucune session pour le premier appel du bloc, soit session ID durable + transcript natif unique pour une reprise.

Tout échec de cette liste est `ORCHESTRATION_FAILURE` et bloque l’appel Claude.

### Premier appel d’un bloc

Utiliser le CLI local validé et récupérer le JSON incluant `session_id`, durée, tours et coût Claude déclaré :

`claude.cmd -p --output-format json <prompt>`

L’identifiant de session retourné est persisté dans l’état durable avec le bloc, la tranche, le HEAD et le mode auxquels il appartient.

### Appels suivants du même bloc

Si les préconditions de continuité restent valides :

`claude.cmd -p --resume <session_id> --output-format json <prompt_delta>`

Avant reprise, vérifier le transcript natif local correspondant. `--fork-session` et tout fallback Cloud sont interdits.

Le prompt de reprise contient uniquement le delta utile, les nouvelles décisions/erreurs/revues et les références fraîches nécessaires ; il ne reconstruit pas l’historique complet déjà présent dans la session.

### Écriture et commit

Claude local modifie le worktree autorisé mais ne pousse pas directement.

Après retour Claude :

1. valider le statut structuré ;
2. vérifier mécaniquement les fichiers modifiés contre le périmètre autorisé ;
3. exécuter/valider les tests requis ;
4. refuser tout fichier hors périmètre ;
5. seulement après validation, GitHub Actions effectue le commit/push sous l’identité technique prévue ;
6. publier le checkpoint/résultat durable ;
7. déclencher le contrôle indépendant ChatGPT/Work.

Cette séparation conserve la règle V1.3 : Claude est l’écrivain du contenu métier, GitHub Actions est le transport mécanique du commit/push après validation.

## 4. Continuité et récupération

Une erreur de publication après un appel Claude réussi ne doit pas provoquer un nouvel appel modèle si le résultat peut être récupéré localement de manière fiable.

Le workflow doit donc conserver localement, avant publication GitHub, une récupération minimale/sanitisée suffisante pour republier :

- session ID ;
- résultat structuré ;
- métriques ;
- HEAD de départ ;
- statut du worktree/diff nécessaire à la reprise technique.

Aucun secret OAuth ni contenu sensible non nécessaire ne doit être publié dans GitHub.

Si l’appel Claude lui-même échoue après avoir été effectivement lancé, l’appel est compté. La décision de reprendre la même session dépend de l’état du transcript et de la nature de l’échec ; aucun fallback Cloud n’est permis.

## 5. Event router / Work

Le transport V1.3 démontré `pull_request:synchronize → Work` reste réutilisable.

Le routeur historique contient aussi des chemins de test OpenAI API. Ils ne sont pas nécessaires à l’exécution Claude Local et ne doivent pas être confondus avec le chemin nominal V1.4. Leur conservation historique ne constitue pas une exigence d’appel OpenAI pour chaque transition V1.4.

Le chemin nominal V1.4 reste : état GitHub durable → signal démontré vers Work → contrôle ChatGPT/Work → autorisation/transition durable → runner local Claude lorsque nécessaire.

## 6. Stratégie de migration minimale pour T01-S09

Ne pas modifier maintenant le workflow V1.3 temporaire en place : il constitue une preuve historique et contient des autorisations Cloud/HEAD obsolètes.

Créer, après revalidation du checkpoint T01-S09, un nouveau workflow V1.4 LOCAL dédié à la reprise de la tranche. Il doit reprendre les contrôles de périmètre et de publication du workflow V1.3, mais :

- utiliser le runner local Windows ;
- utiliser PowerShell compatible avec le runner démontré ;
- utiliser `claude.cmd` ;
- utiliser le nouveau `authorized_head` validé ;
- utiliser le mode local canonique ;
- créer/persister la session au premier appel puis `--resume` pour les corrections/retests du même bloc ;
- ne contenir aucun secret Claude Cloud ;
- ne contenir aucun fallback Cloud.

## 7. Barrière avant matérialisation du workflow métier

La prochaine étape n’est pas encore un appel Claude.

Il faut d’abord reconstruire et revalider l’état T01-S09 à partir de GitHub : dernier checkpoint métier stable, plan approuvé, décisions postérieures, delta Git jusqu’au HEAD `640f2c91d0a219e88ca010d8feb9e6c181fa4db1`, et fraîcheur des sources applicables.

Ce contrôle déterminera le nouvel `authorized_head`, le mode local canonique et le point exact de reprise. Ce n’est qu’ensuite que le workflow V1.4 LOCAL T01-S09 pourra être matérialisé sans inventer ni réutiliser une autorisation Cloud périmée.
