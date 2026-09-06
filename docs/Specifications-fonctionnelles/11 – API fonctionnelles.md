## 11.0 Objet et périmètre

Ce chapitre définit les API fonctionnelles internes nécessaires au fonctionnement du MVP.

Une API fonctionnelle décrit une opération mise à disposition des composants de l’application pour manipuler les objets métier et appliquer les règles fonctionnelles.

Pour chaque opération sont précisés :
- son identifiant ;
- son objectif ;
- ses principales données d’entrée ;
- son résultat ;
- ses principales règles et validations ;
- les objets fonctionnels impactés.

Ce chapitre ne définit pas :
- le protocole technique utilisé ;
- les endpoints ;
- les formats d’échange ;
- les codes HTTP ;
- l’architecture des services ;
- le stockage physique des données.

Ces éléments relèvent du chapitre `12 – Architecture technique`.

Les intégrations avec des services externes, notamment les calendriers Apple, Google ou Microsoft et les fournisseurs externes de contenus, ne font pas partie des API internes du MVP décrites dans ce chapitre.

## 11.1 Principes généraux

Les API fonctionnelles respectent les principes suivants :
- une Séance représente un contenu exécutable ;
- une Routine représente la planification d’une Séance ;
- une Exécution représente la réalisation effective d’une Séance ;
- les occurrences futures d’une Routine sont calculées dynamiquement et ne sont pas persistées ;
- une occurrence arrivée à échéance est historisée avec le statut `Exécutée` ou `Non exécutée` ;
- une modification des Préférences globales n’altère pas rétroactivement les objets déjà créés lorsque ces préférences ont été copiées dans ces objets ;
- les règles de validation définies dans les chapitres fonctionnels restent applicables aux opérations décrites ici ;
- une opération ne modifie jamais rétroactivement les données historisées, sauf règle explicite contraire.
- les services applicatifs accèdent aux données via des contrats de Repository et ne dépendent pas directement de SQLite, de Drizzle ORM ou d’un futur fournisseur cloud ;
- les API fonctionnelles restent identiques qu’une donnée soit persistée localement ou, dans une version future, synchronisée avec une source distante.

## 11.2 API Séances

| ID         | Opération                     | Entrées principales                               | Résultat                                        | Règles / validations                                                                                                                          | Objets impactés                                             |
| ---------- | ----------------------------- | ------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| API-SEA-01 | Lister les séances            | Statut, catégorie, tri éventuels                  | Liste des Séances correspondant aux critères, avec Catégories et union dédupliquée des Zones corporelles de tous leurs Exercices | Les Séances archivées ne sont incluses que si demandées ; filtres et tris doivent être valides | Séance, Catégories, Activités, Zones corporelles, lecture |
| API-SEA-02 | Lire une séance               | ID Séance                                         | Séance et composition complète                  | La Séance doit exister                                                                                                                        | Séance, Cycle, Tour, Activités                              |
| API-SEA-03 | Créer une séance              | Brouillon complet : propriétés générales, Composition, Catégories existantes sélectionnées, Catégories `NEW` temporaires et identifiants sélectionnés distincts | Nouvelle Séance complète | Transaction unique : création de la Séance, de sa Composition, des seules nouvelles Catégories sélectionnées et de leurs associations ; aucun objet partiel ni Catégorie orpheline en cas d’échec | Séance, Cycle, Tour, Activités, Catégories, associations |
| API-SEA-04 | Modifier une séance           | ID Séance, valeurs à modifier                     | Séance mise à jour                              | La Séance doit exister ; les Exécutions historisées ne sont pas modifiées                                                                     | Séance                                                      |
| API-SEA-05 | Dupliquer une séance          | ID Séance source                                  | Nouvelle Séance indépendante                    | Nouveaux identifiants pour les objets dupliqués ; aucune Routine ni Exécution n’est dupliquée                                                 | Séance, Cycle, Tour, Activités                              |
| API-SEA-06 | Archiver une séance           | ID Séance, confirmation                           | Séance archivée ; Routines associées supprimées | Les occurrences futures cessent d'être calculées ; occurrences historisées et Exécutions conservées                                           | Séance, Routine                                             |
| API-SEA-07 | Restaurer une séance archivée | ID Séance                                         | Séance au statut `Active`                       | Aucune ancienne Routine n'est restaurée ; toute nouvelle planification nécessite une nouvelle Routine                                         | Séance                                                      |
| API-SEA-08 | Supprimer une séance archivée | ID Séance, confirmation                           | Séance supprimée                                | La Séance doit être archivée ; aucune suppression directe depuis `Toutes` ou `Planifiées` ; Exécutions historiques conservées                 | Séance                                                      |
## 11.3 API Composition d'une séance

| ID         | Opération                              | Entrées principales                                             | Résultat                           | Règles / validations                                                                           | Objets impactés     |
| ---------- | -------------------------------------- | --------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------- |
| API-COM-01 | Initialiser le Cycle technique         | ID Séance                                                        | Cycle créé avec répétition `1`     | Opération interne à la création ; valeur non modifiable et non exposée dans le MVP                           | Cycle               |
| API-COM-02 | Modifier les paramètres du Tour         | ID Tour, nombre de répétitions                                   | Tour mis à jour                     | Nombre de répétitions de **1 à 99**                                                            | Tour                 |
| API-COM-03 | Ajouter une activité                   | Position structurelle éventuelle, type d’Activité, paramètres, position | Nouvelle Activité avec identifiant | Type `Exercice` ou `Récupération` ; première Activité créée par défaut `Avant Tour` ; destination valide parmi `Avant Tour`, `Dans Tour`, `Après Tour` | Activité, Cycle, Tour éventuel |
| API-COM-04 | Modifier une activité                  | ID Activité, valeurs à modifier                                 | Activité mise à jour               | Respect des règles propres à son type ; les Exécutions historisées ne sont pas modifiées       | Activité            |
| API-COM-05 | Supprimer une activité                 | ID Activité                                                     | Activité retirée de la composition | L’Activité doit exister ; les données historiques restent exploitables                         | Activité, conteneur |
| API-COM-06 | Réordonner les activités               | Position structurelle et ordre des Activités                    | Nouvelles positions enregistrées   | Déplacement autorisé entre `Avant Tour`, `Dans Tour` et `Après Tour` ; positions uniques dans chaque zone | Activités, Cycle, Tour |
| API-COM-07 | Paramétrer le compte à rebours initial | ID Séance, durée, texte vocal                                   | Paramètres mis à jour              | Élément toujours présent ; durée ≥ 0 ; une durée de 0 s rend la phase instantanée              | Séance              |
| API-COM-08 | Paramétrer la fin de séance            | ID Séance, durée, texte vocal                                   | Paramètres mis à jour              | Élément toujours présent ; durée ≥ 0 ; la Fin de séance n’est pas une Activité                 | Séance              |
## 11.4 API Activités

|ID|Opération|Entrées principales|Résultat|Règles / validations|Objets impactés|
|---|---|---|---|---|---|
|API-ACT-01|Paramétrer un Exercice|Nom, mode d’exécution, durée ou répétitions, nombre de Séries, pause éventuelle, consigne, zones corporelles|Exercice créé ou mis à jour|Mode `Durée` ou `Répétition` ; valeur obligatoire selon le mode ; nombre de Séries entier ≥ 1 ; aucun média dans le MVP|Activité|
|API-ACT-02|Paramétrer une Récupération|Nom éventuel, durée|Récupération créée ou mise à jour|Type toujours `Récupération` ; nom par défaut `Récupération` ; exécution chronométrée à fin automatique ; durée conforme aux contraintes|Activité|
|API-ACT-03|Définir une pause après Série|ID Exercice, durée ou suppression de la pause|Création, modification ou suppression de la Récupération associée|Un Exercice possède au maximum une Récupération liée pour sa pause ; le plan l’insère après chaque Série et l’omet après la dernière si l’étape suivante est une Récupération explicite|Exercice, Récupération|
|API-ACT-04|Associer un média|—|—|Hors MVP ; future évolution limitée à un média maximum par Activité|—|
|API-ACT-05|Associer des zones corporelles|ID Exercice, zones corporelles|Zones corporelles mises à jour|Disponible uniquement pour un Exercice|Activité, Zone corporelle|
|API-ACT-06|Définir le nombre de Séries|ID Exercice, nombre de Séries|Exercice mis à jour|Entier ≥ 1 ; valeur par défaut 1 à la création ; paramètre propre à l'Exercice ; ne crée aucune entité Série autonome|Activité|
## 11.5 API Routines et Planification

| ID         | Opération                                    | Entrées principales                                                                             | Résultat                                   | Règles / validations                                                                                                                                                    | Objets impactés                            |
| ---------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| API-ROU-01 | Créer une routine                            | Séance, date de début, heure, mode de planification, paramètres hebdomadaires éventuels, rappel | Nouvelle Routine avec identifiant          | Libellé UI `Aucune` ou `Périodique` ; dans le MVP, si `Périodique` : périodicité hebdomadaire, fréquence ≥ 1, au moins un jour sélectionné, date de fin obligatoire ; une Routine définit une seule heure | Routine                                    |
| API-ROU-02 | Lire une routine                             | ID Routine                                                                                      | Routine et paramètres de planification     | La Routine doit exister                                                                                                                                                 | Routine                                    |
| API-ROU-03 | Modifier une routine                         | ID Routine, paramètres à modifier                                                               | Routine mise à jour                        | Les modifications ne concernent que le calcul des occurrences futures ; les occurrences historisées restent inchangées                                                  | Routine                                    |
| API-ROU-04 | Supprimer une routine                        | ID Routine                                                                                      | Routine supprimée et arrêt du calcul futur | Les occurrences déjà historisées sont conservées ; les Exécutions sont conservées ; la Séance n’est pas supprimée                                                       | Routine                                    |
| API-ROU-05 | Calculer les occurrences futures             | Routine, début de période, fin de période                                                       | Occurrences futures calculées              | Les occurrences futures ne sont pas persistées ; le calcul respecte fréquence, jours, date de début et date de fin                                                      | Aucun objet persistant                     |
| API-ROU-06 | Récupérer la prochaine occurrence            | ID Séance ou ID Routine                                                                         | Prochaine date et heure planifiées         | Calcul dynamique ; aucune occurrence future persistée                                                                                                                   | Aucun objet persistant                     |
| API-ROU-07 | Historiser une occurrence arrivée à échéance | Routine, Séance, date/heure prévues, Exécution éventuelle                                       | Occurrence historisée                      | Si une Exécution existe : statut `Exécutée` ; sinon : `Non exécutée`                                                                                                    | Occurrence planifiée, Exécution éventuelle |
| API-ROU-08 | Définir ou supprimer le rappel local          | ID Routine, délai de rappel ou absence de rappel                                                 | Rappel local planifié, modifié ou supprimé | Lors de la première activation d’un rappel, demander l’autorisation système ; en cas de refus, ne pas activer le rappel ; aucune notification distante dans le MVP | Routine, Préférences globales |
### Règles de gestion des occurrences

Les occurrences futures sont calculées dynamiquement à partir des paramètres de la Routine et ne sont pas persistées.

Lorsqu’une occurrence arrive à échéance :
- elle est historisée ;
- son statut est `Exécutée` si une Exécution associée a été démarrée ;
- son statut est `Non exécutée` si aucune Exécution n’a été démarrée.

La modification ou la suppression d’une Routine :
- ne modifie jamais les occurrences déjà historisées ;
- ne modifie jamais les Exécutions déjà enregistrées.

Une même Séance peut être associée à plusieurs Routines afin de permettre plusieurs horaires ou règles de planification distincts.

## 11.6 API Exécution

| ID         | Opération                         | Entrées principales              | Résultat                                                                  | Règles / validations                                                                                                                                | Objets impactés                  |
| ---------- | --------------------------------- | -------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| API-EXE-01 | Démarrer une séance               | ID Séance, occurrence éventuelle | Nouvelle Exécution positionnée au Compte à rebours initial                | La Séance démarre toujours par le Compte à rebours initial ; aucune Exécution n’est enregistrée si l’utilisateur quitte avant le démarrage effectif | Exécution, Occurrence éventuelle |
| API-EXE-02 | Mettre en pause                   | ID Exécution                     | Exécution suspendue                                                       | Exécution en cours requise                                                                                                                          | Exécution                        |
| API-EXE-03 | Reprendre                         | ID Exécution                     | Exécution reprise                                                         | Exécution suspendue requise                                                                                                                         | Exécution                        |
| API-EXE-04 | Réinitialiser l’activité courante | ID Exécution, confirmation       | Activité courante recommencée                                             | Confirmation obligatoire ; uniquement l’Activité courante ; aucun retour arrière                                                                    | Exécution                        |
| API-EXE-05 | Passer à l’activité suivante      | ID Exécution, confirmation éventuelle | Activité courante clôturée, suivante activée                              | Destination imposée par l’ordre d’exécution ; pour une Activité chronométrée passée avant son terme, confirmation obligatoire et résultat `Partielle` ; pour un Exercice en mode Répétition, `Activité suivante` constitue une fin normale sans confirmation ; aucun retour à une étape précédente | Exécution |
| API-EXE-06 | Arrêter l’exécution               | ID Exécution, confirmation       | Exécution clôturée                                                        | Arrêt disponible depuis l’état Pause ; après confirmation, l’Exécution est clôturée avec le statut `Interrompue` et la Synthèse est ouverte                                                          | Exécution                        |
| API-EXE-07 | Terminer l’exécution              | ID Exécution                     | Exécution terminée et résultats enregistrés                               | La Fin de séance a été atteinte selon le plan d’exécution                                                                                           | Exécution, Occurrence éventuelle |
| API-EXE-08 | Obtenir l’état courant            | ID Exécution                     | Étape courante, progression, état temporel courant, prochaine étape | L’état temporel fournit le temps restant pour une Activité chronométrée et le temps écoulé pour un Exercice en mode Répétition ; valeurs calculées à partir de l’état courant de l’Exécution                                                                                         | Exécution, lecture               |
| API-EXE-09 | Gérer une suspension prolongée     | ID Exécution, durée de suspension, réponse utilisateur éventuelle | Exécution reprise ou clôturée avec le statut `Interrompue` | à partir de 30 minutes consécutives en pause, l’application demande si l’utilisateur souhaite reprendre ; si oui, reprise à l’activité interrompue ; en l’absence de réponse, clôture automatique au statut `Interrompue` | Exécution |
| API-EXE-10 | Réconcilier une Exécution après interruption technique | ID Exécution, choix `Reprendre` ou `Arrêter` | Exécution reprise ou clôturée `Interrompue` | Aucune nouvelle Exécution tant que la réconciliation n’est pas faite | Exécution |
| API-EXE-11 | Enregistrer la Synthèse | ID Exécution, Ressenti, Commentaire éventuel | Exécution finalisée et données de Synthèse enregistrées | Ressenti obligatoire si Synthèse présentée ; Commentaire ≤ 200 caractères | Exécution |

### Règles de navigation pendant l’exécution

Une Séance démarre toujours par le Compte à rebours initial.

L’utilisateur ne peut :
- ni choisir arbitrairement l’étape de démarrage ;
- ni sélectionner directement une autre étape ;
- ni revenir à une étape déjà exécutée.

Il peut uniquement :
- poursuivre l’enchaînement normal ;
- réinitialiser l’Activité courante après confirmation ;
- passer à l’étape suivante.

Une étape terminée ou passée ne peut pas être rejouée au cours de la même Exécution.

## API 11.7 Historique et Suivi

| ID         | Opération                         | Entrées principales        | Résultat                                                         | Règles / validations                                                                                          | Objets impactés                          |
| ---------- | --------------------------------- | -------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| API-HIS-01 | Consulter l’historique            | Aucun critère MVP | Exécutions ordonnées du plus récent au plus ancien | Les occurrences `Non exécutée` ne sont pas exposées ; `Vue d’ensemble`, `Filtrer` et `Trier` sont visibles mais désactivés | Occurrence planifiée, Exécution, lecture |
| API-HIS-02 | Lire une exécution                | ID Exécution               | Détail de l’Exécution                                            | Les informations correspondent aux données historisées au moment de l’Exécution                               | Exécution, lecture                       |
| API-HIS-03 | Lire une occurrence historisée    | ID Occurrence              | Détail de la planification passée et de son statut               | Une occurrence `Exécutée` peut référencer une Exécution ; une occurrence `Non exécutée` n’en référence aucune | Occurrence planifiée, lecture            |
### Périmètre du Suivi dans le MVP

Le MVP expose la liste chronologique des Séances/Exécutions et leur détail. Les tableaux de bord, graphiques, comparaisons de périodes et indicateurs analytiques avancés ne font pas partie des API fonctionnelles du MVP. Ils seront spécifiés dans une version ultérieure à partir des données historisées.

### Conservation de l’historique

Les modifications ultérieures d’une Séance ou d’une Routine ne doivent pas rendre illisibles les Exécutions et occurrences déjà historisées.

Chaque Exécution repose sur un **Instantané fonctionnel immuable** créé au démarrage. Cet instantané conserve les informations nécessaires pour restituer fidèlement la Séance exécutée, sans dupliquer les médias.

Le choix du format et du mode de persistance de cet instantané relève du chapitre `12 – Architecture technique`.

## 11.8 API Préférences globales

| ID         | Opération                         | Entrées principales | Résultat                                            | Règles / validations                                                                                                                                     | Objets impactés               |
| ---------- | --------------------------------- | ------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| API-PRE-01 | Lire les préférences globales     | Profil courant      | Préférences de création, planification et exécution | Retourne les valeurs actuellement applicables                                                                                                            | Préférences globales, lecture |
| API-PRE-02 | Modifier les préférences globales | Valeurs à modifier  | Préférences mises à jour                            | Les nouvelles valeurs par défaut ne modifient pas rétroactivement les Séances et Routines existantes lorsque ces valeurs ont été copiées à leur création | Préférences globales          |
## 11.9 Référentiels

| ID         | Opération                     | Entrées principales             | Résultat                                    | Règles / validations                                            | Objets impactés          |
| ---------- | ----------------------------- | ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- | ------------------------ |
| API-REF-01 | Lister les catégories         | Aucun ou filtre éventuel        | Liste des catégories                        | Prédéfinies selon `displayOrder`, puis personnalisées par date de création croissante | Catégorie, lecture       |
| API-REF-02 | Créer une catégorie           | Nom et propriétés éventuelles   | Nouvelle catégorie                          | Respect des contraintes d’unicité ; dans le parcours de création d’une Séance, l’opération reste dans le brouillon et est persistée par `API-SEA-03` | Catégorie                |
| API-REF-03 | Modifier une catégorie        | ID Catégorie, nouvelles valeurs | Catégorie mise à jour                       | La Catégorie doit exister                                       | Catégorie                |
| API-REF-04 | Supprimer une catégorie       | ID Catégorie, confirmation si utilisée | Catégorie supprimée | Si utilisée, elle est retirée des Séances concernées ; les Instantanés historiques restent inchangés | Catégorie, Séance |
| API-REF-05 | Lister les zones corporelles  | Aucun                           | Liste des zones corporelles | Retourne le référentiel prédéfini des Zones corporelles | Zone corporelle, lecture |
## 11.10 Conventions fonctionnelles de gestion des erreurs

Toute API fonctionnelle doit retourner soit un résultat valide, soit une erreur fonctionnelle explicite.

Une erreur fonctionnelle comporte au minimum :
- un **code stable**, destiné à l’application ;
- un **message utilisateur**, compréhensible et non technique ;
- éventuellement le **champ ou l’objet concerné** lorsque l’erreur est liée à une donnée précise.

Les erreurs sont classées selon les catégories suivantes :

| Catégorie | Usage | Exemple |
|---|---|---|
| `VALIDATION` | Une donnée fournie ne respecte pas une règle fonctionnelle | fréquence hebdomadaire < 1 |
| `NOT_FOUND` | L’objet demandé n’existe pas ou n’est plus disponible | Séance inexistante |
| `INVALID_STATE` | L’opération n’est pas autorisée dans l’état courant de l’objet | reprendre une Exécution non suspendue |
| `CONFLICT` | L’opération créerait une incohérence avec les données existantes | création d’une catégorie avec un nom déjà utilisé |
| `PERMISSION` | L’utilisateur n’est pas autorisé à effectuer l’opération | réservé aux évolutions avec gestion des comptes |
| `TECHNICAL` | Une erreur technique empêche l’opération | stockage indisponible |

Les codes d’erreur sont stables et indépendants du texte affiché à l’utilisateur.

Une erreur technique ne doit jamais exposer directement à l’utilisateur des informations internes telles qu’une trace d’exception, un chemin de fichier, une requête ou une information sensible.

Les erreurs de validation doivent être détectées avant toute modification persistante lorsque cela est possible.

Une opération qui échoue ne doit pas laisser les données dans un état partiellement modifié.

Lorsqu’une opération comporte plusieurs modifications liées, celles-ci doivent être considérées fonctionnellement comme une seule opération : soit l’ensemble réussit, soit aucune modification n’est conservée.

Les codes d’erreur suivent une convention lisible et stable, par exemple :
- `SESSION_NOT_FOUND`
- `ROUTINE_INVALID_FREQUENCY`
- `EXECUTION_INVALID_STATE`
- `CATEGORY_ALREADY_EXISTS`

La liste exhaustive des codes d’erreur est établie au cours de l’implémentation à partir des règles fonctionnelles définies dans la documentation.

Les détails techniques de représentation des erreurs, notamment les exceptions, objets de résultat, codes de transport ou mécanismes de journalisation, sont définis dans le chapitre `12 – Architecture technique`.

## 11.11 Contrats internes et découpage des services

Les API fonctionnelles définies dans ce chapitre constituent les contrats internes de l’application. Elles ne préjugent pas d’une exposition sous forme d’API réseau.

Dans le MVP :
- les opérations sont mises en œuvre par des services applicatifs internes ;
- les échanges entre composants utilisent des objets typés dérivés du modèle de données fonctionnel ;
- aucun protocole réseau ni format d’API externe n’est imposé pour les échanges internes ;
- les protocoles réseau, formats d’échange et contrats d’intégration seront définis lorsqu’une fonction nécessitera effectivement un backend ou un service externe.

Le découpage logique initial des services est le suivant :

| Service | Responsabilité |
|---|---|
| `SessionService` | Gestion des Séances et de leur cycle de vie |
| `CompositionService` | Gestion des Cycles, Tours et Activités |
| `PlanningService` | Gestion des Routines et calcul des occurrences |
| `ExecutionService` | Plan d’exécution, progression et commandes d’exécution |
| `HistoryService` | Exécutions, Instantanés et historique |
| `PreferencesService` | Préférences globales |
| `ReferenceDataService` | Catégories et Zones corporelles |

Ce découpage représente des responsabilités logiques au sein de l’application et n’implique pas la création de services réseau ou de serveurs distincts.

## 11.12 API externes et évolutions futures

Les interfaces externes suivantes ne font pas partie du périmètre des API internes du MVP mais constituent des extensions possibles :

- synchronisation avec les calendriers Apple, Google et Microsoft ;
- import de contenus externes associés aux exercices ;
- intégration de bibliothèques externes de vidéos ou médias ;
- échanges avec des kinésithérapeutes ou coachs ;
- réception ou partage de Séances et programmes ;
- synchronisation multi-appareils ou avec un service cloud ;
- exposition future d’API permettant à des solutions tierces d’interagir avec l’application.

Ces intégrations feront l’objet de spécifications dédiées lorsqu’elles entreront dans le périmètre d’une version du produit.

## Compléments de cohérence MVP

- Une Exécution lancée depuis une occurrence planifiée conserve le lien avec cette occurrence et la date/heure initialement prévues.
- L’Instantané d’Exécution est un JSON immuable ; les champs nécessaires à la recherche et au tri chronologique du Suivi MVP sont accessibles efficacement. Les index dédiés aux filtres avancés sont reportés avec cette évolution.
- Les API Média sont hors MVP ; leur future introduction sera limitée à un média par Activité.
