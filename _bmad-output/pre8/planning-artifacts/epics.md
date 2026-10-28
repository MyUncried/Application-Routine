# PRE-8 — Epics A et B : stories et dépendances

> Autorisation de Hermann du 27/10/2026 (« PRE-8 — Autorisation de développement des epics A et B »). Base : `main` @ `082390c0` (PR #401). Périmètre de cette autorisation : **epics A et B seulement**. Les epics C (Composition), D (reprise d'une Séance), E (Catalogue unique des Séances) et les formats spécialisés ne sont pas commencés.

## 0. Rapprochement avec le cadrage

- **Aucun artefact BMAD PRE-8 antérieur.** Rien n'a été trouvé dans git (toutes les branches), sur disque (`C:\Dev`) ni dans les Issues et PR GitHub. Le découpage repris est donc celui du prompt d'autorisation (epics A à E). Ce fichier ne crée pas de plan concurrent : il détaille seulement les stories A et B et leurs dépendances.
- **Sources.** D-449 (`docs/KODJO-Seance-Objet-Unique-Decisions-2026-10-26.md`), DSF Mouvements (`docs/DSF-MOUVEMENTS-CREATION-EDITION-2026-10-27.md`), CE-MVT-01 (ch13), ch06, ch09, ch12, D-445 à D-449, v7 R01–R08, C03, Figma `G6RY5Ebhgwb4AHIOYDwwvg` page `510:101`.
- **Code livré (PRE-7, `main`).** Le Mouvement partagé existe déjà : schéma 013, nom unique, alias, phases à identité stable, groupes de Niveaux, recherche R02 à R07, C03 (`movementSave.ts`) et dialogue de sauvegarde. L'occurrence de Séance référence directement le Mouvement. Restent hors cible D-449 : la Séance à **Cycle technique unique et Circuit unique** (`cycles`/`tours` contraints à une ligne) ; le **Catalogue autonome des Exercices** (`activity_definitions`, segment Exercices du Catalogue) ; **l'absence de fiche et de Catalogue des Mouvements autonomes**.

## Epic A — Modèle et fondations techniques

| Story | Objet | Dépend de |
|---|---|---|
| A.1 | Analyse d'impact D-449 et conception du schéma 014 (exigée par ch09 et ch12) | — |
| A.2 | Domaine : structure générale de composition (Exercices, Circuits, Cycles de Circuits, plusieurs Cycles successifs, sans imbrication), validation, comptes D-449 §6, durée, projection compatible avec l'interface actuelle | A.1 |
| A.3 | Migration 014 : conversion sans perte des Séances existantes, Points d'arrêt compris ; Exercices du Catalogue conservés intacts ; test sur copie de base | A.1, A.2 |
| A.4 | Repository et services : lecture et écriture de la structure générale, conservation des identités, références aux Mouvements intègres ; l'interface actuelle inchangée | A.2, A.3 |

**Non inclus dans A (dépendances d'autres epics) :**
- Conversion des Exercices du Catalogue (`activity_definitions`) en Séances à un exercice et retrait du segment Exercices : **Epic E**. La conversion demande un titre de Séance ; c'est le point **À CLARIFIER Q-E1**.
- Interface de composition multi-Circuits ou multi-Cycles, règles RM-219, RM-251 et D-442 des Points d'arrêt hors du cas à Circuit unique : **Epic C**.
- Reprise de composition : **Epic D**.
- Planification et lancement : aucun code (modules `planning`, `execution` et `history` vides). Rien n'est à adapter ; la règle « on lance une Séance » s'applique au futur moteur.
- Levée du nombre de séries imposé par un Circuit de Séries, ou déplacement du format vers le Circuit : **non autorisé**.

## Epic B — Gestion des Mouvements et Catalogue

| Story | Objet | Dépend de |
|---|---|---|
| B.1 | Services du Mouvement autonome : création indépendante (sans groupe, pastille « Niveau »), variante explicite (groupe créé au deuxième membre), modification par C03 dans le contexte Catalogue (exercices liés comptés une fois, sans objet édité), aucun Exercice créé | A.4 (comptage) |
| B.2 | Fiche Mouvement CE-MVT-01 : gabarit photo derrière le contexte, médias conservés intégralement, description en étapes, structure des phases sans durées, consultation puis crayon, recherche R01–R08, unicité, variante, menu Niveau (consultation d'un autre membre, ajout de niveau), brouillon et abandon, MVT-01 à MVT-11 | B.1 |
| B.3 | Catalogue des Mouvements : accès, liste, recherche, familles et rangs dérivés de la famille complète ; parties dont les règles sont arrêtées dans les 11 états Figma ; commandes non arrêtées non présentées | B.1, B.2 |
| B.4 | Recette automatique et non-régression : MVT-01 à MVT-11, R07, unicité, C03, phases, Niveaux, médias | B.1 à B.3 |
| B.5 | Piles et déploiement (Q-B2 : rang le plus haut en tête ; pile dépliée au toucher ; recherche en piles) | B.3 |
| B.6 | Création de variante par action glissée (Partager grisé, Archiver) | B.2, B.5 |
| B.7 | Filtres et recherche combinés (Q1, Q2, Q4, Q3 définitif) | B.5 |
| B.8 | Archivage, restauration, suppression définitive (Q5 à Q8, Q6 côté création) ; migration 015 additive | B.1, B.5 |
| B.10 | Second passage de la recette iPhone A/B du 27/10 (lot A/B, sans nouvel epic) : titres d'écran Medium 17, piles filtrées, rangs recalculés après archivage, saisie et nom déjà utilisé dans la fiche, menu Niveau, niveaux archivés signalés, réordonnancement visible, compteur de médias ; hors périmètre : fiche Mouvement dans la Composition, alias | B.9 |
| B.11 | Corrections après le second passage (lot A/B, sans nouvel epic) : clavier de la fiche Mouvement, feuille des filtres au format standard, bouton de lecture vidéo, passages de recette 3 à 6 | B.10 |
| B.9 | Corrections de la recette iPhone A/B du 27/10 (lot A/B, sans nouvel epic) : marge standard 16 (A01), titres (A02), cartes et piles (B01–B12, réordonnancement par appui long), nouveau Niveau (C01–C02), zone de contexte et filtres (D01–D07), navigation à cinq destinations (E01), fiche Mouvement (F01–F07, ouverture directe en édition) | B.2 à B.8 |

**Hors B (règles ouvertes ou autres epics) :**
- C08 (rattachement, détachement) et partage ; tri (aucune règle). Archivage, restauration et suppression : livrés en B.8 (arbitrages du 27/10).
- Réordonnancement des familles hors du parcours existant `MovementLevelsScreen` [recette A/B B08 du 27/10 : réordonnancement des Niveaux d’une famille par appui long dans une pile déployée, livré en B.9 ; l’ordre des familles entre elles reste hors périmètre].
- Sélection d'un Mouvement en Composition : **Epic C**. Elle réutilisera les services et cartes de B.

## Clôture des epics A et B (27/10/2026)

Recette iPhone validée par Hermann le 27/10/2026 ; résultats des deux epics validés. Les stories A.1 à A.4 et B.1 à B.11 sont `done`. Code recetté : `88c2adde` sur `pre8-bmad/dev` (base `main` @ `082390c0`), non fusionné dans `main`. Limites connues : `implementation-artifacts/sprint-status.yaml`, rubrique `deferred`. **Correctif ultérieur du lot B (28/10, `77990e7d`)** : b8-3 confirmé par Hermann (option A) ; la fiche Mouvement est alignée sur les rangs des actifs du Catalogue ; corrections à porter sur `main` répertoriées dans `integration-documentaire-main.md`.

## Epic E — Catalogue unifié des Séances (préparation du 27/10/2026)

Plan, stories E.1 à E.8, dépendances, réserves Figma F-01 à F-05 et arbitrages Q-E0 à Q-E6 : `epic-e-catalogue-seances.md`. **Approuvé par Hermann le 28/10 (arbitrages finaux), sauf l'emplacement du point d'entrée de E.8-a ; développement dans une nouvelle session.** Le découpage initial de E (conversion des Exercices du Catalogue, Q-E1) devient la story conditionnelle E.8.

## Points À CLARIFIER (sans blocage de A et B)

- **Q-B2 (Epic B).** Piles, filtres, tri et actions glissées du Catalogue des Mouvements : règles non arrêtées (DSF §1, DSF Niveaux), relevé et prototype contradictoires sur la carte du dessus. **Tranché le 27/10 (Hermann)** : le rang le plus haut en tête de pile ; puis navigation, recherche, actions glissées, filtres et archives (Q1 à Q8, Q3 définitif), livrés en B.5 à B.8. Le tri reste grisé (aucune règle).
- **Q-B3 (Epic B).** Libellé de la conséquence de « Créer un nouveau mouvement » depuis le Catalogue (DSF §5). **Tranché le 27/10 (Hermann)** : aucun texte ; c'est un Mouvement nouveau sans lien.
- **Q-E1 (Epic E).** Titre d'une Séance issue de la conversion d'un Exercice du Catalogue existant (le nom du Mouvement ? un autre titre ?). Les données restent conservées intactes en attendant. **Tranché le 27/10 (Hermann)** : titre du premier Exercice de la Séance ; application dans l'Epic E.
