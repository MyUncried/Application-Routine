# Retour commun des opérations VNext vers Work

## Contrat commun

Le retour après une opération est commun à toutes les tranches VNext enregistrées : résultat archivé → vérification du transport → signal unique → événement PR synchronize → automation Work → accusé durable et reprise. Tranche, issue, demande, source, run/tentative et archive sont des données ; aucune condition PRE-4 n'est inscrite dans le publisher.

Le binding scellé KODJO_VNEXT_WORK_TRANSPORT.json relie la PR de transport commune, sa branche, l'automation et la conversation observées. La PR de transport n'est jamais une PR de livraison et ne porte aucun code métier. Elle reste ouverte pour les signaux de toutes les tranches. L'ancienne automation V1.3/#19 et le signal de qualification/#269 restent historiques ; aucune preuve de réveil antérieure n'est reclassée en preuve du binding courant.

## Emission

Le workflow kodjo-vnext-work-continuation.yml réagit à la fin du workflow de relais commun actuellement intégré. Il s'appelle désormais « KODJO VNext — ChatGPT agent relay » ; son ancien nom PRE-4 reste écouté pour les fins de runs historiques ; le publisher utilise la tranche portée par la demande, son bootstrap et son activation, pas ce nom. L'inventaire allowed_workflows reste fermé et versionné. Une nouvelle famille d'exécuteur exige l'inscription explicite de son producteur/préfixe d'archive et, si son contrat de sortie diffère, un adaptateur de ce contrat ; pas un nouveau mécanisme par tranche. Cette livraison raccorde les trois opérations du relais, pas les sorties d'autres exécuteurs non encore inscrits.

Un résultat déjà terminé avant intégration peut être signalé par un unique fichier scellé requests/vnext-work/publish/<run_id>.json. Ce contrôle ne relance pas le reviewer. Les deux entrées consomment le même publisher et le même binding.

Le publisher exige un run terminé sur main du dépôt autorisé, un acteur autorisé par la tranche, le bootstrap et son activation exacts, l'issue ouverte, une archive unique liée au run/tentative/tête, le SHA-256 physique du ZIP, le manifeste scellé de ses fichiers, et un résultat/checkpoint concordant avec la demande. Les membres ZIP absolus, avec remontée de chemin, dupliqués ou symlinks sont refusés avant extraction. Les octets binaires sont lus explicitement, jamais imprimés comme terminal UI.

Le résultat peut être un échec après invocation, notamment une revue partielle. Le signal garde error/model_invoked ; il n'invente ni non-invocation ni approbation. Le champ semantic_validation_required est toujours vrai : le pilote doit vérifier le reçu métier, pas traiter le signal comme un verdict accepté.

Le job d'émission est sérialisé. Ses seules écritures sont blob/tree/commit non forcé sur la branche de transport, un seul fichier de signal sous requests/vnext-work/signals/. La clé déduplique demande/opération/run/tentative. Un signal identique est réutilisé ; un signal différent pour la même clé, une destination fermée/étrangère ou une tête déplacée sont refusés. Le publisher n'appelle aucun modèle et ne dispose d'aucune capacité d'implémentation ou d'approbation.

Les trois chemins de données (README de transport, signals/*.json et publish/*.json) sont exclus des CI lourdes et classés non normatifs. Le publisher, son workflow, le binding et ce contrat restent qualifiés ; un fichier de code sous ce namespace ou une modification mixte n'est pas exempté. Les filtres miroirs de CI sont propagés sans changer les exécuteurs V2 ni leurs permissions.

## Réception Work

L'automation suit uniquement les mises à jour de commits de la PR de transport observée, avec son auteur résolu par GitHub. Aucun polling ni cadence parallèle n'est ajouté. Le prompt inscrit dans l'automation exige : lecture GitHub courante, vérification des signaux/archives/provenance, déduplication, accusé [VNEXT_WORK_SIGNAL_RECEIVED], recherche d'opérations actives, puis traitement du résultat jusqu'au prochain gate réel. Un accusé traité [VNEXT_WORK_SIGNAL_PROCESSED] doit citer signal_key et signal_commit_sha ; une seconde notification ne rappelle jamais Claude.

L'approbation propriétaire du plan exact reste obligatoire avant développement. Les arbitrages produit ne peuvent être déduits d'un événement synchronize. Le pilote traite seul transport et tests techniques ; aucun copier-coller, fermeture d'application ou redémarrage ne doit être demandé pour compenser un défaut du relais.

## Preuves et limites

Une automation créée/activée n'est qu'une configuration. Un commit signal publié n'est qu'une émission. Le réveil courant n'est établi qu'après réception effective et accusé durable de cette automation dans la conversation liée. Les tests avec API/processus simulés ne prouvent pas cette réception.

Une archive absente, perdue, altérée ou sans provenance empêche le signal métier et laisse le job en échec technique visible. La publication de ce diagnostic et son chemin de reprise doivent rester traçables ; cela n'autorise aucune relance payante. La réception réelle et la consommation restent à vérifier sur un résultat existant, sans nouveau parcours jetable ni nouvelle certification globale.
