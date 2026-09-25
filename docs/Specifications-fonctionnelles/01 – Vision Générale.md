# Vision générale de KODJO

## L’idée en une phrase

KODJO est une application mobile qui permet à une personne de créer, organiser, planifier, exécuter et suivre ses séances grâce à un guidage visuel, sonore et vocal.

## Identité du produit

- **KODJO** est le nom du produit et de l’application.
- **ANKUSHA** est la société propriétaire, la marque mère et l’éditeur de KODJO.
- Le slogan produit est **Keep On. Do Just One.**
- Le splash affiche `KODJO`, `Keep On. Do Just One.` et `Votre assistant du quotidien` avant d’ouvrir le `Catalogue des séances`, segment `Séances` du Catalogue.

## Le problème rencontré

Les exercices et séances sont souvent communiqués oralement, sur papier, par message ou en vidéo. Ils sont difficiles à retrouver, à organiser dans un ordre précis, à planifier et à exécuter sans mobiliser plusieurs outils. Pendant une activité, l’utilisateur ne peut pas toujours regarder son téléphone. Il manque enfin d’une vision simple de ce qu’il a réellement effectué.

## La réponse proposée

KODJO réunit dans une même application :

La classification est dissociée : une **Étiquette** qualifie la Séance et porte sa couleur ; une **Catégorie** qualifie l’Activité et porte sa couleur. Les Zones corporelles restent une information distincte de l’Activité.

- un espace `Catalogues` pour les contenus ;
- la création et la modification de Séances structurées ;
- à partir de T03, un Catalogue des exercices persistantes et leur Exécution directe ;
- un calendrier et la planification individuelle ;
- une Exécution guidée, adaptée aux Exercices chronométrées, en Répétitions ou À l’échec ;
- des signaux sonores, des annonces vocales et des vibrations fonctionnelles configurables ;
- un Suivi des Exécutions terminées, partielles ou interrompues ;
- des Préférences globales simples.

## Utilisateur prioritaire du MVP

Le MVP s’adresse en priorité à une personne qui crée ses propres Séances et Exercices, planifie directement ses Séances **ou ses Exercices**, les exécute et consulte leur historique sur son appareil.

Il fonctionne :

- sans compte utilisateur obligatoire ;
- sans synchronisation entre appareils ;
- sans partage avec un professionnel ou un groupe ;
- uniquement en français à l’écran.

L’architecture textuelle repose néanmoins sur un lexique centralisé et des clés de traduction, afin de pouvoir modifier un terme partout dans l’application et ajouter ultérieurement d’autres langues sans réécrire les écrans.

## Périmètre fonctionnel du MVP

### Catalogue des séances

Le `Catalogue des séances` est l’état par défaut de l’espace `Catalogues` après le splash et après une relance complète. Il permet de rechercher une Séance, d’ouvrir sa carte en modification, de la planifier, de la dupliquer ou de l’archiver. Une Séance active ne peut pas être supprimée directement : elle doit d’abord être archivée. Depuis la liste des Séances archivées, elle peut être restaurée ou supprimée après confirmation.

### Catalogue des exercices — T03

T03 rend le segment `Exercices` fonctionnel. Il permet de créer, consulter, modifier, archiver, restaurer et supprimer définitivement une Activité persistante, de l’ajouter à une Séance par copie indépendante, de l’exécuter directement **et de la planifier directement** au même titre qu’une Séance. Le segment `Parcours` reste visible mais désactivé.

Une Activité créée uniquement dans une Séance ne rejoint pas automatiquement le Catalogue. Une Exécution directe d’Activité utilise l’origine `ACTIVITY`, un instantané autonome et une préparation fixe de `5 s`, sans Séance artificielle ni `SESSION_END`.

### Création et composition

La création est réalisée dans un écran unique `Composition d’une séance`. Une Séance possède obligatoirement un nom et une couleur choisie dans une palette prédéfinie de 12 couleurs. Elle devient validable lorsqu’elle contient au moins un Exercice valide.

Une Séance contient :

1. un Compte à rebours initial ;
2. des Exercices éventuellement placées avant le Tour ;
3. un Tour unique, visible et répétable de 1 à 99 fois ;
4. des Exercices éventuellement placées après le Tour ;
5. une Fin de séance.

Une Activité peut également porter son propre Compte à rebours et sa propre Fin d’activité. La Composition peut contenir un Point d’arrêt déplaçable ; son attente n’est pas comptabilisée dans la durée d’exécution.

Le Cycle est conservé uniquement dans le modèle technique pour l’évolutivité. Dans le MVP, sa répétition vaut toujours 1, n’est pas modifiable et n’est jamais affichée à l’utilisateur.

Une Activité est une action exécutée en mode Durée, Répétitions ou À l’échec. Elle comprend au moins une Série, peut inclure une Pause selon la règle D-156 et une Récupération chronométrée facultative. Cette Récupération intervient une fois après tous les côtés de l’Activité. `Récupération` n’est plus un type d’Activité distinct.

En mode Durée, le nombre entier de Séries et la Durée totale de l’Activité sont des contrôles dépendants. La Durée totale inclut les Séries, les Pauses applicables, le multiplicateur de côté éventuel et la Récupération finale. Dans le texte éditable, le mode Répétitions affiche `Durée totale >= {estimation}` en comptant conventionnellement 1 seconde par répétition, puis les Pauses, la Récupération et la bilatéralité selon les règles existantes. En mode À l’échec, la Durée totale n’est pas affichée dans le texte éditable. T04 porte l’orchestration complète d’Exécution des Séances, y compris Séries, Tours et passages bilatéraux conformément au Plan d’Exécution.

Les valeurs initiales de l’application sont de 10 secondes pour le Compte à rebours initial et de 5 secondes pour la Fin de séance. L’utilisateur peut choisir 0 seconde, ce qui rend la phase instantanée sans la supprimer du modèle. Ces deux cartes structurelles ne sont pas déplaçables.

### Planification et calendrier

Une Séance peut être planifiée une seule fois ou périodiquement. Le Calendrier propose les vues Jour, Semaine et Mois dans le MVP. Les rappels sont facultatifs. La demande d’autorisation système des notifications n’est déclenchée que lorsque l’utilisateur active pour la première fois un rappel pendant une planification.

### Exécution guidée

L’Exécution d’une Séance présente l’Activité en cours, la Série, le Tour, l’Activité suivante, le temps et la progression. Le Cycle n’est jamais exposé.

L’Exécution continue à progresser lorsque l’application passe en arrière-plan ou que l’écran se verrouille. Au retour, l’état est recalculé à partir d’horodatages de référence. Une pause de sécurité intervient après 30 minutes sans interaction au-delà de la fin théorique d’une Activité chronométrée, ou après 2 heures sans interaction pour un Exercice en Répétitions ou À l’échec.

### Suivi

Le Suivi conserve les Exécutions terminées, partielles et interrompues. Chaque Exécution repose sur un instantané immuable de sa source au démarrage afin que l’historique demeure fidèle après une modification, un archivage ou une suppression de la source.

Les commandes `Vue d’ensemble`, `Filtrer` et `Trier` sont visibles mais désactivées dans le MVP ; leurs fonctions sont prévues après le MVP.

### Profil et Préférences

Le Profil MVP permet de gérer une photo et un nom d’affichage. Les Préférences sont : Sons, Annonces vocales, Vibration, Compte à rebours initial, Fin de séance et Notifications.

Les Sons, les Annonces vocales et les Vibrations fonctionnelles sont indépendants. Le feedback haptique léger des roulettes numériques reste systématique dans le MVP et n’est pas piloté par le réglage `Vibration`.

## Principes d’expérience

- interface mobile en portrait, compatible avec les Safe Areas du système ;
- navigation principale fixe : `Catalogues`, `Calendrier`, `Suivi`, `Profil` ;
- l’espace `Catalogues` utilise les titres contextuels `Catalogue des séances`, `Catalogue des exercices` et `Catalogue des parcours` ;
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

Le Catalogue constitue l’accès central aux contenus. Il distingue `Exercices`, `Séances` et `Parcours`. `Séances` est sélectionné par défaut à l’ouverture initiale et après relance complète ; `Exercices` est fonctionnel à partir de T03 ; `Parcours` reste visible mais désactivé. Une version post-MVP rendra les Parcours fonctionnels sans créer de destination principale supplémentaire.

### Catalogue des exercices — MVP T03

La tranche MVP T03 apporte un Catalogue d’Exercices persistantes. Le Catalogue des exercices permet de créer, consulter, modifier, archiver/restaurer et exécuter directement une Activité de référence. Dès T03, depuis la Composition d’une Séance, l’utilisateur peut également sélectionner plusieurs Exercices existantes ; chacune est copiée dans la Séance et devient indépendante de sa référence.

Une Activité créée uniquement dans une Séance ne rejoint pas automatiquement le Catalogue. Cette capacité locale reste conservée mais n’est pas exposée dans le parcours courant de composition, qui propose la sélection depuis le Catalogue. Dans le MVP, une carte d’Activité du Catalogue peut être déployée pour afficher le média associé ; cette activation n’ajoute pas implicitement de nouveau mécanisme d’import ou de capture.

L’Exécution directe réutilise le sous-ensemble moteur autonome avec une origine `ACTIVITY`, commence par une préparation standard de `5 s`, n’ajoute ni Séance artificielle ni phase `SESSION_END`, puis affiche une Synthèse avec Ressenti obligatoire. Le Suivi identifie cette Exécution comme une Activité et applique les statistiques compatibles sans compter une Séance.

### Parcours — post-MVP

Les Parcours restent préparés conceptuellement et techniquement mais ne sont ni créables ni exécutables dans T03. Leur planification appartient à une évolution ultérieure distincte.

## Vision de la bilatéralité

La configuration permet de choisir `Aucun`, droite puis gauche, ou gauche puis droite sur une Activité. Dans la version actuelle, le changement de côté n’est pas exposé au niveau du Tour ; le Tour reste fonctionnellement `UNILATERAL`. L’Exécution rend le côté courant explicite sans alourdir la progression, au moyen du sous-titre `Côté droit` ou `Côté gauche` sous le nom de l’Activité. Les résultats restent distinguables par côté et l’historique demeure fondé sur un instantané immuable.

## Vision cible — médias pendant l’Exécution

La cible post-MVP permet de consulter les médias de l’Exercice sans quitter l’Exécution ni interrompre son moteur. L’utilisateur peut retourner la zone d’information vers une face Média, parcourir une galerie ordonnée, lancer une vidéo à la demande et ouvrir le média en plein écran. Le plein écran conserve un cadre flottant de suivi et de commande de l’Exécution.

Cette cible est conçue mais n’est pas ajoutée au périmètre MVP courant sans décision de roadmap distincte. Voir `../CONCEPTION-EXECUTION-MEDIA.md`.
