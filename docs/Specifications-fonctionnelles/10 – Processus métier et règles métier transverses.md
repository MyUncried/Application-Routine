## Création d’une séance

| ID        | Règle                                                                                  |
| --------- | -------------------------------------------------------------------------------------- |
| RM-CR-001 | Le bouton de création ouvre d’abord l’écran de saisie du nom.                          |
| RM-CR-002 | Un nom valide crée la séance et ouvre sa composition initiale de la séance.            |
| RM-CR-003 | La validation de la composition ouvre l’écran des catégories de la séance.             |
| RM-CR-004 | Les catégories sont facultatives et peuvent être sélectionnées en nombre multiple.     |
| RM-CR-005 | L’action Enregistrer la séance valide les catégories et ramène à Catalogue de séances. |

## Gestion des séances

| ID     | Règle                                                                                                          |
| ------ | -------------------------------------------------------------------------------------------------------------- |
| RM-001 | Une séance possède un identifiant unique.                                                                      |
| RM-002 | Le nom d'une séance est obligatoire.                                                                           |
| RM-003 | Une séance peut être active ou archivée.                                                                       |
| RM-004 | Une séance archivée reste conservée.                                                                           |
| RM-005 | La duplication crée une copie indépendante.                                                                    |
| RM-006 | La suppression d'une routine est immédiate avec possibilité d'annulation via snackbar.                         |
| RM-007 | La création d’une séance commence par la saisie obligatoire de son nom.                                        |
| RM-008 | Après validation de la composition, l’utilisateur peut associer zéro, une ou plusieurs catégories à la séance. |
| RM-009 | Une catégorie personnalisée peut être créée depuis l’écran de sélection des catégories de la séance.           |

## Composition d'une séance

| ID     | Règle                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------ |
| RM-010 | Une séance contient un cycle unique, lui-même composé d'un bloc unique et d'activités de fin de cycle éventuelles. |
| RM-011 | Une activité est de type Exercice ou Récupération.                                                                 |
| RM-012 | L'ordre des activités est conservé après toute modification.                                                       |
| RM-013 | Une activité Exercice peut être chronométrée ou basée sur un nombre de répétitions.                                |
| RM-014 | Le bloc et le cycle sont définis au niveau de la routine conformément au modèle fonctionnel.                       |
| RM-015 | Une activité de type Exercice peut être associée à zéro, une ou plusieurs zones corporelles.                       |
| RM-016 | Une activité de type Récupération ne peut pas être associée à une zone corporelle.                                 |
| RM-017 | La section Zones corporelles est masquée lorsque le type Récupération est sélectionné.                             |
| RM-018 | Une zone corporelle personnalisée peut être créée depuis l’écran de création ou de modification d’une activité.    |

## Exécution de séance

| ID     | Règle                                                                                              |
| ------ | -------------------------------------------------------------------------------------------------- |
| RM-020 | Chaque exécution crée une exécution de séance distincte.                                           |
| RM-021 | Une séance est basée sur un instantané de la séance.                                               |
| RM-022 | Les modifications ultérieures d'une séance ou de sa routine ne modifient jamais une séance passée. |
| RM-023 | Une exécution de séance peut être terminée, suspendue ou partielle.                                |

## Préférences

| ID     | Règle                                                                  |
| ------ | ---------------------------------------------------------------------- |
| RM-030 | Les sons sont des préférences globales.                                |
| RM-031 | Les annonces vocales sont des préférences globales.                    |
| RM-032 | Les préférences ne modifient pas la définition d'une séance existante. |

## Historique

| ID     | Règle                                                                                |
| ------ | ------------------------------------------------------------------------------------ |
| RM-040 | L'historique conserve les exécutions de séance terminées ou partielles.              |
| RM-041 | Chaque exécution conserve l'instantané de la séance utilisée au moment du démarrage. |

## Couleur des séances

| ID         | Règle                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **RM-042** | Chaque séance possède une couleur, choisie par l'utilisateur lors de sa création et modifiable à tout moment.                                                                        |
| **RM-043** | La couleur d'une séance est choisie parmi une palette prédéfinie de 16 couleurs.                                                                                                     |
| **RM-044** | Une routine reprend automatiquement la couleur de la séance à laquelle elle est associée. Une routine ne possède pas de couleur indépendante.                                        |
| **RM-045** | La couleur d'une séance peut être utilisée dans le catalogue, le calendrier, le suivi, les indicateurs et les futurs tableaux de bord afin de faciliter son identification visuelle. |
| **RM-046** | La modification de la couleur d'une séance est immédiatement répercutée sur la séance et sur toutes les routines qui lui sont associées.                                             |
| **RM-047** | La couleur de la séance fait partie de l'instantané enregistré avec chaque exécution et est conservée dans l'historique.                                                             |
