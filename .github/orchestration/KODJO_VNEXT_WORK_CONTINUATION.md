# Retour commun des opérations VNext vers Work

## Contrat commun

### Pilotage : opération terminée et mission terminée

Le principe de simplicité/proportionnalité VNX-00 s'applique à ce raccordement :
pas de nouveau workflow, verrou, approbation, fichier de configuration par tranche
ou remplacement des contrôles existants.

Le point d'entrée `vnext-chain.js` fournit automatiquement un champ de retour
`continuation` après succès et échec. Les appels directs à la bibliothèque commune
`vnext-live-chain` enrichissent aussi leurs erreurs sans changer les contrats
scellés ni leurs hashes. La politique d'erreurs existante est réutilisée pour
orienter le traitement ; une catégorie n'accorde aucun droit ni retry.

`ACTION_REQUIRED` demande au pilote déjà autorisé de relire l'état GitHub actuel,
réutiliser les sorties acquises et poursuivre l'action utile dans son autorité.
Un manque de qualification de mappings conduit à cette qualification, pas à un
nouvel appel sur le gros paquet refusé. Une revue partielle conduit au traitement
de sa couverture existante ; un REVISE à une correction dans le périmètre admis.
Une ambiguïté demande d'abord de matérialiser la question existante. Seul un gate
propriétaire effectivement publié donne `WAITING_OWNER` dans ce retour CLI.

Le pilote reporte le résultat, son identité et la prochaine action dans son
checkpoint ou rapport existant. Une erreur technique n'est pas un arbitrage
produit ; un résultat d'opération n'atteste pas l'objectif global. Une répétition
du même état demande réconciliation et diagnostic, jamais répétition aveugle.
Une attente externe garde ses preuves de lancement/réveil observées ; l'absence
de ces preuves ne devient pas une promesse de continuation. Les contrôles de
propriété, déduplication et admission restent ceux déjà en place.

Ce retour n'intercepte pas la fermeture d'un tour de l'application Work et ne
constitue pas un exécuteur autonome. Il ne transforme pas l'automation limitée à
la consommation en pilote d'une tranche. La poursuite effective et l'observation
de son déclencheur ne sont pas établies par ce retour ; ni le champ
`continuation` ni un test local ne prouvent cette réception ou cette action.
Cette limite est explicitement acceptée pour la clôture du lot 1 (voir disposition finale).

Le retour après une opération est commun à toutes les tranches VNext enregistrées : résultat archivé → vérification du transport → signal unique → événement PR synchronize → automation Work → accusé durable et reprise. Tranche, issue, demande, source, run/tentative et archive sont des données ; aucune condition PRE-4 n'est inscrite dans le publisher.

Le binding scellé KODJO_VNEXT_WORK_TRANSPORT.json relie la PR de transport commune, sa branche, l'automation et la conversation observées. La PR de transport n'est jamais une PR de livraison et ne porte aucun code métier. Elle reste ouverte pour les signaux de toutes les tranches. L'ancienne automation V1.3/#19 et le signal de qualification/#269 restent historiques ; aucune preuve de réveil antérieure n'est reclassée en preuve du binding courant.

## Emission

Le workflow kodjo-vnext-work-continuation.yml réagit à la fin du workflow de relais commun actuellement intégré. Il s'appelle désormais « KODJO VNext — ChatGPT agent relay » ; son ancien nom PRE-4 reste écouté pour les fins de runs historiques ; le publisher utilise la tranche portée par la demande, son bootstrap et son activation, pas ce nom. L'inventaire allowed_workflows reste fermé et versionné. Une nouvelle famille d'exécuteur exige l'inscription explicite de son producteur/préfixe d'archive et, si son contrat de sortie diffère, un adaptateur de ce contrat ; pas un nouveau mécanisme par tranche. Le même abonné raccorde le relais, les opérations VNext de la queue, les tests et la clôture distante, ainsi que les CI des candidats VNext. La queue legacy est ignorée après vérification du routage ; aucun exécuteur V2 n'est modifié. Les adaptateurs de provenance utilisent les demandes Git et les jobs/archives du run, jamais un titre de tranche.

Un résultat déjà terminé avant intégration peut être signalé par un unique fichier scellé .github/orchestration/requests/vnext-work/publish/<run_id>.json. Ce contrôle ne relance pas le reviewer. Les deux entrées consomment le même publisher et le même binding.

Le publisher exige un run terminé sur main du dépôt autorisé, un acteur autorisé par la tranche, le bootstrap et son activation exacts, l'issue ouverte, une archive unique liée au run/tentative/tête, le SHA-256 physique du ZIP, le manifeste scellé de ses fichiers, et un résultat/checkpoint concordant avec la demande. Les membres ZIP absolus, avec remontée de chemin, dupliqués ou symlinks sont refusés avant extraction. Les octets binaires sont lus explicitement, jamais imprimés comme terminal UI.

Le résultat peut être un échec après invocation, notamment une revue partielle. Le signal garde error/model_invoked ; il n'invente ni non-invocation ni approbation. Le champ semantic_validation_required est toujours vrai : le pilote doit vérifier le reçu métier, pas traiter le signal comme un verdict accepté.

Le job d'émission est sérialisé. Ses seules écritures sont blob/tree/commit non forcé sur la branche de transport, un seul fichier de signal sous .github/orchestration/requests/vnext-work/signals/. La clé déduplique demande/opération/run/tentative. Un signal identique est réutilisé ; un signal différent pour la même clé, une destination fermée/étrangère ou une tête déplacée sont refusés. Le publisher n'appelle aucun modèle et ne dispose d'aucune capacité d'implémentation ou d'approbation.

Les trois chemins de données (README de transport, signals/*.json et publish/*.json) sont exclus des CI lourdes et classés non normatifs. Le publisher, son workflow, le binding et ce contrat restent qualifiés ; un fichier de code sous ce namespace ou une modification mixte n'est pas exempté. Les filtres miroirs de CI sont propagés sans changer les exécuteurs V2 ni leurs permissions.

## Réception Work

L'automation suit uniquement les mises à jour de commits de la PR de transport observée, avec son auteur résolu par GitHub. Aucun polling ni cadence parallèle n'est ajouté. Le prompt inscrit dans l'automation exige : lecture GitHub courante, vérification des signaux/archives/provenance, déduplication, accusé [VNEXT_WORK_SIGNAL_RECEIVED], recherche d'opérations actives, puis traitement du résultat jusqu'au prochain gate réel. Un accusé traité [VNEXT_WORK_SIGNAL_PROCESSED] doit citer signal_key et signal_commit_sha ; une seconde notification ne rappelle jamais Claude.

Le binding, le contrat et les scripts du consommateur se lisent sur `main` ; les signaux, wakeup et reçus se lisent à la tête exacte de la branche de transport indiquée par le binding. Le runtime du consommateur est préparé depuis `main`, puis les données de transport sont récupérées séparément sans remplacer ses scripts par ceux de la branche de transport. Le champ `conversation_id` fourni à la prise de charge provient du binding courant ; une destination historique admise concerne le signal scellé, pas le destinataire du nouveau reçu.

Avant la consommation, l'exécution automatique vérifie ses propres capacités : lecture des deux références GitHub, runtime Node, scripts et dépendances accessibles, et un accès GitHub autorisé en écriture sur la branche de transport. `gh` est un adaptateur possible, pas un prérequis commun : son absence n'interdit pas l'emploi du connecteur GitHub. La présence de ces moyens dans une session manuelle ne prouve pas leur présence dans l'automation. Une demande d'autorisation du connecteur reste un blocage visible tant qu'elle n'est pas accordée ; aucun reçu n'est fabriqué pour la contourner.

Si `gh` est absent, le pilote utilise les modes `step-claim` et `step-finish` de `consume-vnext-work-signal.js`. Ils exécutent le même consommateur et retournent uniquement la prochaine requête au connecteur : `{endpoint, method, data, allowMissing}`. Le pilote exécute cette requête avec l'outil GitHub autorisé, conserve sa réponse et relance le mode avec le transcript ordonné. Le contexte (binding, signal, action et entrée privée) est haché ; une entrée ou requête différente, une réponse manquante, un transcript surnuméraire, une tête déplacée ou une charge étrangère arrête la consommation. Les réponses déjà enregistrées sont relues sans exécuter une deuxième fois leurs écritures. `gh` et le connecteur partagent ainsi les mêmes fonctions `acquire`, `transaction` et `finish`, sans réimplémentation des contrôles dans le prompt.

La prochaine requête contient le contenu canonique calculé par les fonctions livrées. Les outils blob/tree/commit/ref sont limités à cette requête ; le pilote relit la tête avant l'avancement non forcé, avec `expected_sha` lorsque le connecteur l'expose. Une absence de fichier n'est admise que sur 404 confirmé ou arbre Git complet, jamais sur erreur d'accès. L'entrée privée conserve le même nonce de possession pendant cette consommation ; elle ne peut être remplacée par celle d'un autre consommateur. Le reçu cite le checkpoint réellement publié et relu.

La prise en charge ne vaut pas validation des archives : si le signal scellé et sa provenance sont vérifiés mais qu'une archive ne peut pas être contrôlée, la seule continuation admissible est `BLOCKED_WITH_EVIDENCE`, avec la limite exacte et ses preuves. Un reçu PROCESSED dans cet état prouve seulement l'enregistrement durable du blocage ; il ne prouve ni conformité métier ni reprise de développement. Aucun marqueur de validation complète du signal n'est publié avant le contrôle effectif des archives.


Le publisher conserve automatiquement, dans le même commit que le signal, une copie de transport des octets ZIP en Base64 dans `.github/orchestration/requests/vnext-work/consumption/archive-cache/<sha256>.json`, avec ses segments ordonnés, son artifact_id et sa taille. Le chemin de chaque copie est dérivé du SHA-256 de l'archive scellée ; un wakeup peut également référencer les copies présentes à son commit exact. Les signaux historiques restent intacts et gardent leur voie de lecture historique lorsqu'aucune copie n'est disponible. Cette voie de lecture via le connecteur GitHub évite les URL temporaires inaccessibles au runtime ; elle ne substitue aucune attestation aux octets. Le consommateur reconstruit chaque ZIP, exige le SHA-256 du signal scellé, puis contrôle les membres sûrs, tailles et hashes de tous les fichiers avec `decode` de `lib/vnext-work-archive-cache.js`, `extractArchive` du publisher et le manifeste de fichiers existant. Copie manquante, tronquée ou différente : blocage explicite, jamais conformité. Ces copies sont des données de transport non normatives, pas des claims ni des reçus. Les limites de lecture et les autorisations d'écriture restent signalées séparément.

Un déclenchement enregistré, un résultat visible dans Planifié et un retour dans la conversation pilote sont trois observations distinctes. Le bilan indique son emplacement réel ; une consigne de prompt ou le champ conversation_id du binding ne suffisent pas à garantir le routage de l'interface.

L'approbation propriétaire du plan exact reste obligatoire avant développement. Les arbitrages produit ne peuvent être déduits d'un événement synchronize. Le pilote traite seul transport et tests techniques ; aucun copier-coller, fermeture d'application ou redémarrage ne doit être demandé pour compenser un défaut du relais.

## Preuves et limites

Une automation créée/activée n'est qu'une configuration. Un commit signal publié n'est qu'une émission. Le réveil courant n'est établi qu'après réception effective et accusé durable de cette automation dans la conversation liée. Les tests avec API/processus simulés ne prouvent pas cette réception.

Une archive de revue absente, perdue, altérée ou sans provenance empêche le signal métier et laisse le job en échec technique visible. Pour les autres exécuteurs, une archive métier absente produit RESULT_ARCHIVE_MISSING avec model_invoked=null ; aucune non-invocation n'est inférée. Une archive altérée demeure un refus, repris comme diagnostic par la récupération. La publication de ce diagnostic et son chemin de reprise doivent rester traçables ; cela n'autorise aucune relance payante. La réception réelle et la consommation restent à vérifier sur un résultat existant, sans nouveau parcours jetable ni nouvelle certification globale.

## Consommation atomique et récupération

### Lecture commune de reprise et messages — lot 2

`inspect-vnext-work.js` reconstitue en lecture seule le travail depuis les références
GitHub réellement observées : binding sur main, signaux, claims, checkpoints et
reçus sur la branche de transport. Les références restent figées pendant la lecture ;
un changement de tête impose une nouvelle observation, jamais un assemblage annoncé frais.
Chaque reçu est lié au checkpoint effectivement publié et à son ascendance Git.
Le résultat distingue un signal traité de la mission terminée et conserve la
prochaine action, y compris après PROCESSED. Il ne divulgue pas les nonces de possession,
ne prend aucune charge et n'accorde aucune autorisation d'écriture ou de retry.
Sans `gh`, `step-inspect transcript.json` utilise le même adaptateur de rejeu
`vnext-connector-step` que step-claim/step-finish : prochaine lecture GET retournée
au connecteur autorisé, réponse normalisée conservée, contexte et ordre contrôlés.
La liste globale des runs est paginée puis filtrée sur les producteurs inscrits ;
aucun endpoint privé supplémentaire ni adaptateur particulier à une tranche n'est requis.

La fin du consommateur retourne un message utilisable dans son chat d'exécution :
résultat réel, erreur/verdict éventuels, état, prochaine action et preuves. Ce message
n'atteste pas une publication dans une autre conversation. Une erreur dans ce retour
indicatif ne rend pas invalide un reçu déjà publié et vérifié.

La récupération horaire existante utilise cette même lecture par défaut. Elle observe
aussi les runs non terminés et les demandes enregistrées de revue, queue et clôture
dont aucun run correspondant n'est observé. Les demandes sont retrouvées dans Git,
avec identité, source, cycle, hash et commit d'introduction ; les reprises v1/v2 gardent
leur validation propre. Une absence de correspondance ne prouve pas une non-invocation :
un dispatch ambigu exige réconciliation avant tout appel. Les dates de création et de
mise à jour observées permettent le diagnostic sans délai arbitraire ni nouveau timeout.
L'absence de demande enregistrée ne permet pas d'inventer une opération attendue.

Le wakeup conserve ce dossier de reprise et une empreinte des observations utiles.
Le même état ne génère pas un nouveau commit seulement parce que le cron a tourné
ou que le transport a avancé. Un changement de résultat, d'attente ou de diagnostic
peut produire un nouveau réveil. Les anciennes preuves et wakeups sont conservés.
Si la reconstruction supplémentaire est indisponible, elle devient un diagnostic
explicite ; elle n'ajoute pas de gate aux opérations ni ne supprime la récupération existante.

### Changement de conversation sans nouvelle autorité

Le pilote peut utiliser `inspect-vnext-work.js prepare-handover observed-automations.json`
pour produire une proposition de binding depuis une lecture fraîche et les métadonnées
Work réellement observées. Cette commande ne configure aucune automation et ne publie
aucune écriture. Les identifiants sont des paramètres observés ; aucune destination
n'est inventée ou déduite du titre d'une conversation.

La procédure conserve les protections existantes : arrêter le déclencheur précédent,
vérifier les travaux possédés et leur checkpoint, observer la nouvelle automation et sa
destination, puis préparer le binding conservant les destinations historiques admises.
Une charge encore possédée demande réconciliation avec son propriétaire : aucun vol par
expiration ou reprise de son nonce. Avant publication du binding, relire la configuration
et les charges courantes ; publier par la transaction Git non forcée existante et relire
le résultat. Reprendre depuis le dossier reconstruit, dans les autorisations revalidées.
Ne jamais rediriger une tranche déjà pilotée vers une autre conversation sans transfert explicite.

Enfin, distinguer proposition/configuration, réception d'un événement, accusé durable
et action réelle du nouveau pilote. Le dépôt ne peut ni créer de lui-même un nouveau
chat Work ni garantir le routage de son interface. La limite Work connue du lot 1
reste applicable ; les tests du dépôt ne deviennent pas une preuve de handover réel.

Le consommateur prend une charge immuable sous .github/orchestration/requests/vnext-work/consumption/claims/ avec son propre nonce, relit cette charge et ne peut agir qu'en tant que propriétaire. Une charge existante d'un autre consommateur n'expire pas et ne peut pas être volée. Un checkpoint scellé porte l'état de continuation et les preuves ; le reçu PROCESSED est écrit seulement après publication et relecture de ce checkpoint Git. MANUAL_RECOVERY est distinct de AUTOMATION_EVENT : une reprise manuelle ne prouve jamais le réveil automatique.

La récupération commune parcourt les exécutions des producteurs inscrits depuis recovery_since, avec pagination complète et déduplication par opération/run/tentative. Elle republie uniquement les signaux manquants et un marqueur de réveil des travaux pendants. Elle ne lance aucun modèle et ne remplace pas une charge bloquée. Les commits de charges, checkpoints et reçus ne constituent pas un nouveau travail ; seuls les signaux et wakeup nécessitent une consommation. Les données JSON de consommation sont exclues des CI lourdes ; le code et la configuration restent qualifiés.

Le workflow commun utilise un rattrapage GitHub horaire, sans créer une surveillance Work propre à une tranche. La réception Work reste événementielle sur la PR commune. recovery_since marque le début de la mise en service ; les archives historiques ne sont pas scannées ou réinvoquées indistinctement.

## Réconciliation de la destination du 14 octobre

L'ancienne automation retournée par Work pointe vers 6acf34ca-bfac-83ed-82bd-33adefbc2cbd, tandis que le binding Git indique 6ac7f420-2fd8-83eb-83ae-4c72a07603a5. Le champ Git n'était pas un routeur : il ne pouvait pas réorienter l'ancienne automation. À la demande de reprise d'Hermann, cette dernière a été désactivée ; une automation de remplacement, créée dans la conversation pilote actuelle, retourne précisément 6ac7f420-2fd8-83eb-83ae-4c72a07603a5. Le binding candidat reprend cet ID observé et le nouvel automation_id. Les anciens signaux sont conservés et leurs anciennes destinations sont explicitement admises pour récupération, sans réécriture de leurs hashes.

Cette migration établit une configuration cohérente. Elle ne constitue pas encore la réception effective d'un événement et son accusé durable. Cette preuve doit être observée après intégration, sur un résultat réel existant ou sur la CI du candidat, sans nouvel appel Claude.


## Limite acceptée à la clôture du lot 1 — décision propriétaire du 15 octobre 2026

Le retour de continuité commun livré par #366 est qualifié et intégré. Il indique au pilote la suite autorisée ; il ne garantit pas que le client Work poursuivra ou rouvrira automatiquement un tour. Le propriétaire accepte explicitement cette limite et clôt PE-31/35/39 sur le périmètre livré. L'absence de cette garantie n'est donc plus une condition de clôture du lot 1 ni un travail de preuve laissé ouvert indéfiniment.

Cette disposition ne transforme aucune émission, configuration ou fixture en réception réelle. Elle conserve les obligations opérationnelles du pilote, la fraîcheur des sources, les contrôles d'intégrité, la déduplication, la possession et les approbations utilisateur. Elle n'ajoute ni gate, retry, automation ni autorisation. Une nouvelle capacité ou un nouvel incident pourra justifier un nouveau travail ; le manque de preuve déjà accepté ne suffit pas à rouvrir ce lot.

Voir le [bilan de qualification et de clôture](reports/2026-10-15_VNEXT_LOT1_CONTINUITY.md).
