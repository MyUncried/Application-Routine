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
2. composition de la séance (activités, Set, Cycle...) ;
3. sélection des catégories ;
4. retour au catalogue des séances.

À l'issue de cette création, la séance est immédiatement disponible dans le catalogue.

Aucune routine n'est créée automatiquement.

## 2.3 Modification d'une séance

Une séance peut être modifiée à tout moment depuis le catalogue des séances.

La modification d'une séance démarre toujours par l'écran de définition du nom et de la couleur, puis se poursuit vers la Composition. Les modifications sont enregistrées selon les validations explicites prévues par les écrans.

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
2. un Cycle unique contenant un Set unique ;
3. des activités de fin de séance facultatives ;
4. une fin de séance.

Le Compte à rebours initial et la Fin de séance sont des éléments structurels obligatoires et ne constituent pas des Activités. Leur durée peut être égale à 0 s.

Le compte à rebours initial est exécuté une seule fois au démarrage de la séance.

Les activités de fin de séance sont exécutées une seule fois après la dernière répétition du Cycle et avant la Fin de séance.

Une séance contient obligatoirement un Cycle et un Set et doit contenir au minimum une activité de type Exercice pour être exécutable.

## 3.3 Les activités

Une activité représente une étape élémentaire de la séance.

Chaque activité est indépendante des autres.

Une activité possède notamment :

- un type ;
- un nom ;
- une durée ou un nombre de répétitions ;
- une **Pause après Série** facultative, appliquée après chaque Série de l’Exercice selon les règles définies pour ce paramètre ;
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

Son nom proposé par défaut est **Récupération**.

Elle est définie uniquement par une durée et se termine automatiquement à l'échéance de cette durée.

Elle ne possède ni répétitions, ni zones corporelles.

## 3.5 Sets

Un Set est un conteneur regroupant plusieurs activités exécutées dans un ordre déterminé.

Dans le MVP, chaque cycle contient un seul Set.

Les activités d'un Set peuvent être réorganisées librement.

Le Set constitue principalement un élément fonctionnel de structuration. Son maintien dans le vocabulaire visible par l'utilisateur pourra être réévalué ultérieurement.

## 3.6 Cycles

Un cycle permet de répéter un Set un nombre défini de fois.

Dans le MVP :
- une Séance contient exactement un Cycle ;
- le Cycle contient exactement un Set ;
- le Cycle possède son propre nombre de répétitions ;
- le Set possède son propre nombre de répétitions ;
- à chaque répétition du Cycle, le Set est exécuté selon son nombre de répétitions, puis les éventuelles Activités propres au Cycle sont exécutées.

Dans une version ultérieure, une Séance pourra comporter plusieurs Cycles et un Cycle pourra comporter plusieurs Sets.
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

- la **durée estimée** de la séance ;
- le **nombre d'Activités de la Composition**.

### Durée estimée

La durée estimée correspond à la somme de toutes les durées déterminables de l'Exécution complète construite à partir de la Composition.

Le calcul tient compte :

- du Compte à rebours initial et de la Fin de séance ;
- de toutes les occurrences d'Activités chronométrées ;
- des Récupérations explicites ;
- des Récupérations techniques générées par les Pauses après Série lorsqu'elles sont effectivement insérées dans le plan ;
- des Séries ;
- des répétitions du Set ;
- des répétitions du Cycle ;
- de la position structurelle de chaque Activité dans la Séance.

Un Exercice en mode Répétition ne reçoit **aucune durée conventionnelle** dans ce calcul.

- Si toutes les durées sont déterminables, la durée est affichée normalement, par exemple `18 min`.
- Si au moins un Exercice est en mode Répétition, la somme des durées connues constitue une **borne minimale** et l'interface affiche le signe `≥`, par exemple `≥ 18 min`.

### Nombre d'Activités de la Composition

Le nombre d'Activités de la Composition correspond au nombre d'Exercices et de Récupérations explicitement définis dans la Composition.

Il :

- ne tient pas compte des répétitions liées aux Séries, Sets ou Cycles ;
- ne comptabilise pas les Récupérations techniques générées par les Pauses après Série.

Ces informations sont affichées en temps réel.

## 3.10 Principes de conception

La composition d'une séance repose sur les principes suivants :

- chaque activité est indépendante ;
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

Avant de lancer la première activité, l'application :

- crée un instantané de la séance ;
- initialise les indicateurs de progression ;
- démarre le compte à rebours initial, lorsque sa durée est supérieure à `0 s`.

Lorsque le Compte à rebours initial est configuré à `0 s`, cette phase est instantanée et la première Activité débute immédiatement.

## 4.3 Déroulement

Les activités sont exécutées dans l'ordre défini dans la séance.

Chaque activité est exécutée intégralement avant le passage à la suivante.

Les cycles répètent automatiquement leur Set jusqu'à atteindre le nombre de répétitions défini.

Les activités de fin de séance sont exécutées une seule fois après le dernier cycle.

Lorsque la dernière activité est terminée, la séance est considérée comme terminée.

## 4.4 Informations affichées

Pendant l'Exécution, l'écran affiche principalement :

- le nom de l'Activité en cours ;
- la Série courante sous la forme `x/y` lorsqu'il s'agit d'un Exercice ;
- le temps de l'Activité : compte à rebours pour une Activité chronométrée, chronomètre croissant pour un Exercice en Répétition ;
- `Set x/y • Cycle x/y` ;
- l'Activité suivante et sa durée lorsqu'elle est connue ;
- les commandes Réinitialiser, Pause et Activité suivante ;
- le temps total écoulé / estimé et sa barre de progression.

La notion d'« étape » n'est pas affichée comme indicateur de progression dans le MVP.

### Temps écoulé et durée réelle

Le **temps total écoulé** correspond au temps actif réellement passé dans l'Exécution depuis son démarrage effectif, en excluant les périodes pendant lesquelles l'utilisateur a placé la Séance en Pause.

Il inclut notamment :

- le temps réellement passé dans les Exercices en mode Répétition ;
- les Activités chronométrées ;
- les Récupérations explicites ;
- les Récupérations techniques liées aux Pauses après Série ;
- les phases chronométrées du Compte à rebours initial et de la Fin de séance.

La **durée réelle** enregistrée à la fin de l'Exécution suit la même règle : les périodes de Pause utilisateur en sont exclues.

### Barre de progression globale

La barre est visuellement continue : **aucune frontière de segment n'est affichée**.

Son calcul s'appuie cependant sur les occurrences d'Activités du plan d'Exécution :

- `N` = nombre total d'Activités à exécuter dans le plan ;
- `R` = nombre d'occurrences d'Exercices en mode Répétition ;
- `T` = somme des durées des occurrences d'Activités chronométrées du plan.

Chaque occurrence d'Exercice en mode Répétition reçoit un poids de `1 / N` dans la barre.

La part restante, `1 - R / N`, est répartie entre les occurrences d'Activités chronométrées proportionnellement à leur durée. Pour une Activité chronométrée de durée `d`, son poids est donc :

`(1 - R / N) × d / T`

Cas particuliers :

- si `R = 0`, la barre est entièrement proportionnelle aux durées ;
- si `R = N`, chaque Activité reçoit un poids de `1 / N` ;
- une Activité chronométrée en cours remplit progressivement sa part selon le temps écoulé sur sa durée cible ;
- un Exercice en mode Répétition conserve sa part non remplie pendant son exécution puis la remplit entièrement lorsque l'utilisateur valide sa fin avec `Activité suivante` ;
- une Activité chronométrée passée avant son terme et enregistrée `Partielle` est considérée comme franchie dans l'avancement global : sa part est alors entièrement remplie ;
- `Pause` suspend la progression de la part courante ;
- `Réinitialiser` remet à zéro la progression interne de l'Activité courante sans modifier les parts déjà franchies.

La barre représente donc l'**avancement global dans le plan d'Exécution**. Elle n'est pas le simple rapport entre le temps total écoulé et la durée estimée.

Pour un Exercice en Répétition, le cercle effectue un tour complet par minute. Le chronomètre continue à croître au-delà d'une minute et un bip fixe est émis à chaque minute écoulée. Pause suspend le chronomètre et la rotation du cercle.

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

Les confirmations appliquées pendant l'Exécution suivent la règle suivante :

- **Réinitialiser** → confirmation, afin d'éviter une perte involontaire de progression sur l'Activité ;
- **Activité suivante** → pour une Activité chronométrée avant son terme, confirmation afin d’éviter un passage involontaire et enregistrement `Partielle` si confirmé ; pour un Exercice en mode Répétition, fin normale sans confirmation ;
- **Pause** → aucune confirmation, l'action étant réversible ;
- **Arrêter la séance** → confirmation via le modal de pause.

Les confirmations protègent ainsi les actions ayant un impact irréversible sur la progression.

## 4.7 Passage à l'activité suivante

L'action **Activité suivante** a deux comportements selon le mode de l'Activité :

- pour une Activité chronométrée utilisée avant son terme, une confirmation est demandée ; après confirmation, l'Activité est enregistrée avec le statut **Partielle** ;
- pour un Exercice en mode Répétition, l'action constitue la fin normale de l'Exercice et ne crée pas de statut Partielle.

Dans les deux cas, l'Exécution poursuit ensuite le plan normal.

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

| Statut      | Description                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Terminée    | Toutes les activités ont été exécutées jusqu'à leur terme.                                       |
| Partielle   | La séance est arrivée à son terme, mais au moins une activité n'a pas été réalisée complètement. |
| Interrompue | L'utilisateur a arrêté la séance avant son terme.                                                |

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

À l'issue de la validation, la Routine est immédiatement créée.

Les occurrences correspondantes deviennent visibles dans le calendrier.

## 5.3 Paramètres de planification

Chaque Routine possède les paramètres suivants :

- la séance associée ;
- la date de début ;
- l'heure d'exécution ;
- le mode de planification :
    - **Sans répétition** : une seule occurrence est planifiée à la date définie ;
    - **Périodique** : dans le MVP, la Séance est répétée selon une périodicité hebdomadaire définie par une fréquence en semaines ;
- pour une planification périodique :
    - la fréquence en semaines, supérieure ou égale à 1 ;
    - un ou plusieurs jours de la semaine ;
    - une date de fin obligatoire ;
- un rappel facultatif, avec **0 ou 1 rappel maximum** par Routine.

La présentation UI est compacte : `Date de début` et `Heure` sont des libellés de blocs au même niveau visuel, sans titre intermédiaire `Quand ?`. Pour une répétition hebdomadaire, l'écran affiche `Toutes les`, puis `X semaine(s) jusqu'au <date>`, avec les jours sélectionnés en dessous.

Il n'existe pas de mode `Quotidien` distinct : sélectionner les sept jours avec une fréquence d'une semaine produit un comportement quotidien.

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

Pour une Routine en mode `Périodique`, la semaine contenant la **Date de début** constitue la semaine d'ancrage n°1.

Pour une fréquence de `N` semaines :

- seules les semaines dont l'écart avec la semaine d'ancrage est un multiple de `N` génèrent des occurrences ;
- dans chacune de ces semaines, une occurrence est générée pour chaque jour de la semaine sélectionné ;
- aucune occurrence n'est générée avant la Date de début ;
- la Date de fin est **incluse** : une occurrence située ce jour-là est générée si le jour est sélectionné ;
- toutes les occurrences utilisent l'Heure définie par la Routine.

Exemple : si la Date de début est un mercredi et que lundi et jeudi sont sélectionnés, le lundi de cette première semaine n'est pas généré car il précède la Date de début ; le jeudi l'est.

Ce calcul dynamique concerne les occurrences futures. Lorsqu'une occurrence arrive à échéance, elle est historisée avec son résultat afin de conserver la trace des séances exécutées et non exécutées.
Le calendrier calcule uniquement les occurrences correspondant à la période consultée.
Les occurrences ne peuvent pas être modifiées individuellement.
Toute modification de la date de début, de l'heure, de la fréquence hebdomadaire, des jours sélectionnés ou de la date de fin s'applique à l'ensemble de la Routine et recalcule les occurrences futures.

Les détails techniques de ce calcul sont décrits dans le chapitre **12 – Architecture technique**.

## 5.6 Exécution d'une occurrence

Une occurrence future peut être exécutée depuis ses options via **Exécuter maintenant**.

Cette action ouvre l'écran d'Exécution sans démarrer automatiquement la première Activité.

Lorsqu'une occurrence future est exécutée en avance, elle est considérée comme exécutée pour cette occurrence et n'est plus proposée à l'horaire initial.

Une occurrence qui arrive à échéance sans Exécution disparaît de l'interface et n'apparaît pas dans le Suivi du MVP.

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
- la structure ordonnée des Cycles, Sets et Activités ;
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

Pour les Exécutions enregistrées, l'utilisateur peut :

- rechercher une Exécution ;
- filtrer les résultats ;
- modifier le tri.

Dans le MVP, les cartes restent condensées. La vue détaillée d'une Exécution est reportée à une version ultérieure.

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
- période ;
- statut.

Les filtres sont appliqués simultanément.

Ils peuvent être réinitialisés à tout moment.

## 6.8 Tri

Le suivi permet de trier les exécutions selon différents critères.

Par défaut, les séances sont triées de la plus récente à la plus ancienne.

Les autres critères de tri pourront évoluer dans les versions futures.

## 6.9 Déploiement du détail

La vue détaillée déployée d'une Exécution est reportée à une version ultérieure.

Dans le MVP, les Exécutions sont présentées uniquement sous forme de cartes condensées. Aucun bouton **Déployer tout / Replier tout** n'est affiché.

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
- le suivi privilégie une consultation rapide grâce à la recherche, aux filtres, au tri et à des cartes condensées ;
- les données affichées correspondent toujours à l'état exact de la séance au moment de son exécution.

# Annexe – Tableaux de spécification des écrans

## Catalogue de séances

### Champs affichés

| Élément affiché | Type | Visible | Valeur / comportement | Action |
| --- | --- | --- | --- | --- |
| Bouton Ajouter (+) | Bouton | Toujours | Visible | Créer une Séance |
| Champ Recherche | Champ texte | Toujours | Recherche instantanée sur le nom | Filtrer |
| Filtre `Toutes` | Filtre | Toujours | Affiche toutes les Séances actives, planifiées ou non ; exclut les archivées | Filtrer |
| Filtre `Planifiées` | Filtre | Toujours | Séances ayant au moins une Routine | Filtrer |
| Filtre `Archivées` | Filtre | Toujours | Séances archivées uniquement | Filtrer |
| Carte Séance | Carte | 1 par Séance | Condensée ou déployée | Zone principale : ouvrir l’Exécution |
| Chevron | Bouton | Toujours | Droite si replié, bas si déployé | Déployer / Replier uniquement |
| Menu `⋯` | Bouton | Toujours | Visible | Ouvrir les options |
| Nom de la Séance | Texte | Toujours | Nom enregistré | Aucune action spécifique distincte de la zone principale |
| Catégories | Badges | Si renseignées | Zéro à plusieurs | Aucune |
| Nombre d’Activités / durée | Texte | Toujours | Calculés | Aucune |
| Sets / Cycles | Texte | Toujours | Calculés | Aucune |
| Dernière Exécution | Texte | Si disponible | Date relative | Aucune |
| Prochaine occurrence | Texte | Si planifiée | Date / heure relative | Aucune |
| Liste des Activités | Liste | Carte déployée | Ordre de la Séance | Aucune |
| Résumé d’Activité | Texte | Carte déployée | À droite : `durée/reps · xN` ; `xN` seulement si N > 1 | Aucune |

### Règles fonctionnelles

| Règle | Description |
| --- | --- |
| Chargement | Les Séances sont affichées dès l’ouverture de l’écran. |
| Recherche | Filtrage en temps réel sur le nom de la Séance. |
| `Toutes` | Affiche toutes les Séances non archivées. |
| `Planifiées` | Affiche les Séances disposant d’au moins une Routine. |
| `Archivées` | Affiche uniquement les Séances archivées. |
| Zone principale de la carte | Ouvre l’écran d’Exécution ; l’Exécution elle-même ne démarre pas automatiquement. |
| Chevron | Sert exclusivement au déploiement / repli de la carte. |
| Carte déployée | Affiche la liste des Activités ; aucun bouton `Ouvrir` ou `Démarrer` supplémentaire n’est affiché. |
| Menu `⋯` | Donne accès à Modifier, Dupliquer, Planifier, Archiver / Restaurer et Supprimer. |
| Modifier | Ouvre toujours l’écran Nom et couleur prérempli, puis la Composition. |
| Supprimer | Demande confirmation ; supprime aussi les Routines associées mais conserve les Exécutions enregistrées. |
| Archivage | Retire la Séance de `Toutes` et la rend accessible via `Archivées`. |

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

| Élément affiché | Type | Visible | Valeur / comportement | Action | Remarques |
| --- | --- | --- | --- | --- | --- |
| Titre / nom de la Séance | Texte | Toujours | Nom défini sur l’écran précédent | Retour vers Nom et couleur | Non modifiable directement ici |
| Résumé | Texte | Toujours | `N activité(s) · durée estimée` | Aucune | Mis à jour automatiquement |
| Bouton global `+` | Bouton | Toujours | Un seul bouton, à droite du résumé | Ajouter une Activité | Ajoute après la dernière Activité |
| Compte à rebours initial | Carte | Toujours | Valeur issue des Préférences | Modifier | Élément structurel |
| Cycle | Conteneur | Toujours | Un Cycle dans le MVP | Déployer / Replier | Fond distinct du Set |
| Répétitions Cycle `xN` | Contrôle | Toujours | `x1` par défaut | Ouvrir picker | Valeurs **1 à 99** ; juste à droite de `Cycle` |
| Set | Conteneur | Toujours | Un Set dans le MVP | Déployer / Replier | Même taille de titre que Cycle |
| Répétitions Set `xN` | Contrôle | Toujours | `x1` par défaut | Ouvrir picker | Valeurs **1 à 99** ; juste à droite de `Set` |
| Activité | Carte | Selon contenu | Ordre d’Exécution | Ouvrir options / déplacer | Aucune zone d’ajout intermédiaire |
| Fin de séance | Carte | Toujours | Valeur issue des Préférences | Modifier | Élément structurel |
| Valider les modifications | Bouton | Toujours | Actif si la Composition est valide | Valider | En création, poursuit vers Catégories |

### Règles fonctionnelles

| Règle | Description |
| --- | --- |
| Nom / couleur | La modification d’une Séance commence par l’écran Nom et couleur ; la Composition ne les édite pas directement. |
| Structure | Une nouvelle Séance possède un Compte à rebours initial, un Cycle contenant un Set et une Fin de séance. Les Activités peuvent être placées **avant le Cycle**, **dans le Set**, **après le Set et dans le Cycle**, ou **après le Cycle et avant la Fin de séance**. |
| Ajout global | Un seul bouton `+` ajoute l’Activité après la dernière Activité existante ; l’utilisateur peut ensuite la réordonner manuellement. |
| Cycle / Set | Le contrôle `xN` ouvre un picker ; aucun bouton `+ / −` n’est utilisé. |
| Hiérarchie | Cycle et Set utilisent des fonds suffisamment contrastés ; le titre Set a la même taille que Cycle. |
| Réorganisation | Les Activités peuvent être déplacées par glisser-déposer. |
| Validation | Une Séance doit contenir au moins un Exercice valide pour être exécutable. |
| Retour en création | Retour depuis la Composition revient à Nom et couleur en conservant la Composition ; Retour depuis Nom et couleur peut ouvrir la modale d’abandon et supprimer toute la création après confirmation. |
| Navigation | En création, la validation ouvre Catégories ; `Enregistrer la séance` revient au Catalogue. |

## Activité

### Eléments affichés

| Élément affiché           | Type              | Visible                            | Obligatoire | Valeur par défaut              | Contraintes                                    | Source   | Action         | Remarques                                                                                                                                                                                                                              |
| ------------------------- | ----------------- | ---------------------------------- | ----------- | ------------------------------ | ---------------------------------------------- | -------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bouton Retour             | Bouton            | Toujours                           | Oui         | Visible                        | Confirmation si modifications non enregistrées | Système  | Retour         |                                                                                                                                                                                                                                        |
| Titre de l'écran          | Texte             | Toujours                           | Oui         | "Ajouter une activité"            | Texte fixe                                     | Statique | Aucune         | En modification : "Modifier une activité"                                                                                                                                                                                                 |
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

| Règle             | Description                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Type Exercice     | Autorise les modes Durée et Répétitions.                                                                                                                                                                                                                                                                                                                                                   |
| Type Récupération | Nom pré-rempli "Récupération". Le mode d'exécution est masqué.                                                                                                                                                                                                                                                                                                                             |
| Mode Durée        | Affiche le sélecteur de durée.                                                                                                                                                                                                                                                                                                                                                             |
| Mode Répétitions  | Affiche le champ "Nombre de répétitions".                                                                                                                                                                                                                                                                                                                                                  |
| Séries            | Un Exercice possède un nombre de Séries propre, supérieur ou égal à 1. Une Série répète la durée ou le nombre de répétitions défini pour l'Exercice puis sa pause éventuelle.                                                                                                                                                                                                              |
| Pause après Série | Disponible uniquement pour les Exercices. Lorsqu’une durée est renseignée, l’application crée techniquement une activité de type `Récupération`, liée à l’Exercice et utilisée après chaque Série. Après la dernière Série, elle est omise si l'étape suivante du plan d'exécution est une Récupération explicite. Cette activité technique reste masquée dans l’interface de composition. |
| Zones corporelles | Disponibles uniquement pour une activité de type Exercice ; sélection multiple parmi le référentiel prédéfini. L'utilisateur ne peut ni créer, ni renommer, ni supprimer une Zone corporelle dans le MVP.                                                                                                                                                                                  |
| Récupération      | La section Zones corporelles est masquée.                                                                                                                                                                                                                                                                                                                                                  |
| Validation        | Impossible tant que les champs obligatoires ne sont pas renseignés.                                                                                                                                                                                                                                                                                                                        |
| Retour            | Si des modifications non enregistrées existent, une confirmation est demandée.                                                                                                                                                                                                                                                                                                             |
## Exécution d'une séance

### Éléments affichés

| Élément affiché | Type | Visible | Obligatoire | Valeur / comportement | Source | Action | Remarques |
| --- | --- | ---: | ---: | --- | --- | --- | --- |
| Titre de la séance | Texte | Toujours | Oui | Nom de la séance | Séance | Aucune | En-tête |
| Nom de l’Activité courante | Texte | Toujours | Oui | Activité courante | Plan d’Exécution | Aucune | |
| Série | Texte | Exercice | Non | `x/y` | Plan d’Exécution | Aucune | Paramètre propre à l’Exercice |
| Temps de l’Activité | Minuteur | Toujours | Oui | Compte à rebours si chronométrée ; chronomètre croissant si Répétition | Exécution | Aucune | |
| Cercle du minuteur | Indicateur | Toujours | Oui | Progression temporelle | Exécution | Aucune | En Répétition : un tour par minute |
| Set / Cycle | Texte | Toujours | Oui | `Set x/y • Cycle x/y` | Plan d’Exécution | Aucune | |
| À suivre | Texte | Sauf dernière Activité | Non | Nom + durée/reps de l’Activité suivante | Plan d’Exécution | Aucune | |
| Réinitialiser | Bouton | Pendant Exécution | Oui | Actif | Statique | Ouvrir confirmation | Réinitialise l’Activité courante |
| Pause | Bouton | Pendant Exécution | Oui | Actif | Statique | Suspendre | Suspend aussi le chrono croissant en Répétition |
| Activité suivante | Bouton | Pendant Exécution | Oui | Actif | Statique | Passer à la suite | Fin normale en Répétition ; confirmation avant terme pour une Activité chronométrée |
| Temps total | Texte + barre | Toujours | Oui | Temps écoulé / estimé | Exécution | Aucune | |
| Bips / annonces | Icônes / états | Toujours | Oui | Selon Préférences | Préférences | Activer / désactiver | |

### Règles fonctionnelles

| Règle | Description |
| --- | --- |
| Ouverture | Ouvrir l’écran d’Exécution ne démarre pas automatiquement la première Activité. |
| Exercice chronométré | Compte à rebours. `Activité suivante` avant zéro demande confirmation et enregistre l’Activité comme `Partielle`. |
| Exercice en Répétition | Chronomètre croissant ; le cercle effectue un tour par minute ; bip fixe à chaque minute ; `Pause` suspend chrono et cercle ; `Activité suivante` termine normalement l’Exercice. |
| Réinitialisation | Demande confirmation et remet l’Activité courante à son état initial sans revenir à une Activité antérieure. |
| Pause / arrêt | `Pause` ouvre la modale permettant `Reprendre la séance` ou `Arrêter la séance`. Aucun bouton Arrêter direct n’est présent sur l’écran. |
| Navigation | L’utilisateur ne revient pas à une Activité déjà exécutée. |
| Étapes | Aucun compteur d’« étapes » n’est affiché dans le MVP. |

### Sons et annonces

- bip pendant les trois dernières secondes d’une Activité chronométrée selon les règles audio ;
- annonce vocale du nom de l’Activité au démarrage ;
- pour un Exercice en Répétition, bip fixe à chaque minute écoulée dans le MVP.

## Synthèse de séance

### Eléments affichés

| Élément affiché       | Type             |  Visible | Obligatoire | Valeur par défaut                                    | Contraintes                 | Source      | Action         | Remarques                            |
| --------------------- | ---------------- | -------: | ----------: | ---------------------------------------------------- | --------------------------- | ----------- | -------------- | ------------------------------------ |
| Titre de la séance    | Texte            | Toujours |         Oui | Nom de la séance                                     | 1 à 80 caractères           | Séance      | Aucune         | En-tête fixe                         |
| Carte Statut          | Carte            | Toujours |         Oui | Visible                                              | Une seule                   | Séance      | Aucune         |                                      |
| Icône de statut       | Icône            | Toujours |         Oui | ✓                                                    | Terminée, Partielle ou Interrompue     | Séance      | Aucune         | Couleur selon le statut              |
| Libellé du statut     | Texte            | Toujours |         Oui | Séance terminée                                      | Terminée, Partielle ou Interrompue     | Séance      | Aucune         |                                      |
| Date / heure de fin   | Texte            | Toujours |         Oui | Date courante                                        | Format local                | Séance      | Aucune         |                                      |
| Carte Votre séance    | Carte            | Toujours |         Oui | Visible                                              | Une seule                   | Séance      | Aucune         |                                      |
| Durée réelle          | Durée            | Toujours |         Oui | Calculée                                             | Temps réellement exécuté    | Séance      | Aucune         |                                      |
| Nombre d'activités    | Valeur           | Toujours |         Oui | Calculé                                              | X / Y                       | Séance      | Aucune         |                                      |
| Activités partiellement réalisées | Texte | Si > 0 | Non | Masqué | `n activité(s) partiellement réalisée(s)` | Séance | Aucune | Libellé UI ; le statut métier de l’Activité reste `Partielle` |
| Question de ressenti  | Texte            | Toujours |         Oui | Texte fixe                                           |                             | Statique    | Aucune         |                                      |
| Mention "Obligatoire" | Texte            | Toujours |         Oui | Visible                                              | Texte fixe                  | Statique    | Aucune         |                                      |
| Choix du ressenti     | Sélecteur        | Toujours |         Oui | Aucun sélectionné                                    | Une seule sélection         | Utilisateur | Sélection      | MVP : 3 niveaux                      |
| Titre Commentaire     | Texte            | Toujours |         Oui | Texte fixe                                           |                             | Statique    | Aucune         |                                      |
| Mention "Facultatif"  | Texte            | Toujours |         Oui | Visible                                              | Texte fixe                  | Statique    | Aucune         |                                      |
| Champ Commentaire     | Texte multiligne | Toujours |         Non | Vide                                                 | **200 caractères max**      | Utilisateur | Saisie         | Environ 2 à 3 lignes                 |
| Bouton Terminer       | Bouton           | Toujours |         Oui | Désactivé tant que le ressenti n'est pas sélectionné | Une seule action            | Statique    | Aller au Suivi | Enregistre définitivement la séance  |
### Règles fonctionnelles
| Règle               | Description                                                                      |
| ------------------- | -------------------------------------------------------------------------------- |
| Durée affichée      | Toujours la durée réellement exécutée.                                           |
| Sets / Cycles      | Non affichés dans le MVP.                                                        |
| Activités partiellement réalisées | Affichées uniquement si leur nombre est supérieur à zéro ; `Partielle` reste le terme métier. |                        |
| Ressenti            | Obligatoire dès lors que la Synthèse est présentée ; peut être absent après une interruption technique sans Synthèse.                                            |
| Commentaire         | Facultatif, **200 caractères maximum**.                                                                      |
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
| Fin de séance par défaut            | Sélecteur durée | Toujours |         Oui | 0 s                        | 0 à 99 min 59 s                 | Préférences | Modifier             | 0 s = phase instantanée                              |
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
| Compte à rebours initial | Définit la durée proposée par défaut lors de la création d'une nouvelle séance. Une valeur de 0 s rend la phase instantanée sans la supprimer de la structure. |
| Fin de séance            | Définit la durée proposée par défaut lors de la création d'une nouvelle séance. Une valeur de 0 s rend la phase instantanée sans la supprimer de la structure.            |
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

## Planifier une séance

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
| Arrêter une séance en cours                      | Oui               | Continuer / Arrêter     | Enregistre une exécution interrompue                                     |
| Archiver une séance                              | Non               | Snackbar + Annuler      | Déplace la séance dans les archives                                    |
| Restaurer une séance                             | Non               | Snackbar + Annuler      | Replace la séance dans le catalogue                                    |
| Supprimer une catégorie                          | Oui (si utilisée) | Annuler / Supprimer     | Retire la catégorie des Séances concernées ; les Instantanés historiques restent inchangés |
| Réinitialiser les préférences                    | Oui               | Annuler / Réinitialiser | Restaure les préférences par défaut                                    |
| Supprimer l'historique                           | Oui               | Annuler / Supprimer     | Supprime toutes les exécutions enregistrées                            |
| Quitter la création d'une séance non enregistrée | Oui               | Continuer / Quitter     | Abandonne la création                                                  |


