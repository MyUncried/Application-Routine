# 09.0 Vue d'ensemble

**Référence courante 07/10 :** [Pauses et symboles](SPECIFICATION-PAUSES-SYMBOLES-2026-10-07.md). Placement explicite et distinction contenu/trait conservés. **Bip de cadence et durées : la spécification Bip v2 du07/10 remplace les dispositions antérieures.**

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
- Un Circuit contient une suite ordonnée d'Exercices ; un Tour est une répétition complète de ce Circuit.
- Un Exercice ne possède pas de type `Exercice` ou `Récupération`.
- Un Exercice possède un nombre de Séries propre, de 1 à 99 (D-092), une Pause après chaque série d’un même côté et, lorsqu’elle est bilatérale, une `sideRecoverySeconds` facultative exécutée entre les deux côtés. La récupération post-exercice appartient à l’occurrence, pas à l’`ActivityDefinition`.
- Une **Exécution** est créée au démarrage d’une source exécutable : une Séance ou, à partir de T03, un Exercice persistant dans le MVP.
- Chaque Exécution conserve un **instantané fonctionnel** immuable et allégé de sa source.
- Toute modification ultérieure d'une séance ou d'une routine est sans effet sur les exécutions déjà enregistrées.
- Les structures utilisées par le moteur d'exécution sont distinctes des entités métier.

## Vue d'ensemble du modèle

### Liste des entités

| Entité | Rôle dans l'application | Nature |
| --- | --- | --- |
| Utilisateur | Propriétaire des données | Principale |
| Séance | Définition réutilisable d'un entraînement | Principale |
| Cycle | Structure ordonnée de la séance portant son propre nombre de répétitions | Structure interne de séance |
| Tour | Conteneur ordonné d'exercices portant son propre nombre de répétitions | Structure interne de séance |
| Routine | Planification d’un contenu source `SESSION` ou `ACTIVITY` | Principale |
| Occurrence planifiée | Trace historisée d'une planification arrivée à échéance | Principale |
| Exercice | Action élémentaire d'une séance | Principale |
| Média | Média associé à un Exercice ; affichable dans le Catalogue MVP | Métier |
| Étiquette | Classement d’une Séance et source de sa couleur affichée | Métier |
| Catégorie | Classement d’un Exercice et source de sa couleur sémantique | Métier |
| Zone corporelle | Partie du corps sollicitée | Métier |
| Exécution | Réalisation effective d’une source `SESSION` ou `ACTIVITY` | Principale |
| Préférences globales | Paramètres généraux | Configuration |

## Décisions structurantes du modèle

| ID     | Décision                                                                                                                                                                                                     | Version        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| DM-001 | Le modèle cible ne possède aucun type d’Exercice `Exercice` ou `Récupération`. Une `ActivityDefinition` porte éventuellement `sideRecoverySeconds`; la récupération post-exercice est contextuelle à l’occurrence. | D-208 |
| DM-002 | Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durées selon Bip v2 et paramètres v13 : Durée exacte ; Répétitions avec bip estimées ≈ ; Répétitions sans bip et À l’échec omitted au niveau Exercice. ≥ réservé à la Séance contenant du travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel. | D-247/D-248/v13 |
| DM-003 | Une séance contient un cycle unique.                                                                                                                                                                         | V1             |
| DM-004 | Un cycle contient un Circuit unique.                                                                                                                                                                            | V1             |
| DM-005 | Le cycle et le Tour sont répétés par leurs paramètres de répétition.                                                                                                                                         | V1             |
| DM-006 | Une même Séance ou une même `ActivityDefinition` peut être planifiée par plusieurs Routines ; chaque Routine référence exactement une source `SESSION` ou `ACTIVITY`. | MVP — D-206 |
| DM-007 | Une Exécution crée automatiquement un Instantané fonctionnel immuable et allégé de sa source (`SESSION` ou `ACTIVITY`).                                                                                                                                       | V1             |
| DM-008 | Les occurrences futures sont calculées dynamiquement à partir des Routines et ne sont pas stockées. À leur échéance, elles sont historisées afin de conserver leur résultat.                                 | V1             |
| DM-009 | Les exceptions de planification sont prévues pour une version ultérieure.                                                                                                                                    | V2             |
| DM-010 | Une seule entité Utilisateur locale existe dans la V1.                                                                                                                                                       | V1             |
| DM-011 | La cardinalité Cycle et Tour est limitée à 1 dans le MVP, mais le modèle est conçu pour permettre ultérieurement une collection ordonnée de Cycles par Séance et une collection ordonnée de Tours par Cycle. | Évolution      |
| DM-012 | Un Cycle, un Tour et une `SessionActivity` appartiennent à une seule Séance. Une `ActivityDefinition` du MVP T03 est autonome et peut être copiée dans plusieurs Séances ; ses copies ne restent pas liées. | MVP T03 |
| DM-013 | Un Exercice possède un nombre de Séries propre, entier de 1 à 99 (D-092). Une Série n'est pas une entité autonome. | V1 |
| DM-014 | Pi est stockée et exécutée après chaque Série, dernière comprise. À la frontière des côtés successifs, PN puis PC se cumulent. Par paire, Pi suit chaque paire, dernière comprise, et PC reste dans chaque paire. Seule la toute dernière Pause est remplacée par la récupération positive qui suit l’occurrence ; aucune récupération en direct. N=1 normalisé uniforme/par côté. Formules et séquences : Bip v2§3 et paramètres v13§§4–5. | D-247/D-248/v13 |
| DM-015 | Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durées selon Bip v2 et paramètres v13 : Durée exacte ; Répétitions avec bip estimées ≈ ; Répétitions sans bip et À l’échec omitted au niveau Exercice. ≥ réservé à la Séance contenant du travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel. | D-247/D-248/v13 |
| DM-017 | Dans la version actuelle, le Tour ne porte aucun changement de côté exposé. Tout champ technique historique de direction Tour est conservé pour compatibilité mais contraint à `UNILATERAL`. | 24/09/2026 |
| DM-018 | Un Exercice peut porter un Compte à rebours propre et une Fin d’exercice propre. | 24/09/2026 |
| DM-019 | Un Point d’arrêt est un élément ordonné de Composition ; son attente n’est pas comptée dans la durée. | 24/09/2026 |
| DM-020 | La Séance porte une Étiquette ; l’Exercice porte une Catégorie ; les Zones corporelles restent une association distincte de l’Exercice. | 24/09/2026 |
| DM-016 | N est persisté ; total dérivé, inversion uniquement Durée uniforme. État de roulette non persisté. | D-248/v13 |

## Relations principales

```text
UTILISATEUR
│
├── possède 0..n SÉANCES
│       │
│       ├── porte une ÉTIQUETTE de Séance
│       ├── contient 0..n EXERCICES AVANT LE CYCLE
│       ├── contient 1 CYCLE
│       │      │
│       │      ├── nombre de répétitions
│       │      ├── contient 1 TOUR
│       │      │      │
│       │      │      ├── nombre de répétitions
│       │      │      └── contient 0..n EXERCICES DANS LE CIRCUIT
│       │      └── contient 0..n EXERCICES APRÈS LE CIRCUIT ET DANS LE CYCLE
│       └── contient 0..n EXERCICES APRÈS LE CYCLE ET AVANT LA FIN DE SÉANCE
│
├── possède 0..n ROUTINES
│       └── planifie 1 SÉANCE
│
├── possède 0..n EXÉCUTIONS
│       ├── possède 1 ORIGINE `SESSION` ou `ACTIVITY`
│       ├── référence 0..1 SÉANCE ou 0..1 ACTIVITÉ PERSISTANTE
│       ├── contient 1 INSTANTANÉ DE SOURCE
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
- ses Étiquettes de Séance ;
- ses Catégories d’Exercice ;
- ses zones corporelles ;
- ses préférences globales.

Il ne contient pas directement les exercices, les médias, les structures internes d'exécution ni les mécanismes d'authentification.

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

Elle définit les Exercices à réaliser, leur position avant le Circuit, dans le Circuit ou après le Circuit, ainsi que les paramètres nécessaires à leur Exécution. Le Cycle reste une enveloppe technique fixée à une répétition.

Une séance peut être exécutée immédiatement ou planifiée par une ou plusieurs routines. Elle ne contient jamais les informations produites lors d’une exécution réelle.

## Périmètre

Une séance possède directement :

- ses informations générales ;
- zéro ou une Étiquette, qui porte sa couleur affichée ;
- un compte à rebours initial ;
- un cycle ;
- un Tour contenu dans le cycle ;
- les exercices contenues dans le Circuit ;
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
| Étiquette                              | Classification de la Séance                                               |          Facultatif          | Zéro ou une Étiquette ; elle porte la couleur affichée de la Séance                                                                                                                                                                                     |
| Couleur affichée                        | Couleur visuelle de la Séance                                              |           Calculé            | Dérivée de l’Étiquette lorsqu’elle est renseignée ; aucune couleur métier indépendante de l’Étiquette                                                                                                                                                  |
| Statut                                  | État de la séance                                                         |         Obligatoire          | Active ou archivée                                                                                                                                                                                                                                     |
| Date de création                        | Date de création effective                                                |         Obligatoire          | Générée automatiquement                                                                                                                                                                                                                                |
| Date de modification                    | Date de dernière modification                                             |         Obligatoire          | Mise à jour automatiquement                                                                                                                                                                                                                            |
| Date de dernière exécution              | Date de la dernière exécution de séance                                   |          Facultatif          | Sert notamment au classement du Catalogue de séances                                                                                                                                                                                                   |
| Date d’archivage                        | Date de passage au statut archivé                                         |         Conditionnel         | Renseignée uniquement si la séance est archivée                                                                                                                                                                                                        |
| Structure                               | Organisation complète de la séance                                        | Obligatoire pour l’exécution | Une séance peut être enregistrée vide, mais ne peut pas être exécutée sans Exercice                                                                                                                                                                     |
| Durée estimée d’exécution               | Somme des durées déterminables de l’Exécution complète                    |           Calculé            | Inclut le Compte à rebours initial, les phases et occurrences chronométrées du plan et la Fin de séance ; avec cadence Ri×Ci estimé ≈ ; sans bip omission à l’Exercice ; ≥ seulement à la Séance ; composante non estimable : ≥ prévaut sur≈ |
| Durée synthétique des Exercices         | Somme des durées déterminables des seules occurrences d’Exercices         |           Calculé            | Développe Séries, Pauses après Série et Tours du Circuit ; exclut toujours le Compte à rebours initial et la Fin de séance ; utilisée dans le Catalogue et la Composition ; borne minimale `≥` si une durée d’Exercice est indéterminable |
| Nombre d’Exercices de la Composition    | Nombre d’Exercices définies dans la Composition                            |           Calculé            | Ne compte ni les Pauses entre Séries ni les phases `SIDE_RECOVERY` / `POST_ACTIVITY_RECOVERY`, et ne multiplie pas les Exercices par les Séries, Tours ou Cycles |
| Nombre total d’Exercices à exécuter     | Nombre d’occurrences d’Exercices prévues dans le plan d’Exécution complet |           Calculé            | Calculé après développement des Séries, Tours du Circuit et du Cycle ; exclut `SERIES_PAUSE`, `SIDE_RECOVERY`, `POST_ACTIVITY_RECOVERY`, le Compte à rebours initial et la Fin de séance, qui ne sont pas des Exercices |
| Durée du compte à rebours initial       | Durée de la phase précédant la première exercice                          |         Obligatoire          | Valeur en secondes ; 0 s rend la phase instantanée                                                                                                                                                                                                     |
| Texte vocal du compte à rebours initial | Texte annoncé vocalement pendant ou au début du compte à rebours initial  |          Facultatif          | Valeur initiale issue des Préférences globales ; peut être vide                                                                                                                                                                                        |
| Durée de la fin de séance               | Durée de la phase suivant le dernier exercice                            |         Obligatoire          | Valeur en secondes ; 0 s rend la phase instantanée                                                                                                                                                                                                     |
| Texte vocal de la fin de séance         | Texte annoncé vocalement pendant ou au début de la fin de séance          |          Facultatif          | Valeur initiale issue des Préférences globales ; peut être vide                                                                                                                                                                                        |
## Structure interne de la séance

La structure d’une séance est composée, dans l’ordre, de :
1. un Compte à rebours initial obligatoire, exécuté une seule fois ;
2. un Cycle technique unique et non affiché, toujours exécuté une fois ;
3. zéro, une ou plusieurs Exercices placés avant le Circuit ;
4. un Circuit unique contenant une suite ordonnée d’Exercices et répété de 1 à 99 fois ;
5. zéro, une ou plusieurs Exercices placés après le Circuit ;
6. une Fin de séance obligatoire, exécutée une seule fois après le dernier Exercice.

Dans le MVP, le Cycle contient :
- son identifiant ;
- sa position, égale à 1 ;
- son nombre de répétitions, imposé à 1 ;
- un Circuit unique ;
- les Exercices positionnées avant ou après le Circuit ;

Dans le MVP, le Circuit contient :
- son identifiant ;
- sa position, égale à 1 ;
- son nombre de répétitions, supérieur ou égal à 1 ;
- une suite ordonnée d’Exercices.

Le Cycle technique est exécuté une fois : les Exercices placés avant le Circuit sont exécutés une fois, le Circuit est exécuté selon son nombre de Tours, puis les Exercices placés après le Circuit sont exécutés une fois. La Fin de séance est ensuite exécutée.

Le Cycle et le Circuit sont des structures internes de la Séance et ne peuvent pas être supprimés. Le Cycle n’est jamais exposé à l’utilisateur ; seul le nombre de Tours du Circuit est modifiable.

#### Attributs fonctionnels du Cycle

| Attribut              | Description                              |  Caractère  | Règle principale                                                                         |
| --------------------- | ---------------------------------------- | :---------: | ---------------------------------------------------------------------------------------- |
| Identifiant           | Identifiant interne unique du Cycle      | Obligatoire | Stable pendant toute la durée de vie du Cycle                                            |
| Position              | Position du Cycle dans la Séance         | Obligatoire | Entier déterminant l’ordre d’exécution ; valeur 1 dans le MVP                            |
| Nombre de répétitions | Nombre d’exécutions successives du Cycle | Obligatoire | Valeur imposée **1** dans le MVP ; non modifiable et non exposée dans l’interface       |
| Tours                 | Collection ordonnée des Tours du Cycle   | Obligatoire | Exactement 1 Tour dans le MVP ; extensible à plusieurs Tours dans une version ultérieure |
| Exercices hors Circuit   | Exercices ordonnés avant ou après le Circuit | Obligatoire | Zéro ou plusieurs ; exécutées une seule fois selon leur position structurelle |
#### Attributs fonctionnels du Tour

| Attribut              | Description                               |  Caractère  | Règle principale                                              |
| --------------------- | ----------------------------------------- | :---------: | ------------------------------------------------------------- |
| Identifiant           | Identifiant interne unique du Tour        | Obligatoire | Stable pendant toute la durée de vie du Tour                  |
| Position              | Position du Tour dans le Cycle            | Obligatoire | Entier déterminant l’ordre d’exécution ; valeur 1 dans le MVP |
| Nombre de répétitions | Nombre d’exécutions successives du Tour   | Obligatoire | Entier de **1 à 99** ; valeur par défaut **1**                |
| Exercices             | Collection ordonnée des Exercices du Tour | Obligatoire | Zéro ou plusieurs pendant l’édition                           |
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
- Une séance peut être associée à zéro ou une Étiquette.
- Une séance peut être référencée par zéro, une ou plusieurs routines.
- Une séance contient un cycle unique.
- Le Cycle contient un Circuit unique. Ces cardinalités sont des contraintes fonctionnelles du MVP ; le modèle représente les Cycles et les Tours sous forme de collections ordonnées afin de permettre leur extension ultérieure.
- Le Cycle peut contenir zéro, une ou plusieurs Exercices avant le Circuit et zéro, une ou plusieurs Exercices après le Circuit.
- Le Circuit contient zéro, un ou plusieurs Exercices pendant l’édition.
- Une séance exécutable contient au moins un Exercice.
- Une séance peut être à l’origine de zéro, une ou plusieurs exécutions de séance.

## Règles métier

- Le nom est obligatoire pour créer une séance.
- Deux séances peuvent porter le même nom.
- Une Séance ne possède pas de couleur métier indépendante : sa couleur affichée est celle de son Étiquette lorsqu’elle est renseignée.
- Une séance vide peut être conservée et modifiée, mais elle ne peut pas être exécutée.
- Une séance est exécutable dès qu’elle contient au moins un Exercice valide.
- Une séance peut être modifiée, dupliquée, archivée ou restaurée. Elle ne peut être supprimée qu’après archivage.
- La duplication crée une nouvelle séance indépendante avec un nouvel identifiant.
- La duplication conserve l’Étiquette de la Séance d'origine.
- La duplication copie la structure, les Exercices, l’Étiquette et les paramètres de la Séance, mais ne copie ni les Routines, ni les Exécutions passées.
- L’archivage conserve intégralement la séance et ses exécutions historiques.
- Une séance archivée ne peut plus être utilisée pour créer une nouvelle routine ou démarrer une nouvelle exécution tant qu’elle n’est pas restaurée.
- La suppression d’une Séance archivée demande toujours confirmation. Les Routines associées ont déjà été supprimées lors de l’archivage.
- La suppression d’une séance ne supprime jamais les exécutions déjà enregistrées ni leurs instantanés.
- Une modification de la séance n’altère jamais les exécutions déjà présentes dans le suivi.
- Le cycle et le Tour ne peuvent pas être supprimés.
- Le nombre de répétitions du Cycle vaut toujours 1 dans le MVP. Le nombre de Tours du Circuit est compris entre 1 et 99.
- Les exercices peuvent être ajoutées, modifiées, déplacées, dupliquées ou supprimées.
- Les sons et les annonces vocales ne sont pas enregistrés dans la séance ; ils proviennent des préférences globales.
- La Durée estimée d’exécution, la Durée synthétique des Exercices, le Nombre d’Exercices de la Composition et le Nombre total d’Exercices à exécuter sont recalculés après toute modification influençant leur périmètre.
- Une Séance ou une `ActivityDefinition` peut exister sans Routine et sans avoir jamais été exécutée.
- Le compte à rebours initial et la Fin de séance sont toujours présents dans la structure d'une séance et ne constituent pas des Exercices.
- Une durée de 0 s rend le compte à rebours initial ou la Fin de séance instantané sans supprimer l'élément de la structure.

# 09.3 Entité Routine

## Définition

Une **Routine** est une entité métier qui planifie l'exécution d’un contenu planifiable.

Elle ne décrit jamais le contenu d'un entraînement. Elle référence exactement une source existante de type `SESSION` ou `ACTIVITY` et définit les règles selon lesquelles celle-ci doit être proposée ou exécutée.
## Périmètre

Une routine possède directement :

- le type de source (`SESSION` ou `ACTIVITY`) ;
- l’identifiant de la source référencée ;
- le repère visuel hérité de la source (non stocké) ;
- sa date de début ;
- sa date de fin éventuelle ;
- son heure d'exécution ;
- son mode de planification ;
- pour une planification périodique, sa fréquence hebdomadaire, ses jours de la semaine et sa date de fin ;
- un rappel éventuel.

Elle ne contient pas directement :

- le contenu de la source ;
- les copies de Séance éventuelles ;
- les Exécutions ;
- les occurrences futures du calendrier, calculées à la demande ;
## Attributs fonctionnels

| Attribut               | Description                                        |  Caractère   | Règle principale                                                                                  |
| ---------------------- | -------------------------------------------------- | :----------: | ------------------------------------------------------------------------------------------------- |
| Identifiant            | Identifiant unique de la routine                   | Obligatoire  | Stable pendant toute la durée de vie de la routine                                                |
| Type de source         | Type du contenu planifié                            | Obligatoire  | `SESSION` ou `ACTIVITY` |
| Source                  | Contenu planifié par la Routine                     | Obligatoire  | Référence une seule Séance active ou une seule `ActivityDefinition` active appartenant au même Utilisateur |
| Date de début          | Première date à laquelle la routine s’applique     | Obligatoire  | Ne peut pas être postérieure à la date de fin                                                     |
| Heure d’exécution      | Heure prévue pour l’occurrence                     | Obligatoire  | Identique pour toutes les occurrences de la routine dans le MVP                                   |
| Rappel                 | Rappel associé à la Routine                        |  Facultatif  | Zéro ou un rappel maximum ; délai appliqué à chaque occurrence                                    |
| Date de création       | Date de création de la routine                     | Obligatoire  | Générée automatiquement                                                                           |
| Mode de planification  | Définit si la Routine est répétée                  | Obligatoire  | Libellés UI : `Aucune` ou `Périodique`                                                            |
| Date de fin            | Dernière date d'application de la Routine          | Conditionnel | Obligatoire pour une planification périodique ; doit être postérieure ou égale à la date de début |
| Fréquence hebdomadaire | Nombre de semaines entre deux périodes d’exécution | Conditionnel | Entier de 1 à 12 ; obligatoire pour une planification périodique                                        |
| Jours de la semaine    | Jours d'exécution de la Routine                    | Conditionnel | Au moins un jour obligatoire pour une planification périodique                                    |
## Règles métier

- Une routine appartient à un seul utilisateur.
- Une Routine référence toujours une seule source, de type `SESSION` ou `ACTIVITY`.
- Une Routine reprend le repère visuel de sa source : couleur d’Étiquette pour une Séance, couleur de Catégorie pour un Exercice lorsqu’elle existe.
- Une Routine peut être créée uniquement à partir d’une source active appartenant au même Utilisateur.
- Une Séance ou une `ActivityDefinition` peut être planifiée par zéro, une ou plusieurs Routines.
- Une Séance ou une `ActivityDefinition` peut être exécutée directement sans être associée à une Routine.
- Une routine définit une seule règle de planification.
- Une Routine utilise le mode affiché `Aucune` ou `Périodique`. Dans le MVP, le mode `Périodique` utilise uniquement une périodicité hebdomadaire.
- Une Routine périodique possède une date de fin obligatoire.  
- Une Routine périodique possède une fréquence hebdomadaire supérieure ou égale à 1 et au moins un jour de la semaine sélectionné.  
- Plusieurs exécutions d'une même source à des horaires différents, y compris le même jour, sont représentées par plusieurs Routines distinctes.
- Une Routine génère des occurrences pendant sa période de validité tant qu'elle existe.
- Les occurrences futures du calendrier sont calculées à la demande à partir des attributs de la Routine et ne sont pas stockées. Une occurrence est historisée lorsqu'elle arrive à échéance afin de conserver son résultat.
- Plusieurs Routines peuvent générer des occurrences pour une même source.
- Plusieurs routines peuvent générer une occurrence le même jour ou à la même heure.
- Les conflits entre routines ne sont pas bloquants dans le MVP.
- Une modification de la Routine s'applique uniquement au calcul des occurrences futures. Elle ne modifie pas les occurrences déjà historisées.
- Une modification de la Routine n’a aucun effet sur les Exécutions déjà créées.
- La suppression d'une Routine met fin au calcul de ses occurrences futures. Les occurrences déjà historisées et les Exécutions déjà enregistrées sont conservées.
- La suppression d’une Routine ne supprime jamais la source référencée.
- La suppression d’une Routine ne supprime jamais les Exécutions déjà enregistrées.

# 09.3.1 Règles de planification

## Objectif

Ce chapitre définit les règles de fonctionnement des routines de planification.

Il précise la génération des occurrences, les règles de récurrence, les rappels ainsi que le comportement de la planification dans les principales situations fonctionnelles.

## Types de planification

Le MVP prend en charge deux modes de planification :

- **Aucune** : une seule occurrence est créée à la date et à l'heure définies.
- **Périodique** : les occurrences sont générées selon une périodicité hebdomadaire définie par :
    - une fréquence en semaines entière de 1 à 12 ;
    - un ou plusieurs jours de la semaine ;
    - une date de fin obligatoire.

Sélectionner les sept jours de la semaine permet d'obtenir une exécution quotidienne. Il n'existe donc pas de type de récurrence `Quotidienne` distinct.

Une Routine ne définit qu'une seule heure d'exécution. Pour planifier plusieurs exécutions d'une même source à des horaires différents, l'utilisateur crée plusieurs Routines.

Les autres formes de récurrence, notamment mensuelles, annuelles ou personnalisées, ne sont pas prises en charge dans le MVP.

## Génération des occurrences

Les occurrences futures d'une Routine ne sont pas stockées. Elles sont calculées dynamiquement à partir des paramètres de la Routine.

Lorsqu'une occurrence arrive à échéance, elle est historisée afin de conserver son résultat.

Le calcul dynamique est effectué chaque fois que l'application doit afficher les occurrences futures ou déterminer les prochaines planifications de Séances ou d’Exercices.

Elles sont calculées dynamiquement à partir :

- de la date de début ;
- du type de planification ;
- des paramètres de récurrence ;
- de la date de fin éventuelle.

Le calcul est effectué chaque fois que l'application doit afficher les occurrences ou déterminer les prochaines planifications.

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
- ne supprime jamais la source associée ;
- ne supprime jamais les Exécutions déjà enregistrées.

## Affichage dans l'agenda

Les occurrences sont affichées dans l'agenda.
Les jours comportant au moins une occurrence sont identifiés par un indicateur visuel.
Le repère visuel de cet indicateur correspond à la source planifiée : couleur d’Étiquette pour une Séance, couleur de Catégorie pour un Exercice lorsqu’elle existe.
Lorsque plusieurs occurrences sont prévues le même jour, plusieurs indicateurs sont affichés, dans la limite de l'espace disponible.

# 09.4 Entité Occurrence planifiée
### Définition
 
Une Occurrence planifiée représente la trace historisée d'une planification arrivée à échéance.  
Les occurrences futures calculées dynamiquement ne constituent pas des objets persistés.
 
### Périmètre

Une Occurrence planifiée possède directement :

- la Routine qui l'a générée ;
- le type de source et la source concernée ;
- la date et l'heure auxquelles la source était planifiée ;
- son statut ;
- le cas échéant, l'Exécution correspondante.

### Attributs fonctionnels

| Attribut     | Description                                   |    Caractère | Règle principale                                     |
| ------------ | --------------------------------------------- | -----------: | ---------------------------------------------------- |
| Identifiant  | Identifiant unique de l'occurrence historisée |  Obligatoire | Stable                                               |
| Routine      | Routine ayant généré l'occurrence             |  Obligatoire | Référence à la Routine d'origine                     |
| Type de source | Type du contenu planifié                     | Obligatoire | `SESSION` ou `ACTIVITY` |
| Source       | Source concernée                               | Obligatoire | Référence à la source planifiée au moment de l’occurrence |
| Date prévue  | Date planifiée                                |  Obligatoire | Valeur issue de la Routine au moment de l'occurrence |
| Heure prévue | Heure planifiée                               |  Obligatoire | Valeur issue de la Routine au moment de l'occurrence |
| Statut       | Résultat de l'occurrence                      |  Obligatoire | `Exécutée` ou `Non exécutée`                         |
| Exécution    | Exécution associée                            | Conditionnel | Présente uniquement si la source a été démarrée      |
### Règles métier

- Une Occurrence planifiée est normalement persistée à son échéance. **Exception :** lorsqu’une occurrence future est exécutée en avance depuis l’action `Démarrer` de sa carte, elle est persistée immédiatement avec sa date/heure initialement planifiées et son lien vers l’Exécution réelle, afin de ne pas être reproposée à son horaire initial.
- Une occurrence future reste calculée dynamiquement et n'est pas persistée.
- Le statut d'une occurrence historisée est `Exécutée` ou `Non exécutée`.
- Une occurrence `Exécutée` référence l'Exécution correspondante.
- Une occurrence `Non exécutée` ne possède aucune Exécution associée.
- Une occurrence historisée est conservée même si la Routine d'origine est ensuite modifiée ou supprimée.
# 09.5 Entité Exercice

## Définition

Une **Exercice** est la plus petite unité exécutable d'une séance.

Dans le MVP, cette entité est une `SessionActivity` appartenant à une seule Séance. Dans le MVP T03, une `ActivityDefinition` autonome peut être copiée dans plusieurs Séances sans lien de propagation.

Le nom « Récupération » n’a aucune sémantique technique : un Exercice ainsi nommée reste un Exercice ordinaire. Les phases `SIDE_RECOVERY` et `POST_ACTIVITY_RECOVERY` sont dérivées respectivement de `sideRecoverySeconds` et `postActivityRecoverySeconds` ; aucune n’est un type d’Exercice.

## Périmètre

Un exercice possède directement :

- son identité ;
- son nom ;
- sa description ;
- sa Catégorie et ses Zones corporelles ;
- son mode d'exécution ;
- sa durée cible, son nombre de répétitions cible ou l’absence de cible chiffrée en mode À l’échec ;
- son nombre de Séries ;
- sa Pause après chaque série ;
- sa durée de Récupération, positionnée dans le Plan selon la direction effective ;
- son Changement de côté propre ;
- son Compte à rebours d’Exercice propre lorsqu’il est utilisé ;
- sa Fin d’exercice propre lorsqu’elle est utilisée ;
- un média associé est affiché dans la gouttière permanente de la carte Catalogue du MVP, sans déploiement ; la gestion multiple et les mécanismes d’acquisition suivent leur périmètre propre ;
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
| Position structurelle | Emplacement fonctionnel de l’Exercice avant, dans ou après le Circuit | Obligatoire | Valeurs techniques historiques : `Avant Tour`, `Dans Tour`, `Après Tour` ; D-209 ne renomme pas à elle seule ces identifiants |
| Position                   | Ordre au sein de la position structurelle       |        Obligatoire        | Entier déterminant l’ordre d’exécution                                         |
| Tour (technique) | Conteneur technique historique représentant le Circuit fonctionnel | Conditionnel | Obligatoire uniquement pour un Exercice fonctionnellement placé dans le Circuit (`Dans Tour` techniquement) |
| Nom                        | Libellé affiché                                 |        Obligatoire        |                                                                               |
| Description                | Instructions                                    |        Facultatif         |                                                                               |
| Catégorie                  | Classification de l’Exercice                    |        Facultatif         | Porte la couleur sémantique de l’Exercice                                      |
| Changement de côté        | `UNILATERAL`, `RIGHT_LEFT`, `LEFT_RIGHT`        |        Obligatoire        | Affiché `Aucun`, `D→G`, `G→D`; défaut `UNILATERAL`                             |
| Compte à rebours d’Exercice | Durée propre précédant le travail              |        Facultatif         | Distinct du Compte à rebours initial de Séance                                 |
| Fin d’exercice            | Durée propre suivant les phases de l’Exercice   |        Facultatif         | Distincte de la Fin de séance                                                   |
| Mode d'exécution           | Durée, Répétitions ou À l’échec                 |        Obligatoire        | À l’échec n’a ni durée ni répétitions cibles                                  |
| Durée                      | Durée                                           |       Conditionnel        | Exercice chronométré                                                         |
| Nombre de répétitions      | Répétitions                                     |       Conditionnel        | Mode Répétitions                                                              |
| Nombre de Séries           | Entier canonique persisté                       |        Obligatoire        | Valeur de 1 à 99 ; valeur par défaut 1                                        |
| Pause après chaque série         | Durée                                           |        Obligatoire        | Valeur canonique `0 s` ; attachée à chaque Série, terminale comprise ; v13 §4                     |
| Pause entre les côtés   | Durée                                           |        Conditionnel       | `sideRecoverySeconds`; pertinente uniquement en bilatéral, phase `SIDE_RECOVERY` si > 0 |
| Séries variables | Booléen explicite | Obligatoire | Faux par défaut ; faux à N=1 ; l’égalité des valeurs ne le détermine pas |
| Paramètres par Série | Collection ordonnée de N cibles/Pauses | Conditionnel | Source unique en variable ; cible absente À l’échec ; aucun brouillon caché persisté |
| Ordre des côtés | Un côté après l’autre / Les deux côtés à chaque série | Bilatéral | Premier ordre par défaut et à N=1 ; indépendant de D→G/G→D |
| Durée totale               | Durée dérivée                                   |          Calculé          | Non persistée ; exacte en Durée, estimation ≈ avec cadence, borne omission sans bip à l’Exercice, absente À l’échec                            |
| Zones corporelles          | Zones sollicitées                               |        Facultatif         | Zéro à plusieurs                                                              |
| Médias                     | Média(s) associé(s)                             |        Selon périmètre    | Affichage du média associé dans la gouttière permanente de la carte Catalogue inclus au MVP, sans déploiement       |

## Règles métier

- Une `SessionActivity` appartient à une seule Séance et occupe exactement une position structurelle ordonnée. Une `ActivityDefinition` du MVP T03 est autonome et ne porte aucune position de Séance.
- Un Exercice peut être exécutée selon une Durée, un nombre de Répétitions ou jusqu’à l’échec.
- Un Exercice possède un nombre de Séries entier de 1 à 99 (D-092) ; la valeur par défaut à la création est 1.
- Pi est stockée et exécutée après chaque Série, dernière comprise. À la frontière des côtés successifs, PN puis PC se cumulent. Par paire, Pi suit chaque paire, dernière comprise, et PC reste dans chaque paire. Seule la toute dernière Pause est remplacée par la récupération positive qui suit l’occurrence ; aucune récupération en direct. N=1 normalisé uniforme/par côté. Formules et séquences : Bip v2§3 et paramètres v13§§4–5.
- Une `ActivityDefinition` bilatérale peut porter `sideRecoverySeconds`, exécuté une fois par Exercice en Un côté après l’autre, ou une fois par paire en Les deux côtés à chaque série.
- Toute `SessionActivity` porte `postActivityRecoverySeconds`, y compris avec la valeur `0`; une valeur positive crée une phase après l’occurrence et avant `SESSION_END` si elle est la dernière.
- Ni la Pause ni les récupérations ne créent une entité Exercice associé.
- Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durées selon Bip v2 et paramètres v13 : Durée exacte ; Répétitions avec bip estimées ≈ ; Répétitions sans bip et À l’échec omitted au niveau Exercice. ≥ réservé à la Séance contenant du travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel.
- En Durée uniforme seulement, si l’utilisateur pilote par une Durée totale cible, le calcul inverse porte sur cette durée intrinsèque puis applique l’arrondi validé à `C`. Seul `C` est persisté comme valeur canonique de Séries.
- Toutes les Exercices peuvent être associées à des zones corporelles.
- Les exercices peuvent être ajoutées, déplacées, dupliquées et supprimées.
- Leur ordre est conservé à l’intérieur de leur position structurelle. Un Exercice peut être déplacée manuellement d’une position structurelle à une autre.

# 09.6 Entité Média

> **Périmètre :** consultation des médias pendant l’Exécution incluse au MVP (D-203). L’ajout/import et le stockage local sont inclus au MVP dans PRE-3, avant le moteur d’exécution (D-327). Les règles de partage des fichiers et de conservation de D-066/D-068 sont conservées ; seul leur report post-MVP est remplacé.

## Définition

Un **Média** est une ressource visuelle locale associée à un Exercice. L’import/ajout et la persistance de ces associations sont livrés dans PRE-3 au MVP (D-327), avant leur consultation pendant l’Exécution.

## Périmètre

Un `MediaAsset` possède son identité et ses informations techniques. Les liens vers les Exercices sont portés par des associations `ActivityMedia` ordonnées.

## Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Stable |
| Exercice | Exercice associé | Obligatoire | Un seul exercice |
| Type | Photo ou vidéo | Obligatoire | |
| Emplacement local | Référence du fichier | Obligatoire | Stockage local |
| Nom du fichier | Nom technique | Obligatoire | |
| Miniature | Aperçu | Facultatif | Générée automatiquement |
| Taille | Taille du fichier | Calculé | |
| Durée | Durée de lecture | Conditionnel | Vidéo uniquement |

## Règles métier

- Un fichier média peut être référencé par plusieurs associations appartenant chacune à un Exercice.
- Un exercice peut ne posséder aucun média.
- Un exercice possède zéro à plusieurs associations média ordonnées.
- La duplication d’un Exercice ou d’une Séance crée une nouvelle association/entité Média pour l’Exercice dupliquée ; cette association peut référencer le même fichier physique local.
- Retirer un média d’un Exercice supprime uniquement son association. Le fichier physique est supprimé seulement lorsqu’aucun Exercice ni aucun instantané ne le référence.


# 09.7 Entité Exécution

## Définition

Une **Exécution** représente la réalisation effective d’une source exécutable. Dans le MVP, son origine vaut `SESSION` ou, à partir de T03, `ACTIVITY` pour un Exercice lancée depuis le Catalogue des Exercices.

Elle est créée uniquement au démarrage et reste indépendante des modifications ou de la suppression ultérieures de sa source.

## Périmètre

Une Exécution possède directement :

- une origine immuable `SESSION` ou `ACTIVITY` ;
- la référence facultative à la source persistante ;
- la Routine éventuelle, uniquement pour une origine `SESSION` ;
- un instantané immuable de la source ;
- un état d’Exécution ;
- ses informations de début et de fin.

## Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Créé au démarrage |
| Origine | Type de source | Obligatoire | `SESSION` ou `ACTIVITY`, immuable |
| Source persistante | Séance ou Exercice de référence | Facultatif | Une seule selon l’origine ; peut devenir absente après suppression de la source |
| Routine | Routine d'origine | Facultatif | Autorisée pour `SESSION` ou `ACTIVITY` lorsqu’une occurrence planifiée a déclenché l’Exécution |
| Instantané de source | Copie figée de la Séance ou de l’Exercice | Obligatoire | Créé automatiquement |
| État d'exécution | Avancement | Obligatoire | Mis à jour en continu |
| Date de début | Début réel | Obligatoire | Générée automatiquement |
| Date de fin | Fin réelle | Facultatif | À la clôture |
| Statut | En cours, Suspendue, Terminée, Partielle ou Interrompue | Obligatoire | |
| Durée réelle | Temps actif réellement exécuté | Calculé | Exclut uniquement les périodes de Pause manuelle déclenchées par l’utilisateur ; inclut le Compte à rebours initial, le temps réellement passé dans les Exercices, les Pauses entre Séries, les phases `SIDE_RECOVERY` / `POST_ACTIVITY_RECOVERY` réellement exécutées et la Fin de séance |
| Dernière sauvegarde | Date de sauvegarde | Obligatoire | Technique |
| Ressenti | Ressenti général renseigné dans la Synthèse | Conditionnel | Obligatoire dès lors que la Synthèse est présentée ; peut être absent après interruption technique sans Synthèse |
| Commentaire | Commentaire libre de Synthèse | Facultatif | **200 caractères maximum** |
| Nombre d’Exercices exécutés | Nombre de Résultats d’Exercice exécuté effectivement créés | Calculé | Un Exercice `Partielle` compte comme exécutée ; un Exercice jamais atteinte ne compte pas ; utilisé notamment pour le Suivi et les indicateurs historiques |
| Occurrence planifiée satisfaite | Occurrence future éventuellement satisfaite par une Exécution anticipée | Facultatif | Renseignée lorsqu’une occurrence future est démarrée en avance |

## Structures internes

### Instantané de source

L’Instantané de source est une copie figée et allégée de la Séance ou de l’Exercice persistant au moment du démarrage de l’Exécution.

Il contient uniquement les informations nécessaires pour :
- reconstruire l’ordre et le contenu de la Séance exécutée ;
- restituer fidèlement l’Exécution dans l’historique ;
- calculer les informations de suivi prévues par le MVP.

Il ne contient pas de copie physique des médias associés aux Exercices.

| Élément conservé         | Contenu                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Séance                   | Identifiant source, nom, Étiquette et couleur dérivée                                                          |
| Compte à rebours initial | Durée, texte vocal                                                                                             |
| Cycle                    | Identifiant, position, nombre de répétitions                                                                   |
| Tour                      | Identifiant, position, nombre de répétitions                                                                   |
| Exercice                | Identifiant source, nom, mode d’exécution, durée ou répétitions cibles lorsqu’elles existent, nombre de Séries, état uniforme/variable, cibles/Pauses ordonnées, direction, Ordre des côtés, PC, R contextuelle de l’occurrence uniquement, description, zones corporelles, associations média ordonnées et références stables dans la cible post-T05 |
| Durée totale             | Valeur recalculable, non canonique et non persistée comme source de vérité                                      |
| Fin de séance            | Durée, texte vocal                                                                                             |
| Structure                | Ordre exact des éléments et relations nécessaires au plan d’exécution                                          |

Les fichiers médias ne sont pas dupliqués physiquement dans l’Instantané. Celui-ci conserve toutefois les associations ordonnées et les références stables ; un fichier reste conservé tant qu’un instantané le référence.

L’Instantané est persisté sous forme de **JSON immuable**. Les champs nécessaires à la consultation chronologique du Suivi MVP sont conservés sous une forme permettant un accès efficace sans dépendre de la Séance courante. Les index spécifiques à la recherche, au tri et aux filtres avancés ne sont pas requis par l’interface MVP et pourront être ajoutés lors de l’activation de ces fonctions.

### État d'exécution

Contient notamment :

- exercice courant ;
- Tour courant ;
- cycle courant ;
- état temporel courant ;
- état du chronomètre.

## Règles métier

- Une Exécution est créée au démarrage effectif d’une source `SESSION` ou `ACTIVITY`.
- Elle référence exactement une source persistante selon son origine lorsqu’elle existe encore.
- Elle peut référencer la Routine qui a déclenché son occurrence, quelle que soit son origine.
- Un Instantané de source est créé automatiquement au démarrage effectif de l’Exécution.
- L’Instantané est immuable après sa création.
- Toute modification, archivage ou suppression ultérieure de la source est sans effet sur l’Instantané.
- L’Exécution conserve la référence à sa source lorsqu’elle existe, mais son historique est reconstruit exclusivement à partir de l’Instantané.
- Les fichiers médias ne sont pas dupliqués dans l’Instantané ; leurs associations ordonnées et références stables y sont conservées en V2.
- Toute modification ultérieure de la routine est sans effet.
- Une seule exécution peut être en cours simultanément.
- Après une interruption technique alors que l’Exécution était `En cours`, elle n’est pas clôturée automatiquement. Au retour dans l’application, l’utilisateur doit choisir l’action de reprise ou l’action d’arrêt adaptée à son origine. Tant que ce choix n’est pas effectué, aucune nouvelle Exécution ne peut démarrer. L’arrêt clôt l’Exécution avec le statut `Interrompue` puis ouvre la fin minimale dans T04, ou la Synthèse lorsqu’elle est livrée.
- Une exécution terminée, partielle ou interrompue est conservée dans le suivi.

# 09.14 Extension du modèle — Exercices, Médias et Parcours

## Racines et associations

| Objet | Version | Rôle et relations |
|---|---|---|
| `ActivityDefinition` | MVP T03 | Référence persistante autonome sans type d’Exercice, directement exécutable et copiable dans une Séance. |
| `SessionActivity` | MVP | Copie complète appartenant à une seule Séance ; contient sa position et son ordre. |
| `MediaAsset` | MVP PRE-3 | Fichier local immuable et métadonnées techniques ; peut être partagé. |
| `ActivityMedia` | MVP PRE-3 | Association ordonnée entre un exercice et un `MediaAsset`. |
| `Parcours` | V2 | Racine persistante avec nom, couleur et configuration de transition. |
| `CircuitSession` | V2 | Étape ordonnée référençant une Séance ; plusieurs lignes peuvent viser la même Séance. |
| `CircuitExecution` | V2 | Exécution globale et instantané immuable du Parcours. |
| `CircuitSessionExecution` | V2 | Lien ordonné entre l’Exécution de Parcours et chaque Exécution de Séance commencée. |

## Contraintes d’Exercice

`executionMode ∈ {DURATION, REPETITIONS, TO_FAILURE}`. `DURATION` exige une durée cible et interdit les répétitions cibles ; `REPETITIONS` exige des répétitions cibles et interdit la durée cible ; `TO_FAILURE` interdit les deux. Pause, nombre de Séries et Récupération restent disponibles dans les trois modes. La Durée totale est dérivée : DURATION sans symbole, omise seulement si redondante (N1 unilatéral) ; REPETITIONS avec cadence Ri×Ci et ≈, sans bip omitted ; TO_FAILURE sans total d’Exercice. Bip entier0..10 par Série, réglage commun valide dans les trois modes. La phrase elle-même n’est pas persistée comme source de vérité (D-232).

L’ajout d’une définition copie nom, description, zones corporelles, mode, durée ou répétitions, Séries, Pause, Récupération et associations média. La copie n’a plus de lien fonctionnel avec la définition. La position `BEFORE_TOUR`, `IN_TOUR` ou `AFTER_TOUR` n’existe que sur `SessionActivity`.

## Contraintes Média

Un Exercice possède `0..n` lignes `ActivityMedia`, chacune avec une position unique dans son exercice. Un nouvel élément reçoit la dernière position et la réorganisation ne touche que cette association. Les fichiers ne sont jamais stockés dans SQLite ; `MediaAsset` contient une URI interne stable, type photo/vidéo, miniature éventuelle et métadonnées. La suppression physique n’est autorisée que lorsque le nombre de références actives, copies et instantanés est nul.

## Contraintes Parcours

Un Parcours validé possède au moins deux `CircuitSession`. Il n’existe aucun compteur de répétition d’étape. `transitionMode ∈ {MANUAL, AUTOMATIC}` ; `transitionDurationSeconds` est absent en manuel, obligatoire en automatique et vaut `30` par défaut. Une Séance archivée demeure valable dans un Parcours existant mais n’est plus proposée ; sa suppression définitive est bloquée tant qu’un Parcours la référence.

Au lancement, l’instantané contient le Parcours ordonné et l’instantané de chaque Séance. Une Exécution interrompue conserve les étapes terminées, l’étape courante interrompue et aucune ligne d’Exécution de Séance pour les étapes non commencées.


# 09.7.1 Résultat d’Exercice exécuté

Chaque occurrence d’Exercice parcourue pendant une Exécution produit un **Résultat d’Exercice exécuté** distinct. Il permet de distinguer les occurrences issues des Séries, répétitions de Tour et répétitions de Cycle.

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique du résultat | Obligatoire | Stable |
| Exécution | Exécution concernée | Obligatoire | Une seule Exécution |
| Exercice de l’Instantané | Exercice source | Obligatoire | Référence l’Instantané, pas la Séance courante |
| Position d’exécution | Rang dans le plan d’exécution | Obligatoire | Permet de distinguer les occurrences |
| Série / Tour / Cycle | Indices de répétition applicables | Calculé | Conservés pour restitution |
| Statut | Résultat de l’occurrence | Obligatoire | `Terminée` ou `Partielle` selon le type et le déroulement |
| Durée réelle | Temps réellement passé sur l’Exercice | Obligatoire | Chronométré pour les modes Durée, Répétitions et À l’échec |
| Pause entre les côtés prévue/écoulée | Durées de la phase intrinsèque éventuelle | Conditionnel | Champs distincts rattachés à `SIDE_RECOVERY` lorsqu’elle existe |
| Récupération après exercice prévue/écoulée | Durées de la phase contextuelle | Obligatoire / calculé | Planifiée depuis `postActivityRecoverySeconds`; `0` reste une valeur de donnée, temps écoulé nul si aucune phase positive |

Ces résultats sont conservés avec l’Exécution et permettent de calculer le **Nombre d’Exercices exécutés** et les indicateurs de Suivi.

# 09.8 Structures internes du moteur d'exécution

## Définition

Le moteur d'exécution est le composant chargé de transformer une **séance** en une succession d'exercices exécutables.

Au démarrage d'une séance, il construit un **plan d'exécution** à partir de l'**instantané de séance** créé pour cette exécution.

Le plan d'exécution est ensuite parcouru séquentiellement jusqu'à la fin de la séance.

Le moteur d'exécution, le plan d'exécution et les structures qu'il manipule sont des structures internes de calcul. Ils ne constituent pas des entités métier.

## Plan d'exécution

### Définition

Le plan d'exécution est la représentation linéaire de la séance obtenue après résolution de sa structure.

Le Compte à rebours initial structurellement présent, éventuellement instantané à `0 s`, les Exercices placés avant le Circuit, les Tours du Circuit et les Exercices placés après le Circuit sont développés afin d'obtenir une liste ordonnée directement exploitable. Le Cycle technique enveloppe cette structure avec une répétition imposée à `1` dans le MVP ; la Fin de séance est ajoutée à la suite du plan développé.

### Contenu

- liste ordonnée des étapes d’exécution ;
- ordre d'exécution ;
- références vers les exercices de l'instantané ;
- numéro de Tour ;
- numéro de répétition du cycle ;
- informations de navigation.

## Exercice d'exécution

### Attributs fonctionnels

| Attribut            | Description                                |  Caractère  | Règle principale                  |
| ------------------- | ------------------------------------------ | :---------: | --------------------------------- |
| Position            | Rang dans le plan d'exécution              |   Calculé   | Numérotation continue             |
| Exercice            | Exercice de l'instantané                   | Facultatif  | Absente pour `INITIAL_COUNTDOWN` et `SESSION_END`; les phases de récupération référencent leur Exercice/occurrence source |
| Type de phase       | `INITIAL_COUNTDOWN`, `ACTIVITY`, `SERIES_PAUSE`, `SIDE_RECOVERY`, `POST_ACTIVITY_RECOVERY` ou `SESSION_END` | Calculé | Déduit de l’Exercice et de l’occurrence ; ce n’est pas un type d’Exercice |
| Tour du Circuit  | Numéro de Tour               |   Calculé   | Généré automatiquement            |
| Répétition du cycle | Numéro de répétition du cycle              |   Calculé   | Généré automatiquement            |
| Étape suivante      | Navigation                                 |   Calculé   | Absente uniquement pour `SESSION_END` |

## Règles métier

- Le plan d'exécution est généré automatiquement au démarrage de chaque exécution de séance.
- Il est construit exclusivement à partir de l'instantané de séance.
- Toute modification ultérieure de la séance ou de la routine est sans effet.
- La fin de le dernier Exercice active `SESSION_END`. L’Exécution n’est terminée qu’après l’achèvement de cette dernière étape ; une durée de `0 s` l’achève immédiatement.
- Les Tours du Circuit et du cycle sont résolues lors de la génération.
- Chaque Série produit une phase `ACTIVITY`. Une phase `SERIES_PAUSE` n’existe qu’entre Séries successives. `SIDE_RECOVERY` est insérée entre les côtés si nécessaire ; `POST_ACTIVITY_RECOVERY` est insérée après chaque occurrence de Séance/Parcours si sa durée contextuelle est positive.
- T04 développe les Séries multiples, les répétitions de Tour et les passages de côté avant démarrage. Le Plan obtenu est figé dans l’instantané.
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
- les valeurs proposées par défaut lors de la création de nouvelles séances ou exercices.

Elles ne contiennent pas directement :

- les séances ;
- les routines ;
- les exercices ;
- les exécutions de séance.

## Attributs fonctionnels

| Attribut                                           | Description                                                                |  Caractère  | Règle principale                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------- | :---------: | ------------------------------------------------------------------------ |
| Sons activés                                       | Active les signaux sonores                                                 | Obligatoire | Préférence globale                                                       |
| Annonces vocales                                   | Active les annonces vocales                                                | Obligatoire | Préférence globale                                                       |
| Notifications                                      | Autorisation effective des rappels locaux                                  | Obligatoire | Non autorisées par défaut ; demande système lors de la première activation d’un rappel |
| Vibration                                          | Active les vibrations fonctionnelles de séance                             | Facultatif  | Valeur initiale activée ; n'affecte pas le feedback haptique systématique des roulettes numériques |
| Écran maintenu actif                               | Empêche la mise en veille pendant une exécution de séance                  | Facultatif  | Pendant l'exécution uniquement                                           |
| Durée par défaut d'un exercice Exercice           | Valeur initiale proposée                                                   | Facultatif  | Création uniquement                                                      |
| Pause entre les côtés par défaut              | Valeur globale du Profil utilisée pour initialiser `sideRecoverySeconds` lors de l’activation `D→G` ou `G→D` d’un Exercice | Facultatif | `10 s` dans le Figma de référence ; valeur proposée à la création/activation bilatérale puis modifiable dans l’éditeur |
| Récupération après exercice par défaut              | Valeur proposée lors de l’ajout explicite d’une récupération | Facultatif | `30 s` dans le Figma de référence ; ajout explicite uniquement ; une modification ultérieure ne change pas les récupérations existantes |
| Date de création                                   | Date de création                                                           | Obligatoire | Générée automatiquement                                                  |
| Date de modification                               | Dernière modification                                                      | Obligatoire | Mise à jour automatiquement                                              |
| Durée du compte à rebours initial par défaut       | Durée proposée pour le compte à rebours initial d'une nouvelle séance      | Obligatoire | Valeur initiale : `10 s`                                                 |
| Texte vocal du compte à rebours initial par défaut | Texte vocal proposé pour le compte à rebours initial d'une nouvelle séance | Facultatif  | Valeur initiale : `Préparez-vous`                                        |
| Durée de la fin de séance par défaut               | Durée proposée pour la fin de séance d'une nouvelle séance                 | Obligatoire | Valeur initiale : `5 s`                                                  |
| Texte vocal de la fin de séance par défaut         | Texte vocal proposé pour la fin de séance d'une nouvelle séance            | Facultatif  | Valeur initiale : `Séance terminée, bravo`                               |
| Durée du compte à rebours d’Exercice par défaut    | Durée proposée pour le Compte à rebours propre d’une nouvelle Exercice     | Obligatoire | Valeur proposée par le Profil                                             |
| Durée de la Fin d’exercice par défaut              | Durée proposée pour la Fin propre d’une nouvelle Exercice                  | Obligatoire | Valeur proposée par le Profil                                             |
## Règles métier

La Pause après chaque série n’est pas un défaut du Profil ; elle est initialisée à `0 s` dans la feuille de création (v13 §6, CE-UI-10 §3). L’ancien attribut global est historique et ne doit pas être ajouté au modèle cible. Les valeurs déjà propres aux Exercices restent conservées.

- Chaque utilisateur possède une seule structure de préférences globales.
- Les préférences s'appliquent à toutes les séances et à toutes les exécutions.
- Modifier une préférence n'altère jamais les séances existantes.
- Les valeurs par défaut sont utilisées uniquement lors de la création de nouveaux éléments.
- Une exécution de séance utilise les préférences actives au moment de son démarrage.
- Une modification des préférences ne modifie jamais une exécution déjà en cours.
- Les préférences sont enregistrées automatiquement après chaque modification.
- Les valeurs par défaut du Compte à rebours initial et de la Fin de séance sont copiées dans la Séance lors de sa création.
- Les valeurs par défaut du Compte à rebours d’Exercice et de la Fin d’exercice sont proposées lors de la création d’une nouvelle Exercice.
- Une modification ultérieure des Préférences globales ne modifie pas les séances déjà créées


# 09.10 Entité Étiquette

## Définition

Une **Étiquette** permet de classer une **Séance**. Elle porte la couleur affichée de la Séance ; aucune couleur métier indépendante n’est stockée sur la Séance.

## Périmètre

Une Étiquette possède son identité, son libellé et sa couleur persistante. Une Séance référence zéro ou une Étiquette.

## Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Stable |
| Utilisateur | Propriétaire | Obligatoire | Une Étiquette appartient à un seul utilisateur |
| Nom | Libellé affiché | Obligatoire | Non vide après trim ; unicité selon normalisation canonique |
| Couleur | Couleur affichée de la Séance | Obligatoire | Valeur persistante issue de la palette contrôlée |
| Date de création | Date de création | Obligatoire | Générée automatiquement |
| Date de modification | Dernière modification | Obligatoire | Mise à jour automatiquement |

## Règles métier

- une Séance peut ne porter aucune Étiquette ;
- lorsqu’une Étiquette est associée, sa couleur est la couleur affichée de la Séance ;
- créer une nouvelle Étiquette depuis la Composition l’ajoute au référentiel utilisateur selon le parcours validé ;
- toute Étiquette est supprimable, y compris une valeur fournie initialement par KODJO ; la suppression la retire des choix futurs mais conserve son association aux Séances existantes qui l’utilisent ;
- créer une Étiquette dont le nom normalisé correspond à une Étiquette retirée réactive celle-ci (même identifiant, associations conservées, couleur choisie appliquée) (D-257) ;
- les Instantanés historiques conservent les informations nécessaires à la restitution du libellé et de la couleur.

# 09.10.1 Entité Catégorie

## Définition

Une **Catégorie** classe une **Exercice** et porte sa couleur sémantique. Elle est distincte des Zones corporelles.

## Périmètre

Une Catégorie possède son identité, son libellé, sa couleur et son ordre d’affichage. Un nouvel Exercice valide référence exactement une Catégorie.

## Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Stable |
| Utilisateur | Propriétaire | Obligatoire | Une Catégorie appartient à un seul utilisateur |
| Nom | Libellé affiché | Obligatoire | Non vide après trim ; unicité selon normalisation canonique |
| Couleur | Couleur sémantique de l’Exercice | Obligatoire | Valeur persistante issue de la palette contrôlée |
| Ordre d'affichage | Position dans les listes | Obligatoire | Déterministe |
| Date de création | Date de création | Obligatoire | Générée automatiquement |
| Date de modification | Dernière modification | Obligatoire | Mise à jour automatiquement |

## Règles métier

- un nouvel Exercice valide porte exactement une Catégorie ;
- un Exercice porte au plus une Catégorie dans le modèle courant ;
- la Catégorie et les Zones corporelles sont deux dimensions indépendantes ;
- la couleur de la Catégorie est utilisée comme repère sémantique de l’Exercice dans les cartes et l’éditeur ;
- une Catégorie créée depuis l’éditeur devient disponible dans le référentiel utilisateur selon le parcours validé ;
- toute Catégorie est supprimable, y compris une valeur fournie initialement par KODJO ; la suppression la retire des choix futurs mais conserve son association aux Exercices existants qui l’utilisent et préserve l’historique.
- créer une Catégorie dont le nom normalisé correspond à une Catégorie retirée réactive celle-ci (même identifiant, associations conservées, couleur choisie appliquée) (D-257).

# 09.11 Entité Zone corporelle

## Définition

Une **Zone corporelle** désigne une partie du corps principalement sollicitée par un Exercice.

L’application fournit un référentiel utilisateur de Zones corporelles utilisé pour caractériser les Exercices. Il est initialisé avec des valeurs par défaut mais reste administrable par l’utilisateur dans le MVP.

## Périmètre

Une Zone corporelle possède directement :

- son identité ;
- son nom ;
- son ordre d’affichage.

Un nouvel Exercice valide référence une ou plusieurs Zones corporelles. Une zone corporelle ne contient pas directement les exercices qui l’utilisent.

## Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Stable |
| Nom | Libellé affiché | Obligatoire | Unique dans le référentiel |
| Ordre d’affichage | Position dans les listes | Obligatoire | Défini par l’application |

## Règles métier

- Un nouvel Exercice valide est associé à une ou plusieurs Zones corporelles ; la sélection reste multiple.
- Les Zones corporelles constituent un référentiel utilisateur administrable.
- L’utilisateur peut créer, renommer et supprimer une Zone corporelle.
- Toutes les Zones, y compris les dix valeurs initiales fournies par KODJO, sont supprimables.
- La suppression d’une Zone utilisée demande confirmation, la retire des choix futurs, conserve ses associations aux Exercices existants et ne modifie pas les Instantanés/Exécutions historiques.
- Créer une Zone dont le nom normalisé correspond à une Zone retirée réactive celle-ci (même identifiant, associations conservées) (D-257).

## Valeurs initiales du référentiel (D-093, révisée par D-199)

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

Le jeu initial ne contient pas de zone `Corps entier` et ne distingue pas gauche/droite. Ces dix valeurs sont des valeurs par défaut, non une liste fermée : le référentiel peut évoluer par création, renommage ou suppression utilisateur. Les identifiants restent stables ; un renommage ne change pas l’identité de la Zone.

# 09.12 Règles d’intégrité et de copie

## Objectif

Ce chapitre définit les règles garantissant la cohérence du modèle de données ainsi que le comportement des opérations de duplication, d'archivage, de suppression et de conservation des données.

## Règles d'intégrité

### Identité

- Chaque entité possède un identifiant unique et stable.
- Deux entités distinctes ne peuvent jamais partager le même identifiant.
- Les identifiants sont générés automatiquement.

### Cohérence des relations

- Toute `SessionActivity` appartient à une seule Séance et occupe une seule position structurelle ; seules les copies techniquement `Dans Tour` appartiennent au conteneur `Tour` représentant le Circuit pour l’exécution structurelle. Une `ActivityDefinition` du MVP T03 reste autonome.
- Tout Tour appartient à un seul cycle.
- Tout cycle appartient à une seule séance.
- Toute Routine référence exactement une source `SESSION` ou `ACTIVITY`.
- Toute Exécution référence exactement une source selon son origine.
- Toute Étiquette et toute Catégorie appartient au référentiel de l’Utilisateur local ; l’origine initiale ou personnalisée n’affecte pas les droits de suppression.
- Une Séance référence au plus une Étiquette ; un nouvel Exercice valide référence exactement une Catégorie.
- La couleur affichée d’une Séance dérive uniquement de son Étiquette. La couleur sémantique d’un Exercice dérive uniquement de sa Catégorie.
- Les Zones corporelles appartiennent au référentiel utilisateur local. Elles sont administrables par l’utilisateur local et restent référencées par identifiant stable.

### Cohérence des données

- Une séance exécutable contient au moins un Exercice.
- Une durée de Pause ou de Récupération est toujours supérieure ou égale à `0 s` ; une Récupération à `0 s` ne génère aucune phase.
- Les nombres de Tours du Circuit et du cycle sont toujours supérieurs ou égaux à 1.

## Duplication d'une séance

- Nouvelle séance avec un nouvel identifiant.
- Nom `{nom d’origine} (copie)`, puis `{nom d’origine} (copie 2)`, `(copie 3)`, etc., en utilisant le premier suffixe disponible.
- Copie de l’Étiquette de la Séance.
- Copie du Cycle, du Tour, des Exercices et de leurs Catégories ; les associations média suivent leur règle de copie propre.
- Les routines et les exécutions de séance ne sont jamais copiées.

## Duplication d'un exercice

- Nouvelle exercice avec un nouvel identifiant.
- Nom `{nom d’origine} (copie)`, puis `{nom d’origine} (copie 2)`, `(copie 3)`, etc., en utilisant le premier suffixe disponible.
- Copie de toutes les propriétés, notamment Catégorie, Zones corporelles, mode/cible, Séries, Pause, Récupération, Changement de côté, Compte à rebours d’Exercice, Fin d’exercice et Description. Les associations média suivent leur règle de copie propre.
- Aucun Exercice secondaire n’est créée pour la Récupération : sa durée est copiée avec l’Exercice.
- La copie est insérée immédiatement après la source dans la même zone fonctionnelle avant/dans/après Circuit (valeurs techniques historiques `Avant Tour`, `Dans Tour`, `Après Tour`). Elle reste une copie de Séance indépendante et ne crée aucun Exercice dans le catalogue.

## Suppression d’un média

Les règles suivantes sont préparatoires et ne s’appliquent qu’après l’introduction des médias :

- Un fichier physique local peut être référencé par plusieurs entités/associations Média, chacune appartenant à une seule Exercice.
- Le retrait d’un média depuis un Exercice supprime uniquement l’association ciblée.
- Le fichier physique local n’est supprimé que lorsqu’aucun Exercice, copie de Séance ni aucun Instantané ne le référence.
- Les autres Exercices, Séances et Instantanés conservent leurs associations et restent inchangés.

## Archivage et suppression

### Archivage d'une séance

L'archivage d'une Séance :
- conserve la Séance ;
- ne demande pas de confirmation si aucune Routine ne lui est associée ;
- demande une confirmation explicite si au moins une Routine lui est associée ;
- après cette confirmation, supprime toutes les Routines qui lui sont associées ;
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

- Une Séance est créée lors de la validation de sa Composition ; l’Étiquette reste facultative dans le modèle courant.
- Une séance peut rester vide pendant son édition.
- Une séance archivée n'est plus proposée pour créer une nouvelle routine ou être exécutée directement.
- La duplication crée une nouvelle séance indépendante.

## Cycle de vie d'un exercice

Une `ActivityDefinition` persistante du Catalogue suit le cycle :

```text
Création → Active → Modifier → Archiver → Restaurer
                                  └→ Supprimer définitivement depuis les archives
```

- Une `ActivityDefinition` est autonome et ne porte aucune position de Séance.
- Un Exercice de Séance (`SessionActivity`) appartient à une seule Séance et occupe exactement une position fonctionnelle avant, dans ou après le Circuit ; les valeurs techniques restent `Avant Tour`, `Dans Tour`, `Après Tour`. La référence technique au conteneur `Tour` n’est obligatoire que pour `Dans Tour`.
- L’insertion depuis le Catalogue crée une copie indépendante ; aucune synchronisation ultérieure n’existe.
- La capacité de création directe d’une `SessionActivity` locale à une Séance reste conservée techniquement et fonctionnellement, même si elle n’est pas exposée dans le parcours courant.
- La suppression définitive d’une `ActivityDefinition` ne supprime ni les `SessionActivity` déjà copiées, ni les Exécutions, ni les Instantanés historiques.

## Cycle de vie d'une routine

Création → Modification → Suppression

### Règles métier

- Une Routine est créée à partir d’une source active existante, de type `SESSION` ou `ACTIVITY`.
- La suppression d’une Routine ne supprime jamais sa source ni les Exécutions.

## Cycle de vie d’une Exécution

Création → En cours → Suspendue → Reprise → Terminée, Partielle ou Interrompue → Historique

### Règles métier

- Une Exécution est créée au démarrage effectif d’une Séance ou d’un Exercice persistant, depuis son Catalogue ou depuis une occurrence planifiée de Routine.
- Une seule exécution peut être en cours simultanément.
- Après une interruption technique alors que l’Exécution était `En cours`, elle n’est pas clôturée automatiquement. Au retour dans l’application, l’utilisateur doit choisir `Reprendre la séance` ou `Arrêter la séance`. Tant que ce choix n’est pas effectué, aucune nouvelle Exécution ne peut démarrer. `Arrêter la séance` clôt l’Exécution avec le statut `Interrompue` puis ouvre la fin minimale dans T04, ou la Synthèse lorsqu’elle est livrée.
- Une exécution terminée, partielle ou interrompue est conservée dans le suivi.

## Données de bilatéralité

| Donnée | Type et règle |
|---|---|
| `activity.sideMode` | `UNILATERAL | RIGHT_LEFT | LEFT_RIGHT`, non nul, défaut `UNILATERAL`; présent sur l’Exercice persistant et sur son occurrence de Séance. |
| `tour.sideMode` | Champ technique historique conservé pour compatibilité et non-régression ; dans la version actuelle il reste fixé à `UNILATERAL` et n’est pas exposé ni modifiable. |
| `executionPlanNode.effectiveSideMode` | Valeur figée dans l’instantané, résolue depuis l’Exercice dans la version actuelle. |
| `executionPlanNode.executionSide` | `NONE | RIGHT | LEFT`; `NONE` uniquement pour une exécution unilatérale ou une phase structurelle sans côté. |
| `activityResult.executionSide` | `NONE | RIGHT | LEFT`; participe à la clé logique d’idempotence avec l’Exercice, le Tour et la Série. |

La migration ajoute `UNILATERAL` comme valeur par défaut aux données de côté historiques sans dupliquer Exercice ni Résultat. Les résultats historiques reçoivent `NONE`. Le champ technique historique de côté du Tour est conservé pour compatibilité et non-régression, reste fixé à `UNILATERAL` et n’est pas exposé à la mutation utilisateur dans la version actuelle.

## Extension V2 — origine et instantané d’Exécution

| Donnée | Valeurs / règle |
|---|---|
| `Execution.origin` | `SESSION` ou `ACTIVITY`, obligatoire et immuable. |
| `Execution.sourceSessionId` | Renseigné uniquement pour `SESSION`. |
| `Execution.sourceActivityDefinitionId` | Référence informative pour `ACTIVITY` ; peut devenir nulle si la source est supprimée. |
| `Execution.snapshot` | Instantané immuable de la Séance ou de l’Exercice selon l’origine. |
| `Execution.preparationDurationSeconds` | `5` pour `ACTIVITY` ; valeur issue de la Séance pour `SESSION`. |
| `Execution.completedSeriesCount` | Agrégat compatible avec un Exercice directe. |

Contraintes : une origine `ACTIVITY` interdit un `sourceSessionId`, ne crée aucun objet Séance et ne contient aucune étape `SESSION_END`. Les résultats conservent les côtés et paramètres figés.

# 09.15 Migration T03 — Catalogue des Exercices

Cette section constitue l’unique référence du chapitre 09 pour la distinction `ActivityDefinition` / `SessionActivity`, le cycle de vie et la migration T03.

## Distinction ActivityDefinition / SessionActivity

`ActivityDefinition` est la référence persistante autonome du Catalogue des Exercices. `SessionActivity` est une copie appartenant à une Séance.

Lors d’une insertion depuis le Catalogue, la copie reprend les propriétés métier applicables au moment de la validation : nom, Description, Catégorie, Zones corporelles, mode et cible, nombre de Séries, Pause, Récupération, Changement de côté, Compte à rebours d’Exercice, Fin d’exercice et autres champs persistants applicables. Après insertion, aucune synchronisation ni propagation n’existe entre la définition et la copie.

La capacité existante de créer directement une `SessionActivity` depuis une Composition ne crée jamais implicitement d’`ActivityDefinition`. Elle est conservée dans le modèle et l’architecture même lorsqu’elle n’est pas exposée dans le parcours utilisateur courant.

## Migration T03

La migration T03 introduit les structures persistantes nécessaires aux `ActivityDefinition`, à leurs relations et à l’origine d’Exécution `ACTIVITY`.

Elle :

- ne transforme pas les `SessionActivity` historiques en références de Catalogue ;
- ne crée aucune `ActivityDefinition` silencieusement ;
- est idempotente ;
- reste compatible avec la base locale existante ;
- préserve les Séances, Exécutions, Instantanés et résultats antérieurs.

## Exécution directe

Une Exécution directe d’Exercice :

- possède `origin = ACTIVITY` ;
- utilise un instantané autonome immuable de l’`ActivityDefinition` au lancement ;
- ne crée aucune Séance technique ou artificielle ;
- applique la préparation système fixe de `5 s` ;
- exécute ensuite les phases propres de l’Exercice, y compris son Compte à rebours éventuel, ses Séries, Pauses, côtés, Récupération et Fin d’exercice éventuelle ;
- ne contient ni Cycle ni Tour de Séance artificiels ;
- alimente le Suivi et les statistiques compatibles sans augmenter le nombre de Séances.

## Sélection multiple depuis une Composition

La sélection multiple reçoit les identifiants des `ActivityDefinition` choisies, mais les copies sont insérées selon l’ordre courant de présentation de la liste filtrée au moment de la validation. L’ordre des touchers n’est pas un ordre métier.

Une validation sans sélection ne crée aucune donnée.

## Frontière d’évolution

La gestion multiple ordonnée des médias et les mécanismes d’acquisition média suivent leur périmètre propre. Les Parcours fonctionnels restent hors du périmètre T03. Les structures T03 ne doivent pas empêcher ces évolutions ultérieures.

## Données cibles — état média de l’Exécution

La conception D-203 n’introduit pas de nouvelle donnée historique d’Exécution. Elle exploite la collection ordonnée de médias de l’Exercice et ajoute un état UI **volatile** limité à la séance courante :
- face Information/Média par Exercice rencontré ;
- index du média courant par Exercice ;
- état de lecture de la vidéo courante.

La face et l’index ne sont pas persistés entre séances, ne sont pas copiés dans l’Instantané et ne font pas partie des résultats historiques. La conception ne décide pas ici d’un nouveau schéma de stockage durable pour les médias ; celui-ci reste régi par le périmètre de la future gestion multiple des médias.

## Extension future de Routine — source Parcours

D-207 étend le modèle cible sans modifier le périmètre MVP : le discriminateur de source de Routine accepte aujourd’hui `SESSION` et `ACTIVITY`; il devra accepter la source Parcours lorsque cette capacité est livrée. Tant que le nommage technique historique est conservé, cette valeur est `CIRCUIT`. La cardinalité reste exactement une source par Routine. Les occurrences et l’Exécution issue de l’occurrence conservent le type de source et son identifiant.

## Données D-208 — récupérations

### ActivityDefinition

`ActivityDefinition` ne contient aucun champ de récupération post-exercice. Il peut porter `sideRecoverySeconds`, pertinent uniquement pour `RIGHT_LEFT` ou `LEFT_RIGHT`.

### SessionActivity

Aucune récupération automatique à la création d’une occurrence. Une récupération explicite est proposée au défaut Profil (30 s initialement) lors de son ajout ; elle reste solidaire de son occurrence. postActivityRecoverySeconds est sa projection de calcul, 0 en l’absence de récupération (D-304/D-307). Déplacement, duplication et suppression conservent la sémantique d’appartenance à l’occurrence.

### Plan d’Exécution

Le plan distingue au minimum la phase de Pause entre les côtés de la phase de récupération après occurrence. Une Exécution `ACTIVITY` directe ne génère jamais de phase post-exercice. Une Exécution `SESSION` génère la récupération après chaque occurrence, y compris à chaque répétition de Tour et avant `SESSION_END` pour la dernière occurrence.

## Données D-209 à D-214 — consolidation

- `Session` porte le **Circuit** interne et son `tourCount`; `Tour` n’est pas une entité de contenu distincte du Circuit mais l’occurrence répétée de celui-ci dans le Plan fonctionnel. Les identifiants techniques historiques peuvent rester inchangés jusqu’à refactorisation.
- `ActivityDefinition` exige une référence de Catégorie active à la création et au moins une association de Zone corporelle. La sélection des Zones est `1..n`.
- `Session` porte `0..1` Étiquette.
- Étiquette/Catégorie portent leur couleur. Les objets les référencent sans copier la couleur courante. Une valeur retirée du référentiel actif reste conservée tant qu’elle est référencée afin de préserver nom/couleur et affectations existantes.
- Les défauts Profil sont lus uniquement à l’initialisation : aucune provenance `hérité/personnalisé` n’est nécessaire et aucune mise à jour rétroactive n’est effectuée.
- `Session` porte un booléen global, activé par défaut, de prise en compte des phases propres `Compte à rebours d’exercice + Fin d’exercice`. Il n’existe pas de surcharge de ce booléen par occurrence.
- Un Point d’arrêt placé dans le Circuit appartient au contenu répété et est donc développé à chaque Tour.


La phrase de synthèse des paramètres d’exécution est une **valeur dérivée non persistée**. Elle est régénérée depuis `executionMode`, nombre de Séries, état uniforme/variable, cible/Pause communes ou collection ordonnée, `sideMode`, Ordre des côtés et `sideRecoverySeconds`. Aucun champ de stockage autonome de la phrase n’est requis (D-232).

Bornes de validation D-232 : `seriesCount ∈ [1,99]`, répétitions par Série `∈ [1,100]`, durée par Série `∈ [1,5999] s`, pauses inter-Séries et inter-côtés `∈ [0,300] s`. Le pas UI n’est pas une contrainte de stockage : tap1s, maintien accéléré1/5/10 selon DSF Bip ; aucun arrondi à la lecture.

## Impacts de données de la revue des cartes — 30 septembre 2026

Décisions finales du propriétaire : les 17 points du 30/09 sont clos. Révision des cartes du 03/10/2026 (D-260 à D-264) : un seul format de carte d’Exercice, avec une gouttière permanente de 64 px dans le Catalogue et les listes de sélection d’exercices ; photo si média associé, icône de nature sinon. La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture (D-264). Les Séances ne portent jamais de visuel. Aucune photo dans les listes mixtes, le Calendrier ou le Suivi. Aucun déploiement d’Exercice ni de carte du Suivi ; le déploiement des Séances reste accessible dans le Catalogue et le Calendrier Semaine. Le Suivi présente deux lignes : nature/titre/statut, puis durée/catégorie/ressenti ; sans heure, zones corporelles ni étiquettes. Le Ressenti y est un indicateur sans action, distinct de sa saisie obligatoire en Synthèse. Les variantes déployées d’Exercice et du Suivi sont historiques, hors MVP. Pauses/récupérations et prochaine planification restent absentes des cartes concernées. Les données, instantanés, calculs et fonctions de planification sont conservés.

Synthèses : « N séries de X », « N séries de N rép. », « N séries à l’échec » ; bilatéralité par miroir dans les variantes concernées. Heure Semaine « 08:00 » ; aucune heure dans la carte du Suivi. Séance sans étiquette : catégories de ses exercices ; listes de catégories/zones séparées par un point médian et tronquées avec « … ». Choix sans badge durée ; récurrence du Calendrier Semaine dans la carte déployée seulement.

RG-10 : le Profil porte une préférence silhouette facultative, homme/femme ; absence = homme affiché. Elle ne pilote que l’icône de zone corporelle, sans filtre, recherche ou effet métier. RG-11 à RG-13 : vignette 64 centrée et recadrée sans déformation (couverture pour une vidéo), place réservée pendant chargement/erreur, texte alternatif égal au nom de l’exercice.

D-239 : Calendrier Jour est une exception compacte (séance 298 × 46, exercice 298 × 48, x=80, hauteur d’instance adaptée à l’événement), avec barre colorée 4, nature 26, titre 13 gras, heure/durée 11, lecture 26 et aucun Déployer. Les deux sets comportent 10 variantes chacun. Suivi — Vue d’ensemble est hors MVP. Les boutons Calendrier Aujourd’hui/Planifier restent à 32, sans cible 44 ajoutée : situation acceptée, à revoir et développer après T04. Les nouvelles icônes sont nommées icon/<nom>, les anciennes ne sont pas renommées ; target est réservé au Programme, pulse aux rapports/Suivi.

Contrat de donnée : ajouter au Profil la préférence facultative `silhouette`, valeurs `homme` / `femme` ; absence ou null conserve le rendu homme, sans imposer de saisie aux profils existants. Ce champ ne représente pas un sexe. Les références média et les instantanés existants sont conservés.

Référence normative ciblée : [DSF — Cartes, icônes et appuis](../DSF-CARTES-ICONES-APPUIS-2026-09-30.md). Ces règles finales prévalent sur les anciennes formulations d’affichage du présent chapitre dans ce périmètre uniquement.



> **Clôture des contrats — 01/10/2026.** Les règles consolidées du [chapitre 13, §6](13%20–%20Contrats%20d’écran.md#6-clôture-des-réserves-fonctionnelles-des-contrats) s’appliquent : progression sur le plan complet ; transitions et pauses selon D-248/v13 (ancien repli D-242 retiré) ; fréquence 1..12 semaines ; rappel personnalisé au plus 24 h. En Un côté après l’autre, le reset porte sur le bloc du côté courant ; la même règle s’applique à l’ordre alterné en conservant les résultats de l’autre côté (chapitre13 R-03). Les étapes et calculs ci-dessous se lisent avec ces précisions ; aucune nouvelle disposition d’écran.


### Saisie des paramètres — D-246

La référence active est [Paramètres en modale v13](SPECIFICATION-PARAMETRES-MODALE-v13.md), contrats CE-T03-04/CE-UI-10. Elle intègre Séries variables, Ordre des côtés, pauses terminales et récupération de l’occurrence. Feuille transactionnelle : ✕ annule, ✓ applique au parent, Terminer persiste. Les calculs et comportements sont normatifs dans les spécifications ; Figma définit le layout seulement. Les anciens textes v11 sont historiques.

## Paramètres de Série et Ordre des côtés — D-247 à D-254

Le mode d’exécution est commun à l’Exercice. Le stockage distingue explicitement uniforme et variable, même si les valeurs sont identiques. En variable, conserver N lignes ordonnées avec cible (Durée/Répétitions) et Pause ; aucune cible numérique À l’échec. Les mêmes lignes s’appliquent aux deux côtés. Direction et Ordre des côtés sont deux propriétés distinctes. N=1 est normalisé uniforme/Un côté après l’autre dès le brouillon.

Copie Catalogue→Séance, duplication et nouvel instantané conservent tout cet état. Les données sans nouveaux attributs sont uniformes/Un côté après l’autre. Les calculs actuels s’appliquent aussi aux Exercices existants ; résultats historiques immuables. Les valeurs temporaires de restauration et le repli visuel ne sont jamais persistés. Voir v13 §§2–5 et8 pour le contrat complet.

## Extension normative de données — Cadence

| Support | Donnée / contrainte |
|---|---|
| Série effective | `cadenceBeepIntervalSeconds` entier0..10, trois modes,0=Aucun ; cible répétitions et pause restent indépendantes |
| Brouillon uniforme/variable | Cadence commune facultative ; propagée aux lignes. Alternatives de mode mémorisées jusqu’à✓ seulement ; aucune surcharge commune persistée |
| ActivityDefinition / SessionActivity | Transport de la collection ordonnée complète ; occurrence ajoute R contextuelle ; copie indépendante et duplication conservent les cadences |
| Instantané versionné | Prescription cible/cadence de chaque Série et côté, immuable après démarrage ; absent dans ancien snapshot=non cadencé |
| État d’exécution | Intervalles acquis, ancre intervalle courant, nominal atteint, état suspendu ; accumulateur réel distinct de la tentative |
| Résultat par Série/côté | Temps actif cumulé, incluant fractions abandonnées et tentatives reset ; aucun nombre réel de répétitions déduit |
| Calcul dérivé | Secondes prévisionnelles et niveau d’incertitude ; phrase et total non persistés comme vérité indépendante |

Migration : ancien objet sans champ initialisé à0 ; conserver valeurs et historique. Bip valide et conservé dans les trois modes après validation. Écriture atomique des paramètres et de la collection ; transitions moteur idempotentes. Le schéma physique et sa migration sont à implémenter, pas réputés présents du fait de cette cible.



## Propagation Pauses et symboles — 07/10

Modèle logique : pause explicite avec identifiant stable, type recovery ou breakpoint et position ; recovery référence son occurrence source et sa durée. postActivityRecoverySeconds est une projection pour les calculs, pas une seconde source persistée. Absent, présent0 et présent positif restent distinguables. Snapshot copie les objets effectifs ; suppression d’occurrence emporte recovery. Le schéma physique et la migration restent à implémenter ; aucune reprise des anciennes séances demandée.

## Bip de cadence — seconde clarification du07/10

cadenceBeepIntervalSeconds entier0..10 dans les trois modes ;0=Aucun, défaut0. Même champ sur les Séries effectives et snapshots, réglage commun sans surcharge. Aucune suppression lors d’une bascule de mode. Résultat temporel exact/estimated/lowerBound/omitted ; omitted sans montant, validation erronée séparée. LowerBound réservé à SESSION. SeriesParameters et pauses explicites doivent être intégrés au schéma avant ce champ ; numérotation de migration à planifier.

## Contrat technique de phrase — clarification du07/10

La [spécification de phrase](SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md) gouverne le générateur pur : paramètres métier + résultat de durée + locale française → `Array<{texte: string, gras: boolean}>`. Retour vide `[]` si aucune phrase applicable. Aucun calcul depuis Excel, aucune chaîne à redécouper pour trouver les valeurs en gras. React Native utilise des Text imbriqués ; le découpage est émis par le gabarit, y compris si une valeur se répète.

Aucune colonne phrase ni sérialisation des segments dans définition/occurrence/snapshot. Génération à chaque affichage depuis les paramètres ; ✓ applique le brouillon, ne persiste pas le texte. Un changement rédactionnel est visible au prochain rendu des objets existants. Paramètres historiques et temps réalisés préservés.

Français uniquement au MVP. Internationalisation ultérieure : gabarits et règles de pluriel/genre/ordre par locale, avec recette dédiée ; prévoir la réécriture de la grammaire française, pas une traduction des segments isolés. Corpus276 utilisé uniquement pour les phrases, valeurs totales injectées par le calcul métier.

## Précision de modèle — source du07/10, v15

Une récupération explicite de0s est un objet conservé, distinct de l’absence ; seul Retirer la supprime. Elle ne crée aucune phase positive ni suppression dePN. Le scalaire historique ActivityDefinition.pauseSeconds ne devient pas une récupération : sa valeur est portée dans SeriesParameters.pauseSeconds lors de la refonte. Les pauses recovery/breakpoint de Composition restent une collection distincte. Aucun schéma physique ou migration exécutée dans ce lot.
