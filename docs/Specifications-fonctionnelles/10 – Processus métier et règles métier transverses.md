## Création d’une routine

| ID | Règle |
|---|---|
| RM-CR-001 | Le bouton de création ouvre d’abord l’écran de saisie du nom. |
| RM-CR-002 | Un nom valide crée la routine et ouvre sa composition initiale. |
| RM-CR-003 | La validation de la composition ouvre l’écran des catégories de la routine. |
| RM-CR-004 | Les catégories sont facultatives et peuvent être sélectionnées en nombre multiple. |
| RM-CR-005 | L’action Enregistrer la routine valide les catégories et ramène à Mes routines. |

## Gestion des routines

| ID | Règle |
|---|---|
| RM-001 | Une routine possède un identifiant unique. |
| RM-002 | Le nom d'une routine est obligatoire. |
| RM-003 | Une routine peut être active ou archivée. |
| RM-004 | Une routine archivée reste conservée. |
| RM-005 | La duplication crée une copie indépendante. |
| RM-006 | La suppression d'une routine est immédiate avec possibilité d'annulation via snackbar. |
| RM-007 | La création d’une routine commence par la saisie obligatoire de son nom. |
| RM-008 | Après validation de la composition, l’utilisateur peut associer zéro, une ou plusieurs catégories à la routine. |
| RM-009 | Une catégorie personnalisée peut être créée depuis l’écran de sélection des catégories de la routine. |

## Composition

| ID | Règle |
|---|---|
| RM-010 | Une routine contient une liste ordonnée d'éléments. |
| RM-011 | Un élément est une activité ou une pause. |
| RM-012 | L'ordre des éléments est conservé après toute modification. |
| RM-013 | Une activité manuelle affiche « Manuel » pendant l'exécution. |
| RM-014 | Les séries et les cycles sont définis au niveau de la routine conformément au modèle fonctionnel. |
| RM-015 | Une activité de type Exercice peut être associée à zéro, une ou plusieurs zones corporelles. |
| RM-016 | Une activité de type Pause ou Récupération ne peut pas être associée à une zone corporelle. |
| RM-017 | La section Zones corporelles est masquée lorsque le type Pause ou Récupération est sélectionné. |
| RM-018 | Une zone corporelle personnalisée peut être créée depuis l’écran de création ou de modification d’une activité. |

## Exécution

| ID | Règle |
|---|---|
| RM-020 | Chaque exécution crée une séance distincte. |
| RM-021 | Une séance est basée sur un instantané de la routine. |
| RM-022 | Les modifications ultérieures d'une routine ne modifient jamais une séance passée. |
| RM-023 | Une séance peut être terminée, interrompue ou abandonnée. |

## Préférences

| ID | Règle |
|---|---|
| RM-030 | Les sons sont des préférences globales. |
| RM-031 | Les annonces vocales sont des préférences globales. |
| RM-032 | Les préférences ne modifient pas la définition d'une routine existante. |

## Historique

| ID | Règle |
|---|---|
| RM-040 | L'historique conserve les séances terminées. |
| RM-041 | Une séance conserve la définition exécutée au moment du démarrage. |
