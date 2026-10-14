# Retour commun des opérations VNext vers Work

## Contrat commun

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

Si `gh` est absent, le pilote emploie les outils GitHub pour les mêmes opérations que `transaction` dans `consume-vnext-work-signal.js` : lire la référence, la PR et le fichier existant à la tête exacte ; contrôler la destination ouverte ; réutiliser uniquement un contenu au hash identique ; créer blob, tree et commit avec ce parent ; relire la tête ; avancer la référence sans force avec `expected_sha` ; relire le fichier au commit publié. Une tête déplacée arrête la tentative sans reprise aveugle. Les objets claim/checkpoint/receipt sont calculés par les fonctions `claim`, `checkpoint` et `processed` de `lib/vnext-work-consumption.js`, avec leurs validations et hashes ; ils ne sont pas inventés par le pilote. Avant toute action, relire la charge et vérifier `owns` ; une charge étrangère ne peut être reprise. Le reçu cite le commit du checkpoint effectivement relu. Cette voie conserve les chemins, contrats et contrôles du consommateur existant ; elle ne change ni workflow ni exécuteur V2.

La prise en charge ne vaut pas validation des archives : si le signal scellé et sa provenance sont vérifiés mais qu'une archive ne peut pas être contrôlée, la seule continuation admissible est `BLOCKED_WITH_EVIDENCE`, avec la limite exacte et ses preuves. Un reçu PROCESSED dans cet état prouve seulement l'enregistrement durable du blocage ; il ne prouve ni conformité métier ni reprise de développement. Aucun marqueur de validation complète du signal n'est publié avant le contrôle effectif des archives.


Une copie de transport des octets ZIP peut être conservée en Base64 dans `.github/orchestration/requests/vnext-work/consumption/archive-cache/<sha256>.json`, avec ses segments ordonnés, son artifact_id et sa taille. Le wakeup référence les copies présentes à son commit exact. Cette voie de lecture via le connecteur GitHub évite les URL temporaires inaccessibles au runtime ; elle ne substitue aucune attestation aux octets. Le consommateur reconstruit chaque ZIP, exige le SHA-256 du signal scellé, puis contrôle les membres sûrs, tailles et hashes de tous les fichiers avec les mêmes validateurs. Copie manquante, tronquée ou différente : blocage explicite, jamais conformité. Ces copies sont des données de transport non normatives, pas des claims ni des reçus. Les limites de lecture et les autorisations d'écriture restent signalées séparément.

Un déclenchement enregistré, un résultat visible dans Planifié et un retour dans la conversation pilote sont trois observations distinctes. Le bilan indique son emplacement réel ; une consigne de prompt ou le champ conversation_id du binding ne suffisent pas à garantir le routage de l'interface.

L'approbation propriétaire du plan exact reste obligatoire avant développement. Les arbitrages produit ne peuvent être déduits d'un événement synchronize. Le pilote traite seul transport et tests techniques ; aucun copier-coller, fermeture d'application ou redémarrage ne doit être demandé pour compenser un défaut du relais.

## Preuves et limites

Une automation créée/activée n'est qu'une configuration. Un commit signal publié n'est qu'une émission. Le réveil courant n'est établi qu'après réception effective et accusé durable de cette automation dans la conversation liée. Les tests avec API/processus simulés ne prouvent pas cette réception.

Une archive de revue absente, perdue, altérée ou sans provenance empêche le signal métier et laisse le job en échec technique visible. Pour les autres exécuteurs, une archive métier absente produit RESULT_ARCHIVE_MISSING avec model_invoked=null ; aucune non-invocation n'est inférée. Une archive altérée demeure un refus, repris comme diagnostic par la récupération. La publication de ce diagnostic et son chemin de reprise doivent rester traçables ; cela n'autorise aucune relance payante. La réception réelle et la consommation restent à vérifier sur un résultat existant, sans nouveau parcours jetable ni nouvelle certification globale.

## Consommation atomique et récupération

Le consommateur prend une charge immuable sous .github/orchestration/requests/vnext-work/consumption/claims/ avec son propre nonce, relit cette charge et ne peut agir qu'en tant que propriétaire. Une charge existante d'un autre consommateur n'expire pas et ne peut pas être volée. Un checkpoint scellé porte l'état de continuation et les preuves ; le reçu PROCESSED est écrit seulement après publication et relecture de ce checkpoint Git. MANUAL_RECOVERY est distinct de AUTOMATION_EVENT : une reprise manuelle ne prouve jamais le réveil automatique.

La récupération commune parcourt les exécutions des producteurs inscrits depuis recovery_since, avec pagination complète et déduplication par opération/run/tentative. Elle republie uniquement les signaux manquants et un marqueur de réveil des travaux pendants. Elle ne lance aucun modèle et ne remplace pas une charge bloquée. Les commits de charges, checkpoints et reçus ne constituent pas un nouveau travail ; seuls les signaux et wakeup nécessitent une consommation. Les données JSON de consommation sont exclues des CI lourdes ; le code et la configuration restent qualifiés.

Le workflow commun utilise un rattrapage GitHub horaire, sans créer une surveillance Work propre à une tranche. La réception Work reste événementielle sur la PR commune. recovery_since marque le début de la mise en service ; les archives historiques ne sont pas scannées ou réinvoquées indistinctement.

## Réconciliation de la destination du 14 octobre

L'ancienne automation retournée par Work pointe vers 6acf34ca-bfac-83ed-82bd-33adefbc2cbd, tandis que le binding Git indique 6ac7f420-2fd8-83eb-83ae-4c72a07603a5. Le champ Git n'était pas un routeur : il ne pouvait pas réorienter l'ancienne automation. À la demande de reprise d'Hermann, cette dernière a été désactivée ; une automation de remplacement, créée dans la conversation pilote actuelle, retourne précisément 6ac7f420-2fd8-83eb-83ae-4c72a07603a5. Le binding candidat reprend cet ID observé et le nouvel automation_id. Les anciens signaux sont conservés et leurs anciennes destinations sont explicitement admises pour récupération, sans réécriture de leurs hashes.

Cette migration établit une configuration cohérente. Elle ne constitue pas encore la réception effective d'un événement et son accusé durable. Cette preuve doit être observée après intégration, sur un résultat réel existant ou sur la CI du candidat, sans nouvel appel Claude.
