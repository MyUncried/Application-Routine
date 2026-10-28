# Stories B.1 à B.4 — Mouvement autonome, fiche CE-MVT-01 et Catalogue des Mouvements

> Statut : done pour le périmètre stabilisé ; les parties non arrêtées sont différées (§5). Références : DSF Mouvements du 27/10, CE-MVT-01 (ch13), Figma `10415:21706` à `10453:23030` (fiche), `10266:20575` (carte), consultés directement le 27/10.

## 1. B.1 — Services

- `MovementRepository.update` (contenu partagé, identité et groupe conservés) et `createVariant` (création et rattachement atomiques ; un refus n'écrit rien).
- `MovementCatalogueService` : création indépendante, variante plus facile ou plus difficile, décision C03 du Catalogue (Exercices liés comptés une fois chacun, exécutions par identité = 0 avant T04), « Créer un nouveau mouvement » sans rattachement (Q10), familles et rangs dérivés de la famille complète.
- `ActivityDefinitionService.movementCatalogue` : même `MovementRepository`, aucune seconde composition SQLite.

## 2. B.2 — Fiche Mouvement (`/movement`)

- `MovementScreen` (route racine `app/movement.tsx`) : création, variante (`variantOf` + `placement`), consultation, puis édition par le crayon.
- Éditeur commun `ActivityEditorForm`, variante additive `"movement"` (défaut `"exercise"` inchangé) :
  - médias dans le gabarit photo pleine largeur (402 × 329 mis à la largeur du terminal), juste sous la zone de contexte ;
  - Description en étapes ;
  - bloc « Phases du mouvement » (`MovementPhasesEditor`) : libellés et ordre seulement ;
  - aucune carte ni Feuille des paramètres, aucun accordéon Médias.
- **Médias conservés intégralement.** Même `ActivityMediaList` et même import ; seules la taille et la disposition changent (`template`, une page par média). Ajout, consultation et lecture, retrait et réordonnancement (appui long Monter / Descendre, actions VoiceOver) sont inchangés.
- Réutilisés :
  - `useMovementOriginChoice` (R01–R08, unicité C01, « Utiliser ce mouvement », « Créer une variante ») ;
  - feuilles de Catégorie et de Zones ;
  - menu Niveau, avec choix par Mouvement : consulter un autre membre sans reclassement, ou ajouter un niveau ;
  - `MovementLevelsScreen` existant ;
  - `MovementSaveDialog` (C03), garde d'abandon.
- Phases (`movementPhaseList.ts`) : identité stable au renommage et au déplacement ; compteur monotone ; libellés vides non enregistrés. La saisie dans l'invite crée la phase et y déplace le focus.

## 3. B.3 — Catalogue des Mouvements

- Segment « Mouvements » ajouté EN PREMIER dans le Catalogue (relevé Niveaux du 25/10 §7 : « quatrième onglet, placé en premier ») ; Exercices, Séances et Parcours inchangés.
- `MovementCatalogueList` :
  - familles contiguës, pastille « Niveau N » au rang de la famille complète, aucune pastille pour un Mouvement indépendant ;
  - Mouvements sans Exercice listés ;
  - recherche au fil du nom et des alias par `rankMovements` (R02) ;
  - toucher → fiche ; `Créer` → fiche d'un Mouvement nouveau.

## 4. B.4 — Recette automatique

- MVT-01, 02, 05 à 09 : `MovementCatalogueService.b1.test.ts`.
- MVT-01, 04, 05, 06, 09, 10, 11 : `MovementScreen.b2.integration.test.tsx` (services réels, SQLite réelle).
- MVT-03 côté Catalogue et liste : `MovementCatalogueList.b3.test.tsx`.
- Phases : `movementPhaseList.b2.test.ts`.
- Non-régression : suites existantes de l'éditeur, des médias, du Catalogue et de la Composition. Un seul test adapté : le compte des segments du Catalogue (3 → 4).

## 5. Différé ou à clarifier (aucune commande factice affichée)

- **Q-B2 — À CLARIFIER : piles, filtres, tri et actions glissées du Catalogue des Mouvements.** Le DSF du 27/10 (§1) les place « hors de ce lot ». Le DSF Niveaux laisse « navigation depuis une pile » et « effet de la recherche » à spécifier. Le relevé du 25/10 (rang 1 en tête de pile, « 3 niveaux ») contredit le prototype `10266:20575`, `10471:23291` (Niveau 3 en tête). Les sémantiques des filtres (« Avec exercice », Statut) et du tri ne sont pas écrites. Les commandes Filtrer et Trier restent inactives, comme avant.
- **Q-B3 — À CLARIFIER : libellé de la conséquence « Créer un nouveau mouvement » depuis le Catalogue.** DSF §5 : « libellé à adapter », sans texte fourni. En attendant, la conséquence « Uniquement pour cet exercice » est omise dans ce contexte, sans texte inventé.
- C08 (rattachement, détachement, suppression), archivage, restauration, partage : non développés.
- Saisie des alias : aucun écran (non dessiné). Les alias existants sont conservés à l'enregistrement.
- Sélection d'un Mouvement en Composition : Epic C. Elle réutilisera `MovementCatalogueService`, la carte et `useMovementOriginChoice`.
- Rendu (gabarit photo, recouvrement par la zone de contexte, clavier, défilement, safe areas, quatre segments à 360 pt) : contrôle visuel de Hermann sur iPhone.
