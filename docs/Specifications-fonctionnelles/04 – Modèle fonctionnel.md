# Modèle fonctionnel

> **C08 — actualisation du 28/10/2026.** La [composition des familles depuis le catalogue](../DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md), règles A à E et CE-MVT-03, est désormais définie : rattacher, détacher et dissoudre une famille par geste. Les mentions antérieures « C08 différé » restent historiques pour ces opérations ; elles ne sont plus une restriction active. La suppression définitive d'un mouvement reste distincte et n'est pas clôturée par ce lot.

> **Cible validée D-449 — 26/10/2026.** [Six décisions closes](../KODJO-Seance-Objet-Unique-Decisions-2026-10-26.md). Les dispositions ci-dessous sur l’exercice autonome de catalogue, le lancement `ACTIVITY`, le cycle technique unique et les catalogues séparés par nature décrivent le modèle antérieur et sont remplacées sur ces seuls points. Les autres règles restent applicables. La réalisation et les visuels Figma ne sont pas déclarés livrés.

## Modèle cible — D-449

Mouvement = contenu partagé ; Exercice = mouvement avec paramètres dans une séance ; Séance = seul contenu enregistré, lançable et planifiable. La séance contient des exercices, circuits et cycles successifs ; chaque cycle contient des circuits, sans imbrication. Le qualificatif de séance ne dépend jamais du nombre d’exercices. La reprise d’une séance copie sa composition et ses paramètres, avec de nouveaux identifiants de composition et les mêmes références aux mouvements.

**D-445 — décisions validées le 25/10 :** C01–C07 et C09 sont clos ; C08 seul reste différé sur le périmètre MVP. [Spécification consolidée v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md).


## Sommaire

- [Objet et organisation du chapitre](#objet-et-organisation-du-chapitre)
  - [Objectif](#objectif)
  - [Navigation principale et articulation des écrans — Cohérence des libellés](#navigation-principale-et-articulation-des-écrans--cohérence-des-libellés)
- [Séances](#séances)
  - [Composer une séance / Modifier une séance — Objectif](#composer-une-séance--modifier-une-séance--objectif)
  - [Cycle de vie d'une séance — Principe général](#cycle-de-vie-dune-séance--principe-général)
  - [Cycle de vie d'une séance — État persistant et qualificatifs d'une séance](#cycle-de-vie-dune-séance--état-persistant-et-qualificatifs-dune-séance)
- [Exercices](#exercices)
  - [Exercice](#exercice)
  - [Concepts métier](#concepts-métier)
  - [Structure d'un Exercice](#structure-dun-exercice)
  - [Composition d'une séance — Les exercices](#composition-dune-séance--les-exercices)
- [Paramètres d’exécution](#paramètres-dexécution)
  - [Paramètres et brouillon d’un exercice — Modèle et terminologie](#paramètres-et-brouillon-dun-exercice--modèle-et-terminologie)
  - [Composition d'une séance — Modes et récupération d’un Exercice](#composition-dune-séance--modes-et-récupération-dun-exercice)
- [Composition des séances](#composition-des-séances)
  - [Structure d'une séance](#structure-dune-séance)
  - [Composer une séance / Modifier une séance — Structure affichée](#composer-une-séance--modifier-une-séance--structure-affichée)
  - [Composition d'une séance — Principe général](#composition-dune-séance--principe-général)
  - [Composition d'une séance — Structure d'une séance](#composition-dune-séance--structure-dune-séance)
  - [Placement des récupérations et des points d’arrêt — Pause de Composition : deux types, un parcours](#placement-des-récupérations-et-des-points-darrêt--pause-de-composition--deux-types-un-parcours)
- [Formats de séances](#formats-de-séances)
  - [Extension validée du modèle](#extension-validée-du-modèle)
- [Planification](#planification)
  - [Planification des créneaux et de leurs contenus — Le concept central : un créneau peut porter plusieurs contenus](#planification-des-créneaux-et-de-leurs-contenus--le-concept-central--un-créneau-peut-porter-plusieurs-contenus)
  - [Planification des créneaux et de leurs contenus — Le Programme](#planification-des-créneaux-et-de-leurs-contenus--le-programme)
- [Suivi et synthèse](#suivi-et-synthèse)
  - [Suivi et historique des séances — Principe général](#suivi-et-historique-des-séances--principe-général)
- [Référentiels](#référentiels)
  - [Gestion des référentiels utilisateur](#gestion-des-référentiels-utilisateur)

## Objet et organisation du chapitre

### Objectif

Ce chapitre présente le modèle fonctionnel de l'application et les principaux concepts métier qui la composent.

Il décrit le fonctionnement général de l'application du point de vue de l'utilisateur et du métier, sans détailler le modèle de données, les écrans ou l'implémentation technique.

Les structures de données, attributs et relations entre les objets sont décrits dans le chapitre **09 – Modèle de données fonctionnel**.

### Navigation principale et articulation des écrans — Cohérence des libellés

Les mêmes termes sont utilisés dans toute l’application :

- `Séance` : contenu complet d’un entraînement ;
- `Routine` : créneau portant une liste ordonnée de Séances et/ou Exercices persistants ;
- `Exercice` : action élémentaire exécutée en mode Durée ou Répétitions, avec cible chiffrée ou À l’échec par série, avec Pause après chaque série et, en bilatéral, Pause entre les côtés éventuelle ;
- `Pause entre les côtés` : durée intrinsèque facultative d’un Exercice bilatéral, exécutée selon l’Ordre des côtés ;
- `Récupération après exercice` : durée contextuelle portée par chaque occurrence d’Exercice dans une Séance, non affichée sur les cartes (D-238) et exécutée après l’occurrence lorsqu’elle est positive ;
- `Série` : répétition propre à un Exercice ;
- `Circuit` : groupe ordonné d’Exercices exécuté intégralement un nombre défini de fois ;
- `Cycle` : séquence de circuits munie de son propre nombre de répétitions ; plusieurs cycles successifs sont permis, sans imbrication (D-449) ;
- `Exécution de séance` : réalisation effective d’une Séance.

## Séances

### Composer une séance / Modifier une séance — Objectif

Permettre de sélectionner ou créer l’Étiquette de la Séance. L’Étiquette porte la couleur affichée de la Séance ; il n’existe pas de couleur de Séance indépendante de l’Étiquette.

### Cycle de vie d'une séance — Principe général

Une séance constitue le modèle fonctionnel utilisé pour exécuter un entraînement.

Elle est créée une seule fois, peut être modifiée à tout moment, puis utilisée librement pour une exécution immédiate ou pour créer une ou plusieurs routines de planification.

Une séance reste indépendante de ses routines et de ses exécutions.

Les modifications apportées à une séance n'ont aucun effet sur les exécutions déjà réalisées.

### Cycle de vie d'une séance — État persistant et qualificatifs d'une séance

Le statut persistant d’une Séance est binaire : `Active` ou `Archivée`.

| Notion | Nature | Description |
| --- | --- | --- |
| En création | État temporaire du brouillon | La Séance n’est pas encore persistée. Ce n’est pas une valeur du statut de la Séance. |
| Active | Statut persistant | La Séance est disponible dans le Catalogue et peut être exécutée ou planifiée. |
| Archivée | Statut persistant | La Séance est retirée du Catalogue actif ; elle peut être restaurée ou supprimée définitivement depuis les archives. |
| Planifiée | Qualificatif dérivé, non exclusif | Au moins une Routine active référence la Séance. |
| Exécutée | Qualificatif dérivé, non exclusif | Au moins une Exécution existe dans le Suivi. |

Une Séance peut donc être simultanément `Active`, planifiée et déjà exécutée. `Supprimée` n’est pas un statut persistant : après suppression définitive, la Séance n’existe plus ; les Exécutions historiques restent consultables à partir de leurs Instantanés.

## Exercices

### Concepts métier

#### Classification active

Une **Étiquette** qualifie une Séance et porte sa couleur. Une **Catégorie** qualifie un Exercice et porte sa couleur sémantique. Les Zones corporelles restent distinctes de la Catégorie.

Le fonctionnement cible repose sur Mouvement, Exercice et Séance (D-449). L’exercice est subordonné à la composition ; la distinction historique ActivityDefinition/SessionActivity ci-dessous sert à lire l’état livré antérieur et ne constitue plus la cible.

#### Utilisateur

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

#### Séance

La **Séance** constitue le contenu d'un entraînement.

Elle définit :
- son nom ;
- sa couleur ;
- ses catégories ;
- sa structure (cycles et circuits facultatifs, exercices directs) ;
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

#### Cycle

Un **Cycle** contient un ou plusieurs circuits et possède son propre nombre de répétitions. Plusieurs cycles peuvent se succéder dans une séance ; aucun cycle ne contient un autre cycle (D-449).

#### Circuit et Tour

Un **Circuit** est un groupe ordonné d’Exercices, placé dans la Séance ou dans un Cycle (D-449). Un **Tour** est une exécution complète de ce Circuit. Pour une séance libre à compte borné, le compte est compris entre 1 et 99, défaut 1 : nombre de tours pour la nature tours, nombre de séries imposé à chaque exercice pour la nature séries. Les formats ajoutent des bornes et indexations explicites ; leur détail figure dans la section Formats ci-dessous. D-209 est complétée par la spécification du 12/10.

#### Exercice

Une `ActivityDefinition` référence directement un mouvement et porte ses paramètres propres. Une `SessionActivity` possède son identifiant et référence **directement le mouvement**, sans dépendance de contenu envers l’exercice Catalogue ; elle porte une copie locale complète des paramètres au moment de l’insertion, puis les conserve indépendamment. Elle ne conserve pas une copie modifiable du nom, de la description, des médias, de la catégorie, des zones ni de la structure des phases.

Les corrections du contenu partagé sont visibles à la prochaine lecture des définitions et des séances ; aucun mécanisme de propagation de copies de contenu n’est nécessaire. Modifier les paramètres Catalogue ne modifie pas ceux des séances. Supprimer ou archiver la définition Catalogue ne casse pas les occurrences.

Au démarrage, résoudre le contenu courant avec les paramètres de l’exercice puis construire un instantané autonome. Cet instantané, l’exécution déjà démarrée et les historiques ne changent plus avec le mouvement. Leur `sourceMovementId` conserve l’identité exécutée, sans rang stocké ; la classification actuelle peut être résolue séparément à la lecture.

Les relations actives vers le mouvement doivent rester intègres, depuis les définitions **et les occurrences de séance**. L’absence de contrainte référentielle et la tolérance d’orphelins concernent la filiation des instantanés, pas le contenu vivant. La suppression explicite d’un mouvement encore référencé par un exercice est interdite ; son parcours reste dans C08. La suppression du dernier exercice ne supprime jamais le mouvement : un mouvement peut exister sans exercice et reste recherchable.

Le mouvement porte nom, étapes, médias, catégorie, zones et structure ordonnée des phases ; les valeurs temporelles, répétitions et autres réglages restent des paramètres. Chaque définition Catalogue référence exactement un mouvement existant ; aucune suppression de mouvement tant qu’une définition le référence. Le mouvement est créé avec un exercice Catalogue ou local, jamais seul ; une fois enregistré il peut subsister sans exercice, sans collecte automatique. Son groupe éventuel est linéaire, unique et invisible comme objet autonome.


Un **Exercice** représente un Exercice élémentaire défini par l’utilisateur. À partir de T03, il peut exister comme définition persistante autonome du Catalogue des exercices (`ActivityDefinition`) ou comme copie appartenant à une Séance (`SessionActivity`). Le modèle ne possède plus de type `Exercice / Récupération`. Il distingue désormais la **Pause entre les côtés**, propriété intrinsèque éventuelle d’un Exercice bilatéral, et la **Récupération après exercice**, propriété contextuelle d’une occurrence `SessionActivity`.

Un Exercice possède un nombre de **Séries** propre, entier et supérieur ou égal à 1.

Une Série est une réalisation de l’Exercice selon son mode unique. Elle porte une cible éventuelle et une Pause, terminale comprise, ainsi qu’une charge lorsque la charge est activée (RM-237, RM-238). En variable, ces paramètres sont propres à chaque ligne ordonnée ; en uniforme ils sont communs. La Série n’est ni un conteneur de Séance ni une entité autonome.

Chaque Exercice possède notamment :
- un nom ;
- une Catégorie d’Exercice obligatoire ;
- une ou plusieurs Zones corporelles obligatoires ;
- un mode d'exécution ;
- une durée cible, un nombre de répétitions cible ou aucune cible chiffrée pour une cible À l’échec ;
- un nombre de Séries ;
- une Pause facultative après chaque Série, dernière comprise (D-248) ;
- une Charge facultative et informative, en kilogrammes, commune aux Séries identiques ou propre à chaque Série variable, dont l’activation (`Avec` / `Sans`) est distincte des valeurs conservées (D-403 ; RM-235 à RM-241) ;
- une `sideRecoverySeconds` facultative, pertinente uniquement avec changement de côté (`Avec`), exécutée selon l’Ordre des côtés (une fois par Exercice ou une fois par Série) ;
- un Changement de côté propre : `Avec` ou `Sans`, sans désignation du côté de départ (D-406, RM-242) ;
- un Compte à rebours d’Exercice facultatif ;
- une Fin d’exercice facultative ;
- une Durée totale calculée ou estimée ;
- une consigne facultative ;
- un média associé est affiché dans la gouttière permanente de la carte du Catalogue dans le MVP, sans déploiement ; l’import/ajout local et les associations ordonnées sont inclus dans PRE-3 au MVP (D-333), sans activation implicite de la caméra.

La Pause et la Pause entre les côtés sont indépendantes. Lorsque le Changement de côté vaut `Sans`, `sideRecoverySeconds` est sans objet. En bilatéral, l’ordre est : successions définies par l’Ordre des côtés (chapitre 08, paramètres d’exercice).

*Texte identique à celui de la section [« Périmètre fonctionnel du MVP — Création et composition »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#périmètre-fonctionnel-du-mvp--création-et-composition) ; il n’est pas recopié ici.*

##### Exercice de référence et Exercice de Séance

Dans le MVP T03, une **Exercice de référence** (`ActivityDefinition`) est une définition persistante autonome du Catalogue des exercices. Son cycle de vie comprend création, consultation/modification, archivage, restauration et suppression définitive depuis les archives. Elle peut être exécutée directement lorsqu’elle est valide.

Une **Exercice de Séance** (`SessionActivity`) possède son identité propre, une référence directe au mouvement et des paramètres locaux copiés à l’insertion puis indépendants du Catalogue. Le contenu partagé est lu depuis le mouvement. La récupération contextuelle conserve les règles D-304/D-307 ; modifier ou supprimer la définition Catalogue ne modifie pas les paramètres locaux ni la référence au mouvement. Le mouvement survit à la suppression des exercices. D-445 remplace l’ancienne copie autonome de contenu.

Un Exercice créé directement dans une Séance ne devient pas automatiquement une référence de Catalogue. D-440 dispense de toute reprise des données antérieures pour la transition MFN ; la création locale produit un mouvement et sa copie sans publier de définition Catalogue.

La suppression définitive d’une `ActivityDefinition` ne cascade pas vers les `SessionActivity` déjà copiées ni vers les Instantanés, Exécutions et résultats historiques.

#### Routine

Une Routine représente un créneau portant une **liste ordonnée de contenus**, Séances (`SESSION`), Exercices persistants (`ACTIVITY`) ou mélange des deux. Le créneau produit les occurrences ; chaque contenu les filtre par sa fréquence sans unité **x fois sur n** et ses positions retenues. Le cas x=n s’affiche « à chaque fois ».

Programme facultatif (« Aucun » par défaut) précède Début le. Répétition désactivée produit un créneau unique ; activée, elle expose Jour/Semaine/Mois et une borne **jusqu’au** (date) ou **pendant** (nombre d’unités). Aucun/Aucune ne sont plus des options de Rappel/Répétition : des interrupteurs portent leur absence. Rappel reste facultatif,0..1 par Routine.

La sélection utilise des cases à cocher et « Ajouter 1 élément » / « Ajouter n éléments », avec les espaces et accords usuels. Le formulaire porte Planifier sans contenu, Planifier une séance/un exercice à contenu unique, Planifier un parcours à plusieurs contenus. **Parcours est uniquement un libellé**, sans entité, catalogue ni exécution autonome. Circuit reste le groupe interne à une Séance, répété en Tours.

La spécification du 08/10 définit le comportement cible et ses points ouverts ; elle ne certifie pas une implémentation. Une Routine peut toujours partager ses sources avec d’autres Routines. Les données historiques ne sont pas réécrites.

*Texte identique à celui de la section [« Entité Routine »](09%20%E2%80%93%20Mod%C3%A8le%20de%20donn%C3%A9es%20fonctionnel.md#entité-routine) ; il n’est pas recopié ici.*

#### Exécution

Une **Exécution** représente la réalisation effective d’un contenu. Elle porte obligatoirement une origine :

- `SESSION` pour une Séance lancée manuellement ou depuis une Routine ;
- `ACTIVITY` pour un Exercice persistant lancé directement depuis le Catalogue des exercices **ou depuis une Routine**.

Une Exécution conserve un instantané immuable correspondant à son origine, les informations de déroulement et les résultats produits. Une Exécution de toute origine peut référencer la Routine éventuellement utilisée. Une Exécution `ACTIVITY` ne crée aucune Séance artificielle et ne contient ni Tour, ni Cycle, ni phase `SESSION_END`.

Chaque Exécution est indépendante des modifications, archivages ou suppressions ultérieurs de sa source.

#### Préférences globales

Les préférences globales regroupent les paramètres personnels utilisés comme valeurs par défaut lors de la création et de l'utilisation des séances et des routines. Elles peuvent être modifiées dans le Profil. Leur modification n'altère pas rétroactivement les séances ou routines déjà créées.

Elles comprennent :

**Préférences de création d'une séance :**
- la durée par défaut du compte à rebours initial ;
- le texte vocal par défaut du compte à rebours initial ;
- la durée par défaut de la fin de séance ;
- le texte vocal par défaut de la fin de séance.

**Valeurs par défaut proposées (D-240, D-213, D-307) :**
- la Pause entre les côtés par défaut ;
- le Compte à rebours d’un exercice par défaut ;
- la Fin d’exercice par défaut ;
- la Récupération après exercice par défaut, proposée lors de l’ajout explicite d’une récupération (D-307).

**Préférences de planification :**
- les paramètres par défaut des rappels associés aux routines.

**Préférences d'exécution :**
- les sons ;
- les annonces vocales ;
- les vibrations.

Les préférences utilisées comme valeurs par défaut sont copiées dans la séance ou la routine lors de sa création lorsque le paramètre est propre à cet objet. Une modification ultérieure des préférences globales ne modifie donc pas les objets existants.

#### Référentiels utilisateur

L'application utilise des référentiels permettant de qualifier ses contenus.

Dans le MVP :
- les **Étiquettes** sont utilisées pour classer les Séances et portent leur couleur ;
- les **Catégories** sont utilisées pour classer les Exercices et portent leur couleur sémantique ;
- les **Étiquettes**, **Catégories** et **Zones corporelles** sont des référentiels utilisateur administrables. Toutes leurs valeurs, qu’elles soient initiales ou créées ensuite par l’utilisateur, peuvent être supprimées. La suppression d’une valeur la retire des choix futurs tout en conservant ses associations aux Séances ou Exercices existants. Les Instantanés/Exécutions historiques restent inchangés.

### Structure d'un Exercice

Un **Exercice** est une unité exécutable autonome dans son modèle fonctionnel, qu’elle soit définie comme `ActivityDefinition` dans le Catalogue ou copiée comme `SessionActivity` dans une Séance.

Les propriétés intrinsèques communes portent notamment :
- une identité, un nom et une Description facultative structurée en étapes ordonnées (D-425) ;
- une **Catégorie** d’Exercice et zéro à plusieurs **Zones corporelles** ;
- un mode d’exécution parmi Durée et Répétitions ;
- la cible du mode lorsqu’elle existe ;
- un nombre de **Séries** ;
- Pi est stockée et exécutée après chaque Série, dernière comprise. À la frontière des côtés successifs, PN puis PC se cumulent. Par paire, Pi suit chaque paire, dernière comprise, et PC reste dans chaque paire. Seule la toute dernière Pause est remplacée par la récupération positive qui suit l’occurrence ; aucune récupération en direct. N=1 normalisé uniforme/par côté. Formules et séquences : chapitre 10, Calculs des durées et ordre des phases.
- une **Charge** facultative et informative, avec son activation (`Avec` / `Sans`) et ses valeurs, commune aux Séries identiques ou propre à chaque Série variable (RM-235 à RM-238) ;
- un **Changement de côté** propre : `Avec` ou `Sans` (D-406) ;
- une **Pause entre les côtés** `sideRecoverySeconds` éventuelle, pertinente uniquement avec changement de côté (`Avec`) ;
- un **Compte à rebours d’Exercice** propre lorsqu’il est utilisé ;
- une **Fin d’exercice** propre lorsqu’elle est utilisée ;
- une Durée totale intrinsèque dérivée ou estimée selon le mode ;
- les associations média prévues par le périmètre courant.

Une `ActivityDefinition` ne possède **aucune Récupération après exercice**.

Une `SessionActivity` reprend les propriétés intrinsèques applicables de la définition et expose la projection contextuelle `postActivityRecoverySeconds` calculée depuis l’objet `recovery` explicitement ajouté, ou 0 en son absence. Cette projection n’est pas une source de persistance indépendante ; aucune récupération n’est créée avec l’occurrence. Elle se déplace, se duplique et se supprime avec l’occurrence.

Le Compte à rebours d’Exercice et la Fin d’exercice appartiennent à l’Exercice. Ils sont distincts du Compte à rebours initial et de la Fin de séance, qui restent des éléments structurels de la Séance.

La structure intrinsèque d’un Exercice peut être représentée ainsi :

Le détail ordonné des phases est défini par chapitre 08, paramètres d’exercice pour chacun des deux ordres ; le côté de départ n’est pas désigné (D-406).

Dans une occurrence, R>0 se substitue à la seule Pause terminale ; R reste une donnée contextuelle, hors définition intrinsèque.

## Phases internes d’une série

Un exercice présente une liste résolue de phases : aucune, ou 2 à 6 (D-438). La structure et les libellés, de 20 caractères maximum, appartiennent au mouvement ; les durées appartiennent aux paramètres. Le retrait explicite 2 → 1 revient à Sans sans modifier la cible de série (PHC-20261026). Elles sont communes aux séries identiques [et variables depuis D-446 du 26/10/2026 : une seule séquence de phases et de durées pour toutes les séries], en mode Durée ou Répétitions, à cible chiffrée ou À l’échec. Une série répète cette liste jusqu’à sa condition d’arrêt ; la somme est la durée du motif, indépendante de la cible de série (PHC-20261026). L’absence de phases conserve le comportement existant.

Les phases s’enchaînent sans pause. Les pauses après série, les côtés, les circuits et la récupération contextuelle conservent leur portée. Chaque passage de travail d’un côté déroule le motif complet ; une phase ne devient pas un passage de circuit. Les phases de mouvement ne doivent pas être confondues avec les phases structurelles du plan. Voir [règles d’édition et de format](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phases-exercice).

### Composition d'une séance — Les exercices

Un exercice représente une étape élémentaire de la séance.

Chaque exercice est indépendante des autres.

Un exercice possède notamment :

- un nom ;
- une durée cible, un nombre de répétitions cible ou une cible À l’échec sans nombre prescrit ;
- *Texte identique à celui de la section [« Structure d'un Exercice »](#structure-dun-exercice) ; il n’est pas recopié ici.*
- une **Pause entre les côtés** facultative, visible uniquement avec changement de côté (`Avec`, D-406) et exécutée selon l’Ordre des côtés (une fois par Exercice ou une fois par Série) ;
- une Description facultative et une ou plusieurs Zones corporelles obligatoires ;
- un média associé est affiché dans la gouttière permanente de la carte du Catalogue dans le MVP, sans déploiement ; l’import/ajout local et les associations ordonnées sont inclus au MVP dans PRE-3 (D-333), sans activation implicite de la caméra.

Les exercices sont exécutés dans l'ordre où elles apparaissent dans la séance.

### Évaluations et résultats — D-427 à D-429
Standard : aucune évaluation avant et Ressenti triétat obligatoire après. Enrichi uniquement pour une exécution lancée dans le contexte d'un Programme avec option active (tout lancement indépendant reste standard) : douleur initiale 0–10 obligatoire et sans localisation avant démarrage ; douleur finale 0–10 obligatoire, jamais présélectionnée, et effort perçu 1–10 obligatoire après, à la place du Ressenti. Si douleur finale > 0, au moins une localisation parmi les zones corporelles KODJO (plusieurs possibles, latéralité si applicable) ; zéro doit être choisi explicitement. Commencer ou Enregistrer est bloqué tant que des champs obligatoires manquent. Paramétrage de l'option : À CLARIFIER.

Formats imposés : modale Répétitions partielles (8928:15098), interruption ou série sous cible ; saisie proposée zéro, minimum zéro, résultat supérieur à cible autorisé ; validation enregistre et poursuit automatiquement le plan ; fermeture sans validation annule, n'enregistre rien, revient à l'étape sans progresser.

Modale Résultat de série (8937:35362) : saisie proposée zéro, minimum zéro, résultat supérieur à cible autorisé ; validation enregistre le réel et poursuit automatiquement le plan ; fermeture sans validation annule, n'enregistre rien, revient à l'étape sans progresser. Conditions exactes d'ouverture non arbitrées : À CLARIFIER.

## Paramètres d’exécution

### Paramètres et brouillon d’un exercice — Modèle et terminologie

Un Exercice possède un mode unique : Durée ou Répétitions, avec cible chiffrée ou À l’échec par série. Une Série est une définition subordonnée à l’Exercice, numérotée 1..N : une cible éventuelle et une Pause. Elle n’est pas une entité autonome, ni un groupe d’exercices. En bilatéral, N signifie N Séries **par côté**, avec les mêmes paramètres pour les deux côtés.

- **Condition d’arrêt** : libellé visible de la ligne `À l’échec` / `À l’objectif` ; choix commun en séries identiques, résultat dérivé non modifiable en séries variables ; le type de cible par Série reste la seule donnée (D-411, RM-248, RM-249 ; libellés D-447).
- **Séries variables** : état explicite, indépendant de l’égalité éventuelle des valeurs.
- **Pause après chaque série** : libellé d’interface ; Pi est la Pause configurée de la Série i. Elle est exécutée après chaque Série, dernière comprise ; seule PN est remplacée par une récupération positive qui suit l’Exercice. Zéro signifie absence de phase positive.
- **Charge** : `Avec` / `Sans` ; valeur informative en kilogrammes, commune en séries identiques ou propre à chaque Série variable ; activation distincte des valeurs conservées (D-403, D-404 ; RM-235 à RM-241).
- **Changement de côté** : `Avec` / `Sans` ; détermine la bilatéralité ; le côté de départ est choisi par l’utilisateur et n’est pas désigné par Kodjo (D-406, RM-242).
- **Ordre des côtés** : libellé visible `Enchainement` (D-413) ; Un côté après l’autre (défaut) / Les deux côtés à chaque série. Sans objet en unilatéral.
- **Pause entre les côtés** : PC, libellé unique y compris dans le Profil ; initialisée depuis le Profil (défaut 10 s). Le nom technique existant `sideRecoverySeconds` peut être conservé.
- **Récupération après exercice** : R, ajoutée explicitement et portée uniquement par l’occurrence de Séance (`postActivityRecoverySeconds`), jamais par ActivityDefinition.

En uniforme, une cible et une Pause communes sont effectives. En variable, la collection ordonnée des N cibles/Pauses est l’unique source de vérité : aucune combinaison valeur commune + surcharge. Dans les deux modes, chaque cible peut être chiffrée (Ti ou Ri) ou À l’échec ; une collection variable peut mélanger les deux. La charge, information facultative et non une cible, suit la même répartition : commune en séries identiques, propre à chaque ligne en séries variables (D-403, RM-237, RM-238) ; les autres cibles d’intensité (RPE, etc.) restent hors périmètre.

### Composition d'une séance — Modes et récupération d’un Exercice

Le modèle cible ne possède pas de type d’Exercice `Exercice` ou `Récupération`. Toute Exercice correspond à une action réalisée par l’utilisateur.

Elle peut être définie :

- par une durée ;
- par un nombre de répétitions ;
- dans l’un ou l’autre de ces modes, avec une cible À l’échec par Série, sans durée ni nombre de répétitions cibles ; À l’échec n’est pas un troisième mode (D-111).

Elle peut être associée à une ou plusieurs zones corporelles.

Le modèle distingue deux récupérations. La **Pause entre les côtés** (`sideRecoverySeconds`) est une propriété intrinsèque facultative, uniquement pertinente pour un Exercice bilatéral ; lorsqu’elle est positive, `SIDE_RECOVERY` intervient selon l’Ordre des côtés (une fois par Exercice ou une fois par Série). La **Récupération après exercice** est un objet contextuel explicitement ajouté à l’occurrence de Séance. Sa projection `postActivityRecoverySeconds` vaut 0 en son absence ou pour une récupération à 0 s ; lorsqu’elle est positive, elle produit `POST_ACTIVITY_RECOVERY` après l’occurrence. L’absence et l’objet explicite à 0 s restent distincts. Une `ActivityDefinition` n’en possède jamais.

Un Exercice dont le nom ou l’intention fonctionnelle est « Récupération » reste possible : il utilise le même modèle et les mêmes modes que tout autre Exercice ; aucun traitement particulier n’est associé à son nom.

## Composition des séances

### Structure d'une séance

La séance contient un compte à rebours initial, une séquence ordonnée d’exercices et de conteneurs facultatifs, puis une fin de séance. Circuits et cycles peuvent être multiples. Un cycle contient des exercices directs et des circuits ; un circuit contient des exercices. Aucun cycle dans un cycle, circuit dans un circuit ou séance imbriquée (D-451).

Le cycle visible répète ses membres 1..99 fois, défaut 1. Le circuit porte 1..99 tours et une nature séries groupées ou séries alternées ; la bilatéralité reste portée par les exercices. Un exercice direct du cycle est rejoué à chaque répétition ; un exercice direct de séance est joué une fois (RM-252). Les séries alternées héritent du compte N du circuit ; le régime identiques/variables reste propre à l’exercice.

Le compte à rebours et la fin sont structurels, non déplaçables, instantanés à 0 s. Les points d’arrêt et récupérations conservent leurs règles ; leur rattachement ne se déduit pas d’un fond coloré. Le plan utilise les phases existantes et se termine à SESSION_END ; les mesures de durée conservent leurs définitions, les exemples Figma ne faisant pas foi pour le calcul.

### Composer une séance / Modifier une séance — Structure affichée

Aucun cycle technique implicite. La hiérarchie est lisible par trois fonds et les largeurs Cycle/Circuit/Exercice, sans indentation supplémentaire des cartes. Les circuits se replient, les cycles restent déployés. Création autour de membres existants ; déplacement par appui long ; conteneur vide disparu et singleton conservé. Voir [Composition : circuits, cycles et création](../KODJO-Composition-conteneurs-2026-10-28.md).

### Règles conservées : phases, mesures et gestes

Dans le Plan d’Exécution d’une Séance, ces phases sont typées `INITIAL_COUNTDOWN`, `ACTIVITY`, `SERIES_PAUSE`, `SIDE_RECOVERY`, `POST_ACTIVITY_RECOVERY` et `SESSION_END`. `SIDE_RECOVERY` appartient à l’Exercice bilatéral ; `POST_ACTIVITY_RECOVERY` appartient à l’occurrence de Séance. Aucune de ces phases n’est un Exercice autonome. Seule l’expiration de `SESSION_END`, immédiate lorsque sa durée vaut `0 s`, termine normalement l’Exécution de Séance et autorise son enregistrement final.

Un **Point d’arrêt** est un élément de Composition sans écran dédié. Il suspend l’enchaînement jusqu’à reprise explicite et son temps d’attente est exclu de la durée de la Séance.

Le modèle distingue trois mesures temporelles. La **Durée synthétique des Exercices**, utilisée dans le Catalogue, développe les occurrences d’Exercices mais exclut le Compte à rebours initial et la Fin de séance ; le total affiché sous le titre du Circuit de la Composition concerne exclusivement ce Circuit (D-382). La **Durée estimée d’exécution**, utilisée pendant l’Exécution de Séance, couvre le Plan complet et inclut ces deux phases structurelles. Le **temps total écoulé** et la **Durée réelle** couvrent toutes les phases effectivement exécutées, mais excluent les Pauses déclenchées manuellement par l’utilisateur.

Un **Exercice** possède un mode Durée ou Répétitions, avec une cible chiffrée ou À l’échec par Série, un nombre de Séries propre, une Pause facultative après chaque Série, dernière comprise (D-248), et, lorsqu’elle est bilatérale, une `sideRecoverySeconds` facultative entre les deux côtés. La Récupération après exercice n’est pas une propriété intrinsèque de l’Exercice : elle appartient à l’occurrence contextualisée. L’Exercice peut également définir un Compte à rebours propre et une Fin d’exercice propre, distincts des phases structurelles de la Séance.

Dans l’interface de Composition, un appui long sur la carte d’une **Exercice** amorce son déplacement. L’état soulevé est transitoire et ne modifie aucune donnée ; seule la dépose à une position valide déclenche la mise à jour de la position structurelle et de l’ordre. Un toucher court conserve l’ouverture de l’Exercice en modification. Cette règle ne s’applique ni au Compte à rebours initial ni à la Fin de séance. La Récupération après exercice accompagne l’occurrence déplacée ; les Points d’arrêt ne la suivent pas et gardent leur position dans la séquence. Une dépose d’Exercice qui laisserait un Point d’arrêt à une position non autorisée (juste après le Compte à rebours, juste avant la Fin, ou consécutif à un autre Point) est appliquée : le ou les Points en cause sont retirés, sans message ; pour deux Points devenus consécutifs, le premier est conservé (D-442, qui remplace le refus de D-441 ; RM-251). Un Point d’arrêt se déplace lui-même par appui long, qui le marque visuellement comme une carte soulevée, puis glisser-déposer, vers une position autorisée, tête de Circuit comprise (D-442) ; une dépose de Point interdite est refusée sans modification (D-441). Pendant un glisser, l’approche du bord haut ou bas de la zone visible fait défiler la liste (D-442). La suppression d’un Exercice suit la même règle que son déplacement : elle est appliquée et le ou les Points en cause sont retirés, sans message (D-442, recette J6 du 22/10, qui remplace le refus doux de D-441).

### Composition d'une séance — Principe général

Une séance est constituée d'un ensemble d'exercices organisés dans un ordre d'exécution précis.

L'utilisateur construit librement sa séance en ajoutant, modifiant, supprimant ou réorganisant ces exercices.

La structure d'une séance est entièrement définie par son contenu. Aucun comportement implicite n'est ajouté automatiquement par l'application.

### Composition d'une séance — Structure d'une séance

Compte à rebours initial → séquence d’exercices, circuits et cycles → fin de séance. Chaque membre est développé dans son parent selon D-451 et RM-252.

Le Compte à rebours initial et la Fin de séance sont des éléments structurels obligatoires et ne constituent pas des Exercices. Leur durée peut être égale à 0 s.

Chaque Exercice peut en outre définir un Compte à rebours propre et une Fin d’exercice propre. Un Point d’arrêt peut être inséré dans la Composition et déplacé entre les éléments autorisés ; il ne possède pas d’écran dédié et son temps d’attente est exclu de la durée de la Séance.

Le compte à rebours initial est exécuté une seule fois au démarrage de la séance.

Les Exercices placés après le Circuit sont exécutés une seule fois, après le dernier Tour du Circuit et avant la Fin de séance.

Une séance contient obligatoirement un Cycle et un Circuit et doit contenir au minimum un Exercice pour être exécutable.

### Placement des récupérations et des points d’arrêt — Pause de Composition : deux types, un parcours

Pause est le terme d’interface commun à :
- Récupération : pause chronométrée explicitement ajoutée après une occurrence ;
- Point d’arrêt : arrêt structurel, attente exclue de la durée prévue.

Ces objets ne fusionnent pas avec la Pause après chaque série, la Pause entre les côtés ni la Pause manuelle d’exécution.

Une nouvelle occurrence ne crée aucune récupération. Le bouton Pause ouvre le mode placement de la Composition. Chaque emplacement autorisé présente deux blocs côte à côte, de largeur identique : Récupération et Point d’arrêt. Plusieurs éléments peuvent être sélectionnés en une seule entrée ; une récupération et un point peuvent coexister à la même position. Les Points d’arrêt existants y apparaissent sélectionnés : les désélectionner programme leur retrait, appliqué seulement par Confirmer (D-441). Il en va de même des Récupérations existantes, 0 comprise, affichées sélectionnées avec leur durée ; toucher une zone de récupération non sélectionnée ouvre la roulette (durée existante, sinon défaut du Profil). Ajouter, modifier ou retirer une Récupération se fait uniquement dans ce mode ; hors placement, la Récupération affichée sur la carte n’est plus une cible (D-442). Un Point d’arrêt peut être placé en tête de Circuit (début de Tour) ; lorsque le Circuit est exécuté N ≥ 2 fois, un Point de début de Tour et un Point de fin de Tour qui se suivraient entre deux Tours donnent lieu au choix de celui à conserver (D-442). Deux Points d’arrêt ne se suivent jamais sans Exercice entre eux, une Récupération n’étant pas un séparateur (RM-251).

Sélectionner Récupération ouvre immédiatement la modale de durée. La valeur proposée provient du défaut Profil de récupération, initialement 0 min 30 s. Cette règle dérivée conserve le réglage existant en déplaçant son application de la création d’occurrence à l’ajout explicite. Une modification ultérieure du Profil n’altère pas les pauses déjà ajoutées.

## Formats de séances

### Extension validée du modèle

L’Exercice possède deux formes distinctes dans le MVP T03 : la **référence autonome** du Catalogue et la **copie de Séance**. L’ajout d’une référence copie toutes ses propriétés métier applicables ; la position avant, dans ou après le Circuit appartient uniquement à la copie. Aucune modification ne se propage ensuite entre ces objets.

Un Exercice accepte Durée ou Répétitions. Chaque Série porte une cible chiffrée ou À l’échec ; cette dernière ne prescrit aucun nombre. La Récupération éventuelle reste une phase chronométrée indépendante du mode.

L’Exécution directe d’Exercice T03 développe uniquement le sous-ensemble autonome nécessaire aux Séries, Pauses et côtés, sans Récupération après exercice (D-208, RM-211). T04 porte l’orchestration complète des Séances, notamment les Tours du Circuit et les passages bilatéraux décrits dans le Plan d’Exécution.

Le Média est un actif local associé à un Exercice. Dans le MVP, le Catalogue affiche le média associé dans la gouttière permanente de la carte d’Exercice, sans déploiement (D-260/D-261). L’import/ajout local et la gestion des associations ordonnées sont inclus dans PRE-3 au MVP (D-333). La capture caméra n’est pas implicitement activée.

Le modèle autonome Parcours est retiré (D-328). Le mot parcours désigne plusieurs contenus liés sur un créneau, sans objet propre ; le Circuit interne à une Séance reste conservé.

#### Modèle fonctionnel de bilatéralité

Un Exercice persistant et son occurrence copiée dans une Séance portent un `sideMode` parmi `UNILATERAL`, `RIGHT_LEFT` et `LEFT_RIGHT`, avec `UNILATERAL` par défaut. La copie à l’insertion et la duplication conservent la valeur ; la copie devient ensuite indépendante de sa source. Le champ technique historique équivalent du Tour peut être conservé pour compatibilité et non-régression, mais il reste fixé à `UNILATERAL` et n’est pas exposé ni modifiable dans la version actuelle. Depuis D-406, `UNILATERAL` correspond au Changement de côté `Sans` ; `RIGHT_LEFT` et `LEFT_RIGHT` valent `Avec`, sans être réinterprétées comme un enchaînement ni réécrites (RM-244) ; la représentation technique de `Avec` / `Sans` relève de l’implémentation.

La direction effective exposée est celle de l’Exercice. Le Circuit ne remplace ni ne neutralise les réglages de côté de ses Exercices dans la version actuelle.

Le Plan d’Exécution mémorise la direction effective et le côté courant, côté 1 ou côté 2 (D-407, RM-243). Chaque Résultat d’Exercice porte le côté exécuté : côté 1, côté 2 ou aucun (`executionSide`) ; les valeurs historiques `RIGHT`, `LEFT` et `NONE` restent lisibles, les noms techniques relevant de l’implémentation (RM-244). Le statut global est dérivé des résultats des passages : tous terminés produit `Terminée`, au moins un résultat partiel ou un côté manquant après avancement produit `Partielle`, et aucun passage commencé produit `Non commencée` au niveau de l’Exercice concerné.

#### Exécution directe d’un Exercice — MVP T03

Une `ActivityDefinition` valide constitue un contenu exécutable. Son lancement produit une Exécution d’origine `ACTIVITY` fondée sur un instantané autonome. Cet instantané contient toutes les données nécessaires à l’exécution, mais aucune structure de Séance, aucun Tour artificiel et aucune phase `SESSION_END`.

La préparation de `5 s` appartient au contexte d’Exécution, pas à l’Exercice. Les règles propres aux modes, Séries, Pauses et côtés sont identiques à celles déjà validées pour un Exercice autonome ; aucune Récupération après exercice n’est exécutée en direct (D-208, RM-211). Le signal de fin conduit à la Synthèse ; le Ressenti est obligatoire lorsqu’elle est présentée et le Commentaire reste facultatif.

#### Modèle cible — média pendant l’Exécution

La conception de la consultation média incluse au MVP (D-203) distingue :
- la collection ordonnée de Médias appartenant à l’Exercice ;
- l’état durable de l’Exercice et de son Instantané ;
- un état UI transitoire propre à la séance d’Exécution courante.

Cet état UI porte la face courante et le média courant. Il ne modifie ni l’Exercice, ni l’Instantané, ni le Plan d’Exécution, ni les résultats historiques. Le moteur d’Exécution continue de progresser lorsque la face Média ou le plein écran est affiché.

Voir `../CONCEPTION-EXECUTION-MEDIA.md`.

#### Présentation des objets

Contenu identique à la section [« RG des cartes »](06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md#rg-des-cartes) : il n’est pas recopié ici.

##### Saisie des paramètres d’exécution

Contenu identique à la section [« Saisie des paramètres d’exécution »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#saisie-des-paramètres-dexécution) : il n’est pas recopié ici.

<a id="formats-modele"></a>
#### Formats — modèle fonctionnel

**Cible PRE-9 clarifiée le 29/10/2026 :** un Format et ses réglages sont attachés à chaque **Exercice de la Séance** ; ils ne constituent ni un Format unique de Séance, ni un Format du Circuit. L’origine de création reste une information distincte de la Séance. Le Circuit organise ses membres, sa nature et son compte ; le Cycle répète sa séquence. Les constantes de chaque Exercice formaté sont imposées ; les réglages autorisés restent éditables ; les valeurs dérivées sont recalculées. Une modification n’altère jamais les instantanés passés. [La précédente portée « trois informations distinctes de Séance » est supersédée pour le Format et ses réglages.]

| Format / origine | Organisation et borne | Indexation |
|---|---|---|
| Tabata | Par exercice ou alternance ; huit séries de 20 s et pause 10 s par exercice | Série ; un tour d’ensemble dans la copie par exercice |
| Intervalles 30/30 | Compte réglable, jamais durée globale saisie | Occurrences de 30 s + 30 s |
| EMOM | Organisation réglable ; compte et fenêtre réglables | N passages de chaque exercice ; durée N × E × W |
| AMRAP | Répétition jusqu’à la durée imposée | Tours réalisés, nombre non fixé au départ |
| For time | Travail prescrit jusqu’à son accomplissement ; pas de choix d’organisation | Volume par tour, pas séries locales successives |
| Death by | Fenêtres cadencées à objectif croissant ; arrêt déclaré | Rang par horloge ; tour acquis par objectif confirmé |
| Départs rapides | Valeurs préremplies, librement modifiables | Progression : répétitions par série, y compris en alternance |

Le résultat Death by distingue rang, tours acquis, répétitions partielles, motif et état incomplet. La cible À l’échec reste celle de la série définie le 13/10. Aucun nouveau mode d’exercice n’est créé. Les côtés demeurent propres à l’exercice ; les raccordements non démontrés avec les fenêtres restent explicités dans la chapitre 08, Combinaisons dont la règle reste à préciser.

## Planification

### Planification des créneaux et de leurs contenus — Le concept central : un créneau peut porter plusieurs contenus

#### Ce qui change

Jusqu'ici, planifier revenait à poser **une** séance ou **un** exercice sur un créneau. Désormais un créneau porte une **liste ordonnée de contenus**, qui peuvent être des séances, des exercices, ou un mélange des deux.

#### L'invariant, qui ne bouge pas

> **Le créneau produit les occurrences ; le contenu ne fait que les filtrer.**

Aucun contenu ne peut créer une occurrence que le créneau n'a pas produite. Cet invariant commande tout le reste, en particulier le modèle de fréquence ([Planification des créneaux et de leurs contenus — La fréquence d'un contenu : « x fois sur n »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#planification-des-créneaux-et-de-leurs-contenus--la-fréquence-dun-contenu---x-fois-sur-n-)).

#### « Parcours » : un mot, pas un objet

Le mot **parcours** réapparaît dans l'interface, mais **uniquement comme vocabulaire**. L’ancien objet autonome Parcours est retiré de la conception :

> Le parcours n'est pas une entité du modèle. Il n'a ni identité, ni persistance propre, ni écran de détail, ni rattachement. Il désigne **ce que produit** la planification de plusieurs contenus liés sur un même créneau. C'est un résultat nommé, pas une classe.

À distinguer soigneusement du **Programme**, qui est, lui, un conteneur réel ([Planification des créneaux et de leurs contenus — Le Programme](04%20%E2%80%93%20Mod%C3%A8le%20fonctionnel.md#planification-des-créneaux-et-de-leurs-contenus--le-programme)).

L’ancien usage de **circuit** pour cet objet autonome est supprimé. Le **Circuit interne à une Séance** reste conservé : un Tour en est une répétition . Ne pas supprimer ni renommer les identifiants techniques historiques dans cette mission documentaire.

#### Ordre des contenus

La liste est ordonnée et réordonnable. Chaque ligne porte une poignée de réordonnancement (icône `icon/poignee`, 12 × 18), le nom du contenu, et sa fréquence propre.

---

### Planification des créneaux et de leurs contenus — Le Programme

#### Première apparition dans l'interface

Le Programme apparaît pour la **première fois** dans l'interface, sur l'écran de planification. C'est un point à souligner dans la documentation : le concept existait dans la conception (document `Programme / Modèle de Programme` V1.2) mais n'était représenté nulle part.

#### Forme et position

Une **ligne de valeur** — libellé « Programme » à gauche, valeur à droite — en **première position du formulaire**, au-dessus de « Début le ».

Valeur par défaut : **« Aucun »**. Le rattachement est facultatif.

#### Pourquoi en première position

Ce n'est pas un choix de mise en page mais une conséquence du modèle :

> La fenêtre du programme **borne** les dates qui le suivent. Le choisir après les dates reviendrait à valider à rebours une saisie déjà faite. Un conteneur se déclare avant son contenu.

Référence : document de conception `Programme / Modèle de Programme` V1.2, § 9 (borne de début) et § 29.2 (gel de l'échu).

#### Ce qui reste à concevoir

Trois écrans du parcours Programme n'existent pas encore et doivent être signalés comme tels :

- la **création** d'un programme (nom, intention, période) ;
- la **proposition de rattachement** automatique des occurrences existantes tombant dans la période ;
- l'**avertissement** lorsqu'une occurrence tombe hors de la période du programme choisi.

---

## Suivi et synthèse

### Suivi et historique des séances — Principe général

Chaque exécution d'une séance crée un nouvel enregistrement dans l'historique.

Le suivi permet à l'utilisateur de consulter les séances déjà réalisées, leur déroulement et leur résultat.

Chaque exécution est indépendante des autres et reste conservée même si la séance d'origine est ensuite modifiée ou supprimée.

## Référentiels

### Gestion des référentiels utilisateur

Les référentiels utilisés dans le MVP sont de deux natures :
- les **Étiquettes de Séances**, qui qualifient la Séance et portent sa couleur ;
- les **Catégories d’Exercices**, qui qualifient les Exercices et portent leur couleur ;
- les **Zones corporelles**, issues d’un référentiel utilisateur distinct des Catégories et initialisé avec des valeurs par défaut.

#### Gestion des Étiquettes et des Catégories

Les Étiquettes classent les Séances et portent leur couleur. Les Catégories classent les Exercices et portent leur couleur sémantique. Les Zones corporelles restent un référentiel distinct.
Une Séance utilise son Étiquette pour son classement et sa couleur. Un Exercice utilise sa Catégorie ; les Zones corporelles restent indépendantes. La gestion détaillée de ces référentiels suit les écrans et contrats actifs.

L'utilisateur peut consulter et sélectionner les Étiquettes de Séance et les Catégories d’Exercice selon le contexte d’écran.

#### Référentiel des zones corporelles

Les zones corporelles permettent de caractériser les exercices selon les parties du corps principalement sollicitées.
Un Exercice valide possède une ou plusieurs Zones corporelles ; la sélection reste multiple.

Dans le MVP, les Zones corporelles constituent un référentiel utilisateur administrable, initialisé avec dix valeurs par défaut. L’utilisateur peut consulter et sélectionner plusieurs Zones corporelles lors de la création ou de la modification d’un Exercice. Il peut également créer une nouvelle Zone corporelle, renommer une Zone existante et supprimer une Zone. Lorsqu’une Zone supprimée est utilisée par des Exercices courants, ses associations aux objets existants sont conservées après confirmation ; les Instantanés et Exécutions historiques restent inchangés.


## Mouvement et interface — actualisation du 25/10

**D-445 — décisions validées le 25/10 :** C01–C07 et C09 sont clos ; C08 seul reste différé sur le périmètre MVP. [Spécification consolidée v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md). [bandeau répété dans ce chapitre, sans portée propre : même renvoi à D-445 que celui d’en-tête — annotation du 26/10/2026]


### Phases — clarification PHC-20261026

Les phases forment un motif cyclique de guidage : un passage complet correspond à une répétition guidée. Chaque phase conserve une durée en secondes. La somme des phases est la durée du motif, jamais la durée cible de la série. Les modes Durée et Répétitions, avec cible chiffrée ou À l’échec, sont compatibles ; seules les séries variables restent incompatibles avec les phases. [remplacé par D-446 du 26/10/2026 : les phases sont aussi compatibles avec les séries variables ; une seule séquence de phases et de durées, commune à toutes les séries] La condition d’arrêt appartient à la série. En Durée chiffrée, la cible indépendante termine la série à échéance, même au milieu d’une phase. À l’échec, le guidage boucle jusqu’à Suivant. En Répétitions chiffrées, R motifs donnent une durée nominale R × somme des phases ; Suivant conserve la validation manuelle existante. Chaque nouvelle série recommence à la première phase. Les cycles guidés ne prouvent pas les répétitions effectivement réalisées.

Modifier, ajouter ou supprimer une phase ne réécrit pas la cible de série. Toutes les durées de phase sont éditables, y compris sous un format à durée imposée : aucune dernière phase calculée, aucune adaptation proportionnelle pour faire tenir le motif dans la série. Une durée manquante reste à renseigner ; ne pas inventer une durée depuis l’objectif de série. Les bornes existantes des phases restent des bornes du motif, indépendantes de celles de la cible. Le retrait 2 → 1 conserve le passage à Sans mais ne remplace plus la cible par la durée restante. Sans phases conserve également la cible existante.

Référence normative : [PHC-20261026](../KODJO-Phases-Guidage-Cyclique-2026-10-26.md). La règle Répétitions sans bip = non calculable concerne désormais les exercices sans phases : avec phases, R × durée du motif donne une estimation nominale, jamais une mesure. Arrêt mixte et guidage après objectif avant Suivant restent les deux points distincts décrits dans cette référence. [clos par D-446 du 26/10/2026 : l’arrêt mixte se représente par les séries variables, avec phases ; en Répétitions chiffrées, le motif continue de boucler, sans signal, entre la cible et Suivant] Les anciennes captures sont des preuves datées ; alignement Figma et code non revendiqué.
