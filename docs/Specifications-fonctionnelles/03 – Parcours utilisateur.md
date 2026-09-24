# Objectif de cette note

Décrire, du point de vue de l'utilisateur, les principaux parcours permettant de créer, planifier, exécuter et suivre ses séances dans l'application.

Cette note décrit les objectifs de l'utilisateur et l'enchaînement logique des actions, sans détailler encore les écrans ni les choix techniques.
# Synthèse des parcours du MVP

## Objectif

Présenter la couverture fonctionnelle du MVP et orienter vers les parcours utilisateur détaillés de ce chapitre.

Le MVP permet à l'utilisateur :
- de gérer les Étiquettes de Séances, les Catégories d’Activités et de sélectionner les Zones corporelles du référentiel applicatif ;
- de créer, réorganiser et exécuter une séance ;
- de créer une séance à partir de la duplication d'une séance existante ;
- de planifier une séance au moyen d'une routine ;
- de modifier ou supprimer une routine ;
- de gérer une séance partiellement réalisée ou interrompue ;
- de consulter les Exécutions enregistrées dans le Suivi ;
- d’accéder au Catalogue des Activités, d’y créer et modifier des Activités persistantes ;
- de sélectionner plusieurs Activités existantes pour les insérer dans une Séance ;
- d’exécuter directement une Activité avec préparation, Synthèse et Suivi.
## Parcours de référence

| Tranche          | Besoin utilisateur                            | Parcours de référence                                                          | Statut documentaire   |
| ---------------- | --------------------------------------------- | ------------------------------------------------------------------------------ | --------------------- |
| T01–T02          | Gérer Étiquettes, Catégories et Zones corporelles | Gestion des référentiels utilisateur                                        | Spécifié MVP          |
| T01–T02          | Créer et réorganiser une Séance               | Parcours principal — Créer une Séance                                          | Spécifié MVP          |
| T03              | Gérer des Activités persistantes              | Accéder au Catalogue des Activités ; créer, consulter ou modifier une Activité | Spécifié MVP          |
| T03              | Ajouter des Activités existantes à une Séance | Sélectionner plusieurs Activités existantes depuis la Composition              | Spécifié MVP          |
| T03              | Exécuter directement une Activité             | Préparation de 5 s, Exécution, Synthèse obligatoire et retour au Catalogue     | Spécifié MVP          |
| T04              | Exécuter une Séance                           | Exécution guidée fondamentale, auparavant T03                                  | Spécifié MVP          |
| T05 et suivantes | Dupliquer, planifier et suivre les Séances    | Parcours complémentaires 1 à 4                                                 | Spécifié MVP          |
| Hors MVP         | Créer et exécuter un Circuit                  | Parcours Circuit                                                               | Partiel — à compléter |
## Principes communs

- Une séance définit le contenu à exécuter.
- Une routine définit la planification d'une séance.
- Une exécution de séance conserve le déroulement réel d'une séance exécutée.
- Une séance peut être exécutée sans être planifiée.
- Une séance peut être associée à plusieurs routines.
- La modification d'une séance ou d'une routine n'altère jamais les exécutions déjà enregistrées.
- La suppression d'une routine ne supprime jamais la séance associée ni les exécutions déjà enregistrées.
- Les données du MVP sont conservées localement sur l'appareil de l'utilisateur.
## Limites du MVP

Le MVP ne prend pas encore en charge :
- le partage ou la collaboration ;
- les comptes utilisateurs et la synchronisation entre appareils ;
- l'interaction avec un professionnel de santé ou un coach ;
- les bibliothèques de séances partagées ;
- l'assistance par intelligence artificielle ;
- les tableaux de bord et graphiques avancés ;
- le multilingue.

Ces fonctions sont prévues pour des versions ultérieures.
# Gestion des référentiels utilisateur

Les référentiels utilisés dans le MVP sont de deux natures :
- les **Étiquettes de Séances**, qui qualifient la Séance et portent sa couleur ;
- les **Catégories d’Activités**, qui qualifient les Activités et portent leur couleur ;
- les **Zones corporelles**, issues d’un référentiel applicatif prédéfini et distinctes des Catégories.

## Gestion des Étiquettes et des Catégories

Les Étiquettes classent les Séances et portent leur couleur. Les Catégories classent les Activités et portent leur couleur sémantique. Les Zones corporelles restent un référentiel distinct.
Une Séance utilise son Étiquette pour son classement et sa couleur. Une Activité utilise sa Catégorie ; les Zones corporelles restent indépendantes. La gestion détaillée de ces référentiels suit les écrans et contrats actifs.

L'utilisateur peut consulter et sélectionner les Étiquettes de Séance et les Catégories d’Activité selon le contexte d’écran.

### Parcours

1. Ouvrir la gestion ou la sélection du référentiel concerné.
2. Consulter les Étiquettes de Séance ou les Catégories d’Activité existantes.
3. Créer ou modifier une catégorie selon le besoin ; sa suppression est disponible à partir du MVP bis.
4. Dans la création d’une Séance, une nouvelle Catégorie reste temporaire jusqu’à l’enregistrement final ; les modifications persistées deviennent disponibles dans l’ensemble de l’application sans modifier les Instantanés historiques.

## Référentiel des zones corporelles

Les zones corporelles permettent de caractériser les exercices selon les parties du corps principalement sollicitées.
Une Activité peut être associée à zéro, une ou plusieurs zones corporelles.

Dans le MVP, les Zones corporelles constituent un référentiel prédéfini de l'application. L'utilisateur peut les consulter et les sélectionner lors de la création ou de la modification d'un Exercice, mais ne peut ni en créer, ni les renommer, ni les supprimer.

# Parcours principal — Créer et exécuter une séance

Au lancement, le splash KODJO ouvre automatiquement le `Catalogue des séances`. Celui-ci est l’écran d’accueil du MVP.

## Objectif du parcours

Permettre à l'utilisateur de créer une séance, de l'exécuter immédiatement en étant guidé par l'application et de retrouver ensuite son exécution dans l'historique.

La planification des séances est décrite dans le parcours **Gérer les routines**.
## Situation de départ

L'utilisateur souhaite créer une nouvelle séance correspondant à un entraînement sportif, une séance de rééducation, une routine de mobilité ou toute succession d'activités nécessitant un guidage.

Il peut créer une séance entièrement nouvelle ou partir d'une copie d'une séance existante.
## Parcours

### 1. Créer une séance

L'utilisateur crée une nouvelle séance depuis le Catalogue.

Dans l’écran unique `Composition d’une séance`, il renseigne son nom, sélectionne éventuellement son Étiquette — dont la couleur devient la couleur affichée de la Séance — puis construit progressivement la Composition. La Composition peut contenir un Point d’arrêt déplaçable ; son attente ne compte pas dans la durée. Une Activité peut définir son propre Compte à rebours et sa propre Fin d’activité, distincts des phases structurelles de la Séance. Les Activités peuvent être placées avant le Tour, dans le Tour ou après le Tour. La première Activité créée est insérée après le Compte à rebours initial et avant le Tour. Le Cycle technique reste fixé à 1 et n’est jamais affiché.

Pour chaque Activité, un écran unique permet de renseigner le nom, la Catégorie, les Zones corporelles, le mode Durée, Répétitions ou À l’échec, la cible éventuelle, le nombre de Séries, la Pause entre Séries, la Récupération, le Changement de côté, le Compte à rebours propre et la Fin d’activité propre. La Description reste facultative. L’action `Terminer` enregistre l’Activité.

En mode Durée, l’utilisateur peut confirmer soit `Séries`, soit `Durée totale`. Le contrôle confirmé devient pilote ; l’autre est recalculé. Si une Durée totale cible n’est pas compatible avec un nombre entier de Séries, l’application arrondit au nombre entier le plus proche, avec `.5` vers le haut, recalcule la durée réellement atteignable et affiche un message temporaire.

`Continuer` reste désactivé tant que le nom n’est pas renseigné ou qu’aucun Exercice valide n’est présent. L’Étiquette éventuelle est déjà gérée dans la Composition ; `Continuer` valide et enregistre la Séance avec sa Composition et son Étiquette.
### 2. Réorganiser une séance

À tout moment, l'utilisateur peut revenir modifier une séance existante.

Il peut notamment :
- ajouter une activité ;
- supprimer une activité ;
- modifier une activité ;
- déplacer une activité par appui long sur sa carte, puis glissement vers la position cible ;
- modifier le nombre de répétitions du Tour ;
- modifier les paramètres généraux de la séance.

Les modifications sont immédiatement prises en compte pour les futures exécutions.

La Récupération éventuelle est affichée comme une carte attachée sous l’Activité. Le déplacement, la duplication et la suppression portent toujours sur le bloc Activité–Récupération complet.
### 3. Démarrer une séance

L'utilisateur choisit la zone `Démarrer` d’une séance et ouvre d’abord l’état initial d’Exécution. Toucher la partie principale de la carte ouvre au contraire la Séance en modification.
Avant le lancement, il peut consulter un résumé de la séance et vérifier ses principaux paramètres.
### 4. Exécuter une séance

Pendant l'exécution, l'application guide automatiquement l'utilisateur activité après activité.

Il peut notamment :
- suivre le minuteur ou les répétitions ;
- mettre la séance en pause ;
- reprendre la séance ;
- passer directement à l'activité suivante ;
- arrêter la séance.
### 5. Terminer une séance

À la fin de l'exécution, l'application enregistre automatiquement la séance réalisée.
L'utilisateur doit renseigner un ressenti et peut ajouter un commentaire facultatif de **200 caractères maximum** avant de revenir à l'écran principal.
### 6. Consulter l'historique

L'utilisateur retrouve l'ensemble des séances déjà exécutées.
Chaque exécution conserve la version exacte de la séance utilisée lors de son lancement.
### 8. Modifier une séance

Après une ou plusieurs exécutions, l'utilisateur peut continuer à faire évoluer une séance.
Les modifications apportées ne concernent que les futures exécutions.
Les exécutions déjà enregistrées restent inchangées.
## Points d'attention

- Une séance décrit uniquement son contenu.
- Une séance peut être exécutée immédiatement, sans être planifiée.
- Les modifications d'une séance n'altèrent jamais les exécutions déjà enregistrées.
- La planification des séances est gérée par les routines, décrites dans le parcours dédié.
## Résultat attendu

L'utilisateur peut créer, faire évoluer et exécuter librement ses séances, tout en conservant un historique fidèle de chacune de leurs exécutions.

# Parcours complémentaire 1 — Créer une séance à partir d'une référence

## Objectif du parcours

Permettre à l'utilisateur de créer rapidement une nouvelle séance à partir d'une séance existante.
## Situation de départ

L'utilisateur dispose déjà d'une séance dont la structure est proche de celle qu'il souhaite créer.
Il préfère la dupliquer plutôt que recréer entièrement son contenu.
## Parcours

1. L'utilisateur ouvre le catalogue des séances.
2. Il sélectionne la séance qu'il souhaite utiliser comme référence.
3. Il choisit **Dupliquer**.
4. Il saisit le nom de la nouvelle séance.
5. La nouvelle séance est créée.
6. L'utilisateur peut modifier librement son contenu.
7. Il enregistre la séance.
## Points d'attention

- La séance créée est totalement indépendante de la séance d'origine.
- Les modifications apportées à l'une n'ont aucun impact sur l'autre.
- La duplication reprend l'intégralité de la structure de la séance et de ses paramètres.
## Résultat attendu

L'utilisateur crée rapidement une nouvelle séance en s'appuyant sur une séance existante, puis l'adapte à son besoin sans modifier l'original.
# Parcours complémentaire 2 — Gérer les routines

## Objectif du parcours

Permettre à l'utilisateur de planifier l'exécution de ses séances, de modifier leur planification ou de supprimer une routine.
## Situation de départ

L'utilisateur dispose d'au moins une séance enregistrée.
Il souhaite programmer son exécution à une date précise ou de manière récurrente.
## Parcours

### Créer une routine

1. Ouvrir le calendrier, affiché par défaut en vue Jour.
2. Choisir **+ Planifier**.
3. Sélectionner la séance à planifier.
4. Définir :
   - la date de début ;
   - l'heure ;
   - le mode de planification et, le cas échéant, les paramètres de répétition hebdomadaire ;
   - la date de fin éventuelle ;
   - le rappel.
5. Enregistrer.
### Modifier une routine

1. Sélectionner une routine dans le calendrier.
2. Choisir **Modifier la planification**.
3. Modifier les paramètres souhaités.
4. Enregistrer.

Les modifications s'appliquent uniquement aux occurrences futures.
### Supprimer une routine

1. Depuis la vue Semaine, révéler l’action **Supprimer** par glissement gauche.
2. Pour une planification périodique, choisir **Seulement cette occurrence** ou **Toutes les occurrences à venir** ; **Annuler** occupe une seconde ligne en pleine largeur.
3. Confirmer la suppression.

Les occurrences futures cessent d'être générées. Les Exécutions déjà enregistrées sont conservées. Les occurrences planifiées passées non exécutées ne sont pas présentées dans l'interface du MVP.
Les exécutions déjà réalisées sont conservées.

# Parcours complémentaire 3 — Archiver puis supprimer une Séance

1. Depuis la vue `Séances` non archivée, révéler les actions d’une Séance active par glissement gauche.
2. Choisir `Archiver` ; aucune suppression directe n’est proposée dans ces vues.
   - Si aucune Routine n’est associée, l’archivage est immédiat et ne demande pas de confirmation. Un snackbar `Séance archivée` propose temporairement `Annuler` ; cette action annule l’archivage et replace la Séance dans la liste active.
   - Si une ou plusieurs Routines sont associées, une confirmation explicite est demandée avant l’archivage ; après confirmation, ces Routines sont supprimées. Aucun snackbar d’annulation n’est alors affiché.
3. Activer le filtre `Archivées` depuis le contrôle `Filtrer`.
4. Glisser la carte vers la gauche : la carte se déplace avec le geste et révèle l’action `Supprimer` placée derrière.
5. Choisir `Supprimer`, puis confirmer dans la modale. `Annuler` revient à la liste `Archivées`.

Les Exécutions historiques restent conservées après suppression.
## Points d'attention

- Une routine ne modifie jamais le contenu d'une séance.
- Une séance peut être associée à plusieurs routines.
- La suppression d'une routine ne supprime jamais la séance.
- Les exécutions déjà réalisées sont toujours conservées.
- L'archivage d'une Séance supprime toutes les Routines qui lui sont associées. Cette suppression ne demande une confirmation que lorsqu’au moins une Routine est effectivement associée ; sans Routine associée, l’archivage est immédiat et un snackbar `Séance archivée` avec `Annuler` permet de revenir sur l’action. Après une confirmation ayant entraîné la suppression de Routines, aucun snackbar d’annulation n’est affiché. Leur restauration n'est pas automatique si la Séance est ensuite restaurée.
## Résultat attendu

L'utilisateur gère facilement la planification de ses séances sans modifier leur contenu et conserve un historique fiable de toutes les exécutions réalisées.

# Parcours complémentaire 3 — Gérer une séance interrompue ou partiellement réalisée

## Situation de départ

Pendant l'exécution d'une séance, l'utilisateur ne réalise pas toutes les activités prévues ou doit interrompre son entraînement avant son terme.
La séance peut avoir été lancée directement ou à partir d'une routine planifiée.
## Parcours

1. L'utilisateur démarre une séance.
2. Pendant son exécution, il peut :
    - mettre la séance en pause ;
    - reprendre la séance ;
    - passer directement à l'activité suivante ;
    - ignorer une activité ;
    - terminer une activité avant son terme ;
    - interrompre complètement la séance.
3. En cas d'interruption volontaire, l'application lui propose :
    - de reprendre immédiatement ;
    - d'arrêter définitivement la séance.
4. Si la séance est reprise, l'exécution reprend à la dernière activité enregistrée.
5. Lorsque la séance est terminée ou abandonnée, l'application présente un récapitulatif indiquant notamment :
    - les activités réalisées ;
    - les activités partiellement réalisées ;
    - les activités ignorées ;
    - les activités non commencées ;
    - la durée réelle de la séance ;
    - son statut.
6. Lorsque l'écran de Synthèse est présenté, l'utilisateur doit renseigner un ressenti et peut ajouter un commentaire facultatif de **200 caractères maximum**. En cas d'interruption technique sans passage par la Synthèse, le ressenti peut être absent.
7. La séance est enregistrée dans l'historique avec son statut :
- Terminée : toutes les Activités ont été terminées normalement et la phase `SESSION_END` a été achevée.
- Partielle : la phase `SESSION_END` a été achevée, mais au moins une Activité a été interrompue ou ignorée.
- Interrompue : l'Exécution a été arrêtée avant l'achèvement de `SESSION_END`, y compris pendant cette phase.
## Points d'attention

- Une fermeture accidentelle de l'application ne doit pas faire perdre la séance en cours. Au retour dans l’application, si une Exécution était `En cours`, l’utilisateur doit choisir **Reprendre la séance** ou **Arrêter la séance** avant de pouvoir démarrer une nouvelle Exécution.
- Les données déjà enregistrées doivent pouvoir être restaurées.
- L'application ne doit pas obliger l'utilisateur à justifier chaque activité ignorée.
- La différence entre une séance suspendue, terminée et abandonnée doit rester compréhensible.
- La règle permettant de reprendre une séance après une très longue interruption est définie comme suit :
	- Si une Séance reste en pause pendant au moins 30 minutes consécutives, l'application demande à l'utilisateur s'il souhaite reprendre son Exécution.
	- Si l'utilisateur confirme, la séance reprend à l'activité où elle avait été interrompue.
	- En l'absence de réponse, la séance est automatiquement enregistrée avec le statut Interrompue.
	- Dans une version ultérieure, cette durée maximale pourra être configurée dans les préférences utilisateur.
## Résultat attendu

L'utilisateur conserve un historique fidèle de ce qu'il a réellement effectué, même lorsque la séance diffère de ce qui était initialement prévu.

# Parcours complémentaire 4 — Consulter le suivi des séances

## Objectif du parcours

Permettre à l'utilisateur de retrouver l'ensemble de ses séances exécutées, de consulter leur résultat, d'analyser leur déroulement et de suivre sa progression.
## Situation de départ

L'utilisateur a déjà exécuté une ou plusieurs séances.
Il souhaite consulter son historique afin de retrouver une séance, vérifier son déroulement ou suivre son activité au fil du temps.
## Parcours

1. L'utilisateur ouvre le menu **Suivi**.
2. Il consulte la liste chronologique de ses Exécutions enregistrées.
3. Il peut rechercher une Exécution et modifier l’ordre chronologique d’affichage, du plus récent au plus ancien ou inversement.
4. Il consulte sur chaque carte condensée la date / heure, la durée réelle, le statut et le ressenti lorsqu'il existe.
5. Il peut sélectionner une autre Exécution, modifier sa recherche ou inverser l’ordre chronologique d’affichage.

La vue détaillée déployée d'une Exécution est reportée à une version ultérieure.

## Points d'attention

- Le Suivi présente uniquement les Exécutions enregistrées ; les occurrences planifiées passées non exécutées n'y apparaissent pas.
- Les informations affichées correspondent toujours à la version de la Séance utilisée lors de son Exécution.
- Une modification ultérieure d'une Séance ou d'une Routine n'altère jamais les informations enregistrées dans le Suivi.
- La structure des données doit permettre d'ajouter ultérieurement une vue détaillée, des tableaux de bord, graphiques et indicateurs de progression sans modifier le modèle métier.
## Résultat attendu

L'utilisateur dispose d'un historique fiable de toutes ses exécutions et peut suivre facilement son activité ainsi que sa progression au fil du temps.

# Parcours MVP T03 — Catalogue des Activités

## Accéder au Catalogue des Activités

1. Ouvrir le Catalogue puis sélectionner `Activités`.
2. Consulter la liste des Activités persistantes.
3. Utiliser la surface d’une carte pour ouvrir l’Activité en consultation ou modification.
4. Utiliser le bouton Lecture pour lancer directement une Activité valide.
5. Utiliser `Créer` pour ouvrir directement la création correspondant au Catalogue courant.

La recherche, les filtres et la position de défilement appartiennent à l’état du Catalogue et sont restaurés au retour d’une consultation, d’une modification ou d’une Exécution directe.

## Créer un contenu depuis le Catalogue

`Créer` est contextuel au Catalogue affiché et ne présente aucun écran ni arbre intermédiaire :

1. dans le Catalogue `Activités`, `Créer` ouvre directement le formulaire de création d’une Activité persistante ;
2. dans le Catalogue `Séances`, `Créer` ouvre directement une nouvelle Composition de Séance ;
3. dans le Catalogue `Circuits`, le même principe ouvre directement la création d’un Circuit lorsque ce Catalogue devient fonctionnel.

Dans T03/MVP, `Circuits` reste désactivé : cette règle n’active ni le Catalogue ni la création de Circuit.

## Créer ou modifier une Activité

1. Depuis le Catalogue des Activités, utiliser `Créer` pour ouvrir une nouvelle `ActivityDefinition`, ou toucher une carte existante pour la modifier.
2. Renseigner le nom de l’Activité.
3. Sélectionner sa **Catégorie** et, si nécessaire, ses **Zones corporelles**.
4. Définir les paramètres d’exécution :
   - mode `Durée`, `Répétitions` ou `À l’échec` ;
   - cible du mode lorsqu’elle existe ;
   - nombre de Séries ;
   - Pause entre Séries ;
   - Récupération ;
   - `Changement de côté` : `Aucun`, `D→G` ou `G→D` ;
   - Compte à rebours propre de l’Activité lorsqu’il est utilisé ;
   - Fin d’activité propre lorsqu’elle est utilisée ;
   - Durée totale dérivée ou pilotée selon le mode.
5. Ajouter ou consulter le média selon le périmètre disponible.
6. Valider avec `Terminer`.

Les paramètres métier restent identiques entre création et modification ; seule l’organisation de l’écran et le contexte de retour diffèrent.

### Déroulement d’une Activité

Lorsqu’elle est exécutée, l’Activité suit son propre enchaînement : Compte à rebours d’Activité éventuel → Séries et côtés → Pauses applicables → Récupération éventuelle → Fin d’activité éventuelle. Ce déroulement est réutilisé dans une Séance comme en Exécution directe.

## Ajouter une Activité depuis une Composition

1. Appuyer sur `Ajouter une activité`.
2. Le parcours actuellement exposé ouvre directement la sélection des Activités du Catalogue.
3. Rechercher ou filtrer les Activités puis sélectionner une ou plusieurs références.
4. Valider avec `Ajouter N activité(s)`.
5. Les copies sont insérées dans la Composition et deviennent indépendantes de leur `ActivityDefinition` source.

La capacité existante de créer directement une Activité locale à la Séance, non enregistrée dans le Catalogue, reste fonctionnellement et techniquement conservée mais n’est pas exposée dans cet enchaînement d’écrans du MVP courant.

## Utiliser une Activité de référence

1. Ouvrir `Activités` dans le Catalogue.
2. Créer une référence d’Activité persistante, réutilisable et directement exécutable.
3. Depuis une Composition, choisir une référence existante.
4. L’application copie ses données et ses associations média dans la Séance.
5. Modifier librement la copie sans modifier la référence ni les autres copies.

Une Activité créée directement dans une Séance ne rejoint pas le catalogue. L’action `Enregistrer dans mes activités` est reportée au-delà de la première version de la bibliothèque.

## Exécuter un Exercice À l’échec — MVP

L’utilisateur démarre une Série sans objectif temporel ni nombre de répétitions cible. Il sélectionne `Suivant` pour terminer la Série, exactement comme en mode Répétitions. La Pause configurée s’exécute avant la Série suivante. Après la dernière Série, la Récupération configurée s’exécute une seule fois ; si elle vaut `0 s`, l’Activité suivante commence immédiatement.

## Créer et exécuter un Circuit — hors MVP, conception partielle

1. Renseigner un nom et une couleur.
2. Ajouter au moins deux étapes, chacune référençant une Séance ; une même Séance peut être ajoutée plusieurs fois.
3. Choisir une transition manuelle ou automatique ; l’automatique utilise une durée commune, `30 s` par défaut.
4. Lancer manuellement le Circuit. Le lancement fige un instantané.
5. Après chaque Séance intermédiaire, remplacer son écran de fin par l’écran de transition ; conserver ensuite le compte à rebours initial de la Séance suivante.
6. Après la dernière Séance, afficher la fin du Circuit et conserver l’Exécution globale ainsi que les Exécutions de Séance liées.

En cas d’arrêt confirmé, le Circuit, la Séance courante et les résultats déjà produits sont enregistrés comme interrompus selon leur niveau ; aucune Exécution de Séance n’est créée pour les étapes non commencées.

## Parcours bilatéral

1. Dans l’éditeur d’Activité, `Changement de côté` propose `Aucun`, `D→G` ou `G→D`.
2. Aucun réglage de côté n’est exposé au niveau du Tour dans la version actuelle ; le support technique historique est conservé mais reste fixé à `UNILATERAL` et non modifiable.
3. Une carte d’Activité affiche sa direction propre `D→G` ou `G→D` lorsqu’elle est bilatérale ; elle n’affiche rien avec `Aucun`.
4. À l’Exécution, `Côté droit` ou `Côté gauche` apparaît pour le passage concerné, sans compteur `1/2` ou `2/2`.
5. Une Activité bilatérale termine toutes ses Séries du premier côté puis toutes celles du second.
6. La modale générique de passage à l’Activité suivante reste inchangée. Confirmée pendant le premier côté, elle enregistre ce côté comme partiel et ouvre le second côté ; confirmée pendant le second, elle poursuit le Plan d’Exécution.

## Exécuter directement une Activité — MVP T03

1. Ouvrir `Activités` dans le Catalogue.
2. Appuyer sur l’action `Exécuter` d’une Activité valide.
3. Le système fige un instantané autonome et affiche une préparation de `5 s`.
4. Après la préparation système, exécuter le Compte à rebours propre éventuel de l’Activité, puis les Séries, Pauses, côtés, la Récupération et la Fin d’activité éventuelle selon la définition figée.
5. Après la dernière phase propre à l’Activité, entendre le signal de fin et ouvrir immédiatement la Synthèse.
6. Sélectionner obligatoirement un Ressenti ; le Commentaire reste facultatif.
7. Appuyer sur `Terminer` pour enregistrer l’Exécution dans le Suivi général avec l’origine `ACTIVITY`.
8. Revenir au Catalogue des Activités avec recherche, filtres et position de défilement restaurés.

## Consulter ou modifier une Activité depuis le Catalogue — MVP T03

1. Ouvrir `Activités` dans le Catalogue.
2. Appuyer sur la surface de la carte, hors bouton Lecture.
3. Consulter ou modifier l’Activité.
4. Revenir au Catalogue dans son état précédent.

Le bouton Lecture reste réservé à l’Exécution directe. Le contrôle `Déployer` est actif dans le MVP et affiche ou masque le média associé à l’Activité, sans modifier l’action principale de la carte.

## Ajouter plusieurs Activités existantes à une Composition — MVP T03

1. Depuis `Ajouter une activité` dans la Composition, ouvrir le Catalogue d’Activités présenté pour la sélection.
2. Rechercher ou filtrer le Catalogue.
3. Sélectionner une ou plusieurs cartes ; l’ordre des touchers est libre.
4. Vérifier le nombre indiqué par `Ajouter N activité(s)`.
5. Appuyer sur `Ajouter N activité(s)`.
6. Retrouver la Composition avec les copies insérées selon l’ordre de présentation qu’avaient les Activités dans la liste filtrée au moment de la validation.

`Annuler` ferme le panneau sans insertion et restaure la Composition, sa position de défilement et ses valeurs déjà saisies. Le mécanisme existant de création directe d’une Activité locale à la Séance reste conservé fonctionnellement et techniquement, mais il n’est pas exposé dans cet enchaînement d’écrans du MVP courant.

# Parcours prévus pour une phase ultérieure

Les parcours suivants sont identifiés dès la conception mais ne font pas partie du MVP.
## Collaboration

- partager une séance avec une personne ou un groupe ;
- recevoir une séance partagée ;
- créer et administrer une séance collaborative ;
- gérer les droits de consultation et de modification ;
- conserver des copies personnelles indépendantes des séances partagées.

## Professionnels de santé et coachs

- recevoir une séance créée par un professionnel ;
- permettre à un professionnel de créer, mettre à jour et partager des séances ;
- suivre l'exécution des séances réalisées par un patient ou un client ;
- gérer plusieurs patients ou clients au sein d'une même interface.

## Synchronisation

- créer un compte utilisateur ;
- synchroniser les données entre plusieurs appareils ;
- sauvegarder automatiquement les données dans le cloud ;
- restaurer un historique complet sur un nouvel appareil.

## Intelligence artificielle

- proposer automatiquement des séances adaptées aux objectifs de l'utilisateur ;
- recommander des adaptations selon les performances ou les difficultés rencontrées ;
- analyser l'historique afin de proposer des évolutions progressives ;
- assister la création de nouvelles séances.

## Bibliothèque de contenus

- proposer une bibliothèque de séances et d'activités ;
- rechercher des contenus par catégorie, objectif ou zone corporelle ;
- importer des séances proposées par la communauté ou par des professionnels.

## Statistiques avancées

- suivre la progression sur plusieurs périodes ;
- comparer les performances entre différentes séances ;
- produire des tableaux de bord personnalisés ;
- partager certaines statistiques avec un professionnel.