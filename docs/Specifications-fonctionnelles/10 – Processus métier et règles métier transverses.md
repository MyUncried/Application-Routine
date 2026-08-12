## Création d’une séance

| ID        | Règle                                                                                                                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RM-CR-001 | Le bouton de création ouvre d’abord l’écran de saisie du nom.                                                                                                                                                                              |
| RM-CR-002 | Un nom valide crée la séance et ouvre sa composition initiale de la séance.                                                                                                                                                                |
| RM-CR-003 | La validation de la composition ouvre l’écran des catégories de la séance.                                                                                                                                                                 |
| RM-CR-004 | Les catégories sont facultatives et peuvent être sélectionnées en nombre multiple.                                                                                                                                                         |
| RM-CR-005 | L’action Enregistrer la séance valide les catégories et ramène à Catalogue de séances.                                                                                                                                                     |
| RM-CR-048 | Lorsqu’un Exercice possède une pause après Série, une activité technique de type `Récupération` est liée à l’Exercice et insérée dans le plan après chaque Série. Après la dernière Série, elle est omise si l’étape suivante est une Récupération explicite. Elle n’est pas affichée comme activité autonome dans la composition de la séance. |
| RM-CR-049 | L'archivage d'une Séance supprime toutes les Routines qui lui sont associées ; les occurrences historisées et les Exécutions existantes sont conservées.                                                                                   |
| RM-CR-050 | La restauration d'une Séance archivée ne restaure aucune ancienne Routine ; toute nouvelle planification nécessite la création d'une nouvelle Routine.                                                                                     |

## Gestion des séances

| ID     | Règle                                                                                                          |
| ------ | -------------------------------------------------------------------------------------------------------------- |
| RM-001 | Une séance possède un identifiant unique.                                                                      |
| RM-002 | Le nom d'une séance est obligatoire.                                                                           |
| RM-003 | Une séance peut être active ou archivée.                                                                       |
| RM-004 | Une séance archivée reste conservée.                                                                           |
| RM-005 | La duplication crée une copie indépendante.                                                                    |
| RM-006 | La suppression d'une Routine demande une confirmation explicite dans une modale avant suppression.                         |
| RM-007 | La création d’une séance commence par la saisie obligatoire de son nom.                                        |
| RM-008 | Après validation de la composition, l’utilisateur peut associer zéro, une ou plusieurs catégories à la séance. |
| RM-009 | Une catégorie personnalisée peut être créée depuis l’écran de sélection des catégories de la séance.           |
| RM-019 | Une Catégorie peut être supprimée même si elle est utilisée ; elle est alors retirée des Séances concernées, sans modification des Instantanés historiques. |

## Composition d'une séance

| ID     | Règle                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------ |
| RM-010 | Une séance contient un cycle unique, lui-même composé d'un Set unique et d'activités de fin de cycle éventuelles. |
| RM-011 | Une activité est de type Exercice ou Récupération.                                                                 |
| RM-012 | L'ordre des activités est conservé après toute modification.                                                       |
| RM-013 | Une activité Exercice peut être chronométrée ou basée sur un nombre de répétitions.                                |
| RM-014 | Le Set et le Cycle appartiennent à la Séance conformément au modèle fonctionnel.                       |
| RM-015 | Une activité de type Exercice peut être associée à zéro, une ou plusieurs zones corporelles.                       |
| RM-016 | Une activité de type Récupération ne peut pas être associée à une zone corporelle.                                 |
| RM-017 | La section Zones corporelles est masquée lorsque le type Récupération est sélectionné.                             |
| RM-018 | Les Zones corporelles constituent un référentiel prédéfini de l’application ; l’utilisateur peut les sélectionner mais ne peut ni les créer, ni les modifier, ni les supprimer dans le MVP. |
| RM-024 | Toute Activité de type Exercice possède un nombre de Séries entier supérieur ou égal à 1 ; la valeur par défaut à la création est 1. |
| RM-025 | Une Série correspond à l'exécution de la Durée ou du nombre de Répétitions de l'Exercice, suivie de sa pause éventuelle ; elle n'est pas une entité métier autonome. |
| RM-026 | La pause est exécutée après chaque Série ; après la dernière Série, elle est omise si l'étape suivante du plan d'exécution est une Récupération explicite. |
| RM-027 | Une Activité de type Récupération reçoit par défaut le nom `Récupération`, est toujours chronométrée et se termine automatiquement. |
| RM-028 | Le nombre de répétitions du Set et du Cycle est modifié via un contrôle compact `xN` ouvrant un picker ; les contrôles `+ / −` ne font pas partie de l'UX de référence. |
| RM-029 | La Composition expose un seul bouton global d'ajout d'Activité ; toute nouvelle Activité est ajoutée après la dernière puis peut être réordonnée manuellement. |

## Exécution de séance

| ID     | Règle                                                                                              |
| ------ | -------------------------------------------------------------------------------------------------- |
| RM-020 | Chaque exécution crée une exécution de séance distincte.                                           |
| RM-021 | Une séance est basée sur un instantané de la séance.                                               |
| RM-022 | Les modifications ultérieures d'une séance ou de sa routine ne modifient jamais une séance passée. |
| RM-023 | Une exécution de séance peut être en cours, suspendue, terminée, partielle ou interrompue.                                |
| RM-033 | Pour un Exercice en mode Répétition, le temps actif est un chronomètre croissant ; Pause le suspend et le cercle effectue un tour par minute. |
| RM-034 | En mode Répétition, un bip fixe est émis à chaque minute écoulée dans le MVP. |
| RM-035 | `Activité suivante` termine normalement un Exercice en mode Répétition. Pour une Activité chronométrée utilisée avant son terme, une confirmation est demandée et l'Activité devient `Partielle`. |
| RM-036 | Une occurrence future peut être exécutée en avance depuis `Exécuter maintenant` ; elle n'est ensuite plus proposée à son horaire initial. |
| RM-037 | Une occurrence planifiée passée sans Exécution disparaît de l'interface et n'apparaît pas dans le Suivi du MVP. |

## Préférences

| ID     | Règle                                                                  |
| ------ | ---------------------------------------------------------------------- |
| RM-030 | Les sons sont des préférences globales.                                |
| RM-031 | Les annonces vocales sont des préférences globales.                    |
| RM-032 | Les préférences ne modifient pas la définition d'une séance existante. |

## Historique

| ID     | Règle                                                                                |
| ------ | ------------------------------------------------------------------------------------ |
| RM-040 | L'historique conserve les exécutions de séance terminées, partielles ou interrompues.              |
| RM-041 | Chaque Exécution conserve un Instantané fonctionnel immuable de la Séance utilisée au moment du démarrage, contenant les informations nécessaires à la restitution fidèle de l’historique. |

## Intégrité des Instantanés d’Exécution

| ID | Règle |
| --- | --- |
| **RM-048** | Les médias associés aux Activités ne sont pas copiés dans l’Instantané d’Exécution. |
| **RM-049** | Toute modification, archivage ou suppression ultérieure de la Séance source est sans effet sur les Instantanés déjà enregistrés. |

## Couleur des séances

| ID         | Règle                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **RM-042** | Chaque séance possède une couleur, choisie par l'utilisateur lors de sa création et modifiable à tout moment.                                                                        |
| **RM-043** | La couleur d'une séance est choisie parmi une palette prédéfinie de 16 couleurs.                                                                                                     |
| **RM-044** | Une routine reprend automatiquement la couleur de la séance à laquelle elle est associée. Une routine ne possède pas de couleur indépendante.                                        |
| **RM-045** | La couleur d'une séance peut être utilisée dans le catalogue, le calendrier, le suivi, les indicateurs et les futurs tableaux de bord afin de faciliter son identification visuelle. |
| **RM-046** | La modification de la couleur d'une séance est immédiatement répercutée sur la séance et sur toutes les routines qui lui sont associées.                                             |
| **RM-047** | La couleur de la séance fait partie de l'instantané enregistré avec chaque exécution et est conservée dans l'historique.                                                             |
