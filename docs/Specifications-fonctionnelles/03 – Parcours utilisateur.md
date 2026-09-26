# Objectif de cette note

Décrire, du point de vue de l'utilisateur, les principaux parcours permettant de créer, planifier, exécuter et suivre ses séances dans l'application.

Cette note décrit les objectifs de l'utilisateur et l'enchaînement logique des actions, sans détailler encore les écrans ni les choix techniques.
# Synthèse des parcours du MVP

## Objectif

Présenter la couverture fonctionnelle du MVP et orienter vers les parcours utilisateur détaillés de ce chapitre.

Le MVP permet à l'utilisateur :
- de gérer les Étiquettes de Séances, les Catégories d’Exercices et le référentiel de Zones corporelles, puis de sélectionner les Zones corporelles applicables aux Exercices ;
- de créer, réorganiser et exécuter une séance ;
- de créer une séance à partir de la duplication d'une séance existante ;
- de planifier directement une Séance **ou un Exercice persistante** au moyen d'une Routine ;
- de modifier ou supprimer une routine ;
- de gérer une séance partiellement réalisée ou interrompue ;
- de consulter les Exécutions enregistrées dans le Suivi ;
- d’accéder au Catalogue des Exercices, d’y créer et modifier des Exercices persistantes ;
- de sélectionner plusieurs Exercices existants pour les insérer dans une Séance ;
- d’exécuter directement un Exercice avec préparation, Synthèse et Suivi.
## Parcours de référence

| Tranche          | Besoin utilisateur                            | Parcours de référence                                                          | Statut documentaire   |
| ---------------- | --------------------------------------------- | ------------------------------------------------------------------------------ | --------------------- |
| T01–T02          | Gérer Étiquettes, Catégories et Zones corporelles | Gestion des référentiels utilisateur                                        | Spécifié MVP          |
| T01–T02          | Créer et réorganiser une Séance               | Parcours principal — Créer une Séance                                          | Spécifié MVP          |
| T03              | Gérer des Exercices persistantes              | Accéder au Catalogue des Exercices ; créer, consulter ou modifier un Exercice | Spécifié MVP          |
| T03              | Ajouter des Exercices existants à une Séance | Sélectionner plusieurs Exercices existants depuis la Composition              | Spécifié MVP          |
| T03              | Exécuter directement un Exercice             | Préparation de 5 s, Exécution, Synthèse obligatoire et retour au Catalogue     | Spécifié MVP          |
| T04              | Exécuter une Séance                           | Exécution guidée fondamentale, auparavant T03                                  | Spécifié MVP          |
| T05 et suivantes | Dupliquer, planifier et suivre les Séances    | Parcours complémentaires 1 à 4                                                 | Spécifié MVP          |
| Hors MVP         | Créer et exécuter un Parcours                  | Parcours de création et d’exécution d’un Parcours                                                               | Partiel — à compléter |
## Principes communs

- Une Séance ou un Exercice persistant définit un contenu pouvant être exécuté directement.
- Dans le MVP, une Routine définit la planification d’une source `SESSION` ou `ACTIVITY` ; la même logique s’étend au Parcours lorsqu’il devient planifiable.
- Une Exécution conserve le déroulement réel de la source exécutée.
- Une Séance ou un Exercice persistant peut être exécuté sans être planifié.
- Une Séance ou un Exercice persistant peut être associé à plusieurs Routines.
- La modification de la source planifiée ou d'une Routine n'altère jamais les Exécutions déjà enregistrées.
- La suppression d'une Routine ne supprime jamais sa source associée ni les Exécutions déjà enregistrées.
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
- les **Catégories d’Exercices**, qui qualifient les Exercices et portent leur couleur ;
- les **Zones corporelles**, issues d’un référentiel utilisateur distinct des Catégories et initialisé avec des valeurs par défaut.

## Gestion des Étiquettes et des Catégories

Les Étiquettes classent les Séances et portent leur couleur. Les Catégories classent les Exercices et portent leur couleur sémantique. Les Zones corporelles restent un référentiel distinct.
Une Séance utilise son Étiquette pour son classement et sa couleur. Un Exercice utilise sa Catégorie ; les Zones corporelles restent indépendantes. La gestion détaillée de ces référentiels suit les écrans et contrats actifs.

L'utilisateur peut consulter et sélectionner les Étiquettes de Séance et les Catégories d’Exercice selon le contexte d’écran.

### Parcours

1. Ouvrir la gestion ou la sélection du référentiel concerné.
2. Consulter les Étiquettes de Séance ou les Catégories d’Exercice existantes.
3. Créer une nouvelle Étiquette depuis la Composition de Séance lorsque nécessaire ; la nouvelle Étiquette devient sélectionnable dans ce contexte.
4. Créer ou sélectionner une Catégorie depuis l’éditeur d’Exercice ; les Zones corporelles restent un référentiel distinct.
5. Ouvrir la sélection `Zones corporelles`, sélectionner une ou plusieurs Zones existantes ou créer une nouvelle Zone directement depuis la modale. La gestion du référentiel autorise également le renommage et la suppression des Zones existantes.
6. Dans les modales `Étiquettes`, `Catégorie` et `Zones corporelles`, un appui court conserve sa fonction de sélection/désélection. Un appui long sur une option n’en modifie pas la sélection et ouvre une confirmation de suppression.
7. La confirmation propose `Annuler` et `Supprimer`. Toutes les options sont supprimables, y compris les valeurs initiales fournies par KODJO. Après `Supprimer`, l’option disparaît du référentiel et de la sélection courante. Si elle est utilisée par des Séances ou Exercices existants, ses associations courantes sont retirées ; les Instantanés et Exécutions historiques restent inchangés.

## Référentiel des zones corporelles

Les zones corporelles permettent de caractériser les exercices selon les parties du corps principalement sollicitées.
Un Exercice peut être associée à zéro, une ou plusieurs zones corporelles.

Dans le MVP, les Zones corporelles constituent un référentiel utilisateur administrable, initialisé avec dix valeurs par défaut. L’utilisateur peut consulter et sélectionner plusieurs Zones corporelles lors de la création ou de la modification d’un Exercice. Il peut également créer une nouvelle Zone corporelle, renommer une Zone existante et supprimer une Zone. Lorsqu’une Zone supprimée est utilisée par des Exercices courants, ses associations sont retirées après confirmation ; les Instantanés et Exécutions historiques restent inchangés.

# Parcours principal — Créer et exécuter une séance

Au lancement, le splash KODJO ouvre automatiquement le `Catalogue des séances`. Celui-ci est l’écran d’accueil du MVP.

## Objectif du parcours

Permettre à l'utilisateur de créer une séance, de l'exécuter immédiatement en étant guidé par l'application et de retrouver ensuite son exécution dans l'historique.

La planification des séances est décrite dans le parcours **Gérer les routines**.
## Situation de départ

L'utilisateur souhaite créer une nouvelle séance correspondant à un entraînement sportif, une séance de rééducation, une routine de mobilité ou toute succession d'exercices nécessitant un guidage.

Il peut créer une séance entièrement nouvelle ou partir d'une copie d'une séance existante.
## Parcours

### 1. Créer une séance

L'utilisateur crée une nouvelle séance depuis le Catalogue.

Dans l’écran unique `Composition d’une séance`, il renseigne son nom, sélectionne éventuellement son Étiquette — dont la couleur devient la couleur affichée de la Séance — puis construit progressivement la Composition. La Composition peut contenir un Point d’arrêt déplaçable ; son attente ne compte pas dans la durée. Un Exercice peut définir son propre Compte à rebours et sa propre Fin d’exercice, distincts des phases structurelles de la Séance. Les Exercices peuvent être placées avant le Circuit, dans le Circuit ou après le Circuit. Le premier Exercice ajouté est inséré après le Compte à rebours initial et avant le Circuit. Le Cycle technique reste fixé à 1 et n’est jamais affiché.

Pour chaque Exercice, un écran unique permet de renseigner le nom, la Catégorie, les Zones corporelles, le mode Durée, Répétitions ou À l’échec, la cible éventuelle, le nombre de Séries, la Pause entre Séries, le Changement de côté, la **Pause au changement de côté** lorsque l’Exercice est bilatérale, le Compte à rebours propre et la Fin d’exercice propre. La Description reste facultative. L’action `Terminer` enregistre l’Exercice.

En mode Durée, l’utilisateur peut confirmer soit `Séries`, soit `Durée totale`. Le contrôle confirmé devient pilote ; l’autre est recalculé. Si une Durée totale cible n’est pas compatible avec un nombre entier de Séries, l’application arrondit au nombre entier le plus proche, avec `.5` vers le haut, recalcule la durée réellement atteignable et affiche un message temporaire.

`Continuer` reste désactivé tant que le nom n’est pas renseigné ou qu’aucun Exercice valide n’est présent. L’Étiquette éventuelle est déjà gérée dans la Composition ; `Continuer` valide et enregistre la Séance avec sa Composition et son Étiquette.
### 2. Réorganiser une séance

À tout moment, l'utilisateur peut revenir modifier une séance existante.

Il peut notamment :
- ajouter une exercice ;
- supprimer une exercice ;
- modifier une exercice ;
- déplacer une exercice par appui long sur sa carte, puis glissement vers la position cible ;
- modifier le nombre de Tours du Circuit ;
- modifier les paramètres généraux de la séance.

Les modifications sont immédiatement prises en compte pour les futures exécutions.

Chaque occurrence de Séance affiche systématiquement sa **Récupération après exercice**, y compris lorsqu’elle vaut `0 s`. Cette récupération se déplace avec l’occurrence, est copiée lors de sa duplication et disparaît lors de sa suppression. Sa valeur n’est jamais recalculée en fonction de l’Exercice suivante.
### 3. Démarrer une séance

L'utilisateur choisit la zone `Démarrer` d’une séance et ouvre d’abord l’état initial d’Exécution. Toucher la partie principale de la carte ouvre au contraire la Séance en modification.
Avant le lancement, il peut consulter un résumé de la séance et vérifier ses principaux paramètres.
### 4. Exécuter une séance

Pendant l'exécution, l'application guide automatiquement l'utilisateur exercice après exercice.

Il peut notamment :
- suivre le minuteur ou les répétitions ;
- mettre la séance en pause ;
- reprendre la séance ;
- passer directement à l'exercice suivante ;
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

- Une Routine ne modifie jamais le contenu de sa source.
- Une Séance ou un Exercice persistant peut être associé à plusieurs Routines.
- La suppression d'une Routine ne supprime jamais sa source.
- Les exécutions déjà réalisées sont toujours conservées.
- L'archivage d'une Séance supprime toutes les Routines qui lui sont associées. Cette suppression ne demande une confirmation que lorsqu’au moins une Routine est effectivement associée ; sans Routine associée, l’archivage est immédiat et un snackbar `Séance archivée` avec `Annuler` permet de revenir sur l’action. Après une confirmation ayant entraîné la suppression de Routines, aucun snackbar d’annulation n’est affiché. Leur restauration n'est pas automatique si la Séance est ensuite restaurée.
## Résultat attendu

L'utilisateur gère facilement la planification de ses séances sans modifier leur contenu et conserve un historique fiable de toutes les exécutions réalisées.

# Parcours complémentaire 3 — Gérer une séance interrompue ou partiellement réalisée

## Situation de départ

Pendant l'exécution d'une séance, l'utilisateur ne réalise pas toutes les exercices prévues ou doit interrompre son entraînement avant son terme.
La séance peut avoir été lancée directement ou à partir d'une routine planifiée.
## Parcours

1. L'utilisateur démarre une séance.
2. Pendant son exécution, il peut :
    - mettre la séance en pause ;
    - reprendre la séance ;
    - passer directement à l'exercice suivante ;
    - ignorer une exercice ;
    - terminer une exercice avant son terme ;
    - interrompre complètement la séance.
3. En cas d'interruption volontaire, l'application lui propose :
    - de reprendre immédiatement ;
    - d'arrêter définitivement la séance.
4. Si la séance est reprise, l'exécution reprend à la dernière exercice enregistrée.
5. Lorsque la séance est terminée ou abandonnée, l'application présente un récapitulatif indiquant notamment :
    - les exercices réalisées ;
    - les exercices partiellement réalisées ;
    - les exercices ignorées ;
    - les exercices non commencées ;
    - la durée réelle de la séance ;
    - son statut.
6. Lorsque l'écran de Synthèse est présenté, l'utilisateur doit renseigner un ressenti et peut ajouter un commentaire facultatif de **200 caractères maximum**. En cas d'interruption technique sans passage par la Synthèse, le ressenti peut être absent.
7. La séance est enregistrée dans l'historique avec son statut :
- Terminée : toutes les Exercices ont été terminées normalement et la phase `SESSION_END` a été achevée.
- Partielle : la phase `SESSION_END` a été achevée, mais au moins un Exercice a été interrompue ou ignorée.
- Interrompue : l'Exécution a été arrêtée avant l'achèvement de `SESSION_END`, y compris pendant cette phase.
## Points d'attention

- Une fermeture accidentelle de l'application ne doit pas faire perdre la séance en cours. Au retour dans l’application, si une Exécution était `En cours`, l’utilisateur doit choisir **Reprendre la séance** ou **Arrêter la séance** avant de pouvoir démarrer une nouvelle Exécution.
- Les données déjà enregistrées doivent pouvoir être restaurées.
- L'application ne doit pas obliger l'utilisateur à justifier chaque exercice ignorée.
- La différence entre une séance suspendue, terminée et abandonnée doit rester compréhensible.
- La règle permettant de reprendre une séance après une très longue interruption est définie comme suit :
	- Si une Séance reste en pause pendant au moins 30 minutes consécutives, l'application demande à l'utilisateur s'il souhaite reprendre son Exécution.
	- Si l'utilisateur confirme, la séance reprend à l'exercice où elle avait été interrompue.
	- En l'absence de réponse, la séance est automatiquement enregistrée avec le statut Interrompue.
	- Dans une version ultérieure, cette durée maximale pourra être configurée dans les préférences utilisateur.
## Résultat attendu

L'utilisateur conserve un historique fidèle de ce qu'il a réellement effectué, même lorsque la séance diffère de ce qui était initialement prévu.

# Parcours complémentaire 4 — Consulter le suivi des séances

## Objectif du parcours

Permettre à l'utilisateur de retrouver l'ensemble de ses séances exécutées, de consulter leur résultat, d'analyser leur déroulement et de suivre sa progression.
## Situation de départ

L'utilisateur a déjà exécuté une ou plusieurs séances.
Il souhaite consulter son historique afin de retrouver une séance, vérifier son déroulement ou suivre son exercice au fil du temps.
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

L'utilisateur dispose d'un historique fiable de toutes ses exécutions et peut suivre facilement son exercice ainsi que sa progression au fil du temps.

# Parcours MVP T03 — Catalogue des Exercices

## Accéder au Catalogue des Exercices

1. Ouvrir le Catalogue puis sélectionner `Exercices`.
2. Consulter la liste des Exercices persistantes.
3. Utiliser la surface d’une carte pour ouvrir l’Exercice en consultation ou modification.
4. Utiliser le bouton Lecture pour lancer directement un Exercice valide.
5. Utiliser `Créer` pour ouvrir directement la création correspondant au Catalogue courant.

La recherche, les filtres et la position de défilement appartiennent à l’état du Catalogue et sont restaurés au retour d’une consultation, d’une modification ou d’une Exécution directe.

## Créer un contenu depuis le Catalogue

`Créer` est contextuel au Catalogue affiché et ne présente aucun écran ni arbre intermédiaire :

1. dans le Catalogue `Exercices`, `Créer` ouvre directement le formulaire de création d’un Exercice persistante ;
2. dans le Catalogue `Séances`, `Créer` ouvre directement une nouvelle Composition de Séance ;
3. dans le Catalogue `Parcours`, le même principe ouvre directement la création d’un Parcours lorsque ce Catalogue devient fonctionnel.

Dans T03/MVP, `Parcours` reste désactivé : cette règle n’active ni le Catalogue ni la création de Parcours.

## Créer ou modifier un Exercice

1. Depuis le Catalogue des Exercices, utiliser `Créer` pour ouvrir une nouvelle `ActivityDefinition`, ou toucher une carte existante pour la modifier.
2. Renseigner le nom de l’Exercice.
3. Sélectionner sa **Catégorie** et, si nécessaire, ses **Zones corporelles**.
4. Définir les paramètres d’exécution :
   - mode `Durée`, `Répétitions` ou `À l’échec` ;
   - cible du mode lorsqu’elle existe ;
   - nombre de Séries ;
   - Pause entre Séries ;
   - `Changement de côté` : `Aucun`, `D→G` ou `G→D` ;
   - Pause au changement de côté, uniquement en `D→G` ou `G→D` ;
   - Compte à rebours propre de l’Exercice lorsqu’il est utilisé ;
   - Fin d’exercice propre lorsqu’elle est utilisée ;
   - Durée totale dérivée ou pilotée selon le mode.
5. Ajouter ou consulter le média selon le périmètre disponible.
6. Valider avec `Terminer`.

Les paramètres métier restent identiques entre création et modification ; seule l’organisation de l’écran et le contexte de retour diffèrent.

### Déroulement d’un Exercice

Lorsqu’elle est exécutée, l’Exercice suit son propre enchaînement intrinsèque : Compte à rebours d’Exercice éventuel → Séries du premier côté → Pause au changement de côté éventuelle → Séries du second côté → Fin d’exercice éventuelle. Les Pauses n’existent qu’entre Séries successives d’un même côté. Dans une Séance/Parcours, la Récupération après exercice de l’occurrence est exécutée ensuite ; en Exécution directe, elle n’existe pas.

## Ajouter un Exercice depuis une Composition

1. Appuyer sur `Ajouter une exercice`.
2. Le parcours actuellement exposé ouvre directement la sélection des Exercices du Catalogue.
3. Rechercher ou filtrer les Exercices puis sélectionner une ou plusieurs références.
4. Valider avec `Ajouter N exercice(s)`.
5. Les copies sont insérées dans la Composition et deviennent indépendantes de leur `ActivityDefinition` source.

La capacité existante de créer directement un Exercice locale à la Séance, non enregistrée dans le Catalogue, reste fonctionnellement et techniquement conservée mais n’est pas exposée dans cet enchaînement d’écrans du MVP courant.

## Utiliser un Exercice de référence

1. Ouvrir `Exercices` dans le Catalogue.
2. Créer une référence d’Exercice persistante, réutilisable et directement exécutable.
3. Depuis une Composition, choisir une référence existante.
4. L’application copie ses données et ses associations média dans la Séance.
5. Modifier librement la copie sans modifier la référence ni les autres copies.

Un Exercice créée directement dans une Séance ne rejoint pas le catalogue. L’action `Enregistrer dans mes exercices` est reportée au-delà de la première version de la bibliothèque.

## Exécuter un Exercice À l’échec — MVP

L’utilisateur démarre une Série sans objectif temporel ni nombre de répétitions cible. Il sélectionne `Suivant` pour terminer la Série, exactement comme en mode Répétitions. La Pause configurée s’exécute uniquement entre deux Séries successives. Si l’Exercice est bilatérale, la Pause au changement de côté éventuelle intervient entre les deux passages. En Exécution directe, aucune Récupération après exercice n’est ajoutée ; dans une Séance/Parcours, la Récupération après exercice appartient à l’occurrence et s’exécute après celle-ci.

## Créer et exécuter un Parcours — hors MVP, conception partielle

1. Renseigner un nom et une couleur.
2. Ajouter au moins deux étapes, chacune référençant une Séance ; une même Séance peut être ajoutée plusieurs fois.
3. Choisir une transition manuelle ou automatique ; l’automatique utilise une durée commune, `30 s` par défaut.
4. Lancer manuellement le Parcours. Le lancement fige un instantané.
5. Après chaque Séance intermédiaire, remplacer son écran de fin par l’écran de transition ; conserver ensuite le compte à rebours initial de la Séance suivante.
6. Après la dernière Séance, afficher la fin du Parcours et conserver l’Exécution globale ainsi que les Exécutions de Séance liées.

En cas d’arrêt confirmé, le Parcours, la Séance courante et les résultats déjà produits sont enregistrés comme interrompus selon leur niveau ; aucune Exécution de Séance n’est créée pour les étapes non commencées.

## Parcours bilatéral

1. Dans l’éditeur d’Exercice, `Changement de côté` propose `Aucun`, `D→G` ou `G→D`.
2. Aucun réglage de côté n’est exposé au niveau du Circuit dans la version actuelle ; le support technique historique est conservé mais reste fixé à `UNILATERAL` et non modifiable.
3. Une carte d’Exercice affiche sa direction propre `D→G` ou `G→D` lorsqu’elle est bilatérale ; elle n’affiche rien avec `Aucun`.
4. À l’Exécution, `Côté droit` ou `Côté gauche` apparaît pour le passage concerné, sans compteur `1/2` ou `2/2`.
5. Un Exercice bilatérale termine toutes ses Séries du premier côté puis toutes celles du second.
6. La modale générique de passage à l’Exercice suivante reste inchangée. Confirmée pendant le premier côté, elle enregistre ce côté comme partiel et ouvre le second côté ; confirmée pendant le second, elle poursuit le Plan d’Exécution.

## Exécuter directement un Exercice — MVP T03

1. Ouvrir `Exercices` dans le Catalogue.
2. Appuyer sur l’action `Exécuter` d’un Exercice valide.
3. Le système fige un instantané autonome et affiche une préparation de `5 s`.
4. Après la préparation système, exécuter le Compte à rebours propre éventuel de l’Exercice, puis les Séries, Pauses, côtés, la Récupération et la Fin d’exercice éventuelle selon la définition figée.
5. Après la dernière phase propre à l’Exercice, entendre le signal de fin et ouvrir immédiatement la Synthèse.
6. Sélectionner obligatoirement un Ressenti ; le Commentaire reste facultatif.
7. Appuyer sur `Terminer` pour enregistrer l’Exécution dans le Suivi général avec l’origine `ACTIVITY`.
8. Revenir au Catalogue des Exercices avec recherche, filtres et position de défilement restaurés.

## Consulter ou modifier un Exercice depuis le Catalogue — MVP T03

1. Ouvrir `Exercices` dans le Catalogue.
2. Appuyer sur la surface de la carte, hors bouton Lecture.
3. Consulter ou modifier l’Exercice.
4. Revenir au Catalogue dans son état précédent.

Le bouton Lecture reste réservé à l’Exécution directe. Le contrôle `Déployer` est actif dans le MVP et affiche ou masque le média associé à l’Exercice, sans modifier l’action principale de la carte.

## Ajouter plusieurs Exercices existants à une Composition — MVP T03

1. Depuis `Ajouter une exercice` dans la Composition, ouvrir le Catalogue d’Exercices présenté pour la sélection.
2. Rechercher ou filtrer le Catalogue.
3. Sélectionner une ou plusieurs cartes ; l’ordre des touchers est libre.
4. Vérifier le nombre indiqué par `Ajouter N exercice(s)`.
5. Appuyer sur `Ajouter N exercice(s)`.
6. Retrouver la Composition avec les copies insérées selon l’ordre de présentation qu’avaient les Exercices dans la liste filtrée au moment de la validation.

`Annuler` ferme le panneau sans insertion et restaure la Composition, sa position de défilement et ses valeurs déjà saisies. Le mécanisme existant de création directe d’un Exercice locale à la Séance reste conservé fonctionnellement et techniquement, mais il n’est pas exposé dans cet enchaînement d’écrans du MVP courant.

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

- proposer une bibliothèque de séances et d'exercices ;
- rechercher des contenus par catégorie, objectif ou zone corporelle ;
- importer des séances proposées par la communauté ou par des professionnels.

## Statistiques avancées

- suivre la progression sur plusieurs périodes ;
- comparer les performances entre différentes séances ;
- produire des tableaux de bord personnalisés ;
- partager certaines statistiques avec un professionnel.

## Consulter les médias pendant l’Exécution — conception post-MVP

1. L’Exercice s’affiche sur la face Information.
2. Si au moins un média existe, l’utilisateur touche le bouton de changement de face.
3. La carte se retourne horizontalement et affiche la face Média.
4. L’utilisateur parcourt les médias par swipe horizontal, un média par geste, dans l’ordre de la galerie.
5. Une vidéo reste arrêtée tant que l’utilisateur n’appuie pas sur Lecture ; l’Exécution continue pendant sa lecture.
6. Un appui sur le média ouvre le plein écran ; le cadre flottant conserve le nom, le côté, le chrono, Série/Tour et les commandes d’Exécution.
7. Fermer le plein écran revient au même média. Retourner la carte revient à la face Information.
8. Pendant la même séance, KODJO restitue la dernière face et le dernier média de chaque Exercice déjà rencontré.
9. Une nouvelle séance redémarre sur la face Information.
10. Si l’Exercice se termine pendant la consultation média, KODJO ferme le média de cet Exercice et poursuit la transition normale.

Référence : `../CONCEPTION-EXECUTION-MEDIA.md`.

## Planifier un Parcours — cible future

Un Parcours fonctionnel pourra être planifié directement. Le parcours utilisateur réutilise celui des Routines : sélection ou préremplissage de la source, paramètres de planification, validation, occurrences dans le Calendrier. Aucun parcours parallèle spécifique aux Parcours n’est introduit.

### Règles de Composition liées à la récupération après exercice

Toute `SessionActivity` possède `postActivityRecoverySeconds`. La valeur `0 s` est valide et reste représentée. La dernière occurrence avant `SESSION_END` conserve et exécute sa récupération. Lorsque l’occurrence appartient au Circuit, chaque occurrence exécute sa récupération à chaque passage. L’insertion d’une référence du Catalogue crée une nouvelle valeur contextuelle depuis le défaut global ; elle ne copie aucune récupération post-exercice depuis l’`ActivityDefinition`.

## Parcours consolidés — 26 septembre 2026

Création Exercice : choisir exactement une Catégorie et au moins une Zone corporelle avant validation. Les valeurs par défaut du Profil sont proposées à la création puis deviennent indépendantes. Création/modification Séance : le groupe répété est le **Circuit**, son nombre de répétitions est le nombre de **Tours** ; un réglage global activé par défaut contrôle la prise en compte des Compte à rebours/Fins propres aux Exercices. L’insertion d’un Point d’arrêt ne propose jamais la position immédiatement après le Compte à rebours initial ni immédiatement avant la Fin de séance ; un Point d’arrêt placé dans le Circuit est rencontré à chaque Tour.
