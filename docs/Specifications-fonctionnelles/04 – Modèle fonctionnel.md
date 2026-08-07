# 4.1 Objectif

Ce chapitre présente le modèle fonctionnel de l'application et les principaux concepts métier qui la composent.

Il décrit le fonctionnement général de l'application du point de vue de l'utilisateur et du métier, sans détailler le modèle de données, les écrans ou l'implémentation technique.

Les structures de données, attributs et relations entre les objets sont décrits dans le chapitre **09 – Modèle de données fonctionnel**.

# 4.2 Principes de conception

Le modèle fonctionnel repose sur les principes suivants :

- permettre la création rapide d'une séance simple ;
- conserver une grande souplesse pour construire des séances plus élaborées ;
- distinguer clairement la séance (contenu), la routine (planification) et l'exécution de la séance ;
- garantir la conservation fidèle de l'historique des séances ;
- privilégier des concepts simples et peu nombreux ;
- préparer l'évolution vers des fonctionnalités collaboratives sans remettre en cause le modèle existant.

# 4.3 Concepts métier

Le fonctionnement de l'application repose sur six concepts principaux.
## Utilisateur

L'utilisateur est propriétaire de l'ensemble de ses données.
Il possède notamment :
- ses séances ;
- ses routines ;
- ses catégories ;
- ses zones corporelles ;
- ses préférences globales ;
- son historique d'exécution.

Dans le MVP, l'application fonctionne avec un utilisateur local unique.
## Séance

La **séance** constitue le contenu d'un entraînement.

Elle définit :
- son nom ;
- sa couleur ;
- ses catégories ;
- sa structure (cycles, blocs et activités) ;
- ses paramètres généraux ;
- les règles de guidage.

Une séance peut être :
- créée ;
- modifiée ;
- dupliquée ;
- archivée ;
- exécutée ;
- planifiée par une ou plusieurs routines.

Une séance ne contient jamais :
- de date ;
- d'heure ;
- de récurrence ;
- de résultats d'exécution.
## Cycle

Un **cycle** est un conteneur composé :
- d'un bloc unique ;
- d'un nombre de répétitions ;
- éventuellement d'activités propres au cycle.

À chaque répétition, le bloc est exécuté, puis les activités propres au cycle.
## Bloc

Un **bloc** est un ensemble ordonné d'activités exécutées successivement.
Il est toujours contenu dans un cycle.
Un bloc ne possède pas de nombre de répétitions propre : celui-ci est défini par le cycle qui le contient.
## Activité

Une **activité** représente une action élémentaire exécutée pendant une séance.

Il existe deux types d'activités :
- **Exercice** ;
- **Récupération**.

Une activité de type **Exercice** peut intégrer une pause facultative après son exécution.
Chaque activité possède notamment :
- un nom ;
- une consigne ;
- un mode d'exécution (durée, répétitions ou manuel) ;
- un ou plusieurs médias ;
- une ou plusieurs zones corporelles (pour les exercices).
## Routine

Une routine est une **planification d'une séance**.

Elle définit :

- la séance concernée ;
- sa date de début ;
- son heure ;
- sa fréquence ;
- sa récurrence ;
- ses rappels éventuels ;
- son état (active ou inactive).

Une routine ne contient jamais le contenu d'une séance.

Une même séance peut être associée à plusieurs routines.
## Exécution de séance

Une exécution de séance représente la réalisation effective d'une séance.

Elle est créée :
- lors du lancement manuel d'une séance ;
- ou lors du démarrage d'une routine.

Elle conserve notamment :
- **l'instantané de la séance exécutée** ;
- la routine éventuellement utilisée ;
- les informations de déroulement ;
- les résultats de l'exécution.

Chaque exécution est indépendante des modifications ultérieures de la séance ou de la routine.
## Préférences globales

Les préférences globales regroupent les paramètres personnels utilisés par défaut lors de la création de nouvelles routines.

Elles concernent notamment :
- les valeurs par défaut ;
- les paramètres sonores ;
- les annonces vocales ;
- les comportements généraux de l'application.

## Référentiels utilisateur

L'application utilise des référentiels personnalisables permettant à chaque utilisateur d'adapter certains éléments du modèle fonctionnel à ses besoins.

Dans le MVP, deux référentiels sont disponibles :
- **Catégories**, utilisées pour classer les séances.
- **Zones corporelles**, utilisées pour qualifier les activités de type Exercice.

Ces référentiels sont indépendants des routines et des activités. Ils peuvent être enrichis, modifiés, désactivés ou supprimés par l'utilisateur, sous réserve des règles d'intégrité définies dans le modèle de données.

# 4.4 Structure d'une séance

Le modèle fonctionnel repose sur une hiérarchie de concepts métier : Séance → Cycle → Bloc → Activité. Chaque niveau apporte une responsabilité distincte.

Une séance peut comprendre, dans l'ordre :
1. un compte à rebours initial (facultatif) ;
2. un ou plusieurs **cycles** ;
3. des activités de fin de séance (facultatives).

Chaque **cycle** est composé :
- d'un **bloc** unique ;
- d'un nombre de répétitions ;
- éventuellement d'une ou plusieurs activités propres au cycle, exécutées après chaque répétition du bloc.

Chaque **bloc** regroupe une suite ordonnée d'activités.

Une **activité** est de type :
- **Exercice** ;
- **Récupération**.

Une activité de type **Exercice** peut intégrer une pause facultative après son exécution.

Par défaut :
- une séance contient un cycle ;
- un cycle contient un bloc ;
- un cycle est exécuté une seule fois.

L'ordre général d'exécution est le suivant :

```
Compte à rebours initial

Cycle × N
│
├── Bloc
│      ├── Activité
│      ├── Activité
│      └── Activité
│
└── Activités de fin de cycle

Activités de fin de séance
```

Le déroulement d'un cycle est donc :

```
Répéter N fois :

    Exécuter le bloc

    Exécuter les activités de fin de cycle
```

Cette organisation permet de construire des séances simples comme des séances complexes tout en conservant un nombre limité de concepts métier.

# 4.5 Déroulement d'une séance

Lorsqu'une séance est démarrée :

1. un instantané de la séance est créé ;
2. le moteur construit le plan d'exécution ;
3. les activités sont exécutées dans l'ordre prévu ;
4. les informations d'exécution sont enregistrées ;
5. les résultats sont sauvegardés.

Le plan d'exécution constitue une structure interne générée automatiquement au démarrage de chaque séance.

Il n'est jamais manipulé directement par l'utilisateur.

# 4.6 Guidage de l'utilisateur

Pendant une séance, l'application accompagne l'utilisateur grâce à différents mécanismes de guidage.

Elle affiche notamment :

- l'activité en cours ;
- l'activité suivante ;
- le temps restant ou écoulé ;
- la progression dans la séance ;
- les blocs et cycles en cours.

Le guidage sonore peut comprendre :

- une annonce vocale du nom de chaque activité au début de son exécution ;
- un bip grave pendant les exercices chronométrés ;
- un bip aigu pendant les trois dernières secondes de toute étape chronométrée.

Les annonces vocales, les bips et les vibrations peuvent être activés ou désactivés indépendamment selon les préférences de l'utilisateur.

La couleur de la séance peut être utilisée pour faciliter son identification dans les différents écrans de l'application.

# 4.7 Historisation

L'application distingue systématiquement :

- la définition d'une séance ;
- son exécution réelle.

Chaque exécution conserve son propre instantané de la séance exécutée.

Ainsi :

- une modification d'une routine n'affecte jamais les séances passées ;
- les données prévues restent distinctes des données réellement exécutées ;
- l'historique demeure fidèle à ce qui s'est réellement déroulé.

# 4.8 Périmètre du MVP

La première version permet notamment :

- créer, modifier, dupliquer, archiver et supprimer des séances ;
- créer, modifier et supprimer des routines de planification ;
- créer et modifier des activités ;
- organiser les activités en blocs et cycles ;
- associer plusieurs catégories à une séance ;
- associer des zones corporelles aux exercices ;
- exécuter une séance ;
- suspendre puis reprendre une séance ;
- consulter l'historique des séances ;
- personnaliser les préférences globales.

Ne sont pas inclus dans le MVP :

- synchronisation cloud ;
- partage de routines ;
- communautés ;
- comptes multi-utilisateurs ;
- relation avec un professionnel de santé ;
- exceptions de planification ;
- notifications avancées ;
- intelligence artificielle.
