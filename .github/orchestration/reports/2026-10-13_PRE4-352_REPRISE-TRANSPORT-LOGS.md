# PRE-4 #352 — reprise après refus des caractères de contrôle des journaux

Reprise autorisée par Hermann le 13 octobre 2026 : « Le dernier run est en échec, et l'autre conversation est toujours bloquée. Reprend la tâche de ton côté ».

## Diagnostic vérifié

Run 38407026133, tentative 1, job 115329204049 : FAILURE. L'admission de la branche de préparation passe. La lecture d'un journal historique par `gh api` refuse les séquences d'échappement terminal : `VNEXT_LIVE_PROCESS_FAILED: gh: the response contains terminal escape sequences`.

Archive GitHub 11820627278, SHA-256 `a1d2823e5158f7dd2e99ce9812f9b2ec4090374327287ab857afc201f367b936`. ZIP, manifeste, empreintes des deux fichiers et contrat de failure vérifiés. `model_invoked: false` dans failure et checkpoint. Aucun reçu de revue. À la reprise, aucun run actif PRE-4 ; l'ancienne queue V2 de septembre est étrangère à cette opération.

## Correction

- Lecture explicite des journaux bruts avec `--allow-escape-sequences`, sans suppression ou rendu des caractères : conservation des octets de preuve.
- Reconnaissance d'un échec avant invocation uniquement depuis un run achevé du code et workflow intégrés épinglés par leurs blobs, avec archive GitHub de ce run, manifeste vérifié et bindings exacts. Archive expirée, altérée, résultat, intention ou réponse présente, invocation engagée ou état inconnu restent bloquants.
- Un contrôle de reprise peut référencer un précédent contrôle de reprise, avec résolution vers la demande originale, antériorité Git et contrôle de l'identité. Aucun nouveau plan ni nouvelle demande de revue.

## Vérifications

17 tests du relais PASS ; 14 tests voisins (revue de plan et supervision) PASS. Syntaxe Node, `git diff --check` et scanner des capacités distantes PASS (`NO_UNDECLARED_REMOTE_WRITE_CAPABILITY`, 247 fichiers). Les tests couvrent le refus d'une preuve modifiée, les appels engagés, les bindings, le code inconnu, les preuves contradictoires et les reprises successives.

Ce sont des contrôles du correctif, pas une nouvelle certification VNext ni une revue indépendante du plan produit. La réserve CI Windows hébergé R-CI-HOST-01 précédemment documentée demeure distincte.

## Point de reprise

Demande `dece7bcf9174c22f7eda2abf07c725566cc77217b55cb2e279e0ed6f7c1a706d`, commit de demande `7d832c4c0dbe01b7bc07b63fcc34dc7de29de3fb`, source `0ef1ec593343809a41b243850df12e1e91337d49`, opération `plan-review`. Chaîne `540b058a1f20df22eaa500673473c45751cc1a44517e61a2eb72d5d310d31b03` inchangée. Publier un contrôle de reprise lié au run 38407026133 après intégration, puis suivre et consommer le résultat exact. Aucun développement sans approbation du plan revu par Hermann.
