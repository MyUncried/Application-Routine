## Objectif de conception

L’interface du produit fini doit être principalement visuelle, intuitive et utilisable avec le moins de touchers possible.

L’utilisateur doit notamment pouvoir lancer rapidement une routine, comprendre immédiatement l’action attendue pendant une séance et accéder facilement aux fonctions courantes.

Pendant l’exécution, le guidage visuel est complété par des signaux sonores et des annonces vocales afin que l’utilisateur puisse suivre la séance sans regarder constamment l’écran.

La conception de la V1 respecte les principes suivants :

- limiter le nombre d’écrans et d’étapes intermédiaires ;
- donner un accès direct aux actions les plus fréquentes ;
- privilégier les images, les vidéos, les icônes et les indicateurs visuels ;
- limiter les textes affichés pendant l’exécution ;
- rendre les informations essentielles perceptibles visuellement et sonorement ;
- réunir la consultation et la modification d’une routine lorsque cela simplifie le parcours ;
- enregistrer automatiquement les modifications ;
- éviter les confirmations inutiles lorsqu’une action peut être annulée ;
- afficher clairement l’action principale de chaque écran ;
- rendre les commandes essentielles facilement accessibles avec le pouce ;
- placer les paramètres moins fréquents dans un niveau secondaire.

### Rapidité de création

La création d’une routine, d’un exercice ou d’une pause doit pouvoir être réalisée en quelques secondes, avec un minimum de saisies et de touchers.
L’application privilégie :
- des valeurs par défaut immédiatement utilisables ;
- l’affichage initial des seuls paramètres indispensables ;
- l’ajout direct d’un élément à l’endroit choisi dans la routine ;
- la possibilité de modifier ou d’enrichir ultérieurement chaque élément ;
- un accès secondaire aux consignes, médias et réglages avancés. 

La création rapide constitue le parcours principal. L’ajout d’une consigne, d’une photo, d’une vidéo ou de paramètres détaillés reste facultatif.

## Navigation principale et articulation des écrans

### Navigation principale

La navigation principale donne accès à :

- `Mes routines` ;
- `Planification` ;
- `Suivi`.

`Mes routines` constitue l’écran d’accueil par défaut.

La navigation reste simple et immédiatement compréhensible. L’onglet `Planification` est visible afin de préparer la navigation cible, mais il ouvre uniquement un écran indiquant `Bientôt disponible` : aucune programmation n’est développée dans la V1.

### Parcours de création et d’exécution

Depuis `Mes routines`, l’utilisateur peut :

- créer une routine ;
- ouvrir une routine existante ;
- lancer directement une routine existante.

La création d’une routine suit le parcours suivant :

1. saisie obligatoire du nom ;
2. composition de la routine ;
3. sélection facultative d’une ou plusieurs catégories ;
4. enregistrement de la routine.

L’ouverture d’une routine existante donne directement accès à sa composition.

Depuis la composition, l’utilisateur peut :

- ajouter, modifier ou réorganiser les activités ;
- valider la composition afin d’accéder aux catégories de la routine ;
- lancer une routine existante.

Le lancement ouvre l’exécution guidée. Lorsque la séance se termine, l’écran de fin est affiché. L’action `Terminer` ramène ensuite l’utilisateur à la routine exécutée.

### Parcours de consultation

Depuis `Suivi`, l’utilisateur accède à la liste des séances enregistrées.

Toucher une séance ouvre son détail.

Une action de retour ramène à l’suivi sans modifier la séance ni la routine correspondante.

### Écrans et panneaux

Les écrans principaux sont :

1. `Mes routines` ;
2. `Nouvelle routine — Saisie du nom` ;
3. `Composition d’une routine` ;
4. `Catégories de la routine` ;
5. `Exécution guidée` ;
6. `Fin de séance` ;
7. `Suivi` ;
8. `Détail d’une séance`.

Un écran informatif minimal `Planification — Bientôt disponible` peut être ajouté au prototype. Il ne constitue pas une fonction de programmation de la V1.

Les panneaux servent aux actions courtes réalisées sans quitter le contexte courant, notamment :

- créer ou modifier un exercice ;
- personnaliser ou modifier une pause ;
- sélectionner un exercice existant ;
- confirmer une action susceptible d’entraîner une perte.

Un panneau se referme après la validation de l’action et ramène l’utilisateur à l’endroit précis depuis lequel il l’avait ouvert.

### Retour et fermeture

En dehors d’une séance en cours, revenir à l’écran précédent ne nécessite pas de confirmation lorsque les modifications ont déjà été enregistrées automatiquement.

Fermer un panneau de création sans avoir ajouté l’élément ne crée rien.

Quitter une séance en cours suit le comportement défini dans `Écran 3 – Exécution guidée`.

### Conservation du contexte

L’application conserve autant que possible le contexte de l’utilisateur :

- la routine précédemment ouverte ;
- la position dans son parcours ;
- l’étape en cours pendant une séance ;
- la position dans l’suivi.

Après la fermeture d’un panneau, l’utilisateur retrouve l’élément qu’il vient d’ajouter ou de modifier.

### Enregistrement automatique

Les créations et modifications apportées aux routines, exercices et pauses sont enregistrées automatiquement.

Aucun bouton général `Enregistrer` n’est nécessaire.

L’application indique discrètement lorsqu’une modification a été prise en compte ou si son enregistrement a échoué.

### Navigation pendant une séance

Pendant l’exécution guidée, la navigation principale n’est pas affichée.

L’utilisateur reste concentré sur la séance et utilise les commandes prévues pour :

- consulter le parcours ;
- changer d’étape ;
- suspendre la séance ;
- quitter la séance.

Il ne peut pas rejoindre accidentellement `Mes routines` ou `Suivi` sans passer par l’action de sortie de séance.

### Cohérence des libellés

Les mêmes termes sont utilisés dans toute l’application :

- `Routine` pour l’ensemble du parcours à exécuter ;
- `Activité` pour une étape de la routine ;
- `Pause` pour une étape de récupération minutée ;
- `Activité` pour une étape élémentaire : exercice, pause ou récupération ;
- `Série` pour une séquence ordonnée de séries, pouvant être répétée ;
- `Cycle` pour l’ensemble des répétitions de la série, suivi des éventuelles séries de fin de cycle ;
- `Séance` pour l’exécution enregistrée d’une routine ;
- `Terminé` pour valider la fin d’un exercice ;
- `Continuer` pour poursuivre après une pause à fin manuelle ;
- `Démarrer` pour lancer une routine ou une séance.

Ces libellés seront vérifiés dans les wireframes afin de conserver des actions courtes et immédiatement compréhensibles.

## Ecran 1 – Profil et préférences

![[Profil et préférences.png]]
### Objectif

Permettre à l'utilisateur de consulter ses informations personnelles et de personnaliser le comportement général de l'application.

Cet écran regroupe les paramètres utilisés par défaut lors de la création de nouvelles routines ainsi que les préférences liées à l'exécution des séances.
### Contenu

L'écran est organisé en plusieurs sections :
#### Profil

Affiche les informations générales de l'utilisateur :
- photo ou avatar ;
- nom ou pseudonyme ;
- informations du compte (versions futures).

Dans le MVP, cette section est principalement informative.
#### Préférences de création

Ces paramètres servent de valeurs par défaut lors de la création d'une nouvelle routine ou d'une nouvelle activité.

L'utilisateur peut notamment définir :
- la durée du compte à rebours initial ;
- les valeurs proposées par défaut lors de la création d'une activité ;
- les autres paramètres de création disponibles dans le MVP.

Ces valeurs restent modifiables pour chaque routine.

#### Préférences d'exécution

L'utilisateur peut personnaliser le comportement des séances :
- activation ou désactivation des annonces vocales ;
- activation ou désactivation des bips de rythme ;
- activation ou désactivation du compte à rebours sonore des trois dernières secondes.

Ces préférences sont utilisées par défaut lors de l'exécution des nouvelles routines.
#### Référentiels personnalisables

L'écran donne accès aux référentiels personnels de l'utilisateur.

Dans le MVP, l'utilisateur peut créer :
- des catégories de routine ;
- des zones corporelles.

La gestion complète (renommer, désactiver, supprimer) sera introduite dans une version ultérieure.

### Comportement

Les modifications sont enregistrées automatiquement.

Aucun bouton **Enregistrer** n'est nécessaire.
Les nouvelles préférences sont immédiatement prises en compte pour les créations et exécutions suivantes.
Les séances en cours ne sont pas modifiées.

### Navigation

L'écran est accessible depuis l'icône **Profil** présente dans la barre supérieure de l'application.
L'action **Retour** ramène l'utilisateur à l'écran précédemment affiché.

## Écran 2 – Mes routines

![[Mes routines.png]]

### Objectif

Permettre à l’utilisateur de retrouver toutes ses routines, d’en ouvrir une, de la lancer immédiatement ou d’en créer une nouvelle.

Cet écran constitue l’accueil de l’application.

### Contenu affiché

Les routines sont affichées sous forme de cartes visuelles compactes et homogènes.

Chaque carte comporte :

- une icône par défaut ;
- le nom de la routine ;
- le nombre d’activités ;
- sa durée estimée, lorsqu’elle peut être calculée ;
- la date ou une indication de dernière utilisation ;
- un bouton `Démarrer`.

Les routines sont classées par dernière utilisation, de la plus récente à la plus ancienne. Pour une routine jamais exécutée, la date de dernière modification est utilisée.

### Actions principales

- toucher une carte ouvre la composition de la routine ;
- toucher `Démarrer` lance immédiatement la routine ;
- toucher `＋` crée une nouvelle routine.
### Création d’une routine

Toucher `＋` ouvre l’écran `Nouvelle routine — Saisie du nom`.

Dès que le nom est validé :

- la routine est créée avec son identifiant et ses dates techniques ;
- l’utilisateur accède à l’écran de composition initialisé ;
- il peut ajouter et organiser les activités de la routine.

Lorsque la composition est validée, l’écran `Catégories de la routine` s’ouvre. L’utilisateur peut sélectionner zéro, une ou plusieurs catégories existantes ou créer une nouvelle catégorie, puis toucher `Enregistrer la routine`.

### Actions secondaires

Un menu secondaire permet de :

- dupliquer la routine ;
- la renommer ;
- la supprimer.

La suppression d’une routine ne supprime pas l’suivi des séances déjà effectuées.

### Routine vide

La V1 ne comporte pas de statut « brouillon ».

Une routine est enregistrée automatiquement dès qu’elle possède un nom. Tant qu’elle ne contient aucun activité :

- elle porte la mention `Routine vide` ;
- son bouton `Démarrer` est désactivé ;
- elle peut être ouverte, complétée ou supprimée.

### État vide

Si aucune routine n’a encore été créée, l’écran présente :

- une courte explication ;
- une illustration ou une icône ;
- une action principale `Créer ma première routine`.


## Écran 3 – Nouvelle routine : saisie du nom

![[Nouvelle routine - Nom.png]]
### Objectif

Créer l’identité minimale de la routine avant d’accéder à sa composition.

### Contenu et comportement

- le champ `Nom de la routine` est obligatoire ;
- le nom comporte de 1 à 80 caractères ;
- le bouton `Continuer` reste désactivé tant que le nom est vide ou invalide ;
- le retour annule la création si la routine n’a pas encore été créée ;
- la validation ouvre l’écran de composition de la nouvelle routine.

## Écran 4 – Composition d’une routine

![[Nouvelle routine - Etat initial et liste d'activités.png]]
### Objectif

Permettre à l’utilisateur de visualiser immédiatement le déroulement complet d’une routine, de consulter ou modifier ses éléments et de lancer la séance.

La routine est représentée comme un parcours vertical inspiré de Duolingo, et non comme une simple liste.

### Principe de représentation d’une routine

La composition d’une routine est représentée sous la forme d’un parcours visuel vertical.

Chaque exercice, étape ou pause constitue un nœud du parcours. Les nœuds sont reliés afin de matérialiser leur ordre d’exécution.

Cette représentation doit permettre de comprendre immédiatement :

- le début et la fin de la routine ;
- l’ordre des exercices et des pauses ;
- la position de l’utilisateur dans le parcours ;
- les étapes terminées, en cours, suivantes ou ignorées ;
- la progression générale de la séance.

Un nœud peut comporter :

- une icône ou une vignette ;
- le nom abrégé de l’exercice ou de l’étape ;
- sa durée ou son nombre de répétitions ;
- un état visuel indiquant sa situation dans la séance.

Le parcours ne constitue pas un système de niveaux à débloquer. Tous les éléments restent consultables et modifiables. Le bouton `Démarrer` lance l’ensemble de la routine depuis son début.

Dans la V1, cette représentation permet également d’identifier visuellement l’échauffement, les séries, les conteneurs `Série × N` et `Cycle × N`, les séries de fin de cycle et les séries de fin de routine.

### En-tête

L’en-tête affiche :

- le nom de la routine ;
- sa durée estimée ;
- le nombre d’activités ;
- un accès aux actions secondaires.

Le nom de la routine peut être modifié directement, sans ouvrir un écran distinct.

Les actions secondaires comprennent :

- dupliquer la routine ;
- supprimer la routine.

### Parcours visuel

Les activités apparaissent dans leur ordre d’exécution le long d’un parcours vertical.

Chaque élément est représenté par un nœud relié au suivant.

Un nœud d’exercice comporte :

- une icône ou une vignette ;
- le nom abrégé de l’exercice ;
- sa durée, son nombre de répétitions ou une indication d’exécution manuelle ;
- éventuellement une indication visuelle de la présence d’une photo, d’une vidéo ou d’une consigne.

Une pause utilise une représentation visuelle différente et plus discrète afin de ne pas être confondue avec un exercice.

Le parcours commence par un repère de départ et se termine par un repère de fin.

### Paramètres de répétition

Le nombre de répétitions est consulté et modifié directement dans les en-têtes `Série × N` et `Cycle × N`. Aucun panneau séparé `Séries / Cycles` ne duplique ces valeurs.

Le série et le cycle sont des conteneurs visuels imbriqués. Chacun possède une icône et un chevron permettant de développer ou replier son contenu. Une série placée après le série mais dans le cycle est exécutée une fois à la fin de chaque cycle. Une série placée après le cycle est exécutée une seule fois en fin de routine et utilise une icône dédiée, par exemple un drapeau.

Les cartes de séries sont compactes afin de préserver la lisibilité de la hiérarchie. Une série correspond à une seule étape ; un exercice ne contient ni séries internes ni récupération interne.

Aucune pause n’est imposée ou générée automatiquement. Si l’ordre réel d’exécution fait suivre directement deux exercices, un avertissement discret et non bloquant indique : `Sans pause, les exercices s’enchaînent directement.`

### Guidage sonore

L'écran permet uniquement d'activer ou de désactiver les bips et les annonces vocales de la routine. Les principes généraux du guidage sonore sont décrits dans le chapitre 03 et les règles détaillées dans le chapitre 10.

### Consultation d’un exercice

Toucher un nœud ouvre le détail de l’exercice.

L’utilisateur peut alors consulter :

- son nom ;
- sa consigne complète ;
- sa photo ou sa vidéo ;
- son mode d’exécution ;
- sa durée ou son nombre de répétitions.

Depuis ce détail, il peut modifier l’exercice.

Le détail peut être présenté dans un panneau superposé afin que l’utilisateur conserve visuellement le contexte de la routine.

### Ajout rapide d’un élément

Des points d’insertion `＋` permettent d’ajouter directement un élément :

- au début du parcours ;
- entre deux éléments existants ;
- à la fin du parcours.

Toucher un point d’insertion ouvre un menu compact proposant :

- `Exercice` ;
- `Pause 15 s` ;
- `Pause 30 s` ;
- `Pause 45 s` ;
- `Pause personnalisée`.

Une pause prédéfinie est immédiatement insérée dans le parcours, sans ouvrir de panneau supplémentaire.

Le choix `Exercice` ouvre la création rapide d’un exercice. Le choix `Pause personnalisée` ouvre les paramètres détaillés d’une pause.

L’élément est donc ajouté directement à la position choisie. Il n’est pas nécessaire de l’ajouter à la fin, puis de le déplacer.

### Réorganisation

L’utilisateur peut activer un mode de réorganisation.

Dans ce mode, il peut :

- déplacer un exercice ou une pause ;
- dupliquer un élément ;
- supprimer un élément.

Le déplacement doit être direct, par glisser-déposer.

La nouvelle organisation est enregistrée automatiquement.

Le mode de réorganisation peut temporairement simplifier l’affichage sous forme de liste compacte si le déplacement des nœuds sur le parcours visuel s’avère difficile à comprendre ou à utiliser.

### Lancement de la routine

Un bouton principal `Démarrer` permet de lancer l’ensemble de la routine depuis son début.

Le bouton reste facilement accessible, même lorsque l’utilisateur fait défiler un parcours long.

La routine peut être lancée dès qu’elle contient au moins un exercice.

Les pauses seules ne suffisent pas à rendre la routine exécutable.

### Enregistrement

Toutes les modifications sont enregistrées automatiquement.

Il n’existe pas de bouton général `Enregistrer`.

Une indication discrète peut confirmer que les dernières modifications ont été prises en compte.

### Routine vide

Lorsqu’une routine ne contient encore aucun exercice, l’écran affiche :

- son nom ;
- une courte indication expliquant comment commencer ;
- une action principale `Ajouter un exercice` ;
- une action secondaire `Ajouter une pause`.

Le bouton `Démarrer` est désactivé.

### Routine longue

Lorsque le parcours dépasse la hauteur de l’écran :

- l’utilisateur le parcourt verticalement ;
- le bouton `Démarrer` reste accessible ;
- un indicateur peut résumer sa longueur ou sa durée ;
- l’écran revient à la dernière position consultée après la modification d’un élément.

### Structure de répétition de la V1

La structure visuelle affiche dès la V1 :

- une zone `Échauffement`, exécutée une seule fois ;
- un conteneur `Série × N` comprenant une séquence ordonnée de séries ;
- un conteneur `Cycle × N` comprenant le série et les éventuelles séries exécutées après le série à chaque cycle ;
- les éventuelles séries de fin de routine, placées après le cycle et exécutées une seule fois.

Les nombres de répétitions sont intégrés aux en-têtes du série et du cycle. Chaque conteneur dispose d’une icône et d’un chevron de déploiement. `Retour au calme` n’est pas une zone structurelle distincte.

## Écran 5 – Création / modification d'une activité (Exercice)

![[Nouvelle activité - Exercice.png]]
### Objectif

Permettre à l'utilisateur de créer ou modifier une activité de type **Exercice** directement depuis la composition d'une routine.
L'écran privilégie une saisie simple et rapide tout en donnant accès aux paramètres nécessaires à l'exécution de l'activité.
Les modifications sont enregistrées automatiquement.
### Ouverture

L'écran est ouvert lorsque l'utilisateur :
- ajoute une nouvelle activité de type **Exercice** ;
- sélectionne une activité existante de type **Exercice**.

Le retour ramène à l'écran **Composition d'une routine**.
### Contenu

L'écran comporte les sections suivantes :
- Nom ;
- Mode d'exécution ;
- Paramètres d'exécution ;
- Pause après l'activité ;
- Consigne ;
- Zones corporelles.

Toutes les informations, à l'exception du nom, sont facultatives.

### Nom

Le champ **Nom** est obligatoire.
Il identifie l'activité dans la composition de la routine ainsi que pendant son exécution.
Le bouton **Valider** reste désactivé tant que ce champ est vide.
### Mode d'exécution

L'utilisateur choisit entre deux modes :
- **Durée** ;
- **Répétitions**.

Le changement de mode adapte immédiatement les champs affichés.
#### Durée

L'utilisateur définit la durée de l'activité en minutes et secondes.
Pendant la séance, un compte à rebours est automatiquement lancé.
#### Répétitions

L'utilisateur définit le nombre de répétitions à effectuer.
Pendant la séance, l'utilisateur valide manuellement la fin de l'activité.
### Pause après l'activité

Une pause facultative peut être définie directement dans l'activité.
L'utilisateur indique sa durée en minutes et secondes.
Cette pause est automatiquement exécutée à la fin de l'activité.
L'absence de pause est autorisée.

### Consigne

Une consigne facultative permet de préciser :
- la manière d'exécuter le mouvement ;
- des conseils techniques ;
- des précautions particulières.

La consigne est affichée pendant l'exécution de l'activité.
### Zones corporelles

Une ou plusieurs zones corporelles peuvent être associées à l'activité.
La sélection est multiple.
L'utilisateur peut créer une nouvelle zone corporelle sans quitter cet écran grâce au modal **Création d'une zone corporelle**.

Ces informations servent principalement :
- au classement des activités ;
- à la recherche ;
- aux évolutions futures de l'application.
### Validation

L'action **Valider** :
- enregistre automatiquement les modifications ;
- ferme l'écran ;
- revient à la composition de la routine.

La nouvelle activité apparaît immédiatement à l'emplacement choisi.
### Modification d'une activité

Lorsqu'une activité existante est ouverte :
- tous ses paramètres sont préremplis ;
- les modifications sont enregistrées automatiquement ;
- elles concernent uniquement cette activité dans cette routine.

Les séances déjà enregistrées ne sont jamais modifiées.
### Actions secondaires

Depuis cet écran, l'utilisateur peut également :
- supprimer l'activité de la routine ;
- ouvrir le modal **Création d'une zone corporelle**.

## Écran 6 – Création / modification d'une activité (Pause ou Récupération)

![[Nouvelle activité - Pause.png]]
### Objectif

Permettre d’insérer une pause courante en un seul choix et d’accéder à des réglages supplémentaires uniquement lorsque cela est nécessaire.

Une pause prédéfinie est ajoutée directement depuis le parcours. Le panneau de configuration s’ouvre uniquement pour créer une pause personnalisée ou modifier une pause existante.

### Ajout rapide

Depuis un point d’insertion `＋`, l’utilisateur peut choisir directement :
- `Pause 15 s` ;
- `Pause 30 s` ;
- `Pause 45 s`.

La pause sélectionnée est immédiatement insérée à l’endroit choisi avec les paramètres suivants :
- nom : `Pause` ;
- fin automatique ;
- aucune consigne.

Aucun panneau de configuration ni aucune validation supplémentaire ne sont nécessaires.

### Pause personnalisée

Le choix `Pause personnalisée` ouvre un panneau permettant de définir :
- la durée ;
- une consigne facultative ;
- une fin automatique ou manuelle ;
- éventuellement un nom personnalisé.

Ce même panneau est utilisé pour modifier une pause déjà insérée.
### Durée

Dans le panneau de personnalisation, l’utilisateur définit la durée de la pause en minutes et secondes.

Les durées de 15, 30 et 45 secondes sont accessibles directement depuis l’ajout rapide et ne nécessitent pas l’ouverture de ce panneau.

Pendant la séance, un compte à rebours indique le temps restant.
### Consigne

Une consigne facultative peut préciser ce que l’utilisateur doit faire pendant la pause, par exemple :
- respirer profondément ;
- changer de côté ;
- préparer le matériel ;
- boire ;
- adopter une position particulière.

La consigne est affichée pendant l’exécution de la pause.

### Mode de fin

L’utilisateur choisit entre deux comportements :
- `Automatique` : l’application passe à l’élément suivant à la fin du compte à rebours ;
- `Manuel` : la fin du compte à rebours est signalée, mais l’utilisateur décide quand passer à la suite.

Le mode `Automatique` est sélectionné par défaut.
Même en mode automatique, l’utilisateur peut passer immédiatement à l’élément suivant.

### Ajout à la routine

Une pause prédéfinie est insérée immédiatement à l’emplacement depuis lequel l’utilisateur a touché `＋`.

Pour une pause personnalisée, l’action principale du panneau est `Ajouter`.
Après son activation :
- la pause est insérée à l’emplacement choisi ;
- le panneau se ferme ;
- la nouvelle pause apparaît dans le parcours ;
- les modifications sont enregistrées automatiquement.

### Modification d’une pause

Toucher une pause existante ouvre le même panneau avec ses paramètres actuels.

L’utilisateur peut modifier :

- sa durée ;
- sa consigne ;
- son mode de fin ;
- son nom, s’il souhaite remplacer l’intitulé `Pause`.

Les modifications sont enregistrées automatiquement et concernent uniquement cette pause dans la routine.

### Représentation dans le parcours

Une pause doit être visuellement distincte d’un exercice.

Elle peut être représentée par :

- un nœud plus petit ;
- une icône de minuterie ou de pause ;
- une couleur ou une forme différente ;
- sa durée ;
- sa consigne abrégée, lorsqu’elle existe.

Cette représentation doit rester suffisamment discrète pour que les exercices constituent les étapes principales du parcours.

### Actions secondaires

En mode modification, l’utilisateur peut :

- dupliquer la pause ;
- la supprimer de la routine.

La suppression n’affecte pas les séances passées.

### Fermeture sans ajout

Si l’utilisateur ferme le panneau de personnalisation avant d’ajouter la pause, aucun élément n’est créé.
## Écran 7 – Catégories de la routine

![[Nouvelle routine - Entrer une catégorie.png]]
### Objectif

Associer facultativement une ou plusieurs catégories à la routine avant son enregistrement final.
### Contenu et comportement

- les catégories sont proposées sous forme de tags sélectionnables ;
- la sélection est multiple ;
- aucune catégorie n’est obligatoire ;
- l’action `+ Créer une catégorie` permet d’ajouter une catégorie personnalisée ;
- `Enregistrer la routine` enregistre la sélection et ramène à `Mes routines`.



## Écran 8 – Exécution guidée

![[Execution d'une routine.png]]
### Objectif

Guider l’utilisateur étape par étape pendant l’exécution d’une routine, avec une interface très visuelle, lisible à distance et nécessitant un minimum de touchers.

L’écran se concentre sur l’élément en cours. Les informations de configuration et les actions secondaires restent discrètes.

### Démarrage de la séance

Toucher `Démarrer` depuis la composition d’une routine lance immédiatement la première étape.

Aucun écran de confirmation ou de préparation supplémentaire n’est imposé.

Avant de commencer, un court compte à rebours peut être proposé afin de laisser à l’utilisateur le temps de poser son téléphone ou de se mettre en position.

Ce compte à rebours doit pouvoir être désactivé dans les réglages ou ignoré immédiatement.

Au commencement de chaque exercice, pause ou récupération, une voix annonce son nom ou son rôle.

### Informations affichées

L’écran présente en priorité :

- le nom de l’exercice ou de la pause en cours ;
- sa photo, sa vidéo ou une illustration par défaut ;
- sa consigne principale ;
- le temps restant ou le nombre de répétitions ;
- la progression dans la routine ;
- la série, le série et le cycle en cours lorsqu’ils sont utilisés ;
- l’état des bips et des annonces vocales, représenté par des icônes discrètes ;
- l’action permettant de terminer ou de passer à l’étape suivante.

Les informations doivent rester lisibles lorsque le téléphone est posé à quelques mètres de l’utilisateur.

Les éléments secondaires ne doivent pas réduire inutilement la place accordée au média, au temps et à la consigne.

L’utilisateur peut activer ou couper séparément les bips et les annonces vocales depuis l’écran d’exécution, sans interrompre la séance.

### Progression dans la routine

Une représentation compacte du parcours indique :

- la position de l’utilisateur dans la routine ;
- les étapes déjà terminées ;
- l’étape en cours ;
- les prochaines étapes ;
- la progression générale de la séance.
- la progression dans la série, le série et le cycle en cours lorsqu’ils sont utilisés.

Cette représentation reprend le langage visuel du parcours présenté dans la composition de la routine, sans afficher en permanence l’ensemble de ses détails.

L’utilisateur peut ouvrir une vue plus complète du parcours s’il souhaite consulter les étapes restantes ou rejoindre directement une autre étape.

### Exercice minuté

Pour un exercice défini par une durée :

- le compte à rebours démarre au début de l’exercice ;
- le temps restant est affiché de manière très visible ;
- l’utilisateur peut mettre le compte à rebours en pause ;
- il peut reprendre l’exercice ;
- il peut terminer l’exercice avant la fin du temps prévu.

Pendant l’exercice, un bip grave et discret retentit chaque seconde. Pendant les trois dernières secondes, un bip aigu remplace le bip grave à chaque seconde. Lorsque le compte à rebours atteint zéro, l’application passe automatiquement à l’étape suivante et en annonce le nom.

### Exercice en répétitions

Pour un exercice défini par un nombre de répétitions :

- le nombre prévu est affiché de manière très visible ;
- aucun comptage automatique n’est requis dans la V1 ;
- l’utilisateur touche `Terminé` lorsqu’il a réalisé les répétitions demandées.

L’utilisateur n’est pas obligé de confirmer chaque répétition individuellement.

Aucun bip de rythme ni compte à rebours sonore n’est émis, puisqu’aucun décompte temporel automatique n’est en cours. Le nom de l’exercice est néanmoins annoncé lorsqu’il commence.

### Exercice manuel

Pour un exercice en mode manuel :

- aucune durée n’est imposée ;
- l’utilisateur réalise l’exercice à son rythme ;
- il touche `Terminé` lorsqu’il souhaite poursuivre.

La durée réelle de l’exercice peut être enregistrée automatiquement dans la séance sans être imposée à l’utilisateur.

Aucun bip de rythme ni compte à rebours sonore n’est émis. Le nom de l’exercice est annoncé lorsqu’il commence.

### Affichage du média

Lorsqu’un exercice possède une photo ou une vidéo, celle-ci occupe une place centrale dans l’écran.

Une vidéo ne se lance pas nécessairement en plein écran. L’utilisateur doit pouvoir consulter simultanément :

- la démonstration ;
- le nom de l’exercice ;
- la consigne principale ;
- le temps ou les répétitions.

La vidéo peut être relancée facilement et visionnée sans déclencher plusieurs actions successives.

En l’absence de média, une illustration ou une icône par défaut est affichée.

### Consignes

La consigne principale est visible sans action supplémentaire lorsqu’elle reste courte.

Si elle est longue, une version abrégée est affichée et l’utilisateur peut l’ouvrir intégralement.

Les informations essentielles à la sécurité ou à la bonne exécution du mouvement ne doivent pas être masquées dans un contenu secondaire.

### Exécution d’une pause

Pendant une pause, l’écran affiche :

- la mention `Pause` ou son nom personnalisé ;
- le temps restant ;
- sa consigne éventuelle ;
- l’exercice suivant ;
- une action permettant de passer immédiatement à la suite.

Pour une pause à fin automatique, l’étape suivante commence à la fin du compte à rebours.

Pour une pause à fin manuelle, la fin du temps est signalée, puis l’utilisateur touche `Continuer`.

Au début de la pause ou de la récupération, une voix en annonce le nom ou le rôle. Aucun bip de rythme n’est émis pendant cette étape. Si elle est chronométrée, un bip aigu retentit pendant chacune de ses trois dernières secondes.

### Enchaînement des étapes

À la fin d’un exercice, l’application affiche immédiatement l’étape suivante.

L’enchaînement doit éviter les confirmations répétitives.

Le comportement dépend du type d’élément :

- une pause à fin automatique enchaîne automatiquement ;
- une pause à fin manuelle attend l’action de l’utilisateur ;
- un exercice en répétitions ou en mode manuel se termine avec `Terminé` ;
- un exercice minuté enchaîne automatiquement avec l’étape suivante à la fin du compte à rebours ;
- les trois dernières secondes signalent l’imminence de cette transition ;
- l’étape suivante est annoncée vocalement lorsqu’elle commence.

L’utilisateur conserve la possibilité de mettre la séance en pause, de terminer un exercice avant son terme ou de changer manuellement d’étape.

### Commandes principales

Les commandes principales restent accessibles d’un seul toucher :

- mettre en pause ou reprendre la séance ;
- terminer l’exercice en cours ;
- passer à l’étape suivante ;
- revenir à l’étape précédente ;
- activer ou désactiver les bips ;
- activer ou désactiver les annonces vocales ;
- quitter la séance.

Les actions les plus fréquemment utilisées sont suffisamment grandes pour être activées facilement pendant un exercice.

Les actions susceptibles d’être déclenchées accidentellement, comme quitter la séance, sont placées à l’écart des commandes principales.

### Passage à une autre étape

L’utilisateur peut ouvrir le parcours de la séance et sélectionner une autre étape.

Les étapes sautées sont conservées dans le déroulement de la séance avec un statut distinct.

Revenir à une étape déjà terminée ne supprime pas son exécution précédente. L’application enregistre qu’elle a été exécutée une nouvelle fois.

### Mise en pause de la séance

Mettre la séance en pause suspend :

- le compte à rebours en cours ;
- l’enchaînement automatique ;
- le calcul du temps actif de l’exercice ;
- les bips de rythme et le compte à rebours sonore ;
- toute annonce vocale liée à une transition qui n’a pas encore eu lieu.

L’écran indique clairement que la séance est suspendue.

L’utilisateur peut ensuite :

- reprendre la séance ;
- consulter le parcours ;
- quitter la séance.

La reprise ne répète l’annonce de l’étape en cours que si cette solution est jugée utile lors des tests d’usage.

### Quitter une séance en cours

Si l’utilisateur demande à quitter la séance, l’application propose :

- `Reprendre la séance` ;
- `Enregistrer et quitter` ;
- `Abandonner la séance`.

`Enregistrer et quitter` conserve la séance partielle dans l’suivi.

`Abandonner la séance` ne crée pas de séance terminée, mais une confirmation est demandée afin d’éviter une perte accidentelle.

### Verrouillage et interruption

Si l’application passe temporairement en arrière-plan ou si l’écran se verrouille :

- la séance en cours est conservée ;
- un compte à rebours actif continue de manière cohérente ;
- le guidage sonore continue de fonctionner, dans la mesure permise par le système d’exploitation ;
- l’utilisateur retrouve l’étape en cours à son retour.

Une interruption courte, comme un appel ou une notification, ne doit pas entraîner la perte de la progression.

Le comportement précis des minuteurs, des bips et des annonces vocales en arrière-plan ou lorsque l’écran est verrouillé devra respecter les possibilités techniques d’iOS et d’Android et être validé pendant le développement.

### Fin de la routine

Lorsque la dernière étape est terminée, la séance est enregistrée automatiquement.

L’utilisateur accède alors à l’écran de fin de séance.

La routine d’origine n’est pas modifiée par les événements survenus pendant son exécution, comme une étape ignorée ou répétée.


## Écran 9 – Synthèse de séance

![[Execution d'une routine - Synthèse de séance.png]]
### Objectif

Confirmer que la séance a été enregistrée, présenter un bilan immédiatement compréhensible et permettre à l’utilisateur de quitter l’écran sans étape inutile.

Cet écran doit rester simple et positif. Il ne constitue pas un formulaire à remplir obligatoirement.

### Affichage à la fin de la séance

Lorsque la dernière étape est terminée, l’écran affiche :

- le nom de la routine ;
- la confirmation que la séance est terminée et enregistrée ;
- sa durée totale ;
- le nombre d’activités réalisées ;
- les éventuels activités ignorées ;
- la date et l’heure de réalisation.

Une représentation synthétique du parcours peut distinguer les étapes :

- réalisées ;
- ignorées ;
- répétées ;
- interrompues.

### Séance partielle

Si l’utilisateur a choisi `Enregistrer et quitter` avant la fin de la routine, l’écran indique clairement que la séance est partielle.

Le bilan précise notamment :

- le nombre d’activités réalisées ;
- le nombre d’exercices non réalisés ;
- l’étape à laquelle la séance a été interrompue ;
- la durée enregistrée.

Une séance partielle est conservée dans l’suivi avec un statut distinct d’une séance terminée.

### Ressenti après la séance

L’utilisateur peut indiquer rapidement son ressenti général.

La saisie doit pouvoir être réalisée en un seul toucher, par exemple avec une échelle visuelle courte :

- `Difficile` ;
- `Correct` ;
- `Facile`.

Cette information est facultative. L’utilisateur peut quitter l’écran sans répondre.

L’échelle exacte et sa représentation seront testées dans les wireframes afin d’éviter toute ambiguïté entre difficulté de la séance, douleur et satisfaction.

### Douleur ou gêne (facultatif)

L’utilisateur peut signaler facultativement une douleur ou une gêne ressentie pendant la séance.

Cette action ouvre une saisie complémentaire permettant d’indiquer :

- l’intensité ressentie ;
- la zone concernée ;
- l’exercice pendant lequel elle est apparue ;
- une note libre.

Le signalement d’une douleur ne doit jamais être imposé à chaque séance.

Dans la V1, ces informations servent uniquement au suivi personnel. Elles ne constituent ni un diagnostic ni une recommandation médicale.
### Note de séance

L’utilisateur peut ajouter une note libre, par exemple pour préciser :

- un exercice particulièrement difficile ;
- une amélioration ressentie ;
- une adaptation réalisée ;
- une consigne donnée par son kinésithérapeute ;
- un événement ayant interrompu la séance.

La note est facultative et peut également être ajoutée ou modifiée ultérieurement depuis le détail de la séance.
### Actions principales

L’action principale est `Terminer`.

Elle ramène l’utilisateur à l’écran depuis lequel la routine avait été lancée, avec la dernière séance mise à jour.

L’utilisateur peut également :

- consulter le détail de la séance ;
- revenir à `Mes routines`.

Aucune confirmation supplémentaire n’est demandée, puisque la séance est déjà enregistrée automatiquement.

### Nouvelle exécution

L’écran de fin ne doit pas encourager accidentellement le lancement immédiat d’une nouvelle séance.

Une action secondaire `Refaire la routine` peut néanmoins être proposée si ce besoin est confirmé pendant les tests.

### Enregistrement automatique

La séance est enregistrée avant l’affichage de cet écran.

Le ressenti, le signalement d’une douleur et la note sont ensuite enregistrés automatiquement au fur et à mesure de leur saisie.

Une indication discrète confirme que les informations ont bien été prises en compte.

### Préparation des versions suivantes

La structure de cet écran doit pouvoir accueillir ultérieurement :

- une comparaison avec les séances précédentes ;
- l’évolution de la difficulté ou de la douleur ;
- les recommandations d’adaptation de la routine ;
- le partage du bilan avec un professionnel ;
- les statistiques détaillées de progression.

Ces éléments ne doivent pas alourdir l’écran de fin de séance dans la V1.

## Écran 10 – Suivi : vue d’ensemble

![[Suivi - Vue d'ensemble.png]]
### Objectif

Permettre à l’utilisateur de retrouver les séances qu’il a réalisées et d’accéder au détail de chacune d’elles.

L’suivi présente les séances enregistrées, qu’elles soient terminées ou partielles.

### Accès à l’suivi

L’suivi est accessible depuis la navigation principale de l’application.

L’utilisateur peut le consulter indépendamment d’une routine particulière.

### Présentation des séances

Les séances sont affichées de la plus récente à la plus ancienne.

Chaque séance présente au minimum :

- le nom de la routine exécutée ;
- la date et l’heure de la séance ;
- sa durée ;
- son statut : `Terminée` ou `Partielle`.

Toucher une séance ouvre son détail.

### Regroupement chronologique

Les séances peuvent être regroupées par périodes afin de faciliter leur lecture, par exemple :

- aujourd’hui ;
- cette semaine ;
- périodes précédentes.

Le choix précis du regroupement sera défini dans les wireframes en fonction du nombre de séances affichées.

### Séances terminées et partielles

Une séance terminée et une séance partielle doivent être clairement distinguables.

Une séance partielle reste visible dans l’suivi avec son statut. Elle n’est pas présentée comme une routine entièrement réalisée.

### Conservation des informations

Chaque séance conserve les informations correspondant à son exécution au moment où elle a été réalisée.

Une modification ultérieure de la routine, d’un exercice ou d’une pause ne modifie pas les séances déjà enregistrées.

De même, une séance reste consultable si la routine correspondante est ensuite archivée.

### État vide

Si aucune séance n’a encore été enregistrée, l’écran indique simplement que l’suivi est vide.

Une action permet de revenir à `Mes routines` afin de lancer une première séance.

## Ecran 11 – Suivi : séances

![[Suivi - Séances.png]]

### Objectif

Permettre à l'utilisateur de consulter les séances déjà exécutées et d'accéder à son historique d'activité.
Cet écran offre une vue chronologique des séances réalisées ainsi que de leur état d'exécution.
### Contenu

Les séances sont affichées de la plus récente à la plus ancienne.
Chaque séance présente :
- le nom de la routine exécutée ;
- la date ou la période d'exécution ;
- l'heure de début ;
- la durée réelle ;
- le statut de la séance ;
- l'évaluation renseignée en fin de séance, lorsqu'elle existe.
### Regroupement

Les séances sont regroupées par période, par exemple :
- Aujourd'hui ;
- Hier ;
- dates antérieures.

Chaque groupe est présenté sous un en-tête chronologique.

### Statut

Chaque séance affiche un état visuel :
- **Terminée** ;
- **Partielle** (une ou plusieurs activités ignorées) ;
- **Interrompue** (arrêt avant la fin de la routine).

Le statut est identifié par un texte et une couleur.
### Évaluation

Lorsque l'utilisateur a évalué sa séance, un pictogramme de ressenti est affiché à droite de la carte.
Ce pictogramme permet d'identifier rapidement les séances ayant été bien ou mal vécues.

### Navigation

Depuis cet écran, l'utilisateur peut :
- parcourir son historique de séances ;
- changer d'onglet entre **Vue d'ensemble** et **Séances**.

Dans le MVP, sélectionner une séance n'ouvre pas de détail.
### État vide

Si aucune séance n'a encore été réalisée, l'écran affiche un message indiquant que le suivi est vide.
Une action permet de revenir à **Mes routines** afin de lancer une première séance.

### Évolution prévue

Dans une version ultérieure, chaque séance pourra être **déployée directement dans la liste**, sur le même principe que la vue déployée de **Mes routines**.

Le déploiement affichera notamment :

- les activités exécutées ;
- les activités ignorées ;
- les durées prévues et réelles ;
- les commentaires et le ressenti ;
- les informations détaillées de la séance.
## Écran 12 – Suivi : Détail d’une séance

### Objectif

Permettre à l’utilisateur de consulter le déroulement et les informations enregistrées pour une séance passée.

Cet écran restitue la séance telle qu’elle a été exécutée, indépendamment des modifications apportées ultérieurement à la routine.
### Informations générales

L’écran affiche :
- le nom de la routine exécutée ;
- la date et l’heure de la séance ;
- sa durée totale ;
- son statut : `Terminée` ou `Partielle` ;
- le nombre d’activités réalisées ;
- le nombre éventuel d’activités ignorées.

Si la séance a été interrompue avant son terme, l’étape à laquelle elle s’est arrêtée est indiquée.
### Parcours de la séance

Le parcours présente les activités dans leur ordre d’exécution.
Chaque élément indique son statut :
- réalisé ;
- ignoré ;
- répété ;
- interrompu ;
- non commencé dans le cas d’une séance partielle.

Le parcours affiché correspond à la version de la routine utilisée au moment de la séance.
### Détail d’un exercice réalisé

Pour chaque exercice, l’utilisateur peut consulter :
- son nom ;
- son mode d’exécution ;
- la durée prévue ou le nombre de répétitions prévu ;
- la durée réellement passée sur l’exercice, lorsqu’elle a été enregistrée ;
- sa consigne ;
- son média associé au moment de la séance ;
- son statut d’exécution.

Si un exercice a été réalisé plusieurs fois pendant la même séance, chaque exécution est identifiable.
### Détail d’une pause

Pour chaque pause, l’utilisateur peut consulter :
- sa durée prévue ;
- sa consigne éventuelle ;
- son mode de fin ;
- son statut d’exécution.
### Informations ajoutées en fin de séance

Si l’utilisateur a renseigné des informations à la fin de la séance, l’écran affiche :
- son ressenti général ;
- l’éventuel signalement d’une douleur ou d’une gêne ;
- sa note de séance.

Les informations qui n’ont pas été renseignées ne sont pas affichées.
### Conservation de la séance

Les informations de la séance sont conservées telles qu’elles existaient au moment de son exécution.

Les modifications ultérieures apportées :
- à la routine ;
- aux exercices ;
- aux pauses ;
- aux consignes ;
- aux médias

ne modifient pas le contenu de cette séance passée.
### Retour

Une action permet de revenir à l’suivi.
Aucune modification de la routine d’origine n’est réalisée depuis cet écran.

## Les modales

### Modal – Création d'une catégorie

![[Nouvelle routine - Nouvelle catégorie.png]]

#### Objectif

Permettre à l'utilisateur de créer rapidement une nouvelle catégorie sans quitter l'écran **Catégories de la routine**.

La création d'une catégorie s'effectue dans une fenêtre modale afin de conserver le contexte de la routine en cours de création ou de modification.
#### Ouverture

Le modal est ouvert lorsque l'utilisateur touche **+ Créer une catégorie**.
L'écran **Catégories de la routine** reste visible en arrière-plan, assombri et non interactif.
#### Contenu

Le modal comporte :
- le titre **Nouvelle catégorie** ;
- un champ obligatoire **Nom de la catégorie** ;
- un bouton **Annuler** ;
- un bouton principal **Créer**.

Le champ de saisie reçoit automatiquement le focus afin de permettre une saisie immédiate.
#### Validation

Le bouton **Créer** reste désactivé tant que le nom est vide.
Lors de la validation :
- la catégorie est créée ;
- elle est ajoutée à la liste des catégories disponibles ;
- elle est automatiquement sélectionnée pour la routine en cours ;
- le modal se ferme ;
- l'utilisateur revient à l'écran **Catégories de la routine**.
#### Annulation

Toucher **Annuler**, fermer le modal ou utiliser le geste système de fermeture :
- ferme le modal ;
- ne crée aucune catégorie ;
- conserve la sélection précédente.
#### Contraintes

Le nom d'une catégorie :
- est obligatoire ;
- est propre à l'utilisateur ;
- peut comporter entre **1 et 50 caractères** ;
- ne peut pas être créé deux fois avec exactement le même nom (sans tenir compte des différences de casse).
#### Comportement

La création est enregistrée automatiquement.
Aucune validation supplémentaire n'est demandée.
La nouvelle catégorie devient immédiatement disponible pour toutes les routines de l'utilisateur.
### Modal – Création d'une zone corporelle

![[Nouvelle activité - Nouvelle zone corporelle.png]]
#### Objectif

Permettre à l'utilisateur de créer rapidement une nouvelle zone corporelle sans quitter l'écran de création ou de modification d'une activité.

La création s'effectue dans une fenêtre modale afin de conserver le contexte de l'activité en cours de création ou de modification.
#### Ouverture

Le modal est ouvert lorsque l'utilisateur touche **+ Créer une zone corporelle**.
L'écran **Création / modification d'une activité (Exercice)** reste visible en arrière-plan, assombri et non interactif.
#### Contenu

Le modal comporte :
- le titre **Nouvelle zone corporelle** ;
- un champ obligatoire **Nom de la zone corporelle** ;
- un bouton **Annuler** ;
- un bouton principal **Créer**.

Le champ de saisie reçoit automatiquement le focus afin de permettre une saisie immédiate.
#### Validation

Le bouton **Créer** reste désactivé tant que le nom est vide.
Lors de la validation :
- la zone corporelle est créée ;
- elle est ajoutée à la liste des zones corporelles disponibles ;
- elle est automatiquement sélectionnée pour l'activité en cours ;
- le modal se ferme ;
- l'utilisateur revient à l'écran **Création / modification d'une activité (Exercice)**.
#### Annulation

Toucher **Annuler**, fermer le modal ou utiliser le geste système de fermeture :
- ferme le modal ;
- ne crée aucune zone corporelle ;
- conserve la sélection précédente.
#### Contraintes

Le nom d'une zone corporelle :
- est obligatoire ;
- est propre à l'utilisateur ;
- peut comporter entre **1 et 50 caractères** ;
- ne peut pas être créé deux fois avec exactement le même nom (sans tenir compte des différences de casse).
#### Comportement

La création est enregistrée automatiquement.
Aucune validation supplémentaire n'est demandée.
La nouvelle zone corporelle devient immédiatement disponible pour toutes les activités de type **Exercice** de l'utilisateur.
### Modal – Confirmation d'arrêt

![[Execution d'une routine - Confirmation d'arrêt.png]]
#### Objectif

Permettre à l'utilisateur de quitter une séance en cours tout en évitant une interruption accidentelle.

Le modal apparaît au-dessus de l'écran d'exécution et suspend temporairement toute interaction avec celui-ci.
#### Ouverture

Le modal est affiché lorsque l'utilisateur touche le bouton **Arrêter** pendant l'exécution d'une séance.
L'écran d'exécution reste visible en arrière-plan, assombri et non interactif.
L'état de la séance est figé tant que le modal est affiché.
#### Contenu

Le modal comporte :
- le titre **Arrêter la routine ?** ;
- un message expliquant que la progression sera conservée et que la séance sera enregistrée comme **interrompue** ;
- un bouton principal **Reprendre** ;
- un bouton secondaire **Arrêter la routine**.
#### Reprendre

L'action **Reprendre** :
- ferme le modal ;
- reprend immédiatement la séance à l'étape où elle avait été interrompue ;
- conserve l'ensemble des informations de progression.
#### Arrêter la routine

L'action **Arrêter la routine** :
- met fin immédiatement à la séance ;
- enregistre la progression réalisée ;
- enregistre la séance avec le statut **Partielle** ;
- ouvre l'écran **Synthèse de séance**.

Les activités non exécutées restent identifiées comme telles dans le détail de la séance.
#### Conséquences

L'arrêt d'une séance :
- ne modifie jamais la routine d'origine ;
- n'efface aucune progression réalisée ;
- conserve les temps réellement exécutés ;
- permet de consulter ultérieurement cette séance depuis **Suivi**.
#### Fermeture

Toucher en dehors du modal ou utiliser le geste système de fermeture n'a aucun effet.
L'utilisateur doit choisir explicitement entre :
- **Reprendre** ;
- **Arrêter la routine**.

Cette règle évite toute reprise ou interruption involontaire de la séance.
### Modal – Options de l'activité

![[Nouvelle routine - Option d'activité.png]]
#### Contenu
**Titre :**

> **Squat assisté** _(nom de l'activité sélectionnée)_

**Actions :**

- ✏️ Modifier
- 📄 Dupliquer
- 🗑️ Supprimer _(en rouge)_
---
- **Annuler**
#### Comportement

**Modifier**

- Ouvre l'écran de modification de cette activité.

**Dupliquer**

- Crée une copie immédiatement sous l'activité d'origine.
- La copie reprend **tous les paramètres** :
    - nom ;
    - type (Exercice, Pause ou Récupération) ;
    - durée ou répétitions ;
    - pause après activité ;
    - consigne ;
    - zones corporelles.
- Le nom reste identique. Il n'est pas nécessaire d'ajouter « (copie) », puisque plusieurs activités peuvent déjà avoir le même nom dans une routine.

**Supprimer**

- Supprime l'activité de la routine.
- S'il s'agit de la dernière activité de la routine, la suppression est également autorisée ; la routine devient alors vide et l'utilisateur peut ensuite ajouter une nouvelle activité.
### Modal – Options d'une routine

![[Mes routines - Options.png]]

#### Objectif

Permettre à l'utilisateur d'accéder aux principales actions disponibles pour une routine sans ouvrir son écran de modification.

Le modal est affiché lorsque l'utilisateur touche le bouton **⋯** d'une carte de la liste **Mes routines**.
#### Ouverture

Le modal est affiché au-dessus de l'écran **Mes routines**.
L'écran reste visible en arrière-plan, assombri et non interactif.
#### Contenu

Les actions proposées sont :

- ✏️ Modifier
- 📄 Dupliquer
- 📅 Planifier _(V2 – bientôt disponible)_
- 📦 Archiver _(ou Restaurer si la routine est archivée)_
- 🗑️ Supprimer _(en rouge)_
---
- **Annuler**
#### Comportement
##### Modifier

Ouvre l'écran **Composition d'une routine**.
Tous les paramètres de la routine sont préremplis.
##### Dupliquer

Crée immédiatement une copie complète de la routine.
La copie comprend :
- toutes les activités ;
- les séries ;
- les cycles ;
- les catégories ;
- les paramètres d'exécution.

La nouvelle routine est ajoutée à la liste des routines.
##### Planifier

Ouvre l'écran **Planifier une routine**.
Dans le MVP, cette fonctionnalité est identifiée comme **Bientôt disponible**.
##### Archiver

Déplace la routine dans les routines archivées.
Une routine archivée :
- n'apparaît plus dans la liste principale ;
- reste consultable ;
- peut être restaurée ultérieurement ;
- conserve son historique de séances.

Si la routine est déjà archivée, cette action devient **Restaurer**.
##### Supprimer

Supprime définitivement la routine.
Une confirmation est demandée avant la suppression.
La suppression de la routine **n'efface jamais les séances déjà réalisées**, qui restent disponibles dans **Suivi**.
##### Annuler

Ferme le modal sans effectuer d'action.
### Modal – Réinitialisation de l'activité

![[Exécution d'une routine - Réinitialiser l'activité.png]]
#### Objectif

Permettre à l'utilisateur de recommencer immédiatement **l'activité en cours** depuis le début, sans modifier la progression de la routine.

Cette action est utile lorsqu'une activité a été mal exécutée ou interrompue et doit être recommencée.
#### Ouverture

Le modal est affiché lorsque l'utilisateur appuie sur le bouton **Réinitialiser** pendant l'exécution d'une activité.

L'écran d'exécution reste visible en arrière-plan, assombri et non interactif.

#### Contenu

Le modal affiche :

**Titre**

> Réinitialiser l'activité ?

**Message**

L'activité en cours recommencera depuis le début.

La progression de la routine sera conservée.

**Actions**

- 🔄 Recommencer l'activité
- Annuler
#### Comportement

##### Recommencer l'activité

L'application :
- remet à zéro le chronomètre de l'activité en cours ;
- remet à zéro le nombre de répétitions ou la durée restante de cette activité ;
- conserve la progression de la routine :
    - activité courante inchangée ;
    - série en cours inchangée ;
    - cycle en cours inchangé ;
    - temps total de la séance conservé ;
- relance immédiatement l'activité selon son comportement normal (annonce vocale, chronomètre, etc.).

##### Annuler

Ferme le modal et reprend immédiatement l'exécution de l'activité à l'endroit où elle avait été interrompue.
### Modal – Passage à l'activité suivante

![[Exécuter une routine - Passer à l'activité suivante.png]]
#### Objectif

Permettre à l'utilisateur de passer immédiatement à l'activité suivante de la routine lorsqu'il souhaite interrompre l'activité en cours.

Cette action permet d'adapter l'exécution de la routine aux besoins de l'utilisateur sans interrompre la séance.
#### Ouverture

Le modal est affiché lorsque l'utilisateur appuie sur le bouton **Suivant** pendant l'exécution d'une activité.

L'écran d'exécution reste visible en arrière-plan, assombri et non interactif.

#### Contenu

Le modal affiche :

**Titre**

> Passer à l'activité suivante ?

**Message**

L'activité en cours sera considérée comme terminée et la routine poursuivra son exécution avec l'activité suivante.

**Actions**

- ▶ Passer à l'activité suivante
- Annuler
#### Comportement

##### Passer à l'activité suivante

L'application :
- arrête immédiatement l'activité en cours ;
- met à jour les indicateurs de progression de la routine ;
- démarre l'activité suivante selon les règles normales d'exécution (annonce vocale, compte à rebours, chronomètre, etc.) ;
- si l'activité en cours est la dernière de la série ou du cycle, applique les règles de passage à la série, au cycle ou à la fin de la routine.

##### Annuler

Ferme le modal et reprend immédiatement l'exécution de l'activité en cours, sans modifier la progression de la routine.
### Modal – Abandonner la création d’une routine

#### Objectif

Éviter la perte accidentelle des informations saisies lorsqu’un utilisateur quitte la création d’une routine avant de l’avoir validée.
#### Ouverture

La modale s’affiche lorsque l’utilisateur appuie sur le bouton **Retour** alors que des informations ont déjà été saisies ou modifiées.

L’écran de création reste visible en arrière-plan, assombri et non interactif.
#### Contenu

**Titre**

> Abandonner la création ?

**Message**

> Les informations saisies seront perdues et la routine ne sera pas créée.

**Actions**

- **Continuer la création**
- **Abandonner**
#### Comportement

**Continuer la création**

- ferme la modale ;
- conserve toutes les informations saisies ;
- ramène l’utilisateur à l’écran de création en cours.

**Abandonner**

- ferme la création ;
- supprime les données temporaires ;
- ne crée aucune routine ;
- ramène l’utilisateur à **Mes routines**.

#### Cas sans modification

Si l’utilisateur n’a encore saisi ou modifié aucune information, le retour vers **Mes routines** est immédiat, sans afficher la modale.