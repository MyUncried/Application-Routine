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
- une Séance représente un contenu exécutable ; dans le MVP T03, une Activité persistante valide peut aussi constituer directement une source d’Exécution ;
- une Routine représente la planification d’une Séance ;
- une Exécution représente la réalisation effective d’une source `SESSION` ou `ACTIVITY` ;
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
| API-SEA-01 | Lister les séances            | Statut, catégorie, tri éventuels                  | Liste des Séances correspondant aux critères, avec Catégories, union dédupliquée des Zones corporelles et Durée synthétique des Activités | La durée retournée pour le Catalogue exclut toujours le Compte à rebours initial et la Fin de séance ; les Séances archivées ne sont incluses que si demandées ; filtres et tris doivent être valides | Séance, Catégories, Activités, Zones corporelles, lecture |
| API-SEA-02 | Lire une séance               | ID Séance                                         | Séance et composition complète                  | La Séance doit exister                                                                                                                        | Séance, Cycle, Tour, Activités                              |
| API-SEA-03 | Créer une séance              | Brouillon complet : propriétés générales, Composition, Catégories existantes sélectionnées, Catégories `NEW` temporaires et identifiants sélectionnés distincts | Nouvelle Séance complète | Transaction unique : création de la Séance, de sa Composition, des seules nouvelles Catégories sélectionnées et de leurs associations ; aucun objet partiel ni Catégorie orpheline en cas d’échec | Séance, Cycle, Tour, Activités, Catégories, associations |
| API-SEA-04 | Modifier une séance           | ID Séance, valeurs à modifier                     | Séance mise à jour                              | La Séance doit exister ; les Exécutions historisées ne sont pas modifiées                                                                     | Séance                                                      |
| API-SEA-05 | Dupliquer une séance          | ID Séance source                                  | Nouvelle Séance indépendante                    | Nouveaux identifiants ; nom `{nom} (copie)` puis suffixe numéroté disponible ; copie de la couleur, des Catégories, de la Composition et des paramètres ; aucune Routine ni Exécution n’est dupliquée | Séance, Cycle, Tour, Activités |
| API-SEA-06 | Archiver une séance           | ID Séance, confirmation conditionnelle            | Séance archivée ; Routines associées supprimées | Aucune confirmation si 0 Routine associée ; confirmation explicite obligatoire si ≥ 1 Routine associée, avant archivage et suppression de ces Routines ; les occurrences futures cessent d'être calculées ; occurrences historisées et Exécutions conservées | Séance, Routine |
| API-SEA-07 | Restaurer une séance archivée | ID Séance                                         | Séance au statut `Active`                       | Aucune ancienne Routine n'est restaurée ; toute nouvelle planification nécessite une nouvelle Routine                                         | Séance                                                      |
| API-SEA-08 | Supprimer une séance archivée | ID Séance, confirmation                           | Séance supprimée                                | La Séance doit être archivée ; aucune suppression directe d’une Séance active ; Exécutions historiques conservées                              | Séance                                                      |
## 11.3 API Composition d'une séance

| ID         | Opération                              | Entrées principales                                             | Résultat                           | Règles / validations                                                                           | Objets impactés     |
| ---------- | -------------------------------------- | --------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------- |
| API-COM-01 | Initialiser le Cycle technique         | ID Séance                                                        | Cycle créé avec répétition `1`     | Opération interne à la création ; valeur non modifiable et non exposée dans le MVP                           | Cycle               |
| API-COM-02 | Modifier les paramètres du Tour         | ID Tour, nombre de répétitions                                   | Tour mis à jour                     | Nombre de répétitions de **1 à 99**                                                            | Tour                 |
| API-COM-03 | Ajouter une activité                   | Position structurelle éventuelle, paramètres, position | Nouvelle Activité avec identifiant | Aucun type d’Activité ; première Activité créée par défaut `Avant Tour` ; destination valide parmi `Avant Tour`, `Dans Tour`, `Après Tour` | Activité, Cycle, Tour éventuel |
| API-COM-04 | Modifier une activité                  | ID Activité, valeurs à modifier                                 | Activité mise à jour               | Respect des règles du mode et des paramètres ; les Exécutions historisées ne sont pas modifiées | Activité            |
| API-COM-05 | Supprimer une activité                 | ID Activité                                                     | Activité retirée de la composition | L’Activité doit exister ; les données historiques restent exploitables                         | Activité, conteneur |
| API-COM-06 | Réordonner les activités               | ID Activité déplacée, position structurelle cible et ordre cible | Nouvelles positions enregistrées   | L’appui long ne persiste rien ; l’opération est appelée uniquement à la dépose dans une destination valide. Déplacement autorisé entre `Avant Tour`, `Dans Tour` et `Après Tour` ; positions uniques dans chaque zone | Activités, Cycle, Tour |
| API-COM-07 | Paramétrer le compte à rebours initial | ID Séance, durée, texte vocal                                   | Paramètres mis à jour              | Élément toujours présent ; durée ≥ 0 ; une durée de 0 s rend la phase instantanée              | Séance              |
| API-COM-08 | Paramétrer la fin de séance            | ID Séance, durée, texte vocal                                   | Paramètres mis à jour              | Élément toujours présent ; durée ≥ 0 ; la Fin de séance n’est pas une Activité                 | Séance              |
| API-COM-09 | Ajouter un Point d’arrêt                 | ID Séance, position structurelle cible                          | Nouveau Point d’arrêt positionné    | Uniquement entre deux unités exécutables ; jamais en première/dernière position ni adjacent à un autre Point d’arrêt ; insertion initiale après la dernière Activité créée si aucune position explicite n’est fournie | Point d’arrêt, Composition |
| API-COM-10 | Supprimer un Point d’arrêt               | ID Point d’arrêt                                                | Point d’arrêt retiré                | Le marqueur doit exister ; aucune Activité ni donnée historique n’est supprimée                 | Point d’arrêt, Composition |
| API-COM-11 | Réordonner un Point d’arrêt              | ID Point d’arrêt, position structurelle cible et ordre cible    | Nouvelle position enregistrée       | Déplacement uniquement vers une transition valide ; dans un Tour, le marqueur reste dans la séquence répétée | Point d’arrêt, Cycle, Tour éventuel |
### Création contextuelle depuis les Catalogues

Le contrôle `Créer` n’appelle aucun service de sélection intermédiaire : le Catalogue courant détermine directement le parcours de création cible. `Activités` initialise la création d’une `ActivityDefinition`; `Séances` initialise une nouvelle Composition. Les Circuits restent hors périmètre fonctionnel T03.

## 11.4 API Activités

|ID|Opération|Entrées principales|Résultat|Règles / validations|Objets impactés|
|---|---|---|---|---|---|
|API-ACT-01|Paramétrer une Activité|Nom, description éventuelle, mode d’exécution, durée ou répétitions éventuelles, nombre de Séries, Pause, Récupération, zones corporelles|Activité créée ou mise à jour|Mode `Durée`, `Répétitions` ou `À l’échec` ; valeur obligatoire uniquement selon le mode ; nombre de Séries entier de 1 à 99 ; Pause et Récupération ≥ 0 ; aucun média fonctionnel dans le MVP|Activité|
|API-ACT-02|Calculer les paramètres temporels|Durée `A`, Pause `B`, Séries `C`, Récupération `R`, `sideMode`, pilote et Durée totale cible éventuelle|Séries canoniques et Durée totale réalisable|Avec `L = 1` ou `2` et `P(C,R) = C` si `R = 0`, sinon `C − 1`, pilote Séries : `D = L × [C × A + P(C,R) × B] + R`. Pilote Durée totale : `Cth = D/[L × (A+B)]` si `R = 0`, sinon `Cth = ((D − R) / L + B)/(A + B)`, arrondi au plus proche avec `.5` vers le haut, minimum `1`, puis recalcul de `D`|Activité, calcul sans entité supplémentaire|
|API-ACT-03|Définir Pause et Récupération|ID Activité, durée de Pause, durée de Récupération|Activité mise à jour|`C` Pauses par côté si `R = 0`, y compris après la dernière Série, sinon `C − 1`; Récupération positive remplaçant la dernière Pause et exécutée une fois après tous les côtés d’une Activité autonome ou une fois par passage de Tour bilatéral|Activité|
|API-ACT-04|Associer un média|—|—|Hors MVP ; V2 autorise `0..n` associations ordonnées par Activité|—|
|API-ACT-05|Associer des zones corporelles|ID Activité, zones corporelles|Zones corporelles mises à jour|Zéro à plusieurs zones du référentiel prédéfini|Activité, Zone corporelle|
|API-ACT-06|Définir le nombre de Séries|ID Activité, nombre de Séries|Activité mise à jour|Entier de 1 à 99 ; valeur par défaut 1 ; valeur canonique persistée ; ne crée aucune entité Série autonome|Activité|
|API-ACT-07|Dupliquer une Activité de Séance|ID Activité source|Nouvelle Activité de Séance indépendante|Nouvel identifiant ; nom avec suffixe `(copie)` puis numéroté disponible ; copie du mode, de la Description, des paramètres dont Pause et Récupération, des Zones corporelles et des associations média ; insertion immédiatement après la source dans la même zone ; aucune création dans le catalogue|Activité, Composition, associations Média|
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
| API-ROU-09 | Préparer la duplication d’une Routine         | ID Routine source                                                                                | Brouillon de Routine prérempli ouvert en modification | Reprend la même Séance et tous les paramètres de planification ; ne persiste aucune Routine avant validation explicite par API-ROU-01 | Brouillon de Routine |
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
| API-EXE-04 | Réinitialiser l’étape courante | ID Exécution, confirmation | Activité, Série ou Récupération courante recommencée | Confirmation obligatoire ; pendant `RECOVERY`, seul le chronomètre de Récupération repart du début et l’action est libellée `Réinitialiser la récupération` ; aucun Résultat antérieur n’est modifié | Exécution |
| API-EXE-05 | Actionner `Suivant` | ID Exécution, confirmation éventuelle | Série, Activité ou Récupération courante clôturée, suite activée | Pour une Activité chronométrée ou une phase `RECOVERY` avant zéro, confirmation obligatoire ; l’Activité quittée avant zéro est `Partielle`, tandis qu’une Récupération quittée avant zéro conserve l’Activité terminée et enregistre `recoveryElapsedSeconds` partiel ; en Répétitions ou À l’échec, `Suivant` termine normalement la Série sans confirmation | Exécution |
| API-EXE-06 | Arrêter l’exécution               | ID Exécution, confirmation       | Exécution clôturée                                                        | Arrêt disponible depuis l’état Pause ; après confirmation, l’Exécution est clôturée avec le statut `Interrompue` et la Synthèse est ouverte                                                          | Exécution                        |
| API-EXE-07 | Terminer l’exécution              | ID Exécution                     | Exécution terminée, statut déterminé, résultats enregistrés et écran de sortie applicable ouvert | L’étape `SESSION_END` doit être achevée ; si sa durée vaut `0 s`, l’achèvement est immédiat. T04 ouvre la fin minimale ; la Synthèse n’est ouverte que par la tranche qui la livre. Un arrêt avant cet achèvement relève d’API-EXE-06 et produit le statut `Interrompue` | Exécution, Occurrence éventuelle |
| API-EXE-08 | Obtenir l’état courant            | ID Exécution                     | Étape courante, progression, temps total écoulé, Durée estimée d’exécution, état temporel courant, prochaine étape et éventuelle suspension d’auto-enchaînement par Point d’arrêt | Le temps total écoulé inclut les phases effectivement exécutées, dont Pauses entre Séries, `RECOVERY`, Compte à rebours initial et Fin de séance, et exclut les Pauses manuelles ainsi que le temps d’attente aux Points d’arrêt ; l’état temporel fournit le temps restant pour une Activité chronométrée ou `RECOVERY` et le temps écoulé pour une Activité en Répétitions ou À l’échec | Exécution, lecture |
| API-EXE-09 | Gérer une suspension prolongée     | ID Exécution, durée de suspension, réponse utilisateur éventuelle | Exécution reprise ou clôturée avec le statut `Interrompue` | à partir de 30 minutes consécutives en pause, l’application demande si l’utilisateur souhaite reprendre ; si oui, reprise à l’activité interrompue ; en l’absence de réponse, clôture automatique au statut `Interrompue` | Exécution |
| API-EXE-10 | Réconcilier une Exécution après interruption technique | ID Exécution, choix `Reprendre` ou `Arrêter` | Exécution reprise ou clôturée `Interrompue` | Aucune nouvelle Exécution tant que la réconciliation n’est pas faite | Exécution |
| API-EXE-11 | Enregistrer la Synthèse | ID Exécution, Ressenti, Commentaire éventuel | Exécution finalisée et données de Synthèse enregistrées | Ressenti obligatoire si Synthèse présentée ; Commentaire ≤ 200 caractères | Exécution |

### Règle Point d’arrêt pendant l’Exécution

Le Point d’arrêt ne crée pas une opération d’Exécution autonome ni un écran propre. Lorsqu’un marqueur est rencontré, `ExecutionService` prépare l’unité exécutable suivante et expose son écran normal, mais bloque son démarrage automatique. La reprise correspond ensuite au démarrage normal de cette unité. Le Point d’arrêt lui-même ne produit ni Résultat ni durée planifiée. Le temps entre l’affichage de l’unité suivante et son démarrage effectif après un Point d’arrêt est exclu du temps total écoulé et de la Durée réelle de la Séance ou du Circuit.

### Règles de navigation pendant l’exécution

Une Séance démarre toujours par le Compte à rebours initial.

Lorsqu’un Point d’arrêt de la Composition est atteint, aucune nouvelle API de pause utilisateur n’est déclenchée : l’unité suivante devient la prochaine unité affichée mais son démarrage automatique est suspendu. La reprise utilise la commande normale de cette unité ; le Point d’arrêt n’est pas un état temporel chronométré.

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

Chaque Exécution repose sur un **Instantané fonctionnel immuable** créé au démarrage. Cet instantané conserve les informations nécessaires pour restituer fidèlement la Séance exécutée et, en V2, les associations et références média stables, sans dupliquer les fichiers physiques.

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
| API-REF-02 | Créer une catégorie           | Nom                              | Nouvelle catégorie                          | Respect des contraintes d’unicité ; icône KODJO et couleur blanche DSF attribuées automatiquement et non modifiables dans le MVP ; dans le parcours de création d’une Séance, l’opération reste dans le brouillon et est persistée par `API-SEA-03` | Catégorie |
| API-REF-03 | Modifier une catégorie        | ID Catégorie, nouveau nom        | Catégorie mise à jour                       | La Catégorie doit exister ; l’icône et la couleur ne sont pas modifiables dans le MVP | Catégorie |
| API-REF-04 | Supprimer une catégorie — MVP bis | ID Catégorie, confirmation si utilisée | Catégorie supprimée | Si utilisée, elle est retirée des Séances concernées ; les Instantanés historiques restent inchangés | Catégorie, Séance |
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
- Les API Média sont hors MVP ; leur introduction en V2 accepte `0..n` médias ordonnés par Activité.

## 11.13 API du Catalogue des Activités, des Médias et des Circuits

| API | Version | Entrée principale | Résultat / règle |
|---|---|---|---|
| `API-ACT-REF-01..05` | MVP T03 | définition d’Activité | Créer, lire, lister, modifier, archiver/supprimer une référence autonome. |
| `API-ACT-COPY-01` | MVP T03 | ID référence, ID Séance, position | Crée une copie complète indépendante ; aucune association fonctionnelle durable à la référence. |
| `API-MED-01..05` | V2 | activité, fichier ou position | Capturer/choisir, associer, lister, réordonner et retirer `0..n` médias ; nettoyage physique seulement sans référence. |
| `API-CAT-01` | MVP T03 / V2 | type, filtre, tri | Avant T03, accepte uniquement `SESSION`; dans le MVP T03, accepte également `ACTIVITY`; `CIRCUIT` reste hors MVP. Défaut : non archivés, dernière modification décroissante. |
| `API-CIR-01..06` | V2 | Circuit et étapes | Créer, lire, modifier, lister, archiver/supprimer et lancer manuellement un Circuit. |
| `API-CIR-EXE-01` | V2 | ID Circuit | Fige l’instantané et crée l’Exécution globale. |
| `API-CIR-EXE-02` | V2 | ID Exécution | Termine une étape et ouvre la transition manuelle/automatique. |
| `API-CIR-EXE-03` | V2 | ID Exécution, confirmation | Interrompt le Circuit et l’étape courante ; conserve les résultats existants. |

`API-EXE-05` couvre aussi `TO_FAILURE` : comme pour `REPETITIONS`, `Suivant` constitue une fin normale de Série sans confirmation. Les DTO d’Activité acceptent `DURATION`, `REPETITIONS`, `TO_FAILURE` et appliquent les contraintes d’exclusivité du chapitre 09.

## API de bilatéralité

| ID | Commande | Entrée | Effet et garanties |
|---|---|---|---|
| `API-SIDE-01` | Modifier le côté d’une Activité | ID, `sideMode` | Valide les trois valeurs ; recalcule les durées et synthèses ; interdit l’action si l’Activité appartient à un Tour bilatéral. |
| `API-SIDE-02` | Modifier le côté d’un Tour | ID, `sideMode`, confirmation seulement si requise | Au passage de `UNILATERAL` à un mode bilatéral, recherche les Activités propres `RIGHT_LEFT` ou `LEFT_RIGHT`. Liste vide : applique directement. Liste non vide : `Annuler` n’écrit rien ; `Confirmer` met à jour atomiquement le Tour et remet les seules Activités concernées à `UNILATERAL`. Aucune propriété « latéralisable ». |
| `API-SIDE-03` | Dupliquer | ID Activité ou Tour | Copie fidèlement `sideMode`, ainsi que le contenu dupliqué selon les règles existantes. |
| `API-SIDE-04` | Insérer une Activité persistante | ID source, ID Séance | Copie `sideMode` dans l’occurrence ; aucun lien dynamique ultérieur. |
| `API-EXE-SIDE-01` | Générer le Plan | Instantané de Séance | Résout `effectiveSideMode`, développe côtés/Séries/Tours/Récupérations et produit un ordre déterministe. |
| `API-EXE-SIDE-02` | Enregistrer un passage | Nœud de plan, côté, résultat | Écriture idempotente séparée par `executionSide`; agrégation du statut global. |
| `API-EXE-SIDE-03` | Réinitialiser | Nœud et côté courant | Efface ou recommence uniquement le résultat du passage courant. |
| `API-EXE-SIDE-04` | Passer à la suite | Nœud, confirmation éventuelle | Utilise la modale générique ; après le premier côté, ouvre le second avant l’Activité logique suivante. |

## 11.14 Exécution directe d’une Activité — MVP T03

| ID | Service | Entrée | Sortie | Règles |
|---|---|---|---|---|
| API-ACT-EXE-01 | Vérifier l’éligibilité | ID Activité | Éligible ou erreurs | Validation complète de la définition. |
| API-ACT-EXE-02 | Démarrer | ID Activité, état de retour Catalogue | ID Exécution, plan | Instantané autonome, origine `ACTIVITY`, préparation `5 s`, aucune Séance créée. |
| API-ACT-EXE-03 | Construire le plan | Instantané Activité | Étapes développées | Séries, Pauses, côtés et Récupération ; aucune étape `SESSION_END`. |
| API-ACT-EXE-04 | Finaliser la Synthèse | ID Exécution, Ressenti, Commentaire éventuel | Exécution finalisée | Ressenti obligatoire si Synthèse présentée ; statistiques compatibles mises à jour. |
| API-ACT-EXE-05 | Obtenir la destination de sortie | ID Exécution | État Catalogue | Recherche, filtres et position restaurés. |

Les services d’exécution communs acceptent une origine discriminante `SESSION | ACTIVITY`. Ils ne doivent jamais fabriquer une Séance pour satisfaire leurs contrats historiques.


## 11.15 Sélection multiple d’Activités existantes — MVP T03

`CompositionService` reçoit les identifiants sélectionnés dans l’ordre courant de présentation produit par la liste filtrée au moment de la validation. Il crée une copie indépendante de chaque `ActivityDefinition` dans cet ordre, en une seule opération de composition. L’ordre temporel des touchers ne fait pas partie du contrat et ne doit pas être persisté.

| Contrat | Entrée | Sortie | Règle |
|---|---|---|---|
| `API-COMP-SEL-01` | IDs d’Activités ordonnés selon la liste visible, position d’insertion | Références de composition créées | Conserve strictement l’ordre fourni ; aucune modification des définitions persistantes sources. |
| `API-COMP-SEL-02` | Sélection vide | Aucune écriture | L’action de validation reste désactivée. |
| `API-COMP-SEL-03` | Erreur pendant la copie groupée | Erreur fonctionnelle, Composition inchangée | L’insertion est atomique ; aucun sous-ensemble ne reste inséré. |
