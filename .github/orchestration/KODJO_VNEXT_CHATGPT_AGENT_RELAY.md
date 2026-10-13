# VNext — relais commun ChatGPT / Claude pour PRE-4

Ce document remplace le parcours de transport spécifique de `KODJO_VNEXT_CHATGPT_PRE4_REVIEW_RELAY.md`. Le moteur commun est `scripts/kodjo/lib/vnext-agent-relay.js`, l'entrée du pilote `scripts/kodjo/agent-relay.js`. L'ancien CLI reste compatible et utilise le même moteur. Aucun démarrage de PRE-4 n'est autorisé par une modification du protocole. Le déploiement reste limité à `VNEXT-PRE-4`, après clôture de #340 et instruction de démarrage. La variante Claude #344 reste indépendante.

## Contrat du pilote

Le pilote effectue lui-même la préparation, la publication, la recherche du run, le téléchargement et la vérification. Il ne demande jamais à l'utilisateur une commande PowerShell, un fichier local, un rapport, un SHA ou un JSON à transporter. Si son outil GitHub ne permet pas une action, il publie un incident d'orchestration et conserve le checkpoint ; cela ne transfère pas la tâche technique à l'utilisateur.

Le retour automatique vers Work est raccordé par le transport commun décrit dans KODJO_VNEXT_WORK_CONTINUATION.md et son binding scellé. La création de l'automation et l'émission d'un signal ne prouvent pas sa réception ; l'accusé durable du binding courant reste requis avant qualification effective. Les anciens réveils V1.3 ne prouvent pas le parcours courant. Une réactivation manuelle reste une récupération documentée en cas d'échec réel du transport, pas le chemin nominal.

## Inventaire des interactions et routage

| Entrée VNext | Traitement |
|---|---|
| `vnext-chain review`, plan INITIAL / REVISION | Adaptateur `plan-review`, même `Chain.review` et même validateur du reçu |
| `recover-review` | Reprise du cache/réponse dans le moteur commun, sans nouvel appel IA |
| `review-scope` | Adaptateur `review-scope`, même demande, rapport original et validateur de dépendances observées |
| `recover-review-scope` | Même opération immuable, revalidation de la réponse conservée ; refus invalide conservé |
| `implementation-review` | Adaptateur `implementation-review`, mêmes plan, HEAD de livraison, références et faits exécutés |
| `verify-implementation-review` | Vérification du résultat téléchargé ; reçu portable et faits vérifiés |
| Préparation du dossier / Figma / `prepare-implementation-review` | Préparation du pilote et connecteurs existants ; aucun appel Claude ajouté |
| Développement, tests, revue/clôture distantes dans l'exécuteur VNext et la queue existante | Workflows et publications existants, qui disposent de leurs autorisations d'écriture propres ; pas d'exécution arbitraire ajoutée au reviewer en lecture seule |
| Audit global historique V2 / architecture | Hors demande ; aucun nouveau lancement ni migration |
| Revue PRE-3 en cours | Hors activation de ce relais ; aucune reprise ou intervention effectuée ici |

Une nouvelle opération de revue se raccorde par un adaptateur (précontrôle, invocation, reprise, validation et résultat), inscrit dans la liste fermée `OPERATIONS`. Elle réutilise le cycle de transport et le workflow ; aucun nouveau copier-coller ou workflow par cas ne doit être créé. Un nom d'opération inconnu, une commande, un chemin absolu ou un pilote étranger sont refusés.

## Demande et publication

Le pilote versionne les données et leurs parties file-bundle avant la demande. Il exécute lui-même `agent-relay.js create <configuration> <répertoire>` ; le répertoire est `.github/orchestration/requests/vnext-agent`. La configuration fournit `operation`, `slice_id`, `repository`, `issue_number`, `source_head`, `inputs_file`.

La demande scellée contient l'empreinte du manifeste d'entrées et une `operation_hash` calculée depuis les objets sémantiques exacts. Cette dernière dédoublonne un même dossier republié dans un autre commit ; le nom du fichier est l'empreinte de la demande. Les données sont lues depuis Git, jamais depuis un fichier local modifié. Le commit source peut appartenir à une branche de préparation publiée dans le même dépôt : sa présence dans les refs distantes origin est contrôlée. Son intégration dans main ne précède pas la revue. Le checkout de revue porte sur ce commit exact ; les empreintes et les validations métier restent opposables. La demande est publiée seule, en ajout, dans un commit sur main. Le workflow existant `kodjo-vnext-chatgpt-plan-review.yml` accepte ce répertoire et l'ancien répertoire de compatibilité ; acteur, runner, permissions en lecture et verrou global sont conservés.

| Opération | Objet JSON du manifeste `inputs_file` |
|---|---|
| `plan-review` | `produced_file`, `causal_file` (null en INITIAL ; quatre preuves causales épinglées en REVISION) |
| `review-scope` | `produced_file`, `review_receipt_file`, `scope_request_file` |
| `implementation-review` | `produced_file`, `approved_plan_file`, `observations_file`, `evidence_files` |

Les observations d'implémentation contiennent exactement `approvedPlanSha256`, `deliveryHead`, `measurements`, `scenarioResults`. Le plan est lié au PlanContract du dossier et à la même tranche/Issue. Chaque fichier de preuve est déclaré par `artifact_path` (sous `facts/`, JSON), `git_path`, `sha256` ; ses octets sont épinglés et matérialisés hors checkout. Il s'agit des faits JSON exécutés supportés par le reviewer existant ; cette livraison n'ajoute pas de certification pixel ou appareil natif. Le HEAD de livraison est un ancêtre du commit des entrées : l'orchestrateur checkout ce HEAD exact avant le reviewer, sans demander un commit qui contiendrait sa propre empreinte.

## Cycle commun et refus

1. Vérifier demande, dépôt, objets Git, opération, tranche/Issue et fermeture de PRE-3.
2. Vérifier l'identité sémantique, rechercher reçu/réponse, puis vérifier les tentatives antérieures GitHub si le cache est absent. Une tentative ambiguë bloque, y compris si un autre commit republie la même opération.
3. Pour un premier appel uniquement : vérifier qu'aucun Claude n'est actif, acquérir le verrou existant, créer l'intent exclusif, appeler l'adaptateur indépendant. Les commandes et restrictions du reviewer existant sont conservées.
4. Conserver la réponse avant la validation sémantique. Le reviewer d'implémentation conserve aussi le statut du processus et permet de reconstruire le reçu à partir d'une réponse valide sans nouvel appel.
5. Publier systématiquement checkpoint et preuves dans `vnext-chatgpt-review-<run>-<attempt>` (30 jours), avec un manifeste scellé des fichiers. Le workflow tente cette publication même si l'opération échoue.
6. Le pilote retrouve le run par le commit de demande, vérifie sa provenance (dépôt, workflow, HEAD, job, tentative), télécharge l'artefact et exécute `agent-relay.js verify <demande> <répertoire téléchargé>`. Les hashes seuls n'attestent pas cette provenance GitHub.
7. Consommer soit un résultat vérifié, soit `failure.json` et `process-evidence` pour diagnostic. Un refus ne fournit aucun reçu valide et n'autorise ni plan, ni dépendance, ni développement. Le complément de portée n'approuve jamais le plan.

Le cas `VNEXT_SCOPE_UNOBSERVED_DEPENDENCY` conserve et publie `scope-review-response.json` et le diagnostic. ChatGPT peut inspecter cette preuve directement ; une reprise de la même réponse reproduit le refus, sans appel IA. Aucune correction automatique d'une attestation d'observation n'est autorisée.

Une reprise peut être publiée seule sous `.github/orchestration/requests/vnext-agent/resume/<hash>.json`. Ce contrôle scellé ne crée pas une seconde demande : il référence le commit, le chemin et les empreintes de la demande d’origine, ainsi que le run antérieur terminé. Le workflow existant résout ce contrôle avec le protocole courant de main, puis checkout la demande d’origine. Il conserve son acteur, son runner, son verrou et ses permissions. La demande et le dossier ne sont ni modifiés ni republiés.

Une exception de récupération historique est admise uniquement sur preuve GitHub que l’ancienne entrée exacte (blob `3ca49ad3fd0f792328fbf7c60854061b4376f33c`) et son workflow exact (blob `d8ee7a2c38a2182b3e7de6296748cd987c8db8a5`) ont échoué au premier contrôle d’ascendance, avant toute invocation. Statut/tentative/acteur/HEAD/workflow, étapes du job, journal et divergence Git sont vérifiés conjointement ; la preuve de récupération est archivée avec le nouvel artefact. Une assertion locale `model_invoked=false`, un run vert ou une erreur quelconque ne suffisent pas. Toute tentative ambiguë, après appel, ou non observable reste refusée. L’archivage général des erreurs précédant execute reste une amélioration distincte, non incluse dans ce correctif.

La récupération de la publication réutilise reçu/réponse/intent, sans retry payant implicite. Cache perdu, quota ou tentative ambiguë restent bloquants. Une erreur de publication ou d'archivage ne doit pas masquer le refus primaire. Les décisions produit, approbations du plan et portes humaines existantes sont conservées.

Les archives d'échec sans invocation peuvent contenir les preuves de reprises antérieures. Chaque sous-archive est vérifiée récursivement avec son numéro de run, ses contrats et son manifeste. Les reçus historiques gardent leurs producteurs épinglés. Les fichiers de résultat, réponse, intent ou provenance inconnue restent bloquants, à tout niveau. Le lecteur reconnaît sa propre version exacte du checkout de protocole de confiance ainsi que les lecteurs précédemment intégrés. Le publisher accepte uniquement son ancien blob intégré ou sa version exacte du checkout de protocole de confiance ; le workflow reste épinglé.

Le détecteur distingue le CLI Claude géré par KODJO des applications Claude externes (notamment Desktop et extensions). Une exécution gérée active ou une lecture ambiguë refuse l'invocation. Le compteur des applications externes est diagnostique : il ne bloque pas le relais. Le verrou exclusif KODJO est toujours acquis avant la création de l'intent et avant tout appel modèle. Un verrou occupé, un intent antérieur ou une tentative inconnue reste bloquant. Cette distinction s'applique aux trois opérations du relais commun et à l'entrée de revue de plan compatible ; aucune fermeture des autres applications Claude n'est demandée au propriétaire.

## Qualification

Les tests locaux utilisent des processus/adaptateurs simulés et les validateurs réels, des objets Git épinglés et des artefacts déplacés. Ils ne prouvent ni un appel Claude réel, ni un réveil automatique. #345 reste ouverte jusqu'au parcours réel, aux reprises et à la récupération directe constatés. Les preuves CI du commit candidat sont consignées dans sa PR ; aucun run vert seul n'est une approbation indépendante.
