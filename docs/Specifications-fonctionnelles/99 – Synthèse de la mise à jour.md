# Synthèse de la mise à jour après finalisation des écrans du MVP

Date de consolidation : 3 août 2026.

## Objet

Cette note résume les modifications apportées à la documentation après la finalisation des principaux wireframes Figma. Elle ne remplace pas les notes fonctionnelles ; elle facilite leur relecture.

## Notes modifiées

| Note | Principales modifications |
|---|---|
| `00 – Vision Générale` | Planification et suivi intégrés au MVP ; navigation à quatre onglets ; catégories d’étapes ; adaptation iOS/Android et paysage reporté. |
| `01 – Utilisateurs et besoins` | Besoin de tags multiples et personnalisés ; préférences globales ; programmation simple et suivi inclus dans le MVP. |
| `02 – Parcours utilisateur` | Sélection des catégories lors de l’ajout d’une étape ; modification d’une planification depuis l’Agenda ; nouveaux parcours Agenda, Suivi et Profil. |
| `03 – Modèle fonctionnel` | Définition du modèle de tags ; liste des catégories standards ; règles d’affichage et questions de gestion ; accès à la programmation depuis l’Agenda. |
| `04 – Versions du produit` | V1/MVP étendue à la planification, à l’Agenda, au Suivi, au Profil et aux catégories ; V3 recentrée sur la programmation avancée, les comptes et la synchronisation. |
| `05 – Écrans et navigation de la V1` | Navigation à quatre onglets ; remplacement de l’onglet Historique par Suivi ; ajout des écrans Agenda, Planification et Profil ; règles visuelles transversales ; catégories ; adaptation aux appareils. |
| `06 – Décisions et questions ouvertes` | Suppression des décisions devenues obsolètes ; consolidation des décisions Figma ; liste des règles à finaliser avant développement ; périmètre du prototype Figma. |

## Décisions majeures consolidées

- navigation principale : `Mes routines`, `Agenda`, `Suivi`, `Profil` ;
- Agenda disponible en vues semaine et mois ;
- toucher une routine planifiée ouvre son écran de planification ;
- catégories facultatives, multiples, standards ou personnalisées ;
- états sélectionnés en bleu ;
- `Son` et `Annonces vocales` sont des valeurs par défaut modifiables pour chaque routine ;
- `Vibration` est un réglage binaire ;
- aucune heure de rappel globale dans le Profil ;
- titres d’écran en 24 px et alignés à gauche ;
- boutons de validation et de fermeture en noir ;
- conception adaptative pour iOS et Android ;
- variante paysage de l’exécution reportée.

## Points encore à préciser avant développement

La maquette définit maintenant l’essentiel de l’interface, mais certaines règles doivent encore être arrêtées : programmation et récurrence, notifications, calculs du Suivi, cycle de vie des tags personnalisés, états vides et erreurs, comportement du chronomètre en arrière-plan et règles d’accessibilité.

Ces points sont détaillés dans `06 – Décisions et questions ouvertes`.


## v13
- Consolidation du chapitre 08.
- Création de routine : nom obligatoire avant création.
- Correction de la table des matières (séries et cycles).
- Revue qualité marquée consolidée.
