# VNext — nouveau cycle réel après le premier lot v8

L'utilisateur a demandé de lancer le cycle jetable INITIAL/REVISION du candidat courant. Ce cycle couvre les corrections D10/D13/D14 publiées en `022b78768a55277239c545e1ef8235d0a789874c`, pas les autres corrections v8 restant à mettre en œuvre. Aucun merge, FINAL, cutover ou changement PRE-1 n'est autorisé.

## Qualification réellement observée

Les trois runs du HEAD `022b7876` sont SUCCESS. Leurs vrais jobs/logs ont été lus :

- Pilotes [37076759716](https://github.com/MyUncried/Application-Routine/actions/runs/37076759716) : Linux 956 tests / 955 PASS / 0 FAIL / 1 SKIP ; Windows 956 / 952 / 0 / 4. La récupération historique reste NON_CERTIFIED ; le succès global ne supprime pas cette réserve.
- Qualification [37076759717](https://github.com/MyUncried/Application-Routine/actions/runs/37076759717) : 202/202 PASS sur chacun des jobs Linux et Windows, équivalence historique SUCCESS sur les deux OS.
- Drivers [37076759714](https://github.com/MyUncried/Application-Routine/actions/runs/37076759714) : 202/202 PASS par OS. Préparation et exécution Claude étaient SKIPPED.

## Nouveau lancement

Campagne neuve `628b3349-88b4-4bf1-be6b-50bc09e7d245`, génération préparation 12, génération demande 26, stage **PREPARE_INITIAL**. Il demande une vraie revue indépendante Claude du plan INITIAL. Le commit contenant ce rapport est le nouveau parent de préparation publié par Git blobs/tree/commit/ref non forcé après validation du candidat. Sa qualification est distincte de celle de `022b7876`.

À cette publication, aucune nouvelle revue, approbation ou exécution n'est déclarée acquise. Les preuves antérieures et leurs demandes consommées sont conservées ; aucune n'est rejouée. Les nouveaux UUID d'exécution seront créés uniquement après la préparation réelle, avec un nouveau message exact, gate GitHub réel et délégation explicite pour le test technique jetable (sans prétendre à une revue humaine).

## Préparation INITIAL observée le 3 octobre

Le run [37081294314](https://github.com/MyUncried/Application-Routine/actions/runs/37081294314), job `111085573177`, a réellement produit `PREPARED_FOR_PUBLICATION` avec APPROVE, 0 finding bloquant et 1 suggestion. Session Claude : `11f9ef31-2af7-4b86-8e52-07d2cf03d5bc`. La suggestion porte sur la modélisation explicite d'une preuve de préservation dans le plan ; le superviseur vérifie déjà réellement les octets de keep.js. Elle est conservée sans correction opportuniste ni changement du verdict.

Artefact `11260087927`, SHA256 téléchargé et vérifié : `2e9223973ce264f13044f86ecb400e373dff9fc71d72f169e86b5e828f009a54`. Les six fichiers de `publication.json` sont matérialisés à l'identique ; la vraie receipt et le status sont conservés dans le dossier INITIAL. La chaîne préparée et sa receipt sont revalidées localement sans appel Claude supplémentaire.

Le HEAD de préparation `070722462d9ac6edb797072e9c74c4817dee0601` a aussi été qualifié : pilotes 956 tests, Linux 955 PASS / 1 SKIP et Windows 952 PASS / 4 SKIP, aucun FAIL ; contrats et drivers 202/202 par OS, équivalences historiques SUCCESS. La réserve de récupération legacy NON_CERTIFIED demeure.

La publication du dossier passe le stage à QUALIFY_ONLY (génération 27). Elle exige une nouvelle qualification du HEAD matérialisé ; ni l'approbation utilisateur ni l'exécution INITIAL ne sont encore acquises. Aucun ancien gate ou UUID n'est réutilisé.

## Qualification du dossier et matérialisation du transport neuf

Le run pilote du HEAD `e930b3ec19f0ba040c735e077df99487cbd160a0`, [37105248313](https://github.com/MyUncried/Application-Routine/actions/runs/37105248313), a échoué en tentative 1 au job Windows `111152917449` : métadonnées de l'étape preflight incomplètes, journal 404 BlobNotFound. Cause indéterminée, sans diagnostic CPU/mémoire ni échec de test inféré. La trace est conservée [dans la PR](https://github.com/MyUncried/Application-Routine/pull/269#issuecomment-5966927621).

Une seule relance du job a été demandée. La tentative 2 est SUCCESS, job Windows `111159512744` : 956 tests / 952 PASS / 0 FAIL / 4 SKIP, preflight terminé avec artefact `11269186470` (digest observé GitHub `sha256:7b026d64414f0468fa7104e91871d32975073a71cd646216e0244798047a92e4`). Aucun correctif de code entre les tentatives. Ce succès ne démontre ni la cause du premier échec ni son élimination universelle. Qualification/équivalence [37105248422](https://github.com/MyUncried/Application-Routine/actions/runs/37105248422) et drivers [37105248312](https://github.com/MyUncried/Application-Routine/actions/runs/37105248312) SUCCESS. La récupération legacy reste NON_CERTIFIED.

Avant l'admission, la vérification a détecté que `publication.json` ne contient pas le transport d'exécution : `initial/transport.json` était encore celui de la campagne précédente. **Aucun rejeu n'a été tenté.** Le transport neuf reprend exactement les cinq champs du préparateur réel et ajoute UUID neuf `7c4b54fd-b0db-45bd-abf3-73c5a3761840`, date réelle et gate réservé `issue_comment:5967139304`. Le bootstrap est lié à `9a82a9056983594fe559bf1410999fa7e751ff414d6ebaf6c443050ea92a722f`.

Le commentaire réservé n'est pas une approbation. Après qualification du nouveau candidat exact, il sera remplacé par le HEAD et le message ApprovalTarget exacts ; seule une réaction réellement observée de l'owner permettra l'admission. La délégation utilisateur pour le test technique jetable est conservée, sans prétendre à une revue humaine. Pas de faux commentaire `issue_comment:1`, pas d'ancien target/gate ni d'UUID consommé.

Cette publication reste QUALIFY_ONLY (génération 28). Elle complète la matérialisation du transport, sans changer le protocole ni demander une nouvelle revue Claude du même plan. Aucun INITIAL/REVISION réel acquis pour la nouvelle campagne.

## Séquence à poursuivre

1. Lire la vraie revue INITIAL, son verdict/session, ses artefacts et leur hash ; conserver tout échec éventuel. Materialiser uniquement la publication générée par le préparateur.
2. Qualifier le HEAD exact matérialisé Linux/Windows, créer le nouveau gate et lancer EXECUTE_INITIAL avec les ancres exactes. Vérifier valeur 2, changements core.js/core.test.js seulement, keep.js intact, checks réels et cleanup.
3. Préparer REVISION par vraie revue du plan négatif, une correction causale et vraie seconde revue : REVISE → APPROVE, outcome RESOLVED borné à 1. Archiver les preuves réelles.
4. Qualifier le dossier REVISION exact, utiliser un UUID et un gate neufs puis EXECUTE_REVISION. Persister les preuves avant toute déclaration PASS.

Ne pas modifier le HEAD pendant le preflight Windows. Aucun succès futur n'est inféré de ce rapport. Le reste du plan v8 demeure à traiter après ce cycle demandé ; les contrôles non exécutés, notamment SQLite PRE-1, ne deviennent jamais PASS.
