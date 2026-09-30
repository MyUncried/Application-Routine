# PR250 — Lot final de convergence et reprise causale

Mission : corriger les familles du dernier audit, conserver un registre cumulatif vérifiable, qualifier une fois le candidat final et reprendre la chaîne #250 / #252 / PRE-1 après satisfaction des barrières.

Branche : `protocol/next-evolution-r1-r3-r4-continuity-20260928`.
Commit de départ : `59d096c028d11d9ff9fc8c2bc0bdcbbe589408b8`.
Base : `5ea680c53b6ff035c1afa126273c80c64e1e7eed`.
Dernier audit de départ : `36655010583`, REVISE, 1 BLOCKING / 5 MAJOR / 4 MINOR ; commentaire `5902610791`.

## Périmètre demandé et réellement traité

Corrections protocolaires et bancs de vérification ; aucun fichier applicatif modifié. Registre cumulatif : huit audits, 103 occurrences conservées, 26 familles. Les 64 axes, PE27–PE38, obligations de preuve et barrières de fusion sont conservés. Les constats antérieurs ne sont pas réputés fermés par disparition. Le dernier appel indépendant reste complet.

## Modifications et constats

- F01/F08 : résolution des imports relatifs et aliases par spécificité, cibles de repli, fichiers index, imports nommés/par défaut/namespace et réexports statiques nommés. Un import inutilisé, un mauvais export ou un cycle ne prouve pas le réemploi. Propagation du helper dans le runtime réellement figé de revue.
- F02 : détection des écritures REST contents/Git-data via fetch, wrappers et gh api ; méthode implicite avec payload incluse. Les writers de publication/consommation sont déclarés par hash du fichier complet normalisé LF ; toute autre version invalide la déclaration. La queue conserve seulement son opération à ligne exacte. Les lectures ne sont pas assimilées à des écritures.
- F03 : extraction des preuves machine ancrée sur les lignes de délimitation ; citation de tag dans la prose ignorée et doublon explicitement refusé.
- F04 : frontière SEMANTIC refuse aussi les chemins racine plausibles et les références explicites de fonction.
- F05 : un constat NON_UI_COVERAGE peut fermer la lacune réelle par ajout d’exigences NON_UI couvrant seulement des chemins mutables non-test non couverts du scope préexistant, et leurs bindings de tests. Les exigences acquises et chemins sans lien restent protégés.
- F06 : le scope est relu dans le blob du plan approuvé et comparé au scope demandé, indépendamment des blobs protégés inchangés. Les protections de transition et autorisations restent en place. La description initiale d’un bypass doit être jugée à l’échelle de cette chaîne ; ce rapport ne transforme pas un soupçon local en faille démontrée.
- F07 : preuve machine seule trop grande : diagnostic terminal `IMPLEMENTATION_EVIDENCE_TOO_LARGE`, sans boucle sur une prose vide.
- F09 : normalisation des champs opposables avant empreinte, IDs des entrées déjà normalisées conservés.
- F10 : priorité explicite de chaque DET, vérifiée sans exemption de préfixe ; DET-10 reste le report AST général préexistant.

Les instructions d’audit exigent règle préexistante, scénario au SHA, conséquence, dépendance et preuve de fermeture. Le prompt embarque seulement la synthèse du registre ; le registre complet est une source obligatoire présente au checkout. Il n’impose pas APPROVE et ne limite pas la découverte de vrais défauts dans le périmètre.

## Preuves locales et deuxième passe

`node tests/kodjo/run-all.js` : 801 tests, 795 PASS, 0 FAIL, 6 SKIP, Node 24.19.0, durée finale 19,475 s. Les skips d’environnement ne sont pas convertis en PASS. Sept nouveaux tests de familles sont inclus, avec plusieurs variantes positives et négatives ; les suites existantes de transition, autorisations, reprise et runtime restent actives.

`node scripts/kodjo/validate-workflows.js` : PASS.
`python3 scripts/kodjo/validate-workflow-syntax.py` : 64 workflows acceptés.
`node scripts/kodjo/scan-remote-write-capability.js` : NO_UNDECLARED_REMOTE_WRITE_CAPABILITY.
`git diff --check` : PASS sur les fichiers locaux modifiés.

Les premiers essais locaux ont rencontré EPERM dans spawnSync sous sandbox, laissant Git attendre stdin ; les processus de ces essais ont été arrêtés. L’exécution hors sandbox a produit les résultats ci-dessus. Le snapshot local ne contenait pas les objets du baseline historique : commit, arbres et 16 blobs ont été récupérés et matérialisés avec leurs hashes Git exacts, sans remplacement artificiel, sans désactivation de test ni modification des sources produit. Le tokenizer requis par le workflow a également été réutilisé depuis l’installation locale du même runtime.

La suite complète a détecté une dépendance manquante dans la liste de gel du reviewer après extraction du helper. Le workflow réel et son test de consommation ont été corrigés ; deuxième passe complète PASS. Les variantes LF/CRLF et dérives de priorités sont testées. La qualification distante Windows/PowerShell et le préflight applicatif du candidat restent nécessaires avant clôture ; les succès du HEAD précédent ne sont pas réutilisés comme approbation du nouveau HEAD.

## Absorption de #252

Le patch des six fichiers de #252 a été relu. Le candidat contient les propriétés fermées de décision dérivées de `scan.candidates`, classifications par candidate_kind, reconstruction dans l’ordre du scan et passage réel de scan.json à la requête INITIAL finale ; les tests correspondants passent. Le traitement non bloquant de l’ancien artefact de récupération expiré est aussi présent, sans dispense du préflight courant. Les resserrements de contrat décidés lors des audits de #250 restent applicables ; l’ancien fallback final sans scan n’est pas réintroduit. #252 ne sera fermée comme absorbée qu’après intégration du candidat approuvé.

## Hypothèses, limites et vérifications restantes

- Le registre conserve les constats et l’analyse de pilotage, pas une certification indépendante de leurs 103 fermetures individuelles. L’audit doit produire une disposition prouvée des familles.
- Les formes dynamiques d’import et le resolver AST général restent hors de la preuve statique de ce helper ; aucune preuve n’est fabriquée pour ces formes.
- La détection statique de capacités REST ne prétend pas résoudre un programme arbitraire ; ses formes reconnues et ses declarations sont testées.
- Pas de test sur appareil réel dans cette mission protocolaire. Toute obligation device applicable à une livraison produit reste séparée et NON EXÉCUTÉE ici.
- Aucun nouvel audit indépendant exécuté au moment de la rédaction. La qualification exacte Linux/Windows puis l’unique nouvel appel sont attendus après publication.

## État Git, fichiers et commit final

La préparation locale est un snapshot partiel vérifié contre le manifeste Git exact. Il ne constitue pas un checkout applicatif complet propre. La publication est un arbre basé sur l’arbre distant exact de `59d096c...`, avec uniquement les fichiers de ce lot ; les fichiers absents du snapshot ne sont pas supprimés. Le commit final est le commit contenant ce rapport, lié dans la PR et dans `candidate_sha` des preuves distantes. Aucune auto-fusion avant verdict APPROVE exact et toutes les barrières satisfaites.

Fichiers du lot : trois workflows (audit indépendant, revue d’implémentation, finalisation), spécification 0.6.51, mission et matrice d’audit, registre cumulatif et ce rapport ; vérificateurs audit/révision/checkpoint/revue UI, collecteur, scanner REST, helpers identités/frontières/composants ; tests de convergence, visual-correction, independent-audit-regressions et consommation du runtime.

## Reprise PRE-1 et sortie bornée

PRE-1 reste issue #249, baseline `e216294506bed87dd80855937e3fabfbfa322b82`, plan `5874870872`, revue REVISE `5878031654`. Reprise préparée avec cette paire causale, aucun nouveau cycle ou baseline.

Un seul appel indépendant supplémentaire après qualification complète. APPROVE exact et barrières satisfaites : intégrer #250, fermer #252 comme absorbée, reprendre PRE-1. REVISE : arrêt explicite, réserves rapprochées des critères existants, aucune boucle automatique ou auto-APPROVE. Publication défaillante d’un audit valide : réparer la publication sans refaire l’appel. Les états réels seront publiés sur les PR et la chaîne causale.
