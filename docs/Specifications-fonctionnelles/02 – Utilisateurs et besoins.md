# Utilisateurs et besoins

## Objectif du chapitre

Ce chapitre décrit les utilisateurs visés, leurs problèmes et leurs besoins. Il sépare explicitement l’utilisateur prioritaire du MVP des profils et usages envisagés après le MVP.

## 1. Utilisateur individuel — cible du MVP

### Profil

Une personne qui souhaite créer, planifier, exécuter et suivre seule des Séances concernant notamment :

- l’activité physique ou la mobilité ;
- la rééducation ;
- la préparation ou la récupération sportive ;
- la santé quotidienne ;
- des habitudes nécessitant un enchaînement, un calendrier ou un minuteur.

### Problèmes rencontrés

- Les consignes sont dispersées entre la mémoire, des notes, des messages et différents médias.
- Plusieurs outils sont nécessaires pour organiser, planifier, chronométrer et suivre une séance.
- Il est difficile de respecter un ordre d’exécution, des durées, des répétitions, des Séries et des temps de récupération.
- Pendant une activité, l’utilisateur ne peut pas toujours regarder l’écran.
- Les séances planifiées peuvent être oubliées.
- L’utilisateur dispose de peu de visibilité sur ce qu’il a réellement exécuté.
- Une modification de la Séance peut rendre son historique difficile à comprendre.

### Besoins couverts dans le MVP

#### Retrouver et gérer ses Séances

- Arriver dans le Catalogue des séances après le splash.
- Rechercher une Séance.
- Ouvrir une carte directement en mode modification.
- Planifier, dupliquer ou archiver une Séance active.
- Consulter les Séances archivées, les restaurer ou les supprimer après confirmation.
- Ne jamais supprimer directement une Séance non archivée ; elle doit d’abord être archivée, puis supprimée depuis le résultat du filtre `Archivées`.
- Comprendre l’état vide du Catalogue et pouvoir créer sa première Séance.

#### Créer une Séance

- Saisir le nom et choisir une couleur dans le même écran de Composition.
- Choisir parmi 12 couleurs prédéfinies, avec une couleur initialement proposée.
- Ajouter des Activités et définir, si nécessaire, une Récupération après l’ensemble de leurs Séries.
- Définir un Exercice par une Durée, un nombre de Répétitions ou jusqu’à l’échec.
- Définir le nombre de Séries, une Pause éventuelle entre les Séries et une Récupération facultative après l’Exercice.
- Saisir soit le nombre de Séries, soit une Durée totale cible, puis comprendre immédiatement la valeur entière recalculée par l’application.
- Organiser les Activités avant le Tour, dans le Tour ou après le Tour.
- Répéter le Tour de 1 à 99 fois et régler sa direction sur la même ligne que le nombre de Tours, sans titre de côté visible.
- Voir la direction propre d’une Activité bilatérale sur sa carte et dans sa synthèse, sans répétition lorsque la direction est portée par un Tour bilatéral.
- Ne confirmer l’activation bilatérale d’un Tour que si elle remplace le réglage bilatéral propre d’au moins une Activité.
- Réordonner manuellement les Activités par glisser-déposer.
- Régler le Compte à rebours initial et la Fin de séance.
- Associer facultativement plusieurs Catégories et Zones corporelles compatibles.
- Ne pouvoir continuer qu’après avoir renseigné un nom, une couleur et au moins un Exercice valide.
- Pouvoir abandonner explicitement une création commencée.

Le Cycle technique n’est ni manipulé ni affiché dans le MVP.

#### Planifier une Séance

- Visualiser le Calendrier en vues Jour, Semaine et Mois.
- Créer une planification unique ou périodique.
- Définir la date, l’heure, la fréquence, les jours concernés et la date de fin selon le type de planification.
- Configurer zéro ou un rappel.
- N’être sollicité pour l’autorisation système des notifications qu’au moment de la première activation d’un rappel.
- Conserver l’accès à la planification même si les notifications sont refusées, le rappel restant alors désactivé.

#### Exécuter une Séance

- Démarrer une Séance depuis son contexte de consultation ou depuis une occurrence planifiée.
- Être guidé visuellement, par des sons et par des annonces vocales.
- Voir l’Activité en cours, la Série, le Tour, l’Activité suivante, le temps et la progression.
- Mettre l’Exécution en pause, reprendre, réinitialiser l’Activité courante ou passer à l’Activité suivante.
- Terminer normalement chaque Série d’un Exercice en Répétitions ou À l’échec avec `Suivant`.
- Être averti avant de quitter une Activité chronométrée non terminée, qui devient alors `Partielle` après confirmation.
- Continuer l’Exécution lorsque l’application est en arrière-plan ou l’écran verrouillé.
- Retrouver un état temporel recalculé au retour.
- Être protégé contre une Exécution laissée sans interaction trop longtemps.

#### Suivre ses réalisations

- Enregistrer chaque Exécution avec son statut `Terminée`, `Partielle` ou `Interrompue`.
- Sélectionner un ressenti obligatoire sur l’écran de Synthèse.
- Ajouter facultativement un commentaire de 200 caractères maximum.
- Retrouver le nom, la date, l’heure, la durée, le statut et le détail disponible de chaque Exécution.
- Conserver un historique fidèle même après modification ou suppression de la Séance source.
- Voir les commandes futures `Vue d’ensemble`, `Filtrer` et `Trier`, clairement désactivées dans le MVP.

#### Régler l’application

- Modifier séparément Sons, Annonces vocales et Vibration.
- Définir les valeurs globales du Compte à rebours initial et de la Fin de séance pour les nouvelles Séances.
- Comprendre que le feedback haptique des roulettes reste indépendant de `Vibration`.
- Modifier la photo et le nom d’affichage du Profil.
- Retrouver une interface en français, cohérente et compatible avec les Safe Areas du téléphone.

## 2. Utilisateur accompagné — pris en compte pour l’évolution

### Profil

Une personne à laquelle un kinésithérapeute, un coach, un professionnel de santé ou un autre accompagnant transmet une Séance à réaliser de manière autonome.

### Besoins futurs

- Recevoir ou copier une Séance préparée par un tiers.
- Retrouver des consignes et éventuellement un média associé à chaque Activité.
- Partager volontairement certaines informations d’Exécution.
- Comprendre les versions successives d’une Séance.

Ces fonctions de réception et de partage ne font pas partie du MVP.

## 3. Professionnel — profil post-MVP

### Profil

Un professionnel qui prépare, transmet et fait évoluer des Séances destinées aux personnes qu’il accompagne.

### Besoins futurs

- Créer des modèles et réutiliser des Activités ou des Séances.
- Associer un média à une Activité.
- Transmettre et mettre à jour une Séance.
- Consulter uniquement les informations que l’utilisateur a accepté de partager.
- Distinguer les versions successives et leurs Exécutions.
- Gérer plusieurs personnes sans mélanger leurs informations.

Aucune interface professionnelle spécifique n’est incluse dans le MVP.

## 4. Groupe et partage — périmètre post-MVP

Les fonctions suivantes sont envisagées après le MVP :

- créer ou rejoindre un groupe ;
- partager une Séance ;
- définir les droits de consultation et de modification ;
- conserver une Exécution et un Suivi individuels ;
- choisir les informations visibles par les autres membres ;
- quitter un groupe et, si la règle future le permet, conserver une copie indépendante.

Les comptes, la synchronisation, les autorisations de partage et la confidentialité associée devront être spécifiés avant leur développement.

## 5. Besoins transverses

- Une interface simple, visuelle et utilisable d’une seule main lorsque le contexte le permet.
- Des cibles tactiles suffisantes et le respect des Safe Areas système.
- Un vocabulaire cohérent : Séance, Activité, Exercice, Récupération, Série, Tour, Routine, Exécution.
- Un guidage compréhensible sans consultation permanente de l’écran.
- Des actions destructives explicites et confirmées.
- Une distinction claire entre la Séance, sa planification sous forme de Routine et chaque Exécution réelle.
- Une sauvegarde locale fiable et un historique immuable.
- Un lexique centralisé permettant de modifier un terme partout et d’ajouter d’autres langues ultérieurement.
- Une évolution possible vers les médias, la synchronisation, le partage et les statistiques sans les confondre avec le périmètre MVP.

## 6. Critère de réussite du MVP

Une personne seule doit pouvoir, sans compte et sans aide professionnelle :

1. créer une Séance exécutable ;
2. la retrouver et la modifier ;
3. la planifier avec ou sans rappel ;
4. l’exécuter avec un guidage adapté ;
5. enregistrer son ressenti ;
6. retrouver une trace fidèle de l’Exécution dans le Suivi.

## 7. Questions reportées après le MVP

- Quelles fonctions nécessiteront un compte ou une synchronisation distante ?
- Comment partager une Séance tout en maîtrisant les droits et la confidentialité ?
- Comment gérer les versions lorsqu’une Séance partagée évolue ?
- Quelles limites techniques de taille, de durée et de formats appliquer aux médias multiples en V2 ?
- Quelles statistiques et quels filtres apporteront une valeur réelle ?
- Quelles intégrations calendrier, santé ou sport seront prioritaires ?
- Quelles langues seront proposées après le français ?

## 8. Besoins validés pour les évolutions

- Créer en V2 une Activité de référence indépendamment d’une Séance, avec sa Pause et sa Récupération éventuelles.
- Ajouter cette référence à plusieurs Séances sous forme de copies indépendantes qui n’encombrent pas le catalogue.
- Associer `0..n` photos ou vidéos à une Activité, les réordonner et les consulter hors ligne.
- Créer en V2 un Circuit d’au moins deux Séances, l’ordonner et l’exécuter manuellement.
- Planifier les Circuits seulement en V3.
- Exécuter dès le MVP un Exercice `À l’échec` avec le même geste `Suivant` que le mode Répétitions.
- Configurer une Activité ou un Tour en unilatéral, droite-gauche ou gauche-droite, sans créer de zones corporelles latéralisées.
- Comprendre le côté courant pendant l’Exécution grâce au sous-titre `Côté droit` ou `Côté gauche`, sans compteur supplémentaire.
- Conserver séparément les résultats du côté droit et du côté gauche, y compris lorsqu’un seul côté est partiellement réalisé.
- Activer la bilatéralité d’un Tour après confirmation ; toutes ses Activités héritent alors du Tour et leur contrôle propre devient unilatéral désactivé.
