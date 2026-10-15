# VNext — lot 1 : continuité du pilote, raccordement minimal

Date : 15 octobre 2026. Mission VNEXT-LOT1-CONTINUITY-20261015.
Base : main `6c2764d41ec3686e485f240657ab2c56fefe5260`, revérifiée avant publication.
Portée : PE-31 / PE-35 / PE-39. Travail isolé ; aucun développement ou pilotage PRE-4.

## Principe propriétaire et décision de conception

Instruction du propriétaire : « pas d'usine à gaz, pas de sur contrainte qui rigidifie et ajoute des conditions de blocage au protocole - encore moins si je ne suis pas au courant, il faut rester raisonnable, pas de suppression de règles ou contrôles existants, sauf s'il sont substitués par les nouveaux ou s'ils sont rendus inutiles - il faut le justifier ».

Application :
- Réutiliser vnext-chain, vnext-live-chain et vnext-error-policy ; un seul module de retour de continuité.
- Aucun workflow, ordonnanceur, daemon, verrou, permission, gate, compteur d’approbation ou activation par tranche ajouté.
- Aucune condition d’admission modifiée ; aucun contrôle supprimé. Les contrats et hashes des résultats scellés restent identiques.
- Le retour ne lance aucune opération, aucun modèle ni retry ; il ne modifie pas l’autorité existante du pilote.
- Pas de relecture/recalcul du gros catalogue : l’identité produite est réutilisée en mémoire. Un petit hash de progression décrit le retour seulement.
- Une erreur dans la production de ce retour ne remplace ni le succès ni l’erreur primaire : elle ne devient pas un blocage supplémentaire.

Une boucle autonome côté Work, un nouveau watcher ou une automation par tranche ont été écartés : ils ajouteraient concurrence et activation sans résoudre de façon démontrée le contrôle de fin de tour du client.

## Constat et portée du défaut

Les opérations canoniques existent mais leur résultat RECORDED/erreur n’exprime pas la distinction opération terminée / mission terminée. vnext-error-policy était testé mais n’orientait pas la sortie du point d’entrée commun. Le consommateur de transport est un autre acteur : son PROCESSED n’autorise pas le lancement du prochain travail du pilote.

État externe lu : automation 6acfddf6231c8191867783a49d7a55a8 activée, destination 6acfe188-8b54-83eb-8a60-05d95fd9425e, prompt toujours limité à la consommation ; dernière exécution déclarée 15/10 13:02 UTC. Ces métadonnées ne démontrent ni une action du pilote ni son routage.

Travaux actifs relus :
- #364 reprend une session de revue interrompue : fichiers relais/workflow/interrupted-session, laissés intacts.
- #365 porte PE-32 : aucune fusion, conformément à la décision utilisateur.
- #356 reste le transport ; #344 reste la variante Claude non modifiée.
- Aucun run ou modèle produit lancé. Les modifications live-chain se situent en fin de module et ne remplacent pas le précontrôle de PE-32 ; interfaces à réconcilier à leur intégration respective.

## Mécanisme appliqué dans le candidat

1. Tous les appels CLI existants renvoient continuation après succès ; les erreurs gardent leur code de sortie et stderr, avec un retour JSON de continuité sur stdout.
2. Les opérations de la bibliothèque vnext-live-chain enrichissent leurs erreurs par le même module ; aucun flag par tranche n’est nécessaire. Les résultats scellés de la bibliothèque ne sont pas modifiés.
3. La classification existante oriente la suite : cause calculable à corriger, résultat archivé/couverture à traiter, mapping à qualifier, ou diagnostic technique sans retry implicite.
4. RECORDED n’atteste jamais l’objectif global. Un gate propriétaire effectivement publié reste WAITING_OWNER ; une ambiguïté doit d’abord devenir une question actionnable.
5. Les erreurs explicites de quota Claude/authentification ne sont plus prises pour un défaut déterministe du protocole du seul fait du préfixe VNEXT_. Le code d’approbation propriétaire est reconnu avant la règle générale de préfixe. Ce sont des corrections de classement, pas des changements des contrôles d’approbation.
6. Les répétitions de même identité demandent réconciliation ; le retour n’accorde aucun retry supplémentaire. Les protections existantes d’archives, possession, déduplication et approbation restent les seules autorités.
7. Le pilote utilise son checkpoint/rapport existant pour conserver identité et prochaine action. Aucun nouveau fichier de suivi par tranche n’est obligatoire.

Les valeurs ACTION_REQUIRED / WAITING_OWNER décrivent le retour au pilote, pas de nouveaux états d’admission ou une migration des quatre états du transport. Les anciennes preuves ne sont pas réécrites.

## Qualification réalisée

### Parcours utile sur deux identités

Le même exécutable vnext-chain.js est utilisé, avec dépôts Git de qualification réels, sources exactes et deux identités distinctes VNEXT-CONTINUITY-A / VNEXT-CONTINUITY-B :
- source volontairement incohérente → refus du producteur réel, aucun résultat scellé écrit ;
- sortie indique ACTION_REQUIRED, cause à corriger, mission non terminée, aucun retry supplémentaire accordé ;
- correction technique fournie par le pilote de qualification → préparation acceptée par le même point d’entrée ;
- résultat conservé avec hash valide et identité de tranche exacte ; suite indique de poursuivre la revue, sans prétendre que celle-ci est approuvée ;
- appel direct bibliothèque sur erreur reçoit aussi ce retour, sans activer une option.

Il s’agit de préparations locales contrôlées. Ce n’est pas une preuve d’admission d’une opération distante, d’un déclenchement de workflow, de réception Work ou d’utilisation produit. Aucun appel Claude réel n’est nécessaire à ce contrôle.

### Cas négatifs et compatibilités

- Quota, authentification, accès refusé et erreur inconnue ne deviennent ni approbation ni relance payante.
- Revue partielle → traiter la couverture acquise ; REVISE → corriger dans l’autorité existante ; résultat non approuvé → lire l’archive, pas réinvocation.
- Gate propriétaire publié conservé ; simple statut sans référence ne fabrique pas un gate.
- Répétition/reprise d’un même retour → réconcilier ; nouvelle identité → progrès distinct.
- Objet de sortie scellé inchangé, erreur primaire et erreur immuable conservées, rejet asynchrone conservé.
- Pas de recalcul d’une charge volumineuse ni exposition de texte sensible dans le nouveau retour.
- Les tests existants d’approbation, de source, de plan, de reçu Work, de claim et de recovery passent.

### Exécutions et diagnostic

Premier lancement ciblé : 23 PASS / 2 FAIL ; les deux échecs sont ENOENT sur tests/fixtures/vnext12, absent du sparse checkout local. Restauration des fichiers versionnés exacts, sans changer le code pour contourner le test.

Ensuite :
- vnext-pilot-continuity, foundations, post-delivery-revision, live-chain, approval-handoff, work-execution et review-scope : **73 PASS / 0 FAIL / 0 SKIP**.
- Après refinements de classement quota/authentification et des métadonnées de progression : pilot-continuity, foundations, transport-security : **27 PASS / 0 FAIL / 0 SKIP**.
- Séries recouvrantes, pas un total de 100 tests uniques.
- node --check des deux points nouveaux/modifiés : PASS ; validate-workflows.js : PASS ; git diff --check : PASS.
- Le test de sécurité génère volontairement un YAML invalide et vérifie son refus ; son diagnostic attendu n’est pas un échec de qualification.

Exécution locale Linux. Windows et CI du candidat non revendiqués avant résultat. Aucun dispatch manuel de campagne globale.

## Limite externe et critère de non-clôture

**Le lot 1 n’est pas clos.** Ce candidat fournit et raccorde un retour exécutable commun ; il ne constitue pas un moteur autonome d’exécution de la mission.

Aucune capacité exposée dans cette session ne permet d’installer un intercepteur de fin de tour dans l’application Work. Le champ continuation et les instructions normatives ne peuvent pas, à eux seuls, empêcher une conversation de terminer son tour. Un appelant qui ne lit que error.message peut aussi ignorer les métadonnées : il faut observer la consommation dans le pilote réel, pas l’inférer du wrapper.

L’automation actuelle n’est autorisée qu’à consommer les résultats ; élargir son prompt au pilotage de PRE-4 doublerait le pilote actif et dépasserait cette mission. Aucun changement de cette automation, destination ou déclencheur n’est effectué.

À démontrer avant clôture PE-31/39 :
- résultat/refus reçu par le pilote déjà propriétaire ;
- lecture fraîche de GitHub et action suivante autorisée effectivement exécutée ;
- reprise après interruption sans doublon ;
- arrêt sur vrai gate, accès réellement bloqué ou absence de progrès justifiée ;
- attente externe associée à un réveil effectivement observé.

Le champ github_refresh_required_before_diagnosis rappelle une obligation existante ; il ne prétend pas qu’un git rev-parse local constitue une lecture fraîche GitHub. Le présent code ne force pas cette lecture et ne la fabrique pas.

PE-35 reste partiel : le classificateur est maintenant raccordé au retour commun dans le candidat ; les mécanismes bornés existants sont conservés. Une correction sémantique arbitraire n’est pas automatiquement exécutée par ce module. Ni ce candidat ni ses tests ne prouvent une poursuite Work autonome.

## Fichiers et livraison

Modules : vnext-pilot-continuity.js (nouveau), vnext-error-policy.js (classement), vnext-live-chain.js (erreurs bibliothèque), vnext-chain.js (retours CLI).
Test : vnext-pilot-continuity.pilot.js (nouveau).
Documentation normative : spécification VNext VNX-00 et contrat Work ; ce rapport conserve l’impact, les contrôles et les limites.

Aucun fichier produit, workflow, preuve historique ou autorisation modifié. Publication en PR séparée, base exacte ci-dessus ; commit final identifiable dans la PR et par git log du présent rapport. Le suivi du backlog indique candidat / tests locaux / non intégré / non démontré en Work réel ; aucune clôture artificielle.

