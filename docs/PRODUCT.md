# PRODUCT — Application Routine

## 1. Finalité

Application mobile permettant à un utilisateur de créer, exécuter, planifier et suivre des séances personnelles, notamment des exercices physiques, de mobilité ou de rééducation.

L’application remplace l’usage dispersé de notes, vidéos, alarmes et minuteurs par un parcours unique, simple et guidé.

## 2. Utilisateur prioritaire

Le MVP est conçu pour un utilisateur individuel qui :
- crée ses propres séances ;
- les exécute immédiatement ou les planifie ;
- consulte l’historique détaillé de ses exécutions ;
- utilise l’application sans compte et sans synchronisation cloud.

La kinésithérapie constitue un premier cas d’usage, mais le produit reste généraliste.

## 3. Concepts fonctionnels structurants

### Séance

Une Séance est un contenu exécutable défini par l’utilisateur.

Elle possède notamment :
- un nom ;
- une couleur ;
- zéro, une ou plusieurs catégories ;
- une Composition structurée autour d’un Set unique et d’un Cycle unique ;
- des paramètres de guidage et d’exécution.

### Routine

Une Routine est la planification d’une Séance.

Une même Séance peut être utilisée par plusieurs Routines. Une Routine ne contient pas de copie de la Séance et reprend sa couleur.

Dans le MVP, une Routine possède zéro ou un rappel.

### Activité

Une Activité est un élément exécutable de la Séance.

Le MVP distingue :
- Exercice ;
- Récupération.

Un Exercice est défini soit par une Durée, soit par un Nombre de répétitions. Une Récupération est chronométrée.

Une Activité peut être placée :
- avant le Cycle ;
- dans le Set ;
- après le Set et dans le Cycle ;
- après le Cycle et avant la Fin de séance.

### Série

Une Série désigne la répétition d’un même Exercice.

Le Nombre de Séries est un paramètre de l’Exercice et ne constitue pas un conteneur structurel de la Séance.

Une Pause après Série peut être définie pour un Exercice. Lorsqu’elle est renseignée, elle s’applique après chaque Série selon les règles détaillées. Les Récupérations techniques effectivement générées font partie du plan d’Exécution, mais pas du nombre d’Activités de la Composition.

### Set et Cycle

Le MVP contient exactement un Set et un Cycle.

Le Set contient une séquence ordonnée d’Activités et possède un nombre de répétitions de 1 à 99.

Le Cycle contient l’exécution du Set puis, le cas échéant, les Activités placées après le Set et dans le Cycle. Le Cycle possède lui aussi un nombre de répétitions de 1 à 99.

### Exécution

Une Exécution est la réalisation effective d’une Séance.

Chaque Exécution repose sur un instantané JSON immuable de la Séance au démarrage. Cet instantané garantit que l’historique reste lisible même si la Séance est ensuite modifiée ou supprimée.

## 4. Périmètre du MVP

### Catalogue des séances

Le MVP permet de :
- créer une Séance avec un nom et une couleur obligatoires ;
- composer et modifier une Séance ;
- associer des catégories ;
- dupliquer, archiver et supprimer une Séance ;
- rechercher les Séances ;
- empêcher l’exécution d’une Séance invalide ou vide.

### Composition d’une Séance

La structure comprend, dans l’ordre :
1. un Compte à rebours initial structurellement présent, éventuellement instantané à `0 s` ;
2. zéro, une ou plusieurs Activités avant le Cycle ;
3. un Cycle unique ;
4. zéro, une ou plusieurs Activités après le Cycle et avant la Fin de séance ;
5. une Fin de séance structurellement présente, éventuellement instantanée à `0 s`.

À l’intérieur de chaque répétition du Cycle :
1. le Set est exécuté selon son nombre de répétitions ;
2. les Activités après le Set et dans le Cycle sont ensuite exécutées une seule fois.

Une Séance est exécutable lorsqu’elle contient au moins un Exercice valide.

Aucune Récupération n’est ajoutée implicitement entre deux Activités, hors Récupérations techniques explicitement générées par une Pause après Série configurée.

Une Activité possède zéro ou un média dans le MVP.

### Exécution d’une Séance

Le MVP permet de :
- lancer une Séance depuis le catalogue ou depuis une occurrence du Calendrier ;
- construire le plan d’Exécution à partir de l’instantané ;
- afficher l’Activité en cours, l’Activité suivante, le temps et la progression ;
- afficher les compteurs de Set et de Cycle ;
- réinitialiser l’Activité courante ;
- mettre la Séance en Pause et la reprendre ;
- passer à l’Activité suivante ;
- arrêter volontairement la Séance uniquement depuis l’état Pause ;
- afficher une Synthèse lorsque le parcours le permet.

Pour une Activité chronométrée passée avant son terme, une confirmation est demandée et le Résultat d’Activité est enregistré `Partielle` si le passage est confirmé.

Pour un Exercice en mode Répétition, `Activité suivante` constitue la fin normale de l’Activité et ne demande pas de confirmation.

Un arrêt volontaire confirmé produit une Exécution `Interrompue` et ouvre la Synthèse. Une interruption technique ou système peut produire une Exécution `Interrompue` sans affichage de la Synthèse et donc sans Ressenti.

Aucun retour à l’Activité précédente n’est inclus dans le MVP.

### Calculs et progression

La Durée estimée est calculée à partir de toutes les durées déterminables du plan d’Exécution.

Aucune durée conventionnelle n’est attribuée aux Exercices en mode Répétition. Lorsqu’au moins un tel Exercice existe, la valeur affichée est une borne minimale avec le signe `≥`, par exemple `≥ 18 min`.

Le temps total écoulé et la Durée réelle excluent les périodes de Pause utilisateur.

Trois indicateurs d’Activités sont distingués :
- Nombre d’Activités de la Composition ;
- Nombre total d’Activités à exécuter ;
- Nombre d’Activités exécutées.

La barre de progression utilise une pondération hybride :
- les Activités chronométrées sont pondérées proportionnellement à leur durée ;
- chaque occurrence d’Exercice en mode Répétition reçoit un poids `1/N`, où `N` est le Nombre total d’Activités à exécuter ;
- la part restante est répartie entre les Activités chronométrées proportionnellement à leur durée.

La barre est visuellement continue, sans frontière de segment visible.

### Guidage

Le guidage comprend :
- l’annonce vocale du nom de l’Activité au démarrage ;
- les sons prévus pendant les Activités chronométrées, dont le bip grave de rythme ;
- le signal des trois dernières secondes ;
- un réglage global des sons dans le MVP ;
- un réglage séparé des annonces vocales ;
- les vibrations selon les préférences définies.

La désactivation spécifique du bip grave est reportée à une version ultérieure.

Le comportement natif en arrière-plan et écran verrouillé reste soumis aux validations techniques prévues dans l’architecture.

### Planification et Calendrier

La planification est incluse dans le MVP.

Le MVP permet de :
- créer une Routine depuis le Calendrier ;
- sélectionner la Séance associée ;
- définir une Date de début et une Heure ;
- choisir entre `Sans répétition` et `Périodique` ;
- pour `Périodique`, définir une fréquence en semaines, sélectionner un ou plusieurs jours et définir une Date de fin obligatoire ;
- configurer zéro ou un rappel ;
- modifier ou supprimer une Routine ;
- consulter les occurrences dans les vues semaine et mois.

Pour une Routine périodique, la semaine contenant la Date de début est la semaine d’ancrage. Les Date de début et Date de fin sont inclusives.

Une Routine ne possède pas d’état actif/inactif dans le MVP : elle existe ou est supprimée.

Les occurrences futures sont calculées dynamiquement et ne sont pas enregistrées individuellement. Le MVP ne permet pas de modifier une occurrence isolée.

### Suivi et historique

Chaque Exécution conserve notamment :
- l’instantané immuable de la Séance ;
- la date et l’heure ;
- la Durée réelle ;
- le statut ;
- les Résultats d’Activités exécutées ;
- le Ressenti éventuel ;
- un Commentaire facultatif limité à 200 caractères.

Les statuts d’Exécution sont :
- Terminée ;
- Partielle ;
- Interrompue.

Une Activité `Partielle` compte comme exécutée dans le Nombre d’Activités exécutées. Une Activité jamais atteinte ne compte pas.

Le Suivi du MVP comprend :
- une liste chronologique ;
- une recherche ;
- des tris et filtres ;
- une vue condensée ou déployée ;
- le détail d’Exécution directement dans la carte déployée.

La Vue d’ensemble avec graphiques et comparaisons avancées est hors MVP.

### Profil et préférences

Les Préférences globales définissent notamment :
- les valeurs par défaut du Compte à rebours initial et de la Fin de séance ;
- les sons ;
- les annonces vocales ;
- les vibrations ;
- l’activation des notifications.

Elles ne modifient jamais rétroactivement une Séance existante ni une Exécution passée.

## 5. Navigation principale

Le MVP comporte quatre onglets :
- Mes séances ;
- Calendrier ;
- Suivi ;
- Profil.

## 6. Hors périmètre du MVP

- compte utilisateur distant ;
- synchronisation cloud ou multi-appareils ;
- partage de Séances ;
- relation avec un professionnel ;
- groupes et communautés ;
- tableaux de bord analytiques avancés ;
- signalement détaillé de douleur ou de gêne ;
- intelligence artificielle ;
- Séances imbriquées ;
- structures comportant plusieurs Sets ou plusieurs Cycles ;
- modification individuelle d’une occurrence de Calendrier.

## 7. Principes métier structurants

1. Une Séance est un contenu exécutable ; une Routine est sa planification.
2. Une Séance et ses Routines sont indépendantes.
3. Chaque Exécution conserve un instantané immuable de la Séance utilisée.
4. Une modification ou une suppression ultérieure ne change jamais une Exécution passée.
5. La suppression d’une Routine ne supprime jamais l’historique.
6. La suppression d’une Séance supprime ses Routines mais conserve les Exécutions passées.
7. Les catégories qualifient les Séances.
8. Les zones corporelles qualifient uniquement les Exercices.
9. La couleur appartient à la Séance et est reprise par ses Routines.
10. Le plan d’Exécution est calculé au démarrage et n’est pas manipulé directement par l’utilisateur.
11. Le Compte à rebours initial et la Fin de séance sont structurellement présents ; `0 s` signifie phase instantanée.
12. Les occurrences du Calendrier sont calculées dynamiquement.
13. Toutes les données du MVP sont stockées localement sur l’appareil.
14. Les règles de calcul fonctionnelles sont déterministes et centralisées dans les spécifications.

## 8. Écrans de référence

Les principaux écrans du MVP sont :
- Profil et Préférences ;
- Catalogue des Séances ;
- création du nom et de la couleur d’une Séance ;
- Composition d’une Séance ;
- création ou modification d’un Exercice ;
- création ou modification d’une Récupération ;
- options d’une Activité ;
- catégories de la Séance ;
- Calendrier semaine et mois ;
- planification d’une Séance ;
- Exécution d’une Séance ;
- modales d’interruption ;
- Synthèse de Séance ;
- Suivi — Séances.

Les maquettes Figma validées définissent la présentation de référence. Les règles fonctionnelles détaillées sont décrites dans `docs/Specifications-fonctionnelles`.

## 9. Contraintes techniques initiales

- base de code unique React Native / Expo ;
- TypeScript ;
- Expo Router ;
- compatibilité iOS et Android ;
- fonctionnement en mode portrait ;
- adaptation aux différentes tailles d’écran de smartphone ;
- accessibilité prise en compte dès le MVP ;
- stockage local avec SQLite et couche d’accès typée aux données ;
- données métier et historique conservés localement ;
- notifications locales planifiées selon une fenêtre glissante conformément à l’architecture ;
- médias stockés de manière économe, avec suppression possible même lorsqu’ils sont utilisés par une ou plusieurs Séances, les associations concernées étant alors retirées ;
- support web utile au développement sans complexifier le MVP mobile.

Les choix d’implémentation détaillés et les spikes techniques sont définis dans le chapitre 12 — Architecture technique.

## 10. Évolutions prévues

Les versions futures pourront notamment introduire :
- synchronisation et comptes ;
- partage et relation avec des professionnels ;
- tableaux de bord et analyses comparatives ;
- signalement détaillé de douleur ou de gêne ;
- structures de Séances plus complexes ;
- réglages sonores plus fins ;
- planification périodique étendue, notamment mensuelle ;
- intelligence artificielle d’aide à la création, à l’adaptation et à l’analyse des Séances.

## 11. Gouvernance documentaire

`PRODUCT.md` est une synthèse. Il ne remplace pas les spécifications détaillées.

En cas de contradiction, l’ordre de référence est :
1. registre des décisions de conception ;
2. glossaire, modèle fonctionnel et modèle de données ;
3. conception fonctionnelle détaillée ;
4. écrans et navigation ;
5. versions du produit et vision générale ;
6. documents de travail, historiques et revues externes.

Toute évolution fonctionnelle doit préciser son impact sur :
- Figma ;
- documentation fonctionnelle ;
- modèle de données ;
- règles métier ;
- API ou services ;
- architecture technique ;
- version du produit.
