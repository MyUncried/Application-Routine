# REVISION — transmission explicite des preuves causales

Mission utilisateur du 7 octobre 2026 à 00:56 Paris : arrêter le test, corriger la transmission, puis relancer. Branche protocol/vnext-proof-stability-20260930 ; départ local 647a4dd926c3c0f7a6573ee77be0df809ebae24f ; contrôleur actif 119c72777c9ee14246a6074cd7144ddb63ad68de, run 37543466873.

## Cause et histoire

prepare-vnext12-revision.js conserve le rapport initial REVISE et le patch sur disque mais n’en transmet pas le contenu à la seconde revue. Seuls les IDs des constats et des références de session/empreintes sont dans l’enveloppe. Le dossier lisible de la seconde revue n’offre donc pas explicitement ces preuves. Lacune confirmée par lecture du code, conséquence sur le run actif non encore démontrée. Déjà présente dans le premier driver eccaf5c8 : la seconde revue appelait Chain.review(next,{cwd}) sans rapport ni patch. Elle n’est donc pas introduite par la dernière optimisation. L’ancienne REVISION 36881458781 reste une preuve historique conservée, sans être une garantie que ce manque sera toujours compensé par le reviewer.

## Correctif minimal

Le driver transmet à la seconde revue les quatre objets qu’il vient de construire et valider : plan de base, rapport précédent exact, changements autorisés et patch de correction. Chain.review les matérialise en quatre fichiers JSON dans son répertoire déjà autorisé par --add-dir et donne à Claude leurs chemins absolus. Une instruction explicite demande de lire le texte des constats et de comparer le plan révisé avec la correction autorisée, sans chercher un fichier par l’identifiant d’une session.

Les objets canoniques du plan révisé ne changent pas. artifacts.revisionArtifacts reste null jusqu’à la construction de l’outcome après revue, conformément au contrat existant. Aucun verdict, constat, preuve de développement ou résultat RESOLVED n’est fabriqué. Aucun contrôle bloquant supplémentaire ajouté. INITIAL ne reçoit pas de nouveaux objets ni d’instruction de révision. Le rapport précédent et le patch sont toujours conservés par le driver dans les artefacts du run.

Fichiers de code modifiés : scripts/kodjo/prepare-vnext12-revision.js et scripts/kodjo/lib/vnext-live-chain.js. Aucun fichier applicatif, workflow, droit d’écriture ou plafond modifié pour cette correction. Aucun navigateur, contrôle visuel, audit, test jetable préalable ou qualification Linux/Windows.

## Arrêt et relancement

Le connecteur GitHub expose la lecture des runs et leur relance, mais aucune opération d’annulation. Le run 37543466873 a été constaté IN_PROGRESS. Aucune annulation revendiquée. Le correctif est préparé localement sans déplacer le HEAD actif ; aucun nouveau run n’est lancé tant que l’ancien n’est pas terminé ou annulé. L’utilisation de l’interface navigateur en remplacement du connecteur exige l’accord utilisateur selon les instructions de cet outil.

Suite après arrêt confirmé : nouvelle demande PREPARE_REVISION avec UUID neuf et DIRECT_REAL_USER_REQUEST, publication sélective avec contrôle du parent/tree, puis lancement unique. Pas de qualification préalable ni réutilisation des réponses de l’ancien contrôleur pour certifier le nouveau.

## Vérification et livraison

Contrôles prévus : syntaxe Node des deux fichiers et whitespace, relecture du flux de transmission. Aucune suite de tests exécutée à ce stade ; efficacité de la transmission dans une vraie revue Claude à vérifier au prochain run. Aucun contrôle sur appareil réel applicable. Ce rapport et les deux fichiers de code constituent la livraison locale. Commit final identifiable par git log -1 --format=%H -- .github/orchestration/reports/2026-10-07_VNEXT_REVISION_CAUSAL_EVIDENCE_FIX.md, hash complet fourni dans la réponse. État Git vérifié après commit. Publication et relancement restent à effectuer après arrêt confirmé.

## Reprise après accord utilisateur

Accord navigateur reçu le 7 octobre 2026 à 00:58 Paris. Bouton « Cancel workflow » actionné sur le run 37543466873 ; GitHub affiche « You have successfully requested the workflow to be canceled. ». L’arrêt effectif doit encore être confirmé. Les vérifications Node --check et git diff --check ont réussi. Correctif local livré dans f7d6cbe38920b16d3fac9b7f07c8529eefa086c1. Nouvelle demande préparée, génération 69 ; checkpoint 101 conserve encore le run actif sans l’inventer terminé. Aucun relancement avant confirmation de l’arrêt.

Vérification locale de copie documentaire : lecture du dossier REVISION historique déjà conservé dans revision/prepared.json, passage de ses quatre objets exacts à materializeReviewDossier, relecture des quatre JSON produits et comparaison canonique avec les originaux. PASS : quatre chemins absolus lisibles, contenus identiques et produit canonique inchangé. Aucun modèle, fixture de développement ni suite de qualification exécutés. Cette vérification porte sur la transmission des fichiers, pas sur le verdict futur de Claude.

## Difficulté d’arrêt identifiée

Le job prepare-revision actif porte if:always(), ajouté dans c830adab / contrôleur 119c727 pour permettre le passage direct malgré qualify-driver SKIPPED. GitHub réévalue cette condition lors de l’annulation ; always() reste vrai et laisse le job continuer. Source primaire : https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-cancellation. Deux demandes d’annulation ont été acceptées dans l’interface mais le job continue. Cette régression d’annulabilité vient de cette modification de routage, pas de l’optimisation antérieure ni du correctif de preuves causales.

Correctif supplémentaire minimal : remplacer le always() du seul job prepare-revision par !cancelled(), en conservant toutes les autres conditions et la possibilité de passer avec qualify-driver SKIPPED. Mise à jour de l’empreinte du workflow dans la politique existante, sans nouveau droit. Aucun bloc PowerShell modifié. Cela corrige les prochaines exécutions ; le workflow déjà lancé ne change pas rétroactivement.

## État préparé et blocage restant

Candidat Git distant créé mais non activé : 23cd78c3d381b9b6906e120cc92ce81557f9ac0d, tree dfcd8a49623fca4118371530aaa2b4585eea7f2a, parent 119c72777c9ee14246a6074cd7144ddb63ad68de. Validation exacte du tree PASS : syntaxe, requête, politique PASS_WITH_FROZEN_LEGACY, 420 correspondances historiques, zéro unité PowerShell changée, aucune suite de tests exécutée. Branche distante inchangée, aucun nouveau run lancé.

L’annulation normale dans l’interface a été demandée deux fois et confirmée par GitHub ; le run demeure IN_PROGRESS à la dernière observation. Capture conservée dans reports/evidence/37543466873/cancellation-request.jpg. L’annulation forcée prévue par GitHub contourne always() via POST /repos/MyUncried/Application-Routine/actions/runs/37543466873/force-cancel (documentation https://docs.github.com/en/rest/actions/workflow-runs#force-cancel-a-workflow-run). Cette opération n’est pas exposée par le connecteur, ni par les contrôles de la page observée. Aucun accès CLI authentifié dans l’environnement de travail, aucune credential extraite du navigateur.

Action minimale restante sur le PC déjà authentifié à GitHub : `gh api --method POST repos/MyUncried/Application-Routine/actions/runs/37543466873/force-cancel`. Ensuite constater completed/cancelled, actualiser l’état du précédent run dans le checkpoint, reconstruire/valider le tree exact et publier avec lease, puis observer le nouveau run REVISION. Ne pas activer le candidat préparé qui conserve volontairement l’ancien run comme actif. La demande génération 69 et l’UUID 345ba07c-f105-48c3-9f75-e24b49d4ceb6 sont préparés mais pas consommés. Aucun succès ni arrêt inventé ; mission bloquée sur l’arrêt, correctifs livrés localement.

## Résultat récupéré le 7 octobre à 01:18 Paris et reprise autorisée

Le run précédent est maintenant completed/cancelled ; son job prepare-revision 112541785655 a terminé failure, avec artefact conservé. Il a réalisé les deux revues jusqu’au refus causal, malgré la demande d’annulation normale. Le statut GitHub annulé ne doit pas masquer l’échec effectif du job, et cet échec n’est pas imputé à l’annulation : les deux processus Claude se terminent normalement, en 225 966 ms et 495 241 ms, avec plafond 7 200 000 ms et reçus acceptés.

Premier plan volontairement incorrect : Claude produit REVISE avec un défaut bloquant, les intentions value()=3 contre la source et les obligations value()=2. La correction de plan s’effectue. Seconde revue : zéro défaut bloquant, trois suggestions non bloquantes, mais finding_resolutions[FND-90eb9ef5f9e607bde9bf15de]=OPEN. Motif explicite : texte du constat précédent, plan de base et patch non observables dans le paquet. Le reviewer affirme que le plan est techniquement sain et que la lacune est de transmission. Le contrôleur refuse donc à VERIFY_CAUSAL_OUTCOME : VNEXT_LIVE_REVIEW_NOT_APPROVED: REVISE. Aucun développement invoqué.

Le diagnostic anticipé est désormais confirmé par le reçu réel. Le correctif local f7d6cbe3 n’était pas exécuté par ce run, qui utilisait encore 119c727 ; aucun échec du correctif revendiqué. Aucune demande de finding_ledger après revue déjà résolue n’est ajoutée à la seconde revue : le plan de base, le rapport précédent, les changements autorisés et le patch suffisent à rendre les preuves causales observables, sans fabriquer de résolution.

Artefact 11450450612, archive complète reports/evidence/37543466873/revision-37543466873.zip, SHA-256 15e89df3d254e7e97b01cfedfb945c81dcec7a0ca19967ef2beb304044ccdd0e. Ancien diagnostic, refus et annulation conservés sans reclassification. Checkpoint 101 actualisé avec les deux conclusions. Publication du correctif et relancement direct avec l’identité génération 69 déjà préparée, après vérification de la fenêtre et du nouveau tree exact. Aucun besoin de la commande d’arrêt forcé désormais, puisque le run est terminé. Résultat du nouveau parcours à observer ; aucune qualification ni suite jetable préalable.
