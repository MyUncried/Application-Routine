# 4.1 Objectif

Ce chapitre présente le modèle fonctionnel de l'application et les principaux concepts métier qui la composent.

Il décrit le fonctionnement général de l'application du point de vue de l'utilisateur et du métier, sans détailler le modèle de données, les écrans ou l'implémentation technique.

Les structures de données, attributs et relations entre les objets sont décrits dans le chapitre **09 – Modèle de données fonctionnel**.

# 4.2 Principes de conception

Le modèle fonctionnel repose sur les principes suivants :

- permettre la création rapide d'une séance simple ;
- conserver une grande souplesse pour construire des séances plus élaborées ;
- distinguer clairement la séance (contenu), la routine (planification) et l'exécution ;
- garantir la conservation fidèle de l'historique ;
- privilégier des concepts simples et peu nombreux ;
- préparer l'évolution vers des fonctionnalités collaboratives sans remettre en cause le modèle existant.

# 4.3 Concepts métier

## Classification active

Une **Étiquette** qualifie une Séance et porte sa couleur. Une **Catégorie** qualifie une Activité et porte sa couleur sémantique. Les Zones corporelles restent distinctes de la Catégorie.

Le fonctionnement de l’application repose sur les concepts principaux suivants. À partir du MVP T03, les deux formes d’Activité sont distinguées explicitement afin qu’une Activité persistante ne soit jamais confondue avec sa copie dans une Séance.

## Utilisateur

L'utilisateur est propriétaire de l'ensemble de ses données.
Il possède notamment :
- ses séances ;
- ses Exercices persistantes ;
- ses routines ;
- ses catégories ;
- ses zones corporelles ;
- ses préférences globales ;
- son historique d'exécution.

Dans le MVP, l'application fonctionne avec un utilisateur local unique.

## Séance

La **Séance** constitue le contenu d'un entraînement.

Elle définit :
- son nom ;
- sa couleur ;
- ses catégories ;
- sa structure (Cycle technique, Tour et Exercices) ;
- ses paramètres généraux ;
- les règles de guidage.

Une Séance peut être :
- créée ;
- modifiée ;
- dupliquée ;
- archivée ;
- restaurée ;
- supprimée définitivement depuis les archives ;
- exécutée ;
- planifiée par une ou plusieurs routines.

Une Séance ne contient jamais :
- de date ;
- d'heure ;
- de paramètres de planification ;
- de résultats d'exécution.

## Cycle

Un **Cycle** est conservé comme structure technique unique de la Composition. Il ordonne les Exercices placées avant le Tour, le Tour unique et les Exercices placées après le Tour. Dans le MVP, son nombre de répétitions vaut toujours `1`, il n’est pas modifiable et n’est jamais affiché à l’utilisateur.

## Tour

Un **Tour** est un groupe ordonné d'Exercices exécuté intégralement un nombre défini de fois. Il est toujours contenu dans le Cycle technique unique du MVP. Son nombre de répétitions est compris entre `1` et `99`.

## Activité

Une **Activité** représente un Exercice élémentaire défini par l’utilisateur. À partir de T03, elle peut exister comme définition persistante autonome du Catalogue des exercices (`ActivityDefinition`) ou comme copie appartenant à une Séance (`SessionActivity`). Le modèle ne possède plus de type `Exercice / Récupération` : `Récupération` est un paramètre temporel facultatif de l’Activité.

Une Activité possède un nombre de **Séries** propre, entier et supérieur ou égal à 1.

Une Série correspond à une réalisation de l’Activité selon son mode d’exécution (**Durée**, **Répétitions** ou **À l’échec**). Pour `C` Séries d’un même côté, avec une Pause `B` et une Récupération `R`, le nombre d’occurrences de Pause est `P(C,R) = C` si `R = 0`, sinon `C − 1`. Ainsi, lorsque `R = 0`, une Pause éventuelle intervient aussi après la dernière Série ; lorsque `R > 0`, la Récupération remplace cette dernière Pause. La Série n'est pas un conteneur structurel de la Séance et ne constitue pas une entité métier autonome.

Chaque Activité possède notamment :
- un nom ;
- une Catégorie d’Activité facultative ;
- une ou plusieurs Zones corporelles facultatives ;
- un mode d'exécution ;
- une durée cible, un nombre de répétitions cible ou aucune cible chiffrée en mode À l’échec ;
- un nombre de Séries ;
- une Pause facultative régie par D-156 ;
- une Récupération facultative exécutée après tous les côtés de l’Activité, `0 s` signifiant absence de phase ;
- un Changement de côté propre : `Aucun`, `D→G` ou `G→D` ;
- un Compte à rebours d’Activité facultatif ;
- une Fin d’activité facultative ;
- une Durée totale calculée ou estimée ;
- une consigne facultative ;
- un média associé peut être affiché dans la carte déployée du Catalogue dans le MVP ; les capacités d’import/capture restent régies par leur périmètre propre.

Lorsque la Récupération vaut `0 s`, la Pause éventuelle est exécutée après la dernière Série. Lorsqu’elle est supérieure à `0 s`, la Récupération remplace cette dernière Pause et intervient une fois après tous les côtés de l’Activité.

En mode Durée, avec `L = 1` en unilatéral ou `2` en bilatéral, `C` le nombre de Séries par côté, `A` la durée cible par Série, `B` la Pause et `R` la Récupération : `D = L × [C × A + P(C,R) × B] + R`, avec `P(C,R) = C` si `R = 0`, sinon `C − 1`. Le nombre de Séries est la valeur canonique persistée ; la Durée totale est dérivée. Lorsque la Durée totale pilote, les formules inverses de D-156 s’appliquent, puis le nombre de Séries est arrondi selon la règle validée et la durée réalisable est recalculée.

En modes Répétitions et À l’échec, `Durée totale` reste affichée mais n’attribue aucune durée conventionnelle au travail non chronométré : elle est présentée comme `Durée totale : ≥ {durée connue}` en additionnant seulement les temps déterminables.

### Activité de référence et Activité de Séance

Dans le MVP T03, une **Activité de référence** (`ActivityDefinition`) est une définition persistante autonome du Catalogue des exercices. Son cycle de vie comprend création, consultation/modification, archivage, restauration et suppression définitive depuis les archives. Elle peut être exécutée directement lorsqu’elle est valide.

Une **Activité de Séance** (`SessionActivity`) est une copie indépendante placée avant, dans ou après le Tour d’une Séance. L’insertion depuis le Catalogue copie toutes les propriétés métier applicables de la référence au moment de l’insertion, notamment nom, Description, mode/cible, Séries, Pause, Récupération, Zones corporelles et direction propre. La copie devient ensuite indépendante : modifier, archiver ou supprimer la source ne modifie jamais la copie, et inversement.

Une Activité créée directement dans une Séance ne devient pas automatiquement une référence de Catalogue. La migration T03 ne promeut pas les `SessionActivity` historiques en `ActivityDefinition`.

La suppression définitive d’une `ActivityDefinition` ne cascade pas vers les `SessionActivity` déjà copiées ni vers les Instantanés, Exécutions et résultats historiques.

## Routine

Une routine est une **planification d'une séance**.

Elle définit :
- la séance concernée ;
- sa date de début ;
- son heure d'exécution ;
- son mode de planification affiché : `Aucune` ou `Périodique` ;
- pour une planification périodique, sa fréquence hebdomadaire, les jours de la semaine concernés et sa date de fin ;
- un rappel éventuel (0 ou 1 maximum).

Une routine périodique définit une seule heure d'exécution. Plusieurs exécutions d'une même séance à des horaires différents sont représentées par plusieurs routines distinctes.

Une routine ne contient jamais le contenu d'une séance. Une même séance peut être associée à plusieurs routines.

## Exécution

Une **Exécution** représente la réalisation effective d’un contenu. Elle porte obligatoirement une origine :

- `SESSION` pour une Séance lancée manuellement ou depuis une Routine ;
- `ACTIVITY` pour une Activité persistante lancée directement depuis le Catalogue des exercices dans le MVP T03.

Une Exécution conserve un instantané immuable correspondant à son origine, les informations de déroulement et les résultats produits. Une Exécution `SESSION` peut référencer la Routine éventuellement utilisée. Une Exécution `ACTIVITY` ne crée aucune Séance artificielle et ne contient ni Tour, ni Cycle, ni phase `SESSION_END`.

Chaque Exécution est indépendante des modifications, archivages ou suppressions ultérieurs de sa source.

## Préférences globales

Les préférences globales regroupent les paramètres personnels utilisés comme valeurs par défaut lors de la création et de l'utilisation des séances et des routines. Elles peuvent être modifiées dans le Profil. Leur modification n'altère pas rétroactivement les séances ou routines déjà créées.

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

L'application utilise des référentiels permettant de qualifier ses contenus.

Dans le MVP :
- les **Étiquettes** sont utilisées pour classer les Séances et portent leur couleur ;
- les **Catégories** sont utilisées pour classer les Exercices et portent leur couleur sémantique ;
- les **Étiquettes**, **Catégories** et **Zones corporelles** sont des référentiels utilisateur administrables. Toutes leurs valeurs, qu’elles soient initiales ou créées ensuite par l’utilisateur, peuvent être supprimées. La suppression d’une Étiquette retire son association aux Séances courantes ; celle d’une Catégorie ou d’une Zone corporelle retire ses associations aux Exercices courantes. Les Instantanés/Exécutions historiques restent inchangés.

# 4.4 Structure d'une séance

Le modèle fonctionnel repose sur une hiérarchie : Séance → Cycle technique → Tour → Activité. Chaque niveau apporte une responsabilité distincte.

Une Séance comprend, dans l'ordre :
1. un Compte à rebours initial ;
2. un **Cycle technique unique**, fixé à une répétition ;
3. zéro, une ou plusieurs Exercices avant le Tour ;
4. un **Tour unique**, contenant zéro, une ou plusieurs Exercices et répété de 1 à 99 fois ;
5. zéro, une ou plusieurs Exercices après le Tour ;
6. une Fin de séance.

Dans le Plan d’Exécution d’une Séance, ces phases sont typées `INITIAL_COUNTDOWN`, `ACTIVITY`, `SERIES_PAUSE`, `RECOVERY` et `SESSION_END`. `RECOVERY` est une phase appartenant à l’Activité qui la précède, jamais une Activité autonome. Seule l’expiration de `SESSION_END`, immédiate lorsque sa durée vaut `0 s`, termine normalement l’Exécution de Séance et autorise son enregistrement final.

Le Compte à rebours initial et la Fin de séance sont des éléments structurels obligatoires et ne constituent pas des Exercices. Leur durée peut être égale à `0 s`. Ils ne sont jamais déplaçables et n’acceptent aucun appui long de réorganisation.

Un **Point d’arrêt** est un élément de Composition sans écran dédié. Il suspend l’enchaînement jusqu’à reprise explicite et son temps d’attente est exclu de la durée de la Séance.

Le modèle distingue trois mesures temporelles. La **Durée synthétique des Exercices**, utilisée dans le Catalogue et la synthèse du Tour de la Composition, développe les occurrences d’Exercices mais exclut le Compte à rebours initial et la Fin de séance. La **Durée estimée d’exécution**, utilisée pendant l’Exécution de Séance, couvre le Plan complet et inclut ces deux phases structurelles. Le **temps total écoulé** et la **Durée réelle** couvrent toutes les phases effectivement exécutées, mais excluent les Pauses déclenchées manuellement par l’utilisateur.

Le **Cycle** contient le **Tour unique** et les Exercices ordonnées avant et après ce Tour. Sa répétition est fixée à `1` dans le MVP.

Chaque **Tour** regroupe une suite ordonnée d'Exercices. Les Exercices placées hors du Tour sont exécutées une seule fois, avant ou après les répétitions du Tour selon leur position. Dans la version actuelle, aucun réglage de changement de côté n’est exposé au niveau du Tour ; tout support technique historique de cette propriété reste fixé à `UNILATERAL` et non modifiable. La bilatéralité reste portée par les Exercices.

Une **Activité** possède un mode `Durée`, `Répétitions` ou `À l’échec`, un nombre de Séries propre, une Pause facultative régie par D-156 et une Récupération facultative. Elle peut également définir un Compte à rebours propre et une Fin d’activité propre, distincts des phases structurelles de la Séance.

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

Fin de séance
```

Le déroulement du Cycle est donc :

```
Exécuter une fois le Cycle technique :
    Exécuter les Exercices placées avant le Tour
    Répéter N fois le Tour et ses Exercices
    Exécuter les Exercices placées après le Tour
```

Cette organisation permet de construire des séances simples ou plus élaborées tout en conservant un nombre limité de concepts métier.

Dans l’interface de Composition, un appui long sur la carte d’une **Activité** amorce son déplacement. L’état soulevé est transitoire et ne modifie aucune donnée ; seule la dépose à une position valide déclenche la mise à jour de la position structurelle et de l’ordre. Un toucher court conserve l’ouverture de l’Activité en modification. Cette règle ne s’applique ni au Compte à rebours initial ni à la Fin de séance.

# 4.5 Structure d'une Activité

Une **Activité** est une unité exécutable autonome dans son modèle fonctionnel, qu’elle soit définie comme `ActivityDefinition` dans le Catalogue ou copiée comme `SessionActivity` dans une Séance.

Elle porte :

- une identité, un nom et une Description facultative ;
- une **Catégorie** d’Activité et zéro à plusieurs **Zones corporelles** ;
- un mode d’exécution parmi `Durée`, `Répétitions` et `À l’échec` ;
- la cible du mode lorsqu’elle existe ;
- un nombre de **Séries** ;
- une **Pause** entre Séries ;
- une **Récupération** éventuelle après les Séries et côtés de l’Activité ;
- un **Changement de côté** propre : `Aucun`, `D→G` ou `G→D` ;
- un **Compte à rebours d’Activité** propre lorsqu’il est utilisé ;
- une **Fin d’activité** propre lorsqu’elle est utilisée ;
- une Durée totale dérivée ou estimée selon le mode ;
- les associations média prévues par le périmètre courant.

Le Compte à rebours d’Activité et la Fin d’activité appartiennent à l’Activité. Ils sont distincts du Compte à rebours initial et de la Fin de séance, qui restent des éléments structurels de la Séance.

La structure fonctionnelle d’une Activité peut donc être représentée ainsi :

```text
Activité
├── Compte à rebours d’Activité éventuel
├── Exécution du travail
│   ├── côté 1 éventuel
│   │   ├── Série
│   │   ├── Pause éventuelle
│   │   └── ...
│   └── côté 2 éventuel
├── Récupération éventuelle
└── Fin d’activité éventuelle
```

Une `ActivityDefinition` et une `SessionActivity` partagent ces propriétés métier. La seconde reste une copie indépendante appartenant à sa Séance.

# 4.6 Déroulement d'une Activité

Lorsqu’une Activité est exécutée, le moteur applique ses phases propres dans l’ordre fonctionnel suivant :

1. exécuter le Compte à rebours d’Activité lorsqu’il est présent ;
2. déterminer le ou les côtés à exécuter à partir du `Changement de côté` propre à l’Activité ;
3. pour chaque côté applicable, exécuter les Séries dans leur ordre ;
4. appliquer les Pauses entre Séries selon les règles de Pause/Récupération ;
5. après les côtés de l’Activité, exécuter la Récupération lorsqu’elle est non nulle ;
6. exécuter la Fin d’activité lorsqu’elle est présente ;
7. poursuivre vers l’élément suivant du Plan d’Exécution.

En mode `Durée`, chaque Série est chronométrée. En mode `Répétitions` ou `À l’échec`, l’utilisateur termine normalement la Série par l’action `Suivant`.

Le déroulement propre de l’Activité reste identique qu’elle soit exécutée directement depuis le Catalogue ou à l’intérieur d’une Séance, sous réserve des phases de contexte qui l’entourent : préparation d’Exécution directe, Compte à rebours initial de Séance, Point d’arrêt, Tour ou Fin de séance.

# 4.7 Déroulement d'une séance

Lorsqu'une Séance est démarrée :

1. un instantané de la Séance est créé ;
2. le moteur construit le Plan d’Exécution ;
3. les Exercices sont exécutées dans l'ordre prévu ;
4. les informations d'Exécution sont enregistrées ;
5. les résultats sont sauvegardés.

Le Plan d’Exécution constitue une structure interne générée automatiquement au démarrage de chaque Séance. Il n'est jamais manipulé directement par l'utilisateur.

# 4.8 Guidage de l'utilisateur

Pendant une Exécution, l'application accompagne l'utilisateur grâce à différents mécanismes de guidage.

Elle affiche notamment :
- l'Activité en cours ;
- l'Activité suivante ;
- le temps restant ou écoulé ;
- la progression ;
- les informations de Série et de Tour pertinentes, sans exposer le Cycle.

Le guidage sonore peut comprendre :
- une annonce vocale du nom de chaque Activité au début de son exécution ;
- l’annonce du côté lorsque la direction effective est bilatérale ;
- un bip grave pendant les exercices chronométrés ;
- un bip aigu pendant les trois dernières secondes de toute étape chronométrée.

Les annonces vocales, les bips et les vibrations fonctionnelles de séance peuvent être activés ou désactivés indépendamment selon les préférences de l'utilisateur. Le retour haptique d'interface produit par les roulettes numériques est distinct : il est systématique et n'est pas piloté par la préférence `Vibrations`.

# 4.9 Historisation

L'application distingue systématiquement la définition d’un contenu et son Exécution réelle.

Chaque Exécution conserve son propre instantané immuable correspondant à son origine. Ainsi :
- une modification d'une source ou d'une Routine n'affecte jamais les Exécutions passées ;
- les données prévues restent distinctes des données réellement exécutées ;
- l'historique demeure fidèle à ce qui s'est réellement déroulé ;
- la suppression définitive d’une `ActivityDefinition` ne supprime jamais les Exécutions d’Activité historiques.

# 4.10 Périmètre du MVP

Le MVP permet notamment :
- créer, modifier, dupliquer, archiver, restaurer et supprimer définitivement des Séances selon leur cycle de vie ;
- créer, modifier et supprimer des Routines de planification ;
- créer et modifier des Exercices de Séance ;
- à partir de T03, gérer le cycle de vie complet des `ActivityDefinition` persistantes ;
- ajouter plusieurs Exercices existantes à une Séance par copies indépendantes ;
- organiser les Exercices avant, dans ou après le Tour et définir le nombre de répétitions du Tour ;
- conserver le Cycle technique unique à une répétition fixe, sans l’exposer ;
- associer éventuellement une Étiquette à une Séance ;
- associer une Catégorie et des Zones corporelles aux Exercices ;
- exécuter directement une Activité persistante à partir de T03 ;
- exécuter une Séance dans T04 et les tranches associées du MVP ;
- suspendre puis reprendre une Exécution lorsque le parcours concerné le prévoit ;
- consulter l'historique ;
- personnaliser les préférences globales.

Ne sont pas inclus dans le MVP :
- synchronisation cloud ;
- partage ;
- communautés ;
- comptes multi-utilisateurs ;
- relation avec un professionnel de santé ;
- exceptions de planification ;
- notifications avancées ;
- intelligence artificielle ;
- Parcours fonctionnels ;
- médias multiples fonctionnels.

# 4.11 Extension validée du modèle

L’Activité possède deux formes distinctes dans le MVP T03 : la **référence autonome** du Catalogue et la **copie de Séance**. L’ajout d’une référence copie toutes ses propriétés métier applicables ; la position avant, dans ou après le Tour appartient uniquement à la copie. Aucune modification ne se propage ensuite entre ces objets.

Une Activité accepte `Durée`, `Répétitions` ou `À l’échec`. Le troisième mode ne porte ni durée cible ni répétitions cibles. La Récupération éventuelle reste une phase chronométrée indépendante du mode.

L’Exécution directe d’Activité T03 développe uniquement le sous-ensemble autonome nécessaire aux Séries, Pauses, côtés et Récupération. T04 porte l’orchestration complète des Séances, notamment les répétitions du Tour et les passages bilatéraux décrits dans le Plan d’Exécution.

Le Média est un actif local associé à une Activité. Dans le MVP, le Catalogue peut afficher le média associé dans une carte déployée. Les capacités d’import, capture et gestion multiple restent régies par leur périmètre propre.

Le Parcours est une racine persistante préparée pour une version post-MVP, possédant nom, couleur, mode de transition et liste ordonnée d’Étapes de Parcours. Chaque étape référence une Séance ; une même Séance peut apparaître plusieurs fois. Aucun Parcours n’est fonctionnel dans T03.

## Modèle fonctionnel de bilatéralité

Une Activité persistante et son occurrence copiée dans une Séance portent un `sideMode` parmi `UNILATERAL`, `RIGHT_LEFT` et `LEFT_RIGHT`, avec `UNILATERAL` par défaut. La copie à l’insertion et la duplication conservent la valeur ; la copie devient ensuite indépendante de sa source. Le champ technique historique équivalent du Tour peut être conservé pour compatibilité et non-régression, mais il reste fixé à `UNILATERAL` et n’est pas exposé ni modifiable dans la version actuelle.

La direction effective exposée est celle de l’Activité. Le Tour ne remplace ni ne neutralise les réglages de côté de ses Exercices dans la version actuelle.

Le Plan d’Exécution mémorise la direction effective et le côté courant. Chaque Résultat d’Activité porte `executionSide = RIGHT | LEFT | NONE`. Le statut global est dérivé des résultats des passages : tous terminés produit `Terminée`, au moins un résultat partiel ou un côté manquant après avancement produit `Partielle`, et aucun passage commencé produit `Non commencée` au niveau de l’Activité concernée.

## Exécution directe d’une Activité — MVP T03

Une `ActivityDefinition` valide constitue un contenu exécutable. Son lancement produit une Exécution d’origine `ACTIVITY` fondée sur un instantané autonome. Cet instantané contient toutes les données nécessaires à l’exécution, mais aucune structure de Séance, aucun Tour artificiel et aucune phase `SESSION_END`.

La préparation de `5 s` appartient au contexte d’Exécution, pas à l’Activité. Les règles propres aux modes, Séries, Pauses, côtés et Récupération sont identiques à celles déjà validées pour une Activité autonome. Le signal de fin conduit à la Synthèse ; le Ressenti est obligatoire lorsqu’elle est présentée et le Commentaire reste facultatif.
