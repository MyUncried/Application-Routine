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

1. saisie du nom, sélection de la couleur et construction de la Composition dans l’écran unique `Composition d’une séance` ;
2. sélection des catégories ;
3. retour au Catalogue des séances.

À l'issue de cette création, la séance est immédiatement disponible dans le catalogue.

Aucune routine n'est créée automatiquement.

## 2.3 Modification d'une séance

Une séance peut être modifiée à tout moment depuis le catalogue des séances.

La modification d’une Séance ouvre directement l’écran unique `Composition d’une séance`, prérempli avec le nom, la couleur et les Activités. Les modifications sont enregistrées selon les validations explicites prévues par les écrans.

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

- le nom de la séance avec le suffixe disponible suivant : `(copie)`, puis `(copie 2)`, `(copie 3)`, etc. ;
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

## 2.9 État persistant et qualificatifs d'une séance

Le statut persistant d’une Séance est binaire : `Active` ou `Archivée`.

| Notion | Nature | Description |
| --- | --- | --- |
| En création | État temporaire du brouillon | La Séance n’est pas encore persistée. Ce n’est pas une valeur du statut de la Séance. |
| Active | Statut persistant | La Séance est disponible dans le Catalogue et peut être exécutée ou planifiée. |
| Archivée | Statut persistant | La Séance est retirée du Catalogue actif ; elle peut être restaurée ou supprimée définitivement depuis les archives. |
| Planifiée | Qualificatif dérivé, non exclusif | Au moins une Routine active référence la Séance. |
| Exécutée | Qualificatif dérivé, non exclusif | Au moins une Exécution existe dans le Suivi. |

Une Séance peut donc être simultanément `Active`, planifiée et déjà exécutée. `Supprimée` n’est pas un statut persistant : après suppression définitive, la Séance n’existe plus ; les Exécutions historiques restent consultables à partir de leurs Instantanés.
# 3. Composition d'une séance

## 3.1 Principe général

Une séance est constituée d'un ensemble d'activités organisées dans un ordre d'exécution précis.

L'utilisateur construit librement sa séance en ajoutant, modifiant, supprimant ou réorganisant ces activités.

La structure d'une séance est entièrement définie par son contenu. Aucun comportement implicite n'est ajouté automatiquement par l'application.

## 3.2 Structure d'une séance

Une séance est composée, dans l'ordre, des éléments suivants :

1. un compte à rebours initial ;
2. un Cycle technique unique contenant, dans l’ordre, les Activités placées avant le Tour, un Tour unique et les Activités placées après le Tour ;
3. une fin de séance.

Le Compte à rebours initial et la Fin de séance sont des éléments structurels obligatoires et ne constituent pas des Activités. Leur durée peut être égale à 0 s.

Le compte à rebours initial est exécuté une seule fois au démarrage de la séance.

Les Activités placées après le Tour sont exécutées une seule fois, après la dernière répétition du Tour et avant la Fin de séance.

Une séance contient obligatoirement un Cycle et un Tour et doit contenir au minimum une Activité pour être exécutable.

## 3.3 Les activités

Une activité représente une étape élémentaire de la séance.

Chaque activité est indépendante des autres.

Une activité possède notamment :

- un nom ;
- une durée cible, un nombre de répétitions cible ou le mode À l’échec sans cible chiffrée ;
- une **Pause entre Séries** facultative, appliquée après chaque Série lorsque `R = 0`, ou uniquement entre Séries successives lorsque `R > 0` ;
- une **Récupération** facultative, exécutée une fois après tous les côtés pour une Activité autonome, ou une fois par passage de côté dans un Tour bilatéral ;
- une Description et des Zones corporelles d’exécution facultatives ;
- des Médias dans le périmètre cible post-T04. Dans le MVP, l’action `Ajouter un média` reste visible mais désactivée et la section Médias n’est pas affichée.

Les activités sont exécutées dans l'ordre où elles apparaissent dans la séance.

## 3.4 Modes et récupération d’une Activité

Le modèle cible ne possède pas de type d’Activité `Exercice` ou `Récupération`. Toute Activité correspond à une action réalisée par l’utilisateur.

Elle peut être définie :

- par une durée ;
- par un nombre de répétitions ;
- jusqu’à l’échec, sans durée ni nombre de répétitions cibles.

Elle peut être associée à une ou plusieurs zones corporelles.

La Récupération est un paramètre de durée facultatif de l’Activité. Sa valeur canonique est `0 s`. Lorsqu’elle est strictement positive, le Plan d’Exécution insère une phase chronométrée `RECOVERY` immédiatement après la dernière Série de l’Activité. Cette phase ne constitue pas une Activité et n’augmente pas le nombre d’Activités affiché.

Une Activité dont le nom ou l’intention fonctionnelle est « Récupération » reste possible : elle utilise le même modèle et les mêmes modes que toute autre Activité ; aucun traitement particulier n’est associé à son nom.

## 3.5 Tours

Un Tour est un conteneur regroupant plusieurs activités exécutées dans un ordre déterminé.

Dans le MVP, chaque cycle contient un seul Tour.

Les activités d'un Tour peuvent être réorganisées librement.

Le Tour constitue principalement un élément fonctionnel de structuration. Son maintien dans le vocabulaire visible par l'utilisateur pourra être réévalué ultérieurement.

## 3.6 Cycles

Un cycle permet de répéter un Tour un nombre défini de fois.

Dans le MVP :
- une Séance contient exactement un Cycle ;
- le Cycle contient exactement un Tour ;
- le Cycle possède son propre nombre de répétitions ;
- le Tour possède son propre nombre de répétitions ;
- le Cycle technique est exécuté une fois ; le Tour est exécuté selon son nombre de répétitions, de 1 à 99.

Dans une version ultérieure, une Séance pourra comporter plusieurs Cycles et un Cycle pourra comporter plusieurs Tours.
## 3.7 Réorganisation

Les activités peuvent être :

- ajoutées ;
- supprimées ;
- dupliquées ;
- déplacées.

Leur ordre d'exécution correspond toujours à leur position dans la séance.

La réorganisation est enregistrée automatiquement.

## 3.8 Validation

Une séance est considérée comme valide lorsqu'elle contient au minimum une Activité.

Une activité est valide lorsque toutes les informations obligatoires correspondant à son type sont renseignées.

Les activités incomplètes sont signalées à l'utilisateur.

Une séance incomplète peut être enregistrée mais ne peut pas être exécutée.

## 3.9 Estimation

À chaque modification, l'application recalcule automatiquement :

- la **durée estimée d’exécution** ;
- la **durée synthétique des Activités** ;
- le **nombre d'Activités de la Composition**.

### Durée estimée d’exécution

La durée estimée d’exécution correspond à la somme de toutes les durées déterminables de l'Exécution complète construite à partir de la Composition. Elle est utilisée sur l’écran d’Exécution.

Le calcul tient compte :

- du Compte à rebours initial et de la Fin de séance ;
- de toutes les occurrences d'Activités chronométrées ;
- des Pauses entre Séries effectivement insérées dans le plan ;
- de la Récupération facultative exécutée une fois après chaque occurrence d’Activité ;
- des Séries ;
- des répétitions du Tour ;
- des répétitions du Cycle ;
- de la position structurelle de chaque Activité dans la Séance.

Un Exercice en mode Répétitions ou À l’échec ne reçoit **aucune durée conventionnelle** dans ce calcul.

- Si toutes les durées sont déterminables, la durée est affichée normalement, par exemple `18 min`.
- Si au moins un Exercice est en mode Répétitions ou À l’échec, la somme des durées connues constitue une **borne minimale** et l’interface affiche le signe `≥`, par exemple `≥ 18 min`.

### Durée synthétique des Activités

La durée synthétique des Activités est affichée sur les cartes du Catalogue et sous `Nombre de tours` dans la Composition. Elle applique les mêmes règles de développement des Séries, Pauses entre Séries, Récupérations attachées, répétitions du Tour et positions structurelles, mais porte exclusivement sur les Activités et leurs phases attachées. Elle exclut toujours le Compte à rebours initial et la Fin de séance.

Si elle comprend un Exercice en mode Répétitions ou À l’échec, elle additionne uniquement les temps connus de son périmètre et devient une borne minimale précédée de `≥`. Son affichage en minutes est arrondi à la minute supérieure.

### Nombre d'Activités de la Composition

Le nombre d'Activités de la Composition correspond au nombre de cartes d’Activité explicitement définies dans la Composition.

Il :

- ne tient pas compte des répétitions liées aux Séries, Tours ou Cycles ;
- ne comptabilise ni les Pauses entre Séries ni les phases `RECOVERY` attachées.

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

Le Cycle technique est exécuté une seule fois. Le Tour répète automatiquement son contenu jusqu’à atteindre son nombre de répétitions défini.

Les Activités placées après le Tour sont exécutées une seule fois après la dernière répétition du Tour.

Lorsque la dernière Activité est terminée, le Plan passe à la phase structurelle `SESSION_END`. La Séance n’est considérée comme terminée qu’après l’achèvement de cette phase.

## 4.4 Informations affichées

Pendant l'Exécution, l'écran affiche principalement :

- le nom de l'Activité en cours ;
- la Série courante sous la forme `x/y` lorsqu'il s'agit d'un Exercice ;
- le temps de l’Activité : compte à rebours pour une Activité chronométrée, chronomètre croissant pour un Exercice en Répétitions ou À l’échec ;
- la Série et le Tour en cours ; le Cycle n’est jamais affiché ;
- l'Activité suivante et sa durée lorsqu'elle est connue ;
- les commandes Réinitialiser, Pause et Activité suivante ;
- le temps total écoulé / durée estimée d’exécution et sa barre de progression.

La notion d'« étape » n'est pas affichée comme indicateur de progression dans le MVP.

### Temps écoulé et durée réelle

Le **temps total écoulé** correspond au temps actif réellement passé dans l'Exécution depuis son démarrage effectif, en excluant les périodes pendant lesquelles l'utilisateur a placé la Séance en Pause.

Il inclut notamment :

- le temps réellement passé dans les Exercices en mode Répétitions ou À l’échec ;
- les Activités chronométrées ;
- les Pauses entre Séries effectivement exécutées ;
- les phases `RECOVERY` attachées aux Activités ;
- les phases chronométrées du Compte à rebours initial et de la Fin de séance.

La **durée réelle** enregistrée à la fin de l'Exécution suit la même règle : les périodes de Pause utilisateur en sont exclues.

### Barre de progression globale

La barre couvre le Plan d’Exécution complet : le Compte à rebours initial et la Fin de séance `SESSION_END` participent à son avancement. Elle ne peut atteindre `100 %` qu’à l’achèvement de `SESSION_END`. Dans T03, les étapes chronométrées sont pondérées proportionnellement à leur durée planifiée ; les occurrences en Répétitions ou À l’échec suivent la pondération hybride de RM-077 et leur part est acquise lorsque l’utilisateur touche `Suivant`. Les Pauses manuelles n’augmentent pas le remplissage.

La progression mathématique de la barre est continue. Sa piste est toutefois structurée visuellement par Tours conformément au prototype Figma. Ces séparations sont uniquement des repères de lecture et ne modifient ni les poids ni le calcul de l’avancement global.

Son calcul s'appuie cependant sur les occurrences d'Activités du plan d'Exécution :

- `N` = nombre total d'Activités à exécuter dans le plan ;
- `R` = nombre d’occurrences d’Exercices sans durée cible, en mode Répétitions ou À l’échec ;
- `T` = somme des durées des occurrences d'Activités chronométrées du plan.

Chaque occurrence d’Exercice en mode Répétitions ou À l’échec reçoit un poids de `1 / N` dans la barre.

La part restante, `1 - R / N`, est répartie entre les occurrences d'Activités chronométrées proportionnellement à leur durée. Pour une Activité chronométrée de durée `d`, son poids est donc :

`(1 - R / N) × d / T`

Cas particuliers :

- si `R = 0`, la barre est entièrement proportionnelle aux durées ;
- si `R = N`, chaque Activité reçoit un poids de `1 / N` ;
- une Activité chronométrée en cours remplit progressivement sa part selon le temps écoulé sur sa durée cible ;
- un Exercice en mode Répétitions ou À l’échec conserve sa part non remplie pendant la Série puis la remplit entièrement lorsque l’utilisateur valide sa fin avec `Suivant` ;
- une Activité chronométrée passée avant son terme et enregistrée `Partielle` est considérée comme franchie dans l'avancement global : sa part est alors entièrement remplie ;
- `Pause` suspend la progression de la part courante ;
- `Réinitialiser` remet à zéro la progression interne de l'Activité courante sans modifier les parts déjà franchies.

La barre représente donc l'**avancement global dans le plan d'Exécution**. Elle n'est pas le simple rapport entre le temps total écoulé et la durée estimée d’exécution.

Pour un Exercice en mode Répétitions ou À l’échec, le cercle effectue une rotation complète par minute. Le chronomètre continue à croître au-delà d’une minute et un bip fixe est émis à chaque minute écoulée. Pause suspend le chronomètre et la rotation du cercle.

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
- **Suivant** → pour une Activité chronométrée avant son terme, confirmation afin d’éviter un passage involontaire et enregistrement `Partielle` si confirmé ; pour un Exercice en mode Répétitions ou À l’échec, fin normale de la Série sans confirmation ;
- **Pause** → aucune confirmation, l'action étant réversible ;
- **Arrêter la séance** → confirmation via le modal de pause.

Les confirmations protègent ainsi les actions ayant un impact irréversible sur la progression.

## 4.7 Passage à l'activité suivante

L’action **Suivant** a deux comportements selon le mode de l’Activité :

- pour une Activité chronométrée utilisée avant son terme, une confirmation est demandée ; après confirmation, l'Activité est enregistrée avec le statut **Partielle** ;
- pour un Exercice en mode Répétitions ou À l’échec, l’action constitue la fin normale de la Série courante et ne crée pas de statut Partielle.

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

### Arrière-plan et verrouillage

Le passage en arrière-plan ou le verrouillage de l’écran ne constitue pas une mise en pause utilisateur. Le Plan d’Exécution continue selon ses horodatages de référence. Au retour, l’application reconstitue l’Activité et la position temporelle qui auraient dû être atteintes ; elle ne reprend pas un compteur figé.

Une pause de sécurité est appliquée si aucune interaction n’a eu lieu :

- 30 minutes après la fin théorique d’une Activité chronométrée ;
- 2 heures après le démarrage d’un Exercice en Répétitions ou À l’échec.

La pause de sécurité conserve l’état recalculé au moment de son déclenchement et demande à l’utilisateur de reprendre ou d’arrêter la Séance.

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

Lorsque la dernière Activité est terminée, la phase chronométrée `SESSION_END` démarre. Lorsqu’elle est configurée à `0 s`, elle s’achève immédiatement. Ce n’est qu’après son achèvement que :

- l’Exécution est clôturée et enregistrée dans l'historique ;
- son statut est déterminé automatiquement ;
- l'écran de Synthèse est affiché.

Le statut de l'exécution est déterminé selon les règles suivantes :

| Statut      | Description                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Terminée    | Toutes les Activités ont été terminées normalement et `SESSION_END` a été achevée. |
| Partielle   | `SESSION_END` a été achevée, mais au moins une Activité a été interrompue ou ignorée. |
| Interrompue | L’Exécution a été arrêtée avant l’achèvement de `SESSION_END`, y compris pendant cette phase. |

## 4.12 Historique d'exécution

Chaque exécution enregistre notamment :

- la date et l'heure de début ;
- la durée réelle ;
- le statut de l'exécution ;
- le ressenti de l'utilisateur ;
- l’instantané fonctionnel de la séance ;
- les informations propres à chaque activité exécutée.

Cet instantané est suffisamment complet pour restituer la structure, les paramètres et les libellés de la Séance exécutée, mais il reste volontairement léger. En V2, il conserve les associations média ordonnées et leurs références stables sans dupliquer les fichiers physiques.

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
    - **Aucune** : une seule occurrence est planifiée à la date définie ;
    - **Périodique** : dans le MVP, la Séance est répétée selon une périodicité hebdomadaire définie par une fréquence en semaines ;
- pour une planification périodique :
    - la fréquence en semaines, supérieure ou égale à 1 ;
    - un ou plusieurs jours de la semaine ;
    - une date de fin obligatoire ;
- un rappel facultatif, avec **0 ou 1 rappel maximum** par Routine.

La présentation UI est compacte : `Date de début` et `Heure` sont des libellés de blocs au même niveau visuel, sans titre intermédiaire `Quand ?`. Pour une répétition hebdomadaire, l'écran affiche `Toutes les`, puis `X semaine(s) jusqu'au <date>`, avec les jours sélectionnés en dessous.

Le choix du rappel est extensible. `Aucun` et `Personnalisé` sont des options fixes, toujours visibles. Les délais rapides prédéfinis sont une collection ordonnée affichée dans une zone horizontale défilante entre ces deux options. Le MVP initialise cette collection avec `5 min`, `15 min`, `30 min` et `1 h`. L’ajout ultérieur d’un délai rapide ne modifie ni le modèle de données — toujours zéro ou un rappel — ni l’accessibilité des options fixes.

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

Une occurrence future peut être exécutée en avance depuis l’action **Démarrer** affichée sur sa carte.

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
- la structure ordonnée des Cycles, Tours et Activités ;
- les paramètres fonctionnels nécessaires de chaque Activité ;
- les zones corporelles nécessaires à la restitution fidèle de l’historique ;
- la Fin de séance ;
- les paramètres nécessaires à la génération du plan d’exécution.

Les médias, absents du MVP, ne seront pas copiés dans l’Instantané lors de leur introduction ultérieure.

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
|Terminée|Toutes les Activités ont été terminées normalement et `SESSION_END` a été achevée.|
|Partielle|La séance est arrivée à son terme, mais au moins une activité chronométrée a été interrompue avant la fin de sa durée.|
|Interrompue|La séance a été arrêtée avant la fin de son exécution.|

Le statut est déterminé automatiquement lors de la fin de la séance.

## 6.5 Consultation de l'historique

L'utilisateur peut consulter son historique depuis l'écran **Suivi**.

Les séances exécutées sont présentées sous forme de liste chronologique.

Pour les Exécutions enregistrées, l'utilisateur peut :

- rechercher une Exécution ;
- modifier l’ordre chronologique d’affichage.

Dans le MVP, les cartes peuvent être condensées ou déployées individuellement. Le détail d’une Exécution est présenté directement dans la carte déployée.

## 6.6 Recherche

La recherche est effectuée sur :

- le nom de la séance ;
- les catégories ;
- les zones corporelles.

Les résultats sont mis à jour au fur et à mesure de la saisie.

## 6.7 Filtres

Les filtres avancés du Suivi ne font pas partie du MVP. Ils sont reportés à une version ultérieure.

## 6.8 Tri

Le Suivi permet d’inverser l’ordre chronologique des Exécutions :

- plus récent au plus ancien ;
- plus ancien au plus récent.

Par défaut, les Exécutions sont triées de la plus récente à la plus ancienne. Les autres critères de tri sont reportés à une version ultérieure.

## 6.9 Déploiement du détail

Chaque Exécution peut être déployée individuellement dans le MVP afin d’afficher son détail directement dans la carte.

Aucun bouton **Déployer tout / Replier tout** n'est affiché ; le déploiement est géré carte par carte.

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
- le suivi privilégie une consultation rapide grâce à des cartes condensées ou déployées individuellement ; `Vue d’ensemble`, `Filtrer` et `Trier` restent visibles mais désactivés ;
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
| Filtre `Non planifiées` | Filtre | Toujours | Séances actives ne possédant aucune Routine | Filtrer |
| Filtre `Archivées` | Filtre | Toujours | Séances archivées uniquement | Filtrer |
| Carte Séance | Carte | 1 par Séance | Condensée ou déployée | Zone principale : ouvrir la Séance en modification |
| Chevron | Bouton | Toujours | Droite si replié, bas si déployé | Déployer / Replier uniquement |
| Nom de la Séance | Texte | Toujours | Nom enregistré | Aucune action spécifique distincte de la zone principale |
| Métadonnées Catégories/Zones | Texte | Si au moins un groupe existe | Catégories puis ` : ` puis union dédupliquée des Zones corporelles ; une seule ligne tronquée | Aucune |
| Nombre d’Activités / durée | Texte | Toujours | Nombre d’Activités et durée synthétique des Activités calculés ; Compte à rebours initial et Fin de séance exclus | Aucune |
| Tour | Texte | Toujours | Nombre de répétitions calculé | Aucune |
| Dernière Exécution | Texte | Si disponible | Date relative | Aucune |
| Prochaine occurrence | Texte | Si planifiée | Date / heure relative | Aucune |
| Liste des Activités | Liste | Carte déployée | Ordre de la Séance | Aucune |
| Résumé d’Activité | Texte | Carte déployée | À droite : `durée/reps · xN` ; `xN` seulement si N > 1 | Aucune |

### Règles fonctionnelles

| Règle | Description |
| --- | --- |
| Chargement | Les Séances sont affichées dès l’ouverture de l’écran. |
| Recherche globale | Deux états, saisie puis résultats ; une Séance peut apparaître comme Catalogue, Planifiée, Exécutée ou Archivée. Retour est contextuel à l’écran d’origine. |
| `Toutes` | Affiche toutes les Séances non archivées. |
| `Planifiées` | Affiche les Séances disposant d’au moins une Routine. |
| `Archivées` | Affiche uniquement les Séances archivées. |
| Zone principale de la carte | Ouvre directement la Séance en mode modification. |
| Métadonnées | Sous le nom, affiche les Catégories associées puis, si présentes, les Zones corporelles dédupliquées de tous les Exercices ; séparateur ` : ` seulement lorsque les deux groupes existent ; une seule ligne tronquée si nécessaire. |
| Chevron | Sert exclusivement au déploiement / repli de la carte. |
| Carte déployée | Affiche la liste des Activités ; la zone `Démarrer` conserve son action propre. |
| Actions d’une Séance active | Un glissement gauche révèle `Planifier`, `Dupliquer` et `Archiver`. |
| Modifier | Toucher la zone principale ouvre la Composition préremplie. |
| Supprimer | Disponible uniquement après archivage. Dans `Archivées`, un glissement gauche superpose `Supprimer` à la carte sans la déplacer, puis ouvre une confirmation. Les Exécutions historiques sont conservées. |
| Archivage | Retire la Séance de `Toutes` et la rend accessible via `Archivées`. |

## Composition d’une séance — création et modification

Le nom, la couleur et la Composition sont réunis dans le même écran.

### Éléments affichés

| Élément | Comportement et règle |
| --- | --- |
| Nom de la séance | Champ obligatoire de 1 à 80 caractères. |
| Couleur | Une valeur est proposée par défaut ; palette de 12 couleurs en grille 4 × 3. |
| Compte à rebours initial | Élément structurel ; roulette minutes/secondes intégrée ; valeur initiale 10 s. |
| Tour | Seul conteneur affiché ; `1` par défaut, réglable de 1 à 99 par roulette native compacte à une colonne. Son en-tête affiche `Nombre de tours`, la synthèse calculée des activités et le contrôle déclencheur `66 × 34`, aligné sur le bord droit des cartes. La valeur est affichée sans `x` ni `×`, l’icône utilise `#CDCEFA` comme dans `2028:12003`, et aucun chevron de repli n’est visible. |
| Activités | Cartes ordonnées de `354 × 69` sans Récupération ou blocs `354 × 93` avec sous-carte attachée via `Composition / Activity Row with Recovery` (`3572:64`). Chaque carte affiche le nom, les Zones corporelles séparées par ` · ` en texte secondaire monochrome, puis la synthèse. Aucune Catégorie de Séance n’est affichée. Toucher ouvre la modification ; glisser à gauche révèle des actions couvrant le bloc ; un appui long déplace le bloc complet. Dupliquer copie notamment Pause et Récupération avec le suffixe `(copie)` puis numéroté. |
| Fin de séance | Élément structurel ; roulette minutes/secondes intégrée ; valeur initiale 5 s. |
| Résumé | `N activité(s) · durée des Activités`, placé dans l’en-tête du conteneur Tour immédiatement sous `Nombre de tours`. Le nombre porte sur les Activités seulement ; la durée inclut leurs Pauses entre Séries et Récupérations attachées. Le Compte à rebours initial et la Fin de séance en sont toujours exclus. À l'état vide, affiche exactement `0 activité · 0 min`, au singulier — exception locale à cet écran (D-091). |
| Ajouter une activité | Un seul bouton secondaire `+ Ajouter une activité`, placé en haut. |
| Continuer | Désactivé lorsque le nom est vide, qu’aucune couleur n’est sélectionnée ou qu’aucune Activité valide n’est présente ; ouvre les Catégories. |

Le Cycle reste présent dans le modèle avec une répétition toujours égale à 1, mais il n’est jamais affiché ni modifiable dans le MVP. La condition métier d’exécutabilité demeure la présence d’au moins une Activité valide.

Le Compte à rebours initial et la Fin de séance conservent chacun leur propre valeur confirmée et leur propre brouillon. L’ouverture copie la dernière valeur confirmée dans le brouillon ; le défilement ne modifie ni la carte ni la synthèse intégrée au Tour. Annuler abandonne le brouillon. Confirmer enregistre exactement les minutes et secondes centrées, puis actualise seulement la carte structurelle concernée. La synthèse sous `Nombre de tours` reste inchangée, car elle exclut ces deux éléments structurels hors Tour. Les secondes couvrent `00` à `59` avec un pas de `1`.

Dans la variante d’actions glissées (`2028:11808`), la liste conserve l’origine verticale canonique `y = 92` sous l’en-tête fixe. Avec Récupération, le groupe d’actions est superposé à droite du bloc et mesure `144 × 93` : `Dupliquer` et `Supprimer` occupent chacun `72 × 93`. Sans Récupération, les hauteurs restent `69`. Le bloc ne se déplace pas et les libellés restent centrés.

Dans la variante d’appui long (`3518:4576`), le bloc actif avec Récupération mesure `362 × 97` au lieu de `354 × 93` et reste centré dans la section à `x = 6`. Son fond reprend le bleu du bandeau supérieur ; le cadre interne devient transparent. Le contour est `1` point `#D1D1D6`, le rayon `12`, et l’ombre périphérique utilise `#14171F` à `22 %`, décalage `0 / 0`, flou `10`, étalement `2`. Cet état n’est ni une sélection persistante ni une modification de données.

Retour pendant une nouvelle création ouvre le dialogue centré `Abandonner la création ?`. `Annuler` conserve les données ; `Confirmer`, action destructive rouge, les supprime. Pour une Séance existante, Retour ne supprime jamais la Séance.

## Catégories de la séance

### Éléments affichés

| Élément affiché | Type | Visible | Obligatoire | Valeur par défaut | Contraintes | Source | Action | Remarques |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bouton Retour | Bouton | Toujours | Oui | Visible | Revient à la composition | Système | Retour | |
| Titre de l’écran | Texte | Toujours | Oui | « Catégories de la séance » | Texte fixe | Statique | Aucune | En-tête fixe |
| Catégories proposées | Tags | Toujours | Non | Aucune sélection | Sélection multiple | Catégorie | Sélectionner / Désélectionner | Prédéfinies selon `displayOrder`, puis personnalisées par date de création croissante ; une sélection ne change pas l’ordre |
| Bouton Créer une catégorie | Bouton | Toujours | Non | Visible | Nom non vide après trim, maximum `40` caractères, unique après normalisation | Statique | Créer | Ajoute une catégorie personnalisée ; si le nom normalisé existe déjà, sélectionne l’existante |
| Bouton Enregistrer la séance | Bouton | Toujours | Oui | Actif | La séance doit être valide | Statique | Enregistrer | Retourne à Catalogue de séances |

### Règles fonctionnelles

| Règle | Description |
| --- | --- |
| Caractère facultatif | Une séance peut être enregistrée sans catégorie. |
| Sélection multiple | Une séance peut être associée à zéro, une ou plusieurs catégories. |
| Création d’une catégorie | La saisie est intégrée dans l’écran avec `Nom de la catégorie`, `Annuler` et `Ajouter` ; la nouvelle Catégorie est ajoutée au brouillon et sélectionnée automatiquement, sans persistance avant l’enregistrement final. |
| Apparence par défaut | Dans le MVP, une Catégorie personnalisée reçoit automatiquement l’icône officielle KODJO et la couleur `color.background` (`#FFFFFF`). Aucun contrôle ne permet de modifier ces valeurs. |
| Existence et sélection temporaires | Une Catégorie `NEW` désélectionnée reste dans le brouillon, demeure visible et peut être resélectionnée sans doublon ; existence et sélection sont conservées séparément pendant la navigation Catégories ↔ Composition. |
| Retour | Revient à la composition sans supprimer la séance ni ses modifications déjà validées. |
| Enregistrement | Persiste dans une transaction unique la Séance complète, les nouvelles Catégories sélectionnées du brouillon et leurs associations, puis ramène au Catalogue de séances. |
| Échec d’enregistrement | Reste sur l’écran, conserve le brouillon complet, réactive l’action et affiche `La séance n’a pas pu être enregistrée. Réessayez.` ; aucune donnée partielle n’est conservée. |
| Réorganisation | Aucune réorganisation manuelle des Catégories dans le MVP. |


## Activité

### Eléments affichés

| Élément affiché           | Type              | Visible                            | Obligatoire | Valeur par défaut              | Contraintes                                    | Source   | Action         | Remarques                                                                                                                                                                                                                              |
| ------------------------- | ----------------- | ---------------------------------- | ----------- | ------------------------------ | ---------------------------------------------- | -------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bouton Retour             | Bouton            | Toujours                           | Oui         | Visible                        | Confirmation si modifications non enregistrées | Système  | Retour         |                                                                                                                                                                                                                                        |
| Titre de l'écran          | Texte             | Toujours                           | Oui         | "Ajouter une activité"            | Texte fixe                                     | Statique | Aucune         | En modification : "Modifier une activité"                                                                                                                                                                                                 |
| Nom                       | Champ texte       | Toujours                           | Oui         | Vide                           | 1 à 80 caractères | Activité | Saisie | Premier élément du bandeau bleu ; même hauteur et alignement que `Nom de la séance` en Composition |
| Ajouter un média          | Bouton            | Toujours                           | Oui dans le rendu | Désactivé dans le MVP | Centré horizontalement ; devient actif dans la cible post-T04 | Statique | Ajouter | `Action / Add Media — Source exact` (`3382:60`) ; icône vectorielle `icon/ajouter` (`3382:61`) en `16 × 16`, jamais le caractère `+` ; placé sous Nom ; aucune section Médias dans le MVP |
| Description de l’activité | Section repliable + texte multiligne | Toujours ; repliée par défaut | Non | Vide | 1000 caractères max | Activité | Déployer / saisir | Le titre ou son chevron ouvre et referme le champ ; la valeur est conservée au repli |
| Zone corporelle d’exécution | Section repliable + tags | Toujours ; repliée par défaut | Non | Aucune | Sélection multiple | Activité | Déployer / sélectionner | Référentiel prédéfini ; le titre ou son chevron ouvre et referme les tags |
| Mode d'exécution          | Section repliable + Segmented Control | Toujours ; déployée par défaut | Oui | Durée | Durée / Répétitions / À l’échec | Activité | Déployer / sélectionner | Adapte la cible centrale ; le repli conserve la valeur |
| Durée                     | Roulette min/sec  | Étape 1, mode Durée                | Oui         | 30 s                           | 1 s à 99 min 59 s                              | Activité | Sélection      | Deux colonnes : minutes et secondes |
| Nombre de répétitions     | Roulette native compacte | Étape 1, mode Répétition      | Oui         | 1                              | Entier de 1 à 99 (D-092)                       | Activité | Sélection      | Une colonne, `144 × 203`, Annuler/Confirmer |
| Pause entre Séries        | Roulette durée    | Mode déployé                       | Non         | 0 s                            | 0 à 99 min 59 s                                | Activité | Sélection      | `C` occurrences si `R = 0`, y compris après la dernière Série ; sinon `C − 1`, la Récupération remplaçant la dernière Pause |
| Nombre de Séries          | Roulette native compacte | Mode déployé                  | Oui         | 1                              | Entier de 1 à 99 (D-092)                       | Activité | Sélection      | Une colonne, `144 × 203`, Annuler/Confirmer ; valeur canonique persistée |
| Côté | Contrôle cyclique | Mode déployé, ligne 2 colonne 1 | Non | `UNILATERAL` | Trois états exacts | Activité | Appui | `74 × 42 pt`; vide / `D→G` / `G→D`; désactivé sous Tour bilatéral |
| Récupération              | Roulette durée    | Mode déployé                       | Non         | 0 s                            | 0 à 99 min 59 s                                | Activité | Sélection      | Une phase après tous les côtés d’une Activité autonome ; une phase par côté dans un Tour bilatéral |
| Durée totale              | Roulette durée calculée/pilotable | Mode Durée uniquement | Non | Calculée | Valeur réalisable selon la formule | Calcul | Sélection | Valeur globale `D = L × [C × A + P(C,R) × B] + R`, avec `P=C` si `R=0`, sinon `C−1` pour une Activité autonome ; peut devenir le pilote après confirmation |
| Médias                    | Section repliable + galerie | Cible post-T04 ; repliée par défaut | Non | Vide | 0..n médias ordonnés | Activité | Déployer / consulter | Galerie horizontale avec aperçu suivant tronqué ; absente de l’interface MVP |
| Bouton Terminer           | Bouton            | Toujours                           | Oui         | Désactivé si activité invalide | Nom obligatoire ; durée ou répétitions requises uniquement selon le mode | Statique | Enregistrer | Remplace l’ancien libellé `Valider` puisqu’il n’existe plus de second écran |

**Règle transverse des roulettes numériques :** chaque changement effectif de valeur déclenche un retour haptique léger et bref, une seule fois par cran. Ce feedback est systématique et indépendant de la préférence `Vibrations` du Profil.

**Ordre transverse des paramètres :** la rangée suit toujours `Séries` à gauche → cible du mode au centre (`Durée`, `Répétitions` ou cadre informatif `à l’échec`) → `Pause` à droite. L’ouverture d’une roulette ne déplace, ne permute et ne redimensionne aucun de ces contrôles.

Les roulettes ouvertes de `Durée`, `Pause entre Séries`, `Récupération` et `Durée totale` utilisent le composant compact canonique : `203` points de haut, barre supérieure Annuler/Confirmer de `53` points, roulette native de `150` points et largeur de `330` points. Chaque colonne numérique possède son propre cadre de sélection gris `56 × 34`, rayon `17`; les unités restent hors des cadres. Les roulettes `Nombre de répétitions` et `Nombre de Séries` réutilisent le même component set dans sa variante `Type=Numeric wheel` (`3210:49`) : une colonne, largeur `144`, même hauteur `203` et mêmes actions. Le brouillon reste local jusqu’à Confirmer ; Annuler restaure la valeur précédemment enregistrée. Aucun écran de roulette supplémentaire n’est requis pour `Récupération` ou `Durée totale` : ces contrôles héritent du contrat canonique de durée.
### Règles fonctionnelles

| Règle             | Description                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mode Durée        | Affiche le sélecteur de durée.                                                                                                                                                                                                                                                                                                                                                             |
| Mode Répétitions  | Affiche le champ "Nombre de répétitions".                                                                                                                                                                                                                                                                                                                                                  |
| Mode À l’échec    | N’affiche aucune cible chiffrée ; conserve l’ordre `Séries` → cadre informatif transparent bordé `à l’échec` → `Pause`. |
| Séries            | Une Activité possède un nombre de Séries propre, de 1 à 99 (D-092). En bilatéral autonome, ce nombre s’entend par côté. Une Série exécute la cible du mode ; une Pause éventuelle n’est insérée qu’entre deux Séries du même côté. |
| Côté              | Réglage propre `UNILATERAL`, `RIGHT_LEFT` ou `LEFT_RIGHT`. Dans l’éditeur : ligne 2 colonne 1 sous Séries, `74 × 42 pt`; visible mais désactivé sous un Tour bilatéral. |
| Récupération      | Durée facultative, canonique `0 s`. Elle est exécutée après le second côté d’une Activité autonome bilatérale, ou après chaque passage de côté d’un Tour bilatéral. Elle précède `SESSION_END` lorsqu’elle est la dernière phase utile. |
| Durée totale calculée | En mode Durée, pour une Activité autonome, `D = L × [C × A + P(C,R) × B] + R`, avec `P(C,R) = C` si `R = 0`, sinon `C − 1`, et `L = 1` ou `2`. Toute modification de `A`, `B`, `C`, `R` ou du réglage de côté recalcule `D` lorsque Séries est le pilote. |
| Durée totale pilotée | Après confirmation d’une nouvelle valeur cible `D`, calculer `Cth = D / [L × (A + B)]` si `R = 0`, sinon `Cth = ((D − R) / L + B) / (A + B)`, arrondir à l’entier le plus proche avec `.5` vers le haut, borner à `1`, persister ce nombre de Séries, puis réafficher la durée réalisable recalculée. Séries et Durée totale ne sont jamais pilotes simultanément. |
| Pilote visuel | Au premier affichage, Séries est le pilote implicite sans contour. Après confirmation d’un contrôle, le pilote actif reçoit le contour sémantique `color/selection`. Le choix du pilote n’est pas persisté. Si la durée saisie est ajustée, un message bref annonce la valeur réalisable. |
| Modes non chronométrés | En Répétitions et À l’échec, `Durée totale` est masquée et son emplacement reste vide sans déplacer les autres contrôles. La synthèse affiche une borne minimale `≥` composée des seules Pauses connues et de la Récupération. |
| Zones corporelles | Sélection multiple parmi le référentiel prédéfini. L'utilisateur ne peut ni créer, ni renommer, ni supprimer une Zone corporelle dans le MVP. |
| Validation        | Impossible tant que les champs obligatoires ne sont pas renseignés.                                                                                                                                                                                                                                                                                                                        |
| Retour            | Si des modifications non enregistrées existent, une confirmation est demandée.                                                                                                                                                                                                                                                                                                             |
| Synthèse          | Cadre immuable, indépendant du déploiement des sections et placé en bas du contenu à `spacing/24` de l’action finale. Style `KODJO / Body` (`14/20`). La phrase commence par le nombre de Séries et ne répète pas le mode. À l’échec ajoute `jusqu’à l’échec`. La pause est omise à `0 s` ; `entre les séries` est ajouté uniquement pour plusieurs Séries. La Récupération positive est ajoutée après l’Activité. |
## Exécution d'une séance

### Éléments affichés

| Élément affiché | Type | Visible | Obligatoire | Valeur / comportement | Source | Action | Remarques |
| --- | --- | ---: | ---: | --- | --- | --- | --- |
| Titre de la séance | Texte | Toujours | Oui | Nom de la séance | Séance | Aucune | En-tête |
| Nom de l’Activité courante | Texte | Toujours | Oui | Activité courante | Plan d’Exécution | Aucune | |
| Série | Texte | Activité | Non | `x/y` | Plan d’Exécution | Aucune | Paramètre propre à l’Activité |
| Temps de l’Activité | Minuteur | Toujours | Oui | Compte à rebours si chronométrée ; chronomètre croissant si Répétition | Exécution | Aucune | |
| Cercle du minuteur | Indicateur | Toujours | Oui | Progression temporelle | Exécution | Aucune | En Répétition : un tour par minute |
| Série / Tour | Texte | Toujours | Oui | Série à gauche, Tour à droite ; aucun Cycle affiché | Plan d’Exécution | Aucune | |
| À suivre | Texte | Sauf dernière Activité | Non | Nom + durée/reps de l’Activité suivante | Plan d’Exécution | Aucune | |
| Réinitialiser | Bouton | Pendant Exécution | Oui | Actif | Statique | Ouvrir confirmation | Réinitialise l’Activité courante |
| Pause | Bouton | Pendant Exécution | Oui | Actif | Statique | Suspendre | Suspend aussi le chrono croissant en Répétitions ou À l’échec |
| Suivant | Bouton | Pendant Exécution | Oui | Actif | Statique | Terminer la Série ou passer à la suite | Fin normale en Répétitions/À l’échec ; confirmation avant terme pour une Activité chronométrée |
| Temps total | Texte + barre | Toujours | Oui | Temps écoulé / estimé | Exécution | Aucune | |
| Bips / annonces | Icônes / états | Toujours | Oui | Selon Préférences | Préférences | Activer / désactiver | |

### Règles fonctionnelles

| Règle | Description |
| --- | --- |
| Ouverture | Ouvrir l’écran d’Exécution ne démarre pas automatiquement la première Activité. |
| Exercice chronométré | Compte à rebours. `Activité suivante` avant zéro demande confirmation et enregistre l’Activité comme `Partielle`. |
| Exercice en Répétitions ou À l’échec | Chronomètre croissant ; le cercle effectue une rotation par minute ; bip fixe à chaque minute ; `Pause` suspend chrono et cercle ; `Suivant` termine normalement la Série. |
| Réinitialisation | Demande confirmation et remet l’Activité courante à son état initial sans revenir à une Activité antérieure. |
| Pause / arrêt | `Pause` ouvre la modale permettant `Reprendre la séance` ou `Arrêter la séance`. Aucun bouton Arrêter direct n’est présent sur l’écran. |
| Navigation | L’utilisateur ne revient pas à une Activité déjà exécutée. |
| Étapes | Aucun compteur d’« étapes » n’est affiché dans le MVP. |

### Sons et annonces

- bip pendant les trois dernières secondes d’une Activité chronométrée selon les règles audio ;
- annonce vocale du nom de l’Activité au démarrage ;
- pour un Exercice en Répétitions ou À l’échec, bip fixe à chaque minute écoulée dans le MVP.

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
| Tours / Cycles      | Non affichés dans le MVP.                                                        |
| Activités partiellement réalisées | Affichées uniquement si leur nombre est supérieur à zéro ; `Partielle` reste le terme métier. |                        |
| Ressenti            | Obligatoire dès lors que la Synthèse est présentée ; peut être absent après une interruption technique sans Synthèse.                                            |
| Commentaire         | Facultatif, **200 caractères maximum**.                                                                      |
| Validation          | Le bouton **Terminer** reste désactivé tant qu'aucun ressenti n'est sélectionné. |
| Navigation          | Appui sur **Terminer** → écran **Suivi**.                                        |
| Sauvegarde          | Le ressenti et le commentaire sont enregistrés avec la séance.                   |
| Séance interrompue  | Même écran, avec un statut et une icône adaptés.                                 |
## Profil

### Eléments affichés
| Élément affiché                     | Type            |  Visible | Obligatoire | Valeur par défaut          | Contraintes                     | Source      | Action               | Remarques                                            |
| ----------------------------------- | --------------- | -------: | ----------: | -------------------------- | ------------------------------- | ----------- | -------------------- | ---------------------------------------------------- |
| Titre de l'écran                    | Texte           | Toujours |         Oui | Profil                     | Texte fixe                      | Statique    | Aucune               |                                                      |
| Avatar                              | Icône           | Toujours |         Oui | Initiales de l'utilisateur | Image personnalisée en V2       | Profil      | Modifier le profil   |                                                      |
| Nom                                 | Texte           | Toujours |         Oui | Nom de l'utilisateur       | 1 à 80 caractères               | Profil      | Modifier le profil   |                                                      |
| Action `Modifier`                   | Bouton          | Toujours |         Oui | Visible                    | Photo et nom d’affichage         | Profil      | Ouvrir l'édition     | Active dans le MVP                                   |
| Sons                                | Interrupteur    | Toujours |         Oui | Activé                     | Booléen                         | Préférences | Activer / Désactiver | Valeur par défaut des séances                        |
| Annonces vocales                    | Interrupteur    | Toujours |         Oui | Activé                     | Booléen                         | Préférences | Activer / Désactiver | Utilise la voix système                              |
| Vibration                           | Interrupteur    | Toujours |         Oui | Activée                    | Booléen                         | Préférences | Activer / Désactiver | Vibrations fonctionnelles de séance uniquement       |
| Compte à rebours initial par défaut | Sélecteur durée | Toujours |         Oui | 10 s                       | 0 à 59 min 59 s                 | Préférences | Modifier             | Valeur utilisée à la création d'une séance (D-089)   |
| Fin de séance par défaut            | Sélecteur durée | Toujours |         Oui | 5 s                        | 0 à 59 min 59 s                 | Préférences | Modifier             | 0 s = phase instantanée (D-089)                      |
| Notifications                       | Interrupteur    | Toujours |         Oui | Non autorisées             | Booléen                         | Préférences | Activer / Désactiver | Demande système lors de la première activation d’un rappel |
### Règles fonctionnelles

| Règle                    | Description                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Sauvegarde               | Toute modification est enregistrée immédiatement.                                                                                        |
| Paramètres par défaut    | Les valeurs définies ici sont utilisées lors de la création d'une nouvelle séance.                                                       |
| Surcharge                | Une séance peut remplacer les valeurs par défaut (compte à rebours initial et fin de séance).                                            |
| Sons                     | Désactive tous les bips de l'application.                                                                                                |
| Annonces vocales         | Désactive toutes les annonces vocales sans modifier les bips.                                                                            |
| Vibration                | Active ou désactive les vibrations fonctionnelles de séance. Ce réglage n'affecte pas le feedback haptique des roulettes numériques.     |
| Compte à rebours initial | Définit la durée proposée par défaut lors de la création d'une nouvelle séance. Une valeur de 0 s rend la phase instantanée sans la supprimer de la structure. |
| Fin de séance            | Définit la durée proposée par défaut lors de la création d'une nouvelle séance. Une valeur de 0 s rend la phase instantanée sans la supprimer de la structure.            |
| Langue du MVP            | Le MVP est disponible uniquement en français. Tous les textes utilisateur, pluriels, variables, formats locaux, notifications et libellés d’accessibilité utilisent des clés de traduction centralisées afin de permettre l’ajout d’autres langues sans modifier les composants. |
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

Les sélecteurs ouverts `Heure` et `Rappel personnalisé` conservent la géométrie propre à leur référence Figma, d’environ `310 × 201`, adaptée à la largeur disponible. Chaque colonne numérique possède son propre cadre de sélection gris `56 × 34`, rayon `17`, limité aux chiffres. Le `Nombre de semaines` utilise `Type=Numeric wheel` (`144 × 203`) à une seule colonne. Annuler, à gauche, abandonne le brouillon ; Confirmer, à droite, applique les valeurs centrées au formulaire. Les actions utilisent respectivement un cercle gris neutre et un cercle bleu primaire de `38 × 38`, une icône `24 × 24` et une cible tactile de `48 × 48`. Le cadre de mise en page `48 × 53` conserve les marges autour du cercle sans modifier la cible tactile.

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
| Couleur de la séance exécutée | Indicateur visuel | Toujours | Oui | Couleur de l’instantané | Une couleur parmi 12 | Instantané de séance | Aucune | Ne dépend pas de la couleur actuelle de la séance |

### Règle fonctionnelle liée à la couleur

La couleur affichée dans le Suivi est celle enregistrée dans l’instantané de l’exécution. Une modification ultérieure de la couleur de la séance ne modifie pas les exécutions passées.

## Dialogues de confirmation

| Action                                           | Confirmation      | Boutons                 | Conséquence                                                            |
| ------------------------------------------------ | ----------------- | ----------------------- | ---------------------------------------------------------------------- |
| Supprimer une séance archivée                    | Oui               | Annuler / Confirmer | Dialogue centré ; disponible uniquement via le filtre `Archivées` ; conserve les Exécutions |
| Arrêter une séance en cours                      | Oui               | Reprendre la séance / Arrêter la séance | Dialogue centré ; enregistre une exécution interrompue |
| Archiver une séance                              | Non               | Snackbar + Annuler      | Déplace la séance dans les archives                                    |
| Restaurer une séance                             | Non               | Snackbar + Annuler      | Replace la séance dans le catalogue                                    |
| Supprimer une catégorie — MVP bis                | Oui (si utilisée) | Annuler / Supprimer     | Retire la catégorie des Séances concernées ; les Instantanés historiques restent inchangés |
| Réinitialiser les préférences                    | Oui               | Annuler / Réinitialiser | Restaure les préférences par défaut                                    |
| Supprimer l'historique                           | Oui               | Annuler / Supprimer     | Supprime toutes les exécutions enregistrées                            |
| Quitter la création d'une séance non enregistrée | Oui               | Annuler / Confirmer | Dialogue centré ; `Confirmer` abandonne la création |

Tous les dialogues de décision utilisent `Overlay / Decision Dialog` (`2590:2961`) : largeur `354`, rayon `18`, centrage dans l’écran et voile bloquant. Le dernier paragraphe est séparé de la première ligne d’actions par `spacing/16`. Avec deux choix, les boutons `147 × 48` sont alignés ; avec trois choix, `Seulement cette occurrence` et `Toutes les occurrences à venir` sont les deux actions destructives de la première ligne, puis `Annuler` occupe la seconde ligne en pleine largeur `306 × 48`. Les textes sont centrés horizontalement et verticalement.

## Catalogue multi-type

Le contrôle segmenté sélectionne un type de contenu : `Activités`, `Séances`, `Circuits`. `Séances` est le défaut et le seul type actif dans le MVP. `Activités` et `Circuits` sont visibles mais désactivés jusqu’à la V2.

La vue Séances charge toutes les Séances non archivées et les trie par dernière modification décroissante. Les boutons Filtrer et Trier seront ajoutés ultérieurement dans Figma. Le filtre propose exclusivement `Toutes`, `Planifiées`, `Non planifiées`, `Archivées`. Le tri propose dernière modification croissante/décroissante ou nom A–Z/Z–A.

## Activité — contrat révisé

| Zone | Règle |
|---|---|
| Bandeau bleu | Champ Nom en premier, aligné sur celui de Composition ; aucune mention de la Séance. |
| Média MVP | Bouton `Ajouter un média` visible mais désactivé, composant `3382:60` avec icône vectorielle `3382:61` et sans caractère `+` ; section Médias absente. |
| Média cible post-T04 | Bouton actif ; section repliable et galerie horizontale `0..n`, ordonnée, avec aperçu suivant tronqué. |
| Modèle | Aucun type d’Activité dans l’interface ou le modèle cible. |
| Mode | Trois segments égaux : Durée, Répétitions, À l’échec. |
| Paramètres | `Séries` → cible du mode → `Pause`, puis `Récupération` → `Durée totale` en mode Durée. |
| Récupération | Durée facultative, exécutée après tous les côtés d’une Activité autonome ou après chaque passage de côté d’un Tour bilatéral ; ce n’est pas une Activité distincte. |
| Durée totale | Dépendance bidirectionnelle avec Séries selon les règles de pilote et d’arrondi ; masquée en Répétitions et À l’échec. |
| À l’échec | Aucun objectif chiffré ; ordre `Séries` → cadre informatif `à l’échec` → `Pause`. |
| Sections | Description, Zone corporelle d’exécution, Mode d’exécution et Médias sont repliables ; Mode est déployé par défaut. |
| Action finale | Libellé `Terminer`. |
| Synthèse | Zone immuable ; `X séries de {nom}, jusqu’à l’échec, avec X s de pause entre les séries`, puis récupération si positive, avec les règles communes de pluriel et d’omission des durées nulles. |

## Bibliothèque d’Activités — V2

Une Activité de catalogue est persistante et directement exécutable à partir d’un instantané autonome. L’ajout dans une Séance crée une copie indépendante de toutes ses propriétés et associations média. La position structurelle appartient à la copie. Modifier ou supprimer la référence ne modifie aucune copie. La première version ne propose pas d’enregistrer dans la bibliothèque une Activité créée dans une Séance.

## Médias — V2

L’utilisateur capture ou choisit dans la photothèque une photo ou une vidéo. Le fichier est copié dans le stockage interne et reste accessible hors ligne. Une vidéo ne démarre jamais automatiquement. Les associations sont ordonnées et réorganisables ; plusieurs associations peuvent partager un fichier immuable sans le dupliquer.

## Circuits — V2

Le formulaire exige nom, couleur et au moins deux étapes. Chaque étape référence une Séance existante et une même Séance peut apparaître plusieurs fois. La transition globale est manuelle ou automatique ; en automatique, la durée commune vaut `30 s` par défaut. L’écran de transition est toujours visible, puis le compte à rebours initial de la Séance suivante est exécuté.

Le lancement crée un instantané. Une Exécution de Circuit relie les Exécutions de Séance des étapes commencées. Les fins intermédiaires sont remplacées par l’écran de transition ; la fin globale apparaît après la dernière étape. L’arrêt confirmé conserve les résultats produits et marque l’ensemble interrompu.

## Conception détaillée de la bilatéralité

`sideMode` est indépendant du mode Durée, Répétitions ou À l’échec. Le contrôle cycle `UNILATERAL → RIGHT_LEFT → LEFT_RIGHT → UNILATERAL`. L’Activité unilatérale n’affiche aucun indicateur court ; les deux états bilatéraux affichent `D→G` ou `G→D`. Le nom accessible annonce respectivement « Unilatéral », « Bilatéral droite-gauche » ou « Bilatéral gauche-droite ».

Dans l’écran unifié, le contrôle singulier `Côté` est déjà placé dans le cadre bleu, ligne 2 colonne 1 sous `Séries`, en `74 × 42 pt`. La grille intérieure emploie les colonnes `74 / 124 / 124 pt`, deux gouttières de `8 pt` et `10 pt` entre lignes. Dans la Composition, le contrôle du Tour est sur la ligne de `Nombre de tours`, immédiatement à droite du cadre numérique avec `8 pt` d’espace, en `42 × 34 pt` et sans titre visible. Les libellés accessibles développent les trois états.

Une carte hors Tour bilatéral affiche sa direction propre à droite des informations secondaires (`42 × 20 pt`, `x=311`, `y=24,5` dans `354 × 69 pt`). Sous un Tour bilatéral, ni la carte ni la synthèse ne répètent la direction. La synthèse propre insère `à droite, puis à gauche` ou `à gauche, puis à droite` après la cible — après `jusqu’à l’échec` — et avant la Pause. Le libellé est `Durée totale`; en Répétitions et À l’échec, la valeur reste une borne `≥`.

L’activation bilatérale du Tour ne demande confirmation que si au moins une Activité contenue est proprement bilatérale. Sinon, la direction est appliquée directement. Avec confirmation, `Annuler` ne modifie rien ; `Confirmer` remet atomiquement les seules Activités concernées à `UNILATERAL` en appliquant la direction au Tour.

Pour une Activité autonome, le générateur produit par côté un bloc de `C` Séries et `C` Pauses si `R = 0`, ou `C−1` Pauses si `R > 0`; il produit le même bloc pour le second côté si nécessaire, puis une seule Récupération positive. Pour un Tour bilatéral, chaque répétition produit toutes les phases de toutes ses Activités pour le premier côté, y compris leur Récupération, puis le même passage pour le second. Les Activités du Tour sont propres `UNILATERAL` mais effectives selon le Tour.

La progression globale est calculée sur le Plan développé : chaque passage chronométré est pondéré par sa durée planifiée ; chaque passage Répétitions ou À l’échec acquiert sa part avec `Suivant`. Le lancement annonce le premier côté, la transition annonce le second, et un Tour n’annonce le côté qu’au début de chaque passage complet, pas à chaque Activité.

Les résultats sont écrits de façon idempotente par Activité logique, répétition de Tour, Série et côté. Réinitialiser au second côté ne modifie pas le premier. La modale générique `Passer à l’activité suivante ?` n’est pas modifiée ; après confirmation sur le premier côté, le prochain nœud du plan est le second côté.\n\n## Exécution directe d’une Activité — V2

### Éligibilité et lancement

L’action `Exécuter` est active uniquement si la référence est valide selon son mode. Le lancement fige la version courante dans un instantané `ACTIVITY` et mémorise l’état de navigation du Catalogue. Une modification ou suppression ultérieure de la référence n’altère pas l’Exécution.

### Plan et clôture

Le plan contient, dans l’ordre : `DIRECT_PREPARE(5 s)`, tous les passages de l’Activité développés selon ses Séries et ses côtés, les Pauses applicables, puis sa Récupération éventuelle. Il ne contient ni Tour, ni Cycle visible, ni `SESSION_END`. Le dernier achèvement déclenche un signal et la Synthèse.

### Synthèse et retour

La Synthèse affiche les données compatibles d’une Activité seule. Le Ressenti est obligatoire et conditionne `Terminer`; le Commentaire est facultatif. La finalisation enregistre l’origine `ACTIVITY`, puis restaure le Catalogue et son état antérieur.\n