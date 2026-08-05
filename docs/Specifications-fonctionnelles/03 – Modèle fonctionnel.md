## 3.1 Objectif

Ce chapitre présente le modèle fonctionnel de l'application et les principaux concepts métier qui la composent.

Il décrit le fonctionnement général de l'application du point de vue de l'utilisateur et du métier, sans détailler le modèle de données, les écrans ou l'implémentation technique.

Les structures de données, attributs et relations entre les objets sont décrits dans le chapitre **09 – Modèle de données fonctionnel**.

# 3.2 Principes de conception

Le modèle fonctionnel repose sur les principes suivants :

- permettre la création rapide d'une routine simple ;
- conserver une grande souplesse pour construire des routines plus élaborées ;
- distinguer clairement la définition d'une routine de son exécution ;
- garantir la conservation fidèle de l'historique des séances ;
- privilégier des concepts simples et peu nombreux ;
- préparer l'évolution vers des fonctionnalités collaboratives sans remettre en cause le modèle existant.

# 3.3 Concepts métier

Le fonctionnement de l'application repose sur six concepts principaux.

## Utilisateur

L'utilisateur est propriétaire de l'ensemble de ses données.

Il possède notamment :

- ses routines ;
- ses planifications ;
- ses catégories ;
- ses zones corporelles ;
- ses préférences globales ;
- son historique de séances.

Dans le MVP, l'application fonctionne avec un utilisateur local unique.

## Routine

La routine constitue le modèle de référence d'une séance.

Elle décrit :

- les activités à réaliser ;
- leur ordre d'exécution ;
- leur organisation ;
- leurs paramètres d'exécution ;
- leurs catégories.

Une routine peut être :

- créée ;
- modifiée ;
- dupliquée ;
- planifiée ;
- archivée ;
- exécutée.

Elle ne contient jamais les résultats d'une exécution.

## Activité

Une activité représente une action élémentaire exécutée pendant une routine.

Selon son rôle, elle peut correspondre à :

- un exercice ;
- une pause ;
- une récupération.

Chaque activité possède ses propres paramètres :

- nom ;
- consigne ;
- durée ou répétitions ;
- média éventuel ;
- zones corporelles (pour les exercices).

## Planification

Une planification définit le moment auquel une routine doit être exécutée.

Elle peut être :

- unique ;
- récurrente.

Une même routine peut posséder plusieurs planifications.

La planification représente une intention d'exécution, mais ne constitue pas une séance.

La planification fait partie du modèle fonctionnel afin de préparer les évolutions futures, mais elle n'est pas exposée dans l'interface utilisateur de la V1.

## Séance

La séance représente l'exécution réelle d'une routine.

Elle est créée au démarrage d'une routine.

Elle conserve :

- un instantané de la routine ;
- les informations de déroulement ;
- les résultats de l'exécution.

Chaque séance est indépendante de l'évolution ultérieure de la routine.

## Préférences globales

Les préférences globales regroupent les paramètres personnels utilisés par défaut lors de la création de nouvelles routines.

Elles concernent notamment :

- les valeurs par défaut ;
- les paramètres sonores ;
- les annonces vocales ;
- les comportements généraux de l'application.

# Référentiels utilisateur

L'application utilise des référentiels personnalisables permettant à chaque utilisateur d'adapter certains éléments du modèle fonctionnel à ses besoins.

Dans le MVP, deux référentiels sont disponibles :

- **Catégories**, utilisées pour classer les routines.
- **Zones corporelles**, utilisées pour qualifier les activités de type Exercice.

Ces référentiels sont indépendants des routines et des activités. Ils peuvent être enrichis, modifiés, désactivés ou supprimés par l'utilisateur, sous réserve des règles d'intégrité définies dans le modèle de données.

# 3.4 Structure d'une routine

Une routine est organisée selon une structure hiérarchique simple.

Elle peut comprendre, dans l'ordre :

1. un compte à rebours initial ;
2. une succession d'activités ;
3. une organisation en séries ;
4. une organisation en cycles ;
5. des activités exécutées en fin de routine.

Une routine simple possède naturellement :

- une série ;
- un cycle.

Leur nombre de répétitions est égal à **1** par défaut.

Les séries et les cycles ne constituent pas des objets métier indépendants. Ils servent uniquement à organiser les répétitions des activités.

L'ordre général d'exécution est le suivant :

```
Compte à rebours initial

Cycle × N
    Série × M
        Activités
    Activités de fin de cycle

Activités de fin de routine
```

Cette organisation permet de construire aussi bien une routine très simple qu'une routine complexe sans modifier les concepts fondamentaux.

# 3.5 Déroulement d'une séance

Lorsqu'une séance est démarrée :

1. un instantané de la routine est créé ;
2. le moteur construit le plan d'exécution ;
3. les activités sont exécutées dans l'ordre prévu ;
4. les informations d'exécution sont enregistrées ;
5. les résultats sont sauvegardés.

Le plan d'exécution constitue une structure interne générée automatiquement au démarrage de chaque séance.

Il n'est jamais manipulé directement par l'utilisateur.

# 3.6 Guidage de l'utilisateur

Pendant une séance, l'application accompagne l'utilisateur grâce à différents mécanismes de guidage.

Elle affiche notamment :

- l'activité en cours ;
- l'activité suivante ;
- le temps restant ou écoulé ;
- la progression dans la séance ;
- les séries et cycles en cours.

Le guidage sonore peut comprendre :

- une annonce vocale du nom de chaque activité au début de son exécution ;
- un bip grave pendant les exercices chronométrés ;
- un bip aigu pendant les trois dernières secondes de toute étape chronométrée.

Les annonces vocales, les bips et les vibrations peuvent être activés ou désactivés indépendamment selon les préférences de l'utilisateur.

# 3.7 Historisation

L'application distingue systématiquement :

- la définition d'une routine ;
- son exécution réelle.

Chaque séance conserve son propre instantané de la routine exécutée.

Ainsi :

- une modification d'une routine n'affecte jamais les séances passées ;
- les données prévues restent distinctes des données réellement exécutées ;
- l'historique demeure fidèle à ce qui s'est réellement déroulé.

# 3.8 Périmètre du MVP

La première version permet notamment :

- créer, modifier, dupliquer, archiver et supprimer des routines ;
- créer et modifier des activités ;
- organiser les activités à l'aide de séries et de cycles ;
- associer plusieurs catégories à une routine ;
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
- planifier une routine ;
- exceptions de planification ;
- notifications avancées ;
- intelligence artificielle.
