# Spec Delta

## Purpose

Décrire comment une spécification produit validée hors du dépôt est intégrée à la documentation fonctionnelle KODJO. Cette capacité ne contient aucune règle produit : les règles intégrées ont leur seule source normative dans les chapitres 01 à 13 et, pour le rendu, dans les DSF et Figma.

## ADDED Requirements

### Requirement: Source normative unique des règles intégrées
Chaque décision de la spécification intégrée MUST être énoncée dans un seul emplacement normatif des chapitres 01 à 13. Les autres chapitres, contrats et DSF MUST la citer par son identifiant ou par un lien, sans la reformuler. Le dossier du change MUST NOT devenir une source normative.

#### Scenario: Règle citée par un contrat d’écran
- **WHEN** un contrat d’écran applique une règle intégrée
- **THEN** il cite l’identifiant de la règle (RM-xxx ou D-xxx) et ne recopie pas son énoncé

#### Scenario: Copie de la spécification dans le change
- **WHEN** la spécification source est conservée dans le dossier du change
- **THEN** elle est présentée comme pièce de traçabilité, et la documentation principale ne la cite pas comme référence normative

### Requirement: Remplacement explicite des prescriptions contraires
Une prescription existante contredite par une décision intégrée MUST être remplacée par une décision du registre qui nomme la décision ou la règle remplacée et le point remplacé. Le texte d’origine d’une décision remplacée MUST rester lisible dans le registre avec l’indication de ce qui la remplace.

#### Scenario: Ancienne prescription d’interface
- **WHEN** un passage d’un chapitre prescrit un comportement remplacé
- **THEN** le passage est mis à jour en citant la nouvelle décision, et la décision d’origine reste au registre avec la mention « remplacée par »

#### Scenario: Règle existante non contredite
- **WHEN** une règle existante (calcul, séries, pauses, enchaînements, validation) n’est pas contredite par la spécification
- **THEN** elle reste inchangée et la règle intégrée la cite

### Requirement: Exclusion des variantes non retenues
Les propositions abandonnées, variantes intermédiaires et propositions non arbitrées désignées par la spécification MUST NOT être intégrées comme règles.

#### Scenario: Variante remplacée
- **WHEN** la spécification signale qu’une option a été ajoutée puis retirée
- **THEN** la documentation ne la décrit pas comme choix utilisateur

### Requirement: Couverture tracée hors documentation principale
Chaque décision et scénario de la spécification MUST figurer dans une matrice de couverture tenue dans le change, avec son emplacement documentaire et un statut parmi intégré, partiel et restant, et la raison de tout statut autre qu’intégré.

#### Scenario: Décision dépendant d’une PR non fusionnée
- **WHEN** une décision porte sur un élément introduit par une PR ouverte
- **THEN** la matrice la marque partielle, cite la PR et indique ce qui reste à appliquer après sa fusion

### Requirement: Séparation entre comportement et rendu Figma
Les frames Figma citées par la spécification MUST être vérifiées en lecture seule. Un écart entre Figma et une décision MUST être signalé dans le rapport, sans modifier Figma et sans transformer l’écart en règle.

#### Scenario: Libellé erroné dans une frame
- **WHEN** une frame affiche un libellé différent du libellé décidé
- **THEN** la documentation porte le libellé décidé et le rapport consigne l’écart Figma avec l’identifiant de la frame
