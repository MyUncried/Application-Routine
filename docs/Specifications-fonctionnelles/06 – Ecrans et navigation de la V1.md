## Objectif de conception

L’interface du produit fini doit être principalement visuelle, intuitive et utilisable avec le moins de touchers possible.

L’utilisateur doit notamment pouvoir lancer rapidement une séance, comprendre immédiatement l’action attendue pendant une séance et accéder facilement aux fonctions courantes.

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

La création d’une séance, d’une activité ou d’une récupération doit pouvoir être réalisée en quelques secondes, avec un minimum de saisies et de touchers.
L’application privilégie :
- des valeurs par défaut immédiatement utilisables ;
- l’affichage initial des seuls paramètres indispensables ;
- l’ajout direct d’un élément à l’endroit choisi dans la séance ;
- la possibilité de modifier ou d’enrichir ultérieurement chaque élément ;
- un accès secondaire aux consignes, médias et réglages avancés. 

La création rapide constitue le parcours principal. L’ajout d’une consigne, d’une photo, d’une vidéo ou de paramètres détaillés reste facultatif.

## Navigation principale et articulation des écrans

### Navigation principale

La navigation principale donne accès à quatre onglets :
- `Mes séances` ;
- `Calendrier` ;
- `Suivi` ;
- `Profil`.

`Mes séances` constitue l’écran d’accueil par défaut.

L’onglet `Calendrier` permet de visualiser les séances planifiées et d’accéder à la création et à la gestion des routines.  
L’onglet `Suivi` permet de consulter les exécutions enregistrées.  
L’onglet `Profil` permet d’accéder au profil utilisateur et aux préférences globales.

### Parcours de création et d’exécution

Depuis `Mes séances`, l’utilisateur peut :

- créer une séance ;
- ouvrir une séance existante ;
- lancer directement une séance existante.

La création d’une séance suit le parcours suivant :

1. saisie obligatoire du nom ;
2. composition de la séance ;
3. sélection facultative d’une ou plusieurs catégories ;
4. enregistrement de la séance.

L’ouverture d’une séance existante donne directement accès à sa composition.

Depuis la composition, l’utilisateur peut :

- ajouter, modifier ou réorganiser les activités ;
- valider la composition afin d’accéder aux catégories de la séance ;
- lancer une séance existante.

Le lancement ouvre l’exécution guidée. Lorsque la séance se termine, l’écran de fin est affiché. L’action `Terminer` ramène ensuite l’utilisateur à la séance exécutée.

### Parcours de consultation

Depuis `Suivi`, l’utilisateur accède à la liste des séances enregistrées.
Toucher une séance ouvre son détail.
Une action de retour ramène à l’suivi sans modifier la séance ni la routine correspondante.
### Écrans et panneaux

Les écrans principaux sont :

1. `Mes séances` ;
2. `Nouvelle séance — Saisie du nom` ;
3. `Composition d’une séance` ;
4. `Catégories de la séance` ;
5. `Exécution guidée` ;
6. `Fin de séance` ;
7. `Suivi` ;
8. `Détail d’une séance`.

Les panneaux servent aux actions courtes réalisées sans quitter le contexte courant, notamment :
- créer ou modifier un exercice ;
- personnaliser ou modifier une Activité de type Récupération ;
- sélectionner un exercice existant ;
- confirmer une action susceptible d’entraîner une perte.

Un panneau se referme après la validation de l’action et ramène l’utilisateur à l’endroit précis depuis lequel il l’avait ouvert.
### Retour et fermeture

En dehors d’une séance en cours, revenir à l’écran précédent ne nécessite pas de confirmation lorsque les modifications ont déjà été enregistrées automatiquement.
Fermer un panneau de création sans avoir ajouté l’élément ne crée rien.
Quitter une séance en cours suit le comportement défini dans `Écran 3 – Exécution guidée`.
### Conservation du contexte

L’application conserve autant que possible le contexte de l’utilisateur :
- la séance précédemment ouverte ;
- la position dans son parcours ;
- l’étape en cours pendant une séance ;
- la position dans l’suivi.

Après la fermeture d’un panneau, l’utilisateur retrouve l’élément qu’il vient d’ajouter ou de modifier.
### Enregistrement automatique

Les créations et modifications apportées aux séances, activités et récupérations sont enregistrées automatiquement.
Aucun bouton général `Enregistrer` n’est nécessaire.
L’application indique discrètement lorsqu’une modification a été prise en compte ou si son enregistrement a échoué.

### Navigation pendant une séance

Pendant l’exécution guidée, la navigation principale n’est pas affichée.

L’utilisateur reste concentré sur la séance et utilise les commandes prévues pour :
- consulter le parcours ;
- changer d’étape ;
- suspendre la séance ;
- quitter la séance.

Il ne peut pas rejoindre accidentellement `Mes séances` ou `Suivi` sans passer par l’action de sortie de séance.

### Cohérence des libellés

Les mêmes termes sont utilisés dans toute l’application :
- `Séance` : contenu complet d'un entraînement ;
- `Routine` : planification d'une séance ;
- `Activité` : action élémentaire (Exercice ou Récupération) ;
- `Exercice` : activité physique ;
- `Récupération` : activité de récupération ;
- `Bloc` : ensemble ordonné d'activités ;
- `Cycle` : conteneur répétant un bloc et pouvant contenir des activités propres au cycle ;
- `Exécution de séance` : réalisation effective d'une séance.

Ces libellés seront vérifiés dans les wireframes afin de conserver des actions courtes et immédiatement compréhensibles.

## Ecran 1 – Profil et préférences

![[Profil et préférences.png]]
### Objectif

Permettre à l'utilisateur de consulter ses informations personnelles et de personnaliser le comportement général de l'application.

Cet écran regroupe les paramètres utilisés par défaut lors de la création de nouvelles séances ainsi que les préférences liées à l'exécution des séances.
### Contenu

L'écran est organisé en plusieurs sections :
#### Profil

Affiche les informations générales de l'utilisateur :
- photo ou avatar ;
- nom ou pseudonyme ;
- informations du compte (versions futures).

Dans le MVP, cette section est principalement informative.
#### Préférences de création

Ces paramètres servent de valeurs par défaut lors de la création d'une nouvelle Séance ou d'une nouvelle Activité.

L'utilisateur peut notamment définir :
- la durée du compte à rebours initial ;
- les valeurs proposées par défaut lors de la création d'une activité ;
- les autres paramètres de création disponibles dans le MVP.

Ces valeurs restent modifiables pour chaque séance.

#### Préférences d'exécution

L'utilisateur peut personnaliser le comportement des séances :
- activation ou désactivation des annonces vocales ;
- activation ou désactivation des bips de rythme ;
- activation ou désactivation du compte à rebours sonore des trois dernières secondes.

Ces préférences sont utilisées par défaut lors de l'exécution des nouvelles séances.
#### Référentiels

L'écran donne accès aux référentiels utilisés par l'application.

Dans le MVP :
- les **Catégories de Séance** sont personnalisables par l'utilisateur : création, modification et suppression ;
- les **Zones corporelles** constituent un référentiel applicatif prédéfini : elles peuvent être consultées et sélectionnées, mais pas créées, renommées ou supprimées par l'utilisateur.

### Comportement

Les modifications sont enregistrées automatiquement.

Aucun bouton **Enregistrer** n'est nécessaire.
Les nouvelles préférences sont immédiatement prises en compte pour les créations et exécutions suivantes.
Les séances en cours ne sont pas modifiées.

### Navigation

L'écran est accessible depuis l'icône **Profil** présente dans la barre inférieur de l'application.
L'action **Retour** ramène l'utilisateur à l'écran précédemment affiché.

## Écran 2 – Catalogue des séances

![[Catalogue des séances.png]]

### Objectif

Permettre à l'utilisateur de consulter son catalogue de séances, de créer une nouvelle séance, d'ouvrir une séance existante, de l'exécuter immédiatement ou de la planifier.

Cet écran constitue l’accueil de l’application.
### Contenu affiché

Le catalogue présente l'ensemble des séances enregistrées par l'utilisateur.

Chaque séance affiche notamment :
- sa couleur ;
- son nom ;
- sa catégorie ;
- son nombre de cycles ;
- sa durée estimée ;
- ses informations principales.

Les séances sont classées par dernière utilisation, de la plus récente à la plus ancienne. Pour une routine jamais exécutée, la date de dernière modification est utilisée.
### Actions principales

Depuis le **Catalogue de séances**, l'utilisateur peut :
- créer une nouvelle séance ;
- ouvrir une séance existante ;
- exécuter immédiatement une séance ;
- planifier une séance en créant une routine ;
- dupliquer une séance ;
- archiver une séance.
### Création d'une séance

Toucher **`＋`** ouvre l'écran **`Nouvelle séance — Saisie du nom`**.

Après validation du nom :
- la séance est créée avec son identifiant et ses informations techniques ;
- l'utilisateur accède à l'écran **`Composition d'une séance`** ;
- il peut définir les nombres de répétitions du Cycle et du Bloc de la séance et ajouter les Activités correspondantes.

Lorsque la composition est validée, l'écran **`Catégories de la séance`** s'ouvre.

L'utilisateur peut :
- sélectionner zéro, une ou plusieurs catégories existantes ;
- créer une nouvelle catégorie ;
- enregistrer la séance.

Une fois la séance enregistrée, l'application lui propose :
- **Exécuter maintenant** ;
- **Planifier la séance** (création d'une routine) ;
- **Retourner au Catalogue de séances**.
### Actions secondaires

Pour chaque séance, un menu secondaire permet de :
- la dupliquer ;
- la renommer ;
- l'archiver ;
- la supprimer.
### Suppression d'une séance

Lorsqu'un utilisateur demande la suppression d'une séance, l'application vérifie si celle-ci est référencée par une ou plusieurs routines.
Si aucune routine n'est associée, la séance est supprimée immédiatement.

Dans le cas contraire, l'application affiche un message de confirmation indiquant :
- le nombre de routines concernées ;
- les principales informations permettant de les identifier (nom, récurrence, prochaine exécution le cas échéant).

Après confirmation :
- la séance est supprimée ;
- toutes les routines qui la référencent sont supprimées ;
- les exécutions déjà réalisées sont conservées dans l'historique.

La suppression d'une séance n'a aucun impact sur l'historique des exécutions déjà réalisées. Les exécutions historiques restent consultables, car chacune conserve un instantané complet de la version de la séance exécutée.
### Séance vide

La V1 ne comporte pas de statut **Brouillon**.
Une séance est créée dès que son nom est validé.
Tant qu'elle ne contient aucune activité :
- elle porte la mention **`Séance vide`** ;
- elle ne peut pas être exécutée ;
- elle peut être ouverte, complétée, renommée, archivée ou supprimée.
### État vide

Si aucune séance n’a encore été créée, l’écran présente :
- une courte explication ;
- une illustration ou une icône ;
- une action principale `Créer ma première séance`.
## Écran 3 – Nouvelle séance : saisie du nom

![[Nouvelle séance - Nom.png]]
### Objectif

Créer l’identité minimale d’une séance avant d’accéder à sa composition.
### Contenu et comportement

L'écran comporte :
- un champ obligatoire **Nom de la séance** ;
- un sélecteur de couleur composé d'une palette prédéfinie de 16 couleurs.

Le champ **Nom de la séance** est obligatoire.
Le bouton **Continuer** reste désactivé tant que le nom est vide ou invalide.
La couleur est obligatoire et est sélectionnée par l'utilisateur lors de la création.
Le retour annule la création si la séance n'a pas encore été créée.
La validation crée la séance et ouvre l'écran **Composition d'une séance**.

## Écran 4 – Composition d’une séance

![[Nouvelle séance - Etat initial et liste d'activités.png]]
### Objectif

Permettre à l’utilisateur de composer une séance, d'organiser ses cycles, ses blocs et ses activités, puis de l'exécuter ou de la planifier.

La routine est représentée comme un parcours vertical inspiré de Duolingo, et non comme une simple liste.

### Principe de représentation d’une séance

La composition d’une séance est représentée sous la forme d’un parcours visuel vertical.

Chaque Activité, de type Exercice ou Récupération, constitue un nœud du parcours. Les nœuds sont reliés afin de matérialiser leur ordre d’exécution.

Cette représentation doit permettre de comprendre immédiatement :
- le début et la fin de la séance ;
- l’ordre des exercices et des pauses ;
- la position de l’utilisateur dans le parcours ;
- les étapes terminées, en cours, suivantes ou ignorées ;
- la progression générale de la séance.

Un nœud peut comporter :
- une icône ou une vignette ;
- le nom abrégé de l’exercice ou de l’étape ;
- sa durée ou son nombre de répétitions ;
- un état visuel indiquant sa situation dans la séance.

Le parcours ne constitue pas un système de niveaux à débloquer. Tous les éléments restent consultables et modifiables. Le bouton `Démarrer` lance l'exécution de la séance depuis son début.

Dans la V1, cette représentation permet d'identifier les cycles, les blocs, les activités de fin de cycle et les activités de fin de séance.

### En-tête

L’en-tête affiche :
- le nom de la séance ;
- sa durée estimée ;
- le nombre d’activités ;
- un accès aux actions secondaires.

Le nom de la séance peut être modifié directement, sans ouvrir un écran distinct.

Les actions secondaires comprennent :
- dupliquer la séance ;
- supprimer la séance.
### Parcours visuel

Les activités apparaissent dans leur ordre d’exécution le long d’un parcours vertical.
Chaque élément est représenté par un nœud relié au suivant.

Un nœud d’exercice comporte :
- une icône ou une vignette ;
- le nom abrégé de l’exercice ;
- sa durée ou son nombre de répétitions ;
- éventuellement une indication visuelle de la présence d’une photo, d’une vidéo ou d’une consigne.

Une Activité de type Récupération utilise une représentation visuelle différente et plus discrète afin de ne pas être confondue avec un Exercice.
Le parcours commence par un repère de départ et se termine par un repère de fin.

### Paramètres de répétition

La structure de la séance comprend un **Cycle unique**, contenant un **Bloc unique**:
- Le Cycle possède son propre nombre de répétitions.  
- Le Bloc possède son propre nombre de répétitions.

Le Bloc regroupe une suite ordonnée d'Activités. À chaque répétition du Cycle, le Bloc est exécuté selon son propre nombre de répétitions, puis les éventuelles activités propres au Cycle sont exécutées.

Les nombres de répétitions du Bloc et du Cycle sont modifiables directement depuis leurs conteneurs respectifs.

Le Cycle et le Bloc peuvent être développés ou repliés afin de faciliter la lecture de la séance.
Le cycle peut être développé ou replié afin de faciliter la lecture des séances longues.

Aucune récupération n'est ajoutée sans action de l'utilisateur. Si deux activités de type **Exercice** s'enchaînent sans **pause après Série** ni activité de type **Récupération**, un avertissement discret et non bloquant est affiché.
### Guidage sonore

L'écran permet uniquement d'activer ou de désactiver les bips et les annonces vocales de la Séance. Les principes généraux du guidage sonore sont décrits dans le chapitre 03 et les règles détaillées dans le chapitre 10.

### Consultation d’un exercice

Toucher un nœud ouvre le détail de l’exercice.

L’utilisateur peut alors consulter :
- son nom ;
- sa consigne complète ;
- sa photo ou sa vidéo ;
- son mode d’exécution ;
- sa durée ou son nombre de répétitions.

Depuis ce détail, il peut modifier l’exercice.
Le détail peut être présenté dans un panneau superposé afin que l’utilisateur conserve le contexte de la séance.

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
- déplacer une Activité de type Exercice ou Récupération ;
- dupliquer un élément ;
- supprimer un élément.

Le déplacement doit être direct, par glisser-déposer.
La nouvelle organisation est enregistrée automatiquement.

Le mode de réorganisation peut temporairement simplifier l’affichage sous forme de liste compacte si le déplacement des nœuds sur le parcours visuel s’avère difficile à comprendre ou à utiliser.

### Exécution de la séance

Un bouton principal `Démarrer` permet de lancer la séance depuis son début.
Le bouton reste facilement accessible, même lorsque l’utilisateur fait défiler un parcours long.
La séance peut être exécutée dès qu’elle contient au moins un exercice.
Les Récupérations seules ne suffisent pas à rendre la Séance exécutable.

### Enregistrement

Toutes les modifications sont enregistrées automatiquement.
Il n’existe pas de bouton général `Enregistrer`.
Une indication discrète peut confirmer que les dernières modifications ont été prises en compte.
### Séance vide

Lorsqu’une séance ne contient encore aucun exercice, l’écran affiche :
- son nom ;
- une courte indication expliquant comment commencer ;
- une action principale `Ajouter un exercice` ;
- une action secondaire `Ajouter une récupération`.

Le bouton `Démarrer` est désactivé.
### Séance longue

Lorsque le parcours dépasse la hauteur de l’écran :
- l’utilisateur le parcourt verticalement ;
- le bouton `Démarrer` reste accessible ;
- un indicateur peut résumer sa longueur ou sa durée ;
- l’écran revient à la dernière position consultée après la modification d’un élément.
### Structure de la V1

La composition d'une séance repose sur la hiérarchie suivante :
- un Compte à rebours initial ;
- un **Cycle unique** ;
- le Cycle contient un **Bloc unique** ;
- le Bloc contient une suite ordonnée d'**Activités** ;
- le Bloc possède son propre nombre de répétitions ;
- le Cycle possède son propre nombre de répétitions ;
- le Cycle peut comporter des Activités propres exécutées après chaque répétition du Bloc ;
- la séance peut comporter des Activités de fin de séance ;
- une Fin de séance.

Le Compte à rebours initial et la Fin de séance sont des éléments structurels obligatoires et ne constituent pas des Activités.

Le Cycle et le Bloc peuvent être développés ou repliés afin de faciliter la lecture de la séance.

## Écran 5 – Création / modification d'une activité (Exercice)

![[Pasted image 20260810184537.png]]

### Objectif

Permettre à l'utilisateur de créer ou modifier une activité de type **Exercice** avec un écran principal volontairement allégé, centré sur les paramètres nécessaires à l'exécution.

La saisie d'un Exercice se déroule en **deux étapes** :
1. paramètres essentiels de l'Activité ;
2. informations complémentaires facultatives.

### Ouverture

L'écran est ouvert lorsque l'utilisateur :
- ajoute une nouvelle activité de type **Exercice** ;
- sélectionne une activité existante de type **Exercice**.

Le retour ramène à l'écran **Composition d'une séance**.

### Étape 1 — Paramètres de l'Activité

L'écran principal comporte uniquement :
- Type d'activité ;
- Nom ;
- Mode d'exécution ;
- Paramètres de la Série ;
- bouton **Valider**.

#### Nom

Le champ **Nom** est obligatoire.
Il identifie l'activité dans la composition de la séance ainsi que pendant son exécution.
Le bouton **Valider** reste désactivé tant que ce champ est vide.

#### Mode d'exécution

L'utilisateur choisit entre :
- **Durée** ;
- **Répétition**.

Le changement de mode adapte immédiatement la première roulette des paramètres.

#### Paramètres de la Série

Les paramètres sont présentés dans une roulette de grande taille, conçue pour être facilement manipulable au doigt.

En mode **Durée**, la roulette comporte :
- Durée en **minutes** ;
- Durée en **secondes** ;
- **Pause** ;
- **Séries**.

En mode **Répétition**, la zone Durée est remplacée par une roulette **Répétitions**, large et centrée. Les colonnes **Pause** et **Séries** restent inchangées.

Le nombre de Séries est propre à l'Activité et est toujours supérieur ou égal à 1.

Une Série correspond à :
- l'exécution de l'Exercice selon la durée ou le nombre de répétitions défini ;
- puis la pause éventuelle.

La pause est exécutée après chaque Série. Après la dernière Série, elle n'est pas exécutée lorsque l'étape suivante du plan d'exécution est une Activité de type **Récupération** explicite.

#### Validation de l'étape 1

L'action **Valider** :
- valide les paramètres essentiels ;
- ouvre l'écran **Informations complémentaires de l'activité** ;
- ne termine pas encore la création ou la modification de l'Activité.

### Étape 2 — Informations complémentaires de l'activité

Cet écran est volontairement simple et contient uniquement les informations facultatives :
- **Consigne** ;
- **Zones corporelles** ;
- bouton **Terminer**.

#### Consigne

La consigne est facultative et permet notamment de préciser :
- la manière d'exécuter le mouvement ;
- des conseils techniques ;
- des précautions particulières.

Elle peut être affichée pendant l'exécution de l'activité.

#### Zones corporelles

Une ou plusieurs Zones corporelles prédéfinies peuvent être associées à l'Exercice.
La sélection est multiple.

Dans le MVP, l'utilisateur ne peut ni créer, ni renommer, ni supprimer une Zone corporelle.

#### Terminer

L'action **Terminer** :
- enregistre l'Activité et ses informations complémentaires ;
- ferme le parcours de création ou de modification ;
- revient à la **Composition d'une séance** ;
- affiche immédiatement l'Activité à l'emplacement choisi.

Les deux champs étant facultatifs, l'utilisateur peut toucher **Terminer** sans avoir renseigné de Consigne ni de Zone corporelle.

### Modification d'une activité

Lorsqu'une activité existante est ouverte :
- ses paramètres sont préremplis ;
- **Valider** permet de passer de l'écran principal aux informations complémentaires ;
- **Terminer** enregistre la modification et revient à la composition de la séance ;
- les modifications concernent uniquement cette activité dans cette séance ;
- les Exécutions déjà historisées ne sont jamais modifiées.

### Actions secondaires

Depuis ce parcours, l'utilisateur peut également supprimer l'activité de la séance.

## Écran 6 – Création / modification d'une activité (Récupération)

![[Nouvelle activité - Récupération.png]]
### Objectif

Permettre de créer ou modifier une **activité de type Récupération**.

Une activité de récupération peut être insérée dans un bloc, à la fin d'un cycle ou à la fin d'une séance.

### Ajout rapide

Depuis un point d’insertion `＋`, l’utilisateur peut choisir directement :
- `Pause 15 s` ;
- `Pause 30 s` ;
- `Pause 45 s` ;
- `Pause 60 s` ;

La pause sélectionnée est immédiatement insérée à l’endroit choisi avec les paramètres suivants :
- nom : `Pause` ;
- fin automatique ;
- aucune consigne.

Aucun panneau de configuration ni aucune validation supplémentaire ne sont nécessaires.
### Récupération personnalisée

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
### Ajout à la séance

Une pause prédéfinie est insérée immédiatement à l’emplacement depuis lequel l’utilisateur a touché `＋`.

Pour une pause personnalisée, l’action principale du panneau est `Ajouter`.
Après son activation :
- la pause est insérée à l’emplacement choisi ;
- le panneau se ferme ;
- la nouvelle pause apparaît dans le parcours ;
- les modifications sont enregistrées automatiquement.
### Modification d’une activité de récupération

Toucher une pause existante ouvre le même panneau avec ses paramètres actuels.

L’utilisateur peut modifier :

- sa durée ;
- sa consigne ;
- son mode de fin ;
- son nom, s’il souhaite remplacer l’intitulé `Pause`.

Les modifications sont enregistrées automatiquement et concernent uniquement cette Activité de type Récupération dans la Séance.
### Représentation dans le parcours

Une activité de récupération doit être visuellement distincte d’un exercice.

Elle peut être représentée par :

- un nœud plus petit ;
- une icône de minuterie ou de pause ;
- une couleur ou une forme différente ;
- sa durée ;
- sa consigne abrégée, lorsqu’elle existe.

Cette représentation doit rester suffisamment discrète pour que les exercices constituent les étapes principales du parcours.

### Actions secondaires

En mode modification, l’utilisateur peut :

- dupliquer l'activité ;
- la supprimer de la séance.

La suppression n’affecte pas les séances passées.

### Fermeture sans ajout

Si l’utilisateur ferme le panneau de personnalisation avant d’ajouter la pause, aucun élément n’est créé.
## Écran 7 – Catégories de la séance

![[Nouvelle séance - Entrer une catégorie.png]]
### Objectif

Permettre d'associer une ou plusieurs catégories à une séance avant son enregistrement final.

Les catégories facilitent l'organisation, la recherche et le filtrage des séances. Elles n'ont aucun impact sur leur exécution.
### Contenu et comportement

- les catégories sont proposées sous forme de tags sélectionnables ;
- la sélection est multiple ;
- aucune catégorie n’est obligatoire ;
- l’action `+ Créer une catégorie` permet d’ajouter une catégorie personnalisée ;
- `Enregistrer la séance` enregistre les catégories puis propose :
- **Exécuter maintenant** ;
- **Planifier la séance** ;
- **Retourner au Catalogue de séances**.

## Écran 8 – Visualiser le calendrier des séances


![[Calendrier des routines.png]]
### Objectif

Permettre à l'utilisateur de visualiser l'ensemble de ses routines planifiées, de naviguer dans son calendrier et d'accéder rapidement à la gestion d'une routine.
### Ouverture

L'écran est accessible :
- depuis la barre de navigation inférieure en sélectionnant **Calendrier** ;
- après la création ou la modification d'une routine.
### Contenu

L'écran affiche :
- un sélecteur permettant de basculer entre les vues **Semaine** et **Mois** ;
- les commandes permettant de naviguer dans le temps (semaine précédente/suivante ou mois précédent/suivant) ;
- le calendrier correspondant à la période sélectionnée ;
- un indicateur coloré pour chaque jour contenant au moins une routine planifiée ;
- la liste des routines planifiées pour le jour sélectionné ;
- pour chaque routine :
    - la couleur de la séance associée ;
    - le nom de la séance ;
    - les informations de planification (date ou récurrence, heure et durée estimée) ;
    - le statut de la prochaine occurrence ;
    - un accès aux options de gestion de la routine ;
- le bouton **Planifier une routine**.
### Comportement

- Le changement entre les vues **Semaine** et **Mois** conserve le jour sélectionné lorsque cela est possible.
- La sélection d'un autre jour met immédiatement à jour la liste des routines affichées.
- Les indicateurs du calendrier utilisent la couleur de la séance associée à chaque routine.
- La sélection d'une routine ouvre le modal **Options d'une routine**.
- Le bouton **Planifier une routine** ouvre le modal de sélection d'une séance, puis l'écran **Planifier une séance**.
### Fermeture

L'écran est fermé lorsque l'utilisateur :
- sélectionne un autre onglet de la barre de navigation ;
- ouvre un autre écran depuis une action disponible sur le calendrier.
## Ecran 9 – Planification d'une séance

![[Planifier une séance.png]]
### Objectif

Créer ou modifier la planification d'une séance.
### Ouverture

- depuis **Calendrier > + Planifier une séance** ;
- depuis une routine existante (**Modifier la planification**).
### Contenu

- Séance
- Date de début
- Heure
- Récurrence
- Date de fin
- Rappel
- Bouton **Enregistrer**
### Comportement

- le champ **Séance** ouvre le modal **Choisir une séance** ;
- l'enregistrement crée ou met à jour la routine.
## Écran 10 – Exécution de séance


![[Exécution d'une séance.png]]
### Objectif

Guider l'utilisateur tout au long de l'exécution d'une séance à l'aide d'une interface lisible à distance, nécessitant un minimum d'interactions.

L'écran met en avant l'activité en cours, la progression de la séance et les commandes essentielles.
### Démarrage de la séance

Toucher `Démarrer` depuis la composition d'une séance ou depuis une routine de planification lance immédiatement la première activité.

Aucun écran de confirmation ou de préparation supplémentaire n’est imposé.

Avant de commencer, un court compte à rebours peut être proposé afin de laisser à l’utilisateur le temps de poser son téléphone ou de se mettre en position.

Ce compte à rebours doit pouvoir être désactivé dans les réglages ou ignoré immédiatement.

Au commencement de chaque activité, une voix annonce son nom. Pour une Récupération générée par une pause après Série, l'annonce peut utiliser le libellé « Pause » défini pour cette récupération.
### Informations affichées

L’écran présente en priorité :

- le nom de l'activité en cours ;
- sa photo, sa vidéo ou une illustration par défaut ;
- sa consigne principale ;
- le temps restant ou le nombre de répétitions ;
- la progression dans la séance ;
- le bloc et le cycle en cours ;
- l’état des bips et des annonces vocales, représenté par des icônes discrètes ;
- l’action permettant de terminer ou de passer à l’étape suivante.

Les informations doivent rester lisibles lorsque le téléphone est posé à quelques mètres de l’utilisateur.

Les éléments secondaires ne doivent pas réduire inutilement la place accordée au média, au temps et à la consigne.

L’utilisateur peut activer ou couper séparément les bips et les annonces vocales depuis l’écran d’exécution, sans interrompre la séance.
### Progression dans la séance

Une représentation compacte du parcours indique :

- la position de l’utilisateur dans la séance ;
- les étapes déjà terminées ;
- l’étape en cours ;
- les prochaines étapes ;
- la progression générale de la séance.
- la progression dans le bloc et le cycle en cours.

Cette représentation reprend le langage visuel du parcours présenté dans la composition de la séance, sans afficher en permanence l’ensemble de ses détails.

L’utilisateur peut ouvrir une vue plus complète du parcours afin de consulter les étapes restantes. Cette vue est uniquement informative : elle ne permet pas de sélectionner directement une autre étape.
### Exercice chronométré

Pour un exercice défini par une durée :
- le compte à rebours démarre au début de l’exercice ;
- le temps restant est affiché de manière très visible ;
- l’utilisateur peut mettre le compte à rebours en pause ;
- il peut reprendre l’exercice ;
- il peut terminer l’exercice avant la fin du temps prévu.

Pendant l’exercice, un bip grave et discret retentit chaque seconde. Pendant les trois dernières secondes, un bip aigu remplace le bip grave à chaque seconde. Lorsque le compte à rebours atteint zéro, l’application passe automatiquement à l’étape suivante et en annonce le nom.
### Exercice non chronométré

Pour un exercice défini par un nombre de répétitions :
- le nombre prévu est affiché de manière très visible ;
- aucun comptage automatique n’est requis dans la V1 ;
- aucune durée n’est imposée ;
- l’utilisateur touche `Terminé` lorsqu’il a réalisé l'exercice demandé.

L’utilisateur n’est pas obligé de confirmer chaque répétition individuellement.
Un bip de rythme est émis, mais aucun compte à rebours sonore n’est émis puisqu’aucun décompte temporel automatique n’est en cours. Le nom de l’exercice est néanmoins annoncé lorsqu’il commence.
La durée réelle de l’exercice est  enregistrée automatiquement dans la séance sans être imposée à l’utilisateur.
### Exécution d'une activité de récupération

Pendant une pause, l’écran affiche :
- la mention `Pause` ou son nom personnalisé ;
- le temps restant ;
- sa consigne éventuelle ;
- l’exercice suivant ;
- une action permettant de passer immédiatement à la suite.

Pour une pause à fin automatique, l’étape suivante commence à la fin du compte à rebours.
Pour une pause à fin manuelle, la fin du temps est signalée, puis l’utilisateur touche `Continuer`.

Au début de la pause ou de la récupération, une voix en annonce le nom ou le rôle. Aucun bip de rythme n’est émis pendant cette étape. Si elle est chronométrée, un bip aigu retentit pendant chacune de ses trois dernières secondes.
### Enchaînement des activités

À la fin d’un exercice, l’application affiche immédiatement l’étape suivante.
L’enchaînement doit éviter les confirmations répétitives.

Le comportement dépend du type d’élément :
- une pause à fin automatique enchaîne automatiquement ;
- une pause à fin manuelle attend l’action de l’utilisateur ;
- un exercice en mode Répétition se termine avec `Terminé` ;
- un exercice minuté enchaîne automatiquement avec l’étape suivante à la fin du compte à rebours ;
- les trois dernières secondes signalent l’imminence de cette transition ;
- l’étape suivante est annoncée vocalement lorsqu’elle commence.

L’utilisateur conserve la possibilité d'interrompre la séance (réinitialiser l'activité, la mettre en pause, terminer la séance avant son terme ou de passer manuellement à l'étape suivante).
### Fin de la séance

Lorsque la dernière étape est terminée, la séance est enregistrée automatiquement.
L’utilisateur accède alors à l’écran de fin de séance.

La séance d'origine n'est jamais modifiée par son exécution. La routine de planification éventuelle n'est pas modifiée non plus.
## Écran 11 – Interruptions de séance

![[Modal - Exécution d'une séance - Interrompre.png]]
### Objectif

### Commandes principales

Pendant l'exécution de la séance, les commandes principales restent accessibles d’un seul toucher :
- réinitialiser l'activité ;
- mettre en pause ou reprendre la séance ;
- quitter la séance ;
- passer à l’étape suivante.

Les actions les plus fréquemment utilisées sont suffisamment grandes pour être activées facilement pendant un exercice.
### Réinitialiser l'activité

### Mise en pause de la séance

Mettre la séance en pause suspend :
- le compte à rebours en cours ;
- l’enchaînement automatique ;
- le calcul du temps actif de l’exercice ;
- les bips de rythme et le compte à rebours sonore ;
- toute annonce vocale liée à une transition qui n’a pas encore eu lieu.

L'état de pause est immédiatement identifiable, l'application indique notamment que :
- le chronomètre est figé ;
- le bouton **Pause** est remplacé par **Reprendre** (ou **Démarrer**, selon le libellé retenu) ;
- les animations et indicateurs de progression sont suspendus ;
- un indicateur visuel (par exemple **⏸ En pause**) est affiché sur l'écran.

L’utilisateur peut ensuite :
- reprendre la séance ;
- consulter le parcours ;
- quitter la séance.

La reprise ne répète l’annonce de l’étape en cours que si cette solution est jugée utile lors des tests d’usage.
### Quitter une séance en cours

Si l’utilisateur demande à quitter la séance, l’application propose :
- `Reprendre` ;
- `Arrêter la séance`.

`Enregistrer et quitter` conserve la séance partielle dans l’suivi.

`Abandonner la séance` ne crée pas de séance terminée, mais une confirmation est demandée afin d’éviter une perte accidentelle.
### ### Navigation pendant l'exécution

L'ordre d'exécution des étapes est déterminé par la structure de la séance.
 
Une séance démarre toujours par le **compte à rebours initial**. L'utilisateur ne peut pas sélectionner directement une autre étape ni revenir à une étape déjà exécutée.
 
Pendant l'exécution, l'utilisateur peut :
 
- poursuivre l'enchaînement prévu ;
- utiliser la commande **Activité suivante** pour interrompre l'étape en cours et passer directement à l'étape suivante.
 
Une étape déjà terminée ou passée ne peut pas être rejouée au cours de la même exécution.
### Verrouillage et interruption

Si l’application passe temporairement en arrière-plan ou si l’écran se verrouille :

- la séance en cours est conservée ;
- un compte à rebours actif continue de manière cohérente ;
- le guidage sonore continue de fonctionner, dans la mesure permise par le système d’exploitation ;
- l’utilisateur retrouve l’étape en cours à son retour.

Une interruption courte, comme un appel ou une notification, ne doit pas entraîner la perte de la progression.

Le comportement précis des minuteurs, des bips et des annonces vocales en arrière-plan ou lorsque l’écran est verrouillé devra respecter les possibilités techniques d’iOS et d’Android et être validé pendant le développement.

## Écran 12 – Synthèse de séance

![[Exécution d'une séance - Synthèse de séance.png]]
### Objectif

Confirmer que la séance a été enregistrée, présenter un bilan immédiatement compréhensible et permettre à l’utilisateur de quitter l’écran sans étape inutile.

Cet écran doit rester simple et positif. Il ne constitue pas un formulaire à remplir obligatoirement.

### Affichage à la fin de la séance

Lorsque la dernière étape est terminée, l’écran affiche :

- le nom de la séance ;
- la confirmation que la séance est terminée et enregistrée ;
- sa durée totale ;
- le nombre d’activités réalisées ;
- les éventuelles activités ignorées ;
- la date et l’heure de réalisation.

Une représentation synthétique du parcours peut distinguer les étapes :

- réalisées ;
- ignorées ;
- répétées ;
- interrompues.

### Séance partielle

Si l’utilisateur a choisi `Arrêter la séance` avant son terme, l’écran indique clairement que la séance est **partielle**.

Le bilan précise notamment :

- le nombre d’activités réalisées ;
- le nombre d’activités non réalisées ;
- l’activité à laquelle la séance a été interrompue ;
- la durée enregistrée.

Une séance partielle est conservée dans l’historique avec un statut distinct d’une séance terminée.

### Ressenti après la séance

L’utilisateur peut indiquer rapidement son ressenti général.

La saisie doit pouvoir être réalisée en un seul toucher, par exemple avec une échelle visuelle courte :

- `Difficile` ;
- `Correct` ;
- `Facile`.

Cette information est facultative. L’utilisateur peut quitter l’écran sans répondre.

L’échelle exacte et sa représentation seront testées dans les wireframes afin d’éviter toute ambiguïté entre difficulté de la séance, douleur et satisfaction.

### Douleur ou gêne (dans la V2)

L’utilisateur peut signaler facultativement une douleur ou une gêne ressentie pendant la séance.

Cette action ouvre une saisie complémentaire permettant d’indiquer :

- l’intensité ressentie ;
- la zone concernée ;
- l’exercice pendant lequel elle est apparue ;
- une note libre.

Le signalement d’une douleur ne doit jamais être imposé à chaque séance.

Ce n'est pas mis en place dans la V1, et dans la V2 ces informations serveront uniquement au suivi personnel. Elles ne constituent ni un diagnostic ni une recommandation médicale.
### Note de séance

L’utilisateur peut ajouter une note libre, par exemple pour préciser :

- un exercice particulièrement difficile ;
- une amélioration ressentie ;
- une adaptation réalisée ;
- une consigne donnée par son kinésithérapeute ;
- un événement ayant interrompu la séance.

La note est facultative et peut également être ajoutée ou modifiée ultérieurement depuis le détail déployé de l’Exécution dans le Suivi.
### Actions principales

L’action principale est `Terminer`.

Elle ramène l’utilisateur à l’écran depuis lequel la séance a été lancée, avec la dernière exécution mise à jour.

L’utilisateur peut également :

- consulter le détail déployé de l’Exécution dans le Suivi ;
- revenir au `Catalogue de séances`.

Aucune confirmation supplémentaire n’est demandée, puisque la séance est déjà enregistrée automatiquement.

### Nouvelle exécution

L’écran de fin ne doit pas encourager accidentellement le lancement immédiat d’une nouvelle séance.

Une action secondaire `Relancer la séance` peut néanmoins être proposée si ce besoin est confirmé pendant les tests.

### Enregistrement automatique

La séance est enregistrée avant l’affichage de cet écran.

Le ressenti et la note sont ensuite enregistrés automatiquement au fur et à mesure de leur saisie. Le signalement d’une douleur ou d’une gêne est hors MVP et prévu pour une version ultérieure.

Une indication discrète confirme que les informations ont bien été prises en compte.

### Préparation des versions suivantes

La structure de cet écran doit pouvoir accueillir ultérieurement :

- une comparaison avec les séances précédentes ;
- l’évolution de la difficulté ou de la douleur ;
- les recommandations d’adaptation de la séance ;
- le partage du bilan avec un professionnel ;
- les statistiques détaillées de progression.

Ces éléments ne doivent pas alourdir l’écran de fin de séance dans la V1.

## Écran 13 – Suivi : vue d’ensemble (V2)

![[Suivi - Vue d'ensemble.png]]
### Objectif

Permettre à l’utilisateur de retrouver l’ensemble des exécutions de séances et d’accéder au détail de chacune d’elles.

Le suivi présente les séances enregistrées, qu’elles soient terminées ou partielles.

Ne sera pas mis en place dans la V1, mais dans la V2.
### Accès à l’suivi

L’suivi est accessible depuis la navigation principale de l’application.

L’utilisateur peut le consulter indépendamment d’une routine particulière.

### Présentation des séances

Les séances sont affichées de la plus récente à la plus ancienne.

Chaque élément représente une exécution de séance et présente au minimum :

- le nom de la séance exécutée ;
- la date et l’heure de la séance ;
- sa durée ;
- son statut : `Terminée`, `Partielle` ou `Interrompue`.

Toucher une séance ouvre son détail.

### Regroupement chronologique

Les séances peuvent être regroupées par périodes afin de faciliter leur lecture, par exemple :

- aujourd’hui ;
- cette semaine ;
- périodes précédentes.

Le choix précis du regroupement sera défini dans les wireframes en fonction du nombre de séances affichées.

### Séances terminées, partielles et interrompues

Les Séances terminées, partielles et interrompues doivent être clairement distinguables.

Une Exécution partielle ou interrompue reste visible dans l’historique avec son statut. Elle n’est pas présentée comme une Séance entièrement réalisée.

### Conservation des informations

Chaque exécution conserve un instantané complet de la séance telle qu'elle existait au moment de son lancement.

Les modifications ultérieures apportées à la séance, aux activités, aux blocs, aux cycles ou aux routines n'ont aucun effet sur les exécutions déjà enregistrées.

### État vide

Si aucune séance n’a encore été enregistrée, l’écran indique simplement que l’suivi est vide.
Une action permet de revenir au `Catalogue de séances` afin de lancer une première séance.

## Écran 14 – Suivi : séances

![[Suivi - Séances.png]]

### Objectif

Permettre à l'utilisateur de consulter l'historique complet de ses séances exécutées, de retrouver rapidement une séance grâce à la recherche, aux filtres et aux tris, puis de consulter le détail de son déroulement directement depuis la liste.

Cet écran constitue le point d'entrée principal du suivi des exécutions.

Dans le MVP, l'écran **Suivi : séances** est affiché directement, sans sélecteur d'onglet. La **Vue d'ensemble** (écran 13) est réservée à une version ultérieure et n'est ni affichée ni accessible dans le MVP.
### Contenu

L'écran est composé de :
- un champ de recherche ;
- un bouton **Filtrer** ;
- un bouton **Déployer tout** ou **Replier tout** selon l'état actuel de la liste ;
- une liste chronologique des séances exécutées.

Les séances sont regroupées par période :
- Aujourd'hui ;
- Hier ;
- puis par date.

Chaque groupe est précédé d'un en-tête chronologique.
### Carte de séance (vue condensée)

Par défaut, chaque séance est affichée sous forme condensée.
Une carte affiche :
- le nom de la séance ;
- l'heure de début ;
- la durée réelle ;
- le statut d'exécution ;
- le ressenti renseigné en fin de séance, lorsqu'il existe ;
- un indicateur permettant de développer ou replier la séance.

Le statut est immédiatement identifiable grâce à un libellé et une couleur :
- **Terminée** ;
- **Partielle** ;
- **Interrompue**.
### Vue développée

Toucher une carte développe son contenu.
La vue développée présente l'instantané de la séance exécutée, organisé par cycles.

Pour chaque cycle sont affichés :
- son numéro ;
- les activités exécutées dans leur ordre réel ;
- le statut de chaque activité.

Chaque activité peut notamment apparaître avec les états suivants :
- Terminée ;
- Partielle ;
- Ignorée (évolutions futures).

Les activités sont affichées exactement telles qu'elles existaient au moment de l'exécution de la séance.
Les modifications ultérieures apportées à la séance d'origine n'ont aucun impact sur cet historique.
### Déployer tout / Replier tout

Le bouton situé au-dessus de la liste permet :
- de développer simultanément toutes les séances affichées ;
- ou de toutes les replier.

Son libellé s'adapte automatiquement :
- **Déployer tout**
- **Replier tout**

Les cartes ouvertes individuellement restent cohérentes avec cet état global.
### Recherche

Le champ de recherche filtre immédiatement la liste.
La recherche s'effectue sur :
- le nom de la séance ;
- les catégories associées ;
- les zones corporelles des activités (si présentes dans la séance).

Les résultats sont mis à jour au fur et à mesure de la saisie.
### Filtrage

Le bouton **Filtrer** ouvre le modal **Filtrer les séances**.
Les critères peuvent être combinés.

Les filtres disponibles sont :
- catégories ;
- zones corporelles ;
- période ;
- statut.

Le bouton **Réinitialiser** supprime l'ensemble des filtres actifs.
Le bouton **Appliquer** ferme le modal et met immédiatement la liste à jour.

### Tri

Une seule règle de tri peut être active à la fois.
Les tris disponibles sont :
- Plus récentes ;
- Plus anciennes ;
- Nom ;
- Durée.

Par défaut, les séances sont triées de la plus récente à la plus ancienne.
### Comportement

Les filtres, le tri et le texte de recherche sont appliqués simultanément.
La liste est actualisée immédiatement après validation du modal.
L'état développé ou replié des cartes est conservé tant que l'utilisateur reste sur cet écran.

### État vide

Si aucune séance ne correspond aux critères sélectionnés, l'écran affiche un message indiquant qu'aucune séance n'a été trouvée.

Une action **Réinitialiser les filtres** est proposée.

Si aucune séance n'a encore été exécutée, l'écran indique que l'historique est vide et propose de revenir vers **Mes séances** pour lancer une première séance.
## Les modales

### Modal – Abandonner la création d’une séance

![[Nouvelle séance - Abandonner la création.png]]
#### Objectif

Éviter la perte accidentelle des informations saisies lorsqu’un utilisateur quitte la création d’une séance avant de l’avoir validée.
#### Ouverture

La modale s’affiche lorsque l’utilisateur appuie sur le bouton **Retour** alors que des informations ont déjà été saisies ou modifiées.

L’écran de création reste visible en arrière-plan, assombri et non interactif.
#### Contenu

**Titre**

> Abandonner la création ?

**Message**

> Les informations saisies seront perdues et la séance ne sera pas créée.

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
- ne crée aucune séance ;
- ramène l’utilisateur à **Catalogue de séances**.

#### Cas sans modification

Si l’utilisateur n’a encore saisi ou modifié aucune information, le retour vers **Catalogue de séances** est immédiat, sans afficher la modale.
### Modal – Création d'une catégorie


![[Modal - Nouvelle catégorie.png]]
#### Objectif

Permettre à l'utilisateur de créer rapidement une nouvelle catégorie sans quitter l'écran **Catégories de la séance**.

La création d'une catégorie s'effectue dans une fenêtre modale afin de conserver le contexte de la séance en cours de création ou de modification.
#### Ouverture

Le modal est ouvert lorsque l'utilisateur touche **+ Créer une catégorie**.
L'écran **Catégories de la séance** reste visible en arrière-plan, assombri et non interactif.
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
- elle est automatiquement sélectionnée pour la séance en cours ;
- le modal se ferme ;
- l'utilisateur revient à l'écran **Catégories de la séance**.
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
La nouvelle catégorie devient immédiatement disponible pour toutes les séances de l'utilisateur.

### Modal – Options de l'activité

![[Nouvelle séance - Option d'activité.png]]
![[Nouvelle séance - Option d'activité.png]]
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
    - type (Exercice ou Récupération) ;
    - durée ou répétitions ;
    - nombre de Séries ;
    - pause après Série ;
    - consigne ;
    - zones corporelles.
- Le nom reste identique. Il n'est pas nécessaire d'ajouter « (copie) », puisque plusieurs Activités peuvent déjà avoir le même nom dans une Séance.

**Supprimer**

- Supprime l'activité de la séance.
- S'il s'agit de la dernière Activité de la Séance, la suppression est également autorisée ; la Séance devient alors vide et l'utilisateur peut ensuite ajouter une nouvelle Activité.
### Modal – Options d'une séance

![[Modal - Catalogue des séances - Options.png]]

#### Objectif

Permettre à l'utilisateur d'accéder aux principales actions disponibles pour une séance sans ouvrir son écran de modification.

Le modal est affiché lorsque l'utilisateur touche le bouton **⋯** d'une carte de la liste **Catalogue de séances**.
#### Ouverture

Le modal est affiché au-dessus de l'écran **Catalogue de séances**.
L'écran reste visible en arrière-plan, assombri et non interactif.
#### Contenu

Les actions proposées sont :

- ✏️ Modifier
- 📄 Dupliquer
- 📅 Planifier
- 📦 Archiver _(ou Restaurer si la séance est archivée)_
- 🗑️ Supprimer _(en rouge)_
---
- **Annuler**
#### Comportement
##### Modifier

Ouvre l'écran **Composition d'une séance**.
Tous les paramètres de la séance sont préremplis.
##### Dupliquer

Crée immédiatement une copie complète de la séance.
La copie comprend :
- toutes les activités ;
- les blocs ;
- les cycles ;
- les catégories ;
- les paramètres d'exécution.

La nouvelle séance est ajoutée au Catalogue de séances.
##### Planifier

Ouvre l'écran **Planification** afin de créer une routine pour cette séance.
La planification fait partie du MVP.
##### Archiver

Archive la séance.

Une séance archivée :
- n'apparaît plus dans la liste principale ;
- reste consultable ;
- peut être restaurée ultérieurement ;
- conserve son historique de séances.

Lors de l'archivage d'une Séance, toutes les Routines qui lui sont associées sont supprimées après confirmation. Les occurrences futures cessent d'être calculées. Les occurrences déjà historisées et les Exécutions enregistrées sont conservées.

La restauration d'une Séance ne restaure aucune ancienne Routine. Toute nouvelle planification nécessite la création d'une nouvelle Routine.

Si la séance est déjà archivée, cette action devient **Restaurer**.
##### Supprimer

Supprime définitivement la séance.
Une confirmation est demandée avant la suppression.
La suppression de la séance **n'efface jamais les exécutions déjà réalisées**, qui restent disponibles dans **Suivi**.
##### Annuler

Ferme le modal sans effectuer d'action.
### Modal – Options d'une routine

![[Modal - Options d'une routine.png]]

#### Objectif

Permettre à l'utilisateur d'accéder rapidement aux principales actions disponibles sur une routine planifiée, sans ouvrir directement son écran de modification.
#### Ouverture

Le modal s'ouvre lorsque l'utilisateur touche une routine dans la liste du Calendrier.
#### Contenu

Le modal affiche :

- le nom de la séance associée à la routine ;
- l'action **Modifier la planification** ;
- l'action **Supprimer la routine** ;
- le bouton **Annuler**.
#### Comportement

- **Modifier la planification** ouvre l'écran **Planifier une séance** prérempli avec les paramètres de la routine sélectionnée.
- **Supprimer la routine** ouvre le modal **Confirmer la suppression d'une routine**.
- **Annuler**, un toucher en dehors du modal ou un glissement vers le bas ferment le modal sans modification.
#### Fermeture

Le modal est fermé :
- après la sélection d'une action ;
- après un appui sur **Annuler** ;
- après un toucher en dehors du modal ;
- après un glissement vers le bas.
### Modal – Confirmer la suppression d'une routine


![[Modal - Confirmation de la suppression d'une routine.png]]

#### Objectif

Demander une confirmation explicite avant la suppression définitive d'une routine planifiée.
#### Ouverture

Le modal s'ouvre après la sélection de l'action **Supprimer la routine** depuis le modal **Options d'une routine**.
#### Contenu

Le modal affiche :

- le titre **Supprimer cette routine ?** ;
- un message précisant que les occurrences futures ne seront plus planifiées et que l'historique existant sera conservé ;
- un bouton **Supprimer la routine** ;
- un bouton **Annuler**.
#### Comportement

- **Supprimer la routine** supprime définitivement la Routine et met fin à la génération de ses occurrences futures. Les occurrences déjà historisées et les Exécutions déjà enregistrées sont conservées.
- Les séances déjà exécutées sont conservées dans le **Suivi**.
- **Annuler**, un toucher en dehors du modal ou un glissement vers le bas ferment le modal sans suppression.
#### Fermeture

Le modal est fermé :

- après la confirmation de la suppression ;
- après un appui sur **Annuler** ;
- après un toucher en dehors du modal ;
- après un glissement vers le bas.
### Modal – Réinitialisation de l'activité

![[Exécution d'une séance - Réinitialiser l'activité.png]]
#### Objectif

Permettre à l'utilisateur de recommencer immédiatement **l'activité en cours** depuis le début, sans modifier la progression de la séance.

Cette action est utile lorsqu'une activité a été mal exécutée ou interrompue et doit être recommencée.
#### Ouverture

Le modal est affiché lorsque l'utilisateur appuie sur le bouton Réinitialiser pendant l'exécution d'une activité.

L'écran d'exécution reste visible en arrière-plan, assombri et non interactif.
#### Contenu

Le modal affiche :

**Titre**

> Réinitialiser l'activité ?

**Message**

L'activité en cours recommencera depuis le début.

La progression de la séance sera conservée.

**Actions**

- 🔄 Recommencer l'activité
- Annuler
#### Comportement

##### Recommencer l'activité

L'application :
- remet à zéro le chronomètre de l'activité en cours ;
- remet à zéro le nombre de répétitions ou la durée restante de cette activité ;
- conserve la progression de la séance :
    - activité courante inchangée ;
    - bloc en cours inchangé ;
    - cycle en cours inchangé ;
    - temps total de la séance conservé ;
- relance immédiatement l'activité selon son comportement normal (annonce vocale, chronomètre, etc.).
##### Annuler

Ferme le modal et reprend immédiatement l'exécution de l'activité à l'endroit où elle avait été interrompue.
### Modal – Passage à l'activité suivante

![[Exécution d'une séance - Passer à l'activité suivante.png]]
#### Objectif

Permettre à l'utilisateur de passer immédiatement à l'activité suivante de la séance lorsqu'il souhaite interrompre l'activité en cours.

Cette action permet d'adapter l'exécution de la routine aux besoins de l'utilisateur sans interrompre la séance.
#### Ouverture

Le modal est affiché lorsque l'utilisateur appuie sur le bouton **Suivant** pendant l'exécution d'une activité.

L'écran d'exécution reste visible en arrière-plan, assombri et non interactif.

#### Contenu

Le modal affiche :

**Titre**

> Passer à l'activité suivante ?

**Message**

L'activité en cours sera considérée comme terminée et la séance poursuivra son exécution avec l'activité suivante.

**Actions**

- ▶ Passer à l'activité suivante
- Annuler
#### Comportement

##### Passer à l'activité suivante

L'application :
- arrête immédiatement l'activité en cours ;
- met à jour les indicateurs de progression de la séance ;
- démarre l'activité suivante selon les règles normales d'exécution (annonce vocale, compte à rebours, chronomètre, etc.) ;
- si l'activité en cours est la dernière du Bloc ou du Cycle, applique les règles de passage à la répétition suivante du Bloc, à la répétition suivante du Cycle ou à la suite de la séance selon le plan d'exécution.
##### Annuler

Ferme le modal et reprend immédiatement l'exécution de l'activité en cours, sans modifier la progression de la séance.

### Modal – Pause / Arrêt de l'exécution de la séance

![[Exécution d'une séance - Mettre en pause ou Arrêter la séance.png]]
#### Objectif

Permettre à l'utilisateur de suspendre temporairement l'exécution d'une séance sans perdre sa progression, puis de la reprendre ou de l'arrêter définitivement.
La mise en pause suspend immédiatement l'exécution tout en conservant l'état exact de la séance.

#### Ouverture

Le modal est affiché lorsque l'utilisateur touche le bouton **Pause** pendant l'exécution d'une séance.
L'écran d'exécution reste visible en arrière-plan, assombri et non interactif.
Dès l'ouverture du modal, la séance est automatiquement mise en pause.

#### Comportement de la pause

La mise en pause suspend immédiatement :
- le compte à rebours en cours ;
- l'enchaînement automatique des activités ;
- le calcul du temps actif de l'activité ;
- les bips et annonces vocales ;
- les animations et indicateurs de progression.

L'activité en cours reste affichée avec le temps restant.
La progression de la séance est intégralement conservée.
#### Contenu

**Titre**

> Séance en pause

**Message**

> La séance « _Nom de la séance_ » est suspendue.  
> Le chronomètre reprendra à **00:24**.

**Actions**

- ▶ **Reprendre la séance**
- ⏹ **Arrêter la séance**

#### Reprendre la séance

L'action **Reprendre la séance** :
- ferme le modal ;
- reprend immédiatement la séance à l'instant exact où elle a été interrompue ;
- relance le chronomètre ;
- réactive les bips, annonces vocales et animations.

La progression de la séance est inchangée.
#### Arrêter la séance

L'action **Arrêter la séance** :
- met immédiatement fin à l'exécution ;
- enregistre automatiquement la progression réalisée ;
- enregistre la séance avec le statut **Interrompue** ;
- ouvre l'écran **Synthèse de séance**.

Les activités non exécutées restent identifiées comme telles dans le détail de la séance.
#### Conséquences de l'arrêt

L'arrêt d'une séance :
- ne modifie jamais la séance d'origine ;
- ne modifie jamais la routine de planification éventuelle ;
- conserve les temps réellement exécutés ;
- permet de consulter ultérieurement cette séance dans **Suivi** avec le statut **Interrompue**.
#### Fermeture

Le modal ne peut être fermé que par l'une des deux actions proposées :
- **Reprendre la séance** ;
- **Arrêter la séance**.

Toucher en dehors du modal ou utiliser le geste système de fermeture n'a aucun effet.

### Modal – Paramétrer le compte à rebours initial

![[Modal - Nouvelle séance - Compte à rebours initial.png]]
#### Objectif

Permettre à l’utilisateur de personnaliser les paramètres du **Compte à rebours initial** de la séance sans quitter l’écran de composition.  
Le Compte à rebours initial est un élément structurel obligatoire de la séance et ne constitue pas une Activité.

#### Contenu

Le modal affiche trois paramètres modifiables :

- **Nom** : libellé affiché pour le compte à rebours initial ;
- **Durée** : durée du compte à rebours, exprimée en secondes ;
- **Texte vocal** : texte annoncé vocalement pendant ou au début du compte à rebours.

Les valeurs proposées lors de la création d’une nouvelle séance proviennent des préférences globales du Profil.  
Par défaut :

- Nom : `Compte à rebours initial` ;
- Durée : `10 s` ;
- Texte vocal : `Get ready`.

Une durée de `0 s` rend le compte à rebours instantané sans supprimer l’élément de la structure de la séance.

#### Actions

- **Enregistrer** : applique les valeurs saisies au Compte à rebours initial de la séance et ferme le modal.
- **Annuler** : ferme le modal sans appliquer les modifications.

#### Navigation

Le modal s’ouvre lorsque l’utilisateur touche la carte **Compte à rebours initial** depuis l’écran de composition d’une séance.  
Après fermeture, l’utilisateur revient au même emplacement dans la composition de la séance.

### Modal – Paramétrer la fin de séance

![[Modal - Nouvelle séance - Fin de séance.png]]
#### Objectif

Permettre à l’utilisateur de personnaliser les paramètres de la **Fin de séance** sans quitter l’écran de composition.  
La Fin de séance est un élément structurel obligatoire, exécuté après la dernière Activité, et ne constitue pas elle-même une Activité.

#### Contenu

Le modal affiche trois paramètres modifiables :

- **Nom** : libellé affiché pour la fin de séance ;
- **Durée** : durée de la phase de fin de séance, exprimée en secondes ;
- **Texte vocal** : texte annoncé vocalement pendant ou au début de la fin de séance.

Les valeurs proposées lors de la création d’une nouvelle séance proviennent des préférences globales du Profil.  
Par défaut :

- Nom : `Fin de séance` ;
- Durée : `0 s` ;
- Texte vocal : `Séance terminée, bravo`.

Une durée de `0 s` rend la phase de fin instantanée sans supprimer l’élément de la structure de la séance.

#### Actions

- **Enregistrer** : applique les valeurs saisies à la Fin de séance et ferme le modal.
- **Annuler** : ferme le modal sans appliquer les modifications.

#### Navigation

Le modal s’ouvre lorsque l’utilisateur touche la carte **Fin de séance** depuis l’écran de composition d’une séance.  
Après fermeture, l’utilisateur revient au même emplacement dans la composition de la séance.