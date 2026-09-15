# 4.1 Objectif

Ce chapitre présente le modèle fonctionnel de l'application et les principaux concepts métier qui la composent.

Il décrit le fonctionnement général de l'application du point de vue de l'utilisateur et du métier, sans détailler le modèle de données, les écrans ou l'implémentation technique.

Les structures de données, attributs et relations entre les objets sont décrits dans le chapitre **09 – Modèle de données fonctionnel**.

# 4.2 Principes de conception

Le modèle fonctionnel repose sur les principes suivants :

- permettre la création rapide d'une séance simple ;
- conserver une grande souplesse pour construire des séances plus élaborées ;
- distinguer clairement la séance (contenu), la routine (planification) et l'exécution de la séance ;
- garantir la conservation fidèle de l'historique des séances ;
- privilégier des concepts simples et peu nombreux ;
- préparer l'évolution vers des fonctionnalités collaboratives sans remettre en cause le modèle existant.

# 4.3 Concepts métier

Le fonctionnement de l’application repose sur les concepts principaux suivants. Les deux formes du MVP T03 sont distinguées explicitement afin qu’une Activité persistante ne soit jamais confondue avec sa copie dans une Séance.
## Utilisateur

L'utilisateur est propriétaire de l'ensemble de ses données.
Il possède notamment :
- ses séances ;
- ses routines ;
- ses catégories ;
- ses zones corporelles ;
- ses préférences globales ;
- son historique d'exécution.

Dans le MVP, l'application fonctionne avec un utilisateur local unique.
## Séance

La **séance** constitue le contenu d'un entraînement.

Elle définit :
- son nom ;
- sa couleur ;
- ses catégories ;
- sa structure (cycles, Tours et activités) ;
- ses paramètres généraux ;
- les règles de guidage.

Une séance peut être :
- créée ;
- modifiée ;
- dupliquée ;
- archivée ;
- exécutée ;
- planifiée par une ou plusieurs routines.

Une séance ne contient jamais :
- de date ;
- d'heure ;
- de paramètres de planification ;
- de résultats d'exécution.
## Cycle

Un **Cycle** est conservé comme structure technique unique de la Composition. Il ordonne les Activités placées avant le Tour, le Tour unique et les Activités placées après le Tour. Dans le MVP, son nombre de répétitions vaut toujours `1`, il n’est pas modifiable et n’est jamais affiché à l’utilisateur.
## Tour

Un **Tour** est un groupe ordonné d'Activités exécuté intégralement un nombre défini de fois.
Il est toujours contenu dans un cycle.
Un Tour possède un nombre de répétitions propre, supérieur ou égal à 1.
## Activité

Une **Activité** représente un Exercice élémentaire exécuté pendant une Séance. Le modèle cible ne possède plus de type `Exercice / Récupération` : `Récupération` est un paramètre temporel facultatif de l’Activité.

Une Activité possède un nombre de **Séries** propre, entier et supérieur ou égal à 1.

Une Série correspond à une réalisation de l’Activité selon son mode d’exécution (**Durée**, **Répétitions** ou **À l’échec**). Pour `C` Séries, une Pause éventuelle est insérée `C` fois lorsque la Récupération vaut `0`, y compris après la dernière Série, ou `C − 1` fois lorsque la Récupération est positive et remplace alors la dernière Pause. Après l’ensemble des Séries, une Récupération facultative positive est exécutée une seule fois. La Série n'est pas un conteneur structurel de la Séance et ne constitue pas une entité métier autonome.

Chaque activité possède notamment :
- un nom ;
- un mode d'exécution ;
- une durée cible, un nombre de répétitions cible ou aucune cible chiffrée en mode À l’échec ;
- un nombre de Séries ;
- une Pause facultative appliquée entre les Séries ;
- une Récupération facultative exécutée après tous les côtés d’une Activité autonome ou après chaque passage de côté d’un Tour bilatéral, `0 s` signifiant absence de phase ;
- une Durée totale calculée en mode Durée ;
- une consigne facultative ;
- une ou plusieurs zones corporelles facultatives pour les Exercices ;
- aucun média fonctionnel dans le MVP ; le modèle autorise `0..n` médias ordonnés par Activité en V2.

Lorsque la Récupération vaut `0 s`, la Pause est exécutée après la dernière Série. Lorsqu’elle est supérieure à `0 s`, la Récupération remplace cette dernière Pause et est toujours exécutée après la dernière Série, y compris pour la dernière Activité de la Séance avant `SESSION_END`.

Pour une occurrence en mode Durée : `Durée totale = Séries × Durée + (Séries − 1) × Pause + Récupération`. Le nombre de Séries est la valeur canonique persistée ; la Durée totale est dérivée. Lorsque la Durée totale est utilisée comme entrée, `Séries théoriques = (Durée totale cible − Récupération + Pause) / (Durée + Pause)`, arrondi à l’entier le plus proche avec `.5` vers le haut et un minimum de `1`, puis la Durée totale atteignable est recalculée.

### Activité de référence et Activité de Séance

Dans le MVP T03, une **Activité de référence** est une définition persistante autonome du Catalogue des Activités. Elle peut être créée, consultée, modifiée, supprimée selon son cycle de vie et exécutée directement lorsqu’elle est valide.

Une **Activité de Séance** est une copie indépendante placée avant, dans ou après le Tour d’une Séance. L’insertion depuis le Catalogue copie toutes les propriétés métier et associations média de la référence, puis rompt tout lien d’évolution : modifier ou supprimer la source ne modifie jamais la copie, et inversement. Une Activité créée directement dans une Séance ne devient pas automatiquement une référence de catalogue.
## Routine

Une routine est une **planification d'une séance**.

Elle définit :
- la séance concernée ;
- sa date de début ;
- son heure d'exécution ;
- son mode de planification affiché : `Aucune` ou `Périodique` ;
- pour une planification périodique, sa fréquence hebdomadaire, les jours de la semaine concernés et sa date de fin ;
- un rappel éventuel (0 ou 1 maximum) ;

Une routine périodique définit une seule heure d'exécution. Plusieurs exécutions d'une même séance à des horaires différents sont représentées par plusieurs routines distinctes.

Une routine ne contient jamais le contenu d'une séance.

Une même séance peut être associée à plusieurs routines.
## Exécution

Une **Exécution** représente la réalisation effective d’un contenu. Elle porte obligatoirement une origine :

- `SESSION` pour une Séance lancée manuellement ou depuis une Routine ;
- `ACTIVITY` pour une Activité persistante lancée directement depuis son Catalogue dans le MVP T03.

Une Exécution conserve un instantané immuable correspondant à son origine, les informations de déroulement et les résultats produits. Une Exécution `SESSION` peut référencer la Routine éventuellement utilisée. Une Exécution `ACTIVITY` ne crée aucune Séance artificielle et ne contient ni Tour, ni Cycle, ni phase `SESSION_END`.

Chaque Exécution est indépendante des modifications ou suppressions ultérieures de sa source.
## Préférences globales

Les préférences globales regroupent les paramètres personnels utilisés comme valeurs par défaut lors de la création et de l'utilisation des séances et des routines.  
Elles peuvent être modifiées dans le Profil. Leur modification n'altère pas rétroactivement les séances ou routines déjà créées.

Elles comprennent :

**Préférences de création d'une séance :**

- la durée par défaut du compte à rebours initial ;
- le texte vocal par défaut du compte à rebours initial ;
- la durée par défaut de la fin de séance ;
- le texte vocal par défaut de la fin de séance.

**Préférences de planification :**

- les paramètres par défaut des rappels associés aux routines.

**Préférences d'exécution :**

- les sons ;
- les annonces vocales ;
- les vibrations.

Les préférences utilisées comme valeurs par défaut sont copiées dans la séance ou la routine lors de sa création lorsque le paramètre est propre à cet objet. Une modification ultérieure des préférences globales ne modifie donc pas les objets existants.

## Référentiels utilisateur

L'application utilise des référentiels personnalisables permettant à chaque utilisateur d'adapter certains éléments du modèle fonctionnel à ses besoins.

Dans le MVP, deux référentiels sont disponibles :
- **Catégories**, utilisées pour classer les séances.
- **Zones corporelles**, utilisées pour qualifier les activités de type Exercice.

Les Catégories sont personnalisables par l'utilisateur. Les Zones corporelles constituent en revanche un référentiel prédéfini dans le MVP : elles peuvent être sélectionnées pour les Exercices mais ne peuvent pas être créées, renommées ou supprimées par l'utilisateur.

# 4.4 Structure d'une séance

Le modèle fonctionnel repose sur une hiérarchie de concepts métier : Séance → Cycle → Tour → Activité. Chaque niveau apporte une responsabilité distincte.

Une séance comprend, dans l'ordre :
1. un Compte à rebours initial ;
2. un **Cycle technique unique**, fixé à une répétition ;
3. zéro, une ou plusieurs Activités avant le Tour ;
4. un **Tour unique**, contenant zéro, une ou plusieurs Activités et répété de 1 à 99 fois ;
5. zéro, une ou plusieurs Activités après le Tour ;
6. une Fin de séance.

Dans le Plan d’Exécution, ces phases sont typées `INITIAL_COUNTDOWN`, `ACTIVITY`, `SERIES_PAUSE`, `RECOVERY` et `SESSION_END`. `RECOVERY` est une phase appartenant à l’Activité qui la précède, jamais une Activité autonome. Après la dernière Série, la Récupération non nulle est exécutée avant l’Activité suivante ou avant `SESSION_END`. Seule l’expiration de `SESSION_END`, immédiate lorsque sa durée vaut `0 s`, termine l’Exécution et autorise son enregistrement final.

Le compte à rebours initial et la fin de séance sont des éléments structurels obligatoires et ne constituent pas des Activités. Leur durée peut être égale à 0 s.

Le modèle distingue trois mesures temporelles. La **Durée synthétique des Activités**, utilisée dans le Catalogue et la synthèse du Tour de la Composition, développe les occurrences d’Activités mais exclut le Compte à rebours initial et la Fin de séance. La **Durée estimée d’exécution**, utilisée pendant l’Exécution, couvre le Plan complet et inclut ces deux phases structurelles. Le **temps total écoulé** et la **Durée réelle** couvrent toutes les phases effectivement exécutées, y compris ces deux phases, mais excluent les Pauses déclenchées manuellement par l’utilisateur.

Le **Cycle** contient un **Tour unique** et peut également contenir des Activités ordonnées avant et après ce Tour. Sa répétition est fixée à `1` dans le MVP.

Le **Tour** possède également son propre nombre de répétitions.

Chaque **Tour** regroupe une suite ordonnée d'Activités. Les Activités placées hors du Tour sont exécutées une seule fois, avant ou après les répétitions du Tour selon leur position.

Une **Activité** possède un mode `Durée`, `Répétitions` ou `À l’échec`, un nombre de Séries propre, une Pause facultative entre les Séries et une Récupération facultative après l’ensemble des Séries.

Dans le MVP :
- une Séance contient exactement un Cycle technique ;
- ce Cycle contient exactement un Tour ;
- le Cycle est exécuté une seule fois et n’est jamais exposé dans l’interface ;
- le nombre de répétitions du Tour reste configurable de 1 à 99.

L'ordre général d'exécution est le suivant :

```
Compte à rebours initial

Cycle technique × 1 — non affiché
├── Activité avant le Tour
├── Tour × N
│      ├── Activité
│      ├── Activité
│      └── Activité
└── Activité après le Tour
```

Le déroulement d'un cycle est donc :

```
Exécuter une fois le Cycle technique :

    Exécuter les Activités placées avant le Tour
    Répéter N fois le Tour et ses Activités
    Exécuter les Activités placées après le Tour
```

Cette organisation permet de construire des séances simples comme des séances complexes tout en conservant un nombre limité de concepts métier.

Dans l’interface de Composition, un appui long sur la carte d’une Activité amorce son déplacement. L’état soulevé est transitoire et ne modifie aucune donnée ; seule la dépose à une position valide déclenche la mise à jour de la position structurelle et de l’ordre. Un toucher court conserve l’ouverture de l’Activité en modification.

# 4.5 Déroulement d'une séance

Lorsqu'une séance est démarrée :

1. un instantané de la séance est créé ;
2. le moteur construit le plan d'exécution ;
3. les activités sont exécutées dans l'ordre prévu ;
4. les informations d'exécution sont enregistrées ;
5. les résultats sont sauvegardés.

Le plan d'exécution constitue une structure interne générée automatiquement au démarrage de chaque séance.

Il n'est jamais manipulé directement par l'utilisateur.

# 4.6 Guidage de l'utilisateur

Pendant une séance, l'application accompagne l'utilisateur grâce à différents mécanismes de guidage.

Elle affiche notamment :

- l'activité en cours ;
- l'activité suivante ;
- le temps restant ou écoulé ;
- la progression dans la séance ;
- les Tours et cycles en cours.

Le guidage sonore peut comprendre :

- une annonce vocale du nom de chaque activité au début de son exécution ;
- un bip grave pendant les exercices chronométrés ;
- un bip aigu pendant les trois dernières secondes de toute étape chronométrée.

Les annonces vocales, les bips et les vibrations fonctionnelles de séance peuvent être activés ou désactivés indépendamment selon les préférences de l'utilisateur. Le retour haptique d'interface produit par les roulettes numériques est distinct de ces vibrations fonctionnelles : il est systématique et n'est pas piloté par la préférence `Vibrations`.

La couleur de la séance peut être utilisée pour faciliter son identification dans les différents écrans de l'application.

# 4.7 Historisation

L'application distingue systématiquement :

- la définition d'une séance ;
- son exécution réelle.

Chaque exécution conserve son propre instantané de la séance exécutée.

Ainsi :

- une modification d'une routine n'affecte jamais les séances passées ;
- les données prévues restent distinctes des données réellement exécutées ;
- l'historique demeure fidèle à ce qui s'est réellement déroulé.

# 4.8 Périmètre du MVP

La première version permet notamment :
- créer, modifier, dupliquer, archiver et supprimer des séances ;
- créer, modifier et supprimer des routines de planification ;
- créer et modifier des activités ;
- organiser les Activités dans le Tour et définir les nombres de répétitions du Tour et du Cycle ;
- associer plusieurs catégories à une séance ;
- associer des zones corporelles aux exercices ;
- exécuter une séance ;
- suspendre puis reprendre une séance ;
- consulter l'historique des séances ;
- personnaliser les préférences globales.

Ne sont pas inclus dans le MVP :

- synchronisation cloud ;
- partage de routines ;
- communautés ;
- comptes multi-utilisateurs ;
- relation avec un professionnel de santé ;
- exceptions de planification ;
- notifications avancées ;
- intelligence artificielle.

# 4.9 Extension validée du modèle

L’Activité possède deux formes distinctes : la **référence autonome** du Catalogue T03 et la **copie de Séance**. L’ajout d’une référence copie toutes ses propriétés métier, dont la Pause et la Récupération, ainsi que ses associations média ; la position avant, dans ou après le Tour appartient uniquement à la copie. Aucune modification ne se propage ensuite entre ces objets.

Une Activité accepte `Durée`, `Répétitions` ou `À l’échec`. Le troisième mode ne porte ni durée cible ni répétitions cibles. La Récupération éventuelle reste une phase chronométrée indépendante du mode.

La nouvelle structure est exécutée par T04, y compris les Séries multiples, les Tours multiples et les passages bilatéraux décrits dans le Plan d’Exécution.

Le Média est un actif local immuable associé par une relation ordonnée à `0..n` Activités. Plusieurs associations peuvent référencer le même fichier sans duplication physique. Une suppression d’association ou de référence ne supprime le fichier que lorsqu’aucune entité ni aucun instantané ne le référence.

Le Circuit est une racine persistante V2 possédant nom, couleur, mode de transition et liste ordonnée d’Étapes de Circuit. Chaque étape référence une Séance ; une même Séance peut apparaître plusieurs fois. Le Circuit reflète les modifications de ses Séances jusqu’au lancement, puis l’Exécution de Circuit utilise un instantané immuable.

## Modèle fonctionnel de bilatéralité

Une Activité persistante, son occurrence copiée dans une Séance et un Tour portent un `sideMode` parmi `UNILATERAL`, `RIGHT_LEFT` et `LEFT_RIGHT`, avec `UNILATERAL` par défaut. La copie à l’insertion et la duplication conservent la valeur ; la copie devient ensuite indépendante de sa source.

La direction effective est résolue une seule fois : celle du Tour si celui-ci est bilatéral, sinon celle de l’Activité. L’activation bilatérale d’un Tour recherche d’abord les Activités propres `RIGHT_LEFT` ou `LEFT_RIGHT`. Si aucune n’existe — Tour vide compris — la direction est appliquée directement. Sinon, après confirmation, le Tour prend la direction choisie et les seules Activités concernées sont remises à `UNILATERAL` dans une opération atomique ; `Annuler` ne modifie aucune donnée. Sous un Tour bilatéral, les contrôles enfants restent visibles, propres `UNILATERAL` et désactivés. La désactivation ultérieure du Tour ne restaure aucune ancienne valeur.

Le Plan d’Exécution mémorise la direction effective et le côté courant. Chaque Résultat d’Activité porte `executionSide = RIGHT | LEFT | NONE`. Le statut global est dérivé des résultats des passages : tous terminés produit `Terminée`, au moins un résultat partiel ou un côté manquant après avancement produit `Partielle`, et aucun passage commencé produit `Non commencée`.

## Exécution directe d’une Activité — MVP T03

Une `ActivityDefinition` valide constitue un contenu exécutable. Son lancement produit une Exécution d’origine `ACTIVITY` fondée sur un instantané autonome. Cet instantané contient toutes les données nécessaires à l’exécution, mais aucune structure de Séance, aucun Tour artificiel et aucune phase `SESSION_END`.

La préparation de `5 s` appartient au contexte d’Exécution, pas à l’Activité. Les règles propres aux modes, Séries, Pauses, côtés et Récupération sont identiques à celles d’une Activité autonome de Séance.
