# 09.0 – Vue d'ensemble

## Objectif et périmètre

Ce chapitre décrit les données manipulées par le MVP, leurs relations, leur cycle de vie et les règles garantissant leur cohérence.

Il est indépendant de toute technologie de stockage ou d’architecture logicielle. Il ne définit ni les tables techniques, ni les classes, ni le choix d’une base de données.

Le modèle couvre quatre ensembles fonctionnels :

1. la définition des routines ;
2. la composition ordonnée des routines ;
3. l’exécution des routines ;
4. l’historique et les préférences globales.

Dans le MVP, les données sont locales à l’appareil. Il n’existe pas encore de compte utilisateur, de relation avec un kinésithérapeute ou un coach, ni de partage entre utilisateurs.

## Principes structurants

- Une **routine** est une définition enregistrée et réutilisable.
- Une **séance** est l’exécution datée d’une routine.
- Une routine est composée d’éléments ordonnés.
- Les éléments réutilisés ou copiés deviennent indépendants de leur source.
- Une modification ultérieure d’une routine ne doit jamais modifier les séances déjà enregistrées dans l’historique.
- Les sons et les annonces vocales sont des préférences globales et ne sont pas des attributs propres à une routine.
- Les objets fonctionnels sont distingués des objets calculés nécessaires au moteur d’exécution.
- Le modèle du MVP doit pouvoir évoluer ultérieurement vers les routines imbriquées, le partage et les usages professionnels, sans imposer ces fonctions dès la première version.

## Vue d’ensemble du modèle

### Liste des entités

La liste des entités pour la V1 est la suivante :

| Entité                    | Rôle dans l’application                                            | Nature        | Relations principales                                                              |
| ------------------------- | ------------------------------------------------------------------ | ------------- | ---------------------------------------------------------------------------------- |
| **Routine**               | Définition générale d’une routine enregistrée                      | Principale    | Contient des activités, séries et cycles ; possède des planifications              |
| **Activité**              | Action à réaliser : exercice chronométré, manuel ou en répétitions | Principale    | Appartient à une routine ou à une série ; peut posséder un média                   |
| **Média**                 | Photo ou vidéo associée à une activité                             | Secondaire    | Appartient à une activité                                                          |
| **Catégorie**             | Classement des routines                                            | Métier        | Associée à plusieurs routines                                                      |
| **Zone corporelle**       | Partie du corps sollicitée par une activité                        | Métier        | Associée à plusieurs activités de type Exercice                                    |
| **Planification**         | Règle indiquant quand une routine doit être réalisée               | Principale    | Appartient à une routine ; génère des occurrences dans le calendrier               |
| **Séance**                | Exécution réelle d’une routine                                     | Principale    | Référence la routine et l’occurrence éventuelle ; contient le résultat d’exécution |
| **Instantané de routine** | Copie figée de la routine telle qu’elle était lors de la séance    | Principale    | Appartient à une séance                                                            |
| **Préférences globales**  | Sons, annonces vocales et autres réglages généraux                 | Configuration | Une seule instance locale pour la V1                                               |
| **Utilisateur**           | Informations générales de l’utilisateur de l’application           | Configuration | Porte les préférences et paramètres personnels                                     |
## Décisions structurantes du modèle

| ID     | Décision                                                                                                                                                                              | Version |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| DM-001 | La pause est modélisée comme une activité de type « Pause ». Lorsqu’elle est définie depuis une activité chronométrée, une activité Pause liée est créée avec des valeurs par défaut. | V1      |
| DM-002 | Les séries et les cycles sont des structures internes à la routine, et non des entités autonomes.                                                                                     | V1      |
| DM-003 | Les occurrences du calendrier sont calculées à partir des règles de planification et ne sont pas créées à l’avance dans la base de données.                                           | V1      |
| DM-004 | Les exceptions de planification ne sont pas gérées en V1 ; le modèle doit permettre leur ajout ultérieur.                                                                             | V2      |
| DM-005 | Une entité Utilisateur existe dès la V1, avec une seule instance locale et sans authentification.                                                                                     | V1      |
## Relations principales

UTILISATEUR
│
├── possède 0..n ROUTINES
│   │
│   ├── appartient à 0..n CATÉGORIES
│   │
│   ├── possède 0..n PLANIFICATIONS
│   │
│   ├── contient 1..n ACTIVITÉS
│   │   │
│   │   ├── possède 0..1 MÉDIA PRINCIPAL
│   │   ├── sollicite 0..n ZONES CORPORELLES (Exercice uniquement)
│   │   │
│   │   └── peut être liée à 0..1 ACTIVITÉ de type PAUSE
│   │
│   └── est à l’origine de 0..n SÉANCES
│
├── possède 0..n CATÉGORIES
├── possède 0..n ZONES CORPORELLES
│
├── possède 0..n PLANIFICATIONS
│
├── possède 0..n SÉANCES
│   │
│   ├── contient 1 INSTANTANÉ DE ROUTINE
│   ├── contient 1 ÉTAT D’EXÉCUTION
│   └── contient 0..1 RÉSULTAT
│
└── possède 1 PRÉFÉRENCES GLOBALES

Cardinalités :
- 1 : exactement un
- 0..1 : zéro ou un
- 0..n : zéro, une ou plusieurs occurrences
- 1..n : une ou plusieurs occurrences

Utilisateur 1 ─── possède ─── 0..n Routine
Utilisateur 1 ─── possède ─── 0..n Catégorie
Utilisateur 1 ─── possède ─── 0..n Zone corporelle
Utilisateur 1 ─── possède ─── 0..n Planification
Utilisateur 1 ─── possède ─── 0..n Séance
Utilisateur 1 ─── possède ─── 1 Préférences globales

Catégorie 1 ─── classe ─── 0..n Routine
Routine 1 ─── contient ─── 1..n Activité
Routine 1 ─── possède ─── 0..n Planification
Routine 1 ─── est à l’origine de ─── 0..n Séance
Routine 0..n ─── est classée dans ─── 0..n Catégorie

Activité 1 ─── possède ─── 0..1 Média principal
Activité 0..n ─── sollicite ─── 0..n Zone corporelle
Activité 0..1 ─── est liée à ─── 0..1 Activité de type Pause

Séance 1 ─── contient ─── 1 Instantané de routine
Séance 1 ─── contient ─── 1 État d’exécution
Séance 1 ─── contient ─── 0..1 Résultat

# 09.1 Entité Utilisateur

## Définition

Un **Utilisateur** représente le propriétaire des données de l’application.

Dans la V1, un seul utilisateur local existe sur l’appareil. Il ne possède pas encore de compte d’authentification et ne peut pas se connecter, partager ses données ou appartenir à un groupe.

L’entité est néanmoins créée dès la V1 afin de rattacher explicitement les routines, planifications, séances et préférences à un propriétaire identifiable et de préparer les futures évolutions multi-utilisateurs.
## Périmètre

Un utilisateur possède directement :

- son identité locale ;
- ses informations générales ;
- ses routines ;
- ses planifications ;
- ses séances ;
- ses préférences globales.

Il ne contient pas directement :

- les activités, qui appartiennent aux routines ;
- les médias, qui appartiennent aux activités ;
- les données d’authentification, absentes de la V1 ;
- les groupes, communautés ou relations professionnelles, prévus pour des versions ultérieures.

## Attributs fonctionnels

| Attribut             | Description                                  |     Caractère      | Règle principale                                              |
| -------------------- | -------------------------------------------- | :----------------: | ------------------------------------------------------------- |
| Identifiant          | Identifiant unique de l’utilisateur          |    Obligatoire     | Stable pendant toute la durée de vie de l’utilisateur         |
| Nom affiché          | Nom ou pseudonyme affiché dans l’application |     Facultatif     | Peut rester vide dans la V1                                   |
| Photo de profil      | Image associée au profil                     |     Facultatif     | Référence vers un média local                                 |
| Date de création     | Date de création de l’utilisateur local      |    Obligatoire     | Générée automatiquement                                       |
| Date de modification | Date de dernière modification du profil      |    Obligatoire     | Mise à jour automatiquement                                   |
| Routines             | Ensemble des routines de l’utilisateur       | Calculé / Relation | Un utilisateur peut posséder 0..n routines                    |
| Planifications       | Ensemble de ses planifications               | Calculé / Relation | Un utilisateur peut posséder 0..n planifications              |
| Séances              | Ensemble de ses séances                      | Calculé / Relation | Un utilisateur peut posséder 0..n séances                     |
| Préférences globales | Réglages personnels de l’utilisateur         |    Obligatoire     | Une seule structure de préférences par utilisateur dans la V1 |
## Règles métier

- Une seule instance d’Utilisateur existe dans la V1.
- L’utilisateur local est créé automatiquement lors de la première utilisation de l’application.
- Un utilisateur possède zéro, une ou plusieurs routines.
- Un utilisateur possède zéro, une ou plusieurs planifications.
- Un utilisateur possède zéro, une ou plusieurs séances.
- Un utilisateur possède une seule structure de préférences globales.
- Toute routine, planification et séance appartient à un seul utilisateur.
- La suppression du profil utilisateur n’est pas prévue dans la V1.
- L’utilisateur de la V1 n’est associé à aucun mécanisme d’authentification.
- Le modèle doit permettre ultérieurement l’ajout d’un compte d’authentification, de rôles, de groupes, de communautés et de relations entre professionnels et particuliers.
# 09.2 Entité Routine

## Définition

Une routine est une entité métier représentant un programme réutilisable d’activités ordonnées, pouvant être exécuté plusieurs fois et associé à une ou plusieurs règles de planification. Sa structure interne peut comporter un compte à rebours initial, des séries, des cycles et une fin de routine.

## Périmètre

Une routine possède directement :
- ses informations générales ;
- sa structure d’exécution ;
- ses paramètres de début et de fin ;
- ses paramètres de répétition ;
- ses planifications.

Elle ne contient pas directement :

- les séances exécutées ;
- l’historique ;
- les préférences globales ;
- les médias, qui sont rattachés aux activités.
## Attributs fonctionnels

| Attribut                          | Description                               |                    Caractère | Règle principale                                                                                                                      |
| --------------------------------- | ----------------------------------------- | ---------------------------: | ------------------------------------------------------------------------------------------------------------------------------------- |
| Identifiant                       | Identifiant interne unique                |                  Obligatoire | Stable pendant toute la durée de vie de la routine                                                                                    |
| Nom                               | Nom affiché de la routine                 |                  Obligatoire | Saisi avant la création effective de la routine                                                                                       |
| Description                       | Présentation ou objectif général          |                   Facultatif | Texte libre                                                                                                                           |
| Catégories                        | Catégories de classement                  |                   Facultatif | Une routine peut être associée à zéro, une ou plusieurs catégories appartenant au même utilisateur                               |
| Image                             | Illustration de la routine                |                   Facultatif | Référence vers un média local                                                                                                         |
| Statut                            | État de la routine                        |                  Obligatoire | Active ou archivée                                                                                                                    |
| Date de création                  | Date de création effective                |                  Obligatoire | Générée automatiquement                                                                                                               |
| Date de modification              | Date de dernière modification             |                  Obligatoire | Mise à jour automatiquement                                                                                                           |
| Date de dernière exécution        | Date de la dernière séance lancée         |                   Facultatif | Sert notamment à l’ordre d’affichage                                                                                                  |
| Date d’archivage                  | Date de passage au statut archivé         |                   Facultatif | Renseignée uniquement si la routine est archivée                                                                                      |
| Compte à rebours initial activé   | Active ou non l’étape de préparation      |                  Obligatoire | Paramètre de routine                                                                                                                  |
| Durée du compte à rebours initial | Durée avant la première activité          |                 Conditionnel | Utilisée uniquement si le compte à rebours est activé                                                                                 |
| Structure                         | Structure ordonnée de la routine          | Obligatoire pour l’exécution | Une routine peut être créée avant ajout d’activités, mais ne peut pas être exécutée vide                                              |
| Durée théorique                   | Durée calculée de la routine              |                      Calculé | Calculée automatiquement à partir de la structure ; indicative si des activités sont manuelles                                        |
| Nombre total d’étapes             | Nombre d’étapes générées pour l’exécution |                      Calculé | Dépend des éléments, séries et cycles                                                                                                 |

## Structure interne de la routine

La structure interne d’une routine est composée de :

- un compte à rebours initial (optionnel) ;
- une ou plusieurs séries ;
- un ou plusieurs cycles ;
- une fin de routine (optionnelle).

Les séries et les cycles ne constituent pas des entités métier autonomes. Ils font partie intégrante de la structure de la routine.

---
## Règles métier

- Le nom est obligatoire pour créer la routine.
- Deux routines peuvent porter le même nom, sous réserve de validation définitive.
- Une routine vide peut être conservée pendant son édition, mais ne peut pas être exécutée.
- Une routine peut être modifiée, dupliquée, archivée et restaurée.
- Une duplication crée une nouvelle routine indépendante avec un nouvel identifiant.
- L’archivage ne supprime pas la routine et ne supprime pas son historique.
- La suppression définitive, si elle est retenue, ne supprime pas les instantanés déjà conservés dans les séances.
- Les sons et annonces vocales ne sont pas enregistrés dans la routine.
- La durée théorique est recalculée après toute modification influençant l’exécution.
- Une routine appartient à un seul utilisateur.
- Une routine peut posséder zéro, une ou plusieurs planifications.
- Une routine peut être créée sans planification.
- Une routine peut être associée à zéro, une ou plusieurs catégories appartenant au même utilisateur.
- Une routine peut exister sans avoir jamais été exécutée.

---

# 09.3 Entité Planification 

## Définition
Une **Planification** est une règle définissant **quand** une routine doit être proposée ou exécutée.

Elle est indépendante de la routine elle-même et permet d'associer une ou plusieurs récurrences à une même routine.

La planification décrit une intention d'exécution. Elle ne représente pas une séance et ne crée pas, dans le MVP, d'occurrences persistantes dans la base de données.

## Périmètre
Une planification possède directement :

- sa règle de récurrence ;
- sa période de validité ;
- son état (active ou inactive) ;
- la routine à laquelle elle est associée.

Elle ne contient pas directement :

- les occurrences du calendrier, qui sont calculées à la demande ;
- les séances réellement exécutées ;
- les exceptions de planification (V2).

## Attributs fonctionnels

| Attribut             | Description                            |  Caractère   | Règle principale                                                      |
| -------------------- | -------------------------------------- | :----------: | --------------------------------------------------------------------- |
| Identifiant          | Identifiant unique                     | Obligatoire  | Stable pendant toute la durée de vie de la planification              |
| Routine              | Routine associée                       | Obligatoire  | Une planification est rattachée à une seule routine                   |
| Active               | État de la planification               | Obligatoire  | Active ou inactive                                                    |
| Type de récurrence   | Mode de récurrence                     | Obligatoire  | Quotidienne, hebdomadaire, mensuelle… (à préciser selon le MVP)       |
| Date de début        | Début d'application                    | Obligatoire  | Première date de validité                                             |
| Date de fin          | Fin d'application                      |  Facultatif  | Absente si la planification est permanente                            |
| Heure                | Heure prévue d'exécution               |  Facultatif  | Une seule heure possible par planification                            |
| Jours de la semaine  | Jours concernés                        | Conditionnel | Obligatoire uniquement pour une récurrence hebdomadaire.              |
| Fréquence            | Nombre d’unités entre deux occurrences | Obligatoire  | Entier supérieur ou égal à 1 ; interprété selon le type de récurrence |
| Date de création     | Date de création                       | Obligatoire  | Générée automatiquement                                               |
| Date de modification | Dernière modification                  | Obligatoire  | Mise à jour automatiquement                                           |
## Règles métier

- Une planification est toujours rattachée à une seule routine.
- Une planification ne peut pas exister sans routine associée.
- Une routine peut posséder zéro, une ou plusieurs planifications.
- Une routine peut être exécutée sans aucune planification.
- Une planification inactive n'est pas prise en compte dans le calendrier.
- Les occurrences affichées dans le calendrier sont calculées à partir des règles de planification et ne sont pas stockées.
- La modification d'une planification modifie immédiatement les occurrences futures calculées.
- La suppression d'une planification supprime uniquement la règle de planification ; elle ne supprime ni la routine ni les séances déjà enregistrées.
- Les exceptions de planification (déplacement, annulation ou modification d'une occurrence unique) ne sont pas prises en charge dans le MVP et constituent une évolution de la V2.

# 09.4 Entité Activité

## Définition

Une **Activité** est la plus petite unité exécutable d'une routine.

Elle décrit une action unique que l'utilisateur doit réaliser pendant une séance, selon un mode d'exécution défini.

Une activité peut être de type **Exercice** ou **Pause**. Son exécution peut être pilotée par une durée, un nombre de répétitions ou une validation manuelle, selon son mode d'exécution.

Une activité est toujours intégrée à la structure d'une routine et n'existe pas indépendamment de celle-ci.
## Périmètre
Une activité possède directement :

- son identité ;
- son type (Exercice ou Pause) ;
- son mode d'exécution ;
- ses informations générales (nom, consigne...) ;
- ses paramètres d'exécution (durée, répétitions...) ;
- son média éventuel ;
- sa position dans la structure de la routine.

Elle ne contient pas directement :

- les séries et les cycles, qui appartiennent à la structure de la routine ;
- les planifications ;
- les séances d'exécution ;
- les préférences globales.
## Attributs fonctionnels

| Attribut              | Description                                            |  Caractère   | Règle principale                                                                                                          |
| --------------------- | ------------------------------------------------------ | :----------: | ------------------------------------------------------------------------------------------------------------------------- |
| Identifiant           | Identifiant unique de l'activité                       | Obligatoire  | Stable tant que l'activité existe                                                                                         |
| Position              | Position de l'activité dans la structure de la routine | Obligatoire  | Position absolue, unique et continue dans la routine ; recalculée automatiquement après ajout, suppression ou déplacement |
| Type                  | Nature de l'activité                                   | Obligatoire  | Exercice ou Pause                                                                                                         |
| Nom                   | Libellé affiché                                        | Obligatoire  | Valeur par défaut « Pause » pour une activité de type Pause                                                               |
| Consigne              | Instructions affichées                                 |  Facultatif  | Texte libre                                                                                                               |
| Mode d'exécution      | Mode de progression                                    | Obligatoire  | Durée, Répétitions ou Manuel                                                                                              |
| Durée                 | Durée de l'activité                                    | Conditionnel | Obligatoire si le mode est « Durée »                                                                                      |
| Nombre de répétitions | Nombre de répétitions à effectuer                      | Conditionnel | Obligatoire si le mode est « Répétitions »                                                                                |
| Média principal       | Photo ou vidéo associée                                |  Facultatif  | Un seul média dans le MVP                                                                                                 |
| Activité Pause liée   | Pause créée automatiquement après l'activité           |  Facultatif  | Référence vers une activité de type Pause                                                                                 |
| Zones corporelles    | Parties du corps principalement sollicitées              |  Facultatif  | Zéro, une ou plusieurs zones ; autorisées uniquement pour une activité de type Exercice                                   |
| Date de création      | Date de création                                       | Obligatoire  | Générée automatiquement                                                                                                   |
| Date de modification  | Dernière modification                                  | Obligatoire  | Mise à jour automatiquement                                                                                               |

## Règles métier
- Une activité appartient à une seule routine.
- Une activité possède une position absolue, unique et continue dans la structure de la routine.
- Une activité est obligatoirement de type **Exercice** ou **Pause**.
- Une activité possède obligatoirement un mode d'exécution.
- Une activité de type **Pause** utilise obligatoirement le mode d'exécution **Durée**.
- Une activité de type **Pause** reçoit par défaut le nom « Pause », modifiable par l'utilisateur.
- Une activité de type **Exercice** peut utiliser les modes **Durée**, **Répétitions** ou **Manuel**.
- Une activité utilisant le mode **Durée** possède une durée strictement positive.
- Une activité utilisant le mode **Répétitions** possède un nombre de répétitions strictement positif.
- Une activité utilisant le mode **Manuel** ne possède ni durée obligatoire ni nombre de répétitions obligatoire.
- Une activité peut être associée à un seul média principal.
- Une activité de type **Exercice** peut être associée à zéro, une ou plusieurs zones corporelles appartenant au même utilisateur.
- Une activité de type **Pause** ou **Récupération** ne possède aucune zone corporelle.
- Une activité peut être liée à une activité de type **Pause** créée automatiquement.
- La suppression d'une activité est immédiate et peut être annulée via la snackbar « Annuler ».
- La suppression d'une activité liée entraîne également la suppression de l'activité **Pause** qui lui est associée.
- La copie d'une activité crée une nouvelle activité indépendante avec un nouvel identifiant.
- Le déplacement, l'ajout ou la suppression d'une activité entraîne le recalcul automatique des positions dans la routine.
- Une activité de type **Pause** peut être créée directement par l'utilisateur ou être générée automatiquement lorsqu'elle est associée à une activité.
- Une activité de type **Pause** peut posséder une consigne et un média principal au même titre qu'une activité de type **Exercice**.

# 09.5 Entité Média

## Définition

Un **Média** est une ressource visuelle associée à une activité afin d'en faciliter la compréhension ou l'exécution.

Dans le MVP, un média est une **photo** ou une **vidéo** locale. Une activité peut être associée à un seul média principal.

## Périmètre

Un média possède directement :

- son identité ;
- son type ;
- son emplacement de stockage ;
- ses informations techniques ;
- l'activité à laquelle il est associé.

Il ne contient pas directement :

- les routines ;
- les séances ;
- les planifications ;
- les préférences globales

## Attributs fonctionnels

| Attribut             | Description              |  Caractère   | Règle principale                         |
| -------------------- | ------------------------ | :----------: | ---------------------------------------- |
| Identifiant          | Identifiant unique       | Obligatoire  | Stable tant que le média existe          |
| Activité associée    | Activité propriétaire    | Obligatoire  | Un média appartient à une seule activité |
| Type                 | Nature du média          | Obligatoire  | Photo ou Vidéo                           |
| Emplacement local    | Référence du fichier     | Obligatoire  | Chemin ou identifiant de stockage local  |
| Nom du fichier       | Nom technique du fichier | Obligatoire  | Conservé lors de l'import                |
| Miniature            | Aperçu du média          |  Facultatif  | Générée automatiquement si nécessaire    |
| Taille               | Taille du fichier        |   Calculé    | Exprimée en octets                       |
| Durée                | Durée de lecture         | Conditionnel | Renseignée uniquement pour une vidéo     |
| Date de création     | Date d'ajout             | Obligatoire  | Générée automatiquement                  |
| Date de modification | Dernière modification    | Obligatoire  | Mise à jour automatiquement              |

## Règles métier

- Un média appartient à une seule activité.
- Une activité peut ne posséder aucun média.
- Une activité ne peut posséder qu'un seul média principal dans le MVP.
- Le média peut être une photo ou une vidéo.
- La suppression d'une activité entraîne la suppression de l'association avec son média.
- La suppression d'un média ne supprime pas l'activité associée.
- Le remplacement d'un média conserve l'identifiant de l'activité.
- Lors de la duplication d'une activité, l'association avec le média est dupliquée. Le fichier physique peut être réutilisé sans duplication selon l'implémentation retenue.

---

# 09.6 Entité Séance

## Définition

Une **Séance** représente l'exécution réelle d'une routine à une date et une heure données.

Elle est créée au démarrage effectif d'une routine et conserve toutes les informations nécessaires au suivi de son exécution, à sa reprise éventuelle et à son enregistrement dans l'historique.

Une séance est indépendante des modifications ultérieures de la routine grâce à l'instantané créé lors de son démarrage.
## Périmètre

Une séance possède directement :

- son identité ;
- la routine dont elle est issue ;
- son instantané de routine ;
- ses informations temporelles ;
- son état d'avancement ;
- son résultat d'exécution.

Elle ne contient pas directement :

- la définition de la routine ;
- les planifications ;
- les préférences globales ;
- les médias.

Les données nécessaires au déroulement de la séance sont obtenues à partir de son instantané de routine.

## Attributs fonctionnels

| Attribut                     | Description                                           |  Caractère  | Règle principale                                   |
| ---------------------------- | ----------------------------------------------------- | :---------: | -------------------------------------------------- |
| Identifiant                  | Identifiant unique de la séance                       | Obligatoire | Créé au démarrage de la séance                     |
| Routine d'origine            | Routine lancée                                        | Obligatoire | Référence la routine utilisée pour créer la séance |
| Instantané de routine        | Copie figée de la routine                             | Obligatoire | Créé automatiquement au démarrage                  |
| Date et heure de début       | Début effectif                                        | Obligatoire | Enregistrée automatiquement                        |
| Date et heure de fin         | Fin effective                                         | Facultatif  | Renseignée uniquement lorsque la séance se termine |
| Statut                       | État global de la séance                              | Obligatoire | En cours, Suspendue, Terminée, Abandonnée          |
| Durée théorique              | Durée prévue                                          |   Calculé   | Déterminée à partir de l'instantané                |
| Durée réelle                 | Temps réellement écoulé                               |   Calculé   | Calculée à la fin ou à l'abandon                   |
| Mode de fin                  | Manière dont la séance s'est terminée                 | Facultatif  | Normale, Abandon, Arrêt utilisateur…               |
| Date de dernière mise à jour | Dernière sauvegarde                                   | Obligatoire | Mise à jour automatiquement                        |
| Instantané de routine        | Structure interne décrivant la routine figée          | Obligatoire | Créée au démarrage                                 |
| État d'exécution             | Structure interne décrivant l'avancement de la séance | Obligatoire | Mise à jour pendant toute l'exécution              |
| Résultat                     | Structure interne décrivant le résultat final         | Obligatoire | Complétée à la fin de la séance                    |
## Structures internes

### Instantané de routine

#### Définition

Un **Instantané de routine** est une copie figée des données d’une routine au moment où une séance démarre.

Il garantit qu’une séance reste compréhensible et cohérente même si la routine d’origine est ensuite modifiée, archivée ou supprimée.

#### Attributs

| Attribut               | Description                                   |  Caractère  | Règle principale                               |
| ---------------------- | --------------------------------------------- | :---------: | ---------------------------------------------- |
| Routine                | Référence logique de la routine d'origine     | Obligatoire | Correspond à la routine au moment du démarrage |
| Informations générales | Nom, description et catégories de la routine | Obligatoire | Copiées lors du démarrage                      |
| Structure              | Structure complète de la routine              | Obligatoire | Copiée intégralement                           |
| Activités              | Activités, paramètres et zones corporelles     | Obligatoire | Copiées intégralement                          |
| Médias                 | Références des médias associés                | Facultatif  | Conserve l'affichage de la séance              |
| Date de création       | Date de création de l'instantané              | Obligatoire | Créée automatiquement au démarrage             |
### Etat d'exécution

#### Définition

L'état d'exécution regroupe les informations nécessaires au suivi et à la reprise d'une séance en cours.
#### Attributs

| Attribut            | Description                 |  Caractère   | Règle principale                               |
| ------------------- | --------------------------- | :----------: | ---------------------------------------------- |
| Position courante   | Étape actuellement exécutée |  Facultatif  | Nulle avant le démarrage effectif              |
| Activité courante   | Activité en cours           |  Facultatif  | Référence l'activité de l'instantané           |
| Série courante      | Série en cours              |  Facultatif  | Issue de la structure de la routine            |
| Cycle courant       | Cycle en cours              |  Facultatif  | Issue de la structure de la routine            |
| Temps restant       | Temps restant sur l'étape   | Conditionnel | Utilisé uniquement pour une étape chronométrée |
| État du chronomètre | État du moteur d'exécution  | Obligatoire  | En cours, En pause, Arrêté                     |
### Résultat

#### Définition

Le résultat regroupe les informations calculées à l'issue d'une séance afin d'alimenter l'historique et les statistiques.
#### Attributs

| Attribut                  | Description                               | Caractère | Règle principale                    |
| ------------------------- | ----------------------------------------- | :-------: | ----------------------------------- |
| Nombre d'étapes réalisées | Étapes effectivement exécutées            |  Calculé  | Calculé à la fin                    |
| Nombre d'étapes prévues   | Étapes prévues par l'instantané           |  Calculé  | Déterminé au démarrage              |
| Taux de réalisation       | Progression finale                        |  Calculé  | Pourcentage calculé automatiquement |
| Statut final              | Statut du résultat d'exécution de l'étape |  Calculé  | Terminée ou Abandonnée              |
## Règles métier

- Une séance est créée uniquement lors du démarrage effectif d'une routine.
- Une séance est toujours associée à une seule routine.
- Un instantané de la routine est créé automatiquement lors du démarrage de la séance.
- Toute modification ultérieure de la routine est sans effet sur la séance et sur son instantané.
- Une séance peut être **En cours**, **Suspendue**, **Terminée** ou **Abandonnée**.
- Une séance terminée ou abandonnée est conservée dans l'historique.
- Une séance terminée ou abandonnée ne peut plus être modifiée.
- Seule une séance ayant le statut "Suspendue" peut être reprise.
- L'état d'exécution est mis à jour automatiquement tout au long de la séance.
- La durée réelle est calculée automatiquement à partir des dates et heures de début et de fin.
- La suppression d'une routine ne supprime pas les séances déjà enregistrées.
- La suppression d'une séance n'a aucun effet sur la routine d'origine.
- Une seule séance peut être en cours simultanément sur un même appareil.
- Une séance suspendue conserve son état jusqu'à ce que l'utilisateur la reprenne ou l'abandonne explicitement.

# 09.8 Structures internes du moteur d'exécution

## Définition

Le moteur d'exécution est le composant chargé de transformer une routine en une succession d'étapes exécutables lors d'une séance.

Au démarrage d'une séance, il construit un **plan d'exécution** à partir de l'instantané de la routine. Ce plan est ensuite parcouru jusqu'à la fin de la séance.

Le plan d'exécution et les étapes d'exécution sont des **structures internes de calcul**. Ils ne constituent pas des entités métier et ne sont pas destinés à être manipulés directement par l'utilisateur.

## Plan d'exécution

### Définition

Le plan d'exécution est la représentation linéaire de la routine obtenue après résolution de sa structure.

Les séries, les cycles et les éventuels comptes à rebours sont développés afin d'obtenir une liste ordonnée d'étapes directement exploitable par le moteur d'exécution.

Le plan est construit une seule fois au démarrage de la séance à partir de son instantané.

### Contenu

Le plan d'exécution contient notamment :

- la liste ordonnée des étapes à exécuter ;
- leur ordre d'exécution ;
- les références vers les activités de l'instantané ;
- les indices de série et de cycle ;
- les informations nécessaires à la navigation (étape précédente, suivante...).
 
## Etapes d'exécution

### Définition

Une étape d'exécution représente une action élémentaire réalisée pendant une séance.

Chaque étape correspond à une activité présente dans l'instantané de la routine ou à une étape générée automatiquement (par exemple le compte à rebours initial).

### Attributs

| Attribut         | Description                              |  Caractère  | Règle principale                              |
| ---------------- | ---------------------------------------- | :---------: | --------------------------------------------- |
| Position         | Rang de l'étape dans le plan d'exécution |   Calculé   | Numérotation continue                         |
| Activité         | Activité de l'instantané concernée       | Obligatoire | Référence l'activité copiée dans l'instantané |
| Type             | Nature de l'étape                        |   Calculé   | Compte à rebours, Exercice ou Pause           |
| Numéro de série  | Série en cours                           |   Calculé   | Déterminé lors de la construction du plan     |
| Numéro de cycle  | Cycle en cours                           |   Calculé   | Déterminé lors de la construction du plan     |
| Étape précédente | Référence de navigation                  |   Calculé   | Facultative pour la première étape            |
| Étape suivante   | Référence de navigation                  |   Calculé   | Facultative pour la dernière étape            |
## Règles métier

- Le plan d'exécution est généré automatiquement au démarrage de chaque séance.
- Il est construit exclusivement à partir de l'instantané de la routine.
- Toute modification de la routine après le démarrage d'une séance est sans effet sur son plan d'exécution.
- Les séries et les cycles sont résolus lors de la génération du plan.
- Le plan est parcouru séquentiellement par le moteur d'exécution.
- Les préférences globales (sons, annonces vocales, vibration...) sont appliquées pendant l'exécution, mais ne modifient pas le plan.

# 09.9 Entité Préférences globales

## Définition

Les **Préférences globales** regroupent les paramètres personnels de l'utilisateur qui influencent le comportement général de l'application.

Elles s'appliquent à l'ensemble des routines et des séances, sans modifier leur définition fonctionnelle.

## Périmètre

Les préférences globales possèdent directement :

- les paramètres audio ;
- les paramètres d'affichage et d'exécution ;
- les valeurs proposées par défaut lors de la création de nouvelles routines ou activités.

Elles ne contiennent pas directement :

- les routines ;
- les activités ;
- les planifications ;
- les séances.

## Attributs fonctionnels

| Attribut                            | Description                                              |  Caractère  | Règle principale                                 |
| ----------------------------------- | -------------------------------------------------------- | :---------: | ------------------------------------------------ |
| Sons activés                        | Active les signaux sonores                               | Obligatoire | Préférence globale                               |
| Annonces vocales activées           | Active les annonces vocales                              | Obligatoire | Préférence globale                               |
| Vibration activée                   | Active le retour haptique                                | Facultatif  | Activée uniquement sur les appareils compatibles |
| Écran maintenu actif                | Empêche la mise en veille pendant une séance             | Facultatif  | S'applique uniquement pendant une séance         |
| Compte à rebours initial par défaut | Valeur proposée lors de la création d'une routine        | Facultatif  | Ne modifie pas les routines existantes           |
| Durée d'activité par défaut         | Valeur proposée lors de la création d'une activité       | Facultatif  | Utilisée uniquement comme valeur initiale        |
| Durée de pause par défaut           | Valeur proposée lors de la création d'une activité Pause | Facultatif  | Utilisée uniquement comme valeur initiale        |
| Date de création                    | Date de création des préférences                         | Obligatoire | Générée automatiquement                          |
| Date de modification                | Dernière modification                                    | Obligatoire | Mise à jour automatiquement                      |

## Règles métier

- Un utilisateur possède une seule structure de préférences globales.
- Les préférences globales s'appliquent à l'ensemble des routines et des séances de l'utilisateur.
- La modification d'une préférence globale n'altère pas les routines existantes.
- Les valeurs par défaut sont utilisées uniquement lors de la création de nouveaux éléments.
- Une séance conserve les préférences actives au moment de son démarrage.
- Les modifications de préférences prennent effet pour les séances démarrées après leur enregistrement.
- Les préférences sont enregistrées automatiquement après chaque modification.

# 09.10 Entité Catégorie

## Définition

Une **Catégorie** permet de classer les routines afin d'en faciliter l'organisation, le filtrage et la recherche.

L'application fournit une liste de catégories par défaut, que l'utilisateur peut compléter et personnaliser.

## Périmètre

Une catégorie possède directement :

- son identité ;
- son libellé ;
- son apparence ;
- son ordre d'affichage ;
- son état.

Elle ne contient pas directement :

- les routines ;
- les activités ;
- les planifications ;
- les séances.

Les routines référencent zéro, une ou plusieurs catégories.
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

- Une routine peut être associée à zéro, une ou plusieurs catégories.
- Un utilisateur peut créer et personnaliser ses catégories.
- Le nom d’une catégorie est unique pour un même utilisateur.
- Une catégorie peut être utilisée par zéro, une ou plusieurs routines.
- Une catégorie ne peut pas être supprimée tant qu’elle est utilisée par au moins une routine.
- La suppression d’une catégorie n’entraîne jamais la suppression des routines associées.
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

- Une activité de type Exercice peut être associée à zéro, une ou plusieurs zones corporelles.
- Une zone corporelle peut être utilisée par zéro, une ou plusieurs activités.
- Une activité de type Pause ou Récupération ne peut pas être associée à une zone corporelle.
- L’utilisateur peut créer une zone corporelle depuis l’écran de création ou de modification d’une activité.
- Le nom d’une zone corporelle est unique pour un même utilisateur.
- Une zone corporelle utilisée ne peut pas être supprimée ; elle peut être rendue inactive.
- La désactivation d’une zone ne supprime pas son association aux activités existantes.

# 09.12 Règles d’intégrité et de copie

## Objectif

Ce chapitre définit les règles garantissant la cohérence du modèle de données ainsi que le comportement des opérations de copie, de duplication, d'archivage et de suppression.

Ces règles complètent les règles propres à chaque entité.

## Règles d'intégrité

### Identité

- Chaque entité possède un identifiant unique et stable.
- Deux entités distinctes ne peuvent jamais partager le même identifiant.
- Les identifiants sont générés automatiquement par l'application.

### Cohérence des relations

- Toute activité appartient à une seule routine.
- Toute planification appartient à une seule routine.
- Toute séance est rattachée à une seule routine d'origine.
- Toute séance possède exactement un instantané de routine.
- Toute catégorie appartient à un seul utilisateur.
- Toute zone corporelle appartient à un seul utilisateur.

### Cohérence des données

- Une routine exécutable contient au moins une activité.
- Les positions des activités sont uniques et continues dans une même routine.
- Une activité de type **Pause** utilise obligatoirement le mode d'exécution **Durée**.
- Une activité de type **Exercice** possède un mode d'exécution valide.
- Une durée est strictement positive.
- Un nombre de répétitions est strictement positif.
- Une fréquence de planification est supérieure ou égale à 1.

## Duplication d'une routine

La duplication d'une routine :

- crée une nouvelle routine avec un nouvel identifiant ;
- copie les informations générales ;
- copie la structure complète de la routine ;
- copie les activités et les éventuelles pauses associées ;
- conserve les catégories associées ;
- conserve les références vers les médias ;
- **ne copie pas les planifications** ;
- ne copie jamais les séances ;
- ne crée aucun lien entre la routine d'origine et la copie.

## Copie d'une activité

La copie d'une activité :

- crée une nouvelle activité avec un nouvel identifiant ;
- copie toutes les propriétés fonctionnelles ;
- copie l'activité **Pause** liée lorsqu'elle existe ;
- conserve la référence vers le média associé ;
- conserve les zones corporelles associées ;
- devient totalement indépendante de l'activité d'origine.

## Archivage et suppression

### Archivage d'une routine

L'archivage :

- conserve intégralement la routine ;
- conserve les planifications associées ;
- conserve les séances historiques ;
- empêche uniquement son utilisation selon les règles métier définies au chapitre 10.

### Suppression d'une routine

La suppression définitive :

- supprime la routine ;
- supprime ses planifications ;
- supprime ses activités ;
- ne supprime jamais les séances déjà enregistrées ;
- ne supprime jamais les instantanés contenus dans les séances.

## Historique

- L'historique est constitué exclusivement des séances.
- Chaque séance possède son propre instantané de routine.
- Une modification de la routine n'a jamais d'effet sur les séances existantes.
- Une séance reste exploitable même si la routine d'origine est modifiée, archivée ou supprimée.

# 09.13 Cycles de vie

## Objectif

Ce chapitre décrit les différents états que peuvent traverser les principales entités du modèle au cours de leur existence, ainsi que les transitions autorisées entre ces états.

## Cycle de vie d'une routine

```
Création du nom
        │
        ▼
Routine en cours d'édition
        │
        ├───────────────┐
        │               │
        ▼               │
Routine active          │
        │               │
        ├──── Modifier ─┘
        │
        ├──── Dupliquer ─────► Nouvelle routine
        │
        ├──── Archiver ──────► Routine archivée
        │                         │
        │                         ▼
        └──────── Restaurer ◄─────┘
```

### Règles métier

- Une routine est créée dès la validation de son nom.
- Une routine peut rester incomplète pendant son édition.
- Une routine ne peut être exécutée que si elle est exécutable.
- Une routine peut être modifiée à tout moment.
- Une routine archivée n'est plus proposée pour une nouvelle séance.
- Une routine archivée peut être restaurée.
- La duplication crée une nouvelle routine indépendante.

## Cycle de vie d'une activité

```
Création
    │
    ▼
Édition
    │
    ├──── Déplacement
    │
    ├──── Copie ─────► Nouvelle activité
    │
    └──── Suppression
```

### Règles métier

- Une activité appartient toujours à une seule routine.
- Son déplacement recalcule automatiquement les positions.
- Sa copie crée une nouvelle activité indépendante.
- Sa suppression peut être annulée via la snackbar.

## Cycle de vie d'une planification

```
Création
    │
    ▼
Active
    │
    ├──── Désactivation
    │          │
    │          ▼
    │      Inactive
    │          │
    └──────────┘
       Réactivation

Suppression
```

### Règles métier

- Une planification est créée inactive ou active selon le choix de l'utilisateur.
- Une planification inactive n'alimente pas le calendrier.
- Sa suppression ne supprime jamais la routine.

## Cycle de vie d'une séance

```
Création au démarrage
        │
        ▼
En cours
   │        │
   │        ▼
   │    Suspendue
   │        │
   │        ▼
   └────► Reprise
        │
        ├────────► Terminée
        │
        └────────► Abandonnée

                │
                ▼
        Historique
```

### Règles métier

- Une séance est créée uniquement au démarrage effectif d'une routine.
- Une seule séance peut être en cours simultanément.
- Une séance suspendue peut être reprise.
- Une séance terminée ou abandonnée est conservée dans l'historique.
- Une séance historique n'est plus modifiable.

## Cycle de vie d'un média

```
Import
   │
   ▼
Associé à une activité
   │
   ├──── Remplacement
   │
   └──── Suppression de l'association
            │
            ▼
Suppression physique éventuelle
```

### Règles métier

- Un média peut exister sans être associé temporairement pendant son import.
- Un média n'est supprimé physiquement que s'il n'est plus référencé par aucune activité.

## Cycle de vie d'une catégorie

```
Création
    │
    ▼
Active
    │
    ├──── Modification
    │
    ├──── Désactivation
    │          │
    │          ▼
    │      Inactive
    │          │
    └──────────┘
       Réactivation

Suppression
```

### Règles métier

- Une catégorie peut être créée par l'utilisateur.
- Une catégorie inactive n'est plus proposée lors de la création ou de la modification d'une routine.
- Une catégorie utilisée par au moins une routine ne peut pas être supprimée.
- Une catégorie inactive reste associée aux routines qui l'utilisent déjà.

## Cycle de vie d'une zone corporelle

```
Création
    │
    ▼
Active
    │
    ├──── Modification
    │
    ├──── Désactivation
    │          │
    │          ▼
    │      Inactive
    │          │
    └──────────┘
       Réactivation

Suppression
```

### Règles métier

- Une zone corporelle peut être créée par l'utilisateur.
- Une zone inactive n'est plus proposée lors de la création ou de la modification d'une activité.
- Une zone utilisée par au moins une activité ne peut pas être supprimée.
- Une zone inactive reste associée aux activités existantes.

