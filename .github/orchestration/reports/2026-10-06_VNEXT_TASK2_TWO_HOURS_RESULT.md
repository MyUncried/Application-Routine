# VNEXT_TASK2_TWO_HOURS_RESULT — résultat et diagnostic

Mission : récupérer le run terminé 37402330192, sans relance ni correction de code. Branche protocol/vnext-proof-stability-20260930, PR #269 draft. Départ local b8d198128cfb470d32344550776f8210fda85d53, distant bb6dcf7b0927242a0612c6ac11cdc7de99109b09 inchangé. Périmètre tâche 2 jetable uniquement.

## Résultat réel

Run terminé FAILURE. Job 112072091323 sur KODJO-LOCAL-RUNNER de 02:04:26 à 02:12:48 UTC (04:04:26–04:12:48 Paris), soit 8 min 22 s. Étape réelle de 02:04:50 à 02:12:36 UTC. Claim UUID 55015f80-1d0e-4333-941d-e0dbdab8600d / génération 52 vérifié dans qualification-admission.json, tête qualifiée abecf87e88abbf387c1e22e319cda1374762018d, EXACT_SAME_PROTOCOL_CODE. Aucun rejeu de cette demande consommée.

Claude a terminé avec code 0 et réponse structurée finale. Plafond observé 7 200 000 ms ; durée 440 167 ms (7 min 20 s), 333 événements. Aucun timeout. Le protocole refuse la réponse avec VNEXT_REVIEW_FINDING_SELF_DEPENDENCY: PROOF-7d83cc32dc5249b4ce221b29. Le constat PROOF_GAP porte sur cette cible et contient l’indice de dépendance 424 qui désigne exactement la même cible dans le catalogue scellé de 436 cibles. Le décodage fonctionne ; le contenu de la réponse enfreint la règle anti-autodépendance. Le schéma de transport permet actuellement cet indice et l’instruction ne rappelle pas explicitement son exclusion pour la cible courante. Le contrôle canonique rejette correctement la réponse ; il ne doit pas être supprimé.

Arrêt à la revue initiale du plan, avant toute approbation, implémentation ou correction. Les livraisons préexistantes de la fixture sont préservées dans le bundle ; leur présence ne prouve pas une implémentation dans ce run. Application non publiée, fixture nettoyée. Référence Figma figée rejouée ; aucune acquisition live ni certification appareil.

## Constats de fond conservés

La réponse contient trois constats bloquants :

1. PROOF_GAP : l’observateur lit subject.__figmaWidthDelta puis modifie la largeur DOM avant la mesure. Le code testé peut donc influencer l’observateur censé être indépendant.
2. UI_ASSERTION_GAP : le driver choisit les dimensions de fenêtre 402 × 874 à partir des dimensions attendues. Une implémentation relative à cette fenêtre peut satisfaire la mesure sans démontrer les dimensions fixes demandées.
3. TEST_GAP : le texte de l’obligation Node exige la présence des déclarations width/height, sans exiger leurs valeurs exactes.

Contre-vérification : lecture ciblée des sources du driver, de l’observateur et du contrat au HEAD publié, conforme aux éléments cités. Aucun nouveau test navigateur de ces contre-exemples n’a été exécuté ; leurs résultats effectifs restent à démontrer. Reproduction locale du rejet de la réponse originale : erreur identique. Expérience diagnostique isolée sur une copie de la réponse, avec suppression de la seule autodépendance 424 : buildReviewReport accepte les trois constats et produit REVISE, trois blocages et réentrée PLAN. Cette copie n’est ni une réponse authentique corrigée ni un reçu de revue, et n’autorise aucune implémentation. Réponse originale intacte. Il serait donc erroné de présenter le run comme réussi après un simple retrait de l’autodépendance.

## Contrôles associés

Qualification automatique de cette tête 37402330072 : SUCCESS. Pilot 37402330270 : FAILURE, protocole principal SUCCESS ; suite Windows 1 085 tests, 1 080 PASS, 1 FAIL, 4 SKIP. Échec du test navigateur pendant suppression de son dossier temporaire : EPERM sur kodjo-figma-browser-zsb2ds. L’étape de conservation qui dépend de ce succès échoue ensuite. Défaut distinct de l’erreur de revue, sans preuve d’un problème de plafond. La cause précise du verrou Windows et sa correction ne sont pas démontrées ici. Les trois runs déclenchés par le contrôleur sont terminés ; aucune nouvelle opération lancée.

## Preuves, modifications et suite

Archive GitHub 11386416065 de 2 206 928 octets, SHA-256 3cb35ffe7d382a1cbb727b321c1120039beb5a56c295a655362bdd1911176303 vérifié, intégrité ZIP vérifiée. Archive, status, claim, diagnostic de processus, réponse originale, revue décodée et expérience diagnostique conservés dans runtime-result-37402330192. Capture API des runs/jobs/artifacts conservée.

Modifications : ce rapport, checkpoint terminal et preuves seulement ; aucun code applicatif/protocole modifié. PRESERVE : réponse originale, contrôles canoniques, plafond de deux heures, UUID consommé, périmètre jetable ; CHANGE : état terminal/documentation ; FORBIDDEN : nouvelle demande, relance, tâche 3, activation ou clôture. Tests : reproduction du rejet et construction du rapport diagnostique hors admission ; aucun test appareil applicable. Les tests de la qualification précédente ne sont pas rejoués.

Suite technique : corriger la génération/validation guidée des dépendances de revue sans affaiblir le contrat, traiter les trois lacunes de preuve avec contre-exemples exécutés, diagnostiquer le nettoyage navigateur Windows. Réutiliser les preuves existantes ; ne pas réexécuter cet UUID. Une nouvelle qualification/demande ne doit venir qu’après les corrections nécessaires. Aucun gain de performances ou succès du parcours revendiqué.

Seconde passe : causes de transport et de fond distinguées ; aucune approbation fabriquée ; présence du bundle baseline distinguée d’une implémentation ; plafond effectif et absence de timeout vérifiés. Commit final et état Git exact fournis en conversation ; commit de ce rapport consultable par git log -1 --format=%H -- ce chemin. Rapport et preuves committés localement ; publication distante non effectuée dans cette mission de récupération.

## Explication de causalité et corrections proposées

Vérification historique ciblée : b0bf7edf du 5 octobre introduit dans l’historique publié les dépendances par indices et l’observateur navigateur avec __figmaWidthDelta. Le rapport VNEXT_LOCAL_PERFORMANCE précise que ces changements Figma étaient déjà préparés avant l’optimisation Git et ont été intégrés au même commit. La présence dans ce commit ne prouve donc pas une régression due à l’optimisation de performance. Le transport par indices répondait au rejet antérieur DEPENDENCY_UNKNOWN: PLAN_CONTRACT. Ici l’indice 424 est correctement décodé mais Claude inclut sa propre cible : cause directe de l’arrêt. La réduction de volume du dossier n’est pas démontrée comme cause. Les trois constats visuels relèvent de la construction du test jetable et des preuves, pas des plafonds ; le texte d’obligation visual_test_expected est introduit dans 67d18be2. Le défaut EPERM relève du cycle de vie/ nettoyage du navigateur Windows ; verrou effectif à identifier, cause précise non établie.

Corrections à appliquer : expliciter/exclure la cible courante des dépendances lors de la construction de réponse et tester le refus canonique, sans normaliser silencieusement une réponse signée ; retirer toute influence du code testé sur la mesure (défaut négatif injecté dans le rendu lui-même) ; mesurer les dimensions dans une fenêtre différente des valeurs attendues et démontrer le rejet d’un rendu relatif ; exiger et exécuter l’égalité exacte 402 × 874 dans l’obligation Node ; attendre la fermeture réelle du navigateur avant de nettoyer, avec traitement borné d’un verrou transitoire conservant le diagnostic. Ces corrections ne sont pas appliquées par cette mission explicative. Aucune nouvelle exécution ni appel Claude. Tests du diagnostic précédent conservés, aucun nouveau test nécessaire pour cette clarification.
