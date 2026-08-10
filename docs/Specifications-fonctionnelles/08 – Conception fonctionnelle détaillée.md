# 1. Principes généraux

## 1.1 Objectif du document

Ce document décrit le fonctionnement détaillé des principales fonctionnalités du MVP.
Il complète les parcours utilisateur, les wireframes, le modèle de données fonctionnel et les règles métier en précisant le comportement attendu de l'application lors de son utilisation.
Il constitue la référence fonctionnelle utilisée pour le développement.

## 1.2 Périmètre

Ce document décrit :
- le comportement détaillé des fonctionnalités du MVP ;
- les interactions entre les différents écrans ;
- les comportements attendus lors des actions de l'utilisateur ;
- les règles propres à chaque fonctionnalité.

Il ne décrit pas :
- les parcours utilisateur ;
- la navigation entre les écrans ;
- le modèle de données ;
- les règles métier transverses ;
- les choix techniques d'implémentation.

## 1.3 Organisation

Le document est organisé selon les principales fonctionnalités du MVP.

Chaque chapitre décrit le fonctionnement détaillé d'une fonctionnalité indépendamment des écrans utilisés.
Lorsqu'une fonctionnalité fait intervenir plusieurs écrans, son comportement est décrit une seule fois dans le présent document.
Les caractéristiques propres à chaque écran restent décrites dans le chapitre **06 – Écrans et navigation de la V1**.
Les champs, contrôles et comportements spécifiques des écrans sont décrits dans les tableaux de spécification placés en annexe.

## 1.4 Documents de référence

Chaque sujet est décrit dans un document unique afin d'éviter toute redondance.

| Sujet                                     | Document de référence                              |
| ----------------------------------------- | -------------------------------------------------- |
| Vision du produit                         | 01 – Vision générale                               |
| Utilisateurs et besoins                   | 02 – Utilisateurs et besoins                       |
| Parcours utilisateur                      | 03 – Parcours utilisateur                          |
| Fonctionnalités                           | 04 – Modèle fonctionnel                            |
| Versions du produit                       | 05 – Versions du produit                           |
| Navigation et écrans                      | 06 – Écrans et navigation de la V1                 |
| Décisions de conception                   | 07 – Registre des décisions                        |
| Comportement détaillé des fonctionnalités | 08 – Conception fonctionnelle détaillée            |
| Modèle de données                         | 09 – Modèle de données fonctionnel                 |
| Règles métier transverses                 | 10 – Processus métier et règles métier transverses |
| API fonctionnelles                        | 11 – API fonctionnelles                            |
| Architecture technique                    | 12 – Architecture technique                        |

## 1.5 Convention de lecture

Les termes utilisés dans ce document sont définis dans le **Glossaire**.

Les captures d'écran et wireframes illustrent les comportements décrits, mais ne constituent pas la référence fonctionnelle.

En cas de divergence entre un wireframe et le présent document, la spécification fonctionnelle prévaut.

## 1.6 Évolutivité

Les comportements décrits correspondent au périmètre du MVP.

Les évolutions prévues pour les versions ultérieures sont décrites dans le chapitre **05 – Versions du produit** et ne sont pas détaillées dans ce document, sauf lorsqu'elles sont nécessaires pour justifier un choix de conception du MVP.

# 2. Cycle de vie d'une séance

## 2.1 Principe général

Une séance constitue le modèle fonctionnel utilisé pour exécuter un entraînement.

Elle est créée une seule fois, peut être modifiée à tout moment, puis utilisée librement pour une exécution immédiate ou pour créer une ou plusieurs routines de planification.

Une séance reste indépendante de ses routines et de ses exécutions.

Les modifications apportées à une séance n'ont aucun effet sur les exécutions déjà réalisées.

## 2.2 Création d'une séance

La création d'une séance se déroule en quatre étapes successives :

1. saisie du nom de la séance et sélection de sa couleur ;
2. composition de la séance (activités, blocs, cycles...) ;
3. sélection des catégories ;
4. retour au catalogue des séances.

À l'issue de cette création, la séance est immédiatement disponible dans le catalogue.

Aucune routine n'est créée automatiquement.

## 2.3 Modification d'une séance

Une séance peut être modifiée à tout moment depuis le catalogue des séances.

Toutes les modifications sont enregistrées automatiquement.

L'utilisateur peut notamment modifier :

- son nom ;
- sa couleur ;
- sa composition ;
- ses activités ;
- ses catégories.

Les modifications sont immédiatement visibles dans le catalogue.

Les routines associées utilisent automatiquement la dernière version de la séance.

Les exécutions déjà enregistrées conservent leur propre instantané.

## 2.4 Duplication d'une séance

Une séance peut être dupliquée afin de créer rapidement une nouvelle variante.

La duplication crée une nouvelle séance indépendante.

La copie reprend :

- le nom de la séance (avec un suffixe à définir) ;
- la couleur ;
- les catégories ;
- l'ensemble de la composition ;
- les paramètres d'exécution.

Les deux séances deviennent totalement indépendantes.

## 2.5 Suppression d'une séance

Une séance peut être supprimée depuis le catalogue.

La suppression est définitive.

Si la séance est utilisée par une ou plusieurs routines, l'application demande une confirmation avant la suppression.

La suppression d'une séance entraîne également la suppression de toutes les routines qui lui sont associées.

Les exécutions déjà enregistrées restent conservées dans l'historique.

## 2.6 Exécution d'une séance

Une séance peut être exécutée :

- directement depuis le catalogue des séances ;
- depuis une routine planifiée.

Au démarrage de l'exécution, un instantané fonctionnel de la séance est enregistré.

Cet instantané est utilisé pour garantir la cohérence de l'historique, même si la séance est ensuite modifiée.

## 2.7 Planification d'une séance

Une séance peut être associée à aucune, une ou plusieurs routines.

Chaque routine possède sa propre planification.

La suppression d'une routine n'a aucun effet sur la séance.

La modification de la séance est automatiquement prise en compte par toutes les routines qui y sont associées.

## 2.8 Historique

Chaque exécution crée un nouvel enregistrement dans le suivi.

L'historique conserve notamment :

- l'instantané de la séance ;
- les temps réalisés ;
- le statut de l'exécution ;
- le ressenti de l'utilisateur.

L'historique n'est jamais modifié par les évolutions ultérieures de la séance.

## 2.9 États d'une séance

Une séance peut se trouver dans l'un des états suivants :

| État        | Description                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| En création | La séance est en cours de définition et n'a pas encore été validée.                                  |
| Disponible  | La séance est disponible dans le catalogue et peut être exécutée ou planifiée.                       |
| Planifiée   | Une ou plusieurs routines utilisent cette séance.                                                    |
| Exécutée    | Au moins une exécution existe dans le suivi.                                                         |
| Supprimée   | La séance n'est plus disponible dans le catalogue. Les exécutions déjà réalisées restent conservées. |
# 3. Composition d'une séance

## 3.1 Principe général

Une séance est constituée d'un ensemble d'activités organisées dans un ordre d'exécution précis.

L'utilisateur construit librement sa séance en ajoutant, modifiant, supprimant ou réorganisant ces activités.

La structure d'une séance est entièrement définie par son contenu. Aucun comportement implicite n'est ajouté automatiquement par l'application.

## 3.2 Structure d'une séance

Une séance est composée, dans l'ordre, des éléments suivants :

1. un compte à rebours initial ;
2. un Cycle unique contenant un Bloc unique ;
3. des activités de fin de séance facultatives ;
4. une fin de séance.

Le Compte à rebours initial et la Fin de séance sont des éléments structurels obligatoires et ne constituent pas des Activités. Leur durée peut être égale à 0 s.

Le compte à rebours initial est exécuté une seule fois au démarrage de la séance.

Les activités de fin de séance sont exécutées une seule fois après la dernière répétition du Cycle et avant la Fin de séance.

Une séance contient obligatoirement un Cycle et un Bloc et doit contenir au minimum une activité de type Exercice pour être exécutable.

## 3.3 Les activités

Une activité représente une étape élémentaire de la séance.

Chaque activité est indépendante des autres.

Une activité possède notamment :

- un type ;
- un nom ;
- une durée ou un nombre de répétitions ;
- une pause optionnelle exécutée immédiatement après l'activité ;
- des informations complémentaires (consigne, zones corporelles, média, etc.).

Les activités sont exécutées dans l'ordre où elles apparaissent dans la séance.

## 3.4 Types d'activités

Le MVP distingue deux types d'activités.
### Exercice

Une activité de type Exercice correspond à une action réalisée par l'utilisateur.

Elle peut être définie :

- par une durée ;
- par un nombre de répétitions.

Elle peut être associée à une ou plusieurs zones corporelles.

### Récupération

Une activité de type Récupération correspond à une période de repos chronométrée.

Elle est définie uniquement par une durée.

Elle ne possède ni répétitions, ni zones corporelles.

## 3.5 Blocs

Un bloc est un conteneur regroupant plusieurs activités exécutées dans un ordre déterminé.

Dans le MVP, chaque cycle contient un seul bloc.

Les activités d'un bloc peuvent être réorganisées librement.

Le bloc constitue principalement un élément fonctionnel de structuration. Son maintien dans le vocabulaire visible par l'utilisateur pourra être réévalué ultérieurement.

## 3.6 Cycles

Un cycle permet de répéter un bloc un nombre défini de fois.

Dans le MVP :
- une Séance contient exactement un Cycle ;
- le Cycle contient exactement un Bloc ;
- le Cycle possède son propre nombre de répétitions ;
- le Bloc possède son propre nombre de répétitions ;
- à chaque répétition du Cycle, le Bloc est exécuté selon son nombre de répétitions, puis les éventuelles Activités propres au Cycle sont exécutées.

Dans une version ultérieure, une Séance pourra comporter plusieurs Cycles et un Cycle pourra comporter plusieurs Blocs.
## 3.7 Réorganisation

Les activités peuvent être :

- ajoutées ;
- supprimées ;
- dupliquées ;
- déplacées.

Leur ordre d'exécution correspond toujours à leur position dans la séance.

La réorganisation est enregistrée automatiquement.

## 3.8 Validation

Une séance est considérée comme valide lorsqu'elle contient au minimum une activité de type Exercice.

Une activité est valide lorsque toutes les informations obligatoires correspondant à son type sont renseignées.

Les activités incomplètes sont signalées à l'utilisateur.

Une séance incomplète peut être enregistrée mais ne peut pas être exécutée.

## 3.9 Estimation

À chaque modification, l'application recalcule automatiquement :

- la durée estimée de la séance ;
- le nombre total d'activités ;
- le nombre total de cycles.

Ces informations sont affichées en temps réel.

## 3.10 Principes de conception

La composition d'une séance repose sur les principes suivants :

- chaque activité est indépendante ;
- aucune activité n'est créée automatiquement ;
- aucune récupération n'est ajoutée implicitement ;
- l'utilisateur garde en permanence la maîtrise complète de la structure de sa séance ;
- les modifications sont enregistrées automatiquement ;
- toute séance peut être modifiée ultérieurement sans impact sur les exécutions déjà enregistrées.

# 4. Exécution d'une séance

## 4.1 Principe général

L'exécution d'une séance consiste à guider l'utilisateur à travers l'ensemble des activités qui composent la séance, dans l'ordre défini lors de sa création.

Avant le démarrage effectif de la séance, un instantané fonctionnel de la séance est enregistré. Cet instantané est utilisé pour garantir la cohérence de l'historique, même si la séance est modifiée ultérieurement.

Pendant toute l'exécution, l'application calcule en temps réel la progression de la séance, le temps écoulé et le temps restant.

## 4.2 Démarrage d'une séance

Une séance peut être démarrée :

- depuis le catalogue des séances ;
- depuis une routine planifiée.

Avant de lancer la première activité, l'application :

- crée un instantané de la séance ;
- initialise les indicateurs de progression ;
- démarre le compte à rebours initial, lorsqu'il est défini.

En l'absence de compte à rebours initial, la première activité débute immédiatement.

## 4.3 Déroulement

Les activités sont exécutées dans l'ordre défini dans la séance.

Chaque activité est exécutée intégralement avant le passage à la suivante.

Les cycles répètent automatiquement leur bloc jusqu'à atteindre le nombre de répétitions défini.

Les activités de fin de séance sont exécutées une seule fois après le dernier cycle.

Lorsque la dernière activité est terminée, la séance est considérée comme terminée.

## 4.4 Informations affichées

Pendant toute l'exécution, l'utilisateur visualise notamment :

- le nom de l'activité en cours ;
- le temps restant de l'activité ou le nombre de répétitions ;
- le temps total écoulé ;
- la durée totale estimée de la séance ;
- la progression dans les blocs et les cycles ;
- la prochaine activité.

Ces informations sont mises à jour en temps réel.

## 4.5 Actions disponibles

Pendant l'exécution, l'utilisateur peut :

- réinitialiser l'activité en cours ;
- mettre la séance en pause ;
- passer à l'activité suivante.

Toutes les autres informations sont consultatives.

## 4.6 Réinitialisation d'une activité

L'utilisateur peut décider de recommencer l'activité en cours depuis son début.

Lorsque cette action est demandée, l'application affiche une demande de confirmation.

Si l'utilisateur confirme :

- l'activité en cours est immédiatement réinitialisée ;
- son chronomètre repart de son état initial ;
- les répétitions éventuellement réalisées sont annulées ;
- la progression générale de la séance est conservée.

Si l'utilisateur annule, la séance reprend exactement à l'état où elle se trouvait.

Je pense également qu'il faut être cohérent avec les autres actions :

- **Réinitialiser** → confirmation (évite une perte de progression sur l'activité).
- **Activité suivante** → confirmation (évite de sauter une activité par erreur).
- **Pause** → aucune confirmation (action réversible).
- **Terminer la séance** → confirmation (via le modal de pause).

Cette logique est homogène et protège uniquement les actions ayant un impact irréversible sur la progression.

## 4.7 Passage à l'activité suivante

L'utilisateur peut interrompre l'activité en cours pour passer directement à l'activité suivante.

Une confirmation est systématiquement demandée.

Le statut de l'activité dépend de son mode d'exécution :

- si l'activité est chronométrée et interrompue avant la fin de sa durée, elle est enregistrée comme **Partielle** ;
- si l'Activité est définie par un nombre de répétitions, elle est considérée comme **Réalisée** lorsque l'utilisateur touche `Terminé`.

Après confirmation, la séance se poursuit normalement avec l'activité suivante.

## 4.8 Mise en pause

La mise en pause suspend immédiatement :

- le chronomètre ;
- les annonces vocales ;
- les signaux sonores ;
- la progression automatique.

La séance conserve exactement son état.

Depuis l'écran de pause, l'utilisateur peut :

- reprendre la séance ;
- arrêter la séance.

## 4.9 Reprise

La reprise restaure immédiatement l'état exact de la séance au moment de sa mise en pause.

L'activité reprend avec le temps restant.

Les indicateurs de progression sont conservés.

## 4.10 Arrêt anticipé

L'arrêt anticipé est uniquement accessible depuis l'écran de pause.

Lorsque l'utilisateur confirme cet arrêt :

- l'exécution est interrompue ;
- les informations déjà enregistrées sont conservées ;
- la séance est enregistrée dans l'historique avec le statut **Interrompue** ;
- l'écran de synthèse est affiché.

Les activités restantes ne sont pas exécutées.
### Pause prolongée

Lorsqu'une Séance reste en pause pendant au moins 30 minutes consécutives, l'application demande à l'utilisateur s'il souhaite poursuivre l'Exécution.

L'utilisateur peut :

- reprendre la séance ;
- arrêter la séance.

En l'absence de réponse, la séance est automatiquement interrompue et enregistrée avec le statut **Interrompue**.

La durée de 30 minutes pourra devenir un paramètre utilisateur dans une version ultérieure.

## 4.11 Fin de séance

Lorsque la dernière activité est terminée :

- la séance est enregistrée dans l'historique ;
- son statut est déterminé automatiquement ;
- l'écran de synthèse est affiché.

Le statut de l'exécution est déterminé selon les règles suivantes :

|Statut|Description|
|---|---|
|Terminée|Toutes les activités ont été exécutées jusqu'à leur terme.|
|Partielle|La séance est arrivée à son terme, mais au moins une activité n'a pas été réalisée complètement.|
|Interrompue|L'utilisateur a arrêté la séance avant son terme.|

## 4.12 Historique d'exécution

Chaque exécution enregistre notamment :

- la date et l'heure de début ;
- la durée réelle ;
- le statut de l'exécution ;
- le ressenti de l'utilisateur ;
- l’instantané fonctionnel de la séance ;
- les informations propres à chaque activité exécutée.

Cet instantané est suffisamment complet pour restituer la structure, les paramètres et les libellés de la Séance exécutée, mais il reste volontairement léger. Les médias associés aux Activités ne sont pas copiés dans l’instantané.

Une exécution n'est jamais modifiée après son enregistrement.

## 4.13 Principes de conception

L'exécution d'une séance repose sur les principes suivants :

- une séance s'exécute toujours à partir d'un instantané ;
- les modifications ultérieures d'une séance n'ont aucun impact sur son historique ;
- l'utilisateur peut interrompre ou reprendre une séance à tout moment ;
- chaque activité est enregistrée indépendamment afin de garantir la fidélité de l'historique ;
- les indicateurs de progression sont recalculés automatiquement pendant toute l'exécution.

# 5. Planification d'une routine

## 5.1 Principe général

Une routine est une planification d'une séance.

Elle permet d'associer une séance à une ou plusieurs dates d'exécution selon une fréquence définie par l'utilisateur.

Une même séance peut être associée à aucune, une ou plusieurs routines.

Chaque routine est totalement indépendante des autres, même lorsqu'elles utilisent la même séance.

## 5.2 Création d'une routine

La création d'une routine est réalisée depuis le Calendrier.

Elle se déroule en deux étapes successives :

1. sélection de la séance à planifier ;
2. définition des paramètres de planification.

À l'issue de la validation, la routine est immédiatement créée et activée.

Les occurrences correspondantes deviennent visibles dans le calendrier.

## 5.3 Paramètres de planification

Chaque Routine possède les paramètres suivants :

- la séance associée ;
- la date de début ;
- l'heure d'exécution ;
- le mode de planification :
    - **Sans répétition** : une seule occurrence est planifiée à la date définie ;
    - **Périodique** : la séance est répétée selon une périodicité hebdomadaire ;
- pour une planification périodique :
    - la fréquence en semaines, supérieure ou égale à 1 ;
    - un ou plusieurs jours de la semaine ;
    - une date de fin obligatoire.

La fréquence hebdomadaire définit l’intervalle entre deux semaines d’exécution.  
Exemple : une fréquence de `2` signifie que la Routine est exécutée toutes les deux semaines, uniquement les jours sélectionnés.

Ces paramètres peuvent être modifiés à tout moment.

## 5.4 Modification

Une routine peut être modifiée à tout moment.

Toute modification est immédiatement prise en compte pour les occurrences futures.
Les occurrences déjà exécutées ne sont jamais modifiées.
Le MVP ne permet pas de modifier une occurrence individuellement.
Toute modification s'applique à l'ensemble de la routine.

## 5.5 Calcul des occurrences

Les occurrences sont calculées dynamiquement à partir des paramètres de la routine.
Ce calcul dynamique concerne les occurrences futures. Lorsqu'une occurrence arrive à échéance, elle est historisée avec son résultat afin de conserver la trace des séances exécutées et non exécutées.
Le calendrier calcule uniquement les occurrences correspondant à la période consultée.
Les occurrences ne peuvent pas être modifiées individuellement.
Toute modification de la date de début, de l'heure, de la fréquence hebdomadaire, des jours sélectionnés ou de la date de fin s'applique à l'ensemble de la Routine et recalcule les occurrences futures.

Les détails techniques de ce calcul sont décrits dans le chapitre **12 – Architecture technique**.

## 5.6 Exécution d'une occurrence

Lorsqu'une occurrence est exécutée :
- une nouvelle exécution est créée dans le suivi ;
- la routine reste inchangée ;
- les occurrences futures restent planifiées.

L'exécution d'une occurrence ne modifie jamais la routine.
## 5.7 Suppression

Une Routine peut être supprimée à tout moment.  
Une confirmation est systématiquement demandée.

La suppression d'une Routine :
- met fin au calcul de ses occurrences futures ;
- conserve toutes les occurrences déjà historisées, qu'elles soient `Exécutées` ou `Non exécutées` ;
- ne supprime jamais la Séance associée ;
- ne supprime jamais les Exécutions déjà enregistrées.
## 5.8 Relation avec la séance

Une routine référence toujours une seule séance.
Toute modification apportée à la séance est automatiquement prise en compte par les routines qui lui sont associées.

Les exécutions déjà enregistrées conservent leur propre instantané.

## 5.9 Principes de conception

La planification repose sur les principes suivants :
- une routine ne contient jamais une copie de la séance ;
- une routine référence toujours une séance existante ;
- plusieurs routines peuvent utiliser la même séance ;
- les occurrences ne sont pas modifiables individuellement dans le MVP ;
- l'archivage d'une Séance supprime les Routines qui lui sont associées ;
- la restauration d'une Séance archivée ne recrée ni ne restaure ses anciennes Routines ;
- la suppression d'une routine ne supprime jamais la séance ;
- la suppression d'une séance entraîne la suppression des routines qui lui sont associées ;
- l'historique des exécutions est totalement indépendant des routines.


# 6. Suivi et historique des séances

## 6.1 Principe général

Chaque exécution d'une séance crée un nouvel enregistrement dans l'historique.

Le suivi permet à l'utilisateur de consulter les séances déjà réalisées, leur déroulement et leur résultat.

Chaque exécution est indépendante des autres et reste conservée même si la séance d'origine est ensuite modifiée ou supprimée.

## 6.2 Création d'un historique

Un historique est créé dès le démarrage d'une séance.

Il est basé sur l'instantané enregistré au lancement de l'exécution.

Cet instantané comprend notamment :

- l’identifiant et le nom de la Séance source ;
- sa couleur et ses catégories ;
- le Compte à rebours initial ;
- la structure ordonnée des Cycles, Blocs et Activités ;
- les paramètres fonctionnels nécessaires de chaque Activité ;
- les zones corporelles nécessaires à la consultation et au filtrage de l’historique ;
- la Fin de séance ;
- les paramètres nécessaires à la génération du plan d’exécution.

Les médias ne sont pas copiés dans l’instantané.

L'instantané n'est jamais modifié après sa création.

## 6.3 Informations enregistrées

Chaque historique enregistre notamment :

- la date et l'heure de début ;
- la durée réelle ;
- le statut de l'exécution ;
- le ressenti de l'utilisateur ;
- le détail des activités exécutées ;
- les temps réellement réalisés ;
- les éventuelles interruptions.

Ces informations restent définitivement associées à cette exécution.

## 6.4 Statut d'une exécution

Chaque exécution possède un statut.

Le MVP distingue les statuts suivants :

|Statut|Description|
|---|---|
|Terminée|Toutes les activités ont été réalisées jusqu'à leur terme.|
|Partielle|La séance est arrivée à son terme, mais au moins une activité chronométrée a été interrompue avant la fin de sa durée.|
|Interrompue|La séance a été arrêtée avant la fin de son exécution.|

Le statut est déterminé automatiquement lors de la fin de la séance.

## 6.5 Consultation de l'historique

L'utilisateur peut consulter son historique depuis l'écran **Suivi**.

Les séances exécutées sont présentées sous forme de liste chronologique.

Pour chaque séance, l'utilisateur peut :

- rechercher une séance ;
- filtrer les résultats ;
- modifier le tri ;
- développer ou replier le détail de la séance.

Le détail affiche l'instantané de l'exécution, organisé par cycles et activités.

## 6.6 Recherche

La recherche est effectuée sur :

- le nom de la séance ;
- les catégories ;
- les zones corporelles.

Les résultats sont mis à jour au fur et à mesure de la saisie.

## 6.7 Filtres

L'utilisateur peut combiner plusieurs critères de filtrage :

- catégories ;
- zones corporelles ;
- statut ;
- ressenti.

Les filtres sont appliqués simultanément.

Ils peuvent être réinitialisés à tout moment.

## 6.8 Tri

Le suivi permet de trier les exécutions selon différents critères.

Par défaut, les séances sont triées de la plus récente à la plus ancienne.

Les autres critères de tri pourront évoluer dans les versions futures.

## 6.9 Déploiement du détail

Chaque séance peut être affichée sous deux formes :

- vue condensée ;
- vue développée.

La vue développée présente le détail complet de l'exécution.

L'utilisateur peut développer ou replier individuellement chaque séance.

Une commande permet également de développer ou replier simultanément l'ensemble des séances affichées.

## 6.10 Conservation des historiques

Les historiques sont conservés indépendamment :

- des modifications apportées à une séance ;
- de la suppression d'une routine ;
- de la suppression d'une séance.

Une exécution enregistrée n'est jamais modifiée automatiquement.

## 6.11 Principes de conception

Le suivi repose sur les principes suivants :

- chaque exécution constitue un enregistrement indépendant ;
- chaque historique est construit à partir d'un instantané immuable ;
- les historiques ne sont jamais modifiés par les évolutions ultérieures des séances ;
- le suivi privilégie une consultation rapide grâce à la recherche, aux filtres et au déploiement des détails ;
- les données affichées correspondent toujours à l'état exact de la séance au moment de son exécution.

# Annexe – Tableaux de spécification des écrans

## Catalogue de séances
### Champs affichés

| Élément affiché       | Type              | Visible        | Obligatoire | **Valeur par défaut**            | **Contraintes**                                | Source      | Action                    | Remarques                                       |
| --------------------- | ----------------- | -------------- | ----------- | -------------------------------- | ---------------------------------------------- | ----------- | ------------------------- | ----------------------------------------------- |
| Titre de l'écran      | Texte             | Toujours       | Oui         | "Catalogue de séances"           | Texte fixe                                     | Statique    | Aucune                    |                                                 |
| Bouton Ajouter (+)    | Bouton            | Toujours       | Oui         | Visible                          | Toujours actif                                 | Statique    | Créer une séance          |                                                 |
| Champ Recherche       | Champ texte       | Toujours       | Oui         | Vide                             | 0 à 80 caractères                              | Utilisateur | Filtre la liste           | Recherche instantanée                           |
| Onglet Toutes         | Onglet            | Toujours       | Oui         | Sélectionné                      | Une seule sélection possible                   | Statique    | Filtre                    | Onglet par défaut                               |
| Onglet Planifiées     | Onglet            | Toujours       | Oui         | Non sélectionné                  | Une seule sélection possible                   | Statique    | Filtre                    |                                                 |
| Onglet Archivées      | Onglet            | Toujours       | Oui         | Non sélectionné                  | Une seule sélection possible                   | Statique    | Filtre                    |                                                 |
| Carte Séance          | Carte             | 1 par séance   | Oui         | Repliée                          | Une seule carte déployée à la fois             | Séance      | Déplier / Replier         |                                                 |
| Indicateur de couleur | Indicateur visuel | Toujours       | Oui         | Couleur de la séance             | Une couleur parmi la palette de 16 couleurs    | Séance      | Aucune                    | Facilite l’identification visuelle de la séance |
| Nom de la séance      | Texte             | Toujours       | Oui         | Aucun                            | 1 à 80 caractères                              | Séance      | Ouvrir l'édition          |                                                 |
| Tags catégories       | Badges            | Si renseignés  | Non         | Non affichés                     | Zéro à plusieurs catégories                    | Séance      | Aucune                    | Affichage synthétique selon l’espace disponible |
| Nombre d'étapes       | Texte             | Toujours       | Oui         | Calculé                          | ≥ 1                                            | Calculé     | Aucune                    |                                                 |
| Durée estimée         | Texte             | Toujours       | Oui         | Calculée                         | Affiche "≈" si Exercice en mode Répétition               | Calculée    | Aucune                    |                                                 |
| Nombre de Blocs       | Texte             | Toujours       | Oui         | Calculé                          | ≥ 1                                            | Calculé     | Aucune                    |                                                 |
| Nombre de Cycles      | Texte             | Toujours       | Oui         | Calculé                          | ≥ 1                                            | Calculé     | Aucune                    |                                                 |
| Dernière séance       | Texte             | Si disponible  | Non         | "Aucune"                         | Date relative ("Hier", "Aujourd'hui", etc.)    | Historique  | Aucune                    |                                                 |
| Prochaine séance      | Texte             | Si planifiée   | Non         | "Non planifiée"                  | Date/heure relative                            | Planning    | Aucune                    |                                                 |
| Icône Déplier         | Bouton            | Toujours       | Oui         | Carte repliée                    | Rotation selon l'état                          | Statique    | Déplier / Replier         |                                                 |
| Icône Options (…)     | Bouton            | Toujours       | Oui         | Visible                          | Toujours disponible                            | Statique    | Ouvre le menu             |                                                 |
| Liste des activités   | Liste             | Carte déployée | Oui         | Masquée                          | Ordre de la séance                             | Séance      | Aucune                    |                                                 |
| Nom de l'activité     | Texte             | Carte déployée | Oui         | Aucun                            | 1 à 80 caractères                              | Activité    | Aucune                    |                                                 |
| Durée / Répétitions   | Texte             | Carte déployée | Oui         | Selon le type                    | Durée ou répétitions                 | Activité    | Aucune                    |                                                 |
| Bouton Démarrer       | Bouton            | Carte déployée | Oui         | Activé                           | Désactivé uniquement si la séance est invalide | Statique    | Ouvre l'écran d'exécution | Ne lance pas immédiatement la séance            |
| Barre de navigation   | Navigation        | Toujours       | Oui         | Catalogue de séances sélectionné | 4 onglets fixes                                | Statique    | Navigation                |                                                 |
### Règles fonctionnelles
| Règle                   | Description                                                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chargement              | Les séances sont affichées dès l'ouverture de l'écran.                                                                                                                            |
| Tri par défaut          | Les séances sont triées par date de dernière modification (plus récente en premier).                                                                                              |
| Recherche               | Le filtrage est effectué en temps réel sur le nom de la séance.                                                                                                                   |
| Onglet **Toutes**       | Affiche toutes les séances non archivées.                                                                                                                                         |
| Onglet **Planifiées**   | Affiche uniquement les Séances disposant d'au moins une Routine de planification existante.                                                                                       |
| Onglet **Archivées**    | Affiche uniquement les séances archivées.                                                                                                                                         |
| Carte repliée           | Une séance est affichée sous forme synthétique.                                                                                                                                   |
| Couleur de la séance    | Chaque carte reprend la couleur associée à la séance. Cette couleur peut être affichée sous forme de barre, de bordure ou de repère visuel sans réduire la lisibilité du contenu. |
| Carte déployée          | Affiche la liste des activités et le bouton **Démarrer**.                                                                                                                         |
| Déploiement             | Une seule carte peut être déployée simultanément. L'ouverture d'une carte replie automatiquement la précédente.                                                                   |
| Résumé                  | Le nombre d'activités, la durée estimée, le nombre de Blocs et de Cycles sont calculés automatiquement.                                                                           |
| Exercices en Répétition | Si la Séance contient au moins un Exercice en mode Répétition, la durée estimée est précédée du symbole **≈**, car sa durée théorique n'est pas déterminable.                     |
| Dernière séance         | Affiche la date de la dernière exécution si elle existe, sinon **Aucune**.                                                                                                        |
| Prochaine séance        | Affiche la prochaine occurrence planifiée de la séance ou « Non planifiée » lorsqu'aucune occurrence future n'existe.                                                             |
| Bouton **Démarrer**     | Ouvre l'écran d'exécution. La séance ne démarre qu'après appui sur le bouton **Lecture** de cet écran.                                                                            |
| Bouton **+**            | Ouvre l'écran de création d'une nouvelle séance.                                                                                                                                  |
| Menu **...**            | Donne accès aux actions sur la séance.                                                                                                                                            |
| Modifier                | Ouvre l'écran de modification de la séance.                                                                                                                                       |
| Archiver                | Déplace la séance dans l'onglet **Archivées** après confirmation.                                                                                                                 |
| Restaurer               | Disponible uniquement pour une séance archivée  Replace la séance dans **Toutes**.                                                                                                |
| Supprimer               | Supprime définitivement la séance après confirmation, et les Routines associées, mais conserve les Exécutions historisées.                                                        |
| Suppression             | Impossible à annuler une fois confirmée.                                                                                                                                          |
| Liste vide              | Si aucune séance n'est disponible, un message et un bouton **Créer une séance** sont affichés.                                                                                    |
| Actualisation           | Toute création, modification, archivage, restauration ou suppression met immédiatement la liste à jour.                                                                           |
| Navigation              | Les quatre onglets inférieurs permettent de naviguer entre **Mes séances**, **Calendrier**, **Suivi** et **Profil**.                                                              |

## Nouvelle séance — Saisie du nom et de la couleur

### Éléments affichés

| Élément affiché | Type | Visible | Obligatoire | Valeur par défaut | Contraintes | Source | Action | Remarques |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bouton Retour | Bouton | Toujours | Oui | Visible | Annule la création tant que la séance n’est pas validée | Système | Retour | |
| Titre de l’écran | Texte | Toujours | Oui | « Nouvelle séance » | Texte fixe | Statique | Aucune | En-tête fixe |
| Nom de la séance | Champ texte | Toujours | Oui | Vide | 1 à 80 caractères | Séance | Saisie | Focus initial sur le champ |
| Texte d’aide du nom | Texte | Toujours | Non | « Le nom est obligatoire pour continuer. » | Texte fixe | Statique | Aucune | |
| Libellé Couleur | Texte | Toujours | Oui | « Couleur de la séance » | Texte fixe | Statique | Aucune | |
| Palette de couleurs | Sélecteur | Toujours | Oui | Aucune sélection | Une seule couleur parmi 16 | Séance | Sélectionner | La couleur sélectionnée est entourée et cochée |
| Texte d’aide de la couleur | Texte | Toujours | Non | « Utilisée dans le catalogue, le calendrier et le suivi. » | Texte fixe | Statique | Aucune | |
| Bouton Continuer | Bouton | Toujours | Oui | Désactivé | Activé uniquement si le nom et la couleur sont valides | Statique | Continuer | Ouvre la composition |

### Règles fonctionnelles

| Règle | Description |
| --- | --- |
| Création | La séance n’est créée qu’après validation d’un nom valide et d’une couleur. |
| Nom | Les espaces seuls sont refusés ; les espaces de début et de fin sont supprimés. |
| Couleur | Une seule couleur peut être sélectionnée parmi la palette prédéfinie de 16 couleurs. |
| Sélection obligatoire | Aucune couleur n’est présélectionnée. |
| Continuer | Le bouton reste désactivé tant que le nom ou la couleur ne sont pas renseignés. |
| Validation | Crée la séance avec son nom et sa couleur, puis ouvre l’écran de composition initialisé. |
| Retour | Ne crée aucune séance si les informations n’ont pas été validées. |

## Catégories de la séance

### Éléments affichés

| Élément affiché | Type | Visible | Obligatoire | Valeur par défaut | Contraintes | Source | Action | Remarques |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bouton Retour | Bouton | Toujours | Oui | Visible | Revient à la composition | Système | Retour | |
| Titre de l’écran | Texte | Toujours | Oui | « Catégories de la séance » | Texte fixe | Statique | Aucune | En-tête fixe |
| Texte introductif | Texte | Toujours | Non | « Sélectionnez une ou plusieurs catégories. » | Texte fixe | Statique | Aucune | |
| Catégories proposées | Tags | Toujours | Non | Aucune sélection | Sélection multiple | Catégorie | Sélectionner / Désélectionner | Valeurs par défaut et personnalisées |
| Bouton Créer une catégorie | Bouton | Toujours | Non | Visible | Nom unique par utilisateur | Statique | Créer | Ajoute une catégorie personnalisée |
| Bouton Enregistrer la séance | Bouton | Toujours | Oui | Actif | La séance doit être valide | Statique | Enregistrer | Retourne à Catalogue de séances |

### Règles fonctionnelles

| Règle | Description |
| --- | --- |
| Caractère facultatif | Une séance peut être enregistrée sans catégorie. |
| Sélection multiple | Une séance peut être associée à zéro, une ou plusieurs catégories. |
| Création d’une catégorie | La nouvelle catégorie est ajoutée à la liste et sélectionnée pour la séance en cours. |
| Retour | Revient à la composition sans supprimer la séance ni ses modifications déjà validées. |
| Enregistrement | Enregistre les catégories sélectionnées et ramène à Catalogue de séances. |


## Création / Édition d'une séance

### Eléments affichés

| Élément affiché                                  | Type                   | Visible        | Obligatoire | Valeur par défaut                                 | Contraintes                                            | Source   | Action            | Remarques                                                                   |
| ------------------------------------------------ | ---------------------- | -------------- | ----------- | ------------------------------------------------- | ------------------------------------------------------ | -------- | ----------------- | --------------------------------------------------------------------------- |
| Bouton Retour                                    | Bouton                 | Toujours       | Oui         | Visible                                           | Demande confirmation si modifications non enregistrées | Système  | Retour            |                                                                             |
| Titre de l'écran                                 | Texte                  | Toujours       | Oui         | "Nouvelle séance" ou nom de la séance             | Texte fixe                                             | Séance   | Aucune            |                                                                             |
| Couleur de la séance                             | Indicateur / Sélecteur | Toujours       | Oui         | Couleur enregistrée                               | Une couleur parmi 16                                   | Séance   | Modifier          | Peut être accessible avec la modification du nom                            |
| Résumé (nb blocs / durée)                        | Texte                  | Toujours       | Oui         | Calculé                                           | Mis à jour automatiquement                             | Calculé  | Aucune            | Affiche ≈ si Exercice en mode Répétition                                              |
| Liste des éléments                               | Liste                  | Toujours       | Oui         | Compte à rebours initial + Cycle +  fin de séance | Ordre structurel fixe ; ordre des Activités modifiable | Séance   | Défilement        |                                                                             |
| Compte à rebours initial                         | Carte                  | Toujours       | Oui         | 10 s (profil)                                     | Une seule occurrence                                   | Séance   | Modifier          | 0 s = désactivé                                                             |
| Bouton Options (Compte à rebours)                | Menu                   | Toujours       | Oui         | Visible                                           | Modifier / Supprimer (si durée = 0)                    | Statique | Ouvrir menu       |                                                                             |
| Bouton Ajouter (+)                               | Bouton                 | Selon position | Oui         | Visible                                           | Ajoute un élément à cet emplacement                    | Statique | Ajouter           | Toujours entre deux éléments                                                |
| Cycle                                            | Conteneur              | Toujours       | Oui         | 1                                                 | Exactement 1 dans le MVP                               | Séance   | Déplier / Replier | Présent automatiquement ; non ajoutable et non supprimable                  |
| Compteur Cycle (- / +)                           | Sélecteur              | Toujours       | Oui         | 1                                                 | 1 à 99                                                 | Séance   | Modifier          |                                                                             |
| Bloc                                             | Conteneur              | Toujours       | Oui         | 1                                                 | Exactement 1 dans le MVP                               | Séance   | Déplier / Replier | Présent automatiquement dans le Cycle ; non ajoutable et non supprimable    |
| Compteur Bloc (- / +)                            | Sélecteur              | Toujours       | Oui         | 1                                                 | 1 à 99                                                 | Séance   | Modifier          |                                                                             |
| Activité                                         | Carte                  | Selon contenu  | Oui         | Aucune                                            | Au moins une activité dans une séance valide           | Séance   | Modifier          | Déplaçable                                                                  |
| Nom de l'activité                                | Texte                  | Toujours       | Oui         | Aucun                                             | 1 à 80 caractères                                      | Activité | Modifier          |                                                                             |
| Badge fonctionnel (Échauffement / Retour au calme) | Badge                  | Si renseigné   | Non         | Masqué                                            | Une valeur maximum ; qualification visuelle uniquement, sans création d’un type d’Activité | Activité | Modifier          | |
| Résumé activité                                  | Texte                  | Toujours       | Oui         | Calculé                                           | Durée ou répétitions, nombre de Séries, pause éventuelle | Activité | Modifier          |                                                                             |
| Icône Déplacement                                | Bouton                 | Toujours       | Oui         | Visible                                           | Glisser-déposer                                        | Statique | Déplacer          |                                                                             |
| Bouton Options activité                          | Menu                   | Toujours       | Oui         | Visible                                           | Modifier / Dupliquer / Supprimer                       | Statique | Ouvrir menu       |                                                                             |
| Fin de séance                                    | Carte                  | Toujours       | Oui         | 0 s (Profil)                                      | Une seule occurence                                    | Séance   |                   |                                                                             |
| Bouton Valider / Créer                           | Bouton                 | Toujours       | Oui         | Activé si séance valide                           | Désactivé si erreurs                                   | Statique | Valider           | En création, ouvre les catégories ; en modification, valide les changements |
### Règles fonctionnelles
| Règle                                | Description                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mode de l'écran                      | L'écran fonctionne en mode **Création** ou **Modification**.                                                                                                                                                                                                                                                                      |
| Nom de la séance                     | Saisi sur l’écran précédent lors d’une création ; modifiable sur une séance existante.                                                                                                                                                                                                                                            |
| Couleur de la séance                 | La couleur est préremplie avec la valeur enregistrée et peut être modifiée.                                                                                                                                                                                                                                                       |
| Modification du nom et de la couleur | Toucher le nom ou son action d’édition ouvre l’écran permettant de modifier simultanément le nom et la couleur.                                                                                                                                                                                                                   |
| Création                             | Une nouvelle séance est initialisée avec un Compte à rebours initial, 1 Cycle contenant 1 Bloc vide et une Fin de séance. Le Compte à rebours initial et la Fin de séance sont des éléments obligatoires de la structure de la séance ; ils ne constituent pas des Activités.                                                     |
| Modification                         | Tous les champs sont préremplis avec les valeurs de la séance.                                                                                                                                                                                                                                                                    |
| Compte à rebours initial             | Une seule occurrence autorisée. Une durée de 0 s le désactive sans le masquer.                                                                                                                                                                                                                                                    |
| Fin de séance                        | Une seule occurrence autorisée. Une durée de 0 s la désactive sans la masquer.                                                                                                                                                                                                                                                    |
| Activités                            | Une séance valide doit contenir au moins une activité.                                                                                                                                                                                                                                                                            |
| Cycle                                | La Séance contient exactement un Cycle dans le MVP. Il est créé automatiquement avec la Séance et ne peut être ni ajouté ni supprimé.                                                                                                                                                                                             |
| Bloc                                 | Le Cycle contient exactement un Bloc dans le MVP. Il est créé automatiquement avec le Cycle et ne peut être ni ajouté ni supprimé.                                                                                                                                                                                                |
| Déplacement                          | Les Activités peuvent être réordonnées par glisser-déposer en mode édition dans les zones où leur déplacement est autorisé. Le Cycle et le Bloc sont des éléments structurels fixes dans le MVP et ne peuvent pas être déplacés. Le compte à rebours initial reste en première position et la fin de séance en dernière position. |
| Boutons "+"                          | Ajoutent une Activité à l'emplacement sélectionné. Dans le MVP, ils ne permettent pas d'ajouter un Cycle ou un Bloc.                                                                                                                                                                                                              |
| Déplier / Replier                    | Les conteneurs Cycle et Bloc peuvent être repliés sans modifier leur contenu.                                                                                                                                                                                                                                                     |
| Compteurs Bloc / Cycle               | Les boutons + et − modifient le nombre de répétitions sans modifier le contenu.                                                                                                                                                                                                                                                   |
| Résumé de la séance                  | Le nombre d'activités et la durée estimée sont recalculés automatiquement à chaque modification.                                                                                                                                                                                                                                  |
| Exercices en mode Répétition        | La durée estimée est calculée à partir des Activités chronométrées. Le symbole **≈** est affiché si au moins un Exercice en mode Répétition est présent.                                                                                                                                                                            |
| Suppression d'un élément             | Une confirmation est demandée avant suppression.                                                                                                                                                                                                                                                                                  |
| Suppression du dernier exercice      | Interdite si elle rendrait la séance invalide.                                                                                                                                                                                                                                                                                    |
| Retour arrière                       | Si des modifications non enregistrées existent, une confirmation est demandée.                                                                                                                                                                                                                                                    |
| Validation                           | Le bouton est activé uniquement lorsque la séance est valide. En création, il ouvre l’écran **Catégories de la séance**. En modification, il valide les changements.                                                                                                                                                              |
| Enregistrement                       | Les modifications sont enregistrées uniquement après validation.                                                                                                                                                                                                                                                                  |
| Annulation                           | Quitter sans enregistrer conserve la version précédente de la séance.                                                                                                                                                                                                                                                             |
| Navigation                           | En création, la validation ouvre **Catégories de la séance** ; après enregistrement des catégories, retour à **Catalogue de séances**.                                                                                                                                                                                            |

## Activité

### Eléments affichés

| Élément affiché           | Type              | Visible                            | Obligatoire | Valeur par défaut              | Contraintes                                    | Source   | Action         | Remarques                                                                                                                                                                                                                              |
| ------------------------- | ----------------- | ---------------------------------- | ----------- | ------------------------------ | ---------------------------------------------- | -------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bouton Retour             | Bouton            | Toujours                           | Oui         | Visible                        | Confirmation si modifications non enregistrées | Système  | Retour         |                                                                                                                                                                                                                                        |
| Titre de l'écran          | Texte             | Toujours                           | Oui         | "Ajouter une étape"            | Texte fixe                                     | Statique | Aucune         | En modification : "Modifier une étape"                                                                                                                                                                                                 |
| Type d'activité           | Segmented Control | Étape 1                            | Oui         | Exercice                       | Exercice / Récupération                        | Activité | Sélection      | Change le parcours et les champs affichés |
| Nom                       | Champ texte       | Étape 1                            | Oui         | Vide                           | 1 à 80 caractères                              | Activité | Saisie         | Pré-rempli pour Récupération |
| Mode d'exécution          | Segmented Control | Étape 1, Exercice uniquement       | Oui         | Durée                          | Durée / Répétition                             | Activité | Sélection      | Change la première roulette des paramètres |
| Durée                     | Roulette min/sec  | Étape 1, mode Durée                | Oui         | 30 s                           | 1 s à 99 min 59 s                              | Activité | Sélection      | Deux colonnes : minutes et secondes |
| Nombre de répétitions     | Roulette          | Étape 1, mode Répétition           | Oui         | 1                              | Entier ≥ 1                                     | Activité | Sélection      | Roulette unique, large et centrée |
| Pause après Série         | Roulette durée    | Étape 1, Exercice uniquement       | Non         | 0 s                            | 0 à 99 min 59 s                                | Activité | Sélection      | Appliquée après chaque Série ; la pause finale est omise si l'étape suivante du plan est une Récupération explicite |
| Nombre de Séries          | Roulette          | Étape 1, Exercice uniquement       | Oui         | 1                              | Entier ≥ 1                                     | Activité | Sélection      | Paramètre propre à l'Activité ; une Série n'est pas une entité autonome |
| Consigne                  | Texte multiligne  | Étape 2                            | Non         | Vide                           | 1000 caractères max                            | Activité | Saisie         | Écran Informations complémentaires |
| Zones corporelles         | Tags              | Étape 2, Exercice uniquement       | Non         | Aucune                         | Plusieurs zones autorisées                     | Activité | Sélection      | Référentiel prédéfini ; écran Informations complémentaires |
| Bouton Valider            | Bouton            | Toujours                           | Oui         | Désactivé si activité invalide | Nom + durée/répétitions obligatoires           | Statique | Enregistrer    |                                                                                                                                                                                                                                        |
### Règles fonctionnelles

| Règle                | Description                                                                                                                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type Exercice        | Autorise les modes Durée et Répétitions.                                                                                                                                                                                                                                |
| Type Récupération    | Nom pré-rempli "Récupération". Le mode d'exécution est masqué.                                                                                                                                                                                                          |
| Mode Durée           | Affiche le sélecteur de durée.                                                                                                                                                                                                                                          |
| Mode Répétitions     | Affiche le champ "Nombre de répétitions".                                                                                                                                                                                                                               |
| Séries              | Un Exercice possède un nombre de Séries propre, supérieur ou égal à 1. Une Série répète la durée ou le nombre de répétitions défini pour l'Exercice puis sa pause éventuelle. |
| Pause après Série   | Disponible uniquement pour les Exercices. Lorsqu’une durée est renseignée, l’application crée techniquement une activité de type `Récupération`, liée à l’Exercice et utilisée après chaque Série. Après la dernière Série, elle est omise si l'étape suivante du plan d'exécution est une Récupération explicite. Cette activité technique reste masquée dans l’interface de composition. |
| Zones corporelles    | Disponibles uniquement pour une activité de type Exercice ; sélection multiple parmi le référentiel prédéfini. L'utilisateur ne peut ni créer, ni renommer, ni supprimer une Zone corporelle dans le MVP. |
| Récupération         | La section Zones corporelles est masquée. |
| Validation           | Impossible tant que les champs obligatoires ne sont pas renseignés.                                                                                                                                                                                                     |
| Retour               | Si des modifications non enregistrées existent, une confirmation est demandée.                                                                                                                                                                                          |
## Exécution d'une séance

### Éléments affichés

| Élément affiché               | Type            |                Visible | Obligatoire | Valeur par défaut                                  | Contraintes                                         | Source      | Action                       | Remarques                                                  |
| ----------------------------- | --------------- | ---------------------: | ----------: | -------------------------------------------------- | --------------------------------------------------- | ----------- | ---------------------------- | ---------------------------------------------------------- |
| Titre de la séance            | Texte           |               Toujours |         Oui | Nom de la séance                                   | 1 à 80 caractères                                   | Séance      | Aucune                       | En-tête fixe                                               |
| Icône Bips                    | Bouton / état   |               Toujours |         Oui | Selon préférence utilisateur                       | Activé / désactivé                                  | Préférences | Activer / désactiver         | Changement d’icône selon l’état                            |
| Icône Annonces vocales        | Bouton / état   |               Toujours |         Oui | Selon préférence utilisateur                       | Activé / désactivé                                  | Préférences | Activer / désactiver         | Utilise la voix système                                    |
| Libellé Étapes                | Texte           |               Toujours |         Oui | `0 sur N`                                          | Valeurs comprises entre 0 et N                      | Séance      | Aucune                       | Progression réelle                                         |
| Nombre d’étapes réalisées     | Valeur calculée |               Toujours |         Oui | 0                                                  | Ne peut pas dépasser le total                       | Séance      | Aucune                       | Inclut les activités terminées ou écourtées                |
| Nombre total d’étapes         | Valeur calculée |               Toujours |         Oui | Calculé                                            | ≥ 1                                                 | Séance      | Aucune                       |                                                            |
| Libellé Temps total           | Texte           |               Toujours |         Oui | Statique                                           | Texte fixe                                          | Statique    | Aucune                       |                                                            |
| Temps total restant           | Durée dynamique |               Toujours |         Oui | Durée planifiée                                    | ≥ 0 ; jamais négatif                                | Séance      | Aucune                       | Remplace le temps écoulé                                   |
| Durée totale planifiée        | Durée statique  |               Toujours |         Oui | Calculée                                           | Calculée uniquement sur les activités chronométrées | Séance      | Aucune                       | Format `temps restant / temps total`                       |
| Symbole `≈`                   | Indicateur      |           Conditionnel |         Non | Masqué                                             | Affiché si au moins un Exercice en mode Répétition existe    | Séance      | Aucune                       | Devant les deux durées globales                            |
| Barre de progression          | Barre           |               Toujours |         Oui | 0 %                                                | Entre 0 et 100 %                                    | Séance      | Aucune                       | Mise à jour dynamique                                      |
| Libellé Bloc                  | Texte           |               Toujours |         Oui | `1 / N`                                            | Minimum 1                                           | Séance      | Aucune                       | Pas d’annonce vocale                                       |
| Bloc courant                  | Valeur calculée |               Toujours |         Oui | 1                                                  | 1 à nombre total de Blocs                           | Séance      | Aucune                       | Réinitialisé à 1 à chaque nouveau Cycle                    |
| Nombre total de Blocs         | Valeur calculée |               Toujours |         Oui | Calculé                                            | ≥ 1                                                 | Séance      | Aucune                       |                                                            |
| Libellé Cycle                 | Texte           |               Toujours |         Oui | `1 / N`                                            | Minimum 1                                           | Séance      | Aucune                       | Pas d’annonce vocale                                       |
| Cycle courant                 | Valeur calculée |               Toujours |         Oui | 1                                                  | 1 à nombre total de Cycles                          | Séance      | Aucune                       |                                                            |
| Nombre total de Cycles        | Valeur calculée |               Toujours |         Oui | Calculé                                            | ≥ 1                                                 | Séance      | Aucune                       |                                                            |
| Nom de l’activité courante    | Texte           |               Toujours |         Oui | Première activité                                  | 1 à 80 caractères                                   | Activité    | Aucune                       |                                                            |
| Durée planifiée de l’activité | Texte           |  Activité chronométrée |         Oui | Durée définie                                      | ≥ 1 seconde                                         | Activité    | Aucune                       | Affichée après le nom                                      |
| Libellé Répétitions           | Texte           | Exercice en Répétition |         Oui | Nombre de répétitions                               | Remplace la durée                                   | Activité    | Aucune                       |                                                            |
| Cercle de progression         | Indicateur      |               Toujours |         Oui | Cercle complet                                     | Progression continue                                | Séance      | Aucune                       | Orange  / bleu selon le type                               |
| Temps restant de l’activité   | Chronomètre     |  Activité chronométrée |         Oui | Durée planifiée                                    | Secondes entières ; jamais négatif                  | Séance      | Aucune                       | Passage automatique à 0                                    |
| Temps écoulé de l’activité    | Chronomètre     | Exercice en Répétition |         Oui | `00:00`                                            | Exclut les périodes de pause                        | Séance      | Aucune                       | Enregistré à l’appui sur Terminé                           |
| Libellé À suivre              | Texte           | Sauf dernière activité |         Non | Activité suivante                                  | Masqué si aucune activité suivante                  | Séance      | Aucune                       |                                                            |
| Nom de l’activité suivante    | Texte           | Sauf dernière activité |         Non | Calculé                                            | 1 à 80 caractères                                   | Activité    | Aucune                       | Aucun Bloc/Cycle ajouté au libellé                         |
| Durée de l’activité suivante  | Texte           |        Si chronométrée |         Non | Calculée                                           | ≥ 1 seconde                                         | Activité    | Aucune                       | Nombre de répétitions si Exercice en mode Répétition                              |
| Bouton Réinitialiser          | Bouton          |               Toujours |         Oui | Actif                                              | Réinitialise uniquement l’activité courante         | Statique    | Réinitialiser                | Fonctionne aussi sur les comptes à rebours                 |
| Bouton Pause / Lecture        | Bouton          |               Toujours |         Oui | Lecture avant démarrage, Pause pendant l’exécution | Une seule icône selon l’état                        | Séance      | Démarrer / Pause / Reprendre | La séance ne démarre pas à l’ouverture de l’écran          |
| Bouton Arrêter                | Bouton          |               Toujours |         Oui | Actif                                              | Ouvre une confirmation                              | Statique    | Demander l’arrêt             | Action destructive visuellement distincte                  |
| Bouton Suivant                | Bouton          |               Toujours |         Oui | Actif                                              | Passe à l’activité suivante                         | Séance      | Suivant                      | Une activité chronométrée est alors marquée comme écourtée |
| Indicateur d’accueil          | Élément système |               Toujours |         Oui | Système                                            | Selon appareil                                      | Système     | Aucune                       |                                                            |
### Couleur du minuteur
| Type d’activité          | Couleur du cercle et du chronomètre                   |
| ------------------------ | ----------------------------------------------------- |
| Exercice                 | Orange                                                |
| Récupération             | Bleu                                                  |
| Compte à rebours initial | Couleur neutre ou couleur principale de l’application |
### Sons et annonces
| Événement                         | Comportement             |
| --------------------------------- | ------------------------ |
| Début du compte à rebours initial | Annonce « Soyez prêt »   |
| Trois dernières secondes          | Un bip par seconde       |
| Début d’un exercice               | Annonce « Exercice »     |
| Début d’une pause                 | Annonce « Pause »        |
| Début d’une récupération          | Annonce « Récupération » |
| Changement de Bloc ou Cycle       | Aucune annonce           |
| Fin de séance                     | Annonce « Bravo ! »      |
### Dialogue : arrêt d'une séance

| Élément affiché          | Type              |         Visible | Obligatoire | Valeur par défaut     | Contraintes                           | Source   | Action    | Remarques                                                |
| ------------------------ | ----------------- | --------------: | ----------: | --------------------- | ------------------------------------- | -------- | --------- | -------------------------------------------------------- |
| Fond assombri            | Overlay           | Dialogue ouvert |         Oui | Visible               | Bloque les interactions avec l’écran  | Statique | Aucune    |                                                          |
| Titre                    | Texte             |        Toujours |         Oui | `Arrêter la séance ?` | Texte fixe                            | Statique | Aucune    |                                                          |
| Message                  | Texte             |        Toujours |         Oui | Message explicatif    | Texte fixe                            | Statique | Aucune    | Précise que la séance sera enregistrée comme interrompue |
| Bouton Reprendre         | Bouton principal  |        Toujours |         Oui | Actif                 | Ferme le dialogue                     | Statique | Reprendre | La séance reste dans son état précédent                  |
| Bouton Arrêter la séance | Bouton destructif |        Toujours |         Oui | Actif                 | Enregistre l’interruption             | Statique | Arrêter   | Ouvre ensuite la synthèse de séance                      |
| Fermeture hors dialogue  | Interaction       |             Non |         Non | Désactivée            | L’utilisateur doit choisir une action | Statique | Aucune    | Évite un comportement ambigu                             |
## Synthèse de séance

### Eléments affichés

| Élément affiché       | Type             |  Visible | Obligatoire | Valeur par défaut                                    | Contraintes                 | Source      | Action         | Remarques                            |
| --------------------- | ---------------- | -------: | ----------: | ---------------------------------------------------- | --------------------------- | ----------- | -------------- | ------------------------------------ |
| Titre de la séance    | Texte            | Toujours |         Oui | Nom de la séance                                     | 1 à 80 caractères           | Séance      | Aucune         | En-tête fixe                         |
| Carte Statut          | Carte            | Toujours |         Oui | Visible                                              | Une seule                   | Séance      | Aucune         |                                      |
| Icône de statut       | Icône            | Toujours |         Oui | ✓                                                    | Terminée ou interrompue     | Séance      | Aucune         | Couleur selon le statut              |
| Libellé du statut     | Texte            | Toujours |         Oui | Séance terminée                                      | Terminée ou interrompue     | Séance      | Aucune         |                                      |
| Date / heure de fin   | Texte            | Toujours |         Oui | Date courante                                        | Format local                | Séance      | Aucune         |                                      |
| Carte Votre séance    | Carte            | Toujours |         Oui | Visible                                              | Une seule                   | Séance      | Aucune         |                                      |
| Durée réelle          | Durée            | Toujours |         Oui | Calculée                                             | Temps réellement exécuté    | Séance      | Aucune         |                                      |
| Nombre d'activités    | Valeur           | Toujours |         Oui | Calculé                                              | X / Y                       | Séance      | Aucune         |                                      |
| Activités écourtées   | Texte            |   Si > 0 |         Non | Masqué                                               | `n activité(s) écourtée(s)` | Séance      | Aucune         | Affiché dans la carte "Votre séance" |
| Question de ressenti  | Texte            | Toujours |         Oui | Texte fixe                                           |                             | Statique    | Aucune         |                                      |
| Mention "Obligatoire" | Texte            | Toujours |         Oui | Visible                                              | Texte fixe                  | Statique    | Aucune         |                                      |
| Choix du ressenti     | Sélecteur        | Toujours |         Oui | Aucun sélectionné                                    | Une seule sélection         | Utilisateur | Sélection      | MVP : 3 niveaux                      |
| Titre Commentaire     | Texte            | Toujours |         Oui | Texte fixe                                           |                             | Statique    | Aucune         |                                      |
| Mention "Facultatif"  | Texte            | Toujours |         Oui | Visible                                              | Texte fixe                  | Statique    | Aucune         |                                      |
| Champ Commentaire     | Texte multiligne | Toujours |         Non | Vide                                                 | 500 caractères max          | Utilisateur | Saisie         |                                      |
| Bouton Terminer       | Bouton           | Toujours |         Oui | Désactivé tant que le ressenti n'est pas sélectionné | Une seule action            | Statique    | Aller au Suivi | Enregistre définitivement la séance  |
### Règles fonctionnelles
| Règle               | Description                                                                      |
| ------------------- | -------------------------------------------------------------------------------- |
| Durée affichée      | Toujours la durée réellement exécutée.                                           |
| Blocs / Cycles      | Non affichés dans le MVP.                                                        |
| Activités écourtées | Affichées uniquement si leur nombre est supérieur à zéro.                        |
| Ressenti            | Obligatoire avant de quitter l'écran.                                            |
| Commentaire         | Facultatif.                                                                      |
| Validation          | Le bouton **Terminer** reste désactivé tant qu'aucun ressenti n'est sélectionné. |
| Navigation          | Appui sur **Terminer** → écran **Suivi**.                                        |
| Sauvegarde          | Le ressenti et le commentaire sont enregistrés avec la séance.                   |
| Séance interrompue  | Même écran, avec un statut et une icône adaptés.                                 |
## Profil – Préférences

### Eléments affichés
| Élément affiché                     | Type            |  Visible | Obligatoire | Valeur par défaut          | Contraintes                     | Source      | Action               | Remarques                                            |
| ----------------------------------- | --------------- | -------: | ----------: | -------------------------- | ------------------------------- | ----------- | -------------------- | ---------------------------------------------------- |
| Titre de l'écran                    | Texte           | Toujours |         Oui | Profil                     | Texte fixe                      | Statique    | Aucune               |                                                      |
| Avatar                              | Icône           | Toujours |         Oui | Initiales de l'utilisateur | Image personnalisée en V2       | Profil      | Modifier le profil   |                                                      |
| Nom                                 | Texte           | Toujours |         Oui | Nom de l'utilisateur       | 1 à 80 caractères               | Profil      | Modifier le profil   |                                                      |
| Lien « Modifier le profil »         | Lien            | Toujours |         Oui | Visible                    | V2 : édition complète du profil | Profil      | Ouvrir l'édition     | MVP : peut rester inactif                            |
| Sons                                | Interrupteur    | Toujours |         Oui | Activé                     | Booléen                         | Préférences | Activer / Désactiver | Valeur par défaut des séances                        |
| Annonces vocales                    | Interrupteur    | Toujours |         Oui | Activé                     | Booléen                         | Préférences | Activer / Désactiver | Utilise la voix système                              |
| Vibrations                          | Interrupteur    | Toujours |         Oui | Activé                     | Booléen                         | Préférences | Activer / Désactiver | Si le téléphone le permet                            |
| Compte à rebours initial par défaut | Sélecteur durée | Toujours |         Oui | 10 s                       | 0 à 99 min 59 s                 | Préférences | Modifier             | Valeur utilisée à la création d'une séance           |
| Fin de séance par défaut            | Sélecteur durée | Toujours |         Oui | 0 s                        | 0 à 99 min 59 s                 | Préférences | Modifier             | 0 = désactivée                                       |
| Notifications                       | Interrupteur    | Toujours |         Oui | Activé                     | Booléen                         | Préférences | Activer / Désactiver | Rappels locaux du MVP ; autorisation système requise |
### Règles fonctionnelles

| Règle                    | Description                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Sauvegarde               | Toute modification est enregistrée immédiatement.                                                                                        |
| Paramètres par défaut    | Les valeurs définies ici sont utilisées lors de la création d'une nouvelle séance.                                                       |
| Surcharge                | Une séance peut remplacer les valeurs par défaut (compte à rebours initial et fin de séance).                                            |
| Sons                     | Désactive tous les bips de l'application.                                                                                                |
| Annonces vocales         | Désactive toutes les annonces vocales sans modifier les bips.                                                                            |
| Vibrations               | Désactive toutes les vibrations générées par l'application.                                                                              |
| Compte à rebours initial | Définit la durée proposée par défaut lors de la création d'une nouvelle séance. Une valeur de 0 s désactive le compte à rebours initial. |
| Fin de séance            | Définit la durée proposée par défaut lors de la création d'une nouvelle séance. Une valeur de 0 s désactive la fin de séance.            |
| Langue du MVP            | Le MVP est disponible uniquement en français. Aucun sélecteur de langue n'est affiché. L'évolution multilingue est préparée techniquement. |
| Voix                     | La voix utilisée est toujours celle du système d'exploitation. Aucun choix de voix n'est proposé dans le MVP. La langue de synthèse vocale pourra être sélectionnable lors d'une évolution multilingue. |
| Volume                   | Le volume des annonces dépend exclusivement du réglage du téléphone.                                                                     |
| Notifications            | Active ou désactive les rappels locaux des Séances planifiées, sous réserve de l’autorisation accordée par le système d’exploitation. |
| Profil                   | Les informations personnelles n'ont aucune incidence sur les séances existantes.                                                         |
| Retour                   | Quitter l'écran ne demande aucune confirmation, les modifications étant enregistrées automatiquement.                                    |
## Calendrier

### Règles liées à la couleur

- Les occurrences affichées dans le calendrier utilisent la couleur de la séance comme repère visuel.
- Une routine ne possède pas de couleur propre.
- La modification de la couleur de la Séance est immédiatement reflétée par toutes les Routines existantes qui lui sont associées, celles-ci héritant de la couleur de la Séance.

## Planifier une routine

### Règles liées à la couleur

- La routine reprend automatiquement la couleur de la séance associée.
- Le champ couleur n’est pas affiché dans l’écran de planification.
- La couleur ne peut être modifiée que depuis la séance.

## Suivi - Vue d'ensemble

### Règles liées à la couleur

- Les futurs indicateurs et graphiques peuvent utiliser la couleur enregistrée avec chaque exécution afin de faciliter l’identification des séances.

## Suivi - Séances

### Élément affiché lié à la couleur

| Élément affiché | Type | Visible | Obligatoire | Valeur par défaut | Contraintes | Source | Action | Remarques |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Couleur de la séance exécutée | Indicateur visuel | Toujours | Oui | Couleur de l’instantané | Une couleur parmi 16 | Instantané de séance | Aucune | Ne dépend pas de la couleur actuelle de la séance |

### Règle fonctionnelle liée à la couleur

La couleur affichée dans le Suivi est celle enregistrée dans l’instantané de l’exécution. Une modification ultérieure de la couleur de la séance ne modifie pas les exécutions passées.

## Dialogues de confirmation

| Action                                           | Confirmation      | Boutons                 | Conséquence                                                            |
| ------------------------------------------------ | ----------------- | ----------------------- | ---------------------------------------------------------------------- |
| Supprimer une séance                             | Oui               | Annuler / Supprimer     | Supprime la séance et les routines associées ; conserve les exécutions |
| Arrêter une séance en cours                      | Oui               | Continuer / Arrêter     | Enregistre une exécution partielle                                     |
| Archiver une séance                              | Non               | Snackbar + Annuler      | Déplace la séance dans les archives                                    |
| Restaurer une séance                             | Non               | Snackbar + Annuler      | Replace la séance dans le catalogue                                    |
| Supprimer une catégorie                          | Oui (si utilisée) | Annuler / Supprimer     | Retire la catégorie des Séances concernées ; les Instantanés historiques restent inchangés |
| Réinitialiser les préférences                    | Oui               | Annuler / Réinitialiser | Restaure les préférences par défaut                                    |
| Supprimer l'historique                           | Oui               | Annuler / Supprimer     | Supprime toutes les exécutions enregistrées                            |
| Quitter la création d'une séance non enregistrée | Oui               | Continuer / Quitter     | Abandonne la création                                                  |


