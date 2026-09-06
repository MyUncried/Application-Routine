# 09.0 Vue d'ensemble

## Objectif et périmètre

Ce chapitre décrit le modèle de données fonctionnel de l'application.

Il définit les principales entités métier, leurs relations, leur cycle de vie et les règles garantissant la cohérence des données.

Il est indépendant de toute technologie d'implémentation. Il ne décrit ni la structure de la base de données, ni les classes applicatives, ni les API.

Le modèle couvre les domaines fonctionnels suivants :

1. la définition des séances ;
2. leur planification par des routines ;
3. leur exécution ;
4. l'historique des exécutions ;
5. les référentiels et préférences de l'utilisateur.

Dans le MVP, toutes les données sont stockées localement sur l'appareil.

## Principes structurants

Le modèle de données fonctionnel est indépendant de la technologie de persistance. Les identifiants des entités sont stables et doivent rester compatibles avec l’ajout ultérieur d’une synchronisation cloud ou multi-appareils. Le choix du stockage local et des mécanismes de persistance relève du chapitre 12 – Architecture technique.

- Une **Séance** décrit le contenu d'un entraînement.
- Une **Routine** planifie l'exécution d'une séance.
- Une même séance peut être associée à plusieurs routines.
- Une séance contient un **cycle**.
- Un cycle contient un **Tour**.
- Le cycle et le Tour possèdent chacun un nombre de répétitions.
- Un Tour contient une suite ordonnée d'activités.
- Une activité est de type **Exercice** ou **Récupération**.
- Une activité de type Exercice possède un nombre de Séries propre, de 1 à 99 (D-092), et peut définir une pause appliquée après chaque Série. Cette pause est présentée à l'utilisateur comme un paramètre de l'Exercice, mais elle est représentée dans le modèle de données par une activité de type Récupération liée à cet Exercice.
- Une **Exécution de séance** est créée uniquement lorsqu'une séance démarre.
- Chaque exécution conserve un **instantané fonctionnel** immuable et allégé de la séance utilisée.
- Toute modification ultérieure d'une séance ou d'une routine est sans effet sur les exécutions déjà enregistrées.
- Les structures utilisées par le moteur d'exécution sont distinctes des entités métier.

## Vue d'ensemble du modèle

### Liste des entités

| Entité | Rôle dans l'application | Nature |
| --- | --- | --- |
| Utilisateur | Propriétaire des données | Principale |
| Séance | Définition réutilisable d'un entraînement | Principale |
| Cycle | Structure ordonnée de la séance portant son propre nombre de répétitions | Structure interne de séance |
| Tour | Conteneur ordonné d'activités portant son propre nombre de répétitions | Structure interne de séance |
| Routine | Planification d'une séance | Principale |
| Occurrence planifiée | Trace historisée d'une planification arrivée à échéance | Principale |
| Activité | Action élémentaire d'une séance | Principale |
| Média | Illustration future d'une Activité ; entité hors MVP | Post-MVP |
| Catégorie | Classement des séances | Métier |
| Zone corporelle | Partie du corps sollicitée | Métier |
| Exécution de séance | Réalisation effective d'une séance | Principale |
| Préférences globales | Paramètres généraux | Configuration |

## Décisions structurantes du modèle

| ID     | Décision                                                                                                                                                                                                     | Version        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| DM-001 | Une activité est de type **Exercice** ou **Récupération**.                                                                                                                                                   | V1             |
| DM-002 | La pause après Série est saisie comme un paramètre d'un Exercice mais est matérialisée dans le modèle de données par une activité de type Récupération liée à cet Exercice et réutilisée dans le plan après chaque Série. | V1 |
| DM-003 | Une séance contient un cycle unique.                                                                                                                                                                         | V1             |
| DM-004 | Un cycle contient un Tour unique.                                                                                                                                                                            | V1             |
| DM-005 | Le cycle et le Tour sont répétés par leurs paramètres de répétition.                                                                                                                                         | V1             |
| DM-006 | Une même séance peut être planifiée par plusieurs routines.                                                                                                                                                  | V1             |
| DM-007 | Une exécution crée automatiquement un instantané fonctionnel immuable et allégé de la séance.                                                                                                                                       | V1             |
| DM-008 | Les occurrences futures sont calculées dynamiquement à partir des Routines et ne sont pas stockées. À leur échéance, elles sont historisées afin de conserver leur résultat.                                 | V1             |
| DM-009 | Les exceptions de planification sont prévues pour une version ultérieure.                                                                                                                                    | V2             |
| DM-010 | Une seule entité Utilisateur locale existe dans la V1.                                                                                                                                                       | V1             |
| DM-011 | La cardinalité Cycle et Tour est limitée à 1 dans le MVP, mais le modèle est conçu pour permettre ultérieurement une collection ordonnée de Cycles par Séance et une collection ordonnée de Tours par Cycle. | Évolution      |
| DM-012 | Un Cycle, un Tour et une Activité appartiennent à une seule Séance ; ils ne sont pas partagés ni référencés par plusieurs Séances.                                                                           | V1 / Évolution |
| DM-013 | Un Exercice possède un nombre de Séries propre, entier de 1 à 99 (D-092). Une Série n'est pas une entité autonome. | V1 |
| DM-014 | La pause est appliquée après chaque Série ; après la dernière Série, elle est omise si l'étape suivante du plan d'exécution est une Récupération explicite. | V1 |

## Relations principales

```text
UTILISATEUR
│
├── possède 0..n SÉANCES
│       │
│       ├── appartient à 0..n CATÉGORIES
│       ├── contient 0..n ACTIVITÉS AVANT LE CYCLE
│       ├── contient 1 CYCLE
│       │      │
│       │      ├── nombre de répétitions
│       │      ├── contient 1 TOUR
│       │      │      │
│       │      │      ├── nombre de répétitions
│       │      │      └── contient 0..n ACTIVITÉS DANS LE TOUR
│       │      └── contient 0..n ACTIVITÉS APRÈS LE TOUR ET DANS LE CYCLE
│       └── contient 0..n ACTIVITÉS APRÈS LE CYCLE ET AVANT LA FIN DE SÉANCE
│
├── possède 0..n ROUTINES
│       └── planifie 1 SÉANCE
│
├── possède 0..n EXÉCUTIONS DE SÉANCE
│       ├── référence 1 SÉANCE
│       ├── contient 1 INSTANTANÉ DE SÉANCE
│       └── contient 1 ÉTAT D'EXÉCUTION
│
├── possède 0..n CATÉGORIES
├── possède 0..n ZONES CORPORELLES
└── possède 1 PRÉFÉRENCES GLOBALES
```

Les cardinalités représentées correspondent aux règles fonctionnelles du MVP. La représentation technique devra néanmoins conserver Cycles et Tours sous forme de collections ordonnées afin que les cardinalités puissent évoluer ultérieurement.
# 09.1 Entité Utilisateur

## Définition

Un **Utilisateur** représente le propriétaire des données de l'application.

Dans la V1, un seul utilisateur local existe sur l'appareil.

## Périmètre

Un utilisateur possède directement :

- ses informations générales ;
- sa couleur ;
- ses séances ;
- ses routines ;
- ses exécutions de séance ;
- ses catégories ;
- ses zones corporelles ;
- ses préférences globales.

Il ne contient pas directement les activités, les médias, les structures internes d'exécution ni les mécanismes d'authentification.

## Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Stable pendant toute la durée de vie |
| Nom affiché | Nom ou pseudonyme | Facultatif | Peut rester vide |
| Photo de profil | Image du profil | Facultatif | Média local |
| Date de création | Date de création | Obligatoire | Générée automatiquement |
| Date de modification | Dernière modification | Obligatoire | Mise à jour automatiquement |

## Règles métier

- Une seule instance d'utilisateur existe dans la V1.
- Un utilisateur possède 0..n séances.
- Un utilisateur possède 0..n routines.
- Un utilisateur possède 0..n exécutions de séance.
- Un utilisateur possède une seule structure de préférences globales.
- Toutes les données métier appartiennent directement ou indirectement à un seul Utilisateur. Les racines d’agrégat persistantes portent la référence de propriétaire ; les objets enfants héritent de cette propriété par leur rattachement.


# 09.2 Entité Séance

## Définition

Une **Séance** est une entité métier représentant le contenu réutilisable d’un entraînement.

Elle définit les Activités à réaliser, leur position avant le Tour, dans le Tour ou après le Tour, ainsi que les paramètres nécessaires à leur Exécution. Le Cycle reste une enveloppe technique fixée à une répétition.

Une séance peut être exécutée immédiatement ou planifiée par une ou plusieurs routines. Elle ne contient jamais les informations produites lors d’une exécution réelle.

## Périmètre

Une séance possède directement :

- ses informations générales ;
- un compte à rebours initial ;
- un cycle ;
- un Tour contenu dans le cycle ;
- les activités contenues dans le Tour ;
- une fin de séance ;
- le paramètre de répétition de son Tour ; le Cycle vaut toujours 1 dans le MVP.

Elle ne contient pas directement :

- les routines qui la planifient, qui constituent des entités distinctes ;
- les exécutions déjà réalisées ;
- l’historique ;
- les préférences globales ;
- les résultats ou états d’exécution ;
- les médias physiques, hors périmètre du MVP.

## Attributs fonctionnels

| Attribut                                | Description                                                               |          Caractère           | Règle principale                                                                                                                                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------- | :--------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Identifiant                             | Identifiant interne unique de la séance                                   |         Obligatoire          | Stable pendant toute la durée de vie de la séance                                                                                                                                                                                                      |
| Nom                                     | Nom affiché de la séance                                                  |         Obligatoire          | Saisi avant la création effective de la séance                                                                                                                                                                                                         |
| Couleur                                 | Couleur d'identification de la séance                                     |         Obligatoire          | Valeur proposée par défaut ; choix possible parmi une palette prédéfinie de 12 couleurs                                                                                                                                                                 |
| Catégories                              | Catégories de classement                                                  |          Facultatif          | Zéro, une ou plusieurs catégories appartenant au même utilisateur                                                                                                                                                                                      |
| Statut                                  | État de la séance                                                         |         Obligatoire          | Active ou archivée                                                                                                                                                                                                                                     |
| Date de création                        | Date de création effective                                                |         Obligatoire          | Générée automatiquement                                                                                                                                                                                                                                |
| Date de modification                    | Date de dernière modification                                             |         Obligatoire          | Mise à jour automatiquement                                                                                                                                                                                                                            |
| Date de dernière exécution              | Date de la dernière exécution de séance                                   |          Facultatif          | Sert notamment au classement du Catalogue de séances                                                                                                                                                                                                   |
| Date d’archivage                        | Date de passage au statut archivé                                         |         Conditionnel         | Renseignée uniquement si la séance est archivée                                                                                                                                                                                                        |
| Structure                               | Organisation complète de la séance                                        | Obligatoire pour l’exécution | Une séance peut être enregistrée vide, mais ne peut pas être exécutée sans activité de type Exercice                                                                                                                                                   |
| Durée estimée                           | Somme des durées déterminables de l’Exécution complète                    |           Calculé            | Inclut les phases et occurrences chronométrées du plan ; si au moins un Exercice est en Répétition, aucune durée ne lui est imputée et la valeur affichée est une borne minimale précédée de `≥`                                                       |
| Nombre d’Activités de la Composition    | Nombre d’Exercices et de Récupérations définis dans la Composition        |           Calculé            | Ne multiplie pas les Activités par les Séries, Tours ou Cycles et exclut les pauses intermédiaires techniques                                                                                                                                           |
| Nombre total d’Activités à exécuter     | Nombre d’occurrences d’Activités prévues dans le plan d’Exécution complet |           Calculé            | Calculé après développement des Séries, répétitions du Tour et du Cycle ; inclut les Récupérations techniques effectivement générées par les Pauses après Série ; exclut le Compte à rebours initial et la Fin de séance, qui ne sont pas des Activités |
| Durée du compte à rebours initial       | Durée de la phase précédant la première activité                          |         Obligatoire          | Valeur en secondes ; 0 s rend la phase instantanée                                                                                                                                                                                                     |
| Texte vocal du compte à rebours initial | Texte annoncé vocalement pendant ou au début du compte à rebours initial  |          Facultatif          | Valeur initiale issue des Préférences globales ; peut être vide                                                                                                                                                                                        |
| Durée de la fin de séance               | Durée de la phase suivant la dernière activité                            |         Obligatoire          | Valeur en secondes ; 0 s rend la phase instantanée                                                                                                                                                                                                     |
| Texte vocal de la fin de séance         | Texte annoncé vocalement pendant ou au début de la fin de séance          |          Facultatif          | Valeur initiale issue des Préférences globales ; peut être vide                                                                                                                                                                                        |
## Structure interne de la séance

La structure d’une séance est composée, dans l’ordre, de :
1. un Compte à rebours initial obligatoire, exécuté une seule fois ;
2. un Cycle technique unique et non affiché, toujours exécuté une fois ;
3. zéro, une ou plusieurs Activités placées avant le Tour ;
4. un Tour unique contenant une suite ordonnée d’Activités et répété de 1 à 99 fois ;
5. zéro, une ou plusieurs Activités placées après le Tour ;
6. une Fin de séance obligatoire, exécutée une seule fois après la dernière Activité.

Dans le MVP, le Cycle contient :
- son identifiant ;
- sa position, égale à 1 ;
- son nombre de répétitions, imposé à 1 ;
- un Tour unique ;
- les Activités positionnées avant ou après le Tour ;

Dans le MVP, le Tour contient :
- son identifiant ;
- sa position, égale à 1 ;
- son nombre de répétitions, supérieur ou égal à 1 ;
- une suite ordonnée d’Activités.

Le Cycle technique est exécuté une fois : les Activités placées avant le Tour sont exécutées une fois, le Tour est exécuté selon son nombre de répétitions, puis les Activités placées après le Tour sont exécutées une fois. La Fin de séance est ensuite exécutée.

Le Cycle et le Tour sont des structures internes de la Séance et ne peuvent pas être supprimés. Le Cycle n’est jamais exposé à l’utilisateur ; seule la répétition du Tour est modifiable.

#### Attributs fonctionnels du Cycle

| Attribut              | Description                              |  Caractère  | Règle principale                                                                         |
| --------------------- | ---------------------------------------- | :---------: | ---------------------------------------------------------------------------------------- |
| Identifiant           | Identifiant interne unique du Cycle      | Obligatoire | Stable pendant toute la durée de vie du Cycle                                            |
| Position              | Position du Cycle dans la Séance         | Obligatoire | Entier déterminant l’ordre d’exécution ; valeur 1 dans le MVP                            |
| Nombre de répétitions | Nombre d’exécutions successives du Cycle | Obligatoire | Valeur imposée **1** dans le MVP ; non modifiable et non exposée dans l’interface       |
| Tours                 | Collection ordonnée des Tours du Cycle   | Obligatoire | Exactement 1 Tour dans le MVP ; extensible à plusieurs Tours dans une version ultérieure |
| Activités hors Tour   | Activités ordonnées avant ou après le Tour | Obligatoire | Zéro ou plusieurs ; exécutées une seule fois selon leur position structurelle |
#### Attributs fonctionnels du Tour

| Attribut              | Description                               |  Caractère  | Règle principale                                              |
| --------------------- | ----------------------------------------- | :---------: | ------------------------------------------------------------- |
| Identifiant           | Identifiant interne unique du Tour        | Obligatoire | Stable pendant toute la durée de vie du Tour                  |
| Position              | Position du Tour dans le Cycle            | Obligatoire | Entier déterminant l’ordre d’exécution ; valeur 1 dans le MVP |
| Nombre de répétitions | Nombre d’exécutions successives du Tour   | Obligatoire | Entier de **1 à 99** ; valeur par défaut **1**                |
| Activités             | Collection ordonnée des Activités du Tour | Obligatoire | Zéro ou plusieurs pendant l’édition                           |
### Évolutivité de la structure

Dans le MVP :
 - une Séance contient exactement un Cycle ;
 - le Cycle contient exactement un Tour.

Cette cardinalité constitue une **règle fonctionnelle du MVP** et non une limitation structurelle du modèle.
 
Le modèle doit permettre ultérieurement :
- une collection ordonnée de Cycles appartenant à une même Séance ;
- une collection ordonnée de Tours appartenant à un même Cycle.
 
Chaque Cycle appartient exclusivement à une Séance.  
Chaque Tour appartient exclusivement à un Cycle et, par transitivité, à une seule Séance.  
Les Cycles et les Tours ne sont pas réutilisables ou partageables entre plusieurs Séances.
## Relations principales

- Une séance appartient à un seul utilisateur.
- Une séance peut être associée à zéro, une ou plusieurs catégories.
- Une séance peut être référencée par zéro, une ou plusieurs routines.
- Une séance contient un cycle unique.
- Le Cycle contient un Tour unique. Ces cardinalités sont des contraintes fonctionnelles du MVP ; le modèle représente les Cycles et les Tours sous forme de collections ordonnées afin de permettre leur extension ultérieure.
- Le Cycle peut contenir zéro, une ou plusieurs Activités avant le Tour et zéro, une ou plusieurs Activités après le Tour.
- Le Tour contient zéro, une ou plusieurs Activités pendant l’édition.
- Une séance exécutable contient au moins une activité de type **Exercice**.
- Une séance peut être à l’origine de zéro, une ou plusieurs exécutions de séance.

## Règles métier

- Le nom est obligatoire pour créer une séance.
- Deux séances peuvent porter le même nom.
- Chaque séance possède une couleur.
- Une couleur est proposée par défaut et peut être choisie parmi une palette prédéfinie de 12 couleurs.
- Une séance vide peut être conservée et modifiée, mais elle ne peut pas être exécutée.
- Une séance est exécutable dès qu’elle contient au moins une activité valide de type **Exercice**.
- Une séance composée uniquement d’activités de type **Récupération** n’est pas exécutable.
- Une séance peut être modifiée, dupliquée, archivée ou restaurée. Elle ne peut être supprimée qu’après archivage.
- La duplication crée une nouvelle séance indépendante avec un nouvel identifiant.
- La duplication conserve la couleur de la séance d'origine.
- La duplication copie la structure, les activités, les catégories et les paramètres de la séance, mais ne copie ni les routines, ni les exécutions passées.
- L’archivage conserve intégralement la séance et ses exécutions historiques.
- Une séance archivée ne peut plus être utilisée pour créer une nouvelle routine ou démarrer une nouvelle exécution tant qu’elle n’est pas restaurée.
- La suppression d’une Séance archivée demande toujours confirmation. Les Routines associées ont déjà été supprimées lors de l’archivage.
- La suppression d’une séance ne supprime jamais les exécutions déjà enregistrées ni leurs instantanés.
- Une modification de la séance n’altère jamais les exécutions déjà présentes dans le suivi.
- Le cycle et le Tour ne peuvent pas être supprimés.
- Le nombre de répétitions du Cycle vaut toujours 1 dans le MVP. Le nombre de répétitions du Tour est compris entre 1 et 99.
- Les activités peuvent être ajoutées, modifiées, déplacées, dupliquées ou supprimées.
- Les sons et les annonces vocales ne sont pas enregistrés dans la séance ; ils proviennent des préférences globales.
- La Durée estimée, le Nombre d’Activités de la Composition et le Nombre total d’Activités à exécuter sont recalculés après toute modification influençant le déroulement.
- Une séance peut exister sans routine et sans avoir jamais été exécutée.
- Le compte à rebours initial et la Fin de séance sont toujours présents dans la structure d'une séance et ne constituent pas des Activités.
- Une durée de 0 s rend le compte à rebours initial ou la Fin de séance instantané sans supprimer l'élément de la structure.

# 09.3 Entité Routine

## Définition

Une **Routine** est une entité métier qui planifie l'exécution d'une séance.

Elle ne décrit jamais le contenu d'un entraînement. Elle référence une séance existante et définit les règles selon lesquelles celle-ci doit être proposée ou exécutée.
## Périmètre

Une routine possède directement :

- la séance référencée ;
- la couleur héritée de la séance référencée (non stockée) ;
- sa date de début ;
- sa date de fin éventuelle ;
- son heure d'exécution ;
- son mode de planification ;
- pour une planification périodique, sa fréquence hebdomadaire, ses jours de la semaine et sa date de fin ;
- un rappel éventuel.

Elle ne contient pas directement :

- le contenu de la séance ;
- les activités ;
- les exécutions de séance ;
 - les occurrences futures du calendrier, calculées à la demande ;
## Attributs fonctionnels

| Attribut               | Description                                        |  Caractère   | Règle principale                                                                                  |
| ---------------------- | -------------------------------------------------- | :----------: | ------------------------------------------------------------------------------------------------- |
| Identifiant            | Identifiant unique de la routine                   | Obligatoire  | Stable pendant toute la durée de vie de la routine                                                |
| Séance                 | Séance planifiée par la routine                    | Obligatoire  | Référence une seule Séance non archivée appartenant au même Utilisateur                                 |
| Date de début          | Première date à laquelle la routine s’applique     | Obligatoire  | Ne peut pas être postérieure à la date de fin                                                     |
| Heure d’exécution      | Heure prévue pour l’occurrence                     | Obligatoire  | Identique pour toutes les occurrences de la routine dans le MVP                                   |
| Rappel                 | Rappel associé à la Routine                        |  Facultatif  | Zéro ou un rappel maximum ; délai appliqué à chaque occurrence                                    |
| Date de création       | Date de création de la routine                     | Obligatoire  | Générée automatiquement                                                                           |
| Mode de planification  | Définit si la Routine est répétée                  | Obligatoire  | Libellés UI : `Aucune` ou `Périodique`                                                            |
| Date de fin            | Dernière date d'application de la Routine          | Conditionnel | Obligatoire pour une planification périodique ; doit être postérieure ou égale à la date de début |
| Fréquence hebdomadaire | Nombre de semaines entre deux périodes d’exécution | Conditionnel | Entier ≥ 1 ; obligatoire pour une planification périodique                                        |
| Jours de la semaine    | Jours d'exécution de la Routine                    | Conditionnel | Au moins un jour obligatoire pour une planification périodique                                    |
## Règles métier

- Une routine appartient à un seul utilisateur.
- Une routine référence toujours une seule séance.
- Une routine reprend toujours la couleur de la séance qu'elle référence.
- Une Routine peut être créée uniquement à partir d’une Séance non archivée appartenant au même Utilisateur.
- Une séance peut être planifiée par zéro, une ou plusieurs routines.
- Une séance peut être exécutée directement sans être associée à une routine.
- Une routine définit une seule règle de planification.
- Une Routine utilise le mode affiché `Aucune` ou `Périodique`. Dans le MVP, le mode `Périodique` utilise uniquement une périodicité hebdomadaire.
- Une Routine périodique possède une date de fin obligatoire.  
- Une Routine périodique possède une fréquence hebdomadaire supérieure ou égale à 1 et au moins un jour de la semaine sélectionné.  
- Plusieurs exécutions d'une même Séance à des horaires différents, y compris le même jour, sont représentées par plusieurs Routines distinctes.
- Une Routine génère des occurrences pendant sa période de validité tant qu'elle existe.
- Les occurrences futures du calendrier sont calculées à la demande à partir des attributs de la Routine et ne sont pas stockées. Une occurrence est historisée lorsqu'elle arrive à échéance afin de conserver son résultat.
- Plusieurs routines peuvent générer des occurrences pour une même séance.
- Plusieurs routines peuvent générer une occurrence le même jour ou à la même heure.
- Les conflits entre routines ne sont pas bloquants dans le MVP.
- Une modification de la Routine s'applique uniquement au calcul des occurrences futures. Elle ne modifie pas les occurrences déjà historisées.
- Une modification de la routine n’a aucun effet sur les exécutions de séance déjà créées.
- La suppression d'une Routine met fin au calcul de ses occurrences futures. Les occurrences déjà historisées et les Exécutions déjà enregistrées sont conservées.
- La suppression d’une routine ne supprime jamais la séance référencée.
- La suppression d’une routine ne supprime jamais les exécutions de séance déjà enregistrées.

# 09.3.1 Règles de planification

## Objectif

Ce chapitre définit les règles de fonctionnement des routines de planification.

Il précise la génération des occurrences, les règles de récurrence, les rappels ainsi que le comportement de la planification dans les principales situations fonctionnelles.

## Types de planification

Le MVP prend en charge deux modes de planification :

- **Aucune** : une seule occurrence est créée à la date et à l'heure définies.
- **Périodique** : les occurrences sont générées selon une périodicité hebdomadaire définie par :
    - une fréquence en semaines supérieure ou égale à 1 ;
    - un ou plusieurs jours de la semaine ;
    - une date de fin obligatoire.

Sélectionner les sept jours de la semaine permet d'obtenir une exécution quotidienne. Il n'existe donc pas de type de récurrence `Quotidienne` distinct.

Une Routine ne définit qu'une seule heure d'exécution. Pour planifier plusieurs exécutions d'une même Séance à des horaires différents, l'utilisateur crée plusieurs Routines.

Les autres formes de récurrence, notamment mensuelles, annuelles ou personnalisées, ne sont pas prises en charge dans le MVP.

## Génération des occurrences

Les occurrences futures d'une Routine ne sont pas stockées. Elles sont calculées dynamiquement à partir des paramètres de la Routine.

Lorsqu'une occurrence arrive à échéance, elle est historisée afin de conserver son résultat.

Le calcul dynamique est effectué chaque fois que l'application doit afficher les occurrences futures ou déterminer les prochaines séances planifiées.

Elles sont calculées dynamiquement à partir :

- de la date de début ;
- du type de planification ;
- des paramètres de récurrence ;
- de la date de fin éventuelle.

Le calcul est effectué chaque fois que l'application doit afficher les occurrences ou déterminer les prochaines séances planifiées.

## Rappels

Chaque routine peut définir un rappel facultatif.

Le MVP propose les valeurs suivantes :

- Aucun ;
- 5 minutes avant ;
- 10 minutes avant ;
- 30 minutes avant ;
- 1 heure avant ;
- Personnalisé.

Le mode **Personnalisé** permet de choisir librement le délai précédant chaque occurrence.

## Occurrence non exécutée

Lorsqu'une occurrence planifiée arrive à échéance sans que la Séance ait été démarrée, aucune Exécution n'est créée.

L'occurrence est alors historisée avec le statut **Non exécutée**.

Dans le MVP, cette occurrence n'est toutefois pas exposée dans l'interface : elle disparaît du Calendrier une fois passée et n'apparaît pas dans le Suivi.

Cette occurrence historisée permet de conserver la trace d'une séance planifiée mais non réalisée.

## Modification d'une routine

Toute modification d'une Routine s'applique uniquement au calcul des occurrences futures.
Les occurrences déjà historisées ne sont jamais modifiées.
Les exécutions de séance déjà réalisées restent inchangées.

## Suppression d'une routine

La suppression d'une routine :

- met fin au calcul de ses occurrences futures ;
- conserve toutes les occurrences déjà historisées, qu'elles soient `Exécutées` ou `Non exécutées` ;
- ne supprime jamais la Séance associée ;
- ne supprime jamais les Exécutions déjà enregistrées.

## Affichage dans l'agenda

Les occurrences sont affichées dans l'agenda.
Les jours comportant au moins une occurrence sont identifiés par un indicateur visuel.
La couleur de cet indicateur correspond à la couleur de la séance planifiée.
Lorsque plusieurs occurrences sont prévues le même jour, plusieurs indicateurs sont affichés, dans la limite de l'espace disponible.

# 09.4 Entité Occurrence planifiée
### Définition
 
Une Occurrence planifiée représente la trace historisée d'une planification arrivée à échéance.  
Les occurrences futures calculées dynamiquement ne constituent pas des objets persistés.
 
### Périmètre

Une Occurrence planifiée possède directement :

- la Routine qui l'a générée ;
- la Séance concernée ;
- la date et l'heure auxquelles la Séance était planifiée ;
- son statut ;
- le cas échéant, l'Exécution correspondante.

### Attributs fonctionnels

| Attribut     | Description                                   |    Caractère | Règle principale                                     |
| ------------ | --------------------------------------------- | -----------: | ---------------------------------------------------- |
| Identifiant  | Identifiant unique de l'occurrence historisée |  Obligatoire | Stable                                               |
| Routine      | Routine ayant généré l'occurrence             |  Obligatoire | Référence à la Routine d'origine                     |
| Séance       | Séance concernée                              |  Obligatoire | Référence à la Séance planifiée                      |
| Date prévue  | Date planifiée                                |  Obligatoire | Valeur issue de la Routine au moment de l'occurrence |
| Heure prévue | Heure planifiée                               |  Obligatoire | Valeur issue de la Routine au moment de l'occurrence |
| Statut       | Résultat de l'occurrence                      |  Obligatoire | `Exécutée` ou `Non exécutée`                         |
| Exécution    | Exécution associée                            | Conditionnel | Présente uniquement si la Séance a été démarrée      |
### Règles métier

- Une Occurrence planifiée est normalement persistée à son échéance. **Exception :** lorsqu’une occurrence future est exécutée en avance depuis l’action `Démarrer` de sa carte, elle est persistée immédiatement avec sa date/heure initialement planifiées et son lien vers l’Exécution réelle, afin de ne pas être reproposée à son horaire initial.
- Une occurrence future reste calculée dynamiquement et n'est pas persistée.
- Le statut d'une occurrence historisée est `Exécutée` ou `Non exécutée`.
- Une occurrence `Exécutée` référence l'Exécution correspondante.
- Une occurrence `Non exécutée` ne possède aucune Exécution associée.
- Une occurrence historisée est conservée même si la Routine d'origine est ensuite modifiée ou supprimée.
# 09.5 Entité Activité

## Définition

Une **Activité** est la plus petite unité exécutable d'une séance.

Elle appartient à une seule Séance et est de type **Exercice** ou **Récupération**. Dans le MVP, sa position détermine son ordre à l’intérieur du Tour visible.

Une activité de type Récupération peut être créée explicitement par l'utilisateur ou être générée à partir du paramètre de pause d'un Exercice. Dans ce second cas, elle reste masquée comme activité autonome dans l'interface de composition et sert au plan d'exécution après les Séries de l'Exercice.

## Périmètre

Une activité possède directement :

- son identité ;
- son type ;
- son nom ;
- sa consigne ;
- son mode d'exécution ;
- sa durée ou son nombre de répétitions ;
- son nombre de Séries, lorsqu'elle est de type Exercice ;
- sa Récupération après Série éventuelle, lorsqu'elle est de type Exercice ;
- le lien vers l'Exercice d'origine lorsqu'elle est une Récupération générée par une pause après Série ;
- ses zones corporelles ;
- aucun média dans le MVP ; une association optionnelle sera ajoutée après le MVP ;
- sa position structurelle dans la Séance et son ordre au sein de cette position.

Elle ne contient pas directement :

- le Tour ;
- le cycle ;
- la séance ;
- les préférences globales.

## Attributs fonctionnels

| Attribut                   | Description                                     |         Caractère         | Règle principale                                                              |
| -------------------------- | ----------------------------------------------- | :-----------------------: | ----------------------------------------------------------------------------- |
| Identifiant                | Identifiant unique                              |        Obligatoire        | Stable                                                                        |
| Position structurelle      | Emplacement de l’Activité dans la Composition   |        Obligatoire        | `Avant Tour`, `Dans Tour` ou `Après Tour`                                      |
| Position                   | Ordre au sein de la position structurelle       |        Obligatoire        | Entier déterminant l’ordre d’exécution                                         |
| Tour                       | Tour contenant l’Activité                       |       Conditionnel        | Obligatoire uniquement pour une Activité `Dans Tour`                           |
| Type                       | Exercice ou Récupération                        |        Obligatoire        |                                                                               |
| Nom                        | Libellé affiché                                 |        Obligatoire        |                                                                               |
| Consigne                   | Instructions                                    |        Facultatif         |                                                                               |
| Mode d'exécution           | Durée ou Répétitions                            | Obligatoire pour Exercice |                                                                               |
| Durée                      | Durée                                           |       Conditionnel        | Activité chronométrée                                                         |
| Nombre de répétitions      | Répétitions                                     |       Conditionnel        | Exercice en mode Répétition                                                   |
| Nombre de Séries           | Entier                                          | Obligatoire pour Exercice | Valeur ≥ 1 ; paramètre propre à l'Activité                                     |
| Récupération après Série   | Activité Récupération liée à l'Exercice        |        Facultatif         | Exercice uniquement ; référence zéro ou une activité Récupération associée    |
| Exercice d'origine         | Exercice ayant généré cette Récupération        |       Conditionnel        | Renseigné uniquement pour une Récupération créée via « Pause après Série » |
| Zones corporelles          | Zones sollicitées                               |        Facultatif         | Exercice uniquement                                                           |
| Média                      | Photo ou vidéo                                  |        Hors MVP           | Évolution prévue : zéro ou un média                                           |

## Règles métier

- Une Activité appartient à une seule Séance et occupe exactement une position structurelle ordonnée. Seules les Activités `Dans Tour` référencent le Tour.
- Une activité est de type Exercice ou Récupération.
- Une activité Exercice peut être exécutée selon une durée ou un nombre de répétitions.
- Une activité Récupération est toujours chronométrée.
- Une activité Exercice possède un nombre de Séries entier de 1 à 99 (D-092) ; la valeur par défaut à la création est 1.
- Une Série correspond à une exécution de l'Exercice selon son mode, suivie de la récupération associée lorsqu'elle existe.
- Une activité Exercice peut définir zéro ou une Récupération après Série.
- Lorsqu'elle est définie, cette Récupération est matérialisée par une activité de type Récupération liée à l'Exercice et reste masquée comme activité autonome dans l'interface de composition.
- Le plan d'exécution insère cette Récupération après chaque Série. Après la dernière Série, il ne l'insère pas si l'étape suivante est une Récupération explicite.
- Une activité Récupération générée par une pause référence l'Exercice qui l'a créée.
- Une activité Récupération ne peut pas elle-même définir de Récupération après Série.
- Cette modélisation permet de distinguer les durées de travail des durées de récupération dans l'exécution et l'historique.
- Seules les activités Exercice peuvent être associées à des zones corporelles.
- Les activités peuvent être ajoutées, déplacées, dupliquées et supprimées.
- Leur ordre est conservé à l’intérieur de leur position structurelle. Une Activité peut être déplacée manuellement d’une position structurelle à une autre.

# 09.6 Entité Média

> **Périmètre : post-MVP.** Cette entité est conservée pour préparer l’évolution, mais aucune fonctionnalité Média n’est exposée ni persistée dans le MVP.

## Définition

Un **Média** est une ressource visuelle qui pourra être associée à une Activité après le MVP. Aucune association Média n’est créée ni exposée dans le MVP.

## Périmètre

Un média possède son identité, ses informations techniques et la référence vers l'activité à laquelle il est associé.

## Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Stable |
| Activité | Activité associée | Obligatoire | Une seule activité |
| Type | Photo ou vidéo | Obligatoire | |
| Emplacement local | Référence du fichier | Obligatoire | Stockage local |
| Nom du fichier | Nom technique | Obligatoire | |
| Miniature | Aperçu | Facultatif | Générée automatiquement |
| Taille | Taille du fichier | Calculé | |
| Durée | Durée de lecture | Conditionnel | Vidéo uniquement |

## Règles métier

- Un média appartient à une seule activité.
- Une activité peut ne posséder aucun média.
- Une activité possède au maximum un média.
- La duplication d’une Activité ou d’une Séance crée une nouvelle association/entité Média pour l’Activité dupliquée ; cette association peut référencer le même fichier physique local.
- La suppression d’un média est toujours autorisée, même s’il est référencé par plusieurs associations : le fichier physique est supprimé et toutes ses associations sont retirées. Les Activités concernées restent valides et deviennent sans média.


# 09.7 Entité Exécution de séance

## Définition

Une **Exécution de séance** représente la réalisation effective d'une séance.

Elle est créée uniquement au démarrage d'une séance et reste indépendante des modifications ultérieures de la séance ou de sa routine.

## Périmètre

Une exécution possède directement :

- la séance exécutée ;
- la routine ayant éventuellement déclenché l'exécution ;
- un instantané de séance ;
- un état d'exécution ;
- ses informations de début et de fin.

## Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Créé au démarrage |
| Séance | Séance exécutée | Obligatoire | Référence unique |
| Routine | Routine d'origine | Facultatif | Peut être absente |
| Instantané de séance | Copie figée de la séance | Obligatoire | Créé automatiquement |
| État d'exécution | Avancement | Obligatoire | Mis à jour en continu |
| Date de début | Début réel | Obligatoire | Générée automatiquement |
| Date de fin | Fin réelle | Facultatif | À la clôture |
| Statut | En cours, Suspendue, Terminée, Partielle ou Interrompue | Obligatoire | |
| Durée réelle | Temps actif réellement exécuté | Calculé | Exclut les périodes de Pause utilisateur ; inclut le temps réellement passé dans les Exercices en Répétition et toutes les phases/Activités effectivement exécutées |
| Dernière sauvegarde | Date de sauvegarde | Obligatoire | Technique |
| Ressenti | Ressenti général renseigné dans la Synthèse | Conditionnel | Obligatoire dès lors que la Synthèse est présentée ; peut être absent après interruption technique sans Synthèse |
| Commentaire | Commentaire libre de Synthèse | Facultatif | **200 caractères maximum** |
| Nombre d’Activités exécutées | Nombre de Résultats d’Activité exécutée effectivement créés | Calculé | Une Activité `Partielle` compte comme exécutée ; une Activité jamais atteinte ne compte pas ; utilisé notamment pour le Suivi et les indicateurs historiques |
| Occurrence planifiée satisfaite | Occurrence future éventuellement satisfaite par une Exécution anticipée | Facultatif | Renseignée lorsqu’une occurrence future est démarrée en avance |

## Structures internes

### Instantané de séance

L’Instantané de séance est une copie figée et allégée de la définition fonctionnelle de la Séance au moment du démarrage de l’Exécution.

Il contient uniquement les informations nécessaires pour :
- reconstruire l’ordre et le contenu de la Séance exécutée ;
- restituer fidèlement l’Exécution dans l’historique ;
- calculer les informations de suivi prévues par le MVP.

Il ne contient pas de copie physique des médias associés aux Activités.

| Élément conservé         | Contenu                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Séance                   | Identifiant source, nom, couleur, catégorie(s)                                                                 |
| Compte à rebours initial | Durée, texte vocal                                                                                             |
| Cycle                    | Identifiant, position, nombre de répétitions                                                                   |
| Tour                      | Identifiant, position, nombre de répétitions                                                                   |
| Exercice                 | Identifiant source, nom, mode d’exécution, durée ou répétitions, nombre de Séries, consigne, zones corporelles |
| Récupération             | Identifiant source, nom éventuel, durée                                                                        |
| Pause après Série        | Représentée par la Récupération correspondante et la règle d'insertion dans le plan d'exécution                |
| Fin de séance            | Durée, texte vocal                                                                                             |
| Structure                | Ordre exact des éléments et relations nécessaires au plan d’exécution                                          |

Les médias ne sont pas dupliqués dans l’Instantané. Leur modification ou suppression ultérieure ne remet pas en cause la lisibilité fonctionnelle de l’historique.

L’Instantané est persisté sous forme de **JSON immuable**. Les champs nécessaires à la consultation chronologique du Suivi MVP sont conservés sous une forme permettant un accès efficace sans dépendre de la Séance courante. Les index spécifiques à la recherche, au tri et aux filtres avancés ne sont pas requis par l’interface MVP et pourront être ajoutés lors de l’activation de ces fonctions.

### État d'exécution

Contient notamment :

- activité courante ;
- Tour courant ;
- cycle courant ;
- état temporel courant ;
- état du chronomètre.

## Règles métier

- Une exécution est créée uniquement au démarrage d'une séance.
- Elle référence une seule séance.
- Elle peut référencer une routine.
- Un Instantané de séance est créé automatiquement au démarrage effectif de l’Exécution.
- L’Instantané est immuable après sa création.
- Toute modification, archivage ou suppression ultérieure de la Séance source est sans effet sur l’Instantané.
- L’Exécution conserve la référence à la Séance source lorsqu’elle existe, mais son historique est reconstruit exclusivement à partir de l’Instantané.
- Les médias ne sont pas copiés dans l’Instantané.
- Toute modification ultérieure de la routine est sans effet.
- Une seule exécution peut être en cours simultanément.
- Après une interruption technique alors que l’Exécution était `En cours`, elle n’est pas clôturée automatiquement. Au retour dans l’application, l’utilisateur doit choisir `Reprendre la séance` ou `Arrêter la séance`. Tant que ce choix n’est pas effectué, aucune nouvelle Exécution ne peut démarrer. `Arrêter la séance` clôt l’Exécution avec le statut `Interrompue` puis ouvre la Synthèse.
- Une exécution terminée, partielle ou interrompue est conservée dans le suivi.


# 09.7.1 Résultat d’Activité exécutée

Chaque occurrence d’Activité parcourue pendant une Exécution produit un **Résultat d’Activité exécutée** distinct. Il permet de distinguer les occurrences issues des Séries, répétitions de Tour et répétitions de Cycle.

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique du résultat | Obligatoire | Stable |
| Exécution | Exécution concernée | Obligatoire | Une seule Exécution |
| Activité de l’Instantané | Activité source | Obligatoire | Référence l’Instantané, pas la Séance courante |
| Position d’exécution | Rang dans le plan d’exécution | Obligatoire | Permet de distinguer les occurrences |
| Série / Tour / Cycle | Indices de répétition applicables | Calculé | Conservés pour restitution |
| Statut | Résultat de l’occurrence | Obligatoire | `Terminée` ou `Partielle` selon le type et le déroulement |
| Durée réelle | Temps réellement passé sur l’Activité | Obligatoire | Chronométré pour les modes Durée et Répétition |

Ces résultats sont conservés avec l’Exécution et permettent de calculer le **Nombre d’Activités exécutées** et les indicateurs de Suivi.

# 09.8 Structures internes du moteur d'exécution

## Définition

Le moteur d'exécution est le composant chargé de transformer une **séance** en une succession d'activités exécutables.

Au démarrage d'une séance, il construit un **plan d'exécution** à partir de l'**instantané de séance** créé pour cette exécution.

Le plan d'exécution est ensuite parcouru séquentiellement jusqu'à la fin de la séance.

Le moteur d'exécution, le plan d'exécution et les structures qu'il manipule sont des structures internes de calcul. Ils ne constituent pas des entités métier.

## Plan d'exécution

### Définition

Le plan d'exécution est la représentation linéaire de la séance obtenue après résolution de sa structure.

Le Compte à rebours initial structurellement présent, éventuellement instantané à `0 s`, les Activités placées avant le Tour, les répétitions du Tour et les Activités placées après le Tour sont développés afin d'obtenir une liste ordonnée directement exploitable. Le Cycle technique enveloppe cette structure avec une répétition imposée à `1` dans le MVP ; la Fin de séance est ajoutée à la suite du plan développé.

### Contenu

- liste ordonnée des activités ;
- ordre d'exécution ;
- références vers les activités de l'instantané ;
- numéro de répétition du Tour ;
- numéro de répétition du cycle ;
- informations de navigation.

## Activité d'exécution

### Attributs fonctionnels

| Attribut            | Description                                |  Caractère  | Règle principale                  |
| ------------------- | ------------------------------------------ | :---------: | --------------------------------- |
| Position            | Rang dans le plan d'exécution              |   Calculé   | Numérotation continue             |
| Activité            | Activité de l'instantané                   | Obligatoire | Référence unique                  |
| Type                | Compte à rebours, Exercice ou Récupération |   Calculé   | Déduit de l'activité              |
| Répétition du Tour  | Numéro de répétition du Tour               |   Calculé   | Généré automatiquement            |
| Répétition du cycle | Numéro de répétition du cycle              |   Calculé   | Généré automatiquement            |
| Activité suivante   | Navigation                                 |   Calculé   | Absente pour la dernière activité |

## Règles métier

- Le plan d'exécution est généré automatiquement au démarrage de chaque exécution de séance.
- Il est construit exclusivement à partir de l'instantané de séance.
- Toute modification ultérieure de la séance ou de la routine est sans effet.
- Les répétitions du Tour et du cycle sont résolues lors de la génération.
- Les préférences globales sont appliquées pendant l'exécution sans modifier le plan.


# 09.9 Entité Préférences globales

## Définition

Les **Préférences globales** regroupent les paramètres personnels influençant le comportement général de l'application.

Elles s'appliquent à toutes les séances et à toutes les exécutions, sans modifier leur définition.

## Périmètre

Les préférences possèdent directement :

- les paramètres audio ;
- les paramètres d'affichage ;
- les paramètres d'exécution ;
- les valeurs proposées par défaut lors de la création de nouvelles séances ou activités.

Elles ne contiennent pas directement :

- les séances ;
- les routines ;
- les activités ;
- les exécutions de séance.

## Attributs fonctionnels

| Attribut                                           | Description                                                                |  Caractère  | Règle principale                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------- | :---------: | ------------------------------------------------------------------------ |
| Sons activés                                       | Active les signaux sonores                                                 | Obligatoire | Préférence globale                                                       |
| Annonces vocales                                   | Active les annonces vocales                                                | Obligatoire | Préférence globale                                                       |
| Notifications                                      | Autorisation effective des rappels locaux                                  | Obligatoire | Non autorisées par défaut ; demande système lors de la première activation d’un rappel |
| Vibration                                          | Active les vibrations fonctionnelles de séance                             | Facultatif  | Valeur initiale activée ; n'affecte pas le feedback haptique systématique des roulettes numériques |
| Écran maintenu actif                               | Empêche la mise en veille pendant une exécution de séance                  | Facultatif  | Pendant l'exécution uniquement                                           |
| Durée par défaut d'une activité Exercice           | Valeur initiale proposée                                                   | Facultatif  | Création uniquement                                                      |
| Durée par défaut d'une activité Récupération       | Valeur initiale proposée                                                   | Facultatif  | Création uniquement                                                      |
| Pause après Série par défaut                       | Valeur proposée après chaque Série d'un Exercice                           | Facultatif  | Création uniquement                                                      |
| Date de création                                   | Date de création                                                           | Obligatoire | Générée automatiquement                                                  |
| Date de modification                               | Dernière modification                                                      | Obligatoire | Mise à jour automatiquement                                              |
| Durée du compte à rebours initial par défaut       | Durée proposée pour le compte à rebours initial d'une nouvelle séance      | Obligatoire | Valeur initiale : `10 s`                                                 |
| Texte vocal du compte à rebours initial par défaut | Texte vocal proposé pour le compte à rebours initial d'une nouvelle séance | Facultatif  | Valeur initiale : `Préparez-vous`                                        |
| Durée de la fin de séance par défaut               | Durée proposée pour la fin de séance d'une nouvelle séance                 | Obligatoire | Valeur initiale : `5 s`                                                  |
| Texte vocal de la fin de séance par défaut         | Texte vocal proposé pour la fin de séance d'une nouvelle séance            | Facultatif  | Valeur initiale : `Séance terminée, bravo`                               |
## Règles métier

- Chaque utilisateur possède une seule structure de préférences globales.
- Les préférences s'appliquent à toutes les séances et à toutes les exécutions.
- Modifier une préférence n'altère jamais les séances existantes.
- Les valeurs par défaut sont utilisées uniquement lors de la création de nouveaux éléments.
- Une exécution de séance utilise les préférences actives au moment de son démarrage.
- Une modification des préférences ne modifie jamais une exécution déjà en cours.
- Les préférences sont enregistrées automatiquement après chaque modification.
- Les valeurs par défaut du compte à rebours initial et de la fin de séance sont copiées dans la séance lors de sa création.
- Une modification ultérieure des Préférences globales ne modifie pas les séances déjà créées


# 09.10 Entité Catégorie

## Définition

Une **Catégorie** permet de classer les **séances** afin d'en faciliter l'organisation, le filtrage et la recherche.

L'application fournit une liste de catégories par défaut, que l'utilisateur peut compléter et personnaliser.
## Périmètre

Une catégorie possède directement :

- son identité ;
- son libellé ;
- son apparence ;
- son ordre d'affichage.

Elle ne contient pas directement :

- les séances ;
- les activités ;
- les routines ;
- les exécutions de séance.

Les **séances** référencent zéro, une ou plusieurs catégories.
## Attributs fonctionnels

| Attribut             | Description                   |  Caractère  | Règle principale                                     |
| -------------------- | ----------------------------- | :---------: | ---------------------------------------------------- |
| Identifiant          | Identifiant unique            | Obligatoire | Stable pendant toute la durée de vie de la catégorie |
| Utilisateur           | Propriétaire de la catégorie  | Obligatoire | Une catégorie appartient à un seul utilisateur              |
| Nom                  | Libellé affiché               | Obligatoire | Non vide après trim ; maximum `40` caractères ; unique par utilisateur après normalisation canonique |
| Icône                | Icône représentative          | Facultatif  | Choisie dans la bibliothèque de l'application        |
| Couleur              | Couleur d'affichage           | Facultatif  | Choisie dans la palette de l'application             |
| Ordre d'affichage    | Position dans les listes      | Obligatoire | Prédéfinies selon `displayOrder`, puis personnalisées par date de création croissante ; non modifiable manuellement dans le MVP |
| Date de création     | Date de création              | Obligatoire | Générée automatiquement                              |
| Date de modification | Dernière modification         | Obligatoire | Mise à jour automatiquement                          |
## Règles métier

- Une séance peut être associée à zéro, une ou plusieurs catégories.
- Un utilisateur peut créer et personnaliser ses catégories.
- Le nom d'une catégorie est limité à `40` caractères après trim et est unique pour un même utilisateur après normalisation canonique de comparaison.
- Une tentative de création avec un nom normalisé déjà existant ne crée pas de doublon : elle réutilise et sélectionne la Catégorie existante.
- Les Catégories prédéfinies sont affichées selon leur `displayOrder`. Les Catégories personnalisées viennent ensuite, par date de création croissante. La sélection ou l’utilisation d’une Catégorie ne change pas sa position et aucune réorganisation manuelle n’est disponible dans le MVP.
- Une Catégorie personnalisée créée depuis le parcours de création d’une Séance reste une donnée du brouillon jusqu’à l’enregistrement final. Son existence temporaire est distincte de sa sélection : la désélection ne la supprime pas du brouillon et elle peut être resélectionnée sans doublon. Les allers-retours entre Composition et Catégories conservent ces deux états séparément. Elle n’acquiert une identité persistante que dans la transaction finale, uniquement si elle est sélectionnée.
- L’abandon du parcours ou l’échec de cette transaction ne laisse aucune Catégorie personnalisée orpheline dans le référentiel persistant.
- Une catégorie peut être utilisée par zéro, une ou plusieurs séances.
- À partir du MVP bis, une Catégorie peut être supprimée, qu’elle soit utilisée ou non.
- Si une Catégorie supprimée à partir du MVP bis est utilisée par une ou plusieurs Séances, elle est retirée de ces Séances.
- Cette suppression ne modifie jamais les Instantanés d’Exécution déjà enregistrés.
- Les Instantanés historiques conservent le libellé de la Catégorie tel qu’il existait au moment de l’Exécution.
# 09.11 Entité Zone corporelle

## Définition

Une **Zone corporelle** désigne une partie du corps principalement sollicitée par une activité de type Exercice.

L’application fournit un référentiel prédéfini de Zones corporelles utilisé pour caractériser les Activités de type Exercice. Ce référentiel n’est pas administrable par l’utilisateur dans le MVP.

## Périmètre

Une Zone corporelle possède directement :

- son identité ;
- son nom ;
- son ordre d’affichage.

Les activités référencent zéro, une ou plusieurs zones corporelles. Une zone corporelle ne contient pas directement les activités qui l’utilisent.

## Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Stable |
| Nom | Libellé affiché | Obligatoire | Unique dans le référentiel |
| Ordre d’affichage | Position dans les listes | Obligatoire | Défini par l’application |

## Règles métier

- Une Activité de type **Exercice** peut être associée à zéro, une ou plusieurs Zones corporelles.
- Une Activité de type **Récupération** ne peut jamais être associée à une Zone corporelle.
- Les Zones corporelles constituent un référentiel prédéfini de l’application.
- L’utilisateur ne peut ni créer, ni modifier, ni supprimer une Zone corporelle dans le MVP.

## Référentiel MVP (D-093)

1. Cou
2. Épaules
3. Bras
4. Poignets et mains
5. Dos
6. Hanches et bassin
7. Cuisses
8. Genoux
9. Jambes
10. Chevilles et pieds

Aucune zone `Corps entier`, aucune distinction gauche/droite. Le référentiel est volontairement structuré pour rester évolutif (identité, nom, ordre d’affichage ci-dessus) — cette liste n’est pas figée dans le code applicatif.

# 09.12 Règles d’intégrité et de copie

## Objectif

Ce chapitre définit les règles garantissant la cohérence du modèle de données ainsi que le comportement des opérations de duplication, d'archivage, de suppression et de conservation des données.

## Règles d'intégrité

### Identité

- Chaque entité possède un identifiant unique et stable.
- Deux entités distinctes ne peuvent jamais partager le même identifiant.
- Les identifiants sont générés automatiquement.

### Cohérence des relations

- Toute Activité appartient à une seule Séance et occupe une seule position structurelle ; seules les Activités `Dans Tour` appartiennent au Tour pour l’exécution structurelle.
- Tout Tour appartient à un seul cycle.
- Tout cycle appartient à une seule séance.
- Toute routine référence une seule séance.
- Toute exécution de séance référence une seule séance.
- Toute Catégorie personnalisée appartient à un seul Utilisateur.
- Les Zones corporelles appartiennent au référentiel applicatif et ne sont pas rattachées à un Utilisateur.

### Cohérence des données

- Une séance exécutable contient au moins une activité de type **Exercice**.
- Une activité **Récupération** est toujours chronométrée, se termine automatiquement, ne possède jamais de zone corporelle et reçoit par défaut le nom `Récupération` lors de sa création.
- Les nombres de répétitions du Tour et du cycle sont toujours supérieurs ou égaux à 1.

## Duplication d'une séance

- Nouvelle séance avec un nouvel identifiant.
- Copie de la couleur de la séance.
- Copie du Cycle, du Tour, des Activités et des Catégories. Après le MVP, si un média est réutilisé, une nouvelle association Média pourra référencer le même fichier physique.
- Les routines et les exécutions de séance ne sont jamais copiées.

## Duplication d'une activité

- Nouvelle activité avec un nouvel identifiant.
- Copie des propriétés et des Zones corporelles. Après le MVP, si un média existe, une nouvelle association Média pourra référencer le même fichier physique.
- Si l'Exercice possède une Récupération après Série, une nouvelle activité Récupération associée est également créée avec un nouvel identifiant.

## Suppression d’un média

Les règles suivantes sont préparatoires et ne s’appliquent qu’après l’introduction des médias :

- Un fichier physique local peut être référencé par plusieurs entités/associations Média, chacune appartenant à une seule Activité.
- La suppression explicite d’un média/fichier par l’utilisateur reste autorisée même si ce fichier est référencé par plusieurs entités Média.
- La suppression retire toutes les associations Média qui référencent ce fichier et supprime le fichier physique local correspondant.
- Les Activités et Séances concernées restent valides et deviennent simplement sans média.
- Les Instantanés historiques, qui ne contiennent pas les médias, restent fonctionnellement lisibles.

## Archivage et suppression

### Archivage d'une séance

L'archivage d'une Séance :
- conserve la Séance ;
- supprime toutes les Routines qui lui sont associées ;
- met donc fin au calcul de leurs occurrences futures ;
- conserve les occurrences déjà historisées ;
- conserve toutes les Exécutions et leurs instantanés ;
- empêche toute nouvelle Exécution ou nouvelle Routine utilisant cette Séance tant qu'elle reste archivée.

La restauration d'une Séance :
- la rend de nouveau disponible pour l'exécution et la planification ;
- ne restaure aucune Routine supprimée lors de l'archivage ;
- nécessite la création de nouvelles Routines si l'utilisateur souhaite la planifier de nouveau.
### Suppression d'une séance

- Supprime la séance et les routines qui la référencent.
- Ne supprime jamais les exécutions de séance ni leurs instantanés.

## Historique

- L'historique est constitué exclusivement des exécutions de séance.
- Chaque exécution possède son propre instantané de séance.
- Une modification de la séance n'affecte jamais les exécutions existantes.

# 09.13 Cycles de vie

## Objectif

Ce chapitre décrit les différents états que peuvent traverser les principales entités.

## Cycle de vie d'une séance

```text
Création → Édition → Active
                 ├─ Modifier
                 ├─ Dupliquer → Nouvelle séance
                 ├─ Archiver → Séance archivée → Restaurer
```

### Règles métier

- Une séance est créée dès la validation de son nom et de sa couleur.
- Une séance peut rester vide pendant son édition.
- Une séance archivée n'est plus proposée pour créer une nouvelle routine ou être exécutée directement.
- La duplication crée une nouvelle séance indépendante.

## Cycle de vie d'une activité

- Une activité appartient toujours à un seul Tour.
- Sa copie crée une nouvelle activité indépendante.
- Sa suppression peut être annulée via la snackbar.

## Cycle de vie d'une routine

Création → Modification → Suppression

### Règles métier

- Une routine est créée à partir d'une séance existante.
- La suppression d'une routine ne supprime jamais la séance ni les exécutions.

## Cycle de vie d'une exécution de séance

Création → En cours → Suspendue → Reprise → Terminée, Partielle ou Interrompue → Historique

### Règles métier

- Une exécution est créée au démarrage effectif d'une séance.
- Une seule exécution peut être en cours simultanément.
- Après une interruption technique alors que l’Exécution était `En cours`, elle n’est pas clôturée automatiquement. Au retour dans l’application, l’utilisateur doit choisir `Reprendre la séance` ou `Arrêter la séance`. Tant que ce choix n’est pas effectué, aucune nouvelle Exécution ne peut démarrer. `Arrêter la séance` clôt l’Exécution avec le statut `Interrompue` puis ouvre la Synthèse.
- Une exécution terminée, partielle ou interrompue est conservée dans le suivi.
