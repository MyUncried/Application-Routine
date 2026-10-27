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

**Hors B (règles ouvertes ou autres epics) :**
- C08 (rattachement, détachement, suppression) ; archivage, restauration et partage.
- Réordonnancement des familles hors du parcours existant `MovementLevelsScreen`.
- Sélection d'un Mouvement en Composition : **Epic C**. Elle réutilisera les services et cartes de B.

## Points À CLARIFIER (sans blocage de A et B)

- **Q-B2 (Epic B).** Piles, filtres, tri et actions glissées du Catalogue des Mouvements : règles non arrêtées (DSF §1, DSF Niveaux), relevé et prototype contradictoires sur la carte du dessus. Non développés.
- **Q-B3 (Epic B).** Libellé de la conséquence de « Créer un nouveau mouvement » depuis le Catalogue (DSF §5). Omis en attendant.
- **Q-E1 (Epic E).** Titre d'une Séance issue de la conversion d'un Exercice du Catalogue existant (le nom du Mouvement ? un autre titre ?). Les données restent conservées intactes en attendant.
