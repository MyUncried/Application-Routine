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
