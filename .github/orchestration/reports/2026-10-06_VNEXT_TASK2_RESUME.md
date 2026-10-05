# VNext — reprise de la tâche 2

## État courant

Reprise autorisée le 6 octobre 2026 à 00 h 46 Paris, sur la PR #269 et la branche `protocol/vnext-proof-stability-20260930`, HEAD de départ `3ad6426f4ffec579247da4062950091d4e5497ea`. Le dépôt est propre avant intervention et aucun run VNext actif ne précède cette reprise. L’ancienne file V2 34748621746 est laissée intacte.

La qualification 37380874773 est réellement réussie : cinq jobs requis SUCCESS, 314/314 contrats VNext Linux et Windows, régressions et couverture réussies. Elle s’est achevée à 22:22:20 UTC le 5 octobre. Le délai de démarrage du navigateur est 60 secondes ; la session Linux expérimentale a été retirée. La cause interne de la lenteur n’est pas démontrée.

## Défaut d’admission et correction minimale

Le validateur de preuve attend encore `pull_request`, alors que cette qualification dédiée a utilisé `create`. Ce défaut de raccordement est déterministe et intervient avant claim ou appel Claude. La correction reconnaît les événements `create` des branches `qualification/vnext-*` ; dépôt, workflow, SHA exact, tentative et les cinq jobs uniques, terminés et réussis restent obligatoires. Les autres événements et branches sont refusés. Un test négatif couvre ces refus et les jobs absents, ignorés, dupliqués ou attachés à un autre SHA.

Le workflow de qualification existant cible une seule nouvelle branche dédiée. Aucun code applicatif, V2, PRE-2, PRE-3, tâche 3 ou revue de clôture n’est modifié. Les contrôles de rendu réels restent requis. Une nouvelle qualification du contrôleur corrigé est nécessaire avant le parcours réel ; les résultats précédents sont conservés et ne sont pas attribués aux nouveaux octets.

## Preuves et suite autorisée

Références : run 37380874773, checkpoint `campaign-state.json`, test `tests/kodjo/vnext-transport-security.pilot.js`. L’UUID précédent est consommé et ne sera pas rejoué. Une nouvelle demande sera préparée après qualification du correctif, avec commit exact et run vérifiés. Le parcours reste une fixture isolée avec capture Figma figée dans Git ; il ne certifie pas l’application native ni une acquisition Figma fraîche.

Bilan, SHA final, état Git et résultats réels seront actualisés à la prochaine barrière. Aucun test sur appareil réel n’est inclus dans cette reprise.
