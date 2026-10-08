# 4.1 Objectif

**Référence courante 07/10 :** [Pauses et symboles](SPECIFICATION-PAUSES-SYMBOLES-2026-10-07.md). Placement explicite et distinction contenu/trait conservés. **Bip de cadence et durées : la spécification Bip v2 du07/10 remplace les dispositions antérieures.**

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

Une **Étiquette** qualifie une Séance et porte sa couleur. Une **Catégorie** qualifie un Exercice et porte sa couleur sémantique. Les Zones corporelles restent distinctes de la Catégorie.

Le fonctionnement de l’application repose sur les concepts principaux suivants. À partir du MVP T03, les deux formes d’Exercice sont distinguées explicitement afin qu’un Exercice persistant ne soit jamais confondue avec sa copie dans une Séance.

## Utilisateur

L'utilisateur est propriétaire de l'ensemble de ses données.
Il possède notamment :
- ses séances ;
- ses Exercices persistants ;
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

Un **Cycle** est conservé comme structure technique unique de la Composition. Il ordonne les Exercices placés avant le Circuit, le Circuit unique et les Exercices placés après le Circuit. Dans le MVP, son nombre de répétitions vaut toujours `1`, il n’est pas modifiable et n’est jamais affiché à l’utilisateur.

## Circuit et Tour

Un **Circuit** est le groupe ordonné d’Exercices contenu dans le Cycle technique unique du MVP. Un **Tour** est une exécution complète de ce Circuit. Le nombre de Tours est compris entre `1` et `99`, avec `1` par défaut (D-209).

## Exercice

Un **Exercice** représente un Exercice élémentaire défini par l’utilisateur. À partir de T03, il peut exister comme définition persistante autonome du Catalogue des exercices (`ActivityDefinition`) ou comme copie appartenant à une Séance (`SessionActivity`). Le modèle ne possède plus de type `Exercice / Récupération`. Il distingue désormais la **Pause entre les côtés**, propriété intrinsèque éventuelle d’un Exercice bilatéral, et la **Récupération après exercice**, propriété contextuelle d’une occurrence `SessionActivity`.

Un Exercice possède un nombre de **Séries** propre, entier et supérieur ou égal à 1.

Une Série est une réalisation de l’Exercice selon son mode unique. Elle porte une cible éventuelle et une Pause, terminale comprise. En variable, ces paramètres sont propres à chaque ligne ordonnée ; en uniforme ils sont communs. La Série n’est ni un conteneur de Séance ni une entité autonome.

Chaque Exercice possède notamment :
- un nom ;
- une Catégorie d’Exercice obligatoire ;
- une ou plusieurs Zones corporelles obligatoires ;
- un mode d'exécution ;
- une durée cible, un nombre de répétitions cible ou aucune cible chiffrée en mode À l’échec ;
- un nombre de Séries ;
- une Pause facultative entre Séries successives ;
- une `sideRecoverySeconds` facultative, pertinente uniquement pour `D→G` ou `G→D`, exécutée selon l’Ordre des côtés (une fois par Exercice ou une fois par Série) ;
- un Changement de côté propre : `Aucun`, `D→G` ou `G→D` ;
- un Compte à rebours d’Exercice facultatif ;
- une Fin d’exercice facultative ;
- une Durée totale calculée ou estimée ;
- une consigne facultative ;
- un média associé est affiché dans la gouttière permanente de la carte du Catalogue dans le MVP, sans déploiement ; l’import/ajout local et les associations ordonnées sont inclus dans PRE-3 au MVP (D-333), sans activation implicite de la caméra.

La Pause et la Pause entre les côtés sont indépendantes. Avec `Aucun`, `sideRecoverySeconds` est sans objet. En bilatéral, l’ordre est : successions définies par l’Ordre des côtés (v13 §4).

Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durées selon Bip v2 et paramètres v13 : Durée exacte ; Répétitions avec bip estimées ≈ ; Répétitions sans bip et À l’échec omitted au niveau Exercice. ≥ réservé à la Séance contenant du travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel.

### Exercice de référence et Exercice de Séance

Dans le MVP T03, une **Exercice de référence** (`ActivityDefinition`) est une définition persistante autonome du Catalogue des exercices. Son cycle de vie comprend création, consultation/modification, archivage, restauration et suppression définitive depuis les archives. Elle peut être exécutée directement lorsqu’elle est valide.

Une **Exercice de Séance** (`SessionActivity`) est une copie indépendante placée avant, dans ou après le Circuit d’une Séance. L’insertion depuis le Catalogue copie les propriétés intrinsèques applicables de la référence au moment de l’insertion, notamment nom, Description, mode/cible, Séries, Pause, `sideRecoverySeconds`, Zones corporelles et direction propre. Aucune récupération automatique à la création d’une occurrence. Une récupération explicite est proposée au défaut Profil (30 s initialement) lors de son ajout ; elle reste solidaire de son occurrence. postActivityRecoverySeconds est sa projection de calcul, 0 en l’absence de récupération (D-304/D-307). La copie devient ensuite indépendante : modifier, archiver ou supprimer la source ne modifie jamais la copie, et inversement.

Un Exercice créé directement dans une Séance ne devient pas automatiquement une référence de Catalogue. La migration T03 ne promeut pas les `SessionActivity` historiques en `ActivityDefinition`.

La suppression définitive d’une `ActivityDefinition` ne cascade pas vers les `SessionActivity` déjà copiées ni vers les Instantanés, Exécutions et résultats historiques.

## Routine

Une Routine représente un créneau portant une **liste ordonnée de contenus**, Séances (`SESSION`), Exercices persistants (`ACTIVITY`) ou mélange des deux. Le créneau produit les occurrences ; chaque contenu les filtre par sa fréquence sans unité **x fois sur n** et ses positions retenues. Le cas x=n s’affiche « à chaque fois ».

Programme facultatif (« Aucun » par défaut) précède Début le. Répétition désactivée produit un créneau unique ; activée, elle expose Jour/Semaine/Mois et une borne **jusqu’au** (date) ou **pendant** (nombre d’unités). Aucun/Aucune ne sont plus des options de Rappel/Répétition : des interrupteurs portent leur absence. Rappel reste facultatif,0..1 par Routine.

La sélection utilise des cases à cocher et « Ajouter 1 élément » / « Ajouter n éléments », avec les espaces et accords usuels. Le formulaire porte Planifier sans contenu, Planifier une séance/un exercice à contenu unique, Planifier un parcours à plusieurs contenus. **Parcours est uniquement un libellé**, sans entité, catalogue ni exécution autonome. Circuit reste le groupe interne à une Séance, répété en Tours.

La spécification du 08/10 définit le comportement cible et ses points ouverts ; elle ne certifie pas une implémentation. Une Routine peut toujours partager ses sources avec d’autres Routines. Les données historiques ne sont pas réécrites.

Voir la [spécification de planification du 08/10](SPECIFICATION-PLANIFICATION-2026-10-08.md), y compris ses points ouverts ; aucune règle manquante ne se déduit des valeurs Figma.

## Exécution

Une **Exécution** représente la réalisation effective d’un contenu. Elle porte obligatoirement une origine :

- `SESSION` pour une Séance lancée manuellement ou depuis une Routine ;
- `ACTIVITY` pour un Exercice persistant lancée directement depuis le Catalogue des exercices **ou depuis une Routine**.

Une Exécution conserve un instantané immuable correspondant à son origine, les informations de déroulement et les résultats produits. Une Exécution de toute origine peut référencer la Routine éventuellement utilisée. Une Exécution `ACTIVITY` ne crée aucune Séance artificielle et ne contient ni Tour, ni Cycle, ni phase `SESSION_END`.

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
- les **Étiquettes**, **Catégories** et **Zones corporelles** sont des référentiels utilisateur administrables. Toutes leurs valeurs, qu’elles soient initiales ou créées ensuite par l’utilisateur, peuvent être supprimées. La suppression d’une valeur la retire des choix futurs tout en conservant ses associations aux Séances ou Exercices existants. Les Instantanés/Exécutions historiques restent inchangés.

# 4.4 Structure d'une séance

Le modèle fonctionnel repose sur une hiérarchie : Séance → Cycle technique → Tour → Exercice. Chaque niveau apporte une responsabilité distincte.

Une Séance comprend, dans l'ordre :
1. un Compte à rebours initial ;
2. un **Cycle technique unique**, fixé à une répétition ;
3. zéro, une ou plusieurs Exercices avant le Circuit ;
4. un **Circuit unique**, contenant zéro, une ou plusieurs Exercices et répété de 1 à 99 fois ;
5. zéro, une ou plusieurs Exercices après le Circuit ;
6. une Fin de séance.

Dans le Plan d’Exécution d’une Séance, ces phases sont typées `INITIAL_COUNTDOWN`, `ACTIVITY`, `SERIES_PAUSE`, `SIDE_RECOVERY`, `POST_ACTIVITY_RECOVERY` et `SESSION_END`. `SIDE_RECOVERY` appartient à l’Exercice bilatéral ; `POST_ACTIVITY_RECOVERY` appartient à l’occurrence de Séance. Aucune de ces phases n’est un Exercice autonome. Seule l’expiration de `SESSION_END`, immédiate lorsque sa durée vaut `0 s`, termine normalement l’Exécution de Séance et autorise son enregistrement final.

Le Compte à rebours initial et la Fin de séance sont des éléments structurels obligatoires et ne constituent pas des Exercices. Leur durée peut être égale à `0 s`. Ils ne sont jamais déplaçables et n’acceptent aucun appui long de réorganisation.

Un **Point d’arrêt** est un élément de Composition sans écran dédié. Il suspend l’enchaînement jusqu’à reprise explicite et son temps d’attente est exclu de la durée de la Séance.

Le modèle distingue trois mesures temporelles. La **Durée synthétique des Exercices**, utilisée dans le Catalogue et la synthèse du Tour de la Composition, développe les occurrences d’Exercices mais exclut le Compte à rebours initial et la Fin de séance. La **Durée estimée d’exécution**, utilisée pendant l’Exécution de Séance, couvre le Plan complet et inclut ces deux phases structurelles. Le **temps total écoulé** et la **Durée réelle** couvrent toutes les phases effectivement exécutées, mais excluent les Pauses déclenchées manuellement par l’utilisateur.

Le **Cycle** contient le **Circuit unique** et les Exercices ordonnés avant et après ce Tour. Sa répétition est fixée à `1` dans le MVP.

Le **Circuit** regroupe une suite ordonnée d'Exercices. Les Exercices placés hors du Circuit sont exécutés une seule fois, avant le premier Tour ou après le dernier Tour selon leur position. Dans la version actuelle, aucun réglage de changement de côté n’est exposé au niveau du Circuit ; tout support technique historique de cette propriété reste fixé à `UNILATERAL` et non modifiable. La bilatéralité reste portée par les Exercices.

Un **Exercice** possède un mode `Durée`, `Répétitions` ou `À l’échec`, un nombre de Séries propre, une Pause facultative entre Séries et, lorsqu’elle est bilatérale, une `sideRecoverySeconds` facultative entre les deux côtés. La Récupération après exercice n’est pas une propriété intrinsèque de l’Exercice : elle appartient à l’occurrence contextualisée. L’Exercice peut également définir un Compte à rebours propre et une Fin d’exercice propre, distincts des phases structurelles de la Séance.

Dans le MVP :
- une Séance contient exactement un Cycle technique ;
- ce Cycle contient exactement un Tour ;
- le Cycle est exécuté une seule fois et n’est jamais exposé dans l’interface ;
- le nombre de Tours du Circuit reste configurable de 1 à 99.

L'ordre général d'exécution est le suivant :

```
Compte à rebours initial

Cycle technique × 1 — non affiché
├── Exercice avant le Circuit
├── Tour × N
│      ├── Exercice
│      ├── Exercice
│      └── Exercice
└── Exercice après le Circuit

Fin de séance
```

Le déroulement du Cycle est donc :

```
Exécuter une fois le Cycle technique :
    Exécuter les Exercices placés avant le Circuit
    Répéter N fois le Tour et ses Exercices
    Exécuter les Exercices placés après le Circuit
```

Cette organisation permet de construire des séances simples ou plus élaborées tout en conservant un nombre limité de concepts métier.

Dans l’interface de Composition, un appui long sur la carte d’une **Exercice** amorce son déplacement. L’état soulevé est transitoire et ne modifie aucune donnée ; seule la dépose à une position valide déclenche la mise à jour de la position structurelle et de l’ordre. Un toucher court conserve l’ouverture de l’Exercice en modification. Cette règle ne s’applique ni au Compte à rebours initial ni à la Fin de séance.

# 4.5 Structure d'un Exercice

Un **Exercice** est une unité exécutable autonome dans son modèle fonctionnel, qu’elle soit définie comme `ActivityDefinition` dans le Catalogue ou copiée comme `SessionActivity` dans une Séance.

Les propriétés intrinsèques communes portent notamment :
- une identité, un nom et une Description facultative ;
- une **Catégorie** d’Exercice et zéro à plusieurs **Zones corporelles** ;
- un mode d’exécution parmi `Durée`, `Répétitions` et `À l’échec` ;
- la cible du mode lorsqu’elle existe ;
- un nombre de **Séries** ;
- Pi est stockée et exécutée après chaque Série, dernière comprise. À la frontière des côtés successifs, PN puis PC se cumulent. Par paire, Pi suit chaque paire, dernière comprise, et PC reste dans chaque paire. Seule la toute dernière Pause est remplacée par la récupération positive qui suit l’occurrence ; aucune récupération en direct. N=1 normalisé uniforme/par côté. Formules et séquences : Bip v2§3 et paramètres v13§§4–5.
- un **Changement de côté** propre : `Aucun`, `D→G` ou `G→D` ;
- une **Pause entre les côtés** `sideRecoverySeconds` éventuelle, pertinente uniquement en `D→G/G→D` ;
- un **Compte à rebours d’Exercice** propre lorsqu’il est utilisé ;
- une **Fin d’exercice** propre lorsqu’elle est utilisée ;
- une Durée totale intrinsèque dérivée ou estimée selon le mode ;
- les associations média prévues par le périmètre courant.

Une `ActivityDefinition` ne possède **aucune Récupération après exercice**.

Une `SessionActivity` reprend les propriétés intrinsèques applicables de la définition puis porte en plus une propriété contextuelle `postActivityRecoverySeconds`. Cette valeur est une projection des récupérations explicitement ajoutées ; aucune récupération n’est créée avec l’occurrence. Elle se déplace, se duplique et se supprime avec l’occurrence.

Le Compte à rebours d’Exercice et la Fin d’exercice appartiennent à l’Exercice. Ils sont distincts du Compte à rebours initial et de la Fin de séance, qui restent des éléments structurels de la Séance.

La structure intrinsèque d’un Exercice peut être représentée ainsi :

Le détail ordonné des phases est défini par v13 §4 pour chacun des deux ordres et les deux directions.

Dans une occurrence, R>0 se substitue à la seule Pause terminale ; R reste une donnée contextuelle, hors définition intrinsèque.

# 4.6 Déroulement d’un Exercice

L’ordre d’exécution vient du paramètre Ordre des côtés : Un côté après l’autre (défaut) ou Les deux côtés à chaque série. En bilatéral N est toujours par côté, paramètres communs aux deux côtés. Les successions et pauses sont celles de v13 §4 ; aucun repli de PC vers la Pause. Les cibles et Pauses variables proviennent de la ligne courante.

Pi est stockée et exécutée après chaque Série, dernière comprise. À la frontière des côtés successifs, PN puis PC se cumulent. Par paire, Pi suit chaque paire, dernière comprise, et PC reste dans chaque paire. Seule la toute dernière Pause est remplacée par la récupération positive qui suit l’occurrence ; aucune récupération en direct. N=1 normalisé uniforme/par côté. Formules et séquences : Bip v2§3 et paramètres v13§§4–5.

Le Compte à rebours propre précède les passages et la Fin propre reste unique à l’Exercice complet. En Durée, chaque cible Ti est chronométrée ; en Répétitions/À l’échec, Suivant termine la Série selon le contrat du mode. Construire le plan depuis les paramètres effectifs de chaque Série. Les phases terminales sont substituées avant sommation ; ne jamais ajouter une récupération déjà comprise dans To. Le plan de Séance conserve ses phases structurelles et ses Points d’arrêt.

# 4.7 Déroulement d'une séance

Lorsqu'une Séance est démarrée :

1. un instantané de la Séance est créé ;
2. le moteur construit le Plan d’Exécution ;
3. les Exercices sont exécutés dans l'ordre prévu ;
4. les informations d'Exécution sont enregistrées ;
5. les résultats sont sauvegardés.

Le Plan d’Exécution constitue une structure interne générée automatiquement au démarrage de chaque Séance. Il n'est jamais manipulé directement par l'utilisateur.

# 4.8 Guidage de l'utilisateur

Pendant une Exécution, l'application accompagne l'utilisateur grâce à différents mécanismes de guidage.

Elle affiche notamment :
- l'Exercice en cours ;
- l'Exercice suivant ;
- le temps restant ou écoulé ;
- la progression ;
- les informations de Série et de Tour pertinentes, sans exposer le Cycle.

Le guidage sonore peut comprendre :
- une annonce vocale du nom de chaque Exercice au début de son exécution ;
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
- la suppression définitive d’une `ActivityDefinition` ne supprime jamais les Exécutions d’Exercice historiques.

# 4.10 Périmètre du MVP

Le MVP permet notamment :
- créer, modifier, dupliquer, archiver, restaurer et supprimer définitivement des Séances selon leur cycle de vie ;
- créer, modifier et supprimer des Routines de planification ;
- créer et modifier des Exercices de Séance ;
- à partir de T03, gérer le cycle de vie complet des `ActivityDefinition` persistantes ;
- ajouter plusieurs Exercices existants à une Séance par copies indépendantes ;
- organiser les Exercices avant, dans ou après le Circuit et définir le nombre de Tours du Circuit ;
- conserver le Cycle technique unique à une répétition fixe, sans l’exposer ;
- associer éventuellement une Étiquette à une Séance ;
- associer une Catégorie et des Zones corporelles aux Exercices ;
- exécuter directement un Exercice persistant à partir de T03 ;
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
- Ancienne cible de Parcours autonome retirée par D-328 ;
- médias multiples fonctionnels.

# 4.11 Extension validée du modèle

L’Exercice possède deux formes distinctes dans le MVP T03 : la **référence autonome** du Catalogue et la **copie de Séance**. L’ajout d’une référence copie toutes ses propriétés métier applicables ; la position avant, dans ou après le Circuit appartient uniquement à la copie. Aucune modification ne se propage ensuite entre ces objets.

Un Exercice accepte `Durée`, `Répétitions` ou `À l’échec`. Le troisième mode ne porte ni durée cible ni répétitions cibles. La Récupération éventuelle reste une phase chronométrée indépendante du mode.

L’Exécution directe d’Exercice T03 développe uniquement le sous-ensemble autonome nécessaire aux Séries, Pauses, côtés et Récupération. T04 porte l’orchestration complète des Séances, notamment les Tours du Circuit et les passages bilatéraux décrits dans le Plan d’Exécution.

Le Média est un actif local associé à un Exercice. Dans le MVP, le Catalogue affiche le média associé dans la gouttière permanente de la carte d’Exercice, sans déploiement (D-260/D-261). L’import/ajout local et la gestion des associations ordonnées sont inclus dans PRE-3 au MVP (D-333). La capture caméra n’est pas implicitement activée.

Le modèle autonome Parcours est retiré (D-328). Le mot parcours désigne plusieurs contenus liés sur un créneau, sans objet propre ; le Circuit interne à une Séance reste conservé.

## Modèle fonctionnel de bilatéralité

Un Exercice persistant et son occurrence copiée dans une Séance portent un `sideMode` parmi `UNILATERAL`, `RIGHT_LEFT` et `LEFT_RIGHT`, avec `UNILATERAL` par défaut. La copie à l’insertion et la duplication conservent la valeur ; la copie devient ensuite indépendante de sa source. Le champ technique historique équivalent du Tour peut être conservé pour compatibilité et non-régression, mais il reste fixé à `UNILATERAL` et n’est pas exposé ni modifiable dans la version actuelle.

La direction effective exposée est celle de l’Exercice. Le Tour ne remplace ni ne neutralise les réglages de côté de ses Exercices dans la version actuelle.

Le Plan d’Exécution mémorise la direction effective et le côté courant. Chaque Résultat d’Exercice porte `executionSide = RIGHT | LEFT | NONE`. Le statut global est dérivé des résultats des passages : tous terminés produit `Terminée`, au moins un résultat partiel ou un côté manquant après avancement produit `Partielle`, et aucun passage commencé produit `Non commencée` au niveau de l’Exercice concernée.

## Exécution directe d’un Exercice — MVP T03

Une `ActivityDefinition` valide constitue un contenu exécutable. Son lancement produit une Exécution d’origine `ACTIVITY` fondée sur un instantané autonome. Cet instantané contient toutes les données nécessaires à l’exécution, mais aucune structure de Séance, aucun Tour artificiel et aucune phase `SESSION_END`.

La préparation de `5 s` appartient au contexte d’Exécution, pas à l’Exercice. Les règles propres aux modes, Séries, Pauses, côtés et Récupération sont identiques à celles déjà validées pour un Exercice autonome. Le signal de fin conduit à la Synthèse ; le Ressenti est obligatoire lorsqu’elle est présentée et le Commentaire reste facultatif.

## Modèle cible — média pendant l’Exécution

La conception post-MVP distingue :
- la collection ordonnée de Médias appartenant à l’Exercice ;
- l’état durable de l’Exercice et de son Instantané ;
- un état UI transitoire propre à la séance d’Exécution courante.

Cet état UI porte la face courante et le média courant. Il ne modifie ni l’Exercice, ni l’Instantané, ni le Plan d’Exécution, ni les résultats historiques. Le moteur d’Exécution continue de progresser lorsque la face Média ou le plein écran est affiché.

Voir `../CONCEPTION-EXECUTION-MEDIA.md`.

## Extension du contenu planifiable — Parcours

**Ancienne cible autonome retirée le 08/10/2026.** Parcours est désormais le libellé d’un créneau à plusieurs contenus, sans identité, persistance, étapes ou exécution globale propres. Programme est un conteneur distinct ; Circuit reste interne à la Séance. Voir la [spécification de planification du 08/10](SPECIFICATION-PLANIFICATION-2026-10-08.md), y compris ses points ouverts ; aucune règle manquante ne se déduit des valeurs Figma.

### Récupération après exercice portée par l’occurrence

Une `SessionActivity` porte toujours `postActivityRecoverySeconds`. La valeur `0 s` est une valeur valide et n’efface pas la propriété. La récupération suit l’occurrence lors des déplacements, duplications et suppressions. Dans le Circuit, elle est exécutée après chaque occurrence, y compris la dernière, à chaque Tour. Hors Circuit, elle est exécutée après l’occurrence ; si celle-ci est la dernière de la Séance, elle précède `SESSION_END`.

## Consolidation du modèle — D-209 à D-217

Une Séance contient un **Circuit** ordonné ; un **Tour** est une répétition de ce Circuit. `parcours` désigne seulement plusieurs contenus liés sur un créneau, sans entité autonome. Un Exercice valide possède exactement une Catégorie et une ou plusieurs Zones corporelles ; une Séance possède zéro ou une Étiquette. Ces référentiels sont classificatoires et n’influencent pas le Plan d’Exécution.

La suppression d’une valeur de référentiel la rend inactive pour les nouvelles affectations mais conserve les références existantes. Les couleurs d’Étiquette/Catégorie restent portées par le référentiel et toute modification de couleur se reflète sur les objets associés.

Les préférences du Profil initialisent les nouveaux objets puis sont découplées. Une Séance porte en outre un booléen global, activé par défaut, déterminant si les Compte à rebours d’exercice et Fin d’exercice propres à ses Exercices sont inclus dans son Plan. Ce booléen s’applique à tous les Exercices de la Séance.

Le Point d’arrêt reste un élément structurel distinct de la Récupération. Lorsqu’ils coexistent après un Exercice, la récupération est exécutée avant le Point d’arrêt. Aucun Point d’arrêt n’est permis juste après le Compte à rebours initial ni juste avant la Fin de séance. Un Point d’arrêt interne au Circuit est rejoué à chaque Tour.


### Phrase de synthèse des paramètres d’exécution

La phrase est une donnée dérivée, recalculée à chaque modification. Sans mode sélectionné elle est vide ; le mode est affiché séparément. Elle concatène dans l’ordre : nombre de Séries, valeur par Série ou `jusqu'à l'échec`, Pause après chaque série si applicable, changement de côté, puis Durée totale lorsqu’elle s’applique. Le nom de l’Exercice, le Compte à rebours, la Fin d’exercice et la Récupération post-activité n’entrent pas dans cette phrase. Source normative : v13 §§3–7, D-247 à D-255 ; classeur v10 historique.

Les bornes fonctionnelles D-232 sont : Séries `1..99`, Répétitions par Série `1..100`, Durée par Série `1 s..99 min 59 s`, Pause après chaque série et Pause entre les côtés `0..5 min`. Dans le Profil, les réglages de durée utilisent un stepper ; dans la feuille de paramètres d’un Exercice, les pauses sont réglées par stepper. Les steppers de pauses utilisent tap1s puis maintien accéléré1/5/10 selon DSF Bip ; ancienne grille dépendante de la valeur abandonnée. La Pause entre les côtés est copiée depuis le Profil lorsqu’elle devient applicable.

## Présentation des objets — 30 septembre 2026

Décisions finales du propriétaire : les 17 points du 30/09 sont clos. Révision des cartes du 03/10/2026 (D-260 à D-264) : un seul format de carte d’Exercice, avec une gouttière permanente de 64 px dans le Catalogue et les listes de sélection d’exercices ; photo si média associé, icône de nature sinon. La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture (D-264). Les Séances ne portent jamais de visuel. Aucune photo dans les listes mixtes, le Calendrier ou le Suivi. Aucun déploiement d’Exercice ni de carte du Suivi ; le déploiement des Séances reste accessible dans le Catalogue et le Calendrier Semaine. Le Suivi présente deux lignes : nature/titre/statut, puis durée/catégorie/ressenti ; sans heure, zones corporelles ni étiquettes. Le Ressenti y est un indicateur sans action, distinct de sa saisie obligatoire en Synthèse. Les variantes déployées d’Exercice et du Suivi sont historiques, hors MVP. Pauses/récupérations et prochaine planification restent absentes des cartes concernées. Les données, instantanés, calculs et fonctions de planification sont conservés.

Synthèses : « N séries de X », « N séries de N rép. », « N séries à l’échec » ; bilatéralité par miroir dans les variantes concernées. Heure Semaine « 08:00 » ; aucune heure dans la carte du Suivi. Séance sans étiquette : catégories de ses exercices ; listes de catégories/zones séparées par un point médian et tronquées avec « … ». Choix sans badge durée ; récurrence du Calendrier Semaine dans la carte déployée seulement.

RG-10 : le Profil porte une préférence silhouette facultative, homme/femme ; absence = homme affiché. Elle ne pilote que l’icône de zone corporelle, sans filtre, recherche ou effet métier. RG-11 à RG-13 : vignette 64 centrée et recadrée sans déformation (couverture pour une vidéo), place réservée pendant chargement/erreur, texte alternatif égal au nom de l’exercice.

D-239 : Calendrier Jour est une exception compacte (séance 298 × 46, exercice 298 × 48, x=80, hauteur d’instance adaptée à l’événement), avec barre colorée 4, nature 26, titre 13 gras, heure/durée 11, lecture 26 et aucun Déployer. Les deux sets comportent 10 variantes chacun. Suivi — Vue d’ensemble est hors MVP. Les boutons Calendrier Aujourd’hui/Planifier restent à 32, sans cible 44 ajoutée : situation acceptée, à revoir et développer après T04. Les nouvelles icônes sont nommées icon/<nom>, les anciennes ne sont pas renommées ; target est réservé au Programme, pulse aux rapports/Suivi.

Référence normative ciblée : [DSF — Cartes, icônes et appuis](../DSF-CARTES-ICONES-APPUIS-2026-09-30.md). Ces règles finales prévalent sur les anciennes formulations d’affichage du présent chapitre dans ce périmètre uniquement.



> **Clôture des contrats — 01/10/2026.** Les règles consolidées du [chapitre 13, §6](13%20–%20Contrats%20d’écran.md#6-clôture-des-réserves-fonctionnelles-des-contrats) s’appliquent : progression sur le plan complet ; transitions et pauses selon D-248/v13 (ancien repli D-242 retiré) ; fréquence 1..12 semaines ; rappel personnalisé au plus 24 h. En Un côté après l’autre, le reset porte sur le bloc du côté courant ; la même règle s’applique à l’ordre alterné en conservant les résultats de l’autre côté (chapitre13 R-03). Les étapes et calculs ci-dessous se lisent avec ces précisions ; aucune nouvelle disposition d’écran.


### Saisie des paramètres — D-246

La référence active est [Paramètres en modale v13](SPECIFICATION-PARAMETRES-MODALE-v13.md), contrats CE-T03-04/CE-UI-10. Elle intègre Séries variables, Ordre des côtés, pauses terminales et récupération de l’occurrence. Feuille transactionnelle : ✕ annule, ✓ applique au parent, Terminer persiste. Les calculs et comportements sont normatifs dans les spécifications ; Figma définit le layout seulement. Les anciens textes v11 sont historiques.

## Paramètres de Série et Ordre des côtés — D-247 à D-254

Le mode d’exécution est commun à l’Exercice. Le stockage distingue explicitement uniforme et variable, même si les valeurs sont identiques. En variable, conserver N lignes ordonnées avec cible (Durée/Répétitions) et Pause ; aucune cible numérique À l’échec. Les mêmes lignes s’appliquent aux deux côtés. Direction et Ordre des côtés sont deux propriétés distinctes. N=1 est normalisé uniforme/Un côté après l’autre dès le brouillon.

Copie Catalogue→Séance, duplication et nouvel instantané conservent tout cet état. Les données sans nouveaux attributs sont uniformes/Un côté après l’autre. Les calculs actuels s’appliquent aussi aux Exercices existants ; résultats historiques immuables. Les valeurs temporaires de restauration et le repli visuel ne sont jamais persistés. Voir v13 §§2–5 et8 pour le contrat complet.

## Extension Cadence du modèle de Série

La Série porte `cadenceBeepIntervalSeconds` (entier0..10,0 par défaut), applicable aux trois modes. L’édition commune est une projection de brouillon, pas une seconde vérité persistée au-dessus de la collection variable. Activation, modification, suppression et déplacement conservent l’intégrité de la collection. Définition, copie de Séance et instantané transportent la même propriété.

Une durée prévisionnelle déterminable ne signifie pas une fin automatique : Ri×Ci fournit le poids temporel et la fin nominale, Suivant l’achèvement. L’accumulateur réel inclut tentatives réinitialisées et intervalles abandonnés ; il est distinct de la progression et du chronomètre courant. Aucun nouvel objet Répétition. Voir Bip v2 et modèle09.



## Propagation Pauses et symboles — 07/10

La Composition possède des pauses explicites recovery et breakpoint. recovery appartient à une occurrence ; breakpoint conserve une position structurelle. Une projection R=0 pour absence ne crée pas d’objet. La présence et la durée0 sont distinctes, les phases0s ne sont pas générées.

