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

Une séance est un contenu exécutable défini par l’utilisateur.

Elle possède notamment :
- un nom ;
- une couleur ;
- zéro, une ou plusieurs catégories ;
- une structure composée d’activités, d’un bloc et d’un cycle ;
- des paramètres de guidage et d’exécution.

### Routine

Une routine est la planification d’une séance.

Une même séance peut être utilisée par plusieurs routines. Une routine ne contient pas de copie de la séance et reprend sa couleur.

### Activité

Une activité est une étape élémentaire de la séance.

Le MVP distingue deux types d’activité :
- Exercice ;
- Récupération.

Un exercice peut être défini par une durée ou par un nombre de répétitions. Une récupération est chronométrée.

### Série

Une Série désigne, au sens sportif, la répétition d’un même Exercice. Le Nombre de Séries est un paramètre de l’Exercice et ne constitue pas un conteneur structurel de la Séance.

Une Pause après Série peut être définie pour un Exercice. Lorsqu’elle est renseignée, elle s’applique après chaque Série de cet Exercice selon les règles fonctionnelles détaillées. Elle n’est pas une Activité autonome dans la composition de la Séance.

### Bloc et cycle

Un bloc est une séquence ordonnée d’activités.

Dans le MVP, un cycle contient exactement un bloc et définit son nombre de répétitions.

### Exécution de séance

Une exécution de séance est la réalisation effective d’une séance.

Chaque exécution repose sur un instantané immuable de la séance utilisée au démarrage.

## 4. Périmètre du MVP

### Catalogue des séances

Le MVP permet de :
- créer une séance avec un nom et une couleur obligatoires ;
- composer et modifier une séance ;
- associer des catégories ;
- dupliquer, archiver et supprimer une séance ;
- rechercher les séances ;
- empêcher l’exécution d’une séance invalide ou vide.

### Composition d’une séance

Une séance peut comporter :
- un compte à rebours initial facultatif ;
- un bloc contenant des activités ordonnées ;
- un cycle répétant ce bloc ;
- des activités ordinaires placées après le dernier cycle ;
- une fin de séance déclenchée après la dernière activité.

Une séance est exécutable lorsqu’elle contient au moins un exercice valide.

Aucune récupération n’est ajoutée implicitement entre deux activités.

Un Exercice peut définir un Nombre de Séries et une Pause après Série facultative. Cette pause est un paramètre de l’Exercice, appliqué dans le contexte de ses Séries, et non une Activité indépendante dans la composition.

### Exécution

Le MVP permet de :
- lancer une séance depuis le catalogue ou depuis une occurrence du calendrier ;
- construire un plan d’exécution calculé à partir d’un instantané ;
- afficher l’activité en cours, l’activité suivante, le temps et la progression ;
- afficher la progression du bloc et du cycle ;
- réinitialiser l’activité courante après confirmation ;
- mettre la séance en pause et la reprendre ;
- passer à l’activité suivante après confirmation ;
- arrêter la séance uniquement depuis l’état Pause ;
- afficher une synthèse de fin de séance.

Aucun bouton permettant de revenir à l’activité précédente n’est inclus dans le MVP.

### Guidage

Le guidage comprend :
- l’annonce vocale du nom de l’activité au démarrage ;
- des bips pendant les activités chronométrées ;
- un signal spécifique pendant les trois dernières secondes ;
- l’activation indépendante des bips et des annonces vocales ;
- la conservation d’un comportement cohérent en arrière-plan dans les limites permises par iOS et Android.

Le comportement natif en arrière-plan et écran verrouillé doit faire l’objet d’une validation technique.

### Planification et calendrier

La planification est incluse dans le MVP.

Le MVP permet de :
- créer une routine depuis le Calendrier ;
- sélectionner la séance associée ;
- définir une date de début et une heure ;
- choisir entre Sans répétition et une récurrence hebdomadaire ;
- pour une récurrence hebdomadaire, sélectionner un ou plusieurs jours de la semaine et définir une date de fin obligatoire ;
- configurer un rappel ;
- modifier ou supprimer une routine ;
- consulter les occurrences dans des vues semaine et mois.

Une Routine ne possède pas d’état actif/inactif dans le MVP : elle existe ou est supprimée.

Les occurrences sont calculées dynamiquement à partir de la routine et ne sont pas enregistrées individuellement.

Le MVP ne permet pas de modifier une occurrence isolée.

### Suivi et historique

Chaque exécution conserve :
- l’instantané de la séance ;
- la date et l’heure ;
- la durée réelle ;
- le statut de l’exécution ;
- le détail des activités réalisées ;
- le ressenti et la note éventuellement renseignés.

Les statuts d’exécution sont :
- Terminée ;
- Partielle ;
- Interrompue.

Le Suivi du MVP comprend :
- une liste chronologique ;
- une recherche ;
- des tris et filtres ;
- une vue condensée ou déployée ;
- le détail d’exécution directement dans la carte déployée.

La Vue d’ensemble avec graphiques et comparaisons avancées est hors MVP.

### Profil et préférences

Les préférences globales servent de valeurs par défaut pour les nouvelles séances, notamment pour :
- le compte à rebours initial ;
- les sons ;
- les annonces vocales ;
- les vibrations.

Elles ne modifient jamais rétroactivement une séance existante ni une exécution passée.

## 5. Navigation principale

Le MVP comporte quatre onglets :
- Mes séances ;
- Calendrier ;
- Suivi ;
- Profil.

## 6. Hors périmètre du MVP

- compte utilisateur distant ;
- synchronisation cloud ou multi-appareils ;
- partage de séances ;
- relation avec un professionnel ;
- groupes et communautés ;
- tableaux de bord analytiques avancés ;
- signalement détaillé de douleur ou de gêne ;
- intelligence artificielle ;
- séances imbriquées ;
- combinaison de plusieurs blocs ou cycles dans un même cycle ;
- modification individuelle d’une occurrence de calendrier.

## 7. Principes métier structurants

1. Une séance est un contenu exécutable ; une routine est sa planification.
2. Une séance et ses routines sont indépendantes.
3. Chaque exécution conserve un instantané immuable de la séance utilisée.
4. Une modification ou une suppression ultérieure ne change jamais une exécution passée.
5. La suppression d’une routine ne supprime jamais l’historique.
6. La suppression d’une séance supprime ses routines mais conserve les exécutions passées.
7. Les catégories qualifient les séances.
8. Les zones corporelles qualifient uniquement les exercices.
9. La couleur appartient à la séance et est reprise par ses routines.
10. Le plan d’exécution est calculé au démarrage et n’est pas manipulé directement par l’utilisateur.
11. Le compte à rebours initial est une étape d’exécution.
12. La fin de séance est un événement déclenché après la dernière activité.
13. Les occurrences du calendrier sont calculées dynamiquement.
14. Toutes les données du MVP sont stockées localement sur l’appareil.

## 8. Écrans de référence

Les principaux écrans du MVP sont :
- Profil et préférences ;
- Catalogue des séances ;
- création du nom et de la couleur d’une séance ;
- composition d’une séance ;
- création ou modification d’un exercice ;
- création ou modification d’une récupération ;
- catégories de la séance ;
- Calendrier semaine et mois ;
- planification d’une séance ;
- exécution d’une séance ;
- modales d’interruption ;
- synthèse de séance ;
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
- stockage local avec SQLite, avec Drizzle ORM comme couche d’accès typée aux données ;
- support web utile au développement et à préparer sans complexifier le MVP mobile.

## 10. Évolutions prévues

Les versions futures pourront notamment introduire :
- synchronisation et comptes ;
- partage et relation avec des professionnels ;
- tableaux de bord et analyses comparatives ;
- signalement détaillé de douleur ou de gêne ;
- structures de séances plus complexes ;
- intelligence artificielle d’aide à la création, à l’adaptation et à l’analyse des séances.

## 11. Gouvernance documentaire

En cas de contradiction entre documents, l’ordre de référence est :
1. registre des décisions de conception ;
2. glossaire, modèle fonctionnel et modèle de données ;
3. conception fonctionnelle détaillée ;
4. écrans et navigation ;
5. autres notes historiques.

Toute évolution fonctionnelle doit préciser son impact sur :
- Figma ;
- documentation fonctionnelle ;
- modèle de données ;
- API ou services ;
- architecture technique ;
- version du produit.
