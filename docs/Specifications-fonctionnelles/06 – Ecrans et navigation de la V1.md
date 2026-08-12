## Objectif de conception

L’interface du produit fini doit être principalement visuelle, intuitive et utilisable avec le moins de touchers possible.

L’utilisateur doit notamment pouvoir ouvrir rapidement une séance, comprendre immédiatement l’action attendue pendant une Exécution et accéder facilement aux fonctions courantes.

Pendant l’Exécution, le guidage visuel est complété par des signaux sonores et des annonces vocales afin que l’utilisateur puisse suivre la séance sans regarder constamment l’écran.

La conception du MVP respecte les principes suivants :

- limiter le nombre d’écrans et d’étapes intermédiaires ;
- donner un accès direct aux actions les plus fréquentes ;
- privilégier les icônes et les indicateurs visuels ;
- limiter les textes affichés pendant l’Exécution ;
- hiérarchiser clairement les informations selon leur importance pendant l’effort ;
- enregistrer automatiquement les modifications lorsque la validation explicite d’un formulaire n’est pas nécessaire ;
- éviter les confirmations inutiles ;
- afficher clairement l’action principale de chaque écran ;
- rendre les commandes essentielles facilement accessibles avec le pouce ;
- placer les paramètres moins fréquents dans un niveau secondaire.

### Rapidité de création

La création d’une Séance, d’une Activité ou d’une Récupération doit pouvoir être réalisée en quelques secondes, avec un minimum de saisies et de touchers.

L’application privilégie :

- des valeurs par défaut immédiatement utilisables ;
- l’affichage initial des seuls paramètres indispensables ;
- l’ajout direct d’un élément à l’endroit choisi dans la Séance ;
- la possibilité de modifier ou d’enrichir ultérieurement chaque élément ;
- un accès secondaire aux consignes et informations complémentaires.

La création rapide constitue le parcours principal. L’ajout d’une consigne, de zones corporelles ou d’informations complémentaires reste facultatif.

## Navigation principale et articulation des écrans

### Navigation principale

La navigation principale donne accès à quatre onglets :

- `Mes séances` ;
- `Calendrier` ;
- `Suivi` ;
- `Préférences`.

`Mes séances` constitue l’écran d’accueil par défaut.

L’onglet `Calendrier` permet de visualiser les Séances planifiées et d’accéder à la création et à la gestion des Routines.  
L’onglet `Suivi` permet de consulter les Exécutions enregistrées.  
L’onglet `Préférences` permet d’accéder aux préférences globales de l’application.

### Parcours de création d’une Séance

Depuis `Mes séances`, l’utilisateur peut créer une Séance.

La création suit le parcours suivant :

1. saisie obligatoire du nom et sélection d’une couleur ;
2. composition de la Séance ;
3. sélection facultative d’une ou plusieurs Catégories ;
4. `Enregistrer la séance` ;
5. retour au `Catalogue de séances`.

Aucune Routine n’est créée automatiquement.

### Parcours d’ouverture et de modification d’une Séance

Dans le `Catalogue de séances`, la zone principale d’une carte permet d’ouvrir directement l’écran d’Exécution de la Séance. Cette action est disponible que la carte soit condensée ou déployée.

Le déploiement de la carte est facultatif et sert uniquement à consulter rapidement son contenu.

La modification d’une Séance passe par le menu `⋯` puis l’action `Modifier`.

Le parcours de modification est toujours :

1. écran `Nom et couleur` prérempli ;
2. écran `Composition d’une séance` ;
3. le cas échéant, écran `Catégories de la séance`.

Ainsi, modifier une Séance ne conduit jamais directement à l’écran de composition.

### Parcours d’Exécution

Ouvrir une Séance depuis le Catalogue, ou demander l’Exécution d’une occurrence depuis une Routine, ouvre d’abord l’écran d’Exécution.

L’ouverture de cet écran ne démarre pas immédiatement la première Activité.

L’utilisateur déclenche l’Exécution depuis l’écran lui-même. Le Compte à rebours initial est alors exécuté, s’il est configuré avec une durée supérieure à zéro, puis la première Activité commence.

Lorsque la Séance se termine, l’écran de synthèse est affiché. L’action `Terminer` ramène ensuite l’utilisateur au `Suivi`.

### Parcours de consultation du Suivi

Dans le MVP, le `Suivi` affiche la liste des Exécutions enregistrées.

La future `Vue d’ensemble` reste visible dans le sélecteur mais elle est grisée et inactive. Elle est prévue pour une version ultérieure.

La vue détaillée déployée d’une Exécution est également reportée à une version ultérieure.

### Écrans principaux

Les écrans principaux du MVP sont :

1. `Préférences` ;
2. `Catalogue de séances` ;
3. `Nouvelle séance — Nom et couleur` ;
4. `Composition d’une séance` ;
5. `Création / modification d’une Activité — Exercice` ;
6. `Création / modification d’une Activité — Récupération` ;
7. `Catégories de la séance` ;
8. `Calendrier` ;
9. `Planifier une séance` ;
10. `Exécution de séance`, incluant les états et commandes d’interruption ;
11. `Synthèse de séance` ;
12. `Suivi — Vue d’ensemble` (prévue en V2, visible mais inactive dans le MVP) ;
13. `Suivi — Séances`.

Les modales servent aux actions courtes réalisées sans quitter le contexte courant, notamment :

- confirmer l’abandon d’une création ;
- créer une Catégorie ;
- gérer les options d’une Activité, d’une Séance ou d’une Routine ;
- confirmer une suppression ;
- paramétrer le Compte à rebours initial et la Fin de séance ;
- gérer les interruptions pendant l’Exécution.

### Retour et fermeture

En dehors d’une Exécution en cours, revenir à l’écran précédent ne nécessite pas de confirmation lorsque les modifications ont déjà été enregistrées ou lorsqu’aucune donnée temporaire ne risque d’être perdue.

La modale `Abandonner la création d’une séance` ne concerne que la saisie initiale du nom et de la couleur avant création effective de la Séance.

Pendant une Exécution, aucune sortie directe vers la navigation principale n’est proposée. L’arrêt de la Séance est accessible uniquement après mise en pause.

### Conservation du contexte

L’application conserve autant que possible le contexte de l’utilisateur :

- la Séance précédemment consultée ;
- l’état déployé ou replié d’une carte tant que l’utilisateur reste dans la vue concernée ;
- l’Activité et la Série en cours pendant une Exécution ;
- la position dans le Suivi.

Après la fermeture d’une modale, l’utilisateur retrouve le contexte depuis lequel elle a été ouverte.

### Enregistrement automatique

Les modifications d’objets existants sont enregistrées automatiquement lorsque l’écran ne prévoit pas explicitement une action `Valider`, `Terminer` ou `Enregistrer`.

Les écrans de création ou les modales comportant une action explicite ne valident les données qu’après cette action.

### Navigation pendant une Exécution

Pendant l’Exécution, la navigation principale n’est pas affichée.

L’utilisateur dispose de trois commandes principales :

- `Réinitialiser l’activité` ;
- `Pause` ;
- `Activité suivante`.

Il n’existe pas de bouton `Quitter` ou `Arrêter` directement sur l’écran d’Exécution. L’action `Arrêter la séance` est accessible uniquement depuis la modale de pause.

L’utilisateur ne peut pas revenir à une Activité déjà exécutée.

### Cohérence des libellés

Les mêmes termes sont utilisés dans toute l’application :

- `Séance` : contenu complet d’un entraînement ;
- `Routine` : planification d’une Séance ;
- `Activité` : action élémentaire, de type Exercice ou Récupération ;
- `Exercice` : Activité physique ;
- `Récupération` : Activité de repos chronométrée ;
- `Série` : répétition propre à un Exercice ;
- `Set` : conteneur ordonné d’Activités, répété un nombre défini de fois ;
- `Cycle` : conteneur répétant le Set et pouvant contenir des Activités propres au Cycle ;
- `Exécution de séance` : réalisation effective d’une Séance.

Le terme `Set` n’est plus utilisé : il est remplacé par `Set` dans le vocabulaire visible et comme concept métier.

## Écran 1 – Préférences

![[Profil et préférences.png|405]]

### Objectif

Permettre à l’utilisateur de consulter les informations générales de son compte et de définir les préférences globales de l’application.

### Contenu

L’écran comporte notamment :

- l’identité ou l’avatar de l’utilisateur et l’action `Modifier le profil` ;
- `Sons` ;
- `Annonces vocales` ;
- `Vibrations` ;
- la durée par défaut du `Compte à rebours initial` ;
- la durée par défaut de la `Fin de séance` ;
- `Notifications` et rappels.

Les préférences de Compte à rebours initial et de Fin de séance servent de valeurs proposées lors de la création d’une nouvelle Séance. Elles restent modifiables au niveau de chaque Séance.

Le MVP est disponible uniquement en français. Aucun sélecteur de langue n’est affiché. L’architecture du produit doit néanmoins rester compatible avec une évolution multilingue.

### Comportement

Les modifications sont enregistrées immédiatement.

Les préférences ne modifient pas rétroactivement les Séances existantes ni une Exécution déjà en cours.

Les notifications sont activées par défaut, sous réserve de l’autorisation du système d’exploitation.

### Navigation

L’écran est accessible depuis l’onglet **Préférences** de la barre de navigation inférieure.

Il s’agit d’un onglet principal : aucun bouton `Retour` spécifique n’est nécessaire pour revenir à un autre onglet.

## Écran 2 – Catalogue des séances

![[Catalogue des séances.png|531]]

### Objectif

Permettre à l’utilisateur de consulter son Catalogue de Séances, de rechercher ou filtrer les Séances, de créer une nouvelle Séance et d’accéder rapidement à l’Exécution, à la consultation détaillée ou aux actions de gestion.

Cet écran constitue l’accueil de l’application.

### Recherche et filtres


Le MVP comporte :

- un champ de recherche ;
- les filtres `Toutes`, `Planifiées` et `Archivées`.

La recherche filtre la liste en temps réel sur le nom de la Séance. Les filtres peuvent être utilisés avec la recherche.

Le filtre `Toutes` affiche toutes les Séances actives, qu’elles soient planifiées ou non. Il **n’affiche pas les Séances archivées**. Les Séances archivées ne sont accessibles que via le filtre `Archivées`.

### Carte de Séance — vue condensée

Chaque carte affiche notamment :

- le nom de la Séance ;
- sa Catégorie lorsqu’elle existe ;
- le nombre d’Activités ;
- sa durée estimée ;
- le nombre de Sets et de Cycles ;
- la dernière Exécution lorsqu’elle existe ;
- la prochaine occurrence planifiée lorsqu’elle existe ;
- un chevron de déploiement ;
- le menu `⋯`.

Les Séances sont présentées par défaut selon leur dernière utilisation, de la plus récente à la plus ancienne. Pour une Séance jamais exécutée, la date de dernière modification est utilisée.

### Actions sur une carte

La carte distingue trois zones d’action :

- **zone principale de la carte** : ouvre l’écran d’Exécution de la Séance ;
- **chevron** : déploie ou replie la carte sans ouvrir l’Exécution ;
- **`⋯`** : ouvre le modal `Options d’une séance`.

La zone principale constitue une cible tactile large. Il n’est pas nécessaire d’afficher un bouton ou une icône `Ouvrir`.

### Carte de Séance — vue déployée


Le déploiement est facultatif et permet de consulter les Activités de la Séance sans changer d’écran.

La zone principale de la carte conserve la même action que dans la vue condensée : elle ouvre l’écran d’Exécution. Le chevron sert uniquement à déployer ou replier la carte et le menu `⋯` ouvre les options.

Aucun bouton `Ouvrir` n’est affiché dans la vue déployée.

Chaque ligne d’Activité présente :

- le nom de l’Activité à gauche ;
- un groupe compact aligné à droite sous la forme `durée/reps · xN`.

`xN` n’est affiché que lorsque le nombre de Séries est supérieur à 1. En mode Répétition, l’abréviation `reps` est utilisée.

Exemples : `12 reps · x3`, `45 s · x2` ou simplement `30 s` lorsque le nombre de Séries vaut 1.

### Création d’une Séance

Toucher `＋` ouvre l’écran `Nouvelle séance — Nom et couleur`.

La création suit ensuite le parcours défini dans la section de navigation générale.

Après `Enregistrer la séance` sur l’écran des Catégories, l’utilisateur revient directement au `Catalogue de séances`.

### Actions secondaires

Le menu `⋯` propose :

- `Modifier` ;
- `Dupliquer` ;
- `Planifier` ;
- `Archiver` ou `Restaurer` ;
- `Supprimer`.

`Modifier` ouvre toujours l’écran `Nom et couleur` prérempli, puis permet de poursuivre vers la Composition.

### Suppression d’une Séance

La suppression demande toujours une confirmation explicite.

Si des Routines utilisent la Séance, le message précise qu’elles seront également supprimées.

Après confirmation :

- la Séance est supprimée ;
- toutes les Routines qui la référencent sont supprimées ;
- les occurrences futures cessent d’être calculées ;
- les Exécutions déjà enregistrées restent conservées dans le Suivi grâce à leur Instantané.

### Archivage

L’archivage retire la Séance de la liste principale.

Si la Séance est utilisée par une ou plusieurs Routines, celles-ci sont supprimées après confirmation.

La restauration d’une Séance archivée ne restaure aucune ancienne Routine.

### Séance vide

Le MVP ne comporte pas de statut `Brouillon`.

Une Séance existe dès validation de son nom et de sa couleur.

Tant qu’elle ne contient aucun Exercice :

- elle peut être modifiée, archivée ou supprimée ;
- elle ne peut pas être exécutée.

### État vide

Si aucune Séance n’a encore été créée, l’écran présente une action principale permettant de créer la première Séance.

## Écran 3 – Nouvelle séance : nom et couleur

![[Nouvelle séance - Nom.png]]

### Objectif

Créer l’identité minimale d’une Séance avant d’accéder à sa Composition, ou modifier cette identité pour une Séance existante.

### Contenu et comportement

L’écran comporte :

- un champ obligatoire `Nom de la séance` ;
- un sélecteur de couleur composé d’une palette prédéfinie de 16 couleurs ;
- l’action `Continuer`.

Aucune couleur n’est présélectionnée lors de la création.

`Continuer` reste désactivé tant que le nom ou la couleur ne sont pas valides.

En création, la validation crée la Séance puis ouvre `Composition d’une séance`.

En modification, les valeurs actuelles sont préremplies. La validation enregistre le nom et la couleur puis ouvre la Composition.

### Retour

Avant la création effective de la Séance, si l’utilisateur a commencé à saisir ou sélectionner des informations puis demande à quitter l’écran, la modale `Abandonner la création d’une séance` est affichée.

Lorsqu’une Séance existe déjà, le retour n’entraîne pas sa suppression.

## Écran 4 – Composition d’une séance

![[Nouvelle séance - Etat initial et liste d'activités.png]]

### Objectif

Permettre à l’utilisateur de définir la structure et l’ordre d’Exécution d’une Séance.

L’écran de Composition ne lance pas directement l’Exécution.

### Structure affichée

La Composition est présentée comme une structure hiérarchique ordonnée et non comme un parcours de type niveaux.

Elle comprend dans le MVP :

- un `Compte à rebours initial` ;
- un `Cycle` unique ;
- un `Set` unique dans le Cycle ;
- les Activités du Set ;
- les éventuelles Activités propres au Cycle ;
- les éventuelles Activités de fin de Séance ;
- une `Fin de séance`.

Le Compte à rebours initial et la Fin de séance sont des éléments structurels obligatoires et ne constituent pas des Activités.

Le Cycle et le Set peuvent être déployés ou repliés pour faciliter la lecture.

### En-tête

L’en-tête affiche notamment :

- le nom de la Séance ;
- le nombre d’Activités ;
- la durée estimée.

Le nom et la couleur ne sont pas modifiés directement depuis cet écran. Le bouton Retour ramène à l’écran `Nom et couleur`.

### Paramètres du Set et du Cycle


Le Cycle et le Set possèdent chacun un nombre de répétitions supérieur ou égal à 1.

Dans l’interface, le nombre est affiché sous la forme d’un contrôle compact `xN`, placé immédiatement à droite de l’intitulé `Cycle` ou `Set`. Les anciens boutons `+ / −` ne sont pas utilisés.

Un appui sur le contrôle `xN` ouvre un picker / une roulette permettant de sélectionner le nombre de répétitions.

Le libellé `Set` utilise la même hiérarchie typographique que `Cycle`. Le fond du Set est visuellement distingué du fond du Cycle afin de rendre la hiérarchie claire.

À chaque répétition du Cycle, le Set est exécuté selon son propre nombre de répétitions, puis les éventuelles Activités propres au Cycle sont exécutées.

### Ajout d’une Activité


Un seul bouton `＋` d’ajout d’Activité est affiché dans l’écran de Composition. Il est placé à droite du résumé indiquant le nombre d’Activités et la durée totale estimée.

Aucun bouton `＋` intermédiaire n’est affiché dans le Set, dans le Cycle ou entre les Activités.

Un appui sur `＋` ouvre l’écran de création d’Activité, dans lequel l’utilisateur choisit le type `Exercice` ou `Récupération`.

La nouvelle Activité est insérée directement après la dernière Activité existante de la Composition. L’utilisateur peut ensuite modifier sa position manuellement par glisser-déposer.

Le MVP ne propose pas de menu d’ajout rapide `Pause 15 s / 30 s / 45 s`.

Aucune Récupération explicite n’est ajoutée implicitement par l’application. La seule exception est la matérialisation technique d’une pause après Série configurée sur un Exercice.

Si deux Exercices s’enchaînent sans pause après Série ni Activité de type Récupération, un avertissement discret et non bloquant est affiché.

### Consultation et modification d’une Activité

Toucher une Activité ouvre le modal `Options de l’activité`.

Ce modal permet de :

- Modifier ;
- Dupliquer ;
- Supprimer.

`Modifier` ouvre le parcours de modification correspondant au type d’Activité.

### Réorganisation

Les Activités peuvent être réorganisées par glisser-déposer dans les zones où leur déplacement est autorisé.

Le Cycle, le Set, le Compte à rebours initial et la Fin de séance restent des éléments structurels fixes dans le MVP.

### Validation de la Composition

L’écran ne comporte pas de bouton `Démarrer`.

L’action `Valider les modifications` valide la Composition.

En création, elle ouvre l’écran `Catégories de la séance`.

En modification d’une Séance existante, le parcours de validation conserve les catégories existantes et permet, le cas échéant, de les revoir conformément au flux Figma.

La Séance n’est exécutable que si elle contient au moins un Exercice valide.

### Enregistrement

Les modifications internes sont conservées au fur et à mesure, sous réserve des validations explicites prévues par les écrans d’édition.

## Écran 5 – Création / modification d’une Activité (Exercice)

![[Nouvelle activité - Exercice.png]]

### Objectif

Permettre à l’utilisateur de créer ou modifier une Activité de type `Exercice`.

La saisie se déroule en deux étapes :

1. paramètres essentiels ;
2. informations complémentaires facultatives.

### Ouverture

L’écran est ouvert lorsque l’utilisateur :

- ajoute un Exercice depuis la Composition ;
- choisit `Modifier` sur une Activité de type Exercice.

Le retour ramène à la Composition.

### Étape 1 — Paramètres essentiels

L’écran comporte notamment :

- Type d’Activité ;
- Nom ;
- Mode d’Exécution ;
- paramètres de la Série ;
- bouton `Valider`.

Le nom est obligatoire.

### Mode d’Exécution

L’utilisateur choisit entre :

- `Durée` ;
- `Répétition`.

En mode `Durée`, les paramètres comportent :

- minutes ;
- secondes ;
- pause après Série ;
- nombre de Séries.

En mode `Répétition`, la durée est remplacée par le nombre de répétitions. La pause et le nombre de Séries restent disponibles.

Le nombre de Séries est toujours supérieur ou égal à 1. Pour tout nouvel Exercice, sa valeur par défaut est `1`.

Une Série correspond à l’Exécution de la durée ou du nombre de répétitions défini pour l’Exercice, suivie de sa pause éventuelle.

La pause est exécutée après chaque Série. Après la dernière Série, elle est omise lorsque l’étape suivante du plan d’Exécution est une Récupération explicite.

### Étape 2 — Informations complémentaires

L’écran comporte :

- `Consigne` ;
- `Zones corporelles` ;
- bouton `Terminer`.

La Consigne et les Zones corporelles sont facultatives.

Les Zones corporelles sont sélectionnées dans un référentiel prédéfini. Elles ne sont ni créées, ni renommées, ni supprimées par l’utilisateur dans le MVP.

`Terminer` enregistre l’Activité puis revient à la Composition.

### Modification d’une Activité

Lorsqu’un Exercice existant est modifié, ses valeurs sont préremplies.

Les Exécutions déjà historisées ne sont jamais modifiées.

## Écran 6 – Création / modification d’une Activité (Récupération)

![[Nouvelle activité - Récupération.png|305]]

### Objectif

Permettre de créer ou modifier une Activité de type `Récupération`.

### Contenu


L’écran comporte :

- le type `Récupération` ;
- `Nom` ;
- `Durée` ;
- bouton `Valider`.

Le nom proposé par défaut est `Récupération`. Il peut être modifié par l’utilisateur.

Une Récupération est toujours chronométrée. Elle ne propose pas de mode Répétition ni de fin manuelle : sa fin temporelle est automatique.

Elle ne possède pas de Zones corporelles.

`Valider` enregistre l’Activité puis revient à la Composition.

### Validation

L’action de validation enregistre l’Activité et revient à la Composition.

L’utilisateur peut utiliser la commande `Activité suivante` avant la fin d’une Récupération. Après confirmation, la Récupération est enregistrée avec le statut `Partielle` selon les règles générales des Activités chronométrées.

### Modification et actions secondaires

La modification utilise le même écran avec les valeurs préremplies.

La duplication et la suppression sont accessibles depuis le modal `Options de l’activité`.

## Écran 7 – Catégories de la séance

![[Nouvelle séance - Entrer une catégorie.png|314]]

### Objectif

Permettre d’associer zéro, une ou plusieurs Catégories à une Séance.

Les Catégories facilitent l’organisation, la recherche et le filtrage. Elles n’ont aucun impact sur l’Exécution.

### Contenu et comportement

- les Catégories sont proposées sous forme de tags sélectionnables ;
- la sélection est multiple ;
- aucune Catégorie n’est obligatoire ;
- `+ Créer une catégorie` ouvre la modale de création ;
- `Enregistrer la séance` enregistre la sélection et ramène directement au `Catalogue de séances`.

Aucune proposition intermédiaire `Exécuter maintenant / Planifier / Retour Catalogue` n’est affichée.

## Écran 8 – Calendrier

![[Calendrier des routines.png|577]]

### Objectif

Permettre à l’utilisateur de visualiser les Routines planifiées, de naviguer dans le calendrier et d’accéder rapidement à leur gestion.

### Ouverture

L’écran est accessible depuis l’onglet `Calendrier`.

### Contenu


L’écran affiche :

- un calendrier ;
- uniquement les occurrences futures calculées à partir des Routines ;
- pour chaque occurrence : la Séance, sa couleur, la date / heure et le menu `⋯` ;
- le bouton `+ Planifier une séance`.

Le libellé `À faire` n’est pas affiché.

Le calendrier reste fixe pendant le défilement ; seule la liste des occurrences située sous le calendrier défile.

### Comportement


Le menu `⋯` d’une occurrence ouvre les actions disponibles sur cette occurrence.

Une occurrence future peut être exécutée en avance via `⋯` → `Exécuter maintenant`.

Lorsqu’une occurrence future est exécutée en avance, elle est considérée exécutée pour cette occurrence et n’est plus proposée à son horaire initial.

Lorsqu’une occurrence planifiée arrive à échéance sans avoir été exécutée, elle disparaît de l’interface. Elle n’est pas affichée dans le Suivi du MVP.

La suppression ou modification d’une Routine agit sur les occurrences futures conformément aux règles de planification.

## Écran 9 – Planifier une séance

![[Planifier une séance.png|305]]

### Objectif

Créer ou modifier une Routine, c’est-à-dire la planification d’une Séance.

### Ouverture

L’écran est accessible :

- depuis `Calendrier > + Planifier une séance` ;
- depuis `Modifier la planification` sur une Routine existante ;
- depuis `Planifier` dans les options d’une Séance.

### Paramètres

La planification comporte :

- la Séance associée ;
- la date de début ;
- l’heure ;
- le mode de répétition ;
- les paramètres de périodicité lorsque nécessaire ;
- une date de fin lorsque nécessaire ;
- le rappel ;
- le bouton `Enregistrer`.

### Modes de planification

Le MVP propose :

- `Sans répétition` : une seule occurrence ;
- `Hebdomadaire` : répétition selon une fréquence en semaines et un ou plusieurs jours de la semaine.

Il n’existe pas de mode `Quotidien` distinct. Une planification hebdomadaire sélectionnant les sept jours équivaut à une exécution quotidienne.

En mode hebdomadaire :

- la fréquence est un entier supérieur ou égal à 1 ;
- un ou plusieurs jours sont sélectionnés ;
- la date de fin est obligatoire.

Dans l’interface, la répétition est présentée de manière compacte avec `Toutes les`, puis `X semaine(s) jusqu’au <date>`, et les jours sélectionnés en dessous. Aucun niveau de titre `Quand ?` n’est affiché ; `Date de début` et `Heure` sont des libellés de blocs au même niveau visuel.

Une Routine ne possède qu’une seule heure d’Exécution. Si l’utilisateur souhaite plusieurs horaires pour une même Séance, il crée plusieurs Routines distinctes.

### Validation

`Enregistrer` crée ou met à jour la Routine.

Les occurrences futures sont recalculées à partir de la nouvelle planification. Les occurrences déjà historisées ne sont pas modifiées.

## Écran 10 – Exécution de séance

![[Exécution d'une séance.png|245]]

### Objectif

Guider l’utilisateur pendant l’Exécution avec une hiérarchie visuelle adaptée à une lecture rapide et à distance.

Un seul layout standard est utilisé pour les Activités en Durée, en Répétition et pour les Récupérations. Le comportement temporel s’adapte au type d’Activité sans changer la structure générale de l’écran ni les commandes principales.

### Entrée dans l’écran et démarrage

L’écran peut être ouvert :

- depuis la zone principale d’une carte du Catalogue ;
- depuis une occurrence planifiée ; pour une occurrence future exécutée en avance, l’accès se fait explicitement via `⋯` → `Exécuter maintenant`.

L’ouverture de l’écran ne démarre pas immédiatement l’Activité.

Avant le démarrage, l’utilisateur déclenche la Séance depuis la commande centrale.

Le Compte à rebours initial est alors exécuté s’il est configuré avec une durée supérieure à zéro, puis la première Activité commence.

### Hiérarchie des informations affichées

L’écran affiche, de haut en bas :

- le nom de la Séance ;
- l’état des sons / annonces vocales ;
- le nom de l’Activité en cours ;
- le compteur de Série lorsque l’Activité est un Exercice ;
- l’indicateur temporel principal ;
- la progression `Set x/y • Cycle x/y` ;
- la zone `À suivre` avec le nom et la durée ou le nombre de reps de l’Activité suivante ;
- les commandes `Réinitialiser`, `Pause` et `Activité suivante` ;
- le temps total écoulé et la durée totale estimée de la Séance ;
- une barre de progression temporelle globale.

Le nombre total d’étapes et la position sous la forme `x sur y` ne sont pas affichés dans le MVP.

Le moteur d’Exécution peut néanmoins conserver ces informations pour son fonctionnement interne.

### Activité définie par une durée


Pour un Exercice ou une Récupération chronométrée, le temps est présenté sous forme de compte à rebours.

Lorsque le compte à rebours atteint zéro, l’Activité se termine normalement et l’Exécution passe à la suite.

Si l’utilisateur appuie sur `Activité suivante` avant zéro, une confirmation est demandée. Après confirmation, l’Activité est enregistrée avec le statut métier `Partielle` et l’Exécution continue.

### Activité définie par un nombre de répétitions


Pour un Exercice défini par un nombre de répétitions, l’écran conserve le même layout que pour un Exercice chronométré.

Le temps actif est affiché par un chronomètre croissant à partir de `00:00`. Il n’existe pas de durée cible.

Le cercle du minuteur effectue un tour complet par minute :

- un tour = 60 secondes ;
- à `01:00`, il recommence un nouveau tour ;
- le chronomètre continue à croître (`01:01`, `01:02`, etc.).

Un bip est émis à chaque minute écoulée. Dans le MVP, ce bip est fixe et non paramétrable.

`Pause` suspend le chronomètre et la rotation du cercle. `Reprendre` les relance depuis l’état exact où ils ont été suspendus.

L’utilisateur termine normalement l’Exercice avec `Activité suivante`. Cette action ne crée pas une Activité Partielle : elle valide la fin normale de l’Exercice en mode Répétition.

### Séries

Lorsqu’un Exercice possède plusieurs Séries :

- `Série x/y` indique la Série en cours ;
- chaque Série exécute la durée ou les répétitions de l’Exercice ;
- la pause après Série est appliquée selon la définition de l’Exercice ;
- après la dernière Série, la pause technique est omise si l’élément suivant est déjà une Récupération explicite.

### Récupération

Une Récupération est toujours chronométrée et se termine automatiquement à zéro.

Elle utilise le même écran standard.

La zone `À suivre` permet de préparer l’Activité suivante.

### Commandes principales

Les trois commandes restent identiques quel que soit le type d’Activité :

- `Réinitialiser l’activité` ;
- `Pause` ;
- `Activité suivante`.

Leur position et leur rôle visuel ne changent pas entre Durée et Répétition.

### Réinitialiser l’Activité

L’action ouvre la modale de confirmation.

Après confirmation :

- la Série / Activité courante recommence depuis son état initial ;
- pour une Activité chronométrée, le compte à rebours retrouve sa durée initiale ;
- pour une Activité en Répétition, le chronomètre d’Activité revient à `00:00` ;
- la cible de répétitions n’est pas modifiée ;
- le temps total déjà écoulé dans la Séance reste conservé ;
- le Set et le Cycle courants restent inchangés.

### Mise en pause

Toucher `Pause` suspend immédiatement l’Exécution et ouvre la modale `Séance en pause`.

La pause suspend :

- le compte à rebours ou le chronomètre d’Activité ;
- l’enchaînement automatique ;
- le temps actif ;
- les bips et annonces liés à la progression ;
- les animations de progression.

La modale propose :

- `Reprendre la séance` ;
- `Arrêter la séance`.

`Reprendre la séance` restaure l’état exact de l’Activité.

`Arrêter la séance` termine l’Exécution avec le statut `Interrompue` puis ouvre la Synthèse.

Il n’existe pas de commande directe d’arrêt depuis l’écran principal d’Exécution.

### Activité suivante

Le comportement dépend du type d’Activité :

- **Exercice en Répétition** : termine normalement l’Exercice et passe à la suite ;
- **Activité chronométrée avant zéro** : ouvre la modale de confirmation ; après confirmation, l’Activité est enregistrée avec le statut `Partielle`, puis l’Exécution continue ;
- **Activité chronométrée arrivée à zéro** : la transition est automatique.

### Navigation pendant l’Exécution

L’ordre d’Exécution est déterminé par le Plan d’Exécution.

L’utilisateur ne peut pas sélectionner librement une autre Activité ni revenir à une Activité déjà terminée.

### Guidage sonore

Au début d’une Activité, son nom peut être annoncé vocalement selon les Préférences.

Pour les Activités chronométrées, les signaux sonores de fin de compte à rebours sont appliqués conformément aux règles métier définies pour le MVP.

Pour un Exercice en Répétition, aucun signal de fin de compte à rebours n’est utilisé puisqu’il n’existe pas de temps cible. Un bip fixe est toutefois émis à chaque minute écoulée dans le MVP.

### Arrière-plan et verrouillage

Si l’application passe en arrière-plan ou si l’écran se verrouille :

- l’état de l’Exécution est conservé ;
- le temps est recalculé à partir des horodatages de référence plutôt qu’à partir d’un simple comptage de ticks ;
- l’utilisateur retrouve l’état déterministe de l’Activité à son retour ;
- les sons et annonces sont maintenus dans la mesure permise par iOS et Android.

Le comportement précis fait l’objet du spike technique prévu avant le développement complet du moteur d’Exécution.

### Fin de l’Exécution

Lorsque le Plan d’Exécution arrive à son terme, l’Exécution est enregistrée et l’écran `Synthèse de séance` est affiché.

La Séance source et la Routine éventuelle ne sont jamais modifiées par l’Exécution.

## Écran 11 – Synthèse de séance

![[Exécution d'une séance - Synthèse de séance.png|292]]

### Objectif

Présenter un bilan immédiatement compréhensible et recueillir le ressenti obligatoire avant de quitter l’écran.

### Contenu

L’écran affiche notamment :

- le nom de la Séance ;
- le statut de l’Exécution ;
- la durée réellement exécutée ;
- le nombre d’Activités réalisées ;
- le nombre d’Activités partielles, uniquement s’il est supérieur à zéro ;
- le choix du ressenti ;
- un champ `Commentaire` facultatif ;
- le bouton `Terminer`.

Les Sets et Cycles ne sont pas affichés dans la Synthèse du MVP.

Aucun parcours détaillé des Activités n’est affiché sur cet écran dans le MVP.

### Statut

Une Exécution terminant normalement son Plan peut être `Terminée` ou `Partielle` selon les Activités réellement réalisées.

Une Exécution arrêtée volontairement depuis la modale de pause est enregistrée avec le statut `Interrompue`.

### Ressenti

Le ressenti est obligatoire.

Le MVP propose trois niveaux, conformément au wireframe.

Le bouton `Terminer` reste désactivé tant qu’aucun ressenti n’a été sélectionné.

### Commentaire

Le `Commentaire` est facultatif.

Il est enregistré avec l’Exécution.

### Navigation

`Terminer` enregistre le ressenti et le Commentaire puis ouvre le `Suivi`.

Aucune action `Relancer la séance` n’est prévue dans le MVP.

## Écran 12 – Suivi : Vue d’ensemble (V2)

![[Suivi - Vue d'ensemble.png|307]]

### Objectif

Présenter à terme des indicateurs synthétiques de progression et d’activité.

Cette vue n’est pas fonctionnelle dans le MVP.

### Présence dans le MVP

Le sélecteur du Suivi affiche :

- `Vue d’ensemble`, grisée et inactive ;
- `Séances`, active.

La présence de l’onglet prépare la compréhension de l’évolution future sans rendre la fonctionnalité accessible.

## Écran 13 – Suivi : Séances

![[Suivi - Séances.png|492]]

### Objectif


Permettre à l’utilisateur de consulter les Exécutions de séance enregistrées, de les rechercher, filtrer et trier.

Les occurrences planifiées non exécutées ne sont pas affichées dans le Suivi du MVP.

### Contenu

L’écran comporte :

- le sélecteur `Vue d’ensemble / Séances`, avec `Vue d’ensemble` grisée et inactive dans le MVP ;
- un champ de recherche ;
- le bouton `Filtrer` ;
- une liste chronologique des Exécutions.

La vue détaillée déployée d’une Exécution est reportée à une version ultérieure. Aucun contrôle `Déployer tout / Replier tout` n’est affiché dans le MVP.

### Carte d’Exécution

Chaque carte affiche au minimum :

- le nom de la Séance exécutée ;
- sa couleur issue de l’Instantané ;
- la date et l’heure ;
- la durée réelle ;
- le statut `Terminée`, `Partielle` ou `Interrompue` ;
- le ressenti lorsqu’il a été renseigné.

### Recherche

La recherche filtre immédiatement la liste.

Elle porte sur les informations définies pour le Suivi dans la spécification fonctionnelle, notamment le nom de la Séance et les attributs indexés prévus pour le MVP.

### Filtrage

Le modal de filtrage permet de combiner les critères prévus pour le MVP :

- Catégories ;
- Zones corporelles ;
- période ;
- statut.

`Réinitialiser` supprime les filtres actifs.  
`Appliquer` ferme le modal et actualise la liste.

### Tri

Une seule règle de tri est active à la fois.

Les tris disponibles sont :

- Plus récentes ;
- Plus anciennes ;
- Nom ;
- Durée.

Par défaut, les Exécutions sont triées de la plus récente à la plus ancienne.

### État vide

Si aucune Exécution ne correspond aux critères, l’écran affiche un message et permet de réinitialiser les filtres.

Si aucune Exécution n’existe encore, l’écran invite l’utilisateur à revenir vers `Mes séances`.

## Les modales

### Modal – Abandonner la création d’une séance

![[Modal - Nouvelle séance - Abandonner la création.png|286]]

#### Objectif

Éviter la perte accidentelle des informations saisies sur l’écran initial `Nouvelle séance — Nom et couleur`.

#### Ouverture


La modale s’affiche depuis l’écran `Nouvelle séance — Nom et couleur` lorsque l’utilisateur appuie sur Retour pendant une création en cours.

Depuis la Composition d’une nouvelle Séance, Retour ramène d’abord à l’écran `Nom et couleur` avec les valeurs déjà saisies. L’utilisateur peut alors modifier le nom ou la couleur, utiliser `Continuer` pour retrouver la Composition dans l’état où il l’avait laissée, ou appuyer de nouveau sur Retour pour ouvrir la modale d’abandon.

L’écran `Nouvelle séance — Nom et couleur` reste visible en arrière-plan, assombri et non interactif.

#### Contenu

**Titre**

> Abandonner la création ?

**Message**

> Les informations saisies seront perdues et la séance ne sera pas créée.

**Actions**

- `Continuer la création`
- `Abandonner`

#### Comportement


`Continuer la création` ferme la modale et conserve intégralement la création en cours.

`Abandonner` supprime la nouvelle Séance et tout son contenu déjà saisi, puis revient au `Catalogue de séances`.

Ce comportement concerne uniquement le parcours de création. Pour une Séance existante ouverte en modification, Retour ne supprime jamais la Séance.

### Modal – Création d’une Catégorie

![[Modal - Nouvelle catégorie.png|316]]

#### Objectif

Permettre de créer une Catégorie sans quitter l’écran `Catégories de la séance`.

#### Contenu et validation

La modale comporte :

- `Nouvelle catégorie` ;
- un champ obligatoire `Nom de la catégorie` ;
- `Annuler` ;
- `Créer`.

Le bouton `Créer` reste désactivé tant que le nom est vide.

Après validation :

- la Catégorie est créée ;
- elle est ajoutée au référentiel ;
- elle est automatiquement sélectionnée pour la Séance en cours ;
- la modale se ferme.

Le nom comporte de 1 à 50 caractères et ne peut pas dupliquer un nom existant sans tenir compte de la casse.

### Modal – Options de l’Activité

![[Nouvelle séance - Option d'activité.png|379]]

#### Contenu

Le modal affiche le nom de l’Activité et les actions :

- `Modifier` ;
- `Dupliquer` ;
- `Supprimer` ;
- `Annuler`.

#### Comportement

`Modifier` ouvre l’écran de modification correspondant au type de l’Activité.

`Dupliquer` crée une copie immédiatement sous l’Activité d’origine avec tous ses paramètres, notamment :

- nom ;
- type ;
- durée ou répétitions ;
- nombre de Séries ;
- pause après Série ;
- Consigne ;
- Zones corporelles, le cas échéant.

`Supprimer` retire l’Activité de la Séance. La suppression de la dernière Activité est autorisée ; la Séance devient alors non exécutable jusqu’à l’ajout d’un nouvel Exercice.

### Modal – Options d’une Séance

![[Modal - Catalogue des séances - Options.png]]

#### Objectif

Donner accès aux actions de gestion sans surcharger les cartes du Catalogue.

#### Contenu

Les actions proposées sont :

- `Modifier` ;
- `Dupliquer` ;
- `Planifier` ;
- `Archiver` ou `Restaurer` ;
- `Supprimer` ;
- `Annuler`.

#### Modifier

Ouvre l’écran `Nouvelle séance — Nom et couleur` avec les valeurs de la Séance préremplies.

Après validation, l’utilisateur poursuit vers la Composition.

#### Dupliquer

Crée une copie indépendante comprenant :

- nom, avec le comportement de suffixe défini par les règles produit ;
- couleur ;
- Catégories ;
- structure du Cycle et du Set ;
- Activités ;
- paramètres d’Exécution.

#### Planifier

Ouvre le parcours `Planifier une séance` pour créer une Routine liée à cette Séance.

#### Archiver / Restaurer

L’archivage retire la Séance de la liste principale.

Les Routines associées sont supprimées après confirmation. Les occurrences historisées et les Exécutions existantes sont conservées.

Restaurer la Séance ne restaure pas ses anciennes Routines.

#### Supprimer

Demande toujours une confirmation explicite.

La suppression de la Séance ne supprime jamais les Exécutions historiques.

### Modal – Options d’une Routine

![[Modal - Options d'une routine.png]]

#### Objectif

Permettre de modifier ou supprimer rapidement une Routine planifiée.

#### Contenu


Le modal propose, selon le contexte :

- `Exécuter maintenant` pour une occurrence future ;
- `Modifier la planification` ;
- `Supprimer la routine` ;
- `Annuler`.

`Exécuter maintenant` ouvre l’écran d’Exécution pour l’occurrence sélectionnée. Si cette occurrence est exécutée en avance, elle est considérée exécutée et n’est plus reproposée à son horaire initial.

`Modifier la planification` ouvre `Planifier une séance` avec les paramètres préremplis.

`Supprimer la routine` ouvre la modale de confirmation.

### Modal – Confirmer la suppression d’une Routine

![[Modal - Confirmation de la suppression d'une routine.png]]

#### Objectif

Demander une confirmation explicite avant suppression d’une Routine.

#### Comportement

Après confirmation :

- la Routine est supprimée ;
- aucune nouvelle occurrence future n’est générée ;
- les occurrences déjà historisées sont conservées ;
- les Exécutions déjà enregistrées sont conservées ;
- la Séance associée n’est pas supprimée.

### Modal – Réinitialisation de l’Activité

![[Modal - Exécution d'une séance - Réinitialiser l'activité.png|243]]

#### Objectif

Permettre de recommencer l’Activité / Série en cours depuis son état initial sans revenir en arrière dans la Séance.

#### Ouverture

La modale s’affiche après appui sur `Réinitialiser l’activité`.

L’Exécution est suspendue pendant l’affichage de la modale.

#### Comportement

Après confirmation :

- l’Activité / Série courante reste l’Activité courante ;
- une Activité chronométrée retrouve sa durée initiale ;
- un Exercice en Répétition retrouve un chronomètre d’Activité à `00:00` ;
- la cible de répétitions reste inchangée ;
- le temps global déjà écoulé dans la Séance est conservé ;
- le Set et le Cycle restent inchangés ;
- l’Activité redémarre selon son comportement normal.

`Annuler` ferme la modale et reprend l’Activité à son état précédent.

### Modal – Passage à l’Activité suivante

![[Modal - Exécution d'une séance - Passer à l'activité suivante.png|276]]

#### Objectif

Confirmer l’interruption anticipée d’une Activité chronométrée.

#### Ouverture

Cette modale s’affiche lorsque l’utilisateur appuie sur `Activité suivante` avant la fin d’une Activité chronométrée.

Elle ne s’affiche pas pour un Exercice en mode Répétition : dans ce cas, `Activité suivante` constitue la validation normale de la fin de l’Exercice.

#### Contenu


**Titre**

> Passer à l’activité suivante ?

**Message**

> La séance continuera avec l’activité suivante. L’activité en cours sera enregistrée comme Partielle.

#### Comportement


Après confirmation :

- l’Activité chronométrée est arrêtée avant son terme ;
- sa durée réellement exécutée est conservée ;
- son statut métier devient `Partielle` ;
- la progression est mise à jour ;
- l’Activité suivante démarre selon les règles normales du Plan d’Exécution.

`Annuler` ferme la modale et reprend l’Activité en cours.

### Modal – Pause / arrêt de l’Exécution

![[Modal - Exécution d'une séance - Pause ou Arrêt de la séance.png|260]]

#### Objectif

Suspendre temporairement une Exécution puis permettre soit de la reprendre, soit de l’arrêter.

#### Ouverture

La modale est affichée après appui sur `Pause`.

L’Exécution est immédiatement suspendue.

#### Contenu

**Titre**

> Séance en pause

**Actions**

- `Reprendre la séance`
- `Arrêter la séance`

#### Reprendre la séance

Ferme la modale et reprend l’Activité à l’état exact où elle a été suspendue.

Pour une Activité chronométrée, le compte à rebours reprend.  
Pour un Exercice en Répétition, le chronomètre croissant reprend.

#### Arrêter la séance

Met fin à l’Exécution :

- la progression réellement effectuée est enregistrée ;
- le statut de l’Exécution devient `Interrompue` ;
- l’écran `Synthèse de séance` est affiché.

La modale ne peut être fermée que par l’une des deux actions prévues.

### Modal – Paramétrer le Compte à rebours initial

![[Modal - Nouvelle séance - Compte à rebours initial.png|349]]

#### Objectif

Permettre de personnaliser le Compte à rebours initial sans quitter la Composition.

Le Compte à rebours initial est un élément structurel obligatoire et ne constitue pas une Activité.

#### Contenu

La modale comporte :

- `Nom` ;
- `Durée` ;
- `Texte vocal`.

Les valeurs initiales proviennent des Préférences.

Une durée de `0 s` rend l’élément instantané sans le supprimer de la structure.

`Enregistrer` applique les modifications.  
`Annuler` ferme la modale sans les appliquer.

### Modal – Paramétrer la Fin de séance

![[Modal - Nouvelle séance - Fin de séance.png|395]]

#### Objectif

Permettre de personnaliser la Fin de séance sans quitter la Composition.

La Fin de séance est un élément structurel obligatoire et ne constitue pas une Activité.

#### Contenu

La modale comporte :

- `Nom` ;
- `Durée` ;
- `Texte vocal`.

Les valeurs initiales proviennent des Préférences.

Une durée de `0 s` rend l’élément instantané sans le supprimer de la structure.

`Enregistrer` applique les modifications.  
`Annuler` ferme la modale sans les appliquer.
