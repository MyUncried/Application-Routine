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
- sa structure (cycles, Sets et activités) ;
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
- de paramètres de planification ;
- de résultats d'exécution.
## Cycle

Un **cycle** est un conteneur composé :
- d'un Set unique ;
- d'un nombre de répétitions ;
- éventuellement d'activités propres au cycle.

À chaque répétition, le Set est exécuté, puis les activités propres au cycle.
## Set

Un **Set** est un ensemble ordonné d'activités exécutées successivement.
Il est toujours contenu dans un cycle.
Un Set possède un nombre de répétitions propre, supérieur ou égal à 1.
## Activité

Une **activité** représente une action élémentaire exécutée pendant une séance.

Il existe deux types d'activités :
- **Exercice** ;
- **Récupération**.

Une activité de type **Exercice** possède un nombre de **Séries** propre, supérieur ou égal à 1.

Une Série correspond à une réalisation de l'Exercice selon son mode d'exécution (**Durée** ou **Répétitions**), suivie de sa pause éventuelle. La Série n'est pas un conteneur structurel de la Séance et ne constitue pas une entité métier autonome.

Chaque activité possède notamment :
- un nom ;
- un mode d'exécution ;
- une durée ou un nombre de répétitions selon le mode ;
- un nombre de Séries ;
- une pause facultative appliquée après chaque Série ;
- une consigne facultative ;
- une ou plusieurs zones corporelles facultatives pour les Exercices ;
- un ou plusieurs médias éventuels.

Après la dernière Série, la pause n'est pas exécutée si l'étape suivante du plan d'exécution est une Activité de type **Récupération** explicite.
## Routine

Une routine est une **planification d'une séance**.

Elle définit :
- la séance concernée ;
- sa date de début ;
- son heure d'exécution ;
- son mode de planification : sans répétition ou périodique ;
- pour une planification périodique, sa fréquence hebdomadaire, les jours de la semaine concernés et sa date de fin ;
- ses rappels éventuels ;

Une routine périodique définit une seule heure d'exécution. Plusieurs exécutions d'une même séance à des horaires différents sont représentées par plusieurs routines distinctes.

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

Les préférences globales regroupent les paramètres personnels utilisés comme valeurs par défaut lors de la création et de l'utilisation des séances et des routines.  
Elles peuvent être modifiées dans le Profil. Leur modification n'altère pas rétroactivement les séances ou routines déjà créées.

Elles comprennent :

**Préférences de création d'une séance :**

- la durée par défaut du compte à rebours initial ;
- le texte vocal par défaut du compte à rebours initial ;
- la durée par défaut de la fin de séance ;
- le texte vocal par défaut de la fin de séance.

**Préférences de planification :**

- les paramètres par défaut des rappels associés aux routines.

**Préférences d'exécution :**

- les sons ;
- les annonces vocales ;
- les vibrations.

Les préférences utilisées comme valeurs par défaut sont copiées dans la séance ou la routine lors de sa création lorsque le paramètre est propre à cet objet. Une modification ultérieure des préférences globales ne modifie donc pas les objets existants.

## Référentiels utilisateur

L'application utilise des référentiels personnalisables permettant à chaque utilisateur d'adapter certains éléments du modèle fonctionnel à ses besoins.

Dans le MVP, deux référentiels sont disponibles :
- **Catégories**, utilisées pour classer les séances.
- **Zones corporelles**, utilisées pour qualifier les activités de type Exercice.

Les Catégories sont personnalisables par l'utilisateur. Les Zones corporelles constituent en revanche un référentiel prédéfini dans le MVP : elles peuvent être sélectionnées pour les Exercices mais ne peuvent pas être créées, renommées ou supprimées par l'utilisateur.

# 4.4 Structure d'une séance

Le modèle fonctionnel repose sur une hiérarchie de concepts métier : Séance → Cycle → Set → Activité. Chaque niveau apporte une responsabilité distincte.

Une séance comprend, dans l'ordre :
1. un compte à rebours initial ;
2. un **Cycle unique** ;
3. des activités de fin de séance facultatives ;
4. une fin de séance.

Le compte à rebours initial et la fin de séance sont des éléments structurels obligatoires et ne constituent pas des Activités. Leur durée peut être égale à 0 s.

Le **Cycle** est composé :
- d'un **Set unique** ;
- d'un nombre de répétitions propre ;
- éventuellement d'une ou plusieurs activités propres au Cycle, exécutées après chaque répétition du Set.

Le **Set** possède également son propre nombre de répétitions.

Chaque **Set** regroupe une suite ordonnée d'activités.

Une **activité** est de type :
- **Exercice** ;
- **Récupération**.

Une activité de type **Exercice** possède un nombre de Séries propre et peut intégrer une pause facultative après chaque Série.

Par défaut :
- une séance contient un cycle ;
- un cycle contient un Set ;
- un cycle est exécuté une seule fois.

L'ordre général d'exécution est le suivant :

```
Compte à rebours initial

Cycle × N
│
├── Set
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

    Exécuter le Set

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
- les Sets et cycles en cours.

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
- organiser les Activités dans le Set et définir les nombres de répétitions du Set et du Cycle ;
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
