# Utilisateurs et besoins

## Composition — actualisation du 28/10/2026

Le besoin de répéter une mobilisation avec plusieurs blocs est couvert par un exercice directement membre du cycle, sans imposer un circuit artificiel. Le besoin de séance simple reste couvert sans conteneur. Voir [Composition du 28/10](../KODJO-Composition-conteneurs-2026-10-28.md).

## Sommaire

- [Objectif du chapitre](#objectif-du-chapitre)
- [1. Utilisateur individuel — cible du MVP](#1-utilisateur-individuel--cible-du-mvp)
  - [Profil](#profil)
  - [Besoins couverts dans le MVP](#besoins-couverts-dans-le-mvp)
- [2. Utilisateur accompagné — pris en compte pour l’évolution](#2-utilisateur-accompagné--pris-en-compte-pour-lévolution)
  - [Profil](#profil-1)
  - [Besoins futurs](#besoins-futurs)
- [3. Professionnel — profil post-MVP](#3-professionnel--profil-post-mvp)
  - [Profil](#profil-2)
  - [Besoins futurs](#besoins-futurs-1)
- [4. Groupe et partage — périmètre post-MVP](#4-groupe-et-partage--périmètre-post-mvp)
- [5. Besoins transverses](#5-besoins-transverses)
- [6. Critère de réussite du MVP](#6-critère-de-réussite-du-mvp)
- [7. Questions reportées après le MVP](#7-questions-reportées-après-le-mvp)
- [8. Besoins validés pour les évolutions](#8-besoins-validés-pour-les-évolutions)
- [9. Besoins MVP T03 — Catalogue des Exercices et Exécution directe](#9-besoins-mvp-t03--catalogue-des-exercices-et-exécution-directe)
- [Besoin cible — consulter un média sans perdre l’Exécution](#besoin-cible--consulter-un-média-sans-perdre-lexécution)
- [Besoins consolidés](#besoins-consolidés)
- [Besoin de rythme reproductible](#besoin-de-rythme-reproductible)
- [Conception de planification](#conception-de-planification)
- [Besoins couverts par les formats](#besoins-couverts-par-les-formats)

## Objectif du chapitre

Ce chapitre décrit les utilisateurs visés, leurs problèmes et leurs besoins. Il sépare explicitement l’utilisateur prioritaire du MVP des profils et usages envisagés après le MVP.

## 1. Utilisateur individuel — cible du MVP

### Profil

Une personne qui souhaite créer, planifier, exécuter et suivre seule des Séances concernant notamment :

- l’exercice physique ou la mobilité ;
- la rééducation ;
- la préparation ou la récupération sportive ;
- la santé quotidienne ;
- des habitudes nécessitant un enchaînement, un calendrier ou un minuteur.

### Besoins couverts dans le MVP

#### Retrouver et gérer ses Séances

- **B-001** — Arriver dans le Catalogue des séances après le splash.
- **B-002** — Ouvrir une carte directement en mode modification.
- **B-003** — Planifier, dupliquer ou archiver une Séance active.
- **B-004** — Consulter les Séances archivées, les restaurer ou les supprimer après confirmation.
- **B-005** — Ne jamais supprimer directement une Séance non archivée ; elle doit d’abord être archivée, puis supprimée depuis le résultat du filtre `Archivées`.
- **B-006** — Comprendre l’état vide du Catalogue et pouvoir créer sa première Séance.

#### Créer une Séance

- **B-007** — Saisir le nom et choisir une couleur dans le même écran de Composition.
- **B-008** — Choisir parmi 12 couleurs prédéfinies, avec une couleur initialement proposée.
- **B-009** — Ajouter des Exercices ; aucune **Récupération après exercice** n’est créée automatiquement ; elle se place explicitement, avec une valeur proposée au moment de l’ajout.
- **B-010** — Définir un Exercice par une Durée, un nombre de Répétitions ou jusqu’à l’échec.
- **B-011** — Définir le nombre de Séries et une Pause éventuelle entre les Séries ; pour un Exercice bilatéral, régler séparément la **Pause entre les côtés**.
- **B-012** — Saisir soit le nombre de Séries, soit une Durée totale cible, puis comprendre immédiatement la valeur entière recalculée par l’application.
- **B-013** — Organiser les Exercices avant le Circuit, dans le Circuit ou après le Circuit.
- **B-014** — Exécuter le Circuit de 1 à 99 Tours ; aucun changement de côté n’est exposé au niveau du Circuit dans la version actuelle.
- **B-015** — Régler le `Changement de côté` propre à un Exercice sur `Avec` ou `Sans`, sans désignation du côté de départ, puis voir ce changement de côté sur sa carte et dans sa synthèse (D-406, D-407).
- **B-016** — Réordonner manuellement les Exercices par glisser-déposer ; leur Récupération après exercice se déplace avec l’occurrence sans recalcul.
- **B-017** — Régler le Compte à rebours initial et la Fin de séance.
- **B-018** — Régler, lorsqu’ils sont utilisés, le Compte à rebours propre et la Fin propre d’un Exercice.
- **B-019** — Insérer et déplacer un Point d’arrêt dans la Composition ; son attente ne doit pas augmenter la durée de la Séance.
- **B-020** — Associer une Étiquette à la Séance et une Catégorie aux Exercices ; sélectionner séparément les Zones corporelles des Exercices ; gérer les trois référentiels. Un appui long sur une Étiquette, une Catégorie ou une Zone corporelle permet d’en demander la suppression après confirmation, y compris pour une valeur initialement fournie par KODJO.
- **B-021** — Ne pouvoir continuer qu’après avoir renseigné un nom, une couleur et au moins un Exercice valide.
- **B-022** — Pouvoir abandonner explicitement une création commencée.

Le cycle visible contient des circuits et des exercices directs et répète sa séquence de 1 à 99 fois, défaut 1 ; aucun cycle technique implicite (D-451, RM-252).

#### Décomposer un exercice en phases

Décrire plusieurs actions successives, par exemple 6 s puis 3 s, au sein d’un même exercice et les rejouer à chaque série. Le MVP permet jusqu’à six phases nommées, sans multiplier les exercices dans le catalogue ou les lignes dans la séance. Le guidage annonce l’action courante selon la préférence vocale.

#### Planifier une Séance ou un Exercice

- **B-023** — Visualiser le Calendrier en vues Jour, Semaine et Mois.
- **B-024** — Créer une planification unique ou périodique pour une Séance ou un Exercice persistant du Catalogue des exercices.
- **B-025** — Définir la date, l’heure, la fréquence, les jours concernés et la date de fin selon le type de planification.
- **B-026** — Configurer zéro ou un rappel.
- **B-027** — N’être sollicité pour l’autorisation système des notifications qu’au moment de la première activation d’un rappel.
- **B-028** — Conserver l’accès à la planification même si les notifications sont refusées, le rappel restant alors désactivé.

#### Exécuter une Séance

- **B-029** — Démarrer une Séance depuis son contexte de consultation ou depuis une occurrence planifiée.
- **B-030** — Être guidé visuellement, par des sons et par des annonces vocales.
- **B-031** — Voir l’Exercice en cours, la Série, le Tour, l’Exercice suivant, le temps et la progression.
- **B-032** — Mettre l’Exécution en pause, reprendre, réinitialiser l’Exercice courant ou passer à l’Exercice suivant.
- **B-033** — Terminer normalement chaque Série d’un Exercice en Répétitions ou À l’échec avec `Suivant`.
- **B-034** — Être averti avant de quitter un Exercice chronométré non terminé, qui devient alors `Partielle` après confirmation.
- **B-035** — Continuer l’Exécution lorsque l’application est en arrière-plan ou l’écran verrouillé.
- **B-036** — Retrouver un état temporel recalculé au retour.
- **B-037** — Être protégé contre une Exécution laissée sans interaction trop longtemps.

#### Suivre ses réalisations

- **B-038** — Enregistrer chaque Exécution avec son statut `Terminée`, `Partielle` ou `Interrompue`.
- **B-039** — Sélectionner un ressenti obligatoire sur l’écran de Synthèse.
- **B-040** — Ajouter facultativement un commentaire de 200 caractères maximum.
- **B-041** — Retrouver le nom, la date, l’heure, la durée, le statut et le détail disponible de chaque Exécution.
- **B-042** — Conserver un historique fidèle même après modification ou suppression de la Séance source.
- **B-043** — Voir les commandes futures `Vue d’ensemble`, `Filtrer` et `Trier`, clairement désactivées dans le MVP.

#### Régler l’application

- **B-044** — Modifier séparément Sons, Annonces vocales et Vibration.
- **B-045** — Définir les valeurs globales du Compte à rebours initial et de la Fin de séance pour les nouvelles Séances.
- **B-046** — Comprendre que le feedback haptique des roulettes reste indépendant de `Vibration`.
- **B-047** — Modifier la photo et le nom d’affichage du Profil.
- **B-048** — Retrouver une interface en français, cohérente et compatible avec les Safe Areas du téléphone.

## 2. Utilisateur accompagné — pris en compte pour l’évolution

### Profil

Une personne à laquelle un kinésithérapeute, un coach, un professionnel de santé ou un autre accompagnant transmet une Séance à réaliser de manière autonome.

### Besoins futurs

- **B-049** — Recevoir ou copier une Séance préparée par un tiers.
- **B-050** — Retrouver des consignes et éventuellement un média associé à chaque Exercice.
- **B-051** — Partager volontairement certaines informations d’Exécution.
- **B-052** — Comprendre les versions successives d’une Séance.

Ces fonctions de réception et de partage ne font pas partie du MVP.

## 3. Professionnel — profil post-MVP

### Profil

Un professionnel qui prépare, transmet et fait évoluer des Séances destinées aux personnes qu’il accompagne.

### Besoins futurs

- **B-053** — Créer des modèles et réutiliser des Exercices ou des Séances.
- **B-054** — Associer un média à un Exercice.
- **B-055** — Transmettre et mettre à jour une Séance.
- **B-056** — Consulter uniquement les informations que l’utilisateur a accepté de partager.
- **B-057** — Distinguer les versions successives et leurs Exécutions.
- **B-058** — Gérer plusieurs personnes sans mélanger leurs informations.

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

- **B-059** — Une interface simple, visuelle et utilisable d’une seule main lorsque le contexte le permet.
- **B-060** — Des cibles tactiles suffisantes et le respect des Safe Areas système.
- **B-061** — Un vocabulaire cohérent : Séance, Exercice, Exercice, Récupération, Série, Tour, Routine, Exécution.
- **B-062** — Un guidage compréhensible sans consultation permanente de l’écran.
- **B-063** — Des actions destructives explicites et confirmées.
- **B-064** — Une distinction claire entre la Séance, sa planification sous forme de Routine et chaque Exécution réelle.
- **B-065** — Une sauvegarde locale fiable et un historique immuable.
- **B-066** — Un lexique centralisé permettant de modifier un terme partout et d’ajouter d’autres langues ultérieurement.
- **B-067** — Une évolution possible vers les médias, la synchronisation, le partage et les statistiques sans les confondre avec le périmètre MVP.

## 6. Critère de réussite du MVP

Une personne seule doit pouvoir, sans compte et sans aide professionnelle :

1. créer une Séance exécutable ;
2. la retrouver et la modifier ;
3. la planifier avec ou sans rappel ;
4. l’exécuter avec un guidage adapté ;
5. enregistrer son ressenti ;
6. retrouver une trace fidèle de l’Exécution dans le Suivi.

**Question à clarifier pour PRE-3 (D-333) :** sources système d’import, formats acceptés et éventuelles limites de taille/durée des photos et vidéos locales. Ces éléments ne sont plus reportés automatiquement après le MVP ; aucun seuil arbitraire n’est décidé ici.

## 7. Questions reportées après le MVP

- Quelles fonctions nécessiteront un compte ou une synchronisation distante ?
- Comment partager une Séance tout en maîtrisant les droits et la confidentialité ?
- Comment gérer les versions lorsqu’une Séance partagée évolue ?
- Quelles statistiques et quels filtres apporteront une valeur réelle ?
- Quelles intégrations calendrier, santé ou sport seront prioritaires ?
- Quelles langues seront proposées après le français ?

## 8. Besoins validés pour les évolutions

- **B-068** — Créer dans le MVP T03 un Exercice de référence indépendamment d’une Séance, avec sa Pause éventuelle ; la Récupération après exercice appartient à chaque occurrence de Séance (D-208).
- **B-069** — Ajouter cette référence à plusieurs Séances sous forme de copies indépendantes qui n’encombrent pas le catalogue.
- **B-070** — Associer `0..n` photos ou vidéos à un Exercice, les réordonner et les consulter hors ligne.
- **B-071** — Ancienne cible de Parcours autonome retirée par D-328 ; voir la planification multi-contenus du 08/10.
- *Texte identique à celui de la section [« 8. Besoins validés pour les évolutions »](#8-besoins-validés-pour-les-évolutions) ; il n’est pas recopié ici.*
- **B-072** — Exécuter dès le MVP un Exercice `À l’échec` avec le même geste `Suivant` que le mode Répétitions.
- **B-073** — Configurer un Exercice ou un Circuit sans ou avec changement de côté, sans désignation anatomique du côté de départ (D-406) et sans créer de zones corporelles latéralisées (au niveau du Circuit : besoin d’évolution potentiel, explicitement hors du périmètre actuel, D-209, D-395, RM-146).
- **B-074** — Comprendre le côté courant pendant l’Exécution grâce au sous-titre `Côté 1` ou `Côté 2`, sans compteur supplémentaire (D-407).
- **B-075** — Conserver séparément les résultats du côté 1 et du côté 2, y compris lorsqu’un seul côté est partiellement réalisé.
- **B-076** — Activer la bilatéralité d’un Circuit après confirmation ; toutes ses Exercices héritent alors du Circuit et leur contrôle propre devient unilatéral désactivé (besoin d’évolution potentiel, explicitement hors du périmètre actuel, non validé pour la version actuelle : D-209, D-395, RM-145 à RM-147).
- **B-092** — Renseigner facultativement, dès le MVP (D-421), une charge informative en kilogrammes pour un Exercice, commune aux Séries identiques ou propre à chaque Série variable, et la retrouver pendant l’Exécution (D-403, RM-235 à RM-241).

## 9. Besoins MVP T03 — Catalogue des Exercices et Exécution directe

L’utilisateur doit pouvoir :

- **B-077** — ouvrir le Catalogue des Exercices depuis le sélecteur de type ;
- **B-078** — créer, consulter et modifier un Exercice persistant ;
- **B-079** — distinguer l’ouverture de la carte du bouton Lecture réservé à l’Exécution directe ;
- **B-080** — utiliser `Créer` comme action contextuelle : dans chaque Catalogue, ouvrir directement la création de l’objet correspondant au Catalogue courant, sans écran ni arbre intermédiaire ;
- **B-081** — depuis une Composition, choisir entre un nouvel Exercice, un ou plusieurs Exercices existants et l’annulation ;
- **B-082** — lancer un Exercice persistant, disposer de `5 s` pour se préparer et être guidé selon tous ses paramètres ;
- **B-083** — renseigner le Ressenti obligatoire dans la Synthèse ;
- **B-084** — retrouver l’Exécution dans le Suivi général sous le type Exercice ;
- **B-085** — revenir au Catalogue avec filtres et position restaurés.

Les résultats alimentent les indicateurs compatibles sans compter une Séance.

## Besoin cible — consulter un média sans perdre l’Exécution

Dans le MVP, l’utilisateur doit pouvoir vérifier visuellement un mouvement pendant qu’il exécute un Exercice, sans quitter l’Exécution, sans perdre le chrono ni la progression et sans déclencher de pause implicite. Il doit pouvoir revenir instantanément aux informations d’Exécution et conserver, pendant la séance courante, la dernière face et le dernier média consultés.

Le besoin détaillé est consolidé dans `../CONCEPTION-EXECUTION-MEDIA.md`.

#### Planifier un Parcours — cible post-MVP

*Texte identique à celui de la section [« Parcours — post-MVP »](01%20%E2%80%93%20Vision%20G%C3%A9n%C3%A9rale.md#parcours--post-mvp) ; il n’est pas recopié ici.*

#### Régler les récupérations

- **B-086** — Distinguer clairement la Pause après chaque série, la Pause entre les côtés et la Récupération après exercice.
- **B-087** — Dans l’éditeur d’Exercice, n’exposer la Pause entre les côtés que lorsque le Changement de côté vaut `Avec` (D-406).
- **B-088** — Dans la Composition, ajouter explicitement une récupération, en modifier la durée et la retirer. À 0 s ou en son absence, aucune information de récupération ; le trait reste indépendant du contenu (D-303).
- **B-089** — Conserver cette récupération avec l’occurrence lors d’un déplacement ou d’une duplication ; la supprimer avec l’occurrence.
- **B-090** — Exécuter la récupération du dernier Exercice avant la Fin de séance, et celle du dernier Exercice du Circuit à chaque Tour.
- **B-091** — Ne pas ajouter de récupération post-exercice lors de l’Exécution directe depuis le Catalogue.

## Besoins consolidés

L’utilisateur doit pouvoir classer chaque nouvel Exercice avec exactement une Catégorie et une ou plusieurs Zones corporelles, sans que ces métadonnées conditionnent son exécution. Il peut retirer des valeurs des référentiels sans casser les objets existants. Dans une Séance, les Compte à rebours d’exercice et Fin d’exercice ne sont jamais exécutés ; seuls le Compte à rebours initial et la Fin de séance s’appliquent, une fois, par substitution. Aucun booléen ni contrôle d’activation n’existe à cet effet. Les valeurs propres restent conservées pour l’exécution de l’Exercice seul. Les Points d’arrêt restent positionnables dans la séquence selon D-217 et sont rejoués à chaque Tour lorsqu’ils appartiennent au Circuit.

## Besoin de rythme reproductible

Pour un entraînement ou une rééducation, prescrire un intervalle entre répétitions et disposer de signaux réguliers, tout en gardant la maîtrise de la fin de Série. La cadence est facultative ; aucune mesure automatique des répétitions ni preuve de mouvement effectué n’est promise. La Synthèse conserve le temps actif réel et la prescription de l’instantané.

## Conception de planification

Contenu identique à la section [« Conception de planification »](03%20%E2%80%93%20Parcours%20utilisateur.md#conception-de-planification) : il n’est pas recopié ici.

<a id="formats-besoins"></a>
## Besoins couverts par les formats

Composer un protocole sans ressaisir ses constantes ; choisir l’organisation lorsqu’elle est autorisée ; connaître la durée calculable avant départ ; conserver un résultat fidèle aux conditions réellement exécutées. Une séance libre reste libre, y compris après préremplissage. Le Death by restitue tours acquis et répétitions partielles ; aucune comparaison entre individus ni aucun classement n’est ajouté.
