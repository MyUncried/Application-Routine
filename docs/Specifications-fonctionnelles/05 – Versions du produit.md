# Versions et périmètre

## Composition — actualisation du 28/10/2026

Les cycles visibles avec compte propre, exercices directs de cycle et circuits multiples entrent dans la cible MVP. Cette intégration documentaire ne prouve aucune réalisation et ne modifie aucune préparation figée. Voir [Composition du 28/10](../KODJO-Composition-conteneurs-2026-10-28.md).

## Sommaire

- [V1 – KODJO MVP : séance structurée et exécution locale](#v1--kodjo-mvp--séance-structurée-et-exécution-locale)
  - [Objectif](#objectif)
  - [Fonctionnalités](#fonctionnalités)
- [Complément intégré au MVP](#complément-intégré-au-mvp)
- [V2 – Réutilisation avancée des séances](#v2--réutilisation-avancée-des-séances)
  - [Objectif](#objectif-1)
  - [Fonctionnalités](#fonctionnalités-1)
- [V3 – Synchronisation et relation avec un kinésithérapeute](#v3--synchronisation-et-relation-avec-un-kinésithérapeute)
  - [Objectif](#objectif-2)
  - [Fonctionnalités](#fonctionnalités-2)
- [V4 – Extension de la vision](#v4--extension-de-la-vision)
  - [Objectif](#objectif-3)
  - [Fonctionnalités envisagées](#fonctionnalités-envisagées)
  - [V1 (MVP)](#v1-mvp)
- [Répartition validée](#répartition-validée)
  - [MVP](#mvp)
  - [MVP — complément PRE-3 (D-333)](#mvp--complément-pre-3-d-333)
  - [MVP — complément T03](#mvp--complément-t03)
- [Champs et comportements des fonctionnalités — Suivi - Vue d'ensemble](#champs-et-comportements-des-fonctionnalités--suivi---vue-densemble)
  - [Règles liées à la couleur](#règles-liées-à-la-couleur)
- [Roadmap des tranches MVP après arbitrage](#roadmap-des-tranches-mvp-après-arbitrage)
- [Tranche Bilatéralité et révision de T04](#tranche-bilatéralité-et-révision-de-t04)
- [MVP T03 — Exercice directement exécutable](#mvp-t03--exercice-directement-exécutable)
- [Évolution conçue — consultation média pendant l’Exécution](#évolution-conçue--consultation-média-pendant-lexécution)
- [Portée de la revue des cartes](#portée-de-la-revue-des-cartes)
- [Consolidation avant planification](#consolidation-avant-planification)
- [Paramètres d’exécution — complément](#paramètres-dexécution--complément)
- [Évolution Cadence — statut](#évolution-cadence--statut)
- [Conception de planification](#conception-de-planification)
- [Formats — conception cible et livraison](#formats--conception-cible-et-livraison)
- [Utilisateur prioritaire du MVP](#utilisateur-prioritaire-du-mvp)
- [Périmètre fonctionnel du MVP — Catalogue des séances](#périmètre-fonctionnel-du-mvp--catalogue-des-séances)
- [Périmètre fonctionnel du MVP — Catalogue des exercices — T03](#périmètre-fonctionnel-du-mvp--catalogue-des-exercices--t03)
- [Périmètre fonctionnel du MVP — Planification et calendrier](#périmètre-fonctionnel-du-mvp--planification-et-calendrier)
- [Périmètre fonctionnel du MVP — Profil et Préférences](#périmètre-fonctionnel-du-mvp--profil-et-préférences)
- [Cible fonctionnelle confirmée — Catalogue multi-type](#cible-fonctionnelle-confirmée--catalogue-multi-type)
- [Cible fonctionnelle confirmée — Catalogue des exercices — MVP T03](#cible-fonctionnelle-confirmée--catalogue-des-exercices--mvp-t03)
- [Vision cible — médias pendant l’Exécution](#vision-cible--médias-pendant-lexécution)
- [Cadence facultative — cible documentaire](#cadence-facultative--cible-documentaire)
- [Formats et création rapide](#formats-et-création-rapide)
- [Périmètre du MVP](#périmètre-du-mvp)
- [Exécution — séance ou exercice — Lecture des variantes avec média](#exécution--séance-ou-exercice--lecture-des-variantes-avec-média)
- [Suivi — Séances — Filtres avancés](#suivi--séances--filtres-avancés)
- [Suivi — Séances — Tri](#suivi--séances--tri)
- [Archives et références hors prototype actif — Objectif](#archives-et-références-hors-prototype-actif--objectif)
- [Archives et références hors prototype actif — Présence dans le MVP](#archives-et-références-hors-prototype-actif--présence-dans-le-mvp)
- [Principes généraux — Évolutivité](#principes-généraux--évolutivité)
- [Catalogue des Exercices — cycle de vie d’un Exercice persistant — MVP T03 — Limite Parcours](#catalogue-des-exercices--cycle-de-vie-dun-exercice-persistant--mvp-t03--limite-parcours)
- [Phrase de synthèse des paramètres — Combinaisons dont la règle reste à préciser](#phrase-de-synthèse-des-paramètres--combinaisons-dont-la-règle-reste-à-préciser)
- [Planification des créneaux et de leurs contenus — Points ouverts, à consigner comme tels](#planification-des-créneaux-et-de-leurs-contenus--points-ouverts-à-consigner-comme-tels)
- [Planification des créneaux et de leurs contenus — Limites de spécification à traiter avant développement](#planification-des-créneaux-et-de-leurs-contenus--limites-de-spécification-à-traiter-avant-développement)
- [Suivi et historique des séances — Filtres](#suivi-et-historique-des-séances--filtres)

## V1 – KODJO MVP : séance structurée et exécution locale

> Mise à jour du 24 septembre 2026 : Étiquette = classification/couleur de Séance ; Catégorie = classification/couleur d’Exercice ; Point d’arrêt ; Compte à rebours et Fin propres à l’Exercice ; changement de côté non exposé au niveau Circuit ; roulettes en modale basse ; média en gouttière permanente dans le Catalogue des Exercices depuis D-260/D-261 du 03/10/2026.

### Objectif

Permettre à un utilisateur de créer des Séances structurées et des Exercices persistants, **planifier directement l’un ou l’autre**, les exécuter en étant guidé et conserver un historique local, sans compte utilisateur ni synchronisation.

### Fonctionnalités

- créer, modifier, dupliquer et archiver une Séance ; supprimer une Séance uniquement depuis les archives ;
- créer des Exercices sans sélection de type ;
- définir pour chaque exercice :
  - un nom ;
  - une consigne ;
  - un mode Durée ou Répétitions, avec une cible chiffrée ou À l’échec par Série ;
  - un nombre de Séries propre à l'Exercice ;
- *Texte identique à celui de la section [« Structure d'un Exercice »](04%20%E2%80%93%20Mod%C3%A8le%20fonctionnel.md#structure-dun-exercice) ; il n’est pas recopié ici.*
  - une Pause entre les côtés éventuelle, uniquement pour un Exercice bilatéral ;
  - en mode Durée, une Durée totale calculée et dépendante du nombre de Séries ;
- afficher dans le MVP la vignette média associée à l’Exercice ; aucun Déployer avec ou sans média (D-261) ; l’import/ajout et la persistance de `0..n` photos ou vidéos locales ordonnées sont inclus au MVP dans PRE-3 par D-333 ;
- ordonner les exercices du Circuit ;
- utiliser des cycles visibles et plusieurs circuits dans le MVP, avec leurs comptes propres (D-451) ;
- ordonner les Exercices dans le Circuit visible, dont le nombre de répétitions est compris entre 1 et 99 ;
- exécuter immédiatement une séance ;
- guider l’utilisateur visuellement et sonorement pendant l’exécution ;
- annoncer vocalement le nom de chaque Exercice au moment où elle commence et `Récupération` au démarrage d’une phase `SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY` lorsqu’elle existe ;
- émettre un bip grave à chaque seconde pendant les exercices chronométrés ;
- ne pas émettre de bip de rythme pendant les Pauses entre Séries ni pendant les phases de récupération ;
- émettre un bip aigu pendant chacune des trois dernières secondes de toute étape chronométrée ;
- remplacer, pendant les trois dernières secondes d’un exercice, le bip grave par le bip aigu ;
- passer automatiquement à l’étape suivante à la fin d’une étape chronométrée ;
- permettre d’activer ou de désactiver globalement les sons de l’application ; dans le MVP, ce réglage agit sur l’ensemble des bips sonores et ne permet pas de désactiver séparément le bip grave de rythme ;
- permettre d’activer ou de désactiver séparément les annonces vocales ;
- afficher clairement l’exercice en cours, son type ou son libellé, l’étape suivante et la progression dans la séance ;
- utiliser une minuterie pour les exercices définis par une durée ;
- mettre la séance en pause et la reprendre ;
- maintenir, dans la mesure permise par le système d’exploitation, le guidage sonore lorsque l’écran est verrouillé ou que l’application fonctionne en arrière-plan ;
- terminer normalement chaque Série d’un Exercice en Répétitions ou À l’échec avec `Suivant`, ou passer manuellement à l’Exercice suivant ;
- afficher la Série et le Tour en cours, sans afficher le Cycle ;
- interrompre ou terminer une séance ;
- enregistrer localement :
  - la date de la séance ;
  - sa durée ;
  - son statut ;
  - les Exercices terminées, Partielles ou interrompues ;
  - les Tours et Exercices réalisés ;
  - la version de la séance ;
  - la routine éventuelle ;
- consulter un historique simple des séances ;
- renseigner obligatoirement, en fin de séance, un ressenti général ;
- renseigner facultativement un Commentaire de **200 caractères maximum** ;
- retrouver les Exécutions enregistrées sous forme de cartes à deux lignes, sans déploiement, dans le Suivi ; afficher `Vue d’ensemble`, `Filtrer` et `Trier` comme commandes désactivées.

Dans cette version, l’échauffement et le retour au calme utilisent des Exercices ordinaires, placées selon le besoin avant le Circuit, dans le Circuit ou après le Circuit. `Retour au calme` n’est pas un type structurel particulier.

Le guidage sonore doit, dans la mesure permise par le système d’exploitation, continuer lorsque l’écran est verrouillé ou que l’application fonctionne en arrière-plan.

Toutes les données sont enregistrées uniquement sur l’appareil.

La V1 permet également :
- de créer une Routine ;
- d'associer une Séance **ou un Exercice persistant** à une Routine ;
- de définir un créneau unique ou répété via un interrupteur, avec unité Jour/Semaine/Mois et borne jusqu’au/pendant ; voir la spécification du 08/10 et ses points ouverts ;
- d'ajouter un rappel facultatif (0 ou 1 rappel par Routine).

Le modèle de données de la V1 repose sur la hiérarchie Séance → Cycle → Tour → Exercice.

---

### Phases d’exercice — périmètre MVP

Le MVP inclut jusqu’à six phases chronométrées et nommées par exercice, en Durée ou Répétitions, à cible ou à l’échec, en séries identiques [et variables depuis D-446 du 26/10/2026] : édition, copies, calcul, adaptation aux formats compatibles [D-446 (Q9) : tous les formats ; durées de phase jamais adaptées, PHC-20261026] et guidage d’exécution. Les phases sont également compatibles avec Répétitions et À l’échec (PHC-20261026). Cette décision ne vaut pas livraison dans une tranche déjà qualifiée et ne modifie pas rétroactivement son périmètre de recette. Le placement sur le cadran et les cartes reste à compléter dans les contrats concernés ; la personnalisation libre du cadran n’est pas incluse.

## Complément intégré au MVP

- D-200 intègre directement au MVP la suppression des Étiquettes, Catégories et Zones corporelles depuis leurs modales de sélection par appui long puis confirmation ; toutes les valeurs, initiales comme personnalisées, sont concernées.

## V2 – Réutilisation avancée des séances

### Objectif

Enrichir rapidement la construction et l’exécution des routines, sans modifier encore le principe d’une application locale utilisée par une seule personne.

### Fonctionnalités

- intégrer une séance existante dans une autre séance ;
- conserver le nom et le regroupement visuel d’une séance intégrée ;
- copier son contenu afin qu’il devienne indépendant de la séance source ;
- développer, replier et modifier une séance intégrée ;
- enrichir les structures d’échauffement et de fin de séance si les tests montrent ce besoin ;
- calculer distinctement la Durée estimée d’exécution du Plan complet et la Durée synthétique des Exercices affichée dans le Catalogue, distincte du total propre au Circuit affiché sous son titre dans la Composition (D-382) ;
- afficher la progression dans les structures et séances intégrées ;
- enregistrer les structures imbriquées et les éléments réellement effectués.
- ajouter des filtres avancés du Suivi (catégories, zones corporelles, période, statut) et, si utile, des critères de tri supplémentaires.
- ajouter la Vue d’ensemble analytique et activer les commandes `Filtrer` et `Trier` déjà visibles dans le MVP ;
- l'activation/la désactivation du bip grave à chaque seconde pendant les exercices chronométrés devient paramétrable dans les Préférences.

#### Internationalisation

Le MVP est monolingue en français. L’architecture est néanmoins préparée dès le MVP pour permettre une évolution multilingue simple.

Les évolutions ultérieures pourront ajouter :
- plusieurs langues d’interface à partir d’un catalogue de textes externalisés ;
- la sélection de la langue de l’interface ;
- la sélection de la langue utilisée pour les annonces vocales ;
- des contenus traduisibles sans refonte des écrans ni de la logique métier.

Aucun sélecteur de langue n’est affiché dans le MVP.
#### Composition avancée des séances

La structure d'une séance pourra être étendue afin de permettre :
 
 - plusieurs Cycles ordonnés dans une même Séance ;
 - plusieurs Circuits ordonnés dans un même Cycle ;
 - un nombre de répétitions propre à chaque Cycle et à chaque Circuit.
 
 Cette évolution ne rend pas les Cycles, Circuits ou copies `SessionActivity` réutilisables entre plusieurs Séances. Le Catalogue des Exercices du MVP T03 permet séparément de copier une `ActivityDefinition` autonome dans plusieurs Séances ; chaque copie devient ensuite indépendante.

## V3 – Synchronisation et relation avec un kinésithérapeute

### Objectif

Faire évoluer l’application personnelle vers un service synchronisé permettant la planification des séances et la collaboration avec un professionnel.

### Fonctionnalités

#### Comptes et synchronisation

- créer un compte utilisateur ;
- se connecter de manière sécurisée ;
- synchroniser les routines, programmations et séances ;
- retrouver ses données sur plusieurs appareils ;
- sauvegarder et restaurer ses données.

#### Relation avec un kinésithérapeute

- associer un utilisateur à un kinésithérapeute ;
- permettre au kinésithérapeute de créer ou prescrire une séance ;
- transmettre des exercices, des consignes, des photos et des vidéos ;
- faire évoluer une routine prescrite ;
- distinguer les séances personnelles des routines prescrites ;
- partager avec le kinésithérapeute les séances réalisées ;
- transmettre un retour simple sur la douleur, la difficulté ou la fatigue ;
- conserver l’historique des versions prescrites.

Les modalités précises d’accès aux données, de consentement et de confidentialité devront être définies avant le développement de cette version.

---

## V4 – Extension de la vision

### Objectif

Développer les fonctions avancées, sociales et intelligentes de l’application à partir des usages constatés dans les premières versions.

### Fonctionnalités envisagées

#### Intelligence artificielle

- génération assistée de séances ;
- recommandations personnalisées ;
- adaptation des séances selon l'historique ;
- aide à la création d'exercices ;

- suivi détaillé de la douleur, de la fatigue et de la progression ;
- tableaux de bord et analyses comparatives ;
- comparaison avancée entre les séances prévues et réalisées ;
- adaptation progressive des séances ;
- recommandations assistées par intelligence artificielle ;
- partage de séances entre utilisateurs ;
- bibliothèque publique de séances ;
- groupes et communautés ;
- messagerie avec les professionnels ;
- synchronisation d’une séance intégrée avec sa source ;
- choix entre plusieurs voix ;
- personnalisation des sons ;
- réglage indépendant du volume des différents signaux dans l’application ;
- annonce anticipée de l’étape suivante ;
- guidage vocal enrichi avec consignes détaillées ;
- adaptation automatique du guidage sonore au contexte ou aux préférences de l’utilisateur ;
- autres fonctions identifiées à partir des retours des utilisateurs.

Le contenu exact de la V4 sera priorisé après les retours obtenus sur les versions précédentes.

### V1 (MVP)
- Gestion des séances actives et archivées.
- Gestion des Routines de planification pour les Séances **et les Exercices persistants**.

### MVP — Évaluations et résultats PRE-5 (D-427 à D-429)
Standard : aucune évaluation avant et Ressenti triétat obligatoire après. Enrichi uniquement pour une exécution lancée dans le contexte d'un Programme avec option active (tout lancement indépendant reste standard) : douleur initiale 0–10 obligatoire et sans localisation avant démarrage ; douleur finale 0–10 obligatoire, jamais présélectionnée, et effort perçu 1–10 obligatoire après, à la place du Ressenti. Si douleur finale > 0, au moins une localisation parmi les zones corporelles KODJO (plusieurs possibles, latéralité si applicable) ; zéro doit être choisi explicitement. Commencer ou Enregistrer est bloqué tant que des champs obligatoires manquent. Paramétrage de l'option : À CLARIFIER.

Formats imposés : modale Répétitions partielles (8928:15098), interruption ou série sous cible ; saisie proposée zéro, minimum zéro, résultat supérieur à cible autorisé ; validation enregistre et poursuit automatiquement le plan ; fermeture sans validation annule, n'enregistre rien, revient à l'étape sans progresser.

Modale Résultat de série (8937:35362) : saisie proposée zéro, minimum zéro, résultat supérieur à cible autorisé ; validation enregistre le réel et poursuit automatiquement le plan ; fermeture sans validation annule, n'enregistre rien, revient à l'étape sans progresser. Conditions exactes d'ouverture non arbitrées : À CLARIFIER.

## Répartition validée

### MVP

- cible À l’échec par Série dans les deux modes, terminée par Suivant ;
- Catalogue affichant `Exercices / Séances` ; `Séances` est actif dès T01 et `Exercices` devient actif dans le MVP avec T03 ; `Parcours` est absent du sélecteur ;
- carte d’Exercice à gouttière permanente au MVP, photo ou icône de nature, sans Déployer quel que soit le média (D-260/D-261) ; l’activation de cet affichage n’implique pas de nouveau mécanisme d’import ou de capture.
- nouvelle structure d’édition d’un Exercice : suppression du type, accès `Catégorie` et `Zones corporelles`, Mode déployé par défaut, paramètres `Séries / cible / Pause`, puis `Changement de côté / Pause entre les côtés / Durée de l’exercice` (libellé D-409), la Pause entre les côtés étant conditionnelle au changement de côté `Avec` (D-406) ;
- référentiels Étiquettes / Catégories / Zones corporelles administrables dans le MVP : toutes les valeurs, initiales comme personnalisées, sont supprimables par appui long puis confirmation ; création et renommage suivent les parcours propres à chaque référentiel ;
- modèle D-208 : `ActivityDefinition` porte seulement la Pause entre les côtés éventuelle ; une occurrence de Séance peut porter une récupération après exercice ajoutée explicitement, jamais créée automatiquement (D-304, D-307) ; positive, elle est exécutée après l’occurrence et exclue de la durée intrinsèque de l’Exercice.

### MVP — complément PRE-3 (D-333)

- import/ajout de `0..n` photos ou vidéos locales ordonnées, avant le moteur d’exécution ; la photothèque est la source déjà mentionnée dans la cible médias du 06/09. L’ancienne mention « capture ou photothèque » était portée en V2 : l’inclusion de la capture caméra dans PRE-3 reste À CLARIFIER, sans la déduire de la seule décision d’import.

### MVP — complément T03

- Catalogue et cycle de vie des Exercices de référence ;
- création, consultation et modification d’un Exercice persistant ;
- ajout dans une Séance par copie indépendante et sélection multiple ; pas d’action `Enregistrer dans mes exercices` dans la première livraison ;
- Exécution directe avec préparation fixe de `5 s`, Synthèse à Ressenti obligatoire, Suivi général et statistiques compatibles.

### MVP — complément paramètres d’exécution du 18/10/2026 (D-421)

- charge informative facultative, commune ou par série (RM-235 à RM-241) ;
- changement de côté Avec / Sans sans désignation anatomique, désignation côté 1 / côté 2 (RM-242 à RM-244) ;
- cadence à choix rapides (RM-245), Durée de l’exercice et repli des signaux (RM-246), chevrons intégrés (RM-247) ;
- Condition d’arrêt saisie ou dérivée, roulettes selon le type de série (RM-248 à RM-250) ;
- présentation de la feuille en quatre cadres (D-413).

Ces évolutions sont des cibles documentées du MVP ; aucune réalisation n’est déclarée.

## Champs et comportements des fonctionnalités — Suivi - Vue d'ensemble

### Règles liées à la couleur

- Les futurs indicateurs et graphiques peuvent utiliser la couleur enregistrée avec chaque exécution afin de faciliter l’identification des séances.

## Roadmap des tranches MVP après arbitrage

| Tranche | Périmètre |
|---|---|
| T01–T02 | Création, modification et Composition des Séances selon les contrats existants. |
| T03 | Catalogue des Exercices : liste, cycle de vie persistant, création contextuelle directe, sélection multiple, copie dans une Séance et Exécution directe complète. |
| T04 | Moteur d’Exécution des Séances, correspondant à l’ancienne T03 et à ses anciens lots 1 et 2. |
| T05 et suivantes | Ancienne T04 et tranches ultérieures, décalées d’un rang sans changement automatique de périmètre. |

## Tranche Bilatéralité et révision de T04

Une tranche spécifique précède l’Exécution T04. Elle livre la configuration et la persistance `UNILATERAL` / `RIGHT_LEFT` / `LEFT_RIGHT` au niveau Exercice, ainsi que la copie, la duplication, les calculs et les synthèses associés. Le support technique historique du côté au niveau Tour est conservé pour non-régression mais n’est pas exposé ni modifiable dans la version actuelle. Depuis D-406, ces valeurs se lisent comme le Changement de côté : `UNILATERAL` vaut `Sans`, `RIGHT_LEFT` et `LEFT_RIGHT` valent `Avec` (RM-244).

T04 développe ensuite le Plan d’Exécution par Séries, Tours et côtés portés par les Exercices, affiche le côté courant, pondère la progression globale, émet les annonces vocales de côté, réinitialise uniquement le passage courant et persiste des résultats séparés par côté.

## MVP T03 — Exercice directement exécutable

### Évolution validée MFN — à réaliser

La cible D-437 à D-440 comprend le mouvement partagé, la filiation systématique, les niveaux linéaires, la recherche de mouvements locaux, la correction partagée et le verrouillage des occurrences. Elle est validée fonctionnellement ; elle n’est pas déclarée livrée par les tranches existantes. Ordre de réalisation : modèle/initialisation sur base vierge, services et copie, éditeur et phases partagées, Catalogue/niveaux, propagation vers instantanés puis recette transverse.

Aucune migration de données antérieures n’est exigée. La réinitialisation est une opération ponctuelle de transition ; les données recréées survivent aux redémarrages. Hors périmètre : moteur et écran des records, mesures réalisées supplémentaires, fusion rétroactive, progression automatique et ramifiée. D-403 n’est pas rouvert. Référence : [règles MFN-01 à MFN-13](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#mouvement-filiation-et-niveaux).


La première version fonctionnelle du Catalogue des Exercices inclut l’exécution directe d’une référence persistante : action sur la carte, préparation fixe de `5 s`, moteur commun, Synthèse, Suivi général typé et statistiques compatibles. Cette capacité appartient désormais au MVP T03. Le MVP n’est donc plus centré exclusivement sur les Séances : un Exercice persistant valide constitue aussi une source exécutable.

## Évolution conçue — consultation média pendant l’Exécution

La consultation des médias pendant l’Exécution fait partie du MVP, conformément à la confirmation du 28/09/2026 (D-203, états `4997:6113` et `5009:6069`).

La cible comprend la bascule Information/Média, la galerie ordonnée, la vidéo avec son actif par défaut et baisse temporaire pendant les annonces vocales, le plein écran orientable et le cadre flottant d’Exécution.

Spécification de synthèse : `../CONCEPTION-EXECUTION-MEDIA.md`.

## Portée de la revue des cartes

Contenu identique à la section [« Références transverses des cartes et appuis »](06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md#références-transverses-des-cartes-et-appuis) : il n’est pas recopié ici.

## Consolidation avant planification

D-209 à D-218 décrivent la cible fonctionnelle à prendre en compte lors de la définition de la prochaine tranche. Leur inscription dans la documentation ne vaut pas inclusion automatique dans T03/T04 : le découpage de livraison sera arbitré après l’audit final. Les impacts de modèle de données à considérer en priorité sont les cardinalités Catégorie/Zones corporelles, le retrait logique des référentiels, le Circuit/Tours, les propriétés de récupération déjà définies par D-208. D-214 révisée le 12/10 retire le booléen des phases propres : aucune propriété de Séance n’est à créer pour leur activation.

## Paramètres d’exécution — complément

Contenu identique à la section [« Paramètres d’exécution — complément »](03%20%E2%80%93%20Parcours%20utilisateur.md#paramètres-dexécution--complément) : il n’est pas recopié ici.

## Évolution Cadence — statut

Cible documentée, non déclarée livrée : Bip de cadence 0..10 dans deux modes, ligne `Cadence` à choix rapides (`Autre`, `5 s`, `2 s`, `1 s`, `Sans` ; D-408, RM-245) et calculs selon [Résultats temporels et agrégation du circuit](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#résultats-temporels-et-agrégation-du-circuit). Dépendances : SeriesParameters, pauses explicites, migration, ordonnanceur audio périodique, snapshots et qualification mobile. L’écran de roulette est supprimé ; les cinq modales modifiées sont reprises ; les autres modes restent à compléter visuellement. Le layout d’exécution est conservé. Le guidage de cadence pendant l’Exécution appartient au MVP (D-378).

## Conception de planification

Contenu identique à la section [« Conception de planification »](03%20%E2%80%93%20Parcours%20utilisateur.md#conception-de-planification) : il n’est pas recopié ici.

<a id="formats-perimetre"></a>
## Formats — conception cible et livraison

Cette évolution documente les six formats et les départs rapides selon [Formats de séances — comportements consolidés](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#formats-de-séances--comportements-consolidés). Les six formats d’entraînement et les départs rapides appartiennent au MVP (D-378). Toute frame d’écran ou d’état sur la page Figma `Prototype MVP` appartient au périmètre fonctionnel MVP (D-426). Sa présence ne constitue en revanche pas une preuve de développement ou de livraison dans une tranche PRE-3/PRE-4. Le moteur n’est pas encore développé ; le lot courant est exclusivement documentaire. Les preuves et périmètres PRE-3/PRE-4 restent figés. Rapports, classement, charge additionnelle, tempo et entrée Pyramide ne sont pas ajoutés au périmètre.

## Utilisateur prioritaire du MVP

Le MVP s’adresse en priorité à une personne qui crée ses propres Séances et Exercices, planifie directement ses Séances **ou ses Exercices**, les exécute et consulte leur historique sur son appareil.

Il fonctionne :

- sans compte utilisateur obligatoire ;
- sans synchronisation entre appareils ;
- sans partage avec un professionnel ou un groupe ;
- uniquement en français à l’écran.

L’architecture textuelle repose néanmoins sur un lexique centralisé et des clés de traduction, afin de pouvoir modifier un terme partout dans l’application et ajouter ultérieurement d’autres langues sans réécrire les écrans.

## Périmètre fonctionnel du MVP — Catalogue des séances

Le `Catalogue des séances` est l’état par défaut de l’espace `Catalogues` après le splash et après une relance complète. Il permet d’ouvrir sa carte en modification, de la planifier, de la dupliquer ou de l’archiver. Une Séance active ne peut pas être supprimée directement : elle doit d’abord être archivée. Depuis la liste des Séances archivées, elle peut être restaurée ou supprimée après confirmation.

## Périmètre fonctionnel du MVP — Catalogue des exercices — T03

T03 rend le segment `Exercices` fonctionnel. Il permet de créer, consulter, modifier, archiver, restaurer et supprimer définitivement un Exercice persistant, de l’ajouter à une Séance par copie indépendante, de l’exécuter directement **et de la planifier directement** au même titre qu’une Séance. Le segment `Parcours` est absent du Catalogue et des sélecteurs de type de contenu au MVP.

Un Exercice créé uniquement dans une Séance ne rejoint pas automatiquement le Catalogue. Une Exécution directe d’Exercice utilise l’origine `ACTIVITY`, un instantané autonome et une préparation fixe de `5 s`, sans Séance artificielle ni `SESSION_END`.

## Périmètre fonctionnel du MVP — Planification et calendrier

Une Séance peut être planifiée une seule fois ou périodiquement. Le Calendrier propose les vues Jour, Semaine et Mois dans le MVP. Les rappels sont facultatifs. La demande d’autorisation système des notifications n’est déclenchée que lorsque l’utilisateur active pour la première fois un rappel pendant une planification.

## Périmètre fonctionnel du MVP — Profil et Préférences

Le Profil MVP permet de gérer une photo et un nom d’affichage. Les Préférences sont : Sons, Annonces vocales, Vibration, Compte à rebours initial, Fin de séance et Notifications.

Les Sons, les Annonces vocales et les Vibrations fonctionnelles sont indépendants. Le feedback haptique léger des roulettes numériques reste systématique dans le MVP et n’est pas piloté par le réglage `Vibration`.

## Cible fonctionnelle confirmée — Catalogue multi-type

Le Catalogue constitue l’accès central aux contenus. Il distingue `Exercices` et `Séances`. `Séances` est sélectionné par défaut à l’ouverture initiale et après relance complète ; `Exercices` est fonctionnel à partir de T03 ; `Parcours` est absent du sélecteur. L’ancien objet autonome Parcours est retiré (D-328).

## Cible fonctionnelle confirmée — Catalogue des exercices — MVP T03

La tranche MVP T03 apporte un Catalogue d’Exercices persistants. Le Catalogue des exercices permet de créer, consulter, modifier, archiver/restaurer et exécuter directement un Exercice de référence. Dès T03, depuis la Composition d’une Séance, l’utilisateur peut également sélectionner plusieurs Exercices existants ; chacun est copié dans la Séance et devient indépendante de sa référence.

Un Exercice créé uniquement dans une Séance ne rejoint pas automatiquement le Catalogue. Cette capacité locale reste conservée mais n’est pas exposée dans le parcours courant de composition, qui propose la sélection depuis le Catalogue. Dans le MVP, le média associé est affiché dans la gouttière permanente de la carte d’Exercice du Catalogue, sans déploiement ; cette règle n’ajoute pas implicitement de mécanisme d’import ou de capture (D-260/D-261).

L’Exécution directe réutilise le sous-ensemble moteur autonome avec une origine `ACTIVITY`, commence par une préparation standard de `5 s`, n’ajoute ni Séance artificielle ni phase `SESSION_END`, puis affiche une Synthèse avec Ressenti obligatoire. Le Suivi identifie cette Exécution comme un Exercice et applique les statistiques compatibles sans compter une Séance.

## Vision cible — médias pendant l’Exécution

Le MVP permet de consulter les médias de l’Exercice sans quitter l’Exécution ni interrompre son moteur. L’utilisateur peut retourner la zone d’information vers une face Média, parcourir une galerie ordonnée, lancer une vidéo à la demande et ouvrir le média en plein écran. Le plein écran conserve un cadre flottant de suivi et de commande de l’Exécution.

Cette consultation est incluse au MVP (D-203, confirmation du 28/09/2026). Voir `../CONCEPTION-EXECUTION-MEDIA.md`.

## Cadence facultative — cible documentaire

Le guidage de cadence pendant l’Exécution appartient au MVP (D-378). Les deux modes peuvent émettre un Bip de cadence, intervalle 0..10 s, 0 = Sans (ligne `Cadence`, RM-245), sans quatrième mode. Chronomètre croissant et signaux guident l’utilisateur ; Suivant conserve la fin normale de Série, même après la fin nominale. KODJO ne détecte pas les mouvements. Pour une cible À l’échec en Répétitions, le relevé facultatif peut être déclaré ; avec bip, une estimation est proposée et conservée tant qu’elle n’est pas explicitement confirmée ou corrigée. Référence : [Exécution d'une séance — Bip de cadence, progression et sécurité](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#exécution-dune-séance--bip-de-cadence-progression-et-sécurité).

<a id="formats-vision"></a>
## Formats et création rapide

Les six formats proposent des contraintes d’exécution, tandis que les six autres entrées accélèrent la création d’une séance libre. Les six formats et ces départs rapides appartiennent au MVP (D-378). L’utilisateur peut modifier les réglages autorisés du format après composition, sans modifier ses constantes ni changer son identité. Les calculs et synthèses suivent la configuration effective. Les rapports comparatifs, charge additionnelle et tempo restent hors de cette évolution.

## Périmètre du MVP

Le MVP permet notamment :
- créer, modifier, dupliquer, archiver, restaurer et supprimer définitivement des Séances selon leur cycle de vie ;
- créer, modifier et supprimer des Routines de planification ;
- créer et modifier des Exercices de Séance ;
- à partir de T03, gérer le cycle de vie complet des `ActivityDefinition` persistantes ;
- ajouter plusieurs Exercices existants à une Séance par copies indépendantes ;
- organiser les Exercices avant, dans ou après le Circuit et définir le nombre de Tours du Circuit ;
- composer des cycles visibles de circuits et d’exercices directs (D-451) ;
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

## Exécution — séance ou exercice — Lecture des variantes avec média

Les vues avec cercle et texte, bascule basse avec média, bascule haute avec texte ou média, et média plein écran appartiennent à cette même famille. Les règles de bascule, de lecture et de continuité de l’exécution sont définies dans [Médias pendant l’Exécution](../CONCEPTION-EXECUTION-MEDIA.md), décision D-203. **Périmètre MVP : les états média représentés sont inclus (D-203 corrigée dans #247), sans ajout implicite de parcours d’import.**

## Suivi — Séances — Filtres avancés

Dans le Suivi, les filtres avancés restent hors du MVP. Cette règle est distincte des filtres fonctionnels des Catalogues, qui sont actifs et contextuels.

## Suivi — Séances — Tri

La fonction de tri est reportée à une version ultérieure. La commande `Trier` reste visible mais désactivée. L’ordre d’affichage initial reste chronologique, du plus récent au plus ancien.

## Archives et références hors prototype actif — Objectif

Présenter à terme des indicateurs synthétiques de progression et d’exercice.

Cette vue n’est pas fonctionnelle dans le MVP.

## Archives et références hors prototype actif — Présence dans le MVP

La vue et ses graphiques sont abandonnés pour le MVP et seront conçus ultérieurement. Les anciennes maquettes de cette vue ne sont pas des écrans à développer ; aucune commande d’accès n’est requise par cette référence.

## Principes généraux — Évolutivité

Les comportements décrits au chapitre **08 – Conception fonctionnelle par fonctionnalité** correspondent au périmètre du MVP.

Les évolutions prévues pour les versions ultérieures sont décrites dans le présent chapitre et ne sont pas détaillées au chapitre 08, sauf lorsqu'elles sont nécessaires pour justifier un choix de conception du MVP.

## Catalogue des Exercices — cycle de vie d’un Exercice persistant — MVP T03 — Limite Parcours

**Ancienne cible autonome retirée le 08/10/2026.** Parcours est désormais le libellé d’un créneau à plusieurs contenus, sans identité, persistance, étapes ou exécution globale propres. Programme est un conteneur distinct ; Circuit reste interne à la Séance. Voir la [spécification de planification du 08/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification), y compris ses points ouverts ; aucune règle manquante ne se déduit des valeurs Figma.

<a id="combinaisons-formats"></a>
## Phrase de synthèse des paramètres — Combinaisons dont la règle reste à préciser

Les arbitrages explicitement traités sont clos. Cela ne vaut pas qualification exhaustive de toutes les combinaisons du futur moteur. Avant de déclarer un périmètre de réalisation prêt, les raccordements suivants doivent être démontrés dans les sources détaillées ou signalés comme incomplets :

- **Fenêtres et commandes générales :** portée de Pause/Reprendre, réinitialisation, points d’arrêt et reprise système face à la règle « fenêtre continue ». Cette règle décrit déjà la fin du travail ; elle ne suffit pas à décider silencieusement de supprimer les commandes générales ou de les laisser modifier les échéances.
- **Fenêtres et bilatéralité :** rattachement des côtés et de leurs pauses à la fenêtre commune. La formule EMOM validée ne doit pas recevoir un multiplicateur caché ; conserver une règle existante seulement si elle est compatible et démontrée.
- **Death by à plusieurs exercices :** la règle validée lie un tour acquis à une fenêtre accomplie ; le rang global, le changement d’exercice et l’incrément doivent être explicitement raccordés si le parcours autorise plusieurs exercices. L’exemple d’un exercice ne prouve pas ce raccordement.
- **Reconfiguration des comptes :** l’éditeur du Volume par tour doit conserver le lien entre nombre de tours et échelle ; l’EMOM « Par exercice » ne doit pas multiplier à la fois séries et tours. La représentation technique doit respecter les séquences et formules déjà décidées.

Ces points ne remettent pas en question les décisions consignées. Ils ne constituent pas des blocages démontrés ; leur effet éventuel se limite au comportement dont une règle manquerait réellement. S’ils ne se résolvent pas par les règles existantes, le dossier VNext doit conserver une clarification localisée, sans inventer de comportement.

## Planification des créneaux et de leurs contenus — Points ouverts, à consigner comme tels

1. **x : plafond ou résultat ?** Le premier stepper et le nombre de pastilles cochées expriment la même information ([Point ouvert à consigner comme tel](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#point-ouvert-à-consigner-comme-tel)).
2. **La rangée L M M J V S D sous les unités Jour et Mois** — masquée ou remplacée ([Les jours de la semaine](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#les-jours-de-la-semaine)).
3. **Les trois écrans du parcours Programme** : création, proposition de rattachement, avertissement hors période ([Ce qui reste à concevoir](04%20%E2%80%93%20Mod%C3%A8le%20fonctionnel.md#ce-qui-reste-à-concevoir)).
4. **La conversion `jusqu'au` ↔ `pendant`** dans les deux sens, quand l'utilisateur bascule le paramètre ([`jusqu'au` / `pendant` : un paramètre, pas un mot fixe](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#jusquau--pendant--un-paramètre-pas-un-mot-fixe)).
5. **Le décalage de 3 px du carré de Disclosure** dans les variantes `Cadre=Oui`, soit 196 instances annoncées par le brief (DSF général, § 8.1).

---

## Planification des créneaux et de leurs contenus — Limites de spécification à traiter avant développement

La borne hebdomadaire existante 1..12 et le calcul ancré sur la semaine contenant le début restent applicables à Semaine ; ils ne fixent pas automatiquement les bornes de Jour/Mois ou des steppersx/n. Les règles de fin de mois, l’ancrage précis du motif après édition/suppression, les résultats partiels d’un créneau à plusieurs contenus et l’effet de l’archivage d’un seul contenu nécessitent une spécification complémentaire. Les anciens traitements mono-source ne peuvent pas être généralisés implicitement à toute la liste.

Une fréquence valide doit décrire x positions parmi n ; le comportement d’interaction qui garantit cette cohérence reste le point ouvert 1. Ne pas inventer de sélection automatique après remise au gris. Pas d’unité Heure ; plusieurs heures par jour est une piste, pas une capacité livrée.

Le document Programme / Modèle de Programme V1.2 cité par le brief n’a pas été retrouvé dans le dépôt lu. Une recherche des fichiers a retrouvé la V1.1 du 18/09, mais pas la V1.2. La V1.1 ne suffit pas à attester les clauses V1.2 : son §29.2 porte sur la réalisation à date et son §32 prévoit encore le recalcul rétroactif ; ne pas les substituer au gel de l’échu annoncé par le nouveau brief. Le rattachement facultatif, la fenêtre bornant les dates et le gel des données échues sont les exigences explicitement fournies ; aucune autre clause de cette source n’est reconstituée de mémoire. Les trois écrans manquants restent à concevoir.
## Suivi et historique des séances — Filtres

Les filtres avancés du Suivi ne font pas partie du MVP. Ils sont reportés à une version ultérieure.


## Portée niveaux / recherche — relevé du 25/10

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
| C08 | Rattacher, détacher, supprimer : inclusion MVP à décider ultérieurement ; aucune exclusion décidée | Périmètre différé |
| C09 | Commande Niveau active hors crayon ; sélectionner un autre niveau ne reclasse pas le mouvement courant | Clos |



Référence : [spécification v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md). Les captures du 25/10 restent datées ; aucune nouvelle inspection ni correction de Figma n’est déclarée par cette mise à jour documentaire.


### Phases — clarification PHC-20261026

Les phases forment un motif cyclique de guidage : un passage complet correspond à une répétition guidée. Chaque phase conserve une durée en secondes. La somme des phases est la durée du motif, jamais la durée cible de la série. Les modes Durée et Répétitions, avec cible chiffrée ou À l’échec, sont compatibles ; seules les séries variables restent incompatibles avec les phases. [remplacé par D-446 du 26/10/2026 : les phases sont aussi compatibles avec les séries variables ; une seule séquence de phases et de durées, commune à toutes les séries] La condition d’arrêt appartient à la série. En Durée chiffrée, la cible indépendante termine la série à échéance, même au milieu d’une phase. À l’échec, le guidage boucle jusqu’à Suivant. En Répétitions chiffrées, R motifs donnent une durée nominale R × somme des phases ; Suivant conserve la validation manuelle existante. Chaque nouvelle série recommence à la première phase. Les cycles guidés ne prouvent pas les répétitions effectivement réalisées.

Modifier, ajouter ou supprimer une phase ne réécrit pas la cible de série. Toutes les durées de phase sont éditables, y compris sous un format à durée imposée : aucune dernière phase calculée, aucune adaptation proportionnelle pour faire tenir le motif dans la série. Une durée manquante reste à renseigner ; ne pas inventer une durée depuis l’objectif de série. Les bornes existantes des phases restent des bornes du motif, indépendantes de celles de la cible. Le retrait 2 → 1 conserve le passage à Sans mais ne remplace plus la cible par la durée restante. Sans phases conserve également la cible existante.

Référence normative : [PHC-20261026](../KODJO-Phases-Guidage-Cyclique-2026-10-26.md). La règle Répétitions sans bip = non calculable concerne désormais les exercices sans phases : avec phases, R × durée du motif donne une estimation nominale, jamais une mesure. Arrêt mixte et guidage après objectif avant Suivant restent les deux points distincts décrits dans cette référence. [clos par D-446 du 26/10/2026 : l’arrêt mixte se représente par les séries variables, avec phases ; en Répétitions chiffrées, le motif continue de boucler, sans signal, entre la cible et Suivant] Les anciennes captures sont des preuves datées ; alignement Figma et code non revendiqué.
