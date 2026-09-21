# Objectif de cette note

Décrire, du point de vue de l'utilisateur, les principaux parcours permettant de créer, planifier, exécuter et suivre ses séances dans l'application.

Cette note décrit les objectifs de l'utilisateur et l'enchaînement logique des actions, sans détailler encore les écrans ni les choix techniques.
# Synthèse des parcours du MVP

## Objectif

Présenter la couverture fonctionnelle du MVP et orienter vers les parcours utilisateur détaillés de ce chapitre.

Le MVP permet à l'utilisateur :
- de gérer ses catégories de séances et de sélectionner les zones corporelles du référentiel applicatif ;
- de créer, réorganiser et exécuter une séance ;
- de créer une séance à partir de la duplication d'une séance existante ;
- d’archiver une Séance, de consulter les archives, de la restaurer ou de la supprimer définitivement depuis les archives ;
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
| T01–T02          | Gérer les catégories et zones corporelles     | Gestion des référentiels utilisateur                                           | Spécifié MVP          |
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
- les **Catégories de Séances**, personnalisables par l’utilisateur ;
- les **Zones corporelles**, issues d’un référentiel applicatif prédéfini et non administrable par l’utilisateur.

## Gestion des catégories

Les catégories permettent de classer les séances afin d'en faciliter l'organisation, la recherche et le suivi.
Une séance peut appartenir à zéro, une ou plusieurs catégories. Dans le parcours de création d’une Séance, une Catégorie nouvellement créée existe dans le brouillon indépendamment de son état sélectionné.

L'utilisateur peut :
- consulter les catégories existantes ;
- créer une nouvelle catégorie ;
- modifier son nom ;
- supprimer une catégorie dans la gestion dédiée, à partir du MVP bis.

Si une catégorie supprimée est utilisée par une ou plusieurs Séances, elle est retirée de ces Séances après confirmation. Les Instantanés historiques restent inchangés et conservent le libellé historique de la catégorie.

### Parcours

1. Ouvrir la gestion ou la sélection des catégories.
2. Consulter les catégories existantes.
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

Dans l’écran unique `Composition d’une séance`, il renseigne son nom, choisit une couleur parmi 12 propositions dont une valeur par défaut, puis construit progressivement la Composition. Les Activités peuvent être placées avant le Tour, dans le Tour ou après le Tour. La première Activité créée est insérée après le Compte à rebours initial et avant le Tour. Le Cycle technique reste fixé à 1 et n’est jamais affiché.

Pour chaque Activité, un écran unique permet de renseigner le nom, le mode Durée, Répétitions ou À l’échec, la cible éventuelle, le nombre de Séries, la Pause entre Séries, la Récupération après l’ensemble des Séries, ainsi que les informations facultatives. `Description de l’activité` et `Zone corporelle` sont repliables ; `Mode d’exécution` est déployé par défaut. L’action `Terminer` enregistre l’Activité.

En mode Durée, l’utilisateur peut confirmer soit `Séries`, soit `Durée totale`. Le contrôle confirmé devient pilote ; l’autre est recalculé. Si une Durée totale cible n’est pas compatible avec un nombre entier de Séries, l’application arrondit au nombre entier le plus proche, avec `.5` vers le haut, recalcule la durée réellement atteignable et affiche un message temporaire.

`Continuer` reste désactivé tant que le nom n’est pas renseigné, qu’aucune couleur n’est sélectionnée ou qu’aucun Exercice valide n’est présent. Après `Continuer`, il associe éventuellement une ou plusieurs Catégories puis enregistre la Séance.
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
3. Si aucune Routine n’est associée, l’archivage est immédiat. Si au moins une Routine est associée, confirmer `Archiver cette séance ?` ; `Annuler` n’écrit rien, `Archiver` archive la Séance et supprime toutes ses Routines associées.
4. Après succès, rester dans le Catalogue actif avec la carte retirée ; aucune action d’annulation immédiate de l’archivage n’est proposée.
5. Ouvrir `Filtrer` puis toucher l’unique option MVP `Archivées` : le filtre s’applique immédiatement et le panneau se ferme.
6. Depuis Archives, `Restaurer` remet la Séance active sans recréer ses anciennes Routines. Pour supprimer définitivement, glisser la carte vers la gauche afin de révéler `Supprimer`.
7. Choisir `Supprimer`, puis confirmer dans la modale. `Annuler` revient à la liste `Archivées`.

- Les exécutions déjà réalisées sont toujours conservées.
- L’archivage d’une Séance supprime toutes les Routines qui lui sont associées. Leur restauration n’est pas automatique si la Séance est ensuite restaurée..