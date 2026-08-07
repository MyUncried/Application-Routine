
Ce document devient le registre permanent des décisions de conception du produit.

# Format

| ID  | Décision | Statut | Intégrée |
| --- | -------- | ------ | -------- |

# Décisions validées

| ID    | Décision                                                                                                                        | Statut  | Intégrée |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | ------- | -------- |
| D-001 | Archivage inclus dans le MVP                                                                                                    | Validée | Oui      |
| D-002 | Planification reportée en V2                                                                                                    | Validée | Oui      |
| D-004 | Valeurs par défaut : compte à rebours initial 10 s, fin de routine 0 s                                                          | Validée | Oui      |
| D-005 | Les préférences du profil servent de valeurs par défaut des nouvelles routines                                                  | Validée | Oui      |
| D-006 | Les activités manuelles font partie du MVP                                                                                      | Validée | Oui      |
| D-007 | Les activités manuelles enregistrent leur durée réelle                                                                          | Validée | Oui      |
| D-008 | Les temps estimés utilisent le symbole ≈ lorsqu'une activité manuelle est présente                                              | Validée | Oui      |
| D-011 | La synthèse n'affiche plus les Séries/Cycles                                                                                    | Validée | Oui      |
| D-012 | Les séries et les cycles sont des structures internes de la routine et ne constituent pas des entités métier autonomes.         | Validée | Oui      |
| D-013 | Les occurrences du calendrier sont calculées à partir des planifications et ne sont pas persistées en V1.                       | Validée | Oui      |
| D-014 | Une entité Utilisateur est introduite dès la V1 avec une seule instance locale.                                                 | Validée | Oui      |
| D-015 | Les catégories sont associées aux routines ; une routine peut appartenir à plusieurs catégories.                                | Validée | Oui      |
| D-016 | Les zones corporelles sont associées aux activités de type Exercice ; elles constituent un référentiel distinct des catégories. | Validée | Oui      |
| D-017 | Le plan d'exécution est une structure interne calculée au démarrage d'une séance et ne constitue pas une entité métier.         | Validée | Oui      |
| D-018 | Le compte à rebours initial est représenté comme une étape d'exécution à part entière.                                          | Validée | Oui      |
| D-019 | La fin de routine est un événement déclenché après la dernière étape et non une étape d'exécution.                              | Validée | Oui      |
| D-020 | Les concepts métier définitifs sont : Séance, Routine, Activité, Bloc et Cycle. Les séries restent une notion d'exécution et ne constituent pas une entité métier. | Validée | Oui |
| D-021 | Une routine est une planification d'une séance. Une séance peut être utilisée par plusieurs routines. | Validée | Oui |
| D-022 | Les exceptions de planification (modifier une seule occurrence) sont exclues du MVP. Toute modification s'effectue sur la routine. | Validée | Oui |
| D-023 | Les routines peuvent être activées ou désactivées. Les routines désactivées sont masquées par défaut dans le calendrier. | Validée | Oui |
| D-024 | La couleur est un attribut de la séance. Les routines héritent automatiquement de cette couleur et ne possèdent pas de couleur propre. | Validée | Oui |
| D-025 | La couleur de la séance est conservée dans l'instantané enregistré lors de chaque exécution afin de préserver l'historique. | Validée | Oui |
| D-026 | La création d'une séance nécessite obligatoirement un nom et une couleur sélectionnée dans une palette prédéfinie. | Validée | Oui |
| D-027 | Le détail d'une séance exécutée est consulté directement dans la liste du Suivi grâce à une vue déployée ; aucun écran dédié n'est prévu pour le MVP. | Validée | Oui |
| D-028 | L'écran d'exécution ne comporte que trois commandes : Réinitialiser, Pause/Reprendre et Activité suivante. L'arrêt d'une séance est accessible uniquement depuis l'état Pause. | Validée | Oui |
| D-029 | La réinitialisation d'une activité est immédiate et ne demande pas de confirmation. | Validée | Oui |
| D-030 | Le passage à l'activité suivante demande une confirmation avant interruption de l'activité en cours. | Validée | Oui |
| D-031 | Les séances exécutées peuvent être recherchées, triées, filtrées et affichées sous forme condensée ou déployée directement depuis l'écran Suivi. | Validée | Oui |
