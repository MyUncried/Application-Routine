## 11.0 Objet et périmètre

> Planification à plusieurs contenus (08/10) : les règles antérieures d’archivage supprimant les Routines associées restent décrites pour le cas à contenu unique. Leur extension à une Routine contenant d’autres contenus est **non définie** ; ne pas supprimer ces autres planifications par généralisation. Voir la chapitre 08, Planification.

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
- une Séance représente un contenu exécutable ; dans le MVP T03, un Exercice persistant valide peut aussi constituer directement une source d’Exécution ;
- Une Routine porte une liste ordonnée de références SESSION/ACTIVITY ; API-ROU définit le contrat cible multi-contenus .
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
| API-SEA-01 | Lister les séances            | Statut, étiquette, tri éventuels                  | Liste des Séances correspondant aux critères, avec Étiquette et métadonnées d’Exercices utiles au Catalogue | La durée retournée pour le Catalogue exclut toujours le Compte à rebours initial et la Fin de séance ; les Séances archivées ne sont incluses que si demandées ; filtres et tris doivent être valides | Séance, Catégories, Exercices, Zones corporelles, lecture |
| API-SEA-02 | Lire une séance               | ID Séance                                         | Séance et composition complète                  | La Séance doit exister                                                                                                                        | Séance, Cycle, Tour, Exercices                              |
| API-SEA-03 | Créer une séance              | Brouillon complet : propriétés générales, Étiquette, Composition | Nouvelle Séance complète | Transaction unique ; aucun objet partiel en cas d’échec | Séance, Étiquette, Cycle, Tour, Exercices |
| API-SEA-04 | Modifier une séance           | ID Séance, valeurs à modifier                     | Séance mise à jour                              | La Séance doit exister ; les Exécutions historisées ne sont pas modifiées                                                                     | Séance                                                      |
| API-SEA-05 | Dupliquer une séance          | ID Séance source                                  | Nouvelle Séance indépendante                    | Nouveaux identifiants ; nom `{nom} (copie)` puis suffixe numéroté disponible ; copie de l’Étiquette, de la Composition et des paramètres ; aucune Routine ni Exécution n’est dupliquée | Séance, Étiquette, Cycle, Tour, Exercices |
| API-SEA-06 | Archiver une séance           | ID Séance, confirmation conditionnelle            | Séance archivée ; Routines associées supprimées | Aucune confirmation si 0 Routine associée ; confirmation explicite obligatoire si ≥ 1 Routine associée, avant archivage et suppression de ces Routines ; les occurrences futures cessent d'être calculées ; occurrences historisées et Exécutions conservées | Séance, Routine |
| API-SEA-07 | Restaurer une séance archivée | ID Séance                                         | Séance au statut `Active`                       | Aucune ancienne Routine n'est restaurée ; toute nouvelle planification nécessite une nouvelle Routine                                         | Séance                                                      |
| API-SEA-08 | Supprimer une séance archivée | ID Séance, confirmation                           | Séance supprimée                                | La Séance doit être archivée ; aucune suppression directe d’une Séance active ; Exécutions historiques conservées                              | Séance                                                      |
## 11.3 API Composition d'une séance

| ID         | Opération                              | Entrées principales                                             | Résultat                           | Règles / validations                                                                           | Objets impactés     |
| ---------- | -------------------------------------- | --------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------- |
| API-COM-01 | Initialiser le Cycle technique         | ID Séance                                                        | Cycle créé avec répétition `1`     | Opération interne à la création ; valeur non modifiable et non exposée dans le MVP                           | Cycle               |
| API-COM-02 | Modifier le nombre de Tours du Circuit | ID technique `Tour` représentant le Circuit, nombre de Tours | Conteneur technique `Tour` mis à jour | Nombre de Tours de **1 à 99** ; le nom technique historique n’est pas renommé par D-209 | Tour (Circuit fonctionnel) |
| API-COM-03 | Ajouter un exercice                   | Position structurelle éventuelle, paramètres, position | Nouvelle Exercice avec identifiant | Aucun type d’Exercice ; premier Exercice créé fonctionnellement avant le Circuit ; les valeurs techniques historiques restent `Avant Tour`, `Dans Tour`, `Après Tour` | Exercice, Cycle, Tour technique éventuel |
| API-COM-04 | Modifier un exercice                  | ID Exercice, valeurs à modifier                                 | Exercice mis à jour               | Respect des règles du mode et des paramètres ; les Exécutions historisées ne sont pas modifiées | Exercice            |
| API-COM-05 | Supprimer un exercice                 | ID Exercice                                                     | Exercice retiré de la composition | L’Exercice doit exister ; les données historiques restent exploitables                         | Exercice, conteneur |
| API-COM-06 | Réordonner les exercices               | ID Exercice déplacé, position structurelle cible et ordre cible | Nouvelles positions enregistrées   | L’appui long ne persiste rien ; l’opération est appelée uniquement à la dépose dans une destination valide. Déplacement fonctionnel autorisé avant, dans ou après le Circuit ; valeurs techniques historiques `Avant Tour`, `Dans Tour`, `Après Tour` ; positions uniques dans chaque zone | Exercices, Cycle, Tour technique |
| API-COM-07 | Paramétrer le compte à rebours initial | ID Séance, durée, texte vocal                                   | Paramètres mis à jour              | Élément toujours présent ; durée ≥ 0 ; une durée de 0 s rend la phase instantanée              | Séance              |
| API-COM-08 | Paramétrer la fin de séance            | ID Séance, durée, texte vocal                                   | Paramètres mis à jour              | Élément toujours présent ; durée ≥ 0 ; la Fin de séance n’est pas un Exercice                 | Séance              |
| API-COM-09 | Insérer / déplacer / retirer un Point d’arrêt | ID Séance, position ordonnée | Composition mise à jour | Aucun écran dédié ; attente exclue de la durée | Séance, Composition |
## 11.4 API Exercices

|ID|Opération|Entrées principales|Résultat|Règles / validations|Objets impactés|
|---|---|---|---|---|---|
| API-ACT-01 | Paramétrer un Exercice | Nom, référentiels, mode unique, N, uniforme/variable, cibles/Pauses/Bip0..10 ordonnés, direction, ordre des côtés, PC, CR/Fin | Exercice validé | Validation v13 ; N1 normalisé ; aucune R contextuelle sur ActivityDefinition ; écriture atomique | Exercice |
| API-ACT-02 | Calculer les paramètres temporels | Mode, N, uniforme/variable, cibles/Pauses/Bip0..10 ordonnés, direction, ordre des côtés, PC, R contextuel éventuel, Tv en Durée uniforme | Total dérivé avec niveau d’incertitude, statut incomplet et N canonique si inversion | Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel. | Exercice / occurrence |
| API-ACT-03 | Définir les pauses | Paramètres uniformes/variables, PC | Exercice validé | Pi est stockée et exécutée après chaque Série, dernière comprise. À la frontière des côtés successifs, PN puis PC se cumulent. Par paire, Pi suit chaque paire, dernière comprise, et PC reste dans chaque paire. Seule la toute dernière Pause est remplacée par la récupération positive qui suit l’occurrence ; aucune récupération en direct. N=1 normalisé uniforme/par côté. Formules et séquences : chapitre 10, Calculs des durées et ordre des phases. | Exercice |
|API-ACT-04|Lire/afficher les médias associés|ID Exercice|Média(s) associé(s) pour la gouttière permanente de la carte d’Exercice|L’affichage en gouttière, sans déploiement, fait partie du MVP  ; cette API fonctionnelle ne préjuge pas du mécanisme d’import/capture|Exercice, Média|
|API-ACT-05|Associer des zones corporelles|ID Exercice, zones corporelles|Zones corporelles mises à jour|Zéro à plusieurs zones du référentiel utilisateur courant|Exercice, Zone corporelle|
|API-ACT-06|Définir le nombre de Séries|ID Exercice, nombre de Séries|Exercice mis à jour|Entier de 1 à 99 ; valeur par défaut 1 ; valeur canonique persistée ; ne crée aucune entité Série autonome|Exercice|
|API-ACT-07|Dupliquer un Exercice de Séance|ID Exercice source|Nouvelle Exercice de Séance indépendante|Nouvel identifiant ; copie des propriétés intrinsèques dont Pause et `sideRecoverySeconds`, ainsi que du `postActivityRecoverySeconds` contextuel de l’occurrence ; insertion immédiatement après la source dans la même zone ; aucune création dans le catalogue|Exercice, Composition, associations Média|
### Contrats internes des phases d’exercice

Les opérations de création, modification, copie et duplication transportent la liste ordonnée de phases avec les paramètres canoniques. Aucun endpoint ni service distant supplémentaire n’est requis. Contrat de données : chapitre 09, Phases de l’exercice ; comportement : [chapitre 08](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phases-exercice).

- Normalisation du brouillon : retire les phases de saisie à 0 s et remplace les libellés vides par Phase n ; résultat appliqué atomiquement à ✓, annulé à ✕.
- Validation : éligibilité, six phases maximum, libellés 20 caractères, cohérence avec la durée imposée ; les données corrompues ne bénéficient pas d’un effacement silencieux.
- Calcul : somme des phases comme durée de série ; projections et agrégats issus des mêmes paramètres, sans double comptage.
- Adaptation au format : reçoit la liste et la durée de travail imposée ; renvoie la liste adaptée et les valeurs avant/après nécessaires au message informatif. Source Catalogue inchangée. Les arrondis extrêmes attendent la règle du chapitre 08.
- Génération du plan : conserve la série comme unité logique et expose les sous-étapes chronométrées et leur identité à la reprise/audio.
- Génération de phrase : segments `{texte, gras}` depuis les paramètres effectifs, sans chaîne persistée. Les formulations exactes avec phases restent à intégrer au corpus ; ne pas appliquer les seuls 276 cas historiques comme couverture de cette extension.

Conserver les contrats d’annulation, copie indépendante et lecture d’anciennes versions ; ne pas supprimer une liste de phases lors d’un aller-retour par un DTO historique.

## 11.5 API Routines et Planification

Ces opérations conservent leurs identifiants, avec une entrée étendue à la liste ordonnée de contenus. Contrat fonctionnel cible, pas signature d’API implémentée.

| ID | Opération | Entrées et résultat | Contraintes |
|---|---|---|---|
| API-ROU-01 | Créer | Paramètres du créneau, Programme facultatif, liste ordonnée avec type/référence/fréquence/motif, rappel → Routine | Validation globale ; aucune écriture au simple choix d’une carte |
| API-ROU-02 | Lire | IDRoutine → créneau et ses entrées ordonnées | Respecter le propriétaire et les références |
| API-ROU-03 | Modifier | IDRoutine, brouillon complet → Routine actualisée | Préserver l’échu ; règles de conversion et de motif ouvertes |
| API-ROU-04 | Supprimer | IDRoutine → arrêt du calcul futur | Ne supprime ni sources ni exécutions historiques |
| API-ROU-05 | Calculer | Créneau, période → occurrences avec contenus retenus dans leur ordre | Génération puis filtrage ; un contenu ne crée pas d’occurrence |
| API-ROU-06 | Prochaine occurrence | Type/IDcontenu ou IDRoutine → prochaine occurrence applicable | Le motif du contenu doit être respecté |
| API-ROU-07 | Historiser | Occurrence et résultats des contenus | Modèle d’identité et d’agrégation multi-contenus à préciser avant implémentation |
| API-ROU-08 | Définir/retirer rappel | IDRoutine, activation, délai → rappel local | Permission système ; rappel facultatif unique |
| API-ROU-09 | Préparer duplication | IDRoutine → brouillon incluant liste, ordre, motifs et paramètres | Pas de création avant validation explicite |

Le mode d’exécution de chaque source reste SESSION ou ACTIVITY ; le mot parcours ne crée pas un troisième moteur. La suppression du modèle autonome Parcours retire ses anciennes API-CIR de la cible. L’enchaînement et les états d’une occurrence à plusieurs contenus doivent être spécifiés avant livraison ; ne pas reprendre par défaut l’ancienne Exécution de Parcours.

Voir la [spécification de planification du 08/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification), y compris ses points ouverts ; aucune règle manquante ne se déduit des valeurs Figma.

## 11.6 API Exécution

| ID         | Opération                         | Entrées principales              | Résultat                                                                  | Règles / validations                                                                                                                                | Objets impactés                  |
| ---------- | --------------------------------- | -------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| API-EXE-01 | Démarrer une séance               | ID Séance, occurrence éventuelle | Nouvelle Exécution positionnée au Compte à rebours initial                | La Séance démarre toujours par le Compte à rebours initial ; aucune Exécution n’est enregistrée si l’utilisateur quitte avant le démarrage effectif | Exécution, Occurrence éventuelle |
| API-EXE-01A | Démarrer un Exercice persistant | ID `ActivityDefinition`, occurrence éventuelle | Nouvelle Exécution d’origine `ACTIVITY`, fondée sur un Instantané autonome | L’Exercice peut être lancé directement depuis le Catalogue ou depuis une occurrence d’une Routine `ACTIVITY` ; la préparation directe et les phases propres de l’Exercice s’appliquent ; aucune Séance artificielle n’est créée | Exécution, Occurrence éventuelle |
| API-EXE-02 | Mettre en pause                   | ID Exécution                     | Exécution suspendue                                                       | Exécution en cours requise                                                                                                                          | Exécution                        |
| API-EXE-03 | Reprendre                         | ID Exécution                     | Exécution reprise                                                         | Exécution suspendue requise                                                                                                                         | Exécution                        |
| API-EXE-04 | Réinitialiser l’étape courante | ID Exécution, confirmation | Exercice, Série ou phase de récupération courante recommencée | Confirmation obligatoire ; pendant `SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY`, seul le chronomètre de la phase courante repart du début et l’action est libellée `Réinitialiser la récupération` ; aucun Résultat antérieur n’est modifié | Exécution |
| API-EXE-05 | Actionner `Suivant` | ID Exécution, confirmation éventuelle | Série, Exercice ou phase de récupération courante clôturée, suite activée | Pour un Exercice chronométré, `SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY` avant zéro, confirmation obligatoire selon le contexte ; les temps partiels sont enregistrés dans les champs correspondant à la phase ; en Répétitions ou À l’échec, `Suivant` termine normalement la Série sans confirmation | Exécution |
| API-EXE-06 | Arrêter l’exécution               | ID Exécution, confirmation       | Exécution clôturée                                                        | Arrêt disponible depuis l’état Pause ; après confirmation, l’Exécution est clôturée avec le statut `Interrompue` et la Synthèse est ouverte                                                          | Exécution                        |
| API-EXE-07 | Terminer l’exécution              | ID Exécution                     | Exécution terminée, statut déterminé, résultats enregistrés et écran de sortie applicable ouvert | L’étape `SESSION_END` doit être achevée ; si sa durée vaut `0 s`, l’achèvement est immédiat. T04 ouvre la fin minimale ; la Synthèse n’est ouverte que par la tranche qui la livre. Un arrêt avant cet achèvement relève d’API-EXE-06 et produit le statut `Interrompue` | Exécution, Occurrence éventuelle |
| API-EXE-08 | Obtenir l’état courant            | ID Exécution                     | Étape courante, progression, temps total écoulé, Durée estimée d’exécution, état temporel courant et prochaine étape | Le temps total écoulé inclut toutes les phases effectivement exécutées, dont Pauses entre Séries, `SIDE_RECOVERY`, `POST_ACTIVITY_RECOVERY`, Compte à rebours initial et Fin de séance, et exclut uniquement les Pauses manuelles ; l’état temporel fournit le temps restant pour un Exercice chronométré ou une phase de récupération et le temps écoulé pour un Exercice en Répétitions ou À l’échec | Exécution, lecture |
| API-EXE-09 | Gérer une suspension prolongée     | ID Exécution, durée de suspension, réponse utilisateur éventuelle | Exécution reprise ou clôturée avec le statut `Interrompue` | à partir de30min consécutives en pause, proposer Reprendre/Arrêter ; sans réponse, rester suspendu. Reprise : plan conservé, intervalle complet si cadence, aucun effacement du temps actif | Exécution |
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
- réinitialiser l’Exercice courant après confirmation ;
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

Chaque Exécution repose sur un **Instantané fonctionnel immuable** créé au démarrage. Cet instantané conserve les informations nécessaires pour restituer fidèlement la Séance exécutée et, dès l’introduction des médias au MVP , les associations et références média stables, sans dupliquer les fichiers physiques.

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
| API-REF-02 | Créer une catégorie           | Nom                              | Nouvelle catégorie                          | Respect des contraintes d’unicité ; icône KODJO et couleur blanche DSF attribuées automatiquement et non modifiables dans le MVP ; dans le parcours de création d’une Séance, l’opération reste dans le brouillon et est persistée par `API-SEA-03` ; un nom correspondant à une valeur retirée la réactive  | Catégorie |
| API-REF-03 | Modifier une catégorie        | ID Catégorie, nouveau nom        | Catégorie mise à jour                       | La Catégorie doit exister ; l’icône et la couleur ne sont pas modifiables dans le MVP | Catégorie |
| API-REF-04 | Supprimer une catégorie | ID Catégorie, confirmation | Catégorie supprimée | Toute Catégorie, initiale ou personnalisée, est supprimable ; si utilisée, elle est retirée des choix futurs mais reste affectée aux Exercices existants concernés ; les Instantanés/Exécutions historiques restent inchangés | Catégorie, Exercice |
| API-REF-05 | Lister les zones corporelles | Aucun | Liste des zones corporelles | Retourne le référentiel utilisateur courant, valeurs par défaut et personnalisées | Zone corporelle, lecture |
| API-REF-06 | Créer une Zone corporelle | Nom | Nouvelle Zone corporelle | Nom obligatoire et unique ; nouvel identifiant stable ; la Zone devient immédiatement sélectionnable ; un nom correspondant à une valeur retirée la réactive  | Zone corporelle |
| API-REF-07 | Renommer une Zone corporelle | ID Zone, nouveau nom | Zone corporelle mise à jour | L’identifiant reste inchangé ; nom obligatoire et unique | Zone corporelle |
| API-REF-08 | Supprimer une Zone corporelle | ID Zone, confirmation | Zone corporelle supprimée | Toute Zone, initiale ou personnalisée, est supprimable ; si utilisée, la retire des choix futurs tout en conservant les associations des Exercices existants ; les Instantanés/Exécutions historiques restent inchangés | Zone corporelle, Exercice |
| API-REF-09 | Lister les Étiquettes | Aucun | Liste des Étiquettes | Retourne toutes les valeurs courantes du référentiel utilisateur | Étiquette, lecture |
| API-REF-10 | Créer une Étiquette | Nom, couleur | Nouvelle Étiquette | Nom obligatoire et unique ; couleur issue de la palette contrôlée ; un nom correspondant à une valeur retirée la réactive  | Étiquette |
| API-REF-11 | Renommer une Étiquette | ID Étiquette, nouveau nom | Étiquette mise à jour | L’identifiant reste inchangé ; les Séances associées conservent la référence | Étiquette |
| API-REF-12 | Supprimer une Étiquette | ID Étiquette, confirmation | Étiquette supprimée | Toute Étiquette, initiale ou personnalisée, est supprimable ; si utilisée, elle est retirée des choix futurs mais reste affectée aux Séances existantes ; les Instantanés/Exécutions historiques restent inchangés | Étiquette, Séance |
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
| `CompositionService` | Gestion des Cycles, Tours et Exercices |
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
- Les API Média sont incluses au MVP dans PRE-3  pour importer/associer, lister, réordonner et retirer `0..n` photos ou vidéos locales ; la capture caméra n’est pas implicitement activée.

## 11.13 API du Catalogue des Exercices, des Médias et des Parcours

| API | Version | Entrée principale | Résultat / règle |
|---|---|---|---|
| `API-ACT-REF-01..05` | MVP T03 | définition d’Exercice | Créer, lire, lister, modifier, archiver/supprimer une référence autonome. Si des Routines ciblent l’Exercice, l’archivage arrête leurs occurrences futures selon la même règle que pour une Séance ; les occurrences historisées et Exécutions restent conservées. |
| `API-ACT-COPY-01` | MVP T03 | ID référence, ID Séance, position | Crée une copie complète indépendante ; aucune association fonctionnelle durable à la référence. |
| `API-MED-01..05` | MVP PRE-3 | exercice, fichier ou position | Importer/choisir, associer, lister, réordonner et retirer `0..n` médias locaux  ; nettoyage physique seulement sans référence. Capture caméra à clarifier, sans activation implicite. |
| `API-CAT-01` | MVP T03 / V2 | type, filtre, tri | Avant T03, accepte uniquement `SESSION`; dans le MVP T03, accepte également `ACTIVITY`; l’ancien type autonome `CIRCUIT` n’est pas réintroduit par la planification multi-contenus. Défaut : non archivés, dernière modification décroissante. |
| API-CIR (ancienne famille) | Retirée 08/10 | Sans nouvelle implémentation | L’objet autonome Parcours et son exécution globale ne font plus partie de la cible. |

`API-EXE-05` termine par Suivant toute Série Répétitions ou à cible À l’échec. Les DTO acceptent DURATION/REPETITIONS et une cible typée par Série ; TO_FAILURE est un format historique à migrer (chapitre09). La confirmation du relevé est indépendante de la transition.

## API de bilatéralité

| ID | Commande | Entrée | Effet et garanties |
|---|---|---|---|
| `API-SIDE-01` | Modifier le Changement de côté d’un Exercice | ID, `sideMode` | Valide `UNILATERAL`, `RIGHT_LEFT`, `LEFT_RIGHT` ; recalcule les durées et synthèses. |
| `API-SIDE-02` | Compatibilité technique du côté Tour | ID Tour | Aucune mutation utilisateur exposée dans la version actuelle ; le champ historique reste conservé et contraint à `UNILATERAL`. |
| `API-SIDE-03` | Dupliquer | ID Exercice ou Tour | Copie fidèlement `sideMode`, ainsi que le contenu dupliqué selon les règles existantes. |
| `API-SIDE-04` | Insérer un Exercice persistant | ID source, ID Séance | Copie `sideMode` dans l’occurrence ; aucun lien dynamique ultérieur. |
| `API-EXE-SIDE-01` | Générer le Plan | Instantané de Séance | Résout `effectiveSideMode`, développe côtés/Séries/Tours, insère `SIDE_RECOVERY` entre côtés et `POST_ACTIVITY_RECOVERY` après occurrences selon leurs valeurs, puis produit un ordre déterministe. |
| `API-EXE-SIDE-02` | Enregistrer un passage | Nœud de plan, côté, résultat | Écriture idempotente séparée par `executionSide`; agrégation du statut global. |
| `API-EXE-SIDE-03` | Réinitialiser | Nœud et côté courant | Efface ou recommence uniquement le résultat du passage courant. |
| `API-EXE-SIDE-04` | Passer à la suite | Nœud, confirmation éventuelle | Utilise la modale générique ; après le premier côté, ouvre le second avant l’Exercice logique suivante. |

## 11.14 Exécution directe d’un Exercice — MVP T03

| ID | Service | Entrée | Sortie | Règles |
|---|---|---|---|---|
| API-ACT-EXE-01 | Vérifier l’éligibilité | ID Exercice | Éligible ou erreurs | Validation complète de la définition. |
| API-ACT-EXE-02 | Démarrer | ID Exercice, état de retour Catalogue | ID Exécution, plan | Instantané autonome, origine `ACTIVITY`, préparation `5 s`, aucune Séance créée. |
| API-ACT-EXE-03 | Construire le plan | Instantané Exercice | Étapes développées | Séries, Pauses, côtés et `SIDE_RECOVERY` éventuelle ; aucune `POST_ACTIVITY_RECOVERY`, aucun Tour/Cycle ni `SESSION_END`. |
| API-ACT-EXE-04 | Finaliser la Synthèse | ID Exécution, Ressenti, Commentaire éventuel | Exécution finalisée | Ressenti obligatoire si Synthèse présentée ; statistiques compatibles mises à jour. |
| API-ACT-EXE-05 | Obtenir la destination de sortie | ID Exécution | État Catalogue | Filtres et position restaurés ; aucune recherche Catalogue dans le MVP . |

Les services d’exécution communs acceptent une origine discriminante `SESSION | ACTIVITY`. Ils ne doivent jamais fabriquer une Séance pour satisfaire leurs contrats historiques.

## 11.15 Sélection multiple d’Exercices existants — MVP T03

`CompositionService` reçoit les identifiants sélectionnés dans l’ordre courant de présentation produit par la liste filtrée au moment de la validation. Il crée une copie indépendante de chaque `ActivityDefinition` dans cet ordre, en une seule opération de composition. L’ordre temporel des touchers ne fait pas partie du contrat et ne doit pas être persisté.

| Contrat | Entrée | Sortie | Règle |
|---|---|---|---|
| `API-COMP-SEL-01` | IDs d’Exercices ordonnés selon la liste visible, position d’insertion | Références de composition créées | Conserve strictement l’ordre fourni ; aucune modification des définitions persistantes sources. |
| `API-COMP-SEL-02` | Sélection vide | Aucune écriture | L’action de validation reste désactivée. |
| `API-COMP-SEL-03` | Erreur pendant la copie groupée | Erreur fonctionnelle, Composition inchangée | L’insertion est atomique ; aucun sous-ensemble ne reste inséré. |

## Contrat fonctionnel futur — médias pendant l’Exécution

D-203 n’ajoute aucun endpoint MVP immédiatement. La future capacité d’Exécution média devra néanmoins fournir au client, pour l’Exercice courant :
- la liste ordonnée des médias accessibles ;
- le type de chaque média et les informations nécessaires à son rendu / sa lecture ;
- la capacité à signaler un média indisponible sans bloquer la liste.

La face courante, l’index de galerie et l’état de lecture sont des états de session UI et ne nécessitent pas de persistance API durable. Aucun contrat de nommage d’endpoint supplémentaire n’est arrêté par cette conception.

### Extension future des API Routine — Parcours

**Ancienne cible autonome retirée le 08/10/2026.** Parcours est désormais le libellé d’un créneau à plusieurs contenus, sans identité, persistance, étapes ou exécution globale propres. Programme est un conteneur distinct ; Circuit reste interne à la Séance. Voir la [spécification de planification du 08/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification), y compris ses points ouverts ; aucune règle manquante ne se déduit des valeurs Figma.

### API de récupération contextuelle — D-208

| ID | Opération | Entrées | Résultat | Règle |
| --- | --- | --- | --- | --- |
| API-COM-REC-01 | Ajouter explicitement une récupération | occurrence, durée validée | pause recovery du brouillon | Proposer le défaut Profil à l’ajout, jamais créer de récupération avec une occurrence. |
| API-COM-REC-02 | Modifier la récupération après exercice | ID occurrence, durée ≥ 0 | occurrence mise à jour | `0 s` est une valeur valide et conservée. |
| API-COM-REC-03 | Déplacer une occurrence | ID occurrence, nouvelle position | ordre mis à jour | `postActivityRecoverySeconds` reste inchangé. |
| API-COM-REC-04 | Dupliquer une occurrence | ID occurrence | copie indépendante | Copie `postActivityRecoverySeconds`. |
| API-COM-REC-05 | Supprimer une occurrence | ID occurrence | occurrence supprimée | La récupération contextuelle disparaît avec elle. |

## Impact API de la revue des cartes — 30 septembre 2026

Décisions finales du propriétaire : les 17 points du 30/09 sont clos. Révision des cartes du 03/10/2026 (D-260 à D-264) : un seul format de carte d’Exercice, avec une gouttière permanente de 64 px dans le Catalogue et les listes de sélection d’exercices ; photo si média associé, icône de nature sinon. La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture . Les Séances ne portent jamais de visuel. Aucune photo dans les listes mixtes, le Calendrier ou le Suivi. Aucun déploiement d’Exercice ni de carte du Suivi ; le déploiement des Séances reste accessible dans le Catalogue et le Calendrier Semaine. Le Suivi présente deux lignes : nature/titre/statut, puis durée/catégorie/ressenti ; sans heure, zones corporelles ni étiquettes. Le Ressenti y est un indicateur sans action, distinct de sa saisie obligatoire en Synthèse. Les variantes déployées d’Exercice et du Suivi sont historiques, hors MVP. Pauses/récupérations et prochaine planification restent absentes des cartes concernées. Les données, instantanés, calculs et fonctions de planification sont conservés.

Synthèses : « N séries de X », « N séries de N rép. », « N séries à l’échec » ; bilatéralité par miroir dans les variantes concernées. Heure Semaine « 08:00 » ; aucune heure dans la carte du Suivi. Séance sans étiquette : catégories de ses exercices ; listes de catégories/zones séparées par un point médian et tronquées avec « … ». Choix sans badge durée ; récurrence du Calendrier Semaine dans la carte déployée seulement.

RG-10 : le Profil porte une préférence silhouette facultative, homme/femme ; absence = homme affiché. Elle ne pilote que l’icône de zone corporelle, sans filtre, recherche ou effet métier. RG-11 à RG-13 : vignette 64 centrée et recadrée sans déformation (couverture pour une vidéo), place réservée pendant chargement/erreur, texte alternatif égal au nom de l’exercice.

D-239 : Calendrier Jour est une exception compacte (séance 298 × 46, exercice 298 × 48, x=80, hauteur d’instance adaptée à l’événement), avec barre colorée 4, nature 26, titre 13 gras, heure/durée 11, lecture 26 et aucun Déployer. Les deux sets comportent 10 variantes chacun. Suivi — Vue d’ensemble est hors MVP. Les boutons Calendrier Aujourd’hui/Planifier restent à 32, sans cible 44 ajoutée : situation acceptée, à revoir et développer après T04. Les nouvelles icônes sont nommées icon/<nom>, les anciennes ne sont pas renommées ; target est réservé au Programme, pulse aux rapports/Suivi.

Contrat Profil : la lecture et la mise à jour du Profil portent la préférence facultative `silhouette` (homme/femme). Champ absent : rendu homme ; lors d’une mise à jour partielle, omission = préférence conservée, null = préférence non renseignée. Aucun endpoint distinct ni nouveau mécanisme d’import média n’est requis.

Référence normative ciblée : [DSF — Cartes, icônes et appuis](../DSF-CARTES-ICONES-APPUIS-2026-09-30.md). Ces règles finales prévalent sur les anciennes formulations d’affichage du présent chapitre dans ce périmètre uniquement.

## API fonctionnelles — consolidation D-209 à D-217

- Création/mise à jour d’un Exercice : Catégorie exactement `1`, Zones corporelles `1..n`; une référence retirée du référentiel actif reste acceptable si elle est déjà affectée à l’objet modifié, mais ne peut pas être nouvellement affectée.
- Suppression référentiel : désactive la valeur pour les nouvelles sélections sans casser les références existantes ; Étiquette/Catégorie conservent nom et couleur nécessaires au rendu des objets existants.
- Mise à jour couleur Étiquette/Catégorie : agit sur le référentiel source ; les consommateurs relisent cette couleur, sans copie locale par objet.
- Création Exercice / occurrence : lecture ponctuelle des défauts Profil, sans synchronisation ultérieure.
- Mise à jour Séance : aucun paramètre d’activation des Compte à rebours/Fin propres aux Exercices. Construction du plan SESSION : exclusion inconditionnelle de ces phases, sans effacement des valeurs propres ; les phases de Séance les remplacent.
- Construction du Plan : développe le Circuit pour `tourCount` Tours ; tout Point d’arrêt interne au Circuit est reproduit à chaque Tour ; après un Exercice, `POST_ACTIVITY_RECOVERY` précède le Point d’arrêt.

| API-PHRASE-01 | Générer la phrase de synthèse | Paramètres courants de l’Exercice | Segments `{texte, gras}` ou tableau vide | Applique D-298 et Phrase v1 à partir des paramètres et du résultat de calcul fourni (total et niveau d’incertitude) ; sans mode retourne un tableau vide. Ne recalcule aucune durée et ne persiste aucune phrase ni aucun segment, même en cache en base. | Exercice |

| API-PARAM-01 | Valider les bornes des paramètres | Paramètres d’exécution | paramètres valides / erreur | Séries `1..99`; Répétitions `1..100`; durée par Série `5..3535 s`; pauses inter-Séries/inter-côtés `0..300 s`. | Exercice |

> **Clôture des contrats — 01/10/2026.** Les règles consolidées du [chapitre 13, §6](13%20–%20Contrats%20d’écran.md#6-clôture-des-réserves-fonctionnelles-des-contrats) s’appliquent : progression sur le plan complet ; transitions et pauses selon D-248/v13 (ancien repli D-242 retiré) ; fréquence 1..12 semaines ; rappel personnalisé au plus 24 h. En Un côté après l’autre, le reset porte sur le bloc du côté courant ; la même règle s’applique à l’ordre alterné en conservant les résultats de l’autre côté (chapitre13 R-03). Les étapes et calculs ci-dessous se lisent avec ces précisions ; aucune nouvelle disposition d’écran.

### Saisie des paramètres — D-246

La référence active est [Paramètres en modale v13](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#parametres-exercice), contrats CE-T03-04/CE-UI-10. Elle intègre Séries variables, Ordre des côtés, pauses terminales et récupération de l’occurrence. Feuille transactionnelle : ✕ annule, ✓ applique au parent, Terminer persiste. Les calculs et comportements sont normatifs dans les spécifications ; Figma définit le layout seulement. Les anciens textes v11 sont historiques.

### Contrat transverse des paramètres v13

Validation, calcul, duplication, insertion dans une Séance et instantané partagent la représentation de chapitre 08, paramètres d’exercice. Le tableau ordonné cible/Pause et l’état variable explicite sont copiés intégralement. Les API de Séance calculent To avec récupération explicite, sans ajouter R deux fois. Les API de lecture ne réécrivent pas les résultats historiques. Aucun champ caché de brouillon ne traverse la persistance.

## Extension des API — Cadence et phrase

| Opération | Entrées | Sortie / effet atomique | Refus et compatibilité |
|---|---|---|---|
| Valider/appliquer paramètres | Brouillon mode, Séries ordonnées et Bip commun0..10 | Normalise N1 ; propage cadence ; ✓ remplace le brouillon parent ; Terminer seul persiste | Bip−1/11/non entier : validation refusée et erreur champ ;0 valide ; les deux modes conservent le Bip |
| Calculer paramètres (API-ACT-02) | Collection effective, côtés, PC, R contextuelle éventuelle | Total intrinsèque/occurrence et niveau d’incertitude, ou incomplet ; Ri×b si bip positif en Répétitions, omitted sinon ; Durée chiffrée exacte ; mélange calculable lowerBound ; toutes cibles échec omitted | Pas d’inversion Répétitions ; ni Figma ni Excel en entrée de calcul |
| Générer la phrase | Paramètres valides et résultat temporel fourni | Segments ordonnés `{texte, gras}` ; régénérés à chaque affichage | Aucun recalcul de pause/durée dans cette fonction ; aucune mutation métier |
| Démarrer/copier/dupliquer | Définition ou occurrence avec cadences | Snapshot/collection complets ; début immédiat de première répétition ; aucune nouvelle phase Répétition | Ancien objet sans champ : Bip0=Aucun ; aucun tempo implicite |
| Pause/Reprendre/Réinitialiser/Suivant | Exécution, identifiant de transition et horodatage monotone | État récupérable + temps actif cumulé ; intervalle complet après Pause, scope existant pour reset ; Suivant fin normale | Idempotence ; mauvais état refusé ; fin nominale ne déclenche pas Suivant |
| Lire/finaliser résultats | Snapshot et accumulateurs par Série/côté | Prescription immuable et durées réelles, statut existant | Aucun compte de répétitions réalisées ; reset ne supprime pas le temps dépensé |

Les erreurs utilisent les catégories existantes de validation et INVALID_STATE, avec champ/Série localisés ; aucune nouvelle API réseau ou nouvelle entité imposée. La nouvelle version d’instantané doit rester lisible avec les snapshots antérieurs ; qualification technique et mobile à réaliser.

## Pauses et symboles

Les API de placement travaillent dans un sous-brouillon : ouverture, ajout/édition/retrait par identifiant, validation des positions par type, confirmation atomique/annulation. Le calcul renvoie exact/estimated/lowerBound/omitted ; incomplete reste une erreur de validité distincte. Le générateur reçoit la nature et le montant applicable, jamais les formules Excel.

## Contrat technique de phrase

La [spécification de phrase](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phrases) gouverne le générateur pur : paramètres métier + résultat de durée + locale française → `Array<{texte: string, gras: boolean}>`. Retour vide `[]` si aucune phrase applicable. Aucun calcul depuis Excel, aucune chaîne à redécouper pour trouver les valeurs en gras. React Native utilise des Text imbriqués ; le découpage est émis par le gabarit, y compris si une valeur se répète.

Aucune colonne phrase ni sérialisation des segments dans définition/occurrence/snapshot. Génération à chaque affichage depuis les paramètres ; ✓ applique le brouillon, ne persiste pas le texte. Un changement rédactionnel est visible au prochain rendu des objets existants. Paramètres historiques et temps réalisés préservés.

Français uniquement au MVP. Internationalisation ultérieure : gabarits et règles de pluriel/genre/ordre par locale, avec recette dédiée ; prévoir la réécriture de la grammaire française, pas une traduction des segments isolés. Corpus276 utilisé uniquement pour les phrases, valeurs totales injectées par le calcul métier.

## Contrats fonctionnels — circuits du12/10/2026

| Opération | Entrées / résultat / atomicité |
|---|---|
| Préparer une conversion | Circuit courant + nature cible ; calcul des exercices affectés et pertes, sans mutation partielle |
| Appliquer une conversion | État préparé confirmé si perte ; appliquer nature, compte et lignes ensemble ; Annuler conserve tout |
| Modifier le compte | Brouillon du circuit ; synchroniser tous les exercices en nature séries, avec réserve temporaire/restauration |
| Ajouter/sortir un exercice | Copie locale indépendante ; confirmer adaptation destructrice à l’ajout ; sortie conserve état actif |
| Obtenir les volumes | Projection en lecture seule : cellules typées valeur/échec/absence, unité/mode, direction ; aucune mutation ni total inventé |
| Construire le plan | Même représentation que validation/calcul ; développement selon nature et phases contextuelles ; identifiants d’occurrences stables |
| Calculer la durée du circuit | Somme des phases effectives, résultat exact/estimated/lowerBound ; aucune lecture du texte de carte |

L’API de mise à jour des paramètres refuse une modification locale de N lorsqu’il est hérité et ne propose pas l’inversion de durée dans ce contexte. Les validations ne reposent pas sur la seule désactivation visuelle. Le formateur de volume respecte le régime ; la phrase complète conserve son générateur de segments et son corpus propre.

## Contrats de service — cibles typées et relevés13/10

Validation/édition/copie/instantané transportent le mode commun et la cible typée de chaque Série. Le calcul retourne exact/estimated/lowerBound/omitted selon la chapitre 10, Calculs des cibles mixtes ; aucune valeur pour omitted, erreur distincte. Le générateur reçoit ce résultat et retourne des segments, jamais une phrase persistée.

La fin de Série reste indépendante du relevé. Le service de relevé reçoit l’identité de l’occurrence/côté/tentative, valeur facultative, unité, origine et qualification ; une proposition issue du bip reste estimée jusqu’à confirmation/correction explicite. Événements idempotents, pas de doublons lors de reprise. Aucun endpoint réseau ni nouvelle API déjà implémentée n’est présumé par ce contrat fonctionnel.

<a id="formats-api"></a>

## Formats — contrats de services fonctionnels

| Opération | Entrée / sortie | Validation et effets |
|---|---|---|
| Initialiser depuis un modèle | Entrée choisie → brouillon de séance, format/origine et paramètres | Départ rapide = libre ; ne pas déduire le format du nom |
| Modifier un réglage | Brouillon + réglage autorisé → paramètres effectifs, synthèse et durée | Constantes et format inchangés ; refus d’une édition non autorisée |
| Changer l’organisation | Choix admis → ordre effectif | Tabata/EMOM/Progression selon règles ; interdit For time ; volume conservé |
| Développer la prescription | Instantané → occurrences finies ou générateur progressif | Unité d’indexation explicite ; aucun double multiplicateur série × tour |
| Calculer les métriques | Prescription effective → durée typée | EMOM N × E × W ; aucun repos résiduel ajouté ; aucune durée Death by inventée |
| Signaler le travail accompli | Identité d’exécution et de fenêtre courante | Révèle repos ; échéance inchangée ; Death by acquiert au plus une fois la fenêtre |
| Clore Death by | Motif limite/abandon + répétitions partielles applicables | Résultat confirmé, état incomplet ; un seul déclencheur de confirmation |
| Générer les modalités | Paramètres effectifs → segments ordonnés texte/gras | Pas de phrase persistée ; unité par tour/série préservée |
| Lire l’historique | Identité d’exécution → instantané et résultat | Jamais de recalcul depuis la séance source actuelle |

La saisie du rang de fenêtre ou d’un nombre de tours à chaque passage n’est pas exposée. L’horloge génère les échéances ; les commandes doivent être idempotentes face aux doublons. Le formulaire proposé à zéro n’est pas une mesure avant validation. Erreurs : format incompatible, constante modifiée, objectif ou compte invalide selon sa borne existante, unité incohérente et fenêtre obsolète ne doivent pas être acceptés silencieusement. Les détails des combinaisons non résolues sont tracés dans la revue, pas compensés par une valeur métier arbitraire.

<a id="api-pauses"></a>

## Opérations sur les récupérations et points d’arrêt

### Modèle fonctionnel et API

Le modèle logique distingue deux objets de pause : recovery (durée, occurrence source) et breakpoint (position structurelle). La présence explicite n’est pas déduite de la durée. Un identifiant stable permet les opérations idempotentes. L’attachement de recovery à l’occurrence est conservé ; le Point d’arrêt garde ses règles de position structurelle.

postActivityRecoverySeconds devient une projection compatible pour les calculs : durée de recovery si présente,0 sinon. Il n’est pas une seconde source persistée concurrente. Schéma physique et index relèvent du développement. Au main72d1bf4, seules les migrations001..008 existent :009 est le numéro suivant constaté, à revalider à l’ouverture de la tranche, pas une réservation globale. Aucune reprise des séances anciennes n’est demandée dans ce lot de conception.

Déplacer/dupliquer l’occurrence conserve sa récupération explicite et ses paramètres ; supprimer l’occurrence supprime sa récupération. Les règles structurelles des points d’arrêt restent celles de la Composition. Le snapshot copie les pauses effectives ; POST_ACTIVITY_RECOVERY est générée seulement pour recovery positive. Aucune récupération post-exercice en exécution directe. La machine distingue récupération chronométrée et attente au point d’arrêt ; phases existantes réutilisées.

| Opération | Entrée | Résultat et contrat |
|---|---|---|
| Ouvrir le placement | Brouillon Composition | Sous-brouillon isolé, positions autorisées par type |
| Ajouter recovery | Occurrence, durée validée | Objet explicite ; défaut proposé au moment de l’ajout |
| Ajouter breakpoint | Position autorisée | Objet structurel, pas de durée cible |
| Modifier/retirer | Identifiant de pause | Mutation du sous-brouillon/brouillon, aucune sauvegarde prématurée |
| Confirmer/Annuler | Sous-brouillon | Application atomique ou restitution, décompte correct |
| Calculer le total | Plan et séries effectives | exact/estimated/lowerBound/omitted, ou incomplete |
| Exécuter | Snapshot | Séries/pauses/côtés/récupérations/points selon plan, cadence sonore conservée |

Le scalaire historique `ActivityDefinition.pauseSeconds` représente la Pause après chaque série : sa refonte doit porter cette valeur dans chaque `SeriesParameters.pauseSeconds`. Il ne peut pas être remplacé par la collection de pauses de Composition, qui représente récupération/point d’arrêt. Les deux collections et leurs cycles de vie restent distincts.

<a id="api-phrase"></a>

## Contrat du générateur de phrase

### Contrat de génération et persistance

Fonction pure : mêmes paramètres, même locale et même résultat métier donnent les mêmes segments. Retour **`Array<{texte: string, gras: boolean}>`**, jamais une chaîne à redécouper par recherche de valeurs. Le choix du gras appartient au gabarit à l’émission des segments ; deux valeurs identiques restent deux occurrences distinctes. La concaténation des `texte` restitue la phrase exacte. Valeurs et unités paramétrées en gras, texte grammatical normal.

Exemple de début : `[{texte:"3",gras:true},{texte:" séries de ",gras:false},{texte:"30 s",gras:true}]`. React Native rend les segments directement en `<Text>` imbriqués dans un `<Text>` parent. Aucun balisage Markdown à analyser au rendu, aucune recherche/remplacement de sous-chaînes pour le gras.

**Aucune phrase ni aucun segment n’est stocké en base**, dans la définition, l’occurrence ou l’instantané. Seuls les paramètres métier sont persistés ; la phrase se régénère **à chaque affichage**, notamment après validation ✓. ✕ annule le brouillon ; ✓ applique atomiquement au parent ; Terminer persiste ses paramètres. Le retour sur une séance existante utilise la grammaire courante, pas une phrase figée avant correction. Les paramètres et durées réelles historiques restent immuables.

Pendant un brouillon incomplet, aucune cible inventée : conserver les règles de champs manquants/validation et interdire✓. Compte à rebours et Fin sont des lignes séparées, exclus du texte et du total intrinsèque.
