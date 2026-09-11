# KODJO Protocol V2 — spécification normative 0.6.17

Cette version complète et supersède `KODJO_PROTOCOL_V2_SPEC_0.6.16.md` uniquement pour les invariants ci-dessous. Toutes les autres règles de 0.6.16 restent applicables.

## Verrou Claude

Le verrou porte un schéma, un jeton aléatoire, le PID propriétaire, sa date de démarrage observée, `github_run_id`, `github_run_attempt`, `run_id`, `request_id`, `session_id` et l'heure d'acquisition. La libération compare le jeton avant suppression.

Un verrou existant n'est remplacé que si l'absence du propriétaire est démontrée : PID absent, ou même PID avec une autre date de démarrage. Un propriétaire vivant bloque. Une lecture impossible, une donnée incomplète ou une contradiction bloque conservatoirement. Le protocole ne tue jamais un processus.

## Diagnostic du run courant

Le répertoire `runs/github-<github_run_id>-<github_run_attempt>` et son `run-context.json` sont créés avant l'exécution. Le résolveur utilise exclusivement ces identifiants et vérifie leur concordance ; toute sélection par récence ou glob est interdite.

Un échec avant Claude porte `claude_invoked: false`, le diagnostic, `request_id`, `session_id`, `source_head` et `limits_effective`. `recovery_package` reste `null` tant qu'aucun paquet du run courant n'existe.

## `request_id`

`request_id` est un UUID obligatoire et non nullable depuis la demande immuable jusqu'à la projection locale, l'invocation, `result.json`, le manifeste de reprise et le diagnostic. L'ID historique du paquet source ne remplace pas le nouvel ID d'une demande de reprise.

## Lectures Git

Claude utilise un wrapper figé, exécuté avec `shell:false`, autorisant positivement seulement `status`, `diff`, `log`, `show`, `rev-parse` et `ls-files`. Les arguments et chemins sont admis. Les métacaractères, redirections, sauts de ligne, options de réadressage/configuration et toute sous-commande mutante sont refusés. `add`, `commit`, `push`, `reset`, `checkout`, `switch`, création/suppression de branche, écriture de configuration et modification de référence restent impossibles.

## Budget

`max_ai_calls` vaut exactement 1. `max_turns` vaut au plus 40 : 40 est accepté et transmis, 41 est refusé avant appel. `limits_effective` est inscrit dans l'invocation, le résultat et tout diagnostic précoce.

## Qualification

T-053 à T-057 sont obligatoires sur Ubuntu et sur le runner Windows réel avec Windows PowerShell 5.1. La qualification n'invoque pas Claude et ne crée aucune demande Lean Queue.

