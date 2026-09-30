## 12.0 Objet et périmètre

Ce chapitre définit l’architecture technique du MVP.

L’architecture doit permettre :
- le développement d’une application mobile iOS et Android ;
- un fonctionnement complet hors connexion pour les fonctions du MVP ;
- une exécution fiable des Séances et de leurs timers ;
- un stockage local des données ;
- l’utilisation de notifications locales ;
- la gestion des sons, annonces vocales et vibrations ;
- la conservation de l’historique des Exécutions ;
- l’évolution future vers des comptes utilisateurs, une synchronisation cloud et des intégrations externes ;
- le maintien d’une architecture suffisamment simple pour le MVP.

Le MVP ne nécessite pas :
- de backend applicatif ;
- de compte utilisateur ;
- de connexion Internet pour les fonctions principales ;
- de synchronisation multi-appareils ;
- d’API réseau interne ;
- d’intégration avec les calendriers Apple, Google ou Microsoft.

## 12.1 Principes d’architecture

Les principes suivants sont retenus :

| Principe | Décision |
|---|---|
| Plateformes | iOS et Android |
| Fonctionnement hors ligne | Toutes les fonctions principales du MVP fonctionnent hors connexion |
| Compte utilisateur | Aucun compte obligatoire dans le MVP |
| Identité locale | Chaque installation dispose d’un identifiant Utilisateur interne unique et stable |
| Stockage | Données métier stockées localement sur l’appareil |
| Backend | Aucun backend requis pour le MVP |
| Synchronisation cloud | Hors MVP, mais anticipée dans l’architecture |
| Notifications | Notifications locales |
| Médias | Consultation des médias associés incluse au MVP (D-203) ; acquisition et stockage selon D-066/D-068 ; galerie ordonnée |
| Calendriers externes | Hors MVP |
| Tests | Tests automatisés de la logique métier et des parcours critiques |
| Distribution initiale | Versions de test privées avant publication sur les stores |
| Web | Hors MVP ; son ajout futur ne doit pas être artificiellement bloqué par l’architecture |

L’application suit une approche **local-first** : les données locales constituent la source opérationnelle du MVP.
### Internationalisation

**Le MVP est livré uniquement en français et ne propose aucun sélecteur de langue à l'utilisateur.**

L'architecture est néanmoins préparée pour une évolution multilingue sans refonte :
- les textes affichés dans l'interface ne sont pas codés en dur dans les composants ;
- ils sont externalisés dans un catalogue de ressources identifié par des clés stables ;
- ce catalogue couvre également les pluriels, interpolations, messages d’erreur, notifications et libellés d’accessibilité ;
- les dates, heures et nombres utilisent les formats de la locale sélectionnée ;
- l'ajout d'une langue doit pouvoir être réalisé en ajoutant les traductions correspondantes sans modifier la logique métier ;
- la langue de l'interface et la langue de synthèse vocale sont conçues comme deux paramètres pouvant être gérés lors d'une évolution future ;
- aucun mécanisme de détection, de choix ou de changement de langue n'est exposé à l'utilisateur dans le MVP ;
- aucune préférence utilisateur de langue n'est persistée dans le MVP.

## 12.2 Architecture logique générale

L’application est structurée en couches afin de séparer l’interface, les règles métier et la persistance des données.

```text
Interface utilisateur
        │
        ▼
Services applicatifs
        │
        ▼
Domaine / règles métier
        │
        ▼
Repositories
        │
        ▼
Stockage local
```

Les services techniques du système d’exploitation sont accessibles à travers des adaptateurs dédiés :

```text
Services applicatifs
        │
        ├── Notifications
        ├── Audio / voix
        ├── Vibrations
        ├── Médias (adaptateur post-MVP)
        └── Horloge / temps
```

Cette séparation doit éviter que les règles métier dépendent directement :
- de l’interface graphique ;
- du système de stockage ;
- d’iOS ou Android ;
- d’un fournisseur cloud futur.

## 12.3 Interface utilisateur

La couche Interface utilisateur assure :
- l’affichage des écrans ;
- la navigation ;
- la collecte des actions utilisateur ;
- l’affichage de l’état courant ;
- l’affichage des erreurs fonctionnelles.

Elle ne porte pas directement les règles métier principales.

Les écrans s’appuient sur les services applicatifs définis dans le chapitre 11.

La navigation et les composants doivent être organisés de façon à partager le maximum de code entre iOS et Android.

## 12.4 Services applicatifs

Les API fonctionnelles du chapitre 11 sont mises en œuvre par les services internes suivants :

| Service | Responsabilité |
|---|---|
| `SessionService` | Création, lecture, modification, duplication, archivage et restauration des Séances |
| `CompositionService` | Gestion des Cycles, Tours, Exercices et de leur ordre |
| `PlanningService` | Gestion des Routines et calcul des occurrences |
| `ExecutionService` | Génération du plan d’exécution, timer, progression et commandes pendant l’Exécution |
| `HistoryService` | Exécutions, Instantanés, occurrences historisées et consultation de l’historique |
| `PreferencesService` | Lecture et modification des Préférences globales |
| `ReferenceDataService` | Gestion des Étiquettes de Séance, des Catégories d’Exercice et du référentiel administrable des Zones corporelles |

La couche de référentiels ne distingue pas, pour le droit de suppression, les valeurs initiales des valeurs créées ensuite par l’utilisateur. La suppression d’une valeur la retire atomiquement du référentiel actif et des nouvelles sélections, sans supprimer ses associations aux objets existants ; les Instantanés historiques ne sont jamais réécrits.

Ces services sont des composants logiques internes à l’application.

Ils ne correspondent pas à des serveurs ou microservices distincts.

## 12.5 Domaine métier

La couche Domaine contient :
- les entités définies dans le chapitre 09 ;
- les règles métier ;
- les validations ;
- les transitions d’état ;
- les calculs indépendants de l’interface et du stockage.

Les calculs de Durée estimée d’exécution, Durée synthétique des Exercices, Durée réelle, nombres d’Exercices, progression globale et occurrences périodiques sont implémentés comme des règles déterministes distinctes du Domaine conformément au chapitre 10. L’interface ne peut substituer l’une de ces deux métriques estimées à l’autre : le Catalogue et la Composition consomment la Durée synthétique des Exercices, tandis que l’Exécution consomme la Durée estimée d’exécution. La progression couvre le Plan complet, `INITIAL_COUNTDOWN` et `SESSION_END` compris, et ne vaut `100 %` qu’après l’achèvement de `SESSION_END` ; dans T04, les étapes chronométrées sont pondérées par leur durée planifiée et la part d’une occurrence en Répétitions ou À l’échec est acquise avec `Suivant`. Les Pauses manuelles sont exclues. Ces règles ne doivent pas être redéfinies dans l’interface ou la couche de persistance.

Les objets du domaine ne doivent pas dépendre directement :
- de l’interface utilisateur ;
- de la base de données ;
- d’un protocole réseau ;
- d’Apple ou Android.

Cette séparation facilite :
- les tests automatisés ;
- l’évolution du stockage ;
- l’ajout futur d’un backend ;
- la synchronisation future ;
- la réutilisation éventuelle de la logique métier sur d’autres plateformes.

## 12.6 Persistance et stockage local

### Principe

Les données structurées du MVP sont persistées dans une **base SQLite locale**, via un accès direct à `expo-sqlite` encapsulé derrière les Repositories.

Le spike RT-002 réalisé en T01-S01 a écarté Drizzle ORM en raison d’une compatibilité insuffisamment stable avec la version Expo retenue. Drizzle n’est donc ni une dépendance ni une option active du MVP. Le schéma, les requêtes et les migrations SQLite sont gérés directement par la couche de persistance, sans exposer `expo-sqlite` au domaine.

Le stockage doit notamment permettre :
- les relations entre les entités ;
- l’affichage chronologique du MVP et l’ajout ultérieur de recherche, tri et filtres ;
- les transactions ;
- les migrations du schéma ;
- la conservation durable de l’historique ;
- l’évolution future du modèle.

Les données métier ne doivent pas être stockées uniquement dans l’état de l’interface ou dans de simples préférences applicatives.

### Données persistées

Sont notamment persistés :
- Utilisateur local ;
- Préférences ;
- Séances ;
- Cycles ;
- Tours ;
- Exercices ;
- Routines ;
- Étiquettes de Séance ;
- Catégories d’Exercice ;
- Zones corporelles ;
- Exécutions ;
- Instantanés d’Exécution ;
- Occurrences historisées.

Les Zones corporelles constituent un référentiel utilisateur persistant et administrable, initialisé avec des valeurs par défaut. Leur identité reste stable à travers les renommages ; leur suppression les retire des choix futurs tout en conservant les associations existantes selon les règles du chapitre 10.

### Repositories

L’accès aux données passe par une couche de `Repositories`.

Les services applicatifs ne doivent pas dépendre directement de la technologie de base de données.

Cette abstraction doit permettre ultérieurement :
- de changer de technologie de stockage ;
- d’ajouter une source distante ;
- d’introduire une synchronisation cloud ;
- de prendre en charge les usages multi-appareils, le partage, la communauté et les relations avec des professionnels ;

sans modifier les règles métier ni coupler le domaine à SQLite ou à un fournisseur cloud.

La technologie cloud et la stratégie précise de synchronisation ne sont pas choisies dans le MVP. Elles seront définies lorsqu’une version nécessitera effectivement des données partagées ou multi-appareils.

Après le MVP, les médias ne seront pas stockés comme blobs dans SQLite : la base conservera leurs métadonnées et leurs références locales ou distantes.

## 12.7 Identité utilisateur

### MVP

Le MVP ne nécessite pas de création de compte ni de connexion.

Lors du premier lancement, l’application génère automatiquement un **identifiant Utilisateur interne unique et stable**, de type UUID ou équivalent.

Cet identifiant :
- est généré localement ;
- est conservé sur l’installation ;
- ne dépend pas de l’adresse e-mail ;
- ne dépend pas de l’appareil comme identité métier ;
- est utilisé comme propriétaire des données de l’utilisateur.

Les principales données métier sont rattachées directement ou indirectement à cet Utilisateur.

Les racines d’agrégat persistantes appartenant à l’utilisateur (notamment Séance, Routine, Exécution et Catégorie) portent une référence de propriété `ownerId` vers cet identifiant Utilisateur. Les objets enfants, tels que Cycle, Tour et Exercice, héritent de cette propriété par leur rattachement à leur agrégat et n’ont pas à dupliquer systématiquement `ownerId`.

### Évolution future

Dans le MVP, **Profil** n'est pas une entité métier autonome : il s'agit de l'espace UI regroupant les informations de l'Utilisateur et ses Préférences globales.

Pour les évolutions futures, l’architecture distingue :
- l’**Utilisateur**, identité interne de l’application ;
- le **Compte**, permettant de retrouver un Utilisateur ;
- le **Fournisseur d’identité**, par exemple Apple ou Google.

Une entité Profil distincte ne sera introduite ultérieurement que si un besoin fonctionnel lié aux comptes, au cloud ou au partage le justifie.

Cette séparation doit permettre ultérieurement d’associer un Utilisateur local existant à un compte authentifié sans recréer ses données métier.

Apple et Google sont les fournisseurs d’identité envisagés en priorité.

Facebook n’est pas retenu comme besoin du MVP.

Sans compte ni sauvegarde distante, la suppression de l’application ou la perte de l’appareil peut entraîner la perte de l’identité locale et des données associées.

## 12.8 Gestion de l’état

Deux catégories d’état sont distinguées.

### État persistant

Il correspond aux données métier devant survivre à la fermeture de l’application.

Il est stocké dans la base locale.

### État temporaire

Il correspond notamment :
- à l’écran courant ;
- aux formulaires non encore validés ;
- à l’état visuel de l’interface ;
- à certains états transitoires d’exécution.

L’état temporaire est géré avec les mécanismes natifs de React : `useState`, `useReducer` et, lorsqu’un partage limité entre composants le justifie, Context.

Aucune bibliothèque globale de gestion d’état telle que Zustand ou Redux n’est introduite au démarrage du MVP. Une telle bibliothèque ne pourra être ajoutée que si un besoin transverse concret apparaît pendant le développement et si les mécanismes natifs de React deviennent insuffisants.

Les données métier persistantes ne doivent pas avoir pour source de vérité l’état de l’interface.

## 12.9 Architecture du moteur d’exécution

Le moteur d’exécution constitue un composant critique du MVP.

Il est sous la responsabilité de `ExecutionService`.

Au démarrage d’une Exécution :

1. la définition de la Séance est chargée ;
2. un Instantané fonctionnel immuable est créé ;
3. un plan d’exécution ordonné est généré ;
4. l’Exécution démarre au Compte à rebours initial.

Le moteur gère ensuite :
- l’étape courante ;
- les répétitions du Circuit, c’est-à-dire les Tours, et le Cycle technique fixé à une répétition ;
- les Séries propres à chaque Exercice ;
- l’insertion d’une étape `SERIES_PAUSE` uniquement entre Séries successives, donc `C−1` fois par côté ;
- l’insertion éventuelle d’une phase `SIDE_RECOVERY` entre les deux côtés lorsque `sideRecoverySeconds > 0` ;
- l’insertion d’une phase `POST_ACTIVITY_RECOVERY` après chaque occurrence de Séance/Parcours lorsque `postActivityRecoverySeconds > 0` ;
- la progression dans le Circuit au cours du Tour courant ;
- la progression interne du Cycle, non exposée dans l’interface MVP ;
- les temps écoulés ;
- les transitions entre étapes ;
- la pause et la reprise ;
- la réinitialisation de l’Exercice, de la Série ou de la Récupération courante ;
- le passage à l’étape suivante ;
- l’arrêt anticipé ;
- la terminaison normale.

Le Plan distingue les phases `INITIAL_COUNTDOWN`, `ACTIVITY`, `SERIES_PAUSE`, `SIDE_RECOVERY`, `POST_ACTIVITY_RECOVERY` et `SESSION_END`. Ces valeurs qualifient une phase d’exécution et non un type d’Exercice. `SIDE_RECOVERY` conserve la référence de l’Exercice bilatéral ; `POST_ACTIVITY_RECOVERY` conserve la référence de l’occurrence. Leurs métriques planifiées/écoulées sont distinctes. Après la dernier Exercice et sa récupération post-exercice éventuelle, `ExecutionService` active `SESSION_END` et continue le calcul du temps écoulé. Il ne persiste la clôture normale qu’à l’achèvement de cette étape ; `0 s` provoque la transition immédiatement. Le routeur ouvre ensuite la fin minimale dans T04, ou la Synthèse dans la tranche qui la livre. Un arrêt antérieur suit le chemin d’interruption et produit le statut `Interrompue`.

La logique du moteur doit être indépendante des composants graphiques afin de pouvoir être testée automatiquement.

## 12.10 Gestion du temps

Le moteur d’Exécution ne détermine jamais le temps réellement écoulé par comptage des ticks d’un timer JavaScript.

L’Exécution conserve des horodatages et des références temporelles persistées permettant de recalculer de manière déterministe son état réel à partir de l’horloge système. Le timer utilisé par l’interface sert uniquement au rafraîchissement visuel et n’est jamais la source de vérité temporelle.

L’accès à l’heure est abstrait par une interface technique de type `Clock`, injectable dans le moteur, afin de rendre les calculs temporels testables indépendamment de React et de la plateforme.

Cette approche permet notamment de reconstruire l’état lorsque :
- l’interface est momentanément ralentie ;
- l’application passe en arrière-plan ;
- l’écran est verrouillé ;
- le système suspend temporairement certaines tâches ;
- l’application revient au premier plan après une interruption.

L’état minimal nécessaire à la reconstruction fiable d’une Exécution est persisté. Les comportements exacts autorisés en arrière-plan dépendent toutefois des capacités d’iOS et Android et doivent être validés sur appareils réels.

## 12.11 Audio, voix et vibrations

L’accès aux fonctions audio et haptiques est isolé derrière des services techniques dédiés.

Ils prennent en charge :
- les bips ;
- les annonces vocales ;
- les vibrations ;
- leur déclenchement aux moments définis par les règles fonctionnelles.

Le moteur d’exécution demande le déclenchement d’un événement sans dépendre directement de l’API native utilisée.

Le feedback haptique des roulettes numériques relève de l’interface et non du moteur d’Exécution. Le composant de roulette déclenche un retour haptique léger et bref à chaque changement effectif de valeur, une seule fois par cran. Ce déclenchement est systématique et ne consulte pas la préférence `Vibrations`, réservée aux vibrations fonctionnelles de séance. L’implémentation reste isolée derrière l’adaptateur haptique natif afin de conserver un comportement cohérent sur iOS et Android.

Cette abstraction permet de gérer les différences entre iOS et Android.

Les comportements doivent être testés notamment :
- application au premier plan ;
- écran verrouillé ;
- application en arrière-plan ;
- téléphone en mode silencieux ;
- avec d’autres sources audio actives.

## 12.12 Fonctionnement en arrière-plan

Le MVP vise à maintenir une Exécution cohérente lorsque l’application passe temporairement en arrière-plan ou que l’écran est verrouillé, dans les limites autorisées par iOS et Android.

L’architecture ne suppose pas que le code JavaScript ou le processus applicatif continue nécessairement à s’exécuter en permanence en arrière-plan.

Le passage en arrière-plan ou le verrouillage ne met pas automatiquement l’Exécution en pause. Le Plan d’Exécution continue logiquement selon ses horodatages persistés. Lors du retour au premier plan, l’état de l’Exécution est recalculé à partir :
- de l’étape en cours ;
- des références temporelles persistées ;
- de l’état enregistré.

Le moteur applique une pause de sécurité en l’absence d’interaction :

- 30 minutes après la fin théorique d’un Exercice chronométré ;
- 2 heures après le démarrage d’un Exercice en Répétitions ou À l’échec.

Cette pause est déterminée à partir des horodatages et ne suppose pas qu’un timer JavaScript reste actif en permanence en arrière-plan.

Les fonctions nécessitant un comportement natif spécifique sont encapsulées derrière des interfaces dédiées. Les différences iOS / Android sont traitées dans ces adaptateurs et ne doivent pas modifier les règles métier du moteur d’Exécution.

Le choix définitif des mécanismes natifs nécessaires aux transitions, sons et annonces vocales lorsque l’application est suspendue ou l’écran verrouillé est arrêté après le spike technique iOS / Android.

## 12.13 Notifications locales

Les rappels liés aux Routines utilisent des notifications locales du système d’exploitation.

Elles sont planifiées à partir des occurrences calculées par `PlanningService`.

Aucun serveur n’est nécessaire pour envoyer ces notifications dans le MVP.

Pour les Routines périodiques, les notifications sont programmées selon une **fenêtre glissante** d’occurrences futures plutôt que jusqu’à la date de fin complète. Cette fenêtre est réapprovisionnée lors de l’ouverture de l’application et lors de toute création, modification, suppression ou autre changement affectant la planification. Sa taille technique est déterminée à l’implémentation selon les contraintes iOS et Android.

Lorsqu’une Routine est :
- créée ;
- modifiée ;
- supprimée ;
- ou supprimée à la suite de l’archivage de sa source ;

les notifications futures correspondantes doivent être recalculées ou supprimées.

L’application ne demande pas l’autorisation de notification au lancement. Elle vérifie l’état de l’autorisation lorsque l’utilisateur active pour la première fois un rappel pendant une planification, explique l’usage, puis déclenche la demande système. Si l’autorisation est refusée, le rappel n’est pas activé et l’interface indique que l’autorisation peut être modifiée dans les réglages du système.

## 12.14 Médias

Les médias sont hors périmètre du MVP. Aucune image ou vidéo n’est associée aux Exercices dans cette version.

L’architecture doit permettre `0..n` associations média ordonnées par Exercice en V2. La copie d’un Exercice ou d’une Séance ne duplique pas le fichier physique : plusieurs associations peuvent référencer le même fichier local immuable.

Lors de cette évolution, le stockage local privilégiera la **non-duplication des données volumineuses**. Les fichiers médias ne seront pas intégrés physiquement aux Instantanés historiques ; leurs associations ordonnées et références stables le seront.

Le schéma MVP peut réserver l’extension future sans imposer de table ou de fichier Média tant que la fonctionnalité n’est pas développée.

Les fichiers binaires volumineux ne sont pas stockés directement dans les entités métier.

Les futurs fichiers médias ne seront pas copiés dans les Instantanés d’Exécution ; les associations ordonnées et références stables nécessaires à l’historique y seront conservées.

La suppression ou la modification ultérieure d’un média ne doit pas compromettre la lisibilité fonctionnelle de l’historique.

Une évolution future pourra permettre le stockage ou la synchronisation des médias dans un service distant.

## 12.15 Instantanés et historique

Au démarrage effectif d’une Exécution, `HistoryService` conserve l’Instantané fonctionnel défini au chapitre 09.

Cet Instantané est :
- immuable ;
- indépendant des modifications futures de la Séance ;
- suffisamment complet pour restituer l’historique ;
- volontairement léger ;
- dépourvu de copie physique des fichiers médias, tout en conservant leurs références stables après leur introduction.

Le format physique de stockage doit permettre de relire les anciens Instantanés même après une évolution du modèle de données.

Dans le MVP, l’Instantané est persisté sous forme de **JSON immuable** associé à l’Exécution. Les données nécessaires à la recherche et au tri chronologique du Suivi MVP sont conservées sous une forme permettant un accès efficace. Le JSON constitue la photographie historique complète. Les index dédiés aux filtres avancés — notamment Catégories, Zones corporelles, statut et période — sont reportés avec la fonctionnalité de filtrage avancé.

Les migrations futures doivent donc préserver la compatibilité avec l’historique existant.

## 12.16 Transactions et intégrité

Les opérations modifiant plusieurs objets liés doivent être atomiques lorsque leur cohérence l’exige.

Exemples :
- création d’une Séance et de sa structure initiale ;
- archivage d’une Séance et suppression de ses Routines ;
- suppression logique d’une Étiquette, d’une Catégorie ou d’une Zone corporelle du référentiel actif, avec conservation de ses associations existantes ;
- création d’une Exécution et de son Instantané.

Une opération atomique :
- réussit entièrement ;
- ou ne conserve aucune modification partielle.

Les contraintes d’intégrité du chapitre 09 doivent également être appliquées au niveau de la persistance lorsque cela est techniquement pertinent.

## 12.17 Gestion technique des erreurs

Les conventions fonctionnelles du chapitre 11 sont appliquées par l’architecture technique.

Les couches techniques distinguent au minimum :
- erreurs de validation ;
- objet inexistant ;
- état incompatible ;
- conflit ;
- autorisation ;
- erreur technique.

Les erreurs techniques sont journalisées avec les informations utiles au diagnostic, sans exposer directement ces informations à l’utilisateur.

Les messages affichés à l’utilisateur restent compréhensibles et indépendants des détails techniques.

Les informations sensibles ne doivent pas apparaître dans les journaux techniques.

## 12.18 Tests automatisés

La stratégie de tests comporte plusieurs niveaux.

| Niveau | Objet |
|---|---|
| Tests unitaires | Règles métier, validations et calculs |
| Tests du moteur d’exécution | Plan d’exécution, répétitions, transitions, timer |
| Tests de persistance | Création, modification, suppression, transactions et migrations |
| Tests d’intégration | Interaction entre services applicatifs et stockage |
| Tests de composants | Comportement des composants critiques de l’interface |
| Tests de parcours critiques | Création → planification → exécution → historique |
| Tests sur appareils réels | Audio, arrière-plan, verrouillage, notifications, performances |

Les tests du domaine et du moteur d’exécution doivent être indépendants de l’interface graphique autant que possible.

Les fonctions dépendantes du comportement réel de la plateforme sont validées sur au moins un appareil iOS réel et un appareil Android réel. Une première campagne est réalisée dans le cadre du spike RT-001 avant le développement complet du moteur d’Exécution ; une campagne complète est réalisée avant livraison du MVP.

Les outils retenus sont :
- **Jest + `jest-expo`** pour les tests unitaires du domaine, des règles métier, du moteur d’Exécution et de la persistance ;
- **React Native Testing Library** pour les tests des composants et écrans ;
- **Maestro** pour les parcours end-to-end critiques, introduit lorsque les premiers parcours bout-en-bout sont stabilisés.

Les tests sur appareils réels iOS et Android complètent obligatoirement les tests automatisés pour les fonctions natives sensibles : timer, audio, arrière-plan, écran verrouillé, vibrations et notifications.

Les plans de tests fonctionnels sont documentés séparément.

## 12.19 Crash reporting et observabilité

Le MVP prévoit un mécanisme de remontée des erreurs techniques et crashs lors des versions distribuées aux testeurs.

Sentry est la solution retenue à introduire avant les premiers tests externes.

Les données collectées doivent être limitées aux informations nécessaires au diagnostic.

Le MVP ne nécessite pas d’analytics comportemental détaillé.

L’ajout ultérieur d’analytics devra faire l’objet d’une décision spécifique concernant :
- les données collectées ;
- leur finalité ;
- la protection des données personnelles ;
- les éventuels consentements nécessaires.

## 12.20 Sécurité et données personnelles

Le MVP applique les principes suivants :
- minimisation des données personnelles ;
- stockage uniquement des données nécessaires ;
- absence de mot de passe géré par l’application dans le MVP ;
- séparation entre identité interne et authentification future ;
- absence d’informations sensibles dans les logs ;
- utilisation des mécanismes sécurisés du système pour les secrets techniques lorsqu’ils existent.

Si des comptes utilisateurs, une synchronisation cloud ou des données de santé sont introduits ultérieurement, une revue spécifique de sécurité et de protection des données devra être réalisée avant leur mise en production.

## 12.21 Synchronisation future

La synchronisation cloud ne fait pas partie du MVP.

L’architecture doit néanmoins éviter de la rendre difficile à introduire ultérieurement.

À cette fin :
- les entités disposent d’identifiants stables ;
- les données appartiennent à un Utilisateur interne ;
- l’accès aux données passe par des Repositories ;
- les règles métier ne dépendent pas du stockage local ;
- les dates de création et modification sont conservées lorsque nécessaires ;
- les Instantanés historiques sont immuables.

Une future synchronisation devra définir explicitement :
- la source de vérité ;
- la résolution des conflits ;
- le fonctionnement hors ligne ;
- les suppressions ;
- la synchronisation des médias ;
- la gestion multi-appareils.

Aucun de ces mécanismes n’est implémenté dans le MVP.

## 12.22 Intégrations externes futures

Les intégrations suivantes sont hors MVP :
- Apple Calendar ;
- Google Calendar ;
- Microsoft Outlook ;
- fournisseurs externes de vidéos ou contenus d’exercices ;
- partage avec des kinésithérapeutes ou coachs ;
- services cloud ;
- API publiques ou partenaires.

Elles devront utiliser des adaptateurs dédiés afin de ne pas introduire de dépendance directe entre le domaine métier et un fournisseur externe.

Aucun port ou service d’intelligence artificielle vide (`no-op`) n’est créé dans le MVP. Une interface dédiée à l’IA ne sera introduite que lorsqu’un cas d’usage concret sera retenu, afin d’éviter une abstraction sans besoin fonctionnel actuel.

## 12.23 Critères de choix technologiques

Les technologies du MVP sont évaluées selon les critères suivants :

| Critère | Importance | Justification |
|---|---:|---|
| Compatibilité iOS + Android | Critique | Les deux plateformes sont dans le périmètre du MVP |
| Accès aux fonctions natives | Critique | Audio, notifications, arrière-plan, fichiers et vibrations sont nécessaires |
| Fiabilité du timer | Critique | Le moteur d’exécution est une fonction centrale du produit |
| Fonctionnement hors ligne | Critique | Exigence structurante du MVP |
| Persistance structurée | Critique | Le modèle métier est relationnel et comporte un historique |
| Testabilité | Critique | Le moteur d’exécution et les règles métier doivent être fortement testables |
| Maturité et maintenance | Élevée | Réduire le risque technique et faciliter la maintenance |
| Documentation | Élevée | Le développement sera fortement assisté par IA |
| Simplicité | Élevée | Éviter une architecture disproportionnée pour un MVP |
| Écosystème et bibliothèques | Élevée | Réduire le développement natif spécifique |
| Évolutivité cloud | Moyenne à élevée | Comptes et synchronisation sont envisagés ultérieurement |
| Web futur | Moyenne | Hors MVP, mais ne doit pas être artificiellement bloqué |
| Coût initial | Élevée | Le MVP ne doit pas nécessiter de backend ni d’infrastructure serveur |

## 12.24 Choix technologiques retenus

| Domaine | Choix retenu | Justification principale |
|---|---|---|
| Framework mobile | **React Native + Expo** | Code partagé iOS/Android, accès natif, écosystème mature et forte documentation |
| Architecture React Native | **New Architecture** | Architecture actuelle et pérenne de React Native / Expo |
| Langage | **TypeScript strict** | Sécurise les contrats, les objets métier et facilite le développement assisté par IA |
| Navigation | **Expo Router** | Navigation structurée et typée, compatible iOS/Android et préparant un Web futur |
| Base locale | **SQLite via `expo-sqlite`** | Stockage relationnel, transactions, historique et migrations |
| ORM | **Aucun** | RT-002 a écarté Drizzle ORM ; accès direct à `expo-sqlite` derrière les Repositories |
| État UI temporaire | **React state / reducer / Context** | Suffisant au MVP ; évite une dépendance globale prématurée |
| Moteur d’exécution | **Module TypeScript indépendant de React** | Fiabilité, testabilité et indépendance de l’interface |
| Notifications | **`expo-notifications`** | Notifications locales cross-platform sans backend |
| Audio | **`expo-audio`** | Abstraction audio cross-platform |
| Synthèse vocale | **`expo-speech`** | Text-to-speech cross-platform |
| Vibrations / haptique | **Modules Expo natifs adaptés** | Accès homogène aux capacités iOS/Android |
| Médias / fichiers | **`expo-file-system` + APIs média Expo** | Stockage local des fichiers en dehors de SQLite |
| Tests unitaires / composants | **Jest + `jest-expo` + React Native Testing Library** | Stack adaptée à Expo et aux composants React Native |
| Tests end-to-end | **Maestro** | Automatisation des parcours mobiles critiques après stabilisation |
| Builds / distribution | **Expo EAS** | Builds et distribution privée iOS/Android, adaptés à un environnement de développement Windows |
| Crash reporting | **Sentry** | Diagnostic des crashs et erreurs lors des tests distribués |

### Contraintes techniques propres à T04

- Le contrôle technique initial du moteur d’Exécution est intégré au début du premier lot T04 ; aucun spike ni prototype séparé ne précède ce lot.
- Les tests audio sur appareils physiques iOS et Android sont réalisés dans le second lot T04.
- L’ajout de `expo-audio`, `expo-speech` et de leur configuration native impose la production d’un nouveau development build iOS et Android ; Expo Go ne constitue pas la preuve finale pour ces comportements natifs.
- T02-S02 et sa migration `004` constituent désormais un **état historique** supersédé sur la récupération par D-208. Le schéma cible n’utilise plus une récupération générique attachée à l’Exercice.
- Pour D-208, la base de développement peut être **réinitialisée** : le schéma cible doit être créé directement avec `side_recovery_seconds` sur l’Exercice et `post_activity_recovery_seconds` sur l’occurrence de Séance/Parcours. Aucune exigence de migration utilisateur de l’ancien `recovery_seconds` n’est portée par cette conception.
- Les migrations `005`/`006` restent des traces de l’état technique antérieur et des évolutions déjà réalisées ; elles ne doivent pas être interprétées comme le scénario cible de migration D-208. Lors de l’implémentation de D-208, la version de schéma et les éventuels scripts techniques doivent être recalés sur la baseline de base réinitialisée.
- L’archivage, la restauration et la suppression restent hors du périmètre de livraison T04 ; leur modèle existant n’est pas supprimé.
| Backend | **Aucun dans le MVP** | Architecture local-first et réduction de la complexité |
| Authentification | **Aucune dans le MVP ; Apple/Google préparés** | Évite la complexité des comptes tout en préservant l’évolution future |

## 12.25 Justification des principaux choix

### React Native + Expo

React Native avec Expo est retenu afin de :
- partager l’essentiel du code entre iOS et Android ;
- disposer d’un écosystème intégré pour les notifications, fichiers, audio et autres capacités natives ;
- réduire le volume de code natif spécifique ;
- disposer d’une documentation abondante et exploitable par les outils de développement assisté par IA ;
- conserver la possibilité d’ajouter du code natif spécifique si une fonction critique l’exige ;
- ne pas bloquer une évolution Web future.

Flutter constitue une alternative viable mais n’apporte pas d’avantage décisif pour les besoins identifiés du MVP et introduirait un autre langage et un autre écosystème.

### TypeScript strict

TypeScript strict est obligatoire pour :
- traduire explicitement le modèle fonctionnel en types techniques ;
- détecter plus tôt les incohérences ;
- sécuriser les interfaces entre couches et services ;
- faciliter la génération et la revue de code par IA.

### SQLite

SQLite est retenu parce que le produit manipule des données structurées, relationnelles et historisées.

Il fournit :
- relations ;
- requêtes ;
- transactions ;
- index ;
- migrations ;
- fonctionnement hors ligne.

Les fichiers JSON ou un stockage de type préférences ne constituent pas un stockage métier principal adapté au modèle.

### Accès direct à `expo-sqlite`

RT-002 a conclu que la combinaison Drizzle ORM / Expo n’était pas suffisamment stable. Le MVP utilise donc directement `expo-sqlite`, sans ORM. La couche Repository demeure la seule frontière d’accès à la persistance : elle protège le domaine d’une dépendance à SQLite et permet une évolution ultérieure de la source de données sans modifier les contrats métier.

Le schéma, les requêtes, les transactions et les migrations sont définis et testés dans la couche de persistance. La décision historique d’évaluer puis d’écarter Drizzle est conservée dans D-043 et RT-002 ; elle ne constitue plus un choix ouvert.

### Gestion d’état

Aucune bibliothèque globale de gestion d’état, notamment Zustand ou Redux, n’est introduite au démarrage du MVP.

La stratégie retenue est :
- SQLite via les Repositories pour l’état métier persistant ;
- services applicatifs pour les opérations métier ;
- `useState`, `useReducer` et Context lorsque nécessaire pour l’état UI temporaire.

Une bibliothèque globale supplémentaire n’est introduite que si un besoin transverse concret apparaît pendant le développement et justifie cette complexité.

### Moteur d’exécution

Le moteur d’exécution est implémenté en TypeScript pur et indépendant de React.

Il reçoit les données nécessaires à l’Exécution et produit un état d’Exécution et des événements.

Il ne dépend pas directement :
- des écrans ;
- de la navigation ;
- de SQLite ;
- des APIs natives.

Ce choix permet de tester intensivement la logique de progression et de timer.

### Gestion du temps

Le moteur utilise des références temporelles absolues et des timestamps plutôt qu’un simple compteur décrémenté à l’écran.

Cette décision permet de recalculer l’état réel après :
- un ralentissement de l’interface ;
- une mise en arrière-plan ;
- un verrouillage d’écran ;
- une suspension temporaire par le système.

### Notifications

Les rappels utilisent des notifications locales afin de :
- fonctionner hors connexion ;
- ne nécessiter aucun backend ;
- rester cohérents avec l’approche local-first.

### Médias — préparation post-MVP

La consultation des médias déjà associés pendant l’Exécution est incluse au MVP (D-203). L’acquisition et le stockage restent régis par D-066/D-068 ; pour cette évolution, les fichiers resteront dans le système de fichiers et SQLite conservera uniquement leur référence et leurs métadonnées nécessaires.

### Tests

Les tests sont considérés comme une composante de l’architecture et non comme une étape ultérieure facultative.

La priorité est donnée :
1. au domaine métier ;
2. au moteur d’exécution ;
3. à la persistance et aux migrations ;
4. aux composants et écrans critiques ;
5. aux parcours end-to-end critiques.

La stack retenue est **Jest + `jest-expo`** pour les tests unitaires, **React Native Testing Library** pour les composants et écrans, et **Maestro** pour les parcours end-to-end après stabilisation des premiers parcours fonctionnels. Les comportements natifs sensibles restent validés sur appareils réels iOS et Android.

## 12.26 Mise en page adaptative et bornes sûres

Le gabarit Figma de référence mesure `402 × 874` pixels de maquette, interprétés comme des points logiques pour l’implémentation. Il ne constitue pas une taille fixe. Les trois modes Figma de référence sont `Compact 360`, `Standard 402` et `Grand téléphone 440`. L’implémentation reste contrôlée à des largeurs intermédiaires, notamment `390` et `430`, sur iOS et Android en portrait.

Les règles techniques suivantes rendent cette adaptation opératoire :

- utiliser les insets de Safe Area fournis par le système, sans coder en dur la hauteur d’une encoche, de la Dynamic Island, de la barre d’état ou de l’indicateur d’accueil ;
- autoriser les fonds à atteindre les bords physiques, tout en maintenant titres, commandes et contenus interactifs dans les bornes sûres haute et basse ;
- intégrer l’inset inférieur à la navigation basse fixe ; le contenu défilant conserve un espace final suffisant pour ne jamais être masqué par cette navigation ;
- gérer l’apparition du clavier afin que le champ actif et l’action principale restent atteignables ;
- utiliser des contraintes adaptatives, contrôler les retours à la ligne et le grossissement du texte, et ne jamais coder les coordonnées du gabarit Figma comme positions absolues ;
- conserver la navigation basse opaque et au premier plan, notamment dans les listes et cartes déployées.

Ces exigences font l’objet de tests visuels et d’interaction sur les largeurs cibles et avec les tailles de texte accessibles.

### Unités d’implémentation

- Les valeurs Figma sont interprétées comme des points logiques React Native, pas comme des pixels physiques.
- Aucun calcul ne dépend de la densité de pixels de l’appareil ; React Native et le système assurent la conversion physique.
- Les dimensions verticales comprenant les barres système sont calculées à partir des insets réels.
- Le gabarit `402 × 874` sert aux comparaisons visuelles, jamais à un redimensionnement global proportionnel de l’interface.

### Paliers de largeur du MVP

| Palier | Largeur logique | Marge horizontale | Comportement |
| --- | ---: | ---: | --- |
| Compact | `360–389` | `16` | Les groupes horizontaux peuvent passer en pile ; les textes conservent leur taille. |
| Standard | `390–419` | `24` | Reproduction directe de la hiérarchie Figma ; `402` est la largeur de comparaison principale. |
| Large téléphone | `420–440` | `24` | Les composants s’étendent jusqu’à la largeur utile sans agrandir les textes ou icônes. |
| Hors cible téléphone | `> 440` | Contenu centré | Largeur principale maximale `440` ; l’interface tablette spécifique est hors MVP. |

La largeur minimale officiellement supportée par le MVP est `360`. Une largeur inférieure peut rester fonctionnelle, mais ne constitue pas un critère de recette avant décision explicite d’élargir la cible.

### Architecture canonique de spécification UI

La construction et la vérification d’un écran suivent obligatoirement la chaîne suivante :

`Screen Shell → composant ou contrôle du Design System → règle spécifique et contrat d’écran`

- Le **Screen Shell** définit la structure générale, les zones fixes et les slots disponibles.
- Le **composant ou contrôle du Design System** définit les propriétés communes réutilisables : géométrie, style, états génériques, cible tactile et comportement d’interaction commun.
- La **règle spécifique et le contrat d’écran** définissent le contenu, les valeurs, les états métier, les conditions d’affichage, la navigation et les résultats observables propres à l’écran.

Une valeur contextuelle, un libellé métier ou une condition fonctionnelle ne devient pas une propriété générique du composant. Inversement, une règle commune portée par un Shell ou un composant n’est pas recopiée dans chaque contrat d’écran. Toute exception locale est explicitement identifiée et reliée à une évidence Figma ou à une décision fonctionnelle validée.

### Screen Shells

Les dimensions ci-dessous décrivent le gabarit Figma de référence. Les insets système réels remplacent les réserves de Safe Area lors de l’implémentation ; ils ne sont jamais déduits d’une coordonnée fixe du gabarit.

#### `Shell / Screen` — `402 × 874`

| Variante Figma | Header | Context | Body | Zone basse |
| --- | ---: | ---: | ---: | ---: |
| `Context=On, Bottom=Navigation` | `0–92` | `92–207` | `207–797` | Navigation `797–874` |
| `Context=Off, Bottom=Navigation` | `0–92` | — | `92–797` | Navigation `797–874` |
| `Context=On, Bottom=Action` | `0–92` | `92–207` | `207–790` | Action `790–874` |
| `Context=Off, Bottom=Action` | `0–92` | — | `92–790` | Action `790–874` |

#### `Shell / Modal Fullscreen` — `378 × 822`

| Zone | Bornes Figma | Dimension |
| --- | ---: | ---: |
| Header | `0–60` | `60` |
| Content | `60–752` | `692` |
| Bottom Action | `752–822` | `70` |

Le Bottom Action contient un bouton `354 × 48` placé à `x=12`, avec un espace inférieur de référence de `22`. La réaction du prototype et le libellé du bouton restent propres à chaque instance.

#### `Shell / Execution` — `402 × 874`

| Variante Figma | Header | Content | Footer |
| --- | ---: | ---: | ---: |
| `Mode=Run` | `0–92` | `92–782` | `782–874` |
| `Mode=Summary` | `0–92` | `92–874` | — |

La page Figma `Prototype MVP` contient `74` frames de production. Le contrôle du 1er septembre 2026 établit que `73` utilisent au moins un Screen Shell ; le Splash `1992:469` est l’unique exception. Les neuf états de planification concernés utilisent également `Shell / Modal Fullscreen` à l’intérieur de leur écran de contexte.

### Composants et contrôles réutilisables

Les composants ci-dessous constituent le catalogue structurel actuellement vérifié

Pour l’Exécution, les composants textuels du contenu utilisent **Roboto Condensed** ; le titre supérieur de Séance et les dialogues de décision utilisent **Inter**. Les écrans d’Exécution réutilisent une seule instance d’en-tête canonique. dans la page Figma `Design system — Fondations`. Leur nom Figma est conservé pour permettre une correspondance déterministe.

| Famille | Composant ou set Figma | Variantes ou propriétés génériques vérifiées |
| --- | --- | --- |
| Navigation | `Navigation / Bottom` (`6298:12462`) | Active=Catalogue, Calendar, History, Profile, Search ; la variante Search ne valide pas son exposition produit |
| En-tête | `Header / Fixed` | `Mode=Standard/Execution`, `Back=On/Off` |
| Retour | `Action / Back` (`2624:3105`) | cible `48 × 48` liée à `size/touch-target-min`, cercle `38 × 38` (`2624:3106`) lié à `component/action/circular-visual-box`, cadre d’icône `24 × 24` (`3089:61`) lié à `component/action/circular-icon` |
| En-tête de modale | `Modal / Header` | `378 × 60`, titre d’instance, Retour standardisé |
| Action basse de modale | `Modal / Bottom Action` | `378 × 70`, bouton `354 × 48`, libellé d’instance |
| Bouton principal | `Button / Primary — Source exact` | `State=Active/Disabled` |
| Interrupteur | `Controls / Switch — Source exact` | `State=On/Off` |
| Disclosure | `Controls / Disclosure — Source exact` | `State=Collapsed` (`2537:1033`) / `State=Expanded` (`2537:1038`) |
| Segmented | `Controls / Segmented` (`2586:2759`) | nombre d’items et position sélectionnée ; trois options égales pour `Durée / Répétitions / À l’échec` |
| Champs | `Forms / Text Field — Source exact` | `Type=Single line/Multiline` |
| Sélection | `Forms / Select Field — Source exact` | `Size=Full/Compact/Compact narrow`, hauteur `42` |
| Pickers | `Picker / Popover — Source exact` (`2537:1174`) | `Type=Duration` (`2537:1110`), `Type=Numeric wheel` (`3210:49`), `Type=Time` (`2884:4415`) ou Date selon contrat ; les variantes numériques ouvertes sont rendues dans un overlay d’écran centré, jamais dans le flux ou le `ScrollView` hôte |
| Décision | `Overlay / Decision Dialog` (`2590:2961`) | deux actions primaire/neutre ou danger/neutre ; trois actions danger/neutre ; dialogue centré. L’abandon des modifications d’un Exercice utilise `PrimaryTone=Danger,SecondaryTone=Neutral,Actions=2` (`2590:2934`) dans la frame `3224:4082` |
| Nom de séance | `Session / Name Field — Source exact` (`2537:1480`) | `354 × 42`, fond transparent, liseré blanc intérieur `1` |
| Catalogue | `Carte séance` (`6214:7276`) / `Carte exercice` (`6214:7278`) | Contexte=Catalogue ; État=Replié/Archivé/Déployé ; classement en pastilles, valeurs nues ; détails et écarts média dans le complément du 30 septembre |
| Calendrier | `Carte séance` / `Carte exercice` | Contexte=Calendrier Semaine ; états réellement présents selon inventaire du complément |
| Suivi | `Carte séance` / `Carte exercice`, `Ressenti` (`6234:8895`) | Contexte=Suivi ; statut en haut, Déployer et Ressenti en bas à droite |
| Composition | `Composition / Activity Row with Recovery` (`3572:64`) | bloc `354 × 93` lorsque Récupération > 0 ; carte principale puis sous-carte attachée `Récupération X min Y s` ; Nom / Zones corporelles / Synthèse ; déplacement, duplication et suppression portent sur le bloc entier |
| Composition | `Composition / Tour Section — Source exact` | section Tour, synthèse calculée des exercices et répétition contextuelle |
| Composition | `Composition / Boundary Activity — Source exact` | `Type=Initial countdown/End session` |
| Exercice | `Activity / Name Field — Source exact` (`3382:4303`) | champ Nom canonique placé en tête du bandeau bleu |
| Exercice | `Activity / Parameter Row — Source exact` et `Controls / Segmented` (`2586:2759`) | `Mode=Duration/Repetitions/ToFailure` ; ordre invariant `Séries` → cible → `Pause` ; `ToFailure` remplace la cible par le cadre informatif `à l’échec` ; seconde rangée `Récupération` → `Durée totale`, cette dernière étant masquée sans déplacement hors mode Durée |
| Exercice | États de calcul (`3580:4733`, `3580:4845`, `3580:4957`) | respectivement Séries pilote, Durée totale pilote et durée cible ajustée ; le pilote confirmé reçoit un contour lié à `color/selection` |
| Média | `Action / Add Media — Source exact` (`3382:60`) | visible mais désactivé dans le MVP ; actif en V2 ; icône vectorielle `icon/ajouter` (`3382:61`) en `16 × 16`, jamais un caractère typographique `+` |
| Média | `Media / Preview` (`3382:59`) | aperçu Photo ou Vidéo |
| Média | `Media / Gallery — Source exact` (`3382:64`) | liste horizontale ordonnée avec aperçu suivant tronqué |
| Média | `Media / Section — Source exact` (`3382:71`) | section masquée dans le MVP ; conteneur de galerie en V2 |
| Stepper entier simple | Composant standard/DSF compatible React Native/Expo | Contrôle inline pour `Nombre de Séries`, `Nombre de répétitions`, `Nombre de Tours`; bornes métier appliquées ; aucune modale/roulette |
| Catégorie | `Selection / Category Tag` (`3302:4166`) | `State=Unselected/Selected`, propriété texte `Label`; cible tactile `48` de haut, pilule visuelle `30`, rayon `15`, Inter Regular `12/15` |

Les composants suffixés `Source exact` ont été extraits d’un écran source identifié dans `Prototype MVP`. Ce suffixe qualifie leur provenance visuelle ; il ne transforme pas le contenu métier de l’écran source en propriété du composant.

Le contrôle `Controls / Disclosure — Source exact` est la référence normative de tout bouton de déploiement ou de repli utilisant cette famille. Chaque occurrence est une instance de la variante appropriée, sans copie graphique locale : cible tactile `48 × 48`, cadre visible centré `28 × 28`, rayon `6`, fond `#FBFCFF` et chevron `8 × 4` tracé en violet sur `2` points. La variante `State=Collapsed` (`2537:1033`) utilise une bordure grise `#D6D9E3` sur `1` point et un chevron bas `#8282F2`. La variante `State=Expanded` (`2537:1038`) utilise une bordure violette `#8283F2` sur `2` points et un chevron haut de même couleur. Les destinations et réactions de prototype restent définies par l’écran hôte ; elles ne sont pas héritées comme comportement métier du composant.

### Règles de réutilisation et de contrôle

1. Réutiliser une instance du composant existant lorsqu’il couvre le besoin ; ne pas recréer localement une copie visuelle.
2. Utiliser les propriétés de variante uniquement pour des états génériques et réutilisables.
3. Conserver les libellés, valeurs, bornes, règles de validation et destinations dans le contrat d’écran lorsqu’ils dépendent du contexte.
4. Ne pas détacher une instance pour contourner une propriété manquante sans identifier d’abord si le besoin relève du composant ou d’une exception locale.
5. Toute modification d’un composant partagé impose un contrôle de ses instances et des contrats qui le référencent.
6. Toute différence locale doit être qualifiée : contenu d’instance, état métier, exception visuelle validée ou non-conformité.
7. Les réactions du prototype restent locales lorsqu’elles dépendent du parcours ; le composant générique ne porte pas une destination métier arbitraire.
8. L’absence de liaison d’une propriété à une variable Figma ne permet pas d’inventer une nouvelle valeur : le token canonique et l’intention du composant restent la référence.

### Design tokens canoniques

Le Figma contient les collections locales `KODJO / Primitives`, `KODJO / Sémantiques` et `KODJO / Responsive`. Au contrôle du 4 septembre 2026, elles contiennent respectivement `59`, `62` et `4` variables. La collection Responsive possède les modes `Compact 360`, `Standard 402` et `Grand téléphone 440`. Ils sont documentés dans la page `Design system — Fondations`. La page `Référence responsive — Cible` présente ces modes pour huit familles structurantes, déclinées en neuf groupes d’écrans puisque le Calendrier est contrôlé séparément en vues Semaine et Mois, soit vingt-sept écrans de travail.

Le `Prototype MVP` n’est pas intégralement relié aux variables ni aux Text Styles. Cette absence de liaison ne crée pas une seconde source de vérité : les valeurs historiques répétées dans ses frames sont rapprochées des tokens canoniques lors du développement, sous réserve de conserver toute différence visuelle explicitement démontrée comme intentionnelle. Une valeur brute telle que `13,16`, `16,92`, `18,8` ou `9,4` ne doit pas être créée comme token : elle est ramenée au niveau canonique correspondant.

Les noms avec barre oblique, par exemple `color/primary`, sont les noms physiques des variables Figma. Les noms avec point employés dans le code, par exemple `color.primary`, sont leurs identifiants d’implémentation. La table de correspondance doit rester bijective ; deux tokens de code ne peuvent pas représenter silencieusement une même variable Figma.

#### Couleurs

| Token | Valeur | Usage |
| --- | --- | --- |
| `color.primary` | `#0508E5` | Actions principales, navigation active, texte ou contour d’action secondaire |
| `color.selection` | `#5F60EE` | Fond d’un contrôle de sélection actif portant un texte blanc ; contraste texte/fond de `4,78:1` |
| `color.selectionSurface` | `#E5F0FF` | Fond de destination ou d’élément sélectionné |
| `color.background` | `#FFFFFF` | Fond principal |
| `color.surface` | `#F5F7FA` | Cartes, navigation et surfaces secondaires |
| `color.surfaceSubtle` | `#F9FAFC` | Contrôles neutres et fonds légers |
| `color.textPrimary` | `#141414` | Texte principal canonique |
| `color.textSecondary` | `#595E66` | Texte secondaire |
| `color.iconNeutral` | `#5C636E` | Icônes inactives |
| `color.border` | `#E0E3E8` | Bordure standard |
| `color.divider` | `#DBE0E8` | Séparateurs et démarcation d’en-tête |
| `color.disabled` | `#BEC2CC` | Fond d’action désactivée |
| `color.snackbar` | `#292B33` | Fond des messages temporaires |
| `color.positive` | `#4F9F83` | Ressenti positif sélectionné |
| `color.warning` | `#FF8D28` | Ressenti intermédiaire et avertissement non destructif |
| `color.danger` | `#D92D20` | Action destructive et état négatif |
| `color.dangerSurface` | `#FFF1F0` | Fond destructif léger |
| `color.wheelActionCancelBackground` | `#F5F7FA` | Cercle d’annulation d’une roulette ; alias de `color.surface` |
| `color.wheelActionConfirmBackground` | `#0508E5` | Cercle de confirmation d’une roulette ; alias de `color.primary` |
| `color.wheelActionCancelIcon` | `#141414` | Croix d’annulation ; alias de `color.textPrimary` |
| `color.wheelActionConfirmIcon` | `#FFFFFF` | Coche de confirmation sur fond primaire |
| `color.sessionNameBorder` | `#FFFFFF` | Liseré du champ `Nom de la séance` sur la surface colorée de Composition ; variable Figma `color/session-name-border` |
| `color.mediaSurface` | `#F6F6FF` | Surface des aperçus Média ; variable sémantique Figma `color/media/surface`, alias exact de la primitive `color/media/surface-F6F6FF` |
| `color.mediaBorder` | `#CDCEFA` | Bordure des aperçus Média ; variable sémantique Figma `color/media/border`, alias exact de la primitive `color/media/border-CDCEFA` |
| `color.overlayScrim` | `rgba(31, 33, 41, 0.34)` | Voile bloquant des roulettes ouvertes ; variable sémantique Figma `color/overlay/scrim`, alias exact de la primitive `color/overlay/scrim-1F2129-34` |

Les couleurs de statut sont toujours accompagnées d’un libellé, d’une icône ou des deux. Les rares variantes historiques de noir ou de gris présentes dans les frames sont normalisées vers les tokens ci-dessus lors du développement, sauf différence visuelle explicitement documentée.

L’ancienne valeur `#8283F2` ne doit plus servir de fond à un texte blanc de taille normale. Elle peut rester présente sur un élément décoratif ou sans texte dans l’attente de l’audit complet des couleurs, mais ne constitue plus le token de sélection active.

#### Typographie

La famille du MVP est `Inter`. La hauteur de ligne explicite ci-dessous remplace la valeur Figma `AUTO` afin d’obtenir un rendu stable entre plateformes.

Les neuf Text Styles locaux actuellement présents sont : `KODJO / Timer`, `Screen title`, `Modal title`, `Section title`, `Body`, `Label`, `Button`, `Supporting` et `Navigation label`. Ils ne couvrent pas encore à eux seuls toute la gamme fonctionnelle ci-dessous et ne sont pas appliqués aux 2 614 nœuds texte de `Prototype MVP`. La gamme suivante constitue donc le contrat typographique canonique d’implémentation et de rationalisation ; elle ne doit pas être présentée comme une liaison Figma déjà exhaustive.

| Token | Graisse | Taille | Hauteur de ligne | Usage |
| --- | --- | ---: | ---: | --- |
| `type.timerPrimary` | Semi Bold | `58` | `64` | Temps principal pendant l’Exécution |
| `type.activityTitle` | Semi Bold | `28` | `34` | Nom de l’Exercice en cours d’Exécution |
| `type.metricPrimary` | Semi Bold | `22` | `28` | Durée, résultat ou métrique dominante |
| `type.screenTitle` | Semi Bold | `20` | `24` | Titre d’écran |
| `type.modalTitle` | Semi Bold | `18` | `22` | Titre de modale, bottom sheet ou date principale |
| `type.sectionTitle` | Semi Bold | `16` | `20` | Titre de section ou de formulaire |
| `type.cardTitle` | Semi Bold | `16` | `20` | Titres hors famille Cartes du 30 septembre |
| Titre des nouvelles cartes | Semi Bold | `15` | Selon référence Figma | Catalogue, choix, Calendrier Semaine et Suivi ; exception documentée à D-083 |
| `type.compactCardTitle` | Semi Bold | `13` | `18` | Titre d’une carte compacte imbriquée, notamment dans une Composition |
| `type.body` | Regular | `14` | `20` | Texte courant |
| `type.label` | Medium | `14` | `18` | Libellé de champ ou valeur importante |
| `type.button` | Semi Bold | `14` | `18` | Bouton principal et secondaire |
| `type.supporting` | Regular | `12` | `16` | Aide, métadonnée et information secondaire |
| `type.caption` | Regular | `11` | `16` | Légende compacte et information contrainte |
| `type.navLabel` | Regular | `11` | `16` | Libellé de destination active |

La taille minimale d’un texte fonctionnel est `11`. Une information secondaire utilise normalement `type.supporting` en `12`. Les tailles `8`, `10` et `10,5` ne sont pas utilisées pour du texte fonctionnel ; les points du Calendrier mensuel sont des indicateurs graphiques et non des caractères typographiques. Les titres et noms fonctionnels utilisent `type.cardTitle` en `16`, sauf les nouvelles cartes en `15` et le niveau compact explicitement prévu par `type.compactCardTitle`. La taille `15` est désormais le titre fonctionnel des nouvelles cartes du 30 septembre, exception explicite à D-083 ; les autres titres conservent leur niveau propre.

Tous les textes conservent `allowFontScaling=true`. Les tests doivent couvrir au minimum `100 %`, `135 %` et une taille d’accessibilité proche de `200 %`. Les composants grandissent ou passent sur plusieurs lignes ; la réduction automatique de la taille de police est interdite pour masquer un défaut de mise en page. Après toute modification d’un token typographique, la largeur et la hauteur de son conteneur sont recalculées et contrôlées afin d’éviter retour à la ligne involontaire, troncature, débordement ou chevauchement. Les glyphes employés comme pictogrammes (`+`, `×`, `‹`, `›`, coche ou points d’occurrence) sont gérés comme des icônes et ne créent pas de niveau typographique.

#### Icônes et pictogrammes

La taille canonique désigne la boîte visuelle de l’icône. Le tracé interne conserve son ratio et peut occuper une surface plus petite pour assurer un équilibre optique. Cette boîte reste indépendante du minimum tactile commun de `44 × 44` ; les dimensions spécifiques supérieures sont conservées.

| Token | Taille visuelle | Usage |
| --- | ---: | --- |
| `icon.control` | `14 × 14` | Chevrons et indicateurs de sélecteurs compacts |
| `icon.compact` | `16 × 16` | Icônes fonctionnelles incorporées à un contrôle compact, par exemple `icon/ajouter` (`2884:4315`) dans `Action / Add Activity — Source exact` (`2537:1484`). Ne s’applique jamais aux icônes structurelles de carte |
| `icon.section` | `18 × 18` | Icônes de contenu, repli de section et restauration interne |
| `icon.standard` | `24 × 24` | Retour, fermeture, ajout, navigation précédent/suivant et commandes de section |
| `icon.action` | `28 × 28` | Démarrer, restaurer et actions circulaires |
| `icon.navigation` | `32 × 32` | Boîte optique commune des quatre destinations de navigation basse |
| `icon.status` | `32 × 32` | Statuts illustrés nécessitant une présence visuelle renforcée |

Les pictogrammes de navigation sont centrés dans leur boîte `32 × 32` sans mise à l’échelle forcée de leurs tracés : leurs dimensions internes peuvent donc différer. Les triangles de lecture, chevrons ou autres chemins vectoriels internes ne créent pas de tokens supplémentaires.

`icon.compact` décrit exclusivement la boîte visuelle d’une petite icône fonctionnelle intégrée à un contrôle. L’exemple DSF canonique est le signe d’ajout vectoriel `icon/ajouter` (`2884:4315`), de `16 × 16`, dans le composant `Action / Add Activity — Source exact` (`2537:1484`, contrôle `174 × 32`). Ce token ne définit ni la taille de la cible tactile ni celle d’un slot structurel.

La poignée de déplacement constitue une exception structurelle explicite : `Icon / Structure / Movable` (`3066:4676`) utilise un dessin `20 × 20`, centré dans un slot `28 × 28`, avec une opacité de `50 %` et la couleur `color.iconNeutral`. L’ancien dessin local `icon/réorganiser` en `16 × 16` est obsolète et interdit comme source ou comme implémentation de cette poignée. Il ne doit jamais être déduit de `icon.compact`.

Les caractères typographiques `+`, `×`, `‹`, `›` et les coches ne sont pas utilisés comme icônes dans l’application. Ils sont remplacés par des tracés vectoriels nommés, centrés dans la boîte visuelle appropriée et colorés avec les tokens d’icône ou d’action.

#### Espacements et rayons

| Famille | Tokens autorisés | Usage principal |
| --- | --- | --- |
| Espacements | `2`, `4`, `6`, `8`, `12`, `16`, `24`, `32` | Écart interne et externe ; `24` est la marge standard, `16` la marge compacte |
| Rayons fixes | `6`, `8`, `10`, `12`, `16`, `20`, `24` | Petits indicateurs, contrôles, champs, cartes, modales et boutons |
| Rayons dérivés | Demi-hauteur ou demi-largeur du composant | Cercles et capsules ; notamment `28`, `29` et `33` dans les composants actuellement validés |
| Bordure | `1`, `2` | `1` par défaut ; `2` pour un état actif ou fortement accentué |

Le choix d’un token existant est obligatoire. Une nouvelle valeur ne peut être ajoutée que si aucun token ne permet de reproduire une différence réellement visible et intentionnelle du Figma.

##### Modales basses — géométrie canonique du contenu

Les modales basses réutilisent les tokens du DSF Figma et ne déduisent pas leurs marges à partir de la hauteur d’un contenu particulier :

| Token DSF | Valeur | Règle |
| --- | ---: | --- |
| `size/modal-header-height` | `60` | Hauteur canonique de l’en-tête de la modale basse |
| `size/modal-width` | `378` | Largeur utile interne à la largeur de référence `402`, soit `12` points de marge latérale de chaque côté |
| `spacing/modal-content-top-inset` | `16` | Espace vertical obligatoire entre le bas de l’en-tête et le premier élément fonctionnel visible du contenu |
| `spacing/modal-bottom-inset` | `22` | Espace vertical obligatoire entre le dernier élément fonctionnel visible du contenu et le bas de la modale |

La hauteur totale d’une modale basse suit son contenu, dans la limite de hauteur définie pour cette famille. Les cibles tactiles restent indépendantes de la boîte visuelle : un contrôle peut disposer d’une cible `48 × 48` alors que son élément visible est plus petit. En conséquence, les espacements visuels entre groupes se mesurent entre les boîtes visuelles des éléments, et non entre les limites transparentes de leurs cibles tactiles. Une cible tactile plus grande ne doit donc jamais créer artificiellement un espacement visuel supérieur au token demandé.


##### Échelle et usages des espacements

| Token | Usage canonique |
| ---: | --- |
| `2` | Séparation minimale ou ajustement optique exceptionnel à l’intérieur d’un composant ; ne structure pas deux sections distinctes |
| `4` | Micro-espacement entre pictogramme et élément associé, ou padding interne très contraint |
| `6` | Espacement compact explicitement validé, notamment marge interne droite des groupes d’actions de carte |
| `8` | Écart compact entre contrôles ou cartes d’une même liste ; écart titre/contrôle lorsque les deux appartiennent au même bloc |
| `12` | Padding interne standard d’un petit contrôle ou écart intermédiaire à l’intérieur d’une carte |
| `16` | Écart standard entre éléments fonctionnels associés, entre message et action, et respiration avant une zone fixe |
| `24` | Marge horizontale standard, séparation entre groupes fonctionnels et espacement information/progression de l’Exécution |
| `32` | Séparation majeure entre sections ou entre une barre d’actions et le début d’une liste |

Les valeurs `10`, `14`, `18`, `26`, `29` et `30` observées historiquement dans certaines frames ne sont pas des tokens. Elles ont été rationalisées vers l’échelle ci-dessus lorsqu’elles représentaient un véritable espacement. Une distance mesurée entre deux boîtes Figma peut néanmoins résulter de la hauteur de ligne, de la hauteur d’un contrôle, d’une grille horaire ou d’un sélecteur système : elle n’est alors pas convertie en token et ne doit pas être arrondie mécaniquement.

##### Espacements validés par composant

| Famille ou composant | Espacement validé |
| --- | ---: |
| Profil — cartes de réglage successives | `16` |
| Calendrier Semaine — en-tête journalier et cartes successives | `8` |
| Calendrier Semaine — fin de la zone défilante avant la séparation de navigation | `16` |
| Suivi — groupes de dates successifs | `16` |
| Suivi — groupe `Filtrer / Trier` vers la liste | `32` |
| Catalogue — action `Créer une séance` vers le début de la liste | `32` |
| Dialogue de décision — dernière ligne de message vers la première action | `16` |
| Exécution — libellé du temps écoulé vers la progression par Tours | `24` |
| Synthèse — statut vers date et heure | `16` |
| Synthèse — résumé vers section Ressenti | `32` |
| Synthèse — titre Ressenti vers les choix | `8` |
| Synthèse — choix du Ressenti vers la section Commentaire | `24` |

Les espacements sont appliqués par `gap`, `padding`, `margin` ou par la structure du composant, jamais par reproduction d’une coordonnée absolue du gabarit Figma. Une liste défilante conserve un padding final permettant à son dernier élément d’être entièrement consultable sans toucher une séparation, une navigation ou une action fixe.

##### Échelle et usages des rayons

| Token | Usage canonique |
| ---: | --- |
| `6` | Petit indicateur ou contrôle très compact |
| `8` | Petit champ ou contrôle compact |
| `10` | Options de contrôles segmentés et options de rappel |
| `12` | Carte et champ standard |
| `16` | Bouton secondaire compact, calendrier contextuel et message temporaire |
| `20` | Modale compacte, notamment `Choisir une séance` et les modales de planification validées |
| `24` | Bouton principal de hauteur minimale `48` |

Les valeurs historiques `9`, `9,4`, `14` et `18,8` utilisées comme rayons fixes ont été rationalisées respectivement vers `10`, `16` ou `20` selon le composant. Le token sémantique `radius/20` est lié à la primitive `dimension/20`. Les valeurs de demi-hauteur ou demi-diamètre propres aux destinations actives et à la navigation principale ne complètent pas l’échelle fixe. Les cercles, capsules, indicateurs graphiques de demi-hauteur et rayons supérieurs propres aux bottom sheets restent calculés depuis la géométrie du composant et ne sont jamais arrondis mécaniquement vers un token fixe.

#### Dimensions structurantes

| Élément | Règle |
| --- | --- |
| Bouton principal | Hauteur minimale `48`, rayon `24`, largeur utile complète |
| Bouton secondaire compact | Hauteur visuelle `32`, rayon `16`, dans une cible tactile de `48 × 48` minimum |
| Cible tactile commune | Minimum `48 × 48` points logiques sur iOS et Android |
| Minimum natif iOS | `44 × 44` points ; le MVP retient volontairement la règle commune plus exigeante de `48 × 48` |
| Minimum natif Android | `48 × 48 dp` |
| En-tête | Hauteur de contenu `48` + inset supérieur dynamique |
| Région d’en-tête du gabarit | `92` ; zone utile `48` et réserve système de référence, remplacée par l’inset supérieur réel |
| Action finale d’écran | Région de référence `84` (`790–874`) ; bouton de `48` dans un conteneur intégrant marges et inset inférieur réel |
| Action finale de modale plein écran | Région de référence `70` (`752–822`) ; bouton `354 × 48` et espace inférieur de référence `22` |
| Région de navigation du gabarit | `77` (`797–874`) ; contient la barre principale visuelle de `66` et la réserve d’inset inférieur |
| Navigation principale | Hauteur visuelle `66`, rayon `33`, positionnée avec l’inset inférieur réel |
| Destination active | Hauteur visuelle `56`, rayon `28` |
| Carte standard | Nouvelles cartes Catalogue/choix/Semaine/Suivi : largeur 354 sur référence 402, rayon 8 ; les cartes structurelles hors famille conservent leur variante propre |
| Roulette compacte à deux colonnes — `Type=Duration` | Contenu de roulette rendu dans la modale basse canonique ; barre d’actions `Annuler / Confirmer`, contenu natif et dimensions internes selon Figma/DSF actifs. Aucun overlay centré ad hoc. |
| Roulette numérique compacte à une colonne | Variante numérique du contenu de la même modale basse canonique ; mêmes règles de brouillon et de confirmation |
| Action de roulette | Cible tactile `48 × 48` ; cercle visuel `38 × 38` ; icône `24 × 24` ; Annuler à gauche et Confirmer à droite dans la barre supérieure ; cadre de mise en page `48 × 53` autorisé pour les marges, sans modification de la cible tactile |
| Sélection de roulette à deux colonnes | Deux cadres gris séparés de `56 × 34`, rayon `17`, couvrant uniquement les chiffres ; unités hors cadres |
| Dialogue de décision | Largeur `354`, rayon `18`, centré ; actions `147 × 48` avec écart horizontal `12`; variante trois choix avec `Annuler` `306 × 48` sur une seconde ligne, écart vertical `12` |
| Champ Nom de la séance | `354 × 42`, fond transparent, liseré blanc intérieur `1`; token `color.sessionNameBorder` |
| Bandeau contextuel Exercice | `402 × 115`, accolé à la ligne basse de l’en-tête ; contexte Inter Regular `14/17` ; padding supérieur `spacing/12`, espacement contexte/champ `spacing/24`, padding inférieur `spacing/16` explicitement porté par le shell |
| Champ Nom de l’Exercice | Largeur utile `354`, hauteur visuelle `46`, fond transparent, liseré blanc intérieur `1`; valeur en token canonique `KODJO / Screen title` (`20/24`, Semi Bold), identique au champ `Nom de la séance` |
| Synthèse de l’Exercice | Largeur utile `354`, texte `KODJO / Body` (`14/20`), cadre extensible ; espacement vertical `spacing/24` avant l’action finale |
| Tag de Catégorie | Composant DSF `Selection / Category Tag` (`3302:4166`) ; `State=Unselected/Selected` ; cible tactile de hauteur `48`, pilule visuelle de hauteur `30` centrée dans la cible, rayon `15`, libellé Inter Regular `12/15`; rangées espacées sur un pas minimal de `48` afin que les cibles ne se chevauchent pas ; largeur adaptée au libellé dans la largeur utile |
| Conteneur Circuit | Largeur `374` ; hauteur `54` fermé ou `175` déployé ; en-tête intérieur `354 × 34` avec marges externes de `10` |
| Stepper du nombre de Tours | Contrôle inline ; valeur de `1..99` sans ouverture de modale ; alignement et dimensions suivent le Figma actif ; aucun chevron de repli |
| Icône Tour | composant DSF `Icon / Tour` (`3066:4685`) ; dessin `18 × 18` ; trait `1,35` ; `color.textPrimary` (`#141414`) ; actif `assets/icons/icon-tour.svg` ; clé `icon.tour` |

Dans `Composition / Circuit Section`, le groupe `Nombre de tours` + synthèse mesure `33` points de haut et est centré verticalement face au sélecteur. La synthèse utilise `type.caption` (`11/13`), `color.textSecondary` et un espacement vertical de `4` points sous le titre. Son calcul consomme la Durée synthétique des Exercices et exclut toujours le `Compte à rebours initial` et la `Fin de séance`, éléments structurels hors Circuit. Ces valeurs réemploient les tokens existants ; aucun nouveau token n’est créé. Les variantes `State=Collapsed` et `State=Expanded` partagent strictement cet en-tête.

##### Source canonique de l’icône Tour

Le composant DSF `Icon / Tour` (`3066:4685`) est l’unique source Figma autorisée. Son dessin provient de l’icône validée dans la frame `Nouvelle séance — Nom renseigné` (`2028:12003`), ancien nœud graphique local `2028:12040`, désormais remplacé dans l’écran par une instance du composant DSF. La référence exportable unique est `assets/icons/icon-tour.svg`, déclarée sous la clé `icon.tour` dans `assets/icons/manifest.json` et destinée à `KodjoIcon name="icon-tour"`. L’ancienne géométrie `20 × 20`, les copies `icon/contenu-principal` et toute autre entrée de manifeste concurrente ne sont plus canoniques.

| Écran concerné | Frame | Instance `Icon / Tour` |
| --- | --- | --- |
| Nouvelle séance — État initial | `2028:11137` | `I3067:4835;3067:247` |
| Modal — Abandonner la création de la séance | `2028:11298` | `3272:4126` |
| Modal — Paramétrer le compte à rebours initial | `2028:11375` | `3272:4131` |
| Modal — Paramétrer la fin de séance | `2028:11457` | `3272:4136` |
| Composition — Nombre de tours — stepper intégré permanent | `2028:11700` | `4913:7432` |
| Composition d’une séance — sans Cycle | `2028:11700` | `3272:4146` |
| Composition d’une séance — actions glissées | `2028:11808` | `3272:4151` |
| Composition d’une séance — sélecteur couleur ouvert | `2028:11921` | `3272:4156` |
| Nouvelle séance — Nom renseigné | `2028:12003` | `3272:4161` |
| Composition d'une séance — Appui long — carte soulevée | `3518:4576` | État transitoire du bloc `Composition / Activity Row with Recovery` (`3572:64`) |

L’état de déplacement par appui long ne crée pas un second composant. Il applique temporairement au bloc Exercice + Récupération les dimensions `362 × 97`, le bleu du bandeau supérieur, un fond interne transparent, un contour `1` point `#D1D1D6`, un rayon `12` et une ombre `#14171F` à `22 %` avec décalage `0 / 0`, flou `10` et étalement `2`. Au repos, le bloc reprend `354 × 93`; sans Récupération, la carte conserve `354 × 69`. La persistance de l’ordre intervient uniquement après une dépose valide via `API-COM-06`.

Les tokens Figma associés sont `component/wheel/compact-height`, `component/wheel/numeric-compact-width`, `component/wheel/selection-column-width`, `component/wheel/action-bar-height`, `component/wheel/content-height`, `component/wheel/action-hit-target`, `component/wheel/action-visual-box`, `component/wheel/action-icon`, `component/action/circular-visual-box`, `component/action/circular-icon`, `color/wheel-action/cancel-background`, `color/wheel-action/confirm-background`, `color/wheel-action/cancel-icon` et `color/wheel-action/confirm-icon`. Les primitives `dimension/38` (`VariableID:3641:68`), `dimension/53` (`VariableID:3644:68`), `dimension/144` (`VariableID:3644:69`) et `dimension/203` (`VariableID:3644:70`) valent respectivement `38`, `53`, `144` et `203`. `component/action/circular-visual-box` (`VariableID:3641:69`) aliasse `dimension/38`, puis `component/wheel/action-visual-box` (`VariableID:3078:61`) aliasse ce token sémantique. `component/wheel/action-bar-height` (`VariableID:3072:4056`) aliasse `dimension/53`; `component/wheel/numeric-compact-width` (`VariableID:3218:4021`) aliasse `dimension/144`; `component/wheel/compact-height` (`VariableID:3072:4060`) aliasse `dimension/203`. `component/wheel/action-hit-target` (`VariableID:3072:4057`) et `size/touch-target-min` (`VariableID:2612:10`) restent aliasés à `dimension/48` (`VariableID:2290:37`). `component/action/circular-icon` (`VariableID:3648:68`) et `component/wheel/action-icon` (`VariableID:3072:4058`) aliasent `dimension/24` (`VariableID:2290:30`). Ces tokens décrivent `Action / Back` (`2624:3105`) et le component set unique `Picker / Popover — Source exact` (`2537:1174`), notamment les variantes `Type=Duration` et `Type=Numeric wheel`, dans la section `Forms` du Design System Foundation ; aucune seconde famille de composant Wheel ne doit être créée.

### Règles de dimensionnement des composants

- Les largeurs utilisent le flux Flexbox, `width: '100%'`, des contraintes `minWidth` / `maxWidth` et les marges du palier ; aucune largeur de `354`, `302` ou position `x/y` du Figma n’est recopiée directement.
- Les hauteurs contenant du texte sont des minima et non des valeurs fixes.
- Les groupes horizontaux utilisent `flexWrap` ou basculent en colonne lorsque la largeur minimale de leurs enfants n’est plus disponible.
- Les icônes conservent leur taille visuelle et leur ratio ; seule leur cible tactile s’étend.
- La taille visuelle et la cible tactile sont deux propriétés distinctes. Une icône, un radio, un interrupteur, un contrôle segmenté ou une action compacte de `32` à `42` points n’est pas agrandi visuellement lorsque sa dimension est intentionnelle. Un conteneur interactif transparent ou un `hitSlop` porte sa cible effective à `44 × 44` au minimum, sans réduire les dimensions spécifiques de `48 × 48`.
- Deux cibles tactiles voisines ne se chevauchent pas. Elles sont réparties en zones contiguës ou séparées afin qu’un même point de contact ne puisse déclencher deux actions différentes.
- Les boutons d’action principaux, dont `Enregistrer` dans la Synthèse, possèdent une hauteur visible minimale de `48` points. Les anciennes zones explicitement tactiles de `42 × 42` sont normalisées à `48 × 48` dans le Figma.
- Les images de marque utilisent `contain` et conservent leur ratio d’origine.
- Les listes utilisent un composant virtualisé lorsqu’elles peuvent croître ; leur `contentContainerStyle` réserve l’espace de la navigation ou de l’action finale.
- La zone visible d’une liste s’arrête avant la navigation fixe ; son conteneur réserve la hauteur de la navigation, l’inset inférieur et `16` points de respiration. Le contenu peut continuer à défiler dans cette zone, mais il n’est jamais rendu par-dessus la navigation.
- Les formulaires utilisent un mécanisme de Keyboard Avoiding adapté à la plateforme et permettent de faire défiler le champ actif au-dessus du clavier.
- Les modales basses limitent leur hauteur à `85 %` de la hauteur sûre et rendent leur contenu interne défilant au-delà.
- Un contrôle segmenté est un conteneur horizontal dont chaque option utilise `flex: 1`. Le fond sélectionné appartient au segment et non à l’écran ; texte et fond sont centrés dans la même zone.
- La navigation basse du MVP est un composant unique à quatre destinations `Catalogues / Calendrier / Suivi / Profil`, sans contrôle Recherche (D-221/D-225).
- Les actions situées à droite d’une carte sont regroupées dans un conteneur `row` aligné en fin de carte. Le groupe possède une marge droite interne de `6` et un espacement fixe entre actions ; aucune action n’utilise une coordonnée calculée depuis la largeur de l’écran.
- Les cadres de synthèse utilisent `width: '100%'`, un padding horizontal canonique et une hauteur minimale. Le texte est multi-ligne et détermine la hauteur finale ; `numberOfLines` et une hauteur fixe ne doivent pas masquer ou faire dépasser le contenu.
- Dans le formulaire Exercice, le récapitulatif est un frère du groupe de paramètres et non son enfant. Le layout principal utilise un espace flexible entre les paramètres et ce récapitulatif pour maintenir ce dernier au-dessus de l’action finale. Le code ne doit pas reproduire les coordonnées absolues du gabarit.
- Le sélecteur de rappel utilise trois zones sœurs : option fixe `Aucun`, `ScrollView` horizontal pour les choix rapides, option fixe `Personnalisé`. Le défilement ne déplace pas les options fixes et accepte l’ajout de délais rapides sans modifier la structure du composant.
- La barre de jours du Calendrier utilise `width: '100%'` et sept cellules de même poids (`flex: 1`). Les espacements sont inclus dans la largeur disponible : aucune cellule ne conserve la largeur ou la position du gabarit `402`.
- Le groupe `Série / Tour` de l’Exécution comporte deux zones flexibles symétriques et un séparateur central fixe. Il ne repose sur aucune coordonnée absolue et reste sur une ligne à partir de `360` points avec le texte à `100 %` ou `135 %` ; à une taille d’accessibilité supérieure, son conteneur peut grandir verticalement sans rendre les valeurs ambiguës.
- La progression par Tours est contenue dans un parent de largeur utile avec débordement masqué. Pour `n` Tours, la largeur de chaque segment est calculée à partir de la largeur disponible après déduction des `n - 1` espacements ; aucune largeur de segment provenant du Figma n’est codée en dur.

### Matrice de validation responsive

Chaque écran principal, état vide, carte déployée, sélecteur et modale critique est contrôlé au minimum dans la matrice suivante :

| Profil de test | Dimensions logiques indicatives | Plateformes | Texte |
| --- | --- | --- | --- |
| Petit téléphone | `360 × 640` ou hauteur équivalente | Android, puis iOS compact disponible | `100 %` et `135 %` |
| Téléphone iOS compact | `375 × 667` ou équivalent | iOS | `100 %` et `135 %` |
| Référence Figma | `402 × 874` | iOS et Android | `100 %` |
| Grand téléphone | `430–440 × 900+` | iOS et Android | `100 %` et `135 %` |
| Accessibilité | Une largeur compacte et une largeur standard | iOS et Android | Taille proche de `200 %` |

Pour chaque profil, les critères sont : aucun chevauchement, aucune action essentielle masquée, aucun texte principal tronqué sans règle, aucune cible tactile insuffisante, aucun contenu sous les barres système, clavier ou navigation, et conservation de l’ordre fonctionnel.

Les captures comparatives automatisées utilisent `402 × 874` pour la non-régression visuelle. Les autres profils contrôlent l’adaptation et ne doivent pas être comparés par redimensionnement proportionnel à la capture Figma.

## 12.27 Risques techniques et validations préalables

Trois sujets doivent faire l’objet de validations techniques précoces.

### RT-001 — Timer, audio et arrière-plan

Un spike technique obligatoire doit être réalisé avant le développement complet du moteur d’Exécution, sur au moins un appareil iOS réel et un appareil Android réel.

Il doit vérifier :
- fonctionnement au premier plan ;
- maintien de la cohérence temporelle en arrière-plan ;
- verrouillage et déverrouillage de l’écran ;
- suspension et reprise de l’application, y compris après une interruption prolongée ;
- reconstruction exacte de l’état au retour au premier plan ;
- transitions automatiques entre Exercices ;
- déclenchement des sons ;
- synthèse vocale ;
- vibrations ;
- notifications locales lorsque pertinentes ;
- interactions avec le mode silencieux, les écouteurs / Bluetooth et les autres sources audio.

Les simulateurs restent utiles pendant le développement mais ne constituent pas, à eux seuls, une validation suffisante de ces comportements.

Les résultats du spike sont documentés avant validation du moteur d’Exécution. Toute limitation de plateforme identifiée donne lieu soit à une adaptation technique, soit, si le comportement cible n’est pas réalisable, à une règle fonctionnelle explicite. Les résultats peuvent conduire à adapter l’implémentation technique sans remettre en cause le modèle fonctionnel de l’Exécution.

Ce point constitue le principal risque technique identifié du MVP et une condition de sortie du socle technique.

### RT-002 — Drizzle ORM / Expo

**Statut : réalisé et clôturé en T01-S01.**

Le spike a évalué la compatibilité entre la version stable d’Expo retenue, `expo-sqlite` et Drizzle ORM. La combinaison Drizzle ORM / Expo a été jugée insuffisamment stable. Le repli prévu a été appliqué : SQLite et les Repositories sont conservés, avec accès direct à `expo-sqlite` et sans Drizzle ORM. Cette conclusion est normative et enregistrée par D-043.

### RT-003 — Comportement audio réel

Le comportement de la synthèse vocale et de l’audio doit être validé sur appareils physiques dans les configurations réellement utilisées :
- mode silencieux ;
- écran verrouillé ;
- arrière-plan ;
- écouteurs / Bluetooth ;
- autre application audio active.

## 12.28 Distribution

Le développement est d’abord distribué sous forme de versions privées de test.

La stratégie prévue est :
1. développement local ;
2. tests automatisés ;
3. builds de développement ;
4. tests sur appareils réels iOS et Android ;
5. distribution privée à des testeurs ;
6. correction et stabilisation ;
7. préparation des versions destinées aux stores.

La publication publique sur l’App Store et Google Play intervient uniquement après validation fonctionnelle et technique du MVP.

## 12.29 Évolutivité

L’architecture du MVP doit permettre sans refonte majeure :
- l’ajout de comptes Apple ou Google ;
- la sauvegarde et synchronisation cloud ;
- le multi-appareils ;
- la monétisation et les abonnements ;
- les intégrations calendrier ;
- le partage de Séances ;
- les fonctions kiné/coach ;
- les médias distants ;
- l’ajout éventuel d’un backend ;
- une évolution future vers d’autres plateformes.

Cette capacité d’évolution ne doit toutefois pas conduire à implémenter dans le MVP des composants qui ne sont pas nécessaires à son fonctionnement.

## 12.30 Organisation du code

Le code est organisé principalement par domaine fonctionnel. Le dossier `app/` d’Expo Router porte les routes et les points d’entrée des écrans, sans contenir la logique métier principale.

Arborescence cible :

```text
app/
  routes et écrans Expo Router

src/
  features/
    sessions/
    composition/
    planning/
    execution/
    history/
    preferences/
    reference-data/

  domain/
    types et règles métier transverses

  infrastructure/
    database/
    notifications/
    audio/
    speech/
    haptics/
    files/

  shared/
    ui/
    utils/
    errors/
    i18n/

e2e/
```

Principes :
- une fonction métier doit pouvoir être retrouvée principalement dans son domaine ;
- les éléments réellement communs sont placés dans `shared/` ;
- les accès aux capacités techniques et natives sont placés dans `infrastructure/` ;
- les tests unitaires restent proches du code testé et les tests end-to-end sont séparés dans `e2e/` ;
- aucun dossier global `store/` n’est créé au démarrage, Zustand ou Redux n’étant pas retenus pour le MVP ;
- les noms techniques du code sont en anglais et restent explicitement rattachables aux concepts du glossaire français.

## 12.31 Architecture UI, accessibilité et responsive

Le MVP utilise un seul système UI de référence, issu des écrans Figma validés et décliné par les Screen Shells documentés au §12.26. Les Shells sont des variantes structurelles de ce système commun, et non des Design Systems concurrents.

L’architecture UI sépare :
- la logique fonctionnelle ;
- les composants de présentation ;
- le design system.

Les propriétés visuelles communes sont centralisées sous forme de design tokens, notamment :
- couleurs ;
- typographies ;
- espacements ;
- rayons ;
- tailles d’icônes ;
- autres dimensions visuelles partagées.

Cette séparation doit permettre une évolution ultérieure du design, y compris une refonte par un designer ou l’introduction de variantes de présentation, sans modifier le domaine métier ni le moteur d’Exécution.

Le MVP applique dès le socle les principes essentiels d’accessibilité :
- textes lisibles ;
- contrastes suffisants ;
- zones tactiles adaptées ;
- libellés accessibles pour les contrôles importants ;
- support raisonnable de l’agrandissement système du texte sans casser les écrans critiques.

L’interface est responsive pour les principales tailles d’écran iOS et Android. Le MVP est conçu, utilisé et testé en orientation portrait. Les composants ne doivent toutefois pas dépendre de dimensions d’écran codées en dur afin de permettre l’ajout ultérieur d’interfaces paysage sans refonte du code métier ou de l’architecture UI.

Une interface spécifique tablette et le mode sombre sont hors MVP. Une revue d’accessibilité est réalisée avant livraison, sans reporter à cette étape l’application des règles de base.

## 12.32 Stratégie de développement incrémental

Le MVP est développé et validé progressivement. Les premières versions de développement ne reproduisent volontairement pas l’intégralité des écrans et fonctions Figma ; elles servent à valider les briques fonctionnelles et techniques avant d’ajouter la complexité suivante.

Ordre de développement retenu :

1. **Socle technique** : React Native / Expo, TypeScript, SQLite, architecture, tests, design tokens et préparation i18n.
2. **Spike technique critique** : timer, arrière-plan, écran verrouillé, audio, voix et vibrations sur iOS et Android.
3. **Séance simple** : création et modification d’une Séance avec quelques Exercices et un Cycle technique déjà fixé à 1.
4. **Premier moteur d’Exécution bout-en-bout** : démarrage, timer, pause, Exercice suivant, arrêt et fin.
5. **Structure complète du MVP** : Tour et ses répétitions, Cycle technique masqué, Récupération, Compte à rebours initial et Fin de Séance.
6. **Exécution complète** : règles, sons, annonces, confirmations, interruptions et Instantané.
7. **Historique / Suivi**.
8. **Planification / Agenda / notifications locales**.
9. **Catégories, Zones corporelles et Préférences (écran Profil)** : CRUD des Catégories ; référentiel persistant des Zones corporelles administrable par l’utilisateur (lister, créer, renommer, supprimer) et sélection multiple sur les Exercices ; Profil et Préférences.
10. **Robustesse, accessibilité, responsive, tests end-to-end et stabilisation**.

Chaque étape doit être fonctionnelle et testée avant de servir de base à la suivante. Les validations sur appareils réels sont réalisées dès qu’un comportement dépend d’iOS ou Android. Figma reste la référence UI cible ; l’ordre de développement ne modifie pas le périmètre fonctionnel du MVP.

## 12.33 Réconciliation après interruption technique

Si l’application est interrompue alors qu’une Exécution est `En cours`, celle-ci n’est pas clôturée automatiquement. Au retour au premier plan ou au prochain démarrage, l’état sauvegardé est détecté et l’utilisateur doit choisir entre **Reprendre la séance** et **Arrêter la séance**. Tant que ce choix n’est pas effectué, le démarrage d’une nouvelle Exécution est bloqué. `Arrêter la séance` clôt l’Exécution au statut `Interrompue` et ouvre la fin minimale dans T04 ; la Synthèse appartient à la tranche qui la livre.

## 12.34 Architecture cible — Exercices, Médias et Parcours

SQLite porte les définitions d’Exercices, les copies de Séance, les associations ordonnées, les Parcours, leurs étapes et les métadonnées média. Les photos et vidéos résident dans le stockage interne de l’application sous URI stable ; aucun binaire n’est enregistré en base. Un service de références compte les usages actifs et historiques avant tout nettoyage physique.

Le domaine sépare `ActivityDefinitionRepository`, `SessionActivityRepository`, `MediaAssetRepository` et `CircuitRepository`. `CompositionService` orchestre la copie complète d’une définition dans une Séance. `CircuitExecutionService` fige les instantanés, crée les Exécutions de Séance liées et pilote l’écran de transition.

Le schéma d’`ActivityDefinition` utilise `executionMode ∈ {DURATION, REPETITIONS, TO_FAILURE}` et persiste le nombre de Séries canonique, la Pause entre Séries, `sideRecoverySeconds` et `sideMode`. `SessionActivity` ajoute `postActivityRecoverySeconds`. La Durée totale et le pilote Séries/Durée totale restent dérivés. Les Résultats distinguent les métriques des phases `SIDE_RECOVERY` et `POST_ACTIVITY_RECOVERY`. Les migrations conservent les Exercices MVP comme `SessionActivity`; elles ne créent pas silencieusement de références de catalogue. Les médias de la cible post-T05 utilisent capture ou photothèque, copie locale, miniature vidéo et lecture manuelle. La synchronisation distante reste séparée.

### Sources de données du Catalogue

| Segment | MVP | V2 |
|---|---|---|
| Exercices | désactivé, aucune requête | `ActivityDefinitionRepository` |
| Séances | `SessionRepository` | `SessionRepository` |
| Parcours | désactivé, aucune requête | `CircuitRepository` |

Le filtrage et le tri sont des paramètres de requête indépendants du segment. L’ordre par défaut est `updatedAt DESC`; l’exécution d’une Séance ne modifie jamais `updatedAt`.

### Composants et tokens Figma

Les composants d’éditeur et de Composition restent la base visuelle, mais le composant historique `Composition / Activity Row with Recovery` (`3572:64`) est **supersédé sur la sémantique récupération par D-208** : la donnée post-activité reste systématique, y compris à `0 s` ; D-238 supprime ensuite sa ligne visible, et l’éditeur utilise une récupération entre côtés conditionnelle. Les états d’écran de calcul sont `3580:4733` (Séries pilote), `3580:4845` (Durée totale pilote) et `3580:4957` (durée ajustée).

Les alias Figma sont bijectifs et explicites :

| Primitive Figma | Token sémantique Figma | Rôle |
| --- | --- | --- |
| `color/media/surface-F6F6FF` | `color/media/surface` | Surface Média |
| `color/media/border-CDCEFA` | `color/media/border` | Bordure Média |
| `color/overlay/scrim-1F2129-34` | `color/overlay/scrim` | Voile bloquant des roulettes ouvertes |
| `color/blue/selection-5F60EE` | `color/selection` | Contour du contrôle pilote après confirmation ; alias exact `VariableID:2290:52` → `VariableID:2290:3` |

Toutes les roulettes ouvertes recouvrent le shell par `color/overlay/scrim`; aucune interaction ni aucun défilement de l’arrière-plan n’est possible tant que la roulette est ouverte.

## Architecture de la bilatéralité

Le domaine expose `sideMode` avec les valeurs exactes `UNILATERAL`, `RIGHT_LEFT`, `LEFT_RIGHT`, et `executionSide` avec `NONE`, `RIGHT`, `LEFT`. Les repositories persistants conservent `side_mode` sur l’Exercice de catalogue et l’occurrence de Séance. Le champ historique équivalent du Tour est conservé pour compatibilité/non-régression, reste `UNILATERAL` et n’est pas exposé à la mutation utilisateur dans la version actuelle. Les nœuds d’instantané conservent la direction effective de l’Exercice ; les résultats conservent le côté.

Le générateur de Plan est l’unique composant autorisé à développer les passages. Dans la version actuelle, il ne développe aucune bilatéralité portée par le Tour : le Tour est traité fonctionnellement `UNILATERAL`. La capacité technique historique est conservée sans être exposée ni modifiée par l’utilisateur. Il applique la priorité du Tour, empêche tout double multiplicateur et produit des identifiants stables incluant répétition de Tour, Exercice, Série et côté. La commande d’activation recherche d’abord les enfants propres `RIGHT_LEFT` ou `LEFT_RIGHT`. Sans enfant concerné, elle met directement le Tour à jour. Avec enfant concerné et confirmation, une transaction met à jour le parent et remet uniquement ces enfants à `UNILATERAL`; une annulation n’écrit rien. La migration affecte `UNILATERAL` et `NONE` aux données historiques sans créer de duplicata.

Les services de calcul utilisent des fonctions pures couvrant les deux valeurs de `L`, l’arrondi `.5` vers le haut, les bornes et le recalcul. Les tests combinent trois modes × trois réglages × Exercice/Tour × Séries × Pauses/Récupérations × interruptions. Les tests d’intégration vérifient l’ordre `D→G` et `G→D`, l’idempotence des résultats, la reprise, la progression monotone, les annonces uniques et la préservation du premier côté lors d’une réinitialisation du second.

Le DSF normalise `Controls / Sides — Source exact` (`3704:5021`) à `74 × 42 pt` pour toutes ses variantes ; il est déjà placé ligne 2, colonne 1 sous `Séries`. `Controls / Tour Sides — Source exact` (`3705:5021`) reste `42 × 34 pt`, avec `8 pt` après le cadre numérique `66 × 34 pt` dans `2028:11743`. `Indicator / Sides — Source exact` (`3706:5020`) reste `42 × 20 pt` dans les informations secondaires de carte. Les descriptions DSF portent les libellés accessibles, les conditions de désactivation et de confirmation. Cette rectification ne crée aucun token, champ, enum ou calcul.

Le Shell d’Exécution affiche un texte secondaire centré de 16 points sous le nom de l’Exercice pour le côté courant. Les écrans unilatéraux le masquent. Cette présentation réutilise les couleurs et la typographie existantes ; aucun nouveau token n’est requis.

## Architecture MVP T03 — Catalogue des Exercices et moteur multi-origine

T03 livre le Catalogue des Exercices et le sous-ensemble du moteur nécessaire à l’Exécution directe d’un Exercice. T04 étend ensuite ce moteur partagé à l’Exécution structurée des Séances, sans dupliquer la machine à états. Le Catalogue des Exercices réutilise le Shell du Catalogue et sépare les responsabilités existantes : lecture et cycle de vie des `ActivityDefinition`, copie ordonnée par `CompositionService`, lancement par `ExecutionService` et retour d’état de navigation par la couche de présentation. Aucun service réseau ni stockage parallèle n’est introduit.

Pour la couche de présentation du Catalogue et de l’éditeur autonome, `src/features/activities/` est le périmètre feature dédié : écrans, composants et adaptateurs UI propres aux Exercices persistantes y résident. Le domaine reste dans `src/domain/activities/` et l’accès SQLite dans `src/infrastructure/database/`; aucune règle métier ni persistance n’est dupliquée dans la feature. Les composants réellement partagés avec la Composition ou les autres écrans restent dans les espaces partagés existants. Cette séparation justifie l’introduction de `src/features/activities/` sans créer un second domaine.

### Moteur d’Exécution multi-origine

Le moteur d’Exécution reçoit un `ExecutionSource` discriminé : `SessionSnapshotSource` ou `ActivitySnapshotSource`. Un adaptateur construit un plan commun ; la machine à états, les minuteries, les résultats, la persistance et la reprise restent partagés.

L’adaptateur `ACTIVITY` ajoute `DIRECT_PREPARE(5 s)`, développe l’Exercice, puis clôt sans `SESSION_END`. La persistance stocke l’origine et l’instantané autonome. Les agrégateurs sélectionnent uniquement les métriques compatibles et n’incrémentent pas le compteur de Séances.

La navigation conserve un état de retour sérialisable du Catalogue. Les tests couvrent au minimum : les trois modes, Séries multiples, Pause nulle/non nulle, Récupération, trois directions, interruption/reprise, suppression de la source, Synthèse obligatoire, Suivi et non-comptage d’une Séance.


### Icônes vectorielles de sélection multiple

Les pictogrammes de `CE-COMP-SEL-01` proviennent des composants locaux DSF du fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg` :

| Usage | Composant Figma | ID / clé | Tokens liés |
|---|---|---|---|
| Recherche dans le panneau | `Icon / Search` | `3847:5508` / `8468835f0e5ce8676ea419e838c19dccddac0d71` | trait `color/icon-neutral` — `VariableID:2290:59` |
| Exercice sélectionnée | `Icon / Selection Check` | `3847:5512` / `27a55ca50eec5411d0e087bbf6bd6f0222c0ebf4` | fond `color/selection` — `VariableID:2290:52` ; liseré et coche blancs — `VariableID:2290:5` |

Chaque composant possède un cadre vectoriel `24 × 24 pt`. L’implémentation réutilise l’asset exporté ou son équivalent code connecté au composant, sans caractère Unicode, emoji, glyphe de police, icône système ni redessin approximatif. La cible tactile appartient au contrôle hôte et reste au minimum `48 × 48 pt`.

## Architecture cible — média pendant l’Exécution

La conception D-203 impose des propriétés techniques observables sans imposer de bibliothèque :
- le lecteur média est découplé du moteur d’Exécution ; afficher ou lire un média ne suspend pas le moteur ;
- la galerie consomme un ordre déterministe des médias ;
- la face et l’index courant vivent dans un état de séance transitoire, non dans les données métier persistées ;
- l’animation de retournement reste purement UI ;
- le lecteur vidéo gère pause/reprise explicite et absence d’autoplay ;
- le mixage audio permet un **ducking** temporaire de la vidéo pendant les annonces vocales KODJO ;
- le plein écran autorise la rotation de l’appareil et conserve un overlay d’Exécution alimenté par l’état courant du moteur ;
- une transition de fin d’Exercice ferme tout média de l’Exercice terminé avant d’afficher l’étape suivante ;
- une erreur de chargement média reste confinée au média concerné.

Cette cible reste post-MVP tant qu’une tranche d’implémentation n’est pas décidée.

## 12.35 Source polymorphe des Routines — D-206

La persistance des Routines doit représenter une **source discriminée** : `SESSION` ou `ACTIVITY`, avec exactement un identifiant de source associé. Le choix physique des colonnes reste technique, mais le modèle ne doit pas dupliquer deux moteurs de planification distincts.

Les services de calcul d’occurrences, rappels locaux, prochaine occurrence et historique d’occurrence consomment cette source générique. Au démarrage depuis une occurrence :
- une source `SESSION` crée une Exécution d’origine `SESSION` et son Instantané de Séance ;
- une source `ACTIVITY` crée une Exécution d’origine `ACTIVITY` et son Instantané autonome d’Exercice.

La suppression ou l’archivage de la source doit arrêter ses occurrences futures selon les règles métier, sans supprimer les Exécutions ni Instantanés historiques. Les noms physiques de champs et migrations seront définis au développement ; l’exigence produit est l’unicité de la source et l’absence de second système de planification propre aux Exercices.

## 12.36 Extensibilité de la source Routine — Parcours

Le discriminateur de source de Routine doit rester extensible. L’implémentation MVP couvre `SESSION` et `ACTIVITY`; la version qui livre la planification des Parcours ajoute `CIRCUIT` comme troisième valeur technique. Cette extension doit réutiliser le même stockage de Routine, le même calcul d’occurrences, le même ordonnanceur de rappels et les mêmes services de Calendrier. Aucun schéma ou moteur parallèle dédié aux Parcours ne doit être introduit.

## 12.37 Schéma cible des récupérations — D-208

Le champ historique générique `recovery_seconds` ne constitue plus le schéma cible. La persistance cible sépare :
- `ActivityDefinition.side_recovery_seconds` — récupération intrinsèque entre côtés, pertinente uniquement en bilatéral ;
- `SessionActivity.post_activity_recovery_seconds` — récupération contextuelle après occurrence, valeur obligatoire pouvant être `0`.

Le même principe s’applique aux occurrences d’Exercice d’un Parcours lorsque ce modèle est livré. La base étant réinitialisable pour cette évolution, aucune migration utilisateur n’est exigée dans la documentation cible ; l’implémentation doit néanmoins produire directement le schéma cible.

Le moteur ne déduit jamais une récupération post-exercice à partir de l’adjacence. Il lit la valeur portée par l’occurrence. Une Exécution directe d’`ActivityDefinition` ignore toute récupération post-exercice et ne peut produire que `SIDE_RECOVERY` lorsqu’elle est bilatérale.

## 12.38 Impacts techniques de la consolidation D-209 à D-217

Le schéma cible doit pouvoir représenter : (1) le Circuit interne et son nombre de Tours sans confondre ce concept avec l’entité autonome Parcours ; (2) Catégorie obligatoire et associations Zones corporelles `1..n` sur `ActivityDefinition`; (3) retrait logique d’une valeur de référentiel tout en conservant les références existantes et, pour Étiquette/Catégorie, sa couleur ; (4) un booléen de Séance activé par défaut pour inclure/exclure ensemble les phases Compte à rebours d’exercice et Fin d’exercice.

Les défauts Profil sont lus à la création uniquement : aucune synchronisation réactive ni indicateur d’héritage n’est requis. Le générateur de Plan développe les Points d’arrêt internes au Circuit à chaque Tour et ordonne, après un Exercice, `POST_ACTIVITY_RECOVERY` avant le Point d’arrêt. Les identifiants techniques historiques peuvent rester inchangés jusqu’à une refactorisation explicitement planifiée.


**D-219 — composants de saisie.** Les durées conservent les pickers/roulettes en modale basse. Les entiers simples `Nombre de Séries`, `Nombre de répétitions` et `Nombre de Tours` utilisent un stepper inline. L’implémentation réutilise en priorité un composant standard/DSF compatible React Native/Expo ; un contrôle ad hoc équivalent ne doit pas être recréé sans contrainte technique documentée.


## 28 septembre 2026 — contraintes DSF avant développement

L’implémentation de la navigation et des composants visuels respecte D-224 à D-230 : fonds, dégradés de contexte, navigation 322×62 et intégration écran, halos/actions circulaires, steppers/badges, clipping des listes et gabarits de modales/roulettes. Ces valeurs sont centralisées dans les tokens/composants du Design System plutôt que dupliquées écran par écran. Aucun composant ni route de Recherche globale/Catalogue n’est requis pour le MVP (D-221).


### Référence DSF V2 détaillée — clôture 28 septembre 2026

- **Navigation basse** : pilule `322 × 62 px`, `#FCFCFE`, stroke blanc 1 px, ombre `rgba(26,26,38,0.08)` blur/rayon 10 offset `0,2`; token `color/navigation/pill`. Icône Profil selon D-233/D-236 dans boîte 32×32 ; actif `#0508E5`, inactif `#5C636E`. Cadre actif `76 × 50 px`, bleu `#0508E5` à 10 %. Boîtes d’icônes aux abscisses 68/146/224/302 dans la référence 402 px, soit 28 px entre bord de pilule et boîte extrême et 78 px entre centres. Intégration écran : 16 px sous la pilule, bande opaque 16 px puis dégradé transparent→fond sur 40 px ; ces bandes appartiennent à l’écran.
- **Fond / contexte** : écran ordinaire `#FFFFFF`; Splash `#0006F1`; média plein écran `#0A0A0C`. Zone de contexte `#EAEAFF`→transparent sur les 20 % inférieurs pour Catalogues, Composition, Calendrier, Suivi, Profil et Ajout d’exercice. Le séparateur 1 px n’est retiré que si ce dégradé assure la séparation.
- **Halo et action circulaire** : halo Annuler/Retour blanc opaque `59,28 px`, placé devant la zone de contexte et hors du conteneur clippé ; bouton circulaire clair `32 × 32`, `#FCFCFE`, stroke blanc 1 px, ombre `rgba(26,26,38,0.08)` blur 10 offset `0,2`.
- **Stepper / valeur** : variante lavande `#F2F2FF` pour Profil/paramètres, variante blanche pour Tours de Composition ; `−/+` ronds bleus, 12 px autour de la valeur centrale. Le stepper remplace la valeur sur la même ligne sans étirer le groupe ; un seul stepper actif à la fois. Badge replié `#F4F4F8`, texte bleu Semi Bold 13 px, rayon 6, marges 8 px horizontales et 2 px verticales ; contour bleu 1,5 px lorsque le contrôle est ouvert (DSF V2 lot 3, T4). Le nombre de semaines utilise la pilule de stepper rayon 18.
- **Point d’arrêt** : bouton rond blanc opaque, icône Pause, contour 1 px `#0508E5`; l’action complète porte le contour. Les occurrences de Composition utilisent cette référence commune.
- **Ressenti** : ne pas confondre contrôle de choix et pictogramme de résultat. Résultats : vert Bien, orange Neutre, rouge Mal ; rouge source `#EF4444`. Aucun état actif Figma ne prouve un contrôle « Mal sélectionné ».
- **Profil** : titres de section Semi Bold 16 px ; `Modifier` en `#0508E5`; groupes blancs 126 px ; zone de contexte 115 px ; ouverture d’un stepper sans étirement du groupe.
- **Exécution** : sur les cinq écrans portant `Zone — Progression et suite`, début `y=449`, hauteur `305 px`. Dans la variante haute avec texte, conserver 95 px avant la zone. Variante média : `Série X/3 • Tour X/3` en Roboto Condensed Medium 24 px.
- **Cartes avec photo** : D-238 remplace l’ancien état média déployé ; Photo supprime Déployer. Les variantes média d’Exécution conservent leur fonctionnement propre.


### Générateur de phrase v10.2

Implémenter le générateur comme fonction pure au-dessus des paramètres de l’Exercice. La bibliothèque de fragments et les règles de sélection sont celles de D-232 ; le calcul Répétitions utilise la constante `r=2 s`. Le jeu de 7 états d’entrée + 36 cas du classeur v10 doit être transcrit en tests paramétrés. Aucun texte Figma ne doit être utilisé comme source de vérité fonctionnelle.


### Validation du générateur v10.2

Le générateur est une fonction pure et déterministe conforme à D-232. Les bornes sont validées au domaine : Séries `1..99`, Répétitions `1..100`, Durée par Série `1..5999 s`, pauses inter-Séries/inter-côtés `0..300 s`. Les steppers de réglage du Profil appliquent `±5 s` jusqu’à `120 s`, puis `±30 s` jusqu’à `300 s`, avec transition `115 s → 120 s → 150 s`. Dans l'éditeur d'Exercice, les durées de pause utilisent des roulettes sur le même domaine de valeurs. La valeur Profil de pause au changement de côté est copiée dans l’Exercice lors de sa première applicabilité. En V1, `r=2 s` est fourni à l’unique fonction de calcul ; la stratégie V2 de lecture/copie depuis le Profil reste hors périmètre MVP et À CLARIFIER.

## DSF courant — Cartes, icônes et animations d’appui (30 septembre 2026)

Décisions finales du propriétaire : les 17 points sont clos ; aucune question ouverte. RG-1 à RG-13 s’appliquent avec RG-3 seule reportée (Séance sans vignette). RG-4 retire Déployer de l’exercice avec photo. Les cartes du Catalogue, des choix et de Composition n’affichent plus pauses/récupérations ; les Catalogues n’affichent plus la prochaine planification. Les données, calculs et fonctions de planification restent inchangés. D-195, D-206 et D-208 sont révisées uniquement sur ces règles d’affichage (D-238).

Synthèses : « N séries de X », « N séries de N rép. », « N séries à l’échec » ; bilatéralité par miroir dans les variantes concernées. Heure Semaine « 08:00 », Suivi « 18 h 42 ». Séance sans étiquette : catégories de ses exercices ; listes de catégories/zones séparées par un point médian et tronquées avec « … ». Choix sans badge durée ; récurrence du Calendrier Semaine dans la carte déployée seulement.

RG-10 : le Profil porte une préférence silhouette facultative, homme/femme ; absence = homme affiché. Elle ne pilote que l’icône de zone corporelle, sans filtre, recherche ou effet métier. RG-11 à RG-13 : vignette 64 centrée et recadrée sans déformation (couverture pour une vidéo), place réservée pendant chargement/erreur, texte alternatif égal au nom de l’exercice.

D-239 : Calendrier Jour est une exception compacte (séance 298 × 46, exercice 298 × 48, x=80, hauteur d’instance adaptée à l’événement), avec barre colorée 4, nature 26, titre 13 gras, heure/durée 11, lecture 26 et aucun Déployer. Les deux sets comportent 10 variantes chacun. Suivi — Vue d’ensemble est hors MVP. Les boutons Calendrier Aujourd’hui/Planifier restent à 32, sans cible 44 ajoutée : situation acceptée, à revoir et développer après T04. Les nouvelles icônes sont nommées icon/<nom>, les anciennes ne sont pas renommées ; target est réservé au Programme, pulse aux rapports/Suivi.

Implémentation attendue : conserver la préférence dans le mécanisme persistant du Profil existant ; résoudre le défaut homme dans la présentation ; réutiliser les médias déjà associés, sans import supplémentaire. Les écarts d’assemblage Photo et exercice déployé sont documentés dans le complément, sans prétendre les avoir corrigés dans les écrans.

Référence normative ciblée : [DSF — Cartes, icônes et appuis](../DSF-CARTES-ICONES-APPUIS-2026-09-30.md). Ces règles finales prévalent sur les anciennes formulations d’affichage du présent chapitre dans ce périmètre uniquement.

Appuis — D-237 : la spécification figée v2 du 29 septembre impose une dilatation au contact, un retour au relâchement et une action immédiate au relâchement, sans attendre le ressort. Annulation hors cible : retour sans action ; nouvel appui : reprise depuis l’état courant. Stepper indépendant (450 ms puis 150 ms pour la répétition) et réduction des animations par opacité seule. Paramètres et preuves dans le complément DSF.
