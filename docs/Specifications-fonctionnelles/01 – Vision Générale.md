# Vision générale de KODJO

**Référence courante 07/10 :** [Pauses et symboles](SPECIFICATION-PAUSES-SYMBOLES-2026-10-07.md). Placement explicite et distinction contenu/trait conservés. **Bip de cadence et durées : la spécification Bip v2 du07/10 remplace les dispositions antérieures.**

## L’idée en une phrase

KODJO est une application mobile qui permet à une personne de créer, organiser, planifier, exécuter et suivre ses séances grâce à un guidage visuel, sonore et vocal.

## Identité du produit

- **KODJO** est le nom du produit et de l’application.
- **ANKUSHA** est la société propriétaire, la marque mère et l’éditeur de KODJO.
- Le slogan produit est **Keep On. Do Just One.**
- Le splash affiche `KODJO`, `Keep On. Do Just One.` et `Votre assistant du quotidien` avant d’ouvrir le `Catalogue des séances`, segment `Séances` du Catalogue.

## Le problème rencontré

Les exercices et séances sont souvent communiqués oralement, sur papier, par message ou en vidéo. Ils sont difficiles à retrouver, à organiser dans un ordre précis, à planifier et à exécuter sans mobiliser plusieurs outils. Pendant un exercice, l’utilisateur ne peut pas toujours regarder son téléphone. Il manque enfin d’une vision simple de ce qu’il a réellement effectué.

## La réponse proposée

KODJO réunit dans une même application :

La classification est dissociée : une **Étiquette** qualifie la Séance et porte sa couleur ; une **Catégorie** qualifie l’Exercice et porte sa couleur. Les Zones corporelles restent une information distincte de l’Exercice.

- un espace `Catalogues` pour les contenus ;
- la création et la modification de Séances structurées ;
- à partir de T03, un Catalogue des exercices persistants et leur Exécution directe ;
- un calendrier et la planification individuelle ;
- une Exécution guidée, adaptée aux Exercices chronométrés, en Répétitions ou À l’échec ;
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

T03 rend le segment `Exercices` fonctionnel. Il permet de créer, consulter, modifier, archiver, restaurer et supprimer définitivement un Exercice persistant, de l’ajouter à une Séance par copie indépendante, de l’exécuter directement **et de la planifier directement** au même titre qu’une Séance. Le segment `Parcours` est absent du Catalogue et des sélecteurs de type de contenu au MVP.

Un Exercice créé uniquement dans une Séance ne rejoint pas automatiquement le Catalogue. Une Exécution directe d’Exercice utilise l’origine `ACTIVITY`, un instantané autonome et une préparation fixe de `5 s`, sans Séance artificielle ni `SESSION_END`.

### Création et composition

La création est réalisée dans un écran unique `Composer une séance`. Une Séance possède obligatoirement un nom et une couleur choisie dans une palette prédéfinie de 12 couleurs. Elle devient validable lorsqu’elle contient au moins un Exercice valide.

Une Séance contient :

1. un Compte à rebours initial ;
2. des Exercices éventuellement placées avant le Circuit ;
3. un Circuit unique, visible et répétable de 1 à 99 Tours ;
4. des Exercices éventuellement placées après le Circuit ;
5. une Fin de séance.

Un Exercice peut également porter son propre Compte à rebours et sa propre Fin d’exercice. La Composition peut contenir un Point d’arrêt déplaçable ; son attente n’est pas comptabilisée dans la durée d’exécution.

Le Cycle est conservé uniquement dans le modèle technique pour l’évolutivité. Dans le MVP, sa répétition vaut toujours 1, n’est pas modifiable et n’est jamais affichée à l’utilisateur.

Un Exercice est une action exécutée en mode Durée, Répétitions ou À l’échec. Elle comprend au moins une Série et peut inclure une Pause après chaque série. Un Exercice bilatéral peut en outre définir une **Pause entre les côtés**, exécutée selon l’Ordre des côtés. La **Récupération après exercice** n’est pas intrinsèque à l’Exercice : elle appartient à son occurrence lorsqu’elle est placée dans une Séance ou un Parcours.

Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durées selon Bip v2 et paramètres v13 : Durée exacte ; Répétitions avec bip estimées ≈ ; Répétitions sans bip et À l’échec omitted au niveau Exercice. ≥ réservé à la Séance contenant du travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel.

Les valeurs initiales de l’application sont de 10 secondes pour le Compte à rebours initial et de 5 secondes pour la Fin de séance. L’utilisateur peut choisir 0 seconde, ce qui rend la phase instantanée sans la supprimer du modèle. Ces deux cartes structurelles ne sont pas déplaçables.

### Planification et calendrier

Une Séance peut être planifiée une seule fois ou périodiquement. Le Calendrier propose les vues Jour, Semaine et Mois dans le MVP. Les rappels sont facultatifs. La demande d’autorisation système des notifications n’est déclenchée que lorsque l’utilisateur active pour la première fois un rappel pendant une planification.

### Exécution guidée

L’Exécution d’une Séance présente l’Exercice en cours, la Série, le Tour, l’Exercice suivant, le temps et la progression. Le Cycle n’est jamais exposé.

L’Exécution continue à progresser lorsque l’application passe en arrière-plan ou que l’écran se verrouille. Au retour, l’état est recalculé à partir d’horodatages de référence. Une pause de sécurité intervient après 30 minutes sans interaction au-delà de la fin théorique d’un Exercice chronométré ou de la fin nominale recalculée d’une Série cadencée, ou après 2 heures sans interaction pour un Exercice en Répétitions sans cadence ou À l’échec.

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

KODJO a vocation à devenir un assistant personnel de planification et de suivi pour la rééducation, la mobilité, l’exercice physique, la santé quotidienne et les habitudes personnelles.

Les évolutions envisagées comprennent notamment :

- comptes, synchronisation et sauvegarde distante ;
- partage de Séances et groupes ;
- interface destinée aux professionnels ;
- ajout de `0..n` photos ou vidéos ordonnées par Exercice ;
- statistiques, filtres et tableaux de bord ;
- connexions à des calendriers et services de santé ;
- prise en charge de langues supplémentaires.

Ces perspectives orientent l’architecture, mais ne doivent pas être présentées comme des fonctions disponibles dans le MVP.

## Cible fonctionnelle confirmée

### Catalogue multi-type

Le Catalogue constitue l’accès central aux contenus. Il distingue `Exercices` et `Séances`. `Séances` est sélectionné par défaut à l’ouverture initiale et après relance complète ; `Exercices` est fonctionnel à partir de T03 ; `Parcours` est absent du sélecteur. Une version post-MVP rendra les Parcours fonctionnels sans créer de destination principale supplémentaire.

### Catalogue des exercices — MVP T03

La tranche MVP T03 apporte un Catalogue d’Exercices persistants. Le Catalogue des exercices permet de créer, consulter, modifier, archiver/restaurer et exécuter directement un Exercice de référence. Dès T03, depuis la Composition d’une Séance, l’utilisateur peut également sélectionner plusieurs Exercices existants ; chacun est copié dans la Séance et devient indépendante de sa référence.

Un Exercice créé uniquement dans une Séance ne rejoint pas automatiquement le Catalogue. Cette capacité locale reste conservée mais n’est pas exposée dans le parcours courant de composition, qui propose la sélection depuis le Catalogue. Dans le MVP, le média associé est affiché dans la gouttière permanente de la carte d’Exercice du Catalogue, sans déploiement ; cette règle n’ajoute pas implicitement de mécanisme d’import ou de capture (D-260/D-261).

L’Exécution directe réutilise le sous-ensemble moteur autonome avec une origine `ACTIVITY`, commence par une préparation standard de `5 s`, n’ajoute ni Séance artificielle ni phase `SESSION_END`, puis affiche une Synthèse avec Ressenti obligatoire. Le Suivi identifie cette Exécution comme un Exercice et applique les statistiques compatibles sans compter une Séance.

### Parcours — post-MVP

Les Parcours restent préparés conceptuellement et techniquement mais ne sont ni créables ni exécutables dans T03. Leur planification appartient à une évolution ultérieure distincte.

## Vision de la bilatéralité

La configuration permet de choisir `Aucun`, droite puis gauche, ou gauche puis droite sur un Exercice. Dans la version actuelle, le changement de côté n’est pas exposé au niveau du Circuit ; le Circuit n’a pas de bilatéralité fonctionnelle. L’Exécution rend le côté courant explicite sans alourdir la progression, au moyen du sous-titre `Côté droit` ou `Côté gauche` sous le nom de l’Exercice. Les résultats restent distinguables par côté et l’historique demeure fondé sur un instantané immuable.

## Vision cible — médias pendant l’Exécution

Le MVP permet de consulter les médias de l’Exercice sans quitter l’Exécution ni interrompre son moteur. L’utilisateur peut retourner la zone d’information vers une face Média, parcourir une galerie ordonnée, lancer une vidéo à la demande et ouvrir le média en plein écran. Le plein écran conserve un cadre flottant de suivi et de commande de l’Exécution.

Cette cible est conçue mais n’est pas ajoutée au périmètre MVP courant sans décision de roadmap distincte. Voir `../CONCEPTION-EXECUTION-MEDIA.md`.

### Cible de planification commune

La cible produit considère **Séances, Exercices persistants et Parcours** comme des contenus autonomes pouvant être planifiés directement. Le MVP active cette capacité pour les Séances et les Exercices ; la planification des Parcours reste rattachée à la version prévue pour cette fonctionnalité. Le principe fonctionnel demeure unique : une Routine planifie une source, quel que soit son type.

## Consolidation du 26 septembre 2026

La terminologie cible distingue **Parcours** (contenu autonome), **Circuit** (groupe répété interne à une Séance) et **Tour** (une répétition du Circuit). La classification n’influence pas l’Exécution : un Exercice requiert une Catégorie et au moins une Zone corporelle ; l’Étiquette de Séance reste facultative. Les préférences Profil initialisent les nouveaux objets sans rétroactivité. Une Séance peut globalement appliquer ou ignorer les Compte à rebours et Fins propres à ses Exercices.



> **Clôture des contrats — 01/10/2026.** Les règles consolidées du [chapitre 13, §6](13%20–%20Contrats%20d’écran.md#6-clôture-des-réserves-fonctionnelles-des-contrats) s’appliquent : progression sur le plan complet ; transitions et pauses selon D-248/v13 (ancien repli D-242 retiré) ; fréquence 1..12 semaines ; rappel personnalisé au plus 24 h. En Un côté après l’autre, le reset porte sur le bloc du côté courant ; la même règle s’applique à l’ordre alterné en conservant les résultats de l’autre côté (chapitre13 R-03). Les étapes et calculs ci-dessous se lisent avec ces précisions ; aucune nouvelle disposition d’écran.


### Saisie des paramètres — D-246

La référence active est [Paramètres en modale v13](SPECIFICATION-PARAMETRES-MODALE-v13.md), contrats CE-T03-04/CE-UI-10. Elle intègre Séries variables, Ordre des côtés, pauses terminales et récupération de l’occurrence. Feuille transactionnelle : ✕ annule, ✓ applique au parent, Terminer persiste. Les calculs et comportements sont normatifs dans les spécifications ; Figma définit le layout seulement. Les anciens textes v11 sont historiques.

## Cadence facultative — cible documentaire

Les trois modes peuvent émettre un Bip de cadence, intervalle0..10s,0=Aucun, sans quatrième mode. Chronomètre croissant et signaux guident l’utilisateur ; Suivant conserve la fin normale de Série, même après la fin nominale. KODJO ne détecte ni ne demande les répétitions effectivement accomplies. Référence : [Bip v2](SPECIFICATION-BIP-CADENCE-v2.md).

