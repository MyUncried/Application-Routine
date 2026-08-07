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
  - une photo ou une vidéo ;
- définir une pause facultative après un exercice ou créer une activité de type Récupération ;
- ordonner les activités d’un bloc ;
- configurer des cycles et leurs blocs, créés avec une répétition par défaut ;
- placer des activités de récupération dans un bloc, en fin de cycle ou en fin de séance ;
- exécuter immédiatement une séance ;
- guider l’utilisateur visuellement et sonorement pendant l’exécution ;
- annoncer vocalement le nom de chaque exercice, pause ou récupération au moment où l’étape commence ;
- émettre un bip grave à chaque seconde pendant les exercices chronométrés ;
- ne pas émettre de bip de rythme pendant les pauses et les récupérations ;
- émettre un bip aigu pendant chacune des trois dernières secondes de toute étape chronométrée ;
- remplacer, pendant les trois dernières secondes d’un exercice, le bip grave par le bip aigu ;
- passer automatiquement à l’étape suivante à la fin d’une étape chronométrée ;
- permettre d’activer ou de désactiver séparément :
    - les bips de rythme ;
    - le compte à rebours sonore ;
    - les annonces vocales ;
- afficher clairement l’exercice, la pause ou la récupération en cours, l’étape suivante et la progression dans la séance ;
- utiliser une minuterie pour les exercices définis par une durée ;
- mettre la séance en pause et la reprendre ;
- maintenir, dans la mesure permise par le système d’exploitation, le guidage sonore lorsque l’écran est verrouillé ou que l’application fonctionne en arrière-plan ;
- terminer ou ignorer un exercice ;
- afficher le bloc et le cycle en cours ;
- interrompre ou terminer une séance ;
- enregistrer localement :
  - la date de la séance ;
  - sa durée ;
  - son statut ;
  - les exercices terminés ou ignorés ;
  - les cycles réalisés ;
  - la version de la séance ;
  - la routine éventuelle ;
- consulter un historique simple des séances ;
- renseigner facultativement, en fin de séance :
	- un ressenti général ;
	- une douleur ou une gêne ;
	- une note libre ;
- retrouver ces informations dans le détail de la séance.

Dans cette version, l’échauffement, les séries de fin de cycle et les séries de fin de routine utilisent des séries ordinaires. `Retour au calme` n’est pas un type structurel particulier.

Le guidage sonore doit, dans la mesure permise par le système d’exploitation, continuer lorsque l’écran est verrouillé ou que l’application fonctionne en arrière-plan.

Toutes les données sont enregistrées uniquement sur l’appareil.

La V1 permet également :
- de créer une routine ;
- d'associer une séance à une routine ;
- de définir une planification unique ou récurrente ;
- d'ajouter un ou plusieurs rappels.

Le modèle de données de la V1 repose sur la hiérarchie Séance → Cycle → Bloc → Activité.

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

#### Internationalisation

- interface multilingue ;
- gestion des langues ;
- contenus traduisibles.

---

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

