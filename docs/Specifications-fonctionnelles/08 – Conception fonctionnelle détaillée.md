# Conception fonctionnelle par fonctionnalité

## Composition — actualisation du 28/10/2026

La création distingue ajout de contenu et enveloppement de membres existants. Les déplacements changent appartenance et ordre ; les séries alternées conservent N commun. Les zéros volontaires restent des lignes indexées, distinctes du tiret. Le contrat de déplacement inter-circuits précédemment futur entre dans le MVP : confirmation si perte, Annuler conserve emplacement et données. Voir [Composition du 28/10](../KODJO-Composition-conteneurs-2026-10-28.md).

## Catalogue des mouvements — composer une famille, 28/10/2026

Appui long, déplacement, arrêt sur l'emplacement puis relâchement : même geste pour réordonner, sortir, créer ou rejoindre une famille. Le filet et les pastilles prévisualisent le résultat ; une famille repliée se déplie. Seul un mouvement sans famille peut être lié à une autre carte ; un changement de famille impose sortie puis liaison, en deux gestes. Le dernier couple se dissout lors d'une sortie explicite. Application immédiate, sans message pour le seul ordre ; changement d'appartenance annoncé avec Annuler pendant 3 secondes. Le tri du catalogue place le mouvement sorti, même en tête de liste. Voir [règles A à E et recette FAM-01–11](../DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md) et CE-MVT-03. Ajouter un niveau conserve son formulaire distinct.

> **C08 — actualisation du 28/10/2026.** La [composition des familles depuis le catalogue](../DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md), règles A à E et CE-MVT-03, est désormais définie : rattacher, détacher et dissoudre une famille par geste. Les mentions antérieures « C08 différé » restent historiques pour ces opérations ; elles ne sont plus une restriction active. La suppression définitive d'un mouvement reste distincte et n'est pas clôturée par ce lot.

### Résultats de recherche — variantes de cartes, PRE-9

**Comportement cible validé :** [spécification des résultats Mouvement](../KODJO-Resultats-recherche-mouvements-PRE9-2026-10-30.md), contrat CE-MVT-RESULT-01. **Créer un Mouvement** : carte Résultat avec « Ajouter un niveau » à droite et sans bouton « Utiliser ». **Créer un Exercice depuis un Mouvement** : carte Composition, sans action en carte, description limitée à deux lignes ellipsées. La liste de Niveaux affiche le filet de groupe centre-à-centre ; l'état de choix affiche « Plus facile | Plus difficile » dans un seul cadre, sans seconde carte ni symboles d'arbre. Le parcours de création/confirmation et la recherche existants restent inchangés.

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

## Conception ciblée — fiche Mouvement

Trois états fonctionnels : création indépendante/variante, consultation, édition d'un mouvement existant. La reprise d'un résultat mène à la consultation, pas à une copie. Le crayon depuis le catalogue ouvre un brouillon ; les commandes de niveau restent distinctes de l'édition du contenu. Le passage à une autre fiche protège le brouillon selon le mécanisme d'abandon existant. La sauvegarde d'une variante est directe ; le dialogue de portée concerne seulement une modification de l'identité existante. La structure des phases est éditée ici, sans aucune durée.

Le verrouillage depuis une séance concerne uniquement un mouvement existant ou repris. Lors de la création d'un nouvel exercice, le mouvement nouveau reste éditable tant qu'il n'est pas enregistré ; choisir un mouvement existant fait passer son contenu en lecture seule. La création de variante depuis une séance reste exclue de ce parcours cible. Les transitions et validations sont définies dans CE-MVT-01 et la table C03 de la spécification ciblée.

> **Référence ciblée — parcours Mouvement, 27/10/2026.** [Création et modification des mouvements](../DSF-MOUVEMENTS-CREATION-EDITION-2026-10-27.md) remplace, sur ce périmètre seulement, les anciens écrans de création d’exercice : nouveau gabarit, structure des phases sans durées, modification et variante depuis le catalogue des mouvements. Le crayon et la création de variante depuis une séance ne sont plus des parcours cibles. Les règles de recherche R01–R08 et de sauvegarde C03 restent applicables. Les autres lots de la simplification ne sont pas déclarés documentés ou livrés par cette mise à jour.

> **Cible validée D-449 — 26/10/2026.** [Six décisions closes](../KODJO-Seance-Objet-Unique-Decisions-2026-10-26.md). Les dispositions ci-dessous sur l’exercice autonome de catalogue, le lancement `ACTIVITY`, le cycle technique unique et les catalogues séparés par nature décrivent le modèle antérieur et sont remplacées sur ces seuls points. Les autres règles restent applicables. La réalisation et les visuels Figma ne sont pas déclarés livrés.

## Conception cible — D-449

La séance garde son identité lorsque sa composition passe d’un à plusieurs exercices ou inversement. Reprendre une séance copie exercices, circuits, cycles et réglages de composition ; les paramètres sont indépendants et les mouvements restent partagés. Ne pas importer les réglages propres de début/fin, la planification ni l’historique de la source. Le lancement porte uniquement sur toute la séance. Les routines continuent d’utiliser automatiquement la dernière version ; aucun dialogue général de modification supplémentaire n’est introduit.

**D-445 — décisions validées le 25/10 :** C01–C07 et C09 sont clos ; C08 seul reste différé sur le périmètre MVP. [Spécification consolidée v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md).


Ce chapitre décrit, fonctionnalité par fonctionnalité, les enchaînements, états et transitions. Les règles testables sont énoncées au chapitre 10 et citées ici par leur identifiant ; les champs et contrôles d’écran sont définis par les contrats du chapitre 13.

## Sommaire

- [Objet et organisation du chapitre](#objet-et-organisation-du-chapitre)
  - [Principes généraux](#principes-généraux)
- [Séances](#séances)
  - [Cycle de vie d'une séance](#cycle-de-vie-dune-séance)
- [Exercices](#exercices)
  - [Catalogue des Exercices — cycle de vie d’un Exercice persistant — MVP T03](#catalogue-des-exercices--cycle-de-vie-dun-exercice-persistant--mvp-t03)
  - [Champs et comportements des fonctionnalités](#champs-et-comportements-des-fonctionnalités)
- [Composition des séances](#composition-des-séances)
  - [Composition d'une séance](#composition-dune-séance)
- [Exécution](#exécution)
  - [Exécution d'une séance](#exécution-dune-séance-2)
  - [Déroulement d'une séance](#déroulement-dune-séance)
  - [Guidage de l'utilisateur](#guidage-de-lutilisateur)
  - [Navigation principale et articulation des écrans — Navigation pendant une Exécution](#navigation-principale-et-articulation-des-écrans--navigation-pendant-une-exécution)
  - [Exécution — séance ou exercice — Exercice défini par une durée](#exécution--séance-ou-exercice--exercice-défini-par-une-durée)
  - [Exécution — séance ou exercice — Exercice défini par un nombre de répétitions](#exécution--séance-ou-exercice--exercice-défini-par-un-nombre-de-répétitions)
  - [Exécution — séance ou exercice — Réinitialiser l’Exercice](#exécution--séance-ou-exercice--réinitialiser-lexercice)
  - [Exécution — séance ou exercice — Mise en pause](#exécution--séance-ou-exercice--mise-en-pause)
  - [Exécution — séance ou exercice — Exercice suivant](#exécution--séance-ou-exercice--exercice-suivant)
  - [Exécution — séance ou exercice — Navigation pendant l’Exécution](#exécution--séance-ou-exercice--navigation-pendant-lexécution)
  - [Exécution — séance ou exercice — Guidage sonore](#exécution--séance-ou-exercice--guidage-sonore)
  - [Exécution — séance ou exercice — Arrière-plan et verrouillage](#exécution--séance-ou-exercice--arrière-plan-et-verrouillage)
  - [Exécution — séance ou exercice — Fin de l’Exécution](#exécution--séance-ou-exercice--fin-de-lexécution)
  - [Exécution — séance ou exercice — Exercice lancé directement depuis le catalogue](#exécution--séance-ou-exercice--exercice-lancé-directement-depuis-le-catalogue)
- [Suivi et synthèse](#suivi-et-synthèse)
  - [Suivi et historique des séances](#suivi-et-historique-des-séances)
- [Interface transverse](#interface-transverse)
  - [Navigation principale et articulation des écrans — Retour et fermeture](#navigation-principale-et-articulation-des-écrans--retour-et-fermeture)
  - [Navigation principale et articulation des écrans — Conservation du contexte](#navigation-principale-et-articulation-des-écrans--conservation-du-contexte)

## Objet et organisation du chapitre

### Principes généraux

Contenu identique à la section [« Règles métier et calculs »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#règles-métier-et-calculs) : il n’est pas recopié ici.

#### Objectif du document

Ce document décrit le fonctionnement détaillé des principales fonctionnalités du MVP.
Il complète les parcours utilisateur, les wireframes, le modèle de données fonctionnel et les règles métier en précisant le comportement attendu de l'application lors de son utilisation.
Il constitue la référence fonctionnelle utilisée pour le développement.

#### Périmètre

Ce document décrit :
- le comportement détaillé des fonctionnalités du MVP ;
- les interactions entre les différents écrans ;
- les comportements attendus lors des actions de l'utilisateur ;
- les enchaînements, états et transitions propres à chaque fonctionnalité, en citant les règles du chapitre 10 qui s’y appliquent.

Il ne décrit pas :
- les parcours utilisateur ;
- la navigation entre les écrans ;
- le modèle de données ;
- les règles métier testables, énoncées au chapitre 10 ;
- les choix techniques d'implémentation.

#### Organisation

Le document est organisé selon les principales fonctionnalités du MVP.

Chaque chapitre décrit le fonctionnement détaillé d'une fonctionnalité indépendamment des écrans utilisés.
Lorsqu'une fonctionnalité fait intervenir plusieurs écrans, son comportement est décrit une seule fois dans le présent document.
La navigation, l’inventaire des écrans et les conventions d’interface communes à plusieurs écrans sont décrits au chapitre **06 – Interface : navigation, écrans et conventions communes**.
Les champs, contrôles et comportements spécifiques des écrans sont définis au chapitre 13.

#### Documents de référence

Chaque sujet est décrit dans un document unique afin d'éviter toute redondance.

| Sujet                                     | Document de référence                              |
| ----------------------------------------- | -------------------------------------------------- |
| Vision du produit et glossaire            | 01 – Vision et glossaire                           |
| Utilisateurs et besoins                   | 02 – Utilisateurs et besoins                       |
| Parcours utilisateur                      | 03 – Parcours utilisateur                          |
| Concepts, structures et relations         | 04 – Modèle fonctionnel                            |
| Versions du produit                       | 05 – Versions et périmètre                         |
| Navigation, écrans et conventions communes | 06 – Interface : navigation, écrans et conventions communes |
| Décisions de conception                   | 07 – Registre des décisions de conception          |
| Enchaînements, états et transitions des fonctionnalités | 08 – Conception fonctionnelle par fonctionnalité |
| Modèle de données                         | 09 – Modèle de données fonctionnel                 |
| Règles métier testables et calculs        | 10 – Règles métier et calculs                      |
| API fonctionnelles                        | 11 – API fonctionnelles                            |
| Architecture technique                    | 12 – Architecture technique                        |
| Comportement de chaque écran              | 13 – Contrats d’écran                              |

#### Convention de lecture

Les termes utilisés dans ce document sont définis dans le **[Glossaire](01%20%E2%80%93%20Vision%20G%C3%A9n%C3%A9rale.md#glossaire)**.

Les captures d'écran et wireframes illustrent les comportements décrits, mais ne constituent pas la référence fonctionnelle.

En cas de divergence entre un wireframe et le présent document, la spécification fonctionnelle prévaut.

## Séances

### Cycle de vie d'une séance

#### Création d'une séance

La création d’une Séance repose sur un écran unique `Composer une séance`, et non sur quatre écrans ou étapes de navigation distinctes :

1. saisir le nom et construire la Composition dans cet écran ;
2. sélectionner facultativement une Étiquette depuis la modale intégrée ; sa couleur devient celle de la Séance ;
3. ajouter au moins un Exercice valide, puis choisir `Continuer` pour enregistrer (RM-017) ;
4. revenir au `Catalogue des séances`, segment `Séances`.

À l'issue de cette création, la séance est immédiatement disponible dans le catalogue.

Aucune routine n'est créée automatiquement.

#### Modification d'une séance

Une séance peut être modifiée à tout moment depuis le catalogue des séances.

La modification d’une Séance ouvre directement l’écran unique `Modifier une séance`, prérempli avec le nom, l’Étiquette facultative (qui porte la couleur affichée) et les Exercices. Les modifications sont enregistrées selon les validations explicites prévues par les écrans.

L'utilisateur peut notamment modifier :

- son nom ;
- sa composition ;
- ses exercices ;
- son Étiquette, qui détermine la couleur affichée de la Séance.

Les modifications sont immédiatement visibles dans le catalogue.

Les routines associées utilisent automatiquement la dernière version de la séance.

Les exécutions déjà enregistrées conservent leur propre instantané.

#### Duplication d'une séance

Une séance peut être dupliquée afin de créer rapidement une nouvelle variante.

La duplication crée une nouvelle séance indépendante.

La copie reprend :

- le nom de la séance avec le suffixe disponible suivant : `(copie)`, puis `(copie 2)`, `(copie 3)`, etc. ;
- l’Étiquette, dont la couleur devient la couleur de la Séance ;
- l'ensemble de la composition ;
- les paramètres d'exécution.

Les deux séances deviennent totalement indépendantes.

##### Parcours enrichi et saisies de résultats — D-427 à D-429
Standard : aucune évaluation avant et Ressenti triétat obligatoire après. Enrichi uniquement pour une exécution lancée dans le contexte d'un Programme avec option active (tout lancement indépendant reste standard) : douleur initiale 0–10 obligatoire et sans localisation avant démarrage ; douleur finale 0–10 obligatoire, jamais présélectionnée, et effort perçu 1–10 obligatoire après, à la place du Ressenti. Si douleur finale > 0, au moins une localisation parmi les zones corporelles KODJO (plusieurs possibles, latéralité si applicable) ; zéro doit être choisi explicitement. Commencer ou Enregistrer est bloqué tant que des champs obligatoires manquent. Paramétrage de l'option : À CLARIFIER.

Formats imposés : modale Répétitions partielles (8928:15098), interruption ou série sous cible ; saisie proposée zéro, minimum zéro, résultat supérieur à cible autorisé ; validation enregistre et poursuit automatiquement le plan ; fermeture sans validation annule, n'enregistre rien, revient à l'étape sans progresser.

Modale Résultat de série (8937:35362) : saisie proposée zéro, minimum zéro, résultat supérieur à cible autorisé ; validation enregistre le réel et poursuit automatiquement le plan ; fermeture sans validation annule, n'enregistre rien, revient à l'étape sans progresser. Conditions exactes d'ouverture non arbitrées : À CLARIFIER.

## Exécution d'une séance

Une séance peut être exécutée :

- directement depuis le catalogue des séances ;
- depuis une routine planifiée.

Au démarrage de l'exécution, un instantané fonctionnel de la séance est enregistré.

Cet instantané est utilisé pour garantir la cohérence de l'historique, même si la séance est ensuite modifiée.

## Exercices

### Parcours MFN — règles applicables aux écrans existants

D-437 à D-439 complètent les parcours ci-dessous. Le Catalogue regroupe les exercices par geste ; sélection, insertion et lancement désignent toujours une définition précise, distinguée par son résumé de paramètres, sans alias. Les niveaux sont accessibles depuis la fiche ; nouveau niveau après l’origine, ordre modifiable par glissement, rang masqué pour un groupe réduit à un membre.

L’éditeur s’ouvre directement en édition. Recherche explicite et suggestions portent sur tous les mouvements disponibles, même créés localement. Les choix sont même mouvement/autres paramètres, variante/niveau, mouvement indépendant. Une sélection n’écrase pas silencieusement la saisie. Cette recherche spécialisée ne modifie pas l’absence de recherche générale dans les listes Catalogue.

D-445 / MFN-08 : nom changé, dialogue toujours ; nom inchangé et contenu modifié, confirmer si au moins un autre exercice lié ou une exécution enregistrée ; sinon sauvegarde silencieuse. Paramètres seuls ou reclassement seuls : aucun dialogue. Crayon de contenu partagé disponible au Catalogue et en séance ; Niveau reste actif. Variante explicite sans question redondante. Durées nouvelles non inventées ; frères incomplets signalés avant lancement.

L’occurrence référence directement le mouvement et conserve ses paramètres propres ; elle ne dépend pas de la définition Catalogue. Une correction apparaît à la lecture du contenu courant. Annulation sans résidu. Seuls l’instantané, l’exécution démarrée et l’historique restent figés (D-445).


### Catalogue des Exercices — cycle de vie d’un Exercice persistant — MVP T03

#### Catalogue multi-type

Le Catalogue distingue `Exercices` et `Séances`. `Séances` reste le type actif par défaut ; `Exercices` devient également actif dans le MVP à partir de T03. Dans le MVP T03, sélectionner `Exercices` charge les références persistantes ; aucun segment ni objet autonome Parcours n’est prévu (D-328).

La liste des Exercices conserve filtres, tri et position de défilement dans l’état de navigation ; aucune recherche Catalogue n’existe au MVP (D-221). Chaque carte utilise une pastille de Catégorie colorée, sans barre verticale. Sa surface ouvre la consultation ou la modification ; le bouton Lecture lance uniquement l’Exécution directe. Aucun contrôle `Déployer` n’est accessible, avec ou sans média ; le média associé est présenté dans la gouttière permanente de la carte (D-260, D-261). Un glissement gauche expose `Planifier / Dupliquer / Archiver` sur les Exercices actives et `Supprimer` dans les archives. Aucune poignée de déplacement n’est affichée.

#### Créer, consulter ou modifier un Exercice de référence

Dans chaque Catalogue, `Créer` est contextuel et ouvre directement la création de l’objet correspondant au Catalogue courant, sans écran ni arbre intermédiaire. Dans le Catalogue des Exercices, il ouvre directement l’éditeur de création d’un Exercice persistant ; dans le Catalogue des Séances, il ouvre directement une nouvelle Composition. Aucun Catalogue Parcours n’est prévu (D-328).

La création d’un Exercice depuis le Catalogue réutilise l’éditeur unifié. Le champ Nom est le premier élément du bandeau bleu. Le Mode propose deux options, Durée et Répétitions, dans un contrôle segmenté de la feuille, sans popover (D-413). À l’échec est une cible de Série ; la Condition d’arrêt suit RM-248 et RM-249. La carte ouvre CE-UI-10, dont les groupes et l’ordre des lignes suivent D-413 : Exécution (Mode, Condition d’arrêt) → Séries (Nombre de séries, Type de série, cible/Pause communes ou tableau, Charge) → Côtés (Changement de côté, puis Enchainement et Pause entre les côtés) → Cadence et durée (Cadence, Durée de l’exercice applicable, Compte à rebours, Fin d’exercice). Les sections Description, Zone corporelle, Mode et Médias suivent les contrats de l’Écran 4.

Ouvert depuis le Catalogue, `Terminer` crée ou met à jour un Exercice persistant et revient au Catalogue. Ouvert depuis une Composition, le même éditeur agit uniquement sur l’Exercice de Séance. Le contexte d’ouverture ne doit jamais être déduit de la seule apparence de l’écran.

#### Ajouter un Exercice à une Séance

Depuis la Composition, `Ajouter un exercice` ouvre directement la sélection des Exercices du Catalogue. La capacité technique et fonctionnelle de créer un Exercice local à la Séance reste conservée mais n’est pas exposée dans le parcours courant.

- `Une nouvelle exercice` ouvre l’éditeur d’une copie appartenant uniquement à la Séance ;
- `Un exercice existant` ouvre la sélection multiple du Catalogue d’Exercices ;
- `Annuler` ferme les options sans modifier le brouillon.

La sélection multiple affiche le nombre `N`, désactive l’ajout pour `N = 0` et insère les copies selon l’ordre courant de présentation dans la liste filtrée au moment de la validation. L’ordre des touchers n’est pas conservé. Chaque copie reprend toutes les propriétés métier, dont la charge et son activation, valeurs conservées sous Sans comprises (RM-236), et les associations média de la référence puis évolue indépendamment. Un Exercice créé dans une Séance n’est pas enregistrée automatiquement dans la bibliothèque.

#### Exécuter directement un Exercice

L’action Lecture est disponible uniquement pour une référence valide. Le lancement fige la définition courante, charge comprise (RM-236), dans un instantané d’origine `ACTIVITY` et mémorise l’état du Catalogue.

Le Plan contient `DIRECT_PREPARE(5 s)`, puis les Séries, Pauses, côtés et, si l’Exercice est bilatéral, `SIDE_RECOVERY` de durée PC>0, selon l’Ordre des côtés ; aucun repli lorsque PC=0. Il ne contient jamais `POST_ACTIVITY_RECOVERY`, ni Tour, ni Cycle visible, ni `SESSION_END`. Le dernier achèvement produit le signal de fin et ouvre immédiatement la Synthèse.

La Synthèse affiche les données compatibles d’un Exercice seul. Le Ressenti est obligatoire pour activer `Enregistrer`; le Commentaire est facultatif. La finalisation enregistre l’Exécution dans le Suivi général, alimente les statistiques compatibles sans compter une Séance, puis restaure filtres et position de défilement du Catalogue.

#### Médias d’Exercice

Dans le MVP, le Catalogue affiche le média associé dans la gouttière permanente de la carte d’Exercice, sans déploiement ; sans média, cette même gouttière affiche l’icône de nature (D-260/D-261). Dans l’éditeur, la zone Média suit le Figma courant et reste sous la Synthèse en cas de chevauchement. Cette décision ne crée pas implicitement de nouveau mécanisme d’import ou de capture. Dans le MVP, un Exercice peut porter `0..n` associations ordonnées vers des photos ou vidéos locales ; une vidéo ne démarre jamais automatiquement. Dans l’éditeur, toucher une tuile Média la consulte : une vidéo est lue en plein écran par le lecteur natif de la plateforme (iOS sur iPhone, Android sur Android), sans lecture automatique ; une photo s’ouvre en plein écran. Cette consultation est indépendante du moteur d’Exécution. Le menu Retirer / Monter / Descendre s’ouvre par appui long (menu contextuel natif), avec une alternative accessible (actions VoiceOver sur iOS, actions d’accessibilité natives TalkBack sur Android, D-400), sans bouton ajouté sur la tuile (décisions PRE-4 Q27 et Q31 du 16/10, D-385 ; Q27, qui nommait le lecteur natif iOS, est précisée pour Android par D-393). L’ajout/import et la persistance des médias sont désormais inclus au MVP dans PRE-3, avant le moteur d’exécution (D-333) ; les règles de consultation en exécution sont conservées.

<a id="parametres-exercice"></a>
#### Paramètres et brouillon d’un exercice

##### Brouillon, bascules et normalisation

La feuille travaille sur une copie des paramètres du parent. ✕/retour système annule toute l’ouverture. ✓ applique atomiquement l’état actif et valide au parent et régénère le résumé ; Terminer seul persiste l’Exercice. Les états alternatifs cachés servent au brouillon uniquement.

**Condition d’arrêt dans le brouillon.** En séries identiques, la Condition d’arrêt choisie dans la feuille fixe le type de cible commun à toutes les séries (RM-248). En séries variables, elle est recalculée à chaque modification d’une cellule du tableau et n’est pas une valeur propre du brouillon ni de l’Exercice (RM-249, RM-250).

Activation variable : chaque ligne copie la cible et la Pause uniformes courantes. Désactivation : sans confirmation ni message temporaire, l’état uniforme reprend la **première ligne dans l’ordre courant**. Réactivation avant ✓ restitue le dernier tableau variable. Si ✓ valide en uniforme, les anciennes valeurs variables cachées ne sont pas persistées.

Augmentation de N : rétablir d’abord les lignes temporairement retirées ; au-delà des lignes récupérables, copier la dernière ligne active. Réduction : retirer les dernières lignes de la liste active, conserver temporairement leur cible/Pause et leur ordre pour une restauration avant ✓. Restaurer une tranche retirée dans son ordre relatif d’origine (par exemple réduire 5→3 puis revenir à 5 restitue 4 puis 5, pas5 puis 4). Après ✓, les lignes retirées ne sont plus conservées.

**Déplacement validé** : la cible, la Pause, la cadence éventuelle et la charge éventuelle (RM-238) se déplacent ensemble ; les lignes sont renumérotées 1..N dans l’ordre obtenu ; la nouvelle dernière ligne porte PN. Les lignes actives déplacées conservent leur nouvel ordre lors de la restauration des lignes retirées, qui sont réinsérées en fin dans leur ordre conservé. La désactivation reprend la nouvelle première ligne. ✕ annule aussi les déplacements.

Changement de mode : conserver N et les Pauses ; remplacer les cibles incompatibles par —, sans conversion Durée/Répétitions. Revenir au mode précédent avant ✓ restaure ses dernières cibles. Une valeur — n’est jamais zéro.

**Charge dans le brouillon.** La charge de chaque série suit les mêmes opérations de brouillon que sa cible et sa Pause (activation et désactivation des séries variables, augmentation et réduction de N, restauration, déplacement, ✓ et ✕), sans propagation propre (RM-238). Son activation, sa saisie, le zéro, la première activation et la réactivation suivent RM-237 et RM-239. Passer à Sans ne l’efface pas : ses valeurs restent dans le brouillon et ✓ les applique au parent (RM-236). Cette conservation est propre à la charge ; elle ne modifie pas la non-persistance des variantes cachées des autres paramètres (D-403).

**N=1 — arbitrage explicite** : état effectif uniforme et Ordre des côtés effectif Un côté après l’autre **dès le brouillon et son calcul**, pas seulement à la sauvegarde. Champ de régime non modifiable, selon la normalisation N1 existante ; ligne Enchainement (Ordre des côtés) non affichée, le changement de côté Avec / Sans restant disponible (D-415) ; aucun texte explicatif. Conserver temporairement l’ancien état variable, ses lignes et l’ancien ordre des côtés pour les restaurer si N remonte à 2+ avant ✓. Valider à 1 ne conserve qu’une série uniforme et l’ordre par défaut. Hors circuit à séries alternées, les deux formules bilatérales ne sont pas déclarées équivalentes à N=1 : la normalisation choisit explicitement la première. Dans un circuit à séries alternées, le passage suit toujours premier côté → PC → second côté → Pi, y compris pour compte 1 ; aucun Pi supplémentaire avant PC.

<a id="phases-exercice"></a>

## Phases d’un exercice — MVP

Une phase est une subdivision d’un mouvement au sein d’une série, distincte des phases structurelles du plan. Les décisions D-370 à D-375 s’appliquent dans leur portée amendée par D-438. [puis par PHC-20261026 et D-446 du 26/10/2026] Les actions structurelles décrites ci-dessous sont propres au Catalogue ; elles sont verrouillées dans une occurrence.

### Structure, édition et calcul — PHC-20261026

Les phases forment un motif cyclique de guidage : un passage complet correspond à une répétition guidée. Chaque phase conserve une durée en secondes. La somme des phases est la durée du motif, jamais la durée cible de la série. Les modes Durée et Répétitions, avec cible chiffrée ou À l’échec, sont compatibles ; seules les séries variables restent incompatibles avec les phases. [remplacé par D-446 du 26/10/2026 : les phases sont aussi compatibles avec les séries variables ; une seule séquence de phases et de durées, commune à toutes les séries] La condition d’arrêt appartient à la série. En Durée chiffrée, la cible indépendante termine la série à échéance, même au milieu d’une phase. À l’échec, le guidage boucle jusqu’à Suivant. En Répétitions chiffrées, R motifs donnent une durée nominale R × somme des phases ; Suivant conserve la validation manuelle existante. Chaque nouvelle série recommence à la première phase. Les cycles guidés ne prouvent pas les répétitions effectivement réalisées.

Modifier, ajouter ou supprimer une phase ne réécrit pas la cible de série. Toutes les durées de phase sont éditables, y compris sous un format à durée imposée : aucune dernière phase calculée, aucune adaptation proportionnelle pour faire tenir le motif dans la série. Une durée manquante reste à renseigner ; ne pas inventer une durée depuis l’objectif de série. Les bornes existantes des phases restent des bornes du motif, indépendantes de celles de la cible. Le retrait 2 → 1 conserve le passage à Sans mais ne remplace plus la cible par la durée restante. Sans phases conserve également la cible existante.

Contrôle Avec / Sans, 2 à 6 phases, libellés de 20 caractères maximum, saisie numérique MMSS et réordonnancement conservés. Chaque durée validée ≥ 1 s ; somme 1..3535 s conservée comme borne du motif. La structure se modifie par le crayon du mouvement partagé (D-445), y compris depuis une séance ; les durées locales restent des paramètres. Pas de nettoyage silencieux des valeurs manquantes. [D-446 du 26/10/2026 (Q5) : Avec crée deux phases aux durées vides, sans préremplissage D-432]

### Calcul, formats et exécution

Durée : cible indépendante D ; unilatéral N × (D + P), avec substitutions terminales existantes. Répétitions : estimation nominale R × somme des phases par série, même sans bip ; ne pas additionner une estimation de cadence. Échec : durée non calculable. Le motif ne définit pas un nouvel objectif ou compteur à saisir.

Un format impose son objectif de série sans modifier les durées des phases. [D-446 du 26/10/2026 (Q9) : phases compatibles avec tous les formats ; les contraintes du format portent sur le mode, la cible et les séries seulement] Pas de dernière phase calculée ni d’ajustement proportionnel. Une fenêtre EMOM reste distincte du temps de travail.

Le timer affiche la phase courante ; à expiration, phase suivante puis retour à la première tant que la série continue. Fin de série prioritaire, même au milieu d’une phase ; Suivant et les transitions de côté gardent leur portée. Nouvelle série à la première phase ; pause conserve la position, reset conserve son périmètre. Annonces sans délai ajouté, priorité des transitions sur le bip conservée ; aucun cycle ajouté au poids des séries dans la progression. Instantané figé.

### Points distincts et recette

Deux points restent distincts des trois corrections validées : (1) le comportement du guidage entre l’atteinte du nombre cible de répétitions et la validation manuelle Suivant doit être vérifié dans la règle existante, puis précisé si elle ne tranche pas ; ne pas introduire de fin automatique ; (2) « deux séries à la cible, dernière à l’échec » est actuellement représenté par des séries variables. Ne pas autoriser implicitement phases + variables ni inventer un réglage de dernière série. L’arrêt mixte avec paramètres communs demande une spécification séparée. [remplacé par D-446 du 26/10/2026 : point (1) tranché, le motif continue de boucler sans signal jusqu’à Suivant, sans fin automatique ; point (2) clos, les phases sont autorisées avec les séries variables, qui représentent `30 s / 45 s / échec` ou `10 / 12 / échec` sans réglage de dernière série ; libellé « À la cible » devenu « À l’objectif » (D-447)]

Règles complètes, exemples et recettes : [PHC-20261026](../KODJO-Phases-Guidage-Cyclique-2026-10-26.md). Le placement graphique précis reste à aligner dans Figma, sans nouvelle capture revendiquée.

### Champs et comportements des fonctionnalités

#### Étiquettes de la séance

L’Étiquette est gérée directement dans la Composition via une modale basse.

#### Exercice

##### Éléments affichés

| Élément affiché           | Type              | Visible                            | Obligatoire | Valeur par défaut              | Contraintes                                    | Source   | Action         | Remarques                                                                                                                                                                                                                              |
| ------------------------- | ----------------- | ---------------------------------- | ----------- | ------------------------------ | ---------------------------------------------- | -------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bouton Retour             | Bouton            | Toujours                           | Oui         | Visible                        | Confirmation si modifications non enregistrées | Système  | Retour         |                                                                                                                                                                                                                                        |
| Titre de l'écran          | Texte             | Toujours                           | Oui         | "Créer un exercice"            | Texte fixe                                     | Statique | Aucune         | En modification : "Modifier un exercice"                                                                                                                                                                                                 |
| Nom                       | Champ texte       | Toujours                           | Oui         | Vide                           | 1 à 80 caractères | Exercice | Saisie | Premier élément du bandeau bleu ; même hauteur et alignement que `Nom de la séance` en Composition |
| Catégorie | Bouton / sélection | Toujours | Oui | Aucune | Exactement une Catégorie d’Exercice (D-211) | Exercice | Ouvrir la modale de sélection | Icône Catégorie dans l’état non renseigné ; pilule avec le nom après sélection |
| Zones corporelles | Bouton / sélection | Toujours | Oui | Aucune | Au moins une Zone, sélection multiple (D-211) | Exercice | Ouvrir la modale de sélection | Icône de zone corporelle selon la silhouette du Profil ; accès à la modale |
| Description de l’exercice | Liste ordonnée d’étapes numérotées, saisie fluide (D-425) | Sous les paramètres d’exécution | Non | Première invite « 1. Décrivez la première étape » | Limite historique de 1 000 caractères : portée dans la nouvelle structure À CLARIFIER ; traitement d’une étape vide À CLARIFIER | Exercice | Entrée crée l’étape suivante, invite « Étape suivante » (affichée seulement quand le champ Description est actif, masquée au repos sans suppression d’étape, D-447) ; aucun bouton Ajouter une étape | Figma illustre les étapes ; D-425 supersède le champ libre et le Retour=ligne de D-351 |
| Mode (mode d'exécution) | Contrôle segmenté dans CE-UI-10 (D-413) | Toujours ; groupe Exécution | Oui | Aucun mode | Durée / Répétitions ; À l’échec comme cible par Série | Exercice | Sélectionner | Phrase vide et Terminer désactivé sans mode ; premier choix irréversible vers aucun mode (RM-233) |
| Condition d’arrêt | Contrôle segmenté À l’échec / À l’objectif, ou résultat non modifiable | Toujours ; groupe Exécution, après Mode (D-413) | — | À l’objectif à la création (D-416) ; dérivée des cibles des séries en séries variables | Séries identiques : deux options sélectionnables (RM-248) ; séries variables : résultat dérivé À l’objectif, À l’échec ou « À l’objectif et à l’échec » (RM-249) | Séries (type de cible) | Sélectionner en séries identiques ; aucune en séries variables | Aucune valeur propre persistée, aucun choix Mixte (RM-249) ; libellés D-447, qui remplacent « À la cible » |
| Durée                     | Roulette min/sec  | Étape 1, mode Durée                | Oui         | — (cible non renseignée à la création ; ouverture du sélecteur à 00:01 sans validation implicite, CE-UI-10) | 1 s à 58 min 55 s, pas de 1 s (D-430)          | Exercice | Sélection      | Deux colonnes : minutes et secondes ; en séries identiques, durée numérique seule, sans option À l’échec ; dans une cellule de séries variables, durée ou « À l’échec » pour cette seule série (RM-250) ; depuis D-434, cette cellule se saisit au clavier numérique MMSS (« 1 min 5 s » sans focus, « 01:05 » avec focus), « À l’échec » étant la commande de gauche de la barre du clavier |
| Nombre de répétitions     | Roulette native à une colonne | Étape 1, mode Répétition      | Oui         | 1                              | Entier de 1 à 100 (D-232, bornes conservées)                       | Exercice | Sélection      | 1 à 100 dans la feuille CE-UI-10 ; « Aucune répétition, à l’échec » en tête dans une cellule de séries variables seulement (décision PRE-4 Q8 du 16/10, D-385 ; retirée en séries identiques par D-418) ; cellule de séries variables non visée par D-434, question ouverte QD-434-1 |
| Pause après chaque série | Stepper permanent en séries identiques | Uniforme ou cellule Pause du tableau variable CE-UI-10 | Non | 0 s | 0..300 s ; tap 1 et maintien DSF Bip | Exercice / Série | −/+ | Après chaque série, dernière comprise ; seule la dernière Pause est remplacée par R positive en occurrence ; la cellule Pause du tableau variable ouvre le stepper de Pause pour cette seule cellule, sans pied commun ± (D-413, D-417) [remplacé par D-434 le 19/10/2026 : cellule Pause saisie au clavier numérique MMSS, sans stepper ; Pause des séries identiques inchangée] |
| Nombre de Séries          | Stepper intégré | Mode déployé ; groupe Séries, avant Type de série (D-413) | Oui         | 1                              | Entier de 1 à 99 (D-092)                       | Exercice | Sélection      | Commandes − / valeur / + permanentes dans la feuille CE-UI-10 ; valeur canonique persistée |
| Type de série | Contrôle segmenté Variables / Identiques (D-413) | Mode déployé ; groupe Séries, après Nombre de séries | Oui | Identiques | Variables non modifiable à N = 1 | Exercice | Sélectionner ; chevron intérieur à Variables (RM-247) | Variables affiche le tableau des séries ; replier le tableau conserve ses valeurs et le mode actif ; brouillon : [Paramètres et brouillon d’un exercice](#parametres-exercice) |
| Charge | Contrôle segmenté Avec / Sans ; saisie au clavier numérique décimal (D-405) | Groupe Séries : après la Pause en séries identiques, sous le tableau en séries variables (RM-237, RM-238) | Non | Sans | Valeur en kg ; pas, zéro, arrondi, première activation et réactivation : RM-239 | Exercice / Série | Sélectionner / saisir | Séries identiques : la valeur saisie remplace Avec (« 20 kg ») ; séries variables : Avec affiche la colonne Charge, Sans la masque en conservant les valeurs [remplacé par D-447 : colonne toujours affichée, tiret gris non éditable en Sans] ; information sans effet sur les minuteurs, cibles, pauses ni calculs (RM-235, RM-236) |
| Changement de côté | Contrôle segmenté Avec / Sans (RM-242) | Mode déployé ; groupe Côtés (D-413) | Non | Sans | Avec / Sans ; aucun choix du côté de départ ; donnée historique Droite puis gauche ou Gauche puis droite lue Avec (RM-244) | Exercice | Sélectionner ; chevron intérieur à Avec pour replier ou déployer Enchainement et Pause entre les côtés (RM-247) | Aucun réglage de côté n’est exposé au niveau Circuit ; côtés désignés côté 1 / côté 2 (RM-243) |
| Enchainement (Ordre des côtés) | Contrôle à deux options, notation Figma à flèches (RM-243) : `(D1 → D2) ➜ (G1 → G2)` et `(D1 → G1) ➜ (D2 → G2)`, affichée telle quelle dans l’option Avec de 146 depuis la décision RC-12 de Hermann du 19/10 (le raccourcissement de RC-11 est levé), sans libellé long dans le contrôle (D-431) ; choix par un déroulant conforme à Figma `9462:18986` / `9462:18987`, qui remplace le menu natif iOS de la recette PRE-5 (D-447) | Uniquement avec changement de côté (Avec), section déployée (RM-242) | Non | Un côté après l’autre | Un côté après l’autre / Les deux côtés à chaque série | Exercice | Sélectionner | Non affiché à N = 1 (D-415, [Paramètres et brouillon d’un exercice](#parametres-exercice)) ; indépendant du côté de départ |
| Pause entre les côtés | Stepper permanent CE-UI-10 | Visible uniquement avec changement de côté (Avec), section déployée (RM-242) | Non | Copie de la valeur courante du Profil (initialement 10 s) | 0..5 min ; tap 1 s, maintien DSF Bip | Exercice | Sélection | `sideRecoverySeconds`; une phase entre les côtés selon l’Ordre des côtés ; aucune récupération post-exercice dans l’éditeur |
| Cadence (Bip de cadence) | Contrôle segmenté Autre / 5 s / 2 s / 1 s / Sans (RM-245) | Deux modes, réglage commun (D-313) ; groupe Cadence et durée (D-413) | Non | Sans (0) | Entier 0..10 s ; Autre : mécanisme numérique existant, mêmes bornes et pas (RM-245) ; une valeur personnalisée remplace « Autre » dans l’option, un nouvel appui rouvre le stepper (D-447) | Série | Sélectionner dans le brouillon ; Sans (0) retire le bip | Propagation à toutes les Séries ; conservation au changement de mode |
| Durée de l’exercice (Durée totale) | Valeur calculée ; chevron à côté du libellé (RM-246) | Durée/Répétitions | Non | Calculée | Formules chapitre 08, paramètres d’exercice | Calcul | Roulette en Durée uniforme seulement | Variable : lecture seule ; ligne toujours affichée, à la même place, dans tous les modes et tous les états de saisie, y compris à N = 1 (D-396, D-433) ; « — » lorsqu’une donnée nécessaire au calcul manque (D-384) ; « Non calculable » lorsque la configuration exclut le calcul — Répétitions sans bip, tout échec, ou combinaison dont une partie empêche le calcul —, prioritaire sur « — » (D-433, remplace le masquage de D-397) ; sinon la valeur : Durée chiffrée sans symbole, Répétitions chiffrées avec bip ≈, mélange calculable ≥, symbole placé immédiatement avant la valeur, dans la même zone, jamais à côté du libellé (D-433) ; « — » et « Non calculable » ne valent jamais zéro ; le chevron replie (état initial) ou déploie Compte à rebours et Fin d’exercice sans les désactiver ni changer le calcul (RM-246) |
| Médias                    | Zone média | Selon état | Non | Vide | Le média associé est présenté dans la gouttière permanente de 64 px de la carte Catalogue ; aucun déploiement de carte d’Exercice n’est accessible au MVP (D-260/D-261) ; l’import/ajout local est inclus au MVP dans PRE-3 (D-333), sans activation implicite de la caméra | Exercice | Afficher / masquer | La Synthèse reste au-dessus en cas de chevauchement dans l’éditeur |
| Bouton Terminer           | Bouton            | Toujours                           | Oui         | Désactivé si exercice invalide | Nom, une Catégorie, au moins une Zone et un mode obligatoires ; cible valide selon le mode (D-211 ; bornes conservées par D-232 ; une valeur héritée hors bornes, non modifiée, peut être conservée, D-383) | Statique | Enregistrer | Remplace l’ancien libellé `Valider` puisqu’il n’existe plus de second écran |

**Règle transverse des roulettes numériques :** chaque changement effectif de valeur déclenche un retour haptique léger et bref, une seule fois par cran. Ce feedback est systématique et indépendant de la préférence `Vibrations` du Profil.

**Feuille des paramètres — évolution du 18/10/2026.** Les groupes, l’ordre et les libellés des lignes suivent D-413 ; Mode, Type de série et Changement de côté sont des contrôles segmentés, sans popover. Les chevrons sont intégrés aux options Variables et Avec (RM-247), la Cadence propose des choix rapides (RM-245), la ligne Durée de l’exercice replie ou déploie les signaux (RM-246), la Condition d’arrêt suit RM-248 et RM-249 et la roulette de durée commune des séries identiques ne propose plus À l’échec (RM-250). Le tableau de séries variables n’a ni pied commun ± ni stepper permanent de cellule (D-413) ; chaque cellule utilise le sélecteur existant de son champ (D-417). En séries identiques, la roulette Répétitions n’a plus d’option À l’échec (D-418) et la saisie de durée est masquée lorsque la condition commune est À l’échec (D-419) ; la Condition d’arrêt vaut À l’objectif par défaut (D-416 ; libellé D-447) ; à N = 1, la ligne Enchainement n’est pas affichée (D-415). La charge est saisie au clavier numérique, par exception propre à ce paramètre (RM-239, D-405) [exception étendue par D-434 le 19/10/2026 aux cellules Durée et Pause du tableau des séries variables et aux durées de phase, saisies au clavier numérique MMSS]. Les deux paragraphes suivants se lisent avec ces décisions.

**Présentation courante des paramètres :** la carte présente une phrase unique ; sa zone entière ouvre la feuille, sans raccourci autonome par segment. Les steppers des champs Nombre de séries et Pauses utilisent leurs contrôles intégrés ; les cellules de séries variables n’ont aucun stepper permanent et utilisent le sélecteur propre à leur champ (D-413, D-417). Les roulettes de durée se déploient sous leur ligne dans cette même feuille. Les anciennes rangées de cadres ne sont plus la référence de placement.

Dans CE-UI-10, durée par Série et Durée totale utilisent des roulettes sous leur ligne ; les pauses utilisent des steppers [hors cellules des tableaux : depuis D-434, les cellules Durée et Pause des séries variables et les durées de phase se saisissent au clavier numérique MMSS]. Séries `1..99` utilise un stepper ; la cible Répétitions `1..100` utilise une roulette native à une colonne (décision PRE-4 Q8, D-385 ; option À l’échec selon D-418) ; les réglages du Profil utilisent des steppers. Les bornes et pas suivent D-232 (minimum de durée porté à 1 s par D-430), les valeurs initiales D-246. ✓ de la roulette applique la sélection au brouillon de la feuille ; ✕ de la roulette restaure la valeur à son ouverture. ✓ de la feuille applique l’ensemble au parent ; ✕ de la feuille annule toutes les modifications depuis son ouverture, y compris celles validées dans une roulette. Aucune persistance définitive à la validation de la roulette.
#### Exécution d'une séance

#### Synthèse de séance

#### Profil

#### Suivi - Séances

#### Consultation média pendant l’Exécution — MVP

##### Face Information et Face Média

La zone d’information d’Exécution possède une face alternative Média lorsque l’Exercice courant comporte au moins un média. Un bouton dédié, toujours disponible sur les deux faces, déclenche un retournement 3D horizontal ; le retour utilise le sens inverse. Aucun média implique l’absence du bouton.

##### Galerie

La Face Média restitue la galerie dans son ordre fonctionnel. Un swipe horizontal change d’un seul média. La galerie est bornée, non circulaire et matérialise ses bornes par un effet de résistance. Des indicateurs de pagination discrets donnent la position. Le média utilise un cadrage de type « contenir » : ratio conservé, contenu complet, marges admises.

##### Vidéo et audio

Une vidéo apparaît à l’arrêt et exige Lecture. Le moteur d’Exécution ne se met jamais en pause du seul fait de la consultation. Le son vidéo est actif par défaut ; pendant une annonce vocale KODJO, son volume est abaissé puis restauré. Retourner vers Information ou swiper hors de la vidéo la met en pause.

##### Mémoire de séance

La dernière face et le média courant sont conservés par Exercice dans la séance courante. Une nouvelle séance repart sur Information. Revenir plus tard à un Exercice restaure la face et le média mais ne redémarre jamais automatiquement une vidéo.

##### Plein écran

Un appui sur le média ouvre le plein écran. L’orientation suit l’appareil. Les contrôles vidéo sont Lecture/Pause, progression et Fermer. Un cadre flottant distinct du lecteur affiche le nom, le côté applicable, le chrono, Série/Tour et les commandes essentielles d’Exécution. Le moteur continue à progresser.

##### Fin et erreur

La fin de l’Exercice ferme son affichage média et poursuit le Plan d’Exécution. Un média illisible produit un état d’erreur discret, sans interrompre l’Exécution ni la navigation vers les autres médias.

Référence normative détaillée : `../CONCEPTION-EXECUTION-MEDIA.md`.

#### Présentation et interactions des cartes

Contenu identique à la section [« Références transverses des cartes et appuis »](06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md#références-transverses-des-cartes-et-appuis) : il n’est pas recopié ici.

##### Implantation des contrôles — réconciliation Figma du 30 septembre

L’ordre et la présentation visuelle courants sont décrits dans le chapitre 06 : carte récapitulative ouvrant CE-UI-10, Description numérotée (D-425), Média, Terminer. Les champs Compte à rebours et Fin d’exercice sont dans la feuille CE-UI-10 (D-413), pas des zones autonomes du formulaire. Les anciennes rangées de cadres et sections repliables ne constituent plus une prescription de layout. Les accès Catégorie et Zones corporelles sont représentés par leurs icônes dans les états non renseignés. Les valeurs métier, bornes, formules et conditions d’enregistrement restent inchangées.

> **Clôture des contrats — 01/10/2026.** Les règles consolidées du [chapitre 13, §6](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#clôture-des-réserves-fonctionnelles-des-contrats) s’appliquent : progression sur le plan complet ; transitions et pauses selon D-248 et [Ordres d’exécution et pauses](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#ordres-dexécution-et-pauses) (ancien repli D-242 retiré) ; fréquence 1..12 semaines ; rappel personnalisé au plus 24 h. En Un côté après l’autre, le reset porte sur le bloc du côté courant ; la même règle s’applique à l’ordre alterné en conservant les résultats de l’autre côté (chapitre 13 R-03). Les étapes et calculs ci-dessous se lisent avec ces précisions ; aucune nouvelle disposition d’écran.

##### Saisie des paramètres d’exécution

Contenu identique à la section [« Saisie des paramètres d’exécution »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#saisie-des-paramètres-dexécution) : il n’est pas recopié ici.

#### Cadence — comportements communs complémentaires

La section [Exécution d'une séance — Bip de cadence, progression et sécurité](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#exécution-dune-séance--bip-de-cadence-progression-et-sécurité) fait autorité sur les signaux, Pause/Reprise, reset, temps réel, arrière-plan et seuil de sécurité ; [Ordres d’exécution et pauses](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#ordres-dexécution-et-pauses) pour pauses/côtés/Récupération, [Phrase de synthèse des paramètres](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phrase-de-synthèse-des-paramètres) pour le texte. Elle s’applique à chaque occurrence/côté/Tour. Bip 0 signifie Aucun ; aucune valeur positive implicite. Suivant avant la fin nominale est une fin normale, pas une preuve de répétitions réalisées ni une fin partielle automatique. Le passage anticipé d’un Exercice chronométré conserve ses règles distinctes.

## Composition des séances

### Composition d'une séance

#### Présentation des occurrences — révision du 21/10/2026

Dans la Composition, chaque occurrence d’Exercice est représentée par la carte v2 à trois lignes : (1) nom, avec l’indicateur de changement de côté le cas échéant ; (2) Catégorie distincte et synthèse du travail ; (3) Zones corporelles et récupération après occurrence, lorsqu’elle est affichable. Les données Catégorie et Zones proviennent de champs structurés distincts, sans découpage d’une chaîne d’affichage. Le gabarit média intégré est un ancrage visuel pour le rail segmenté, et non une nouvelle propriété de l’Exercice.

La récupération quitte la ligne visuelle séparée pour occuper la troisième ligne de la carte de l’occurrence qui la précède ; sa donnée reste portée par cette occurrence. Toucher la zone d’une récupération existante ouvre le réglage actuel de durée, sans déclencher l’ouverture de l’Exercice ; l’appui long conserve la bulle Retirer (remplacé par D-442 du 22/10/2026 : hors placement, la récupération affichée sur la carte n’est plus une cible, ni au toucher ni à l’appui long ; ajouter, modifier ou retirer une récupération se fait uniquement en mode Placement). L’ouverture de l’éditeur d’Exercice à la place du réglage et la suppression de la valeur par défaut du Profil sont différées hors de cette refonte visuelle. Les paramètres de récupération, calculs et sauvegardes restent inchangés (D-208, D-435).

Le Circuit emploie un fond teinté derrière ses cartes sans contour, un en-tête alignant titre, compteur et durée (durée retirée par D-443) ; les cartes hors Circuit gardent leur contour. Depuis D-442, le stepper du nombre de Tours ou de Séries de l’en-tête est toujours affiché et actif (− et + autour du nombre, sans toucher préalable), le nombre est présenté au format « Valeur modifiable », les cibles tactiles du −, du + et de la pastille d’unité sont espacées et d’au moins 44 pt, et tous les textes de la ligne (nombre, unité, durée) ont la taille du titre « Circuit » ; la durée affichée du Circuit est une estimation, arrondie à la minute la plus proche au-delà de 3 minutes (remplacé par D-443 du 23/10/2026 : la durée du Circuit n’est plus affichée dans son en-tête, et le stepper du nombre de Tours ou de Séries y est aligné à droite). Dans la zone de contexte, la puce Étiquette porte l’icône d’étiquette (contour), dans la couleur de l’Étiquette quand elle est choisie, et non une pastille ronde (D-442). Aucun message n’est affiché lorsque deux Exercices s’enchaînent sans pause (D-301 retirée par D-442). Depuis D-443 (23/10/2026) : tous les mouvements de la Composition sont doux, sans arrêt brutal, avec une fin progressive (disparition plus lente d’une carte supprimée ; carte créée par Dupliquer apparaissant en fondu lent, les éléments suivants glissant pour lui faire place ; actions glissées qui s’ouvrent, se referment et reviennent sans arrêt brutal) ; les cadres du Compte à rebours initial et de la Fin de séance sont alignés à droite sur le cadre des cartes d’Exercice, leur durée bornée à 0..60 s, pas 1 s, affichée en secondes seulement, sans minutes ; la durée totale de la Séance affichée dans la zone de contexte de la Composition est une estimation arrondie aux 15 secondes les plus proches, précédée de « ≈ » ou de « ≥ » selon les Exercices qui la composent, avec la même règle de choix du préfixe que l’estimation de durée existante. Le rail relie les repères structurels et les bords des gabarits par segments dérivés des positions réelles. Les points d’arrêt sont centrés dans les intervalles entre cartes. Aucune poignée de déplacement n’est affichée au repos ; l’appui long sur toute la carte reste actif.

#### Réorganisation

Les exercices peuvent être :

- ajoutées ;
- supprimées ;
- dupliquées ;
- déplacées.

Leur ordre d'exécution correspond toujours à leur position dans la séance.

La réorganisation modifie le brouillon de composition ; l’enregistrement de la séance persiste cet ordre.

Déplacer un Exercice emporte sa récupération après exercice, mais pas ses Points d’arrêt, qui gardent leur position dans la séquence. Un Point d’arrêt se déplace de façon autonome : appui long, qui le marque visuellement par un état soulevé comme une carte (D-442), glisser-déposer comme une carte d’Exercice, identité et propriétés conservées, vers toute position structurelle autorisée avant, dans (tête de Circuit comprise, D-442) ou après le Circuit ; alternatives accessibles Monter / Descendre vers l’emplacement autorisé voisin. Le déplacement n’est effectif qu’à la dépose valide. Pendant le glisser d’une carte ou d’un Point, amener l’élément près du bord haut ou bas de la zone visible fait défiler la liste ; le défilement s’arrête quand l’élément quitte ce bord ou à la dépose (D-442). Une dépose de Point qui produirait une position interdite ou deux Points d’arrêt consécutifs est refusée et restaure l’état initial, sans déplacement ni suppression automatique d’un autre élément (D-441, RM-251). Une dépose d’Exercice qui laisserait un Point à une position non autorisée (juste après le Compte à rebours, juste avant la Fin, ou consécutif à un autre Point) est en revanche appliquée : le ou les Points en cause sont retirés, sans message ; pour deux Points devenus consécutifs, le premier est conservé (D-442, qui remplace sur ce point le refus de D-441). Lorsque le Circuit est exécuté N ≥ 2 fois, une action — placement, déplacement d’un Point, déplacement d’un Exercice, passage de N = 1 à N ≥ 2 — qui ferait se suivre entre deux Tours un Point de début de Tour et un Point de fin de Tour demande lequel conserver (« Début de tour » ou « Fin de tour »), ou permet d’Annuler l’action (D-442). Une suppression d’Exercice qui laisserait un Point à une position non autorisée ou deux Points consécutifs suit la même règle que le déplacement : elle est appliquée, le ou les Points en cause sont retirés, sans message, le premier de deux Points devenus consécutifs étant conservé (D-442, recette J6 du 22/10, qui remplace le refus doux de D-441) ; la carte supprimée disparaît en fondu et les éléments suivants glissent pour combler sa place (D-442), plus lentement et sans arrêt brutal depuis D-443. Dupliquer un Exercice ne copie pas son Point d’arrêt : la copie s’insère juste après la source, avant le Point (`[A, P, B]` devient `[A, A′, P, B]`), et la récupération est copiée.

<a id="pauses-composition"></a>
#### Placement des récupérations et des points d’arrêt

En mode placement, les cartes d’Exercice restent visuellement grisées pour matérialiser leur indisponibilité à l’ouverture ; les zones d’insertion restent identifiables et actionnables. Le trait de démarcation autonome de l’ancien rendu est supprimé, sans supprimer le rail segmenté ni les liaisons des points d’arrêt. En mode placement, les points d’arrêt ont des emplacements entre les cartes, centrés et liés au rail ; les récupérations sont ajoutables dans une zone pointillée de la troisième ligne des seules cartes éligibles. Une récupération existante, y compris à `0 s`, interdit un second ajout au même endroit même si sa valeur n’est pas affichée. La liste doit défiler au-delà de la hauteur initiale pour rendre accessible la dernière position tout en conservant Annuler/Confirmer dans le pied protégé. Les positions admises et le sous-brouillon ne changent pas (D-435). Les Points d’arrêt existants apparaissent sélectionnés dans leur emplacement ; c’est en mode placement seulement qu’ils peuvent être retirés (D-441). Il en va de même des récupérations (D-442) : toutes les zones de récupération sont sélectionnables ; une récupération existante, 0 comprise, apparaît sélectionnée avec sa durée, et ajouter, modifier ou retirer une récupération se fait uniquement dans ce mode (« Ajouter un arrêt »). Un emplacement de Point d’arrêt en tête de Circuit (début de Tour, avant son premier Exercice) est proposé, comme en fin de Tour (D-442). Aucune position ne peut faire se suivre deux Points d’arrêt sans Exercice entre eux (RM-251).

##### Brouillons, validation et annulation

Entrer en placement crée un sous-brouillon de la Composition. Le clic sur un Point d’arrêt bascule sa sélection dans ce sous-brouillon : un nouvel emplacement sélectionné programme un ajout ; un Point existant, affiché sélectionné, se désélectionne pour programmer son retrait et se resélectionne pour l’annuler (D-441). Une récupération existante, affichée sélectionnée, se désélectionne au toucher pour programmer son retrait ; toucher une zone de récupération non sélectionnée ouvre la roulette, sur la durée existante sinon sur le défaut du Profil, et la sélectionne à la durée choisie, ce qui permet aussi de modifier une récupération existante (D-442). Un retrait de récupération rétablit la Pause terminale (RM-038). Sélectionner une récupération puis Valider la durée confirme l’ajout ou la modification au sous-brouillon ; fermer la roulette sans Valider (retour/fermeture du panneau, sans inventer de bouton Annuler absent de la capture) abandonne uniquement cette édition et restitue l’état antérieur de cet emplacement.

Le bouton indique « Confirmer N pauses ajoutées » ; N compte les ajouts du sous-brouillon, une récupération et un point comptent deux éléments. Une désélection retire l’ajout du décompte. Les éléments déjà présents ne sont pas comptés comme nouveaux ; la modification de leur durée n’est pas un ajout. Depuis D-441 (arbitrage du 22/10/2026), ce libellé est réservé aux ajouts seuls : le bouton indique « Confirmer les modifications » dès qu’il y a au moins un retrait de Point d’arrêt ou de récupération (D-442), un mélange d’ajouts et de retraits, ou une seule modification de durée d’une récupération existante. Sans ajout, retrait ni modification, aucune confirmation vide n’est proposée comme action active. Annuler reste libellé Annuler et restitue l’état avant entrée en placement, retraits programmés compris.

Confirmer applique atomiquement le sous-brouillon au brouillon parent. Continuer seul enregistre la Séance. Quitter/abandonner la Composition restitue la version persistée. Échec de validation, double appui et erreur d’écriture ne produisent pas d’ajout partiel.

Les récupérations restent 0..300 s avec la grille de pas déjà validée ; 0 est valide, ne produit pas de phase et n’affiche pas d’information de récupération. Un objet explicitement réglé à 0 est conservé en base, distinct de l’absence ; seul son retrait explicite, par désélection en placement (D-442), supprime l’objet. La valeur 0 ne crée aucune phase et ne remplace pas la Pause finale de Série. Tester séparément présence de données et visibilité.

<a id="phrases"></a>
#### Phrase de synthèse des paramètres

##### Extension normative — deux modes et cibles mixtes

Le mode ne sélectionne plus une branche « À l’échec » : le générateur examine les cibles ordonnées. Tout échec conserve le gabarit existant et les cartes du catalogue. Jusqu’à trois cibles, énumérer dans l’ordre. En Durée, insérer « jusqu’à l’échec » à la place de la durée concernée. En Répétitions mixtes, utiliser « {N} séries de répétitions variables ({r1}, {r2} puis jusqu’à l’échec) » ; à deux cibles, séparer par « puis ». Ne pas ajouter « répétitions » après la parenthèse. Conserver la position réelle de chaque cible à l’échec. Au-delà, compacter le mélange en « de {minimum numérique} rép. à l’échec » ou « de {minimum numérique formaté} à l’échec ». Les clauses de pauses/côtés restent celles du corpus : aucune liste de pauses variables.

Le total est celui du moteur : ≥ pour mélange calculable, prioritaire sur ≈ ; aucun total pour Répétitions sans bip ni toutes cibles À l’échec. Le corpus v15 ne couvre pas ces nouveaux cas ; ses 276 sorties ne doivent pas être présentées comme recette exhaustive du nouveau modèle. Ne pas modifier rétroactivement le fichier source Excel.

| Cas complémentaire | Fragment cible attendu | Total métier |
|---|---|---|
| Durée 30 s,45 s,échec | 3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec) | ≥ si calculable |
| Durée 30 s,45 s,60 s,échec | 4 séries variables, de 30 s à l’échec | ≥ |
| Répétitions 10,12,échec | 3 séries de répétitions variables (10, 12 puis jusqu’à l’échec) | ≥ avec bip ; absent sans bip |
| Répétitions 10,12,15,échec | 4 séries variables, de 10 rép. à l’échec | ≥ avec bip ; absent sans bip |
| Trois cibles échec, pauses variables | 3 séries menées jusqu’à l’échec | Absent ; aucune clause énumérant les pauses |

Ces fragments étendent les gabarits ; les autres clauses, segments gras et ponctuation suivent les sections précédentes. Couvrir aussi échec en première/deuxième position, bip 0/positif, les deux côtés, désignés côté 1 / côté 2 (RM-243), et la charge active ou absente. La mention de charge suit RM-240 ; sa place dans la grammaire et sa forme en séries variables ne sont pas fixées par cette section. La capture 8328:38848 contient encore une énumération des pauses : écart rédactionnel visuel, pas une nouvelle règle.

<a id="formats-conception"></a>
#### Formats de séances — comportements consolidés

Source normative : la présente section, issue de la [spécification Formats du 14/10](https://github.com/MyUncried/Application-Routine/blob/3623466af5a6dcf44dfe676f0ae8019b9c56bf76/docs/Specifications-fonctionnelles/SPECIFICATION-FORMATS-SEANCES-2026-10-14.md) intégrée le 14/10/2026, FMT-01–38. Les six formats et les départs rapides appartiennent au MVP (D-378). Ces règles étendent les parcours libres ; elles ne déclarent pas le moteur livré.

**Clarification de Composition du 29/10/2026 (active) :** chaque Exercice conserve son Format et ses réglages ; le Circuit ne porte pas de Format propre. La dépose dans un Circuit adapte, si nécessaire et si compatible, l’organisation/le nombre actif de séries, sans transmettre le Format. L’adoption d’un Format par un nouvel Exercice est un choix explicite, distinct de la dépose. En position **repliée**, la deuxième ligne existante du Circuit indique les noms des Exercices et leurs Formats éventuels ; en position **dépliée**, leurs cartes restent visibles (Figma page Prototype MVP, `10717:20056`, `10725:20142`). Aucun nouveau nom de Format commun au Circuit ni nouvel état d’interface persistant.

## Exécution

### Exécution d'une séance

#### Principe général

L'exécution d'une séance consiste à guider l'utilisateur à travers l'ensemble des exercices qui composent la séance, dans l'ordre défini lors de sa création.

Avant le démarrage effectif de la séance, un instantané fonctionnel de la séance est enregistré. Cet instantané est utilisé pour garantir la cohérence de l'historique, même si la séance est modifiée ultérieurement.

Pendant toute l'exécution, l'application calcule en temps réel la progression de la séance, le temps écoulé et le temps restant.

#### Démarrage d'une séance

Une séance peut être démarrée :

- depuis le catalogue des séances ;

Avant de lancer la première exercice, l'application :

- crée un instantané de la séance ;
- initialise les indicateurs de progression ;
- démarre le compte à rebours initial, lorsque sa durée est supérieure à `0 s`.

Lorsque le Compte à rebours initial est configuré à `0 s`, cette phase est instantanée et le premier Exercice débute immédiatement.

#### Déroulement

**Portée formats :** les fenêtres EMOM/Death by, la borne AMRAP et la clôture Death by suivent la [section Formats](#formats-conception). La transition générique et le statut ci-dessous ne les remplacent pas.

Les exercices sont exécutés dans l'ordre défini dans la séance.

Chaque exercice est exécutée intégralement avant le passage à la suivante.

Le cycle visible contient des circuits et des exercices directs et répète sa séquence de 1 à 99 fois, défaut 1 ; aucun cycle technique implicite (D-451, RM-252). Chaque circuit développe ses membres selon sa nature et son compte.

Les Exercices placés après le Circuit sont exécutés une seule fois après le dernier Tour du Circuit.

Lorsque le dernier Exercice est terminée, le Plan passe à la phase structurelle `SESSION_END`. La Séance n’est considérée comme terminée qu’après l’achèvement de cette phase.

#### Actions disponibles

Pendant l'exécution, l'utilisateur peut :

- réinitialiser l'exercice en cours ;
- mettre la séance en pause ;
- passer à l'exercice suivant.

Toutes les autres informations sont consultatives.

#### Réinitialisation d'un exercice

L’utilisateur peut réinitialiser la Série courante en unilatéral ou le bloc du côté courant depuis sa première Série en bilatéral ; pendant une récupération, seule la phase courante est réinitialisée (D-029/D-150, RM-062).
Lorsque cette action est demandée, l'application affiche une demande de confirmation.

Si l'utilisateur confirme :

- en unilatéral, la Série courante recommence ; en bilatéral, le bloc du côté courant recommence selon D-029/D-150 et chapitre 08, paramètres d’exercice, dans les deux ordres ;
- pendant une récupération, seule la phase courante recommence (RM-062) ;
- le chronomètre de tentative et la progression du périmètre reviennent à zéro ; les paramètres, l’autre côté et les résultats hors périmètre sont conservés ;
- le temps actif réel cumulé, y compris celui des tentatives antérieures, reste enregistré ; aucun nombre de répétitions physiquement réalisées n’est déduit ni annulé.

Si l'utilisateur annule, aucun reset n’est appliqué. Les règles de confirmation et de suspension ci-dessous s’appliquent ; une reprise de Série cadencée suit l’exception d’intervalle complet de chapitre 10, résultats temporels.

Les confirmations appliquées pendant l'Exécution suivent la règle suivante :

- **Réinitialiser** → confirmation, afin d'éviter une perte involontaire de progression sur l'Exercice ;
- **Suivant** → pour un Exercice chronométré avant son terme, confirmation afin d’éviter un passage involontaire et enregistrement `Partielle` si confirmé ; pour une Série en mode Répétitions ou à cible À l’échec (D-111), fin normale de la Série sans confirmation ;
- **Pause** → aucune confirmation, l'action étant réversible ;
- **Arrêter la séance** → confirmation via le modal de pause.

Les confirmations protègent ainsi les actions ayant un impact irréversible sur la progression.

#### Mise en pause

La mise en pause suspend immédiatement :

- le chronomètre ;
- les annonces vocales ;
- les signaux sonores ;
- la progression automatique.

La séance conserve son plan et ses résultats ; en cadence, la progression revient au dernier intervalle complet et le temps actif cumulé est conservé.

Depuis l'écran de pause, l'utilisateur peut :

- reprendre la séance ;
- arrêter la séance.

#### Arrêt anticipé

*Texte identique à celui de la section [« Déroulement »](#déroulement) ; il n’est pas recopié ici.*

L'arrêt anticipé est uniquement accessible depuis l'écran de pause.

Lorsque l'utilisateur confirme cet arrêt :

- l'exécution est interrompue ;
- les informations déjà enregistrées sont conservées ;
- la séance est enregistrée dans l'historique avec le statut **Interrompue** ;
- l'écran de synthèse est affiché.

Les exercices restants ne sont pas exécutées.
<a id="planification"></a>
#### Planification des créneaux et de leurs contenus

### Déroulement d'une séance

Lorsqu'une Séance est démarrée :

1. un instantané de la Séance est créé ;
2. le moteur construit le Plan d’Exécution ;
3. les Exercices sont exécutés dans l'ordre prévu ;
4. les informations d'Exécution sont enregistrées ;
5. les résultats sont sauvegardés.

Le Plan d’Exécution constitue une structure interne générée automatiquement au démarrage de chaque Séance. Il n'est jamais manipulé directement par l'utilisateur.

### Guidage de l'utilisateur

Pendant une Exécution, l'application accompagne l'utilisateur grâce à différents mécanismes de guidage.

Elle affiche notamment :
- l'Exercice en cours ;
- l'Exercice suivant ;
- le temps restant ou écoulé ;
- la progression ;
- les informations de Série et de Tour pertinentes, sans exposer le Cycle.
- le côté courant, désigné côté 1 ou côté 2 (RM-243) ;
- la charge de la Série courante lorsque la charge est active (RM-241).

Le guidage sonore peut comprendre :
- une annonce vocale du nom de chaque Exercice au début de son exécution ;
- l’annonce du côté, désigné côté 1 ou côté 2 (RM-243), lorsque l’Exercice comporte un changement de côté (Avec) ;
- un bip grave pendant les exercices chronométrés ;
- un bip aigu pendant les trois dernières secondes de toute étape chronométrée.

Les annonces vocales, les bips et les vibrations fonctionnelles de séance peuvent être activés ou désactivés indépendamment selon les préférences de l'utilisateur. Le retour haptique d'interface produit par les roulettes numériques est distinct : il est systématique et n'est pas piloté par la préférence `Vibrations`.

### Navigation principale et articulation des écrans — Navigation pendant une Exécution

Pendant l’Exécution, la navigation principale n’est pas affichée.

L’utilisateur dispose de trois commandes principales :

- `Réinitialiser l’exercice` ;
- `Pause` ;
- `Exercice suivant`.

Il n’existe pas de bouton `Quitter` ou `Arrêter` directement sur l’écran d’Exécution. L’action `Arrêter la séance` est accessible uniquement depuis la modale de pause.

L’utilisateur ne peut pas revenir à un Exercice déjà exécuté.

### Exécution — séance ou exercice — Exercice défini par une durée

Pour un Exercice en mode Durée ou une phase de Récupération, le temps est présenté sous forme de compte à rebours.

Lorsque le compte à rebours atteint zéro, l’Exercice se termine normalement et l’Exécution passe à la suite.

Si l’utilisateur appuie sur `Exercice suivant` avant zéro, une confirmation est demandée. Après confirmation, l’Exercice est enregistré avec le statut métier `Partielle` et l’Exécution continue.

### Exécution — séance ou exercice — Exercice défini par un nombre de répétitions

Pour un Exercice défini par un nombre de répétitions, l’écran conserve le même layout que pour un Exercice chronométré.

Le temps actif est affiché par un chronomètre croissant à partir de 00:00. Sans cadence, aucune durée prescrite ; avec cadence, Ri×Ci définit une fin nominale, sans fin automatique de Série.

Sans cadence, le cercle du minuteur effectue une rotation complète par minute :

- une rotation complète représente 60 secondes ;
- à `01:00`, il recommence une nouvelle rotation ;
- le chronomètre continue à croître (`01:01`, `01:02`, etc.).

Bip positif : signal périodique dans les deux modes pendant Série, y compris après le nominal Répétitions ; aucun dernier signal nominal distinct ni bip minute superposé. Bip 0 : règles antérieures de signal minute conservées pour les modes concernés. Fin Durée chiffrée au minuteur ; Répétitions et toute cible À l’échec manuelles. Même shell, pas de nouvel écran.

`Pause` suspend le chronomètre et la rotation du cercle. `Reprendre` les relance depuis l’état exact où ils ont été suspendus.

L’utilisateur termine normalement chaque Série avec `Suivant`. Cette action ne crée pas un Exercice au statut Partielle : elle valide la fin normale de la Série en mode Répétitions ou à cible À l’échec (D-111).

### Exécution — séance ou exercice — Réinitialiser l’Exercice

L’action ouvre la modale de confirmation.

Après confirmation :

- en unilatéral, la Série courante recommence depuis son état initial ; en bilatéral, le bloc du côté courant recommence depuis sa première Série (D-029, D-150) ;
- pour un Exercice chronométré, le compte à rebours retrouve sa durée initiale ;
- pour un Exercice en Répétitions ou À l’échec, le chronomètre d’Exercice revient à `00:00` ;
- la cible de répétitions n’est pas modifiée ;
- le temps total déjà écoulé dans la Séance reste conservé ;
- la position dans la séance et la répétition en cours restent inchangées.

Pendant `SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY`, la confirmation réinitialise uniquement le compte à rebours de la phase de récupération courante. Elle ne rejoue aucune Série déjà acquise et ne modifie pas les résultats antérieurs.

### Exécution — séance ou exercice — Mise en pause

Toucher `Pause` suspend immédiatement l’Exécution et ouvre la modale `Séance en pause`.

La pause suspend :

- le compte à rebours ou le chronomètre d’Exercice ;
- l’enchaînement automatique ;
- le temps actif ;
- les bips et annonces liés à la progression ;
- les animations de progression.

La modale propose :

- `Reprendre la séance` ;
- `Arrêter la séance`.

`Reprendre la séance` restaure l’état exact de l’Exercice.

`Arrêter la séance` termine l’Exécution avec le statut `Interrompue`. Dans T04, il ouvre l’écran de fin minimale ; l’ouverture de la Synthèse appartient à la tranche qui livre cette dernière.

Il n’existe pas de commande directe d’arrêt depuis l’écran principal d’Exécution.

### Exécution — séance ou exercice — Exercice suivant

Le comportement dépend de la phase courante :

- **Exercice en Répétitions ou À l’échec** : termine normalement la Série courante et passe à la pause, à la Série suivante ou à l’Exercice suivant selon le plan ;
- **Exercice chronométré avant zéro** : ouvre la modale de confirmation ; après confirmation, l’Exercice est enregistré avec le statut `Partielle`, puis l’Exécution continue ;
- **Phase de récupération avant zéro** : ouvre la même confirmation ; après confirmation, la durée partielle de la phase courante (`SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY`) est conservée et le Plan poursuit vers son étape suivante ;
- **Exercice chronométré arrivé à zéro** : la transition est automatique.

### Exécution — séance ou exercice — Navigation pendant l’Exécution

L’ordre d’Exécution est déterminé par le Plan d’Exécution.

L’utilisateur ne peut pas sélectionner librement un autre Exercice ni revenir à un Exercice déjà terminé.

### Exécution — séance ou exercice — Guidage sonore

Dans T04, Sons et Annonces vocales sont activés par défaut au début de chaque Exécution. Leur état peut être changé pendant l’Exécution, mais cette tranche ne lit ni n’enregistre encore de préférence utilisateur correspondante ; leur configuration depuis le Profil appartient à une tranche ultérieure.

Au début d’un Exercice, son nom peut être annoncé vocalement lorsque les Annonces vocales sont actives. Au début d’une phase de récupération chronométrée (`SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY`), l’annonce est `Récupération`. Une annonce de côté désigne « côté 1 » ou « côté 2 », jamais droite ou gauche (RM-243).

Pour les Exercices chronométrés, les signaux sonores de fin de compte à rebours sont appliqués conformément aux règles métier définies pour le MVP.

Répétitions sans bip/À l’échec sans bip : aucun signal de fin de compte à rebours, bip minute. À l’échec avec bip : périodique sans bip minute superposé. Répétitions cadencées : signal périodique maintenu après nominal sans signal final distinct, sans transition automatique ni bip minute ; chronomètre toujours croissant.

### Exécution — séance ou exercice — Arrière-plan et verrouillage

Si l’application passe en arrière-plan ou si l’écran se verrouille :

- le Plan d’Exécution continue selon ses horodatages de référence ;
- l’Exercice chronométré ne se fige pas ;
- au retour, l’application reconstitue l’Exercice et la position temporelle qui auraient dû être atteintes, plutôt que de reprendre le compteur à l’endroit où l’interface a été suspendue ;
- les sons et annonces sont maintenus dans la mesure permise par iOS et Android.

Une mise en pause de sécurité est appliquée en cas d’inexercice prolongée :

- pour un Exercice chronométré, si aucune interaction n’a eu lieu 30 minutes après sa fin théorique ;
- pour une Série Répétitions cadencée,30 min après la fin nominale recalculée sans interaction ;
- pour un Exercice en Répétitions sans cadence ou À l’échec,2 h sans interaction depuis son démarrage.

Le comportement précis fait l’objet du spike technique prévu avant le développement complet du moteur d’Exécution.

### Exécution — séance ou exercice — Fin de l’Exécution

Lorsque le Plan d’Exécution arrive à son terme, l’Exécution est enregistrée et l’écran `Synthèse de séance` est affiché.

La Séance source et la Routine éventuelle ne sont jamais modifiées par l’Exécution.

### Exécution — séance ou exercice — Exercice lancé directement depuis le catalogue

L’Exécution directe conserve une préparation système fixe de `5 s`. Cette durée n’est pas un attribut de l’Exercice. Les anciennes captures dédiées sont retirées de ce parcours ; les variantes actuelles sont présentées ci-dessous.

L’écran réutilise le moteur et le Shell d’Exécution. Il développe Séries, Pauses et côtés, sans Récupération après exercice (D-208), sans structure de Séance artificielle ni phase `SESSION_END`. Après la dernière phase, un signal ouvre immédiatement la Synthèse.

## Suivi et synthèse

### Suivi et historique des séances

#### Consultation de l'historique

L'utilisateur peut consulter son historique depuis l'écran **Suivi**.

Les séances exécutées sont présentées sous forme de liste chronologique.

Pour les Exécutions enregistrées, l'utilisateur peut :

- rechercher une Exécution ;
- modifier l’ordre chronologique d’affichage, hors MVP : dans le MVP, `Trier` est visible mais désactivé (D-031).

Dans le MVP, les cartes du Suivi ont deux lignes, sans déploiement : nature, titre et statut ; puis durée réelle, catégorie et Ressenti lorsqu’il existe. Elles n’affichent ni heure, ni zones corporelles, ni étiquettes. Le détail d’Exécution demeure enregistré dans l’instantané et les résultats ; sa présentation déployée est hors MVP (D-262).

#### Recherche

La recherche est effectuée sur :

- le nom de la Séance ;
- les Étiquettes de Séance ;
- les Catégories et Zones corporelles des Exercices selon le contexte de recherche.

Les résultats sont mis à jour au fur et à mesure de la saisie.

#### Tri

Hors MVP, le Suivi permettra d’inverser l’ordre chronologique des Exécutions ; dans le MVP, `Trier` est visible mais désactivé (D-031) :

- plus récent au plus ancien ;
- plus ancien au plus récent.

Par défaut, les Exécutions sont triées de la plus récente à la plus ancienne. Les autres critères de tri sont reportés à une version ultérieure.

#### Déploiement du détail

Dans le MVP, une Exécution du Suivi n’est pas déployée : sa présentation déployée est hors MVP ; le détail d’Exécution demeure enregistré dans l’instantané et les résultats (D-262).

Aucun bouton **Déployer tout / Replier tout** n'est affiché.

## Interface transverse

### Navigation principale et articulation des écrans — Retour et fermeture

En dehors d’une Exécution en cours, revenir à l’écran précédent ne nécessite pas de confirmation lorsque les modifications ont déjà été enregistrées ou lorsqu’aucune donnée temporaire ne risque d’être perdue.

La modale `Abandonner la création d’une séance` concerne la création en cours dans l’écran `Composer une séance`.

Pendant une Exécution, aucune sortie directe vers la navigation principale n’est proposée. L’arrêt de la Séance est accessible uniquement après mise en pause.

### Navigation principale et articulation des écrans — Conservation du contexte

L’application conserve autant que possible le contexte de l’utilisateur :

- la Séance précédemment consultée ;
- l’état déployé ou replié d’une carte tant que l’utilisateur reste dans la vue concernée ;
- l’Exercice et la Série en cours pendant une Exécution ;
- la position dans le Suivi.

Après la fermeture d’une modale, l’utilisateur retrouve le contexte depuis lequel elle a été ouverte.


## États et transitions — mouvement et niveau (25/10)

**D-445 — décisions validées le 25/10 :** C01–C07 et C09 sont clos ; C08 seul reste différé sur le périmètre MVP. [Spécification consolidée v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md). [bandeau répété dans ce chapitre, sans portée propre : même renvoi à D-445 que celui d’en-tête — annotation du 26/10/2026]

Références : [v6](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md), [relevé courant, contradictions et couverture](../DSF-NIVEAUX-RECHERCHE-2026-10-25.md).


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
| C08 | Rattacher, détacher, supprimer : inclusion MVP à décider ultérieurement ; aucune exclusion décidée | Périmètre différé |
| C09 | Commande Niveau active hors crayon ; sélectionner un autre niveau ne reclasse pas le mouvement courant | Clos |

Une `ActivityDefinition` référence directement un mouvement et porte ses paramètres propres. Une `SessionActivity` possède son identifiant et référence **directement le mouvement**, sans dépendance de contenu envers l’exercice Catalogue ; elle porte une copie locale complète des paramètres au moment de l’insertion, puis les conserve indépendamment. Elle ne conserve pas une copie modifiable du nom, de la description, des médias, de la catégorie, des zones ni de la structure des phases.

Les corrections du contenu partagé sont visibles à la prochaine lecture des définitions et des séances ; aucun mécanisme de propagation de copies de contenu n’est nécessaire. Modifier les paramètres Catalogue ne modifie pas ceux des séances. Supprimer ou archiver la définition Catalogue ne casse pas les occurrences.

Au démarrage, résoudre le contenu courant avec les paramètres de l’exercice puis construire un instantané autonome. Cet instantané, l’exécution déjà démarrée et les historiques ne changent plus avec le mouvement. Leur `sourceMovementId` conserve l’identité exécutée, sans rang stocké ; la classification actuelle peut être résolue séparément à la lecture.

Les relations actives vers le mouvement doivent rester intègres, depuis les définitions **et les occurrences de séance**. L’absence de contrainte référentielle et la tolérance d’orphelins concernent la filiation des instantanés, pas le contenu vivant. La suppression explicite d’un mouvement encore référencé par un exercice est interdite ; son parcours reste dans C08. La suppression du dernier exercice ne supprime jamais le mouvement : un mouvement peut exister sans exercice et reste recherchable.

Référence : [spécification v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md). Les captures du 25/10 restent datées ; aucune nouvelle inspection ni correction de Figma n’est déclarée par cette mise à jour documentaire.


## Catalogue des séances — parcours actualisés le 27/10/2026

**Zones de contexte communes aux Catalogues — cible PRE-9.** [Spécification des compteurs et de la recherche](../KODJO-Zones-contexte-catalogues-PRE9-2026-10-30.md), contrat CE-CAT-CTX-01. Sur Mouvements, « N familles · N mouvements » constitue deux filtres de compteurs activables indépendamment, exclusifs et désélectionnables ; leur sélection se cumule aux filtres existants et à la recherche, tandis que les valeurs comptent les cartes effectivement visibles. Sur Séances, « Un exercice N | Plusieurs N » conserve le comportement de la bascule et n'ajoute que des chiffres informatifs. En état filtré/archivé, « N résultats » indique en direct la taille de la liste résultante ; les chiffres ne sont pas persistés. Les libellés de titre individuel de page sont masqués, sans masquer le segmenté principal Mouvements/Séances/Programmes.

La [spécification carte/catalogue](../KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md) et CE-T03-01 remplacent les parcours du catalogue autonome d'exercices dans la cible D-449. Le catalogue offre une collection de séances et les vues Un exercice/Plusieurs, désélectionnables. Le chevron du nom déploie uniquement les séances de plusieurs exercices ; il n'ouvre pas la Composition. Les entrées de modification et de lancement existantes restent distinctes. Les actions actives sont Planifier/Dupliquer/Archiver ; les archives exposent Restaurer/Supprimer dans le glissé, sans restauration ronde sur la carte. Les règles métier existantes de confirmation et de conservation d'historique restent applicables.

Le panneau de filtres suit le §6 de la source : Statut, Catégories, Zones corporelles, Étiquettes, Format. Les nouvelles sections ne suppriment pas les référentiels ni leurs données. Les règles combinatoires non précisées dans la source sont signalées dans le relevé DSF, à réutiliser depuis l'existant ou à préciser pour la story filtres.

### Nom de séance — trois états validés le 27/10/2026

1. À l'ouverture, nom du format, en gris, non modifiable.
2. À l'ajout du premier exercice, nom de cet exercice, éditable.
3. À l'ajout du second exercice, invite « Entrer un nom de séance », grise et éditable ; l'obligation de nommer apparaît.

Aucun suffixe de niveau dans le nom. Cette règle concerne la création/composition et sera traitée dans son lot. Les retours après retrait d'exercices et la préservation d'un titre déjà personnalisé ne sont pas spécifiés par ce texte ; aucune règle supplémentaire n'est inventée ici.
