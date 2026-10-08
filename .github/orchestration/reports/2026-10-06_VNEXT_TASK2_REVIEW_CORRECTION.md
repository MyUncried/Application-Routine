# Tâche 2 — correction de la revue et reprise autorisée

Mission VNEXT_TASK2_REVIEW_CORRECTION. Autorisation utilisateur du 6 octobre 2026 à 01:39 Paris : corriger et relancer le protocole. Branche `protocol/vnext-proof-stability-20260930`, PR #269 draft ; départ local `1054bcb501b1ccf6890ace35fcebf4fc2957ca69`, distant `6ec750620a690b777884d255200ca43bd2a3ae43`. Portée : revue et reprise de la tâche 2 isolée uniquement. Pas de tâche 3, revue de clôture, activation, V2, PRE-2 ou PRE-3.

## Correctif

Le contrôleur reconstruit les candidats, le catalogue et les références Figma ; compare intégralement les objets reconstruits aux contrats canoniques vérifiés et matérialise un fichier canonique exact. Claude reçoit l'identité de ce fichier et les empreintes vérifiées. Les instructions n'exigent plus qu'il exécute `unpackUi` ou calcule les hashes avec ses outils de lecture.

Les sources exactes des 28 consommateurs sont matérialisées en fichiers hors checkout, relues et contrôlées par empreinte. Le dossier contient leurs chemins Git, chemins de lecture et hashes ; aucun consommateur ni cible n'est supprimé. Mesure hors ligne sur le précédent `produced.json` : 1 078 245 → 755 364 octets du dossier compact, avant instructions et chemins Figma. Cette réduction d'environ 30 % ne mesure pas les lectures futures du modèle ni sa durée. Une consultation reste requise ; disponibilité et conformité sémantique restent distinctes.

Le nouveau superviseur lit le flux `stream-json`, conserve uniquement le résultat final exact pour la validation existante et persiste pendant l'appel la version CLI, PID, dates, nombre et types des événements. Aucun texte d'assistant, raisonnement, entrée d'outil ou secret n'entre dans ce journal de progression. Un flux malformé, un résultat final absent ou dupliqué, une erreur d'archivage ou un timeout sont refusés. La revue reste restreinte à Read/Glob/Grep, sans MCP, écriture ou Bash. La limite de l'appel Claude reste 600 000 ms en INITIAL ; le parent accorde seulement la marge de supervision/version/nettoyage, sans prolonger cet appel.

La qualification dédiée utilisera une seule branche nouvelle `qualification/vnext-task2-review-20261006`. La précédente demande consommée reste inchangée jusqu'à la qualification ; elle ne sera jamais rejouée. La nouvelle demande ne sera publiée qu'après vérification du SHA exact et des cinq jobs réussis. Les preuves et rapports locaux de l'échec sont inclus dans la publication documentaire du correctif.

## Vérifications et seconde passe

Tests ciblés : 27/27 PASS. Tests locaux élargis : 334 cas, 333 PASS, 0 FAIL, 1 SKIP (navigateur absent de ce workspace). Ce SKIP n'est pas revendiqué comme une observation réelle. Syntaxe YAML indépendante : 64 workflows acceptés ; invariants exécutables des workflows et whitespace : PASS. Journaux et hashes sous `task2/review-fix-20261006/`.

Le test de processus utilise un vrai enfant Node : résultat JSON UTF-8 conservé, progression sans contenu sensible, événement avant interruption conservé, absence de résultat refusée, flux invalides ou résultat dupliqué refusés. Les tests de chaîne vérifient la correspondance exacte entre les fichiers matérialisés et les contrats/sources. Une substitution de candidat est refusée avant invocation. Les contrôles de couverture, dépendances, récupération sans nouvel appel et checkout immuable restent actifs.

Seconde passe séparée : diff et limites du superviseur relus ; décodage UTF-8 par stream explicite ; version CLI extraite par motif numérique ; validation finale originale conservée ; refus d'échec et de résultat manquant vérifiés. La cause profonde du timeout précédent demeure non démontrée. Aucun appel Claude réel pendant les tests locaux.

## Livraison et état de reprise

PRESERVE : contrats canoniques, couverture intégrale, qualification acquise historique, preuves, code applicatif, workflows historiques. CHANGE : préparation du dossier de revue, superviseur, tests concernés, branche de qualification dédiée, checkpoint et ce rapport. FORBIDDEN : toute extension de périmètre ou rejeu de l'UUID consommé.

Fichiers de code : `scripts/kodjo/lib/vnext-live-chain.js`, `scripts/kodjo/lib/vnext-review-process.js` ; tests : `vnext-live-chain.pilot.js`, `vnext-figma-source.pilot.js`, `vnext-review-process.pilot.js`. Workflow : `.github/workflows/kodjo-vnext-proof-stability.yml`. Documentation/preuves : checkpoint, ce rapport, journaux et mesures locaux ; preuves d'échec préexistantes conservées.

Qualification distante et parcours réel : en attente de publication à ce point. Aucune réussite de tâche 2 revendiquée. Aucun test sur appareil réel ; fixture isolée et références Figma figées uniquement. Commit final et état Git seront fournis après publication/relancement ; le commit de ce rapport est retrouvable avec `git log -1 --format=%H -- .github/orchestration/reports/2026-10-06_VNEXT_TASK2_REVIEW_CORRECTION.md`.

## Publication et lancement de qualification

Correctif publié sur `434adeef6d42e861a3dbee7c6236e77cc1ba74f9`, arbre `a836475f25373b89e3117e436b4caf4858acdce8` identique au candidat local. Fenêtre de publication vérifiée avec HEAD, checkpoint exact et pagination complète des runs de branche. Validation du tree : 420 sujets, writers historiques gelés conservés, aucun bloc PowerShell modifié. Précheck réel de préparation PASS sans modèle ; référence Figma et trois exigences/quatre assertions inchangées.

Branche dédiée créée une fois sur le SHA exact. Run de qualification `37390574772`, événement create, initialement queued. Aucune demande runtime nouvelle ni appel Claude à ce point. Ce checkpoint et ces preuves de lancement sont conservés localement pendant la qualification, sans nouvelle publication de branche.

## Qualification acquise et nouvelle demande

Run `37390574772` entièrement SUCCESS, SHA exact `434adeef6d42e861a3dbee7c6236e77cc1ba74f9`, cinq jobs requis VERIFIED par le validateur réel. Contrats Linux et Windows : 318/318 PASS, zéro échec et zéro SKIP ; durées 48,48 s et 225,89 s. Équivalence historique et couverture croisées réussies. Deux archives historiques téléchargées, intégrité ZIP, digest GitHub et SHA candidat vérifiés ; réserves historiques SKIP conservées.

Nouvelle demande `7576668a-8e6a-4678-a9b9-36698847d7f1`, génération 50, même campagne FIGMA_INITIAL, limite de correction 1. L’ancien UUID `86d8f6ce-e621-47b1-9e11-f9d67d32aa52` est consommé et demeure non rejoué. Préparation documentaire seulement ; publication runtime encore à effectuer après relecture HEAD/checkpoint/fenêtre. Les fichiers de code et workflows doivent rester exactement identiques au candidat qualifié.

## Parcours réel relancé — état observé

Demande publiée une fois sur `297c875f3bad9c95a1ad004b18bea933ae4763f0`, arbre contrôleur identique au candidat local et code exactement identique au candidat qualifié `434adeef`. Run runtime `37391444927`, job `112037283221`, runner `KODJO-LOCAL-RUNNER`, IN_PROGRESS dans « Qualify admission then execute the disposable Figma path once ». Ce constat atteste le démarrage du script ; le claim et la progression interne Claude ne sont pas encore accessibles dans cette observation. Aucun verdict ni résultat de livraison n’est revendiqué.

Les CI automatiques du même commit, `37391445079` et `37391445116`, sont également actives ; elles ne constituent pas des relances de la demande. Le résultat du parcours actuel doit être collecté sans nouveau lancement. Rapport/checkpoint/preuve d’état conservés dans un commit local pendant les opérations actives ; aucune publication concurrente du bilan. Seconde passe : UUID/génération, SHA qualifié, égalité du code, HEAD distant, run unique et job réel confrontés. Git propre après ce commit ; hash final communiqué en conversation.

## Résultat terminal collecté à 02:27 Paris

Run `37391444927` terminé en FAILURE à 02:08:59 Paris. Durée workflow depuis création : 10 min 42 s ; job réel : 10 min 26 s. La revue Claude a répondu en 563 840 ms (9 min 24 s), code processus 0, sans timeout, signal ou erreur de processus. Entrée réelle 760 746 octets, 436 cibles ; 408 événements observés ; version effective 2.1.263 ; aucun refus d'outil déclaré. La réduction observée de l'entrée par rapport au run interrompu (1 081 989 octets) est 29,69 %. Elle ne prouve pas une réduction causale du temps total.

La réponse comporte 436 indices de couverture et quatre findings, mais le premier associe `PRESERVATION_RISK` à `PLAN_CONTRACT`, association interdite par la matrice canonique (IMPACT, CANDIDATE ou PLAN_ITEM requis). Le validateur refuse `VNEXT_REVIEW_FINDING_TARGET_TYPE_INCOMPATIBLE: PRESERVATION_RISK:PLAN_CONTRACT`. Aucun reçu valide ni verdict sémantique accepté. Aucun appel d'implémentation, correction, observation du nouveau rendu ou livraison applicative. Le contenu des alertes doit être examiné ; changer l'étiquette en post-traitement pour forcer une approbation n'est pas une récupération valide.

Les quatre alertes brutes portent sur la préservation de l'interface existante dans le plan, l'adéquation d'une preuve de géométrie, des limites techniques insuffisamment consignées et la cible observable d'une assertion documentaire. Leur justesse sémantique n'est pas certifiée par cette collecte. Le défaut bloquant immédiat concerne la compatibilité catégorie/cible de la sortie de revue.

Comparaison recevable : la dernière revue ayant effectivement répondu avait pris 588 534 ms (9 min 48 s), contre 563 840 ms ici, soit 24 694 ms de moins (4,2 %). Les contextes et les réponses diffèrent, et les deux réponses sont rejetées ; ce constat n'est pas une preuve de gain à travail identique. Le run précédent arrêté à 600 056 ms n'avait pas achevé sa revue : on ne peut pas transformer cette limite en durée d'exécution complète. Aucune comparaison à une heure de parcours réussi n'est revendiquée, puisque l'implémentation et la correction n'ont pas été atteintes.

Archive `11381473434`, digest `a4176e0f563e1bdd2f78884a91254605367acdae9de4bf1e75172f8c158f2b7d`, conservée sous `review-fix-20261006/runtime-37391444927.zip`. Intégrité ZIP, hash de la réponse, bundle, snapshots de fichiers, checkout inchangé et nettoyage contrôlés. Admission et claim de cette demande confirmés par l'archive. Aucun nouveau lancement ni correctif de code pendant cette collecte. Au sondage suivant : aucun run actif observé, HEAD distant toujours `297c875f` ; checkpoint terminal et bilan committés localement, sans publication distante dans cette mission.

Seconde passe terminale : horaires GitHub confrontés aux diagnostics, unités de durée distinguées, association interdite relue dans `review-contract.js`, absence de reçu/livraison corroborée par les membres de l'archive et le point d'arrêt. Aucun test applicatif applicable à la collecte documentaire. La qualification Linux/Windows du correctif demeure acquise ; tâche 2 réelle inachevée. Prochaine étape : traiter le contrat de sortie catégorie/cible et examiner les alertes conservées avant toute nouvelle demande. Hash de ce commit communiqué en conversation ; Git propre après commit.
