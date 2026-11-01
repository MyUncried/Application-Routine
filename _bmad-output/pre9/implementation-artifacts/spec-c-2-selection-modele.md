# C.2 — Sélection du modèle (« Créer »)

Story PRE-9, epic C. Plan : `../planning-artifacts/epics.md` § C.2 (ARB-05). Branche `pre9-bmad/dev`. Figma `G6RY5Ebhgwb4AHIOYDwwvg` en lecture seule : `8598:29271` « P-Composition séance — Modèles ». Aucune migration.

## Sources appliquées

| Source | Passage | Effet |
|---|---|---|
| epics § C.2, ARB-05 | « Grille CE-FMT-01 (entrée `8598:29271`) avec les deux cartes **Exercice** et **Séance**, non fusionnées : Séance ouvre la Composition vide ; Exercice mène, par la sélection d'un Mouvement (parcours Catalogue, ARB-22a), à une Séance contenant ce seul Exercice ; chaque Format ou départ rapide ouvre son écran de paramètres. » | Trois groupes de cartes ; Séance → Composition vide ; Exercice → sélection d'un seul Mouvement → Composition avec cet Exercice ; Format / départ rapide → paramètres (C.3). |
| CE-FMT-01 §3, §8, §12 | Entrée : « Action de création d'une séance depuis les entrées existantes » ; « Distinguer les six Formats et les départs rapides actifs Renforcement, Progression, À l'échec, Superset et Libre ; Gainage · Mobilité retiré (D-25). Conserver les deux cartes de création Exercice / Séance » ; « empêcher une double création par double tap ». | « Créer » du Catalogue des Séances ouvre la grille ; carte Mobilité de Figma non rendue ; verrou de double appui. |
| CE-FMT-01 §5 | « Le nom de la carte n'est pas utilisé comme identifiant métier. » | Clé de carte = origine (`SessionOrigin`, C.1, FMT-02), enregistrée dans le brouillon (`origin`). |
| D-24 | « Libre = Séance libre. » | La carte Séance est le départ Libre (aucune carte Libre distincte dans Figma). |

## Réalisé

- `SessionModelScreen.tsx` (nouveau), route `(creation)/session-model` : en-tête fixe « Créer » avec Fermer ; grille de trois colonnes adaptée à la largeur (110 × 106 à 402 pt, rayon 20, bandes de motif 46 de Figma, en vues natives ; motif For time : SVG exporté de Figma, `assets/models/`) ; défilement vertical.
- Brouillon vierge à l'ouverture de la grille ; `composition` reçoit `keepDraft` pour reprendre ce brouillon.
- Carte Exercice : sélection des Mouvements en mode `single` (un seul Mouvement retenu), puis la Composition remplace la sélection et ajoute l'Exercice (`useMovementExerciseIntake`, paramètres ouverts comme pour « Utiliser un mouvement existant »).
- `CatalogueScreen` : « Créer » (segment Séances) ouvre « Créer » au lieu de la Composition [PRE-8 E.4 : « Créer ouvre directement la Composition existante » — remplacé par CE-FMT-01 §3 / C.2].
- `fr.ts` : `sessionModels` (titres et sous-titres des cartes, textes de Figma).

## Écarts et choix

- Barre de navigation inférieure de la maquette non rendue : la grille appartient au parcours de création (pile `(creation)`, sans onglets), comme la Composition.
- Figma montre la carte « Mobilité » : retirée (D-25). Le groupe des départs rapides compte quatre cartes.

## Synchronisation documentaire

Classe **A** (CE-FMT-01, ARB-05, D-24, D-25). Formulation contraire du code PRE-8 E.4 annotée dans le commentaire du Catalogue ; aucune spécification modifiée.

## Tests

`__tests__/SessionModelScreen.c2.test.tsx` : groupes et ordre, Mobilité absente, Séance, Exercice (sélection unique), Format → paramètres, double appui.
