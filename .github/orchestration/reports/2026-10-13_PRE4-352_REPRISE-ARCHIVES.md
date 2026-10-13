# État final de la correction — intégrée, preuve réelle en attente

PR[#355](https://github.com/MyUncried/Application-Routine/pull/355) fusionnée au commit13d03c15ba96cca610f41f7db37f87494872e86c après vérification de la tête4cd3f0144154452eb41704408e3c79b64c9c894c et des deux CI SUCCESS : [38457357967](https://github.com/MyUncried/Application-Routine/actions/runs/38457357967) et [38457357961](https://github.com/MyUncried/Application-Routine/actions/runs/38457357961). Linux1502tests/1500PASS/0FAIL/2SKIP ; runner Windows local1502tests/1498PASS/0FAIL/4SKIP. Les nouveaux tests de distinction externe et de verrou sont exécutés et réussis dans les deux suites. Contrôles VNext et équivalence historique Linux/Windows réussis, précontrôle Windows/chemin de queue réussi. Audit indépendant et test jetable SKIPPED ; aucune nouvelle campagne lancée.74tests ciblés locaux PASS.

La modification est active sur main : applications Claude externes permises, exécution gérée ACTIVE/état AMBIGUOUS/verrou occupé/tentative antérieure inconnue toujours refusés. Admission de branche de préparation et vérification récursive des archives intégrées. Aucun fichier de plan/application modifié. Rapport et documentation publiés avec le code et mis à jour ici.

Limite de clôture : ces résultats établissent la correction technique ; ils ne prouvent pas encore l'appel réel de la revue PRE-4. Contrôle de reprise5fc307dd prêt pour publication unique après ce registre, lié au run38444371283 sans invocation et à la demande originaledece7bcf. Plan0ef1ec59 et chaîne540b058a inchangés. Il reste à constater le parcours réel et à récupérer son reçu ; aucun verdict ni approbation produit annoncé. Aucune action technique propriétaire requise, pas de fermeture des applications ni de redémarrage.

L'incident historique R-CI-HOST-01 du correctif#353 reste distinct : la CI actuelle est verte, mais sa cause historique n'est pas attribuée ou effacée par ce succès. Ce registre ne déclare pas une nouvelle clôture globale de VNext.

---

## Rapport de conception et historique

# PRE-4 #352 — reprise et restauration de la distinction Claude

## Objet et point de départ

Hermann confirme le 13/10 à 21:19:32 Paris avoir fermé VS Code et Claude. Reprise du plan exact `0ef1ec593343809a41b243850df12e1e91337d49`, demande unique `dece7bcf9174c22f7eda2abf07c725566cc77217b55cb2e279e0ed6f7c1a706d`. Baseline du correctif : main `1c58da56f873ff4746468227319e9d3a7a34477f`, publication du diagnostic suivant `f22453ce646a543473d353bd3d18fbc6edf8077e`. Aucun plan, code produit, règle de concurrence ou appel Claude modifié.

Complément expressément demandé par Hermann le13/10 à21:40:13Paris : « Remets cette distinction dans le protocole. » La condition qui traite toute application externe comme bloquante est supprimée ; les protections d'exécution KODJO et de reprise restent présentes. Le complément est publié dans la même PR#355, parent e5555213a35c276a354894d4fd5a289f21352f62. Il remplace la demande précédente de fermeture des applications ; aucune nouvelle fermeture ni aucun redémarrage n'est demandé.

## Disponibilité réelle

Le run de diagnostic en lecture seule [38454192886](https://github.com/MyUncried/Application-Routine/actions/runs/38454192886), job115492552143, a réussi. À19:22:04UTC, le détecteur original et la lecture élargie concordent : aucun CLI géré, mais8processus Claude externes. Après redémarrage, [38455716702](https://github.com/MyUncried/Application-Routine/actions/runs/38455716702), job115497788625, à19:33:47UTC, confirme8nouveaux processus externes, sans CLI géré. Leur origine exacte n'est pas démontrée par les champs publiés (OTHER). Aucune terminaison de processus, aucun appel modèle. Ce compteur n'est plus bloquant dans le correctif ; ACTIVE/AMBIGUOUS pour le CLI géré et verrou occupé restent bloquants.

## Historique de la distinction, avant correction

Le commit a55eb528c15fc3241d6b6adbd452f01c72cb8435 du11/09 avait restreint le scanner Windows au CLI géré et conservé les autres applications dans external_claude_count, avec state:NONE en l'absence du CLI géré. L'ajout du relais de plan 88a833684725d6a0d732143786f4fb0545b583da du09/10 a rendu ce compteur bloquant ; le relais commun50415ae346647f59eb0db8230b16a6ccefbfaa8f a recopié cette condition. Attribution démontrée par les diffs Git. Première preuve réelle conservée ici : échec38444371283 puis deux diagnostics concordants. La distinction dans le scanner n'a pas disparu : c'est son consommateur qui l'annulait. Les tests précédents couvraient ACTIVE et NONE sans compteur positif ; ils n'éprouvaient pas une application externe ouverte.

Correction : suppression de external_claude_count>0 dans le relais partagé. Le scanner et execution-lock.js restent inchangés, donc aucun changement aux tranches V2. Trois opérations et entrée compatible passent par cette règle unique. Tests avec8ou15processus externes : un seul appel, verrou acquis/libéré, reçu récupérable. ACTIVE, AMBIGUOUS et verrou occupé : zéro appel et zéro intent nouveau. Les consommateurs des autres scripts inspectent déjà uniquement state ; ils ne nécessitent pas de modification. Le lecteur de reprise admet la version exacte du publisher courant de confiance en plus de l'ancien publisher intégré afin de conserver la reprise des anciens échecs sans déclaration d'invocation fictive.

## Défaut de reprise démontré avant relance

La reprise automatique échouerait même après disparition des processus : la fonction recordedFailureBeforeInvocation refuse le blob de son propre lecteur intégré par #354 (`51860b1feace52b45cf89d5aeef10a0288f8519f`). Elle n'accepte que son ancien lecteur `c5ff10f7017fcb0fd8c0aa4cc38524bc17adfeb1`. De plus, elle exige exactement checkpoint.json et failure.json, alors que la reprise archive aussi les preuves précédentes qu'elle a vérifiées.

Introduction de ces deux restrictions : correctif #354, candidat `0f70ebe1dd0039d37f425fc1eef34ba5b2837bf2`, fusion `2e011e5350e45332295dea44e00e0a03146eef78`. Détection présente par lecture et test avant relance ; le run38444371283 n'avait pas encore rencontré ce défaut puisque les tentatives antérieures étaient compatibles. Son échec primaire reste CLAUDE_EXECUTION_UNAVAILABLE, pas ce défaut nouvellement démontré. Aucun succès antérieur de reprise depuis une archive imbriquée de #354 n'est disponible.

Archive réelle11838746835 du run38444371283 : ZIP SHA-256 vérifié `41134a4793a4cded696744ad64d78cdf7be23a0d15250958b8c272a4d7316895`. Sept fichiers : trois racine, trois preuves du run38407026133 et le reçu historique38393888751. model_invoked:false. Le validateur corrigé vérifie le manifeste et les contrats de cette archive réelle, sans modèle.

## Correction bornée

Le lecteur reconnaît ses deux versions précédemment intégrées et sa propre version exacte issue du checkout de protocole de confiance. Le publisher de preuves accepte uniquement son ancien blob intégré ou la version exacte issue du checkout de protocole de confiance ; le workflow reste épinglé à son blob connu. Aucun code fourni par la branche de demande n'est ajouté à la confiance.

Les sous-archives pre-invocation sont vérifiées récursivement : manifeste scellé, demande/source/opération exactes, numéro de run du chemin, checkpoint et failure concordants, model_invoked:false. Les reçus de la garde historique conservent leurs deux blobs historiques, leur raison et leurs liens à la demande/chaîne. Des preuves répétées dans des niveaux distincts sont acceptées ; une boucle d'identités dans les ancêtres est refusée. Réponses, résultats, intents, fichiers inconnus et preuves modifiées restent refusés. Cette correction ne transforme pas un appel engagé en appel absent.

## Contrôles

- 38 tests ciblés relais/compatibilité/sécurité des écritures : PASS, zéro échec.
- Le test de régression « successive pre-model recovery » échoue sur le lecteur de main avant correction, et passe après correction.
- Archive GitHub réelle : vérification récursive PASS ; aucun appel Claude simulé n'est présenté comme une revue réelle.
- Syntaxe Node et git diff --check PASS.
- 20 contrôles voisins de transport/publication : PASS, zéro échec. Total local58tests PASS.
- Après restauration de la distinction :74tests relais/compatibilité/verrou/sécurité des écritures/transport/publication PASS, zéro échec. Le nouveau test « external Claude applications do not block » échoue sur le publisher avant correction (EXECUTION_UNAVAILABLE). La distinction du scanner Windows et les tests d'identité/propriété du verrou existants passent. Ce sont des tests techniques avec adaptateurs simulés, pas une preuve d'appel Claude réel. Syntaxe et diff vérifiés avant publication ; CI de la nouvelle tête à suivre avant fusion.

## Livraison et limites

Fichiers : scripts/kodjo/agent-relay.js, scripts/kodjo/lib/vnext-agent-relay.js, tests/kodjo/vnext-agent-relay.pilot.js, tests/kodjo/vnext-chatgpt-plan-review.pilot.js, ce rapport et la documentation du relais. Publication sur la branche existante de correction et PR#355, sans fusion anticipée. Le commit de publication exact et les runs de CI sont liés par la PR. Pas de certification nouvelle, pas de préparation PRE-4 recommencée, pas de verdict de revue, pas de développement autorisé. L'état Git de la branche publiée doit être vérifié par le pilote.

Prochaine action pilote : intégrer le correctif après contrôles puis publier uniquement le contrôle scellé de reprise lié au dernier échec, et suivre la même demande. Aucune action propriétaire sur ses applications n'est nécessaire. Le prochain jalon de décision produit reste l'approbation du plan exact après convergence de sa revue indépendante.
