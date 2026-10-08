## V1 – KODJO MVP : séance structurée et exécution locale

> Mise à jour du 24 septembre 2026 : Étiquette = classification/couleur de Séance ; Catégorie = classification/couleur d’Exercice ; Point d’arrêt ; Compte à rebours et Fin propres à l’Exercice ; changement de côté non exposé au niveau Tour ; roulettes en modale basse ; média en gouttière permanente dans le Catalogue des Exercices depuis D-260/D-261 du03/10/2026.

### Objectif

Permettre à un utilisateur de créer des Séances structurées et des Exercices persistants, **planifier directement l’un ou l’autre**, les exécuter en étant guidé et conserver un historique local, sans compte utilisateur ni synchronisation.

### Fonctionnalités

- créer, modifier, dupliquer et archiver une Séance ; supprimer une Séance uniquement depuis les archives ;
- créer des Exercices sans sélection de type ;
- définir pour chaque exercice :
  - un nom ;
  - une consigne ;
  - une durée, un nombre de répétitions ou le mode À l’échec ;
  - un nombre de Séries propre à l'Exercice ;
- Pi est stockée et exécutée après chaque Série, dernière comprise. À la frontière des côtés successifs, PN puis PC se cumulent. Par paire, Pi suit chaque paire, dernière comprise, et PC reste dans chaque paire. Seule la toute dernière Pause est remplacée par la récupération positive qui suit l’occurrence ; aucune récupération en direct. N=1 normalisé uniforme/par côté. Formules et séquences : Bip v2§3 et paramètres v13§§4–5.
  - une Pause entre les côtés éventuelle, uniquement pour un Exercice bilatéral ;
  - en mode Durée, une Durée totale calculée et dépendante du nombre de Séries ;
- afficher dans le MVP la vignette média associée à l’Exercice ; aucun Déployer avec ou sans média (D-261) ; l’import/ajout et la persistance de `0..n` photos ou vidéos locales ordonnées sont inclus au MVP dans PRE-3 par D-333 ;
- ordonner les exercices d’un Tour ;
- utiliser un Cycle technique unique, toujours fixé à une répétition et jamais affiché ;
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
- terminer normalement chaque Série d’un Exercice en Répétitions ou À l’échec avec `Suivant`, ou passer manuellement à l’Exercice suivante ;
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
- calculer distinctement la Durée estimée d’exécution du Plan complet et la Durée synthétique des Exercices affichée dans le Catalogue et la Composition ;
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
 - plusieurs Tours ordonnés dans un même Cycle ;
 - un nombre de répétitions propre à chaque Cycle et à chaque Tour.
 
 Cette évolution ne rend pas les Cycles, Tours ou copies `SessionActivity` réutilisables entre plusieurs Séances. Le Catalogue des Exercices du MVP T03 permet séparément de copier une `ActivityDefinition` autonome dans plusieurs Séances ; chaque copie devient ensuite indépendante.

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

## Répartition validée — 6 septembre 2026

### MVP

- troisième mode d’Exercice `À l’échec`, exécuté comme le mode Répétitions avec `Suivant` ;
- Catalogue affichant `Exercices / Séances` ; `Séances` est actif dès T01 et `Exercices` devient actif dans le MVP avec T03 ; `Parcours` est absent du sélecteur ;
- carte d’Exercice à gouttière permanente au MVP, photo ou icône de nature, sans Déployer quel que soit le média (D-260/D-261) ; l’activation de cet affichage n’implique pas de nouveau mécanisme d’import ou de capture.
- nouvelle structure d’édition d’un Exercice : suppression du type, accès `Catégorie` et `Zones corporelles`, Mode déployé par défaut, paramètres `Séries / cible / Pause`, puis `Changement de côté / Pause entre les côtés / Durée totale`, la Pause entre les côtés étant conditionnelle à `D→G/G→D` ;
- référentiels Étiquettes / Catégories / Zones corporelles administrables dans le MVP : toutes les valeurs, initiales comme personnalisées, sont supprimables par appui long puis confirmation ; création et renommage suivent les parcours propres à chaque référentiel ;
- modèle D-208 : `ActivityDefinition` porte seulement la Pause entre les côtés éventuelle ; chaque occurrence de Séance porte sa récupération après exercice, y compris à `0 s`, exécutée après l’occurrence et exclue de la durée intrinsèque de l’Exercice.

### MVP — complément PRE-3 (D-333)

- import/ajout de `0..n` photos ou vidéos locales ordonnées, avant le moteur d’exécution ; la photothèque est la source déjà mentionnée dans la cible médias du 06/09. L’ancienne mention « capture ou photothèque » était portée en V2 : l’inclusion de la capture caméra dans PRE-3 reste À CLARIFIER, sans la déduire de la seule décision d’import.

### MVP — complément T03

- Catalogue et cycle de vie des Exercices de référence ;
- création, consultation et modification d’un Exercice persistante ;
- ajout dans une Séance par copie indépendante et sélection multiple ; pas d’action `Enregistrer dans mes exercices` dans la première livraison ;
- Exécution directe avec préparation fixe de `5 s`, Synthèse à Ressenti obligatoire, Suivi général et statistiques compatibles.

### V2

- Ancienne cible de Parcours autonome retirée par D-328 ; voir la planification multi-contenus du 08/10.
- Ancienne transition de Parcours autonome retirée avec D-119/D-328 ; l’enchaînement multi-contenus reste à spécifier.

### V3

- Ancienne cible de Parcours autonome retirée par D-328 ; voir la planification multi-contenus du 08/10.

## Roadmap des tranches MVP après arbitrage du 14 septembre 2026

| Tranche | Périmètre |
|---|---|
| T01–T02 | Création, modification et Composition des Séances selon les contrats existants. |
| T03 | Catalogue des Exercices : liste, cycle de vie persistant, création contextuelle directe, sélection multiple, copie dans une Séance et Exécution directe complète. |
| T04 | Moteur d’Exécution des Séances, correspondant à l’ancienne T03 et à ses anciens lots 1 et 2. |
| T05 et suivantes | Ancienne T04 et tranches ultérieures, décalées d’un rang sans changement automatique de périmètre. |

## Tranche Bilatéralité et révision de T04

Une tranche spécifique précède l’Exécution T04. Elle livre la configuration et la persistance `UNILATERAL` / `RIGHT_LEFT` / `LEFT_RIGHT` au niveau Exercice, ainsi que la copie, la duplication, les calculs et les synthèses associés. Le support technique historique du côté au niveau Tour est conservé pour non-régression mais n’est pas exposé ni modifiable dans la version actuelle.

T04 développe ensuite le Plan d’Exécution par Séries, Tours et côtés portés par les Exercices, affiche le côté courant, pondère la progression globale, émet les annonces vocales de côté, réinitialise uniquement le passage courant et persiste des résultats séparés par côté.

## MVP T03 — Exercice directement exécutable

La première version fonctionnelle du Catalogue des Exercices inclut l’exécution directe d’une référence persistante : action sur la carte, préparation fixe de `5 s`, moteur commun, Synthèse, Suivi général typé et statistiques compatibles. Cette capacité appartient désormais au MVP T03. Le MVP n’est donc plus centré exclusivement sur les Séances : un Exercice persistante valide constitue aussi une source exécutable.

### Précision MVP T03 — Carte d’Exercice et vignette média

Dans le Catalogue des Exercices, l’appui sur la carte ouvre la consultation ou la modification et le bouton Lecture lance l’Exécution directe. L’état Photo affiche la vignette sans contrôle Déployer et sans agrandissement dû à la seule photo (D-238). L’acquisition/import n’est pas activé par cette règle.

## Évolution conçue — consultation média pendant l’Exécution

La consultation des médias pendant l’Exécution fait partie du MVP, conformément à la confirmation du 28/09/2026 (D-203, états `4997:6113` et `5009:6069`).

La cible comprend la bascule Information/Média, la galerie ordonnée, la vidéo avec son actif par défaut et baisse temporaire pendant les annonces vocales, le plein écran orientable et le cadre flottant d’Exécution.

Spécification de synthèse : `../CONCEPTION-EXECUTION-MEDIA.md`.

## Portée de la revue des cartes — 30 septembre 2026

Décisions finales du propriétaire : les 17 points du 30/09 sont clos. Révision des cartes du 03/10/2026 (D-260 à D-264) : un seul format de carte d’Exercice, avec une gouttière permanente de 64 px dans le Catalogue et les listes de sélection d’exercices ; photo si média associé, icône de nature sinon. La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture (D-264). Les Séances ne portent jamais de visuel. Aucune photo dans les listes mixtes, le Calendrier ou le Suivi. Aucun déploiement d’Exercice ni de carte du Suivi ; le déploiement des Séances reste accessible dans le Catalogue et le Calendrier Semaine. Le Suivi présente deux lignes : nature/titre/statut, puis durée/catégorie/ressenti ; sans heure, zones corporelles ni étiquettes. Le Ressenti y est un indicateur sans action, distinct de sa saisie obligatoire en Synthèse. Les variantes déployées d’Exercice et du Suivi sont historiques, hors MVP. Pauses/récupérations et prochaine planification restent absentes des cartes concernées. Les données, instantanés, calculs et fonctions de planification sont conservés.

Synthèses : « N séries de X », « N séries de N rép. », « N séries à l’échec » ; bilatéralité par miroir dans les variantes concernées. Heure Semaine « 08:00 » ; aucune heure dans la carte du Suivi. Séance sans étiquette : catégories de ses exercices ; listes de catégories/zones séparées par un point médian et tronquées avec « … ». Choix sans badge durée ; récurrence du Calendrier Semaine dans la carte déployée seulement.

RG-10 : le Profil porte une préférence silhouette facultative, homme/femme ; absence = homme affiché. Elle ne pilote que l’icône de zone corporelle, sans filtre, recherche ou effet métier. RG-11 à RG-13 : vignette 64 centrée et recadrée sans déformation (couverture pour une vidéo), place réservée pendant chargement/erreur, texte alternatif égal au nom de l’exercice.

D-239 : Calendrier Jour est une exception compacte (séance 298 × 46, exercice 298 × 48, x=80, hauteur d’instance adaptée à l’événement), avec barre colorée 4, nature 26, titre 13 gras, heure/durée 11, lecture 26 et aucun Déployer. Les deux sets comportent 10 variantes chacun. Suivi — Vue d’ensemble est hors MVP. Les boutons Calendrier Aujourd’hui/Planifier restent à 32, sans cible 44 ajoutée : situation acceptée, à revoir et développer après T04. Les nouvelles icônes sont nommées icon/<nom>, les anciennes ne sont pas renommées ; target est réservé au Programme, pulse aux rapports/Suivi.

Référence normative ciblée : [DSF — Cartes, icônes et appuis](../DSF-CARTES-ICONES-APPUIS-2026-09-30.md). Ces règles finales prévalent sur les anciennes formulations d’affichage du présent chapitre dans ce périmètre uniquement.

## Consolidation avant planification — 26 septembre 2026

D-209 à D-218 décrivent la cible fonctionnelle à prendre en compte lors de la définition de la prochaine tranche. Leur inscription dans la documentation ne vaut pas inclusion automatique dans T03/T04 : le découpage de livraison sera arbitré après l’audit final. Les impacts de modèle de données à considérer en priorité sont les cardinalités Catégorie/Zones corporelles, le retrait logique des référentiels, le Circuit/Tours, le booléen global de Séance pour les phases propres aux Exercices et les propriétés de récupération déjà définies par D-208.


## Clôture Figma / DSF — 28 septembre 2026

D-221 : le MVP n’inclut aucune recherche globale ni recherche locale dans les Catalogues. Les écrans de recherche globale sont archivés ; la recherche pourra être reconçue dans une version ultérieure. La navigation active reste limitée à `Catalogues`, `Calendrier`, `Suivi`, `Profil`. Les règles D-222 à D-230 précisent les comportements de sélection/planification et les contraintes DSF sans étendre le périmètre fonctionnel du MVP.


## Paramètres d’exécution — complément du02/10/2026

Le parcours existant permet maintenant des Séries variables dans la même feuille de paramètres, avec un mode commun et des cibles/Pauses par Série. La direction et l’Ordre des côtés sont indépendants. L’utilisateur peut choisir Un côté après l’autre ou Les deux côtés à chaque série ; N=1 est normalisé au premier ordre et au mode uniforme. Aucun nouveau parcours ni shell. Référence normative : [v13](SPECIFICATION-PARAMETRES-MODALE-v13.md), CE-T03-04 et CE-UI-10.

## Évolution Cadence — statut au06/10/2026

Cible documentée, non déclarée livrée : Bip de cadence0..10 dans trois modes, steppers et calculs Bip v2. Dépendances : SeriesParameters, pauses explicites, migration, ordonnanceur audio périodique, snapshots et qualification mobile. L’écran de roulette est supprimé ; les cinq modales modifiées sont reprises ; les autres modes restent à compléter visuellement. Le layout d’exécution est conservé.



## Conception de planification du 08/10/2026

Choisir une ou plusieurs Séances/Exercices par cases → Ajouter n éléments → Programme facultatif, Début, Répétition, contenus ordonnés si plusieurs, Rappel → Enregistrer. Chaque contenu filtre les occurrences du créneau par son motif x fois sur n. Les modalités ouvertes ne sont pas considérées livrées. Voir la [spécification](SPECIFICATION-PLANIFICATION-2026-10-08.md), les contrats CE-UI-04/05/11 et le [DSF général](../DSF-INTERFACE-GENERALE-2026-10-08.md).
