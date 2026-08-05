
# Refonte v7 (en cours)

> Cette version consolide les décisions validées concernant le moteur d'exécution, les préférences utilisateur et la synthèse de séance. Cette refonte remplace progressivement les ajouts successifs.

## État d'avancement

| Section | Statut |
|---|---|
| Cycle de vie | ✅ |
| Composition d'une routine | ✅ |
| Exécution d'une routine | ✅ |
| Synthèse de séance | ✅ |
| Profil et préférences | ✅ |
| États / erreurs / confirmations | ✅ |
| Revue qualité | ✅ Consolidée v13 |

## Préférences validées

### Exécution
- Compte à rebours initial par défaut : 10 s
- Message de début : « Soyez prêt »
- Fin de routine : 0 s
- Message de fin : « Bravo ! »

### Audio
- Bips activés par défaut.
- Annonces vocales activées par défaut.
- Volume : celui du téléphone.
- Voix : voix système du téléphone.

### Affichage
- Le thème et la taille des caractères suivent les paramètres du téléphone.

### Données
- Suppression de l'historique autorisée.
- Réinitialisation des préférences autorisée.
- Export : V3.


# Conception détaillée et spécifications fonctionnelles

## Objet de la note

Cette note précise les règles de fonctionnement de l’application avant le développement. Elle complète les wireframes et le modèle fonctionnel sans les remplacer.

Pour chaque domaine, elle doit progressivement définir :

- les règles normales ;
- les valeurs par défaut ;
- les actions autorisées ;
- les cas limites ;
- les confirmations nécessaires ;
- les données à conserver ;
- les conséquences sur l’historique.

## Structure de la conception détaillée

1. Règles transversales et vocabulaire
2. Cycle de vie des routines
3. Composition d’une routine
4. Exercices et pauses
5. Calcul des séries et cycles
6. Déroulement précis d’une séance
7. Interruption, sortie et reprise d’une séance
8. Planification, récurrence et notifications
9. Suivi, historique et indicateurs
10. Tags et catégories
11. Profil et préférences
12. États vides, erreurs et confirmations
13. Fonctionnement en arrière-plan
14. Accessibilité
15. Stockage local et sauvegarde

---

## 1. Cycle de vie d’une routine

**Statut : validé**

### 1.1 Création

- Un toucher sur `Nouvelle routine` ouvre l’écran de saisie du nom.
- La saisie du nom de la routine est obligatoire avant sa création.
- Tant qu'aucun nom valide n'est saisi, la routine n'est pas créée et aucune donnée n'est enregistrée.
- La validation du nom crée la routine, enregistre ses dates techniques et ouvre sa composition initiale.
- La validation de la composition ouvre l’écran de sélection des catégories de la routine.
- La sélection des catégories est facultative et multiple.
- L’utilisateur peut créer une nouvelle catégorie depuis cet écran.
- L’action `Enregistrer la routine` valide les catégories et ramène à `Mes routines`.
- La nouvelle routine est ajoutée en tête de `Mes routines`.
- Une routine vide est conservée, mais son bouton `Démarrer` est désactivé.
- Aucun statut `Brouillon` n’est utilisé.

### 1.2 Modification et enregistrement

- Toute modification est enregistrée automatiquement.
- Il n’existe pas de bouton général `Enregistrer`.
- L’enregistrement intervient après chaque modification validée : changement de nom, ajout d’une étape, modification d’une durée, déplacement d’un élément, etc.
- Le retour vers `Mes routines` ne demande aucune confirmation lorsque toutes les modifications sont enregistrées.
- En cas d’échec, l’application conserve localement la modification en attente et affiche un message discret mais visible.
- Modifier une routine n’altère jamais les séances déjà présentes dans l’historique.

### 1.3 Suppression

La suppression d’une routine demande une confirmation explicite.

Message standard :

> Supprimer « Nom de la routine » ?  
> La routine sera supprimée, mais les séances déjà réalisées resteront disponibles dans le suivi.

Actions :

- `Annuler`
- `Supprimer`

Conséquences :

- la routine disparaît de `Mes routines` ;
- les séances déjà réalisées restent dans le suivi grâce à leur instantané ;
- toutes les planifications futures associées à cette routine sont supprimées ;
- aucune corbeille ni restauration n’est prévue dans le MVP.

Lorsqu’une routine possède des planifications futures, le message devient :

> Supprimer « Nom de la routine » ?  
> La routine et toutes ses planifications futures seront supprimées. Les séances déjà réalisées resteront disponibles dans le suivi.

### 1.4 Duplication

- L’action `Dupliquer` crée une copie totalement indépendante.
- Le nom de la copie devient `Nom de la routine – copie`.
- Si ce nom existe déjà, les copies suivantes sont nommées `– copie 2`, `– copie 3`, etc.
- Tous les exercices, pauses, réglages, séries, cycles et paramètres sonores sont copiés.
- Les planifications, séances passées et statistiques ne sont jamais copiées.
- La copie apparaît en tête de `Mes routines`.
- Elle s’ouvre immédiatement afin que l’utilisateur puisse la modifier.

### 1.5 Ordre des routines

- Par défaut, les routines sont classées selon leur dernière exécution, la plus récente en premier.
- Une modification ou une simple consultation sans exécution ne change pas leur position.
- Une routine jamais exécutée est classée selon sa date de création, la plus récente en premier.
- L’utilisateur peut réorganiser les routines par glisser-déposer.
- Dès qu’il modifie manuellement l’ordre, la liste passe en `Ordre personnalisé` et les exécutions suivantes ne déplacent plus automatiquement les routines.
- Une action `Revenir à l’ordre récent` permet de rétablir le classement automatique.
- Si le glisser-déposer représente un effort disproportionné pour le MVP, cette possibilité pourra être reportée. Le classement automatique par dernière exécution reste alors la règle du MVP.

### 1.6 Renommage

- Le nom peut être modifié depuis l’écran de composition.
- Il doit contenir au moins un caractère visible.
- Les espaces placés au début et à la fin sont supprimés automatiquement.
- Plusieurs routines peuvent porter le même nom.
- La longueur maximale recommandée est de 60 caractères.
- Le nom affiché pour une ancienne séance reste celui enregistré dans l’instantané au moment de son exécution.

### 1.7 Routine vide ou devenue invalide

Une routine ne peut être lancée que si elle contient au moins un exercice valide.

Elle peut contenir :

- un exercice seul ;
- plusieurs exercices ;
- des pauses entre les exercices ;
- éventuellement une pause avant ou après les exercices.

En revanche :

- une routine ne comportant que des pauses ne peut pas être lancée ;
- une routine dont tous les exercices ont été supprimés reste enregistrée, mais son lancement est désactivé ;
- le message `Ajoutez au moins un exercice pour démarrer cette routine.` explique la raison du blocage.

---

## 2. Composition d’une routine

**Statut : partiellement validé — les règles ci-dessous sont acquises ; les valeurs par défaut restent à confirmer**

### 2.1 Structure générale

Une routine est constituée, dans cet ordre, de :

1. un compte à rebours initial facultatif, exécuté une seule fois ;
2. un échauffement facultatif, exécuté une seule fois ;
3. un cycle contenant un série et, après ce série, zéro, une ou plusieurs séries de fin de cycle ;
4. une ou plusieurs séries de fin de routine facultatives, placées hors du cycle et exécutées une seule fois.

Le série est une séquence ordonnée de séries et peut être répété. Le cycle contient toutes les répétitions du série, puis ses éventuelles séries de fin de cycle ; il peut lui-même être répété.

`Retour au calme` n’est pas un type structurel particulier. Un étirement, une récupération, une pause ou un exercice placé après le série est une série ordinaire de fin de cycle. Par exemple, `Étirement du quadriceps` est exécuté une fois à la fin de chaque cycle.

### 2.2 Ajout d’une étape

Depuis l’écran de composition, l’utilisateur peut ajouter :

- un exercice ;
- une pause.

L’étape est ajoutée à l’endroit depuis lequel l’action a été déclenchée. Si le bouton général situé en bas de la routine est utilisé, elle est ajoutée à la fin de la séquence principale.

Après l’ajout :

- l’étape s’ouvre immédiatement pour être renseignée ;
- elle reçoit des valeurs par défaut ;
- elle est enregistrée automatiquement ;
- elle peut ensuite être déplacée librement.

### 2.3 Valeurs par défaut proposées

#### Nouvel exercice chronométré

- Nom : `Nouvel exercice`
- Type : durée
- Durée : 30 secondes
- Son ou annonce : paramètres généraux de l’application

#### Nouvel exercice compté en répétitions

- Nom : `Nouvel exercice`
- Type : répétitions
- Nombre de répétitions : 10

#### Nouvelle pause

- Nom : `Pause`
- Durée : 15 secondes
- Type visuel : pause standard

Ces valeurs pourront être ajustées après les tests utilisateurs sans modifier le modèle fonctionnel.

### 2.4 Modification d’une étape

Un toucher sur une carte ouvre ses paramètres.

L’utilisateur peut modifier :

- le nom ;
- le type : durée ou répétitions ;
- la durée ou le nombre de répétitions ;
- la consigne ;
- le média associé, lorsqu’il sera pris en charge ;
- les paramètres sonores spécifiques, si une exception aux réglages généraux est nécessaire.

Le passage de `Durée` à `Répétitions`, ou inversement, conserve en mémoire la dernière valeur saisie pour chaque mode. Un exercice configuré à 45 secondes puis passé à 12 répétitions retrouve ainsi ses 45 secondes si l’utilisateur revient au mode chronométré.

### 2.5 Déplacement

- Les séries peuvent être réorganisées par glisser-déposer dans leur conteneur.
- Une série peut être déplacée dans le série, après le série dans le cycle, ou après le cycle en fin de routine.
- Le compte à rebours initial et l’échauffement restent hors du cycle.
- Le série et le cycle sont des conteneurs repliables et dépliables.
- La nouvelle position est enregistrée dès que le déplacement est terminé.

### 2.6 Duplication d’une étape

- L’action `Dupliquer` crée une copie indépendante de l’exercice ou de la pause.
- Elle reprend tous les paramètres de l’élément d’origine.
- Elle est placée juste après celui-ci.
- Elle conserve le même nom.
- Les modifications ultérieures de l’un n’affectent pas l’autre.

Le suffixe « copie » n’est pas ajouté automatiquement au nom d’un exercice, car plusieurs occurrences d’un même mouvement peuvent légitimement porter le même nom.

### 2.7 Suppression d’une étape

- La suppression d’un exercice ou d’une pause est immédiate, sans fenêtre de confirmation.
- Une action `Annuler` est proposée temporairement après la suppression.
- L’annulation restaure l’élément, sa position et tous ses réglages.

Message affiché :

> Exercice supprimé — Annuler

La suppression d’un conteneur comportant plusieurs séries demande une confirmation, car elle supprime tout son contenu.

### 2.8 Règles de validité

Pour pouvoir être lancée, une routine doit contenir au moins un exercice valide.

Un exercice chronométré est valide si :

- son nom contient au moins un caractère visible ;
- sa durée est supérieure à zéro.

Un exercice en répétitions est valide si :

- son nom contient au moins un caractère visible ;
- le nombre de répétitions est au moins égal à 1.

Une pause est valide si sa durée est supérieure à zéro.

Une routine comportant une étape incomplète reste enregistrée, mais ne peut pas être lancée. L’étape concernée est signalée visuellement et le bouton `Démarrer` indique la raison du blocage.

### 2.9 Séries, séries et cycles

| Niveau | Fonction |
|---|---|
| Série | Étape élémentaire : exercice mesuré en durée ou en répétitions, pause, récupération, étirement ou autre activité |
| Série | Séquence ordonnée de séries, répétée le nombre de fois défini |
| Cycle | Ensemble composé des répétitions du série, puis de zéro, une ou plusieurs séries de fin de cycle ; cet ensemble peut être répété |
| Fin de routine | Zéro, une ou plusieurs séries placées après le cycle et exécutées une seule fois |

Exemple :

- série 1 : `Squats — 10 répétitions` ;
- série 2 : `Pause — 20 secondes` ;
- le série contient ces deux séries et est répété 2 fois : `Série × 2` ;
- `Étirement du quadriceps` est placé après le série dans le cycle ;
- le cycle complet est répété 3 fois : `Cycle × 3` ;
- une éventuelle série `Fin de routine` est placée après le cycle et n’est exécutée qu’une fois.

L’ordre d’exécution est donc :

1. Squats ;
2. Pause ;
3. Squats ;
4. Pause ;
5. Étirement du quadriceps ;
6. reprise du cycle pour ses deuxième et troisième répétitions ;
7. série de fin de routine éventuelle.

### 2.10 Comportement des pauses

- Une pause ou une récupération est une série explicite, au même titre qu’un exercice.
- Sa fréquence d’exécution dépend de son emplacement : dans le série, après le série dans le cycle, ou après le cycle en fin de routine.
- Aucune pause automatique ou invisible n’est ajoutée entre deux exercices, deux répétitions du série ou deux cycles.
- Une pause n’est jamais obligatoire.
- Si le déroulé réel fait s’enchaîner deux séries d’exercice sans pause, l’application affiche un avertissement informatif et non bloquant : `Sans pause, les exercices s’enchaînent directement.`
- L’utilisateur peut enregistrer et démarrer la routine sans ajouter de pause.

### 2.11 Représentation dans l’écran de composition

- Le nombre de répétitions est affiché directement dans l’en-tête de chaque conteneur : `Série × N` et `Cycle × N`.
- Il n’existe pas de panneau séparé `Séries / Cycles` lorsque ces valeurs sont déjà visibles dans les conteneurs.
- Le série et le cycle possèdent chacun une icône et un chevron permettant de développer ou replier leur contenu.
- Les séries de fin de routine sont affichées après le conteneur du cycle et utilisent une icône dédiée, par exemple un drapeau.
- Les cartes de séries sont compactes afin de rendre la structure imbriquée lisible sans allonger inutilement l’écran.

### 2.12 Décisions restant à valider

1. Conserver les valeurs par défaut proposées : exercice de 30 secondes, exercice de 10 répétitions et pause de 15 secondes.
2. Supprimer un exercice ou une pause sans confirmation, avec une action temporaire `Annuler`.

### 2.13 Évolution hors MVP

Un type de série spécifique au dernier cycle pourrait plus tard se substituer à une série ordinaire de fin de cycle. Cette possibilité n’est pas intégrée au MVP.


## Mise à jour – Exécution d'une routine (itération)

### Décisions validées

- Le bouton **Démarrer** de la liste ouvre l'écran d'exécution mais ne lance pas la séance.
- La séance démarre uniquement après appui sur le bouton de démarrage de l'écran d'exécution.
- Les activités chronométrées passent automatiquement à la suivante.
- Les activités manuelles passent à la suivante via **Suivant**.
- Les activités manuelles sont conservées dans le MVP et leur durée réelle est enregistrée.
- Le bouton Pause devient un bouton Reprendre (changement d'icône).
- Le bouton Resérie réinitialise uniquement l'activité courante.
- Le bouton Précédent est supprimé du MVP.
- Une sortie de séance propose : Reprendre plus tard, Abandonner, Annuler.
- En arrière-plan, le chronomètre continue.
- En fin de séance, l'application ouvre automatiquement l'écran de synthèse.

### Affichage des durées

- Les temps total et restant sont calculés uniquement à partir des activités chronométrées.
- Lorsqu'une routine contient au moins une activité manuelle, le symbole **≈** est affiché devant les temps total et restant.
- Les activités manuelles affichent le libellé **Manuel** à la place d'une durée.

### Valeurs par défaut

Les nouvelles routines héritent des préférences du profil :
- Compte à rebours initial : 10 s
- Fin de routine : 0 s


---

# Annexe – Tableaux de spécification des écrans

## Mes routines
### Champs affichés

| Élément affiché     | Type        | Visible        | Obligatoire | **Valeur par défaut**    | **Contraintes**                                 | Source      | Action                    | Remarques                            |
| ------------------- | ----------- | -------------- | ----------- | ------------------------ | ----------------------------------------------- | ----------- | ------------------------- | ------------------------------------ |
| Titre de l'écran    | Texte       | Toujours       | Oui         | "Mes routines"           | Texte fixe                                      | Statique    | Aucune                    |                                      |
| Bouton Ajouter (+)  | Bouton      | Toujours       | Oui         | Visible                  | Toujours actif                                  | Statique    | Créer une routine         |                                      |
| Champ Recherche     | Champ texte | Toujours       | Oui         | Vide                     | 0 à 80 caractères                               | Utilisateur | Filtre la liste           | Recherche instantanée                |
| Onglet Toutes       | Onglet      | Toujours       | Oui         | Sélectionné              | Une seule sélection possible                    | Statique    | Filtre                    | Onglet par défaut                    |
| Onglet Planifiées   | Onglet      | Toujours       | Oui         | Non sélectionné          | Une seule sélection possible                    | Statique    | Filtre                    | Inactif au début du MVP              |
| Onglet Archivées    | Onglet      | Toujours       | Oui         | Non sélectionné          | Une seule sélection possible                    | Statique    | Filtre                    |                                      |
| Carte Routine       | Carte       | 1 par routine  | Oui         | Repliée                  | Une seule carte déployée à la fois              | Routine     | Déplier / Replier         |                                      |
| Nom de la routine   | Texte       | Toujours       | Oui         | Aucun                    | 1 à 80 caractères                               | Routine     | Ouvrir l'édition          |                                      |
| Tags catégories     | Badges      | Si renseignés  | Non         | Non affichés             | Zéro à plusieurs catégories                     | Routine     | Aucune                    | Affichage synthétique selon l’espace disponible |
| Nombre d'étapes     | Texte       | Toujours       | Oui         | Calculé                  | ≥ 1                                             | Calculé     | Aucune                    |                                      |
| Durée estimée       | Texte       | Toujours       | Oui         | Calculée                 | Affiche "≈" si activité manuelle                | Calculée    | Aucune                    |                                      |
| Nombre de Séries      | Texte       | Toujours       | Oui         | Calculé                  | ≥ 1                                             | Calculé     | Aucune                    |                                      |
| Nombre de Cycles    | Texte       | Toujours       | Oui         | Calculé                  | ≥ 1                                             | Calculé     | Aucune                    |                                      |
| Dernière séance     | Texte       | Si disponible  | Non         | "Aucune"                 | Date relative ("Hier", "Aujourd'hui", etc.)     | Historique  | Aucune                    |                                      |
| Prochaine séance    | Texte       | Si planifiée   | Non         | "Non planifiée"          | Date/heure relative                             | Planning    | Aucune                    | Inactif dans le MVP                  |
| Icône Déplier       | Bouton      | Toujours       | Oui         | Carte repliée            | Rotation selon l'état                           | Statique    | Déplier / Replier         |                                      |
| Icône Options (…)   | Bouton      | Toujours       | Oui         | Visible                  | Toujours disponible                             | Statique    | Ouvre le menu             |                                      |
| Liste des activités | Liste       | Carte déployée | Oui         | Masquée                  | Ordre de la routine                             | Routine     | Aucune                    |                                      |
| Nom de l'activité   | Texte       | Carte déployée | Oui         | Aucun                    | 1 à 80 caractères                               | Activité    | Aucune                    |                                      |
| Durée / Répétitions | Texte       | Carte déployée | Oui         | Selon le type            | Durée, répétitions ou "Manuel"                  | Activité    | Aucune                    |                                      |
| Bouton Démarrer     | Bouton      | Carte déployée | Oui         | Activé                   | Désactivé uniquement si la routine est invalide | Statique    | Ouvre l'écran d'exécution | Ne lance pas immédiatement la séance |
| Barre de navigation | Navigation  | Toujours       | Oui         | Mes routines sélectionné | 4 onglets fixes                                 | Statique    | Navigation                | Agenda inactif dans le MVP           |
### Règles fonctionnelles
| Règle                 | Description                                                                                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chargement            | Les routines sont affichées dès l'ouverture de l'écran.                                                                                                                                       |
| Tri par défaut        | Les routines sont triées par date de dernière modification (plus récente en premier).                                                                                                         |
| Recherche             | Le filtrage est effectué en temps réel sur le nom de la routine.                                                                                                                              |
| Onglet **Toutes**     | Affiche toutes les routines non archivées.                                                                                                                                                    |
| Onglet **Planifiées** | Affiche uniquement les routines planifiées. Les fonctions de planification sont inactives dans le MVP.                                                                                        |
| Onglet **Archivées**  | Affiche uniquement les routines archivées.                                                                                                                                                    |
| Carte repliée         | Une routine est affichée sous forme synthétique.                                                                                                                                              |
| Carte déployée        | Affiche la liste des activités et le bouton **Démarrer**.                                                                                                                                     |
| Déploiement           | Une seule carte peut être déployée simultanément. L'ouverture d'une carte replie automatiquement la précédente.                                                                               |
| Résumé                | Le nombre d'activités, la durée estimée, le nombre de Séries et de Cycles sont calculés automatiquement.                                                                                        |
| Activités manuelles   | Si la routine contient au moins une activité manuelle, la durée estimée est précédée du symbole **≈**.                                                                                        |
| Dernière séance       | Affiche la date de la dernière exécution si elle existe, sinon **Aucune**.                                                                                                                    |
| Prochaine séance      | Affiche la prochaine planification ou **Non planifiée**. Fonction inactive dans le MVP.                                                                                                       |
| Bouton **Démarrer**   | Ouvre l'écran d'exécution. La séance ne démarre qu'après appui sur le bouton **Lecture** de cet écran.                                                                                        |
| Bouton **+**          | Ouvre l'écran de création d'une nouvelle routine.                                                                                                                                             |
| Menu **...**          | Donne accès aux actions sur la routine.                                                                                                                                                       |
| Modifier              | Ouvre l'écran de modification de la routine.                                                                                                                                                  |
| Archiver              | Déplace la routine dans l'onglet **Archivées** après confirmation.                                                                                                                            |
| Restaurer             | Disponible uniquement pour une routine archivée. Replace la routine dans **Toutes**.                                                                                                          |
| Supprimer             | Supprime définitivement la routine après confirmation. L'historique associé est également supprimé.                                                                                           |
| Suppression           | Impossible à annuler une fois confirmée.                                                                                                                                                      |
| Liste vide            | Si aucune routine n'est disponible, un message et un bouton **Créer une routine** sont affichés.                                                                                              |
| Actualisation         | Toute création, modification, archivage, restauration ou suppression met immédiatement la liste à jour.                                                                                       |
| Navigation            | Les onglets inférieurs permettent de naviguer vers **Agenda**, **Suivi** et **Profil**. Les écrans inactifs dans le MVP restent accessibles mais leurs fonctionnalités peuvent être limitées. |

## Nouvelle routine — Saisie du nom

### Éléments affichés

| Élément affiché | Type | Visible | Obligatoire | Valeur par défaut | Contraintes | Source | Action | Remarques |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bouton Retour | Bouton | Toujours | Oui | Visible | Annule la création tant que le nom n’est pas validé | Système | Retour | |
| Titre de l’écran | Texte | Toujours | Oui | « Nouvelle routine » | Texte fixe | Statique | Aucune | En-tête fixe |
| Nom de la routine | Champ texte | Toujours | Oui | Vide | 1 à 80 caractères | Routine | Saisie | Focus initial sur le champ |
| Texte d’aide | Texte | Toujours | Non | « Le nom est obligatoire pour créer la routine. » | Texte fixe | Statique | Aucune | |
| Bouton Continuer | Bouton | Toujours | Oui | Désactivé | Activé uniquement si le nom est valide | Statique | Continuer | Ouvre la composition |

### Règles fonctionnelles

| Règle | Description |
| --- | --- |
| Création | La routine n’est créée qu’après validation d’un nom valide. |
| Nom | Les espaces seuls sont refusés ; les espaces de début et de fin sont supprimés. |
| Continuer | Crée la routine et ouvre l’écran de composition initialisé. |
| Retour | Ne crée aucune routine si le nom n’a pas été validé. |

## Catégories de la routine

### Éléments affichés

| Élément affiché | Type | Visible | Obligatoire | Valeur par défaut | Contraintes | Source | Action | Remarques |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bouton Retour | Bouton | Toujours | Oui | Visible | Revient à la composition | Système | Retour | |
| Titre de l’écran | Texte | Toujours | Oui | « Catégories de la routine » | Texte fixe | Statique | Aucune | En-tête fixe |
| Texte introductif | Texte | Toujours | Non | « Sélectionnez une ou plusieurs catégories. » | Texte fixe | Statique | Aucune | |
| Catégories proposées | Tags | Toujours | Non | Aucune sélection | Sélection multiple | Catégorie | Sélectionner / Désélectionner | Valeurs par défaut et personnalisées |
| Bouton Créer une catégorie | Bouton | Toujours | Non | Visible | Nom unique par utilisateur | Statique | Créer | Ajoute une catégorie personnalisée |
| Bouton Enregistrer la routine | Bouton | Toujours | Oui | Actif | La routine doit être valide | Statique | Enregistrer | Retourne à Mes routines |

### Règles fonctionnelles

| Règle | Description |
| --- | --- |
| Caractère facultatif | Une routine peut être enregistrée sans catégorie. |
| Sélection multiple | Une routine peut être associée à zéro, une ou plusieurs catégories. |
| Création d’une catégorie | La nouvelle catégorie est ajoutée à la liste et sélectionnée pour la routine en cours. |
| Retour | Revient à la composition sans supprimer la routine ni ses modifications déjà validées. |
| Enregistrement | Enregistre les catégories sélectionnées et ramène à Mes routines. |


## Création / Édition d'une routine

### Eléments affichés

| Élément affiché                                  | Type      | Visible        | Obligatoire | Valeur par défaut                                 | Contraintes                                            | Source   | Action            | Remarques                                |
| ------------------------------------------------ | --------- | -------------- | ----------- | ------------------------------------------------- | ------------------------------------------------------ | -------- | ----------------- | ---------------------------------------- |
| Bouton Retour                                    | Bouton    | Toujours       | Oui         | Visible                                           | Demande confirmation si modifications non enregistrées | Système  | Retour            |                                          |
| Titre de l'écran                                 | Texte     | Toujours       | Oui         | "Nouvelle routine" ou nom de la routine           | Texte fixe                                             | Routine  | Aucune            |                                          |
| Résumé (nb séries / durée)                       | Texte     | Toujours       | Oui         | Calculé                                           | Mis à jour automatiquement                             | Calculé  | Aucune            | Affiche ≈ si activité manuelle           |
| Liste des éléments                               | Liste     | Toujours       | Oui         | Compte à rebours initial + Cycle + Fin de routine | Ordre modifiable                                       | Routine  | Défilement        |                                          |
| Compte à rebours initial                         | Carte     | Toujours       | Oui         | 10 s (profil)                                     | Une seule occurrence                                   | Routine  | Modifier          | 0 s = désactivé                          |
| Bouton Options (Compte à rebours)                | Menu      | Toujours       | Oui         | Visible                                           | Modifier / Supprimer (si durée = 0)                    | Statique | Ouvrir menu       |                                          |
| Bouton Ajouter (+)                               | Bouton    | Selon position | Oui         | Visible                                           | Ajoute un élément à cet emplacement                    | Statique | Ajouter           | Toujours entre deux éléments             |
| Cycle                                            | Conteneur | Toujours       | Oui         | 1                                                 | Minimum 1                                              | Routine  | Déplier / Replier | Plusieurs autorisés                      |
| Compteur Cycle (- / +)                           | Sélecteur | Toujours       | Oui         | 1                                                 | 1 à 99                                                 | Routine  | Modifier          |                                          |
| Série                                              | Conteneur | Toujours       | Oui         | 1                                                 | Minimum 1 par Cycle                                    | Routine  | Déplier / Replier |                                          |
| Compteur Série (- / +)                             | Sélecteur | Toujours       | Oui         | 1                                                 | 1 à 99                                                 | Routine  | Modifier          |                                          |
| Activité                                         | Carte     | Selon contenu  | Oui         | Aucune                                            | Au moins une activité dans une routine valide          | Routine  | Modifier          | Déplaçable                               |
| Nom de l'activité                                | Texte     | Toujours       | Oui         | Aucun                                             | 1 à 80 caractères                                      | Activité | Modifier          |                                          |
| Badge catégorie (Échauffement / Retour au calme) | Badge     | Si renseigné   | Non         | Masqué                                            | Une valeur maximum                                     | Activité | Modifier          |                                          |
| Résumé activité                                  | Texte     | Toujours       | Oui         | Calculé                                           | Durée, répétitions, Manuel, pause                      | Activité | Modifier          |                                          |
| Icône Déplacement                                | Bouton    | Toujours       | Oui         | Visible                                           | Glisser-déposer                                        | Statique | Déplacer          |                                          |
| Bouton Options activité                          | Menu      | Toujours       | Oui         | Visible                                           | Modifier / Dupliquer / Supprimer                       | Statique | Ouvrir menu       |                                          |
| Fin de routine                                   | Carte     | Toujours       | Oui         | 0 s (profil)                                      | Une seule occurrence                                   | Routine  | Modifier          | 0 s = désactivée                         |
| Bouton Valider / Créer                           | Bouton    | Toujours       | Oui         | Activé si routine valide                          | Désactivé si erreurs                                   | Statique | Valider            | En création, ouvre les catégories ; en modification, valide les changements |
### Règles fonctionnelles
| Règle                           | Description                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mode de l'écran                 | L'écran fonctionne en mode **Création** ou **Modification**.                                                                                           |
| Nom de la routine               | Saisi sur l’écran précédent lors d’une création ; modifiable sur une routine existante.                                                                |
| Création                        | Une nouvelle routine est initialisée avec : Compte à rebours initial, 1 Cycle (1 Série vide) et Fin de routine.                                          |
| Modification                    | Tous les champs sont préremplis avec les valeurs de la routine.                                                                                        |
| Compte à rebours initial        | Une seule occurrence autorisée. Une durée de 0 s le désactive sans le masquer.                                                                         |
| Fin de routine                  | Une seule occurrence autorisée. Une durée de 0 s la désactive sans la masquer.                                                                         |
| Activités                       | Une routine valide doit contenir au moins une activité.                                                                                                |
| Cycle                           | Au moins un Cycle est obligatoire.                                                                                                                     |
| Série                             | Chaque Cycle contient au moins un Série.                                                                                                                 |
| Déplacement                     | Les activités, séries et cycles peuvent être réordonnés par glisser-déposer en mode édition. Le compte à rebours initial reste en première position et la fin de routine en dernière position.                                                                         |
| Boutons "+"                     | Ajoutent un nouvel élément à l'emplacement sélectionné.                                                                                                |
| Déplier / Replier               | Les conteneurs Cycle et Série peuvent être repliés sans modifier leur contenu.                                                                           |
| Compteurs Série / Cycle           | Les boutons + et − modifient le nombre de répétitions sans modifier le contenu.                                                                        |
| Résumé de la routine            | Le nombre d'activités et la durée estimée sont recalculés automatiquement à chaque modification.                                                       |
| Activités manuelles             | La durée estimée est calculée uniquement sur les activités chronométrées. Le symbole **≈** est affiché si au moins une activité manuelle est présente. |
| Suppression d'un élément        | Une confirmation est demandée avant suppression.                                                                                                       |
| Suppression du dernier exercice | Interdite si elle rendrait la routine invalide.                                                                                                        |
| Retour arrière                  | Si des modifications non enregistrées existent, une confirmation est demandée.                                                                         |
| Validation                      | Le bouton est activé uniquement lorsque la routine est valide. En création, il ouvre l’écran **Catégories de la routine**. En modification, il valide les changements. |
| Enregistrement                  | Les modifications sont enregistrées uniquement après validation.                                                                                       |
| Annulation                      | Quitter sans enregistrer conserve la version précédente de la routine.                                                                                 |
| Navigation                      | En création, la validation ouvre **Catégories de la routine** ; après enregistrement des catégories, retour à **Mes routines**.                         |

## Activité

### Eléments affichés

| Élément affiché       | Type              | Visible                             | Obligatoire | Valeur par défaut              | Contraintes                                    | Source   | Action       | Remarques                              |
| --------------------- | ----------------- | ----------------------------------- | ----------- | ------------------------------ | ---------------------------------------------- | -------- | ------------ | -------------------------------------- |
| Bouton Retour         | Bouton            | Toujours                            | Oui         | Visible                        | Confirmation si modifications non enregistrées | Système  | Retour       |                                        |
| Titre de l'écran      | Texte             | Toujours                            | Oui         | "Ajouter une étape"            | Texte fixe                                     | Statique | Aucune       | En modification : "Modifier une étape" |
| Type d'activité       | Segmented Control | Toujours                            | Oui         | Exercice                       | Exercice / Pause / Récupération                | Activité | Sélection    | Change les champs affichés             |
| Nom                   | Champ texte       | Toujours                            | Oui         | Vide                           | 1 à 80 caractères                              | Activité | Saisie       | Pré-rempli pour Pause / Récupération   |
| Mode d'exécution      | Segmented Control | Exercice uniquement                 | Oui         | Durée                          | Durée / Répétitions                            | Activité | Sélection    | Non affiché pour Pause / Récupération  |
| Durée                 | Sélecteur durée   | Si mode Durée ou Pause/Récupération | Oui         | 30 s                           | 1 s à 99 min 59 s                              | Activité | Sélection    | 0 interdit                             |
| Nombre de répétitions | Champ numérique   | Si mode Répétitions                 | Oui         | 1                              | 1 à 999                                        | Activité | Saisie       | Entier uniquement                      |
| Pause après activité  | Sélecteur durée   | Exercice uniquement                 | Non         | 0 s                            | 0 à 99 min 59 s                                | Activité | Sélection    | 0 = aucune pause                       |
| Consigne              | Texte multiligne  | Toujours                            | Non         | Vide                           | 1000 caractères max                            | Activité | Saisie       |                                        |
| Zones corporelles     | Tags              | Exercice uniquement                 | Non         | Aucune                         | Plusieurs zones autorisées                     | Activité | Sélection    | Masqué pour Pause / Récupération       |
| Bouton « Créer une zone » | Bouton         | Exercice uniquement                 | Non         | Visible                        | Nom unique par utilisateur                     | Statique | Créer une zone | Masqué pour Pause / Récupération     |
| Bouton Valider        | Bouton            | Toujours                            | Oui         | Désactivé si activité invalide | Nom + durée/répétitions obligatoires           | Statique | Enregistrer  |                                        |
### Règles fonctionnelles

| Règle                | Description                                                                    |
| -------------------- | ------------------------------------------------------------------------------ |
| Type Exercice        | Autorise les modes Durée et Répétitions.                                       |
| Type Pause           | Nom pré-rempli "Pause". Le mode d'exécution est masqué.                        |
| Type Récupération    | Nom pré-rempli "Récupération". Le mode d'exécution est masqué.                 |
| Mode Durée           | Affiche le sélecteur de durée.                                                 |
| Mode Répétitions     | Affiche le champ "Nombre de répétitions".                                      |
| Pause après activité | Disponible uniquement pour les exercices.                                      |
| Zones corporelles   | Disponibles uniquement pour une activité de type Exercice ; sélection multiple. |
| Pause / Récupération | La section Zones corporelles et l’action Créer une zone sont masquées.          |
| Validation           | Impossible tant que les champs obligatoires ne sont pas renseignés.            |
| Retour               | Si des modifications non enregistrées existent, une confirmation est demandée. |
## Exécution d'une routine

### Éléments affichés

| Élément affiché               | Type            |                Visible | Obligatoire | Valeur par défaut                                  | Contraintes                                         | Source      | Action                       | Remarques                                                  |
| ----------------------------- | --------------- | ---------------------: | ----------: | -------------------------------------------------- | --------------------------------------------------- | ----------- | ---------------------------- | ---------------------------------------------------------- |
| Titre de la routine           | Texte           |               Toujours |         Oui | Nom de la routine                                  | 1 à 80 caractères                                   | Routine     | Aucune                       | En-tête fixe                                               |
| Icône Bips                    | Bouton / état   |               Toujours |         Oui | Selon préférence utilisateur                       | Activé / désactivé                                  | Préférences | Activer / désactiver         | Changement d’icône selon l’état                            |
| Icône Annonces vocales        | Bouton / état   |               Toujours |         Oui | Selon préférence utilisateur                       | Activé / désactivé                                  | Préférences | Activer / désactiver         | Utilise la voix système                                    |
| Libellé Étapes                | Texte           |               Toujours |         Oui | `0 sur N`                                          | Valeurs comprises entre 0 et N                      | Séance      | Aucune                       | Progression réelle                                         |
| Nombre d’étapes réalisées     | Valeur calculée |               Toujours |         Oui | 0                                                  | Ne peut pas dépasser le total                       | Séance      | Aucune                       | Inclut les activités terminées ou écourtées                |
| Nombre total d’étapes         | Valeur calculée |               Toujours |         Oui | Calculé                                            | ≥ 1                                                 | Routine     | Aucune                       |                                                            |
| Libellé Temps total           | Texte           |               Toujours |         Oui | Statique                                           | Texte fixe                                          | Statique    | Aucune                       |                                                            |
| Temps total restant           | Durée dynamique |               Toujours |         Oui | Durée planifiée                                    | ≥ 0 ; jamais négatif                                | Séance      | Aucune                       | Remplace le temps écoulé                                   |
| Durée totale planifiée        | Durée statique  |               Toujours |         Oui | Calculée                                           | Calculée uniquement sur les activités chronométrées | Routine     | Aucune                       | Format `temps restant / temps total`                       |
| Symbole `≈`                   | Indicateur      |           Conditionnel |         Non | Masqué                                             | Affiché si au moins une activité manuelle existe    | Routine     | Aucune                       | Devant les deux durées globales                            |
| Barre de progression          | Barre           |               Toujours |         Oui | 0 %                                                | Entre 0 et 100 %                                    | Séance      | Aucune                       | Mise à jour dynamique                                      |
| Libellé Série                   | Texte           |               Toujours |         Oui | `1 / N`                                            | Minimum 1                                           | Séance      | Aucune                       | Pas d’annonce vocale                                       |
| Série courant                   | Valeur calculée |               Toujours |         Oui | 1                                                  | 1 à nombre total de Séries                            | Séance      | Aucune                       | Réinitialisé à 1 à chaque nouveau Cycle                    |
| Nombre total de Séries          | Valeur calculée |               Toujours |         Oui | Calculé                                            | ≥ 1                                                 | Routine     | Aucune                       |                                                            |
| Libellé Cycle                 | Texte           |               Toujours |         Oui | `1 / N`                                            | Minimum 1                                           | Séance      | Aucune                       | Pas d’annonce vocale                                       |
| Cycle courant                 | Valeur calculée |               Toujours |         Oui | 1                                                  | 1 à nombre total de Cycles                          | Séance      | Aucune                       |                                                            |
| Nombre total de Cycles        | Valeur calculée |               Toujours |         Oui | Calculé                                            | ≥ 1                                                 | Routine     | Aucune                       |                                                            |
| Nom de l’activité courante    | Texte           |               Toujours |         Oui | Première activité                                  | 1 à 80 caractères                                   | Activité    | Aucune                       |                                                            |
| Durée planifiée de l’activité | Texte           |  Activité chronométrée |         Oui | Durée définie                                      | ≥ 1 seconde                                         | Activité    | Aucune                       | Affichée après le nom                                      |
| Libellé Manuel                | Texte           |      Activité manuelle |         Oui | `Manuel`                                           | Remplace la durée                                   | Activité    | Aucune                       |                                                            |
| Cercle de progression         | Indicateur      |               Toujours |         Oui | Cercle complet                                     | Progression continue                                | Séance      | Aucune                       | Rouge / vert / bleu selon le type                          |
| Temps restant de l’activité   | Chronomètre     |  Activité chronométrée |         Oui | Durée planifiée                                    | Secondes entières ; jamais négatif                  | Séance      | Aucune                       | Passage automatique à 0                                    |
| Temps écoulé de l’activité    | Chronomètre     |      Activité manuelle |         Oui | `00:00`                                            | Exclut les périodes de pause                        | Séance      | Aucune                       | Enregistré à l’appui sur Suivant                           |
| Libellé À suivre              | Texte           | Sauf dernière activité |         Non | Activité suivante                                  | Masqué si aucune activité suivante                  | Séance      | Aucune                       |                                                            |
| Nom de l’activité suivante    | Texte           | Sauf dernière activité |         Non | Calculé                                            | 1 à 80 caractères                                   | Activité    | Aucune                       | Aucun Série/Cycle ajouté au libellé                          |
| Durée de l’activité suivante  | Texte           |        Si chronométrée |         Non | Calculée                                           | ≥ 1 seconde                                         | Activité    | Aucune                       | `Manuel` si activité manuelle                              |
| Bouton Réinitialiser          | Bouton          |               Toujours |         Oui | Actif                                              | Réinitialise uniquement l’activité courante         | Statique    | Réinitialiser                | Fonctionne aussi sur les comptes à rebours                 |
| Bouton Pause / Lecture        | Bouton          |               Toujours |         Oui | Lecture avant démarrage, Pause pendant l’exécution | Une seule icône selon l’état                        | Séance      | Démarrer / Pause / Reprendre | La routine ne démarre pas à l’ouverture de l’écran         |
| Bouton Arrêter                | Bouton          |               Toujours |         Oui | Actif                                              | Ouvre une confirmation                              | Statique    | Demander l’arrêt             | Action destructive visuellement distincte                  |
| Bouton Suivant                | Bouton          |               Toujours |         Oui | Actif                                              | Passe à l’activité suivante                         | Séance      | Suivant                      | Une activité chronométrée est alors marquée comme écourtée |
| Indicateur d’accueil          | Élément système |               Toujours |         Oui | Système                                            | Selon appareil                                      | Système     | Aucune                       |                                                            |
### Couleur du minuteur
| Type d’activité          | Couleur du cercle et du chronomètre                   |
| ------------------------ | ----------------------------------------------------- |
| Exercice                 | Rouge                                                 |
| Pause                    | Vert                                                  |
| Récupération             | Bleu                                                  |
| Compte à rebours initial | Couleur neutre ou couleur principale de l’application |
### Sons et annonces
| Événement                         | Comportement             |
| --------------------------------- | ------------------------ |
| Début du compte à rebours initial | Annonce « Soyez prêt »   |
| Trois dernières secondes          | Un bip par seconde       |
| Début d’un exercice               | Annonce « Exercice »     |
| Début d’une pause                 | Annonce « Pause »        |
| Début d’une récupération          | Annonce « Récupération » |
| Changement de Série ou Cycle        | Aucune annonce           |
| Fin de routine                    | Annonce « Bravo ! »      |
### Dialogue : arrêt d'une routine

|Élément affiché|Type|Visible|Obligatoire|Valeur par défaut|Contraintes|Source|Action|Remarques|
|---|---|--:|--:|---|---|---|---|---|
|Fond assombri|Overlay|Dialogue ouvert|Oui|Visible|Bloque les interactions avec l’écran|Statique|Aucune||
|Titre|Texte|Toujours|Oui|`Arrêter la routine ?`|Texte fixe|Statique|Aucune||
|Message|Texte|Toujours|Oui|Message explicatif|Texte fixe|Statique|Aucune|Précise que la séance sera enregistrée comme interrompue|
|Bouton Reprendre|Bouton principal|Toujours|Oui|Actif|Ferme le dialogue|Statique|Reprendre|La séance reste dans son état précédent|
|Bouton Arrêter la routine|Bouton destructif|Toujours|Oui|Actif|Enregistre l’interruption|Statique|Arrêter|Ouvre ensuite la synthèse de séance|
|Fermeture hors dialogue|Interaction|Non|Non|Désactivée|L’utilisateur doit choisir une action|Statique|Aucune|Évite un comportement ambigu|
## Synthèse de séance

### Eléments affichés

| Élément affiché       | Type             |  Visible | Obligatoire | Valeur par défaut                                    | Contraintes                 | Source      | Action         | Remarques                            |
| --------------------- | ---------------- | -------: | ----------: | ---------------------------------------------------- | --------------------------- | ----------- | -------------- | ------------------------------------ |
| Titre de la routine   | Texte            | Toujours |         Oui | Nom de la routine                                    | 1 à 80 caractères           | Routine     | Aucune         | En-tête fixe                         |
| Carte Statut          | Carte            | Toujours |         Oui | Visible                                              | Une seule                   | Séance      | Aucune         |                                      |
| Icône de statut       | Icône            | Toujours |         Oui | ✓                                                    | Terminée ou interrompue     | Séance      | Aucune         | Couleur selon le statut              |
| Libellé du statut     | Texte            | Toujours |         Oui | Séance terminée                                      | Terminée ou interrompue     | Séance      | Aucune         |                                      |
| Date / heure de fin   | Texte            | Toujours |         Oui | Date courante                                        | Format local                | Séance      | Aucune         |                                      |
| Carte Votre séance    | Carte            | Toujours |         Oui | Visible                                              | Une seule                   | Séance      | Aucune         |                                      |
| Durée réelle          | Durée            | Toujours |         Oui | Calculée                                             | Temps réellement exécuté    | Séance      | Aucune         |                                      |
| Nombre d'activités    | Valeur           | Toujours |         Oui | Calculé                                              | X / Y                       | Séance      | Aucune         |                                      |
| Activités écourtées   | Texte            |   Si > 0 |         Non | Masqué                                               | `n activité(s) écourtée(s)` | Séance      | Aucune         | Affiché dans la carte "Votre séance" |
| Question de ressenti  | Texte            | Toujours |         Oui | Texte fixe                                           |                             | Statique    | Aucune         |                                      |
| Mention "Obligatoire" | Texte            | Toujours |         Oui | Visible                                              | Texte fixe                  | Statique    | Aucune         |                                      |
| Choix du ressenti     | Sélecteur        | Toujours |         Oui | Aucun sélectionné                                    | Une seule sélection         | Utilisateur | Sélection      | MVP : 3 niveaux                      |
| Titre Commentaire     | Texte            | Toujours |         Oui | Texte fixe                                           |                             | Statique    | Aucune         |                                      |
| Mention "Facultatif"  | Texte            | Toujours |         Oui | Visible                                              | Texte fixe                  | Statique    | Aucune         |                                      |
| Champ Commentaire     | Texte multiligne | Toujours |         Non | Vide                                                 | 500 caractères max          | Utilisateur | Saisie         |                                      |
| Bouton Terminer       | Bouton           | Toujours |         Oui | Désactivé tant que le ressenti n'est pas sélectionné | Une seule action            | Statique    | Aller au Suivi | Enregistre définitivement la séance  |
### Règles fonctionnelles
| Règle               | Description                                                                      |
| ------------------- | -------------------------------------------------------------------------------- |
| Durée affichée      | Toujours la durée réellement exécutée.                                           |
| Séries / Cycles       | Non affichés dans le MVP.                                                        |
| Activités écourtées | Affichées uniquement si leur nombre est supérieur à zéro.                        |
| Ressenti            | Obligatoire avant de quitter l'écran.                                            |
| Commentaire         | Facultatif.                                                                      |
| Validation          | Le bouton **Terminer** reste désactivé tant qu'aucun ressenti n'est sélectionné. |
| Navigation          | Appui sur **Terminer** → écran **Suivi**.                                        |
| Sauvegarde          | Le ressenti et le commentaire sont enregistrés avec la séance.                   |
| Séance interrompue  | Même écran, avec un statut et une icône adaptés.                                 |
## Profil – Préférences

### Eléments affichés
| Élément affiché                     | Type            |  Visible | Obligatoire | Valeur par défaut          | Contraintes                                | Source      | Action               | Remarques                                   |
| ----------------------------------- | --------------- | -------: | ----------: | -------------------------- | ------------------------------------------ | ----------- | -------------------- | ------------------------------------------- |
| Titre de l'écran                    | Texte           | Toujours |         Oui | Profil                     | Texte fixe                                 | Statique    | Aucune               |                                             |
| Avatar                              | Icône           | Toujours |         Oui | Initiales de l'utilisateur | Image personnalisée en V2                  | Profil      | Modifier le profil   |                                             |
| Nom                                 | Texte           | Toujours |         Oui | Nom de l'utilisateur       | 1 à 80 caractères                          | Profil      | Modifier le profil   |                                             |
| Lien « Modifier le profil »         | Lien            | Toujours |         Oui | Visible                    | V2 : édition complète du profil            | Profil      | Ouvrir l'édition     | MVP : peut rester inactif                   |
| Langue                              | Sélecteur       | Toujours |         Oui | Langue du téléphone        | Langues prises en charge par l'application | Préférences | Changer la langue    | Redémarrage éventuel de l'interface         |
| Sons                                | Interrupteur    | Toujours |         Oui | Activé                     | Booléen                                    | Préférences | Activer / Désactiver | Valeur par défaut des routines              |
| Annonces vocales                    | Interrupteur    | Toujours |         Oui | Activé                     | Booléen                                    | Préférences | Activer / Désactiver | Utilise la voix système                     |
| Vibrations                          | Interrupteur    | Toujours |         Oui | Activé                     | Booléen                                    | Préférences | Activer / Désactiver | Si le téléphone le permet                   |
| Compte à rebours initial par défaut | Sélecteur durée | Toujours |         Oui | 10 s                       | 0 à 99 min 59 s                            | Préférences | Modifier             | Valeur utilisée à la création d'une routine |
| Fin de routine par défaut           | Sélecteur durée | Toujours |         Oui | 0 s                        | 0 à 99 min 59 s                            | Préférences | Modifier             | 0 = désactivée                              |
| Notifications                       | Interrupteur    | Toujours |         Oui | Désactivé                  | Booléen                                    | Préférences | Activer / Désactiver | Fonction inactive dans le MVP               |
### Règles fonctionnelles

| Règle                    | Description                                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Sauvegarde               | Toute modification est enregistrée immédiatement.                                                                                         |
| Paramètres par défaut    | Les valeurs définies ici sont utilisées lors de la création d'une nouvelle routine.                                                       |
| Surcharge                | Une routine peut remplacer les valeurs par défaut (compte à rebours initial et fin de routine).                                           |
| Sons                     | Désactive tous les bips de l'application.                                                                                                 |
| Annonces vocales         | Désactive toutes les annonces vocales sans modifier les bips.                                                                             |
| Vibrations               | Désactive toutes les vibrations générées par l'application.                                                                               |
| Compte à rebours initial | Définit la durée proposée par défaut lors de la création d'une nouvelle routine. Une valeur de 0 s désactive le compte à rebours initial. |
| Fin de routine           | Définit la durée proposée par défaut lors de la création d'une nouvelle routine. Une valeur de 0 s désactive la fin de routine.           |
| Langue                   | Modifie tous les textes et annonces de l'application.                                                                                     |
| Voix                     | La voix utilisée est toujours celle du système d'exploitation. Aucun choix de voix n'est proposé dans le MVP.                             |
| Volume                   | Le volume des annonces dépend exclusivement du réglage du téléphone.                                                                      |
| Notifications            | Les rappels de routines planifiées sont prévus mais inactifs dans le MVP.                                                                 |
| Profil                   | Les informations personnelles n'ont aucune incidence sur les routines existantes.                                                         |
| Retour                   | Quitter l'écran ne demande aucune confirmation, les modifications étant enregistrées automatiquement.                                     |
## Calendrier
## Planifier une routine
## Suivi - Vue d'ensemble
## Suivi - Séances

## Dialogues

| Action | Confirmation | Boutons |
|---|---|---|
| Supprimer une routine | Oui | Annuler / Supprimer |
| Archiver | Non | Snackbar + Annuler |
| Réinitialiser préférences | Oui | Annuler / Réinitialiser |
| Supprimer historique | Oui | Annuler / Supprimer |


## Consolidation qualité v14

### Harmonisation des tableaux
- Tous les écrans du chapitre 08 doivent disposer d'un tableau de définition des champs comprenant : Champ, Description, Valeur par défaut, Contraintes, Visibilité.

### Règles centralisées
Les règles communes (création, suppression, renommage, duplication, historique, snackbar) sont référencées une seule fois et ne doivent plus être répétées dans les sections écran.

### Valeurs par défaut
Chaque paramètre éditable doit posséder une valeur par défaut documentée dans son tableau.

### Visibilité
Chaque champ doit préciser sa règle d'affichage (toujours, conditionnelle, masquée en mode simplifié, etc.).
