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

- Une **Séance** décrit le contenu d'un entraînement.
- Une **Routine** planifie l'exécution d'une séance.
- Une même séance peut être associée à plusieurs routines.
- Une séance contient un **cycle**.
- Un cycle contient un **bloc**.
- Le cycle et le bloc possèdent chacun un nombre de répétitions.
- Un bloc contient une suite ordonnée d'activités.
- Une activité est de type **Exercice** ou **Récupération**.
- Une activité de type Exercice peut intégrer une pause facultative qui ne constitue pas une activité indépendante.
- Une **Exécution de séance** est créée uniquement lorsqu'une séance démarre.
- Chaque exécution conserve un **instantané** complet de la séance utilisée.
- Toute modification ultérieure d'une séance ou d'une routine est sans effet sur les exécutions déjà enregistrées.
- Les structures utilisées par le moteur d'exécution sont distinctes des entités métier.

## Vue d'ensemble du modèle

### Liste des entités

| Entité | Rôle dans l'application | Nature |
| --- | --- | --- |
| Utilisateur | Propriétaire des données | Principale |
| Séance | Définition réutilisable d'un entraînement | Principale |
| Routine | Planification d'une séance | Principale |
| Activité | Action élémentaire d'une séance | Principale |
| Média | Illustration d'une activité | Secondaire |
| Catégorie | Classement des séances | Métier |
| Zone corporelle | Partie du corps sollicitée | Métier |
| Exécution de séance | Réalisation effective d'une séance | Principale |
| Préférences globales | Paramètres généraux | Configuration |

## Décisions structurantes du modèle

| ID | Décision | Version |
| --- | --- | --- |
| DM-001 | Une activité est de type **Exercice** ou **Récupération**. | V1 |
| DM-002 | La pause intégrée d'un exercice est un paramètre de l'activité. | V1 |
| DM-003 | Une séance contient un cycle unique. | V1 |
| DM-004 | Un cycle contient un bloc unique. | V1 |
| DM-005 | Le cycle et le bloc sont répétés par leurs paramètres de répétition. | V1 |
| DM-006 | Une même séance peut être planifiée par plusieurs routines. | V1 |
| DM-007 | Une exécution crée automatiquement un instantané complet de la séance. | V1 |
| DM-008 | Les occurrences du calendrier sont calculées à partir des routines et ne sont pas stockées. | V1 |
| DM-009 | Les exceptions de planification sont prévues pour une version ultérieure. | V2 |
| DM-010 | Une seule entité Utilisateur locale existe dans la V1. | V1 |

## Relations principales

```text
UTILISATEUR
│
├── possède 0..n SÉANCES
│       │
│       ├── appartient à 0..n CATÉGORIES
│       ├── contient 1 CYCLE
│       │      │
│       │      ├── nombre de répétitions
│       │      ├── contient 1 BLOC
│       │      │      │
│       │      │      ├── nombre de répétitions
│       │      │      └── contient 1..n ACTIVITÉS
│       │      └── contient 0..n ACTIVITÉS DE FIN DE CYCLE
│       └── contient 0..n ACTIVITÉS DE FIN DE SÉANCE
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
- Toutes les entités métier appartiennent à un seul utilisateur.


# 09.2 Entité Séance

## Définition

Une **Séance** est une entité métier représentant le contenu réutilisable d’un entraînement.

Elle définit les activités à réaliser, leur ordre d’exécution, leur organisation en bloc et en cycle, ainsi que les paramètres nécessaires à leur exécution.

Une séance peut être exécutée immédiatement ou planifiée par une ou plusieurs routines. Elle ne contient jamais les informations produites lors d’une exécution réelle.

## Périmètre

Une séance possède directement :

- ses informations générales ;
- ses catégories ;
- son compte à rebours initial éventuel ;
- son cycle ;
- son bloc ;
- les activités contenues dans le bloc ;
- les activités éventuelles de fin de cycle ;
- les activités éventuelles de fin de séance ;
- ses paramètres de répétition.

Elle ne contient pas directement :

- les routines qui la planifient, qui constituent des entités distinctes ;
- les exécutions déjà réalisées ;
- l’historique ;
- les préférences globales ;
- les résultats ou états d’exécution ;
- les médias physiques, qui sont rattachés aux activités.

## Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant interne unique de la séance | Obligatoire | Stable pendant toute la durée de vie de la séance |
| Nom | Nom affiché de la séance | Obligatoire | Saisi avant la création effective de la séance |
| Couleur | Couleur d'identification de la séance | Obligatoire | Choisie par l'utilisateur parmi une palette prédéfinie de 16 couleurs |
| Description | Présentation ou objectif général | Facultatif | Texte libre |
| Catégories | Catégories de classement | Facultatif | Zéro, une ou plusieurs catégories appartenant au même utilisateur |
| Image | Illustration générale de la séance | Facultatif | Référence vers un média local |
| Statut | État de la séance | Obligatoire | Active ou archivée |
| Date de création | Date de création effective | Obligatoire | Générée automatiquement |
| Date de modification | Date de dernière modification | Obligatoire | Mise à jour automatiquement |
| Date de dernière exécution | Date de la dernière exécution de séance | Facultatif | Sert notamment au classement du Catalogue de séances |
| Date d’archivage | Date de passage au statut archivé | Conditionnel | Renseignée uniquement si la séance est archivée |
| Compte à rebours initial activé | Active ou non la phase de préparation | Obligatoire | Une seule occurrence possible |
| Durée du compte à rebours initial | Durée avant la première activité | Conditionnel | Utilisée uniquement si le compte à rebours est activé |
| Nombre de répétitions du bloc | Nombre d’exécutions successives du bloc dans un cycle | Obligatoire | Entier supérieur ou égal à 1 |
| Nombre de répétitions du cycle | Nombre d’exécutions successives du cycle | Obligatoire | Entier supérieur ou égal à 1 |
| Structure | Organisation complète de la séance | Obligatoire pour l’exécution | Une séance peut être enregistrée vide, mais ne peut pas être exécutée sans activité de type Exercice |
| Durée théorique | Durée calculée de la séance | Calculé | Calculée à partir des activités chronométrées et des répétitions ; indicative si des activités sont manuelles |
| Nombre total d’activités exécutées | Nombre d’occurrences d’activités générées pour une exécution complète | Calculé | Tient compte des répétitions du bloc et du cycle |

## Structure interne de la séance

La structure d’une séance est composée, dans l’ordre, de :

1. un compte à rebours initial facultatif, exécuté une seule fois ;
2. un cycle unique ;
3. des activités de fin de séance facultatives, exécutées une seule fois après le cycle.

Le cycle contient :

- un nombre de répétitions supérieur ou égal à 1 ;
- un bloc unique ;
- zéro, une ou plusieurs activités de fin de cycle.

Le bloc contient :

- un nombre de répétitions supérieur ou égal à 1 ;
- une suite ordonnée d’activités.

À chaque répétition du cycle :

1. le bloc est exécuté selon son nombre de répétitions ;
2. les activités de fin de cycle sont exécutées une fois.

Après la dernière répétition du cycle, les activités de fin de séance sont exécutées une fois.

Le cycle et le bloc sont des structures internes de la séance. Ils ne constituent pas des entités métier autonomes dans le MVP et ne peuvent pas être supprimés. Leur nombre de répétitions est toujours au minimum égal à 1.

## Relations principales

- Une séance appartient à un seul utilisateur.
- Une séance peut être associée à zéro, une ou plusieurs catégories.
- Une séance peut être référencée par zéro, une ou plusieurs routines.
- Une séance contient un cycle unique.
- Le cycle contient un bloc unique.
- Le bloc contient zéro, une ou plusieurs activités pendant l’édition.
- Une séance exécutable contient au moins une activité de type **Exercice**.
- Une séance peut être à l’origine de zéro, une ou plusieurs exécutions de séance.

## Règles métier

- Le nom est obligatoire pour créer une séance.
- Deux séances peuvent porter le même nom.
- Chaque séance possède une couleur.
- La couleur est choisie parmi une palette prédéfinie de 16 couleurs.
- Une séance vide peut être conservée et modifiée, mais elle ne peut pas être exécutée.
- Une séance est exécutable dès qu’elle contient au moins une activité valide de type **Exercice**.
- Une séance composée uniquement d’activités de type **Récupération** n’est pas exécutable.
- Une séance peut être modifiée, dupliquée, archivée, restaurée ou supprimée.
- La duplication crée une nouvelle séance indépendante avec un nouvel identifiant.
- La duplication conserve la couleur de la séance d'origine.
- La duplication copie la structure, les activités, les catégories et les paramètres de la séance, mais ne copie ni les routines, ni les exécutions passées.
- L’archivage conserve intégralement la séance et ses exécutions historiques.
- Une séance archivée ne peut plus être utilisée pour créer une nouvelle routine ou démarrer une nouvelle exécution tant qu’elle n’est pas restaurée.
- La suppression d’une séance demande confirmation lorsqu’elle est référencée par une ou plusieurs routines.
- Après confirmation, les routines qui référencent la séance sont supprimées.
- La suppression d’une séance ne supprime jamais les exécutions déjà enregistrées ni leurs instantanés.
- Une modification de la séance n’altère jamais les exécutions déjà présentes dans le suivi.
- Le cycle et le bloc ne peuvent pas être supprimés.
- Le nombre de répétitions du cycle et du bloc est toujours supérieur ou égal à 1.
- Les activités peuvent être ajoutées, modifiées, déplacées, dupliquées ou supprimées.
- Les sons et les annonces vocales ne sont pas enregistrés dans la séance ; ils proviennent des préférences globales.
- La durée théorique et le nombre total d’activités exécutées sont recalculés après toute modification influençant le déroulement.
- Une séance peut exister sans routine et sans avoir jamais été exécutée.

---

# 09.3 Entité Routine

## Définition

Une **Routine** est une entité métier qui planifie l'exécution d'une séance.

Elle ne décrit jamais le contenu d'un entraînement. Elle référence une séance existante et définit les règles selon lesquelles celle-ci doit être proposée ou exécutée.
## Périmètre

Une routine possède directement :

- la séance référencée ;
- la couleur héritée de la séance référencée (non stockée) ;
- son état (active ou inactive) ;
- sa date de début ;
- sa date de fin éventuelle ;
- son heure d'exécution ;
- son type de récurrence ;
- les paramètres de récurrence ;
- les rappels éventuels.

Elle ne contient pas directement :

- le contenu de la séance ;
- les activités ;
- les exécutions de séance ;
- les occurrences du calendrier, calculées à la demande.
## Attributs fonctionnels

| Attribut              | Description                                    |  Caractère   | Règle principale                                                                      |
| --------------------- | ---------------------------------------------- | :----------: | ------------------------------------------------------------------------------------- |
| Identifiant           | Identifiant unique de la routine               | Obligatoire  | Stable pendant toute la durée de vie de la routine                                    |
| Séance                | Séance planifiée par la routine                | Obligatoire  | Référence une seule séance active appartenant au même utilisateur                     |
| Active                | État de la routine                             | Obligatoire  | Active ou inactive                                                                    |
| Type de planification | Nature de la planification                     | Obligatoire  | Unique ou récurrente                                                                  |
| Date de début         | Première date à laquelle la routine s’applique | Obligatoire  | Ne peut pas être postérieure à la date de fin                                         |
| Date de fin           | Dernière date d’application de la routine      |  Facultatif  | Principalement utilisée pour une routine récurrente                                   |
| Heure d’exécution     | Heure prévue pour l’occurrence                 |  Facultatif  | Identique pour toutes les occurrences de la routine dans le MVP                       |
| Type de récurrence    | Périodicité utilisée                           | Conditionnel | Obligatoire uniquement pour une routine récurrente                                    |
| Fréquence             | Intervalle entre deux occurrences              | Conditionnel | Entier supérieur ou égal à 1 ; utilisée uniquement pour une routine récurrente        |
| Jours de la semaine   | Jours concernés par la routine                 | Conditionnel | Utilisés uniquement lorsque le type de récurrence le nécessite                        |
| Rappels               | Rappels associés à la routine                  |  Facultatif  | Zéro, un ou plusieurs rappels ; modalités à préciser dans les règles de planification |
| Date de création      | Date de création de la routine                 | Obligatoire  | Générée automatiquement                                                               |
| Date de modification  | Date de dernière modification                  | Obligatoire  | Mise à jour automatiquement                                                           |
## Règles métier

- Une routine appartient à un seul utilisateur.
- Une routine référence toujours une seule séance.
- Une routine reprend toujours la couleur de la séance qu'elle référence.
- Une routine peut être créée uniquement à partir d’une séance active appartenant au même utilisateur.
- Une séance peut être planifiée par zéro, une ou plusieurs routines.
- Une séance peut être exécutée directement sans être associée à une routine.
- Une routine définit une seule règle de planification.
- Une routine peut être unique ou récurrente.
- Une routine active génère des occurrences pendant sa période de validité.
- Une routine inactive ne génère plus de nouvelles occurrences.
- Une routine inactive peut être réactivée.
- Les occurrences du calendrier sont calculées à la demande à partir des attributs de la routine et ne sont pas stockées.
- Plusieurs routines peuvent générer des occurrences pour une même séance.
- Plusieurs routines peuvent générer une occurrence le même jour ou à la même heure.
- Les conflits entre routines ne sont pas bloquants dans le MVP.
- Une modification de la routine s’applique uniquement aux occurrences calculées à partir de cette modification.
- Une modification de la routine n’a aucun effet sur les exécutions de séance déjà créées.
- La suppression d’une routine supprime toutes ses occurrences non exécutées, passées ou futures.
- La suppression d’une routine ne supprime jamais la séance référencée.
- La suppression d’une routine ne supprime jamais les exécutions de séance déjà enregistrées.
- Une routine ne peut plus générer de nouvelle exécution lorsque la séance référencée est archivée.

# 09.3.1 Règles de planification

## Objectif

Ce chapitre définit les règles de fonctionnement des routines de planification.

Il précise la génération des occurrences, les règles de récurrence, les rappels ainsi que le comportement de la planification dans les principales situations fonctionnelles.

## Types de planification

Le MVP prend en charge les types de planification suivants :

- **Unique** (`Jamais`) : une seule occurrence est créée à la date et à l'heure définies.
- **Quotidienne** (`Tous les jours`) : une occurrence est créée chaque jour.
- **Hebdomadaire** (`Certains jours`) : une occurrence est créée les jours de la semaine sélectionnés.

Les récurrences mensuelles, annuelles ou personnalisées ne sont pas prises en charge dans le MVP.

## Génération des occurrences

Les occurrences d'une routine ne sont jamais stockées.

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

Une occurrence est considérée comme **non exécutée** lorsqu'aucune séance n'a été démarrée avant son échéance.

Dans ce cas :

- aucune exécution de séance n'est créée ;
- l'occurrence est conservée avec le statut **Non exécutée**.

## Activation et désactivation

Une routine peut être active ou inactive.

Une routine inactive :

- ne génère plus de nouvelles occurrences ;
- conserve son historique ;
- peut être réactivée à tout moment.

La réactivation reprend automatiquement le calcul des occurrences.

## Modification d'une routine

Toute modification d'une routine s'applique uniquement aux occurrences futures.

Les occurrences déjà passées ne sont pas modifiées.

Les exécutions de séance déjà réalisées restent inchangées.

## Suppression d'une routine

La suppression d'une routine :

- supprime toutes les occurrences non exécutées, passées ou futures ;
- ne supprime jamais la séance associée ;
- ne supprime jamais les exécutions de séance déjà enregistrées.

## Affichage dans l'agenda

Les occurrences sont affichées dans l'agenda.

Les jours comportant au moins une occurrence sont identifiés par un indicateur visuel.

La couleur de cet indicateur correspond à la couleur de la séance planifiée.

Lorsque plusieurs occurrences sont prévues le même jour, plusieurs indicateurs sont affichés, dans la limite de l'espace disponible.
# 09.4 Entité Activité

## Définition

Une **Activité** est la plus petite unité exécutable d'une séance.

Elle appartient au bloc d'un cycle et est de type **Exercice** ou **Récupération**.

## Périmètre

Une activité possède directement :

- son identité ;
- son type ;
- son nom ;
- sa consigne ;
- son mode d'exécution ;
- sa durée ou son nombre de répétitions ;
- sa pause intégrée éventuelle ;
- ses zones corporelles ;
- son média ;
- sa position dans le bloc.

Elle ne contient pas directement :

- le bloc ;
- le cycle ;
- la séance ;
- les préférences globales.

## Attributs fonctionnels

| Attribut              | Description              |         Caractère         | Règle principale        |
| --------------------- | ------------------------ | :-----------------------: | ----------------------- |
| Identifiant           | Identifiant unique       |        Obligatoire        | Stable                  |
| Position              | Position dans le bloc    |        Obligatoire        | Ordre d'exécution       |
| Type                  | Exercice ou Récupération |        Obligatoire        |                         |
| Nom                   | Libellé affiché          |        Obligatoire        |                         |
| Consigne              | Instructions             |        Facultatif         |                         |
| Mode d'exécution      | Durée ou Répétitions     | Obligatoire pour Exercice |                         |
| Durée                 | Durée                    |       Conditionnel        | Activité chronométrée   |
| Nombre de répétitions | Répétitions              |       Conditionnel        | Activité en répétitions |
| Pause intégrée        | Pause après un exercice  |        Facultatif         | Paramètre de l'activité |
| Zones corporelles     | Zones sollicitées        |        Facultatif         | Exercice uniquement     |
| Média                 | Photo ou vidéo           |        Facultatif         | Un seul média           |

## Règles métier

- Une activité appartient à un seul bloc.
- Une activité est de type Exercice ou Récupération.
- Une activité Exercice peut être exécutée selon une durée ou un nombre de répétitions.
- Une activité Récupération est toujours chronométrée.
- Une activité Exercice peut définir une pause intégrée.
- Une activité Récupération ne possède jamais de pause intégrée.
- Seules les activités Exercice peuvent être associées à des zones corporelles.
- Les activités peuvent être ajoutées, déplacées, dupliquées et supprimées.
- Leur ordre est conservé dans le bloc ou dans les activités de fin de cycle et de fin de séance.

# 09.5 Entité Média

## Définition

Un **Média** est une ressource visuelle associée à une activité d'une séance.

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
- La duplication d'une séance conserve les références des médias.
- La suppression d'un média ne supprime jamais l'activité.


# 09.6 Entité Exécution de séance

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
| Statut | En cours, Suspendue, Terminée ou Partielle | Obligatoire | |
| Durée réelle | Temps réellement exécuté | Calculé | |
| Dernière sauvegarde | Date de sauvegarde | Obligatoire | Technique |

## Structures internes

### Instantané de séance

Conserve une copie figée de la séance (structure, couleur, activités, catégories et paramètres) utilisée au moment du démarrage.

### État d'exécution

Contient notamment :

- activité courante ;
- bloc courant ;
- cycle courant ;
- temps restant ;
- état du chronomètre.

## Règles métier

- Une exécution est créée uniquement au démarrage d'une séance.
- Elle référence une seule séance.
- Elle peut référencer une routine.
- Un instantané de séance est créé automatiquement.
- Toute modification ultérieure de la séance ou de la routine est sans effet.
- Une seule exécution peut être en cours simultanément.
- Une exécution terminée ou partielle est conservée dans le suivi.


# 09.8 Structures internes du moteur d'exécution

## Définition

Le moteur d'exécution est le composant chargé de transformer une **séance** en une succession d'activités exécutables.

Au démarrage d'une séance, il construit un **plan d'exécution** à partir de l'**instantané de séance** créé pour cette exécution.

Le plan d'exécution est ensuite parcouru séquentiellement jusqu'à la fin de la séance.

Le moteur d'exécution, le plan d'exécution et les structures qu'il manipule sont des structures internes de calcul. Ils ne constituent pas des entités métier.

## Plan d'exécution

### Définition

Le plan d'exécution est la représentation linéaire de la séance obtenue après résolution de sa structure.

Le compte à rebours initial éventuel, les répétitions du bloc, les répétitions du cycle ainsi que les activités de fin de cycle et de fin de séance sont développés afin d'obtenir une liste ordonnée d'activités directement exploitable.

### Contenu

- liste ordonnée des activités ;
- ordre d'exécution ;
- références vers les activités de l'instantané ;
- numéro de répétition du bloc ;
- numéro de répétition du cycle ;
- informations de navigation.

## Activité d'exécution

### Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Position | Rang dans le plan d'exécution | Calculé | Numérotation continue |
| Activité | Activité de l'instantané | Obligatoire | Référence unique |
| Type | Compte à rebours, Exercice ou Récupération | Calculé | Déduit de l'activité |
| Répétition du bloc | Numéro de répétition du bloc | Calculé | Généré automatiquement |
| Répétition du cycle | Numéro de répétition du cycle | Calculé | Généré automatiquement |
| Activité précédente | Navigation | Calculé | Absente pour la première activité |
| Activité suivante | Navigation | Calculé | Absente pour la dernière activité |

## Règles métier

- Le plan d'exécution est généré automatiquement au démarrage de chaque exécution de séance.
- Il est construit exclusivement à partir de l'instantané de séance.
- Toute modification ultérieure de la séance ou de la routine est sans effet.
- Les répétitions du bloc et du cycle sont résolues lors de la génération.
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

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Sons activés | Active les signaux sonores | Obligatoire | Préférence globale |
| Annonces vocales | Active les annonces vocales | Obligatoire | Préférence globale |
| Vibrations | Active le retour haptique | Facultatif | Selon l'appareil |
| Écran maintenu actif | Empêche la mise en veille pendant une exécution de séance | Facultatif | Pendant l'exécution uniquement |
| Compte à rebours initial par défaut | Valeur proposée lors de la création d'une séance | Facultatif | Création uniquement |
| Durée par défaut d'une activité Exercice | Valeur initiale proposée | Facultatif | Création uniquement |
| Durée par défaut d'une activité Récupération | Valeur initiale proposée | Facultatif | Création uniquement |
| Pause intégrée par défaut | Valeur proposée après un exercice | Facultatif | Création uniquement |
| Date de création | Date de création | Obligatoire | Générée automatiquement |
| Date de modification | Dernière modification | Obligatoire | Mise à jour automatiquement |

## Règles métier

- Chaque utilisateur possède une seule structure de préférences globales.
- Les préférences s'appliquent à toutes les séances et à toutes les exécutions.
- Modifier une préférence n'altère jamais les séances existantes.
- Les valeurs par défaut sont utilisées uniquement lors de la création de nouveaux éléments.
- Une exécution de séance utilise les préférences actives au moment de son démarrage.
- Une modification des préférences ne modifie jamais une exécution déjà en cours.
- Les préférences sont enregistrées automatiquement après chaque modification.


# 09.10 Entité Catégorie

## Définition

Une **Catégorie** permet de classer les **séances** afin d'en faciliter l'organisation, le filtrage et la recherche.

L'application fournit une liste de catégories par défaut, que l'utilisateur peut compléter et personnaliser.
## Périmètre

Une catégorie possède directement :

- son identité ;
- son libellé ;
- son apparence ;
- son ordre d'affichage ;
- son état.

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
| Nom                  | Libellé affiché               | Obligatoire | Unique par utilisateur                               |
| Icône                | Icône représentative          | Facultatif  | Choisie dans la bibliothèque de l'application        |
| Couleur              | Couleur d'affichage           | Facultatif  | Choisie dans la palette de l'application             |
| Ordre d'affichage    | Position dans les listes      | Obligatoire | Modifiable par l'utilisateur                         |
| Active               | Disponibilité de la catégorie | Obligatoire | Active ou inactive                                   |
| Date de création     | Date de création              | Obligatoire | Générée automatiquement                              |
| Date de modification | Dernière modification         | Obligatoire | Mise à jour automatiquement                          |
## Règles métier

- Une séance peut être associée à zéro, une ou plusieurs catégories.
- Un utilisateur peut créer et personnaliser ses catégories.
- Le nom d'une catégorie est unique pour un même utilisateur.
- Une catégorie peut être utilisée par zéro, une ou plusieurs séances.
- Une catégorie utilisée ne peut pas être supprimée ; elle peut être rendue inactive.
- La désactivation d'une catégorie ne supprime jamais son association avec les séances existantes.
- Une catégorie inactive n'est plus proposée lors de la création ou de la modification d'une séance.
# 09.11 Entité Zone corporelle

## Définition

Une **Zone corporelle** désigne une partie du corps principalement sollicitée par une activité de type Exercice.

L’application fournit une liste initiale de zones corporelles, que l’utilisateur peut compléter avec ses propres valeurs.

## Périmètre

Une zone corporelle possède directement :

- son identité ;
- son nom ;
- son ordre d’affichage ;
- son état actif ou inactif ;
- son utilisateur propriétaire.

Les activités référencent zéro, une ou plusieurs zones corporelles. Une zone corporelle ne contient pas directement les activités qui l’utilisent.

## Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Stable pendant toute la durée de vie de la zone |
| Utilisateur | Propriétaire de la zone | Obligatoire | Une zone appartient à un seul utilisateur |
| Nom | Libellé affiché | Obligatoire | Unique par utilisateur |
| Ordre d’affichage | Position dans les listes | Obligatoire | Modifiable par l’utilisateur |
| Active | Disponibilité de la zone | Obligatoire | Une zone inactive n’est plus proposée aux nouvelles activités |
| Date de création | Date de création | Obligatoire | Générée automatiquement |
| Date de modification | Dernière modification | Obligatoire | Mise à jour automatiquement |

## Règles métier

- Une activité de type **Exercice** peut être associée à zéro, une ou plusieurs zones corporelles.
- Une activité de type **Récupération** ne peut jamais être associée à une zone corporelle.
- Une zone corporelle peut être utilisée par zéro, une ou plusieurs activités.
- L'utilisateur peut créer une zone corporelle directement depuis la création ou la modification d'une activité.
- Le nom d'une zone corporelle est unique pour un même utilisateur.
- Une zone corporelle utilisée ne peut pas être supprimée ; elle peut être rendue inactive.
- Une zone corporelle inactive reste associée aux activités existantes mais n'est plus proposée lors de la création ou de la modification d'une activité.

# 09.12 Règles d’intégrité et de copie

## Objectif

Ce chapitre définit les règles garantissant la cohérence du modèle de données ainsi que le comportement des opérations de duplication, d'archivage, de suppression et de conservation des données.

## Règles d'intégrité

### Identité

- Chaque entité possède un identifiant unique et stable.
- Deux entités distinctes ne peuvent jamais partager le même identifiant.
- Les identifiants sont générés automatiquement.

### Cohérence des relations

- Toute activité appartient à un seul bloc.
- Tout bloc appartient à un seul cycle.
- Tout cycle appartient à une seule séance.
- Toute routine référence une seule séance.
- Toute exécution de séance référence une seule séance.
- Toute catégorie et toute zone corporelle appartiennent à un seul utilisateur.

### Cohérence des données

- Une séance exécutable contient au moins une activité de type **Exercice**.
- Une activité **Récupération** est toujours chronométrée et ne possède jamais de zone corporelle.
- Les nombres de répétitions du bloc et du cycle sont toujours supérieurs ou égaux à 1.

## Duplication d'une séance

- Nouvelle séance avec un nouvel identifiant.
- Copie de la couleur de la séance.
- Copie du cycle, du bloc, des activités, des catégories et des références médias.
- Les routines et les exécutions de séance ne sont jamais copiées.

## Duplication d'une activité

- Nouvelle activité avec un nouvel identifiant.
- Copie des propriétés, de la pause intégrée, du média et des zones corporelles.

## Archivage et suppression

### Archivage d'une séance

- Conserve la séance, les routines associées et les exécutions déjà réalisées.
- Empêche uniquement de nouvelles exécutions et de nouvelles routines utilisant cette séance.

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

- Une activité appartient toujours à un seul bloc.
- Sa copie crée une nouvelle activité indépendante.
- Sa suppression peut être annulée via la snackbar.

## Cycle de vie d'une routine

Création → Active ↔ Inactive → Suppression

### Règles métier

- Une routine est créée à partir d'une séance existante.
- La suppression d'une routine ne supprime jamais la séance ni les exécutions.

## Cycle de vie d'une exécution de séance

Création → En cours → Suspendue → Reprise → Terminée ou Partielle → Historique

### Règles métier

- Une exécution est créée au démarrage effectif d'une séance.
- Une seule exécution peut être en cours simultanément.
- Une exécution terminée ou partielle est conservée dans le suivi.

## Média, Catégorie et Zone corporelle

Conserver les diagrammes actuels.

Adapter uniquement les règles pour remplacer « routine » par « séance » lorsque cela concerne les catégories.
