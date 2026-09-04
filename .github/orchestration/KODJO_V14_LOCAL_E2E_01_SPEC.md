# KODJO — V1.4 LOCAL — E2E-01

Test ID : `KODJO-V14-LOCAL-E2E-01`

Statut : **PÉRIMÈTRE GELÉ — aucun appel Claude autorisé par ce document**.

## 1. Objectif

Qualifier, avec un test court mais réel, la chaîne V1.4 LOCAL qui sera utilisée avant T01-S09.

Le test doit démontrer qu'un checkpoint GitHub autorisé peut conduire à une exécution Claude Code locale contrôlée, à une écriture bornée, à une publication GitHub, au réveil ChatGPT/Work, puis à une reprise de la même session Claude après revue.

Le test reste strictement hors code métier KODJO.

## 2. Chaîne testée

`checkpoint GitHub → contrôles déterministes → runner Windows self-hosted → Claude Code local → contrôle du diff → commit/push → pull_request:synchronize → ChatGPT/Work → checkpoint de reprise → runner local → Claude --resume → contrôle/publication → verdict final`

Aucun Claude Cloud. Aucun fallback Cloud.

## 3. Périmètre d'écriture

Branche : branche E2E dédiée créée depuis la branche d'orchestration V1.4.

Fichier sentinelle métier autorisé pour le test :

`.github/orchestration/e2e/KODJO_V14_LOCAL_E2E_SENTINEL.md`

Rapport autorisé conformément au protocole :

`.github/orchestration/reports/KODJO_V14_LOCAL_E2E_01_*.md`

Aucun fichier applicatif, test applicatif, configuration produit, documentation produit ou Figma ne peut être modifié.

Le workflow vérifie mécaniquement les chemins modifiés avant commit/push. Une modification hors périmètre bloque la publication et vaut échec du test ; le verdict de Claude ne peut pas contourner ce contrôle.

## 4. Budget Claude

Budget nominal fermé : **2 appels Claude maximum**.

- appel `1/2` : `BASE` ;
- appel `2/2` : `RESUME`.

Un échec de préflight avant invocation du modèle ne consomme pas le budget. Dès qu'une invocation Claude réelle commence, elle compte, même si elle échoue.

Aucun appel supplémentaire n'est autorisé pour sauver E2E-01. Si un troisième appel devient nécessaire, E2E-01 est clos avec le verdict correspondant et un nouveau test doit être explicitement décidé.

## 5. Préflight obligatoire — sans appel Claude

Avant BASE ou RESUME, vérifier au minimum :

- dépôt et branche attendus ;
- HEAD égal au HEAD autorisé pour la transition ;
- runner `KODJO-LOCAL-RUNNER` ;
- worktree propre avant l'écriture ;
- `claude.cmd` disponible ;
- configuration/authentification locale utilisable ;
- mode `LOCAL_WRITE` ;
- writer `CLAUDE_LOCAL` ;
- checkpoint attendu et non déjà consommé ;
- absence d'exécution concurrente du même test ;
- pour RESUME : session ID BASE persisté et transcript natif correspondant disponible.

Toute précondition invalide bloque avant Claude et produit `ORCHESTRATION_FAILURE`.

## 6. BASE — appel 1/2

BASE doit :

1. être lancé par le workflow V1.4 sur le runner local ;
2. faire lire à Claude la mission depuis l'état/checkpoint GitHub matérialisé pour le test ;
3. demander une modification déterministe du seul fichier sentinelle ;
4. demander à Claude de mémoriser une information de continuité non persistée en clair dans le checkpoint de reprise ;
5. récupérer et persister le `session_id` et les métriques observables ;
6. contrôler mécaniquement le diff ;
7. commit/push uniquement si le périmètre est respecté ;
8. publier le résultat/checkpoint durable ;
9. provoquer le transport `pull_request:synchronize` vers ChatGPT/Work.

## 7. Revue ChatGPT/Work

Après réveil automatique, ChatGPT vérifie les preuves BASE et publie un checkpoint de reprise borné.

Ce checkpoint ne réinjecte pas l'information mémorisée par Claude en BASE.

Aucune intervention utilisateur n'est requise entre BASE et RESUME sauf incident réellement non automatisable ou décision explicite de sécurité.

## 8. RESUME — appel 2/2

RESUME doit :

1. être un workflow run distinct ;
2. utiliser explicitement `--resume <session_id BASE>` ;
3. retrouver le transcript natif attendu ;
4. obtenir de Claude l'information mémorisée en BASE sans la réinjecter ;
5. effectuer la seconde modification déterministe du fichier sentinelle ;
6. retourner le même `session_id` ;
7. passer le même contrôle mécanique des chemins ;
8. commit/push le résultat autorisé ;
9. publier le checkpoint/verdict durable et provoquer le retour final vers Work.

`--fork-session` est interdit.

## 9. Robustesse minimale intégrée — sans multiplier les scénarios

Le test ne crée pas une batterie séparée de cas négatifs. Les protections suivantes sont contrôlées dans le chemin nominal :

- HEAD exact avant chaque appel ;
- checkpoint non déjà consommé / anti-doublon ;
- verrou de concurrence du test ;
- contrôle mécanique du périmètre d'écriture ;
- refus de tout fallback Cloud ;
- reprise de session vérifiée par session ID + transcript + information mémorisée ;
- si un résultat Claude valide existe mais qu'une publication échoue, la récupération/republification doit être tentée sans nouvel appel Claude lorsque les preuves locales sont suffisantes.

Un mécanisme n'est déclaré `DEMONSTRATED` que s'il a effectivement été exercé ou directement vérifié pendant E2E-01. Une simple présence dans le YAML ne vaut pas démonstration.

## 10. Critères de qualification

Pour autoriser ensuite la promotion du protocole vers T01-S09, les axes critiques suivants doivent être `DEMONSTRATED` :

- `PREFLIGHT_AND_HEAD_GUARD` ;
- `LOCAL_CLAUDE_EXECUTOR` ;
- `NO_CLOUD_FALLBACK` ;
- `WRITE_PATH_CONFINEMENT` ;
- `CHECKPOINT_AND_DUPLICATE_GUARD` ;
- `BASE_SESSION_PERSISTENCE` ;
- `GITHUB_TO_WORK_WAKEUP` ;
- `CHATGPT_REVIEW_HANDOFF` ;
- `SESSION_RESUME` ;
- `NO_CONTEXT_REINJECTION` ;
- `FINAL_GITHUB_PUBLICATION` ;
- `FINAL_E2E_CHAIN`.

`PUBLICATION_RECOVERY` n'est bloquant que si un incident de publication survient réellement pendant le test. En l'absence d'incident, il reste `NOT_EXERCISED` et ne provoque pas artificiellement une panne pour le tester.

Les statuts autorisés sont : `DEMONSTRATED`, `NOT_DEMONSTRATED`, `NOT_EXERCISED`, `NON_VERIFIABLE`.

Tout axe critique autre que `PUBLICATION_RECOVERY` qui n'est pas `DEMONSTRATED` interdit de qualifier E2E-01 comme prêt pour S09.

## 11. Verdict final

Verdicts possibles :

- `DEMONSTRATED` : tous les axes critiques requis sont démontrés ;
- `PARTIALLY_DEMONSTRATED` : chaîne exécutée mais au moins un axe critique n'est pas démontré ;
- `NOT_DEMONSTRATED` : chaîne E2E non achevée ou barrière essentielle en échec.

Aucun critère ne sera assoupli rétroactivement pour transformer un résultat incomplet en succès.

## 12. Ce que ce test ne fait volontairement pas

E2E-01 ne teste pas :

- une modification métier réelle ;
- tous les scénarios de panne imaginables ;
- la perte du PC ou du réseau ;
- une migration de machine ;
- la suppression volontaire des transcripts Claude ;
- la montée en charge ;
- des permissions destructrices ;
- Claude Cloud.

Ces sujets ne sont pas nécessaires pour autoriser le premier usage contrôlé de V1.4 LOCAL sur S09.

## 13. Gate avant lancement

La création de cette spécification ne lance rien.

Avant BASE :

1. le workflow V1.4 E2E doit être matérialisé et revu ;
2. Claude actuellement utilisé pour les corrections S01→S08 ne doit plus écrire dans le même worktree que le runner E2E ;
3. le worktree E2E doit être propre ;
4. le HEAD E2E exact doit être armé ;
5. l'autorisation explicite de lancement BASE doit être donnée.

Une fois E2E-01 démontré et le protocole promu, T01-S09 fera l'objet de son propre checkpoint, HEAD et autorisation métier fraîche.