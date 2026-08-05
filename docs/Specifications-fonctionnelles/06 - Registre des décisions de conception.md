# 06 - Registre des décisions

Ce document devient le registre permanent des décisions de conception du produit.

## Format

| ID | Décision | Statut | Intégrée |
|---|---|---|---|

## Décisions validées

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