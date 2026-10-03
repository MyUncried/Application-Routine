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

## Admission INITIAL demandée

Le HEAD exact `08cb8b936f91a19b33aa47b5a00b1f8dfd73ddb1` est qualifié : runs 37109636892 (pilotes), 37109636938 (contrats/équivalence) et 37109636896 (drivers) SUCCESS. Les vrais logs confirment 956 tests pilotes (Linux 955 PASS / 1 SKIP, Windows 952 PASS / 4 SKIP, 0 FAIL) et 202/202 par OS pour contrats et drivers. La récupération historique conserve sa réserve NON_CERTIFIED.

Le commentaire `5967139304` porte maintenant le HEAD et le message ApprovalTarget exacts, hash `8ffcc4f74def32ea445410197a0a50a27a1029c9a0821958df0fbba1d7ea2509`. La vraie réaction +1 `431397815` de MyUncried, créée après cette édition, a été lue et vérifiée avec `vnext-github-approval.verifyObservation`. Autorisation : délégation déjà accordée par l'utilisateur pour le test technique jetable ; **human_review_performed=false**. L'observation complète est conservée dans `initial/owner-approval-evidence.json`.

Stage EXECUTE_INITIAL, génération 29. Le workflow contrôleur demande uniquement l'exécution du HEAD approuvé et qualifié `08cb8b93` ; aucun code runtime nouveau n'est substitué par le commit contrôleur. UUID neuf `7c4b54fd-b0db-45bd-abf3-73c5a3761840`. L'admission fraîche et la consommation atomique restent obligatoires dans le superviseur. Aucun succès runtime n'est déclaré à ce lancement.

## Correction de la référence de qualification avant reprise INITIAL

L'exécution [37112240984](https://github.com/MyUncried/Application-Routine/actions/runs/37112240984), job `111172374634`, a été refusée avant credentials, consommation et Claude : `VNEXT_QUALIFICATION_RUN_REQUIRED`. Le contrôleur omettait `qualification_run_id`, alors que le run réel `37109636938` qualifiait bien le HEAD approuvé `08cb8b93`. L'upload sans fichier est une conséquence du refus précoce. Aucun statut INITIAL_PASS n'a été produit.

Correction minimale de la demande : `qualification_run_id=37109636938`, génération 30. `verifyExecutionQualifications` a été exercé avec les observations API réelles : approved VERIFIED, controller EXACT_SAME_PROTOCOL_CODE. Aucun code runtime, workflow ni gate n'est changé. L'UUID `7c4b54fd-b0db-45bd-abf3-73c5a3761840` n'est pas consommé (matching-ref GitHub vide, revérifié avant publication) ; le même gate exact et sa réaction owner sont encore observés. La reprise ne rejoue donc aucune demande consommée.

Les runs du contrôleur précédent [37112240971](https://github.com/MyUncried/Application-Routine/actions/runs/37112240971) et [37112241034](https://github.com/MyUncried/Application-Routine/actions/runs/37112241034) sont désormais SUCCESS. Le HEAD a été tenu stable jusqu'à la fin du preflight Windows. Les quatre jobs de qualification/équivalence sont SUCCESS. La récupération legacy conserve sa réserve.

Trace du diagnostic : [commentaire 5967836973](https://github.com/MyUncried/Application-Routine/pull/269#issuecomment-5967836973). Le commit contenant cette mise à jour demande une nouvelle tentative d'INITIAL sur le même HEAD runtime réellement qualifié, sans nouvelle revue Claude du plan ni élargissement du périmètre. L'admission réelle et la consommation atomique restent obligatoires. Aucun succès runtime n'est déclaré au lancement.

## INITIAL réel terminé — séquence consolidée

Le 3 octobre 2026, les trois runs du contrôleur `3d1ca0a19925005440c8701eda1ae8ccfb1295a0` sont terminés avec SUCCESS : [exécution INITIAL 37115247745](https://github.com/MyUncried/Application-Routine/actions/runs/37115247745), [pilotes 37115247753](https://github.com/MyUncried/Application-Routine/actions/runs/37115247753), [qualification et équivalence 37115247774](https://github.com/MyUncried/Application-Routine/actions/runs/37115247774).

Le vrai job `111180841735` a exécuté Claude, session `23570c25-875b-4158-8d87-5f075cb8056a`, sur le HEAD approuvé `08cb8b936f91a19b33aa47b5a00b1f8dfd73ddb1`. Son résultat est IMPLEMENTED_AND_VERIFIED / INITIAL_PASS : valeur observée 2, changements exactement core.js + core.test.js, keep.js conservé octet pour octet, aucun changement hors périmètre ni dérive après checks. Jest : 1257/1257 PASS, 64 suites PASS ; TypeScript et lint : PASS. Le superviseur atteste le cleanup jetable. Les sondes négatives refusent réellement avant Claude l'autorité absente et la preuve de revue invalide.

Artefact réel `11270759916`, SHA256 téléchargé et vérifié `53b4be48f0f93b3f62fa4ed742b7cf93b17faf12ee5c48c7723b17a5877cbe03`. Les résultats bruts JSON, la preuve fonctionnelle, la consommation et le patch sont archivés sous `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/628b3349-88b4-4bf1-be6b-50bc09e7d245/initial/`. Leur manifeste SHA256 est dans `execution-evidence.json`. Le tag de consommation `5333643773e9310d2dda25d68f7994a26088d5d0` consomme définitivement UUID `7c4b54fd-b0db-45bd-abf3-73c5a3761840` : **ne jamais le rejouer**. Aucune revue humaine n'est revendiquée ; l'autorisation reste la délégation explicite pour ce test technique jetable.

Ces preuves couvrent uniquement la première tranche D10/D13/D14. Elles ne certifient pas les corrections restantes, ni une REVISION de cette tranche. L'échec de référence de qualification et la première tentative Windows restent conservés dans ce rapport ; le succès actuel ne les efface pas. La réserve legacy NON_CERTIFIED demeure.

À la demande de l'utilisateur, la séquence antérieure est remplacée : **aucune REVISION intermédiaire**. Toutes les corrections v8 restantes seront intégrées avec tests locaux ciblés avant une qualification Linux/Windows du candidat consolidé, puis un nouveau cycle INITIAL/REVISION avec nouvelles identités et vrais gates. Le contrôleur est replacé en QUALIFY_ONLY, génération 31, sans ancres d'exécution anciennes. Ce checkpoint est publié avec [skip ci] : il archive des résultats déjà observés, sans lancer de nouveaux tests ou Claude.

Aucune activation, FINAL, fusion ou publication applicative ; PRE-1 reste hors périmètre. Sa dérogation SQLite NOT_EXECUTED n'est transformée en aucun PASS. Commit final : commit documentaire qui contient cette section, fils non forcé de `3d1ca0a19925005440c8701eda1ae8ccfb1295a0` ; état Git attendu propre après synchronisation de cet objet exact. Aucun nouveau test n'est requis pour la seule copie des preuves générées ; leurs empreintes et leurs liens ont été vérifiés.
