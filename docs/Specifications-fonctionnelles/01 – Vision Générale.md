# Vision générale de KODJO

## L’idée en une phrase

KODJO est une application mobile qui permet à une personne de créer, organiser, planifier, exécuter et suivre ses séances grâce à un guidage visuel, sonore et vocal.

## Identité du produit

- **KODJO** est le nom du produit et de l’application.
- **ANKUSHA** est la société propriétaire, la marque mère et l’éditeur de KODJO.
- Le slogan produit est **Keep On. Do Just One.**
- Le splash affiche `KODJO`, `Keep On. Do Just One.` et `Votre assistant du quotidien` avant d’ouvrir le Catalogue des séances.

## Le problème rencontré

Les exercices et séances sont souvent communiqués oralement, sur papier, par message ou en vidéo. Ils sont difficiles à retrouver, à organiser dans un ordre précis, à planifier et à exécuter sans mobiliser plusieurs outils. Pendant une activité, l’utilisateur ne peut pas toujours regarder son téléphone. Il manque enfin d’une vision simple de ce qu’il a réellement effectué.

## La réponse proposée

KODJO réunit dans une même application :

- un Catalogue des séances ;
- la création et la modification de Séances structurées ;
- un calendrier et la planification individuelle ;
- une Exécution guidée, adaptée aux Activités chronométrées, en Répétitions ou À l’échec ;
- des signaux sonores, des annonces vocales et des vibrations fonctionnelles configurables ;
- un Suivi des Exécutions terminées, partielles ou interrompues ;
- des Préférences globales simples.

## Utilisateur prioritaire du MVP

Le MVP s’adresse en priorité à une personne qui crée ses propres Séances, les planifie, les exécute et consulte leur historique sur son appareil.

Il fonctionne :

- sans compte utilisateur obligatoire ;
- sans synchronisation entre appareils ;
- sans partage avec un professionnel ou un groupe ;
- uniquement en français à l’écran.

L’architecture textuelle repose néanmoins sur un lexique centralisé et des clés de traduction, afin de pouvoir modifier un terme partout dans l’application et ajouter ultérieurement d’autres langues sans réécrire les écrans.

## Périmètre fonctionnel du MVP

### Catalogue des séances

Le Catalogue des séances est l’écran d’accueil après le splash. Il permet de rechercher une Séance, d’ouvrir sa carte en modification, de la planifier, de la dupliquer ou de l’archiver. Une Séance active ne peut pas être supprimée directement : elle doit d’abord être archivée. Depuis la liste des Séances archivées, elle peut être restaurée ou supprimée après confirmation.

### Création et composition

La création est réalisée dans un écran unique `Composition d’une séance`. Une Séance possède obligatoirement un nom et une couleur choisie dans une palette prédéfinie de 12 couleurs. Elle devient validable lorsqu’elle contient au moins un Exercice valide.

Une Séance contient :

1. un Compte à rebours initial ;
2. des Activités éventuellement placées avant le Tour ;
3. un Tour unique, visible et répétable de 1 à 99 fois ;
4. des Activités éventuellement placées après le Tour ;
5. une Fin de séance.

Le Cycle est conservé uniquement dans le modèle technique pour l’évolutivité. Dans le MVP, sa répétition vaut toujours 1, n’est pas modifiable et n’est jamais affichée à l’utilisateur.

Une Activité est une action exécutée en mode Durée, Répétitions ou À l’échec. Elle comprend au moins une Série, peut inclure une Pause uniquement entre les Séries d’un même côté et une Récupération chronométrée facultative. Cette Récupération intervient une fois après tous les côtés d’une Activité autonome, ou une fois par passage de côté dans un Tour bilatéral. `Récupération` n’est plus un type d’Activité distinct.

En mode Durée, le nombre entier de Séries et la Durée totale de l’Activité sont des contrôles dépendants. La Durée totale inclut les Séries, les Pauses intermédiaires, le multiplicateur de côté éventuel et la Récupération finale. T04 est révisée pour exécuter les Séries, les Tours et leurs passages bilatéraux conformément au Plan d’Exécution.

Les valeurs initiales de l’application sont de 10 secondes pour le Compte à rebours initial et de 5 secondes pour la Fin de séance. L’utilisateur peut choisir 0 seconde, ce qui rend la phase instantanée sans la supprimer du modèle.

### Planification et calendrier

Une Séance peut être planifiée une seule fois ou périodiquement. Le Calendrier propose les vues Jour, Semaine et Mois dans le MVP. Les rappels sont facultatifs. La demande d’autorisation système des notifications n’est déclenchée que lorsque l’utilisateur active pour la première fois un rappel pendant une planification.

### Exécution guidée

L’Exécution présente l’Activité en cours, la Série, le Tour, l’Activité suivante, le temps et la progression. Le Cycle n’est jamais exposé.

L’Exécution continue à progresser lorsque l’application passe en arrière-plan ou que l’écran se verrouille. Au retour, l’état est recalculé à partir d’horodatages de référence. Une pause de sécurité intervient après 30 minutes sans interaction au-delà de la fin théorique d’une Activité chronométrée, ou après 2 heures sans interaction pour un Exercice en Répétitions ou À l’échec.

### Suivi

Le Suivi conserve les Exécutions terminées, partielles et interrompues. Chaque Exécution repose sur un instantané immuable de la Séance au démarrage afin que l’historique demeure fidèle après une modification, un archivage ou une suppression de la Séance source.

Les commandes `Vue d’ensemble`, `Filtrer` et `Trier` sont visibles mais désactivées dans le MVP ; leurs fonctions sont prévues après le MVP.

### Profil et Préférences

Le Profil MVP permet de gérer une photo et un nom d’affichage. Les Préférences sont : Sons, Annonces vocales, Vibration, Compte à rebours initial, Fin de séance et Notifications.

Les Sons, les Annonces vocales et les Vibrations fonctionnelles sont indépendants. Le feedback haptique léger des roulettes numériques reste systématique dans le MVP et n’est pas piloté par le réglage `Vibration`.

## Principes d’expérience

- interface mobile en portrait, compatible avec les Safe Areas du système ;
- navigation principale fixe : `Séances`, `Calendrier`, `Suivi`, `Profil` ;
- libellé affiché uniquement sous l’onglet actif ;
- actions contextuelles cohérentes entre les listes ;
- sauvegarde immédiate des Préférences ;
- confirmation explicite avant toute suppression définitive ou abandon de création ;
- vocabulaire fonctionnel uniforme dans tous les écrans.

## Ambition après le MVP

KODJO a vocation à devenir un assistant personnel de planification et de suivi pour la rééducation, la mobilité, l’activité physique, la santé quotidienne et les habitudes personnelles.

Les évolutions envisagées comprennent notamment :

- comptes, synchronisation et sauvegarde distante ;
- partage de Séances et groupes ;
- interface destinée aux professionnels ;
- ajout de `0..n` photos ou vidéos ordonnées par Activité ;
- statistiques, filtres et tableaux de bord ;
- connexions à des calendriers et services de santé ;
- prise en charge de langues supplémentaires.

Ces perspectives orientent l’architecture, mais ne doivent pas être présentées comme des fonctions disponibles dans le MVP.

## Cible fonctionnelle confirmée

### Catalogue multi-type

Le Catalogue constitue l’accès central aux contenus. Il distingue `Activités`, `Séances` et `Circuits`. Dans le MVP, seule la vue `Séances` est active ; les deux autres types sont visibles mais désactivés. En V2, les vues Activités et Circuits deviennent fonctionnelles sans créer de navigation principale supplémentaire.

### Catalogue des Activités — MVP T03

La tranche MVP T03 apporte un Catalogue d’Activités persistantes. Le Catalogue des Activités permet de créer, consulter, modifier et exécuter directement une Activité de référence. Dès T03, depuis la Composition d’une Séance, l’utilisateur peut également sélectionner plusieurs Activités existantes ; chacune est copiée dans la Séance et devient indépendante de sa référence.

Une Activité créée uniquement dans une Séance ne rejoint pas automatiquement la bibliothèque. Les médias multiples ordonnés appartiennent également à la V2, mais leur affichage par déploiement de carte reste une évolution distincte à détailler.

L’Exécution directe réutilise le moteur commun avec une origine `ACTIVITY`, commence par une préparation standard de `5 s`, n’ajoute ni Séance artificielle ni phase `SESSION_END`, puis affiche une Synthèse avec Ressenti obligatoire. Le Suivi identifie cette Exécution comme une Activité et applique les statistiques compatibles sans compter une Séance.

### Circuits — V2 et V3

La V2 permet de créer et d’exécuter manuellement des Circuits persistants composés de Séances ordonnées. Leur planification appartient à la V3.

## Vision de la bilatéralité

La configuration permet de choisir une exécution unilatérale, droite puis gauche, ou gauche puis droite sur une Activité autonome ou sur un Tour. Un Tour bilatéral porte seul la direction effective de son contenu : toutes ses Activités sont présentées avec leur contrôle unilatéral désactivé. L’Exécution rend le côté courant explicite sans alourdir la progression, au moyen du sous-titre `Côté droit` ou `Côté gauche` sous le nom de l’Activité. Les résultats restent distinguables par côté et l’historique demeure fondé sur un instantané immuable.
