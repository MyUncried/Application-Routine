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
- sa structure (cycles, Tours et activités) ;
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

Un **Cycle** est conservé comme structure technique unique de la Composition. Il ordonne les Activités placées avant le Tour, le Tour unique et les Activités placées après le Tour. Dans le MVP, son nombre de répétitions vaut toujours `1`, il n’est pas modifiable et n’est jamais affiché à l’utilisateur.
## Tour

Un **Tour** est un groupe ordonné d'Activités exécuté intégralement un nombre défini de fois.
Il est toujours contenu dans un cycle.
Un Tour possède un nombre de répétitions propre, supérieur ou égal à 1.
## Activité

Une **activité** représente une action élémentaire exécutée pendant une séance.

Il existe deux types d'activités :
- **Exercice** ;
- **Récupération**.

Une activité de type **Exercice** possède un nombre de **Séries** propre, supérieur ou égal à 1.

Une Série correspond à une réalisation de l'Exercice selon son mode d'exécution (**Durée**, **Répétitions** ou **À l’échec**), suivie de sa pause éventuelle. La Série n'est pas un conteneur structurel de la Séance et ne constitue pas une entité métier autonome.

Chaque activité possède notamment :
- un nom ;
- un mode d'exécution ;
- une durée cible, un nombre de répétitions cible ou aucune cible chiffrée en mode À l’échec ;
- un nombre de Séries ;
- une pause facultative appliquée après chaque Série ;
- une consigne facultative ;
- une ou plusieurs zones corporelles facultatives pour les Exercices ;
- aucun média fonctionnel dans le MVP ; le modèle autorise `0..n` médias ordonnés par Activité en V2.

Après la dernière Série, la pause n'est pas exécutée si l'étape suivante du plan d'exécution est une Activité de type **Récupération** explicite.
## Routine

Une routine est une **planification d'une séance**.

Elle définit :
- la séance concernée ;
- sa date de début ;
- son heure d'exécution ;
- son mode de planification affiché : `Aucune` ou `Périodique` ;
- pour une planification périodique, sa fréquence hebdomadaire, les jours de la semaine concernés et sa date de fin ;
- un rappel éventuel (0 ou 1 maximum) ;

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

Le modèle fonctionnel repose sur une hiérarchie de concepts métier : Séance → Cycle → Tour → Activité. Chaque niveau apporte une responsabilité distincte.

Une séance comprend, dans l'ordre :
1. un Compte à rebours initial ;
2. un **Cycle technique unique**, fixé à une répétition ;
3. zéro, une ou plusieurs Activités avant le Tour ;
4. un **Tour unique**, contenant zéro, une ou plusieurs Activités et répété de 1 à 99 fois ;
5. zéro, une ou plusieurs Activités après le Tour ;
6. une Fin de séance.

Dans le Plan d’Exécution, ces phases sont typées `INITIAL_COUNTDOWN`, `EXERCISE`, `RECOVERY` et `SESSION_END`. La fin de la dernière Activité active `SESSION_END` ; seule l’expiration de cette phase, immédiate lorsque sa durée vaut `0 s`, termine l’Exécution et autorise son enregistrement final. Elle ouvre ensuite la fin minimale dans T03, puis la Synthèse lorsque cette dernière est livrée.

Le compte à rebours initial et la fin de séance sont des éléments structurels obligatoires et ne constituent pas des Activités. Leur durée peut être égale à 0 s.

Le modèle distingue trois mesures temporelles. La **Durée synthétique des Activités**, utilisée dans le Catalogue et la synthèse du Tour de la Composition, développe les occurrences d’Activités mais exclut le Compte à rebours initial et la Fin de séance. La **Durée estimée d’exécution**, utilisée pendant l’Exécution, couvre le Plan complet et inclut ces deux phases structurelles. Le **temps total écoulé** et la **Durée réelle** couvrent toutes les phases effectivement exécutées, y compris ces deux phases, mais excluent les Pauses déclenchées manuellement par l’utilisateur.

Le **Cycle** contient un **Tour unique** et peut également contenir des Activités ordonnées avant et après ce Tour. Sa répétition est fixée à `1` dans le MVP.

Le **Tour** possède également son propre nombre de répétitions.

Chaque **Tour** regroupe une suite ordonnée d'Activités. Les Activités placées hors du Tour sont exécutées une seule fois, avant ou après les répétitions du Tour selon leur position.

Une **activité** est de type :
- **Exercice** ;
- **Récupération**.

Une activité de type **Exercice** possède un nombre de Séries propre et peut intégrer une pause facultative après chaque Série.

Dans le MVP :
- une Séance contient exactement un Cycle technique ;
- ce Cycle contient exactement un Tour ;
- le Cycle est exécuté une seule fois et n’est jamais exposé dans l’interface ;
- le nombre de répétitions du Tour reste configurable de 1 à 99.

L'ordre général d'exécution est le suivant :

```
Compte à rebours initial

Cycle technique × 1 — non affiché
├── Activité avant le Tour
├── Tour × N
│      ├── Activité
│      ├── Activité
│      └── Activité
└── Activité après le Tour
```

Le déroulement d'un cycle est donc :

```
Exécuter une fois le Cycle technique :

    Exécuter les Activités placées avant le Tour
    Répéter N fois le Tour et ses Activités
    Exécuter les Activités placées après le Tour
```

Cette organisation permet de construire des séances simples comme des séances complexes tout en conservant un nombre limité de concepts métier.

Dans l’interface de Composition, un appui long sur la carte d’une Activité amorce son déplacement. L’état soulevé est transitoire et ne modifie aucune donnée ; seule la dépose à une position valide déclenche la mise à jour de la position structurelle et de l’ordre. Un toucher court conserve l’ouverture de l’Activité en modification.

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
- les Tours et cycles en cours.

Le guidage sonore peut comprendre :

- une annonce vocale du nom de chaque activité au début de son exécution ;
- un bip grave pendant les exercices chronométrés ;
- un bip aigu pendant les trois dernières secondes de toute étape chronométrée.

Les annonces vocales, les bips et les vibrations fonctionnelles de séance peuvent être activés ou désactivés indépendamment selon les préférences de l'utilisateur. Le retour haptique d'interface produit par les roulettes numériques est distinct de ces vibrations fonctionnelles : il est systématique et n'est pas piloté par la préférence `Vibrations`.

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
- organiser les Activités dans le Tour et définir les nombres de répétitions du Tour et du Cycle ;
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

# 4.9 Extension validée du modèle

L’Activité possède deux formes distinctes : la **référence autonome** de V2 et la **copie de Séance**. L’ajout d’une référence copie toutes ses propriétés métier et ses associations média ; la position avant, dans ou après le Tour appartient uniquement à la copie. Aucune modification ne se propage ensuite entre ces objets.

Un Exercice accepte `Durée`, `Répétitions` ou `À l’échec`. Le troisième mode ne porte ni durée cible ni répétitions cibles. Récupération reste chronométrée et n’expose pas ce segment.

Le Média est un actif local immuable associé par une relation ordonnée à `0..n` Activités. Plusieurs associations peuvent référencer le même fichier sans duplication physique. Une suppression d’association ou de référence ne supprime le fichier que lorsqu’aucune entité ni aucun instantané ne le référence.

Le Circuit est une racine persistante V2 possédant nom, couleur, mode de transition et liste ordonnée d’Étapes de Circuit. Chaque étape référence une Séance ; une même Séance peut apparaître plusieurs fois. Le Circuit reflète les modifications de ses Séances jusqu’au lancement, puis l’Exécution de Circuit utilise un instantané immuable.
