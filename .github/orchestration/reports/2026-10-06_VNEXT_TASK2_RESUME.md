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

## Vérifications préalables acquises

Le correctif est publié sur `d1402d91c56b55b3ff8b8a925afd5f7bcd279f4c`, arbre Git vérifié identique au candidat local. Les neuf tests d’admission passent ; la validation du tree conserve les writers historiques gelés et les 420 sujets. Le précheck du dossier réel passe sans appel Claude et sans acquisition Figma fraîche. Le run unique de qualification du correctif est 37385093752 : contrats Linux et Windows 315/315 PASS, 0 FAIL, 0 SKIP ; contrats Windows 380,20 s, Linux 47,21 s. La suite historique et la couverture finales sont encore attendues à ce point.

Deuxième passe : diff du validateur et du workflow relu séparément ; tous les cinq jobs exacts restent requis. Les refus des mauvaises branches/événements/SHA et des jobs manquants, ignorés ou dupliqués ont été exercés. La section 23 de la spécification exige le workflow, le candidat exact et les cinq jobs, sans imposer un événement contradictoire. La portée documentée reste la fixture isolée.

## Admission de la nouvelle demande

La qualification 37385093752 du commit `d1402d91c56b55b3ff8b8a925afd5f7bcd279f4c` est désormais entièrement SUCCESS. Le validateur du protocole retourne VERIFIED sur les cinq jobs réels et le SHA exact. La fenêtre de publication est vérifiée ; aucun run VNext actif et aucun changement de HEAD ne sont observés. Nouvelle demande `86d8f6ce-e621-47b1-9e11-f9d67d32aa52`, génération 49, FIGMA_INITIAL, même campagne. L’ancienne demande consommée `1c9be701-2e24-43f7-bd24-2030d1d3c6c1` reste non rejouée. Le commit contrôleur ne change que demande, checkpoint, rapport et preuves ; il devra conserver exactement le code du candidat qualifié. Publication sans skip afin de déclencher l’entrée PR préparée. Aucun lancement de tâche 3, de revue de clôture ou de PRE-X.

## Résultat réel — run 37386304781

Le job 112020353480 a terminé en FAILURE le 6 octobre 2026 à 01 h 15 Paris. L’admission du candidat et du contrôleur est VERIFIED, relation EXACT_SAME_PROTOCOL_CODE. La nouvelle requête `86d8f6ce-e621-47b1-9e11-f9d67d32aa52` a été claimée ; aucune reprise de cet UUID n’est autorisée.

Le premier appel Claude, revue du plan INITIAL, s’est arrêté sur ETIMEDOUT après 600 056 ms (dix minutes), avec zéro octet sur stdout et stderr. Le dossier transmis représente 1 081 989 octets et 435 cibles. Ce volume est un signal à diagnostiquer, pas une cause démontrée. Aucune revue valide, aucun appel d’implémentation, aucune correction, aucune livraison applicative. Le checkout isolé est resté inchangé et son nettoyage a réussi. La qualification réussie précédente reste acquise ; le parcours réel de tâche 2 demeure inachevé.

L’archive GitHub 11379236965 a été téléchargée, contrôlée par SHA-256 (`9d7598deb2640b9e1907738ac02208406ebc1c285053a6b207682d15dfb5f0e8`) et testée pour son intégrité. Le bundle Git et les deux snapshots de fichiers ont été comparés à leurs empreintes ; les preuves, réponses vides et états sont conservés sous `task2/resume-20261006/runtime-37386304781.zip` et `runtime-result.json`. Les archives historiques Linux/Windows ont aussi été conservées après vérification des digests.

Au contrôle suivant le résultat, HEAD local et distant `6ec750620a690b777884d255200ca43bd2a3ae43`. Seule la CI héritée 37386305866 est encore active sur la branche ; l’ancienne file V2 34748621746 reste queued et intacte. Aucune relance ni modification du code n’a été réalisée pour cette collecte. La publication de ce bilan attend une fenêtre sans phase active ; commit documentaire local uniquement. Le hash du commit est fourni dans le bilan de conversation et se retrouve par `git log -1 --format=%H -- .github/orchestration/reports/2026-10-06_VNEXT_TASK2_RESUME.md`.

Deuxième passe de résultat : statut terminal, qualification-admission, diagnostic de processus et archive confrontés ; absence de reçus d’implémentation et de correction confirmée par la liste des membres et la phase d’arrêt. Cause de l’absence de réponse NON VÉRIFIABLE. Prochaine action utile : diagnostic ciblé de l’appel de revue (dossier, invocation et environnement Claude), sans augmenter mécaniquement le délai ni rejouer la demande consommée. Aucun test sur appareil réel n’a été effectué.
