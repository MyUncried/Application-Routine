# PRE-4 #352 — reprise après fermeture des interfaces Claude

## Objet et point de départ

Hermann confirme le 13/10 à 21:19:32 Paris avoir fermé VS Code et Claude. Reprise du plan exact `0ef1ec593343809a41b243850df12e1e91337d49`, demande unique `dece7bcf9174c22f7eda2abf07c725566cc77217b55cb2e279e0ed6f7c1a706d`. Baseline du correctif : main `1c58da56f873ff4746468227319e9d3a7a34477f`, publication du diagnostic suivant `f22453ce646a543473d353bd3d18fbc6edf8077e`. Aucun plan, code produit, règle de concurrence ou appel Claude modifié.

## Disponibilité réelle

Le run de diagnostic en lecture seule [38454192886](https://github.com/MyUncried/Application-Routine/actions/runs/38454192886), job115492552143, a réussi. À 19:22:04 UTC, le détecteur original et la lecture élargie concordent : aucun CLI géré, mais8processus Claude externes. Les7processus extension VS Code du diagnostic précédent ont disparu. Les8processus restants sont classés OTHER : leur origine exacte n'est pas démontrée par les champs publiés. Aucune terminaison de processus, aucun appel modèle. La règle existante interdit toujours le lancement lorsque external_claude_count>0. Le propriétaire doit quitter les interfaces réellement, éventuellement depuis la zone de notification ; fermer la fenêtre peut laisser un processus présent. Une observation ultérieure est nécessaire avant invocation.

## Défaut de reprise démontré avant relance

La reprise automatique échouerait même après disparition des processus : la fonction recordedFailureBeforeInvocation refuse le blob de son propre lecteur intégré par #354 (`51860b1feace52b45cf89d5aeef10a0288f8519f`). Elle n'accepte que son ancien lecteur `c5ff10f7017fcb0fd8c0aa4cc38524bc17adfeb1`. De plus, elle exige exactement checkpoint.json et failure.json, alors que la reprise archive aussi les preuves précédentes qu'elle a vérifiées.

Introduction de ces deux restrictions : correctif #354, candidat `0f70ebe1dd0039d37f425fc1eef34ba5b2837bf2`, fusion `2e011e5350e45332295dea44e00e0a03146eef78`. Détection présente par lecture et test avant relance ; le run38444371283 n'avait pas encore rencontré ce défaut puisque les tentatives antérieures étaient compatibles. Son échec primaire reste CLAUDE_EXECUTION_UNAVAILABLE, pas ce défaut nouvellement démontré. Aucun succès antérieur de reprise depuis une archive imbriquée de #354 n'est disponible.

Archive réelle11838746835 du run38444371283 : ZIP SHA-256 vérifié `41134a4793a4cded696744ad64d78cdf7be23a0d15250958b8c272a4d7316895`. Sept fichiers : trois racine, trois preuves du run38407026133 et le reçu historique38393888751. model_invoked:false. Le validateur corrigé vérifie le manifeste et les contrats de cette archive réelle, sans modèle.

## Correction bornée

Le lecteur reconnaît ses deux versions précédemment intégrées et sa propre version exacte issue du checkout de protocole de confiance. Le publisher de preuves et le workflow restent épinglés à leurs blobs connus. Aucun code fourni par la branche de demande n'est ajouté à la confiance.

Les sous-archives pre-invocation sont vérifiées récursivement : manifeste scellé, demande/source/opération exactes, numéro de run du chemin, checkpoint et failure concordants, model_invoked:false. Les reçus de la garde historique conservent leurs deux blobs historiques, leur raison et leurs liens à la demande/chaîne. Des preuves répétées dans des niveaux distincts sont acceptées ; une boucle d'identités dans les ancêtres est refusée. Réponses, résultats, intents, fichiers inconnus et preuves modifiées restent refusés. Cette correction ne transforme pas un appel engagé en appel absent.

## Contrôles

- 38 tests ciblés relais/compatibilité/sécurité des écritures : PASS, zéro échec.
- Le test de régression « successive pre-model recovery » échoue sur le lecteur de main avant correction, et passe après correction.
- Archive GitHub réelle : vérification récursive PASS ; aucun appel Claude simulé n'est présenté comme une revue réelle.
- Syntaxe Node et git diff --check PASS.
- 20 contrôles voisins de transport/publication : PASS, zéro échec. Total local58tests PASS.

## Livraison et limites

Fichiers : scripts/kodjo/agent-relay.js, tests/kodjo/vnext-agent-relay.pilot.js, ce rapport et la documentation du relais. Publication sur une branche de correction et PR, sans fusion anticipée. Le commit de publication exact et les runs de CI sont liés par la PR. Pas de certification nouvelle, pas de préparation PRE-4 recommencée, pas de verdict de revue, pas de développement autorisé. L'état Git de la branche publiée doit être vérifié par le pilote.

Prochaine action propriétaire indispensable : faire disparaître les8processus Claude restants. Le pilote ne termine pas à distance des applications pouvant contenir du travail. Après disponibilité et intégration du correctif, publier uniquement le contrôle scellé de reprise lié au dernier échec, et suivre la même demande.
