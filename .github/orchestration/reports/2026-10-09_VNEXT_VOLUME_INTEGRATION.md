# VNEXT_VOLUME_INTEGRATION — raccordement du correctif #341

Mission : corriger les raccordements démontrés et relancer les tests associés, sans démarrer PRE-3. Branche existante fix/vnext-stream-seal-pre3-20261009 ; départ 660e5d64b284614b8df14d29fcb5f840c65c2640 ; parent de la PR 8e8006e34dac8aef0dddaef816828674f3b8756b. Aucun doublon/run actif au précontrôle.

## Causalité avant correction

Runs conservés : 37865381079 (18 échecs, 1436 réussites, 2 ignorés) et 37865381116 (contrôles Linux/Windows échoués, revue ignorée). L'import vnext-file-bundle introduit par #341 étend la fermeture sans être copié dans le gate existant. Trois producteurs gelés ont dérivé dans #341. Attribution démontrée par diff à 8e8006e et logs F-001/FROZEN_PRODUCER_DRIFT. Le script Figma fonction async existe depuis acc07c1f ; son await/return de premier niveau est légal dans le plugin mais refusé par node --check CommonJS. Détection tardive par comparaison de publication au parent historique 2ec2f9f ; ce n'est pas une régression du scellement streaming. Aucun succès comparable de cette publication exacte n'est revendiqué. Main reste 1ddfb6d.

## Corrections

- Suppression de deux évolutions inutiles de producteurs gelés : claude-local.js et plan-impact.js restitués octet pour octet depuis 8e8006e. PlanImpact n'est pas un bloc découpé émis par l'adaptateur ; aucun consommateur réel ne justifiait cette modification.
- La consigne de lecture des références rejoint uniquement la projection VNext ; le prompt legacy est conservé.
- Ajout du module de transport manquant dans la liste figée du gate et inventaire PACKAGE_MANIFEST.md complété. Aucun changement de déclencheur, permissions, approbation, commandes de publication ou contrôle de portée.
- Conservation de l'adaptation nécessaire de run-local-claude : parties du plan autorisé lues au HEAD protocolaire uniquement sous vnextAdmission. Les appels legacy gardent leur comportement.
- Deux nouvelles révisions exactes (workflow et runtime partagé) épinglées après revue du diff et comparaison des capacités statiques avant/après. Les autres gels et les règles d'autorisation sont inchangés. Preuve : evidence/2026-10-09_VNEXT_VOLUME_PINS.json. Le scan de capacités seul ne prouve pas la sécurité sémantique : les régressions de refus/tampering et de plan autorisé restent nécessaires. Revue indépendante non faite.
- Publication : compilation du seul script Figma identifié comme corps AsyncFunction, sans exécution ; node --check reste obligatoire pour les producteurs Node. Test réel du script figé, refus de syntaxe invalide et absence d'exécution.

## Vérifications

Fermeture récursive du gate : 10/10 tests PASS. Scan réel de tout le dépôt : PASS_WITH_FROZEN_LEGACY, zéro finding ; capacités statiques des deux unités réépinglées inchangées. Suite ciblée : 99/99 PASS. Première passe transversale : 1457 tests, 1439 PASS, 13 échecs et 5 ignorés ; 12 échecs dus au tokenizer absent du clone neuf, un à la nouvelle dépendance non inscrite dans PACKAGE_MANIFEST.md. Dépendances installées par npm ci --prefix scripts/kodjo/openai-runtime --ignore-scripts --no-audit --no-fund ; manifeste complété. Reprise des deux suites concernées : 44/44 PASS. Seconde passe transversale après correction : 1457 tests, 1452 PASS, zéro échec, 5 ignorés selon les conditions des tests (portée locale Linux, pas de preuve Windows déduite). Durée 76,6 s ; exit 0. Les échecs initiaux restent conservés. YAML indépendant : 72 workflows acceptés.

Périmètre réellement traité : scripts/consommateurs protocole, un workflow partagé limité à sa fermeture de dépendances, politique de gels et tests. Aucun src/app, aucune tranche métier, migration, extraction Figma ou paquet PRE-3 reconstruit. Aucun contrôleur jetable, certification nouvelle, navigateur ni revue Claude lancé. Aucun contrôle appareil requis pour ce correctif. La revue indépendante du correctif, son intégration et la revue du plan PRE-3 restent non acquises.

Commit final : celui qui porte ce rapport, à identifier via git log -1 -- ce chemin et lien fourni à la livraison. État Git/tests finaux : complétés dans le suivi de livraison.

## Livraison

Preuve structurée : evidence/2026-10-09_VNEXT_VOLUME_TESTS.json. Les ensembles ciblés et transversaux se recouvrent ; ne pas additionner leurs comptes. Les 18 échecs CI du candidat initial sont couverts par cette reprise. CI Windows/Linux du nouveau commit à suivre dans #341 ; résultats distants non anticipés. Deux fichiers gelés restaurés, deux gels réépinglés sans changement de capacités détectées, fermeture exécutée, compilation Figma sans exécution et régressions négatives vérifiées. Seconde passe des diffs : aucun fichier applicatif modifié. État Git propre au commit de preuve local ; livraison distante par mise à jour avec lease du SHA initial 660e5d64. Revue indépendante, fusion et clôture de #341 restent en attente.

## Reprise Windows du 9 octobre

Le run 37891362932 sur `1585197317ad63bb64de26261bdd1b7686f6648a` conserve une validation native PowerShell/publication réussie et un échec de la suite VNext Windows : 469 réussites, un échec. La partie du plan n'est pas lisible à la révision Git de la fixture ; son chemin relatif comporte 279 caractères, avant même le préfixe du checkout. L'équivalence historique Windows refuse ensuite l'exécution incomplète. ZIP de diagnostic 11598656413 vérifié : SHA-256 `36fefc1eb7844d2917be0fc20ceda51abb2a36469aa7e6805e7f984b22988967`. Aucun succès Windows n'est déduit des succès Linux.

Correction ciblée : rangement partagé `parts/`, dont chaque feuille garde son SHA-256 intégral. Le même chemin relatif mesure désormais 178 caractères. Les manifestes historiques gardent leur lecteur ; les empreintes logiques des contrats ne changent pas. Les attributs Git limités aux fichiers de transport conservent leurs octets, y compris les fins de ligne. Aucun changement global de configuration Git. Le test utilise explicitement `core.longpaths=false` et `core.autocrlf=true`, vérifie que la partie est réellement dans Git puis que ses octets restent identiques après checkout. Les contrôles de mauvaise révision, altération et symlink restent actifs. Un test supplémentaire vérifie la coexistence des manifestes et la lecture de l'ancien rangement.

37 tests associés passent ; suite complète locale : 1458 tests, 1453 réussites, zéro échec, 5 ignorés, exit 0. Preuve : `evidence/2026-10-09_VNEXT_VOLUME_WINDOWS.json`. Les nouveaux résultats Windows restent à obtenir sur le candidat qui porte ces corrections. Aucun paquet PRE-3 reconstruit, aucune revue de plan ou implémentation lancée.

## Intégration du protocole dans main

La PR #341 cible la branche de planification PRE-3. Une branche distincte `fix/vnext-volume-main-20261009`, basée sur `1ddfb6d144552f578388257adc78db47ab5992c8`, porte exclusivement les scripts, tests, règles de transport, workflow limité à sa dépendance, inventaire et preuves du correctif. Les évolutions de lecture des paquets Figma compressés présentes dans la branche PRE-3 sont incluses car elles constituent une dépendance du transport complet ; le test de stockage associé est repris. Le seul fichier sous docs/preparation/PRE-3 est le corps Figma contrôlé syntaxiquement par le test de publication : il est conservé comme entrée exacte de compilation, sans extraction ni exécution. Aucun plan, contrat, paquet Figma/média, script de construction/lancement de PRE-3 ou fichier applicatif n’est intégré par cette branche.

Suite locale de ce candidat main : 1458 tests, 1453 réussites, zéro échec, 5 ignorés. Lecture avec le nouveau lecteur du conteneur historique déjà stocké : PASS, 6384 exigences et 243974 assertions, empreintes du conteneur, du plan et de l’UI identiques. Cette opération lit le stockage existant ; elle ne produit pas un nouveau plan, ne revérifie pas sa fraîcheur sémantique et n’appelle aucun modèle. Preuve : `evidence/2026-10-09_VNEXT_VOLUME_MAIN.json`. Les anciens rapports de reconstruction restent rattachés à leur révision et à #341 ; ils ne certifient pas ce candidat main.

Relecture ciblée : chemins et fermeture du gate, hachage canonique/Unicode, stockage immuable partagé et lecteur historique, confinement des références, vues du plan autorisé, gels et attributs Git vérifiés. Les gels restants ont leur blob exact déclaré ; les capacités de publication et les barrières d’approbation ne sont pas élargies. Cette relecture par l’agent de reprise ne vaut pas une revue indépendante par modèle. Les tests distants du candidat main doivent réussir avant fusion. PRE-3 reste en pause et conserve son approbation/revue à obtenir dans #340.

## Native CI follow-up: Git object lookup and fixture cleanup

Candidate 00d20df0 Windows VNext qualification had 470 PASS and one failure: Git show probed revision:path as a filesystem path and refused it as too long, despite the actual compact part path fitting. Artifact 11600035018 SHA-256: 8482431270f91e9c74806e515e92a239ca49a839a522a80fba17b1167776e7a5. VNext Git object reads and bundle materialization now use cat-file blob for exact pinned bytes; the frozen legacy preflight-source remains unchanged.

Main candidate 877cbce7 Linux pilot run 37894307114 had 1454 PASS, two cleanup ENOTEMPTY failures in finalization fixtures and two skips. Disable automatic Git maintenance in those disposable fixtures and retry bounded cleanup; assertions and production finalization gates remain unchanged. The initial associated regression passed 42 tests. These failures remain recorded; new exact-head CI is required before integration. No PRE-3 execution.

## Clôture publiée après qualification native

Les statuts provisoires ci-dessus sont historiques. La correction est intégrée : PR #342 vers main (f532f21918975293c11ae36442a5ea778f808e36) et PR #341 vers plan/pre3-vnext-20261008 (1d42479181586d926a9970867a41d35d44cc4661). Les quatre runs finaux sont SUCCESS. PRE-3 reste en pause. La baseline applicative Jest Windows comporte une réserve CRLF et aucun PASS applicatif global n'est revendiqué. Voir [registre final](2026-10-09_VNEXT_VOLUME_CLOSURE.md) et [preuves structurées](evidence/2026-10-09_VNEXT_VOLUME_CLOSURE.json).
