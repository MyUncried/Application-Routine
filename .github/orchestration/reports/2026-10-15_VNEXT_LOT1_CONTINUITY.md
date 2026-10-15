# VNext — lot 1 : continuité du pilote, raccordement minimal

Date : 15 octobre 2026. Mission VNEXT-LOT1-CONTINUITY-20261015.
Base : main `6c2764d41ec3686e485f240657ab2c56fefe5260`, revérifiée avant publication.
Portée : PE-31 / PE-35 / PE-39. Travail isolé ; aucun développement ou pilotage PRE-4.

**État courant : CLOS AVEC LIMITE ACCEPTÉE.** Le bilan final en fin de document supersède l’état intermédiaire de non-clôture conservé pour traçabilité.

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

## État intermédiaire conservé — avant la décision de clôture avec limite acceptée

**État intermédiaire supersédé par le bilan final : le lot 1 n’était pas clos.** Ce candidat fournit et raccorde un retour exécutable commun ; il ne constitue pas un moteur autonome d’exécution de la mission.

Aucune capacité exposée dans cette session ne permet d’installer un intercepteur de fin de tour dans l’application Work. Le champ continuation et les instructions normatives ne peuvent pas, à eux seuls, empêcher une conversation de terminer son tour. Un appelant qui ne lit que error.message peut aussi ignorer les métadonnées : il faut observer la consommation dans le pilote réel, pas l’inférer du wrapper.

L’automation actuelle n’est autorisée qu’à consommer les résultats ; élargir son prompt au pilotage de PRE-4 doublerait le pilote actif et dépasserait cette mission. Aucun changement de cette automation, destination ou déclencheur n’est effectué.

Critères initialement envisagés avant clôture PE-31/39 (supersédés comme conditions de clôture par la décision propriétaire ci-dessous ; ces faits ne sont pas déclarés démontrés) :
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


## Bilan final — clôture avec limite explicitement acceptée

Le propriétaire demande : « Tu test / certifies VNext avec cette évolution, on clôture avec la limite connue et on passe à la suivante. Je ne vais pas garder des points ouverts indéfiniment s'ils ne peuvent être refermés. »

Cette décision remplace le critère intermédiaire de non-clôture. **PE-31, PE-35 et PE-39 : CLOS AVEC LIMITE ACCEPTÉE**, sur le mécanisme commun livré et qualifié ; l'objectif d'une poursuite Work toujours automatique n'est pas déclaré garanti. La limite n'est ni une action encore confiée à quelqu'un ni un reliquat de preuve à attendre indéfiniment. Réouverture uniquement sur un fait ou une capacité nouveaux.

### Qualification exacte du candidat

Candidat `f59f99b3661f79fef04bbcc5f9063fd7cdf478ee`, [PR #366](https://github.com/MyUncried/Application-Routine/pull/366).

| Contrôle | Linux | Windows | Preuve |
|---|---|---|---|
| Contrôles VNext, y compris les deux identités et le nouveau retour | 576 PASS, 0 FAIL, 0 SKIP | 575 PASS, 0 FAIL, 1 SKIP | [38743638498](https://github.com/MyUncried/Application-Routine/actions/runs/38743638498), jobs 116451451652 / 116451452065 |
| Compatibilité historique sur le candidat exact | 1561 PASS, 0 FAIL, 2 SKIP | 1559 PASS, 0 FAIL, 4 SKIP | Même run, jobs 116451451319 / 116451451734 ; agrégat historical-platform-coverage PASS |
| Suite protocolaire | 1561 PASS, 0 FAIL, 2 SKIP | 1558 PASS, 0 FAIL, 5 SKIP | [38743638473](https://github.com/MyUncried/Application-Routine/actions/runs/38743638473), jobs 116452098999 / 116454142737 |

Séries recouvrantes : ne pas additionner ces nombres en tests uniques. Le SKIP Windows des contrôles VNext concerne le test de streaming binaire ; il n'est pas présenté comme réussi sur Windows. Les parcours de continuité VNEXT-CONTINUITY-A/B passent sur les deux plateformes. Les contrôles de couverture historique agrégés ont réussi. L'audit indépendant et le signal Work sont SKIPPED dans cette exécution : aucune revue indépendante ni réception Work réelle n'en est inférée.

Archives téléchargées et SHA-256 physiques vérifiés :
- qualification-controls-Linux, artifact 11976841725 : `bf1f09bbdb097b0dc04d5c23f8d688f7da1ad7eadae20f85e82f57c8186d31e5` ;
- qualification-controls-Windows, artifact 11978062098 : `270addfb4c1ad715c6c2bab83ef29041059e4451ae41e64bfd074fd5353e773d` ;
- historical-equivalence-Linux, artifact 11976716799 : `c53c22fb7fe7b1cc1384c2046feeca1a8a2becca49bc451e7e419341c4602afe` ;
- historical-equivalence-Windows, artifact 11979305881 : `4f953e73d5739f4a29d02f41d611a0a3280c588422243581132ea0f89563efdb`.

### Réserves distinctes observées dans le précontrôle existant

Le job protocol-windows-preflight est SUCCESS : suite protocolaire, queue PowerShell 5.1, précontrôle jetable et conservation des preuves réussis. Le manifeste est PASS, HEAD attendu/observé exact, aucun écart de fichiers hors fixture, aucun appel Claude.

Deux réserves sont conservées sans les convertir en réussite :
- récupération réelle historique du run 34606534268 : archive introuvable, reçu `NON_CERTIFIED / HISTORICAL_RECOVERY_ARTIFACT_UNAVAILABLE` ; ce diagnostic est explicitement non bloquant dans le workflow existant. Aucune récupération réelle historique n'est certifiée ici ;
- baseline produit Windows : Jest 1969 PASS / 1 FAIL ; TypeScript et lint PASS. Le seul échec, `targetSchema.test.ts`, compare les octets de migration001.ts. Cause reproduite exactement : fichier LF → SHA-256 `2b3b1bab6399ef0cd688886d8530588ab73eef377e0bb90335dff48ddfa66add` (attendu), même fichier CRLF → `15df08e3b406243a946edd4b8513748e57d202f01c35f24a5df309c13a4c67bf` (observé Windows). Aucun fichier produit ni ce test n'est modifié par #366. C'est une réserve du contrôle produit sensible aux fins de ligne, pas un échec d'un test VNext. La baseline produit complète n'est pas certifiée verte.

Archives additionnelles téléchargées et hashes physiques vérifiés : précontrôle artifact 11978824007, `85808ffade871ac35c947ed1d90707d56dadf0e8c09d6940e057781ed6c5e670` ; réserve récupération artifact 11978619260, `d5daa2d881ed22d7ae03aa4e333bb6c5865c43869b56d81fe6b72a96c2235f3b`.

Aucun contrôle n'a été retiré, passé sous silence ou rendu non bloquant par cette mission. Le maintien de ces réserves hors périmètre n'empêche pas la qualification du changement commun ni la clôture avec limite acceptée.

### Intégration et portée de la certification

Intégré à main par `4d7e760bab23ce123a60bee9de380ad002999f5c`. Vérification après fusion : les quatre modules exécutables et le fichier de tests livrés correspondent exactement aux octets du candidat qualifié. Les présentes modifications de clôture sont documentaires ; elles ne changent pas le moteur qualifié. Contrôle du registre après mise à jour : 11 PASS / 0 FAIL ; git diff --check PASS. Les 41 besoins sont conservés, dont 21 ouverts et 20 fermés au format historique ; trois fermetures sont explicitement assorties de la limite acceptée.

La certification porte sur le comportement exécutable contrôlé et sa non-régression sur Linux/Windows. Le mécanisme est disponible par défaut à tous les nouveaux appels des points d'entrée concernés, sans activation de tranche. Cela prouve sa livraison dans VNext, pas une nouvelle utilisation produit ni la poursuite effective du pilote Work destinataire.

### Limite et protections conservées

Le protocole fournit la prochaine action et conserve l'erreur ou le résultat réel. L'application Work peut néanmoins terminer un tour ; aucune capacité accessible ne permet ici de l'en empêcher ou de forcer sa réouverture. La correction sémantique arbitraire n'est pas devenue une boucle autonome. Aucun modèle, retry supplémentaire, nouvel ordonnanceur ou deuxième pilote n'a été ajouté.

Les exigences de fraîcheur GitHub, provenance, intégrité, archives, déduplication, possession et approbation utilisateur restent applicables. Aucun contrôle existant n'est supprimé ou assoupli par la clôture. Aucun changement du comportement produit, de V2, de PRE-4, de #344 ou #364. PE-32/#365 reste sans fusion sur instruction du propriétaire.

### Point de reprise

Le lot 1 n'est plus ouvert. Le registre courant expose 21 sujets ouverts ; les constats historiques ci-dessus restent des faits datés. Le lot suivant doit être pris depuis cette vue réconciliée, sans recréer une demande de preuve de poursuite Work pour clôturer le lot 1.
