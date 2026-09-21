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

Le fonctionnement de l’application repose sur les concepts principaux suivants. À partir du MVP T03, les deux formes d’Activité sont distinguées explicitement afin qu’une Activité persistante ne soit jamais confondue avec sa copie dans une Séance.

## Utilisateur

L'utilisateur est propriétaire de l'ensemble de ses données.
Il possède notamment :
- ses séances ;
- ses Activités persistantes ;
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
- sa structure (Cycle technique, Tour et Activités) ;
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

Un **Cycle** est conservé comme structure technique unique de la Composition. Il ordonne les Activités placées avant le Tour, le Tour unique et les Activités placées après le Tour. Dans le MVP, son nombre de répétitions vaut toujours `1`, il n’est pas modifiable et n’est jamais affiché à l’utilisateur.

## Tour

Un **Tour** est un groupe ordonné d'Activités exécuté intégralement un nombre défini de fois. Il est toujours contenu dans le Cycle technique unique du MVP. Son nombre de répétitions est compris entre `1` et `99`.

## Activité

Une **Activité** représente un Exercice élémentaire défini par l’utilisateur. À partir de T03, elle peut exister comme définition persistante autonome du Catalogue des activités (`ActivityDefinition`) ou comme copie appartenant à une Séance (`SessionActivity`). Le modèle ne possède plus de type `Exercice / Récupération` : `Récupération` est un paramètre temporel facultatif de l’Activité.

Une Activité possède un nombre de **Séries** propre, entier et supérieur ou égal à 1.

Une Série correspond à une réalisation de l’Activité selon son mode d’exécution (**Durée**, **Répétitions** ou **À l’échec**). Pour `C` Séries d’un même côté, avec une Pause `B` et une Récupération `R`, le nombre d’occurrences de Pause est `P(C,R) = C` si `R = 0`, sinon `C − 1`. Ainsi, lorsque `R = 0`, une Pause éventuelle intervient aussi après la dernière Série ; lorsque `R > 0`, la Récupération remplace cette dernière Pause. La Série n'est pas un conteneur structurel de la Séance et ne constitue pas une entité métier autonome.

Chaque Activité possède notamment :
- un nom ;
- un mode d'exécution ;
- une durée cible, un nombre de répétitions cible ou aucune cible chiffrée en mode À l’échec ;
- un nombre de Séries ;
- une Pause facultative régie par D-156 ;
- une Récupération facultative exécutée après tous les côtés d’une Activité autonome ou après chaque passage de côté d’un Tour bilatéral, `0 s` signifiant absence de phase ;
- une Durée totale calculée ou estimée ;
- une consigne facultative ;
- une ou plusieurs zones corporelles facultatives ;
- aucun média fonctionnel dans le MVP T03 ; l’architecture prépare `0..n` médias ordonnés par Activité pour une évolution post-MVP.

Lorsque la Récupération vaut `0 s`, la Pause éventuelle est exécutée après la dernière Série. Lorsqu’elle est supérieure à `0 s`, la Récupération remplace cette dernière Pause. Pour une Activité autonome, elle intervient une fois après tous les côtés ; dans un Tour bilatéral, une Récupération intervient à la fin de chaque passage de côté.

En mode Durée, avec `L = 1` en unilatéral ou `2` en bilatéral, `C` le nombre de Séries par côté, `A` la durée cible par Série, `B` la Pause et `R` la Récupération : `D = L × [C × A + P(C,R) × B] + R`, avec `P(C,R) = C` si `R = 0`, sinon `C − 1`. Le nombre de Séries est la valeur canonique persistée ; la Durée totale est dérivée. Lorsque la Durée totale pilote, les formules inverses de D-156 s’appliquent, puis le nombre de Séries est arrondi selon la règle validée et la durée réalisable est recalculée.

En modes Répétitions et À l’échec, `Durée totale` reste affichée mais n’attribue aucune durée conventionnelle au travail non chronométré : elle est présentée comme `Durée totale : ≥ {durée connue}` en additionnant seulement les temps déterminables.

### Activité de référence et Activité de Séance

Dans le MVP T03, une **Activité de référence** (`ActivityDefinition`) est une définition persistante autonome du Catalogue des activités. Son cycle de vie comprend création, consultation/modification, archivage, restauration et suppression définitive depuis les archives. Elle peut être exécutée directement lorsqu’elle est valide.

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
- `ACTIVITY` pour une Activité persistante lancée directement depuis le Catalogue des activités dans le MVP T03.

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
- les **Catégories** sont utilisées pour classer les Séances et peuvent être personnalisées selon les règles applicables ;
- les **Zones corporelles** qualifient les Activités et constituent un référentiel applicatif prédéfini : elles peuvent être sélectionnées mais ne peuvent pas être créées, renommées ou supprimées par l'utilisateur.

# 4.4 Structure d'une séance

Le modèle fonctionnel repose sur une hiérarchie : Séance → Cycle technique → Tour → Activité. Chaque niveau apporte une responsabilité distincte.

Une Séance comprend, dans l'ordre :
1. un Compte à rebours initial ;
2. un **Cycle technique unique**, fixé à une répétition ;
3. zéro, une ou plusieurs Activités avant le Tour ;
4. un **Tour unique**, contenant zéro, une ou plusieurs Activités et répété de 1 à 99 fois ;
5. zéro, une ou plusieurs Activités après le Tour ;
6. une Fin de séance.

Des **Points d’arrêt** optionnels peuvent être insérés entre deux unités exécutables successives de cette structure, avant, dans ou après le Tour selon la transition visée. Ils possèdent une position propre dans l’ordre de Composition, peuvent être déplacés indépendamment, ne peuvent être ni le premier ni le dernier élément d’une séquence et ne peuvent pas être consécutifs. Un Point d’arrêt placé dans le Tour est rencontré à chaque répétition du Tour.

Dans le Plan d’Exécution d’une Séance, les phases exécutées sont typées `INITIAL_COUNTDOWN`, `ACTIVITY`, `SERIES_PAUSE`, `RECOVERY` et `SESSION_END`. Un Point d’arrêt est un marqueur structurel de transition, pas une phase d’Activité ni une phase chronométrée. `RECOVERY` est une phase appartenant à l’Activité qui la précède, jamais une Activité autonome. Seule l’expiration de `SESSION_END`, immédiate lorsque sa durée vaut `0 s`, termine normalement l’Exécution de Séance et autorise son enregistrement final.

Le Compte à rebours initial et la Fin de séance sont des éléments structurels obligatoires et ne constituent pas des Activités. Leur durée peut être égale à `0 s`. Ils ne sont jamais déplaçables et n’acceptent aucun appui long de réorganisation.

Le modèle distingue trois mesures temporelles. La **Durée synthétique des Activités**, utilisée dans le Catalogue et la synthèse du Tour de la Composition, développe les occurrences d’Activités mais exclut le Compte à rebours initial et la Fin de séance. La **Durée estimée d’exécution**, utilisée pendant l’Exécution de Séance, couvre le Plan complet et inclut ces deux phases structurelles. Le **temps total écoulé** et la **Durée réelle** couvrent les phases effectivement exécutées, mais excluent les Pauses déclenchées manuellement par l’utilisateur et le temps d’attente aux Points d’arrêt. Cette exclusion vaut également pour l’exécution future d’un Circuit utilisant le même mécanisme.

Le **Cycle** contient le **Tour unique** et les Activités ordonnées avant et après ce Tour. Sa répétition est fixée à `1` dans le MVP.

Chaque **Tour** regroupe une suite ordonnée d'Activités. Les Activités placées hors du Tour sont exécutées une seule fois, avant ou après les répétitions du Tour selon leur position.

Une **Activité** possède un mode `Durée`, `Répétitions` ou `À l’échec`, un nombre de Séries propre, une Pause facultative régie par D-156 et une Récupération facultative.

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
│      ├── Point d’arrêt optionnel
│      ├── Activité
│      └── Activité
└── Activité après le Tour

Fin de séance
```

Le déroulement du Cycle est donc :

```
Exécuter une fois le Cycle technique :
    Exécuter les Activités placées avant le Tour
    Répéter N fois le Tour et ses Activités
    Exécuter les Activités placées après le Tour
```

Cette organisation permet de construire des séances simples ou plus élaborées tout en conservant un nombre limité de concepts métier.

Dans l’interface de Composition, un appui long sur la carte d’une **Activité** amorce son déplacement. L’état soulevé est transitoire et ne modifie aucune donnée ; seule la dépose à une position valide déclenche la mise à jour de la position structurelle et de l’ordre. Un toucher court conserve l’ouverture de l’Activité en modification. Cette règle ne s’applique ni au Compte à rebours initial ni à la Fin de séance.

# 4.5 Déroulement d'une séance

Lorsqu'une Séance est démarrée :

1. un instantané de la Séance est créé ;
2. le moteur construit le Plan d’Exécution en conservant les Points d’arrêt de la Composition comme marqueurs de suspension d’auto-enchaînement ;
3. les Activités sont exécutées dans l'ordre prévu ; lorsqu’un Point d’arrêt est rencontré, l’écran de l’unité suivante est préparé et affiché sans démarrage automatique ;
4. les informations d'Exécution sont enregistrées ;
5. les résultats sont sauvegardés.

Le Plan d’Exécution constitue une structure interne générée automatiquement au démarrage de chaque Séance. Il n'est jamais manipulé directement par l'utilisateur.

# 4.6 Guidage de l'utilisateur

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

# 4.7 Historisation

L'application distingue systématiquement la définition d’un contenu et son Exécution réelle.

Chaque Exécution conserve son propre instantané immuable correspondant à son origine. Ainsi :
- une modification d'une source ou d'une Routine n'affecte jamais les Exécutions passées ;
- les données prévues restent distinctes des données réellement exécutées ;
- l'historique demeure fidèle à ce qui s'est réellement déroulé ;
- la suppression définitive d’une `ActivityDefinition` ne supprime jamais les Exécutions d’Activité historiques.

# 4.8 Périmètre du MVP

Le MVP permet notamment :
- créer, modifier, dupliquer, archiver, restaurer et supprimer définitivement des Séances selon leur cycle de vie ;
- créer, modifier et supprimer des Routines de planification ;
- créer et modifier des Activités de Séance ;
- à partir de T03, gérer le cycle de vie complet des `ActivityDefinition` persistantes ;
- ajouter plusieurs Activités existantes à une Séance par copies indépendantes ;
- organiser les Activités avant, dans ou après le Tour et définir le nombre de répétitions du Tour ;
- conserver le Cycle technique unique à une répétition fixe, sans l’exposer ;
- associer plusieurs catégories à une Séance ;
- associer des zones corporelles aux Activités ;
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
- Circuits fonctionnels ;
- médias multiples fonctionnels.

# 4.9 Extension validée du modèle

L’Activité possède deux formes distinctes dans le MVP T03 : la **référence autonome** du Catalogue et la **copie de Séance**. L’ajout d’une référence copie toutes ses propriétés métier applicables ; la position avant, dans ou après le Tour appartient uniquement à la copie. Aucune modification ne se propage ensuite entre ces objets.

Une Activité accepte `Durée`, `Répétitions` ou `À l’échec`. Le troisième mode ne porte ni durée cible ni répétitions cibles. La Récupération éventuelle reste une phase chronométrée indépendante du mode.

L’Exécution directe d’Activité T03 développe uniquement le sous-ensemble autonome nécessaire aux Séries, Pauses, côtés et Récupération. T04 porte l’orchestration complète des Séances, notamment les répétitions du Tour et les passages bilatéraux décrits dans le Plan d’Exécution.

Le Média est préparé comme actif local immuable associé par une relation ordonnée à `0..n` Activités. Plusieurs associations pourront référencer le même fichier sans duplication physique. Ce comportement reste post-MVP et n’active aucun média en T03.

Le Circuit est une racine persistante préparée pour une version post-MVP, possédant nom, couleur, mode de transition et liste ordonnée d’Étapes de Circuit. Chaque étape référence une Séance ; une même Séance peut apparaître plusieurs fois. Aucun Circuit n’est fonctionnel dans T03.

## Modèle fonctionnel de bilatéralité

Une Activité persistante, son occurrence copiée dans une Séance et un Tour portent un `sideMode` parmi `UNILATERAL`, `RIGHT_LEFT` et `LEFT_RIGHT`, avec `UNILATERAL` par défaut. La copie à l’insertion et la duplication conservent la valeur ; la copie devient ensuite indépendante de sa source.

La direction effective est résolue une seule fois : celle du Tour si celui-ci est bilatéral, sinon celle de l’Activité. L’activation bilatérale d’un Tour recherche d’abord les Activités propres `RIGHT_LEFT` ou `LEFT_RIGHT`. Si aucune n’existe — Tour vide compris — la direction est appliquée directement. Sinon, après confirmation, le Tour prend la direction choisie et les seules Activités concernées sont remises à `UNILATERAL` dans une opération atomique ; `Annuler` ne modifie aucune donnée. Sous un Tour bilatéral, les contrôles enfants restent visibles, propres `UNILATERAL` et désactivés. La désactivation ultérieure du Tour ne restaure aucune ancienne valeur.

Le Plan d’Exécution mémorise la direction effective et le côté courant. Chaque Résultat d’Activité porte `executionSide = RIGHT | LEFT | NONE`. Le statut global est dérivé des résultats des passages : tous terminés produit `Terminée`, au moins un résultat partiel ou un côté manquant après avancement produit `Partielle`, et aucun passage commencé produit `Non commencée` au niveau de l’Activité concernée.

## Exécution directe d’une Activité — MVP T03

Une `ActivityDefinition` valide constitue un contenu exécutable. Son lancement produit une Exécution d’origine `ACTIVITY` fondée sur un instantané autonome. Cet instantané contient toutes les données nécessaires à l’exécution, mais aucune structure de Séance, aucun Tour artificiel et aucune phase `SESSION_END`.

La préparation de `5 s` appartient au contexte d’Exécution, pas à l’Activité. Les règles propres aux modes, Séries, Pauses, côtés et Récupération sont identiques à celles déjà validées pour une Activité autonome. Le signal de fin conduit à la Synthèse ; le Ressenti est obligatoire lorsqu’elle est présentée et le Commentaire reste facultatif.
