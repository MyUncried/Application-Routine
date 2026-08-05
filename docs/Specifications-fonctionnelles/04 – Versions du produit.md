## V1 – Routine structurée et exécution locale

### Objectif

Permettre à un utilisateur de créer une routine structurée, de l’exécuter en étant guidé et de conserver un historique minimal, sans compte utilisateur ni synchronisation.

### Fonctionnalités

- créer, modifier, dupliquer et supprimer une routine simple ;
- créer des exercices ou des étapes ;
- définir pour chaque exercice :
  - un nom ;
  - une consigne ;
  - une durée ou un nombre de répétitions ;
  - une photo ou une vidéo ;
- ajouter des pauses entre les exercices ;
- ordonner et réorganiser les éléments d’une routine ;
- configurer des séries et des cycles, égaux à 1 par défaut ;
- placer explicitement les pauses et récupérations dans le série, le cycle ou la fin de routine ;
- lancer immédiatement une routine ;
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
- afficher la série, le série et le cycle en cours lorsqu’ils sont utilisés ;
- interrompre ou terminer une séance ;
- enregistrer localement :
  - la date de la séance ;
  - sa durée ;
  - son statut ;
  - les exercices terminés ou ignorés ;
  - les séries, séries et cycles réalisés ;
- consulter un historique simple des séances ;
- renseigner facultativement, en fin de séance :
	- un ressenti général ;
	- une douleur ou une gêne ;
	- une note libre ;
- retrouver ces informations dans le détail de la séance.

Dans cette version, l’échauffement, les séries de fin de cycle et les séries de fin de routine utilisent des séries ordinaires. `Retour au calme` n’est pas un type structurel particulier.

Le guidage sonore doit, dans la mesure permise par le système d’exploitation, continuer lorsque l’écran est verrouillé ou que l’application fonctionne en arrière-plan.

Toutes les données sont enregistrées uniquement sur l’appareil.

Le modèle de données de la V1 est hiérarchique et compatible avec l’imbrication future, mais l’interface limite la composition aux exercices, pauses, séries, séries et cycles prévus dans cette version.

---

## V2 – Composition avancée des routines

### Objectif

Enrichir rapidement la construction et l’exécution des routines, sans modifier encore le principe d’une application locale utilisée par une seule personne.

### Fonctionnalités

- intégrer une routine existante dans une autre routine ;
- conserver le nom et le regroupement visuel d’une routine intégrée ;
- copier son contenu afin qu’il devienne indépendant de la routine source ;
- développer, replier et modifier une routine intégrée ;
- enrichir les structures d’échauffement et de fin de séance si les tests montrent ce besoin ;
- calculer la durée estimée des structures complexes ;
- afficher la progression dans les structures et routines intégrées ;
- enregistrer les structures imbriquées et les éléments réellement effectués.

---

## V3 – Planification, synchronisation et relation avec un kinésithérapeute

### Objectif

Faire évoluer l’application personnelle vers un service synchronisé permettant la planification des séances et la collaboration avec un professionnel.

### Fonctionnalités

#### Programmation et notifications

- programmer une routine à une date et une heure ;
- créer une programmation récurrente ;
- choisir les jours et la fréquence ;
- définir une période ou une date de fin ;
- recevoir des notifications et des rappels ;
- reporter, ignorer ou annuler une occurrence programmée ;
- distinguer les séances prévues des séances réellement effectuées.

#### Comptes et synchronisation

- créer un compte utilisateur ;
- se connecter de manière sécurisée ;
- synchroniser les routines, programmations et séances ;
- retrouver ses données sur plusieurs appareils ;
- sauvegarder et restaurer ses données.

#### Relation avec un kinésithérapeute

- associer un utilisateur à un kinésithérapeute ;
- permettre au kinésithérapeute de créer ou de prescrire une routine ;
- transmettre des exercices, des consignes, des photos et des vidéos ;
- faire évoluer une routine prescrite ;
- distinguer les routines personnelles des routines prescrites ;
- partager avec le kinésithérapeute les séances réalisées ;
- transmettre un retour simple sur la douleur, la difficulté ou la fatigue ;
- conserver l’historique des versions prescrites.

Les modalités précises d’accès aux données, de consentement et de confidentialité devront être définies avant le développement de cette version.

---

## V4 – Extension de la vision

### Objectif

Développer les fonctions avancées, sociales et intelligentes de l’application à partir des usages constatés dans les premières versions.

### Fonctionnalités envisagées

- suivi détaillé de la douleur, de la fatigue et de la progression ;
- tableaux de bord et analyses comparatives ;
- comparaison avancée entre les séances prévues et réalisées ;
- adaptation progressive des routines ;
- recommandations assistées par intelligence artificielle ;
- partage de routines entre utilisateurs ;
- bibliothèque publique de routines ;
- groupes et communautés ;
- messagerie avec les professionnels ;
- synchronisation d’une routine intégrée avec sa source ;
- choix entre plusieurs voix ;
- personnalisation des sons ;
- réglage indépendant du volume des différents signaux dans l’application ;
- annonce anticipée de l’étape suivante ;
- guidage vocal enrichi avec consignes détaillées ;
- adaptation automatique du guidage sonore au contexte ou aux préférences de l’utilisateur ;
- autres fonctions identifiées à partir des retours des utilisateurs.

Le contenu exact de la V4 sera priorisé après les retours obtenus sur les versions précédentes.


### V1 (MVP)
- Gestion des routines actives et archivées.
- La planification des routines est hors périmètre (V2).

