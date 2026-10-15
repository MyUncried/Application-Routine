# VNext — restauration du retour commun vers Work

## Bilan actualisé — 15 octobre 2026

Le correctif de consolidation #362 est intégré sur main `fb875bc7f38750c85fc9e1dab0001df6f9e89ec0`, avec l'arbre exact du candidat `16af73dc851160bba949425e887328c3124876c3`. Qualifications VNext `38650355491` et contrôles hérités `38650355485` SUCCESS, Linux et Windows compris. Le bilan détaillé et ses limites figurent dans [le checkpoint commun](2026-10-14_VNEXT_COMMON_CORRECTION_CHECKPOINT.md).

La réception automatique et la consommation durable ont été démontrées à 00:31 Paris : quatre ZIP vérifiés, claim `ae877afe8a357d0cae13604e0c9160c7cfdfbd69`, checkpoint RESULT_CONSUMED `f8b84bc5be79247116e6df775eda95659646f190`, reçu PROCESSED `d884cf9250694bf9824a57094aac2d3b52a37237`, origine AUTOMATION_EVENT. La consigne de l'automation existante est désormais générique et ses déclencheurs restent actifs sur #356 ; aucun nouveau réveil de qualification ni appel Claude n'a été provoqué pour cette clôture. La restitution spontanée dans le fil pilote reste non vérifiée, distincte du résultat dans le chat d'exécution/Planifié. Aucun PRE-4 n'est lancé.

Les mentions « non encore démontrée » ci-dessous décrivent l'historique antérieur à cette preuve, conservé sans réécriture de ses résultats.

## Demande et baseline

Hermann demande de rétablir le réveil automatique par synchronize, commun aux tranches, après constat de sa disparition du relais PRE-4. Travail depuis main e844b55fddf23ffb648108fa56c423ccd1f4a7f9 ; correction #355 déjà intégrée et qualifiée. Aucun code produit ni PlanContract modifié, aucune nouvelle certification ou appel Claude.

## Historique causal

Le transport GitHub → PR synchronize → Work avait été démontré dans la configuration V1.3 (T1–T9, PR#19). L'ancienne automation « KODJO GitHub Transport » est encore activée mais liée à cette PR et à son ancien fil. Le signal de cycle VNext dans signal-vnext-cycle-continuation.js est lié en dur à la campagne VNEXT-12-QUALIF et à#269. Les deux ne démontrent pas un réveil de PRE-4.

Les ajouts du relais88a83368 puis50415ae3 ont explicitement laissé le réveil non raccordé ; les documents du relais l'indiquent. Les tests portent sur exécution/cache/archive, pas sur la réception Work. L'écart ne vient pas d'une nécessité propre à une tranche : c'est une lacune de raccordement. Aucun succès historique n'est effacé ni reclassé.

## Réalité du dernier run

Run38465662376, job115531699206, FAILURE après appel Claude réel. La réponse est conservée : sessionbc292af0-5ef7-41be-961c-245cbc7daff3,729événements,155tours, processus status0, duration1176764ms. Refus final VNEXT_REVIEW_COVERAGE_INCOMPLETE, model_invoked:true. Six constats partiels ; ranges4996cibles sur236896. Ni APPROVE ni revue complète. Le signal ne doit pas transformer ce refus en non-invocation ou autoriser un deuxième appel sur le même paquet.

Archive11852478408 : ZIP36285octets, SHA-2566e6b45bec633e1c53546917f3d36450b00777c72b61dff51590edccc87dcf116. Téléchargement physique/hash, manifeste/fichiers et failure/checkpoint vérifiés par le validateur du relais. Le nouveau constructeur de signal vérifie aussi demande/bootstrap/activation/run/archive sur ces preuves réelles, sans publication ni appel modèle : VERIFIED_REAL_RESULT. La restitution durable de cette revue partielle est rattachée à la branche de plan existante.

## Raccordement concret

Une PR de transport commune#356, branche orchestration/vnext-work-signals, est créée sans code métier. Cette PR reste ouverte et n'est pas une livraison de tranche. Aucune référence de tranche n'est codée en dur dans le publisher.

La capacité d'événement GitHub est découverte sur la connexion autorisée. Son schéma prend en charge les mises à jour de commit des PR. Une lecture authentifiée de#356 vérifie son auteur MyUncried. Automation « Piloter VNext » créée et activée dans la conversation6ac7f420-2fd8-83eb-83ae-4c72a07603a5, avec trigger PR#356/authorMyUncried/enable_commit_updates:true, sans cadence indépendante. L'ancienne automation historique n'est ni modifiée ni présentée comme celle du parcours courant. Le binding exact figure dans KODJO_VNEXT_WORK_TRANSPORT.json.

Le nouveau workflow réagit aux résultats du relais commun après leur archivage. Un contrôle publish/<run_id>.json permet de signaler un résultat terminé avant intégration, sans rejouer la revue. Un seul publisher vérifie et émet dans les deux cas. Il publie un seul fichier de signal isolé, par commit non forcé, avec déduplication demande/opération/run/tentative. Branche déplacée, signal conflictuel, destination fermée/étrangère ou preuve altérée sont refusés. Les droits contents:write sont limités au job sérialisé publish-signal ; les deux producteurs exacts sont déclarés dans la politique existante. Rien n'est supprimé de ses protections historiques.

L'automation exige accusé durable [VNEXT_WORK_SIGNAL_RECEIVED]/[VNEXT_WORK_SIGNAL_PROCESSED], contrôle d'opérations actives, vérification du reçu métier, puis poursuite jusqu'au gate propriétaire. Le signal garde semantic_validation_required:true ; il n'accorde aucune autorisation de développement.

## Contrôles

- 10tests du nouveau transport PASS : deux tranches distinctes et trois opérations, échec partiel après modèle, preuves incohérentes, fork/acteur/état refusés, activation exigée, signal idempotent, branche déplacée sans push, chemin de signal refusé, digest ZIP, symlinks et traversal refusés avant extraction, absence de CI lourde pour les seuls chemins de données.
- 60tests transport/relais/entrée compatible/ancien signal/sécurité des écritures PASS avant dernière extension des assertions de refus ; les9tests étendus repassent sans erreur.
- Archive PRE-4 réelle acceptée par le constructeur sans masquer son échec sémantique ; aucun nouveau modèle invoqué.
- Scanner NO_UNDECLARED_REMOTE_WRITE_CAPABILITY ; YAML indépendant75workflows acceptés ; syntaxe Node et git diff --check PASS.
- CI du candidat de raccordement à suivre avant intégration.
- Passe finale92tests PASS, zéro échec : transport/relais/entrée compatible/ancien signal/sécurité des écritures/classification et préservation de l'audit indépendant. L'ajout des exclusions a d'abord été refusé par l'empreinte du workflow de CI figé et par le test qui exige les mêmes filtres sur l'audit ; les consommateurs miroirs et seulement leurs empreintes correspondantes ont été actualisés. Les permissions et exécuteurs historiques restent inchangés.

La création de la PR de transport a déclenché les CI automatiques existantes sur son namespace nouveau, encore classé UNKNOWN. Ce manque de précontrôle est identifié avant le premier signal et corrigé dans le candidat : seules README/signals/*.json/publish/*.json sont données non normatives, jamais le code/binding/contrat ni un diff mixte. Les runs déjà créés ne sont pas des appels modèle et restent historiques ; aucun endpoint d'annulation n'est exposé au pilote. Ce constat n'est pas reclassé en absence de run.

## Limites et jalons

Configuration Work confirmée, mais réception courante NON ENCORE DEMONTREE. Le commit de signal devra être émis sur le résultat réel existant après intégration du publisher et doit produire un accusé durable dans cette conversation. Aucune qualification de réveil déduite des tests simulés ou d'une automation créée.

Archive absente/altérée/sans provenance : publisher en échec technique visible, pas de signal métier ni retry modèle. Le fonctionnement de cette récupération reste à tracer, pas à annoncer conforme. Le défaut de couverture PRE-4 est distinct et n'est pas corrigé par le réveil ; ses six constats doivent être vérifiés et sa lecture complète obtenue selon le protocole, sans fabriquer une couverture.

Fichiers : workflow/publisher/tests nouveaux, binding et contrat de retour commun, politique des deux writers nouveaux, manifeste/normative-inputs et documentation du relais/continuité ; filtres de CI partagés et classification des seuls chemins de données, avec empreintes correspondantes. Aucune logique d’exécution V2 modifiée. Commit exact et CI sont liés par la PR de correction ; la branche de transport reste distincte. Le dépôt applicatif et le plan0ef1ec59 restent inchangés. Pas d'action PowerShell, de fermeture ou de redémarrage demandé à Hermann.

## Retour CI sur 18c0b6c7 et correction bornée

Runs 38479582499 et 38479582949 terminés en FAILURE. Linux : IA-004 refuse le binding parce que le manifeste n'en cite que le nom, pas son chemin complet. Windows : le nouveau test de permissions exige LF et refuse le checkout CRLF ; l'archive qualification-controls-Windows 11858550160 (SHA-256449659b9504106ba9e2ff180c1aee096d8e2c9ca28591cf8c3c01a0880af7320) démontre cette cause. Aucun échec du publisher exécuté n'est déduit de ce défaut de test. Correction : chemins complets dans le manifeste et assertion acceptant LF/CRLF, avec exigences de permissions inchangées.

Les diagnostics historiques Linux 11856043026 et Windows 11858190569 ont été téléchargés et vérifiés par leurs SHA-256. Windows contient aussi l'échec du test audit-prompt-transport/native probe, déjà suivi sous R-CI-HOST-01 ; il reste OPEN, sans attribution causale au nouveau publisher ni suppression du contrôle.

Contrôles locaux de correction : 34 tests ciblés PASS, 10 tests du transport avec le vrai YAML converti temporairement en CRLF PASS puis restauration octet à octet. La nouvelle CI doit être suivie sur le commit publié de correction ; aucune fusion ni réception Work n'est annoncée sur ces seuls résultats.

## Diagnostic des deux tentatives Linux de 38483049278

Baseline du complément : 87eaf5cca35bdeef138affdceccbe8be8493975c, PR #357 conservée. CI principale 38483049288 SUCCESS ; qualification Windows et équivalences historiques Linux/Windows SUCCESS. Les deux tentatives Linux ont chacune 524 tests PASS sur 525, mais leurs causes sont différentes.

- Tentative 1, archive locale linux-controls.zip : assertions du test de liaison de reprise terminées puis hook de nettoyage en échec ENOTEMPTY, dans vnext-figma-fixture.js. Le nettoyage n'avait aucune reprise sur erreur transitoire. L'auteur d'une éventuelle écriture concurrente n'est pas identifiable dans cette trace ; une maintenance Git détachée est une hypothèse, pas une cause démontrée.
- Tentative 2, job 115701672424, archive 11872617442 : assertion du test « same-operation prior scan » en échec, true au lieu de false. Le test hérite de GITHUB_RUN_ATTEMPT=2 du job relancé. priorInvocation refuse intentionnellement cette seconde tentative avant même la lecture des preuves. Reproduction locale exacte sur l'ancien test avec GITHUB_RUN_ATTEMPT=2 : FAILURE ; ce défaut est déterministe et distinct du nettoyage. Relancer le job sans isoler ce contexte ne pouvait pas le réparer.

Correction limitée aux tests : définir et restaurer GITHUB_RUN_ATTEMPT/GITHUB_RUN_ID pour le scénario simulé ; vérifier explicitement le refus en tentative 2, puis le refus du résultat antérieur inconnu. La fixture Git désactive uniquement sa maintenance automatique locale et effectue jusqu'à cinq reprises de nettoyage de 100 ms ; une suppression définitivement impossible reste un échec visible. Aucun catch silencieux, aucun test supprimé, aucune protection de production modifiée.

Contrôle ciblé : 32 tests relais/transport PASS sous GITHUB_RUN_ATTEMPT=2 et GITHUB_RUN_ID=123, contre-épreuve de l'ancien test FAILURE sous la même tentative. Après checkout complet, suite VNext entière avec ces mêmes variables : 525 tests PASS, zéro échec, zéro skip, 67 792 ms. Syntaxe des deux fichiers et git diff --check PASS. Contrôles distants à suivre sur le nouveau commit avant conclusion. Le premier essai local de suite complète utilisait un checkout partiel dépourvu de tests/fixtures/vnext12 : résultat non recevable, checkout complété avant répétition.

Cette correction ne démontre ni la réception Work, ni la couverture de revue PRE-4. Le résultat partiel déjà archivé reste inchangé. Aucun nouvel appel Claude, aucun développement, aucune nouvelle campagne de certification.
