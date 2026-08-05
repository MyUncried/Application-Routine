# PRODUCT — Application Routine

## 1. Finalité

Application mobile permettant à un utilisateur d’organiser, exécuter et suivre des routines personnelles, notamment des exercices physiques, de mobilité ou de rééducation.

L’application doit remplacer l’usage dispersé de notes, vidéos, alarmes et minuteurs par un parcours unique, simple et guidé.

## 2. Utilisateur prioritaire

Le MVP est conçu pour un utilisateur individuel qui :

- crée ses propres routines ;
- les exécute sur son appareil ;
- consulte son historique ;
- utilise l’application sans compte et sans synchronisation cloud.

La kinésithérapie est un premier cas d’usage, mais le produit reste généraliste.

## 3. Périmètre du MVP

### Routines

- créer une routine en commençant par son nom ;
- associer zéro, une ou plusieurs catégories ;
- modifier, dupliquer, archiver et supprimer une routine ;
- afficher les routines actives et archivées ;
- empêcher l’exécution d’une routine vide.

### Activités

Une activité est une étape élémentaire de type :

- exercice ;
- pause ;
- récupération.

Une activité peut comprendre :

- un nom ;
- une consigne ;
- une durée ou un nombre de répétitions ;
- un média facultatif ;
- zéro, une ou plusieurs zones corporelles pour un exercice.

Les pauses et récupérations ne possèdent pas de zone corporelle.

### Structure d’une routine

Ordre logique :

```text
Compte à rebours initial facultatif

Cycle × N
  Série × M
    Activités ordonnées
  Activités de fin de cycle facultatives

Activités de fin de routine facultatives
```

Les séries et cycles sont des structures internes de la routine, avec une valeur par défaut de 1. Ils ne constituent pas des entités métier autonomes.

Une pause ou une récupération est toujours une activité explicite. Elle n’est jamais ajoutée automatiquement à un exercice.

### Exécution

- créer une séance distincte à chaque démarrage ;
- construire un plan d’exécution calculé ;
- conserver un instantané de la routine exécutée ;
- afficher l’activité en cours, l’activité suivante et la progression ;
- afficher les séries et cycles en cours lorsque nécessaire ;
- démarrer, mettre en pause, reprendre et réinitialiser une activité ;
- passer à l’activité précédente ou suivante ;
- terminer, interrompre ou abandonner une séance ;
- afficher une synthèse de fin de séance.

### Guidage

- annonce vocale du nom de l’activité au démarrage ;
- bip grave de rythme pendant un exercice chronométré ;
- bip aigu pendant les trois dernières secondes d’une étape chronométrée ;
- remplacement du bip grave par le bip aigu pendant les trois dernières secondes ;
- activation indépendante des bips, annonces vocales et vibrations ;
- poursuite du guidage en arrière-plan dans la mesure permise par le système d’exploitation.

### Historique et suivi

- enregistrer localement la date, la durée et le statut de la séance ;
- enregistrer les activités terminées ou ignorées ;
- enregistrer les séries et cycles réalisés ;
- permettre un ressenti général, une douleur ou gêne et une note libre facultative ;
- préserver les séances passées lorsque la routine est modifiée.

### Préférences

Les préférences globales servent de valeurs par défaut pour les nouvelles routines, notamment pour :

- le compte à rebours initial ;
- les paramètres sonores ;
- les annonces vocales ;
- les vibrations.

Elles ne modifient jamais rétroactivement une routine existante.

## 4. Hors périmètre du MVP

- compte utilisateur ;
- synchronisation cloud ou multi-appareils ;
- partage de routines ;
- relation avec un professionnel ;
- groupes et communautés ;
- planification et récurrence ;
- notifications avancées ;
- intelligence artificielle ;
- routines imbriquées.

## 5. Principes métier structurants

1. La définition d’une routine et son exécution sont séparées.
2. Chaque séance conserve un instantané immuable de la routine exécutée.
3. Une modification future ne change jamais une séance passée.
4. Une routine appartient à un utilisateur local unique dans le MVP.
5. Les catégories classent les routines.
6. Les zones corporelles qualifient uniquement les exercices.
7. Le plan d’exécution est calculé au démarrage et n’est pas manipulé directement par l’utilisateur.
8. Le compte à rebours initial est une étape d’exécution.
9. La fin de routine est un événement, pas une activité.
10. Toutes les données du MVP sont stockées localement sur l’appareil.

## 6. Écrans de référence

- Profil et préférences ;
- Mes routines ;
- Options d’une routine ;
- création du nom d’une routine ;
- composition d’une routine ;
- sélection et création des catégories ;
- création d’un exercice ;
- création d’une pause ;
- création d’une zone corporelle ;
- exécution d’une routine ;
- confirmation d’arrêt ;
- synthèse de séance ;
- suivi — vue d’ensemble ;
- suivi — séances.

Les maquettes Figma validées définissent la présentation et les interactions. La documentation Obsidian reste la source détaillée des règles fonctionnelles.

## 7. Contraintes techniques

- Une base de code unique (React Native / Expo).
- Compatible iOS et Android.
- L'interface doit s'adapter automatiquement aux différentes tailles d'écran de smartphone.
- Le design doit respecter les conventions natives de chaque plateforme lorsque cela améliore l'expérience utilisateur.
- Les tablettes ne font pas partie du MVP mais l'architecture doit permettre leur prise en charge ultérieure.
- L'application doit fonctionner en mode portrait.
- L'accessibilité (tailles de texte, contraste, zones tactiles) doit être prise en compte dès le MVP.

## 8. Socle technique initial

- React Native ;
- Expo SDK 57 ;
- TypeScript ;
- Expo Router ;
- stockage local à définir pendant la conception technique ;
- cible : iOS et Android, avec support web utile au développement.

## 9 Évolution prévue – Intelligence artificielle

L’application pourra intégrer ultérieurement des fonctionnalités d’intelligence artificielle, notamment pour :

- proposer ou adapter des routines selon les objectifs, contraintes et historique de l’utilisateur ;
- suggérer des activités, durées, répétitions, pauses ou progressions ;
- analyser l’exécution et l’assiduité ;
- générer des recommandations personnalisées ;
- assister un professionnel dans la préparation ou l’ajustement d’un programme.

Ces fonctions ne font pas partie du MVP.

## 10. Règle de gouvernance

En cas de contradiction entre documents :

1. décision validée dans le registre de conception ;
2. modèle fonctionnel et modèle de données ;
3. conception détaillée des écrans ;
4. autres notes historiques.

Toute évolution fonctionnelle doit préciser son impact sur :

- Figma ;
- documentation Obsidian ;
- modèle de données ;
- API ou services ;
- version produit.
