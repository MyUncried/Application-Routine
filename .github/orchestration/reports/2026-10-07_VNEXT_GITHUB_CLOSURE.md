# VNext — raccordement de clôture GitHub

Mission `VNEXT_GITHUB_CLOSURE`, campagne existante `628b3349-88b4-4bf1-be6b-50bc09e7d245`, tranche `VNEXT-12-QUALIF`, protocole PR #269. Départ local `f3dd519b98d0ee5e2799bf37a046523979cea029`, publié `9e6214f21e4b7f3540cc83babcd4a6c2c5e2296a`. Instruction utilisateur du 7 octobre 2026, 10:29 Paris : concevoir les étapes 1 à 3, déterminer les écritures et finaliser la clôture. Instruction à 10:25 : tests jetables et qualification réadmis. Ces instructions remplacent l'interdiction historique de ces tests ; aucune autorisation de rendu, cutover ou fusion produit n'en découle.

## Diagnostic et conception avant implémentation

Le bilan des trois incidents reste conservé. #37557921183 (82 PASS) et #37559490452 (26 PASS) sont terminés ; leurs nombres se recouvrent. La demande génération 74 est terminale. Aucun des 258 runs de la branche n'était actif lors de la récupération. Une ancienne Lean Queue V2 #34748621746 demeure queued sur main, hors périmètre. Les processus du poste Windows et de la conversation interrompue ne sont pas directement observables ici.

Cause du blocage restant : les superviseurs délivraient un delta local puis nettoyaient leur clone. Le finaliseur VNext produisait READY_TO_CLOSE ; closeLocally produisait seulement une preuve locale. Aucun consommateur GitHub ne terminait la chaîne. Le runtime REVISION #37548553181 contient l'exécution Claude, les checks et le patch, mais aucune revue d'implémentation. La revue de plan ne la remplace pas. Ne pas attribuer cette lacune aux optimisations sans preuve.

Étape 1 : matérialiser le delta acquis dans une PR de certification de la même campagne et désigner une issue de livraison. Étape 2 : faire une contre-revue technique des octets publiés et revalider le plan exact, sa couverture et ses preuves ; transmettre automatiquement ces références au finaliseur. Étape 3 : après READY_TO_CLOSE, publier FINAL_OUTPUT, fermer l'issue et observer son état, puis publier SLICE_CLOSED. Conserver les dérogations/réserves sans fabrication de conformité. Chaque reprise relit le distant et refuse un conflit.

## Cibles et écritures exactes

- Issue de livraison : [#324](https://github.com/MyUncried/Application-Routine/issues/324), corps lié à campagne/tranche et empreinte exacte.
- PR de livraison : [#325](https://github.com/MyUncried/Application-Routine/pull/325), draft, base `protocol/vnext-proof-stability-20260930`, branche `certification/vnext/628b3349-88b4-4bf1-be6b-50bc09e7d245`.
- Livraison publiée : `b4dbde78215b4ff1adb1443a0ed6d581716eb38b`, parent `d1c5241be95a1e27933d8049cb6c0dfb8dbec4d9`, exactement core.js et core.test.js. Pas de fusion de #325, pas de changement de main. Il s'agit de publication de la fixture du protocole, pas de publication applicative.
- Revue technique ChatGPT, distincte d'une revue humaine : [6034331428](https://github.com/MyUncried/Application-Routine/issues/324#issuecomment-6034331428). APPROVE vérifié par le consommateur existant avec preuve exacte FUNCTIONAL_TEST et couverture du plan ; human_review_performed=false.
- Le writer opérationnel utilise uniquement POST `repos/MyUncried/Application-Routine/issues/324/comments` et PATCH `repos/MyUncried/Application-Routine/issues/324` avec state=closed/state_reason=completed. Aucun commentaire V2/PRE-2, aucune fermeture de #269.
- Le même workflow existant reçoit FINALIZE_DELIVERY et une demande nouvelle generation 75 ; la demande 74 est conservée et n'est pas rejouée. Permission issues:write limitée au job close-vnext-delivery ; aucune permission contents:write ajoutée à ce job.
- Publication du protocole et de ses preuves sur la branche de #269 avec contrôle de tête/bail. Les stages de développement/qualification générale sont ignorés pour FINALIZE_DELIVERY. Les 30 tests affectés précèdent le writer dans le passage ciblé.

## Réutilisation démontrée des preuves

Archive source #37548553181, artifact 11451904254 : SHA-256 `26e552be6d6be37374322a42e7ccc9e6fbc28ed2948255b767aa2eceebb67047`. Le runtime constate IMPLEMENTED_AND_VERIFIED, INTACT, aucun out_of_scope_files ni post_check_drift, Jest 1257/1257, TypeScript et lint PASS. Son functional-proof constate value=2, targeted_jest_exit_code=0, keep.js inchangé (SHA-256 `db387ac0aab607cda76e230c38f08a343d1d3d6281c2062b48bf023f06331f56`).

L'arbre complet a été reconstruit depuis le parent exact et les deux fichiers de l'archive : `9cb1628b755948fb3b57f24bcf1cf187e9114282`. L'API GitHub observe ce même arbre pour b4dbde7. Le plan technique dans Git à d1c5241 est identique octet pour octet à runtime/vnext-approved-plan.md (13 207 octets). La projection de preuve de test conserve source_run, source_head et IDENTICAL_COMPLETE_TESTED_TREE ; elle ne prétend pas qu'un test a été exécuté à nouveau sur le nouveau SHA. Le writer exige un checkout propre de la tête de livraison et ce même arbre avant d'utiliser les checks. Les statuts head/clean sont recontrôlés dans ce checkout, pas déduits du succès historique.

## Raccordements et protections

Nouveau consommateur vnext-github-closure et entrée close-vnext-github-delivery. La finalisation est réexécutée depuis les objets Git et les commentaires faisant autorité ; une enveloppe locale rescellée ne suffit pas. La provenance du workflow, du contrôleur et du finaliseur est contrôlée avant écriture. Le job est sérialisé par la concurrency existante, sans cancellation ; le CLI refuse une exécution hors du job prévu. Le corps d'issue, la branche, le dépôt, la base de PR et sa tête sont revalidés avant et après publication. Les records sont liés à la campagne/tranche/tête/finalisation, ne sont acceptés que depuis github-actions[bot], et un doublon ou contenu contradictoire est refusé. Une réponse perdue reprend depuis les records observés, pas depuis l'hypothèse d'échec de la requête précédente.

L'entrée de finalisation lisait auparavant les preuves non UI sans les comparer exhaustivement au plan, et sa couverture Git portait seulement sur les cibles UI. Cette lacune est démontrée par le plan réel sans UI. Correction : réutilisation de verifyEmbedded(requirement-contract), couverture exacte des requirements/proofs non UI, refus des preuves héritées, et inclusion de leurs change_targets dans la vérification de l'arbre final. Aucun contrat V2 n'est modifié.

La politique d'écriture inventorie les deux jobs producteurs par capacités et scopes exacts, et le script REST par son blob exact. required_job devient null pour le workflow qui contient désormais deux jobs écrivains ; chaque capacité conserve son JOB exact, ce qui interdit un élargissement de permission au workflow ou à un autre job. CUTOVER_PREPARATION est maintenu ; aucune permission de clôture produit générale ni activation ajoutée. Le writer certifie la fermeture de cette livraison de test seulement.

## Vérifications et limites avant exécution

30 tests ciblés PASS, 0 FAIL, 0 SKIP : nouvelles clôture/reprise/refus/anti-falsification et finaliseur affecté. Syntaxe YAML indépendante : 65 workflows acceptés ; validateur de workflows et diff --check passent. Politique : PASS_WITH_FROZEN_LEGACY, sans nouvelle dérive legacy. Les premiers échecs de fixture de test et la déclaration de capacité dupliquée ont été corrigés avant publication ; aucun run distant ne les a exécutés.

La qualification locale du writer n'est pas sa certification opérationnelle. Le passage ciblé GitHub, les écritures observées et la reprise réelle seront consignés dans le complément ci-dessous. Le parcours jusqu'à clôture effective de cette fixture ne suffit pas à certifier tous les scénarios des trois incidents : attentes d'accessibilité, corrections multiples et versions périmées restent distinguées entre tests/rejeu et exercice opérationnel. Aucune conformité Figma, accessibilité ou observation native sur appareil n'est produite. V2, PRE-2, PRE-3, revue indépendante finale du protocole et activation restent hors périmètre.

## Point de reprise avant publication

Demande nouvelle : FINALIZE_DELIVERY generation 75 ; cible #324/#325, revue 6034331428, manifeste dans closure/finalization-manifest.json. Le passage ne rappelle pas Claude et ne rejoue pas INITIAL/REVISION. Vérifier le résultat du run à la tête publiée avant toute reprise. Ne pas relancer en présence d'une opération active ; si une publication/fermeture a réussi malgré une réponse perdue, reprendre les records existants. Une clôture effectivement observée sera enregistrée dans le checkpoint et le cas END, puis la demande redeviendra terminale.

Fichiers : workflow VNext existant, politique VNext, entrée/module de clôture nouveaux, finaliseur et publication VNext, nouvelle suite ciblée, demande/checkpoint et preuves closure/, présent rapport. Aucun fichier V2/PRE-2 ou fonctionnel applicatif modifié dans le protocole. La PR #325 contient seulement la fixture existante déjà produite par Claude.

Le writer relit également la clôture une seconde fois sur GitHub et exige les mêmes IDs de records et la même empreinte ; recovery.json prouve cette reprise réelle sans nouveau record. Une interruption forcée en plein writer reste distincte de cette reprise et de ses tests de réponse perdue.

Le premier transport CLI de publication a été refusé faute de credentials Git HTTPS locaux ; la tête distante est restée inchangée. La publication utilise le connecteur GitHub avec contrôle de bail, sans configuration ni exposition de credentials.

## Premier passage et correction du transport de revue

Publication ffdd724ab16be39908677c3a29f2b91ae9357438, run #37596957178 : 30 tests PASS, puis SOURCE_COMMENT_ORIGIN_MISMATCH avant écriture ; #324 reste ouverte. Cause démontrée : verify-source-comment impose github-actions[bot] par défaut, alors que la revue technique ChatGPT a été publiée par MyUncried via chatgpt-codex-connector. Correctif VNext seulement : origine CONNECTOR_TECHNICAL_REVIEW explicite, compte exact, slug d’application exact, empreinte du corps et marqueurs reviewer/human_review_performed vérifiés. Le défaut bot par défaut et le module V2 de source restent inchangés. Tests de mauvais acteur, absence d’application, corps altéré et mauvaise issue. Une nouvelle demande generation 76 charge le correctif ; aucune relance de l’ancien workflow.
