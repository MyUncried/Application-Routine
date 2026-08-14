## V1 – Routine structurée et exécution locale

### Objectif

Permettre à un utilisateur de créer une séance structurée, la planifier si nécessaire, l’exécuter en étant guidé et conserver un historique local, sans compte utilisateur ni synchronisation.

### Fonctionnalités

- créer, modifier, dupliquer et supprimer une séance ;
- créer des activités de type Exercice ou Récupération ;
- définir pour chaque exercice :
  - un nom ;
  - une consigne ;
  - une durée ou un nombre de répétitions ;
  - un nombre de Séries propre à l'Exercice ;
  - une pause éventuelle appliquée après chaque Série ;
  - une photo ou une vidéo ;
- ordonner les activités d’un Set ;
- configurer des cycles et leurs Sets, créés avec une répétition par défaut ;
- placer des Activités avant le Cycle, dans le Set, après le Set et dans le Cycle, ou après le Cycle et avant la Fin de séance ;
- exécuter immédiatement une séance ;
- guider l’utilisateur visuellement et sonorement pendant l’exécution ;
- annoncer vocalement le nom de chaque activité au moment où elle commence ; pour une Récupération générée par une pause après Série, l’annonce peut utiliser le libellé « Pause » ;
- émettre un bip grave à chaque seconde pendant les exercices chronométrés ;
- ne pas émettre de bip de rythme pendant les activités de type Récupération, qu’elles aient été ajoutées explicitement ou générées par une pause après Série ;
- émettre un bip aigu pendant chacune des trois dernières secondes de toute étape chronométrée ;
- remplacer, pendant les trois dernières secondes d’un exercice, le bip grave par le bip aigu ;
- passer automatiquement à l’étape suivante à la fin d’une étape chronométrée ;
- permettre d’activer ou de désactiver globalement les sons de l’application ; dans le MVP, ce réglage agit sur l’ensemble des bips sonores et ne permet pas de désactiver séparément le bip grave de rythme ;
- permettre d’activer ou de désactiver séparément les annonces vocales ;
- afficher clairement l’activité en cours, son type ou son libellé, l’étape suivante et la progression dans la séance ;
- utiliser une minuterie pour les exercices définis par une durée ;
- mettre la séance en pause et la reprendre ;
- maintenir, dans la mesure permise par le système d’exploitation, le guidage sonore lorsque l’écran est verrouillé ou que l’application fonctionne en arrière-plan ;
- terminer normalement un Exercice en Répétition ou passer manuellement à l’Activité suivante ;
- afficher le Set et le cycle en cours ;
- interrompre ou terminer une séance ;
- enregistrer localement :
  - la date de la séance ;
  - sa durée ;
  - son statut ;
  - les Activités terminées, Partielles ou interrompues ;
  - les cycles réalisés ;
  - la version de la séance ;
  - la routine éventuelle ;
- consulter un historique simple des séances ;
- renseigner obligatoirement, en fin de séance, un ressenti général ;
- renseigner facultativement un Commentaire de **200 caractères maximum** ;
- retrouver les Exécutions enregistrées sous forme de cartes condensées ou déployées individuellement dans le Suivi, avec recherche et tri chronologique du plus récent au plus ancien ou inversement.

Dans cette version, l’échauffement, les activités de fin de cycle et les activités de fin de séance utilisent des Activités ordinaires. `Retour au calme` n’est pas un type structurel particulier.

Le guidage sonore doit, dans la mesure permise par le système d’exploitation, continuer lorsque l’écran est verrouillé ou que l’application fonctionne en arrière-plan.

Toutes les données sont enregistrées uniquement sur l’appareil.

La V1 permet également :
- de créer une routine ;
- d'associer une séance à une routine ;
- de définir une planification `Sans répétition` ou `Périodique` ; dans le MVP, le mode Périodique utilise une périodicité hebdomadaire jusqu'à une date de fin ;
- d'ajouter un rappel facultatif (0 ou 1 rappel par Routine).

Le modèle de données de la V1 repose sur la hiérarchie Séance → Cycle → Set → Activité.

---

## V2 – Réutilisation avancée des séances

### Objectif

Enrichir rapidement la construction et l’exécution des routines, sans modifier encore le principe d’une application locale utilisée par une seule personne.

### Fonctionnalités

- intégrer une séance existante dans une autre séance ;
- conserver le nom et le regroupement visuel d’une séance intégrée ;
- copier son contenu afin qu’il devienne indépendant de la séance source ;
- développer, replier et modifier une séance intégrée ;
- enrichir les structures d’échauffement et de fin de séance si les tests montrent ce besoin ;
- calculer la durée estimée des structures complexes ;
- afficher la progression dans les structures et séances intégrées ;
- enregistrer les structures imbriquées et les éléments réellement effectués.
- ajouter des filtres avancés du Suivi (catégories, zones corporelles, période, statut) et, si utile, des critères de tri supplémentaires.
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
 - plusieurs Sets ordonnés dans un même Cycle ;
 - un nombre de répétitions propre à chaque Cycle et à chaque Set.
 
 Cette évolution ne rend pas les Cycles, Sets ou Activités réutilisables entre plusieurs Séances. Chaque élément reste propre à la Séance dans laquelle il a été créé.

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

