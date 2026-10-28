# Parcours utilisateur

## Catalogue des mouvements — composer une famille, 28/10/2026

Appui long, déplacement, arrêt sur l'emplacement puis relâchement : même geste pour réordonner, sortir, créer ou rejoindre une famille. Le filet et les pastilles prévisualisent le résultat ; une famille repliée se déplie. Seul un mouvement sans famille peut être lié à une autre carte ; un changement de famille impose sortie puis liaison, en deux gestes. Le dernier couple se dissout lors d'une sortie explicite. Application immédiate, sans message pour le seul ordre ; changement d'appartenance annoncé avec Annuler pendant 3 secondes. Le tri du catalogue place le mouvement sorti, même en tête de liste. Voir [règles A à E et recette FAM-01–11](../DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md) et CE-MVT-03. Ajouter un niveau conserve son formulaire distinct.

> **C08 — actualisation du 28/10/2026.** La [composition des familles depuis le catalogue](../DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md), règles A à E et CE-MVT-03, est désormais définie : rattacher, détacher et dissoudre une famille par geste. Les mentions antérieures « C08 différé » restent historiques pour ces opérations ; elles ne sont plus une restriction active. La suppression définitive d'un mouvement reste distincte et n'est pas clôturée par ce lot.

### Ajouter un niveau — glissé du catalogue et résultats proches (27/10/2026)

Le libellé utilisateur **Ajouter un niveau** remplace **Créer une variante** dans les actions du catalogue des mouvements et dans les cartes de résultats. L'opération reste la création d'un mouvement distinct dans la même famille ; aucun changement d'identité ou de filiation de la source. La décision ne crée pas une quatrième action glissée.

| Entrée | Choix du sens | Destination |
| --- | --- | --- |
| Catalogue : glissé sur un mouvement → Ajouter un niveau | Deux boutons **Plus facile ↓** et **Plus difficile ↑** se déploient sous les trois actions, dans la liste, sans navigation | Après choix, formulaire du nouveau niveau `10415:21980`, directement |
| Liste des mouvements proches : Ajouter un niveau | État `10415:21939`, désormais nommé « Mouvement — Niveau, plus facile ou plus difficile » ; le choix Utiliser ce mouvement reste pertinent dans cette origine | Formulaire du nouveau niveau après choix du sens |
| Menu Niveau de la fiche | Ajouter un niveau → Plus facile / Plus difficile, selon D-448 point 9 | Formulaire du nouveau niveau |

Dans le catalogue, les trois actions restent **Partager / Ajouter un niveau / Archiver**. L'ouverture du choix est un état de la carte, pas un écran de navigation : ne pas router vers `10415:21939`, ne pas ajouter de barre de retour ou de commande Utiliser ce mouvement à cette étape. Les cartes suivantes descendent pour libérer l'espace nécessaire ; le filet de la famille s'allonge d'autant. Aucun recouvrement, aucun changement d'ordre ou de rang. Refermer le choix restitue la disposition sans créer de mouvement.

Plus facile signifie insertion avant la source dans l'ordre de difficulté ; Plus difficile signifie après. Les flèches décrivent la difficulté, pas une position de dépose dans la liste (qui peut présenter le niveau le plus élevé en premier). La sélection du sens prépare le brouillon ; seul l'enregistrement crée le nouveau niveau. Préremplissage, nom unique, annulation et sauvegarde directe restent ceux de CE-MVT-01. La création de niveau depuis une séance n'est pas réintroduite.

Nouvel état : **Mouvement — Catalogue — Ajouter un niveau**, `10579:21580`, après Actions glissées `10475:47634`. Le relevé du 27/10 comptait 12 états ; celui du 28/10 en compte 13 avec la création d’une famille. Le lot du 27/10 comporte 12 états, dont ces deux états intégrés au présent dossier ; cela ne clôt pas les règles de partage ou d'archivage. La livraison ciblée inclut cette entrée d'ajout de niveau, sans imposer la refonte complète du catalogue.

Le relevé utilisateur signale huit libellés visibles et seize noms de calques renommés. Le relevé direct et les captures actualisées sont conservés dans `figma-mouvements-2026-10-27/ajout-niveau-glisse.json`. « Variante » reste un terme explicatif du modèle, pas le libellé de l'action. La frame `10415:21939` conserve actuellement « Moins difficile » dans son contenu : cela signifie Plus facile et ne justifie pas une troisième direction.

## Parcours ciblé — créer ou modifier un mouvement

Catalogue des mouvements → création vierge → saisie du nom et suggestions → mouvement indépendant ou variante explicite → contenu → Terminer → catalogue/fiche enregistrée. Une reprise ouvre la fiche du mouvement existant, sans nouvelle identité. Catalogue → fiche consultée → crayon → brouillon → sauvegarde selon C03 → fiche enregistrée. Annuler un dialogue conserve le brouillon ; confirmer l'abandon le détruit. Depuis une séance, utiliser un mouvement n'ouvre ni édition partagée ni création de variante. Voir CE-MVT-01 et la spécification ciblée pour toutes les branches.

> **Référence ciblée — parcours Mouvement, 27/10/2026.** [Création et modification des mouvements](../DSF-MOUVEMENTS-CREATION-EDITION-2026-10-27.md) remplace, sur ce périmètre seulement, les anciens écrans de création d’exercice : nouveau gabarit, structure des phases sans durées, modification et variante depuis le catalogue des mouvements. Le crayon et la création de variante depuis une séance ne sont plus des parcours cibles. Les règles de recherche R01–R08 et de sauvegarde C03 restent applicables. Les autres lots de la simplification ne sont pas déclarés documentés ou livrés par cette mise à jour.

> **Cible validée D-449 — 26/10/2026.** [Six décisions closes](../KODJO-Seance-Objet-Unique-Decisions-2026-10-26.md). Les dispositions ci-dessous sur l’exercice autonome de catalogue, le lancement `ACTIVITY`, le cycle technique unique et les catalogues séparés par nature décrivent le modèle antérieur et sont remplacées sur ces seuls points. Les autres règles restent applicables. La réalisation et les visuels Figma ne sont pas déclarés livrés.

## Parcours cible — D-449

Créer et enregistrer une séance, même avec un seul exercice. Reprendre une séance insère une copie de sa composition au niveau principal de la destination, sans séance imbriquée ni synchronisation. Lancer exécute la séance avec tout son contenu. Les parcours historiques de création/lancement d’un exercice autonome sont remplacés dans la cible.

**D-445 — décisions validées le 25/10 :** C01–C07 et C09 sont clos ; C08 seul reste différé sur le périmètre MVP. [Spécification consolidée v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md).


## Sommaire

- [Objet et organisation du chapitre](#objet-et-organisation-du-chapitre)
  - [Objectif de cette note](#objectif-de-cette-note)
  - [Synthèse des parcours du MVP](#synthèse-des-parcours-du-mvp)
- [Séances](#séances)
  - [Parcours complémentaire 1 — Créer une séance à partir d'une référence](#parcours-complémentaire-1--créer-une-séance-à-partir-dune-référence)
  - [Parcours complémentaire 3 — Archiver puis supprimer une Séance](#parcours-complémentaire-3--archiver-puis-supprimer-une-séance)
  - [Navigation principale et articulation des écrans — Parcours de création d’une Séance](#navigation-principale-et-articulation-des-écrans--parcours-de-création-dune-séance)
  - [Navigation principale et articulation des écrans — Parcours d’ouverture et de modification d’une Séance](#navigation-principale-et-articulation-des-écrans--parcours-douverture-et-de-modification-dune-séance)
- [Exercices](#exercices)
  - [Création, niveaux et correction — cible MFN](#création-niveaux-et-correction--cible-mfn)
  - [Parcours MVP T03 — Catalogue des Exercices](#parcours-mvp-t03--catalogue-des-exercices)
  - [Navigation principale et articulation des écrans — Parcours du Catalogue des Exercices — MVP T03](#navigation-principale-et-articulation-des-écrans--parcours-du-catalogue-des-exercices--mvp-t03)
- [Paramètres d’exécution](#paramètres-dexécution)
  - [Paramètres d’exécution — complément](#paramètres-dexécution--complément)
- [Composition des séances](#composition-des-séances)
  - [Parcours principal — Créer et exécuter une séance](#parcours-principal--créer-et-exécuter-une-séance)
- [Exécution](#exécution)
  - [Parcours complémentaire 3 — Gérer une séance interrompue ou partiellement réalisée](#parcours-complémentaire-3--gérer-une-séance-interrompue-ou-partiellement-réalisée)
  - [Navigation principale et articulation des écrans — Parcours d’Exécution](#navigation-principale-et-articulation-des-écrans--parcours-dexécution)
- [Planification](#planification)
  - [Parcours complémentaire 2 — Gérer les routines](#parcours-complémentaire-2--gérer-les-routines)
  - [Conception de planification](#conception-de-planification)
- [Suivi et synthèse](#suivi-et-synthèse)
  - [Parcours complémentaire 4 — Consulter le suivi des séances](#parcours-complémentaire-4--consulter-le-suivi-des-séances)
  - [Navigation principale et articulation des écrans — Parcours de consultation du Suivi](#navigation-principale-et-articulation-des-écrans--parcours-de-consultation-du-suivi)
- [Référentiels](#référentiels)
  - [Parcours](#parcours-5)
- [Parcours](#parcours-6)
  - [Parcours prévus pour une phase ultérieure](#parcours-prévus-pour-une-phase-ultérieure)

## Objet et organisation du chapitre

### Objectif de cette note

> *Texte identique à celui de la section [« Règles métier et calculs »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#règles-métier-et-calculs) ; il n’est pas recopié ici.*

Décrire, du point de vue de l'utilisateur, les principaux parcours permettant de créer, planifier, exécuter et suivre ses séances dans l'application.

Cette note décrit les objectifs de l'utilisateur et l'enchaînement logique des actions, sans détailler encore les écrans ni les choix techniques.
### Synthèse des parcours du MVP

#### Objectif

Présenter la couverture fonctionnelle du MVP et orienter vers les parcours utilisateur détaillés de ce chapitre.

Le MVP permet à l'utilisateur :
- de gérer les Étiquettes de Séances, les Catégories d’Exercices et le référentiel de Zones corporelles, puis de sélectionner les Zones corporelles applicables aux Exercices ;
- de créer, réorganiser et exécuter une séance ;
- de créer une séance à partir de la duplication d'une séance existante ;
- de planifier directement une Séance **ou un Exercice persistant** au moyen d'une Routine ;
- de modifier ou supprimer une routine ;
- de gérer une séance partiellement réalisée ou interrompue ;
- de consulter les Exécutions enregistrées dans le Suivi ;
- d’accéder au Catalogue des Exercices, d’y créer et modifier des Exercices persistants ;
- de sélectionner plusieurs Exercices existants pour les insérer dans une Séance ;
- d’exécuter directement un Exercice avec préparation, Synthèse et Suivi.
#### Parcours de référence

| Tranche          | Besoin utilisateur                            | Parcours de référence                                                          | Statut documentaire   |
| ---------------- | --------------------------------------------- | ------------------------------------------------------------------------------ | --------------------- |
| T01–T02          | Gérer Étiquettes, Catégories et Zones corporelles | Gestion des référentiels utilisateur                                        | Spécifié MVP          |
| T01–T02          | Créer et réorganiser une Séance               | Parcours principal — Créer une Séance                                          | Spécifié MVP          |
| T03              | Gérer des Exercices persistants              | Accéder au Catalogue des Exercices ; créer, consulter ou modifier un Exercice | Spécifié MVP          |
| T03              | Ajouter des Exercices existants à une Séance | Sélectionner plusieurs Exercices existants depuis la Composition              | Spécifié MVP          |
| T03              | Exécuter directement un Exercice             | Préparation de 5 s, Exécution, Synthèse obligatoire et retour au Catalogue     | Spécifié MVP          |
| T04              | Exécuter une Séance                           | Exécution guidée fondamentale, auparavant T03                                  | Spécifié MVP          |
| T05 et suivantes | Dupliquer, planifier et suivre les Séances    | Parcours complémentaires 1 à 4                                                 | Spécifié MVP          |
| Évolution 08/10 | Planifier plusieurs contenus sur un créneau | Sélection commune → formulaire → fréquence par contenu | Conception cible, points ouverts tracés |
#### Limites du MVP

Le MVP ne prend pas encore en charge :
- le partage ou la collaboration ;
- les comptes utilisateurs et la synchronisation entre appareils ;
- l'interaction avec un professionnel de santé ou un coach ;
- les bibliothèques de séances partagées ;
- l'assistance par intelligence artificielle ;
- les tableaux de bord et graphiques avancés ;
- le multilingue.

Ces fonctions sont prévues pour des versions ultérieures.

## Séances

### Parcours complémentaire 1 — Créer une séance à partir d'une référence

#### Objectif du parcours

Permettre à l'utilisateur de créer rapidement une nouvelle séance à partir d'une séance existante.
#### Situation de départ

L'utilisateur dispose déjà d'une séance dont la structure est proche de celle qu'il souhaite créer.
Il préfère la dupliquer plutôt que recréer entièrement son contenu.
#### Parcours

1. L'utilisateur ouvre le catalogue des séances.
2. Il sélectionne la séance qu'il souhaite utiliser comme référence.
3. Il choisit **Dupliquer**.
4. Une nouvelle Séance indépendante est créée avec le premier nom disponible : `{nom} (copie)`, puis `{nom} (copie 2)`, etc. ; aucun nom ne doit être saisi pour déclencher la duplication (API-SEA-05).
5. La nouvelle Séance est disponible pour modification, y compris de son nom.
6. L'utilisateur peut modifier librement son contenu.
7. Il enregistre la séance.
#### Résultat attendu

L'utilisateur crée rapidement une nouvelle séance en s'appuyant sur une séance existante, puis l'adapte à son besoin sans modifier l'original.
### Parcours complémentaire 3 — Archiver puis supprimer une Séance

1. Depuis la vue `Séances` non archivée, révéler les actions d’une Séance active par glissement gauche.
2. Choisir `Archiver` ; aucune suppression directe n’est proposée dans ces vues.
   - Si aucune Routine n’est associée, l’archivage est immédiat et ne demande pas de confirmation. Un snackbar `Séance archivée` propose temporairement `Annuler` ; cette action annule l’archivage et replace la Séance dans la liste active.
   - Si au moins une Routine est associée, une confirmation explicite est demandée avant l’archivage. Après confirmation, les Routines dont cette Séance est l’unique contenu sont supprimées, sans snackbar d’annulation. Pour les Routines à plusieurs contenus, l’effet de l’archivage reste `À CLARIFIER` : ne pas généraliser la suppression des autres planifications (D-023, D-328).
3. Activer le filtre `Archivées` depuis le contrôle `Filtrer`.
4. Glisser la carte vers la gauche : la carte se déplace avec le geste et révèle l’action `Supprimer` placée derrière.
5. Choisir `Supprimer`, puis confirmer dans la modale. `Annuler` revient à la liste `Archivées`.

Les Exécutions historiques restent conservées après suppression.
#### Résultat attendu

L'utilisateur gère facilement la planification de ses séances sans modifier leur contenu et conserve un historique fiable de toutes les exécutions réalisées.

### Navigation principale et articulation des écrans — Parcours de création d’une Séance

Depuis `Catalogues`, segment `Séances`, l’utilisateur peut créer une Séance.

La création suit le parcours suivant :

1. saisie du nom et construction de la Composition dans l’écran unique `Composer une séance` ;
2. sélection facultative de l’Étiquette de Séance dans la modale intégrée ; la couleur de l’Étiquette devient la couleur de la Séance ;
3. ajout d’au moins un Exercice valide ;
4. action `Continuer` pour valider et enregistrer ;
5. retour au `Catalogue des séances`, segment `Séances`.

Aucune Routine n’est créée automatiquement. La transition canonique d’avancement fait entrer l’écran cible depuis la droite et sortir l’écran courant vers la gauche.

### Navigation principale et articulation des écrans — Parcours d’ouverture et de modification d’une Séance

Dans le `Catalogue des séances`, toucher la zone principale d’une carte active ouvre directement la Séance en mode modification dans `Modifier une séance`. Cette action est disponible que la carte soit condensée ou déployée.

Le déploiement de la carte est facultatif et sert uniquement à consulter rapidement son contenu.

Le chevron déploie ou replie la carte. La zone `Démarrer` lance le parcours d’Exécution. Ces zones tactiles conservent chacune leur comportement propre.

## Exercices

### Création, niveaux et correction — cible MFN

Références visuelles : [relevé Figma du 23/10](../DSF-MOUVEMENT-FILIATION-NIVEAUX-2026-10-23.md). Reprendre un geste présente son contenu en lecture seule, déverrouillable par crayon en création, au Catalogue et en séance, au Catalogue et en séance ; les paramètres restent éditables. Créer explicitement une variante n’affiche pas une seconde question d’identité. Depuis la fiche, le popover propose « Changer de niveau / Ajouter un niveau » ; aucune action glissée supplémentaire au Catalogue.

Créer un exercice commence dans l’éditeur. La recherche explicite d’un mouvement, accessible avant la saisie détaillée, et les suggestions incluent les mouvements créés localement ; catalogue d’entretien distinct de ce sélecteur (D-445). Choisir le même mouvement reprend son contenu et permet de saisir d’autres paramètres. Une variante crée un nouveau mouvement et son exercice ; un mouvement indépendant n’est pas rattaché. Aucun écrasement silencieux d’une saisie existante.

Depuis la fiche, créer un niveau l’insère après l’origine ; glisser réordonne les niveaux. Une navigation vers un niveau laisse choisir précisément ses paramètres parmi ses exercices. Ouvrir un exercice Catalogue entre directement en édition. L’enregistrement d’un contenu déjà utilisé pose la question de correction ou de création selon [règles MFN-01 à MFN-13](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#mouvement-filiation-et-niveaux) ; les occurrences existantes ne sont pas mises à jour.

Dans la Composition, l’occurrence lit le mouvement courant. Le crayon ouvre sa correction partagée ; paramètres locaux et Niveau restent actifs. Créer un autre mouvement ou changer de niveau remplace l’occurrence, sans réattribuer les historiques. Aucun rapprochement rétroactif de records (D-445).


### Parcours MVP T03 — Catalogue des Exercices

#### Accéder au Catalogue des Exercices

1. Ouvrir le Catalogue puis sélectionner `Exercices`.
2. Consulter la liste des Exercices persistants.
3. Utiliser la surface d’une carte pour ouvrir l’Exercice en consultation ou modification.
4. Utiliser le bouton Lecture pour lancer directement un Exercice valide.
5. Utiliser `Créer` pour ouvrir directement la création correspondant au Catalogue courant.

Les filtres et la position de défilement appartiennent à l’état du Catalogue et sont restaurés au retour d’une consultation, d’une modification ou d’une Exécution directe. Le MVP n’inclut pas de recherche Catalogue.

#### Créer un contenu depuis le Catalogue

`Créer` est contextuel au Catalogue affiché et ne présente aucun écran ni arbre intermédiaire :

1. dans le Catalogue `Exercices`, `Créer` ouvre directement le formulaire de création d’un Exercice persistant ;
2. dans le Catalogue `Séances`, `Créer` ouvre directement une nouvelle Composition de Séance ;
3. Aucun troisième Catalogue : parcours est seulement un libellé de planification.

Dans T03/MVP, le segment `Parcours` est supprimé : aucune troisième option, même désactivée. L’ancien objet autonome est retiré par D-328.

#### Créer ou modifier un Exercice

1. Depuis le Catalogue des Exercices, utiliser `Créer` pour ouvrir une nouvelle `ActivityDefinition`, ou toucher une carte existante pour la modifier.
2. Renseigner le nom de l’Exercice.
3. Sélectionner sa **Catégorie** et au moins une **Zone corporelle** (D-211).
4. Définir les paramètres d’exécution :
   - mode `Durée` ou `Répétitions`, chaque Série pouvant avoir une cible `À l’échec` (D-111) ; la ligne `Condition d’arrêt` règle ce choix en séries identiques et le présente comme résultat en séries variables (RM-248, RM-249) ;
   - cible du mode lorsqu’elle existe ;
   - nombre de Séries ;
   - Pause après chaque série ;
   - `Charge` facultative : `Avec` ou `Sans` (RM-237, RM-238) ;
   - `Changement de côté` : `Avec` ou `Sans` (D-406) ;
   - `Enchainement` et Pause entre les côtés, uniquement avec changement de côté (`Avec`) ;
   - Compte à rebours propre de l’Exercice lorsqu’il est utilisé ;
   - Fin d’exercice propre lorsqu’elle est utilisée ;
   - Durée totale dérivée ou pilotée selon le mode, présentée sur la ligne `Durée de l’exercice` (D-409).
5. Ajouter ou consulter le média selon le périmètre disponible.
6. Valider avec `Terminer`.

Les paramètres métier restent identiques entre création et modification ; seule l’organisation de l’écran et le contexte de retour diffèrent.

### Définir les phases d’un exercice — MVP

Dans la feuille Paramètres d’exécution, la ligne Phases de l’exercice [remplacé par D-448 du 26/10/2026 : libellé « Phases du mouvement »] ouvre le cadre Séries (D-413). Sur un exercice en Durée ou Répétitions, à cible ou à l’échec, en séries identiques [et variables depuis D-446 du 26/10/2026 : une seule séquence de phases et de durées commune à toutes les séries], choisir Avec crée deux phases dont les durées sont à renseigner indépendamment de la cible de série (PHC-20261026). Ajouter, nommer, régler et déplacer jusqu’à six phases ; leur somme est la durée du motif ; la cible de série reste indépendante. Le chevron, à l’intérieur de l’option Avec, n’existe que lorsque la liste existe (D-410). ✓ applique au brouillon parent ; ✕ annule ; l’enregistrement reste celui du parent.

Dans un format imposant une durée de travail, la cible de série suit le format et les durées du motif restent inchangées. Aucune dernière phase calculée ni adaptation proportionnelle (PHC-20261026). Règles détaillées et cas encore à préciser : [Phases d’exercice](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phases-exercice).

#### Ajouter un Exercice depuis une Composition

1. Appuyer sur `Ajouter un exercice`.
2. Le parcours actuellement exposé ouvre directement la sélection des Exercices du Catalogue.
3. Filtrer si nécessaire les Exercices puis sélectionner une ou plusieurs références.
4. Valider avec `Sélectionner` (D-228).
5. Les copies sont insérées dans la Composition et deviennent indépendantes de leur `ActivityDefinition` source.

La capacité existante de créer directement un Exercice local à la Séance, non enregistrée dans le Catalogue, reste fonctionnellement et techniquement conservée mais n’est pas exposée dans cet enchaînement d’écrans du MVP courant.

#### Utiliser un Exercice de référence

1. Ouvrir `Exercices` dans le Catalogue.
2. Créer une référence d’Exercice persistant, réutilisable et directement exécutable.
3. Depuis une Composition, choisir une référence existante.
4. L’application copie ses données et ses associations média dans la Séance.
5. Modifier librement la copie sans modifier la référence ni les autres copies.

Un Exercice créé directement dans une Séance ne rejoint pas le catalogue. L’action `Enregistrer dans mes exercices` est reportée au-delà de la première version de la bibliothèque.

#### Exécuter un Exercice À l’échec — MVP

L’utilisateur démarre une Série sans objectif temporel ni nombre de répétitions cible. Il sélectionne `Suivant` pour terminer la Série, exactement comme en mode Répétitions. La Pause configurée s’exécute après chaque Série, selon l’Ordre des côtés, dernière Pause comprise (Bip v 2). Si l’Exercice est bilatéral, la Pause entre les côtés éventuelle intervient entre les deux passages. En Exécution directe, aucune Récupération après exercice n’est ajoutée ; dans une Séance, la Récupération après exercice appartient à l’occurrence et s’exécute après celle-ci.

#### Parcours bilatéral

1. Dans l’éditeur d’Exercice, `Changement de côté` propose `Avec` ou `Sans` ; l’utilisateur choisit lui-même le côté par lequel il commence (D-406, RM-242). `Avec` rend disponibles `Enchainement` et `Pause entre les côtés`.
2. Aucun réglage de côté n’est exposé au niveau du Circuit dans la version actuelle ; le support technique historique est conservé mais reste fixé à `UNILATERAL` et non modifiable.
3. Une carte d’Exercice bilatéral affiche un indicateur de changement de côté, sans direction, rendu selon Figma (D-407, RM-243) ; elle n’affiche rien sans changement de côté.
4. À l’Exécution, `Côté 1` ou `Côté 2` apparaît pour le passage concerné, sans compteur `1/2` ou `2/2` (RM-243).
5. Un Exercice bilatéral exécute ses Séries selon l’Ordre des côtés (libellé visible `Enchainement`) : toutes ses Séries du premier côté puis toutes celles du second (défaut), ou les deux côtés à chaque série (D-247).
6. La modale générique de passage à l’Exercice suivant reste inchangée. Confirmée pendant le premier côté, elle enregistre ce côté comme partiel et ouvre le second côté ; confirmée pendant le second, elle poursuit le Plan d’Exécution.

#### Exécuter directement un Exercice — MVP T03

1. Ouvrir `Exercices` dans le Catalogue.
2. Appuyer sur l’action `Exécuter` d’un Exercice valide.
3. Le système fige un instantané autonome et affiche une préparation de `5 s`.
4. Après la préparation système, exécuter le Compte à rebours propre éventuel de l’Exercice, puis les Séries, Pauses, côtés et la Fin d’exercice éventuelle selon la définition figée.
5. Après la dernière phase propre à l’Exercice, entendre le signal de fin et ouvrir immédiatement la Synthèse.
6. Sélectionner obligatoirement un Ressenti ; le Commentaire reste facultatif.
7. Appuyer sur `Enregistrer` pour enregistrer l’Exécution dans le Suivi général avec l’origine `ACTIVITY`.
8. Revenir au Catalogue des Exercices avec filtres et position de défilement restaurés.

#### Consulter ou modifier un Exercice depuis le Catalogue — MVP T03

1. Ouvrir `Exercices` dans le Catalogue.
2. Appuyer sur la surface de la carte, hors bouton Lecture.
3. Consulter ou modifier l’Exercice.
4. Revenir au Catalogue dans son état précédent.

Le bouton Lecture reste réservé à l’Exécution directe. La carte d’Exercice affiche son média dans la gouttière permanente, sans Déployer avec ou sans média (D-260/D-261) ; l’action principale reste inchangée.

#### Ajouter plusieurs Exercices existants à une Composition — MVP T03

1. Depuis `Ajouter un exercice` dans la Composition, ouvrir le Catalogue d’Exercices présenté pour la sélection.
2. Filtrer le Catalogue si nécessaire.
3. Sélectionner une ou plusieurs cartes ; l’ordre des touchers est libre.
4. Vérifier le nombre indiqué par le compteur de sélection.
5. Appuyer sur `Sélectionner` (D-228).
6. Retrouver la Composition avec les copies insérées selon l’ordre de présentation qu’avaient les Exercices dans la liste filtrée au moment de la validation.

`Annuler` ferme le panneau sans insertion et restaure la Composition, sa position de défilement et ses valeurs déjà saisies. Le mécanisme existant de création directe d’un Exercice local à la Séance reste conservé fonctionnellement et techniquement, mais il n’est pas exposé dans cet enchaînement d’écrans du MVP courant.

### Navigation principale et articulation des écrans — Parcours du Catalogue des Exercices — MVP T03

Depuis le Catalogue, l’utilisateur sélectionne `Exercices` pour consulter la bibliothèque persistante. La surface d’une carte ouvre l’Exercice en consultation ou modification ; son bouton Lecture lance l’Exécution directe. L’action `Créer` est contextuelle : dans le Catalogue des Exercices, elle ouvre directement la création d’un Exercice persistant, sans écran ni arbre intermédiaire.

La rangée commune de commandes d’entrée est `Créer / Filtrer / Trier`. Le contrôle Filtrer démarre replié et blanc sans filtre. Un appui l’étend et affiche `Filtres / Aucun` sans modifier la liste ; un filtre sélectionné est conservé pendant la session courante, puis réinitialisé à `Aucun` au relaunch. La référence courante utilise des boutons contextuels visibles de `34 pt`, pictogrammes `20 pt`, gaps `12 pt` et cibles d’au moins `44 × 44 pt` sans chevauchement ; les pilules étendues ont une hauteur de `34 pt`. Pour `Exercices`, les critères contextuels sont statut (`Actives` / `Archivées`), Catégories et Zones corporelles. Pour `Séances`, le filtre couvre le statut et les Étiquettes. `Trier` reste visible mais désactivé et le tri appliqué reste `updatedAt DESC`. Filtre appliqué, tri implicite et scroll sont conservés pendant la session courante ; au relaunch, le filtre revient à `Aucun`.

Aucune recherche globale ou locale de Catalogue n’est active au MVP (D-221).

Depuis la Composition d’une Séance, `Ajouter un exercice` ouvre directement la sélection multiple du Catalogue des Exercices. La validation copie les Exercices dans leur ordre visible et restaure la Composition. La capacité historique de création directe d’un Exercice local à la Séance reste conservée fonctionnellement et techniquement mais n’est pas exposée dans ce parcours courant.

## Paramètres d’exécution

### Paramètres d’exécution — complément

Le parcours existant permet maintenant des Séries variables dans la même feuille de paramètres, avec un mode commun et des cibles/Pauses par Série, ainsi qu’une charge par Série lorsque la charge est activée (RM-238). Le `Changement de côté` se règle sur `Avec` ou `Sans`, sans désignation du côté de départ (D-406) ; l’Ordre des côtés, libellé visible `Enchainement`, reste un choix distinct. L’utilisateur peut choisir Un côté après l’autre ou Les deux côtés à chaque série ; N=1 est normalisé au premier ordre et au mode uniforme. Aucun nouveau parcours ni shell. Référence normative : [Paramètres et brouillon d’un exercice](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#paramètres-et-brouillon-dun-exercice), CE-T03-04 et CE-UI-10.

## Composition des séances

### Parcours principal — Créer et exécuter une séance

Au lancement, le splash KODJO ouvre automatiquement le `Catalogue des séances`. Celui-ci est l’écran d’accueil du MVP.

#### Objectif du parcours

Permettre à l'utilisateur de créer une séance, de l'exécuter immédiatement en étant guidé par l'application et de retrouver ensuite son exécution dans l'historique.

La planification des séances est décrite dans le parcours **Gérer les routines**.
#### Situation de départ

L'utilisateur souhaite créer une nouvelle séance correspondant à un entraînement sportif, une séance de rééducation, une routine de mobilité ou toute succession d'exercices nécessitant un guidage.

Il peut créer une séance entièrement nouvelle ou partir d'une copie d'une séance existante.
#### Parcours

##### Créer une séance

**Entrée Formats (cible 14/10, MVP selon D-378) :** le choix du modèle précède le parcours propre à ce modèle ; voir [Formats et départs rapides](#formats-parcours). Le parcours libre ci-dessous reste disponible.

L'utilisateur crée une nouvelle séance depuis le Catalogue.

Dans l’écran unique `Composer une séance`, il renseigne son nom, sélectionne éventuellement son Étiquette — dont la couleur devient la couleur affichée de la Séance — puis construit progressivement la Composition. La Composition peut contenir un Point d’arrêt déplaçable ; son attente ne compte pas dans la durée. Un Exercice peut définir son propre Compte à rebours et sa propre Fin d’exercice, distincts des phases structurelles de la Séance. Les Exercices peuvent être placées avant le Circuit, dans le Circuit ou après le Circuit. Le premier Exercice ajouté est inséré après le Compte à rebours initial et avant le Circuit. Le Cycle technique reste fixé à 1 et n’est jamais affiché.

Pour chaque Exercice, un écran unique permet de renseigner le nom, la Catégorie, les Zones corporelles, le mode Durée ou Répétitions, avec cible chiffrée ou À l’échec par série, la cible éventuelle, le nombre de Séries, la Pause après chaque série, la Charge facultative (RM-235 à RM-241), le Changement de côté (`Avec` / `Sans`, D-406), la **Pause entre les côtés** lorsque l’Exercice est bilatéral, le Compte à rebours propre et la Fin d’exercice propre. La Description reste facultative. L’action `Terminer` enregistre l’Exercice.

En mode Durée, l’utilisateur peut confirmer soit `Nombre de séries`, soit `Durée de l’exercice` (libellés D-413 et D-409). Le contrôle confirmé devient pilote ; l’autre est recalculé. Après saisie d'une Durée totale cible `Tv`, l’application arrondit au nombre entier de Séries le plus proche, avec `.5` vers le haut, puis recalcule `T(N)`. Si `T(N) ≠ Tv`, elle affiche temporairement « Durée ajustée à {T(N)} pour respecter un nombre entier de Séries. » ; si `T(N) = Tv`, elle n'affiche pas ce message.

`Continuer` reste désactivé tant que le nom n’est pas renseigné, qu’aucun Exercice valide n’est présent ou qu’un Exercice comporte une cible obligatoire non renseignée (D-380, D-123). L’Étiquette éventuelle est déjà gérée dans la Composition ; `Continuer` valide et enregistre la Séance avec sa Composition et son Étiquette.
##### Réorganiser une séance

À tout moment, l'utilisateur peut revenir modifier une séance existante.

Il peut notamment :
- ajouter un exercice ;
- supprimer un exercice ;
- modifier un exercice ;
- déplacer un exercice par appui long sur sa carte, puis glissement vers la position cible ;
- modifier le nombre de Tours du Circuit ;
- modifier les paramètres généraux de la séance.

Les modifications sont immédiatement prises en compte pour les futures exécutions.

Chaque occurrence peut recevoir explicitement une **Récupération après exercice**. Elle affiche ses informations seulement si sa durée est positive. Le trait de démarcation est conservé hors placement et supprimé pendant le choix (D-303). Cette récupération se déplace avec l’occurrence, est copiée lors de sa duplication et disparaît lors de sa suppression. Sa valeur n’est jamais recalculée en fonction de l’Exercice suivant.
##### Démarrer une séance

L'utilisateur choisit la zone `Démarrer` d’une séance et ouvre d’abord l’état initial d’Exécution. Toucher la partie principale de la carte ouvre au contraire la Séance en modification.
Avant le lancement, il peut consulter un résumé de la séance et vérifier ses principaux paramètres.
##### Exécuter une séance

Pendant l'exécution, l'application guide automatiquement l'utilisateur exercice après exercice.

Il peut notamment :
- suivre le minuteur ou les répétitions ;
- mettre la séance en pause ;
- reprendre la séance ;
- passer directement à l'exercice suivante ;
- arrêter la séance.
##### Terminer une séance

À la fin de l'exécution, l'application enregistre automatiquement la séance réalisée.
L'utilisateur doit renseigner un ressenti et peut ajouter un commentaire facultatif de **200 caractères maximum** avant de revenir à l'écran principal.
##### Consulter l'historique

L'utilisateur retrouve l'ensemble des séances déjà exécutées.
Chaque exécution conserve la version exacte de la séance utilisée lors de son lancement.
##### Modifier une séance

Après une ou plusieurs exécutions, l'utilisateur peut continuer à faire évoluer une séance.
Les modifications apportées ne concernent que les futures exécutions.
Les exécutions déjà enregistrées restent inchangées.
#### Résultat attendu

L'utilisateur peut créer, faire évoluer et exécuter librement ses séances, tout en conservant un historique fidèle de chacune de leurs exécutions.

## Exécution

### Parcours complémentaire 3 — Gérer une séance interrompue ou partiellement réalisée

#### Situation de départ

Pendant l'exécution d'une séance, l'utilisateur ne réalise pas toutes les exercices prévues ou doit interrompre son entraînement avant son terme.
La séance peut avoir été lancée directement ou à partir d'une routine planifiée.
#### Parcours

1. L'utilisateur démarre une séance.
2. Pendant son exécution, il peut :
    - mettre la séance en pause ;
    - reprendre la séance ;
    - passer directement à l'exercice suivante ;
    - terminer un exercice avant son terme ;
    - interrompre complètement la séance.
3. En cas d'interruption volontaire, l'application lui propose :
    - de reprendre immédiatement ;
    - d'arrêter définitivement la séance.
4. Si la séance est reprise, l'exécution reprend au dernier exercice enregistré.
5. Lorsque la séance est terminée ou abandonnée, l'application présente un récapitulatif indiquant notamment :
    - les exercices réalisés ;
    - les exercices partiellement réalisés ;
    - les exercices non commencés ;
    - la durée réelle de la séance ;
    - son statut.
6. Lorsque l'écran de Synthèse est présenté, l'utilisateur doit renseigner un ressenti et peut ajouter un commentaire facultatif de **200 caractères maximum**. En cas d'interruption technique sans passage par la Synthèse, le ressenti peut être absent.
7. La séance est enregistrée dans l'historique avec son statut :
- Terminée : toutes les Exercices ont été terminées normalement et la phase `SESSION_END` a été achevée.
- Partielle : la phase `SESSION_END` a été achevée et au moins un Résultat d’Exercice est `Partielle` ; une récupération écourtée ne suffit pas (D-379).
- Interrompue : l'Exécution a été arrêtée avant l'achèvement de `SESSION_END`, y compris pendant cette phase.
#### Résultat attendu

L'utilisateur conserve un historique fidèle de ce qu'il a réellement effectué, même lorsque la séance diffère de ce qui était initialement prévu.

### Navigation principale et articulation des écrans — Parcours d’Exécution

Le bouton `Démarrer` d’une Séance dans le Catalogue, ou celui d’une occurrence de Routine, ouvre l’écran d’Exécution. La surface principale d’une carte Catalogue ouvre la Composition en modification.

L’ouverture de cet écran ne démarre pas immédiatement le premier Exercice.

L’utilisateur déclenche l’Exécution depuis l’écran lui-même. Le Compte à rebours initial est alors exécuté, s’il est configuré avec une durée supérieure à zéro, puis le premier Exercice commence.

Lorsque la Séance se termine, l’écran de synthèse est affiché. L’action `Enregistrer` finalise le Ressenti et le Commentaire puis ouvre le `Suivi` (CE-UI-08).

## Planification

### Parcours complémentaire 2 — Gérer les routines

#### Objectif du parcours

Permettre à l'utilisateur de planifier l'exécution de ses séances, de modifier leur planification ou de supprimer une routine.
#### Situation de départ

L’utilisateur dispose d’au moins une Séance ou d’un Exercice persistant actif.
Il souhaite programmer son exécution à une date précise ou de manière récurrente.
#### Parcours

##### Créer une routine

1. Ouvrir le Calendrier puis **+ Planifier**, ou choisir **Planifier** sur une carte de Catalogue.
2. Cocher une ou plusieurs Séances et/ou Exercices ; valider avec **Ajouter 1 élément** ou **Ajouter n éléments**.
3. Choisir éventuellement un Programme, puis définir la date et l’heure de début.
4. Activer ou non Répétition ; si elle est activée, choisir Jour/Semaine/Mois, le multiplicateur et la borne jusqu’au/pendant. Les règles encore ouvertes sont tracées dans la spécification du 08/10.
5. Avec plusieurs contenus, réordonner les lignes sans titre et régler leur fréquence x fois sur n si nécessaire.
6. Activer et régler éventuellement le Rappel, vérifier le récapitulatif, puis **Enregistrer**.

Les étapes intermédiaires modifient le brouillon uniquement.

##### Modifier une routine

1. Sélectionner une routine dans le calendrier.
2. Choisir **Modifier la planification**.
3. Modifier les paramètres souhaités.
4. Enregistrer.

Les modifications s'appliquent uniquement aux occurrences futures.
##### Supprimer une routine

1. Depuis la vue Semaine, révéler l’action **Supprimer** par glissement gauche.
2. Pour une planification périodique, choisir **Seulement cette occurrence** ou **Toutes les occurrences à venir** ; **Annuler** occupe une seconde ligne en pleine largeur.
3. Confirmer la suppression.

Les occurrences futures cessent d'être générées. Les Exécutions déjà enregistrées sont conservées. Les occurrences planifiées passées non exécutées ne sont pas présentées dans l'interface du MVP.
Les exécutions déjà réalisées sont conservées.

### Conception de planification

Choisir une ou plusieurs Séances/Exercices par cases → Ajouter n éléments → Programme facultatif, Début, Répétition, contenus ordonnés si plusieurs, Rappel → Enregistrer. Chaque contenu filtre les occurrences du créneau par son motif x fois sur n. Les modalités ouvertes ne sont pas considérées livrées. Voir la [spécification](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification), les contrats CE-UI-04/05/11 et le [DSF général](../DSF-INTERFACE-GENERALE-2026-10-08.md).

## Suivi et synthèse

### Parcours complémentaire 4 — Consulter le suivi des séances

#### Objectif du parcours

Permettre à l'utilisateur de retrouver l'ensemble de ses séances exécutées, de consulter leur résultat, d'analyser leur déroulement et de suivre sa progression.
#### Situation de départ

L'utilisateur a déjà exécuté une ou plusieurs séances.
Il souhaite consulter son historique afin de retrouver une séance, vérifier son déroulement ou suivre son exercice au fil du temps.
#### Parcours

1. L'utilisateur ouvre le menu **Suivi**.
2. Il consulte la liste chronologique de ses Exécutions enregistrées.
3. Il parcourt la liste chronologique du plus récent au plus ancien ; aucune recherche d’Exécution n’est disponible dans le Suivi MVP, et `Trier` est désactivé (CE-T03-15).
4. Il consulte les groupes de dates et, sur chaque carte, la nature, le titre, le statut, la durée réelle, la catégorie et le ressenti lorsqu’il existe ; aucune heure n’est affichée dans la carte (D-262).
5. Il peut sélectionner une autre Exécution dans la liste.

La vue détaillée déployée d'une Exécution est reportée à une version ultérieure.

#### Résultat attendu

L'utilisateur dispose d'un historique fiable de toutes ses exécutions et peut suivre facilement son exercice ainsi que sa progression au fil du temps.

### Navigation principale et articulation des écrans — Parcours de consultation du Suivi

Dans le MVP, le `Suivi` affiche la liste des Exécutions enregistrées.

La future `Vue d’ensemble` reste visible dans le sélecteur mais elle est grisée et inactive. Elle est prévue pour une version ultérieure.

Chaque carte présente deux lignes, sans déploiement (D-262) ; le détail de l’Exécution reste conservé dans l’instantané et les résultats.

Les commandes `Filtrer` et `Trier` restent visibles mais désactivées dans le MVP ; la Vue d’ensemble est abandonnée pour le MVP et ne constitue plus un écran à développer. Cette règle du Suivi est distincte du Catalogue T03, où `Filtrer` est fonctionnel pour `Archivées` sur Exercices.

## Référentiels

### Parcours

1. Ouvrir la gestion ou la sélection du référentiel concerné.
2. Consulter les Étiquettes de Séance ou les Catégories d’Exercice existants.
3. Créer une nouvelle Étiquette depuis la Composition de Séance lorsque nécessaire ; la nouvelle Étiquette devient sélectionnable dans ce contexte.
4. Créer ou sélectionner une Catégorie depuis l’éditeur d’Exercice ; les Zones corporelles restent un référentiel distinct.
5. Ouvrir la sélection `Zones corporelles`, sélectionner une ou plusieurs Zones existantes ou créer une nouvelle Zone directement depuis la modale. La gestion du référentiel autorise également le renommage et la suppression des Zones existantes.
6. Dans les modales `Étiquettes`, `Catégorie` et `Zones corporelles`, un appui court conserve sa fonction de sélection/désélection. Un appui long sur une option n’en modifie pas la sélection et ouvre une confirmation de suppression.
7. La confirmation propose `Annuler` et `Supprimer`. Toutes les options sont supprimables, y compris les valeurs initiales fournies par KODJO. Après `Supprimer`, l’option disparaît du référentiel et de la sélection courante. Si elle est utilisée par des Séances ou Exercices existants, ses associations aux objets existants sont conservées ; les Instantanés et Exécutions historiques restent inchangés.

## Parcours

### Parcours prévus pour une phase ultérieure

Les parcours suivants sont identifiés dès la conception mais ne font pas partie du MVP.
#### Collaboration

- partager une séance avec une personne ou un groupe ;
- recevoir une séance partagée ;
- créer et administrer une séance collaborative ;
- gérer les droits de consultation et de modification ;
- conserver des copies personnelles indépendantes des séances partagées.

#### Professionnels de santé et coachs

- recevoir une séance créée par un professionnel ;
- permettre à un professionnel de créer, mettre à jour et partager des séances ;
- suivre l'exécution des séances réalisées par un patient ou un client ;
- gérer plusieurs patients ou clients au sein d'une même interface.

#### Synchronisation

- créer un compte utilisateur ;
- synchroniser les données entre plusieurs appareils ;
- sauvegarder automatiquement les données dans le cloud ;
- restaurer un historique complet sur un nouvel appareil.

#### Intelligence artificielle

- proposer automatiquement des séances adaptées aux objectifs de l'utilisateur ;
- recommander des adaptations selon les performances ou les difficultés rencontrées ;
- analyser l'historique afin de proposer des évolutions progressives ;
- assister la création de nouvelles séances.

#### Bibliothèque de contenus

- proposer une bibliothèque de séances et d'exercices ;
- rechercher des contenus par catégorie, objectif ou zone corporelle ;
- importer des séances proposées par la communauté ou par des professionnels.

#### Statistiques avancées

- suivre la progression sur plusieurs périodes ;
- comparer les performances entre différentes séances ;
- produire des tableaux de bord personnalisés ;
- partager certaines statistiques avec un professionnel.

#### Consulter les médias pendant l’Exécution — MVP

1. L’Exercice s’affiche sur la face Information.
2. Si au moins un média existe, l’utilisateur touche le bouton de changement de face.
3. La carte se retourne horizontalement et affiche la face Média.
4. L’utilisateur parcourt les médias par swipe horizontal, un média par geste, dans l’ordre de la galerie.
5. Une vidéo reste arrêtée tant que l’utilisateur n’appuie pas sur Lecture ; l’Exécution continue pendant sa lecture.
6. Un appui sur le média ouvre le plein écran ; le cadre flottant conserve le nom, le côté, le chrono, Série/Tour et les commandes d’Exécution.
7. Fermer le plein écran revient au même média. Retourner la carte revient à la face Information.
8. Pendant la même séance, KODJO restitue la dernière face et le dernier média de chaque Exercice déjà rencontré.
9. Une nouvelle séance redémarre sur la face Information.
10. Si l’Exercice se termine pendant la consultation média, KODJO ferme le média de cet Exercice et poursuit la transition normale.

Référence : `../CONCEPTION-EXECUTION-MEDIA.md`.

#### Planifier un Parcours — cible future

Contenu identique à la section [« Parcours MVP T03 — Catalogue des Exercices — Créer et exécuter un Parcours — hors MVP, conception partielle »](Annexe%20%E2%80%93%20Historique%20des%20consolidations.md#parcours-mvp-t03--catalogue-des-exercices--créer-et-exécuter-un-parcours--hors-mvp-conception-partielle) : il n’est pas recopié ici.

#### Parcours consolidés

Création Exercice : choisir exactement une Catégorie et au moins une Zone corporelle avant validation. Les valeurs par défaut du Profil sont proposées à la création puis deviennent indépendantes. Création/modification Séance : le groupe répété est le **Circuit**, son nombre de répétitions est le nombre de **Tours** ; les phases Compte à rebours/Fin propres aux Exercices ne sont jamais exécutées dans la Séance, sans réglage d’activation ; seuls ceux de la Séance s’appliquent. L’insertion d’un Point d’arrêt ne propose jamais la position immédiatement après le Compte à rebours initial ni immédiatement avant la Fin de séance ; un Point d’arrêt placé dans le Circuit est rencontré à chaque Tour.

##### Clôture de parcours Figma

Le MVP ne comporte aucune recherche globale ni recherche locale dans les Catalogues (D-221). La planification utilise désormais des cases à cocher et Ajouter n éléments, y compris pour un seul contenu (D-222 révisée). Son titre dépend du nombre et du type des contenus (D-223 révisée). La Composition conserve son contrat propre.

#### Paramètres d’exécution — complément

Le parcours existant permet maintenant des Séries variables dans la même feuille de paramètres, avec un mode commun et des cibles/Pauses par Série, ainsi qu’une charge par Série lorsque la charge est activée (RM-238). Le `Changement de côté` se règle sur `Avec` ou `Sans`, sans désignation du côté de départ (D-406) ; l’Ordre des côtés, libellé visible `Enchainement`, reste un choix distinct. L’utilisateur peut choisir Un côté après l’autre ou Les deux côtés à chaque série ; N=1 est normalisé au premier ordre et au mode uniforme. Aucun nouveau parcours ni shell. Référence normative : [Paramètres et brouillon d’un exercice](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#paramètres-et-brouillon-dun-exercice), CE-T03-04 et CE-UI-10.

#### Parcours Répétitions avec cadence

Dans créer/modifier un Exercice, ouvrir la zone Paramètres, choisir Répétitions puis régler éventuellement la ligne `Cadence` : `5 s`, `2 s` ou `1 s` fixent directement l’intervalle, `Autre` permet une autre valeur et `Sans`, qui reste valide, correspond à l’absence de cadence (D-408, RM-245). En Séries variables, le réglage commun s’applique à toutes les lignes. ✓ actualise le parent et sa phrase ; ✕ annule ; Terminer enregistre.

En direct comme en Séance, la première répétition commence immédiatement, puis les signaux rythment les intervalles. Le signal final nominal ne change pas de Série ; Suivant le fait normalement. Pause abandonne l’intervalle incomplet pour la progression et Reprendre lance un intervalle complet ; le temps actif est conservé. Réinitialiser suit le périmètre existant. La Synthèse restitue le temps réellement passé sans demander de compte de répétitions. Le Profil n’ajoute aucun réglage Cadence.

#### Pauses et symboles

Entrer en placement Pause depuis Composition → sélectionner plusieurs emplacements/types → renseigner immédiatement la durée des récupérations → Confirmer N pauses ajoutées ou Annuler → retour au brouillon. Retrait par bulle pour la récupération (remplacé par D-442 : la récupération se règle et se retire uniquement en placement, par sélection/désélection) ; pour le Point d’arrêt, retrait par désélection en placement (« Confirmer les modifications ») et déplacement par appui long (D-441). Continuer seul persiste.

#### Conception de planification

Choisir une ou plusieurs Séances/Exercices par cases → Ajouter n éléments → Programme facultatif, Début, Répétition, contenus ordonnés si plusieurs, Rappel → Enregistrer. Chaque contenu filtre les occurrences du créneau par son motif x fois sur n. Les modalités ouvertes ne sont pas considérées livrées. Voir la [spécification](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification), les contrats CE-UI-04/05/11 et le [DSF général](../DSF-INTERFACE-GENERALE-2026-10-08.md).

#### Ajouter des médias à un Exercice — MVP PRE-3

D-333 inclut l’import/ajout de photos ou vidéos locales depuis l’éditeur, dans le Catalogue comme dans une copie de Séance. L’utilisateur associe le média au brouillon de l’Exercice puis enregistre avec Terminer ; il retrouve ses associations après réouverture. Les associations courantes appartiennent au mouvement ; les instantanés en conservent une copie ordonnée et peuvent partager un fichier physique immuable. Retirer une association ne supprime jamais un fichier encore référencé. Les sources système, formats et états du sélecteur d’import restent à clarifier ; aucune caméra ni limite n’est déduite des maquettes. La consultation pendant l’Exécution conserve D-203 et relève du moteur ultérieur.

<a id="formats-parcours"></a>
#### Formats et départs rapides — parcours

1. Choisir une entrée : six formats contraignants ou six origines libres.
2. Lire les constantes et régler les paramètres autorisés. Le parcours Tabata inclut une sélection d’exercices ; ne pas imposer quatre étapes identiques à toutes les entrées.
3. Au récapitulatif, vérifier l’ordre des exercices et les paramètres. Tabata, EMOM et Progression proposent « Exécution : Par exercice / En alternance » selon leurs conditions ; For time ne propose pas ce contrôle.
4. Composer la séance préremplie. Les réglages autorisés restent éditables, avec synthèse et durée calculée actualisées. Les constantes ne deviennent pas éditables dans la modale d’exercice.
5. Démarrer à partir d’un instantané. EMOM/Death by : l’appui sur le cadran révèle le repos sans avancer la fenêtre. Death by : il confirme aussi l’objectif accompli, ce qui acquiert le tour.
6. Arrêt Death by : un seul déclencheur ouvre les deux issues « Limite atteinte » et « Abandonner ». Si la dernière fenêtre n’est pas acquise, renseigner les répétitions partielles, proposées à zéro. Résultat conservé, état incomplet dans les deux cas.

Navigation, annulation et sauvegarde reprennent les brouillons existants ; le choix d’un segment ne sauvegarde pas la séance à lui seul. Les captures actuelles et les variantes sont au chapitre 06, contrats CE-FMT-01…06 au chapitre 13.


## Parcours de niveaux — actualisation du 25/10

**D-445 — décisions validées le 25/10 :** C01–C07 et C09 sont clos ; C08 seul reste différé sur le périmètre MVP. [Spécification consolidée v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md).



## Décisions C01–C09 consolidées — D-445

| ID | Décision validée | Statut |
|---|---|---|
| C01 | Nom de mouvement unique après normalisation espaces/casse/accents ; alias partagés possibles | Clos |
| C02 | Variante : description et médias vierges ; catégorie et zones reprises ; nom commencé conservé avec invite grise (compléter le nom), non persistée et effacée à la reprise de saisie | Clos |
| C03 | Nom modifié : dialogue toujours ; nom inchangé et contenu modifié : confirmation si autre exercice ou exécution enregistrée ; sinon silencieux | Clos |
| C04 | Crayon disponible depuis une séance pour éditer le mouvement partagé ; nouvelle identité = remplacement de l’occurrence | Clos |
| C05 | Contenu courant lu directement depuis le mouvement ; paramètres locaux ; instantanés et exécution en cours figés ; phases manquantes signalées avant lancement | Clos |
| C06 | Pastille Niveau N, état vide Niveau ; sans pastille, suffixe - Nn calculé près du nom, jamais stocké | Clos |
| C07 | Catalogue d’entretien des mouvements compatible avec recherche/sélection dans le parcours de création | Clos — aucune contradiction |
| C08 | Composition des familles depuis le catalogue : règles A à E du 28/10 et CE-MVT-03 ; suppression du mouvement distincte | Clos pour rattacher/détacher/dissoudre la famille ; cycle de vie du mouvement non clôturé |
| C09 | Commande Niveau active hors crayon ; sélectionner un autre niveau ne reclasse pas le mouvement courant | Clos |

Une `ActivityDefinition` référence directement un mouvement et porte ses paramètres propres. Une `SessionActivity` possède son identifiant et référence **directement le mouvement**, sans dépendance de contenu envers l’exercice Catalogue ; elle porte une copie locale complète des paramètres au moment de l’insertion, puis les conserve indépendamment. Elle ne conserve pas une copie modifiable du nom, de la description, des médias, de la catégorie, des zones ni de la structure des phases.

Les corrections du contenu partagé sont visibles à la prochaine lecture des définitions et des séances ; aucun mécanisme de propagation de copies de contenu n’est nécessaire. Modifier les paramètres Catalogue ne modifie pas ceux des séances. Supprimer ou archiver la définition Catalogue ne casse pas les occurrences.

Au démarrage, résoudre le contenu courant avec les paramètres de l’exercice puis construire un instantané autonome. Cet instantané, l’exécution déjà démarrée et les historiques ne changent plus avec le mouvement. Leur `sourceMovementId` conserve l’identité exécutée, sans rang stocké ; la classification actuelle peut être résolue séparément à la lecture.

Les relations actives vers le mouvement doivent rester intègres, depuis les définitions **et les occurrences de séance**. L’absence de contrainte référentielle et la tolérance d’orphelins concernent la filiation des instantanés, pas le contenu vivant. La suppression explicite d’un mouvement encore référencé par un exercice est interdite ; son parcours reste dans C08. La suppression du dernier exercice ne supprime jamais le mouvement : un mouvement peut exister sans exercice et reste recherchable.

Référence : [spécification v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md). Les captures du 25/10 restent datées ; aucune nouvelle inspection ni correction de Figma n’est déclarée par cette mise à jour documentaire.


### Phases — clarification PHC-20261026

Les phases forment un motif cyclique de guidage : un passage complet correspond à une répétition guidée. Chaque phase conserve une durée en secondes. La somme des phases est la durée du motif, jamais la durée cible de la série. Les modes Durée et Répétitions, avec cible chiffrée ou À l’échec, sont compatibles ; seules les séries variables restent incompatibles avec les phases. [remplacé par D-446 du 26/10/2026 : les phases sont aussi compatibles avec les séries variables ; une seule séquence de phases et de durées, commune à toutes les séries] La condition d’arrêt appartient à la série. En Durée chiffrée, la cible indépendante termine la série à échéance, même au milieu d’une phase. À l’échec, le guidage boucle jusqu’à Suivant. En Répétitions chiffrées, R motifs donnent une durée nominale R × somme des phases ; Suivant conserve la validation manuelle existante. Chaque nouvelle série recommence à la première phase. Les cycles guidés ne prouvent pas les répétitions effectivement réalisées.

Modifier, ajouter ou supprimer une phase ne réécrit pas la cible de série. Toutes les durées de phase sont éditables, y compris sous un format à durée imposée : aucune dernière phase calculée, aucune adaptation proportionnelle pour faire tenir le motif dans la série. Une durée manquante reste à renseigner ; ne pas inventer une durée depuis l’objectif de série. Les bornes existantes des phases restent des bornes du motif, indépendantes de celles de la cible. Le retrait 2 → 1 conserve le passage à Sans mais ne remplace plus la cible par la durée restante. Sans phases conserve également la cible existante.

Référence normative : [PHC-20261026](../KODJO-Phases-Guidage-Cyclique-2026-10-26.md). La règle Répétitions sans bip = non calculable concerne désormais les exercices sans phases : avec phases, R × durée du motif donne une estimation nominale, jamais une mesure. Arrêt mixte et guidage après objectif avant Suivant restent les deux points distincts décrits dans cette référence. [clos par D-446 du 26/10/2026 : l’arrêt mixte se représente par les séries variables, avec phases ; en Répétitions chiffrées, le motif continue de boucler, sans signal, entre la cible et Suivant] Les anciennes captures sont des preuves datées ; alignement Figma et code non revendiqué.
