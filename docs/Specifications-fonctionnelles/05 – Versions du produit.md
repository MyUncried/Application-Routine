## V1 – KODJO MVP : séance structurée et exécution locale

### Objectif

Permettre à un utilisateur de créer une séance structurée, la planifier si nécessaire, l’exécuter en étant guidé et conserver un historique local, sans compte utilisateur ni synchronisation.

### Fonctionnalités

- créer, modifier, dupliquer et archiver une Séance ; supprimer une Séance uniquement depuis les archives ;
- créer des Activités sans sélection de type ;
- définir pour chaque exercice :
  - un nom ;
  - une consigne ;
  - une durée, un nombre de répétitions ou le mode À l’échec ;
  - un nombre de Séries propre à l'Exercice ;
  - une Pause éventuelle appliquée uniquement entre les Séries ;
  - une Récupération éventuelle exécutée après tous les côtés d’une Activité autonome ou après chaque passage de Tour bilatéral ;
  - en mode Durée, une Durée totale calculée et dépendante du nombre de Séries ;
- ne pas associer de média à une Activité dans le MVP ; afficher l’action désactivée et préparer `0..n` médias ordonnés en V2 ;
- ordonner les activités d’un Tour ;
- utiliser un Cycle technique unique, toujours fixé à une répétition et jamais affiché ;
- ordonner les Activités dans le Tour visible, dont le nombre de répétitions est compris entre 1 et 99 ;
- exécuter immédiatement une séance ;
- guider l’utilisateur visuellement et sonorement pendant l’exécution ;
- annoncer vocalement le nom de chaque Activité au moment où elle commence et `Récupération` au démarrage de sa phase de Récupération éventuelle ;
- émettre un bip grave à chaque seconde pendant les exercices chronométrés ;
- ne pas émettre de bip de rythme pendant les Pauses entre Séries ni pendant la phase de Récupération après l’Activité ;
- émettre un bip aigu pendant chacune des trois dernières secondes de toute étape chronométrée ;
- remplacer, pendant les trois dernières secondes d’un exercice, le bip grave par le bip aigu ;
- passer automatiquement à l’étape suivante à la fin d’une étape chronométrée ;
- permettre d’activer ou de désactiver globalement les sons de l’application ; dans le MVP, ce réglage agit sur l’ensemble des bips sonores et ne permet pas de désactiver séparément le bip grave de rythme ;
- permettre d’activer ou de désactiver séparément les annonces vocales ;
- afficher clairement l’activité en cours, son type ou son libellé, l’étape suivante et la progression dans la séance ;
- utiliser une minuterie pour les exercices définis par une durée ;
- mettre la séance en pause et la reprendre ;
- maintenir, dans la mesure permise par le système d’exploitation, le guidage sonore lorsque l’écran est verrouillé ou que l’application fonctionne en arrière-plan ;
- terminer normalement chaque Série d’un Exercice en Répétitions ou À l’échec avec `Suivant`, ou passer manuellement à l’Activité suivante ;
- afficher la Série et le Tour en cours, sans afficher le Cycle ;
- interrompre ou terminer une séance ;
- enregistrer localement :
  - la date de la séance ;
  - sa durée ;
  - son statut ;
  - les Activités terminées, Partielles ou interrompues ;
  - les Tours et Activités réalisés ;
  - la version de la séance ;
  - la routine éventuelle ;
- consulter un historique simple des séances ;
- renseigner obligatoirement, en fin de séance, un ressenti général ;
- renseigner facultativement un Commentaire de **200 caractères maximum** ;
- retrouver les Exécutions enregistrées sous forme de cartes condensées ou déployées individuellement dans le Suivi ; afficher `Vue d’ensemble`, `Filtrer` et `Trier` comme commandes désactivées.

Dans cette version, l’échauffement et le retour au calme utilisent des Activités ordinaires, placées selon le besoin avant le Tour, dans le Tour ou après le Tour. `Retour au calme` n’est pas un type structurel particulier.

Le guidage sonore doit, dans la mesure permise par le système d’exploitation, continuer lorsque l’écran est verrouillé ou que l’application fonctionne en arrière-plan.

Toutes les données sont enregistrées uniquement sur l’appareil.

La V1 permet également :
- de créer une routine ;
- d'associer une séance à une routine ;
- de définir une planification `Aucune` ou `Périodique` ; dans le MVP, le mode Périodique utilise une périodicité hebdomadaire jusqu'à une date de fin ;
- d'ajouter un rappel facultatif (0 ou 1 rappel par Routine).

Le modèle de données de la V1 repose sur la hiérarchie Séance → Cycle → Tour → Activité.

---

## MVP bis – Compléments immédiats

- permettre de supprimer une Catégorie personnalisée créée par erreur depuis la gestion dédiée ; cette action n’est pas disponible dans l’interface S09 de sélection des Catégories.

## V2 – Réutilisation avancée des séances

### Objectif

Enrichir rapidement la construction et l’exécution des routines, sans modifier encore le principe d’une application locale utilisée par une seule personne.

### Fonctionnalités

- intégrer une séance existante dans une autre séance ;
- conserver le nom et le regroupement visuel d’une séance intégrée ;
- copier son contenu afin qu’il devienne indépendant de la séance source ;
- développer, replier et modifier une séance intégrée ;
- enrichir les structures d’échauffement et de fin de séance si les tests montrent ce besoin ;
- calculer distinctement la Durée estimée d’exécution du Plan complet et la Durée synthétique des Activités affichée dans le Catalogue et la Composition ;
- afficher la progression dans les structures et séances intégrées ;
- enregistrer les structures imbriquées et les éléments réellement effectués.
- ajouter des filtres avancés du Suivi (catégories, zones corporelles, période, statut) et, si utile, des critères de tri supplémentaires.
- ajouter la Vue d’ensemble analytique et activer les commandes `Filtrer` et `Trier` déjà visibles dans le MVP ;
- permettre l’association de `0..n` photos ou vidéos ordonnées par Activité ;
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
 
 Cette évolution ne rend pas les Cycles, Tours ou copies `SessionActivity` réutilisables entre plusieurs Séances. La bibliothèque V2 permet séparément de copier une `ActivityDefinition` autonome dans plusieurs Séances ; chaque copie devient ensuite indépendante.

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
- aide à la création d'activités ;


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
- Gestion des routines de planification.

## Répartition validée — 6 septembre 2026

### MVP

- troisième mode d’Exercice `À l’échec`, exécuté comme le mode Répétitions avec `Suivant` ;
- Catalogue affichant `Activités / Séances / Circuits` ; `Séances` est actif dès T01 et `Activités` devient actif dans le MVP avec T03 ; `Circuits` reste visible mais désactivé ;
- bouton `+ Ajouter un média` visible mais désactivé ; section Médias masquée.
- nouvelle structure d’édition d’une Activité : suppression du type, sections repliables Description et Zone corporelle, Mode déployé par défaut, paramètres `Séries / cible / Pause`, puis `Côté / Récupération / Durée totale`, synthèse fixe et action `Terminer` ;
- modèle et calculs de Récupération après l’Activité préparés avant T04.

### MVP — complément T03

- Catalogue et cycle de vie des Activités de référence ;
- création, consultation et modification d’une Activité persistante ;
- ajout dans une Séance par copie indépendante et sélection multiple ; pas d’action `Enregistrer dans mes activités` dans la première livraison ;
- Exécution directe avec préparation fixe de `5 s`, Synthèse à Ressenti obligatoire, Suivi général et statistiques compatibles.

### V2

- `0..n` photos ou vidéos ordonnées, ajoutées par capture ou photothèque, stockées localement et lisibles manuellement ;
- création, modification, archivage, suppression et exécution manuelle des Circuits ;
- écran de transition obligatoire entre Séances, manuel ou automatique avec durée globale de `30 s` par défaut.

### V3

- planification, récurrences, calendrier, rappels et notifications des Circuits.

## Roadmap des tranches MVP après arbitrage du 14 septembre 2026

| Tranche | Périmètre |
|---|---|
| T01–T02 | Création, modification et Composition des Séances selon les contrats existants. |
| T03 | Catalogue des Activités : liste, cycle de vie persistant, arbre de création, sélection multiple, copie dans une Séance et Exécution directe complète. |
| T04 | Moteur d’Exécution des Séances, correspondant à l’ancienne T03 et à ses anciens lots 1 et 2. |
| T05 et suivantes | Ancienne T04 et tranches ultérieures, décalées d’un rang sans changement automatique de périmètre. |

## Tranche Bilatéralité et révision de T04

Une tranche spécifique précède l’Exécution T04. Elle livre la configuration et la persistance `UNILATERAL` / `RIGHT_LEFT` / `LEFT_RIGHT`, la copie et la duplication, les calculs, les synthèses, les contrôles Activité et Tour, la confirmation conditionnelle d’activation d’un Tour et la résolution propre/effective. Elle n’exécute encore aucun passage.

T04 est ensuite révisée pour développer le Plan d’Exécution par Séries, Tours et côtés, afficher le sous-titre du côté courant, pondérer la progression globale, émettre les annonces vocales de côté, réinitialiser uniquement le passage courant et persister des résultats séparés par côté. Les anciennes exclusions d’une Série unique ou d’un Tour unique sont supprimées des contrats T04.

## MVP T03 — Activité directement exécutable

La première version fonctionnelle du Catalogue des Activités inclut l’exécution directe d’une référence persistante : action sur la carte, préparation fixe de `5 s`, moteur commun, Synthèse, Suivi général typé et statistiques compatibles. Cette capacité appartient désormais au MVP T03. Le MVP n’est donc plus centré exclusivement sur les Séances : une Activité persistante valide constitue aussi une source exécutable.

### Précision MVP T03 — Carte d’Activité ; médias hors périmètre

Dans le Catalogue des Activités, l’appui sur la carte ouvre la consultation ou la modification et le bouton Lecture lance l’Exécution directe. Le contrôle `Déployer` est absent de l’état courant. Sa réintroduction éventuelle pour afficher les médias est une évolution post-MVP distincte, à détailler avec les comportements média.
