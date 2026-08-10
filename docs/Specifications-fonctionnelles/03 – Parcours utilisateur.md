# Objectif de cette note

Décrire, du point de vue de l'utilisateur, les principaux parcours permettant de créer, planifier, exécuter et suivre ses séances dans l'application.

Cette note décrit les objectifs de l'utilisateur et l'enchaînement logique des actions, sans détailler encore les écrans ni les choix techniques.
# Synthèse des parcours du MVP

## Objectif

Présenter la couverture fonctionnelle du MVP et orienter vers les parcours utilisateur détaillés de ce chapitre.

Le MVP permet à l'utilisateur :
- de gérer ses catégories de séances et de sélectionner les zones corporelles du référentiel applicatif ;
- de créer, réorganiser et exécuter une séance ;
- de créer une séance à partir de la duplication d'une séance existante ;
- de planifier une séance au moyen d'une routine ;
- de modifier ou supprimer une routine ;
- de gérer une séance partiellement réalisée ou interrompue ;
- de consulter le détail des séances exécutées dans le Suivi.
## Parcours de référence

| Besoin utilisateur                               | Parcours de référence                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Gérer les catégories de séances                  | Gestion des référentiels utilisateur — Gestion des catégories                      |
| Utiliser les zones corporelles                   | Référentiel applicatif — Sélection des zones corporelles                            |
| Créer, réorganiser et exécuter une séance        | Parcours principal — Créer et exécuter une séance                                  |
| Créer une séance à partir d'une séance existante | Parcours complémentaire 1 — Créer une séance à partir d'une référence              |
| Planifier et gérer une séance récurrente         | Parcours complémentaire 2 — Gérer les routines                                     |
| Gérer une séance partielle ou interrompue        | Parcours complémentaire 3 — Gérer une séance interrompue ou partiellement réalisée |
| Consulter les séances exécutées                  | Parcours complémentaire 4 — Consulter le suivi des séances                         |
## Principes communs

- Une séance définit le contenu à exécuter.
- Une routine définit la planification d'une séance.
- Une exécution de séance conserve le déroulement réel d'une séance exécutée.
- Une séance peut être exécutée sans être planifiée.
- Une séance peut être associée à plusieurs routines.
- La modification d'une séance ou d'une routine n'altère jamais les exécutions déjà enregistrées.
- La suppression d'une routine ne supprime jamais la séance associée ni les exécutions déjà enregistrées.
- Les données du MVP sont conservées localement sur l'appareil de l'utilisateur.
## Limites du MVP

Le MVP ne prend pas encore en charge :
- le partage ou la collaboration ;
- les comptes utilisateurs et la synchronisation entre appareils ;
- l'interaction avec un professionnel de santé ou un coach ;
- les bibliothèques de séances partagées ;
- l'assistance par intelligence artificielle ;
- les tableaux de bord et graphiques avancés ;
- le multilingue.

Ces fonctions sont prévues pour des versions ultérieures.
# Gestion des référentiels utilisateur

Les référentiels utilisés dans le MVP sont de deux natures :
- les **Catégories de Séances**, personnalisables par l’utilisateur ;
- les **Zones corporelles**, issues d’un référentiel applicatif prédéfini et non administrable par l’utilisateur.

## Gestion des catégories

Les catégories permettent de classer les séances afin d'en faciliter l'organisation, la recherche et le suivi.
Une séance peut appartenir à zéro, une ou plusieurs catégories.

L'utilisateur peut :
- consulter les catégories existantes ;
- créer une nouvelle catégorie ;
- modifier son nom ;
- supprimer une catégorie.

Si une catégorie supprimée est utilisée par une ou plusieurs Séances, elle est retirée de ces Séances après confirmation. Les Instantanés historiques restent inchangés et conservent le libellé historique de la catégorie.

### Parcours

1. Ouvrir la gestion ou la sélection des catégories.
2. Consulter les catégories existantes.
3. Créer, modifier ou supprimer une catégorie selon le besoin.
4. Les modifications sont immédiatement disponibles dans l'ensemble de l'application, sans modification des Instantanés historiques.

## Référentiel des zones corporelles

Les zones corporelles permettent de caractériser les exercices selon les parties du corps principalement sollicitées.
Une activité de type **Exercice** peut être associée à zéro, une ou plusieurs zones corporelles.

Dans le MVP, les Zones corporelles constituent un référentiel prédéfini de l'application. L'utilisateur peut les consulter et les sélectionner lors de la création ou de la modification d'un Exercice, mais ne peut ni en créer, ni les renommer, ni les supprimer.

# Parcours principal — Créer et exécuter une séance

## Objectif du parcours

Permettre à l'utilisateur de créer une séance, de l'exécuter immédiatement en étant guidé par l'application et de retrouver ensuite son exécution dans l'historique.

La planification des séances est décrite dans le parcours **Gérer les routines**.
## Situation de départ

L'utilisateur souhaite créer une nouvelle séance correspondant à un entraînement sportif, une séance de rééducation, une routine de mobilité ou toute succession d'activités nécessitant un guidage.

Il peut créer une séance entièrement nouvelle ou partir d'une copie d'une séance existante.
## Parcours

### 1. Créer une séance

L'utilisateur crée une nouvelle séance.

Il renseigne son nom, lui associe éventuellement une ou plusieurs catégories, puis construit progressivement son contenu en ajoutant les activités qui la composent.

Pour chaque activité de type Exercice, il définit d'abord ses paramètres essentiels (type, nom, mode Durée ou Répétitions, valeur d'exécution, pause éventuelle et nombre de Séries), puis peut renseigner sur un second écran les informations facultatives telles que la consigne et les zones corporelles. Il définit également les paramètres généraux de la séance.

Il enregistre ensuite sa séance.
### 2. Réorganiser une séance

À tout moment, l'utilisateur peut revenir modifier une séance existante.

Il peut notamment :
- ajouter une activité ;
- supprimer une activité ;
- modifier une activité ;
- déplacer une activité ;
- modifier le nombre de répétitions du bloc ;
- modifier le nombre de répétitions du cycle ;
- modifier les paramètres généraux de la séance.

Les modifications sont immédiatement prises en compte pour les futures exécutions.
### 3. Démarrer une séance

L'utilisateur choisit une séance et démarre son exécution.
Avant le lancement, il peut consulter un résumé de la séance et vérifier ses principaux paramètres.
### 4. Exécuter une séance

Pendant l'exécution, l'application guide automatiquement l'utilisateur activité après activité.

Il peut notamment :
- suivre le minuteur ou les répétitions ;
- mettre la séance en pause ;
- reprendre la séance ;
- passer directement à l'activité suivante ;
- arrêter la séance.
### 5. Terminer une séance

À la fin de l'exécution, l'application enregistre automatiquement la séance réalisée.
L'utilisateur peut ajouter un commentaire ou un ressenti avant de revenir à l'écran principal.
### 6. Consulter l'historique

L'utilisateur retrouve l'ensemble des séances déjà exécutées.
Chaque exécution conserve la version exacte de la séance utilisée lors de son lancement.
### 8. Modifier une séance

Après une ou plusieurs exécutions, l'utilisateur peut continuer à faire évoluer une séance.
Les modifications apportées ne concernent que les futures exécutions.
Les exécutions déjà enregistrées restent inchangées.
## Points d'attention

- Une séance décrit uniquement son contenu.
- Une séance peut être exécutée immédiatement, sans être planifiée.
- Les modifications d'une séance n'altèrent jamais les exécutions déjà enregistrées.
- La planification des séances est gérée par les routines, décrites dans le parcours dédié.
## Résultat attendu

L'utilisateur peut créer, faire évoluer et exécuter librement ses séances, tout en conservant un historique fidèle de chacune de leurs exécutions.

# Parcours complémentaire 1 — Créer une séance à partir d'une référence

## Objectif du parcours

Permettre à l'utilisateur de créer rapidement une nouvelle séance à partir d'une séance existante.
## Situation de départ

L'utilisateur dispose déjà d'une séance dont la structure est proche de celle qu'il souhaite créer.
Il préfère la dupliquer plutôt que recréer entièrement son contenu.
## Parcours

1. L'utilisateur ouvre le catalogue des séances.
2. Il sélectionne la séance qu'il souhaite utiliser comme référence.
3. Il choisit **Dupliquer**.
4. Il saisit le nom de la nouvelle séance.
5. La nouvelle séance est créée.
6. L'utilisateur peut modifier librement son contenu.
7. Il enregistre la séance.
## Points d'attention

- La séance créée est totalement indépendante de la séance d'origine.
- Les modifications apportées à l'une n'ont aucun impact sur l'autre.
- La duplication reprend l'intégralité de la structure de la séance et de ses paramètres.
## Résultat attendu

L'utilisateur crée rapidement une nouvelle séance en s'appuyant sur une séance existante, puis l'adapte à son besoin sans modifier l'original.
# Parcours complémentaire 2 — Gérer les routines

## Objectif du parcours

Permettre à l'utilisateur de planifier l'exécution de ses séances, de modifier leur planification ou de supprimer une routine.
## Situation de départ

L'utilisateur dispose d'au moins une séance enregistrée.
Il souhaite programmer son exécution à une date précise ou de manière récurrente.
## Parcours

### Créer une routine

1. Ouvrir le calendrier.
2. Choisir **Planifier une séance**.
3. Sélectionner la séance à planifier.
4. Définir :
   - la date de début ;
   - l'heure ;
   - le mode de planification et, le cas échéant, les paramètres de répétition hebdomadaire ;
   - la date de fin éventuelle ;
   - le rappel.
5. Enregistrer.
### Modifier une routine

1. Sélectionner une routine dans le calendrier.
2. Choisir **Modifier la planification**.
3. Modifier les paramètres souhaités.
4. Enregistrer.

Les modifications s'appliquent uniquement aux occurrences futures.
### Supprimer une routine

1. Sélectionner une routine.
2. Choisir **Supprimer la routine**.
3. Confirmer la suppression.

Les occurrences futures cessent d'être générées. Les occurrences déjà historisées, y compris celles ayant le statut **Non exécutée**, sont conservées.
Les exécutions déjà réalisées sont conservées.
## Points d'attention

- Une routine ne modifie jamais le contenu d'une séance.
- Une séance peut être associée à plusieurs routines.
- La suppression d'une routine ne supprime jamais la séance.
- Les exécutions déjà réalisées sont toujours conservées.
- L'archivage d'une Séance supprime toutes les Routines qui lui sont associées. Leur restauration n'est pas automatique si la Séance est ensuite restaurée.
## Résultat attendu

L'utilisateur gère facilement la planification de ses séances sans modifier leur contenu et conserve un historique fiable de toutes les exécutions réalisées.

# Parcours complémentaire 3 — Gérer une séance interrompue ou partiellement réalisée

## Situation de départ

Pendant l'exécution d'une séance, l'utilisateur ne réalise pas toutes les activités prévues ou doit interrompre son entraînement avant son terme.
La séance peut avoir été lancée directement ou à partir d'une routine planifiée.
## Parcours

1. L'utilisateur démarre une séance.
2. Pendant son exécution, il peut :
    - mettre la séance en pause ;
    - reprendre la séance ;
    - passer directement à l'activité suivante ;
    - ignorer une activité ;
    - terminer une activité avant son terme ;
    - interrompre complètement la séance.
3. En cas d'interruption, l'application lui propose :
    - de reprendre immédiatement ;
    - d'abandonner définitivement la séance.
4. Si la séance est reprise, l'exécution reprend à la dernière activité enregistrée.
5. Lorsque la séance est terminée ou abandonnée, l'application présente un récapitulatif indiquant notamment :
    - les activités réalisées ;
    - les activités partiellement réalisées ;
    - les activités ignorées ;
    - les activités non commencées ;
    - la durée réelle de la séance ;
    - son statut.
6. L'utilisateur peut ajouter un commentaire ou un ressenti.
7. La séance est enregistrée dans l'historique avec son statut :
- Terminée : la séance a été exécutée jusqu'à son terme et toutes les activités ont été terminées.
- Partielle : la séance a été exécutée jusqu'à son terme, mais au moins une activité a été interrompue ou ignorée.
- Interrompue : la séance a été arrêtée avant la fin prévue.
## Points d'attention

- Une fermeture accidentelle de l'application ne doit pas faire perdre la séance en cours.
- Les données déjà enregistrées doivent pouvoir être restaurées.
- L'application ne doit pas obliger l'utilisateur à justifier chaque activité ignorée.
- La différence entre une séance suspendue, terminée et abandonnée doit rester compréhensible.
- La règle permettant de reprendre une séance après une très longue interruption est définie comme suit :
	- Si une Séance reste en pause pendant au moins 30 minutes consécutives, l'application demande à l'utilisateur s'il souhaite reprendre son Exécution.
	- Si l'utilisateur confirme, la séance reprend à l'activité où elle avait été interrompue.
	- En l'absence de réponse, la séance est automatiquement enregistrée avec le statut Interrompue.
	- Dans une version ultérieure, cette durée maximale pourra être configurée dans les préférences utilisateur.
## Résultat attendu

L'utilisateur conserve un historique fidèle de ce qu'il a réellement effectué, même lorsque la séance diffère de ce qui était initialement prévu.

# Parcours complémentaire 4 — Consulter le suivi des séances

## Objectif du parcours

Permettre à l'utilisateur de retrouver l'ensemble de ses séances exécutées, de consulter leur résultat, d'analyser leur déroulement et de suivre sa progression.
## Situation de départ

L'utilisateur a déjà exécuté une ou plusieurs séances.
Il souhaite consulter son historique afin de retrouver une séance, vérifier son déroulement ou suivre son activité au fil du temps.
## Parcours

1. L'utilisateur ouvre le menu **Suivi**.
2. Il consulte la liste chronologique de ses séances exécutées.
3. Il peut filtrer ou rechercher une séance selon différents critères.
4. Il sélectionne une séance.
5. La séance se déploie afin d'afficher le détail de son exécution.
6. Il consulte notamment :
   - la date et l'heure d'exécution ;
   - la durée réelle ;
   - le statut de la séance ;
   - le déroulement des cycles, blocs et activités ;
   - les activités terminées, partielles ou interrompues ;
   - les éventuels commentaires ou ressentis enregistrés.
7. Il replie la séance ou consulte une autre exécution.
## Points d'attention

- Le suivi présente uniquement les exécutions réalisées et jamais les séances elles-mêmes.
- Les informations affichées correspondent toujours à la version de la séance utilisée lors de son exécution.
- Une modification ultérieure d'une séance ou d'une routine n'altère jamais les informations enregistrées dans le suivi.
- Le détail d'une séance doit permettre de comprendre rapidement pourquoi son statut est **Terminée**, **Partielle** ou **Interrompue**.
- La structure des données du suivi doit permettre d'ajouter ultérieurement des tableaux de bord, graphiques et indicateurs de progression sans modifier le modèle métier.
## Résultat attendu

L'utilisateur dispose d'un historique fiable de toutes ses exécutions et peut suivre facilement son activité ainsi que sa progression au fil du temps.
# Parcours prévus pour une phase ultérieure

Les parcours suivants sont identifiés dès la conception mais ne font pas partie du MVP.
## Collaboration

- partager une séance avec une personne ou un groupe ;
- recevoir une séance partagée ;
- créer et administrer une séance collaborative ;
- gérer les droits de consultation et de modification ;
- conserver des copies personnelles indépendantes des séances partagées.

## Professionnels de santé et coachs

- recevoir une séance créée par un professionnel ;
- permettre à un professionnel de créer, mettre à jour et partager des séances ;
- suivre l'exécution des séances réalisées par un patient ou un client ;
- gérer plusieurs patients ou clients au sein d'une même interface.

## Synchronisation

- créer un compte utilisateur ;
- synchroniser les données entre plusieurs appareils ;
- sauvegarder automatiquement les données dans le cloud ;
- restaurer un historique complet sur un nouvel appareil.

## Intelligence artificielle

- proposer automatiquement des séances adaptées aux objectifs de l'utilisateur ;
- recommander des adaptations selon les performances ou les difficultés rencontrées ;
- analyser l'historique afin de proposer des évolutions progressives ;
- assister la création de nouvelles séances.

## Bibliothèque de contenus

- proposer une bibliothèque de séances et d'activités ;
- rechercher des contenus par catégorie, objectif ou zone corporelle ;
- importer des séances proposées par la communauté ou par des professionnels.

## Statistiques avancées

- suivre la progression sur plusieurs périodes ;
- comparer les performances entre différentes séances ;
- produire des tableaux de bord personnalisés ;
- partager certaines statistiques avec un professionnel.

