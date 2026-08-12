Le glossaire définit le vocabulaire officiel du projet. Chaque terme est identifié comme une _entité métier_ ou un _concept métier_. Une entité métier est représentée dans le modèle de données et manipulée par l'application. Un concept métier décrit le fonctionnement ou le vocabulaire du domaine, sans correspondre nécessairement à un objet persistant.

# Glossaire - Entités métier

Élément métier manipulé par l'application, possédant sa propre identité et représenté dans le modèle de données. Certaines entités sont autonomes ; d'autres appartiennent exclusivement à la structure d'une Séance.

Ce glossaire constitue la référence terminologique fonctionnelle du projet. Les noms techniques du code doivent rester explicitement rattachables à ces concepts et ne doivent pas introduire de concept métier concurrent.

| Terme | Définition | Exemple |
| --- | --- | --- |
| **Utilisateur** | Propriétaire des données de l'application. Dans le MVP, une seule entité Utilisateur locale existe ; elle possède notamment ses Séances, Routines, Catégories, préférences et son historique. | Utilisateur local de l'application |
| **Activité** | Plus petite unité exécutable d'une Séance. Une Activité est de type **Exercice** ou **Récupération**. Elle appartient à une seule Séance et possède ses paramètres d'exécution. | 12 pompes ; 30 s de récupération |
| **Set** | Conteneur ordonné d'Activités appartenant à un Cycle. Dans le MVP, un Cycle contient un Set unique, répété une ou plusieurs fois. Le modèle prévoit l'évolution vers plusieurs Sets ordonnés par Cycle. | Pompes → récupération → squats, répété 3 fois |
| **Cycle** | Conteneur d'un Set et, éventuellement, d'Activités de fin de Cycle. Dans le MVP, une Séance contient un Cycle unique, répété une ou plusieurs fois. Le modèle prévoit l'évolution vers plusieurs Cycles ordonnés par Séance. | Répéter 4 fois un Set puis exécuter une récupération de fin de Cycle |
| **Séance** | Contenu exécutable d'un entraînement. Dans le MVP, elle comprend un compte à rebours initial, un Cycle unique contenant un Set unique et ses Activités, puis une fin de Séance. Elle peut être exécutée directement ou planifiée par une ou plusieurs Routines. | Séance « Haut du corps » |
| **Routine** | Planification d'une Séance. Elle définit notamment la date de début, l'heure d'exécution et le mode de planification. Dans le MVP, la planification est sans répétition ou hebdomadaire ; une répétition hebdomadaire définit une fréquence en semaines, un ou plusieurs jours et une date de fin. | Séance « Haut du corps » tous les 2 semaines, lundi et jeudi à 18 h |
| **Occurrence planifiée** | Instance temporelle calculée à partir d'une Routine. Les occurrences futures sont calculées dynamiquement. Une occurrence future peut être exécutée en avance. Une occurrence arrivée à échéance sans Exécution disparaît de l'interface du MVP et n'apparaît pas dans le Suivi. | Séance prévue lundi à 18 h |
| **Exécution de séance** | Réalisation effective d'une Séance. Elle est créée uniquement au démarrage effectif de la Séance et conserve un instantané de la Séance exécutée. | Exécution démarrée lundi à 18 h 03 |
| **Instantané de séance** | Copie fonctionnelle figée et allégée d'une Séance, créée au démarrage effectif d'une Exécution de séance. Il permet de restituer fidèlement l'historique indépendamment des modifications, de l'archivage ou de la suppression ultérieure de la Séance source. Les médias n'y sont pas dupliqués. | Structure de la Séance « Haut du corps » telle qu'elle était au démarrage de l'Exécution |
| **Média** | Ressource visuelle associée à une Activité afin d'en faciliter la compréhension ou l'exécution. | Photo ou vidéo d'un exercice |
| **Catégorie** | Libellé permettant de classer des Séances selon un thème ou un objectif. | Haut du corps, Mobilité, Kiné |
| **Zone corporelle** | Partie du corps principalement sollicitée par une Activité de type Exercice, issue du référentiel prédéfini de l’application. | Épaules, Lombaires, Quadriceps |
| **Préférences globales** | Paramètres personnels servant de valeurs par défaut lors de la création ou de l'utilisation des Séances et des Routines. Leur modification n'altère pas rétroactivement les objets déjà créés lorsque la valeur a été copiée dans ceux-ci. | Durée du compte à rebours initial, annonces vocales, rappels |

# Glossaire - Concepts métier

Notion ou terme utilisé pour décrire le fonctionnement de l'application, son vocabulaire ou ses règles métier, mais qui ne correspond pas à un objet distinct du modèle de données.

| Terme | Définition | Exemple |
| --- | --- | --- |
| **Exercice** | Type d'Activité correspondant à une action réalisée par l'utilisateur. Un Exercice est exécuté selon une durée ou un nombre de répétitions et possède un nombre de séries propre, supérieur ou égal à 1. | Pompes, squats, gainage, étirement |
| **Récupération** | Type d'Activité correspondant à une période de repos. Elle est toujours chronométrée. Elle peut être créée explicitement ou être générée à partir du paramètre **Pause après Série** d'un Exercice. | 30 s de récupération |
| **Pause après Série** | Paramètre facultatif d'un Exercice, appliqué après chaque Série. Dans le modèle, il est matérialisé par une Activité de type Récupération liée à l'Exercice et masquée comme objet autonome dans l'interface de composition. Après la dernière Série, cette pause n'est pas exécutée si l'étape suivante du plan d'exécution est une Récupération explicite. | 30 s après chaque série de pompes |
| **Série** | Répétition propre à une Activité de type Exercice. Une Série correspond à une réalisation de l'Exercice selon son mode d'exécution, suivie de sa pause éventuelle. Le nombre de Séries est un paramètre de l'Activité ; une Série n'est ni un conteneur structurel de la Séance ni une entité métier autonome. | 12 pompes + 30 s de pause, à répéter 3 fois |
| **Planification** | Organisation dans le temps de l'exécution d'une Séance. Elle est matérialisée par une Routine. | Tous les lundis à 18 h |
| **Calendrier** | Vue chronologique des Séances planifiées à partir des Routines. | Vue semaine des séances à venir |
| **Plan d'exécution** | Séquence déterministe des étapes réellement exécutées, construite au démarrage à partir de l'Instantané de séance. Elle développe notamment les Séries, répétitions de Set et répétitions de Cycle afin de piloter l'Exécution. | Suite ordonnée : Série 1 de pompes → récupération → Série 2 → … |
| **Exécution** | Processus consistant à réaliser une Séance en suivant son ordre d'exécution. Une **Exécution de séance** est créée lors du démarrage effectif. | Lancement d'une Séance |
| **Historique** | Ensemble des données conservées à des fins de traçabilité. Dans l'interface MVP, le Suivi expose uniquement les Exécutions de séance enregistrées ; les occurrences planifiées non exécutées n'y sont pas affichées. | Exécutions enregistrées cette semaine |
| **Compte à rebours initial** | Phase obligatoire précédant la première Activité d'une Séance. Sa durée peut être égale à 0 s, ce qui la rend instantanée. | « Get ready », 10 s |
| **Fin de séance** | Phase obligatoire exécutée après la dernière Activité de la Séance. Sa durée peut être égale à 0 s, ce qui la rend instantanée. Elle n'est pas une Activité. | « Séance terminée, bravo », 5 s |
| **Échauffement** | Qualification fonctionnelle d'Activités destinées à préparer l'utilisateur à l'effort. | Mobilité articulaire |
| **Retour au calme** | Libellé ou qualification fonctionnelle facultative d’Activités réalisées en fin de Séance afin de favoriser la récupération. Il ne constitue ni un type d’Activité ni un conteneur structurel. Les Activités concernées restent de type Exercice ou Récupération. | Étirements légers |
| **Objectif** | Finalité recherchée par une Séance ou une Routine. | Renforcement, Mobilité, Rééducation, Cardio |
| **Consigne** | Information textuelle destinée à guider l'utilisateur pendant la réalisation d'une Activité. | « Garder le dos droit » |
| **Mode d'exécution** | Façon dont une Activité de type Exercice est réalisée dans le MVP. | Durée ou Répétitions |
| **Statut de séance** | État de conservation d'une Séance. | Active, Archivée |
| **Statut d'exécution** | État ou résultat d'une Exécution de séance. | En cours, Suspendue, Terminée, Partielle, Interrompue |
| **Statut d'occurrence planifiée** | Résultat technique éventuel d'une Occurrence arrivée à échéance. Ce statut n'est pas exposé dans le Suivi du MVP pour les occurrences non exécutées. | Exécutée, Non exécutée |
| **Profil** | Ensemble des informations et préférences propres à l'utilisateur, accessibles depuis l'onglet Profil. | Préférences globales, référentiels utilisateur |
