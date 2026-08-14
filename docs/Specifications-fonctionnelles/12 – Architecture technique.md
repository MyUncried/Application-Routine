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
| Médias | Stockage local ; références conservées dans le modèle |
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
        ├── Médias
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
| `CompositionService` | Gestion des Cycles, Sets, Activités et de leur ordre |
| `PlanningService` | Gestion des Routines et calcul des occurrences |
| `ExecutionService` | Génération du plan d’exécution, timer, progression et commandes pendant l’Exécution |
| `HistoryService` | Exécutions, Instantanés, occurrences historisées et consultation de l’historique |
| `PreferencesService` | Lecture et modification des Préférences globales |
| `ReferenceDataService` | Gestion des Catégories et consultation du référentiel des Zones corporelles |

Ces services sont des composants logiques internes à l’application.

Ils ne correspondent pas à des serveurs ou microservices distincts.

## 12.5 Domaine métier

La couche Domaine contient :
- les entités définies dans le chapitre 09 ;
- les règles métier ;
- les validations ;
- les transitions d’état ;
- les calculs indépendants de l’interface et du stockage.

Les calculs de Durée estimée, Durée réelle, nombres d’Activités, progression hybride et occurrences périodiques sont implémentés comme des règles déterministes du Domaine conformément au chapitre 10. Ils ne doivent pas être redéfinis différemment dans l’interface ou la couche de persistance.

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

Les données structurées du MVP sont persistées dans une **base SQLite locale**, via `expo-sqlite`.

**Drizzle ORM** est utilisé pour la définition typée du schéma, les requêtes et la gestion des migrations, sous réserve de validation de sa compatibilité avec la version Expo retenue.

Le stockage doit notamment permettre :
- les relations entre les entités ;
- les recherches et tris ;
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
- Sets ;
- Activités ;
- Routines ;
- Catégories ;
- Exécutions ;
- Instantanés d’Exécution ;
- Occurrences historisées.

Les Zones corporelles constituent un référentiel applicatif prédéfini.

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

Les médias ne sont pas stockés comme blobs dans SQLite : la base conserve leurs métadonnées et leurs références locales ou distantes.

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

Les racines d’agrégat persistantes appartenant à l’utilisateur (notamment Séance, Routine, Exécution et Catégorie) portent une référence de propriété `ownerId` vers cet identifiant Utilisateur. Les objets enfants, tels que Cycle, Set et Activité, héritent de cette propriété par leur rattachement à leur agrégat et n’ont pas à dupliquer systématiquement `ownerId`.

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
- les répétitions du Set et du Cycle ;
- les Séries propres à chaque Exercice ;
- l'insertion de la pause éventuelle après chaque Série, avec suppression de la pause finale lorsque l'étape suivante est une Récupération explicite ;
- la progression dans le Set ;
- la progression dans le Cycle ;
- les temps écoulés ;
- les transitions entre étapes ;
- la pause et la reprise ;
- la réinitialisation de l’Activité courante ;
- le passage à l’étape suivante ;
- l’arrêt anticipé ;
- la terminaison normale.

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

Lors du retour au premier plan, l’état de l’Exécution est recalculé à partir :
- de l’étape en cours ;
- des références temporelles persistées ;
- de l’état enregistré.

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
- ou supprimée à la suite de l’archivage de sa Séance ;

les notifications futures correspondantes doivent être recalculées ou supprimées.

L’application doit tenir compte des autorisations de notification accordées ou refusées par l’utilisateur.

## 12.14 Médias

Les médias associés aux Activités sont stockés localement sur l’appareil dans le MVP.

La duplication d’une Activité ou d’une Séance ne duplique pas nécessairement le fichier physique : plusieurs associations Média peuvent référencer le même fichier local. La suppression explicite d’un média par l’utilisateur reste toujours autorisée ; elle supprime le fichier physique et retire toutes ses associations, sans supprimer ni invalider les Activités/Séances concernées.

Le stockage local du MVP privilégie la **non-duplication des données volumineuses**. Les médias ne sont pas intégrés aux Instantanés historiques et les données futures ou dérivables ne sont persistées que lorsqu’une règle fonctionnelle l’exige.

La base de données conserve une référence au fichier et ses métadonnées utiles.

Les fichiers binaires volumineux ne sont pas stockés directement dans les entités métier.

Les médias ne sont pas copiés dans les Instantanés d’Exécution.

La suppression ou la modification ultérieure d’un média ne doit pas compromettre la lisibilité fonctionnelle de l’historique.

Une évolution future pourra permettre le stockage ou la synchronisation des médias dans un service distant.

## 12.15 Instantanés et historique

Au démarrage effectif d’une Exécution, `HistoryService` conserve l’Instantané fonctionnel défini au chapitre 09.

Cet Instantané est :
- immuable ;
- indépendant des modifications futures de la Séance ;
- suffisamment complet pour restituer l’historique ;
- volontairement léger ;
- dépourvu de copie des médias.

Le format physique de stockage doit permettre de relire les anciens Instantanés même après une évolution du modèle de données.

Dans le MVP, l’Instantané est persisté sous forme de **JSON immuable** associé à l’Exécution. Les données nécessaires aux filtres du Suivi — notamment date, statut, Catégories et Zones corporelles historiques — sont conservées en parallèle sous forme de champs ou index dédiés. Le JSON constitue la photographie historique complète ; les index servent à la recherche efficace.

Les migrations futures doivent donc préserver la compatibilité avec l’historique existant.

## 12.16 Transactions et intégrité

Les opérations modifiant plusieurs objets liés doivent être atomiques lorsque leur cohérence l’exige.

Exemples :
- création d’une Séance et de sa structure initiale ;
- archivage d’une Séance et suppression de ses Routines ;
- suppression d’une Catégorie et retrait de ses associations ;
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
| ORM | **Drizzle ORM**, sous réserve de validation de compatibilité stable | Schéma et requêtes TypeScript typés, migrations ; possibilité de revenir à `expo-sqlite` direct derrière les Repositories si nécessaire |
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

### Drizzle ORM

Drizzle ORM est retenu sous réserve de validation de compatibilité stable avec la version Expo utilisée au démarrage du développement.

Son intérêt principal est de :
- définir le schéma en TypeScript ;
- disposer de requêtes typées ;
- gérer les migrations ;
- faciliter la correspondance entre le chapitre 09 et le schéma technique.

La couche Repository protège néanmoins l’application contre une dépendance forte à cet ORM. En cas de difficulté de compatibilité, `expo-sqlite` peut être utilisé directement sans remettre en cause l’architecture métier.

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

### Médias

Les médias restent dans le système de fichiers.

SQLite conserve uniquement leur référence et leurs métadonnées nécessaires.

Cette séparation évite de stocker de gros objets binaires dans la base et reste cohérente avec l’exclusion des médias des Instantanés d’Exécution.

### Tests

Les tests sont considérés comme une composante de l’architecture et non comme une étape ultérieure facultative.

La priorité est donnée :
1. au domaine métier ;
2. au moteur d’exécution ;
3. à la persistance et aux migrations ;
4. aux composants et écrans critiques ;
5. aux parcours end-to-end critiques.

La stack retenue est **Jest + `jest-expo`** pour les tests unitaires, **React Native Testing Library** pour les composants et écrans, et **Maestro** pour les parcours end-to-end après stabilisation des premiers parcours fonctionnels. Les comportements natifs sensibles restent validés sur appareils réels iOS et Android.

## 12.26 Risques techniques et validations préalables

Trois sujets doivent faire l’objet de validations techniques précoces.

### RT-001 — Timer, audio et arrière-plan

Un spike technique obligatoire doit être réalisé avant le développement complet du moteur d’Exécution, sur au moins un appareil iOS réel et un appareil Android réel.

Il doit vérifier :
- fonctionnement au premier plan ;
- maintien de la cohérence temporelle en arrière-plan ;
- verrouillage et déverrouillage de l’écran ;
- suspension et reprise de l’application, y compris après une interruption prolongée ;
- reconstruction exacte de l’état au retour au premier plan ;
- transitions automatiques entre Activités ;
- déclenchement des sons ;
- synthèse vocale ;
- vibrations ;
- notifications locales lorsque pertinentes ;
- interactions avec le mode silencieux, les écouteurs / Bluetooth et les autres sources audio.

Les simulateurs restent utiles pendant le développement mais ne constituent pas, à eux seuls, une validation suffisante de ces comportements.

Les résultats du spike sont documentés avant validation du moteur d’Exécution. Toute limitation de plateforme identifiée donne lieu soit à une adaptation technique, soit, si le comportement cible n’est pas réalisable, à une règle fonctionnelle explicite. Les résultats peuvent conduire à adapter l’implémentation technique sans remettre en cause le modèle fonctionnel de l’Exécution.

Ce point constitue le principal risque technique identifié du MVP et une condition de sortie du socle technique.

### RT-002 — Drizzle ORM / Expo

Avant de figer la couche de persistance, la compatibilité entre :
- la version stable d’Expo retenue ;
- `expo-sqlite` ;
- la version stable de Drizzle ORM ;

doit être vérifiée.

Si cette combinaison n’est pas suffisamment stable, le projet conserve SQLite et les Repositories mais utilise directement `expo-sqlite`.

### RT-003 — Comportement audio réel

Le comportement de la synthèse vocale et de l’audio doit être validé sur appareils physiques dans les configurations réellement utilisées :
- mode silencieux ;
- écran verrouillé ;
- arrière-plan ;
- écouteurs / Bluetooth ;
- autre application audio active.

## 12.27 Distribution

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

## 12.28 Évolutivité

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

## 12.29 Organisation du code

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

## 12.30 Architecture UI, accessibilité et responsive

Le MVP utilise un seul layout de référence, issu des écrans Figma validés.

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

## 12.31 Stratégie de développement incrémental

Le MVP est développé et validé progressivement. Les premières versions de développement ne reproduisent volontairement pas l’intégralité des écrans et fonctions Figma ; elles servent à valider les briques fonctionnelles et techniques avant d’ajouter la complexité suivante.

Ordre de développement retenu :

1. **Socle technique** : React Native / Expo, TypeScript, SQLite, architecture, tests, design tokens et préparation i18n.
2. **Spike technique critique** : timer, arrière-plan, écran verrouillé, audio, voix et vibrations sur iOS et Android.
3. **Séance simple** : création et modification d’une Séance avec quelques Activités, avant introduction complète des répétitions Set/Cycle.
4. **Premier moteur d’Exécution bout-en-bout** : démarrage, timer, pause, Activité suivante, arrêt et fin.
5. **Structure complète du MVP** : Set, Cycle, répétitions, Récupération, Compte à rebours initial et Fin de Séance.
6. **Exécution complète** : règles, sons, annonces, confirmations, interruptions et Instantané.
7. **Historique / Suivi**.
8. **Planification / Agenda / notifications locales**.
9. **Catégories, Zones corporelles et Préférences (écran Profil)** : CRUD des Catégories ; Zones corporelles utilisées comme référentiel prédéfini, sélectionnable et associable aux Exercices, sans création, modification ni suppression des valeurs du référentiel dans le MVP ; Profil et Préférences.
10. **Robustesse, accessibilité, responsive, tests end-to-end et stabilisation**.

Chaque étape doit être fonctionnelle et testée avant de servir de base à la suivante. Les validations sur appareils réels sont réalisées dès qu’un comportement dépend d’iOS ou Android. Figma reste la référence UI cible ; l’ordre de développement ne modifie pas le périmètre fonctionnel du MVP.

## 12.32 Réconciliation après interruption technique

Si l’application est interrompue alors qu’une Exécution est `En cours`, celle-ci n’est pas clôturée automatiquement. Au retour au premier plan ou au prochain démarrage, l’état sauvegardé est détecté et l’utilisateur doit choisir entre **Reprendre la séance** et **Arrêter la séance**. Tant que ce choix n’est pas effectué, le démarrage d’une nouvelle Exécution est bloqué. `Arrêter la séance` clôt l’Exécution au statut `Interrompue` et ouvre la Synthèse.
